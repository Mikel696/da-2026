/* ═══════════════════════════════════════════════════════════════
   DA-2026 · 3-ENG · Núcleo del repaso espaciado
   ─────────────────────────────────────────────────────────────
   POR QUÉ EXISTE ESTE ARCHIVO

   Había DOS motores leyendo el mismo mazo (eng_srs_deck) con dos
   definiciones distintas de "vencida", y cada uno daba por vencidas
   las tarjetas del otro:

     js/srs.js          → {q, a, nextReview:'YYYY-MM-DD'}
                          vencida si  !c.nextReview || c.nextReview <= hoy
     js/eng-practice.js → vencida si  !c.due || c.due <= now   (epoch)

   Y dos productores escribiendo formas incompatibles:

     js/notes-brain.js  → {q, a, nextReview}    · sin 'due'
     js/eng-import.js   → {front, back, due}    · sin 'nextReview', sin q/a

   Resultado medido: el contador de la sesión diaria marcaba el mazo
   ENTERO como pendiente todos los días (202 tarjetas en el equipo de
   Miguel), porque ninguna tarjeta canónica tiene 'due'. El repaso
   espaciado dejaba de espaciar: te mostraba todo, siempre.

   Peor: srs.js:305 hace c.q.length, así que una sola tarjeta importada
   (que no tiene 'q') lanzaba excepción y rompía la lista del mazo.

   ESTE ARCHIVO ES LA ÚNICA AUTORIDAD. Una forma canónica, una función
   que dice si algo está vencido, y un lector tolerante que entiende las
   tres formas históricas.

   NO MIGRA NADA EN DISCO. Normaliza al leer y conserva todo campo que
   no reconoce (spread). Es dato del usuario: no se pierde ni se pisa
   nada, y si mañana aparece una cuarta forma, se suma acá y ya.
═══════════════════════════════════════════════════════════════ */

const SRSCORE = (() => {

  const KEY = 'eng_srs_deck';

  /* Mismo criterio de día que el resto de la plataforma (UTC). */
  const hoyStr = () => new Date().toISOString().slice(0, 10);

  const BOX_INTERVALS = { 1: 1, 2: 3, 3: 7, 4: 14, 5: 30 };

  /** epoch ms | 'YYYY-MM-DD' | Date → 'YYYY-MM-DD'. null si no se puede. */
  function aFecha(v) {
    if (v == null || v === '') return null;
    if (typeof v === 'number' && isFinite(v)) return new Date(v).toISOString().slice(0, 10);
    if (typeof v === 'string') {
      if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
      const t = Date.parse(v);
      return isFinite(t) ? new Date(t).toISOString().slice(0, 10) : null;
    }
    if (v instanceof Date && isFinite(v.getTime())) return v.toISOString().slice(0, 10);
    return null;
  }

  /** Lleva cualquiera de las formas históricas a la canónica.
      Conserva los campos que no conoce — pueden ser de otro módulo. */
  function normalizar(c) {
    if (!c || typeof c !== 'object') return null;

    const q = c.q != null && c.q !== '' ? c.q : (c.front != null ? c.front : '');
    const a = c.a != null && c.a !== '' ? c.a : (c.back  != null ? c.back  : '');
    if (!String(q).trim() && !String(a).trim()) return null;   // tarjeta vacía: se descarta

    const box = Number(c.box) >= 1 && Number(c.box) <= 5 ? Number(c.box) : 1;

    /* La fecha de repaso puede venir como nextReview (canónica) o como
       due (epoch, de eng-import). Si no hay ninguna, la tarjeta es nueva
       y toca hoy — que es la intención de ambos productores. */
    const next = aFecha(c.nextReview) || aFecha(c.due) || hoyStr();

    return {
      ...c,
      id: c.id || ((window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)),
      q: String(q), a: String(a),
      h: c.h || '', d: c.d || c.source || '',
      box,
      interval: Number(c.interval) > 0 ? Number(c.interval) : (BOX_INTERVALS[box] || 1),
      ease: Number(c.ease) > 0 ? Number(c.ease) : 2.5,
      reps: Number(c.reps) >= 0 ? Number(c.reps) : 0,
      nextReview: next,
      lastReview: aFecha(c.lastReview),
      due: undefined   // se deja de escribir: nextReview manda
    };
  }

  /** LA definición de "vencida". Un solo lugar, para que ningún
      contador de la plataforma pueda decir otra cosa. */
  function estaVencida(c, hoy) {
    const n = c && c.nextReview ? c : normalizar(c);
    if (!n) return false;
    return n.nextReview <= (hoy || hoyStr());
  }

  function leer() {
    let raw = [];
    try { raw = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { raw = []; }
    if (!Array.isArray(raw)) return [];
    return raw.map(normalizar).filter(Boolean);
  }

  function guardar(cards) {
    try { localStorage.setItem(KEY, JSON.stringify(cards)); return true; }
    catch (e) { console.warn('[SRSCORE] no se pudo guardar:', e && e.message); return false; }
  }

  function vencidas(hoy) {
    const h = hoy || hoyStr();
    return leer().filter(c => c.nextReview <= h);
  }

  /** Diagnóstico: cuántas tarjetas venían de cada forma histórica.
      Sirve para comprobar el arreglo con datos reales sin adivinar. */
  function diagnostico() {
    let raw = [];
    try { raw = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { raw = []; }
    if (!Array.isArray(raw)) return { error: 'el mazo no es un array' };
    const n = { total: raw.length, canonicas: 0, importadas: 0, sinFecha: 0, vacias: 0 };
    for (const c of raw) {
      if (!c || typeof c !== 'object') { n.vacias++; continue; }
      const tieneQ = c.q != null && String(c.q).trim() !== '';
      const tieneFront = c.front != null && String(c.front).trim() !== '';
      if (!tieneQ && !tieneFront) { n.vacias++; continue; }
      if (tieneQ) n.canonicas++; else n.importadas++;
      if (!c.nextReview && !c.due) n.sinFecha++;
    }
    n.vencidasHoy = vencidas().length;
    return n;
  }

  return { KEY, BOX_INTERVALS, hoyStr, aFecha, normalizar, estaVencida, leer, guardar, vencidas, diagnostico };
})();

window.SRSCORE = SRSCORE;
