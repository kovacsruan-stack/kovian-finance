package com.kovian.finance.budget.repository;
import com.kovian.finance.budget.domain.Budget; import org.springframework.data.jpa.repository.JpaRepository; import java.util.*; import java.time.OffsetDateTime;
public interface BudgetRepository extends JpaRepository<Budget,UUID>{List<Budget> findByOwnerIdAndPeriodStartBetweenOrderByPeriodStartDesc(UUID ownerId,OffsetDateTime from,OffsetDateTime to);boolean existsByOwnerIdAndCategoryIdAndPeriodStart(UUID ownerId,UUID categoryId,OffsetDateTime start);}
