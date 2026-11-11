// 19-JUE · Corredor · Campamentos. La base de salida, los puestos de control del camino y la base avanzada de llegada:
// muro de gaviones (cestas de malla llenas de tierra), carpas de lona, torre de vigilancia, barrera de entrada, manga
// de viento, y la utilería escaneada de Poly Haven (barreras, barriles, cajas, bidones, botiquines, estufa de barril).
// Sin banderas ni insignias. Todo se apoya en el terreno real (P.terreno). Licencia: MIT (código propio).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { semilla } from './lc-util.js';
import { ARCEN } from './co-via.js';
import { texturaCanvas } from './render.js';

// Gavión: cesta de malla electrosoldada llena de tierra. La malla se pinta en la textura; la tierra asoma entre los alambres.
let matGavion = null;
function gavion() {
  if (matGavion) return matGavion;
  const t = texturaCanvas(128, 128, (g, w, h) => {
    g.fillStyle = '#6f6047'; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 900; k++) { const v = 70 + Math.random() * 60; g.fillStyle = `rgba(${v + 25},${v + 10},${v - 15},0.5)`; g.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 4, 2 + Math.random() * 3); }
    g.strokeStyle = 'rgba(40,38,32,0.9)'; g.lineWidth = 2; for (let k = 0; k <= 8; k++) { g.beginPath(); g.moveTo(k * 16, 0); g.lineTo(k * 16, h); g.moveTo(0, k * 16); g.lineTo(w, k * 16); g.stroke(); }
    g.strokeStyle = 'rgba(25,24,20,1)'; g.lineWidth = 6; g.strokeRect(0, 0, w, h);
  });
  matGavion = new THREE.MeshStandardMaterial({ map: t, roughness: 0.95, metalness: 0.05 });
  return matGavion;
}

const plano = (g) => (g.index ? g.toNonIndexed() : g);
const juntar = (lista) => mergeGeometries(lista.map(plano));
const C = (r, g, b) => new THREE.Color().setRGB(r, g, b);

/** Carpa militar: cuerpo de lona, techo a dos aguas, puerta enrollada y vientos. Mira hacia +z local. */
function carpa(an, la, alto) {
  const cuerpo = new THREE.BoxGeometry(an, alto * 0.58, la).translate(0, alto * 0.29, 0);
  const forma = new THREE.Shape([new THREE.Vector2(-an / 2 - 0.15, 0), new THREE.Vector2(an / 2 + 0.15, 0), new THREE.Vector2(0, alto * 0.45)]);
  const techo = new THREE.ExtrudeGeometry(forma, { depth: la + 0.3, bevelEnabled: false }).translate(0, alto * 0.58, -la / 2 - 0.15);
  return juntar([cuerpo, techo]);
}

/**
 * Arma un campamento junto a la vía en la muestra `i`, del lado `lado` (−1 izquierda, +1 derecha).
 * tipo 'base' (salida y llegada) o 'puesto' (control del camino). R = { modelos, mats: { grava, liso }, vehiculo }.
 * Devuelve { centro, radio } para que nada más (árboles, rocas) caiga encima.
 */
export function crearCampamento(scene, P, i, lado, tipo, R) {
  const W = P.def.ancho + ARCEN, rnd = semilla(900 + i), grupo = new THREE.Group(); scene.add(grupo);
  const base = tipo === 'base', U = base ? 19 : 9, W0 = W + (base ? 5 : 1.5), W1 = W + (base ? 35 : 13);
  // Punto del mundo a `u` metros a lo largo de la vía y `w` metros de su centro, hacia el lado del campamento.
  const en = (u, w, v = new THREE.Vector3()) => { const x = P.px[i] + P.tx[i] * u + P.rx[i] * lado * w, z = P.pz[i] + P.tz[i] * u + P.rz[i] * lado * w; return v.set(x, P.terreno(x, z), z); };
  const rumbo = Math.atan2(P.tx[i], P.tz[i]), haciaVia = rumbo - lado * Math.PI / 2;   // giro (y) para mirar hacia la vía
  const M4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), S = new THREE.Vector3(1, 1, 1), V = new THREE.Vector3();
  const mats = {
    lona: new THREE.MeshStandardMaterial({ color: C(0.25, 0.25, 0.17), roughness: 0.96 }),
    lonaOscura: new THREE.MeshStandardMaterial({ color: C(0.06, 0.06, 0.045), roughness: 1 }),
    madera: new THREE.MeshStandardMaterial({ color: C(0.24, 0.17, 0.1), roughness: 0.9 }),
    saco: new THREE.MeshStandardMaterial({ color: C(0.24, 0.2, 0.13), roughness: 1 }),
    naranja: new THREE.MeshStandardMaterial({ color: C(0.85, 0.3, 0.05), roughness: 0.8, side: THREE.DoubleSide }),
    raya: new THREE.MeshStandardMaterial({ color: C(0.75, 0.72, 0.66), roughness: 0.7 }),
    rojo: new THREE.MeshStandardMaterial({ color: C(0.55, 0.05, 0.035), roughness: 0.7 }),
  };
  const malla = (geo, mat, sombra = true) => { const m = new THREE.Mesh(geo, mat); m.castShadow = sombra; m.receiveShadow = true; grupo.add(m); return m; };

  // Explanada de grava apisonada que sigue el terreno (una malla que se dobla con él, no un disco flotante).
  { const g = new THREE.PlaneGeometry(2 * U + 4, W1 - W0 + 6, 24, 16), p = g.attributes.position;
    for (let k = 0; k < p.count; k++) { en(p.getX(k), (W0 + W1) / 2 + p.getY(k), V); p.setXYZ(k, V.x, V.y + 0.05, V.z); }
    g.computeVertexNormals(); const uv = g.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * (2 * U + 4) / 3, uv.getY(k) * (W1 - W0 + 6) / 3);
    const m = malla(g, R.mats.grava, false); m.material = R.mats.grava; }

  // Muro de gaviones: cestas de 1,1 m, con hueco de entrada del lado de la vía.
  { const pos = [];
    const fila = (u0, w0, u1, w1, hueco = null) => { const L = Math.hypot(u1 - u0, w1 - w0), n = Math.round(L / 1.1); for (let k = 0; k <= n; k++) { const u = u0 + (u1 - u0) * k / n, w = w0 + (w1 - w0) * k / n; if (hueco && u > hueco[0] && u < hueco[1]) continue; pos.push([u, w]); } };
    if (base) { fila(-U, W0, U, W0, [-4.5, 4.5]); fila(-U, W1, U, W1); fila(-U, W0, -U, W1); fila(U, W0, U, W1); }
    else { fila(-U, W0, -3, W0); fila(3, W0, U, W0); fila(-U, W0, -U, W0 + 5); fila(U, W0, U, W0 + 5); }
    const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1.08, 1.1, 1.08), gavion(), pos.length);
    pos.forEach(([u, w], k) => { en(u, w, V); q.setFromEuler(e.set(0, rumbo + (rnd() - 0.5) * 0.06, 0)); im.setMatrixAt(k, M4.compose(V.setY(V.y + 0.5), q, S)); });
    im.castShadow = true; im.receiveShadow = true; im.computeBoundingSphere(); grupo.add(im); }

  // Carpas de lona mirando a la vía, con su puerta oscura.
  const carpas = base ? [[-9, W1 - 8, 6, 4.2], [7, W1 - 8, 6, 4.2], [-10, W0 + 9, 4.4, 3.6]] : [[0, W1 - 4, 4.4, 3.4]];
  for (const [u, w, an, la] of carpas) {
    const c = malla(carpa(an, la, 2.9), mats.lona); en(u, w, c.position); c.position.y -= 0.05; c.rotation.y = haciaVia;
    const puerta = malla(new THREE.BoxGeometry(1.1, 1.5, 0.05).translate(0, 0.75, la / 2 + 0.03), mats.lonaOscura, false); puerta.position.copy(c.position); puerta.rotation.y = haciaVia;
  }

  // Torre de vigilancia: cuatro patas, plataforma con sacos y techo.
  if (base) {
    const p = [], s = [];
    for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) p.push(new THREE.BoxGeometry(0.18, 6.2, 0.18).translate(a * 1.1, 3.1, b * 1.1));
    p.push(new THREE.BoxGeometry(2.6, 0.15, 2.6).translate(0, 4.1, 0), new THREE.BoxGeometry(2.9, 0.1, 2.9).translate(0, 6.25, 0));
    for (let k = 0; k < 3; k++) for (const [w, l, x, z] of [[2.6, 0.3, 0, 1.15], [2.6, 0.3, 0, -1.15], [0.3, 2.0, 1.15, 0], [0.3, 2.0, -1.15, 0]]) s.push(new THREE.BoxGeometry(w, 0.24, l).translate(x, 4.3 + k * 0.24, z));
    const t1 = malla(juntar(p), mats.madera), t2 = malla(juntar(s), mats.saco); en(U - 3, W1 - 3, t1.position); t2.position.copy(t1.position);
  }

  // Manga de viento (sin bandera): poste y cono naranja.
  { const g = [new THREE.CylinderGeometry(0.04, 0.05, 6, 8).translate(0, 3, 0)], m = malla(juntar(g), R.mats.liso); en(-U + 1.5, W0 + 2, m.position);
    const cono = malla(new THREE.CylinderGeometry(0.28, 0.1, 1.6, 12, 1, true).rotateZ(Math.PI / 2 - 0.25).translate(0.85, 5.75, 0), mats.naranja, false); cono.position.copy(m.position); cono.rotation.y = rnd() * 6.28; }

  // Barrera de entrada (levantada), del lado de la vía.
  { const poste = malla(new THREE.BoxGeometry(0.3, 1.1, 0.3).translate(0, 0.55, 0), R.mats.liso); en(-5, W0 - 0.4, poste.position);
    const brazo = [], rayas = [];
    for (let k = 0; k < 6; k++) (k % 2 ? brazo : rayas).push(new THREE.BoxGeometry(0.12, 0.12, 0.8).translate(0, 0, 0.4 + k * 0.8));
    const b1 = malla(juntar(brazo), mats.rojo), b2 = malla(juntar(rayas), mats.raya);
    for (const b of [b1, b2]) { b.position.copy(poste.position); b.position.y += 1.05; b.rotation.order = 'YXZ'; b.rotation.y = rumbo; b.rotation.x = -1.2; } }

  // Utilería escaneada: barriles, cajas, bidones, botiquines, estufa; y un vehículo estacionado en las bases.
  const md = R.modelos, dejar = (gltf, u, w, ry = 0, s = 1, dy = 0) => { if (!gltf) return; const o = gltf.scene.clone(); en(u, w, o.position); o.position.y += dy; o.rotation.y = ry; o.scale.setScalar(s); o.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); grupo.add(o); };
  const pila = base ? [[12, W0 + 4], [-15, W1 - 3]] : [[-6, W0 + 3]];
  for (const [u, w] of pila) {
    for (let k = 0; k < 5; k++) dejar(md.barril, u + (k % 3) * 0.75, w + Math.floor(k / 3) * 0.75, rnd() * 6.28);
    for (let k = 0; k < 4; k++) dejar(md.caja, u + 3 + (k % 2) * 0.62, w + 0.2, rumbo + (rnd() - 0.5) * 0.2, 1, Math.floor(k / 2) * 0.445);
    for (let k = 0; k < 3; k++) dejar(md.bidon, u + 1 + k * 0.32, w - 1.3, rumbo + Math.PI / 2);
  }
  const [uA, wA] = carpas[carpas.length - 1];
  dejar(md.botiquin, uA + 1.6, wA + 2.6, rumbo + 0.4, 1.4); dejar(md.botiquin, uA + 2.2, wA + 2.4, rumbo - 0.3, 1.4);
  dejar(md.estufa, uA - 2.6, wA + 2.4, rnd() * 6.28);
  if (base) for (const [u, w] of [[-1, W0 + 4], [10, W1 - 15]]) dejar(md.barrera, u, w, rumbo + (rnd() - 0.5) * 0.1);
  if (base && R.vehiculo) { const v = R.vehiculo.clone(true); en(-10, W0 + 13, v.position); v.rotation.y = rumbo + 0.3; grupo.add(v); }

  return { centro: en(0, (W0 + W1) / 2, new THREE.Vector3()), radio: Math.hypot(U + 4, (W1 - W0) / 2 + 4), grupo };
}
