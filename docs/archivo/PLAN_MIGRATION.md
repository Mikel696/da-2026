# PLAN_MIGRATION.md — jt8 → VDB Legacy Data Migration

> **Status:** DRAFT — Awaiting human operator "Approved" before implementation.
> **Goal:** Harden the existing jt8→VDB migration, add verification, and safely clean up legacy data.

---

## 1. Current State Assessment

### Existing migration function (jobs.js:377–392)
A `migrateManual()` function already exists and does:
1. Reads `localStorage.getItem('jt8')` → parses array
2. Confirms with user via `confirm()` dialog
3. For each entry: calls `VDB.save()` with `crypto.randomUUID()`, maps `{t,c,s,u,d}` → vacancy schema
4. Calls `localStorage.removeItem('jt8')` immediately after loop
5. Re-renders kanban

### jt8 entry schema (legacy):
```javascript
{
  t: string,    // title/role
  c: string,    // company
  s: string,    // status ('saved', 'applied', etc.)
  u: string,    // url (optional)
  d: string     // date string (optional, human-readable)
}
```

### What needs improvement:
- **No verification** — `jt8` is deleted immediately, even if `VDB.save()` or `CLOUD.push()` failed
- **No duplicate detection** — running migration twice (if jt8 wasn't cleared) creates duplicates
- **`normStatus()` dependency** — if status value doesn't normalize, it defaults silently
- **No migration report** — user gets no feedback on what was migrated
- **No rollback** — once `jt8` is removed, there's no going back
- **Cloud push is fire-and-forget** — `VDB.save()` calls `CLOUD.push()` which may enqueue if offline

---

## 2. Hardened Migration Flow

### Step 1: Pre-flight check
```
- Read jt8 from localStorage
- If empty or missing → alert "No legacy data" → abort
- Show count and preview of entries to user
- Confirm dialog with entry count
```

### Step 2: Transform & insert
```
For each jt8 entry:
  - Generate crypto.randomUUID()
  - Map fields: t→title/role, c→company, s→status (via normStatus), u→url, d→foundDate
  - Set defaults: focusArea='general', source='manual_migrated', tags=[], ts=Date.now()
  - Add updated_at = new Date().toISOString()
  - Check for duplicate: if VDB already has entry with same title+company → skip
  - Insert via VDB.save() (triggers CLOUD.push automatically)
```

### Step 3: Verification
```
- Read VDB after all inserts
- Count entries with source='manual_migrated'
- Compare: migrated count >= jt8 count (accounting for dedup skips)
- If mismatch → warn user, do NOT delete jt8
```

### Step 4: Safe cleanup
```
- Only if Step 3 passes:
  - Rename jt8 → jt8_backup (keep for 1 session as safety net)
  - Remove jt8 key
  - Show migration report: "X entries migrated, Y duplicates skipped"
```

### Step 5: Re-render
```
- renderProfileBar(), rK(), uS(), calculateMetrics(), updateMigrateBtn()
```

---

## 3. Duplicate Detection

Before inserting each entry, check if VDB already contains a vacancy with the same `title` AND `company` (case-insensitive):

```javascript
function isDuplicate(entry) {
  const all = VDB.getAll();
  const t = (entry.t || '').toLowerCase().trim();
  const c = (entry.c || '').toLowerCase().trim();
  return all.some(v =>
    (v.title || '').toLowerCase().trim() === t &&
    (v.company || '').toLowerCase().trim() === c
  );
}
```

This prevents double-migration if the user accidentally triggers it again.

---

## 4. Migration Report

After completion, show an alert or render a summary:
```
✅ Migración completada
- Migrados: 5 entradas
- Duplicados omitidos: 2
- Total en VDB: 12
- jt8 legacy: eliminado
```

---

## 5. Implementation Steps

| # | Task | Files |
|---|------|-------|
| 1 | Refactor `migrateManual()` in jobs.js with hardened flow | `frontend/js/jobs.js` |
| 2 | Add `isDuplicate()` helper | `frontend/js/jobs.js` |
| 3 | Add verification step (count check before jt8 deletion) | `frontend/js/jobs.js` |
| 4 | Add migration report (alert with counts) | `frontend/js/jobs.js` |
| 5 | Test: create dummy jt8 entries, run migration, verify VDB + cloud | Manual F12 |

---

## 6. What stays unchanged

- **VDB singleton** — `save()` already calls `CLOUD.push()` automatically
- **Cloud sync** — `da_vacancies` syncs via Tier 1 (dedicated table, record-level merge)
- **Kanban rendering** — existing render functions handle VDB entries
- **"Migrar manual a VDB" button** — stays, just triggers the hardened function
- **`updateMigrateBtn()`** — hides button when jt8 is empty (already works)

---

## 7. Risks

| Risk | Mitigation |
|------|-----------|
| jt8 has malformed entries (missing `t` or `c`) | Default to 'Sin título' / 'Sin empresa' |
| Cloud push fails during migration | VDB.save() writes to localStorage first (offline-safe); CLOUD retry queue handles push |
| User runs migration on device A, then device B still has old jt8 | Migration only affects local jt8; cloud already has the VDB entries from device A |

---

**Awaiting "Approved" to begin implementation.**
