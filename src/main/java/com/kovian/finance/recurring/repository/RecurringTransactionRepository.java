package com.kovian.finance.recurring.repository;
import com.kovian.finance.recurring.domain.RecurringTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate; import java.util.*;
public interface RecurringTransactionRepository extends JpaRepository<RecurringTransaction,UUID> {
 List<RecurringTransaction> findByOwnerIdOrderByNextOccurrence(UUID ownerId);
 List<RecurringTransaction> findByActiveTrueAndNextOccurrenceLessThanEqual(LocalDate date);
 Optional<RecurringTransaction> findByIdAndOwnerId(UUID id, UUID ownerId);
}
