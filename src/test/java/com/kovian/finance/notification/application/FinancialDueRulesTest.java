package com.kovian.finance.notification.application;

import com.kovian.finance.card.repository.CreditCardInvoiceRepository;
import com.kovian.finance.debt.repository.DebtRepository;
import com.kovian.finance.goal.repository.FinancialGoalRepository;
import com.kovian.finance.recurring.repository.RecurringTransactionRepository;
import com.kovian.finance.recurring.domain.RecurringTransaction;
import com.kovian.finance.transaction.repository.FinancialTransactionRepository;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class FinancialDueRulesTest {

    @Test
    void shouldCreateCashFlowRiskWhenThirtyDayExpensesExceedIncome() {
        UUID owner = UUID.randomUUID();

        FinancialTransactionRepository transactions = mock(FinancialTransactionRepository.class);
        when(transactions.sumPostedIncomeByOwnerAndOccurredAtBetween(eq(owner), any(), any()))
                .thenReturn(java.math.BigDecimal.ZERO);
        when(transactions.sumPostedExpenseByOwnerAndOccurredAtBetween(eq(owner), any(), any()))
                .thenReturn(new java.math.BigDecimal("100.00"));

        CreditCardInvoiceRepository invoices = mock(CreditCardInvoiceRepository.class);
        DebtRepository debts = mock(DebtRepository.class);
        RecurringTransactionRepository recurring = mock(RecurringTransactionRepository.class);
        FinancialGoalRepository goals = mock(FinancialGoalRepository.class);
        NotificationService notifications = mock(NotificationService.class);

        FinancialDueRules rules = new FinancialDueRules(
                invoices, debts, recurring, goals, notifications, transactions);

        rules.evaluate(LocalDate.of(2026, 9, 20), owner);

        verify(notifications).createForOwner(
                eq(owner),
                eq("CASH_FLOW_RISK"),
                eq("WARNING"),
                anyString(),
                anyString(),
                eq("FinancialTransaction"),
                eq(owner),
                startsWith("cash-risk:"));
    }

    @Test
    void shouldUsePostedAggregatesInsteadOfLoadingThirtyDaysOfTransactions() {
        UUID owner = UUID.randomUUID();

        FinancialTransactionRepository transactions = mock(FinancialTransactionRepository.class);
        when(transactions.sumPostedIncomeByOwnerAndOccurredAtBetween(eq(owner), any(), any()))
                .thenReturn(new java.math.BigDecimal("200.00"));
        when(transactions.sumPostedExpenseByOwnerAndOccurredAtBetween(eq(owner), any(), any()))
                .thenReturn(new java.math.BigDecimal("150.00"));

        FinancialDueRules rules = new FinancialDueRules(
                mock(CreditCardInvoiceRepository.class),
                mock(DebtRepository.class),
                mock(RecurringTransactionRepository.class),
                mock(FinancialGoalRepository.class),
                mock(NotificationService.class),
                transactions);

        rules.evaluate(LocalDate.of(2026, 9, 20), owner);

        verify(transactions, never()).findByOwnerIdAndOccurredAtBetweenOrderByOccurredAtDesc(
                eq(owner), any(), any());
    }
    @Test
    void shouldCreateWarningForOverdueRecurringTransaction() {
        UUID owner = UUID.randomUUID();
        RecurringTransaction overdue = mock(RecurringTransaction.class);
        when(overdue.getId()).thenReturn(UUID.randomUUID());
        when(overdue.getNextOccurrence()).thenReturn(LocalDate.of(2026, 9, 15));

        RecurringTransactionRepository recurring = mock(RecurringTransactionRepository.class);
        when(recurring.findByOwnerIdAndActiveTrueAndNextOccurrenceLessThanEqual(eq(owner), eq(LocalDate.of(2026, 9, 19))))
                .thenReturn(java.util.List.of(overdue));

        NotificationService notifications = mock(NotificationService.class);
        FinancialDueRules rules = new FinancialDueRules(
                mock(CreditCardInvoiceRepository.class),
                mock(DebtRepository.class),
                recurring,
                mock(FinancialGoalRepository.class),
                notifications,
                mock(FinancialTransactionRepository.class));

        rules.evaluate(LocalDate.of(2026, 9, 20), owner);

        verify(notifications).createForOwner(
                eq(owner),
                eq("RECURRING_OVERDUE"),
                eq("WARNING"),
                anyString(),
                anyString(),
                eq("RecurringTransaction"),
                eq(overdue.getId()),
                startsWith("recurring-overdue:"));
    }

}
