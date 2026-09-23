package com.kovian.finance.ai.api;
import com.kovian.finance.security.CurrentUser;
import com.kovian.finance.transaction.repository.FinancialTransactionRepository;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;
class FinancialInsightControllerTest {
 @Test void insights_rejectsDifferentOwner(){var owner=UUID.randomUUID();var c=new FinancialInsightController(mock(FinancialTransactionRepository.class));try(MockedStatic<CurrentUser> u=mockStatic(CurrentUser.class)){u.when(CurrentUser::ownerId).thenReturn(owner);assertThrows(org.springframework.web.server.ResponseStatusException.class,()->c.insights(UUID.randomUUID(),java.time.LocalDate.now().minusDays(1),java.time.LocalDate.now()));}}
}
