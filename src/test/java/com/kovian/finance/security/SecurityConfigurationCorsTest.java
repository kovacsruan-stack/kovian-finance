package com.kovian.finance.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import static org.junit.jupiter.api.Assertions.assertTrue;

class SecurityConfigurationCorsTest {
    @Test
    void exposesConfiguredHostedFrontendOriginAndRequiredHeaders() {
        SecurityConfiguration configuration = new SecurityConfiguration();
        CorsConfigurationSource source = configuration.corsConfigurationSource(
                "https://kovian-gestao-33xv91.v2.appdeploy.ai,http://localhost:5174");

        CorsConfiguration cors = source.getCorsConfiguration(new MockHttpServletRequest());

        assertTrue(cors != null);
        assertTrue(cors.getAllowedOrigins().contains("https://kovian-gestao-33xv91.v2.appdeploy.ai"));
        assertTrue(cors.getAllowedMethods().contains("OPTIONS"));
        assertTrue(cors.getAllowedHeaders().contains("Authorization"));
        assertTrue(cors.getExposedHeaders().contains("X-Request-ID"));
    }
}
