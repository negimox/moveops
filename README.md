<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-17-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/AWS_Bedrock-Claude_Haiku_4.5-FF9900?style=for-the-badge&logo=amazon-web-services&logoColor=white" />
  <img src="https://img.shields.io/badge/JWT-Auth-000?style=for-the-badge&logo=jsonwebtokens" />
  <img src="https://img.shields.io/badge/Aiven-Cloud_DB-FF5733?style=for-the-badge" />
</p>

<h1 align="center">🚌 TransitOps</h1>
<p align="center"><strong>Smart Transport Operations Platform</strong></p>
<p align="center">
  <em>Digitizing fleet operations — vehicle registry, driver management, trip dispatch,<br/>
  maintenance tracking, and fuel/expense analytics with server-enforced business rules.</em>
</p>

---

## 📐 System Architecture

```mermaid
graph TB
    subgraph Client["🖥️ Browser"]
        LP["/login — LoginForm"]
        DB["/(dashboard) — Sidebar + Pages"]
        LP -->|"POST /api/auth/login"| AUTH
        DB -->|"fetch /api/*"| API
    end

    subgraph Edge["🛡️ Edge Runtime"]
        MW["proxy.ts<br/>JWT Verification on every request"]
    end

    subgraph Server["⚙️ Next.js Server"]
        AUTH["Auth Routes<br/>login · logout · me"]
        API["API Route Handlers<br/>vehicles · drivers · trips<br/>maintenance · fuel · expenses<br/>dashboard · analytics"]
        AI["🤖 AI Copilot API<br/>/api/ai/chat"]
        LIB["lib/<br/>auth.ts · db.ts · rbac.ts"]
        QRY["lib/queries/<br/>vehicles.ts · drivers.ts<br/>trips.ts · maintenance.ts<br/>fuel.ts · expenses.ts"]
        AILIB["lib/ai/<br/>bedrock.ts · safe-query.ts<br/>system-prompt.ts · tools.ts"]
    end

    subgraph Bedrock["🧠 AWS Bedrock — Mumbai (ap-south-1)"]
        CLAUDE["Claude Haiku 4.5<br/>Tool Use (function calling)"]
    end

    subgraph DB_Layer["🗄️ PostgreSQL — Aiven Cloud"]
        TABLES["users · roles<br/>vehicles · drivers · trips<br/>maintenance_records<br/>fuel_logs · expenses"]
    end

    Client -->|"Every request"| MW
    MW -->|"✅ Valid JWT"| Server
    MW -->|"❌ No token"| LP
    AUTH --> LIB
    API --> LIB
    AI --> AILIB
    AILIB -->|"Converse API"| CLAUDE
    CLAUDE -->|"tool_use: query_database"| AILIB
    AILIB -->|"safe SQL"| TABLES
    LIB --> QRY
    QRY -->|"SQL queries"| TABLES

    style Client fill:#1e1e2e,stroke:#89b4fa,color:#cdd6f4
    style Edge fill:#1e1e2e,stroke:#f38ba8,color:#cdd6f4
    style Server fill:#1e1e2e,stroke:#a6e3a1,color:#cdd6f4
    style DB_Layer fill:#1e1e2e,stroke:#fab387,color:#cdd6f4
    style Bedrock fill:#1e1e2e,stroke:#f9e2af,color:#cdd6f4
```

---

## 🔐 Authentication Flow

```mermaid
sequenceDiagram
    actor U as User
    participant B as Browser
    participant M as Middleware (proxy.ts)
    participant A as /api/auth/login
    participant D as PostgreSQL

    U->>B: Enter email + password
    B->>A: POST /api/auth/login
    A->>D: SELECT user WHERE email = ?
    D-->>A: user row (with bcrypt hash)
    A->>A: bcrypt.compare(password, hash)
    
    alt ✅ Valid credentials
        A->>A: Sign JWT (HS256, 8h expiry)
        A->>B: Set HTTP-only cookie + return user JSON
        B->>M: Request /dashboard (cookie attached)
        M->>M: Verify JWT from cookie
        M-->>B: ✅ Allow — render dashboard
    else ❌ Invalid credentials
        A-->>B: 401 "Invalid email or password"
    end

    Note over M: Every subsequent request<br/>auto-sends the cookie.<br/>Middleware verifies before<br/>reaching any page or API.
```

---

## 🛡️ Role-Based Access Control

```mermaid
graph LR
    subgraph Roles["Four Roles"]
        FM["🔧 Fleet Manager"]
        DS["📋 Dispatcher"]
        SO["🛡️ Safety Officer"]
        FA["💰 Financial Analyst"]
    end

    subgraph Modules["Feature Modules"]
        V["🚗 Vehicles"]
        MT["🔩 Maintenance"]
        DR["👤 Drivers"]
        TR["🗺️ Trips"]
        FE["⛽ Fuel & Expenses"]
        AN["📊 Analytics"]
        DA["📈 Dashboard"]
    end

    FM ==>|"CRUD"| V
    FM ==>|"CRUD"| MT
    FM -.->|"read"| TR
    FM -.->|"read"| DR

    DS ==>|"CRUD"| TR
    DS ==>|"owns"| DA
    DS -.->|"read"| V
    DS -.->|"read"| DR

    SO ==>|"CRUD"| DR
    SO -.->|"read"| TR

    FA ==>|"CRUD"| FE
    FA ==>|"CRUD"| AN
    FA -.->|"read"| V
    FA -.->|"read"| TR

    style FM fill:#4f46e5,stroke:#4f46e5,color:#fff
    style DS fill:#06b6d4,stroke:#06b6d4,color:#fff
    style SO fill:#f59e0b,stroke:#f59e0b,color:#000
    style FA fill:#10b981,stroke:#10b981,color:#fff
```

| Role | Owns (Full CRUD) | Read Access | Color |
|:---|:---|:---|:---:|
| **Fleet Manager** | Vehicles, Maintenance | Trips, Drivers | 🟣 |
| **Dispatcher** | Dashboard, Trips | Vehicles, Drivers | 🔵 |
| **Safety Officer** | Drivers, License Verification | Trips | 🟡 |
| **Financial Analyst** | Fuel, Expenses, Analytics | Trips, Vehicles | 🟢 |

---

## 🗄️ Entity-Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ TRIPS : "dispatches"
    USERS ||--o{ FUEL_LOGS : "logs"
    USERS ||--o{ EXPENSES : "logs"
    USERS ||--o{ MAINTENANCE_RECORDS : "logs"
    USERS ||--o{ DRIVERS : "registers"
    USERS }o--|| ROLES : "has role"
    
    VEHICLES ||--o{ TRIPS : "assigned to"
    VEHICLES ||--o{ FUEL_LOGS : "fueled"
    VEHICLES ||--o{ EXPENSES : "charged to"
    VEHICLES ||--o{ MAINTENANCE_RECORDS : "serviced"
    
    DRIVERS ||--o{ TRIPS : "drives"

    USERS {
        int id PK
        varchar name
        varchar email UK
        text password_hash
        enum role FK
        boolean is_active
    }

    ROLES {
        int id PK
        enum name UK
        varchar display_name
        text description
    }

    VEHICLES {
        int id PK
        varchar vehicle_id UK
        varchar type
        varchar make_model
        varchar registration_no UK
        int capacity_kg
        enum status
        decimal avg_cost_per_km
        int total_trips
        decimal total_earnings
    }

    DRIVERS {
        int id PK
        varchar name
        varchar license_id UK
        boolean license_verified
        date license_expiry
        jsonb license_data
        varchar category
        enum status
        int safety_score
    }

    TRIPS {
        int id PK
        varchar trip_code UK
        int vehicle_id FK
        int driver_id FK
        int dispatcher_id FK
        varchar origin
        varchar destination
        enum status
        decimal cargo_weight_kg
        decimal distance_km
        decimal revenue
    }

    MAINTENANCE_RECORDS {
        int id PK
        int vehicle_id FK
        varchar service_type
        decimal cost
        enum status
        date service_date
    }

    FUEL_LOGS {
        int id PK
        int vehicle_id FK
        decimal liters
        decimal cost
        int odometer_km
        varchar fuel_type
    }

    EXPENSES {
        int id PK
        varchar category
        decimal amount
        int vehicle_id FK
        int trip_id FK
    }
```

---

## ⚡ State Machines

### Vehicle Lifecycle

```mermaid
stateDiagram-v2
    [*] --> available : Registered
    
    available --> on_trip : Trip dispatched
    on_trip --> available : Trip completed / cancelled
    
    available --> in_shop : Maintenance opened
    in_shop --> available : Maintenance closed
    
    available --> retired : Decommissioned
    on_trip --> in_shop : (via available)
    
    retired --> [*] : Terminal state

    state available {
        [*] : Ready for dispatch
    }
    state on_trip {
        [*] : Assigned to active trip
    }
    state in_shop {
        [*] : Under maintenance
    }
    state retired {
        [*] : Permanently removed
    }
```

### Driver Lifecycle

```mermaid
stateDiagram-v2
    [*] --> pending_approval : Registered by Safety Officer
    pending_approval --> available : Approved by Fleet Manager
    
    available --> on_trip : Trip dispatched
    on_trip --> available : Trip completed / cancelled
    
    available --> off_duty : Marked off duty
    off_duty --> available : Back on duty
    
    available --> suspended : Compliance violation
    suspended --> available : Reinstated
```

### Trip Lifecycle

```mermaid
stateDiagram-v2
    [*] --> scheduled : Trip created

    scheduled --> dispatched : action_dispatch()
    dispatched --> completed : action_complete()
    dispatched --> cancelled : action_cancel()

    completed --> [*]
    cancelled --> [*]

    note right of dispatched
        On dispatch:
        → Vehicle → on_trip
        → Driver → on_trip
    end note

    note right of completed
        On complete:
        → Vehicle → available
        → Driver → available
        → Record distance + fuel
    end note

    note right of cancelled
        On cancel:
        → Vehicle → available
        → Driver → available
    end note
```

---

## 🔗 Cross-Model Trigger Map

```mermaid
graph LR
    subgraph Trip_Actions["Trip Actions"]
        DISP["action_dispatch()"]
        COMP["action_complete()"]
        CANC["action_cancel()"]
    end

    subgraph Maint_Actions["Maintenance Actions"]
        OPEN["Open Record"]
        CLOSE["Close Record"]
    end

    subgraph Vehicle_State["Vehicle State"]
        VA["🟢 available"]
        VOT["🔵 on_trip"]
        VIS["🟠 in_shop"]
    end

    subgraph Driver_State["Driver State"]
        DA["🟢 available"]
        DOT["🔵 on_trip"]
    end

    DISP -->|"set"| VOT
    DISP -->|"set"| DOT
    COMP -->|"restore"| VA
    COMP -->|"restore"| DA
    CANC -->|"restore"| VA
    CANC -->|"restore"| DA
    OPEN -->|"set"| VIS
    CLOSE -->|"restore"| VA

    style DISP fill:#3b82f6,color:#fff
    style COMP fill:#10b981,color:#fff
    style CANC fill:#ef4444,color:#fff
    style OPEN fill:#f59e0b,color:#000
    style CLOSE fill:#22c55e,color:#fff
```

---

## 📱 Screen Wireframes

### Dashboard

```
┌─────────────────────────────────────────────────────────────────────┐
│  🚌 TransitOps     │  Dashboard                                    │
│  ─────────────────  │                                               │
│  ▦ Dashboard    ●   │  Welcome back, Riya · Dispatcher              │
│  🚌 Fleet          │                                               │
│  👤 Drivers         │  ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  🗺️ Trips          │  │ Active   │ │ Drivers  │ │ Trips    │      │
│  🔧 Maintenance    │  │ Vehicles │ │ On Trip  │ │ Today    │      │
│  ⛽ Fuel & Exp.    │  │    5     │ │    2     │ │    3     │      │
│  📊 Analytics      │  └──────────┘ └──────────┘ └──────────┘      │
│                     │  ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│                     │  │ Pending  │ │ Revenue  │ │ Fleet    │      │
│                     │  │ Maint.   │ │ (Month)  │ │ Util. %  │      │
│  ┌───────────────┐  │  │    2     │ │ ₹2.4L    │ │   40%    │      │
│  │ 👤 Riya       │  │  └──────────┘ └──────────┘ └──────────┘      │
│  │   Dispatcher  │  │                                               │
│  └───────────────┘  │  ┌─────────────────────────────────────────┐  │
│  [↪ Sign out]       │  │  📊 Charts · 📈 Trends · 📋 Recent    │  │
│                     │  └─────────────────────────────────────────┘  │
└─────────────────────┴───────────────────────────────────────────────┘
```

### Fleet / Vehicles Page

```
┌─────────────────────────────────────────────────────────────────────┐
│  Sidebar  │  Fleet Registry                    [+ Add Vehicle]      │
│           │                                                         │
│           │  🔍 Search...   Filter: [All ▾]  [All Status ▾]        │
│           │                                                         │
│           │  ┌───────────────────────────────────────────────────┐  │
│           │  │ ID       │ Model          │ Type │ Cap.  │ Status│  │
│           │  ├──────────┼────────────────┼──────┼───────┼───────┤  │
│           │  │ VAN-09   │ Tata Ace Gold  │ Van  │ 800kg │🟢 Avl│  │
│           │  │ TRUCK-16 │ Ashok Leyland  │Truck │5000kg │🔵 OT │  │
│           │  │ BUS-03   │ Tata Starbus   │ Bus  │2000kg │🟢 Avl│  │
│           │  │ VAN-12   │ Mahindra Supro │ Van  │ 900kg │🟠 IS │  │
│           │  │ TRUCK-21 │ BharatBenz     │Truck │8000kg │🟢 Avl│  │
│           │  └───────────────────────────────────────────────────┘  │
│           │  Showing 5 vehicles · 3 Available · 1 On Trip · 1 Shop │
└───────────┴─────────────────────────────────────────────────────────┘
```

### Trip Management Page

```
┌─────────────────────────────────────────────────────────────────────┐
│  Sidebar  │  Trip Management                   [+ Create Trip]      │
│           │                                                         │
│           │  ┌───────────────────────────────────────────────────┐  │
│           │  │ Code   │ Route               │ Cargo │  Status   │  │
│           │  ├────────┼─────────────────────┼───────┼───────────┤  │
│           │  │TRP-001 │ Mumbai → Pune       │ 650kg │✅ Complete│  │
│           │  │TRP-002 │ Delhi → Jaipur      │4200kg │🔵 On Trip│  │
│           │  │TRP-003 │ Bengaluru → Chennai │1800kg │⏳ Schedul│  │
│           │  │TRP-005 │ Ahmedabad → Surat   │7500kg │📤 Dispatc│  │
│           │  └───────────────────────────────────────────────────┘  │
│           │                                                         │
│           │  Trip Detail: TRP-005                                   │
│           │  ┌─────────────────────────────────────────────────┐    │
│           │  │ Vehicle: TRUCK-21    Driver: Manish Tiwari      │    │
│           │  │ Cargo: 7500 / 8000 kg   Revenue: ₹72,000       │    │
│           │  │                                                  │    │
│           │  │ [✅ Complete Trip]  [❌ Cancel Trip]             │    │
│           │  └─────────────────────────────────────────────────┘    │
└───────────┴─────────────────────────────────────────────────────────┘
```

---

## 🤖 AI Ops Copilot — Powered by AWS Bedrock

A natural-language chat sidebar that queries the **live PostgreSQL database** in real-time. Users ask questions in plain English — the AI writes SQL, executes it safely, and responds with formatted insights.

### How It Works

```mermaid
sequenceDiagram
    actor U as User
    participant UI as Chat Sidebar
    participant API as /api/ai/chat
    participant BR as AWS Bedrock (ap-south-1)
    participant CL as Claude Haiku 4.5
    participant DB as PostgreSQL

    U->>UI: "Best driver for a 5000kg load?"
    UI->>API: POST { message, history }
    API->>API: Auth check + build system prompt
    API->>BR: Converse API (messages + tools)
    BR->>CL: Process with tool definitions

    CL->>CL: Decides to call query_database
    CL-->>API: tool_use: { sql: "SELECT ..." }
    API->>API: safe-query.ts validates (read-only)
    API->>DB: Execute in READ ONLY transaction
    DB-->>API: Result rows
    API->>CL: tool_result with data
    CL-->>API: Formatted answer + recommendation
    API-->>UI: Response with markdown tables
    UI-->>U: "🥇 TRUCK-21 — Driver: Manish, safety 91"
```

### Key Features

| Feature | Detail |
|---|---|
| **Natural Language → SQL** | Claude generates accurate SQL from plain English questions |
| **Read-Only Safety Layer** | `safe-query.ts` blocks INSERT/UPDATE/DELETE/DROP — only SELECT allowed |
| **Role-Aware** | System prompt adapts to user's role — dispatchers get trip-focused answers, analysts get cost-focused |
| **Live Database** | Queries real data, not mock data. Numbers are always current |
| **Markdown Tables** | Responses render with formatted tables, bold text, and recommendations |
| **Multi-Turn Context** | Maintains conversation history for follow-up questions |

### Example Conversations

**Dispatcher asks:**
> "Available vehicles for a 4000kg shipment?"

**AI responds:**
> Based on available vehicles with sufficient capacity:
>
> | Vehicle | Model | Capacity | Status | Cost/km |
> |---|---|---|---|---|
> | TRUCK-21 | BharatBenz 3528R | 8000kg | 🟢 Available | ₹14.50 |
> | BUS-03 | Tata Starbus | 2000kg | 🟢 Available | ❌ Under capacity |
>
> **🥇 Recommended: TRUCK-21** — 50% capacity utilization at 4000kg, lowest operating cost.

**Financial Analyst asks:**
> "Which vehicle has the highest fuel cost?"

**AI responds with a live query from fuel_logs, ranked by total cost.**

### Safety Architecture

```mermaid
graph LR
    Q["User Question"] --> CL["Claude Haiku 4.5"]
    CL -->|"tool_use"| SQ["safe-query.ts"]

    subgraph Validation["🛡️ SQL Safety Layer"]
        V1["✅ Starts with SELECT/WITH"]
        V2["❌ Blocks INSERT, UPDATE, DELETE"]
        V3["❌ Blocks DROP, ALTER, TRUNCATE"]
        V4["❌ Blocks password_hash access"]
        V5["✅ Adds LIMIT 50 if missing"]
        V6["✅ 5-second query timeout"]
        V7["✅ READ ONLY transaction"]
    end

    SQ --> Validation
    Validation -->|"Safe"| DB[("PostgreSQL")]
    Validation -->|"Blocked"| ERR["Error returned to Claude"]

    style Validation fill:#1e1e2e,stroke:#ef4444,color:#cdd6f4
```

### UI Wireframe

```
┌──────────────────────────────────┬──────────────────────┐
│  [Current Dashboard Page]        │  🤖 AI Copilot    ✕  │
│                                  │                      │
│                                  │  ┌────────────────┐  │
│                                  │  │ 🤖 Hi, Piyush! │  │
│                                  │  │ I can query     │  │
│                                  │  │ your live fleet │  │
│                                  │  │ database.       │  │
│                                  │  └────────────────┘  │
│                                  │                      │
│                                  │  Try asking:         │
│                                  │  ┌────────────────┐  │
│                                  │  │🚗 Fleet status  │  │
│                                  │  │   overview      │  │
│                                  │  ├────────────────┤  │
│                                  │  │👤 Best driver   │  │
│                                  │  │   for 3000kg    │  │
│                                  │  ├────────────────┤  │
│                                  │  │⛽ Fuel spend    │  │
│                                  │  │   this week     │  │
│                                  │  └────────────────┘  │
│                                  │                      │
│                                  │  ┌──────────┐ ┌───┐  │
│                                  │  │ Ask me...│ │ ➤ │  │
│                                  │  └──────────┘ └───┘  │
└──────────────────────────────────┴──────────────────────┘
```

---

## ✅ Build Progress

```mermaid
gantt
    title TransitOps Development Phases
    dateFormat X
    axisFormat %s

    section Phase 1 — Foundation ✅
    DB Schema + Seed Data          :done, p1a, 0, 1
    JWT Auth (sign/verify/cookie)  :done, p1b, 0, 1
    RBAC Permission Matrix         :done, p1c, 0, 1
    Edge Middleware (proxy.ts)     :done, p1d, 0, 1
    Login/Logout/Me API Routes     :done, p1e, 0, 1
    Login Page + LoginForm UI      :done, p1f, 0, 1
    Sidebar + StatusBadge          :done, p1g, 0, 1
    Dashboard Shell                :done, p1h, 0, 1
    Vehicles Queries + API         :done, p1i, 0, 1

    section AI Copilot ✅
    Bedrock Client + Converse API  :done, ai1, 1, 2
    System Prompt + Schema Context :done, ai2, 1, 2
    SQL Safety Layer               :done, ai3, 1, 2
    Chat API Route                 :done, ai4, 1, 2
    Chat Sidebar UI + Streaming    :done, ai5, 1, 2
    Role-Based Suggestions         :done, ai6, 1, 2

    section Phase 2 — CRUD Pages 🔄
    Fleet Page (list/create/edit)  :active, p2a, 2, 3
    Drivers Queries + API          :p2b, 2, 3
    Drivers Page                   :p2c, 2, 3
    Maintenance Queries + API      :p2d, 2, 3
    Maintenance Page               :p2e, 2, 3

    section Phase 3 — Trip Engine 🔜
    Trip Queries + Business Rules  :p3a, 3, 4
    Trip API (dispatch/complete/cancel) :p3b, 3, 4
    Trips Page + Action Buttons    :p3c, 3, 4

    section Phase 4 — Finance & Reports 🔜
    Fuel + Expense API + Page      :p4a, 4, 5
    Dashboard KPIs (live data)     :p4b, 4, 5
    Analytics + Charts             :p4c, 4, 5
    CSV Export                     :p4d, 4, 5
```

### Checklist

- [x] PostgreSQL schema — 8 tables, ENUMs, indexes, 555-line seed
- [x] JWT auth — `jose` HS256, HTTP-only cookies, 8h sessions
- [x] RBAC — 4 roles, 15 permissions, `requireRole()` + `canDo()`
- [x] Edge middleware — protects all dashboard + API routes
- [x] Auth APIs — `login` · `logout` · `me`
- [x] Login page — full-styled `LoginForm` component
- [x] Dashboard layout — `Sidebar` (role-filtered) + content shell
- [x] `StatusBadge` — color-coded state pills
- [x] Vehicle queries — `getAllVehicles`, `createVehicle`, `updateVehicle`, `deleteVehicle`
- [x] Vehicles API — `GET/POST /api/vehicles` · `GET/PUT/DELETE /api/vehicles/[id]`
- [x] **AI Copilot** — Bedrock client, system prompt, SQL safety layer, chat API
- [x] **AI Chat UI** — sidebar panel, message bubbles, markdown rendering, role-based suggestions
- [ ] Fleet page — list view + create/edit modal
- [ ] Drivers — queries + API + page
- [ ] Trips — queries + API + page with action buttons
- [ ] Maintenance — queries + API + page
- [ ] Fuel & Expenses — queries + API + page
- [ ] Dashboard KPIs — `/api/dashboard` live aggregates
- [ ] Analytics — charts + CSV export

---

## 🏢 Business Rules

All 10 rules enforced **server-side** — no rule relies on UI filtering alone.

```mermaid
graph TD
    subgraph Validations["Pre-Save Validations"]
        R1["① vehicle_id + registration_no<br/>must be UNIQUE"]
        R2["② retired / in_shop vehicles<br/>excluded from dispatch"]
        R3["③ Expired license or suspended<br/>driver → cannot assign"]
        R4["④ on_trip vehicle/driver<br/>→ cannot reassign"]
        R5["⑤ cargo_weight_kg<br/>≤ vehicle capacity_kg"]
    end

    subgraph Transitions["State Transition Side-Effects"]
        R6["⑥ dispatch → vehicle + driver<br/>→ on_trip"]
        R7["⑦ complete → vehicle + driver<br/>→ available"]
        R8["⑧ cancel → vehicle + driver<br/>→ available"]
        R9["⑨ maintenance opened<br/>→ vehicle in_shop"]
        R10["⑩ maintenance closed<br/>→ vehicle available<br/>(unless retired)"]
    end

    style Validations fill:#1e1e2e,stroke:#ef4444,color:#cdd6f4
    style Transitions fill:#1e1e2e,stroke:#10b981,color:#cdd6f4
```

---

## 📊 KPI Formulas

| Metric | Formula | Used In |
|:---|:---|:---|
| **Fuel Efficiency** | `total_distance ÷ total_fuel_consumed` | Analytics |
| **Fleet Utilisation** | `vehicles_on_trip ÷ total_active_vehicles × 100` | Dashboard |
| **Operational Cost** | `fuel_cost + maintenance_cost` (per vehicle) | Analytics |
| **Vehicle ROI** | `(revenue − (maintenance + fuel)) ÷ acquisition_cost` | Analytics |

---

## 🚀 Quick Start

### Prerequisites

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1?style=flat-square&logo=postgresql&logoColor=white)

### 1. Clone & Install

```bash
git clone https://github.com/negimox/moveops.git
cd moveops
npm install
```

### 2. Configure Environment

```bash
# .example.env already has all shared team credentials pre-filled.
# Just copy it — no editing needed.
cp .example.env .env.local
```

> [!NOTE]
> The `.example.env` file contains the shared team database (Aiven Cloud) and AWS Bedrock credentials. All teammates can use the same file as-is.

### 3. Initialize Database

```bash
# Via psql:
psql $DATABASE_URL -f scripts/db-setup.sql

# Or via Node.js (if psql not available):
node scripts/verify-db.js
```

### 4. Run Dev Server

```bash
npm run dev
```

Open **http://localhost:3000**

### Demo Credentials

| Role | Email | Password |
|:---|:---|:---|
| 🟣 Fleet Manager | `fleet@transitops.in` | `Password@123` |
| 🔵 Dispatcher | `dispatch@transitops.in` | `Password@123` |
| 🟡 Safety Officer | `safety@transitops.in` | `Password@123` |
| 🟢 Financial Analyst | `finance@transitops.in` | `Password@123` |

---

## 📁 Project Structure

```
moveops/
│
├── app/
│   ├── (auth)/                    ← Public pages (no login required)
│   │   ├── layout.tsx
│   │   └── login/page.tsx
│   │
│   ├── (dashboard)/               ← Protected pages (login required)
│   │   ├── layout.tsx             ← Sidebar shell
│   │   ├── dashboard/page.tsx     ← KPI dashboard
│   │   ├── fleet/                 ← 🔄 Phase 2
│   │   ├── drivers/               ← 🔄 Phase 2
│   │   ├── trips/                 ← 🔜 Phase 3
│   │   ├── maintenance/           ← 🔄 Phase 2
│   │   ├── fuel-expenses/         ← 🔜 Phase 4
│   │   └── analytics/             ← 🔜 Phase 4
│   │
│   ├── api/                       ← Backend route handlers
│   │   ├── auth/                  ← ✅ login · logout · me
│   │   ├── vehicles/              ← ✅ list · create · get · update · delete
│   │   └── ai/chat/route.ts       ← ✅ AI Copilot API endpoint
│   │
│   ├── globals.css                ← Design tokens & theme + AI animations
│   ├── layout.tsx                 ← Root layout
│   └── page.tsx                   ← Landing redirect
│
├── components/
│   ├── auth/LoginForm.tsx         ← ✅ Styled login form
│   ├── ai/                        ← ✅ AI Copilot UI
│   │   ├── AICopilot.tsx          ← Floating sidebar panel
│   │   ├── ChatMessage.tsx        ← Message bubbles + markdown
│   │   └── SuggestedQuestions.tsx  ← Role-based starter prompts
│   └── ui/
│       ├── Sidebar.tsx            ← ✅ Role-aware navigation
│       └── StatusBadge.tsx        ← ✅ Color-coded status pills
│
├── lib/
│   ├── auth.ts                    ← ✅ JWT sign/verify + cookies
│   ├── db.ts                      ← ✅ PostgreSQL pool
│   ├── rbac.ts                    ← ✅ Permission matrix
│   ├── ai/                        ← ✅ AI Engine
│   │   ├── bedrock.ts             ← Bedrock Converse API client
│   │   ├── system-prompt.ts       ← Schema-aware prompt builder
│   │   ├── tools.ts               ← Tool definitions for Claude
│   │   └── safe-query.ts          ← SQL validator + read-only executor
│   └── queries/
│       └── vehicles.ts            ← ✅ Vehicle CRUD queries
│
├── scripts/
│   └── db-setup.sql               ← ✅ Full schema + seed (555 lines)
│
├── proxy.ts                       ← ✅ Edge middleware (auth guard)
├── .example.env                   ← Environment variable template
└── package.json
```

---

## 🧪 Acceptance Test

> Must pass before submission

```mermaid
graph TD
    T1["① Register vehicle Van-05<br/>capacity = 500kg, available"] --> T2
    T2["② Register driver Alex<br/>valid license"] --> T3
    T3["③ Create trip, cargo = 450kg<br/>Dispatch → succeeds (450 ≤ 500)<br/>Van-05 + Alex → on_trip"] --> T4
    T4["④ Try assign Van-05 or Alex<br/>to second trip → ❌ REJECTED"] --> T5
    T5["⑤ Complete trip<br/>(final odometer + fuel)<br/>Both → available"] --> T6
    T6["⑥ Create maintenance on Van-05<br/>→ in_shop<br/>→ disappears from dispatch"] --> T7
    T7["⑦ Close maintenance<br/>→ Van-05 returns to available"] --> T8
    T8["⑧ Reports show updated<br/>fuel efficiency + cost ✅"]

    style T1 fill:#10b981,color:#fff
    style T2 fill:#10b981,color:#fff
    style T3 fill:#3b82f6,color:#fff
    style T4 fill:#ef4444,color:#fff
    style T5 fill:#3b82f6,color:#fff
    style T6 fill:#f59e0b,color:#000
    style T7 fill:#10b981,color:#fff
    style T8 fill:#8b5cf6,color:#fff
```

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|:---|:---|:---|
| **Framework** | Next.js 16 (App Router) | Full-stack in one project |
| **Language** | TypeScript 5 | Type safety across client + server |
| **Styling** | CSS Custom Properties | Design tokens, no build step |
| **Auth** | `jose` JWT + `bcryptjs` | Edge-compatible, HTTP-only cookies |
| **Database** | PostgreSQL (Aiven Cloud) | ACID transactions, ENUM types |
| **DB Client** | `node-postgres` (pg) | Connection pooling, parameterized queries |
| **AI Engine** | AWS Bedrock — Claude Haiku 4.5 | Converse API + tool_use for SQL generation |
| **AI Region** | `ap-south-1` (Mumbai) | Low latency from India |
| **AI Safety** | `safe-query.ts` | Read-only SQL validation + execution |
| **Validation** | Server-side in route handlers | Business rules can't be bypassed |
| **Export** | JSON → CSV (`exportService.js`) | Mandatory per spec |

---

## 📎 Links

- 📄 [Full Build Specification](../description.md)
- 🎨 [UI Mockup — Excalidraw](https://link.excalidraw.com/l/65VNwvy7c4X/1FHGDNgD2td)
- 📊 [Design PDF](./design/TransitOps%20Smart%20Transport%20Operations%20Platform.pdf)
