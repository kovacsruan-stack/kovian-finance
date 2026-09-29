package com.kovian.finance.card.domain;

import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;

class CreditCardInvoiceTest {
    @Test
    void acceptsPurchasesOnlyWhileOpenAndTracksInvoiceTotal() {
        var invoice = invoice();
        invoice.addAmount(new BigDecimal("125.50"));
        assertEquals(new BigDecimal("125.50"), invoice.getTotalAmount());
        invoice.close();
        assertThrows(IllegalStateException.class, () -> invoice.addAmount(new BigDecimal("10.00")));
    }

    @Test
    void supportsMultiplePartialPaymentsAndClosesAtExactTotal() {
        var invoice = invoice();
        invoice.addAmount(new BigDecimal("100.00"));
        invoice.close();

        invoice.applyPayment(new BigDecimal("35.00"));
        assertEquals(new BigDecimal("35.00"), invoice.getPaidAmount());
        assertEquals(new BigDecimal("65.00"), invoice.getRemainingAmount());
        assertEquals(InvoiceStatus.CLOSED, invoice.getStatus());

        invoice.applyPayment(new BigDecimal("65.00"));
        assertEquals(new BigDecimal("100.00"), invoice.getPaidAmount());
        assertEquals(BigDecimal.ZERO, invoice.getRemainingAmount());
        assertEquals(InvoiceStatus.PAID, invoice.getStatus());
    }

    @Test
    void rejectsPaymentsThatAreInvalidOrExceedTheRemainingBalance() {
        var invoice = invoice();
        invoice.addAmount(new BigDecimal("50.00"));
        assertThrows(IllegalArgumentException.class, () -> invoice.applyPayment(BigDecimal.ZERO));
        assertThrows(IllegalArgumentException.class, () -> invoice.applyPayment(new BigDecimal("50.01")));
    }

    @Test
    void paidInvoiceCannotBePaidAgainAndCannotBeClosedAgain() {
        var invoice = invoice();
        invoice.addAmount(new BigDecimal("90.00"));
        invoice.applyPayment(new BigDecimal("90.00"));
        assertEquals(InvoiceStatus.PAID, invoice.getStatus());
        assertEquals(new BigDecimal("90.00"), invoice.getPaidAmount());
        assertThrows(IllegalStateException.class, invoice::close);
        assertThrows(IllegalStateException.class, () -> invoice.applyPayment(BigDecimal.ONE));
    }

    private CreditCardInvoice invoice() {
        return new CreditCardInvoice(UUID.randomUUID(), UUID.randomUUID(),
                LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 10), LocalDate.of(2026, 10, 5));
    }
}