package com.kovian.finance.analytics.api;
import com.kovian.finance.account.repository.FinancialAccountRepository;
import com.kovian.finance.asset.repository.FinancialAssetRepository;
import com.kovian.finance.debt.repository.DebtRepository;
import com.kovian.finance.liability.repository.FinancialLiabilityRepository;
import com.kovian.finance.security.CurrentUser;
import com.kovian.finance.transaction.repository.FinancialTransactionRepository;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;
class FinancialAnalyticsControllerTest {
 @Test void dashboard_rejectsDifferentOwner(){var owner=UUID.randomUUID();var c=new FinancialAnalyticsController(mock(FinancialTransactionRepository.class),mock(FinancialAssetRepository.class),mock(FinancialLiabilityRepository.class),mock(DebtRepository.class));try(MockedStatic<CurrentUser> u=mockStatic(CurrentUser.class)){u.when(CurrentUser::ownerId).thenReturn(owner);assertThrows(org.springframework.web.server.ResponseStatusException.class,()->c.dashboard(UUID.randomUUID(),java.time.LocalDate.now(),java.time.LocalDate.now()));}}
}
