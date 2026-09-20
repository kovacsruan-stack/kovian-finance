package com.kovian.finance.outbox.domain;

import org.junit.jupiter.api.Test;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;

class OutboxEventTest {
 @Test void defaultsToVersionOne(){var e=new OutboxEvent(UUID.randomUUID(),"Transaction",UUID.randomUUID(),"transaction.created","{}");assertEquals(1,e.getEventVersion());}
 @Test void preservesExplicitVersion(){var e=new OutboxEvent(UUID.randomUUID(),"Transaction",UUID.randomUUID(),"transaction.created",3,"{}");assertEquals(3,e.getEventVersion());}
 @Test void rejectsNonPositiveVersion(){assertThrows(IllegalArgumentException.class,()->new OutboxEvent(UUID.randomUUID(),"Transaction",UUID.randomUUID(),"transaction.created",0,"{}"));}
}