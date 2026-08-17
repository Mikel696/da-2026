# PLAN: Objetivos & Hábitos — Separated Architecture Refactor

**Status:** PENDING APPROVAL
**Target files:**
- `frontend/goals.html` — rewrite as clean HTML shell (zero embedded JS/CSS)
- `frontend/css/goals.css` — extracted + enhanced styles
- `frontend/js/goals.js` — all logic, data singletons, rendering

---

## 1. Problem Statement

`goals.html` is a monolithic file (~220 lines) with embedded `<style>` and `<script>` blocks. It lacks:
- UUID-based records (currently index-based splice/delete — fragile)
- `cloud:sync_complete` listener (cloud pull doesn't trigger re-render)
- XSS escaping on user input
- Proper data singleton pattern (bare functions, no namespace)
- Separated concerns (CSS/JS mixed into HTML)

The module already works and uses `sb_goals`, `sb_habits`, `sb_reviews` keys — all already in `SYNC_REGISTRY` and syncing to Supabase JSONB.

## 2. Architecture

### 2.1 HTML Shell (`goals.html`)
Strip all `<style>` and `<script>` content. Keep only:
- Navbar, hero, stats bar, tabs, panel containers
- Form inputs for goals/habits/reviews
- Script loading order: `supabase CDN → supabase-client.js → auth.js → cloud-sync.js → goals.js`
- CSS link: `css/goals.css`

### 2.2 CSS (`css/goals.css`)
Extract existing embedded styles verbatim, then add:
- `.goal-category` badge (color-coded by period: 30=red, 60=amber, 90=violet)
- `.habit-heatmap` — 7-day mini heatmap with intensity gradient
- `.streak-badge` — animated fire badge for streaks >= 7
- `.review-card` — slightly enhanced weekly review card
- Responsive refinements for mobile

### 2.3 JS (`js/goals.js`) — Strict Separation of Concerns

```
┌─────────────────────────────────────────────┐
│  LAYER 1: Data Singletons (state + I/O)     │
│  GOALS.getAll(), .save(), .add(), .del()    │
│  HABITS.getAll(), .save(), .add(), .del()   │
│  REVIEWS.getAll(), .save(), .add()          │
├─────────────────────────────────────────────┤
│  LAYER 2: Pure Compute (no DOM, no I/O)     │
│  calcGoalStats(), calcStreak(),             │
│  calcHabitCompletion(), getDaysLeft()       │
├─────────────────────────────────────────────┤
│  LAYER 3: Rendering (DOM only)              │
│  renderAll(), renderGoals(), renderHabits(),│
│  renderReviews(), renderStats()             │
├─────────────────────────────────────────────┤
│  LAYER 4: Events & Init                     │
│  DOMContentLoaded, cloud:sync_complete,     │
│  tab switching, form handlers               │
└─────────────────────────────────────────────┘
```

## 3. Data Singletons

### GOALS Singleton
```javascript
const GOALS = {
  _key: 'sb_goals',
  getAll()  { return JSON.parse(localStorage.getItem(this._key) || '[]'); },
  save(arr) { localStorage.setItem(this._key, JSON.stringify(arr)); },
  add(goal) {
    const all = this.getAll();
    all.push({ ...goal, id: crypto.randomUUID(), created: _today(), done: false, progress: 0 });
    this.save(all);
  },
  del(id)   { this.save(this.getAll().filter(g => g.id !== id)); },
  update(id, patch) {
    const all = this.getAll();
    const idx = all.findIndex(g => g.id === id);
    if (idx >= 0) { Object.assign(all[idx], patch); this.save(all); }
  }
};
```

### HABITS Singleton
```javascript
const HABITS = {
  _key: 'sb_habits',
  getAll()  { return JSON.parse(localStorage.getItem(this._key) || '[]'); },
  save(arr) { localStorage.setItem(this._key, JSON.stringify(arr)); },
  add(habit) {
    const all = this.getAll();
    all.push({ ...habit, id: crypto.randomUUID(), log: {} });
    this.save(all);
  },
  del(id)   { this.save(this.getAll().filter(h => h.id !== id)); },
  toggle(id, day) {
    const all = this.getAll();
    const h = all.find(x => x.id === id);
    if (h) { if (!h.log) h.log = {}; h.log[day] = !h.log[day]; this.save(all); }
  }
};
```

### REVIEWS Singleton
```javascript
const REVIEWS = {
  _key: 'sb_reviews',
  getAll()  { return JSON.parse(localStorage.getItem(this._key) || '[]'); },
  save(arr) { localStorage.setItem(this._key, JSON.stringify(arr)); },
  add(text) {
    const all = this.getAll();
    all.push({ id: crypto.randomUUID(), text, date: new Date().toISOString() });
    this.save(all);
  }
};
```

## 4. Pure Compute Functions

| Function | Input | Output | Notes |
|---|---|---|---|
| `calcGoalStats(goals)` | goal[] | `{total, done, active, pctComplete}` | For stats bar |
| `getDaysLeft(deadline)` | ISO string | number | Negative = overdue |
| `goalColor(goal)` | goal obj | CSS color string | green=done, red<7d, amber<15d, violet=default |
| `calcStreak(log)` | `{date: bool}` | number | Walk backwards from today |
| `calcHabitCompletion(habits)` | habit[] | `{todayDone, todayTotal, pct}` | Today's completion rate |
| `calcMaxStreak(habits)` | habit[] | number | Max across all habits |

## 5. Migration — `migrateGoalsAndHabits()`

Existing data uses array-index addressing. Backfill UUIDs:

```javascript
function migrateGoalsAndHabits() {
  // Goals: add id if missing
  const goals = GOALS.getAll();
  let changed = false;
  goals.forEach(g => { if (!g.id) { g.id = crypto.randomUUID(); changed = true; } });
  if (changed) GOALS.save(goals);

  // Habits: add id if missing
  const habits = HABITS.getAll();
  changed = false;
  habits.forEach(h => { if (!h.id) { h.id = crypto.randomUUID(); changed = true; } });
  if (changed) HABITS.save(habits);

  // Reviews: add id if missing
  const reviews = REVIEWS.getAll();
  changed = false;
  reviews.forEach(r => { if (!r.id) { r.id = crypto.randomUUID(); changed = true; } });
  if (changed) REVIEWS.save(reviews);
}
```

## 6. Cloud Sync Integration

- `cloud:sync_complete` event listener → calls `renderAll()`
- No changes needed to `cloud-sync.js` — `sb_goals`, `sb_habits`, `sb_reviews` already in SYNC_REGISTRY
- localStorage proxy already intercepts writes and auto-pushes

## 7. XSS Protection

All user-generated text rendered via `_esc()` helper (same pattern as notes.js):
```javascript
function _esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
```

## 8. Enhancements Over Current Version

| Feature | Current | After Refactor |
|---|---|---|
| Record identity | Array index | UUID |
| Delete safety | `splice(i,1)` — shifts indices | `filter(id !== target)` — stable |
| Cloud re-render | None | `cloud:sync_complete` → `renderAll()` |
| XSS | None | `_esc()` on all user text |
| Architecture | Monolithic | Shell + CSS + JS |
| Review dates | `toLocaleDateString()` | ISO string + formatted display |
| Streaks | Basic count | Count + streak badge animation >= 7 |
| Stats | Basic | Completion rate + max streak |

## 9. File Sizes (estimated)
- `goals.html` — ~70 lines (pure HTML shell)
- `css/goals.css` — ~120 lines (extracted + enhancements)
- `js/goals.js` — ~280 lines (3 singletons + compute + render + events)

## 10. Execution Steps
1. Create `frontend/css/goals.css` — extract + enhance
2. Create `frontend/js/goals.js` — singletons, compute, render, events
3. Rewrite `frontend/goals.html` — clean shell with link/script tags
4. Stage all 3 files, commit, push
5. Provide QA test checklist

---

**AWAITING APPROVAL TO EXECUTE.**
