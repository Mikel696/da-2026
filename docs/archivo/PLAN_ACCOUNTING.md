# PLAN: 11-ACC · Accounting Associate — Separated Architecture Refactor

**Status:** PENDING APPROVAL
**Target files:**
- `frontend/accounting.html` — rewrite as clean HTML shell (zero embedded JS/CSS)
- `frontend/css/accounting.css` — extracted + enhanced styles
- `frontend/js/accounting.js` — all logic: data singletons, rendering, exercises, interview sim, TTS
- `frontend/data/accounting-data.json` — glossaries, exercises, interview Q&A (extracted from acct_module.js)

---

## 1. Problem Statement

`accounting.html` is a monolithic file (198 lines of embedded CSS, 472 lines of JS in `acct_module.js`) originally built as a one-shot interview prep tool for a specific Brinks role. It was never refactored to the da-2026 modular architecture. Current issues:

| Problem | Impact |
|---|---|
| All glossary/exercise/interview data hardcoded in JS | Can't update content without editing code |
| Zero state persistence | Exercise answers, chat history, progress — all lost on reload |
| No cloud sync | None of the 3 `sb_*` keys are used; zero Supabase integration |
| No XSS escaping | User answers in simulator/chat injected raw via innerHTML |
| Global functions (`addXP`, `upd`, `save`) are mocked stubs | Dead code; XP system never built |
| No UUID-based records | N/A currently (no persisted records), but will matter for progress tracking |
| Tightly coupled to a single employer (Brinks) | Module should be reusable across all LATAM AP/AR remote roles |
| Inline `onclick` handlers | Fragile, no delegation |

## 2. Target User Profile

**Miguel** — 8th semester Systems Engineering student (CUN) targeting remote LATAM roles:
- AP/AR Specialist / Accounting Associate / Data Entry (US companies hiring LATAM)
- Key skills: Excel (VLOOKUP, XLOOKUP, Pivot Tables, Power Query), reconciliation, payroll tax basics, English professional communication
- Real experience: Brinks cash logistics (reconciliation, discrepancy resolution)
- Competitive edge: tech-driven accounting (automation, Python, data pipelines)

The module must serve **any** AP/AR/Accounting Associate application, not just one company.

## 3. Architecture

### 3.1 HTML Shell (`accounting.html`)
Strip all `<style>` and `<script>` content. Keep only:
- Navbar, hero, stats bar, 6 tabs, panel containers with placeholder divs
- Script loading order: `supabase CDN → supabase-client.js → auth.js → cloud-sync.js → accounting.js`
- CSS link: `css/accounting.css`

### 3.2 CSS (`css/accounting.css`)
Extract existing embedded styles verbatim, then add:
- `.progress-ring` — SVG ring for module completion %
- `.xp-badge` — XP counter with animated pulse on gain
- `.keyword-match` / `.keyword-miss` — color-coded keyword feedback in simulator
- `.scenario-card` — for reconciliation case studies
- `.heatmap-cell` — for daily practice streak heatmap
- Responsive refinements for mobile (existing breakpoints preserved)

### 3.3 Data Layer (`data/accounting-data.json`)
All content extracted from `acct_module.js` into a single JSON file:
```json
{
  "glossary": {
    "payrollCore": [...],
    "taxSystems": [...],
    "reconciliation": [...],
    "adpSpecific": [...]
  },
  "excelVocab": {
    "formulas": [...],
    "features": [...],
    "accounting": [...]
  },
  "eliteScript": [...],
  "exercises": [...],
  "interviewDB": {
    "simulator": [...],
    "starPrep": {
      "behavioral": [...],
      "technical": [...],
      "integrity": [...]
    }
  },
  "resources": [...]
}
```

### 3.4 JS (`js/accounting.js`) — Strict Separation of Concerns

```
┌──────────────────────────────────────────────────┐
│  LAYER 1: Data Singletons (state + I/O)          │
│  ACCT.getProgress(), .saveProgress()             │
│  ACCT.getExerciseLog(), .logExercise()           │
│  ACCT.getChatHistory(), .saveChatHistory()       │
├──────────────────────────────────────────────────┤
│  LAYER 2: Pure Compute (no DOM, no I/O)          │
│  calcModuleStats(), calcStreak(),                │
│  scoreAnswer(), calcKeywordMatch()               │
├──────────────────────────────────────────────────┤
│  LAYER 3: Rendering (DOM only)                   │
│  renderAll(), renderCareer(), renderGlossary(),  │
│  renderExcel(), renderResources(),               │
│  renderSimulator(), renderInterview(),           │
│  renderStats()                                   │
├──────────────────────────────────────────────────┤
│  LAYER 4: Events & Init                          │
│  DOMContentLoaded, cloud:sync_complete,          │
│  tab switching, form handlers, TTS engine,       │
│  event delegation (data-act pattern)             │
└──────────────────────────────────────────────────┘
```

## 4. Data Singleton — `ACCT`

Single singleton with nested sub-stores, all under **one localStorage key** `sb_accounting`:

```javascript
const ACCT = {
  KEY: 'sb_accounting',

  _load() {
    try { return JSON.parse(localStorage.getItem(ACCT.KEY) || '{}'); }
    catch { return {}; }
  },
  _save(state) { localStorage.setItem(ACCT.KEY, JSON.stringify(state)); },

  // ── Progress tracking ──
  getProgress() {
    const s = ACCT._load();
    return s.progress || { xp: 0, exercisesDone: [], glossaryViewed: [], interviewsDone: [], streak: {} };
  },
  saveProgress(p) {
    const s = ACCT._load();
    s.progress = p;
    ACCT._save(s);
  },

  // ── Exercise log (reconciliation / technical questions) ──
  logExercise(exerciseId, correct) {
    const s = ACCT._load();
    if (!s.exerciseLog) s.exerciseLog = [];
    s.exerciseLog.push({
      id: crypto.randomUUID(),
      exerciseId,
      correct,
      date: new Date().toISOString()
    });
    ACCT._save(s);
  },

  // ── Interview simulator chat history ──
  getChatHistory() {
    const s = ACCT._load();
    return s.chatHistory || { qIdx: 0, msgs: [] };
  },
  saveChatHistory(ch) {
    const s = ACCT._load();
    s.chatHistory = ch;
    ACCT._save(s);
  },

  // ── Glossary mastery (words marked as "known") ──
  toggleMastered(wordKey) {
    const s = ACCT._load();
    if (!s.mastered) s.mastered = {};
    s.mastered[wordKey] = !s.mastered[wordKey];
    ACCT._save(s);
  },
  getMastered() {
    const s = ACCT._load();
    return s.mastered || {};
  }
};
```

### Why a single key `sb_accounting`?
- Minimizes SYNC_REGISTRY additions (1 entry vs. 4–5).
- All sub-stores travel as one JSONB payload — atomic sync, no partial state.
- Consistent with how `ruta5`, `e4`, `dojo_stats` already work (opaque state objects).

## 5. Tabs — Feature Set

### Tab 1: 🚀 Ruta de Maestría (Career Path)
**Existing content preserved:** 3-step learning path (ADP Master Tax → Excel for Finance → Python for Audit).
**New enhancements:**
- Progress checkboxes per step (persisted in `sb_accounting.progress`)
- Expandable sub-objectives per step (e.g., "Complete Power Query module" under step 2)
- Completion percentage ring in stats bar
- Direct links to Moodle / Udemy / YouTube resources per step

### Tab 2: 📖 Glosario Contable (Accounting Glossary)
**Existing content preserved:** 4 glossary categories (38 Payroll/Tax terms) + 3 Excel vocab categories (24 terms). Total: 62 terms with EN/ES/phonetic/examples.
**New enhancements:**
- "Mark as mastered ✅" toggle per word (persisted via `ACCT.toggleMastered()`)
- Stats: "32/62 mastered" counter in header
- Filter by mastered/unmastered
- TTS pronunciation preserved (Web Speech API)
- XSS-safe rendering via `_esc()` on all dynamic text

### Tab 3: 📊 Laboratorio Excel (Excel Lab)
**Existing content preserved:** Excel vocabulary engine with category filter pills.
**New enhancements:**
- Interactive mini-exercises per formula (e.g., "What function would you use to find employee 1042's tax rate in a separate table?" → answer: VLOOKUP/XLOOKUP)
- Inline formula syntax reference with collapsible examples
- Link to the 4-RUT Excel Technical Test Simulator for deeper practice

### Tab 4: 🧮 Simulador Técnico (Technical Simulator)
**Existing content preserved:** 3 reconciliation/payroll exercises (Power Query locale, Colombian payroll, folder automation).
**New enhancements:**
- Exercise log with timestamp + correct/incorrect (persisted via `ACCT.logExercise()`)
- Score display: "2/3 correct" with accuracy %
- Retry functionality (clear answer, try again)
- Add 3–5 more exercises covering:
  - Bank reconciliation scenario (match outstanding checks)
  - AP aging bucket classification (Current / 30 / 60 / 90 / 120+)
  - Journal entry completion (debit/credit matching)
  - Variance analysis (budget vs. actual with threshold flagging)

### Tab 5: 🤖 Entrevista Simulada (Interview Simulator)
**Existing content preserved:** Chat-based recruiter simulation with 7 Q&A (keyword matching, model answers, tips).
**New enhancements:**
- Chat history persisted in `sb_accounting.chatHistory` (survives page reload)
- Keyword matches highlighted in green/red inline (not just a count)
- Score summary per session: keywords hit rate, STAR structure detection
- "Practice Again" clears history and restarts from Q1

### Tab 6: 🎯 STAR Interview Prep
**Existing content preserved:** 7 STAR-method Q&A across 3 categories (behavioral/technical/integrity), collapsible model answers, TTS.
**New enhancements:**
- "Practiced ✅" toggle per question (persisted)
- Stats: "4/7 practiced" counter
- Self-rating (1–5 confidence) per question, tracked over time

## 6. Stats Bar

| Metric | Source | Format |
|---|---|---|
| Glossary Mastery | `mastered` object keys count / total terms | `32/62` |
| Exercises | `exerciseLog` correct count / total attempts | `8/12 ✅` |
| XP | `progress.xp` (earned from exercises + interview) | `245 XP` |
| Streak | `progress.streak` (days with at least 1 activity) | `5🔥` |

## 7. Cloud Sync Integration

- Add `'sb_accounting'` to `SYNC_REGISTRY` in `cloud-sync.js` (1-line edit).
- `cloud:sync_complete` event listener → calls `renderAll()`.
- localStorage proxy already intercepts writes and auto-pushes.
- Single key means atomic sync — no partial state issues.

## 8. XSS Protection

All user-generated text rendered via `_esc()`:
```javascript
function _esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
```
Applies to: chat simulator answers, exercise inputs, any future user-generated content.

## 9. TTS Engine

Preserved from current implementation. Refactored into the IIFE:
- `initTTS()` — load US English voice
- `speak(text, btn)` — cancel previous, play new, toggle `.playing` class
- Used across glossary words, interview questions, model answers, elite script

## 10. Migration from `acct_module.js`

| Current | After Refactor |
|---|---|
| `acct_module.js` (472 lines, global scope) | `js/accounting.js` (IIFE namespace `ACCT`) + `data/accounting-data.json` |
| Data hardcoded in JS | Data in JSON (fetched at init) |
| Zero persistence | Full state in `sb_accounting` + cloud sync |
| Global `addXP()`, `upd()`, `save()` stubs | Real XP system in `ACCT.progress` |
| `onclick="..."` inline handlers | `data-act` delegated events |
| No XSS protection | `_esc()` on all user text |
| Single-employer focus (Brinks) | Reusable across all AP/AR roles |
| `acct_module.js` kept on disk | Deleted after migration verified |

## 11. File Sizes (estimated)

- `accounting.html` — ~80 lines (pure HTML shell)
- `css/accounting.css` — ~130 lines (extracted + new classes)
- `js/accounting.js` — ~450 lines (singleton + compute + 6 render functions + events + TTS)
- `data/accounting-data.json` — ~350 lines (all content data)

## 12. Execution Steps

1. Create `frontend/data/accounting-data.json` — extract all glossary, exercise, interview data from `acct_module.js`
2. Create `frontend/css/accounting.css` — extract embedded styles + add new enhancement classes
3. Create `frontend/js/accounting.js` — IIFE with 4 layers, fetches JSON, singleton, renders
4. Rewrite `frontend/accounting.html` — clean shell with link/script tags
5. Add `'sb_accounting'` to `SYNC_REGISTRY` in `cloud-sync.js`
6. Delete `frontend/acct_module.js` (legacy)
7. Verify in preview, run smoke tests
8. Stage all files, commit, push
9. Provide QA test checklist

---

**AWAITING APPROVAL TO EXECUTE.**
