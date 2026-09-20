package com.kovian.finance.outbox.application;
import com.kovian.finance.outbox.domain.*; import com.kovian.finance.outbox.repository.OutboxEventRepository; import io.micrometer.core.instrument.MeterRegistry; import org.springframework.scheduling.annotation.Scheduled; import org.springframework.stereotype.Service; import org.springframework.transaction.annotation.Transactional; import java.time.OffsetDateTime; import java.util.*;
@Service public class OutboxDispatcherService{
 private final OutboxEventRepository repository; private final OutboxEventPublisher publisher; private final MeterRegistry metrics;
 public OutboxDispatcherService(OutboxEventRepository r,OutboxEventPublisher p,MeterRegistry metrics){repository=r;publisher=p;this.metrics=metrics;}
 @Scheduled(fixedDelayString="${kovian.outbox.dispatch-interval-ms:5000}")
 public void dispatch(){List<OutboxEvent> events=claimBatch();metrics.counter("kovian_outbox_claimed_total").increment(events.size());for(OutboxEvent event:events){try{publisher.publish(event);markPublished(event.getId());metrics.counter("kovian_outbox_published_total","event_type",event.getEventType()).increment();}catch(Exception ex){markFailed(event.getId(),ex);metrics.counter("kovian_outbox_failed_total","event_type",event.getEventType()).increment();}}}
 @Scheduled(fixedDelayString="${kovian.outbox.recovery-interval-ms:60000}")
 public void recover(){recoverStale();}
 @Transactional public List<OutboxEvent> claimBatch(){List<OutboxEvent> events=repository.claimPending(OutboxStatus.PENDING.name(),OffsetDateTime.now());events.forEach(OutboxEvent::markProcessing);return events;}
 @Transactional public void markPublished(UUID id){repository.findById(id).ifPresent(e->{e.markPublished();repository.save(e);});}
 @Transactional public void markFailed(UUID id,Exception ex){repository.findById(id).ifPresent(e->{e.markFailed(ex.getMessage());repository.save(e);});}
 @Transactional public void recoverStale(){OffsetDateTime cutoff=OffsetDateTime.now().minusMinutes(10);List<OutboxEvent> stale=repository.findTop100ByStatusAndProcessingAtBeforeOrderByProcessingAtAsc(OutboxStatus.PROCESSING,cutoff);stale.forEach(e->{e.requeueStale();repository.save(e);});if(!stale.isEmpty())metrics.counter("kovian_outbox_recovered_total").increment(stale.size());}
}