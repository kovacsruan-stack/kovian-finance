package com.kovian.finance.security;

import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import javax.crypto.spec.SecretKeySpec;

@Configuration
public class SecurityConfig {
    @Bean
    SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            OwnerIsolationFilter ownerIsolationFilter,
            RateLimitFilter rateLimitFilter,
            CorrelationIdFilter correlationIdFilter,
            KoviInternalAuthenticationFilter koviInternalAuthenticationFilter) throws Exception {
        http.cors(cors -> {})
            .csrf(AbstractHttpConfigurer::disable)
            .headers(headers -> headers
                .httpStrictTransportSecurity(h -> h.includeSubDomains(true).maxAgeInSeconds(31536000))
                .frameOptions(f -> f.deny())
                .contentTypeOptions(c -> {})
                .permissionsPolicyHeader(p -> p.policy("camera=(), microphone=(), geolocation=()"))
                .referrerPolicy(r -> r.policy(
                    org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER)))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/health", "/actuator/info", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .requestMatchers("/api/v1/internal/kovi/**").permitAll()
                .anyRequest().authenticated())
            .oauth2ResourceServer(oauth -> oauth.jwt(jwt ->
                jwt.jwtAuthenticationConverter(new JwtAuthenticationConverter())))
            .addFilterAfter(correlationIdFilter, BearerTokenAuthenticationFilter.class)
            .addFilterAfter(koviInternalAuthenticationFilter, CorrelationIdFilter.class)
            .addFilterAfter(rateLimitFilter, KoviInternalAuthenticationFilter.class)
            .addFilterAfter(ownerIsolationFilter, RateLimitFilter.class);
        return http.build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(
            @Value("${KOVIAN_CORS_ALLOWED_ORIGINS:http://localhost:5173}") String origins) {
        CorsConfiguration c = new CorsConfiguration();
        c.setAllowedOrigins(Arrays.stream(origins.split(",")).map(String::trim).filter(s -> !s.isBlank()).toList());
        c.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
        c.setAllowedHeaders(List.of("Authorization","Content-Type","Idempotency-Key","X-Request-ID","X-KOVI-INTERNAL-KEY"));
        c.setExposedHeaders(List.of("X-Request-ID","Retry-After"));
        c.setAllowCredentials(false);
        UrlBasedCorsConfigurationSource s = new UrlBasedCorsConfigurationSource();
        s.registerCorsConfiguration("/**", c);
        return s;
    }

    @Bean
    OwnerIsolationFilter ownerIsolationFilter(tools.jackson.databind.ObjectMapper mapper){ return new OwnerIsolationFilter(mapper); }

    @Bean
    KoviInternalAuthenticationFilter koviInternalAuthenticationFilter(
            @Value("${kovian.kovi.internal-api-key:}") String apiKey,
            MeterRegistry metrics){ return new KoviInternalAuthenticationFilter(apiKey, metrics); }

    @Bean
    CorrelationIdFilter correlationIdFilter(){ return new CorrelationIdFilter(); }

    @Bean
    RateLimitFilter rateLimitFilter(
            StringRedisTemplate redis,
            @Value("${KOVIAN_RATE_LIMIT:120}") int limit){
        return new RateLimitFilter(redis, limit, Duration.ofMinutes(1));
    }

    @Bean
    JwtDecoder jwtDecoder(@Value("${KOVIAN_JWT_SECRET}") String secret){
        if(secret == null || secret.length() < 32)
            throw new IllegalStateException("KOVIAN_JWT_SECRET must contain at least 32 characters");
        return NimbusJwtDecoder.withSecretKey(
            new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256")).build();
    }
}