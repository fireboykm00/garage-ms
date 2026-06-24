# Garage Inventory — Deployment Guide

This directory contains everything needed to deploy the **Garage Inventory Management System** with the **backend and frontend hosted separately**.

## Architecture

```
┌──────────────┐     HTTPS/API calls      ┌──────────────┐
│   FRONTEND   │ ──────────────────▶      │   BACKEND    │
│  (Nginx SPA) │     /api/*               │  (Spring Boot)│
│              │ ◀──────────────────      │              │
│  Port 80/443 │     JSON responses       │  Port 8080   │
└──────────────┘                          └──────┬───────┘
                                                 │
                                          ┌──────▼───────┐
                                          │   MySQL DB   │
                                          │   Port 3306  │
                                          └──────────────┘
```

The frontend is a **static SPA** served by Nginx. It communicates with the backend via REST API calls at `/api/*` (proxied through Nginx). The backend is a Spring Boot JAR connecting to a MySQL database.

## Prerequisites

- Java 21+ runtime for the backend (or Docker)
- MySQL 8.0+ database
- Node.js 22+ for frontend builds (or Docker)
- (Optional) Docker + Docker Compose

## Files in this directory

```
deploy/
├── backend/
│   ├── Dockerfile        # Backend container (multi-stage build)
│   └── .dockerignore
├── frontend/
│   ├── Dockerfile        # Frontend container (multi-stage build + nginx)
│   ├── nginx.conf        # Nginx SPA config with API proxy
│   └── .dockerignore
├── db/
│   └── schema.sql        # MySQL DDL (run once to initialise the database)
└── README.md             # This file
```

Additionally, the file `backend/src/main/resources/application-prod.properties` was created as the Spring production profile. It is **automatically activated** by the backend Dockerfile via `SPRING_PROFILES_ACTIVE=prod`.

---

## Deployment Options

### Option 1: Docker Compose (easiest for testing / single-machine)

A `docker-compose.yml` is at the project root if you want to keep the monolith approach. For **separate** hosting:

```bash
# Build backend image
cd deploy/backend
docker build -t garage-backend ../../

# Build frontend image
cd ../frontend
docker build -t garage-frontend ../../frontend

# Run MySQL
docker run -d \
  --name garage-db \
  -e MYSQL_ROOT_PASSWORD=rootpass \
  -e MYSQL_DATABASE=garage_db \
  -e MYSQL_USER=garage_user \
  -e MYSQL_PASSWORD=changeme \
  -p 3306:3306 \
  mysql:8.0

# Run backend
docker run -d \
  --name garage-api \
  -p 8080:8080 \
  -e SPRING_DATASOURCE_URL='jdbc:mysql://host.docker.internal:3306/garage_db?useSSL=false&serverTimezone=UTC' \
  -e SPRING_DATASOURCE_USERNAME=garage_user \
  -e SPRING_DATASOURCE_PASSWORD=changeme \
  -e APP_JWT_SECRET='replace-with-a-64-char-random-string-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' \
  -e APP_FRONTEND_URL='http://localhost' \
  garage-backend

# Run frontend
docker run -d \
  --name garage-web \
  -p 80:80 \
  -e BACKEND_HOST=host.docker.internal:8080 \
  garage-frontend
```

### Option 2: Fully separated (bare metal / VMs)

#### Step 1 — Database
```sql
-- Run deploy/db/schema.sql against your MySQL instance
mysql -h <db-host> -u root -p < deploy/db/schema.sql
```

Then create a user:
```sql
CREATE USER 'garage_user'@'%' IDENTIFIED BY 'your-strong-password';
GRANT ALL PRIVILEGES ON garage_db.* TO 'garage_user'@'%';
FLUSH PRIVILEGES;
```

#### Step 2 — Backend

```bash
# Build
cd garage/backend
mvn package -DskipTests

# Run (all config via env vars)
export SPRING_PROFILES_ACTIVE=prod
export SPRING_DATASOURCE_URL='jdbc:mysql://<db-host>:3306/garage_db?useSSL=true&serverTimezone=UTC'
export SPRING_DATASOURCE_USERNAME=garage_user
export SPRING_DATASOURCE_PASSWORD='your-strong-password'
export APP_JWT_SECRET='<random-64-char-string>'
export APP_FRONTEND_URL='https://your-frontend-domain.com'
export SERVER_PORT=8080

java -jar target/garage-backend-0.0.1-SNAPSHOT.jar
```

Or using systemd: create `/etc/systemd/system/garage-api.service`:

```ini
[Unit]
Description=Garage Inventory Backend
After=network.target

[Service]
Type=simple
User=garage
WorkingDirectory=/opt/garage/backend
ExecStart=/usr/bin/java -jar /opt/garage/backend/app.jar
Environment=SPRING_PROFILES_ACTIVE=prod
Environment=SPRING_DATASOURCE_URL=jdbc:mysql://...
Environment=SPRING_DATASOURCE_USERNAME=garage_user
Environment=SPRING_DATASOURCE_PASSWORD=...
Environment=APP_JWT_SECRET=...
Environment=APP_FRONTEND_URL=https://your-frontend.com
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

#### Step 3 — Frontend

**Via Docker:**
```bash
cd deploy/frontend
docker build \
  --build-arg VITE_API_URL=https://your-backend-domain.com/api \
  -t garage-frontend \
  ../../frontend

docker run -d \
  -p 80:80 \
  -e BACKEND_HOST=your-backend-domain.com:8080 \
  garage-frontend
```

**Via static hosting (Vercel / Netlify / Cloudflare Pages / S3+CloudFront):**
```bash
cd frontend
VITE_API_URL=https://your-backend-domain.com/api pnpm build
# dist/ folder is ready to deploy — just upload it.
# Make sure your host has SPA redirect: all routes → /index.html
```

---

## Required Environment Variables

### Backend

| Variable | Required | Default | Description |
|---|---|---|---|
| `SPRING_DATASOURCE_URL` | ✅ Yes | — | Full JDBC URL to your MySQL database |
| `SPRING_DATASOURCE_USERNAME` | ✅ Yes | — | MySQL username |
| `SPRING_DATASOURCE_PASSWORD` | ✅ Yes | — | MySQL password |
| `APP_JWT_SECRET` | ✅ Yes | — | Min 32 chars, use a strong random string |
| `APP_FRONTEND_URL` | ✅ Yes | — | Public URL of the deployed frontend (for CORS) |
| `SERVER_PORT` | ❌ No | `8080` | Backend listen port |
| `APP_JWT_EXPIRATION` | ❌ No | `86400000` | JWT expiry in ms (24h) |
| `SPRING_JPA_DDL_AUTO` | ❌ No | `update` | JPA schema strategy (`update`, `validate`, `none`) |

### Frontend (build-time)

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_URL` | ✅ Yes | `http://localhost:8080/api` | Full API base URL (e.g. `https://api.example.com/api`) |

### Frontend (run-time, if using the Nginx Docker image)

| Variable | Required | Default | Description |
|---|---|---|---|
| `BACKEND_HOST` | ❌ No | `backend:8080` | Backend host:port for the nginx `/api/` proxy |

---

## Production Checklist

- [ ] **JWT secret** generated with `openssl rand -base64 48` or similar (min 32 chars)
- [ ] **MySQL** running with utf8mb4, backed up regularly
- [ ] **Frontend URL** correct in `APP_FRONTEND_URL` (CORS)
- [ ] **HTTPS** configured via reverse proxy (Nginx/Caddy/Traefik) or Cloudflare
- [ ] **`spring.jpa.hibernate.ddl-auto`** set to `validate` or `none` after initial deploy
- [ ] **Backend** behind a reverse proxy if exposing directly to internet
- [ ] **Database credentials** use a dedicated user with least privilege
- [ ] **Logs** shipped to a central location (or use journald / Docker logs)
- [ ] **Health check** endpoint: `GET /api/health` returns `{"status":"UP"}`
- [ ] **Resource limits** set in Docker if containerised (`--memory`, `--cpus`)

---

## Multi-Environment Strategy

```
backend/src/main/resources/
├── application.properties          # Base (shared defaults)
├── application-dev.properties      # Local development
├── application-prod.properties     # Production overrides (this project)
└── application-staging.properties  # (optional)
```

Activate with:
```bash
java -jar app.jar --spring.profiles.active=prod
```

The Dockerfile sets `ENV SPRING_PROFILES_ACTIVE=prod`, so the production profile
activates automatically in the container.

---

## Default Users (created automatically)

| Username | Password | Role |
|---|---|---|
| admin | admin123 | ADMIN |
| storekeeper | storekeeper123 | STOREKEEPER |

**Change these default passwords immediately after first login.**

---

## Troubleshooting

**Frontend can't reach backend (CORS)** → Check `APP_FRONTEND_URL` on backend side.
**401 on all requests** → Check `APP_JWT_SECRET` is consistent.
**Hibernate LazyInitializationException** → The prod profile has `spring.jpa.open-in-view=false`; review any lazy-loaded relations in service layer.
**Connection refused to database** → Verify MySQL host, port, and that `garage_user` has access from the backend's IP.
