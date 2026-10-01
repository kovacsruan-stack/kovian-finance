package com.kovian.finance.security;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import java.time.Duration;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class RateLimitFilterTest {
    @AfterEach void clearSecurity() { SecurityContextHolder.clearContext(); }

    @Test void limitsAnonymousSessionCreationByRemoteAddress() throws Exception {
        StringRedisTemplate redis = mock(StringRedisTemplate.class); ValueOperations<String, String> operations = mock(ValueOperations.class);
        when(redis.opsForValue()).thenReturn(operations); when(operations.increment(anyString())).thenReturn(11L);
        RateLimitFilter filter = new RateLimitFilter(redis, 240, 10, Duration.ofMinutes(1), true);
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/auth/anonymous"); request.setRemoteAddr("203.0.113.10");
        MockHttpServletResponse response = new MockHttpServletResponse(); FilterChain chain = mock(FilterChain.class);
        filter.doFilter(request, response, chain);
        assertEquals(429, response.getStatus()); assertEquals("10", response.getHeader("X-RateLimit-Limit")); assertEquals("60", response.getHeader("Retry-After")); verify(chain, never()).doFilter(request, response);
    }

    @Test void capsRetryAfterForLongWindows() throws Exception {
        StringRedisTemplate redis = mock(StringRedisTemplate.class); ValueOperations<String, String> operations = mock(ValueOperations.class);
        when(redis.opsForValue()).thenReturn(operations); when(operations.increment(anyString())).thenReturn(2L);
        RateLimitFilter filter = new RateLimitFilter(redis, 1, 1, Duration.ofDays(7), true);
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/auth/anonymous"); request.setRemoteAddr("203.0.113.10");
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, mock(FilterChain.class));
        assertEquals("3600", response.getHeader("Retry-After"));
    }

    @Test void passesUnrelatedAnonymousRequestsWithoutRedisDependency() throws Exception {
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        RateLimitFilter filter = new RateLimitFilter(redis, 240, 10, Duration.ofMinutes(1), true);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/health"); MockHttpServletResponse response = new MockHttpServletResponse(); FilterChain chain = mock(FilterChain.class);
        filter.doFilter(request, response, chain);
        verify(chain).doFilter(request, response); verifyNoInteractions(redis);
    }
}
