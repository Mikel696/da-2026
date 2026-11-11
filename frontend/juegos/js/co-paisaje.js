// 19-JUE · Corredor · Paisaje báltico. El bosque de abeto y pino son impostores: fotos de los modelos escaneados de
// Poly Haven (fir_tree_01, 4,2 M de triángulos; pine_tree_01, 7 M), horneadas una vez desde tres ángulos con color y
// normales, y plantadas como tres planos cruzados por árbol (12 triángulos en vez de millones). Los abetos jóvenes son
// el modelo real (fir_sapling) a menos de CERCA metros de la cámara y su foto más lejos. Pasto, helechos, tocones,
// rocas con musgo y troncos caídos a los lados. Todo CC0 (ver assets/ph/CREDITOS.json). Licencia: MIT (código propio).
import * as THREE from 'three';
import { semilla, fbm, cinta } from './lc-util.js';
import { ARCEN } from './co-via.js';

/** Medidas de cada atlas horneado (metros): R = medio ancho de la celda, H = alto de la celda, alturas por variante (fila). */
export const IMP = {
  abeto: { K: 3, R: 3.529, H: 18.925, alturas: [18.925, 14.055, 14.521], alto: 5172 },
  pino: { K: 3, R: 4.51, H: 20.375, alturas: [20.375, 14.881, 17.544], alto: 5568 },
  joven: { K: 3, R: 0.481, H: 1.301, alturas: [1.301, 0.952, 0.736], alto: 984 },
  pasto: { K: 2, R: 0.716, H: 0.537, alturas: [0.537], alto: 216 },
};
const CERCA = 30, TROZO = 240, PROF = 72;   // modelo real a menos de 30 m; trozos de 240 m de vía; fondo del bosque plantado

/** Tres planos cruzados (o K) con la vista horneada de cada ángulo. Se añaden a `a` (arrays sueltos de una malla). */
function plantar(a, imp, x, y, z, esc, giro, vari, t) {
  const filas = imp.alturas.length, h = imp.alturas[vari] * esc, w = imp.R * esc;
  const v0 = 1 - (vari + 1) / filas + 1 / imp.alto, v1 = 1 - (vari + 1) / filas + imp.alturas[vari] / imp.H / filas - 2 / imp.alto;
  for (let k = 0; k < imp.K; k++) {
    const ang = giro + k * Math.PI / imp.K, rx = Math.cos(ang), rz = -Math.sin(ang), nx = Math.sin(ang), nz = Math.cos(ang), u0 = k / imp.K + 0.002, u1 = (k + 1) / imp.K - 0.002;
    const b = a.n;
    for (const [u, v, du, dv] of [[u0, v0, -1, 0], [u1, v0, 1, 0], [u0, v1, -1, 1], [u1, v1, 1, 1]]) {
      a.pos.push(x + rx * w * du, y + h * dv, z + rz * w * du); a.nor.push(nx, 0, nz); a.uv.push(u, v); a.col.push(t[0], t[1], t[2]);
    }
    a.idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); a.n += 4;
  }
}
const vacio = () => ({ pos: [], nor: [], uv: [], col: [], idx: [], n: 0 });
function geometria(a) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(a.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(a.nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(a.uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(a.col, 3));
  g.setIndex(a.n > 65535 ? new THREE.Uint32BufferAttribute(a.idx, 1) : new THREE.Uint16BufferAttribute(a.idx, 1)); g.computeBoundingSphere();
  return g;
}
/**
 * Follaje en dos pasadas: primero solo la profundidad (una textura y descartar: barato) y después el color con
 * profundidad IGUAL, que solo pinta el plano que de verdad se ve. Sin esto, cada píxel del bosque se iluminaba unas
 * 15 veces (una por cada fila de árboles detrás) y el bosque costaba 12 ms por cuadro.
 */
function dosPasadas(a, pre, col) {
  const g = geometria(a), grupo = new THREE.Group(), mp = new THREE.Mesh(g, pre), mc = new THREE.Mesh(g, col);
  mp.renderOrder = -2; mc.renderOrder = -1; mc.receiveShadow = true; grupo.add(mp, mc); grupo.userData.impostor = true; return grupo;
}

/** Piezas de una variante de un modelo: cada malla con la matriz que la deja centrada en el origen y apoyada en y = 0. */
export function piezas(gltf, nombre) {
  const nodo = nombre ? gltf.scene.getObjectByName(nombre) : gltf.scene;
  gltf.scene.updateMatrixWorld(true);
  const caja = new THREE.Box3().setFromObject(nodo), c = caja.getCenter(new THREE.Vector3()), base = new THREE.Matrix4().makeTranslation(-c.x, -caja.min.y, -c.z), out = [];
  nodo.traverse((o) => { if (o.isMesh) out.push({ geo: o.geometry, mat: o.material, m: new THREE.Matrix4().multiplyMatrices(base, o.matrixWorld) }); });
  return out;
}
/** Reparte copias entre las variantes (al azar con `rnd`): una llamada de dibujo por malla de cada variante. */
export function repartirVariantes(variantes, matrices, rnd, { sombra = true, hojas = false } = {}) {
  const g = new THREE.Group(), m = new THREE.Matrix4(), cubos = variantes.map(() => []);
  for (const M of matrices) cubos[Math.floor(rnd() * variantes.length)].push(M);
  variantes.forEach((pz, k) => {
    if (!cubos[k].length) return;
    for (const p of pz) {
      if (hojas) { p.mat.transparent = false; p.mat.alphaTest = 0.45; p.mat.side = THREE.DoubleSide; p.mat.depthWrite = true; }
      const im = new THREE.InstancedMesh(p.geo, p.mat, cubos[k].length);
      cubos[k].forEach((M, j) => im.setMatrixAt(j, m.multiplyMatrices(M, p.m)));
      im.castShadow = sombra; im.receiveShadow = true; im.computeBoundingSphere(); g.add(im);
    }
  });
  return g;
}

/**
 * tex: { abeto, pino, joven, pasto } con { c: color, n: normales } · mod: { joven, helecho, tocon, rocas, tronco } (gltf)
 * evitar: [{ centro, radio }] (campamentos, tiradores…) · msaa: si hay muestreo múltiple, bordes suaves (alpha to coverage).
 */
export function crearPaisaje(scene, P, { tex, mod, evitar, msaa, densidad = 1 }) {
  const rnd = semilla(4242), W = P.def.ancho, [gx0, gx1, gz0, gz1] = P.limites;
  const mat = (t, extra = {}) => {
    const m = new THREE.MeshStandardMaterial(Object.assign({ map: t.c, normalMap: t.n, alphaTest: 0.5, side: THREE.DoubleSide, vertexColors: true, roughness: 0.9, metalness: 0 }, extra));
    m.alphaToCoverage = !!msaa; return m;
  };
  const color = (t, extra = {}) => new THREE.MeshStandardMaterial(Object.assign({ map: t.c, normalMap: t.n, side: THREE.DoubleSide, vertexColors: true, roughness: 0.9, metalness: 0, depthFunc: THREE.EqualDepth, depthWrite: false }, extra));
  const prof = (t, lejos) => {
    const m = new THREE.MeshBasicMaterial({ map: t.c, alphaTest: 0.5, side: THREE.DoubleSide, colorWrite: false }); m.alphaToCoverage = !!msaa;
    // El pasto se desvanece con la distancia: a lo lejos sus hojas son más finas que un píxel y solo harían ruido.
    if (lejos) m.onBeforeCompile = (s) => {
      s.vertexShader = 'varying float vLejos;\n' + s.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\nvLejos = -mvPosition.z;');
      s.fragmentShader = 'varying float vLejos;\n' + s.fragmentShader.replace('#include <alphatest_fragment>', `diffuseColor.a -= smoothstep(${lejos[0]}.0, ${lejos[1]}.0, vLejos);\n#include <alphatest_fragment>`);
    };
    return m;
  };
  const pAbeto = prof(tex.abeto), cAbeto = color(tex.abeto), pPino = prof(tex.pino), cPino = color(tex.pino), mJoven = mat(tex.joven);
  const pPasto = prof(tex.pasto, [42, 75]), cPasto = color(tex.pasto, { roughness: 0.95 });
  const libre = (x, z, r = 0) => x > gx0 + 4 && x < gx1 - 4 && z > gz0 + 4 && z < gz1 - 4 && !evitar.some((c) => (x - c.centro.x) ** 2 + (z - c.centro.z) ** 2 < (c.radio + r) ** 2);
  const trozos = Array.from({ length: Math.ceil(P.largo / TROZO) }, (_, k) => {
    const im = Math.min(P.n - 1, Math.round(((k + 0.5) * TROZO) / 2));
    return { centro: new THREE.Vector3(P.px[im], P.py[im], P.pz[im]), abeto: vacio(), pino: vacio(), pasto: vacio(), suelo: { helecho: [], tocon: [], rocas: [], tronco: [] }, mallas: [], cerca: null };
  });
  const trozoDe = (s) => trozos[Math.min(trozos.length - 1, Math.max(0, Math.floor(s / TROZO)))];
  const idx = (s) => Math.min(P.n - 1, Math.max(0, Math.round(s / 2)));
  const M4 = (x, y, z, giro, e, inclina = 0.06) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler((rnd() - 0.5) * inclina, giro, (rnd() - 0.5) * inclina)), new THREE.Vector3(e, e * (0.85 + rnd() * 0.3), e));
  const jovenes = [];

  // ── Bosque: filas desde el borde (que cambia a lo largo de la vía: a veces el bosque llega cerca, a veces hay campo abierto).
  for (const lado of [-1, 1]) for (let s = 0; s < P.largo; s += 4.3 / densidad) {
    const i = idx(s), B = P.borde(P.dist[i], lado);
    for (let l = B + rnd() * 3; l < B + PROF; l += (4.2 + rnd() * 1.8) / densidad) {
      const ds = (rnd() - 0.5) * 3.6, x = P.px[i] + P.rx[i] * lado * l + P.tx[i] * ds, z = P.pz[i] + P.rz[i] * lado * l + P.tz[i] * ds;
      if (!libre(x, z, 3)) continue;
      const y = P.terreno(x, z); if (P.fuera.d < P.borde(P.dist[P.fuera.i], lado) - 2) continue;   // por dentro de una curva, lejos de otro tramo de vía
      const pino = fbm(x / 90 + 2, z / 90 + 7, 2) + (rnd() - 0.5) * 0.25 > 0.5, e = (l - B < 6 ? 0.62 : 0.74) + rnd() * 0.42, k = 0.82 + rnd() * 0.3;
      const tr = trozoDe(P.dist[i] + ds);
      if (pino) plantar(tr.pino, IMP.pino, x, y - 0.25, z, e, rnd() * 6.283, Math.floor(rnd() * 3), [k * 1.3, k * 1.26, k * 1.12]);
      else plantar(tr.abeto, IMP.abeto, x, y - 0.25, z, e, rnd() * 6.283, Math.floor(rnd() * 3), [k, k * 1.02, k * 0.96]);
    }
    // Orla: abetos jóvenes delante del bosque y sueltos por el campo; helechos al pie de los árboles.
    if (rnd() < 0.55) {
      const l = rnd() < 0.7 ? B - 1 - rnd() * 6 : W + ARCEN + 9 + rnd() * Math.max(1, B - W - 12), ds = (rnd() - 0.5) * 3, x = P.px[i] + P.rx[i] * lado * l + P.tx[i] * ds, z = P.pz[i] + P.rz[i] * lado * l + P.tz[i] * ds;
      if (libre(x, z, 2)) { const y = P.terreno(x, z); if (P.fuera.d > W + ARCEN + 7) jovenes.push({ x, y: y - 0.1, z, e: 1.8 + rnd() * 2.4, giro: rnd() * 6.283, v: Math.floor(rnd() * 3), k: 0.85 + rnd() * 0.3 }); }
    }
    if (rnd() < 0.5) {
      const l = B - 4 + rnd() * 9, x = P.px[i] + P.rx[i] * lado * l, z = P.pz[i] + P.rz[i] * lado * l;
      if (libre(x, z, 1)) { const y = P.terreno(x, z); trozoDe(P.dist[i]).suelo.helecho.push(M4(x, y - 0.03, z, rnd() * 6.283, 1.1 + rnd() * 1.1, 0.1)); }
    }
  }
  // ── Junto a la vía: pasto alto pasada la cuneta, helechos en la orilla, tocones, rocas con musgo y troncos caídos.
  for (const lado of [-1, 1]) for (let s = 0; s < P.largo; s += 0.55 / densidad) {
    const i = idx(s), B = P.borde(P.dist[i], lado), l = W + ARCEN + 3.6 + 1.6 + (rnd() ** 1.4) * Math.min(26, B - W - 4), ds = (rnd() - 0.5) * 2;
    const x = P.px[i] + P.rx[i] * lado * l + P.tx[i] * ds, z = P.pz[i] + P.rz[i] * lado * l + P.tz[i] * ds;
    if (!libre(x, z, 0.5)) continue;
    const y = P.terreno(x, z), k = 0.8 + rnd() * 0.35;
    plantar(trozoDe(s).pasto, IMP.pasto, x, y - 0.04, z, 1.3 + rnd() * 0.8, rnd() * 6.283, 0, [k * 0.95, k, k * 0.8]);
    const r = rnd(), tr = trozoDe(s).suelo;
    if (r < 0.02) tr.helecho.push(M4(x, y - 0.03, z, rnd() * 6.283, 0.9 + rnd() * 0.8, 0.1));
    else if (r < 0.0215) tr.tocon.push(M4(x, y - 0.12, z, rnd() * 6.283, 0.9 + rnd() * 0.5));
    else if (r < 0.0255) tr.rocas.push(M4(x, y - 0.25, z, rnd() * 6.283, 0.35 + rnd() * 0.5, 0.2));
    else if (r < 0.0262) tr.tronco.push(M4(x, y - 0.05, z, rnd() * 6.283, 0.9 + rnd() * 0.5, 0.04));
  }
  // La cuneta lleva pasto en sus dos orillas: así el agua se ve metida en la hierba, no pegada encima.
  for (const lado of [-1, 1]) for (let s = 0; s < P.largo; s += 0.8 / densidad) {
    const i = idx(s);
    for (const q of [2.35 + rnd() * 0.3, 4.9 + rnd() * 0.4]) {
      const l = W + q, x = P.px[i] + P.rx[i] * lado * l, z = P.pz[i] + P.rz[i] * lado * l;
      if (!libre(x, z, 0.5)) continue;
      const k = 0.78 + rnd() * 0.3; plantar(trozoDe(s).pasto, IMP.pasto, x, P.terreno(x, z) - 0.06, z, 0.9 + rnd() * 0.7, rnd() * 6.283, 0, [k * 0.95, k, k * 0.8]);
    }
  }

  const vHelecho = ['fern_02_a', 'fern_02_b', 'fern_02_c', 'fern_02_d'].map((n) => piezas(mod.helecho, n));
  const vRocas = [1, 2, 3, 4, 5, 6].map((n) => piezas(mod.rocas, 'rock_moss_set_01_rock0' + n));
  const vTocon = [piezas(mod.tocon)], vTronco = [piezas(mod.tronco)];
  for (const t of trozos) {
    const g = new THREE.Group(); scene.add(g); t.grupo = g;
    if (t.abeto.n) g.add(dosPasadas(t.abeto, pAbeto, cAbeto));
    if (t.pino.n) g.add(dosPasadas(t.pino, pPino, cPino));
    t.cerca = t.pasto.n ? dosPasadas(t.pasto, pPasto, cPasto) : new THREE.Group(); scene.add(t.cerca);
    t.piso = new THREE.Group(); scene.add(t.piso);
    t.piso.add(repartirVariantes(vHelecho, t.suelo.helecho, rnd, { sombra: false, hojas: true }));
    t.piso.add(repartirVariantes(vTocon, t.suelo.tocon, rnd, { sombra: false }));
    t.piso.add(repartirVariantes(vRocas, t.suelo.rocas, rnd));
    t.piso.add(repartirVariantes(vTronco, t.suelo.tronco, rnd, { sombra: false }));
    t.abeto = t.pino = t.pasto = t.suelo = null;
  }

  // ── Fondo: entre los troncos de las últimas filas se veía el cielo (una franja blanca a ras de suelo). Detrás del bosque va
  // una pared oscura, del color de su interior en sombra, con el borde de arriba irregular y escondido bajo las copas.
  const mFondo = new THREE.MeshStandardMaterial({ color: new THREE.Color().setRGB(0.026, 0.034, 0.022), roughness: 1, metalness: 0, side: THREE.DoubleSide });
  for (const lado of [-1, 1]) {
    const g = cinta(P.n, 2, (i, c, v) => {
      const l = lado * (P.borde(P.dist[i], lado) + PROF - 3), x = P.px[i] + P.rx[i] * l, z = P.pz[i] + P.rz[i] * l, y = P.terreno(x, z);
      v[0] = x; v[2] = z; v[1] = c ? y + 9 + 4 * fbm(P.dist[i] / 14 + lado * 3, 1.7, 2) : y - 1; v[3] = 0; v[4] = 0;
    });
    const m = new THREE.Mesh(g, mFondo); m.frustumCulled = false; scene.add(m);
  }

  // ── Abetos jóvenes: modelo real cerca, foto lejos. Se reasignan cada pocos cuadros según la distancia a la cámara.
  const vJoven = ['fir_sapling_a', 'fir_sapling_b', 'fir_sapling_c'].map((n) => piezas(mod.joven, n));
  // Sin sombra y como mucho 3 por variante: cada uno son ~145 000 triángulos y se dibujan dos veces (imagen y oclusión ambiental).
  const CAP = 3, reales = vJoven.map((pz) => pz.map((p) => { const im = new THREE.InstancedMesh(p.geo, p.mat, CAP); im.count = 0; im.castShadow = false; im.receiveShadow = true; im.frustumCulled = false; scene.add(im); return { im, p }; }));
  const gFoto = vJoven.map((_, v) => { const a = vacio(); plantar(a, IMP.joven, 0, 0, 0, 1, 0, v, [1, 1, 1]); return geometria(a); });
  const fotos = gFoto.map((g) => { const im = new THREE.InstancedMesh(g, mJoven, jovenes.length || 1); im.count = 0; im.frustumCulled = false; im.receiveShadow = true; scene.add(im); return im; });
  for (const j of jovenes) j.M = new THREE.Matrix4().compose(new THREE.Vector3(j.x, j.y, j.z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), j.giro), new THREE.Vector3(j.e, j.e * j.k, j.e));
  const MT = new THREE.Matrix4(), tinte = new THREE.Color();
  let cuadro = 0, vis = null;
  function repartirJovenes(cam) {
    const nR = [0, 0, 0], nF = [0, 0, 0];
    for (const j of jovenes) {
      const d2 = (j.x - cam.x) ** 2 + (j.z - cam.z) ** 2, lim = j.real ? (CERCA + 3) ** 2 : (CERCA - 3) ** 2;   // histéresis: no parpadea en el límite
      j.real = d2 < lim && nR[j.v] < CAP;
      if (j.real) { for (const r of reales[j.v]) r.im.setMatrixAt(nR[j.v], MT.multiplyMatrices(j.M, r.p.m)); nR[j.v]++; }
      else { fotos[j.v].setMatrixAt(nF[j.v], j.M); fotos[j.v].setColorAt(nF[j.v], tinte.setRGB(j.k, j.k, j.k * 0.95)); nF[j.v]++; }
    }
    reales.forEach((rs, v) => rs.forEach((r) => { r.im.count = nR[v]; r.im.instanceMatrix.needsUpdate = true; }));
    fotos.forEach((f, v) => { f.count = nF[v]; f.instanceMatrix.needsUpdate = true; if (f.instanceColor) f.instanceColor.needsUpdate = true; });
  }
  return {
    jovenes, trozos,
    /** Cada cuadro: qué trozos se dibujan y qué abetos jóvenes son modelo real. */
    actualizar(cam, lejos) {
      for (const t of trozos) { const d2 = cam.distanceToSquared(t.centro); t.grupo.visible = d2 < (lejos * 2.2) ** 2; t.cerca.visible = d2 < (75 + TROZO / 2) ** 2; t.piso.visible = d2 < (110 + TROZO / 2) ** 2; }
      if (cuadro++ % 6 === 0) repartirJovenes(cam);
    },
    contar() { return { arboles: trozos.reduce((a, t) => a + t.grupo.children.reduce((b, g) => b + g.children[0].geometry.index.count / 6 / 3, 0), 0), jovenes: jovenes.length, reales: jovenes.filter((j) => j.real).length }; },
    /** La oclusión ambiental dibuja la escena con su propio material, sin transparencias: los planos saldrían como paredes. */
    ocultarImpostores(si) {
      if (si) { vis = trozos.map((t) => [t.grupo.visible, t.cerca.visible]); for (const t of trozos) t.grupo.visible = t.cerca.visible = false; }
      else if (vis) trozos.forEach((t, k) => { [t.grupo.visible, t.cerca.visible] = vis[k]; });
    },
  };
}
