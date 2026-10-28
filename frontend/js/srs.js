/* ═══════════════════════════════════════════════════════════════
   DA-2026 · SRS Flashcard Engine — Leitner 5-Box System
   ─────────────────────────────────────────────────────────────
   Data: localStorage 'eng_srs_deck' → proxy auto-syncs to app_state
   Seed: data/srs_deck.json (16 base cards)
   Algorithm: Leitner boxes 1–5 with SM-2 ease factor adjustment
   Depends on: cloud-sync.js (proxy already active)
═══════════════════════════════════════════════════════════════ */


/* ══════════════════════════════════════════════════════════════
   SECTION 1 — Constants
══════════════════════════════════════════════════════════════ */

const BOX_INTERVALS = { 1: 1, 2: 3, 3: 7, 4: 14, 5: 30 };
const BOX_LABELS = { 1: 'Nuevo', 2: 'Aprendiendo', 3: 'Repaso', 4: 'Familiar', 5: 'Dominado' };
const BOX_COLORS = { 1: 'var(--rd)', 2: 'var(--or)', 3: 'var(--am)', 4: 'var(--cy)', 5: 'var(--gn)' };


/* ══════════════════════════════════════════════════════════════
   SECTION 2 — SRS Data Layer (no DOM)
══════════════════════════════════════════════════════════════ */

const SRS = {
  KEY: 'eng_srs_deck',

  getAll()    { try { return JSON.parse(localStorage.getItem(SRS.KEY) || '[]'); } catch { return []; } },
  save(arr)   { localStorage.setItem(SRS.KEY, JSON.stringify(arr)); },

  addCard(card) {
    const all = SRS.getAll();
    all.push({
      id: crypto.randomUUID(),
      q: card.q || '',
      a: card.a || '',
      h: card.h || '',
      d: card.d || '',
      box: 1,
      interval: 1,
      ease: 2.5,
      reps: 0,
      nextReview: _todayStr(),
      lastReview: null
    });
    SRS.save(all);
    return all;
  },

  delCard(id) {
    const all = SRS.getAll().filter(c => c.id !== id);
    SRS.save(all);
    return all;
  },

  getDue() {
    const today = _todayStr();
    return SRS.getAll().filter(c => !c.nextReview || c.nextReview <= today);
  },

  getBoxCounts() {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const c of SRS.getAll()) counts[c.box || 1]++;
    return counts;
  }
};

function _todayStr() { return new Date().toISOString().slice(0, 10); }


/* ══════════════════════════════════════════════════════════════
   SECTION 3 — Leitner Algorithm (pure computation)
══════════════════════════════════════════════════════════════ */

/**
 * Rate a card and compute its new Leitner state.
 * Returns the mutated card (does NOT save to storage).
 */
function leitnerRate(card, quality) {
  const today = _todayStr();

  if (quality === 'hard') {
    card.box = 1;
    card.interval = 1;
    card.ease = Math.max(1.3, (card.ease || 2.5) - 0.2);
    card.reps = 0;
  } else if (quality === 'good') {
    card.box = Math.min(5, (card.box || 1) + 1);
    card.interval = BOX_INTERVALS[card.box];
    card.reps = (card.reps || 0) + 1;
  } else if (quality === 'easy') {
    card.box = Math.min(5, (card.box || 1) + 2);
    card.interval = BOX_INTERVALS[card.box];
    card.ease = (card.ease || 2.5) + 0.15;
    card.reps = (card.reps || 0) + 1;
  }

  // Schedule next review
  const next = new Date();
  next.setDate(next.getDate() + card.interval);
  card.nextReview = next.toISOString().slice(0, 10);
  card.lastReview = today;

  return card;
}

/**
 * Apply a rating to a card by ID, save, and return updated deck.
 */
function rateCard(id, quality) {
  const all = SRS.getAll();
  const card = all.find(c => c.id === id);
  if (!card) return all;
  leitnerRate(card, quality);
  SRS.save(all);
  return all;
}


/* ══════════════════════════════════════════════════════════════
   SECTION 4 — Seed Deck Loader
══════════════════════════════════════════════════════════════ */

async function loadSeedDeck() {
  try {
    const res = await fetch('data/srs_deck.json');
    if (!res.ok) return 0;
    const seed = await res.json();
    const existing = SRS.getAll();
    const existingQs = new Set(existing.map(c => c.q));
    let added = 0;

    for (const s of seed) {
      if (existingQs.has(s.q)) continue;
      existing.push({
        id: crypto.randomUUID(),
        q: s.q,
        a: s.a,
        h: s.h || '',
        d: s.d || '',
        box: 1,
        interval: 1,
        ease: 2.5,
        reps: 0,
        nextReview: _todayStr(),
        lastReview: null
      });
      added++;
    }

    if (added > 0) SRS.save(existing);
    return added;
  } catch (e) {
    console.warn('[SRS] seed load failed:', e);
    return 0;
  }
}


/* ══════════════════════════════════════════════════════════════
   SECTION 5 — Rendering
══════════════════════════════════════════════════════════════ */

let _reviewQueue = [];
let _reviewIdx = 0;
let _flipped = false;

function renderSrsAll() {
  renderBoxes();
  renderReviewArea();
  renderDeckList();
}

/* ── Leitner box visualization ── */
function renderBoxes() {
  const counts = SRS.getBoxCounts();
  const el = document.getElementById('boxViz');
  el.innerHTML = [1, 2, 3, 4, 5].map(b =>
    '<div class="box-col box-' + b + '">' +
      '<div class="box-num">Box ' + b + '</div>' +
      '<div class="box-count">' + counts[b] + '</div>' +
      '<div class="box-label">' + BOX_LABELS[b] + '</div>' +
      '<div class="box-label" style="margin-top:2px">' + BOX_INTERVALS[b] + 'd</div>' +
    '</div>'
  ).join('');
}

/* ── Review area ── */
function renderReviewArea() {
  const el = document.getElementById('reviewArea');
  const due = SRS.getDue();

  // Not in review mode — show start button
  if (_reviewQueue.length === 0) {
    if (due.length === 0) {
      el.innerHTML = '<div class="cd" style="text-align:center;padding:30px">' +
        '<div style="font-size:24px;margin-bottom:8px">🎉</div>' +
        '<div style="font-size:14px;font-weight:600;margin-bottom:4px">¡Todo al día!</div>' +
        '<div style="font-size:12px;color:var(--t3)">No hay cartas pendientes para repasar.</div></div>';
      return;
    }
    el.innerHTML = '<div class="cd" style="text-align:center;padding:24px">' +
      '<div style="font-size:14px;font-weight:600;margin-bottom:8px">📚 ' + due.length + ' carta' + (due.length > 1 ? 's' : '') + ' pendiente' + (due.length > 1 ? 's' : '') + '</div>' +
      '<button class="btn bp" id="btnStartReview">🧠 Comenzar repaso</button></div>';
    document.getElementById('btnStartReview').addEventListener('click', () => {
      _reviewQueue = [...due];
      _reviewIdx = 0;
      _flipped = false;
      renderReviewArea();
    });
    return;
  }

  // Review in progress
  if (_reviewIdx >= _reviewQueue.length) {
    // Review complete
    el.innerHTML = '<div class="cd" style="text-align:center;padding:30px">' +
      '<div style="font-size:24px;margin-bottom:8px">✅</div>' +
      '<div style="font-size:14px;font-weight:600;margin-bottom:4px">¡Repaso completado!</div>' +
      '<div style="font-size:12px;color:var(--t3)">' + _reviewQueue.length + ' carta' + (_reviewQueue.length > 1 ? 's' : '') + ' repasada' + (_reviewQueue.length > 1 ? 's' : '') + '.</div>' +
      '<button class="btn bo" id="btnReviewDone" style="margin-top:12px">Volver</button></div>';
    document.getElementById('btnReviewDone').addEventListener('click', () => {
      _reviewQueue = [];
      _reviewIdx = 0;
      renderSrsAll();
    });
    return;
  }

  const card = _reviewQueue[_reviewIdx];
  const progress = Math.round((_reviewIdx / _reviewQueue.length) * 100);

  let html = '<div class="srs-progress"><div class="srs-progress-fill" style="width:' + progress + '%"></div></div>';
  html += '<div style="text-align:center;font-size:11px;color:var(--t3);margin-bottom:8px">' +
    (_reviewIdx + 1) + ' de ' + _reviewQueue.length +
    ' · Box ' + (card.box || 1) + ' · ' + (card.h || 'General') + '</div>';

  // Card
  html += '<div class="srs-scene"><div class="srs-card' + (_flipped ? ' flipped' : '') + '" id="srsCard">';
  html += '<div class="srs-front"><div class="srs-q">' + _escSrs(card.q) + '</div>';
  if (card.h) html += '<div class="srs-hint">' + _escSrs(card.h) + '</div>';
  html += '<div class="srs-tap">tap para voltear</div></div>';
  html += '<div class="srs-back"><div class="srs-a">' + _escSrs(card.a) + '</div>';
  if (card.d) html += '<div class="srs-desc">' + _escSrs(card.d) + '</div>';
  html += '</div></div></div>';

  // Rating buttons (only visible when flipped)
  if (_flipped) {
    html += '<div class="srs-rating">' +
      '<button class="btn srs-r-hard" data-rate="hard">😰 Hard (1d)</button>' +
      '<button class="btn srs-r-good" data-rate="good">🤔 Good (' + _goodInterval(card) + 'd)</button>' +
      '<button class="btn srs-r-easy" data-rate="easy">😎 Easy (' + _easyInterval(card) + 'd)</button>' +
    '</div>';
  }

  el.innerHTML = html;

  // Flip on card click
  document.getElementById('srsCard')?.addEventListener('click', () => {
    if (!_flipped) {
      _flipped = true;
      renderReviewArea();
    }
  });

  // Rating buttons
  el.querySelectorAll('[data-rate]').forEach(btn => {
    btn.addEventListener('click', () => {
      rateCard(card.id, btn.dataset.rate);
      _reviewIdx++;
      _flipped = false;
      renderBoxes();
      renderReviewArea();
    });
  });
}

/* Compute preview intervals for rating buttons */
function _goodInterval(card) {
  const nextBox = Math.min(5, (card.box || 1) + 1);
  return BOX_INTERVALS[nextBox];
}
function _easyInterval(card) {
  const nextBox = Math.min(5, (card.box || 1) + 2);
  return BOX_INTERVALS[nextBox];
}

/* ── Deck list ── */
function renderDeckList() {
  const all = SRS.getAll();
  const el = document.getElementById('deckList');

  if (!all.length) {
    el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--t3);font-size:12px">Sin cartas en el deck. Agrega una o importa el deck base.</div>';
    return;
  }

  // Sort by box (ascending), then by nextReview
  const sorted = [...all].sort((a, b) => (a.box || 1) - (b.box || 1) || (a.nextReview || '').localeCompare(b.nextReview || ''));

  el.innerHTML = sorted.map(c => {
    const box = c.box || 1;
    const dueStr = c.nextReview || '—';
    const isDue = !c.nextReview || c.nextReview <= _todayStr();
    return '<div class="srs-row">' +
      '<div class="srs-row-q">' + _escSrs(c.q.length > 60 ? c.q.slice(0, 60) + '…' : c.q) + '</div>' +
      '<div class="srs-row-box" style="background:' + BOX_COLORS[box] + '20;color:' + BOX_COLORS[box] + '">B' + box + '</div>' +
      '<div class="srs-row-due" style="' + (isDue ? 'color:var(--am)' : '') + '">' + dueStr + '</div>' +
      '<button class="srs-row-del" data-cdel="' + c.id + '">✕</button>' +
    '</div>';
  }).join('');
}

function _escSrs(s) {
  const d = document.createElement('div');
  d.textContent = s || '';
  return d.innerHTML;
}


/* ══════════════════════════════════════════════════════════════
   SECTION 6 — Event Bindings
══════════════════════════════════════════════════════════════ */

/* ── Add custom card ── */
document.getElementById('btnAddCard').addEventListener('click', () => {
  const q = document.getElementById('fcQ').value.trim();
  const a = document.getElementById('fcA').value.trim();
  const h = document.getElementById('fcH').value.trim();
  const d = document.getElementById('fcD').value.trim();

  if (!q || !a) return alert('Front y Back son obligatorios');

  SRS.addCard({ q, a, h, d });
  document.getElementById('fcQ').value = '';
  document.getElementById('fcA').value = '';
  document.getElementById('fcH').value = '';
  document.getElementById('fcD').value = '';
  renderSrsAll();
});

/* ── Import seed deck ── */
document.getElementById('btnImportSeed').addEventListener('click', async () => {
  const btn = document.getElementById('btnImportSeed');
  btn.disabled = true;
  btn.textContent = '⏳ Importando...';
  const added = await loadSeedDeck();
  btn.disabled = false;
  btn.textContent = '📥 Importar deck base';
  if (added > 0) {
    alert('✅ ' + added + ' cartas nuevas importadas');
    renderSrsAll();
  } else {
    alert('ℹ️ Todas las cartas del deck base ya están en tu deck');
  }
});

/* ── Delete card (event delegation) ── */
document.addEventListener('click', (e) => {
  const del = e.target.closest('[data-cdel]');
  if (!del) return;
  SRS.delCard(del.dataset.cdel);
  renderSrsAll();
});

/* ── Cloud sync re-render ── */
window.addEventListener('cloud:sync_complete', () => renderSrsAll());


/* ══════════════════════════════════════════════════════════════
   SECTION 7 — Initialization
══════════════════════════════════════════════════════════════ */

function migrateSrs() {
  const deck = SRS.getAll();
  let changed = false;
  for (const c of deck) {
    if (!c.id) { c.id = crypto.randomUUID(); changed = true; }
    if (c.box === undefined) {
      c.box = (c.reps || 0) >= 4 ? 5 : (c.reps || 0) >= 2 ? 3 : 1;
      changed = true;
    }
    if (!c.nextReview) {
      c.nextReview = _todayStr();
      changed = true;
    }
    if (c.ease === undefined) { c.ease = 2.5; changed = true; }
  }
  if (changed) SRS.save(deck);
}

migrateSrs();
renderSrsAll();
