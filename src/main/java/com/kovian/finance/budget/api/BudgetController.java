package com.kovian.finance.budget.api;

import com.kovian.finance.budget.domain.*;
import com.kovian.finance.budget.repository.BudgetRepository;
import com.kovian.finance.category.repository.TransactionCategoryRepository;
import com.kovian.finance.security.CurrentUser;
import com.kovian.finance.transaction.repository.FinancialTransactionRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1/budgets")
public class BudgetController {
    private final BudgetRepository repository;
    private final TransactionCategoryRepository categories;
    private final FinancialTransactionRepository transactions;

    public BudgetController(BudgetRepository repository, TransactionCategoryRepository categories, FinancialTransactionRepository transactions) {
        this.repository = repository;
        this.categories = categories;
        this.transactions = transactions;
    }

    @PostMapping
    ResponseEntity<BudgetResponse> create(@Valid @RequestBody CreateBudgetRequest r) {
        UUID ownerId = CurrentUser.ownerId();
        if (r.ownerId() != null && !ownerId.equals(r.ownerId())) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Owner scope violation");
        var category = categories.findByIdAndOwnerId(r.categoryId(), ownerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));
        if (category.getKind() != com.kovian.finance.category.domain.CategoryKind.EXPENSE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Budgets require an expense category");
        }
        if (repository.existsByOwnerIdAndCategoryIdAndPeriodStart(ownerId, r.categoryId(), r.periodStart())) throw new ResponseStatusException(HttpStatus.CONFLICT, "Budget already exists");
        var b = repository.save(new Budget(ownerId, r.categoryId(), r.period(), r.periodStart(), r.limitAmount()));
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(b));
    }

    @GetMapping
    List<BudgetResponse> list(@RequestParam(required = false) UUID ownerId, @RequestParam OffsetDateTime from, @RequestParam OffsetDateTime to) {
        UUID currentOwnerId = CurrentUser.ownerId();
        if (ownerId != null && !currentOwnerId.equals(ownerId)) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Owner scope violation");
        if (to.isBefore(from)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid date range");
        return repository.findByOwnerIdAndPeriodStartBetweenOrderByPeriodStartDesc(currentOwnerId, from, to).stream().map(this::toResponse).toList();
    }

    private BudgetResponse toResponse(Budget b) {
        OffsetDateTime start = b.getPeriodStart();
        OffsetDateTime end = switch (b.getPeriod()) {
            case WEEKLY -> start.plusWeeks(1);
            case MONTHLY -> start.plusMonths(1);
            case YEARLY -> start.plusYears(1);
        };
        BigDecimal spent = transactions.sumPostedSignedByCategory(b.getOwnerId(), b.getCategoryId(), start, end);
        BigDecimal remaining = b.getLimitAmount().subtract(spent).max(BigDecimal.ZERO);
        BigDecimal percent = b.getLimitAmount().signum() == 0
                ? (spent.signum() > 0 ? new BigDecimal("100.00") : BigDecimal.ZERO)
                : spent.multiply(new BigDecimal("100")).divide(b.getLimitAmount(), 2, RoundingMode.HALF_UP);
        return new BudgetResponse(b.getId(), b.getCategoryId(), b.getPeriod(), start, b.getLimitAmount(), spent, remaining, percent);
    }

    public record CreateBudgetRequest(UUID ownerId, @NotNull UUID categoryId, @NotNull BudgetPeriod period, @NotNull OffsetDateTime periodStart, @NotNull @DecimalMin("0.00") BigDecimal limitAmount) {}
    public record BudgetResponse(UUID id, UUID categoryId, BudgetPeriod period, OffsetDateTime periodStart, BigDecimal limitAmount, BigDecimal spentAmount, BigDecimal remainingAmount, BigDecimal percentUsed) {}
}
