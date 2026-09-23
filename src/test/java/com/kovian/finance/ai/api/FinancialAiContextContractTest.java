package com.kovian.finance.ai.api;

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

class FinancialAiContextContractTest {

    @Test
    void rejectsInvalidRange() {
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> FinancialAiContextController.validateRange(
                        LocalDate.of(2026, 1, 2),
                        LocalDate.of(2026, 1, 1)
                )
        );
        assertEquals(400, ex.getStatusCode().value());
    }

    @Test
    void rejectsMissingRange() {
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> FinancialAiContextController.validateRange(null, LocalDate.of(2026, 1, 1))
        );
        assertEquals(400, ex.getStatusCode().value());
    }

    @Test
    void rejectsWindowOver365Days() {
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> FinancialAiContextController.validateRange(
                        LocalDate.of(2026, 1, 1),
                        LocalDate.of(2027, 1, 2)
                )
        );
        assertEquals(400, ex.getStatusCode().value());
    }

    @Test
    void acceptsMaximumWindow() {
        assertDoesNotThrow(() -> FinancialAiContextController.validateRange(
                LocalDate.of(2026, 1, 1),
                LocalDate.of(2027, 1, 1)
        ));
        assertEquals(365, ChronoUnit.DAYS.between(
                LocalDate.of(2026, 1, 1),
                LocalDate.of(2027, 1, 1)
        ));
    }
}
