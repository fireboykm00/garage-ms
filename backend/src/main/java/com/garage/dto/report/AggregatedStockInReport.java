package com.garage.dto.report;

import java.time.LocalDate;
import java.util.List;

public class AggregatedStockInReport {
    private LocalDate date;
    private List<AggregatedStockInEntry> entries;
    private long dailyTotal;

    public AggregatedStockInReport(LocalDate date, List<AggregatedStockInEntry> entries) {
        this.date = date;
        this.entries = entries;
        this.dailyTotal = entries.stream().mapToLong(AggregatedStockInEntry::getTotalQuantity).sum();
    }

    public LocalDate getDate() { return date; }
    public List<AggregatedStockInEntry> getEntries() { return entries; }
    public long getDailyTotal() { return dailyTotal; }
}
