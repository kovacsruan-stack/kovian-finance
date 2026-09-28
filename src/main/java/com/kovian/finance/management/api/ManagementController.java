package com.kovian.finance.management.api;

import com.kovian.finance.management.domain.ManagementRecord;
import com.kovian.finance.management.repository.ManagementRecordRepository;
import com.kovian.finance.security.CurrentUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/management")
public class ManagementController {
    private static final Set<String> RESOURCES = Set.of("students", "modalities", "lessons", "payments");
    private final ManagementRecordRepository repository;

    public ManagementController(ManagementRecordRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/{resource}")
    public List<RecordResponse> list(@PathVariable String resource,
                                     @RequestParam(defaultValue = "false") boolean includeArchived) {
        requireResource(resource);
        UUID ownerId = CurrentUser.ownerId();
        List<ManagementRecord> records = includeArchived
                ? repository.findByOwnerIdAndResourceOrderByCreatedAtDesc(ownerId, resource)
                : repository.findByOwnerIdAndResourceAndArchivedOrderByCreatedAtDesc(ownerId, resource, false);
        return records.stream().map(RecordResponse::from).toList();
    }

    @PostMapping("/{resource}")
    @ResponseStatus(HttpStatus.CREATED)
    public RecordResponse create(@PathVariable String resource, @Valid @RequestBody RecordRequest request) {
        requireResource(resource);
        UUID ownerId = CurrentUser.ownerId();
        String sourceId = request.sourceId() == null || request.sourceId().isBlank()
                ? null : request.sourceId().trim();
        if (sourceId != null && !repository.findByOwnerIdAndResourceAndSourceIdIn(
                ownerId, resource, List.of(sourceId)).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Source record already imported");
        }
        return RecordResponse.from(repository.save(new ManagementRecord(
                ownerId, resource, sourceId, request.data())));
    }

    @PutMapping("/{resource}/{id}")
    @Transactional
    public RecordResponse update(@PathVariable String resource, @PathVariable UUID id,
                                 @Valid @RequestBody RecordUpdate request) {
        requireResource(resource);
        ManagementRecord record = findOwned(resource, id);
        record.replaceData(request.data());
        return RecordResponse.from(record);
    }

    @DeleteMapping("/{resource}/{id}")
    @Transactional
    public Map<String, Object> archive(@PathVariable String resource, @PathVariable UUID id) {
        requireResource(resource);
        ManagementRecord record = findOwned(resource, id);
        record.archive();
        return Map.of("archived", true, "id", record.getId());
    }

    @PostMapping("/import-batch/{resource}")
    @Transactional
    public ImportResult importBatch(@PathVariable String resource, @Valid @RequestBody ImportBatch request) {
        requireResource(resource);
        UUID ownerId = CurrentUser.ownerId();
        List<String> sourceIds = request.records().stream().map(ImportItem::sourceId).toList();
        if (new HashSet<>(sourceIds).size() != sourceIds.size()) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Duplicate source IDs in batch");
        }
        Map<String, ManagementRecord> existing = repository
                .findByOwnerIdAndResourceAndSourceIdIn(ownerId, resource, sourceIds)
                .stream().collect(Collectors.toMap(ManagementRecord::getSourceId, record -> record));
        int inserted = 0;
        int updated = 0;
        int unchanged = 0;
        for (ImportItem item : request.records()) {
            ManagementRecord record = existing.get(item.sourceId());
            if (record == null) {
                repository.save(new ManagementRecord(ownerId, resource, item.sourceId(), item.data()));
                inserted++;
            } else if (!record.getData().equals(item.data())) {
                record.replaceData(item.data());
                updated++;
            } else {
                unchanged++;
            }
        }
        return new ImportResult(resource, inserted, updated, unchanged);
    }

    private ManagementRecord findOwned(String resource, UUID id) {
        return repository.findByIdAndOwnerIdAndResource(id, CurrentUser.ownerId(), resource)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Management record not found"));
    }

    private static void requireResource(String resource) {
        if (!RESOURCES.contains(resource)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Management resource not found");
        }
    }

    public record RecordRequest(@NotEmpty Map<String, Object> data,
                                @Size(max = 120) String sourceId) {}
    public record RecordUpdate(@NotEmpty Map<String, Object> data) {}
    public record ImportItem(@NotBlank @Size(max = 120) String sourceId,
                             @NotEmpty Map<String, Object> data) {}
    public record ImportBatch(@NotEmpty @Size(max = 500) List<@Valid ImportItem> records) {}
    public record ImportResult(String resource, int inserted, int updated, int unchanged) {}
    public record RecordResponse(UUID id, String sourceId, Map<String, Object> data, boolean archived,
                                 OffsetDateTime createdAt, OffsetDateTime updatedAt) {
        static RecordResponse from(ManagementRecord record) {
            return new RecordResponse(record.getId(), record.getSourceId(), record.getData(),
                    record.isArchived(), record.getCreatedAt(), record.getUpdatedAt());
        }
    }
}
