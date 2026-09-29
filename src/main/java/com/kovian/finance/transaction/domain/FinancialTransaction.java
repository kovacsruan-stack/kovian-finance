package com.kovian.finance.transaction.domain;

import com.kovian.finance.category.domain.TransactionCategory;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name="financial_transactions", uniqueConstraints=@UniqueConstraint(name="uq_financial_transaction_external",columnNames={"owner_id","external_id"}))
public class FinancialTransaction {
 @Id private UUID id;
 @Column(name="owner_id",nullable=false) private UUID ownerId;
 @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="account_id",nullable=false) private com.kovian.finance.account.domain.FinancialAccount account;
 @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="category_id") private TransactionCategory category;
 @Column(name="external_id",length=180) private String externalId;
 @Column(nullable=false,length=240) private String description;
 @Column(nullable=false,precision=19,scale=4) private BigDecimal amount;
 @Enumerated(EnumType.STRING) @Column(name="transaction_type",nullable=false,length=20) private TransactionType transactionType;
 @Column(name="occurred_at",nullable=false) private OffsetDateTime occurredAt;
 @Enumerated(EnumType.STRING) @Column(nullable=false,length=20) private TransactionStatus status;
 @Column(name="created_at",nullable=false) private OffsetDateTime createdAt;
 @Column(name="updated_at",nullable=false) private OffsetDateTime updatedAt;
 protected FinancialTransaction(){}
 public FinancialTransaction(UUID ownerId,com.kovian.finance.account.domain.FinancialAccount account,TransactionCategory category,String externalId,String description,BigDecimal amount,TransactionType type,OffsetDateTime occurredAt){
  if(ownerId==null||account==null||description==null||description.isBlank()||amount==null||amount.signum()<=0||type==null||occurredAt==null)throw new IllegalArgumentException("Invalid financial transaction");
  this.id=UUID.randomUUID();this.ownerId=ownerId;this.account=account;this.category=category;this.externalId=externalId;this.description=description.trim();this.amount=amount;this.transactionType=type;this.occurredAt=occurredAt;this.status=TransactionStatus.POSTED;this.createdAt=OffsetDateTime.now();this.updatedAt=this.createdAt;
 }
 public UUID getId(){return id;} public UUID getOwnerId(){return ownerId;} public com.kovian.finance.account.domain.FinancialAccount getAccount(){return account;}
 public TransactionCategory getCategory(){return category;} public String getExternalId(){return externalId;} public String getDescription(){return description;} public BigDecimal getAmount(){return amount;}
 public TransactionType getTransactionType(){return transactionType;} public OffsetDateTime getOccurredAt(){return occurredAt;} public TransactionStatus getStatus(){return status;}
 public void cancel(){if(status==TransactionStatus.CANCELLED) return; status=TransactionStatus.CANCELLED;updatedAt=OffsetDateTime.now();}
}
