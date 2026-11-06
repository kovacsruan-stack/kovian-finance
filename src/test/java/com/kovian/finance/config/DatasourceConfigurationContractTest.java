package com.kovian.finance.config;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import org.junit.jupiter.api.Test;

class DatasourceConfigurationContractTest {

    @Test
    void definesBoundedDatasourcePoolDefaults() throws Exception {
        String yaml = readClasspathResource("application.yml");

        assertTrue(yaml.contains("SPRING_DATASOURCE_URL"));
        assertTrue(yaml.contains("DATABASE_URL"));
        assertTrue(yaml.contains("SPRING_DATASOURCE_USERNAME"));
        assertTrue(yaml.contains("SPRING_DATASOURCE_PASSWORD"));
        assertTrue(yaml.contains("maximum-pool-size"));
        assertTrue(yaml.contains("connection-timeout"));
        assertTrue(yaml.contains("validation-timeout"));
        assertTrue(yaml.contains("idle-timeout"));
        assertTrue(yaml.contains("max-lifetime"));
    }
    @Test
    void isolatesProductionPersistenceInFinanceSchema() throws Exception {
        String yaml = readClasspathResource("application-prod.yml");

        assertTrue(yaml.contains("default_schema: ${DB_SCHEMA:finance}"));
        assertTrue(yaml.contains("default-schema: ${DB_SCHEMA:finance}"));
        assertTrue(yaml.contains("schemas: ${DB_SCHEMA:finance}"));
        assertTrue(yaml.contains("create-schemas: true"));
    }

    @Test
    void flywayMigrationVersionsAreUnique() throws Exception {
        try (var stream = getClass().getClassLoader().getResourceAsStream("db/migration")) {
            assertTrue(stream != null, "Flyway migration resource directory must exist");
        }
    }
    private String readClasspathResource(String name) throws IOException {
        try (InputStream stream = getClass().getClassLoader().getResourceAsStream(name)) {
            assertTrue(stream != null, "Missing classpath resource: " + name);
            return new String(stream.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

}
