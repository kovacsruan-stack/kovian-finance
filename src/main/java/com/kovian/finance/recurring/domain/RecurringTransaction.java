package com.kovian.finance.recurring.domain;
import jakarta.persistence.*; import java.math.BigDecimal; import java.time.LocalDate; import java.time.OffsetDateTime; import java.util.UUID;
@Entity @Table(name="recurring_transactions")
public class RecurringTransaction {
 @Id @GeneratedValue(strategy=GenerationType.UUID) private UUID id; @Version @Column(nullable=false) private Long version; @Column(name="owner_id", nullable=false) private UUID ownerId; @Column(name="account_id", nullable=false) private UUID accountId; @Column(name="category_id") private UUID categoryId; @Column(nullable=false, length=255) private String description; @Column(nullable=false, precision=19, scale=4) private BigDecimal amount; @Enumerated(EnumType.STRING) @Column(name="transaction_type", nullable=false) private com.kovian.finance.transaction.domain.TransactionType transactionType; @Enumerated(EnumType.STRING) @Column(nullable=false) private RecurringFrequency frequency; @Column(name="next_occurrence", nullable=false) private LocalDate nextOccurrence; @Column(name="end_date") private LocalDate endDate; @Column(nullable=false) private boolean active=true; @Column(name="created_at", nullable=false) private OffsetDateTime createdAt=OffsetDateTime.now(); @Column(name="updated_at", nullable=false) private OffsetDateTime updatedAt=OffsetDateTime.now();
 protected RecurringTransaction() {}
 public RecurringTransaction(UUID ownerId, UUID accountId, UUID categoryId, String description, BigDecimal amount, com.kovian.finance.transaction.domain.TransactionType type, RecurringFrequency frequency, LocalDate nextOccurrence, LocalDate endDate) {
  if(ownerId==null||accountId==null||description==null||description.isBlank()||amount==null||amount.signum()<=0||type==null||type==com.kovian.finance.transaction.domain.TransactionType.TRANSFER||frequency==null||nextOccurrence==null) throw new IllegalArgumentException("Invalid recurring transaction");
  if(endDate!=null && endDate.isBefore(nextOccurrence)) throw new IllegalArgumentException("End date cannot precede next occurrence");
  this.ownerId=ownerId; this.accountId=accountId; this.categoryId=categoryId; this.description=description.trim(); this.amount=amount; this.transactionType=type; this.frequency=frequency; this.nextOccurrence=nextOccurrence; this.endDate=endDate;
 }
 public UUID getId(){return id;} public UUID getOwnerId(){return ownerId;} public UUID getAccountId(){return accountId;} public UUID getCategoryId(){return categoryId;} public String getDescription(){return description;} public BigDecimal getAmount(){return amount;} public com.kovian.finance.transaction.domain.TransactionType getTransactionType(){return transactionType;} public RecurringFrequency getFrequency(){return frequency;} public LocalDate getNextOccurrence(){return nextOccurrence;} public LocalDate getEndDate(){return endDate;} public boolean isActive(){return active;}
 public void update(UUID accountId, UUID categoryId, String description, BigDecimal amount, com.kovian.finance.transaction.domain.TransactionType type, RecurringFrequency frequency, LocalDate nextOccurrence, LocalDate endDate) {
  if (!active) throw new IllegalStateException("Paused recurring transactions cannot be edited; resume first");
  if (accountId == null || description == null || description.isBlank() || amount == null || amount.signum() <= 0
      || type == null || type == com.kovian.finance.transaction.domain.TransactionType.TRANSFER || frequency == null || nextOccurrence == null)
    throw new IllegalArgumentException("Invalid recurring transaction");
  if (endDate != null && endDate.isBefore(nextOccurrence))
    throw new IllegalArgumentException("End date cannot precede next occurrence");
  this.accountId = accountId; this.categoryId = categoryId; this.description = description.trim(); this.amount = amount;
  this.transactionType = type; this.frequency = frequency; this.nextOccurrence = nextOccurrence; this.endDate = endDate;
  this.updatedAt = OffsetDateTime.now();
 }
 public void pause(){active=false; updatedAt=OffsetDateTime.now();}
 public void resume(){if(endDate != null && nextOccurrence.isAfter(endDate)) throw new IllegalStateException("Recurring transaction has reached its end date"); active=true; updatedAt=OffsetDateTime.now();}
 public void archive(){active=false; updatedAt=OffsetDateTime.now();}
 public void advance(){nextOccurrence=switch(frequency){case WEEKLY->nextOccurrence.plusWeeks(1);case MONTHLY->nextOccurrence.plusMonths(1);case YEARLY->nextOccurrence.plusYears(1);}; updatedAt=OffsetDateTime.now(); if(endDate!=null&&nextOccurrence.isAfter(endDate)) active=false;}
}