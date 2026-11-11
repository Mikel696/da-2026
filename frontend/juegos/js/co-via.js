// 19-JUE · Corredor · Vía. Una carretera rural báltica de dos carriles sobre lomas suaves: asfalto, arcén de grava, cuneta con agua y
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

/** La misión completa: base de salida, valle minado, cielo hostil, paso de las emboscadas y base avanzada (~2,3 km).
 *  Va casi recta en z a propósito: el terreno es una rejilla sobre el rectángulo que encierra la vía. */
export const RUTA = {
  id: 'ruta', ancho: 3.4, salida: 70,
  puntos: [[0, -90], [0, -20], [0, 40], [14, 120], [-6, 210], [-30, 300], [-12, 390], [26, 470], [32, 550], [10, 640], [-14, 730], [-40, 820], [-30, 910], [0, 990],
    [30, 1070], [40, 1160], [22, 1250], [-8, 1340], [-34, 1430], [-26, 1520], [4, 1610], [30, 1700], [26, 1790], [0, 1880], [-20, 1970], [-12, 2060], [0, 2140], [0, 2230]],
};

/** El mismo valle recorrido al revés: otra carretera para el jugador sin cargar otro terreno. */
export const TRAMO_INVERSO = { ...TRAMO, id: 'tramo-inverso', puntos: TRAMO.puntos.slice().reverse() };

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
  const base = (x, z) => (fbm(x / 320 + 3.1, z / 320 + 7.7, 3) - 0.5) * 15 + (fbm(x / 80 + 1.3, z / 80 + 4.2, 2) - 0.5) * 2.6 + (fbm(x / 9 + 5, z / 9 + 2, 2) - 0.5) * 0.3;
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
  // Al costado: grava, luego la cuneta con agua (centro a CUNETA m del asfalto) y el campo, que recupera su forma.
  // q = distancia al borde del asfalto. El bosque empieza a `borde(s, lado)` m del centro: cambia a lo largo de la vía.
  const Q0 = ARCEN + 0.45, CUNETA = 3.6, MEDIA = 1.45, HONDO = 0.75, AGUA = 0.47;
  const zanja = (q) => -HONDO * (1 - suave(0, MEDIA, Math.abs(q - CUNETA)));
  const borde = (s, lado) => 22 + 72 * suave(0.46, 0.7, fbm(s / 230 + (lado > 0 ? 13.1 : 3.7), lado * 4.3 + 0.7, 2));
  function alturaLado(i, lat, q, x, z) {
    const yb = py[i] - lat * peralte[i];
    if (q <= 0) return yb + bombeo(lat);
    if (q <= Q0) return yb - 0.02 - 0.2 * (q / Q0) ** 2;
    return lerp(yb - 0.22, base(x, z), suave(CUNETA + MEDIA, 26, q)) + zanja(q);
  }
  const fuera = { d: 0, i: 0, lat: 0, q: 0, sale: false };
  function terreno(x, z) {
    let i = cercana(x, z, 3), md = Infinity, k = i;
    for (let j = Math.max(0, i - 3); j <= Math.min(n - 1, i + 3); j++) { const d = (x - px[j]) ** 2 + (z - pz[j]) ** 2; if (d < md) { md = d; k = j; } }
    i = k;
    const d = Math.sqrt(md), lat = (x - px[i]) * rx[i] + (z - pz[i]) * rz[i], along = (x - px[i]) * tx[i] + (z - pz[i]) * tz[i];
    fuera.d = d; fuera.i = i; fuera.lat = lat; fuera.q = d - W; fuera.sale = (i === 0 && along < -0.5) || (i === n - 1 && along > 0.5);
    return alturaLado(i, lat, d - W, x, z);
  }
  /** Color del suelo (multiplica la textura de pasto): pradera verde con manchas secas, orilla más seca, suelo de bosque. */
  function colorSuelo(x, z, q, d, B, c) {
    const m = 0.74 + 0.5 * fbm(x / 40 + 9, z / 40 + 3, 2), seco = suave(0.5, 0.76, fbm(x / 110, z / 110, 2)), orilla = 1 - suave(2.5, 10, q), bosque = suave(B - 6, B + 3, d);
    const r = lerp(0.78 + seco * 0.3 + orilla * 0.14, 0.56, bosque), g = lerp(1.0 + seco * 0.04 - orilla * 0.03, 0.56, bosque), b = lerp(0.6 - seco * 0.1 - orilla * 0.04, 0.44, bosque);
    c[0] = r * m; c[1] = g * m; c[2] = b * m;
  }

  // ───────────── Mallas ─────────────
  const grupo = new THREE.Group(), rnd = semilla(2026), col = [0, 0, 0];
  const pon = (mesh, proyecta = false) => { mesh.receiveShadow = true; mesh.castShadow = proyecta; grupo.add(mesh); return mesh; };
  pon(new THREE.Mesh(cinta(n, 7, (i, c, v) => { const l = (c / 3 - 1) * W; punto(i, l, 0, v); v[3] = l / 5; v[4] = dist[i] / 5; }), M.asfalto));
  for (const sg of [-1, 1]) pon(new THREE.Mesh(cinta(n, 3, (i, c, v) => {
    const k = sg > 0 ? c / 2 : 1 - c / 2, l = sg * (W + k * (ARCEN + 0.45));
    v[0] = px[i] + rx[i] * l; v[1] = py[i] - l * peralte[i] - 0.02 - 0.2 * k * k; v[2] = pz[i] + rz[i] * l; v[3] = v[0] / 3; v[4] = v[2] / 3;
  }), M.grava));
  // Orilla: una franja fina que sigue la vía hasta 14,5 m del asfalto y dibuja la cuneta (la malla del campo, de 2,5 m, no puede).
  const QS = [Q0, 2.5, 2.85, 3.15, 3.4, 3.6, 3.8, 4.05, 4.35, 4.7, 5.05, 5.8, 7, 8.6, 10.5, 12.5, 14.5];
  for (const sg of [-1, 1]) {
    const cols = sg > 0 ? QS : QS.slice().reverse();
    const g = cinta(n, cols.length, (i, c, v) => { const q = cols[c], l = sg * (W + q); v[0] = px[i] + rx[i] * l; v[2] = pz[i] + rz[i] * l; v[1] = alturaLado(i, l, q, v[0], v[2]); v[3] = v[0] / 4.5; v[4] = v[2] / 4.5; });
    const p = g.attributes.position, cc = new Float32Array(p.count * 3);
    for (let i = 0; i < n; i++) for (let c = 0; c < cols.length; c++) { const k = i * cols.length + c; colorSuelo(p.getX(k), p.getZ(k), cols[c], W + cols[c], borde(dist[i], sg), col); cc[k * 3] = col[0]; cc[k * 3 + 1] = col[1]; cc[k * 3 + 2] = col[2]; }
    g.setAttribute('color', new THREE.BufferAttribute(cc, 3));
    pon(new THREE.Mesh(g, M.terreno));
    // Agua quieta en el fondo de la cuneta: horizontal de orilla a orilla; donde la tierra sube, la tapa. El nivel cambia a lo
    // largo de la vía: en unos tramos hay charcos y en otros la cuneta está seca (el agua queda por debajo del fondo).
    if (M.agua) pon(new THREE.Mesh(cinta(n, 2, (i, c, v) => {
      const q = (sg > 0 ? c : 1 - c) ? CUNETA + 0.8 : CUNETA - 0.8, l = sg * (W + q);
      v[0] = px[i] + rx[i] * l; v[2] = pz[i] + rz[i] * l; v[1] = py[i] - sg * (W + CUNETA) * peralte[i] - 0.22 - AGUA - 0.34 * suave(0.42, 0.6, fbm(dist[i] / 40 + sg * 7.3, 3.3, 2)); v[3] = v[0] / 6; v[4] = v[2] / 6;
    }), M.agua));
  }
  // Pintura vial gastada: dos líneas de borde continuas y la central a trazos (3 m pintados, 6 m sin pintar).
  const gastar = (g, w, h, cuanto) => { g.globalCompositeOperation = 'destination-out'; for (let k = 0; k < cuanto; k++) { g.fillStyle = `rgba(0,0,0,${0.3 + rnd() * 0.6})`; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 4, 1 + rnd() * 10); } };
  const tBorde = texturaCanvas(32, 256, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#d9d6cb'; g.fillRect(2, 0, w - 4, h); gastar(g, w, h, 240); });
  const tCentro = texturaCanvas(32, 288, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#d9d6cb'; g.fillRect(2, 0, w - 4, h / 3); gastar(g, w, h, 150); });
  const matLinea = (map) => new THREE.MeshStandardMaterial({ map, transparent: true, roughness: 0.62, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
  const linea = (l0, mat, largoTex) => { const m = new THREE.Mesh(cinta(n, 2, (i, c, v) => { punto(i, l0 + c * 0.13, 0.012, v); v[3] = c; v[4] = dist[i] / largoTex; }), mat); m.receiveShadow = true; m.renderOrder = 1; grupo.add(m); };
  const mB = matLinea(tBorde); linea(-W + 0.22, mB, 8); linea(W - 0.35, mB, 8); linea(-0.065, matLinea(tCentro), 9);

  // Campo: malla regular de 2,5 m. Junto a la vía se hunde bajo la orilla (que es la que se ve) para no asomar por ella.
  let limites;
  {
    const paso = 2.5; let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (let i = 0; i < n; i++) { x0 = Math.min(x0, px[i]); x1 = Math.max(x1, px[i]); z0 = Math.min(z0, pz[i]); z1 = Math.max(z1, pz[i]); }
    x0 -= 170; x1 += 170; z0 -= 150; z1 += 150; limites = [x0, x1, z0, z1];
    const nx = Math.ceil((x1 - x0) / paso) + 1, nz = Math.ceil((z1 - z0) / paso) + 1;
    const pos = new Float32Array(nx * nz * 3), uv = new Float32Array(nx * nz * 2), cc = new Float32Array(nx * nz * 3), idx = new Uint32Array((nx - 1) * (nz - 1) * 6);
    for (let j = 0, k = 0; j < nz; j++) for (let i = 0; i < nx; i++, k++) {
      const x = x0 + i * paso, z = z0 + j * paso, y = terreno(x, z), q = fuera.q;
      const hundir = fuera.sale ? (q < 0.5 ? 0.3 : 0) : q < 6.5 ? 0.9 : q < 9 ? lerp(0.9, 0.08, suave(6.5, 9, q)) : 0.08 * (1 - suave(12, 14.5, q));
      pos[k * 3] = x; pos[k * 3 + 1] = y - hundir; pos[k * 3 + 2] = z; uv[k * 2] = x / 4.5; uv[k * 2 + 1] = z / 4.5;
      colorSuelo(x, z, q, fuera.d, borde(dist[fuera.i], fuera.lat >= 0 ? 1 : -1), col); cc[k * 3] = col[0]; cc[k * 3 + 1] = col[1]; cc[k * 3 + 2] = col[2];
    }
    for (let j = 0, o = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1; idx[o++] = a; idx[o++] = c; idx[o++] = b; idx[o++] = b; idx[o++] = c; idx[o++] = d; }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.BufferAttribute(cc, 3));
    g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeVertexNormals();
    pon(new THREE.Mesh(g, M.terreno));
  }
  return { def, n, px, py, pz, tx, ty, tz, rx, rz, curv, peralte, dist, largo: dist[n - 1], iInicio: Math.round(def.salida / PASO), grupo, base, terreno, fuera, consulta, punto, cercana, borde, limites, CUNETA };
}
