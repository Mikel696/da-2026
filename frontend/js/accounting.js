/* ═══════════════════════════════════════════════════════════════
   DA-2026 · 11-ACC · Accounting Associate — Logic & Rendering
   ─────────────────────────────────────────────────────────────
   Data:  localStorage 'sb_accounting' → proxy auto-syncs to app_state
   Content: fetched from data/accounting-data.json
   Depends on: cloud-sync.js (proxy + cloud:sync_complete event)
   Architecture (per PLAN_ACCOUNTING.md):
     L1 — Data Singleton    (state + I/O)
     L2 — Pure Compute      (no DOM, no I/O)
     L3 — Rendering          (DOM only)
     L4 — Events & Init
═══════════════════════════════════════════════════════════════ */

const ACC = (() => {

  /* ══════════════════════════════════════════════════════════════
     SECTION 0 — Helpers
  ══════════════════════════════════════════════════════════════ */

  function _esc(s) {
    const d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }

  function _today() { return new Date().toISOString().split('T')[0]; }

  // Category metadata
  const CAT_ICONS = { payrollCore: '💰', taxSystems: '🏛️', reconciliation: '🔄', adpSpecific: '⚙️', formulas: '📐', features: '📊', accounting: '📒' };
  const CAT_NAMES = { payrollCore: 'Payroll Core', taxSystems: 'Tax Systems', reconciliation: 'Reconciliation', adpSpecific: 'ADP / Master Tax', formulas: 'Excel Formulas', features: 'Excel Features', accounting: 'Accounting Concepts' };

  // Content store — filled after fetch
  let DATA = null;


  /* ══════════════════════════════════════════════════════════════
     SECTION 1 — Data Singleton (L1)
  ══════════════════════════════════════════════════════════════ */

  const ACCT = {
    KEY: 'sb_accounting',

    _load() { try { return JSON.parse(localStorage.getItem(ACCT.KEY) || '{}'); } catch { return {}; } },
    _save(s) { localStorage.setItem(ACCT.KEY, JSON.stringify(s)); },

    // ── Progress ──
    getProgress() {
      const s = ACCT._load();
      return s.progress || { xp: 0, streak: {} };
    },
    addXP(n) {
      const s = ACCT._load();
      if (!s.progress) s.progress = { xp: 0, streak: {} };
      s.progress.xp = (s.progress.xp || 0) + n;
      s.progress.streak[_today()] = true;
      ACCT._save(s);
    },

    // ── Exercise log ──
    getExerciseLog() {
      const s = ACCT._load();
      return s.exerciseLog || [];
    },
    logExercise(exerciseId, correct) {
      const s = ACCT._load();
      if (!s.exerciseLog) s.exerciseLog = [];
      s.exerciseLog.push({ id: crypto.randomUUID(), exerciseId, correct, date: new Date().toISOString() });
      ACCT._save(s);
    },

    // ── Chat history ──
    getChatHistory() {
      const s = ACCT._load();
      return s.chatHistory || { qIdx: 0, msgs: [] };
    },
    saveChatHistory(ch) {
      const s = ACCT._load();
      s.chatHistory = ch;
      ACCT._save(s);
    },

    // ── Glossary mastery ──
    getMastered() {
      const s = ACCT._load();
      return s.mastered || {};
    },
    toggleMastered(wordKey) {
      const s = ACCT._load();
      if (!s.mastered) s.mastered = {};
      s.mastered[wordKey] = !s.mastered[wordKey];
      ACCT._save(s);
    },

    // ── STAR practiced ──
    getPracticed() {
      const s = ACCT._load();
      return s.practiced || {};
    },
    togglePracticed(qKey) {
      const s = ACCT._load();
      if (!s.practiced) s.practiced = {};
      s.practiced[qKey] = !s.practiced[qKey];
      ACCT._save(s);
    },

    // ── Career path checkboxes ──
    getCareerDone() {
      const s = ACCT._load();
      return s.careerDone || {};
    },
    toggleCareerStep(step) {
      const s = ACCT._load();
      if (!s.careerDone) s.careerDone = {};
      s.careerDone[step] = !s.careerDone[step];
      ACCT._save(s);
    }
  };


  /* ══════════════════════════════════════════════════════════════
     SECTION 2 — Pure Compute (L2)
  ══════════════════════════════════════════════════════════════ */

  function calcStreak(streakObj) {
    if (!streakObj) return 0;
    let count = 0;
    const d = new Date();
    for (let i = 0; i < 365; i++) {
      if (streakObj[d.toISOString().split('T')[0]]) count++;
      else break;
      d.setDate(d.getDate() - 1);
    }
    return count;
  }

  function countTotalTerms() {
    if (!DATA) return 0;
    let n = 0;
    for (const cat of Object.values(DATA.glossary)) n += cat.length;
    for (const cat of Object.values(DATA.excelVocab)) n += cat.length;
    return n;
  }

  function countMastered() {
    const m = ACCT.getMastered();
    return Object.values(m).filter(Boolean).length;
  }

  function exerciseStats() {
    const log = ACCT.getExerciseLog();
    const correct = log.filter(e => e.correct).length;
    return { total: log.length, correct, pct: log.length ? Math.round((correct / log.length) * 100) : 0 };
  }

  function scoreKeywords(text, keywords) {
    const lower = text.toLowerCase();
    let matched = 0;
    keywords.forEach(k => { if (lower.includes(k.toLowerCase())) matched++; });
    return { matched, total: keywords.length };
  }

  function wordKey(cat, idx) { return cat + '.' + idx; }


  /* ══════════════════════════════════════════════════════════════
     SECTION 3 — TTS Engine
  ══════════════════════════════════════════════════════════════ */

  let ttsVoice = null, currentBtn = null;

  function initTTS() {
    if (!window.speechSynthesis) return;
    const loadV = () => {
      const v = speechSynthesis.getVoices();
      ttsVoice = v.find(x => x.name.includes('Google US English') || x.lang.includes('en-US')) || v[0];
    };
    loadV();
    speechSynthesis.onvoiceschanged = loadV;
  }

  function speak(text, btn) {
    if (!window.speechSynthesis) return;
    if (btn && btn === currentBtn && speechSynthesis.speaking) {
      speechSynthesis.cancel();
      btn.classList.remove('playing');
      currentBtn = null;
      return;
    }
    speechSynthesis.cancel();
    if (currentBtn) currentBtn.classList.remove('playing');
    const clean = text.replace(/<[^>]*>/g, '').replace(/\(.*?\)/g, '').trim();
    const u = new SpeechSynthesisUtterance(clean);
    if (ttsVoice) u.voice = ttsVoice;
    u.lang = 'en-US'; u.rate = 0.82;
    if (btn) {
      btn.classList.add('playing'); currentBtn = btn;
      u.onend = () => { btn.classList.remove('playing'); currentBtn = null; };
      u.onerror = () => { btn.classList.remove('playing'); currentBtn = null; };
    }
    speechSynthesis.speak(u);
  }


  /* ══════════════════════════════════════════════════════════════
     SECTION 4 — Rendering (L3)
  ══════════════════════════════════════════════════════════════ */

  function renderStats() {
    const p = ACCT.getProgress();
    const el = (id) => document.getElementById(id);
    const mastered = countMastered();
    const total = countTotalTerms();
    const ex = exerciseStats();
    const streak = calcStreak(p.streak);

    if (el('sGloss')) el('sGloss').textContent = mastered + '/' + total;
    if (el('sExerc')) el('sExerc').textContent = ex.correct + '/' + ex.total;
    if (el('sXP')) el('sXP').textContent = (p.xp || 0) + ' XP';
    if (el('sStreak')) el('sStreak').textContent = streak + '🔥';

    // Nav XP badge
    const xpBdg = document.getElementById('navXP');
    if (xpBdg) xpBdg.textContent = '🔥 ' + (p.xp || 0);
  }

  // ── Tab 1: Career Path ──
  function renderCareer() {
    const el = document.getElementById('acct-career');
    if (!el || !DATA) return;
    const done = ACCT.getCareerDone();

    const pathHtml = DATA.careerPath.map(s => {
      const checked = done[s.step] ? ' checked' : '';
      const opacity = done[s.step] ? ' style="opacity:.6"' : '';
      return (
        '<div class="word"' + opacity + ' style="border-left:3px solid ' + s.color + '">' +
          '<input type="checkbox" data-act="career-toggle" data-step="' + s.step + '"' + checked + ' style="margin-top:4px;cursor:pointer">' +
          '<div class="word-body">' +
            '<div class="word-en" style="color:' + s.color + ';font-size:14px;font-weight:600">' + _esc(s.title) + '</div>' +
            '<div class="word-es" style="font-size:12px">' + _esc(s.desc) + '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    // Exercises below career path
    const exHtml = DATA.exercises.map((e, i) => {
      return (
        '<div class="exr">' +
          '<div style="display:flex;justify-content:space-between;margin-bottom:6px">' +
            '<span class="sl">Simulador Técnico</span>' +
            '<span class="ex-tag">' + _esc(e.tag) + '</span>' +
          '</div>' +
          '<div class="eq">' + _esc(e.q) + '</div>' +
          '<input class="ein" id="acct-i' + i + '" placeholder="Tu respuesta técnica...">' +
          '<div style="margin-top:6px">' +
            '<button class="btn bp bs" data-act="check-ex" data-idx="' + i + '">Verificar</button> ' +
            '<button class="btn bo bs" data-act="show-ex" data-idx="' + i + '">Ver respuesta</button>' +
          '</div>' +
          '<div class="efb" id="acct-f' + i + '"></div>' +
        '</div>'
      );
    }).join('');

    el.innerHTML =
      '<div class="card"><div class="card-h"><div class="card-t">🚀 Ruta de Aprendizaje 2026</div>' +
      '<span class="pl" style="background:var(--amg);color:var(--am);border:1px solid rgba(234,179,8,.15)">Senior Track</span></div>' +
      '<div class="sd">Cursos y herramientas exigidas para el rol Senior Accounting Specialist. Marca los que completes.</div>' +
      '<div style="display:flex;flex-direction:column;gap:10px">' + pathHtml + '</div></div>' +
      '<div class="sl" style="margin-top:20px">· laboratorio de conciliación y nómina ·</div>' +
      '<div class="sd">Ejercicios técnicos reales: conciliación bancaria, Power Query, nómina, journal entries, varianza.</div>' +
      exHtml;
  }

  // ── Glossary rendering (shared by Tab 2 glossary + Tab 3 excel) ──
  function renderVocabSection(vocabObj, containerId, pillsId, prefix) {
    const el = document.getElementById(containerId);
    if (!el) return;

    const mastered = ACCT.getMastered();
    let html = '';

    Object.keys(vocabObj).forEach(cat => {
      const words = vocabObj[cat];
      html += '<div class="card vcat" data-cat="' + cat + '">' +
        '<div class="card-h"><div class="card-t">' + (CAT_ICONS[cat] || '📚') + ' ' + (CAT_NAMES[cat] || cat) + '</div>' +
        '<span class="pl pl-e">' + words.length + '</span></div>';

      words.forEach((w, i) => {
        const wk = wordKey(cat, i);
        const isMastered = mastered[wk];
        const sp = w.en.replace(/\s*\/\s*/g, ' or ').replace(/\.\.\./g, '').replace(/\(.*?\)/g, '').replace(/'/g, "\\'");
        html +=
          '<div class="word' + (isMastered ? ' word-mastered' : '') + '" data-act="toggle-example">' +
            '<div class="word-num">' + String(i + 1).padStart(2, '0') + '</div>' +
            '<button class="tts" data-act="speak" data-text="' + _esc(sp) + '">🔊</button>' +
            '<div class="word-body">' +
              '<div><span class="word-en" data-tip="' + _esc(w.es) + '">' + _esc(w.en) + '</span> <span class="word-tp">' + _esc(w.tp) + '</span></div>' +
              (w.ph && w.ph !== '—' ? '<div class="word-ph">' + _esc(w.ph) + '</div>' : '') +
              '<div class="word-es">' + _esc(w.es) + '</div>' +
              '<div class="word-ex">' + w.ex + '</div>' +
            '</div>' +
            '<button class="mastery-btn' + (isMastered ? ' on' : '') + '" data-act="toggle-mastery" data-wk="' + wk + '" title="Marcar como dominado">' + (isMastered ? '✅' : '☐') + '</button>' +
          '</div>';
      });
      html += '</div>';
    });

    el.innerHTML = html;
  }

  // ── Tab 2: Glossary ──
  function renderGlossary() {
    const el = document.getElementById('acct-glossary');
    if (!el || !DATA) return;
    const mastered = countMastered();
    const totalGloss = Object.values(DATA.glossary).reduce((n, a) => n + a.length, 0);

    el.innerHTML =
      '<div class="sl">· ADP / payroll glossary ·</div>' +
      '<div class="sd">38 términos esenciales del mundo de nómina e impuestos. <b>' + mastered + '</b> dominados de <b>' + totalGloss + '</b>.</div>' +
      '<div class="cp" id="agC"></div><div id="agL"></div>';

    buildPills('agC', Object.keys(DATA.glossary));
    renderVocabSection(DATA.glossary, 'agL', 'agC', 'acct');
    setupFilter('agC', 'agL');
  }

  // ── Tab 3: Excel Lab ──
  function renderExcel() {
    const el = document.getElementById('acct-excel');
    if (!el || !DATA) return;

    el.innerHTML =
      '<div class="sl">· excel vocabulary engine ·</div>' +
      '<div class="sd">Domina la pronunciación de herramientas Excel en inglés. Esencial para la entrevista técnica.</div>' +
      '<div class="tipbox"><b>📊 Link rápido</b><p>Para práctica interactiva de fórmulas Excel con tablas mock, visita <strong><a href="ruta.html" style="color:var(--em)">Ruta DA → Excel Dojo</a></strong>.</p></div>' +
      '<div class="cp" id="exvC"></div><div id="exvL"></div>';

    buildPills('exvC', Object.keys(DATA.excelVocab));
    renderVocabSection(DATA.excelVocab, 'exvL', 'exvC', 'excel');
    setupFilter('exvC', 'exvL');
  }

  // ── Tab 4: Resources ──
  function renderResources() {
    const el = document.getElementById('acct-resources');
    if (!el || !DATA) return;

    el.innerHTML =
      '<div class="sl">· technical exercise hub ·</div>' +
      '<div class="sd">Recursos directos para dominar Excel y contabilidad antes de la entrevista.</div>' +
      '<div class="res-grid">' +
      DATA.resources.map(r =>
        '<a href="' + _esc(r.url) + '" target="_blank" rel="noopener" class="res-card" style="--rc:' + r.color + '">' +
          '<div style="font-size:32px;margin-bottom:8px">' + r.icon + '</div>' +
          '<span class="pl" style="background:color-mix(in srgb,' + r.color + ' 10%,transparent);color:' + r.color + ';border:1px solid color-mix(in srgb,' + r.color + ' 20%,transparent);margin-bottom:6px;display:inline-block">' + _esc(r.tag) + '</span>' +
          '<div style="font-size:14px;font-weight:600;margin-bottom:4px">' + _esc(r.title) + '</div>' +
          '<div style="font-size:11px;color:var(--t2)">' + _esc(r.desc) + '</div>' +
        '</a>'
      ).join('') + '</div>';
  }

  // ── Tab 5: Interview Simulator (chat) ──
  function renderSimulator() {
    const el = document.getElementById('acct-simulator');
    if (!el || !DATA) return;

    el.innerHTML =
      '<div class="sl">· recruitment simulator ·</div>' +
      '<div class="sd">Simula la entrevista con un recruiter. Responde usando el Método STAR en inglés.</div>' +
      '<div class="tipbox"><b>💡 Método STAR</b><p><strong>S</strong>ituation → <strong>T</strong>ask → <strong>A</strong>ction → <strong>R</strong>esult. Siempre con números concretos.</p></div>' +
      '<div id="chatBox" style="max-height:500px;overflow-y:auto;margin-bottom:12px"></div>' +
      '<div style="display:flex;gap:8px">' +
        '<input class="ein" id="chatInput" placeholder="Type your answer in English...">' +
        '<button class="btn bp" data-act="send-chat">Send</button>' +
      '</div>' +
      '<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">' +
        '<button class="btn bo bs" data-act="show-model">💡 Model Answer</button>' +
        '<button class="btn bo bs" data-act="next-question">⏭️ Next Question</button>' +
        '<button class="btn bo bs" data-act="reset-chat">🔄 Reset</button>' +
      '</div>';

    // Restore or initialize chat
    const ch = ACCT.getChatHistory();
    if (!ch.msgs || ch.msgs.length === 0) {
      ch.qIdx = 0; ch.msgs = [];
      addRecruiterMsg(ch);
      ACCT.saveChatHistory(ch);
    }
    renderChatMsgs(ch);
  }

  function addRecruiterMsg(ch) {
    const q = DATA.interviewSimulator[ch.qIdx];
    ch.msgs.push({ who: 'recruiter', text: q.q, cat: q.category });
  }

  function renderChatMsgs(ch) {
    const box = document.getElementById('chatBox');
    if (!box) return;

    box.innerHTML = ch.msgs.map(m => {
      if (m.who === 'recruiter') {
        return '<div class="msg"><div class="msg-av a">👔</div><div class="msg-body"><div class="msg-name a">Recruiter</div>' +
          '<span class="msg-text a">' + _esc(m.text) + ' <button class="tts" data-act="speak" data-text="' + _esc(m.text) + '">🔊</button></span>' +
          (m.cat ? '<div style="margin-top:2px"><span class="pl pl-e" style="font-size:8px">' + _esc(m.cat.toUpperCase()) + '</span></div>' : '') +
          '</div></div>';
      }
      if (m.who === 'you') {
        const color = m.score >= 3 ? 'var(--gn)' : m.score >= 1 ? 'var(--am)' : 'var(--rd)';
        const label = m.score >= 3 ? '✅ Great!' : m.score >= 1 ? '🤔 Add more detail' : '❌ Review model answer';
        return '<div class="msg"><div class="msg-av b">🎤</div><div class="msg-body"><div class="msg-name b">You (Miguel)</div>' +
          '<span class="msg-text b">' + _esc(m.text) + '</span>' +
          (m.score !== undefined ? '<div style="margin-top:4px;font-size:10px;color:' + color + '">Keywords matched: ' + m.score + '/' + m.total + ' ' + label + '</div>' : '') +
          '</div></div>';
      }
      if (m.who === 'model') {
        return '<div class="msg"><div class="msg-av" style="background:var(--eg);border:1px solid rgba(16,185,129,.15)">💡</div><div class="msg-body"><div class="msg-name" style="color:var(--em)">Model Answer</div>' +
          '<span class="msg-text" style="background:rgba(16,185,129,.04);border:1px solid rgba(16,185,129,.1)">' + _esc(m.text) + ' <button class="tts" data-act="speak" data-text="' + _esc(m.text) + '">🔊</button></span>' +
          (m.tips ? '<div style="margin-top:4px">' + m.tips.map(t => '<span style="display:inline-block;padding:2px 6px;background:rgba(234,179,8,.06);border:1px solid rgba(234,179,8,.1);border-radius:8px;font-size:9px;color:var(--am);margin:1px 2px">💡 ' + _esc(t) + '</span>').join('') + '</div>' : '') +
          '</div></div>';
      }
      return '';
    }).join('');

    box.scrollTop = box.scrollHeight;
  }

  // ── Tab 6: STAR Interview Prep ──
  function renderInterview() {
    const el = document.getElementById('acct-interview');
    if (!el || !DATA) return;

    el.innerHTML =
      '<div class="sl">· accounting interview prep ·</div>' +
      '<div class="sd">STAR-method responses for Accounting Associate interviews.</div>' +
      '<div class="cp" id="acctIvC"></div>' +
      '<div id="acctIvL"></div>';

    const items = [
      { c: 'behavioral', label: '🎭 Behavioral' },
      { c: 'technical', label: '🔧 Technical' },
      { c: 'integrity', label: '🛡️ Integrity & Ethics' }
    ];
    document.getElementById('acctIvC').innerHTML = items.map((x, i) =>
      '<span class="cpi' + (i === 0 ? ' on' : '') + '" data-c="' + x.c + '">' + x.label + '</span>'
    ).join('');

    renderInterviewCategory('behavioral');
  }

  function renderInterviewCategory(cat) {
    const d = DATA.starPrep[cat];
    if (!d) return;
    const practiced = ACCT.getPracticed();
    const el = document.getElementById('acctIvL');
    if (!el) return;

    el.innerHTML = d.map((x, i) => {
      const qk = cat + '.' + i;
      const isPracticed = practiced[qk];
      const sp = x.m.replace(/'/g, "\\'");
      return (
        '<div class="card">' +
          '<div class="card-h"><div class="card-t">❓ Q' + (i + 1) + '</div>' +
            '<button class="btn bo bs' + (isPracticed ? '" style="border-color:var(--em);color:var(--em)' : '') + '" data-act="toggle-practiced" data-qk="' + qk + '">' + (isPracticed ? '✅ Practiced' : '☐ Mark practiced') + '</button>' +
          '</div>' +
          '<div class="ivs"><div class="ivr">👔 INTERVIEWER</div>' +
            '<div style="font-size:16px;font-weight:600">"' + _esc(x.q) + '" <button class="tts" data-act="speak" data-text="' + _esc(x.q) + '">🔊</button></div>' +
          '</div>' +
          '<div class="clh" data-act="toggle-collapse"><h3>🎯 Respuesta Modelo</h3><span class="cla">▼</span></div>' +
          '<div class="clb"><div class="cli">' +
            '<div class="ivs" style="border-left:3px solid var(--em)"><div class="ivr">🎤 YOUR ANSWER</div>' +
              '<div style="font-size:13px;line-height:1.6">"' + _esc(x.m) + '" <button class="tts" data-act="speak" data-text="' + _esc(sp) + '">🔊</button></div>' +
            '</div>' +
            '<div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:3px">' +
              x.k.map(k => '<span style="padding:2px 6px;background:var(--eg);border:1px solid rgba(16,185,129,.12);border-radius:8px;font-size:10px;color:var(--em);font-weight:600">' + _esc(k) + '</span>').join('') +
            '</div>' +
            '<div class="ivt" style="margin-top:6px"><b>💡</b> ' + x.t.map(t => _esc(t)).join(' • ') + '</div>' +
          '</div></div>' +
        '</div>'
      );
    }).join('');
  }

  // ── Shared helpers ──
  function buildPills(containerId, keys) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML =
      '<span class="cpi on" data-c="all">Todas</span>' +
      keys.map(c => '<span class="cpi" data-c="' + c + '">' + (CAT_ICONS[c] || '📚') + ' ' + (CAT_NAMES[c] || c) + '</span>').join('');
  }

  function setupFilter(pillsId, listId) {
    const pills = document.getElementById(pillsId);
    if (!pills) return;
    pills.addEventListener('click', e => {
      const pill = e.target.closest('.cpi');
      if (!pill) return;
      pills.querySelectorAll('.cpi').forEach(x => x.classList.remove('on'));
      pill.classList.add('on');
      const c = pill.dataset.c;
      document.querySelectorAll('#' + listId + ' .vcat').forEach(cd => {
        cd.style.display = (c === 'all' || cd.dataset.cat === c) ? '' : 'none';
      });
    });
  }

  function renderAll() {
    if (!DATA) return;
    renderStats();
    renderCareer();
    renderGlossary();
    renderExcel();
    renderResources();
    renderSimulator();
    renderInterview();
  }


  /* ══════════════════════════════════════════════════════════════
     SECTION 5 — Events & Init (L4)
  ══════════════════════════════════════════════════════════════ */

  function bindTabs() {
    document.querySelectorAll('.tab').forEach(t => {
      t.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(x => x.classList.remove('on'));
        document.querySelectorAll('.pnl').forEach(x => x.classList.remove('on'));
        t.classList.add('on');
        const pnl = document.getElementById('p-' + t.dataset.p);
        if (pnl) pnl.classList.add('on');
      });
    });
  }

  function bindDelegation() {
    document.body.addEventListener('click', e => {
      const t = e.target.closest('[data-act]');
      if (!t) return;
      const act = t.dataset.act;

      // ── TTS ──
      if (act === 'speak') {
        e.stopPropagation();
        speak(t.dataset.text, t);
        return;
      }

      // ── Toggle example visibility ──
      if (act === 'toggle-example') {
        const ex = t.querySelector('.word-ex');
        if (ex) ex.classList.toggle('show');
        return;
      }

      // ── Glossary mastery ──
      if (act === 'toggle-mastery') {
        e.stopPropagation();
        ACCT.toggleMastered(t.dataset.wk);
        renderGlossary();
        renderExcel();
        renderStats();
        return;
      }

      // ── Career checkbox ──
      if (act === 'career-toggle') {
        ACCT.toggleCareerStep(parseInt(t.dataset.step, 10));
        return;
      }

      // ── Exercise check ──
      if (act === 'check-ex') {
        const idx = parseInt(t.dataset.idx, 10);
        checkExercise(idx);
        return;
      }
      if (act === 'show-ex') {
        const idx = parseInt(t.dataset.idx, 10);
        showExerciseAnswer(idx);
        return;
      }

      // ── Chat simulator ──
      if (act === 'send-chat') { sendChat(); return; }
      if (act === 'show-model') { showModelAnswer(); return; }
      if (act === 'next-question') { nextQuestion(); return; }
      if (act === 'reset-chat') { resetChat(); return; }

      // ── Interview category pills ──
      if (t.closest('#acctIvC')) {
        document.querySelectorAll('#acctIvC .cpi').forEach(x => x.classList.remove('on'));
        t.classList.add('on');
        renderInterviewCategory(t.dataset.c);
        return;
      }

      // ── STAR practiced toggle ──
      if (act === 'toggle-practiced') {
        ACCT.togglePracticed(t.dataset.qk);
        // Re-render the current category
        const activeCat = document.querySelector('#acctIvC .cpi.on');
        if (activeCat) renderInterviewCategory(activeCat.dataset.c);
        renderStats();
        return;
      }

      // ── Collapsible ──
      if (act === 'toggle-collapse') {
        t.classList.toggle('op');
        const b = t.nextElementSibling;
        if (b) b.classList.toggle('op');
        return;
      }
    });

    // Enter key in chat input
    document.body.addEventListener('keydown', e => {
      if (e.target.id === 'chatInput' && e.key === 'Enter') sendChat();
      // Enter key in exercise inputs
      if (e.target.id && e.target.id.startsWith('acct-i') && e.key === 'Enter') {
        const idx = parseInt(e.target.id.replace('acct-i', ''), 10);
        if (!isNaN(idx)) checkExercise(idx);
      }
    });
  }

  // ── Exercise handlers ──
  function checkExercise(idx) {
    const ex = DATA.exercises[idx];
    if (!ex) return;
    const input = document.getElementById('acct-i' + idx);
    const fb = document.getElementById('acct-f' + idx);
    if (!input || !fb) return;
    const v = input.value.trim().toLowerCase();
    if (!v) return;
    const correct = v === ex.a.toLowerCase() || (ex.al || []).some(a => v === a.toLowerCase());

    ACCT.logExercise(ex.id, correct);
    if (correct) {
      fb.className = 'efb sh suc';
      fb.innerHTML = '✅ ¡Correcto! ' + _esc(ex.w);
      ACCT.addXP(20);
    } else {
      fb.className = 'efb sh inf';
      fb.innerHTML = '💡 Respuesta Esperada: "' + _esc(ex.a) + '" — ' + _esc(ex.w);
      ACCT.addXP(2);
    }
    renderStats();
  }

  function showExerciseAnswer(idx) {
    const ex = DATA.exercises[idx];
    if (!ex) return;
    const fb = document.getElementById('acct-f' + idx);
    if (!fb) return;
    fb.className = 'efb sh inf';
    fb.innerHTML = '💡 Respuesta: "' + _esc(ex.a) + '" — ' + _esc(ex.w);
  }

  // ── Chat simulator handlers ──
  function sendChat() {
    const input = document.getElementById('chatInput');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    const ch = ACCT.getChatHistory();
    const q = DATA.interviewSimulator[ch.qIdx];
    const { matched, total } = scoreKeywords(text, q.keywords);

    ch.msgs.push({ who: 'you', text, score: matched, total });
    ACCT.saveChatHistory(ch);
    input.value = '';
    renderChatMsgs(ch);

    ACCT.addXP(matched >= 3 ? 15 : matched >= 1 ? 5 : 2);
    renderStats();
  }

  function showModelAnswer() {
    const ch = ACCT.getChatHistory();
    const q = DATA.interviewSimulator[ch.qIdx];
    ch.msgs.push({ who: 'model', text: q.model, tips: q.tips });
    ACCT.saveChatHistory(ch);
    renderChatMsgs(ch);
  }

  function nextQuestion() {
    const ch = ACCT.getChatHistory();
    ch.qIdx = (ch.qIdx + 1) % DATA.interviewSimulator.length;
    addRecruiterMsg(ch);
    ACCT.saveChatHistory(ch);
    renderChatMsgs(ch);
  }

  function resetChat() {
    const ch = { qIdx: 0, msgs: [] };
    addRecruiterMsg(ch);
    ACCT.saveChatHistory(ch);
    renderChatMsgs(ch);
  }

  // ── Init ──
  async function init() {
    initTTS();
    bindTabs();
    bindDelegation();

    // Fetch content data
    try {
      const resp = await fetch('data/accounting-data.json');
      DATA = await resp.json();
    } catch (err) {
      console.error('Failed to load accounting data:', err);
      return;
    }

    renderAll();
    window.addEventListener('cloud:sync_complete', renderAll);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }


  /* ══════════════════════════════════════════════════════════════
     SECTION 6 — Public API
  ══════════════════════════════════════════════════════════════ */

  return {
    ACCT, renderAll, renderStats, speak,
    calcStreak, countTotalTerms, countMastered, exerciseStats, scoreKeywords
  };

})();
