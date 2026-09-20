package com.kovian.finance.reconciliation.api;
import com.kovian.finance.account.repository.FinancialAccountRepository; import com.kovian.finance.reconciliation.domain.*; import com.kovian.finance.reconciliation.repository.*; import com.kovian.finance.security.CurrentUser; import com.kovian.finance.transaction.repository.FinancialTransactionRepository; import org.springframework.transaction.annotation.Transactional; import org.springframework.web.bind.annotation.*; import java.math.*; import java.util.*;
@RestController @RequestMapping("/api/v1/reconciliation") public class ReconciliationController{
 private final FinancialAccountRepository accounts; private final FinancialTransactionRepository transactions; private final ReconciliationRunRepository runs;
 public ReconciliationController(FinancialAccountRepository a,FinancialTransactionRepository t,ReconciliationRunRepository r){accounts=a;transactions=t;runs=r;}
 @PostMapping("/accounts/{accountId}") @Transactional public ReconciliationResponse reconcile(@PathVariable UUID accountId){
  UUID owner=CurrentUser.ownerId(); var a=accounts.findByIdAndOwnerId(accountId,owner).orElseThrow(()->new IllegalArgumentException("Account not found"));
  BigDecimal movement=transactions.sumPostedSignedByAccount(owner,accountId); BigDecimal expected=a.getOpeningBalance().add(movement).setScale(4); BigDecimal actual=a.getCurrentBalance().setScale(4);
  var run=runs.save(new ReconciliationRun(owner,accountId,expected,actual)); return new ReconciliationResponse(run.getId(),run.getAccountId(),run.getExpectedBalance(),run.getActualBalance(),run.getDifference(),run.getStatus());
 }
 @GetMapping public List<ReconciliationResponse> history(){return runs.findTop50ByOwnerIdOrderByCreatedAtDesc(CurrentUser.ownerId()).stream().map(r->new ReconciliationResponse(r.getId(),r.getAccountId(),r.getExpectedBalance(),r.getActualBalance(),r.getDifference(),r.getStatus())).toList();}
 record ReconciliationResponse(UUID id,UUID accountId,BigDecimal expectedBalance,BigDecimal actualBalance,BigDecimal difference,String status){}
}