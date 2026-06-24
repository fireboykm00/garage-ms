package com.garage.dto.part;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public class PartRequest {
    @NotBlank
    private String partNumber;

    private String ourPartNumber;

    @NotBlank
    private String name;

    private String model;

    private String manufacturer;

    @NotBlank
    private String unit;

    @NotNull
    @PositiveOrZero
    private Integer currentQuantity = 0;

    @NotNull
    @PositiveOrZero
    private Integer minimumQuantity = 0;

    @NotNull
    private Long stockId;

    public PartRequest() {}

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
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
    public Integer getCurrentQuantity() { return currentQuantity; }
    public void setCurrentQuantity(Integer currentQuantity) { this.currentQuantity = currentQuantity; }
    public Integer getMinimumQuantity() { return minimumQuantity; }
    public void setMinimumQuantity(Integer minimumQuantity) { this.minimumQuantity = minimumQuantity; }
    public Long getStockId() { return stockId; }
    public void setStockId(Long stockId) { this.stockId = stockId; }
}
