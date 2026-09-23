package com.kovian.finance.notification.application;

import com.kovian.finance.card.repository.CreditCardInvoiceRepository;
import com.kovian.finance.debt.repository.DebtRepository;
import com.kovian.finance.goal.repository.FinancialGoalRepository;
import com.kovian.finance.recurring.repository.RecurringTransactionRepository;
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
        FinancialTransaction tx = mock(FinancialTransaction.class);
        when(tx.getStatus()).thenReturn(TransactionStatus.POSTED);
        when(tx.getTransactionType()).thenReturn(TransactionType.EXPENSE);
        when(tx.getAmount()).thenReturn(new BigDecimal("100.00"));

        FinancialTransactionRepository transactions = mock(FinancialTransactionRepository.class);
        when(transactions.findByOwnerIdAndOccurredAtBetweenOrderByOccurredAtDesc(eq(owner), any(), any()))
                .thenReturn(List.of(tx));

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
}
