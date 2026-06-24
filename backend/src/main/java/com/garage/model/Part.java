package com.garage.model;

import jakarta.persistence.*;

@Entity
@Table(name = "parts")
public class Part {

    @PrePersist
    protected void onCreate() {
        createdAt = java.time.LocalDateTime.now();
        updatedAt = java.time.LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = java.time.LocalDateTime.now();
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "part_number", unique = true, nullable = false)
    private String partNumber;

    @Column(name = "our_part_number")
    private String ourPartNumber;

    @Column(nullable = false)
    private String name;

    private String model;

    private String manufacturer;

    private String location;

    private String warehouse;

    @Column(nullable = false)
    private String unit = "pcs";

    @Column(name = "current_quantity", nullable = false)
    private Integer currentQuantity = 0;

    @Column(name = "minimum_quantity", nullable = false)
    private Integer minimumQuantity = 0;

    @Column(updatable = false)
    private java.time.LocalDateTime createdAt;

    private java.time.LocalDateTime updatedAt;

    public Part() {}

    public Part(String partNumber, String name, String model, String manufacturer, String location, String warehouse, String unit, Integer currentQuantity, Integer minimumQuantity) {
        this.partNumber = partNumber;
        this.name = name;
        this.model = model;
        this.manufacturer = manufacturer;
        this.location = location;
        this.warehouse = warehouse;
        this.unit = unit;
        this.currentQuantity = currentQuantity;
        this.minimumQuantity = minimumQuantity;
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
    public java.time.LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(java.time.LocalDateTime createdAt) { this.createdAt = createdAt; }
    public java.time.LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(java.time.LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
