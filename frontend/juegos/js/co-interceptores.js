// 19-JUE · Corredor · Drones interceptores propios. Salen de un lanzador en la plataforma de carga, buscan al dron
// enemigo marcado más peligroso y lo embisten (estallan a menos de 3 m). Si no hay blanco, hacen guardia sobre la
// camioneta y atacan al primero que marque el radar; a los 30 s sin blanco vuelven y se recuperan.
// El inhibidor no les afecta (van por otra frecuencia). Se arman en código, en color arena con luz azul: propios.
// Licencia: MIT (código propio).
import * as THREE from 'three';
import { fusionar, pintar } from './lc-util.js';

export const INTERCEPTORES = 4;   // por tramo
const VEL = 52, ACC = 70, RADIO_GOLPE = 3, GUARDIA = 30, ALCANCE = 400;

function modelo() {
  const C = (r, g, b) => new THREE.Color().setRGB(r, g, b), arena = C(0.42, 0.36, 0.24), negro = C(0.03, 0.03, 0.035), metal = C(0.3, 0.3, 0.32);
  const caja = (w, h, l, x, y, z, c) => { const g = new THREE.BoxGeometry(w, h, l); g.translate(x, y, z); return pintar(g, c); };
  const p = [caja(0.08, 0.05, 0.24, 0, 0, 0, arena), caja(0.05, 0.03, 0.12, 0, 0.04, -0.02, negro)], h = [];
  for (let k = 0; k < 4; k++) {
    const a = (k + 0.5) / 4 * Math.PI * 2, x = Math.sin(a) * 0.2, z = Math.cos(a) * 0.2;
    const b = new THREE.BoxGeometry(0.025, 0.018, 0.2); b.translate(0, 0, 0.1); b.rotateY(a); p.push(pintar(b, negro));
    const m = new THREE.CylinderGeometry(0.022, 0.02, 0.03, 10); m.translate(x, 0.02, z); p.push(pintar(m, metal));
    const d = new THREE.CircleGeometry(0.085, 20); d.rotateX(-Math.PI / 2); d.translate(x, 0.04, z); h.push(pintar(d, C(0.05, 0.05, 0.05)));
  }
  const punta = new THREE.CylinderGeometry(0, 0.03, 0.08, 10); punta.rotateX(Math.PI / 2); punta.translate(0, 0, 0.16); p.push(pintar(punta, arena));
  return { cuerpo: fusionar(p), helices: fusionar(h) };
}

/** cb: { caza(propio, enemigo), golpe(propio, enemigo, p), recuperado(propio) }. suelo(x, z) = altura del terreno. */
export function crearInterceptores(scene, suelo, cb) {
  const M = modelo(), lista = [], W = new THREE.Vector3(), V = new THREE.Vector3();
  const mCuerpo = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.2 });
  const mHelice = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide });
  const mLuz = new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(0.3, 1.4, 3.2) }), gLuz = new THREE.SphereGeometry(0.02, 6, 4);

  function quitar(d) { scene.remove(d.obj); const k = lista.indexOf(d); if (k >= 0) lista.splice(k, 1); }
  function volar(d, x, y, z, vmax, acc, dt, frena = true) {
    W.set(x - d.pos.x, y - d.pos.y, z - d.pos.z); const l = W.length() || 1;
    W.multiplyScalar(vmax * (frena ? Math.min(1, l / 10) : 1) / l).sub(d.vel);
    const dv = W.length(), max = acc * dt; if (dv > max) W.multiplyScalar(max / dv);
    d.vel.add(W); d.pos.addScaledVector(d.vel, dt);
    const piso = suelo(d.pos.x, d.pos.z) + 0.6; if (d.pos.y < piso) { d.pos.y = piso; if (d.vel.y < 0) d.vel.y = 0; }
  }
  /** El blanco más urgente que no persiga ya otro interceptor: primero el que ataca, luego el más cercano. */
  function elegir(d, enemigos) {
    let mejor = null, mp = Infinity;
    for (const pasada of [true, false]) {
      for (const e of enemigos) {
        if (!e.viva || !e.detectada || e.cegado > 0) continue;
        if (pasada && lista.some((o) => o !== d && o.blanco === e)) continue;
        const dist = d.pos.distanceTo(e.pos); if (dist > ALCANCE) continue;
        const p = dist - (e.peligro ? 150 : 0) - (e.estado === 'picada' ? 80 : 0);
        if (p < mp) { mp = p; mejor = e; }
      }
      if (mejor) return mejor;
    }
    return null;
  }

  return {
    lista,
    reiniciar() { for (const d of [...lista]) quitar(d); },
    /** Lanza uno desde `origen` (la plataforma de carga) con la velocidad de la camioneta más un empujón hacia arriba. */
    lanzar(origen, velBase) {
      const obj = new THREE.Group();
      const c = new THREE.Mesh(M.cuerpo, mCuerpo); c.castShadow = true; obj.add(c);
      obj.add(new THREE.Mesh(M.helices, mHelice));
      const luz = new THREE.Mesh(gLuz, mLuz); luz.position.set(0, 0.03, -0.12); obj.add(luz);
      obj.scale.setScalar(1.5); obj.position.copy(origen); scene.add(obj);
      const d = { tipo: 'propio', obj, luz, pos: obj.position, vel: velBase.clone().add(V.set(0, 9, 0)), estado: 'despegue', t: 0, blanco: null,
        viva: true, detectada: true, ang: Math.random() * 6.28, x: origen.x, z: origen.z };
      lista.push(d);
      return d;
    },
    actualizar(dt, enemigos, base, velBase, t) {
      for (const d of [...lista]) {
        d.t += dt;
        if (d.estado === 'despegue') { volar(d, base.x, base.y + 16, base.z, 22, 40, dt); if (d.t > 0.8) d.estado = 'guardia'; }
        else {
          if (d.estado !== 'regreso' && (!d.blanco || !d.blanco.viva || d.blanco.cegado > 0)) {
            const antes = d.blanco; d.blanco = elegir(d, enemigos);
            d.estado = d.blanco ? 'caza' : 'guardia';
            if (d.blanco && d.blanco !== antes) cb.caza(d, d.blanco);
          }
          if (d.estado === 'caza') {
            const b = d.blanco, dist = d.pos.distanceTo(b.pos), tt = dist / VEL;
            volar(d, b.pos.x + b.vel.x * tt, b.pos.y + b.vel.y * tt, b.pos.z + b.vel.z * tt, VEL, ACC, dt, false);
            if (d.pos.distanceTo(b.pos) < RADIO_GOLPE) { quitar(d); cb.golpe(d, b, d.pos.clone()); continue; }
          } else if (d.estado === 'guardia') {
            d.ang += dt * 0.9;
            volar(d, base.x + velBase.x * 0.6 + Math.cos(d.ang) * 14, base.y + 22, base.z + velBase.z * 0.6 + Math.sin(d.ang) * 14, 30, 25, dt);
            if (d.t > GUARDIA) d.estado = 'regreso';
          } else {   // regreso: aterriza en la plataforma y se recupera
            volar(d, base.x, base.y + 2.4, base.z, 26, 30, dt);
            if (d.pos.distanceTo(V.set(base.x, base.y + 2.4, base.z)) < 3) { quitar(d); cb.recuperado(d); continue; }
          }
        }
        if (d.vel.lengthSq() > 4) d.obj.lookAt(V.copy(d.pos).add(d.vel));
        d.luz.visible = ((t * 3 + d.ang) % 1) < 0.5;
        d.x = d.pos.x; d.z = d.pos.z;
      }
    },
  };
}
