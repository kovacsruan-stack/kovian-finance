package com.kovian.finance.audit.domain;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "audit_events")
public class AuditEvent {
    @Id
    private UUID id;
    @Column(name="owner_id", nullable=false) private UUID ownerId;
    @Column(name="actor_id") private UUID actorId;
    @Column(nullable=false, length=80) private String action;
    @Column(name="entity_type", nullable=false, length=80) private String entityType;
    @Column(name="entity_id") private UUID entityId;
    @Column(columnDefinition="TEXT") private String metadata;
    @Column(name="correlation_id", length=120) private String correlationId;
    @Column(name="occurred_at", nullable=false) private OffsetDateTime occurredAt;

    protected AuditEvent() {}

    public AuditEvent(UUID ownerId, UUID actorId, String action, String entityType, UUID entityId,
                      String metadata, String correlationId) {
        this.id = UUID.randomUUID();
        this.ownerId = ownerId;
        this.actorId = actorId;
        this.action = action;
        this.entityType = entityType;
        this.entityId = entityId;
        this.metadata = metadata;
        this.correlationId = correlationId;
        this.occurredAt = OffsetDateTime.now();
    }
    public UUID getId(){ return id; }
    public UUID getOwnerId(){ return ownerId; }
    public UUID getActorId(){ return actorId; }
    public String getAction(){ return action; }
    public String getEntityType(){ return entityType; }
    public UUID getEntityId(){ return entityId; }
    public String getMetadata(){ return metadata; }
    public String getCorrelationId(){ return correlationId; }
    public OffsetDateTime getOccurredAt(){ return occurredAt; }
}
