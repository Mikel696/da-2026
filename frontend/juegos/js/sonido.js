// 19-JUE · Sonido. Todo se sintetiza con Web Audio: cero archivos de audio, cero licencias de terceros.
// La música usa el mismo scheduler de lookahead que 18-MUS: un timer decide QUÉ agendar, el reloj de
// AudioContext decide CUÁNDO suena (setTimeout solo arrastra el ritmo de forma audible).

const VOL_KEY = 'jue_volumen';
let ctx = null, salida = null, busEfectos = null, busMusica = null, ruidoBuf = null;

export function volumenes() {
  const base = { musica: 0.5, efectos: 0.8 };
  try { return Object.assign(base, JSON.parse(localStorage.getItem(VOL_KEY)) || {}); } catch (e) { return base; }
}
export function fijarVolumen(clave, v) {
  const o = volumenes(); o[clave] = Math.max(0, Math.min(1, v));
  try { localStorage.setItem(VOL_KEY, JSON.stringify(o)); } catch (e) { /* sin almacenamiento: vale para esta partida */ }
  aplicar();
}
function aplicar() {
  if (!ctx) return;
  const o = volumenes();
  busEfectos.gain.value = o.efectos;
  busMusica.gain.value = o.musica * 0.55;
}

/** Llamar desde un gesto del usuario (tecla o clic). Chrome no cuenta un botón del control como gesto. */
export function iniciarAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -12; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2;
    salida = ctx.createGain(); salida.gain.value = 0.9;
    salida.connect(comp); comp.connect(ctx.destination);
    busEfectos = ctx.createGain(); busEfectos.connect(salida);
    busMusica = ctx.createGain(); busMusica.connect(salida);
    ruidoBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = ruidoBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    aplicar();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

export const audio = {
  get ctx() { return ctx; },
  get efectos() { return busEfectos; },
  get musica() { return busMusica; },
  get ruido() { return ruidoBuf; },
  activo() { return !!ctx && ctx.state === 'running'; },
};

function panear(nodo, pan) {
  if (!pan || !ctx.createStereoPanner) return nodo;
  const p = ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan));
  nodo.connect(p); return p;
}

export function tono({ f = 440, f2 = 0, dur = 0.15, tipo = 'square', vol = 0.25, ataque = 0.004, en = 0, filtro = 0, pan = 0, dest = null } = {}) {
  if (!audio.activo()) return;
  const t = en || ctx.currentTime;
  const o = ctx.createOscillator(); o.type = tipo;
  o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + ataque);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let n = o;
  if (filtro) { const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = filtro; o.connect(fl); n = fl; }
  n.connect(g);
  panear(g, pan).connect(dest || busEfectos);
  o.start(t); o.stop(t + dur + 0.03);
}

export function ruido({ dur = 0.2, vol = 0.3, tipo = 'lowpass', f = 1800, f2 = 0, q = 0.8, ataque = 0.003, en = 0, pan = 0, dest = null } = {}) {
  if (!audio.activo()) return;
  const t = en || ctx.currentTime;
  const s = ctx.createBufferSource(); s.buffer = ruidoBuf;
  const fl = ctx.createBiquadFilter(); fl.type = tipo; fl.Q.value = q;
  fl.frequency.setValueAtTime(f, t);
  if (f2) fl.frequency.exponentialRampToValueAtTime(Math.max(30, f2), t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + ataque);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(fl); fl.connect(g);
  panear(g, pan).connect(dest || busEfectos);
  s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.03);
}

/** Sonidos de interfaz compartidos por los tres juegos. */
export const ui = {
  mover() { tono({ f: 660, dur: 0.05, tipo: 'triangle', vol: 0.12 }); },
  ok() { tono({ f: 520, dur: 0.07, tipo: 'square', vol: 0.12, filtro: 2400 }); tono({ f: 1040, dur: 0.12, tipo: 'triangle', vol: 0.12, en: audio.activo() ? ctx.currentTime + 0.06 : 0 }); },
  atras() { tono({ f: 440, f2: 260, dur: 0.12, tipo: 'triangle', vol: 0.12 }); },
  cuenta(final) { tono({ f: final ? 880 : 440, dur: final ? 0.5 : 0.22, tipo: 'square', vol: 0.18, filtro: 3000 }); },
};

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

/**
 * Secuenciador de 16 pasos por compás. Una canción es datos:
 * { bpm, raiz (MIDI), progresion:[semitonos por compás], triadas:[[0,3,7],...],
 *   bombo:'x...x...', caja, charles, bajo:'x.o.' (x raíz, o octava, 5 quinta), arpegio:'0123' (índice en la tríada) }
 */
export class Musica {
  constructor(cancion) { this.c = cancion; this.paso = 0; this.sig = 0; this.timer = null; this.intensidad = 1; }
  iniciar() {
    if (!audio.activo() || this.timer) return;
    this.paso = 0; this.sig = ctx.currentTime + 0.08;
    this.timer = setInterval(() => this._agendar(), 25);
  }
  parar() { clearInterval(this.timer); this.timer = null; }
  get sonando() { return !!this.timer; }
  _agendar() {
    if (!audio.activo()) return;
    const dur = 60 / this.c.bpm / 4;
    if (this.sig < ctx.currentTime - 0.2) this.sig = ctx.currentTime + 0.05; // la pestaña estuvo dormida
    while (this.sig < ctx.currentTime + 0.12) { this._tocar(this.paso, this.sig, dur); this.sig += dur; this.paso++; }
  }
  _tocar(n, t, dur) {
    const c = this.c, i = n % 16, compas = Math.floor(n / 16) % c.progresion.length;
    const raiz = c.raiz + c.progresion[compas];
    const triada = (c.triadas && c.triadas[compas]) || [0, 3, 7];
    const m = busMusica, k = this.intensidad;
    if (c.bombo && c.bombo[i] === 'x') {
      tono({ f: 150, f2: 42, dur: 0.32, tipo: 'sine', vol: 0.9, en: t, dest: m });
    }
    if (c.caja && c.caja[i] === 'x' && k > 0.2) {
      ruido({ dur: 0.18, vol: 0.32, tipo: 'bandpass', f: 1800, q: 0.7, en: t, dest: m });
      tono({ f: 220, f2: 140, dur: 0.1, tipo: 'triangle', vol: 0.2, en: t, dest: m });
    }
    if (c.charles && c.charles[i] !== '.' && k > 0.35) {
      ruido({ dur: c.charles[i] === 'o' ? 0.16 : 0.045, vol: 0.12, tipo: 'highpass', f: 7500, q: 0.5, en: t, dest: m });
    }
    const b = c.bajo && c.bajo[i];
    if (b && b !== '.') {
      const nota = raiz + (b === 'o' ? 12 : b === '5' ? 7 : 0);
      tono({ f: hz(nota), dur: dur * 1.8, tipo: 'sawtooth', vol: 0.32, filtro: 420 + 500 * k, en: t, dest: m });
    }
    const a = c.arpegio && c.arpegio[i];
    if (a && a !== '.' && k > 0.55) {
      const idx = +a, intervalo = idx < triada.length ? triada[idx] : 12 + triada[idx - triada.length];
      tono({ f: hz(raiz + 24 + intervalo), dur: dur * 0.9, tipo: 'square', vol: 0.07, filtro: 2600, en: t, dest: m });
    }
  }
}
