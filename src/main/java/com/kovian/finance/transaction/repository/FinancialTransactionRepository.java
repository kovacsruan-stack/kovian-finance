package com.kovian.finance.transaction.repository;
import com.kovian.finance.transaction.domain.*; import org.springframework.data.jpa.repository.*; import org.springframework.data.repository.query.Param; import java.time.OffsetDateTime; import java.math.BigDecimal; import java.util.*;
public interface FinancialTransactionRepository extends JpaRepository<FinancialTransaction,UUID>{
 boolean existsByOwnerIdAndExternalId(UUID ownerId,String externalId); Optional<FinancialTransaction> findByIdAndOwnerId(UUID id,UUID ownerId);
 List<FinancialTransaction> findByOwnerIdAndOccurredAtBetweenOrderByOccurredAtDesc(UUID ownerId,OffsetDateTime from,OffsetDateTime to);
 @Query("select coalesce(sum(case when t.transactionType='INCOME' then t.amount else -t.amount end),0) from FinancialTransaction t where t.ownerId=:owner and t.account.id=:account and t.status='POSTED'")
 BigDecimal sumPostedSignedByAccount(@Param("owner")UUID owner,@Param("account")UUID account);
 @Query("select coalesce(sum(t.amount),0) from FinancialTransaction t where t.ownerId=:owner and t.category.id=:category and t.status='POSTED' and t.transactionType='EXPENSE' and t.occurredAt >= :from and t.occurredAt < :to")
 BigDecimal sumPostedSignedByCategory(@Param("owner")UUID owner,@Param("category")UUID category,@Param("from")OffsetDateTime from,@Param("to")OffsetDateTime to);
 @Query("select coalesce(sum(t.amount),0) from FinancialTransaction t where t.ownerId=:owner and t.status='POSTED' and t.transactionType='INCOME' and t.occurredAt between :from and :to")
 BigDecimal sumPostedIncomeByOwnerAndOccurredAtBetween(@Param("owner")UUID owner,@Param("from")OffsetDateTime from,@Param("to")OffsetDateTime to);
 @Query("select coalesce(sum(t.amount),0) from FinancialTransaction t where t.ownerId=:owner and t.status='POSTED' and t.transactionType='EXPENSE' and t.occurredAt between :from and :to")
 BigDecimal sumPostedExpenseByOwnerAndOccurredAtBetween(@Param("owner")UUID owner,@Param("from")OffsetDateTime from,@Param("to")OffsetDateTime to);
}
