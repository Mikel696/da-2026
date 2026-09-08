/* ═══════════════════════════════════════════════════════════════
   18-MUS · Instrumentos de género + arreglista
   ─────────────────────────────────────────────────────────────
   Qué resuelve: que "elegí reggaetón" no sea solo un patrón de
   batería, sino una PISTA COMPLETA — bajo, armonía, color y melodía
   con el timbre del género, entrando y saliendo según la sección.

   Todo se sintetiza; no hay ni un sample. Dos técnicas hacen el
   trabajo pesado:

   · Karplus-Strong para las cuerdas (guitarra, requinto). Es modelado
     físico real: se llena una línea de retardo con ruido y se la
     realimenta a través de un filtro paso-bajos. El ruido se va
     "peinando" hasta quedar una nota con la envolvente exacta de una
     cuerda pulsada. Se calcula en un AudioBuffer y no con DelayNode
     porque un lazo de realimentación en Web Audio tiene un retardo
     mínimo de un bloque de render (128 muestras ≈ 2,9 ms), lo que
     techa la frecuencia en ~344 Hz — inservible para una guitarra.

   · Aditiva con relaciones armónicas reales para la percusión afinada.
     La marimba, por ejemplo, se afina para que su primer armónico esté
     a 4× la fundamental: eso es lo que la hace sonar a marimba y no a
     xilófono.

   El arreglista usa la estructura de la canción para decidir QUÉ suena
   en cada sección. Es la regla de dinámica de la estación 6 de la
   Fábrica, hecha código: intro 30% → verso 50% → coro 100%.
═══════════════════════════════════════════════════════════════ */
const MINST = (() => {
  'use strict';

  const A = () => MAUDIO.ac();
  const BUS = () => MAUDIO.bus();
  const f = m => MAUDIO.midiToFreq(m);

  /* ═══ Cuerda pulsada · Karplus-Strong ═════════════════════════ */
  const ksCache = new Map();

  function ksBuffer(freq, dur, brillo, decaimiento) {
    const a = A(), sr = a.sampleRate;
    const clave = Math.round(freq) + '|' + brillo + '|' + Math.round(dur * 10) + '|' + decaimiento;
    if (ksCache.has(clave)) return ksCache.get(clave);

    const N = Math.max(2, Math.round(sr / freq));
    const len = Math.ceil(sr * dur);
    const buf = a.createBuffer(1, len, sr);
    const out = buf.getChannelData(0);

    // Excitación: ruido, pero suavizado en los extremos para que el
    // ataque no sea un chasquido digital.
    const linea = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const v = Math.random() * 2 - 1;
      const ventana = Math.min(1, i / (N * 0.15), (N - i) / (N * 0.15));
      linea[i] = v * ventana;
    }

    let idx = 0, prev = 0;
    for (let i = 0; i < len; i++) {
      const cur = linea[idx];
      // Paso-bajos de un polo dentro del lazo: los agudos se apagan
      // antes que los graves, igual que en una cuerda real.
      const filt = brillo * cur + (1 - brillo) * prev;
      prev = filt;
      out[i] = cur;
      linea[idx] = filt * decaimiento;
      idx = (idx + 1) % N;
    }
    if (ksCache.size > 400) ksCache.clear();
    ksCache.set(clave, buf);
    return buf;
  }

  function cuerda(t, midi, dur, vel, cfg) {
    const a = A(); if (!a) return;
    const dp = Math.min(Math.max(dur, 0.35), 2.6);
    const buf = ksBuffer(f(midi), dp, cfg.brillo, cfg.dec);
    const s = a.createBufferSource(); s.buffer = buf;
    const g = a.createGain();
    const tono = a.createBiquadFilter();
    tono.type = 'lowpass'; tono.frequency.value = cfg.corte; tono.Q.value = 0.6;
    g.gain.setValueAtTime(vel * cfg.vol, t);
    g.gain.setValueAtTime(vel * cfg.vol, t + Math.min(dur, dp) * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.min(dur * 1.4, dp));
    s.connect(tono); tono.connect(g); g.connect(BUS());
    s.start(t); s.stop(t + dp + 0.05);
  }

  const guitarra = (t, o) => cuerda(t, o.midi, o.dur, o.vel, { brillo: 0.48, dec: 0.994, corte: 3600, vol: 0.20 });
  const requinto = (t, o) => cuerda(t, o.midi, o.dur, o.vel, { brillo: 0.62, dec: 0.9955, corte: 5200, vol: 0.19 });

  /* ═══ Acordeón · lengüetas ════════════════════════════════════
     Tres sierras muy poco desafinadas entre sí. El batido que produce
     ese desafine es exactamente lo que el oído lee como "fuelle". */
  function acordeon(t, o) {
    const a = A(); if (!a) return;
    const fr = f(o.midi), dur = Math.max(o.dur, 0.18);
    const g = a.createGain();
    const filtro = a.createBiquadFilter();
    filtro.type = 'bandpass'; filtro.frequency.value = Math.min(fr * 3.2, 2600); filtro.Q.value = 0.7;

    // Vibrato: el acordeonista mueve el fuelle, no es un tono fijo.
    const lfo = a.createOscillator(), lfoG = a.createGain();
    lfo.frequency.value = 5.2; lfoG.gain.value = 4.5;
    lfo.connect(lfoG);

    [-9, 0, 9].forEach(cents => {
      const osc = a.createOscillator();
      osc.type = 'sawtooth'; osc.frequency.value = fr; osc.detune.value = cents;
      lfoG.connect(osc.detune);
      osc.connect(filtro); osc.start(t); osc.stop(t + dur + 0.12);
    });

    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.vel * 0.11, t + 0.045);   // ataque de fuelle
    g.gain.setValueAtTime(o.vel * 0.11, t + dur * 0.8);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.09);
    filtro.connect(g); g.connect(BUS());
    lfo.start(t); lfo.stop(t + dur + 0.12);
  }

  /* ═══ Metales · sección de trompetas ══════════════════════════
     Lo que hace que un metal suene a metal es que el filtro se ABRE
     con el ataque y se cierra al sostener — el brillo llega después
     del golpe, no con él. */
  function metales(t, o) {
    const a = A(); if (!a) return;
    const fr = f(o.midi), dur = Math.max(o.dur, 0.14);
    const g = a.createGain();
    const filtro = a.createBiquadFilter();
    filtro.type = 'lowpass'; filtro.Q.value = 3;
    filtro.frequency.setValueAtTime(fr * 1.4, t);
    filtro.frequency.linearRampToValueAtTime(fr * 7, t + 0.05);
    filtro.frequency.exponentialRampToValueAtTime(fr * 3, t + dur);

    [-7, 5].forEach(c => {
      const osc = a.createOscillator();
      osc.type = 'sawtooth'; osc.frequency.value = fr; osc.detune.value = c;
      osc.connect(filtro); osc.start(t); osc.stop(t + dur + 0.1);
    });
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.vel * 0.13, t + 0.025);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.07);
    filtro.connect(g); g.connect(BUS());
  }

  /* ═══ Marimba ═════════════════════════════════════════════════
     Las barras de marimba se afinan para que el primer armónico caiga
     a 4× la fundamental (dos octavas arriba). Eso, y no el timbre, es
     lo que la distingue de un xilófono. */
  function marimba(t, o) {
    const a = A(); if (!a) return;
    const fr = f(o.midi);
    const g = a.createGain();
    [[1, 1], [4, 0.30], [10, 0.07]].forEach(([mult, amp]) => {
      const osc = a.createOscillator(), og = a.createGain();
      osc.type = 'sine'; osc.frequency.value = fr * mult;
      og.gain.setValueAtTime(o.vel * 0.16 * amp, t);
      og.gain.exponentialRampToValueAtTime(0.0001, t + (mult > 1 ? 0.16 : 0.85));
      osc.connect(og); og.connect(g); osc.start(t); osc.stop(t + 0.9);
    });
    g.connect(BUS());
  }

  /* ═══ Campana · síntesis FM ═══════════════════════════════════
     Una relación de frecuencias NO entera entre portadora y modulador
     produce parciales inarmónicos. Eso es una campana. */
  function campana(t, o) {
    const a = A(); if (!a) return;
    const fr = f(o.midi);
    const port = a.createOscillator(), mod = a.createOscillator();
    const modG = a.createGain(), g = a.createGain();
    port.type = 'sine'; port.frequency.value = fr;
    mod.type = 'sine';  mod.frequency.value = fr * 1.41;   // razón inarmónica
    modG.gain.setValueAtTime(fr * 2.2, t);
    modG.gain.exponentialRampToValueAtTime(1, t + 0.4);
    mod.connect(modG); modG.connect(port.frequency);
    g.gain.setValueAtTime(o.vel * 0.10, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
    port.connect(g); g.connect(BUS());
    port.start(t); mod.start(t); port.stop(t + 1.6); mod.stop(t + 1.6);
  }

  /* ═══ Flauta / gaita ══════════════════════════════════════════
     Un poco de ruido soplado mezclado con el tono: sin el aire suena
     a sintetizador, con el aire suena a alguien soplando. */
  function flauta(t, o) {
    const a = A(); if (!a) return;
    const fr = f(o.midi), dur = Math.max(o.dur, 0.16);
    const g = a.createGain();
    const osc = a.createOscillator();
    osc.type = 'triangle'; osc.frequency.value = fr;

    const lfo = a.createOscillator(), lfoG = a.createGain();
    lfo.frequency.value = 5.6; lfoG.gain.value = 7;
    lfo.connect(lfoG); lfoG.connect(osc.detune);

    // Soplo: ruido filtrado alrededor de la nota, muy bajito.
    const sr = a.sampleRate, nb = a.createBuffer(1, sr * 0.4, sr);
    const nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    const ns = a.createBufferSource(); ns.buffer = nb; ns.loop = true;
    const nf = a.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = fr * 2; nf.Q.value = 1.2;
    const ng = a.createGain(); ng.gain.value = o.vel * 0.018;

    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.vel * 0.10, t + 0.06);
    g.gain.setValueAtTime(o.vel * 0.10, t + dur * 0.75);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.08);

    osc.connect(g); ns.connect(nf); nf.connect(ng); ng.connect(g); g.connect(BUS());
    osc.start(t); lfo.start(t); ns.start(t);
    osc.stop(t + dur + 0.1); lfo.stop(t + dur + 0.1); ns.stop(t + dur + 0.1);
  }

  /* ═══ 808 ═════════════════════════════════════════════════════
     Un seno que cae de golpe al tono y luego sostiene largo. La
     saturación suave le da armónicos para que se oiga en un celular,
     donde no hay graves que reproducir. */
  function sub808(t, o) {
    const a = A(); if (!a) return;
    const fr = f(o.midi), dur = Math.max(o.dur, 0.3);
    const osc = a.createOscillator(), g = a.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(fr * 3.2, t);
    osc.frequency.exponentialRampToValueAtTime(fr, t + 0.05);

    const forma = a.createWaveShaper();
    const curva = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) { const x = i / 512 - 1; curva[i] = Math.tanh(x * 2.2); }
    forma.curve = curva;

    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.vel * 0.42, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(forma); forma.connect(g); g.connect(BUS());
    osc.start(t); osc.stop(t + dur + 0.05);
  }

  /* ═══ Stab · golpe de acorde corto ════════════════════════════ */
  function stabs(t, o) {
    const a = A(); if (!a) return;
    const fr = f(o.midi);
    const g = a.createGain();
    const filtro = a.createBiquadFilter();
    filtro.type = 'lowpass';
    filtro.frequency.setValueAtTime(4200, t);
    filtro.frequency.exponentialRampToValueAtTime(900, t + 0.22);
    const osc = a.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = fr;
    const osc2 = a.createOscillator(); osc2.type = 'square'; osc2.frequency.value = fr; osc2.detune.value = 6;
    const g2 = a.createGain(); g2.gain.value = 0.35;
    g.gain.setValueAtTime(o.vel * 0.075, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.min(o.dur, 0.42));
    osc.connect(filtro); osc2.connect(g2); g2.connect(filtro);
    filtro.connect(g); g.connect(BUS());
    osc.start(t); osc2.start(t); osc.stop(t + 0.5); osc2.stop(t + 0.5);
  }

  /* Registro en el motor: a partir de acá el scheduler los puede tocar. */
  MAUDIO.registerInst('guitarra', guitarra);
  MAUDIO.registerInst('requinto', requinto);
  MAUDIO.registerInst('acordeon', acordeon);
  MAUDIO.registerInst('metales',  metales);
  MAUDIO.registerInst('marimba',  marimba);
  MAUDIO.registerInst('campana',  campana);
  MAUDIO.registerInst('flauta',   flauta);
  MAUDIO.registerInst('808',      sub808);
  MAUDIO.registerInst('stabs',    stabs);
  MAUDIO.registerInst('montuno',  (t, o) => MAUDIO.voicePiano(f(o.midi), t, o.dur, 0.13 * o.vel));

  /* ═══════════════════════════════════════════════════════════════
     ARREGLISTA
  ═══════════════════════════════════════════════════════════════ */

  /* PRNG con semilla: el riff tiene que salir IGUAL cada vez que se
     toca la misma canción. Si cambiara en cada reproducción, Miguel no
     podría aprendérselo ni cantarle encima. */
  function rng(semilla) {
    let s = semilla >>> 0;
    return () => {
      s |= 0; s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const semillaDe = txt => {
    let h = 2166136261;
    for (let i = 0; i < txt.length; i++) { h ^= txt.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };

  /* ── Patrones de bajo · paso dentro del compás + duración ────── */
  const BAJO = {
    reggaeton: [[0, 3], [6, 2], [8, 3], [14, 2]],
    '808':     [[0, 7], [10, 5]],
    tumbao:    [[6, 2], [11, 1], [12, 4]],      // anticipa el tiempo, no cae en él
    vallenato: [[0, 3], [4, 2, 7], [8, 3], [12, 2, 7]],
    champeta:  [[0, 2], [6, 2], [8, 2], [14, 2]],
    cumbia:    [[0, 3], [6, 2], [8, 3], [12, 2, 7]],
    bachata:   [[0, 3], [7, 1], [8, 3], [14, 2]],
    afro:      [[0, 3], [3, 2], [6, 2], [10, 3], [13, 2]],
    regional:  [[0, 3], [4, 2, 7], [8, 3], [12, 2, 7]],
    pop:       [[0, 6], [8, 6]]
  };

  /* ── Patrones de armonía ─────────────────────────────────────── */
  const ARMONIA = {
    stabs:    [[4, 2], [12, 2]],                                 // contratiempo urbano
    piano:    [[0, 8], [8, 8]],
    pad:      [[0, 16]],
    guitarra: [[0, 2], [4, 2], [8, 2], [12, 2]],
    montuno:  [[0, 2], [3, 2], [6, 2], [8, 2], [11, 2], [14, 2]], // la figura de la salsa
    marimba:  [[0, 2], [6, 2], [10, 2]]
  };

  /* ── Ritmos de riff por género ───────────────────────────────── */
  const RIFF = {
    champeta:  [[0, 2], [3, 1], [6, 2], [8, 2], [11, 1], [14, 2]],
    vallenato: [[0, 2], [2, 2], [4, 2], [8, 2], [10, 2], [12, 4]],
    cumbia:    [[0, 3], [4, 2], [8, 3], [12, 2], [14, 2]],
    bachata:   [[2, 1], [3, 1], [6, 2], [10, 1], [11, 1], [14, 2]],
    regional:  [[0, 2], [2, 2], [5, 3], [8, 2], [10, 2], [13, 3]],
    salsa:     [[6, 2], [7, 1], [14, 2]],
    default:   [[0, 4], [6, 2], [8, 4], [14, 2]]
  };

  const ESC_MAY = [0, 2, 4, 5, 7, 9, 11];
  const ESC_MEN = [0, 2, 3, 5, 7, 8, 10];

  /** Cuánto suena en cada sección. Es la regla de dinámica de la
   *  estación 6 de la Fábrica: si todo está al 100% desde el compás 1,
   *  no queda hacia dónde crecer. */
  function densidad(nombre) {
    const n = (nombre || '').toLowerCase();
    if (n.includes('despeluque') || n.includes('break')) return 0.34;
    if (n.includes('intro')) return 0.3;
    if (n.includes('outro') || n.includes('cierre')) return 0.35;
    if (n.includes('pre')) return 0.65;
    if (n.includes('post')) return 0.9;
    if (n.includes('coro')) return 1;
    if (n.includes('gancho') || n.includes('hook')) return 0.9;
    if (n.includes('solo') || n.includes('mambo') || n.includes('nota') || n.includes('moña')) return 0.95;
    if (n.includes('montuno')) return 1;
    if (n.includes('verso') || n.includes('cuerpo')) return 0.5;
    if (n.includes('puente')) return 0.4;
    return 0.6;
  }
  const esSolo = n => /solo|mambo|nota|moña|despeluque/i.test(n || '');

  /**
   * Construye la canción completa.
   * @returns {{eventos, totalSteps, secciones, secPorPaso, compases}}
   */
  function construirCancion(opts) {
    const { genero, keyPc, mode, progresion, bloques, semillaTxt } = opts;
    const arr = genero.arreglo || { bajo: 'pop', armonia: 'piano', color: 'campana', lead: 'none', pad: true };
    const patron = genero.patron || {};
    const escala = mode === 'menor' ? ESC_MEN : ESC_MAY;
    const rand = rng(semillaDe(semillaTxt || (genero.id + keyPc + mode)));

    const eventos = [];
    const secciones = [];
    const secPorPaso = {};

    // Motivo del riff: se genera UNA vez y se reutiliza transpuesto a
    // cada acorde. Así el oído lo reconoce — que es lo que hace un hook.
    const ritmoRiff = RIFF[genero.id] || RIFF.default;
    const motivo = ritmoRiff.map((r, i) => {
      const contorno = [0, 2, 4, 2, 5, 3][i % 6];
      const salto = rand() < 0.25 ? 1 : 0;
      return { s: r[0], d: r[1], gradoEsc: (contorno + salto) % escala.length };
    });

    let compasGlobal = 0;

    (bloques || []).forEach(([nombre, compases]) => {
      const d = densidad(nombre);
      const solo = esSolo(nombre);
      secciones.push({ nombre, compas: compasGlobal, compases, densidad: d, solo });
      secPorPaso[compasGlobal * 16] = secciones.length - 1;

      for (let b = 0; b < compases; b++) {
        const base = (compasGlobal + b) * 16;
        const acorde = progresion[(compasGlobal + b) % progresion.length];
        if (!acorde) continue;
        const midis = MAUDIO.chordMidis(acorde.pc, acorde.qual);      // registro medio
        const raiz = acorde.pc;
        const ultimoCompasDeSeccion = b === compases - 1;

        /* ── Percusión ── */
        const push = (i, s, m, dur, v, o) => eventos.push({ i, s: base + s, m, d: dur, v, o });
        const golpes = (fila, inst, vel, gate) => {
          if (d < gate) return;
          (patron[fila] || []).forEach(n => push(inst, n - 1, null, 1, vel));
        };
        golpes('hat', 'hat', 0.75 * Math.min(1, d + 0.2), 0.34);
        golpes('kick', 'kick', 0.95, 0.4);
        golpes('clap', 'clap', 0.9, 0.5);
        golpes('snare', 'snare', 0.85, 0.5);
        golpes('perc', 'perc', 0.6, 0.6);
        golpes('clave', 'clave', 0.7, 0.45);

        /* ── Bajo ── */
        if (d >= 0.45 && !nombre.toLowerCase().includes('despeluque')) {
          const pat = BAJO[arr.bajo] || BAJO.pop;
          pat.forEach(([s, dur, quinta]) => {
            const semi = quinta ? quinta : 0;
            const midi = 36 + raiz + semi;     // Do2–Si2
            push(arr.bajo === '808' ? '808' : 'bajo', s, midi, dur, 0.9);
          });
        }

        /* ── Armonía ── */
        if (d >= 0.25) {
          const pat = ARMONIA[arr.armonia] || ARMONIA.piano;
          const vel = 0.55 + d * 0.45;
          pat.forEach(([s, dur], k) => {
            const notas = arr.armonia === 'guitarra'
              ? [midis[k % midis.length], midis[(k + 1) % midis.length] + 12]   // arpegiada
              : midis;
            notas.forEach((m, j) => push(arr.armonia === 'montuno' ? 'montuno' : arr.armonia,
                                         s, m, dur, vel * (j ? 0.85 : 1)));
          });
        }

        /* ── Colchón ── */
        if (arr.pad && d >= 0.6) midis.forEach(m => push('pad', 0, m + 12, 16, 0.5 + d * 0.3));

        /* ── Color: un adorno, no una capa constante ── */
        if (d >= 0.7 && arr.color !== 'none' && (b % 2 === 0)) {
          const m = midis[1 % midis.length] + 12;
          push(arr.color, d >= 0.9 ? 8 : 12, m, 3, 0.5);
        }

        /* ── Melodía / riff ── */
        const tocaLead = arr.lead !== 'none' && (solo || d >= 0.8);
        if (tocaLead) {
          motivo.forEach(mv => {
            const semi = escala[mv.gradoEsc % escala.length];
            const midi = 60 + raiz + semi + (solo ? 12 : 0);
            push(arr.lead, mv.s, midi, mv.d, solo ? 0.95 : 0.62);
          });
        }

        /* ── Remate de sección: un golpe que avisa que algo cambia ── */
        if (ultimoCompasDeSeccion && d >= 0.5) {
          push('perc', 14, null, 1, 0.8);
          push('perc', 15, null, 1, 0.95);
        }
      }
      compasGlobal += compases;
    });

    return {
      eventos,
      compases: compasGlobal,
      totalSteps: compasGlobal * 16,
      secciones,
      secPorPaso
    };
  }

  /** Duración en segundos, para mostrarla antes de darle a tocar. */
  const duracion = (totalSteps, bpm) => (totalSteps / 4) * (60 / bpm);
  const mmss = seg => Math.floor(seg / 60) + ':' + String(Math.round(seg % 60)).padStart(2, '0');

  /* El caché de cuerdas guarda AudioBuffers, y un AudioBuffer no se
     puede usar en un contexto distinto del que lo creó. Al entrar o
     salir de un render offline hay que vaciarlo. */
  const limpiarCache = () => ksCache.clear();

  return { construirCancion, duracion, mmss, densidad, limpiarCache, BAJO, ARMONIA, RIFF };
})();

window.MINST = MINST;
