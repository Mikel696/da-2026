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
  function ctx() {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ac = new AC();
      master = ac.createGain();
      master.gain.value = 0.75;
      master.connect(ac.destination);
      // Ruido blanco reutilizable: base de caja, hi-hat y palmas.
      const len = ac.sampleRate * 2;
      noiseBuf = ac.createBuffer(1, len, ac.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ac.state === 'suspended') ac.resume();
    return ac;
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

  /* ═══ Percusión sintetizada ═══════════════════════════════════ */

  function noiseSrc(t, dur) {
    const a = ctx();
    const s = a.createBufferSource();
    s.buffer = noiseBuf;
    s.playbackRate.value = 1;
    s.start(t, Math.random() * 1.5, dur + 0.02);
    return s;
  }

  /** Bombo: la caída de tono de 150Hz a 45Hz en 90ms ES el "boom". */
  function drKick(t, v = 1) {
    const a = ctx(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.09);
    g.gain.setValueAtTime(v * 1.0, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.36);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + 0.4);
  }

  /** Caja: ruido filtrado + un tono corto que le da el "cuerpo". */
  function drSnare(t, v = 1) {
    const a = ctx(); if (!a) return;
    const n = noiseSrc(t, 0.2), nf = a.createBiquadFilter(), ng = a.createGain();
    nf.type = 'bandpass'; nf.frequency.value = 1900; nf.Q.value = 0.7;
    ng.gain.setValueAtTime(v * 0.55, t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.17);
    n.connect(nf); nf.connect(ng); ng.connect(master);

    const o = a.createOscillator(), og = a.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(190, t);
    og.gain.setValueAtTime(v * 0.35, t);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    o.connect(og); og.connect(master); o.start(t); o.stop(t + 0.12);
  }

  /** Palmas: tres ráfagas de 8ms separadas. Esa separación es lo
   *  que el oído lee como "varias manos" y no como una sola. */
  function drClap(t, v = 1) {
    const a = ctx(); if (!a) return;
    [0, 0.009, 0.018].forEach((off, i) => {
      const n = noiseSrc(t + off, 0.06), f = a.createBiquadFilter(), g = a.createGain();
      f.type = 'bandpass'; f.frequency.value = 1250; f.Q.value = 1.2;
      g.gain.setValueAtTime(v * (i === 2 ? 0.6 : 0.32), t + off);
      g.gain.exponentialRampToValueAtTime(0.0001, t + off + (i === 2 ? 0.15 : 0.04));
      n.connect(f); f.connect(g); g.connect(master);
    });
  }

  function drHat(t, v = 1, open = false) {
    const a = ctx(); if (!a) return;
    const dur = open ? 0.22 : 0.045;
    const n = noiseSrc(t, dur), f = a.createBiquadFilter(), g = a.createGain();
    f.type = 'highpass'; f.frequency.value = 7500;
    g.gain.setValueAtTime(v * 0.22, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    n.connect(f); f.connect(g); g.connect(master);
  }

  /** Conga/percusión: caída de tono en el rango medio + un toque
   *  de ruido para el "slap" del cuero. */
  function drPerc(t, v = 1) {
    const a = ctx(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(340, t);
    o.frequency.exponentialRampToValueAtTime(190, t + 0.06);
    g.gain.setValueAtTime(v * 0.5, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.2);

    const n = noiseSrc(t, 0.03), f = a.createBiquadFilter(), ng = a.createGain();
    f.type = 'bandpass'; f.frequency.value = 2600;
    ng.gain.setValueAtTime(v * 0.1, t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
    n.connect(f); f.connect(ng); ng.connect(master);
  }

  /** Clave/madera: dos senos agudos y muy cortos. */
  function drClave(t, v = 1) {
    const a = ctx(); if (!a) return;
    [2400, 1180].forEach((fr, i) => {
      const o = a.createOscillator(), g = a.createGain();
      o.type = 'sine'; o.frequency.value = fr;
      g.gain.setValueAtTime(v * (i ? 0.18 : 0.3), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.06);
    });
  }

  const DRUMS = { kick: drKick, snare: drSnare, clap: drClap, hat: drHat, perc: drPerc, clave: drClave };

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

  function tick() {
    const a = ctx(); if (!a) return;
    const steps = cfg.steps || 16;
    const stepDur = (60 / cfg.bpm) / (steps / 4);   // 16 pasos = semicorcheas en 4/4
    while (nextTime < a.currentTime + AHEAD_S) {
      scheduleStep(step, nextTime);
      nextTime += stepDur;
      step++;
      if (step >= steps) { step = 0; bar++; }
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
      if (e.type === 'step' && cfg.onStep) cfg.onStep(e.step);
      if (e.type === 'chord' && cfg.onChord) cfg.onChord(e.bar);
    }
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
    start, stop, setBpm, setDrumVol, setMasterVol
  };
})();

/* Un `const` de nivel superior en un script clásico vive en el ámbito léxico
   global, NO como propiedad de window: `MAUDIO` resuelve, pero `window.MAUDIO`
   es undefined. music.js consulta la forma con window para degradar con
   elegancia si el motor no cargó, así que hay que publicarlo explícitamente
   — igual que nb-shared.js hace con window.NBShared. */
window.MAUDIO = MAUDIO;
