package com.kovian.finance.account.repository;
import com.kovian.finance.account.domain.FinancialAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface FinancialAccountRepository extends JpaRepository<FinancialAccount, UUID> {
    Optional<FinancialAccount> findByIdAndOwnerId(UUID id, UUID ownerId);
    boolean existsByOwnerIdAndNameIgnoreCase(UUID ownerId, String name);
}
