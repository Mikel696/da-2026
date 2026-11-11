// 19-JUE · Corredor · Torreta. Ametralladora en el techo de la camioneta. La cámara apunta y el arma la sigue con su
// propia velocidad de giro, así que en pantalla hay dos marcas: dónde miras y dónde apunta de verdad el cañón.
// Las balas son proyectiles con trazadora (650 m/s, caen con la gravedad) y el cañón se calienta: si te pasas,
// se traba hasta enfriarse. Licencia: MIT (código propio).
import * as THREE from 'three';
import { clamp } from './lc-util.js';

export const VEL_BALA = 650;
const CADENCIA = 9, DISPERSION = 0.005, GIRO = 2.6, ELEVA = 1.8, CALOR_TIRO = 0.055, ENFRIA = 0.32;
const angulo = (a) => Math.atan2(Math.sin(a), Math.cos(a));

/** ¿El tramo recorrido por una bala en este cuadro (p0 → p1) pasa a menos de r del centro c? */
function tocaEsfera(p0, p1, c, r, tmp) {
  tmp.subVectors(p1, p0); const l2 = tmp.lengthSq() || 1e-9;
  const t = clamp(((c.x - p0.x) * tmp.x + (c.y - p0.y) * tmp.y + (c.z - p0.z) * tmp.z) / l2, 0, 1);
  const x = p0.x + tmp.x * t - c.x, y = p0.y + tmp.y * t - c.y, z = p0.z + tmp.z * t - c.z;
  return x * x + y * y + z * z < r * r;
}

export class Torreta {
  constructor(scene, camion, P) {
    Object.assign(this, { c: camion, P, balas: [], calor: 0, trabada: false, espera: 0, retroceso: 0, yaw: 0, pitch: 0 });
    const g = new THREE.BoxGeometry(0.05, 0.05, 1); g.translate(0, 0, -0.5);   // la estela queda detrás de la punta
    this.trazas = new THREE.InstancedMesh(g, new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(7, 3.4, 0.9), transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }), 40);
    this.trazas.frustumCulled = false; this.trazas.count = 0; scene.add(this.trazas);
    this.fogonazo = new THREE.PointLight(new THREE.Color().setRGB(1, 0.72, 0.4), 0, 16, 2); this.fogonazo.position.set(0, 0.02, 1.35); camion.arma.add(this.fogonazo);
    this.v = [0, 1, 2, 3].map(() => new THREE.Vector3()); this.q = new THREE.Quaternion(); this.m = new THREE.Matrix4(); this.Z = new THREE.Vector3(0, 0, 1);
  }
  reiniciar() { this.balas.length = 0; this.calor = 0; this.trabada = false; this.yaw = this.pitch = this.retroceso = 0; this.trazas.count = 0; this.aplicar(); }
  aplicar() { this.c.torreta.rotation.y = this.yaw; this.c.arma.rotation.x = -this.pitch; this.c.arma.position.z = 0.12 - this.retroceso; }

  /** Gira hacia un punto del mundo con su velocidad máxima de giro. Necesita las matrices del camión al día. */
  apuntar(dt, p) {
    const [o, d] = this.v;
    this.c.arma.getWorldPosition(o); d.subVectors(p, o);
    this.c.cuerpo.getWorldQuaternion(this.q).invert(); d.applyQuaternion(this.q);
    const yaw = Math.atan2(d.x, d.z), pitch = clamp(Math.atan2(d.y, Math.hypot(d.x, d.z)), -0.2, 1.2);
    this.yaw = angulo(this.yaw + clamp(angulo(yaw - this.yaw), -GIRO * dt, GIRO * dt));
    this.pitch += clamp(pitch - this.pitch, -ELEVA * dt, ELEVA * dt);
    this.aplicar();
  }
  /** Boca del cañón (o) y dirección real del arma (d), en el mundo. */
  boca(o, d) {
    this.c.arma.updateWorldMatrix(true, false);
    this.c.arma.localToWorld(o.set(0, 0.012, 1.3)); this.c.arma.localToWorld(d.set(0, 0.012, 2.3)).sub(o).normalize();
  }
  /** Dispara si puede. Devuelve { boca, dir } del disparo, o null. */
  gatillo(dt, apretado) {
    this.espera -= dt; this.calor = Math.max(0, this.calor - dt * ENFRIA);
    if (this.trabada && this.calor < 0.35) this.trabada = false;
    if (!apretado || this.trabada || this.espera > 0) return null;
    this.espera = 1 / CADENCIA; this.calor += CALOR_TIRO;
    if (this.calor >= 1) { this.calor = 1; this.trabada = true; }
    const o = new THREE.Vector3(), d = new THREE.Vector3(); this.boca(o, d);
    const desvio = this.v[2].set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(DISPERSION * 2);
    this.balas.push({ p: o.clone(), v: d.clone().add(desvio).normalize().multiplyScalar(VEL_BALA), vida: 0.5, largo: 0 });
    this.retroceso = 0.05; this.fogonazo.intensity = 90;
    return { boca: o, dir: d };
  }
  /** Mueve las balas: contra los drones (tramo contra esfera) y contra el suelo. */
  actualizar(dt, drones, alDron, alSuelo) {
    this.retroceso = Math.max(0, this.retroceso - dt * 0.7); this.fogonazo.intensity *= Math.exp(-dt * 70); this.aplicar();
    const [a, , , w] = this.v; let n = 0;
    for (let i = this.balas.length - 1; i >= 0; i--) {
      const b = this.balas[i];
      a.copy(b.p); b.v.y -= 9.8 * dt; b.p.addScaledVector(b.v, dt); b.vida -= dt; b.largo += VEL_BALA * dt;
      let fin = b.vida <= 0;
      if (!fin) for (const d of drones) if (d.viva && tocaEsfera(a, b.p, d.pos, d.radio, w)) { alDron(d, b.p.clone()); fin = true; break; }
      if (!fin) { const s = this.P.terreno(b.p.x, b.p.z); if (b.p.y <= s) { b.p.y = s; alSuelo(b.p.clone()); fin = true; } }
      if (fin) { this.balas.splice(i, 1); continue; }
      this.q.setFromUnitVectors(this.Z, w.copy(b.v).normalize());
      this.trazas.setMatrixAt(n++, this.m.compose(b.p, this.q, w.set(1, 1, Math.min(9, b.largo))));
    }
    this.trazas.count = n; this.trazas.instanceMatrix.needsUpdate = true;
  }
}
