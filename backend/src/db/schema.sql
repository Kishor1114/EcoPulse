-- Carbon Footprint Awareness Platform - database schema
-- SQLite dialect. Designed to also run unmodified on PostgreSQL with
-- minor type substitutions (SERIAL <-> INTEGER PRIMARY KEY AUTOINCREMENT).

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- One row per footprint calculation a user submits. Raw inputs are kept
-- alongside the computed result so historical entries remain reproducible
-- even if emission factors are tuned later.
CREATE TABLE IF NOT EXISTS footprint_entries (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  car_km_per_week     REAL NOT NULL DEFAULT 0,
  public_km_per_week  REAL NOT NULL DEFAULT 0,
  short_flights_year  INTEGER NOT NULL DEFAULT 0,
  long_flights_year   INTEGER NOT NULL DEFAULT 0,
  electricity_kwh_mo  REAL NOT NULL DEFAULT 0,
  renewable_share_pct REAL NOT NULL DEFAULT 0,
  water_liters_day    REAL NOT NULL DEFAULT 0,
  diet_type           TEXT NOT NULL,
  food_waste_pct      REAL NOT NULL DEFAULT 0,
  waste_kg_week       REAL NOT NULL DEFAULT 0,
  recycling_share_pct REAL NOT NULL DEFAULT 0,
  shopping_spend_mo   REAL NOT NULL DEFAULT 0,
  breakdown_json      TEXT NOT NULL,
  total_monthly_kg    REAL NOT NULL,
  total_yearly_kg     REAL NOT NULL,
  created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_footprint_user_created
  ON footprint_entries(user_id, created_at);

CREATE TABLE IF NOT EXISTS goals (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  category      TEXT NOT NULL,
  goal_type     TEXT NOT NULL,           -- 'reduce_percent' | 'weekly_frequency' | 'absolute_target'
  target_value  REAL NOT NULL,
  baseline_value REAL NOT NULL DEFAULT 0,
  current_value REAL NOT NULL DEFAULT 0,
  unit          TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'active', -- 'active' | 'completed' | 'abandoned'
  start_date    TEXT NOT NULL DEFAULT (datetime('now')),
  target_date   TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_goals_user_status ON goals(user_id, status);

CREATE TABLE IF NOT EXISTS daily_action_log (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_key   TEXT NOT NULL,
  title        TEXT NOT NULL,
  category     TEXT NOT NULL,
  action_date  TEXT NOT NULL,            -- YYYY-MM-DD, one logical "day" per row per action
  completed    INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT,
  UNIQUE(user_id, action_key, action_date)
);
CREATE INDEX IF NOT EXISTS idx_daily_action_user_date ON daily_action_log(user_id, action_date);

CREATE TABLE IF NOT EXISTS gamification_state (
  user_id         INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  points          INTEGER NOT NULL DEFAULT 0,
  streak_count    INTEGER NOT NULL DEFAULT 0,
  last_active_date TEXT,
  badges_json     TEXT NOT NULL DEFAULT '[]',
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
