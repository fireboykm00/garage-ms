package com.garage.dto.report;

import java.time.LocalDate;
import java.util.Date;

public class AggregatedStockInEntry {
    private String partNumber;
    private String partName;
    private long totalQuantity;
    private LocalDate date;

    public AggregatedStockInEntry(String partNumber, String partName, Long totalQuantity, Date date) {
        this.partNumber = partNumber;
        this.partName = partName;
        this.totalQuantity = totalQuantity == null ? 0 : totalQuantity;
        this.date = date instanceof java.sql.Date ? ((java.sql.Date) date).toLocalDate() : new java.sql.Date(date.getTime()).toLocalDate();
    }

    public String getPartNumber() { return partNumber; }
    public String getPartName() { return partName; }
    public long getTotalQuantity() { return totalQuantity; }
    public LocalDate getDate() { return date; }
}
