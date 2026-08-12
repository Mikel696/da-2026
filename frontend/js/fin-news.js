/* ═══════════════════════════════════════════════════════════════
   DA-2026 · 12-FIN · Burbuja de noticias del día
   ─────────────────────────────────────────────────────────────
   Segunda burbuja fija a la izquierda, al lado de la calculadora.
   Muestra SOLO las 5 noticias con más impacto sobre el bolsillo,
   elegidas en el servidor por scripts/fetch-world.mjs con criterios
   explícitos (tema + peso de la fuente + frescura + máximo 2 por
   medio) y con el motivo visible en cada nota — un ranking sin
   criterio a la vista es una caja negra, y acá no se usan.

   Se refresca solo: la GitHub Action reescribe data/world.json cada
   día y el navegador lo pide en cada carga (mismo origen, sin cuota).

   Los titulares son contenido externo no confiable: todo escapado y
   los enlaces filtrados a http(s) con rel="noopener noreferrer".
═══════════════════════════════════════════════════════════════ */

const FINNEWS = (() => {

  const SRC = 'data/world.json';
  const CACHE_KEY = 'fin_news_cache';      // local (en SKIP_KEYS)
  const SEEN_KEY  = 'fin_news_seen';       // local: qué día ya miró

  let _open = false, _state = null, _loading = false;

  const esc = s => String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const safeUrl = u => /^https?:\/\//i.test(String(u || '')) ? String(u) : '#';
  const ago = iso => {
    if (!iso) return '';
    const m = Math.round((Date.now() - Date.parse(iso)) / 60000);
    if (isNaN(m)) return '';
    if (m < 60) return `hace ${Math.max(1,m)} min`;
    const h = Math.round(m/60);
    return h < 24 ? `hace ${h} h` : 'ayer';
  };

  const cacheGet = () => { try { return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); } catch { return null; } };
  const cacheSet = o => { try { localStorage.setItem(CACHE_KEY, JSON.stringify(o)); } catch {} };
  const hoy = () => new Date().toISOString().slice(0,10);

  async function load(force) {
    if (_loading) return _state;
    const c = cacheGet();
    /* Sin puerta de TTL: mismo origen, y las noticias del día tienen que
       poder cambiar durante el día. El caché es respaldo sin red. */
    _loading = true;
    try {
      const dia = new Date().toISOString().slice(0,10);
      const res = await fetch(`${SRC}?d=${dia}`, { cache:'no-cache' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const j = await res.json();
      _state = {
        items: j.destacadas || [],
        generatedAt: j.generatedAt || null,
        fetchedAt: Date.now()
      };
      cacheSet(_state);
    } catch (e) {
      console.warn('[FINNEWS]', e && e.message);
      _state = c || { items:[], generatedAt:null, fetchedAt:null, error:String(e && e.message) };
    }
    _loading = false;
    _badge();
    if (_open) _render();
    return _state;
  }

  /* Punto rojo mientras no haya abierto las de hoy. */
  function _badge() {
    const b = document.getElementById('finNewsBubble');
    if (!b) return;
    let seen = null;
    try { seen = localStorage.getItem(SEEN_KEY); } catch {}
    const n = (_state && _state.items || []).length;
    b.classList.toggle('nuevo', n > 0 && seen !== hoy());
  }

  function _render() {
    const host = document.getElementById('finNewsPanel');
    if (!host) return;
    const st = _state || cacheGet();
    const items = (st && st.items) || [];

    const cuerpo = items.length ? items.map((n,i) => `
      <a class="fnw-item" href="${esc(safeUrl(n.link))}" target="_blank" rel="noopener noreferrer">
        <span class="fnw-num">${i+1}</span>
        <span class="fnw-body">
          <span class="fnw-title">${esc(n.title)}</span>
          <span class="fnw-why">${esc((n.motivos||[]).join(' · '))}</span>
          <span class="fnw-meta">${esc(n.tag||'')} ${esc(n.source)}${n.date ? ' · ' + esc(ago(n.date)) : ''}</span>
        </span>
      </a>`).join('')
      : `<div class="fnw-empty">
           ${st && st.error ? 'No se pudo traer la selección del día.' : 'Sin noticias de impacto en las últimas horas.'}
           <span>El panel prefiere no mostrar nada antes que rellenar con ruido.</span>
         </div>`;

    host.innerHTML = `
      <div class="fnw-head">
        <div>
          <div class="fnw-t">📰 Lo que mueve tu plata hoy</div>
          <div class="fnw-s">${items.length ? items.length + ' de mayor impacto' : 'selección del día'}${
            st && st.generatedAt ? ' · ' + esc(ago(st.generatedAt)) : ''}</div>
        </div>
        <button class="fnw-x" id="fnwClose" aria-label="Cerrar noticias">✕</button>
      </div>
      <div class="fnw-list">${cuerpo}</div>
      <div class="fnw-foot">
        Elegidas por impacto sobre tu bolsillo: tema (dólar, inflación, tasas, impuestos),
        peso de la fuente y frescura, con máximo 2 por medio. Enlazan al original.
        <button class="fnw-more" id="fnwAll">Ver todos los titulares →</button>
      </div>`;

    const x = document.getElementById('fnwClose');
    if (x) x.onclick = () => toggle(false);

    const all = document.getElementById('fnwAll');
    if (all) all.onclick = () => {
      toggle(false);
      const b = document.querySelector('.sec[data-s="glob"]');
      if (b) { b.click(); window.scrollTo({ top:0, behavior:'smooth' }); }
    };
  }

  function toggle(force) {
    _open = force == null ? !_open : !!force;
    const p = document.getElementById('finNewsPanel');
    const b = document.getElementById('finNewsBubble');
    if (p) p.classList.toggle('on', _open);
    if (b) { b.classList.toggle('on', _open); b.setAttribute('aria-expanded', String(_open)); }
    if (_open) {
      // Solo una burbuja abierta a la vez: comparten el mismo hueco.
      if (window.FINCALC && FINCALC.toggle) FINCALC.toggle(false);
      try { localStorage.setItem(SEEN_KEY, hoy()); } catch {}
      _badge();
      _render();
      if (!_state || !(_state.items||[]).length) load(false).then(_render);
    }
  }

  function _inject() {
    if (document.getElementById('finNewsBubble')) return;

    const st = document.createElement('style');
    st.textContent = `
#finNewsBubble{position:fixed;bottom:14px;left:70px;z-index:99990;width:48px;height:48px;border-radius:50%;
 border:1px solid var(--bd,#27272a);background:var(--c1,#16161a);color:var(--tx,#fafafa);font-size:19px;
 cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(0,0,0,.45);
 transition:transform .18s cubic-bezier(.4,0,.2,1),border-color .18s,background .18s}
#finNewsBubble:hover{transform:translateY(-2px) scale(1.05);border-color:var(--ac,#8b5cf6);background:var(--el,#222228)}
#finNewsBubble.on{background:var(--ac,#8b5cf6);border-color:var(--ac,#8b5cf6);color:#fff}
#finNewsBubble:focus-visible{outline:2px solid var(--a2,#a78bfa);outline-offset:3px}
#finNewsBubble.nuevo::after{content:'';position:absolute;top:6px;right:6px;width:9px;height:9px;
 border-radius:50%;background:var(--rd,#ef4444);border:2px solid var(--c1,#16161a)}
#finNewsPanel{position:fixed;bottom:72px;left:14px;z-index:99991;width:min(390px,calc(100vw - 28px));
 max-height:min(76vh,660px);overflow-y:auto;display:none;background:var(--c1,#16161a);
 border:1px solid var(--bd2,#3f3f46);border-radius:12px;padding:14px;
 box-shadow:0 14px 44px rgba(0,0,0,.6);font-family:'IBM Plex Sans',system-ui,sans-serif;
 font-size:13px;color:var(--tx,#fafafa);scrollbar-width:thin}
#finNewsPanel.on{display:block;animation:fnwIn .2s cubic-bezier(.4,0,.2,1)}
@keyframes fnwIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.fnw-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:11px}
.fnw-t{font-family:'Newsreader',serif;font-size:16px;font-weight:600;line-height:1.25}
.fnw-s{font-family:'IBM Plex Mono',monospace;font-size:9.5px;color:var(--t3,#52525b);margin-top:3px}
.fnw-x{background:none;border:none;color:var(--t3,#52525b);font-size:15px;cursor:pointer;padding:2px 5px;border-radius:4px;font-family:inherit}
.fnw-x:hover{color:var(--tx,#fafafa);background:var(--el,#222228)}
.fnw-list{display:flex;flex-direction:column;gap:3px}
.fnw-item{display:flex;gap:10px;align-items:flex-start;padding:10px;border-radius:7px;
 text-decoration:none;border:1px solid transparent;transition:border-color .15s,background .15s}
.fnw-item:hover{background:var(--el,#222228);border-color:var(--bd,#27272a)}
.fnw-item:focus-visible{outline:2px solid var(--a2,#a78bfa);outline-offset:-1px}
.fnw-num{font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:600;color:var(--ac,#8b5cf6);
 flex-shrink:0;width:16px;text-align:center;padding-top:1px}
.fnw-body{display:flex;flex-direction:column;gap:4px;min-width:0}
.fnw-title{font-size:12.5px;color:var(--tx,#fafafa);line-height:1.45}
.fnw-why{font-size:9.5px;color:var(--a2,#a78bfa);text-transform:lowercase;letter-spacing:.02em}
.fnw-meta{font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--t3,#52525b)}
.fnw-empty{padding:24px 14px;text-align:center;font-size:12px;color:var(--t2,#a1a1aa);display:flex;flex-direction:column;gap:7px}
.fnw-empty span{font-size:10.5px;color:var(--t3,#52525b)}
.fnw-foot{font-size:10px;color:var(--t3,#52525b);line-height:1.55;margin-top:11px;padding-top:10px;border-top:1px solid var(--bd,#27272a)}
.fnw-more{display:block;margin-top:8px;background:none;border:1px dashed var(--bd2,#3f3f46);color:var(--t2,#a1a1aa);
 border-radius:6px;padding:6px 9px;font-size:10.5px;cursor:pointer;font-family:inherit;width:100%;transition:color .15s,border-color .15s}
.fnw-more:hover{color:var(--tx,#fafafa);border-color:var(--ac,#8b5cf6)}
@media (max-width:560px){#finNewsPanel{left:14px;right:14px;width:auto;max-height:70vh}}
@media (prefers-reduced-motion:reduce){#finNewsPanel.on{animation:none}#finNewsBubble{transition:none}}
`;
    document.head.appendChild(st);

    const b = document.createElement('button');
    b.id = 'finNewsBubble'; b.type = 'button'; b.textContent = '📰';
    b.title = 'Noticias del día (Alt+N)';
    b.setAttribute('aria-label', 'Ver las noticias más relevantes del día');
    b.setAttribute('aria-expanded', 'false');
    b.onclick = () => toggle();

    const p = document.createElement('div');
    p.id = 'finNewsPanel';
    p.setAttribute('role','dialog');
    p.setAttribute('aria-label','Noticias más relevantes del día');

    document.body.appendChild(b);
    document.body.appendChild(p);

    document.addEventListener('keydown', e => {
      if (e.altKey && (e.key === 'n' || e.key === 'N')) { e.preventDefault(); toggle(); }
      if (e.key === 'Escape' && _open) toggle(false);
    });
  }

  function init() {
    _inject();
    _state = cacheGet();
    _badge();
    load(false);          // en segundo plano: el punto rojo aparece cuando llega
  }

  return { init, toggle, load, get state() { return _state; } };
})();

window.FINNEWS = FINNEWS;
