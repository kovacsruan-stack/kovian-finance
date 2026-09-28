package com.kovian.finance.management.domain;

import com.kovian.finance.security.CurrentUser;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "management_records", uniqueConstraints = @UniqueConstraint(
        name = "uq_management_record_owner_resource_source",
        columnNames = {"owner_id", "resource", "source_id"}))
public class ManagementRecord {
    @Id
    private UUID id;

    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;

    @Column(nullable = false, length = 24)
    private String resource;

    @Column(name = "source_id", length = 120)
    private String sourceId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "data", nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> data = new LinkedHashMap<>();

    @Column(name = "is_archived", nullable = false)
    private boolean archived;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    protected ManagementRecord() {}

    public ManagementRecord(UUID ownerId, String resource, String sourceId, Map<String, Object> data) {
        if (ownerId == null || resource == null || sourceId != null && sourceId.isBlank() || data == null || data.isEmpty()) {
            throw new IllegalArgumentException("Invalid management record");
        }
        this.id = UUID.randomUUID();
        this.ownerId = ownerId;
        this.resource = resource;
        this.sourceId = sourceId;
        this.data = new LinkedHashMap<>(data);
        this.archived = false;
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = this.createdAt;
    }

    public UUID getId() { return id; }
    public UUID getOwnerId() { return ownerId; }
    public String getResource() { return resource; }
    public String getSourceId() { return sourceId; }
    public Map<String, Object> getData() { return new LinkedHashMap<>(data); }
    public boolean isArchived() { return archived; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }

    public void replaceData(Map<String, Object> data) {
        if (data == null || data.isEmpty()) throw new IllegalArgumentException("Record data is required");
        this.data = new LinkedHashMap<>(data);
        touch();
    }

    public void archive() {
        this.archived = true;
        touch();
    }

    public void restore() {
        this.archived = false;
        touch();
    }

    private void touch() { this.updatedAt = OffsetDateTime.now(); }
}
