package com.kovian.finance.integration.contract;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

public record KoviFinanceToolContract(
    String contractVersion,
    String requestId,
    UUID workspaceId,
    UUID actorId,
    String operation,
    Map<String,Object> input,
    Instant issuedAt
) {
    public static final String CURRENT_VERSION="finance-domain-tool.v1";
    public KoviFinanceToolContract {
        Objects.requireNonNull(contractVersion);
        Objects.requireNonNull(requestId);
        Objects.requireNonNull(workspaceId);
        Objects.requireNonNull(actorId);
        Objects.requireNonNull(operation);
        Objects.requireNonNull(input);
        Objects.requireNonNull(issuedAt);
        if (!CURRENT_VERSION.equals(contractVersion)) throw new IllegalArgumentException("UNSUPPORTED_FINANCE_CONTRACT_VERSION");
        if (requestId.isBlank() || operation.isBlank()) throw new IllegalArgumentException("INVALID_FINANCE_TOOL_REQUEST");\n        if (!supportedReadOperations().contains(operation)) throw new IllegalArgumentException("UNSUPPORTED_FINANCE_TOOL_OPERATION");
    }
    public List<String> supportedReadOperations() {
        return List.of("get_financial_summary","get_cash_flow","get_income_expenses","get_budget_status","get_goals","get_debts","get_credit_card_status","get_upcoming_bills","get_forecast","get_financial_risks","get_category_analysis");
    }
}