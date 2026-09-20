package com.kovian.finance.outbox.application;
import com.kovian.finance.outbox.domain.*; import com.kovian.finance.outbox.repository.OutboxEventRepository; import org.springframework.scheduling.annotation.Scheduled; import org.springframework.stereotype.Service; import org.springframework.transaction.annotation.Transactional; import java.time.OffsetDateTime; import java.util.*;
@Service public class OutboxDispatcherService{
 private final OutboxEventRepository repository; private final OutboxEventPublisher publisher;
 public OutboxDispatcherService(OutboxEventRepository r,OutboxEventPublisher p){repository=r;publisher=p;}
 @Scheduled(fixedDelayString="${kovian.outbox.dispatch-interval-ms:5000}")
 public void dispatch(){for(OutboxEvent event:claimBatch()){try{publisher.publish(event);markPublished(event.getId());}catch(Exception ex){markFailed(event.getId(),ex);}}}
 @Scheduled(fixedDelayString="${kovian.outbox.recovery-interval-ms:60000}")
 public void recover(){recoverStale();}
 @Transactional public List<OutboxEvent> claimBatch(){List<OutboxEvent> events=repository.claimPending(OutboxStatus.PENDING.name(),OffsetDateTime.now());events.forEach(OutboxEvent::markProcessing);return events;}
 @Transactional public void markPublished(UUID id){repository.findById(id).ifPresent(e->{e.markPublished();repository.save(e);});}
 @Transactional public void markFailed(UUID id,Exception ex){repository.findById(id).ifPresent(e->{e.markFailed(ex.getMessage());repository.save(e);});}
 @Transactional public void recoverStale(){OffsetDateTime cutoff=OffsetDateTime.now().minusMinutes(10);repository.findTop100ByStatusAndProcessingAtBeforeOrderByProcessingAtAsc(OutboxStatus.PROCESSING,cutoff).forEach(e->{e.requeueStale();repository.save(e);});}
}