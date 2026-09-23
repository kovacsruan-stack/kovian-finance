package com.kovian.finance.category.api;

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

class CategoryControllerTest {
    @Test
    void create_rejectsParentWithDifferentKind() {
        UUID owner = UUID.randomUUID();
        UUID parentId = UUID.randomUUID();
        TransactionCategory parent = mock(TransactionCategory.class);
        when(parent.getKind()).thenReturn(CategoryKind.INCOME);

        TransactionCategoryRepository repository = mock(TransactionCategoryRepository.class);
        when(repository.findByIdAndOwnerId(parentId, owner)).thenReturn(Optional.of(parent));

        CategoryController controller = new CategoryController(repository);

        try (MockedStatic<CurrentUser> currentUser = mockStatic(CurrentUser.class)) {
            currentUser.when(CurrentUser::ownerId).thenReturn(owner);
            assertThrows(
                    org.springframework.web.server.ResponseStatusException.class,
                    () -> controller.create(new CategoryController.CreateCategoryRequest(
                            owner, "Expense child", CategoryKind.EXPENSE, parentId
                    ))
            );
        }
        verify(repository, never()).save(any());
    }
}
