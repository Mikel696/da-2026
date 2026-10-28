# PLAN_FINANCE_UI.md — Finance Module Refactor

> **Status:** DRAFT — Awaiting human operator "Approved" before implementation.
> **Goal:** Refactor the monolithic finance.html into a proper separated architecture (HTML shell + external JS + external CSS), add missing features, and enforce strict separation of concerns.

---

## 1. Current State Assessment

The finance module is a **single self-contained HTML file** (250 lines) with:
- Embedded `<style>` (52 lines) — all CSS inline
- HTML shell (90 lines) — 5-tab layout with KPIs, forms, chart, categories, savings goal
- Embedded `<script>` (105 lines) — all logic inline, bare global functions

**What already works well:**
- 5-tab UI: Registrar, Historial, Categorias, Grafico, Meta Ahorro
- 13 categories (3 income, 10 expense) with emoji icons
- KPI dashboard: Ingresos, Gastos, Balance, Ahorro
- Daily bar chart (pure DOM, no library)
- Category breakdown with percentage bars
- Savings goal with progress bar
- Cloud sync via `fin_MONTH` dynamic prefix (already in `DYNAMIC_PREFIXES`)

**What needs improvement:**
- No separation of concerns — logic/rendering/style all in one file
- No `id` on transactions — can't do record-level operations reliably
- Delete by array index (`splice(i,1)`) — fragile, breaks on concurrent edits
- `quickExp()` uses `prompt()` — ugly UX, blocks thread
- No month selector — locked to current month only
- No recurring transactions (salary, rent, subscriptions)
- No multi-month trends or year-to-date view
- No `cloud:sync_complete` listener — data pulled from cloud doesn't re-render

---

## 2. Architecture: Separated Files

### File structure after refactor:
```
frontend/
  finance.html          — HTML shell (structure only, no logic)
  css/finance.css       — Extracted + enhanced styles
  js/finance.js         — All logic: data layer + rendering + events
```

### Script loading order in finance.html:
```html
<!-- CDN -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<!-- Core -->
<script src="js/supabase-client.js"></script>
<script src="js/auth.js"></script>
<script src="js/cloud-sync.js"></script>
<!-- Module -->
<script src="js/finance.js"></script>
```

---

## 3. Data Layer (finance.js — top section)

### 3A. Transaction schema (unchanged, + `id`)

```javascript
// Each transaction:
{
  id:   string,    // crypto.randomUUID() — NEW, enables reliable delete
  amt:  number,    // amount in COP
  desc: string,    // description
  cat:  string,    // category key (salary, food, transport, etc.)
  type: string,    // 'inc' or 'exp'
  date: string     // ISO 8601 timestamp
}
```

### 3B. Storage singleton: `FIN`

```javascript
const FIN = {
  _month: new Date().toISOString().slice(0, 7),  // '2026-04'

  key()       { return 'fin_' + FIN._month; },
  getAll()    { try { return JSON.parse(localStorage.getItem(FIN.key()) || '[]'); } catch { return []; } },
  save(txs)   { localStorage.setItem(FIN.key(), JSON.stringify(txs)); },

  add(tx)     { const all = FIN.getAll(); all.push({ id: crypto.randomUUID(), ...tx }); FIN.save(all); return all; },
  del(id)     { const all = FIN.getAll().filter(t => t.id !== id); FIN.save(all); return all; },
  get(id)     { return FIN.getAll().find(t => t.id === id) || null; },

  setMonth(m) { FIN._month = m; },    // e.g., '2026-03'
  getMonth()  { return FIN._month; },

  // Savings goal (static key)
  getGoal()   { try { return JSON.parse(localStorage.getItem('fin_sav_goal') || 'null'); } catch { return null; } },
  setGoal(g)  { localStorage.setItem('fin_sav_goal', JSON.stringify(g)); }
};
```

### 3C. Computed metrics (pure functions, no DOM)

```javascript
function calcMetrics(txs) {
  let inc = 0, exp = 0, sav = 0;
  for (const t of txs) {
    if (t.type === 'inc') inc += t.amt;
    else exp += t.amt;
    if (t.cat === 'savings') sav += t.amt;
  }
  return { inc, exp, bal: inc - exp, sav };
}

function calcCategoryBreakdown(txs) {
  const expTx = txs.filter(t => t.type === 'exp');
  const totals = {};
  for (const t of expTx) totals[t.cat] = (totals[t.cat] || 0) + t.amt;
  return Object.entries(totals).sort((a, b) => b[1] - a[1]);
}

function calcDailyData(txs) {
  const days = {};
  for (const t of txs) {
    const d = new Date(t.date).getDate();
    if (!days[d]) days[d] = { inc: 0, exp: 0 };
    if (t.type === 'inc') days[d].inc += t.amt;
    else days[d].exp += t.amt;
  }
  return days;
}
```

---

## 4. Rendering Layer (finance.js — middle section)

All render functions read from `FIN` and write to DOM. They never call storage directly — they receive data or call `FIN.getAll()`.

### 4A. Master render

```javascript
function renderAll() {
  const txs = FIN.getAll();
  const m = calcMetrics(txs);
  renderKPIs(m);
  renderRecent(txs);
  renderHistory(txs);
  renderCategories(txs, m.exp);
  renderChart(txs);
  renderSavings(m.sav);
  renderMonthNav();
}
```

### 4B. Individual render functions

| Function | Target element | Description |
|----------|---------------|-------------|
| `renderKPIs(m)` | `#kInc, #kExp, #kBal, #kSav` | Update 4 KPI values + colors |
| `renderRecent(txs)` | `#recentTx` | Last 8 transactions (reversed) |
| `renderHistory(txs)` | `#allTx` | Full month list (reversed) |
| `renderCategories(txs, totalExp)` | `#catBreak` | Expense breakdown with % bars |
| `renderChart(txs)` | `#dayChart` | Daily income vs expense bar chart (pure DOM) |
| `renderSavings(currentSav)` | `#savInfo` | Savings goal progress bar |
| `renderMonthNav()` | `#monthNav` | **NEW** — Month selector (< Apr 2026 >) |

---

## 5. New Features

### 5A. Month Navigation

Add a month selector above the tabs:

```html
<div id="monthNav" class="month-nav">
  <button class="mn-btn" id="mnPrev">‹</button>
  <span class="mn-label" id="mnLabel">Abril 2026</span>
  <button class="mn-btn" id="mnNext">›</button>
</div>
```

- Left/right arrows change `FIN._month`
- Label shows localized month name in Spanish
- Right arrow disabled if already on current month
- `renderAll()` called on every navigation

### 5B. Improved Quick Expense

Replace `prompt()` with an inline expandable form:

```html
<button class="btn bo" id="quickExpBtn">⚡ Gasto rápido</button>
<div id="quickExpForm" class="quick-form" style="display:none">
  <input class="inp" id="qDesc" placeholder="¿En qué?">
  <input class="inp" id="qAmt" type="number" placeholder="$">
  <button class="btn bg bs" onclick="submitQuickExp()">✓</button>
  <button class="btn bo bs" onclick="cancelQuickExp()">✕</button>
</div>
```

Toggle visibility on button click. No `prompt()`.

### 5C. Transaction Edit

Clicking a transaction row opens inline edit mode (same row transforms into inputs). Save/cancel buttons. Uses `FIN.get(id)` + `FIN.del(id)` + `FIN.add(edited)`.

### 5D. Income Category Breakdown

Currently only expenses get category breakdown. Add a toggle to show income categories too:

```html
<div class="cat-toggle">
  <button class="cat-btn on" data-cat="exp">Gastos</button>
  <button class="cat-btn" data-cat="inc">Ingresos</button>
</div>
```

### 5E. Cloud Sync Re-render

```javascript
window.addEventListener('cloud:sync_complete', () => renderAll());
```

One line. Ensures data pulled from another device re-renders immediately.

---

## 6. CSS Extraction (finance.css)

Extract the 52 lines of embedded `<style>` into `frontend/css/finance.css`. Add new classes:

| Class | Purpose |
|-------|---------|
| `.month-nav` | Month navigation bar (flex, centered) |
| `.mn-btn` | Arrow buttons (minimal, hover glow) |
| `.mn-label` | Month/year text (mono font, accent color) |
| `.quick-form` | Inline quick expense row (flex, gap 6px) |
| `.cat-toggle` | Income/expense toggle in categories tab |
| `.cat-btn` | Toggle button (same style as `.tab`) |
| `.tx-edit` | Inline edit mode for transaction rows |

All existing classes (`.nv`, `.wr`, `.kpis`, `.tabs`, `.pnl`, `.tx-row`, `.chart`, `.cat-row`, `.bar`, etc.) move unchanged.

---

## 7. Migration: Backward Compatibility

Existing `fin_MONTH` data has transactions **without `id` fields**. The `renderAll()` init must handle this:

```javascript
// On load: backfill missing IDs
function migrateIds() {
  const txs = FIN.getAll();
  let changed = false;
  for (const t of txs) {
    if (!t.id) { t.id = crypto.randomUUID(); changed = true; }
  }
  if (changed) FIN.save(txs);
}
```

Called once at init before `renderAll()`.

---

## 8. Implementation Steps

| # | Task | Files |
|---|------|-------|
| 1 | Extract CSS from finance.html → `css/finance.css` + new classes | `frontend/css/finance.css` |
| 2 | Rewrite finance.html as shell: link CSS, script tags, clean HTML | `frontend/finance.html` |
| 3 | Add month nav HTML + quick expense inline form | `frontend/finance.html` |
| 4 | Write `finance.js`: FIN data layer + computed metrics | `frontend/js/finance.js` |
| 5 | Write `finance.js`: render functions (KPIs, recent, history, categories, chart, savings, month nav) | `frontend/js/finance.js` |
| 6 | Write `finance.js`: event bindings (tabs, form submit, month nav, quick expense, delete, edit, cloud listener) | `frontend/js/finance.js` |
| 7 | Add `migrateIds()` for backward compat | `frontend/js/finance.js` |
| 8 | Test locally: add tx, delete, navigate months, verify cloud sync | Manual F12 |

---

## 9. What stays unchanged

- **Cloud sync** — `fin_` dynamic prefix already in `DYNAMIC_PREFIXES`. localStorage proxy handles everything automatically. No changes to `cloud-sync.js`.
- **`fin_sav_goal`** — Also covered by `fin_` prefix. Syncs automatically.
- **KPI layout** — 4-column grid (Ingresos, Gastos, Balance, Ahorro) stays.
- **Category list** — Same 13 categories with same emoji icons.
- **Daily bar chart** — Pure DOM implementation, no charting library.
- **Dark theme** — Same design tokens/variables.

---

**Awaiting "Approved" to begin implementation.**
