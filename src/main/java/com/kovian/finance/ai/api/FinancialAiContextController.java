package com.kovian.finance.ai.api;
import com.kovian.finance.transaction.domain.TransactionStatus;
import com.kovian.finance.transaction.domain.TransactionType;
import com.kovian.finance.transaction.repository.FinancialTransactionRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;import java.time.*;import java.util.*;import java.nio.charset.StandardCharsets;import java.security.MessageDigest;

@RestController
@RequestMapping("/api/v1/ai/finance")
public class FinancialAiContextController { private static final int MAX_CONTEXT_TRANSACTIONS = 2000;
 private final FinancialTransactionRepository transactions; private final String internalApiKey;
 FinancialAiContextController(FinancialTransactionRepository t,@Value("${kovian.kovi.internal-api-key:}")String key){transactions=t;internalApiKey=key;}
 @GetMapping("/capabilities")
 public Map<String,Object> capabilities(@RequestHeader(value="X-KOVI-INTERNAL-KEY",required=false)String key){authorize(key);return Map.of("source","kovian-finance","domain","finance","contractVersion","1.4","capabilities",List.of("finance.context","finance.context.summary","finance.accounts.read","finance.transactions.read","finance.forecast.read","finance.risk.read"),"mutationsRequireGovernance",true);}
 @GetMapping("/context")
 public Map<String,Object> context(@RequestHeader(value="X-KOVI-INTERNAL-KEY",required=false)String key,@RequestParam UUID ownerId,@RequestParam LocalDate from,@RequestParam LocalDate to){
  authorize(key);validateRange(from,to);var start=from.atStartOfDay().atOffset(ZoneOffset.UTC);var end=to.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC);
  var source=transactions.findByOwnerIdAndOccurredAtBetweenOrderByOccurredAtDesc(ownerId,start,end);BigDecimal income=BigDecimal.ZERO,expense=BigDecimal.ZERO;var categories=new LinkedHashMap<String,BigDecimal>();var tx=new ArrayList<Map<String,Object>>(); int transactionCount=0; boolean truncated=false;
  for(var item:source){if(item.getStatus()==TransactionStatus.CANCELLED)continue;transactionCount++;var amount=item.getAmount();if(item.getTransactionType()==TransactionType.INCOME)income=income.add(amount);if(item.getTransactionType()==TransactionType.EXPENSE){expense=expense.add(amount);var category=item.getCategory()==null?"Sem categoria":item.getCategory().getName();categories.merge(category,amount,BigDecimal::add);}if(tx.size()<MAX_CONTEXT_TRANSACTIONS){tx.add(Map.of("id",item.getId().toString(),"description",item.getDescription(),"amount",amount,"type",item.getTransactionType().name(),"occurredAt",item.getOccurredAt().toString()));}else{truncated=true;}}
  var net=income.subtract(expense);var savingsRate=income.signum()==0?BigDecimal.ZERO:net.divide(income,4,java.math.RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));
  return Map.of("source","kovian-finance","contractVersion","1.4","ownerId",ownerId.toString(),"window",Map.of("from",from.toString(),"to",to.toString()),"summary",Map.of("income",income,"expense",expense,"net",net,"savingsRate",savingsRate),"categories",categories,"transactions",tx,"transactionCount",transactionCount,"transactionEvidenceTruncated",truncated);
 }
 @GetMapping("/context/summary")
 public Map<String,Object> summary(@RequestHeader(value="X-KOVI-INTERNAL-KEY",required=false)String key,@RequestParam UUID ownerId,@RequestParam LocalDate from,@RequestParam LocalDate to){authorize(key);validateRange(from,to);var full=context(key,ownerId,from,to);var result=new LinkedHashMap<String,Object>();result.put("source",full.get("source"));result.put("contractVersion","1.4");result.put("ownerId",full.get("ownerId"));result.put("window",full.get("window"));result.put("summary",full.get("summary"));result.put("categories",full.get("categories"));result.put("transactionCount",full.get("transactionCount"));result.put("transactionEvidenceTruncated",full.get("transactionEvidenceTruncated"));return result;}
 private void authorize(String supplied){if(internalApiKey==null||internalApiKey.length()<32)throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"KOVI internal integration is not configured.");if(supplied==null||!MessageDigest.isEqual(internalApiKey.getBytes(StandardCharsets.UTF_8),supplied.getBytes(StandardCharsets.UTF_8)))throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Invalid KOVI internal credential.");}
 static void validateRange(LocalDate from,LocalDate to){if(from==null||to==null||to.isBefore(from))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid date range.");if(to.toEpochDay()-from.toEpochDay()>365)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"AI context window cannot exceed 365 days.");}
}