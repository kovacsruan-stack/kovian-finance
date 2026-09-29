package com.kovian.finance.security;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.OctetSequenceKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.proc.SecurityContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

@Configuration
@EnableWebSecurity
public class SecurityConfiguration {

    @Bean
    SecretKey financeJwtSecretKey(@Value("${KOVIAN_JWT_SECRET:}") String secret) {
        if (secret == null || secret.length() < 32) {
            throw new IllegalStateException("KOVIAN_JWT_SECRET must contain at least 32 characters");
        }
        return new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    }

    @Bean
    JwtDecoder financeJwtDecoder(SecretKey financeJwtSecretKey) {
        return NimbusJwtDecoder.withSecretKey(financeJwtSecretKey)
            .macAlgorithm(MacAlgorithm.HS256)
            .build();
    }

    @Bean
    JwtEncoder financeJwtEncoder(SecretKey financeJwtSecretKey) {
        var jwk = new OctetSequenceKey.Builder(financeJwtSecretKey.getEncoded())
            .algorithm(JWSAlgorithm.HS256)
            .keyID("kovian-finance")
            .build();
        var jwkSource = new ImmutableJWKSet<SecurityContext>(new JWKSet(jwk));
        return new NimbusJwtEncoder(jwkSource);
    }

    @Bean
    CorrelationIdFilter correlationIdFilter() {
        return new CorrelationIdFilter();
    }

    @Bean
    OwnerIsolationFilter ownerIsolationFilter(ObjectMapper objectMapper) {
        return new OwnerIsolationFilter(objectMapper);
    }

    @Bean
    RateLimitFilter rateLimitFilter(
            StringRedisTemplate redis,
            @Value("${kovian.security.rate-limit.enabled:true}") boolean enabled,
            @Value("${kovian.security.rate-limit.requests-per-minute:240}") int requestsPerMinute,
            @Value("${kovian.security.rate-limit.anonymous-requests-per-minute:10}") int anonymousRequestsPerMinute) {
        return new RateLimitFilter(redis, requestsPerMinute, anonymousRequestsPerMinute,
                java.time.Duration.ofMinutes(1), enabled);
    }

    @Bean
    SecurityFilterChain financeSecurityFilterChain(
            HttpSecurity http,
            JwtDecoder financeJwtDecoder,
            CorrelationIdFilter correlationIdFilter,
            OwnerIsolationFilter ownerIsolationFilter,
            RateLimitFilter rateLimitFilter) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .headers(headers -> headers
                .frameOptions(frame -> frame.deny())
                .referrerPolicy(referrer -> referrer.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER))
                .httpStrictTransportSecurity(hsts -> hsts.includeSubDomains(true).maxAgeInSeconds(31_536_000))
            )
            .authorizeHttpRequests(authorize -> authorize
                .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/v1/auth/anonymous").permitAll()
                .requestMatchers("/actuator/health", "/actuator/health/**", "/health", "/api/v1/health").permitAll()
                .anyRequest().authenticated())
            .httpBasic(basic -> basic.disable())
            .formLogin(form -> form.disable())
            .addFilterBefore(correlationIdFilter, BearerTokenAuthenticationFilter.class)
            .addFilterAfter(rateLimitFilter, BearerTokenAuthenticationFilter.class)
            .addFilterAfter(ownerIsolationFilter, BearerTokenAuthenticationFilter.class)
            .oauth2ResourceServer(resourceServer -> resourceServer
                .jwt(jwt -> jwt.decoder(financeJwtDecoder)));
        return http.build();
    }
}
