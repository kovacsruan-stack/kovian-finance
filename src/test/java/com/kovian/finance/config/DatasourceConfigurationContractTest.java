package com.kovian.finance.config;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.io.InputStream;
import java.net.URISyntaxException;
import java.nio.file.Files;
import java.nio.file.Path;
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
        var resource = getClass().getClassLoader().getResource("db/migration");
        assertTrue(resource != null, "Flyway migration resource directory must exist");
        Path directory = Path.of(resource.toURI());
        try (var files = Files.list(directory)) {
            var versions = files
                    .map(pathEntry -> pathEntry.getFileName().toString())
                    .filter(name -> name.matches("V\\\\d+__.*\\\\.sql"))
                    .map(name -> name.split("__", 2)[0])
                    .toList();
            assertTrue(
                    versions.size() == versions.stream().distinct().count(),
                    "Duplicate Flyway migration version detected: " + versions
            );
        }
    }
    private String readClasspathResource(String name) throws IOException {
        try (InputStream stream = getClass().getClassLoader().getResourceAsStream(name)) {
            assertTrue(stream != null, "Missing classpath resource: " + name);
            return new String(stream.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

}
