package com.garage.dto.stock;

import com.garage.model.StockTransaction;
import com.garage.model.enums.TransactionSourceType;
import com.garage.model.enums.TransactionType;
import java.time.LocalDateTime;

public class StockTransactionResponse {
    private Long id;
    private Long partId;
    private String partNumber;
    private String partName;
    private TransactionType type;
    private Integer quantity;
    private String note;
    private TransactionSourceType sourceType;
    private String sourceId;
    private String createdByName;
    private LocalDateTime createdAt;

    public static StockTransactionResponse fromEntity(StockTransaction tx) {
        StockTransactionResponse response = new StockTransactionResponse();
        response.setId(tx.getId());
        response.setPartId(tx.getPart().getId());
        response.setPartNumber(tx.getPart().getPartNumber());
        response.setPartName(tx.getPart().getName());
        response.setType(tx.getType());
        response.setQuantity(tx.getQuantity());
        response.setNote(tx.getNote());
        response.setSourceType(tx.getSourceType());
        response.setSourceId(tx.getSourceId());
        response.setCreatedByName(tx.getCreatedBy().getFullName());
        response.setCreatedAt(tx.getCreatedAt());
        return response;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getPartId() { return partId; }
    public void setPartId(Long partId) { this.partId = partId; }
    public String getPartNumber() { return partNumber; }
    public void setPartNumber(String partNumber) { this.partNumber = partNumber; }
    public String getPartName() { return partName; }
    public void setPartName(String partName) { this.partName = partName; }
    public TransactionType getType() { return type; }
    public void setType(TransactionType type) { this.type = type; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public TransactionSourceType getSourceType() { return sourceType; }
    public void setSourceType(TransactionSourceType sourceType) { this.sourceType = sourceType; }
    public String getSourceId() { return sourceId; }
    public void setSourceId(String sourceId) { this.sourceId = sourceId; }
    public String getCreatedByName() { return createdByName; }
    public void setCreatedByName(String createdByName) { this.createdByName = createdByName; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
