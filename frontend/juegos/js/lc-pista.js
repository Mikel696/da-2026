// 19-JUE · Luciérnaga · Pista. De una lista de puntos sale todo lo que se pisa y lo que la bordea: asfalto,
// arcén, muros de contención, guardarraíles, pintura, señales y farolas. Y la consulta «¿dónde estoy?».
// Licencia: MIT (código propio). Texturas pintadas en canvas: ningún archivo de terceros.
import * as THREE from 'three';
import { texturaCanvas } from './render.js';
import { clamp, lerp, suave, fbm, semilla, cinta, normalesDeAlturas } from './lc-util.js';

export const PASO = 2;        // metros entre muestras de la línea central
export const ARCEN = 1.25;    // franja de hormigón entre el asfalto y el muro o el guardarraíl
const HOLGURA = 3.8;          // detrás de un muro el terreno no sube hasta aquí: la malla de la ladera es más gruesa que el muro

// Una pista es esto: puntos en planta (x, z) y la ladera sobre la que se apoya. La altura sale sola.
export const HOTARU = {
  id: 'hotaru', nombre: 'Paso Hotaru', kanji: '蛍峠',
  ancho: 3.7,
  monte: { y0: 96, pendiente: 0.33, dir: [1, 0] },
  puntos: [[0, -64], [0, 0], [5, 60], [16, 115], [16, 170], [28, 222], [38, 252], [52, 266], [66, 252], [70, 200], [84, 150],
    [86, 95], [100, 45], [104, -10], [112, -44], [126, -58], [140, -44], [144, 5], [156, 60], [160, 120], [172, 170], [176, 236], [176, 310]],   // tras la meta quedan 140 m para frenar
  salida: 62, meta: [172, 170],
};

function suavizar(a, radio, pases) {
  const n = a.length, t = new Float32Array(n);
  for (let p = 0; p < pases; p++) {
    for (let i = 0; i < n; i++) { let s = 0, c = 0; for (let k = -radio; k <= radio; k++) { const j = i + k; if (j >= 0 && j < n) { s += a[j]; c++; } } t[i] = s / c; }
    a.set(t);
  }
}

function texturas() {
  const rnd = semilla(8605);
  const asfalto = texturaCanvas(512, 1024, (g, W, H) => {
    g.fillStyle = '#18191d'; g.fillRect(0, 0, W, H);
    for (let k = 0; k < 30000; k++) { const v = 18 + rnd() * 22; g.fillStyle = `rgb(${v},${v},${v + 3})`; g.fillRect(rnd() * W, rnd() * H, 1.6, 1.6); }
    for (let k = 0; k < 7; k++) { g.fillStyle = `rgba(${rnd() < 0.5 ? '10,10,12' : '44,44,48'},0.28)`; g.fillRect(rnd() * W * 0.8, rnd() * H, 60 + rnd() * 150, 80 + rnd() * 240); }
    for (const u of [0.2, 0.37, 0.63, 0.8]) {   // rodadas: el asfalto pulido por donde pisan las llantas
      const gr = g.createLinearGradient((u - 0.07) * W, 0, (u + 0.07) * W, 0);
      gr.addColorStop(0, 'rgba(6,6,8,0)'); gr.addColorStop(0.5, 'rgba(6,6,8,0.4)'); gr.addColorStop(1, 'rgba(6,6,8,0)');
      g.fillStyle = gr; g.fillRect((u - 0.07) * W, 0, 0.14 * W, H);
    }
    g.lineCap = 'round';
    for (let k = 0; k < 9; k++) {             // marcas de derrape
      const x = W * (0.15 + rnd() * 0.7), y = rnd() * H, l = 120 + rnd() * 260, c = (rnd() - 0.5) * 90;
      g.strokeStyle = `rgba(3,3,4,${0.25 + rnd() * 0.3})`; g.lineWidth = 5 + rnd() * 5;
      for (const d of [0, 14 + rnd() * 6]) { g.beginPath(); g.moveTo(x + d, y); g.quadraticCurveTo(x + d + c, y + l / 2, x + d + c * 0.3, y + l); g.stroke(); }
    }
    g.strokeStyle = 'rgba(4,4,5,0.7)'; g.lineWidth = 1.3;
    for (let k = 0; k < 16; k++) { let x = rnd() * W, y = rnd() * H; g.beginPath(); g.moveTo(x, y); for (let s = 0; s < 7; s++) { x += (rnd() - 0.5) * 40; y += 12 + rnd() * 30; g.lineTo(x, y); } g.stroke(); }
    g.fillStyle = '#d6d3c8'; g.fillRect(0.034 * W, 0, 0.022 * W, H); g.fillRect(0.944 * W, 0, 0.022 * W, H);
    g.fillStyle = '#d88b1e'; g.fillRect(0.489 * W, 0, 0.022 * W, H);
    for (let k = 0; k < 600; k++) {             // pintura gastada
      const x = [0.034, 0.944, 0.489][k % 3] * W + rnd() * 0.022 * W;
      g.fillStyle = 'rgba(24,25,29,0.6)'; g.fillRect(x, rnd() * H, 1 + rnd() * 1.5, 1 + rnd() * 3);
    }
  });
  const brillo = texturaCanvas(256, 512, (g, W, H) => {   // rugosidad: oscuro = espejo. Charcos y rodadas brillan
    g.fillStyle = 'rgb(118,118,118)'; g.fillRect(0, 0, W, H);
    for (const u of [0.2, 0.37, 0.63, 0.8]) { g.fillStyle = 'rgba(70,70,70,0.55)'; g.fillRect((u - 0.05) * W, 0, 0.1 * W, H); }
    for (let k = 0; k < 16; k++) {
      const x = rnd() * W, y = rnd() * H, r = 18 + rnd() * 52, gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, 'rgba(26,26,26,0.95)'); gr.addColorStop(0.7, 'rgba(34,34,34,0.7)'); gr.addColorStop(1, 'rgba(60,60,60,0)');
      g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, r, r * (1.4 + rnd()), 0, 0, 7); g.fill();
    }
    g.fillStyle = 'rgb(190,190,190)'; g.fillRect(0.034 * W, 0, 0.022 * W, H); g.fillRect(0.944 * W, 0, 0.022 * W, H); g.fillRect(0.489 * W, 0, 0.022 * W, H);
  }, { srgb: false });
  const N = 256, alt = new Float32Array(N * N);
  for (let i = 0; i < N * N; i++) alt[i] = rnd();
  for (let p = 0; p < 2; p++) for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = x + y * N; alt[i] = (alt[i] * 2 + alt[((x + 1) % N) + y * N] + alt[x + ((y + 1) % N) * N]) / 4;
  }
  for (let p = 0; p < 2; p++) for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {   // segunda pasada: sin ella el asfalto chispea como sal
    const i = x + y * N; alt[i] = (alt[i] * 2 + alt[((x + N - 1) % N) + y * N] + alt[x + ((y + N - 1) % N) * N]) / 4;
  }
  const grano = normalesDeAlturas(N, alt, 7); grano.repeat.set(3, 5);
  const hormigon = texturaCanvas(256, 256, (g, W, H) => {
    g.fillStyle = '#5c5f63'; g.fillRect(0, 0, W, H);
    for (let k = 0; k < 9000; k++) { const v = 70 + rnd() * 50; g.fillStyle = `rgba(${v},${v},${v},0.5)`; g.fillRect(rnd() * W, rnd() * H, 2, 2); }
    for (let k = 0; k < 22; k++) { const x = rnd() * W, gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, 'rgba(22,24,24,0.5)'); gr.addColorStop(1, 'rgba(22,24,24,0)'); g.fillStyle = gr; g.fillRect(x, 0, 3 + rnd() * 9, H * (0.3 + rnd() * 0.7)); }
    g.strokeStyle = 'rgba(20,22,24,0.85)'; g.lineWidth = 3;
    for (let i = 0; i <= 2; i++) { g.beginPath(); g.moveTo(0, i * 128); g.lineTo(W, i * 128); g.stroke(); g.beginPath(); g.moveTo(i * 128 + (i % 2) * 0, 0); g.lineTo(i * 128, H); g.stroke(); }
  });
  const flecha = (izq) => texturaCanvas(128, 96, (g, W, H) => {
    g.fillStyle = '#e9b81a'; g.fillRect(0, 0, W, H); g.fillStyle = '#101010';
    if (izq) { g.translate(W, 0); g.scale(-1, 1); }
    for (const x of [8, 62]) { g.beginPath(); g.moveTo(x, 8); g.lineTo(x + 26, 8); g.lineTo(x + 56, 48); g.lineTo(x + 26, 88); g.lineTo(x, 88); g.lineTo(x + 30, 48); g.closePath(); g.fill(); }
  });
  const letrero = texturaCanvas(256, 1024, (g, W, H) => {   // «速度落せ» (baje la velocidad), como se pinta en el asfalto: el primer signo, el más cercano
    g.clearRect(0, 0, W, H); g.fillStyle = '#dedbd0'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = "900 200px 'Yu Gothic', 'Meiryo', 'Hiragino Sans', 'Noto Sans JP', sans-serif";
    ['速', '度', '落', 'せ'].forEach((c, k) => { g.save(); g.translate(W / 2, H - 128 - k * 256); g.scale(1.12, 1.22); g.fillText(c, 0, 0); g.restore(); });
    g.globalCompositeOperation = 'destination-out';
    for (let k = 0; k < 5000; k++) { g.fillStyle = 'rgba(0,0,0,0.8)'; g.fillRect(rnd() * W, rnd() * H, 1 + rnd() * 3, 1 + rnd() * 4); }
  });
  const raya = texturaCanvas(64, 64, (g, W, H) => { g.clearRect(0, 0, W, H); g.fillStyle = '#e4e1d6'; g.fillRect(0, H * 0.35, W, H * 0.3); });
  const cuadros = texturaCanvas(256, 64, (g, W, H) => { for (let y = 0; y < 2; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? '#111' : '#e8e6de'; g.fillRect(x * 32, y * 32, 32, 32); } });
  const halo = texturaCanvas(128, 128, (g, W) => {
    const gr = g.createRadialGradient(W / 2, W / 2, 0, W / 2, W / 2, W / 2);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.18, 'rgba(255,255,255,0.55)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.13)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, W, W);
  });
  return { asfalto, brillo, grano, hormigon, flechaD: flecha(false), flechaI: flecha(true), letrero, raya, cuadros, halo };
}

export function crearPista(def) {
  const curva = new THREE.CatmullRomCurve3(def.puntos.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
  const n = Math.round(curva.getLength() / PASO) + 1, pts = curva.getSpacedPoints(n - 1);
  const F = () => new Float32Array(n);
  const px = F(), py = F(), pz = F(), tx = F(), ty = F(), tz = F(), rx = F(), rz = F(), curv = F(), ancho = F(), peralte = F(), dist = F();
  for (let i = 0; i < n; i++) { px[i] = pts[i].x; pz[i] = pts[i].z; }
  for (let i = 0; i < n; i++) {
    const a = Math.max(0, i - 1), b = Math.min(n - 1, i + 1), dx = px[b] - px[a], dz = pz[b] - pz[a], l = Math.hypot(dx, dz) || 1;
    tx[i] = dx / l; tz[i] = dz / l;
    rx[i] = -tz[i]; rz[i] = tx[i];           // derecha del sentido de marcha (con +z al frente, la derecha es -x)
    dist[i] = i ? dist[i - 1] + Math.hypot(px[i] - px[i - 1], pz[i] - pz[i - 1]) : 0;
  }
  for (let i = 1; i < n - 1; i++) curv[i] = ((tx[i + 1] - tx[i - 1]) * rx[i] + (tz[i + 1] - tz[i - 1]) * rz[i]) / (2 * PASO);   // > 0: curva a la derecha
  suavizar(curv, 2, 2);

  // La ladera sin tocar, y el perfil de la carretera: baja siempre, nunca más del 9,5 %.
  const m = def.monte;
  const base = (x, z) => m.y0 - m.pendiente * (x * m.dir[0] + z * m.dir[1]) + (fbm(x / 150 + 7.3, z / 150 + 1.9, 3) - 0.5) * 20 + (fbm(x / 26 + 3.1, z / 26 + 8.4, 2) - 0.5) * 2.2;
  py[0] = base(px[0], pz[0]);
  for (let i = 1; i < n; i++) py[i] = clamp(base(px[i], pz[i]), py[i - 1] - 0.095 * PASO, py[i - 1] - 0.004 * PASO);
  suavizar(py, 10, 3);
  for (let i = 0; i < n; i++) {
    const a = Math.max(0, i - 1), b = Math.min(n - 1, i + 1);
    ty[i] = (py[b] - py[a]) / ((dist[b] - dist[a]) || 1);
    ancho[i] = def.ancho + Math.min(1.5, Math.abs(curv[i]) * 22);
    peralte[i] = clamp(curv[i] * 1.1, -0.075, 0.075);
  }
  suavizar(ancho, 6, 2); suavizar(peralte, 4, 2);

  // A cada lado: ¿la ladera sube (muro de contención) o cae (guardarraíl)? muro[0] = izquierda, muro[1] = derecha.
  const muro = [F(), F()];
  for (let s = 0; s < 2; s++) {
    const sg = s ? 1 : -1, dif = muro[s];
    for (let i = 0; i < n; i++) { const l = sg * (ancho[i] + 5); dif[i] = base(px[i] + rx[i] * l, pz[i] + rz[i] * l) - py[i]; }
    suavizar(dif, 5, 2);
    for (let i = 0; i < n; i++) dif[i] = dif[i] > 1 ? clamp(dif[i] * 0.8, 1, 4.4) : 0;
    suavizar(dif, 3, 2);
  }
  const conMuro = (s, i) => muro[s][i] > 0.25;

  function punto(i, l, dy, v) { v[0] = px[i] + rx[i] * l; v[1] = py[i] - l * peralte[i] + dy; v[2] = pz[i] + rz[i] * l; return v; }
  function cercana(x, z, salto = 1) {
    let mejor = 0, md = Infinity;
    for (let i = 0; i < n; i += salto) { const d = (x - px[i]) ** 2 + (z - pz[i]) ** 2; if (d < md) { md = d; mejor = i; } }
    return mejor;
  }

  /** Dónde está (x, z) respecto a la carretera. `desde` = muestra anterior (búsqueda local) o -1 (toda la pista). */
  function consulta(x, z, desde, o) {
    let i = 0, md = Infinity;
    const a = desde < 0 ? 0 : Math.max(0, desde - 12), b = desde < 0 ? n - 1 : Math.min(n - 1, desde + 12);
    for (let k = a; k <= b; k++) { const d = (x - px[k]) ** 2 + (z - pz[k]) ** 2; if (d < md) { md = d; i = k; } }
    const s = clamp(((x - px[i]) * tx[i] + (z - pz[i]) * tz[i]) / PASO, -1, 1);
    const j = s >= 0 ? Math.min(n - 1, i + 1) : Math.max(0, i - 1), f = Math.abs(s);
    const L = (arr) => arr[i] + (arr[j] - arr[i]) * f;
    o.i = i; o.rx = L(rx); o.rz = L(rz); o.tx = L(tx); o.tz = L(tz); o.ty = L(ty);
    o.lat = (x - L(px)) * o.rx + (z - L(pz)) * o.rz;
    o.ancho = L(ancho); o.peralte = L(peralte); o.curv = L(curv);
    o.y = L(py) - o.lat * o.peralte;
    o.dist = dist[i] + s * PASO;
    o.muroIzq = muro[0][i] > 0.25; o.muroDer = muro[1][i] > 0.25;
    return o;
  }

  /** Altura de la ladera ya recortada por la carretera. Deja en `fuera.d` la distancia a la línea central. */
  const fuera = { d: 0 };
  function terreno(x, z) {
    let i = cercana(x, z, 3), md = Infinity, k = i;
    for (let j = Math.max(0, i - 3); j <= Math.min(n - 1, i + 3); j++) { const d = (x - px[j]) ** 2 + (z - pz[j]) ** 2; if (d < md) { md = d; k = j; } }
    i = k;
    const d = Math.sqrt(md), lat = (x - px[i]) * rx[i] + (z - pz[i]) * rz[i], w0 = ancho[i] + ARCEN + 0.15, hm = muro[lat > 0 ? 1 : 0][i];
    fuera.d = d;
    if (hm > 0.25) { const e = d - (w0 + HOLGURA); return e <= 0 ? py[i] - lat * peralte[i] - 0.3 : lerp(py[i] + hm - 0.15, base(x, z), suave(0, 9, e)); }
    const e = d - w0;
    return e <= 0 ? py[i] - lat * peralte[i] - 0.3 : lerp(py[i] - 0.35, base(x, z), suave(0, 12, e));
  }

  // ───────────── Mallas ─────────────
  const T = texturas(), grupo = new THREE.Group(), v3 = [0, 0, 0];
  const sombra = (mesh, proyecta = false) => { mesh.receiveShadow = true; mesh.castShadow = proyecta; grupo.add(mesh); return mesh; };

  sombra(new THREE.Mesh(cinta(n, 5, (i, c, v) => { punto(i, (c / 2 - 1) * ancho[i], 0, v); v[3] = c / 4; v[4] = dist[i] / 12; }),
    new THREE.MeshStandardMaterial({ map: T.asfalto, roughnessMap: T.brillo, normalMap: T.grano, normalScale: new THREE.Vector2(0.2, 0.2), roughness: 1, metalness: 0 })));

  const matHormigon = new THREE.MeshStandardMaterial({ map: T.hormigon, roughness: 0.88, metalness: 0, side: THREE.DoubleSide });
  const matRail = new THREE.MeshStandardMaterial({ color: 0xd5d9dd, roughness: 0.42, metalness: 0.35, side: THREE.DoubleSide });
  const matTierra = new THREE.MeshStandardMaterial({ color: 0x1c2317, roughness: 1 });
  const PERFIL = [[0, 0.38], [0.055, 0.46], [0, 0.54], [0.055, 0.62], [0, 0.70]];
  const postes = [], luces = [];
  for (let s = 0; s < 2; s++) {
    const sg = s ? 1 : -1;
    sombra(new THREE.Mesh(cinta(n, 2, (i, c, v) => {
      const k = sg > 0 ? c : 1 - c; punto(i, sg * (ancho[i] + k * ARCEN), -0.03 * k, v); v[3] = k * 0.4; v[4] = dist[i] / 3;
    }), matHormigon));
    sombra(new THREE.Mesh(cinta(n, 2, (i, c, v) => {
      const h = muro[s][i]; punto(i, sg * (ancho[i] + ARCEN + c * h * 0.12), c * h - 0.06, v); v[3] = dist[i] / 3; v[4] = c * h / 3;
    }, (i) => conMuro(s, i)), matHormigon), true);
    sombra(new THREE.Mesh(cinta(n, 2, (i, c, v) => {   // lo que tapa el hueco entre la corona del muro y la ladera
      const h = muro[s][i], k = sg > 0 ? c : 1 - c; punto(i, sg * (ancho[i] + ARCEN + h * 0.12 + k * (HOLGURA + 2.2)), h - 0.06 + k * 0.18, v); v[3] = k; v[4] = dist[i] / 3;
    }, (i) => conMuro(s, i)), matTierra));
    sombra(new THREE.Mesh(cinta(n, 5, (i, c, v) => { punto(i, sg * (ancho[i] + 0.95 - PERFIL[c][0]), PERFIL[c][1], v); v[3] = dist[i]; v[4] = c / 4; },
      (i) => muro[s][i] <= 0.6), matRail), true);
    for (let i = 1; i < n; i += 2) if (muro[s][i] <= 0.6) { postes.push(punto(i, sg * (ancho[i] + 1.0), 0, [0, 0, 0])); luces.push({ p: punto(i, sg * (ancho[i] + 0.9), 0.82, [0, 0, 0]), s }); }
  }
  const M4 = new THREE.Matrix4(), col = new THREE.Color();
  {
    const g = new THREE.CylinderGeometry(0.055, 0.055, 0.78, 6); g.translate(0, 0.37, 0);
    const im = new THREE.InstancedMesh(g, matRail, postes.length);
    postes.forEach((p, k) => im.setMatrixAt(k, M4.makeTranslation(p[0], p[1], p[2])));
    sombra(im);
    // Captafaros: blancos a la izquierda, ámbar a la derecha. De noche dibujan la curva antes de que la veas.
    const ojos = new THREE.InstancedMesh(new THREE.SphereGeometry(0.036, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffffff }), luces.length);
    luces.forEach((l, k) => { ojos.setMatrixAt(k, M4.makeTranslation(l.p[0], l.p[1], l.p[2])); ojos.setColorAt(k, l.s ? col.setRGB(1.5, 0.72, 0.14) : col.setRGB(0.95, 0.95, 0.88)); });
    grupo.add(ojos);
  }

  // Paneles de curva en el exterior de las curvas cerradas.
  {
    const lado = [[], []], q = new THREE.Quaternion(), e = new THREE.Euler(), uno = new THREE.Vector3(1, 1, 1), pos = new THREE.Vector3();
    for (let i = 3; i < n - 3; i += 3) if (Math.abs(curv[i]) > 0.028) lado[curv[i] > 0 ? 0 : 1].push(i);
    lado.forEach((lista, d) => {
      if (!lista.length) return;
      const tex = d ? T.flechaI : T.flechaD;
      const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.66, 0.5), new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.2, roughness: 0.55 }), lista.length);
      lista.forEach((i, k) => {
        const sg = d ? 1 : -1; punto(i, sg * (ancho[i] + 1.12), 1.05, v3);
        q.setFromEuler(e.set(0, Math.atan2(-tx[i], -tz[i]), 0)); im.setMatrixAt(k, M4.compose(pos.set(v3[0], v3[1], v3[2]), q, uno));
      });
      grupo.add(im);
    });
  }

  // Pintura sobre el asfalto: sigue la pendiente y el peralte porque se construye sobre las mismas muestras.
  const matCalco = (map) => new THREE.MeshStandardMaterial({ map, transparent: true, roughness: 0.75, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
  function calco(i0, i1, l0, l1, mat) {
    i0 = clamp(i0, 0, n - 2); i1 = clamp(i1, i0 + 1, n - 1);
    const mesh = new THREE.Mesh(cinta(i1 - i0 + 1, 2, (k, c, v) => { punto(i0 + k, c ? l1 : l0, 0.03, v); v[3] = c; v[4] = k / (i1 - i0); }), mat);
    mesh.receiveShadow = true; mesh.renderOrder = 1; grupo.add(mesh);
  }
  const iInicio = Math.round(def.salida / PASO), iMeta = cercana(def.meta[0], def.meta[1]);
  calco(iInicio, iInicio + 1, -ancho[iInicio], ancho[iInicio], matCalco(T.raya));
  calco(iMeta, iMeta + 1, -ancho[iMeta], ancho[iMeta], matCalco(T.cuadros));
  const apices = [];
  for (let i = 8; i < n - 8; i++) if (Math.abs(curv[i]) > 0.05 && Math.abs(curv[i]) >= Math.abs(curv[i - 1]) && Math.abs(curv[i]) > Math.abs(curv[i + 1]) && (!apices.length || i - apices[apices.length - 1] > 30)) apices.push(i);
  const matLetrero = matCalco(T.letrero);
  for (const a of apices) if (a - 46 > iInicio) calco(a - 46, a - 39, -ancho[a - 42] / 2 - 1.15, -ancho[a - 42] / 2 + 1.15, matLetrero);

  // Farolas de sodio: poste, brazo, cabeza encendida, halo y el charco de luz en el asfalto.
  const farolas = [];
  {
    const donde = [];
    for (let i = 13, k = 0; i < n - 6; i += 27, k++) donde.push([i, k % 2 ? 1 : -1]);
    for (const a of apices) donde.push([a, curv[a] > 0 ? -1 : 1]);
    const N = donde.length, sodio = new THREE.Color(1, 0.6, 0.24);
    const gPoste = new THREE.CylinderGeometry(0.07, 0.11, 7.1, 6); gPoste.translate(0, 3.55, 0);
    const metal = new THREE.MeshStandardMaterial({ color: 0x3a3f46, roughness: 0.6, metalness: 0.5 });
    const iPoste = new THREE.InstancedMesh(gPoste, metal, N), iBrazo = new THREE.InstancedMesh(new THREE.BoxGeometry(2.75, 0.07, 0.07), metal, N);
    const iCabeza = new THREE.InstancedMesh(new THREE.BoxGeometry(0.78, 0.1, 0.3), new THREE.MeshBasicMaterial({ color: sodio.clone().multiplyScalar(5) }), N);
    const gCharco = new THREE.PlaneGeometry(13, 13); gCharco.rotateX(-Math.PI / 2);
    const iCharco = new THREE.InstancedMesh(gCharco, new THREE.MeshBasicMaterial({ map: T.halo, color: sodio, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false }), N);
    const q = new THREE.Quaternion(), e = new THREE.Euler(), uno = new THREE.Vector3(1, 1, 1), pos = new THREE.Vector3();
    const X = new THREE.Vector3(), Y = new THREE.Vector3(), Z = new THREE.Vector3(), halos = new Float32Array(N * 3);
    donde.forEach(([i, sg], k) => {
      const w = ancho[i], yaw = Math.atan2(-rz[i], rx[i]);
      punto(i, sg * (w + 1.75), 0, v3); iPoste.setMatrixAt(k, M4.makeTranslation(v3[0], v3[1] - 0.1, v3[2]));
      q.setFromEuler(e.set(0, yaw, 0));
      punto(i, sg * (w + 0.45), 0, v3); iBrazo.setMatrixAt(k, M4.compose(pos.set(v3[0], py[i] + 7.0, v3[2]), q, uno));
      punto(i, sg * (w - 0.9), 0, v3); const hx = v3[0], hz = v3[2], hy = py[i] + 6.95;
      iCabeza.setMatrixAt(k, M4.compose(pos.set(hx, hy, hz), q, uno));
      X.set(tx[i], ty[i], tz[i]).normalize(); Z.set(rx[i], -peralte[i], rz[i]).normalize(); Y.crossVectors(Z, X).normalize();
      iCharco.setMatrixAt(k, M4.makeBasis(X, Y, Z).setPosition(hx, v3[1] + 0.06, hz));
      halos[k * 3] = hx; halos[k * 3 + 1] = hy - 0.1; halos[k * 3 + 2] = hz;
      farolas.push({ x: hx, y: hy, z: hz, i });
    });
    iPoste.castShadow = true; iCharco.renderOrder = 2;
    grupo.add(iPoste, iBrazo, iCabeza, iCharco);
    const gh = new THREE.BufferGeometry(); gh.setAttribute('position', new THREE.BufferAttribute(halos, 3));
    const ph = new THREE.Points(gh, new THREE.PointsMaterial({ map: T.halo, color: sodio.clone().multiplyScalar(1.6), size: 7, sizeAttenuation: true, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
    ph.frustumCulled = false; grupo.add(ph);
  }

  return { def, n, px, py, pz, tx, ty, tz, rx, rz, curv, ancho, peralte, dist, muro, largo: dist[n - 1], iInicio, iMeta, apices, farolas,
    grupo, base, terreno, fuera, consulta, punto, cercana, texHalo: T.halo };
}
