// 14-WORK · Verifica frontend/data/rutas.json antes de publicarlo (código 1 si algo falla).
// Uso: node scripts/verificar-rutas.mjs
// Comprueba: cada ruta apunta a una habilidad que existe en rol-objetivo.json; ids únicos; formato didáctico completo
// (25-nov) y cada programa de Python o SQL da la salida que promete su estación; cada paso trae qué
// aprender, una práctica y al menos un recurso (https) o un enlace interno; los enlaces externos responden 200 hoy
// y los internos existen en frontend/. Un enlace roto o una habilidad mal escrita no se publican.
// Rutas por puntos (25-nov-2026, las que traen `medido`): vuelve a medir cada video en YouTube (fecha de publicación,
// vistas, me gusta, duración y capítulos citados), exige razón a lo descartado y a lo de más de 24 meses, y busca en
// su página oficial cada frase del examen, de las credenciales y de cada curso «gratis».
import { readFile, access } from 'node:fs/promises';
import { mkdtempSync, rmSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'frontend');
const errores = [];
const mal = (m) => errores.push(m);

let rutas, rol;
try { rutas = JSON.parse(await readFile(resolve(raiz, 'data/rutas.json'), 'utf8')); }
catch (e) { console.error('✗ no se pudo leer data/rutas.json: ' + e.message); process.exit(1); }
rol = JSON.parse(await readFile(resolve(raiz, 'data/rol-objetivo.json'), 'utf8'));
const habilidades = new Set(rol.competencias.map((c) => c.nombre));

const ids = new Set();
const externos = new Map();   // url → dónde aparece
const internos = new Map();
let pasos = 0;
for (const r of rutas.rutas || []) {
  if (ids.has(r.id)) mal(`ruta repetida: ${r.id}`); ids.add(r.id);
  if (!habilidades.has(r.competencia)) mal(`${r.id}: la habilidad «${r.competencia}» no está en rol-objetivo.json`);
  if (!r.queEs) mal(`${r.id}: falta «queEs»`);
  if (!Array.isArray(r.pasos) || r.pasos.length < 4 || r.pasos.length > 6) mal(`${r.id}: debe tener de 4 a 6 pasos`);
  (r.pasos || []).forEach((p, i) => {
    pasos++;
    const donde = `${r.id} › ${p.id || 'paso ' + (i + 1)}`;
    if (p.id !== `${r.id}-${i + 1}`) mal(`${donde}: el id debe ser ${r.id}-${i + 1}`);
    if (ids.has(p.id)) mal(`${donde}: id repetido`); ids.add(p.id);
    if (!p.titulo) mal(`${donde}: falta el título`);
    if (!Array.isArray(p.aprender) || !p.aprender.length) mal(`${donde}: falta «aprender»`);
    if (!p.practica) mal(`${donde}: falta la práctica`);
    if (!p.recurso && !p.enlace) mal(`${donde}: necesita un recurso o un enlace interno`);
    if (p.recurso) {
      if (!p.recurso.nombre || !p.recurso.proveedor) mal(`${donde}: al recurso le falta nombre o proveedor`);
      // «gratis» solo donde la propia fuente lo dice (comprobado el 24-nov): UiPath Academy («free online Academy
      // training») y Automate the Boring Stuff («Free to read under a Creative Commons license»).
      if (/grat/i.test(p.recurso.proveedor || '') && !/^(UiPath|Al Sweigart)\b/.test(p.recurso.proveedor)) mal(`${donde}: dice «gratis» sin que la fuente lo diga (${p.recurso.proveedor})`);
      if (!/^https:\/\//.test(p.recurso.url || '')) mal(`${donde}: el recurso no es https`);
      else externos.set(p.recurso.url, donde);
    }
    if (p.enlace) {
      if (!p.enlace.texto || !p.enlace.url) mal(`${donde}: al enlace le falta texto o url`);
      else if (/^https?:/.test(p.enlace.url)) externos.set(p.enlace.url, donde);
      else internos.set(p.enlace.url.split('#')[0], donde);
      if (/grat/i.test(p.enlace.texto || '')) mal(`${donde}: el enlace dice «gratis» sin fuente (${p.enlace.texto})`);
    }
  });
}

// Formato didáctico (25-nov): cada ruta trae disciplina, frase, 3 usos y portafolio; cada estación, lo que logras,
// la idea con algo que ya conoces, cómo usar el video o recurso, qué hacer, cómo comprobarlo y los errores típicos.
const DISCIPLINAS = new Set(['IA', 'Automatización', 'Datos', 'Procesos', 'Personas', 'Negocio']);
const texto = (v) => typeof v === 'string' && v.trim().length > 0;
const programas = [];   // código que se ejecuta para comprobar que da lo que la estación dice
for (const r of rutas.rutas || []) {
  if (!DISCIPLINAS.has(r.disciplina)) mal(`${r.id}: disciplina «${r.disciplina}» no es una de las 6`);
  if (!texto(r.frase)) mal(`${r.id}: falta la frase`);
  if (!Array.isArray(r.usos) || r.usos.length !== 3 || !r.usos.every(texto)) mal(`${r.id}: necesita 3 usos`);
  if (!texto(r.portafolio)) mal(`${r.id}: falta el portafolio`);
  for (const p of r.pasos || []) {
    const donde = `${r.id} › ${p.id}`;
    if (!texto(p.logro)) mal(`${donde}: falta «logro»`);
    const id = p.idea || {};
    if (!texto(id.titulo) || !Array.isArray(id.columnas) || id.columnas.length !== 2) mal(`${donde}: la idea necesita título y 2 columnas`);
    if (!Array.isArray(id.filas) || id.filas.length < 3 || !id.filas.every((f) => Array.isArray(f) && f.length === 2 && f.every(texto))) mal(`${donde}: la idea necesita 3 o más filas de 2 celdas`);
    if (p.hoja && (!Array.isArray(p.hoja.filas) || !p.hoja.filas.every((f) => Array.isArray(f) && f.length === p.hoja.columnas.length))) mal(`${donde}: la hoja tiene filas de largo distinto a sus columnas`);
    if (!texto(p.mira)) mal(`${donde}: falta «mira»`);
    if (!Array.isArray(p.hazlo) || p.hazlo.length < 2 || p.hazlo.length > 4 || !p.hazlo.every(texto)) mal(`${donde}: «hazlo» necesita de 2 a 4 tareas`);
    const c = p.comprueba || {};
    if (!texto(c.texto)) mal(`${donde}: falta el texto de «comprueba»`);
    if (c.valores && !c.valores.every((v) => Array.isArray(v) && v.length === 2 && v.every(texto))) mal(`${donde}: valores de «comprueba» mal formados`);
    if (!Array.isArray(p.errores) || p.errores.length < 2 || p.errores.length > 3 || !p.errores.every((e) => Array.isArray(e) && e.length === 2 && e.every(texto))) mal(`${donde}: necesita 2 o 3 errores típicos [qué, cómo]`);
    if (p.codigo) {
      if (!['python', 'sql', 'excel', 'dax', 'texto', 'json'].includes(p.codigo.lenguaje) || !texto(p.codigo.texto)) mal(`${donde}: código sin lenguaje válido o vacío`);
      if ((c.salida || c.patron) && ['python', 'sql'].includes(p.codigo.lenguaje)) programas.push({ donde, codigo: p.codigo, c });
      else if (['python', 'sql'].includes(p.codigo.lenguaje)) mal(`${donde}: el código ${p.codigo.lenguaje} necesita «salida» o «patron» para comprobarlo`);
    }
  }
}

// Ejecutar cada programa: Python con el intérprete del PC (en una carpeta temporal), SQL con node:sqlite en memoria.
const limpia = (s) => s.replace(/\r/g, '').split('\n').map((l) => l.replace(/\s+$/, '')).join('\n').replace(/\n+$/, '');
function salidaSql(sql) {
  const { DatabaseSync } = require('node:sqlite');
  const db = new DatabaseSync(':memory:');
  const lineas = [];
  for (const st of sql.split(/;\s*(?:\n|$)/).map((s) => s.trim()).filter(Boolean)) {
    const sinComentarios = st.replace(/^(--[^\n]*\n\s*)+/, '');
    if (/^(select|with)\b/i.test(sinComentarios)) for (const fila of db.prepare(st).all()) lineas.push(Object.values(fila).map((v) => v === null ? 'NULL' : String(v)).join(' | '));
    else db.exec(st);
  }
  return lineas.join('\n');
}
let corridos = 0;
for (const { donde, codigo, c } of programas) {
  let out;
  try {
    if (codigo.lenguaje === 'python') {
      const tmp = mkdtempSync(join(tmpdir(), 'ruta-'));
      const py = spawnSync(process.platform === 'win32' ? 'python3' : 'python3', ['-I', '-X', 'utf8', '-'], { input: codigo.texto, cwd: tmp, encoding: 'utf8', timeout: 60000 });
      rmSync(tmp, { recursive: true, force: true });
      if (py.status !== 0) { mal(`${donde}: el programa falló:\n${(py.stderr || py.error || '').toString().slice(-600)}`); continue; }
      out = py.stdout;
    } else out = salidaSql((codigo.preparar ? codigo.preparar + ';\n' : '') + codigo.texto);
  } catch (e) { mal(`${donde}: no se pudo ejecutar (${e.message})`); continue; }
  const o = limpia(out);
  if (c.salida !== undefined && o !== limpia(c.salida)) mal(`${donde}: la salida real no es la que dice la estación.\n--- dice:\n${c.salida}\n--- sale:\n${o}`);
  else if (c.patron && !new RegExp(c.patron).test(o)) mal(`${donde}: la salida «${o}» no cumple el patrón ${c.patron}`);
  else corridos++;
}

// Certificaciones (25-nov): cada ruta dice cuál es la de referencia (o por qué no hay) y cuál es la oficial gratis (o
// que no la hay y qué es lo más cercano). «Gratis», un precio o un aviso solo se publican si la frase que lo prueba está
// en la página oficial, que se abre aquí. Una página que se arma en el navegador lleva la fecha en que se comprobó a mano.
const pruebas = [];   // {donde, url, frases}
const videosExtra = [];   // alternativas y descartados de las rutas por puntos: también pasan por oEmbed
const fecha = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '');
for (const r of rutas.rutas || []) {
  const c = r.certificacion, donde = `${r.id} › certificación`;
  if (!c || !fecha(c.revisado)) { mal(`${donde}: falta, o no tiene fecha de revisión`); continue; }
  if (c.referencia) {
    const x = c.referencia;
    if (!texto(x.nombre) || !texto(x.emisor) || !texto(x.costo) || !/^https:\/\//.test(x.url || '')) mal(`${donde}: la de referencia está incompleta`);
    else { externos.set(x.url, donde); if (x.evidencia) pruebas.push({ donde: donde + ' (costo)', url: x.url, frases: x.evidencia }); }
    if (/\$|USD|EUR|€/.test(x.costo) && !x.evidencia) mal(`${donde}: el costo trae una cifra sin la frase de su página que la prueba`);
  } else if (!texto(c.referenciaNota)) mal(`${donde}: no hay referencia y no dice por qué`);
  if (c.gratis) {
    const g = c.gratis;
    if (!texto(g.nombre) || !texto(g.emisor) || !texto(g.tipo) || !/^https:\/\//.test(g.url || '') || !Array.isArray(g.evidencia) || !g.evidencia.every(texto)) mal(`${donde}: la gratis está incompleta o sin evidencia`);
    else {
      externos.set(g.url, donde);
      if (g.comprobadoEnNavegador) { if (!fecha(g.comprobadoEnNavegador)) mal(`${donde}: comprobadoEnNavegador sin fecha válida`); }
      else pruebas.push({ donde: donde + ' (gratis)', url: g.url, frases: g.evidencia });
    }
  } else if (!c.camino || !texto(c.camino.texto)) mal(`${donde}: no hay gratis y no dice qué es lo más cercano`);
  if (c.camino && c.camino.url) { externos.set(c.camino.url, donde); if (c.camino.evidencia) pruebas.push({ donde: donde + ' (camino)', url: c.camino.url, frases: c.camino.evidencia }); }
  if (c.aviso) { externos.set(c.aviso.url, donde); pruebas.push({ donde: donde + ' (aviso)', url: c.aviso.url, frases: c.aviso.evidencia }); }
}

// Rutas por puntos (25-nov-2026, pedido de Miguel): la ruta dice qué aprender primero (`orden`) y con qué se combina
// (`combina`); la certificación trae su examen con el temario oficial y las credenciales gratis del camino; cada punto
// trae su video principal medido, sus cursos con lo que muestra su página y los descartados con la razón. `medido` es la
// fecha de corte de las medidas. Lo que se vuelve a medir en YouTube va más abajo.
const medidos = [];   // {donde, v, medido, reciente}
for (const r of rutas.rutas || []) {
  if (!r.medido) continue;
  if (!fecha(r.medido)) mal(`${r.id}: «medido» sin fecha válida`);
  if (!texto(r.orden)) mal(`${r.id}: falta «orden» (qué aprender primero)`);
  const cb = r.combina || {};
  if (!(cb.antes || []).length && !(cb.abre || []).length) mal(`${r.id}: falta «combina» (de qué depende y qué abre)`);
  for (const x of [...(cb.antes || []), ...(cb.abre || [])]) if (!(rutas.rutas || []).some((q) => q.id === x.ruta) || !texto(x.porque)) mal(`${r.id}: «combina» apunta a «${x.ruta}», que no existe o no dice por qué`);
  const c = r.certificacion || {};
  if (c.examen) {
    const e = c.examen, donde = `${r.id} › examen`;
    if (!texto(e.codigo) || !/^https:\/\//.test(e.url || '') || !Array.isArray(e.evidencia)) mal(`${donde}: incompleto`);
    else { externos.set(e.url, donde); pruebas.push({ donde, url: e.url, frases: e.evidencia }); }
    for (const o of e.otras || []) { externos.set(o.url, donde); pruebas.push({ donde: donde + ' (otra página)', url: o.url, frases: o.evidencia }); }
    // Temario en PDF (Microsoft MOS): se comprueba que responde y se anota la fecha en que se leyó.
    if (e.temarioUrl) { externos.set(e.temarioUrl, donde); if (!fecha(e.temarioRevisado)) mal(`${donde}: temario ${e.temarioUrl} sin fecha de lectura (temarioRevisado)`); }
    if (e.temas) {
      const pesoOk = (t) => typeof t.peso === 'number' || (Array.isArray(t.pesoRango) && t.pesoRango.length === 2);
      if (!Array.isArray(e.temas) || e.temas.some((t) => !texto(t.nombre) || !pesoOk(t) || !r.pasos.some((p) => p.id === t.punto))) mal(`${donde}: cada tema necesita nombre, peso (o pesoRango) y el punto de la ruta que lo cubre`);
      else if (e.temas.some((t) => t.pesoRango)) {
        // Microsoft publica rangos («25–30 %»): la suma de los mínimos no pasa de 100 y la de los máximos llega a 100.
        const lo = e.temas.reduce((s, t) => s + (t.pesoRango ? t.pesoRango[0] : t.peso), 0), hi = e.temas.reduce((s, t) => s + (t.pesoRango ? t.pesoRango[1] : t.peso), 0);
        if (lo > 100 || hi < 100) mal(`${donde}: los rangos de peso (${lo}–${hi}) no pueden sumar 100`);
      } else if (e.temas.reduce((s, t) => s + t.peso, 0) !== 100) mal(`${donde}: los pesos de los temas no suman 100`);
    }
  }
  for (const k of c.credenciales || []) {
    const donde = `${r.id} › credencial «${k.nombre}»`;
    if (!texto(k.nombre) || !texto(k.emisor) || !/^https:\/\//.test(k.url || '') || !r.pasos.some((p) => p.id === k.punto) || !Array.isArray(k.evidencia) || !k.evidencia.every(texto)) { mal(`${donde}: incompleta`); continue; }
    externos.set(k.url, donde);
    if (k.comprobadoEnNavegador) { if (!fecha(k.comprobadoEnNavegador)) mal(`${donde}: comprobadoEnNavegador sin fecha válida`); }
    else pruebas.push({ donde, url: k.url, frases: k.evidencia });
  }
  for (const p of r.pasos || []) {
    const donde = `${r.id} › ${p.id}`;
    if (!p.video) mal(`${donde}: cada punto necesita su video principal`);
    else medidos.push({ donde: `${donde} (principal)`, v: p.video, medido: r.medido, reciente: true });
    for (const m of p.mas || []) {
      if (!['video', 'curso'].includes(m.tipo) || !texto(m.etiqueta)) mal(`${donde}: cada opción de «mas» necesita tipo y etiqueta`);
      if (m.tipo === 'video') { medidos.push({ donde: `${donde} (${m.etiqueta})`, v: m, medido: r.medido, reciente: true }); videosExtra.push({ ...m, donde }); }
    }
    for (const x of p.descartados || []) {
      if (!texto(x.razon)) mal(`${donde}: un descartado no dice por qué salió (${x.url})`);
      medidos.push({ donde: `${donde} (descartado)`, v: x, medido: r.medido, reciente: false }); videosExtra.push({ ...x, donde });
    }
    for (const k of [p.recurso, ...(p.mas || []).filter((m) => m.tipo === 'curso')].filter(Boolean)) {
      if (!texto(k.idioma) || !texto(k.porQue)) mal(`${donde}: al curso «${k.nombre}» le falta idioma o por qué se eligió`);
      if (!Array.isArray(k.datos) || !k.datos.length || !k.datos.every((x) => Array.isArray(x) && x.length === 2 && x.every(texto))) mal(`${donde}: «datos» del curso «${k.nombre}» mal formados (lo que muestra su página, o que no lo muestra)`);
      if (/^https:\/\//.test(k.url || '')) externos.set(k.url, donde); else mal(`${donde}: el curso «${k.nombre}» no es https`);
      if (k.gratis) {
        const g = k.gratis;
        if (!Array.isArray(g.evidencia) || !g.evidencia.every(texto)) mal(`${donde}: «gratis» sin la frase que lo prueba (${k.nombre})`);
        else if (g.comprobadoEnNavegador) { if (!fecha(g.comprobadoEnNavegador)) mal(`${donde}: comprobadoEnNavegador sin fecha válida (${k.nombre})`); }
        else pruebas.push({ donde: `${donde} (gratis: ${k.nombre})`, url: g.url || k.url, frases: g.evidencia });
      }
    }
  }
}
const plano = (h) => h.replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&trade;/g, '™').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16))).replace(/\s+/g, ' ').toLowerCase();
// Algunas páginas contestan 202 o 429 mientras deciden si somos un robot (OutSystems, 25-nov): se reintenta con pausa.
// Cada página se pide una sola vez: pedir la misma tres veces seguidas también dispara el 202.
const paginasWeb = new Map();
async function pedirWeb(u, n = 0) {
  const r = await fetch(u, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (compatible; da-2026-verificador/1.0)' }, signal: AbortSignal.timeout(30000) });
  if ([202, 429, 503].includes(r.status) && n < 4) { await new Promise((ok) => setTimeout(ok, 3000 * 2 ** n)); return pedirWeb(u, n + 1); }
  return { status: r.status, cuerpo: await r.text() };
}
async function traerWeb(u) {
  if (!paginasWeb.has(u)) paginasWeb.set(u, pedirWeb(u));
  const x = await paginasWeb.get(u);
  return { status: x.status, text: async () => x.cuerpo };
}
let frasesOk = 0;
await Promise.all(pruebas.map(async (p) => {
  try {
    const r = await traerWeb(p.url);
    const t = plano(await r.text());
    const faltan = p.frases.filter((f) => !t.includes(f.toLowerCase().replace(/\s+/g, ' ')));
    if (faltan.length) mal(`${p.donde}: la página ya no dice «${faltan.join('», «')}» (${p.url})`); else frasesOk += p.frases.length;
  } catch (e) { mal(`${p.donde}: no se pudo abrir ${p.url} (${e.message})`); }
}));

// Las 25 habilidades del mapa tienen ruta (pedido de Miguel, 24-nov) y cada ruta trae al menos un video.
for (const c of rol.competencias) if (!(rutas.rutas || []).some((r) => r.competencia === c.nombre)) mal(`la habilidad «${c.nombre}» no tiene ruta`);
const videos = new Map();   // url → {titulo, canal, donde}
for (const r of rutas.rutas || []) {
  const vs = (r.pasos || []).filter((p) => p.video);
  if (!vs.length) mal(`${r.id}: no tiene ningún video`);
  for (const p of vs) {
    const v = p.video;
    if (!/^https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11}$/.test(v.url || '') || !v.titulo || !v.canal) mal(`${r.id} › ${p.id}: video incompleto o con url rara`);
    else videos.set(v.url, { ...v, donde: `${r.id} › ${p.id}` });
  }
}
for (const v of videosExtra) {
  if (!/^https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11}$/.test(v.url || '') || !v.titulo || !v.canal) mal(`${v.donde}: video incompleto o con url rara (${v.url})`);
  else if (!videos.has(v.url)) videos.set(v.url, v);
}

// Cada video existe y su título y canal coinciden con lo que dice YouTube hoy (oEmbed, público, sin clave).
let videosOk = 0;
await Promise.all([...videos.values()].map(async (v) => {
  try {
    const r = await fetch('https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent(v.url), { signal: AbortSignal.timeout(30000) });
    let j;
    // 401 = el dueño desactivó la inserción: el video existe y su título y canal se leen de su página.
    if (r.status === 401) {
      // La página puede llegar vacía si YouTube está frenando: hasta 4 intentos con pausa creciente.
      const id = v.url.slice(-11);
      let t, a;
      for (let n = 0; n < 4 && !(t && a); n++) {
        if (n) await new Promise((ok) => setTimeout(ok, 8000 * n));
        const h = await (await fetch(v.url + '&hl=es', { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36', Cookie: 'SOCS=CAI; CONSENT=YES+1' }, signal: AbortSignal.timeout(30000) })).text();
        t = h.match(new RegExp(`"videoDetails":\\{"videoId":"${id}","title":"((?:[^"\\\\]|\\\\.)*)"`)); a = h.match(/"ownerChannelName":"((?:[^"\\]|\\.)*)"/);
      }
      if (!t || !a) { mal(`${v.donde}: el video ${v.url} no tiene inserción y su página no dice título y canal`); return; }
      j = { title: JSON.parse('"' + t[1] + '"'), author_name: JSON.parse('"' + a[1] + '"') };
    } else if (r.status !== 200) { mal(`${v.donde}: el video ${v.url} respondió ${r.status}`); return; }
    else j = await r.json();
    if (j.title !== v.titulo || j.author_name !== v.canal) mal(`${v.donde}: el video dice «${j.title}» de «${j.author_name}», no «${v.titulo}» de «${v.canal}»`);
    else videosOk++;
  } catch (e) { mal(`${v.donde}: el video ${v.url} no respondió (${e.message})`); }
}));

// Medidas de los videos (25-nov-2026): se vuelven a leer en la página pública de YouTube. La fecha de publicación debe
// ser la misma y la duración también; las vistas y los me gusta no pueden estar por debajo de lo que dice la ruta (con
// margen: YouTube a veces descuenta). Un video principal o alternativo con más de 24 meses a la fecha de corte solo se
// queda si dice por qué (`clasico`). Cada capítulo citado está en la descripción con su minuto y su nombre.
const UA_NAV = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36';
const paginasYT = new Map();
// YouTube deja de responder si se le piden muchas páginas a la vez (25-nov: 18 de 150 llegaron vacías): pocas a la vez,
// y si la página llega sin medidas se vuelve a pedir con pausa creciente.
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
let enCurso = 0;
const turno = async () => { while (enCurso >= 2) await pausa(200); enCurso++; await pausa(400); };
const leerYT = (url) => {
  if (!paginasYT.has(url)) paginasYT.set(url, (async () => {
    await turno();
    try {
      for (let intento = 0; ; intento++) {
        const h = await (await fetch(url + '&hl=es&gl=CO', { headers: { 'User-Agent': UA_NAV, 'Accept-Language': 'es-CO,es;q=0.9', Cookie: 'SOCS=CAI; CONSENT=YES+1' }, signal: AbortSignal.timeout(30000) })).text();
        const g = (re) => (h.match(re) || [])[1];
        const d = h.match(/"shortDescription":"((?:[^"\\]|\\.)*)"/);
        const y = { publicado: (g(/"publishDate":"([^"]+)"/) || '').slice(0, 10), vistas: +g(/"viewCount":"(\d+)"/) || 0, megusta: +g(/"likeCount":"(\d+)"/) || 0, minutos: Math.round((+g(/"lengthSeconds":"(\d+)"/) || 0) / 60), desc: d ? JSON.parse('"' + d[1] + '"') : '' };
        if ((y.publicado && y.vistas) || intento >= 4) return y;
        await pausa(5000 * 2 ** intento);
      }
    } finally { enCurso--; }
  })());
  return paginasYT.get(url);
};
const meses = (a, b) => (new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5 / 30.44;
let medidasOk = 0, capitulosOk = 0;
const sinRespuesta = [];   // YouTube a veces bloquea un rato: segunda vuelta al final, uno por uno, tras una pausa
const medir = async (m, segundaVuelta) => {
  const { donde, v, medido, reciente } = m;
  if (!segundaVuelta) {
    if (!fecha(v.publicado) || !(v.vistas > 0) || !(v.megusta > 0)) { mal(`${donde}: al video ${v.url} le falta fecha, vistas o me gusta`); return; }
    if (reciente && meses(v.publicado, medido) > 24 && !texto(v.clasico)) mal(`${donde}: el video es de ${v.publicado}, más de 24 meses antes del corte, y no dice por qué se queda (${v.url})`);
  }
  let y;
  try { y = await leerYT(v.url); } catch (e) { y = { error: e.message }; }
  if (y.error || !y.publicado || !y.vistas) {
    if (!segundaVuelta) { sinRespuesta.push(m); return; }
    mal(`${donde}: YouTube no devolvió las medidas de ${v.url}${y.error ? ` (${y.error})` : ''}`); return;
  }
  evaluar(m, y);
};
await Promise.all(medidos.map((m) => medir(m, false)));
if (sinRespuesta.length) {
  await pausa(45000);
  for (const m of sinRespuesta) { paginasYT.delete(m.v.url); await medir(m, true); await pausa(1500); }
}
function evaluar({ donde, v }, y) {
  let ok = true;
  if (y.publicado !== v.publicado) { ok = false; mal(`${donde}: YouTube dice publicado el ${y.publicado}, no el ${v.publicado}`); }
  if (y.vistas < v.vistas * 0.97) { ok = false; mal(`${donde}: hoy tiene ${y.vistas} vistas, menos de las ${v.vistas} que dice la ruta`); }
  if (y.megusta < v.megusta * 0.9) { ok = false; mal(`${donde}: hoy tiene ${y.megusta} me gusta, bastante menos de los ${v.megusta} que dice la ruta`); }
  if (v.minutos != null && Math.abs(y.minutos - v.minutos) > 1) { ok = false; mal(`${donde}: dura ${y.minutos} min, no ${v.minutos}`); }
  for (const k of v.capitulos || []) {
    // La línea puede empezar con emoji o paréntesis: «⌨️ (02:07:20) INNER JOIN», «0:17:49 👉 …», «05:27 …».
    const linea = y.desc.split('\n').find((l) => { const x = l.replace(/^[^\d]*/, ''); return x.startsWith(k.inicio) && /^[)\s\-–—|:]/.test(x.slice(k.inicio.length)); });
    if (!linea || !linea.includes(k.nombre)) { ok = false; mal(`${donde}: la descripción no tiene el capítulo ${k.inicio} «${k.nombre}»`); }
    else capitulosOk++;
  }
  if (ok) medidasOk++;
}

for (const [u, donde] of internos) {
  try { await access(resolve(raiz, u)); } catch { mal(`${donde}: el enlace interno ${u} no existe en frontend/`); }
}

const UA = 'Mozilla/5.0 (compatible; da-2026-verificador/1.0)';
let ok200 = 0;
await Promise.all([...externos].map(async ([u, donde]) => {
  try {
    const r = await traerWeb(u);
    if (r.status === 200) ok200++; else mal(`${donde}: ${u} respondió ${r.status}`);
  } catch (e) { mal(`${donde}: ${u} no respondió (${e.message})`); }
}));

if (errores.length) { console.error(`✗ ${errores.length} problema(s):\n  ` + errores.join('\n  ')); process.exit(1); }
console.log(`✓ ${rutas.rutas.length} rutas, ${pasos} pasos, ${ok200} enlaces externos con 200, ${videosOk} videos comprobados, ${internos.size} enlaces internos existentes, ${corridos} programas ejecutados con la salida que dicen, ${frasesOk} frases de certificación halladas en su página oficial, ${medidasOk} de ${medidos.length} medidas de video confirmadas en YouTube (fecha, vistas, me gusta, duración) y ${capitulosOk} capítulos citados que existen`);
