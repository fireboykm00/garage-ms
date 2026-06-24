package com.garage.model;

import com.garage.model.enums.TransactionSourceType;
import com.garage.model.enums.TransactionType;
import jakarta.persistence.*;

@Entity
@Table(name = "stock_transactions")
public class StockTransaction {

    @PrePersist
    protected void onCreate() {
        createdAt = java.time.LocalDateTime.now();
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "part_id", nullable = false)
    private Part part;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType type;

    @Column(nullable = false)
    private Integer quantity;

    @Column(length = 500)
    private String note;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type")
    private TransactionSourceType sourceType;

    @Column(name = "source_id")
    private String sourceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Column(updatable = false)
    private java.time.LocalDateTime createdAt;

    public StockTransaction() {}

    public StockTransaction(Part part, TransactionType type, Integer quantity, String note, User createdBy) {
        this.part = part;
        this.type = type;
        this.quantity = quantity;
        this.note = note;
        this.createdBy = createdBy;
    }

    public StockTransaction(Part part, TransactionType type, Integer quantity, String note,
                            TransactionSourceType sourceType, String sourceId, User createdBy) {
        this.part = part;
        this.type = type;
        this.quantity = quantity;
        this.note = note;
        this.sourceType = sourceType;
        this.sourceId = sourceId;
        this.createdBy = createdBy;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Part getPart() { return part; }
    public void setPart(Part part) { this.part = part; }
    public TransactionType getType() { return type; }
    public void setType(TransactionType type) { this.type = type; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public TransactionSourceType getSourceType() { return sourceType; }
    public void setSourceType(TransactionSourceType sourceType) { this.sourceType = sourceType; }
    public String getSourceId() { return sourceId; }
    public void setSourceId(String sourceId) { this.sourceId = sourceId; }
    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }
    public java.time.LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(java.time.LocalDateTime createdAt) { this.createdAt = createdAt; }
}
