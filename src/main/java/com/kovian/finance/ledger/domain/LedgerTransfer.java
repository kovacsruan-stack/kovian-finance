package com.kovian.finance.ledger.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "ledger_transfers")
public class LedgerTransfer {
    @Id private UUID id;
    @Column(name = "owner_id", nullable = false) private UUID ownerId;
    @Column(name = "from_account_id", nullable = false) private UUID fromAccountId;
    @Column(name = "to_account_id", nullable = false) private UUID toAccountId;
    @Column(nullable = false, precision = 19, scale = 4) private BigDecimal amount;
    @Column(nullable = false, length = 240) private String description;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private LedgerTransferStatus status;
    @Column(name = "created_at", nullable = false) private OffsetDateTime createdAt;

    protected LedgerTransfer() {}

    public LedgerTransfer(UUID id, UUID ownerId, UUID fromAccountId, UUID toAccountId,
                          BigDecimal amount, String description) {
        this.id = Objects.requireNonNull(id);
        this.ownerId = Objects.requireNonNull(ownerId);
        this.fromAccountId = Objects.requireNonNull(fromAccountId);
        this.toAccountId = Objects.requireNonNull(toAccountId);
        this.amount = Objects.requireNonNull(amount);
        this.description = Objects.requireNonNull(description).trim();
        this.status = LedgerTransferStatus.POSTED;
        this.createdAt = OffsetDateTime.now();
    }

    public UUID getId(){return id;} public UUID getOwnerId(){return ownerId;}
    public UUID getFromAccountId(){return fromAccountId;} public UUID getToAccountId(){return toAccountId;}
    public BigDecimal getAmount(){return amount;} public String getDescription(){return description;}
    public LedgerTransferStatus getStatus(){return status;} public OffsetDateTime getCreatedAt(){return createdAt;}
}
