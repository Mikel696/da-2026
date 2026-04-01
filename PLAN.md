# PLAN: Supabase Integration — DA-2026
**Status:** AWAITING APPROVAL — Do NOT execute until user sends "Approved"
**Author:** Arquitecto Claude — 2026-04-01
**Scope:** Cloud sync + Auth via Supabase CDN. No Node.js, no bundlers, GitHub Pages compatible.

---

## 0. ARCHITECTURE AUDIT FINDINGS

### Current Persistence Stack (100% localStorage)

| Namespace | Key(s) | Owner Module | Shape |
|---|---|---|---|
| `da_vacancies` | `da_vacancies` | `jobs.js`, `apply.js` (duplicated VDB object) | `Vacancy[]` |
| `sys_tasks` | `sys_tasks` | `systems_logic.js` | `Task[]` |
| `sys_class_sessions` | `sys_class_sessions` | `systems_logic.js` | `ClassSession[]` |
| Sidebar stats | `sb_name`, `sb_pomo_*`, `sb_hours`, `sb_ratings`, `sb_start`, `sb_streak` | `index.js` | scalar / arrays |
| Job tracker meta | `jt8`, `jt_s8` | `jobs.js` | scalar / arrays |

**No IndexedDB found** — all storage is `localStorage.getItem/setItem` with `JSON.parse/stringify`.
**No auth** — zero user identity. All data is device-local.
**Static data** (`/data/*.json`) stays static — these are config/reference files, not user data.

### Key Constraints
- Pure frontend → must use Supabase JS CDN (UMD build)
- No build step, no npm, no React/Vue
- Deployed on GitHub Pages / Render Free Static
- Must work offline (localStorage stays as L1 cache)
- Row-Level Security (RLS) required — users only see their own data

---

## PHASE 1 — CDN Setup & Supabase Client Singleton

### 1.1 Add CDN script to all HTML shells

In every `*.html` file, add inside `<head>` before any app scripts:

```html
<!-- Supabase JS v2 — CDN UMD build -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
<script src="/js/supabase-client.js"></script>
```

**Affected files (14 HTML shells):**
`index.html`, `apply.html`, `jobs.html`, `english.html`, `ruta.html`, `tools.html`,
`news.html`, `prompts.html`, `goals.html`, `systems.html`, `accounting.html`,
`finance.html`, `notes.html`, `SistemaDA2026_Tactico.html`

### 1.2 Create `frontend/js/supabase-client.js`

This is the **only place** the Supabase URL and anon key live. The anon key is safe to expose — it's public by design (RLS enforces access control).

```javascript
// frontend/js/supabase-client.js
// Supabase project credentials (public anon key — safe to commit)
const SUPA_URL  = 'https://YOUR_PROJECT_REF.supabase.co';
const SUPA_ANON = 'YOUR_ANON_PUBLIC_KEY';

const supabase = window.supabase.createClient(SUPA_URL, SUPA_ANON, {
  auth: {
    persistSession: true,          // stores session in localStorage automatically
    autoRefreshToken: true,
    detectSessionInUrl: true       // handles OAuth / magic link redirects
  }
});

// Export globally — all modules read window.supabase or the `supabase` const
window.SB = supabase;
```

**Why `window.SB`?** All modules are loaded as plain `<script>` tags (no ES modules).
Using a short global alias avoids polluting `window.supabase` (already used by the CDN lib).

---

## PHASE 2 — Auth Module (Login / Signup UI)

### 2.1 Create `frontend/js/auth.js`

The Auth module manages the full session lifecycle. It adds a floating auth widget to every page without modifying individual HTML shells heavily.

```javascript
// frontend/js/auth.js — Auth Module (Vanilla JS, no framework)
// Injected into every page via <script src="/js/auth.js"></script>

const AUTH = (() => {
  // ── State ──
  let _user = null;

  // ── Render auth widget ──
  function init() {
    _injectStyles();
    _injectWidget();
    SB.auth.onAuthStateChange((event, session) => {
      _user = session?.user ?? null;
      _renderWidget();
      if (event === 'SIGNED_IN')  window.dispatchEvent(new CustomEvent('sb:signed_in',  { detail: _user }));
      if (event === 'SIGNED_OUT') window.dispatchEvent(new CustomEvent('sb:signed_out'));
    });
  }

  function getUser()   { return _user; }
  function getUserId() { return _user?.id ?? null; }
  function isLoggedIn(){ return !!_user; }

  // ── Sign up / Sign in ──
  async function signUp(email, password) {
    const { data, error } = await SB.auth.signUp({ email, password });
    return { data, error };
  }

  async function signIn(email, password) {
    const { data, error } = await SB.auth.signInWithPassword({ email, password });
    return { data, error };
  }

  async function signOut() {
    await SB.auth.signOut();
  }

  // ── Floating widget (top-right corner) ──
  function _injectWidget() {
    const el = document.createElement('div');
    el.id = 'sb-auth-widget';
    document.body.appendChild(el);
    _renderWidget();
  }

  function _renderWidget() {
    const el = document.getElementById('sb-auth-widget');
    if (!el) return;
    if (_user) {
      el.innerHTML = `
        <span class="sb-email">${_user.email}</span>
        <button onclick="AUTH.signOut()" class="sb-btn-out">Salir</button>
      `;
    } else {
      el.innerHTML = `<button onclick="AUTH.openModal()" class="sb-btn-in">☁ Sync</button>`;
    }
  }

  // ── Modal: Login / Signup form ──
  function openModal() {
    let modal = document.getElementById('sb-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'sb-modal';
      modal.innerHTML = `
        <div class="sb-backdrop" onclick="AUTH.closeModal()"></div>
        <div class="sb-box">
          <h3>☁ Cloud Sync</h3>
          <p class="sb-sub">Sincroniza tus datos en todos los dispositivos</p>
          <input id="sb-email"    type="email"    placeholder="Email" autocomplete="email"/>
          <input id="sb-password" type="password" placeholder="Contraseña (min. 6 chars)" autocomplete="current-password"/>
          <div class="sb-actions">
            <button onclick="AUTH._submit('in')">Entrar</button>
            <button onclick="AUTH._submit('up')" class="sb-secondary">Registrarme</button>
          </div>
          <p id="sb-msg" class="sb-msg"></p>
          <button onclick="AUTH.closeModal()" class="sb-close">✕</button>
        </div>
      `;
      document.body.appendChild(modal);
    }
    modal.style.display = 'flex';
  }

  function closeModal() {
    const modal = document.getElementById('sb-modal');
    if (modal) modal.style.display = 'none';
  }

  async function _submit(mode) {
    const email    = document.getElementById('sb-email')?.value?.trim();
    const password = document.getElementById('sb-password')?.value;
    const msg      = document.getElementById('sb-msg');
    if (!email || !password) { msg.textContent = 'Completa todos los campos'; return; }
    msg.textContent = '...';
    const fn = mode === 'in' ? signIn : signUp;
    const { error } = await fn(email, password);
    if (error) { msg.textContent = error.message; return; }
    msg.textContent = mode === 'up' ? 'Cuenta creada. Revisa tu email.' : '¡Sesión iniciada!';
    if (mode === 'in') setTimeout(closeModal, 800);
  }

  function _injectStyles() { /* CSS injected dynamically — see Phase 2.2 */ }

  return { init, getUser, getUserId, isLoggedIn, signUp, signIn, signOut, openModal, closeModal, _submit };
})();

document.addEventListener('DOMContentLoaded', AUTH.init);
```

### 2.2 Auth CSS (injected by `auth.js` or added to a shared `css/auth.css`)

Styles for the widget and modal — dark theme matching the app's design system (`--vi`, `--em`, `--cy`):

```css
#sb-auth-widget {
  position: fixed; top: 12px; right: 16px; z-index: 9999;
  display: flex; gap: 8px; align-items: center;
}
.sb-btn-in { background: var(--vi,#7c3aed); color: #fff; border: none; border-radius: 6px; padding: 6px 12px; cursor: pointer; font-size: 12px; }
.sb-btn-out { background: transparent; color: var(--cy,#06b6d4); border: 1px solid currentColor; border-radius: 6px; padding: 4px 10px; cursor: pointer; font-size: 11px; }
.sb-email { font-size: 11px; color: #888; }

#sb-modal { display: none; position: fixed; inset: 0; z-index: 10000; align-items: center; justify-content: center; }
.sb-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,.6); }
.sb-box { position: relative; background: #111; border: 1px solid #2a2a2a; border-radius: 12px; padding: 32px; width: min(380px,90vw); display: flex; flex-direction: column; gap: 12px; }
.sb-box h3 { margin: 0; color: #fff; }
.sb-box input { background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 10px 14px; color: #fff; font-size: 14px; outline: none; }
.sb-actions { display: flex; gap: 8px; }
.sb-actions button { flex: 1; padding: 10px; border: none; border-radius: 8px; background: var(--vi,#7c3aed); color: #fff; cursor: pointer; font-size: 14px; }
.sb-secondary { background: #222 !important; border: 1px solid #444 !important; }
.sb-msg { font-size: 12px; color: var(--em,#10b981); min-height: 16px; margin: 0; }
.sb-close { position: absolute; top: 12px; right: 12px; background: none; border: none; color: #666; font-size: 18px; cursor: pointer; }
```

### 2.3 HTML addition per page (one line each)

```html
<!-- After supabase-client.js -->
<script src="/js/auth.js"></script>
```

---

## PHASE 3 — Data Layer Refactor (localStorage → localStorage + Supabase)

### Strategy: Offline-First Write-Through

```
WRITE:  UI → localStorage (instant, sync) → Supabase (async, background)
READ:   on mount: localStorage (immediate render) + Supabase fetch (merge, re-render if newer)
DELETE: localStorage (instant) → Supabase (async delete)
```

This keeps the **UI State-Driven Rendering** intact — the UI always has data to render immediately. Cloud sync is a background process.

### 3.1 Create `frontend/js/cloud-sync.js` — Generic Sync Layer

```javascript
// frontend/js/cloud-sync.js
// Generic upsert/fetch/delete wrapper. All modules call this, not Supabase directly.

const CLOUD = (() => {
  const TABLES = {
    vacancies:      'vacancies',
    sys_tasks:      'sys_tasks',
    class_sessions: 'class_sessions',
    user_prefs:     'user_prefs',
  };

  function _uid() { return window.AUTH?.getUserId() ?? null; }
  function _ready() { return !!window.SB && !!_uid(); }

  // ── UPSERT (create or update) ──
  async function push(table, record) {
    if (!_ready()) return { error: 'not_authenticated' };
    const { error } = await SB
      .from(TABLES[table])
      .upsert({ ...record, user_id: _uid(), updated_at: new Date().toISOString() },
               { onConflict: 'id,user_id' });
    return { error };
  }

  // ── FETCH ALL for current user ──
  async function pull(table) {
    if (!_ready()) return { data: null, error: 'not_authenticated' };
    const { data, error } = await SB
      .from(TABLES[table])
      .select('*')
      .eq('user_id', _uid())
      .order('updated_at', { ascending: false });
    return { data, error };
  }

  // ── DELETE ──
  async function remove(table, id) {
    if (!_ready()) return;
    await SB.from(TABLES[table]).delete().eq('id', id).eq('user_id', _uid());
  }

  // ── FULL SYNC: pull cloud → merge into localStorage ──
  async function syncDown(table, localKey, mergeStrategy = 'cloud_wins') {
    const { data, error } = await pull(table);
    if (error || !data) return;
    if (mergeStrategy === 'cloud_wins') {
      localStorage.setItem(localKey, JSON.stringify(data));
    } else {
      // 'latest_wins': merge by updated_at
      let local = [];
      try { local = JSON.parse(localStorage.getItem(localKey) || '[]'); } catch {}
      const merged = _mergeByUpdatedAt(local, data);
      localStorage.setItem(localKey, JSON.stringify(merged));
    }
    return data;
  }

  // ── FULL SYNC: push localStorage → cloud ──
  async function syncUp(table, localKey) {
    let local = [];
    try { local = JSON.parse(localStorage.getItem(localKey) || '[]'); } catch { return; }
    for (const record of local) { await push(table, record); }
  }

  function _mergeByUpdatedAt(local, cloud) {
    const map = new Map();
    [...local, ...cloud].forEach(r => {
      const existing = map.get(r.id);
      if (!existing || new Date(r.updated_at) > new Date(existing.updated_at)) map.set(r.id, r);
    });
    return [...map.values()];
  }

  return { push, pull, remove, syncDown, syncUp };
})();
```

### 3.2 Augment VDB (jobs.js and apply.js) — Add Cloud Push

Current VDB pattern (both files identical):
```javascript
// BEFORE — pure localStorage
save(v){ ... localStorage.setItem(this.KEY, JSON.stringify(all)); return v; }
```

Augmented VDB (additive, backwards-compatible):
```javascript
// AFTER — write-through
save(v) {
  const all = this.getAll();
  const idx = all.findIndex(x => x.id === v.id);
  if (idx >= 0) all[idx] = v; else all.push(v);
  localStorage.setItem(this.KEY, JSON.stringify(all));
  // Cloud push (async, non-blocking)
  if (window.CLOUD) CLOUD.push('vacancies', { ...v, updated_at: new Date().toISOString() });
  return v;
},
del(id) {
  localStorage.setItem(this.KEY, JSON.stringify(this.getAll().filter(x => x.id !== id)));
  if (window.CLOUD) CLOUD.remove('vacancies', id);
},
// NEW: call on page load after auth
async syncFromCloud() {
  const data = await CLOUD.syncDown('vacancies', this.KEY, 'latest_wins');
  if (data) renderAll(); // triggers existing UI re-render
}
```

### 3.3 Augment SYS tasks (systems_logic.js)

Same pattern — add cloud push inside `saveTasks()`:
```javascript
function saveTasks(t) {
  db.set('tasks', t);
  if (window.CLOUD) t.forEach(task => CLOUD.push('sys_tasks', task));
}
```

### 3.4 Trigger sync on auth state change (in each module's init)

```javascript
// In jobs.js and apply.js — listen for auth
window.addEventListener('sb:signed_in', async () => {
  await VDB.syncFromCloud();
});
```

---

## PHASE 4 — PostgreSQL Schema (Supabase)

Run these SQL statements in the Supabase SQL editor (Dashboard → SQL Editor → New query).

### 4.1 `vacancies` table (mirrors `da_vacancies`)

```sql
-- Vacancy DB (Job Tracker)
CREATE TABLE vacancies (
  id           BIGINT PRIMARY KEY,          -- matches localStorage id (Date.now())
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  company      TEXT,
  location     TEXT,
  type         TEXT DEFAULT 'full_time',
  salary       NUMERIC,
  currency     TEXT DEFAULT 'USD',
  url          TEXT,
  source       TEXT,
  status       TEXT DEFAULT 'found',        -- found/applied/interview/offer/rejected
  column       TEXT DEFAULT 'saved',        -- kanban column
  priority     TEXT DEFAULT 'medium',
  notes        TEXT,
  tags         JSONB DEFAULT '[]',
  found_date   DATE,
  applied_date DATE,
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE vacancies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vacancies: users own their rows"
  ON vacancies FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for fast user-filtered queries
CREATE INDEX idx_vacancies_user ON vacancies(user_id, updated_at DESC);
```

### 4.2 `sys_tasks` table (mirrors `sys_tasks`)

```sql
CREATE TABLE sys_tasks (
  id           TEXT PRIMARY KEY,            -- matches localStorage task id (string UUID or timestamp)
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text         TEXT NOT NULL,
  done         BOOLEAN DEFAULT FALSE,
  due          DATE,
  priority     TEXT DEFAULT 'normal',
  subject_id   TEXT,                        -- links to materia id (e.g. 'ing_web')
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sys_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tasks: users own their rows"
  ON sys_tasks FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### 4.3 `class_sessions` table (mirrors `sys_class_sessions` — new Tab 7)

```sql
CREATE TABLE class_sessions (
  id           TEXT PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject      TEXT,
  url          TEXT,
  title        TEXT,
  summary      TEXT,
  assignments  JSONB DEFAULT '[]',          -- array of {task, where, how, evidence, deadline}
  status       TEXT DEFAULT 'pending',      -- pending/in_progress/done
  analyzed_at  TIMESTAMPTZ,
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE class_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "class_sessions: users own their rows"
  ON class_sessions FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### 4.4 `user_prefs` table (mirrors `sb_*` sidebar stats in index.js)

```sql
CREATE TABLE user_prefs (
  user_id       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT,
  pomo_total    INT DEFAULT 0,
  hours_total   INT DEFAULT 0,
  streak        INT DEFAULT 0,
  start_date    DATE,
  ratings       JSONB DEFAULT '[]',
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_prefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prefs: user owns their row"
  ON user_prefs FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

## PHASE 5 — Deployment Configuration

### 5.1 Supabase Dashboard Setup (one-time, done in browser)

1. Create project at `supabase.com` → free tier
2. Settings → API → copy `Project URL` and `anon/public` key
3. Authentication → Settings → Site URL: `https://YOUR_GITHUB_USERNAME.github.io/da-2026`
4. Authentication → Settings → Redirect URLs: add `http://localhost:3456`, `https://YOUR_GITHUB_USERNAME.github.io`
5. Run Phase 4 SQL in SQL Editor

### 5.2 GitHub Pages (existing static serving)

No build step needed — GitHub Pages serves static files directly. The Supabase CDN script loads at runtime.

**`.github/workflows/` not needed** — push to `main` → GitHub Pages deploys automatically (if Pages is configured to serve from `main/frontend/` or root).

### 5.3 Environment config

Since there's no build step, the Supabase URL and anon key go directly in `js/supabase-client.js`.
The anon key is **designed to be public** — all access control is enforced by PostgreSQL RLS policies.

---

## EXECUTION ORDER (Phases in sequence)

```
PHASE 1 ─── supabase-client.js ─────────────────── (1 new file, 14 HTML edits)
PHASE 2 ─── auth.js ────────────────────────────── (1 new file, 14 HTML edits)
PHASE 3 ─── cloud-sync.js ──────────────────────── (1 new file)
         └── VDB augmentation ──────────────────── (edit jobs.js + apply.js)
         └── SYS tasks augmentation ─────────────── (edit systems_logic.js)
PHASE 4 ─── SQL schema in Supabase dashboard ───── (manual, one-time)
PHASE 5 ─── Supabase project config (dashboard) ── (manual, one-time)
         └── Update supabase-client.js credentials  (fill URL + anon key)
```

**Total new files:** 3 (`supabase-client.js`, `auth.js`, `cloud-sync.js`)
**Total edited files:** `jobs.js`, `apply.js`, `systems_logic.js` (additive only — no breaking changes)
**HTML edits:** 2 `<script>` lines added to each of 14 HTML files

---

## RISK REGISTER

| Risk | Mitigation |
|---|---|
| Offline use (no internet) | localStorage always present — cloud sync is additive, never blocking |
| User not logged in | All existing code works without auth; `CLOUD.push()` is a no-op if `!_ready()` |
| Data conflict (two devices edit same vacancy) | `latest_wins` merge strategy by `updated_at` |
| Supabase free tier limits (500MB, 50K users) | Single-user app — limits are orders of magnitude above our needs |
| Anon key exposure | Correct posture — Supabase anon key is public; RLS is the security layer |
| CDN unavailable | App degrades gracefully to localStorage-only mode |

---

*Awaiting "Approved" to begin Phase 1 code generation.*
