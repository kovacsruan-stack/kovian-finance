package com.kovian.finance.ledger.repository;

import com.kovian.finance.ledger.domain.LedgerEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface LedgerEntryRepository extends JpaRepository<LedgerEntry, UUID> {
    List<LedgerEntry> findByTransferIdOrderByCreatedAtAsc(UUID transferId);
}
