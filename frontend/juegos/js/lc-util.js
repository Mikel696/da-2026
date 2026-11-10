// 19-JUE · Luciérnaga · Utilidades: ruido, azar con semilla y fusión de geometrías. Sin estado, sin DOM.
import * as THREE from 'three';

export const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
export const lerp = (a, b, t) => a + (b - a) * t;
export const suave = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

/** Azar repetible: la misma semilla da siempre la misma montaña y el mismo bosque. */
export function semilla(s) {
  return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function hash(ix, iz) {
  let h = (Math.imul(ix, 374761393) + Math.imul(iz, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
/** Ruido de valores 2D en 0..1, continuo. */
export function ruido(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz;
  const sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz);
  const a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1);
  return a + (b - a) * sx + (c - a) * sz + (a - b - c + d) * sx * sz;
}
export function fbm(x, z, octavas = 4) {
  let v = 0, amp = 0.5, tot = 0;
  for (let o = 0; o < octavas; o++) { v += ruido(x, z) * amp; tot += amp; x = x * 2.03 + 11.7; z = z * 2.03 + 5.3; amp *= 0.5; }
  return v / tot;
}

/** Da a toda la geometría un color por vértice (para fundir piezas de distinto color en un solo dibujo). */
export function pintar(geo, color) {
  const c = new THREE.Color(color), n = geo.attributes.position.count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
  geo.setAttribute('color', new THREE.BufferAttribute(a, 3));
  return geo;
}

/** Une geometrías en una sola (posición, normal, color): muchas piezas, una llamada de dibujo. */
export function fusionar(lista) {
  const gs = lista.map((g) => (g.index ? g.toNonIndexed() : g));
  const n = gs.reduce((a, g) => a + g.attributes.position.count, 0);
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3).fill(1);
  let o = 0;
  for (const g of gs) {
    pos.set(g.attributes.position.array, o * 3);
    if (g.attributes.normal) nor.set(g.attributes.normal.array, o * 3);
    if (g.attributes.color) col.set(g.attributes.color.array, o * 3);
    o += g.attributes.position.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return out;
}

/** Cinta de `filas` × `cols` vértices: fn(i, c, v) rellena v = [x, y, z, u, w]. `activo(i)` recorta tramos. */
export function cinta(filas, cols, fn, activo) {
  const pos = new Float32Array(filas * cols * 3), uv = new Float32Array(filas * cols * 2), idx = [], v = [0, 0, 0, 0, 0];
  for (let i = 0; i < filas; i++) for (let c = 0; c < cols; c++) {
    fn(i, c, v); const k = i * cols + c;
    pos[k * 3] = v[0]; pos[k * 3 + 1] = v[1]; pos[k * 3 + 2] = v[2]; uv[k * 2] = v[3]; uv[k * 2 + 1] = v[4];
  }
  for (let i = 0; i < filas - 1; i++) {
    if (activo && !(activo(i) && activo(i + 1))) continue;
    for (let c = 0; c < cols - 1; c++) { const a = i * cols + c, b = a + 1, d = a + cols, e = d + 1; idx.push(a, b, d, b, e, d); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

/** Mapa de normales a partir de un campo de alturas n×n que se repite. */
export function normalesDeAlturas(n, alt, fuerza) {
  const c = document.createElement('canvas'); c.width = c.height = n;
  const g = c.getContext('2d'), im = g.createImageData(n, n), d = im.data;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const l = alt[((x - 1 + n) % n) + y * n], r = alt[((x + 1) % n) + y * n], u = alt[x + ((y - 1 + n) % n) * n], b = alt[x + ((y + 1) % n) * n];
    const nx = (l - r) * fuerza, ny = (u - b) * fuerza, k = 1 / Math.hypot(nx, ny, 1), o = (x + y * n) * 4;
    d[o] = (nx * k * 0.5 + 0.5) * 255; d[o + 1] = (ny * k * 0.5 + 0.5) * 255; d[o + 2] = (k * 0.5 + 0.5) * 255; d[o + 3] = 255;
  }
  g.putImageData(im, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  return t;
}
