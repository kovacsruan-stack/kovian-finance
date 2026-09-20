package com.kovian.finance.account.repository;

import com.kovian.finance.account.domain.FinancialAccount;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.*;

public interface FinancialAccountRepository extends JpaRepository<FinancialAccount, UUID> {
    Optional<FinancialAccount> findByIdAndOwnerId(UUID id, UUID ownerId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from FinancialAccount a where a.id = :id and a.ownerId = :ownerId")
    Optional<FinancialAccount> findByIdAndOwnerIdForUpdate(@Param("id") UUID id, @Param("ownerId") UUID ownerId);
    boolean existsByOwnerIdAndNameIgnoreCase(UUID ownerId, String name);
    List<FinancialAccount> findByOwnerIdOrderByName(UUID ownerId);
}
