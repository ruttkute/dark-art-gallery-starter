-- dark-art-gallery-starter — D1 database schema
-- Run once: wrangler d1 execute your-gallery-db --file=_worker/schema.sql

-- Painting like counts
CREATE TABLE IF NOT EXISTS likes (
  slug    TEXT PRIMARY KEY,
  count   INTEGER NOT NULL DEFAULT 0
);

-- Sold paintings (populated on order creation)
-- INSERT OR IGNORE = idempotent — safe to run multiple times
CREATE TABLE IF NOT EXISTS sold_paintings (
  slug      TEXT PRIMARY KEY,
  order_ref TEXT,
  sold_at   INTEGER
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  order_ref      TEXT PRIMARY KEY,
  status         TEXT NOT NULL DEFAULT 'pending',
  total          REAL,
  customer_email TEXT,
  method         TEXT,  -- 'paypal' or 'banktransfer'
  created_at     INTEGER
);
