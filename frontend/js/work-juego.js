/* 14-WORK · Centro de mando (25-nov-2026; reemplaza la constelación del 24-nov, que Miguel rechazó). Diseño aprobado
   en el lienzo «Centro de mando 14-WORK · propuesta». Solo lee: data/rol-objetivo.json (lo pasa WorkRol) y work_rutas
   (vía WorkRutas). No escribe nada. Reglas a la vista: 10 XP por estación hecha; un nivel cada 100 XP; el % de la
   temporada es WorkRutas.global() sobre la muestra de vacantes; las tareas de «Hazlo» cuentan como actividad, no como XP. */
const WorkJuego = (function(){
  const XP_PASO = 10, XP_NIVEL = 100, NIVELES = 11, PASOS_NIVEL_DISC = 5;
  const HITO = { 1: 'Aprendiz', 2: 'Explorador', 4: 'Practicante', 6: 'Constructor', 8: 'Integrador', 10: 'Arquitecto de procesos', 11: 'Maestro de rutas' };
  const rango = n => { let r = HITO[1]; for (let i = 1; i <= n; i++) if (HITO[i]) r = HITO[i]; return r; };
  const DISC = ['IA', 'Automatización', 'Datos', 'Procesos', 'Personas', 'Negocio'];
  const COLOR = { 'IA': '#A493FF', 'Automatización': '#5CE1FF', 'Datos': '#5EF0C0', 'Procesos': '#FFC861', 'Personas': '#FF8FB1', 'Negocio': '#FFB45C' };
  const ICO = {
    'IA': 'M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
    'Automatización': 'M13 2 4 14h7l-1 8 9-12h-7l1-8z',
    'Datos': 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
    'Procesos': 'M4 4h6v6H4zM14 14h6v6h-6zM7 10v3a2 2 0 0 0 2 2h5',
    'Personas': 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a6 6 0 0 1 12 0v1M16 3.5a4 4 0 0 1 0 7.5M22 21v-1a6 6 0 0 0-4-5.7',
    'Negocio': 'M3 8h18v12H3zM8 8V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v3M3 13h18',
  };
  const LOGROS = [
    ['primer-paso', 'Primer paso', 'Marca una estación de cualquier ruta.', 'M4 20h4l3-6 3 3 6-11'],
    ['en-marcha', 'En marcha', 'Empieza una ruta y crea su cuaderno.', 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5M9 7h6'],
    ['racha', 'Racha de 3 días', 'Avanza 3 días seguidos (estaciones o tareas).', 'M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z'],
    ['ruta-completa', 'Ruta completa', 'Termina todas las estaciones de una ruta.', 'M5 21V4M5 4h11l-2 4 2 4H5'],
    ['cinco-frentes', 'Cinco frentes', 'Avanza en 5 rutas distintas.', 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM15.5 8.5l-2 5-5 2 2-5z'],
    ['cerebro-ia', 'Cerebro IA', 'Avanza en las 4 rutas de IA.', ICO['IA']],
  ];
  const ESTADO = { si: ['si', 'en tu perfil'], no: ['no', 'no figura en tu perfil'], progreso: ['pr', 'en progreso'] };
  const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  const esc = s => { const d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; };
  const dia = t => { const d = t instanceof Date ? t : new Date(t); return isNaN(d) ? '' : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const fecha = iso => { const d = new Date(iso.length === 10 ? iso + 'T12:00:00' : iso); return isNaN(d) ? '' : `${d.getDate()}-${MES[d.getMonth()]}-${d.getFullYear()}`; };
  const svg = (d, w, extra = '') => `<svg width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${extra}><path d="${d}"></path></svg>`;

  function estado(D){
    const R = window.WorkRutas;
    const regs = R.registros().filter(r => r.hecho);
    const pasos = regs.filter(r => r.tipo === 'paso');
    const rutas = R.rutas();
    const totalPasos = rutas.reduce((s, r) => s + r.pasos.length, 0);
    const xp = pasos.length * XP_PASO;
    const nivel = Math.min(Math.floor(xp / XP_NIVEL) + 1, NIVELES);
    const conPaso = new Set(pasos.map(p => p.ruta));
    // Actividad: días con alguna casilla marcada (estación o tarea), por la fecha en que se marcó.
    const porDia = {};
    regs.filter(r => r.tipo === 'paso' || r.tipo === 'tarea').forEach(r => { const d = dia(r.updated); if (d) porDia[d] = (porDia[d] || 0) + 1; });
    const hoy = new Date(); hoy.setHours(12, 0, 0, 0);
    const dias = [];
    for (let i = 27; i >= 0; i--) { const t = new Date(hoy.getTime() - i * 864e5); dias.push({ d: dia(t), n: porDia[dia(t)] || 0 }); }
    let racha = 0;
    for (let i = dias.length - 1; i >= 0; i--) { if (dias[i].n) racha++; else if (i === dias.length - 1) continue; else break; }
    const semana = dias.slice(-7).reduce((s, x) => s + x.n, 0);
    const ordenados = Object.keys(porDia).sort();
    let mejor = ordenados.length ? 1 : 0, cur = mejor;
    for (let i = 1; i < ordenados.length; i++) {
      cur = (new Date(ordenados[i] + 'T12:00:00') - new Date(ordenados[i - 1] + 'T12:00:00')) / 864e5 === 1 ? cur + 1 : 1;
      mejor = Math.max(mejor, cur);
    }
    const ganados = {
      'primer-paso': pasos.length >= 1,
      'en-marcha': rutas.some(r => R.empezada(r.id)),
      'racha': mejor >= 3,
      'ruta-completa': rutas.some(r => R.pct(r.id) === 100),
      'cinco-frentes': conPaso.size >= 5,
      'cerebro-ia': ['ia-generativa', 'prompts', 'agentes', 'ml'].every(id => conPaso.has(id)),
    };
    const enMarcha = rutas.filter(r => (R.empezada(r.id) || R.pct(r.id) > 0) && R.pct(r.id) < 100);
    return { R, rutas, pasos: pasos.length, totalPasos, xp, nivel, conPaso, ganados, dias, racha, semana, enMarcha, global: R.global(D) };
  }

  const siguiente = (R, r) => r.pasos.find(p => !R.hecho(r.id, p.id));
  const compDe = (D, r) => D.competencias.find(c => c.nombre === r.competencia);

  /* Tres misiones: la ruta en marcha tocada hace menos tiempo, la de mayor salto y la nueva que más vacantes piden. */
  function misiones(D, E){
    const R = E.R, usadas = new Set(), out = [];
    const ultimaVez = id => R.registros().filter(x => x.ruta === id).reduce((m, x) => (x.updated > m ? x.updated : m), '');
    const marcha = E.enMarcha.slice().sort((a, b) => ultimaVez(b.id).localeCompare(ultimaVez(a.id)))[0];
    if (marcha) out.push({ r: marcha, etiqueta: 'En marcha', nota: `Ruta al ${R.pct(marcha.id)} % · ${marcha.pasos.length} estaciones`, fuerte: true });
    const sig = E.global.siguiente && R.ruta(E.global.siguiente.ruta);
    if (sig) out.push({ r: sig, etiqueta: 'Mayor salto', nota: `Su ruta lleva la temporada a ${E.global.siguiente.pct} %` });
    const nuevas = D.competencias.filter(c => c.perfil !== 'si').map(c => R.rutaDe(c.nombre)).filter(r => r && R.pct(r.id) === 0 && !R.empezada(r.id));
    nuevas.forEach(r => out.push({ r, etiqueta: 'Nueva ruta', nota: `La piden ${(compDe(D, r) || {}).vacantes} de ${D.muestra.n} vacantes` }));
    const lista = [];
    for (const m of out) { if (usadas.has(m.r.id) || !siguiente(R, m.r)) continue; usadas.add(m.r.id); lista.push(m); if (lista.length === 3) break; }
    if (!lista.some(m => m.fuerte) && lista[0]) lista[0].fuerte = true;
    return lista.map(m => {
      const p = siguiente(R, m.r), i = m.r.pasos.indexOf(p), c = COLOR[m.r.disciplina] || '#5CE1FF';
      const recurso = p.video ? `${p.video.canal} · video` : p.recurso ? p.recurso.proveedor.split(' (')[0] : p.enlace ? p.enlace.texto.replace(/\p{Extended_Pictographic}️?\s?/gu, '') : '';
      return `<article class="cm-mision${m.fuerte ? ' fuerte' : ''}" style="--d:${c}">
          <div class="cm-mision-cab">
            <span class="cm-ico">${svg(ICO[m.r.disciplina] || ICO['Datos'], 24)}</span>
            <div><p class="cm-etq">${esc(m.etiqueta)}</p><p class="cm-mision-ruta">${esc(R.nombreCorto(m.r))}</p></div>
            <span class="cm-xp">+${XP_PASO} XP</span>
          </div>
          <p class="cm-mision-paso">Estación ${i + 1} · ${esc(p.titulo)}</p>
          <p class="cm-mision-logro">Al terminar podrás ${esc(p.logro || '')}</p>
          ${recurso ? `<p class="cm-mision-rec">Con: ${esc(recurso)}</p>` : ''}
          <div class="cm-mision-pie"><button type="button" class="cm-btn${m.fuerte ? ' fuerte' : ''}" data-ir="${esc(m.r.id)}" data-paso="${esc(p.id)}">Iniciar misión</button><span>${esc(m.nota)}</span></div>
        </article>`;
    }).join('');
  }

  function disciplinas(D, E){
    const R = E.R;
    return DISC.map(nombre => {
      const rs = E.rutas.filter(r => r.disciplina === nombre);
      if (!rs.length) return '';
      const c = COLOR[nombre];
      const comps = rs.map(r => ({ r, c: compDe(D, r) })).filter(x => x.c).sort((a, b) => b.c.vacantes - a.c.vacantes);
      const enPerfil = comps.filter(x => x.c.perfil === 'si').length, enProg = comps.filter(x => x.c.perfil === 'progreso');
      const total = rs.reduce((s, r) => s + r.pasos.length, 0), hechos = rs.reduce((s, r) => s + r.pasos.filter(p => R.hecho(r.id, p.id)).length, 0);
      const nivel = Math.floor(hechos / PASOS_NIVEL_DISC);
      const filas = comps.map(({ r, c: k }) => {
        const [cls, txt] = ESTADO[k.perfil] || ESTADO.no, p = R.pct(r.id);
        return `<li><button type="button" class="cm-hab" data-ir="${esc(r.id)}" aria-label="${esc(`${k.nombre}: ${txt}; la piden ${k.vacantes} de ${D.muestra.n} vacantes; ruta al ${p} %. Abre la ruta.`)}">
            <span class="cm-punto ${cls}" aria-hidden="true"></span><span class="cm-hab-n">${esc(R.nombreCorto(r))}</span>${p ? `<span class="cm-hab-p">${p} %</span>` : ''}<span class="cm-hab-v">${k.vacantes} / ${D.muestra.n}</span></button></li>`;
      }).join('');
      return `<article class="cm-disc" style="--d:${c}">
          <div class="cm-disc-cab">
            <span class="cm-ico">${svg(ICO[nombre], 22)}</span>
            <div class="cm-disc-t"><p class="cm-disc-n">${esc(nombre)}</p><p class="cm-etq">${enPerfil} de ${comps.length} en tu perfil${enProg.length ? ` · ${enProg.map(x => esc(R.nombreCorto(x.r).toLowerCase())).join(', ')} en progreso` : ''}</p></div>
            <div class="cm-disc-nv"><p class="cm-etq">Nivel</p><p>${nivel}</p></div>
          </div>
          <div class="cm-disc-barra"><span class="cm-barra" role="img" aria-label="${hechos} de ${total} estaciones"><i style="width:${total ? Math.round(hechos / total * 100) : 0}%"></i></span><span>${hechos} / ${total} estaciones</span></div>
          <ul class="cm-habs">${filas}</ul>
        </article>`;
    }).join('');
  }

  function pase(E){
    let h = '';
    for (let i = 1; i <= NIVELES; i++) {
      const cls = i === E.nivel ? ' actual' : i < E.nivel ? ' pasado' : HITO[i] ? ' hito' : '';
      h += `<li class="cm-tier${cls}"${i === E.nivel ? ' aria-current="step"' : ''}><span class="cm-hex"><span>${i}</span></span><span class="cm-tier-t">${esc(HITO[i] || '')}</span><span class="cm-tier-xp">${(i - 1) * XP_NIVEL} XP</span></li>`;
    }
    return h;
  }

  function emblema(n){
    return `<svg class="cm-emblema" width="112" height="124" viewBox="0 0 112 124" aria-hidden="true">
        <defs><linearGradient id="cmGE" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5CE1FF"/><stop offset="1" stop-color="#A493FF"/></linearGradient>
        <linearGradient id="cmGF" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16243C"/><stop offset="1" stop-color="#0B1222"/></linearGradient></defs>
        <path d="M56 4 104 32v60L56 120 8 92V32Z" fill="url(#cmGF)" stroke="url(#cmGE)" stroke-width="3"/>
        <path d="M56 16 94 38v48L56 108 18 86V38Z" fill="none" stroke="rgba(148,190,255,.22)" stroke-width="1.5"/>
        <path d="M34 70 56 56l22 14" fill="none" stroke="url(#cmGE)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M34 86 56 72l22 14" fill="none" stroke="${n >= 6 ? 'url(#cmGE)' : 'rgba(148,190,255,.28)'}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="56" y="44" text-anchor="middle" fill="#E8F0FF" font-family="Archivo, sans-serif" font-weight="800" font-size="20">${n}</text>
      </svg>`;
  }

  function render(D){
    const el = document.getElementById('workJuego');
    const R = window.WorkRutas;
    if (!el || !D || !R || !R.rutas().length) return;
    const E = estado(D), M = D.muestra;
    const max = E.nivel === NIVELES, enNivel = max ? XP_NIVEL : E.xp % XP_NIVEL;
    const seg = Array.from({ length: 10 }, (_, i) => `<i class="${i < Math.floor(enNivel / 10) ? 'on' : ''}"></i>`).join('');
    const g = E.global.pct, sig = E.global.siguiente, kSig = sig && compDe(D, R.ruta(sig.ruta));
    const hoyN = E.dias[E.dias.length - 1].n;
    const celdas = E.dias.map((x, i) => `<span class="cm-dia n${Math.min(x.n, 4)}${i === E.dias.length - 1 ? ' hoy' : ''}" title="${esc(fecha(x.d))}: ${x.n} casilla${x.n === 1 ? '' : 's'}"></span>`).join('');
    const logros = LOGROS.map(([id, nombre, como, ico]) => {
      const ok = E.ganados[id];
      return `<li class="cm-logro${ok ? ' ok' : ''}"><span class="cm-medalla">${svg(ico, 28)}</span><span class="cm-logro-n">${esc(nombre)}</span><span class="cm-logro-c">${ok ? 'Desbloqueado' : esc(como)}</span></li>`;
    }).join('');
    el.innerHTML = `
      <header class="cm-cab">
        <div><p class="cm-kick">14-WORK · Centro de mando</p><h2 class="cm-tit">Temporada 1 <span>·</span> ${esc(D.rol)}</h2></div>
        <p class="cm-fuente">Tu avance se guarda en este navegador y, con sesión iniciada, en tu cuenta. Rol medido en ${M.n} vacantes reales (${esc(M.fuente.split(',')[0])}, ${esc(fecha(M.fecha))}).</p>
      </header>
      <section class="cm-estado" aria-label="Tu estado">
        <article class="cm-card cm-rango">
          ${emblema(E.nivel)}
          <div class="cm-rango-t">
            <p class="cm-etq">Rango</p>
            <p class="cm-rango-n">${esc(rango(E.nivel))} <span>Nivel ${E.nivel}</span></p>
            <div class="cm-seg" role="img" aria-label="${max ? 'Nivel máximo' : `${enNivel} de ${XP_NIVEL} XP hacia el nivel ${E.nivel + 1}`}">${seg}</div>
            <p class="cm-etq"><b>${E.xp} XP</b>${max ? ' · nivel máximo' : ` · ${XP_NIVEL - enNivel} para el nivel ${E.nivel + 1}`} · ${E.pasos} de ${E.totalPasos} estaciones · ${E.enMarcha.length} ruta${E.enMarcha.length === 1 ? '' : 's'} en marcha</p>
          </div>
        </article>
        <article class="cm-card cm-temp">
          <p class="cm-etq">Progreso de la temporada</p>
          <div class="cm-temp-fila"><p class="cm-temp-pct">${g} %</p><p class="cm-temp-txt">de lo que piden las ${M.n} vacantes ya lo cubre tu perfil o tus rutas</p></div>
          <span class="cm-temp-barra" role="img" aria-label="${g} % de 100 %"><i style="width:${g}%"></i></span>
          <div class="cm-temp-pie"><span>0 %</span><span>Meta de la temporada: 100 %</span></div>
        </article>
        ${sig ? `<article class="cm-card cm-salto">
          <p class="cm-etq">Tu mayor salto</p>
          <p class="cm-salto-n">${esc(sig.competencia)}</p>
          <p class="cm-salto-t">Terminar su ruta sube la temporada de <b>${g} %</b> a <b>${sig.pct} %</b>. La piden ${kSig ? kSig.vacantes : '—'} de las ${M.n} vacantes.</p>
          <button type="button" class="cm-btn violeta" data-ir="${esc(sig.ruta)}">Ver su ruta</button>
        </article>` : ''}
      </section>
      <section class="cm-panel" aria-labelledby="cmPaseT">
        <div class="cm-sec-cab"><h3 id="cmPaseT">Pase de temporada</h3><p>Cada estación de cualquier ruta da ${XP_PASO} XP. Cada ${XP_NIVEL} XP subes un nivel.</p></div>
        <div class="cm-pase-scroll" tabindex="0" role="region" aria-label="Pase de temporada: 11 niveles; se desliza a los lados"><ol class="cm-pase">${pase(E)}</ol></div>
      </section>
      <section aria-labelledby="cmMisT">
        <div class="cm-sec-cab"><h3 id="cmMisT">Misiones disponibles</h3><p>La siguiente estación real de tus rutas. Cada una termina en algo que produces.</p></div>
        <div class="cm-misiones">${misiones(D, E)}</div>
      </section>
      <section aria-labelledby="cmDiscT">
        <div class="cm-sec-cab"><h3 id="cmDiscT">Disciplinas</h3><p>Las 25 habilidades del rol en 6 disciplinas. Cada una sube un nivel cada ${PASOS_NIVEL_DISC} estaciones.</p></div>
        <div class="cm-discs">${disciplinas(D, E)}</div>
        <p class="cm-leyenda"><span class="si">En tu perfil</span><span class="no">No figura en tu perfil</span><span class="pr">En progreso</span><span>A la derecha: cuántas de las ${M.n} vacantes la piden. Clic en una habilidad abre su ruta.</span></p>
      </section>
      <section class="cm-fila2">
        <article class="cm-panel cm-logros" aria-labelledby="cmLogT"><h3 id="cmLogT">Vitrina de logros</h3><ul>${logros}</ul></article>
        <article class="cm-panel cm-act" aria-labelledby="cmActT">
          <div class="cm-sec-cab"><h3 id="cmActT">Actividad</h3><p>Últimos 28 días</p></div>
          <div class="cm-dias" role="img" aria-label="${E.dias.filter(x => x.n).length} de los últimos 28 días con avance">${celdas}</div>
          <div class="cm-act-n"><div><p>${E.racha}</p><span>día${E.racha === 1 ? '' : 's'} de racha</span></div><div><p>${E.semana}</p><span>casillas esta semana</span></div></div>
          <p class="cm-act-t">${hoyN ? `Hoy marcaste ${hoyN} casilla${hoyN === 1 ? '' : 's'}.` : 'La casilla de hoy se enciende con tu primera marca del día.'}</p>
        </article>
      </section>
      <details class="cm-como"><summary>Cómo se calcula</summary><p>Cada estación marcada da ${XP_PASO} XP y cada ${XP_NIVEL} XP subes de nivel (hay ${NIVELES}); el rango es solo el nombre del nivel. Una disciplina sube un nivel cada ${PASOS_NIVEL_DISC} estaciones hechas de sus rutas. La actividad cuenta estaciones y tareas de «Hazlo» por la fecha en que las marcaste; si desmarcas algo, sale. El % de la temporada pesa cada habilidad por cuántas de las ${M.n} vacantes de la muestra (${esc(fecha(M.fecha))}) la piden: las que figuran en tu perfil cuentan completas y las demás con lo que llevas de su ruta. «En tu perfil» es la lista del radar de 5-JOB: si algo no es cierto, el % cambia. Una temporada nueva empieza cuando se rehace la muestra de vacantes.</p></details>`;
  }

  function init(){
    const el = document.getElementById('workJuego');
    if (!el) return;
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-ir]');
      if (b && window.WorkRol && WorkRol.abrir) WorkRol.abrir(b.dataset.ir, b.dataset.paso);
    });
  }

  return { init, render };
})();
window.WorkJuego = WorkJuego;
document.addEventListener('DOMContentLoaded', () => WorkJuego.init());
