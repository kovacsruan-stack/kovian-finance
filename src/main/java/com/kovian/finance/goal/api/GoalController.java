package com.kovian.finance.goal.api;

import com.kovian.finance.goal.domain.FinancialGoal;
import com.kovian.finance.goal.repository.FinancialGoalRepository;
import com.kovian.finance.security.CurrentUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/v1/goals")
public class GoalController {
    private final FinancialGoalRepository repository;

    public GoalController(FinancialGoalRepository repository) { this.repository = repository; }

    @PostMapping
    @Transactional
    ResponseEntity<GoalResponse> create(@Valid @RequestBody CreateGoalRequest request) {
        UUID ownerId = CurrentUser.ownerId();
        if (request.ownerId() != null && !ownerId.equals(request.ownerId()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Owner scope violation");
        var goal = repository.save(new FinancialGoal(ownerId, request.name(), request.targetAmount(), request.targetDate()));
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(goal));
    }

    @GetMapping
    List<GoalResponse> list(@RequestParam(required = false) UUID ownerId) {
        UUID currentOwnerId = CurrentUser.ownerId();
        requireOwner(ownerId, currentOwnerId);
        return repository.findByOwnerIdOrderByActiveDescTargetDateAsc(currentOwnerId).stream().map(this::toResponse).toList();
    }

    @PutMapping("/{id}")
    @Transactional
    GoalResponse update(@PathVariable UUID id, @Valid @RequestBody UpdateGoalRequest request) {
        UUID owner = CurrentUser.ownerId();
        var goal = findOwned(id, owner);
        try {
            goal.update(request.name(), request.targetAmount(), request.targetDate());
        } catch (IllegalArgumentException | IllegalStateException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
        return toResponse(repository.save(goal));
    }

    @PostMapping("/{id}/contributions")
    @Transactional
    GoalResponse contribute(@PathVariable UUID id, @Valid @RequestBody ContributionRequest request) {
        UUID owner = CurrentUser.ownerId();
        var goal = findOwned(id, owner);
        try {
            goal.addContribution(request.amount());
        } catch (IllegalArgumentException | IllegalStateException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
        return toResponse(repository.save(goal));
    }

    @PostMapping("/{id}/archive")
    @Transactional
    GoalResponse archive(@PathVariable UUID id) {
        UUID owner = CurrentUser.ownerId();
        var goal = findOwned(id, owner);
        goal.archive();
        return toResponse(repository.save(goal));
    }

    private FinancialGoal findOwned(UUID id, UUID owner) {
        return repository.findByIdAndOwnerId(id, owner)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Goal not found"));
    }

    private void requireOwner(UUID requested, UUID current) {
        if (requested != null && !current.equals(requested))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Owner scope violation");
    }

    private GoalResponse toResponse(FinancialGoal goal) {
        return new GoalResponse(goal.getId(), goal.getName(), goal.getTargetAmount(),
                goal.getCurrentAmount(), goal.getTargetDate(), goal.isActive());
    }

    public record CreateGoalRequest(UUID ownerId, @NotBlank @Size(max = 140) String name,
            @NotNull @DecimalMin("0.01") BigDecimal targetAmount, OffsetDateTime targetDate) {}
    public record UpdateGoalRequest(@NotBlank @Size(max = 140) String name,
            @NotNull @DecimalMin("0.01") BigDecimal targetAmount, OffsetDateTime targetDate) {}
    public record ContributionRequest(@NotNull @DecimalMin("0.01") BigDecimal amount) {}
    public record GoalResponse(UUID id, String name, BigDecimal targetAmount, BigDecimal currentAmount,
            OffsetDateTime targetDate, boolean active) {}
}