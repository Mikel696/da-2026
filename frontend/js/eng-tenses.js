// ══════════════════════════════════════════════════════════════
// ENG_TENSES · F1 · Tiempos Verbales · 12 lecciones en grid 4×3
// Storage: localStorage 'eng_tense_progress' (synced via cloud-sync.js)
// Exposes: window.ENG_TENSES { init, openLesson, mark, getProgress }
// ══════════════════════════════════════════════════════════════
const ENG_TENSES = (function(){
  'use strict';

  let T = null;                    // data/tenses.json cargado
  const KEY = 'eng_tense_progress';

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

    // Header row (col labels)
    let html = '<div class="tg-row tg-head"><div class="tg-corner"></div>';
    T.cols.forEach(c => {
      html += `<div class="tg-col-h"><span class="tch-i">${c.icon}</span><span class="tch-l">${_esc(c.label)}</span></div>`;
    });
    html += '</div>';

    // Body rows
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

    // Wire clicks
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

  // ── Modal de lección ──────────────────
  function openLesson(id){
    const t = T.tenses.find(x => x.id === id);
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
          ${prog[id].mastered
            ? `<button class="btn bo" id="tlUnmaster">↺ Desmarcar como dominado</button>`
            : `<button class="btn bp" id="tlMaster">🌟 Marcar como dominado</button>`}
          <button class="btn bo" id="tlBack">Volver al grid</button>
        </div>
      </div>`;

    const host = _by('tenseModal');
    if(!host) return;
    host.innerHTML = html;
    host.classList.add('on');

    // Wire modal events
    _by('tlClose').addEventListener('click', closeModal);
    _by('tlBg').addEventListener('click', closeModal);
    _by('tlBack').addEventListener('click', closeModal);

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

  // ── Public · marcar progreso ──────────
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
    _renderGrid();

    // Re-render tras sync
    window.addEventListener('cloud:sync_complete', _renderGrid);

    // ESC cierra modal
    document.addEventListener('keydown', e => {
      if(e.key === 'Escape') closeModal();
    });
  }

  return { init, openLesson, closeModal, mark, getProgress };
})();

window.ENG_TENSES = ENG_TENSES;
