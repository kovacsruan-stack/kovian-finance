package com.kovian.finance.notification.api;
import com.kovian.finance.notification.application.NotificationService; import org.springframework.web.bind.annotation.*; import java.time.OffsetDateTime; import java.util.*;
@RestController @RequestMapping("/api/v1/notifications") public class NotificationController{
 private final NotificationService service; public NotificationController(NotificationService s){service=s;}
 @GetMapping List<Response> list(@RequestParam(defaultValue="false")boolean unreadOnly){return service.list(unreadOnly).stream().map(n->new Response(n.getId(),n.getType(),n.getSeverity(),n.getTitle(),n.getMessage(),n.getEntityType(),n.getEntityId(),n.getReadAt(),n.getCreatedAt())).toList();}
 @PostMapping("/{id}/read") void read(@PathVariable UUID id){service.markRead(id);}
 record Response(UUID id,String type,String severity,String title,String message,String entityType,UUID entityId,OffsetDateTime readAt,OffsetDateTime createdAt){}
}