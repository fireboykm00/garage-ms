package com.garage.dto.job;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class ReplacePartRequest {
    @NotNull
    private Long newPartId;

    @NotNull
    @Positive
    private Integer quantity;

    public ReplacePartRequest() {}

    public Long getNewPartId() { return newPartId; }
    public void setNewPartId(Long newPartId) { this.newPartId = newPartId; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
}
