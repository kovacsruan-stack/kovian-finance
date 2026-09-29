package com.kovian.finance.recurring.domain;

import com.kovian.finance.transaction.domain.TransactionType;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;

class RecurringTransactionTest {
    private RecurringTransaction item() {
        return new RecurringTransaction(
                UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), "Internet",
                new BigDecimal("120.00"), TransactionType.EXPENSE,
                RecurringFrequency.MONTHLY, LocalDate.of(2026, 9, 15),
                LocalDate.of(2026, 12, 15));
    }

    @Test
    void advancesMonthlyOccurrenceAndStopsAfterEndDate() {
        var item = item();
        item.advance();
        assertEquals(LocalDate.of(2026, 10, 15), item.getNextOccurrence());
        item.advance();
        item.advance();
        assertEquals(LocalDate.of(2026, 12, 15), item.getNextOccurrence());
        assertTrue(item.isActive());
        item.advance();
        assertEquals(LocalDate.of(2027, 1, 15), item.getNextOccurrence());
        assertFalse(item.isActive());
    }

    @Test
    void updateValidatesStateAndChangesSchedule() {
        var item = item();
        item.update(item.getAccountId(), item.getCategoryId(), "Novo valor",
                new BigDecimal("150.00"), TransactionType.EXPENSE,
                RecurringFrequency.WEEKLY, LocalDate.of(2026, 9, 20), null);
        assertEquals("Novo valor", item.getDescription());
        assertEquals(new BigDecimal("150.00"), item.getAmount());
        assertEquals(RecurringFrequency.WEEKLY, item.getFrequency());
        assertEquals(LocalDate.of(2026, 9, 20), item.getNextOccurrence());
    }

    @Test
    void pausedRecurringCannotBeEditedAndEndedRecurringCannotResume() {
        var item = item();
        item.pause();
        assertThrows(IllegalStateException.class, () -> item.update(
                item.getAccountId(), item.getCategoryId(), "Blocked",
                new BigDecimal("99.00"), TransactionType.EXPENSE,
                RecurringFrequency.MONTHLY, item.getNextOccurrence(), item.getEndDate()));

        var ended = new RecurringTransaction(
                UUID.randomUUID(), UUID.randomUUID(), null, "Ended",
                BigDecimal.TEN, TransactionType.EXPENSE,
                RecurringFrequency.MONTHLY, LocalDate.of(2026, 9, 1),
                LocalDate.of(2026, 9, 1));
        ended.advance();
        assertFalse(ended.isActive());
        assertThrows(IllegalStateException.class, ended::resume);
    }
}