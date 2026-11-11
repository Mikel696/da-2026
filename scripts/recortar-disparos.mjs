// Recorta disparos sueltos de grabaciones WAV (PCM 16/24 bits): busca cada estampido, lo corta con su cola,
// lo pasa a mono 48 kHz 16 bits, normaliza a −1 dBFS y lo guarda. Uso: node recortar.mjs <wav> <salida-prefijo> <cuántos> [cola_s]
import { readFileSync, writeFileSync } from 'node:fs';
const [ruta, prefijo, cuantosTxt, colaTxt] = process.argv.slice(2), CUANTOS = +cuantosTxt || 4, COLA = +colaTxt || 0.6;
const b = readFileSync(ruta);
let o = 12, fmt = null, ini = 0, len = 0;
while (o < b.length - 8) { const id = b.toString('ascii', o, o + 4), n = b.readUInt32LE(o + 4); if (id === 'fmt ') fmt = { can: b.readUInt16LE(o + 10), hz: b.readUInt32LE(o + 12), bits: b.readUInt16LE(o + 22) }; if (id === 'data') { ini = o + 8; len = n; break; } o += 8 + n + (n % 2); }
const bpm = fmt.bits / 8, marco = bpm * fmt.can, N = Math.floor(len / marco), x = new Float32Array(N);
for (let i = 0; i < N; i++) { let s = 0; for (let c = 0; c < fmt.can; c++) { const p = ini + i * marco + c * bpm; s += fmt.bits === 24 ? ((b[p] | (b[p + 1] << 8) | (b[p + 2] << 16)) << 8 >> 8) / 8388608 : b.readInt16LE(p) / 32768; } x[i] = s / fmt.can; }
// Envolvente y estampidos: subida brusca por encima del 35 % del pico, separados al menos 80 ms.
const hz = fmt.hz, ventana = Math.round(hz * 0.002), env = new Float32Array(N); let pico = 0;
for (let i = 0; i < N; i++) { const a = Math.abs(x[i]); env[i] = Math.max(a, i ? env[i - 1] * Math.exp(-1 / (hz * 0.01)) : 0); if (a > pico) pico = a; }
const golpes = []; let ultimo = -1e9;
for (let i = ventana; i < N; i++) if (Math.abs(x[i]) > pico * 0.35 && env[i - ventana] < pico * 0.12 && i - ultimo > hz * 0.08) { golpes.push(i); ultimo = i; }
console.log(`${ruta.split(/[\\/]/).pop()}: ${(N / hz).toFixed(1)} s, ${golpes.length} estampidos a ${golpes.slice(0, 12).map((g) => (g / hz).toFixed(2)).join(' ')}`);
// Preferir los disparos con más silencio después (cola limpia) y más fuerza.
const cand = golpes.map((g, k) => ({ g, libre: ((golpes[k + 1] ?? N) - g) / hz, fuerza: Math.max(...Array.from(x.subarray(g, g + hz * 0.01), Math.abs)) }))
  .filter((c) => c.libre > 0.12).sort((a, b) => Math.min(b.libre, COLA) * b.fuerza - Math.min(a.libre, COLA) * a.fuerza).slice(0, CUANTOS);
const SAL = 48000, paso = hz / SAL;
cand.forEach((c, k) => {
  const dur = Math.min(COLA, c.libre - 0.01), n = Math.floor(dur * SAL), y = new Float32Array(n), desde = c.g - Math.round(hz * 0.003);
  for (let i = 0; i < n; i++) {   // remuestreo con promedio de la ventana (filtro paso bajo sencillo)
    const p = desde + i * paso; let s = 0, m = 0;
    for (let j = Math.floor(p - paso / 2); j <= Math.ceil(p + paso / 2); j++) if (j >= 0 && j < N) { s += x[j]; m++; }
    y[i] = m ? s / m : 0;
  }
  const fade = Math.round(SAL * 0.04); for (let i = 0; i < fade; i++) y[n - 1 - i] *= i / fade;
  let mx = 0; for (const v of y) mx = Math.max(mx, Math.abs(v)); const g = 0.89 / (mx || 1);
  const out = Buffer.alloc(44 + n * 2);
  out.write('RIFF', 0); out.writeUInt32LE(36 + n * 2, 4); out.write('WAVEfmt ', 8); out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(1, 22);
  out.writeUInt32LE(SAL, 24); out.writeUInt32LE(SAL * 2, 28); out.writeUInt16LE(2, 32); out.writeUInt16LE(16, 34); out.write('data', 36); out.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) out.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(y[i] * g * 32767))), 44 + i * 2);
  const f = `${prefijo}${k + 1}.wav`; writeFileSync(f, out);
  console.log(`  ${f}: desde ${(c.g / hz).toFixed(3)} s, ${dur.toFixed(2)} s, ${(out.length / 1024).toFixed(0)} KB`);
});
