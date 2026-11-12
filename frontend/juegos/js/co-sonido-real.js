// 19-JUE · Corredor · Sonido grabado. Motor, disparos, explosiones y ambiente con grabaciones reales, de dominio público
// o CC0 (pieza por pieza en assets/sonido/CREDITOS.json). Se carga solo cuando el jugador enciende el sonido
// (jue_sonido); si algo no carga, el juego sigue con el sonido sintetizado de lc-audio.js.
// El zumbido de los drones sigue sintetizado: no se encontró una grabación libre de un dron real.
// Licencia: MIT (código propio).
import { audio } from './sonido.js';

const BASE = new URL('../assets/sonido/', import.meta.url).href;
// Medido en la grabación (9,9 s): ralentí estable (42 Hz de explosiones) de 6,4 a 9,2 s; acelerón de 3,8 a 5,2 s, estable
// solo de 3,95 a 4,6 (63 Hz). Hasta el 11-nov se repetía 4,0-5,0 tal cual: el volumen caía dentro del bucle y cada segundo
// sonaba un «tru tru» de tren. Ahora el ralentí se funde consigo mismo en la costura y las altas vueltas son una textura de
// granos tomados al azar del tramo estable: no hay ciclo que se oiga.
const MOTOR = { ralenti: [6.4, 9.2], vueltas: [3.95, 4.6] };
/**
 * Mezcla del motor según vueltas (rn 0..1), acelerador y cambio de marcha. Pura: se mide sin altavoces.
 * Al cambiar (corte) el acelerador cuenta como suelto y las altas vueltas bajan a la mitad: se oye el «corte» y después
 * las vueltas, más bajas, vuelven a subir en la marcha nueva. La grabación al ralentí tiene una décima parte de la
 * energía que a altas vueltas: por eso las ganancias tan distintas.
 */
export function mezclaMotor(e) {
  const rn = Math.min(1, Math.max(0, e.rn)), g = e.corte ? 0.08 : e.gas, mezcla = Math.min(1, rn * 0.6 + g * 0.55);
  return { rA: 0.95 + 1.1 * rn, rB: 0.66 + 0.86 * rn, gA: (1 - mezcla) * 4, gB: mezcla * 0.55 * (e.corte ? 0.45 : 1), f: 900 + 4500 * Math.max(g, rn * 0.6), m: e.activo ? 0.5 + 0.3 * g : 0 };
}

/** Bucle sin costura: el final del tramo se funde (a igual potencia) con su principio. */
function bucleSinCostura(ctx, buf, a, b, fundido = 0.35) {
  const hz = buf.sampleRate, x = buf.getChannelData(0), i0 = Math.round(a * hz), F = Math.round(fundido * hz), n = Math.round((b - a) * hz) - F;
  const out = ctx.createBuffer(1, n, hz), y = out.getChannelData(0);
  for (let i = 0; i < n; i++) y[i] = x[i0 + i];
  for (let i = 0; i < F; i++) { const t = i / F; y[i] = x[i0 + i] * Math.sqrt(t) + x[i0 + n + i] * Math.sqrt(1 - t); }
  return out;
}
/** Textura continua: granos de 90 ms con ventana sen² al 50 % (suman exactamente 1), tomados al azar de [a, b]. */
function textura(ctx, buf, a, b, seg = 5, grano = 0.09) {
  const hz = buf.sampleRate, x = buf.getChannelData(0), G = Math.round(grano * hz), paso = G >> 1, n = Math.round(seg * hz / paso) * paso;
  const tmp = new Float32Array(n + G), i0 = Math.round(a * hz), i1 = Math.round(b * hz) - G;
  for (let p = 0; p < n; p += paso) { const s = i0 + Math.floor(Math.random() * (i1 - i0)); for (let i = 0; i < G; i++) tmp[p + i] += x[s + i] * Math.sin(Math.PI * i / G) ** 2; }
  for (let i = 0; i < G; i++) tmp[i] += tmp[n + i];   // la cola vuelve al principio: el bucle cierra sin costura
  const out = ctx.createBuffer(1, n, hz); out.getChannelData(0).set(tmp.subarray(0, n)); return out;
}
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
    const fuente = (buf) => { const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.start(0); return s; };
    this.mA = fuente(bucleSinCostura(ctx, this.b.motor, ...MOTOR.ralenti)); this.mB = fuente(textura(ctx, this.b.motor, ...MOTOR.vueltas));
    this.gA = ganancia(); this.gB = ganancia(); this.filtro = ctx.createBiquadFilter(); this.filtro.type = 'lowpass'; this.filtro.frequency.value = 2000;
    this.motor = ganancia();
    this.mA.connect(this.gA); this.mB.connect(this.gB); this.gA.connect(this.filtro); this.gB.connect(this.filtro); this.filtro.connect(this.motor); this.motor.connect(sal);
    // Ambiente: brisa con pájaros, sin los extremos de la grabación (empieza y termina en silencio).
    const amb = bucle(this.b.brisa, [3, 29]); this.amb = ganancia(); amb.connect(this.amb); this.amb.connect(sal);
  }

  /** e = { activo, rn (vueltas 0..1), gas 0..1, corte (cambiando de marcha) }. Llamar en cada cuadro. */
  actualizar(e, dt) {
    if (!this.listo) return;
    const t = audio.ctx.currentTime, set = (p, v, k = 0.06) => p.setTargetAtTime(v, t, k), m = mezclaMotor(e), k = e.corte || this.corte ? 0.025 : 0.06;
    this.corte = e.corte;
    set(this.mA.playbackRate, m.rA); set(this.mB.playbackRate, m.rB);
    set(this.gA.gain, m.gA, k); set(this.gB.gain, m.gB, k);
    set(this.filtro.frequency, m.f, k);
    set(this.motor.gain, m.m, 0.1);
    set(this.amb.gain, e.activo ? 3 : 0, 0.6);
    if (e.activo && (this.lejos -= dt) <= 0) { this.lejos = 14 + Math.random() * 20; this.combateLejano(); }   // ambiente de guerra: un tiroteo lejano cada 14-34 s
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

  /** Explosión del frente, a cientos de metros: un retumbo grave, apagado y a un lado (pan −1..1). */
  lejana(d, pan) {
    if (!this.listo) return false;
    const ctx = audio.ctx, t = ctx.currentTime, i = (Math.random() * EXPLOSIONES.length) | 0, golpes = EXPLOSIONES[i][1];
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(), p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    s.buffer = this.b.exp[i]; s.playbackRate.value = 0.7 + Math.random() * 0.15;
    f.type = 'lowpass'; f.frequency.value = Math.max(160, 9000 / (1 + d / 35));
    g.gain.setValueAtTime(0.55 * 160 / (d + 160), t); g.gain.setTargetAtTime(0.0001, t + 1.6, 0.5);
    s.connect(f); f.connect(g); if (p) { p.pan.value = Math.max(-1, Math.min(1, pan)); g.connect(p); p.connect(audio.efectos); } else g.connect(audio.efectos);
    s.start(t, Math.max(0, golpes[(Math.random() * golpes.length) | 0] - 0.03), 3);
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
