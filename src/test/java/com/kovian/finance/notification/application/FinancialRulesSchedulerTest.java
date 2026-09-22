package com.kovian.finance.notification.application;

import com.kovian.finance.account.repository.FinancialAccountRepository;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FinancialRulesSchedulerTest {
    @Mock FinancialDueRules rules;
    @Mock FinancialAccountRepository accounts;

    @Test
    void isolatesOwnerFailureAndRecordsMetrics() {
        var first = UUID.randomUUID();
        var second = UUID.randomUUID();
        when(accounts.findDistinctOwnerIds()).thenReturn(List.of(first, second));
        doThrow(new IllegalStateException("owner failure")).when(rules).evaluate(any(), eq(first));

        var registry = new SimpleMeterRegistry();
        new FinancialRulesScheduler(rules, accounts, registry).evaluate();

        verify(rules).evaluate(any(), eq(first));
        verify(rules).evaluate(any(), eq(second));
        org.assertj.core.api.Assertions.assertThat(registry.counter("kovian_financial_rules_owner_evaluations_total").count()).isEqualTo(1);
        org.assertj.core.api.Assertions.assertThat(registry.counter("kovian_financial_rules_owner_evaluation_failures_total").count()).isEqualTo(1);
        org.assertj.core.api.Assertions.assertThat(registry.counter("kovian_financial_rules_owner_evaluations_attempted_total").count()).isEqualTo(2);
    }
}
