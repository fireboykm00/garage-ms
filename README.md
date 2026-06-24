# Garage Inventory Management System

A full-stack web application for tracking spare parts inventory in a garage. Replace manual notebook tracking with a simple, reliable digital system.

## Features

### Authentication & Access Control
- Secure JWT-based authentication
- Role-based access: Administrator, Storekeeper, Manager
- Default users created automatically

### Parts Management
- Register spare parts with code and name
- Edit part details, track current quantity
- Low stock detection with minimum quantity alerts

### Stock Management
- Record stock coming into the garage (Stock In)
- Record stock going out (Stock Out)
- Automatic remaining quantity calculation
- Prevents stock out exceeding available stock

### Reports
- Stock Out Report with part name, quantity, date, user
- Remaining Stock Report with part code, name, unit, quantity

---

## Architecture

### Backend (Spring Boot)

```
com.garage/
+-- controller/       # REST API endpoints
+-- service/          # Business logic
+-- repository/       # Data access layer
+-- model/            # JPA entities
+-- dto/              # Data transfer objects
+-- security/         # JWT authentication
+-- config/           # Application configuration
+-- exception/        # Global exception handling
```

**Key Design Decisions:**
- **Stateless Authentication**: JWT tokens for secure API access
- **Role-Based Access**: Different permissions per role
- **RESTful API**: Clean, predictable endpoint structure
- **H2 Database**: In-memory for development, switchable to MySQL

### Frontend (React + TypeScript)

Single Page Application with routing:

```
src/
+-- pages/           # Route components
+-- components/      # UI components
+-- services/        # API integrations
+-- contexts/        # React context providers
+-- types/           # TypeScript definitions
+-- lib/             # Utilities
```

**Key Design Decisions:**
- **Context-Based Auth**: Token stored in localStorage
- **Axios Interceptors**: Automatic token attachment and 401 handling
- **SPA Routing**: Protected dashboard routes behind login

---

## Project Structure

```
garage/
+-- backend/                    # Spring Boot API
|   +-- src/main/java/com/garage/
|   |   +-- controller/         # REST endpoints
|   |   +-- service/            # Business logic
|   |   +-- repository/         # JPA repositories
|   |   +-- model/              # Entity classes
|   |   +-- dto/                # Request/Response DTOs
|   |   +-- security/           # JWT components
|   |   +-- config/             # App configuration
|   +-- src/main/resources/
|       +-- application.properties
+-- frontend/                   # React SPA
|   +-- src/
|   |   +-- pages/             # Page components
|   |   +-- components/         # UI components
|   |   +-- services/           # API client functions
|   |   +-- contexts/           # React contexts
|   |   +-- types/              # TypeScript interfaces
|   +-- package.json
+-- run.sh                      # Linux/Mac runner
+-- run.ps1                     # Windows runner
+-- README.md
```

---

## Quick Start

### Run the Application

```bash
# Linux/Mac
./run.sh dev

# Windows PowerShell
.\run.ps1 dev
```

Or manually:

```bash
# Backend
cd backend
mvn spring-boot:run

# Frontend (new terminal)
cd frontend
pnpm install
pnpm dev
```

### Access the App

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8080/api |
| Health | http://localhost:8080/api/health |

### Default Login

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Storekeeper | storekeeper | storekeeper123 |
| Manager | manager | manager123 |

---

## API Endpoints

### Authentication
```
POST   /api/auth/login       - Login (returns JWT)
GET    /api/auth/me          - Get current user
```

### Parts
```
GET    /api/parts                     - List all parts
GET    /api/parts/:id                 - Get part details
POST   /api/parts                     - Create part (ADMIN, STOREKEEPER)
PUT    /api/parts/:id                 - Update part (ADMIN, STOREKEEPER)
DELETE /api/parts/:id                 - Delete part (ADMIN)
GET    /api/parts/low-stock           - Low stock parts
```

### Stock Transactions
```
POST   /api/stock/in                  - Stock in (ADMIN, STOREKEEPER)
POST   /api/stock/out                 - Stock out (ADMIN, STOREKEEPER)
GET    /api/stock/transactions        - Recent transactions
```

### Reports
```
GET    /api/reports/stock-out              - Stock out report (JSON)
GET    /api/reports/remaining-stock        - Remaining stock report (JSON)
GET    /api/reports/stock-out/csv          - Stock out report (CSV download)
GET    /api/reports/remaining-stock/csv    - Remaining stock report (CSV download)
```

### Dashboard
```
GET    /api/dashboard/stats           - Dashboard statistics
```

### User Management
```
GET    /api/admin/users               - List users (ADMIN)
POST   /api/admin/users               - Create user (ADMIN)
PUT    /api/admin/users/:id           - Update user (ADMIN)
DELETE /api/admin/users/:id           - Delete user (ADMIN)
```

---

## Database Schema

### User
- id, username, email, password, fullName, role, enabled

### Part
- id, partNumber, ourPartNumber, name, model, manufacturer, location, warehouse, unit, currentQuantity, minimumQuantity

### StockTransaction
- id, partId, type (IN/OUT), quantity, note, createdBy

---

## Docker Deployment

```bash
docker-compose up --build
```
