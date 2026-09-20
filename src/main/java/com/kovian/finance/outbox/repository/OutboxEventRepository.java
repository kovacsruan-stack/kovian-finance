package com.kovian.finance.outbox.repository;
import com.kovian.finance.outbox.domain.*; import org.springframework.data.jpa.repository.*; import java.time.OffsetDateTime; import java.util.*;
public interface OutboxEventRepository extends JpaRepository<OutboxEvent,UUID>{
 @Lock(LockModeType.PESSIMISTIC_WRITE)
 List<OutboxEvent> findTop100ByStatusAndAvailableAtLessThanEqualOrderByCreatedAtAsc(OutboxStatus status,OffsetDateTime now);
 @Lock(LockModeType.PESSIMISTIC_WRITE)
 List<OutboxEvent> findTop100ByStatusAndProcessingAtBeforeOrderByProcessingAtAsc(OutboxStatus status,OffsetDateTime cutoff);
 List<OutboxEvent> findTop100ByOwnerIdOrderByCreatedAtDesc(UUID ownerId);
 List<OutboxEvent> findTop100ByStatusAndAvailableAtLessThanEqualAndOwnerIdOrderByCreatedAtAsc(OutboxStatus status,OffsetDateTime now,UUID ownerId);
}