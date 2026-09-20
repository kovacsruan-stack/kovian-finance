package com.kovian.finance.goal.repository;
import com.kovian.finance.goal.domain.FinancialGoal; import org.springframework.data.jpa.repository.*; import org.springframework.data.repository.query.Param; import java.time.OffsetDateTime; import java.util.*;
public interface FinancialGoalRepository extends JpaRepository<FinancialGoal,UUID>{
 List<FinancialGoal> findByOwnerIdAndActiveTrueOrderByTargetDateAsc(UUID ownerId);
 @Query("select g from FinancialGoal g where g.ownerId=:owner and g.active=true and g.targetDate between :from and :to order by g.targetDate asc")
 List<FinancialGoal> findActiveWithDeadlineBetweenForOwner(@Param("owner")UUID owner,@Param("from")OffsetDateTime from,@Param("to")OffsetDateTime to);
}