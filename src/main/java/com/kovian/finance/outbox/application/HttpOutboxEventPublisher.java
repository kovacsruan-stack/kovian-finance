package com.kovian.finance.outbox.application;
import com.kovian.finance.outbox.domain.OutboxEvent;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import java.util.Map;

@Component
@ConditionalOnProperty(name="kovian.outbox.transport",havingValue="http")
public class HttpOutboxEventPublisher implements OutboxEventPublisher {
 private final RestClient client;
 private final String endpoint;
 private final String apiKey;

 public HttpOutboxEventPublisher(org.springframework.core.env.Environment env) {
  this.endpoint=env.getProperty("kovian.outbox.http.endpoint","");
  this.apiKey=env.getProperty("kovian.outbox.http.api-key","");
  if(endpoint.isBlank()) throw new IllegalStateException("KOVIAN outbox HTTP endpoint is required when transport=http.");
  this.client=RestClient.builder().build();
 }
 @Override
 public void publish(OutboxEvent event) {
  Map<String,Object> payload=Map.of(
    "id",event.getId(),
    "eventType",event.getEventType(),
    "aggregateType",event.getAggregateType(),
    "aggregateId",event.getAggregateId(),
    "ownerId",event.getOwnerId(),
    "payload",event.getPayload(),
    "attempt",event.getAttempts()
  );
  client.post().uri(endpoint).contentType(MediaType.APPLICATION_JSON)
    .header("X-KOVIAN-OUTBOX-KEY",apiKey)
    .body(payload).retrieve().toBodilessEntity();
 }
}
