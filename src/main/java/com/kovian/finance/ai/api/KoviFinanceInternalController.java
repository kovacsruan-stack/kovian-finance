package com.kovian.finance.ai.api;
import com.kovian.finance.transaction.domain.TransactionStatus;
import com.kovian.finance.transaction.domain.TransactionType;
import com.kovian.finance.transaction.repository.FinancialTransactionRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1/internal/kovi")
public class KoviFinanceInternalController {
 private final FinancialTransactionRepository transactions; private final String apiKey;
 public KoviFinanceInternalController(FinancialTransactionRepository transactions,@Value("${kovian.kovi.internal-api-key:}")String apiKey){this.transactions=transactions;this.apiKey=apiKey;}
 @GetMapping("/capabilities")
 public Map<String,Object> capabilities(@RequestHeader(value="X-KOVI-INTERNAL-KEY",required=false)String key){authorize(key);return Map.of("source","kovian-finance","domain","finance","capabilities",List.of("finance.get_balance","finance.list_transactions","finance.get_revenue","finance.get_context"),"mutations",List.of());}
 @GetMapping("/context/summary")
 public Map<String,Object> summary(@RequestHeader(value="X-KOVI-INTERNAL-KEY",required=false)String key,@RequestParam UUID ownerId,@RequestParam LocalDate from,@RequestParam LocalDate to){authorize(key);return new FinancialAiContextController(transactions).summary(ownerId,from,to);}
 @GetMapping("/context")
 public Map<String,Object> context(@RequestHeader(value="X-KOVI-INTERNAL-KEY",required=false)String key,@RequestParam UUID ownerId,@RequestParam LocalDate from,@RequestParam LocalDate to){authorize(key);return new FinancialAiContextController(transactions).context(ownerId,from,to);}
 private void authorize(String provided){if(apiKey==null||apiKey.length()<32||provided==null||!MessageDigest.isEqual(apiKey.getBytes(StandardCharsets.UTF_8),provided.getBytes(StandardCharsets.UTF_8)))throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Invalid KOVI internal credential.");}
}