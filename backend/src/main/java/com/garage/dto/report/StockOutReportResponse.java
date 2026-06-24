package com.garage.dto.report;

import com.garage.model.StockTransaction;
import java.time.LocalDateTime;

public class StockOutReportResponse {
    private Long id;
    private String partNumber;
    private String partName;
    private Integer quantity;
    private String note;
    private String createdByName;
    private LocalDateTime createdAt;

    public static StockOutReportResponse fromEntity(StockTransaction tx) {
        StockOutReportResponse response = new StockOutReportResponse();
        response.setId(tx.getId());
        response.setPartNumber(tx.getPart().getPartNumber());
        response.setPartName(tx.getPart().getName());
        response.setQuantity(tx.getQuantity());
        response.setNote(tx.getNote());
        response.setCreatedByName(tx.getCreatedBy().getFullName());
        response.setCreatedAt(tx.getCreatedAt());
        return response;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getPartNumber() { return partNumber; }
    public void setPartNumber(String partNumber) { this.partNumber = partNumber; }
    public String getPartName() { return partName; }
    public void setPartName(String partName) { this.partName = partName; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public String getCreatedByName() { return createdByName; }
    public void setCreatedByName(String createdByName) { this.createdByName = createdByName; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
