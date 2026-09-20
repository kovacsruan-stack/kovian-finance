package com.kovian.finance.budget.domain;
import jakarta.persistence.*; import java.math.BigDecimal; import java.time.OffsetDateTime; import java.util.UUID;
@Entity @Table(name="budgets",uniqueConstraints=@UniqueConstraint(name="uq_budget_owner_category_period",columnNames={"owner_id","category_id","period_start"}))
public class Budget {
 @Id private UUID id; @Column(name="owner_id",nullable=false) private UUID ownerId; @Column(name="category_id",nullable=false) private UUID categoryId;
 @Enumerated(EnumType.STRING) @Column(nullable=false,length=20) private BudgetPeriod period;
 @Column(name="period_start",nullable=false) private OffsetDateTime periodStart; @Column(name="limit_amount",nullable=false,precision=19,scale=4) private BigDecimal limitAmount;
 @Column(name="created_at",nullable=false) private OffsetDateTime createdAt;
 protected Budget(){}
 public Budget(UUID ownerId,UUID categoryId,BudgetPeriod period,OffsetDateTime start,BigDecimal limit){if(ownerId==null||categoryId==null||period==null||start==null||limit==null||limit.signum()<0)throw new IllegalArgumentException("Invalid budget");this.id=UUID.randomUUID();this.ownerId=ownerId;this.categoryId=categoryId;this.period=period;this.periodStart=start;this.limitAmount=limit;this.createdAt=OffsetDateTime.now();}
 public UUID getId(){return id;} public UUID getOwnerId(){return ownerId;} public UUID getCategoryId(){return categoryId;} public BudgetPeriod getPeriod(){return period;} public OffsetDateTime getPeriodStart(){return periodStart;} public BigDecimal getLimitAmount(){return limitAmount;}
}
