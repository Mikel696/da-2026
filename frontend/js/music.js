/* ═══════════════════════════════════════════════════════════════
   DA-2026 · 18-MUS · Cerebro Musical
   ─────────────────────────────────────────────────────────────
   Qué resuelve: Miguel compone pero no sabe acordes ni estructuras.
   Este módulo convierte "una idea" en "una canción vendible" con
   una línea de montaje de 9 estaciones, y hace SONAR la teoría en
   vez de explicarla (MAUDIO, Web Audio puro).

   Storage (todo sincronizado salvo lo marcado):
     - mus_songs   [{id,title,genre,bpm,key,mode,status,hook,lyric,
                     notes,splits[],isrc,ai,links,ts,upd}]
     - mus_check   {estacionId: {itemIdx: true}}   progreso de fábrica
     - mus_univ    {nombre,tesis,c1,c2,pov,serie,ritual}
     - mus_lab     {genre,key,mode,bpm,prog,pattern}  último estado del lab
     - mus_tab     (LOCAL, no sincroniza — cada device en su pestaña)

   Datos: frontend/data/music-kb.json — con fallback embebido mínimo
   para que el módulo nunca quede en blanco si el fetch falla (P1:
   el sitio funciona sin red).
═══════════════════════════════════════════════════════════════ */

const MUS = (function () {
  'use strict';

  const K_SONGS = 'mus_songs';
  const K_CHECK = 'mus_check';
  const K_UNIV  = 'mus_univ';
  const K_LAB   = 'mus_lab';
  const K_TAB   = 'mus_tab';

  let KB = null;          // cerebro musical cargado
  let kbError = null;

  /* ── helpers ────────────────────────────────────────────────── */
  const $  = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  function get(k, d) {
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }
    catch (e) { return d; }
  }
  function set(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { console.warn('[18-MUS] no se pudo guardar', k, e); }
  }
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const now = () => new Date().toISOString();
  const fecha = iso => { try { return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }); } catch (e) { return '—'; } };

  function toast(msg) {
    let t = $('musToast');
    if (!t) { t = document.createElement('div'); t.id = 'musToast'; t.className = 'mus-toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('on');
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 2200);
  }
  function copy(txt, msg) {
    navigator.clipboard.writeText(txt)
      .then(() => toast(msg || 'Copiado ✓'))
      .catch(() => { const ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); toast(msg || 'Copiado ✓'); } catch (e) { toast('No se pudo copiar'); } document.body.removeChild(ta); });
  }

  const ESTADOS = [
    { id: 'idea',     lbl: 'Idea',      c: '#52525b' },
    { id: 'letra',    lbl: 'Letra',     c: '#3b82f6' },
    { id: 'demo',     lbl: 'Maqueta',   c: '#8b5cf6' },
    { id: 'prod',     lbl: 'Producida', c: '#06b6d4' },
    { id: 'master',   lbl: 'Masterizada', c: '#eab308' },
    { id: 'lanzada',  lbl: 'Lanzada',   c: '#22c55e' },
    { id: 'vendida',  lbl: 'Vendida',   c: '#10b981' }
  ];
  const estadoDe = id => ESTADOS.find(e => e.id === id) || ESTADOS[0];

  /* ── carga del cerebro ──────────────────────────────────────── */
  const FALLBACK = {
    meta: { version: 'fallback', corte: '—' },
    teoria: [], progresiones: [
      { id: 'p01', nombre: 'La de los 4 acordes', grados: ['I', 'V', 'vi', 'IV'], ctx: 'mayor', uso: 'Pop', nota: '' },
      { id: 'p04', nombre: 'Loop urbano', grados: ['i', 'VI', 'III', 'VII'], ctx: 'menor', uso: 'Reggaetón', nota: '' }
    ],
    estructuras: [], generos: [
      { id: 'reggaeton', nombre: 'Reggaetón', emoji: '🔥', bpm: { min: 88, max: 100, tipico: 95 }, steps: 16,
        patron: { kick: [1, 9], clap: [4, 7, 12, 15], hat: [1, 3, 5, 7, 9, 11, 13, 15], perc: [] },
        progresiones: ['p04'], instrumentacion: [], errores: [], conf: 'alta' }
    ],
    fabrica: [], arsenal: [], legal: [], negocio: [], universo: [], glosario: []
  };

  async function loadKB() {
    try {
      const r = await fetch('data/music-kb.json?v=' + Date.now(), { cache: 'no-store' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      KB = await r.json();
    } catch (e) {
      KB = FALLBACK;
      kbError = e.message || String(e);
      console.warn('[18-MUS] cerebro no disponible, usando fallback:', kbError);
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     LABORATORIO — el corazón del módulo.
     Un género seleccionado carga su BPM, su rejilla de 16 casillas
     y sus progresiones. Todo suena; nada hay que leer.
  ═══════════════════════════════════════════════════════════════ */
  const lab = {
    genre: 'reggaeton', key: 'A', mode: 'menor', bpm: 95,
    progId: null, pattern: null, steps: 16, voice: 'piano', drums: true
  };

  function labGenero() { return (KB.generos || []).find(g => g.id === lab.genre) || (KB.generos || [])[0]; }
  function progById(id) { return (KB.progresiones || []).find(p => p.id === id); }

  function labCargarGenero(gid, keepBpm) {
    const g = (KB.generos || []).find(x => x.id === gid);
    if (!g) return;
    lab.genre = gid;
    lab.steps = g.steps || 16;
    lab.pattern = JSON.parse(JSON.stringify(g.patron || {}));
    if (!keepBpm) lab.bpm = (g.bpm && g.bpm.tipico) || 95;
    const primera = (g.progresiones || [])[0];
    const p = progById(primera);
    if (p) { lab.progId = p.id; lab.mode = p.ctx === 'menor' ? 'menor' : 'mayor'; }
    guardarLab();
  }

  /* mus_lab está en el SYNC_REGISTRY, y el slider de BPM dispara oninput en
     cada pixel del arrastre. Sin debounce, arrastrar el slider sería una
     ráfaga de escrituras que el proxy de cloud-sync convierte en ráfaga de
     push a Supabase — exactamente el motivo por el que fin_calc_state quedó
     excluido del sync. Aquí se agrupa y se vacía al salir. */
  let _labT = null;
  function guardarLab() {
    clearTimeout(_labT);
    _labT = setTimeout(flushLab, 700);
  }
  function flushLab() {
    clearTimeout(_labT); _labT = null;
    set(K_LAB, { genre: lab.genre, key: lab.key, mode: lab.mode, bpm: lab.bpm, progId: lab.progId, pattern: lab.pattern });
  }
  function restaurarLab() {
    const s = get(K_LAB, null);
    if (s && s.genre) {
      Object.assign(lab, s);
      const g = (KB.generos || []).find(x => x.id === lab.genre);
      lab.steps = (g && g.steps) || 16;
      if (!lab.pattern) lab.pattern = g ? JSON.parse(JSON.stringify(g.patron || {})) : {};
    } else {
      labCargarGenero('reggaeton');
    }
  }

  /** Acordes reales de la progresión activa, ya resueltos a nombres. */
  function labAcordes() {
    const p = progById(lab.progId);
    if (!p || !window.MAUDIO) return [];
    return MAUDIO.buildProgression(p.grados, MAUDIO.nameToPc(lab.key), lab.mode);
  }

  function labPlay() {
    if (!window.MAUDIO || !MAUDIO.supported()) { toast('Tu navegador no soporta audio Web'); return; }
    if (MAUDIO.isPlaying()) { labStop(); return; }
    const acordes = labAcordes();
    MAUDIO.start({
      bpm: lab.bpm, steps: lab.steps, pattern: lab.pattern,
      drums: lab.drums, chords: acordes, voice: lab.voice,
      onStep: s => {
        document.querySelectorAll('.gr-col.on').forEach(e => e.classList.remove('on'));
        const c = document.querySelector('.gr-col[data-s="' + s + '"]');
        if (c) c.classList.add('on');
      },
      onChord: i => {
        document.querySelectorAll('.ch-pill.on').forEach(e => e.classList.remove('on'));
        const c = document.querySelector('.ch-pill[data-i="' + i + '"]');
        if (c) c.classList.add('on');
      }
    });
    const b = $('labPlay'); if (b) { b.textContent = '⏸ Parar'; b.classList.add('playing'); }
  }
  function labStop() {
    if (window.MAUDIO) MAUDIO.stop();
    const b = $('labPlay'); if (b) { b.textContent = '▶ Tocar'; b.classList.remove('playing'); }
    document.querySelectorAll('.gr-col.on, .ch-pill.on').forEach(e => e.classList.remove('on'));
  }

  function labToggleCasilla(fila, paso) {
    if (!lab.pattern[fila]) lab.pattern[fila] = [];
    const n = paso + 1;
    const i = lab.pattern[fila].indexOf(n);
    if (i >= 0) lab.pattern[fila].splice(i, 1); else lab.pattern[fila].push(n);
    guardarLab();
    renderRejilla();
    if (window.MAUDIO && i < 0) MAUDIO.hit(fila === 'clap' ? 'clap' : fila, 0.9);
  }

  function labSetBpm(v) {
    lab.bpm = +v; guardarLab();
    if ($('labBpmVal')) $('labBpmVal').textContent = v;
    if (window.MAUDIO) MAUDIO.setBpm(+v);
  }
  function labSetKey(v)  { lab.key = v; guardarLab(); renderAcordes(); if (MAUDIO.isPlaying()) { labStop(); labPlay(); } }
  function labSetMode(v) { lab.mode = v; guardarLab(); renderAcordes(); if (MAUDIO.isPlaying()) { labStop(); labPlay(); } }
  function labSetProg(v) {
    lab.progId = v;
    const p = progById(v);
    if (p) lab.mode = p.ctx === 'menor' ? 'menor' : 'mayor';
    guardarLab(); renderAcordes(); renderLabControles();
    if (MAUDIO.isPlaying()) { labStop(); labPlay(); }
  }
  function labSetGenero(v) {
    labStop(); labCargarGenero(v);
    renderLab(); renderGeneros();
  }
  function labToggleDrums() { lab.drums = !lab.drums; if (MAUDIO.isPlaying()) { labStop(); labPlay(); } renderLabControles(); }
  function labVoice(v) { lab.voice = v; if (MAUDIO.isPlaying()) { labStop(); labPlay(); } renderLabControles(); }
  function labAcordeSuelto(i) {
    const a = labAcordes()[i];
    if (a && window.MAUDIO) MAUDIO.playChordNow(a.pc, a.qual, { dur: 1.6 });
  }

  const FILAS = [
    { id: 'kick',  lbl: 'Bombo',      ic: '🥁' },
    { id: 'clap',  lbl: 'Palmas',     ic: '👏' },
    { id: 'snare', lbl: 'Caja',       ic: '🪘' },
    { id: 'hat',   lbl: 'Hi-hat',     ic: '🎩' },
    { id: 'perc',  lbl: 'Percusión',  ic: '🪇' },
    { id: 'clave', lbl: 'Clave',      ic: '🪵' }
  ];

  function renderRejilla() {
    const el = $('labGrid'); if (!el) return;
    const steps = lab.steps || 16;
    let h = '';
    FILAS.forEach(f => {
      h += '<div class="gr-row"><div class="gr-lbl" title="' + f.lbl + '"><span>' + f.ic + '</span>' + f.lbl + '</div><div class="gr-cells">';
      for (let s = 0; s < steps; s++) {
        const on = (lab.pattern[f.id] || []).includes(s + 1);
        const fuerte = s % 4 === 0;
        h += '<button class="gr-cell' + (on ? ' hit' : '') + (fuerte ? ' beat' : '') + '"' +
             ' data-f="' + f.id + '" data-s="' + s + '"' +
             ' aria-label="' + f.lbl + ' paso ' + (s + 1) + '"' +
             ' onclick="MUS.toggleCasilla(\'' + f.id + '\',' + s + ')"></button>';
      }
      h += '</div></div>';
    });
    // Regla de conteo: los tiempos fuertes marcados, para que se vea
    // dónde cae "el 1" sin saber leer música.
    h += '<div class="gr-row gr-ruler"><div class="gr-lbl"></div><div class="gr-cells">';
    for (let s = 0; s < steps; s++) {
      h += '<div class="gr-col" data-s="' + s + '">' + (s % 4 === 0 ? (s / 4 + 1) : '·') + '</div>';
    }
    h += '</div></div>';
    el.innerHTML = h;
  }

  function renderAcordes() {
    const el = $('labChords'); if (!el) return;
    const p = progById(lab.progId);
    const acordes = labAcordes();
    if (!p || !acordes.length) { el.innerHTML = '<div class="mus-empty">Elegí una progresión</div>'; return; }
    el.innerHTML =
      '<div class="ch-head"><strong>' + esc(p.nombre) + '</strong>' +
      '<span class="ch-deg">' + p.grados.join(' – ') + '</span></div>' +
      '<div class="ch-row">' + acordes.map((a, i) =>
        '<button class="ch-pill" data-i="' + i + '" onclick="MUS.acordeSuelto(' + i + ')" title="Tocar solo este acorde">' +
        '<span class="ch-name">' + esc(a.label) + '</span>' +
        '<span class="ch-rom">' + esc(a.roman) + '</span></button>').join('') +
      '</div>' + (p.nota ? '<div class="ch-note">' + esc(p.nota) + '</div>' : '');
  }

  function renderLabControles() {
    const el = $('labCtl'); if (!el) return;
    const g = labGenero();
    const gs = (KB.generos || []);
    const progs = (KB.progresiones || []);
    const sugeridas = (g && g.progresiones) || [];
    el.innerHTML =
      '<div class="lab-ctl">' +
        '<label class="lc"><span>Género</span><select onchange="MUS.setGenero(this.value)">' +
          gs.map(x => '<option value="' + x.id + '"' + (x.id === lab.genre ? ' selected' : '') + '>' + esc(x.emoji + ' ' + x.nombre) + '</option>').join('') +
        '</select></label>' +
        '<label class="lc"><span>Tonalidad</span><select onchange="MUS.setKey(this.value)">' +
          MAUDIO.NOTES.map((n, i) => {
            // Las teclas negras tienen dos nombres válidos; mostrar ambos evita
            // que después escriba "A#" donde el músico espera "Bb".
            const bemol = MAUDIO.NOTES_FLAT[i];
            const nom = bemol === n ? n : n + ' / ' + bemol;
            return '<option value="' + n + '"' + (n === lab.key ? ' selected' : '') + '>' + nom + ' · ' + MAUDIO.NOTES_ES[i] + '</option>';
          }).join('') +
        '</select></label>' +
        '<label class="lc"><span>Modo</span><select onchange="MUS.setMode(this.value)">' +
          '<option value="menor"' + (lab.mode === 'menor' ? ' selected' : '') + '>menor (oscuro)</option>' +
          '<option value="mayor"' + (lab.mode === 'mayor' ? ' selected' : '') + '>mayor (alegre)</option>' +
        '</select></label>' +
        '<label class="lc lc-wide"><span>Progresión</span><select onchange="MUS.setProg(this.value)">' +
          '<optgroup label="Sugeridas para ' + esc(g ? g.nombre : '') + '">' +
            progs.filter(p => sugeridas.includes(p.id)).map(p => '<option value="' + p.id + '"' + (p.id === lab.progId ? ' selected' : '') + '>' + esc(p.nombre) + '</option>').join('') +
          '</optgroup><optgroup label="Todas">' +
            progs.filter(p => !sugeridas.includes(p.id)).map(p => '<option value="' + p.id + '"' + (p.id === lab.progId ? ' selected' : '') + '>' + esc(p.nombre) + '</option>').join('') +
          '</optgroup>' +
        '</select></label>' +
      '</div>' +
      '<div class="lab-ctl2">' +
        '<button class="mus-btn primary" id="labPlay" onclick="MUS.play()">▶ Tocar</button>' +
        '<label class="lc-bpm"><span>BPM <b id="labBpmVal">' + lab.bpm + '</b></span>' +
          '<input type="range" min="60" max="220" value="' + lab.bpm + '" oninput="MUS.setBpm(this.value)"></label>' +
        '<button class="mus-btn' + (lab.drums ? ' on' : '') + '" onclick="MUS.toggleDrums()">🥁 Ritmo</button>' +
        '<button class="mus-btn' + (lab.voice === 'piano' ? ' on' : '') + '" onclick="MUS.voice(\'piano\')">🎹 Piano</button>' +
        '<button class="mus-btn' + (lab.voice === 'pad' ? ' on' : '') + '" onclick="MUS.voice(\'pad\')">🌫 Pad</button>' +
        '<button class="mus-btn ghost" onclick="MUS.resetPatron()">↺ Patrón original</button>' +
      '</div>';
  }

  function resetPatron() {
    const g = labGenero();
    if (g) { lab.pattern = JSON.parse(JSON.stringify(g.patron || {})); guardarLab(); renderRejilla(); toast('Patrón del género restaurado'); }
  }

  function renderLab() {
    renderLabControles(); renderRejilla(); renderAcordes();
    const g = labGenero(); const el = $('labInfo');
    if (el && g) {
      el.innerHTML =
        '<div class="lab-info">' +
          '<div><b>' + esc(g.emoji + ' ' + g.nombre) + '</b> · ' + esc(g.compas || '4/4') +
          ' · ' + (g.bpm ? g.bpm.min + '–' + g.bpm.max + ' BPM' : '') + '</div>' +
          (g.patron_nota ? '<p>' + esc(g.patron_nota) + '</p>' : '') +
        '</div>';
    }
  }

  /* ═══ PIANO ═══════════════════════════════════════════════════ */
  function renderPiano() {
    const el = $('pianoWrap'); if (!el) return;
    const base = 48;                       // Do3
    const escalaMayor = [0, 2, 4, 5, 7, 9, 11];
    const escalaMenor = [0, 2, 3, 5, 7, 8, 10];
    const grados = lab.mode === 'menor' ? escalaMenor : escalaMayor;
    const tonicaPc = MAUDIO.nameToPc(lab.key);
    const enTono = pc => grados.includes((((pc - tonicaPc) % 12) + 12) % 12);

    let blancas = '', negras = '';
    const patronBlancas = [0, 2, 4, 5, 7, 9, 11];
    let idx = 0;
    for (let oct = 0; oct < 2; oct++) {
      patronBlancas.forEach(semi => {
        const midi = base + oct * 12 + semi;
        const pc = midi % 12;
        blancas += '<button class="pk pk-w' + (enTono(pc) ? ' in' : '') + (pc === tonicaPc ? ' root' : '') +
                   '" onclick="MUS.nota(' + midi + ')" title="' + MAUDIO.NOTES[pc] + ' · ' + MAUDIO.NOTES_ES[pc] + '">' +
                   '<span>' + MAUDIO.NOTES_ES[pc] + '</span></button>';
        idx++;
      });
    }
    const patronNegras = [1, 3, -1, 6, 8, 10];   // -1 = hueco entre Mi y Fa
    for (let oct = 0; oct < 2; oct++) {
      patronNegras.forEach((semi, i) => {
        if (semi < 0) { negras += '<span class="pk-gap"></span>'; return; }
        const midi = base + oct * 12 + semi;
        const pc = midi % 12;
        negras += '<button class="pk pk-b' + (enTono(pc) ? ' in' : '') + (pc === tonicaPc ? ' root' : '') +
                  '" onclick="MUS.nota(' + midi + ')" title="' + MAUDIO.NOTES[pc] + '"></button>';
      });
      if (oct === 0) negras += '<span class="pk-gap"></span>';
    }
    el.innerHTML =
      '<div class="piano"><div class="pk-whites">' + blancas + '</div><div class="pk-blacks">' + negras + '</div></div>' +
      '<div class="piano-leg">Resaltadas: las 7 notas de <b>' + esc(lab.key) + ' ' + esc(lab.mode) +
      '</b>. La marcada con ● es la tónica — la nota "casa". Tocá solo las resaltadas y todo va a sonar bien.</div>';
  }
  function nota(m) { if (window.MAUDIO) MAUDIO.playNoteNow(m); }

  /* ═══ TABS ════════════════════════════════════════════════════ */
  const TABS = [
    ['es', '🎛️', 'Inicio'], ['fu', '🎹', 'Fundamentos'], ['gn', '🧬', 'Géneros'], ['st', '🎚️', 'Estudio'],
    ['fa', '🏭', 'Fábrica'],  ['ar', '🧰', 'Arsenal'],     ['le', '⚖️', 'Legal'],
    ['ne', '💰', 'Negocio'],  ['un', '🌌', 'Universo'],    ['ca', '📀', 'Catálogo']
  ];
  let tabActual = 'es';

  function showTab(t) {
    tabActual = t;
    try { localStorage.setItem(K_TAB, t); } catch (e) {}
    document.querySelectorAll('.mus-tab').forEach(b => b.classList.toggle('on', b.dataset.t === t));
    document.querySelectorAll('.mus-pane').forEach(p => p.hidden = p.id !== 'pane-' + t);
    if (t !== 'fu' && t !== 'gn') labStop();
    if (t !== 'st' && window.MSTUDIO) MSTUDIO.parar();
    const r = { es: renderEstudio, fu: renderFundamentos, gn: renderGeneros, st: renderEstudioGrab, fa: renderFabrica,
                ar: renderArsenal, le: renderLegal, ne: renderNegocio, un: renderUniverso, ca: renderCatalogo };
    if (r[t]) r[t]();
  }

  /* El Estudio vive en music-ui.js: es una interfaz entera (pistas,
     grabación, mezcla, exportación) y meterla acá habría vuelto este
     archivo inmanejable. */
  function renderEstudioGrab() {
    if (!window.MUSUI) {
      const el = $('pane-st');
      if (el) el.innerHTML = '<div class=mus-warn>El motor del estudio no cargó. Recargá la página.</div>';
      return;
    }
    MUSUI.render();
  }

  /* ═══ ESTUDIO (home) ══════════════════════════════════════════ */
  function renderEstudio() {
    const el = $('pane-es'); if (!el) return;
    const songs = get(K_SONGS, []);
    const check = get(K_CHECK, {});
    const univ = get(K_UNIV, {});
    const hechos = Object.keys(check).reduce((a, k) => a + Object.keys(check[k] || {}).filter(x => check[k][x]).length, 0);
    const totalItems = (KB.fabrica || []).reduce((a, f) => a + (f.como || []).length, 0);
    const porEstado = {};
    songs.forEach(s => { porEstado[s.status] = (porEstado[s.status] || 0) + 1; });

    // "Qué hacer hoy" sale del estado real, no de una lista fija.
    let siguiente, porque;
    if (!songs.length) {
      siguiente = 'Abrí <b>Fundamentos</b> y dale a Tocar. Oí una progresión completa antes de leer una sola definición.';
      porque = 'Todavía no hay ninguna canción en el catálogo. El primer paso no es estudiar: es oír.';
    } else if (!univ.nombre) {
      siguiente = 'Definí tu <b>Universo</b>: nombre, tesis y los dos colores.';
      porque = 'Ya tenés ' + songs.length + ' canción(es) pero ningún mundo donde vivan. Sin identidad, cada publicación empieza de cero.';
    } else {
      const enIdea = songs.filter(s => s.status === 'idea').length;
      const enDemo = songs.filter(s => s.status === 'demo' || s.status === 'letra').length;
      if (enIdea > 2) { siguiente = 'Bajá el inventario: llevá una idea hasta <b>maqueta</b>.'; porque = 'Tenés ' + enIdea + ' ideas paradas. Las ideas no valen nada hasta que suenan.'; }
      else if (enDemo) { siguiente = 'Terminá la producción de una maqueta y <b>publicá</b>.'; porque = 'Una canción publicada al 85% enseña más que cinco guardadas al 95%.'; }
      else { siguiente = 'Escribí una canción nueva en <b>Fábrica → Idea</b>.'; porque = 'El catálogo está fluyendo. Alimentá la línea.'; }
    }

    el.innerHTML =
      '<div class="pilar">' +
        '<div class="pilar-q">«No necesitás saber música. Necesitás saber decidir.»</div>' +
        '<p>Este módulo no te enseña teoría: te la hace <b>sonar</b> y te deja tomar la decisión. ' +
        'Cada progresión, cada ritmo y cada tonalidad de aquí se toca en tiempo real desde el navegador. ' +
        'Lo que vendés no es el conocimiento musical — es la <b>canción terminada</b>.</p>' +
      '</div>' +

      '<div class="mus-stats">' +
        '<div class="ms"><div class="ms-v">' + songs.length + '</div><div class="ms-l">canciones</div></div>' +
        '<div class="ms"><div class="ms-v">' + (porEstado.lanzada || 0) + '</div><div class="ms-l">lanzadas</div></div>' +
        '<div class="ms"><div class="ms-v">' + (porEstado.vendida || 0) + '</div><div class="ms-l">vendidas</div></div>' +
        '<div class="ms"><div class="ms-v">' + hechos + '<span>/' + totalItems + '</span></div><div class="ms-l">pasos de fábrica</div></div>' +
        '<div class="ms"><div class="ms-v">' + (KB.generos || []).length + '</div><div class="ms-l">géneros</div></div>' +
      '</div>' +

      '<div class="hoy"><div class="hoy-t">→ Qué hacer ahora</div>' +
        '<div class="hoy-a">' + siguiente + '</div>' +
        '<div class="hoy-p">' + esc(porque) + '</div></div>' +

      '<div class="mus-h2">La línea de montaje</div>' +
      '<p class="mus-sub">De una idea suelta a una canción vendible en 9 estaciones. Cada una tiene su herramienta, su prompt y su entregable.</p>' +
      '<div class="pipe">' + (KB.fabrica || []).map(f =>
        '<button class="pipe-st" onclick="MUS.irFabrica(\'' + f.id + '\')">' +
          '<div class="pipe-n">' + f.n + '</div><div class="pipe-e">' + f.emoji + '</div>' +
          '<div class="pipe-nm">' + esc(f.nombre) + '</div></button>').join('<div class="pipe-ar">›</div>') +
      '</div>' +

      '<div class="mus-h2">Los 5 sombreros</div>' +
      '<div class="roles">' +
        rolCard('🎓', 'Tutor', 'Fundamentos', 'Teoría que suena, no que se lee. Piano, acordes y ritmos interactivos.', 'fu') +
        rolCard('🧬', 'Musicólogo', 'Géneros', 'El ADN de 10 géneros: BPM, patrón rítmico exacto, progresiones y errores de novato.', 'gn') +
        rolCard('🎼', 'Asistente de composición', 'Fábrica', 'Las 9 estaciones con prompts listos para Claude y Gemini.', 'fa') +
        rolCard('⚖️', 'Orientación legal', 'Legal', 'IA y autoría, covers, DNDA, SAYCO, splits y códigos. No sustituye a un abogado.', 'le') +
        rolCard('💼', 'Asesor y representante', 'Negocio', 'De dónde sale la plata de verdad, cómo pitchear y cómo poner precio.', 'ne') +
      '</div>' +

      (kbError ? '<div class="mus-warn">⚠️ El cerebro musical (data/music-kb.json) no cargó: <code>' + esc(kbError) +
        '</code>. Estás viendo el contenido mínimo de respaldo. El módulo sigue usable pero incompleto.</div>' : '') +
      '<div class="mus-foot">Cerebro musical v' + esc(KB.meta.version) + ' · corte ' + esc(KB.meta.corte) + '</div>';
  }
  function rolCard(ic, rol, tab, txt, t) {
    return '<button class="rol" onclick="MUS.tab(\'' + t + '\')"><div class="rol-i">' + ic + '</div>' +
      '<div class="rol-r">' + esc(rol) + '</div><div class="rol-d">' + esc(txt) + '</div>' +
      '<div class="rol-go">' + esc(tab) + ' →</div></button>';
  }
  function irFabrica(id) { showTab('fa'); setTimeout(() => { const e = document.getElementById('fb-' + id); if (e) { e.open = true; e.scrollIntoView({ behavior: 'smooth', block: 'center' }); } }, 80); }

  /* ═══ FUNDAMENTOS ═════════════════════════════════════════════ */
  function renderFundamentos() {
    const el = $('pane-fu'); if (!el) return;
    el.innerHTML =
      '<div class="mus-h2">El laboratorio</div>' +
      '<p class="mus-sub">Todo lo de abajo suena. Dale a <b>Tocar</b>, cambiá cosas y escuchá qué pasa. ' +
      'No hay nada que memorizar: el oído aprende solo cuando puede comparar.</p>' +
      '<div class="lab" id="labBox">' +
        '<div id="labCtl"></div>' +
        '<div id="labChords" class="lab-chords"></div>' +
        '<div id="labGrid" class="lab-grid"></div>' +
        '<div class="grid-help">Cada casilla es una <b>semicorchea</b>: 16 por compás. Los números marcan los 4 tiempos. ' +
        'Hacé clic para prender y apagar golpes — así se construye un ritmo, sin tocar ningún instrumento.</div>' +
        '<div id="labInfo"></div>' +
      '</div>' +

      '<div class="mus-h2">El teclado</div>' +
      '<p class="mus-sub">Las teclas resaltadas son las que pertenecen a la tonalidad elegida arriba. Tocá solo esas y no te podés equivocar.</p>' +
      '<div id="pianoWrap"></div>' +

      '<div class="mus-h2">Lo mínimo que hay que entender</div>' +
      '<div class="teoria">' + (KB.teoria || []).map(t =>
        '<details class="tcard"><summary><span class="tc-t">' + esc(t.titulo) + '</span></summary>' +
        '<div class="tc-body">' +
          '<p>' + md(t.cuerpo) + '</p>' +
          (t.analogia ? '<div class="tc-an"><b>Analogía:</b> ' + md(t.analogia) + '</div>' : '') +
          (t.porque_importa ? '<div class="tc-pi"><b>Por qué importa:</b> ' + md(t.porque_importa) + '</div>' : '') +
          (t.atajo ? '<div class="tc-at"><b>Atajo:</b> ' + md(t.atajo) + '</div>' : '') +
          (t.regla ? '<div class="tc-at"><b>Regla:</b> ' + md(t.regla) + '</div>' : '') +
          (t.regla_2026 ? '<div class="tc-at"><b>Regla 2026:</b> ' + md(t.regla_2026) + '</div>' : '') +
        '</div></details>').join('') +
      '</div>' +

      '<div class="mus-h2">Estructuras que funcionan</div>' +
      '<div class="estrs">' + (KB.estructuras || []).map(e =>
        '<div class="estr"><div class="estr-h"><b>' + esc(e.nombre) + '</b><span>' + esc(e.duracion) + '</span></div>' +
        '<div class="estr-b">' + (e.bloques || []).map(b =>
          '<div class="eb" style="flex:' + b[1] + '"><span>' + esc(b[0]) + '</span><i>' + b[1] + '</i></div>').join('') + '</div>' +
        '<div class="estr-u">' + esc(e.uso) + (e.nota ? ' · ' + esc(e.nota) : '') + '</div></div>').join('') +
      '</div>' +

      '<div class="mus-h2">Glosario</div>' +
      '<div class="glos">' + (KB.glosario || []).map(g =>
        '<div class="gl"><b>' + esc(g.t) + '</b><span>' + esc(g.d) + '</span></div>').join('') + '</div>';
    renderLab(); renderPiano();
  }

  /* ═══ GÉNEROS ═════════════════════════════════════════════════ */
  function renderGeneros() {
    const el = $('pane-gn'); if (!el) return;
    const gs = KB.generos || [];
    el.innerHTML =
      '<div class="mus-h2">El ADN de cada género</div>' +
      '<p class="mus-sub">Lo que define un género no es la melodía: es <b>qué casillas de la rejilla marcás</b>. ' +
      'Elegí uno y escuchalo en el laboratorio de abajo.</p>' +
      '<div class="gchips">' + gs.map(g =>
        '<button class="gchip' + (g.id === lab.genre ? ' on' : '') + '" onclick="MUS.setGenero(\'' + g.id + '\')">' +
        g.emoji + ' ' + esc(g.nombre) + '</button>').join('') + '</div>' +

      '<div class="lab" id="labBox">' +
        '<div id="labCtl"></div>' +
        '<div id="labChords" class="lab-chords"></div>' +
        '<div id="labGrid" class="lab-grid"></div>' +
        '<div id="labInfo"></div>' +
      '</div>' +

      '<div id="gDetail"></div>' +

      '<div class="mus-h2">Todos los géneros</div>' +
      '<div class="gcards">' + gs.map(g => tarjetaGenero(g)).join('') + '</div>';
    renderLab(); renderDetalleGenero();
  }

  function renderDetalleGenero() {
    const g = labGenero(); const el = $('gDetail'); if (!el || !g) return;
    const progs = (g.progresiones || []).map(id => progById(id)).filter(Boolean);
    el.innerHTML =
      '<div class="gdet">' +
        '<div class="gdet-h"><span class="gdet-e">' + g.emoji + '</span>' +
          '<div><h3>' + esc(g.nombre) + '</h3><span class="gdet-f">' + esc(g.familia || '') + '</span></div>' +
          confBadge(g.bpm_conf || g.conf) + '</div>' +
        '<div class="gdet-grid">' +
          dato('BPM', g.bpm ? g.bpm.min + '–' + g.bpm.max + ' (típico ' + g.bpm.tipico + ')' : '—') +
          dato('Compás', g.compas || '—') +
          dato('Tonalidad', g.tono || '—') +
          dato('Estructura', (KB.estructuras.find(e => e.id === g.estructura) || {}).nombre || '—') +
        '</div>' +
        (g.bpm_fuente ? '<div class="gdet-src"><b>Sobre el BPM:</b> ' + esc(g.bpm_fuente) + '</div>' : '') +
        (g.gancho ? '<div class="gdet-key"><b>🎯 El gancho del género:</b> ' + esc(g.gancho) + '</div>' : '') +
        (g.por_que_te_sirve ? '<div class="gdet-you">' + md(g.por_que_te_sirve) + '</div>' : '') +
        (g.contexto ? '<div class="gdet-ctx"><b>Contexto:</b> ' + esc(g.contexto) + (g.contexto_fuente ? ' <i>(' + esc(g.contexto_fuente) + ')</i>' : '') + '</div>' : '') +
        '<div class="gdet-cols">' +
          '<div><h4>Instrumentación</h4><ul>' + (g.instrumentacion || []).map(i => '<li>' + esc(i) + '</li>').join('') + '</ul></div>' +
          '<div><h4>Errores de novato</h4><ul class="err">' + (g.errores || []).map(i => '<li>' + esc(i) + '</li>').join('') + '</ul></div>' +
        '</div>' +
        (g.aires ? '<div class="aires"><h4>Los cuatro aires</h4>' + g.aires.map(a =>
          '<div class="aire"><b>' + esc(a.nombre) + '</b><span>' + esc(a.compas) + '</span><p>' + esc(a.caracter) + '</p></div>').join('') +
          (g.aires_fuente ? '<div class="gdet-src">' + esc(g.aires_fuente) + '</div>' : '') + '</div>' : '') +
        '<div class="gdet-progs"><h4>Progresiones que funcionan aquí</h4>' + progs.map(p =>
          '<button class="pbtn" onclick="MUS.setProg(\'' + p.id + '\')"><b>' + esc(p.nombre) + '</b><span>' + p.grados.join(' – ') + '</span></button>').join('') + '</div>' +
        (g.prompt_ia ? '<div class="gdet-prompt"><h4>Prompt para el generador de IA</h4>' +
          '<pre>' + esc(g.prompt_ia) + '</pre>' +
          '<button class="mus-btn" onclick="MUS.copyPrompt(\'' + g.id + '\')">📋 Copiar</button>' +
          '<span class="gdet-warn">Nunca pongas el nombre de un artista real en el prompt. Describí el sonido, no la persona.</span></div>' : '') +
      '</div>';
  }
  function copyPrompt(gid) {
    const g = (KB.generos || []).find(x => x.id === gid);
    if (g && g.prompt_ia) copy(g.prompt_ia, 'Prompt copiado ✓');
  }
  function dato(l, v) { return '<div class="dt"><span>' + esc(l) + '</span><b>' + esc(v) + '</b></div>'; }
  function confBadge(c) {
    if (c === 'alta') return '<span class="cbadge alta" title="Con fuente documental">✓ verificado</span>';
    if (c === 'media') return '<span class="cbadge media" title="Consenso de oficio, sin fuente documental que lo fije">~ consenso</span>';
    return '<span class="cbadge hip" title="Hipótesis — verificar antes de usar">? hipótesis</span>';
  }
  function tarjetaGenero(g) {
    return '<button class="gcard' + (g.id === lab.genre ? ' on' : '') + '" onclick="MUS.setGenero(\'' + g.id + '\')">' +
      '<div class="gc-e">' + g.emoji + '</div>' +
      '<div class="gc-n">' + esc(g.nombre) + '</div>' +
      '<div class="gc-b">' + (g.bpm ? g.bpm.tipico + ' BPM' : '') + '</div>' +
      '<div class="gc-g">' + esc((g.gancho || '').slice(0, 70)) + '…</div></button>';
  }

  /* ═══ FÁBRICA ═════════════════════════════════════════════════ */
  function renderFabrica() {
    const el = $('pane-fa'); if (!el) return;
    const check = get(K_CHECK, {});
    el.innerHTML =
      '<div class="mus-h2">De la idea a la canción vendible</div>' +
      '<p class="mus-sub">Nueve estaciones en orden. Cada una tiene un <b>entregable</b> concreto: si no lo tenés, no pasás a la siguiente. ' +
      'Los checks se guardan y sincronizan.</p>' +
      (KB.fabrica || []).map(f => {
        const c = check[f.id] || {};
        const done = (f.como || []).filter((_, i) => c[i]).length;
        const tot = (f.como || []).length;
        return '<details class="fab" id="fb-' + f.id + '"' + (done && done < tot ? ' open' : '') + '>' +
          '<summary><span class="fab-n">' + f.n + '</span><span class="fab-e">' + f.emoji + '</span>' +
          '<span class="fab-t">' + esc(f.nombre) + '</span>' +
          '<span class="fab-p' + (done === tot && tot ? ' full' : '') + '">' + done + '/' + tot + '</span></summary>' +
          '<div class="fab-b">' +
            '<div class="fab-obj"><b>Objetivo:</b> ' + esc(f.objetivo) + '</div>' +
            '<div class="fab-ent"><b>Entregable:</b> ' + esc(f.entregable) + '</div>' +
            '<div class="fab-steps">' + (f.como || []).map((s, i) =>
              '<label class="fstep' + (c[i] ? ' done' : '') + '">' +
              '<input type="checkbox"' + (c[i] ? ' checked' : '') + ' onchange="MUS.check(\'' + f.id + '\',' + i + ',this.checked)">' +
              '<span>' + md(s) + '</span></label>').join('') + '</div>' +
            '<div class="fab-tools"><b>Herramientas:</b> ' + (f.herramientas || []).map(t => '<span class="tchip">' + esc(t) + '</span>').join('') + '</div>' +
            (f.gotcha ? '<div class="fab-got">' + md(f.gotcha) + '</div>' : '') +
            (f.prompt ? '<div class="fab-pr"><div class="fab-pr-h">Prompt listo para Claude / Gemini' +
              '<button class="mus-btn sm" onclick="MUS.copyFab(\'' + f.id + '\')">📋 Copiar</button></div>' +
              '<pre>' + esc(f.prompt) + '</pre></div>' : '') +
          '</div></details>';
      }).join('');
  }
  function check(fid, i, v) {
    const c = get(K_CHECK, {});
    if (!c[fid]) c[fid] = {};
    if (v) c[fid][i] = true; else delete c[fid][i];
    set(K_CHECK, c);
    renderFabrica();
  }
  function copyFab(fid) {
    const f = (KB.fabrica || []).find(x => x.id === fid);
    if (f && f.prompt) copy(f.prompt, 'Prompt copiado — pegalo en Claude o Gemini ✓');
  }

  /* ═══ ARSENAL ═════════════════════════════════════════════════ */
  let arsFiltro = 'todas';
  function renderArsenal() {
    const el = $('pane-ar'); if (!el) return;
    const items = KB.arsenal || [];
    const cats = ['todas'].concat([...new Set(items.map(i => i.cat))]);
    const vis = arsFiltro === 'todas' ? items : items.filter(i => i.cat === arsFiltro);
    el.innerHTML =
      '<div class="mus-h2">El arsenal</div>' +
      '<p class="mus-sub">Investigado el <b>' + esc(KB.meta.corte) + '</b>. ' +
      '<b>No hay precios ni versiones aquí a propósito</b>: cambian cada mes y una cifra vieja es peor que ninguna. ' +
      'Cada ficha lleva su enlace oficial — el precio se confirma ahí, el día que lo vayas a pagar.</p>' +
      '<div class="afilt">' + cats.map(c =>
        '<button class="achip' + (c === arsFiltro ? ' on' : '') + '" onclick="MUS.arsFiltro(\'' + c + '\')">' + esc(c) + '</button>').join('') + '</div>' +
      '<div class="acards">' + vis.map(a =>
        '<div class="acard' + ((a.porque || '').includes('🎯') ? ' star' : '') + '">' +
          '<div class="ac-h"><b>' + esc(a.nombre) + '</b>' +
            '<span class="ac-cat">' + esc(a.cat) + '</span></div>' +
          '<div class="ac-rol">' + esc(a.rol) + '</div>' +
          '<div class="ac-why">' + md(a.porque) + '</div>' +
          (a.riesgo ? '<div class="ac-risk">' + md(a.riesgo) + '</div>' : '') +
          '<div class="ac-f"><span class="ac-cost">' + esc(a.costo) + '</span>' +
            '<span class="ac-ver">corte ' + esc(a.ver) + '</span>' +
            '<a href="' + esc(a.url) + '" target="_blank" rel="noopener">sitio oficial →</a></div>' +
        '</div>').join('') + '</div>';
  }
  function setArsFiltro(c) { arsFiltro = c; renderArsenal(); }

  /* ═══ LEGAL ═══════════════════════════════════════════════════ */
  function renderLegal() {
    const el = $('pane-le'); if (!el) return;
    el.innerHTML =
      '<div class="mus-warn big">⚖️ <b>Esto no es asesoría legal.</b> Es el mapa del terreno, en español y sin jerga, ' +
      'para que sepas qué preguntar y dónde está el riesgo. Cualquier contrato que vayas a firmar lo revisa un abogado ' +
      'de entretenimiento en Colombia. Investigado el ' + esc(KB.meta.corte) + ' — las reglas de IA y música cambian rápido: revalidá antes de decidir.</div>' +
      (KB.legal || []).map(l =>
        '<details class="lcard"' + (l.orden <= 2 ? ' open' : '') + '><summary>' +
        '<span class="lc-n">' + l.orden + '</span>' + esc(l.titulo) + '</summary>' +
        '<div class="lc-b">' + md(l.cuerpo) +
          (l.traduccion ? '<div class="lc-tr"><b>En corto:</b> ' + md(l.traduccion) + '</div>' : '') +
          (l.accion ? '<div class="lc-ac">' + md(l.accion) + '</div>' : '') +
          (l.fuente ? '<div class="lc-src"><b>Fuente:</b> ' + esc(l.fuente) + '</div>' : '') +
        '</div></details>').join('') +
      '<div class="mus-h2">Calculadora de splits</div>' +
      '<p class="mus-sub">Repartí los porcentajes de la obra y generá el texto del acuerdo. ' +
      '<b>Se firma el mismo día de la sesión</b>, antes de saber si la canción va a pegar.</p>' +
      '<div id="splitBox"></div>';
    renderSplits();
  }

  let splits = [{ n: 'BARROS TORRES MIGUEL ANGEL', d: '1063955980', r: 'Letra y melodía', p: 100, s: 'SAYCO (pendiente)' }];
  function renderSplits() {
    const el = $('splitBox'); if (!el) return;
    const tot = splits.reduce((a, s) => a + (+s.p || 0), 0);
    el.innerHTML =
      '<div class="splits">' + splits.map((s, i) =>
        '<div class="sp"><input value="' + esc(s.n) + '" placeholder="Nombre legal completo" oninput="MUS.spSet(' + i + ',\'n\',this.value)">' +
        '<input value="' + esc(s.d) + '" placeholder="Documento" oninput="MUS.spSet(' + i + ',\'d\',this.value)">' +
        '<input value="' + esc(s.r) + '" placeholder="Aporte (letra / música / ambas)" oninput="MUS.spSet(' + i + ',\'r\',this.value)">' +
        '<input value="' + esc(s.s) + '" placeholder="Sociedad de gestión" oninput="MUS.spSet(' + i + ',\'s\',this.value)">' +
        '<input class="sp-p" type="number" min="0" max="100" value="' + s.p + '" oninput="MUS.spSet(' + i + ',\'p\',this.value)"><span class="sp-pc">%</span>' +
        (splits.length > 1 ? '<button class="sp-x" onclick="MUS.spDel(' + i + ')">✕</button>' : '') + '</div>').join('') +
      '</div>' +
      '<div class="sp-tot' + (tot === 100 ? ' ok' : ' bad') + '">Total: <b>' + tot + '%</b>' +
        (tot === 100 ? ' ✓ correcto' : ' ✕ tiene que sumar exactamente 100') + '</div>' +
      '<div class="sp-acts"><button class="mus-btn" onclick="MUS.spAdd()">+ Coautor</button>' +
        '<button class="mus-btn primary" onclick="MUS.spCopy()">📋 Copiar acuerdo</button></div>';
  }
  function spSet(i, k, v) { splits[i][k] = k === 'p' ? (+v || 0) : v; renderSplits(); }
  function spAdd() { splits.push({ n: '', d: '', r: '', p: 0, s: '' }); renderSplits(); }
  function spDel(i) { splits.splice(i, 1); renderSplits(); }
  function spCopy() {
    const tot = splits.reduce((a, s) => a + (+s.p || 0), 0);
    if (tot !== 100) { toast('Los porcentajes deben sumar 100 antes de generar el acuerdo'); return; }
    const t =
'ACUERDO DE PARTICIPACIÓN EN OBRA MUSICAL (SPLIT SHEET)\n' +
'════════════════════════════════════════════════════\n\n' +
'Título de la obra: ____________________________________\n' +
'Fecha del acuerdo: ' + new Date().toLocaleDateString('es-CO') + '\n' +
'Lugar: ________________________________________________\n\n' +
'Los abajo firmantes declaran ser coautores de la obra musical\n' +
'identificada arriba, y acuerdan la siguiente participación sobre\n' +
'los derechos de la OBRA (composición: letra y música):\n\n' +
splits.map((s, i) =>
' ' + (i + 1) + ') ' + (s.n || '_______________________') + '\n' +
'    Documento: ' + (s.d || '____________') + '\n' +
'    Aporte: ' + (s.r || '____________') + '\n' +
'    Sociedad de gestión: ' + (s.s || '____________') + '\n' +
'    Participación: ' + s.p + '%\n').join('\n') +
'\n TOTAL: 100%\n\n' +
'Este acuerdo se refiere exclusivamente a los derechos sobre la OBRA.\n' +
'Los derechos sobre el FONOGRAMA (la grabación) se acuerdan por separado.\n\n' +
'Firmas:\n\n' +
splits.map(s => '  _____________________________\n  ' + (s.n || '') + '\n').join('\n') +
'\n────────────────────────────────────────────────────\n' +
'Generado por 18-MUS · DA-2026. Documento de trabajo, no minuta\n' +
'legal. Antes de firmar algo con efectos económicos relevantes,\n' +
'validalo con un abogado de entretenimiento.\n';
    copy(t, 'Acuerdo copiado — pegalo en un documento y fírmenlo ✓');
  }

  /* ═══ NEGOCIO ═════════════════════════════════════════════════ */
  function renderNegocio() {
    const el = $('pane-ne'); if (!el) return;
    el.innerHTML =
      '<div class="mus-h2">El negocio, sin humo</div>' +
      (KB.negocio || []).map(n =>
        '<div class="ncard"><h3><span>' + n.orden + '</span>' + esc(n.titulo) + '</h3>' +
        '<div class="nc-b">' + md(n.cuerpo) + '</div>' +
        (n.realidad ? '<div class="nc-real">' + md(n.realidad) + '</div>' : '') +
        (n.accion ? '<div class="nc-ac">' + md(n.accion) + '</div>' : '') +
        (n.fuente ? '<div class="lc-src"><b>Fuente:</b> ' + esc(n.fuente) + '</div>' : '') +
        '</div>').join('');
  }

  /* ═══ UNIVERSO ════════════════════════════════════════════════ */
  function renderUniverso() {
    const el = $('pane-un'); if (!el) return;
    const u = get(K_UNIV, {});
    el.innerHTML =
      '<div class="mus-h2">Tu universo</div>' +
      '<p class="mus-sub">Seis decisiones que no se cambian en seis meses. La consistencia es lo que construye reconocimiento.</p>' +
      '<div class="uform">' +
        uf('nombre', 'Nombre del proyecto', 'Corto, pronunciable en español e inglés, buscable', u.nombre) +
        uf('tesis', 'Tesis · por qué existís', 'Una frase que solo vos podés decir. No "hago música".', u.tesis) +
        '<div class="uf-row">' +
          '<label class="uf"><span>Color 1</span><input type="color" value="' + esc(u.c1 || '#8b5cf6') + '" oninput="MUS.uSet(\'c1\',this.value)"></label>' +
          '<label class="uf"><span>Color 2</span><input type="color" value="' + esc(u.c2 || '#f59e0b') + '" oninput="MUS.uSet(\'c2\',this.value)"></label>' +
        '</div>' +
        uf('pov', 'Punto de vista', '¿Quién habla? ¿Vos a cámara? ¿Solo las manos? ¿Un personaje?', u.pov) +
        uf('serie', 'Formato recurrente', 'La serie con nombre propio que la gente va a esperar', u.serie) +
        uf('ritual', 'Ritual', 'Lo que se repite en cada pieza: una frase, un gesto, un sonido', u.ritual) +
      '</div>' +
      (u.nombre ? '<div class="upreview" style="--u1:' + esc(u.c1 || '#8b5cf6') + ';--u2:' + esc(u.c2 || '#f59e0b') + '">' +
        '<div class="up-n">' + esc(u.nombre) + '</div>' +
        (u.tesis ? '<div class="up-t">' + esc(u.tesis) + '</div>' : '') +
        (u.serie ? '<div class="up-s">Serie: ' + esc(u.serie) + '</div>' : '') + '</div>' : '') +
      (KB.universo || []).map(x =>
        '<div class="ucard"><h3><span>' + x.orden + '</span>' + esc(x.titulo) + '</h3>' +
        '<div class="nc-b">' + md(x.cuerpo) + '</div>' +
        (x.accion ? '<div class="nc-ac">' + md(x.accion) + '</div>' : '') +
        (x.fuente ? '<div class="lc-src"><b>Fuente:</b> ' + esc(x.fuente) + '</div>' : '') + '</div>').join('');
  }
  function uf(k, l, ph, v) {
    return '<label class="uf"><span>' + esc(l) + '</span>' +
      '<input value="' + esc(v || '') + '" placeholder="' + esc(ph) + '" onchange="MUS.uSet(\'' + k + '\',this.value)"></label>';
  }
  function uSet(k, v) { const u = get(K_UNIV, {}); u[k] = v; u.upd = now(); set(K_UNIV, u); if (k !== 'c1' && k !== 'c2') renderUniverso(); }

  /* ═══ CATÁLOGO ════════════════════════════════════════════════ */
  function renderCatalogo() {
    const el = $('pane-ca'); if (!el) return;
    const songs = get(K_SONGS, []).slice().sort((a, b) => (b.upd || b.ts || '').localeCompare(a.upd || a.ts || ''));
    el.innerHTML =
      '<div class="mus-h2">Catálogo de obras</div>' +
      '<p class="mus-sub">Cada canción con su estado, sus datos técnicos, sus códigos y — importante — <b>qué hizo la IA y qué hiciste vos</b>. ' +
      'Esa bitácora es tu defensa de autoría el día que alguien pregunte.</p>' +
      '<button class="mus-btn primary" onclick="MUS.nueva()">+ Nueva canción</button>' +
      '<div id="songForm"></div>' +
      (songs.length ? '<div class="songs">' + songs.map(s => {
        const e = estadoDe(s.status);
        return '<div class="song"><div class="so-h">' +
          '<div class="so-t">' + esc(s.title || '(sin título)') + '</div>' +
          '<span class="so-st" style="--c:' + e.c + '">' + e.lbl + '</span></div>' +
          '<div class="so-m">' + [s.genre, s.bpm ? s.bpm + ' BPM' : '', s.key, s.isrc ? 'ISRC ' + s.isrc : '']
            .filter(Boolean).map(x => '<span>' + esc(x) + '</span>').join('') + '</div>' +
          (s.hook ? '<div class="so-hook">🎣 ' + esc(s.hook) + '</div>' : '') +
          (s.ai ? '<div class="so-ai"><b>IA:</b> ' + esc(s.ai) + '</div>' : '') +
          (s.splits ? '<div class="so-sp">' + esc(s.splits) + '</div>' : '') +
          '<div class="so-f"><span>' + fecha(s.upd || s.ts) + '</span>' +
          '<div><button class="mus-btn sm" onclick="MUS.editar(\'' + s.id + '\')">Editar</button>' +
          '<button class="mus-btn sm ghost" onclick="MUS.borrar(\'' + s.id + '\')">Borrar</button></div></div></div>';
      }).join('') + '</div>'
        : '<div class="mus-empty big">Todavía no hay canciones.<br>Empezá por <b>Fábrica → 1. Idea</b> y volvé acá cuando tengas el título.</div>');
  }

  let editando = null;
  function nueva() { editando = { id: uid(), status: 'idea', genre: lab.genre, bpm: lab.bpm, key: lab.key + ' ' + lab.mode, ts: now() }; formSong(); }
  function editar(id) { editando = (get(K_SONGS, []).find(s => s.id === id)) || null; if (editando) formSong(); }
  function formSong() {
    const el = $('songForm'); if (!el || !editando) return;
    const s = editando;
    el.innerHTML =
      '<div class="sform">' +
        '<div class="sf-row"><label><span>Título</span><input id="sf_title" value="' + esc(s.title || '') + '"></label>' +
        '<label><span>Estado</span><select id="sf_status">' + ESTADOS.map(e =>
          '<option value="' + e.id + '"' + (e.id === s.status ? ' selected' : '') + '>' + e.lbl + '</option>').join('') + '</select></label></div>' +
        '<div class="sf-row"><label><span>Género</span><select id="sf_genre">' + (KB.generos || []).map(g =>
          '<option value="' + g.id + '"' + (g.id === s.genre ? ' selected' : '') + '>' + esc(g.nombre) + '</option>').join('') + '</select></label>' +
        '<label><span>BPM</span><input id="sf_bpm" type="number" value="' + esc(s.bpm || '') + '"></label>' +
        '<label><span>Tonalidad</span><input id="sf_key" value="' + esc(s.key || '') + '" placeholder="A menor"></label></div>' +
        '<label><span>Gancho de 7–15 s (qué fragmento va a redes)</span><input id="sf_hook" value="' + esc(s.hook || '') + '"></label>' +
        '<label><span>Bitácora de IA · qué hizo la máquina y qué hiciste vos</span>' +
        '<textarea id="sf_ai" rows="3" placeholder="Ej: letra escrita por mí a mano; melodía cantada por mí (grabación del 12-sep en el celular); Suno usado solo para el instrumental de la maqueta; producción final en FL Studio.">' + esc(s.ai || '') + '</textarea></label>' +
        '<label><span>Splits acordados</span><input id="sf_splits" value="' + esc(s.splits || '') + '" placeholder="Miguel 100% · o: Miguel 50% / Fulano 50%"></label>' +
        '<div class="sf-row"><label><span>ISRC</span><input id="sf_isrc" value="' + esc(s.isrc || '') + '"></label>' +
        '<label><span>Enlaces</span><input id="sf_links" value="' + esc(s.links || '') + '" placeholder="Drive, Spotify, BeatStars…"></label></div>' +
        '<label><span>Notas</span><textarea id="sf_notes" rows="3">' + esc(s.notes || '') + '</textarea></label>' +
        '<div class="sf-acts"><button class="mus-btn primary" onclick="MUS.guardar()">Guardar</button>' +
        '<button class="mus-btn ghost" onclick="MUS.cancelar()">Cancelar</button></div>' +
      '</div>';
    setTimeout(() => { const t = $('sf_title'); if (t) t.focus(); }, 40);
  }
  function guardar() {
    if (!editando) return;
    const v = id => { const e = $(id); return e ? e.value.trim() : ''; };
    Object.assign(editando, {
      title: v('sf_title'), status: v('sf_status'), genre: v('sf_genre'),
      bpm: v('sf_bpm'), key: v('sf_key'), hook: v('sf_hook'), ai: v('sf_ai'),
      splits: v('sf_splits'), isrc: v('sf_isrc'), links: v('sf_links'),
      notes: v('sf_notes'), upd: now()
    });
    if (!editando.title) { toast('Ponele un título, aunque sea provisional'); return; }
    const songs = get(K_SONGS, []);
    const i = songs.findIndex(x => x.id === editando.id);
    if (i >= 0) songs[i] = editando; else songs.push(editando);
    set(K_SONGS, songs);
    editando = null;
    renderCatalogo();
    toast('Guardado ✓');
  }
  function cancelar() { editando = null; renderCatalogo(); }
  function borrar(id) {
    const songs = get(K_SONGS, []);
    const s = songs.find(x => x.id === id);
    if (!s) return;
    if (!confirm('¿Borrar «' + (s.title || 'sin título') + '»?\n\nEsto no se puede deshacer.')) return;
    set(K_SONGS, songs.filter(x => x.id !== id));
    renderCatalogo(); toast('Borrada');
  }

  /* ── markdown mínimo: **negrita**, `código`, saltos de línea ── */
  function md(s) {
    return esc(s == null ? '' : s)
      .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  /* ═══ INIT ════════════════════════════════════════════════════ */
  async function init() {
    await loadKB();
    restaurarLab();
    const nav = $('musTabs');
    if (nav) nav.innerHTML = TABS.map(([id, ic, n]) =>
      '<button class="mus-tab" data-t="' + id + '" onclick="MUS.tab(\'' + id + '\')"><span>' + ic + '</span>' + n + '</button>').join('');
    if (window.MUSUI) MUSUI.init(KB);
    let t = 'es';
    try { t = localStorage.getItem(K_TAB) || 'es'; } catch (e) {}
    if (!TABS.some(x => x[0] === t)) t = 'es';
    showTab(t);
    // Cortar el audio al salir: nadie quiere un loop de dembow sonando
    // desde una pestaña que ya no está mirando.
    document.addEventListener('visibilitychange', () => { if (document.hidden) { labStop(); flushLab(); } });
    window.addEventListener('pagehide', () => { labStop(); flushLab(); });
  }

  return {
    init, tab: showTab, irFabrica, toast, copiar: copy,
    // laboratorio
    play: labPlay, stop: labStop, setBpm: labSetBpm, setKey: labSetKey, setMode: labSetMode,
    setProg: labSetProg, setGenero: labSetGenero, toggleDrums: labToggleDrums, voice: labVoice,
    toggleCasilla: labToggleCasilla, acordeSuelto: labAcordeSuelto, resetPatron, nota,
    // contenido
    copyPrompt, copyFab, check, arsFiltro: setArsFiltro,
    // splits
    spSet, spAdd, spDel, spCopy,
    // universo + catálogo
    uSet, nueva, editar, guardar, cancelar, borrar
  };
})();

/* Mismo motivo que en music-audio.js: publicarlo en window explícitamente
   para que ningún guard `window.MUS` falle en silencio. */
window.MUS = MUS;

document.addEventListener('DOMContentLoaded', () => MUS.init());
