// 19-JUE · Luciérnaga · Coche. La carrocería no es un modelo: es una tabla de medidas. Se levanta sección a sección
// (como las cuadernas de un barco), se le recortan los pasos de rueda y se reparte en pintura, cristal y bajos.
// Cambiar la tabla da otro coche. Licencia: MIT (código propio). Diseños propios: ninguna marca, ningún modelo real.
import * as THREE from 'three';
import { texturaCanvas } from './render.js';
import { lerp, fusionar } from './lc-util.js';

// Colores en RGB lineal.
export const PINTURAS = [
  { id: 'bahia', nombre: 'azul bahía', color: [0.018, 0.11, 0.52] },
  { id: 'nieve', nombre: 'blanco nieve', color: [0.8, 0.81, 0.78] },
  { id: 'brasa', nombre: 'rojo brasa', color: [0.5, 0.018, 0.022] },
  { id: 'luna', nombre: 'gris luna', color: [0.17, 0.19, 0.22] },
  { id: 'cedro', nombre: 'verde cedro', color: [0.012, 0.14, 0.075] },
];

// Cupé de los 90: capó largo, cabina atrasada, cola corta y alerón. z va de la cola (-) al morro (+), en metros.
export const RAIJIN = {
  id: 'raijin', nombre: 'Raijin R', lema: 'Cupé turbo de seis cilindros en línea, tracción trasera',
  cola: -2.3, morro: 2.3, ejeDel: 1.33, ejeTras: -1.34, via: 0.765, radio: 0.33, paso: 0.385,
  techo: [[-2.3, 0.84], [-2.22, 0.915], [-1.62, 0.94], [-0.62, 1.275], [-0.2, 1.295], [0.2, 1.27], [0.98, 0.945], [1.6, 0.885], [2.06, 0.79], [2.26, 0.72], [2.3, 0.69]],
  hombro: [[-2.3, 0.82], [-2.2, 0.885], [-1, 0.905], [0.9, 0.875], [1.6, 0.84], [2.06, 0.765], [2.26, 0.7], [2.3, 0.67]],
  medio: [[-2.3, 0.7], [-2.24, 0.8], [-2.05, 0.875], [-1, 0.895], [0.6, 0.895], [1.8, 0.885], [2.12, 0.86], [2.25, 0.8], [2.3, 0.72]],
  suelo: [[-2.3, 0.3], [-1.9, 0.2], [-1, 0.165], [1.6, 0.16], [2.1, 0.15], [2.3, 0.17]],
  cabina: [[-1.62, 0], [-0.7, 1], [0.22, 1], [0.98, 0]],
  // Cupé: puerta larga, ventanilla trasera corta, parabrisas y luneta muy tumbados.
  lateral: [-1.08, 0.66], montante: [-0.62, -0.55], parabrisas: [0.26, 0.92], luneta: [-1.52, -0.72],
};

/** Curva suave por una tabla [[z, valor], …] sin rebasar entre puntos. */
function curva(t) {
  const n = t.length, m = new Array(n);
  for (let k = 0; k < n; k++) {
    const a = k ? (t[k][1] - t[k - 1][1]) / (t[k][0] - t[k - 1][0]) : null, b = k < n - 1 ? (t[k + 1][1] - t[k][1]) / (t[k + 1][0] - t[k][0]) : null;
    if (a === null) m[k] = b; else if (b === null) m[k] = a; else if (a * b <= 0) m[k] = 0;
    else { const lim = 3 * Math.min(Math.abs(a), Math.abs(b)); m[k] = Math.sign(a) * Math.min(Math.abs(a + b) / 2, lim); }
  }
  return (z) => {
    if (z <= t[0][0]) return t[0][1]; if (z >= t[n - 1][0]) return t[n - 1][1];
    let k = 1; while (z > t[k][0]) k++;
    const a = t[k - 1], b = t[k], h = b[0] - a[0], f = (z - a[0]) / h, f2 = f * f, f3 = f2 * f;
    return (2 * f3 - 3 * f2 + 1) * a[1] + (f3 - 2 * f2 + f) * h * m[k - 1] + (-2 * f3 + 3 * f2) * b[1] + (f3 - f2) * h * m[k];
  };
}
const cr = (p0, p1, p2, p3, t) => 0.5 * (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (3 * p1 - p0 - 3 * p2 + p3) * t * t * t);

// Media sección: del centro del suelo, por el costado, al centro del techo. SUB = cuántos tramos entre puntos clave.
const SUB = [2, 2, 3, 4, 2, 5, 2, 3];
const CLAVE = [0]; for (const s of SUB) CLAVE.push(CLAVE[CLAVE.length - 1] + s);
const M = CLAVE[8] + 1, R = 2 * M - 2;

function carroceria(E) {
  const fT = curva(E.techo), fH = curva(E.hombro), fM = curva(E.medio), fS = curva(E.suelo), fC = curva(E.cabina);
  // Dónde cortar: más fino en los pasos de rueda y en los extremos, y un corte exacto en cada borde de cristal.
  const set = new Set(), poner = (z) => set.add(Math.round(z * 1000) / 1000);
  for (let z = E.cola; z <= E.morro + 1e-6; z += 0.1) poner(z);
  for (const zw of [E.ejeDel, E.ejeTras]) for (let z = zw - 0.46; z <= zw + 0.4601; z += 0.04) poner(z);
  for (let k = 0; k < 6; k++) { poner(E.morro - k * 0.02); poner(E.cola + k * 0.02); }
  [...E.lateral, ...E.montante, ...E.parabrisas, ...E.luneta].forEach(poner);
  const zs = [...set].filter((z) => z >= E.cola - 1e-6 && z <= E.morro + 1e-6).sort((a, b) => a - b).filter((z, i, a) => !i || z - a[i - 1] > 0.013);
  const S = zs.length, pos = new Float32Array((S * R + 2 * (R + 1)) * 3), dentro = new Uint8Array(S * R);
  const K = [], medio = new Float32Array(M * 2);
  for (let si = 0; si < S; si++) {
    const z = zs[si], hw = fM(z), yF = fS(z), yS = fH(z), yT = fT(z), g = fC(z);
    const wT = hw * lerp(0.84, 0.69, g), yE = lerp(lerp(yS, yT, 0.6), yT - 0.035, g);
    // Aletas: la carrocería se ensancha sobre cada rueda y se recoge hacia el hombro.
    const hf = hw + 0.026 * (Math.exp(-(((z - E.ejeDel) / 0.42) ** 2)) + Math.exp(-(((z - E.ejeTras) / 0.42) ** 2)));
    K.length = 0;
    K.push([0, yF], [hw * 0.8, yF], [hf * 0.955, yF + 0.085], [hf, yF + 0.3], [hf * 0.975, yS - 0.1], [hw * 0.94, yS], [wT, yE], [wT * 0.55, lerp(yE, yT, 0.8)], [0, yT]);
    let o = 0;
    for (let s = 0; s < 8; s++) {
      const p0 = s ? K[s - 1] : [-K[1][0], K[1][1]], p3 = s < 7 ? K[s + 2] : [-K[7][0], K[7][1]];
      for (let k = 0; k < SUB[s]; k++) { const t = k / SUB[s]; medio[o++] = cr(p0[0], K[s][0], K[s + 1][0], p3[0], t); medio[o++] = cr(p0[1], K[s][1], K[s + 1][1], p3[1], t); }
    }
    medio[o++] = 0; medio[o++] = yT; medio[0] = 0;
    for (let j = 0; j < R; j++) {
      const h = j < M ? j : R - j, v = (si * R + j) * 3;
      let x = medio[h * 2] * (j < M ? 1 : -1), y = medio[h * 2 + 1], zz = z;
      if (h >= CLAVE[1] && h <= CLAVE[5]) for (const zw of [E.ejeDel, E.ejeTras]) {   // paso de rueda: lo de dentro se quita, el borde se lleva al círculo
        const dz = zz - zw, dy = y - E.radio, d = Math.hypot(dz, dy);
        if (d < E.paso) { dentro[si * R + j] = 1; if (d > E.paso * 0.5) { zz = zw + dz * E.paso / d; y = E.radio + dy * E.paso / d; } }
      }
      pos[v] = x; pos[v + 1] = y; pos[v + 2] = zz;
    }
  }
  const pintura = [], cristal = [], bajos = [], en = (z, r) => z > r[0] && z < r[1];
  for (let si = 0; si < S - 1; si++) {
    const zc = (zs[si] + zs[si + 1]) / 2;
    for (let j = 0; j < R; j++) {
      const j2 = (j + 1) % R, a = si * R + j, b = si * R + j2, c = a + R, d = b + R;
      const h = Math.min(j < M ? j : R - j, j2 < M ? j2 : R - j2);
      if (dentro[a] && dentro[b] && dentro[c] && dentro[d]) continue;
      if (h === 1 && (Math.abs(zc - E.ejeDel) < E.paso - 0.02 || Math.abs(zc - E.ejeTras) < E.paso - 0.02)) continue;
      let lista = pintura;
      if (h < CLAVE[2]) lista = bajos;
      else if (h >= CLAVE[5] && h < CLAVE[6] - 1 && en(zc, E.lateral) && !en(zc, E.montante)) lista = cristal;
      else if (h >= CLAVE[6] && (en(zc, E.parabrisas) || en(zc, E.luneta))) lista = cristal;
      lista.push(a, b, c, b, d, c);
    }
  }
  // Tapas del morro y de la cola, con vértices propios para que queden planas.
  for (const [si, base, frente] of [[S - 1, S * R, true], [0, S * R + R + 1, false]]) {
    let cy = 0;
    for (let j = 0; j < R; j++) { const v = (si * R + j) * 3, w = (base + j) * 3; pos[w] = pos[v]; pos[w + 1] = pos[v + 1]; pos[w + 2] = pos[v + 2]; cy += pos[v + 1] / R; }
    const w = (base + R) * 3; pos[w] = 0; pos[w + 1] = cy; pos[w + 2] = zs[si];
    for (let j = 0; j < R; j++) { const a = base + j, b = base + (j + 1) % R; if (frente) pintura.push(base + R, a, b); else pintura.push(base + R, b, a); }
  }
  const todo = new THREE.BufferGeometry();
  todo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  todo.setIndex([...pintura, ...cristal, ...bajos]); todo.computeVertexNormals();
  const parte = (idx) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', todo.attributes.position); g.setAttribute('normal', todo.attributes.normal); g.setIndex(idx); return g; };
  return { pintura: parte(pintura), cristal: parte(cristal), bajos: parte(bajos) };
}

function rueda(E, mats) {
  const perfil = [[0.215, -0.115], [0.29, -0.12], [0.318, -0.105], [E.radio, -0.07], [E.radio, 0.07], [0.318, 0.105], [0.29, 0.12], [0.215, 0.115]].map(([r, a]) => new THREE.Vector2(r, a));
  const neum = new THREE.LatheGeometry(perfil, 30); neum.rotateZ(-Math.PI / 2);
  const aro = new THREE.CylinderGeometry(0.214, 0.214, 0.21, 26, 1, true); aro.rotateZ(Math.PI / 2);
  const piezas = [];
  for (let k = 0; k < 6; k++) { const g = new THREE.BoxGeometry(0.026, 0.19, 0.05); g.translate(0.088, 0.117, 0); g.rotateX(k * Math.PI / 3); piezas.push(g); }
  const buje = new THREE.CylinderGeometry(0.052, 0.06, 0.05, 14); buje.rotateZ(-Math.PI / 2); buje.translate(0.085, 0, 0); piezas.push(buje);
  const labio = new THREE.TorusGeometry(0.207, 0.012, 6, 28); labio.rotateY(Math.PI / 2); labio.translate(0.1, 0, 0); piezas.push(labio);
  const disco = new THREE.CylinderGeometry(0.168, 0.168, 0.018, 22); disco.rotateZ(Math.PI / 2); disco.translate(0.03, 0, 0);
  const giro = new THREE.Group();
  const mN = new THREE.Mesh(neum, mats.goma); mN.castShadow = true;
  giro.add(mN, new THREE.Mesh(aro, mats.aroInt), new THREE.Mesh(fusionar(piezas), mats.aro), new THREE.Mesh(disco, mats.disco));
  const pivote = new THREE.Group(); pivote.add(giro);
  const pinza = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.075, 0.13), mats.pinza); pinza.position.set(0.04, 0.115, 0.1); pivote.add(pinza);
  return { pivote, giro };
}

export function crearCoche(E = RAIJIN, pintura = PINTURAS[0]) {
  const grupo = new THREE.Group(), cuerpo = new THREE.Group(); grupo.add(cuerpo);
  const mats = {
    pintura: new THREE.MeshPhysicalMaterial({ color: new THREE.Color().setRGB(...pintura.color), metalness: 0.55, roughness: 0.36, clearcoat: 1, clearcoatRoughness: 0.045, envMapIntensity: 1.25 }),
    cristal: new THREE.MeshPhysicalMaterial({ color: 0x030508, metalness: 0, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.7 }),
    negro: new THREE.MeshStandardMaterial({ color: 0x0a0b0d, roughness: 0.62, metalness: 0.1 }),
    hueco: new THREE.MeshStandardMaterial({ color: 0x030304, roughness: 1, side: THREE.DoubleSide }),
    goma: new THREE.MeshStandardMaterial({ color: 0x08080a, roughness: 0.86 }),
    aro: new THREE.MeshStandardMaterial({ color: new THREE.Color().setRGB(0.42, 0.29, 0.13), metalness: 0.9, roughness: 0.3 }),
    aroInt: new THREE.MeshStandardMaterial({ color: 0x2a2a2e, metalness: 0.8, roughness: 0.45, side: THREE.DoubleSide }),
    disco: new THREE.MeshStandardMaterial({ color: 0x3a3b40, metalness: 0.85, roughness: 0.4 }),
    pinza: new THREE.MeshStandardMaterial({ color: new THREE.Color().setRGB(0.6, 0.03, 0.03), roughness: 0.4 }),
    cromo: new THREE.MeshStandardMaterial({ color: 0xc8ccd2, metalness: 1, roughness: 0.16 }),
    faro: new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(3.4, 3.1, 2.5) }),
    intermitente: new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(1.6, 0.55, 0.05) }),
    freno: new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(2.4, 0.1, 0.06) }),
    escapeLuz: new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(0, 0, 0) }),
  };
  const pon = (geo, mat, x = 0, y = 0, z = 0, sombra = false, padre = cuerpo) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = sombra; padre.add(m); return m; };
  const caja = (w, h, l) => new THREE.BoxGeometry(w, h, l);

  const C = carroceria(E);
  pon(C.pintura, mats.pintura, 0, 0, 0, true); pon(C.cristal, mats.cristal); pon(C.bajos, mats.negro);

  // Morro: faros, rejilla, toma de aire, intermitentes y matrícula.
  const zM = E.morro, zC = E.cola;
  for (const sx of [-1, 1]) {
    pon(caja(0.36, 0.14, 0.05), mats.negro, sx * 0.47, 0.575, zM - 0.012);
    pon(caja(0.19, 0.085, 0.02), mats.faro, sx * 0.405, 0.575, zM + 0.018);
    pon(caja(0.09, 0.085, 0.02), mats.faro, sx * 0.575, 0.575, zM + 0.018);
    pon(caja(0.1, 0.045, 0.02), mats.intermitente, sx * 0.6, 0.43, zM + 0.012);
    pon(caja(0.13, 0.085, 0.075), mats.pintura, sx * 0.935, 0.955, 0.78); pon(caja(0.05, 0.03, 0.05), mats.pintura, sx * 0.88, 0.925, 0.78);
    pon(caja(0.025, 0.15, 0.29), mats.negro, sx * 0.755, 1.19, zC + 0.28); pon(caja(0.045, 0.25, 0.1), mats.negro, sx * 0.42, 1.06, zC + 0.3);
  }
  pon(caja(0.98, 0.17, 0.03), mats.hueco, 0, 0.3, zM + 0.006); pon(caja(0.42, 0.035, 0.03), mats.hueco, 0, 0.575, zM + 0.006);
  pon(caja(1.52, 0.04, 0.3), mats.negro, 0, 0.125, zM - 0.09);   // labio delantero: baja el morro a la vista
  const placa = texturaCanvas(160, 80, (g, W, H) => {
    g.fillStyle = '#e9e9e2'; g.fillRect(0, 0, W, H); g.fillStyle = '#1c5a3a'; g.textAlign = 'center';
    g.font = "700 20px 'Yu Gothic','Meiryo',sans-serif"; g.fillText('蛍峠 330', W / 2, 23);
    g.font = "900 40px 'Yu Gothic','Meiryo',sans-serif"; g.fillText('る 10-90', W / 2, 66);
  });
  const mPlaca = new THREE.MeshStandardMaterial({ map: placa, roughness: 0.5 });
  pon(new THREE.PlaneGeometry(0.33, 0.165), mPlaca, 0, 0.46, zM + 0.026);
  pon(new THREE.PlaneGeometry(0.33, 0.165), mPlaca, 0, 0.5, zC - 0.012).rotation.y = Math.PI;

  // Cola: cuatro pilotos redondos, escapes y alerón.
  const aro = new THREE.CylinderGeometry(0.086, 0.086, 0.03, 22); aro.rotateX(Math.PI / 2);
  const centro = new THREE.CylinderGeometry(0.034, 0.034, 0.034, 14); centro.rotateX(Math.PI / 2);
  for (const x of [-0.5, -0.3, 0.3, 0.5]) { pon(aro, mats.freno, x, 0.71, zC - 0.008); pon(centro, mats.negro, x, 0.71, zC - 0.012); }
  pon(caja(1.24, 0.21, 0.02), mats.negro, 0, 0.71, zC + 0.004);
  const tubo = new THREE.CylinderGeometry(0.046, 0.05, 0.16, 14, 1, true); tubo.rotateX(Math.PI / 2);
  const fondo = new THREE.CircleGeometry(0.044, 14); fondo.rotateY(Math.PI);
  for (const x of [0.36, 0.475]) { pon(tubo, mats.cromo, x, 0.275, zC - 0.03).material.side = THREE.DoubleSide; pon(fondo, mats.escapeLuz, x, 0.275, zC + 0.02); }
  const ala = pon(caja(1.5, 0.028, 0.25), mats.negro, 0, 1.2, zC + 0.28, true); ala.rotation.x = 0.1;

  // Pasos de rueda (forro oscuro + labio) y ruedas.
  const ini = Math.asin((fSuelo(E) - E.radio) / (E.paso + 0.004)), arco = Math.PI - 2 * ini;
  const forro = new THREE.CylinderGeometry(E.paso + 0.004, E.paso + 0.004, 0.4, 22, 1, true, ini, arco); forro.rotateZ(Math.PI / 2);
  const tapa = new THREE.CircleGeometry(E.paso + 0.004, 22, ini, arco); tapa.rotateY(Math.PI / 2);
  const labio = new THREE.TorusGeometry(E.paso, 0.01, 5, 30, arco); labio.rotateZ(ini); labio.rotateY(-Math.PI / 2);
  const ruedas = [];
  for (const [z, delantera] of [[E.ejeDel, true], [E.ejeTras, false]]) for (const sx of [1, -1]) {
    const hw = curva(E.medio)(z);
    pon(forro, mats.hueco, sx * (hw - 0.21), E.radio, z); pon(tapa, mats.hueco, sx * (hw - 0.41), E.radio, z);
    pon(labio, mats.negro, sx * (hw + 0.02), E.radio, z);
    const r = rueda(E, mats); r.pivote.position.set(sx * E.via, E.radio, z); r.pivote.scale.x = sx; grupo.add(r.pivote);
    ruedas.push({ pivote: r.pivote, giro: r.giro, delantera, sx });
  }

  // Sombra de contacto: ancla el coche al suelo aunque el mapa de sombras sea blando.
  const mancha = texturaCanvas(64, 128, (g, W, H) => {
    g.clearRect(0, 0, W, H); const gr = g.createRadialGradient(W / 2, H / 2, 4, W / 2, H / 2, W * 0.5);
    gr.addColorStop(0, 'rgba(0,0,0,0.9)'); gr.addColorStop(0.6, 'rgba(0,0,0,0.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.save(); g.translate(W / 2, H / 2); g.scale(1, 2); g.translate(-W / 2, -H / 2); g.fillStyle = gr; g.fillRect(0, -H, W, H * 3); g.restore();
  });
  const gs = new THREE.PlaneGeometry(2.7, 5.5); gs.rotateX(-Math.PI / 2);
  const som = new THREE.Mesh(gs, new THREE.MeshBasicMaterial({ map: mancha, transparent: true, depthWrite: false, opacity: 0.85 }));
  som.position.y = 0.035; som.renderOrder = 3; grupo.add(som);

  return {
    grupo, cuerpo, ruedas, mats, E,
    pintar(p) { mats.pintura.color.setRGB(...p.color); },
    luzFreno(k) { mats.freno.color.setRGB(1.25 + 4.2 * k, 0.012 + 0.07 * k, 0.008 + 0.03 * k); },
    escape(k) { mats.escapeLuz.color.setRGB(7 * k, 2.6 * k, 0.5 * k); },
  };
}
function fSuelo(E) { return curva(E.suelo)(E.ejeDel); }
