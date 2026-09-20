package com.kovian.finance.goal.repository;
import com.kovian.finance.goal.domain.FinancialGoal; import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public interface FinancialGoalRepository extends JpaRepository<FinancialGoal,UUID>{List<FinancialGoal> findByOwnerIdAndActiveTrueOrderByTargetDateAsc(UUID ownerId);}
