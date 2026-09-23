package com.kovian.finance.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import jakarta.servlet.FilterChain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class CorrelationIdFilterTest {
    @Test
    void acceptsRequestIdAndEchoesBothHeaders() throws Exception {
        var filter = new CorrelationIdFilter();
        var request = new MockHttpServletRequest();
        var response = new MockHttpServletResponse();
        request.addHeader("X-Request-ID", "qa-request-123");
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        assertThat(response.getHeader("X-Correlation-Id")).isEqualTo("qa-request-123");
        assertThat(response.getHeader("X-Request-ID")).isEqualTo("qa-request-123");
        assertThat(response.getHeader("Cache-Control")).isEqualTo("no-store");
        verify(chain).doFilter(request, response);
    }

    @Test
    void replacesUnsafeCorrelationValues() throws Exception {
        var filter = new CorrelationIdFilter();
        var request = new MockHttpServletRequest();
        var response = new MockHttpServletResponse();
        request.addHeader("X-Request-ID", "bad value with spaces");
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        assertThat(response.getHeader("X-Correlation-Id")).matches("[A-Za-z0-9._:-]+");
        assertThat(response.getHeader("X-Request-ID")).matches("[A-Za-z0-9._:-]+");
        verify(chain).doFilter(request, response);
    }
}
