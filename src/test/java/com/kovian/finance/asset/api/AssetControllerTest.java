package com.kovian.finance.asset.api;

import com.kovian.finance.asset.repository.FinancialAssetRepository;
import com.kovian.finance.security.CurrentUser;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

class AssetControllerTest {
    @Test
    void list_usesAuthenticatedOwner() {
        UUID owner=UUID.randomUUID();
        var repo=mock(FinancialAssetRepository.class);
        when(repo.findByOwnerIdAndActiveTrue(owner)).thenReturn(List.of());
        var controller=new AssetController(repo);
        try(MockedStatic<CurrentUser> current=mockStatic(CurrentUser.class)){
            current.when(CurrentUser::ownerId).thenReturn(owner);
            controller.list(null);
            verify(repo).findByOwnerIdAndActiveTrue(owner);
        }
    }
    @Test
    void list_rejectsDifferentOwner() {
        UUID owner=UUID.randomUUID();
        var controller=new AssetController(mock(FinancialAssetRepository.class));
        try(MockedStatic<CurrentUser> current=mockStatic(CurrentUser.class)){
            current.when(CurrentUser::ownerId).thenReturn(owner);
            assertThrows(org.springframework.web.server.ResponseStatusException.class,()->controller.list(UUID.randomUUID()));
        }
    }
}
