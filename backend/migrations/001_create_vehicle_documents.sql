-- TransitOps: Vehicle Documents Table
-- Migration: 001_create_vehicle_documents
-- Run date: auto-applied by lib/db.ts ensureDocumentsTable() on first API call

CREATE TABLE IF NOT EXISTS vehicle_documents (
  id          SERIAL PRIMARY KEY,
  vehicle_id  VARCHAR(50)  NOT NULL,
  doc_name    VARCHAR(255) NOT NULL,
  doc_type    VARCHAR(100) NOT NULL DEFAULT 'Other',
  ref_number  VARCHAR(255),
  expiry_date DATE,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast vehicle-level lookups
CREATE INDEX IF NOT EXISTS idx_vehicle_docs_vehicle_id
  ON vehicle_documents (vehicle_id);

-- Index to help Safety Officer query expiring documents
CREATE INDEX IF NOT EXISTS idx_vehicle_docs_expiry
  ON vehicle_documents (expiry_date)
  WHERE expiry_date IS NOT NULL;
