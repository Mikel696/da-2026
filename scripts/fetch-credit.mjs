/* ═══════════════════════════════════════════════════════════════
   DA-2026 · 12-FIN · Foto de tasas de CRÉDITO en Colombia
   ─────────────────────────────────────────────────────────────
   Corre en GitHub Actions. Va precomputado —y no en vivo— porque la
   agregación sobre qzsc-9esp (7,7M filas) tarda ~4,8 s por consulta:
   inaceptable para navegar. El comparador de CDT y el screener de
   fondos SÍ van en vivo (1,2 s y 0,9 s medidos).

   Fuentes (Superintendencia Financiera vía datos.gov.co):
     · qzsc-9esp — tasas activas por tipo de crédito, últimos 2 meses
       (el dataset yvb2-ppaa, que parecía el indicado, se congeló en
        junio de 2022: presentarlo como actual habría sido engañoso)
     · pare-7x5i — Tasa de Interés Bancario Corriente (TIBC).
       La tasa de USURA legal = TIBC × 1,5 · cobrar por encima es delito.
═══════════════════════════════════════════════════════════════ */

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const OUT  = 'frontend/data/credit-co.json';
const BASE = 'https://www.datos.gov.co/resource';
const UA   = 'da-2026-cerebro/1.0 (+https://github.com/Mikel696/da-2026)';

/* Tipos de crédito que le sirven a una persona. Se omiten los
   corporativos y de tesorería: no aplican a un consumidor. */
const TIPOS = [
  { t:'Consumo',            label:'Consumo / libre inversión', why:'El crédito de libranza, de consumo o compra de cartera.' },
  { t:'Vivienda',           label:'Vivienda',                  why:'Compra de casa o apartamento.' },
  { t:'Crédito productivo', label:'Productivo',                why:'Para negocio o emprendimiento.' },
  { t:'Comercial ordinario',label:'Comercial ordinario',       why:'Empresarial en pesos.' }
];

const MIN_CREDITOS = 200;   // por debajo, el promedio de un banco es ruido
const TOP = 18;

const get = async url => {
  const res = await fetch(url, { headers:{ 'User-Agent': UA }, signal: AbortSignal.timeout(90000) });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
};

/* ── Tasa de usura vigente ── */
async function fetchUsura() {
  const rows = await get(`${BASE}/pare-7x5i.json?$order=vigencia_desde%20DESC&$limit=40`);
  if (!Array.isArray(rows) || !rows.length) throw new Error('TIBC sin filas');

  // Se queda con la vigencia más reciente por modalidad.
  const porMod = new Map();
  for (const r of rows) {
    const mod = r.modalidad;
    if (!mod) continue;
    if (!porMod.has(mod)) porMod.set(mod, r);
  }
  const out = [];
  for (const [mod, r] of porMod) {
    const tibc = parseFloat(String(r.interes_bancario_corriente).replace('%','').replace(',','.'));
    if (!isFinite(tibc)) continue;
    out.push({
      modalidad: mod,
      tibc,
      usura: tibc * 1.5,          // fórmula legal: 1,5 × TIBC
      desde: r.vigencia_desde || null,
      hasta: r.vigencia_hasta || null
    });
  }
  if (!out.length) throw new Error('TIBC no parseable');
  return out;
}

/* ── Tasas por banco y tipo de crédito ── */
async function fetchTipo(def, fecha) {
  const q = `${BASE}/qzsc-9esp.json?` +
    `$select=nombre_entidad,avg(tasa_efectiva_promedio) as tasa,` +
    `sum(numero_de_creditos) as n,sum(montos_desembolsados) as monto` +
    `&$where=fecha_corte='${fecha}' AND tipo_de_cr_dito='${def.t}' AND tasa_efectiva_promedio>0` +
    `&$group=nombre_entidad&$having=sum(numero_de_creditos)>${MIN_CREDITOS}` +
    `&$order=tasa ASC&$limit=${TOP}`;

  const rows = await get(encodeURI(q));
  const bancos = (Array.isArray(rows) ? rows : [])
    .map(r => ({
      banco: r.nombre_entidad,
      tasa: +parseFloat(r.tasa).toFixed(2),
      creditos: +r.n,
      monto: +r.monto
    }))
    /* Filtro anti-artefacto: un 0% o un 1% de "consumo" no es una oferta
       real, es un producto promocional o un error de reporte. Igual que
       los fondos en liquidación con 1.500% anual en el screener de FIC. */
    .filter(b => b.tasa >= 2 && isFinite(b.tasa));

  if (!bancos.length) throw new Error(def.t + ': sin bancos tras filtrar');
  return { tipo: def.t, label: def.label, why: def.why, bancos };
}

/* ── Main ── */

const errors = [];

let fecha = null;
try {
  const m = await get(`${BASE}/qzsc-9esp.json?$select=max(fecha_corte)`);
  fecha = m?.[0]?.max_fecha_corte;
} catch (e) { errors.push('fecha de corte: ' + e.message); }

if (!fecha) {
  console.error('✗ Sin fecha de corte no se puede consultar. Se preserva la foto anterior.');
  process.exit(1);
}

const [usuraRes, ...tipoRes] = await Promise.allSettled([
  fetchUsura(),
  ...TIPOS.map(d => fetchTipo(d, fecha))
]);

const usura = usuraRes.status === 'fulfilled' ? usuraRes.value : [];
if (usuraRes.status !== 'fulfilled') errors.push('usura: ' + (usuraRes.reason?.message || usuraRes.reason));

const tipos = [];
tipoRes.forEach((r, i) => {
  if (r.status === 'fulfilled') tipos.push(r.value);
  else errors.push(TIPOS[i].label + ': ' + (r.reason?.message || r.reason));
});

if (!tipos.length && !usura.length) {
  console.error('✗ Nada usable. Se preserva la foto anterior.');
  console.error(errors.join('\n'));
  process.exit(1);
}

const payload = {
  generatedAt: new Date().toISOString(),
  fechaCorte: fecha,
  minCreditos: MIN_CREDITOS,
  partial: errors.length > 0,
  errors,
  usura,
  tipos,
  fuente: 'Superintendencia Financiera vía datos.gov.co (qzsc-9esp · pare-7x5i)'
};

await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, JSON.stringify(payload), 'utf8');

console.log(`✓ ${OUT} · corte ${fecha.slice(0,10)} · ${tipos.length} tipos · ${usura.length} modalidades de usura · ${errors.length ? 'PARCIAL' : 'completo'}`);
usura.forEach(u => console.log(`   USURA ${u.modalidad.padEnd(34)} TIBC ${u.tibc.toFixed(2)}% → tope legal ${u.usura.toFixed(2)}%`));
tipos.forEach(t => {
  const b = t.bancos[0];
  console.log(`   ${t.label.padEnd(26)} ${t.bancos.length} bancos · más barato: ${b.tasa}% (${b.banco.slice(0,30)})`);
});
if (errors.length) console.log('   errores: ' + errors.join(' · '));
