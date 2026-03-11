/* ═══════════════════════════════════════
   DASHBOARD.JS — Lógica del índice
═══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

  // ── ONBOARDING ──────────────────────────
  const ob = document.getElementById('onboarding');
  const dm = document.getElementById('dashboard-main');
  if (!Profile.exists()) {
    if (ob) ob.style.display = 'block';
    if (dm) dm.style.display = 'none';
  } else {
    if (ob) ob.style.display = 'none';
    if (dm) dm.style.display = 'block';
    renderDashboard();
  }

  // TODAY DATE
  const td = document.getElementById('today-date');
  if (td) td.textContent = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short' });
});

window.saveOnboarding = function() {
  const name = document.getElementById('ob-name')?.value?.trim();
  if (!name) { toast('⚠️ Ingresa tu nombre'); return; }
  Profile.set({
    name,
    level: +document.getElementById('ob-level').value,
    hours: +document.getElementById('ob-hours').value,
    industry: document.getElementById('ob-industry').value,
    startDate: new Date().toISOString()
  });
  document.getElementById('onboarding').style.display = 'none';
  document.getElementById('dashboard-main').style.display = 'block';
  renderProfile();
  renderDashboard();
  toast('🎉 ¡Bienvenido al Sistema DA-2026, ' + name + '!');
};

function renderDashboard() {
  renderPhasesProgress();
  renderHackOfDay();
  renderWordOfDay();
  renderPromptOfDay();
  renderTodayTask();
}

// ── PHASES PROGRESS ─────────────────────────
function renderPhasesProgress() {
  const el = document.getElementById('phases-progress');
  if (!el) return;
  el.innerHTML = Object.entries(CURRICULUM).map(([key, phase]) => {
    const ids = phase.tasks.map(t => t.id);
    const pct = Progress.phasePct(ids);
    return `<div class="phase-row">
      <span class="ph-name">${phase.name}</span>
      <div class="ph-track"><div class="ph-fill" style="width:${pct}%"></div></div>
      <span class="ph-pct">${pct}%</span>
    </div>`;
  }).join('');
}

// ── HACK DEL DÍA ────────────────────────────
let hackIdx = (() => {
  const saved = DB.get('hack_idx', null);
  const today = new Date().toDateString();
  if (saved && saved.date === today) return saved.idx;
  const idx = Math.floor(Math.random() * HACKS.length);
  DB.set('hack_idx', { date: today, idx });
  return idx;
})();

function renderHackOfDay() {
  const h = HACKS[hackIdx];
  const el = document.getElementById('hack-content');
  const cat = document.getElementById('hack-cat');
  if (el) el.innerHTML = h.text;
  if (cat) cat.textContent = h.cat;
}

window.nextHack = function() {
  hackIdx = (hackIdx + 1) % HACKS.length;
  DB.set('hack_idx', { date: new Date().toDateString(), idx: hackIdx });
  renderHackOfDay();
};

// ── WORD OF DAY ──────────────────────────────
function renderWordOfDay() {
  const el = document.getElementById('word-of-day');
  if (!el) return;
  const today = new Date().toDateString();
  const saved = DB.get('word_idx', null);
  let idx;
  if (saved && saved.date === today) { idx = saved.idx; }
  else { idx = Math.floor(Math.random() * VOCAB.length); DB.set('word_idx', { date: today, idx }); }
  const w = VOCAB[idx];
  el.innerHTML = `<div class="word-card">
    <div class="word-en">${w.en}</div>
    <div class="word-pron">${w.pron}</div>
    <div class="word-es">→ ${w.es}</div>
    <div class="word-example">${w.ex}</div>
  </div>`;
}

// ── PROMPT DEL DÍA ───────────────────────────
function renderPromptOfDay() {
  const el = document.getElementById('prompt-of-day');
  if (!el) return;
  const today = new Date().toDateString();
  const saved = DB.get('prompt_idx', null);
  let idx;
  if (saved && saved.date === today) { idx = saved.idx; }
  else { idx = Math.floor(Math.random() * PROMPTS_DATA.length); DB.set('prompt_idx', { date: today, idx }); }
  const p = PROMPTS_DATA[idx];
  el.innerHTML = `<div class="pod-category">${p.cat} · ${p.use}</div>
    <div class="pod-wrap" id="pod-text">${p.text}<button class="cp" onclick="cp('pod-text',this)">Copiar</button></div>`;
}

// ── TODAY TASK ───────────────────────────────
function renderTodayTask() {
  const phaseEl = document.getElementById('today-phase');
  const taskEl = document.getElementById('today-task');
  if (!phaseEl || !taskEl) return;
  for (const [, phase] of Object.entries(CURRICULUM)) {
    const nextTask = phase.tasks.find(t => !Progress.isChecked(t.id));
    if (nextTask) {
      phaseEl.textContent = `${phase.name}: ${phase.label}`;
      taskEl.textContent = nextTask.text;
      return;
    }
  }
  phaseEl.textContent = '🎉 ¡RUTA COMPLETADA!';
  taskEl.textContent = 'Estás listo para el mercado laboral. Sigue aplicando empleos.';
}
