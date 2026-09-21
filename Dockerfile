FROM maven:3.9.12-eclipse-temurin-21-alpine AS builder
WORKDIR /app

COPY pom.xml ./
RUN mvn -B -DskipTests dependency:go-offline

COPY src src
RUN mvn -B -DskipTests clean package

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
RUN chown -R 10001:10001 /app
USER 10001:10001
EXPOSE 8082
ENV SPRING_PROFILES_ACTIVE=prod
ENV SERVER_PORT=8082
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 CMD wget -qO- http://127.0.0.1:8082/actuator/health >/dev/null || exit 1
ENTRYPOINT ["sh","-c","exec java -Dserver.port=${SERVER_PORT:-8082} -jar /app/app.jar"]
