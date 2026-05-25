// ══════════════════════════════════════════════════════════════
// ENG_PRACTICE · F6 · Daily Practice Session (técnica E · local-first)
// Cierre del plan Second Brain: integra F1-F5 en una rutina diaria.
// Cada día genera 4 pasos personalizados desde:
//   - F1 (eng_tense_progress) → 1 tense viewed pero no mastered
//   - F4 (eng_srs_deck)       → N cards due hoy
//   - F5 (eng_error_log)      → top error del wiki
//   - F2/F4 (eng_notes)       → phrase del día (random)
// Storage:
//   - eng_daily_session  → { date, steps:{srs,tense,error,phrase}, completed }
//   - eng_practice_streak → { count, lastDate, max }
// Exposes: window.ENG_PRACTICE { session, markStep, streak, regenerate, openTab }
// ══════════════════════════════════════════════════════════════
const ENG_PRACTICE = (function(){
  'use strict';

  const SESSION_KEY = 'eng_daily_session';
  const STREAK_KEY  = 'eng_practice_streak';
  const SRS_TARGET  = 5;      // cards SRS a revisar por día
  const PHRASE_KEEP_DAYS = 60;  // edad max para considerar una phrase "fresca"

  // ── Helpers ────────────────────────────
  function _by(id){ return document.getElementById(id); }
  function _esc(s){
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function _escAttr(s){
    return String(s||'').replace(/'/g,"\\'").replace(/"/g,'&quot;');
  }
  function _readJSON(key, fallback){
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch(e){ return fallback; }
  }
  function _writeJSON(key, val){
    try { localStorage.setItem(key, JSON.stringify(val)); } catch(e){}
  }
  function _today(){
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }
  function _daysBetween(d1, d2){
    if(!d1 || !d2) return 999;
    const a = new Date(d1+'T00:00:00');
    const b = new Date(d2+'T00:00:00');
    return Math.round((b - a) / 86400000);
  }

  // ── Generadores por paso ──────────────────────
  function _genSRS(){
    const deck = _readJSON('eng_srs_deck', []);
    if(!Array.isArray(deck) || !deck.length){
      return { count: 0, total: 0, empty: true };
    }
    const now = Date.now();
    const due = deck.filter(c => !c.due || c.due <= now);
    return {
      count: Math.min(due.length, SRS_TARGET),
      total: deck.length,
      due: due.length,
      empty: false,
      sample: deck.slice(0, 3).map(c => c.front || c.f || '?')
    };
  }

  function _genTense(){
    if(!window.ENG_TENSES) return { available: false };
    const T = (typeof ENG_TENSES.getProgress === 'function') ? ENG_TENSES.getProgress() : {};
    // Pull tenses data desde el JSON cargado por F1 (via la API que expone ENG_TENSES)
    // Sin acceso directo a T.tenses · usamos heurística de IDs conocidos por orden de nivel
    const candidates = [
      // basic primero
      { id:'present_simple',     level:'basic', name:'Present Simple' },
      { id:'present_continuous', level:'basic', name:'Present Continuous' },
      { id:'past_simple',        level:'basic', name:'Past Simple' },
      { id:'future_simple',      level:'basic', name:'Future Simple' },
      // intermediate
      { id:'present_perfect',           level:'intermediate', name:'Present Perfect' },
      { id:'past_continuous',           level:'intermediate', name:'Past Continuous' },
      { id:'past_perfect',              level:'intermediate', name:'Past Perfect' },
      { id:'present_perfect_continuous',level:'intermediate', name:'Present Perfect Continuous' },
      { id:'future_continuous',         level:'intermediate', name:'Future Continuous' },
      // advanced
      { id:'past_perfect_continuous',   level:'advanced', name:'Past Perfect Continuous' },
      { id:'future_perfect',            level:'advanced', name:'Future Perfect' },
      { id:'future_perfect_continuous', level:'advanced', name:'Future Perfect Continuous' }
    ];

    // Prioridad 1: viewed pero no mastered (de menor a mayor nivel)
    for(const c of candidates){
      const p = T[c.id];
      if(p && p.viewed && !p.mastered){
        return { id: c.id, name: c.name, level: c.level, kind: 'practice' };
      }
    }
    // Prioridad 2: untouched de menor nivel
    for(const c of candidates){
      const p = T[c.id];
      if(!p || (!p.viewed && !p.mastered)){
        return { id: c.id, name: c.name, level: c.level, kind: 'discover' };
      }
    }
    // Si todos están mastered, sugerir el primero advanced para repaso
    const adv = candidates[candidates.length - 1];
    return { id: adv.id, name: adv.name, level: adv.level, kind: 'review' };
  }

  function _genError(){
    if(!window.ENG_ERRORS || typeof ENG_ERRORS.wiki !== 'function'){
      return { available: false };
    }
    const wiki = ENG_ERRORS.wiki();
    if(!wiki.length) return { available: false };
    const top = wiki[0];
    return {
      available: true,
      patternId: top.id,
      name: top.name,
      count: top.count,
      severity: top.severity,
      lastSample: top.lastSample,
      why: top.why,
      tenseId: top.tenseId
    };
  }

  function _genPhrase(){
    const notes = _readJSON('eng_notes', []);
    const phrases = notes.filter(n => n && (n.stamp === 'phrase' || n.stamp === 'idea') && n.text);
    if(!phrases.length) return { available: false };
    // Pick uno determinístico por fecha (estable durante el día)
    const dateNum = parseInt(_today().replace(/-/g,''), 10);
    const idx = dateNum % phrases.length;
    const p = phrases[idx];
    return {
      available: true,
      text: p.text,
      stamp: p.stamp,
      source: p.source || 'manual'
    };
  }

  // ── Generación + persistencia ──────────────────────
  function _generate(){
    return {
      date: _today(),
      generated: Date.now(),
      steps: {
        srs:    _genSRS(),
        tense:  _genTense(),
        error:  _genError(),
        phrase: _genPhrase()
      },
      done: { srs:false, tense:false, error:false, phrase:false }
    };
  }

  function session(){
    const today = _today();
    let s = _readJSON(SESSION_KEY, null);
    if(!s || s.date !== today){
      s = _generate();
      _writeJSON(SESSION_KEY, s);
    }
    return s;
  }

  function regenerate(){
    const fresh = _generate();
    _writeJSON(SESSION_KEY, fresh);
    return fresh;
  }

  function markStep(stepId, done){
    const s = session();
    if(!(stepId in s.done)) return null;
    s.done[stepId] = !!done;
    _writeJSON(SESSION_KEY, s);
    // Si todos los pasos están hechos · actualizar streak
    const allDone = Object.values(s.done).every(v => v === true);
    if(allDone){
      _bumpStreak();
    }
    return s;
  }

  function _bumpStreak(){
    const today = _today();
    const st = _readJSON(STREAK_KEY, { count:0, lastDate:null, max:0 });
    if(st.lastDate === today) return st; // ya contado hoy
    const days = _daysBetween(st.lastDate, today);
    if(days === 1 || !st.lastDate){
      st.count = (st.count || 0) + 1;
    } else {
      st.count = 1; // reset si se perdió un día
    }
    st.lastDate = today;
    st.max = Math.max(st.max || 0, st.count);
    _writeJSON(STREAK_KEY, st);
    return st;
  }

  function streak(){
    const st = _readJSON(STREAK_KEY, { count:0, lastDate:null, max:0 });
    // Si lastDate < ayer · streak está roto pero NO se modifica hasta que completen otra sesión
    return st;
  }

  // ── UI ────────────────────────────────
  function _renderBanner(){
    const host = _by('dailySession');
    if(!host) return;

    const s = session();
    const st = streak();
    const doneCount = Object.values(s.done).filter(Boolean).length;
    const total = Object.keys(s.done).length;
    const pct = Math.round((doneCount / total) * 100);
    const allDone = doneCount === total;

    host.innerHTML = `
      <div class="ds-banner ${allDone?'ds-done':''}">
        <div class="ds-head" id="dsToggle">
          <div class="ds-h-l">
            <span class="ds-icon">${allDone?'🎉':'🎯'}</span>
            <div>
              <div class="ds-title">${allDone?'¡Sesión completa de hoy!':'Tu sesión de hoy'}</div>
              <div class="ds-sub">${doneCount}/${total} pasos · ${pct}% · streak ${st.count} día${st.count===1?'':'s'}${st.max>st.count?` · récord ${st.max}`:''}</div>
            </div>
          </div>
          <div class="ds-h-r">
            <div class="ds-progress"><div class="ds-progress-fill" style="width:${pct}%"></div></div>
            <button class="ds-toggle" aria-label="Mostrar/ocultar">▾</button>
          </div>
        </div>
        <div class="ds-body" id="dsBody">
          ${_stepHTML('srs',    '🃏', s.steps.srs,    s.done.srs)}
          ${_stepHTML('tense',  '⏰', s.steps.tense,  s.done.tense)}
          ${_stepHTML('error',  '🔍', s.steps.error,  s.done.error)}
          ${_stepHTML('phrase', '💬', s.steps.phrase, s.done.phrase)}

          <div class="ds-foot">
            <button class="btn bo bs" id="dsRegen">↻ Regenerar sesión</button>
            ${allDone ? '<span class="ds-celebrate">¡Bien hecho! Vuelve mañana para mantener el streak.</span>' : ''}
          </div>
        </div>
      </div>
    `;

    _wireEvents();
  }

  function _stepHTML(id, icon, data, done){
    const label = {
      srs:    'Repasá flashcards',
      tense:  'Practica un tiempo verbal',
      error:  'Tu error #1',
      phrase: 'Phrase del día'
    }[id];

    let detail = '';
    let action = '';

    if(id === 'srs'){
      if(data.empty){
        detail = 'Tu SRS deck está vacío. Importa vocab desde la tab 📥 Importar para empezar.';
        action = `<button class="btn bo bs" data-go="import">📥 Ir a Importar</button>`;
      } else {
        detail = `<strong>${data.count}</strong> de ${data.due} cards "due" hoy · deck total: ${data.total}`;
        action = `<button class="btn bo bs" data-go="fc">→ Abrir Flashcards</button>`;
      }
    } else if(id === 'tense'){
      const kindLabel = data.kind === 'practice' ? 'A repasar (ya visto)' : data.kind === 'discover' ? 'Nuevo · descubrir' : 'Repaso · ya dominado';
      detail = `<strong>${_esc(data.name)}</strong> · ${data.level === 'basic' ? 'Básico' : data.level === 'intermediate' ? 'Intermedio' : 'Avanzado'} · ${kindLabel}`;
      action = `<button class="btn bo bs" data-go="tense" data-tense="${_escAttr(data.id)}">→ Abrir lección</button>`;
    } else if(id === 'error'){
      if(!data.available){
        detail = 'Sin errores registrados aún. Analiza algún texto que hayas escrito en la tab 🔍 Errores.';
        action = `<button class="btn bo bs" data-go="errors">🔍 Ir a Errores</button>`;
      } else {
        detail = `<strong>${_esc(data.name)}</strong> · cometido ×${data.count} ${data.lastSample ? `· último: <code>${_esc(data.lastSample)}</code>` : ''}<br><span class="ds-step-why">${_esc(data.why)}</span>`;
        action = data.tenseId
          ? `<button class="btn bo bs" data-go="tense" data-tense="${_escAttr(data.tenseId)}">→ Ver lección relacionada</button>`
          : `<button class="btn bo bs" data-go="errors">→ Ver wiki completo</button>`;
      }
    } else if(id === 'phrase'){
      if(!data.available){
        detail = 'Sin frases guardadas. Usa la Forja (F2) o importa contenido (F4) para alimentar este paso.';
        action = `<button class="btn bo bs" data-go="tense">→ Abrir Forja</button>`;
      } else {
        detail = `<span class="ds-phrase">"${_esc(data.text)}"</span><br><span class="ds-step-why">Léela en voz alta 3 veces · usá el TTS</span>`;
        action = `<button class="btn bo bs" data-tts="${_escAttr(data.text)}">🔊 Escuchar</button>`;
      }
    }

    return `
      <div class="ds-step ${done?'ds-step-done':''}">
        <div class="ds-step-l">
          <span class="ds-step-icon">${icon}</span>
          <div class="ds-step-info">
            <div class="ds-step-label">${label}</div>
            <div class="ds-step-detail">${detail}</div>
          </div>
        </div>
        <div class="ds-step-r">
          ${action}
          <button class="ds-step-check ${done?'on':''}" data-step="${id}" aria-label="Marcar hecho">${done?'✓':'○'}</button>
        </div>
      </div>`;
  }

  function _wireEvents(){
    const toggle = _by('dsToggle');
    const body = _by('dsBody');
    if(toggle && body){
      toggle.addEventListener('click', () => {
        body.classList.toggle('collapsed');
        toggle.classList.toggle('collapsed');
      });
    }

    document.querySelectorAll('.ds-step-check').forEach(b => {
      b.addEventListener('click', () => {
        const id = b.dataset.step;
        const s = session();
        const newDone = !s.done[id];
        markStep(id, newDone);
        _renderBanner();
      });
    });

    // Nav helpers
    document.querySelectorAll('[data-go]').forEach(b => {
      b.addEventListener('click', () => {
        const target = b.dataset.go;
        const tabName = { fc:'fc', tense:'tense', import:'import', errors:'errors' }[target] || target;
        const tab = document.querySelector(`[data-p="${tabName}"]`);
        const pnl = _by('p-' + tabName);
        if(tab && pnl){
          document.querySelectorAll('.tab').forEach(x => x.classList.remove('on'));
          document.querySelectorAll('.pnl').forEach(x => x.classList.remove('on'));
          tab.classList.add('on'); pnl.classList.add('on');
        }
        // Si es tense específico, abrir el modal de lección
        if(target === 'tense' && b.dataset.tense && window.ENG_TENSES){
          setTimeout(() => ENG_TENSES.openLesson(b.dataset.tense), 100);
        }
      });
    });

    document.querySelectorAll('[data-tts]').forEach(b => {
      b.addEventListener('click', () => {
        const t = b.getAttribute('data-tts');
        if(window.ENG && typeof ENG.speak === 'function'){
          ENG.speak(t, b);
        } else if(window.speechSynthesis){
          const u = new SpeechSynthesisUtterance(t);
          u.lang = 'en-US'; u.rate = 0.85;
          speechSynthesis.cancel();
          speechSynthesis.speak(u);
        }
      });
    });

    const regen = _by('dsRegen');
    if(regen) regen.addEventListener('click', () => {
      if(confirm('¿Regenerar la sesión de hoy? Se perderán los pasos marcados.')){
        regenerate();
        _renderBanner();
      }
    });
  }

  function openTab(){
    const banner = _by('dailySession');
    if(banner) banner.scrollIntoView({ behavior:'smooth', block:'start' });
  }

  // ── Init ──────────────────────────────
  function init(){
    _renderBanner();

    // Re-render al cambiar de tab (datos pueden haber cambiado)
    document.querySelectorAll('.tab').forEach(t => {
      t.addEventListener('click', () => setTimeout(_renderBanner, 100));
    });

    window.addEventListener('cloud:sync_complete', _renderBanner);
  }

  return { init, session, markStep, streak, regenerate, openTab };
})();

window.ENG_PRACTICE = ENG_PRACTICE;
document.addEventListener('DOMContentLoaded', () => {
  if(window.ENG_PRACTICE && typeof ENG_PRACTICE.init === 'function'){
    // Pequeño delay para que ENG_TENSES y ENG_ERRORS hayan inicializado primero
    setTimeout(() => ENG_PRACTICE.init(), 200);
  }
});
