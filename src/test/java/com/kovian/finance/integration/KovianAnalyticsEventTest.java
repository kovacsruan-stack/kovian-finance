package com.kovian.finance.integration;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class KovianAnalyticsEventTest {
    @Test
    void acceptsValidEvent() {
        var event = new KovianAnalyticsEvent(
                UUID.randomUUID(), UUID.randomUUID(), "subject", "finance.transaction.created",
                "kovian-finance", "kovian.event.v1", Instant.now(), "product-analytics");
        assertEquals("kovian.event.v1", event.schemaVersion());
    }

    @Test
    void rejectsFutureEvent() {
        assertThrows(IllegalArgumentException.class, () -> new KovianAnalyticsEvent(
                UUID.randomUUID(), UUID.randomUUID(), "subject", "finance.transaction.created",
                "kovian-finance", "kovian.event.v1", Instant.now().plusSeconds(60), "analytics"));
    }
}
