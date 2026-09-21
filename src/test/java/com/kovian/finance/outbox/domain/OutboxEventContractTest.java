package com.kovian.finance.outbox.domain;

import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class OutboxEventContractTest {

    private static final UUID OWNER = UUID.randomUUID();
    private static final UUID AGGREGATE = UUID.randomUUID();

    @Test
    void acceptsVersionedEventNames() {
        assertThatCode(() -> new OutboxEvent(
                OWNER, "Notification", AGGREGATE, "NOTIFICATION_CREATED.v1", 1, "{}"
        )).doesNotThrowAnyException();
    }

    @Test
    void rejectsMalformedEventNames() {
        assertThatThrownBy(() -> new OutboxEvent(
                OWNER, "Notification", AGGREGATE, "NOTIFICATION CREATED!", 1, "{}"
        )).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void rejectsOversizedPayloads() {
        assertThatThrownBy(() -> new OutboxEvent(
                OWNER, "Notification", AGGREGATE, "NOTIFICATION_CREATED.v1", 1, "x".repeat(1_000_001)
        )).isInstanceOf(IllegalArgumentException.class);
    }
}
