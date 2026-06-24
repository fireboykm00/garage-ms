package com.garage.model;

import com.garage.model.enums.JobCardStatus;
import jakarta.persistence.*;

@Entity
@Table(name = "job_cards")
public class JobCard {

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

    @Column(name = "job_number", unique = true, nullable = false)
    private String jobNumber;

    @Column(name = "customer_name", nullable = false)
    private String customerName;

    @Column(name = "customer_phone")
    private String customerPhone;

    @Column(name = "vehicle_registration")
    private String vehicleRegistration;

    @Column(name = "vehicle_model")
    private String vehicleModel;

    @Column(columnDefinition = "TEXT")
    private String requestedWork;

    @Column(name = "technical_report", columnDefinition = "TEXT")
    private String technicalReport;

    @Column(name = "work_completed", columnDefinition = "TEXT")
    private String workCompleted;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private JobCardStatus status = JobCardStatus.OPEN;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Column(updatable = false)
    private java.time.LocalDateTime createdAt;

    private java.time.LocalDateTime updatedAt;

    public JobCard() {}

    public JobCard(String jobNumber, String customerName, String customerPhone,
                   String vehicleRegistration, String vehicleModel, String requestedWork, User createdBy) {
        this.jobNumber = jobNumber;
        this.customerName = customerName;
        this.customerPhone = customerPhone;
        this.vehicleRegistration = vehicleRegistration;
        this.vehicleModel = vehicleModel;
        this.requestedWork = requestedWork;
        this.createdBy = createdBy;
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
    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }
    public java.time.LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(java.time.LocalDateTime createdAt) { this.createdAt = createdAt; }
    public java.time.LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(java.time.LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
