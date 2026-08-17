# PLAN: LATAM Job Tracker — Enhanced UI & Profile-Based Filtering
**Status:** AWAITING APPROVAL — Do NOT execute until user sends "Approved"
**Author:** Arquitecto Claude — 2026-04-01
**Scope:** Augment `jobs.html` / `jobs.js` with profile toggles, enriched add-vacancy form, and CLOUD.push() integration. No new pages — enhance existing tracker tab.

---

## 0. CURRENT STATE AUDIT

### What Already Exists (jobs.js — 346 lines)
| Component | Description |
|---|---|
| `VDB` | Shared vacancy CRUD → localStorage + `CLOUD.push()` |
| `COLS` pipeline | saved → applied → interview → finalist (4 columns) |
| `getAllCards()` | Merges VDB entries + manual `jt8` entries |
| `rK()` | Kanban renderer with drag-and-drop |
| `showDetail()` | Master-detail viewer (match%, ATS%, cultureFit, remoteReady meters) |
| `calculateMetrics()` | Pipeline analytics (application rate, interview rate, win rate) |
| `CMP[12]` | Target companies rotation (daily 3-pick) |
| `QUICK_SEARCHES[12]` | Boolean query shortcuts across 8 platforms |
| `addA()` | Manual entry: title, company, URL, status (4 fields) |
| Cloud sync | `sb:signed_in` → `CLOUD.fullSync('vacancies', VDB.KEY)` |

### What's Missing
1. **No profile filter** — All vacancies shown regardless of focus (AP vs Data Entry vs General)
2. **Manual form is minimal** — Only 4 fields (title, company, URL, status). No salary, source, type, focus area, tags, english level, CPA, QA exposure
3. **No focus_area tagging** on manual entries — VDB entries get `focusArea` from apply.js profiling, but manual entries have none
4. **No bulk filter by profile** — Can't quickly see "only my Accountant pipeline" vs "only my Data Entry pipeline"

### Database Schema Already Supports It
The `vacancies` table (schema.sql) already has: `focus_area TEXT`, `tags JSONB`, `salary TEXT`, `salary_input TEXT`, `currency TEXT`, `source TEXT`, `type TEXT`, `priority TEXT`. We just need the UI to populate these fields.

---

## 1. PROFILE SYSTEM — Toggle Between Views

### Design
A **profile toggle bar** above the kanban that filters all cards by `focus_area`:

```
[🏦 Contabilidad] [📊 Data Entry] [🌐 Todos]
```

### Implementation
- Add `PROFILES` config array:
  ```
  PROFILES = [
    { id: 'accountant', label: '🏦 Contabilidad', areas: ['AP','AR','Bookkeeper','Financial Analyst','Auditor'] },
    { id: 'data_entry', label: '📊 Data / Tech',  areas: ['Data Analyst','Data Entry','BI','SQL','VA','Power BI'] },
    { id: 'all',        label: '🌐 Todos',        areas: null }  // no filter
  ]
  ```
- Store active profile in `localStorage` key `jt_profile` (default: `'all'`)
- `getAllCards()` stays unchanged — filtering happens at render time
- `rK()` receives optional filter: `rK(profileFilter)`. If filter active, only show cards whose `focusArea` matches one of `PROFILES[active].areas` (case-insensitive substring match)
- `calculateMetrics()` also respects active profile filter
- Manual entries get `focusArea` from the new form (see Phase 2)

### HTML (inject into `#p-tr` above kanban)
```html
<div class="profile-bar" id="profileBar">
  <!-- rendered by JS from PROFILES config -->
</div>
```

### Ripple Effects
- `uS()` (stat counters) must filter by profile too
- `QUICK_SEARCHES` rendering could also filter (AP searches hidden in Data Entry profile)
- Companies rotation (`renderCmp()`) could sort/highlight by profile relevance

---

## 2. ENRICHED ADD-VACANCY FORM

### Current Form (4 fields)
```
[Puesto] [Empresa] [URL] [Status dropdown]
[+ Agregar] [🗑️ Limpiar manual]
```

### New Form (12 fields, collapsible sections)
```
── Básico ──
[Puesto*]       [Empresa*]      [URL]
[Source ▾]      [Type ▾]        [Status ▾]

── Perfil & Filtros ── (collapsed by default, toggle open)
[Focus Area ▾]  [English Level ▾]  [Salary USD Expected]
☐ Requires CPA  ☐ QA Exposure     [Priority ▾]

── Tags ── (collapsed)
[tag input with chips: "remote", "LATAM", "NetSuite", ...]

[+ Agregar]  [Limpiar manual]
```

### Field Specs

| Field | Type | Options / Validation | Maps to DB Column |
|---|---|---|---|
| `Puesto` | text input* | required | `title` / `role` |
| `Empresa` | text input* | required | `company` |
| `URL` | text input | optional, `type="url"` | `url` |
| `Source` | select | LinkedIn, Indeed, Computrabajo, Upwork, Torre, RemoteOK, Referral, Other | `source` |
| `Type` | select | Full-time, Part-time, Contract, Freelance | `type` |
| `Status` | select | Guardado, Aplicado, Entrevista, Finalista | `status` |
| `Focus Area` | select | AP, AR, Bookkeeper, Financial Analyst, Data Analyst, Data Entry, BI, VA, General | `focus_area` |
| `English Level` | select | Basic, Intermediate, Advanced, Native, Not Required | stored in `tags` JSONB |
| `Salary USD Expected` | number input | placeholder "$USD/mo", min=0 | `salary_input` |
| `Requires CPA` | checkbox | boolean | stored in `tags` JSONB as `"requires_cpa"` |
| `QA Exposure` | checkbox | boolean | stored in `tags` JSONB as `"qa_exposure"` |
| `Priority` | select | Low, Medium, High | `priority` |
| `Tags` | chip input | comma-separated, enter to add | `tags` JSONB array |

### Collapsible Sections
- "Perfil & Filtros" section collapsed by default with `▸ Más opciones` toggle
- Keeps the form compact for quick entries but expandable for rich entries
- State persists in `localStorage` key `jt_form_expanded` (boolean)

### Data Flow
```
User fills form → buildVacancy() → VDB.save(vacancy) → CLOUD.push('vacancies', vacancy) → rK()
```

The `buildVacancy()` function creates a full vacancy object:
```js
{
  id: crypto.randomUUID(),
  ts: Date.now(),
  updated_at: new Date().toISOString(),
  title: puesto,
  role: puesto,
  company: empresa,
  url: url || '',
  source: source,
  type: type,
  status: status,
  focus_area: focusArea,
  salary_input: salary || '',
  priority: priority,
  tags: [...chipTags, ...conditionalTags],  // includes english_level, requires_cpa, qa_exposure
  found_date: new Date().toISOString().slice(0,10),
  applied_date: status === 'applied' ? new Date().toISOString().slice(0,10) : '',
  match: {},
  profile: {},
  notes: ''
}
```

### Key Decision: Deprecate `jt8` Manual Tracker
The new form saves directly to VDB (not the old `jt8` localStorage). This means:
- All new entries go through VDB → cloud sync automatic
- Existing `jt8` entries still render via `getAllCards()` (backward-compatible)
- "Limpiar manual" button becomes "Migrar a VDB" — moves `jt8` entries into VDB then deletes `jt8`
- Eventually `jt8` code paths can be removed

---

## 3. KANBAN ENHANCEMENTS

### Profile Color Tags on Cards
Each kanban card (`ka`) gets a small colored badge showing focus area:
```html
<span class="ka-fa" style="background:var(--gg);color:var(--gn)">AP</span>
```

### Quick-Filter Chips Below Profile Bar
```
[AP: 5] [Data Entry: 3] [BI: 2] [General: 1]  ← clickable, filters kanban
```
These are auto-generated from the distinct `focus_area` values in current cards.

### Card Sort Within Columns
Cards sorted by: priority (high first) → match% (descending) → date (newest first)

---

## 4. CLOUD SYNC INTEGRATION

### Already Done
- `VDB.save()` → `CLOUD.push('vacancies', v)` ✅
- `VDB.del()` → `CLOUD.remove('vacancies', id)` ✅
- `sb:signed_in` → `CLOUD.fullSync('vacancies', VDB.KEY)` ✅

### What Phase 2 Form Adds
- New entries go through `VDB.save()` — cloud sync is automatic, zero new wiring needed
- Tags stored as JSONB array — already supported by schema (`tags JSONB DEFAULT '[]'`)
- `focus_area` stored as TEXT — already in schema
- `salary_input` stored as TEXT — already in schema

### Migration Script (jt8 → VDB)
```js
function migrateManualEntries() {
  const manual = getA(); // jt8
  if (!manual.length) return;
  manual.forEach(entry => {
    VDB.save({
      id: crypto.randomUUID(),
      ts: Date.now(),
      title: entry.t, role: entry.t,
      company: entry.c, url: entry.u || '',
      status: normStatus(entry.s),
      focus_area: 'general',
      source: 'manual',
      tags: [], match: {}, profile: {},
      notes: '', found_date: entry.d || ''
    });
  });
  localStorage.removeItem('jt8');
}
```

---

## 5. IMPLEMENTATION ORDER

| Step | What | Touches | Lines Est. |
|---|---|---|---|
| 5.1 | Profile toggle bar + `PROFILES` config | jobs.js (new section, ~40 lines) + jobs.html (1 div) | ~50 |
| 5.2 | Enriched add-vacancy form HTML | jobs.html (replace existing form div) | ~40 |
| 5.3 | `buildVacancy()` + form submit handler | jobs.js (replace `addA()`, ~50 lines) | ~60 |
| 5.4 | Profile filtering in `rK()`, `uS()`, `calculateMetrics()` | jobs.js (modify 3 existing functions) | ~30 |
| 5.5 | Focus-area badges on kanban cards | jobs.js `rK()` template | ~10 |
| 5.6 | Card sorting (priority → match → date) | jobs.js `rK()` | ~10 |
| 5.7 | `jt8` → VDB migration function + button | jobs.js (~20 lines) | ~25 |
| 5.8 | CSS for profile bar, form sections, badges | jobs.html `<style>` block | ~40 |
| **Total** | | | **~265 lines changed/added** |

### File Impact
- `jobs.html` — Modify form HTML, add profile bar div, add CSS
- `jobs.js` — Add PROFILES config, modify rK/uS/calculateMetrics, replace addA(), add buildVacancy(), add migration
- **No new files created**
- **No changes to cloud-sync.js, auth.js, or schema.sql** — existing infra covers everything

---

## 6. RISKS & MITIGATIONS

| Risk | Mitigation |
|---|---|
| Breaking existing VDB entries from apply.js | New form writes same shape; `focusArea` field already exists on profiled entries |
| `jt8` migration loses data | Migration copies to VDB first, then deletes `jt8`; user confirms via button click |
| Profile filter hides entries user expects to see | Default profile is "Todos" (no filter); profile state persists across page loads |
| Form too complex for quick entries | Collapsible sections; only 3 fields required (puesto, empresa, status); rest has smart defaults |

---

**AWAITING APPROVAL** — Send "Approved" to begin implementation.
