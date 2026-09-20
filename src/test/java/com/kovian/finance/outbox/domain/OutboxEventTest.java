package com.kovian.finance.outbox.domain;

import org.junit.jupiter.api.Test;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;

class OutboxEventTest {
 @Test void defaultsToVersionOne(){var e=new OutboxEvent(UUID.randomUUID(),"Transaction",UUID.randomUUID(),"transaction.created","{}");assertEquals(1,e.getEventVersion());}
 @Test void preservesExplicitVersion(){var e=new OutboxEvent(UUID.randomUUID(),"Transaction",UUID.randomUUID(),"transaction.created",3,"{}");assertEquals(3,e.getEventVersion());}
 @Test void rejectsNonPositiveVersion(){assertThrows(IllegalArgumentException.class,()->new OutboxEvent(UUID.randomUUID(),"Transaction",UUID.randomUUID(),"transaction.created",0,"{}"));}
 @Test void transitionsToFailedAfterTenAttempts(){var e=new OutboxEvent(UUID.randomUUID(),"Transaction",UUID.randomUUID(),"transaction.created",1,"{}");for(int i=0;i<10;i++){e.markProcessing();e.markFailed("failure");}assertEquals(OutboxStatus.FAILED,e.getStatus());assertEquals(10,e.getAttempts());}
 @Test void failedAttemptIsRequeuedBeforeMaximumAttempts(){var e=new OutboxEvent(UUID.randomUUID(),"Transaction",UUID.randomUUID(),"transaction.created",1,"{}");e.markProcessing();e.markFailed("temporary");assertEquals(OutboxStatus.PENDING,e.getStatus());assertNotNull(e.getAvailableAt());assertNull(e.getProcessingAt());assertEquals(1,e.getAttempts());}
 @Test void staleProcessingCanBeRequeued(){var e=new OutboxEvent(UUID.randomUUID(),"Transaction",UUID.randomUUID(),"transaction.created",1,"{}");e.markProcessing();assertEquals(OutboxStatus.PROCESSING,e.getStatus());e.requeueStale();assertEquals(OutboxStatus.PENDING,e.getStatus());assertNull(e.getProcessingAt());assertNotNull(e.getAvailableAt());}
 @Test void errorIsBounded(){var e=new OutboxEvent(UUID.randomUUID(),"Transaction",UUID.randomUUID(),"transaction.created",1,"{}");e.markProcessing();e.markFailed("x".repeat(5000));assertEquals(1000,e.getLastError().length());}


}