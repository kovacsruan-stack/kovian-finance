package com.kovian.finance.ai;

import java.util.Objects;

/** Fail-closed policy for KOVI access to Finance domain facts. */
public final class KoviIntelligencePolicy {
    private KoviIntelligencePolicy() {}
    public static boolean allowsRead(String permission, String tenantId, String requestedTenantId) {
        return "finance.read".equals(permission) && tenantId != null && !tenantId.isBlank()
                && Objects.equals(tenantId, requestedTenantId);
    }
    public static boolean allowsMutation(String permission) {
        return "finance.mutation".equals(permission) && false;
    }
}
