// 19-JUE · Corredor · Camioneta táctica. No existe un modelo realista y libre de este vehículo, así que se arma
// aquí: la carrocería sale de una tabla de medidas (el mismo generador por secciones del cupé) y se viste con metal
// pintado escaneado; la carga (cajas, bidón, barril) sí son modelos escaneados de Poly Haven (CC0).
// Diseño propio: no reproduce ningún vehículo ni insignia real. Licencia: MIT (código propio).
import * as THREE from 'three';
import { carroceria, curva } from './lc-coche.js';
import { fusionar } from './lc-util.js';
import { texturaCanvas } from './render.js';

// Pick-up 4x4 de cabina sencilla y plataforma de carga. z va de la cola (-) al morro (+), en metros.
export const TACTICA = {
  id: 'tactica', nombre: 'Camioneta táctica 4x4',
  cola: -2.7, morro: 2.7, ejeDel: 1.75, ejeTras: -1.55, via: 0.86, radio: 0.46, paso: 0.57,
  estrecha: [0.92, 0.9], aleta: 0.035, baldosa: 1.6,
  techo: [[-2.7, 1.16], [-0.78, 1.18], [-0.72, 1.93], [0.55, 1.93], [1.05, 1.42], [1.14, 1.38], [2.45, 1.3], [2.62, 1.22], [2.7, 1.12]],
  hombro: [[-2.7, 1.12], [-0.78, 1.13], [-0.72, 1.3], [1.05, 1.3], [2.45, 1.24], [2.62, 1.17], [2.7, 1.08]],
  medio: [[-2.7, 0.98], [-2.6, 1.02], [2.4, 1.02], [2.62, 0.98], [2.7, 0.9]],
  suelo: [[-2.7, 0.56], [-2.2, 0.52], [2.3, 0.52], [2.7, 0.58]],
  cabina: [[-0.78, 0], [-0.72, 1], [0.55, 1], [1.05, 0]],
  lateral: [-0.6, 0.52], montante: [8, 9], parabrisas: [0.6, 1.0], luneta: [-0.78, -0.72],
};

function rueda(E, mats) {
  const R = E.radio, perfil = [[0.27, -0.15], [0.4, -0.155], [R - 0.016, -0.13], [R, -0.09], [R, 0.09], [R - 0.016, 0.13], [0.4, 0.155], [0.27, 0.15]].map(([r, a]) => new THREE.Vector2(r, a));
  const cubierta = new THREE.LatheGeometry(perfil, 36); cubierta.rotateZ(-Math.PI / 2);
  const tacos = [];   // dibujo todoterreno: tacos alternos en los hombros y una fila central
  for (let k = 0; k < 32; k++) {
    const a = k / 32 * Math.PI * 2;
    for (const [x, w] of [[k % 2 ? -0.085 : 0.085, 0.1], [0, 0.07]]) { if (!x && k % 2) continue; const g = new THREE.BoxGeometry(w, 0.03, 0.06); g.translate(x, R + 0.006, 0); g.rotateX(a); tacos.push(g); }
  }
  const disco = new THREE.CylinderGeometry(0.275, 0.275, 0.05, 20); disco.rotateZ(Math.PI / 2); disco.translate(0.09, 0, 0);
  const plato = new THREE.CylinderGeometry(0.2, 0.26, 0.07, 20); plato.rotateZ(-Math.PI / 2); plato.translate(0.13, 0, 0);
  const buje = new THREE.CylinderGeometry(0.075, 0.09, 0.09, 12); buje.rotateZ(-Math.PI / 2); buje.translate(0.19, 0, 0);
  const piezas = [disco, plato, buje];
  for (let k = 0; k < 8; k++) { const g = new THREE.CylinderGeometry(0.016, 0.016, 0.03, 6); g.rotateZ(Math.PI / 2); g.translate(0.17, 0.13, 0); g.rotateX(k * Math.PI / 4); piezas.push(g); }
  const giro = new THREE.Group(), mC = new THREE.Mesh(fusionar([cubierta, ...tacos]), mats.goma); mC.castShadow = true;
  giro.add(mC, new THREE.Mesh(fusionar(piezas), mats.acero));
  const pivote = new THREE.Group(); pivote.add(giro);
  return { pivote, giro };
}

/** R = { pintura: {map, normalMap, armMap}, modelos: { caja, bidon, barril } } */
export function crearCamion(R, E = TACTICA) {
  const grupo = new THREE.Group(), cuerpo = new THREE.Group(); grupo.add(cuerpo);
  const oliva = new THREE.Color().setRGB(0.62, 0.66, 0.5);
  const mats = {
    // El escaneo es chapa verde con óxido: aporta desgaste real; el tinte lo lleva a verde oliva mate.
    pintura: new THREE.MeshStandardMaterial({ map: R.pintura.map, normalMap: R.pintura.normalMap, roughnessMap: R.pintura.armMap, aoMap: R.pintura.armMap, color: oliva, roughness: 1, metalness: 0.08, normalScale: new THREE.Vector2(0.7, 0.7) }),
    liso: new THREE.MeshStandardMaterial({ color: new THREE.Color().setRGB(0.075, 0.095, 0.052), roughness: 0.74, metalness: 0.15 }),
    cristal: new THREE.MeshPhysicalMaterial({ color: 0x06090c, roughness: 0.04, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.4 }),
    negro: new THREE.MeshStandardMaterial({ color: 0x0b0c0d, roughness: 0.7, metalness: 0.2 }),
    hueco: new THREE.MeshStandardMaterial({ color: 0x030303, roughness: 1, side: THREE.DoubleSide }),
    goma: new THREE.MeshStandardMaterial({ color: 0x0d0d0e, roughness: 0.92, side: THREE.DoubleSide }),
    acero: new THREE.MeshStandardMaterial({ color: new THREE.Color().setRGB(0.04, 0.05, 0.032), roughness: 0.66, metalness: 0.35 }),
    arma: new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.45, metalness: 0.75 }),
    faro: new THREE.MeshPhysicalMaterial({ color: 0xdfe6ea, roughness: 0.08, metalness: 0.2, clearcoat: 1, emissive: new THREE.Color().setRGB(1, 0.92, 0.75), emissiveIntensity: 0.35 }),
    piloto: new THREE.MeshStandardMaterial({ color: 0x3a0606, roughness: 0.35, emissive: new THREE.Color().setRGB(1, 0.05, 0.03), emissiveIntensity: 0.15 }),
  };
  const pon = (geo, mat, x = 0, y = 0, z = 0, padre = cuerpo, sombra = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = sombra; m.receiveShadow = true; padre.add(m); return m; };
  const caja = (w, h, l) => new THREE.BoxGeometry(w, h, l), tubo = (r, l, seg = 10) => new THREE.CylinderGeometry(r, r, l, seg);

  const C = carroceria(E);
  pon(C.pintura, mats.pintura); pon(C.cristal, mats.cristal); pon(C.bajos, mats.negro);
  const zM = E.morro, zC = E.cola;

  // Bastidor y ejes: lo que se ve por debajo de una camioneta alta.
  pon(caja(1.15, 0.26, 4.9), mats.negro, 0, 0.46, 0);
  for (const z of [E.ejeDel, E.ejeTras]) { const g = tubo(0.065, 1.7); g.rotateZ(Math.PI / 2); pon(g, mats.negro, 0, E.radio, z); pon(new THREE.SphereGeometry(0.17, 12, 8), mats.negro, 0, E.radio, z); }

  // Morro: parachoques de acero, defensa de tubo, rejilla de lamas y faros redondos.
  pon(caja(2.1, 0.2, 0.22), mats.negro, 0, 0.66, zM + 0.07);
  for (const sx of [-1, 1]) {
    pon(tubo(0.032, 0.62), mats.negro, sx * 0.46, 1.0, zM + 0.17); pon(caja(0.07, 0.1, 0.1), mats.negro, sx * 0.72, 0.52, zM + 0.1);
    const lente = tubo(0.105, 0.05, 20); lente.rotateX(Math.PI / 2); pon(lente, mats.faro, sx * 0.74, 1.0, zM + 0.012);
    const aro = new THREE.TorusGeometry(0.11, 0.014, 6, 20); pon(aro, mats.negro, sx * 0.74, 1.0, zM + 0.035);
    pon(caja(0.1, 0.05, 0.03), mats.piloto, sx * 0.86, 0.98, zC - 0.012);
    pon(caja(0.04, 0.3, 0.04), mats.negro, sx * 1.16, 1.5, 0.92); pon(caja(0.035, 0.28, 0.17), mats.negro, sx * 1.2, 1.56, 0.9); pon(caja(0.2, 0.03, 0.03), mats.negro, sx * 1.1, 1.38, 0.92);
    pon(caja(0.24, 0.05, 1.35), mats.negro, sx * 1.06, 0.5, 0.08);
    pon(caja(0.03, 0.42, 0.5), mats.negro, sx * 0.86, 0.62, E.ejeTras - 0.62, cuerpo, false);
  }
  const barra = tubo(0.032, 0.98); barra.rotateZ(Math.PI / 2); pon(barra, mats.negro, 0, 1.3, zM + 0.17);
  pon(caja(1.08, 0.36, 0.04), mats.hueco, 0, 1.0, zM + 0.004);
  for (let k = -3; k <= 3; k++) pon(caja(0.035, 0.36, 0.05), mats.liso, k * 0.15, 1.0, zM + 0.022);
  pon(caja(2.06, 0.16, 0.14), mats.negro, 0, 0.64, zC - 0.05);

  // Plataforma: barandas, postes y la carga.
  for (const sx of [-1, 1]) { pon(caja(0.045, 0.34, 1.86), mats.liso, sx * 0.985, 1.33, -1.74); for (const z of [-0.86, -1.48, -2.1, -2.66]) pon(caja(0.06, 0.4, 0.06), mats.liso, sx * 0.985, 1.34, z); }
  pon(caja(2.0, 0.34, 0.045), mats.liso, 0, 1.33, zC + 0.03); pon(caja(2.0, 0.34, 0.045), mats.liso, 0, 1.33, -0.84);
  const carga = new THREE.Group(); carga.position.y = 1.165; cuerpo.add(carga);
  const dejar = (gltf, x, y, z, ry = 0, s = 1) => { if (!gltf) return; const o = gltf.scene.clone(); o.position.set(x, y, z); o.rotation.y = ry; o.scale.setScalar(s); o.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); carga.add(o); };
  const md = R.modelos || {};
  dejar(md.caja, -0.62, 0, -1.45); dejar(md.caja, 0, 0, -1.45, 0.03); dejar(md.caja, 0.62, 0, -1.47, -0.02);
  dejar(md.caja, -0.3, 0.445, -1.5, Math.PI / 2 + 0.06); dejar(md.caja, 0.5, 0.445, -1.35, 0.1);
  dejar(md.barril, -0.6, 0, -2.3, 0.6); dejar(md.barril, 0.08, 0, -2.32, 2.1);
  dejar(md.bidon, 0.62, 0, -2.2, Math.PI / 2); dejar(md.bidon, 0.62, 0, -2.42, Math.PI / 2 + 0.05); dejar(md.bidon, 0.8, 0, -2.02, 0.2);

  // Techo: aro de torreta, arma con escudo y antena. `torreta` gira (rumbo) y `arma` cabecea: las usará el modo de ataque.
  pon(tubo(0.44, 0.07, 24), mats.liso, 0, 1.955, -0.08);
  const torreta = new THREE.Group(); torreta.position.set(0, 2.0, -0.08); cuerpo.add(torreta);
  const arma = new THREE.Group(); arma.position.set(0, 0.28, 0.12); torreta.add(arma);
  pon(tubo(0.05, 0.3), mats.arma, 0, 0.14, 0.1, torreta);
  pon(caja(0.11, 0.13, 0.52), mats.arma, 0, 0, 0.05, arma);
  const canon = tubo(0.021, 0.95, 8); canon.rotateX(Math.PI / 2); pon(canon, mats.arma, 0, 0.012, 0.76, arma);
  const freno = tubo(0.032, 0.09, 8); freno.rotateX(Math.PI / 2); pon(freno, mats.arma, 0, 0.012, 1.24, arma);
  pon(caja(0.2, 0.15, 0.13), mats.liso, -0.17, -0.02, 0.02, arma);
  for (const sx of [-1, 1]) { const p = pon(caja(0.2, 0.27, 0.016), mats.liso, sx * 0.165, 0.04, 0.33, arma); p.rotation.y = -sx * 0.4; }
  const ant = pon(tubo(0.007, 2.3, 5), mats.negro, -0.92, 2.42, -0.6); ant.rotation.x = -0.1; pon(tubo(0.03, 0.14), mats.negro, -0.92, 1.36, -0.5);

  // Rótulo de unidad en las puertas (ficticio), pintado a plantilla.
  const rotulo = texturaCanvas(256, 96, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(222,220,205,0.82)'; g.font = "700 62px 'Arial Narrow', 'Saira Extra Condensed', sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('SUM · 07', w / 2, h / 2 + 4); });
  const mRot = new THREE.MeshStandardMaterial({ map: rotulo, transparent: true, roughness: 0.8, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  for (const sx of [-1, 1]) { const p = pon(new THREE.PlaneGeometry(0.62, 0.23), mRot, sx * 1.032, 1.02, 0.02, cuerpo, false); p.rotation.y = sx * Math.PI / 2; }

  // Pasos de rueda (forro y labio de goma) y ruedas.
  const fS = curva(E.suelo)(E.ejeDel), ini = Math.asin((fS - E.radio) / (E.paso + 0.004)), arco = Math.PI - 2 * ini;
  const forro = new THREE.CylinderGeometry(E.paso + 0.004, E.paso + 0.004, 0.46, 24, 1, true, ini, arco); forro.rotateZ(Math.PI / 2);
  const tapa = new THREE.CircleGeometry(E.paso + 0.004, 24, ini, arco); tapa.rotateY(Math.PI / 2);
  const labio = new THREE.TorusGeometry(E.paso, 0.03, 6, 30, arco); labio.rotateZ(ini); labio.rotateY(-Math.PI / 2);
  const ruedas = [];
  for (const [z, delantera] of [[E.ejeDel, true], [E.ejeTras, false]]) for (const sx of [1, -1]) {
    pon(forro, mats.hueco, sx * 0.8, E.radio, z, cuerpo, false); pon(tapa, mats.hueco, sx * 0.57, E.radio, z, cuerpo, false); pon(labio, mats.negro, sx * 1.045, E.radio, z);
    const r = rueda(E, mats); r.pivote.position.set(sx * E.via, E.radio, z); r.pivote.scale.x = sx; grupo.add(r.pivote);
    ruedas.push({ pivote: r.pivote, giro: r.giro, delantera, sx });
  }
  // Sombra de contacto bajo el chasis.
  const mancha = texturaCanvas(64, 128, (g, w, h) => { g.clearRect(0, 0, w, h); const gr = g.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w * 0.5); gr.addColorStop(0, 'rgba(0,0,0,0.75)'); gr.addColorStop(0.65, 'rgba(0,0,0,0.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.save(); g.translate(w / 2, h / 2); g.scale(1, 2); g.translate(-w / 2, -h / 2); g.fillStyle = gr; g.fillRect(0, -h, w, h * 3); g.restore(); });
  const gs = new THREE.PlaneGeometry(3.1, 6.6); gs.rotateX(-Math.PI / 2);
  const som = new THREE.Mesh(gs, new THREE.MeshBasicMaterial({ map: mancha, transparent: true, depthWrite: false, opacity: 0.7 })); som.position.y = 0.04; som.renderOrder = 3; grupo.add(som);

  return { grupo, cuerpo, ruedas, torreta, arma, carga, mats, E, luzFreno(k) { mats.piloto.emissiveIntensity = 0.15 + 3.2 * k; } };
}
