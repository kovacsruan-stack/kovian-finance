package com.kovian.finance.notification.application;
import org.springframework.scheduling.annotation.Scheduled; import org.springframework.stereotype.Component; import java.time.LocalDate;
@Component public class FinancialRulesScheduler{
 private final FinancialDueRules rules; public FinancialRulesScheduler(FinancialDueRules rules){this.rules=rules;}
 @Scheduled(fixedDelayString="${kovian.notifications.rules-interval-ms:60000}") public void evaluate(){rules.evaluate(LocalDate.now());}
}