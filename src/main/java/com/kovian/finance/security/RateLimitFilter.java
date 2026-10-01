package com.kovian.finance.security;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.HexFormat;
import java.util.UUID;

public class RateLimitFilter extends OncePerRequestFilter {
    private static final String ANONYMOUS_AUTH_PATH = "/api/v1/auth/anonymous";
    private static final long MAX_RETRY_AFTER_SECONDS = 3600L;
    private final StringRedisTemplate redis;
    private final int limit;
    private final int anonymousLimit;
    private final Duration window;
    private final boolean enabled;

    public RateLimitFilter(StringRedisTemplate redis, int limit, Duration window) { this(redis, limit, 10, window, true); }

    public RateLimitFilter(StringRedisTemplate redis, int limit, int anonymousLimit, Duration window, boolean enabled) {
        this.redis = redis;
        this.limit = Math.max(1, limit);
        this.anonymousLimit = Math.max(1, anonymousLimit);
        this.window = window.isZero() || window.isNegative() ? Duration.ofMinutes(1) : window;
        if (this.window.toMillis() <= 0) throw new IllegalArgumentException("Rate-limit window is too large or invalid.");
        this.enabled = enabled;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain) throws ServletException, IOException {
        if (!enabled) { chain.doFilter(req, res); return; }
        final boolean authenticated = CurrentUser.isAuthenticated();
        final String scope;
        final int currentLimit;
        if (authenticated) {
            UUID owner = CurrentUser.ownerId();
            scope = "owner:" + owner;
            currentLimit = limit;
        } else if (ANONYMOUS_AUTH_PATH.equals(req.getRequestURI()) && "POST".equalsIgnoreCase(req.getMethod())) {
            scope = "anonymous:" + digest(req.getRemoteAddr());
            currentLimit = anonymousLimit;
        } else { chain.doFilter(req, res); return; }

        String key = "kovian:rate:" + scope + ":" + System.currentTimeMillis() / window.toMillis();
        try {
            Long count = redis.opsForValue().increment(key);
            if (count != null && count == 1) redis.expire(key, window);
            long safeCount = count == null ? 0 : count;
            long remaining = Math.max(0, currentLimit - safeCount);
            res.setHeader("X-RateLimit-Limit", String.valueOf(currentLimit));
            res.setHeader("X-RateLimit-Remaining", String.valueOf(remaining));
            if (safeCount > currentLimit) {
                res.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                res.setHeader("Retry-After", retryAfterSeconds(window));
                res.setContentType("application/json");
                res.getWriter().write("{\"code\":\"RATE_LIMITED\",\"message\":\"Too many requests\"}");
                return;
            }
        } catch (RuntimeException ex) {
            res.setStatus(HttpStatus.SERVICE_UNAVAILABLE.value());
            res.setHeader("Retry-After", "5");
            res.setContentType("application/json");
            res.getWriter().write("{\"code\":\"RATE_LIMIT_BACKEND_UNAVAILABLE\",\"message\":\"Rate-limit service temporarily unavailable\"}");
            return;
        }
        chain.doFilter(req, res);
    }

    private static String retryAfterSeconds(Duration duration) {
        return String.valueOf(Math.max(1L, Math.min(MAX_RETRY_AFTER_SECONDS, duration.toSeconds())));
    }

    private static String digest(String value) {
        String input = value == null || value.isBlank() ? "unknown" : value;
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception ex) {
            return Integer.toHexString(input.hashCode());
        }
    }
}
