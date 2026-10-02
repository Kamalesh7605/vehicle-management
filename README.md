# FleetMate - Vehicle Management System

A simple, professional vehicle and driver management app for small and medium fleet owners:
vehicles, drivers, driver assignments (with history), fuel, maintenance, expenses, documents with expiry
tracking, alerts, a dashboard and reports.

## Features

- **Dashboard** - KPI cards, monthly expense chart, expense breakdown donut, alerts, recent fuel / maintenance / expenses (period selectable)
- **Vehicles** - CRUD, unique vehicle number, details page (overview, fuel, maintenance, expenses, documents, driver history), mileage, next-service countdown
- **Drivers** - CRUD, unique licence number, licence-expiry status
- **Assignments** - assign / reassign / unassign; previous assignments are closed and kept as history; a driver can drive one vehicle at a time
- **Fuel** - total = litres x price (editable), odometer tracking, filters, server-side pagination
- **Maintenance** - service records, `remaining KM = next service KM - current KM`
- **Expenses** - categorised running costs with filters
- **Documents** - RC, insurance, fitness, pollution, permit, road tax, driving licence; Valid / Expiring Soon / Expired; optional PDF/JPG/PNG upload (stored on disk, only the path is in MySQL)
- **Alerts** - insurance / documents / licences expiring within 30 days, expired documents, service due within 1,000 KM
- **Notifications** - the bell badge counts unread alerts; opening it marks them read (stored per user on the server, so it follows the login across devices); an alert that escalates, e.g. expiring -> expired, is unread again
- **Reports** - vehicle expenses, monthly expenses, drivers, vehicle summary; filter by date, vehicle, driver, category; CSV export

## Architecture

```
Browser -> React (Vite, MUI) -> Axios -> Quarkus REST -> Service -> Repository (Panache) -> MySQL 8
```

Backend packages (`com.fleetmate`): `resource` (REST) -> `service` (business rules) -> `repository` -> `entity`, plus `dto`, `mapper`, `exception`, `config`.
Cost totals (dashboard, vehicle pages, reports) all come from one place, `CostAggregationService`:
fuel = fuel records + `FUEL` expenses; maintenance = maintenance records + `MAINTENANCE`/`REPAIR` expenses; other = everything else (tolls included).

## Technology stack

React 18, TypeScript, Vite, React Router, Material UI, Axios, Recharts, React Hook Form, Zod - Java 21, Quarkus 3.39, Hibernate ORM with Panache, Jakarta Bean Validation, SmallRye OpenAPI - MySQL 8 - Docker / Docker Compose.

## Project structure

```
backend/    Quarkus app (pom.xml, Dockerfile, src/main, src/test)
frontend/   React app (src/components, pages, services, hooks, utils, routes, theme, types)
database/   Notes on schema and seed data
docker-compose.yml   mysql + backend + frontend
.env.example         All configurable variables
```

## Signing in

The app opens on a login page. Default credentials: **username `admin`, password `admin`**.
Set `ADMIN_USERNAME` / `ADMIN_PASSWORD` in `.env` to change them (applied on every backend start), and set `JWT_SECRET`
(32+ characters, e.g. `openssl rand -hex 32`) so sessions survive backend restarts. Sessions last 8 hours.
Every `/api` endpoint except `POST /api/auth/login` requires `Authorization: Bearer <token>`; in Swagger UI use **Authorize**
with the token returned by the login endpoint. There is one login and no roles yet.

## Running with Docker Compose

```bash
git clone <your-repo-url>
cd <project-folder>
cp .env.example .env      # optional; every variable has a development default
docker compose up --build
```

| What | URL |
|------|-----|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:8080 |
| API | http://localhost:8080/api |
| Swagger UI | http://localhost:8080/q/swagger-ui |
| OpenAPI JSON | http://localhost:8080/q/openapi |

Demo data (5 vehicles, 7 drivers, fuel, maintenance, expenses, documents) loads on first start. MySQL data lives in the `mysql_data` volume, uploaded files in `uploads_data`. Reset everything with `docker compose down -v`.

**Port already in use?** Set `FRONTEND_PORT`, `BACKEND_PORT` or `MYSQL_PORT` in `.env`. If you change the frontend port or backend host, also update `CORS_ORIGINS` (allowed browser origins) and `VITE_API_BASE_URL` (the backend URL as seen from the browser; it is baked into the frontend at build time, so rebuild with `--build`).

## Environment variables

| Variable | Default | Used by |
|----------|---------|---------|
| `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_ROOT_PASSWORD` | fleetmate / fleetmate / fleetmate / root | mysql, backend (as `DB_*`) |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | localhost / 3306 / fleetmate / - / - | backend (set by compose) |
| `CORS_ORIGINS` | http://localhost:3000 | backend, comma separated |
| `SEED_DEMO_DATA` | true | backend |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | admin / admin | backend login |
| `JWT_SECRET` | random per start | backend token signing (32+ chars) |
| `STORAGE_DIR` | ./uploads | backend document files |
| `VITE_API_BASE_URL` | http://localhost:8080/api | frontend build |
| `FRONTEND_PORT`, `BACKEND_PORT`, `MYSQL_PORT` | 3000 / 8080 / 3306 | compose host ports |

Change the default passwords before deploying anywhere public.

## Running locally (without Docker for the app)

```bash
# 1. MySQL only
docker compose up -d mysql

# 2. Backend (Java 21, Maven) - dev profile uses user/password fleetmate
cd backend
mvn quarkus:dev          # http://localhost:8080

# 3. Frontend (Node 20+)
cd frontend
npm install
npm run dev              # http://localhost:3000
```

## API overview

Full, interactive documentation (request/response models, validation errors, status codes) is in Swagger UI.

| Area | Endpoints |
|------|-----------|
| Vehicles | `GET/POST /api/vehicles`, `GET/PUT/DELETE /api/vehicles/{id}`, `GET /api/vehicles/{id}/summary`, `GET /api/vehicles/{id}/driver-history` |
| Drivers | `GET/POST /api/drivers`, `GET/PUT/DELETE /api/drivers/{id}`, `GET /api/drivers/{id}/vehicle-history` |
| Assignments | `POST /api/vehicle-driver-assignments` (`driverId: null` unassigns) |
| Fuel | `/api/fuel` and `/api/fuel/{id}` (list supports `q, vehicleId, from, to, page, size`) |
| Maintenance | `/api/maintenance` and `/{id}` |
| Expenses | `/api/expenses` and `/{id}` |
| Documents | `/api/documents` and `/{id}`; `POST/GET/DELETE /api/documents/{id}/file` |
| Dashboard | `/api/dashboard/summary, monthly-expenses, expense-breakdown, recent-fuel, recent-maintenance, recent-expenses, alerts` |
| Reports | `/api/reports/vehicle-expenses, monthly-expenses, drivers, vehicle-summary` |

Errors are JSON: `{"message": "Vehicle number already exists", "code": "VEHICLE_ALREADY_EXISTS"}`; validation errors (HTTP 400, `VALIDATION_ERROR`) add an `errors` map of field -> message. Conflicts are 409, unknown ids 404.

## Business rules

- Vehicle number and driver licence number are unique; the odometer never decreases.
- Fuel/maintenance records with a higher odometer advance the vehicle's odometer.
- Inactive vehicles reject new fuel/maintenance records unless `allowInactive: true` is sent (the UI offers a checkbox).
- A driver can have one active vehicle; assigning a driver who is already on another vehicle returns 409 - unassign first. Inactive drivers cannot be assigned.
- Deleting a vehicle also deletes its fuel, maintenance, expenses, documents and assignment history; its driver becomes Available.
- Mileage = (last - first odometer) / litres of every fill-up after the first; shown only with at least two fuel entries with odometer readings.
- Document status: expired if `expiry < today`; expiring soon if `expiry <= today + 30 days`; otherwise valid. When a document is renewed, only the newest one per type drives alerts.

## Testing

```bash
cd backend && mvn test        # JUnit 5 + Quarkus tests + REST Assured (in-memory H2, no Docker needed)
cd frontend && npm test       # Vitest + Testing Library
```

## Future improvements

Roles and multiple users (login, the `users` table and `owner` columns are ready), Flyway migrations, notifications by email/SMS, trip logging, GPS/telematics, and PDF reports.
