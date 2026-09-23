package com.kovian.finance.debt.api;
import com.kovian.finance.debt.repository.*;
import com.kovian.finance.security.CurrentUser;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import java.util.UUID;
import java.math.BigDecimal;
import java.time.LocalDate;
import com.kovian.finance.debt.domain.DebtType;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;
class DebtControllerTest {
 @Test void list_rejectsDifferentOwner(){UUID owner=UUID.randomUUID();var c=new DebtController(mock(DebtRepository.class),mock(DebtInstallmentRepository.class));try(MockedStatic<CurrentUser> u=mockStatic(CurrentUser.class)){u.when(CurrentUser::ownerId).thenReturn(owner);assertThrows(org.springframework.web.server.ResponseStatusException.class,()->c.list(UUID.randomUUID()));}}
 @Test void installments_rejectsDebtFromOtherOwner(){UUID owner=UUID.randomUUID();var c=new DebtController(mock(DebtRepository.class),mock(DebtInstallmentRepository.class));try(MockedStatic<CurrentUser> u=mockStatic(CurrentUser.class)){u.when(CurrentUser::ownerId).thenReturn(owner);assertThrows(org.springframework.web.server.ResponseStatusException.class,()->c.installments(UUID.randomUUID()));}}
 @Test void create_rejectsNegativeInterestRate(){
  UUID owner=UUID.randomUUID(); var c=new DebtController(mock(DebtRepository.class),mock(DebtInstallmentRepository.class));
  try(MockedStatic<CurrentUser> u=mockStatic(CurrentUser.class)){u.when(CurrentUser::ownerId).thenReturn(owner);
   assertThrows(org.springframework.web.server.ResponseStatusException.class,()->c.create(new DebtController.CreateRequest(owner,"Loan",DebtType.LOAN,new BigDecimal("1000"),new BigDecimal("-1"),LocalDate.now(),null,12)));
  }
 }
 @Test void create_rejectsEndDateBeforeStart(){
  UUID owner=UUID.randomUUID(); var c=new DebtController(mock(DebtRepository.class),mock(DebtInstallmentRepository.class));
  try(MockedStatic<CurrentUser> u=mockStatic(CurrentUser.class)){u.when(CurrentUser::ownerId).thenReturn(owner);
   assertThrows(org.springframework.web.server.ResponseStatusException.class,()->c.create(new DebtController.CreateRequest(owner,"Loan",DebtType.LOAN,new BigDecimal("1000"),BigDecimal.ZERO,LocalDate.of(2026,9,20),LocalDate.of(2026,9,19),12)));
  }
 }
}
