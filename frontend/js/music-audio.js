/* ═══════════════════════════════════════════════════════════════
   18-MUS · Motor de audio · Web Audio API pura (sin librerías)
   ─────────────────────────────────────────────────────────────
   Por qué existe: Miguel no sabe acordes ni lee partitura. Leer
   "i–VI–III–VII" no le dice nada; OÍRLO sí. Este motor convierte
   los datos del cerebro musical en sonido real dentro del browser.

   Sintetiza todo desde cero (osciladores + ruido + envolventes) —
   cero samples, cero red, cero dependencias. Funciona offline,
   igual que el resto del Cerebro.

   Scheduler de lookahead: setTimeout despierta cada 25ms y agenda
   los eventos de los próximos 100ms con el reloj de alta precisión
   de AudioContext. El timer de JS decide QUÉ agendar; el reloj de
   audio decide CUÁNDO suena. Si se hiciera solo con setTimeout el
   ritmo se arrastraría de forma audible.
═══════════════════════════════════════════════════════════════ */
const MAUDIO = (() => {
  'use strict';

  let ac = null, master = null, noiseBuf = null;

  const NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const NOTES_ES = ['Do','Do#','Re','Re#','Mi','Fa','Fa#','Sol','Sol#','La','La#','Si'];
  /* La misma tecla del piano tiene dos nombres. Cuál se escribe no es
     cosmético: en Do menor un músico escribe Cm–Ab–Eb–Bb, nunca
     Cm–G#–D#–A#. Escribirlo con sostenidos delata al que no sabe. */
  const NOTES_FLAT = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];

  /* Tonalidades que por convención se escriben con bemoles (círculo de
     quintas hacia el lado de los bemoles). */
  const FLAT_MAJ = new Set([5, 10, 3, 8, 1, 6]);   // Fa Sib Mib Lab Reb Solb
  const FLAT_MIN = new Set([2, 7, 0, 5, 10, 3]);   // Rem Solm Dom Fam Sibm Mibm
  const useFlats = (keyPc, mode) => (mode === 'menor' ? FLAT_MIN : FLAT_MAJ).has(((keyPc % 12) + 12) % 12);

  /* ── Intervalos de cada tipo de acorde (semitonos desde la raíz) ── */
  const QUAL = {
    maj:  [0,4,7],      min:  [0,3,7],      dim:  [0,3,6],
    aug:  [0,4,8],      sus4: [0,5,7],      sus2: [0,2,7],
    '7':  [0,4,7,10],   m7:   [0,3,7,10],   maj7: [0,4,7,11],
    m7b5: [0,3,6,10],   add9: [0,4,7,14],   m9:   [0,3,7,10,14]
  };

  /* ── Grado romano → [semitonos desde la tónica, calidad] ──
     Dos tablas porque el mismo símbolo significa cosas distintas
     según el contexto: "VI" en menor es el 6º bemol (8 semitonos),
     no el 6º natural. */
  const DEG_MAJ = {
    I:[0,'maj'], ii:[2,'min'], iii:[4,'min'], IV:[5,'maj'],
    V:[7,'maj'], vi:[9,'min'], vii:[11,'dim'],
    i:[0,'min'], iv:[5,'min'], v:[7,'min'], bVII:[10,'maj'], bIII:[3,'maj'], bVI:[8,'maj']
  };
  const DEG_MIN = {
    i:[0,'min'], ii:[2,'dim'], III:[3,'maj'], iv:[5,'min'],
    v:[7,'min'], V:[7,'maj'], VI:[8,'maj'], VII:[10,'maj'],
    I:[0,'maj'], IV:[5,'maj'], bII:[1,'maj'], vi:[9,'dim']
  };

  /* ═══ Contexto de audio ═══════════════════════════════════════
     Se crea perezosamente: los navegadores bloquean el audio hasta
     que hay un gesto del usuario. La primera llamada viene siempre
     desde un click. */
  /** Ruido blanco reutilizable: base de caja, hi-hat y palmas.
   *  Va atado al contexto porque un AudioBuffer no se puede usar en un
   *  contexto distinto del que lo creó. */
  function hacerRuido(contexto) {
    const len = contexto.sampleRate * 2;
    const b = contexto.createBuffer(1, len, contexto.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }

  const esOffline = c => c && typeof c.startRendering === 'function';

  function ctx() {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ac = new AC();
      master = ac.createGain();
      master.gain.value = 0.75;
      master.connect(ac.destination);
      noiseBuf = hacerRuido(ac);
    }
    // Un OfflineAudioContext también nace 'suspended', pero llamarle
    // resume() lo arranca fuera de startRendering() y arruina el render.
    if (ac.state === 'suspended' && !esOffline(ac)) ac.resume();
    return ac;
  }

  /* ═══ Render offline ══════════════════════════════════════════
     Para exportar no se graba la reproducción en tiempo real: se
     redirige todo el motor a un OfflineAudioContext y se renderiza
     tan rápido como pueda la máquina. Una canción de 3 minutos sale
     en un par de segundos, sin pérdida y sin ruido de la tarjeta. */
  let _liveAc = null, _liveMaster = null, _liveNoise = null;

  function beginRender(off) {
    _liveAc = ac; _liveMaster = master; _liveNoise = noiseBuf;
    ac = off;
    master = off.createGain();
    master.gain.value = 0.75;
    master.connect(off.destination);
    noiseBuf = hacerRuido(off);
    if (window.MINST && MINST.limpiarCache) MINST.limpiarCache();
    return master;
  }
  function endRender() {
    ac = _liveAc; master = _liveMaster; noiseBuf = _liveNoise;
    _liveAc = _liveMaster = _liveNoise = null;
    if (window.MINST && MINST.limpiarCache) MINST.limpiarCache();
  }
  /** Dispara un instrumento en un instante concreto. Lo usa el
   *  exportador para agendar la canción entera de una sola vez. */
  function playInst(nombre, t, opts) {
    const fn = INSTS[nombre];
    if (fn) fn(t, opts || {});
  }

  const supported = () => !!(window.AudioContext || window.webkitAudioContext);
  const midiToFreq = m => 440 * Math.pow(2, (m - 69) / 12);
  const noteName   = (pc, es) => (es ? NOTES_ES : NOTES)[((pc % 12) + 12) % 12];
  const nameToPc   = n => {
    for (const tabla of [NOTES, NOTES_FLAT, NOTES_ES]) {
      const i = tabla.indexOf(n);
      if (i >= 0) return i;
    }
    return 0;
  };

  /* ═══ Voces melódicas ═════════════════════════════════════════ */

  /** Piano eléctrico: triangular (cuerpo) + seno (ataque), filtro
   *  que se cierra al decaer — imita cómo un piano real pierde
   *  brillo antes que volumen. */
  function voicePiano(freq, t, dur, gain) {
    const a = ctx(); if (!a) return;
    const g = a.createGain();
    const f = a.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(Math.min(freq * 8, 8000), t);
    f.frequency.exponentialRampToValueAtTime(Math.max(freq * 2, 200), t + dur * 0.7);
    f.Q.value = 0.7;

    const o1 = a.createOscillator(); o1.type = 'triangle'; o1.frequency.value = freq;
    const o2 = a.createOscillator(); o2.type = 'sine';     o2.frequency.value = freq * 2;
    const g2 = a.createGain(); g2.gain.value = 0.25;

    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    o1.connect(f); o2.connect(g2); g2.connect(f);
    f.connect(g); g.connect(master);
    o1.start(t); o2.start(t);
    o1.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
  }

  /** Pad: dos sierras desafinadas entre sí. El desafine mínimo es
   *  lo que produce la sensación de "ancho" y de conjunto. */
  function voicePad(freq, t, dur, gain) {
    const a = ctx(); if (!a) return;
    const g = a.createGain();
    const f = a.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 1800; f.Q.value = 0.5;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.12);
    g.gain.setValueAtTime(gain, t + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    [-6, 6].forEach(cents => {
      const o = a.createOscillator();
      o.type = 'sawtooth'; o.frequency.value = freq; o.detune.value = cents;
      o.connect(f); o.start(t); o.stop(t + dur + 0.05);
    });
    f.connect(g); g.connect(master);
  }

  /** Bajo: seno con un armónico. Grave y limpio, sin ensuciar el kick. */
  function voiceBass(freq, t, dur, gain) {
    const a = ctx(); if (!a) return;
    const g = a.createGain();
    const o = a.createOscillator(); o.type = 'sine'; o.frequency.value = freq;
    const o2 = a.createOscillator(); o2.type = 'triangle'; o2.frequency.value = freq * 2;
    const g2 = a.createGain(); g2.gain.value = 0.12;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); o2.connect(g2); g2.connect(g); g.connect(master);
    o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
  }

  /* ═══ Percusión · sintetizada a buffer ════════════════════════
     Cada sonido se calcula UNA sola vez como forma de onda en JavaScript
     y se cachea por contexto. Antes cada golpe montaba su propio grafo:
     unas palmas eran nueve nodos (tres ráfagas × fuente + filtro +
     ganancia), y en un tema de 3 minutos eso son casi tres mil nodos
     solo de palmas — exportar se volvía inviable.

     Una caja de ritmos real funciona así: el sonido es fijo y se
     dispara. Y hay una razón musical además de la de rendimiento: si
     cada golpe se sintetizara con ruido nuevo, lo exportado NO sonaría
     igual que lo monitoreado, y una mezcla que no coincide con su
     archivo es una mezcla que no sirve. */

  const percCache = new WeakMap();   // contexto → Map(tipo → AudioBuffer)

  const PERC_DUR = { kick:0.42, snare:0.24, clap:0.26, hat:0.07, hatOpen:0.30, perc:0.24, clave:0.09 };
  /* Volúmenes relativos: dejan el kit equilibrado sin tocar nada. El
     hi-hat va muy abajo porque su energía cae donde el oído es más
     sensible y a igual amplitud se percibe mucho más fuerte. */
  const PERC_VOL = { kick:1.0, snare:0.70, clap:0.75, hat:0.28, hatOpen:0.30, perc:0.60, clave:0.50 };

  function hacerPerc(tipo, sr) {
    const dur = PERC_DUR[tipo] || 0.3;
    const n = Math.ceil(sr * dur);
    const d = new Float32Array(n);
    const rnd = () => Math.random() * 2 - 1;

    if (tipo === 'kick') {
      // La caída de 150 Hz a 45 Hz en unos 25 ms ES el "boom".
      let fase = 0;
      for (let i = 0; i < n; i++) {
        const t = i / sr;
        const f = 45 + 105 * Math.exp(-t / 0.024);
        fase += 2 * Math.PI * f / sr;
        d[i] = Math.sin(fase) * Math.exp(-t / 0.105);
      }

    } else if (tipo === 'hat' || tipo === 'hatOpen') {
      const dec = tipo === 'hat' ? 0.013 : 0.075;
      const ah = 1 / (1 + 2 * Math.PI * 7500 / sr);   // paso-altos de un polo
      let y = 0, xp = 0;
      for (let i = 0; i < n; i++) {
        const x = rnd();
        y = ah * (y + x - xp); xp = x;
        d[i] = y * Math.exp(-(i / sr) / dec);
      }

    } else if (tipo === 'snare') {
      // Ruido con banda + un tono corto que le da cuerpo. Sin el tono
      // suena a "psh"; sin el ruido, a tambor de juguete.
      const ah = 1 / (1 + 2 * Math.PI * 900 / sr);
      const al = 2 * Math.PI * 4500 / sr;
      let hp = 0, xp = 0, lp = 0, fase = 0;
      for (let i = 0; i < n; i++) {
        const t = i / sr, x = rnd();
        hp = ah * (hp + x - xp); xp = x;
        lp += al * (hp - lp);
        fase += 2 * Math.PI * 190 / sr;
        d[i] = lp * Math.exp(-t / 0.055) * 0.85 + Math.sin(fase) * Math.exp(-t / 0.030) * 0.45;
      }

    } else if (tipo === 'clap') {
      // Tres ráfagas separadas ~9 ms: eso es lo que el oído interpreta
      // como varias manos y no como un solo golpe.
      const rafagas = [0, 0.009, 0.019];
      const ah = 1 / (1 + 2 * Math.PI * 800 / sr);
      const al = 2 * Math.PI * 2600 / sr;
      let hp = 0, xp = 0, lp = 0;
      for (let i = 0; i < n; i++) {
        const t = i / sr, x = rnd();
        hp = ah * (hp + x - xp); xp = x;
        lp += al * (hp - lp);
        let env = 0;
        for (let k = 0; k < 3; k++) {
          const dt = t - rafagas[k];
          if (dt >= 0) env += Math.exp(-dt / (k === 2 ? 0.055 : 0.006)) * (k === 2 ? 1 : 0.55);
        }
        d[i] = lp * Math.min(env, 1.4);
      }

    } else if (tipo === 'perc') {
      const al = 2 * Math.PI * 2600 / sr;
      let fase = 0, lp = 0;
      for (let i = 0; i < n; i++) {
        const t = i / sr;
        const f = 190 + 150 * Math.exp(-t / 0.02);
        fase += 2 * Math.PI * f / sr;
        lp += al * (rnd() - lp);
        d[i] = Math.sin(fase) * Math.exp(-t / 0.055) * 0.9 + lp * Math.exp(-t / 0.008) * 0.25;
      }

    } else if (tipo === 'clave') {
      let f1 = 0, f2 = 0;
      for (let i = 0; i < n; i++) {
        const t = i / sr;
        f1 += 2 * Math.PI * 2400 / sr;
        f2 += 2 * Math.PI * 1180 / sr;
        d[i] = (Math.sin(f1) * 0.6 + Math.sin(f2) * 0.4) * Math.exp(-t / 0.014);
      }
    }

    // Normaliza: así los valores de PERC_VOL significan lo mismo para
    // todos y no dependen de cómo salió cada síntesis.
    let pico = 0;
    for (let i = 0; i < n; i++) { const v = Math.abs(d[i]); if (v > pico) pico = v; }
    if (pico > 0) { const k = 0.95 / pico; for (let i = 0; i < n; i++) d[i] *= k; }
    return d;
  }

  function bufPerc(tipo) {
    const a = ctx();
    let mapa = percCache.get(a);
    if (!mapa) { mapa = new Map(); percCache.set(a, mapa); }
    let b = mapa.get(tipo);
    if (!b) {
      const datos = hacerPerc(tipo, a.sampleRate);
      b = a.createBuffer(1, datos.length, a.sampleRate);
      b.copyToChannel(datos, 0);
      mapa.set(tipo, b);
    }
    return b;
  }

  /** Dispara un golpe: fuente + ganancia. Dos nodos, no nueve. */
  function golpe(tipo, t, v) {
    const a = ctx(); if (!a) return;
    const s = a.createBufferSource();
    s.buffer = bufPerc(tipo);
    const g = a.createGain();
    g.gain.value = (v == null ? 1 : v) * (PERC_VOL[tipo] || 0.7);
    s.connect(g); g.connect(master);
    s.start(t);
  }

  const drKick  = (t, v = 1) => golpe('kick', t, v);
  const drSnare = (t, v = 1) => golpe('snare', t, v);
  const drClap  = (t, v = 1) => golpe('clap', t, v);
  const drHat   = (t, v = 1, open = false) => golpe(open ? 'hatOpen' : 'hat', t, v);
  const drPerc  = (t, v = 1) => golpe('perc', t, v);
  const drClave = (t, v = 1) => golpe('clave', t, v);

  const DRUMS = { kick: drKick, snare: drSnare, clap: drClap, hat: drHat, perc: drPerc, clave: drClave };

  /* ═══ Registro de instrumentos ════════════════════════════════
     Firma única `fn(tiempo, {midi, dur, vel})` para que el scheduler
     no tenga que saber si lo que toca es un bombo o un acordeón.
     music-inst.js añade aquí los timbres de género (guitarra, acordeón,
     metales…) sin tocar este archivo. */
  const INSTS = {
    kick:  (t, o) => drKick(t, o.vel),
    snare: (t, o) => drSnare(t, o.vel),
    clap:  (t, o) => drClap(t, o.vel),
    hat:   (t, o) => drHat(t, o.vel, o.open),
    perc:  (t, o) => drPerc(t, o.vel),
    clave: (t, o) => drClave(t, o.vel),
    piano: (t, o) => voicePiano(midiToFreq(o.midi), t, o.dur, 0.15 * o.vel),
    pad:   (t, o) => voicePad(midiToFreq(o.midi), t, o.dur, 0.09 * o.vel),
    bajo:  (t, o) => voiceBass(midiToFreq(o.midi), t, o.dur, 0.30 * o.vel)
  };
  function registerInst(nombre, fn) { INSTS[nombre] = fn; }
  const hasInst = n => !!INSTS[n];

  /** Toca `fn` enrutando su salida a otro nodo en vez del bus principal.
   *
   *  Funciona sin tocar ni uno de los quince instrumentos porque todos
   *  leen `master` en el momento de la llamada, de forma síncrona: se
   *  intercambia antes y se restaura después. Es lo que permite que
   *  cada pista tenga su propio volumen y panorama de verdad, en vez de
   *  falsear el volumen escalando la velocidad de las notas. */
  function withDest(nodo, fn) {
    if (!nodo) return fn();
    const prev = master;
    master = nodo;
    try { return fn(); } finally { master = prev; }
  }

  /* ═══ Acordes ═════════════════════════════════════════════════ */

  /** "V7" o "imaj7" → { pc, qual, label }
   *  Separa la parte romana del sufijo y resuelve la calidad según
   *  el contexto (mayor o menor). */
  function parseDegree(token, keyPc, mode) {
    const m = String(token).trim().match(/^(b?[IViv]+)(.*)$/);
    if (!m) return null;
    const roman = m[1], suffix = (m[2] || '').trim();
    const table = mode === 'menor' ? DEG_MIN : DEG_MAJ;
    const entry = table[roman] || DEG_MAJ[roman] || DEG_MIN[roman];
    if (!entry) return null;

    let [semis, qual] = entry;
    if (suffix === '7')          qual = qual === 'maj' ? '7' : qual === 'min' ? 'm7' : 'm7b5';
    else if (suffix === 'maj7')  qual = 'maj7';
    else if (suffix === 'sus4')  qual = 'sus4';
    else if (suffix === '9')     qual = qual === 'min' ? 'm9' : 'add9';

    const pc = (keyPc + semis) % 12;
    return { pc, qual, roman, label: chordLabel(pc, qual, useFlats(keyPc, mode)) };
  }

  function chordLabel(pc, qual, flat) {
    const i = ((pc % 12) + 12) % 12;
    const n = flat ? NOTES_FLAT[i] : NOTES[i];
    const sfx = { maj:'', min:'m', dim:'dim', aug:'aug', sus4:'sus4', sus2:'sus2',
                  '7':'7', m7:'m7', maj7:'maj7', m7b5:'m7b5', add9:'add9', m9:'m9' };
    return n + (sfx[qual] !== undefined ? sfx[qual] : '');
  }

  /** Notas MIDI de un acorde, mantenidas en un registro cómodo
   *  (raíz entre Do3 y Si3) para que la progresión no salte de
   *  octava en octava al cambiar de acorde. */
  function chordMidis(pc, qual, base = 48) {
    const iv = QUAL[qual] || QUAL.maj;
    let root = base + pc;
    while (root < base) root += 12;
    while (root >= base + 12) root -= 12;
    return iv.map(i => root + i);
  }

  function playChordNow(pc, qual, opts = {}) {
    const a = ctx(); if (!a) return;
    const t = a.currentTime + 0.02;
    const dur = opts.dur || 1.3;
    const midis = chordMidis(pc, qual);
    midis.forEach((m, i) => voicePiano(midiToFreq(m), t + i * 0.012, dur, 0.17));
    if (opts.bass !== false) voiceBass(midiToFreq(midis[0] - 24), t, dur * 0.8, 0.34);
  }

  function playNoteNow(midi, dur = 0.9) {
    const a = ctx(); if (!a) return;
    voicePiano(midiToFreq(midi), a.currentTime + 0.02, dur, 0.24);
  }

  /* ═══ Scheduler ═══════════════════════════════════════════════ */

  let timer = null, playing = false;
  let nextTime = 0, step = 0, bar = 0;
  let cfg = null;
  const visQueue = [];

  const LOOKAHEAD_MS = 25;
  const AHEAD_S = 0.12;

  function scheduleStep(s, t) {
    const p = cfg.pattern || {};
    const V = cfg.drumVol === undefined ? 1 : cfg.drumVol;

    if (cfg.drums !== false && V > 0) {
      // Los patrones vienen 1-indexados desde music-kb.json porque
      // así los cuenta un músico ("el golpe del 4"), no como índice.
      const n = s + 1;
      if (p.kick  && p.kick.includes(n))  DRUMS.kick(t, V);
      if (p.clap  && p.clap.includes(n))  DRUMS.clap(t, V);
      if (p.snare && p.snare.includes(n)) DRUMS.snare(t, V);
      if (p.hat   && p.hat.includes(n))   DRUMS.hat(t, V * 0.9);
      if (p.perc  && p.perc.includes(n))  DRUMS.perc(t, V * 0.7);
      if (p.clave && p.clave.includes(n)) DRUMS.clave(t, V);
    }

    // Los acordes entran en el primer paso de cada compás.
    if (cfg.chords && cfg.chords.length && s === 0) {
      const ch = cfg.chords[bar % cfg.chords.length];
      if (ch) {
        const beatS = 60 / cfg.bpm;
        const barS = beatS * 4;
        const midis = chordMidis(ch.pc, ch.qual);
        const voice = cfg.voice === 'pad' ? voicePad : voicePiano;
        midis.forEach((m, i) => voice(midiToFreq(m), t + i * 0.01, barS * 0.95, cfg.voice === 'pad' ? 0.1 : 0.15));
        if (cfg.bass !== false) voiceBass(midiToFreq(midis[0] - 24), t, barS * 0.85, 0.3);
        visQueue.push({ type: 'chord', bar: bar % cfg.chords.length, t });
      }
    }
    visQueue.push({ type: 'step', step: s, t });
  }

  /** Modo canción: en vez de un compás en bucle, recorre una lista de
   *  eventos en posiciones absolutas. `porPaso` viene precalculado como
   *  array indexado por paso — buscar en él es O(1), que es lo que hace
   *  falta cuando el scheduler corre cada 25 ms durante 3 minutos. */
  function scheduleSongStep(s, t) {
    const stepS = (60 / cfg.bpm) / 4;
    const evs = cfg.porPaso[s];
    if (evs) {
      for (const e of evs) {
        const fn = INSTS[e.i];
        if (!fn) continue;
        const opts = { midi: e.m, dur: (e.d || 1) * stepS * 0.95, vel: e.v == null ? 1 : e.v, open: e.o };
        const dest = e.p && cfg.dests ? cfg.dests[e.p] : null;
        if (dest) withDest(dest, () => fn(t, opts)); else fn(t, opts);
      }
    }
    visQueue.push({ type: 'step', step: s % 16, t, abs: s });
    if (cfg.secPorPaso && cfg.secPorPaso[s] !== undefined) {
      visQueue.push({ type: 'sec', sec: cfg.secPorPaso[s], t });
    }
  }

  function tick() {
    const a = ctx(); if (!a) return;
    if (cfg.mode === 'song') {
      const stepDur = (60 / cfg.bpm) / 4;
      while (nextTime < a.currentTime + AHEAD_S) {
        if (step >= cfg.totalSteps) {
          // Deja sonar las colas (reverb, notas largas) antes de cortar.
          const fin = nextTime + 1.6;
          setTimeout(() => { if (playing) { stop(); if (cfg && cfg.onEnd) cfg.onEnd(); } },
                     Math.max(0, (fin - a.currentTime) * 1000));
          return;
        }
        scheduleSongStep(step, nextTime);
        nextTime += stepDur;
        step++;
      }
    } else {
      const steps = cfg.steps || 16;
      const stepDur = (60 / cfg.bpm) / (steps / 4);   // 16 pasos = semicorcheas en 4/4
      while (nextTime < a.currentTime + AHEAD_S) {
        scheduleStep(step, nextTime);
        nextTime += stepDur;
        step++;
        if (step >= steps) { step = 0; bar++; }
      }
    }
    timer = setTimeout(tick, LOOKAHEAD_MS);
  }

  /** Bucle visual: dispara los callbacks cuando el reloj de audio alcanza
   *  el evento, para que la casilla se ilumine justo con el golpe y no
   *  cuando lo agendamos.
   *
   *  Va con setInterval y no con requestAnimationFrame a propósito.
   *  rAF depende de que el navegador esté componiendo la página: si la
   *  pestaña no se está pintando (segundo plano, ventana tapada, algunos
   *  contextos embebidos) se queda en CERO frames, el audio sigue sonando
   *  y el usuario pierde justo lo que enseña — ver dónde cae el pulso.
   *  A 16 pasos por compás esto va como mucho a ~16 Hz: un timer de 16 ms
   *  sobra, y no se lo puede matar el compositor. */
  let visTimer = null;
  function visDrain() {
    if (!playing || !ac) return;
    while (visQueue.length && visQueue[0].t <= ac.currentTime) {
      const e = visQueue.shift();
      if (e.type === 'step' && cfg.onStep) cfg.onStep(e.step, e.abs);
      if (e.type === 'chord' && cfg.onChord) cfg.onChord(e.bar);
      if (e.type === 'sec' && cfg.onSection) cfg.onSection(e.sec);
    }
  }

  /** Arranca una canción completa a partir de una lista de eventos.
   *  `eventos`: [{i:instrumento, s:paso absoluto, m:midi, d:duración en
   *  pasos, v:velocidad}]. */
  function startSong(options) {
    stop();
    const a = ctx(); if (!a) return false;
    const o = options || {};
    const porPaso = [];
    for (const e of (o.eventos || [])) {
      (porPaso[e.s] || (porPaso[e.s] = [])).push(e);
    }
    cfg = Object.assign({ mode: 'song', bpm: 95 }, o, { porPaso });
    step = 0; bar = 0;
    visQueue.length = 0;
    nextTime = a.currentTime + 0.08;
    playing = true;
    tick();
    visTimer = setInterval(visDrain, 16);
    return true;
  }

  function start(options) {
    stop();
    const a = ctx(); if (!a) return false;
    cfg = Object.assign({ bpm: 95, steps: 16, drums: true }, options || {});
    step = 0; bar = 0;
    visQueue.length = 0;
    nextTime = a.currentTime + 0.06;
    playing = true;
    tick();
    visTimer = setInterval(visDrain, 16);
    return true;
  }

  function stop() {
    playing = false;
    if (timer) { clearTimeout(timer); timer = null; }
    if (visTimer) { clearInterval(visTimer); visTimer = null; }
    visQueue.length = 0;
    if (cfg && cfg.onStop) cfg.onStop();
  }

  function setBpm(b) { if (cfg) cfg.bpm = b; }
  function setDrumVol(v) { if (cfg) cfg.drumVol = v; }
  function setMasterVol(v) { if (master) master.gain.value = v; }

  /** Convierte una progresión en grados a acordes concretos. */
  function buildProgression(grados, keyPc, mode) {
    return (grados || []).map(g => parseDegree(g, keyPc, mode)).filter(Boolean);
  }

  return {
    supported, unlock: ctx, isPlaying: () => playing,
    NOTES, NOTES_ES, NOTES_FLAT, useFlats, nameToPc, noteName, midiToFreq,
    parseDegree, buildProgression, chordLabel, chordMidis,
    playChordNow, playNoteNow, hit: (k, v) => { ctx(); DRUMS[k] && DRUMS[k](ac.currentTime + 0.02, v || 1); },
    start, startSong, stop, setBpm, setDrumVol, setMasterVol,
    // Acceso para music-inst.js y music-studio.js: comparten el mismo
    // AudioContext y el mismo bus. Dos contextos en la misma página
    // significan dos relojes distintos — y ahí se acabó la sincronía.
    ac: () => ctx(), bus: () => { ctx(); return master; },
    registerInst, hasInst, withDest, QUAL, voicePiano, voicePad, voiceBass,
    beginRender, endRender, playInst, listaInst: () => Object.keys(INSTS)
  };
})();

/* Un `const` de nivel superior en un script clásico vive en el ámbito léxico
   global, NO como propiedad de window: `MAUDIO` resuelve, pero `window.MAUDIO`
   es undefined. music.js consulta la forma con window para degradar con
   elegancia si el motor no cargó, así que hay que publicarlo explícitamente
   — igual que nb-shared.js hace con window.NBShared. */
window.MAUDIO = MAUDIO;
