package com.kovian.finance.recurring.api;
import com.kovian.finance.account.repository.*; import com.kovian.finance.category.domain.CategoryKind; import com.kovian.finance.category.repository.*; import com.kovian.finance.integration.KovianEventType; import com.kovian.finance.outbox.application.OutboxEventService; import com.kovian.finance.recurring.domain.*; import com.kovian.finance.recurring.repository.*; import com.kovian.finance.security.CurrentUser; import com.kovian.finance.transaction.domain.*; import com.kovian.finance.transaction.repository.*; import jakarta.validation.Valid; import jakarta.validation.constraints.*; import org.springframework.http.HttpStatus; import org.springframework.transaction.annotation.Transactional; import org.springframework.web.bind.annotation.*; import org.springframework.web.server.ResponseStatusException; import java.time.*; import java.util.*; import java.math.*;
@RestController @RequestMapping("/api/v1/recurring") public class RecurringTransactionController {
 final RecurringTransactionRepository recurring; final FinancialAccountRepository accounts; final TransactionCategoryRepository categories; final FinancialTransactionRepository transactions; final OutboxEventService outbox;
 public RecurringTransactionController(RecurringTransactionRepository r,FinancialAccountRepository a,TransactionCategoryRepository c,FinancialTransactionRepository t,OutboxEventService o){recurring=r;accounts=a;categories=c;transactions=t;outbox=o;}
 record Request(@NotNull UUID accountId,UUID categoryId,@NotBlank @Size(max=255) String description,@NotNull @DecimalMin("0.0001") BigDecimal amount,@NotNull TransactionType transactionType,@NotNull RecurringFrequency frequency,@NotNull LocalDate nextOccurrence,LocalDate endDate){}
 @PostMapping @Transactional public RecurringTransaction create(@Valid @RequestBody Request r){
  UUID owner=CurrentUser.ownerId();
  accounts.findByIdAndOwnerId(r.accountId(),owner).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Account does not belong to owner"));
  if(r.categoryId()!=null){var category=categories.findByIdAndOwnerId(r.categoryId(),owner).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Category does not belong to owner"));if(category.getKind()!=CategoryKind.valueOf(r.transactionType().name()))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Category kind does not match transaction type");}
  if(r.endDate()!=null&&r.endDate().isBefore(r.nextOccurrence()))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"End date cannot precede next occurrence");
  return recurring.save(new RecurringTransaction(owner,r.accountId(),r.categoryId(),r.description(),r.amount(),r.transactionType(),r.frequency(),r.nextOccurrence(),r.endDate()));
 }
 @GetMapping public List<RecurringTransaction> list(){return recurring.findByOwnerIdOrderByNextOccurrence(CurrentUser.ownerId());}
 @PostMapping("/{id}/pause") @Transactional public void pause(@PathVariable UUID id){recurring.findByIdAndOwnerId(id,CurrentUser.ownerId()).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Recurring transaction not found")).pause();}
 @PostMapping("/{id}/resume") @Transactional public void resume(@PathVariable UUID id){recurring.findByIdAndOwnerId(id,CurrentUser.ownerId()).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Recurring transaction not found")).resume();}
 @PostMapping("/process-due") @Transactional public int processDue(@RequestParam LocalDate date){
  UUID owner=CurrentUser.ownerId();
  if(date.isAfter(LocalDate.now()))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Cannot process recurring transactions beyond today");
  int count=0;
  for(var r:recurring.findByOwnerIdAndActiveTrueAndNextOccurrenceLessThanEqual(owner,date)) {
   while(r.isActive()&&!r.getNextOccurrence().isAfter(date)){
    var key="recurring:"+r.getId()+":"+r.getNextOccurrence();
    if(!transactions.existsByOwnerIdAndExternalId(owner,key)){
     var account=accounts.findByIdAndOwnerId(r.getAccountId(),owner).orElseThrow(()->new ResponseStatusException(HttpStatus.CONFLICT,"Recurring account is no longer available"));
     var category=r.getCategoryId()==null?null:categories.findByIdAndOwnerId(r.getCategoryId(),owner).orElseThrow(()->new ResponseStatusException(HttpStatus.CONFLICT,"Recurring category is no longer available"));
     if(category!=null&&category.getKind()!=CategoryKind.valueOf(r.getTransactionType().name()))throw new ResponseStatusException(HttpStatus.CONFLICT,"Recurring category kind mismatch");
     var tx=new FinancialTransaction(owner,account,category,key,r.getDescription(),r.getAmount(),r.getTransactionType(),r.getNextOccurrence().atStartOfDay().atOffset(ZoneOffset.UTC));
     if(r.getTransactionType()==TransactionType.INCOME)account.applyIncome(r.getAmount());else account.applyExpense(r.getAmount());
     var saved=transactions.save(tx);
     outbox.record("FinancialTransaction",saved.getId(),KovianEventType.TRANSACTION_CREATED,Map.of("transactionId",saved.getId(),"recurringId",r.getId(),"amount",saved.getAmount(),"type",saved.getTransactionType().name(),"occurredAt",saved.getOccurredAt()));
     count++;
    }
    r.advance();
   }
  }
  return count;
 }
}
