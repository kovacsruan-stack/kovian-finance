package com.kovian.finance.budget.api;
import com.kovian.finance.budget.domain.*; import com.kovian.finance.budget.repository.BudgetRepository; import jakarta.validation.Valid; import jakarta.validation.constraints.*; import org.springframework.http.*; import org.springframework.web.bind.annotation.*; import org.springframework.web.server.ResponseStatusException; import java.math.BigDecimal; import java.time.OffsetDateTime; import java.util.*;
@RestController @RequestMapping("/api/v1/budgets")
public class BudgetController{
 private final BudgetRepository repository; public BudgetController(BudgetRepository repository){this.repository=repository;}
 @PostMapping ResponseEntity<BudgetResponse> create(@Valid @RequestBody CreateBudgetRequest r){if(repository.existsByOwnerIdAndCategoryIdAndPeriodStart(r.ownerId(),r.categoryId(),r.periodStart()))throw new ResponseStatusException(HttpStatus.CONFLICT,"Budget already exists");var b=repository.save(new Budget(r.ownerId(),r.categoryId(),r.period(),r.periodStart(),r.limitAmount()));return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(b));}
 @GetMapping List<BudgetResponse> list(@RequestParam UUID ownerId,@RequestParam OffsetDateTime from,@RequestParam OffsetDateTime to){return repository.findByOwnerIdAndPeriodStartBetweenOrderByPeriodStartDesc(ownerId,from,to).stream().map(this::toResponse).toList();}
 private BudgetResponse toResponse(Budget b){return new BudgetResponse(b.getId(),b.getCategoryId(),b.getPeriod(),b.getPeriodStart(),b.getLimitAmount());}
 public record CreateBudgetRequest(@NotNull UUID ownerId,@NotNull UUID categoryId,@NotNull BudgetPeriod period,@NotNull OffsetDateTime periodStart,@NotNull @DecimalMin("0.00") BigDecimal limitAmount){}
 public record BudgetResponse(UUID id,UUID categoryId,BudgetPeriod period,OffsetDateTime periodStart,BigDecimal limitAmount){}
}
