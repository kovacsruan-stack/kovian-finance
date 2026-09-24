package com.kovian.finance.config;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.Test;

class DatasourceConfigurationContractTest {

    @Test
    void definesBoundedDatasourcePoolDefaults() throws Exception {
        String yaml = Files.readString(Path.of("src/main/resources/application.yml"));

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
        String yaml = Files.readString(Path.of("src/main/resources/application-prod.yml"));

        assertTrue(yaml.contains("default_schema: ${DB_SCHEMA:finance}"));
        assertTrue(yaml.contains("default-schema: ${DB_SCHEMA:finance}"));
        assertTrue(yaml.contains("schemas: ${DB_SCHEMA:finance}"));
        assertTrue(yaml.contains("create-schemas: true"));
    }

    @Test
    void flywayMigrationVersionsAreUnique() throws Exception {
        Path dir = Path.of("src/main/resources/db/migration");
        var versions = Files.list(dir).filter(p -> p.getFileName().toString().matches("V\\\\d+__.*\\\\.sql"))
                .map(p -> p.getFileName().toString().split("__", 2)[0]).toList();
        assertTrue(versions.size() == versions.stream().distinct().count(), "Duplicate Flyway migration version detected: " + versions);
    }
}
