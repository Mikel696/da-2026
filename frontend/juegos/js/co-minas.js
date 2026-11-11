// 19-JUE · Corredor · Minas antitanque. Van enterradas en las rodadas, que es por donde pisan las ruedas: estallan
// con el peso de una rueda, así que una mina que queda ENTRE las ruedas deja pasar la camioneta. A simple vista
// casi no se ven (solo la tierra removida las delata); el radar las revela y entonces se marcan en la vía.
// El campo es una tabla: [metros desde la salida, [posición lateral de cada mina]], con + a la derecha.
// Licencia: MIT (código propio). La chapa usa la textura escaneada que llega en `tex` (Poly Haven, CC0).
import * as THREE from 'three';
import { texturaCanvas } from './render.js';
import { semilla } from './lc-util.js';
import { TACTICA } from './co-camion.js';

export const DISPARO = 0.38;   // distancia rueda–mina que la hace estallar (m): 17 cm de mina + media huella de llanta
export const RUEDAS = [[TACTICA.via, TACTICA.ejeDel], [-TACTICA.via, TACTICA.ejeDel], [TACTICA.via, TACTICA.ejeTras], [-TACTICA.via, TACTICA.ejeTras]];

// Tramo 1. Circulando por el centro del carril derecho (+1,6 m) las ruedas van a +0,74 y +2,46 m.
export const CAMPO_1 = [
  [95, [2.45]], [150, [0.75, 2.6]], [215, [-0.75]], [265, [2.45, -2.45]], [330, [3.7, 0.75]],
  [395, [0, -2.4]], [450, [1.6]], [505, [-0.8, 0.8]], [560, [2.45, 0.75, -3.6]], [615, [-0.75, 1.6, 3.0]],
];

export function crearMinas(P, campo, inicio, tex) {
  const lista = [], o = {}, rnd = semilla(707);
  for (const [s, ls] of campo) for (const l of ls) {
    const d = P.dist[inicio] + s; let i = inicio;
    while (i < P.n - 2 && P.dist[i + 1] < d) i++;
    const f = (d - P.dist[i]) / ((P.dist[i + 1] - P.dist[i]) || 1);
    const x = P.px[i] + (P.px[i + 1] - P.px[i]) * f + P.rx[i] * l, z = P.pz[i] + (P.pz[i + 1] - P.pz[i]) * f + P.rz[i] * l;
    P.consulta(x, z, -1, o);
    lista.push({ tipo: 'mina', s, l, x, y: o.y, z, i, dist: d, giro: rnd() * 6.283, viva: true, detectada: false, pasada: false });
  }
  const N = lista.length, grupo = new THREE.Group();

  // Tierra removida sobre la mina, y el cráter que queda cuando estalla.
  const tParche = texturaCanvas(128, 128, (g, W) => {
    g.clearRect(0, 0, W, W);
    for (let k = 0; k < 90; k++) {
      const a = rnd() * 6.283, r = rnd() ** 0.7 * W * 0.34, s = 6 + rnd() * 14, v = 40 + rnd() * 40;
      g.fillStyle = `rgba(${v + 22},${v + 10},${v},${0.18 + rnd() * 0.3})`;
      g.beginPath(); g.ellipse(W / 2 + Math.cos(a) * r, W / 2 + Math.sin(a) * r, s, s * (0.6 + rnd() * 0.5), rnd() * 3, 0, 7); g.fill();
    }
  });
  const tCrater = texturaCanvas(256, 256, (g, W) => {
    g.clearRect(0, 0, W, W);
    const gr = g.createRadialGradient(W / 2, W / 2, 4, W / 2, W / 2, W / 2);
    gr.addColorStop(0, 'rgba(8,7,6,0.95)'); gr.addColorStop(0.35, 'rgba(18,15,12,0.85)'); gr.addColorStop(0.7, 'rgba(40,34,26,0.4)'); gr.addColorStop(1, 'rgba(40,34,26,0)');
    g.fillStyle = gr; g.fillRect(0, 0, W, W);
    for (let k = 0; k < 40; k++) {
      const a = rnd() * 6.283, r1 = W * (0.3 + rnd() * 0.2);
      g.strokeStyle = `rgba(30,24,18,${0.3 + rnd() * 0.4})`; g.lineWidth = 2 + rnd() * 6;
      g.beginPath(); g.moveTo(W / 2 + Math.cos(a) * W * 0.18, W / 2 + Math.sin(a) * W * 0.18); g.lineTo(W / 2 + Math.cos(a) * r1, W / 2 + Math.sin(a) * r1); g.stroke();
    }
    g.fillStyle = 'rgba(4,3,3,0.9)'; g.beginPath(); g.ellipse(W / 2, W / 2, W * 0.11, W * 0.09, 0, 0, 7); g.fill();
  });
  const calco = (map, opacidad = 1) => new THREE.MeshStandardMaterial({ map, transparent: true, opacity: opacidad, roughness: 1, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  const plano = (t) => { const g = new THREE.PlaneGeometry(t, t); g.rotateX(-Math.PI / 2); return g; };

  const metal = new THREE.MeshStandardMaterial({ map: tex.map, normalMap: tex.normalMap, roughnessMap: tex.armMap, color: new THREE.Color().setRGB(0.42, 0.45, 0.33), roughness: 1, metalness: 0.35 });
  const gPlato = new THREE.CylinderGeometry(0.07, 0.075, 0.03, 16); gPlato.translate(0, 0.055, 0);
  const rojo = new THREE.Color().setRGB(3.2, 0.42, 0.16);   // más de 1: el resplandor de la cámara lo hace brillar
  const gAnillo = new THREE.RingGeometry(0.55, 0.7, 40); gAnillo.rotateX(-Math.PI / 2);
  const gBaliza = new THREE.ConeGeometry(0.17, 0.42, 4); gBaliza.rotateX(Math.PI);
  const im = (geo, mat) => { const m = new THREE.InstancedMesh(geo, mat, N); m.frustumCulled = false; m.receiveShadow = true; grupo.add(m); return m; };
  const cuerpo = im(new THREE.CylinderGeometry(0.165, 0.18, 0.09, 22), metal), plato = im(gPlato, metal);
  const parche = im(plano(1.15), calco(tParche, 0.75)), crater = im(plano(2.8), calco(tCrater));
  const anillo = im(gAnillo, new THREE.MeshBasicMaterial({ color: rojo, transparent: true, opacity: 0.9, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6 }));
  const baliza = im(gBaliza, new THREE.MeshBasicMaterial({ color: rojo }));
  parche.renderOrder = crater.renderOrder = anillo.renderOrder = 2;

  // Base apoyada en la vía: x a lo largo, y la normal (con pendiente y peralte), z hacia la derecha.
  const M = new THREE.Matrix4(), R = new THREE.Matrix4(), S = new THREE.Matrix4(), cero = new THREE.Matrix4().makeScale(0, 0, 0);
  const X = new THREE.Vector3(), Y = new THREE.Vector3(), Z = new THREE.Vector3(), V = new THREE.Vector3(), Q = new THREE.Quaternion(), ARRIBA = new THREE.Vector3(0, 1, 0), UNO = new THREE.Vector3(1, 1, 1);
  function base(m, alto, giro, esc) {
    const i = m.i;
    X.set(P.tx[i], P.ty[i], P.tz[i]).normalize(); Z.set(P.rx[i], -P.peralte[i], P.rz[i]).normalize();
    Y.crossVectors(Z, X).normalize(); Z.crossVectors(X, Y).normalize();
    M.makeBasis(X, Y, Z).multiply(R.makeRotationY(giro)).multiply(S.makeScale(esc, esc, esc));
    return M.setPosition(m.x, m.y + alto, m.z);
  }
  const todas = [cuerpo, plato, parche, crater, anillo, baliza];
  const listo = () => { for (const x of todas) x.instanceMatrix.needsUpdate = true; };
  function reiniciar() {
    lista.forEach((m, k) => {
      Object.assign(m, { viva: true, detectada: false, pasada: false });
      cuerpo.setMatrixAt(k, base(m, -0.03, m.giro, 1)); plato.setMatrixAt(k, base(m, -0.03, m.giro, 1)); parche.setMatrixAt(k, base(m, 0.02, m.giro, 1));
      crater.setMatrixAt(k, cero); anillo.setMatrixAt(k, cero); baliza.setMatrixAt(k, cero);
    });
    listo();
  }
  reiniciar();

  return {
    lista, grupo, reiniciar,
    /** Las minas que el radar ya marcó llevan un anillo que late en la vía y una baliza que flota encima. */
    actualizar(t) {
      let hay = false;
      lista.forEach((m, k) => {
        if (!m.viva || !m.detectada) return;
        anillo.setMatrixAt(k, base(m, 0.035, 0, 1 + 0.12 * Math.sin(t * 6 + k)));
        baliza.setMatrixAt(k, M.compose(V.set(m.x, m.y + 1.5 + 0.12 * Math.sin(t * 2.4 + k), m.z), Q.setFromAxisAngle(ARRIBA, t * 1.6 + k), UNO));
        hay = true;
      });
      if (hay) { anillo.instanceMatrix.needsUpdate = true; baliza.instanceMatrix.needsUpdate = true; }
    },
    estallar(m) {
      const k = lista.indexOf(m); m.viva = false;
      for (const x of [cuerpo, plato, parche, anillo, baliza]) x.setMatrixAt(k, cero);
      crater.setMatrixAt(k, base(m, 0.03, m.giro, 1)); listo();
    },
  };
}
