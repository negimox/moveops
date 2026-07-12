-- ============================================================
-- TransitOps — PostgreSQL Database Schema  (v2 — corrected)
-- Run once to initialise the database:
--   psql $DATABASE_URL -f scripts/db-setup.sql
-- ============================================================

-- ─── Drop order matters: child tables first ────────────────
DROP TABLE IF EXISTS expenses            CASCADE;
DROP TABLE IF EXISTS fuel_logs           CASCADE;
DROP TABLE IF EXISTS maintenance_records CASCADE;
DROP TABLE IF EXISTS trips               CASCADE;
DROP TABLE IF EXISTS drivers             CASCADE;
DROP TABLE IF EXISTS vehicles            CASCADE;
DROP TABLE IF EXISTS roles               CASCADE;
DROP TABLE IF EXISTS users               CASCADE;

-- ─── Drop ENUM types ───────────────────────────────────────
DROP TYPE IF EXISTS user_role          CASCADE;
DROP TYPE IF EXISTS vehicle_status     CASCADE;
DROP TYPE IF EXISTS driver_status      CASCADE;
DROP TYPE IF EXISTS trip_status        CASCADE;
DROP TYPE IF EXISTS maintenance_status CASCADE;

-- ============================================================
-- ENUM Types
-- ============================================================

CREATE TYPE user_role AS ENUM (
  'fleet_manager',
  'dispatcher',
  'safety_officer',
  'financial_analyst'
);

CREATE TYPE vehicle_status AS ENUM (
  'available',
  'on_trip',
  'in_shop',
  'retired'
);

CREATE TYPE driver_status AS ENUM (
  'pending_approval',
  'available',
  'on_trip',
  'off_duty',
  'suspended'
);

CREATE TYPE trip_status AS ENUM (
  'scheduled',
  'dispatched',
  'on_trip',
  'completed',
  'cancelled'
);

CREATE TYPE maintenance_status AS ENUM (
  'scheduled',
  'in_progress',
  'completed'
);

-- ============================================================
-- Entity 1: roles
-- Describes each system role with ownership domain.
-- The `name` column ties back to the user_role ENUM so there
-- is always exactly one row per ENUM value.
-- ============================================================

CREATE TABLE roles (
  id           SERIAL PRIMARY KEY,
  name         user_role    UNIQUE NOT NULL,
  display_name VARCHAR(100)        NOT NULL,
  description  TEXT                NOT NULL,
  owns_modules TEXT[]              NOT NULL,  -- e.g. ARRAY['Fleet','Maintenance']
  created_at   TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

INSERT INTO roles (name, display_name, description, owns_modules) VALUES
  ('fleet_manager',
   'Fleet Manager',
   'Owns the vehicle fleet and maintenance schedule. Registers new vehicles, tracks vehicle health, and schedules servicing.',
   ARRAY['Fleet','Maintenance']),

  ('dispatcher',
   'Dispatcher',
   'Owns trip planning and dispatching. Creates trip assignments, tracks live trip status, and manages the dispatch dashboard.',
   ARRAY['Dashboard','Trips']),

  ('safety_officer',
   'Safety Officer',
   'Owns driver compliance. Registers drivers, triggers DigiLocker licence verification, monitors safety scores, and suspends non-compliant drivers.',
   ARRAY['Drivers']),

  ('financial_analyst',
   'Financial Analyst',
   'Owns cost reporting. Logs fuel fill-ups and operational expenses, and generates revenue/expense analytics.',
   ARRAY['Fuel & Expenses','Analytics']);

-- ============================================================
-- Entity 2: users
-- System users authenticated via email + password (bcrypt).
-- role column references the roles table logically via ENUM.
-- ============================================================

CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100)        NOT NULL,
  email         VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT                NOT NULL,
  role          user_role           NOT NULL REFERENCES roles(name),
  is_active     BOOLEAN             NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role  ON users(role);

-- ============================================================
-- Entity 3: vehicles
-- Fleet inventory managed by Fleet Manager.
-- ============================================================

CREATE TABLE vehicles (
  id              SERIAL PRIMARY KEY,
  vehicle_id      VARCHAR(20) UNIQUE  NOT NULL,  -- human key e.g. VAN-09
  type            VARCHAR(50)         NOT NULL,  -- Van, Truck, Bus
  make_model      VARCHAR(100),                  -- e.g. Tata Ace
  year            SMALLINT,
  registration_no VARCHAR(30) UNIQUE,            -- e.g. MH12AB1234
  capacity_kg     INTEGER             NOT NULL,
  status          vehicle_status      NOT NULL DEFAULT 'available',
  avg_cost_per_km DECIMAL(10, 2)      NOT NULL DEFAULT 0.00,
  total_trips     INTEGER             NOT NULL DEFAULT 0,
  total_earnings  DECIMAL(12, 2)      NOT NULL DEFAULT 0.00,
  notes           TEXT,
  created_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vehicles_status ON vehicles(status);

-- ============================================================
-- Entity 4: drivers
-- Driver profiles managed by Safety Officer.
-- DigiLocker licence data stored in license_data (JSONB).
-- ============================================================

CREATE TABLE drivers (
  id               SERIAL PRIMARY KEY,
  name             VARCHAR(100)       NOT NULL,
  contact          VARCHAR(20),
  license_id       VARCHAR(50) UNIQUE NOT NULL,  -- DL number (from DigiLocker)
  license_verified BOOLEAN            NOT NULL DEFAULT FALSE,
  license_expiry   DATE,                         -- parsed from DigiLocker response
  license_data     JSONB,                        -- raw Setu API document payload
  category         VARCHAR(50),                  -- LMV, HMV, HPMV, etc.
  status           driver_status      NOT NULL DEFAULT 'pending_approval',
  trip_count       INTEGER            NOT NULL DEFAULT 0,
  safety_score     INTEGER            NOT NULL DEFAULT 100  -- 0–100
                   CHECK (safety_score BETWEEN 0 AND 100),
  registered_by    INTEGER            REFERENCES users(id) ON DELETE SET NULL, -- safety_officer who registered
  approved_by      INTEGER            REFERENCES users(id) ON DELETE SET NULL, -- fleet_manager who approved
  created_at       TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_drivers_status           ON drivers(status);
CREATE INDEX idx_drivers_license_id       ON drivers(license_id);
CREATE INDEX idx_drivers_license_verified ON drivers(license_verified);

-- ============================================================
-- Entity 5: trips
-- Trip assignments managed by Dispatcher.
-- Links vehicles, drivers, and the dispatcher (user).
-- ============================================================

CREATE TABLE trips (
  id              SERIAL PRIMARY KEY,
  trip_code       VARCHAR(20) UNIQUE  NOT NULL,   -- e.g. TRP-001
  vehicle_id      INTEGER             NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  driver_id       INTEGER             NOT NULL REFERENCES drivers(id)  ON DELETE RESTRICT,
  dispatcher_id   INTEGER             NOT NULL REFERENCES users(id)    ON DELETE RESTRICT,
  origin          VARCHAR(200)        NOT NULL,
  destination     VARCHAR(200)        NOT NULL,
  status          trip_status         NOT NULL DEFAULT 'scheduled',
  cargo_weight_kg DECIMAL(10, 2)      NOT NULL DEFAULT 0.00,
  distance_km     DECIMAL(10, 2),                 -- filled on completion
  revenue         DECIMAL(12, 2)      NOT NULL DEFAULT 0.00,
  scheduled_at    TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trips_status       ON trips(status);
CREATE INDEX idx_trips_vehicle_id   ON trips(vehicle_id);
CREATE INDEX idx_trips_driver_id    ON trips(driver_id);
CREATE INDEX idx_trips_dispatcher   ON trips(dispatcher_id);
CREATE INDEX idx_trips_scheduled_at ON trips(scheduled_at DESC);

-- ============================================================
-- Entity 6: maintenance_records (Maintenance Logs)
-- Service and repair records managed by Fleet Manager.
-- ============================================================

CREATE TABLE maintenance_records (
  id           SERIAL PRIMARY KEY,
  vehicle_id   INTEGER            NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  service_type VARCHAR(100)       NOT NULL,  -- Oil Change, Tyre Rotation, Engine Check…
  vendor       VARCHAR(150),                 -- service centre name
  cost         DECIMAL(10, 2)     NOT NULL DEFAULT 0.00,
  status       maintenance_status NOT NULL DEFAULT 'scheduled',
  service_date DATE               NOT NULL DEFAULT CURRENT_DATE,
  notes        TEXT,
  logged_by    INTEGER            REFERENCES users(id) ON DELETE SET NULL,  -- fleet_manager
  created_at   TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_maintenance_vehicle_id ON maintenance_records(vehicle_id);
CREATE INDEX idx_maintenance_status     ON maintenance_records(status);
CREATE INDEX idx_maintenance_date       ON maintenance_records(service_date DESC);

-- ============================================================
-- Entity 7: fuel_logs (Fuel Logs)
-- Fuel fill-up records managed by Financial Analyst.
-- ============================================================

CREATE TABLE fuel_logs (
  id         SERIAL PRIMARY KEY,
  vehicle_id INTEGER        NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  liters     DECIMAL(8, 2)  NOT NULL CHECK (liters > 0),
  cost       DECIMAL(10, 2) NOT NULL CHECK (cost > 0),
  odometer_km INTEGER,                       -- reading at fill-up
  fuel_type  VARCHAR(20)    NOT NULL DEFAULT 'Diesel',  -- Diesel, Petrol, CNG
  station    VARCHAR(150),                   -- fuel station name
  logged_at  DATE           NOT NULL DEFAULT CURRENT_DATE,
  logged_by  INTEGER        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,  -- financial_analyst
  created_at TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fuel_logs_vehicle_id ON fuel_logs(vehicle_id);
CREATE INDEX idx_fuel_logs_logged_at  ON fuel_logs(logged_at DESC);

-- ============================================================
-- Entity 8: expenses (Expenses)
-- Operational expense records managed by Financial Analyst.
-- ============================================================

CREATE TABLE expenses (
  id          SERIAL PRIMARY KEY,
  category    VARCHAR(100)   NOT NULL,  -- Toll, Repair, Insurance, Driver Allowance, Misc
  amount      DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  vehicle_id  INTEGER        REFERENCES vehicles(id) ON DELETE SET NULL,
  trip_id     INTEGER        REFERENCES trips(id)    ON DELETE SET NULL,
  description TEXT,
  logged_at   DATE           NOT NULL DEFAULT CURRENT_DATE,
  logged_by   INTEGER        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,  -- financial_analyst
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_expenses_vehicle_id ON expenses(vehicle_id);
CREATE INDEX idx_expenses_trip_id    ON expenses(trip_id);
CREATE INDEX idx_expenses_category   ON expenses(category);
CREATE INDEX idx_expenses_logged_at  ON expenses(logged_at DESC);

-- ============================================================
-- ============================================================
-- SEED DATA
-- ============================================================
-- ============================================================

-- ============================================================
-- Seed: users  (Password for all = "Password@123")
-- Hash generated with: node -e "require('bcryptjs').hash('Password@123',12).then(console.log)"
-- ============================================================

INSERT INTO users (name, email, password_hash, role) VALUES
  ('Arjun Mehta',  'fleet@transitops.in',    '$2b$12$8NyGkGObvDieJLKTvJloXOHQC71Dhwu7pM8Vc0Mbd9fGQvsMlMGTq', 'fleet_manager'),
  ('Riya Sharma',  'dispatch@transitops.in', '$2b$12$8NyGkGObvDieJLKTvJloXOHQC71Dhwu7pM8Vc0Mbd9fGQvsMlMGTq', 'dispatcher'),
  ('Karan Singh',  'safety@transitops.in',   '$2b$12$8NyGkGObvDieJLKTvJloXOHQC71Dhwu7pM8Vc0Mbd9fGQvsMlMGTq', 'safety_officer'),
  ('Priya Nair',   'finance@transitops.in',  '$2b$12$8NyGkGObvDieJLKTvJloXOHQC71Dhwu7pM8Vc0Mbd9fGQvsMlMGTq', 'financial_analyst');

-- ============================================================
-- Seed: vehicles  (Fleet Manager domain)
-- ============================================================

INSERT INTO vehicles (vehicle_id, make_model, type, year, registration_no, capacity_kg, status, avg_cost_per_km, total_trips, total_earnings) VALUES
  ('VAN-09',   'Tata Ace Gold',        'Van',   2021, 'MH14AB0009', 800,  'available',  8.50,  45,  340000),
  ('TRUCK-16', 'Ashok Leyland 3516',   'Truck', 2020, 'MH14CD0016', 5000, 'on_trip',   12.00,  62,  820000),
  ('BUS-03',   'Tata Starbus Ultra',   'Bus',   2022, 'MH14EF0003', 2000, 'available', 10.00,  38,  615000),
  ('VAN-12',   'Mahindra Supro',       'Van',   2019, 'MH14GH0012', 900,  'in_shop',    9.00,  29,  245000),
  ('TRUCK-21', 'BharatBenz 3528R',     'Truck', 2023, 'MH14IJ0021', 8000, 'available', 14.50,  71, 1260000);

-- ============================================================
-- Seed: drivers  (Safety Officer domain)
-- license_verified = TRUE for demo — real flow uses Setu DigiLocker
-- ============================================================

INSERT INTO drivers (name, contact, license_id, license_verified, license_expiry, category, status, trip_count, safety_score, registered_by, approved_by) VALUES
  ('Ravi Kumar',    '+91-9810001111', 'MH12AB1234', TRUE, '2029-06-30', 'LMV',  'available', 12, 96,
    (SELECT id FROM users WHERE email = 'safety@transitops.in'),
    (SELECT id FROM users WHERE email = 'fleet@transitops.in')),

  ('Amit Verma',    '+91-9820002222', 'DL05CD5678', TRUE, '2027-03-15', 'HMV',  'on_trip',   28, 88,
    (SELECT id FROM users WHERE email = 'safety@transitops.in'),
    (SELECT id FROM users WHERE email = 'fleet@transitops.in')),

  ('Suresh Pillai', '+91-9830003333', 'KA03EF9012', TRUE, '2028-11-20', 'HMV',  'available',  9, 100,
    (SELECT id FROM users WHERE email = 'safety@transitops.in'),
    (SELECT id FROM users WHERE email = 'fleet@transitops.in')),

  ('Deepak Joshi',  '+91-9840004444', 'UP32GH3456', TRUE, '2026-09-10', 'LMV',  'off_duty',   5,  74,
    (SELECT id FROM users WHERE email = 'safety@transitops.in'),
    (SELECT id FROM users WHERE email = 'fleet@transitops.in')),

  ('Manish Tiwari', '+91-9850005555', 'GJ07IJ7890', TRUE, '2030-01-05', 'HPMV', 'available', 34,  91,
    (SELECT id FROM users WHERE email = 'safety@transitops.in'),
    (SELECT id FROM users WHERE email = 'fleet@transitops.in')),

  ('Pooja Das',     '+91-9860006666', 'WB22KL2345', FALSE, NULL,         'LMV', 'off_duty',    0, 100,
    (SELECT id FROM users WHERE email = 'safety@transitops.in'),
    (SELECT id FROM users WHERE email = 'fleet@transitops.in')),

  ('Anil Desai',    '+91-9870007777', 'MH14XY9876', TRUE, '2031-08-12', 'LMV', 'pending_approval', 0, 100,
    (SELECT id FROM users WHERE email = 'safety@transitops.in'),
    NULL);

-- ============================================================
-- Seed: trips  (Dispatcher domain)
-- Uses subqueries so IDs never need to be hard-coded.
-- ============================================================

INSERT INTO trips (trip_code, vehicle_id, driver_id, dispatcher_id, origin, destination, status, cargo_weight_kg, distance_km, revenue, scheduled_at, completed_at) VALUES

  ('TRP-001',
    (SELECT id FROM vehicles WHERE vehicle_id = 'VAN-09'),
    (SELECT id FROM drivers  WHERE license_id = 'MH12AB1234'),
    (SELECT id FROM users    WHERE email = 'dispatch@transitops.in'),
    'Mumbai — Andheri Warehouse',    'Pune — Hinjewadi Industrial Park',
    'completed', 650.00, 148.00, 18500.00,
    NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days'),

  ('TRP-002',
    (SELECT id FROM vehicles WHERE vehicle_id = 'TRUCK-16'),
    (SELECT id FROM drivers  WHERE license_id = 'DL05CD5678'),
    (SELECT id FROM users    WHERE email = 'dispatch@transitops.in'),
    'Delhi — Naraina ICD',           'Jaipur — RIICO Industrial Area',
    'on_trip', 4200.00, NULL, 52000.00,
    NOW() - INTERVAL '1 day', NULL),

  ('TRP-003',
    (SELECT id FROM vehicles WHERE vehicle_id = 'BUS-03'),
    (SELECT id FROM drivers  WHERE license_id = 'KA03EF9012'),
    (SELECT id FROM users    WHERE email = 'dispatch@transitops.in'),
    'Bengaluru — Yeshwanthpur Depot', 'Chennai — Ambattur Industrial Estate',
    'scheduled', 1800.00, 350.00, 44000.00,
    NOW() + INTERVAL '1 day', NULL),

  ('TRP-004',
    (SELECT id FROM vehicles WHERE vehicle_id = 'VAN-09'),
    (SELECT id FROM drivers  WHERE license_id = 'MH12AB1234'),
    (SELECT id FROM users    WHERE email = 'dispatch@transitops.in'),
    'Pune — Chakan MIDC',            'Mumbai — JNPT Port Gate',
    'completed', 720.00, 125.00, 15600.00,
    NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days'),

  ('TRP-005',
    (SELECT id FROM vehicles WHERE vehicle_id = 'TRUCK-21'),
    (SELECT id FROM drivers  WHERE license_id = 'GJ07IJ7890'),
    (SELECT id FROM users    WHERE email = 'dispatch@transitops.in'),
    'Ahmedabad — Sanand Auto Cluster', 'Surat — Sachin Industrial Estate',
    'dispatched', 7500.00, 265.00, 72000.00,
    NOW(), NULL),

  ('TRP-006',
    (SELECT id FROM vehicles WHERE vehicle_id = 'BUS-03'),
    (SELECT id FROM drivers  WHERE license_id = 'KA03EF9012'),
    (SELECT id FROM users    WHERE email = 'dispatch@transitops.in'),
    'Chennai — Ambattur Industrial Estate', 'Coimbatore — Ganapathy SIDCO',
    'completed', 1650.00, 510.00, 58000.00,
    NOW() - INTERVAL '15 days', NOW() - INTERVAL '14 days'),

  ('TRP-007',
    (SELECT id FROM vehicles WHERE vehicle_id = 'TRUCK-21'),
    (SELECT id FROM drivers  WHERE license_id = 'MH12AB1234'),
    (SELECT id FROM users    WHERE email = 'dispatch@transitops.in'),
    'Mumbai — Bhiwandi Hub',          'Nagpur — Butibori Industrial Area',
    'cancelled', 0.00, NULL, 0.00,
    NOW() - INTERVAL '3 days', NULL);

-- ============================================================
-- Seed: maintenance_records  (Fleet Manager domain)
-- VAN-12 is in_shop — its record is in_progress.
-- ============================================================

INSERT INTO maintenance_records (vehicle_id, service_type, vendor, cost, status, service_date, notes, logged_by) VALUES

  ((SELECT id FROM vehicles WHERE vehicle_id = 'VAN-12'),
   'Full Engine Overhaul', 'Tata Authorised Service Centre, Pune',
   28500.00, 'in_progress', CURRENT_DATE - 2,
   'Major overhaul after 80,000 km. Expected 4-day downtime.',
   (SELECT id FROM users WHERE email = 'fleet@transitops.in')),

  ((SELECT id FROM vehicles WHERE vehicle_id = 'TRUCK-16'),
   'Tyre Rotation & Balancing', 'Bridgestone Xpress Wheel, Mumbai',
   4200.00, 'scheduled', CURRENT_DATE + 3,
   'All 6 tyres. Raise vehicle to workshop bay on return from current trip.',
   (SELECT id FROM users WHERE email = 'fleet@transitops.in')),

  ((SELECT id FROM vehicles WHERE vehicle_id = 'VAN-09'),
   'Oil & Filter Change', 'Quick Lube Express, Andheri',
   1800.00, 'completed', CURRENT_DATE - 8,
   'Synthetic 15W-40, oil filter and air filter replaced.',
   (SELECT id FROM users WHERE email = 'fleet@transitops.in')),

  ((SELECT id FROM vehicles WHERE vehicle_id = 'BUS-03'),
   'Brake Pad Replacement', 'SafeStop Auto Works, Bengaluru',
   9600.00, 'completed', CURRENT_DATE - 20,
   'Front and rear disc pads replaced. Rotors resurfaced.',
   (SELECT id FROM users WHERE email = 'fleet@transitops.in')),

  ((SELECT id FROM vehicles WHERE vehicle_id = 'TRUCK-21'),
   'Annual PUC & Fitness Certificate', 'RTO-authorised Testing Centre, Ahmedabad',
   3500.00, 'completed', CURRENT_DATE - 30,
   'Pollution and fitness certificates renewed. Valid for 1 year.',
   (SELECT id FROM users WHERE email = 'fleet@transitops.in')),

  ((SELECT id FROM vehicles WHERE vehicle_id = 'VAN-09'),
   'AC Compressor Service', 'Cool Auto A/C, Andheri',
   6200.00, 'scheduled', CURRENT_DATE + 7,
   'Driver reported weak cooling above 35 °C. Compressor inspection needed.',
   (SELECT id FROM users WHERE email = 'fleet@transitops.in'));

-- ============================================================
-- Seed: fuel_logs  (Financial Analyst domain)
-- ============================================================

INSERT INTO fuel_logs (vehicle_id, liters, cost, odometer_km, fuel_type, station, logged_at, logged_by) VALUES

  ((SELECT id FROM vehicles WHERE vehicle_id = 'VAN-09'),
   45.00, 4365.00, 62410, 'Diesel', 'HP Petrol Pump, Andheri East',
   CURRENT_DATE - 12,
   (SELECT id FROM users WHERE email = 'finance@transitops.in')),

  ((SELECT id FROM vehicles WHERE vehicle_id = 'TRUCK-16'),
   120.00, 11640.00, 98720, 'Diesel', 'IOCL Fuel Station, Gurgaon',
   CURRENT_DATE - 11,
   (SELECT id FROM users WHERE email = 'finance@transitops.in')),

  ((SELECT id FROM vehicles WHERE vehicle_id = 'BUS-03'),
   80.00, 7760.00, 54300, 'Diesel', 'BPCL Pump, Bengaluru',
   CURRENT_DATE - 16,
   (SELECT id FROM users WHERE email = 'finance@transitops.in')),

  ((SELECT id FROM vehicles WHERE vehicle_id = 'TRUCK-21'),
   150.00, 14550.00, 41850, 'Diesel', 'Indian Oil, Ahmedabad Highway',
   CURRENT_DATE - 1,
   (SELECT id FROM users WHERE email = 'finance@transitops.in')),

  ((SELECT id FROM vehicles WHERE vehicle_id = 'VAN-09'),
   40.00, 3880.00, 62800, 'Diesel', 'Shell Pump, Baner Rd',
   CURRENT_DATE - 5,
   (SELECT id FROM users WHERE email = 'finance@transitops.in')),

  ((SELECT id FROM vehicles WHERE vehicle_id = 'BUS-03'),
   95.00, 9215.00, 54800, 'Diesel', 'HP Petrol Pump, Hosur Rd',
   CURRENT_DATE - 2,
   (SELECT id FROM users WHERE email = 'finance@transitops.in')),

  ((SELECT id FROM vehicles WHERE vehicle_id = 'TRUCK-16'),
   135.00, 13095.00, 99100, 'Diesel', 'Reliance Fuel, Ajmer Rd',
   CURRENT_DATE,
   (SELECT id FROM users WHERE email = 'finance@transitops.in')),

  ((SELECT id FROM vehicles WHERE vehicle_id = 'TRUCK-21'),
   110.00, 10670.00, 42200, 'Diesel', 'IOCL Pump, Surat National Hwy',
   CURRENT_DATE,
   (SELECT id FROM users WHERE email = 'finance@transitops.in'));

-- ============================================================
-- Seed: expenses  (Financial Analyst domain)
-- Some are tied to specific trips, some are vehicle-level.
-- ============================================================

INSERT INTO expenses (category, amount, vehicle_id, trip_id, description, logged_at, logged_by) VALUES

  ('Toll',
   850.00,
   (SELECT id FROM vehicles WHERE vehicle_id = 'VAN-09'),
   (SELECT id FROM trips    WHERE trip_code  = 'TRP-001'),
   'Mumbai–Pune Expressway toll (both directions).',
   CURRENT_DATE - 9,
   (SELECT id FROM users WHERE email = 'finance@transitops.in')),

  ('Toll',
   2200.00,
   (SELECT id FROM vehicles WHERE vehicle_id = 'TRUCK-16'),
   (SELECT id FROM trips    WHERE trip_code  = 'TRP-002'),
   'Delhi–Jaipur NH-48 toll charges.',
   CURRENT_DATE,
   (SELECT id FROM users WHERE email = 'finance@transitops.in')),

  ('Driver Allowance',
   1500.00,
   NULL,
   (SELECT id FROM trips WHERE trip_code = 'TRP-001'),
   'Night halt and meal allowance — Ravi Kumar (TRP-001).',
   CURRENT_DATE - 9,
   (SELECT id FROM users WHERE email = 'finance@transitops.in')),

  ('Driver Allowance',
   1500.00,
   NULL,
   (SELECT id FROM trips WHERE trip_code = 'TRP-006'),
   'Night halt and meal allowance — Suresh Pillai (TRP-006).',
   CURRENT_DATE - 14,
   (SELECT id FROM users WHERE email = 'finance@transitops.in')),

  ('Repair',
   3200.00,
   (SELECT id FROM vehicles WHERE vehicle_id = 'VAN-09'),
   NULL,
   'Emergency puncture repair — front left tyre, NH-4.',
   CURRENT_DATE - 6,
   (SELECT id FROM users WHERE email = 'finance@transitops.in')),

  ('Insurance',
   42000.00,
   (SELECT id FROM vehicles WHERE vehicle_id = 'TRUCK-21'),
   NULL,
   'Annual comprehensive insurance premium renewal.',
   CURRENT_DATE - 30,
   (SELECT id FROM users WHERE email = 'finance@transitops.in')),

  ('Permit Fee',
   8500.00,
   (SELECT id FROM vehicles WHERE vehicle_id = 'TRUCK-16'),
   NULL,
   'Inter-state goods permit — Delhi to Rajasthan (annual).',
   CURRENT_DATE - 45,
   (SELECT id FROM users WHERE email = 'finance@transitops.in')),

  ('Misc',
   650.00,
   (SELECT id FROM vehicles WHERE vehicle_id = 'BUS-03'),
   (SELECT id FROM trips WHERE trip_code = 'TRP-003'),
   'Loading/unloading labour charges — Bengaluru depot.',
   CURRENT_DATE + 1,
   (SELECT id FROM users WHERE email = 'finance@transitops.in'));
