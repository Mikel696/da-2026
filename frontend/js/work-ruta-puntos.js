/* 14-WORK · Ruta de una habilidad como lista de pasos (26-nov-2026, pedido de Miguel: «interfaz limpia, sin tanto
   texto, comienza aquí, primero haz esto»). Solo pinta. Se ve en el mismo lugar del inicio, con «← Todas las
   habilidades». Solo el paso elegido (o el que toca) está abierto: Mira, Practica, Hazlo y «Ya lo aprendí». Lo demás
   (meta en detalle, otras opciones, con qué se combina, cómo se midió) va plegado. Los clics los atiende WorkRol
   (data-estacion, data-paso, data-tarea, data-copiar, data-empezar, data-cuaderno) y WorkJuego (data-ir, data-volver). */
const WorkRutaPuntos = (function(){
  const COLOR = { 'IA': '#A493FF', 'Automatización': '#5CE1FF', 'Datos': '#5EF0C0', 'Procesos': '#FFC861', 'Personas': '#FF8FB1', 'Negocio': '#FFB45C' };
  const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const esc = s => { const d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; };
  const num = n => Number(n).toLocaleString('es-CO');
  const mesAno = iso => { const [a, m] = (iso || '').split('-').map(Number); return a ? `${MES[m - 1]} ${a}` : ''; };
  const fecha = iso => { const [a, m, d] = (iso || '').split('-').map(Number); return d ? `${d}-${MES[m - 1]}-${a}` : iso; };
  const durMin = min => min >= 60 ? `${Math.floor(min / 60)} h${min % 60 ? ` ${min % 60} min` : ''}` : `${min} min`;
  const seg = t => t.split(':').map(Number).reduce((a, b) => a * 60 + b, 0);
  const idYT = url => (url.match(/[?&]v=([\w-]{11})/) || [])[1];
  const pesoTxt = t => t.pesoRango ? `${t.pesoRango[0]}–${t.pesoRango[1]} %` : `${t.peso} %`;
  const ext = 'target="_blank" rel="noopener"';

  function elegido(r, sel, R){
    if (sel && r.pasos.some(p => p.id === sel)) return sel;
    const p = r.pasos.find(s => !R.hecho(r.id, s.id));
    return (p || r.pasos[r.pasos.length - 1]).id;
  }

  /* La meta en una línea; el detalle, plegado. */
  function meta(r, R){
    const c = r.certificacion || {}, ref = c.referencia, e = c.examen, g = c.gratis;
    const n = id => r.pasos.findIndex(p => p.id === id) + 1;
    const chips = e ? (ref && ref.nombre.includes(e.codigo) ? e.datos : [['Examen', e.codigo], ...e.datos]).map(([k, v]) => `<span class="wk-chip">${esc(k)}: <b>${esc(v)}</b></span>`).join('') : '';
    const temas = e && e.temas ? `<ol class="wk-temas">${e.temas.map(t => `<li><span>${esc(t.nombre)}</span><b>${pesoTxt(t)}</b><button type="button" class="wk-link" data-estacion="${esc(t.punto)}" data-de="${esc(r.id)}">paso ${n(t.punto)}</button></li>`).join('')}</ol>` : '';
    const creds = (c.credenciales || []).map(k => `<li><a href="${esc(k.url)}" ${ext}>${esc(k.nombre)}</a> <small>al terminar el paso ${n(k.punto)}</small></li>`).join('');
    return `<details class="wk-meta" data-k="${esc(r.id)}:meta">
        <summary><span class="wk-meta-ico" aria-hidden="true">🏆</span><span class="wk-meta-t">Meta: <b>${ref ? esc(ref.nombre) : 'demostrarlo en tu portafolio'}</b>${g ? '<span class="wk-chip ok">hay una oficial gratis</span>' : ''}</span><span class="wk-ver">Ver</span></summary>
        <div class="wk-meta-c">
          ${ref ? `<p><a href="${esc(ref.url)}" ${ext}>${esc(ref.nombre)}</a> · ${esc(ref.emisor)}. ${esc(ref.costo)}</p>` : `<p>${esc(c.referenciaNota || '')}</p>`}
          ${chips ? `<p class="wk-chips">${chips}</p>` : ''}
          ${temas ? `<p class="wk-sub">Lo que pregunta el examen y en qué paso lo ves:</p>${temas}` : ''}
          ${e && e.nota ? `<p class="wk-nota">${esc(e.nota)} <a href="${esc(e.temarioUrl || e.url)}" ${ext}>${esc(e.enlaceTexto || 'Ver el temario oficial')}</a></p>` : ''}
          ${g ? `<p class="wk-gratis">Oficial y gratis: <a href="${esc(g.url)}" ${ext}>${esc(g.nombre)}</a> (${esc(g.emisor)})${g.punto ? `, al terminar el paso ${n(g.punto)}` : ''}.${g.nota ? ' ' + esc(g.nota) : ''}</p>` : ''}
          ${creds ? `<p class="wk-sub">Credenciales gratis en el camino:</p><ul class="wk-lista">${creds}</ul>` : ''}
          ${c.camino && !g ? `<p class="wk-nota">${esc(c.camino.texto)}</p>` : ''}
          ${c.enVacantes ? `<p class="wk-nota">Lo que piden las vacantes: ${esc(c.enVacantes)}</p>` : ''}
        </div>
      </details>`;
  }

  function video(v, p, r){
    const id = idYT(v.url);
    const caps = v.capitulos && v.capitulos.length ? (() => {
      const total = Math.round(v.capitulos.reduce((s, k) => s + (k.fin ? seg(k.fin) - seg(k.inicio) : 0), 0) / 60);
      const base = v.url + (v.url.includes('?') ? '&' : '?') + 't=';
      return `<details class="wk-plegado" data-k="${esc(p.id)}:caps"><summary>Ver solo lo necesario: ${v.capitulos.length} capítulos${total ? ` (${durMin(total)})` : ''}</summary>
          <ol class="wk-caps">${v.capitulos.map(k => `<li><a href="${esc(base + seg(k.inicio) + 's')}" ${ext}><span>${esc(k.inicio.replace(/^0(\d:)/, '$1'))}</span>${esc(k.nombre)}</a></li>`).join('')}</ol></details>`;
    })() : '';
    return `<a class="wk-video" href="${esc(v.url)}" ${ext}>
        <span class="wk-mini">${id ? `<img src="https://i.ytimg.com/vi/${esc(id)}/mqdefault.jpg" alt="" loading="lazy" width="160" height="90" onerror="this.remove()">` : ''}<span class="wk-play" aria-hidden="true">▶</span></span>
        <span class="wk-video-t"><b>${esc(v.titulo)}</b><small>${esc(v.canal)} · ${mesAno(v.publicado)} · ${num(v.megusta)} me gusta · ${durMin(v.minutos)}</small></span>
      </a>${caps}
      <details class="wk-plegado" data-k="${esc(p.id)}:video"><summary>Qué muestra y por qué este video</summary>${p.mira ? `<p class="wk-nota">${esc(p.mira)}</p>` : ''}${v.clasico ? `<p class="wk-nota"><b>Por qué se queda aunque tiene más de dos años:</b> ${esc(v.clasico)}</p>` : ''}<p class="wk-nota"><b>Por qué este:</b> ${esc(v.porQue)} ${num(v.vistas)} vistas y ${num(v.megusta)} me gusta al ${esc(fecha(r.medido))}.</p></details>`;
  }

  function curso(k, p){
    return `<a class="wk-curso" href="${esc(k.url)}" ${ext}><b>${esc(k.nombre)}</b><small>${k.parte ? esc(k.parte) + ' · ' : ''}${esc(k.proveedor)} · ${esc(k.idioma)}${k.gratis ? ' · <span class="wk-chip ok">Gratis</span>' : ''}</small></a>
      ${(k.datos || []).length || k.porQue || p.practica ? `<details class="wk-plegado" data-k="${esc(p.id)}:curso"><summary>${p.practica ? 'Qué hacer ahí y lo que dice su página' : 'Lo que dice su página'}</summary>${p.practica ? `<p class="wk-nota"><b>Qué hacer:</b> ${esc(p.practica)}</p>` : ''}<p class="wk-nota">${(k.datos || []).map(([a, b]) => `${esc(a)}: ${esc(b)}`).join(' · ')}${k.porQue ? '. ' + esc(k.porQue) : ''}</p></details>` : ''}`;
  }

  function practicaCompleta(p){
    const d = p.idea, c = p.codigo, k = p.comprueba || {};
    const pares = d ? `<p class="wk-sub">${esc(d.titulo)}</p><div class="rv-pares" role="table">${d.filas.map(([a, b]) => `<div class="rv-par" role="row"><span class="rv-par-a" role="cell">${esc(a)}</span><span class="rv-par-fl" aria-hidden="true">→</span>${d.codigo ? `<code class="rv-par-b" role="cell">${esc(b)}</code>` : `<span class="rv-par-b" role="cell">${esc(b)}</span>`}</div>`).join('')}</div>` : '';
    const cod = c ? `<div class="rv-cod">${c.preparar ? `<details class="rv-prep"><summary>Primero, la tabla de práctica</summary><pre><code>${esc(c.preparar)}</code></pre></details>` : ''}
        <div class="rv-cod-cab"><span>${esc({ python: 'Python', sql: 'SQL', excel: 'Fórmula de Excel', dax: 'DAX', json: 'JSON', texto: 'Plantilla' }[c.lenguaje] || c.lenguaje)}</span><button type="button" class="rv-copiar" data-copiar="${esc(p.id)}">Copiar</button></div>
        <pre><code>${esc(c.texto)}</code></pre></div>` : '';
    const sal = k.salida || k.salidaEjemplo;
    const comp = `<p class="wk-sub">${esc(k.texto || '')}</p>${k.valores ? `<div class="rv-vals">${k.valores.map(([n, v]) => `<div class="rv-val"><b>${esc(v)}</b><span>${esc(n)}</span></div>`).join('')}</div>` : ''}${sal ? `<pre class="rv-sal">${esc(sal)}</pre>` : ''}${k.nota ? `<p class="wk-nota">${esc(k.nota)}</p>` : ''}`;
    const errs = (p.errores || []).length ? `<p class="wk-sub">Errores típicos</p><ul class="rv-errs">${p.errores.map(([q, x]) => `<li><b>${esc(q)}</b> ${esc(x)}</li>`).join('')}</ul>` : '';
    return `<details class="wk-plegado" data-k="${esc(p.id)}:ejercicio"><summary>Ver el ejercicio completo: código, resultado esperado y errores</summary><div class="wk-practica">${pares}${cod}${comp}${errs}</div></details>`;
  }

  function cuerpo(r, p, i, R){
    const n = r.pasos.length, ok = R.hecho(r.id, p.id);
    const tareas = p.hazlo.map((t, j) => {
      const hecha = R.tarea(r.id, p.id, j);
      return `<li><label class="rv-tarea${hecha ? ' hecha' : ''}"><input type="checkbox" data-tarea="${j}" data-paso-de="${esc(p.id)}" data-de="${esc(r.id)}"${hecha ? ' checked' : ''}><span>${esc(t)}</span></label></li>`;
    }).join('');
    const otras = [...(p.mas || []).map(m => m.tipo === 'video'
        ? `<li><a href="${esc(m.url)}" ${ext}>${esc(m.titulo)}</a><small>${esc(m.etiqueta)} · ${esc(m.canal)} · ${mesAno(m.publicado)} · ${num(m.megusta)} me gusta</small>${m.clasico ? `<small>Por qué se queda: ${esc(m.clasico)}</small>` : ''}${m.porQue ? `<small>${esc(m.porQue)}</small>` : ''}</li>`
        : `<li><a href="${esc(m.url)}" ${ext}>${esc(m.nombre)}</a><small>${esc(m.etiqueta || 'Curso')} · ${esc(m.proveedor)}</small>${m.porQue ? `<small>${esc(m.porQue)}</small>` : ''}</li>`),
      ...(p.descartados || []).map(x => `<li class="wk-desc"><a href="${esc(x.url)}" ${ext}>${esc(x.titulo)}</a><small>Descartado: ${esc(x.razon)}</small></li>`)];
    const e = (r.certificacion || {}).examen, ts = e && e.temas ? e.temas.filter(t => t.punto === p.id) : [];
    return `<div class="wk-cuerpo">
        <p class="wk-logro">Al terminar podrás ${esc(p.logro)}</p>
        ${(p.aprender || []).length ? `<details class="wk-plegado" data-k="${esc(p.id)}:aprende"><summary>Lo que aprendes (${p.aprender.length})</summary><ul class="wk-lista wk-aprende">${p.aprender.map(x => `<li>${esc(x)}</li>`).join('')}</ul></details>` : ''}
        ${ts.length ? `<p class="wk-tema"><span aria-hidden="true">🎯</span> Examen ${esc(e.codigo)}: ${ts.map(t => `tema ${t.n} (${pesoTxt(t)} del puntaje)`).join(' y ')}</p>` : ''}
        <div class="wk-accion"><span class="wk-accion-n" aria-hidden="true">1</span><div class="wk-accion-c"><p class="wk-accion-t">Mira</p>${p.video ? video(p.video, p, r) : `<p class="wk-nota">${esc(p.sinVideo || 'Este paso no tiene video.')}</p>`}</div></div>
        <div class="wk-accion"><span class="wk-accion-n" aria-hidden="true">2</span><div class="wk-accion-c"><p class="wk-accion-t">Practica</p>${p.recurso ? curso(p.recurso, p) : p.practica ? `<p class="wk-nota">${esc(p.practica)}</p>` : ''}${p.enlace ? `<a class="wk-curso" href="${esc(p.enlace.url)}"><b>${esc(p.enlace.texto)}</b><small>En el Cerebro</small></a>` : ''}</div></div>
        <div class="wk-accion"><span class="wk-accion-n" aria-hidden="true">3</span><div class="wk-accion-c"><p class="wk-accion-t">Hazlo</p><ol class="rv-tareas">${tareas}</ol>${practicaCompleta(p)}</div></div>
        <label class="wk-listo${ok ? ' hecha' : ''}"><input type="checkbox" data-paso="${esc(p.id)}" data-de="${esc(r.id)}"${ok ? ' checked' : ''}><span>${ok ? `Paso ${i + 1} aprendido` : `Ya lo aprendí${i < n - 1 ? `: pasar al paso ${i + 2}` : ''}`}</span></label>
        ${otras.length ? `<details class="wk-plegado" data-k="${esc(p.id)}:otras"><summary>Otras opciones (${otras.length})</summary><ul class="wk-otras">${otras.join('')}</ul></details>` : ''}
      </div>`;
  }

  function combina(r, c, D, R){
    const cb = r.combina || {};
    const chip = x => { const q = R.ruta(x.ruta); return q ? `<li><button type="button" class="wk-chip-btn" data-ir="${esc(q.id)}">${esc(R.nombreCorto(q))}</button><small>${esc(x.porque)}</small></li>` : ''; };
    const con = D.vacantes.filter(v => v.competencias.includes(c.nombre)), cuenta = {};
    con.forEach(v => v.competencias.forEach(k => { if (k !== c.nombre) cuenta[k] = (cuenta[k] || 0) + 1; }));
    const junto = Object.entries(cuenta).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, n]) => { const q = R.rutaDe(k); return q ? `<button type="button" class="wk-chip-btn" data-ir="${esc(q.id)}">${esc(R.nombreCorto(q))} <small>${n}/${con.length}</small></button>` : ''; }).join('');
    return `<details class="wk-plegado wk-combina" data-k="${esc(r.id)}:combina"><summary>Con qué se combina</summary>
        ${(cb.antes || []).length ? `<p class="wk-sub">Antes conviene</p><ul class="wk-porque">${cb.antes.map(chip).join('')}</ul>` : ''}
        ${(cb.abre || []).length ? `<p class="wk-sub">Te abre</p><ul class="wk-porque">${cb.abre.map(chip).join('')}</ul>` : ''}
        ${junto ? `<p class="wk-sub">Se pide junto con: de las ${con.length} vacantes que piden ${esc(R.nombreCorto(r))}, cuántas piden también…</p><p class="wk-chips">${junto}</p>` : ''}
      </details>`;
  }

  function html(r, c, D, sel, R){
    const idSel = elegido(r, sel, R), n = r.pasos.length;
    const hechos = r.pasos.filter(p => R.hecho(r.id, p.id)).length;
    const toca = (r.pasos.find(p => !R.hecho(r.id, p.id)) || {}).id;
    const e = (r.certificacion || {}).examen;
    const ultimo = e && e.temas ? Math.max(...e.temas.map(t => r.pasos.findIndex(p => p.id === t.punto))) : -1;
    const nombre = R.nombreCorto(r), nb = R.empezada(r.id) ? 'work_nb_ruta_' + r.id : '';
    const pasos = r.pasos.map((p, i) => {
      const ok = R.hecho(r.id, p.id), abierto = p.id === idSel;
      const fila = `<li class="wk-paso${ok ? ' ok' : ''}${p.id === toca ? ' toca' : ''}${abierto ? ' abierto' : ''}">
          <button type="button" class="wk-paso-cab" data-estacion="${esc(p.id)}" data-de="${esc(r.id)}" aria-expanded="${abierto}">
            <span class="wk-num" aria-hidden="true">${ok ? '✓' : i + 1}</span>
            <span class="wk-paso-t">${esc(p.titulo)}</span>
            <span class="wk-estado">${ok ? 'Aprendido' : p.id === toca ? 'Aquí vas' : ''}</span>
          </button>
          ${abierto ? cuerpo(r, p, i, R) : ''}
        </li>`;
      const bandera = i === ultimo ? `<li class="wk-hito"><span aria-hidden="true">🏁</span> Aquí ya viste los temas del examen ${esc(e.codigo)}</li>` : '';
      return fila + bandera;
    }).join('');
    return `<div class="rv wk-ruta" id="ruta-${esc(r.id)}" style="--d:${COLOR[r.disciplina] || '#5CE1FF'}" role="region" aria-label="Ruta: ${esc(nombre)}">
        <button type="button" class="wk-volver" data-volver>← Todas las habilidades</button>
        <header class="wk-r-cab">
          <h2>${esc(nombre)}</h2>
          <p class="wk-r-idea">${esc(r.frase)}</p>
          <button type="button" class="wk-oir" data-escuchar="${esc(r.id)}" aria-pressed="false">🔊 <span>Escuchar la idea</span></button>
          <div class="wk-avance"><span class="wk-avance-b"><i style="width:${Math.round(hechos / n * 100)}%"></i></span><span><b>${hechos}</b> de ${n} pasos · la piden ${c.vacantes} de ${D.muestra.n} vacantes (muestra del ${esc(fecha(D.muestra.fecha))})</span></div>
        </header>
        ${meta(r, R)}
        ${r.orden || r.portafolio || c.perfil === 'si' ? `<details class="wk-plegado wk-plan" data-k="${esc(r.id)}:plan"><summary>Plan: por dónde empezar y qué te llevas</summary>${c.perfil === 'si' ? '<p class="wk-nota">Ya figura en tu perfil, así que en tu % cuenta completa. Esta ruta sirve para repasarla y demostrarla.</p>' : ''}${r.orden ? `<p class="wk-nota"><b>Por dónde empezar.</b> ${esc(r.orden)}</p>` : ''}${r.portafolio ? `<p class="wk-nota"><b>Lo que te llevas al portafolio.</b> ${esc(r.portafolio)}</p>` : ''}</details>` : ''}
        <ol class="wk-pasos">${pasos}</ol>
        ${combina(r, c, D, R)}
        <details class="wk-plegado" data-k="${esc(r.id)}:fuentes"><summary>Cómo se eligieron los recursos</summary><p class="wk-nota">Medidos el ${esc(fecha(r.medido))} en la página de cada video y curso (fecha, vistas, me gusta, duración y capítulos). Las vistas y los me gusta suben cada día. Se eligieron por fecha, me gusta, idioma y por cómo cubren el temario; nadie los vio completos. Lo que piden las vacantes sale de la muestra del ${esc(fecha(D.muestra.fecha))}.</p></details>
        <div class="wk-nb">${nb ? `<button type="button" class="wk-btn sec" data-cuaderno="${esc(nb)}">Abrir mi cuaderno de ${esc(nombre)}</button>` : `<button type="button" class="wk-btn sec" data-empezar="${esc(r.id)}">Crear mi cuaderno de ${esc(nombre)}</button>`}<span class="ruta-nota">Una página por paso para tus apuntes.</span></div>
      </div>`;
  }

  /* Lo que lee «Escuchar la idea» (WorkRol lo pide por compatibilidad). */
  const textoOir = r => `${r.competencia.split(' (')[0]}. ${r.frase}`;
  return { html, textoOir };
})();
window.WorkRutaPuntos = WorkRutaPuntos;
