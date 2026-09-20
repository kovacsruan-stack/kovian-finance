package com.kovian.finance.recurring.api;

import com.kovian.finance.recurring.domain.*;
import com.kovian.finance.recurring.repository.RecurringTransactionRepository;
import com.kovian.finance.account.repository.FinancialAccountRepository;
import com.kovian.finance.category.repository.TransactionCategoryRepository;
import com.kovian.finance.transaction.domain.FinancialTransaction;
import com.kovian.finance.transaction.repository.FinancialTransactionRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate; import java.util.*; import java.math.BigDecimal;

@RestController @RequestMapping("/api/v1/recurring")
public class RecurringTransactionController {
 private final RecurringTransactionRepository recurring; private final FinancialAccountRepository accounts; private final TransactionCategoryRepository categories; private final FinancialTransactionRepository transactions;
 public RecurringTransactionController(RecurringTransactionRepository r,FinancialAccountRepository a,TransactionCategoryRepository c,FinancialTransactionRepository t){this.recurring=r;this.accounts=a;this.categories=c;this.transactions=t;}
 record CreateRequest(UUID ownerId,UUID accountId,UUID categoryId,String description,BigDecimal amount,com.kovian.finance.transaction.domain.TransactionType transactionType,RecurringFrequency frequency,LocalDate nextOccurrence,LocalDate endDate){}
 @PostMapping @Transactional public RecurringTransaction create(@RequestBody CreateRequest r){
   var account=accounts.findByIdAndOwnerId(r.accountId(),r.ownerId()).orElseThrow(()->new IllegalArgumentException("Account does not belong to owner"));
   if(r.categoryId()!=null){var cat=categories.findByIdAndOwnerId(r.categoryId(),r.ownerId()).orElseThrow(()->new IllegalArgumentException("Category does not belong to owner")); if(cat.getKind().name().equals("INCOME")!= (r.transactionType()==com.kovian.finance.transaction.domain.TransactionType.INCOME)) throw new IllegalArgumentException("Category kind does not match transaction type");}
   return recurring.save(new RecurringTransaction(r.ownerId(),account.getId(),r.categoryId(),r.description(),r.amount(),r.transactionType(),r.frequency(),r.nextOccurrence(),r.endDate()));
 }
 @GetMapping public List<RecurringTransaction> list(@RequestParam UUID ownerId){return recurring.findByOwnerIdOrderByNextOccurrence(ownerId);}
 @PostMapping("/{id}/pause") @Transactional public void pause(@PathVariable UUID id,@RequestParam UUID ownerId){recurring.findByIdAndOwnerId(id,ownerId).orElseThrow().pause();}
 @PostMapping("/{id}/resume") @Transactional public void resume(@PathVariable UUID id,@RequestParam UUID ownerId){recurring.findByIdAndOwnerId(id,ownerId).orElseThrow().resume();}
 @PostMapping("/process-due") @Transactional public int processDue(@RequestParam LocalDate date){
   int count=0; for(var r:recurring.findByActiveTrueAndNextOccurrenceLessThanEqual(date)){ while(r.isActive()&&!r.getNextOccurrence().isAfter(date)){var key="recurring:"+r.getId()+":"+r.getNextOccurrence(); if(transactions.findByOwnerIdAndExternalId(r.getOwnerId(),key).isEmpty()){var tx=new FinancialTransaction(r.getOwnerId(),r.getAccountId(),r.getCategoryId(),key,r.getDescription(),r.getAmount(),r.getTransactionType(),r.getNextOccurrence()); transactions.save(tx); var a=accounts.findByIdAndOwnerId(r.getAccountId(),r.getOwnerId()).orElseThrow(); if(r.getTransactionType()==com.kovian.finance.transaction.domain.TransactionType.INCOME)a.applyIncome(r.getAmount());else a.applyExpense(r.getAmount());} r.advance(); count++;} } return count;
 }
}
