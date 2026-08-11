/* ═══════════════════════════════════════════════════════════════
   DA-2026 · Finance Module — Logic & Rendering
   ─────────────────────────────────────────────────────────────
   Data flow:
     FIN.add(tx) → localStorage.setItem('fin_2026-04', ...) →
       proxy intercepts → CLOUD.pushState() (auto, debounced)
   Depends on: cloud-sync.js (localStorage proxy already active)
═══════════════════════════════════════════════════════════════ */


/* ══════════════════════════════════════════════════════════════
   SECTION 1 — Constants & Config
══════════════════════════════════════════════════════════════ */

const CAT_ICONS = {
  salary:'💰', freelance:'💻', other_inc:'📦',
  food:'🍔', transport:'🚌', housing:'🏠', services:'📱',
  education:'📚', health:'🏥', entertainment:'🎮',
  clothing:'👕', savings:'🏦', other_exp:'📎'
};

const CAT_NAMES = {
  salary:'Salario', freelance:'Freelance', other_inc:'Otro Ingreso',
  food:'Comida', transport:'Transporte', housing:'Vivienda/Arriendo',
  services:'Servicios', education:'Educación', health:'Salud',
  entertainment:'Entretenimiento', clothing:'Ropa', savings:'Ahorro',
  other_exp:'Otro Gasto'
};

const INC_CATS = ['salary', 'freelance', 'other_inc'];

const MONTH_NAMES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];


/* ══════════════════════════════════════════════════════════════
   SECTION 2 — FIN Data Layer (pure storage, no DOM)
══════════════════════════════════════════════════════════════ */

const FIN = {
  _month: new Date().toISOString().slice(0, 7),

  key()     { return 'fin_' + FIN._month; },
  getAll()  { try { return JSON.parse(localStorage.getItem(FIN.key()) || '[]'); } catch { return []; } },
  save(txs) { localStorage.setItem(FIN.key(), JSON.stringify(txs)); },

  add(tx) {
    const all = FIN.getAll();
    all.push({ id: crypto.randomUUID(), ...tx, date: new Date().toISOString() });
    FIN.save(all);
    return all;
  },

  del(id) {
    const all = FIN.getAll().filter(t => t.id !== id);
    FIN.save(all);
    return all;
  },

  setMonth(m) { FIN._month = m; },
  getMonth()  { return FIN._month; },

  // Savings goal
  getGoal()  { try { return JSON.parse(localStorage.getItem('fin_sav_goal') || 'null'); } catch { return null; } },
  setGoal(g) { localStorage.setItem('fin_sav_goal', JSON.stringify(g)); }
};


/* ══════════════════════════════════════════════════════════════
   SECTION 3 — Pure Computation (no DOM, no side effects)
══════════════════════════════════════════════════════════════ */

function calcMetrics(txs) {
  let inc = 0, exp = 0, sav = 0;
  for (const t of txs) {
    if (t.type === 'inc') inc += t.amt;
    else exp += t.amt;
    if (t.cat === 'savings') sav += t.amt;
  }
  return { inc, exp, bal: inc - exp, sav };
}

function calcCategoryBreakdown(txs, type) {
  const filtered = txs.filter(t => t.type === type);
  const totals = {};
  for (const t of filtered) totals[t.cat] = (totals[t.cat] || 0) + t.amt;
  return Object.entries(totals).sort((a, b) => b[1] - a[1]);
}

function calcDailyData(txs) {
  const days = {};
  for (const t of txs) {
    const d = new Date(t.date).getDate();
    if (!days[d]) days[d] = { inc: 0, exp: 0 };
    if (t.type === 'inc') days[d].inc += t.amt;
    else days[d].exp += t.amt;
  }
  return days;
}


/* ══════════════════════════════════════════════════════════════
   SECTION 4 — Rendering (reads FIN, writes to DOM)
══════════════════════════════════════════════════════════════ */

function renderAll() {
  const txs = FIN.getAll();
  const m = calcMetrics(txs);
  renderKPIs(m);
  renderRecent(txs);
  renderHistory(txs);
  renderCategories(txs);
  renderChart(txs);
  renderSavings(m.sav);
  renderMonthNav();
}

/* ── KPIs ── */
function renderKPIs(m) {
  document.getElementById('kInc').textContent = '$' + m.inc.toLocaleString();
  document.getElementById('kExp').textContent = '$' + m.exp.toLocaleString();
  const kBal = document.getElementById('kBal');
  kBal.textContent = '$' + m.bal.toLocaleString();
  kBal.style.color = m.bal >= 0 ? 'var(--gn)' : 'var(--rd)';
  document.getElementById('kSav').textContent = '$' + m.sav.toLocaleString();
}

/* ── Recent transactions (last 8) ── */
function renderRecent(txs) {
  const el = document.getElementById('recentTx');
  const recent = txs.slice().reverse().slice(0, 8);
  el.innerHTML = recent.length ? recent.map(t => _txRow(t)).join('')
    : '<div style="text-align:center;padding:20px;color:var(--t3)">Sin movimientos este mes.</div>';
}

/* ── Full history ── */
function renderHistory(txs) {
  const el = document.getElementById('allTx');
  const all = txs.slice().reverse();
  el.innerHTML = all.length ? all.map(t => _txRow(t)).join('')
    : '<div style="text-align:center;padding:20px;color:var(--t3)">Sin movimientos.</div>';
}

/* ── Shared transaction row builder ── */
function _txRow(t) {
  const isInc = t.type === 'inc';
  const dateStr = new Date(t.date).toLocaleDateString('es', { day: 'numeric', month: 'short' });
  return '<div class="tx-row">' +
    '<div class="tx-icon">' + (CAT_ICONS[t.cat] || '📎') + '</div>' +
    '<div class="tx-info">' +
      '<div class="tx-desc">' + _esc(t.desc) + '</div>' +
      '<div class="tx-cat">' + (CAT_NAMES[t.cat] || t.cat) + '</div>' +
    '</div>' +
    '<div class="tx-amt" style="color:' + (isInc ? 'var(--gn)' : 'var(--rd)') + '">' +
      (isInc ? '+' : '-') + '$' + t.amt.toLocaleString() +
    '</div>' +
    '<div class="tx-date">' + dateStr + '</div>' +
    '<button class="tx-del" data-del="' + t.id + '">✕</button>' +
  '</div>';
}

/* ── Category breakdown ── */
let _catType = 'exp';

function renderCategories(txs) {
  const breakdown = calcCategoryBreakdown(txs, _catType);
  const total = breakdown.reduce((s, [, v]) => s + v, 0);
  const max = breakdown.length ? breakdown[0][1] : 1;
  const el = document.getElementById('catBreak');

  if (!breakdown.length) {
    el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--t3)">Sin ' +
      (_catType === 'exp' ? 'gastos' : 'ingresos') + ' este mes.</div>';
    return;
  }

  el.innerHTML = breakdown.map(([cat, amt]) => {
    const pct = total > 0 ? Math.round(amt / total * 100) : 0;
    const color = _catType === 'exp' ? 'var(--rd)' : 'var(--gn)';
    return '<div class="cat-row">' +
      '<div class="cat-icon">' + (CAT_ICONS[cat] || '📎') + '</div>' +
      '<div class="cat-name">' + (CAT_NAMES[cat] || cat) + '</div>' +
      '<div class="cat-amt" style="color:' + color + '">$' + amt.toLocaleString() + '</div>' +
      '<div class="cat-pct">' + pct + '%</div></div>' +
      '<div class="bar"><div class="bar-f" style="width:' + Math.round(amt / max * 100) + '%;background:' + color + '"></div></div>';
  }).join('');
}

/* ── Daily bar chart (pure DOM) ── */
function renderChart(txs) {
  const dayData = calcDailyData(txs);
  const [y, mon] = FIN.getMonth().split('-').map(Number);
  const daysInMonth = new Date(y, mon, 0).getDate();

  let maxDay = 1;
  for (let d = 1; d <= daysInMonth; d++) {
    const dd = dayData[d] || { inc: 0, exp: 0 };
    maxDay = Math.max(maxDay, dd.inc, dd.exp);
  }

  const el = document.getElementById('dayChart');
  el.innerHTML = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    const dd = dayData[d] || { inc: 0, exp: 0 };
    const hI = dd.inc ? Math.max(4, Math.round(dd.inc / maxDay * 120)) : 0;
    const hE = dd.exp ? Math.max(4, Math.round(dd.exp / maxDay * 120)) : 0;
    return '<div class="chart-bar">' +
      '<div class="chart-fill" style="height:' + hI + 'px;background:var(--gn)"></div>' +
      '<div class="chart-fill" style="height:' + hE + 'px;background:var(--rd)"></div>' +
      '<div class="chart-lbl">' + d + '</div></div>';
  }).join('');
}

/* ── Savings goal ── */
function renderSavings(currentSav) {
  const data = FIN.getGoal();
  const el = document.getElementById('savInfo');
  if (!data) {
    el.innerHTML = '<div style="color:var(--t3);font-size:12px">Define tu meta arriba.</div>';
    return;
  }
  const pct = Math.min(100, Math.round(currentSav / data.goal * 100));
  const color = pct >= 100 ? 'var(--gn)' : pct >= 50 ? 'var(--am)' : 'var(--ac)';
  el.innerHTML =
    '<div style="font-size:14px;font-weight:600;margin-bottom:6px">' + _esc(data.name) + '</div>' +
    '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">' +
      '<span>$' + currentSav.toLocaleString() + ' / $' + data.goal.toLocaleString() + '</span>' +
      '<span style="color:' + color + ';font-weight:600">' + pct + '%</span>' +
    '</div>' +
    '<div class="bar"><div class="bar-f" style="width:' + pct + '%;background:' + color + '"></div></div>' +
    (pct >= 100
      ? '<div style="text-align:center;padding:12px;color:var(--gn);font-size:14px;font-weight:700;margin-top:8px">🎉 ¡Meta cumplida!</div>'
      : '<div style="font-size:11px;color:var(--t3);margin-top:6px">Faltan $' + (data.goal - currentSav).toLocaleString() + '</div>');
}

/* ── Month navigation ── */
function renderMonthNav() {
  const [y, m] = FIN.getMonth().split('-').map(Number);
  document.getElementById('mnLabel').textContent = MONTH_NAMES[m - 1] + ' ' + y;

  const now = new Date().toISOString().slice(0, 7);
  document.getElementById('mnNext').disabled = (FIN.getMonth() >= now);
}

/* ── HTML escape helper ── */
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

/* ── Add transaction ── */
document.getElementById('btnAdd').addEventListener('click', () => {
  const amt = parseFloat(document.getElementById('fAmt').value);
  const desc = document.getElementById('fDesc').value.trim();
  const cat = document.getElementById('fCat').value;
  const type = document.getElementById('fType').value;

  if (!amt || amt <= 0 || !desc) return alert('Completa monto y descripción');

  FIN.add({ amt, desc, cat, type });
  document.getElementById('fAmt').value = '';
  document.getElementById('fDesc').value = '';
  renderAll();
});

/* ── Auto-select type based on category ── */
document.getElementById('fCat').addEventListener('change', function() {
  document.getElementById('fType').value = INC_CATS.includes(this.value) ? 'inc' : 'exp';
});

/* ── Quick expense toggle ── */
document.getElementById('btnQuick').addEventListener('click', () => {
  const form = document.getElementById('quickForm');
  form.style.display = form.style.display === 'none' ? 'flex' : 'none';
  if (form.style.display === 'flex') document.getElementById('qDesc').focus();
});

document.getElementById('qSubmit').addEventListener('click', () => {
  const desc = document.getElementById('qDesc').value.trim();
  const amt = parseFloat(document.getElementById('qAmt').value);
  if (!desc || !amt || amt <= 0) return alert('Completa descripción y monto');

  FIN.add({ amt, desc, cat: 'other_exp', type: 'exp' });
  document.getElementById('qDesc').value = '';
  document.getElementById('qAmt').value = '';
  document.getElementById('quickForm').style.display = 'none';
  renderAll();
});

document.getElementById('qCancel').addEventListener('click', () => {
  document.getElementById('quickForm').style.display = 'none';
});

/* ── Enter key submits quick expense ── */
document.getElementById('qAmt').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('qSubmit').click();
});

/* ── Delete transaction (event delegation) ──
   Acotado a los contenedores de movimientos. Antes escuchaba `[data-del]`
   en TODO el documento: cualquier módulo que usara ese atributo en la misma
   página (el Radar lo hacía para borrar alertas) disparaba FIN.del() con un
   id ajeno y un renderAll(). No borraba nada — los ids son UUID y ninguno
   coincidía — pero sí escribía en localStorage y empujaba a Supabase sin
   razón. Un listener global sobre un atributo genérico es una trampa para
   el módulo que llegue después. */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('#recentTx [data-del], #allTx [data-del]');
  if (!btn) return;
  FIN.del(btn.dataset.del);
  renderAll();
});

/* ── Month navigation ── */
document.getElementById('mnPrev').addEventListener('click', () => {
  const [y, m] = FIN.getMonth().split('-').map(Number);
  const prev = m === 1 ? (y - 1) + '-12' : y + '-' + String(m - 1).padStart(2, '0');
  FIN.setMonth(prev);
  renderAll();
});

document.getElementById('mnNext').addEventListener('click', () => {
  const [y, m] = FIN.getMonth().split('-').map(Number);
  const now = new Date().toISOString().slice(0, 7);
  const next = m === 12 ? (y + 1) + '-01' : y + '-' + String(m + 1).padStart(2, '0');
  if (next <= now) { FIN.setMonth(next); renderAll(); }
});

/* ── Category toggle (expenses / income) ── */
document.querySelectorAll('#catToggle .cat-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#catToggle .cat-btn').forEach(x => x.classList.remove('on'));
    btn.classList.add('on');
    _catType = btn.dataset.cat;
    renderCategories(FIN.getAll());
  });
});

/* ── Savings goal ── */
document.getElementById('btnSavGoal').addEventListener('click', () => {
  const goal = parseFloat(document.getElementById('savGoal').value);
  const name = document.getElementById('savName').value.trim();
  if (!goal || goal <= 0) return alert('Ingresa una meta válida');
  FIN.setGoal({ goal, name: name || 'Ahorro' });
  renderAll();
});

/* ── Cloud sync re-render ── */
window.addEventListener('cloud:sync_complete', () => renderAll());


/* ══════════════════════════════════════════════════════════════
   SECTION 6 — Initialization
══════════════════════════════════════════════════════════════ */

/* Backfill missing IDs on legacy transactions */
function migrateIds() {
  const txs = FIN.getAll();
  let changed = false;
  for (const t of txs) {
    if (!t.id) { t.id = crypto.randomUUID(); changed = true; }
  }
  if (changed) FIN.save(txs);
}

migrateIds();
renderAll();
