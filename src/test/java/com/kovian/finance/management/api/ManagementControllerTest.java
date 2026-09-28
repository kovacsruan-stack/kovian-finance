package com.kovian.finance.management.api;

import com.kovian.finance.management.domain.ManagementRecord;
import com.kovian.finance.management.repository.ManagementRecordRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ManagementControllerTest {
    @Mock
    private ManagementRecordRepository repository;

    @InjectMocks
    private ManagementController controller;

    private UUID ownerId;

    @BeforeEach
    void authenticateOwner() {
        ownerId = UUID.randomUUID();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(ownerId.toString(), "test", List.of()));
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void createsRecordWithAuthenticatedOwnerAndSourceIdentity() {
        when(repository.save(any(ManagementRecord.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = controller.create("students",
                new ManagementController.RecordRequest(Map.of("name", "Aluno"), "legacy-123"));

        assertEquals(ownerId, captureSavedOwner());
        assertEquals("legacy-123", response.sourceId());
        assertEquals("Aluno", response.data().get("name"));
        verify(repository).save(any(ManagementRecord.class));
    }

    @Test
    void archivesInsteadOfDeletingAndKeepsSourceData() {
        ManagementRecord record = new ManagementRecord(ownerId, "students", "legacy-456",
                Map.of("name", "Aluno histórico"));
        when(repository.findByIdAndOwnerIdAndResource(record.getId(), ownerId, "students"))
                .thenReturn(Optional.of(record));

        var response = controller.archive("students", record.getId());

        assertEquals(Boolean.TRUE, response.get("archived"));
        assertTrue(record.isArchived());
        assertEquals("legacy-456", record.getSourceId());
        assertEquals("Aluno histórico", record.getData().get("name"));
        verify(repository, never()).delete(any());
    }

    @Test
    void rejectsUnknownResources() {
        assertThrows(ResponseStatusException.class, () -> controller.list("unknown", false));
        verifyNoInteractions(repository);
    }

    private UUID captureSavedOwner() {
        var captor = org.mockito.ArgumentCaptor.forClass(ManagementRecord.class);
        verify(repository).save(captor.capture());
        return captor.getValue().getOwnerId();
    }
}
