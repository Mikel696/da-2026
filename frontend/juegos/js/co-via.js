// 19-JUE · Corredor · Vía. Una carretera rural de dos carriles sobre lomas secas: asfalto, arcén de grava, cuneta y
// terreno. La forma sale de una lista de puntos; el aspecto, de texturas escaneadas (Poly Haven, CC0) que llegan
// en `M`. Devuelve también la consulta «¿dónde estoy?» que usa la conducción. Licencia: MIT (código propio).
import * as THREE from 'three';
import { clamp, lerp, suave, fbm, semilla, cinta } from './lc-util.js';
import { texturaCanvas } from './render.js';

export const PASO = 2;         // metros entre muestras de la línea central
export const ARCEN = 1.7;      // grava a cada lado del asfalto
const MARGEN = 0.75;           // cuánto puede meterse el centro de la camioneta en el arcén: de la vía no se sale

export const TRAMO = {
  id: 'tramo-1', ancho: 3.4, salida: 50,
  puntos: [[0, -60], [0, 0], [14, 90], [-6, 180], [-30, 270], [-12, 360], [26, 440], [32, 520], [10, 610], [0, 700]],
};

function suavizar(a, radio, pases) {
  const n = a.length, t = new Float32Array(n);
  for (let p = 0; p < pases; p++) {
    for (let i = 0; i < n; i++) { let s = 0, c = 0; for (let k = -radio; k <= radio; k++) { const j = i + k; if (j >= 0 && j < n) { s += a[j]; c++; } } t[i] = s / c; }
    a.set(t);
  }
}

export function crearVia(def, M) {
  const curva = new THREE.CatmullRomCurve3(def.puntos.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
  const n = Math.round(curva.getLength() / PASO) + 1, pts = curva.getSpacedPoints(n - 1), F = () => new Float32Array(n);
  const px = F(), py = F(), pz = F(), tx = F(), ty = F(), tz = F(), rx = F(), rz = F(), curv = F(), peralte = F(), dist = F(), W = def.ancho;
  for (let i = 0; i < n; i++) { px[i] = pts[i].x; pz[i] = pts[i].z; }
  for (let i = 0; i < n; i++) {
    const a = Math.max(0, i - 1), b = Math.min(n - 1, i + 1), dx = px[b] - px[a], dz = pz[b] - pz[a], l = Math.hypot(dx, dz) || 1;
    tx[i] = dx / l; tz[i] = dz / l; rx[i] = -tz[i]; rz[i] = tx[i];
    dist[i] = i ? dist[i - 1] + Math.hypot(px[i] - px[i - 1], pz[i] - pz[i - 1]) : 0;
  }
  for (let i = 1; i < n - 1; i++) curv[i] = ((tx[i + 1] - tx[i - 1]) * rx[i] + (tz[i + 1] - tz[i - 1]) * rz[i]) / (2 * PASO);
  suavizar(curv, 2, 2);
  // Lomas largas y suaves, con ondulación media y rugosidad fina. La carretera las sigue, pero alisada.
  const base = (x, z) => (fbm(x / 300 + 3.1, z / 300 + 7.7, 3) - 0.5) * 34 + (fbm(x / 70 + 1.3, z / 70 + 4.2, 2) - 0.5) * 5 + (fbm(x / 9 + 5, z / 9 + 2, 2) - 0.5) * 0.35;
  for (let i = 0; i < n; i++) py[i] = base(px[i], pz[i]);
  suavizar(py, 14, 4);
  for (let i = 0; i < n; i++) {
    const a = Math.max(0, i - 1), b = Math.min(n - 1, i + 1);
    ty[i] = (py[b] - py[a]) / ((dist[b] - dist[a]) || 1); peralte[i] = clamp(curv[i] * 0.9, -0.05, 0.05);
  }
  suavizar(peralte, 4, 2);

  const bombeo = (l) => 0.045 * (1 - Math.min(1, (l / W) ** 2));   // el asfalto es más alto en el centro para escurrir
  function punto(i, l, dy, v) { v[0] = px[i] + rx[i] * l; v[1] = py[i] - l * peralte[i] + bombeo(l) + dy; v[2] = pz[i] + rz[i] * l; return v; }
  function cercana(x, z, salto = 1) {
    let mejor = 0, md = Infinity;
    for (let i = 0; i < n; i += salto) { const d = (x - px[i]) ** 2 + (z - pz[i]) ** 2; if (d < md) { md = d; mejor = i; } }
    return mejor;
  }
  function consulta(x, z, desde, o) {
    let i = 0, md = Infinity;
    const a = desde < 0 ? 0 : Math.max(0, desde - 12), b = desde < 0 ? n - 1 : Math.min(n - 1, desde + 12);
    for (let k = a; k <= b; k++) { const d = (x - px[k]) ** 2 + (z - pz[k]) ** 2; if (d < md) { md = d; i = k; } }
    const s = clamp(((x - px[i]) * tx[i] + (z - pz[i]) * tz[i]) / PASO, -1, 1), j = s >= 0 ? Math.min(n - 1, i + 1) : Math.max(0, i - 1), f = Math.abs(s);
    const L = (arr) => arr[i] + (arr[j] - arr[i]) * f;
    o.i = i; o.rx = L(rx); o.rz = L(rz); o.tx = L(tx); o.tz = L(tz); o.ty = L(ty);
    o.lat = (x - L(px)) * o.rx + (z - L(pz)) * o.rz;
    o.ancho = W; o.peralte = L(peralte); o.curv = L(curv); o.dist = dist[i] + s * PASO;
    o.y = L(py) - o.lat * o.peralte + (Math.abs(o.lat) <= W ? bombeo(o.lat) : -0.05);
    o.margen = MARGEN; o.blando = true; o.muroIzq = o.muroDer = false;
    return o;
  }
  const fuera = { d: 0 };
  function terreno(x, z) {
    let i = cercana(x, z, 3), md = Infinity, k = i;
    for (let j = Math.max(0, i - 3); j <= Math.min(n - 1, i + 3); j++) { const d = (x - px[j]) ** 2 + (z - pz[j]) ** 2; if (d < md) { md = d; k = j; } }
    i = k;
    const d = Math.sqrt(md), lat = (x - px[i]) * rx[i] + (z - pz[i]) * rz[i], w0 = W + ARCEN, e = d - w0;
    fuera.d = d;
    if (e <= 0.4) return py[i] - lat * peralte[i] - 0.3;
    const t = suave(0, 18, e);   // cuneta junto al arcén y luego el terreno recupera su forma
    return lerp(py[i] - 0.2, base(x, z), t) - 0.5 * Math.exp(-(((e - 2.2) / 1.5) ** 2)) * (1 - t * 0.6);
  }

  // ───────────── Mallas ─────────────
  const grupo = new THREE.Group(), rnd = semilla(2026);
  const pon = (mesh, proyecta = false) => { mesh.receiveShadow = true; mesh.castShadow = proyecta; grupo.add(mesh); return mesh; };
  pon(new THREE.Mesh(cinta(n, 7, (i, c, v) => { const l = (c / 3 - 1) * W; punto(i, l, 0, v); v[3] = l / 5; v[4] = dist[i] / 5; }), M.asfalto));
  for (const sg of [-1, 1]) pon(new THREE.Mesh(cinta(n, 3, (i, c, v) => {
    const k = sg > 0 ? c / 2 : 1 - c / 2, l = sg * (W + k * (ARCEN + 0.45));
    v[0] = px[i] + rx[i] * l; v[1] = py[i] - l * peralte[i] - 0.02 - 0.2 * k * k; v[2] = pz[i] + rz[i] * l; v[3] = v[0] / 3; v[4] = v[2] / 3;
  }), M.grava));
  // Pintura vial gastada: dos líneas de borde continuas y la central a trazos (3 m pintados, 6 m sin pintar).
  const gastar = (g, w, h, cuanto) => { g.globalCompositeOperation = 'destination-out'; for (let k = 0; k < cuanto; k++) { g.fillStyle = `rgba(0,0,0,${0.3 + rnd() * 0.6})`; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 4, 1 + rnd() * 10); } };
  const tBorde = texturaCanvas(32, 256, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#d9d6cb'; g.fillRect(2, 0, w - 4, h); gastar(g, w, h, 240); });
  const tCentro = texturaCanvas(32, 288, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#d9d6cb'; g.fillRect(2, 0, w - 4, h / 3); gastar(g, w, h, 150); });
  const matLinea = (map) => new THREE.MeshStandardMaterial({ map, transparent: true, roughness: 0.62, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
  const linea = (l0, mat, largoTex) => { const m = new THREE.Mesh(cinta(n, 2, (i, c, v) => { punto(i, l0 + c * 0.13, 0.012, v); v[3] = c; v[4] = dist[i] / largoTex; }), mat); m.receiveShadow = true; m.renderOrder = 1; grupo.add(m); };
  const mB = matLinea(tBorde); linea(-W + 0.22, mB, 8); linea(W - 0.35, mB, 8); linea(-0.065, matLinea(tCentro), 9);

  // Terreno: malla regular recortada por la carretera, con manchas grandes de tono para que la textura no se repita a la vista.
  {
    const paso = 2.5; let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (let i = 0; i < n; i++) { x0 = Math.min(x0, px[i]); x1 = Math.max(x1, px[i]); z0 = Math.min(z0, pz[i]); z1 = Math.max(z1, pz[i]); }
    x0 -= 170; x1 += 170; z0 -= 150; z1 += 150;
    const nx = Math.ceil((x1 - x0) / paso) + 1, nz = Math.ceil((z1 - z0) / paso) + 1;
    const pos = new Float32Array(nx * nz * 3), uv = new Float32Array(nx * nz * 2), col = new Float32Array(nx * nz * 3), idx = new Uint32Array((nx - 1) * (nz - 1) * 6);
    for (let j = 0, k = 0; j < nz; j++) for (let i = 0; i < nx; i++, k++) {
      const x = x0 + i * paso, z = z0 + j * paso, m = 0.7 + 0.55 * fbm(x / 48 + 9, z / 48 + 3, 2), seco = fbm(x / 140, z / 140, 2);
      pos[k * 3] = x; pos[k * 3 + 1] = terreno(x, z); pos[k * 3 + 2] = z; uv[k * 2] = x / 4.5; uv[k * 2 + 1] = z / 4.5;
      // Junto a la vía la hierba está quemada por el polvo: el borde del arcén se funde con el campo en vez de cortarse.
      const polvo = (1 - suave(W + ARCEN, W + ARCEN + 11, fuera.d)) * 0.75 + suave(0.55, 0.8, fbm(x / 22 + 4, z / 22 + 8, 2)) * 0.45;
      col[k * 3] = m * (0.96 + seco * 0.16) * (1 + polvo * 0.55); col[k * 3 + 1] = m * (0.96 + seco * 0.06) * (1 + polvo * 0.16); col[k * 3 + 2] = m * (0.98 - seco * 0.12) * (1 - polvo * 0.3);
    }
    for (let j = 0, o = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1; idx[o++] = a; idx[o++] = c; idx[o++] = b; idx[o++] = b; idx[o++] = c; idx[o++] = d; }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeVertexNormals();
    pon(new THREE.Mesh(g, M.terreno));
  }
  return { def, n, px, py, pz, tx, ty, tz, rx, rz, curv, peralte, dist, largo: dist[n - 1], iInicio: Math.round(def.salida / PASO), grupo, base, terreno, fuera, consulta, punto, cercana };
}
