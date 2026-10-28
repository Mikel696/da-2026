/* ═══════════════════════════════════════════════════════════════
   18-MUS · Exportador
   ─────────────────────────────────────────────────────────────
   Cuatro formatos, cada uno con un destinatario distinto:

   · WAV      → lo que sube a la distribuidora o manda a masterizar.
                Sin pérdida. 16 o 24 bits.
   · MIDI     → 🎯 el más importante para Miguel. No lleva sonido: lleva
                las NOTAS. Se abre en FL Studio y cada pista cae en su
                instrumento General MIDI, lista para reemplazar el
                sintetizador por un acordeón o unos metales de verdad.
                Es el puente exacto entre esta maqueta y su DAW.
   · Stems    → un WAV por instrumento, para mezclar aparte o
                entregárselo al artista que compra la canción.
   · Proyecto → JSON con todo el estado editable, para volver mañana.

   Sobre MP3: no se genera acá a propósito. Codificar MP3 en el
   navegador exige una librería externa, y la arquitectura del Cerebro
   es vanilla JS sin dependencias (única excepción: el SDK de Supabase).
   El WAV que sale de acá se convierte en un paso en cualquier
   herramienta — y para mandarle una maqueta a un artista, el WAV o el
   WebM de acá sirven igual.
═══════════════════════════════════════════════════════════════ */
const MEXPORT = (() => {
  'use strict';

  /* ═══ WAV ═════════════════════════════════════════════════════ */

  /** AudioBuffer → Blob WAV (PCM entero, 16 o 24 bits). */
  function bufferAWav(buf, bits) {
    bits = bits === 24 ? 24 : 16;
    const canales = Math.min(buf.numberOfChannels, 2);
    const n = buf.length;
    const bytesPorMuestra = bits / 8;
    const blockAlign = canales * bytesPorMuestra;
    const dataLen = n * blockAlign;
    const ab = new ArrayBuffer(44 + dataLen);
    const dv = new DataView(ab);

    const txt = (off, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(off + i, s.charCodeAt(i)); };
    txt(0, 'RIFF');  dv.setUint32(4, 36 + dataLen, true);
    txt(8, 'WAVE');  txt(12, 'fmt ');
    dv.setUint32(16, 16, true);              // tamaño del bloque fmt
    dv.setUint16(20, 1, true);               // 1 = PCM entero
    dv.setUint16(22, canales, true);
    dv.setUint32(24, buf.sampleRate, true);
    dv.setUint32(28, buf.sampleRate * blockAlign, true);
    dv.setUint16(32, blockAlign, true);
    dv.setUint16(34, bits, true);
    txt(36, 'data'); dv.setUint32(40, dataLen, true);

    const pistas = [];
    for (let c = 0; c < canales; c++) pistas.push(buf.getChannelData(c));

    let off = 44;
    const max = bits === 24 ? 8388607 : 32767;
    for (let i = 0; i < n; i++) {
      for (let c = 0; c < canales; c++) {
        // Recorte duro antes de convertir: pasarse del rango entero
        // envuelve el valor y produce un chasquido, no una saturación.
        let s = Math.max(-1, Math.min(1, pistas[c][i]));
        const v = Math.round(s * max);
        if (bits === 24) {
          dv.setUint8(off, v & 0xFF);
          dv.setUint8(off + 1, (v >> 8) & 0xFF);
          dv.setUint8(off + 2, (v >> 16) & 0xFF);
          off += 3;
        } else {
          dv.setInt16(off, v, true);
          off += 2;
        }
      }
    }
    return new Blob([ab], { type: 'audio/wav' });
  }

  /** Pico y valor eficaz de un buffer, para avisar antes de exportar. */
  function medir(buf) {
    let pico = 0, suma = 0, n = 0;
    for (let c = 0; c < buf.numberOfChannels; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < d.length; i += 8) {          // muestreo 1 de cada 8
        const v = Math.abs(d[i]);
        if (v > pico) pico = v;
        suma += d[i] * d[i]; n++;
      }
    }
    const rms = Math.sqrt(suma / Math.max(n, 1));
    const dB = v => (v <= 0.0000001 ? -99 : 20 * Math.log10(v));
    return { pico: +dB(pico).toFixed(1), rms: +dB(rms).toFixed(1), recortado: pico >= 0.999 };
  }

  /* ═══ MIDI ════════════════════════════════════════════════════ */

  /* Programas General MIDI por instrumento del módulo. Es lo que hace
     que al abrir el archivo en FL Studio el acordeón salga de acordeón
     y no de piano. */
  const GM = {
    piano: 0, montuno: 0, stabs: 81, pad: 89,
    bajo: 33, '808': 38,
    guitarra: 27, requinto: 25, acordeon: 21,
    metales: 61, marimba: 12, campana: 14, flauta: 73
  };
  /* Percusión: canal 10 del estándar (índice 9) con las notas del mapa
     de batería General MIDI. */
  const GM_PERC = { kick: 36, snare: 38, clap: 39, hat: 42, perc: 64, clave: 75 };
  const PPQ = 480;                          // pulsos por negra

  const vlq = n => {                        // cantidad de longitud variable
    const bytes = [n & 0x7F];
    n >>= 7;
    while (n > 0) { bytes.unshift((n & 0x7F) | 0x80); n >>= 7; }
    return bytes;
  };
  const be32 = n => [(n >> 24) & 255, (n >> 16) & 255, (n >> 8) & 255, n & 255];
  const chunk = (id, datos) => {
    const out = [];
    for (const c of id) out.push(c.charCodeAt(0));
    return out.concat(be32(datos.length), datos);
  };

  /**
   * Eventos del módulo → archivo MIDI tipo 1 (una pista por instrumento).
   * @param {Array} eventos [{i,s,m,d,v}] · s y d en pasos de semicorchea
   */
  function aMidi(eventos, bpm, titulo) {
    const porInst = {};
    for (const e of eventos) (porInst[e.i] || (porInst[e.i] = [])).push(e);
    const nombres = Object.keys(porInst);
    const tickPorPaso = PPQ / 4;             // 1 paso = 1 semicorchea

    /* Pista 0: solo tempo, compás y título (convención del formato 1). */
    const usPorNegra = Math.round(60000000 / bpm);
    let meta = [];
    meta = meta.concat(vlq(0), [0xFF, 0x03, titulo.length], [...titulo].map(c => c.charCodeAt(0) & 0x7F));
    meta = meta.concat(vlq(0), [0xFF, 0x51, 0x03, (usPorNegra >> 16) & 255, (usPorNegra >> 8) & 255, usPorNegra & 255]);
    meta = meta.concat(vlq(0), [0xFF, 0x58, 0x04, 4, 2, 24, 8]);   // 4/4
    meta = meta.concat(vlq(0), [0xFF, 0x2F, 0x00]);
    const pistas = [chunk('MTrk', meta)];

    nombres.forEach((nombre, idx) => {
      const esPerc = GM_PERC[nombre] !== undefined;
      // El canal 9 está reservado a percusión. Los melódicos van
      // saltándoselo para no pisar el kit de batería.
      let canal = esPerc ? 9 : idx % 15;
      if (!esPerc && canal >= 9) canal += 1;
      if (canal > 15) canal = 15;

      let ev = [];
      const nom = nombre.slice(0, 30);
      ev = ev.concat(vlq(0), [0xFF, 0x03, nom.length], [...nom].map(c => c.charCodeAt(0) & 0x7F));
      if (!esPerc) ev = ev.concat(vlq(0), [0xC0 | canal, GM[nombre] === undefined ? 0 : GM[nombre]]);

      /* Se convierte a una lista de encendidos/apagados con tiempo
         absoluto, se ordena, y recién ahí se calculan los deltas.
         Hacerlo al revés es la forma clásica de producir un MIDI que
         suena desfasado. */
      const abs = [];
      for (const e of porInst[nombre]) {
        const nota = esPerc ? GM_PERC[nombre] : Math.max(0, Math.min(127, e.m || 60));
        const vel = Math.max(1, Math.min(127, Math.round((e.v == null ? 1 : e.v) * 100)));
        const ini = Math.round(e.s * tickPorPaso);
        const fin = ini + Math.max(30, Math.round((e.d || 1) * tickPorPaso * 0.92));
        abs.push({ t: ini, on: true, nota, vel });
        abs.push({ t: fin, on: false, nota, vel: 0 });
      }
      abs.sort((a, b) => a.t - b.t || (a.on ? 1 : -1));   // apagados antes que encendidos

      let prev = 0;
      for (const a of abs) {
        ev = ev.concat(vlq(a.t - prev), [(a.on ? 0x90 : 0x80) | canal, a.nota, a.vel]);
        prev = a.t;
      }
      ev = ev.concat(vlq(0), [0xFF, 0x2F, 0x00]);
      pistas.push(chunk('MTrk', ev));
    });

    const cabecera = chunk('MThd', [0, 1, (pistas.length >> 8) & 255, pistas.length & 255, (PPQ >> 8) & 255, PPQ & 255]);
    const todo = cabecera.concat(...pistas);
    return new Blob([new Uint8Array(todo)], { type: 'audio/midi' });
  }

  /* ═══ Render offline ══════════════════════════════════════════ */

  /* ── Por qué esto va por bloques ──────────────────────────────
     En un render offline TODOS los nodos existen desde el instante
     cero: no hay reproducción progresiva que los vaya creando. Agendar
     una canción entera de golpe son ~8.000 nodos vivos a la vez, y el
     coste de procesar el grafo crece peor que lineal — un tema de 3
     minutos se pasaba de 45 segundos y seguía.

     Partirlo en tramos acota el número de nodos por render. Los tramos
     se SUMAN con solapamiento (cada uno se renderiza con cola extra,
     así una reverb o una nota larga que cruza el borde no se corta):
     la cadena hasta el bus es lineal, o sea que sumar los tramos da
     exactamente el mismo resultado que renderizar todo de una vez. */
  const PASOS_POR_TRAMO = 128;     // 8 compases
  const COLA_TRAMO = 3.0;          // segundos de margen para las colas

  /**
   * Renderiza una lista de eventos a AudioBuffer sin reproducirla.
   * @param {Object} o {eventos, bpm, totalSteps, sr, colaSeg, ganancia, extras, onProgreso}
   */
  async function render(o) {
    // Por defecto se renderiza a la frecuencia nativa de la tarjeta. Forzar
    // 44.100 cuando el equipo va a 48.000 obligaría a remuestrear dos veces
    // (al renderizar y al reproducir) sin ganar nada: las tiendas aceptan
    // ambas. El WAV se escribe con la frecuencia real del buffer.
    const sr = o.sr || (MAUDIO.ac() && MAUDIO.ac().sampleRate) || 44100;
    const stepS = (60 / o.bpm) / 4;
    const colaFinal = o.colaSeg == null ? 2.5 : o.colaSeg;
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OAC) throw new Error('Este navegador no soporta render offline.');

    const durTotal = o.totalSteps * stepS + colaFinal;
    const nMuestras = Math.ceil(durTotal * sr);
    const salida = [new Float32Array(nMuestras), new Float32Array(nMuestras)];

    const eventos = o.eventos || [];
    const nTramos = Math.max(1, Math.ceil(o.totalSteps / PASOS_POR_TRAMO));

    for (let k = 0; k < nTramos; k++) {
      const pasoIni = k * PASOS_POR_TRAMO;
      const pasoFin = Math.min(o.totalSteps, pasoIni + PASOS_POR_TRAMO);
      const delTramo = eventos.filter(e => e.s >= pasoIni && e.s < pasoFin);
      const offsetMuestras = Math.round(pasoIni * stepS * sr);
      const durTramo = (pasoFin - pasoIni) * stepS + COLA_TRAMO;
      const largoTramo = Math.ceil(durTramo * sr);

      if (delTramo.length) {
        const off = new OAC(2, largoTramo, sr);
        const bus = MAUDIO.beginRender(off);
        if (o.ganancia != null) bus.gain.value = o.ganancia;
        let buf;
        try {
          for (const e of delTramo) {
            MAUDIO.playInst(e.i, (e.s - pasoIni) * stepS, {
              midi: e.m, dur: (e.d || 1) * stepS * 0.95,
              vel: e.v == null ? 1 : e.v, open: e.o
            });
          }
          buf = await off.startRendering();
        } finally {
          MAUDIO.endRender();
        }
        for (let c = 0; c < 2; c++) {
          const src = buf.getChannelData(Math.min(c, buf.numberOfChannels - 1));
          const dst = salida[c];
          const n = Math.min(src.length, nMuestras - offsetMuestras);
          for (let i = 0; i < n; i++) dst[offsetMuestras + i] += src[i];
        }
      }
      if (o.onProgreso) o.onProgreso((k + 1) / nTramos);
      // Cede el hilo para que la interfaz pueda repintar la barra.
      await new Promise(r => setTimeout(r, 0));
    }

    /* Las pistas ya grabadas (voces) se suman directo, muestra a muestra.
       No necesitan pasar por el grafo: ya son audio. */
    for (const x of (o.extras || [])) {
      if (!x.buffer) continue;
      const g = x.vol == null ? 1 : x.vol;
      const pan = Math.max(-1, Math.min(1, x.pan || 0));
      // Ley de panorama de potencia constante: si se usara una rampa
      // lineal, el centro sonaría 3 dB más bajo que los lados.
      const ang = (pan + 1) * Math.PI / 4;
      const gL = Math.cos(ang), gR = Math.sin(ang);
      const off0 = Math.round((x.offsetSeg || 0) * sr);
      for (let c = 0; c < 2; c++) {
        const src = x.buffer.getChannelData(Math.min(c, x.buffer.numberOfChannels - 1));
        const dst = salida[c];
        const gc = g * (c === 0 ? gL : gR) * Math.SQRT2;
        const n = Math.min(src.length, nMuestras - off0);
        for (let i = 0; i < n; i++) dst[off0 + i] += src[i] * gc;
      }
    }

    const a = MAUDIO.ac();
    const final = a.createBuffer(2, nMuestras, sr);
    final.copyToChannel(salida[0], 0);
    final.copyToChannel(salida[1], 1);
    return final;
  }

  /** Un WAV por instrumento. Lo que se le entrega a quien compra la canción. */
  async function renderStems(o) {
    const porInst = {};
    for (const e of o.eventos) (porInst[e.i] || (porInst[e.i] = [])).push(e);
    const salida = [];
    for (const nombre of Object.keys(porInst)) {
      const buf = await render(Object.assign({}, o, { eventos: porInst[nombre], extras: [] }));
      salida.push({ nombre, buffer: buf });
    }
    for (const x of (o.extras || [])) {
      salida.push({ nombre: x.nombre || 'voz', buffer: x.buffer });
    }
    return salida;
  }

  /* ═══ Descarga ════════════════════════════════════════════════ */

  function descargar(blob, nombre) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = nombre;
    document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 400);
  }

  const limpiarNombre = s => (s || 'cancion')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9\- ]/g, '').trim().replace(/\s+/g, '-').slice(0, 60) || 'cancion';

  return { bufferAWav, medir, aMidi, render, renderStems, descargar, limpiarNombre, GM, GM_PERC };
})();

window.MEXPORT = MEXPORT;
