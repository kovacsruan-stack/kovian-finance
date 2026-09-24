package com.kovian.finance.notification.application;

import com.kovian.finance.card.repository.CreditCardInvoiceRepository;
import com.kovian.finance.debt.repository.DebtRepository;
import com.kovian.finance.debt.repository.DebtInstallmentRepository;
import com.kovian.finance.debt.domain.DebtInstallment;
import com.kovian.finance.debt.domain.InstallmentStatus;
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
        DebtInstallmentRepository installments = mock(DebtInstallmentRepository.class);
        RecurringTransactionRepository recurring = mock(RecurringTransactionRepository.class);
        FinancialGoalRepository goals = mock(FinancialGoalRepository.class);
        NotificationService notifications = mock(NotificationService.class);

        FinancialDueRules rules = new FinancialDueRules(
                invoices, debts, installments, recurring, goals, notifications, transactions);

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
                mock(DebtInstallmentRepository.class),
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
        UUID overdueId = UUID.randomUUID();
        when(overdue.getId()).thenReturn(overdueId);
        when(overdue.getNextOccurrence()).thenReturn(LocalDate.of(2026, 9, 15));

        RecurringTransactionRepository recurring = mock(RecurringTransactionRepository.class);
        when(recurring.findByOwnerIdAndActiveTrueAndNextOccurrenceLessThanEqual(eq(owner), eq(LocalDate.of(2026, 9, 19))))
                .thenReturn(java.util.List.of(overdue));

        NotificationService notifications = mock(NotificationService.class);
        FinancialTransactionRepository transactions = mock(FinancialTransactionRepository.class);
        when(transactions.sumPostedIncomeByOwnerAndOccurredAtBetween(any(), any(), any())).thenReturn(java.math.BigDecimal.ZERO);
        when(transactions.sumPostedExpenseByOwnerAndOccurredAtBetween(any(), any(), any())).thenReturn(java.math.BigDecimal.ZERO);
        FinancialDueRules rules = new FinancialDueRules(
                mock(CreditCardInvoiceRepository.class),
                mock(DebtRepository.class),
                mock(DebtInstallmentRepository.class),
                recurring,
                mock(FinancialGoalRepository.class),
                notifications,
                transactions);

        rules.evaluate(LocalDate.of(2026, 9, 20), owner);

        verify(notifications).createForOwner(
                eq(owner),
                eq("RECURRING_OVERDUE"),
                eq("WARNING"),
                anyString(),
                anyString(),
                eq("RecurringTransaction"),
                eq(overdueId),
                startsWith("recurring-overdue:"));
    }

    @Test
    void shouldNotifyOverdueAndUpcomingDebtInstallments() {
        UUID owner = UUID.randomUUID();
        DebtInstallmentRepository installments = mock(DebtInstallmentRepository.class);
        DebtInstallment overdue = mock(DebtInstallment.class);
        DebtInstallment upcoming = mock(DebtInstallment.class);
        UUID overdueId = UUID.randomUUID();
        UUID upcomingId = UUID.randomUUID();
        when(overdue.getId()).thenReturn(overdueId);
        when(overdue.getDueDate()).thenReturn(LocalDate.of(2026, 9, 20));
        when(upcoming.getId()).thenReturn(upcomingId);
        when(upcoming.getDueDate()).thenReturn(LocalDate.of(2026, 9, 26));
        when(installments.findByOwnerIdAndStatusAndDueDateBeforeOrderByDueDate(eq(owner), eq(InstallmentStatus.PENDING), eq(LocalDate.of(2026, 9, 24))))
                .thenReturn(java.util.List.of(overdue));
        when(installments.findByOwnerIdAndStatusAndDueDateBetweenOrderByDueDate(eq(owner), eq(InstallmentStatus.PENDING), eq(LocalDate.of(2026, 9, 24)), eq(LocalDate.of(2026, 9, 27))))
                .thenReturn(java.util.List.of(upcoming));
        NotificationService notifications = mock(NotificationService.class);
        FinancialTransactionRepository transactions = mock(FinancialTransactionRepository.class);
        when(transactions.sumPostedIncomeByOwnerAndOccurredAtBetween(any(), any(), any())).thenReturn(java.math.BigDecimal.ZERO);
        when(transactions.sumPostedExpenseByOwnerAndOccurredAtBetween(any(), any(), any())).thenReturn(java.math.BigDecimal.ZERO);

        FinancialDueRules rules = new FinancialDueRules(
                mock(CreditCardInvoiceRepository.class),
                mock(DebtRepository.class),
                installments,
                mock(RecurringTransactionRepository.class),
                mock(FinancialGoalRepository.class),
                notifications,
                transactions);

        rules.evaluate(LocalDate.of(2026, 9, 24), owner);

        verify(notifications).createForOwner(eq(owner), eq("DEBT_INSTALLMENT_OVERDUE"), eq("CRITICAL"), anyString(), anyString(), eq("DebtInstallment"), eq(overdueId), startsWith("debt-installment-overdue:"));
        verify(notifications).createForOwner(eq(owner), eq("DEBT_INSTALLMENT_DUE"), eq("WARNING"), anyString(), anyString(), eq("DebtInstallment"), eq(upcomingId), startsWith("debt-installment:"));
    }

    @Test
    void shouldCreateWarningForWeeklySpendingSpike() {
        UUID owner = UUID.randomUUID();
        FinancialTransactionRepository transactions = mock(FinancialTransactionRepository.class);
        when(transactions.sumPostedIncomeByOwnerAndOccurredAtBetween(eq(owner), any(), any())).thenReturn(java.math.BigDecimal.ZERO);
        when(transactions.sumPostedExpenseByOwnerAndOccurredAtBetween(eq(owner), any(), any()))
                .thenReturn(new java.math.BigDecimal("180.00"), new java.math.BigDecimal("100.00"), new java.math.BigDecimal("50.00"));
        NotificationService notifications = mock(NotificationService.class);

        FinancialDueRules rules = new FinancialDueRules(
                mock(CreditCardInvoiceRepository.class),
                mock(DebtRepository.class),
                mock(DebtInstallmentRepository.class),
                mock(RecurringTransactionRepository.class),
                mock(FinancialGoalRepository.class),
                notifications,
                transactions);

        rules.evaluate(LocalDate.of(2026, 9, 24), owner);

        verify(notifications).createForOwner(
                eq(owner), eq("SPENDING_SPIKE"), eq("WARNING"), anyString(), anyString(),
                eq("FinancialTransaction"), eq(owner), startsWith("spending-spike:"));
    }

}
