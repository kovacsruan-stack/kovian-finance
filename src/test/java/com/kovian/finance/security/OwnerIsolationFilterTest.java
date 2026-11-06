package com.kovian.finance.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

import java.util.List;
import java.util.UUID;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import tools.jackson.databind.ObjectMapper;

class OwnerIsolationFilterTest {
    private static final UUID AUTHENTICATED_OWNER =
            UUID.fromString("a1b2c3d4-e5f6-4789-8123-456789abcdef");

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void rejectsQueryOwnerThatDiffersFromAuthenticatedOwner() throws Exception {
        authenticateAs(AUTHENTICATED_OWNER);
        OwnerIsolationFilter filter = new OwnerIsolationFilter(mock(ObjectMapper.class));
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/transactions");
        request.setParameter("ownerId", "b1b2c3d4-e5f6-4789-8123-456789abcdef");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        assertEquals(403, response.getStatus());
        verify(chain, never()).doFilter(request, response);
    }

    @Test
    void rejectsMalformedQueryOwnerInsteadOfIgnoringIt() throws Exception {
        authenticateAs(AUTHENTICATED_OWNER);
        OwnerIsolationFilter filter = new OwnerIsolationFilter(mock(ObjectMapper.class));
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/transactions");
        request.setParameter("ownerId", "not-a-uuid");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        assertEquals(403, response.getStatus());
        verify(chain, never()).doFilter(request, response);
    }

    @Test
    void rejectsJsonBodyOwnerThatDiffersFromAuthenticatedOwner() throws Exception {
        authenticateAs(AUTHENTICATED_OWNER);
        OwnerIsolationFilter filter = new OwnerIsolationFilter(new ObjectMapper());
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/transactions");
        request.setContentType("application/json");
        request.setContent("{\"ownerId\":\"b1b2c3d4-e5f6-4789-8123-456789abcdef\"}".getBytes(java.nio.charset.StandardCharsets.UTF_8));
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        assertEquals(403, response.getStatus());
        verifyNoInteractions(chain);
    }

    @Test
    void rejectsMalformedJsonBodyOwnerInsteadOfIgnoringIt() throws Exception {
        authenticateAs(AUTHENTICATED_OWNER);
        OwnerIsolationFilter filter = new OwnerIsolationFilter(new ObjectMapper());
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/transactions");
        request.setContentType("application/json");
        request.setContent("{\"ownerId\":\"not-a-uuid\"}".getBytes(java.nio.charset.StandardCharsets.UTF_8));
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        assertEquals(403, response.getStatus());
        verifyNoInteractions(chain);
    }

    @Test
    void allowsQueryOwnerMatchingAuthenticatedOwner() throws Exception {
        authenticateAs(AUTHENTICATED_OWNER);
        OwnerIsolationFilter filter = new OwnerIsolationFilter(mock(ObjectMapper.class));
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/transactions");
        request.setParameter("ownerId", AUTHENTICATED_OWNER.toString());
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        assertEquals(200, response.getStatus());
        verify(chain).doFilter(request, response);
    }

    private static void authenticateAs(UUID ownerId) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(ownerId.toString(), "test", List.of()));
    }
}
