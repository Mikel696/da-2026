// CORE · Prueba de regresión de cloud-sync.js: dos escrituras seguidas de la misma key no pueden perder la segunda.
// Uso: node scripts/prueba-sync-carrera.mjs [otro-cloud-sync.js]   (código 1 si algo falla; VERBOSE=1 imprime el log del motor)
//
// Origen (12-nov-2026): en 10-SYS, `SYS.setAca` escrito ~2 s después de `SYS.injectWeek` sobre `sys_week_live` se
// perdió: la copia local volvió al parte recién subido y el cambio nuevo nunca llegó a la nube. Hubo que reaplicarlo.
// 13-nov (p24): lo editado sin sesión o sin red desde que abre la página tampoco puede perderse al entrar, y los
// defaults de arranque siguen sin pisar la nube (escenarios «sin sesión», «sin red» y «candado sin sesión»).
//
// Cómo prueba: carga el `cloud-sync.js` REAL en un contexto aislado (node:vm) con un navegador mínimo, un reloj
// virtual (los temporizadores avanzan cuando la prueba lo dice) y una nube falsa con latencia y eco en tiempo real.
// Nada sale a internet ni toca Supabase.
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
// Otra versión del motor: node scripts/prueba-sync-carrera.mjs ruta/a/cloud-sync.js (p. ej. `git show <commit>:frontend/js/cloud-sync.js`)
const CODIGO = readFileSync(process.argv[2] || resolve(aqui, '../frontend/js/cloud-sync.js'), 'utf8');
const VERBOSE = !!process.env.VERBOSE;

/* ── Reloj virtual compartido por la nube y todas las pestañas ── */
function crearReloj(inicio) {
  const r = { ahora: inicio, timers: new Map(), seq: 0 };
  r.setTimeout = (fn, ms = 0, ...a) => { const id = ++r.seq; r.timers.set(id, { at: r.ahora + Math.max(0, +ms || 0), fn, a, n: id }); return id; };
  r.setInterval = (fn, ms = 0, ...a) => { const id = ++r.seq; r.timers.set(id, { at: r.ahora + Math.max(1, +ms || 0), fn, a, n: id, cada: Math.max(1, +ms || 0) }); return id; };
  r.clear = (id) => { r.timers.delete(id); };
  r.drenar = () => new Promise((ok) => setImmediate(ok));
  r.avanzar = async (ms) => {
    const fin = r.ahora + ms;
    await r.drenar();
    for (;;) {
      let sig = null;
      for (const [id, t] of r.timers) if (t.at <= fin && (!sig || t.at < sig.t.at || (t.at === sig.t.at && t.n < sig.t.n))) sig = { id, t };
      if (!sig) break;
      r.ahora = sig.t.at;
      if (sig.t.cada) { sig.t.at += sig.t.cada; sig.t.n = ++r.seq; } else r.timers.delete(sig.id);
      try { sig.t.fn(...sig.t.a); } catch (e) { console.error('timer lanzó', e); }
      await r.drenar(); await r.drenar();
    }
    r.ahora = fin;
    await r.drenar();
  };
  const DateBase = Date;
  r.Date = class extends DateBase {
    constructor(...a) { if (a.length === 0) super(r.ahora); else super(...a); }
    static now() { return r.ahora; }
  };
  return r;
}

/* ── Nube falsa (tabla app_state + eco en tiempo real) ── */
function crearNube(reloj) {
  // caida = sin internet: supabase-js no lanza, devuelve { error } (como un fetch que falla)
  const n = { filas: new Map(), canales: new Set(), latencia: 300, ecoMs: 150, tiempoReal: true, caida: false, upserts: [] };
  const fila = (k) => n.filas.get(k);
  function pedir(q) {
    const lat = typeof n.latencia === 'function' ? n.latencia(q) : n.latencia;
    return new Promise((ok) => {
      let resp;
      reloj.setTimeout(() => {   // el servidor aplica a mitad del viaje
        if (n.caida) { resp = { data: null, error: { message: 'TypeError: Failed to fetch' } }; return; }
        if (q.tabla !== 'app_state') { resp = { data: [], error: null }; return; }
        if (q.op === 'upsert') {
          const r = q.fila, previa = n.filas.has(r.store_key);
          const guardada = { user_id: r.user_id, store_key: r.store_key, payload: JSON.parse(JSON.stringify(r.payload)), updated_at: r.updated_at };
          n.filas.set(r.store_key, guardada);
          n.upserts.push({ key: r.store_key, at: reloj.ahora, payload: guardada.payload, updated_at: r.updated_at });
          if (n.tiempoReal) for (const c of n.canales) {
            const ev = { eventType: previa ? 'UPDATE' : 'INSERT', new: JSON.parse(JSON.stringify(guardada)), old: {} };
            reloj.setTimeout(() => { if (n.canales.has(c)) c.cb(ev); }, n.ecoMs);
          }
          resp = { error: null };
        } else if (q.op === 'delete') {
          for (const k of [...n.filas.keys()]) if (q.filtros.every(([op, col, v]) => op !== 'eq' || col !== 'store_key' || v === k)) n.filas.delete(k);
          resp = { error: null };
        } else {
          let data = [...n.filas.values()];
          for (const [op, col, v] of q.filtros) {
            if (op === 'eq') data = data.filter((x) => x[col] === v);
            if (op === 'in') data = data.filter((x) => v.includes(x[col]));
          }
          resp = { data: JSON.parse(JSON.stringify(data)), error: null };
        }
      }, lat / 2);
      reloj.setTimeout(() => ok(resp), lat);
    });
  }
  n.cliente = () => ({
    supabaseUrl: 'https://nube.falsa', supabaseKey: 'anon',
    from(tabla) {
      const q = { tabla, op: 'select', filtros: [] };
      const b = {
        select() { if (q.op !== 'upsert') q.op = 'select'; return b; },
        eq(c, v) { q.filtros.push(['eq', c, v]); return b; },
        in(c, v) { q.filtros.push(['in', c, v]); return b; },
        order() { return b; },
        upsert(f) { q.op = 'upsert'; q.fila = JSON.parse(JSON.stringify(f)); return b; },
        delete() { q.op = 'delete'; return b; },
        then(ok, mal) { return pedir(q).then(ok, mal); },
      };
      return b;
    },
    channel() {
      const c = { cb: null, on(_t, _f, cb) { c.cb = cb; return c; }, subscribe(st) { n.canales.add(c); if (st) reloj.setTimeout(() => st('SUBSCRIBED'), 0); return c; } };
      return c;
    },
    removeChannel(c) { n.canales.delete(c); },
    auth: { getSession: async () => ({ data: { session: { access_token: 'tok' } } }), onAuthStateChange() {}, refreshSession: async () => ({}) },
  });
  n.valor = (k) => (fila(k) ? fila(k).payload : undefined);
  return n;
}

/* ── Una pestaña del sitio: window + document mínimos y el motor real cargado ──
   opciones.sesion = false → la página abre sin sesión iniciada (auth.js no emite nada hasta el login). */
function abrirPestana(reloj, nube, almacen, nombre = 'A', opciones = {}) {
  const log = [];
  let uid = opciones.sesion === false ? null : 'u1';
  // Temporizadores y canales propios de esta pestaña: al cerrarla se apagan (como una recarga de verdad).
  const mios = new Set();
  const st = (fn, ms, ...a) => { const id = reloj.setTimeout(fn, ms, ...a); mios.add(id); return id; };
  const si = (fn, ms, ...a) => { const id = reloj.setInterval(fn, ms, ...a); mios.add(id); return id; };
  const cliente = nube.cliente();
  const canalOrig = cliente.channel;
  const misCanales = new Set();
  cliente.channel = (...a) => { const c = canalOrig(...a); misCanales.add(c); return c; };
  const et = new EventTarget();
  const doc = new EventTarget();
  Object.assign(doc, {
    hidden: false, visibilityState: 'visible', readyState: 'complete', activeElement: null,
    getElementById: () => null, querySelectorAll: () => [],
    createElement: () => ({ style: { setProperty() {} }, classList: { add() {}, toggle() {}, contains: () => false }, appendChild() {} }),
    head: { appendChild() {} }, body: { appendChild() {} }, documentElement: { classList: { add() {} } },
  });
  // Un clic o una tecla de verdad (isTrusted) no se puede fabricar con dispatchEvent: se guardan los oyentes
  // del documento y usuarioToca() los llama con un evento marcado como real.
  const oyentesDoc = new Map();
  const docAdd = doc.addEventListener.bind(doc);
  doc.addEventListener = (t, fn, o) => { if (!oyentesDoc.has(t)) oyentesDoc.set(t, []); oyentesDoc.get(t).push(fn); docAdd(t, fn, o); };
  const ls = {
    getItem: (k) => (almacen.has(String(k)) ? almacen.get(String(k)) : null),
    // almacen.lleno(k, v) → true simula el disco lleno (QuotaExceededError) para esa escritura
    setItem: (k, v) => {
      if (almacen.lleno && almacen.lleno(String(k), String(v))) { const e = new Error('The quota has been exceeded.'); e.name = 'QuotaExceededError'; throw e; }
      almacen.set(String(k), String(v));
    },
    removeItem: (k) => { almacen.delete(String(k)); },
    key: (i) => [...almacen.keys()][i] ?? null,
    get length() { return almacen.size; },
  };
  const consola = {};
  for (const m of ['log', 'warn', 'error', 'info', 'debug']) consola[m] = (...a) => { log.push(`[${nombre} ${new Date(reloj.ahora).toISOString().slice(17, 23)}] ${m}: ` + a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' ')); };
  const win = {
    addEventListener: et.addEventListener.bind(et), removeEventListener: et.removeEventListener.bind(et), dispatchEvent: et.dispatchEvent.bind(et),
    document: doc, localStorage: ls, console: consola, CustomEvent, Event, EventTarget, Blob, JSON, Math, Map, Set, Promise, Array, Object, String, Number, Error,
    setTimeout: st, clearTimeout: reloj.clear, setInterval: si, clearInterval: reloj.clear,
    Date: reloj.Date, performance: { now: () => reloj.ahora }, navigator: { onLine: true },
    // Solo lo usa el flush de cierre (fetch keepalive a /rest/v1/app_state): llega a la nube como un upsert más.
    fetch: (_url, o) => { const f = JSON.parse(o.body); return cliente.from('app_state').upsert(f).then(() => ({ ok: true })); },
    SB: cliente,
    AUTH: { getUserId: () => uid, isLoggedIn: () => !!uid, openModal() {} },
  };
  win.window = win; win.self = win; win.top = win; win.parent = win; win.globalThis = win;
  vm.createContext(win);
  vm.runInContext(CODIGO, win, { filename: 'cloud-sync.js' });
  const p = {
    win, log, nombre,
    set: (k, v) => win.localStorage.setItem(k, JSON.stringify(v)),
    get: (k) => { const r = win.localStorage.getItem(k); return r === null ? undefined : JSON.parse(r); },
    outbox: () => JSON.parse(win.localStorage.getItem('cloud_outbox') || '[]'),
    iniciarSesion: () => { uid = 'u1'; win.dispatchEvent(new CustomEvent('sb:signed_in')); },   // auth.js: INITIAL_SESSION o SIGNED_IN
    // El usuario hace clic en la página (p. ej. el botón que guarda): el módulo escribe justo después.
    usuarioToca: () => { for (const fn of oyentesDoc.get('pointerdown') || []) fn({ type: 'pointerdown', isTrusted: true, target: { tagName: 'BUTTON' } }); },
    // El autocompletado del navegador rellena un campo al cargar: eventos reales, pero nadie tocó nada.
    navegadorAutocompleta: () => { for (const t of ['input', 'change']) for (const fn of oyentesDoc.get(t) || []) fn({ type: t, isTrusted: true, target: { tagName: 'INPUT' } }); },
    volvioLaRed: () => win.dispatchEvent(new Event('online')),
    // supabase-js v2 vuelve a emitir SIGNED_IN cada vez que la pestaña vuelve a estar visible → fullSyncAll otra vez
    volverALaPestana: () => { doc.hidden = false; doc.visibilityState = 'visible'; doc.dispatchEvent(new Event('visibilitychange')); win.dispatchEvent(new CustomEvent('sb:signed_in')); },
    syncing: () => win.CLOUD.diagnostics().syncing,
    cerrar: () => {
      win.dispatchEvent(new Event('beforeunload'));
      for (const id of mios) reloj.clear(id);
      for (const c of misCanales) nube.canales.delete(c);
    },
  };
  return p;
}

/* ── Escenarios ── */
const K = 'sys_week_live';   // la key del incidente (LWW por key completa, sin merge estructural)
const V1 = { weeks: [{ id: 'S7', acas: [] }] };                     // injectWeek: parte nuevo, sin ACA
const V2 = { weeks: [{ id: 'S7', acas: ['aca_en', 'aca_bi'] }] };   // setAca: el mismo parte con ACA

async function montar(opciones = {}) {
  const reloj = crearReloj(Date.UTC(2026, 10, 12, 23, 50, 0));
  const nube = crearNube(reloj);
  Object.assign(nube, opciones.nube || {});
  const almacen = new Map();
  const a = abrirPestana(reloj, nube, almacen, 'A');
  a.iniciarSesion();
  await reloj.avanzar(5000);   // hidratación inicial completa
  return { reloj, nube, almacen, a };
}

const escenarios = [];
const escenario = (nombre, fn) => escenarios.push({ nombre, fn });

escenario('control · dos escrituras a 2 s, sin re-sync, con eco en tiempo real', async () => {
  const { reloj, nube, almacen, a } = await montar();
  a.set(K, V1);
  await reloj.avanzar(2000);
  a.set(K, V2);
  await reloj.avanzar(10000);
  return { reloj, nube, almacen, pestanas: [a], local: a.get(K), enNube: nube.valor(K), outbox: a.outbox() };
});

escenario('incidente · la 2.ª escritura cae mientras corre la re-sync al volver a la pestaña (push del 1.º en vuelo)', async () => {
  const { reloj, nube, almacen, a } = await montar({ nube: { latencia: 1200 } });
  a.set(K, V1);
  await reloj.avanzar(1600);           // el debounce (1,5 s) ya disparó: la subida del parte va en camino
  a.volverALaPestana();                // supabase-js emite SIGNED_IN → fullSyncAll a los 300 ms
  await reloj.avanzar(400);
  if (!a.syncing()) throw new Error('el escenario no logró escribir durante la re-sync');
  a.set(K, V2);                        // setAca ~2 s después de injectWeek
  await reloj.avanzar(15000);
  return { reloj, nube, almacen, pestanas: [a], local: a.get(K), enNube: nube.valor(K), outbox: a.outbox() };
});

escenario('incidente sin tiempo real · pestaña en segundo plano (canal caído), re-sync al volver', async () => {
  const { reloj, nube, almacen, a } = await montar({ nube: { latencia: 600 } });
  nube.tiempoReal = false;
  a.set(K, V1);
  await reloj.avanzar(3000);           // el parte ya está en la nube; el eco nunca llega
  a.volverALaPestana();
  await reloj.avanzar(400);
  if (!a.syncing()) throw new Error('el escenario no logró escribir durante la re-sync');
  a.set(K, V2);
  await reloj.avanzar(15000);
  return { reloj, nube, almacen, pestanas: [a], local: a.get(K), enNube: nube.valor(K), outbox: a.outbox() };
});

escenario('re-sync manual · CLOUD.syncNow() mientras se escribe', async () => {
  const { reloj, nube, almacen, a } = await montar({ nube: { latencia: 800 } });
  a.set(K, V1);
  await reloj.avanzar(3000);
  a.win.CLOUD.syncNow();
  await reloj.avanzar(100);
  a.set(K, V2);
  await reloj.avanzar(15000);
  return { reloj, nube, almacen, pestanas: [a], local: a.get(K), enNube: nube.valor(K), outbox: a.outbox() };
});

escenario('dos pestañas · B re-sincroniza al volver mientras A escribe dos veces', async () => {
  const { reloj, nube, almacen, a } = await montar({ nube: { latencia: 900 } });
  const b = abrirPestana(reloj, nube, almacen, 'B');
  b.iniciarSesion();
  await reloj.avanzar(6000);
  a.set(K, V1);
  await reloj.avanzar(1600);
  b.volverALaPestana();
  a.volverALaPestana();
  await reloj.avanzar(400);
  a.set(K, V2);
  await reloj.avanzar(15000);
  return { reloj, nube, almacen, pestanas: [a, b], local: a.get(K), enNube: nube.valor(K), outbox: a.outbox() };
});

escenario('candado intacto · equipo nuevo: el default que escribe un módulo al arrancar no pisa la nube', async () => {
  const reloj = crearReloj(Date.UTC(2026, 10, 12, 23, 50, 0));
  const nube = crearNube(reloj);
  nube.latencia = 600;
  nube.filas.set(K, { user_id: 'u1', store_key: K, payload: V2, updated_at: new Date(reloj.ahora - 864e5).toISOString() });
  const almacen = new Map();
  const a = abrirPestana(reloj, nube, almacen, 'A');
  a.iniciarSesion();
  await reloj.avanzar(400);
  if (!a.syncing()) throw new Error('el escenario no logró escribir durante la hidratación inicial');
  a.set(K, { weeks: [] });             // el módulo arranca sin datos y guarda su estado vacío
  await reloj.avanzar(15000);
  return { reloj, nube, almacen, pestanas: [a], local: a.get(K), enNube: nube.valor(K), outbox: a.outbox() };
});

/* ── Sin sesión o sin red DESDE EL ARRANQUE (la hidratación inicial no termina hasta el login o la red) ──
   Punto de partida realista: este equipo ya sincronizó K = V1 y la pestaña se cerró enseguida (la subida salió
   por keepalive): la hora local de K quedó un poco por detrás de la de la nube. */
async function equipoQueYaSincronizo() {
  const { reloj, nube, almacen, a } = await montar();
  a.set(K, V1);
  await reloj.avanzar(200);
  a.cerrar();
  await reloj.avanzar(5000);
  if (!igual(nube.valor(K), V1)) throw new Error('la preparación no dejó V1 en la nube');
  return { reloj, nube, almacen };
}
// Otro equipo (su propio disco) entra, ve la nube y deja K = valor.
async function otroEquipoEscribe(reloj, nube, valor) {
  const c = abrirPestana(reloj, nube, new Map(), 'C');
  c.iniciarSesion();
  await reloj.avanzar(5000);
  c.set(K, valor);
  await reloj.avanzar(10000);
  c.cerrar();
}

escenario('sin sesión · edita con la sesión cerrada y después entra: la nube no le gana', async () => {
  const { reloj, nube, almacen } = await equipoQueYaSincronizo();
  const b = abrirPestana(reloj, nube, almacen, 'B', { sesion: false });
  await reloj.avanzar(2000);           // la página cargó; sin sesión no arranca la hidratación
  b.usuarioToca();
  b.set(K, V2);                        // el clic guarda el cambio
  await reloj.avanzar(30000);          // sigue trabajando sin sesión
  b.iniciarSesion();
  await reloj.avanzar(15000);
  return { reloj, nube, almacen, pestanas: [b], local: b.get(K), enNube: nube.valor(K), outbox: b.outbox() };
});

escenario('sin red · abre con sesión pero sin internet, edita y después vuelve la red', async () => {
  const { reloj, nube, almacen } = await equipoQueYaSincronizo();
  nube.caida = true;
  const b = abrirPestana(reloj, nube, almacen, 'B');
  b.iniciarSesion();                   // INITIAL_SESSION llega sin red: la sesión vive en el disco
  await reloj.avanzar(2000);           // la primera fullSyncAll falla y queda reintentando
  if (b.win.CLOUD.diagnostics().initial_sync_done) throw new Error('el escenario no logró una hidratación pendiente');
  b.usuarioToca();
  b.set(K, V2);
  await reloj.avanzar(3000);
  nube.caida = false;
  b.volvioLaRed();
  await reloj.avanzar(15000);
  return { reloj, nube, almacen, pestanas: [b], local: b.get(K), enNube: nube.valor(K), outbox: b.outbox() };
});

escenario('sin red · vuelve el servidor sin evento «online» (DNS o Supabase caídos): el reintento solo sube la edición', async () => {
  const { reloj, nube, almacen } = await equipoQueYaSincronizo();
  nube.caida = true;
  const b = abrirPestana(reloj, nube, almacen, 'B');
  b.iniciarSesion();
  await reloj.avanzar(2000);           // falla; el reintento automático sale a los ~10 s
  b.usuarioToca();
  b.set(K, V2);
  await reloj.avanzar(3000);
  nube.caida = false;                  // Windows nunca perdió la red: no hay evento «online»
  await reloj.avanzar(30000);
  if (!b.win.CLOUD.diagnostics().initial_sync_done) throw new Error('el reintento automático no completó la hidratación');
  return { reloj, nube, almacen, pestanas: [b], local: b.get(K), enNube: nube.valor(K), outbox: b.outbox() };
});

escenario('candado sin sesión · equipo nuevo: los defaults de arranque escritos antes de entrar no pisan la nube', async () => {
  const reloj = crearReloj(Date.UTC(2026, 10, 12, 23, 50, 0));
  const nube = crearNube(reloj);
  nube.filas.set(K, { user_id: 'u1', store_key: K, payload: V2, updated_at: new Date(reloj.ahora - 864e5).toISOString() });
  const almacen = new Map();
  const a = abrirPestana(reloj, nube, almacen, 'A', { sesion: false });
  a.set(K, { weeks: [] });             // el módulo arranca sin datos (sin clic de nadie)
  await reloj.avanzar(20000);
  a.iniciarSesion();
  await reloj.avanzar(15000);
  return { reloj, nube, almacen, pestanas: [a], local: a.get(K), enNube: nube.valor(K), outbox: a.outbox() };
});

escenario('candado sin sesión · equipo nuevo: lo escrito antes de ver la nube no la pisa entera, aunque haya clic', async () => {
  const reloj = crearReloj(Date.UTC(2026, 10, 12, 23, 50, 0));
  const nube = crearNube(reloj);
  nube.filas.set(K, { user_id: 'u1', store_key: K, payload: V2, updated_at: new Date(reloj.ahora - 864e5).toISOString() });
  const almacen = new Map();
  const a = abrirPestana(reloj, nube, almacen, 'A', { sesion: false });
  a.set(K, { weeks: [] });             // default de arranque
  await reloj.avanzar(2000);
  a.usuarioToca();
  a.set(K, V1);                        // edita sobre el módulo vacío: este equipo nunca vio K en la nube
  await reloj.avanzar(5000);
  a.iniciarSesion();
  await reloj.avanzar(15000);
  return { reloj, nube, almacen, pestanas: [a], local: a.get(K), enNube: nube.valor(K), outbox: a.outbox() };
});

escenario('candado sin sesión · equipo viejo: una migración de arranque (sin clic) no pisa lo más nuevo de otro equipo', async () => {
  const { reloj, nube, almacen } = await equipoQueYaSincronizo();
  await otroEquipoEscribe(reloj, nube, V2);
  const b = abrirPestana(reloj, nube, almacen, 'B', { sesion: false });
  b.set(K, { ...V1, version: 2 });     // el módulo migra al arrancar lo que tenía este disco (V1, viejo)
  await reloj.avanzar(20000);
  b.iniciarSesion();
  await reloj.avanzar(15000);
  return { reloj, nube, almacen, pestanas: [b], local: b.get(K), enNube: nube.valor(K), outbox: b.outbox() };
});

escenario('candado sin sesión · el autocompletado del navegador al cargar no convierte una migración en «edición del usuario»', async () => {
  const { reloj, nube, almacen } = await equipoQueYaSincronizo();
  await otroEquipoEscribe(reloj, nube, V2);
  const b = abrirPestana(reloj, nube, almacen, 'B', { sesion: false });
  b.navegadorAutocompleta();           // Chrome rellena el correo del formulario de entrada
  b.set(K, { ...V1, version: 2 });     // y el módulo migra al arrancar lo viejo de este disco
  await reloj.avanzar(20000);
  b.iniciarSesion();
  await reloj.avanzar(15000);
  return { reloj, nube, almacen, pestanas: [b], local: b.get(K), enNube: nube.valor(K), outbox: b.outbox() };
});

escenario('sin sesión · gana lo último: una edición vieja sin sesión pierde ante un cambio posterior de otro equipo', async () => {
  const { reloj, nube, almacen } = await equipoQueYaSincronizo();
  const b = abrirPestana(reloj, nube, almacen, 'B', { sesion: false });
  await reloj.avanzar(2000);
  b.usuarioToca();
  b.set(K, { weeks: [{ id: 'S7', acas: ['aca_vieja'] }] });
  await reloj.avanzar(5000);
  await otroEquipoEscribe(reloj, nube, V2);   // después, otro equipo cambia K
  b.iniciarSesion();
  await reloj.avanzar(15000);
  return { reloj, nube, almacen, pestanas: [b], local: b.get(K), enNube: nube.valor(K), outbox: b.outbox() };
});

escenario('sin sesión y disco lleno · la edición vive en memoria, se sella solo en memoria y sube al entrar', async () => {
  const { reloj, nube, almacen } = await equipoQueYaSincronizo();
  const tsDisco = () => JSON.parse(almacen.get('_cloud_ts') || '{}')[K];
  const antes = tsDisco();
  almacen.lleno = (k) => k === K;      // el disco ya no acepta escrituras de K
  const b = abrirPestana(reloj, nube, almacen, 'B', { sesion: false });
  await reloj.avanzar(2000);
  b.usuarioToca();
  try { b.set(K, V2); } catch (e) { if (e.name !== 'QuotaExceededError') throw e; }   // el módulo avisa «disco lleno»
  if (tsDisco() !== antes) throw new Error('selló en disco la hora de una key que no cupo (su copia de disco es la vieja)');
  await reloj.avanzar(5000);
  b.iniciarSesion();
  await reloj.avanzar(15000);
  if (tsDisco() !== antes) throw new Error('al entrar selló en disco la hora de una key que solo vive en memoria');
  return { reloj, nube, almacen, pestanas: [b], local: b.get(K), enNube: nube.valor(K), outbox: b.outbox() };
});

/* ── La cola de pendientes («N sin subir») ── */
escenario('cola · la subida de V1 no saca de la cola a V2, que todavía no subió', async () => {
  const { reloj, nube, almacen, a } = await montar({ nube: { latencia: 1200 } });
  a.set(K, V1);
  await reloj.avanzar(1600);           // la subida de V1 va en camino (responde a los 2,7 s)
  a.set(K, V2);                        // su subida sale a los 3,1 s
  await reloj.avanzar(1300);           // V1 ya respondió; V2 todavía no salió
  if (!a.outbox().includes(K)) throw new Error('la confirmación de V1 sacó de la cola a V2, que sigue sin subir');
  await reloj.avanzar(15000);
  return { reloj, nube, almacen, pestanas: [a], local: a.get(K), enNube: nube.valor(K), outbox: a.outbox() };
});

escenario('cola · el reintento de una subida fallida no reemplaza en la nube un cambio más nuevo', async () => {
  const { reloj, nube, almacen, a } = await montar();
  nube.caida = true;                   // se cae el internet un momento
  a.set(K, V1);
  await reloj.avanzar(2000);           // la subida de V1 falla → queda en la cola de reintentos (3 s)
  nube.caida = false;
  a.set(K, V2);                        // volvió la red: V2 sube por el camino normal antes del reintento
  await reloj.avanzar(15000);
  return { reloj, nube, almacen, pestanas: [a], local: a.get(K), enNube: nube.valor(K), outbox: a.outbox() };
});

/* ── Ejecutar. Pasa si el valor correcto (V2 en todos los escenarios) queda en la copia local, en la nube y
      tras recargar la página. ── */
let fallos = 0;
const igual = (x, y) => JSON.stringify(x) === JSON.stringify(y);
for (const { nombre, fn } of escenarios) {
  let r = null, err = null, tras = null;
  try {
    r = await fn();
    // Recargar: se cierran las pestañas (beforeunload incluido) y se abre una nueva sobre el mismo disco y la misma nube.
    for (const p of r.pestanas) p.cerrar();
    const nueva = abrirPestana(r.reloj, r.nube, r.almacen, 'R');
    nueva.iniciarSesion();
    await r.reloj.avanzar(15000);
    tras = { local: nueva.get(K), nube: r.nube.valor(K) };
    r.pestanas.push(nueva);
  } catch (e) { err = e; }
  const ok = !err && igual(r.local, V2) && igual(r.enNube, V2) && igual(tras.local, V2) && igual(tras.nube, V2);
  console.log(`${ok ? '✅' : '❌'} ${nombre}`);
  if (!ok) {
    fallos++;
    if (err) console.log('   error:', err.stack || err.message);
    else {
      const ver = (x) => (igual(x, V2) ? 'V2 (correcto)' : igual(x, V1) ? 'V1 (se perdió V2)' : JSON.stringify(x));
      console.log(`   al terminar → local: ${ver(r.local)} · nube: ${ver(r.enNube)} · outbox: ${JSON.stringify(r.outbox)}`);
      console.log(`   tras recargar → local: ${ver(tras.local)} · nube: ${ver(tras.nube)}`);
    }
    if (VERBOSE && r) for (const p of r.pestanas) console.log(p.log.filter((l) => /fullSync|reconcile|realtime|pushState|outbox|flushPending/.test(l)).join('\n'));
  }
}
console.log(fallos ? `\n${fallos} de ${escenarios.length} escenarios terminan con un valor equivocado.` : `\nLos ${escenarios.length} escenarios terminan con el valor correcto.`);
process.exit(fallos ? 1 : 0);
