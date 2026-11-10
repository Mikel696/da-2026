// 19-JUE · Luciérnaga · Sonido. Todo sintetizado: ni una muestra grabada.
// El motor se arma por «órdenes»: un seis en línea de cuatro tiempos explota 3 veces por vuelta, así que su nota
// es rpm/20 Hz, con media nota por debajo (el gruñido) y el doble por encima (el filo). Encima van el turbo,
// la válvula de alivio, el petardeo, las llantas, el viento y los grillos de la montaña.
// `construir` recibe el contexto: el mismo grafo corre en vivo y en un contexto sin altavoces para medirlo.
// Licencia: MIT (código propio).
import { audio, tono, ruido } from './sonido.js';

export const CANCION = {   // pulso rápido en la menor para bajar el puerto
  bpm: 152, raiz: 45, progresion: [0, 0, -4, -2, 0, 0, -4, -5], triadas: [[0, 3, 7], [0, 3, 7], [0, 4, 7], [0, 4, 7], [0, 3, 7], [0, 3, 7], [0, 4, 7], [0, 4, 7]],
  bombo: 'x...x...x...x...', caja: '....x.......x...', charles: '..x...x...x...xo', bajo: '..x.o.x...x.o.5.', arpegio: '0.2.1.3.2.1.0.3.',
};

function curvaSaturacion(k) {
  const n = 1024, c = new Float32Array(n), t = Math.tanh(k);
  for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1; c[i] = Math.tanh(x * k) / t; }
  return c;
}

/** Arma el grafo sobre `ctx` y lo conecta a `destino`. Devuelve `fijar(estado, cuando, suavizado)`. */
export function construir(ctx, destino, bufRuido) {
  const G = (v = 0) => { const g = ctx.createGain(); g.gain.value = v; return g; };
  const osc = (tipo) => { const o = ctx.createOscillator(); o.type = tipo; o.start(); return o; };
  const fuenteRuido = () => { const s = ctx.createBufferSource(); s.buffer = bufRuido; s.loop = true; s.start(0, Math.random()); return s; };
  const filtro = (tipo, f, q = 0.8, gan = 0) => { const b = ctx.createBiquadFilter(); b.type = tipo; b.frequency.value = f; b.Q.value = q; b.gain.value = gan; return b; };
  const maestro = G(0); maestro.connect(destino);

  // Motor: cinco osciladores atados a la nota de explosión → saturación → filtros de escape.
  const o = { nota: osc('sawtooth'), nota2: osc('sawtooth'), media: osc('sawtooth'), doble: osc('square'), aullido: osc('triangle') };
  const g = { nota: G(0.5), nota2: G(0.32), media: G(0.5), doble: G(0.1), aullido: G(0.2) };
  const empuje = G(1), satur = ctx.createWaveShaper(); satur.curve = curvaSaturacion(2.6); satur.oversample = '2x';
  const paso = filtro('lowpass', 800, 0.9), cuerpo = filtro('peaking', 140, 1.2, 6), nasal = filtro('peaking', 480, 1.4, 4), motor = G(0);
  for (const k in o) { o[k].connect(g[k]); g[k].connect(empuje); }
  empuje.connect(satur); satur.connect(paso); paso.connect(cuerpo); cuerpo.connect(nasal); nasal.connect(motor); motor.connect(maestro);
  const admision = filtro('bandpass', 900, 0.7), gAdm = G(0); fuenteRuido().connect(admision); admision.connect(gAdm); gAdm.connect(maestro);

  // Turbo: silbido que sube con la presión, y su soplo.
  const silbo = osc('sine'), gSilbo = G(0), soplo = filtro('highpass', 5200, 0.6), gSoplo = G(0);
  silbo.connect(gSilbo); gSilbo.connect(maestro); fuenteRuido().connect(soplo); soplo.connect(gSoplo); gSoplo.connect(maestro);

  // Llantas (dos resonancias), viento y arcén.
  const ll1 = filtro('bandpass', 1050, 6), ll2 = filtro('bandpass', 1620, 7), gLl = G(0), rLl = fuenteRuido();
  rLl.connect(ll1); rLl.connect(ll2); ll1.connect(gLl); ll2.connect(gLl); gLl.connect(maestro);
  const viento = filtro('lowpass', 500, 0.5), gViento = G(0); fuenteRuido().connect(viento); viento.connect(gViento); gViento.connect(maestro);
  const grava = filtro('lowpass', 150, 0.8), gGrava = G(0); fuenteRuido().connect(grava); grava.connect(gGrava); gGrava.connect(maestro);

  // Grillos: un pitido agudo al que una envolvente en bucle le da el «cri-cri-cri».
  const env = ctx.createBuffer(1, Math.round(ctx.sampleRate * 1.3), ctx.sampleRate), d = env.getChannelData(0);
  for (let i = 0; i < d.length; i++) { const t = i / ctx.sampleRate; d[i] = t < 0.34 ? Math.max(0, Math.sin(t * Math.PI * 2 * 21)) ** 2 * Math.sin(Math.PI * t / 0.34) : 0; }
  const grillo = osc('sine'), grillo2 = osc('sine'), gGrillo = G(0), nivelGrillo = G(0), bucle = ctx.createBufferSource();
  grillo.frequency.value = 4350; grillo2.frequency.value = 4720; bucle.buffer = env; bucle.loop = true; bucle.start();
  grillo.connect(gGrillo); grillo2.connect(gGrillo); bucle.connect(gGrillo.gain); gGrillo.connect(nivelGrillo); nivelGrillo.connect(maestro);

  /** e = { rpm, gas 0..1, turbo 0..1, chirrido 0..1, vel (m/s), arcen bool, corte bool } */
  function fijar(e, t = ctx.currentTime, tau = 0.03) {
    const set = (p, v, k = tau) => p.setTargetAtTime(v, t, k);
    const rn = Math.min(1, Math.max(0, (e.rpm - 900) / 7100)), carga = e.corte ? 0 : e.gas, f = e.rpm / 20;
    set(o.nota.frequency, f); set(o.nota2.frequency, f * 1.007); set(o.media.frequency, f * 0.5); set(o.doble.frequency, f * 2); set(o.aullido.frequency, f * 1.5);
    set(g.media.gain, 0.58 - 0.28 * rn); set(g.doble.gain, 0.08 + 0.3 * rn); set(g.aullido.gain, 0.16 + 0.2 * carga);
    set(empuje.gain, 0.55 + 1.9 * carga);
    set(paso.frequency, 240 + 2300 * rn + 2700 * carga * (0.3 + 0.7 * rn));
    set(motor.gain, 0.15 + 0.3 * carga + 0.12 * rn);
    set(admision.frequency, 500 + 1500 * rn); set(gAdm.gain, 0.03 + 0.17 * carga * rn);
    set(silbo.frequency, 3400 + 6800 * e.turbo, 0.08); set(gSilbo.gain, e.turbo * e.turbo * 0.03, 0.06); set(gSoplo.gain, e.turbo * 0.035, 0.06);
    const v = Math.min(1, e.vel / 70);
    set(ll1.frequency, 900 + 380 * v, 0.08); set(ll2.frequency, 1450 + 520 * v, 0.08); set(gLl.gain, e.chirrido * 0.42, 0.05);
    set(viento.frequency, 350 + 1700 * v, 0.2); set(gViento.gain, v * v * 0.3, 0.2);
    set(gGrava.gain, e.arcen ? Math.min(0.5, e.vel / 40) : 0, 0.05);
    set(nivelGrillo.gain, 0.035 * Math.max(0, 1 - e.vel / 22), 0.4);
  }
  return { maestro, fijar };
}

/** El sonido del juego en vivo. No crea nada hasta que el jugador enciende el sonido (jue_sonido). */
export class Sonidos {
  constructor() { this.s = null; this.on = false; }
  get listo() { return !!this.s; }
  preparar() { if (!this.s && audio.activo()) this.s = construir(audio.ctx, audio.efectos, audio.ruido); return !!this.s; }
  encender(si) {
    if (!this.preparar() || si === this.on) return;
    this.on = si; this.s.maestro.gain.setTargetAtTime(si ? 1 : 0, audio.ctx.currentTime, 0.08);
  }
  actualizar(e) { if (this.s && this.on) this.s.fijar(e); }
  cambio(sube) {
    tono({ f: sube ? 130 : 95, f2: 60, dur: 0.07, tipo: 'triangle', vol: 0.16 });
    if (!sube) ruido({ dur: 0.1, vol: 0.12, tipo: 'bandpass', f: 700, q: 2 });
  }
  soplido(k) {   // «pshhh» de la válvula de alivio
    ruido({ dur: 0.38, vol: 0.2 * k, tipo: 'bandpass', f: 3200, f2: 800, q: 1.6 });
    ruido({ dur: 0.22, vol: 0.1 * k, tipo: 'highpass', f: 5200, q: 0.6 });
  }
  petardeo(k = 1) {
    ruido({ dur: 0.07, vol: 0.34 * k, tipo: 'bandpass', f: 500 + Math.random() * 700, q: 2.4 });
    tono({ f: 150, f2: 55, dur: 0.07, tipo: 'sine', vol: 0.3 * k });
  }
  golpe(k, pan = 0) {
    ruido({ dur: 0.3, vol: 0.5 * k, tipo: 'lowpass', f: 950, f2: 160, q: 0.9, pan });
    tono({ f: 105, f2: 42, dur: 0.24, tipo: 'sine', vol: 0.5 * k, pan });
    ruido({ dur: 0.5, vol: 0.16 * k, tipo: 'bandpass', f: 2600, f2: 1300, q: 5, pan });   // el metal que rasca
  }
}

/** Renderiza el motor sin altavoces y lo mide. Solo para pruebas: no suena nada. */
export async function medirMotor(estado, seg = 1.2) {
  const sr = 44100, off = new OfflineAudioContext(1, Math.round(sr * seg), sr);
  const buf = off.createBuffer(1, sr * 2, sr), d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const s = construir(off, off.destination, buf);
  s.maestro.gain.value = 1; s.fijar(estado, 0, 0.005);
  const x = (await off.startRendering()).getChannelData(0), desde = Math.round(sr * 0.4);
  let pico = 0, suma = 0, malos = 0;
  for (let i = desde; i < x.length; i++) { const a = Math.abs(x[i]); if (!(a >= 0)) malos++; if (a > pico) pico = a; suma += x[i] * x[i]; }
  // Energía en la nota de explosión (rpm/20 Hz) frente a una frecuencia ajena, con un Goertzel de un solo punto.
  const tonoEn = (f) => { const w = 2 * Math.PI * f / sr, c = 2 * Math.cos(w); let a = 0, b = 0; for (let i = desde; i < x.length; i++) { const y = x[i] + c * a - b; b = a; a = y; } return Math.sqrt(a * a + b * b - c * a * b) / (x.length - desde); };
  const f = estado.rpm / 20;
  return { pico: +pico.toFixed(3), rms: +Math.sqrt(suma / (x.length - desde)).toFixed(4), malos, nota: +tonoEn(f).toFixed(5), ajena: +tonoEn(f * 1.37).toFixed(5) };
}
