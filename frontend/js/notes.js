/* ═══════════════════════════════════════════════════════════════
   DA-2026 · Notes & Journal — Logic & Rendering
   ─────────────────────────────────────────────────────────────
   Data: localStorage 'sb_notes2' → proxy auto-syncs to app_state
   Depends on: cloud-sync.js (proxy already active)
═══════════════════════════════════════════════════════════════ */


/* ══════════════════════════════════════════════════════════════
   SECTION 1 — Constants
══════════════════════════════════════════════════════════════ */

const ALL_TAGS = [
  { id: 'study',    label: '📚 Estudio',   cls: 'tag-study' },
  { id: 'sql',      label: '🗃️ SQL',       cls: 'tag-sql' },
  { id: 'python',   label: '🐍 Python',    cls: 'tag-python' },
  { id: 'idea',     label: '💡 Idea',      cls: 'tag-idea' },
  { id: 'work',     label: '💼 Trabajo',   cls: 'tag-work' },
  { id: 'personal', label: '🏠 Personal',  cls: 'tag-personal' },
];


/* ══════════════════════════════════════════════════════════════
   SECTION 2 — NOTES Data Layer (no DOM)
══════════════════════════════════════════════════════════════ */

const NOTES = {
  KEY: 'sb_notes2',

  getAll()  { try { return JSON.parse(localStorage.getItem(NOTES.KEY) || '[]'); } catch { return []; } },
  save(arr) { localStorage.setItem(NOTES.KEY, JSON.stringify(arr)); },

  add(note) {
    const all = NOTES.getAll();
    all.push({ id: crypto.randomUUID(), pinned: false, ...note, date: new Date().toISOString() });
    NOTES.save(all);
    return all;
  },

  del(id) {
    const all = NOTES.getAll().filter(n => n.id !== id);
    NOTES.save(all);
    return all;
  },

  pin(id) {
    const all = NOTES.getAll();
    const n = all.find(x => x.id === id);
    if (n) n.pinned = !n.pinned;
    NOTES.save(all);
    return all;
  },

  update(id, fields) {
    const all = NOTES.getAll();
    const n = all.find(x => x.id === id);
    if (n) Object.assign(n, fields);
    NOTES.save(all);
    return all;
  }
};


/* ══════════════════════════════════════════════════════════════
   SECTION 3 — Pure Computation (no DOM)
══════════════════════════════════════════════════════════════ */

function calcNoteStats(allNotes) {
  const notes = allNotes.filter(n => n.type === 'note');
  const journals = allNotes.filter(n => n.type === 'journal');
  const words = allNotes.reduce((s, n) => s + (n.body || '').split(/\s+/).filter(Boolean).length, 0);

  // Journal streak
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 365; i++) {
    const key = d.toISOString().split('T')[0];
    if (journals.some(j => j.date && j.date.startsWith(key))) streak++;
    else if (i > 0) break;
    d.setDate(d.getDate() - 1);
  }

  return { noteCount: notes.length, journalCount: journals.length, words, streak };
}

function filterNotes(allNotes, search, tagFilter) {
  let notes = allNotes.filter(n => n.type === 'note');
  if (search) {
    const q = search.toLowerCase();
    notes = notes.filter(n => ((n.title || '') + (n.body || '')).toLowerCase().includes(q));
  }
  if (tagFilter && tagFilter !== 'all') {
    notes = notes.filter(n => n.tags && n.tags.includes(tagFilter));
  }
  // Pinned first, then reverse chronological
  const pinned = notes.filter(n => n.pinned);
  const rest = notes.filter(n => !n.pinned);
  return [...pinned.reverse(), ...rest.reverse()];
}


/* ══════════════════════════════════════════════════════════════
   SECTION 4 — Rendering
══════════════════════════════════════════════════════════════ */

let _selectedTags = [];
let _filterTag = 'all';

function renderAll() {
  const all = NOTES.getAll();
  renderStats(all);
  renderNotesList(all);
  renderJournal(all);
}

/* ── Stats ── */
function renderStats(allNotes) {
  const s = calcNoteStats(allNotes);
  document.getElementById('sN').textContent = s.noteCount;
  document.getElementById('sJ').textContent = s.journalCount;
  document.getElementById('sW').textContent = s.words > 999 ? (s.words / 1000).toFixed(1) + 'K' : s.words;
  document.getElementById('sS').textContent = s.streak + '🔥';
}

/* ── Notes list (search + filter + pin) ── */
function renderNotesList(allNotes) {
  const search = document.getElementById('searchInp')?.value || '';
  const notes = filterNotes(allNotes || NOTES.getAll(), search, _filterTag);
  const el = document.getElementById('notesList');

  if (!notes.length) {
    const msg = (search || _filterTag !== 'all')
      ? 'Sin resultados para esta búsqueda.'
      : 'Sin notas aún. Crea tu primera nota.';
    el.innerHTML = '<div style="text-align:center;padding:30px;color:var(--t3);font-size:12px">' + msg + '</div>';
    return;
  }

  el.innerHTML = notes.map(n => {
    const dateStr = new Date(n.date).toLocaleDateString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    const tagsHtml = (n.tags && n.tags.length)
      ? '<div class="tags">' + n.tags.map(t => {
          const tag = ALL_TAGS.find(x => x.id === t);
          return tag ? '<span class="tag ' + tag.cls + '">' + tag.label + '</span>' : '';
        }).join('') + '</div>'
      : '';
    const pinCls = n.pinned ? ' pinned' : '';
    const pinIcon = n.pinned ? '📌' : '📍';
    return '<div class="note' + pinCls + '">' +
      '<button class="note-pin" data-pin="' + n.id + '">' + pinIcon + '</button>' +
      '<button class="note-del" data-ndel="' + n.id + '">✕</button>' +
      '<div class="note-h"><div class="note-title">' + _esc(n.title) + '</div><div class="note-date">' + dateStr + '</div></div>' +
      tagsHtml +
      '<div class="note-body">' + _esc(n.body) + '</div></div>';
  }).join('');
}

/* ── Journal ── */
function renderJournal(allNotes) {
  const journals = (allNotes || NOTES.getAll()).filter(n => n.type === 'journal').reverse();
  const el = document.getElementById('journalList');

  // Load today's entry into textarea
  const today = new Date().toISOString().split('T')[0];
  const todayJ = journals.find(j => j.date && j.date.startsWith(today));
  const jBody = document.getElementById('jBody');
  if (todayJ && jBody && !jBody.dataset.edited) {
    jBody.value = todayJ.body;
  }

  el.innerHTML = journals.length ? journals.map(j =>
    '<div class="note"><div class="note-h"><div class="note-title">📓 ' + _esc(j.title) + '</div>' +
    '<div class="note-date">' + new Date(j.date).toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' }) + '</div></div>' +
    '<div class="note-body">' + _esc(j.body) + '</div></div>'
  ).join('') : '<div style="text-align:center;padding:20px;color:var(--t3);font-size:12px">Sin entradas de journal.</div>';
}

/* ── HTML escape ── */
function _esc(s) {
  const d = document.createElement('div');
  d.textContent = s || '';
  return d.innerHTML;
}


/* ══════════════════════════════════════════════════════════════
   SECTION 5 — Event Bindings
══════════════════════════════════════════════════════════════ */

/* ── Tabs ── */
document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach(x => x.classList.remove('on'));
  document.querySelectorAll('.pnl').forEach(x => x.classList.remove('on'));
  t.classList.add('on');
  document.getElementById('p-' + t.dataset.p).classList.add('on');
}));

/* ── Tag picker (new note form) ── */
document.getElementById('tagPicker').innerHTML = ALL_TAGS.map(t =>
  '<span class="tag ' + t.cls + '" data-tid="' + t.id + '">' + t.label + '</span>'
).join('');

document.getElementById('tagPicker').addEventListener('click', (e) => {
  const el = e.target.closest('[data-tid]');
  if (!el) return;
  const id = el.dataset.tid;
  const idx = _selectedTags.indexOf(id);
  if (idx >= 0) { _selectedTags.splice(idx, 1); el.classList.remove('on'); }
  else { _selectedTags.push(id); el.classList.add('on'); }
});

/* ── Filter tags (all notes panel) ── */
document.getElementById('filterTags').innerHTML =
  '<span class="ftag on" data-f="all">Todas</span>' +
  ALL_TAGS.map(t => '<span class="ftag" data-f="' + t.id + '">' + t.label + '</span>').join('');

document.getElementById('filterTags').addEventListener('click', (e) => {
  const el = e.target.closest('[data-f]');
  if (!el) return;
  _filterTag = el.dataset.f;
  document.querySelectorAll('.ftag').forEach(x => x.classList.remove('on'));
  el.classList.add('on');
  renderNotesList();
});

/* ── Search ── */
document.getElementById('searchInp').addEventListener('input', () => renderNotesList());

/* ── Save note ── */
document.getElementById('btnSaveNote').addEventListener('click', () => {
  const title = document.getElementById('nTitle').value.trim();
  const body = document.getElementById('nBody').value.trim();
  if (!body) return alert('Escribe algo en la nota');

  NOTES.add({ title: title || 'Sin título', body, tags: [..._selectedTags], type: 'note' });

  // Clear form
  document.getElementById('nTitle').value = '';
  document.getElementById('nBody').value = '';
  _selectedTags = [];
  document.querySelectorAll('#tagPicker .tag').forEach(t => t.classList.remove('on'));

  renderAll();
});

/* ── Clear note form ── */
document.getElementById('btnClearNote').addEventListener('click', () => {
  document.getElementById('nTitle').value = '';
  document.getElementById('nBody').value = '';
  _selectedTags = [];
  document.querySelectorAll('#tagPicker .tag').forEach(t => t.classList.remove('on'));
});

/* ── Save journal ── */
document.getElementById('btnSaveJournal').addEventListener('click', () => {
  const body = document.getElementById('jBody').value.trim();
  if (!body) return;

  const today = new Date().toISOString().split('T')[0];
  const all = NOTES.getAll();
  const existing = all.find(n => n.type === 'journal' && n.date && n.date.startsWith(today));

  if (existing) {
    existing.body = body;
    NOTES.save(all);
  } else {
    NOTES.add({
      title: 'Journal — ' + new Date().toLocaleDateString('es', { day: 'numeric', month: 'short' }),
      body,
      tags: ['personal'],
      type: 'journal'
    });
  }

  document.getElementById('jBody').dataset.edited = '';
  renderAll();
});

/* ── Mark journal textarea as user-edited ── */
document.getElementById('jBody').addEventListener('input', function() {
  this.dataset.edited = '1';
});

/* ── Journal date label ── */
document.getElementById('journalDate').textContent =
  new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

/* ── Delete note (event delegation) ── */
document.addEventListener('click', (e) => {
  const del = e.target.closest('[data-ndel]');
  if (del) { NOTES.del(del.dataset.ndel); renderAll(); return; }

  const pin = e.target.closest('[data-pin]');
  if (pin) { NOTES.pin(pin.dataset.pin); renderAll(); return; }
});

/* ── Cloud sync re-render ── */
window.addEventListener('cloud:sync_complete', () => renderAll());


/* ══════════════════════════════════════════════════════════════
   SECTION 6 — Initialization
══════════════════════════════════════════════════════════════ */

function migrateNotes() {
  const notes = NOTES.getAll();
  let changed = false;
  for (const n of notes) {
    if (!n.id) { n.id = crypto.randomUUID(); changed = true; }
    if (n.pinned === undefined) { n.pinned = false; changed = true; }
  }
  if (changed) NOTES.save(notes);
}

migrateNotes();
renderAll();
