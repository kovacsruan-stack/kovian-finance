package com.kovian.finance.ledger.api;

import com.kovian.finance.ledger.application.TransferService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/transfers")
public class TransferController {
    private final TransferService service;

    public TransferController(TransferService service) {
        this.service = service;
    }

    @PostMapping
    ResponseEntity<TransferResponse> transfer(
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @Valid @RequestBody TransferRequest request) {
        var result = service.transfer(
            request.fromAccountId(), request.toAccountId(),
            request.amount(), request.description(), idempotencyKey);
        return ResponseEntity.status(result.replayed() ? HttpStatus.OK : HttpStatus.CREATED)
            .body(toResponse(result));
    }

    private TransferResponse toResponse(TransferService.TransferResult result) {
        var t = result.transfer();
        return new TransferResponse(t.getId(), t.getFromAccountId(), t.getToAccountId(),
            t.getAmount(), t.getDescription(), t.getStatus(), t.getCreatedAt(), result.replayed());
    }

    public record TransferRequest(
        @NotNull UUID fromAccountId,
        @NotNull UUID toAccountId,
        @NotNull @DecimalMin("0.0001") BigDecimal amount,
        @NotBlank @Size(max = 240) String description
    ) {}

    public record TransferResponse(
        UUID id, UUID fromAccountId, UUID toAccountId, BigDecimal amount,
        String description, com.kovian.finance.ledger.domain.LedgerTransferStatus status,
        java.time.OffsetDateTime createdAt, boolean replayed
    ) {}
}
