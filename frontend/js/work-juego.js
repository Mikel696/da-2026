/* 14-WORK · Inicio de las rutas (26-nov-2026; reemplaza el centro de mando: Miguel pidió quitar XP, rango y logros,
   «interfaz limpia, sin tanto texto, comienza aquí, primero haz esto»). Solo lee (WorkRutas, rol-objetivo.json).
   Muestra una de dos vistas en el mismo lugar: el inicio (avance, «Comienza aquí» y las 25 habilidades en orden de
   prioridad) o la ruta abierta (la pinta WorkRutaPuntos). Nada salta a otra parte de la página. */
const WorkJuego = (function(){
  const COLOR = { 'IA': '#A493FF', 'Automatización': '#5CE1FF', 'Datos': '#5EF0C0', 'Procesos': '#FFC861', 'Personas': '#FF8FB1', 'Negocio': '#FFB45C' };
  const DISC = ['IA', 'Automatización', 'Datos', 'Procesos', 'Personas', 'Negocio'];
  const ESTADO = { si: ['si', 'en tu perfil'], no: ['no', 'no figura en tu perfil'], progreso: ['pr', 'en progreso'] };
  const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const esc = s => { const d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; };
  const compDe = (D, r) => D.competencias.find(c => c.nombre === r.competencia) || {};
  const dia = t => { const d = t instanceof Date ? t : new Date(t); return isNaN(d) ? '' : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const fecha = iso => { const d = new Date(iso && iso.length === 10 ? iso + 'T12:00:00' : iso); return isNaN(d) ? '' : `${d.getDate()}-${MES[d.getMonth()]}-${d.getFullYear()}`; };

  /* «Tu avance en detalle» (plegado): lo que mostraba el centro de mando salvo XP, rango y logros, que Miguel pidió
     quitar: mayor salto, disciplinas, actividad de 28 días y cómo se calcula el %. */
  function actividad(R){
    const porDia = {};
    R.registros().filter(r => r.hecho && (r.tipo === 'paso' || r.tipo === 'tarea')).forEach(r => { const d = dia(r.updated); if (d) porDia[d] = (porDia[d] || 0) + 1; });
    const hoy = new Date(); hoy.setHours(12, 0, 0, 0);
    const dias = [];
    for (let i = 27; i >= 0; i--) { const t = new Date(hoy.getTime() - i * 864e5); dias.push({ d: dia(t), n: porDia[dia(t)] || 0 }); }
    let racha = 0;
    for (let i = dias.length - 1; i >= 0; i--) { if (dias[i].n) racha++; else if (i === dias.length - 1) continue; else break; }
    const semana = dias.slice(-7).reduce((s, x) => s + x.n, 0), hoyN = dias[dias.length - 1].n;
    return `<div class="wk-act" role="img" aria-label="${dias.filter(x => x.n).length} de los últimos 28 días con avance">${dias.map((x, i) => `<span class="wk-dia n${Math.min(x.n, 4)}${i === dias.length - 1 ? ' hoy' : ''}" title="${esc(fecha(x.d))}: ${x.n} casilla${x.n === 1 ? '' : 's'}"></span>`).join('')}</div>
      <p class="wk-nota">${racha} día${racha === 1 ? '' : 's'} de racha · ${semana} casilla${semana === 1 ? '' : 's'} esta semana · ${hoyN ? `hoy marcaste ${hoyN}` : 'hoy todavía ninguna'}.</p>`;
  }
  function disciplinas(D, R){
    return DISC.map(nombre => {
      const rs = R.rutas().filter(r => r.disciplina === nombre);
      if (!rs.length) return '';
      const total = rs.reduce((s, r) => s + r.pasos.length, 0), hechos = rs.reduce((s, r) => s + r.pasos.filter(p => R.hecho(r.id, p.id)).length, 0);
      const comps = rs.map(r => ({ r, c: compDe(D, r) })).sort((a, b) => b.c.vacantes - a.c.vacantes);
      const enPerfil = comps.filter(x => x.c.perfil === 'si').length;
      return `<li class="wk-disc" style="--d:${COLOR[nombre]}">
          <p class="wk-disc-cab"><b>${esc(nombre)}</b><span>${hechos}/${total} pasos · ${enPerfil} de ${comps.length} en tu perfil</span></p>
          <span class="wk-tile-b"><i style="width:${total ? Math.round(hechos / total * 100) : 0}%"></i></span>
          <p class="wk-chips">${comps.map(({ r, c }) => { const [cls, txt] = ESTADO[c.perfil] || ESTADO.no; return `<button type="button" class="wk-chip-btn" data-ir="${esc(r.id)}" title="${esc(txt)}; la piden ${c.vacantes} de ${D.muestra.n} vacantes"><span class="wk-punto ${cls}" aria-hidden="true"></span>${esc(R.nombreCorto(r))}</button>`; }).join('')}</p>
        </li>`;
    }).join('');
  }
  function detalle(D, R){
    const G = R.global(D), sig = G.siguiente, kSig = sig && compDe(D, R.ruta(sig.ruta)), M = D.muestra;
    return `<details class="wk-plegado wk-detalle" data-k="detalle"><summary>Tu avance en detalle: mayor salto, disciplinas y actividad</summary>
        ${sig ? `<div class="wk-salto"><p><b>Tu mayor salto:</b> terminar ${esc(sig.competencia)} sube tu cobertura de ${G.pct} % a ${sig.pct} %. La piden ${kSig ? kSig.vacantes : '—'} de las ${M.n} vacantes.</p><button type="button" class="wk-btn sec" data-ir="${esc(sig.ruta)}">Ver su ruta</button></div>` : ''}
        <p class="wk-sub">Por disciplina</p>
        <ul class="wk-discs">${disciplinas(D, R)}</ul>
        <p class="wk-leyenda"><span><i class="wk-punto si"></i>en tu perfil</span><span><i class="wk-punto no"></i>no figura</span><span><i class="wk-punto pr"></i>en progreso</span></p>
        <p class="wk-sub">Actividad · últimos 28 días</p>
        ${actividad(R)}
        <p class="wk-nota"><b>Cómo se calcula el %.</b> Pesa cada habilidad por cuántas de las ${M.n} vacantes de la muestra (${esc(fecha(M.fecha))}) la piden: las que figuran en tu perfil cuentan completas y las demás con lo que llevas de su ruta. Por eso puede subir del 0 % aunque no hayas marcado pasos. «En tu perfil» es la lista del radar de 5-JOB: si algo no es cierto, el % cambia. La actividad cuenta pasos y tareas de «Hazlo» por el día en que los marcaste.</p>
      </details>`;
  }

  /* Orden recomendado: primero lo que tu perfil todavía no muestra, de lo que más piden las vacantes a lo que menos;
     después lo que ya figura en tu perfil (para repasar). */
  function ordenadas(D, R){
    const rs = R.rutas().map(r => ({ r, c: compDe(D, r) }));
    const porAprender = rs.filter(x => x.c.perfil !== 'si').sort((a, b) => b.c.vacantes - a.c.vacantes);
    const enPerfil = rs.filter(x => x.c.perfil === 'si').sort((a, b) => b.c.vacantes - a.c.vacantes);
    return { porAprender, enPerfil };
  }
  const ultimaVez = (R, id) => R.registros().filter(x => x.ruta === id).reduce((m, x) => (x.updated > m ? x.updated : m), '');
  const siguiente = (R, r) => r.pasos.find(p => !R.hecho(r.id, p.id));

  /* «Comienza aquí»: la ruta que tocaste por última vez y no has terminado; si no hay, la primera por aprender. */
  function comienza(D, R, porAprender){
    const enCurso = R.rutas().filter(r => (R.empezada(r.id) || R.pct(r.id) > 0) && R.pct(r.id) < 100)
      .sort((a, b) => ultimaVez(R, b.id).localeCompare(ultimaVez(R, a.id)))[0];
    return enCurso || (porAprender.find(x => siguiente(R, x.r)) || {}).r;
  }

  function tile(x, n, R, D){
    const { r, c } = x, pct = R.pct(r.id), hechos = r.pasos.filter(p => R.hecho(r.id, p.id)).length;
    return `<li><button type="button" class="wk-tile" data-ir="${esc(r.id)}" style="--d:${COLOR[r.disciplina] || '#5CE1FF'}" aria-label="${esc(R.nombreCorto(r))}: ${hechos} de ${r.pasos.length} pasos. La piden ${c.vacantes} de ${D.muestra.n} vacantes.">
        ${n ? `<span class="wk-tile-n">${n}</span>` : ''}
        <span class="wk-tile-t">${esc(R.nombreCorto(r))}</span>
        <span class="wk-tile-b"><i style="width:${pct}%"></i></span>
        <span class="wk-tile-m">${hechos}/${r.pasos.length} pasos · ${c.vacantes} vacantes${c.perfil === 'progreso' ? ' · en progreso' : ''}</span>
      </button></li>`;
  }

  function inicio(D, R){
    const { porAprender, enPerfil } = ordenadas(D, R);
    const todos = R.rutas(), total = todos.reduce((s, r) => s + r.pasos.length, 0);
    const hechos = todos.reduce((s, r) => s + r.pasos.filter(p => R.hecho(r.id, p.id)).length, 0);
    const g = R.global(D).pct;
    const r0 = comienza(D, R, porAprender), p0 = r0 && siguiente(R, r0);
    const i0 = r0 && p0 ? r0.pasos.indexOf(p0) : -1;
    return `
      <header class="wk-cab">
        <h2>Tu ruta al rol</h2>
        <p>${esc(D.rol)}</p>
      </header>
      <div class="wk-avance" role="img" aria-label="${hechos} de ${total} pasos aprendidos; cubres el ${g} % de lo que piden las vacantes">
        <span class="wk-avance-b"><i style="width:${Math.round(hechos / total * 100)}%"></i></span>
        <span><b>${hechos}</b> de ${total} pasos · con tu perfil cubres el <b>${g} %</b> de lo que piden ${D.muestra.n} vacantes (muestra del ${esc(fecha(D.muestra.fecha))})</span>
      </div>
      ${detalle(D, R)}
      ${r0 && p0 ? `<section class="wk-empieza" style="--d:${COLOR[r0.disciplina] || '#5CE1FF'}" aria-labelledby="wkEmp">
        <p class="wk-k" id="wkEmp">Comienza aquí</p>
        <p class="wk-empieza-r">${esc(R.nombreCorto(r0))} · paso ${i0 + 1} de ${r0.pasos.length}</p>
        <p class="wk-empieza-t">${esc(p0.titulo)}</p>
        <button type="button" class="wk-btn" data-ir="${esc(r0.id)}" data-paso="${esc(p0.id)}">${R.pct(r0.id) > 0 || R.empezada(r0.id) ? 'Continuar' : 'Empezar'}</button>
      </section>` : ''}
      <section aria-labelledby="wkPor">
        <h3 class="wk-h" id="wkPor">Por aprender <small>en orden: de la más pedida a la menos</small></h3>
        <ol class="wk-tiles">${porAprender.map((x, i) => tile(x, i + 1, R, D)).join('')}</ol>
      </section>
      <section aria-labelledby="wkYa">
        <h3 class="wk-h" id="wkYa">Ya en tu perfil <small>para repasar y demostrar</small></h3>
        <ul class="wk-tiles">${enPerfil.map(x => tile(x, 0, R, D)).join('')}</ul>
      </section>`;
  }

  const desplegados = new Map();   // data-k → abierto (solo en memoria)
  function render(D){
    const el = document.getElementById('workJuego');
    const R = window.WorkRutas;
    if (!el || !D || !R || !R.rutas().length) return;
    const abierta = window.WorkRol && WorkRol.abierta ? WorkRol.abierta() : null;
    // Lo que tenías desplegado sigue desplegado al marcar una casilla o al volver de una ruta (cada plegable lleva su data-k).
    el.querySelectorAll('details[data-k]').forEach(d => desplegados.set(d.dataset.k, d.open));
    el.innerHTML = abierta && window.WorkRol.rutaHtml ? WorkRol.rutaHtml() : inicio(D, R);
    el.querySelectorAll('details[data-k]').forEach(d => { if (desplegados.get(d.dataset.k)) d.open = true; });
  }

  function init(){
    const el = document.getElementById('workJuego');
    if (!el) return;
    el.addEventListener('click', e => {
      const v = e.target.closest('[data-volver]');
      if (v && window.WorkRol && WorkRol.cerrar) { WorkRol.cerrar(); return; }
      const b = e.target.closest('[data-ir]');
      if (b && window.WorkRol && WorkRol.abrir) WorkRol.abrir(b.dataset.ir, b.dataset.paso);
    });
  }

  return { init, render };
})();
window.WorkJuego = WorkJuego;
document.addEventListener('DOMContentLoaded', () => WorkJuego.init());
