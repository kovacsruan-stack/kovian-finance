package com.kovian.finance.integration.api;

import com.kovian.finance.integration.KillBillSubscriptionClient;
import com.kovian.finance.integration.LagoUsageBillingClient;
import com.kovian.finance.outbox.domain.OutboxStatus;
import com.kovian.finance.outbox.repository.OutboxEventRepository;
import com.kovian.finance.security.CurrentUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/integrations")
public class IntegrationStatusController {
    private final LagoUsageBillingClient lago;
    private final KillBillSubscriptionClient killBill;
    private final OutboxEventRepository outbox;

    public IntegrationStatusController(
            LagoUsageBillingClient lago,
            KillBillSubscriptionClient killBill,
            OutboxEventRepository outbox) {
        this.lago = lago;
        this.killBill = killBill;
        this.outbox = outbox;
    }

    @GetMapping("/status")
    public IntegrationStatus status() {
        UUID ownerId = CurrentUser.ownerId();
        return new IntegrationStatus(
                Map.of(
                        "lago", new AdapterStatus(lago.enabled(), lago.configured()),
                        "killbill", new AdapterStatus(killBill.enabled(), killBill.configured())
                ),
                new OutboxStatusSummary(
                        outbox.countByOwnerIdAndStatus(ownerId, OutboxStatus.PENDING),
                        outbox.countByOwnerIdAndStatus(ownerId, OutboxStatus.PROCESSING),
                        outbox.countByOwnerIdAndStatus(ownerId, OutboxStatus.FAILED)
                )
        );
    }

    public record AdapterStatus(boolean enabled, boolean configured) {}
    public record OutboxStatusSummary(long pending, long processing, long failed) {}
    public record IntegrationStatus(Map<String, AdapterStatus> adapters, OutboxStatusSummary outbox) {}
}
