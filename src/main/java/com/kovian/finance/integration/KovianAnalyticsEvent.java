package com.kovian.finance.integration;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;
import java.util.regex.Pattern;

public record KovianAnalyticsEvent(
        UUID id,
        UUID tenantId,
        String subjectId,
        String eventType,
        String source,
        String schemaVersion,
        Instant occurredAt,
        String purpose
) {
    private static final Pattern EVENT_TYPE = Pattern.compile("[a-z0-9][a-z0-9._:-]{1,127}");

    public KovianAnalyticsEvent {
        Objects.requireNonNull(id, "id");
        Objects.requireNonNull(tenantId, "tenantId");
        require(subjectId, 200, "subjectId");
        require(eventType, 128, "eventType");
        require(source, 80, "source");
        require(schemaVersion, 32, "schemaVersion");
        Objects.requireNonNull(occurredAt, "occurredAt");
        require(purpose, 120, "purpose");
        if (!"kovian.event.v1".equals(schemaVersion)) {
            throw new IllegalArgumentException("Unsupported analytics schema version");
        }
        if (!EVENT_TYPE.matcher(eventType).matches()) {
            throw new IllegalArgumentException("Invalid analytics event type");
        }
        if (occurredAt.isAfter(Instant.now())) {
            throw new IllegalArgumentException("Analytics event cannot be in the future");
        }
    }

    private static void require(String value, int max, String name) {
        if (value == null || value.isBlank() || value.length() > max) {
            throw new IllegalArgumentException("Invalid " + name);
        }
    }
}
