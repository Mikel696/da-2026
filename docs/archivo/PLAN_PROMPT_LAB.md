# PLAN_PROMPT_LAB.md — 8-PRO Prompt Lab v2

**Module:** 8-PRO  
**Status:** PLANNING  
**Created:** 2026-04-10  
**Architect:** Claude (Lead Frontend Architect)  
**Approved:** ⏳ Pending operator approval

---

## 1. OBJECTIVE

Consolidate all prompt-related functionality into a single, centralized **Prompt Lab** module following the proven 4-layer architecture (shell HTML + CSS + JS IIFE + data JSON). Replace the current monolith `prompts.html` (inline CSS/JS, hardcoded data, no UUIDs, no cloud sync) with a production-grade module that stores, categorizes, filters, searches, optimizes, and executes AI prompts.

---

## 2. DOMAIN DISCOVERY — EXISTING ASSETS

| Asset | Location | Status | Disposition |
|---|---|---|---|
| `prompts.html` (monolith) | `frontend/prompts.html` | Active — 418 lines inline | **REPLACE** — becomes thin shell |
| `pages/prompts.html` (legacy) | `frontend/pages/prompts.html` | Legacy — uses old `core.js` | **DEPRECATE** — redirect to new module |
| `prompt-weaver.js` | `frontend/js/prompt-weaver.js` | Active — job-specific | **KEEP AS-IS** — belongs to 2-APP/5-JOB |
| `cover-weaver.js` | `frontend/js/cover-weaver.js` | Active — job-specific | **KEEP AS-IS** |
| `cv-weaver.js` | `frontend/js/cv-weaver.js` | Active — job-specific | **KEEP AS-IS** |
| `interview-weaver.js` | `frontend/js/interview-weaver.js` | Active — job-specific | **KEEP AS-IS** |
| `PROMPTS_DATA` in `core.js` | `frontend/js/core.js` (~L495) | Active — 8 prompts | **MIGRATE** to `prompts-data.json` |
| `plab_h` localStorage key | `SYNC_REGISTRY` in `cloud-sync.js` | Active — syncs | **MIGRATE** contents into `sb_prompts` |
| `custom_prompts` localStorage key | `pages/prompts.html` | Legacy | **MIGRATE** into `sb_prompts.custom` |

---

## 3. FILE STRUCTURE (4-Layer Architecture)

```
frontend/
├── prompts.html              ← Shell (~70 lines). Nav + div containers + script tags.
├── css/
│   └── prompts.css           ← All visual styles. No inline CSS in HTML.
├── js/
│   └── prompts.js            ← IIFE `PRO` — all logic, state, rendering.
└── data/
    └── prompts-data.json     ← Seed library. Categories, prompts, optimizer config.
```

**Convention:** Matches `accounting.html` + `css/accounting.css` + `js/accounting.js` + `data/accounting-data.json` pattern exactly.

---

## 4. TAXONOMY & CATEGORIZATION STRATEGY

### 4.1 Primary Categories (top-level filter)

| Key | Label | Icon | Color Token | Description |
|---|---|---|---|---|
| `data` | Análisis de Datos | 📊 | `--gn` green | SQL, Python, Power BI, DAX, Pandas, EDA |
| `code` | Código & Dev | 💻 | `--cy` cyan | Scripts, debugging, architecture, APIs |
| `finance` | Finanzas & Contabilidad | 💰 | `--am` amber | AP, reconciliation, journal entries, audit |
| `career` | Carrera & Empleo | 💼 | `--ac` violet | Interviews, CV, LinkedIn, negotiation |
| `learning` | Aprendizaje | 📚 | `--or` orange | Study plans, concept explanations, SRS |
| `writing` | Escritura & Contenido | ✍️ | `--a2` light violet | Copywriting, emails, documentation |
| `system` | Sistema DA-2026 | ⚙️ | `--t2` muted | Internal prompts: class analyzer, brain protocols |
| `custom` | Mis Prompts | ⭐ | `--gn` green | User-created prompts |

### 4.2 Tags (secondary, multi-select)

Free-form tags stored as `string[]` per prompt. Predefined suggestions:
`sql`, `python`, `excel`, `power-bi`, `dax`, `pandas`, `claude`, `gpt`, `interview`, `star-method`, `negotiation`, `linkedin`, `accounting`, `ap`, `reconciliation`, `study-plan`, `flashcard`, `debug`, `api`, `markdown`, `email`, `cover-letter`.

Tags enable cross-category search (e.g., a `finance` prompt tagged `sql` appears when filtering by SQL).

### 4.3 Prompt Schema

```jsonc
{
  "id": "uuid-v4",
  "title": "Query SQL desde Pregunta de Negocio",
  "category": "data",
  "tags": ["sql", "postgresql"],
  "description": "Convierte un requerimiento de negocio en SQL auditado",
  "body": "Actúa como Senior Data Analyst...",
  "variables": [
    { "key": "{{SCHEMA}}", "label": "Esquema de tablas", "type": "textarea" },
    { "key": "{{QUESTION}}", "label": "Pregunta de negocio", "type": "text" }
  ],
  "source": "seed",        // "seed" | "custom" | "migrated"
  "favorite": false,
  "usageCount": 0,
  "createdAt": "2026-04-10T...",
  "updatedAt": "2026-04-10T..."
}
```

- **`variables`** — Template placeholders the user fills before copying. Replaces the old dumb copy-paste approach.
- **`source: "seed"`** — Comes from `prompts-data.json`. Never deleted by user; can be hidden.
- **`source: "custom"`** — User-created. Full CRUD.
- **`usageCount`** — Incremented on copy. Enables "Most Used" sort.

---

## 5. UI LAYOUT & DOM STRUCTURE

### 5.1 Tabs (5 tabs)

| Tab | ID | Description |
|---|---|---|
| 📚 Librería | `p-lib` | Browse, filter, search, copy prompts from seed + custom |
| ⚡ Optimizar | `p-opt` | Paste raw idea → get structured prompt (existing engine, refactored) |
| ✏️ Crear | `p-new` | Form to create/edit a custom prompt |
| 🧠 Guía | `p-guide` | "10 Rules to Master Claude" (existing content, refactored) |
| 📜 Historial | `p-hist` | Log of optimized prompts with timestamps |

### 5.2 Library Tab (main view) — DOM Wireframe

```
┌─────────────────────────────────────────────────────┐
│ [🔍 Search input _______________]  [Sort: ▾ Recent] │
│                                                     │
│ [Todos] [📊 Data] [💻 Code] [💰 Fin] [💼 Career]  │
│ [📚 Learn] [✍️ Write] [⚙️ System] [⭐ Custom]      │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 📊 data  ·  sql · postgresql                    │ │
│ │ Query SQL desde Pregunta de Negocio             │ │
│ │ Convierte requerimiento → SQL auditado          │ │
│ │ ⭐ Favorito   📋 Copiar   ✏️ Variables          │ │
│ │                                                 │ │
│ │ ┌─ Variables Panel (collapsed by default) ─────┐│ │
│ │ │ {{SCHEMA}}: [textarea__________]             ││ │
│ │ │ {{QUESTION}}: [text_____________]            ││ │
│ │ │         [📋 Copiar con variables]            ││ │
│ │ └─────────────────────────────────────────────┘│ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ (next prompt card...)                           │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 5.3 Optimizer Tab — DOM Wireframe

```
┌─────────────────────────────────────────────────────┐
│ ⚡ Cómo funciona (tip card)                         │
│                                                     │
│ Tu idea (en bruto):                                 │
│ [textarea_________________________________]         │
│                                                     │
│ [Contexto ▾] [Tono ▾] [Idioma ▾] [⚡ Optimizar]   │
│                                                     │
│ ── Prompt optimizado ──                             │
│ ┌─ Result box (syntax-highlighted XML) ───────────┐ │
│ │ <role>Actúa como...</role>                      │ │
│ │ <contexto>...</contexto>                        │ │
│ └─────────────────────────────────────────────────┘ │
│ [📋 Copiar] [💾 Guardar historial] [📚 → Librería]│
└─────────────────────────────────────────────────────┘
```

### 5.4 Create/Edit Tab — DOM Wireframe

```
┌─────────────────────────────────────────────────────┐
│ Título:    [text________________________]           │
│ Categoría: [select ▾]   Tags: [tag input chips]     │
│ Descripción: [text________________________]         │
│ Cuerpo del prompt:                                  │
│ [textarea_________________________________]         │
│                                                     │
│ Variables (opcionales):                             │
│ [+ Añadir variable]                                 │
│ │ {{VAR1}} → Label: [____] Type: [text ▾] [✕]     │
│                                                     │
│ [💾 Guardar prompt]  [Vista previa]                 │
└─────────────────────────────────────────────────────┘
```

---

## 6. STATE MANAGEMENT

### 6.1 Single localStorage Key

```
Key: sb_prompts
```

**Structure (JSONB opaque object):**

```jsonc
{
  "library": [
    // Array of prompt objects (seed + custom + migrated)
    // Seed prompts have source:"seed", user can toggle favorite/hidden
    // Custom prompts have source:"custom", full CRUD
  ],
  "history": [
    // Array of optimizer history entries
    { "id": "uuid", "input": "...", "output": "...", "ctx": "data", "tone": "professional", "lang": "es", "createdAt": "..." }
  ],
  "settings": {
    "defaultCtx": "general",
    "defaultTone": "professional",
    "defaultLang": "es"
  }
}
```

### 6.2 IIFE Singleton Pattern

```javascript
const PRO = (function() {
  const STORE_KEY = 'sb_prompts';
  let _state = null;   // in-memory cache
  let _seed  = null;   // loaded from prompts-data.json

  function _load() { ... }  // localStorage → _state
  function _save() { ... }  // _state → localStorage (proxy triggers cloud push)

  // Public API
  return {
    init,           // load seed JSON + localStorage, merge, render
    renderAll,      // re-render active tab
    // Library
    getLibrary,     // returns merged seed + custom, filtered/sorted
    toggleFavorite, // by id
    copyPrompt,     // by id, increments usageCount
    copyWithVars,   // by id + variable map
    // Custom CRUD
    createPrompt,   // adds to library with source:"custom"
    updatePrompt,   // by id (custom only)
    deletePrompt,   // by id (custom only), filter-based delete
    // Optimizer
    optimize,       // raw idea → structured prompt
    saveToHistory,  // optimizer output → history[]
    saveToLibrary,  // optimizer output → library[] as custom
    // History
    getHistory,
    deleteHistory,  // by id
    clearHistory,
    // Migration
    _migrate,       // one-time: plab_h → history, custom_prompts → library
  };
})();
```

### 6.3 Cloud Sync Integration

1. **Register `sb_prompts`** in `SYNC_REGISTRY` inside `cloud-sync.js`.
2. **Remove `plab_h`** from `SYNC_REGISTRY` after migration runs.
3. **Listen for `cloud:sync_complete`** → `PRO.renderAll()`.
4. All IDs use `crypto.randomUUID()` — deletes by `filter(id !== target)`.

### 6.4 Migration Strategy (one-time, idempotent)

```
IF localStorage has 'plab_h' AND sb_prompts.history is empty:
  → Parse plab_h entries, back-fill UUIDs, push into sb_prompts.history
  → Remove 'plab_h' from localStorage

IF localStorage has 'custom_prompts' AND no source:"migrated" in sb_prompts.library:
  → Parse custom_prompts entries, back-fill UUIDs, mark source:"migrated"
  → Push into sb_prompts.library
  → Remove 'custom_prompts' from localStorage
```

---

## 7. DATA FILE — `prompts-data.json`

### 7.1 Structure

```jsonc
{
  "seedVersion": 1,
  "categories": [
    { "key": "data", "label": "Análisis de Datos", "icon": "📊" },
    // ... (8 categories from §4.1)
  ],
  "suggestedTags": ["sql", "python", "excel", ...],
  "prompts": [
    // ~25-30 seed prompts migrated from:
    // - prompts.html lib[] array (13 prompts)
    // - PROMPTS_DATA in core.js (8 prompts)
    // - Deduplicated, enriched with tags + variables
  ],
  "optimizer": {
    "roles": { "general": { "es": "...", "en": "..." }, ... },
    "tones": { "professional": { "es": "...", "en": "..." }, ... },
    "formats": { "general": { "es": "...", "en": "..." }, ... }
  }
}
```

### 7.2 Seed Version Bumping

Same pattern as 10-SYS: `seedVersion` in JSON, compared to `sb_prompts._seedVersion` in localStorage. On mismatch:
- New seed prompts (by title match) are inserted.
- Existing seed prompts are updated (body, tags) only if `source:"seed"` and user hasn't modified them.
- User's custom prompts and favorites are preserved.

---

## 8. SEPARATION OF CONCERNS

| Layer | File | Responsibility | Never Contains |
|---|---|---|---|
| **Shell** | `prompts.html` | Nav, div containers, script/link tags | Logic, styles, data |
| **Styles** | `css/prompts.css` | All visual presentation | Logic, data, inline HTML |
| **Logic** | `js/prompts.js` | IIFE `PRO`, all DOM rendering, state, events | Styles (use class toggling), raw data |
| **Data** | `data/prompts-data.json` | Seed prompts, categories, optimizer config | Logic, presentation |

### Cross-Cutting Rules
- **XSS:** `_esc()` on ALL user text before innerHTML injection.
- **IDs:** `crypto.randomUUID()` for all new records.
- **Deletes:** `array.filter(x => x.id !== target)` — never splice/index.
- **No global pollution:** Only `PRO` exposed on `window`.
- **cloud-sync.js integration:** loaded via `<script>` after `prompts.js`. Proxy intercepts `localStorage.setItem('sb_prompts', ...)` automatically.

---

## 9. FEATURES BY PRIORITY

### P0 — Core (must ship)
- [ ] Library tab: browse, filter by category, search by text, copy prompt
- [ ] Custom prompt CRUD (create, edit, delete)
- [ ] Optimizer tab (refactored from current inline code)
- [ ] History tab (refactored, with UUIDs)
- [ ] `sb_prompts` state management + cloud sync registration
- [ ] Migration from `plab_h` + `custom_prompts`
- [ ] XSS-safe rendering

### P1 — Enhanced (should ship)
- [ ] Template variables (fill `{{VAR}}` before copy)
- [ ] Favorite toggle + "Favorites" quick filter
- [ ] Usage counter + "Most Used" sort
- [ ] Guide tab (10 rules, refactored from inline)
- [ ] Tag chips + tag-based filtering

### P2 — Polish (nice to have)
- [ ] "Save to Library" from Optimizer output
- [ ] Import/export prompts as JSON
- [ ] Prompt preview with syntax highlighting
- [ ] Keyboard shortcuts (Ctrl+K search, Esc close)

---

## 10. WHAT STAYS UNTOUCHED

- `prompt-weaver.js`, `cover-weaver.js`, `cv-weaver.js`, `interview-weaver.js` — These are domain-specific weavers for the job application pipeline (2-APP/5-JOB). They depend on analyzer state `S` and have no overlap with the general Prompt Lab.
- `PROMPTS_DATA` in `core.js` — Will be **read** during migration to seed `prompts-data.json`, then the `const` can be removed from `core.js` in a cleanup pass after the module is verified.

---

## 11. EXECUTION SEQUENCE

1. Create `data/prompts-data.json` — migrate + deduplicate all seed prompts from both sources.
2. Create `css/prompts.css` — extract and refine styles from current inline CSS.
3. Create `js/prompts.js` — IIFE `PRO` with full state management, rendering, migration.
4. Rewrite `prompts.html` — thin shell (~70 lines).
5. Register `sb_prompts` in `SYNC_REGISTRY`.
6. QA: verify library render, optimizer, history, custom CRUD, cloud sync, migration.
7. Update `index.html` card metadata if needed.
8. Update `CEREBRO_STATE.md`.

---

## 12. ACCEPTANCE CRITERIA

- [ ] `prompts.html` is a thin shell (< 80 lines).
- [ ] All styles in `css/prompts.css`, zero inline `<style>`.
- [ ] All logic in `js/prompts.js` as IIFE `PRO`, zero inline `<script>` beyond init.
- [ ] All seed data in `data/prompts-data.json`.
- [ ] Single `sb_prompts` localStorage key, registered in `SYNC_REGISTRY`.
- [ ] Migration from `plab_h` and `custom_prompts` is idempotent.
- [ ] `_esc()` on all user text. `crypto.randomUUID()` on all new records.
- [ ] Delete by `filter(id !== target)`, never by index.
- [ ] `cloud:sync_complete` → `PRO.renderAll()`.
- [ ] Zero console errors. Sync QA passes.
