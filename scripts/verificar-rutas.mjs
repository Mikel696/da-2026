// 14-WORK · Verifica frontend/data/rutas.json antes de publicarlo (código 1 si algo falla).
// Uso: node scripts/verificar-rutas.mjs
// Comprueba: cada ruta apunta a una habilidad que existe en rol-objetivo.json; ids únicos; formato didáctico completo
// (25-nov) y cada programa de Python o SQL da la salida que promete su estación; cada paso trae qué
// aprender, una práctica y al menos un recurso (https) o un enlace interno; los enlaces externos responden 200 hoy
// y los internos existen en frontend/. Un enlace roto o una habilidad mal escrita no se publican.
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

// Cada video existe y su título y canal coinciden con lo que dice YouTube hoy (oEmbed, público, sin clave).
let videosOk = 0;
await Promise.all([...videos.values()].map(async (v) => {
  try {
    const r = await fetch('https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent(v.url), { signal: AbortSignal.timeout(30000) });
    if (r.status !== 200) { mal(`${v.donde}: el video ${v.url} respondió ${r.status}`); return; }
    const j = await r.json();
    if (j.title !== v.titulo || j.author_name !== v.canal) mal(`${v.donde}: el video dice «${j.title}» de «${j.author_name}», no «${v.titulo}» de «${v.canal}»`);
    else videosOk++;
  } catch (e) { mal(`${v.donde}: el video ${v.url} no respondió (${e.message})`); }
}));

for (const [u, donde] of internos) {
  try { await access(resolve(raiz, u)); } catch { mal(`${donde}: el enlace interno ${u} no existe en frontend/`); }
}

const UA = 'Mozilla/5.0 (compatible; da-2026-verificador/1.0)';
let ok200 = 0;
await Promise.all([...externos].map(async ([u, donde]) => {
  try {
    const r = await fetch(u, { redirect: 'follow', headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) });
    if (r.status === 200) ok200++; else mal(`${donde}: ${u} respondió ${r.status}`);
  } catch (e) { mal(`${donde}: ${u} no respondió (${e.message})`); }
}));

if (errores.length) { console.error(`✗ ${errores.length} problema(s):\n  ` + errores.join('\n  ')); process.exit(1); }
console.log(`✓ ${rutas.rutas.length} rutas, ${pasos} pasos, ${ok200} enlaces externos con 200, ${videosOk} videos comprobados, ${internos.size} enlaces internos existentes, ${corridos} programas ejecutados con la salida que dicen`);
