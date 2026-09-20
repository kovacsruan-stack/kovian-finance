package com.kovian.finance.integration;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Repository
public class KovianAnalyticsEventRepository {
    private final JdbcTemplate jdbc;
    private final ObjectMapper mapper;

    public KovianAnalyticsEventRepository(JdbcTemplate jdbc, ObjectMapper mapper) {
        this.jdbc = jdbc;
        this.mapper = mapper;
    }

    @Transactional
    public void append(KovianAnalyticsEvent event, Object payload) {
        try {
            jdbc.update("""
                INSERT INTO kovian_analytics_event
                    (id, tenant_id, subject_id, event_type, source, schema_version, occurred_at, purpose, payload)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, CAST(? AS jsonb))
                ON CONFLICT (tenant_id, id) DO NOTHING
                """,
                event.id(), event.tenantId(), event.subjectId(), event.eventType(),
                event.source(), event.schemaVersion(), event.occurredAt(), event.purpose(),
                mapper.writeValueAsString(payload));
        } catch (JsonProcessingException ex) {
            throw new IllegalArgumentException("Analytics payload is not serializable", ex);
        }
    }

    @Transactional
    public int markSubjectDeleted(UUID tenantId, String subjectId, Instant deletedAt) {
        return jdbc.update("""
            UPDATE kovian_analytics_event
               SET deleted_at = ?
             WHERE tenant_id = ?
               AND subject_id = ?
               AND deleted_at IS NULL
            """, deletedAt, tenantId, subjectId);
    }
}
