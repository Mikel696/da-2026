/* ═══════════════════════════════════════════════════════════════
   18-MUS · Proyecto editable · pistas, loops y mezcla
   ─────────────────────────────────────────────────────────────
   El modelo copia deliberadamente el de FL Studio, que Miguel ya
   maneja: un PATRÓN de 16 casillas por pista, y una lista de
   SECCIONES donde ese patrón suena. Cero conceptos nuevos.

   La decisión importante — las pistas melódicas no guardan notas
   absolutas, guardan GRADOS. Se dibuja una forma sobre una rejilla
   y el motor la traduce al acorde que toque en cada compás. Para
   alguien que no sabe armonía esto es lo que cambia todo: no puede
   equivocarse de nota. Dibuje lo que dibuje, va a estar en tono.

   Dos modos de grado:
   · 'acorde' → los grados son notas DEL acorde (0=fundamental,
     1=tercera, 2=quinta…). Siempre consonante. Para bajos y armonías.
   · 'escala' → los grados son los 7 de la tonalidad. Da más movimiento
     y permite notas de paso. Para melodías y riffs.

   Cada pista tiene su propio canal (ganancia + panorama) que se crea
   a demanda y se enruta con MAUDIO.withDest, así el volumen es volumen
   de verdad y no un truco escalando la velocidad de las notas.
═══════════════════════════════════════════════════════════════ */
const MSTUDIO = (() => {
  'use strict';

  /* ── Paleta: lo que se puede añadir como pista ──────────────── */
  const INSTRUMENTOS = [
    { id:'kick',     nombre:'Bombo',       emoji:'🥁', tipo:'perc' },
    { id:'snare',    nombre:'Caja',        emoji:'🪘', tipo:'perc' },
    { id:'clap',     nombre:'Palmas',      emoji:'👏', tipo:'perc' },
    { id:'hat',      nombre:'Hi-hat',      emoji:'🎩', tipo:'perc' },
    { id:'perc',     nombre:'Percusión',   emoji:'🪇', tipo:'perc' },
    { id:'clave',    nombre:'Clave',       emoji:'🪵', tipo:'perc' },
    { id:'bajo',     nombre:'Bajo',        emoji:'🎸', tipo:'mel', base:36, modo:'acorde' },
    { id:'808',      nombre:'808',         emoji:'🔊', tipo:'mel', base:36, modo:'acorde' },
    { id:'piano',    nombre:'Piano',       emoji:'🎹', tipo:'mel', base:48, modo:'acorde' },
    { id:'montuno',  nombre:'Montuno',     emoji:'🎹', tipo:'mel', base:48, modo:'acorde' },
    { id:'stabs',    nombre:'Stabs',       emoji:'⚡', tipo:'mel', base:48, modo:'acorde' },
    { id:'pad',      nombre:'Pad',         emoji:'🌫️', tipo:'mel', base:48, modo:'acorde' },
    { id:'guitarra', nombre:'Guitarra',    emoji:'🎸', tipo:'mel', base:48, modo:'acorde' },
    { id:'requinto', nombre:'Requinto',    emoji:'🪕', tipo:'mel', base:60, modo:'escala' },
    { id:'acordeon', nombre:'Acordeón',    emoji:'🪗', tipo:'mel', base:60, modo:'escala' },
    { id:'metales',  nombre:'Metales',     emoji:'🎺', tipo:'mel', base:60, modo:'acorde' },
    { id:'marimba',  nombre:'Marimba',     emoji:'🎼', tipo:'mel', base:60, modo:'escala' },
    { id:'campana',  nombre:'Campana',     emoji:'🔔', tipo:'mel', base:72, modo:'escala' },
    { id:'flauta',   nombre:'Flauta/Gaita',emoji:'🪈', tipo:'mel', base:72, modo:'escala' }
  ];
  const instDe = id => INSTRUMENTOS.find(x => x.id === id) || INSTRUMENTOS[0];

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const ESC_MAY = [0, 2, 4, 5, 7, 9, 11];
  const ESC_MEN = [0, 2, 3, 5, 7, 8, 10];

  /* ═══ Crear proyecto desde un género ══════════════════════════ */

  function crearProyecto(o) {
    const g = o.genero;
    const arr = g.arreglo || { bajo:'pop', armonia:'piano', color:'campana', lead:'none', pad:true };
    const patron = g.patron || {};
    const pistas = [];

    /* El papel va en el nombre porque un mismo instrumento puede
       cumplir dos funciones — en champeta la guitarra hace la armonía
       Y el riff, y dos pistas llamadas igual son inservibles. */
    const ETIQ = { perc:'', bajo:'', armonia:' (armonía)', pad:' (colchón)', lead:' (riff)', color:' (adorno)' };
    const nueva = (inst, papel, extra) => {
      const meta = instDe(inst);
      return Object.assign({
        id: uid(), inst, papel,
        nombre: meta.nombre + (ETIQ[papel] || ''),
        vol: 0.85, pan: 0, mute: false, solo: false, oct: 0,
        modo: meta.tipo === 'perc' ? 'perc' : (meta.modo || 'acorde'),
        base: meta.base || 48,
        celdas: [], notas: [],
        secciones: 'auto',
        densidadMin: 0.45
      }, extra || {});
    };

    /* Percusión: se copia el patrón del género tal cual. */
    const gates = { hat:0.34, kick:0.40, clap:0.50, snare:0.50, perc:0.60, clave:0.45 };
    ['kick','snare','clap','hat','perc','clave'].forEach(f => {
      const celdas = patron[f];
      if (celdas && celdas.length) {
        pistas.push(nueva(f, 'perc', { celdas: celdas.slice(), densidadMin: gates[f] }));
      }
    });

    /* Bajo: los patrones de MINST traen [paso, duración, quinta?]. La
       marca de quinta se traduce a grado 2 del acorde. */
    const patBajo = (MINST.BAJO[arr.bajo] || MINST.BAJO.pop);
    const instBajo = arr.bajo === '808' ? '808' : 'bajo';
    pistas.push(nueva(instBajo, 'bajo', {
      base: 36, modo: 'acorde', densidadMin: 0.45,
      notas: patBajo.map(([s, d, q]) => ({ s, g: q ? 2 : 0, d }))
    }));

    /* Armonía */
    const patArm = (MINST.ARMONIA[arr.armonia] || MINST.ARMONIA.piano);
    const instArm = arr.armonia === 'stabs' ? 'stabs'
                  : arr.armonia === 'montuno' ? 'montuno'
                  : arr.armonia === 'marimba' ? 'marimba'
                  : arr.armonia === 'guitarra' ? 'guitarra'
                  : arr.armonia === 'pad' ? 'pad' : 'piano';
    const notasArm = [];
    patArm.forEach(([s, d], k) => {
      if (arr.armonia === 'guitarra') {
        // Arpegiada: una nota del acorde por posición, no el bloque.
        notasArm.push({ s, g: k % 3, d });
        notasArm.push({ s, g: (k + 1) % 3 + 3, d });
      } else {
        [0, 1, 2].forEach(g => notasArm.push({ s, g, d }));
      }
    });
    pistas.push(nueva(instArm, 'armonia', { base: 48, modo: 'acorde', densidadMin: 0.25, notas: notasArm }));

    /* Colchón */
    if (arr.pad) {
      pistas.push(nueva('pad', 'pad', {
        base: 60, modo: 'acorde', densidadMin: 0.6, vol: 0.55,
        notas: [{ s:0, g:0, d:16 }, { s:0, g:1, d:16 }, { s:0, g:2, d:16 }]
      }));
    }

    /* Melodía / riff */
    if (arr.lead && arr.lead !== 'none') {
      const ritmo = MINST.RIFF[g.id] || MINST.RIFF.default;
      const contorno = [0, 2, 4, 2, 5, 3];
      pistas.push(nueva(arr.lead, 'lead', {
        base: 60, modo: 'escala', densidadMin: 0.8, vol: 0.75, pan: 0.12,
        notas: ritmo.map((r, i) => ({ s: r[0], g: contorno[i % contorno.length], d: r[1] }))
      }));
    }

    /* Color: un adorno cada dos compases. */
    if (arr.color && arr.color !== 'none' && arr.color !== arr.lead) {
      pistas.push(nueva(arr.color, 'color', {
        base: 72, modo: 'escala', densidadMin: 0.7, vol: 0.5, pan: -0.18,
        notas: [{ s: 12, g: 4, d: 3 }], cadaDos: true
      }));
    }

    return {
      v: 1,
      id: uid(),
      titulo: o.titulo || ('Idea en ' + g.nombre),
      generoId: g.id,
      keyPc: o.keyPc, mode: o.mode, progId: o.progId,
      bpm: o.bpm || (g.bpm && g.bpm.tipico) || 95,
      bloques: (o.bloques || []).map(b => [b[0], b[1]]),
      progresion: (o.progresion || []).map(a => ({ pc: a.pc, qual: a.qual, roman: a.roman, label: a.label })),
      pistas,
      tomas: [],
      creado: new Date().toISOString()
    };
  }

  /* ═══ Pistas: alta, baja, copia ═══════════════════════════════ */

  function addPista(proy, instId) {
    const meta = instDe(instId);
    const p = {
      id: uid(), inst: instId, papel: meta.tipo === 'perc' ? 'perc' : 'mel',
      nombre: meta.nombre, vol: 0.85, pan: 0, mute: false, solo: false, oct: 0,
      modo: meta.tipo === 'perc' ? 'perc' : (meta.modo || 'acorde'),
      base: meta.base || 48, celdas: [], notas: [],
      secciones: 'auto', densidadMin: 0.4
    };
    proy.pistas.push(p);
    return p;
  }
  function delPista(proy, id) { proy.pistas = proy.pistas.filter(p => p.id !== id); }
  function duplicarPista(proy, id) {
    const p = proy.pistas.find(x => x.id === id);
    if (!p) return null;
    const c = JSON.parse(JSON.stringify(p));
    c.id = uid(); c.nombre = p.nombre + ' 2';
    proy.pistas.splice(proy.pistas.indexOf(p) + 1, 0, c);
    return c;
  }
  function moverPista(proy, id, delta) {
    const i = proy.pistas.findIndex(p => p.id === id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= proy.pistas.length) return;
    const [p] = proy.pistas.splice(i, 1);
    proy.pistas.splice(j, 0, p);
  }

  /* Edición de casillas y notas */
  function toggleCelda(pista, paso) {
    const n = paso + 1;
    const i = pista.celdas.indexOf(n);
    if (i >= 0) pista.celdas.splice(i, 1); else pista.celdas.push(n);
    pista.celdas.sort((a, b) => a - b);
    return i < 0;
  }
  function toggleNota(pista, paso, grado, dur) {
    const i = pista.notas.findIndex(x => x.s === paso && x.g === grado);
    if (i >= 0) { pista.notas.splice(i, 1); return false; }
    pista.notas.push({ s: paso, g: grado, d: dur || 2 });
    return true;
  }
  function limpiarPista(pista) { pista.celdas = []; pista.notas = []; }

  /* ═══ Proyecto → eventos ══════════════════════════════════════ */

  function midiDeNota(nota, acorde, pista, mode, keyPc) {
    const oct = 12 * (pista.oct || 0);
    if (pista.modo === 'escala') {
      const esc = mode === 'menor' ? ESC_MEN : ESC_MAY;
      const g = nota.g;
      return pista.base + keyPc + esc[((g % 7) + 7) % 7] + 12 * Math.floor(g / 7) + oct;
    }
    // modo acorde: los grados indexan las notas del acorde
    const midis = MAUDIO.chordMidis(acorde.pc, acorde.qual, 0);   // clases de altura
    const g = nota.g;
    const n = midis.length;
    const idx = ((g % n) + n) % n;
    return pista.base + midis[idx] + 12 * Math.floor(g / n) + oct;
  }

  function tocaEn(pista, nombreSeccion, dens) {
    if (Array.isArray(pista.secciones)) return pista.secciones.includes(nombreSeccion);
    return dens >= (pista.densidadMin == null ? 0.4 : pista.densidadMin);
  }

  /**
   * Convierte el proyecto en la lista de eventos que toca el motor.
   * @returns {{eventos, totalSteps, compases, secciones, secPorPaso}}
   */
  function aEventos(proy, opts) {
    const o = opts || {};
    const eventos = [];
    const secciones = [];
    const secPorPaso = {};
    const prog = proy.progresion || [];
    const haySolo = proy.pistas.some(p => p.solo);
    let compasGlobal = 0;

    const bloques = o.soloCompas != null
      ? [['Bucle', 1]]                      // modo bucle de un compás para editar
      : (proy.bloques && proy.bloques.length ? proy.bloques : [['Coro', 8]]);

    bloques.forEach(([nombre, compases]) => {
      const dens = o.soloCompas != null ? 1 : MINST.densidad(nombre);
      secciones.push({ nombre, compas: compasGlobal, compases, densidad: dens });
      secPorPaso[compasGlobal * 16] = secciones.length - 1;

      for (let b = 0; b < compases; b++) {
        const idxCompas = o.soloCompas != null ? o.soloCompas : (compasGlobal + b);
        const base = (compasGlobal + b) * 16;
        const acorde = prog[idxCompas % Math.max(prog.length, 1)];
        if (!acorde) continue;

        for (const pista of proy.pistas) {
          if (pista.mute) continue;
          if (haySolo && !pista.solo) continue;
          if (o.soloCompas == null && !tocaEn(pista, nombre, dens)) continue;
          if (pista.cadaDos && b % 2 !== 0) continue;

          // La velocidad sigue llevando un poco de la densidad para que
          // las secciones bajas suenen más suaves, no solo más vacías.
          const vel = Math.min(1, 0.55 + dens * 0.45);

          if (pista.modo === 'perc') {
            for (const c of pista.celdas) {
              eventos.push({ i: pista.inst, s: base + c - 1, m: null, d: 1, v: vel, p: pista.id });
            }
          } else {
            for (const nota of pista.notas) {
              eventos.push({
                i: pista.inst, s: base + nota.s,
                m: midiDeNota(nota, acorde, pista, proy.mode, proy.keyPc),
                d: nota.d || 2, v: vel, p: pista.id
              });
            }
          }
        }
      }
      compasGlobal += compases;
    });

    return { eventos, compases: compasGlobal, totalSteps: compasGlobal * 16, secciones, secPorPaso };
  }

  /* ═══ Canales de mezcla ═══════════════════════════════════════ */
  let canales = null;

  function construirCanales(proy) {
    const a = MAUDIO.ac();
    const bus = MAUDIO.bus();
    const map = {};
    for (const p of proy.pistas) {
      const g = a.createGain();
      g.gain.value = p.vol == null ? 0.85 : p.vol;
      let nodo = g;
      if (a.createStereoPanner) {
        const pan = a.createStereoPanner();
        pan.pan.value = p.pan || 0;
        g.connect(pan); nodo = g; pan.connect(bus);
        map[p.id] = { entrada: g, gain: g, pan };
      } else {
        g.connect(bus);
        map[p.id] = { entrada: g, gain: g, pan: null };
      }
    }
    canales = map;
    return map;
  }
  function actualizarCanal(pistaId, vol, pan) {
    if (!canales || !canales[pistaId]) return;
    const a = MAUDIO.ac(), c = canales[pistaId];
    if (vol != null) c.gain.gain.setTargetAtTime(vol, a.currentTime, 0.02);
    if (pan != null && c.pan) c.pan.pan.setTargetAtTime(pan, a.currentTime, 0.02);
  }
  function soltarCanales() {
    if (!canales) return;
    Object.values(canales).forEach(c => { try { c.gain.disconnect(); if (c.pan) c.pan.disconnect(); } catch (e) {} });
    canales = null;
  }

  /* ═══ Reproducción ════════════════════════════════════════════ */

  function reproducir(proy, opts) {
    const o = opts || {};
    MAUDIO.unlock();
    soltarCanales();
    const map = construirCanales(proy);
    const dests = {};
    Object.keys(map).forEach(k => { dests[k] = map[k].entrada; });

    const s = aEventos(proy, { soloCompas: o.soloCompas });
    if (!s.eventos.length) return null;

    MAUDIO.startSong({
      bpm: proy.bpm,
      eventos: s.eventos,
      totalSteps: o.repetir ? s.totalSteps * 64 : s.totalSteps,
      secPorPaso: s.secPorPaso,
      dests,
      onStep: o.onStep, onSection: o.onSection ? i => o.onSection(s.secciones[i], i) : null,
      onEnd: () => { soltarCanales(); if (o.onEnd) o.onEnd(); }
    });
    return s;
  }

  function parar() { MAUDIO.stop(); soltarCanales(); }

  /* Bucle de un compás para editar: se repite hasta que se pare. */
  function bucle(proy, compas, onStep) {
    MAUDIO.unlock();
    soltarCanales();
    const map = construirCanales(proy);
    const dests = {};
    Object.keys(map).forEach(k => { dests[k] = map[k].entrada; });
    const s = aEventos(proy, { soloCompas: compas || 0 });
    // Se repite el compás muchas veces en vez de reagendar: el motor
    // ya sabe recorrer una lista larga y así el bucle no tiene costura.
    const REP = 200;
    const evs = [];
    for (let r = 0; r < REP; r++) {
      for (const e of s.eventos) evs.push(Object.assign({}, e, { s: e.s + r * 16 }));
    }
    MAUDIO.startSong({
      bpm: proy.bpm, eventos: evs, totalSteps: REP * 16, dests,
      onStep: onStep, onEnd: () => soltarCanales()
    });
  }

  /* ═══ Persistencia ════════════════════════════════════════════ */

  const DB_NOMBRE = 'da2026_mus';
  const DB_VER = 1;
  function abrirDB() {
    return new Promise((res, rej) => {
      const req = indexedDB.open(DB_NOMBRE, DB_VER);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('tomas')) db.createObjectStore('tomas', { keyPath: 'id' });
      };
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    });
  }

  /** Guarda una toma como PCM crudo. Los AudioBuffer no son
   *  serializables; se guardan los Float32 y la frecuencia. */
  async function guardarToma(id, buffer) {
    const db = await abrirDB();
    const canales = [];
    for (let c = 0; c < buffer.numberOfChannels; c++) canales.push(buffer.getChannelData(c).slice(0));
    return new Promise((res, rej) => {
      const tx = db.transaction('tomas', 'readwrite');
      tx.objectStore('tomas').put({ id, sr: buffer.sampleRate, canales, len: buffer.length });
      tx.oncomplete = () => res(true);
      tx.onerror = () => rej(tx.error);
    });
  }
  async function leerToma(id) {
    const db = await abrirDB();
    return new Promise((res, rej) => {
      const tx = db.transaction('tomas', 'readonly');
      const r = tx.objectStore('tomas').get(id);
      r.onsuccess = () => {
        if (!r.result) return res(null);
        const a = MAUDIO.ac();
        const d = r.result;
        const buf = a.createBuffer(d.canales.length, d.len, d.sr);
        d.canales.forEach((c, i) => buf.copyToChannel(c instanceof Float32Array ? c : new Float32Array(c), i));
        res(buf);
      };
      r.onerror = () => rej(r.error);
    });
  }
  async function borrarToma(id) {
    const db = await abrirDB();
    return new Promise(res => {
      const tx = db.transaction('tomas', 'readwrite');
      tx.objectStore('tomas').delete(id);
      tx.oncomplete = () => res(true);
    });
  }

  return {
    INSTRUMENTOS, instDe,
    crearProyecto, addPista, delPista, duplicarPista, moverPista,
    toggleCelda, toggleNota, limpiarPista,
    aEventos, reproducir, parar, bucle,
    construirCanales, actualizarCanal, soltarCanales,
    guardarToma, leerToma, borrarToma
  };
})();

window.MSTUDIO = MSTUDIO;
