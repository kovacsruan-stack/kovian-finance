package com.kovian.finance.security;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
public class AnonymousAuthController {
    private static final Duration SESSION_LIFETIME = Duration.ofDays(30);
    private final JwtEncoder jwtEncoder;

    public AnonymousAuthController(JwtEncoder jwtEncoder) {
        this.jwtEncoder = jwtEncoder;
    }

    @PostMapping("/anonymous")
    public Map<String, Object> createAnonymousSession(@Valid @RequestBody AnonymousSessionRequest request) {
        UUID deviceId = UUID.fromString(request.deviceId());
        Instant now = Instant.now();
        Instant expiresAt = now.plus(SESSION_LIFETIME);
        JwtClaimsSet claims = JwtClaimsSet.builder()
            .issuer("kovian-finance")
            .subject(deviceId.toString())
            .issuedAt(now)
            .expiresAt(expiresAt)
            .claim("type", "access")
            .claim("role", "anonymous")
            .build();
        String accessToken = jwtEncoder.encode(JwtEncoderParameters.from(
            JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();

        Map<String, Object> user = Map.of(
            "id", deviceId.toString(),
            "email", "anonymous-" + deviceId + "@anonymous.kovian.invalid",
            "role", "anonymous",
            "is_active", true
        );
        return Map.of(
            "user", user,
            "access_token", accessToken,
            "token_type", "bearer",
            "expires_in", SESSION_LIFETIME.toSeconds()
        );
    }

    public record AnonymousSessionRequest(
        @JsonProperty("device_id")
        @NotBlank
        @Pattern(regexp = "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89aAbB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$")
        String deviceId
    ) {}
}
