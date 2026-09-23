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
}
