/* ═══════════════════════════════════════════════════════
   DA-2026 · CORE ENGINE v3.1
   mikel696.github.io/da-2026
   ─────────────────────────────────────────────────────
   SOLUCIONA: Bug de rutas rotas — todos los links usan
   BASE_URL en lugar de rutas relativas.
═══════════════════════════════════════════════════════ */

// ┌─────────────────────────────────────────────────────┐
// │  BASE URL — RAÍZ DEL SITIO                         │
// │  Este es el único lugar donde se define la ruta    │
// └─────────────────────────────────────────────────────┘
const BASE_URL = 'https://mikel696.github.io/da-2026';
const url = (path) => BASE_URL + '/' + path.replace(/^\//, '');

// ┌─────────────────────────────────────────────────────┐
// │  STORAGE ENGINE                                     │
// └─────────────────────────────────────────────────────┘
const DB = {
  NS: 'da2026_',
  get(key, def = null) {
    try { const v = localStorage.getItem(this.NS + key); return v !== null ? JSON.parse(v) : def; }
    catch { return def; }
  },
  set(key, val) { try { localStorage.setItem(this.NS + key, JSON.stringify(val)); } catch {} },
  del(key) { try { localStorage.removeItem(this.NS + key); } catch {} },
  clear() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(this.NS));
    keys.forEach(k => localStorage.removeItem(k));
  }
};

// ┌─────────────────────────────────────────────────────┐
// │  PROFILE                                            │
// └─────────────────────────────────────────────────────┘
const Profile = {
  get:     ()      => DB.get('profile', null),
  set:     (data)  => DB.set('profile', data),
  exists:  ()      => DB.get('profile') !== null,
  update:  (patch) => DB.set('profile', { ...Profile.get(), ...patch })
};

// ┌─────────────────────────────────────────────────────┐
// │  PROGRESS ENGINE                                    │
// └─────────────────────────────────────────────────────┘
const Progress = {
  get:         ()       => DB.get('tasks', {}),
  isChecked:   (id)     => Progress.get()[id] === true,
  check(id, v) {
    const t = Progress.get(); t[id] = v; DB.set('tasks', t);
    XP.award(v ? 5 : -5);
    Streak.update();
    renderGlobalProgress();
  },
  phasePct(ids) {
    const t = Progress.get();
    return ids.length ? Math.round(ids.filter(id => t[id]).length / ids.length * 100) : 0;
  },
  totalPct() {
    const all = Object.values(CURRICULUM).flatMap(p => p.tasks.map(t => t.id));
    return all.length ? Math.round(all.filter(id => Progress.get()[id]).length / all.length * 100) : 0;
  },
  totalDone() {
    return Object.values(CURRICULUM).flatMap(p => p.tasks.map(t => t.id))
      .filter(id => Progress.get()[id]).length;
  }
};

// ┌─────────────────────────────────────────────────────┐
// │  XP SYSTEM                                          │
// └─────────────────────────────────────────────────────┘
const LEVELS = ['Iniciando','Explorador','Aprendiz','Analista Jr','Analista','Analista Sr','Expert','Master DA'];
const XP = {
  get:   ()    => DB.get('xp', { total: 0, level: 0 }),
  award(pts) {
    const x = this.get();
    x.total = Math.max(0, x.total + pts);
    x.level = Math.min(Math.floor(x.total / 100), LEVELS.length - 1);
    DB.set('xp', x);
    this.render();
  },
  render() {
    const x = this.get();
    const pct = x.total % 100;
    setEl('xp-fill',    el => el.style.width = pct + '%');
    setEl('xp-display', el => el.textContent = `${pct} / 100 XP`);
    setEl('user-level-display', el => el.textContent = `Nivel ${x.level} · ${LEVELS[x.level]}`);
  }
};

// ┌─────────────────────────────────────────────────────┐
// │  STREAK                                             │
// └─────────────────────────────────────────────────────┘
const Streak = {
  get: () => DB.get('streak', { count: 0, last: null }),
  update() {
    const s = this.get(), today = new Date().toDateString();
    if (s.last === today) return;
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    s.count = s.last === yesterday ? s.count + 1 : 1;
    s.last  = today;
    DB.set('streak', s);
    this.render();
  },
  render() {
    const c = this.get().count;
    setEl('streak-count', el => el.textContent = c + ' días');
    setEl('streak-stat',  el => el.textContent = c);
  }
};

// ┌─────────────────────────────────────────────────────┐
// │  SESSIONS                                           │
// └─────────────────────────────────────────────────────┘
const Sessions = {
  get:       ()      => DB.get('sessions', []),
  totalMins: ()      => Sessions.get().reduce((a, s) => a + s.mins, 0),
  add(mins) {
    const ss = this.get(); ss.push({ date: new Date().toISOString(), mins });
    DB.set('sessions', ss); this.renderHours();
  },
  renderHours() {
    const h = (this.totalMins() / 60).toFixed(1);
    setEl('hours-studied', el => el.textContent = h + 'h');
  }
};

// ┌─────────────────────────────────────────────────────┐
// │  NOTES                                              │
// └─────────────────────────────────────────────────────┘
const Notes = {
  get:  ()          => DB.get('notes', []),
  add(text, tag)   { const ns = this.get(); ns.unshift({ id: Date.now(), text, tag, date: new Date().toISOString() }); DB.set('notes', ns.slice(0, 200)); },
  del: (id)         => DB.set('notes', Notes.get().filter(n => n.id !== id))
};

// ┌─────────────────────────────────────────────────────┐
// │  HELPERS                                            │
// └─────────────────────────────────────────────────────┘
function setEl(id, fn) { const el = document.getElementById(id); if (el) fn(el); }

function toast(msg, dur = 2800) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg; t.classList.add('on');
  setTimeout(() => t.classList.remove('on'), dur);
}

function cp(id, btn) {
  const el = document.getElementById(id);
  if (!el) return;
  const text = [...el.childNodes]
    .filter(n => !(n.nodeType === 1 && (n.tagName === 'BUTTON' || n.classList?.contains('cp-btn'))))
    .map(n => n.textContent).join('').trim();
  const done = () => {
    if (btn) { const o = btn.textContent; btn.textContent = '✓ Copiado'; setTimeout(() => btn.textContent = o, 2000); }
    toast('✓ Copiado al portapapeles');
  };
  navigator.clipboard ? navigator.clipboard.writeText(text).then(done).catch(done) : done();
}

function timeAgo(ms) {
  const d = Math.floor((Date.now() - ms) / 86400000);
  if (d === 0) return 'hoy'; if (d === 1) return 'ayer';
  if (d < 7) return `${d}d`; if (d < 30) return `${Math.floor(d/7)}sem`;
  return `${Math.floor(d/30)}mes`;
}

function renderGlobalProgress() {
  const pct = Progress.totalPct();
  setEl('gp-fill', el => el.style.width = pct + '%');
  setEl('gp-pct',  el => el.textContent = pct + '%');
}

function renderProfile() {
  const p = Profile.get(); if (!p) return;
  setEl('user-name-display', el => el.textContent  = p.name || 'Analista');
  setEl('user-avatar',       el => el.textContent  = (p.name || 'A')[0].toUpperCase());
}

function renderGreeting() {
  const h = new Date().getHours();
  const g = h < 12 ? 'Buenos días' : h < 18 ? 'Buenas tardes' : 'Buenas noches';
  const p = Profile.get();
  const name = p?.name ? ', ' + p.name : '';
  const date = new Date().toLocaleDateString('es-CO', { weekday:'long', day:'numeric', month:'long' });
  setEl('greeting', el => el.textContent = `${g}${name} — ${date}`);
}

// ┌─────────────────────────────────────────────────────┐
// │  SIDEBAR HTML (generado dinámicamente)             │
// └─────────────────────────────────────────────────────┘
function injectSidebar() {
  const sb = document.getElementById('sb'); if (!sb) return;
  sb.innerHTML = `
  <div class="sb-top">
    <div class="sb-logo"><span class="logo-dot"></span>DA·2026</div>
    <div class="sb-user">
      <div class="avatar" id="user-avatar">?</div>
      <div>
        <div class="user-name" id="user-name-display">Analista</div>
        <div class="user-level" id="user-level-display">Nivel 0 · Iniciando</div>
      </div>
    </div>
    <div style="padding:0 0 4px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
        <span style="font-size:.64rem;color:var(--txt3);font-family:var(--fm);">XP</span>
        <span style="font-size:.64rem;color:var(--acid);font-family:var(--fm);" id="xp-display">0 / 100</span>
      </div>
      <div class="xp-track"><div class="xp-fill" id="xp-fill" style="width:0%"></div></div>
    </div>
  </div>
  <div class="sb-nav">
    <a href="${url('')}"                     class="nav-link"><span>🏠</span>Dashboard</a>
    <a href="${url('pages/ruta.html')}"      class="nav-link"><span>🗺️</span>Ruta 6 Meses</a>
    <a href="${url('pages/sesion.html')}"    class="nav-link"><span>⏱️</span>Sesión de Estudio</a>
    <a href="${url('pages/recursos.html')}"  class="nav-link"><span>📦</span>Recursos Gratis</a>
    <a href="${url('pages/empleos.html')}"   class="nav-link"><span>💼</span>Empleos & Mercado</a>
    <a href="${url('pages/prompts.html')}"   class="nav-link"><span>🤖</span>Biblioteca de IA</a>
    <a href="${url('pages/ingles.html')}"    class="nav-link"><span>🇺🇸</span>Inglés Técnico</a>
    <a href="${url('pages/proyectos.html')}" class="nav-link"><span>🔬</span>Proyectos</a>
    <a href="${url('pages/tacticas.html')}"  class="nav-link"><span>⚡</span>Tácticas Ocultas</a>
    <a href="${url('pages/configurar.html')}"class="nav-link"><span>⚙️</span>Mi Perfil</a>
  </div>
  <div class="sb-bottom">
    <div class="streak-box">
      <span style="font-size:1.5rem;">🔥</span>
      <div>
        <div style="font-family:var(--fm);font-size:.67rem;color:var(--txt3);letter-spacing:1px;">RACHA</div>
        <div style="font-family:var(--fh);font-size:1rem;font-weight:800;color:var(--acid);" id="streak-count">0 días</div>
      </div>
    </div>
  </div>`;

  // Active link
  const cur = window.location.href;
  sb.querySelectorAll('.nav-link').forEach(a => {
    const isHome = a.href.endsWith('/da-2026/') || a.href.endsWith('/da-2026');
    const match  = isHome ? (cur.endsWith('/da-2026/') || cur.endsWith('/da-2026')) : cur.includes(a.getAttribute('href').split('/').pop());
    a.classList.toggle('active', match);
  });

  // Hamburger
  const ham = document.getElementById('ham');
  if (ham) {
    ham.addEventListener('click', () => sb.classList.toggle('open'));
    document.addEventListener('click', e => {
      if (!sb.contains(e.target) && !ham.contains(e.target)) sb.classList.remove('open');
    });
  }
}

// ┌─────────────────────────────────────────────────────┐
// │  TASKS INIT                                         │
// └─────────────────────────────────────────────────────┘
function initTasks() {
  document.querySelectorAll('.tc').forEach(cb => {
    if (Progress.isChecked(cb.id)) { cb.checked = true; cb.closest('.ti')?.classList.add('done'); }
    cb.addEventListener('change', () => {
      cb.closest('.ti')?.classList.toggle('done', cb.checked);
      Progress.check(cb.id, cb.checked);
      setEl('tasks-done', el => el.textContent = Progress.totalDone());
    });
    cb.closest('.ti')?.addEventListener('click', e => {
      if (e.target === cb || e.target.tagName === 'A') return;
      cb.checked = !cb.checked;
      cb.dispatchEvent(new Event('change'));
    });
  });
}

// ┌─────────────────────────────────────────────────────┐
// │  FAQ ACCORDION                                      │
// └─────────────────────────────────────────────────────┘
function initFAQ() {
  document.querySelectorAll('.faq-btn').forEach(b => {
    b.addEventListener('click', () => {
      const isOpen = b.classList.contains('open');
      document.querySelectorAll('.faq-btn').forEach(x => { x.classList.remove('open'); x.nextElementSibling?.classList.remove('vis'); });
      if (!isOpen) { b.classList.add('open'); b.nextElementSibling?.classList.add('vis'); }
    });
  });
}

// ┌─────────────────────────────────────────────────────┐
// │  LIVE JOBS — RemoteOK API pública                  │
// └─────────────────────────────────────────────────────┘
async function loadLiveJobs(containerEl, limit = 6) {
  if (!containerEl) return;
  containerEl.innerHTML = `<div style="display:flex;gap:8px;align-items:center;padding:8px 0;font-family:var(--fm);font-size:.72rem;color:var(--txt3);"><div class="spinner"></div>Buscando vacantes remotas en vivo...</div>`;

  const CACHE_KEY = 'jobs_v4', TTL = 3600000; // 1h cache
  const cached = DB.get(CACHE_KEY);
  if (cached && (Date.now() - cached.ts) < TTL) { renderJobs(containerEl, cached.jobs, cached.src); return; }

  try {
    const res  = await fetch('https://remoteok.com/api?tag=data', { headers:{ 'Accept':'application/json' } });
    const raw  = await res.json();
    const jobs = raw.slice(1).filter(j => j.position).slice(0, 10).map(j => ({
      title:   j.position,
      company: j.company   || 'Empresa Remota',
      tags:    (j.tags     || []).slice(0, 4),
      link:    j.url       || `https://remoteok.com/l/${j.id}`,
      date:    j.date      ? timeAgo(j.date * 1000) : 'reciente',
      salary:  j.salary_min ? `$${Math.round(j.salary_min/1000)}k–$${Math.round(j.salary_max/1000)}k/yr` : null
    }));
    DB.set(CACHE_KEY, { ts: Date.now(), jobs, src: 'RemoteOK · en vivo' });
    renderJobs(containerEl, jobs, 'RemoteOK · en vivo');
  } catch {
    renderJobs(containerEl, JOBS_CURATED, 'Curado · links verificados');
  }
}

function renderJobs(el, jobs, src) {
  if (!el) return;
  el.innerHTML = jobs.slice(0, 6).map(j => `
    <div class="job-item">
      <div class="ji-title"><a href="${j.link}" target="_blank" rel="noopener">${j.title}</a></div>
      <div class="ji-meta">
        <span class="ji-co">${j.company}</span>
        ${j.salary ? `<span class="ji-sal">${j.salary}</span>` : ''}
        ${(j.tags||[]).map(t=>`<span class="ji-tag">${t}</span>`).join('')}
        <span class="ji-date">${j.date}</span>
      </div>
    </div>`).join('') +
    `<div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;flex-wrap:wrap;gap:8px;">
      <span style="font-family:var(--fm);font-size:.62rem;color:var(--txt3);">Fuente: ${src}</span>
      <a href="${url('pages/empleos.html')}" class="btn btn-ghost" style="font-size:.75rem;padding:7px 14px;">Ver todos →</a>
    </div>`;
}

// ┌─────────────────────────────────────────────────────┐
// │  LIVE NEWS — KDNuggets RSS via allorigins proxy     │
// └─────────────────────────────────────────────────────┘
async function loadLiveNews(containerEl) {
  if (!containerEl) return;
  containerEl.innerHTML = `<div style="display:flex;gap:8px;align-items:center;font-family:var(--fm);font-size:.72rem;color:var(--txt3);"><div class="spinner"></div>Cargando noticias de KDNuggets...</div>`;

  const CACHE_KEY = 'news_v4', TTL = 1800000; // 30min
  const cached = DB.get(CACHE_KEY);
  if (cached && (Date.now() - cached.ts) < TTL) { renderNews(containerEl, cached.items); return; }

  try {
    const rss = 'https://www.kdnuggets.com/feed/';
    const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(rss)}`);
    const data = await res.json();
    const doc  = new DOMParser().parseFromString(data.contents, 'text/xml');
    const items = [...doc.querySelectorAll('item')].slice(0, 8).map(it => ({
      title:  it.querySelector('title')?.textContent?.trim() || '',
      link:   it.querySelector('link')?.textContent?.trim()  || '#',
      date:   it.querySelector('pubDate')?.textContent?.slice(0,16) || '',
      src:    'KDNuggets'
    })).filter(i => i.title);
    DB.set(CACHE_KEY, { ts: Date.now(), items });
    renderNews(containerEl, items);
    setEl('news-ts', el => el.textContent = 'actualizado hace < 30 min');
  } catch {
    renderNews(containerEl, NEWS_CURATED);
    setEl('news-ts', el => el.textContent = 'contenido curado');
  }
}

function renderNews(el, items) {
  if (!el || !items.length) return;
  el.innerHTML = `<div class="news-grid">
    ${items.slice(0,6).map(n => `
      <div class="news-item">
        <div class="ni-title"><a href="${n.link}" target="_blank" rel="noopener">${n.title.slice(0,88)}${n.title.length>88?'…':''}</a></div>
        <div class="ni-meta"><span class="ni-src">${n.src}</span>${n.date}</div>
      </div>`).join('')}
  </div>`;
}

// ┌─────────────────────────────────────────────────────┐
// │  FALLBACK DATA — siempre disponible                 │
// └─────────────────────────────────────────────────────┘
const JOBS_CURATED = [
  { title:'Junior Data Analyst — SQL + Python · Remoto', company:'LinkedIn', tags:['SQL','Python'], link:'https://www.linkedin.com/jobs/search/?keywords=junior+data+analyst&f_WT=2&f_E=2', date:'hoy', salary:null },
  { title:'BI Analyst Jr. · Power BI + DAX · Remoto LATAM', company:'Indeed', tags:['Power BI','DAX'], link:'https://www.indeed.com/jobs?q=bi+analyst+junior&l=remote', date:'hoy', salary:null },
  { title:'Data Analyst · Python + Tableau · LATAM', company:'RemoteOK', tags:['Python','Tableau'], link:'https://remoteok.com/remote-data-analyst-jobs', date:'hoy', salary:'$800–1.8k' },
  { title:'Analytics Analyst · Looker + BigQuery', company:'WeWorkRemotely', tags:['SQL','Looker'], link:'https://weworkremotely.com/remote-jobs/search?term=data+analyst', date:'hoy', salary:null },
  { title:'Data Analyst Jr. · Google BigQuery + Sheets', company:'Glassdoor', tags:['BigQuery','SQL'], link:'https://www.glassdoor.com/Job/remote-data-analyst-jobs-SRCH_KO0,13.htm', date:'hoy', salary:null },
  { title:'Entry-Level Data Analyst · Remotive', company:'Remotive', tags:['SQL','Metabase'], link:'https://remotive.com/remote-jobs/data', date:'hoy', salary:'$700–1.4k' }
];

const NEWS_CURATED = [
  { title:'10 SQL Window Functions Every Data Analyst Must Know in 2026', link:'https://mode.com/sql-tutorial/sql-window-functions/', date:'2026', src:'Mode Analytics' },
  { title:'How to Build a Data Portfolio That Gets You Hired', link:'https://towardsdatascience.com', date:'2026', src:'TDS' },
  { title:'Python Pandas 2.2: Features That Changed My Workflow', link:'https://pandas.pydata.org/docs/whatsnew/', date:'2025', src:'Pandas Docs' },
  { title:'Power BI vs Tableau: Which Should You Learn First in 2026?', link:'https://www.kdnuggets.com', date:'2026', src:'KDNuggets' },
  { title:'The AI Skills Gap: What Data Analysts Need to Know About LLMs', link:'https://www.kdnuggets.com', date:'2026', src:'KDNuggets' },
  { title:'How to Pass SQL Technical Interviews at Top Companies', link:'https://leetcode.com/study-plan/sql/', date:'2026', src:'LeetCode' }
];

// ┌─────────────────────────────────────────────────────┐
// │  CURRICULUM — 6 fases × 5 tareas = 30 hitos        │
// └─────────────────────────────────────────────────────┘
const CURRICULUM = {
  f1:{ name:'Fase 1', label:'Fundamentos', tasks:[
    {id:'f1t1',text:'Solicitar Financial Aid Coursera — Curso 1 Google DA',detail:'Aplicar al curso individual, no a la especialización completa. Tarda 15 días en aprobarse.'},
    {id:'f1t2',text:'Dominar Excel / Google Sheets avanzado',detail:'Tablas dinámicas, VLOOKUP, INDEX/MATCH, TRIM, IFERROR, formatos condicionales.'},
    {id:'f1t3',text:'Ciclo PPAAÇA con dataset real de Kaggle',detail:'Aplicarlo al dataset Superstore. Documentar proceso en GitHub con README.'},
    {id:'f1t4',text:'Crear cuentas GitHub y Kaggle con primer commit',detail:'README de presentación en GitHub. Perfil completo en Kaggle con foto y bio.'},
    {id:'f1t5',text:'🏁 Hito: Análisis en Sheets con narrativa de negocio publicado',detail:'Documento público en GitHub con hallazgos cuantificados y recomendación.'}
  ]},
  f2:{ name:'Fase 2', label:'SQL', tasks:[
    {id:'f2t1',text:'SQL básico a intermedio — SQLZoo completo',detail:'SELECT, WHERE, GROUP BY, HAVING, todos los tipos de JOIN. Completar todas las secciones.'},
    {id:'f2t2',text:'CTEs y Window Functions (ROW_NUMBER, LAG, RANK)',detail:'Las 3 más pedidas en entrevistas técnicas 2026. Practicar en BigQuery Sandbox.'},
    {id:'f2t3',text:'Google BigQuery Sandbox — 10 queries con dataset público',detail:'1 TB gratis/mes. Conectar a dataset de Stack Overflow o GitHub Archive.'},
    {id:'f2t4',text:'Modelado relacional: 3 tablas, JOINs complejos, diagrama ER',detail:'Clientes + Pedidos + Productos. Diagrama ER exportado como imagen en README.'},
    {id:'f2t5',text:'🏁 Hito: 10 ejercicios HackerRank SQL Medium resueltos',detail:'Screenshots de cada solución subidos a GitHub con explicación de la lógica.'}
  ]},
  f3:{ name:'Fase 3', label:'Python', tasks:[
    {id:'f3t1',text:'freeCodeCamp Data Analysis with Python — completo',detail:'Certificado gratuito y verificable. Cubre NumPy, Pandas, Matplotlib, SciPy.'},
    {id:'f3t2',text:'NumPy y Pandas a fondo',detail:'groupby, merge, pivot_table, apply, value_counts, melt, explode.'},
    {id:'f3t3',text:'Visualización: Matplotlib + Seaborn — 5 tipos de gráficos',detail:'Histograma, scatter, heatmap de correlación, boxplot, bar chart con anotaciones.'},
    {id:'f3t4',text:'EDA completo en Google Colab — dataset real de Kaggle',detail:'Importar, limpiar, analizar, visualizar, documentar. Subir notebook a GitHub.'},
    {id:'f3t5',text:'🏁 Hito: Demographic Data Analyzer en freeCodeCamp aprobado',detail:'Proyecto con tests automáticos que validan el código. Certificado verificable.'}
  ]},
  f4:{ name:'Fase 4', label:'Power BI', tasks:[
    {id:'f4t1',text:'Solicitar beca IBM Data Analyst Certificate — Curso 1',detail:'Mismo proceso Financial Aid de Coursera. IBM certifica bien en el CV de LATAM.'},
    {id:'f4t2',text:'Modelo Estrella en Power BI + DAX básico',detail:'CALCULATE, SUMX, DIVIDE, DATEADD. Regla de oro: modelo primero, DAX después.'},
    {id:'f4t3',text:'Dashboard con máximo 5 visualizaciones y 4 KPIs',detail:'1 métrica por gráfico. Título descriptivo + unidades siempre visibles.'},
    {id:'f4t4',text:'Publicar dashboard en Tableau Public con URL pública',detail:'URL para LinkedIn, GitHub y CV. Capta atención de reclutadores técnicos.'},
    {id:'f4t5',text:'🏁 Hito: Dashboard publicado con narrativa ejecutiva',detail:'Resumen de 3 oraciones: situación → hallazgo → recomendación cuantificada.'}
  ]},
  f5:{ name:'Fase 5', label:'IA aplicada', tasks:[
    {id:'f5t1',text:'Método CCC para SQL con IA (Clarificar, Confirmar, Completar)',detail:'Dar esquema completo → validar lógica del query → completar con IA.'},
    {id:'f5t2',text:'Automatizar EDA repetitivo con prompts de producción',detail:'Claude/GPT-4o para generar código de limpieza desde descripción del dataset.'},
    {id:'f5t3',text:'Gemini en BigQuery — SQL desde lenguaje natural',detail:'Conectar cuenta Google, probar 5 queries en lenguaje natural.'},
    {id:'f5t4',text:'Documentación asistida: READMEs y resúmenes ejecutivos',detail:'Usar Biblioteca de Prompts → adaptar para cada proyecto del portafolio.'},
    {id:'f5t5',text:'🏁 Hito: Librería personal de 10+ prompts documentados en GitHub',detail:'Archivo prompts.md con categoría, uso, ejemplo de input y output real.'}
  ]},
  f6:{ name:'Fase 6', label:'Empleo', tasks:[
    {id:'f6t1',text:'Pulir 3 proyectos con README formato STAR en GitHub',detail:'Situación → Tarea → Acción → Resultado con métrica cuantificada.'},
    {id:'f6t2',text:'GitHub con actividad continua visible en heatmap',detail:'Commits diarios aunque sean solo README updates. El heatmap verde importa.'},
    {id:'f6t3',text:'LinkedIn optimizado para ATS con keywords exactos',detail:'Título: Rol | Stack técnico | Valor | Disponibilidad. Sección Habilidades completa.'},
    {id:'f6t4',text:'5 respuestas STAR preparadas con datos reales',detail:'Cada respuesta: contexto de negocio + herramienta usada + resultado en número.'},
    {id:'f6t5',text:'🏁 Hito: 10 aplicaciones enviadas + 1ª entrevista completada',detail:'La primera entrevista es práctica real. Documenta las preguntas para prepararte mejor.'}
  ]}
};

// ┌─────────────────────────────────────────────────────┐
// │  HACKS — 16 tácticas de empleabilidad reales       │
// └─────────────────────────────────────────────────────┘
const HACKS = [
  {cat:'Tutorial Hell',  text:'<strong>Regla de las 48h:</strong> Cada concepto nuevo, aplícalo a un dataset DIFERENTE al del tutorial antes de 48 horas. Sin esto el 80% del conocimiento se evapora. El output tiene que estar en GitHub.'},
  {cat:'SQL',            text:'<strong>CTEs sobre subqueries:</strong> Prefiere <code>WITH ... AS</code> sobre subqueries anidadas. Son más legibles, más fáciles de debuggear, y el optimizer de BigQuery / PostgreSQL las maneja igual de bien.'},
  {cat:'GitHub',         text:'<strong>Un commit diario, aunque sea 1 línea:</strong> Los reclutadores técnicos van directo al heatmap de actividad verde. Consistencia visible = compromiso demostrable sin decir una sola palabra.'},
  {cat:'LinkedIn',       text:'<strong>Comenta con insight, no con elogios:</strong> En posts de Senior Analysts, añade algo sustancial: "¿Han considerado el impacto de X en Y?" Apareces en notificaciones de quienes contratan.'},
  {cat:'Estrategia',     text:'<strong>Aplica al 60% del stack, no al 100%:</strong> El proceso de selección tarda 4–8 semanas. Si aplicas con SQL + Python básico (mes 3), cuando llegue la entrevista habrás completado el 40% restante.'},
  {cat:'Power BI',       text:'<strong>El modelo es el 70% del trabajo:</strong> Un modelo estrella mal construido hace el DAX 10× más complejo. Invierte el doble de tiempo en el modelo relacional — el resto se simplifica solo.'},
  {cat:'Python',         text:'<strong>Una línea de Pandas = 20 de Python puro:</strong> <code>df.groupby("región")["ventas"].agg(["sum","mean","count"])</code> reemplaza un loop de 20 líneas. Aprende las funciones de agregación primero.'},
  {cat:'Entrevistas',    text:'<strong>Escribe el plan antes de escribir código:</strong> En pruebas técnicas, pon tu lógica en comentarios primero. Los evaluadores quieren ver que piensas antes de ejecutar.'},
  {cat:'Kaggle',         text:'<strong>Llega a Contributor en una semana:</strong> Sube 1 notebook con EDA completo + comenta en 5 notebooks de otros. Contributor es el nivel donde apareces en búsquedas de la comunidad.'},
  {cat:'Mentalidad',     text:'<strong>Traduce técnica a dinero siempre:</strong> "Hice análisis de sentimiento" no dice nada. "Identifiqué las 3 categorías de quejas que generan el 80% del churn — $X en MRR en riesgo" dice todo.'},
  {cat:'SQL Avanzado',   text:'<strong>Window Functions > GROUP BY para análisis temporal:</strong> Para running totals, rankings y comparaciones período-a-período, <code>LAG()</code> y <code>SUM() OVER()</code> son 10× más eficientes.'},
  {cat:'Coursera',       text:'<strong>Financial Aid: aplica al curso 1, no a la especialización:</strong> Tiene cuotas. Al aprobarlo aplicas al 2 → flujo constante. La especialización completa nunca se aprueba de una vez.'},
  {cat:'Portafolio',     text:'<strong>Documenta el antes/después de la limpieza:</strong> % nulos antes → estrategia con justificación estadística → distribución después. Demuestra madurez analítica que el 90% de juniors no tiene.'},
  {cat:'Mercado LATAM',  text:'<strong>Fintech y E-commerce primero:</strong> Mayor demanda de juniors en LATAM 2026, mejor pago y datos más ricos para aprender. Con 1 año de experiencia puedes moverte a cualquier vertical.'},
  {cat:'Inglés',         text:'<strong>Lee la documentación oficial en inglés desde el día 1:</strong> Pandas, PostgreSQL, Power BI — toda en inglés. Leerla habitualmente mejora tu inglés técnico sin esfuerzo adicional.'},
  {cat:'IA',             text:'<strong>Siempre da esquema + contexto de negocio a la IA:</strong> "Dame SQL" = basura. "Tengo tablas X, Y, Z. El negocio quiere saber A. Motor: PostgreSQL 15" = código de producción listo para correr.'}
];

// ┌─────────────────────────────────────────────────────┐
// │  VOCAB — 20 palabras de inglés técnico             │
// └─────────────────────────────────────────────────────┘
const VOCAB = [
  {en:'Data Wrangling',  pron:'/ˈdeɪtə ˈræŋɡlɪŋ/', es:'Limpieza y transformación de datos', ex:'"The data wrangling process took 3 hours — the dataset had 40% nulls."'},
  {en:'Churn Rate',      pron:'/tʃɜːrn reɪt/',      es:'Tasa de abandono de clientes',       ex:'"Our monthly churn rate dropped from 8% to 5% after the new onboarding."'},
  {en:'Outlier',         pron:'/ˈaʊtˌlaɪər/',       es:'Valor atípico / dato anómalo',       ex:'"The outlier in revenue turned out to be a data entry error."'},
  {en:'Stakeholder',     pron:'/ˈsteɪkˌhoʊldər/',   es:'Parte interesada / tomador de decisiones', ex:'"I presented the findings to the stakeholders in the marketing team."'},
  {en:'Pipeline',        pron:'/ˈpaɪpˌlaɪn/',       es:'Flujo de procesamiento de datos',    ex:'"Our data pipeline runs every 6 hours and updates the dashboard."'},
  {en:'Cohort Analysis', pron:'/ˈkoʊhɔːrt əˈnæl/', es:'Análisis de grupos por período',     ex:'"The cohort analysis showed Q4 users had 30% higher 90-day retention."'},
  {en:'Granularity',     pron:'/ˌɡrænjʊˈlærɪti/',  es:'Nivel de detalle de los datos',      ex:'"We need daily granularity for this report, not weekly."'},
  {en:'Aggregation',     pron:'/ˌæɡrɪˈɡeɪʃən/',    es:'Agrupación y resumen estadístico',   ex:'"The aggregation by region showed the East coast drives 60% of revenue."'},
  {en:'ETL',             pron:'/ˌiː tiː ˈel/',      es:'Extraer, Transformar, Cargar datos', ex:'"I built an ETL process that cleans and loads 500K records nightly."'},
  {en:'KPI',             pron:'/ˌkeɪ piː ˈaɪ/',    es:'Indicador Clave de Rendimiento',     ex:'"The main KPI this quarter is reducing cart abandonment below 60%."'},
  {en:'Pivot Table',     pron:'/ˈpɪvət ˈteɪbl/',   es:'Tabla dinámica en Excel / Sheets',   ex:'"I used a pivot table to break down sales by region and category."'},
  {en:'Correlation',     pron:'/ˌkɒrəˈleɪʃən/',    es:'Relación estadística entre variables',ex:'"There is a strong correlation between marketing spend and new users."'},
  {en:'Ad Hoc',          pron:'/æd hɒk/',           es:'Análisis bajo demanda específica',   ex:'"The CEO requested an ad hoc analysis of last week\'s sales drop."'},
  {en:'Data Lineage',    pron:'/ˈdeɪtə ˈlɪniɪdʒ/', es:'Trazabilidad del origen de datos',   ex:'"Good data lineage shows exactly where each metric comes from."'},
  {en:'Imputation',      pron:'/ˌɪmpjʊˈteɪʃən/',   es:'Relleno estadístico de valores nulos', ex:'"I used KNN imputation to fill the missing property type values."'},
  {en:'Schema',          pron:'/ˈskiːmə/',          es:'Estructura de base de datos',        ex:'"Let me share the database schema before we write the SQL query."'},
  {en:'Insight',         pron:'/ˈɪnsaɪt/',          es:'Hallazgo valioso de negocio',        ex:'"The key insight: Friday orders have 2× more returns than other days."'},
  {en:'Benchmark',       pron:'/ˈbentʃˌmɑːrk/',    es:'Referencia de comparación',          ex:'"Our 22-day inventory turnover is above the industry benchmark of 18."'},
  {en:'Cardinality',     pron:'/ˌkɑːrdɪˈnælɪti/',  es:'Cantidad de valores únicos en columna', ex:'"The customer_id has high cardinality — over 1 million unique values."'},
  {en:'Data-Driven',     pron:'/ˈdeɪtə ˈdrɪvən/',  es:'Basado en datos, no en opinión',     ex:'"We made a data-driven decision to discontinue the product line."'}
];

// ┌─────────────────────────────────────────────────────┐
// │  PROMPTS — 8 prompts de producción                 │
// └─────────────────────────────────────────────────────┘
const PROMPTS_DATA = [
  {cat:'SQL', title:'SQL desde Pregunta de Negocio', use:'Convertir requerimiento a SQL auditado', text:`Actúa como Senior Data Analyst especializado en PostgreSQL.

Contexto: [empresa y área de negocio]
Esquema:
  - tabla1(col1 TIPO, col2 TIPO, ...)
  - tabla2(col1 TIPO, ...)

Pregunta de negocio: [en español natural]

Restricciones:
  - Motor: PostgreSQL 15
  - Ejecutarse en <2s con 500K filas
  - Preferir CTEs sobre subqueries anidadas

Entrega:
  1. SQL completo y limpio
  2. Explicación de cada cláusula en términos de negocio
  3. ¿Necesita índice para optimizar?
  4. 2 variaciones útiles del query`},
  {cat:'Python', title:'EDA Automatizado con Pandas', use:'Análisis exploratorio completo reproducible', text:`Actúa como Data Scientist experto en análisis exploratorio con Python.

DataFrame llamado df con columnas:
  [lista columnas: nombre (tipo), ej: customer_id (int), fecha (datetime), monto (float)]

Objetivo del análisis: [objetivo de negocio]

Genera script Python completo que incluya:
  1. Resumen estadístico con interpretación de negocio
  2. Detección y visualización de nulos (heatmap Seaborn)
  3. Distribuciones de variables numéricas (histograma + KDE)
  4. Detección de outliers con método IQR
  5. Matriz de correlación comentada
  6. 3 hipótesis no obvias para investigar

Requisitos: comentarios en español, compatible con Google Colab, celdas separadas.`},
  {cat:'Limpieza', title:'Estrategia para Dataset Sucio', use:'Enfrentar datos corruptos del mundo real', text:`Actúa como Data Engineer especializado en calidad de datos.

Dataset:
  - Fuente: [ej. exportación de CRM / API de ventas]
  - Filas: [número aproximado]
  - Problema principal: [ej. 70% nulos en columna precio]

Primeras 5 filas (pega aquí):
[datos]

Genera estrategia que:
  1. Diagnostique: perfil de nulos, tipos, duplicados exactos y fuzzy
  2. Decida por columna: eliminar / imputar estadísticamente / transformar
  3. Justifique estadísticamente cada decisión
  4. Valide que distribución post-limpieza sea correcta
  5. Genere registro de cambios documentado (data changelog)

Importante: NO elimines filas como primera opción.`},
  {cat:'Dashboard', title:'Narrativa Ejecutiva para Stakeholders', use:'Convertir hallazgos técnicos a lenguaje de negocio', text:`Actúa como BI Analyst con experiencia en comunicación ejecutiva.

Métricas del dashboard:
  - KPI 1: [nombre, valor actual, variación vs período anterior]
  - KPI 2: [nombre, valor]
  - KPI 3: [nombre, valor]
  - Anomalía detectada: [describe]

Audiencia: [ej. Director de Operaciones, perfil no técnico]

Genera:
  1. Titular de 1 línea (máx 15 palabras) con hallazgo principal
  2. Párrafo ejecutivo: situación → hallazgo → implicación de negocio
  3. 3 recomendaciones accionables (verbo + métrica de éxito)
  4. 1 pregunta para guiar la siguiente reunión

Tono: directo, sin jerga, 100% orientado a decisión.`},
  {cat:'Entrevistas', title:'Simulador de Entrevista Técnica', use:'Practicar antes del día real y detectar brechas', text:`Actúa como entrevistador técnico Senior en [empresa objetivo, ej. Rappi / Bancolombia / Globant].
Posición: Junior Data Analyst.

Mi stack actual:
  - SQL: [nivel: básico / intermedio / avanzado]
  - Python / Pandas: [nivel]
  - Power BI: [nivel]

Simula entrevista de 30 minutos con:
  1. 3 preguntas SQL con dificultad progresiva (básica → window functions)
  2. 2 preguntas Python / Pandas con mini dataset
  3. 1 caso de negocio: dame datos y pide diseño del análisis

Después de cada respuesta mía:
  ✓ Qué fue correcto
  ✗ Qué optimizaría
  ➤ Pregunta de seguimiento real
  Puntuación /10 con justificación

Sé exigente. No suavices el feedback.`},
  {cat:'README', title:'README Formato STAR para GitHub', use:'Documentar proyectos con impacto que reclutadores leen', text:`Actúa como Technical Writer especializado en portafolios de datos.

Proyecto:
  - Herramientas usadas: [ej. Python, Pandas, Power BI, SQL]
  - Dataset: [descripción]
  - Qué hice técnicamente: [resumen]
  - Resultado aproximado: [impacto en negocio]

Genera README.md completo:
  1. Situación: el problema de negocio real
  2. Tarea: mi objetivo específico y medible
  3. Acción: lo que hice (bullets técnicos detallados)
  4. Resultado: impacto cuantificado (dinero / tiempo / riesgo reducido)
  5. Stack técnico con badges de shields.io
  6. Instrucciones de instalación y uso
  7. Indicaciones de dónde insertar capturas de pantalla

Tono: profesional pero accesible.`},
  {cat:'Schema', title:'Diseño de Base de Datos desde Descripción', use:'Diseñar modelos relacionales desde cero', text:`Actúa como Database Architect con experiencia en PostgreSQL y modelado relacional.

Negocio: [describe qué hace la empresa y qué datos maneja]

Entrega:
  1. Tablas necesarias con columnas y tipos de datos correctos
  2. Relaciones FK y cardinalidades (1:N, N:M)
  3. SQL CREATE TABLE completo con constraints y NOT NULL
  4. Índices recomendados para las 5 queries más frecuentes
  5. Diagrama ER en formato Mermaid (para GitHub README)

Considera: normalización 3NF, PKs apropiadas, campos de auditoría (created_at, updated_at, is_deleted).`},
  {cat:'Inglés', title:'Hallazgo Técnico en Inglés Profesional', use:'Preparar bullets de CV y respuestas de entrevista en inglés', text:`Actúa como Business English editor especializado en comunicación de datos.

Mi hallazgo en español:
  [describe tu hallazgo o resultado de negocio]

Entrega:
  1. Traducción en inglés profesional (nivel B2-C1)
  2. 3 versiones para diferentes contextos:
     - CV / LinkedIn bullet (1 línea, verbo de impacto)
     - Respuesta de entrevista STAR (3-4 oraciones)
     - Email a stakeholder (párrafo ejecutivo)
  3. Vocabulario técnico de datos clave utilizado
  4. Pronunciación de los 5 términos más difíciles

Usa terminología que los reclutadores anglosajones reconocen.`}
];

// ┌─────────────────────────────────────────────────────┐
// │  GLOBAL DOMContentLoaded INIT                       │
// └─────────────────────────────────────────────────────┘
document.addEventListener('DOMContentLoaded', () => {
  injectSidebar();
  initFAQ();
  initTasks();
  renderGlobalProgress();
  renderGreeting();
  renderProfile();
  XP.render();
  Streak.render();
  Sessions.renderHours();
  setEl('days-active',  el => el.textContent = (() => {
    const p = Profile.get();
    if (!p?.startDate) return 0;
    return Math.max(1, Math.floor((Date.now() - new Date(p.startDate)) / 86400000) + 1);
  })());
  setEl('tasks-done', el => el.textContent = Progress.totalDone());
});
