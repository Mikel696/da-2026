/* ═══════════════════════════════════════════════════════════════
   18-MUS · Grabación de voz + cadena de efectos
   ─────────────────────────────────────────────────────────────
   Objetivo: que una voz grabada con el micrófono de unos audífonos, en
   un cuarto de casa, salga usable. No milagros — pero sí las cinco
   cosas que de verdad separan una toma casera de una comercial:
   limpieza, puerta, compresión, ecualización y espacio.

   Decisiones que importan:

   · Se graba la señal CRUDA, antes de los efectos. Así la cadena sigue
     siendo ajustable después: si mañana la reverb sobra, se baja — no
     hay que volver a cantar. Es como se trabaja en un estudio de
     verdad, y es lo contrario de lo que hace la mayoría de apps.

   · Captura sin pérdida vía AudioWorklet (con ScriptProcessor de
     respaldo). MediaRecorder habría sido menos código pero comprime a
     Opus; para una voz que después se va a comprimir otra vez al
     distribuir, empezar ya con pérdida es empezar mal.

   · La puerta de ruido y el quita-sibilancias van gobernados por un
     único lazo de control con analizadores, a ~100 Hz. No hace falta
     procesar muestra a muestra: una puerta real tiene ataque y caída
     en decenas de milisegundos de todos modos.

   · Compartimos el AudioContext de MAUDIO. Dos contextos en la misma
     página son dos relojes distintos, y ahí se acabó la sincronía
     entre la voz y la pista.
═══════════════════════════════════════════════════════════════ */
const MREC = (() => {
  'use strict';

  let stream = null;          // MediaStream del micrófono
  let micNode = null;         // MediaStreamAudioSourceNode
  let cadena = null;          // grafo de efectos
  let lazo = null;            // lazo de control (puerta + de-esser)
  let grabando = false;
  let trozos = [];            // Float32Array acumulados
  let nMuestras = 0;
  let workletListo = false;
  let capturaNode = null;
  let monitorOn = false;

  /* Estado de la cadena. Los presets del cerebro escriben aquí. */
  const P = {
    limpieza: 1, puerta: 1, deesser: 1, comp: 1, eq: 1, sat: 1, doble: 0, rev: 1, delay: 0,
    puertaUmbralDb: -50,      // se calibra midiendo el cuarto
    compTh: -21, compRa: 4,
    eqBajo: -2, eqMedio: 0, eqAlto: 3,
    deessAmt: 5, satAmt: 0.2, dobleAmt: 0.3, revAmt: 0.22, delayAmt: 0.12,
    bpm: 95, entrada: 1.0
  };

  const A = () => MAUDIO.ac();
  const disponible = () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  /* ═══ Reverb generada, sin archivos ═══════════════════════════
     Ruido que decae exponencialmente, con los agudos apagándose antes
     que los graves — que es lo que hace una sala real, porque el aire
     y las superficies absorben más las frecuencias altas. */
  function crearIR(a, seg, caida, amortigua) {
    const sr = a.sampleRate, n = Math.ceil(sr * seg);
    const ir = a.createBuffer(2, n, sr);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      let lp = 0;
      for (let i = 0; i < n; i++) {
        const t = i / n;
        const x = (Math.random() * 2 - 1) * Math.pow(1 - t, caida);
        lp += amortigua * (x - lp);
        d[i] = lp;
      }
    }
    return ir;
  }

  function curvaSat(cantidad) {
    const n = 1024, c = new Float32Array(n);
    const k = 1 + cantidad * 6;
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * 2 - 1;
      c[i] = Math.tanh(x * k) / Math.tanh(k);
    }
    return c;
  }

  /* ═══ Construcción de la cadena ═══════════════════════════════ */
  function construirCadena() {
    const a = A();
    const c = {};

    c.entrada   = a.createGain();
    c.hpf       = a.createBiquadFilter(); c.hpf.type = 'highpass'; c.hpf.frequency.value = 80; c.hpf.Q.value = 0.7;
    c.puerta    = a.createGain(); c.puerta.gain.value = 1;

    // Analizadores del lazo de control: uno para el nivel general (la
    // puerta) y otro solo para agudos (el quita-sibilancias).
    c.medidor   = a.createAnalyser(); c.medidor.fftSize = 1024; c.medidor.smoothingTimeConstant = 0;
    c.tapAgudos = a.createBiquadFilter(); c.tapAgudos.type = 'highpass'; c.tapAgudos.frequency.value = 6000;
    c.medAgudos = a.createAnalyser(); c.medAgudos.fftSize = 512; c.medAgudos.smoothingTimeConstant = 0;

    // De-esser: un realce paramétrico en 7 kHz cuyo GANANCIA se
    // automatiza hacia abajo cuando hay mucha "s". Es un EQ dinámico —
    // más transparente que partir la señal en bandas, que introduce
    // problemas de fase en el punto de corte.
    c.deess     = a.createBiquadFilter(); c.deess.type = 'peaking'; c.deess.frequency.value = 7000;
    c.deess.Q.value = 1.6; c.deess.gain.value = 0;

    c.comp      = a.createDynamicsCompressor();
    c.comp.threshold.value = P.compTh; c.comp.ratio.value = P.compRa;
    c.comp.attack.value = 0.004; c.comp.release.value = 0.18; c.comp.knee.value = 6;

    c.eqBajo    = a.createBiquadFilter(); c.eqBajo.type = 'peaking';   c.eqBajo.frequency.value = 300;   c.eqBajo.Q.value = 1.0;
    c.eqMedio   = a.createBiquadFilter(); c.eqMedio.type = 'peaking';  c.eqMedio.frequency.value = 3000; c.eqMedio.Q.value = 0.9;
    c.eqAlto    = a.createBiquadFilter(); c.eqAlto.type = 'highshelf'; c.eqAlto.frequency.value = 10000;

    c.sat       = a.createWaveShaper(); c.sat.curve = curvaSat(P.satAmt); c.sat.oversample = '2x';

    c.seco      = a.createGain();
    c.salida    = a.createGain();

    // Doblador: dos copias retardadas y desafinadas lentamente, una a
    // cada lado. El desafine viene de modular el tiempo de retardo con
    // un LFO muy lento — así se consigue el batido sin cambiar el tono.
    c.dobleG    = a.createGain(); c.dobleG.gain.value = 0;
    c.dobleL    = a.createDelay(0.1); c.dobleL.delayTime.value = 0.019;
    c.dobleR    = a.createDelay(0.1); c.dobleR.delayTime.value = 0.031;
    c.panL      = a.createStereoPanner ? a.createStereoPanner() : null;
    c.panR      = a.createStereoPanner ? a.createStereoPanner() : null;
    if (c.panL) { c.panL.pan.value = -0.75; c.panR.pan.value = 0.75; }
    c.lfoL = a.createOscillator(); c.lfoL.frequency.value = 0.31;
    c.lfoR = a.createOscillator(); c.lfoR.frequency.value = 0.23;
    const lgL = a.createGain(), lgR = a.createGain();
    lgL.gain.value = 0.0022; lgR.gain.value = 0.0028;
    c.lfoL.connect(lgL); lgL.connect(c.dobleL.delayTime);
    c.lfoR.connect(lgR); lgR.connect(c.dobleR.delayTime);
    try { c.lfoL.start(); c.lfoR.start(); } catch (e) {}

    c.revPre    = a.createDelay(0.2); c.revPre.delayTime.value = 0.022;   // pre-delay
    c.rev       = a.createConvolver(); c.rev.buffer = crearIR(a, 2.2, 2.6, 0.42);
    c.revG      = a.createGain(); c.revG.gain.value = 0;

    c.delay     = a.createDelay(2);
    c.delayFb   = a.createGain(); c.delayFb.gain.value = 0.34;
    c.delayFiltro = a.createBiquadFilter(); c.delayFiltro.type = 'lowpass'; c.delayFiltro.frequency.value = 3200;
    c.delayG    = a.createGain(); c.delayG.gain.value = 0;

    /* ── Cableado ── */
    c.entrada.connect(c.hpf);
    c.hpf.connect(c.puerta);
    c.puerta.connect(c.medidor);
    c.puerta.connect(c.tapAgudos); c.tapAgudos.connect(c.medAgudos);
    c.puerta.connect(c.deess);
    c.deess.connect(c.comp);
    c.comp.connect(c.eqBajo); c.eqBajo.connect(c.eqMedio); c.eqMedio.connect(c.eqAlto);
    c.eqAlto.connect(c.sat);
    c.sat.connect(c.seco); c.seco.connect(c.salida);

    c.sat.connect(c.dobleL); c.sat.connect(c.dobleR);
    if (c.panL) { c.dobleL.connect(c.panL); c.dobleR.connect(c.panR); c.panL.connect(c.dobleG); c.panR.connect(c.dobleG); }
    else { c.dobleL.connect(c.dobleG); c.dobleR.connect(c.dobleG); }
    c.dobleG.connect(c.salida);

    c.sat.connect(c.revPre); c.revPre.connect(c.rev); c.rev.connect(c.revG); c.revG.connect(c.salida);

    c.sat.connect(c.delay);
    c.delay.connect(c.delayFiltro); c.delayFiltro.connect(c.delayFb); c.delayFb.connect(c.delay);
    c.delay.connect(c.delayG); c.delayG.connect(c.salida);

    return c;
  }

  /* ═══ Lazo de control · puerta y de-esser ═════════════════════ */
  const dB = v => (v <= 0.0000001 ? -99 : 20 * Math.log10(v));

  function rms(analyser, buf) {
    analyser.getFloatTimeDomainData(buf);
    let s = 0;
    for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
    return Math.sqrt(s / buf.length);
  }

  let nivelActual = -99, nivelPico = -99;

  function arrancarLazo() {
    if (lazo) clearInterval(lazo);
    const bufN = new Float32Array(cadena.medidor.fftSize);
    const bufA = new Float32Array(cadena.medAgudos.fftSize);
    let abierta = 1;
    lazo = setInterval(() => {
      if (!cadena) return;
      const a = A();
      const rN = rms(cadena.medidor, bufN);
      const dbN = dB(rN);
      nivelActual = dbN;
      if (dbN > nivelPico) nivelPico = dbN; else nivelPico -= 0.6;   // pico con caída lenta

      /* Puerta: por encima del umbral abre rápido (5 ms) para no
         comerse el ataque de la palabra; por debajo cierra lento
         (120 ms) para no cortar el final de la frase — el error más
         común al configurar una puerta. */
      if (P.puerta) {
        const objetivo = dbN > P.puertaUmbralDb ? 1 : 0.0015;
        if (objetivo !== abierta) {
          abierta = objetivo;
          cadena.puerta.gain.cancelScheduledValues(a.currentTime);
          cadena.puerta.gain.setTargetAtTime(objetivo, a.currentTime, objetivo === 1 ? 0.005 : 0.12);
        }
      } else {
        cadena.puerta.gain.setTargetAtTime(1, a.currentTime, 0.01);
      }

      /* De-esser: si la energía de agudos supera al conjunto, se hunde
         el realce de 7 kHz proporcionalmente. */
      if (P.deesser) {
        const dbA = dB(rms(cadena.medAgudos, bufA));
        const exceso = Math.max(0, dbA - (dbN - 12));
        const reduc = -Math.min(P.deessAmt, exceso * 1.2);
        cadena.deess.gain.setTargetAtTime(reduc, a.currentTime, 0.01);
      } else {
        cadena.deess.gain.setTargetAtTime(0, a.currentTime, 0.02);
      }
    }, 10);
  }

  /* ═══ Aplicar parámetros ══════════════════════════════════════ */
  function aplicar() {
    if (!cadena) return;
    const a = A(), t = a.currentTime;
    cadena.entrada.gain.setTargetAtTime(P.entrada, t, 0.02);
    cadena.hpf.frequency.setTargetAtTime(P.limpieza ? 80 : 20, t, 0.02);
    cadena.comp.threshold.setTargetAtTime(P.comp ? P.compTh : 0, t, 0.02);
    cadena.comp.ratio.setTargetAtTime(P.comp ? P.compRa : 1, t, 0.02);
    cadena.eqBajo.gain.setTargetAtTime(P.eq ? P.eqBajo : 0, t, 0.02);
    cadena.eqMedio.gain.setTargetAtTime(P.eq ? P.eqMedio : 0, t, 0.02);
    cadena.eqAlto.gain.setTargetAtTime(P.eq ? P.eqAlto : 0, t, 0.02);
    cadena.sat.curve = curvaSat(P.sat ? P.satAmt : 0);
    cadena.dobleG.gain.setTargetAtTime(P.doble ? P.dobleAmt : 0, t, 0.05);
    cadena.revG.gain.setTargetAtTime(P.rev ? P.revAmt : 0, t, 0.05);
    cadena.delayG.gain.setTargetAtTime(P.delay ? P.delayAmt : 0, t, 0.05);
    // Delay a negra con puntillo del tempo: el patrón rítmico del urbano.
    cadena.delay.delayTime.setTargetAtTime((60 / P.bpm) * 0.75, t, 0.05);
  }

  function set(clave, valor) { P[clave] = valor; aplicar(); }
  function aplicarPreset(v) { Object.assign(P, v); aplicar(); }
  const params = () => Object.assign({}, P);

  /* ═══ Micrófono ═══════════════════════════════════════════════ */
  async function iniciar(opciones) {
    if (!disponible()) throw new Error('Este navegador no da acceso al micrófono.');
    const o = opciones || {};
    const a = A();
    /* autoGainControl SIEMPRE apagado: sube y baja el volumen solo, lo
       que arruina la dinámica de una interpretación cantada. La
       compresión la decidimos nosotros. */
    const constraints = {
      audio: {
        echoCancellation: !!P.limpieza,
        noiseSuppression: !!P.limpieza,
        autoGainControl: false,
        channelCount: 1,
        deviceId: o.deviceId ? { exact: o.deviceId } : undefined
      }
    };
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    micNode = a.createMediaStreamSource(stream);
    if (!cadena) cadena = construirCadena();
    micNode.connect(cadena.entrada);
    aplicar();
    arrancarLazo();
    return true;
  }

  async function listarMicros() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return [];
    const d = await navigator.mediaDevices.enumerateDevices();
    return d.filter(x => x.kind === 'audioinput').map(x => ({ id: x.deviceId, nombre: x.label || 'Micrófono' }));
  }

  /** Monitoreo. Solo con auriculares: por parlantes se realimenta. */
  function monitor(on) {
    if (!cadena) return;
    if (on && !monitorOn) { cadena.salida.connect(MAUDIO.bus()); monitorOn = true; }
    else if (!on && monitorOn) { try { cadena.salida.disconnect(MAUDIO.bus()); } catch (e) {} monitorOn = false; }
  }

  const nivel = () => ({ rms: nivelActual, pico: nivelPico });

  /** Mide el ruido de fondo y calibra el umbral de la puerta por
   *  encima de él. Es la diferencia entre una puerta genérica y una
   *  puerta ajustada a SU cuarto. */
  async function medirCuarto(segundos) {
    if (!cadena) throw new Error('El micrófono no está abierto.');
    const seg = segundos || 2;
    const buf = new Float32Array(cadena.medidor.fftSize);
    const puertaAntes = P.puerta;
    P.puerta = 0; aplicar();                       // abrir para medir de verdad
    const muestras = [];
    const t0 = performance.now();
    while (performance.now() - t0 < seg * 1000) {
      muestras.push(dB(rms(cadena.medidor, buf)));
      await new Promise(r => setTimeout(r, 20));
    }
    P.puerta = puertaAntes;
    muestras.sort((a, b) => a - b);
    // Percentil 90 del ruido: ignora un golpe suelto sin quedarse corto.
    const fondo = muestras[Math.floor(muestras.length * 0.9)] || -60;
    P.puertaUmbralDb = Math.max(-70, Math.min(-20, fondo + 8));
    aplicar();
    return { fondoDb: +fondo.toFixed(1), umbralDb: +P.puertaUmbralDb.toFixed(1) };
  }

  /* ═══ Captura sin pérdida ═════════════════════════════════════ */
  const CODIGO_WORKLET = `
    class Captura extends AudioWorkletProcessor {
      process(inputs) {
        const e = inputs[0];
        if (e && e[0]) this.port.postMessage(e[0].slice(0));
        return true;
      }
    }
    registerProcessor('captura-mus', Captura);
  `;

  async function prepararCaptura() {
    const a = A();
    if (workletListo || !a.audioWorklet) return workletListo;
    try {
      const url = URL.createObjectURL(new Blob([CODIGO_WORKLET], { type: 'application/javascript' }));
      await a.audioWorklet.addModule(url);
      URL.revokeObjectURL(url);
      workletListo = true;
    } catch (e) {
      console.warn('[18-MUS] AudioWorklet no disponible, se usará ScriptProcessor:', e.message);
      workletListo = false;
    }
    return workletListo;
  }

  async function grabar() {
    if (!cadena) throw new Error('El micrófono no está abierto.');
    if (grabando) return;
    const a = A();
    trozos = []; nMuestras = 0; grabando = true;

    await prepararCaptura();
    /* Se toma la señal DESPUÉS del filtro de graves pero ANTES de la
       puerta y del resto: limpia de retumbe, pero con toda la dinámica
       intacta para poder reprocesarla cuantas veces haga falta. */
    const fuente = cadena.hpf;

    if (workletListo) {
      capturaNode = new AudioWorkletNode(a, 'captura-mus');
      capturaNode.port.onmessage = ev => {
        if (!grabando) return;
        trozos.push(ev.data); nMuestras += ev.data.length;
      };
    } else {
      capturaNode = a.createScriptProcessor(4096, 1, 1);
      capturaNode.onaudioprocess = ev => {
        if (!grabando) return;
        const d = ev.inputBuffer.getChannelData(0);
        trozos.push(new Float32Array(d)); nMuestras += d.length;
      };
      // ScriptProcessor solo corre si su salida está conectada; a un
      // gain en silencio para no oírlo dos veces.
      const mudo = a.createGain(); mudo.gain.value = 0;
      capturaNode.connect(mudo); mudo.connect(MAUDIO.bus());
    }
    fuente.connect(capturaNode);
  }

  function detener() {
    if (!grabando) return null;
    grabando = false;
    try { cadena.hpf.disconnect(capturaNode); } catch (e) {}
    if (capturaNode) { try { capturaNode.disconnect(); } catch (e) {} }
    if (capturaNode && capturaNode.port) capturaNode.port.onmessage = null;
    capturaNode = null;

    if (!nMuestras) return null;
    const a = A();
    const buf = a.createBuffer(1, nMuestras, a.sampleRate);
    const d = buf.getChannelData(0);
    let off = 0;
    for (const t of trozos) { d.set(t, off); off += t.length; }
    trozos = [];
    return buf;
  }

  const estaGrabando = () => grabando;
  const segundosGrabados = () => (A() ? nMuestras / A().sampleRate : 0);

  /** Reproduce una toma pasándola por la MISMA cadena de efectos, para
   *  que lo que se oye al revisar sea lo que se va a exportar. */
  function reproducirPorCadena(buffer, cuando, ganancia) {
    const a = A();
    if (!cadena) cadena = construirCadena();
    monitor(true);
    const s = a.createBufferSource(); s.buffer = buffer;
    const g = a.createGain(); g.gain.value = ganancia == null ? 1 : ganancia;
    s.connect(g); g.connect(cadena.entrada);
    s.start(cuando == null ? a.currentTime + 0.03 : cuando);
    return s;
  }

  /** Renderiza una toma con la cadena aplicada, para exportarla ya
   *  procesada. Reconstruye el grafo dentro del contexto offline. */
  async function renderConCadena(buffer) {
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OAC) return buffer;
    const sr = buffer.sampleRate;
    const off = new OAC(2, buffer.length + Math.ceil(sr * 2.5), sr);
    MAUDIO.beginRender(off);
    try {
      const guardada = cadena;
      cadena = construirCadena();          // se construye en el contexto offline
      aplicar();
      // La puerta y el de-esser son dinámicos y viven en el lazo de
      // control, que no existe offline: se dejan en un valor fijo
      // razonable en vez de fingir que actúan.
      cadena.puerta.gain.value = 1;
      cadena.deess.gain.value = P.deesser ? -P.deessAmt * 0.5 : 0;
      cadena.salida.connect(off.destination);
      const s = off.createBufferSource(); s.buffer = buffer;
      s.connect(cadena.entrada); s.start(0);
      const salida = await off.startRendering();
      cadena = guardada;
      return salida;
    } finally {
      MAUDIO.endRender();
    }
  }

  function cerrar() {
    if (lazo) { clearInterval(lazo); lazo = null; }
    monitor(false);
    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
    micNode = null;
    grabando = false;
  }

  const activo = () => !!stream;

  return {
    disponible, activo, iniciar, cerrar, listarMicros, monitor,
    set, aplicarPreset, params, aplicar,
    nivel, medirCuarto,
    grabar, detener, estaGrabando, segundosGrabados,
    reproducirPorCadena, renderConCadena
  };
})();

window.MREC = MREC;
