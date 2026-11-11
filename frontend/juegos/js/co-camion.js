// 19-JUE · Corredor · Vehículo táctico ligero blindado. No existe un modelo realista y libre de un vehículo así, de modo
// que se arma aquí con placas planas de cantos biselados (perfiles laterales extruidos), como se construye un blindado
// de verdad, y se viste con metal pintado escaneado. La carga (cajas, bidones, barriles) son modelos escaneados de
// Poly Haven (CC0). Diseño propio: no reproduce ningún vehículo ni insignia real. Licencia: MIT (código propio).
// Las piezas fijas se funden por material: un vehículo de ~120 piezas sueltas cuesta ~120 llamadas de dibujo.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { texturaCanvas } from './render.js';

// x: a lo ancho (+ derecha) · y: altura sobre el suelo · z: de la cola (−) al morro (+). Metros.
export const TACTICA = { id: 'tactica', nombre: 'Vehículo táctico ligero 4x4', cola: -2.45, morro: 2.5, ejeDel: 1.62, ejeTras: -1.68, via: 0.86, radio: 0.46 };

/** Funde geometrías de un mismo material en una sola (todas sin índice y con posición, normal y uv). */
function juntar(lista) {
  return mergeGeometries(lista.map((g0) => {
    const g = g0.index ? g0.toNonIndexed() : g0;
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') g.deleteAttribute(k);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    return g;
  }));
}
const caja = (w, h, l, x = 0, y = 0, z = 0, rx = 0, ry = 0) => { const g = new THREE.BoxGeometry(w, h, l); if (rx) g.rotateX(rx); if (ry) g.rotateY(ry); return g.translate(x, y, z); };
const tubo = (r, l, x = 0, y = 0, z = 0, eje = 'y', seg = 12) => { const g = new THREE.CylinderGeometry(r, r, l, seg); if (eje === 'x') g.rotateZ(Math.PI / 2); if (eje === 'z') g.rotateX(Math.PI / 2); return g.translate(x, y, z); };
/** Placa de blindaje: perfil lateral [[z, y], …] extruido a lo ancho, centrado en x, con los cantos biselados. */
function placa(pts, ancho, x = 0, bisel = 0.022) {
  const forma = new THREE.Shape(pts.map(([z, y]) => new THREE.Vector2(z, y)));
  const g = new THREE.ExtrudeGeometry(forma, { depth: ancho - 2 * bisel, bevelEnabled: true, bevelThickness: bisel, bevelSize: bisel, bevelSegments: 1, curveSegments: 4 });
  g.rotateY(-Math.PI / 2);   // el perfil (z, y) queda de costado y la extrusión va a lo ancho
  return g.translate(x + (ancho - 2 * bisel) / 2, 0, 0);
}

function rueda(E) {
  const R = E.radio, perfil = [[0.27, -0.155], [0.4, -0.16], [R - 0.018, -0.135], [R, -0.092], [R, 0.092], [R - 0.018, 0.135], [0.4, 0.16], [0.27, 0.155]].map(([r, a]) => new THREE.Vector2(r, a));
  const cubierta = new THREE.LatheGeometry(perfil, 36); cubierta.rotateZ(-Math.PI / 2);
  const goma = [cubierta];   // dibujo todoterreno: tacos alternos en los hombros y una fila central
  for (let k = 0; k < 32; k++) {
    const a = k / 32 * Math.PI * 2;
    for (const [x, w] of [[k % 2 ? -0.088 : 0.088, 0.1], [0, 0.07]]) { if (!x && k % 2) continue; const g = new THREE.BoxGeometry(w, 0.032, 0.062); g.translate(x, R + 0.007, 0); g.rotateX(a); goma.push(g); }
  }
  const acero = [tubo(0.275, 0.05, 0.09, 0, 0, 'x', 20), tubo(0.23, 0.07, 0.13, 0, 0, 'x', 20), tubo(0.085, 0.1, 0.19, 0, 0, 'x', 12)];
  for (let k = 0; k < 8; k++) { const g = tubo(0.017, 0.03, 0, 0, 0, 'x', 6); g.translate(0.17, 0.13, 0); g.rotateX(k * Math.PI / 4); acero.push(g); }   // tuercas del aro partido
  return { goma: juntar(goma), acero: juntar(acero) };
}

/** R = { pintura: {map, normalMap, armMap}, modelos: { caja, bidon, barril } } */
export function crearCamion(R, E = TACTICA) {
  const grupo = new THREE.Group(), cuerpo = new THREE.Group(); grupo.add(cuerpo);
  const mats = {
    // El escaneo es chapa verde con óxido: aporta desgaste real; el tinte lo lleva a verde oliva mate.
    pintura: new THREE.MeshStandardMaterial({ map: R.pintura.map, normalMap: R.pintura.normalMap, roughnessMap: R.pintura.armMap, aoMap: R.pintura.armMap, color: new THREE.Color().setRGB(0.6, 0.64, 0.48), roughness: 1, metalness: 0.08, normalScale: new THREE.Vector2(0.7, 0.7) }),
    liso: new THREE.MeshStandardMaterial({ color: new THREE.Color().setRGB(0.07, 0.088, 0.05), roughness: 0.78, metalness: 0.15 }),
    cristal: new THREE.MeshPhysicalMaterial({ color: 0x0a1014, roughness: 0.05, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.3 }),
    negro: new THREE.MeshStandardMaterial({ color: 0x0b0c0d, roughness: 0.72, metalness: 0.2 }),
    goma: new THREE.MeshStandardMaterial({ color: 0x0d0d0e, roughness: 0.92, side: THREE.DoubleSide }),
    acero: new THREE.MeshStandardMaterial({ color: new THREE.Color().setRGB(0.045, 0.055, 0.035), roughness: 0.66, metalness: 0.35 }),
    arma: new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.45, metalness: 0.75 }),
    faro: new THREE.MeshPhysicalMaterial({ color: 0xdfe6ea, roughness: 0.08, metalness: 0.2, clearcoat: 1, emissive: new THREE.Color().setRGB(1, 0.92, 0.75), emissiveIntensity: 0.35 }),
    piloto: new THREE.MeshStandardMaterial({ color: 0x3a0606, roughness: 0.35, emissive: new THREE.Color().setRGB(1, 0.05, 0.03), emissiveIntensity: 0.15 }),
  };
  const P = { pintura: [], liso: [], negro: [], cristal: [], faro: [], piloto: [] };
  const zM = E.morro, zC = E.cola;

  // ── Casco: abajo, estrecho entre las ruedas; arriba, la cubierta ancha que hace de guardabarros.
  P.pintura.push(placa([[zC + 0.05, 0.55], [zM - 0.2, 0.55], [zM, 0.74], [zM, 1.06], [zC + 0.03, 1.06]], 1.36));
  P.pintura.push(placa([[zC, 1.03], [zM - 0.06, 1.03], [zM + 0.03, 1.12], [zC, 1.12]], 2.14));
  // Capó: cae hacia el morro, con el borde delantero achaflanado.
  P.pintura.push(placa([[0.92, 1.1], [zM, 1.1], [zM, 1.25], [zM - 0.13, 1.35], [0.95, 1.45]], 1.98));
  // Cabina de cuatro puertas: parabrisas casi vertical (blindado) y techo plano.
  P.pintura.push(placa([[-0.82, 1.1], [0.95, 1.1], [0.95, 1.46], [0.8, 1.9], [-0.82, 1.93]], 2.02));
  // Caja de carga: barandas de chapa y portón.
  for (const sx of [-1, 1]) P.pintura.push(caja(0.06, 0.4, 1.6, sx * 1.04, 1.32, -1.63));
  P.pintura.push(caja(2.14, 0.4, 0.07, 0, 1.32, zC + 0.035));
  // Guardabarros: labios inclinados sobre cada rueda y faldones de goma detrás.
  for (const z of [E.ejeDel, E.ejeTras]) for (const sx of [-1, 1]) {
    P.pintura.push(caja(0.2, 0.06, 1.12, sx * 1.02, 1.0, z, 0, 0)); P.negro.push(caja(0.3, 0.34, 0.02, sx * E.via, 0.62, z - 0.62));
  }

  // ── Ventanas blindadas: vidrio grueso, pequeño, con marco negro ancho.
  const ventana = (sx, z, l) => { P.negro.push(caja(0.03, 0.42, l + 0.1, sx * 1.006, 1.66, z)); P.cristal.push(caja(0.03, 0.32, l, sx * 1.018, 1.67, z)); };
  for (const sx of [-1, 1]) { ventana(sx, 0.36, 0.52); ventana(sx, -0.42, 0.5); }
  { const ang = Math.atan2(0.44, 0.15), nz = Math.cos(Math.PI / 2 - ang), ny = Math.sin(Math.PI / 2 - ang);   // el plano del parabrisas
    for (const sx of [-1, 1]) {
      P.negro.push(caja(0.88, 0.44, 0.03, sx * 0.47, 1.68 + ny * 0.032, 0.875 + nz * 0.032, -(Math.PI / 2 - ang)));
      P.cristal.push(caja(0.76, 0.34, 0.03, sx * 0.47, 1.68 + ny * 0.048, 0.875 + nz * 0.048, -(Math.PI / 2 - ang)));
    }
    P.negro.push(caja(0.06, 0.46, 0.04, 0, 1.68 + ny * 0.055, 0.875 + nz * 0.055, -(Math.PI / 2 - ang)));   // parteaguas central
  }
  P.negro.push(caja(1.0, 0.3, 0.03, 0, 1.68, -0.84)); P.cristal.push(caja(0.88, 0.2, 0.03, 0, 1.68, -0.855));
  // Juntas de las puertas, manijas, estribos y retrovisores.
  for (const sx of [-1, 1]) {
    for (const z of [0.93, 0.02, -0.8]) P.negro.push(caja(0.012, 0.8, 0.018, sx * 1.012, 1.5, z));
    for (const z of [0.12, -0.66]) P.negro.push(caja(0.03, 0.04, 0.16, sx * 1.025, 1.38, z));
    P.negro.push(caja(0.32, 0.05, 1.5, sx * 0.84, 0.6, -0.05));
    P.negro.push(caja(0.2, 0.025, 0.025, sx * 1.1, 1.62, 0.93), caja(0.04, 0.26, 0.15, sx * 1.21, 1.68, 0.93));
  }

  // ── Morro: rejilla blindada de ranuras, faros hundidos, parachoques con cabrestante y defensa.
  P.negro.push(caja(1.24, 0.24, 0.04, 0, 1.2, zM + 0.005));
  for (let k = -5; k <= 5; k++) P.liso.push(caja(0.045, 0.26, 0.06, k * 0.11, 1.2, zM + 0.02));
  for (const sx of [-1, 1]) {
    P.negro.push(caja(0.26, 0.17, 0.05, sx * 0.82, 1.2, zM + 0.005)); P.faro.push(caja(0.2, 0.12, 0.02, sx * 0.82, 1.2, zM + 0.03));
    P.negro.push(tubo(0.03, 0.62, sx * 0.62, 0.95, zM + 0.22), caja(0.08, 0.08, 0.2, sx * 0.62, 0.68, zM + 0.14));
    P.negro.push(new THREE.TorusGeometry(0.05, 0.016, 6, 12).rotateY(Math.PI / 2).translate(sx * 0.42, 0.6, zM + 0.22));   // ganchos de remolque
  }
  P.negro.push(caja(2.16, 0.24, 0.22, 0, 0.72, zM + 0.1), caja(0.62, 0.2, 0.16, 0, 0.74, zM + 0.2), tubo(0.03, 1.28, 0, 1.25, zM + 0.22, 'x'));

  // ── Techo: aro de torreta, lanzagranadas de humo en las esquinas y escape vertical.
  P.liso.push(tubo(0.52, 0.08, 0, 1.97, -0.1, 'y', 28));
  for (const sx of [-1, 1]) for (let k = 0; k < 4; k++) {
    const g = tubo(0.042, 0.24, 0, 0, 0, 'y', 10); g.rotateX(0.75 - k * 0.05); g.rotateZ(sx * (0.25 + k * 0.18)); P.liso.push(g.translate(sx * (0.62 + k * 0.08), 2.0, 0.62 - k * 0.04));
  }
  P.liso.push(tubo(0.05, 0.75, 1.08, 1.6, -0.86), tubo(0.065, 0.06, 1.08, 1.99, -0.86));

  // ── Cola: pilotos, parachoques, enganche, rueda de repuesto y bidones en su soporte.
  for (const sx of [-1, 1]) { P.negro.push(caja(0.2, 0.13, 0.03, sx * 0.86, 1.075, zC - 0.03)); P.piloto.push(caja(0.13, 0.07, 0.02, sx * 0.86, 1.075, zC - 0.045)); }
  P.negro.push(caja(2.1, 0.16, 0.16, 0, 0.62, zC - 0.04), caja(0.16, 0.1, 0.28, 0, 0.55, zC - 0.18), caja(0.14, 0.7, 0.06, 0, 1.2, zC - 0.06));
  const antena = (x, z) => { P.negro.push(tubo(0.03, 0.14, x, 1.6, z), tubo(0.007, 2.4, x, 2.87, z, 'y', 5)); };
  antena(-1.0, -0.95); antena(-1.0, -2.3);

  // Bastidor y ejes: lo que se ve por debajo de un vehículo alto.
  P.negro.push(caja(1.1, 0.24, 4.6, 0, 0.5, 0));
  for (const z of [E.ejeDel, E.ejeTras]) P.negro.push(tubo(0.07, 1.62, 0, E.radio, z, 'x'), new THREE.SphereGeometry(0.18, 12, 8).translate(0, E.radio, z));

  for (const [k, lista] of Object.entries(P)) { const m = new THREE.Mesh(juntar(lista), mats[k]); m.castShadow = k !== 'cristal'; m.receiveShadow = true; cuerpo.add(m); }

  // Rueda de repuesto en el portón, de cara a quien viene detrás.
  const R0 = rueda(E);
  { const r = new THREE.Group(); r.position.set(0, 1.22, zC - 0.22); r.rotation.y = Math.PI / 2; r.add(new THREE.Mesh(R0.goma, mats.goma), new THREE.Mesh(R0.acero, mats.acero)); r.children.forEach((m) => { m.castShadow = true; }); cuerpo.add(r); }

  // Rótulo de unidad en las puertas (ficticio), pintado a plantilla.
  const rotulo = texturaCanvas(256, 96, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(222,220,205,0.82)'; g.font = "700 62px 'Arial Narrow', 'Saira Extra Condensed', sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('SUM · 07', w / 2, h / 2 + 4); });
  const mRot = new THREE.MeshStandardMaterial({ map: rotulo, transparent: true, roughness: 0.8, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  for (const sx of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.23), mRot); p.position.set(sx * 1.034, 1.28, 0.38); p.rotation.y = sx * Math.PI / 2; cuerpo.add(p); }

  // La carga, en el piso de la caja. Se va perdiendo con las minas y las granadas.
  const carga = new THREE.Group(); carga.position.y = 1.125; cuerpo.add(carga);
  const dejar = (gltf, x, y, z, ry = 0, s = 1) => { if (!gltf) return; const o = gltf.scene.clone(); o.position.set(x, y, z); o.rotation.y = ry; o.scale.setScalar(s); o.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); carga.add(o); };
  const md = R.modelos || {};
  dejar(md.caja, -0.62, 0, -1.2); dejar(md.caja, 0, 0, -1.2, 0.03); dejar(md.caja, 0.62, 0, -1.22, -0.02);
  dejar(md.caja, -0.3, 0.445, -1.25, Math.PI / 2 + 0.06); dejar(md.caja, 0.5, 0.445, -1.12, 0.1);
  dejar(md.barril, -0.6, 0, -1.95, 0.6); dejar(md.barril, 0.08, 0, -1.97, 2.1);
  dejar(md.bidon, 0.62, 0, -1.85, Math.PI / 2); dejar(md.bidon, 0.62, 0, -2.07, Math.PI / 2 + 0.05); dejar(md.bidon, 0.8, 0, -1.67, 0.2);

  // Torreta: gira (rumbo) con el escudo del tirador; `arma` cabecea. co-arma.js dispara desde z 1,3 de `arma`.
  const torreta = new THREE.Group(); torreta.position.set(0, 2.0, -0.1); cuerpo.add(torreta);
  // Placa frontal partida (por la ranura del centro pasa el cañón al cabecear), dos alas inclinadas y mirillas.
  { const escudo = [caja(0.42, 0.56, 0.035, -0.29, 0.3, 0.44), caja(0.42, 0.56, 0.035, 0.29, 0.3, 0.44), caja(0.16, 0.12, 0.035, 0, 0.52, 0.44)];
    for (const sx of [-1, 1]) escudo.push(caja(0.42, 0.5, 0.035, sx * 0.64, 0.28, 0.33, 0, sx * 0.62));
    const mE = new THREE.Mesh(juntar(escudo), mats.pintura); mE.castShadow = true; torreta.add(mE);
    const mN = new THREE.Mesh(juntar([caja(0.22, 0.07, 0.04, -0.29, 0.42, 0.465), caja(0.22, 0.07, 0.04, 0.29, 0.42, 0.465), tubo(0.05, 0.3, 0, 0.14, 0.1)]), mats.negro); torreta.add(mN);
    const mC = new THREE.Mesh(juntar([caja(0.17, 0.045, 0.02, -0.29, 0.42, 0.49), caja(0.17, 0.045, 0.02, 0.29, 0.42, 0.49)]), mats.cristal); torreta.add(mC);
  }
  const arma = new THREE.Group(); arma.position.set(0, 0.28, 0.12); torreta.add(arma);
  { const piezas = [caja(0.13, 0.15, 0.55, 0, 0, 0.04), tubo(0.022, 0.95, 0, 0.012, 0.76, 'z', 8), tubo(0.036, 0.42, 0, 0.012, 0.48, 'z', 10), tubo(0.033, 0.09, 0, 0.012, 1.24, 'z', 8)];
    for (const sx of [-1, 1]) piezas.push(caja(0.03, 0.11, 0.03, sx * 0.06, -0.02, -0.28));   // empuñaduras
    const mA = new THREE.Mesh(juntar(piezas), mats.arma); mA.castShadow = true; arma.add(mA);
    const caj = new THREE.Mesh(caja(0.2, 0.15, 0.13, -0.17, -0.02, 0.02), mats.liso); caj.castShadow = true; arma.add(caj);   // caja de munición
  }

  // Ruedas.
  const ruedas = [];
  for (const [z, delantera] of [[E.ejeDel, true], [E.ejeTras, false]]) for (const sx of [1, -1]) {
    const pivote = new THREE.Group(), giro = new THREE.Group(); pivote.add(giro);
    const mG = new THREE.Mesh(R0.goma, mats.goma), mA = new THREE.Mesh(R0.acero, mats.acero); mG.castShadow = true; giro.add(mG, mA);
    pivote.position.set(sx * E.via, E.radio, z); pivote.scale.x = sx; grupo.add(pivote);
    ruedas.push({ pivote, giro, delantera, sx });
  }
  // Sombra de contacto bajo el chasis.
  const mancha = texturaCanvas(64, 128, (g, w, h) => { g.clearRect(0, 0, w, h); const gr = g.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w * 0.5); gr.addColorStop(0, 'rgba(0,0,0,0.75)'); gr.addColorStop(0.65, 'rgba(0,0,0,0.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.save(); g.translate(w / 2, h / 2); g.scale(1, 2); g.translate(-w / 2, -h / 2); g.fillStyle = gr; g.fillRect(0, -h, w, h * 3); g.restore(); });
  const gs = new THREE.PlaneGeometry(3.1, 6.4); gs.rotateX(-Math.PI / 2);
  const som = new THREE.Mesh(gs, new THREE.MeshBasicMaterial({ map: mancha, transparent: true, depthWrite: false, opacity: 0.7 })); som.position.y = 0.04; som.renderOrder = 3; grupo.add(som);

  return { grupo, cuerpo, ruedas, torreta, arma, carga, mats, E, luzFreno(k) { mats.piloto.emissiveIntensity = 0.15 + 3.2 * k; } };
}
