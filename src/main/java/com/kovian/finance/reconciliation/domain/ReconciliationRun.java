package com.kovian.finance.reconciliation.domain;
import jakarta.persistence.*; import java.math.BigDecimal; import java.time.OffsetDateTime; import java.util.UUID;
@Entity @Table(name="reconciliation_runs")
public class ReconciliationRun{
 @Id private UUID id; @Column(name="owner_id",nullable=false) private UUID ownerId; @Column(name="account_id",nullable=false) private UUID accountId;
 @Column(name="expected_balance",nullable=false,precision=19,scale=4) private BigDecimal expectedBalance; @Column(name="actual_balance",nullable=false,precision=19,scale=4) private BigDecimal actualBalance; @Column(nullable=false,precision=19,scale=4) private BigDecimal difference;
 @Column(nullable=false,length=20) private String status; @Column(name="created_at",nullable=false) private OffsetDateTime createdAt;
 protected ReconciliationRun(){} public ReconciliationRun(UUID owner,UUID account,BigDecimal expected,BigDecimal actual){id=UUID.randomUUID();ownerId=owner;accountId=account;expectedBalance=expected;actualBalance=actual;difference=actual.subtract(expected);status=difference.signum()==0?"MATCHED":"DIVERGED";createdAt=OffsetDateTime.now();}
 public UUID getId(){return id;} public UUID getAccountId(){return accountId;} public BigDecimal getExpectedBalance(){return expectedBalance;} public BigDecimal getActualBalance(){return actualBalance;} public BigDecimal getDifference(){return difference;} public String getStatus(){return status;} public OffsetDateTime getCreatedAt(){return createdAt;}
}