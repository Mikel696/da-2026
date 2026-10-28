-- ═══════════════════════════════════════════════════════════════
-- DA-2026 · Supabase PostgreSQL Schema
-- ─────────────────────────────────────────────────────────────
-- Run this entire file in Supabase Dashboard → SQL Editor → New query
-- Project: mbuhlxypuvlxxylryjzi (Mikel696's Project, Free Tier)
-- Author:  Miguel Angel Barros Torres — 2026-04-01
-- ═══════════════════════════════════════════════════════════════


-- ══════════════════════════════════════════════════════════════
-- TABLE 1: vacancies
-- Mirrors localStorage key: da_vacancies
-- Source modules: jobs.js (VDB), apply.js (VDB)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS vacancies (
  id            TEXT         NOT NULL,
  user_id       UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Core fields (set by both apply.js saveToTracker and Chrome MCP injection)
  title         TEXT,                             -- role name or vacancy title
  company       TEXT,
  role          TEXT,                             -- same as title in some flows
  location      TEXT,
  type          TEXT         DEFAULT 'full_time', -- full_time, part_time, contract, freelance
  url           TEXT,                             -- job posting URL
  jd            TEXT,                             -- full job description text
  source        TEXT,                             -- linkedin, indeed, remotive, computrabajo, etc.

  -- Pipeline / Status
  status        TEXT         DEFAULT 'saved',     -- saved, applied, interview, offer, rejected
  "column"      TEXT         DEFAULT 'saved',     -- kanban column (mirrors status for drag-and-drop)
  priority      TEXT         DEFAULT 'medium',    -- low, medium, high
  notes         TEXT,

  -- Compensation
  salary        TEXT,                             -- raw salary string (e.g. "$1500/mo", "50K-70K")
  salary_input  TEXT,                             -- user's salary input from apply.html
  currency      TEXT         DEFAULT 'USD',

  -- ATS / Profiling (from apply.js analysis engine)
  match         JSONB        DEFAULT '{}',        -- {focusArea, atsScore, keywords[], skills[]}
  profile       JSONB        DEFAULT '{}',        -- {tone, timezone, urgency, cultureFit, salaryRange}
  focus_area    TEXT,                             -- AP, AR, Data Analyst, etc.
  tags          JSONB        DEFAULT '[]',        -- ["AP", "remote", "LATAM", "NetSuite"]

  -- Dates
  ts            BIGINT,                           -- original creation timestamp (Date.now())
  found_date    TEXT,                             -- ISO date string when found
  applied_date  TEXT,                             -- ISO date string when applied
  follow_up_date TEXT,                            -- ISO date string for follow-up reminder

  -- Sync metadata
  updated_at    TIMESTAMPTZ  DEFAULT now(),
  created_at    TIMESTAMPTZ  DEFAULT now(),

  PRIMARY KEY (id, user_id)
);

-- RLS
ALTER TABLE vacancies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vacancies_select" ON vacancies
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "vacancies_insert" ON vacancies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "vacancies_update" ON vacancies
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "vacancies_delete" ON vacancies
  FOR DELETE USING (auth.uid() = user_id);

-- Performance index
CREATE INDEX IF NOT EXISTS idx_vacancies_user_updated
  ON vacancies (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_vacancies_status
  ON vacancies (user_id, status);


-- ══════════════════════════════════════════════════════════════
-- TABLE 2: sys_tasks
-- Mirrors localStorage key: sys_tasks
-- Source module: systems_logic.js (SYS IIFE)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS sys_tasks (
  id            TEXT         NOT NULL,
  user_id       UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Task fields (exact shape from systems_logic.js addTask)
  text          TEXT         NOT NULL,
  subj          TEXT         DEFAULT 'general',   -- subject id: mat_especiales, ing_web, etc.
  priority      TEXT         DEFAULT 'p2',         -- p1 (urgent), p2 (normal), p3 (low)
  due           TEXT,                              -- ISO date string (YYYY-MM-DD)
  done          BOOLEAN      DEFAULT false,
  created       TEXT,                              -- ISO date string from todayStr()

  -- Sync metadata
  updated_at    TIMESTAMPTZ  DEFAULT now(),
  created_at    TIMESTAMPTZ  DEFAULT now(),

  PRIMARY KEY (id, user_id)
);

-- RLS
ALTER TABLE sys_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sys_tasks_select" ON sys_tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "sys_tasks_insert" ON sys_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sys_tasks_update" ON sys_tasks
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sys_tasks_delete" ON sys_tasks
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_sys_tasks_user_updated
  ON sys_tasks (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_sys_tasks_subj
  ON sys_tasks (user_id, subj);


-- ══════════════════════════════════════════════════════════════
-- TABLE 3: class_sessions
-- Mirrors localStorage key: sys_class_sessions
-- Source module: systems_logic.js (Tab 7 — Clases Perdidas)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS class_sessions (
  id            TEXT         NOT NULL,
  user_id       UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Session fields (exact shape from injectClassSession)
  url           TEXT,                              -- video/class URL
  subject_id    TEXT         DEFAULT 'general',    -- links to SUBJECTS id
  subject_name  TEXT,
  date          TEXT,                              -- ISO date (YYYY-MM-DD)
  title         TEXT,
  summary       TEXT,                              -- Claude-generated summary
  topics        JSONB        DEFAULT '[]',         -- ["Tema 1", "Tema 2"]
  assignments   JSONB        DEFAULT '[]',         -- [{title, desc, due_date, submit_where, submit_how, evidence_type, moodle_url}]
  resources     JSONB        DEFAULT '[]',         -- [{name, url}]
  status        TEXT         DEFAULT 'pending',    -- pending, in_progress, done
  saved_at      TEXT,                              -- ISO datetime from injectClassSession
  analyzed_at   TIMESTAMPTZ,

  -- Sync metadata
  updated_at    TIMESTAMPTZ  DEFAULT now(),
  created_at    TIMESTAMPTZ  DEFAULT now(),

  PRIMARY KEY (id, user_id)
);

-- RLS
ALTER TABLE class_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "class_sessions_select" ON class_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "class_sessions_insert" ON class_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "class_sessions_update" ON class_sessions
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "class_sessions_delete" ON class_sessions
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_class_sessions_user
  ON class_sessions (user_id, updated_at DESC);


-- ══════════════════════════════════════════════════════════════
-- TABLE 4: user_prefs
-- Mirrors localStorage keys: sb_name, sb_pomo_*, sb_hours, sb_ratings, sb_start, sb_streak
-- Source module: index.js (sidebar stats)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_prefs (
  user_id       UUID         PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Profile
  display_name  TEXT,

  -- Productivity stats (from index.js sidebar)
  pomo_total    INTEGER      DEFAULT 0,
  hours_total   INTEGER      DEFAULT 0,
  streak        INTEGER      DEFAULT 0,
  start_date    TEXT,                              -- ISO date string
  ratings       JSONB        DEFAULT '[]',         -- [{v: 1-5, d: ISO datetime}]

  -- Sync metadata
  updated_at    TIMESTAMPTZ  DEFAULT now()
);

-- RLS
ALTER TABLE user_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_prefs_select" ON user_prefs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_prefs_insert" ON user_prefs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_prefs_update" ON user_prefs
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_prefs_delete" ON user_prefs
  FOR DELETE USING (auth.uid() = user_id);


-- ══════════════════════════════════════════════════════════════
-- VERIFICATION: list all tables and their RLS status
-- ══════════════════════════════════════════════════════════════

SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('vacancies', 'sys_tasks', 'class_sessions', 'user_prefs')
ORDER BY tablename;
