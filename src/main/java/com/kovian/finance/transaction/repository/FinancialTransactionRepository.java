package com.kovian.finance.transaction.repository;

import com.kovian.finance.transaction.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;
import java.time.OffsetDateTime;
import java.math.BigDecimal;
import java.util.*;

public interface FinancialTransactionRepository extends JpaRepository<FinancialTransaction, UUID> {
    boolean existsByOwnerIdAndExternalId(UUID ownerId, String externalId);
    Optional<FinancialTransaction> findByOwnerIdAndExternalId(UUID ownerId, String externalId);
    Optional<FinancialTransaction> findByIdAndOwnerId(UUID id, UUID ownerId);
    List<FinancialTransaction> findByOwnerIdAndOccurredAtBetweenOrderByOccurredAtDesc(UUID ownerId, OffsetDateTime from, OffsetDateTime to);

    @Query("""
        select t from FinancialTransaction t
         where t.ownerId = :owner
           and t.occurredAt >= :from
           and t.occurredAt < :to
           and t.status <> :excludedStatus
         order by t.occurredAt desc
        """)
    List<FinancialTransaction> findRecentNonCancelledByOwnerInWindow(
        @Param("owner") UUID owner,
        @Param("from") OffsetDateTime from,
        @Param("to") OffsetDateTime to,
        @Param("excludedStatus") TransactionStatus excludedStatus,
        Pageable pageable
    );


    @Query(value = """
        select cast(occurred_at as date) as date,
               coalesce(sum(case
                   when transaction_type = 'INCOME' then amount
                   when transaction_type = 'EXPENSE' then -amount
                   else 0
               end), 0) as net
          from financial_transactions
         where owner_id = :owner
           and occurred_at >= :from
           and occurred_at < :to
           and status <> :excludedStatus
         group by cast(occurred_at as date)
         order by cast(occurred_at as date) asc
        """, nativeQuery = true)
    List<DailyCashFlowProjection> findDailyCashFlowByOwnerInWindow(
        @Param("owner") UUID owner,
        @Param("from") OffsetDateTime from,
        @Param("to") OffsetDateTime to,
        @Param("excludedStatus") String excludedStatus
    );

    @Query("select coalesce(sum(case when t.transactionType='INCOME' then t.amount else -t.amount end),0) from FinancialTransaction t where t.ownerId=:owner and t.account.id=:account and t.status='POSTED'")
    BigDecimal sumPostedSignedByAccount(@Param("owner") UUID owner, @Param("account") UUID account);

    @Query("select coalesce(sum(t.amount),0) from FinancialTransaction t where t.ownerId=:owner and t.category.id=:category and t.status='POSTED' and t.transactionType='EXPENSE' and t.occurredAt >= :from and t.occurredAt < :to")
    BigDecimal sumPostedSignedByCategory(@Param("owner") UUID owner, @Param("category") UUID category, @Param("from") OffsetDateTime from, @Param("to") OffsetDateTime to);

    @Query("select coalesce(sum(t.amount),0) from FinancialTransaction t where t.ownerId=:owner and t.status='POSTED' and t.transactionType='INCOME' and t.occurredAt between :from and :to")
    BigDecimal sumPostedIncomeByOwnerAndOccurredAtBetween(@Param("owner") UUID owner, @Param("from") OffsetDateTime from, @Param("to") OffsetDateTime to);

    @Query("select coalesce(sum(t.amount),0) from FinancialTransaction t where t.ownerId=:owner and t.status='POSTED' and t.transactionType='EXPENSE' and t.occurredAt between :from and :to")
    BigDecimal sumPostedExpenseByOwnerAndOccurredAtBetween(@Param("owner") UUID owner, @Param("from") OffsetDateTime from, @Param("to") OffsetDateTime to);

    @Query("""
        select coalesce(sum(t.amount), 0) from FinancialTransaction t
         where t.ownerId = :owner
           and t.transactionType = :type
           and t.status <> :excludedStatus
           and t.occurredAt >= :from
           and t.occurredAt < :to
        """)
    BigDecimal sumNonCancelledByOwnerAndTypeInWindow(
        @Param("owner") UUID owner,
        @Param("type") TransactionType type,
        @Param("excludedStatus") TransactionStatus excludedStatus,
        @Param("from") OffsetDateTime from,
        @Param("to") OffsetDateTime to
    );
}