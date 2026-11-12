// Mide la frecuencia de encendido (f0) de una grabación de motor a lo largo del tiempo, por autocorrelación.
// f0 de encendido = rpm × cilindros / 120 (4 tiempos). Devuelve una pista { t, f0, claridad, rms } cada `paso` s.
export async function decodificar(url, hz = 48000) {
  const buf = await (await fetch(url)).arrayBuffer();
  const a = await new OfflineAudioContext(1, 1, hz).decodeAudioData(buf);
  const n = a.length, m = new Float32Array(n);
  for (let c = 0; c < a.numberOfChannels; c++) { const d = a.getChannelData(c); for (let i = 0; i < n; i++) m[i] += d[i] / a.numberOfChannels; }
  return { datos: m, hz: a.sampleRate, dur: a.duration, buffer: a };
}
/** Versión a 4 kHz con paso bajo de 400 Hz (dos etapas): la autocorrelación ve el encendido y no el ruido de combustión. */
export async function grave(buffer) {
  const o = new OfflineAudioContext(1, Math.ceil(buffer.duration * 4000), 4000), s = o.createBufferSource(); s.buffer = buffer;
  const f1 = o.createBiquadFilter(), f2 = o.createBiquadFilter(); f1.frequency.value = f2.frequency.value = 400; f1.Q.value = f2.Q.value = 0.7;
  s.connect(f1); f1.connect(f2); f2.connect(o.destination); s.start(); const r = await o.startRendering(); return r.getChannelData(0);
}
export function pista(datos, hz, { fmin = 25, fmax = 320, ventana = 0.12, paso = 0.05 } = {}) {
  const D = Math.max(1, Math.floor(hz / 4000)), h = hz / D, n = Math.floor(datos.length / D), x = new Float32Array(n);
  for (let i = 0; i < n; i++) { let s = 0; for (let k = 0; k < D; k++) s += datos[i * D + k]; x[i] = s / D; }   // promedio = paso bajo grueso
  const W = Math.round(ventana * h), H = Math.round(paso * h), lmin = Math.floor(h / fmax), lmax = Math.ceil(h / fmin), out = [];
  const ac = new Float32Array(lmax + 2);
  for (let i0 = 0; i0 + W + lmax < n; i0 += H) {
    let e0 = 0; for (let i = 0; i < W; i++) e0 += x[i0 + i] * x[i0 + i];
    for (let L = lmin; L <= lmax; L++) { let s = 0, e1 = 0; for (let i = 0; i < W; i++) { s += x[i0 + i] * x[i0 + i + L]; e1 += x[i0 + i + L] ** 2; } ac[L] = s / Math.sqrt(e0 * e1 + 1e-12); }
    let mx = 0; for (let L = lmin + 1; L < lmax; L++) mx = Math.max(mx, ac[L]);
    let elegido = 0;
    for (let L = lmin + 1; L < lmax; L++) if (ac[L] > ac[L - 1] && ac[L] >= ac[L + 1] && ac[L] >= 0.82 * mx) { elegido = L; break; }   // el período más corto que casi iguala al mejor
    let f0 = 0;
    if (elegido) { const a = ac[elegido - 1], b = ac[elegido], c = ac[elegido + 1], d = (a - c) / (2 * (a - 2 * b + c) || 1); f0 = h / (elegido + d); }   // interpolación parabólica
    out.push({ t: (i0 + W / 2) / h, f0, claridad: mx, rms: Math.sqrt(e0 / W) });
  }
  return out;
}
/** Quita saltos de octava: si una muestra salta ×2 o ×0,5 respecto a la mediana local, la corrige. */
export function alisar(p) {
  const f = p.map((q) => q.f0);
  for (let i = 0; i < f.length; i++) {
    const v = f.slice(Math.max(0, i - 6), i + 7).filter((x) => x > 0).sort((a, b) => a - b), med = v[v.length >> 1] || 0;
    if (!med || !f[i]) continue;
    const r = f[i] / med; if (r > 1.7 && r < 2.3) p[i].f0 = f[i] / 2; else if (r > 0.42 && r < 0.6) p[i].f0 = f[i] * 2;
  }
  return p;
}
window.medirMotor = async (url) => {
  const { buffer, dur } = await decodificar(url), p = alisar(pista(await grave(buffer), 4000)), buenos = p.filter((q) => q.claridad > 0.55 && q.f0 > 0);
  const fs = buenos.map((q) => q.f0).sort((a, b) => a - b), pc = (k) => fs.length ? Math.round(fs[Math.floor(k * (fs.length - 1))]) : 0;
  const linea = []; for (let t = 0; t < dur; t += 1) { const q = p.filter((x) => x.t >= t && x.t < t + 1 && x.claridad > 0.55 && x.f0 > 0); linea.push(q.length ? Math.round(q.reduce((a, b) => a + b.f0, 0) / q.length) : 0); }
  return { dur: +dur.toFixed(1), periodico: +(buenos.length / p.length).toFixed(2), f0: [pc(0.05), pc(0.5), pc(0.95)], claridadMedia: +(p.reduce((a, q) => a + q.claridad, 0) / p.length).toFixed(2), porSegundo: linea.join(' ') };
};
