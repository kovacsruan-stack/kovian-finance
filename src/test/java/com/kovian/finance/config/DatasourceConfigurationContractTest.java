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

}
