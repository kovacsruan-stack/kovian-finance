package com.kovian.finance.outbox.domain;

import org.junit.jupiter.api.Test;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;

class OutboxEventTest {
 @Test void defaultsToVersionOne(){var e=new OutboxEvent(UUID.randomUUID(),"Transaction",UUID.randomUUID(),"transaction.created","{}");assertEquals(1,e.getEventVersion());}
 @Test void preservesExplicitVersion(){var e=new OutboxEvent(UUID.randomUUID(),"Transaction",UUID.randomUUID(),"transaction.created",3,"{}");assertEquals(3,e.getEventVersion());}
 @Test void rejectsNonPositiveVersion(){assertThrows(IllegalArgumentException.class,()->new OutboxEvent(UUID.randomUUID(),"Transaction",UUID.randomUUID(),"transaction.created",0,"{}"));}
 @Test void transitionsToFailedAfterTenAttempts(){var e=new OutboxEvent(UUID.randomUUID(),"Transaction",UUID.randomUUID(),"transaction.created",1,"{}");for(int i=0;i<10;i++){e.markProcessing();e.markFailed("failure");}assertEquals(OutboxStatus.FAILED,e.getStatus());assertEquals(10,e.getAttempts());}
}