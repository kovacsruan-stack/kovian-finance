package com.kovian.finance.account.api;

import com.kovian.finance.account.domain.*;
import com.kovian.finance.account.repository.FinancialAccountRepository;
import com.kovian.finance.security.CurrentUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/accounts")
public class AccountController {
    private final FinancialAccountRepository repository;

    public AccountController(FinancialAccountRepository repository) {
        this.repository = repository;
    }

    @PostMapping
    ResponseEntity<AccountResponse> create(@Valid @RequestBody CreateAccountRequest request) {
        UUID ownerId = CurrentUser.ownerId();
        if (request.ownerId() != null && !ownerId.equals(request.ownerId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Owner scope violation");
        }
        if (repository.existsByOwnerIdAndNameIgnoreCase(ownerId, request.name())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Account name already exists");
        }
        var account = repository.save(new FinancialAccount(
                ownerId,
                request.name(),
                request.accountType(),
                request.currency(),
                request.openingBalance()
        ));
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(account));
    }

    @GetMapping
    List<AccountResponse> list(@RequestParam(required = false) UUID ownerId) {
        UUID currentOwnerId = CurrentUser.ownerId();
        if (ownerId != null && !currentOwnerId.equals(ownerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Owner scope violation");
        }
        return repository.findByOwnerIdOrderByName(currentOwnerId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private AccountResponse toResponse(FinancialAccount a) {
        return new AccountResponse(
                a.getId(), a.getName(), a.getAccountType(), a.getCurrency(),
                a.getCurrentBalance(), a.getStatus()
        );
    }

    public record CreateAccountRequest(
            UUID ownerId,
            @NotBlank @Size(max = 120) String name,
            @NotNull AccountType accountType,
            @Pattern(regexp = "[A-Za-z]{3}") String currency,
            @NotNull BigDecimal openingBalance
    ) {}

    public record AccountResponse(
            UUID id, String name, AccountType accountType, String currency,
            BigDecimal currentBalance, AccountStatus status
    ) {}
}
