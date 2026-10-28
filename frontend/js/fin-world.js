/* ═══════════════════════════════════════════════════════════════
   DA-2026 · 12-FIN · Panel de información financiera global
   ─────────────────────────────────────────────────────────────
   Lee data/world.json del MISMO origen — lo genera
   scripts/fetch-world.mjs desde GitHub Actions. Cero proxies,
   cero llaves, funciona sin conexión.

   Los titulares vienen de RSS: contenido EXTERNO no confiable.
   Se escapa todo y los enlaces llevan rel="noopener noreferrer".
═══════════════════════════════════════════════════════════════ */

const FINWORLD = (() => {

  const SRC = 'data/world.json';
  const CACHE_KEY = 'fin_world_cache';     // local (en SKIP_KEYS)

  const GROUPS = [
    { id:'indices',  label:'Bolsas del mundo',    hint:'Cómo viene el ánimo de los mercados grandes.' },
    { id:'materias', label:'Materias primas',     hint:'Lo que Colombia vende. Cuando suben, entran más dólares al país.' },
    { id:'divisas',  label:'El dólar',            hint:'Lo que define cuánto vale tu plata frente al mundo.' },
    { id:'colombia', label:'Colombia en Nueva York', hint:'Empresas colombianas cotizando en dólares.' },
    { id:'cripto',   label:'Cripto',              hint:'El termómetro del apetito por riesgo.' }
  ];

  let _state = null, _loading = false;

  const esc = s => String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');

  /** Solo http(s). Corta javascript:, data:, etc. de un feed comprometido. */
  const safeUrl = u => /^https?:\/\//i.test(String(u || '')) ? String(u) : '#';

  const nf = (n, d) => new Intl.NumberFormat('es-CO',
    { minimumFractionDigits:d, maximumFractionDigits:d }).format(n);

  const price = (v, cur) => {
    if (!isFinite(v)) return '—';
    const d = Math.abs(v) >= 1000 ? 0 : (Math.abs(v) >= 10 ? 2 : 4);
    return nf(v, d) + (cur ? ' ' + esc(cur) : '');
  };

  const ago = iso => {
    if (!iso) return '';
    const m = Math.round((Date.now() - Date.parse(iso)) / 60000);
    if (isNaN(m)) return '';
    if (m < 60) return `hace ${Math.max(1,m)} min`;
    const h = Math.round(m / 60);
    if (h < 24) return `hace ${h} h`;
    const d = Math.round(h / 24);
    return d === 1 ? 'ayer' : `hace ${d} días`;
  };

  /* ── Caché ── */
  const cacheGet = () => { try { return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); } catch { return null; } };
  const cacheSet = o => { try { localStorage.setItem(CACHE_KEY, JSON.stringify(o)); } catch {} };

  async function load(force) {
    if (_loading) return _state;
    const cached = cacheGet();
    /* Sin puerta de TTL: world.json es un archivo de nuestro propio origen.
       El TTL de 3 h dejaba el panel pegado en la foto de ayer aunque el
       servidor ya tuviera la de hoy (ver fin-colombia.js). El caché queda
       solo como respaldo para cuando no hay red. */

    _loading = true;
    render();
    try {
      const dia = new Date().toISOString().slice(0,10);
      const res = await fetch(`${SRC}?d=${dia}`, { cache:'no-cache' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const j = await res.json();
      _state = {
        markets: j.markets || [],
        news: j.news || [],
        generatedAt: j.generatedAt || null,
        partial: !!j.partial,
        errors: j.errors || [],
        fetchedAt: Date.now()
      };
      cacheSet(_state);
    } catch (e) {
      console.warn('[FINWORLD] no se pudo traer world.json:', e && e.message);
      _state = cached || { markets:[], news:[], generatedAt:null, partial:true, errors:[String(e && e.message)], fetchedAt:null };
    }
    _loading = false;
    render();
    return _state;
  }

  /* ── Miniatura ── */
  function spark(vals, up) {
    if (!vals || vals.length < 2) return '<div class="fw-nospark"></div>';
    const min = Math.min(...vals), max = Math.max(...vals), span = (max - min) || 1;
    const W = 120, H = 28, step = W / (vals.length - 1);
    const pts = vals.map((v, i) =>
      (i * step).toFixed(1) + ',' + (H - ((v - min) / span) * (H - 4) - 2).toFixed(1)).join(' ');
    const color = up ? 'var(--gn)' : 'var(--rd)';
    return `<svg class="fw-spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
      <polyline fill="none" stroke="${color}" stroke-width="1.4" stroke-linejoin="round" points="${pts}"/>
    </svg>`;
  }

  function card(m) {
    const up = (m.dayPct || 0) >= 0;
    const cls = m.dayPct == null ? 'flat' : (up ? 'up' : 'down');
    const arrow = m.dayPct == null ? '' : (up ? '▲' : '▼');
    return `<div class="fw-card">
      <div class="fw-top">
        <span class="fw-name">${esc(m.name)}</span>
        <span class="fw-d fw-${cls}">${arrow} ${m.dayPct != null ? nf(Math.abs(m.dayPct), 2) + '%' : '—'}</span>
      </div>
      <div class="fw-price">${price(m.price, m.currency)}</div>
      ${spark(m.series, up)}
      <div class="fw-meta">
        ${m.monthPct != null ? `<span class="fw-${m.monthPct >= 0 ? 'up' : 'down'}">${m.monthPct >= 0 ? '+' : ''}${nf(m.monthPct,1)}% en el mes</span>` : '<span></span>'}
        <span class="fw-src">${esc(m.source || '')}</span>
      </div>
      ${m.why ? `<div class="fw-why">${esc(m.why)}</div>` : ''}
    </div>`;
  }

  function render() {
    const host = document.getElementById('p-glob');
    if (!host) return;

    const st = _state || cacheGet();
    const markets = (st && st.markets) || [];
    const news = (st && st.news) || [];

    if (_loading && !markets.length) {
      host.innerHTML = `<div class="fw-empty">⟳ Trayendo mercados y titulares…</div>`;
      return;
    }
    if (!markets.length && !news.length) {
      host.innerHTML = `<div class="fw-empty">
        No se pudo traer la información global.
        <button class="btn bp bs" id="fwRetry">Reintentar</button>
      </div>`;
      const r = document.getElementById('fwRetry');
      if (r) r.onclick = () => load(true);
      return;
    }

    const grid = GROUPS.map(g => {
      const items = markets.filter(m => m.group === g.id);
      if (!items.length) return '';
      return `<div class="fw-group">
        <div class="fw-glabel">${esc(g.label)}<em>${esc(g.hint)}</em></div>
        <div class="fw-grid">${items.map(card).join('')}</div>
      </div>`;
    }).join('');

    const wall = news.map(n => `<a class="fw-news" href="${esc(safeUrl(n.link))}" target="_blank" rel="noopener noreferrer">
      <span class="fw-ntag">${esc(n.tag || '')}</span>
      <span class="fw-nbody">
        <span class="fw-ntitle">${esc(n.title)}</span>
        <span class="fw-nmeta">${esc(n.source)}${n.date ? ' · ' + esc(ago(n.date)) : ''}</span>
      </span>
    </a>`).join('');

    host.innerHTML = `
      <div class="fc-head">
        <div>
          <div class="fc-title">🌍 El mundo hoy</div>
          <div class="fc-sub">${st && st.generatedAt
            ? 'Actualizado ' + esc(ago(st.generatedAt)) + ' · Yahoo Finance, CoinGecko y prensa financiera'
            : 'Mercados y prensa financiera'}</div>
        </div>
        <div class="fc-actions">
          <span class="fc-badge ${st && st.partial ? 'fc-badge-warn' : 'fc-badge-ok'}">
            ${st && st.partial ? 'parcial' : '✓ al día'}
          </span>
          <button class="btn bo bs" id="fwRefresh">↻ Actualizar</button>
        </div>
      </div>

      ${grid}

      <div class="lb">· titulares de primera mano ·</div>
      <div class="fw-wall">${wall || '<div class="fw-empty">Sin titulares disponibles.</div>'}</div>
      <div class="fw-foot">
        Los titulares llevan a la fuente original. El Cerebro no los reescribe ni los interpreta:
        los ordena por fecha y te deja leerlos completos donde se publicaron.
      </div>
    `;

    const r = document.getElementById('fwRefresh');
    if (r) r.onclick = () => load(true);
  }

  function init() {
    if (!document.getElementById('p-glob')) return;
    _state = cacheGet();
    render();
    load(false);
  }

  return { init, load, render, get state() { return _state; } };
})();

window.FINWORLD = FINWORLD;
