package com.kovian.finance.notification.application;

import com.kovian.finance.notification.domain.Notification;
import com.kovian.finance.notification.repository.NotificationRepository;
import com.kovian.finance.security.CurrentUser;
import com.kovian.finance.outbox.application.OutboxEventService;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class NotificationServiceTest {
    @Test
    void markAllReadOnlyTouchesNotificationsOwnedByCurrentOwner() {
        UUID owner = UUID.randomUUID();
        Notification first = new Notification(owner,"INFO","INFO","One","One",null,null,"one");
        Notification second = new Notification(owner,"INFO","WARNING","Two","Two",null,null,"two");
        NotificationRepository repository = mock(NotificationRepository.class);
        when(repository.findTop100ByOwnerIdAndReadAtIsNullOrderByCreatedAtDesc(owner)).thenReturn(List.of(first, second));
        NotificationService service = new NotificationService(repository, mock(OutboxEventService.class));

        try (MockedStatic<CurrentUser> user = mockStatic(CurrentUser.class)) {
            user.when(CurrentUser::ownerId).thenReturn(owner);
            assertEquals(2, service.markAllRead());
        }

        assertNotNull(first.getReadAt());
        assertNotNull(second.getReadAt());
        verify(repository).findTop100ByOwnerIdAndReadAtIsNullOrderByCreatedAtDesc(owner);
    }
}