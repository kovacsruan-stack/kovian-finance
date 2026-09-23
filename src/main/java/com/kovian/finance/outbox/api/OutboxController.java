package com.kovian.finance.outbox.api;
import com.kovian.finance.outbox.application.OutboxEventService; import org.springframework.web.bind.annotation.*; import java.util.*;
@RestController @RequestMapping("/api/v1/outbox") public class OutboxController{
 private final OutboxEventService service; public OutboxController(OutboxEventService service){this.service=service;}
 @GetMapping List<EventResponse> pending(){return service.pendingBatch().stream().map(e->new EventResponse(e.getId(),e.getAggregateType(),e.getAggregateId(),e.getEventType(),e.getPayload(),e.getStatus().name(),e.getAttempts(),e.getCreatedAt(),e.getPublishedAt(),e.getLastError())).toList();}
 public record EventResponse(UUID id,String aggregateType,UUID aggregateId,String eventType,String payload,String status,Integer attempts,java.time.OffsetDateTime createdAt,java.time.OffsetDateTime publishedAt,String lastError){}
}