package com.kovian.finance.outbox.domain;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name="outbox_events")
public class OutboxEvent {
 @Id private UUID id;
 @Column(name="owner_id",nullable=false) private UUID ownerId;
 @Column(name="aggregate_type",nullable=false,length=80) private String aggregateType;
 @Column(name="aggregate_id",nullable=false) private UUID aggregateId;
 @Column(name="event_type",nullable=false,length=100) private String eventType;
 @Column(nullable=false,columnDefinition="TEXT") private String payload;
 @Enumerated(EnumType.STRING) @Column(nullable=false,length=20) private OutboxStatus status;
 @Column(nullable=false) private Integer attempts;
 @Column(name="available_at",nullable=false) private OffsetDateTime availableAt;
 @Column(name="created_at",nullable=false) private OffsetDateTime createdAt;
 @Column(name="published_at") private OffsetDateTime publishedAt;
 @Column(name="last_error",length=1000) private String lastError;

 protected OutboxEvent(){}
 public OutboxEvent(UUID ownerId,String aggregateType,UUID aggregateId,String eventType,String payload){
  this.id=UUID.randomUUID(); this.ownerId=ownerId; this.aggregateType=aggregateType; this.aggregateId=aggregateId;
  this.eventType=eventType; this.payload=payload; this.status=OutboxStatus.PENDING; this.attempts=0;
  this.availableAt=OffsetDateTime.now(); this.createdAt=this.availableAt;
 }
 public UUID getId(){return id;} public UUID getOwnerId(){return ownerId;} public String getAggregateType(){return aggregateType;}
 public UUID getAggregateId(){return aggregateId;} public String getEventType(){return eventType;} public String getPayload(){return payload;}
 public OutboxStatus getStatus(){return status;} public Integer getAttempts(){return attempts;} public OffsetDateTime getAvailableAt(){return availableAt;}
 public OffsetDateTime getCreatedAt(){return createdAt;} public OffsetDateTime getPublishedAt(){return publishedAt;} public String getLastError(){return lastError;}
 public void markProcessing(){status=OutboxStatus.PROCESSING; attempts++; lastError=null;}
 public void markPublished(){status=OutboxStatus.PUBLISHED; publishedAt=OffsetDateTime.now();}
 public void markFailed(String error){status=OutboxStatus.FAILED; lastError=error==null?null:error.substring(0,Math.min(1000,error.length())); availableAt=OffsetDateTime.now().plusSeconds(Math.min(300L,Math.max(5L,attempts*10L)));}
}