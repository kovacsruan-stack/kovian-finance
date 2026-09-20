package com.kovian.finance.notification.application;

import com.kovian.finance.account.repository.FinancialAccountRepository;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.time.LocalDate;

@Component
public class FinancialRulesScheduler {
 private final FinancialDueRules rules;
 private final FinancialAccountRepository accounts;
 private final MeterRegistry metrics;
 public FinancialRulesScheduler(FinancialDueRules rules,FinancialAccountRepository accounts,MeterRegistry metrics){this.rules=rules;this.accounts=accounts;this.metrics=metrics;}
 @Scheduled(fixedDelayString="${kovian.notifications.rules-interval-ms:60000}")
 public void evaluate(){LocalDate today=LocalDate.now();int owners=0;for(var owner:accounts.findDistinctOwnerIds()){rules.evaluate(today,owner);owners++;}metrics.counter("kovian_financial_rules_owner_evaluations_total").increment(owners);}
}