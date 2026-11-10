// 19-JUE · Luciérnaga · Juego 1 (carreras). Archivos neon.* por el nombre de trabajo anterior (Neón GP, retirado el
// 5-nov-2026 por parecido con un juego comercial existente).
// Licencia: MIT (código propio del proyecto, bajo la licencia del repositorio). Base de diseño: pmndrs/racing-game (MIT):
// coche arcade con marchas y nitro, cámara de persecución. Reescrito en vanilla JS sobre three.js 0.186.1 (MIT, vendorizado).
// Modelos, texturas y pista se generan en código; este archivo no incluye ningún archivo de terceros.
// Parte A: una pista, un coche, teclado y mando, cámara de persecución, calidad.
// Parte B: cuenta atrás, 3 vueltas, cronómetro, récord local (jue_records), sonido sintetizado, pausa navegable con el mando.
import * as THREE from 'three';
import { crearRender, texturaCanvas, cielo, Particulas } from './render.js';
import { Entrada, BOTON, fijarVibracion, vibracionActiva } from './entrada.js';
import { Menus, opcion, calidad, fijarCalidad, NIVELES, Medidor, Sacudida, clamp, amort, records, tiempo } from './comun.js';
import { iniciarAudio, ui, audio, Musica, volumenes, fijarVolumen, sonidoActivo, fijarSonido } from './sonido.js';
import { SonidoCoche, CANCION, sfx } from './neon-sonido.js';
import { JUEGOS } from './catalogo.js';

const $ = (id) => document.getElementById(id);
const DEF = JUEGOS.find((j) => j.id === 'neon');
const ANCHO = 7;            // medio ancho de la pista (m)
const MUESTRAS = 420;       // puntos con los que se mide la pista
const MAX_KMH_MS = 62;      // velocidad máxima sin nitro (m/s ≈ 223 km/h)
const MAX_NITRO_MS = 84;
const VUELTAS = 3;
const ATRAS = 4;             // la salida queda 4 muestras (~12 m) detrás de la línea de meta

const inp = new Entrada({
  acciones: {
    acelerar: { k: ['KeyW', 'ArrowUp'], b: [BOTON.RT] },
    frenar: { k: ['KeyS', 'ArrowDown'], b: [BOTON.LT] },
    derrapar: { k: ['Space'], b: [BOTON.B] },
    nitro: { k: ['ShiftLeft', 'ShiftRight'], b: [BOTON.A] },
    camara: { k: ['KeyC'], b: [BOTON.Y] },
    reaparecer: { k: ['KeyR'], b: [BOTON.SELECT] },
  },
  ejes: { giro: { neg: ['KeyA', 'ArrowLeft'], pos: ['KeyD', 'ArrowRight'], eje: 0, bneg: [BOTON.IZQ], bpos: [BOTON.DER] } },
});
const menus = new Menus(inp);
const medidor = new Medidor();
const sacudida = new Sacudida(0.35, 0.04);
const nivel = calidad();

// ───────────── Pista: curva cerrada muestreada; todo lo demás (asfalto, vallas, farolas) sale de aquí ─────────────
const CONTROL = [[0, 0], [120, -10], [220, 40], [262, 140], [200, 230], [100, 252], [40, 190], [-40, 172], [-112, 232], [-200, 202], [-232, 100], [-170, 30], [-92, 52], [-42, -18]];
const curva = new THREE.CatmullRomCurve3(CONTROL.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'centripetal');
const pts = curva.getSpacedPoints(MUESTRAS).slice(0, MUESTRAS);
const cx = new Float32Array(MUESTRAS), cz = new Float32Array(MUESTRAS), tx = new Float32Array(MUESTRAS), tz = new Float32Array(MUESTRAS);
let largo = 0;
for (let i = 0; i < MUESTRAS; i++) {
  const a = pts[(i - 1 + MUESTRAS) % MUESTRAS], b = pts[(i + 1) % MUESTRAS], n = pts[(i + 1) % MUESTRAS];
  cx[i] = pts[i].x; cz[i] = pts[i].z;
  const dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1;
  tx[i] = dx / l; tz[i] = dz / l;
  largo += Math.hypot(n.x - pts[i].x, n.z - pts[i].z);
}
// Normal derecha del sentido de marcha: (-tz, tx). Con +z hacia delante la derecha del coche es -x.
const nrx = (i) => -tz[i], nrz = (i) => tx[i];

function cercano(x, z, desde) {
  let mejor = -1, md = Infinity;
  const rango = desde < 0 ? [0, MUESTRAS - 1] : [-30, 30];
  for (let k = rango[0]; k <= rango[1]; k++) {
    const i = desde < 0 ? k : (desde + k + MUESTRAS) % MUESTRAS;
    const d = (x - cx[i]) ** 2 + (z - cz[i]) ** 2;
    if (d < md) { md = d; mejor = i; }
  }
  return mejor;
}

// ───────────── Escena ─────────────
const canvas = $('lienzo');
const R = crearRender(canvas, nivel, { exposicion: 1.05, bloom: { fuerza: 0.7, radio: 0.55, umbral: 0.85 } });
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x07061a);
scene.fog = new THREE.Fog(0x120a2a, 90 * R.q.distancia, 520 * R.q.distancia);
const camara = new THREE.PerspectiveCamera(68, innerWidth / innerHeight, 0.3, 1400);
R.montar(scene, camara);
R.entorno(scene, 0.4);
scene.add(cielo({ arriba: 0x03030c, horizonte: 0x3a1650, abajo: 0x050309 }));
scene.add(new THREE.HemisphereLight(0x6a7bff, 0x1a0d2e, 0.55));
const luna = new THREE.DirectionalLight(0xaab8ff, 1.1);
luna.position.set(-60, 120, 40);
if (R.q.sombras) {
  luna.castShadow = true; luna.shadow.mapSize.set(R.q.sombras, R.q.sombras);
  Object.assign(luna.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 10, far: 320 });
  luna.shadow.bias = -0.0004;
}
scene.add(luna); scene.add(luna.target);

// Asfalto: una sola cinta con líneas pintadas en la textura.
const texAsfalto = texturaCanvas(256, 256, (g, w, h) => {
  g.fillStyle = '#23232e'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) { const v = 28 + Math.random() * 22; g.fillStyle = `rgb(${v},${v},${v + 8})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
  g.fillStyle = '#e8e4d8'; g.fillRect(8, 0, 6, h); g.fillRect(w - 14, 0, 6, h);
  g.fillStyle = '#ffb347'; g.fillRect(w / 2 - 3, 20, 6, h * 0.42);
}, { repetir: [1, 1] });
{
  const pos = new Float32Array(MUESTRAS * 2 * 3 + 6), uv = new Float32Array(MUESTRAS * 2 * 2 + 4), nor = new Float32Array(MUESTRAS * 2 * 3 + 6);
  const idx = [];
  let acum = 0;
  for (let i = 0; i <= MUESTRAS; i++) {
    const j = i % MUESTRAS;
    if (i > 0) acum += Math.hypot(cx[j] - cx[(j - 1 + MUESTRAS) % MUESTRAS], cz[j] - cz[(j - 1 + MUESTRAS) % MUESTRAS]);
    const nx = nrx(j), nz = nrz(j);
    pos.set([cx[j] - nx * ANCHO, 0.02, cz[j] - nz * ANCHO, cx[j] + nx * ANCHO, 0.02, cz[j] + nz * ANCHO], i * 6);
    nor.set([0, 1, 0, 0, 1, 0], i * 6);
    uv.set([0, acum / 16, 1, acum / 16], i * 4);
    if (i < MUESTRAS) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: texAsfalto, roughness: 0.62, metalness: 0.15, side: THREE.DoubleSide }));
  m.receiveShadow = true; m.frustumCulled = false; scene.add(m);
}
{
  const suelo = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400), new THREE.MeshStandardMaterial({
    map: texturaCanvas(128, 128, (g, w, h) => { g.fillStyle = '#0a0a14'; g.fillRect(0, 0, w, h); g.strokeStyle = '#1b1636'; g.lineWidth = 2; g.strokeRect(0, 0, w, h); }, { repetir: [240, 240] }),
    roughness: 0.95, metalness: 0,
  }));
  suelo.rotation.x = -Math.PI / 2; suelo.position.set(0, -0.05, 120); suelo.receiveShadow = true; scene.add(suelo);
}

// Vallas luminosas: un InstancedMesh por ambos lados, color alterno naranja / turquesa.
{
  const pasos = []; for (let i = 0; i < MUESTRAS; i += 3) pasos.push(i);
  const geo = new THREE.BoxGeometry(0.7, 0.9, 12.4 / 3 * 1.0);
  const im = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ color: 0xffffff }), pasos.length * 2);
  const m = new THREE.Object3D(), c = new THREE.Color();
  let n = 0;
  pasos.forEach((i, k) => {
    for (const lado of [-1, 1]) {
      const d = ANCHO + 0.55;
      m.position.set(cx[i] + nrx(i) * d * lado, 0.45, cz[i] + nrz(i) * d * lado);
      m.rotation.set(0, Math.atan2(tx[i], tz[i]), 0); m.updateMatrix();
      im.setMatrixAt(n, m.matrix); im.setColorAt(n, c.set(k % 2 ? (lado > 0 ? 0xff7a1f : 0x19c8ff) : 0x1a1530)); n++;
    }
  });
  scene.add(im);
}
// Farolas: postes y cabezas brillantes (2 dibujos en total).
{
  const pasos = []; for (let i = 0; i < MUESTRAS; i += 14) pasos.push(i);
  const postes = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.12, 0.16, 7, 6), new THREE.MeshStandardMaterial({ color: 0x2a2a3a, roughness: 0.7 }), pasos.length);
  const cabezas = new THREE.InstancedMesh(new THREE.BoxGeometry(1.8, 0.25, 0.7), new THREE.MeshBasicMaterial({ color: 0xffd9a0 }), pasos.length);
  const m = new THREE.Object3D();
  pasos.forEach((i, k) => {
    const lado = k % 2 ? 1 : -1, d = ANCHO + 2.2;
    const x = cx[i] + nrx(i) * d * lado, z = cz[i] + nrz(i) * d * lado;
    m.rotation.set(0, 0, 0); m.position.set(x, 3.5, z); m.updateMatrix(); postes.setMatrixAt(k, m.matrix);
    m.rotation.set(0, Math.atan2(tx[i], tz[i]), 0); m.position.set(x - nrx(i) * lado * 0.9, 7.1, z - nrz(i) * lado * 0.9); m.updateMatrix(); cabezas.setMatrixAt(k, m.matrix);
  });
  scene.add(postes); scene.add(cabezas);
}
// Línea de salida y meta en la muestra 0: franja a cuadros y un pórtico luminoso (4 dibujos).
{
  const meta = new THREE.Group();
  const tex = texturaCanvas(128, 32, (g, w, h) => {
    for (let y = 0; y < 2; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? '#111' : '#eee'; g.fillRect(x * 16, y * 16, 16, 16); }
  }, { repetir: [1, 1] });
  const franja = new THREE.PlaneGeometry(ANCHO * 2, 2.4); franja.rotateX(-Math.PI / 2);
  const cuadros = new THREE.Mesh(franja, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 }));
  cuadros.position.y = 0.04; cuadros.receiveShadow = true; meta.add(cuadros);
  const poste = new THREE.MeshStandardMaterial({ color: 0x2a2a3a, roughness: 0.6 });
  for (const lado of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.5, 7.6, 0.5), poste); p.position.set(lado * (ANCHO + 0.9), 3.8, 0); meta.add(p); }
  const barra = new THREE.Mesh(new THREE.BoxGeometry(ANCHO * 2 + 2.3, 0.7, 0.5), new THREE.MeshBasicMaterial({ color: 0xff9a3c }));
  barra.position.y = 7.4; meta.add(barra);
  meta.position.set(cx[0], 0, cz[0]); meta.rotation.y = Math.atan2(tx[0], tz[0]);
  scene.add(meta);
}
// Ciudad de fondo: cajas con ventanas encendidas, lejos de la pista. Semilla fija: la misma ciudad siempre.
{
  let s = 20261028; const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const tex = texturaCanvas(64, 128, (g, w, h) => {
    g.fillStyle = '#0c0b1c'; g.fillRect(0, 0, w, h);
    for (let y = 4; y < h; y += 8) for (let x = 4; x < w; x += 8) if (rnd() < 0.38) { g.fillStyle = rnd() < 0.5 ? '#ffd27a' : '#6fd8ff'; g.fillRect(x, y, 4, 4); }
  }, { srgb: true });
  const total = Math.round(180 * R.q.distancia);
  const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0x1a1830, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.9, roughness: 0.8 }), total);
  const m = new THREE.Object3D();
  let n = 0, intentos = 0;
  while (n < total && intentos++ < 4000) {
    const x = -420 + rnd() * 760, z = -180 + rnd() * 560;
    let libre = true;
    for (let i = 0; i < MUESTRAS; i += 4) if ((x - cx[i]) ** 2 + (z - cz[i]) ** 2 < 38 * 38) { libre = false; break; }
    if (!libre) continue;
    const w = 14 + rnd() * 22, h = 20 + rnd() * rnd() * 140, p = 14 + rnd() * 22;
    m.position.set(x, h / 2, z); m.scale.set(w, h, p); m.rotation.set(0, rnd() * 3.1, 0); m.updateMatrix();
    im.setMatrixAt(n++, m.matrix);
  }
  im.count = n; scene.add(im);
}

// ───────────── Coche: cajas y cilindros, sin modelos externos ─────────────
const coche = new THREE.Group();
const ruedas = [];
{
  const pintura = new THREE.MeshStandardMaterial({ color: 0xff7a1f, metalness: 0.65, roughness: 0.28 });
  const cristal = new THREE.MeshStandardMaterial({ color: 0x0b0d18, metalness: 0.9, roughness: 0.12 });
  const goma = new THREE.MeshStandardMaterial({ color: 0x0c0c0f, roughness: 0.9 });
  const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.5, 4.3), pintura); cuerpo.position.y = 0.55; cuerpo.castShadow = true; coche.add(cuerpo);
  const capo = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.22, 1.5), pintura); capo.position.set(0, 0.88, 1.2); coche.add(capo);
  const cabina = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 1.9), cristal); cabina.position.set(0, 1.0, -0.25); cabina.castShadow = true; coche.add(cabina);
  const alerón = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 0.5), goma); alerón.position.set(0, 1.25, -2.0); coche.add(alerón);
  for (const x of [-0.8, 0.8]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.4), goma); p.position.set(x, 1.08, -2.0); coche.add(p); }
  const luzT = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.12, 0.06), new THREE.MeshBasicMaterial({ color: 0xff2a3a })); luzT.position.set(0, 0.7, -2.17); coche.add(luzT);
  const luzD = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.1, 0.06), new THREE.MeshBasicMaterial({ color: 0xfff1d0 })); luzD.position.set(0, 0.62, 2.17); coche.add(luzD);
  const bajos = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 4.0), new THREE.MeshBasicMaterial({ color: 0x19c8ff, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
  bajos.rotation.x = -Math.PI / 2; bajos.position.y = 0.06; coche.add(bajos);
  const gr = new THREE.CylinderGeometry(0.38, 0.38, 0.32, 14); gr.rotateZ(Math.PI / 2);
  for (const [x, z] of [[-1.02, 1.35], [1.02, 1.35], [-1.02, -1.3], [1.02, -1.3]]) {
    const pivote = new THREE.Group(); pivote.position.set(x, 0.38, z);
    const r = new THREE.Mesh(gr, goma); r.castShadow = true; pivote.add(r); coche.add(pivote); ruedas.push({ pivote, r, delantera: z > 0 });
  }
}
scene.add(coche);

const chispas = new Particulas(scene, Math.round(500 * R.q.particulas), { aditivo: true, suave: 0.6 });

// ───────────── Estado del coche ─────────────
const car = { x: 0, z: 0, h: 0, vx: 0, vz: 0, giro: 0, nitro: 0.4, usaNitro: false, derrapando: false, idx: 0, rueda: 0, vf: 0, gas: 0 };
function colocar(i) {
  car.idx = i; car.x = cx[i]; car.z = cz[i]; car.h = Math.atan2(tx[i], tz[i]);
  car.vx = car.vz = 0; car.giro = 0; car.vf = 0; car.usaNitro = false;
}
colocar(MUESTRAS - ATRAS);
const cam = { yaw: car.h, pos: new THREE.Vector3(), modo: 0, fov: 68 };
const MODOS_CAM = [{ dist: 9.5, alto: 3.6, mira: 2.2 }, { dist: 6.2, alto: 2.3, mira: 1.6 }, { dist: -0.4, alto: 1.15, mira: 6 }];

function paso(dt) {
  const f = [Math.sin(car.h), Math.cos(car.h)], r = [-f[1], f[0]];
  let vf = car.vx * f[0] + car.vz * f[1], vl = car.vx * r[0] + car.vz * r[1];
  // Solo se conduce durante la carrera; tras la meta el coche frena solo.
  const manda = carrera.fase === 'carrera';
  const gas = manda ? inp.v('acelerar') : 0, freno = manda ? inp.v('frenar') : (vf > 0.5 ? 0.8 : 0), volante = manda ? inp.e('giro') : 0;
  const quiereDerrape = manda && inp.p('derrapar') && Math.abs(vf) > 14;
  car.derrapando = quiereDerrape; car.gas = gas;
  const nitroAntes = car.usaNitro;
  car.usaNitro = manda && inp.p('nitro') && car.nitro > 0.01 && vf > 8;
  if (car.usaNitro && !nitroAntes) sfx.nitro();

  const tope = car.usaNitro ? MAX_NITRO_MS : MAX_KMH_MS;
  if (gas > 0.02) vf += (40 + (car.usaNitro ? 34 : 0)) * gas * Math.max(0, 1 - vf / tope) * dt * (vf < 0 ? 2.5 : 1);
  if (freno > 0.02) vf -= (vf > 1 ? 62 : 22) * freno * dt * (vf < -16 ? 0 : 1);
  if (vf > tope) vf -= (vf - tope) * 1.5 * dt;
  vf -= vf * (0.045 + Math.abs(vf) * 0.0012) * dt * (gas < 0.02 ? 2.2 : 1);
  if (car.usaNitro) car.nitro = Math.max(0, car.nitro - dt / 3);

  // Dirección: gira poco a poco más cuanto más rápido, y menos a velocidad máxima. Al derrapar, gira más.
  const efecto = clamp(Math.abs(vf) / 6, 0, 1) * Math.sign(vf || 1);
  const tasa = (2.1 / (1 + Math.abs(vf) / 34)) * (quiereDerrape ? 1.45 : 1);
  car.giro = amort(car.giro, volante * tasa * efecto, 12, dt);
  car.h -= car.giro * dt;

  // Agarre: la velocidad lateral se amortigua; en derrape casi no, y eso carga el nitro.
  vl *= Math.exp(-(quiereDerrape ? 1.6 : 9) * dt);
  if (quiereDerrape && Math.abs(vl) > 4) car.nitro = Math.min(1, car.nitro + dt * 0.22);

  const f2 = [Math.sin(car.h), Math.cos(car.h)], r2 = [-f2[1], f2[0]];
  car.vx = f2[0] * vf + r2[0] * vl; car.vz = f2[1] * vf + r2[1] * vl;
  car.x += car.vx * dt; car.z += car.vz * dt;
  car.vf = vf;

  // Límites de la pista: la valla empuja de vuelta; el golpe frena, sacude y hace vibrar el mando.
  const idxAntes = car.idx;
  car.idx = cercano(car.x, car.z, car.idx);
  seguirAvance(car.idx - idxAntes);
  const i = car.idx, nx = nrx(i), nz = nrz(i);
  const d = (car.x - cx[i]) * nx + (car.z - cz[i]) * nz, lim = ANCHO - 0.4;
  if (Math.abs(d) > lim) {
    const s = Math.sign(d), exceso = Math.abs(d) - lim;
    car.x -= nx * s * exceso; car.z -= nz * s * exceso;
    const vn = (car.vx * nx + car.vz * nz) * s;
    if (vn > 0) {
      car.vx -= nx * s * vn * 1.3; car.vz -= nz * s * vn * 1.3;
      const golpe = clamp(vn / 25, 0, 1);
      if (golpe > 0.12) { sacudida.sumar(golpe * 0.7); inp.vibrar(golpe, golpe * 0.6, 160); chispasPared(s, golpe); sfx.golpe(golpe); }
    }
    const k = Math.exp(-1.2 * dt); car.vx *= k; car.vz *= k;
  }
}

function chispasPared(lado, fuerza) {
  const r = Math.round(10 * fuerza * R.q.particulas);
  for (let k = 0; k < r; k++) chispas.emitir(car.x, 0.6, car.z, (Math.random() - 0.5) * 8, 2 + Math.random() * 4, (Math.random() - 0.5) * 8, 0.45, 0.22, 1, 0.7, 0.25, 1, 18, 0.5, 0);
}

function efectos(dt) {
  const f = [Math.sin(car.h), Math.cos(car.h)], r = [-f[1], f[0]];
  const v = Math.hypot(car.vx, car.vz);
  car.rueda += car.vf * dt / 0.38;
  for (const w of ruedas) {
    w.r.rotation.x = car.rueda;
    if (w.delantera) w.pivote.rotation.y = -car.giro * 0.28;
  }
  coche.position.set(car.x, 0, car.z);
  const lateral = car.vx * r[0] + car.vz * r[1];
  coche.rotation.set(0, car.h + clamp(lateral * 0.012, -0.28, 0.28) * (car.derrapando ? 1 : 0.4), clamp(-car.giro * v * 0.0012, -0.06, 0.06));
  if (car.derrapando && Math.abs(lateral) > 3 && R.q.particulas > 0) {
    for (const lado of [-1, 1]) {
      if (Math.random() > 0.6 * R.q.particulas) continue;
      chispas.emitir(car.x - f[0] * 1.3 + r[0] * lado, 0.12, car.z - f[1] * 1.3 + r[1] * lado, (Math.random() - 0.5) * 2 - f[0] * 2, 0.8 + Math.random() * 1.4, (Math.random() - 0.5) * 2 - f[1] * 2, 0.5, 0.14, 1, 0.78, 0.4, 0.9, 7, 0.4, 0);
    }
  }
  if (car.usaNitro) {
    for (let k = 0; k < 3; k++) chispas.emitir(car.x - f[0] * 2.3 + (Math.random() - 0.5) * 0.4, 0.6, car.z - f[1] * 2.3 + (Math.random() - 0.5) * 0.4, -f[0] * 11 + (Math.random() - 0.5) * 2, 0.3, -f[1] * 11 + (Math.random() - 0.5) * 2, 0.28, 0.38, 0.3, 0.75, 1, 0.9, 0, 3, 1.2);
  }
  chispas.actualizar(dt, camara, R.alto);
}

function mover(dt) {
  const m = MODOS_CAM[cam.modo];
  const v = Math.hypot(car.vx, car.vz);
  // La cámara sigue entre el rumbo del coche y su dirección real: en derrape se ve el coche de lado.
  const rumbo = v > 6 ? Math.atan2(car.vx, car.vz) : car.h;
  let dy = rumbo - car.h; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
  const objetivo = car.h + dy * 0.5;
  let dd = objetivo - cam.yaw; dd = Math.atan2(Math.sin(dd), Math.cos(dd));
  cam.yaw += dd * (1 - Math.exp(-6 * dt));
  const sx = Math.sin(cam.yaw), sz = Math.cos(cam.yaw);
  const retro = car.usaNitro ? 1.2 : 0;
  const px = car.x - sx * (m.dist + retro), pz = car.z - sz * (m.dist + retro);
  cam.pos.set(amort(cam.pos.x, px, 14, dt), 0, amort(cam.pos.z, pz, 14, dt));
  camara.position.set(cam.pos.x, m.alto, cam.pos.z);
  camara.lookAt(car.x + sx * m.mira, 1.1, car.z + sz * m.mira);
  sacudida.aplicar(camara, dt);
  const fov = 66 + clamp(v / MAX_KMH_MS, 0, 1.3) * 11 + (car.usaNitro ? 7 : 0);
  cam.fov = amort(cam.fov, fov, 5, dt);
  if (Math.abs(camara.fov - cam.fov) > 0.05) { camara.fov = cam.fov; camara.updateProjectionMatrix(); }
  luna.position.set(car.x - 60, 120, car.z + 40); luna.target.position.set(car.x, 0, car.z);
  coche.visible = cam.modo !== 2;
}

// ───────────── HUD y minimapa ─────────────
const hKmh = $('hKmh'), hMarcha = $('hMarcha'), hNitro = $('hNitro'), hMapa = $('hMapa');
const BARRAS = 5;
for (let i = 0; i < BARRAS; i++) hNitro.appendChild(document.createElement('i'));
const mapaBase = document.createElement('canvas'); mapaBase.width = mapaBase.height = 380;
const mp = (() => {
  let a = Infinity, b = -Infinity, c = Infinity, d = -Infinity;
  for (let i = 0; i < MUESTRAS; i++) { a = Math.min(a, cx[i]); b = Math.max(b, cx[i]); c = Math.min(c, cz[i]); d = Math.max(d, cz[i]); }
  const esc = 340 / Math.max(b - a, d - c);
  return { esc, ox: 190 - ((a + b) / 2) * esc, oz: 190 - ((c + d) / 2) * esc };
})();
// El mapa se ve desde arriba con el norte (+z) hacia arriba: x se invierte porque la derecha del coche es -x.
const mx = (x) => 380 - (mp.ox + x * mp.esc), my = (z) => 380 - (mp.oz + z * mp.esc);
{
  const g = mapaBase.getContext('2d');
  g.lineJoin = g.lineCap = 'round'; g.beginPath();
  for (let i = 0; i <= MUESTRAS; i++) { const j = i % MUESTRAS; i ? g.lineTo(mx(cx[j]), my(cz[j])) : g.moveTo(mx(cx[j]), my(cz[j])); }
  g.strokeStyle = 'rgba(0,0,0,0.55)'; g.lineWidth = 20; g.stroke();
  g.strokeStyle = '#8f86c8'; g.lineWidth = 10; g.stroke();
  const ax = nrx(0) * ANCHO * 2.2, az = nrz(0) * ANCHO * 2.2;
  g.strokeStyle = '#fff'; g.lineWidth = 4; g.beginPath();
  g.moveTo(mx(cx[0] - ax), my(cz[0] - az)); g.lineTo(mx(cx[0] + ax), my(cz[0] + az)); g.stroke();
}
function pintarHud() {
  const kmh = Math.round(Math.abs(car.vf) * 3.6);
  hKmh.textContent = kmh;
  hMarcha.textContent = car.vf < -1 ? 'R' : Math.min(6, 1 + Math.floor(Math.abs(car.vf) / 11));
  const llenas = Math.floor(car.nitro * BARRAS + 0.001);
  [...hNitro.children].forEach((e, i) => e.classList.toggle('on', i < llenas));
  hNitro.classList.toggle('usando', car.usaNitro);
  const g = hMapa.getContext('2d');
  g.clearRect(0, 0, 380, 380); g.drawImage(mapaBase, 0, 0);
  g.fillStyle = '#ff9a3c'; g.beginPath(); g.arc(mx(car.x), my(car.z), 11, 0, 7); g.fill();
  g.strokeStyle = '#fff'; g.lineWidth = 3; g.stroke();
  hPos.textContent = Math.min(VUELTAS, carrera.vuelta + 1);
  hTotal.textContent = tiempo(carrera.t);
  hVueltaT.textContent = tiempo(carrera.t - carrera.inicioVuelta);
  hMejor.textContent = tiempo(mejorVuelta());
}
$('hAyuda').textContent = 'Pausa: Esc o Start · Reaparecer en la pista: R o Select';

// ───────────── Carrera: cuenta atrás, vueltas por avance sobre la pista, cronómetro y récord ─────────────
// El avance se mide en muestras recorridas (con signo): ir en reversa lo descuenta, así que cruzar la meta
// marcha atrás no suma vueltas. Una vuelta se cierra al acumular MUESTRAS más desde la salida.
const hPos = $('hPos'), hTotal = $('hTotal'), hVueltaT = $('hVueltaT'), hMejor = $('hMejor'), hMsg = $('hMsg'), hCuenta = $('cuenta');
$('hDe').textContent = '/' + VUELTAS; $('hVuelta').textContent = 'Vuelta';
const carrera = { fase: 'menu', cuenta: 0, t: 0, vuelta: 0, inicioVuelta: 0, tiempos: [], avance: 0, contra: 0, finEspera: 0, recVuelta: null, puesto: -1, prev: null, total: 0 };
let msgTimer = 0, cuentaMostrada = 4, ocultarCuenta = 0, avisoContra = false;

function mensaje(txt, esAviso = false, seg = 1.6) { hMsg.textContent = txt; hMsg.classList.toggle('aviso', esAviso); hMsg.classList.add('ver'); msgTimer = seg; }
function mejorVuelta() { let m = carrera.recVuelta; for (const v of carrera.tiempos) if (m == null || v < m) m = v; return m; }

function seguirAvance(d) {
  if (d > MUESTRAS / 2) d -= MUESTRAS; else if (d < -MUESTRAS / 2) d += MUESTRAS;
  if (!d) return;
  carrera.avance += d;
  carrera.contra = d < 0 ? Math.min(30, carrera.contra - d) : Math.max(0, carrera.contra - d * 2);
  while (carrera.fase === 'carrera' && carrera.avance >= (carrera.vuelta + 1) * MUESTRAS) cerrarVuelta();
}
function cerrarVuelta() {
  const tv = carrera.t - carrera.inicioVuelta, antes = mejorVuelta();
  carrera.tiempos.push(tv); carrera.inicioVuelta = carrera.t; carrera.vuelta++;
  if (carrera.vuelta >= VUELTAS) { terminar(); return; }
  sfx.vuelta(); inp.vibrar(0.3, 0.5, 120);
  const mejor = antes == null || tv < antes;
  mensaje((carrera.vuelta === VUELTAS - 1 ? 'Última vuelta' : 'Vuelta ' + (carrera.vuelta + 1)) + (mejor ? ' · mejor vuelta ' + tiempo(tv) : ''));
}
function terminar() {
  const total = carrera.t, mejorV = Math.min(...carrera.tiempos);
  carrera.fase = 'fin'; carrera.finEspera = 2; carrera.total = total;
  carrera.prev = records.mejor('neon', DEF.tabla);
  carrera.puesto = records.registrar('neon', DEF.tabla, +total.toFixed(3), true, { det: 'mejor vuelta ' + tiempo(mejorV) });
  records.registrar('neon', 'vuelta', +mejorV.toFixed(3), true);
  const record = carrera.puesto === 0;
  mensaje(record ? '¡Nuevo récord!' : 'Meta', false, 2);
  sfx.meta(record); inp.vibrar(0.6, 0.8, 300);
}
function pantallaFin() {
  const record = carrera.puesto === 0, mejor = Math.min(...carrera.tiempos);
  $('fTitulo').textContent = record ? '¡Nuevo récord!' : 'Carrera terminada';
  const pos = carrera.puesto >= 0 ? `puesto ${carrera.puesto + 1} de tus 5 mejores` : 'fuera de tus 5 mejores';
  $('fSub').textContent = `Tiempo total ${tiempo(carrera.total)} · ${pos}` + (carrera.prev && !record ? ` · tu récord: ${tiempo(carrera.prev.v)}` : '') + '. Se guarda solo en este navegador.';
  $('fTabla').innerHTML = '<tr><th>Vuelta</th><th>Tiempo</th><th></th></tr>' + carrera.tiempos.map((v, i) =>
    `<tr${v === mejor ? ' class="yo"' : ''}><td>${i + 1}</td><td>${tiempo(v)}</td><td>${v === mejor ? 'mejor vuelta' : '+' + (v - mejor).toFixed(2) + ' s'}</td></tr>`).join('');
  document.body.classList.remove('corriendo'); hMsg.classList.remove('ver'); msgTimer = 0;
  menus.abrir($('pFin'), 0);
}
function tickCuenta(dt) {
  carrera.cuenta -= dt;
  const n = Math.ceil(carrera.cuenta);
  if (n === cuentaMostrada) return;
  cuentaMostrada = n; hCuenta.hidden = false;
  if (n > 0) { hCuenta.textContent = n; hCuenta.classList.remove('ya'); ui.cuenta(false); return; }
  hCuenta.textContent = '¡YA!'; hCuenta.classList.add('ya'); ui.cuenta(true); inp.vibrar(0.2, 0.6, 150);
  carrera.fase = 'carrera'; carrera.t = 0; ocultarCuenta = 0.8;
}
function avisos(dt) {
  if (carrera.fase === 'carrera') {
    const contra = carrera.contra > 10 && Math.abs(car.vf) > 4;
    if (contra && !avisoContra) { avisoContra = true; mensaje('Sentido contrario', true, 1e9); }
    else if (!contra && avisoContra) { avisoContra = false; msgTimer = 0.01; }
  }
  if (msgTimer > 0 && (msgTimer -= dt) <= 0) hMsg.classList.remove('ver');
  if (ocultarCuenta > 0 && (ocultarCuenta -= dt) <= 0) hCuenta.hidden = true;
}

// ───────────── Sonido: APAGADO por defecto (jue_sonido). Encendido, arranca al primer gesto (tecla o clic) ─────────────
let motor = null, motorEncendido = false, faltaGesto = null, sonidoOn = sonidoActivo();
const musica = new Musica(CANCION);
addEventListener('pointerdown', () => iniciarAudio());
addEventListener('keydown', () => iniciarAudio());
function sonidoCuadro() {
  const falta = sonidoOn && !audio.activo();
  if (falta !== faltaGesto) { faltaGesto = falta; $('tSonido').hidden = !falta; }
  if (!motor && audio.activo()) motor = new SonidoCoche();
  if (!motor) return;
  const activo = jugando && !pausado && carrera.fase !== 'menu';
  if (activo !== motorEncendido) { motor.encender(activo); motorEncendido = activo; }
  if (activo) {
    const v = Math.abs(car.vf), marcha = Math.min(6, 1 + Math.floor(v / 11));
    const frac = marcha < 6 ? (v - (marcha - 1) * 11) / 11 : Math.min(1, (v - 55) / 29);
    const gas = carrera.fase === 'cuenta' ? inp.v('acelerar') : car.gas;
    const lat = Math.abs(-car.vx * Math.cos(car.h) + car.vz * Math.sin(car.h));
    const derrape = car.derrapando ? clamp(lat / 10, 0, 1) : clamp((lat - 6) / 10, 0, 0.6);
    motor.actualizar(v < 1 ? 0.1 + gas * 0.5 : 0.2 + 0.8 * frac, gas, derrape, car.usaNitro);
    if (!musica.sonando) musica.iniciar();
  } else if (musica.sonando) musica.parar();
}

// ───────────── Menús (todos navegables con cruceta o stick, A elige, B vuelve, Start reanuda) ─────────────
let jugando = false, pausado = false, ultimo = 0;
const CONTROLES = DEF.controles;
$('tablaCtl').innerHTML = '<tr><th>Acción</th><th>Teclado</th><th>Mando</th></tr>' + CONTROLES.map(([a, t, m]) => `<tr><td>${a}</td><td>${t}</td><td>${m}</td></tr>`).join('');
$('mModo').hidden = true; $('mDif').hidden = true;
opcion($('mCal'), NIVELES, nivel, 'Calidad', (q) => { fijarCalidad(q); location.reload(); });
$('ayudaTitulo').textContent = 'Cambiar la calidad reinicia el juego. Con el mando: cruceta o stick para moverte por el menú, A para elegir, B para volver.';
const PASOS_VOL = ['0%', '25%', '50%', '75%', '100%'];
const aPaso = (v) => PASOS_VOL[Math.round(v * 4)];
opcion($('pMusica'), PASOS_VOL, aPaso(volumenes().musica), 'Música', (v) => fijarVolumen('musica', parseInt(v, 10) / 100));
opcion($('pEfectos'), PASOS_VOL, aPaso(volumenes().efectos), 'Efectos', (v) => { fijarVolumen('efectos', parseInt(v, 10) / 100); ui.ok(); });
opcion($('pVib'), ['sí', 'no'], vibracionActiva() ? 'sí' : 'no', 'Vibración', (v) => { fijarVibracion(v === 'sí'); inp.vibracion = v === 'sí'; if (v === 'sí') inp.vibrar(0.5, 0.5, 150); });
// Un solo interruptor de sonido en dos menús (título y pausa): ambos botones se repintan juntos.
function pintarSonido() { for (const id of ['mSonido', 'pSonido']) $(id).innerHTML = `<span>Sonido</span><b>‹ ${sonidoOn ? 'sí' : 'no'} ›</b>`; }
for (const id of ['mSonido', 'pSonido']) {
  const b = $(id), cambiar = () => { sonidoOn = !sonidoOn; fijarSonido(sonidoOn); pintarSonido(); if (sonidoOn) ui.ok(); };
  b.dataset.nav = 'opcion'; b.addEventListener('click', cambiar); b.addEventListener('ajustar', cambiar);
}
pintarSonido();
function pintarRecordTitulo() {
  const m = records.mejor('neon', DEF.tabla);
  $('tRecord').textContent = m ? `Tu récord: ${tiempo(m.v)} · ${m.f}` : `Aún sin récord: completa ${VUELTAS} vueltas para marcarlo.`;
}

function nuevaCarrera() {
  colocar(MUESTRAS - ATRAS); cam.yaw = car.h; car.nitro = 0.4;
  const r = records.mejor('neon', 'vuelta');
  Object.assign(carrera, { fase: 'cuenta', cuenta: 3, t: 0, vuelta: 0, inicioVuelta: 0, tiempos: [], avance: -ATRAS, contra: 0, finEspera: 0, recVuelta: r ? r.v : null, puesto: -1, prev: null });
  cuentaMostrada = 4; ocultarCuenta = 0; avisoContra = false; msgTimer = 0; hMsg.classList.remove('ver');
  menus.cerrarTodo(); jugando = true; pausado = false;
  $('hud').hidden = false; document.body.classList.add('corriendo');
}
function empezar() { iniciarAudio(); ui.ok(); nuevaCarrera(); }
function pausar() {
  if (!jugando || pausado || menus.abierto) return;
  pausado = true; document.body.classList.remove('corriendo'); menus.abrir($('pPausa'), 0);
}
function seguir() { pausado = false; menus.cerrarTodo(); document.body.classList.add('corriendo'); }
function alMenu() {
  jugando = false; pausado = false; carrera.fase = 'menu'; $('hud').hidden = true; hCuenta.hidden = true;
  menus.cerrarTodo(); colocar(MUESTRAS - ATRAS); cam.yaw = car.h; pintarRecordTitulo(); menus.abrir($('pTitulo'), 0);
}
function aLaSala() { location.href = '../juegos.html'; }

$('mJugar').addEventListener('click', empezar);
$('mCtl').addEventListener('click', () => { ui.ok(); menus.abrir($('pControles'), 0); });
$('pCtl').addEventListener('click', () => { ui.ok(); menus.abrir($('pControles'), 0); });
$('cVolver').addEventListener('click', () => { ui.atras(); menus.cerrar(); });
$('mSalir').addEventListener('click', aLaSala);
$('pSalir').addEventListener('click', aLaSala);
$('pSeguir').addEventListener('click', seguir);
$('pReiniciar').addEventListener('click', () => { ui.ok(); nuevaCarrera(); });
$('pMenu').addEventListener('click', alMenu);
$('fOtra').addEventListener('click', () => { ui.ok(); nuevaCarrera(); });
$('fMenu').addEventListener('click', alMenu);
document.addEventListener('visibilitychange', () => { if (document.hidden) pausar(); });
inp.alPerderPad = () => pausar();
// Qué control escucha el juego: con el volante USB enchufado hay dos, y hay que poder verlo sin salir a la sala.
let padsVistos = null;
function pintarPad() {
  if (inp.pads === padsVistos) return;
  padsVistos = inp.pads;
  const p = inp.pads.find((x) => x.activo), n = inp.pads.length;
  $('tPad').hidden = !p; if (!p) return;
  $('tPad').textContent = `Control en uso: ${p.nombre}`
    + (n > 1 ? ` · hay ${n} conectados: manda el último en el que pulses un botón (se puede fijar uno en la sala de juegos)` : '')
    + (!p.estandar && !inp.mapas[p.id] ? ' · no usa el mapa estándar: configúralo en la sala de juegos' : '');
}
addEventListener('keydown', (e) => { if (e.code === 'F3') { e.preventDefault(); medidor.alternar(); } });

// ───────────── Bucle ─────────────
function cuadro(t) {
  requestAnimationFrame(cuadro);
  const dt = Math.min(0.05, (t - ultimo) / 1000 || 0.016); ultimo = t;
  medidor.inicio();
  inp.actualizar();
  pintarPad();
  if (!audio.activo() && inp.botones[BOTON.A] > 0.5 && inp.previos[BOTON.A] <= 0.5) iniciarAudio();
  if (menus.abierto) {
    menus.actualizar(dt);
    if (pausado && inp.botones[BOTON.START] > 0.5 && inp.previos[BOTON.START] <= 0.5) $('pSeguir').click();
  } else if (jugando) {
    if (inp.j('pausa')) pausar();
    else {
      if (inp.j('camara')) cam.modo = (cam.modo + 1) % MODOS_CAM.length;
      if (carrera.fase === 'cuenta') tickCuenta(dt);
      else {
        if (carrera.fase === 'carrera' && inp.j('reaparecer')) { colocar(car.idx); ui.atras(); }
        let resto = dt;
        while (resto > 0) { const s = Math.min(resto, 1 / 60); if (carrera.fase === 'carrera') carrera.t += s; paso(s); resto -= s; }
      }
      pintarHud();
    }
  }
  if (jugando && !pausado) {
    efectos(dt); avisos(dt);
    if (carrera.fase === 'fin' && (carrera.finEspera -= dt) <= 0) { carrera.fase = 'resultado'; pantallaFin(); }
  }
  sonidoCuadro();
  mover(dt);
  R.dibujar(scene, camara);
  medidor.fin(dt);
}

$('cargando').remove();
cam.pos.set(car.x - Math.sin(car.h) * 9.5, 0, car.z - Math.cos(car.h) * 9.5);
efectos(0.016);
pintarRecordTitulo();
menus.abrir($('pTitulo'), 0);
requestAnimationFrame(cuadro);
// Para pruebas desde la consola (piloto automático, medir vueltas). No se usa en el juego.
window.__neon = { car, inp, scene, R, largo, carrera, pista: { cx, cz, tx, tz, MUESTRAS },
  sonido: () => ({ activado: sonidoOn, contexto: audio.ctx ? audio.ctx.state : null, motor: !!motor, musica: musica.sonando }) };
