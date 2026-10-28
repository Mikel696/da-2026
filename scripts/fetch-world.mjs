/* ═══════════════════════════════════════════════════════════════
   DA-2026 · 12-FIN · Foto diaria de mercados y prensa financiera
   ─────────────────────────────────────────────────────────────
   Corre en GitHub Actions (servidor), NO en el navegador.

   Por qué del lado servidor:
   · Yahoo Finance devuelve 429 a las peticiones del navegador pero
     responde bien desde un servidor.
   · Los RSS no exponen CORS; desde el navegador harían falta proxies
     públicos, y esos ya se eliminaron del proyecto por frágiles
     (allorigins daba 522 intermitente).
   Resultado: frontend/data/world.json, servido desde el MISMO origen.

   Sin dependencias: fetch global de Node 18+.
═══════════════════════════════════════════════════════════════ */

import { writeFile, mkdir } from 'node:fs/promises';
import { leerPrevio, conservarSiVacio, fusionarPorClave } from './_prev.mjs';
import { dirname } from 'node:path';

const OUT = 'frontend/data/world.json';
const UA  = 'Mozilla/5.0 (compatible; da-2026-cerebro/1.0; +https://github.com/Mikel696/da-2026)';

/* ── Qué se sigue y por qué ──
   No es una lista de "las acciones de moda": cada símbolo tiene una razón
   de estar acá para alguien que vive en Colombia. */
const SYMBOLS = [
  { s:'^GSPC',     k:'sp500',  n:'S&P 500',        g:'indices', why:'El termómetro de la bolsa de EE. UU.' },
  { s:'^IXIC',     k:'nasdaq', n:'Nasdaq',         g:'indices', why:'Tecnología: manda en el ánimo global.' },
  { s:'^VIX',      k:'vix',    n:'VIX · miedo',    g:'indices', why:'Sube cuando el mercado se asusta.' },
  { s:'BZ=F',      k:'brent',  n:'Petróleo Brent', g:'materias',why:'Colombia exporta petróleo: cuando sube, al peso le va mejor.' },
  { s:'GC=F',      k:'oro',    n:'Oro',            g:'materias',why:'Refugio clásico cuando hay miedo o inflación.' },
  { s:'KC=F',      k:'cafe',   n:'Café',           g:'materias',why:'Segunda exportación agrícola del país.' },
  { s:'DX-Y.NYB',  k:'dxy',    n:'Índice del dólar',g:'divisas',why:'Mide al dólar contra el mundo. Sube = presión sobre el peso.' },
  { s:'COP=X',     k:'usdcop', n:'USD/COP mercado',g:'divisas', why:'El dólar en el mercado, distinto de la TRM oficial del día.' },
  { s:'EC',        k:'ecopet', n:'Ecopetrol (NY)', g:'colombia',why:'La empresa más grande del país, cotizando en Nueva York.' },
  { s:'CIB',       k:'bancol', n:'Bancolombia (NY)',g:'colombia',why:'El banco más grande, en dólares.' }
];

const FEEDS = [
  { u:'https://www.larepublica.co/rss/economia',        n:'La República',    tag:'🇨🇴' },
  { u:'https://www.valoraanalitik.com/feed/',           n:'Valora Analitik', tag:'🇨🇴' },
  { u:'https://feeds.a.dj.com/rss/RSSMarketsMain.xml',  n:'WSJ Markets',     tag:'🌎' },
  { u:'https://www.cnbc.com/id/100003114/device/rss/rss.html', n:'CNBC',     tag:'🌎' },
  { u:'https://feeds.bbci.co.uk/news/business/rss.xml', n:'BBC Business',    tag:'🌎' }
];

/* Pool amplio a propósito: para escoger las 5 con más impacto hay que tener
   de dónde escoger. Al muro solo llegan 24; el resto existe para puntuar. */
const MAX_PER_FEED = 25;
const SPARK_POINTS = 30;

const get = async (url, asText) => {
  const res = await fetch(url, { headers:{ 'User-Agent': UA }, signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return asText ? res.text() : res.json();
};

/* ── Mercados ── */

async function fetchSymbol(def) {
  const j = await get(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(def.s)}?range=1mo&interval=1d`);
  const r = j?.chart?.result?.[0];
  if (!r) throw new Error('sin resultado');

  const closes = (r.indicators?.quote?.[0]?.close || []).filter(x => x != null && isFinite(x));
  const price  = r.meta?.regularMarketPrice;
  if (!isFinite(price) || closes.length < 2) throw new Error('sin precios usables');

  /* OJO: meta.previousClose viene undefined y meta.chartPreviousClose es el
     cierre ANTERIOR AL RANGO (un mes atrás), no el de ayer. Usarlo daba
     "-0,08%" donde la variación real del día era "-0,28%". Se calcula
     siempre desde la serie de cierres. */
  const prev = closes[closes.length - 2];
  const dayPct = ((price - prev) / prev) * 100;
  const monthPct = ((price - closes[0]) / closes[0]) * 100;

  return {
    key: def.k, name: def.n, group: def.g, why: def.why,
    price,
    currency: r.meta?.currency || '',
    dayPct, monthPct,
    series: closes.slice(-SPARK_POINTS),
    asOf: r.meta?.regularMarketTime ? new Date(r.meta.regularMarketTime * 1000).toISOString() : null,
    source: 'Yahoo Finance'
  };
}

async function fetchCrypto() {
  const j = await get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true');
  const out = [];
  const map = { bitcoin:'Bitcoin', ethereum:'Ethereum' };
  for (const [id, name] of Object.entries(map)) {
    const d = j[id];
    if (!d || !isFinite(d.usd)) continue;
    out.push({
      key:id, name, group:'cripto',
      why: id === 'bitcoin' ? 'El activo más volátil del tablero: sirve de referencia de apetito por riesgo.'
                            : 'La segunda cripto por tamaño.',
      price:d.usd, currency:'USD',
      dayPct: isFinite(d.usd_24h_change) ? d.usd_24h_change : null,
      monthPct:null, series:[], asOf:new Date().toISOString(), source:'CoinGecko'
    });
  }
  return out;
}

/* ── Prensa ── */

const stripCdata = s => s.replace(/^\s*<!\[CDATA\[/, '').replace(/\]\]>\s*$/, '').trim();
/* Entidades HTML. Las numéricas (&#124;, &#8217;, &#x2019;) son comunes en
   los feeds de prensa y sin esto salen crudas en el titular. El &amp; va
   AL FINAL: si se resolviera primero, "&amp;#124;" se volvería "&#124;" y
   la siguiente pasada lo convertiría en "|", cambiando el texto original. */
const NAMED = { lt:'<', gt:'>', quot:'"', apos:"'", nbsp:' ', laquo:'«', raquo:'»',
                hellip:'…', mdash:'—', ndash:'–', rsquo:'’', lsquo:'‘',
                ldquo:'“', rdquo:'”' };
const decode = s => s
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g,         (_, d) => String.fromCodePoint(+d))
  .replace(/&([a-z]+);/gi, (m, n) => NAMED[n.toLowerCase()] ?? m)
  .replace(/&amp;/g, '&');
const tag = (block, name) => {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? decode(stripCdata(m[1])).replace(/<[^>]+>/g, '').trim() : '';
};

async function fetchFeed(f) {
  const xml = await get(f.u, true);
  const items = xml.split(/<item[\s>]/i).slice(1, MAX_PER_FEED + 1);
  const out = [];
  for (const raw of items) {
    const title = tag(raw, 'title');
    let link = tag(raw, 'link');
    if (!link) {
      const m = raw.match(/<link[^>]*href="([^"]+)"/i);   // Atom
      if (m) link = m[1];
    }
    if (!title || !link || !/^https?:\/\//.test(link)) continue;
    const dateRaw = tag(raw, 'pubDate') || tag(raw, 'published') || tag(raw, 'updated');
    const d = dateRaw ? new Date(dateRaw) : null;
    out.push({
      title: title.slice(0, 180),
      link,
      date: (d && !isNaN(d)) ? d.toISOString() : null,
      source: f.n,
      tag: f.tag
    });
  }
  if (!out.length) throw new Error('0 titulares parseados');
  return out;
}

/* ── Main ── */

const errors = [];
const previo = await leerPrevio(OUT);

const marketResults = await Promise.allSettled([
  ...SYMBOLS.map(fetchSymbol),
  fetchCrypto()
]);

let markets = [];
marketResults.forEach((r, i) => {
  if (r.status === 'fulfilled') {
    markets = markets.concat(Array.isArray(r.value) ? r.value : [r.value]);
  } else {
    const who = i < SYMBOLS.length ? SYMBOLS[i].n : 'cripto';
    errors.push(`${who}: ${r.reason?.message || r.reason}`);
  }
});

const feedResults = await Promise.allSettled(FEEDS.map(fetchFeed));
let news = [];
feedResults.forEach((r, i) => {
  if (r.status === 'fulfilled') news = news.concat(r.value);
  else errors.push(`${FEEDS[i].n}: ${r.reason?.message || r.reason}`);
});

// Más recientes primero; las sin fecha al final.
news.sort((a, b) => (b.date ? Date.parse(b.date) : 0) - (a.date ? Date.parse(a.date) : 0));
const poolCompleto = news;          // se puntúa sobre TODO lo traído
news = news.slice(0, 24);           // al muro solo van las 24 más recientes

/* ── Las 5 del día ──────────────────────────────────────────────
   "Relevante" no es "reciente". Se puntúa por IMPACTO SOBRE EL
   BOLSILLO de alguien que vive en Colombia, con criterios explícitos
   y el motivo guardado en cada nota: un ranking sin criterio visible
   es una caja negra, y este módulo no las usa. */
const TEMAS = [
  { re:/\b(d[oó]lar|trm|peso colombiano|tasa de cambio|devaluaci[oó]n|revaluaci[oó]n)\b/i, p:5, t:'el dólar' },
  { re:/\b(inflaci[oó]n|ipc|costo de vida|precios al consumidor)\b/i,                       p:5, t:'la inflación' },
  { re:/\b(banco de la rep[uú]blica|banrep|tasa de inter[eé]s|tasas de inter[eé]s|pol[ií]tica monetaria)\b/i, p:5, t:'las tasas' },
  { re:/\b(salario m[ií]nimo|reforma (tributaria|pensional|laboral)|impuestos?|dian)\b/i,   p:4, t:'lo que te descuentan' },
  { re:/\b(ecopetrol|bancolombia|grupo aval|cibest|nutresa|isa|colcap|bvc|bolsa de valores)\b/i, p:3, t:'empresas colombianas' },
  { re:/\b(petr[oó]leo|brent|crudo|caf[eé]|carb[oó]n)\b/i,                                  p:3, t:'lo que Colombia exporta' },
  { re:/\b(cdt|ahorro|cr[eé]dito|hipotec|usura|endeudamiento)\b/i,                          p:3, t:'ahorro y crédito' },
  { re:/\b(fed|reserva federal|recesi[oó]n|wall street|s&p|nasdaq)\b/i,                     p:2, t:'mercados globales' },
  { re:/\b(empleo|desempleo|pib|crecimiento econ[oó]mico)\b/i,                              p:2, t:'la economía del país' }
];

const HORAS_DIA = 30;   // "del día" con margen para husos y publicación nocturna

function puntuar(n) {
  const txt = n.title || '';
  let score = 0;
  const motivos = [];
  for (const t of TEMAS) {
    if (t.re.test(txt)) { score += t.p; if (!motivos.includes(t.t)) motivos.push(t.t); }
  }
  if (!score) return null;                       // sin tema de impacto → fuera
  // La prensa financiera local pesa más: le habla directo a su bolsillo.
  if (n.tag === '🇨🇴') score += 2;
  // Frescura: dentro del día suma, más viejo resta.
  const h = n.date ? (Date.now() - Date.parse(n.date)) / 3600000 : 999;
  if (h <= 6) score += 3; else if (h <= 12) score += 2; else if (h <= 24) score += 1;
  return { score, motivos, horas: h };
}

const candidatas = poolCompleto
  .map(n => { const s = puntuar(n); return s ? Object.assign({}, n, s) : null; })
  .filter(n => n && n.horas <= HORAS_DIA)
  .sort((a, b) => b.score - a.score);

/* Diversidad de fuentes: máximo 2 por medio, para que un solo diario
   no se quede con las 5 y el panel deje de mostrar el panorama. */
const porFuente = {};
const destacadas = [];
for (const n of candidatas) {
  porFuente[n.source] = (porFuente[n.source] || 0) + 1;
  if (porFuente[n.source] > 2) continue;
  destacadas.push({ title:n.title, link:n.link, date:n.date, source:n.source, tag:n.tag,
                    score:n.score, motivos:n.motivos });
  if (destacadas.length === 5) break;
}

if (!markets.length && !news.length) {
  console.error('✗ Ni mercados ni noticias. No se sobrescribe el archivo.');
  console.error(errors.join('\n'));
  process.exit(1);            // preserva la foto anterior
}

// Cada instrumento conserva su último valor bueno: si Yahoo falla con
// un símbolo, ese no desaparece del tablero — queda con su fecha.
const marketsFinal    = fusionarPorClave(markets, previo && previo.markets, m => m.key, 'mercados', errors);
const newsFinal       = conservarSiVacio(news,       previo && previo.news,       'titulares', errors);
const destacadasFinal = conservarSiVacio(destacadas, previo && previo.destacadas, 'selección del día', errors);

const payload = {
  generatedAt: new Date().toISOString(),
  partial: errors.length > 0,
  errors,
  markets: marketsFinal,
  news: newsFinal,
  destacadas: destacadasFinal
};

await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, JSON.stringify(payload), 'utf8');

console.log(`✓ ${OUT} · ${marketsFinal.length} instrumentos · ${newsFinal.length} titulares · ${errors.length ? 'PARCIAL' : 'completo'}`);
marketsFinal.forEach(m => console.log(
  `   ${m.name.padEnd(20)} ${String(m.price).padStart(11)} ${(m.currency||'').padEnd(4)} ` +
  `${m.dayPct != null ? (m.dayPct >= 0 ? '+' : '') + m.dayPct.toFixed(2) + '%' : '—'}`
));
console.log(`   titulares por fuente: ${[...new Set(newsFinal.map(n => n.source))].join(', ')}`);
console.log(`   ── LAS ${destacadasFinal.length} DEL DÍA ──`);
destacadasFinal.forEach((d,i) => console.log(`   ${i+1}. [${String(d.score).padStart(2)}] ${d.source.padEnd(16)} ${d.motivos.join(', ').padEnd(30)} ${d.title.slice(0,52)}`));
if (errors.length) console.log('   errores: ' + errors.join(' · '));
