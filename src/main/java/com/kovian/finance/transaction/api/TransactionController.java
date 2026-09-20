package com.kovian.finance.transaction.api;

import com.kovian.finance.account.repository.FinancialAccountRepository;
import com.kovian.finance.audit.application.AuditService;
import com.kovian.finance.category.domain.CategoryKind;
import com.kovian.finance.category.repository.TransactionCategoryRepository;
import com.kovian.finance.transaction.domain.*;
import com.kovian.finance.transaction.repository.FinancialTransactionRepository;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal; import java.time.OffsetDateTime; import java.util.*;

@RestController @RequestMapping("/api/v1/transactions")
public class TransactionController {
 private final FinancialTransactionRepository transactions; private final FinancialAccountRepository accounts; private final TransactionCategoryRepository categories; private final AuditService audit;
 public TransactionController(FinancialTransactionRepository t,FinancialAccountRepository a,TransactionCategoryRepository c,AuditService audit){transactions=t;accounts=a;categories=c;this.audit=audit;}

 @PostMapping @Transactional
 ResponseEntity<TransactionResponse> create(@Valid @RequestBody CreateTransactionRequest r){
  if(r.type()==TransactionType.TRANSFER) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Transfers require a dedicated transfer workflow");
  if(r.externalId()!=null && transactions.existsByOwnerIdAndExternalId(r.ownerId(),r.externalId())) throw new ResponseStatusException(HttpStatus.CONFLICT,"Transaction already imported");
  var account=accounts.findByIdAndOwnerId(r.accountId(),r.ownerId()).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Account not found"));
  var category=categories.findByIdAndOwnerId(r.categoryId(),r.ownerId()).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Category not found"));
  if(category.getKind()!=CategoryKind.valueOf(r.type().name())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Category kind does not match transaction type");
  var tx=new FinancialTransaction(r.ownerId(),account,category,r.externalId(),r.description(),r.amount(),r.type(),r.occurredAt());
  if(r.type()==TransactionType.INCOME) account.applyIncome(r.amount()); else account.applyExpense(r.amount());
  var saved=transactions.save(tx);
  audit.record("TRANSACTION_CREATED","FinancialTransaction",saved.getId(),"type="+r.type()+",amount="+r.amount());
  return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(saved));
 }

 @PostMapping("/{id}/cancel") @Transactional
 ResponseEntity<Void> cancel(@PathVariable UUID id,@RequestParam UUID ownerId){
  var tx=transactions.findByIdAndOwnerId(id,ownerId).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Transaction not found"));
  if(tx.getStatus()==TransactionStatus.CANCELLED) return ResponseEntity.noContent().build();
  if(tx.getTransactionType()==TransactionType.INCOME) tx.getAccount().applyExpense(tx.getAmount()); else tx.getAccount().applyIncome(tx.getAmount());
  tx.cancel();
  audit.record("TRANSACTION_CANCELLED","FinancialTransaction",tx.getId(),"amount="+tx.getAmount());
  return ResponseEntity.noContent().build();
 }

 @GetMapping List<TransactionResponse> list(@RequestParam UUID ownerId,@RequestParam OffsetDateTime from,@RequestParam OffsetDateTime to){
  if(to.isBefore(from)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid date range");
  return transactions.findByOwnerIdAndOccurredAtBetweenOrderByOccurredAtDesc(ownerId,from,to).stream().map(this::toResponse).toList();
 }
 private TransactionResponse toResponse(FinancialTransaction t){return new TransactionResponse(t.getId(),t.getAccount().getId(),t.getCategory()==null?null:t.getCategory().getId(),t.getDescription(),t.getAmount(),t.getTransactionType(),t.getStatus(),t.getOccurredAt());}
 public record CreateTransactionRequest(@NotNull UUID ownerId,@NotNull UUID accountId,@NotNull UUID categoryId,@Size(max=180) String externalId,@NotBlank @Size(max=240) String description,@NotNull @DecimalMin("0.0001") BigDecimal amount,@NotNull TransactionType type,@NotNull OffsetDateTime occurredAt){}
 public record TransactionResponse(UUID id,UUID accountId,UUID categoryId,String description,BigDecimal amount,TransactionType type,TransactionStatus status,OffsetDateTime occurredAt){}
}
