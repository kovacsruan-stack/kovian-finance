package com.kovian.finance.importer.repository;
import com.kovian.finance.importer.domain.ImportBatch; import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public interface ImportBatchRepository extends JpaRepository<ImportBatch,UUID>{Optional<ImportBatch> findByIdAndOwnerId(UUID id,UUID ownerId);List<ImportBatch> findTop50ByOwnerIdOrderByCreatedAtDesc(UUID ownerId);}