package com.kovian.finance.forecast.api;

import com.kovian.finance.account.repository.FinancialAccountRepository;
import com.kovian.finance.security.CurrentUser;
import com.kovian.finance.transaction.repository.FinancialTransactionRepository;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class ForecastControllerTest {
    @Test
    void cashFlow_usesAuthenticatedOwnerEvenWhenRequestOwnerIsOmitted() {
        UUID owner = UUID.randomUUID();
        var transactions = mock(FinancialTransactionRepository.class);
        var accounts = mock(FinancialAccountRepository.class);
        when(transactions.findByOwnerIdAndOccurredAtBetweenOrderByOccurredAtDesc(eq(owner), any(), any())).thenReturn(List.of());
        when(accounts.findByOwnerIdOrderByName(owner)).thenReturn(List.of());

        var controller = new ForecastController(transactions, accounts);

        try (MockedStatic<CurrentUser> currentUser = mockStatic(CurrentUser.class)) {
            currentUser.when(CurrentUser::ownerId).thenReturn(owner);
            var result = controller.cashFlow(null, LocalDate.of(2026, 9, 23), 1);
            verify(transactions).findByOwnerIdAndOccurredAtBetweenOrderByOccurredAtDesc(eq(owner), any(), any());
            verify(accounts).findByOwnerIdOrderByName(owner);
            org.junit.jupiter.api.Assertions.assertEquals(1, result.size());
        }
    }

    @Test
    void cashFlow_rejectsDifferentRequestOwner() {
        UUID owner = UUID.randomUUID();
        UUID otherOwner = UUID.randomUUID();
        var controller = new ForecastController(mock(FinancialTransactionRepository.class), mock(FinancialAccountRepository.class));

        try (MockedStatic<CurrentUser> currentUser = mockStatic(CurrentUser.class)) {
            currentUser.when(CurrentUser::ownerId).thenReturn(owner);
            assertThrows(org.springframework.web.server.ResponseStatusException.class,
                () -> controller.cashFlow(otherOwner, LocalDate.of(2026, 9, 23), 30));
        }
    }

    @Test
    void cashFlow_rejectsInvalidHorizon() {
        UUID owner = UUID.randomUUID();
        var controller = new ForecastController(mock(FinancialTransactionRepository.class), mock(FinancialAccountRepository.class));

        try (MockedStatic<CurrentUser> currentUser = mockStatic(CurrentUser.class)) {
            currentUser.when(CurrentUser::ownerId).thenReturn(owner);
            assertThrows(org.springframework.web.server.ResponseStatusException.class,
                () -> controller.cashFlow(null, LocalDate.of(2026, 9, 23), 366));
        }
    }
 @Test void cashFlow_rejectsMissingStartDate(){UUID owner=UUID.randomUUID();var c=new ForecastController(mock(FinancialTransactionRepository.class),mock(FinancialAccountRepository.class));try(MockedStatic<CurrentUser> u=mockStatic(CurrentUser.class)){u.when(CurrentUser::ownerId).thenReturn(owner);assertThrows(org.springframework.web.server.ResponseStatusException.class,()->c.cashFlow(null,null,30));}}

    @Test
    void cashFlow_ignoresCancelledTransactionsAndProjectsDailyNetFlow() {
        UUID owner = UUID.randomUUID();
        var transactions = mock(FinancialTransactionRepository.class);
        var accounts = mock(FinancialAccountRepository.class);
        var income = mock(com.kovian.finance.transaction.domain.FinancialTransaction.class);
        when(income.getStatus()).thenReturn(com.kovian.finance.transaction.domain.TransactionStatus.POSTED);
        when(income.getTransactionType()).thenReturn(com.kovian.finance.transaction.domain.TransactionType.INCOME);
        when(income.getAmount()).thenReturn(new java.math.BigDecimal("900"));
        var expense = mock(com.kovian.finance.transaction.domain.FinancialTransaction.class);
        when(expense.getStatus()).thenReturn(com.kovian.finance.transaction.domain.TransactionStatus.POSTED);
        when(expense.getTransactionType()).thenReturn(com.kovian.finance.transaction.domain.TransactionType.EXPENSE);
        when(expense.getAmount()).thenReturn(new java.math.BigDecimal("450"));
        var cancelled = mock(com.kovian.finance.transaction.domain.FinancialTransaction.class);
        when(cancelled.getStatus()).thenReturn(com.kovian.finance.transaction.domain.TransactionStatus.CANCELLED);
        when(cancelled.getTransactionType()).thenReturn(com.kovian.finance.transaction.domain.TransactionType.INCOME);
        when(cancelled.getAmount()).thenReturn(new java.math.BigDecimal("9000"));
        when(transactions.findByOwnerIdAndOccurredAtBetweenOrderByOccurredAtDesc(eq(owner), any(), any()))
            .thenReturn(List.of(income, expense, cancelled));
        var account = mock(com.kovian.finance.account.domain.FinancialAccount.class);
        when(account.getCurrentBalance()).thenReturn(new java.math.BigDecimal("100"));
        when(accounts.findByOwnerIdOrderByName(owner)).thenReturn(List.of(account));
        var controller = new ForecastController(transactions, accounts);

        try (MockedStatic<CurrentUser> currentUser = mockStatic(CurrentUser.class)) {
            currentUser.when(CurrentUser::ownerId).thenReturn(owner);
            var result = controller.cashFlow(null, LocalDate.of(2026, 9, 23), 2);
            org.junit.jupiter.api.Assertions.assertEquals(2, result.size());
            org.junit.jupiter.api.Assertions.assertEquals(new java.math.BigDecimal("10.0000"), result.get(0).income());
            org.junit.jupiter.api.Assertions.assertEquals(new java.math.BigDecimal("5.0000"), result.get(0).expense());
            org.junit.jupiter.api.Assertions.assertEquals(new java.math.BigDecimal("5.0000"), result.get(0).netCashFlow());
            org.junit.jupiter.api.Assertions.assertEquals(new java.math.BigDecimal("105.0000"), result.get(0).projectedBalance());
            org.junit.jupiter.api.Assertions.assertEquals(new java.math.BigDecimal("110.0000"), result.get(1).projectedBalance());
        }
    }
}
