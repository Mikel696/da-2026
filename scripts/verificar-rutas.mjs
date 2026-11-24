// 14-WORK · Verifica frontend/data/rutas.json antes de publicarlo (código 1 si algo falla).
// Uso: node scripts/verificar-rutas.mjs
// Comprueba: cada ruta apunta a una habilidad que existe en rol-objetivo.json; ids únicos; cada paso trae qué
// aprender, una práctica y al menos un recurso (https) o un enlace interno; los enlaces externos responden 200 hoy
// y los internos existen en frontend/. Un enlace roto o una habilidad mal escrita no se publican.
import { readFile, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

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
console.log(`✓ ${rutas.rutas.length} rutas, ${pasos} pasos, ${ok200} enlaces externos con 200, ${internos.size} enlaces internos existentes`);
