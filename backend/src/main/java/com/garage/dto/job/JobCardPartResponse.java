package com.garage.dto.job;

import com.garage.model.JobCardPart;
import java.time.LocalDateTime;

public class JobCardPartResponse {
    private Long id;
    private Long jobCardId;
    private Long partId;
    private String partNumber;
    private String partName;
    private String unit;
    private Integer quantity;
    private LocalDateTime createdAt;

    public static JobCardPartResponse fromEntity(JobCardPart jcp) {
        JobCardPartResponse r = new JobCardPartResponse();
        r.setId(jcp.getId());
        r.setJobCardId(jcp.getJobCard().getId());
        r.setPartId(jcp.getPart().getId());
        r.setPartNumber(jcp.getPart().getPartNumber());
        r.setPartName(jcp.getPart().getName());
        r.setUnit(jcp.getPart().getUnit());
        r.setQuantity(jcp.getQuantity());
        r.setCreatedAt(jcp.getCreatedAt());
        return r;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getJobCardId() { return jobCardId; }
    public void setJobCardId(Long jobCardId) { this.jobCardId = jobCardId; }
    public Long getPartId() { return partId; }
    public void setPartId(Long partId) { this.partId = partId; }
    public String getPartNumber() { return partNumber; }
    public void setPartNumber(String partNumber) { this.partNumber = partNumber; }
    public String getPartName() { return partName; }
    public void setPartName(String partName) { this.partName = partName; }
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
