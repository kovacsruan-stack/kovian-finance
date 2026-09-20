package com.kovian.finance.category.domain;
import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;
@Entity @Table(name="transaction_categories")
public class TransactionCategory {
 @Id private UUID id; @Column(name="owner_id",nullable=false) private UUID ownerId;
 @Column(nullable=false,length=100) private String name; @Enumerated(EnumType.STRING) @Column(nullable=false,length=20) private CategoryKind kind;
 @Column(name="parent_id") private UUID parentId; @Column(nullable=false) private boolean active=true; @Column(name="created_at",nullable=false) private OffsetDateTime createdAt;
 protected TransactionCategory(){}
 public TransactionCategory(UUID ownerId,String name,CategoryKind kind,UUID parentId){if(ownerId==null||name==null||name.isBlank())throw new IllegalArgumentException("Owner and name are required");this.id=UUID.randomUUID();this.ownerId=ownerId;this.name=name.trim();this.kind=kind;this.parentId=parentId;this.createdAt=OffsetDateTime.now();}
 public UUID getId(){return id;} public UUID getOwnerId(){return ownerId;} public String getName(){return name;} public CategoryKind getKind(){return kind;} public UUID getParentId(){return parentId;} public boolean isActive(){return active;}
}
