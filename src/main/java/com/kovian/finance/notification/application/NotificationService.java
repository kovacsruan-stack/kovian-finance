package com.kovian.finance.notification.application;
import com.kovian.finance.notification.domain.Notification;
import com.kovian.finance.outbox.application.OutboxEventService; import com.kovian.finance.notification.repository.NotificationRepository; import com.kovian.finance.security.CurrentUser; import org.springframework.dao.DataIntegrityViolationException; import org.springframework.stereotype.Service; import org.springframework.transaction.annotation.Transactional; import java.util.*;
@Service public class NotificationService{
 private final NotificationRepository repository; private final OutboxEventService outbox; public NotificationService(NotificationRepository r,OutboxEventService outbox){repository=r;this.outbox=outbox;}
 @Transactional public Optional<Notification> create(String type,String severity,String title,String message,String entityType,UUID entityId,String key){return createForOwner(CurrentUser.ownerId(),type,severity,title,message,entityType,entityId,key);}
 @Transactional public Optional<Notification> createForOwner(UUID owner,String type,String severity,String title,String message,String entityType,UUID entityId,String key){
  if(repository.existsByOwnerIdAndDeduplicationKey(owner,key))return Optional.empty();
  try{Notification saved=repository.save(new Notification(owner,type,severity,title,message,entityType,entityId,key)); outbox.recordForOwner(owner,"Notification",saved.getId(),"NOTIFICATION_CREATED",1,Map.of("notificationId",saved.getId(),"type",type,"severity",severity)); return Optional.of(saved);}catch(DataIntegrityViolationException e){return Optional.empty();}
 }
 @Transactional public void markRead(UUID id){repository.findByIdAndOwnerId(id,CurrentUser.ownerId()).orElseThrow(()->new IllegalArgumentException("Notification not found")).markRead();}
 @Transactional(readOnly=true) public List<Notification> list(boolean unreadOnly){UUID owner=CurrentUser.ownerId();return unreadOnly?repository.findTop100ByOwnerIdAndReadAtIsNullOrderByCreatedAtDesc(owner):repository.findTop100ByOwnerIdOrderByCreatedAtDesc(owner);}
}