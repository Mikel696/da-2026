// ══════════════════════════════════════════════════════════════
// DA-2026 · MODULE 4-RUT — Excel Technical Test Simulator
// Interactive AP/Finance assessment practice with formula validation
// ══════════════════════════════════════════════════════════════
const ExcelDojo = {
  data: null,
  ready: false,
  currentId: null,
  solved: new Set(),
  attempts: 0,
  correct: 0,

  async init(){
    const el = document.getElementById('excelDojoStub');
    if(!el) return;
    try {
      const r = await fetch('data/excel-tests.json');
      this.data = await r.json();
      this.ready = true;
      this.loadProgress();
      this.renderShell(el);
    } catch(e){
      console.warn('ExcelDojo: could not load data', e);
      el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--t3)">Error loading Excel tests.</div>';
    }
  },

  loadProgress(){
    try {
      const s = JSON.parse(localStorage.getItem('excel_dojo')||'{}');
      this.solved = new Set(s.solved||[]);
      this.attempts = s.attempts||0;
      this.correct = s.correct||0;
    } catch(e){}
  },

  saveProgress(){
    localStorage.setItem('excel_dojo', JSON.stringify({
      solved: [...this.solved],
      attempts: this.attempts,
      correct: this.correct
    }));
  },

  // ── Render Shell ────────────────────────────────
  renderShell(container){
    const totalQ = this.data.categories.reduce((a,c) => a+c.scenarios.length, 0);

    container.innerHTML = `
      <div class="xl-stats">
        <div class="xl-stat"><div class="xl-stat-v" style="color:var(--a2)">${totalQ}</div><div class="xl-stat-l">Scenarios</div></div>
        <div class="xl-stat"><div class="xl-stat-v" style="color:var(--gn)" id="xlSolved">${this.solved.size}</div><div class="xl-stat-l">Solved</div></div>
        <div class="xl-stat"><div class="xl-stat-v" style="color:var(--am)" id="xlAttempts">${this.attempts}</div><div class="xl-stat-l">Attempts</div></div>
        <div class="xl-stat"><div class="xl-stat-v" style="color:var(--cy)" id="xlAccuracy">${this.attempts?Math.round(this.correct/this.attempts*100):0}%</div><div class="xl-stat-l">Accuracy</div></div>
      </div>
      <div class="excel-sim">
        <div class="xl-sidebar" id="xlSidebar"></div>
        <div class="xl-workspace" id="xlWorkspace"></div>
      </div>`;

    this.renderSidebar();
    this.renderEmpty();
  },

  // ── Sidebar ─────────────────────────────────────
  renderSidebar(){
    const sb = document.getElementById('xlSidebar');
    if(!sb) return;

    let html = '';
    this.data.categories.forEach(cat => {
      html += `<div class="xl-cat">
        <div class="xl-cat-title">${cat.icon} ${cat.name}</div>`;
      cat.scenarios.forEach(sc => {
        const done = this.solved.has(sc.id);
        html += `<div class="xl-item${this.currentId===sc.id?' on':''}" onclick="ExcelDojo.loadScenario('${sc.id}')">
          ${done?'✅':'📝'} ${this.esc(sc.title)}
          <div class="xl-item-tag">${sc.key_functions.join(' · ')}</div>
        </div>`;
      });
      html += `</div>`;
    });

    sb.innerHTML = html;
  },

  // ── Empty State ─────────────────────────────────
  renderEmpty(){
    const ws = document.getElementById('xlWorkspace');
    if(!ws) return;
    ws.innerHTML = `<div class="xl-empty">
      <div class="xl-empty-icon">📊</div>
      <h3>Excel Technical Test Simulator</h3>
      <p>Select a scenario from the left panel to begin. Each test simulates a real AP/Finance technical assessment with mock data tables and formula validation.</p>
    </div>`;
  },

  // ── Load Scenario ───────────────────────────────
  loadScenario(id){
    let scenario = null;
    for(const cat of this.data.categories){
      const found = cat.scenarios.find(s => s.id === id);
      if(found){ scenario = found; break; }
    }
    if(!scenario) return;

    this.currentId = id;
    this.renderSidebar(); // update active state
    this.renderWorkspace(scenario);
  },

  // ── Render Workspace ────────────────────────────
  renderWorkspace(sc){
    const ws = document.getElementById('xlWorkspace');
    if(!ws) return;

    // Build column headers from mock_data keys
    const cols = Object.keys(sc.mock_data[0]);
    const colLetters = cols; // A, B, C, D...

    // Build table
    let tableHTML = '<table class="xl-table"><thead><tr><th>#</th>';
    colLetters.forEach(c => { tableHTML += `<th class="xl-col-header">${c}</th>`; });
    tableHTML += '</tr></thead><tbody>';

    sc.mock_data.forEach((row, i) => {
      tableHTML += `<tr><td class="xl-row-num">${i+1}</td>`;
      colLetters.forEach(c => {
        const val = row[c] || '';
        const isTarget = val === '?';
        tableHTML += `<td${isTarget?' class="xl-target"':''}>${isTarget ? '← Your formula' : this.esc(String(val))}</td>`;
      });
      tableHTML += '</tr>';
    });
    tableHTML += '</tbody></table>';

    // Functions hint
    const funcHint = sc.key_functions.map(f => `<code style="background:var(--el);padding:1px 5px;border-radius:3px;font-size:11px;color:var(--am)">${f}</code>`).join(' ');

    ws.innerHTML = `
      <div class="xl-ws-title">📝 ${this.esc(sc.title)}</div>
      <div class="xl-ws-case">${this.esc(sc.business_case)}</div>
      <div style="font-size:10px;color:var(--t3);margin-bottom:8px">Key functions: ${funcHint}</div>
      <div class="xl-table-wrap">${tableHTML}</div>
      <div class="xl-formula-section">
        <div class="xl-formula-label">📐 Type your Excel formula for the yellow "?" cells:</div>
        <div class="xl-formula-bar">
          <div class="xl-formula-prefix">fx</div>
          <input class="xl-formula-input" id="xlFormula-${sc.id}" placeholder="=XLOOKUP(B2,E:E,F:F,...)" onkeydown="if(event.key==='Enter')ExcelDojo.verify('${sc.id}')">
        </div>
        <div class="xl-btns">
          <button class="xl-btn xl-btn-check" onclick="ExcelDojo.verify('${sc.id}')">✅ Verificar Fórmula</button>
          <button class="xl-btn xl-btn-show" id="xlShowBtn-${sc.id}" onclick="ExcelDojo.showSolution('${sc.id}')">👁️ Mostrar Solución</button>
          <button class="xl-btn xl-btn-next" onclick="ExcelDojo.nextScenario()">→ Siguiente</button>
        </div>
      </div>
      <div class="xl-solution" id="xlSolution-${sc.id}">
        <div class="xl-sol-label">✅ Solution</div>
        <div class="xl-sol-formula">${this.esc(sc.target_formula)}</div>
        <div class="xl-sol-explain">${this.formatExplanation(sc.explanation)}</div>
      </div>`;
  },

  // ── Verify Formula ──────────────────────────────
  verify(id){
    let scenario = null;
    for(const cat of this.data.categories){
      const found = cat.scenarios.find(s => s.id === id);
      if(found){ scenario = found; break; }
    }
    if(!scenario) return;

    const input = document.getElementById('xlFormula-'+id);
    if(!input) return;
    const userFormula = input.value.trim().toUpperCase();

    if(!userFormula){
      this.toast('Type a formula first!', 'err');
      return;
    }

    this.attempts++;

    // Check key functions with regex
    const matched = [];
    const missed = [];
    scenario.key_functions.forEach(fn => {
      const regex = new RegExp(fn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      if(regex.test(userFormula)){
        matched.push(fn);
      } else {
        missed.push(fn);
      }
    });

    const allMatch = missed.length === 0;

    if(allMatch){
      this.correct++;
      this.solved.add(id);
      this.toast('✅ Correct! Your formula contains all required functions.', 'ok');
      input.style.borderColor = 'var(--gn)';
      input.style.boxShadow = '0 0 0 2px rgba(34,197,94,.2)';
    } else if(matched.length > 0){
      this.toast(`⚠️ Partial match! Found: ${matched.join(', ')}. Missing: ${missed.join(', ')}`, 'warn');
      input.style.borderColor = 'var(--am)';
      input.style.boxShadow = '0 0 0 2px rgba(234,179,8,.15)';
    } else {
      this.toast(`❌ Missing key functions: ${missed.join(', ')}. Try again!`, 'err');
      input.style.borderColor = 'var(--rd)';
      input.style.boxShadow = '0 0 0 2px rgba(239,68,68,.15)';
    }

    this.saveProgress();
    this.updateStats();
    this.renderSidebar();
  },

  // ── Show Solution ───────────────────────────────
  showSolution(id){
    const el = document.getElementById('xlSolution-'+id);
    const btn = document.getElementById('xlShowBtn-'+id);
    if(!el) return;
    const showing = el.classList.toggle('show');
    if(btn) btn.innerHTML = showing ? '🙈 Ocultar Solución' : '👁️ Mostrar Solución';
  },

  // ── Next Scenario ───────────────────────────────
  nextScenario(){
    const allIds = [];
    this.data.categories.forEach(cat => {
      cat.scenarios.forEach(sc => allIds.push(sc.id));
    });
    const curIdx = allIds.indexOf(this.currentId);
    const nextIdx = (curIdx + 1) % allIds.length;
    this.loadScenario(allIds[nextIdx]);
  },

  // ── Toast Notification ──────────────────────────
  toast(msg, type){
    const existing = document.querySelector('.xl-toast');
    if(existing) existing.remove();

    const t = document.createElement('div');
    t.className = `xl-toast xl-toast-${type}`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  },

  // ── Update Stats UI ─────────────────────────────
  updateStats(){
    const el1 = document.getElementById('xlSolved');
    const el2 = document.getElementById('xlAttempts');
    const el3 = document.getElementById('xlAccuracy');
    if(el1) el1.textContent = this.solved.size;
    if(el2) el2.textContent = this.attempts;
    if(el3) el3.textContent = this.attempts ? Math.round(this.correct/this.attempts*100)+'%' : '0%';
  },

  // ── Format Explanation ──────────────────────────
  formatExplanation(text){
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.+?)`/g, '<code style="background:var(--el);padding:1px 4px;border-radius:3px;font-size:11px;color:var(--am)">$1</code>')
      .replace(/\n/g, '<br>');
  },

  esc(text){
    return (text||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
};

ExcelDojo.init();
