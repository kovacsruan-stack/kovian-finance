package com.kovian.finance.notification.application;

import com.kovian.finance.card.repository.CreditCardInvoiceRepository;
import com.kovian.finance.debt.domain.*;
import com.kovian.finance.debt.repository.DebtRepository;
import com.kovian.finance.goal.repository.FinancialGoalRepository;
import com.kovian.finance.recurring.repository.RecurringTransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;

@Service
public class FinancialDueRules {
 private final CreditCardInvoiceRepository invoices;
 private final DebtRepository debts;
 private final RecurringTransactionRepository recurring;
 private final FinancialGoalRepository goals;
 private final NotificationService notifications;
 public FinancialDueRules(CreditCardInvoiceRepository i,DebtRepository d,RecurringTransactionRepository r,FinancialGoalRepository g,NotificationService n){invoices=i;debts=d;recurring=r;goals=g;notifications=n;}

 @Transactional
 public void evaluate(LocalDate today,UUID owner){
  LocalDate horizon=today.plusDays(3);
  invoices.findOverdueForOwner(owner,today).forEach(i->notify(owner,"CARD_INVOICE_OVERDUE","CRITICAL","Fatura do cartão em atraso","A fatura venceu em "+i.getDueDate()+" e ainda não foi marcada como paga.","CreditCardInvoice",i.getId(),"card-overdue:"+i.getId()+":"+i.getDueDate()));
  invoices.findDueBetweenForOwner(owner,today,horizon).forEach(i->notify(owner,"CARD_INVOICE_DUE","WARNING","Fatura do cartão próxima do vencimento","A fatura vence em "+i.getDueDate()+".","CreditCardInvoice",i.getId(),"card:"+i.getId()+":"+i.getDueDate()));
  recurring.findByOwnerIdAndActiveTrueAndNextOccurrenceBetweenOrderByNextOccurrence(owner,today,horizon).forEach(r->notify(owner,"RECURRING_DUE","INFO","Lançamento recorrente próximo","Existe um lançamento recorrente previsto para "+r.getNextOccurrence()+".","RecurringTransaction",r.getId(),"recurring:"+r.getId()+":"+r.getNextOccurrence()));
  debts.findByOwnerIdAndStatusAndOutstandingAmountGreaterThanOrderByStartDateAsc(owner,DebtStatus.ACTIVE,java.math.BigDecimal.ZERO).forEach(d->notify(owner,"DEBT_ACTIVE","INFO","Dívida em aberto","A dívida possui saldo pendente de "+d.getOutstandingAmount()+".","Debt",d.getId(),"debt:"+d.getId()+":"+today));
  OffsetDateTime from=today.atStartOfDay().atOffset(ZoneOffset.UTC); OffsetDateTime to=today.plusDays(30).atStartOfDay().atOffset(ZoneOffset.UTC);
  goals.findActiveWithDeadlineBetweenForOwner(owner,from,to).forEach(g->notify(owner,"GOAL_DEADLINE","WARNING","Meta financeira próxima do prazo","A meta está próxima da data planejada.","FinancialGoal",g.getId(),"goal:"+g.getId()+":"+g.getTargetDate()));
 }

 private void notify(UUID owner,String type,String severity,String title,String message,String entity,UUID id,String key){notifications.createForOwner(owner,type,severity,title,message,entity,id,key);}
}