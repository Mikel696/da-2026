/* 14-WORK · Panel de juego (24-nov-2026): constelación de las 25 habilidades, nivel, XP, logros e historia.
   Solo lee: data/rol-objetivo.json (lo pasa WorkRol) y work_rutas (vía WorkRutas). No escribe nada.
   Reglas a la vista: 10 XP por paso marcado; un nivel cada 100 XP; el % global es el de WorkRutas.global(). */
const WorkJuego = (function(){
  const XP_PASO = 10, XP_NIVEL = 100;
  const RANGOS = ['Aprendiz', 'Explorador', 'Explorador', 'Practicante', 'Practicante', 'Constructor', 'Constructor', 'Integrador', 'Integrador', 'Arquitecto de procesos', 'Maestro de rutas'];
  // Posición fija de cada habilidad en el mapa (viewBox 1000 × 620), agrupadas por zona.
  const NODOS = {
    'ia-generativa': [205, 125, 'IA generativa'], 'prompts': [330, 72, 'Prompts'], 'agentes': [345, 182, 'Agentes de IA'], 'ml': [110, 210, 'Machine learning'],
    'power-automate': [520, 70, 'Power Automate'], 'rpa': [645, 58, 'RPA'], 'n8n': [470, 175, 'n8n · Zapier · Make'], 'low-code': [605, 150, 'Low-code'], 'apis': [690, 245, 'APIs'],
    'python': [800, 92, 'Python'], 'sql': [918, 150, 'SQL'], 'excel': [815, 228, 'Excel'], 'power-bi': [920, 292, 'Power BI'],
    'erp': [790, 392, 'ERP'], 'crm': [905, 438, 'CRM'], 'finanzas': [835, 528, 'Finanzas'],
    'requerimientos': [420, 455, 'Requerimientos'], 'mapeo-procesos': [545, 425, 'Mapeo de procesos'], 'mejora-procesos': [640, 512, 'Mejora de procesos'], 'documentacion': [470, 560, 'Documentación'], 'indicadores': [665, 372, 'KPI y ROI'],
    'stakeholders': [270, 422, 'Stakeholders'], 'cambio': [160, 472, 'Gestión del cambio'], 'proyectos': [130, 352, 'Proyectos ágiles'], 'ingles': [255, 548, 'Inglés'],
  };
  const ZONAS = [['IA', 210, 28], ['Automatización', 575, 20], ['Datos', 870, 40], ['Negocio', 905, 370], ['Procesos', 560, 608], ['Personas', 115, 600]];
  // Qué habilidades se apoyan en cuáles (criterio de diseño, explicado en «Cómo se calcula»).
  const ARISTAS = [
    ['python', 'apis'], ['python', 'ml'], ['python', 'sql'], ['python', 'finanzas'], ['sql', 'power-bi'], ['excel', 'power-bi'], ['excel', 'finanzas'], ['excel', 'sql'],
    ['apis', 'n8n'], ['apis', 'erp'], ['apis', 'crm'], ['erp', 'finanzas'], ['crm', 'erp'], ['n8n', 'agentes'], ['n8n', 'power-automate'],
    ['ia-generativa', 'prompts'], ['prompts', 'agentes'], ['ia-generativa', 'agentes'], ['ia-generativa', 'ml'], ['power-automate', 'rpa'], ['power-automate', 'low-code'],
    ['requerimientos', 'mapeo-procesos'], ['mapeo-procesos', 'mejora-procesos'], ['mejora-procesos', 'indicadores'], ['power-bi', 'indicadores'], ['documentacion', 'requerimientos'],
    ['documentacion', 'mapeo-procesos'], ['stakeholders', 'requerimientos'], ['stakeholders', 'cambio'], ['proyectos', 'cambio'], ['proyectos', 'stakeholders'], ['ingles', 'stakeholders'],
    ['cambio', 'documentacion'], ['mejora-procesos', 'rpa'],
  ];
  const CENTRO = [500, 300], HUBS = ['ia-generativa', 'power-automate', 'python', 'finanzas', 'requerimientos', 'stakeholders'];
  const LOGROS = [
    ['primer-paso', '👣', 'Primer paso', 'Marca un paso de cualquier ruta.'],
    ['en-marcha', '📓', 'En marcha', 'Empieza una ruta y crea su cuaderno.'],
    ['racha', '🔥', 'Racha de 3 días', 'Marca pasos 3 días seguidos.'],
    ['ruta-completa', '🏁', 'Ruta completa', 'Termina todos los pasos de una ruta.'],
    ['cinco-frentes', '🧭', 'Cinco frentes', 'Avanza en 5 rutas distintas.'],
    ['cerebro-ia', '🤖', 'Cerebro IA', 'Avanza en IA generativa, prompts, agentes y machine learning.'],
  ];

  let ultimo = null;   // datos del rol del último pintado, para los tooltips
  const esc = s => { const d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; };
  const dia = iso => { const d = new Date(iso); return isNaN(d) ? '' : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const diaBonito = d => { const [a, m, x] = d.split('-').map(Number); return `${x}-${MES[m - 1]}-${a}`; };

  function estado(D){
    const R = window.WorkRutas;
    const regs = R.registros();
    const pasos = regs.filter(r => r.tipo === 'paso' && r.hecho);
    const totalPasos = R.rutas().reduce((s, r) => s + r.pasos.length, 0);
    const xp = pasos.length * XP_PASO;
    const nivel = Math.min(Math.floor(xp / XP_NIVEL) + 1, RANGOS.length);
    const conPaso = new Set(pasos.map(p => p.ruta));
    const dias = [...new Set(pasos.map(p => dia(p.updated)).filter(Boolean))].sort();
    let racha = dias.length ? 1 : 0, mejor = racha;
    for (let i = 1; i < dias.length; i++) {
      const sigue = (new Date(dias[i] + 'T12:00:00') - new Date(dias[i - 1] + 'T12:00:00')) / 864e5 === 1;
      racha = sigue ? racha + 1 : 1; mejor = Math.max(mejor, racha);
    }
    const ganados = {
      'primer-paso': pasos.length >= 1,
      'en-marcha': R.rutas().some(r => R.empezada(r.id)),
      'racha': mejor >= 3,
      'ruta-completa': R.rutas().some(r => R.pct(r.id) === 100),
      'cinco-frentes': conPaso.size >= 5,
      'cerebro-ia': ['ia-generativa', 'prompts', 'agentes', 'ml'].every(id => conPaso.has(id)),
    };
    // Historia: XP acumulada por día, según la fecha en que marcaste cada paso (los desmarcados no cuentan).
    const porDia = {};
    pasos.forEach(p => { const d = dia(p.updated); if (d) porDia[d] = (porDia[d] || 0) + XP_PASO; });
    let acc = 0; const hist = Object.keys(porDia).sort().map(d => ({ d, xp: (acc += porDia[d]) }));
    return { R, regs, pasos: pasos.length, totalPasos, xp, nivel, rango: RANGOS[nivel - 1], conPaso, ganados, hist, global: R.global(D) };
  }

  const cobertura = (R, c) => c.perfil === 'si' ? 1 : R.pct(R.rutaDe(c.nombre).id) / 100;
  const ESTADO = { si: ['si', 'en tu perfil'], no: ['no', 'no figura en tu perfil'], progreso: ['pr', 'en progreso'] };

  function constelacion(D, E){
    const R = E.R;
    const porId = {};
    D.competencias.forEach(c => { const r = R.rutaDe(c.nombre); if (r && NODOS[r.id]) porId[r.id] = { c, r, p: R.pct(r.id), cob: cobertura(R, c) }; });
    const radio = v => 9 + v * 0.55;
    const aristas = ARISTAS.filter(([a, b]) => porId[a] && porId[b]).map(([a, b]) => {
      const [x1, y1] = NODOS[a], [x2, y2] = NODOS[b];
      const activa = porId[a].cob > 0 && porId[b].cob > 0;
      return `<line class="j-arista${activa ? ' activa' : ''}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
    }).join('');
    const ejes = HUBS.filter(id => porId[id]).map(id => `<line class="j-eje" x1="${CENTRO[0]}" y1="${CENTRO[1]}" x2="${NODOS[id][0]}" y2="${NODOS[id][1]}"/>`).join('');
    const nodos = Object.entries(porId).map(([id, { c, r, p }]) => {
      const [x, y, corto] = NODOS[id];
      const rr = radio(c.vacantes), anillo = rr + 4, circ = 2 * Math.PI * anillo;
      const [cls, txt] = ESTADO[c.perfil] || ESTADO.no;
      const hechos = r.pasos.filter(s => R.hecho(r.id, s.id)).length;
      const vivo = p > 0 && p < 100 ? ' vivo' : '', completo = p === 100 ? ' completo' : '';
      const arco = c.perfil === 'si' ? circ : circ * p / 100;
      const etiqueta = `${c.nombre}: lo piden ${c.vacantes} de ${D.muestra.n} vacantes; ${txt}; ruta al ${p} % (${hechos} de ${r.pasos.length} pasos). Abre la ruta.`;
      return `<g class="j-nodo ${cls}${vivo}${completo}" data-nodo="${esc(id)}" transform="translate(${x} ${y})" tabindex="0" role="button" aria-label="${esc(etiqueta)}">
          <circle class="j-halo" r="${(rr + 10).toFixed(1)}"/>
          <circle class="j-pista" r="${anillo.toFixed(1)}"/>
          <circle class="j-arco" r="${anillo.toFixed(1)}" stroke-dasharray="${arco.toFixed(1)} ${circ.toFixed(1)}" transform="rotate(-90)"/>
          <circle class="j-cuerpo" r="${rr.toFixed(1)}"/>
          <text class="j-ico" y="5" text-anchor="middle" aria-hidden="true">${p === 100 ? '✓' : esc(r.icono || '')}</text>
          <text class="j-etq" y="${(anillo + 15).toFixed(1)}" text-anchor="middle">${esc(corto)}</text>
          ${hechos ? `<text class="j-nv" y="${(anillo + 28).toFixed(1)}" text-anchor="middle">${hechos}/${r.pasos.length}</text>` : ''}
        </g>`;
    }).join('');
    const g = E.global.pct, cr = 46, cc = 2 * Math.PI * cr;
    const centro = `<g class="j-centro" transform="translate(${CENTRO[0]} ${CENTRO[1]})" aria-hidden="true">
        <circle class="j-orbita" r="${cr + 14}"/>
        <circle class="j-pista" r="${cr}"/>
        <circle class="j-arco-centro" r="${cr}" stroke-dasharray="${(cc * g / 100).toFixed(1)} ${cc.toFixed(1)}" transform="rotate(-90)"/>
        <text class="j-centro-pct" y="4" text-anchor="middle">${g} %</text>
        <text class="j-centro-txt" y="22" text-anchor="middle">del rol</text>
      </g>`;
    const zonas = ZONAS.map(([n, x, y]) => `<text class="j-zona" x="${x}" y="${y}" text-anchor="middle">${n}</text>`).join('');
    return `<div class="j-mapa-scroll"><div class="j-mapa">
        <svg viewBox="0 0 1000 620" role="group" aria-label="Constelación de las 25 habilidades del rol. Cada nodo abre su ruta.">
          <g class="j-capa-aristas">${ejes}${aristas}</g>${zonas}${centro}${nodos}
        </svg><div class="j-tip" role="tooltip" hidden></div>
      </div></div>`;
  }

  function historia(E){
    if (!E.hist.length) return `<p class="j-vacio">Marca tu primer paso y aquí empieza tu gráfica de XP.</p>`;
    const W = 640, H = 170, pl = 40, pr = 16, pt = 14, pb = 26;
    const hoy = dia(new Date().toISOString());
    const pts = E.hist[E.hist.length - 1].d < hoy ? [...E.hist, { d: hoy, xp: E.hist[E.hist.length - 1].xp }] : E.hist;
    const t0 = new Date(pts[0].d + 'T12:00:00').getTime(), t1 = Math.max(new Date(pts[pts.length - 1].d + 'T12:00:00').getTime(), t0 + 864e5);
    const tope = Math.max(50, Math.ceil(E.xp / 50) * 50);
    const X = d => pl + (new Date(d + 'T12:00:00').getTime() - t0) / (t1 - t0) * (W - pl - pr);
    const Y = v => pt + (1 - v / tope) * (H - pt - pb);
    let linea = `M${X(pts[0].d).toFixed(1)} ${Y(0).toFixed(1)}`;
    pts.forEach((q, i) => { const x = X(q.d).toFixed(1); linea += ` L${x} ${Y(i ? pts[i - 1].xp : 0).toFixed(1)} L${x} ${Y(q.xp).toFixed(1)}`; });
    const area = linea + ` L${X(pts[pts.length - 1].d).toFixed(1)} ${Y(0).toFixed(1)} Z`;
    const grid = [0, tope / 2, tope].map(v => `<line class="j-grid" x1="${pl}" x2="${W - pr}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}"/><text class="j-eje-y" x="${pl - 6}" y="${(Y(v) + 4).toFixed(1)}" text-anchor="end">${v}</text>`).join('');
    const puntos = E.hist.map(q => `<circle class="j-hist-punto" cx="${X(q.d).toFixed(1)}" cy="${Y(q.xp).toFixed(1)}" r="4"/><circle class="j-hit" cx="${X(q.d).toFixed(1)}" cy="${Y(q.xp).toFixed(1)}" r="14" tabindex="0" data-tip="${esc(diaBonito(q.d))}: ${q.xp} XP"/>`).join('');
    return `<div class="j-hist-caja"><svg class="j-hist" viewBox="0 0 ${W} ${H}" role="img" aria-label="XP acumulada desde el ${esc(diaBonito(pts[0].d))}: hoy ${E.xp} XP">
        ${grid}<path class="j-hist-area" d="${area}"/><path class="j-hist-linea" d="${linea}"/>${puntos}
        <text class="j-eje-x" x="${pl}" y="${H - 6}">${esc(diaBonito(pts[0].d))}</text><text class="j-eje-x" x="${W - pr}" y="${H - 6}" text-anchor="end">hoy</text>
      </svg><div class="j-tip" role="tooltip" hidden></div></div>`;
  }

  function render(D){
    const el = document.getElementById('workJuego');
    const R = window.WorkRutas;
    if (!el || !D || !R || !R.rutas().length) return;
    ultimo = D;
    const E = estado(D);
    const enNivel = E.xp % XP_NIVEL, falta = XP_NIVEL - enNivel;
    const maxNivel = E.nivel === RANGOS.length;
    const enMarcha = R.rutas().filter(r => R.empezada(r.id) || R.pct(r.id) > 0);
    const sig = E.global.siguiente;
    const logros = LOGROS.map(([id, ico, nombre, como]) => `<li class="j-logro ${E.ganados[id] ? 'desbloqueado' : 'bloqueado'}" title="${esc(como)}"><span class="j-logro-ico" aria-hidden="true">${E.ganados[id] ? ico : '🔒'}</span><span class="j-logro-n">${esc(nombre)}</span><span class="j-logro-c">${E.ganados[id] ? 'Desbloqueado' : esc(como)}</span></li>`).join('');
    el.innerHTML = `
      <header class="j-cab">
        <div class="j-jugador">
          <p class="j-nivel"><span>Nivel ${E.nivel}</span> · ${esc(E.rango)}</p>
          <div class="j-xp" role="progressbar" aria-valuemin="0" aria-valuemax="${XP_NIVEL}" aria-valuenow="${maxNivel ? XP_NIVEL : enNivel}" aria-label="XP hacia el siguiente nivel"><i style="width:${maxNivel ? 100 : enNivel}%"></i></div>
          <p class="j-xp-txt"><b>${E.xp} XP</b> · ${E.pasos} de ${E.totalPasos} pasos · ${enMarcha.length} ruta${enMarcha.length === 1 ? '' : 's'} en marcha${maxNivel ? '' : ` · faltan ${falta} XP para el nivel ${E.nivel + 1}`}</p>
        </div>
        <div class="j-global">
          <p class="j-frase">Con tu perfil y lo que llevas de tus rutas, cubres el <b>${E.global.pct} %</b> de lo que piden las ${D.muestra.n} vacantes.</p>
          ${sig ? `<p class="j-sig">Si terminas ${esc(sig.competencia)}, subes a ${sig.pct} %. <button type="button" class="j-ir" data-ir="${esc(sig.ruta)}">Ver esa ruta</button></p>` : ''}
          ${enMarcha.length ? `<p class="j-marcha">${enMarcha.map(r => `<button type="button" class="j-chip" data-ir="${esc(r.id)}">${esc(r.icono || '')} ${esc(R.nombreCorto(r))} · ${R.pct(r.id)} %</button>`).join('')}</p>` : ''}
        </div>
      </header>
      ${constelacion(D, E)}
      <p class="j-leyenda"><span class="si">en tu perfil</span><span class="no">no figura en tu perfil</span><span class="pr">en progreso</span><span>El anillo es lo que llevas de la ruta; el tamaño, cuántas vacantes la piden. Las líneas se encienden cuando avanzas en las dos puntas.</span></p>
      <div class="j-fila">
        <section class="j-logros" aria-labelledby="jLogrosT"><h3 id="jLogrosT">Logros</h3><ul>${logros}</ul></section>
        <section class="j-historia" aria-labelledby="jHistT"><h3 id="jHistT">Tu XP en el tiempo</h3>${historia(E)}</section>
      </div>
      <details class="j-como"><summary>Cómo se calcula</summary><p>Cada paso marcado da ${XP_PASO} XP y cada ${XP_NIVEL} XP subes de nivel; el rango es solo el nombre del nivel. La historia usa la fecha en que marcaste cada paso (si lo desmarcas, sale). El % del rol pesa cada habilidad por cuántas vacantes de la muestra la piden: las que figuran en tu perfil cuentan completas, las demás con lo que llevas de su ruta. «En tu perfil» es la lista del radar de 5-JOB, escrita en agosto: si algo no es cierto, el % cambia. Las conexiones entre habilidades son un criterio de diseño (qué se apoya en qué), no un dato de las vacantes.</p></details>`;
  }

  function tip(caja, html, x, y){
    const t = caja && caja.querySelector('.j-tip');
    if (!t) return;
    if (!html) { t.hidden = true; return; }
    t.innerHTML = html; t.hidden = false; t.style.left = x + '%'; t.style.top = y + '%';
  }
  function tipNodo(n){
    const id = n.dataset.nodo, R = window.WorkRutas, r = R.ruta(id), c = ultimo && ultimo.competencias.find(k => k.nombre === r.competencia);
    if (!r || !c) return '';
    const hechos = r.pasos.filter(s => R.hecho(r.id, s.id)).length;
    return `<b>${esc(r.icono || '')} ${esc(c.nombre)}</b><span>Lo piden ${c.vacantes} de ${ultimo.muestra.n} vacantes · ${esc((ESTADO[c.perfil] || ESTADO.no)[1])}</span><span>Ruta: ${hechos} de ${r.pasos.length} pasos (${R.pct(r.id)} %)</span><span class="j-tip-acc">Clic para abrir la ruta</span>`;
  }

  function init(){
    const el = document.getElementById('workJuego');
    if (!el) return;
    const abrir = id => { if (window.WorkRol && WorkRol.abrir) WorkRol.abrir(id); };
    el.addEventListener('click', e => {
      const n = e.target.closest('[data-nodo]'); if (n) return abrir(n.dataset.nodo);
      const b = e.target.closest('[data-ir]'); if (b) return abrir(b.dataset.ir);
    });
    el.addEventListener('keydown', e => {
      const n = e.target.closest && e.target.closest('[data-nodo]');
      if (n && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); abrir(n.dataset.nodo); }
    });
    const mostrar = e => {
      const n = e.target.closest && e.target.closest('[data-nodo]');
      if (n) { const [x, y] = NODOS[n.dataset.nodo]; tip(n.closest('.j-mapa'), tipNodo(n), x / 10, y / 6.2); return; }
      const h = e.target.closest && e.target.closest('[data-tip]');
      if (h) { const svg = h.ownerSVGElement, vb = svg.viewBox.baseVal; tip(h.closest('.j-hist-caja'), esc(h.dataset.tip), h.cx.baseVal.value / vb.width * 100, h.cy.baseVal.value / vb.height * 100); }
    };
    const ocultar = e => {
      const c = e.target.closest && (e.target.closest('.j-mapa') || e.target.closest('.j-hist-caja'));
      if (c && !(e.relatedTarget && c.contains(e.relatedTarget) && e.relatedTarget.closest && (e.relatedTarget.closest('[data-nodo]') || e.relatedTarget.closest('[data-tip]')))) tip(c, '');
    };
    el.addEventListener('mouseover', mostrar); el.addEventListener('focusin', mostrar);
    el.addEventListener('mouseout', ocultar); el.addEventListener('focusout', ocultar);
  }

  return { init, render };
})();
window.WorkJuego = WorkJuego;
document.addEventListener('DOMContentLoaded', () => WorkJuego.init());
