package com.kovian.finance.importer.repository;
import com.kovian.finance.importer.domain.ImportRowError; import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public interface ImportRowErrorRepository extends JpaRepository<ImportRowError,UUID>{List<ImportRowError> findByBatchIdOrderByRowNumber(UUID batchId);}