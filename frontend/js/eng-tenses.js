// ══════════════════════════════════════════════════════════════
// ENG_TENSES · F1 + F2 · Tiempos Verbales + Forja de Oraciones
// F1: grid 4×3 + modal de lección
// F2: motor buildSentence(tense, mood, subject, verb, complement)
//     + UI Forja con form interactivo + 5 variaciones + guardar en notas
// Storage: localStorage 'eng_tense_progress' (synced via cloud-sync.js)
// Exposes: window.ENG_TENSES { init, openLesson, mark, getProgress,
//          buildSentence, openForja, randomSentence, SUBJECTS, VERBS }
// ══════════════════════════════════════════════════════════════
const ENG_TENSES = (function(){
  'use strict';

  let T = null;                    // data/tenses.json cargado
  const KEY = 'eng_tense_progress';
  const VIEW_KEY = 'eng_tense_view';   // 'grid' | 'map'
  let CURRENT_VIEW = 'grid';
  const FORJA = { tenseId:'present_simple', mood:'affirmative', subjectKey:'I', verbBase:'work', complement:'' };

  // ── F3 · Mapa de Tiempos · aristas tipadas ──────────
  // 'trap' = trampa hispana (ámbar punteada)
  // 'seq'  = secuencia temporal (verde sólida)
  // 'evo'  = evolución por aspecto en la misma fila (violeta sutil)
  const TENSE_EDGES = [
    // Trampas hispanas
    { from:'present_perfect', to:'past_simple', kind:'trap', label:'Con fecha específica ("in 2022") cambia a past simple, NO present perfect.' },
    { from:'present_perfect', to:'present_simple', kind:'trap', label:'"Vivo aquí desde X años" → present perfect, NO present simple.' },
    { from:'past_continuous', to:'past_simple', kind:'trap', label:'Imperfecto continuo vs pretérito puntual. En narración van juntos.' },
    { from:'future_simple', to:'present_simple', kind:'trap', label:'Español usa presente para futuro cercano ("te llamo mañana"); inglés exige will/going to.' },
    // Secuencia temporal (pasado del pasado, etc.)
    { from:'past_simple', to:'past_perfect', kind:'seq', label:'Past Perfect marca acción anterior a un past simple ("when I arrived, the meeting had ended").' },
    { from:'present_simple', to:'future_simple', kind:'seq', label:'Salto al futuro con will / going to.' },
    { from:'future_simple', to:'future_perfect', kind:'seq', label:'Future Perfect = acción terminada antes de un futuro ("by Friday I will have finished").' },
    // Evolución por aspecto (misma fila del grid)
    { from:'past_simple', to:'past_continuous', kind:'evo' },
    { from:'past_continuous', to:'past_perfect', kind:'evo' },
    { from:'past_perfect', to:'past_perfect_continuous', kind:'evo' },
    { from:'present_simple', to:'present_continuous', kind:'evo' },
    { from:'present_continuous', to:'present_perfect', kind:'evo' },
    { from:'present_perfect', to:'present_perfect_continuous', kind:'evo' },
    { from:'future_simple', to:'future_continuous', kind:'evo' },
    { from:'future_continuous', to:'future_perfect', kind:'evo' },
    { from:'future_perfect', to:'future_perfect_continuous', kind:'evo' }
  ];

  // ── Datos del motor ───────────────────
  // Sujetos con conjugaciones precomputadas
  const SUBJECTS = [
    { k:'I',    person:'1s', es:'yo',                  be_pres:'am',  be_past:'was',  have_pres:'have' },
    { k:'you',  person:'2',  es:'tú / usted / ustedes', be_pres:'are', be_past:'were', have_pres:'have' },
    { k:'he',   person:'3s', es:'él',                  be_pres:'is',  be_past:'was',  have_pres:'has'  },
    { k:'she',  person:'3s', es:'ella',                be_pres:'is',  be_past:'was',  have_pres:'has'  },
    { k:'it',   person:'3s', es:'eso',                 be_pres:'is',  be_past:'was',  have_pres:'has'  },
    { k:'we',   person:'1p', es:'nosotros',            be_pres:'are', be_past:'were', have_pres:'have' },
    { k:'they', person:'3p', es:'ellos / ellas',       be_pres:'are', be_past:'were', have_pres:'have' }
  ];

  // Verbos con todas las formas precomputadas (mezcla reg/irreg, dominio data-analyst)
  const VERBS = [
    { base:'work',    past:'worked',   part:'worked',   ing:'working',   es:'trabajar' },
    { base:'build',   past:'built',    part:'built',    ing:'building',  es:'construir', irr:true },
    { base:'write',   past:'wrote',    part:'written',  ing:'writing',   es:'escribir',  irr:true },
    { base:'run',     past:'ran',      part:'run',      ing:'running',   es:'correr/ejecutar', irr:true },
    { base:'send',    past:'sent',     part:'sent',     ing:'sending',   es:'enviar',    irr:true },
    { base:'get',     past:'got',      part:'gotten',   ing:'getting',   es:'obtener',   irr:true },
    { base:'make',    past:'made',     part:'made',     ing:'making',    es:'hacer/crear', irr:true },
    { base:'do',      past:'did',      part:'done',     ing:'doing',     es:'hacer',     irr:true },
    { base:'have',    past:'had',      part:'had',      ing:'having',    es:'tener',     irr:true, third:'has' },
    { base:'go',      past:'went',     part:'gone',     ing:'going',     es:'ir',        irr:true },
    { base:'see',     past:'saw',      part:'seen',     ing:'seeing',    es:'ver',       irr:true },
    { base:'take',    past:'took',     part:'taken',    ing:'taking',    es:'tomar',     irr:true },
    { base:'give',    past:'gave',     part:'given',    ing:'giving',    es:'dar',       irr:true },
    { base:'find',    past:'found',    part:'found',    ing:'finding',   es:'encontrar', irr:true },
    { base:'lead',    past:'led',      part:'led',      ing:'leading',   es:'liderar',   irr:true },
    { base:'come',    past:'came',     part:'come',     ing:'coming',    es:'venir',     irr:true },
    { base:'speak',   past:'spoke',    part:'spoken',   ing:'speaking',  es:'hablar',    irr:true },
    { base:'know',    past:'knew',     part:'known',    ing:'knowing',   es:'saber/conocer', irr:true },
    { base:'finish',  past:'finished', part:'finished', ing:'finishing', es:'terminar'   },
    { base:'plan',    past:'planned',  part:'planned',  ing:'planning',  es:'planear'    },
    { base:'ship',    past:'shipped',  part:'shipped',  ing:'shipping',  es:'lanzar/desplegar' },
    { base:'test',    past:'tested',   part:'tested',   ing:'testing',   es:'probar'     },
    { base:'learn',   past:'learned',  part:'learned',  ing:'learning',  es:'aprender'   },
    { base:'use',     past:'used',     part:'used',     ing:'using',     es:'usar'       },
    { base:'create',  past:'created',  part:'created',  ing:'creating',  es:'crear'      },
    { base:'analyze', past:'analyzed', part:'analyzed', ing:'analyzing', es:'analizar'   },
    { base:'design',  past:'designed', part:'designed', ing:'designing', es:'diseñar'    },
    { base:'deploy',  past:'deployed', part:'deployed', ing:'deploying', es:'desplegar'  },
    { base:'fix',     past:'fixed',    part:'fixed',    ing:'fixing',    es:'arreglar'   },
    { base:'review',  past:'reviewed', part:'reviewed', ing:'reviewing', es:'revisar'    },
    { base:'present', past:'presented',part:'presented',ing:'presenting',es:'presentar'  },
    { base:'study',   past:'studied',  part:'studied',  ing:'studying',  es:'estudiar'   }
  ];

  // Complementos típicos del dominio para sugerir
  const COMPLEMENT_SUGGESTIONS = [
    "with Python", "the report", "the migration", "for 3 hours", "yesterday",
    "every Monday", "tomorrow", "with the team", "for the client", "by Friday",
    "all morning", "since 9 AM", "before the meeting", "in production", "in 2024"
  ];

  // ── Persistencia ───────────────────────
  function _getProgress(){
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); }
    catch(e){ return {}; }
  }
  function _setProgress(p){
    try { localStorage.setItem(KEY, JSON.stringify(p)); } catch(e){}
  }

  // ── Helpers ────────────────────────────
  function _esc(s){
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function _escAttr(s){
    return String(s||'').replace(/'/g,"\\'").replace(/"/g,'&quot;');
  }
  function _by(id){ return document.getElementById(id); }
  function _cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }

  function _speak(text){
    if(window.ENG && typeof ENG.speak === 'function'){
      ENG.speak(text);
    } else if(window.speechSynthesis){
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US'; u.rate = 0.85;
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    }
  }

  function _findSubject(k){ return SUBJECTS.find(s => s.k === k); }
  function _findVerb(b){ return VERBS.find(v => v.base === b); }
  function _findTense(id){ return T && T.tenses.find(t => t.id === id); }

  // ── Motor de conjugación ──────────────────────────
  // Tercera persona singular: aplicar regla o usar `third` si está
  function _thirdSing(verb){
    if(verb.third) return verb.third;
    const b = verb.base;
    if(/(s|x|z|ch|sh|o)$/.test(b)) return b + 'es';
    if(/[^aeiou]y$/.test(b))       return b.slice(0,-1) + 'ies';
    return b + 's';
  }

  // Construye la oración + array de slots tipados {t,w}
  // t: 's' subject, 'aux' auxiliar, 'v' verbo, 'c' complemento, 'not' negación
  function buildSentence(tenseId, mood, subjectKey, verbBase, complement){
    const tense = _findTense(tenseId);
    const subject = _findSubject(subjectKey);
    const verb = _findVerb(verbBase);
    if(!tense || !subject || !verb) return null;

    const is3s = subject.person === '3s';
    const beP  = subject.be_pres;
    const bePa = subject.be_past;
    const havP = subject.have_pres;
    const thirdV = _thirdSing(verb);

    let parts = [];

    function aff(arr){ parts = arr; }
    function neg(arr){ parts = arr; }
    function q(arr){ parts = arr; }

    switch(tenseId){
      case 'present_simple':
        if(mood==='affirmative') aff([{t:'s',w:subject.k},{t:'v',w:is3s?thirdV:verb.base}]);
        else if(mood==='negative') neg([{t:'s',w:subject.k},{t:'aux',w:is3s?"doesn't":"don't"},{t:'v',w:verb.base}]);
        else q([{t:'aux',w:is3s?'Does':'Do'},{t:'s',w:subject.k},{t:'v',w:verb.base}]);
        break;

      case 'present_continuous':
        if(mood==='affirmative') aff([{t:'s',w:subject.k},{t:'aux',w:beP},{t:'v',w:verb.ing}]);
        else if(mood==='negative') neg([{t:'s',w:subject.k},{t:'aux',w:beP},{t:'not',w:'not'},{t:'v',w:verb.ing}]);
        else q([{t:'aux',w:_cap(beP)},{t:'s',w:subject.k},{t:'v',w:verb.ing}]);
        break;

      case 'present_perfect':
        if(mood==='affirmative') aff([{t:'s',w:subject.k},{t:'aux',w:havP},{t:'v',w:verb.part}]);
        else if(mood==='negative') neg([{t:'s',w:subject.k},{t:'aux',w:havP},{t:'not',w:'not'},{t:'v',w:verb.part}]);
        else q([{t:'aux',w:_cap(havP)},{t:'s',w:subject.k},{t:'v',w:verb.part}]);
        break;

      case 'present_perfect_continuous':
        if(mood==='affirmative') aff([{t:'s',w:subject.k},{t:'aux',w:havP+' been'},{t:'v',w:verb.ing}]);
        else if(mood==='negative') neg([{t:'s',w:subject.k},{t:'aux',w:havP},{t:'not',w:'not'},{t:'aux',w:'been'},{t:'v',w:verb.ing}]);
        else q([{t:'aux',w:_cap(havP)},{t:'s',w:subject.k},{t:'aux',w:'been'},{t:'v',w:verb.ing}]);
        break;

      case 'past_simple':
        if(mood==='affirmative') aff([{t:'s',w:subject.k},{t:'v',w:verb.past}]);
        else if(mood==='negative') neg([{t:'s',w:subject.k},{t:'aux',w:"didn't"},{t:'v',w:verb.base}]);
        else q([{t:'aux',w:'Did'},{t:'s',w:subject.k},{t:'v',w:verb.base}]);
        break;

      case 'past_continuous':
        if(mood==='affirmative') aff([{t:'s',w:subject.k},{t:'aux',w:bePa},{t:'v',w:verb.ing}]);
        else if(mood==='negative') neg([{t:'s',w:subject.k},{t:'aux',w:bePa},{t:'not',w:'not'},{t:'v',w:verb.ing}]);
        else q([{t:'aux',w:_cap(bePa)},{t:'s',w:subject.k},{t:'v',w:verb.ing}]);
        break;

      case 'past_perfect':
        if(mood==='affirmative') aff([{t:'s',w:subject.k},{t:'aux',w:'had'},{t:'v',w:verb.part}]);
        else if(mood==='negative') neg([{t:'s',w:subject.k},{t:'aux',w:'had'},{t:'not',w:'not'},{t:'v',w:verb.part}]);
        else q([{t:'aux',w:'Had'},{t:'s',w:subject.k},{t:'v',w:verb.part}]);
        break;

      case 'past_perfect_continuous':
        if(mood==='affirmative') aff([{t:'s',w:subject.k},{t:'aux',w:'had been'},{t:'v',w:verb.ing}]);
        else if(mood==='negative') neg([{t:'s',w:subject.k},{t:'aux',w:'had'},{t:'not',w:'not'},{t:'aux',w:'been'},{t:'v',w:verb.ing}]);
        else q([{t:'aux',w:'Had'},{t:'s',w:subject.k},{t:'aux',w:'been'},{t:'v',w:verb.ing}]);
        break;

      case 'future_simple':
        if(mood==='affirmative') aff([{t:'s',w:subject.k},{t:'aux',w:'will'},{t:'v',w:verb.base}]);
        else if(mood==='negative') neg([{t:'s',w:subject.k},{t:'aux',w:"won't"},{t:'v',w:verb.base}]);
        else q([{t:'aux',w:'Will'},{t:'s',w:subject.k},{t:'v',w:verb.base}]);
        break;

      case 'future_continuous':
        if(mood==='affirmative') aff([{t:'s',w:subject.k},{t:'aux',w:'will be'},{t:'v',w:verb.ing}]);
        else if(mood==='negative') neg([{t:'s',w:subject.k},{t:'aux',w:"won't be"},{t:'v',w:verb.ing}]);
        else q([{t:'aux',w:'Will'},{t:'s',w:subject.k},{t:'aux',w:'be'},{t:'v',w:verb.ing}]);
        break;

      case 'future_perfect':
        if(mood==='affirmative') aff([{t:'s',w:subject.k},{t:'aux',w:'will have'},{t:'v',w:verb.part}]);
        else if(mood==='negative') neg([{t:'s',w:subject.k},{t:'aux',w:"won't have"},{t:'v',w:verb.part}]);
        else q([{t:'aux',w:'Will'},{t:'s',w:subject.k},{t:'aux',w:'have'},{t:'v',w:verb.part}]);
        break;

      case 'future_perfect_continuous':
        if(mood==='affirmative') aff([{t:'s',w:subject.k},{t:'aux',w:'will have been'},{t:'v',w:verb.ing}]);
        else if(mood==='negative') neg([{t:'s',w:subject.k},{t:'aux',w:"won't have been"},{t:'v',w:verb.ing}]);
        else q([{t:'aux',w:'Will'},{t:'s',w:subject.k},{t:'aux',w:'have been'},{t:'v',w:verb.ing}]);
        break;

      default: return null;
    }

    if(complement && complement.trim()){
      parts.push({ t:'c', w: complement.trim() });
    }

    // Capitalizar primer slot
    if(parts.length) parts[0] = { ...parts[0], w: _cap(parts[0].w) };

    const text = parts.map(p => p.w).join(' ') + (mood === 'question' ? '?' : '.');

    return { text, parts, tense, subject, verb, mood, complement: complement || '' };
  }

  function randomSentence(tenseId, mood){
    const tId = tenseId || FORJA.tenseId;
    const m = mood || FORJA.mood;
    const s = SUBJECTS[Math.floor(Math.random()*SUBJECTS.length)];
    const v = VERBS[Math.floor(Math.random()*VERBS.length)];
    const c = COMPLEMENT_SUGGESTIONS[Math.floor(Math.random()*COMPLEMENT_SUGGESTIONS.length)];
    return buildSentence(tId, m, s.k, v.base, c);
  }

  // ── Stats ─────────────────────────────
  function _stats(){
    const p = _getProgress();
    let viewed = 0, mastered = 0;
    T.tenses.forEach(t => {
      if(p[t.id]){
        if(p[t.id].viewed) viewed++;
        if(p[t.id].mastered) mastered++;
      }
    });
    return { viewed, mastered, total: T.tenses.length };
  }

  // ── Grid 4×3 ──────────────────────────
  function _cellHTML(tense, prog){
    const st = prog[tense.id] || {};
    const stateClass = st.mastered ? 'mastered' : st.viewed ? 'viewed' : 'untouched';
    const stateIcon = st.mastered ? '🌟' : st.viewed ? '👁️' : '○';
    const levelClass = 'tl-' + tense.level;
    return `
      <div class="tense-cell ${stateClass} ${levelClass}" data-id="${tense.id}">
        <div class="tc-icon">${tense.icon}</div>
        <div class="tc-name">${_esc(tense.name)}</div>
        <div class="tc-es">${_esc(tense.nameEs)}</div>
        <div class="tc-state">${stateIcon}</div>
      </div>`;
  }

  function _renderGrid(){
    const host = _by('tenseGrid');
    if(!host) return;
    const prog = _getProgress();

    let html = '<div class="tg-row tg-head"><div class="tg-corner"></div>';
    T.cols.forEach(c => {
      html += `<div class="tg-col-h"><span class="tch-i">${c.icon}</span><span class="tch-l">${_esc(c.label)}</span></div>`;
    });
    html += '</div>';

    T.rows.forEach(row => {
      html += `<div class="tg-row"><div class="tg-row-h"><span class="trh-i">${row.icon}</span><span class="trh-l">${_esc(row.label)}</span></div>`;
      T.cols.forEach(col => {
        const t = T.tenses.find(x => x.row === row.id && x.col === col.id);
        if(t) html += _cellHTML(t, prog);
        else html += '<div class="tense-cell empty">—</div>';
      });
      html += '</div>';
    });

    host.innerHTML = html;

    host.querySelectorAll('.tense-cell[data-id]').forEach(el => {
      el.addEventListener('click', () => openLesson(el.dataset.id));
    });

    _renderStats();
  }

  function _renderStats(){
    const s = _stats();
    const host = _by('tenseStats');
    if(!host) return;
    const pct = Math.round((s.viewed / s.total) * 100);
    host.innerHTML = `
      <div class="ts-row">
        <div class="ts-cell"><div class="ts-v">${s.viewed}/${s.total}</div><div class="ts-l">Vistos</div></div>
        <div class="ts-cell"><div class="ts-v">${s.mastered}</div><div class="ts-l">Dominados</div></div>
        <div class="ts-cell ts-bar-wrap">
          <div class="ts-bar"><div class="ts-bar-f" style="width:${pct}%"></div></div>
          <div class="ts-l">${pct}% del curso</div>
        </div>
      </div>`;
  }

  // ── F3 · Toggle Vista + Mapa SVG ─────────────────
  function _renderViewToggle(){
    const host = _by('tenseViewToggle');
    if(!host) return;
    host.innerHTML = `
      <button class="vw-btn ${CURRENT_VIEW==='grid'?'on':''}" data-vw="grid">📊 Grid</button>
      <button class="vw-btn ${CURRENT_VIEW==='map'?'on':''}" data-vw="map">🗺️ Mapa</button>
    `;
    host.querySelectorAll('.vw-btn').forEach(b => {
      b.addEventListener('click', () => switchView(b.dataset.vw));
    });
  }

  function switchView(view){
    CURRENT_VIEW = view;
    try { localStorage.setItem(VIEW_KEY, view); } catch(e){}
    const grid = _by('tenseGrid');
    const map = _by('tenseMap');
    if(view === 'grid'){
      if(grid) grid.style.display = '';
      if(map) map.style.display = 'none';
    } else {
      if(grid) grid.style.display = 'none';
      if(map) map.style.display = '';
      _renderMap();
    }
    _renderViewToggle();
  }

  // Layout: 3 columnas (past/present/future) × 4 filas (Simple/Cont/Perf/PerfCont)
  function _mapLayout(){
    const W = 760, H = 520;
    const colX = { past: 130, present: 380, future: 630 };
    const rowY = { simple: 90, continuous: 220, perfect: 350, perfectContinuous: 470 };
    const pos = {};
    T.tenses.forEach(t => {
      pos[t.id] = { x: colX[t.row], y: rowY[t.col] };
    });
    return { W, H, pos, colX, rowY };
  }

  function _renderMap(){
    const host = _by('tenseMap');
    if(!host) return;
    const prog = _getProgress();
    const { W, H, pos, colX, rowY } = _mapLayout();

    // Build edges SVG
    const edgePaths = TENSE_EDGES.map((e, idx) => {
      const a = pos[e.from], b = pos[e.to];
      if(!a || !b) return '';
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      // Curve perpendicular offset: trap edges curve more
      const dx = b.x - a.x, dy = b.y - a.y;
      const len = Math.sqrt(dx*dx + dy*dy) || 1;
      const off = e.kind === 'trap' ? 35 : e.kind === 'seq' ? 18 : 0;
      const px = mx + (-dy / len) * off;
      const py = my + (dx / len) * off;
      const path = `M ${a.x} ${a.y} Q ${px} ${py} ${b.x} ${b.y}`;
      return `<path class="tm-edge tm-${e.kind}" data-edge="${idx}" d="${path}" />`;
    }).join('');

    // Column headers
    const colHeaders = T.rows.map(r => `
      <text class="tm-col-h" x="${colX[r.id]}" y="32" text-anchor="middle">${r.icon}  ${_esc(r.label)}</text>
    `).join('');

    // Row labels (left)
    const rowLabels = T.cols.map(c => `
      <text class="tm-row-l" x="14" y="${rowY[c.id] + 4}" text-anchor="start">${_esc(c.label)}</text>
    `).join('');

    // Build nodes
    const nodes = T.tenses.map(t => {
      const p = pos[t.id];
      const st = prog[t.id] || {};
      const stateCls = st.mastered ? 'mastered' : st.viewed ? 'viewed' : 'untouched';
      return `
        <g class="tm-node ${stateCls} tn-${t.level}" data-id="${t.id}" transform="translate(${p.x},${p.y})">
          <circle class="tm-bg" r="42"/>
          <text class="tm-icon" y="-6" text-anchor="middle">${t.icon}</text>
          <text class="tm-name" y="14" text-anchor="middle">${_esc(t.name.replace(/^(Past|Present|Future) /, ''))}</text>
          ${st.mastered ? '<text class="tm-star" x="32" y="-26" text-anchor="middle">🌟</text>' : ''}
        </g>`;
    }).join('');

    host.innerHTML = `
      <div class="tm-wrap">
        <div class="tm-svg-wrap">
          <svg class="tense-map" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
            <defs>
              <marker id="arrSeq" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 Z" fill="#22c55e"/>
              </marker>
            </defs>
            ${colHeaders}
            ${rowLabels}
            <g class="tm-edges">${edgePaths}</g>
            <g class="tm-nodes">${nodes}</g>
          </svg>
        </div>
        <aside class="tm-side">
          <div class="tm-side-h">🗺️ Mapa de Tiempos</div>
          <div class="tm-side-tip" id="tmTip">
            <p>Hover sobre un nodo para resaltar sus relaciones. Hover sobre una arista para ver la regla. <strong>Click</strong> sobre un nodo abre la lección.</p>
          </div>
          <div class="tm-legend">
            <div class="tm-leg-h">Tipos de conexión</div>
            <div class="tm-leg-i"><span class="tm-sw tm-sw-trap"></span>Trampa hispana</div>
            <div class="tm-leg-i"><span class="tm-sw tm-sw-seq"></span>Secuencia temporal</div>
            <div class="tm-leg-i"><span class="tm-sw tm-sw-evo"></span>Evolución por aspecto</div>
            <div class="tm-leg-h" style="margin-top:14px">Nivel del tiempo</div>
            <div class="tm-leg-i"><span class="tm-sw tm-sw-basic"></span>Básico</div>
            <div class="tm-leg-i"><span class="tm-sw tm-sw-inter"></span>Intermedio</div>
            <div class="tm-leg-i"><span class="tm-sw tm-sw-adv"></span>Avanzado</div>
            <div class="tm-leg-h" style="margin-top:14px">Tu progreso</div>
            <div class="tm-leg-i"><span class="tm-state-dot"></span>Sin ver</div>
            <div class="tm-leg-i"><span class="tm-state-dot tm-st-viewed"></span>Visto</div>
            <div class="tm-leg-i">🌟 Dominado</div>
          </div>
        </aside>
      </div>`;

    _wireMapEvents(host);
  }

  function _wireMapEvents(host){
    // Node hover: highlight neighbors
    host.querySelectorAll('.tm-node').forEach(n => {
      const id = n.dataset.id;
      n.addEventListener('mouseenter', () => _highlightNeighbors(host, id));
      n.addEventListener('mouseleave', () => _clearHighlight(host));
      n.addEventListener('click', () => openLesson(id));
    });
    // Edge hover: show label
    host.querySelectorAll('.tm-edge').forEach(p => {
      p.addEventListener('mouseenter', () => {
        const e = TENSE_EDGES[parseInt(p.dataset.edge, 10)];
        if(!e || !e.label) return;
        const tip = _by('tmTip');
        if(tip){
          const fromT = _findTense(e.from);
          const toT = _findTense(e.to);
          tip.innerHTML = `
            <div class="tm-edge-info tm-ei-${e.kind}">
              <div class="tm-ei-pair">${fromT?_esc(fromT.name):e.from} ⇄ ${toT?_esc(toT.name):e.to}</div>
              <p>${_esc(e.label)}</p>
            </div>`;
        }
      });
      p.addEventListener('mouseleave', () => _resetTip());
    });
  }

  function _highlightNeighbors(host, id){
    const neighbors = new Set([id]);
    const activeEdges = [];
    TENSE_EDGES.forEach((e, idx) => {
      if(e.from === id || e.to === id){
        neighbors.add(e.from); neighbors.add(e.to);
        activeEdges.push(idx);
      }
    });
    host.querySelectorAll('.tm-node').forEach(n => {
      n.classList.toggle('dim', !neighbors.has(n.dataset.id));
      n.classList.toggle('active', n.dataset.id === id);
    });
    host.querySelectorAll('.tm-edge').forEach(p => {
      p.classList.toggle('dim', !activeEdges.includes(parseInt(p.dataset.edge, 10)));
    });
    // Update sidebar with tense detail
    const t = _findTense(id);
    if(t){
      const tip = _by('tmTip');
      if(tip){
        const conns = activeEdges.map(i => TENSE_EDGES[i]);
        const trapCount = conns.filter(e => e.kind === 'trap').length;
        const seqCount = conns.filter(e => e.kind === 'seq').length;
        tip.innerHTML = `
          <div class="tm-node-info">
            <div class="tm-ni-h"><span class="tm-ni-icon">${t.icon}</span><div><strong>${_esc(t.name)}</strong><div style="font-size:11px;color:var(--t3)">${_esc(t.nameEs)}</div></div></div>
            <p style="font-size:12px;color:var(--t2);margin:8px 0 6px">${_esc(t.use)}</p>
            <div class="tm-ni-meta">
              <span class="tm-ni-pill tm-ni-${t.level}">${t.level==='basic'?'Básico':t.level==='intermediate'?'Intermedio':'Avanzado'}</span>
              ${trapCount?`<span class="tm-ni-pill tm-ni-trap">${trapCount} trampa${trapCount>1?'s':''}</span>`:''}
              ${seqCount?`<span class="tm-ni-pill tm-ni-seq">${seqCount} secuencia${seqCount>1?'s':''}</span>`:''}
            </div>
            <div style="font-size:11px;color:var(--t3);margin-top:8px;font-style:italic">Click para abrir la lección completa</div>
          </div>`;
      }
    }
  }

  function _clearHighlight(host){
    host.querySelectorAll('.tm-node').forEach(n => { n.classList.remove('dim','active'); });
    host.querySelectorAll('.tm-edge').forEach(p => { p.classList.remove('dim'); });
    _resetTip();
  }

  function _resetTip(){
    const tip = _by('tmTip');
    if(tip){
      tip.innerHTML = '<p>Hover sobre un nodo para resaltar sus relaciones. Hover sobre una arista para ver la regla. <strong>Click</strong> sobre un nodo abre la lección.</p>';
    }
  }

  // ── F2 · UI Forja de Oraciones ──────────────────
  function _forjaShellHTML(){
    return `
      <div class="forja-card">
        <div class="forja-head" id="forjaToggle">
          <div class="fh-l">
            <span class="fh-icon">🧱</span>
            <div>
              <div class="fh-title">Forja de Oraciones</div>
              <div class="fh-sub">Construye una oración correcta en cualquier tiempo · F2</div>
            </div>
          </div>
          <button class="fh-toggle" aria-label="Mostrar/ocultar">▾</button>
        </div>
        <div class="forja-body" id="forjaBody">
          <div class="forja-grid">
            <label class="ff">
              <span class="ff-l">1️⃣ Tiempo</span>
              <select id="fSelTense" class="ff-i"></select>
            </label>
            <label class="ff">
              <span class="ff-l">2️⃣ Modo</span>
              <div class="ff-radios" id="fRadioMood">
                <label><input type="radio" name="fMood" value="affirmative" checked> ✅ Afirmativo</label>
                <label><input type="radio" name="fMood" value="negative"> ❌ Negativo</label>
                <label><input type="radio" name="fMood" value="question"> ❓ Pregunta</label>
              </div>
            </label>
            <label class="ff">
              <span class="ff-l">3️⃣ Sujeto</span>
              <select id="fSelSubject" class="ff-i"></select>
            </label>
            <label class="ff">
              <span class="ff-l">4️⃣ Verbo (base)</span>
              <select id="fSelVerb" class="ff-i"></select>
            </label>
            <label class="ff ff-full">
              <span class="ff-l">5️⃣ Complemento <span class="ff-opt">(opcional)</span></span>
              <input type="text" id="fComplement" class="ff-i" placeholder="ej: with Python · for 3 hours · the report">
            </label>
          </div>
          <div class="forja-actions">
            <button class="btn bp" id="fGen">⚡ Generar oración</button>
            <button class="btn bo" id="fRandom">🎲 5 variaciones aleatorias</button>
            <button class="btn bo" id="fClear">Limpiar</button>
          </div>
          <div id="forjaResult"></div>
          <div id="forjaVariations"></div>
        </div>
      </div>`;
  }

  function _renderForja(){
    const host = _by('forja');
    if(!host) return;
    host.innerHTML = _forjaShellHTML();

    // Fill selects
    const selT = _by('fSelTense');
    selT.innerHTML = T.tenses.map(t =>
      `<option value="${t.id}"${t.id===FORJA.tenseId?' selected':''}>${_esc(t.name)} · ${_esc(t.nameEs)}</option>`
    ).join('');

    const selS = _by('fSelSubject');
    selS.innerHTML = SUBJECTS.map(s =>
      `<option value="${s.k}"${s.k===FORJA.subjectKey?' selected':''}>${s.k} (${_esc(s.es)})</option>`
    ).join('');

    const selV = _by('fSelVerb');
    selV.innerHTML = VERBS.map(v => {
      const irr = v.irr ? ' ✦' : '';
      return `<option value="${v.base}"${v.base===FORJA.verbBase?' selected':''}>${v.base}${irr} — ${_esc(v.es)}</option>`;
    }).join('');

    _by('fComplement').value = FORJA.complement || '';

    // Wire toggle
    _by('forjaToggle').addEventListener('click', () => {
      _by('forjaBody').classList.toggle('collapsed');
      _by('forjaToggle').classList.toggle('collapsed');
    });

    // Wire change tracking
    selT.addEventListener('change', e => FORJA.tenseId = e.target.value);
    selS.addEventListener('change', e => FORJA.subjectKey = e.target.value);
    selV.addEventListener('change', e => FORJA.verbBase = e.target.value);
    _by('fComplement').addEventListener('input', e => FORJA.complement = e.target.value);
    document.querySelectorAll('input[name="fMood"]').forEach(r => {
      r.addEventListener('change', () => {
        const checked = document.querySelector('input[name="fMood"]:checked');
        if(checked) FORJA.mood = checked.value;
      });
    });

    // Wire buttons
    _by('fGen').addEventListener('click', _forjaGen);
    _by('fRandom').addEventListener('click', _forjaRandom);
    _by('fClear').addEventListener('click', _forjaClear);
  }

  function _resultCardHTML(res, opts){
    if(!res) return '<div class="forja-err">No se pudo construir la oración. Revisa la selección.</div>';
    const showSave = opts && opts.showSave !== false;
    const slotHTML = res.parts.map(p => `<span class="slot slot-${p.t}">${_esc(p.w)}</span>`).join(' ');
    const breakdown = res.parts.map(p => {
      const label = p.t==='s' ? 'sujeto' : p.t==='aux' ? 'auxiliar' : p.t==='v' ? 'verbo' : p.t==='not' ? 'negación' : 'complemento';
      return `<div class="brk-row"><span class="brk-tag brk-${p.t}">${label}</span><code>${_esc(p.w)}</code></div>`;
    }).join('');
    return `
      <div class="forja-result">
        <div class="fr-head">
          <div class="fr-meta">
            <span class="fr-tense">${_esc(res.tense.name)}</span>
            <span class="fr-dot">·</span>
            <span class="fr-mood">${res.mood==='affirmative'?'✅ Afirmativo':res.mood==='negative'?'❌ Negativo':'❓ Pregunta'}</span>
          </div>
          <div class="fr-actions">
            <button class="tl-tts" data-tts="${_escAttr(res.text)}" title="Escuchar">🔊</button>
            ${showSave?`<button class="tl-tts" data-save="${_escAttr(res.text)}" title="Guardar en Notes">💾</button>`:''}
          </div>
        </div>
        <div class="fr-sentence">${slotHTML}<span class="slot-punct">${res.mood==='question'?'?':'.'}</span></div>
        <div class="fr-breakdown">${breakdown}</div>
      </div>`;
  }

  function _forjaGen(){
    const res = buildSentence(FORJA.tenseId, FORJA.mood, FORJA.subjectKey, FORJA.verbBase, FORJA.complement);
    const host = _by('forjaResult');
    if(!host) return;
    host.innerHTML = _resultCardHTML(res);
    _by('forjaVariations').innerHTML = '';
    _wireResultActions(host);
  }

  function _forjaRandom(){
    const host = _by('forjaVariations');
    if(!host) return;
    const out = [];
    const seen = new Set();
    for(let i=0; i<25 && out.length<5; i++){
      const r = randomSentence(FORJA.tenseId, FORJA.mood);
      if(r && !seen.has(r.text)){ seen.add(r.text); out.push(r); }
    }
    host.innerHTML = '<div class="fr-varhead">🎲 5 variaciones aleatorias · mismo tiempo + modo</div>' +
      out.map(r => _resultCardHTML(r, { showSave: true })).join('');
    _by('forjaResult').innerHTML = '';
    _wireResultActions(host);
  }

  function _forjaClear(){
    _by('forjaResult').innerHTML = '';
    _by('forjaVariations').innerHTML = '';
    _by('fComplement').value = '';
    FORJA.complement = '';
  }

  function _wireResultActions(host){
    host.querySelectorAll('[data-tts]').forEach(b => {
      b.addEventListener('click', e => {
        e.stopPropagation();
        _speak(b.getAttribute('data-tts'));
      });
    });
    host.querySelectorAll('[data-save]').forEach(b => {
      b.addEventListener('click', e => {
        e.stopPropagation();
        _saveToNotes(b.getAttribute('data-save'));
        b.textContent = '✓';
        b.disabled = true;
        setTimeout(() => { b.textContent = '💾'; b.disabled = false; }, 1400);
      });
    });
  }

  function _saveToNotes(text){
    try {
      const arr = JSON.parse(localStorage.getItem('eng_notes') || '[]');
      arr.push({
        text,
        stamp: 'phrase',
        date: new Date().toLocaleDateString('es', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }),
        source: 'forja'
      });
      localStorage.setItem('eng_notes', JSON.stringify(arr));
      // Refrescar la lista de notas si la función existe
      if(window.ENG && typeof ENG.handleFcClick === 'function'){
        // no hay handle de refresh notes expuesto · esto recarga al cambiar de tab
      }
    } catch(e){ console.error('saveToNotes failed', e); }
  }

  // Abrir Forja con tense pre-seleccionado (llamado desde el modal de lección)
  function openForja(tenseId){
    closeModal();
    // Cambiar a la tab Tiempos si no está activa
    const tab = document.querySelector('[data-p="tense"]');
    const pnl = _by('p-tense');
    if(tab && pnl && !pnl.classList.contains('on')){
      document.querySelectorAll('.tab').forEach(x => x.classList.remove('on'));
      document.querySelectorAll('.pnl').forEach(x => x.classList.remove('on'));
      tab.classList.add('on'); pnl.classList.add('on');
    }
    // Asegurar Forja expandida
    const body = _by('forjaBody');
    const toggle = _by('forjaToggle');
    if(body && body.classList.contains('collapsed')){
      body.classList.remove('collapsed');
      if(toggle) toggle.classList.remove('collapsed');
    }
    // Pre-seleccionar tense
    if(tenseId){
      FORJA.tenseId = tenseId;
      const sel = _by('fSelTense');
      if(sel) sel.value = tenseId;
    }
    // Scroll suave
    const card = document.querySelector('.forja-card');
    if(card) card.scrollIntoView({ behavior:'smooth', block:'start' });
  }

  // ── Modal de lección ──────────────────
  function openLesson(id){
    const t = _findTense(id);
    if(!t) return;

    const prog = _getProgress();
    prog[id] = Object.assign({}, prog[id], { viewed: true, ts: Date.now() });
    _setProgress(prog);

    const lvlLabel = t.level === 'basic' ? 'Básico' : t.level === 'intermediate' ? 'Intermedio' : 'Avanzado';

    let html = `
      <div class="tl-modal-bg" id="tlBg"></div>
      <div class="tl-modal" role="dialog">
        <div class="tl-head">
          <div class="tl-h-l">
            <span class="tl-icon">${t.icon}</span>
            <div>
              <div class="tl-title">${_esc(t.name)}</div>
              <div class="tl-sub">${_esc(t.nameEs)} · <span class="tl-lvl tl-${t.level}">${lvlLabel}</span></div>
            </div>
          </div>
          <button class="tl-close" id="tlClose" aria-label="Cerrar">✕</button>
        </div>
        <div class="tl-body">

          <div class="tl-sec">
            <div class="tl-sec-h">🎯 Cuándo usarlo</div>
            <div class="tl-sec-b">${_esc(t.use)}</div>
          </div>

          <div class="tl-sec">
            <div class="tl-sec-h">📐 Fórmulas</div>
            <div class="tl-formulas">
              <div class="tl-fr"><span class="tl-fr-l">Afirmativo</span><code>${_esc(t.formula)}</code></div>
              <div class="tl-fr"><span class="tl-fr-l">Negativo</span><code>${_esc(t.formulaNeg)}</code></div>
              <div class="tl-fr"><span class="tl-fr-l">Pregunta</span><code>${_esc(t.formulaQ)}</code></div>
            </div>
          </div>

          <div class="tl-sec">
            <div class="tl-sec-h">🔑 Palabras señal</div>
            <div class="tl-signals">
              ${t.signalWords.map(w => `<span class="tl-sig">${_esc(w)}</span>`).join('')}
            </div>
          </div>

          <div class="tl-sec">
            <div class="tl-sec-h">✅ Ejemplos</div>
            ${t.examples.map(e => `
              <div class="tl-ex">
                <div class="tl-ex-en">${_esc(e.en)} <button class="tl-tts" data-tts="${_escAttr(e.en)}">🔊</button></div>
                <div class="tl-ex-es">${_esc(e.es)}</div>
              </div>
            `).join('')}
          </div>

          <div class="tl-sec tl-trap">
            <div class="tl-sec-h">⚠️ Trampa hispana</div>
            <div class="tl-sec-b">${_esc(t.spanishTrap)}</div>
          </div>

          <div class="tl-sec">
            <div class="tl-sec-h">❌ Errores comunes</div>
            ${t.commonMistakes.map(m => `
              <div class="tl-mis">
                <div class="tl-mis-w">✗ ${_esc(m.wrong)}</div>
                <div class="tl-mis-r">✓ ${_esc(m.right)}</div>
                <div class="tl-mis-y">→ ${_esc(m.why)}</div>
              </div>
            `).join('')}
          </div>

          ${t.irregularVerbs ? `
          <div class="tl-sec">
            <div class="tl-sec-h">📚 Verbos irregulares clave (pasado)</div>
            <div class="tl-irr">${t.irregularVerbs.map(v => `<span class="tl-irr-i">${_esc(v)}</span>`).join('')}</div>
          </div>` : ''}

          ${t.irregularParticiples ? `
          <div class="tl-sec">
            <div class="tl-sec-h">📚 Participios irregulares clave</div>
            <div class="tl-irr">${t.irregularParticiples.map(v => `<span class="tl-irr-i">${_esc(v)}</span>`).join('')}</div>
          </div>` : ''}

        </div>
        <div class="tl-foot">
          <button class="btn bp" id="tlForja">🧱 Forjar oración con este tiempo</button>
          ${prog[id].mastered
            ? `<button class="btn bo" id="tlUnmaster">↺ Desmarcar como dominado</button>`
            : `<button class="btn bo" id="tlMaster">🌟 Marcar como dominado</button>`}
          <button class="btn bo" id="tlBack">Volver al grid</button>
        </div>
      </div>`;

    const host = _by('tenseModal');
    if(!host) return;
    host.innerHTML = html;
    host.classList.add('on');

    _by('tlClose').addEventListener('click', closeModal);
    _by('tlBg').addEventListener('click', closeModal);
    _by('tlBack').addEventListener('click', closeModal);
    _by('tlForja').addEventListener('click', () => openForja(id));

    const masterBtn = _by('tlMaster');
    if(masterBtn) masterBtn.addEventListener('click', () => { mark(id, 'mastered', true); openLesson(id); });
    const unmasterBtn = _by('tlUnmaster');
    if(unmasterBtn) unmasterBtn.addEventListener('click', () => { mark(id, 'mastered', false); openLesson(id); });

    host.querySelectorAll('[data-tts]').forEach(b => {
      b.addEventListener('click', e => {
        e.stopPropagation();
        _speak(b.getAttribute('data-tts'));
      });
    });

    _renderGrid();
  }

  function closeModal(){
    const host = _by('tenseModal');
    if(!host) return;
    host.classList.remove('on');
    host.innerHTML = '';
  }

  function mark(id, key, val){
    const prog = _getProgress();
    prog[id] = Object.assign({}, prog[id], { [key]: val, ts: Date.now() });
    _setProgress(prog);
    _renderGrid();
  }

  function getProgress(){ return _getProgress(); }

  // ── Init ──────────────────────────────
  async function init(){
    try {
      const r = await fetch('data/tenses.json');
      T = await r.json();
    } catch(e){
      console.error('ENG_TENSES: failed to load tenses.json', e);
      return;
    }
    // Restore view preference
    try { CURRENT_VIEW = localStorage.getItem(VIEW_KEY) || 'grid'; } catch(e){}

    _renderForja();
    _renderViewToggle();
    _renderGrid();
    if(CURRENT_VIEW === 'map') switchView('map');

    window.addEventListener('cloud:sync_complete', () => {
      _renderGrid();
      if(CURRENT_VIEW === 'map') _renderMap();
    });

    document.addEventListener('keydown', e => {
      if(e.key === 'Escape') closeModal();
    });
  }

  return {
    init,
    openLesson,
    closeModal,
    mark,
    getProgress,
    buildSentence,
    randomSentence,
    openForja,
    switchView,
    SUBJECTS,
    VERBS,
    TENSE_EDGES
  };
})();

window.ENG_TENSES = ENG_TENSES;
