// 19-JUE · Luciérnaga · sonido del coche, efectos y música. Todo sintetizado con Web Audio (sonido.js):
// cero archivos de audio. Licencia: MIT (código propio del repositorio).
import { audio, tono, ruido } from './sonido.js';

/** Canción de la carrera: La menor, Am F C G, 112 bpm. Formato en sonido.js · Musica. */
export const CANCION = {
  bpm: 112, raiz: 45,
  progresion: [0, -4, 3, -2],
  triadas: [[0, 3, 7], [0, 4, 7], [0, 4, 7], [0, 4, 7]],
  bombo: 'x...x...x...x...',
  caja: '....x.......x...',
  charles: '..x...x...x...xo',
  bajo: 'x.xox.x.x.xox.x5',
  arpegio: '0.1.2.1.0.1.2.3.',
};

/** Motor (dos osciladores por un pasabajos), derrape y nitro (ruido filtrado en bucle). Un solo grafo fijo. */
export class SonidoCoche {
  constructor() {
    const ctx = audio.ctx;
    this.ok = !!ctx && !!audio.ruido;
    if (!this.ok) return;
    this.ctx = ctx;
    this.salida = ctx.createGain(); this.salida.gain.value = 0; this.salida.connect(audio.efectos);
    this.filtro = ctx.createBiquadFilter(); this.filtro.type = 'lowpass'; this.filtro.frequency.value = 600; this.filtro.Q.value = 4;
    this.gMotor = ctx.createGain(); this.gMotor.gain.value = 0;
    this.o1 = ctx.createOscillator(); this.o1.type = 'sawtooth';
    this.o2 = ctx.createOscillator(); this.o2.type = 'square';
    const g2 = ctx.createGain(); g2.gain.value = 0.5;
    this.o1.connect(this.filtro); this.o2.connect(g2); g2.connect(this.filtro);
    this.filtro.connect(this.gMotor); this.gMotor.connect(this.salida);
    this.gDerrape = this._bucle('bandpass', 1100, 2.5);
    this.gNitro = this._bucle('highpass', 2600, 0.7);
    this.o1.start(); this.o2.start();
  }
  _bucle(tipo, f, q) {
    const s = this.ctx.createBufferSource(); s.buffer = audio.ruido; s.loop = true;
    const fl = this.ctx.createBiquadFilter(); fl.type = tipo; fl.frequency.value = f; fl.Q.value = q;
    const g = this.ctx.createGain(); g.gain.value = 0;
    s.connect(fl); fl.connect(g); g.connect(this.salida); s.start();
    return g;
  }
  /** rpm 0..1, gas 0..1, derrape 0..1. Se llama cada cuadro; setTargetAtTime suaviza los saltos. */
  actualizar(rpm, gas, derrape, nitro) {
    if (!this.ok) return;
    const t = this.ctx.currentTime, f = 38 + rpm * 120;
    this.o1.frequency.setTargetAtTime(f, t, 0.03);
    this.o2.frequency.setTargetAtTime(f / 2, t, 0.03);
    this.filtro.frequency.setTargetAtTime(350 + gas * 1600 + rpm * 600, t, 0.05);
    this.gMotor.gain.setTargetAtTime(0.1 + gas * 0.14, t, 0.05);
    this.gDerrape.gain.setTargetAtTime(derrape * 0.28, t, 0.04);
    this.gNitro.gain.setTargetAtTime(nitro ? 0.16 : 0, t, 0.08);
  }
  encender(si) { if (this.ok) this.salida.gain.setTargetAtTime(si ? 1 : 0, this.ctx.currentTime, 0.08); }
}

const ahora = () => audio.ctx.currentTime;
export const sfx = {
  golpe(fuerza) {
    if (!audio.activo()) return;
    ruido({ dur: 0.25, vol: 0.1 + 0.5 * fuerza, tipo: 'lowpass', f: 900, f2: 120 });
    tono({ f: 90, f2: 40, dur: 0.2, tipo: 'sine', vol: 0.6 * fuerza });
  },
  nitro() { if (audio.activo()) ruido({ dur: 0.5, vol: 0.25, tipo: 'bandpass', f: 600, f2: 3000, q: 1.2 }); },
  vuelta() {
    if (!audio.activo()) return;
    tono({ f: 784, dur: 0.12, tipo: 'square', vol: 0.14, filtro: 3000 });
    tono({ f: 1175, dur: 0.25, tipo: 'square', vol: 0.14, filtro: 3000, en: ahora() + 0.12 });
  },
  meta(record) {
    if (!audio.activo()) return;
    const notas = record ? [523, 659, 784, 1047, 1319] : [523, 659, 784];
    notas.forEach((f, i) => tono({ f, dur: 0.24, tipo: 'square', vol: 0.14, filtro: 3200, en: ahora() + i * 0.11 }));
  },
};
