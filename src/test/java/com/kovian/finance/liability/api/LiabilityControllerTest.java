package com.kovian.finance.liability.api;

import com.kovian.finance.liability.repository.FinancialLiabilityRepository;
import com.kovian.finance.security.CurrentUser;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

class LiabilityControllerTest {
    @Test
    void list_usesAuthenticatedOwner() {
        UUID owner=UUID.randomUUID();
        var repo=mock(FinancialLiabilityRepository.class);
        when(repo.findByOwnerIdAndActiveTrue(owner)).thenReturn(List.of());
        var controller=new LiabilityController(repo);
        try(MockedStatic<CurrentUser> current=mockStatic(CurrentUser.class)){
            current.when(CurrentUser::ownerId).thenReturn(owner);
            controller.list(null);
            verify(repo).findByOwnerIdAndActiveTrue(owner);
        }
    }
    @Test
    void list_rejectsDifferentOwner() {
        UUID owner=UUID.randomUUID();
        var controller=new LiabilityController(mock(FinancialLiabilityRepository.class));
        try(MockedStatic<CurrentUser> current=mockStatic(CurrentUser.class)){
            current.when(CurrentUser::ownerId).thenReturn(owner);
            assertThrows(org.springframework.web.server.ResponseStatusException.class,()->controller.list(UUID.randomUUID()));
        }
    }
    @Test
    void update_rejectsNegativeAmount() {
        UUID owner=UUID.randomUUID(); UUID liabilityId=UUID.randomUUID();
        var repo=mock(FinancialLiabilityRepository.class);
        var liability=mock(com.kovian.finance.liability.domain.FinancialLiability.class);
        when(liability.getOwnerId()).thenReturn(owner);
        when(repo.findById(liabilityId)).thenReturn(java.util.Optional.of(liability));
        var controller=new LiabilityController(repo);
        try(MockedStatic<CurrentUser> current=mockStatic(CurrentUser.class)){
            current.when(CurrentUser::ownerId).thenReturn(owner);
            assertThrows(org.springframework.web.server.ResponseStatusException.class,()->controller.update(liabilityId,null,new java.math.BigDecimal("-1")));
        }
    }
}
