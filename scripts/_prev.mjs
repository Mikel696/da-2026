/* ═══════════════════════════════════════════════════════════════
   DA-2026 · Helper compartido de los recolectores
   ─────────────────────────────────────────────────────────────
   Existe por un fallo real del 2026-08-12: la fuente del tope de
   usura falló de forma transitoria durante la corrida y el
   recolector escribió el archivo igual, con `usura: []`. Resultado:
   una caída de 30 segundos borró un dato que llevaba días bueno.

   La guardia que había solo preservaba el archivo anterior si
   fallaba TODO. Pero el daño real lo hace el éxito parcial: escribe,
   parece que funcionó, y se lleva por delante lo que sí servía.

   Regla que implementa esto: **una sección que falla conserva su
   último valor bueno; nunca se degrada a vacío.** Es la misma idea
   que ya aplica el frontend (mostrar el último dato con su fecha),
   trasladada al pipeline.
═══════════════════════════════════════════════════════════════ */

import { readFile } from 'node:fs/promises';

/** Lee la foto anterior. Devuelve null si no existe o está rota. */
export async function leerPrevio(ruta) {
  try {
    const txt = await readFile(ruta, 'utf8');
    const j = JSON.parse(txt);
    return (j && typeof j === 'object') ? j : null;
  } catch { return null; }
}

/**
 * Devuelve `nuevo` si trae contenido; si no, el valor anterior.
 * @param {*} nuevo      lo que se acaba de traer (array u objeto)
 * @param {*} previo     lo que había en el archivo
 * @param {string} etiqueta  nombre para el log
 * @param {string[]} avisos  se le agrega una nota si se conservó lo viejo
 */
export function conservarSiVacio(nuevo, previo, etiqueta, avisos) {
  const vacio = nuevo == null ||
    (Array.isArray(nuevo) && !nuevo.length) ||
    (!Array.isArray(nuevo) && typeof nuevo === 'object' && !Object.keys(nuevo).length);

  if (!vacio) return nuevo;

  const previoVacio = previo == null ||
    (Array.isArray(previo) && !previo.length) ||
    (!Array.isArray(previo) && typeof previo === 'object' && !Object.keys(previo).length);

  if (previoVacio) return nuevo;      // no había nada mejor que conservar

  const n = Array.isArray(previo) ? previo.length : Object.keys(previo).length;
  const msg = `${etiqueta}: falló, se conserva el valor anterior (${n})`;
  console.log(`   ⚠ ${msg}`);
  if (Array.isArray(avisos)) avisos.push(msg);
  return previo;
}

/**
 * Fusiona dos listas ELEMENTO POR ELEMENTO usando una clave.
 *
 * `conservarSiVacio` solo salva el caso extremo: la lista entera vacía.
 * Pero el daño real ocurre antes — el 2026-08-12, tres de cuatro tipos de
 * crédito se trajeron bien y el cuarto dio timeout: el archivo se escribió
 * con 3 y el que faltaba desapareció, aunque el día anterior estaba bueno.
 *
 * Regla: cada elemento que se trajo bien pisa al anterior; cada uno que
 * falló conserva el suyo. Nadie desaparece por una caída de 30 segundos.
 *
 * @param {Array} nuevos     los que se trajeron con éxito
 * @param {Array} previos    los del archivo anterior
 * @param {Function} clave   cómo identificar un elemento (e => e.id)
 * @param {string} etiqueta  nombre para el log
 * @param {string[]} avisos  se le agregan los conservados
 */
export function fusionarPorClave(nuevos, previos, clave, etiqueta, avisos) {
  const nueva = Array.isArray(nuevos) ? nuevos : [];
  const vieja = Array.isArray(previos) ? previos : [];
  if (!vieja.length) return nueva;

  const mapa = new Map();
  for (const p of vieja)  mapa.set(clave(p), { v: p, viejo: true });
  for (const n of nueva)  mapa.set(clave(n), { v: n, viejo: false });

  const conservados = [...mapa.values()].filter(x => x.viejo).map(x => clave(x.v));
  if (conservados.length) {
    const msg = `${etiqueta}: se conserva el valor anterior de ${conservados.join(', ')}`;
    console.log(`   ⚠ ${msg}`);
    if (Array.isArray(avisos)) avisos.push(msg);
  }
  return [...mapa.values()].map(x => x.v);
}
