/* 14-WORK · Vista didáctica de una ruta (25-nov-2026). Solo pinta: arriba la idea en una frase y para qué sirve; un
   mapa de estaciones; y la estación elegida en 4 bloques (entiéndelo con algo que ya conoces, míralo, hazlo,
   compruébalo). El avance lo lee y lo guarda WorkRutas; los clics los atiende WorkRol. */
const WorkRutaVista = (function(){
  const COLOR = { 'IA': '#A493FF', 'Automatización': '#5CE1FF', 'Datos': '#5EF0C0', 'Procesos': '#FFC861', 'Personas': '#FF8FB1', 'Negocio': '#FFB45C' };
  const ICO = {
    'IA': 'M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
    'Automatización': 'M13 2 4 14h7l-1 8 9-12h-7l1-8z',
    'Datos': 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
    'Procesos': 'M4 4h6v6H4zM14 14h6v6h-6zM7 10v3a2 2 0 0 0 2 2h5',
    'Personas': 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a6 6 0 0 1 12 0v1M16 3.5a4 4 0 0 1 0 7.5M22 21v-1a6 6 0 0 0-4-5.7',
    'Negocio': 'M3 8h18v12H3zM8 8V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v3M3 13h18',
  };
  const XP = 10;   // lo mismo que cuenta el panel de juego por estación hecha
  const svg = (d, w = 20, extra = '') => `<svg width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${extra}><path d="${d}"></path></svg>`;
  const I_OK = 'M5 12.5 10 17 19 7';
  const I_PLAY = 'M8 5v14l11-7z';
  const I_OIR = 'M11 5 6 9H3v6h3l5 4V5zM16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12';
  const I_COPIA = 'M9 9h11v11H9zM5 15H4V4h11v1';

  function esc(s){ const d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  const ext = u => /^https?:/.test(u) ? ' target="_blank" rel="noopener"' : '';

  /* Estación que se muestra: la elegida; si no, la primera sin hacer; si todas están hechas, la última. */
  function elegida(r, sel, R){
    if (sel && r.pasos.some(p => p.id === sel)) return sel;
    const p = r.pasos.find(s => !R.hecho(r.id, s.id));
    return (p || r.pasos[r.pasos.length - 1]).id;
  }

  function hoja(h){
    const cols = h.columnas.length;
    const plantilla = `grid-template-columns:34px repeat(${cols},minmax(0,1fr))`;
    const cab = `<div class="rv-hoja-f rv-hoja-cab" style="${plantilla}"><span></span>${h.columnas.map(c => `<span>${esc(c)}</span>`).join('')}</div>`;
    const filas = h.filas.map((f, i) => `<div class="rv-hoja-f${i === h.resaltar ? ' rv-hoja-res' : ''}${i === 0 ? ' rv-hoja-tit' : ''}" style="${plantilla}"><span class="rv-hoja-n">${i + 1}</span>${f.map(x => `<span>${esc(x)}</span>`).join('')}</div>`).join('');
    const etiqueta = h.filas.map(f => f.join(' ')).join('; ');
    return `<div class="rv-hoja" role="img" aria-label="Hoja de cálculo de ejemplo: ${esc(etiqueta)}">${cab}${filas}</div>`;
  }

  function idea(p){
    const d = p.idea;
    const filas = d.filas.map(([a, b]) => `<div class="rv-par" role="row"><span class="rv-par-a" role="cell">${esc(a)}</span><span class="rv-par-fl" aria-hidden="true">→</span>${d.codigo ? `<code class="rv-par-b" role="cell">${esc(b)}</code>` : `<span class="rv-par-b" role="cell">${esc(b)}</span>`}</div>`).join('');
    return `<article class="rv-b rv-b-idea">
        <p class="rv-b-n"><span>1</span>${esc(d.titulo)}</p>
        <div class="rv-idea">
          ${p.hoja ? hoja(p.hoja) : ''}
          <div class="rv-pares" role="table" aria-label="${esc(d.columnas[0])} y ${esc(d.columnas[1])}">
            <div class="rv-par rv-par-cab" role="row"><span role="columnheader">${esc(d.columnas[0])}</span><span aria-hidden="true"></span><span role="columnheader">${esc(d.columnas[1])}</span></div>
            ${filas}
          </div>
        </div>
      </article>`;
  }

  function mira(p){
    const v = p.video ? `<a class="rv-video" href="${esc(p.video.url)}" target="_blank" rel="noopener">
          <span class="rv-play">${svg(I_PLAY, 22, ' fill="currentColor" stroke="none"')}</span>
          <span class="rv-video-t">${esc(p.video.titulo)}</span>
          <span class="rv-video-c">${esc(p.video.canal)} · YouTube</span></a>
        <p class="rv-rec">Elegido por su canal y su título; los minutos que se citan son los capítulos que publica el video. No lo revisamos completo.</p>` : '';
    const rec = p.recurso ? `<p class="rv-rec">${p.video ? 'Para practicar' : 'Recurso'}: <a href="${esc(p.recurso.url)}" target="_blank" rel="noopener">${esc(p.recurso.nombre)}</a> · ${esc(p.recurso.proveedor)}</p>` : '';
    const enl = p.enlace ? `<p class="rv-rec">En el Cerebro: <a href="${esc(p.enlace.url)}"${ext(p.enlace.url)}>${esc(p.enlace.texto)}</a></p>` : '';
    return `<article class="rv-b rv-b-mira">
        <p class="rv-b-n"><span>2</span>Míralo</p>
        ${v}
        <p class="rv-txt">${esc(p.mira)}</p>
        ${rec}${enl}
      </article>`;
  }

  function hazlo(r, p, R){
    const tareas = p.hazlo.map((t, i) => {
      const ok = R.tarea(r.id, p.id, i);
      return `<li><label class="rv-tarea${ok ? ' hecha' : ''}"><input type="checkbox" data-tarea="${i}" data-paso-de="${esc(p.id)}" data-de="${esc(r.id)}"${ok ? ' checked' : ''}><span>${esc(t)}</span></label></li>`;
    }).join('');
    const c = p.codigo;
    const cod = c ? `<div class="rv-cod">
          ${c.preparar ? `<details class="rv-prep"><summary>Primero, la tabla de práctica (cópiala antes)</summary><pre><code>${esc(c.preparar)}</code></pre></details>` : ''}
          <div class="rv-cod-cab"><span>${esc({ python: 'Python', sql: 'SQL', excel: 'Fórmula de Excel', dax: 'DAX (Power BI)', json: 'JSON', texto: 'Plantilla' }[c.lenguaje] || c.lenguaje)}</span>
            <button type="button" class="rv-copiar" data-copiar="${esc(p.id)}">${svg(I_COPIA, 15)}Copiar</button></div>
          <pre><code>${esc(c.texto)}</code></pre>
        </div>` : '';
    return `<article class="rv-b rv-b-haz">
        <p class="rv-b-n"><span>3</span>Hazlo</p>
        <ol class="rv-tareas">${tareas}</ol>
        ${cod}
      </article>`;
  }

  function comprueba(r, p, R, sig, sigId){
    const c = p.comprueba, ok = R.hecho(r.id, p.id);
    const valores = c.valores ? `<div class="rv-vals">${c.valores.map(([n, v]) => `<div class="rv-val"><b>${esc(v)}</b><span>${esc(n)}</span></div>`).join('')}</div>` : '';
    const sal = c.salida || c.salidaEjemplo;
    return `<article class="rv-b rv-b-comp">
        <p class="rv-b-n"><span>4</span>Compruébalo</p>
        <p class="rv-txt">${esc(c.texto)}</p>
        ${valores}
        ${sal ? `<p class="rv-sal-t">${c.salida ? 'En pantalla sale exactamente:' : 'Ejemplo de lo que sale:'}</p><pre class="rv-sal">${esc(sal)}</pre>` : ''}
        ${c.nota ? `<p class="rv-nota">${esc(c.nota)}</p>` : ''}
        <p class="rv-err-t">Errores típicos</p>
        <ul class="rv-errs">${p.errores.map(([q, k]) => `<li><b>${esc(q)}</b> ${esc(k)}</li>`).join('')}</ul>
        <label class="rv-listo${ok ? ' hecha' : ''}"><input type="checkbox" data-paso="${esc(p.id)}" data-de="${esc(r.id)}"${ok ? ' checked' : ''}>
          <span>${ok ? `Estación hecha · +${XP} XP` : `Ya lo comprobé: marcar la estación como hecha (+${XP} XP)`}</span></label>
        ${ok && sigId ? `<button type="button" class="rv-btn rv-seguir" data-estacion="${esc(sigId)}" data-de="${esc(r.id)}">Seguir con la ${sig}</button>` : ''}
      </article>`;
  }

  /* Certificación (25-nov): la de referencia y la oficial gratis, o lo que hay cuando no existe. Cada «gratis» y cada
     precio se comprobó en la página del emisor (scripts/verificar-rutas.mjs). */
  const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const fechaCorta = iso => { const [a, m, d] = (iso || '').split('-').map(Number); return a ? `${d}-${MES[m - 1]}-${a}` : ''; };
  const enlace = (url, txt) => `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(txt)}</a>`;
  function cert(r, R){
    const c = r.certificacion;
    if (!c) return '';
    const ref = c.referencia, g = c.gratis, k = c.camino;
    const nota = ((R.datos() || {}).d || {}).certificacionesNota;
    const izq = ref
      ? `<p class="rv-cert-n">${enlace(ref.url, ref.nombre)}</p><p class="rv-cert-e">${esc(ref.emisor)}</p><p class="rv-cert-c">${esc(ref.costo)}</p>`
      : `<p class="rv-cert-c">${esc(c.referenciaNota)}</p>`;
    const der = g
      ? `<p class="rv-cert-n">${enlace(g.url, g.nombre)}</p><p class="rv-cert-e">${esc(g.emisor)} · ${esc(g.tipo)}</p>${g.nota ? `<p class="rv-cert-c">${esc(g.nota)}</p>` : ''}`
      : `<p class="rv-cert-c">${esc(k && k.texto)}</p>${k && k.url ? `<p class="rv-cert-c">${enlace(k.url, 'Ver la opción más cercana')}</p>` : ''}`;
    return `<section class="rv-cert" aria-labelledby="rv-c-${esc(r.id)}">
        <h4 id="rv-c-${esc(r.id)}">Certificación</h4>
        <div class="rv-cert-fila">
          <article class="rv-cert-b"><p class="rv-cert-k">La de referencia</p>${izq}</article>
          <article class="rv-cert-b${g ? ' ok' : ''}"><p class="rv-cert-k">${g ? 'La oficial gratis' : 'Oficial y gratis: no la hay'}</p>${der}</article>
        </div>
        <p class="rv-cert-pie">«De referencia» quiere decir que la emite el dueño de la herramienta o del estándar; no está medida como la más pedida. Revisado el ${esc(fechaCorta(c.revisado))} en la página de cada emisor; los precios cambian por país y por fecha.${nota ? ' ' + esc(nota) : ''}</p>
      </section>`;
  }

  function html(r, c, D, sel, R){
    const color = COLOR[r.disciplina] || '#06b6d4';
    const idSel = elegida(r, sel, R);
    const n = r.pasos.length, hechos = r.pasos.filter(p => R.hecho(r.id, p.id)).length, pct = R.pct(r.id);
    const toca = (r.pasos.find(p => !R.hecho(r.id, p.id)) || {}).id;
    const empresas = [...new Set(D.vacantes.filter(v => v.competencias.includes(c.nombre)).map(v => v.empresa))];
    const nombres = empresas.slice(0, 6).join(', ') + (empresas.length > 6 ? ` y ${empresas.length - 6} más` : '');

    const mapa = r.pasos.map((p, i) => {
      const ok = R.hecho(r.id, p.id), es = p.id === idSel;
      const estado = ok ? 'Hecha' : p.id === toca ? 'Te toca' : 'Después';
      return `<li><button type="button" class="rv-e${ok ? ' is-hecha' : ''}${p.id === toca ? ' is-toca' : ''}${es ? ' is-sel' : ''}" data-estacion="${esc(p.id)}" data-de="${esc(r.id)}" aria-pressed="${es}">
          <span class="rv-e-cab"><span class="rv-e-n">${ok ? svg(I_OK, 18) : i + 1}</span><span class="rv-e-st">${estado}</span></span>
          <b>${esc(p.titulo)}</b>
          <small>Al terminar podrás ${esc(p.logro)}</small></button></li>`;
    }).join('');

    const i = r.pasos.findIndex(p => p.id === idSel), p = r.pasos[i];
    const sig = i < n - 1 ? 'estación ' + (i + 2) : '';
    const nb = R.empezada(r.id) ? 'work_nb_ruta_' + r.id : '';
    const nombre = R.nombreCorto(r);

    return `<li class="ruta rv" id="ruta-${esc(r.id)}" style="--d:${color}" role="region" aria-label="Ruta de estudio: ${esc(nombre)}">
      <div class="rv-top">
        <div class="rv-hero">
          <div class="rv-hero-cab">
            <span class="rv-emb">${svg(ICO[r.disciplina] || ICO['Datos'], 28)}</span>
            <div><p class="rv-kick">Disciplina ${esc(r.disciplina)} · ${n} estaciones · +${n * XP} XP</p><h3 class="rv-tit">${esc(nombre)}</h3></div>
          </div>
          <p class="rv-frase">${esc(r.frase)}</p>
          <p class="rv-que">${esc(r.queEs)}</p>
          <div class="rv-oir"><button type="button" class="rv-btn" data-escuchar="${esc(r.id)}" aria-pressed="false">${svg(I_OIR, 18)}<span>Escuchar la idea</span></button><span>La lee la voz de tu navegador.</span></div>
        </div>
        <div class="rv-usos">
          <h4>Para qué te sirve en el trabajo</h4>
          <ul>${r.usos.map(u => `<li>${esc(u)}</li>`).join('')}</ul>
          <p class="rv-piden">La piden ${c.vacantes} de las ${D.muestra.n} vacantes de la muestra, entre ellas ${esc(nombres)}.</p>
          <div class="rv-av"><span class="avance-barra"><i style="width:${pct}%"></i></span><span>${hechos} de ${n} estaciones · ${pct} %</span></div>
        </div>
      </div>
      ${c.perfil === 'si' ? '<p class="ruta-perfil">Ya figura en tu perfil, así que en tu % global cuenta completa. Esta ruta sirve para repasarla y demostrarla con algo que puedas enseñar en una entrevista.</p>' : ''}
      <section class="rv-mapa" aria-label="Mapa de la ruta"><h4>El mapa de la ruta</h4><ol class="rv-ests">${mapa}</ol></section>
      <section class="rv-det" aria-labelledby="rv-t-${esc(p.id)}">
        <div class="rv-det-cab"><h4 id="rv-t-${esc(p.id)}">Estación ${i + 1} · ${esc(p.titulo)}</h4><p>Al terminar podrás ${esc(p.logro)}</p></div>
        <div class="rv-fila">${idea(p)}${mira(p)}</div>
        <div class="rv-fila">${hazlo(r, p, R)}${comprueba(r, p, R, sig, i < n - 1 ? r.pasos[i + 1].id : '')}</div>
      </section>
      ${cert(r, R)}
      <div class="rv-fin">
        <div><h4>Lo que te llevas al portafolio</h4><p>${esc(r.portafolio)}</p></div>
        <div class="rv-fin-acc">${nb
          ? `<button type="button" class="btn bo bs" data-cuaderno="${esc(nb)}">Abrir mi cuaderno de ${esc(nombre)}</button>`
          : `<button type="button" class="btn bp bs" data-empezar="${esc(r.id)}">Empezar: crear mi cuaderno de ${esc(nombre)}</button>`}
          <span class="ruta-nota">El cuaderno trae una página por estación para pegar tu código, tus resultados y tus apuntes.</span></div>
      </div>
    </li>`;
  }

  /* Lo que lee «Escuchar la idea»: la frase y los usos. */
  const textoOir = r => `${R_nombre(r)}. ${r.frase} Para qué te sirve en el trabajo: ${r.usos.join(' ')}`;
  const R_nombre = r => r.competencia.split(' (')[0];

  return { html, textoOir, elegida };
})();
window.WorkRutaVista = WorkRutaVista;
