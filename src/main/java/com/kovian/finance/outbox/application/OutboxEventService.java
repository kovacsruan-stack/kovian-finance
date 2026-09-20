package com.kovian.finance.outbox.application;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kovian.finance.outbox.domain.*;
import com.kovian.finance.outbox.repository.OutboxEventRepository;
import com.kovian.finance.security.CurrentUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.OffsetDateTime; import java.util.*;
@Service
public class OutboxEventService {
 private final OutboxEventRepository repository; private final ObjectMapper objectMapper;
 public OutboxEventService(OutboxEventRepository repository,ObjectMapper objectMapper){this.repository=repository;this.objectMapper=objectMapper;}
 @Transactional
 public OutboxEvent record(String aggregateType,UUID aggregateId,String eventType,Object payload){return record(aggregateType,aggregateId,eventType,1,payload);}
 @Transactional
 public OutboxEvent record(String aggregateType,UUID aggregateId,String eventType,int eventVersion,Object payload){
  try{return repository.save(new OutboxEvent(CurrentUser.ownerId(),aggregateType,aggregateId,eventType,eventVersion,objectMapper.writeValueAsString(payload)));}
  catch(JsonProcessingException e){throw new IllegalArgumentException("Unable to serialize domain event",e);}
 }
 @Transactional(readOnly=true)
 public List<OutboxEvent> pendingBatch(){var events=repository.claimPending(OutboxStatus.PENDING.name(),OffsetDateTime.now()); events.forEach(OutboxEvent::markProcessing); return events;}
}