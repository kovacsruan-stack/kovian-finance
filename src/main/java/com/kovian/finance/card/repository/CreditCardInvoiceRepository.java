package com.kovian.finance.card.repository;
import com.kovian.finance.card.domain.CreditCardInvoice;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate; import java.util.*;
public interface CreditCardInvoiceRepository extends JpaRepository<CreditCardInvoice,UUID>{
 Optional<CreditCardInvoice> findByCardIdAndReferenceMonth(UUID c,LocalDate m);
 List<CreditCardInvoice> findByOwnerIdOrderByDueDate(UUID o);
 Optional<CreditCardInvoice> findByIdAndOwnerId(UUID id,UUID o);
 @Query("select i from CreditCardInvoice i where i.ownerId=:owner and i.dueDate between :from and :to and i.status <> com.kovian.finance.card.domain.InvoiceStatus.PAID order by i.dueDate asc")
 List<CreditCardInvoice> findDueBetweenForOwner(@Param("owner")UUID owner,@Param("from")LocalDate from,@Param("to")LocalDate to);
 @Query("select i from CreditCardInvoice i where i.ownerId=:owner and i.dueDate < :today and i.status <> com.kovian.finance.card.domain.InvoiceStatus.PAID order by i.dueDate asc")
 List<CreditCardInvoice> findOverdueForOwner(@Param("owner")UUID owner,@Param("today")LocalDate today);
}