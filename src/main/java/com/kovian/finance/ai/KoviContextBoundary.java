package com.kovian.finance.ai;

import java.util.LinkedHashMap;
import java.util.Map;

/** Bounds and minimizes financial context before it crosses into KOVI. */
public final class KoviContextBoundary {
    private static final int MAX_FIELDS = 100;
    private static final int MAX_VALUE_LENGTH = 4000;
    private KoviContextBoundary() {}
    public static Map<String,String> sanitize(Map<String,String> input) {
        if (input == null || input.size() > MAX_FIELDS) throw new IllegalArgumentException("Context is too large");
        var out = new LinkedHashMap<String,String>();
        input.forEach((k,v) -> { if (k != null && !k.isBlank() && v != null) out.put(k, v.length() > MAX_VALUE_LENGTH ? v.substring(0, MAX_VALUE_LENGTH) : v); });
        return Map.copyOf(out);
    }
}
