// ══════════════════════════════════════════════════════════════
// ENG_ERRORS · F5 · Detector de errores hispanos · Karpathy-style
// Analiza texto inglés escrito por el usuario, detecta patrones
// típicos de hispanohablantes y construye un wiki personal de
// "mis errores recurrentes" para coaching dirigido.
// Storage: localStorage 'eng_error_log' (synced via cloud-sync.js)
// Exposes: window.ENG_ERRORS { analyze, highlight, save, wiki,
//          PATTERNS, log, openTab }
// ══════════════════════════════════════════════════════════════
const ENG_ERRORS = (function(){
  'use strict';

  const LOG_KEY = 'eng_error_log';

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

  // ── Patrones de errores hispanos ──────────────────────
  // Cada patrón: { id, name, kind, regex, suggest(match), why, tenseId?, severity }
  // severity: 'high' (rompe gramática) · 'med' (interferencia clara) · 'low' (estilo/preposición)
  const PATTERNS = [
    {
      id: 'no_aux_negative',
      name: 'Negación sin auxiliar (no + verbo)',
      kind: 'aux',
      regex: /\b(I|you|he|she|it|we|they)\s+no\s+([a-z]+)/gi,
      suggest: m => {
        const subj = m[1];
        const verb = m[2];
        const is3s = /^(he|she|it)$/i.test(subj);
        return `${subj} ${is3s ? "doesn't" : "don't"} ${verb}`;
      },
      why: 'En inglés no existe "I no + verbo". Las oraciones negativas en presente simple usan don\'t/doesn\'t como auxiliar.',
      tenseId: 'present_simple',
      severity: 'high'
    },
    {
      id: 'third_sg_no_s',
      name: '3ra persona sin -s',
      kind: 'subject_verb',
      // He/She/It + base form de verbo común (sin -s, -ed, -ing)
      regex: /\b(He|She|It)\s+(work|live|play|read|write|like|love|hate|need|want|know|think|come|go|run|make|take|say|see|get|give|build|study|finish|use|create|design|analyze|deploy|fix|plan|present|review|learn|speak|find|lead|send|ship|test|help|try|call|talk|walk|wait|watch|listen)\b(?!s|ed|ing)/g,
      suggest: m => {
        const v = m[2];
        const third = /(s|x|z|ch|sh|o)$/.test(v) ? v + 'es' : /[^aeiou]y$/.test(v) ? v.slice(0,-1) + 'ies' : v + 's';
        return `${m[1]} ${third}`;
      },
      why: 'En presente simple, después de He/She/It el verbo lleva -s (work → works, study → studies, go → goes).',
      tenseId: 'present_simple',
      severity: 'high'
    },
    {
      id: 'double_negative',
      name: 'Doble negación',
      kind: 'negation',
      regex: /\b(don't|doesn't|didn't|won't|hasn't|haven't|hadn't|isn't|aren't|wasn't|weren't|can't|couldn't|wouldn't|shouldn't)\s+(\w+\s+){0,3}(nothing|nobody|nowhere|never|neither|none)\b/gi,
      suggest: m => m[0].replace(/\b(nothing|nobody|nowhere|never|neither|none)\b/i, w => {
        const map = { nothing:'anything', nobody:'anybody', nowhere:'anywhere', never:'ever', neither:'either', none:'any' };
        return map[w.toLowerCase()] || w;
      }),
      why: 'En inglés una negación ya es suficiente. "I don\'t have nothing" = lógicamente positivo. Usa anything/anybody/anywhere después de un negativo.',
      severity: 'high'
    },
    {
      id: 'have_years',
      name: 'Have + años (edad)',
      kind: 'be_vs_have',
      regex: /\b(I|you|he|she|it|we|they)\s+(have|has)\s+(\d{1,3})\s+(years?(?:\s+old)?)\b/gi,
      suggest: m => {
        const subj = m[1].toLowerCase();
        const be = subj === 'i' ? 'am' : /^(he|she|it)$/.test(subj) ? 'is' : 'are';
        return `${m[1]} ${be} ${m[3]} years old`;
      },
      why: 'La edad se expresa con "to be", no con "have". "I am 25 years old", NUNCA "I have 25 years".',
      severity: 'high'
    },
    {
      id: 'have_state',
      name: 'Have + estado físico/emocional',
      kind: 'be_vs_have',
      regex: /\b(I|you|he|she|it|we|they)\s+(have|has)\s+(hungry|thirsty|cold|hot|sleepy|tired|right|wrong|scared|afraid|happy|sad|angry|warm)\b/gi,
      suggest: m => {
        const subj = m[1].toLowerCase();
        const be = subj === 'i' ? 'am' : /^(he|she|it)$/.test(subj) ? 'is' : 'are';
        return `${m[1]} ${be} ${m[3]}`;
      },
      why: 'Estados como hungry/cold/right se expresan con "to be", no con "have". "I am hungry", no "I have hungry".',
      severity: 'high'
    },
    {
      id: 'have_that_verb',
      name: 'Have that + verbo (tener que)',
      kind: 'modal',
      regex: /\bhave\s+that\s+(work|go|do|make|finish|send|build|create|fix|study|leave|come|run|test|deploy|review|present|learn|speak|find|write|read)\b/gi,
      suggest: m => `have to ${m[1]}`,
      why: '"Tener que + verbo" en inglés es "have to + verbo base", no "have that". "I have to go", no "I have that go".',
      severity: 'high'
    },
    {
      id: 'state_verb_continuous',
      name: 'Verbo de estado en continuo',
      kind: 'aspect',
      regex: /\b(am|is|are|was|were)\s+(knowing|wanting|needing|liking|loving|hating|believing|understanding|remembering|forgetting|meaning|owning|belonging|seeming|appearing)\b/gi,
      suggest: m => {
        const v = m[2].replace(/ing$/, '');
        // -ying → -y · -ing → drop
        const base = v + (v.endsWith('y') ? '' : '');
        return base;
      },
      why: 'Los verbos de estado (know, want, need, like, believe, understand, remember) NO se usan en continuo. "I know", no "I am knowing".',
      tenseId: 'present_continuous',
      severity: 'high'
    },
    {
      id: 'will_to_verb',
      name: 'Will + to + verbo',
      kind: 'modal',
      regex: /\b(will|won't|would|wouldn't|can|can't|could|couldn't|should|shouldn't|may|might|must)\s+to\s+([a-z]+)/gi,
      suggest: m => `${m[1]} ${m[2]}`,
      why: 'Después de modales (will/can/should/etc) NO va "to". Usa verbo en forma base: "I will send", no "I will to send".',
      tenseId: 'future_simple',
      severity: 'high'
    },
    {
      id: 'people_is',
      name: 'People + is/was',
      kind: 'plural',
      regex: /\bpeople\s+(is|was|has)\b/gi,
      suggest: m => `people ${m[1] === 'is' ? 'are' : m[1] === 'was' ? 'were' : 'have'}`,
      why: '"People" es PLURAL en inglés (no como en español). Usa are/were/have.',
      severity: 'med'
    },
    {
      id: 'uncountable_plural',
      name: 'Uncountable en plural',
      kind: 'plural',
      regex: /\b(informations|advices|equipments|furnitures|knowledges|researches|softwares|hardwares|moneys)\b/gi,
      suggest: m => m[0].replace(/s$/, ''),
      why: 'En inglés "information / advice / equipment / furniture / knowledge / research / software / hardware / money" son uncountable. No tienen plural.',
      severity: 'med'
    },
    {
      id: 'depend_of',
      name: 'Depend of',
      kind: 'preposition',
      regex: /\bdepend(s?|ed|ing)?\s+of\b/gi,
      suggest: m => m[0].replace(/of/i, 'on'),
      why: 'En inglés se dice "depend ON", no "depend of". (Sí, sé que en español es "depender DE" — es el calco típico.)',
      severity: 'med'
    },
    {
      id: 'married_with',
      name: 'Married with',
      kind: 'preposition',
      regex: /\bmarried\s+with\b/gi,
      suggest: () => 'married to',
      why: 'En inglés se dice "married TO", no "married with". También aplica engaged TO, related TO.',
      severity: 'med'
    },
    {
      id: 'since_duration',
      name: 'Since + duración',
      kind: 'preposition',
      regex: /\bsince\s+(\d+)\s+(years?|months?|days?|hours?|weeks?)\b(?!\s+ago)/gi,
      suggest: m => `for ${m[1]} ${m[2]}`,
      why: 'SINCE va con un punto temporal específico (since 2020, since Monday). Con duración usa FOR (for 3 years).',
      tenseId: 'present_perfect',
      severity: 'high'
    },
    {
      id: 'make_homework',
      name: 'Make + homework/exam/question',
      kind: 'collocation',
      regex: /\bmake\s+(a\s+)?(homework|exam|test|question|exercise|sport|sports)\b/gi,
      suggest: m => {
        const w = (m[2]||'').toLowerCase();
        if(w === 'question') return 'ask a question';
        if(w === 'sport' || w === 'sports') return 'play sports';
        return `do ${m[1]||''}${w}`.replace(/\s+/g,' ').trim();
      },
      why: 'Make ≠ do. Tareas/ejercicios/deportes usan DO o PLAY: "do homework", "do an exam", "ask a question", "play sports".',
      severity: 'med'
    },
    {
      id: 'question_no_aux',
      name: 'Pregunta sin auxiliar',
      kind: 'question',
      regex: /(^|[.!?]\s+)(I|you|he|she|it|we|they)\s+(have|has|want|need|like|know|think|see|work|live|study|finish|use|build|deploy|create|design|fix|run|do|go|come)\s+([a-z]+\s+){0,6}\?/gi,
      suggest: m => {
        const subj = m[2];
        const verb = m[3];
        const is3s = /^(he|she|it)$/i.test(subj);
        const aux = is3s ? 'Does' : 'Do';
        // Special case: have/has alone → use directly as aux
        if(verb === 'have' || verb === 'has'){
          return `${verb === 'has' ? 'Has' : 'Have'} ${subj} ${m[0].split(verb)[1].trim()}`;
        }
        return `${aux} ${subj} ${verb} ${m[0].split(verb)[1].trim()}`;
      },
      why: 'En inglés las preguntas necesitan auxiliar (Do/Does/Did/Is/Are/Have/Has/Can/Will/Should/etc) al inicio. Subir la entonación NO es suficiente como en español.',
      tenseId: 'present_simple',
      severity: 'high'
    }
  ];

  // ── Engine ────────────────────────────
  function analyze(text){
    if(!text || typeof text !== 'string') return [];
    const results = [];
    PATTERNS.forEach(p => {
      const re = new RegExp(p.regex.source, p.regex.flags);
      let m;
      let safety = 0;
      while((m = re.exec(text)) !== null && safety < 200){
        safety++;
        if(m[0].length === 0){ re.lastIndex++; continue; }
        results.push({
          patternId: p.id,
          name: p.name,
          kind: p.kind,
          match: m[0],
          index: m.index,
          suggestion: (typeof p.suggest === 'function') ? p.suggest(m) : null,
          why: p.why,
          tenseId: p.tenseId || null,
          severity: p.severity
        });
      }
    });
    // Sort by index + deduplicate overlapping matches (prefer first encountered)
    results.sort((a,b) => a.index - b.index);
    const dedup = [];
    let lastEnd = -1;
    results.forEach(r => {
      if(r.index >= lastEnd){
        dedup.push(r);
        lastEnd = r.index + r.match.length;
      }
    });
    return dedup;
  }

  function highlight(text, results){
    if(!results || !results.length) return _esc(text);
    let out = '';
    let last = 0;
    results.forEach((r, i) => {
      out += _esc(text.substring(last, r.index));
      out += `<mark class="err-mark err-${r.severity}" data-i="${i}" title="${_escAttr(r.name)}">${_esc(r.match)}<sup>${i+1}</sup></mark>`;
      last = r.index + r.match.length;
    });
    out += _esc(text.substring(last));
    return out;
  }

  function save(text, results, label){
    const log = _readJSON(LOG_KEY, []);
    log.push({
      id: 'err-' + Date.now(),
      ts: Date.now(),
      date: new Date().toLocaleString('es', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }),
      label: label || '',
      sample: text.substring(0, 220),
      sampleLen: text.length,
      errorCount: results.length,
      results: results.map(r => ({ patternId:r.patternId, match:r.match, suggestion:r.suggestion, severity:r.severity }))
    });
    if(log.length > 50) log.splice(0, log.length - 50);
    _writeJSON(LOG_KEY, log);
    return log.length;
  }

  function log(){ return _readJSON(LOG_KEY, []); }

  // Aggregate de wiki personal: cuántas veces el usuario cae en cada patrón
  function wiki(){
    const all = log();
    const counts = {};
    const lastSamples = {};
    all.forEach(entry => {
      (entry.results || []).forEach(r => {
        counts[r.patternId] = (counts[r.patternId] || 0) + 1;
        if(!lastSamples[r.patternId]) lastSamples[r.patternId] = r.match;
      });
    });
    return PATTERNS.map(p => ({
      id: p.id,
      name: p.name,
      kind: p.kind,
      severity: p.severity,
      count: counts[p.id] || 0,
      lastSample: lastSamples[p.id] || null,
      why: p.why,
      tenseId: p.tenseId || null
    })).filter(p => p.count > 0).sort((a,b) => b.count - a.count);
  }

  // ── UI ────────────────────────────────
  function _renderTab(){
    const host = _by('p-errors');
    if(!host) return;

    const w = wiki();
    const logEntries = log().slice().reverse().slice(0, 5);

    host.innerHTML = `
      <div class="sl">· detector de errores hispanos · F5 ·</div>
      <div class="sd">Pega tu texto en inglés (un email que escribiste, un mensaje de Slack, un párrafo). El motor lo escanea contra ${PATTERNS.length} patrones de errores típicos de hispanohablantes y construye tu wiki personal de errores recurrentes.</div>

      <div class="tipbox">
        <b>💡 Cómo funciona</b>
        <p>El detector NO usa IA externa. Son <strong>${PATTERNS.length} reglas locales</strong> verificables (regex) que cubren los errores más documentados: "I no understand", "He work", "I have 25 years", verbos de estado en continuo, "depend of", doble negación, etc. Tu wiki crece con cada análisis y muestra dónde caés más seguido.</p>
      </div>

      <!-- A · Input + Analyze -->
      <div class="err-section">
        <div class="err-sec-h">
          <span class="err-sec-icon">✍️</span>
          <div>
            <div class="err-sec-title">Pegá tu texto</div>
            <div class="err-sec-sub">Email, mensaje, ensayo · cualquier cosa que hayas escrito en inglés</div>
          </div>
        </div>
        <textarea class="err-input" id="errInput" placeholder="Ejemplos para probar:&#10;&#10;I no understand the requirements.&#10;She work in the data team and have 30 years.&#10;We have that finish the project.&#10;I will to send the report.&#10;He don't know nothing about the issue.&#10;I depend of my manager.&#10;The informations are important.&#10;People is hungry."></textarea>
        <div class="err-input-actions">
          <button class="btn bp" id="errAnalyze">🔍 Analizar errores</button>
          <button class="btn bo" id="errClear">Limpiar</button>
          <span id="errInputStats" class="imp-stats"></span>
        </div>
        <div id="errResults"></div>
      </div>

      <!-- B · Wiki personal -->
      <div class="err-section">
        <div class="err-sec-h">
          <span class="err-sec-icon">📚</span>
          <div>
            <div class="err-sec-title">Mi wiki personal de errores</div>
            <div class="err-sec-sub">${w.length ? `${w.length} patrón${w.length===1?'':'es'} detectado${w.length===1?'':'s'} en tus análisis previos · ordenados por frecuencia` : 'Aún sin datos · analiza algún texto para empezar a poblarlo'}</div>
          </div>
        </div>
        <div id="errWiki">
          ${w.length ? w.map(p => _wikiCardHTML(p)).join('') : '<div class="imp-empty">Sin errores registrados todavía. Pega texto y dale a "Analizar" para empezar tu wiki personal.</div>'}
        </div>
      </div>

      <!-- C · Historial -->
      <div class="err-section">
        <div class="err-sec-h">
          <span class="err-sec-icon">📜</span>
          <div>
            <div class="err-sec-title">Historial de análisis</div>
            <div class="err-sec-sub">Últimos 5</div>
          </div>
        </div>
        <div id="errHistory">
          ${logEntries.length ? logEntries.map(h => `
            <div class="imp-hist">
              <div class="imp-hist-date">${_esc(h.date)}</div>
              <div class="imp-hist-source">${_esc(h.sample.substring(0,80))}${h.sample.length>80?'…':''}</div>
              <div class="imp-hist-stats">
                <span class="imp-hist-pill err-p-count">${h.errorCount} error${h.errorCount===1?'':'es'}</span>
                <span class="imp-hist-pill err-p-len">${h.sampleLen} chars</span>
              </div>
            </div>`).join('') : '<div class="imp-empty">Sin análisis aún.</div>'}
        </div>
      </div>
    `;

    _wireEvents();
  }

  function _wikiCardHTML(p){
    return `
      <div class="err-wiki err-sev-${p.severity}">
        <div class="err-wiki-h">
          <span class="err-wiki-count">×${p.count}</span>
          <div class="err-wiki-info">
            <div class="err-wiki-name">${_esc(p.name)}</div>
            <div class="err-wiki-kind">${_esc(p.kind)} · severity ${p.severity}</div>
          </div>
          ${p.tenseId ? `<button class="btn bo bs" data-go-tense="${_escAttr(p.tenseId)}">📖 Ver lección</button>` : ''}
        </div>
        ${p.lastSample ? `<div class="err-wiki-sample"><span class="err-wiki-lbl">Último caso:</span> <code>${_esc(p.lastSample)}</code></div>` : ''}
        <div class="err-wiki-why">${_esc(p.why)}</div>
      </div>`;
  }

  function _wireEvents(){
    const ana = _by('errAnalyze');
    if(ana) ana.addEventListener('click', _doAnalyze);

    const clr = _by('errClear');
    if(clr) clr.addEventListener('click', () => {
      _by('errInput').value = '';
      _by('errResults').innerHTML = '';
      _by('errInputStats').textContent = '';
    });

    const inp = _by('errInput');
    if(inp){
      inp.addEventListener('input', () => {
        const t = inp.value || '';
        const w = t.trim().split(/\s+/).filter(Boolean).length;
        _by('errInputStats').textContent = t ? `${w} palabras · ${t.length} caracteres` : '';
      });
    }

    document.querySelectorAll('[data-go-tense]').forEach(b => {
      b.addEventListener('click', () => {
        const tid = b.dataset.goTense;
        // Cambiar a tab Tiempos y abrir la lección
        const tab = document.querySelector('[data-p="tense"]');
        const pnl = _by('p-tense');
        if(tab && pnl){
          document.querySelectorAll('.tab').forEach(x => x.classList.remove('on'));
          document.querySelectorAll('.pnl').forEach(x => x.classList.remove('on'));
          tab.classList.add('on'); pnl.classList.add('on');
        }
        if(window.ENG_TENSES && typeof ENG_TENSES.openLesson === 'function'){
          ENG_TENSES.openLesson(tid);
        }
      });
    });
  }

  function _doAnalyze(){
    const text = (_by('errInput').value || '').trim();
    if(!text){ alert('Pegá texto primero'); return; }
    const results = analyze(text);

    const host = _by('errResults');
    if(!host) return;

    if(!results.length){
      host.innerHTML = `
        <div class="err-result-ok">
          <div class="err-ok-h">✅ ¡Sin errores detectados!</div>
          <p>El texto no dispara ninguno de los ${PATTERNS.length} patrones del detector. (Esto NO significa que sea perfecto — solo que no caés en los errores hispanos típicos.)</p>
          <button class="btn bo bs" id="errSaveOk">💾 Guardar análisis (sin errores)</button>
        </div>`;
      _by('errSaveOk').addEventListener('click', () => {
        save(text, [], 'sin errores');
        _toast('✓ Análisis guardado (0 errores)');
        _renderTab();
      });
      return;
    }

    const highlighted = highlight(text, results);
    const bySeverity = { high:0, med:0, low:0 };
    results.forEach(r => bySeverity[r.severity] = (bySeverity[r.severity]||0) + 1);

    host.innerHTML = `
      <div class="err-result">
        <div class="err-summary">
          <div class="err-sum-row">
            <span class="err-sum-c">${results.length} error${results.length===1?'':'es'} detectado${results.length===1?'':'s'}</span>
            <div class="err-sum-pills">
              ${bySeverity.high ? `<span class="err-sev-pill err-sev-high">${bySeverity.high} alta</span>` : ''}
              ${bySeverity.med ? `<span class="err-sev-pill err-sev-med">${bySeverity.med} media</span>` : ''}
              ${bySeverity.low ? `<span class="err-sev-pill err-sev-low">${bySeverity.low} baja</span>` : ''}
            </div>
          </div>
        </div>

        <div class="err-text-view">${highlighted}</div>

        <div class="err-list">
          ${results.map((r, i) => `
            <div class="err-item err-sev-${r.severity}">
              <div class="err-item-h">
                <span class="err-item-num">${i+1}</span>
                <div class="err-item-info">
                  <div class="err-item-name">${_esc(r.name)}</div>
                  <div class="err-item-kind">${_esc(r.kind)}</div>
                </div>
                <span class="err-sev-pill err-sev-${r.severity}">${r.severity}</span>
              </div>
              <div class="err-item-body">
                <div class="err-row err-row-bad"><span class="err-row-l">✗ Encontrado:</span><code>${_esc(r.match)}</code></div>
                ${r.suggestion ? `<div class="err-row err-row-good"><span class="err-row-l">✓ Sugerencia:</span><code>${_esc(r.suggestion)}</code></div>` : ''}
                <div class="err-row err-row-why"><span class="err-row-l">📖 Regla:</span><span>${_esc(r.why)}</span></div>
                ${r.tenseId ? `<div class="err-row"><button class="btn bo bs" data-go-tense="${_escAttr(r.tenseId)}">→ Ver lección del tiempo relacionado</button></div>` : ''}
              </div>
            </div>
          `).join('')}
        </div>

        <div class="err-actions">
          <button class="btn bp" id="errSave">💾 Guardar análisis en mi wiki</button>
        </div>
      </div>`;

    // Wire "go to tense" inside results
    host.querySelectorAll('[data-go-tense]').forEach(b => {
      b.addEventListener('click', () => {
        const tid = b.dataset.goTense;
        const tab = document.querySelector('[data-p="tense"]');
        const pnl = _by('p-tense');
        if(tab && pnl){
          document.querySelectorAll('.tab').forEach(x => x.classList.remove('on'));
          document.querySelectorAll('.pnl').forEach(x => x.classList.remove('on'));
          tab.classList.add('on'); pnl.classList.add('on');
        }
        if(window.ENG_TENSES && typeof ENG_TENSES.openLesson === 'function'){
          ENG_TENSES.openLesson(tid);
        }
      });
    });

    _by('errSave').addEventListener('click', () => {
      save(text, results, '');
      _toast(`✓ Análisis guardado · ${results.length} errores añadidos a tu wiki`);
      _renderTab();
    });
  }

  function _toast(msg){
    let t = document.getElementById('impToast');
    if(!t){
      t = document.createElement('div');
      t.id = 'impToast';
      t.className = 'imp-toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('on');
    setTimeout(() => t.classList.remove('on'), 3200);
  }

  function openTab(){
    const tab = document.querySelector('[data-p="errors"]');
    if(!tab) return;
    document.querySelectorAll('.tab').forEach(x => x.classList.remove('on'));
    document.querySelectorAll('.pnl').forEach(x => x.classList.remove('on'));
    tab.classList.add('on');
    _by('p-errors').classList.add('on');
    _renderTab();
  }

  // ── Init ──────────────────────────────
  function init(){
    const tab = document.querySelector('[data-p="errors"]');
    if(tab){
      tab.addEventListener('click', () => setTimeout(_renderTab, 50));
    }
    _renderTab();

    window.addEventListener('cloud:sync_complete', () => {
      if(_by('p-errors') && _by('p-errors').classList.contains('on')) _renderTab();
    });
  }

  return { init, analyze, highlight, save, log, wiki, openTab, PATTERNS };
})();

window.ENG_ERRORS = ENG_ERRORS;
document.addEventListener('DOMContentLoaded', () => {
  if(window.ENG_ERRORS && typeof ENG_ERRORS.init === 'function') ENG_ERRORS.init();
});
