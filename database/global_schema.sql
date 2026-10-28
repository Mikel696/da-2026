-- ═══════════════════════════════════════════════════════════════
-- DA-2026 · Global Sync Schema — app_state (JSONB payload)
-- ─────────────────────────────────────────────────────────────
-- Run this in Supabase Dashboard → SQL Editor → New query
-- Project: mbuhlxypuvlxxylryjzi (Mikel696's Project, Free Tier)
-- Author:  Miguel Angel Barros Torres — 2026-04-03
-- Purpose: Generic key-value JSONB store for cross-device sync
--          of ALL localStorage modules (notes, finance, habits,
--          study, english, etc.)
-- ═══════════════════════════════════════════════════════════════


-- ══════════════════════════════════════════════════════════════
-- TABLE: app_state
-- One row per (user_id, store_key) — payload is the full
-- localStorage value stored as JSONB (array, object, or scalar).
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS app_state (
  user_id    UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_key  TEXT         NOT NULL,
  payload    JSONB        NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT now(),

  PRIMARY KEY (user_id, store_key)
);

-- ── Performance index ───────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_app_state_user
  ON app_state (user_id);

-- ── Row Level Security ──────────────────────────────────────
ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_state_select" ON app_state
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "app_state_insert" ON app_state
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "app_state_update" ON app_state
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "app_state_delete" ON app_state
  FOR DELETE USING (auth.uid() = user_id);


-- ══════════════════════════════════════════════════════════════
-- VERIFICATION: confirm table + RLS
-- ══════════════════════════════════════════════════════════════

SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'app_state'
ORDER BY tablename;
