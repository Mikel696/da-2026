/* 14-WORK · Rutas de estudio (24-nov-2026). Lee data/rutas.json; guarda el avance en `work_rutas` (un registro por
   ruta empezada y por paso marcado; cloud-sync los mezcla registro por registro, gana el más nuevo; desmarcar no
   borra). Crea el cuaderno de cada ruta con WorkNB.ensureNotebook. No escribe nada más. */
const WorkRutas = (function(){
  const KEY = 'work_rutas';
  const CACHE = 'work-datos';
  let datos = null;

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
  async function cargar(){ datos = await traer('data/rutas.json'); return datos; }

  function leer(){ try { const v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; } }
  function poner(rec){
    const a = leer(), i = a.findIndex(x => x.id === rec.id);
    if (i >= 0) a[i] = { ...a[i], ...rec }; else a.push(rec);
    localStorage.setItem(KEY, JSON.stringify(a));
  }

  const rutas = () => (datos && datos.d && datos.d.rutas) || [];
  const ruta = id => rutas().find(r => r.id === id) || null;
  const rutaDe = competencia => rutas().find(r => r.competencia === competencia) || null;
  const nombreCorto = r => r.competencia.split(' (')[0];

  function hecho(rutaId, pasoId){ const r = leer().find(x => x.id === rutaId + ':' + pasoId); return !!(r && r.hecho); }
  function empezada(rutaId){ const r = leer().find(x => x.id === rutaId && x.tipo === 'ruta'); return !!(r && r.empezada); }
  function marcar(rutaId, pasoId, si){ poner({ id: rutaId + ':' + pasoId, tipo: 'paso', ruta: rutaId, hecho: !!si, updated: new Date().toISOString() }); }
  /* Tareas de «Hazlo» dentro de una estación (25-nov): ayudan a seguir el avance, pero el % lo dan las estaciones. */
  function tarea(rutaId, pasoId, i){ const r = leer().find(x => x.id === rutaId + ':' + pasoId + ':' + i); return !!(r && r.hecho); }
  function marcarTarea(rutaId, pasoId, i, si){ poner({ id: rutaId + ':' + pasoId + ':' + i, tipo: 'tarea', ruta: rutaId, hecho: !!si, updated: new Date().toISOString() }); }
  function fraccion(rutaId){
    const r = ruta(rutaId);
    if (!r || !r.pasos.length) return 0;
    return r.pasos.filter(p => hecho(rutaId, p.id)).length / r.pasos.length;
  }
  const pct = rutaId => Math.round(fraccion(rutaId) * 100);

  /* Global = Σ(vacantes que piden la habilidad × cobertura) / Σ(vacantes de cada habilidad).
     Cobertura: 1 si figura en el perfil; la fracción de su ruta si tiene ruta; 0 si no. */
  function global(rol){
    const comps = (rol && rol.competencias) || [];
    const cob = c => c.perfil === 'si' ? 1 : (rutaDe(c.nombre) ? fraccion(rutaDe(c.nombre).id) : 0);
    const total = comps.reduce((s, c) => s + c.vacantes, 0);
    if (!total) return { pct: 0, siguiente: null };
    const base = comps.reduce((s, c) => s + c.vacantes * cob(c), 0);
    let siguiente = null, mejor = 0;
    comps.forEach(c => {
      const r = rutaDe(c.nombre);
      if (!r || c.perfil === 'si') return;
      const gana = c.vacantes * (1 - cob(c));
      if (gana > mejor) { mejor = gana; siguiente = { ruta: r.id, competencia: nombreCorto(r), pct: Math.round((base + gana) / total * 100) }; }
    });
    return { pct: Math.round(base / total * 100), siguiente };
  }

  /* Id de página fijo y numérico (el editor de cuadernos los usa sin comillas): 8e15 + FNV-1a del id del paso.
     Igual en todos los equipos; lejos de los Date.now() (~1,7e12) de las páginas normales. */
  function idPagina(pasoId){
    let h = 0x811c9dc5;
    for (let i = 0; i < pasoId.length; i++) { h ^= pasoId.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return 8e15 + h;
  }
  function esc(s){ const d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  function paginaHtml(p){
    let h = p.logro ? `<p><b>Al terminar podrás</b> ${esc(p.logro)}</p>` : '';
    h += `<h3>Qué aprender</h3><ul>${p.aprender.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
    if (p.recurso) h += `<h3>Recurso</h3><p><a href="${esc(p.recurso.url)}" target="_blank" rel="noopener">${esc(p.recurso.nombre)}</a> · ${esc(p.recurso.proveedor)}</p>`;
    if (p.video) h += `<h3>Video</h3><p><a href="${esc(p.video.url)}" target="_blank" rel="noopener">${esc(p.video.titulo)}</a> · ${esc(p.video.canal)}</p>`;
    if (p.enlace) h += `<h3>En el Cerebro</h3><p><a href="${esc(p.enlace.url)}" target="_blank" rel="noopener">${esc(p.enlace.texto)}</a></p>`;
    if (p.hazlo) h += `<h3>Hazlo</h3><ol>${p.hazlo.map(x => `<li>${esc(x)}</li>`).join('')}</ol>`;
    if (p.codigo) h += `<pre>${esc(p.codigo.texto)}</pre>`;
    if (p.comprueba) h += `<h3>Compruébalo</h3><p>${esc(p.comprueba.texto)}${p.comprueba.valores ? ' ' + p.comprueba.valores.map(v => v.join(': ')).map(esc).join(' · ') : ''}</p>`;
    h += `<h3>Práctica</h3><p>${esc(p.practica)}</p><h3>Mi código y mis resultados</h3><p><br></p><h3>Mis apuntes</h3><p><br></p>`;
    return h;
  }

  function empezar(rutaId){
    const r = ruta(rutaId);
    if (!r || !window.WorkNB || !WorkNB.ensureNotebook) return null;
    const paginas = r.pasos.map((p, i) => ({ id: idPagina(p.id), title: `${i + 1}. ${p.titulo}`, body: paginaHtml(p) }));
    const id = WorkNB.ensureNotebook('work_nb_ruta_' + r.id, 'Ruta · ' + nombreCorto(r), r.icono, paginas);
    if (!id) return null;
    const previo = leer().find(x => x.id === r.id && x.tipo === 'ruta');
    try { poner({ id: r.id, tipo: 'ruta', ruta: r.id, empezada: (previo && previo.empezada) || new Date().toISOString(), nb: id, updated: new Date().toISOString() }); }
    catch (e) { return null; }
    return id;
  }

  return { cargar, rutas, ruta, rutaDe, nombreCorto, hecho, empezada, marcar, tarea, marcarTarea, pct, global, empezar, datos: () => datos, registros: () => leer() };
})();
window.WorkRutas = WorkRutas;
