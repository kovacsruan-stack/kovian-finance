package com.kovian.finance.outbox.application;
import com.kovian.finance.outbox.domain.OutboxEvent; import org.slf4j.Logger; import org.slf4j.LoggerFactory; import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty; import org.springframework.stereotype.Component;
@Component @ConditionalOnProperty(name="kovian.outbox.transport",havingValue="log",matchIfMissing=true) public class LoggingOutboxEventPublisher implements OutboxEventPublisher{
 private static final Logger log=LoggerFactory.getLogger(LoggingOutboxEventPublisher.class);
 public void publish(OutboxEvent event){log.info("KOVIAN_OUTBOX_DISPATCH eventId={} type={} aggregateType={} aggregateId={} ownerId={} attempt={}",event.getId(),event.getEventType(),event.getAggregateType(),event.getAggregateId(),event.getOwnerId(),event.getAttempts());}
}