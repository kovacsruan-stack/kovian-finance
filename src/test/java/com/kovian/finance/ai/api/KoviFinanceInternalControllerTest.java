package com.kovian.finance.ai.api;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.kovian.finance.account.repository.FinancialAccountRepository;
import com.kovian.finance.transaction.domain.TransactionStatus;
import com.kovian.finance.transaction.domain.TransactionType;
import com.kovian.finance.transaction.repository.FinancialTransactionRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.server.ResponseStatusException;

class KoviFinanceInternalControllerTest {
    private static final String API_KEY = "0123456789abcdef0123456789abcdef";

    private final FinancialAiContextController context = mock(FinancialAiContextController.class);
    private final FinancialTransactionRepository transactions = mock(FinancialTransactionRepository.class);
    private final FinancialAccountRepository accounts = mock(FinancialAccountRepository.class);
    private final KoviFinanceInternalController controller =
        new KoviFinanceInternalController(context, transactions, accounts, API_KEY);

    @Test
    void transactionFederationAppliesLimitInDatabaseQuery() {
        UUID ownerId = UUID.randomUUID();
        LocalDate from = LocalDate.of(2026, 1, 1);
        LocalDate to = LocalDate.of(2026, 1, 31);
        OffsetDateTime start = from.atStartOfDay().atOffset(ZoneOffset.UTC);
        OffsetDateTime end = to.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC);
        when(transactions.findRecentNonCancelledByOwnerInWindow(
            ownerId, start, end, TransactionStatus.CANCELLED, PageRequest.of(0, 25)
        )).thenReturn(List.of());

        assertTrue(controller.transactions(API_KEY, ownerId, from, to, 25).isEmpty());

        verify(transactions).findRecentNonCancelledByOwnerInWindow(
            ownerId, start, end, TransactionStatus.CANCELLED, PageRequest.of(0, 25)
        );
    }

    @Test
    void transactionFederationRejectsOutOfRangeLimitBeforeDatabaseAccess() {
        assertThrows(ResponseStatusException.class,
            () -> controller.transactions(API_KEY, UUID.randomUUID(), null, null, 101));
        verifyNoInteractions(transactions);
    }


    @Test
    void cashFlowUsesDailyDatabaseAggregationInsteadOfLoadingTransactions() {
        UUID ownerId = UUID.randomUUID();
        LocalDate from = LocalDate.of(2026, 1, 1);
        LocalDate to = LocalDate.of(2026, 1, 31);
        OffsetDateTime start = from.atStartOfDay().atOffset(ZoneOffset.UTC);
        OffsetDateTime end = to.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC);
        var projection = new com.kovian.finance.transaction.repository.DailyCashFlowProjection() {
            @Override public LocalDate getDate() { return LocalDate.of(2026, 1, 2); }
            @Override public BigDecimal getNet() { return new BigDecimal("125.50"); }
        };
        when(transactions.findDailyCashFlowByOwnerInWindow(
            ownerId, start, end, TransactionStatus.CANCELLED.name()
        )).thenReturn(List.of(projection));

        var result = controller.cashFlow(API_KEY, ownerId, from, to);

        @SuppressWarnings("unchecked")
        List<java.util.Map<String, Object>> points = (List<java.util.Map<String, Object>>) result.get("points");
        assertEquals(1, points.size());
        assertEquals("2026-01-02", points.get(0).get("date"));
        assertEquals(new BigDecimal("125.50"), points.get(0).get("net"));
        verify(transactions).findDailyCashFlowByOwnerInWindow(
            ownerId, start, end, TransactionStatus.CANCELLED.name()
        );
        verifyNoInteractions(context, accounts);
    }

    @Test
    void cashFlowRejectsInvalidWindowBeforeDatabaseAccess() {
        LocalDate from = LocalDate.of(2026, 1, 1);
        LocalDate to = LocalDate.of(2027, 2, 2);
        assertThrows(ResponseStatusException.class,
            () -> controller.cashFlow(API_KEY, UUID.randomUUID(), from, to));
        verifyNoInteractions(transactions);
    }

    @Test
    void revenueUsesDatabaseAggregatesInsteadOfLoadingEveryTransaction() {
        UUID ownerId = UUID.randomUUID();
        LocalDate from = LocalDate.of(2026, 1, 1);
        LocalDate to = LocalDate.of(2026, 1, 31);
        OffsetDateTime start = from.atStartOfDay().atOffset(ZoneOffset.UTC);
        OffsetDateTime end = to.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC);
        when(transactions.sumNonCancelledByOwnerAndTypeInWindow(
            ownerId, TransactionType.INCOME, TransactionStatus.CANCELLED, start, end
        )).thenReturn(new BigDecimal("2500.00"));
        when(transactions.sumNonCancelledByOwnerAndTypeInWindow(
            ownerId, TransactionType.EXPENSE, TransactionStatus.CANCELLED, start, end
        )).thenReturn(new BigDecimal("1750.00"));

        var result = controller.revenue(API_KEY, from, to, ownerId);

        assertEquals(new BigDecimal("2500.00"), result.get("income"));
        assertEquals(new BigDecimal("1750.00"), result.get("expense"));
        assertEquals(new BigDecimal("750.00"), result.get("net"));
        verify(transactions).sumNonCancelledByOwnerAndTypeInWindow(
            ownerId, TransactionType.INCOME, TransactionStatus.CANCELLED, start, end
        );
        verify(transactions).sumNonCancelledByOwnerAndTypeInWindow(
            ownerId, TransactionType.EXPENSE, TransactionStatus.CANCELLED, start, end
        );
    }
}
