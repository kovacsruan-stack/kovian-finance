package com.kovian.finance.ledger.application;

import com.kovian.finance.security.CurrentUser;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mockStatic;

class TransferServiceAmountValidationTest {
    @Test
    void rejectsPositiveAmountThatRoundsDownToZeroAtLedgerPrecision() {
        UUID owner = UUID.randomUUID();
        TransferService service = new TransferService(null, null, null, null, null);

        try (MockedStatic<CurrentUser> currentUser = mockStatic(CurrentUser.class)) {
            currentUser.when(CurrentUser::ownerId).thenReturn(owner);

            assertThrows(IllegalArgumentException.class, () -> service.transfer(
                    UUID.randomUUID(),
                    UUID.randomUUID(),
                    new BigDecimal("0.00001"),
                    "Small transfer",
                    "test-idempotency-key"
            ));
        }
    }
}
