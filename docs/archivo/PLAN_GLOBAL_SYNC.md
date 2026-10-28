# PLAN_GLOBAL_SYNC.md — Universal Cloud Synchronization

> **Status:** DRAFT — Awaiting human operator "Approved" before implementation.
> **Goal:** Expand cloud sync from vacancies-only → ALL 11 modules.

---

## 1. localStorage Key Inventory (32 keys)

### A. User-generated data — MUST sync (13 keys)

| Key               | Module      | Shape         | Notes                         |
|--------------------|-------------|---------------|-------------------------------|
| `da_vacancies`     | Job Tracker | Array<Obj>    | Already synced via `vacancies` table |
| `sys_tasks`        | 10-SYS      | Array<Obj>    | Already synced via `sys_tasks` table |
| `sb_goals`         | Super Brain | Array<Obj>    | Weekly goals                  |
| `sb_habits`        | Super Brain | Array<Obj>    | Habit definitions             |
| `sb_reviews`       | Super Brain | Array<Obj>    | Weekly reviews                |
| `sb_notes2`        | Super Brain | Array<Obj>    | Notes v2                      |
| `sb_ratings`       | Super Brain | Array<Obj>    | Daily ratings                 |
| `fin_MONTH`        | Finance     | Array<Obj>    | Dynamic key per month (e.g. `fin_2026-04`) |
| `eng_notes`        | English     | Array<Obj>    | Study notes                   |
| `eng_srs_deck`     | English     | Array<Obj>    | Spaced repetition cards       |
| `plab_h`           | Plan B      | Array<Obj>    | Habit tracking                |
| `ruta_log5`        | Ruta        | Array<Obj>    | Learning log entries          |
| `news_saved`       | News        | Array<Obj>    | Saved articles                |

### B. Complex state objects — SYNC as opaque JSONB blobs (4 keys)

| Key               | Module      | Shape         | Notes                         |
|--------------------|-------------|---------------|-------------------------------|
| `e4`               | English     | Object        | English dojo state            |
| `ruta5`            | Ruta        | Object        | Learning route config         |
| `dojo_stats`       | Dojo        | Object        | Stats accumulator             |
| `excel_dojo`       | Excel Dojo  | Object        | Exercise state                |

### C. Config/preferences — SYNC (small, useful cross-device) (9 keys)

| Key                 | Module      | Shape   | Notes                        |
|----------------------|-------------|---------|------------------------------|
| `jt_profile`         | Job Tracker | String  | Active profile toggle        |
| `jt_form_expanded`   | Job Tracker | Boolean | Form collapsed state         |
| `sb_name`            | Super Brain | String  | User display name            |
| `sb_streak`          | Super Brain | Number  | Streak counter               |
| `sb_start`           | Super Brain | String  | Start date                   |
| `sb_last`            | Super Brain | String  | Last activity date           |
| `sb_hours`           | Super Brain | Number  | Total hours                  |
| `sb_pomo_total`      | Super Brain | Number  | Pomodoro total               |
| `sb_pomo_YYYY-MM-DD` | Super Brain | Number  | Dynamic key per day          |

### D. Cache — SKIP (1 key)

| Key            | Module | Notes                          |
|----------------|--------|--------------------------------|
| `news_cache`   | News   | Ephemeral API cache, no sync   |

### E. Already synced via dedicated tables — NO CHANGE (2 keys)

| Key               | Table            | Notes                     |
|--------------------|-----------------|---------------------------|
| `da_vacancies`     | `vacancies`      | Existing schema + field mapping |
| `sys_tasks`        | `sys_tasks`      | Existing schema           |

---

## 2. Database Schema: `app_state` Table

A single generic JSONB table replaces the need for per-module tables.

**Existing dedicated tables (`vacancies`, `sys_tasks`, `class_sessions`, `user_prefs`) remain unchanged.** The new `app_state` table handles everything else.

### Design: Composite Key `(user_id, store_key)`

Each localStorage key maps to exactly ONE row per user. The entire value (array or object) is stored as a JSONB blob in `payload`.

```sql
-- ════════════════════════════════════════════════════════════════
-- app_state: generic JSONB store for all module data
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS app_state (
  user_id    UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_key  TEXT    NOT NULL,          -- localStorage key (e.g. 'sb_goals', 'fin_2026-04')
  payload    JSONB   NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (user_id, store_key)
);

-- Index for fast user-scoped queries
CREATE INDEX IF NOT EXISTS idx_app_state_user ON app_state (user_id);

-- ── Row Level Security ──────────────────────────────────────────
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
```

### Why one row per key (not one row per record)?

- **Simplicity:** No record-level IDs, no merge conflicts, no field mapping.
- **Universality:** Works for arrays, objects, scalars — any shape stored in localStorage.
- **Performance:** One `SELECT` + one `UPSERT` per key per sync cycle (max ~25 rows per user).
- **Dynamic keys:** `fin_2026-04` and `sb_pomo_2026-04-03` naturally map to unique `store_key` values.

### Trade-off: Merge granularity

Since the entire array/object is stored as one blob, the merge strategy is **last-write-wins at the key level** (using `updated_at`). This is acceptable because:
1. The app is single-user (one person, multiple devices).
2. Concurrent edits to the same key from two devices simultaneously are extremely unlikely.
3. For `da_vacancies` and `sys_tasks` (which DO need record-level merge), the existing dedicated tables remain.

---

## 3. Sync Registry — Which keys to sync and how

```javascript
// Inside cloud-sync.js — replaces hardcoded TABLES for new sync
const SYNC_REGISTRY = [
  // ── Arrays (record-level merge via _mergeByUpdatedAt) ──
  // These stay on dedicated tables:
  // { key: 'da_vacancies', table: 'vacancies',  mode: 'dedicated' },
  // { key: 'sys_tasks',    table: 'sys_tasks',   mode: 'dedicated' },

  // ── Arrays synced via app_state (whole-key JSONB) ──
  { key: 'sb_goals',     mode: 'jsonb' },
  { key: 'sb_habits',    mode: 'jsonb' },
  { key: 'sb_reviews',   mode: 'jsonb' },
  { key: 'sb_notes2',    mode: 'jsonb' },
  { key: 'sb_ratings',   mode: 'jsonb' },
  { key: 'eng_notes',    mode: 'jsonb' },
  { key: 'eng_srs_deck', mode: 'jsonb' },
  { key: 'plab_h',       mode: 'jsonb' },
  { key: 'ruta_log5',    mode: 'jsonb' },
  { key: 'news_saved',   mode: 'jsonb' },

  // ── Opaque state objects (whole-key JSONB) ──
  { key: 'e4',           mode: 'jsonb' },
  { key: 'ruta5',        mode: 'jsonb' },
  { key: 'dojo_stats',   mode: 'jsonb' },
  { key: 'excel_dojo',   mode: 'jsonb' },

  // ── Config/prefs (whole-key JSONB, small scalars) ──
  { key: 'jt_profile',       mode: 'jsonb' },
  { key: 'jt_form_expanded', mode: 'jsonb' },
  { key: 'sb_name',          mode: 'jsonb' },
  { key: 'sb_streak',        mode: 'jsonb' },
  { key: 'sb_start',         mode: 'jsonb' },
  { key: 'sb_last',          mode: 'jsonb' },
  { key: 'sb_hours',         mode: 'jsonb' },
  { key: 'sb_pomo_total',    mode: 'jsonb' },
];

// Dynamic keys discovered at runtime
const DYNAMIC_PREFIXES = [
  { prefix: 'fin_',      mode: 'jsonb' },   // fin_2026-04, fin_2026-03, ...
  { prefix: 'sb_pomo_',  mode: 'jsonb' },   // sb_pomo_2026-04-03, ...
];
```

---

## 4. Refactored `cloud-sync.js` Architecture

### 4A. New methods for `app_state` table

```
pushState(storeKey, payload)   → UPSERT one row in app_state
pullState(storeKey)            → SELECT one row from app_state
pullAllStates()                → SELECT * from app_state WHERE user_id = uid
```

### 4B. `fullSyncAll()` — the new top-level sync orchestrator

Called on `sb:signed_in` and `INITIAL_SESSION`:

```
fullSyncAll():
  1. Run existing fullSync('vacancies', 'da_vacancies')  — dedicated table
  2. Run existing fullSync('sys_tasks', 'sys_tasks')      — dedicated table
  3. Pull ALL rows from app_state in one query → Map<storeKey, {payload, updated_at}>
  4. For each entry in SYNC_REGISTRY:
       - Read localStorage(key)
       - Compare updated_at: local vs cloud
       - If cloud is newer → write cloud payload to localStorage
       - If local is newer (or cloud is empty) → push local payload to app_state
       - If equal → skip
  5. Discover dynamic keys: scan localStorage for DYNAMIC_PREFIXES
       - For each match not already in cloud results → push to app_state
       - For each cloud key matching prefix not in localStorage → write to localStorage
  6. Dispatch 'cloud:sync_complete' event so modules can re-render
```

### 4C. Conflict resolution: First-sync backward compatibility

**Critical requirement:** When a user logs in for the first time on a device that already has local data, the local data MUST upload to cloud (not be overwritten by empty cloud).

Logic per key:
```
if (cloud row exists && local exists):
    compare updated_at → newer wins
    write winner to both sides
elif (cloud row exists && !local):
    write cloud → localStorage         (new device pulls existing data)
elif (!cloud row && local exists):
    push local → app_state              (first sync uploads existing data)
elif (!cloud row && !local):
    skip
```

### 4D. Write-through integration

Every module that calls `localStorage.setItem(key, value)` should also call:
```javascript
CLOUD.pushState(key, value);
```

This can be done with a **thin wrapper** that modules opt into:

```javascript
// In cloud-sync.js
function saveLocal(key, value) {
  localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  pushState(key, typeof value === 'string' ? JSON.parse(value) : value);
}
```

Or via a **localStorage proxy** (non-breaking, modules don't need changes):

```javascript
const _origSetItem = localStorage.setItem.bind(localStorage);
localStorage.setItem = (key, value) => {
  _origSetItem(key, value);
  if (_shouldSync(key)) {
    CLOUD.pushState(key, _safeParse(value));
  }
};
```

**Recommended approach:** localStorage proxy. Zero changes needed in existing module code. The proxy checks `_shouldSync(key)` against the registry + dynamic prefixes and pushes automatically.

### 4E. `_shouldSync(key)` filter

```javascript
function _shouldSync(key) {
  if (key === 'news_cache') return false;  // explicit skip
  if (SYNC_REGISTRY.some(e => e.key === key)) return true;
  if (DYNAMIC_PREFIXES.some(p => key.startsWith(p.prefix))) return true;
  return false;
}
```

---

## 5. Implementation Steps

| # | Task | Files |
|---|------|-------|
| 1 | Run SQL to create `app_state` table + RLS in Supabase dashboard | Supabase SQL editor |
| 2 | Add `app_state` SQL to `database/schema.sql` for documentation | `database/schema.sql` |
| 3 | Add `SYNC_REGISTRY`, `DYNAMIC_PREFIXES`, `_shouldSync()` to cloud-sync.js | `frontend/js/cloud-sync.js` |
| 4 | Add `pushState()`, `pullState()`, `pullAllStates()` methods | `frontend/js/cloud-sync.js` |
| 5 | Add `fullSyncAll()` orchestrator | `frontend/js/cloud-sync.js` |
| 6 | Add localStorage.setItem proxy for automatic write-through | `frontend/js/cloud-sync.js` |
| 7 | Update `sb:signed_in` listener to call `fullSyncAll()` | `frontend/js/cloud-sync.js` |
| 8 | Add `cloud:sync_complete` event dispatch + listeners in modules | All module JS files |
| 9 | Test: login on device A with existing local data → verify upload | Manual F12 |
| 10 | Test: login on device B (empty) → verify pull populates localStorage | Manual F12 |

---

## 6. What stays unchanged

- **`vacancies` table** — keeps dedicated schema + camelCase↔snake_case field mapping (record-level merge).
- **`sys_tasks` table** — keeps dedicated schema (record-level merge).
- **`class_sessions` table** — keeps dedicated schema.
- **`user_prefs` table** — keeps dedicated schema.
- **`auth.js`** — no changes needed.
- **`supabase-client.js`** — no changes needed.
- **All module HTML/CSS** — no changes needed.
- **All module JS** — no changes needed (localStorage proxy intercepts writes transparently).

---

## 7. Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| Large JSONB blobs (e.g. 500+ SRS cards) | Supabase handles JSONB up to 1GB; 500 cards ≈ 100KB — trivial |
| Proxy intercepts Supabase's own localStorage writes | `_shouldSync()` only matches known prefixes; Supabase uses `sb-` prefix which is NOT in our registry |
| Race condition: proxy fires before AUTH is ready | `pushState()` checks `_ready()` → enqueues to retry queue if not authenticated |
| Dynamic key explosion (hundreds of `sb_pomo_*`) | Each is ~50 bytes; 365 days ≈ 18KB total — negligible |
| Overwriting newer data on slow network | `updated_at` comparison before write; tie → cloud wins (safer for multi-device) |

---

**Awaiting "Approved" to proceed with SQL creation and cloud-sync.js refactoring.**
