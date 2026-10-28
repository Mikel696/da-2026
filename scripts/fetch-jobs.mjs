/* ═══════════════════════════════════════════════════════════════
   DA-2026 · 5-JOB · Radar diario de vacantes
   ─────────────────────────────────────────────────────────────
   Corre en GitHub Actions. Del lado servidor porque varias de estas
   APIs no exponen CORS y porque el trabajo pesado —deduplicar,
   puntuar y filtrar— no tiene por qué repetirse en cada carga.

   EL PROBLEMA QUE RESUELVE, medido antes de escribir una línea:
   de 100 vacantes de RemoteOK, CERO declaran aceptar candidatos de
   LatAm. En Remotive, 56%. El mayor desperdicio de tiempo de alguien
   que busca empleo remoto desde Colombia no es encontrar vacantes:
   es descubrir a mitad de la postulación que eran solo para EE. UU.
   Por eso la elegibilidad es un FILTRO DURO, no un punto más.

   Y volcar una API cruda produce ruido: buscar "data analyst" en
   Remotive devuelve "Sales Jedi" y "Remote Office Assistant" porque
   busca en la descripción. Acá se puntúa por título y stack, y cada
   vacante muestra POR QUÉ salió — un puntaje sin motivo es una caja
   negra, y este proyecto no las usa.

   DOS EJES SEPARADOS, aprendido a los golpes:
     · AFINIDAD     = qué tan parecido es el puesto a lo que hacés.
     · ELEGIBILIDAD = si te dejan postularte desde Colombia.
   Mezclarlos hacía que un empleo de marketing en Bogotá calificara
   solo por decir "LatAm". La región ya no suma afinidad.

   Sin dependencias: fetch global de Node 18+.
═══════════════════════════════════════════════════════════════ */

import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { leerPrevio } from './_prev.mjs';

const OUT = 'frontend/data/jobs-feed.json';
const EMPRESAS_FILE = 'frontend/data/jobs-companies.json';
const UA = 'Mozilla/5.0 (compatible; da-2026-cerebro/1.0; +https://github.com/Mikel696/da-2026)';

const FUENTES = [
  { n: 'RemoteOK',  u: 'https://remoteok.com/api',                       parse: 'remoteok' },
  { n: 'Remotive',  u: 'https://remotive.com/api/remote-jobs',           parse: 'remotive' },
  { n: 'Jobicy',    u: 'https://jobicy.com/api/v2/remote-jobs?count=50', parse: 'jobicy' },
  { n: 'Arbeitnow', u: 'https://www.arbeitnow.com/api/job-board-api',    parse: 'arbeitnow' }
];

/* Endpoints de los ATS, verificados con petición real el 2026-08-13.
   Dan MUCHA mejor señal que los portales remotos: son empresas
   concretas, con ubicación explícita, y contratan en LatAm. */
const ATS = {
  greenhouse: s => `https://boards-api.greenhouse.io/v1/boards/${s}/jobs?content=true`,
  lever:      s => `https://api.lever.co/v0/postings/${s}?mode=json`,
  ashby:      s => `https://api.ashbyhq.com/posting-api/job-board/${s}`
};

const MAX_DIAS = 30;   // más viejo que esto suele estar cubierto
const TOP = 60;

/* ═══ AFINIDAD ═══
   El perfil REAL de Miguel: Reconciliations Analyst en Simetrik ·
   Ing. de Sistemas CUN · SQL, Excel, Power BI, conciliaciones,
   contabilidad AP/AR · español nativo, inglés en progreso. */

/* ROL — al menos UNA tiene que aparecer para que la vacante entre. */
const SENALES_ROL = [
  { re: /(reconcil|conciliaci)/i,                              p: 12, t: 'conciliaciones — tu especialidad' },
  { re: /(data analyst|analista de datos)/i,                   p: 10, t: 'analista de datos' },
  { re: /(business intelligence|bi analyst|analista bi)/i,     p: 10, t: 'BI' },
  { re: /(financial analyst|analista financiero)/i,            p: 9,  t: 'analista financiero' },
  { re: /(implementation (specialist|consultant|analyst|manager)|onboarding specialist)/i, p: 9, t: 'implementación — lo que hacés hoy' },
  { re: /(accounts payable|accounts receivable|contabilidad|accounting|bookkeep)/i, p: 7, t: 'contabilidad' },
  { re: /(reporting analyst|analytics (analyst|specialist|manager)|data (engineer|specialist|scientist))/i, p: 7, t: 'analítica' },
  { re: /(operations analyst|analista de operaciones|business analyst|analista de negocio)/i, p: 6, t: 'analista de operaciones o negocio' },
  { re: /(analyst|analista)/i,                                 p: 4,  t: 'puesto de analista' }
];

/* APOYO — suman afinidad pero NO califican por sí solas. */
const SENALES_APOYO = [
  { re: /(sql)/i,                                              p: 8, t: 'SQL' },
  { re: /(power ?bi|powerbi)/i,                                p: 8, t: 'Power BI' },
  { re: /(excel|spreadsheet|google sheets)/i,                  p: 5, t: 'Excel' },
  { re: /(python|pandas)/i,                                    p: 5, t: 'Python' },
  { re: /(tableau|looker|metabase|qlik)/i,                     p: 4, t: 'herramientas BI' },
  { re: /(etl|data pipeline|automatiz|automation|n8n|zapier)/i, p: 6, t: 'automatización' },
  { re: /(fintech|payments|pagos|banking|banca|financial services)/i, p: 7, t: 'fintech o banca' },
  { re: /(saas|b2b)/i,                                         p: 3, t: 'SaaS B2B' },
  { re: /(spanish|español|bilingual|biling)/i,                 p: 6, t: 'piden español' }
];

/* CONTRA — se evalúan SOLO contra el cargo, nunca contra la descripción.
   Un puesto de analista en una empresa de ventas no es un puesto de
   ventas: castigarlo por la palabra "sales" del texto dejaba el radar
   en cero resultados. */
const CONTRA = [
  { re: /(senior|sr\.|lead|principal|head of|director|chief)/i, p: -6,  t: 'perfil senior' },
  { re: /(devops|kubernetes|golang|rust|android|ios|frontend|backend|back-end|fullstack|full-stack|software engineer|developer|programador)/i, p: -10, t: 'perfil de desarrollo' },
  { re: /(sales|account executive|marketing|paid media|growth|brand|recruit|talent acquisition|designer|copywriter|customer (happiness|success|support)|legal|lawyer|payroll|nurse|teacher|docente)/i, p: -12, t: 'otra disciplina' },
  { re: /(m\/f\/d|m\/w\/d|deutsch|german)/i,                   p: -6,  t: 'mercado alemán' }
];

/* Mercado alemán: se cuela por todos lados y no te sirve. La penalización
   de arriba mira solo el cargo, y así pasaban "Data Analyst Schwerpunkt
   Healthcare" o cualquier vacante de una GmbH. Esto lo descarta de raíz
   mirando también la empresa y palabras inequívocas del texto. */
const MERCADO_ALEMAN = /(gmbh|\bag\b|werkstudent|schwerpunkt|mitarbeiter|festanstellung|unbefristet|standort|m\/w\/d|m\/f\/d|\(d\/m\/w\)|berufserfahrung)/i;
const esAleman = j =>
  MERCADO_ALEMAN.test(`${j.empresa || ''} ${j.titulo || ''}`) ||
  (/(deutschland|münchen|munich|berlin|hamburg|frankfurt|köln|stuttgart)/i.test(j.ubicacion || ''));

/* ═══ ELEGIBILIDAD — el filtro que ahorra el tiempo de verdad ═══ */
const ABIERTO = /latam|latin ?america|colombia|americas|worldwide|anywhere|global|south america/i;
const CERRADO = /(usa only|us only|united states only|must be located in the us|eu only|europe only|uk only|canada only|india only|deutschland)/i;

function elegibilidad(txt) {
  const s = String(txt || '').trim();
  if (!s) return { estado: 'desconocida', nota: 'la vacante no declara desde dónde se puede trabajar' };
  if (CERRADO.test(s)) return { estado: 'cerrada', nota: 'restringida a otra región' };
  if (ABIERTO.test(s)) return { estado: 'abierta', nota: 'acepta LatAm o es global' };
  if (/^(usa|united states|us|canada|uk|india|germany)$/i.test(s)) return { estado: 'cerrada', nota: 'solo ' + s };
  return { estado: 'dudosa', nota: 'no menciona LatAm — hay que leer la oferta' };
}

/* ═══ Normalizadores ═══ */
const limpia = s => String(s || '').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();

const PARSERS = {
  remoteok: raw => (Array.isArray(raw) ? raw.slice(1) : []).map(j => ({
    titulo: j.position, empresa: j.company, url: j.url || `https://remoteok.com/l/${j.id}`,
    fecha: j.date ? new Date(j.date).toISOString() : null,
    ubicacion: j.location || '', tags: j.tags || [],
    desc: limpia(j.description).slice(0, 900),
    salario: j.salary_min ? `US$${Math.round(j.salary_min / 1000)}k a ${Math.round(j.salary_max / 1000)}k` : null
  })),
  remotive: raw => (raw?.jobs || []).map(j => ({
    titulo: j.title, empresa: j.company_name, url: j.url,
    fecha: j.publication_date ? new Date(j.publication_date).toISOString() : null,
    ubicacion: j.candidate_required_location || '', tags: j.tags || [],
    desc: limpia(j.description).slice(0, 900), salario: j.salary || null
  })),
  jobicy: raw => (raw?.jobs || []).map(j => ({
    titulo: j.jobTitle, empresa: j.companyName, url: j.url,
    fecha: j.pubDate ? new Date(j.pubDate).toISOString() : null,
    ubicacion: j.jobGeo || '', tags: [].concat(j.jobIndustry || [], j.jobLevel || []),
    desc: limpia(j.jobExcerpt).slice(0, 900),
    salario: j.annualSalaryMin ? `US$${Math.round(j.annualSalaryMin / 1000)}k+` : null
  })),
  arbeitnow: raw => (raw?.data || []).map(j => ({
    titulo: j.title, empresa: j.company_name, url: j.url,
    fecha: j.created_at ? new Date(j.created_at * 1000).toISOString() : null,
    ubicacion: j.location || '', tags: j.tags || [],
    desc: limpia(j.description).slice(0, 900), salario: null
  })),
  greenhouse: (raw, emp) => (raw?.jobs || []).map(j => ({
    titulo: j.title, empresa: emp.nombre, url: j.absolute_url,
    fecha: j.updated_at ? new Date(j.updated_at).toISOString() : null,
    ubicacion: j.location?.name || '',
    tags: (j.metadata || []).map(m => m.value).filter(x => typeof x === 'string'),
    desc: limpia(j.content || '').slice(0, 6000), salario: null, esAts: true
  })),
  lever: (raw, emp) => (Array.isArray(raw) ? raw : []).map(j => ({
    titulo: j.text, empresa: emp.nombre, url: j.hostedUrl,
    fecha: j.createdAt ? new Date(j.createdAt).toISOString() : null,
    ubicacion: j.categories?.location || '',
    tags: [j.categories?.team, j.categories?.commitment].filter(Boolean),
    desc: limpia(j.descriptionPlain || '').slice(0, 900), salario: null, esAts: true
  })),
  ashby: (raw, emp) => (raw?.jobs || []).map(j => ({
    titulo: j.title, empresa: emp.nombre, url: j.jobUrl || j.applyUrl,
    fecha: j.publishedAt ? new Date(j.publishedAt).toISOString() : null,
    ubicacion: [j.location, ...(j.secondaryLocations || []).map(l => l.location || l)].filter(Boolean).join(', '),
    tags: [j.department, j.team, j.employmentType].filter(Boolean),
    desc: limpia(j.descriptionPlain || '').slice(0, 900), salario: null, esAts: true
  }))
};


/* ═══ VENTAJA COMPETITIVA · palabras que el filtro automático busca ═══
   Greenhouse, Lever y Ashby descartan CVs por coincidencia de palabras
   ANTES de que un humano los lea. La mayoría de los aspirantes manda el
   mismo CV genérico a todo. Saber qué términos exactos pide CADA vacante
   y ajustar el CV a eso es la diferencia entre pasar el filtro o no.

   Vocabulario cerrado a propósito: solo términos verificables en el texto.
   Nada de inferir habilidades que la oferta no nombra. */
const VOCABULARIO = [
  'SQL','Python','Power BI','Tableau','Looker','Excel','Google Sheets','R','SAS','SPSS',
  'ETL','Airflow','dbt','Snowflake','BigQuery','Redshift','Databricks','Spark','Hadoop',
  'AWS','Azure','GCP','Docker','Git','API','REST','Postgres','MySQL','MongoDB','NoSQL',
  'Salesforce','HubSpot','SAP','Oracle','NetSuite','QuickBooks','Workday','Jira','Notion',
  'Looker Studio','Data Studio','Metabase','Qlik','Alteryx','VBA','Macros','Pivot',
  'Machine Learning','Statistics','A/B Testing','Forecasting','Modeling','Dashboards',
  'KPI','OKR','Agile','Scrum','Lean','Six Sigma','Process Improvement',
  'Reconciliation','Accounts Payable','Accounts Receivable','GAAP','IFRS','Audit',
  'Financial Modeling','Budgeting','Forecast','Cash Flow','P&L','Close Process',
  'Stakeholder','Cross-functional','Documentation','Training','Onboarding','Implementation'
];

/* Lo que Miguel YA puede sostener en una entrevista, según su experiencia real
   (Simetrik: conciliaciones · Brinks: AP/análisis financiero · Ing. Sistemas). */
const YA_TIENE = new Set([
  'SQL','Excel','Power BI','Google Sheets','Reconciliation','Accounts Payable',
  'Accounts Receivable','Dashboards','KPI','Documentation','Process Improvement',
  'Stakeholder','Cross-functional','Implementation','Onboarding','Training',
  'Pivot','Macros','API','Postgres','MySQL','Jira','Agile','Audit','Close Process'
]);

function palabrasClave(texto) {
  const t = String(texto || '');
  if (t.length < 200) return null;          // sin descripción no se inventa nada
  const hallados = VOCABULARIO.filter(k => {
    const re = new RegExp('(^|[^a-zA-Z])' + k.replace(/[.*+?^${}()|[]\]/g, '\/* ═══ Puntaje, con motivos visibles ═══ */') + '([^a-zA-Z]|$)', 'i');
    return re.test(t);
  });
  if (!hallados.length) return null;
  return {
    tenes:  hallados.filter(k => YA_TIENE.has(k)),
    faltan: hallados.filter(k => !YA_TIENE.has(k))
  };
}

/* ═══ Puntaje, con motivos visibles ═══ */
function puntuar(j) {
  const texto = `${j.titulo} ${(j.tags || []).join(' ')} ${j.desc}`;
  const titulo = String(j.titulo || '');
  const cargo = titulo + ' ' + (j.tags || []).join(' ');
  let score = 0, tieneRol = false;
  const motivos = [], peros = [];

  // El título pesa el doble: es la señal más honesta de qué es el puesto.
  const mirar = (lista, esRol) => {
    for (const sig of lista) {
      const enTitulo = sig.re.test(titulo);
      if (enTitulo || sig.re.test(texto)) {
        score += enTitulo ? sig.p * 2 : sig.p;
        if (!motivos.includes(sig.t)) motivos.push(sig.t);
        if (esRol) tieneRol = true;
      }
    }
  };
  mirar(SENALES_ROL, true);
  mirar(SENALES_APOYO, false);

  for (const c of CONTRA) {
    if (c.re.test(cargo)) { score += c.p; if (!peros.includes(c.t)) peros.push(c.t); }
  }

  // Frescura: una vacante de hace 3 semanas suele estar cubierta.
  const dias = j.fecha ? Math.round((Date.now() - Date.parse(j.fecha)) / 86400000) : 99;
  if (dias <= 3) score += 6; else if (dias <= 7) score += 3; else if (dias > 21) score -= 4;

  return { score, tieneRol, motivos: motivos.slice(0, 5), peros: peros.slice(0, 3), dias };
}

/* ═══════════════════════ Main ═══════════════════════ */

const errors = [];
const previo = await leerPrevio(OUT);
let crudas = [];

const res = await Promise.allSettled(FUENTES.map(async f => {
  const r = await fetch(f.u, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(45000)
  });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return PARSERS[f.parse](await r.json()).map(x => ({ ...x, fuente: f.n }));
}));
res.forEach((r, i) => {
  if (r.status === 'fulfilled') crudas = crudas.concat(r.value);
  else errors.push(`${FUENTES[i].n}: ${r.reason?.message || r.reason}`);
});

let empresas = [];
try { empresas = JSON.parse(await readFile(EMPRESAS_FILE, 'utf8')).empresas || []; }
catch (e) { errors.push('lista de empresas: ' + e.message); }

const resAts = await Promise.allSettled(empresas.map(async emp => {
  const url = ATS[emp.ats]?.(emp.slug);
  if (!url) throw new Error('ATS desconocido: ' + emp.ats);
  const r = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(30000)
  });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return PARSERS[emp.ats](await r.json(), emp).map(x => ({ ...x, fuente: emp.nombre }));
}));
resAts.forEach((r, i) => {
  if (r.status === 'fulfilled') crudas = crudas.concat(r.value);
  else errors.push(`${empresas[i]?.nombre}: ${r.reason?.message || r.reason}`);
});

if (!crudas.length) {
  console.error('✗ Ninguna fuente respondió. Se preserva el feed anterior.');
  console.error(errors.join('\n'));
  process.exit(1);
}

/* Deduplicar: la misma vacante aparece en varios portales. */
const vistos = new Map();
for (const j of crudas) {
  if (!j.titulo || !j.url) continue;
  const k = (j.titulo + '|' + (j.empresa || '')).toLowerCase().replace(/[^a-z0-9|]/g, '');
  if (!vistos.has(k)) vistos.set(k, { ...j, tambienEn: [] });
  else vistos.get(k).tambienEn.push(j.fuente);
}

const evaluadas = [...vistos.values()].map(j => {
  const p = puntuar(j);
  const e = elegibilidad(j.ubicacion);
  const kw = palabrasClave(j.desc);
  const horas = j.fecha ? Math.round((Date.now() - Date.parse(j.fecha)) / 3600000) : null;
  return { ...j, ...p, horas, kw, elegibilidad: e.estado, elegibilidadNota: e.nota };
});

const relevantes = evaluadas
  .filter(j => !esAleman(j))                     // no le sirve y ensuciaba lo "recién publicado"
  .filter(j => j.tieneRol)                       // sin señal de ROL no entra, por muy LatAm que sea
  .filter(j => j.score >= (j.esAts ? 8 : 14))    // el ATS ya es señal: se le exige menos
  .filter(j => j.dias <= MAX_DIAS)
  .filter(j => j.elegibilidad !== 'cerrada')     // FILTRO DURO: no te hago perder el tiempo
  .sort((a, b) => {
    const peso = x => x.elegibilidad === 'abierta' ? 2 : x.elegibilidad === 'dudosa' ? 1 : 0;
    return (peso(b) - peso(a)) || (b.score - a.score);
  })
  .slice(0, TOP)
  .map(j => ({
    titulo: j.titulo, empresa: j.empresa || '—', url: j.url, fuente: j.fuente,
    fecha: j.fecha, dias: j.dias, ubicacion: j.ubicacion, salario: j.salario,
    score: j.score, motivos: j.motivos, peros: j.peros, esAts: !!j.esAts,
    horas: j.horas, kw: j.kw,
    elegibilidad: j.elegibilidad, elegibilidadNota: j.elegibilidadNota,
    tambienEn: [...new Set(j.tambienEn)]
  }));

const conRol = evaluadas.filter(j => j.tieneRol);
const descartadasPorRegion = conRol.filter(j => j.elegibilidad === 'cerrada').length;

const payload = {
  generatedAt: new Date().toISOString(),
  partial: errors.length > 0,
  errors,
  resumen: {
    revisadas: crudas.length,
    unicas: vistos.size,
    conRol: conRol.length,
    relevantes: relevantes.length,
    descartadasPorRegion,
    abiertas: relevantes.filter(j => j.elegibilidad === 'abierta').length,
    dudosas: relevantes.filter(j => j.elegibilidad === 'dudosa').length
  },
  fuentes: FUENTES.map(f => f.n).concat(empresas.map(e => e.nombre)),
  jobs: relevantes
};

/* Si el feed nuevo sale vacío y el anterior tenía algo, se conserva el
   anterior: mismo criterio que los recolectores de 12-FIN. */
if (!relevantes.length && previo?.jobs?.length) {
  console.error(`✗ 0 vacantes relevantes hoy. Se preserva el feed anterior de ${previo.jobs.length}.`);
  process.exit(1);
}

await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, JSON.stringify(payload), 'utf8');

const r = payload.resumen;
console.log(`✓ ${OUT} · ${r.revisadas} revisadas → ${r.unicas} únicas → ${r.conRol} con rol → ${r.relevantes} relevantes · ${errors.length ? 'PARCIAL' : 'completo'}`);
console.log(`   elegibilidad: ${r.abiertas} abiertas · ${r.dudosas} dudosas · ${r.descartadasPorRegion} descartadas por región`);
relevantes.slice(0, 10).forEach(j =>
  console.log(`   [${String(j.score).padStart(3)}] ${j.elegibilidad.padEnd(11)} ${(j.titulo || '').slice(0, 40).padEnd(42)} ${(j.motivos || []).slice(0, 3).join(', ')}`));
if (errors.length) console.log('   errores: ' + errors.join(' · '));
