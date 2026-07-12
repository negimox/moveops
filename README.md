# 🚌 TransitOps — Smart Transport Operations Platform

> **Hackathon Project** · Next.js 16 · TypeScript · PostgreSQL · JWT Auth · Role-Based Access Control

TransitOps digitizes fleet operations for organizations still using spreadsheets and logbooks — vehicle registry, driver management, trip dispatch, maintenance tracking, and fuel/expense analytics. All enforced business rules run server-side; no rule is UI-only.

---

## 📐 Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js 16 (App Router)                  │
│                                                                  │
│  ┌──────────────┐   ┌──────────────────┐   ┌────────────────┐  │
│  │  proxy.ts    │   │  /app/(auth)      │   │ /app/(dashboard│  │
│  │  (middleware)│   │  /login           │   │  /dashboard    │  │
│  │              │──▶│                  │   │  /fleet        │  │
│  │  JWT verify  │   │  LoginForm.tsx    │   │  /drivers      │  │
│  │  on every    │   │  POST /api/auth   │   │  /trips        │  │
│  │  request     │   │       /login      │   │  /maintenance  │  │
│  └──────────────┘   └──────────────────┘   │  /fuel-expenses│  │
│                                             │  /analytics    │  │
│  ┌──────────────────────────────────────┐  └────────────────┘  │
│  │  /app/api  (Route Handlers)          │                       │
│  │  auth/login · auth/logout · auth/me  │                       │
│  │  vehicles · drivers · trips          │                       │
│  │  maintenance · fuel-logs · expenses  │                       │
│  │  dashboard · analytics/export        │                       │
│  └──────────────────────────────────────┘                       │
│                        │                                         │
│  ┌─────────────────────▼────────────────────────────────────┐   │
│  │  lib/                                                    │   │
│  │  ├── auth.ts      JWT sign/verify · cookie helpers       │   │
│  │  ├── db.ts        pg Pool · query<T>() wrapper           │   │
│  │  ├── rbac.ts      Permission matrix · requireRole()      │   │
│  │  └── queries/     Per-entity DB query modules            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                        │                                         │
│  ┌─────────────────────▼────────────────────────────────────┐   │
│  │  PostgreSQL                                              │   │
│  │  users · vehicles · drivers · trips                      │   │
│  │  maintenance_records · fuel_logs · expenses · roles      │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Role-Based Access Control

Four roles, each owning a distinct domain. Every API route enforces these server-side — a browser request without the right JWT role gets a 403.

| Role | Owns | Read Access |
|---|---|---|
| **Fleet Manager** | Vehicles, Maintenance | Trips, Drivers |
| **Dispatcher** | Dashboard, Trips | Vehicles, Drivers |
| **Safety Officer** | Drivers, License verification | Trips |
| **Financial Analyst** | Fuel logs, Expenses, Analytics | Trips, Vehicles |

Auth flow: **Email + password → bcrypt compare → JWT (HS256, 8h) → HTTP-only cookie** → Proxy verifies on every request.

---

## 🗄️ Data Model

```
users ─────────────────────────────────────────────────────────────
  id · name · email · password_hash · role · is_active

vehicles ──────────────────────────────────────────────────────────
  id · vehicle_id(unique) · type · make_model · year
  registration_no(unique) · capacity_kg · status[available/on_trip/in_shop/retired]
  avg_cost_per_km · total_trips · total_earnings

drivers ───────────────────────────────────────────────────────────
  id · name · contact · license_id(unique) · license_verified
  license_expiry · license_data(JSONB) · category
  status[pending_approval/available/on_trip/off_duty/suspended]
  trip_count · safety_score(0–100) · registered_by · approved_by

trips ─────────────────────────────────────────────────────────────
  id · trip_code(unique) · vehicle_id → vehicles · driver_id → drivers
  dispatcher_id → users · origin · destination
  status[scheduled/dispatched/on_trip/completed/cancelled]
  cargo_weight_kg · distance_km · revenue · scheduled_at · completed_at

maintenance_records ───────────────────────────────────────────────
  id · vehicle_id → vehicles · service_type · vendor · cost
  status[scheduled/in_progress/completed] · service_date · logged_by

fuel_logs ─────────────────────────────────────────────────────────
  id · vehicle_id → vehicles · liters · cost · odometer_km
  fuel_type · station · logged_at · logged_by → users

expenses ──────────────────────────────────────────────────────────
  id · category · amount · vehicle_id · trip_id · description
  logged_at · logged_by → users
```

---

## ⚡ State Machines

All state transitions are enforced in **named action methods** on the server — never via UI-only guards.

```
Vehicle:   available ←→ on_trip ←→ in_shop   |  retired (terminal)
Driver:    available ←→ on_trip   |  off_duty   |  suspended
Trip:      scheduled → dispatched → completed
                                 → cancelled
```

**Cross-model triggers:**

| Action | Vehicle | Driver |
|---|---|---|
| `action_dispatch` | → `on_trip` | → `on_trip` |
| `action_complete` | → `available` | → `available` |
| `action_cancel` | → `available` | → `available` |

| Maintenance | Vehicle |
|---|---|
| Open record | → `in_shop` |
| Close record | → `available` (unless `retired`) |

---

## ✅ Build Progress

### Phase 1 — Foundation ✅ Complete
- [x] PostgreSQL schema with ENUMs, indexes, full seed data (`scripts/db-setup.sql`)
- [x] JWT auth (`lib/auth.ts`) — sign, verify, HTTP-only cookie
- [x] DB connection pool (`lib/db.ts`) — hot-reload safe
- [x] RBAC permission matrix (`lib/rbac.ts`) — `requireRole()`, `canDo()`
- [x] Edge proxy / middleware (`proxy.ts`) — protects all dashboard + API routes
- [x] `POST /api/auth/login` — bcrypt + JWT + cookie (timing-safe)
- [x] `POST /api/auth/logout` — clear cookie
- [x] `GET /api/auth/me` — verify token, return user
- [x] Login page + `LoginForm` component (full styling)
- [x] Dashboard shell layout + role-aware `Sidebar`
- [x] `StatusBadge` component — all vehicle/driver/trip/maintenance states
- [x] Vehicle queries: list, get, create, update, delete (`lib/queries/vehicles.ts`)
- [x] `GET /api/vehicles` · `POST /api/vehicles` · `GET|PUT|DELETE /api/vehicles/[id]`

### Phase 2 — Feature Pages + Remaining APIs 🔄 In Progress
- [ ] Vehicles / Fleet page — list view with status badge + create/edit modal
- [ ] Drivers queries + API (`lib/queries/drivers.ts`, `/api/drivers`)
- [ ] Drivers page — list, create, suspend, safety score
- [ ] Maintenance queries + API (open/close with vehicle state side-effects)
- [ ] Maintenance page
- [ ] Wire dashboard KPIs to `/api/dashboard` live aggregates

### Phase 3 — Trip State Machine 🔜 Next
- [ ] Trips queries + business rule enforcement (`lib/queries/trips.ts`)
- [ ] `POST /api/trips` — create with cargo_weight ≤ capacity validation
- [ ] `POST /api/trips/[id]/dispatch` — validate + flip vehicle + driver to `on_trip`
- [ ] `POST /api/trips/[id]/complete` — final odometer, fuel, flip both to `available`
- [ ] `POST /api/trips/[id]/cancel` — restore both to `available`
- [ ] Trips page — create form + lifecycle action buttons

### Phase 4 — Fuel, Expenses & Analytics 🔜
- [ ] Fuel logs queries + API + page
- [ ] Expenses queries + API + page
- [ ] `GET /api/analytics` — fuel efficiency, utilisation, operational cost, ROI
- [ ] Analytics page with charts
- [ ] `GET /api/analytics/export` — **CSV export (mandatory)**

---

## 🏢 Business Rules (Server-Side Enforced)

All 10 rules raise a `ValidationError` in the API layer — no rule relies on UI filtering alone.

| # | Rule |
|---|---|
| 1 | `vehicle_id` + `registration_no` must be unique — DB `UNIQUE` constraint |
| 2 | `retired` / `in_shop` vehicles excluded from trip dispatch |
| 3 | Expired license or `suspended` driver cannot be assigned to a trip |
| 4 | A vehicle/driver already `on_trip` cannot be assigned to another trip |
| 5 | `cargo_weight_kg` must not exceed vehicle `capacity_kg` |
| 6 | `action_dispatch` → vehicle + driver → `on_trip` |
| 7 | `action_complete` → vehicle + driver → `available` |
| 8 | `action_cancel` (from dispatched) → vehicle + driver → `available` |
| 9 | Opening a maintenance record → vehicle → `in_shop` |
| 10 | Closing maintenance → vehicle → `available` (unless `retired`) |

---

## 📊 KPI Formulas

| Metric | Formula |
|---|---|
| Fuel Efficiency | Total distance ÷ total fuel consumed |
| Fleet Utilisation | Vehicles `on_trip` ÷ total active vehicles × 100 |
| Operational Cost | Fuel cost + Maintenance cost (per vehicle) |
| Vehicle ROI | (Revenue − (Maintenance + Fuel)) ÷ Acquisition Cost |

---

## 🚀 Local Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ (local or cloud)

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .example.env .env.local
# Edit .env.local:
#   DATABASE_URL=postgresql://user:pass@host:5432/transitops
#   JWT_SECRET=<openssl rand -base64 32>
```

### 3. Initialize the database
```bash
psql $DATABASE_URL -f scripts/db-setup.sql
```
This creates all tables, ENUMs, indexes, and seeds demo data.

### 4. Run the dev server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### Demo Credentials (after seed)

| Role | Email | Password |
|---|---|---|
| Fleet Manager | fleet@transitops.in | Password@123 |
| Dispatcher | dispatch@transitops.in | Password@123 |
| Safety Officer | safety@transitops.in | Password@123 |
| Financial Analyst | finance@transitops.in | Password@123 |

---

## 📁 Repository Structure

```
moveops/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx              # Auth layout
│   │   └── login/page.tsx          # Login page
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Sidebar shell
│   │   ├── dashboard/page.tsx      # KPI dashboard
│   │   ├── fleet/                  # [Phase 2]
│   │   ├── drivers/                # [Phase 2]
│   │   ├── trips/                  # [Phase 3]
│   │   ├── maintenance/            # [Phase 2]
│   │   ├── fuel-expenses/          # [Phase 4]
│   │   └── analytics/              # [Phase 4]
│   ├── api/
│   │   ├── auth/login · logout · me
│   │   └── vehicles · [id]
│   ├── globals.css                 # CSS custom properties + design tokens
│   └── layout.tsx
├── components/
│   ├── auth/LoginForm.tsx
│   └── ui/
│       ├── Sidebar.tsx             # Role-filtered navigation
│       └── StatusBadge.tsx         # Color-coded state pills
├── lib/
│   ├── auth.ts                     # JWT helpers
│   ├── db.ts                       # pg Pool
│   ├── rbac.ts                     # Permission matrix
│   └── queries/
│       └── vehicles.ts             # Vehicle DB queries
├── backend/
│   └── utils/
│       ├── exportService.js        # JSON → CSV utility
│       └── emailReminder.js        # [Bonus] License expiry reminders
├── scripts/
│   └── db-setup.sql                # Full schema + seed (555 lines)
├── design/
│   ├── TransitOps Smart Transport Operations Platform.pdf
│   └── Transitops - smart transport operations platform - 8 hours.png
├── proxy.ts                        # Next.js Edge middleware
├── .example.env                    # Environment variable template
└── package.json
```

---

## 🧪 Acceptance Test Checklist

From the project spec — must pass before submission:

- [ ] Register vehicle `Van-05`, `capacity_kg = 500`, status = `available`
- [ ] Register driver `Alex` with valid (non-expired) license
- [ ] Create trip `cargo_weight = 450` → dispatch succeeds (450 ≤ 500) → both flip to `on_trip`
- [ ] Attempt to assign Van-05/Alex while `on_trip` → rejected with 400
- [ ] Complete trip with final odometer + fuel → both flip to `available`
- [ ] Create maintenance record on Van-05 → flips to `in_shop`, disappears from dispatch dropdown
- [ ] Close maintenance → Van-05 returns to `available`
- [ ] Reports screen shows updated fuel efficiency + operational cost

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.10 (App Router) |
| Language | TypeScript 5 |
| Styling | CSS Custom Properties (design tokens) |
| Auth | `jose` JWT · bcryptjs · HTTP-only cookies |
| Database | PostgreSQL via `node-postgres` (`pg`) |
| Validation | Server-side in route handlers + query layer |
| Export | Custom JSON → CSV (`backend/utils/exportService.js`) |

---

## 📎 Links

- 📄 [Full Build Specification](../description.md)
- 🎨 [UI Mockup](https://link.excalidraw.com/l/65VNwvy7c4X/1FHGDNgD2td)
- 📊 [Design Document](./design/TransitOps%20Smart%20Transport%20Operations%20Platform.pdf)
