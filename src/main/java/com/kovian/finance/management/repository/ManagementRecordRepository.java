package com.kovian.finance.management.repository;

import com.kovian.finance.management.domain.ManagementRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ManagementRecordRepository extends JpaRepository<ManagementRecord, UUID> {
    List<ManagementRecord> findByOwnerIdAndResourceOrderByCreatedAtDesc(UUID ownerId, String resource);
    List<ManagementRecord> findByOwnerIdAndResourceAndArchivedOrderByCreatedAtDesc(UUID ownerId, String resource, boolean archived);
    Optional<ManagementRecord> findByIdAndOwnerIdAndResource(UUID id, UUID ownerId, String resource);
    List<ManagementRecord> findByOwnerIdAndResourceAndSourceIdIn(UUID ownerId, String resource, Collection<String> sourceIds);
}
