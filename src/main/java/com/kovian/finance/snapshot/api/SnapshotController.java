package com.kovian.finance.snapshot.api;

import com.kovian.finance.asset.repository.FinancialAssetRepository;
import com.kovian.finance.debt.domain.Debt;
import com.kovian.finance.debt.domain.DebtStatus;
import com.kovian.finance.debt.repository.DebtRepository;
import com.kovian.finance.liability.repository.FinancialLiabilityRepository;
import com.kovian.finance.security.CurrentUser;
import com.kovian.finance.snapshot.domain.FinancialSnapshot;
import com.kovian.finance.snapshot.repository.FinancialSnapshotRepository;
import com.kovian.finance.transaction.domain.TransactionStatus;
import com.kovian.finance.transaction.domain.TransactionType;
import com.kovian.finance.transaction.repository.FinancialTransactionRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1/snapshots")
public class SnapshotController {
    private final FinancialSnapshotRepository snapshots;
    private final FinancialAssetRepository assets;
    private final FinancialLiabilityRepository liabilities;
    private final DebtRepository debts;
    private final FinancialTransactionRepository transactions;

    SnapshotController(
            FinancialSnapshotRepository snapshots,
            FinancialAssetRepository assets,
            FinancialLiabilityRepository liabilities,
            DebtRepository debts,
            FinancialTransactionRepository transactions
    ) {
        this.snapshots = snapshots;
        this.assets = assets;
        this.liabilities = liabilities;
        this.debts = debts;
        this.transactions = transactions;
    }

    @PostMapping("/rebuild")
    @Transactional
    public FinancialSnapshot rebuild(@RequestParam LocalDate date) {
        UUID ownerId = CurrentUser.ownerId();
        LocalDate firstDay = date.withDayOfMonth(1);
        LocalDate nextDay = date.withDayOfMonth(date.lengthOfMonth()).plusDays(1);

        OffsetDateTime from = firstDay.atStartOfDay().atOffset(ZoneOffset.UTC);
        OffsetDateTime to = nextDay.atStartOfDay().atOffset(ZoneOffset.UTC);

        BigDecimal income = BigDecimal.ZERO;
        BigDecimal expense = BigDecimal.ZERO;

        for (var tx : transactions.findByOwnerIdAndOccurredAtBetweenOrderByOccurredAtDesc(ownerId, from, to)) {
            if (tx.getStatus() == TransactionStatus.CANCELLED) {
                continue;
            }
            if (tx.getTransactionType() == TransactionType.INCOME) {
                income = income.add(tx.getAmount());
            } else if (tx.getTransactionType() == TransactionType.EXPENSE) {
                expense = expense.add(tx.getAmount());
            }
        }

        BigDecimal totalAssets = assets.findByOwnerIdAndActiveTrue(ownerId).stream()
                .map(com.kovian.finance.asset.domain.FinancialAsset::getCurrentValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalLiabilities = liabilities.findByOwnerIdAndActiveTrue(ownerId).stream()
                .map(com.kovian.finance.liability.domain.FinancialLiability::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        totalLiabilities = totalLiabilities.add(
                debts.findByOwnerIdOrderByName(ownerId).stream()
                        .filter(d -> d.getStatus() == DebtStatus.ACTIVE)
                        .map(Debt::getOutstandingAmount)
                        .reduce(BigDecimal.ZERO, BigDecimal::add)
        );

        Optional<FinancialSnapshot> existing = snapshots.findByOwnerIdAndSnapshotDate(ownerId, date);
        if (existing.isPresent()) {
            return existing.get();
        }

        return snapshots.save(new FinancialSnapshot(
                ownerId, date, income, expense, totalAssets, totalLiabilities
        ));
    }

    @GetMapping
    public List<FinancialSnapshot> list() {
        return snapshots.findByOwnerIdOrderBySnapshotDateDesc(CurrentUser.ownerId());
    }
}
