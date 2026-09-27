package com.kovian.finance.ledger.application;

import com.kovian.finance.security.CurrentUser;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mockStatic;

class TransferServiceRequestValidationTest {
    private final TransferService service = new TransferService(null, null, null, null, null);

    @Test
    void rejectsTransferBetweenSameAccountBeforePersistence() {
        UUID owner = UUID.randomUUID();
        UUID account = UUID.randomUUID();
        try (MockedStatic<CurrentUser> currentUser = mockStatic(CurrentUser.class)) {
            currentUser.when(CurrentUser::ownerId).thenReturn(owner);
            assertThrows(IllegalArgumentException.class, () -> service.transfer(
                    account, account, new BigDecimal("10.00"), "Invalid self-transfer", "self-transfer-key"));
        }
    }

    @Test
    void rejectsMissingIdempotencyKeyBeforePersistence() {
        UUID owner = UUID.randomUUID();
        try (MockedStatic<CurrentUser> currentUser = mockStatic(CurrentUser.class)) {
            currentUser.when(CurrentUser::ownerId).thenReturn(owner);
            assertThrows(IllegalArgumentException.class, () -> service.transfer(
                    UUID.randomUUID(), UUID.randomUUID(), new BigDecimal("10.00"), "Transfer without key", " "));
        }
    }
}
