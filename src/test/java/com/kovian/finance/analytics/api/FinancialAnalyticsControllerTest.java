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
 @Test void dashboard_rejectsOversizedWindow(){var owner=UUID.randomUUID();var c=new FinancialAnalyticsController(mock(FinancialTransactionRepository.class),mock(FinancialAssetRepository.class),mock(FinancialLiabilityRepository.class),mock(DebtRepository.class));try(MockedStatic<CurrentUser> u=mockStatic(CurrentUser.class)){u.when(CurrentUser::ownerId).thenReturn(owner);assertThrows(org.springframework.web.server.ResponseStatusException.class,()->c.dashboard(null,java.time.LocalDate.of(2026,1,1),java.time.LocalDate.of(2027,1,2)));}}
 @Test void categories_rejectsReversedWindow(){var owner=UUID.randomUUID();var c=new FinancialAnalyticsController(mock(FinancialTransactionRepository.class),mock(FinancialAssetRepository.class),mock(FinancialLiabilityRepository.class),mock(DebtRepository.class));try(MockedStatic<CurrentUser> u=mockStatic(CurrentUser.class)){u.when(CurrentUser::ownerId).thenReturn(owner);assertThrows(org.springframework.web.server.ResponseStatusException.class,()->c.categories(null,java.time.LocalDate.now(),java.time.LocalDate.now().minusDays(1)));}}
}
