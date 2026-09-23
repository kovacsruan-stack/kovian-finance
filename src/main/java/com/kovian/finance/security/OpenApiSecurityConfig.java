package com.kovian.finance.security;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiSecurityConfig {

    @Bean
    OpenAPI kovianOpenAPI() {
        SecurityScheme bearerScheme = new SecurityScheme()
            .type(SecurityScheme.Type.HTTP)
            .scheme("bearer")
            .bearerFormat("JWT");

        Components components = new Components()
            .addSecuritySchemes("bearerAuth", bearerScheme);

        SecurityRequirement securityRequirement = new SecurityRequirement()
            .addList("bearerAuth");

        return new OpenAPI()
            .info(new Info()
                .title("KOVIAN Finance API")
                .version("0.2.0"))
            .components(components)
            .addSecurityItem(securityRequirement);
    }
}
