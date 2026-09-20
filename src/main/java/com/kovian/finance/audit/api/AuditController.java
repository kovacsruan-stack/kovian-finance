package com.kovian.finance.audit.api;

import com.kovian.finance.audit.domain.AuditEvent;
import com.kovian.finance.audit.repository.AuditEventRepository;
import com.kovian.finance.security.CurrentUser;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/audit")
public class AuditController {
    private final AuditEventRepository repository;
    public AuditController(AuditEventRepository repository){ this.repository = repository; }

    @GetMapping
    List<AuditEventResponse> list() {
        return repository.findByOwnerIdOrderByOccurredAtDesc(CurrentUser.ownerId()).stream()
            .map(e -> new AuditEventResponse(e.getId(), e.getAction(), e.getEntityType(), e.getEntityId(),
                e.getMetadata(), e.getCorrelationId(), e.getOccurredAt()))
            .toList();
    }

    public record AuditEventResponse(java.util.UUID id, String action, String entityType,
                                     java.util.UUID entityId, String metadata, String correlationId,
                                     java.time.OffsetDateTime occurredAt) {}
}
