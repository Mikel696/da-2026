/* ═══════════════════════════════════════════════════════════════
   DA-2026 · Cazador de ofertas · videojuegos
   ─────────────────────────────────────────────────────────────
   Escribe frontend/data/ofertas-juegos.json con el TOP 3 de hoy.
   Corre en la foto diaria (GitHub Actions), sin llaves y sin navegador.

   Qué es «buena de verdad» (desde el 15-nov-2026; antes salían siempre
   los mismos 3 clásicos en su rebaja de siempre: «solo lo normal»):
   · está en su PRECIO MÁS BAJO REGISTRADO o a menos de 10 % de él
     (CheapShark, en dólares, todas las tiendas que sigue);
   · rebaja ≥ 50 % en la tienda de Steam PARA COLOMBIA, en pesos, y la
     misma rebaja que mide CheapShark (si no, el mínimo no aplica aquí);
   · reseñas ≥ 85 % positivas sobre ≥ 5.000 (SteamSpy);
   · NUEVA: lo que ya salió un día anterior no vuelve en 14 días, salvo
     que hoy esté al menos 10 % más barato. La memoria va en `vistos`.
   O bien: juego de pago que Epic regala hoy en Colombia.
   Orden: pesos que te ahorras × calidad (reseñas) × popularidad.

   Candidatas: rebajas de Steam con reseñas ≥ 85 % de CheapShark
   (6 páginas: por puntaje de la oferta y por reseñas). CheapShark exige
   User-Agent con nombre. La fecha de fin sale de las destacadas de Steam.

   Regla: si CheapShark falla NO se toca el archivo (un hueco de un día no
   borra lo bueno). Si las fuentes responden y no hay nada nuevo que cumpla,
   se escribe la clase vacía con su motivo: un hueco honesto, no relleno.
   HOY=AAAA-MM-DD fija la fecha (para probar el paso de un día a otro).
═══════════════════════════════════════════════════════════════ */
import { writeFile } from 'node:fs/promises';
import { leerPrevio } from './_prev.mjs';

const SALIDA = new URL('../frontend/data/ofertas-juegos.json', import.meta.url);
const UA = 'cerebro-da2026/1.0 (+https://mikel696.github.io/da-2026/)';
const SIN_REPETIR = 14, CERCA_DEL_MINIMO = 1.10, MAX_A_COMPROBAR = 20;
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
const cop = (n) => 'COL$ ' + Math.round(n).toLocaleString('es-CO');
const hoy = process.env.HOY || new Date(Date.now() - 5 * 3600e3).toISOString().slice(0, 10);   // fecha en Colombia (UTC-5)
const haceDias = (n) => new Date(Date.parse(hoy + 'T12:00:00Z') - n * 864e5).toISOString().slice(0, 10);
const dia = (unix) => new Date(unix * 1000).toISOString().slice(0, 10);

async function traer(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

/** Juegos de pago que Epic regala hoy en Colombia. */
async function epicGratis() {
  const j = await traer('https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=es-ES&country=CO&allowCountries=CO');
  const ahora = Date.now(), out = [];
  for (const g of j.data.Catalog.searchStore.elements) {
    const promo = ((g.promotions || {}).promotionalOffers || []).flatMap((x) => x.promotionalOffers || [])
      .find((o) => o.discountSetting && o.discountSetting.discountPercentage === 0 && new Date(o.startDate) <= ahora && new Date(o.endDate) > ahora);
    const precio = g.price && g.price.totalPrice;
    if (!promo || !precio || !(precio.originalPrice > 0)) continue;   // los que siempre son gratis no cuentan como oferta
    const slug = g.productSlug || (g.catalogNs && g.catalogNs.mappings && g.catalogNs.mappings[0] && g.catalogNs.mappings[0].pageSlug) || g.urlSlug;
    if (!slug) continue;
    const pesos = precio.originalPrice / 10 ** ((precio.currencyInfo && precio.currencyInfo.decimals) ?? 2);
    out.push({
      _id: 'epic:' + slug, _cop: 0,
      titulo: g.title, tienda: 'Epic Games Store', url: `https://store.epicgames.com/es-ES/p/${slug}`,
      precio: 'Gratis', antes: precio.fmtPrice && precio.fmtPrice.originalPrice ? precio.fmtPrice.originalPrice : cop(pesos), ahorro: 100,
      vence: promo.endDate.slice(0, 10),
      colombia: 'Precio en pesos de la tienda de Epic para Colombia; se reclama con una cuenta gratis y queda tuyo.',
      porque: 'Juego de pago que hoy se reclama gratis y queda tuyo para siempre.',
      // Regalado no es lo mismo que bueno: Epic regala algo cada semana y de casi todo no hay reseñas que medir.
      // Solo pasa delante de las rebajas de Steam si vale 60.000 COP o más; si no, llena un puesto que Steam deje libre.
      imperdible: pesos >= 60000, _puntos: pesos >= 60000 ? 1000 + pesos / 1000 : 0,
    });
  }
  return out;
}

/** Rebajas de Steam (≥ 50 %, reseñas ≥ 85 %) que están en su mínimo registrado o a menos de 10 % de él. */
async function rebajasEnMinimo() {
  const deals = new Map();
  for (const orden of ['Deal Rating', 'Reviews']) for (let p = 0; p < 3; p++) {
    const l = await traer(`https://www.cheapshark.com/api/1.0/deals?storeID=1&onSale=1&steamRating=85&sortBy=${encodeURIComponent(orden)}&pageSize=60&pageNumber=${p}`);
    // CheapShark cuenta menos reseñas que Steam: aquí se filtra suave y SteamSpy decide los 5.000.
    for (const d of l) if (d.steamAppID && +d.savings >= 50 && +d.steamRatingPercent >= 85 && +d.steamRatingCount >= 2000) deals.set(d.steamAppID, d);
    await pausa(700);
  }
  const ids = [...new Set([...deals.values()].map((d) => d.gameID))], hist = {};
  for (let i = 0; i < ids.length; i += 25) {
    Object.assign(hist, await traer('https://www.cheapshark.com/api/1.0/games?ids=' + ids.slice(i, i + 25).join(',')));
    await pausa(700);
  }
  const out = [];
  for (const d of deals.values()) {
    const h = hist[d.gameID], min = h && h.cheapestPriceEver ? +h.cheapestPriceEver.price : NaN;
    if (!(min > 0) || +d.salePrice > min * CERCA_DEL_MINIMO + 0.005) continue;
    const enMinimo = +d.salePrice <= min + 0.005;
    out.push({
      id: d.steamAppID, ahorroUS: Math.round(+d.savings), usd: +d.salePrice, min, minFecha: dia(h.cheapestPriceEver.date), enMinimo,
      resPct: +d.steamRatingPercent, resN: +d.steamRatingCount, titulo: d.title,
      _previo: (+d.normalPrice - +d.salePrice) * (+d.steamRatingPercent / 100) ** 2 * Math.log10(+d.steamRatingCount) * (enMinimo ? 1.3 : 1),
    });
  }
  console.log(`CheapShark: ${deals.size} rebajas ≥ 50 % con reseñas ≥ 85 % · ${out.length} en su mínimo o a menos de 10 %`);
  return out;
}

/** Fecha de fin de las rebajas destacadas de Steam en Colombia (CheapShark no la da). */
async function vencimientos() {
  const j = await traer('https://store.steampowered.com/api/featuredcategories?cc=co&l=spanish');
  return new Map(((j.specials && j.specials.items) || []).filter((x) => x.discount_expiration).map((x) => [String(x.id), dia(x.discount_expiration)]));
}

/** Confirma precio en Colombia y reseñas. Devuelve la oferta o null. */
async function comprobar(c, vence) {
  const d = (await traer(`https://store.steampowered.com/api/appdetails?appids=${c.id}&cc=co&filters=price_overview`))[c.id];
  const p = d && d.success && d.data && d.data.price_overview;
  const fuera = (porque) => { console.log(`  ${c.id} fuera: ${porque}`); return null; };
  if (!p || p.currency !== 'COP' || p.discount_percent < 50) return fuera(p ? `en Colombia ${p.currency} −${p.discount_percent} %` : 'sin precio para Colombia');
  // Otra rebaja en Colombia: el mínimo en dólares no dice nada aquí.
  if (Math.abs(p.discount_percent - c.ahorroUS) > 2) return fuera(`−${p.discount_percent} % en Colombia y −${c.ahorroUS} % en dólares`);
  await pausa(250);
  // Reseñas: el resumen oficial de Steam (appreviews) redirige a la portada desde nov-2026; SteamSpy da las mismas cuentas.
  const s = await traer(`https://steamspy.com/api.php?request=appdetails&appid=${c.id}`);
  // SteamSpy no tiene los juegos recién salidos: entonces valen las cuentas de Steam que trae CheapShark.
  const spy = (s.positive || 0) + (s.negative || 0), deSpy = spy > 0;
  const total = deSpy ? spy : c.resN, pos = deSpy ? (s.positive / spy) * 100 : c.resPct;
  if (total < 5000 || pos < 85) return fuera(`${Math.round(pos)} % de ${total} reseñas`);
  const ahorroCop = (p.initial - p.final) / 100;
  const minimo = c.enMinimo
    ? `Es su precio más bajo registrado (US$ ${c.min.toFixed(2)}, CheapShark).`
    : `Está a ${Math.round((c.usd / c.min - 1) * 100)} % de su precio más bajo registrado (US$ ${c.min.toFixed(2)} el ${c.minFecha}, CheapShark).`;
  return {
    _id: c.id, _cop: p.final / 100,
    titulo: s.name || c.titulo, tienda: 'Steam', url: `https://store.steampowered.com/app/${c.id}/`,
    precio: cop(p.final / 100), antes: cop(p.initial / 100), ahorro: p.discount_percent, vence: vence || '',
    colombia: 'Precio en pesos que ve una cuenta de Steam de Colombia (consultado a Steam hoy).',
    porque: `Te ahorras ${cop(ahorroCop).replace('COL$ ', '$ ')}. ${minimo} ${Math.round(pos)} % de ${total.toLocaleString('es-CO')} reseñas de jugadores son positivas (${deSpy ? 'SteamSpy' : 'Steam, vía CheapShark'}).`,
    minimo: c.enMinimo,
    // Mismo listón que Epic: imperdible si en un juego excelente, a su mínimo, te ahorras 60.000 pesos o más.
    imperdible: c.enMinimo && ahorroCop >= 60000 && pos >= 90 && total >= 20000,
    // Orden: los pesos que te ahorras, pesados por la calidad. Por % ganaban siempre los clásicos viejos de 90 %.
    _puntos: (ahorroCop / 1000) * (pos / 100) ** 2 * Math.log10(total) * (c.enMinimo ? 1.3 : 1),
  };
}

const previo = await leerPrevio(SALIDA);
// Memoria: { id, titulo, salio (día en que salió por primera vez), cop, usd }. Se guarda un mes.
const vistos = new Map(((previo && previo.vistos) || []).filter((v) => v.salio >= haceDias(30)).map((v) => [v.id, v]));
// Salió un día anterior, hace menos de 14 días: no vuelve, salvo que hoy esté al menos 10 % más barato.
const repetida = (id, { cop: pesos, usd } = {}) => {
  const v = vistos.get(id);
  if (!v || v.salio >= hoy || v.salio < haceDias(SIN_REPETIR)) return false;
  const bajo = (pesos != null && v.cop > 0 && pesos <= v.cop * 0.9) || (usd != null && v.usd > 0 && usd <= v.usd * 0.9);
  return !bajo;
};

const [epic, steam, fin] = await Promise.allSettled([epicGratis(), rebajasEnMinimo(), vencimientos()]);
if (steam.status !== 'fulfilled') {
  console.log(`CheapShark FALLÓ (${steam.reason.message}): se conserva el archivo anterior${previo ? ` (revisado ${previo.revisado})` : ''}.`);
  process.exit(0);
}
const vence = fin.status === 'fulfilled' ? fin.value : new Map();
const comprobadas = [];
let revisadas = 0, yaVistas = 0;
for (const c of steam.value.sort((a, b) => b._previo - a._previo)) {
  if (comprobadas.length >= 3 || revisadas >= MAX_A_COMPROBAR) break;
  if (repetida(c.id, { usd: c.usd })) { yaVistas++; continue; }
  revisadas++;
  try {
    const o = await comprobar(c, vence.get(c.id));
    if (o && !repetida(o._id, { cop: o._cop, usd: c.usd })) comprobadas.push({ ...o, _usd: c.usd });
  } catch (e) { console.log(`  ${c.id}: ${e.message}`); }
  await pausa(250);
}
for (const o of comprobadas) console.log(`  pasa: ${o.titulo} · ${Math.round(o._puntos)} puntos`);
const regaladas = (epic.status === 'fulfilled' ? epic.value : []).filter((o) => !repetida(o._id));
console.log(`Epic: ${epic.status === 'fulfilled' ? epic.value.length + ' gratis' : 'FALLÓ (' + epic.reason.message + ')'} · Steam: ${revisadas} comprobadas en la tienda, ${comprobadas.length} pasan · ${yaVistas} ya salieron antes`);

const top = [...regaladas, ...comprobadas].sort((a, b) => b._puntos - a._puntos).slice(0, 3);
for (const o of top) vistos.set(o._id, { id: o._id, titulo: o.titulo, salio: hoy, cop: o._cop, usd: o._usd || 0 });
const ofertas = top.map(({ _id, _cop, _usd, _puntos, ...o }) => ({ ...o, visto: hoy }));
const regla = 'en su precio más bajo registrado (o a menos de 10 %), con rebaja de 50 % o más en Steam Colombia y 85 % o más de reseñas positivas sobre 5.000 o más, y que no haya salido en los últimos 14 días';
const nota = ofertas.length === 3 ? '' : ofertas.length
  ? `De los juegos revisados hoy, solo ${ofertas.length === 1 ? 'uno está' : 'dos están'} ${regla}.`
  : `De los juegos revisados hoy, ninguno está ${regla}. Se vuelve a revisar varias veces al día.`;
const salida = {
  revisado: hoy,
  fuentes: ['Epic Games Store (Colombia)', 'Steam (Colombia)', 'CheapShark (rebajas y precio más bajo registrado)', 'SteamSpy (reseñas)'],
  criterio: 'Juego de pago que Epic regala hoy, o juego ' + regla + '.',
  clase: { id: 'juegos', nombre: 'Videojuegos', icono: '🎮', ofertas, nota },
  vistos: [...vistos.values()].sort((a, b) => b.salio.localeCompare(a.salio) || a.id.localeCompare(b.id)),
};
const texto = JSON.stringify(salida, null, 2) + '\n';
if (previo && JSON.stringify(previo, null, 2) + '\n' === texto) { console.log('Sin cambios.'); process.exit(0); }
await writeFile(SALIDA, texto);
for (const o of ofertas) console.log(`· ${o.titulo} · ${o.tienda} · ${o.precio} (antes ${o.antes})${o.minimo ? ' · MÍNIMO' : ''}${o.imperdible ? ' · IMPERDIBLE' : ''}`);
if (nota) console.log(nota);
