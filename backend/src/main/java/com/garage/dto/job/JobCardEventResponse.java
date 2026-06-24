package com.garage.dto.job;

import com.garage.model.JobCardEvent;
import com.garage.model.enums.EventType;
import java.time.LocalDateTime;

public class JobCardEventResponse {
    private Long id;
    private Long jobCardId;
    private EventType eventType;
    private String description;
    private String performedBy;
    private LocalDateTime createdAt;

    public static JobCardEventResponse fromEntity(JobCardEvent event) {
        JobCardEventResponse r = new JobCardEventResponse();
        r.setId(event.getId());
        r.setJobCardId(event.getJobCard().getId());
        r.setEventType(event.getEventType());
        r.setDescription(event.getDescription());
        r.setPerformedBy(event.getPerformedBy());
        r.setCreatedAt(event.getCreatedAt());
        return r;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getJobCardId() { return jobCardId; }
    public void setJobCardId(Long jobCardId) { this.jobCardId = jobCardId; }
    public EventType getEventType() { return eventType; }
    public void setEventType(EventType eventType) { this.eventType = eventType; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getPerformedBy() { return performedBy; }
    public void setPerformedBy(String performedBy) { this.performedBy = performedBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
