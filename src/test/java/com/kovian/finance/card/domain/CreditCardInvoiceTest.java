package com.kovian.finance.card.domain;

import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;

class CreditCardInvoiceTest {
    @Test
    void acceptsPurchasesOnlyWhileOpenAndTracksInvoiceTotal() {
        var invoice = new CreditCardInvoice(UUID.randomUUID(), UUID.randomUUID(),
                LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 10), LocalDate.of(2026, 10, 5));
        invoice.addAmount(new BigDecimal("125.50"));
        assertEquals(new BigDecimal("125.50"), invoice.getTotalAmount());
        invoice.close();
        assertThrows(IllegalStateException.class, () -> invoice.addAmount(new BigDecimal("10.00")));
    }

    @Test
    void paidInvoiceCannotBePaidTwiceAndCannotBeClosedAgain() {
        var invoice = new CreditCardInvoice(UUID.randomUUID(), UUID.randomUUID(),
                LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 10), LocalDate.of(2026, 10, 5));
        invoice.addAmount(new BigDecimal("90.00"));
        invoice.markPaid();
        invoice.markPaid();
        assertEquals(InvoiceStatus.PAID, invoice.getStatus());
        assertEquals(new BigDecimal("90.00"), invoice.getPaidAmount());
        assertThrows(IllegalStateException.class, invoice::close);
    }
}
