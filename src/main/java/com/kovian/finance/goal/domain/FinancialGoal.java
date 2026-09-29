package com.kovian.finance.goal.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "financial_goals")
public class FinancialGoal {
    @Id private UUID id;
    @Column(name = "owner_id", nullable = false) private UUID ownerId;
    @Column(nullable = false, length = 140) private String name;
    @Column(name = "target_amount", nullable = false, precision = 19, scale = 4) private BigDecimal targetAmount;
    @Column(name = "current_amount", nullable = false, precision = 19, scale = 4) private BigDecimal currentAmount;
    @Column(name = "target_date") private OffsetDateTime targetDate;
    @Column(nullable = false) private boolean active;
    @Column(name = "created_at", nullable = false) private OffsetDateTime createdAt;

    protected FinancialGoal() {}

    public FinancialGoal(UUID ownerId, String name, BigDecimal target, OffsetDateTime date) {
        if (ownerId == null || name == null || name.isBlank() || target == null || target.signum() <= 0)
            throw new IllegalArgumentException("Invalid financial goal");
        this.id = UUID.randomUUID();
        this.ownerId = ownerId;
        this.name = name.trim();
        this.targetAmount = target;
        this.currentAmount = BigDecimal.ZERO;
        this.targetDate = date;
        this.active = true;
        this.createdAt = OffsetDateTime.now();
    }

    public UUID getId() { return id; }
    public UUID getOwnerId() { return ownerId; }
    public String getName() { return name; }
    public BigDecimal getTargetAmount() { return targetAmount; }
    public BigDecimal getCurrentAmount() { return currentAmount; }
    public OffsetDateTime getTargetDate() { return targetDate; }
    public boolean isActive() { return active; }

    public void update(String name, BigDecimal targetAmount, OffsetDateTime targetDate) {
        if (!active) throw new IllegalStateException("Archived goals cannot be edited");
        if (name == null || name.isBlank() || name.length() > 140 || targetAmount == null || targetAmount.signum() <= 0)
            throw new IllegalArgumentException("Invalid financial goal");
        if (targetAmount.compareTo(currentAmount) < 0)
            throw new IllegalArgumentException("Target amount cannot be lower than the amount already saved");
        this.name = name.trim();
        this.targetAmount = targetAmount;
        this.targetDate = targetDate;
        if (currentAmount.compareTo(targetAmount) >= 0) this.active = false;
    }

    public void addContribution(BigDecimal amount) {
        if (!active) throw new IllegalStateException("Inactive goals cannot receive contributions");
        if (amount == null || amount.signum() <= 0) throw new IllegalArgumentException("Contribution must be positive");
        if (currentAmount.add(amount).compareTo(targetAmount) > 0)
            throw new IllegalArgumentException("Contribution exceeds the remaining goal amount");
        currentAmount = currentAmount.add(amount);
        if (currentAmount.compareTo(targetAmount) >= 0) active = false;
    }

    public void archive() { this.active = false; }
}