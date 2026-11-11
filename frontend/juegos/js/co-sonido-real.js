// 19-JUE · Corredor · Sonido grabado. Motor, disparos, explosiones y ambiente con grabaciones reales, de dominio público
// o CC0 (pieza por pieza en assets/sonido/CREDITOS.json). Se carga solo cuando el jugador enciende el sonido
// (jue_sonido); si algo no carga, el juego sigue con el sonido sintetizado de lc-audio.js.
// El zumbido de los drones sigue sintetizado: no se encontró una grabación libre de un dron real.
// Licencia: MIT (código propio).
import { audio } from './sonido.js';

const BASE = new URL('../assets/sonido/', import.meta.url).href;
// Medido en las grabaciones (11-nov): el Detroit 6.2 V8 está al ralentí (~40 Hz de explosiones, 600 rpm) de 6,6 a 9,8 s
// y a altas vueltas de 4,0 a 5,0 s. Cada archivo de explosiones trae varios estallidos: se arranca en uno de ellos.
const MOTOR = { ralenti: [6.6, 9.8], vueltas: [4.0, 5.0] };
const EXPLOSIONES = [['explosion-1.ogg', [0.35, 1.4, 2.25, 3.6]], ['explosion-2.ogg', [0.6, 1.55, 2.7]], ['explosion-3.ogg', [1.2, 2.3, 2.9, 4.1, 4.95]]];
const DISPAROS = ['disparo-30-06-1.wav', 'disparo-30-06-2.wav', 'disparo-ak-1.wav', 'disparo-ak-2.wav', 'disparo-ak-3.wav'];

export class SonidoReal {
  constructor() { this.listo = false; this.estado = 'sin cargar'; this.b = {}; this.lejos = 25; }

  /** Descarga y decodifica las grabaciones (unos 1,9 MB). Solo con el sonido encendido. */
  async cargar() {
    if (this.estado !== 'sin cargar' || !audio.activo()) return;
    this.estado = 'cargando';
    try {
      const ctx = audio.ctx, leer = async (f) => ctx.decodeAudioData(await (await fetch(BASE + f)).arrayBuffer());
      const todos = await Promise.all(['motor-detroit-62.ogg', 'ambiente-brisa-pajaros.ogg', 'ambiente-guerra-lejana.ogg', ...EXPLOSIONES.map((e) => e[0]), ...DISPAROS].map(leer));
      this.b = { motor: todos[0], brisa: todos[1], guerra: todos[2], exp: todos.slice(3, 6), disp: todos.slice(6) };
      this.montar(); this.listo = true; this.estado = 'listo';
    } catch (e) { this.estado = 'falló'; console.warn('Sonido grabado no disponible; sigue el sintetizado.', e); }
  }

  montar() {
    const ctx = audio.ctx, sal = audio.efectos;
    const bucle = (buf, [a, b]) => { const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.loopStart = a; s.loopEnd = b; s.start(0, a); return s; };
    const ganancia = (v = 0) => { const g = ctx.createGain(); g.gain.value = v; return g; };
    // Motor: dos capas de la misma grabación (ralentí y altas vueltas) que se mezclan según acelerador y vueltas.
    this.mA = bucle(this.b.motor, MOTOR.ralenti); this.mB = bucle(this.b.motor, MOTOR.vueltas);
    this.gA = ganancia(); this.gB = ganancia(); this.filtro = ctx.createBiquadFilter(); this.filtro.type = 'lowpass'; this.filtro.frequency.value = 2000;
    this.motor = ganancia();
    this.mA.connect(this.gA); this.mB.connect(this.gB); this.gA.connect(this.filtro); this.gB.connect(this.filtro); this.filtro.connect(this.motor); this.motor.connect(sal);
    // Ambiente: brisa con pájaros, sin los extremos de la grabación (empieza y termina en silencio).
    const amb = bucle(this.b.brisa, [3, 29]); this.amb = ganancia(); amb.connect(this.amb); this.amb.connect(sal);
  }

  /** e = { activo, rn (vueltas 0..1), gas 0..1 }. Llamar en cada cuadro. */
  actualizar(e, dt) {
    if (!this.listo) return;
    const t = audio.ctx.currentTime, set = (p, v, k = 0.06) => p.setTargetAtTime(v, t, k);
    const rn = Math.min(1, Math.max(0, e.rn)), mezcla = Math.min(1, rn * 0.6 + e.gas * 0.55);
    set(this.mA.playbackRate, 0.95 + 1.1 * rn); set(this.mB.playbackRate, 0.72 + 0.75 * rn);
    // La grabación al ralentí tiene una décima parte de la energía que a altas vueltas: por eso las ganancias tan distintas.
    set(this.gA.gain, (1 - mezcla) * 4); set(this.gB.gain, mezcla * 0.55);
    set(this.filtro.frequency, 900 + 4500 * Math.max(e.gas, rn * 0.6));
    set(this.motor.gain, e.activo ? 0.5 + 0.3 * e.gas : 0, 0.1);
    set(this.amb.gain, e.activo ? 3 : 0, 0.6);
    if (e.activo && (this.lejos -= dt) <= 0) { this.lejos = 35 + Math.random() * 40; this.combateLejano(); }
  }

  /** De vez en cuando, un tiroteo lejano: la grabación entera, baja, apagada y a un lado. */
  combateLejano() {
    const ctx = audio.ctx, t = ctx.currentTime, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(), p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    s.buffer = this.b.guerra; f.type = 'lowpass'; f.frequency.value = 1400;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22, t + 2); g.gain.setTargetAtTime(0.0001, t + 9, 1.5);
    s.connect(f); f.connect(g);
    if (p) { p.pan.value = Math.random() < 0.5 ? -0.7 : 0.7; g.connect(p); p.connect(audio.efectos); } else g.connect(audio.efectos);
    s.start(t, 0, 14);
  }

  /** Un disparo de la torreta. Devuelve false si las grabaciones no están (el juego usa entonces el sintetizado). */
  disparo() {
    if (!this.listo) return false;
    const ctx = audio.ctx, s = ctx.createBufferSource(), g = ctx.createGain();
    s.buffer = this.b.disp[(Math.random() * this.b.disp.length) | 0]; s.playbackRate.value = 0.94 + Math.random() * 0.1;
    g.gain.value = 0.26; s.connect(g); g.connect(audio.efectos); s.start();
    return true;
  }

  /** Una explosión de fuerza k a d metros: más baja y más apagada cuanto más lejos. */
  explosion(k, d) {
    if (!this.listo) return false;
    const ctx = audio.ctx, t = ctx.currentTime, i = (Math.random() * EXPLOSIONES.length) | 0, golpes = EXPLOSIONES[i][1];
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = this.b.exp[i]; s.playbackRate.value = (0.82 + Math.random() * 0.12) * (k < 0.5 ? 1.15 : 1);
    f.type = 'lowpass'; f.frequency.value = 16000 / (1 + d / 25);
    const vol = Math.min(1.5, k * 1.45) * Math.min(1, 30 / (d + 8));
    g.gain.setValueAtTime(vol, t); g.gain.setTargetAtTime(0.0001, t + 1.1, 0.3);
    s.connect(f); f.connect(g); g.connect(audio.efectos);
    s.start(t, Math.max(0, golpes[(Math.random() * golpes.length) | 0] - 0.03), 2.4);
    return true;
  }
}
