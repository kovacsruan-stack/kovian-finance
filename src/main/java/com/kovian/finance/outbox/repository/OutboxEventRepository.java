package com.kovian.finance.outbox.repository;
import com.kovian.finance.outbox.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.OffsetDateTime; import java.util.*;
public interface OutboxEventRepository extends JpaRepository<OutboxEvent,UUID>{
 List<OutboxEvent> findTop100ByStatusAndAvailableAtLessThanEqualAndOwnerIdOrderByCreatedAtAsc(OutboxStatus status,OffsetDateTime now,UUID ownerId);
 List<OutboxEvent> findTop100ByOwnerIdOrderByCreatedAtDesc(UUID ownerId);
}