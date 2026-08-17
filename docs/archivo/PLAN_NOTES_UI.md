# PLAN_NOTES_UI.md — Notes & SRS Flashcards Module Refactor

> **Status:** DRAFT — Awaiting human operator "Approved" before implementation.
> **Goal:** Refactor notes.html into separated architecture + add SRS flashcard engine with Leitner algorithm.

---

## 1. Current State Assessment

### notes.html (monolithic, ~200 lines)
- Embedded CSS (~50 lines) + HTML shell (~60 lines) + inline JS (~90 lines)
- 4 tabs: Nueva Nota, Todas, Journal, Prompts Cerebro
- Tags: study, sql, python, idea, work, personal, journal
- Data: `sb_notes2` — array of `{title, body, tags[], date, type:'note'|'journal'}`
- Stats: total notes, journal count, word count, daily streak
- Search + tag filter on "Todas" tab
- No IDs on notes — delete by index (fragile)

### english.html SRS system (embedded in refactor_srs.py)
- `eng_srs_deck` — array of cards with SRS state `{interval, ease, reps}`
- Seed data: `data/srs_deck.json` — 16 cards `{q, a, h (category hint), d (description)}`
- SM-2-like algorithm: ease factor adjusts per rating (hard/good/easy)
- Review scheduling based on `interval` in days

### What needs improvement:
- No separation of concerns — everything embedded in HTML
- Notes lack `id` field — fragile index-based deletion
- No SRS tab in notes module — flashcards only exist in english.html
- No Leitner box visualization
- Journal lacks mood/energy rating
- No pinned/favorite notes
- No export capability
- No `cloud:sync_complete` listener

---

## 2. Architecture: Separated Files

```
frontend/
  notes.html              — HTML shell (structure only)
  css/notes.css           — Extracted + enhanced styles
  js/notes.js             — Notes + Journal logic & rendering
  js/srs.js               — SRS engine: Leitner algorithm + review UI
  data/srs_deck.json      — Seed flashcards (existing, unchanged)
```

### Script loading order in notes.html:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="js/supabase-client.js"></script>
<script src="js/auth.js"></script>
<script src="js/cloud-sync.js"></script>
<script src="js/notes.js"></script>
<script src="js/srs.js"></script>
```

---

## 3. Data Layer

### 3A. NOTES singleton (notes.js)

```javascript
const NOTES = {
  KEY: 'sb_notes2',
  getAll()  { ... },   // parse localStorage
  save(arr) { ... },   // write to localStorage (proxy auto-syncs)
  add(note) { ... },   // push with crypto.randomUUID()
  del(id)   { ... },   // filter by ID
  get(id)   { ... },   // find by ID
  update(id, fields) { ... },  // merge fields into existing note
  pin(id)   { ... },   // toggle pinned flag
};
```

### Note schema (enhanced):
```javascript
{
  id:     string,           // crypto.randomUUID() — NEW
  title:  string,           // note title
  body:   string,           // content
  tags:   string[],         // ['study', 'sql', ...]
  date:   ISO8601,          // creation timestamp
  type:   'note' | 'journal',
  pinned: boolean           // NEW — sticky to top
}
```

### 3B. SRS singleton (srs.js)

```javascript
const SRS = {
  KEY: 'eng_srs_deck',
  getAll()    { ... },
  save(arr)   { ... },
  addCard(c)  { ... },    // add custom card
  delCard(id) { ... },
  getDue()    { ... },    // cards due for review (today)
  rate(id, quality) { ... }, // apply Leitner rating
  loadSeed()  { ... },    // merge from data/srs_deck.json
};
```

### Card schema:
```javascript
{
  id:       string,         // crypto.randomUUID()
  q:        string,         // question (English)
  a:        string,         // answer (Spanish)
  h:        string,         // category/hint
  d:        string,         // description/context
  // Leitner state:
  box:      number,         // 1-5 (Leitner box)
  interval: number,         // days until next review
  ease:     number,         // ease factor (starts 2.5)
  reps:     number,         // successful review count
  nextReview: ISO8601,      // scheduled review date
  lastReview: ISO8601 | null
}
```

---

## 4. Leitner Algorithm (srs.js — pure computation)

### Box system:
| Box | Interval | Description |
|-----|----------|-------------|
| 1   | 1 day    | New / Failed cards |
| 2   | 3 days   | Learning |
| 3   | 7 days   | Review |
| 4   | 14 days  | Familiar |
| 5   | 30 days  | Mastered |

### Rating logic:
```
rate(card, quality):
  if quality === 'hard':
    card.box = 1                    // reset to box 1
    card.interval = 1
    card.ease = max(1.3, card.ease - 0.2)
    card.reps = 0
  if quality === 'good':
    card.box = min(5, card.box + 1)
    card.interval = BOX_INTERVALS[card.box]
    card.ease = card.ease           // unchanged
    card.reps += 1
  if quality === 'easy':
    card.box = min(5, card.box + 2) // skip a box
    card.interval = BOX_INTERVALS[card.box]
    card.ease = card.ease + 0.15
    card.reps += 1
  card.nextReview = today + interval days
  card.lastReview = today
```

### Due cards:
```
getDue(): return cards where new Date(card.nextReview) <= today
```

---

## 5. UI Tabs (6 total)

### Tab 1: ✏️ Nueva Nota (existing, enhanced)
- Title input + textarea body
- Tag picker (clickable pills: study, sql, python, idea, work, personal)
- **💾 Guardar** button
- Shows last 5 notes below (quick preview)

### Tab 2: 📋 Todas (existing, enhanced)
- Search bar (real-time filter by title + body)
- Tag filter row (click to toggle)
- Notes list: pinned first, then reverse chronological
- Each note card: title, tags, date, body preview (truncated), pin button, delete button
- Click note → expand inline to full body

### Tab 3: 📓 Journal (existing, enhanced)
- Today's entry form: textarea + save
- Previous entries (reverse chrono)
- Daily streak counter

### Tab 4: 🧠 Flashcards (NEW)
- **Review mode:** Shows due cards count → start review
  - Card front (question) → tap to flip → card back (answer)
  - Three rating buttons: 😰 Hard | 🤔 Good | 😎 Easy
  - Progress bar: "3 of 12 reviewed"
- **Deck overview:** All cards listed by Leitner box
  - Box visualization: 5 columns showing card counts
  - Color-coded: Box 1 (red) → Box 5 (green)

### Tab 5: ➕ Nueva Carta (NEW)
- Add custom flashcard: front (q), back (a), category (h), hint (d)
- Import from seed deck button
- Shows total deck size

### Tab 6: 🔮 Prompts Cerebro (existing, unchanged)
- Pre-configured prompt protocols (P0–P12)
- Copy-to-clipboard functionality

---

## 6. Rendering Layer

### notes.js render functions:
| Function | Target | Description |
|----------|--------|-------------|
| `renderAll()` | — | Master orchestrator |
| `renderStats()` | `#stats` | 4 stat boxes (notes, journal, words, streak) |
| `renderNewNote()` | `#recentPreview` | Last 5 notes below form |
| `renderNotesList()` | `#notesList` | All notes with search + filter |
| `renderJournal()` | `#journalList` | Journal entries |

### srs.js render functions:
| Function | Target | Description |
|----------|--------|-------------|
| `renderSrsAll()` | — | SRS master orchestrator |
| `renderReview()` | `#reviewArea` | Current card + flip + rating buttons |
| `renderBoxes()` | `#boxViz` | 5-box Leitner visualization |
| `renderDeckList()` | `#deckList` | All cards grouped by box |
| `renderAddCard()` | — | Form feedback |

---

## 7. CSS Extraction (notes.css)

Extract ~50 lines of embedded styles from notes.html + add new classes:

| Class | Purpose |
|-------|---------|
| `.search-bar` | Search input with icon |
| `.note-pin` | Pin toggle button |
| `.note.pinned` | Pinned note highlight (left accent border) |
| `.note-expand` | Expanded note body |
| `.srs-card` | Flashcard container (flip animation) |
| `.srs-front, .srs-back` | Card faces |
| `.srs-card.flipped` | CSS flip transform |
| `.srs-rating` | Rating button row |
| `.box-viz` | 5-column Leitner box display |
| `.box-col` | Individual box column |
| `.box-count` | Card count badge per box |

---

## 8. Migration: Backward Compatibility

### Notes (sb_notes2):
Existing notes lack `id` and `pinned` fields. On init:
```javascript
function migrateNotes() {
  const notes = NOTES.getAll();
  let changed = false;
  for (const n of notes) {
    if (!n.id) { n.id = crypto.randomUUID(); changed = true; }
    if (n.pinned === undefined) { n.pinned = false; changed = true; }
  }
  if (changed) NOTES.save(notes);
}
```

### SRS deck (eng_srs_deck):
Existing cards from refactor_srs.py have `{interval, ease, reps}` but lack `id`, `box`, `nextReview`. On init:
```javascript
function migrateSrs() {
  const deck = SRS.getAll();
  let changed = false;
  for (const c of deck) {
    if (!c.id) { c.id = crypto.randomUUID(); changed = true; }
    if (c.box === undefined) {
      c.box = c.reps >= 4 ? 5 : c.reps >= 2 ? 3 : 1;
      changed = true;
    }
    if (!c.nextReview) {
      c.nextReview = new Date().toISOString().slice(0, 10);
      changed = true;
    }
  }
  if (changed) SRS.save(deck);
}
```

### Seed deck merge:
On first load, `SRS.loadSeed()` fetches `data/srs_deck.json`, deduplicates by `q` field, and merges new cards into the deck with default Leitner state (box=1, interval=1, ease=2.5, reps=0).

---

## 9. Implementation Steps

| # | Task | Files |
|---|------|-------|
| 1 | Extract CSS from notes.html → `css/notes.css` + new SRS classes | `frontend/css/notes.css` |
| 2 | Rewrite notes.html as shell: 6 tabs, link CSS, script tags | `frontend/notes.html` |
| 3 | Write `notes.js`: NOTES data layer + pure compute + rendering + events | `frontend/js/notes.js` |
| 4 | Write `srs.js`: SRS data layer + Leitner algorithm + review UI + deck management | `frontend/js/srs.js` |
| 5 | Add `migrateNotes()` and `migrateSrs()` for backward compat | Both JS files |
| 6 | Add `cloud:sync_complete` listener for re-render | Both JS files |
| 7 | Test: create note, search, filter, pin, journal entry | Manual F12 |
| 8 | Test: review flashcard, rate hard/good/easy, verify box advancement | Manual F12 |

---

## 10. What stays unchanged

- **Cloud sync** — `sb_notes2` and `eng_srs_deck` already in `SYNC_REGISTRY`. localStorage proxy handles everything. Zero changes to `cloud-sync.js`.
- **`data/srs_deck.json`** — Seed deck stays as-is (16 cards).
- **Prompts Cerebro tab** — Copy existing HTML/JS unchanged.
- **Dark theme** — Same design tokens.
- **Other modules** — No changes to finance, jobs, auth, etc.

---

**Awaiting "Approved" to begin implementation.**
