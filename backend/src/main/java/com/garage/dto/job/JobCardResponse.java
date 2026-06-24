package com.garage.dto.job;

import com.garage.model.JobCard;
import com.garage.model.enums.JobCardStatus;
import java.time.LocalDateTime;

public class JobCardResponse {
    private Long id;
    private String jobNumber;
    private String customerName;
    private String customerPhone;
    private String vehicleRegistration;
    private String vehicleModel;
    private String requestedWork;
    private String technicalReport;
    private String workCompleted;
    private JobCardStatus status;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static JobCardResponse fromEntity(JobCard jobCard) {
        JobCardResponse r = new JobCardResponse();
        r.setId(jobCard.getId());
        r.setJobNumber(jobCard.getJobNumber());
        r.setCustomerName(jobCard.getCustomerName());
        r.setCustomerPhone(jobCard.getCustomerPhone());
        r.setVehicleRegistration(jobCard.getVehicleRegistration());
        r.setVehicleModel(jobCard.getVehicleModel());
        r.setRequestedWork(jobCard.getRequestedWork());
        r.setTechnicalReport(jobCard.getTechnicalReport());
        r.setWorkCompleted(jobCard.getWorkCompleted());
        r.setStatus(jobCard.getStatus());
        r.setCreatedByName(jobCard.getCreatedBy().getFullName());
        r.setCreatedAt(jobCard.getCreatedAt());
        r.setUpdatedAt(jobCard.getUpdatedAt());
        return r;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getJobNumber() { return jobNumber; }
    public void setJobNumber(String jobNumber) { this.jobNumber = jobNumber; }
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
    public String getTechnicalReport() { return technicalReport; }
    public void setTechnicalReport(String technicalReport) { this.technicalReport = technicalReport; }
    public String getWorkCompleted() { return workCompleted; }
    public void setWorkCompleted(String workCompleted) { this.workCompleted = workCompleted; }
    public JobCardStatus getStatus() { return status; }
    public void setStatus(JobCardStatus status) { this.status = status; }
    public String getCreatedByName() { return createdByName; }
    public void setCreatedByName(String createdByName) { this.createdByName = createdByName; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
