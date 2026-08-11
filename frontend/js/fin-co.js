/* ═══════════════════════════════════════════════════════════════
   DA-2026 · 12-FIN · Sección Colombia (Fase 2)
   ─────────────────────────────────────────────────────────────
   Cuatro herramientas sobre datos oficiales de la Superintendencia
   Financiera, publicados en datos.gov.co (CORS abierto, sin llave):

     💰 CDT       — quién PAGA más por tu ahorro        · axk9-g2nh · en vivo (1,2 s)
     🏦 Crédito   — quién COBRA menos + tope legal      · precomputado (la consulta tarda 4,8 s)
     📈 Fondos    — screener de FIC con filtros sanos   · qhpu-8ixx · en vivo (0,9 s)
     👴 Pensiones — valor de unidad de tu AFP           · uawh-cjvi · en vivo

   Criterio de arquitectura: en vivo cuando la consulta responde rápido
   y el usuario querrá cambiar filtros; precomputado cuando la agregación
   es pesada. Medido, no supuesto.

   Anti-espejismo: los rankings crudos de estos datasets ponen primero
   basura (fondos EN LIQUIDACIÓN con 1.500% anual y 12 inversionistas;
   bancos con "0% de consumo"). Los filtros vienen puestos por defecto.
═══════════════════════════════════════════════════════════════ */

const FINCO_PANEL = (() => {

  const SODA = 'https://www.datos.gov.co/resource';
  const CREDIT_SRC = 'data/credit-co.json';

  const DS = {
    cdt:  'axk9-g2nh',
    fic:  'qhpu-8ixx',
    pens: 'uawh-cjvi'
  };

  const PLAZOS = [
    { v:'A 90 DIAS',             l:'90 días' },
    { v:'A 180 DIAS',            l:'180 días' },
    { v:'ENTRE 181 Y 359 DIAS',  l:'181–359 días' },
    { v:'A 360 DIAS',            l:'360 días' },
    { v:'SUPERIORES A 360 DIAS', l:'más de 360 días' }
  ];

  let _tab = 'cdt';
  const _cache = {};            // en memoria: cada pestaña se trae una vez

  /* ── Utilidades ── */
  const esc = s => String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const nf = (n,d=2) => isFinite(n)
    ? new Intl.NumberFormat('es-CO',{minimumFractionDigits:d,maximumFractionDigits:d}).format(n) : '—';
  const money = n => isFinite(n)
    ? '$' + new Intl.NumberFormat('es-CO',{maximumFractionDigits:0}).format(Math.round(n)) : '—';
  const fecha = iso => {
    if (!iso) return '—';
    const d = new Date(iso);
    return isNaN(d) ? '—' : d.toLocaleDateString('es-CO',{day:'2-digit',month:'short',year:'numeric'});
  };

  /** Inflación en vivo desde FINCO, para marcar qué le gana y qué no. */
  const inflacion = () => {
    const d = window.FINCO && FINCO.state && FINCO.state.data;
    return d && d.cpi ? d.cpi.value : null;
  };

  async function soda(id, query) {
    const res = await fetch(`${SODA}/${id}.json?${query}`, { cache:'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }

  async function maxDate(id, field) {
    const r = await soda(id, `$select=max(${field})`);
    return r?.[0]?.['max_' + field] || null;
  }

  /* ═════════ 💰 CDT ═════════ */

  async function loadCdt(plazo) {
    const f = await maxDate(DS.cdt, 'fechacorte');
    if (!f) throw new Error('sin fecha de corte');
    const rows = await soda(DS.cdt, encodeURI(
      `$select=nombreentidad,tasa,monto&$where=fechacorte='${f}'` +
      ` AND nombre_unidad_de_captura='EMISIONES PUNTUALES Y RANGOS DE EMISION DE CDT'` +
      ` AND descripcion='${plazo}' AND tasa>0&$order=tasa DESC&$limit=25`));
    return { fecha:f, plazo, rows: rows.map(r => ({
      banco: r.nombreentidad, tasa: +r.tasa, monto: +r.monto })) };
  }

  function renderCdt(d) {
    const inf = inflacion();
    const filas = d.rows.map((r,i) => {
      const real = inf != null ? ((1 + r.tasa/100)/(1 + inf/100) - 1) * 100 : null;
      return `<tr>
        <td class="fco-pos">${i+1}</td>
        <td class="fco-name">${esc(r.banco)}</td>
        <td class="fco-n fco-big">${nf(r.tasa)}%</td>
        <td class="fco-n ${real != null && real > 0 ? 'fco-good' : 'fco-bad'}">${real != null ? (real>0?'+':'')+nf(real) + '%' : '—'}</td>
      </tr>`;
    }).join('');

    return `
      <div class="fco-intro">
        <b>Quién te paga más por guardar tu plata.</b>
        Esto no es publicidad: es la tasa que cada entidad le reporta al regulador.
        La columna <em>real</em> descuenta la inflación${inf != null ? ' (' + nf(inf) + '%)' : ''} —
        es lo que de verdad ganás en poder de compra.
      </div>
      <div class="fco-controls">
        <label>Plazo del CDT</label>
        <select class="sel" id="cdtPlazo">
          ${PLAZOS.map(p => `<option value="${esc(p.v)}"${p.v===d.plazo?' selected':''}>${esc(p.l)}</option>`).join('')}
        </select>
      </div>
      ${d.rows.length ? `<div class="fco-scroll"><table class="fco-tbl">
        <thead><tr><th></th><th>Entidad</th><th class="fco-n">Tasa</th><th class="fco-n">Real</th></tr></thead>
        <tbody>${filas}</tbody></table></div>`
        : '<div class="fco-empty">Sin datos para ese plazo en el último corte.</div>'}
      <div class="fco-src">Superintendencia Financiera · corte ${fecha(d.fecha)} · ${d.rows.length} entidades ·
        rendimientos antes de retención en la fuente. Rentabilidad pasada no garantiza la futura.</div>`;
  }

  /* ═════════ 🏦 Crédito ═════════ */

  async function loadCredit() {
    const res = await fetch(CREDIT_SRC, { cache:'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }

  function renderCredit(d) {
    const usuraConsumo = (d.usura || []).find(u => /CONSUMO Y ORDINARIO/i.test(u.modalidad));

    const bloques = (d.tipos || []).map(t => `
      <div class="fco-block">
        <div class="fco-blabel">${esc(t.label)}<em>${esc(t.why)}</em></div>
        <div class="fco-scroll"><table class="fco-tbl">
          <thead><tr><th>Entidad</th><th class="fco-n">Tasa E.A.</th><th class="fco-n">Créditos</th></tr></thead>
          <tbody>${t.bancos.map(b => `<tr>
            <td class="fco-name">${esc(b.banco)}</td>
            <td class="fco-n fco-big">${nf(b.tasa)}%</td>
            <td class="fco-n fco-dim">${new Intl.NumberFormat('es-CO').format(b.creditos)}</td>
          </tr>`).join('')}</tbody>
        </table></div>
      </div>`).join('');

    return `
      <div class="fco-intro">
        <b>Quién te cobra menos — y cuál es el máximo legal.</b>
        Ordenado de más barato a más caro, con el promedio que cada entidad le reporta al regulador.
        Si te ofrecen una tasa muy por encima de las de acá, ya sabés que existe algo mejor.
      </div>

      ${usuraConsumo ? `<div class="fco-usura">
        <div class="fco-usura-h">⚖️ Tope legal para crédito de consumo</div>
        <div class="fco-usura-n">${nf(usuraConsumo.usura)}%</div>
        <div class="fco-usura-d">
          Cobrarte por encima de esta tasa es <b>delito de usura</b>. Sale de la fórmula legal:
          tasa de interés bancario corriente (${nf(usuraConsumo.tibc)}%) × 1,5.
          Vigente ${fecha(usuraConsumo.desde)} → ${fecha(usuraConsumo.hasta)}.
        </div>
        <details class="fco-more">
          <summary>Ver el tope de las demás modalidades</summary>
          <table class="fco-tbl fco-tbl-sm">
            <thead><tr><th>Modalidad</th><th class="fco-n">TIBC</th><th class="fco-n">Tope legal</th></tr></thead>
            <tbody>${(d.usura||[]).map(u => `<tr>
              <td class="fco-name">${esc(u.modalidad)}</td>
              <td class="fco-n fco-dim">${nf(u.tibc)}%</td>
              <td class="fco-n fco-bad">${nf(u.usura)}%</td>
            </tr>`).join('')}</tbody>
          </table>
        </details>
      </div>` : ''}

      ${bloques}
      <div class="fco-src">${esc(d.fuente || '')} · corte ${fecha(d.fechaCorte)} ·
        solo entidades con más de ${d.minCreditos} créditos desembolsados (por debajo, el promedio es ruido) ·
        se excluyen tasas menores al 2%: son productos promocionales o errores de reporte, no ofertas reales.</div>`;
  }

  /* ═════════ 📈 Fondos (FIC) ═════════ */

  const FIC_DEF = { minInv: 1000, maxRent: 60, soloGeneral: true };

  async function loadFic(cfg) {
    const f = await maxDate(DS.fic, 'fecha_corte');
    if (!f) throw new Error('sin fecha de corte');
    let where = `fecha_corte='${f}' AND numero_inversionistas>${cfg.minInv}` +
                ` AND rentabilidad_anual<${cfg.maxRent} AND rentabilidad_anual>-50`;
    if (cfg.soloGeneral) where += ` AND nombre_subtipo_patrimonio='FIC DE TIPO GENERAL'`;

    const rows = await soda(DS.fic, encodeURI(
      `$select=nombre_entidad,nombre_patrimonio,rentabilidad_anual,rentabilidad_mensual,` +
      `numero_inversionistas,valor_fondo_cierre_dia_t&$where=${where}` +
      `&$order=rentabilidad_anual DESC&$limit=25`));

    return { fecha:f, cfg, rows: rows.map(r => ({
      admin: r.nombre_entidad,
      fondo: r.nombre_patrimonio,
      anual: +r.rentabilidad_anual,
      mensual: +r.rentabilidad_mensual,
      inv: +r.numero_inversionistas,
      tam: +r.valor_fondo_cierre_dia_t
    })) };
  }

  function renderFic(d) {
    const inf = inflacion();
    const filas = d.rows.map((r,i) => {
      const gana = inf != null && r.anual > inf;
      return `<tr>
        <td class="fco-pos">${i+1}</td>
        <td class="fco-name">${esc(r.fondo)}<em>${esc(r.admin)}</em></td>
        <td class="fco-n fco-big ${gana?'fco-good':''}">${nf(r.anual)}%</td>
        <td class="fco-n fco-dim">${new Intl.NumberFormat('es-CO').format(r.inv)}</td>
        <td class="fco-n fco-dim">${money(r.tam/1e6)} M</td>
      </tr>`;
    }).join('');

    return `
      <div class="fco-intro">
        <b>Fondos de inversión, con los filtros anti-espejismo puestos.</b>
        Sin filtrar, el primer puesto de este dataset lo ocupa un fondo forestal
        <em>en liquidación</em> con 1.574% anual y 12 inversionistas: aritmética correcta,
        oportunidad inexistente. Acá solo aparecen fondos a los que una persona puede entrar.
      </div>
      <div class="fco-controls">
        <label>Mínimo de inversionistas</label>
        <select class="sel" id="ficInv">
          ${[100,500,1000,5000].map(v=>`<option value="${v}"${v===d.cfg.minInv?' selected':''}>${v}+</option>`).join('')}
        </select>
        <label class="fco-chk">
          <input type="checkbox" id="ficGen"${d.cfg.soloGeneral?' checked':''}>
          Solo fondos abiertos al público
        </label>
      </div>
      ${d.rows.length ? `<div class="fco-scroll"><table class="fco-tbl">
        <thead><tr><th></th><th>Fondo</th><th class="fco-n">Anual</th><th class="fco-n">Personas</th><th class="fco-n">Tamaño</th></tr></thead>
        <tbody>${filas}</tbody></table></div>` : '<div class="fco-empty">Ningún fondo pasa esos filtros.</div>'}
      <div class="fco-src">Superintendencia Financiera · corte ${fecha(d.fecha)}${inf!=null?` · en verde, los que superaron la inflación (${nf(inf)}%)`:''} ·
        <b>rentabilidad pasada, no promesa futura.</b> Un fondo que rindió 30% el año pasado puede perder este año.</div>`;
  }

  /* ═════════ 👴 Pensiones ═════════ */

  async function loadPens() {
    const f = await maxDate(DS.pens, 'fecha');
    if (!f) throw new Error('sin fecha');
    const rows = await soda(DS.pens, encodeURI(
      `$select=nombre_entidad,nombre_fondo,valor_unidad&$where=fecha='${f}'` +
      `&$order=nombre_entidad&$limit=120`));
    return { fecha:f, rows };
  }

  function renderPens(d) {
    const porAfp = {};
    d.rows.forEach(r => {
      const k = (r.nombre_entidad || '').replace(/"/g,'').trim();
      (porAfp[k] = porAfp[k] || []).push(r);
    });

    const bloques = Object.entries(porAfp).map(([afp, fondos]) => `
      <div class="fco-block">
        <div class="fco-blabel">${esc(afp)}</div>
        <div class="fco-scroll"><table class="fco-tbl fco-tbl-sm">
          <thead><tr><th>Fondo</th><th class="fco-n">Valor de la unidad</th></tr></thead>
          <tbody>${fondos.map(f => `<tr>
            <td class="fco-name">${esc(f.nombre_fondo)}</td>
            <td class="fco-n">${nf(+f.valor_unidad, 2)}</td>
          </tr>`).join('')}</tbody>
        </table></div>
      </div>`).join('');

    return `
      <div class="fco-intro">
        <b>El valor de la unidad de cada fondo de pensiones.</b>
        Tu saldo son unidades × este valor. Si sube, tu pensión crece sin que aportes más.
        Sirve para ver si el fondo donde estás se está moviendo — dato oficial, publicado a diario.
      </div>
      ${bloques || '<div class="fco-empty">Sin datos en el último corte.</div>'}
      <div class="fco-src">Superintendencia Financiera · corte ${fecha(d.fecha)} ·
        ${d.rows.length} fondos. El valor de la unidad no es rentabilidad: es el precio de la unidad ese día.</div>`;
  }

  /* ═════════ Orquestación ═════════ */

  const TABS = [
    { id:'cdt',    icon:'💰', label:'CDT',       sub:'quién te paga más' },
    { id:'credit', icon:'🏦', label:'Crédito',   sub:'quién te cobra menos' },
    { id:'fic',    icon:'📈', label:'Fondos',    sub:'los que le ganan a la inflación' },
    { id:'pens',   icon:'👴', label:'Pensiones', sub:'cómo va tu AFP' }
  ];

  function shell(inner, loading) {
    return `
      <div class="fc-head">
        <div>
          <div class="fc-title">🇨🇴 Tu plata en Colombia</div>
          <div class="fc-sub">Datos oficiales de la Superintendencia Financiera — no publicidad de bancos</div>
        </div>
      </div>
      <div class="fco-tabs">
        ${TABS.map(t => `<button class="fco-tab${t.id===_tab?' on':''}" data-cot="${t.id}">
          <b>${t.icon} ${esc(t.label)}</b><span>${esc(t.sub)}</span></button>`).join('')}
      </div>
      <div class="fco-body">${loading ? '<div class="fco-empty">⟳ Consultando datos oficiales…</div>' : inner}</div>`;
  }

  async function show(tab, opts) {
    _tab = tab || _tab;
    const host = document.getElementById('p-col');
    if (!host) return;

    const key = _tab + JSON.stringify(opts || {});
    if (_cache[key]) { host.innerHTML = shell(_cache[key]); wire(); return; }

    host.innerHTML = shell('', true);
    wire();

    try {
      let html;
      if (_tab === 'cdt')    html = renderCdt(await loadCdt((opts && opts.plazo) || 'A 360 DIAS'));
      if (_tab === 'credit') html = renderCredit(await loadCredit());
      if (_tab === 'fic')    html = renderFic(await loadFic(Object.assign({}, FIC_DEF, opts)));
      if (_tab === 'pens')   html = renderPens(await loadPens());
      _cache[key] = html;
      host.innerHTML = shell(html);
    } catch (e) {
      console.warn('[FINCO_PANEL]', _tab, e && e.message);
      host.innerHTML = shell(`<div class="fco-empty">
        No se pudo traer la información.<br><span class="fco-dim">${esc(e && e.message)}</span>
        <button class="btn bp bs" id="coRetry">Reintentar</button></div>`);
    }
    wire();
  }

  function wire() {
    const host = document.getElementById('p-col');
    if (!host) return;

    host.querySelectorAll('[data-cot]').forEach(b => { b.onclick = () => show(b.dataset.cot); });

    const p = host.querySelector('#cdtPlazo');
    if (p) p.onchange = () => show('cdt', { plazo: p.value });

    const fi = host.querySelector('#ficInv');
    const fg = host.querySelector('#ficGen');
    const ficGo = () => show('fic', {
      minInv: fi ? +fi.value : FIC_DEF.minInv,
      soloGeneral: fg ? fg.checked : true
    });
    if (fi) fi.onchange = ficGo;
    if (fg) fg.onchange = ficGo;

    const r = host.querySelector('#coRetry');
    if (r) r.onclick = () => { delete _cache[_tab]; show(_tab); };
  }

  function init() {
    if (!document.getElementById('p-col')) return;
    show(_tab);
  }

  return { init, show };
})();

window.FINCO_PANEL = FINCO_PANEL;
