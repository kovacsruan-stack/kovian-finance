package com.kovian.finance.notification.application;
import com.kovian.finance.card.repository.CreditCardInvoiceRepository; import com.kovian.finance.debt.domain.*; import com.kovian.finance.debt.repository.DebtRepository; import com.kovian.finance.goal.repository.FinancialGoalRepository; import com.kovian.finance.recurring.repository.RecurringTransactionRepository; import org.springframework.stereotype.Service; import org.springframework.transaction.annotation.Transactional; import java.time.*; import java.util.*;
@Service public class FinancialDueRules{
 private final CreditCardInvoiceRepository invoices; private final DebtRepository debts; private final RecurringTransactionRepository recurring; private final FinancialGoalRepository goals; private final NotificationService notifications;
 public FinancialDueRules(CreditCardInvoiceRepository i,DebtRepository d,RecurringTransactionRepository r,FinancialGoalRepository g,NotificationService n){invoices=i;debts=d;recurring=r;goals=g;notifications=n;}
 @Transactional public void evaluate(LocalDate today){
  LocalDate horizon=today.plusDays(3);
  invoices.findDueBetween(today,horizon).forEach(i->notify(i.getOwnerId(),"CARD_INVOICE_DUE","WARNING","Fatura do cartão próxima do vencimento","A fatura vence em "+i.getDueDate()+".","CreditCardInvoice",i.getId(),"card:"+i.getId()+":"+i.getDueDate()));
  recurring.findByActiveTrueAndNextOccurrenceBetweenOrderByNextOccurrence(today,horizon).forEach(r->notify(r.getOwnerId(),"RECURRING_DUE","INFO","Lançamento recorrente próximo","Existe um lançamento recorrente previsto para "+r.getNextOccurrence()+".","RecurringTransaction",r.getId(),"recurring:"+r.getId()+":"+r.getNextOccurrence()));
  debts.findByStatusAndOutstandingAmountGreaterThanOrderByStartDateAsc(DebtStatus.ACTIVE,java.math.BigDecimal.ZERO).forEach(d->notify(d.getOwnerId(),"DEBT_ACTIVE","INFO","Dívida em aberto","A dívida possui saldo pendente de "+d.getOutstandingAmount()+".","Debt",d.getId(),"debt:"+d.getId()+":"+today));
  OffsetDateTime from=today.atStartOfDay().atOffset(ZoneOffset.UTC); OffsetDateTime to=today.plusDays(30).atStartOfDay().atOffset(ZoneOffset.UTC);
  goals.findActiveWithDeadlineBetween(from,to).forEach(g->notify(g.getOwnerId(),"GOAL_DEADLINE","WARNING","Meta financeira próxima do prazo","A meta está próxima da data planejada.","FinancialGoal",g.getId(),"goal:"+g.getId()+":"+g.getTargetDate()));
 }
 private void notify(UUID owner,String type,String severity,String title,String message,String entity,UUID id,String key){notifications.createForOwner(owner,type,severity,title,message,entity,id,key);}
}