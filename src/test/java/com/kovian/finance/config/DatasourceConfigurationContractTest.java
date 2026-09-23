package com.kovian.finance.config;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.Test;

class DatasourceConfigurationContractTest {

    @Test
    void definesBoundedDatasourcePoolDefaults() throws Exception {
        String yaml = Files.readString(Path.of("src/main/resources/application.yml"));

        assertTrue(yaml.contains("SPRING_DATASOURCE_URL"));\n        assertTrue(yaml.contains("DATABASE_URL"));\n        assertTrue(yaml.contains("SPRING_DATASOURCE_USERNAME"));\n        assertTrue(yaml.contains("SPRING_DATASOURCE_PASSWORD"));\n        assertTrue(yaml.contains("maximum-pool-size"));
        assertTrue(yaml.contains("connection-timeout"));
        assertTrue(yaml.contains("validation-timeout"));
        assertTrue(yaml.contains("idle-timeout"));
        assertTrue(yaml.contains("max-lifetime"));
    }
}
