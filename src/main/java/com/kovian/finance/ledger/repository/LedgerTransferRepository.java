package com.kovian.finance.ledger.repository;

import com.kovian.finance.ledger.domain.LedgerTransfer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface LedgerTransferRepository extends JpaRepository<LedgerTransfer, UUID> {
    Optional<LedgerTransfer> findByIdAndOwnerId(UUID id, UUID ownerId);
}
