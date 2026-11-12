/* ═══════════════════════════════════════════════════════════════
   DA-2026 · Cazador de ofertas · videojuegos
   ─────────────────────────────────────────────────────────────
   Escribe frontend/data/ofertas-juegos.json con el TOP 3 de hoy.
   Corre en la foto diaria (GitHub Actions), sin llaves y sin navegador.

   Se puede comprar desde Colombia: cada candidata se confirma contra la
   propia tienda con el país puesto en Colombia.
   · Epic Games Store (country=CO) — juegos de pago que hoy están gratis.
   · Steam (api/appdetails con cc=co) — el precio y el descuento que ve una
     cuenta colombiana, en pesos. Si Steam no da precio para Colombia, la
     candidata se descarta.

   Qué es «bueno de verdad» (no basta un % alto):
   · reseñas de Steam: ≥ 85 % positivas y ≥ 5.000 reseñas (api/appreviews);
   · descuento ≥ 50 % en la tienda colombiana;
   · se ordena por descuento × calidad × popularidad.
   Candidatas: rebajas destacadas de Steam en Colombia + CheapShark (juegos
   con nota de prensa ≥ 80 en rebaja). CheapShark exige User-Agent con nombre.

   Regla: si una fuente falla se usa lo demás; si no queda ninguna candidata
   comprobada NO se toca el archivo (un hueco de un día no borra lo bueno).
═══════════════════════════════════════════════════════════════ */
import { writeFile } from 'node:fs/promises';
import { leerPrevio } from './_prev.mjs';

const SALIDA = new URL('../frontend/data/ofertas-juegos.json', import.meta.url);
const UA = 'cerebro-da2026/1.0 (+https://mikel696.github.io/da-2026/)';
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
const cop = (n) => 'COL$ ' + Math.round(n).toLocaleString('es-CO');

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
      titulo: g.title, tienda: 'Epic Games Store', url: `https://store.epicgames.com/es-ES/p/${slug}`,
      precio: 'Gratis', antes: precio.fmtPrice && precio.fmtPrice.originalPrice ? precio.fmtPrice.originalPrice : cop(pesos), ahorro: 100,
      vence: promo.endDate.slice(0, 10),
      colombia: 'Precio en pesos de la tienda de Epic para Colombia; se reclama con una cuenta gratis y queda tuyo.',
      porque: 'Juego de pago que hoy se reclama gratis y queda tuyo para siempre.',
      // Regalado no es lo mismo que bueno: Epic regala algo cada semana y de casi todo no hay reseñas que medir.
      // Solo pasa delante de las rebajas de Steam si vale 60.000 COP o más.
      imperdible: pesos >= 60000, _puntos: pesos >= 60000 ? 1000 + pesos / 1000 : 200,
    });
  }
  return out;
}

/** Ids de Steam con rebaja hoy: destacadas en Colombia + CheapShark (nota de prensa ≥ 80). */
async function candidatasSteam() {
  const ids = new Map();
  const [dest, cs] = await Promise.allSettled([
    traer('https://store.steampowered.com/api/featuredcategories?cc=co&l=spanish'),
    traer('https://www.cheapshark.com/api/1.0/deals?storeID=1&onSale=1&metacritic=80&sortBy=Savings&pageSize=60'),
  ]);
  if (dest.status === 'fulfilled') for (const x of (dest.value.specials && dest.value.specials.items) || []) ids.set(String(x.id), x.discount_expiration ? new Date(x.discount_expiration * 1000).toISOString().slice(0, 10) : '');
  if (cs.status === 'fulfilled') for (const d of cs.value) if (d.steamAppID && +d.steamRatingCount >= 5000 && +d.steamRatingPercent >= 85 && !ids.has(d.steamAppID)) ids.set(d.steamAppID, '');
  console.log(`Candidatas de Steam: ${ids.size} (destacadas ${dest.status === 'fulfilled' ? 'sí' : 'FALLÓ'}, CheapShark ${cs.status === 'fulfilled' ? 'sí' : 'FALLÓ'})`);
  return [...ids].slice(0, 45);
}

/** Confirma precio en Colombia y reseñas contra Steam. Devuelve solo lo que pasa el filtro. */
async function steamComprobadas(ids) {
  const out = [];
  for (const [id, vence] of ids) {
    try {
      const d = (await traer(`https://store.steampowered.com/api/appdetails?appids=${id}&cc=co&filters=price_overview`))[id];
      const p = d && d.success && d.data && d.data.price_overview;
      if (!p || p.currency !== 'COP' || p.discount_percent < 50) continue;
      await pausa(250);
      // Reseñas: el resumen oficial de Steam (appreviews) redirige a la portada desde nov-2026; SteamSpy da las mismas cuentas.
      const s = await traer(`https://steamspy.com/api.php?request=appdetails&appid=${id}`);
      const total = (s.positive || 0) + (s.negative || 0), pos = total ? (s.positive / total) * 100 : 0;
      if (!s.name || total < 5000 || pos < 85) continue;
      out.push({
        titulo: s.name, tienda: 'Steam', url: `https://store.steampowered.com/app/${id}/`,
        precio: cop(p.final / 100), antes: cop(p.initial / 100), ahorro: p.discount_percent, vence,
        colombia: 'Precio en pesos que ve una cuenta de Steam de Colombia (consultado a Steam hoy).',
        porque: `${Math.round(pos)} % de ${total.toLocaleString('es-CO')} reseñas de jugadores son positivas.`,
        imperdible: p.discount_percent >= 85 && pos >= 90 && total >= 50000,
        _puntos: p.discount_percent * (pos / 100) ** 2 * Math.log10(total),
      });
    } catch (e) { console.log(`  ${id}: ${e.message}`); }
    await pausa(250);
  }
  return out;
}

const hoy = new Date(Date.now() - 5 * 3600e3).toISOString().slice(0, 10);   // fecha en Colombia (UTC-5)
const [epic, ids] = await Promise.allSettled([epicGratis(), candidatasSteam()]);
const steam = ids.status === 'fulfilled' ? await steamComprobadas(ids.value) : [];
console.log(`Epic: ${epic.status === 'fulfilled' ? epic.value.length + ' gratis' : 'FALLÓ (' + epic.reason.message + ')'} · Steam comprobadas: ${steam.length}`);

const todas = [...(epic.status === 'fulfilled' ? epic.value : []), ...steam].sort((a, b) => b._puntos - a._puntos);
if (!todas.length) {
  const previo = await leerPrevio(SALIDA);
  console.log(`Ninguna candidata comprobada: se conserva el archivo anterior${previo ? ` (revisado ${previo.revisado})` : ''}.`);
  process.exit(0);
}
const top = todas.slice(0, 3).map((o) => { delete o._puntos; o.visto = hoy; return o; });
const salida = {
  revisado: hoy,
  fuentes: ['Epic Games Store (Colombia)', 'Steam (Colombia)', 'CheapShark'],
  criterio: 'Juego de pago gratis hoy, o rebaja de 50 % o más en la tienda de Steam para Colombia, con 85 % o más de reseñas positivas sobre 5.000 o más.',
  clase: { id: 'juegos', nombre: 'Videojuegos', icono: '🎮', ofertas: top, nota: '' },
};
const texto = JSON.stringify(salida, null, 2) + '\n';
const previo = await leerPrevio(SALIDA);
if (previo && JSON.stringify(previo, null, 2) + '\n' === texto) { console.log('Sin cambios.'); process.exit(0); }
await writeFile(SALIDA, texto);
for (const o of top) console.log(`· ${o.titulo} · ${o.tienda} · ${o.precio} (antes ${o.antes})${o.imperdible ? ' · IMPERDIBLE' : ''}`);
