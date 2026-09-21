package com.kovian.finance.goal.api;

import com.kovian.finance.goal.domain.FinancialGoal;
import com.kovian.finance.goal.repository.FinancialGoalRepository;
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
@RequestMapping("/api/v1/goals")
public class GoalController {
    private final FinancialGoalRepository repository;

    public GoalController(FinancialGoalRepository repository) { this.repository = repository; }

    @PostMapping
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
        if (ownerId != null && !currentOwnerId.equals(ownerId))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Owner scope violation");
        return repository.findByOwnerIdAndActiveTrueOrderByTargetDateAsc(currentOwnerId).stream().map(this::toResponse).toList();
    }

    private GoalResponse toResponse(FinancialGoal g) {
        return new GoalResponse(g.getId(), g.getName(), g.getTargetAmount(), g.getCurrentAmount(), g.getTargetDate(), g.isActive());
    }

    public record CreateGoalRequest(
        UUID ownerId,
        @NotBlank @Size(max=140) String name,
        @NotNull @DecimalMin("0.01") BigDecimal targetAmount,
        OffsetDateTime targetDate
    ) {}

    public record GoalResponse(
        UUID id, String name, BigDecimal targetAmount, BigDecimal currentAmount,
        OffsetDateTime targetDate, boolean active
    ) {}
}
