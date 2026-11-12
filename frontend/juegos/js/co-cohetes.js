// 19-JUE · Corredor · Emboscadas: tiradores con lanzacohetes escondidos detrás de parapetos de sacos junto a la vía.
// Se agachan hasta que la camioneta se acerca; entonces se levantan, apuntan (ese segundo y medio es el aviso), disparan
// un cohete que sí vuela (150 m/s, con estela) y recargan. Apuntan adonde vas a estar: cambiar de velocidad después del
// disparo lo hace fallar; dentro del humo no te ven y no disparan; la torreta los abate (dos impactos, la mitad agachados).
// Figuras hechas en código, sin uniforme ni insignia de ningún país. Licencia: MIT (código propio).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { semilla } from './lc-util.js';
import { ARCEN } from './co-via.js';

export const NOMBRE_TIRADOR = 'Lanzacohetes';
const VISTA = 170;       // m por delante a los que se levanta
const ALCANCE = 190;     // m: más lejos no dispara
const APUNTA = 1.6;      // s apuntando antes de disparar
const RECARGA = 7;       // s entre un cohete y el siguiente
const TIROS = 2;         // cohetes por tirador
export const VEL_COHETE = 150;
const AGACHADO = -1.0;   // cuánto baja el cuerpo detrás del parapeto

const C = (r, g, b) => new THREE.Color().setRGB(r, g, b);
const PALETA = { uniforme: C(0.3, 0.25, 0.16), chaleco: C(0.13, 0.12, 0.08), piel: C(0.4, 0.29, 0.21), panuelo: C(0.48, 0.45, 0.38), casco: C(0.3, 0.28, 0.2), tubo: C(0.16, 0.18, 0.12), ojiva: C(0.11, 0.12, 0.1), bota: C(0.05, 0.045, 0.04), saco: C(0.24, 0.2, 0.13) };
function pintar(g0, col) { const g = g0.index ? g0.toNonIndexed() : g0, n = g.attributes.position.count, c = new Float32Array(n * 3); for (let k = 0; k < n; k++) c.set([col.r, col.g, col.b], k * 3); g.setAttribute('color', new THREE.BufferAttribute(c, 3)); if (g.attributes.uv) g.deleteAttribute('uv'); return g; }
const cap = (r, l, x, y, z, col, rx = 0, rz = 0) => { const g = new THREE.CapsuleGeometry(r, l, 4, 8); if (rx) g.rotateX(rx); if (rz) g.rotateZ(rz); return pintar(g.translate(x, y, z), col); };
const caja = (w, h, l, x, y, z, col) => pintar(new THREE.BoxGeometry(w, h, l).translate(x, y, z), col);

// Los propios (el mecánico): uniforme oliva y la cara descubierta.
export const PROPIO = { ...PALETA, uniforme: C(0.17, 0.2, 0.11), chaleco: C(0.1, 0.12, 0.07), panuelo: C(0.4, 0.29, 0.21), casco: C(0.15, 0.18, 0.1) };

/** De pie, mirando a +z; con `lanzador`, al hombro derecho apuntando al frente. */
export function figura(lanzador = true, COL = PALETA) {
  const p = [cap(0.085, 0.62, -0.11, 0.46, 0, COL.uniforme), cap(0.085, 0.62, 0.11, 0.46, 0, COL.uniforme),
    caja(0.13, 0.1, 0.24, -0.11, 0.05, 0.04, COL.bota), caja(0.13, 0.1, 0.24, 0.11, 0.05, 0.04, COL.bota),
    cap(0.19, 0.4, 0, 1.12, 0, COL.uniforme), caja(0.4, 0.38, 0.3, 0, 1.15, 0.02, COL.chaleco),
    pintar(new THREE.SphereGeometry(0.11, 12, 8).translate(0, 1.6, 0.01), COL.panuelo), pintar(new THREE.SphereGeometry(0.135, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2).translate(0, 1.64, 0), COL.casco),
    caja(0.12, 0.035, 0.02, 0, 1.6, 0.115, COL.piel),
    cap(0.06, 0.34, 0.24, 1.3, 0.14, COL.uniforme, Math.PI / 2.6), cap(0.06, 0.34, -0.14, 1.28, 0.2, COL.uniforme, Math.PI / 2.3, 0.4)];
  const tubo = new THREE.CylinderGeometry(0.045, 0.045, 1.0, 10).rotateX(Math.PI / 2).translate(0.2, 1.5, 0.08);
  const ojiva = new THREE.ConeGeometry(0.075, 0.3, 10).rotateX(Math.PI / 2).translate(0.2, 1.5, 0.72);
  const bulbo = new THREE.CylinderGeometry(0.075, 0.06, 0.18, 10).rotateX(Math.PI / 2).translate(0.2, 1.5, 0.5);
  if (lanzador) p.push(pintar(tubo, COL.tubo), pintar(ojiva, COL.ojiva), pintar(bulbo, COL.ojiva));
  return mergeGeometries(p);
}
/** Parapeto: tres hileras de sacos en arco, del lado de la vía. */
function parapeto(rnd) {
  const p = [];
  for (let f = 0; f < 3; f++) for (let k = -3; k <= 3; k++) {
    const a = k * 0.2 + (f % 2) * 0.1, g = new THREE.CapsuleGeometry(0.15, 0.36, 3, 6).rotateZ(Math.PI / 2).scale(1, 0.8, 1.1);
    g.rotateY(a).translate(Math.sin(a) * 1.3, 0.13 + f * 0.26, Math.cos(a) * 1.3 - 0.55 + (rnd() - 0.5) * 0.05); p.push(pintar(g, PALETA.saco));
  }
  return mergeGeometries(p);
}

/** emboscadas: [[s, lado, n], …] con s en metros desde `inicio`. cb: { aviso, disparo, estela, impacto, suelo, abatido } */
/** opc (nivel de dificultad): { apunta, recarga, tiros }; sin opc, los valores de arriba. */
export function crearEmboscadas(scene, P, inicio, emboscadas, cb, opc = {}) {
  const AP = opc.apunta ?? APUNTA, RE = opc.recarga ?? RECARGA, TI = opc.tiros ?? TIROS;
  const rnd = semilla(5150), mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0 });
  const gFig = figura(), lista = [], cohetes = [], W = P.def.ancho + ARCEN;
  const gCohete = mergeGeometries([new THREE.CylinderGeometry(0.035, 0.035, 0.55, 8).rotateX(Math.PI / 2), new THREE.ConeGeometry(0.06, 0.22, 8).rotateX(Math.PI / 2).translate(0, 0, 0.36)]);
  const mCohete = new THREE.MeshStandardMaterial({ color: 0x23251c, roughness: 0.6, metalness: 0.4, emissive: new THREE.Color().setRGB(1, 0.5, 0.15), emissiveIntensity: 0.25 });
  const V = new THREE.Vector3(), O = new THREE.Vector3();
  for (const [s, lado, n] of emboscadas) for (let k = 0; k < n; k++) {
    const d = P.dist[inicio] + s + (k - (n - 1) / 2) * 16; let i = inicio; while (i < P.n - 2 && P.dist[i + 1] < d) i++;
    const l = lado * (W + 15 + rnd() * 20), x = P.px[i] + P.rx[i] * l, z = P.pz[i] + P.rz[i] * l, y = P.terreno(x, z);
    const obj = new THREE.Group(); obj.position.set(x, y, z); obj.rotation.y = Math.atan2(-P.rx[i] * lado, -P.rz[i] * lado);   // de cara a la vía
    const cuerpo = new THREE.Mesh(gFig, mat); cuerpo.castShadow = true; cuerpo.receiveShadow = true; cuerpo.position.y = AGACHADO; obj.add(cuerpo);
    const muro = new THREE.Mesh(parapeto(rnd), mat); muro.castShadow = true; muro.receiveShadow = true; muro.position.z = 0.55; obj.add(muro);
    scene.add(obj);
    lista.push({ tipo: 'tirador', obj, cuerpo, x, y, z, dist: d, lado, pos: new THREE.Vector3(x, y + 0.5, z), vel: new THREE.Vector3(), radio: 0.3, mult: 1.3,
      viva: true, detectada: false, peligro: false, vida: 2, estado: 'oculto', t: 0, tiros: 0, caer: 0 });
  }

  function disparar(t, veh, oculto) {
    t.obj.updateMatrixWorld(true); t.cuerpo.localToWorld(O.set(0.2, 1.5, 0.9));
    const sp = Math.sin(veh.psi), cp = Math.cos(veh.psi), vx = veh.u * sp + veh.v * cp, vz = veh.u * cp - veh.v * sp;
    V.set(veh.x, veh.y + 1.1, veh.z); const tf = V.distanceTo(O) / VEL_COHETE;
    V.x += vx * tf; V.z += vz * tf;   // apunta adonde vas a estar si sigues igual
    const err = (0.7 + Math.hypot(vx, vz) * 0.05 + V.distanceTo(O) / 110) * (oculto ? 5 : 1), a = rnd() * 6.283;
    V.x += Math.cos(a) * err * rnd(); V.z += Math.sin(a) * err * rnd(); V.y += (rnd() - 0.5) * err * 0.5;
    const vel = V.sub(O).normalize().multiplyScalar(VEL_COHETE).clone(), m = new THREE.Mesh(gCohete, mCohete); m.position.copy(O); scene.add(m);
    cohetes.push({ pos: m.position, vel, m, t: 0 });
    cb.disparo(t, O.clone(), vel.clone().normalize());
  }

  return {
    lista, cohetes,
    total: () => lista.length,
    reiniciar() {
      for (const t of lista) { Object.assign(t, { viva: true, detectada: false, peligro: false, vida: 2, estado: 'oculto', t: 0, tiros: 0, caer: 0, radio: 0.3 }); t.cuerpo.position.y = AGACHADO; t.cuerpo.rotation.set(0, 0, 0); }
      for (const c of cohetes) scene.remove(c.m); cohetes.length = 0;
    },
    impactar(t, n) {
      if (!t.viva) return;
      t.vida -= t.estado === 'apunta' ? n : n * 0.5;   // agachado, el parapeto se lleva la mitad
      if (t.vida <= 0) { t.viva = false; t.peligro = false; t.estado = 'caido'; cb.abatido(t); }
    },
    actualizar(dt, veh, activa, oculto) {
      for (const t of lista) {
        if (!t.viva) { if (t.caer < 1) { t.caer = Math.min(1, t.caer + dt * 2.2); t.cuerpo.rotation.x = -t.caer * 1.45; t.cuerpo.position.y = Math.max(t.cuerpo.position.y - dt * 1.2, -0.15); } continue; }
        const dS = t.dist - veh.sup.dist, lejos = Math.hypot(t.x - veh.x, t.z - veh.z), enRango = activa && dS < VISTA && dS > -50 && lejos < ALCANCE;
        if (t.estado === 'oculto' && enRango) { t.estado = 'apunta'; t.t = AP + rnd() * 0.5; t.detectada = true; t.peligro = true; cb.aviso(t, lejos); }
        else if (t.estado === 'apunta') {
          if (!enRango) { t.estado = 'recarga'; t.t = 0; t.peligro = false; }
          else if (oculto) t.t = Math.max(t.t, 0.5);   // dentro del humo no te ve: sigue buscándote
          else if ((t.t -= dt) <= 0) { disparar(t, veh, oculto); t.tiros++; t.estado = t.tiros >= TI ? 'agachado' : 'recarga'; t.t = RE; t.peligro = false; }
        } else if (t.estado === 'recarga' && (t.t -= dt) <= 0 && enRango) { t.estado = 'apunta'; t.t = AP; t.peligro = true; cb.aviso(t, lejos); }
        const dePie = t.estado === 'apunta';
        t.cuerpo.position.y += ((dePie ? 0 : AGACHADO) - t.cuerpo.position.y) * Math.min(1, dt * 6);
        if (dePie) { const obj = t.obj.rotation.y, mira = Math.atan2(veh.x - t.x, veh.z - t.z); t.obj.rotation.y = obj + Math.atan2(Math.sin(mira - obj), Math.cos(mira - obj)) * Math.min(1, dt * 5); }
        t.radio = dePie ? 0.55 : 0.3; t.pos.set(t.x, t.y + t.cuerpo.position.y + 1.2, t.z);
      }
      for (let k = cohetes.length - 1; k >= 0; k--) {
        const c = cohetes[k]; c.t += dt; c.vel.y -= 1.5 * dt; c.pos.addScaledVector(c.vel, dt); c.m.lookAt(V.copy(c.pos).add(c.vel));
        cb.estela(c.pos, c.vel);
        const dV = Math.hypot(c.pos.x - veh.x, c.pos.y - veh.y - 1.1, c.pos.z - veh.z);
        let fin = null;
        if (dV < 1.9 && activa) fin = 'impacto'; else if (c.pos.y < P.terreno(c.pos.x, c.pos.z) + 0.1) fin = 'suelo'; else if (c.t > 3) fin = 'aire';
        if (fin) { scene.remove(c.m); cohetes.splice(k, 1); if (fin === 'impacto') cb.impacto(c.pos.clone()); else cb.suelo(c.pos.clone(), fin === 'aire'); }
      }
    },
  };
}
