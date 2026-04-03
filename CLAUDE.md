# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**TransLogix** is an intelligent logistics information system for managing delivery operations, warehouse inventory, and route optimization. It's a full-stack app with role-based access for Admin, Dispatcher, Warehouse Manager, and Courier roles.

## Running the Project

### Docker (recommended)
```bash
cd translogix
docker compose up --build
```
- Frontend: http://localhost:3000
- Backend API + Swagger: http://localhost:8000/docs
- Stop: `docker compose down` (add `-v` to also remove DB volumes)

### Without Docker

**Backend:**
```bash
cd translogix/backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL=postgresql://translogix:translogix123@localhost:5432/translogix
export SECRET_KEY=supersecretkey123
export ALGORITHM=HS256
python seed.py        # Seed demo data
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd translogix/frontend
npm install
npm run dev
```

## Architecture

### Backend (`translogix/backend/app/`)

FastAPI + SQLAlchemy + PostgreSQL. Key files:

| File | Purpose |
|------|---------|
| `main.py` | App init, CORS, router registration |
| `models.py` | SQLAlchemy ORM (13 tables) |
| `schemas.py` | Pydantic request/response schemas |
| `crud.py` | Database operations |
| `services.py` | Business logic: route optimization, ETA estimation (`haversine_km`), priority scoring, low-stock flagging |
| `security.py` | JWT auth + bcrypt |
| `database.py` | SQLAlchemy engine + session factory |
| `config.py` | Environment config via Pydantic Settings |
| `routers/` | 10 API routers (auth, orders, routes, deliveries, couriers, vehicles, warehouses, inventory, dashboard, notifications) |
| `seed.py` | Demo data (run once after DB is ready) |

### Frontend (`translogix/frontend/src/`)

React 18 + TypeScript + Vite. State via Zustand, HTTP via Axios.

| Directory | Contents |
|-----------|----------|
| `pages/` | Login, Dashboard, Orders, Routes, Warehouse, Courier |
| `components/` | Layout, Sidebar, Header, StatusBadge, StatCard |
| `api/` | Axios clients per domain |
| `store/` | Zustand auth store |
| `types.ts` | TypeScript types mirroring backend schemas |

Vite proxies `/api` requests to `backend:8000` (configured in `vite.config.ts`).

### Data Model

Core entities and relationships:
- **User** → Courier (1:1), Notification (1:N)
- **Warehouse** → InventoryItem (1:N), Order (1:N)
- **Order** → OrderItem (1:N), RouteStop (1:N), Delivery (1:1)
- **Route** → RouteStop (1:N), Delivery (1:N), Courier (1:1), Vehicle (1:1)
- **Courier** → User (1:1), Vehicle (1:1)

Key enums: `UserRole`, `OrderStatus` (pending→assigned→in_transit→delivered/failed/cancelled), `RouteStatus`, `DeliveryStatus`, `CourierStatus`, `VehicleStatus`.

### Authentication

JWT tokens (24h expiry). Login via `POST /api/auth/login`, current user via `GET /api/auth/me`. FastAPI dependency injection handles auth on protected routes.

## Demo Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Dispatcher | dispatcher1 | pass123 |
| Warehouse Manager | manager1 | pass123 |
| Courier | courier1 | pass123 |
