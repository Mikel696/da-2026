/* ═══════════════════════════════════════════════════════════════
   DA-2026 · Supabase Client Singleton
   ─────────────────────────────────────────────────────────────
   Public anon key — safe to commit. RLS enforces access control.
   CDN: @supabase/supabase-js v2 (UMD build, loaded before this file)
═══════════════════════════════════════════════════════════════ */

const SUPA_URL  = 'https://mbuhlxypuvlxxylryjzi.supabase.co';
const SUPA_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1idWhseHlwdXZseHh5bHJ5anppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNTc0NTQsImV4cCI6MjA5MDYzMzQ1NH0.vO7DInzO4Cu1unQ9-KL65Z3ev1WQfCcj60ZtK4-GQn8';

const SB = window.supabase.createClient(SUPA_URL, SUPA_ANON, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

window.SB = SB;
