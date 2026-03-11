/* ═══════════════════════════════════════════
   DA-2026 CORE ENGINE
   Estado global, persistencia, datos
═══════════════════════════════════════════ */

// ── STORAGE ENGINE ─────────────────────────
const DB = {
  get: (key, def = null) => {
    try { const v = localStorage.getItem('da2026_' + key); return v ? JSON.parse(v) : def; } catch { return def; }
  },
  set: (key, val) => {
    try { localStorage.setItem('da2026_' + key, JSON.stringify(val)); } catch {}
  },
  merge: (key, obj) => {
    const cur = DB.get(key, {}); DB.set(key, { ...cur, ...obj });
  }
};

// ── USER PROFILE ────────────────────────────
const Profile = {
  get: () => DB.get('profile', null),
  set: (data) => DB.set('profile', data),
  exists: () => DB.get('profile') !== null,
  update: (data) => {
    const p = Profile.get() || {};
    DB.set('profile', { ...p, ...data });
  }
};

// ── PROGRESS ENGINE ─────────────────────────
const Progress = {
  KEY: 'tasks',
  get: () => DB.get('tasks', {}),
  check: (id, val) => {
    const t = Progress.get(); t[id] = val; DB.set('tasks', t);
    XP.award(val ? 5 : -5);
    Streak.update();
  },
  isChecked: (id) => Progress.get()[id] === true,
  phasePct: (phaseIds) => {
    const t = Progress.get();
    const done = phaseIds.filter(id => t[id]).length;
    return phaseIds.length ? Math.round(done / phaseIds.length * 100) : 0;
  },
  totalPct: () => {
    const all = Object.values(CURRICULUM).flatMap(p => p.tasks.map(t => t.id));
    const t = Progress.get();
    const done = all.filter(id => t[id]).length;
    return all.length ? Math.round(done / all.length * 100) : 0;
  },
  totalDone: () => {
    const all = Object.values(CURRICULUM).flatMap(p => p.tasks.map(t => t.id));
    return all.filter(id => Progress.get()[id]).length;
  },
  totalTasks: () => Object.values(CURRICULUM).flatMap(p => p.tasks).length
};

// ── XP SYSTEM ───────────────────────────────
const XP = {
  get: () => DB.get('xp', { total: 0, level: 0 }),
  award: (pts) => {
    const x = XP.get();
    x.total = Math.max(0, x.total + pts);
    x.level = Math.floor(x.total / 100);
    DB.set('xp', x);
    XP.render();
  },
  levelName: (lvl) => {
    const names = ['Iniciando', 'Explorador', 'Aprendiz', 'Analista Jr.', 'Analista', 'Analista Sr.', 'Expert', 'Master'];
    return names[Math.min(lvl, names.length - 1)];
  },
  render: () => {
    const x = XP.get();
    const pct = (x.total % 100);
    const el = document.getElementById('xp-fill');
    const disp = document.getElementById('xp-display');
    const lvlEl = document.getElementById('user-level-display');
    if (el) el.style.width = pct + '%';
    if (disp) disp.textContent = `${pct} / 100 XP`;
    if (lvlEl) lvlEl.textContent = `Nivel ${x.level} · ${XP.levelName(x.level)}`;
  }
};

// ── STREAK SYSTEM ───────────────────────────
const Streak = {
  get: () => DB.get('streak', { count: 0, last: null }),
  update: () => {
    const s = Streak.get();
    const today = new Date().toDateString();
    if (s.last === today) return;
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    s.count = (s.last === yesterday) ? s.count + 1 : 1;
    s.last = today;
    DB.set('streak', s);
    Streak.render();
  },
  render: () => {
    const s = Streak.get();
    const el = document.getElementById('streak-count');
    const el2 = document.getElementById('streak-stat');
    if (el) el.textContent = s.count + ' días';
    if (el2) el2.textContent = s.count;
  }
};

// ── STUDY SESSIONS ──────────────────────────
const Sessions = {
  get: () => DB.get('sessions', []),
  add: (mins) => {
    const ss = Sessions.get();
    ss.push({ date: new Date().toISOString(), mins });
    DB.set('sessions', ss);
    Sessions.renderHours();
  },
  totalMins: () => Sessions.get().reduce((a, s) => a + s.mins, 0),
  renderHours: () => {
    const h = Math.round(Sessions.totalMins() / 60 * 10) / 10;
    const el = document.getElementById('hours-studied');
    if (el) el.textContent = h + 'h';
  }
};

// ── NOTES ENGINE ────────────────────────────
const Notes = {
  get: () => DB.get('notes', []),
  add: (text, tag) => {
    const ns = Notes.get();
    ns.unshift({ id: Date.now(), text, tag, date: new Date().toISOString() });
    DB.set('notes', ns.slice(0, 200));
  },
  del: (id) => {
    DB.set('notes', Notes.get().filter(n => n.id !== id));
  }
};

// ── DAYS ACTIVE ─────────────────────────────
const DaysActive = {
  get: () => {
    const p = Profile.get();
    if (!p || !p.startDate) return 0;
    return Math.floor((Date.now() - new Date(p.startDate).getTime()) / 86400000) + 1;
  },
  render: () => {
    const el = document.getElementById('days-active');
    if (el) el.textContent = DaysActive.get();
  }
};

// ── TOAST ────────────────────────────────────
function toast(msg, dur = 2500) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('on');
  setTimeout(() => t.classList.remove('on'), dur);
}

// ── COPY ─────────────────────────────────────
function cp(id, btn) {
  const el = document.getElementById(id);
  const text = [...el.childNodes]
    .filter(n => !(n.nodeType === 1 && (n.classList.contains('cp') || n.tagName === 'BUTTON')))
    .map(n => n.textContent).join('').trim();
  const done = () => { if (btn) { const orig = btn.textContent; btn.textContent = '✓'; setTimeout(() => btn.textContent = orig, 2000); } toast('✓ Copiado al portapapeles'); };
  if (navigator.clipboard) { navigator.clipboard.writeText(text).then(done).catch(done); }
  else { const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t); done(); }
}

// ── FAQ ───────────────────────────────────────
function initFAQ() {
  document.querySelectorAll('.faq-btn').forEach(b => {
    b.addEventListener('click', () => {
      const open = b.classList.contains('open');
      document.querySelectorAll('.faq-btn').forEach(x => { x.classList.remove('open'); x.nextElementSibling.classList.remove('vis'); });
      if (!open) { b.classList.add('open'); b.nextElementSibling.classList.add('vis'); }
    });
  });
}

// ── SIDEBAR ───────────────────────────────────
function initSidebar() {
  const sb = document.getElementById('sb');
  const ham = document.getElementById('ham');
  if (!sb || !ham) return;
  ham.addEventListener('click', () => sb.classList.toggle('open'));
  document.addEventListener('click', e => {
    if (!sb.contains(e.target) && !ham.contains(e.target)) sb.classList.remove('open');
  });
  document.querySelectorAll('.nav-link').forEach(l => {
    l.addEventListener('click', () => { if (window.innerWidth < 900) sb.classList.remove('open'); });
  });
  // Active link
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(l => {
    const href = l.getAttribute('href').split('/').pop();
    if (href === path) l.classList.add('active');
    else l.classList.remove('active');
  });
}

// ── GLOBAL PROGRESS BAR ───────────────────────
function renderGlobalProgress() {
  const pct = Progress.totalPct();
  const el = document.getElementById('gp-fill');
  const pt = document.getElementById('gp-pct');
  if (el) el.style.width = pct + '%';
  if (pt) pt.textContent = pct + '%';
}

// ── GREETING ──────────────────────────────────
function renderGreeting() {
  const el = document.getElementById('greeting');
  if (!el) return;
  const h = new Date().getHours();
  const p = Profile.get();
  const name = p ? p.name : '';
  const greet = h < 12 ? 'Buenos días' : h < 18 ? 'Buenas tardes' : 'Buenas noches';
  el.textContent = `${greet}${name ? ', ' + name : ''} — ${new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}`;
}

// ── PROFILE RENDER ───────────────────────────
function renderProfile() {
  const p = Profile.get();
  if (!p) return;
  const nameEl = document.getElementById('user-name-display');
  const avatarEl = document.getElementById('user-avatar');
  if (nameEl) nameEl.textContent = p.name || 'Analista';
  if (avatarEl) avatarEl.textContent = (p.name || 'A')[0].toUpperCase();
}

// ── TASK INIT ─────────────────────────────────
function initTasks() {
  document.querySelectorAll('.tc').forEach(cb => {
    if (Progress.isChecked(cb.id)) { cb.checked = true; cb.closest('.ti')?.classList.add('done'); }
    cb.addEventListener('change', () => {
      cb.closest('.ti')?.classList.toggle('done', cb.checked);
      Progress.check(cb.id, cb.checked);
      renderGlobalProgress();
      const el2 = document.getElementById('tasks-done');
      if (el2) el2.textContent = Progress.totalDone();
    });
    cb.closest('.ti')?.addEventListener('click', e => {
      if (e.target !== cb && e.target.tagName !== 'A') {
        cb.checked = !cb.checked;
        cb.closest('.ti')?.classList.toggle('done', cb.checked);
        Progress.check(cb.id, cb.checked);
        renderGlobalProgress();
      }
    });
  });
}

// ── CURRICULUM DATA ───────────────────────────
const CURRICULUM = {
  fase1: {
    name: 'Fase 1', label: 'Fundamentos',
    tasks: [
      { id: 'f1t1', text: 'Solicitar Financial Aid — Curso 1 Google DA', detail: 'Aplicar en Coursera al curso individual, no la certificación completa.' },
      { id: 'f1t2', text: 'Dominar Excel/Sheets', detail: 'Tablas dinámicas, VLOOKUP, INDEX/MATCH, TRIM, CLEAN.' },
      { id: 'f1t3', text: 'Interiorizar ciclo PPAAÇA', detail: 'Aplicarlo a un dataset de Kaggle con documentación.' },
      { id: 'f1t4', text: 'Crear cuentas GitHub y Kaggle', detail: 'Subir primer archivo aunque sea básico.' },
      { id: 'f1t5', text: 'Hito de Salida: Análisis en Sheets con narrativa de negocio', detail: 'Documento en GitHub con hallazgos.' }
    ]
  },
  fase2: {
    name: 'Fase 2', label: 'SQL',
    tasks: [
      { id: 'f2t1', text: 'SQL básico a intermedio (SQLZoo)', detail: 'SELECT, WHERE, GROUP BY, JOINs.' },
      { id: 'f2t2', text: 'CTEs y Window Functions', detail: 'WITH…AS, ROW_NUMBER, RANK, LAG/LEAD.' },
      { id: 'f2t3', text: 'Google BigQuery Sandbox', detail: '1TB de queries gratis al mes.' },
      { id: 'f2t4', text: 'Modelado relacional 3 tablas', detail: 'Clientes, pedidos, productos con JOINs.' },
      { id: 'f2t5', text: 'Hito: 10 ejercicios HackerRank Medium SQL', detail: 'Subir a GitHub con explicación.' }
    ]
  },
  fase3: {
    name: 'Fase 3', label: 'Python',
    tasks: [
      { id: 'f3t1', text: 'Currículo freeCodeCamp Python', detail: 'Data Analysis with Python — gratis.' },
      { id: 'f3t2', text: 'NumPy — Operaciones vectorizadas', detail: 'Arrays, estadística, broadcasting.' },
      { id: 'f3t3', text: 'Pandas — Dominar DataFrames', detail: 'groupby, merge, pivot_table, apply.' },
      { id: 'f3t4', text: 'Matplotlib y Seaborn', detail: 'Histogramas, scatter, heatmaps.' },
      { id: 'f3t5', text: 'Hito: Demographic + Medical Visualizer', detail: 'Proyectos freeCodeCamp en GitHub.' }
    ]
  },
  fase4: {
    name: 'Fase 4', label: 'Power BI',
    tasks: [
      { id: 'f4t1', text: 'Solicitar Beca IBM en Coursera', detail: 'Curso 1 del IBM Data Analyst Certificate.' },
      { id: 'f4t2', text: 'Power BI: Modelo Estrella + DAX', detail: 'CALCULATE, SUMX, DIVIDE, DATEADD.' },
      { id: 'f4t3', text: 'Regla visual: 1 métrica, 1 gráfico', detail: 'Máximo 5 visualizaciones por página.' },
      { id: 'f4t4', text: 'Publicar dashboard en Tableau Public', detail: 'URL para LinkedIn y GitHub.' },
      { id: 'f4t5', text: 'Hito: Dashboard con 4 KPIs y narrativa de negocio', detail: 'Online en Tableau Public.' }
    ]
  },
  fase5: {
    name: 'Fase 5', label: 'IA',
    tasks: [
      { id: 'f5t1', text: 'Método CCC para SQL con IA', detail: 'Clarificar → Confirmar → Completar.' },
      { id: 'f5t2', text: 'Automatizar tareas repetitivas', detail: 'GPT-4o/Claude para EDA templates y RegEx.' },
      { id: 'f5t3', text: 'Gemini en BigQuery', detail: 'SQL desde lenguaje natural.' },
      { id: 'f5t4', text: 'Documentación asistida por IA', detail: 'READMEs, comentarios, resúmenes ejecutivos.' },
      { id: 'f5t5', text: 'Hito: Librería de 10+ prompts personales en GitHub', detail: 'Documentados y categorizados.' }
    ]
  },
  fase6: {
    name: 'Fase 6', label: 'Empleo',
    tasks: [
      { id: 'f6t1', text: 'Pulir 3 proyectos de portafolio', detail: 'Código limpio, README STAR, capturas.' },
      { id: 'f6t2', text: 'GitHub con actividad visible', detail: 'Commits diarios en el heatmap.' },
      { id: 'f6t3', text: 'LinkedIn optimizado para ATS', detail: 'Keywords, foto profesional, banner.' },
      { id: 'f6t4', text: 'Preparar 5 respuestas STAR', detail: 'Con datos, metodología y resultado cuantificado.' },
      { id: 'f6t5', text: 'Hito: 10 aplicaciones + 1 entrevista técnica', detail: 'La primera entrevista es práctica real.' }
    ]
  }
};

// ── HACKS DEL DÍA ─────────────────────────────
const HACKS = [
  { cat: 'Tutorial Hell', text: '<strong>Regla de las 48h:</strong> Cada concepto nuevo, aplícalo a un dataset DIFERENTE al del tutorial en las próximas 48 horas. Sin esto, el 80% del conocimiento se evapora en una semana.' },
  { cat: 'SQL', text: '<strong>CTEs sobre Subqueries:</strong> Siempre prefiere CTEs (WITH...AS) sobre subqueries anidadas. Son más legibles, más fáciles de debuggear y el optimizer de PostgreSQL/BigQuery las maneja igual de bien.' },
  { cat: 'GitHub', text: '<strong>Commit diario aunque sea 1 línea:</strong> Los reclutadores técnicos van directo al heatmap verde. La consistencia visible dice más que proyectos perfectos espaciados.' },
  { cat: 'LinkedIn', text: '<strong>Comenta con insight, no con elogios:</strong> En posts de Senior Analysts, añade algo sustancial. "¿Han considerado también el efecto de X en Y?" Apareces en las notificaciones de quienes contratan.' },
  { cat: 'Empleabilidad', text: '<strong>Aplica al 60% del stack, no al 100%:</strong> El proceso de reclutamiento tarda semanas. Si aplicas cuando tengas SQL + Python básico, cuando llegue la entrevista habrás avanzado el 40% restante.' },
  { cat: 'Power BI', text: '<strong>El modelo es el 70% del trabajo:</strong> Un modelo estrella mal construido hace que el DAX sea 10x más complejo. Invierte el doble de tiempo en el modelo relacional y el resto se vuelve simple.' },
  { cat: 'Python', text: '<strong>Una sola línea de Pandas vale 20 de Python puro:</strong> `df.groupby("region")["ventas"].agg(["sum","mean","count"])` reemplaza un loop de 20 líneas. Aprende las funciones de agregación antes que cualquier otra cosa.' },
  { cat: 'Entrevistas', text: '<strong>Antes de escribir código, escribe el plan:</strong> En pruebas técnicas, pon tu lógica en comentarios primero. Los evaluadores quieren ver que piensas antes de ejecutar. Un analista que planea vale más que uno que ejecuta rápido sin dirección.' },
  { cat: 'Kaggle', text: '<strong>Llega a Contributor en una semana:</strong> Sube 1 notebook con EDA completo de un dataset popular, comenta en 5 notebooks de otros. Contributor es el nivel donde apareces en búsquedas de la comunidad.' },
  { cat: 'Mentalidad', text: '<strong>Traduce técnica a dinero siempre:</strong> "Hice un análisis de sentimiento" no dice nada. "Identifiqué las 3 categorías de quejas que generan el 80% del churn, representando $X en MRR en riesgo" dice todo.' },
  { cat: 'SQL Avanzado', text: '<strong>Window Functions > GROUP BY para análisis temporal:</strong> Para calcular running totals, rankings y comparaciones período a período, LAG() y SUM() OVER() son 10x más eficientes que múltiples subqueries.' },
  { cat: 'Coursera', text: '<strong>Aplica al curso individual, no a la especialización:</strong> Financial Aid en Coursera tiene límite de 10 solicitudes simultáneas. Aplicar al curso 1 y al aprobarlo al curso 2 maximiza el flujo de aprobaciones.' },
  { cat: 'Portafolio', text: '<strong>Documenta el antes/después de la limpieza:</strong> En proyectos de Python, incluye siempre: % de nulos antes, estrategia de imputación justificada estadísticamente, distribución antes vs después. Esto demuestra madurez analítica que el 90% no tiene.' },
  { cat: 'Mercado', text: '<strong>Fintech y E-commerce primero:</strong> Son las industrias con mayor demanda de analistas Junior en LATAM, pagan mejor y los datos son más ricos para aprender. Una vez tienes 1 año de experiencia ahí, puedes moverte a cualquier vertical.' },
  { cat: 'Inglés', text: '<strong>Lee la documentación oficial en inglés desde el día 1:</strong> La documentación de Pandas, PostgreSQL y Power BI está en inglés. Leerla habitualmente mejora tu inglés técnico sin esfuerzo adicional.' },
  { cat: 'IA', text: '<strong>Siempre da esquema + contexto de negocio a la IA:</strong> "Dame SQL" produce basura. "Tengo tablas X, Y, Z. El negocio quiere saber A. Restricción: PostgreSQL 15" produce código de producción.' }
];

// ── ENGLISH TECH VOCABULARY ──────────────────
const VOCAB = [
  { en: 'Data Wrangling', pron: '/ˈdeɪtə ˈræŋɡlɪŋ/', es: 'Limpieza y transformación de datos', ex: '"The data wrangling process took 3 hours — the dataset had 40% nulls."' },
  { en: 'Churn Rate', pron: '/tʃɜːrn reɪt/', es: 'Tasa de abandono de clientes', ex: '"Our monthly churn rate dropped from 8% to 5% after the new onboarding flow."' },
  { en: 'Outlier', pron: '/ˈaʊtˌlaɪər/', es: 'Valor atípico / Dato anómalo', ex: '"The outlier in the revenue column turned out to be a data entry error."' },
  { en: 'Stakeholder', pron: '/ˈsteɪkˌhoʊldər/', es: 'Parte interesada / Tomador de decisiones', ex: '"I presented the findings to the stakeholders in the marketing team."' },
  { en: 'Pipeline', pron: '/ˈpaɪpˌlaɪn/', es: 'Flujo de procesamiento de datos', ex: '"Our data pipeline runs every 6 hours and updates the dashboard automatically."' },
  { en: 'Cohort Analysis', pron: '/ˈkoʊhɔːrt əˈnæləsɪs/', es: 'Análisis de cohortes', ex: '"The cohort analysis showed that users acquired in Q4 had 30% higher retention."' },
  { en: 'Granularity', pron: '/ˌɡrænjʊˈlærɪti/', es: 'Nivel de detalle / Granularidad', ex: '"We need daily granularity for this report, not weekly."' },
  { en: 'Aggregation', pron: '/ˌæɡrɪˈɡeɪʃən/', es: 'Agregación / Resumen estadístico', ex: '"The aggregation by region revealed that the East coast drives 60% of revenue."' },
  { en: 'ETL', pron: '/ˌiː tiː ˈel/', es: 'Extraer, Transformar, Cargar datos', ex: '"I built an ETL process that cleans and loads 500K records every night."' },
  { en: 'KPI', pron: '/ˌkeɪ piː ˈaɪ/', es: 'Indicador Clave de Rendimiento', ex: '"The main KPI for this quarter is reducing cart abandonment below 60%."' },
  { en: 'Pivot Table', pron: '/ˈpɪvət ˈteɪbl/', es: 'Tabla dinámica', ex: '"I used a pivot table to break down sales by region and product category."' },
  { en: 'Correlation', pron: '/ˌkɒrəˈleɪʃən/', es: 'Correlación (relación entre variables)', ex: '"There is a strong correlation between marketing spend and new user acquisition."' },
  { en: 'Ad Hoc Analysis', pron: '/æd hɒk/', es: 'Análisis bajo demanda / Específico', ex: '"The CEO requested an ad hoc analysis of last week\'s sales drop."' },
  { en: 'Dashboard', pron: '/ˈdæʃˌbɔːrd/', es: 'Tablero de control visual', ex: '"I built a real-time dashboard that tracks inventory levels across 5 warehouses."' },
  { en: 'Cardinality', pron: '/ˌkɑːrdɪˈnælɪti/', es: 'Cardinalidad (valores únicos en columna)', ex: '"The customer_id column has high cardinality — 1 million unique values."' },
  { en: 'Data Lineage', pron: '/ˈdeɪtə ˈlɪniɪdʒ/', es: 'Trazabilidad / Origen de los datos', ex: '"Good data lineage documentation shows where each metric comes from."' },
  { en: 'Imputation', pron: '/ˌɪmpjʊˈteɪʃən/', es: 'Imputación (relleno de valores nulos)', ex: '"I used KNN imputation to fill the missing property type values."' },
  { en: 'Schema', pron: '/ˈskiːmə/', es: 'Esquema (estructura de base de datos)', ex: '"Let me share the database schema before we write the SQL query."' },
  { en: 'Insight', pron: '/ˈɪnsaɪt/', es: 'Hallazgo / Comprensión valiosa', ex: '"The key insight from this analysis is that Friday orders have 2x more returns."' },
  { en: 'Benchmark', pron: '/ˈbentʃˌmɑːrk/', es: 'Referencia / Punto de comparación', ex: '"Our 22-day inventory turnover is below the industry benchmark of 18 days."' }
];

// ── PROMPTS LIBRARY ───────────────────────────
const PROMPTS_DATA = [
  {
    cat: 'SQL',
    title: 'SQL desde Pregunta de Negocio',
    use: 'Convertir requerimientos en SQL optimizado y auditado',
    text: `Actúa como Senior Data Analyst especializado en PostgreSQL.

Contexto: [describe empresa y área de negocio]
Esquema:
- tabla1(col1 TIPO, col2 TIPO, ...)
- tabla2(col1 TIPO, ...)

Pregunta de negocio: [escribe en español natural]

Restricciones:
- Motor: PostgreSQL 15
- Debe ejecutarse en <2s con 500K registros
- Preferir CTEs sobre subqueries anidadas

Por favor:
1. Escribe la consulta SQL completa
2. Explica cada cláusula con su propósito de negocio
3. Señala si necesita índice para optimizar
4. Propón 2 variaciones útiles`
  },
  {
    cat: 'Python',
    title: 'EDA Automatizado con Pandas',
    use: 'Generar análisis exploratorio completo y reproducible',
    text: `Actúa como Data Scientist con Python.

DataFrame llamado df con columnas:
[lista columnas con tipo: ej. customer_id (int), fecha (datetime), monto (float)]

Objetivo del análisis: [objetivo de negocio]

Genera script Python completo para EDA que incluya:
1. Resumen estadístico con interpretación de negocio
2. Detección y visualización de nulos con heatmap
3. Distribuciones de variables numéricas (histograma + KDE)
4. Detección de outliers con método IQR
5. Matriz de correlación con Seaborn
6. Mínimo 3 insights no obvios a buscar

Requisitos:
- Comentarios en español
- Visualizaciones con títulos descriptivos
- Compatible con Google Colab`
  },
  {
    cat: 'Limpieza',
    title: 'Estrategia de Limpieza de Datos Sucios',
    use: 'Enfrentar datasets corruptos del mundo real',
    text: `Actúa como Data Engineer especializado en calidad de datos.

Dataset:
- Fuente: [ej. scraping, exportación de CRM]
- Filas aprox: [número]
- Problema principal: [ej. 70% nulos en columna precio]

Primeras 5 filas:
[pega aquí]

Genera estrategia de limpieza que:
1. Diagnostique: perfil de nulos, tipos, duplicados
2. Decida estrategia por columna (eliminar/imputar/transformar)
3. Justifique estadísticamente cada decisión
4. Valide que distribución post-limpieza preserve la original
5. Documente el registro de cambios

Importante: NO elimines filas como primera opción.`
  },
  {
    cat: 'Dashboard',
    title: 'Narrativa Ejecutiva para Stakeholders',
    use: 'Convertir hallazgos técnicos en insights de negocio',
    text: `Actúa como BI Analyst con experiencia en comunicación ejecutiva.

Métricas del dashboard:
- KPI 1: [nombre y valor, ej. "Ventas Q4: $1.2M, +15% vs Q3"]
- KPI 2: [nombre y valor]
- KPI 3: [nombre y valor]
- Outlier detectado: [describe la anomalía]

Audiencia: [ej. "Director de Operaciones, no técnico"]

Genera:
1. Titular de 1 línea (máx. 15 palabras) con el hallazgo principal
2. Párrafo ejecutivo 3 oraciones: situación → hallazgo → implicación
3. 3 recomendaciones accionables (verbo + métrica de éxito)
4. 1 pregunta de seguimiento para el stakeholder

Tono: directo, sin jerga técnica, orientado a decisión.`
  },
  {
    cat: 'Entrevistas',
    title: 'Simulador de Entrevista Técnica',
    use: 'Practicar antes del día real y detectar brechas',
    text: `Actúa como entrevistador técnico Senior de [empresa objetivo].
Posición: Junior Data Analyst.

Mi stack: SQL (nivel [básico/intermedio/avanzado]), Python/Pandas ([nivel]), Power BI ([nivel])

Simula entrevista técnica de 30 minutos:
1. 3 preguntas SQL con dificultad progresiva
2. 2 preguntas Python/Pandas con dataset ejemplo
3. 1 caso de negocio: dame datos y pide diseño del análisis

Después de cada respuesta mía, dime:
- Qué fue correcto
- Qué optimizaría
- Qué pregunta de seguimiento haría un entrevistador real
- Puntuación 1-10 con justificación

Sé exigente pero justo. No suavices el feedback.`
  },
  {
    cat: 'README',
    title: 'README en Formato STAR para GitHub',
    use: 'Documentar proyectos con impacto que los reclutadores leen',
    text: `Actúa como Technical Writer para portafolios de datos.

Proyecto:
- Herramientas usadas: [ej. Python, Pandas, Power BI]
- Dataset: [descripción]
- Qué hice técnicamente: [resumen]
- Resultado aproximado: [impacto o hallazgo]

Genera README.md completo en formato STAR con:
1. Situación: el problema de negocio real
2. Tarea: mi objetivo específico
3. Acción: lo que hice técnicamente (con bullets)
4. Resultado: impacto cuantificado
5. Stack técnico con badges de shields.io
6. Sección de instalación y uso
7. Capturas/GIFs (indicar dónde insertar)

Tono: profesional pero accesible. Como si un Senior lo revisara.`
  },
  {
    cat: 'Python',
    title: 'Generar Schema SQL desde Descripción',
    use: 'Diseñar bases de datos relacionales rápidamente',
    text: `Actúa como Database Architect con PostgreSQL.

Necesito diseñar una base de datos para: [describe el negocio y qué datos maneja]

Por favor:
1. Propón las tablas necesarias con sus columnas y tipos de datos
2. Define las relaciones (FK) y cardinalidades
3. Escribe el SQL CREATE TABLE completo con constraints
4. Sugiere índices para las consultas más frecuentes
5. Muestra un diagrama ER en texto (usando formato ASCII o Mermaid)

Considera: normalización hasta 3NF, PKs apropiadas, campos de auditoría (created_at, updated_at).`
  },
  {
    cat: 'Inglés',
    title: 'Traducir Hallazgo Técnico a Inglés Profesional',
    use: 'Preparar comunicaciones en inglés para CVs y entrevistas',
    text: `Actúa como Business English editor especializado en datos.

Tengo este hallazgo de análisis en español:
[describe tu hallazgo o resultado]

Por favor:
1. Traduce al inglés profesional de negocios (nivel B2-C1)
2. Propón 3 versiones: CV corto (1 línea), LinkedIn post (3 líneas), email a stakeholder (párrafo)
3. Señala el vocabulario técnico de datos clave que usaste
4. Da pronunciación de los términos más difíciles

Asegúrate de usar terminología que los reclutadores anglosajones reconocen.`
  }
];

// ── JOBS DATA (estáticos + fetch dinámico) ────
const JOBS_STATIC = [
  { title: 'Junior Data Analyst — Remoto LATAM', company: 'Startup Fintech', tags: ['SQL', 'Python'], link: 'https://www.linkedin.com/jobs/search/?keywords=junior+data+analyst&location=latam', date: 'Hoy' },
  { title: 'Data Analyst Jr. · Power BI + SQL', company: 'E-commerce Regional', tags: ['Power BI', 'SQL'], link: 'https://www.linkedin.com/jobs/search/?keywords=data+analyst+power+bi', date: 'Hoy' },
  { title: 'Analytics Analyst — Google Sheets + SQL', company: 'Agencia Digital', tags: ['SQL', 'Excel'], link: 'https://www.indeed.com/jobs?q=junior+data+analyst', date: 'Reciente' },
  { title: 'BI Analyst Jr. · Tableau + BigQuery', company: 'Empresa SaaS', tags: ['Tableau', 'BigQuery'], link: 'https://www.glassdoor.com/Job/junior-data-analyst-jobs-SRCH_KO0,20.htm', date: 'Reciente' }
];

// ── INIT ───────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  initFAQ();
  initTasks();
  renderGlobalProgress();
  renderGreeting();
  renderProfile();
  XP.render();
  Streak.render();
  DaysActive.render();
  Sessions.renderHours();
  const td = document.getElementById('tasks-done');
  if (td) td.textContent = Progress.totalDone();
});
