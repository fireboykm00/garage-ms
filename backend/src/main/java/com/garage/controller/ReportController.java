package com.garage.controller;

import com.garage.dto.report.AggregatedStockOutReport;
import com.garage.dto.report.RemainingStockResponse;
import com.garage.dto.report.StockOutReportResponse;
import com.garage.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {
    private final ReportService reportService;

    @GetMapping("/stock-out")
    public ResponseEntity<List<StockOutReportResponse>> getStockOutReport() {
        return ResponseEntity.ok(reportService.getStockOutReport());
    }

    @GetMapping("/stock-out/aggregated")
    public ResponseEntity<List<AggregatedStockOutReport>> getAggregatedStockOutReport() {
        return ResponseEntity.ok(reportService.getAggregatedStockOutReport());
    }

    @GetMapping("/remaining-stock")
    public ResponseEntity<List<RemainingStockResponse>> getRemainingStockReport() {
        return ResponseEntity.ok(reportService.getRemainingStockReport());
    }

    @GetMapping(value = "/remaining-stock/csv", produces = "text/csv")
    public ResponseEntity<String> getRemainingStockCsv() {
        String csv = reportService.getRemainingStockCsv();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=remaining-stock.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }

    @GetMapping(value = "/stock-out/csv", produces = "text/csv")
    public ResponseEntity<String> getStockOutCsv() {
        String csv = reportService.getStockOutCsv();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=stock-out.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }
}
