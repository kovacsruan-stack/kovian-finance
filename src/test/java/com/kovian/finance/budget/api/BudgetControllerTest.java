package com.kovian.finance.budget.api;

import com.kovian.finance.budget.repository.BudgetRepository;
import com.kovian.finance.category.domain.CategoryKind;
import com.kovian.finance.category.domain.TransactionCategory;
import com.kovian.finance.category.repository.TransactionCategoryRepository;
import com.kovian.finance.security.CurrentUser;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

class BudgetControllerTest {
    @Test
    void create_rejectsIncomeCategory() {
        UUID owner = UUID.randomUUID();
        UUID categoryId = UUID.randomUUID();
        TransactionCategory category = mock(TransactionCategory.class);
        when(category.getKind()).thenReturn(CategoryKind.INCOME);

        TransactionCategoryRepository categories = mock(TransactionCategoryRepository.class);
        when(categories.findByIdAndOwnerId(categoryId, owner)).thenReturn(Optional.of(category));

        BudgetController controller = new BudgetController(mock(BudgetRepository.class), categories, mock(com.kovian.finance.transaction.repository.FinancialTransactionRepository.class));

        try (MockedStatic<CurrentUser> currentUser = mockStatic(CurrentUser.class)) {
            currentUser.when(CurrentUser::ownerId).thenReturn(owner);
            assertThrows(
                    org.springframework.web.server.ResponseStatusException.class,
                    () -> controller.create(new BudgetController.CreateBudgetRequest(
                            owner, categoryId, com.kovian.finance.budget.domain.BudgetPeriod.MONTHLY,
                            java.time.OffsetDateTime.parse("2026-09-01T00:00:00Z"),
                            new java.math.BigDecimal("100")
                    ))
            );
        }
        verify(categories).findByIdAndOwnerId(categoryId, owner);
    }
}
