package com.kovian.finance.goal.domain;

import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;

class FinancialGoalTest {
    private FinancialGoal goal() {
        return new FinancialGoal(UUID.randomUUID(), "Emergency fund",
                new BigDecimal("1000.00"), OffsetDateTime.parse("2026-12-31T23:59:59Z"));
    }

    @Test
    void tracksContributionsAndCompletesAtTarget() {
        var goal = goal();
        goal.addContribution(new BigDecimal("250.00"));
        assertEquals(new BigDecimal("250.00"), goal.getCurrentAmount());
        assertTrue(goal.isActive());
        goal.addContribution(new BigDecimal("750.00"));
        assertEquals(new BigDecimal("1000.00"), goal.getCurrentAmount());
        assertFalse(goal.isActive());
    }

    @Test
    void rejectsInvalidAndOverTargetContributions() {
        var goal = goal();
        assertThrows(IllegalArgumentException.class, () -> goal.addContribution(BigDecimal.ZERO));
        assertThrows(IllegalArgumentException.class, () -> goal.addContribution(new BigDecimal("1000.01")));
        assertEquals(BigDecimal.ZERO, goal.getCurrentAmount());
    }

    @Test
    void updatesGoalWithoutAllowingTargetBelowSavedAmount() {
        var goal = goal();
        goal.addContribution(new BigDecimal("400.00"));
        goal.update("Home reserve", new BigDecimal("1200.00"), null);
        assertEquals("Home reserve", goal.getName());
        assertEquals(new BigDecimal("1200.00"), goal.getTargetAmount());
        assertThrows(IllegalArgumentException.class, () -> goal.update("Too small", new BigDecimal("300.00"), null));
    }

    @Test
    void archivedGoalsCannotReceiveContributionsOrBeEdited() {
        var goal = goal();
        goal.archive();
        assertFalse(goal.isActive());
        assertThrows(IllegalStateException.class, () -> goal.addContribution(BigDecimal.ONE));
        assertThrows(IllegalStateException.class, () -> goal.update("Renamed", new BigDecimal("2000.00"), null));
    }
}