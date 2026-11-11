// 19-JUE · Corredor · Heridos y puesto de socorro. Soldados heridos en camilla a la orilla de la vía; una bengala de
// humo naranja los señala de lejos. Para subirlos hay que detenerse a su lado unos segundos (mientras te defiendes)
// y llevarlos al puesto de control, donde hay una carpa de socorro. Ficticios: sin insignias, emblemas ni bandos reales.
// Se arman en código. La lista es datos: [metros desde la salida, lado (−1 izquierda, +1 derecha)].
// Licencia: MIT (código propio).
import * as THREE from 'three';
import { fusionar, pintar } from './lc-util.js';
import { ARCEN } from './co-via.js';

export const HERIDOS = { 1: [[230, -1], [470, 1]], 2: [[180, 1], [400, -1], [560, 1]], 3: [[200, -1], [520, 1]] };
export const SUBIR = 4;          // segundos parado a su lado para subirlo
export const RADIO_SUBIR = 7.5;  // distancia máxima entre la camioneta y el herido (m)
const PARADO = 1.0;              // m/s: más rápido que esto no se puede subir a nadie

const C = (r, g, b) => new THREE.Color().setRGB(r, g, b);
const COL = { uniforme: C(0.12, 0.14, 0.08), piel: C(0.42, 0.3, 0.22), venda: C(0.8, 0.78, 0.72), lona: C(0.2, 0.22, 0.13), palo: C(0.18, 0.13, 0.08), bota: C(0.035, 0.035, 0.035), carpa: C(0.2, 0.23, 0.13), tierra: C(0.16, 0.13, 0.09) };
function cap(r, l, x, y, z, col, rz = Math.PI / 2, rx = 0) { const g = new THREE.CapsuleGeometry(r, l, 4, 8); g.rotateZ(rz); if (rx) g.rotateX(rx); g.translate(x, y, z); return pintar(g, col); }
function caja(w, h, l, x, y, z, col) { const g = new THREE.BoxGeometry(w, h, l); g.translate(x, y, z); return pintar(g, col); }

/** Herido tumbado en una camilla, a lo largo del eje x (la cabeza hacia +x). */
function camilla() {
  const p = [];
  for (const z of [-0.29, 0.29]) { const g = new THREE.CylinderGeometry(0.02, 0.02, 2.15, 6); g.rotateZ(Math.PI / 2); g.translate(0, 0.13, z); p.push(pintar(g, COL.palo)); }
  p.push(caja(1.85, 0.02, 0.56, 0, 0.13, 0, COL.lona));
  p.push(cap(0.15, 0.42, 0.22, 0.29, 0, COL.uniforme));                                                     // torso
  p.push(cap(0.075, 0.6, -0.42, 0.23, -0.1, COL.uniforme), cap(0.075, 0.6, -0.42, 0.23, 0.1, COL.uniforme)); // piernas
  p.push(caja(0.12, 0.11, 0.1, -0.86, 0.25, -0.1, COL.bota), caja(0.12, 0.11, 0.1, -0.86, 0.25, 0.1, COL.bota));
  p.push(cap(0.055, 0.4, 0.2, 0.27, -0.24, COL.uniforme), cap(0.055, 0.4, 0.28, 0.33, 0.22, COL.uniforme, Math.PI / 2, 0.5));
  const cabeza = new THREE.SphereGeometry(0.105, 12, 8); cabeza.translate(0.66, 0.31, 0); p.push(pintar(cabeza, COL.piel));
  const venda = new THREE.TorusGeometry(0.1, 0.03, 6, 14); venda.rotateY(Math.PI / 2); venda.translate(0.64, 0.35, 0); p.push(pintar(venda, COL.venda));
  const pierna = new THREE.CylinderGeometry(0.085, 0.085, 0.16, 10); pierna.rotateZ(Math.PI / 2); pierna.translate(-0.35, 0.23, 0.1); p.push(pintar(pierna, COL.venda));   // torniquete
  return fusionar(p);
}
/** Carpa de socorro: paredes, techo a dos aguas y sacos de arena delante. Sin emblema. */
function carpa() {
  const p = [caja(4.2, 1.6, 3.2, 0, 0.8, 0, COL.carpa)];
  const techo = new THREE.CylinderGeometry(1.95, 1.95, 4.4, 3, 1); techo.rotateZ(Math.PI / 2); techo.rotateX(Math.PI / 6); techo.scale(1, 0.55, 0.88); techo.translate(0, 1.95, 0); p.push(pintar(techo, COL.carpa));
  p.push(caja(1.1, 1.3, 0.05, 0, 0.65, 1.62, COL.bota));   // entrada abierta
  for (let k = -3; k <= 3; k++) p.push(caja(0.55, 0.25, 0.35, k * 0.58, 0.13, 2.3, COL.tierra), caja(0.55, 0.25, 0.35, k * 0.58 + 0.29, 0.38, 2.3, COL.tierra));
  return fusionar(p);
}

export function crearHeridos(scene, P, inicio, datos) {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0 });
  const gCamilla = camilla(), gBengala = new THREE.CylinderGeometry(0.035, 0.035, 0.22, 8);
  const mBengala = new THREE.MeshStandardMaterial({ color: C(0.7, 0.2, 0.05), emissive: C(1, 0.35, 0.05), emissiveIntensity: 0.6 });
  const lista = [], W = P.def.ancho, o = {};
  for (const [s, lado] of datos) {
    const d = P.dist[inicio] + s; let i = inicio; while (i < P.n - 2 && P.dist[i + 1] < d) i++;
    const l = lado * (W + ARCEN + 0.7), x = P.px[i] + P.rx[i] * l, z = P.pz[i] + P.rz[i] * l, y = P.terreno(x, z);
    const obj = new THREE.Group(); obj.position.set(x, y, z); obj.rotation.y = Math.atan2(-P.tz[i], P.tx[i]);
    const m = new THREE.Mesh(gCamilla, mat); m.castShadow = true; m.receiveShadow = true; obj.add(m);
    const b = new THREE.Mesh(gBengala, mBengala); b.position.set(0.4, 0.11, lado * 0.9); b.rotation.z = 0.5; obj.add(b);
    scene.add(obj);
    lista.push({ tipo: 'herido', s, lado, x, y, z, pos: new THREE.Vector3(x, y + 0.3, z), bengala: new THREE.Vector3(x + P.rx[i] * lado * 0.9, y + 0.2, z + P.rz[i] * lado * 0.9),
      dist: d, obj, viva: true, detectada: true, estado: 'espera', prog: 0, avisado: false });
  }
  // Puesto de socorro junto a las barreras del puesto de control.
  { const i = P.n - 22, l = -(W + ARCEN + 6.5), t = new THREE.Mesh(carpa(), mat); t.castShadow = true; t.receiveShadow = true;
    t.position.set(P.px[i] + P.rx[i] * l, P.terreno(P.px[i] + P.rx[i] * l, P.pz[i] + P.rz[i] * l) - 0.05, P.pz[i] + P.rz[i] * l); t.rotation.y = Math.atan2(-P.rz[i], P.rx[i]) + Math.PI / 2; scene.add(t); }

  return {
    lista,
    reiniciar() { for (const h of lista) { Object.assign(h, { viva: true, estado: 'espera', prog: 0, avisado: false }); h.obj.visible = true; } },
    /** Devuelve lo que pasó en este cuadro: { subiendo, subido, cerca, abandonado }. */
    actualizar(dt, veh, activa) {
      const ev = { subiendo: null, subido: null, cerca: false, abandonado: null };
      if (!activa) return ev;
      for (const h of lista) {
        if (h.estado !== 'espera') continue;
        const d = Math.hypot(h.x - veh.x, h.z - veh.z);
        if (d < RADIO_SUBIR) {
          if (Math.abs(veh.u) < PARADO) {
            h.prog += dt / SUBIR; ev.subiendo = h;
            if (h.prog >= 1) { h.estado = 'a bordo'; h.viva = false; h.obj.visible = false; ev.subido = h; ev.subiendo = null; }
          } else ev.cerca = true;
        }
        if (!h.avisado && veh.sup.dist > h.dist + 25) { h.avisado = true; ev.abandonado = h; }
      }
      return ev;
    },
  };
}
