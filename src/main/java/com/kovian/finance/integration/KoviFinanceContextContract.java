package com.kovian.finance.integration;

import java.time.Instant;
import java.util.UUID;

public record KoviFinanceContextContract(
 UUID ownerId,
 Instant generatedAt,
 String source,
 String version,
 String endpoint,
 boolean readOnly
) {
 public static KoviFinanceContextContract current(UUID ownerId,String endpoint){
  return new KoviFinanceContextContract(ownerId,Instant.now(),"kovian-finance","1.4",endpoint,true);
 }
}
