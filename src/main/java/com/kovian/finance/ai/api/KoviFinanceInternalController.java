package com.kovian.finance.ai.api;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.*;
import java.util.*;
import com.kovian.finance.transaction.domain.*;
import com.kovian.finance.transaction.repository.FinancialTransactionRepository;
import com.kovian.finance.account.repository.FinancialAccountRepository;
import java.math.*;

@RestController
@RequestMapping("/api/v1/internal/kovi")
public class KoviFinanceInternalController {
 private final FinancialAiContextController context; private final FinancialTransactionRepository transactions; private final FinancialAccountRepository accounts; private final String apiKey;
 public KoviFinanceInternalController(FinancialAiContextController context,FinancialTransactionRepository transactions,FinancialAccountRepository accounts,@Value("${kovian.kovi.internal-api-key:}")String apiKey){this.context=context;this.transactions=transactions;this.accounts=accounts;this.apiKey=apiKey;}
 @GetMapping("/capabilities")
 public Map<String,Object> capabilities(@RequestHeader(value="X-KOVI-INTERNAL-KEY",required=false)String key){authorize(key);return Map.of("source","kovian-finance","domain","finance","contractVersion","1.3","capabilities",List.of("finance.get_balance","finance.list_transactions","finance.get_revenue","finance.get_context","finance.get_context_summary"),"mutations",List.of());}
 @GetMapping("/context/summary")
 public Map<String,Object> summary(@RequestHeader(value="X-KOVI-INTERNAL-KEY",required=false)String key,@RequestParam UUID ownerId,@RequestParam LocalDate from,@RequestParam LocalDate to){authorize(key);return context.summary(ownerId,from,to);}
 @GetMapping("/context")
 public Map<String,Object> context(@RequestHeader(value="X-KOVI-INTERNAL-KEY",required=false)String key,@RequestParam UUID ownerId,@RequestParam LocalDate from,@RequestParam LocalDate to){authorize(key);return context.context(ownerId,from,to);}
 @GetMapping("/forecast")
 public Map<String,Object> forecast(@RequestHeader(value="X-KOVI-INTERNAL-KEY",required=false)String key,@RequestParam UUID ownerId,@RequestParam LocalDate from,@RequestParam int days){authorize(key);if(days<1||days>365)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Forecast horizon must be between 1 and 365 days.");var start=from.minusDays(90).atStartOfDay().atOffset(ZoneOffset.UTC);var end=from.atStartOfDay().atOffset(ZoneOffset.UTC);BigDecimal income=BigDecimal.ZERO,expense=BigDecimal.ZERO;for(var tx:transactions.findByOwnerIdAndOccurredAtBetweenOrderByOccurredAtDesc(ownerId,start,end)){if(tx.getStatus()==TransactionStatus.CANCELLED)continue;if(tx.getTransactionType()==TransactionType.INCOME)income=income.add(tx.getAmount());else if(tx.getTransactionType()==TransactionType.EXPENSE)expense=expense.add(tx.getAmount());}var dailyIncome=income.divide(BigDecimal.valueOf(90),4,RoundingMode.HALF_UP),dailyExpense=expense.divide(BigDecimal.valueOf(90),4,RoundingMode.HALF_UP);var balance=accounts.findByOwnerIdOrderByName(ownerId).stream().map(a->a.getCurrentBalance()).reduce(BigDecimal.ZERO,BigDecimal::add);var points=new ArrayList<Map<String,Object>>();for(int i=0;i<days;i++){balance=balance.add(dailyIncome).subtract(dailyExpense);points.add(Map.of("date",from.plusDays(i).toString(),"income",dailyIncome,"expense",dailyExpense,"net",dailyIncome.subtract(dailyExpense),"projectedBalance",balance));}return Map.of("source","kovian-finance","contractVersion","1.3","readOnly",true,"ownerId",ownerId.toString(),"horizonDays",days,"points",points);}
 private void authorize(String provided){if(apiKey==null||apiKey.length()<32||provided==null||!MessageDigest.isEqual(apiKey.getBytes(StandardCharsets.UTF_8),provided.getBytes(StandardCharsets.UTF_8)))throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Invalid KOVI internal credential.");}
}