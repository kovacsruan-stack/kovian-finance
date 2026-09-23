package com.kovian.finance.forecast.api;
import com.kovian.finance.forecast.domain.*; import com.kovian.finance.transaction.domain.*; import com.kovian.finance.transaction.repository.*; import com.kovian.finance.account.repository.*; import com.kovian.finance.security.CurrentUser; import org.springframework.web.bind.annotation.*; import org.springframework.web.server.ResponseStatusException; import org.springframework.http.HttpStatus; import java.math.*; import java.time.*; import java.util.*;
@RestController @RequestMapping("/api/v1/forecast") public class ForecastController {
 final FinancialTransactionRepository transactions; final FinancialAccountRepository accounts;
 ForecastController(FinancialTransactionRepository t,FinancialAccountRepository a){transactions=t;accounts=a;}
 @GetMapping("/cash-flow") public List<CashFlowForecast> cashFlow(@RequestParam(required=false) UUID ownerId,@RequestParam LocalDate from,@RequestParam int days){
  var currentOwnerId=CurrentUser.ownerId(); if(ownerId!=null&&!currentOwnerId.equals(ownerId))throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Owner scope violation"); ownerId=currentOwnerId; if(days<1||days>365)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Forecast horizon must be between 1 and 365 days");
  var histFrom=from.minusDays(90); var histTo=from.minusDays(1); var start=histFrom.atStartOfDay().atOffset(ZoneOffset.UTC); var end=from.atStartOfDay().atOffset(ZoneOffset.UTC);
  BigDecimal income=BigDecimal.ZERO,expense=BigDecimal.ZERO; long count=0;
  for(var tx:transactions.findByOwnerIdAndOccurredAtBetweenOrderByOccurredAtDesc(ownerId,start,end)){if(tx.getStatus()==TransactionStatus.CANCELLED)continue;count++;if(tx.getTransactionType()==TransactionType.INCOME)income=income.add(tx.getAmount());else if(tx.getTransactionType()==TransactionType.EXPENSE)expense=expense.add(tx.getAmount());}
  var divisor=BigDecimal.valueOf(90); var dailyIncome=income.divide(divisor,4,RoundingMode.HALF_UP); var dailyExpense=expense.divide(divisor,4,RoundingMode.HALF_UP);
  var balance=accounts.findByOwnerIdOrderByName(ownerId).stream().map(a->a.getCurrentBalance()).reduce(BigDecimal.ZERO,BigDecimal::add); var result=new ArrayList<CashFlowForecast>();
  for(int i=0;i<days;i++){var date=from.plusDays(i);balance=balance.add(dailyIncome).subtract(dailyExpense);result.add(new CashFlowForecast(date,dailyIncome,dailyExpense,dailyIncome.subtract(dailyExpense),balance));} return result;
 }
}