package com.garage.dto.report;

import java.time.LocalDate;
import java.util.List;

public class AggregatedStockOutReport {
    private LocalDate date;
    private List<AggregatedStockOutEntry> entries;
    private long dailyTotal;

    public AggregatedStockOutReport(LocalDate date, List<AggregatedStockOutEntry> entries) {
        this.date = date;
        this.entries = entries;
        this.dailyTotal = entries.stream().mapToLong(AggregatedStockOutEntry::getTotalQuantity).sum();
    }

    public LocalDate getDate() { return date; }
    public List<AggregatedStockOutEntry> getEntries() { return entries; }
    public long getDailyTotal() { return dailyTotal; }
}
