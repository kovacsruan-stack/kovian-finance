package com.kovian.finance.integration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Component
public class LagoUsageBillingClient {
    private final RestClient client;
    private final boolean enabled;
    private final String usagePath;
    private final String apiKey;

    public LagoUsageBillingClient(
            @Value("${kovian.accelerators.lago.enabled:false}") boolean enabled,
            @Value("${kovian.accelerators.lago.base-url:}") String baseUrl,
            @Value("${kovian.accelerators.lago.usage-path:/api/v1/events}") String usagePath,
            @Value("${kovian.accelerators.lago.api-key:}") String apiKey) {
        this.enabled = enabled;
        this.usagePath = usagePath;
        this.apiKey = apiKey;
        this.client = RestClient.builder().baseUrl(baseUrl.replaceAll("/+$", "")).build();
        if (enabled && (baseUrl.isBlank() || apiKey.isBlank())) {
            throw new IllegalStateException("Lago adapter enabled without base URL and API key.");
        }
    }

    public boolean enabled() {
        return enabled;
    }

    public void recordUsage(Map<String, Object> event) {
        if (!enabled) return;
        client.post().uri(usagePath)
                .header("Authorization", "Bearer " + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(event)
                .retrieve().toBodilessEntity();
    }
}
