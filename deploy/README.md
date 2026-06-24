# Garage Inventory — Production Deployment Guide

> **Stack:** TiDB Cloud (DB) + Render (Backend) + Vercel (Frontend)
>
> All three have free tiers. No credit card needed for TiDB Cloud or Vercel.

---

## Architecture

```
                          TiDB Cloud (MySQL 8.0 compatible)
                         ┌──────────────────────────────┐
                         │  Serverless Cluster           │
                         │  Port 4000, SSL required      │
                         └──────────▲───────────────────┘
                                    │ TCP/4000
                         ┌──────────┴───────────────────┐
  ┌──────────────┐       │       Render Web Service      │       ┌──────────────┐
  │   Vercel     │  /api/*  │   Spring Boot API          │  JDBC  │  garage_db   │
  │  (Frontend)  │ ──────▶ │   Port 8080                 │ ──────▶ │  (database)  │
  │  Static SPA  │ ◀────── │   JWT, CORS, JPA            │        └──────────────┘
  │  Global CDN  │  JSON   │                             │
  └──────────────┘         └─────────────────────────────┘
```

- **Frontend (Vercel):** Static SPA built by Vite, served globally via CDN
- **Backend (Render):** Spring Boot JAR, connects to TiDB Cloud via MySQL JDBC
- **Database (TiDB Cloud):** MySQL 8.0 wire-compatible, auto-scaling, free tier

---

## Prerequisites

- GitHub account (connects to Render + Vercel)
- Repository pushed to GitHub with the full project

---

## Step 1 — TiDB Cloud (Database)

1. Go to [tidbcloud.com](https://tidbcloud.com) and sign up (free, no credit card)
2. Click **"Create Cluster"** → **"Serverless"** tier
3. Choose a region (e.g. `eu-central-1` Frankfurt — closest to you)
4. Wait ~2 minutes for provisioning
5. Click **"Connect"** → copy the connection string:
   ```
   mysql://2EZ5TVs79pzi2SJ.root:<PASSWORD>@gateway01.eu-central-1.prod.aws.tidbcloud.com:4000/sys
   ```
6. (Recommended) Create a dedicated database:
   ```sql
   CREATE DATABASE garage_db
     CHARACTER SET utf8mb4
     COLLATE utf8mb4_unicode_ci;
   ```
   You can do this via the TiDB Cloud web SQL editor or any MySQL client.
7. Note down these values — you'll need them for Render:
   - **Host:** `gateway01.eu-central-1.prod.aws.tidbcloud.com`
   - **Port:** `4000`
   - **Username:** `2EZ5TVs79pzi2SJ.root`
   - **Password:** (shown once when you click "Connect")

---

## Step 2 — Render (Backend)

1. Go to [render.com](https://render.com) → sign up with GitHub
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repo containing the project
4. Configure the service:

   | Setting | Value |
   |---|---|
   | **Name** | `garage-api` |
   | **Region** | Frankfurt (`eu-central-1`) — close to TiDB |
   | **Branch** | `main` |
   | **Runtime** | **Docker** |
   | **Build Filter** | Leave "Auto-Deploy" on |
   | **Plan** | Free |
   | **Health Check Path** | `/api/health` |

5. Under **"Environment Variables"**, add these:

   | Variable | Value |
   |---|---|
   | `SPRING_PROFILES_ACTIVE` | `prod` |
   | `SPRING_DATASOURCE_URL` | `jdbc:mysql://gateway01.eu-central-1.prod.aws.tidbcloud.com:4000/garage_db?sslMode=VERIFY_IDENTITY&serverTimezone=UTC` |
   | `SPRING_DATASOURCE_USERNAME` | `2EZ5TVs79pzi2SJ.root` |
   | `SPRING_DATASOURCE_PASSWORD` | *(your TiDB cluster password)* |
   | `APP_JWT_SECRET` | *(generate: `openssl rand -base64 48`)* |
   | `APP_FRONTEND_URL` | `https://your-frontend.vercel.app` *(you'll set this after Step 3)* |
   | `SERVER_PORT` | `8080` |
   | `SPRING_JPA_DDL_AUTO` | `update` *(creates tables on first deploy)* |

6. Click **"Create Web Service"**
7. Render builds the Docker image using `deploy/backend/Dockerfile` and deploys

> **Render Docker setup:** The deploy Dockerfile is at `deploy/backend/Dockerfile`.
> If Render asks for the Dockerfile path, enter `deploy/backend/Dockerfile`.
> If it uses the root `Dockerfile` (the monolith one), go to Render dashboard →
> **Settings** → **Docker Command** → change to `deploy/backend/Dockerfile`,
> or delete the old root Dockerfile (it builds a combined image).

8. Once deployed, note your backend URL: `https://garage-api.onrender.com`

---

## Step 3 — Vercel (Frontend)

1. Go to [vercel.com](https://vercel.com) → sign up with GitHub
2. Click **"Add New…"** → **"Project"**
3. Import your repo → set the **Root Directory** to `frontend`
4. Configure:

   | Setting | Value |
   |---|---|
   | **Framework Preset** | Vite |
   | **Build Command** | `pnpm build` |
   | **Output Directory** | `dist` |
   | **Install Command** | `pnpm install` |

5. **Environment Variable:**

   | Variable | Value |
   |---|---|
   | `VITE_API_URL` | `https://garage-api.onrender.com/api` |

6. Click **"Deploy"**
7. Vercel will use the `vercel.json` in the `frontend/` directory, which rewrites
   all routes to `/index.html` for client-side routing.
   (This is required for SPAs — direct URL access and page refreshes work correctly.)
8. Note your frontend URL: `https://garage-inventory.vercel.app`

9. **Go back to Render** and update `APP_FRONTEND_URL` to `https://garage-inventory.vercel.app`
   — this controls CORS on the backend.

---

## Step 4 — Verify

1. **Health check:** `curl https://garage-api.onrender.com/api/health`
   ```json
   {"status":"UP","service":"garage-inventory"}
   ```

2. **Login:** Open the frontend URL → login with `admin` / `admin123`
   - Default users are auto-created by `DataInitializer` via the first Hibernate session

3. **Test a flow:**
   - Navigate to **Parts** → verify seed data loaded (26 parts from DataInitializer)
   - Create a **Stock In** transaction
   - Create a **Job Card** → add a part
   - Check **Dashboard** shows stats

4. **Redeploy on change:** Push to `main` — both Render and Vercel auto-deploy

---

## Required Environment Variables

### Backend (on Render)

| Variable | Required | Description |
|---|---|---|
| `SPRING_DATASOURCE_URL` | ✅ Yes | Full JDBC URL to TiDB Cloud: `jdbc:mysql://gateway...garage_db?sslMode=VERIFY_IDENTITY&serverTimezone=UTC` |
| `SPRING_DATASOURCE_USERNAME` | ✅ Yes | TiDB Cloud username (e.g. `2EZ5TVs79pzi2SJ.root`) |
| `SPRING_DATASOURCE_PASSWORD` | ✅ Yes | TiDB Cloud cluster password |
| `APP_JWT_SECRET` | ✅ Yes | Min 32 chars — generate with `openssl rand -base64 48` |
| `APP_FRONTEND_URL` | ✅ Yes | Public Vercel URL (e.g. `https://garage-inventory.vercel.app`) |
| `SPRING_PROFILES_ACTIVE` | ✅ Yes | Must be `prod` |
| `SPRING_JPA_DDL_AUTO` | ❌ No | Default: `update`. Switch to `validate` after initial deploy |

### Frontend (on Vercel — build-time)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | ✅ Yes | Full API base URL, e.g. `https://garage-api.onrender.com/api` |

---

## Files That Changed

| File | Change |
|---|---|
| `backend/src/main/resources/application-prod.properties` | Defaults point to TiDB Cloud (overridable via env vars) |
| `deploy/README.md` | Deployment guide for TiDB + Render + Vercel |
| `docker-compose.yml` | **Deleted** — was for a different project (ecommerce) |

---

## Production Checklist

- [ ] **TiDB Cloud cluster** created and `garage_db` database created
- [ ] **JWT secret** generated: `openssl rand -base64 48`
- [ ] **APP_FRONTEND_URL** matches the actual Vercel deployment URL
- [ ] **VITE_API_URL** on Vercel matches the actual Render backend URL
- [ ] **Health check** passes: `GET /api/health` → `{"status":"UP"}`
- [ ] **Login works** with default credentials
- [ ] **CORS is working** — frontend can call backend without errors
- [ ] **`spring.jpa.hibernate.ddl-auto`** set to `validate` after first deploy (optional safety)

---

## Local Development (still works unchanged)

```bash
# Backend (H2 in-memory — no MySQL needed)
cd backend
mvn spring-boot:run          # http://localhost:8080

# Frontend (separate terminal)
cd frontend
pnpm install
pnpm dev                     # http://localhost:5173
```

The production profile (`-Dspring.profiles.active=prod`) is only active on Render.
Locally, the default `application.properties` still uses H2.

---

## Troubleshooting

| Problem | Likely Cause | Fix |
|---|---|---|
| 401 on every request | JWT secret mismatch between deploys | Set `APP_JWT_SECRET` to a fixed value — never change it after users exist |
| Backend can't connect to TiDB | IP restrictions or wrong SSL mode | TiDB Cloud Serverless allows all IPs by default. Ensure `sslMode=VERIFY_IDENTITY` in URL |
| CORS error in browser | `APP_FRONTEND_URL` doesn't match | Must be the exact origin (with protocol, no trailing slash): `https://garage-inventory.vercel.app` |
| Blank page on Vercel | SPA routing not set up | Vercel auto-detects Vite SPAs. Check Settings → Rewrites: `/*` → `/index.html` |
| Hibernate tables not created | User lacks DDL privileges | Run `schema.sql` manually, set `ddl-auto=validate` |
| Free tier cold start | Render spins down after inactivity | First request after idle takes ~30s. Upgrade to paid plan for always-on |
