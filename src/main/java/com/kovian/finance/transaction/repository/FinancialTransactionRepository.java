package com.kovian.finance.transaction.repository;
import com.kovian.finance.transaction.domain.FinancialTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.OffsetDateTime; import java.util.*;
public interface FinancialTransactionRepository extends JpaRepository<FinancialTransaction,UUID>{
 boolean existsByOwnerIdAndExternalId(UUID ownerId,String externalId);
 Optional<FinancialTransaction> findByIdAndOwnerId(UUID id,UUID ownerId);
 List<FinancialTransaction> findByOwnerIdAndOccurredAtBetweenOrderByOccurredAtDesc(UUID ownerId,OffsetDateTime from,OffsetDateTime to);
}
