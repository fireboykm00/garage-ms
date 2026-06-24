package com.garage.dto.job;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class AddPartRequest {
    @NotNull
    private Long partId;

    @NotNull
    @Positive
    private Integer quantity;

    public AddPartRequest() {}

    public Long getPartId() { return partId; }
    public void setPartId(Long partId) { this.partId = partId; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
}
