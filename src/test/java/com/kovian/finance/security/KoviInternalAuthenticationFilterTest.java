package com.kovian.finance.security;

import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.*;

class KoviInternalAuthenticationFilterTest {
    private static final String KEY = "12345678901234567890123456789012";

    @Test
    void rejectsMissingOrInvalidInternalKey() throws Exception {
        var filter = new KoviInternalAuthenticationFilter(KEY, new SimpleMeterRegistry());
        var request = new MockHttpServletRequest("GET", "/api/v1/internal/kovi/capabilities");
        var response = new MockHttpServletResponse();
        filter.doFilter(request, response, (req, res) -> fail("chain must not execute"));
        assertEquals(401, response.getStatus());
    }

    @Test
    void acceptsCorrectInternalKey() throws Exception {
        var filter = new KoviInternalAuthenticationFilter(KEY, new SimpleMeterRegistry());
        var request = new MockHttpServletRequest("GET", "/api/v1/internal/kovi/capabilities");
        request.addHeader("X-KOVI-INTERNAL-KEY", KEY);
        var response = new MockHttpServletResponse();
        var called = new boolean[1];
        filter.doFilter(request, response, (req, res) -> called[0] = true);
        assertTrue(called[0]);
        assertEquals(200, response.getStatus());
    }

    @Test
    void doesNotFilterNonInternalRoutes() throws Exception {
        var filter = new KoviInternalAuthenticationFilter(KEY, new SimpleMeterRegistry());
        var request = new MockHttpServletRequest("GET", "/api/v1/accounts");
        var response = new MockHttpServletResponse();
        var called = new boolean[1];
        filter.doFilter(request, response, (req, res) -> called[0] = true);
        assertTrue(called[0]);
        assertEquals(200, response.getStatus());
    }
}
