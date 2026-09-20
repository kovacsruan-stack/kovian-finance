package com.kovian.finance.ai.application;
import com.kovian.finance.ai.domain.FinancialInsight; import com.kovian.finance.transaction.domain.*; import com.kovian.finance.transaction.repository.*; import java.math.*; import java.time.*; import java.util.*;
public class FinancialInsightService {
 private final FinancialTransactionRepository transactions;
 public FinancialInsightService(FinancialTransactionRepository t){transactions=t;}
 public List<FinancialInsight> analyze(UUID ownerId,LocalDate from,LocalDate to){
  var start=from.atStartOfDay().atOffset(ZoneOffset.UTC);var end=to.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC);
  BigDecimal income=BigDecimal.ZERO,expense=BigDecimal.ZERO; for(var tx:transactions.findByOwnerIdAndOccurredAtBetweenOrderByOccurredAtDesc(ownerId,start,end)){if(tx.getStatus()==TransactionStatus.CANCELLED)continue;if(tx.getTransactionType()==TransactionType.INCOME)income=income.add(tx.getAmount());else if(tx.getTransactionType()==TransactionType.EXPENSE)expense=expense.add(tx.getAmount());}
  var result=new ArrayList<FinancialInsight>();var now=OffsetDateTime.now();if(income.signum()>0){var rate=income.subtract(expense).divide(income,4,RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));if(rate.signum()<0)result.add(new FinancialInsight("CASH_FLOW","Fluxo de caixa negativo","As despesas do período superaram as receitas em "+expense.subtract(income)+" BRL.","HIGH",now));else if(rate.compareTo(BigDecimal.valueOf(20))<0)result.add(new FinancialInsight("SAVINGS_RATE","Margem de poupança reduzida","A diferença entre receitas e despesas ficou abaixo de 20% das receitas no período.","MEDIUM",now));}
  if(expense.signum()==0)result.add(new FinancialInsight("DATA_QUALITY","Sem despesas registradas","Não há despesas registradas no período selecionado. Confirme se os lançamentos estão completos.","LOW",now));return result;
 }
}