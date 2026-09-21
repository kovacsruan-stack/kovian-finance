package com.kovian.finance.outbox.repository;
import com.kovian.finance.outbox.domain.*; import org.springframework.data.jpa.repository.*;
import jakarta.persistence.LockModeType; import org.springframework.data.repository.query.Param; import java.time.OffsetDateTime; import java.util.*;
public interface OutboxEventRepository extends JpaRepository<OutboxEvent,UUID>{
 @Lock(LockModeType.PESSIMISTIC_WRITE)
 @Query(value="select * from outbox_events where status = :status and available_at <= :now order by created_at asc limit 100 for update skip locked",nativeQuery=true)
 List<OutboxEvent> claimPending(@Param("status")String status,@Param("now")OffsetDateTime now);

 @Lock(LockModeType.PESSIMISTIC_WRITE)
 List<OutboxEvent> findTop100ByStatusAndAvailableAtLessThanEqualOrderByCreatedAtAsc(OutboxStatus status,OffsetDateTime now);
 @Lock(LockModeType.PESSIMISTIC_WRITE)
 List<OutboxEvent> findTop100ByStatusAndProcessingAtBeforeOrderByProcessingAtAsc(OutboxStatus status,OffsetDateTime cutoff);
 List<OutboxEvent> findTop100ByOwnerIdOrderByCreatedAtDesc(UUID ownerId);
 List<OutboxEvent> findTop100ByStatusAndAvailableAtLessThanEqualAndOwnerIdOrderByCreatedAtAsc(OutboxStatus status,OffsetDateTime now,UUID ownerId);
}