# Build both backend and frontend using builder
FROM maven:3.9-eclipse-temurin-21 AS builder

WORKDIR /app

# Install Node.js in the maven image
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    npm install -g pnpm && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Build Backend
COPY backend/pom.xml ./backend/
WORKDIR /app/backend
RUN mvn dependency:go-offline -B
COPY backend/src ./src
RUN mvn package -DskipTests

WORKDIR /app

# Build Frontend
COPY frontend/package.json frontend/pnpm-lock.yaml ./frontend/
WORKDIR /app/frontend
RUN pnpm install
COPY frontend/ .
ENV VITE_API_URL=/api
RUN pnpm build

# Final minimal runtime image
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

RUN apk add --no-cache nginx

COPY --from=builder /app/backend/target/*.jar app.jar
COPY --from=builder /app/frontend/dist ./dist

RUN mkdir -p /app/data

RUN echo 'server { \
    listen 80; \
    root /app/dist; \
    index index.html; \
    location /api/ { proxy_pass http://localhost:8080; proxy_set_header Host $host; } \
    location / { try_files $uri $uri/ /index.html; } \
}' > /etc/nginx/http.d/default.conf

ENV SERVER_PORT=8080 JWT_SECRET=ecommerce-secret-key-change-this

EXPOSE 80

CMD ["sh", "-c", "java -jar app.jar & nginx -g 'daemon off;'"]