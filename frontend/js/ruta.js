// ══════════════════════════════════════════════════════════════
// DA-2026 · MODULE 4-RUT — Excel Technical Test Simulator v2
// Interactive engine with DOM cell updates & step-by-step pedagogy
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

  // ── Find scenario by id ─────────────────────────
  findScenario(id){
    for(const cat of this.data.categories){
      const found = cat.scenarios.find(s => s.id === id);
      if(found) return found;
    }
    return null;
  },

  // ── Render Shell ────────────────────────────────
  renderShell(container){
    const totalQ = this.data.categories.reduce((a,c) => a+c.scenarios.length, 0);

    container.innerHTML = `
      <div class="xl-stats">
        <div class="xl-stat"><div class="xl-stat-v" style="color:var(--a2)">${totalQ}</div><div class="xl-stat-l">Escenarios</div></div>
        <div class="xl-stat"><div class="xl-stat-v" style="color:var(--gn)" id="xlSolved">${this.solved.size}</div><div class="xl-stat-l">Resueltos</div></div>
        <div class="xl-stat"><div class="xl-stat-v" style="color:var(--am)" id="xlAttempts">${this.attempts}</div><div class="xl-stat-l">Intentos</div></div>
        <div class="xl-stat"><div class="xl-stat-v" style="color:var(--cy)" id="xlAccuracy">${this.attempts?Math.round(this.correct/this.attempts*100):0}%</div><div class="xl-stat-l">Precisión</div></div>
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
      <p>Selecciona un escenario del panel izquierdo para comenzar. Cada prueba simula un assessment técnico real de AP/Finanzas con tablas de datos y validación de fórmulas.</p>
    </div>`;
  },

  // ── Load Scenario ───────────────────────────────
  loadScenario(id){
    const scenario = this.findScenario(id);
    if(!scenario) return;

    this.currentId = id;
    this.renderSidebar();
    this.renderWorkspace(scenario);
  },

  // ── Render Workspace ────────────────────────────
  renderWorkspace(sc){
    const ws = document.getElementById('xlWorkspace');
    if(!ws) return;

    const cols = Object.keys(sc.mock_data[0]);

    // Build table with data-target markers on ? cells
    let tableHTML = '<table class="xl-table" id="xlTable-'+sc.id+'"><thead><tr><th>#</th>';
    cols.forEach(c => { tableHTML += `<th class="xl-col-header">${c}</th>`; });
    tableHTML += '</tr></thead><tbody>';

    let targetIdx = 0;
    sc.mock_data.forEach((row, i) => {
      tableHTML += `<tr><td class="xl-row-num">${i+1}</td>`;
      cols.forEach(c => {
        const val = row[c] || '';
        const isTarget = val === '?';
        if(isTarget){
          tableHTML += `<td class="xl-target" data-target-idx="${targetIdx}">← tu fórmula</td>`;
          targetIdx++;
        } else {
          tableHTML += `<td>${this.esc(String(val))}</td>`;
        }
      });
      tableHTML += '</tr>';
    });
    tableHTML += '</tbody></table>';

    // Functions hint pills
    const funcHint = sc.key_functions.map(f =>
      `<code style="background:var(--el);padding:2px 7px;border-radius:4px;font-size:11px;color:var(--am);font-weight:600">${f}</code>`
    ).join(' ');

    ws.innerHTML = `
      <div class="xl-ws-title">📝 ${this.esc(sc.title)}</div>
      <div class="xl-ws-case">${this.esc(sc.business_case)}</div>
      <div style="font-size:10px;color:var(--t3);margin-bottom:10px">Funciones clave: ${funcHint}</div>
      <div class="xl-table-wrap">${tableHTML}</div>
      <div class="xl-formula-section">
        <div class="xl-formula-label">📐 Escribe tu fórmula de Excel para las celdas amarillas:</div>
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
        <div class="xl-sol-label">✅ Solución Completa</div>
        <div class="xl-sol-formula">${this.esc(sc.target_formula)}</div>
        <div class="xl-sol-explain">${this.formatExplanation(sc.explanation)}</div>
      </div>`;
  },

  // ── Populate Target Cells with expected_results ─
  populateCells(id){
    const sc = this.findScenario(id);
    if(!sc || !sc.expected_results) return;

    const table = document.getElementById('xlTable-'+id);
    if(!table) return;

    const targets = table.querySelectorAll('td[data-target-idx]');
    targets.forEach((td, i) => {
      const val = sc.expected_results[i] || '';
      // Stagger animation for "calculating" effect
      setTimeout(() => {
        td.textContent = val;
        td.classList.remove('xl-target');
        td.classList.add('xl-cell-solved');
      }, i * 120);
    });
  },

  // ── Verify Formula ──────────────────────────────
  verify(id){
    const sc = this.findScenario(id);
    if(!sc) return;

    const input = document.getElementById('xlFormula-'+id);
    if(!input) return;
    const userFormula = input.value.trim().toUpperCase();

    if(!userFormula){
      this.toast('Escribe una fórmula primero.', 'err');
      return;
    }

    this.attempts++;

    // Check key functions
    const matched = [];
    const missed = [];
    sc.key_functions.forEach(fn => {
      const regex = new RegExp(fn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      if(regex.test(userFormula)) matched.push(fn);
      else missed.push(fn);
    });

    const allMatch = missed.length === 0;

    if(allMatch){
      // ✅ CORRECT — animate cells
      this.correct++;
      this.solved.add(id);
      input.style.borderColor = 'var(--gn)';
      input.style.boxShadow = '0 0 0 2px rgba(34,197,94,.2)';

      this.toast('✅ ¡Correcto! La fórmula contiene todas las funciones requeridas.', 'ok');
      this.populateCells(id);

    } else if(matched.length > 0){
      // ⚠️ PARTIAL — show specific hints for missing functions
      const hintMsgs = missed.map(fn => {
        if(sc.hints && sc.hints[fn]) return sc.hints[fn];
        return `Te falta usar la función ${fn}.`;
      });
      this.toast(`⚠️ Parcial (${matched.length}/${sc.key_functions.length}): ${hintMsgs[0]}`, 'warn');
      input.style.borderColor = 'var(--am)';
      input.style.boxShadow = '0 0 0 2px rgba(234,179,8,.15)';

    } else {
      // ❌ WRONG — show hint for first missing function
      const firstHint = (sc.hints && sc.hints[missed[0]])
        ? sc.hints[missed[0]]
        : `Te falta usar la función ${missed[0]} en tu fórmula.`;
      this.toast(`❌ ${firstHint}`, 'err');
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

    // When revealing solution, also populate cells so user sees what it does
    if(showing){
      this.populateCells(id);
    }
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
    setTimeout(() => t.remove(), 4000);
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

  // ── Format Explanation — Step-by-step blocks ────
  formatExplanation(text){
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.+?)`/g, '<code style="background:var(--el);padding:1px 5px;border-radius:3px;font-size:11px;color:var(--am)">$1</code>')
      .replace(/→/g, '<span style="color:var(--gn)">→</span>')
      .replace(/\n\n/g, '</div><div class="xl-sol-step">')
      .replace(/^/, '<div class="xl-sol-step">')
      + '</div>';
  },

  esc(text){
    return (text||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
};

ExcelDojo.init();
