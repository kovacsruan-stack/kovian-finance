package com.kovian.finance.audit.application;

import com.kovian.finance.audit.domain.AuditEvent;
import com.kovian.finance.audit.repository.AuditEventRepository;
import com.kovian.finance.security.CurrentUser;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import java.util.UUID;

@Service
public class AuditService {
    private final AuditEventRepository repository;
    private final HttpServletRequest request;

    public AuditService(AuditEventRepository repository, HttpServletRequest request) {
        this.repository = repository;
        this.request = request;
    }

    public void record(String action, String entityType, UUID entityId, String metadata) {
        UUID ownerId = CurrentUser.ownerId();
        String correlationId = request.getHeader("X-Correlation-Id");
        repository.save(new AuditEvent(ownerId, CurrentUser.actorId(), action, entityType, entityId,
            metadata == null ? null : sanitize(metadata), correlationId));
    }

    private String sanitize(String metadata) {
        return metadata.replaceAll("(?i)(password|token|secret|authorization)\\s*[:=]\\s*[^,; ]+", "$1=[REDACTED]");
    }
}
