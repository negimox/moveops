-- Phase 1 Migrations
-- Vehicles table
ALTER TABLE vehicles ADD COLUMN odometer INTEGER NOT NULL DEFAULT 0;
ALTER TABLE vehicles ADD COLUMN acquisition_cost DECIMAL(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE vehicles DROP COLUMN IF EXISTS avg_cost_per_km;

-- Drivers table
ALTER TABLE drivers RENAME COLUMN category TO license_category;
ALTER TABLE drivers ADD COLUMN trip_completion_pct INTEGER NOT NULL DEFAULT 100;

-- Trips table
ALTER TABLE trips ADD COLUMN planned_distance_km DECIMAL(10, 2);

-- Fuel Logs table
ALTER TABLE fuel_logs RENAME COLUMN logged_at TO date;

-- Expenses table
ALTER TABLE expenses RENAME COLUMN category TO type;
