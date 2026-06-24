package com.garage.dto.job;

import jakarta.validation.constraints.NotBlank;

public class JobCardRequest {
    @NotBlank
    private String customerName;

    private String customerPhone;

    private String vehicleRegistration;

    private String vehicleModel;

    private String requestedWork;

    public JobCardRequest() {}

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }
    public String getVehicleRegistration() { return vehicleRegistration; }
    public void setVehicleRegistration(String vehicleRegistration) { this.vehicleRegistration = vehicleRegistration; }
    public String getVehicleModel() { return vehicleModel; }
    public void setVehicleModel(String vehicleModel) { this.vehicleModel = vehicleModel; }
    public String getRequestedWork() { return requestedWork; }
    public void setRequestedWork(String requestedWork) { this.requestedWork = requestedWork; }
}
