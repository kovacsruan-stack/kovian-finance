package com.kovian.finance.ai;

import java.time.OffsetDateTime;

public final class FinancialNotificationPolicy {
    public boolean allows(String tenantId, String title, String body, boolean critical, OffsetDateTime now) {
        if (tenantId == null || tenantId.isBlank() || title == null || title.isBlank() || body == null || body.isBlank()) return false;
        if (title.length() > 200 || body.length() > 4000) return false;
        if (critical) return true;
        int hour = now.getHour();
        return hour >= 6 && hour < 22;
    }
}
