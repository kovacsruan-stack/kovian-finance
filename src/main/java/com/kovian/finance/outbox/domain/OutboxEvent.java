package com.kovian.finance.outbox.domain;
import jakarta.persistence.*; import java.time.OffsetDateTime; import java.util.UUID;

@Entity @Table(name="outbox_events")
public class OutboxEvent{
 @Id private UUID id;
 @Column(name="owner_id",nullable=false) private UUID ownerId;
 @Column(name="aggregate_type",nullable=false,length=80) private String aggregateType;
 @Column(name="aggregate_id",nullable=false) private UUID aggregateId;
 @Column(name="event_type",nullable=false,length=100) private String eventType;
 @Column(nullable=false,columnDefinition="TEXT") private String payload;
 @Enumerated(EnumType.STRING) @Column(nullable=false,length=20) private OutboxStatus status;
 @Column(name="event_version",nullable=false) private Integer eventVersion;
 @Column(nullable=false) private Integer attempts;
 @Column(name="available_at",nullable=false) private OffsetDateTime availableAt;
 @Column(name="created_at",nullable=false) private OffsetDateTime createdAt;
 @Column(name="published_at") private OffsetDateTime publishedAt;
 @Column(name="processing_at") private OffsetDateTime processingAt;
 @Column(name="last_error",length=1000) private String lastError;

 protected OutboxEvent(){}
 public OutboxEvent(UUID ownerId,String aggregateType,UUID aggregateId,String eventType,String payload){this(ownerId,aggregateType,aggregateId,eventType,1,payload);}
 public OutboxEvent(UUID ownerId,String aggregateType,UUID aggregateId,String eventType,Integer eventVersion,String payload){
  if(ownerId==null||aggregateType==null||aggregateType.isBlank()||aggregateType.length()>80||aggregateId==null)throw new IllegalArgumentException("Invalid outbox aggregate.");
  if(eventType==null||!eventType.matches("^[A-Za-z0-9]+(?:[_.-][A-Za-z0-9]+)*(?:\\.v[0-9]+)?$")||eventType.length()>100)throw new IllegalArgumentException("Event type must use the versioned EVENT_NAME.vN contract.");
  if(eventVersion==null||eventVersion<1||eventVersion>100)throw new IllegalArgumentException("Event version must be between 1 and 100.");
  if(payload==null||payload.isBlank()||payload.length()>1_000_000)throw new IllegalArgumentException("Outbox payload is required and must be at most 1 MB.");
  this.id=UUID.randomUUID();this.ownerId=ownerId;this.aggregateType=aggregateType;this.aggregateId=aggregateId;this.eventType=eventType;this.eventVersion=eventVersion;this.payload=payload;this.status=OutboxStatus.PENDING;this.attempts=0;this.availableAt=OffsetDateTime.now();this.createdAt=this.availableAt;
 }
 public UUID getId(){return id;} public Integer getEventVersion(){return eventVersion;} public UUID getOwnerId(){return ownerId;} public String getAggregateType(){return aggregateType;} public UUID getAggregateId(){return aggregateId;} public String getEventType(){return eventType;} public String getPayload(){return payload;} public OutboxStatus getStatus(){return status;} public Integer getAttempts(){return attempts;} public OffsetDateTime getAvailableAt(){return availableAt;} public OffsetDateTime getCreatedAt(){return createdAt;} public OffsetDateTime getPublishedAt(){return publishedAt;} public OffsetDateTime getProcessingAt(){return processingAt;} public String getLastError(){return lastError;}
 public void markProcessing(){status=OutboxStatus.PROCESSING;attempts++;processingAt=OffsetDateTime.now();lastError=null;}
 public void markPublished(){status=OutboxStatus.PUBLISHED;publishedAt=OffsetDateTime.now();processingAt=null;}
 public void markFailed(String error){status=attempts>=10?OutboxStatus.FAILED:OutboxStatus.PENDING;processingAt=null;lastError=error==null?null:error.substring(0,Math.min(1000,error.length()));availableAt=OffsetDateTime.now().plusSeconds(Math.min(900L,Math.max(5L,attempts*10L)));}
 public void requeueStale(){status=OutboxStatus.PENDING;processingAt=null;availableAt=OffsetDateTime.now();}
}