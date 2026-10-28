/* ═══════════════════════════════════════════════════════════════
   18-MUS · Interfaz del Estudio
   ─────────────────────────────────────────────────────────────
   Cuatro zonas en el orden en que se trabaja de verdad:
     1. Pista    — generar la base, añadir/quitar instrumentos, dibujar
     2. Grabar   — micrófono, cadena de voz, tomas
     3. Exportar — WAV · MIDI · stems · proyecto
     4. Puente   — lo que NO se puede hacer acá, con instrucción exacta

   Vive en su propio archivo porque music.js ya lleva las nueve
   pestañas de contenido; mezclarlo lo habría vuelto ilegible.
═══════════════════════════════════════════════════════════════ */
const MUSUI = (() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const toast = m => (window.MUS && MUS.toast ? MUS.toast(m) : console.log(m));

  const K_PROY = 'mus_proy';
  let KB = null;
  let proy = null;
  let sel = null;             // pista seleccionada para editar
  let sonando = false;
  let enBucle = false;
  let medidorTimer = null;
  let tomas = [];             // {id, nombre, seg, vol, pan, mute, compas}

  /* ═══ Utilidades ══════════════════════════════════════════════ */
  const gen = () => (KB.generos || []).find(g => g.id === (proy && proy.generoId)) || (KB.generos || [])[0];
  const mmss = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');

  function guardar() {
    if (!proy) return;
    try { localStorage.setItem(K_PROY, JSON.stringify(proy)); } catch (e) { console.warn('[18-MUS] proyecto no guardado', e); }
  }
  function cargar() {
    try { const v = localStorage.getItem(K_PROY); if (v) proy = JSON.parse(v); } catch (e) { proy = null; }
  }

  /* ═══ Crear / regenerar ═══════════════════════════════════════ */
  function generar(opciones) {
    const o = opciones || {};
    const g = (KB.generos || []).find(x => x.id === (o.generoId || (proy && proy.generoId) || 'reggaeton'));
    const keyPc = o.keyPc != null ? o.keyPc : (proy ? proy.keyPc : 9);
    /* Si cambia el género, la progresión tiene que venir de ESE género.
       Arrastrar la anterior daba vallenatos con progresión de champeta. */
    const cambioGenero = proy && proy.generoId !== g.id;
    const progId = o.progId || (!cambioGenero && proy && proy.progId) || (g.progresiones || [])[0];
    const p = (KB.progresiones || []).find(x => x.id === progId) || (KB.progresiones || [])[0];
    const mode = p.ctx === 'menor' ? 'menor' : 'mayor';
    const est = (KB.estructuras || []).find(e => e.id === g.estructura) || (KB.estructuras || [])[0];
    const progresion = MAUDIO.buildProgression(p.grados, keyPc, mode);

    proy = MSTUDIO.crearProyecto({
      genero: g, keyPc, mode, progId: p.id, progresion,
      bloques: est.bloques, bpm: o.bpm || (g.bpm && g.bpm.tipico) || 95,
      // Solo se conserva el título si lo escribió él. Uno autogenerado
      // ('Idea en Champeta') tiene que seguir al género nuevo, o se
      // exporta un archivo que miente sobre su contenido.
      titulo: (proy && proy.titulo && !/^Idea en /.test(proy.titulo)) ? proy.titulo : ('Idea en ' + g.nombre)
    });
    sel = proy.pistas[0] ? proy.pistas[0].id : null;
    guardar(); render();
    toast('Base generada: ' + proy.pistas.length + ' pistas de ' + g.nombre);
  }

  /* ═══ Transporte ══════════════════════════════════════════════ */
  function tocar() {
    if (sonando) { parar(); return; }
    if (!proy) return;
    enBucle = false;
    const s = MSTUDIO.reproducir(proy, {
      onStep: (paso, abs) => pintarPaso(paso, abs),
      onSection: (secc) => { const e = $('stSecc'); if (e) e.textContent = secc.nombre; },
      onEnd: () => { sonando = false; pintarTransporte(); }
    });
    if (!s) { toast('No hay nada que tocar: todas las pistas están vacías o en silencio'); return; }
    sonando = true; pintarTransporte();
  }
  function bucle() {
    if (!proy) return;
    if (sonando && enBucle) { parar(); return; }
    MSTUDIO.parar();
    enBucle = true; sonando = true;
    MSTUDIO.bucle(proy, 0, paso => pintarPaso(paso));
    pintarTransporte();
    const e = $('stSecc'); if (e) e.textContent = 'Bucle de 1 compás';
  }
  function parar() {
    MSTUDIO.parar(); sonando = false; enBucle = false;
    pintarTransporte();
    document.querySelectorAll('.pz-col.on').forEach(x => x.classList.remove('on'));
  }
  function pintarTransporte() {
    const b = $('stPlay'), l = $('stLoop');
    if (b) { b.textContent = (sonando && !enBucle) ? '⏹ Parar' : '▶ Tocar canción'; b.classList.toggle('playing', sonando && !enBucle); }
    if (l) { l.textContent = (sonando && enBucle) ? '⏹ Parar bucle' : '🔁 Bucle 1 compás'; l.classList.toggle('on', sonando && enBucle); }
  }
  function pintarPaso(paso, abs) {
    document.querySelectorAll('.pz-col.on').forEach(x => x.classList.remove('on'));
    document.querySelectorAll('.pz-col[data-s="' + paso + '"]').forEach(x => x.classList.add('on'));
    if (abs != null) {
      const e = $('stPos');
      if (e) e.textContent = 'compás ' + (Math.floor(abs / 16) + 1) + ' · ' + mmss((abs / 4) * (60 / proy.bpm));
    }
  }

  /* ═══ Render principal ════════════════════════════════════════ */
  function render() {
    const el = $('pane-st'); if (!el) return;
    if (!proy) { el.innerHTML = pantallaInicial(); return; }
    el.innerHTML =
      bloqueCabecera() +
      bloqueTransporte() +
      '<div class="mus-h2">Pistas</div>' +
      '<p class="mus-sub">Cada pista es un <b>patrón de 16 casillas</b> que se repite, igual que el step sequencer de FL Studio. ' +
      'Las pistas melódicas no guardan notas fijas sino <b>grados</b>: dibujás una forma y el motor la traduce al acorde de cada compás. ' +
      'Por eso no podés equivocarte de nota.</p>' +
      '<div id="stPistas">' + proy.pistas.map(pistaHTML).join('') + '</div>' +
      bloqueAgregar() +
      bloqueGrabacion() +
      bloqueExportar() +
      bloquePuente();
    pintarTransporte();
  }

  function pantallaInicial() {
    const gs = KB.generos || [];
    return '<div class="mus-h2">Estudio</div>' +
      '<p class="mus-sub">Acá se arma la canción entera: la base instrumental, la voz grabada con su cadena de efectos, ' +
      'la mezcla y la exportación. Elegí un género y se genera una base completa que después podés editar entera.</p>' +
      '<div class="st-arranque">' +
        '<div class="st-arranque-t">Empezá por acá</div>' +
        '<div class="gchips">' + gs.map(g =>
          '<button class="gchip" onclick="MUSUI.generarDesde(\'' + g.id + '\')">' + g.emoji + ' ' + esc(g.nombre) + '</button>').join('') +
        '</div>' +
        '<p class="st-arranque-p">Se crea una pista completa del género con bajo, armonía, percusión y melodía. ' +
        'Nada queda fijo: podés añadir instrumentos, quitar, cambiar el patrón y regrabar.</p>' +
      '</div>';
  }

  function bloqueCabecera() {
    const g = gen();
    const progs = KB.progresiones || [];
    return '<div class="st-cab">' +
      '<input class="st-titulo" value="' + esc(proy.titulo) + '" onchange="MUSUI.setTitulo(this.value)" placeholder="Título de la canción">' +
      '<div class="st-cab-r">' +
        '<label class="lc"><span>Género</span><select onchange="MUSUI.generarDesde(this.value)">' +
          (KB.generos || []).map(x => '<option value="' + x.id + '"' + (x.id === proy.generoId ? ' selected' : '') + '>' + esc(x.emoji + ' ' + x.nombre) + '</option>').join('') +
        '</select></label>' +
        '<label class="lc"><span>Tonalidad</span><select onchange="MUSUI.setKey(this.value)">' +
          MAUDIO.NOTES.map((n, i) => {
            const bem = MAUDIO.NOTES_FLAT[i];
            return '<option value="' + i + '"' + (i === proy.keyPc ? ' selected' : '') + '>' + (bem === n ? n : n + ' / ' + bem) + '</option>';
          }).join('') +
        '</select></label>' +
        '<label class="lc"><span>Progresión</span><select onchange="MUSUI.setProg(this.value)">' +
          progs.map(p => '<option value="' + p.id + '"' + (p.id === proy.progId ? ' selected' : '') + '>' + esc(p.nombre) + '</option>').join('') +
        '</select></label>' +
        '<label class="lc"><span>BPM</span><input type="number" min="50" max="220" value="' + proy.bpm + '" onchange="MUSUI.setBpm(this.value)"></label>' +
      '</div>' +
      '<div class="st-acordes">' + (proy.progresion || []).map(a =>
        '<span class="st-ac">' + esc(a.label) + '<i>' + esc(a.roman) + '</i></span>').join('') +
      '<span class="st-est">' + (proy.bloques || []).length + ' secciones · ' +
        (proy.bloques || []).reduce((a, b) => a + b[1], 0) + ' compases · ' +
        mmss(((proy.bloques || []).reduce((a, b) => a + b[1], 0) * 16 / 4) * (60 / proy.bpm)) + '</span></div>' +
    '</div>';
  }

  function bloqueTransporte() {
    return '<div class="st-trans">' +
      '<button class="mus-btn primary" id="stPlay" onclick="MUSUI.tocar()">▶ Tocar canción</button>' +
      '<button class="mus-btn" id="stLoop" onclick="MUSUI.bucle()">🔁 Bucle 1 compás</button>' +
      '<span class="st-pos" id="stPos">compás 1 · 0:00</span>' +
      '<span class="st-secc" id="stSecc">—</span>' +
    '</div>';
  }

  /* ── Una pista ─────────────────────────────────────────────── */
  function pistaHTML(p) {
    const meta = MSTUDIO.instDe(p.inst);
    const abierta = p.id === sel;
    return '<div class="pz' + (abierta ? ' abierta' : '') + (p.mute ? ' muda' : '') + '" data-p="' + p.id + '">' +
      '<div class="pz-h" onclick="MUSUI.selPista(\'' + p.id + '\')">' +
        '<span class="pz-e">' + meta.emoji + '</span>' +
        '<span class="pz-n">' + esc(p.nombre) + '</span>' +
        '<span class="pz-i">' + esc(meta.nombre) + '</span>' +
        '<button class="pz-b' + (p.mute ? ' act' : '') + '" title="Silenciar" onclick="event.stopPropagation();MUSUI.mute(\'' + p.id + '\')">M</button>' +
        '<button class="pz-b' + (p.solo ? ' act sol' : '') + '" title="Solo" onclick="event.stopPropagation();MUSUI.solo(\'' + p.id + '\')">S</button>' +
        '<input class="pz-v" type="range" min="0" max="1.4" step="0.01" value="' + p.vol + '" title="Volumen"' +
          ' onclick="event.stopPropagation()" oninput="MUSUI.vol(\'' + p.id + '\',this.value)">' +
        '<input class="pz-p" type="range" min="-1" max="1" step="0.05" value="' + p.pan + '" title="Panorama L/R"' +
          ' onclick="event.stopPropagation()" oninput="MUSUI.pan(\'' + p.id + '\',this.value)">' +
        '<span class="pz-x">' + (abierta ? '▾' : '▸') + '</span>' +
      '</div>' +
      (abierta ? cuerpoPista(p) : '') +
    '</div>';
  }

  function cuerpoPista(p) {
    return '<div class="pz-b2">' +
      '<div class="pz-ctl">' +
        '<label class="lc"><span>Instrumento</span><select onchange="MUSUI.setInst(\'' + p.id + '\',this.value)">' +
          MSTUDIO.INSTRUMENTOS.map(i => '<option value="' + i.id + '"' + (i.id === p.inst ? ' selected' : '') + '>' + i.emoji + ' ' + esc(i.nombre) + '</option>').join('') +
        '</select></label>' +
        (p.modo !== 'perc' ? '<label class="lc"><span>Grados</span><select onchange="MUSUI.setModo(\'' + p.id + '\',this.value)">' +
          '<option value="acorde"' + (p.modo === 'acorde' ? ' selected' : '') + '>del acorde (siempre consonante)</option>' +
          '<option value="escala"' + (p.modo === 'escala' ? ' selected' : '') + '>de la escala (más movimiento)</option>' +
        '</select></label>' : '') +
        (p.modo !== 'perc' ? '<label class="lc"><span>Octava</span><select onchange="MUSUI.setOct(\'' + p.id + '\',this.value)">' +
          [-2, -1, 0, 1, 2].map(o => '<option value="' + o + '"' + (o === (p.oct || 0) ? ' selected' : '') + '>' + (o > 0 ? '+' + o : o) + '</option>').join('') +
        '</select></label>' : '') +
        '<label class="lc"><span>Entra desde</span><select onchange="MUSUI.setDens(\'' + p.id + '\',this.value)">' +
          '<option value="0.25"' + (p.densidadMin <= 0.25 ? ' selected' : '') + '>la intro (siempre)</option>' +
          '<option value="0.45"' + (p.densidadMin > 0.25 && p.densidadMin <= 0.45 ? ' selected' : '') + '>el verso</option>' +
          '<option value="0.65"' + (p.densidadMin > 0.45 && p.densidadMin <= 0.65 ? ' selected' : '') + '>el pre-coro</option>' +
          '<option value="0.85"' + (p.densidadMin > 0.65 ? ' selected' : '') + '>solo el coro</option>' +
        '</select></label>' +
        '<div class="pz-acc">' +
          '<button class="mus-btn sm" onclick="MUSUI.dup(\'' + p.id + '\')">⧉ Duplicar</button>' +
          '<button class="mus-btn sm" onclick="MUSUI.mover(\'' + p.id + '\',-1)">↑</button>' +
          '<button class="mus-btn sm" onclick="MUSUI.mover(\'' + p.id + '\',1)">↓</button>' +
          '<button class="mus-btn sm ghost" onclick="MUSUI.limpiar(\'' + p.id + '\')">Vaciar</button>' +
          '<button class="mus-btn sm ghost" onclick="MUSUI.borrar(\'' + p.id + '\')">🗑 Quitar</button>' +
        '</div>' +
      '</div>' +
      (p.modo === 'perc' ? rejillaPerc(p) : rejillaGrados(p)) +
    '</div>';
  }

  function rejillaPerc(p) {
    let h = '<div class="pz-grid"><div class="pz-fila"><div class="pz-lbl">golpe</div><div class="pz-cells">';
    for (let s = 0; s < 16; s++) {
      const on = p.celdas.includes(s + 1);
      h += '<button class="pz-c' + (on ? ' hit' : '') + (s % 4 === 0 ? ' beat' : '') + '" ' +
           'onclick="MUSUI.celda(\'' + p.id + '\',' + s + ')" aria-label="paso ' + (s + 1) + '"></button>';
    }
    h += '</div></div>' + regla() + '</div>';
    return h;
  }

  /* Rejilla de grados: 8 filas. Los nombres cambian según el modo,
     porque "3ª del acorde" y "grado 3 de la escala" no son lo mismo. */
  function rejillaGrados(p) {
    const NOM_AC = ['1ª (raíz)', '3ª', '5ª', '8ª', '10ª', '12ª', '15ª', '17ª'];
    const NOM_ES = ['1 tónica', '2', '3', '4', '5', '6', '7', '8 (octava)'];
    const nombres = p.modo === 'escala' ? NOM_ES : NOM_AC;
    let h = '<div class="pz-grid">';
    for (let g = 7; g >= 0; g--) {
      h += '<div class="pz-fila"><div class="pz-lbl">' + nombres[g] + '</div><div class="pz-cells">';
      for (let s = 0; s < 16; s++) {
        const on = p.notas.some(n => n.s === s && n.g === g);
        h += '<button class="pz-c' + (on ? ' hit mel' : '') + (s % 4 === 0 ? ' beat' : '') + '" ' +
             'onclick="MUSUI.nota(\'' + p.id + '\',' + s + ',' + g + ')"></button>';
      }
      h += '</div></div>';
    }
    h += regla() + '</div>';
    return h;
  }

  function regla() {
    let h = '<div class="pz-fila pz-regla"><div class="pz-lbl"></div><div class="pz-cells">';
    for (let s = 0; s < 16; s++) h += '<div class="pz-col" data-s="' + s + '">' + (s % 4 === 0 ? (s / 4 + 1) : '·') + '</div>';
    return h + '</div></div>';
  }

  function bloqueAgregar() {
    return '<div class="st-add">' +
      '<span>Añadir instrumento:</span>' +
      MSTUDIO.INSTRUMENTOS.map(i =>
        '<button class="st-addb" onclick="MUSUI.add(\'' + i.id + '\')" title="' + esc(i.nombre) + '">' + i.emoji + ' ' + esc(i.nombre) + '</button>').join('') +
    '</div>';
  }

  /* ═══ Grabación ═══════════════════════════════════════════════ */
  function bloqueGrabacion() {
    const est = (KB.estudio || {});
    const activo = MREC.activo();
    const P = MREC.params();
    return '<div class="mus-h2">Grabar voz</div>' +
      '<div class="mus-warn">🎧 <b>Con auriculares, siempre.</b> Si la pista sale por parlantes, el micrófono la vuelve a captar y ya no hay forma de separarlas.</div>' +
      '<div class="st-rec">' +
        '<div class="st-rec-top">' +
          '<button class="mus-btn' + (activo ? ' on' : ' primary') + '" onclick="MUSUI.mic()">' + (activo ? '🎙 Micrófono abierto' : '🎙 Abrir micrófono') + '</button>' +
          (activo ? '<button class="mus-btn" onclick="MUSUI.medir()">📏 Medir el cuarto</button>' +
                    '<button class="mus-btn rec" id="stRec" onclick="MUSUI.grabar()">⏺ Grabar</button>' +
                    '<span class="st-umbral">puerta: ' + P.puertaUmbralDb.toFixed(0) + ' dB</span>' : '') +
          (activo ? '<div class="vu"><div class="vu-b" id="vuBar"></div><span id="vuTxt">—</span></div>' : '') +
        '</div>' +
        (activo ? cadenaHTML(est, P) : '<div class="st-rec-tips">' +
          (est.antes || []).map(t => '<div class="st-tip">' + esc(t) + '</div>').join('') + '</div>') +
        (tomas.length ? '<div class="st-tomas">' + tomas.map(tomaHTML).join('') + '</div>' : '') +
      '</div>';
  }

  function cadenaHTML(est, P) {
    const presets = (est.presets || []);
    return '<div class="st-presets"><span>Preset:</span>' +
        presets.map(p => '<button class="st-pre" onclick="MUSUI.preset(\'' + p.id + '\')" title="' + esc(p.por) + '">' + esc(p.nombre) + '</button>').join('') +
      '</div>' +
      '<div class="st-cadena">' + (est.cadena || []).map(m => {
        const on = !!P[m.id];
        return '<div class="ef' + (on ? ' on' : '') + '">' +
          '<button class="ef-h" onclick="MUSUI.ef(\'' + m.id + '\')">' +
            '<span class="ef-e">' + m.emoji + '</span><span class="ef-n">' + esc(m.nombre) + '</span>' +
            '<span class="ef-sw">' + (on ? 'ON' : 'off') + '</span></button>' +
          '<div class="ef-q">' + esc(m.que) + '</div>' +
          '<details class="ef-mas"><summary>cómo funciona · cuándo · ojo</summary>' +
            '<p><b>Cómo:</b> ' + esc(m.como) + '</p>' +
            '<p><b>Cuándo:</b> ' + esc(m.cuando) + '</p>' +
            '<p class="ef-ojo">' + esc(m.ojo) + '</p></details>' +
          slidersDe(m.id, P) +
        '</div>';
      }).join('') + '</div>';
  }

  function slidersDe(id, P) {
    const S = (clave, lbl, min, max, paso) =>
      '<label class="ef-s"><span>' + lbl + '</span>' +
      '<input type="range" min="' + min + '" max="' + max + '" step="' + paso + '" value="' + P[clave] + '"' +
      ' oninput="MUSUI.par(\'' + clave + '\',this.value)"></label>';
    if (id === 'puerta')  return S('puertaUmbralDb', 'umbral dB', -70, -20, 1);
    if (id === 'comp')    return S('compTh', 'umbral dB', -40, -5, 1) + S('compRa', 'ratio', 1.5, 12, 0.5);
    if (id === 'eq')      return S('eqBajo', 'barro 300 Hz', -8, 4, 0.5) + S('eqMedio', 'presencia 3 kHz', -6, 8, 0.5) + S('eqAlto', 'aire 10 kHz', -4, 8, 0.5);
    if (id === 'deesser') return S('deessAmt', 'cantidad', 0, 14, 0.5);
    if (id === 'sat')     return S('satAmt', 'calor', 0, 1, 0.02);
    if (id === 'doble')   return S('dobleAmt', 'cantidad', 0, 1, 0.02);
    if (id === 'rev')     return S('revAmt', 'cantidad', 0, 0.8, 0.01);
    if (id === 'delay')   return S('delayAmt', 'cantidad', 0, 0.6, 0.01);
    return '';
  }

  function tomaHTML(t) {
    return '<div class="toma">' +
      '<span class="toma-n">🎤 ' + esc(t.nombre) + '</span>' +
      '<span class="toma-d">' + t.seg.toFixed(1) + ' s</span>' +
      '<button class="mus-btn sm" onclick="MUSUI.oirToma(\'' + t.id + '\')">▶ Oír</button>' +
      '<button class="mus-btn sm ghost" onclick="MUSUI.borrarToma(\'' + t.id + '\')">🗑</button>' +
    '</div>';
  }

  /* ═══ Exportar ════════════════════════════════════════════════ */
  function bloqueExportar() {
    return '<div class="mus-h2">Exportar</div>' +
      '<p class="mus-sub">Cada formato tiene su destinatario. El MIDI es el importante para vos: ' +
      '<b>lleva las notas, no el sonido</b> — se abre en FL Studio y cada pista cae en su instrumento, ' +
      'lista para cambiar el sintetizador por un acordeón de verdad.</p>' +
      '<div class="st-exp">' +
        expCard('midi', '🎹', 'MIDI', 'Las notas. Se abre en FL Studio con cada pista en su instrumento General MIDI.', 'Para seguir produciendo') +
        expCard('wav24', '💿', 'WAV 24 bits', 'La mezcla completa, sin pérdida. Lo que mandás a masterizar.', 'Para el máster') +
        expCard('wav16', '📀', 'WAV 16 bits', 'La mezcla en calidad CD. Más liviano.', 'Para mandar la maqueta') +
        expCard('stems', '🎚️', 'Stems', 'Un WAV por instrumento. Lo que le entregás al artista que compra la canción.', 'Para vender o mezclar aparte') +
        expCard('proy', '💾', 'Proyecto', 'El estado editable en JSON, para volver mañana o pasarlo a otro equipo.', 'Para no perder el trabajo') +
      '</div>' +
      '<div class="st-prog" id="stProg" hidden><div class="st-prog-b"><i id="stProgB"></i></div><span id="stProgT"></span></div>' +
      '<div id="stMed"></div>';
  }
  function expCard(id, ic, t, d, para) {
    return '<button class="expc" onclick="MUSUI.exportar(\'' + id + '\')">' +
      '<div class="expc-i">' + ic + '</div><div class="expc-t">' + esc(t) + '</div>' +
      '<div class="expc-d">' + esc(d) + '</div><div class="expc-p">' + esc(para) + '</div></button>';
  }

  /* ═══ Puente ══════════════════════════════════════════════════ */
  function bloquePuente() {
    const ps = (KB.estudio && KB.estudio.puente) || [];
    return '<div class="mus-h2">Lo que no se puede hacer acá</div>' +
      '<p class="mus-sub">Ser honesto sobre el límite vale más que fingir que no existe. ' +
      'Para cada cosa: <b>por qué</b> no cabe en un navegador, <b>dónde</b> hacerla y <b>cómo</b> volver con el resultado.</p>' +
      '<div class="puentes">' + ps.map(p =>
        '<div class="pt' + (p.dentro === 'parcial' ? ' parcial' : '') + '">' +
          '<div class="pt-h"><b>' + esc(p.titulo) + '</b>' +
            '<span class="pt-b">' + (p.dentro === 'parcial' ? 'parcial acá' : 'fuera del navegador') + '</span></div>' +
          '<div class="pt-r"><b>Por qué:</b> ' + esc(p.porque) + '</div>' +
          '<div class="pt-r"><b>Dónde:</b> ' + esc(p.donde) + '</div>' +
          '<div class="pt-r"><b>Cómo:</b> ' + esc(p.como) + '</div>' +
          '<div class="pt-o">' + esc(p.ojo) + '</div>' +
          '<button class="mus-btn sm" onclick="MUSUI.promptPuente(\'' + p.id + '\')">📋 Copiar instrucción con los datos de esta canción</button>' +
        '</div>').join('') + '</div>';
  }

  /* ═══ Acciones ════════════════════════════════════════════════ */
  const pistaDe = id => proy.pistas.find(p => p.id === id);
  function refrescar() { guardar(); render(); }

  const acciones = {
    generarDesde: gid => generar({ generoId: gid, nuevoTitulo: !proy }),
    setTitulo: v => { proy.titulo = v; guardar(); },
    setKey: v => { regenerarProgresion({ keyPc: +v }); },
    setProg: v => { regenerarProgresion({ progId: v }); },
    setBpm: v => { proy.bpm = Math.max(50, Math.min(220, +v || 95)); MREC.set('bpm', proy.bpm); guardar(); render(); },
    selPista: id => { sel = (sel === id ? null : id); render(); },
    mute: id => { const p = pistaDe(id); p.mute = !p.mute; refrescar(); },
    solo: id => { const p = pistaDe(id); p.solo = !p.solo; refrescar(); },
    vol: (id, v) => { const p = pistaDe(id); p.vol = +v; MSTUDIO.actualizarCanal(id, +v, null); guardar(); },
    pan: (id, v) => { const p = pistaDe(id); p.pan = +v; MSTUDIO.actualizarCanal(id, null, +v); guardar(); },
    setInst: (id, v) => { const p = pistaDe(id); const m = MSTUDIO.instDe(v);
      p.inst = v; p.nombre = m.nombre;
      // Cambiar entre percusión y melódico obliga a cambiar de rejilla.
      if (m.tipo === 'perc' && p.modo !== 'perc') { p.modo = 'perc'; p.celdas = p.celdas.length ? p.celdas : [1, 5, 9, 13]; }
      if (m.tipo !== 'perc' && p.modo === 'perc') { p.modo = m.modo || 'acorde'; p.base = m.base || 48; if (!p.notas.length) p.notas = [{ s: 0, g: 0, d: 4 }]; }
      refrescar(); },
    setModo: (id, v) => { pistaDe(id).modo = v; refrescar(); },
    setOct: (id, v) => { pistaDe(id).oct = +v; guardar(); },
    setDens: (id, v) => { pistaDe(id).densidadMin = +v; guardar(); render(); },
    celda: (id, s) => { const p = pistaDe(id); const on = MSTUDIO.toggleCelda(p, s); guardar(); render();
      if (on) MAUDIO.hit(p.inst, 0.9); },
    nota: (id, s, g) => { const p = pistaDe(id); const on = MSTUDIO.toggleNota(p, s, g, 2); guardar(); render();
      if (on) previewNota(p, g); },
    add: iid => { const p = MSTUDIO.addPista(proy, iid);
      if (p.modo === 'perc') p.celdas = [1, 5, 9, 13]; else p.notas = [{ s: 0, g: 0, d: 4 }];
      sel = p.id; refrescar(); toast(p.nombre + ' añadido'); },
    dup: id => { const c = MSTUDIO.duplicarPista(proy, id); if (c) { sel = c.id; refrescar(); } },
    mover: (id, d) => { MSTUDIO.moverPista(proy, id, d); refrescar(); },
    limpiar: id => { MSTUDIO.limpiarPista(pistaDe(id)); refrescar(); },
    borrar: id => { const p = pistaDe(id);
      if (!confirm('¿Quitar la pista «' + p.nombre + '»?')) return;
      MSTUDIO.delPista(proy, id); if (sel === id) sel = null; refrescar(); },
    tocar, bucle, parar
  };

  function previewNota(p, g) {
    const acorde = (proy.progresion || [])[0];
    if (!acorde) return;
    MAUDIO.unlock();
    const midi = p.modo === 'escala'
      ? p.base + proy.keyPc + (proy.mode === 'menor' ? [0,2,3,5,7,8,10] : [0,2,4,5,7,9,11])[g % 7] + 12 * Math.floor(g / 7) + 12 * (p.oct || 0)
      : p.base + MAUDIO.chordMidis(acorde.pc, acorde.qual, 0)[g % 3] + 12 * Math.floor(g / 3) + 12 * (p.oct || 0);
    MAUDIO.playInst(p.inst, MAUDIO.ac().currentTime + 0.02, { midi, dur: 0.5, vel: 0.9 });
  }

  /** Cambiar tonalidad o progresión no debe borrar lo dibujado: las
   *  pistas guardan grados, así que basta con recalcular los acordes. */
  function regenerarProgresion(cambios) {
    Object.assign(proy, cambios);
    const p = (KB.progresiones || []).find(x => x.id === proy.progId);
    if (!p) return;
    proy.mode = p.ctx === 'menor' ? 'menor' : 'mayor';
    proy.progresion = MAUDIO.buildProgression(p.grados, proy.keyPc, proy.mode)
      .map(a => ({ pc: a.pc, qual: a.qual, roman: a.roman, label: a.label }));
    guardar(); render();
  }

  /* ═══ Micrófono ═══════════════════════════════════════════════ */
  async function mic() {
    if (MREC.activo()) { MREC.cerrar(); pararMedidor(); render(); return; }
    try {
      MAUDIO.unlock();
      await MREC.iniciar({});
      MREC.set('bpm', proy ? proy.bpm : 95);
      MREC.monitor(true);
      // Preset acorde al género, para no arrancar en plano.
      const pre = ((KB.estudio || {}).presets || []).find(p => p.gen === proy.generoId);
      if (pre) MREC.aplicarPreset(pre.v);
      arrancarMedidor(); render();
      toast('Micrófono abierto. Poné los auriculares antes de grabar.');
    } catch (e) {
      toast('No se pudo abrir el micrófono: ' + (e.message || e));
    }
  }
  function arrancarMedidor() {
    pararMedidor();
    medidorTimer = setInterval(() => {
      const n = MREC.nivel(), b = $('vuBar'), t = $('vuTxt');
      if (!b) return;
      const pct = Math.max(0, Math.min(100, (n.rms + 60) / 60 * 100));
      b.style.width = pct + '%';
      b.className = 'vu-b' + (n.pico > -3 ? ' alto' : n.rms > -30 ? ' ok' : '');
      if (t) t.textContent = n.rms <= -98 ? '—' : n.rms.toFixed(0) + ' dB' + (n.pico > -1 ? ' ⚠ saturando' : '');
    }, 60);
  }
  function pararMedidor() { if (medidorTimer) { clearInterval(medidorTimer); medidorTimer = null; } }

  async function medir() {
    toast('Callate 2 segundos… midiendo el ruido del cuarto');
    try {
      const r = await MREC.medirCuarto(2);
      toast('Ruido de fondo ' + r.fondoDb + ' dB · puerta calibrada en ' + r.umbralDb + ' dB');
      render();
    } catch (e) { toast('No se pudo medir: ' + e.message); }
  }

  async function grabar() {
    if (!MREC.activo()) { toast('Abrí el micrófono primero'); return; }
    if (MREC.estaGrabando()) {
      const buf = MREC.detener();
      const b = $('stRec'); if (b) { b.textContent = '⏺ Grabar'; b.classList.remove('rec-on'); }
      if (!buf) { toast('No se capturó nada'); return; }
      const id = 'tk' + Date.now().toString(36);
      await MSTUDIO.guardarToma(id, buf);
      tomas.push({ id, nombre: 'Toma ' + (tomas.length + 1), seg: buf.duration, vol: 1, pan: 0, mute: false });
      render();
      toast('Toma guardada · ' + buf.duration.toFixed(1) + ' s');
      return;
    }
    await MREC.grabar();
    const b = $('stRec'); if (b) { b.textContent = '⏹ Detener'; b.classList.add('rec-on'); }
    toast('Grabando…');
  }

  async function oirToma(id) {
    const buf = await MSTUDIO.leerToma(id);
    if (!buf) { toast('No se encontró el audio de esa toma'); return; }
    MREC.reproducirPorCadena(buf);
    toast('Sonando con la cadena de efectos aplicada');
  }
  async function borrarTomaUI(id) {
    if (!confirm('¿Borrar esta toma? No se puede deshacer.')) return;
    await MSTUDIO.borrarToma(id);
    tomas = tomas.filter(t => t.id !== id);
    render();
  }

  function preset(pid) {
    const p = ((KB.estudio || {}).presets || []).find(x => x.id === pid);
    if (!p) return;
    MREC.aplicarPreset(p.v);
    render();
    toast(p.nombre + ' · ' + p.por);
  }
  function ef(id) { const P = MREC.params(); MREC.set(id, P[id] ? 0 : 1); render(); }
  function par(clave, v) { MREC.set(clave, +v); }

  /* ═══ Exportar ════════════════════════════════════════════════ */
  function progreso(pct, txt) {
    const c = $('stProg'), b = $('stProgB'), t = $('stProgT');
    if (!c) return;
    c.hidden = pct == null;
    if (b) b.style.width = Math.round((pct || 0) * 100) + '%';
    if (t) t.textContent = txt || '';
  }

  async function exportar(tipo) {
    if (!proy) return;
    const nombre = MEXPORT.limpiarNombre(proy.titulo);
    const s = MSTUDIO.aEventos(proy);
    if (!s.eventos.length) { toast('No hay nada que exportar'); return; }

    if (tipo === 'proy') {
      MEXPORT.descargar(new Blob([JSON.stringify(proy, null, 2)], { type: 'application/json' }), nombre + '.musproy.json');
      toast('Proyecto descargado');
      return;
    }
    if (tipo === 'midi') {
      MEXPORT.descargar(MEXPORT.aMidi(s.eventos, proy.bpm, proy.titulo), nombre + '.mid');
      toast('MIDI listo · abrilo en FL Studio: cada pista trae su instrumento');
      return;
    }

    MAUDIO.unlock();
    progreso(0, 'Preparando…');
    try {
      const extras = [];
      for (const t of tomas) {
        if (t.mute) continue;
        const buf = await MSTUDIO.leerToma(t.id);
        if (buf) extras.push({ nombre: t.nombre, buffer: await MREC.renderConCadena(buf), vol: t.vol, pan: t.pan, offsetSeg: 0 });
      }

      if (tipo === 'stems') {
        progreso(0.05, 'Renderizando stems…');
        const lista = await MEXPORT.renderStems({ eventos: s.eventos, bpm: proy.bpm, totalSteps: s.totalSteps, extras });
        for (let i = 0; i < lista.length; i++) {
          progreso(0.1 + 0.9 * (i / lista.length), 'Guardando ' + lista[i].nombre + '…');
          MEXPORT.descargar(MEXPORT.bufferAWav(lista[i].buffer, 24), nombre + '_' + lista[i].nombre + '.wav');
          await new Promise(r => setTimeout(r, 250));   // el navegador limita descargas seguidas
        }
        progreso(null);
        toast(lista.length + ' stems descargados');
        return;
      }

      const bits = tipo === 'wav16' ? 16 : 24;
      const buf = await MEXPORT.render({
        eventos: s.eventos, bpm: proy.bpm, totalSteps: s.totalSteps, extras,
        onProgreso: p => progreso(p * 0.9, 'Renderizando… ' + Math.round(p * 100) + '%')
      });
      progreso(0.95, 'Escribiendo WAV…');
      const med = MEXPORT.medir(buf);
      MEXPORT.descargar(MEXPORT.bufferAWav(buf, bits), nombre + '_' + bits + 'bit.wav');
      progreso(null);
      mostrarMedicion(med, buf.duration);
    } catch (e) {
      progreso(null);
      toast('Falló la exportación: ' + (e.message || e));
      console.error(e);
    }
  }

  function mostrarMedicion(med, dur) {
    const el = $('stMed'); if (!el) return;
    const aviso = med.recortado
      ? '<b>⚠️ Está recortando.</b> Bajá el volumen de las pistas más fuertes: subir el máster no lo arregla, solo lo tapa.'
      : med.pico > -1
        ? 'Vas muy al filo. Dejá un poco más de margen si esto va a masterizarse.'
        : 'Margen sano. Un servicio de masterización tiene con qué trabajar.';
    el.innerHTML = '<div class="st-med"><b>Exportado · ' + mmss(dur) + '</b>' +
      '<span>pico ' + med.pico + ' dBFS</span><span>RMS ' + med.rms + ' dB</span>' +
      '<div class="st-med-a">' + aviso + '</div></div>';
  }

  /* ═══ Puente · instrucción con los datos reales ═══════════════ */
  function promptPuente(id) {
    const p = ((KB.estudio || {}).puente || []).find(x => x.id === id);
    if (!p || !proy) return;
    const g = gen();
    const acordes = (proy.progresion || []).map(a => a.label).join(' – ');
    const txt =
'TAREA: ' + p.titulo + '\n' +
'════════════════════════════════════════\n\n' +
'DATOS DE MI CANCIÓN\n' +
'· Título: ' + proy.titulo + '\n' +
'· Género: ' + g.nombre + '\n' +
'· Tempo: ' + proy.bpm + ' BPM\n' +
'· Tonalidad: ' + MAUDIO.noteName(proy.keyPc) + ' ' + proy.mode + '\n' +
'· Progresión: ' + acordes + '\n' +
'· Estructura: ' + (proy.bloques || []).map(b => b[0] + ' (' + b[1] + ')').join(' → ') + '\n' +
'· Instrumentación actual: ' + proy.pistas.map(x => x.nombre).join(', ') + '\n\n' +
'POR QUÉ NO LO HAGO EN EL MÓDULO\n' + p.porque + '\n\n' +
'DÓNDE HACERLO\n' + p.donde + '\n\n' +
'PASOS\n' + p.como + '\n\n' +
'CUIDADO CON\n' + p.ojo + '\n\n' +
'LO QUE NECESITO DE VOS\n' +
'Guiame paso a paso con esta canción concreta: qué exporto desde el módulo,\n' +
'qué ajustes pongo en la herramienta, cómo sé que quedó bien, y qué traigo\n' +
'de vuelta. Explicámelo sin jerga — soy visual y todavía estoy aprendiendo.\n';
    if (window.MUS && MUS.copiar) MUS.copiar(txt, 'Instrucción copiada — pegala en Claude o Gemini ✓');
    else navigator.clipboard.writeText(txt).then(() => toast('Copiado ✓'));
  }

  /* ═══ Init ════════════════════════════════════════════════════ */
  function init(kb) {
    KB = kb;
    cargar();
    if (proy && (!proy.pistas || !proy.progresion)) proy = null;   // proyecto viejo o corrupto
    render();
  }

  return Object.assign({
    init, render, mic, medir, grabar, preset, ef, par, exportar, promptPuente,
    oirToma, borrarToma: borrarTomaUI
  }, acciones);
})();

window.MUSUI = MUSUI;
