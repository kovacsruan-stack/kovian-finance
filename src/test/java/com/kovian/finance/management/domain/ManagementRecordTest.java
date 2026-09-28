package com.kovian.finance.management.domain;

import org.junit.jupiter.api.Test;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class ManagementRecordTest {
    @Test
    void preservesSourceIdentityAndDataAcrossArchiveLifecycle() {
        UUID ownerId = UUID.randomUUID();
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("name", "Aluno de teste");
        data.put("phone", "11999999999");
        ManagementRecord record = new ManagementRecord(ownerId, "students", "legacy-student-42", data);

        assertEquals(ownerId, record.getOwnerId());
        assertEquals("students", record.getResource());
        assertEquals("legacy-student-42", record.getSourceId());
        assertEquals("Aluno de teste", record.getData().get("name"));

        record.archive();
        assertTrue(record.isArchived());
        assertEquals("legacy-student-42", record.getSourceId());
        assertEquals("11999999999", record.getData().get("phone"));

        record.restore();
        assertFalse(record.isArchived());
    }

    @Test
    void doesNotExposeMutableInternalDataMap() {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("name", "Aluno");
        ManagementRecord record = new ManagementRecord(UUID.randomUUID(), "students", null, data);

        record.getData().put("name", "Alterado fora");
        assertEquals("Aluno", record.getData().get("name"));
    }
}
