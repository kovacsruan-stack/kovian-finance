package com.kovian.finance.notification.domain;
import jakarta.persistence.*; import java.time.OffsetDateTime; import java.util.UUID;
@Entity @Table(name="notifications",uniqueConstraints=@UniqueConstraint(name="uq_notification_owner_dedupe",columnNames={"owner_id","deduplication_key"}))
public class Notification{
 @Id private UUID id; @Column(name="owner_id",nullable=false) private UUID ownerId; @Column(nullable=false,length=60) private String type; @Column(nullable=false,length=20) private String severity;
 @Column(nullable=false,length=180) private String title; @Column(nullable=false,length=1000) private String message; @Column(name="entity_type",length=80) private String entityType; @Column(name="entity_id") private UUID entityId;
 @Column(name="deduplication_key",nullable=false,length=180) private String deduplicationKey; @Column(name="read_at") private OffsetDateTime readAt; @Column(name="created_at",nullable=false) private OffsetDateTime createdAt;
 protected Notification(){}
 public Notification(UUID owner,String type,String severity,String title,String message,String entityType,UUID entityId,String key){this.id=UUID.randomUUID();this.ownerId=owner;this.type=type;this.severity=severity;this.title=title;this.message=message;this.entityType=entityType;this.entityId=entityId;this.deduplicationKey=key;this.createdAt=OffsetDateTime.now();}
 public UUID getId(){return id;} public UUID getOwnerId(){return ownerId;} public String getType(){return type;} public String getSeverity(){return severity;} public String getTitle(){return title;} public String getMessage(){return message;} public String getEntityType(){return entityType;} public UUID getEntityId(){return entityId;} public String getDeduplicationKey(){return deduplicationKey;} public OffsetDateTime getReadAt(){return readAt;} public OffsetDateTime getCreatedAt(){return createdAt;}
 public void markRead(){readAt=OffsetDateTime.now();}
}