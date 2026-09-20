package com.kovian.finance.goal.api;
import com.kovian.finance.goal.domain.FinancialGoal; import com.kovian.finance.goal.repository.FinancialGoalRepository; import jakarta.validation.Valid; import jakarta.validation.constraints.*; import org.springframework.http.*; import org.springframework.web.bind.annotation.*; import org.springframework.web.server.ResponseStatusException; import java.math.BigDecimal; import java.time.OffsetDateTime; import java.util.*;
@RestController @RequestMapping("/api/v1/goals")
public class GoalController{
 private final FinancialGoalRepository repository; public GoalController(FinancialGoalRepository repository){this.repository=repository;}
 @PostMapping ResponseEntity<GoalResponse> create(@Valid @RequestBody CreateGoalRequest r){var g=repository.save(new FinancialGoal(r.ownerId(),r.name(),r.targetAmount(),r.targetDate()));return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(g));}
 @GetMapping List<GoalResponse> list(@RequestParam UUID ownerId){return repository.findByOwnerIdAndActiveTrueOrderByTargetDateAsc(ownerId).stream().map(this::toResponse).toList();}
 private GoalResponse toResponse(FinancialGoal g){return new GoalResponse(g.getId(),g.getName(),g.getTargetAmount(),g.getCurrentAmount(),g.getTargetDate(),g.isActive());}
 public record CreateGoalRequest(@NotNull UUID ownerId,@NotBlank @Size(max=140) String name,@NotNull @DecimalMin("0.01") BigDecimal targetAmount,OffsetDateTime targetDate){}
 public record GoalResponse(UUID id,String name,BigDecimal targetAmount,BigDecimal currentAmount,OffsetDateTime targetDate,boolean active){}
}
