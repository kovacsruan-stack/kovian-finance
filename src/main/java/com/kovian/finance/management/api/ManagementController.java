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
    private static final Set<String> RESOURCES = Set.of("students", "modalities", "lessons", "payments", "expenses", "waitlist", "calendar_events");
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
        validateStudentLink(resource, request.data(), ownerId);
        return RecordResponse.from(repository.save(new ManagementRecord(
                ownerId, resource, sourceId, request.data())));
    }

    @PutMapping("/{resource}/{id}")
    @Transactional
    public RecordResponse update(@PathVariable String resource, @PathVariable UUID id,
                                 @Valid @RequestBody RecordUpdate request) {
        requireResource(resource);
        ManagementRecord record = findOwned(resource, id);
        validateStudentLink(resource, request.data(), CurrentUser.ownerId());
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

    @PostMapping("/{resource}/{id}/restore")
    @Transactional
    public Map<String, Object> restore(@PathVariable String resource, @PathVariable UUID id) {
        requireResource(resource);
        ManagementRecord record = findOwned(resource, id);
        record.restore();
        return Map.of("restored", true, "id", record.getId());
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
        int unresolvedStudentLinks = 0;
        for (ImportItem item : request.records()) {
            NormalizedImport normalized = normalizeImportedData(ownerId, resource, item.data());
            if (normalized.unresolvedStudentLink()) unresolvedStudentLinks++;
            ManagementRecord record = existing.get(item.sourceId());
            if (record == null) {
                repository.save(new ManagementRecord(ownerId, resource, item.sourceId(), normalized.data()));
                inserted++;
            } else if (!record.getData().equals(normalized.data())) {
                record.replaceData(normalized.data());
                updated++;
            } else {
                unchanged++;
            }
        }
        return new ImportResult(resource, inserted, updated, unchanged, unresolvedStudentLinks);
    }

    @PostMapping("/reconcile")
    @Transactional(readOnly = true)
    public ReconciliationResult reconcile(@Valid @RequestBody ReconciliationRequest request) {
        UUID ownerId = CurrentUser.ownerId();
        Map<String, Long> expected = request.expectedCounts() == null ? Map.of() : request.expectedCounts();
        if (expected.entrySet().stream().anyMatch(entry ->
                !RESOURCES.contains(entry.getKey()) || entry.getValue() == null || entry.getValue() < 0)) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "Expected counts must contain known resources and non-negative values");
        }
        Map<String, ResourceReconciliation> resources = new LinkedHashMap<>();
        for (String resource : RESOURCES) {
            List<ManagementRecord> records = repository.findByOwnerIdAndResourceOrderByCreatedAtDesc(ownerId, resource);
            long expectedCount = expected.getOrDefault(resource, -1L);
            long actualCount = records.size();
            resources.put(resource, new ResourceReconciliation(
                    expectedCount,
                    actualCount,
                    expectedCount < 0 ? null : actualCount - expectedCount));
        }

        Set<String> studentIds = repository.findByOwnerIdAndResourceOrderByCreatedAtDesc(ownerId, "students")
                .stream().map(record -> record.getId().toString()).collect(Collectors.toSet());
        long unresolvedLinks = java.util.stream.Stream.of("lessons", "payments")
                .flatMap(resource -> repository.findByOwnerIdAndResourceOrderByCreatedAtDesc(ownerId, resource).stream())
                .filter(record -> {
                    Object studentId = record.getData().get("studentId");
                    return studentId == null || !studentIds.contains(String.valueOf(studentId));
                }).count();

        boolean countsMatch = resources.values().stream()
                .allMatch(item -> item.expectedCount() < 0 || item.delta() == 0);
        return new ReconciliationResult(resources, unresolvedLinks, countsMatch && unresolvedLinks == 0);
    }

    private void validateStudentLink(String resource, Map<String, Object> data, UUID ownerId) {
        if (!resource.equals("lessons") && !resource.equals("payments")) return;
        Object studentIdValue = data.get("studentId");
        if (studentIdValue == null || String.valueOf(studentIdValue).isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Select a valid student");
        }
        try {
            UUID studentId = UUID.fromString(String.valueOf(studentIdValue));
            if (repository.findByIdAndOwnerIdAndResource(studentId, ownerId, "students").isEmpty()) {
                throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Student is not available to this owner");
            }
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Student ID must be a valid Finance record ID");
        }
    }

    private NormalizedImport normalizeImportedData(UUID ownerId, String resource, Map<String, Object> rawData) {
        Map<String, Object> data = new LinkedHashMap<>(rawData);
        if (!resource.equals("lessons") && !resource.equals("payments")) {
            return new NormalizedImport(data, false);
        }
        String sourceStudentId = Objects.toString(data.get("studentId"), "").trim();
        String studentName = Objects.toString(data.get("studentName"), Objects.toString(data.get("student"), "")).trim();
        ManagementRecord student = null;
        if (!sourceStudentId.isEmpty()) {
            student = repository.findByOwnerIdAndResourceAndSourceIdIn(ownerId, "students", List.of(sourceStudentId))
                    .stream().findFirst().orElse(null);
        }
        if (student == null && !studentName.isEmpty()) {
            String normalizedName = normalizeName(studentName);
            List<ManagementRecord> matches = repository.findByOwnerIdAndResourceOrderByCreatedAtDesc(ownerId, "students")
                    .stream()
                    .filter(candidate -> normalizeName(Objects.toString(candidate.getData().get("name"), "")).equals(normalizedName))
                    .toList();
            if (matches.size() == 1) student = matches.getFirst();
        }
        if (student == null) {
            return new NormalizedImport(data, true);
        }
        if (!sourceStudentId.isEmpty()) data.put("sourceStudentId", sourceStudentId);
        if (!studentName.isEmpty()) data.put("sourceStudentName", studentName);
        data.put("studentId", student.getId().toString());
        data.putIfAbsent("studentName", Objects.toString(student.getData().get("name"), studentName));
        return new NormalizedImport(data, false);
    }

    private static String normalizeName(String value) {
        return java.text.Normalizer.normalize(value, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "").trim().toLowerCase(Locale.ROOT);
    }

    private record NormalizedImport(Map<String, Object> data, boolean unresolvedStudentLink) {}

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
    public record ImportResult(String resource, int inserted, int updated, int unchanged, int unresolvedStudentLinks) {}
    public record ReconciliationRequest(Map<String, Long> expectedCounts) {}
    public record ResourceReconciliation(long expectedCount, long actualCount, Long delta) {}
    public record ReconciliationResult(Map<String, ResourceReconciliation> resources,
                                       long unresolvedStudentLinks, boolean reconciled) {}
    public record RecordResponse(UUID id, String sourceId, Map<String, Object> data, boolean archived,
                                 OffsetDateTime createdAt, OffsetDateTime updatedAt) {
        static RecordResponse from(ManagementRecord record) {
            return new RecordResponse(record.getId(), record.getSourceId(), record.getData(),
                    record.isArchived(), record.getCreatedAt(), record.getUpdatedAt());
        }
    }
}
