package com.kovian.finance.snapshot.api;

import com.kovian.finance.snapshot.domain.FinancialSnapshot;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record SnapshotResponse(
        UUID id,
        LocalDate snapshotDate,
        BigDecimal totalIncome,
        BigDecimal totalExpense,
        BigDecimal netCashFlow,
        BigDecimal totalAssets,
        BigDecimal totalLiabilities,
        BigDecimal netWorth
) {
    static SnapshotResponse from(FinancialSnapshot snapshot) {
        return new SnapshotResponse(
                snapshot.getId(),
                snapshot.getSnapshotDate(),
                snapshot.getTotalIncome(),
                snapshot.getTotalExpense(),
                snapshot.getNetCashFlow(),
                snapshot.getTotalAssets(),
                snapshot.getTotalLiabilities(),
                snapshot.getNetWorth()
        );
    }
}
