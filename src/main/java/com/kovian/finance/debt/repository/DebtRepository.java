package com.kovian.finance.debt.repository;
import com.kovian.finance.debt.domain.Debt; import com.kovian.finance.debt.domain.DebtStatus; import java.math.BigDecimal; import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public interface DebtRepository extends JpaRepository<Debt,UUID>{
 List<Debt> findByOwnerIdOrderByName(UUID o);
 List<Debt> findByStatusAndOutstandingAmountGreaterThanOrderByStartDateAsc(DebtStatus status,BigDecimal minimumOutstanding);
 Optional<Debt> findByIdAndOwnerId(UUID id,UUID o);
}