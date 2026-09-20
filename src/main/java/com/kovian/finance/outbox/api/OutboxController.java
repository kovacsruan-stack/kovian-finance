package com.kovian.finance.outbox.api;
import com.kovian.finance.outbox.application.OutboxEventService;
import com.kovian.finance.security.CurrentUser;
import org.springframework.web.bind.annotation.*;
import java.util.*;
@RestController @RequestMapping("/api/v1/outbox")
public class OutboxController{
 private final OutboxEventService service;
 public OutboxController(OutboxEventService service){this.service=service;}
 @GetMapping List<EventResponse> pending(){
  UUID owner=CurrentUser.ownerId();
  return service.pendingBatch().stream().filter(e->e.getOwnerId().equals(owner))
   .map(e->new EventResponse(e.getId(),e.getAggregateType(),e.getAggregateId(),e.getEventType(),e.getPayload(),e.getCreatedAt())).toList();
 }
 public record EventResponse(UUID id,String aggregateType,UUID aggregateId,String eventType,String payload,java.time.OffsetDateTime createdAt){}
}