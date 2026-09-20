package com.kovian.finance.category.repository;
import com.kovian.finance.category.domain.TransactionCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface TransactionCategoryRepository extends JpaRepository<TransactionCategory,UUID>{
 List<TransactionCategory> findByOwnerIdAndKindAndActiveTrueOrderByName(UUID ownerId,com.kovian.finance.category.domain.CategoryKind kind);
 boolean existsByOwnerIdAndNameIgnoreCaseAndKind(UUID ownerId,String name,com.kovian.finance.category.domain.CategoryKind kind);
 Optional<TransactionCategory> findByIdAndOwnerId(UUID id,UUID ownerId);
}
