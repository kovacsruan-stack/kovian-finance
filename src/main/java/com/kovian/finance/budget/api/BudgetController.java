package com.kovian.finance.budget.api;

import com.kovian.finance.budget.domain.*;
import com.kovian.finance.budget.repository.BudgetRepository;
import com.kovian.finance.category.repository.TransactionCategoryRepository;
import com.kovian.finance.security.CurrentUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/v1/budgets")
public class BudgetController {
    private final BudgetRepository repository;
    private final TransactionCategoryRepository categories;

    public BudgetController(BudgetRepository repository, TransactionCategoryRepository categories) {
        this.repository = repository;
        this.categories = categories;
    }

    @PostMapping
    ResponseEntity<BudgetResponse> create(@Valid @RequestBody CreateBudgetRequest r) {
        UUID ownerId = CurrentUser.ownerId();
        if (r.ownerId() != null && !ownerId.equals(r.ownerId())) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Owner scope violation");
        categories.findByIdAndOwnerId(r.categoryId(), ownerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));
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

    private BudgetResponse toResponse(Budget b) { return new BudgetResponse(b.getId(), b.getCategoryId(), b.getPeriod(), b.getPeriodStart(), b.getLimitAmount()); }
    public record CreateBudgetRequest(UUID ownerId, @NotNull UUID categoryId, @NotNull BudgetPeriod period, @NotNull OffsetDateTime periodStart, @NotNull @DecimalMin("0.00") BigDecimal limitAmount) {}
    public record BudgetResponse(UUID id, UUID categoryId, BudgetPeriod period, OffsetDateTime periodStart, BigDecimal limitAmount) {}
}
