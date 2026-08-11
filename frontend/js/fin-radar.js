/* ═══════════════════════════════════════════════════════════════
   DA-2026 · 12-FIN · Radar de oportunidades (Fase 3)
   ─────────────────────────────────────────────────────────────
   Dos herramientas, ambas en vivo (SECOP responde en ~630 ms):

     🔭 Contratos públicos — SECOP II (p6dx-8zbt), filtrado por las
        palabras de TU oficio. Es la vía más concreta a un ingreso
        propio y casi nadie la revisa: son ~1M de procesos abiertos.
     🔔 Reglas de vigilancia — umbrales que vos definís sobre los
        indicadores reales (TRM, inflación, tasa de política, CDT).

   Lo que NO hay acá, a propósito: un "calendario económico". No
   tengo una fuente verificada de las fechas de 2026 de las juntas
   del Banrep ni del DANE, y la regla del proyecto es que un dato
   sin fuente no se muestra. Se informa la CADENCIA observada en los
   propios datos, que sí es verificable.

   Se guarda en fin_radar_cfg y fin_alerts (sincronizan: son tuyos).
═══════════════════════════════════════════════════════════════ */

const FINRADAR = (() => {

  const SECOP = 'https://www.datos.gov.co/resource/p6dx-8zbt.json';
  const CFG_KEY = 'fin_radar_cfg';
  const ALERT_KEY = 'fin_alerts';

  const DEFAULT_CFG = {
    palabras: ['ANALISIS DE DATOS', 'CONCILIACION', 'POWER BI', 'AUTOMATIZACION'],
    ciudad: '',
    montoMin: 0,
    dias: 45
  };

  /* Indicadores vigilables. `get` los lee del estado vivo de FINCO. */
  const METRICAS = {
    trm:    { label:'Dólar (TRM)',        unit:'COP', get:d => d.trm && d.trm.value },
    cpi:    { label:'Inflación anual',    unit:'%',   get:d => d.cpi && d.cpi.value },
    policy: { label:'Tasa de política',   unit:'%',   get:d => d.policy && d.policy.value },
    ibr:    { label:'IBR overnight',      unit:'%',   get:d => d.ibr && d.ibr.value }
  };

  let _tab = 'secop';
  let _lastSecop = null;

  const esc = s => String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const nf = (n,d=2) => isFinite(n) ? new Intl.NumberFormat('es-CO',{minimumFractionDigits:d,maximumFractionDigits:d}).format(n) : '—';
  const money = n => isFinite(n) ? '$' + new Intl.NumberFormat('es-CO',{maximumFractionDigits:0}).format(Math.round(n)) : '—';
  const compact = n => !isFinite(n) ? '—'
    : n >= 1e9 ? '$' + (n/1e9).toFixed(1) + ' mil M'
    : n >= 1e6 ? '$' + Math.round(n/1e6) + ' M'
    : money(n);
  const dias = iso => {
    if (!iso) return '';
    const d = Math.round((Date.now() - Date.parse(iso)) / 86400000);
    if (isNaN(d)) return '';
    return d <= 0 ? 'hoy' : d === 1 ? 'ayer' : `hace ${d} días`;
  };

  const cfgGet = () => { try { return Object.assign({}, DEFAULT_CFG, JSON.parse(localStorage.getItem(CFG_KEY) || '{}')); } catch { return Object.assign({}, DEFAULT_CFG); } };
  const cfgSet = c => { try { localStorage.setItem(CFG_KEY, JSON.stringify(c)); } catch {} };
  const alertsGet = () => { try { return JSON.parse(localStorage.getItem(ALERT_KEY) || '[]'); } catch { return []; } };
  const alertsSet = a => { try { localStorage.setItem(ALERT_KEY, JSON.stringify(a)); } catch {} };

  const liveData = () => (window.FINCO && FINCO.state && FINCO.state.data) || {};

  /* ═════════ 🔭 SECOP ═════════ */

  async function loadSecop(cfg) {
    const desde = new Date(Date.now() - cfg.dias * 86400000).toISOString().slice(0,10);
    const pal = (cfg.palabras || []).filter(Boolean).slice(0, 8);
    if (!pal.length) return { rows: [], desde, cfg };

    const likes = pal.map(p =>
      `upper(nombre_del_procedimiento) like '%${String(p).toUpperCase().replace(/'/g,"''")}%'`).join(' OR ');

    let where = `fecha_de_publicacion_del>'${desde}' AND (${likes})`;
    if (cfg.montoMin > 0) where += ` AND precio_base>${cfg.montoMin}`;
    if (cfg.ciudad) where += ` AND upper(ciudad_entidad) like '%${cfg.ciudad.toUpperCase().replace(/'/g,"''")}%'`;

    const url = SECOP + '?' + encodeURI(
      `$select=entidad,nombre_del_procedimiento,precio_base,fase,fecha_de_publicacion_del,` +
      `ciudad_entidad,modalidad_de_contratacion,duracion,unidad_de_duracion,id_del_proceso` +
      `&$where=${where}&$order=fecha_de_publicacion_del DESC&$limit=40`);

    const res = await fetch(url, { cache:'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const rows = await res.json();
    return { rows: Array.isArray(rows) ? rows : [], desde, cfg };
  }

  function renderSecop(d) {
    const c = d.cfg;
    const total = d.rows.reduce((a,r) => a + (+r.precio_base || 0), 0);

    const filas = d.rows.map(r => `<div class="frd-item">
      <div class="frd-i-top">
        <span class="frd-i-money">${compact(+r.precio_base)}</span>
        <span class="frd-i-when">${esc(dias(r.fecha_de_publicacion_del))}</span>
      </div>
      <div class="frd-i-title">${esc(r.nombre_del_procedimiento || '(sin nombre)')}</div>
      <div class="frd-i-meta">
        <span>🏛 ${esc((r.entidad || '').slice(0,52))}</span>
        <span>📍 ${esc(r.ciudad_entidad || '—')}</span>
        ${r.duracion ? `<span>⏱ ${esc(r.duracion)} ${esc(r.unidad_de_duracion || '')}</span>` : ''}
        <span class="frd-i-fase">${esc(r.fase || '')}</span>
      </div>
    </div>`).join('');

    return `
      <div class="fco-intro">
        <b>Contratación pública filtrada por tu oficio.</b>
        Todo proceso del Estado se publica acá por ley. La mayoría de la gente nunca lo mira:
        son cientos de miles de procesos y sin filtro es ilegible. Poné las palabras de lo que
        sabés hacer y mirá qué se está pidiendo, con presupuesto y plazo.
      </div>

      <div class="frd-form">
        <label class="frd-f">
          <span>Palabras de tu oficio <em>separadas por coma</em></span>
          <input class="inp" id="rdPal" value="${esc((c.palabras || []).join(', '))}" placeholder="análisis de datos, conciliación, SQL">
        </label>
        <div class="frd-row">
          <label class="frd-f"><span>Ciudad <em>opcional</em></span>
            <input class="inp" id="rdCiu" value="${esc(c.ciudad)}" placeholder="Bogotá"></label>
          <label class="frd-f"><span>Presupuesto mínimo</span>
            <select class="sel" id="rdMon">
              ${[[0,'Cualquiera'],[5e6,'$5 M+'],[20e6,'$20 M+'],[50e6,'$50 M+'],[100e6,'$100 M+']]
                .map(([v,l])=>`<option value="${v}"${+c.montoMin===v?' selected':''}>${l}</option>`).join('')}
            </select></label>
          <label class="frd-f"><span>Publicados en</span>
            <select class="sel" id="rdDias">
              ${[[15,'15 días'],[30,'30 días'],[45,'45 días'],[90,'90 días']]
                .map(([v,l])=>`<option value="${v}"${+c.dias===v?' selected':''}>${l}</option>`).join('')}
            </select></label>
        </div>
        <button class="btn bp bs" id="rdGo">🔎 Buscar</button>
      </div>

      ${d.rows.length ? `
        <div class="frd-sum">
          <b>${d.rows.length}</b> procesos · <b>${compact(total)}</b> en presupuesto sumado
        </div>
        <div class="frd-list">${filas}</div>`
        : `<div class="fco-empty">Ningún proceso con esos filtros en el período.<br>
             <span class="fco-dim">Probá con menos palabras, más días o sin mínimo de presupuesto.</span></div>`}

      <div class="fco-src">SECOP II · datos.gov.co · publicados desde ${esc(d.desde)} ·
        Buscá el proceso por su nombre en <b>secop.gov.co</b> para ver pliegos y postularte.
        Este panel te avisa que existe; el trámite es por el portal oficial.</div>`;
  }

  /* ═════════ 🔔 Alertas ═════════ */

  function evalAlert(a, data) {
    const m = METRICAS[a.metrica];
    if (!m) return { estado:'sin-metrica' };
    const v = m.get(data);
    if (v == null || !isFinite(v)) return { estado:'sin-dato' };
    const disparada = a.dir === 'mayor' ? v > a.valor : v < a.valor;
    return { estado: disparada ? 'disparada' : 'espera', actual: v };
  }

  function renderAlerts() {
    const data = liveData();
    const list = alertsGet();

    const filas = list.map((a, i) => {
      const r = evalAlert(a, data);
      const m = METRICAS[a.metrica] || { label:a.metrica, unit:'' };
      const cls = r.estado === 'disparada' ? 'frd-on' : (r.estado === 'espera' ? 'frd-off' : 'frd-na');
      const txt = r.estado === 'disparada' ? '🔔 se cumplió'
                : r.estado === 'espera'    ? '○ esperando'
                : '— sin dato';
      return `<div class="frd-alert ${cls}">
        <div class="frd-a-body">
          <b>${esc(m.label)} ${a.dir === 'mayor' ? '>' : '<'} ${nf(a.valor)}${esc(m.unit)}</b>
          <span>Ahora: ${r.actual != null ? nf(r.actual) + esc(m.unit) : '—'}${a.nota ? ' · ' + esc(a.nota) : ''}</span>
        </div>
        <span class="frd-a-state">${txt}</span>
        <button class="frd-a-del" data-alert-del="${i}" aria-label="Eliminar regla">✕</button>
      </div>`;
    }).join('');

    return `
      <div class="fco-intro">
        <b>Reglas de vigilancia sobre los datos reales.</b>
        En vez de revisar el dólar todos los días, definís una vez qué te importa
        y el panel te lo dice cuando entrás. Se evalúan contra las cifras oficiales de la
        pestaña Hoy, no contra estimaciones.
      </div>

      <div class="frd-form frd-form-row">
        <select class="sel" id="alMet">
          ${Object.entries(METRICAS).map(([k,m])=>`<option value="${k}">${esc(m.label)}</option>`).join('')}
        </select>
        <select class="sel" id="alDir">
          <option value="menor">baja de</option>
          <option value="mayor">sube de</option>
        </select>
        <input class="inp" id="alVal" type="number" step="any" placeholder="valor" style="max-width:110px">
        <input class="inp" id="alNota" placeholder="por qué te importa (opcional)">
        <button class="btn bp bs" id="alAdd">+ Añadir</button>
      </div>

      ${list.length ? `<div class="frd-alerts">${filas}</div>`
        : `<div class="fco-empty">Todavía no tenés reglas.<br>
             <span class="fco-dim">Ejemplo: «Dólar baja de 3.100» si estás esperando para comprar dólares,
             o «Inflación baja de 5%» para saber cuándo tu CDT empieza a rendir más de verdad.</span></div>`}

      <div class="fco-src">Las reglas viajan a tus otros equipos. Se evalúan al abrir el panel:
        el Cerebro no manda notificaciones ni corre en segundo plano.</div>`;
  }

  /* ═════════ Orquestación ═════════ */

  const TABS = [
    { id:'secop',  icon:'🔭', label:'Contratos', sub:'oportunidades de ingreso' },
    { id:'alerts', icon:'🔔', label:'Alertas',   sub:'tus reglas de vigilancia' }
  ];

  function shell(inner, loading) {
    return `
      <div class="fc-head">
        <div>
          <div class="fc-title">🔭 Radar</div>
          <div class="fc-sub">Lo que se está moviendo y te puede servir</div>
        </div>
      </div>
      <div class="fco-tabs">
        ${TABS.map(t => `<button class="fco-tab${t.id===_tab?' on':''}" data-rdt="${t.id}">
          <b>${t.icon} ${esc(t.label)}</b><span>${esc(t.sub)}</span></button>`).join('')}
      </div>
      <div class="fco-body">${loading ? '<div class="fco-empty">⟳ Consultando SECOP II…</div>' : inner}</div>`;
  }

  async function show(tab) {
    _tab = tab || _tab;
    const host = document.getElementById('p-radar');
    if (!host) return;

    if (_tab === 'alerts') { host.innerHTML = shell(renderAlerts()); wire(); return; }

    if (_lastSecop) { host.innerHTML = shell(renderSecop(_lastSecop)); wire(); return; }

    host.innerHTML = shell('', true);
    wire();
    try {
      _lastSecop = await loadSecop(cfgGet());
      host.innerHTML = shell(renderSecop(_lastSecop));
    } catch (e) {
      console.warn('[FINRADAR]', e && e.message);
      host.innerHTML = shell(`<div class="fco-empty">No se pudo consultar SECOP II.<br>
        <span class="fco-dim">${esc(e && e.message)}</span>
        <button class="btn bp bs" id="rdRetry">Reintentar</button></div>`);
    }
    wire();
  }

  async function buscar() {
    const g = id => document.getElementById(id);
    const cfg = {
      palabras: (g('rdPal')?.value || '').split(',').map(s => s.trim()).filter(Boolean),
      ciudad:   (g('rdCiu')?.value || '').trim(),
      montoMin: +(g('rdMon')?.value || 0),
      dias:     +(g('rdDias')?.value || 45)
    };
    cfgSet(cfg);
    _lastSecop = null;
    const host = document.getElementById('p-radar');
    host.innerHTML = shell('', true); wire();
    try { _lastSecop = await loadSecop(cfg); host.innerHTML = shell(renderSecop(_lastSecop)); }
    catch (e) { host.innerHTML = shell(`<div class="fco-empty">Error: ${esc(e && e.message)}</div>`); }
    wire();
  }

  function wire() {
    const host = document.getElementById('p-radar');
    if (!host) return;

    host.querySelectorAll('[data-rdt]').forEach(b => { b.onclick = () => show(b.dataset.rdt); });

    const go = host.querySelector('#rdGo');
    if (go) go.onclick = buscar;
    const pal = host.querySelector('#rdPal');
    if (pal) pal.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); buscar(); } };

    const retry = host.querySelector('#rdRetry');
    if (retry) retry.onclick = () => { _lastSecop = null; show('secop'); };

    const add = host.querySelector('#alAdd');
    if (add) add.onclick = () => {
      const v = parseFloat(host.querySelector('#alVal').value);
      if (!isFinite(v)) { host.querySelector('#alVal').focus(); return; }
      const list = alertsGet();
      list.push({
        metrica: host.querySelector('#alMet').value,
        dir:     host.querySelector('#alDir').value,
        valor:   v,
        nota:    (host.querySelector('#alNota').value || '').trim().slice(0, 90)
      });
      alertsSet(list);
      show('alerts');
    };

    host.querySelectorAll('[data-alert-del]').forEach(b => {
      b.onclick = () => { const l = alertsGet(); l.splice(+b.dataset.alertDel, 1); alertsSet(l); show('alerts'); };
    });
  }

  /** Cuántas reglas están disparadas — lo usa la pestaña Hoy. */
  function pendientes() {
    const data = liveData();
    return alertsGet().filter(a => evalAlert(a, data).estado === 'disparada').length;
  }

  function init() {
    if (!document.getElementById('p-radar')) return;
    show(_tab);
  }

  return { init, show, pendientes };
})();

window.FINRADAR = FINRADAR;
