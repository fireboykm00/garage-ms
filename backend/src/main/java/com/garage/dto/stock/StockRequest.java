package com.garage.dto.stock;

import jakarta.validation.constraints.NotBlank;

public class StockRequest {
    @NotBlank
    private String name;
    private String description;

    public StockRequest() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
