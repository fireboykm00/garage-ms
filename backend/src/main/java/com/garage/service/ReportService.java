package com.garage.service;

import com.garage.dto.report.AggregatedStockOutReport;
import com.garage.dto.report.AggregatedStockOutEntry;
import com.garage.dto.report.RemainingStockResponse;
import com.garage.dto.report.StockOutReportResponse;
import com.garage.model.enums.TransactionType;
import com.garage.repository.PartRepository;
import com.garage.repository.StockTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {
    private final StockTransactionRepository stockTransactionRepository;
    private final PartRepository partRepository;

    public List<StockOutReportResponse> getStockOutReport() {
        return stockTransactionRepository.findByTypeOrderByCreatedAtDesc(TransactionType.OUT).stream()
                .map(StockOutReportResponse::fromEntity).toList();
    }

    public List<RemainingStockResponse> getRemainingStockReport() {
        return partRepository.findAll().stream()
                .map(p -> {
                    Long sum = stockTransactionRepository.sumOutQuantityByPartId(p.getId());
                    return RemainingStockResponse.fromEntity(p, sum != null ? sum : 0L);
                })
                .toList();
    }

    public List<AggregatedStockOutReport> getAggregatedStockOutReport() {
        List<AggregatedStockOutEntry> entries = stockTransactionRepository.findAggregatedStockOutReport();
        Map<java.time.LocalDate, List<AggregatedStockOutEntry>> grouped = entries.stream()
                .collect(Collectors.groupingBy(AggregatedStockOutEntry::getDate,
                         TreeMap::new, Collectors.toList()));
        return grouped.entrySet().stream()
                .map(e -> new AggregatedStockOutReport(e.getKey(), e.getValue()))
                .toList();
    }

    public String getRemainingStockCsv() {
        List<RemainingStockResponse> data = getRemainingStockReport();
        StringBuilder sb = new StringBuilder();
        sb.append("ITEM NO.,OUR PART NUMBER,PART NUMBER,DESCRIPTION,MODELS,MANUFACTURER,STOCK,QUANTITY,STOCK OUT\n");
        int i = 1;
        for (RemainingStockResponse r : data) {
            sb.append(i++).append(",");
            sb.append(escapeCsv(r.getOurPartNumber())).append(",");
            sb.append(escapeCsv(r.getPartNumber())).append(",");
            sb.append(escapeCsv(r.getName())).append(",");
            sb.append(escapeCsv(r.getModel())).append(",");
            sb.append(escapeCsv(r.getManufacturer())).append(",");
            sb.append(escapeCsv(r.getStockName())).append(",");
            sb.append(r.getCurrentQuantity()).append(",");
            sb.append(r.getStockOut()).append("\n");
        }
        return sb.toString();
    }

    public String getStockOutCsv() {
        List<StockOutReportResponse> data = getStockOutReport();
        StringBuilder sb = new StringBuilder();
        sb.append("Part Number,Description,Quantity Removed,Note,Recorded By,Date\n");
        for (StockOutReportResponse r : data) {
            sb.append(escapeCsv(r.getPartNumber())).append(",");
            sb.append(escapeCsv(r.getPartName())).append(",");
            sb.append(r.getQuantity()).append(",");
            sb.append(escapeCsv(r.getNote())).append(",");
            sb.append(escapeCsv(r.getCreatedByName())).append(",");
            sb.append(r.getCreatedAt() != null ? r.getCreatedAt().toString() : "").append("\n");
        }
        return sb.toString();
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
