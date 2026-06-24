# ---- Stage 1: Build the JAR ----
FROM maven:3.9-eclipse-temurin-21 AS builder

WORKDIR /app

# Cache dependencies layer
# Files are in the backend/ subdirectory relative to repo-root build context
COPY backend/pom.xml ./
RUN mvn dependency:go-offline -B

# Build the application
COPY backend/src ./src
RUN mvn package -DskipTests -o

# ---- Stage 2: Runtime ----
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Create a non-root user
RUN addgroup -S garage && adduser -S garage -G garage

# Copy the JAR
COPY --from=builder /app/target/*.jar app.jar

# Create data directory for file-based persistence (if any)
RUN mkdir -p /app/data && chown -R garage:garage /app/data

USER garage

EXPOSE 8080

# All config via env vars (see application-prod.properties)
# Required: SPRING_DATASOURCE_URL, SPRING_DATASOURCE_USERNAME, SPRING_DATASOURCE_PASSWORD, APP_JWT_SECRET, APP_FRONTEND_URL
# Optional: SERVER_PORT, APP_JWT_EXPIRATION, APP_JWT_ISSUER, APP_JWT_AUDIENCE, SPRING_JPA_DDL_AUTO

ENV SPRING_PROFILES_ACTIVE=prod

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget -qO- http://localhost:8080/api/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
