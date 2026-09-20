package com.kovian.finance.notification.application;

import com.kovian.finance.account.repository.FinancialAccountRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.time.LocalDate;

@Component
public class FinancialRulesScheduler {
 private final FinancialDueRules rules;
 private final FinancialAccountRepository accounts;
 public FinancialRulesScheduler(FinancialDueRules rules,FinancialAccountRepository accounts){this.rules=rules;this.accounts=accounts;}
 @Scheduled(fixedDelayString="${kovian.notifications.rules-interval-ms:60000}")
 public void evaluate(){LocalDate today=LocalDate.now();for(var owner:accounts.findDistinctOwnerIds())rules.evaluate(today,owner);}
}