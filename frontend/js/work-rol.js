/* 14-WORK · Mapa del rol (24-nov-2026). Lee data/rol-objetivo.json (muestra fechada de vacantes reales) y
   data/jobs-feed.json (radar de 5-JOB). Él no escribe en localStorage: marcar pasos y crear cuadernos lo hace
   WorkRutas (work-rutas.js). Las vacantes son de 5-JOB: aquí solo se cuentan y se enlaza allá. Sin red, usa la
   última copia buena (Cache Storage) y lo dice. */
const WorkRol = (function(){
  const CACHE = 'work-datos';
  const ESTADO = {
    si:       { txt: 'en tu perfil',   cls: 'si' },
    no:       { txt: 'no figura en tu perfil', cls: 'no' },
    progreso: { txt: 'en progreso',    cls: 'pr' },
  };
  const FAMILIA = { implementacion: 'implementación', automatizacion: 'automatización de procesos', ia: 'IA en operaciones' };
  // Mismo criterio que la muestra: el título decide la familia; fuera ingeniería, desarrollo, diseño, ventas.
  const FAM = {
    implementacion: /implementa|onboarding|deployment|despliegue|professional services|solutions? consultant/i,
    automatizacion: /automat|\brpa\b|low.?code|no.?code|power (platform|automate|apps)|workflow|process(es)? (analyst|owner|improvement|excellence|optimi)|procesos|business process|mejora continua|transformaci[oó]n/i,
    ia: /\bai\b|\bia\b|inteligencia artificial|artificial intelligence|gen ?ai|generative|\bllm|agentic|copilot/i,
  };
  const FUERA = /engineer|developer|desarrollador|programador|software|devops|\bqa\b|tester|testing|scientist|cient[ií]fic|designer|dise[ñn]ador|marketing|sales|ventas|growth|recruit|front.?end|back.?end|full.?stack/i;
  const IA_ROL = /operations|operaciones|process|procesos|transformaci|efficiency|eficiencia|adoption|adopci|enablement|consultant|consultor|analyst|analista|specialist|especialista|lead|l[ií]der|jefe|manager/i;
  const esDelRol = t => !FUERA.test(t) && (FAM.implementacion.test(t) || FAM.automatizacion.test(t) || (FAM.ia.test(t) && IA_ROL.test(t)));

  let datos = null, radar = null, soloFaltan = false, rutaAbierta = null;

  function esc(s){ const d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  const MES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  function fecha(iso){ const d = new Date(iso.length === 10 ? iso + 'T12:00:00' : iso); return isNaN(d) ? '' : `${d.getDate()}-${MES[d.getMonth()]}-${d.getFullYear()}`; }
  function hora(iso){ const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }); }
  function dias(iso){ return Math.max(0, Math.round((Date.now() - new Date(iso + 'T12:00:00')) / 86400000)); }

  async function traer(u){
    try {
      const r = await fetch(u, { cache: 'no-cache' });
      if (r.ok) {
        const copia = r.clone(), d = await r.json();
        if (window.caches) caches.open(CACHE).then(c => c.put(u, copia)).catch(() => {});
        return { d, guardado: false };
      }
    } catch {}
    try { const r = window.caches && await (await caches.open(CACHE)).match(u); if (r) return { d: await r.json(), guardado: true }; } catch {}
    return null;
  }

  function tira(n, total, cls){
    let h = '';
    for (let i = 0; i < total; i++) h += `<i class="${i < n ? cls : ''}"></i>`;
    return `<span class="rol-tira" style="grid-template-columns:repeat(${total},minmax(0,1fr))" role="img" aria-label="${n} de ${total} vacantes">${h}</span>`;
  }

  function renderRadar(){
    if (radar === undefined) return '<p class="rol-radar">Leyendo el radar de 5-JOB…</p>';
    if (!radar) return '<p class="rol-radar">No se pudo leer el radar de 5-JOB ni hay copia guardada en este navegador.</p>';
    const j = radar.d.jobs || [];
    const n = j.filter(x => esDelRol(x.titulo || '')).length;
    const cuando = radar.d.generatedAt ? `${fecha(radar.d.generatedAt)}, ${hora(radar.d.generatedAt)}` : 'fecha desconocida';
    return `<p class="rol-radar">El radar de 5-JOB trae <b>${n}</b> vacante${n === 1 ? '' : 's'} del rol entre las ${j.length} que muestra (datos del ${esc(cuando)}${radar.guardado ? ', copia guardada sin conexión' : ''}). El radar no lee LinkedIn, que es de donde salió la muestra de este mapa: para eso están las búsquedas del rol en 5-JOB.</p>`;
  }

  /* Panel de una ruta, debajo de su fila. */
  function renderRuta(r, c, D){
    const R = window.WorkRutas;
    const empresas = [...new Set(D.vacantes.filter(v => v.competencias.includes(c.nombre)).map(v => v.empresa))];
    const nombres = empresas.slice(0, 8).join(', ') + (empresas.length > 8 ? ` y ${empresas.length - 8} más` : '');
    const hechos = r.pasos.filter(p => R.hecho(r.id, p.id)).length, p = R.pct(r.id);
    const pasos = r.pasos.map((s, i) => {
      const ok = R.hecho(r.id, s.id);
      return `<li class="ruta-paso${ok ? ' hecho' : ''}">
          <label><input type="checkbox" data-paso="${esc(s.id)}" data-de="${esc(r.id)}"${ok ? ' checked' : ''}> <span>${i + 1}. ${esc(s.titulo)}</span></label>
          <ul class="ruta-aprender">${s.aprender.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
          ${s.recurso ? `<p class="ruta-rec">Recurso: <a href="${esc(s.recurso.url)}" target="_blank" rel="noopener">${esc(s.recurso.nombre)}</a> · ${esc(s.recurso.proveedor)}</p>` : ''}
          ${s.video ? `<p class="ruta-rec ruta-video">▶ Video: <a href="${esc(s.video.url)}" target="_blank" rel="noopener">${esc(s.video.titulo)}</a> · ${esc(s.video.canal)}</p>` : ''}
          ${s.enlace ? `<p class="ruta-rec">En el Cerebro: <a href="${esc(s.enlace.url)}"${/^https?:/.test(s.enlace.url) ? ' target="_blank" rel="noopener"' : ''}>${esc(s.enlace.texto)}</a></p>` : ''}
          <p class="ruta-prac"><b>Práctica:</b> ${esc(s.practica)}</p>
        </li>`;
    }).join('');
    const nb = R.empezada(r.id) ? 'work_nb_ruta_' + r.id : '';
    return `<li class="ruta" id="ruta-${esc(r.id)}" role="region" aria-label="Ruta de estudio: ${esc(R.nombreCorto(r))}">
        <div class="ruta-cab">
          <span class="ruta-ico" aria-hidden="true">${esc(r.icono || '')}</span>
          <div><p class="ruta-tit">Ruta · ${esc(R.nombreCorto(r))}</p><p class="ruta-pct">Ruta al ${p} % · ${hechos} de ${r.pasos.length} pasos</p></div>
          <span class="avance-barra ruta-barra" role="img" aria-label="${p} %"><i style="width:${p}%"></i></span>
        </div>
        <p class="ruta-que">${esc(r.queEs)}</p>
        ${c.perfil === 'si' ? '<p class="ruta-perfil">Ya figura en tu perfil, así que en tu % global cuenta completa. Esta ruta sirve para repasarla y demostrarla con algo que puedas enseñar en una entrevista.</p>' : ''}
        <p class="ruta-piden">La piden ${c.vacantes} de las ${D.muestra.n} vacantes, entre ellas ${esc(nombres)}.</p>
        <ol class="ruta-pasos">${pasos}</ol>
        <div class="ruta-acc">${nb
          ? `<button type="button" class="btn bo bs" data-cuaderno="${esc(nb)}">Abrir mi cuaderno de ${esc(R.nombreCorto(r))}</button>`
          : `<button type="button" class="btn bp bs" data-empezar="${esc(r.id)}">Empezar: crear mi cuaderno de ${esc(R.nombreCorto(r))}</button>`}
          <span class="ruta-nota">El cuaderno trae una página por paso, con la práctica y espacio para tus apuntes.</span>
        </div>
      </li>`;
  }

  function render(){
    const el = document.getElementById('workRol');
    if (!el) return;
    if (datos === undefined) { el.innerHTML = '<p class="rol-nota">Cargando el mapa del rol…</p>'; return; }
    if (!datos) { el.innerHTML = '<p class="rol-nota">No se pudo cargar el mapa del rol y este navegador no tiene copia guardada. Revisa la conexión y recarga la página.</p>'; return; }
    const D = datos.d, M = D.muestra, n = M.n;
    const comp = soloFaltan ? D.competencias.filter(c => c.perfil !== 'si') : D.competencias;
    const R = window.WorkRutas;
    const filas = comp.map(c => {
      const e = ESTADO[c.perfil] || ESTADO.no;
      const r = R && R.rutaDe(c.nombre);
      const abierta = r && rutaAbierta === r.id;
      const nom = r
        ? `<button type="button" class="rol-nom rol-abrir" data-ruta="${esc(r.id)}" aria-expanded="${abierta}" aria-controls="ruta-${esc(r.id)}">${esc(c.nombre)}<small>${abierta ? 'Cerrar la ruta' : 'Ver ruta de estudio'}</small></button>`
        : `<span class="rol-nom">${esc(c.nombre)}${c.perfil !== 'si' && R && R.rutas().length ? '<small class="rol-sin-ruta">Sin ruta todavía</small>' : ''}</span>`;
      const p = r ? R.pct(r.id) : 0;
      const fila = `<li class="rol-fila${abierta ? ' abierta' : ''}">${nom}${tira(c.vacantes, n, e.cls)}<span class="rol-cuenta"><b>${c.vacantes}</b> de ${n}<small class="rol-est ${e.cls}">${e.txt}</small>${p ? `<small class="rol-ruta-pct">ruta al ${p} %</small>` : ''}</span></li>`;
      return fila + (abierta ? renderRuta(r, c, D) : '');
    }).join('');
    const famL = Object.entries(D.familias).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${v} de ${FAMILIA[k] || k}`);
    const fam = famL.length > 1 ? famL.slice(0, -1).join(', ') + ' y ' + famL[famL.length - 1] : famL.join('');
    const abierta = !!el.querySelector('details.rol-muestra[open]');
    const mod = D.modalidad, niv = D.nivel;
    const vac = D.vacantes.map(v => `<li><a href="${esc(v.url)}" target="_blank" rel="noopener">${esc(v.titulo)}</a><span>${esc(v.empresa)}, ${esc(v.lugar)}</span></li>`).join('');
    const d = dias(M.fecha);
    el.innerHTML = `
      <header class="rol-cab">
        <h2>Mapa del rol</h2>
        <p class="rol-nombre">${esc(D.rol)}</p>
        <p class="rol-def">${esc(D.definicion)}</p>
        <p class="rol-fuente">Foto del ${fecha(M.fecha)} (${d === 0 ? 'hoy' : `hace ${d} día${d === 1 ? '' : 's'}`}): ${n} vacantes reales de ${esc(M.fuente.split(',')[0])}, ${esc(M.filtro)}.${datos.guardado ? ' Sin conexión: copia guardada en este navegador.' : ''}</p>
      </header>
      <div class="rol-hechos">
        <p>Se publica como ${esc(fam)}. Una vacante puede ser de dos.</p>
        <p>${mod.remoto || 0} remotas, ${mod.hibrido || 0} híbridas y ${mod.presencial || 0} presenciales${mod['sin dato'] ? `; ${mod['sin dato']} no lo dice` : ''}.</p>
        <p>${niv.senior || 0} piden perfil senior o de liderazgo y ${niv.junior || 0} dicen junior; las otras ${n - (niv.senior || 0) - (niv.junior || 0)} no lo dicen en el título.</p>
      </div>
      <section class="rol-comp" aria-labelledby="rolCompT">
        <div class="rol-comp-cab">
          <h3 id="rolCompT">Lo que piden</h3>
          <div class="rol-filtro" role="group" aria-label="Qué habilidades ver">
            <button type="button" data-rol-filtro="todas" aria-pressed="${!soloFaltan}">Todas</button>
            <button type="button" data-rol-filtro="faltan" aria-pressed="${soloFaltan}">Solo las que no están en tu perfil</button>
          </div>
        </div>
        <p class="rol-leyenda">Cada tira tiene un cuadro por vacante de la muestra; los llenos son las que piden esa habilidad. Color: <span class="si">en tu perfil</span>, <span class="no">no figura en tu perfil</span>, <span class="pr">en progreso</span>.</p>
        <ol class="rol-lista">${filas}</ol>
        <p class="rol-nota">Cómo se cuenta: ${esc(M.metodo || 'una habilidad cuenta si la descripción la nombra.')} «En tu perfil» es lo que el radar de 5-JOB anota que ya manejas; el inglés está en progreso. Que algo no figure no quiere decir que no lo sepas: quiere decir que tu perfil todavía no lo muestra.</p>
      </section>
      <section class="rol-donde" aria-labelledby="rolDondeT">
        <h3 id="rolDondeT">Dónde verlas hoy</h3>
        ${renderRadar()}
        <p class="rol-links"><a class="btn bo bs" href="jobs.html">Abrir el radar de 5-JOB</a> <a class="btn bo bs" href="jobs.html#linkedin">Buscar el rol en LinkedIn desde 5-JOB</a></p>
      </section>
      <details class="rol-muestra"${abierta ? ' open' : ''}>
        <summary>Ver las ${n} vacantes de la muestra</summary>
        <p class="rol-nota">Leídas el ${fecha(M.fecha)} con las búsquedas ${M.busquedas.map(b => `«${esc(b)}»`).join(', ')} (${esc(M.resultadosPorBusqueda)}). ${esc(M.criterio)} Algunas ya pueden estar cerradas.</p>
        <ul>${vac}</ul>
      </details>`;
    if (window.WorkJuego) WorkJuego.render(D);
  }

  /* El juego (nodos, «Ver esa ruta», «Seguir») abre una ruta aquí. */
  function abrir(id){
    rutaAbierta = id;
    const R = window.WorkRutas, D = datos && datos.d;
    if (soloFaltan && R && D && D.competencias.some(c => c.perfil === 'si' && (R.rutaDe(c.nombre) || {}).id === id)) soloFaltan = false;
    render();
    const el = document.getElementById('workRol'), b = el && el.querySelector(`[data-ruta="${id}"]`);
    if (b) { if (b.scrollIntoView) b.scrollIntoView({ behavior: 'smooth', block: 'start' }); if (b.focus) b.focus({ preventScroll: true }); }
  }

  async function init(){
    const el = document.getElementById('workRol');
    if (!el) return;
    datos = undefined; radar = undefined; render();
    const foco = sel => { const x = el.querySelector(sel); if (x && x.focus) x.focus(); return x; };
    el.addEventListener('click', e => {
      const f = e.target.closest('[data-rol-filtro]');
      if (f) {
        soloFaltan = f.dataset.rolFiltro === 'faltan';
        render(); foco(`[data-rol-filtro="${soloFaltan ? 'faltan' : 'todas'}"]`);
        return;
      }
      const t = e.target.closest('[data-ruta]');
      if (t) {
        rutaAbierta = rutaAbierta === t.dataset.ruta ? null : t.dataset.ruta;
        render(); foco(`[data-ruta="${t.dataset.ruta}"]`);
        return;
      }
      const em = e.target.closest('[data-empezar]');
      if (em && window.WorkRutas) {
        const id = WorkRutas.empezar(em.dataset.empezar);
        render();
        if (id && window.WorkNB && WorkNB.open) WorkNB.open(id);
        else if (!id) { const r = el.querySelector(`#ruta-${em.dataset.empezar} .ruta-nota`); if (r) r.textContent = 'No se pudo crear el cuaderno: el espacio del navegador está lleno o el editor no cargó. Tus pasos marcados siguen guardados.'; }
        return;
      }
      const cu = e.target.closest('[data-cuaderno]');
      if (cu && window.WorkNB) {
        const r = cu.dataset.cuaderno.replace('work_nb_ruta_', '');
        const id = WorkRutas.empezar(r) || cu.dataset.cuaderno;   // si lo borraste, se vuelve a crear
        WorkNB.open(id);
      }
    });
    el.addEventListener('change', e => {
      const c = e.target.closest('[data-paso]');
      if (!c || !window.WorkRutas) return;
      WorkRutas.marcar(c.dataset.de, c.dataset.paso, !!c.checked);
      render(); foco(`[data-paso="${c.dataset.paso}"]`);
    });
    // Otro equipo marcó pasos: la nube los trae y el mapa se vuelve a pintar.
    window.addEventListener('cloud:realtime_change', e => { if (e.detail && e.detail.key === 'work_rutas') render(); });
    window.addEventListener('cloud:sync_complete', () => render());
    if (window.WorkRutas) await WorkRutas.cargar();
    datos = await traer('data/rol-objetivo.json');
    render();
    radar = await traer('data/jobs-feed.json');
    render();
  }

  return { init, render, esDelRol, abrir };
})();
window.WorkRol = WorkRol;
document.addEventListener('DOMContentLoaded', () => WorkRol.init());
