package com.garage.dto.report;

import com.garage.model.Part;
import java.time.LocalDateTime;

public class RemainingStockResponse {
    private Long id;
    private String partNumber;
    private String ourPartNumber;
    private String name;
    private String model;
    private String manufacturer;
    private String location;
    private String warehouse;
    private String unit;
    private Integer currentQuantity;
    private Integer minimumQuantity;
    private long stockOut;
    private LocalDateTime updatedAt;

    public static RemainingStockResponse fromEntity(Part part, long stockOut) {
        RemainingStockResponse response = new RemainingStockResponse();
        response.setId(part.getId());
        response.setPartNumber(part.getPartNumber());
        response.setOurPartNumber(part.getOurPartNumber());
        response.setName(part.getName());
        response.setModel(part.getModel());
        response.setManufacturer(part.getManufacturer());
        response.setLocation(part.getLocation());
        response.setWarehouse(part.getWarehouse());
        response.setUnit(part.getUnit());
        response.setCurrentQuantity(part.getCurrentQuantity());
        response.setMinimumQuantity(part.getMinimumQuantity());
        response.setStockOut(stockOut);
        response.setUpdatedAt(part.getUpdatedAt());
        return response;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getPartNumber() { return partNumber; }
    public void setPartNumber(String partNumber) { this.partNumber = partNumber; }
    public String getOurPartNumber() { return ourPartNumber; }
    public void setOurPartNumber(String ourPartNumber) { this.ourPartNumber = ourPartNumber; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }
    public String getManufacturer() { return manufacturer; }
    public void setManufacturer(String manufacturer) { this.manufacturer = manufacturer; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getWarehouse() { return warehouse; }
    public void setWarehouse(String warehouse) { this.warehouse = warehouse; }
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
    public Integer getCurrentQuantity() { return currentQuantity; }
    public void setCurrentQuantity(Integer currentQuantity) { this.currentQuantity = currentQuantity; }
    public Integer getMinimumQuantity() { return minimumQuantity; }
    public void setMinimumQuantity(Integer minimumQuantity) { this.minimumQuantity = minimumQuantity; }
    public long getStockOut() { return stockOut; }
    public void setStockOut(long stockOut) { this.stockOut = stockOut; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
