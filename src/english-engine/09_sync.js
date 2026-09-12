
/* ══════════════════════════════════════════════════════════════
   SYNC · progreso en todos tus dispositivos
   ──────────────────────────────────────────────────────────────
   Usa el MISMO Supabase y la MISMA tabla app_state que el resto
   del Cerebro, pero con merge propio POR ENTIDAD.

   Por que no reusa cloud-sync.js: tocarlo obliga a subir version en
   las 28 paginas (CLAUDE.md regla 7). Manteniendolo aparte, el blast
   radius de este modulo es cero.

   CORRECCION 2026-08-26: la primera version de este comentario decia
   que el merge de cloud-sync.js era last-write-wins sobre el objeto
   completo. Era FALSO para cuadernos: ya tenia _mergeNbData con merge
   por pagina. Hoy ademas se generalizo a arrays de entidades y se le
   agregaron lapidas, asi que los dos motores comparten criterio.

   Garantia: localStorage sigue siendo la fuente de verdad. Si no
   hay red, si el CDN no carga o si Supabase esta caido, la app
   funciona EXACTAMENTE igual. La nube es decoracion.
════════════════════════════════════════════════════════════════ */
const SYNC = (() => {
'use strict';

const SUPA_URL  = 'https://mbuhlxypuvlxxylryjzi.supabase.co';
const SUPA_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1idWhseHlwdXZseHh5bHJ5anppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNTc0NTQsImV4cCI6MjA5MDYzMzQ1NH0.vO7DInzO4Cu1unQ9-KL65Z3ev1WQfCcj60ZtK4-GQn8';
const CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';

const KEYS = ['eng_nb', 'eng_nb_trash', 'eng_fav_w', 'eng_fav_p', 'eng_srs', 'eng_streak', 'eng_bifur', 'eng_cf', 'eng_song'];

let sb = null, user = null, state = 'off', dirty = new Set(), pushT = null, booting = false;
/* Último payload subido por clave, SOLO en memoria. Portado de la idea de
   _deepEqual en cloud-sync.js: subir contenido idéntico una y otra vez es el
   "ping-pong" que ellos ya documentaron. En memoria y no en disco a propósito:
   al recargar se olvida y el primer push siempre sale, así jamás se puede
   quedar un cambio real sin subir por culpa de esta optimización. */
const lastSent = new Map();
const listeners = [];

const LS = {
  get(k){ try { return localStorage.getItem(k); } catch(e){ return null; } },
  /* Guard de cuota, portado de cloud-sync.js: si una clave no entra, se avisa
     y las demás siguen. Antes el fallo era mudo y el dato mezclado se perdía
     sin que nadie se enterara. */
  set(k, v){
    try { localStorage.setItem(k, v); return true; }
    catch(e){
      console.error('[SYNC] no se pudo guardar', k, '(' + Math.round(String(v).length/1024) + ' KB)', e);
      try { window.dispatchEvent(new CustomEvent('eng:quota', { detail:{ key:k, kb: Math.round(String(v).length/1024) } })); } catch(_){}
      return false;
    }
  }
};
const J = {
  get(k, d){ try { const v = LS.get(k); return v === null ? d : (JSON.parse(v) ?? d); } catch(e){ return d; } },
  set(k, v){ LS.set(k, JSON.stringify(v)); }
};

/* Sellos de tiempo por clave — para saber quien gana en las claves simples */
const meta = () => J.get('eng_meta', {});
const stamp = k => { const m = meta(); m[k] = new Date().toISOString(); J.set('eng_meta', m); };
const stampOf = k => (meta()[k] || '');

function setState(s, msg){
  state = s;
  listeners.forEach(f => { try { f(s, msg); } catch(e){} });
}
function onState(f){ listeners.push(f); f(state, ''); }

/* ── Carga perezosa del SDK. Si falla, la app sigue igual. ── */
function loadSDK(){
  if(window.supabase) return Promise.resolve(true);
  return new Promise(res => {
    const s = document.createElement('script');
    s.src = CDN;
    s.onload = () => res(!!window.supabase);
    s.onerror = () => res(false);
    document.head.appendChild(s);
    setTimeout(() => res(!!window.supabase), 12000);
  });
}

async function client(){
  if(sb) return sb;
  const ok = await loadSDK();
  if(!ok) return null;
  // Reusa la sesion del resto del Cerebro: mismo proyecto = misma clave de sesion
  sb = window.SB || window.supabase.createClient(SUPA_URL, SUPA_ANON, {
    auth: { persistSession:true, autoRefreshToken:true, detectSessionInUrl:false }
  });
  return sb;
}

/* ══════════ MERGE · nunca destructivo ══════════ */

/** Cuadernos: se comparan UNO A UNO por id, jamas el bloque completo. */
function mergeBooks(a, b, trash){
  const byId = new Map();
  const put = bk => {
    if(!bk || !bk.id) return;
    const cur = byId.get(bk.id);
    if(!cur) { byId.set(bk.id, bk); return; }
    byId.set(bk.id, mergeOneBook(cur, bk));
  };
  (a && a.books || []).forEach(put);
  (b && b.books || []).forEach(put);

  // Lapidas: borrar solo si el borrado es MAS NUEVO que la ultima edicion.
  // Si editaste despues de borrar en otro equipo, gana la edicion (nunca se pierde).
  (trash || []).forEach(t => {
    const bk = byId.get(t.id);
    if(bk && String(t.deletedAt || '') >= String(bk.updatedAt || '')) byId.delete(t.id);
  });

  const books = [...byId.values()].sort((x, y) =>
    String(y.updatedAt || '').localeCompare(String(x.updatedAt || '')));
  const active = (a && a.active && byId.has(a.active)) ? a.active : (books[0] ? books[0].id : null);
  return { books, active };
}

/** Un cuaderno presente en los dos lados: se unen sus PAGINAS por id.
 *
 *  ANTES esto decidia por marca de tiempo y TIRABA la otra version:
 *      if(!cur || p.u > cur.u) byId.set(p.id, p)
 *  Es decir, si las dos copias de una pagina tenian contenido distinto, una se
 *  perdia para siempre y sin aviso.
 *
 *  Y la marca de tiempo NO es de fiar entre dispositivos: la pone el reloj de
 *  cada maquina. Si el movil va cuatro minutos atrasado, lo que escribas ahi
 *  despues llega con una hora anterior y PIERDE contra lo viejo del ordenador.
 *  Esa es exactamente la forma del incidente del 15-jul de este proyecto.
 *
 *  AHORA: si los dos lados traen contenido distinto para la misma pagina, no
 *  se elige. Se quedan LAS DOS -- la mas nueva en su sitio y la otra detras,
 *  marcada. Sobra una pagina; no falta nada. Entre perder trabajo y que sobre
 *  una pagina que puedes borrar en dos clics, no hay discusion.
 */
function mergeOneBook(x, y){
  const newer = String(y.updatedAt || '') > String(x.updatedAt || '') ? y : x;
  const older = newer === y ? x : y;

  const norm = h => String(h == null ? '' : h).replace(/\s+/g, ' ').trim();
  const byId = new Map();
  const rescatadas = [];

  const put = (p, esDelNuevo) => {
    if(!p) return;
    if(!p.id) p.id = 'pg' + Math.random().toString(36).slice(2, 9);
    const cur = byId.get(p.id);
    if(!cur){ byId.set(p.id, p); return; }

    const a = norm(cur.html), b = norm(p.html);
    if(a === b){                       // identicas: da igual cual quede
      if(String(p.u || '') > String(cur.u || '')) byId.set(p.id, p);
      return;
    }
    /* Una de las dos esta vacia: gana la que tiene algo. Vaciar una pagina no
       es una edicion que merezca ganarle a un texto escrito. */
    if(!a){ byId.set(p.id, p); return; }
    if(!b) return;

    /* Las dos tienen texto y son distintas. Aqui es donde antes se perdia
       trabajo. Se conserva la mas nueva en su sitio y la otra se guarda con
       otro id para que aparezca como una pagina mas. */
    const gana = String(p.u || '') > String(cur.u || '') ? p : cur;
    const pierde = gana === p ? cur : p;
    byId.set(p.id, gana);
    rescatadas.push({
      ...pierde,
      id: pierde.id + '-otra' + rescatadas.length,
      title: (pierde.title || 'Página') + ' · otra versión',
      _rescatada: true
    });
  };

  (older.pages || []).forEach(p => put(p, false));
  (newer.pages || []).forEach(p => put(p, true));

  const pages = [...byId.values()].concat(rescatadas);
  return {
    ...newer,
    pages: pages.length ? pages : (newer.pages || [{ title:'Página 1', html:'' }]),
    cur: Math.min(newer.cur || 0, Math.max(0, pages.length - 1)),
    ...(rescatadas.length ? { _conflictos: rescatadas.length } : {})
  };
}

function mergeTrash(a, b){
  const byId = new Map();
  [...(a || []), ...(b || [])].forEach(t => {
    if(!t || !t.id) return;
    const cur = byId.get(t.id);
    if(!cur || String(t.deletedAt || '') > String(cur.deletedAt || '')) byId.set(t.id, t);
  });
  // La papelera se purga sola a los 30 dias
  const limit = new Date(Date.now() - 30 * 864e5).toISOString();
  return [...byId.values()].filter(t => String(t.deletedAt || '') > limit);
}

/** Tarjetas de practica: se comparan una a una; gana el repaso mas reciente. */
function mergeSrs(a, b){
  const out = { ...(a || {}) };
  Object.entries(b || {}).forEach(([k, v]) => {
    const cur = out[k];
    if(!cur || (v.ts || 0) > (cur.ts || 0)) out[k] = v;
  });
  return out;
}

/** Racha: se unen los dias de los dos equipos y se recuenta la seguidilla. */
function mergeStreak(a, b){
  const log = { ...((a && a.log) || {}) };
  Object.entries((b && b.log) || {}).forEach(([d, n]) => {
    log[d] = Math.max(log[d] || 0, n || 0);
  });
  const days = Object.keys(log).sort();
  const last = days[days.length - 1] || null;
  let run = 0;
  if(last){
    const d = new Date(last + 'T00:00:00');
    const set = new Set(days);
    while(set.has(d.toISOString().slice(0, 10))){ run++; d.setDate(d.getDate() - 1); }
  }
  return { last, days: run, log };
}

/* ══════════ PULL / PUSH ══════════ */

async function pull(){
  const c = await client();
  if(!c || !user) return false;
  setState('syncing');
  try {
    const { data, error } = await c.from('app_state')
      .select('store_key,payload,updated_at')
      .eq('user_id', user.id).in('store_key', KEYS);
    if(error) throw error;
    const remote = {};
    (data || []).forEach(r => { remote[r.store_key] = { p:r.payload, t:r.updated_at }; });

    // 1 · papelera (hace falta antes que los cuadernos, para las lapidas)
    const trash = mergeTrash(J.get('eng_nb_trash', []), remote.eng_nb_trash ? remote.eng_nb_trash.p : []);
    J.set('eng_nb_trash', trash);

    // 2 · cuadernos, uno a uno
    const nb = mergeBooks(J.get('eng_nb', { books:[], active:null }),
                          remote.eng_nb ? remote.eng_nb.p : null, trash);
    J.set('eng_nb', nb);

    // 3 · practica, tarjeta a tarjeta
    J.set('eng_srs', mergeSrs(J.get('eng_srs', {}), remote.eng_srs ? remote.eng_srs.p : {}));

    // 3b · club de frases, frase a frase (misma forma que la practica)
    J.set('eng_cf', mergeSrs(J.get('eng_cf', {}), remote.eng_cf ? remote.eng_cf.p : {}));

    // 3c · canciones, cancion a cancion (misma forma que las demas)
    J.set('eng_song', mergeSrs(J.get('eng_song', {}), remote.eng_song ? remote.eng_song.p : {}));

    // 4 · racha
    J.set('eng_streak', mergeStreak(J.get('eng_streak', { last:null, days:0, log:{} }),
                                    remote.eng_streak ? remote.eng_streak.p : null));

    // 5 · marcadores y progreso simple: gana el mas reciente (baratos de rehacer)
    ['eng_fav_w', 'eng_fav_p', 'eng_bifur'].forEach(k => {
      const r = remote[k];
      if(r && String(r.t || '') > stampOf(k)) { J.set(k, r.p || (k === 'eng_bifur' ? {} : [])); stamp(k); }
    });

    // Lo que quedó igual que la nube no necesita re-subirse
    KEYS.forEach(k => {
      const rr = remote[k];
      if(rr && JSON.stringify(rr.p) === JSON.stringify(J.get(k, null))) lastSent.set(k, JSON.stringify(rr.p));
    });
    J.set('eng_sync_last', new Date().toISOString());
    setState('ready');
    return true;
  } catch(e){
    console.warn('[SYNC] pull', e);
    setState('error', String(e && e.message || e));
    return false;
  }
}

async function pushKeys(keys){
  const c = await client();
  if(!c || !user || !keys.length) return false;
  setState('syncing');
  try {
    const rows = [];
    keys.forEach(k => {
      const payload = J.get(k, k === 'eng_nb' ? { books:[], active:null }
        : (k.startsWith('eng_fav') || k === 'eng_nb_trash' ? [] : {}));
      const str = JSON.stringify(payload);
      if(lastSent.get(k) === str){ dirty.delete(k); return; }   // idéntico → no re-subir
      rows.push({ user_id: user.id, store_key: k, payload, updated_at: new Date().toISOString(), _str: str });
    });
    if(!rows.length){ setState('ready'); return true; }
    const { error } = await c.from('app_state')
      .upsert(rows.map(({ _str, ...row }) => row), { onConflict:'user_id,store_key' });
    if(error) throw error;
    rows.forEach(r => lastSent.set(r.store_key, r._str));
    keys.forEach(k => dirty.delete(k));
    J.set('eng_sync_last', new Date().toISOString());
    setState('ready');
    return true;
  } catch(e){
    console.warn('[SYNC] push', e);
    // Los cambios NO se pierden: quedan marcados y se reintentan
    setState('error', String(e && e.message || e));
    return false;
  }
}

/** Marca una clave como pendiente. Lo llama store.set en cada guardado. */
function touch(k){
  if(!KEYS.includes(k)) return;
  stamp(k);
  if(!user) return;
  dirty.add(k);
  clearTimeout(pushT);
  pushT = setTimeout(() => pushKeys([...dirty]), 1600);
}

function flushNow(){
  if(user && dirty.size){ clearTimeout(pushT); return pushKeys([...dirty]); }
  return Promise.resolve(false);
}

/* ══════════ SESIÓN ══════════ */

async function boot(silent){
  if(booting) return;
  booting = true;
  try {
    setState('loading');
    const c = await client();
    if(!c){ setState(silent ? 'off' : 'error', 'No se pudo cargar el conector. ¿Sin internet?'); return; }
    const { data } = await c.auth.getSession();
    user = (data && data.session && data.session.user) || null;
    if(!user){ setState('off'); return; }
    c.auth.onAuthStateChange((_e, s) => {
      user = (s && s.user) || null;
      setState(user ? 'ready' : 'off');
    });
    await pull();
    if(dirty.size) await pushKeys([...dirty]);
  } finally { booting = false; }
}

async function signIn(email, pass){
  const c = await client();
  if(!c) return { ok:false, msg:'No se pudo cargar el conector. Revisa tu internet.' };
  const { data, error } = await c.auth.signInWithPassword({ email, password:pass });
  if(error) return { ok:false, msg: traducir(error.message) };
  user = data.user;
  await pull();
  await pushKeys(KEYS);           // primera vez: sube todo lo que ya tenías
  return { ok:true };
}
async function signUp(email, pass){
  const c = await client();
  if(!c) return { ok:false, msg:'No se pudo cargar el conector. Revisa tu internet.' };
  const { data, error } = await c.auth.signUp({ email, password:pass });
  if(error) return { ok:false, msg: traducir(error.message) };
  if(data.user && data.session){ user = data.user; await pushKeys(KEYS); return { ok:true }; }
  return { ok:true, msg:'Cuenta creada. Revisa tu correo para confirmarla y vuelve a entrar.' };
}
async function signOut(){
  const c = await client(); if(!c) return;
  await flushNow();
  await c.auth.signOut();
  user = null; setState('off');
}

function traducir(m){
  const s = String(m || '');
  if(/invalid login credentials/i.test(s)) return 'Correo o contraseña incorrectos.';
  if(/email not confirmed/i.test(s)) return 'Falta confirmar el correo. Revisa tu bandeja.';
  if(/already registered|already exists/i.test(s)) return 'Ese correo ya tiene cuenta. Entra en vez de registrarte.';
  if(/password.*6|at least 6/i.test(s)) return 'La contraseña debe tener al menos 6 caracteres.';
  if(/rate limit|too many/i.test(s)) return 'Demasiados intentos. Espera un minuto.';
  if(/fetch|network/i.test(s)) return 'Sin conexión con el servidor.';
  return s;
}

/* Al volver a la pestaña, trae lo que hayas hecho en otro equipo */
document.addEventListener('visibilitychange', () => {
  if(!document.hidden && user && state !== 'syncing') pull().then(() => {
    if(window.APP && APP.refreshAll) APP.refreshAll();
  });
});
window.addEventListener('online', () => { if(user) flushNow(); });
window.addEventListener('beforeunload', () => { if(user && dirty.size) flushNow(); });

return { boot, signIn, signUp, signOut, pull, flushNow, touch, onState,
         get user(){ return user; }, get state(){ return state; },
         get last(){ return J.get('eng_sync_last', null); },
         get pending(){ return dirty.size; }, KEYS,
         // Hooks internos (pruebas / diagnóstico del merge — es la pieza crítica)
         _merge: { books: mergeBooks, book: mergeOneBook, trash: mergeTrash, srs: mergeSrs, streak: mergeStreak } };
})();

/* OJO: un `const` de nivel superior NO se cuelga de window. Sin esta línea,
   `if(window.SYNC)` es falso y la sincronización nunca arranca. Mismo patrón
   que usa cloud-sync.js con `window.CLOUD = CLOUD`. */
window.SYNC = SYNC;
