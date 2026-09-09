-- Assembleo bookings. Cloudflare D1 (SQLite).
--   npx wrangler d1 execute assembleo --remote --file=schema.sql

CREATE TABLE IF NOT EXISTS bookings (
  id                TEXT PRIMARY KEY,
  created_at        TEXT NOT NULL,
  type              TEXT NOT NULL,           -- residential | commercial
  service           TEXT NOT NULL,           -- assembly | delivery | moving | other
  name              TEXT NOT NULL,
  email             TEXT NOT NULL,
  phone             TEXT NOT NULL,
  company           TEXT,
  site_type         TEXT,
  unit_count        TEXT,
  address           TEXT NOT NULL,
  preferred_date    TEXT,
  preferred_window  TEXT,
  details           TEXT,
  consent           INTEGER NOT NULL DEFAULT 0,
  ip_country        TEXT,
  user_agent        TEXT,
  -- Workflow columns, for whoever handles the lead.
  status            TEXT NOT NULL DEFAULT 'new',   -- new | quoted | booked | done | lost
  quoted_amount     REAL,
  notes             TEXT
);

CREATE INDEX IF NOT EXISTS idx_bookings_created ON bookings (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_status  ON bookings (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_email   ON bookings (email);
