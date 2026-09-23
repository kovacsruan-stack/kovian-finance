package com.kovian.finance.snapshot.api;

import com.kovian.finance.asset.repository.FinancialAssetRepository;
import com.kovian.finance.debt.repository.DebtRepository;
import com.kovian.finance.liability.repository.FinancialLiabilityRepository;
import com.kovian.finance.security.CurrentUser;
import com.kovian.finance.snapshot.repository.FinancialSnapshotRepository;
import com.kovian.finance.transaction.repository.FinancialTransactionRepository;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class SnapshotControllerTest {
    @Test
    void rebuild_usesAuthenticatedOwnerInsteadOfRequestOwner() {
        UUID authenticatedOwner = UUID.randomUUID();
        LocalDate date = LocalDate.of(2026, 9, 1);

        var snapshots = mock(FinancialSnapshotRepository.class);
        var assets = mock(FinancialAssetRepository.class);
        var liabilities = mock(FinancialLiabilityRepository.class);
        var debts = mock(DebtRepository.class);
        var transactions = mock(FinancialTransactionRepository.class);

        when(transactions.findByOwnerIdAndOccurredAtBetweenOrderByOccurredAtDesc(
                eq(authenticatedOwner), any(), any()
        )).thenReturn(List.of());
        when(assets.findByOwnerIdAndActiveTrue(authenticatedOwner)).thenReturn(List.of());
        when(liabilities.findByOwnerIdAndActiveTrue(authenticatedOwner)).thenReturn(List.of());
        when(debts.findByOwnerIdOrderByName(authenticatedOwner)).thenReturn(List.of());
        when(snapshots.findByOwnerIdAndSnapshotDate(authenticatedOwner, date)).thenReturn(Optional.empty());
        when(snapshots.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        SnapshotController controller = new SnapshotController(
                snapshots, assets, liabilities, debts, transactions
        );

        try (MockedStatic<CurrentUser> currentUser = mockStatic(CurrentUser.class)) {
            currentUser.when(CurrentUser::ownerId).thenReturn(authenticatedOwner);
            controller.rebuild(date);
        }

        verify(transactions).findByOwnerIdAndOccurredAtBetweenOrderByOccurredAtDesc(
                eq(authenticatedOwner), any(), any()
        );
        verify(snapshots).findByOwnerIdAndSnapshotDate(authenticatedOwner, date);
        verify(snapshots).save(any());
    }

    @Test
    void rebuild_refreshesExistingSnapshot() {
        UUID owner = UUID.randomUUID();
        LocalDate date = LocalDate.of(2026, 9, 1);
        var snapshots = mock(FinancialSnapshotRepository.class);
        var assets = mock(FinancialAssetRepository.class);
        var liabilities = mock(FinancialLiabilityRepository.class);
        var debts = mock(DebtRepository.class);
        var transactions = mock(FinancialTransactionRepository.class);
                when(transactions.findByOwnerIdAndOccurredAtBetweenOrderByOccurredAtDesc(eq(owner), any(), any())).thenReturn(List.of());
        when(assets.findByOwnerIdAndActiveTrue(owner)).thenReturn(List.of());
        when(liabilities.findByOwnerIdAndActiveTrue(owner)).thenReturn(List.of());
        when(debts.findByOwnerIdOrderByName(owner)).thenReturn(List.of());
        var existing = new com.kovian.finance.snapshot.domain.FinancialSnapshot(
                owner, date, java.math.BigDecimal.TEN, java.math.BigDecimal.ONE,
                java.math.BigDecimal.valueOf(100), java.math.BigDecimal.valueOf(10)
        );
        when(snapshots.findByOwnerIdAndSnapshotDate(owner, date)).thenReturn(Optional.of(existing));
        SnapshotController controller = new SnapshotController(snapshots, assets, liabilities, debts, transactions);
        try (MockedStatic<CurrentUser> currentUser = mockStatic(CurrentUser.class)) {
            currentUser.when(CurrentUser::ownerId).thenReturn(owner);
            controller.rebuild(date);
        }
        verify(snapshots, never()).save(any());
        assert existing.getNetWorth().compareTo(java.math.BigDecimal.ZERO) == 0;
    }

    @Test
    void list_usesAuthenticatedOwner() {
        UUID authenticatedOwner = UUID.randomUUID();
        var snapshots = mock(FinancialSnapshotRepository.class);
        var assets = mock(FinancialAssetRepository.class);
        var liabilities = mock(FinancialLiabilityRepository.class);
        var debts = mock(DebtRepository.class);
        var transactions = mock(FinancialTransactionRepository.class);
        when(snapshots.findByOwnerIdOrderBySnapshotDateDesc(authenticatedOwner)).thenReturn(List.of());

        SnapshotController controller = new SnapshotController(
                snapshots, assets, liabilities, debts, transactions
        );

        try (MockedStatic<CurrentUser> currentUser = mockStatic(CurrentUser.class)) {
            currentUser.when(CurrentUser::ownerId).thenReturn(authenticatedOwner);
            controller.list();
        }

        verify(snapshots).findByOwnerIdOrderBySnapshotDateDesc(authenticatedOwner);
    }
}
