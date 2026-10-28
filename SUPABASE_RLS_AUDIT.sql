-- ═══════════════════════════════════════════════════════════════
-- DA-2026 · Auditoría de seguridad RLS — Supabase
-- ─────────────────────────────────────────────────────────────
-- Cómo usar:  Supabase Dashboard → SQL Editor → New query → pegar TODO → Run
-- Devuelve 4 bloques. Pegame el resultado y te digo si estás seguro.
--
-- QUÉ DEBE DAR (resumen):
--   #1 rls_enabled = true en LAS 5 tablas (si alguna da false → 🔴 tabla abierta)
--   #2 cada tabla con políticas que filtren por (auth.uid() = user_id)
--      filtro = "true" o sin user_id  → 🔴 cualquiera lee/escribe todo
--   #3 bucket 'attachments' con public = false
--   #4 políticas del bucket que filtren por user_id (carpeta por usuario)
-- ═══════════════════════════════════════════════════════════════

-- ── #1 · ¿RLS activo en cada tabla? ──────────────────────────────
select
  c.relname              as tabla,
  c.relrowsecurity       as rls_enabled,      -- DEBE ser true en las 5
  c.relforcerowsecurity  as rls_forzado
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('app_state','vacancies','sys_tasks','class_sessions','user_prefs')
order by c.relname;

-- ── #2 · Políticas por tabla (qué permite cada una y con qué filtro) ──
select
  tablename   as tabla,
  policyname  as politica,
  cmd         as operacion,        -- SELECT/INSERT/UPDATE/DELETE/ALL
  roles,
  qual        as filtro_using,     -- DEBE referir (auth.uid() = user_id)
  with_check  as filtro_with_check -- en INSERT/UPDATE también
from pg_policies
where schemaname = 'public'
  and tablename in ('app_state','vacancies','sys_tasks','class_sessions','user_prefs')
order by tablename, cmd;

-- ── #3 · Storage: ¿el bucket attachments es privado? ─────────────
select id, name, public as es_publico   -- es_publico DEBE ser false
from storage.buckets
where id = 'attachments';

-- ── #4 · Políticas del bucket attachments ────────────────────────
select
  policyname as politica,
  cmd        as operacion,
  roles,
  qual       as filtro_using,
  with_check as filtro_with_check
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
order by policyname;
