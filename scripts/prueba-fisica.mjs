// 19-JUE · Corredor · Prueba de la conducción de la camioneta (lc-fisica.js, AJUSTE.tactica), sin navegador.
// Nació del aviso de Miguel (11-nov): «se va de lado al girar, al frenar y en reversa». Comprueba lo que él notaría:
// que la cola no se desliza al girar, que frena recto, que con el freno pisado se queda quieta, que la reversa entra
// al soltar y volver a pisar, y que el borde contiene la carrocería entera. Uso: node scripts/prueba-fisica.mjs
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const fuente = fileURLToPath(new URL('../frontend/juegos/js/lc-fisica.js', import.meta.url));
const copia = join(tmpdir(), `lc-fisica-prueba-${process.pid}.mjs`);
writeFileSync(copia, readFileSync(fuente, 'utf8')
  .replace(/^import .*lc-util\.js';$/m, 'const clamp=(v,a,b)=>v<a?a:v>b?b:v, lerp=(a,b,t)=>a+(b-a)*t, suave=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};')
  .replace(/^import .*lc-pista\.js';$/m, 'const ARCEN = 1.25;'));
const { Vehiculo, AJUSTE } = await import(pathToFileURL(copia).href);
rmSync(copia);

// Recta a lo largo de +z, con el mismo ancho y margen que co-via.js (o casi sin bordes, para medir solo el giro).
const recta = (W) => {
  const N = 4000;
  return { n: N, px: new Float32Array(N), pz: Float32Array.from({ length: N }, (_, i) => i * 2), rx: new Float32Array(N).fill(-1), rz: new Float32Array(N), tx: new Float32Array(N), tz: new Float32Array(N).fill(1),
    consulta(x, z, d, o) { const i = Math.max(0, Math.min(N - 2, Math.round(z / 2))); return Object.assign(o, { i, rx: -1, rz: 0, tx: 0, tz: 1, ty: 0, lat: -x, ancho: W, peralte: 0, curv: 0, dist: z, y: 0, margen: 0.75, blando: true }); } };
};
const VIA = recta(3.4), CAMPO = recta(400), A = AJUSTE.tactica, dt = 1 / 120, grados = (a) => a * 57.2958;
const BORDE = 3.4 + 0.75 + A.medio[0] + 0.02;   // hasta dónde puede llegar el costado de la carrocería

function correr(P, kmh, fases) {
  const v = new Vehiculo(Object.assign({}, A)); v.colocar(P, 200, P === VIA ? 1.6 : 0);
  if (kmh) { v.u = kmh / 3.6; v.marcha = kmh > 55 ? 4 : kmh > 35 ? 3 : 2; v.rpm = 2200; }
  v.r = 0.02;   // un toque mínimo: nada en la vida real es perfectamente simétrico
  const m = { cola: 0, angulo: 0, cuerpo: 0, atras: 0 };
  for (const [seg, e] of fases) for (let k = 0; k < seg / dt; k++) {
    v.paso(dt, { mano: false, ...e }, P);
    if (Math.abs(v.u) > 2) m.cola = Math.max(m.cola, Math.abs(grados(Math.atan((v.v - A.b * v.r) / Math.max(Math.abs(v.u), 3.2)))));
    const d = Math.abs(Math.atan2(Math.sin(v.psi), Math.cos(v.psi))), ang = Math.min(d, Math.PI - d);
    m.angulo = Math.max(m.angulo, grados(ang)); m.atras = Math.min(m.atras, v.u * 3.6);
    m.cuerpo = Math.max(m.cuerpo, Math.abs(v.sup.lat) + Math.sin(ang) * A.medio[1] + Math.cos(ang) * A.medio[0]);
  }
  m.fin = v.u * 3.6; m.marcha = v.marcha;
  return m;
}

const E = (gas, freno, giro = 0) => ({ gas, freno, giro });
let fallos = 0;
const exigir = (nombre, ok, detalle) => { if (!ok) fallos++; console.log(`${ok ? 'ok   ' : 'FALLA'} ${nombre} · ${detalle}`); };

for (const kmh of [20, 40, 60, 80]) for (const g of [0.5, 1]) {
  const m = correr(CAMPO, kmh, [[3, E(0.4, 0, g)]]);
  exigir(`Girar a ${kmh} km/h con el volante a ${g}`, m.cola <= 7, `la cola se desliza ${m.cola.toFixed(1)}° (máx. 7°)`);
}
for (const [nombre, kmh, fases] of [
  ['Volante a fondo y soltar el gas a 60', 60, [[3, E(0, 0, 1)]]],
  ['Volante a fondo y frenar a fondo a 60', 60, [[3, E(0, 1, 1)]]],
  ['Zigzag a fondo a 50', 50, [1, -1, 1, -1, 1, -1].map((g) => [1, E(0.5, 0, g)])],
  ['Gas y volante a fondo desde parado', 0, [[5, E(1, 0, 1)]]],
]) {
  const m = correr(CAMPO, kmh, fases);
  exigir(nombre, m.cola <= 7, `la cola se desliza ${m.cola.toFixed(1)}° (máx. 7°)`);
}
for (const kmh of [60, 80]) {
  const m = correr(VIA, kmh, [[6, E(0, 1)]]);
  exigir(`Frenar a fondo en recta desde ${kmh}`, m.angulo <= 2 && Math.abs(m.fin) < 1, `se tuerce ${m.angulo.toFixed(1)}° y termina a ${m.fin.toFixed(1)} km/h`);
}
{ const m = correr(VIA, 40, [[9, E(0, 1)]]);
  exigir('Frenar hasta parar y seguir pisando', Math.abs(m.fin) < 1 && m.marcha > 0 && m.atras > -1, `termina a ${m.fin.toFixed(1)} km/h, sin reversa`); }
{ const m = correr(VIA, 40, [[4, E(0, 1)], [0.3, E(0, 0)], [6, E(0, 1)]]);
  exigir('Soltar el freno y volver a pisarlo: reversa', m.atras <= -10 && m.atras >= -19 && m.angulo <= 2, `reversa a ${m.atras.toFixed(0)} km/h (entre −10 y −19), se tuerce ${m.angulo.toFixed(1)}°`); }
for (const [nombre, fases] of [
  ['Reversa con el volante a 0,3', [[0.3, E(0, 0)], [8, E(0, 1, 0.3)]]],
  ['Reversa y volante a fondo', [[0.3, E(0, 0)], [5, E(0, 1)], [3, E(0, 1, 1)]]],
  ['Acelerar girando hacia el borde y frenar', [[6, E(1, 0, 0.3)], [5, E(0, 1, 0.3)]]],
  ['Frenar a fondo girando 0,6', [[5, E(0, 1, 0.6)]]],
]) {
  const m = correr(VIA, nombre.startsWith('Frenar a fondo') ? 60 : 0, fases);
  exigir(nombre, m.cuerpo <= BORDE, `el costado llega a ${m.cuerpo.toFixed(2)} m del centro de la vía (máx. ${BORDE.toFixed(2)})`);
}

for (const [nombre, kmh, fases] of [['Parada, volante a fondo y sin gas', 0, [[4, E(0, 0, 1)]]], ['Parada, volante de lado a lado y sin gas', 0, [1, -1, 1, -1].map((g) => [1, E(0, 0, g)])], ['A 10 km/h, soltar todo y girar a fondo', 10, [[6, E(0, 0, 1)]]]]) {
  const v = new Vehiculo(Object.assign({}, A)); v.colocar(VIA, 200, 1.6); v.u = kmh / 3.6; const x0 = v.x, z0 = v.z;
  for (const [seg, e] of fases) for (let k = 0; k < seg / dt; k++) v.paso(dt, { mano: false, ...e }, VIA);
  const d = Math.hypot(v.x - x0, v.z - z0), tope = kmh ? 8 : 0.2;
  exigir(nombre + ': sin gas no se va', d <= tope && Math.abs(v.u) < 0.3, `se movió ${d.toFixed(2)} m (máx. ${tope}) y queda a ${(v.u * 3.6).toFixed(1)} km/h`);
}
{ const v = new Vehiculo(Object.assign({}, A)); v.colocar(CAMPO, 10, 0); let t60 = 0;
  for (let k = 0; k < 20 / dt && !t60; k++) { v.paso(dt, { gas: 1, freno: 0, giro: 0, mano: false }, CAMPO); if (v.u * 3.6 >= 60) t60 = k * dt; }
  exigir('De 0 a 60 km/h como una camioneta táctica', t60 >= 6 && t60 <= 10, `tarda ${t60.toFixed(1)} s (entre 6 y 10)`); }

console.log(fallos ? `\n${fallos} comprobaciones fallaron` : '\nTodas las comprobaciones pasaron');
process.exit(fallos ? 1 : 0);
