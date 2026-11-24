/* 14-WORK · Mapa del rol (24-nov-2026). Solo lee: data/rol-objetivo.json (muestra fechada de vacantes reales)
   y data/jobs-feed.json (radar de 5-JOB). No escribe en localStorage. Las vacantes son de 5-JOB: aquí solo se
   cuentan y se enlaza allá. Sin red, usa la última copia buena (Cache Storage) y lo dice. */
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

  let datos = null, radar = null, soloFaltan = false;

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
    return `<p class="rol-radar">El radar de 5-JOB trae <b>${n}</b> vacante${n === 1 ? '' : 's'} del rol entre las ${j.length} que muestra (datos del ${esc(cuando)}${radar.guardado ? ', copia guardada sin conexión' : ''}). El radar no puede leer LinkedIn, donde se publica la mayoría: para eso están las búsquedas del rol en 5-JOB.</p>`;
  }

  function render(){
    const el = document.getElementById('workRol');
    if (!el) return;
    if (datos === undefined) { el.innerHTML = '<p class="rol-nota">Cargando el mapa del rol…</p>'; return; }
    if (!datos) { el.innerHTML = '<p class="rol-nota">No se pudo cargar el mapa del rol y este navegador no tiene copia guardada. Revisa la conexión y recarga la página.</p>'; return; }
    const D = datos.d, M = D.muestra, n = M.n;
    const comp = soloFaltan ? D.competencias.filter(c => c.perfil !== 'si') : D.competencias;
    const filas = comp.map(c => {
      const e = ESTADO[c.perfil] || ESTADO.no;
      return `<li class="rol-fila"><span class="rol-nom">${esc(c.nombre)}</span>${tira(c.vacantes, n, e.cls)}<span class="rol-cuenta"><b>${c.vacantes}</b> de ${n}<small class="rol-est ${e.cls}">${e.txt}</small></span></li>`;
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
        <p class="rol-leyenda">Cada cuadro es una vacante de la muestra. Lleno: la descripción pide esa habilidad. Color: <span class="si">en tu perfil</span>, <span class="no">no figura en tu perfil</span>, <span class="pr">en progreso</span>.</p>
        <ol class="rol-lista">${filas}</ol>
        <p class="rol-nota">Cómo se cuenta: una habilidad cuenta si la descripción la nombra. «En tu perfil» es lo que el radar de 5-JOB anota que ya manejas; el inglés está en progreso. Que algo no figure no quiere decir que no lo sepas: quiere decir que tu perfil todavía no lo muestra.</p>
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
  }

  async function init(){
    const el = document.getElementById('workRol');
    if (!el) return;
    datos = undefined; radar = undefined; render();
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-rol-filtro]');
      if (!b) return;
      soloFaltan = b.dataset.rolFiltro === 'faltan';
      render();
      const sel = el.querySelector(`[data-rol-filtro="${soloFaltan ? 'faltan' : 'todas'}"]`);
      if (sel) sel.focus();
    });
    datos = await traer('data/rol-objetivo.json');
    render();
    radar = await traer('data/jobs-feed.json');
    render();
  }

  return { init, render, esDelRol };
})();
window.WorkRol = WorkRol;
document.addEventListener('DOMContentLoaded', () => WorkRol.init());
