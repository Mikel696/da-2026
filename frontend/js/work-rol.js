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

  let datos = null, radar = null, rutaAbierta = null;
  const estacion = {};   // ruta → estación que se está mirando (solo en memoria)

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
    // Ruta por puntos con recursos medidos (25-nov): la que trae fecha de corte de sus medidas.
    if (r.medido && window.WorkRutaPuntos) return WorkRutaPuntos.html(r, c, D, estacion[r.id], R);
    if (r.frase && window.WorkRutaVista) return WorkRutaVista.html(r, c, D, estacion[r.id], R);
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
      <p class="rol-nota">Cómo se cuenta: ${esc(M.metodo || 'una habilidad cuenta si la descripción la nombra.')} «En tu perfil» es lo que el radar de 5-JOB anota que ya manejas; el inglés está en progreso. Que algo no figure no quiere decir que no lo sepas: quiere decir que tu perfil todavía no lo muestra. Las 25 habilidades, con su ruta, están arriba en las tarjetas de disciplina.</p>
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

  /* El centro de mando abre la ruta dentro de la tarjeta de su disciplina (25-nov): otro clic en la misma habilidad la
     cierra; con `paso` (las misiones) siempre la abre en esa estación. */
  function abrir(id, paso){
    rutaAbierta = rutaAbierta === id && !paso ? null : id;
    if (paso) estacion[id] = paso;
    render();
    const v = rutaAbierta && document.getElementById('ruta-' + rutaAbierta);
    if (v && v.scrollIntoView) v.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  /* El HTML de la ruta abierta, para que WorkJuego lo pinte dentro de su tarjeta. */
  function rutaHtml(){
    const R = window.WorkRutas, D = datos && datos.d;
    const r = rutaAbierta && R && R.ruta(rutaAbierta), c = r && D && D.competencias.find(k => k.nombre === r.competencia);
    return r && c ? renderRuta(r, c, D) : '';
  }

  /* «Escuchar la idea»: la voz del navegador (speechSynthesis). Otro clic la detiene. Chrome carga las voces tarde
     (getVoices() llega vacío al primer clic): se esperan hasta 1,5 s. Se prefiere una voz instalada en el equipo:
     las de Google en línea cortan los textos largos y necesitan red (medido en su Chrome el 25-nov: 3 voces locales
     es-ES y 2 de Google en línea). */
  function vocesListas(s){
    if (s.getVoices().length) return Promise.resolve(s.getVoices());
    return new Promise(ok => { const fin = () => ok(s.getVoices()); s.addEventListener('voiceschanged', fin, { once: true }); setTimeout(fin, 1500); });
  }
  async function escuchar(b){
    const s = window.speechSynthesis, r = window.WorkRutas && WorkRutas.ruta(b.dataset.escuchar);
    const txt = b.querySelector('span');
    if (!s || !window.SpeechSynthesisUtterance || !r) { if (txt) txt.textContent = 'Este navegador no tiene voz'; return; }
    if (s.speaking) { s.cancel(); return; }
    const u = new SpeechSynthesisUtterance(WorkRutaVista.textoOir(r));
    const es = (await vocesListas(s)).filter(x => /^es/i.test(x.lang)), latam = x => /^es[-_](CO|MX|US|419)/i.test(x.lang);
    const v = es.find(x => x.localService && latam(x)) || es.find(x => x.localService) || es.find(latam) || es[0];
    if (v) u.voice = v;
    u.lang = v ? v.lang : 'es-CO'; u.rate = 0.95;
    const fin = () => { b.setAttribute('aria-pressed', 'false'); if (txt) txt.textContent = 'Escuchar la idea'; };
    u.onend = fin; u.onerror = fin;
    b.setAttribute('aria-pressed', 'true'); if (txt) txt.textContent = 'Detener';
    s.speak(u);
  }

  async function copiar(b){
    const r = window.WorkRutas && WorkRutas.ruta(b.closest('.rv').id.replace('ruta-', ''));
    const p = r && r.pasos.find(x => x.id === b.dataset.copiar);
    if (!p || !p.codigo) return;
    let ok = false;
    try { await navigator.clipboard.writeText(p.codigo.texto); ok = true; } catch {}
    const viejo = b.innerHTML;
    b.textContent = ok ? 'Copiado' : 'Selecciónalo y cópialo a mano';
    setTimeout(() => { b.innerHTML = viejo; }, 1800);
  }

  async function init(){
    const el = document.getElementById('workRol');
    if (!el) return;
    datos = undefined; radar = undefined; render();
    // La ruta abierta vive dentro del centro de mando (#workJuego): los clics se escuchan en el contenedor de los dos.
    const raiz = el.parentElement || el;
    const foco = sel => { const x = raiz.querySelector(sel); if (x && x.focus) x.focus(); return x; };
    raiz.addEventListener('click', e => {
      const es = e.target.closest('[data-estacion]');
      if (es) {
        estacion[es.dataset.de] = es.dataset.estacion;
        render();
        const det = raiz.querySelector(`#ruta-${es.dataset.de} .rv-det`);
        foco(`[data-estacion="${es.dataset.estacion}"]`);
        if (det && det.scrollIntoView && window.matchMedia && matchMedia('(max-width: 760px)').matches) det.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      const oy = e.target.closest('[data-escuchar]');
      if (oy) { escuchar(oy); return; }
      const cp = e.target.closest('[data-copiar]');
      if (cp) { copiar(cp); return; }
      const em = e.target.closest('[data-empezar]');
      if (em && window.WorkRutas) {
        const id = WorkRutas.empezar(em.dataset.empezar);
        render();
        if (id && window.WorkNB && WorkNB.open) WorkNB.open(id);
        else if (!id) { const r = raiz.querySelector(`#ruta-${em.dataset.empezar} .ruta-nota`); if (r) r.textContent = 'No se pudo crear el cuaderno: el espacio del navegador está lleno o el editor no cargó. Tus pasos marcados siguen guardados.'; }
        return;
      }
      const cu = e.target.closest('[data-cuaderno]');
      if (cu && window.WorkNB) {
        const r = cu.dataset.cuaderno.replace('work_nb_ruta_', '');
        const id = WorkRutas.empezar(r) || cu.dataset.cuaderno;   // si lo borraste, se vuelve a crear
        WorkNB.open(id);
      }
    });
    raiz.addEventListener('change', e => {
      const t = e.target.closest('[data-tarea]');
      if (t && window.WorkRutas) {
        WorkRutas.marcarTarea(t.dataset.de, t.dataset.pasoDe, t.dataset.tarea, !!t.checked);
        render(); foco(`[data-tarea="${t.dataset.tarea}"][data-paso-de="${t.dataset.pasoDe}"]`);
        return;
      }
      const c = e.target.closest('[data-paso]');
      if (!c || !window.WorkRutas) return;
      estacion[c.dataset.de] = c.dataset.paso;   // la estación sigue a la vista, con «Seguir con la…»
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

  return { init, render, esDelRol, abrir, rutaHtml, abierta: () => rutaAbierta };
})();
window.WorkRol = WorkRol;
document.addEventListener('DOMContentLoaded', () => WorkRol.init());
