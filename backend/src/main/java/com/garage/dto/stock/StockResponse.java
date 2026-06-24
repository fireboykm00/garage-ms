package com.garage.dto.stock;

import com.garage.model.Stock;

public class StockResponse {
    private Long id;
    private String name;
    private String description;
    private String createdAt;

    public static StockResponse fromEntity(Stock stock) {
        StockResponse r = new StockResponse();
        r.id = stock.getId();
        r.name = stock.getName();
        r.description = stock.getDescription();
        r.createdAt = stock.getCreatedAt() != null ? stock.getCreatedAt().toString() : null;
        return r;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
