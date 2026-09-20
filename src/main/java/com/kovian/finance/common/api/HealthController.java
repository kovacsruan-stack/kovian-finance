package com.kovian.finance.common.api;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;

@RestController
@RequestMapping("/api/v1/health")
public class HealthController {
    @GetMapping
    public HealthResponse health() {
        return new HealthResponse("ok", OffsetDateTime.now());
    }

    public record HealthResponse(String status, OffsetDateTime timestamp) {}
}
