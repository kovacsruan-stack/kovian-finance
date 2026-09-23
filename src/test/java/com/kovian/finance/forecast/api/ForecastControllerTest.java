package com.kovian.finance.forecast.api;

import com.kovian.finance.account.repository.FinancialAccountRepository;
import com.kovian.finance.security.CurrentUser;
import com.kovian.finance.transaction.repository.FinancialTransactionRepository;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class ForecastControllerTest {
    @Test
    void cashFlow_usesAuthenticatedOwnerEvenWhenRequestOwnerIsOmitted() {
        UUID owner = UUID.randomUUID();
        var transactions = mock(FinancialTransactionRepository.class);
        var accounts = mock(FinancialAccountRepository.class);
        when(transactions.findByOwnerIdAndOccurredAtBetweenOrderByOccurredAtDesc(eq(owner), any(), any())).thenReturn(List.of());
        when(accounts.findByOwnerIdOrderByName(owner)).thenReturn(List.of());

        var controller = new ForecastController(transactions, accounts);

        try (MockedStatic<CurrentUser> currentUser = mockStatic(CurrentUser.class)) {
            currentUser.when(CurrentUser::ownerId).thenReturn(owner);
            var result = controller.cashFlow(null, LocalDate.of(2026, 9, 23), 1);
            verify(transactions).findByOwnerIdAndOccurredAtBetweenOrderByOccurredAtDesc(eq(owner), any(), any());
            verify(accounts).findByOwnerIdOrderByName(owner);
            org.junit.jupiter.api.Assertions.assertEquals(1, result.size());
        }
    }

    @Test
    void cashFlow_rejectsDifferentRequestOwner() {
        UUID owner = UUID.randomUUID();
        UUID otherOwner = UUID.randomUUID();
        var controller = new ForecastController(mock(FinancialTransactionRepository.class), mock(FinancialAccountRepository.class));

        try (MockedStatic<CurrentUser> currentUser = mockStatic(CurrentUser.class)) {
            currentUser.when(CurrentUser::ownerId).thenReturn(owner);
            assertThrows(org.springframework.web.server.ResponseStatusException.class,
                () -> controller.cashFlow(otherOwner, LocalDate.of(2026, 9, 23), 30));
        }
    }

    @Test
    void cashFlow_rejectsInvalidHorizon() {
        UUID owner = UUID.randomUUID();
        var controller = new ForecastController(mock(FinancialTransactionRepository.class), mock(FinancialAccountRepository.class));

        try (MockedStatic<CurrentUser> currentUser = mockStatic(CurrentUser.class)) {
            currentUser.when(CurrentUser::ownerId).thenReturn(owner);
            assertThrows(org.springframework.web.server.ResponseStatusException.class,
                () -> controller.cashFlow(null, LocalDate.of(2026, 9, 23), 366));
        }
    }
}
