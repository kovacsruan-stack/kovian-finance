package com.kovian.finance.integration;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
public class KovianAnalyticsRetentionService {
    private static final int RETENTION_DAYS = 730;
    private final JdbcTemplate jdbc;

    public KovianAnalyticsRetentionService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Scheduled(cron = "0 30 3 * * *")
    @Transactional
    public void purgeExpiredEvents() {
        jdbc.update("DELETE FROM kovian_analytics_event WHERE occurred_at < ? AND deleted_at IS NOT NULL",
                Instant.now().minus(RETENTION_DAYS, ChronoUnit.DAYS));
    }

    @Transactional
    public int deleteSubject(UUID tenantId, String subjectId) {
        return jdbc.update("UPDATE kovian_analytics_event SET deleted_at = CURRENT_TIMESTAMP WHERE tenant_id = ? AND subject_id = ? AND deleted_at IS NULL",
                tenantId, subjectId);
    }
}
