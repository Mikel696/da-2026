/* ═══════════════════════════════════════════════════════════════
   DA-2026 · 12-FIN · Conector de datos macro de Colombia
   ─────────────────────────────────────────────────────────────
   Fuentes (verificadas 2026-08-10):
     · Banco de la República — DataSerie/indicadores_principales
       Devuelve TRM, tasa de política, IBR, inflación, PIB, desempleo
       y cuenta corriente con serie histórica, en UNA sola llamada.
       No expone CORS → se pasa por el proxy que ya usa 7-NEW.
     · datos.gov.co (Socrata) — TRM oficial, CORS abierto, sin llave.
       Es la fuente primaria de la TRM y el respaldo si Banrep falla.

   Regla del módulo: si una fuente no responde, se muestra el último
   valor cacheado CON su fecha. Nunca se estima ni se rellena.
═══════════════════════════════════════════════════════════════ */

const FINCO = (() => {

  /* Foto diaria del repo: MISMO origen, sin CORS, sin proxy, sin llaves.
     La genera scripts/fetch-macro.mjs desde GitHub Actions.
     Trae las 7 series del Banco de la República con su historia. */
  const SNAPSHOT = 'data/macro-co.json';

  /* TRM oficial en directo. CORS abierto, sin llave: es el único dato que
     cambia a diario y por eso vale traerlo en vivo. */
  const TRM_URL = 'https://www.datos.gov.co/resource/ceyp-9c7c.json?$order=vigenciadesde%20DESC&$limit=90';

  /* NOTA · el proxy público (allorigins) se eliminó el 2026-08-11.
     Servía para alcanzar el Banrep desde el navegador, pero: (a) devolvía
     522 de forma intermitente a las peticiones con cabecera Origin, (b) su
     fallo ensuciaba la consola con un error CORS que el navegador emite y
     no se puede capturar, y (c) los indicadores que refrescaba cambian una
     vez al mes o al trimestre — la foto diaria ya los cubre de sobra.
     Un tercero gratuito que aporta poco y falla seguido es deuda, no
     redundancia. La TRM, que sí es diaria, viene directo arriba. */

  const CACHE_KEY = 'fin_mkt_cache';   // local-only (en SKIP_KEYS de cloud-sync)


  /* Mapa de series del Banrep → nuestra nomenclatura.
     Las etiquetas son NUESTRAS: el campo `unidad` que devuelve la API
     viene con la codificación rota ("Variaci?n porcentual"). */
  const SERIES = {
    '1':     { key:'trm',    label:'Dólar · TRM',       unit:'COP',    kind:'money' },
    '59':    { key:'policy', label:'Tasa de política',  unit:'% E.A.', kind:'pct'   },
    '241':   { key:'ibr',    label:'IBR overnight',     unit:'%',      kind:'pct'   },
    '15270': { key:'cpi',    label:'Inflación anual',   unit:'%',      kind:'pct'   },
    '15271': { key:'gdp',    label:'PIB · crecimiento', unit:'%',      kind:'pct'   },
    '15312': { key:'unemp',  label:'Desempleo',         unit:'%',      kind:'pct'   },
    '15290': { key:'cacc',   label:'Cuenta corriente',  unit:'% PIB',  kind:'pct'   }
  };

  const META_TARGET = 3;   // meta de inflación del Banrep, dato público y estable

  let _state = null;
  let _loading = false;


  /* ── Utilidades ── */

  const _esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const _nf = (n, d = 2) => {
    if (!isFinite(n)) return '—';
    return new Intl.NumberFormat('es-CO', { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);
  };

  const _fmt = (v, kind) => {
    if (v == null || !isFinite(v)) return '—';
    return kind === 'money' ? _nf(v, 2) : _nf(v, 2);
  };

  const _dateEs = iso => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d)) return '—';
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const _ageLabel = ts => {
    if (!ts) return 'nunca';
    const m = Math.round((Date.now() - ts) / 60000);
    if (m < 1) return 'hace instantes';
    if (m < 60) return `hace ${m} min`;
    const h = Math.round(m / 60);
    if (h < 24) return `hace ${h} h`;
    return `hace ${Math.round(h / 24)} d`;
  };


  /* ── Caché local ── */

  function _cacheGet() {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); }
    catch { return null; }
  }

  function _cacheSet(obj) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(obj)); }
    catch (e) { console.warn('[FINCO] no se pudo cachear:', e && e.message); }
  }


  /* ── Fetch ── */

  /** La foto del repo. Nunca depende de terceros: si la página carga,
   *  esto carga. Es lo que garantiza que el panel jamás salga vacío.
   *
   *  El parámetro `?d=YYYY-MM-DD` cambia cada día: garantiza una URL nueva
   *  al cruzar la medianoche y esquiva cualquier copia vieja que la CDN de
   *  GitHub Pages tenga guardada. Dentro del mismo día la URL es estable,
   *  así que el caché HTTP (600 s) sigue haciendo su trabajo. */
  async function _fetchSnapshot() {
    const dia = new Date().toISOString().slice(0, 10);
    const res = await fetch(`${SNAPSHOT}?d=${dia}`, { cache: 'no-cache' });
    if (!res.ok) throw new Error('snapshot HTTP ' + res.status);
    const j = await res.json();
    if (!j || !j.data || !Object.keys(j.data).length) throw new Error('snapshot vacío');
    return j;
  }

  /** TRM oficial directo de datos.gov.co (CORS abierto, sin llave). */
  async function _fetchTrm() {
    const res = await fetch(TRM_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error('TRM HTTP ' + res.status);
    const rows = await res.json();
    if (!Array.isArray(rows) || !rows.length) throw new Error('TRM sin filas');

    const pts = rows
      .filter(r => r && isFinite(+r.valor) && r.vigenciadesde)
      .map(r => [new Date(r.vigenciadesde).getTime(), +r.valor])
      .sort((a, b) => a[0] - b[0]);
    if (!pts.length) throw new Error('TRM sin puntos válidos');

    const last = pts[pts.length - 1];
    return {
      label: 'Dólar · TRM', unit: 'COP', kind: 'money',
      value: last[1], asOf: new Date(last[0]).toISOString(),
      source: 'datos.gov.co · Superfinanciera',
      series: pts
    };
  }


  /* ── Carga orquestada ── */

  async function load(force) {
    if (_loading) return _state;
    const cached = _cacheGet();

    /* NO hay puerta de TTL acá, a propósito.
       Antes, un caché "sano" de menos de 6 h cortocircuitaba la carga entera.
       Consecuencia real (2026-08-12): el navegador bajó la foto cuando el
       servidor todavía servía la de ayer, la guardó, y el panel quedó pegado
       en «actualizado 11 de ago» durante seis horas AUNQUE el servidor ya
       tenía la del 12 — con la tarjeta de la TRM, que sí es en vivo, diciendo
       «corte 12 de ago» justo al lado. El panel se contradecía solo.

       El snapshot es un archivo de 26 KB de NUESTRO propio origen: traerlo no
       cuesta cuota ni depende de nadie. Se pide siempre, una vez por carga de
       página, y el caché HTTP (600 s) evita el tráfico repetido.
       El caché en localStorage queda para lo único que sirve de verdad:
       tener algo que mostrar cuando no hay red. */

    _loading = true;
    render();   // pinta el estado "actualizando" sobre lo que ya haya

    const prev = cached && cached.data ? cached.data : {};
    const data = Object.assign({}, prev);
    const errors = [];
    let snapAt = null;

    /* Orden deliberado, de lo más confiable a lo más fresco:
       1. la foto del repo (mismo origen, nunca falla si la página cargó),
       2. datos.gov.co directo, que refresca la TRM del día,
       3. el proxy del Banrep, que es "mejor si está" y nada más.
       Todas en paralelo; cada una solo pisa lo suyo si tuvo éxito. */
    const [snap, trm] = await Promise.allSettled([_fetchSnapshot(), _fetchTrm()]);

    if (snap.status === 'fulfilled') {
      Object.assign(data, snap.value.data);
      snapAt = snap.value.generatedAt || null;
    } else {
      errors.push('Foto del repo: ' + (snap.reason && snap.reason.message));
    }

    // datos.gov.co manda sobre todo para la TRM: llega directo, sin
    // intermediario que pueda degradarla.
    if (trm.status === 'fulfilled') data.trm = trm.value;
    else if (snap.status !== 'fulfilled') errors.push('TRM: ' + (trm.reason && trm.reason.message));

    _loading = false;

    if (!Object.keys(data).length) {
      _state = cached || { data: {}, fetchedAt: null, errors };
      render();
      return _state;
    }

    _state = {
      data,
      fetchedAt: Date.now(),
      snapshotAt: snapAt,
      live: trm.status === 'fulfilled',
      partial: errors.length > 0,
      errors
    };
    _cacheSet(_state);
    render();
    // La calculadora flotante escucha esto para refrescar sus campos "en vivo".
    window.dispatchEvent(new CustomEvent('finco:updated', { detail: { keys: Object.keys(data) } }));
    return _state;
  }


  /* ── Miniatura SVG (misma técnica que el resto del Cerebro: SVG a mano) ── */

  function _spark(points, color) {
    if (!points || points.length < 2) return '';
    const vals = points.map(p => p[1]);
    const min = Math.min(...vals), max = Math.max(...vals);
    const span = (max - min) || 1;
    const W = 200, H = 34;
    const step = W / (points.length - 1);

    const coords = points.map((p, i) => {
      const x = (i * step).toFixed(1);
      const y = (H - ((p[1] - min) / span) * (H - 4) - 2).toFixed(1);
      return x + ',' + y;
    });

    const line = coords.join(' ');
    const area = `0,${H} ${line} ${W},${H}`;
    const gid  = 'sp' + Math.random().toString(36).slice(2, 8);
    const lastY = coords[coords.length - 1].split(',')[1];

    return `<svg class="fc-spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${color}" stop-opacity=".26"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
      </linearGradient></defs>
      <polygon fill="url(#${gid})" points="${area}"/>
      <polyline fill="none" stroke="${color}" stroke-width="1.4" stroke-linejoin="round" points="${line}"/>
      <circle cx="${W}" cy="${lastY}" r="2.2" fill="${color}"/>
    </svg>`;
  }

  const WINDOW_MONTHS = 12;

  /** Recorta la serie a los últimos N meses. Todas las tarjetas usan la
   *  MISMA ventana, para que se puedan comparar entre sí: si cada una
   *  midiera su propio rango, un "▲35%" al lado de la inflación estaría
   *  hablando de 5 años mientras el de la TRM habla de 3 meses. */
  function _window(points, months) {
    if (!points || !points.length) return points || [];
    const cut = Date.now() - months * 30.44 * 86400000;
    const w = points.filter(p => p[0] >= cut);
    return w.length >= 2 ? w : points.slice(-2);
  }

  /** Variación punta a punta DENTRO de la ventana, con su período real. */
  function _delta(points) {
    if (!points || points.length < 2) return null;
    const a = points[0][1], b = points[points.length - 1][1];
    if (!a) return null;

    const days = Math.round((points[points.length - 1][0] - points[0][0]) / 86400000);
    let span;
    if (days < 45)       span = days + ' d';
    else if (days < 400) span = Math.round(days / 30.44) + ' m';
    else                 span = (days / 365).toFixed(1) + ' a';

    // Con valores negativos (cuenta corriente) el % es engañoso: se informa
    // la diferencia en puntos, que es como lo lee un economista.
    if (a < 0 || b < 0) {
      return { pts: b - a, span, absolute: true };
    }
    return { pct: ((b - a) / Math.abs(a)) * 100, span, absolute: false };
  }


  /* ── Render ── */

  function _cardHtml(item, opts) {
    if (!item) return '';
    const o = opts || {};
    const win = _window(item.series, WINDOW_MONTHS);
    const d = _delta(win);
    const color = o.color || 'var(--ac)';

    let deltaHtml = '<span class="fc-d fc-flat">—</span>';
    if (d) {
      const raw = d.absolute ? d.pts : d.pct;
      const flat = Math.abs(raw) < (d.absolute ? 0.01 : 0.05);
      const good = o.lowerIsBetter ? raw < 0 : raw > 0;
      const cls  = flat ? 'fc-flat' : (good ? 'fc-up' : 'fc-down');
      const arrow = flat ? '=' : (raw > 0 ? '▲' : '▼');
      const num = d.absolute
        ? _nf(Math.abs(d.pts), 2) + ' pts'
        : _nf(Math.abs(d.pct), 1) + '%';
      deltaHtml = `<span class="fc-d ${cls}" title="Variación en los últimos ${_esc(d.span)}">${arrow} ${num} <span class="fc-span">${_esc(d.span)}</span></span>`;
    }

    return `<div class="fc-card">
      <div class="fc-lbl"><span>${_esc(item.label)}</span>${deltaHtml}</div>
      <div class="fc-val">${_fmt(item.value, item.kind)}<small>${_esc(item.unit)}</small></div>
      ${_spark(win, color)}
      <div class="fc-src">${_esc(item.source || 'fuente oficial')} · corte ${_dateEs(item.asOf)}</div>
    </div>`;
  }

  function _semaforoHtml(cpi) {
    if (!cpi) {
      return `<div class="fc-empty">Sin dato de inflación todavía. Pulsá «Actualizar» arriba.</div>`;
    }
    const infl = cpi.value;
    let rate = null;
    try { rate = JSON.parse(localStorage.getItem('fin_my_rate') || 'null'); } catch {}

    const rows = [
      { name: 'Efectivo en casa',      r: 0 },
      { name: 'Cuenta de ahorros típica', r: null, note: 'poné tu tasa real abajo' }
    ];
    if (rate != null && isFinite(rate)) {
      rows.splice(1, 1, { name: 'Tu producto de ahorro', r: +rate });
    }

    const body = rows.map(row => {
      if (row.r == null) {
        return `<tr><td>${_esc(row.name)}</td><td class="fc-n">—</td><td class="fc-n">—</td>
          <td><span class="fc-tag fc-tag-c">${_esc(row.note || 'sin dato')}</span></td></tr>`;
      }
      const real = row.r - infl;
      const win  = real >= 0;
      return `<tr>
        <td>${_esc(row.name)}</td>
        <td class="fc-n">${_nf(row.r, 2)}%</td>
        <td class="fc-n" style="color:${win ? 'var(--gn)' : 'var(--rd)'}">${real >= 0 ? '+' : ''}${_nf(real, 2)}%</td>
        <td><span class="fc-tag ${win ? 'fc-tag-g' : 'fc-tag-r'}">${win ? 'gana' : 'pierde'}</span></td>
      </tr>`;
    }).join('');

    const over = infl - META_TARGET;
    return `
      <div class="fc-infl">
        <div>
          <div class="fc-infl-n">${_nf(infl, 2)}%</div>
          <div class="fc-infl-l">inflación anual · meta ${META_TARGET}%</div>
        </div>
        <div class="fc-infl-bar" title="Inflación contra la meta del Banco de la República">
          <div class="fc-infl-fill" style="width:${Math.min(100, (infl / 12) * 100).toFixed(1)}%"></div>
          <div class="fc-infl-mark" style="left:${((META_TARGET / 12) * 100).toFixed(1)}%"></div>
        </div>
        <div class="fc-infl-gap ${over > 0 ? 'fc-down' : 'fc-up'}">
          ${over > 0 ? '+' : ''}${_nf(over, 2)} pts sobre la meta
        </div>
      </div>
      <table class="fc-tbl">
        <thead><tr><th>Dónde está tu plata</th><th class="fc-n">Rinde</th><th class="fc-n">Real</th><th>Veredicto</th></tr></thead>
        <tbody>${body}</tbody>
      </table>
      <div class="fc-rate">
        <label for="fcRate">¿Cuánto te rinde tu plata al año?</label>
        <input class="inp" id="fcRate" type="number" step="0.01" placeholder="ej. 9.5" value="${rate != null ? _esc(rate) : ''}">
        <span>%</span>
        <button class="btn bp bs" id="fcRateSave">Calcular</button>
      </div>
      <div class="fc-note">
        «Real» es lo que queda después de descontar la inflación. Un CDT al 9% con
        inflación del ${_nf(infl, 2)}% te deja ${_nf(9 - infl, 2)}% de poder de compra, no 9%.
      </div>`;
  }

  /* ── Briefing del día ──────────────────────────────────────────
     Un centro de mando tiene que decir qué requiere atención HOY.
     Acá se cruzan las tres capas que hasta ahora vivían separadas:
     las cifras del país, TU plata (finance.js) y TUS reglas (fin-radar).
     Sin este bloque el módulo mostraba datos; con él, responde. */
  function _briefing(d) {
    const partes = [];

    // 1. Reglas que se cumplieron — estaban enterradas en la pestaña Radar.
    let alertas = 0;
    try { alertas = (window.FINRADAR && FINRADAR.pendientes()) || 0; } catch {}
    if (alertas > 0) {
      partes.push(`<button class="fbr-card fbr-alert" id="fbrGoRadar">
        <span class="fbr-k">🔔 ${alertas} ${alertas === 1 ? 'regla se cumplió' : 'reglas se cumplieron'}</span>
        <span class="fbr-v">Ver en el Radar →</span>
      </button>`);
    }

    // 1b. Tesis que toca revisar. El aprendizaje se evapora si no se cierra
    // a tiempo: cuando ya sabés el desenlace, es fácil recordar que "siempre
    // lo supiste". Por eso el aviso sube acá arriba.
    let tesis = 0;
    try { tesis = (window.FINLAB && FINLAB.pendientes()) || 0; } catch {}
    if (tesis > 0) {
      partes.push(`<button class="fbr-card fbr-alert" id="fbrGoLab">
        <span class="fbr-k">🧮 ${tesis} ${tesis === 1 ? 'tesis para revisar' : 'tesis para revisar'}</span>
        <span class="fbr-v">Ver en el Laboratorio →</span>
      </button>`);
    }

    // 2. Tu mes real, traído de finance.js si está disponible.
    let m = null;
    try {
      if (typeof FIN !== 'undefined' && typeof calcMetrics === 'function') m = calcMetrics(FIN.getAll());
    } catch {}

    if (m && (m.inc || m.exp)) {
      const signo = m.bal >= 0 ? '+' : '';
      partes.push(`<div class="fbr-card">
        <span class="fbr-k">Tu mes</span>
        <span class="fbr-v ${m.bal >= 0 ? 'fc-up' : 'fc-down'}">${signo}${_nf(m.bal, 0)}</span>
        <span class="fbr-sub">${_nf(m.inc,0)} entró · ${_nf(m.exp,0)} salió</span>
      </div>`);

      // 3. Tu balance en dólares de hoy — el mismo número, otra perspectiva.
      if (d.trm && d.trm.value) {
        partes.push(`<div class="fbr-card">
          <span class="fbr-k">Eso en dólares</span>
          <span class="fbr-v">US$ ${_nf(m.bal / d.trm.value, 0)}</span>
          <span class="fbr-sub">a la TRM de hoy</span>
        </div>`);
      }

      // 4. Lo que la inflación le hace a tu ahorro si se queda quieto.
      if (d.cpi && d.cpi.value && m.sav > 0) {
        const pierde = m.sav * (d.cpi.value / 100);
        partes.push(`<div class="fbr-card">
          <span class="fbr-k">Tu ahorro quieto pierde</span>
          <span class="fbr-v fc-down">−${_nf(pierde, 0)}</span>
          <span class="fbr-sub">al año, por inflación de ${_nf(d.cpi.value)}%</span>
        </div>`);
      }
    }

    if (!partes.length) return '';
    return `<div class="fbr">${partes.join('')}</div>`;
  }

  function render() {
    const host = document.getElementById('p-hoy');
    if (!host) return;

    const st = _state || _cacheGet();
    const d  = (st && st.data) || {};
    const has = Object.keys(d).length > 0;

    /* El badge mide la edad del DATO, no la de la descarga.
       Antes mostraba `fetchedAt` — cuándo el navegador bajó el archivo — y eso
       decía «✓ hace 18 min» mientras enseñaba la foto de ayer: parecía fresco
       y no lo estaba. Lo que importa es de cuándo es la cifra. */
    const edadDato = st && st.snapshotAt ? Date.now() - Date.parse(st.snapshotAt) : null;
    const viejo = edadDato != null && edadDato > 36 * 3600 * 1000;   // >36 h = la Action no corrió

    let status;
    if (_loading) {
      status = `<span class="fc-badge fc-badge-load">⟳ actualizando…</span>`;
    } else if (!has) {
      status = `<span class="fc-badge fc-badge-off">sin datos aún</span>`;
    } else if (st && st.partial) {
      status = `<span class="fc-badge fc-badge-warn">parcial · dato de ${_dateEs(st.snapshotAt)}</span>`;
    } else if (viejo) {
      status = `<span class="fc-badge fc-badge-warn" title="La actualización diaria no corrió">⚠ dato de ${_dateEs(st.snapshotAt)}</span>`;
    } else {
      status = `<span class="fc-badge fc-badge-ok">✓ dato de hoy</span>`;
    }

    const cards = has ? [
      _cardHtml(d.trm,    { color: '#22c55e', lowerIsBetter: true }),
      _cardHtml(d.policy, { color: '#8b5cf6' }),
      _cardHtml(d.cpi,    { color: '#eab308', lowerIsBetter: true }),
      _cardHtml(d.ibr,    { color: '#06b6d4' }),
      _cardHtml(d.gdp,    { color: '#22c55e' }),
      _cardHtml(d.unemp,  { color: '#f97316', lowerIsBetter: true }),
      _cardHtml(d.cacc,   { color: '#3b82f6' })
    ].filter(Boolean).join('') : '';

    host.innerHTML = `
      <div class="fc-head">
        <div>
          <div class="fc-title">🇨🇴 El pulso de Colombia</div>
          <div class="fc-sub">${
            has && st && st.snapshotAt
              ? 'Banco de la República · actualizado ' + _dateEs(st.snapshotAt)
                + (st.live ? ' · TRM en directo de datos.gov.co' : '')
              : 'Cifras oficiales del Banco de la República y datos.gov.co'
          }</div>
        </div>
        <div class="fc-actions">
          ${status}
          <button class="btn bo bs" id="fcRefresh">↻ Actualizar</button>
        </div>
      </div>

      ${has ? _briefing(d) : ''}
      ${has ? `<div class="fc-grid">${cards}</div>` : `
        <div class="fc-empty">
          Todavía no se han traído los indicadores.
          <button class="btn bp bs" id="fcFirst">Traer datos ahora</button>
        </div>`}

      ${st && st.partial && st.errors && st.errors.length ? `
        <div class="fc-warn">
          Algunas fuentes no respondieron; se muestra el último valor bueno con su fecha.
          <span class="fc-warn-d">${_esc(st.errors.join(' · '))}</span>
        </div>` : ''}

      <div class="lb">· ¿le estás ganando a la inflación? ·</div>
      <div class="cd">${_semaforoHtml(d.cpi)}</div>
    `;

    _wire();
  }

  function _wire() {
    const goRadar = document.getElementById('fbrGoRadar');
    if (goRadar) goRadar.onclick = () => {
      const b = document.querySelector('.sec[data-s="radar"]');
      if (b) b.click();
      setTimeout(() => { const t = document.querySelector('[data-rdt="alerts"]'); if (t) t.click(); }, 120);
    };

    const goLab = document.getElementById('fbrGoLab');
    if (goLab) goLab.onclick = () => {
      const b = document.querySelector('.sec[data-s="lab"]');
      if (b) b.click();
    };

    const r = document.getElementById('fcRefresh');
    if (r) r.onclick = () => load(true);

    const f = document.getElementById('fcFirst');
    if (f) f.onclick = () => load(true);

    const save = document.getElementById('fcRateSave');
    if (save) save.onclick = () => {
      const el = document.getElementById('fcRate');
      const v = el ? parseFloat(el.value) : NaN;
      if (!isFinite(v)) { el && el.focus(); return; }
      try { localStorage.setItem('fin_my_rate', JSON.stringify(v)); } catch {}
      render();
    };
  }


  /* ── Arranque ── */

  function init() {
    if (!document.getElementById('p-hoy')) return;
    _state = _cacheGet();
    render();
    // Carga en segundo plano; si el caché está fresco no toca la red.
    load(false);
  }

  return { init, load, render, get state() { return _state; }, SERIES };
})();

window.FINCO = FINCO;
