package com.kovian.finance.notification.application;
import com.kovian.finance.budget.domain.Budget; import com.kovian.finance.budget.repository.BudgetRepository; import com.kovian.finance.transaction.domain.FinancialTransaction; import com.kovian.finance.transaction.domain.TransactionType; import org.springframework.stereotype.Service; import org.springframework.transaction.annotation.Transactional; import java.math.BigDecimal; import java.time.*; import java.util.*;
@Service public class FinancialNotificationRules{
 private final BudgetRepository budgets; private final NotificationService notifications; private final com.kovian.finance.transaction.repository.FinancialTransactionRepository transactions;
 public FinancialNotificationRules(BudgetRepository b,NotificationService n,com.kovian.finance.transaction.repository.FinancialTransactionRepository t){budgets=b;notifications=n;transactions=t;}
 @Transactional public void evaluateExpense(FinancialTransaction tx){
  if(tx.getTransactionType()!=TransactionType.EXPENSE||tx.getCategory()==null)return;
  UUID owner=tx.getOwnerId(); OffsetDateTime now=tx.getOccurredAt(); OffsetDateTime start=now.withDayOfMonth(1).toLocalDate().atStartOfDay().atOffset(now.getOffset());
  List<Budget> active=budgets.findByOwnerIdAndPeriodStartBetweenOrderByPeriodStartDesc(owner,start,start);
  for(Budget b:active)if(b.getCategoryId().equals(tx.getCategory().getId())){
   BigDecimal spent=transactions.sumPostedSignedByCategory(owner,b.getCategoryId(),start,now);
   BigDecimal ratio=spent.divide(b.getLimitAmount().max(BigDecimal.ONE),6,java.math.RoundingMode.HALF_UP);
   if(ratio.compareTo(BigDecimal.ONE)>=0)notifications.create("BUDGET_EXCEEDED","CRITICAL","Orçamento excedido","Os gastos da categoria atingiram ou ultrapassaram o limite.","BUDGET",b.getId(),"budget:"+b.getId()+":"+start.toLocalDate());
   else if(ratio.compareTo(new BigDecimal("0.8"))>=0)notifications.create("BUDGET_80_PERCENT","WARNING","Orçamento em 80%","Os gastos da categoria já consumiram pelo menos 80% do orçamento.","BUDGET",b.getId(),"budget80:"+b.getId()+":"+start.toLocalDate());
  }
 }
}