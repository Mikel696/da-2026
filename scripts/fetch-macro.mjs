/* ═══════════════════════════════════════════════════════════════
   DA-2026 · Foto diaria de los indicadores macro de Colombia
   ─────────────────────────────────────────────────────────────
   Corre en GitHub Actions (servidor), NO en el navegador.

   Por qué existe: el portal del Banco de la República entrega todos
   sus indicadores principales en una sola llamada, pero NO expone
   CORS. Desde el navegador había que pasar por un proxy público
   gratuito, y ese proxy devolvió 522 en producción — un tercero
   gratuito en el camino crítico es una dependencia frágil.

   Acá se trae del lado servidor (sin CORS de por medio) y se deja el
   resultado como archivo estático en el repo. El frontend lo lee de
   su MISMO origen: sin proxy, sin llaves, sin CORS, y funciona sin
   conexión porque viaja con la página.

   Sin dependencias: fetch global de Node 18+.
═══════════════════════════════════════════════════════════════ */

import { writeFile, mkdir } from 'node:fs/promises';
import { leerPrevio } from './_prev.mjs';
import { dirname } from 'node:path';

const BANREP = 'https://totoro.banrep.gov.co/estadisticas-economicas/DataSerie?tipoConsulta=indicadores_principales&idIndicador=1';
const TRM    = 'https://www.datos.gov.co/resource/ceyp-9c7c.json?$order=vigenciadesde%20DESC&$limit=400';
const OUT    = 'frontend/data/macro-co.json';

/* Mismo mapa que js/fin-colombia.js. Las etiquetas son NUESTRAS: el
   campo `unidad` del Banrep viene con la codificación rota. */
const SERIES = {
  '1':     { key: 'trm',    label: 'Dólar · TRM',       unit: 'COP',    kind: 'money' },
  '59':    { key: 'policy', label: 'Tasa de política',  unit: '% E.A.', kind: 'pct'   },
  '241':   { key: 'ibr',    label: 'IBR overnight',     unit: '%',      kind: 'pct'   },
  '15270': { key: 'cpi',    label: 'Inflación anual',   unit: '%',      kind: 'pct'   },
  '15271': { key: 'gdp',    label: 'PIB · crecimiento', unit: '%',      kind: 'pct'   },
  '15312': { key: 'unemp',  label: 'Desempleo',         unit: '%',      kind: 'pct'   },
  '15290': { key: 'cacc',   label: 'Cuenta corriente',  unit: '% PIB',  kind: 'pct'   }
};

const MAX_POINTS = 400;   // ~15 meses de serie diaria

/* Este script es el unico paso SIN continue-on-error: si revienta, la corrida
   entera falla y no se commitea nada (paso el 26-ago, corrida #42). Un fallo
   pasajero de red no puede costar la foto del dia, asi que reintenta. */
const REINTENTOS = 3;
const espera = ms => new Promise(r => setTimeout(r, ms));

async function getJson(url, label) {
  let ultimo;
  for (let intento = 1; intento <= REINTENTOS; intento++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'da-2026-cerebro/1.0 (+https://github.com/Mikel696/da-2026)' },
        signal: AbortSignal.timeout(45000)
      });
      if (!res.ok) throw new Error(`${label}: HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      ultimo = e;
      const msg = (e && (e.message || e.name)) || String(e);
      console.warn(`  · ${label} intento ${intento}/${REINTENTOS}: ${msg}`);
      if (intento < REINTENTOS) await espera(3000 * intento * intento);   // 3s, 12s
    }
  }
  throw ultimo;
}

async function fetchBanrep() {
  const raw = await getJson(BANREP, 'Banrep');
  const out = {};

  for (const [sid, meta] of Object.entries(SERIES)) {
    const s = raw[sid];
    if (!s || !Array.isArray(s.data) || !s.data.length) continue;

    const pts = s.data
      .filter(p => Array.isArray(p) && p.length >= 2 && Number.isFinite(+p[1]))
      .map(p => [+p[0], +p[1]]);
    if (!pts.length) continue;

    const last = pts[pts.length - 1];
    out[meta.key] = {
      label: meta.label, unit: meta.unit, kind: meta.kind,
      value: last[1],
      asOf: new Date(last[0]).toISOString(),
      source: 'Banco de la República',
      series: pts.slice(-MAX_POINTS)
    };
  }
  if (!Object.keys(out).length) throw new Error('Banrep: 0 series usables');
  return out;
}

async function fetchTrm() {
  const rows = await getJson(TRM, 'TRM');
  if (!Array.isArray(rows) || !rows.length) throw new Error('TRM: sin filas');

  const pts = rows
    .filter(r => r && Number.isFinite(+r.valor) && r.vigenciadesde)
    .map(r => [new Date(r.vigenciadesde).getTime(), +r.valor])
    .sort((a, b) => a[0] - b[0]);
  if (!pts.length) throw new Error('TRM: sin puntos válidos');

  const last = pts[pts.length - 1];
  return {
    label: 'Dólar · TRM', unit: 'COP', kind: 'money',
    value: last[1],
    asOf: new Date(last[0]).toISOString(),
    source: 'datos.gov.co · Superfinanciera',
    series: pts.slice(-MAX_POINTS)
  };
}

/* ── Main ── */

const errors = [];
const previo = await leerPrevio(OUT);
const data = Object.assign({}, (previo && previo.data) || {});   // base: lo último bueno

const [banrep, trm] = await Promise.allSettled([fetchBanrep(), fetchTrm()]);

if (banrep.status === 'fulfilled') Object.assign(data, banrep.value);
else errors.push(String(banrep.reason?.message || banrep.reason));

// datos.gov.co manda sobre Banrep para la TRM: misma cifra oficial, pero
// llega de la fuente que el navegador además puede consultar en directo.
if (trm.status === 'fulfilled') data.trm = trm.value;
else errors.push(String(trm.reason?.message || trm.reason));

if (!Object.keys(data).length) {
  console.error('✗ Ninguna fuente respondió. No se sobrescribe el archivo.');
  console.error(errors.join('\n'));
  process.exit(1);   // preserva la foto anterior en el repo
}

const payload = {
  generatedAt: new Date().toISOString(),
  sources: {
    banrep: 'https://totoro.banrep.gov.co/estadisticas-economicas/',
    trm:    'https://www.datos.gov.co/Econom-a-y-Finanzas/TRM/ceyp-9c7c'
  },
  partial: errors.length > 0,
  errors,
  data
};

await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, JSON.stringify(payload), 'utf8');

const n = Object.keys(data).length;
console.log(`✓ ${OUT} · ${n} series · ${errors.length ? 'PARCIAL' : 'completo'}`);
for (const [k, v] of Object.entries(data)) {
  console.log(`   ${k.padEnd(7)} ${String(v.value).padStart(12)} ${v.unit.padEnd(7)} corte ${v.asOf.slice(0, 10)} · ${v.series.length} pts`);
}
if (errors.length) console.log('   errores: ' + errors.join(' · '));
