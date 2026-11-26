/* 14-WORK · Ruta por puntos (25-nov-2026, pedido de Miguel: «una ruta de aprendizaje sólida… como una ruta de ir
   pasando puntos de aprendizaje»; el aspecto de videojuego es solo de la interfaz, sin XP ni desafíos). Solo pinta.
   Arriba la meta (la certificación y su temario), el camino de puntos con el orden, con qué se combina (medido en las
   vacantes) y el punto elegido: sus recursos medidos con fecha de corte, otras opciones, lo descartado y la práctica.
   El avance lo guarda WorkRutas; los clics los atiende WorkRol (data-estacion, data-paso, data-tarea, data-copiar,
   data-empezar, data-cuaderno, data-escuchar) y WorkJuego (data-ir: abre otra ruta). */
const WorkRutaPuntos = (function(){
  const COLOR = { 'IA': '#A493FF', 'Automatización': '#5CE1FF', 'Datos': '#5EF0C0', 'Procesos': '#FFC861', 'Personas': '#FF8FB1', 'Negocio': '#FFB45C' };
  const ICO = {
    'IA': 'M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
    'Automatización': 'M13 2 4 14h7l-1 8 9-12h-7l1-8z',
    'Datos': 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
    'Procesos': 'M4 4h6v6H4zM14 14h6v6h-6zM7 10v3a2 2 0 0 0 2 2h5',
    'Personas': 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a6 6 0 0 1 12 0v1M16 3.5a4 4 0 0 1 0 7.5M22 21v-1a6 6 0 0 0-4-5.7',
    'Negocio': 'M3 8h18v12H3zM8 8V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v3M3 13h18',
  };
  const I = {
    ok: 'M5 12.5 10 17 19 7', play: 'M8 5v14l11-7z', copia: 'M9 9h11v11H9zM5 15H4V4h11v1',
    oir: 'M11 5 6 9H3v6h3l5 4V5zM16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12',
    cal: 'M4 5h16v15H4zM4 10h16M9 3v4M15 3v4', ojo: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
    gusta: 'M7 10v11H3V10zM7 10l4-8a3 3 0 0 1 3 3v4h5a2 2 0 0 1 2 2.3l-1.3 7a2 2 0 0 1-2 1.7H7', reloj: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2',
    bandera: 'M5 21V4M5 4h11l-2 4 2 4H5', meta: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4',
    insignia: 'M12 2l3 3h4v4l3 3-3 3v4h-4l-3 3-3-3H5v-4l-3-3 3-3V5h4z', libro: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5',
    flecha: 'M5 12h14M13 6l6 6-6 6',
  };
  const svg = (d, w = 18, extra = '') => `<svg width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${extra}><path d="${d}"></path></svg>`;
  const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  function esc(s){ const d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  const num = n => Number(n).toLocaleString('es-CO');
  const fecha = iso => { const [a, m, d] = (iso || '').split('-').map(Number); return a ? `${d}-${MES[m - 1]}-${a}` : ''; };
  const hace = iso => {
    const m = Math.floor((Date.now() - new Date(iso + 'T12:00:00')) / 864e5 / 30.44);
    return m < 1 ? 'este mes' : m < 12 ? `hace ${m} ${m === 1 ? 'mes' : 'meses'}` : `hace ${Math.floor(m / 12)} año${m >= 24 ? 's' : ''}${m % 12 ? ` y ${m % 12} ${m % 12 === 1 ? 'mes' : 'meses'}` : ''}`;
  };
  const durMin = min => min >= 60 ? `${Math.floor(min / 60)} h${min % 60 ? ` ${min % 60} min` : ''}` : `${min} min`;
  const seg = t => t.split(':').map(Number).reduce((a, b) => a * 60 + b, 0);
  const idYT = url => (url.match(/[?&]v=([\w-]{11})/) || [])[1];
  const nombreDe = (R, id) => { const r = R.ruta(id); return r ? R.nombreCorto(r) : id; };
  // Peso de un tema del examen: un número o un rango que publica el emisor (Microsoft: «25–30 %»).
  const pesoTxt = t => t.pesoRango ? `${t.pesoRango[0]}–${t.pesoRango[1]} %` : `${t.peso} %`;
  const pesoMedio = t => t.pesoRango ? (t.pesoRango[0] + t.pesoRango[1]) / 2 : t.peso;
  const sumaPeso = ts => ts.some(t => t.pesoRango) ? `${ts.reduce((s, t) => s + (t.pesoRango ? t.pesoRango[0] : t.peso), 0)}–${ts.reduce((s, t) => s + (t.pesoRango ? t.pesoRango[1] : t.peso), 0)} %` : `${ts.reduce((s, t) => s + t.peso, 0)} %`;

  /* Estado de cada punto: el elegido; si no, el primero sin aprender; si todos están, el último. */
  function elegido(r, sel, R){
    if (sel && r.pasos.some(p => p.id === sel)) return sel;
    const p = r.pasos.find(s => !R.hecho(r.id, s.id));
    return (p || r.pasos[r.pasos.length - 1]).id;
  }

  /* La meta: la certificación de referencia con su examen, y las credenciales gratis del camino. */
  function meta(r, R){
    const c = r.certificacion || {}, ref = c.referencia, e = c.examen;
    const n = id => r.pasos.findIndex(p => p.id === id) + 1;
    const ts = (e && e.temas) || [];
    const barra = ts.length ? `<div class="rp-temas-barra" role="img" aria-label="Peso de cada tema en el puntaje: ${ts.map(t => `tema ${t.n}, ${pesoTxt(t)}`).join('; ')}">${ts.map(t => `<span style="flex:${pesoMedio(t)}"><b>${t.n}</b></span>`).join('')}</div>` : '';
    const temas = ts.length ? `<ol class="rp-temas">${ts.map(t => `<li><span class="rp-tema-n">${t.n}</span><span class="rp-tema-t">${esc(t.nombre)}</span><span class="rp-tema-p">${pesoTxt(t)}</span><button type="button" class="rp-tema-ir" data-estacion="${esc(t.punto)}" data-de="${esc(r.id)}">Punto ${n(t.punto)}</button></li>`).join('')}</ol>` : '';
    const creds = (c.credenciales || []).map(k => `<li><span class="rp-cred-ico">${svg(I.insignia, 18)}</span><span><a href="${esc(k.url)}" target="_blank" rel="noopener">${esc(k.nombre)}</a><small>${esc(k.emisor)} · al terminar el punto ${n(k.punto)}</small></span></li>`).join('');
    return `<section class="rp-meta" aria-labelledby="rp-m-${esc(r.id)}">
        <div class="rp-meta-cab">
          <span class="rp-meta-hex">${svg(I.meta, 26)}</span>
          <div>
            <p class="rp-meta-k">La meta de esta ruta</p>
            <h4 id="rp-m-${esc(r.id)}">${ref ? `<a href="${esc(ref.url)}" target="_blank" rel="noopener">${esc(ref.nombre)}</a>` : esc(c.referenciaNota || '')}</h4>
            ${ref ? `<p class="rp-meta-e">${esc(ref.emisor)}. ${esc(ref.costo)}</p>` : ''}
          </div>
        </div>
        ${e ? `<dl class="rp-meta-datos">${e.datos.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd${String(v).length > 7 ? ' class="largo"' : ''}>${esc(v)}</dd></div>`).join('')}</dl>
        ${ts.length ? `<div class="rp-meta-temario"><p class="rp-meta-sub">Lo que pregunta el examen y en qué punto lo aprendes</p>${barra}${temas}</div>` : ''}
        <p class="rp-pie">${esc(e.nota || '')} <a href="${esc(e.temarioUrl || e.url)}" target="_blank" rel="noopener">Ver el temario oficial${/\.pdf$/i.test(e.temarioUrl || '') ? ' (PDF)' : ''}</a></p>` : ''}
        ${c.gratis ? `<div class="rp-gratis-of"><p class="rp-meta-sub">Oficial y gratis</p><p><span class="rp-cred-ico">${svg(I.insignia, 18)}</span><span><a href="${esc(c.gratis.url)}" target="_blank" rel="noopener">${esc(c.gratis.nombre)}</a><small>${esc(c.gratis.emisor)} · ${esc(c.gratis.tipo)}${c.gratis.punto ? ` · al terminar el punto ${n(c.gratis.punto)}` : ''}</small></span></p>${c.gratis.nota ? `<p class="rp-pie">${esc(c.gratis.nota)}</p>` : ''}</div>` : ''}
        ${creds ? `<div class="rp-creds"><p class="rp-meta-sub">Credenciales gratis en el camino</p><ul>${creds}</ul></div>` : ''}
        ${c.camino ? `<p class="rp-pie">${esc(c.camino.texto)}</p>` : ''}
        ${c.enVacantes ? `<p class="rp-meta-vac"><b>Lo que piden las vacantes:</b> ${esc(c.enVacantes)}</p>` : ''}
      </section>`;
  }

  /* El camino: los puntos en orden, la bandera del examen donde ya lo cubres y el portafolio al final. */
  function camino(r, R, idSel){
    const toca = (r.pasos.find(p => !R.hecho(r.id, p.id)) || {}).id;
    const e = (r.certificacion || {}).examen;
    const ultimoExamen = e && e.temas && e.temas.length ? Math.max(...e.temas.map(t => r.pasos.findIndex(p => p.id === t.punto))) : -1;
    const nodos = r.pasos.map((p, i) => {
      const ok = R.hecho(r.id, p.id), es = p.id === idSel;
      const estado = ok ? 'Aprendido' : p.id === toca ? 'Aquí vas' : 'Después';
      const caps = p.video && p.video.capitulos ? p.video.capitulos.reduce((s, k) => s + (k.fin ? seg(k.fin) - seg(k.inicio) : 0), 0) / 60 : p.video ? p.video.minutos : 0;
      const nodo = `<li class="rp-nodo${ok ? ' ok' : ''}${p.id === toca ? ' toca' : ''}${es ? ' sel' : ''}${i && R.hecho(r.id, r.pasos[i - 1].id) ? ' lit' : ''}">
          <button type="button" data-estacion="${esc(p.id)}" data-de="${esc(r.id)}" aria-pressed="${es}" aria-label="Punto ${i + 1}: ${esc(p.titulo)}. ${estado}.">
            <span class="rp-hex"><span>${ok ? svg(I.ok, 22) : i + 1}</span></span>
            <span class="rp-nodo-st">${estado}</span>
            <span class="rp-nodo-t">${esc(p.titulo)}</span>
            ${caps ? `<span class="rp-nodo-v">${svg(I.play, 12, ' fill="currentColor" stroke="none"')}${durMin(Math.round(caps))} de video</span>` : ''}
          </button></li>`;
      const bandera = i === ultimoExamen ? `<li class="rp-hito${r.pasos.slice(0, i + 1).every(q => R.hecho(r.id, q.id)) ? ' ok' : ''}" aria-label="Aquí ya cubres los ${e.temas.length} temas del examen ${esc(e.codigo)}"><span class="rp-hito-ico">${svg(I.bandera, 20)}</span><span class="rp-hito-t">${esc(e.codigo)}</span><span class="rp-hito-s">aquí ya cubres los ${e.temas.length} temas del examen</span></li>` : '';
      return nodo + bandera;
    }).join('');
    const todo = r.pasos.every(p => R.hecho(r.id, p.id));
    return `<section class="rp-camino" aria-label="El camino de la ruta">
        <div class="rp-camino-scroll" tabindex="0" role="region" aria-label="Puntos de la ruta; se desliza a los lados">
          <ol class="rp-nodos">${nodos}<li class="rp-hito rp-fin${todo ? ' ok' : ''}"><span class="rp-hito-ico">${svg(I.meta, 20)}</span><span class="rp-hito-t">Tu portafolio</span><span class="rp-hito-s">dos programas para enseñar</span></li></ol>
        </div>
      </section>`;
  }

  /* Con qué se combina: lo que conviene antes y lo que abre (criterio de la ruta) y lo que piden junto (medido). */
  function combina(r, c, D, R){
    const cb = r.combina || {};
    const perfil = id => { const x = R.ruta(id), k = x && D.competencias.find(q => q.nombre === x.competencia); return k ? k.perfil : ''; };
    const marca = p => p === 'si' ? '<span class="rp-perfil si">en tu perfil</span>' : p === 'progreso' ? '<span class="rp-perfil pr">en progreso</span>' : '';
    const fila = x => `<li><button type="button" class="rp-ruta-ir" data-ir="${esc(x.ruta)}">${esc(nombreDe(R, x.ruta))}${marca(perfil(x.ruta))}</button><p>${esc(x.porque)}</p></li>`;
    const con = D.vacantes.filter(v => v.competencias.includes(c.nombre));
    const cuenta = {};
    con.forEach(v => v.competencias.forEach(k => { if (k !== c.nombre) cuenta[k] = (cuenta[k] || 0) + 1; }));
    const top = Object.entries(cuenta).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const junto = top.map(([k, n]) => {
      const x = R.rutaDe(k), nom = x ? R.nombreCorto(x) : k.split(' (')[0], total = (D.competencias.find(q => q.nombre === k) || {}).vacantes;
      // Al lado, cuántas de todas la piden: Inglés sale arriba porque lo piden casi todas, no solo las de esta habilidad.
      return `<li>${x ? `<button type="button" class="rp-ruta-ir" data-ir="${esc(x.id)}">${esc(nom)}</button>` : `<span>${esc(nom)}</span>`}<span class="rp-junto-b" role="img" aria-label="${n} de ${con.length}"><i style="width:${Math.round(n / con.length * 100)}%"></i></span><span class="rp-junto-n">${n} de ${con.length}${total ? `<small>en todas: ${total} de ${D.muestra.n}</small>` : ''}</span></li>`;
    }).join('');
    return `<section class="rp-combina" aria-label="Con qué se combina">
        <div><h4>Antes conviene</h4><ul>${(cb.antes || []).map(fila).join('') || '<li><p>Nada: se puede empezar de cero.</p></li>'}</ul></div>
        <div><h4>Se pide junto con</h4><p class="rp-sub">En las ${con.length} vacantes de la muestra que piden ${esc(R.nombreCorto(r))}:</p><ul class="rp-junto">${junto}</ul></div>
        <div><h4>Te abre</h4><ul>${(cb.abre || []).map(fila).join('')}</ul></div>
      </section>`;
  }

  function metricas(v){
    return `<ul class="rp-med" aria-label="Medidas del video">
        <li title="Publicado">${svg(I.cal, 15)}<span>${fecha(v.publicado)}<small>${hace(v.publicado)}</small></span></li>
        <li title="Vistas">${svg(I.ojo, 15)}<span>${num(v.vistas)}<small>vistas</small></span></li>
        <li title="Me gusta">${svg(I.gusta, 15)}<span>${num(v.megusta)}<small>me gusta</small></span></li>
        ${v.minutos ? `<li title="Duración">${svg(I.reloj, 15)}<span>${durMin(v.minutos)}<small>dura</small></span></li>` : ''}
      </ul>`;
  }
  function capitulos(v){
    if (!v.capitulos || !v.capitulos.length) return '';
    const total = Math.round(v.capitulos.reduce((s, k) => s + (k.fin ? seg(k.fin) - seg(k.inicio) : 0), 0) / 60);
    const base = v.url + (v.url.includes('?') ? '&' : '?') + 't=';
    return `<div class="rp-caps"><p class="rp-caps-t">Mira estos ${v.capitulos.length} capítulos${total ? ` (unos ${durMin(total)})` : ''}. Cada uno abre el video en su minuto.</p>
        <ol>${v.capitulos.map(k => `<li><a href="${esc(base + seg(k.inicio) + 's')}" target="_blank" rel="noopener"><span class="rp-cap-m">${esc(k.inicio.replace(/^0(\d:)/, '$1'))}</span><span class="rp-cap-n">${esc(k.nombre)}</span>${k.fin ? `<span class="rp-cap-d">${Math.max(1, Math.round((seg(k.fin) - seg(k.inicio)) / 60))} min</span>` : ''}</a></li>`).join('')}</ol></div>`;
  }
  function videoPrincipal(v){
    const id = idYT(v.url);
    return `<article class="rp-rec rp-video">
        <p class="rp-rec-k">${svg(I.play, 14, ' fill="currentColor" stroke="none"')}Video principal</p>
        <a class="rp-mini" href="${esc(v.url)}" target="_blank" rel="noopener" aria-label="Ver en YouTube: ${esc(v.titulo)}">
          ${id ? `<img src="https://i.ytimg.com/vi/${esc(id)}/mqdefault.jpg" alt="" loading="lazy" width="320" height="180" onerror="this.remove()">` : ''}
          <span class="rp-mini-play">${svg(I.play, 26, ' fill="currentColor" stroke="none"')}</span></a>
        <h5><a href="${esc(v.url)}" target="_blank" rel="noopener">${esc(v.titulo)}</a></h5>
        <p class="rp-rec-de">${esc(v.canal)} en YouTube</p>
        ${metricas(v)}
        ${v.clasico ? `<p class="rp-porque"><b>Por qué se queda aunque tiene más de dos años:</b> ${esc(v.clasico)}</p>` : ''}
        <p class="rp-porque"><b>Por qué este:</b> ${esc(v.porQue)}</p>
        ${capitulos(v)}
      </article>`;
  }
  function curso(k, cls = ''){
    return `<article class="rp-rec rp-curso${cls}">
        <p class="rp-rec-k">${svg(I.libro, 14)}${k.etiqueta ? esc(k.etiqueta) : 'Curso para practicar'}${k.gratis ? '<span class="rp-gratis">Gratis</span>' : ''}</p>
        <h5><a href="${esc(k.url)}" target="_blank" rel="noopener">${esc(k.nombre)}</a></h5>
        <p class="rp-rec-de">${k.parte ? `<b>${esc(k.parte)}</b> · ` : ''}${esc(k.proveedor)} · ${esc(k.idioma)}</p>
        <dl class="rp-datos">${(k.datos || []).map(([a, b]) => `<div><dt>${esc(a)}</dt><dd>${esc(b)}</dd></div>`).join('')}</dl>
        <p class="rp-porque"><b>Por qué este:</b> ${esc(k.porQue)}</p>
      </article>`;
  }
  function otra(m){
    if (m.tipo === 'curso') return `<li>${curso(m, ' rp-otra')}</li>`;
    return `<li><article class="rp-rec rp-otra">
        <p class="rp-rec-k">${svg(I.play, 14, ' fill="currentColor" stroke="none"')}${esc(m.etiqueta)}</p>
        <h5><a href="${esc(m.url)}" target="_blank" rel="noopener">${esc(m.titulo)}</a></h5>
        <p class="rp-rec-de">${esc(m.canal)} en YouTube</p>
        ${metricas(m)}
        ${m.clasico ? `<p class="rp-porque"><b>Por qué se queda:</b> ${esc(m.clasico)}</p>` : ''}
        <p class="rp-porque">${esc(m.porQue)}</p>
        ${capitulos(m)}
      </article></li>`;
  }

  /* La práctica de siempre (25-nov): la idea con Excel, las tareas con su código y cómo comprobarlo. */
  function practica(r, p, R){
    const d = p.idea, c = p.codigo, k = p.comprueba;
    const pares = d ? `<div class="rv-pares" role="table" aria-label="${esc(d.columnas[0])} y ${esc(d.columnas[1])}">
        <div class="rv-par rv-par-cab" role="row"><span role="columnheader">${esc(d.columnas[0])}</span><span aria-hidden="true"></span><span role="columnheader">${esc(d.columnas[1])}</span></div>
        ${d.filas.map(([a, b]) => `<div class="rv-par" role="row"><span class="rv-par-a" role="cell">${esc(a)}</span><span class="rv-par-fl" aria-hidden="true">→</span>${d.codigo ? `<code class="rv-par-b" role="cell">${esc(b)}</code>` : `<span class="rv-par-b" role="cell">${esc(b)}</span>`}</div>`).join('')}
      </div>` : '';
    const tareas = p.hazlo.map((t, i) => {
      const ok = R.tarea(r.id, p.id, i);
      return `<li><label class="rv-tarea${ok ? ' hecha' : ''}"><input type="checkbox" data-tarea="${i}" data-paso-de="${esc(p.id)}" data-de="${esc(r.id)}"${ok ? ' checked' : ''}><span>${esc(t)}</span></label></li>`;
    }).join('');
    const cod = c ? `<div class="rv-cod">
        ${c.preparar ? `<details class="rv-prep"><summary>Primero, la tabla de práctica (cópiala antes)</summary><pre><code>${esc(c.preparar)}</code></pre></details>` : ''}
        <div class="rv-cod-cab"><span>${esc({ python: 'Python', sql: 'SQL', excel: 'Fórmula de Excel', dax: 'DAX (Power BI)', json: 'JSON', texto: 'Plantilla' }[c.lenguaje] || c.lenguaje)}</span>
          <button type="button" class="rv-copiar" data-copiar="${esc(p.id)}">${svg(I.copia, 15)}Copiar</button></div>
        <pre><code>${esc(c.texto)}</code></pre></div>` : '';
    const sal = k.salida || k.salidaEjemplo;
    return `<section class="rp-prac" aria-labelledby="rp-p-${esc(p.id)}">
        <h4 id="rp-p-${esc(p.id)}">Practica lo aprendido</h4>
        <p class="rp-sub">${esc(p.practica)}</p>
        ${d ? `<details class="rp-idea"><summary>${esc(d.titulo)}</summary>${pares}</details>` : ''}
        <div class="rp-prac-fila">
          <div class="rp-prac-col"><p class="rp-prac-t">Hazlo</p><ol class="rv-tareas">${tareas}</ol>${cod}</div>
          <div class="rp-prac-col"><p class="rp-prac-t">Compruébalo</p><p class="rv-txt">${esc(k.texto)}</p>
            ${k.valores ? `<div class="rv-vals">${k.valores.map(([n, v]) => `<div class="rv-val"><b>${esc(v)}</b><span>${esc(n)}</span></div>`).join('')}</div>` : ''}
            ${sal ? `<p class="rv-sal-t">${k.salida ? 'En pantalla sale exactamente:' : 'Ejemplo de lo que sale:'}</p><pre class="rv-sal">${esc(sal)}</pre>` : ''}
            ${k.nota ? `<p class="rv-nota">${esc(k.nota)}</p>` : ''}
            <p class="rv-err-t">Errores típicos</p>
            <ul class="rv-errs">${p.errores.map(([q, x]) => `<li><b>${esc(q)}</b> ${esc(x)}</li>`).join('')}</ul></div>
        </div>
      </section>`;
  }

  function punto(r, p, i, R){
    const n = r.pasos.length, ok = R.hecho(r.id, p.id), e = (r.certificacion || {}).examen;
    const temas = e && e.temas && p.examen ? e.temas.filter(t => p.examen.includes(t.n)) : [];
    const sig = i < n - 1 ? r.pasos[i + 1] : null;
    return `<section class="rp-punto" aria-labelledby="rp-t-${esc(p.id)}">
        <header class="rp-punto-cab">
          <span class="rp-hex grande"><span>${i + 1}</span></span>
          <div><p class="rp-punto-k">Punto ${i + 1} de ${n}${temas.length ? ` · del examen: tema${temas.length > 1 ? 's' : ''} ${temas.map(t => t.n).join(' y ')} (${sumaPeso(temas)} del puntaje)` : ''}</p>
            <h4 id="rp-t-${esc(p.id)}">${esc(p.titulo)}</h4>
            <p class="rp-logro">Al terminar podrás ${esc(p.logro)}</p></div>
        </header>
        <div class="rp-aprende"><p class="rp-sub">Lo que aprendes</p><ul>${p.aprender.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
        <div class="rp-recs">${p.video ? videoPrincipal(p.video) : ''}${p.recurso ? curso(p.recurso) : ''}</div>
        <p class="rp-mira">${esc(p.mira)}</p>
        ${p.enlace ? `<p class="rp-mira">En el Cerebro: <a href="${esc(p.enlace.url)}">${esc(p.enlace.texto)}</a></p>` : ''}
        ${(p.mas || []).length ? `<details class="rp-mas"><summary>Más opciones medidas (${p.mas.length})</summary><ul class="rp-otras">${p.mas.map(otra).join('')}</ul></details>` : ''}
        ${(p.descartados || []).length ? `<details class="rp-mas"><summary>Descartados y por qué (${p.descartados.length})</summary><ul class="rp-desc">${p.descartados.map(x => `<li><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.titulo)}</a><span class="rp-desc-m">${esc(x.canal)} · ${fecha(x.publicado)} · ${num(x.vistas)} vistas · ${num(x.megusta)} me gusta</span><span class="rp-desc-r">${esc(x.razon)}</span></li>`).join('')}</ul></details>` : ''}
        ${practica(r, p, R)}
        <div class="rp-listo-fila">
          <label class="rp-listo${ok ? ' hecha' : ''}"><input type="checkbox" data-paso="${esc(p.id)}" data-de="${esc(r.id)}"${ok ? ' checked' : ''}>
            <span>${ok ? `Punto ${i + 1} aprendido` : `Ya lo aprendí: marcar el punto ${i + 1}`}</span></label>
          ${ok && sig ? `<button type="button" class="rp-seguir" data-estacion="${esc(sig.id)}" data-de="${esc(r.id)}">Seguir con el punto ${i + 2}${svg(I.flecha, 16)}</button>` : ''}
        </div>
      </section>`;
  }

  function html(r, c, D, sel, R){
    const color = COLOR[r.disciplina] || '#06b6d4';
    const idSel = elegido(r, sel, R), i = r.pasos.findIndex(p => p.id === idSel);
    const n = r.pasos.length, hechos = r.pasos.filter(p => R.hecho(r.id, p.id)).length, pct = R.pct(r.id);
    const nombre = R.nombreCorto(r), nb = R.empezada(r.id) ? 'work_nb_ruta_' + r.id : '';
    const toca = r.pasos.find(p => !R.hecho(r.id, p.id));
    return `<li class="ruta rv rp" id="ruta-${esc(r.id)}" style="--d:${color}" role="region" aria-label="Ruta de aprendizaje: ${esc(nombre)}">
      <div class="rp-top">
        <div class="rp-hero">
          <div class="rv-hero-cab">
            <span class="rv-emb">${svg(ICO[r.disciplina] || ICO['Datos'], 28)}</span>
            <div><p class="rv-kick">Ruta de aprendizaje · disciplina ${esc(r.disciplina)}</p><h3 class="rv-tit">${esc(nombre)}</h3></div>
          </div>
          <p class="rv-frase">${esc(r.frase)}</p>
          <div class="rp-hero-datos">
            <p><b>${c.vacantes}</b><span>de las ${D.muestra.n} vacantes la piden</span></p>
            <p><b>${hechos} de ${n}</b><span>puntos aprendidos</span></p>
          </div>
          <span class="avance-barra" role="img" aria-label="${pct} % de la ruta"><i style="width:${pct}%"></i></span>
          <div class="rp-empieza"><p><b>Por dónde empezar.</b> ${esc(r.orden)}</p>${toca ? `<button type="button" class="rp-seguir" data-estacion="${esc(toca.id)}" data-de="${esc(r.id)}">${hechos ? 'Seguir con' : 'Empezar por'} el punto ${r.pasos.indexOf(toca) + 1}: ${esc(toca.titulo)}${svg(I.flecha, 16)}</button>` : ''}</div>
          <div class="rv-oir"><button type="button" class="rv-btn rp-oir" data-escuchar="${esc(r.id)}" aria-pressed="false">${svg(I.oir, 18)}<span>Escuchar la idea</span></button></div>
        </div>
        ${meta(r, R)}
      </div>
      ${c.perfil === 'si' ? '<p class="ruta-perfil">Ya figura en tu perfil, así que en tu % global cuenta completa. Esta ruta sirve para repasarla y demostrarla.</p>' : ''}
      ${camino(r, R, idSel)}
      ${combina(r, c, D, R)}
      ${punto(r, r.pasos[i], i, R)}
      <div class="rv-fin">
        <div><h4>Lo que te llevas al portafolio</h4><p>${esc(r.portafolio)}</p></div>
        <div class="rv-fin-acc">${nb
          ? `<button type="button" class="btn bo bs" data-cuaderno="${esc(nb)}">Abrir mi cuaderno de ${esc(nombre)}</button>`
          : `<button type="button" class="btn bp bs" data-empezar="${esc(r.id)}">Empezar: crear mi cuaderno de ${esc(nombre)}</button>`}
          <span class="ruta-nota">El cuaderno trae una página por punto para pegar tu código, tus resultados y tus apuntes.</span></div>
      </div>
      <p class="rp-fuentes">Medido el ${fecha(r.medido)} en la página de cada video (fecha, vistas, me gusta, duración y capítulos) y de cada curso; las vistas y los me gusta suben cada día. Los videos se eligieron por fecha, me gusta, idioma y por cómo sus capítulos cubren el temario; nadie los vio completos. Lo que piden las vacantes sale de la muestra del ${fecha(D.muestra.fecha)}.</p>
    </li>`;
  }

  return { html };
})();
window.WorkRutaPuntos = WorkRutaPuntos;
