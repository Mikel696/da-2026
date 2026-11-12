/* ═══════════════════════════════════════════════════════════════
   DA-2026 · Cazador de ofertas · videojuegos
   ─────────────────────────────────────────────────────────────
   Escribe frontend/data/ofertas-juegos.json con UNA oferta: la mejor de hoy.
   Corre en la foto diaria (GitHub Actions), sin llaves y sin navegador.

   Por qué solo videojuegos aquí: son la única clase con fuentes públicas y
   estables que responden JSON (medido el 10-nov-2026). La búsqueda de
   Mercado Libre devuelve 403 sin cuenta, y ropa, tecnología, cursos y
   conciertos no tienen una fuente así: esas las revisa el cazador diario
   (tarea programada de Claude) y viven en ofertas-caza.json.

   Fuentes:
   · Epic Games Store — juegos de pago que hoy están gratis (precios en COP).
   · CheapShark (cheapshark.com/api) — rebajas de Steam, en USD. Exige un
     User-Agent que identifique al cliente.

   Regla: si una fuente falla se usa la otra; si fallan las dos NO se toca
   el archivo. Un hueco de un día no borra el último dato bueno.
═══════════════════════════════════════════════════════════════ */
import { writeFile } from 'node:fs/promises';
import { leerPrevio } from './_prev.mjs';

const SALIDA = new URL('../frontend/data/ofertas-juegos.json', import.meta.url);
const UA = 'cerebro-da2026/1.0 (+https://mikel696.github.io/da-2026/)';

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
    out.push({
      titulo: g.title, tienda: 'Epic Games Store', url: `https://store.epicgames.com/es-ES/p/${slug}`,
      precio: 'Gratis', antes: precio.fmtPrice && precio.fmtPrice.originalPrice ? precio.fmtPrice.originalPrice : '', ahorro: 100,
      vence: promo.endDate.slice(0, 10), orden: precio.originalPrice,
      porque: 'Juego de pago que hoy se reclama gratis y queda tuyo para siempre.',
      // «Imperdible» solo si el juego vale 60.000 COP o más: Epic regala algo cada semana y casi todo es menor.
      imperdible: precio.originalPrice / 10 ** ((precio.currencyInfo && precio.currencyInfo.decimals) ?? 2) >= 60000,
    });
  }
  return out.sort((a, b) => b.orden - a.orden);
}

/** Rebajas de Steam de juegos muy bien valorados: nota de prensa ≥ 85, 85 % de reseñas positivas, 2 000 reseñas o más. */
async function steamRebajas() {
  const lista = await traer('https://www.cheapshark.com/api/1.0/deals?storeID=1&onSale=1&metacritic=85&upperPrice=25&sortBy=Savings&pageSize=40');
  return lista
    .filter((d) => +d.steamRatingPercent >= 85 && +d.steamRatingCount >= 2000 && d.steamAppID)
    .sort((a, b) => Math.round(b.savings) - Math.round(a.savings) || +b.metacriticScore - +a.metacriticScore || +b.steamRatingCount - +a.steamRatingCount)
    .map((d) => ({
      titulo: d.title.replace(/\s+/g, ' ').trim(), tienda: 'Steam', url: `https://store.steampowered.com/app/${d.steamAppID}/`,
      precio: `US$ ${d.salePrice}`, antes: `US$ ${d.normalPrice}`, ahorro: Math.round(d.savings), vence: '',
      porque: `Nota de la prensa ${d.metacriticScore}/100 y ${d.steamRatingPercent} % de reseñas positivas (${Number(d.steamRatingCount).toLocaleString('es-CO')}).`,
      imperdible: Math.round(d.savings) >= 90 && +d.metacriticScore >= 88 && +d.steamRatingCount >= 20000,
    }));
}

const hoy = new Date(Date.now() - 5 * 3600e3).toISOString().slice(0, 10);   // fecha en Colombia (UTC-5)
const [epic, steam] = await Promise.allSettled([epicGratis(), steamRebajas()]);
for (const [n, r] of [['Epic', epic], ['CheapShark', steam]]) console.log(r.status === 'fulfilled' ? `${n}: ${r.value.length} candidatas` : `${n}: FALLÓ (${r.reason.message})`);

const gratis = epic.status === 'fulfilled' ? epic.value : [], rebajas = steam.status === 'fulfilled' ? steam.value : [];
const mejor = gratis[0] || rebajas[0] || null;
if (epic.status === 'rejected' && steam.status === 'rejected') {
  const previo = await leerPrevio(SALIDA);
  console.log(`Las dos fuentes fallaron: se conserva el archivo anterior${previo ? ` (revisado ${previo.revisado})` : ' (no existe aún)'}.`);
  process.exit(0);
}
if (mejor) { delete mejor.orden; mejor.visto = hoy; }
const salida = {
  revisado: hoy,
  fuentes: [epic.status === 'fulfilled' ? 'Epic Games Store' : null, steam.status === 'fulfilled' ? 'CheapShark (Steam)' : null].filter(Boolean),
  criterio: 'Primero un juego de pago que hoy esté gratis; si no hay, la mayor rebaja de Steam entre juegos con nota de prensa ≥ 85 y ≥ 85 % de reseñas positivas.',
  clase: { id: 'juegos', nombre: 'Videojuegos', icono: '🎮', oferta: mejor, nota: mejor ? '' : 'Hoy ninguna rebaja pasa el filtro de calidad.' },
};
const texto = JSON.stringify(salida, null, 2) + '\n';
const previo = await leerPrevio(SALIDA);
if (previo && JSON.stringify(previo, null, 2) + '\n' === texto) { console.log('Sin cambios.'); process.exit(0); }
await writeFile(SALIDA, texto);
console.log(`Mejor de hoy: ${mejor ? `${mejor.titulo} · ${mejor.tienda} · ${mejor.precio}${mejor.imperdible ? ' · IMPERDIBLE' : ''}` : 'ninguna'}`);
