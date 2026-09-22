package com.kovian.finance.integration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Component
public class KillBillSubscriptionClient {
    private final RestClient client;
    private final boolean enabled;
    private final String subscriptionPath;
    private final String apiKey;

    public KillBillSubscriptionClient(
            @Value("${kovian.accelerators.killbill.enabled:false}") boolean enabled,
            @Value("${kovian.accelerators.killbill.base-url:}") String baseUrl,
            @Value("${kovian.accelerators.killbill.subscription-path:/1.0/kb/accounts}") String subscriptionPath,
            @Value("${kovian.accelerators.killbill.api-key:}") String apiKey) {
        this.enabled = enabled;
        this.subscriptionPath = subscriptionPath;
        this.apiKey = apiKey;
        this.client = RestClient.builder().baseUrl(baseUrl.replaceAll("/+$", "")).build();
        if (enabled && (baseUrl.isBlank() || apiKey.isBlank())) {
            throw new IllegalStateException("Kill Bill adapter enabled without base URL and API key.");
        }
    }

    public boolean enabled() {
        return enabled;
    }

    public void submitSubscription(Map<String, Object> subscription) {
        if (!enabled) return;
        client.post().uri(subscriptionPath)
                .header("X-Killbill-ApiKey", apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(subscription)
                .retrieve().toBodilessEntity();
    }
}
