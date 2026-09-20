package com.kovian.finance.account.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name="financial_accounts", uniqueConstraints=@UniqueConstraint(name="uq_financial_account_owner_name", columnNames={"owner_id","name"}))
public class FinancialAccount {
    @Id private UUID id;
    @Version @Column(nullable=false) private Long version;
    @Column(name="owner_id", nullable=false) private UUID ownerId;
    @Column(nullable=false, length=120) private String name;
    @Enumerated(EnumType.STRING) @Column(name="account_type", nullable=false, length=30) private AccountType accountType;
    @Column(nullable=false, length=3) private String currency;
    @Column(name="opening_balance", nullable=false, precision=19, scale=4) private BigDecimal openingBalance;
    @Column(name="current_balance", nullable=false, precision=19, scale=4) private BigDecimal currentBalance;
    @Enumerated(EnumType.STRING) @Column(nullable=false, length=20) private AccountStatus status;
    @Column(name="created_at", nullable=false) private OffsetDateTime createdAt;
    @Column(name="updated_at", nullable=false) private OffsetDateTime updatedAt;

    protected FinancialAccount() {}
    public FinancialAccount(UUID ownerId, String name, AccountType type, String currency, BigDecimal openingBalance) {
        if (ownerId == null || name == null || name.isBlank()) throw new IllegalArgumentException("Owner and account name are required");
        if (openingBalance == null) throw new IllegalArgumentException("Opening balance is required");
        this.id=UUID.randomUUID(); this.ownerId=ownerId; this.name=name.trim(); this.accountType=type;
        this.currency=currency.toUpperCase(); this.openingBalance=openingBalance; this.currentBalance=openingBalance;
        this.status=AccountStatus.ACTIVE; this.createdAt=OffsetDateTime.now(); this.updatedAt=this.createdAt;
    }
    public UUID getId(){return id;} public UUID getOwnerId(){return ownerId;} public String getName(){return name;}
    public AccountType getAccountType(){return accountType;} public String getCurrency(){return currency;}
    public BigDecimal getCurrentBalance(){return currentBalance;} public AccountStatus getStatus(){return status;}
    public void applyIncome(BigDecimal amount){ currentBalance=currentBalance.add(amount); touch(); }
    public void applyExpense(BigDecimal amount){ currentBalance=currentBalance.subtract(amount); touch(); }
    public void archive(){status=AccountStatus.ARCHIVED; touch();}
    private void touch(){updatedAt=OffsetDateTime.now();}
}