package com.kovian.finance.ai.api;
import com.kovian.finance.transaction.domain.TransactionStatus;
import com.kovian.finance.transaction.domain.TransactionType;
import com.kovian.finance.transaction.repository.FinancialTransactionRepository;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import com.kovian.finance.integration.KoviFinanceContextContract;

@RestController
@RequestMapping("/api/v1/ai/finance")
public class FinancialAiContextController {
 private final FinancialTransactionRepository transactions;
 FinancialAiContextController(FinancialTransactionRepository t){transactions=t;}
 @GetMapping("/context")
 public Map<String,Object> context(@RequestParam UUID ownerId,@RequestParam LocalDate from,@RequestParam LocalDate to){validateRange(from,to);return build(ownerId,from,to,true);}
 @GetMapping("/context/summary")
 public Map<String,Object> summary(@RequestParam UUID ownerId,@RequestParam LocalDate from,@RequestParam LocalDate to){validateRange(from,to);return build(ownerId,from,to,false);}
 private Map<String,Object> build(UUID ownerId,LocalDate from,LocalDate to,boolean includeTransactions){
  var start=from.atStartOfDay().atOffset(ZoneOffset.UTC);var end=to.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC);var source=transactions.findByOwnerIdAndOccurredAtBetweenOrderByOccurredAtDesc(ownerId,start,end);
  BigDecimal income=BigDecimal.ZERO,expense=BigDecimal.ZERO;var categories=new LinkedHashMap<String,BigDecimal>();var tx=new ArrayList<Map<String,Object>>();
  for(var item:source){if(item.getStatus()==TransactionStatus.CANCELLED)continue;var amount=item.getAmount();if(item.getTransactionType()==TransactionType.INCOME)income=income.add(amount);if(item.getTransactionType()==TransactionType.EXPENSE){expense=expense.add(amount);var category=item.getCategory()==null?"Sem categoria":item.getCategory().getName();categories.merge(category,amount,BigDecimal::add);}if(includeTransactions)tx.add(Map.of("id",item.getId().toString(),"description",item.getDescription(),"amount",amount,"type",item.getTransactionType().name(),"occurredAt",item.getOccurredAt().toString()));}
  var net=income.subtract(expense);var savingsRate=income.signum()==0?BigDecimal.ZERO:net.divide(income,4,java.math.RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));var result=new LinkedHashMap<String,Object>();result.put("contract",KoviFinanceContextContract.current(ownerId,includeTransactions?"/api/v1/ai/finance/context":"/api/v1/ai/finance/context/summary"));result.put("source","kovian-finance");result.put("ownerId",ownerId.toString());result.put("window",Map.of("from",from.toString(),"to",to.toString()));result.put("summary",Map.of("income",income,"expense",expense,"net",net,"savingsRate",savingsRate));result.put("categories",categories);result.put("transactionCount",includeTransactions?tx.size():source.stream().filter(x->x.getStatus()!=TransactionStatus.CANCELLED).count());if(includeTransactions)result.put("transactions",tx);return result;
 }
 private void validateRange(LocalDate from,LocalDate to){if(to.isBefore(from))throw new IllegalArgumentException("Invalid date range.");if(to.toEpochDay()-from.toEpochDay()>365)throw new IllegalArgumentException("AI context window cannot exceed 365 days.");}
}