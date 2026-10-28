/* ═══════════════════════════════════════════════════════════════════════
   DA-2026 · 13-NOT · Second Brain Layer (5 phases) · 2026-05-19
   ─────────────────────────────────────────────────────────────────────
   F1 · CLI + Daily Note ........ window.NOT.{create,append,capture,today,...}
   F2 · Wiki-links .............. [[note]] syntax · autocomplete · backlinks
   F3 · Notes → SRS ............. note → flashcard into eng_srs_deck
   F4 · Knowledge Graph Canvas .. radial SVG graph · edges from tags + links
   F5 · Karpathy Organizer ...... heuristic cleanup + deep-reorg prompt
   ─────────────────────────────────────────────────────────────────────
   Storage: sb_notes2 (existing · SYNC_REGISTRY-registered).
            eng_srs_deck (existing · for F3 flashcards).
   Local-first · no external APIs · reuses inline getNotes/setNotes/renderNotes.
   ═══════════════════════════════════════════════════════════════════════ */

const NOT = (() => {
'use strict';

/* ── Storage bridge to inline functions ── */
function getN() { return (typeof window.getNotes === 'function') ? window.getNotes() : (() => { try { return JSON.parse(localStorage.getItem('sb_notes2') || '[]'); } catch { return []; } })(); }
function setN(arr) {
  if (typeof window.setNotes === 'function') window.setNotes(arr);
  else localStorage.setItem('sb_notes2', JSON.stringify(arr));
}
function genId() { return 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function todayStr() { return new Date().toISOString().slice(0, 10); }

/* ── Re-render bridges ── */
function reRender() {
  if (typeof window.renderNotes === 'function') window.renderNotes();
  if (typeof window.updateStats === 'function') window.updateStats();
}

/* ═════════════════════════════════════════════════════════════════════
   F1 · ID MIGRATION + DAILY NOTE + CLI
   ═════════════════════════════════════════════════════════════════════ */
function migrate() {
  const arr = getN();
  let changed = false;
  arr.forEach(n => { if (!n.id) { n.id = genId(); changed = true; } });
  if (changed) setN(arr);
}

const Daily = {
  /* Return today's daily note · lazy-create */
  today(create) {
    const arr = getN();
    let d = arr.find(n => n.type === 'daily' && (n.dayKey === todayStr()));
    if (!d && create) {
      d = {
        id: genId(), type: 'daily', dayKey: todayStr(),
        title: '📅 ' + new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' }),
        body: '', tags: [], date: new Date().toISOString()
      };
      arr.push(d); setN(arr);
    }
    return d || null;
  },
  /* Append a timestamped line to today's daily note */
  capture(text) {
    if (!text || !text.trim()) return null;
    const arr = getN();
    let d = arr.find(n => n.type === 'daily' && n.dayKey === todayStr());
    if (!d) {
      d = { id: genId(), type: 'daily', dayKey: todayStr(), title: '📅 ' + new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' }), body: '', tags: [], date: new Date().toISOString() };
      arr.push(d);
    }
    const hh = new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
    d.body = (d.body ? d.body + '\n' : '') + '[' + hh + '] ' + text.trim();
    d.updated_at = new Date().toISOString();
    setN(arr);
    return d;
  },
  /* Render the daily-note card injected at top of #p-all */
  render() {
    const host = document.getElementById('notDailyCard');
    if (!host) return;
    const d = Daily.today(false);
    const lines = d && d.body ? d.body.split('\n').filter(Boolean) : [];
    let h = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">';
    h += '<div style="font-size:13px;font-weight:600">📅 Nota del día — captura rápida</div>';
    h += '<span style="font-size:10px;color:var(--t3)">' + lines.length + ' capturas hoy</span></div>';
    h += '<div style="display:flex;gap:6px;margin-bottom:6px">';
    h += '<input class="inp" id="notQuickCap" placeholder="Captura algo en 1 línea… (Enter)" style="flex:1">';
    h += '<button class="btn bg" id="notQuickBtn">+ Capturar</button></div>';
    if (lines.length) {
      h += '<div style="background:var(--el);border:1px solid var(--bd);border-radius:var(--radius-sm);padding:8px 10px;max-height:140px;overflow:auto">';
      h += lines.map(l => '<div style="font-size:11px;color:var(--t2);line-height:1.7;font-family:\'IBM Plex Mono\',monospace">' + esc(l) + '</div>').join('');
      h += '</div>';
    } else {
      h += '<div style="font-size:11px;color:var(--t3);font-style:italic">Sin capturas hoy. La nota del día es tu inbox — todo lo que tires acá queda fechado.</div>';
    }
    host.innerHTML = h;
    const inp = document.getElementById('notQuickCap');
    const fire = () => {
      const v = inp.value.trim();
      if (!v) return;
      Daily.capture(v);
      inp.value = '';
      Daily.render();
      reRender();
      toast('Capturado en la nota del día');
    };
    document.getElementById('notQuickBtn').addEventListener('click', fire);
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') fire(); });
  }
};

/* ═════════════════════════════════════════════════════════════════════
   F2 · WIKI-LINKS  [[note title]]
   ═════════════════════════════════════════════════════════════════════ */
const Wiki = {
  LINK_RE: /\[\[([^\]]{1,80})\]\]/g,

  /* All notes that link TO a given title */
  backlinksFor(title) {
    if (!title) return [];
    const t = title.trim().toLowerCase();
    return getN().filter(n => {
      if (!n.body) return false;
      let m, found = false;
      const re = new RegExp(NOT_LINK_SRC, 'gi');
      while ((m = re.exec(n.body))) { if (m[1].trim().toLowerCase() === t) { found = true; break; } }
      return found;
    });
  },

  /* Find a note by (case-insensitive) title */
  byTitle(title) {
    const t = String(title).trim().toLowerCase();
    return getN().find(n => (n.title || '').trim().toLowerCase() === t) || null;
  },

  /* Enrich rendered .note cards: clickable [[links]] + backlinks footer */
  enrich() {
    document.querySelectorAll('.note[data-note-id]').forEach(card => {
      const id = card.getAttribute('data-note-id');
      const note = getN().find(n => n.id === id);
      if (!note) return;
      const bodyEl = card.querySelector('.note-body');
      if (bodyEl && !bodyEl.dataset.wikiDone) {
        bodyEl.innerHTML = bodyEl.innerHTML.replace(Wiki.LINK_RE, (full, name) => {
          const target = Wiki.byTitle(name);
          const cls = target ? 'wikilink' : 'wikilink wikilink-missing';
          return '<span class="' + cls + '" data-wikilink="' + esc(name.trim()) + '">[[' + esc(name.trim()) + ']]</span>';
        });
        bodyEl.dataset.wikiDone = '1';
      }
      /* Backlinks footer */
      if (note.title && !card.querySelector('.note-backlinks')) {
        const bl = Wiki.backlinksFor(note.title).filter(n => n.id !== id);
        if (bl.length) {
          const foot = document.createElement('div');
          foot.className = 'note-backlinks';
          foot.style.cssText = 'margin-top:8px;padding-top:6px;border-top:1px dashed var(--bd);font-size:10px;color:var(--t3)';
          foot.innerHTML = '↩ Mencionada en: ' + bl.map(n => '<span class="wikilink" data-wikilink="' + esc(n.title) + '">' + esc(n.title) + '</span>').join(' · ');
          card.appendChild(foot);
        }
      }
    });
    /* Wire wikilink clicks */
    document.querySelectorAll('[data-wikilink]').forEach(el => {
      if (el.dataset.wired) return;
      el.dataset.wired = '1';
      el.addEventListener('click', () => {
        const name = el.getAttribute('data-wikilink');
        const target = Wiki.byTitle(name);
        if (!target) { toast('No existe una nota titulada "' + name + '"'); return; }
        Wiki.jumpTo(target.id);
      });
    });
  },

  jumpTo(id) {
    switchTab('all');
    setTimeout(() => {
      const card = document.querySelector('.note[data-note-id="' + id + '"]');
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.style.transition = 'box-shadow .3s';
        card.style.boxShadow = '0 0 0 2px var(--ac)';
        setTimeout(() => card.style.boxShadow = '', 1600);
      }
    }, 80);
  },

  /* Autocomplete on the #nBody textarea when typing [[ */
  attachAutocomplete() {
    const ta = document.getElementById('nBody');
    if (!ta || ta.dataset.wikiAc) return;
    ta.dataset.wikiAc = '1';
    let box = null;
    const close = () => { if (box) { box.remove(); box = null; } };
    ta.addEventListener('input', () => {
      const pos = ta.selectionStart;
      const before = ta.value.slice(0, pos);
      const m = before.match(/\[\[([^\]\n]*)$/);
      close();
      if (!m) return;
      const q = m[1].toLowerCase();
      const matches = getN().filter(n => n.type !== 'daily' && (n.title || '').toLowerCase().includes(q)).slice(0, 6);
      if (!matches.length) return;
      box = document.createElement('div');
      box.style.cssText = 'position:absolute;z-index:999;background:var(--c1);border:1px solid var(--bd2);border-radius:var(--radius-sm);box-shadow:0 6px 24px rgba(0,0,0,.5);max-width:280px';
      box.innerHTML = matches.map(n => '<div class="wiki-ac-item" data-t="' + esc(n.title) + '" style="padding:6px 10px;font-size:12px;cursor:pointer;color:var(--t2)">📄 ' + esc(n.title) + '</div>').join('');
      const r = ta.getBoundingClientRect();
      box.style.left = (r.left + 12) + 'px';
      box.style.top = (r.bottom - 8) + 'px';
      document.body.appendChild(box);
      box.querySelectorAll('.wiki-ac-item').forEach(it => {
        it.addEventListener('mousedown', e => {
          e.preventDefault();
          const title = it.getAttribute('data-t');
          const newBefore = before.replace(/\[\[([^\]\n]*)$/, '[[' + title + ']]');
          ta.value = newBefore + ta.value.slice(pos);
          ta.focus();
          ta.selectionStart = ta.selectionEnd = newBefore.length;
          close();
        });
      });
    });
    ta.addEventListener('blur', () => setTimeout(close, 150));
  }
};
/* Regex source kept as string for fresh RegExp instances */
const NOT_LINK_SRC = '\\[\\[([^\\]]{1,80})\\]\\]';

/* ═════════════════════════════════════════════════════════════════════
   F3 · NOTES → SRS PIPELINE
   ═════════════════════════════════════════════════════════════════════ */
const SrsBridge = {
  addCard(q, a, sourceNoteId) {
    let deck = [];
    try { deck = JSON.parse(localStorage.getItem('eng_srs_deck') || '[]'); } catch { deck = []; }
    deck.push({
      id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'c' + Date.now().toString(36),
      q: q || '', a: a || '', h: '', d: 'Desde nota 13-NOT',
      box: 1, interval: 1, ease: 2.5, reps: 0,
      nextReview: todayStr(), lastReview: null,
      sourceNoteId: sourceNoteId || null
    });
    localStorage.setItem('eng_srs_deck', JSON.stringify(deck));
    return deck.length;
  },

  /* Modal: turn a note into a flashcard */
  openEditor(noteId) {
    const note = getN().find(n => n.id === noteId);
    if (!note) return;
    let modal = document.getElementById('notSrsModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'notSrsModal';
      modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.78);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
      document.body.appendChild(modal);
    }
    const bodyExcerpt = (note.body || '').replace(/\[\[|\]\]/g, '').slice(0, 280);
    modal.innerHTML = '<div style="background:var(--c1);border:1px solid var(--bd);border-radius:var(--radius-md);padding:22px;max-width:520px;width:100%">' +
      '<div style="font-size:15px;font-weight:700;margin-bottom:4px">🃏 Crear flashcard</div>' +
      '<div style="font-size:11px;color:var(--t3);margin-bottom:14px">Desde: ' + esc(note.title) + ' · entra al deck SRS Leitner (box 1)</div>' +
      '<label style="font-size:11px;color:var(--t3);text-transform:uppercase;letter-spacing:1px">Pregunta (front)</label>' +
      '<textarea class="txa" id="srsQ" style="width:100%;min-height:60px;margin-bottom:10px">' + esc(note.title) + '</textarea>' +
      '<label style="font-size:11px;color:var(--t3);text-transform:uppercase;letter-spacing:1px">Respuesta (back)</label>' +
      '<textarea class="txa" id="srsA" style="width:100%;min-height:90px;margin-bottom:12px">' + esc(bodyExcerpt) + '</textarea>' +
      '<div style="display:flex;gap:8px;justify-content:flex-end">' +
      '<button class="btn bo" onclick="document.getElementById(\'notSrsModal\').remove()">Cancelar</button>' +
      '<button class="btn bg" id="srsSave">Crear tarjeta</button></div></div>';
    document.getElementById('srsSave').addEventListener('click', () => {
      const q = document.getElementById('srsQ').value.trim();
      const a = document.getElementById('srsA').value.trim();
      if (!q || !a) { toast('Front y back son obligatorios'); return; }
      const count = SrsBridge.addCard(q, a, noteId);
      modal.remove();
      toast('Flashcard creada · deck tiene ' + count + ' tarjetas');
    });
  }
};

/* ═════════════════════════════════════════════════════════════════════
   F4 · KNOWLEDGE GRAPH CANVAS (tag-clustered SVG · rebuilt 2026-05-19)
   ─────────────────────────────────────────────────────────────────────
   Fix vs v1: no tag-edge explosion (tags drive LAYOUT + color, not lines) ·
   daily notes excluded · tag clusters in angular sectors · tag filter ·
   hover highlights node + neighbours · only wiki-links drawn as edges.
   ═════════════════════════════════════════════════════════════════════ */
const Graph = {
  TAG_COLOR: { study: '#a78bfa', sql: '#06b6d4', python: '#22c55e', idea: '#eab308', work: '#ef4444', personal: '#f97316', _none: '#52525b' },
  TAG_LABEL: { study: '📚 Estudio', sql: '🗃️ SQL', python: '🐍 Python', idea: '💡 Idea', work: '💼 Trabajo', personal: '🏠 Personal', _none: '· Sin tag' },
  _hidden: {},   // tag -> true if filtered out

  build() {
    /* Knowledge graph = real notes only. Daily notes are an inbox, not knowledge. */
    const notes = getN().filter(n => n.type === 'note');
    const nodes = notes.map(n => ({
      id: n.id, title: n.title || 'Sin título',
      tag: (n.tags && n.tags[0]) || '_none',
      tags: n.tags || [], body: n.body || ''
    }));
    const idset = new Set(nodes.map(n => n.id));
    /* Edges = wiki-links ONLY. Tags are spatial clusters, not lines (kills the hairball). */
    const edges = [];
    const seen = new Set();
    nodes.forEach(a => {
      let m; const re = new RegExp(NOT_LINK_SRC, 'gi');
      while ((m = re.exec(a.body))) {
        const t = m[1].trim().toLowerCase();
        const b = nodes.find(x => (x.title || '').trim().toLowerCase() === t);
        if (b && b.id !== a.id) {
          const key = [a.id, b.id].sort().join('|');
          if (!seen.has(key)) { seen.add(key); edges.push({ a: a.id, b: b.id }); }
        }
      }
    });
    return { nodes, edges, idset };
  },

  render() {
    const root = document.getElementById('graphRoot');
    if (!root) return;
    const { nodes, edges } = Graph.build();
    if (!nodes.length) {
      root.innerHTML = '<div style="text-align:center;padding:50px;color:var(--t3);font-size:12px">Sin notas para graficar. Creá notas y conectalas con <code>[[wiki-links]]</code>.</div>';
      return;
    }

    /* ── Group nodes by dominant tag ── */
    const groups = {};
    nodes.forEach(n => { (groups[n.tag] = groups[n.tag] || []).push(n); });
    const tagKeys = Object.keys(groups).sort((a, b) => groups[b].length - groups[a].length);
    const visibleTags = tagKeys.filter(t => !Graph._hidden[t]);

    /* ── Layout: each visible tag = angular sector; nodes spread inside it ── */
    const W = 860, H = 560, cx = W / 2, cy = H / 2;
    const pos = {};
    const sectorCount = visibleTags.length || 1;
    visibleTags.forEach((tag, ti) => {
      const g = groups[tag];
      const sectorMid = (ti / sectorCount) * Math.PI * 2 - Math.PI / 2;
      const sectorSpan = (Math.PI * 2 / sectorCount) * 0.78;
      g.forEach((n, ni) => {
        /* 2 concentric arcs so big clusters don't overlap labels */
        const ring = ni % 2;
        const R = 130 + ring * 78 + (g.length > 10 ? 0 : 0);
        const within = g.length > 1 ? (ni / (g.length - 1) - 0.5) : 0;
        const ang = sectorMid + within * sectorSpan;
        pos[n.id] = { x: cx + R * Math.cos(ang), y: cy + R * Math.sin(ang), tag };
      });
    });

    const deg = {};
    edges.forEach(e => { deg[e.a] = (deg[e.a] || 0) + 1; deg[e.b] = (deg[e.b] || 0) + 1; });
    const adj = {};
    edges.forEach(e => { (adj[e.a] = adj[e.a] || []).push(e.b); (adj[e.b] = adj[e.b] || []).push(e.a); });

    /* ── SVG ── */
    let svg = '<svg id="graphSvg" viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:auto;background:radial-gradient(circle at 50% 45%,rgba(139,92,246,.04),transparent 70%),var(--c1);border:1px solid var(--bd);border-radius:var(--radius-md)">';
    /* sector labels */
    visibleTags.forEach((tag, ti) => {
      const sectorMid = (ti / sectorCount) * Math.PI * 2 - Math.PI / 2;
      const lx = cx + 250 * Math.cos(sectorMid), ly = cy + 250 * Math.sin(sectorMid);
      svg += '<text x="' + lx.toFixed(1) + '" y="' + ly.toFixed(1) + '" text-anchor="middle" font-size="11" font-weight="700" fill="' + (Graph.TAG_COLOR[tag] || '#52525b') + '" opacity="0.55" font-family="IBM Plex Sans,sans-serif">' + (Graph.TAG_LABEL[tag] || tag) + '</text>';
    });
    /* edges */
    edges.forEach(e => {
      const p1 = pos[e.a], p2 = pos[e.b];
      if (!p1 || !p2) return;
      svg += '<line class="g-edge" data-a="' + e.a + '" data-b="' + e.b + '" x1="' + p1.x.toFixed(1) + '" y1="' + p1.y.toFixed(1) + '" x2="' + p2.x.toFixed(1) + '" y2="' + p2.y.toFixed(1) + '" stroke="var(--ac)" stroke-width="1.5" opacity="0.45"/>';
    });
    /* nodes */
    nodes.forEach(n => {
      const p = pos[n.id];
      if (!p) return;
      const col = Graph.TAG_COLOR[n.tag] || Graph.TAG_COLOR._none;
      const d = deg[n.id] || 0;
      const r = 7 + Math.min(11, d * 2.4);
      const label = n.title.length > 20 ? n.title.slice(0, 19) + '…' : n.title;
      svg += '<g class="graph-node" data-id="' + n.id + '" style="cursor:pointer">';
      svg += '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="' + r + '" fill="' + col + '" opacity="0.92" stroke="var(--c1)" stroke-width="2"/>';
      svg += '<text class="g-label" x="' + p.x.toFixed(1) + '" y="' + (p.y + r + 11).toFixed(1) + '" text-anchor="middle" font-size="8.5" fill="var(--t2)" font-family="IBM Plex Sans,sans-serif">' + esc(label) + '</text>';
      svg += '</g>';
    });
    svg += '</svg>';

    /* ── Stats + tag filter + legend ── */
    const orphans = nodes.filter(n => !(deg[n.id]) && n.tag === '_none');
    let h = '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px">';
    h += '<div style="font-size:11px;color:var(--t3)"><b>' + nodes.length + '</b> notas · <b>' + edges.length + '</b> wiki-links · <b>' + orphans.length + '</b> huérfanas</div>';
    h += '<div style="display:flex;flex-wrap:wrap;gap:4px" id="graphTagFilter">';
    tagKeys.forEach(t => {
      const off = Graph._hidden[t];
      h += '<button class="g-tagchip" data-tag="' + t + '" style="font-size:10px;font-weight:600;padding:3px 9px;border-radius:14px;cursor:pointer;border:1px solid ' + (Graph.TAG_COLOR[t] || '#52525b') + ';background:' + (off ? 'transparent' : (Graph.TAG_COLOR[t] || '#52525b') + '22') + ';color:' + (off ? 'var(--t3)' : (Graph.TAG_COLOR[t] || '#a1a1aa')) + ';' + (off ? 'opacity:.5;text-decoration:line-through' : '') + '">' + (Graph.TAG_LABEL[t] || t) + ' ' + groups[t].length + '</button>';
    });
    h += '</div></div>';
    h += svg;
    h += '<div style="font-size:10px;color:var(--t3);margin-top:8px;font-style:italic">Tags = clusters por color · líneas = <code>[[wiki-links]]</code> · tamaño del nodo = nº de conexiones · hover resalta vecinos · click abre la nota.</div>';
    if (orphans.length) {
      h += '<div style="margin-top:8px;padding:8px 10px;background:rgba(234,179,8,.06);border:1px solid rgba(234,179,8,.15);border-radius:var(--radius-sm);font-size:11px;color:var(--t2)">⚠️ Huérfanas (sin tag ni link): ' + orphans.map(o => esc(o.title)).join(' · ') + '</div>';
    }
    root.innerHTML = h;

    /* ── Interactivity ── */
    root.querySelectorAll('.graph-node').forEach(g => {
      const id = g.getAttribute('data-id');
      g.addEventListener('click', () => Wiki.jumpTo(id));
      g.addEventListener('mouseenter', () => Graph._highlight(root, id, adj));
      g.addEventListener('mouseleave', () => Graph._clearHighlight(root));
    });
    root.querySelectorAll('.g-tagchip').forEach(c => c.addEventListener('click', () => {
      const t = c.getAttribute('data-tag');
      Graph._hidden[t] = !Graph._hidden[t];
      Graph.render();
    }));
  },

  _highlight(root, id, adj) {
    const near = new Set([id, ...(adj[id] || [])]);
    root.querySelectorAll('.graph-node').forEach(g => {
      g.style.opacity = near.has(g.getAttribute('data-id')) ? '1' : '0.18';
    });
    root.querySelectorAll('.g-edge').forEach(e => {
      const on = e.getAttribute('data-a') === id || e.getAttribute('data-b') === id;
      e.setAttribute('opacity', on ? '0.95' : '0.08');
      e.setAttribute('stroke-width', on ? '2.4' : '1.5');
    });
  },
  _clearHighlight(root) {
    root.querySelectorAll('.graph-node').forEach(g => g.style.opacity = '1');
    root.querySelectorAll('.g-edge').forEach(e => { e.setAttribute('opacity', '0.45'); e.setAttribute('stroke-width', '1.5'); });
  }
};

/* ═════════════════════════════════════════════════════════════════════
   F5 · KARPATHY ORGANIZER (heuristic + deep-reorg prompt)
   ═════════════════════════════════════════════════════════════════════ */
const Organizer = {
  TAG_KEYWORDS: {
    sql: ['select ', 'from ', ' join ', 'where ', 'group by', 'query', 'sql', 'postgres', 'mysql'],
    python: ['def ', 'import ', 'python', 'pandas', 'numpy', 'lambda ', 'print('],
    study: ['estudi', 'aprend', 'curso', 'clase', 'examen', 'leccion', 'concepto'],
    idea: ['idea', 'qué tal si', 'que tal si', 'podría', 'deberíamos', 'brainstorm', 'propuesta'],
    work: ['trabajo', 'simetrik', 'cliente', 'reunión', 'reunion', 'proyecto', 'deadline', 'jefe'],
    personal: ['personal', 'familia', 'salud', 'casa', 'sentir', 'siento']
  },

  /* Jaccard similarity of two word-sets */
  similarity(a, b) {
    const wa = new Set((a || '').toLowerCase().match(/\w{4,}/g) || []);
    const wb = new Set((b || '').toLowerCase().match(/\w{4,}/g) || []);
    if (!wa.size || !wb.size) return 0;
    let inter = 0; wa.forEach(w => { if (wb.has(w)) inter++; });
    return inter / (wa.size + wb.size - inter);
  },

  analyze() {
    const notes = getN().filter(n => n.type === 'note');
    const out = { dupes: [], tagSuggest: [], linkSuggest: [], orphans: [] };

    /* Duplicates / near-dupes */
    for (let i = 0; i < notes.length; i++) {
      for (let j = i + 1; j < notes.length; j++) {
        const sim = Organizer.similarity(notes[i].body, notes[j].body);
        if (sim > 0.5) out.dupes.push({ a: notes[i], b: notes[j], sim: Math.round(sim * 100) });
      }
    }

    /* Tag suggestions for untagged / undertagged notes */
    notes.forEach(n => {
      if (n.tags && n.tags.length) return;
      const text = ((n.title || '') + ' ' + (n.body || '')).toLowerCase();
      const hits = [];
      Object.keys(Organizer.TAG_KEYWORDS).forEach(tag => {
        if (Organizer.TAG_KEYWORDS[tag].some(kw => text.includes(kw))) hits.push(tag);
      });
      if (hits.length) out.tagSuggest.push({ note: n, tags: hits.slice(0, 3) });
    });

    /* Link suggestions · note body mentions another note's title verbatim */
    notes.forEach(n => {
      const body = (n.body || '').toLowerCase();
      notes.forEach(other => {
        if (other.id === n.id) return;
        const t = (other.title || '').trim();
        if (t.length < 5) return;
        if (body.includes(t.toLowerCase()) && !body.includes('[[' + t.toLowerCase())) {
          out.linkSuggest.push({ note: n, target: other });
        }
      });
    });

    /* Orphans · no tags, no links, no backlinks */
    notes.forEach(n => {
      const hasTags = n.tags && n.tags.length;
      const hasLinks = /\[\[[^\]]+\]\]/.test(n.body || '');
      const hasBacklinks = n.title && Wiki.backlinksFor(n.title).some(x => x.id !== n.id);
      if (!hasTags && !hasLinks && !hasBacklinks) out.orphans.push(n);
    });

    return out;
  },

  applyTag(noteId, tag) {
    const arr = getN();
    const n = arr.find(x => x.id === noteId);
    if (n) { n.tags = n.tags || []; if (!n.tags.includes(tag)) n.tags.push(tag); setN(arr); }
  },

  applyLink(noteId, targetTitle) {
    const arr = getN();
    const n = arr.find(x => x.id === noteId);
    if (n) {
      /* Replace first verbatim mention with a wiki-link */
      const re = new RegExp(targetTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      n.body = (n.body || '').replace(re, '[[' + targetTitle + ']]');
      setN(arr);
    }
  },

  /* Build a prompt to paste into Claude Code for full Karpathy reorganization */
  deepPrompt() {
    const notes = getN().filter(n => n.type === 'note');
    return `Karpathy method on DA-2026 13-NOT notes.

PRIOR RUNS: grep PROMPT_RUNS.md for "ID:13-NOT.organize".

GOAL: Restructure ${notes.length} loose notes from sb_notes2 into an organized knowledge base.
1. Read all notes (localStorage key sb_notes2 · array of {id,title,body,tags,type}).
2. Extract recurring concepts/entities. Cluster notes by theme.
3. Propose: merges for duplicates · better tags · [[wiki-links]] between related notes.
4. Detect orphan notes · suggest how to connect them.
5. Output a migration plan · apply only after user approval.
CONSTRAINTS: never delete a note without confirmation · keep ids stable · preserve dates.

LOG: append result to PROMPT_RUNS.md ID:13-NOT.organize.`;
  },

  render() {
    const host = document.getElementById('notOrganizerPanel');
    if (!host) return;
    const r = Organizer.analyze();
    let h = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">';
    h += '<div style="font-size:13px;font-weight:600">🧹 Ordená mi cerebro — sugerencias locales</div>';
    h += '<button class="btn bo bs" id="notOrgClose">✕ Cerrar</button></div>';

    if (r.dupes.length) {
      h += '<div style="font-size:11px;font-weight:600;color:var(--am);margin:8px 0 4px">⚠️ Posibles duplicados (' + r.dupes.length + ')</div>';
      r.dupes.slice(0, 8).forEach(d => {
        h += '<div style="font-size:11px;color:var(--t2);padding:5px 8px;background:var(--el);border-radius:var(--radius-sm);margin-bottom:3px">' + esc(d.a.title) + ' ≈ ' + esc(d.b.title) + ' <span style="color:var(--t3)">(' + d.sim + '% similar)</span></div>';
      });
    }
    if (r.tagSuggest.length) {
      h += '<div style="font-size:11px;font-weight:600;color:var(--cy);margin:10px 0 4px">🏷️ Tags sugeridos (' + r.tagSuggest.length + ')</div>';
      r.tagSuggest.slice(0, 10).forEach(s => {
        h += '<div style="font-size:11px;color:var(--t2);padding:5px 8px;background:var(--el);border-radius:var(--radius-sm);margin-bottom:3px;display:flex;justify-content:space-between;align-items:center;gap:8px">';
        h += '<span>' + esc(s.note.title) + ' → ' + s.tags.map(t => '<b>' + t + '</b>').join(' · ') + '</span>';
        h += '<button class="btn bo bs" data-tag-note="' + s.note.id + '" data-tags="' + s.tags.join(',') + '">aplicar</button></div>';
      });
    }
    if (r.linkSuggest.length) {
      h += '<div style="font-size:11px;font-weight:600;color:var(--a2);margin:10px 0 4px">🔗 Links sugeridos (' + r.linkSuggest.length + ')</div>';
      r.linkSuggest.slice(0, 10).forEach(s => {
        h += '<div style="font-size:11px;color:var(--t2);padding:5px 8px;background:var(--el);border-radius:var(--radius-sm);margin-bottom:3px;display:flex;justify-content:space-between;align-items:center;gap:8px">';
        h += '<span>' + esc(s.note.title) + ' menciona "<b>' + esc(s.target.title) + '</b>"</span>';
        h += '<button class="btn bo bs" data-link-note="' + s.note.id + '" data-link-title="' + esc(s.target.title) + '">enlazar</button></div>';
      });
    }
    if (r.orphans.length) {
      h += '<div style="font-size:11px;font-weight:600;color:var(--t3);margin:10px 0 4px">🪦 Notas huérfanas (' + r.orphans.length + ')</div>';
      h += '<div style="font-size:11px;color:var(--t2);padding:5px 8px;background:var(--el);border-radius:var(--radius-sm)">' + r.orphans.slice(0, 12).map(o => esc(o.title)).join(' · ') + '</div>';
    }
    if (!r.dupes.length && !r.tagSuggest.length && !r.linkSuggest.length && !r.orphans.length) {
      h += '<div style="font-size:12px;color:var(--gn);padding:10px">✅ Tu cerebro está ordenado · sin sugerencias.</div>';
    }
    h += '<div style="margin-top:12px;padding-top:10px;border-top:1px dashed var(--bd)">';
    h += '<div style="font-size:11px;color:var(--t3);margin-bottom:6px">¿Querés una reorganización profunda con IA? Copiá este prompt y pegalo en Claude Code:</div>';
    h += '<button class="btn bp bs" id="notOrgPrompt">📋 Copiar prompt Karpathy</button></div>';
    host.innerHTML = h;
    host.style.display = 'block';

    document.getElementById('notOrgClose').addEventListener('click', () => { host.style.display = 'none'; });
    document.getElementById('notOrgPrompt').addEventListener('click', () => {
      navigator.clipboard.writeText(Organizer.deepPrompt()).then(() => toast('Prompt Karpathy copiado'));
    });
    host.querySelectorAll('[data-tag-note]').forEach(b => b.addEventListener('click', () => {
      b.getAttribute('data-tags').split(',').forEach(t => Organizer.applyTag(b.getAttribute('data-tag-note'), t));
      reRender(); Organizer.render(); toast('Tags aplicados');
    }));
    host.querySelectorAll('[data-link-note]').forEach(b => b.addEventListener('click', () => {
      Organizer.applyLink(b.getAttribute('data-link-note'), b.getAttribute('data-link-title'));
      reRender(); Organizer.render(); toast('Link aplicado');
    }));
  }
};

/* ═════════════════════════════════════════════════════════════════════
   F2b · NOTE EDITOR (edit title / body / tags after creation)
   Fixes the gap: notes.html had no editNote — notes were create-only.
   ═════════════════════════════════════════════════════════════════════ */
const Editor = {
  TAGS: [
    { id: 'study', label: '📚 Estudio' }, { id: 'sql', label: '🗃️ SQL' },
    { id: 'python', label: '🐍 Python' }, { id: 'idea', label: '💡 Idea' },
    { id: 'work', label: '💼 Trabajo' }, { id: 'personal', label: '🏠 Personal' }
  ],

  open(noteId) {
    const note = getN().find(n => n.id === noteId);
    if (!note) { toast('Nota no encontrada'); return; }
    let modal = document.getElementById('notEditModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'notEditModal';
      modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.78);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
      document.body.appendChild(modal);
    }
    const sel = new Set(note.tags || []);
    const chips = Editor.TAGS.map(t =>
      '<span class="notEdit-tag" data-tag="' + t.id + '" style="font-size:11px;font-weight:600;padding:4px 10px;border-radius:14px;cursor:pointer;border:1px solid var(--bd);' +
      (sel.has(t.id) ? 'background:var(--ag);border-color:var(--a2);color:var(--a2)' : 'background:var(--el);color:var(--t2)') + '">' + t.label + '</span>'
    ).join('');
    modal.innerHTML = '<div style="background:var(--c1);border:1px solid var(--bd);border-radius:var(--radius-md);padding:22px;max-width:600px;width:100%;max-height:88vh;overflow:auto">' +
      '<div style="font-size:15px;font-weight:700;margin-bottom:2px">✏️ Editar nota</div>' +
      '<div style="font-size:10px;color:var(--t3);margin-bottom:14px">Creada ' + new Date(note.date).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' }) + '</div>' +
      '<label style="font-size:11px;color:var(--t3);text-transform:uppercase;letter-spacing:1px">Título</label>' +
      '<input class="inp" id="notEditTitle" style="width:100%;font-size:15px;font-weight:600;margin-bottom:10px" value="' + esc(note.title) + '">' +
      '<label style="font-size:11px;color:var(--t3);text-transform:uppercase;letter-spacing:1px">Tags</label>' +
      '<div style="display:flex;flex-wrap:wrap;gap:5px;margin:6px 0 12px">' + chips + '</div>' +
      '<label style="font-size:11px;color:var(--t3);text-transform:uppercase;letter-spacing:1px">Contenido <span style="text-transform:none;letter-spacing:0">· soporta <code>[[wiki-links]]</code></span></label>' +
      '<textarea class="txa" id="notEditBody" style="width:100%;min-height:200px;margin-bottom:14px;font-family:\'IBM Plex Mono\',monospace;font-size:13px;line-height:1.6">' + esc(note.body) + '</textarea>' +
      '<div style="display:flex;gap:8px;justify-content:flex-end">' +
      '<button class="btn bo" onclick="document.getElementById(\'notEditModal\').remove()">Cancelar</button>' +
      '<button class="btn bg" id="notEditSave">💾 Guardar cambios</button></div></div>';

    /* tag toggle */
    modal.querySelectorAll('.notEdit-tag').forEach(c => c.addEventListener('click', () => {
      const t = c.getAttribute('data-tag');
      if (sel.has(t)) { sel.delete(t); c.style.cssText = c.style.cssText.replace(/background:[^;]+;border-color:[^;]+;color:[^;]+/, 'background:var(--el);color:var(--t2)'); c.style.background = 'var(--el)'; c.style.borderColor = 'var(--bd)'; c.style.color = 'var(--t2)'; }
      else { sel.add(t); c.style.background = 'var(--ag)'; c.style.borderColor = 'var(--a2)'; c.style.color = 'var(--a2)'; }
    }));
    /* save */
    document.getElementById('notEditSave').addEventListener('click', () => {
      const title = document.getElementById('notEditTitle').value.trim();
      const body = document.getElementById('notEditBody').value.trim();
      if (!body) { toast('El contenido no puede quedar vacío'); return; }
      const arr = getN();
      const n = arr.find(x => x.id === noteId);
      if (!n) { toast('Nota no encontrada'); return; }
      n.title = title || 'Sin título';
      n.body = body;
      n.tags = Array.from(sel);
      n.updated_at = new Date().toISOString();
      setN(arr);
      modal.remove();
      reRender();
      toast('Nota actualizada');
    });
  }
};

/* ═════════════════════════════════════════════════════════════════════
   HELPERS
   ═════════════════════════════════════════════════════════════════════ */
function toast(msg) {
  let t = document.getElementById('notToast');
  if (!t) { t = document.createElement('div'); t.id = 'notToast'; t.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:var(--ac);color:#fff;padding:8px 16px;border-radius:var(--radius-sm);font-size:12px;font-weight:600;z-index:10000;box-shadow:0 4px 16px rgba(0,0,0,.4);opacity:0;transition:opacity .2s'; document.body.appendChild(t); }
  t.textContent = msg; t.style.opacity = '1';
  setTimeout(() => t.style.opacity = '0', 2200);
}
function switchTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('on'));
  document.querySelectorAll('.pnl').forEach(p => p.classList.remove('on'));
  const tab = document.querySelector('.tab[data-p="' + name + '"]');
  const pnl = document.getElementById('p-' + name);
  if (tab) tab.classList.add('on');
  if (pnl) pnl.classList.add('on');
}

/* Inject styles for wikilinks */
function injectStyles() {
  if (document.getElementById('notBrainStyles')) return;
  const s = document.createElement('style');
  s.id = 'notBrainStyles';
  s.textContent = '.wikilink{color:var(--a2);cursor:pointer;font-weight:600;border-bottom:1px dashed var(--a2)}.wikilink:hover{background:var(--ag)}.wikilink-missing{color:var(--rd);border-color:var(--rd);opacity:.7}.wiki-ac-item:hover{background:var(--el);color:var(--tx)}.graph-node:hover circle{opacity:1;stroke:#fff;stroke-width:1.5}';
  document.head.appendChild(s);
}

/* Inject UI into existing panels */
function injectUI() {
  /* F1 · daily-note card + F3/F5 toolbar into #p-all */
  const pAll = document.getElementById('p-all');
  if (pAll && !document.getElementById('notDailyCard')) {
    const card = document.createElement('div');
    card.className = 'cd';
    card.id = 'notDailyCard';
    card.style.marginBottom = '12px';
    pAll.insertBefore(card, pAll.firstChild);

    const bar = document.createElement('div');
    bar.style.cssText = 'display:flex;gap:6px;margin-bottom:10px';
    bar.innerHTML = '<button class="btn bo bs" id="notOrgBtn">🧹 Ordená mi cerebro</button>';
    pAll.insertBefore(bar, document.getElementById('notDailyCard').nextSibling);

    const orgPanel = document.createElement('div');
    orgPanel.className = 'cd';
    orgPanel.id = 'notOrganizerPanel';
    orgPanel.style.cssText = 'margin-bottom:12px;display:none';
    pAll.insertBefore(orgPanel, bar.nextSibling);

    document.getElementById('notOrgBtn').addEventListener('click', () => Organizer.render());
  }
}

/* ═════════════════════════════════════════════════════════════════════
   F2/F3 · enrich rendered notes (called by inline renderNotes hook)
   ═════════════════════════════════════════════════════════════════════ */
function afterRenderNotes() {
  Wiki.enrich();
  /* F2b + F3 · hover action bar per note card (Editar · Flashcard) */
  document.querySelectorAll('.note[data-note-id]').forEach(card => {
    if (card.querySelector('.note-actbar')) return;
    const id = card.getAttribute('data-note-id');
    card.style.position = 'relative';
    const bar = document.createElement('div');
    bar.className = 'note-actbar';
    bar.style.cssText = 'position:absolute;bottom:8px;right:8px;display:flex;gap:4px;opacity:0;transition:opacity .15s';
    const mk = (txt, title) => {
      const b = document.createElement('button');
      b.textContent = txt; b.title = title;
      b.style.cssText = 'background:var(--el);border:1px solid var(--bd);color:var(--t2);font-size:9px;font-weight:600;padding:3px 8px;border-radius:5px;cursor:pointer;transition:border-color var(--transition-fast),color var(--transition-fast)';
      b.onmouseenter = () => { b.style.borderColor = 'var(--ac)'; b.style.color = 'var(--a2)'; };
      b.onmouseleave = () => { b.style.borderColor = 'var(--bd)'; b.style.color = 'var(--t2)'; };
      return b;
    };
    const bEdit = mk('✏️ Editar', 'Editar título, contenido y tags');
    const bCard = mk('🃏 Flashcard', 'Crear flashcard SRS desde esta nota');
    bEdit.addEventListener('click', e => { e.stopPropagation(); Editor.open(id); });
    bCard.addEventListener('click', e => { e.stopPropagation(); SrsBridge.openEditor(id); });
    bar.appendChild(bEdit); bar.appendChild(bCard);
    card.appendChild(bar);
    card.addEventListener('mouseenter', () => bar.style.opacity = '1');
    card.addEventListener('mouseleave', () => bar.style.opacity = '0');
  });
}

/* ═════════════════════════════════════════════════════════════════════
   INIT
   ═════════════════════════════════════════════════════════════════════ */
function init() {
  migrate();
  injectStyles();
  injectUI();
  Wiki.attachAutocomplete();
  Daily.render();
  reRender();           // re-render notes so data-note-id is populated
  /* Tab wiring for graph */
  document.querySelectorAll('.tab').forEach(t => {
    t.addEventListener('click', () => {
      const p = t.getAttribute('data-p');
      setTimeout(() => {
        if (p === 'graph') Graph.render();
        if (p === 'all') { Daily.render(); }
      }, 50);
    });
  });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

/* ── Public CLI · window.NOT ── */
return {
  /* hooks called by inline notes.html */
  afterRenderNotes,
  onNotesChanged: () => { Daily.render(); },
  /* F1 · core CLI */
  all: () => getN(),
  get: id => getN().find(n => n.id === id) || null,
  search: q => { const s = String(q || '').toLowerCase(); return getN().filter(n => ((n.title || '') + (n.body || '')).toLowerCase().includes(s)); },
  create: ({ title, body, tags, type } = {}) => {
    const arr = getN();
    const note = { id: genId(), title: title || 'Sin título', body: body || '', tags: tags || [], type: type || 'note', date: new Date().toISOString() };
    arr.push(note); setN(arr); reRender();
    return note.id;
  },
  append: (id, text) => {
    const arr = getN(); const n = arr.find(x => x.id === id);
    if (!n) return false;
    n.body = (n.body ? n.body + '\n' : '') + (text || '');
    n.updated_at = new Date().toISOString();
    setN(arr); reRender(); return true;
  },
  today: () => Daily.today(true),
  capture: text => Daily.capture(text),
  /* F2 · links */
  link: id => { const n = getN().find(x => x.id === id); return n ? '[[' + n.title + ']]' : ''; },
  backlinks: id => { const n = getN().find(x => x.id === id); return n ? Wiki.backlinksFor(n.title) : []; },
  /* F2b · edit */
  edit: id => Editor.open(id),
  /* F3 · SRS */
  toFlashcard: id => SrsBridge.openEditor(id),
  /* F4 · graph */
  graph: () => Graph.build(),
  renderGraph: () => Graph.render(),
  /* F5 · organizer */
  organize: () => Organizer.analyze(),
  showOrganizer: () => Organizer.render(),
  deepPrompt: () => Organizer.deepPrompt()
};
})();

window.NOT = NOT;
