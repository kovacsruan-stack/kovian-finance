package com.kovian.finance.category.api;

import com.kovian.finance.category.domain.*;
import com.kovian.finance.category.repository.*;
import com.kovian.finance.security.CurrentUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;

@RestController
@RequestMapping("/api/v1/categories")
public class CategoryController {
    private final TransactionCategoryRepository repository;
    public CategoryController(TransactionCategoryRepository repository) { this.repository = repository; }

    @PostMapping
    ResponseEntity<CategoryResponse> create(@Valid @RequestBody CreateCategoryRequest r) {
        UUID ownerId = CurrentUser.ownerId();
        if (r.ownerId() != null && !ownerId.equals(r.ownerId())) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Owner scope violation");
        if (r.parentId() != null) {
            repository.findByIdAndOwnerId(r.parentId(), ownerId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Parent category not found"));
        }
        if (repository.existsByOwnerIdAndNameIgnoreCaseAndKind(ownerId, r.name(), r.kind())) throw new ResponseStatusException(HttpStatus.CONFLICT, "Category already exists");
        var c = repository.save(new TransactionCategory(ownerId, r.name(), r.kind(), r.parentId()));
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(c));
    }

    @GetMapping
    List<CategoryResponse> list(@RequestParam(required = false) UUID ownerId, @RequestParam CategoryKind kind) {
        UUID currentOwnerId = CurrentUser.ownerId();
        if (ownerId != null && !currentOwnerId.equals(ownerId)) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Owner scope violation");
        return repository.findByOwnerIdAndKindAndActiveTrueOrderByName(currentOwnerId, kind).stream().map(this::toResponse).toList();
    }

    private CategoryResponse toResponse(TransactionCategory c) { return new CategoryResponse(c.getId(), c.getName(), c.getKind(), c.getParentId()); }
    public record CreateCategoryRequest(UUID ownerId, @NotBlank @Size(max=100) String name, @NotNull CategoryKind kind, UUID parentId) {}
    public record CategoryResponse(UUID id, String name, CategoryKind kind, UUID parentId) {}
}
