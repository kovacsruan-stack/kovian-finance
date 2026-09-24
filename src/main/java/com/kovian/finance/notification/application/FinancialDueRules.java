package com.kovian.finance.notification.application;

import com.kovian.finance.card.repository.CreditCardInvoiceRepository;
import com.kovian.finance.debt.domain.*;
import com.kovian.finance.debt.repository.DebtRepository; import com.kovian.finance.debt.repository.DebtInstallmentRepository;
import com.kovian.finance.goal.repository.FinancialGoalRepository;
import com.kovian.finance.recurring.repository.RecurringTransactionRepository;
import com.kovian.finance.transaction.repository.FinancialTransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;

@Service
public class FinancialDueRules {
 private final CreditCardInvoiceRepository invoices;
 private final DebtRepository debts; private final DebtInstallmentRepository installments;
 private final RecurringTransactionRepository recurring;
 private final FinancialGoalRepository goals;
 private final NotificationService notifications;
 private final FinancialTransactionRepository transactions;
 public FinancialDueRules(CreditCardInvoiceRepository i,DebtRepository d,DebtInstallmentRepository di,RecurringTransactionRepository r,FinancialGoalRepository g,NotificationService n,FinancialTransactionRepository t){invoices=i;debts=d;installments=di;recurring=r;goals=g;notifications=n;transactions=t;}

 @Transactional
 public void evaluate(LocalDate today,UUID owner){
  LocalDate horizon=today.plusDays(3);
  invoices.findOverdueForOwner(owner,today).forEach(i->notify(owner,"CARD_INVOICE_OVERDUE","CRITICAL","Fatura do cartão em atraso","A fatura venceu em "+i.getDueDate()+" e ainda não foi marcada como paga.","CreditCardInvoice",i.getId(),"card-overdue:"+i.getId()+":"+i.getDueDate()));
  invoices.findDueBetweenForOwner(owner,today,horizon).forEach(i->notify(owner,"CARD_INVOICE_DUE","WARNING","Fatura do cartão próxima do vencimento","A fatura vence em "+i.getDueDate()+".","CreditCardInvoice",i.getId(),"card:"+i.getId()+":"+i.getDueDate()));
  recurring.findByOwnerIdAndActiveTrueAndNextOccurrenceLessThanEqual(owner,today.minusDays(1)).forEach(r->notify(owner,"RECURRING_OVERDUE","WARNING","Lançamento recorrente atrasado","O lançamento recorrente previsto para "+r.getNextOccurrence()+" ainda está pendente.","RecurringTransaction",r.getId(),"recurring-overdue:"+r.getId()+":"+r.getNextOccurrence()));
    recurring.findByOwnerIdAndActiveTrueAndNextOccurrenceBetweenOrderByNextOccurrence(owner,today,horizon).forEach(r->notify(owner,"RECURRING_DUE","INFO","Lançamento recorrente próximo","Existe um lançamento recorrente previsto para "+r.getNextOccurrence()+".","RecurringTransaction",r.getId(),"recurring:"+r.getId()+":"+r.getNextOccurrence()));
  debts.findByOwnerIdAndStatusAndOutstandingAmountGreaterThanOrderByStartDateAsc(owner,DebtStatus.ACTIVE,java.math.BigDecimal.ZERO).forEach(d->notify(owner,"DEBT_ACTIVE","INFO","Dívida em aberto","A dívida possui saldo pendente de "+d.getOutstandingAmount()+".","Debt",d.getId(),"debt:"+d.getId()+":"+today));
  installments.findByOwnerIdAndStatusAndDueDateBeforeOrderByDueDate(owner,InstallmentStatus.PENDING,today).forEach(i->notify(owner,"DEBT_INSTALLMENT_OVERDUE","CRITICAL","Parcela de dívida em atraso","A parcela da dívida venceu em "+i.getDueDate()+" e continua pendente.","DebtInstallment",i.getId(),"debt-installment-overdue:"+i.getId()+":"+i.getDueDate()));
  installments.findByOwnerIdAndStatusAndDueDateBetweenOrderByDueDate(owner,InstallmentStatus.PENDING,today,horizon).forEach(i->notify(owner,"DEBT_INSTALLMENT_DUE","WARNING","Parcela de dívida próxima","A parcela vence em "+i.getDueDate()+".","DebtInstallment",i.getId(),"debt-installment:"+i.getId()+":"+i.getDueDate()));
  OffsetDateTime cashFrom=today.minusDays(30).atStartOfDay().atOffset(ZoneOffset.UTC); OffsetDateTime cashTo=today.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC);
  java.math.BigDecimal income=Optional.ofNullable(transactions.sumPostedIncomeByOwnerAndOccurredAtBetween(owner,cashFrom,cashTo)).orElse(java.math.BigDecimal.ZERO);
  java.math.BigDecimal expense=Optional.ofNullable(transactions.sumPostedExpenseByOwnerAndOccurredAtBetween(owner,cashFrom,cashTo)).orElse(java.math.BigDecimal.ZERO);
  if(expense.compareTo(income)>0)notify(owner,"CASH_FLOW_RISK","WARNING","Fluxo de caixa negativo","Nos últimos 30 dias, as despesas superaram as receitas. Revise o caixa e os próximos compromissos.","FinancialTransaction",owner,"cash-risk:"+owner+":"+today);
  OffsetDateTime currentWeekStart=today.minusDays(7).atStartOfDay().atOffset(ZoneOffset.UTC); OffsetDateTime currentWeekEnd=today.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC);
  OffsetDateTime previousWeekStart=today.minusDays(14).atStartOfDay().atOffset(ZoneOffset.UTC); OffsetDateTime previousWeekEnd=today.minusDays(7).atStartOfDay().atOffset(ZoneOffset.UTC);
  java.math.BigDecimal currentWeekExpense=transactions.sumPostedExpenseByOwnerAndOccurredAtBetween(owner,currentWeekStart,currentWeekEnd);
  java.math.BigDecimal previousWeekExpense=transactions.sumPostedExpenseByOwnerAndOccurredAtBetween(owner,previousWeekStart,previousWeekEnd);
  if(previousWeekExpense.signum()>0 && currentWeekExpense.compareTo(previousWeekExpense.multiply(new java.math.BigDecimal("1.5")))>0)notify(owner,"SPENDING_SPIKE","WARNING","Aumento de gastos detectado","Os gastos dos últimos 7 dias ficaram pelo menos 50% acima dos 7 dias anteriores.","FinancialTransaction",owner,"spending-spike:"+owner+":"+today);

  OffsetDateTime from=today.atStartOfDay().atOffset(ZoneOffset.UTC); OffsetDateTime to=today.plusDays(30).atStartOfDay().atOffset(ZoneOffset.UTC);
  goals.findActiveWithDeadlineBetweenForOwner(owner,from,to).forEach(g->{ notify(owner,"GOAL_DEADLINE","WARNING","Meta financeira próxima do prazo","A meta está próxima da data planejada.","FinancialGoal",g.getId(),"goal:"+g.getId()+":"+g.getTargetDate()); if(g.getTargetDate()!=null && g.getCurrentAmount().compareTo(g.getTargetAmount().multiply(new java.math.BigDecimal("0.5")))<0) notify(owner,"GOAL_PROGRESS_RISK","WARNING","Meta financeira atrasada","A meta está próxima do prazo e ainda não alcançou 50% do valor planejado.","FinancialGoal",g.getId(),"goal-progress-risk:"+g.getId()+":"+g.getTargetDate()); });
 }

 private void notify(UUID owner,String type,String severity,String title,String message,String entity,UUID id,String key){notifications.createForOwner(owner,type,severity,title,message,entity,id,key);}
}