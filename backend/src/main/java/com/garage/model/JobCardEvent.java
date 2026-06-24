package com.garage.model;

import com.garage.model.enums.EventType;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "job_card_events")
public class JobCardEvent {

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_card_id", nullable = false)
    private JobCard jobCard;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventType eventType;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(name = "performed_by", nullable = false)
    private String performedBy;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    public JobCardEvent() {}

    public JobCardEvent(JobCard jobCard, EventType eventType, String description, String performedBy) {
        this.jobCard = jobCard;
        this.eventType = eventType;
        this.description = description;
        this.performedBy = performedBy;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public JobCard getJobCard() { return jobCard; }
    public void setJobCard(JobCard jobCard) { this.jobCard = jobCard; }
    public EventType getEventType() { return eventType; }
    public void setEventType(EventType eventType) { this.eventType = eventType; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getPerformedBy() { return performedBy; }
    public void setPerformedBy(String performedBy) { this.performedBy = performedBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
