// 19-JUE · Corredor · Sonido grabado. Motor, disparos, explosiones y ambiente con grabaciones reales, de dominio público
// o CC0 (pieza por pieza en assets/sonido/CREDITOS.json). Se carga solo cuando el jugador enciende el sonido
// (jue_sonido); si algo no carga, el juego sigue con el sonido sintetizado de lc-audio.js.
// El zumbido de los drones sigue sintetizado: no se encontró una grabación libre de un dron real.
// Licencia: MIT (código propio).
import { audio } from './sonido.js';
import { MotorGranular } from './co-motor.js';

const BASE = new URL('../assets/sonido/', import.meta.url).href;
// Motor: granular sobre la grabación de un blindado diésel (co-motor.js). Hasta el 12-nov eran dos bucles de un Detroit
// 6.2 estirados de tono: «suena horrible» (Miguel). Vueltas del juego: 750-4200 rpm (AJUSTE.tactica).
const RPM = { ralenti: 750, max: 4200 };
/**
 * Bucle sin costura: el final del tramo [a, b] se funde a igual potencia con su principio (todas las pistas).
 * Sirve también para un mp3: se recortan sus extremos, que traen el relleno del codificador y harían un golpe.
 */
export function bucleSinCostura(ctx, buf, a, b, fundido = 0.4) {
  const hz = buf.sampleRate, i0 = Math.round(a * hz), F = Math.round(fundido * hz), n = Math.round((b - a) * hz) - F;
  const out = ctx.createBuffer(buf.numberOfChannels, n, hz);
  for (let c = 0; c < buf.numberOfChannels; c++) {
    const x = buf.getChannelData(c), y = out.getChannelData(c);
    for (let i = 0; i < n; i++) y[i] = x[i0 + i];
    for (let i = 0; i < F; i++) { const t = i / F; y[i] = x[i0 + i] * Math.sqrt(t) + x[i0 + n + i] * Math.sqrt(1 - t); }
  }
  return out;
}

const EXPLOSIONES = [['explosion-1.ogg', [0.35, 1.4, 2.25, 3.6]], ['explosion-2.ogg', [0.6, 1.55, 2.7]], ['explosion-3.ogg', [1.2, 2.3, 2.9, 4.1, 4.95]]];
const DISPAROS = ['disparo-30-06-1.wav', 'disparo-30-06-2.wav', 'disparo-ak-1.wav', 'disparo-ak-2.wav', 'disparo-ak-3.wav'];

/**
 * Radio del mando: trozos de voces de radio grabadas (CC0, sin idioma que se entienda) por una cadena de radio — banda de
 * 420 a 2.600 Hz, un realce a 1,6 kHz y saturación suave — con estática encima, y el pitido de fin de mensaje.
 * Pura respecto al contexto: se mide sin altavoces con un OfflineAudioContext. voces: [AudioBuffer], ruido: AudioBuffer.
 */
export function crearRadio(ctx, destino, voces, pitido, ruido) {
  const hp = ctx.createBiquadFilter(), lp = ctx.createBiquadFilter(), pk = ctx.createBiquadFilter(), sat = ctx.createWaveShaper(), sal = ctx.createGain();
  hp.type = 'highpass'; hp.frequency.value = 420; lp.type = 'lowpass'; lp.frequency.value = 2600; pk.type = 'peaking'; pk.frequency.value = 1600; pk.gain.value = 6; pk.Q.value = 0.9;
  const curva = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const x = i / 511.5 - 1; curva[i] = Math.tanh(2.6 * x) / Math.tanh(2.6); }
  sat.curve = curva; sal.gain.value = 0.45; hp.connect(pk); pk.connect(sat); sat.connect(lp); lp.connect(sal); sal.connect(destino);
  // Dónde hay voz en cada grabación: ventanas de 0,25 s con energía sobre la mediana.
  const hablan = voces.map((b) => {
    const x = b.getChannelData(0), V = Math.floor(0.25 * b.sampleRate), e = [];
    for (let i = 0; i + V <= x.length; i += V) { let s = 0; for (let k = 0; k < V; k += 4) s += x[i + k] ** 2; e.push(s); }
    const med = e.slice().sort((a, b) => a - b)[e.length >> 1]; return e.map((v, k) => (v > med ? k * 0.25 : -1)).filter((t) => t >= 0);
  });
  const tocar = (buf, cuando, desde, dur, vol, entrada = hp) => {
    const s = ctx.createBufferSource(), g = ctx.createGain(); s.buffer = buf;
    g.gain.setValueAtTime(0, cuando); g.gain.linearRampToValueAtTime(vol, cuando + 0.015); g.gain.setValueAtTime(vol, cuando + Math.max(0.02, dur - 0.04)); g.gain.linearRampToValueAtTime(0, cuando + dur);
    s.connect(g); g.connect(entrada); s.start(cuando, desde, dur + 0.02); s.stop(cuando + dur + 0.03);
  };
  return {
    /** Un mensaje: un trozo de voz de hasta 3,2 s con estática debajo. */
    voz(dur, cuando = ctx.currentTime) {
      const k = Math.floor(Math.random() * voces.length), b = voces[k], d = Math.min(3.2, Math.max(1.2, dur * 0.8));
      const ini = hablan[k].filter((t) => t + d < b.duration), desde = ini.length ? ini[Math.floor(Math.random() * ini.length)] : 0;
      tocar(b, cuando, desde, d, 1.1);
      if (ruido) tocar(ruido, cuando, Math.random() * Math.max(0, ruido.duration - d - 0.1), d + 0.12, 0.05);
    },
    /** Fin de mensaje: el pitido del walkie, también por la radio. */
    pitido(cuando = ctx.currentTime) { if (pitido) tocar(pitido, cuando, 0, Math.min(0.8, pitido.duration), 0.7); },
  };
}

export class SonidoReal {
  constructor() { this.listo = false; this.estado = 'sin cargar'; this.b = {}; this.lejos = 25; this.conLluvia = false; }

  /** Descarga y decodifica las grabaciones (unos 1,9 MB). Solo con el sonido encendido. */
  async cargar() {
    if (this.estado !== 'sin cargar' || !audio.activo()) return;
    this.estado = 'cargando';
    try {
      const ctx = audio.ctx, leer = async (f) => ctx.decodeAudioData(await (await fetch(BASE + f)).arrayBuffer());
      this.mapa = await (await fetch(BASE + 'motor-blindado.json')).json();
      const todos = await Promise.all(['motor-blindado.wav', 'ambiente-brisa-pajaros.ogg', 'ambiente-guerra-lejana.ogg', ...EXPLOSIONES.map((e) => e[0]), ...DISPAROS].map(leer));
      this.b = { motor: todos[0], brisa: todos[1], guerra: todos[2], exp: todos.slice(3, 6), disp: todos.slice(6) };
      if (this.conLluvia) this.b.lluvia = await leer('lluvia-fuerte.mp3');   // solo la misión con lluvia la baja (361 KB)
      try { this.b.radio = await Promise.all(['radio/radio-voces-1.mp3', 'radio/radio-voces-2.mp3', 'radio/radio-voces-3.mp3', 'radio/radio-pitido.mp3'].map(leer)); }
      catch (e) { this.b.radio = null; }   // sin las voces, la radio sigue con pitido y estática sintetizados
      this.montar(); this.listo = true; this.estado = 'listo';
    } catch (e) { this.estado = 'falló'; console.warn('Sonido grabado no disponible; sigue el sintetizado.', e); }
  }

  montar() {
    const ctx = audio.ctx, sal = audio.efectos;
    const bucle = (buf, [a, b]) => { const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.loopStart = a; s.loopEnd = b; s.start(0, a); return s; };
    const ganancia = (v = 0) => { const g = ctx.createGain(); g.gain.value = v; return g; };
    // Motor: trocitos de la grabación elegidos por vueltas (co-motor.js) → filtro (más brillante con carga) → volumen.
    this.filtro = ctx.createBiquadFilter(); this.filtro.type = 'lowpass'; this.filtro.frequency.value = 2000; this.motor = ganancia();
    this.filtro.connect(this.motor); this.motor.connect(sal);
    this.mg = new MotorGranular(ctx, this.b.motor, this.mapa, this.filtro, RPM);
    // Ambiente: brisa con pájaros, sin los extremos de la grabación (empieza y termina en silencio).
    const amb = bucle(this.b.brisa, [3, 29]); this.amb = ganancia(); amb.connect(this.amb); this.amb.connect(sal);
    if (this.b.radio) this.radio = crearRadio(ctx, sal, this.b.radio.slice(0, 3), this.b.radio[3], audio.ruido);
    // Lluvia fuerte en bucle (Rubaoliva, Freesound 624645, CC0): siseo parejo, sin truenos ni golpes.
    if (this.b.lluvia) { const s = ctx.createBufferSource(); s.buffer = bucleSinCostura(ctx, this.b.lluvia, 0.15, this.b.lluvia.duration - 0.15); s.loop = true; s.start(0); this.gLluvia = ganancia(); s.connect(this.gLluvia); this.gLluvia.connect(sal); }
  }

  /** e = { activo, rn (vueltas 0..1), gas 0..1, corte (cambiando de marcha) }. Llamar en cada cuadro. */
  actualizar(e, dt) {
    if (!this.listo) return;
    const t = audio.ctx.currentTime, set = (p, v, k = 0.06) => p.setTargetAtTime(v, t, k), g = e.corte ? 0 : e.gas;
    this.mg.programar(t + 0.12, () => e);
    set(this.filtro.frequency, e.corte ? 900 : 1300 + 5200 * Math.max(g, e.rn * 0.5), e.corte ? 0.02 : 0.06);
    set(this.motor.gain, e.activo ? 0.9 : 0, 0.1);
    set(this.amb.gain, e.activo ? (this.gLluvia ? 0.8 : 3) : 0, 0.6);   // con lluvia los pájaros casi callan
    if (this.gLluvia) set(this.gLluvia.gain, e.activo ? 3.5 : 0, 0.8);
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
