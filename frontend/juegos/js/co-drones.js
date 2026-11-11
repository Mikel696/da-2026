// 19-JUE · Corredor · Drones. Tres tipos, cada uno con su forma de atacar:
//  · suicida (FPV con carga hueca): se acerca alto y, a unos 65 m, se lanza en picada contra la camioneta.
//  · bombardero (hexacóptero de carga): busca el punto de la vía por donde vas a pasar y suelta granadas.
//  · reconocimiento (cuadricóptero con cámara): da vueltas alto; si lo dejas vivo, llama a dos suicidas.
// Se arman en código (no hay modelos realistas con licencia libre): las piezas de cada dron se funden en una sola
// malla. Las oleadas son datos: [metros desde la salida, tipo, cuántos]. Ficticios: ningún modelo ni bando real.
// Licencia: MIT (código propio).
import * as THREE from 'three';
import { fusionar, pintar, clamp, semilla } from './lc-util.js';

export const OLEADAS = {
  2: [[60, 'reconocimiento', 1], [150, 'suicida', 1], [240, 'suicida', 2], [330, 'bombardero', 1], [430, 'suicida', 1], [450, 'bombardero', 1], [530, 'suicida', 2], [600, 'bombardero', 1]],
  3: [[130, 'suicida', 1], [300, 'bombardero', 1], [470, 'suicida', 2]],
};
export const NOMBRES = { suicida: 'Suicida', bombardero: 'Bombardero', reconocimiento: 'Reconocimiento' };
const TIPOS = {
  suicida: { vida: 2, radio: 0.65, vel: 24, picada: 40, alto: [26, 38], mult: 1.8, escala: 1.4 },
  bombardero: { vida: 6, radio: 1.05, vel: 15, alto: [34, 44], mult: 1.8, escala: 1, bombas: 2 },
  reconocimiento: { vida: 3, radio: 0.75, vel: 18, alto: [62, 74], mult: 2.2, escala: 1.25 },
};
const angulo = (a) => Math.atan2(Math.sin(a), Math.cos(a));

// ───────────── Modelos ─────────────
const COL = { carbono: [0.025, 0.027, 0.03], gris: [0.11, 0.115, 0.12], oliva: [0.12, 0.14, 0.07], metal: [0.32, 0.32, 0.33], bateria: [0.14, 0.13, 0.03], helice: [0.05, 0.05, 0.05] };
const col = (k) => new THREE.Color().setRGB(...COL[k]);
function caja(w, h, l, x, y, z, c) { const g = new THREE.BoxGeometry(w, h, l); g.translate(x, y, z); return pintar(g, col(c)); }
function cil(r1, r2, h, x, y, z, c, eje = 'y', seg = 12) {
  const g = new THREE.CylinderGeometry(r1, r2, h, seg);
  if (eje === 'x') g.rotateZ(Math.PI / 2); else if (eje === 'z') g.rotateX(Math.PI / 2);
  g.translate(x, y, z); return pintar(g, col(c));
}
/** Brazos, motores y el disco borroso que dibuja cada hélice girando. */
function brazos(n, largo, grueso, motor, alto = 0) {
  const p = [], h = [];
  for (let k = 0; k < n; k++) {
    const a = (k + 0.5) / n * Math.PI * 2, x = Math.sin(a) * largo, z = Math.cos(a) * largo;
    const g = new THREE.BoxGeometry(grueso, grueso * 0.7, largo); g.translate(0, alto, largo / 2); g.rotateY(a); p.push(pintar(g, col('carbono')));
    p.push(cil(motor, motor * 0.9, motor * 1.3, x, alto + motor * 0.65, z, 'metal'));
    const d = new THREE.CircleGeometry(motor * 3.9, 24); d.rotateX(-Math.PI / 2); d.translate(x, alto + motor * 1.4, z); h.push(pintar(d, col('helice')));
  }
  return { p, h };
}
function modelos() {
  const fpv = brazos(4, 0.16, 0.022, 0.02);
  fpv.p.push(caja(0.07, 0.04, 0.19, 0, 0, 0, 'carbono'), caja(0.05, 0.032, 0.1, 0, 0.036, -0.01, 'bateria'), caja(0.028, 0.026, 0.02, 0, 0.012, 0.1, 'carbono'),
    cil(0.032, 0.032, 0.22, 0, -0.04, 0.06, 'oliva', 'z'), cil(0, 0.032, 0.09, 0, -0.04, 0.215, 'oliva', 'z'), cil(0.004, 0.004, 0.1, 0, 0.06, -0.1, 'metal'));
  const hex = brazos(6, 0.62, 0.04, 0.045, 0.02);
  hex.p.push(cil(0.17, 0.2, 0.12, 0, 0, 0, 'gris', 'y', 18), cil(0.07, 0.15, 0.08, 0, 0.09, 0, 'gris', 'y', 18), caja(0.24, 0.04, 0.1, 0, -0.09, 0, 'carbono'));
  for (const sx of [-1, 1]) { hex.p.push(caja(0.022, 0.025, 0.62, sx * 0.2, -0.32, 0, 'carbono')); for (const sz of [-1, 1]) hex.p.push(caja(0.02, 0.24, 0.02, sx * 0.2, -0.2, sz * 0.16, 'carbono')); }
  const rec = brazos(4, 0.3, 0.03, 0.032);
  const bola = new THREE.SphereGeometry(0.05, 12, 8); bola.translate(0, -0.07, 0.08);
  rec.p.push(caja(0.13, 0.07, 0.27, 0, 0, 0, 'gris'), caja(0.09, 0.03, 0.12, 0, 0.05, -0.03, 'bateria'), pintar(bola, col('carbono')));
  for (const sx of [-1, 1]) { rec.p.push(caja(0.015, 0.015, 0.3, sx * 0.09, -0.13, 0, 'carbono'), caja(0.012, 0.1, 0.012, sx * 0.09, -0.08, 0.08, 'carbono'), caja(0.012, 0.1, 0.012, sx * 0.09, -0.08, -0.08, 'carbono')); }
  const bomba = fusionar([cil(0.032, 0.032, 0.15, 0, 0, 0, 'oliva'), cil(0.032, 0, 0.06, 0, -0.105, 0, 'oliva'), caja(0.09, 0.05, 0.006, 0, 0.09, 0, 'oliva'), caja(0.006, 0.05, 0.09, 0, 0.09, 0, 'oliva')]);
  const junta = (m) => ({ cuerpo: fusionar(m.p), helices: fusionar(m.h) });
  return { suicida: junta(fpv), bombardero: junta(hex), reconocimiento: junta(rec), bomba };
}

/**
 * cb: { aviso(d, que), impacto(d, p), choque(d, p, k), derribo(d, p, estalla), bomba(p), humo(p) }
 * Los drones son contactos del radar: { x, z, viva, detectada, mult, peligro }.
 */
export function crearDrones(scene, P, inicio, oleadas, cb) {
  const MOD = modelos(), rnd = semilla(4242), lista = [], bombas = [];
  const mCuerpo = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.3 });
  const mHelice = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide });
  const mLed = new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(6, 0.25, 0.15) }), gLed = new THREE.SphereGeometry(0.018, 6, 4);
  const V = new THREE.Vector3(), W = new THREE.Vector3(), tp = new THREE.Vector3(), vt = new THREE.Vector3();
  let sig = 0, total = 0;
  const suelo = (x, z) => P.terreno(x, z);

  function nuevo(tipo, x, y, z) {
    const def = TIPOS[tipo], m = MOD[tipo], obj = new THREE.Group();
    const cuerpo = new THREE.Mesh(m.cuerpo, mCuerpo); cuerpo.castShadow = true; obj.add(cuerpo);
    obj.add(new THREE.Mesh(m.helices, mHelice));
    const led = new THREE.Mesh(gLed, mLed); led.position.set(0, 0.03, -0.1); obj.add(led);
    const rack = [];
    if (tipo === 'bombardero') for (const sx of [-1, 1]) { const b = new THREE.Mesh(MOD.bomba, mCuerpo); b.position.set(sx * 0.08, -0.2, 0); obj.add(b); rack.push(b); }
    obj.scale.setScalar(def.escala); obj.position.set(x, y, z); scene.add(obj);
    const d = { tipo, def, obj, led, rack, pos: obj.position, vel: new THREE.Vector3(), vida: def.vida, viva: true, detectada: false, peligro: false,
      estado: tipo === 'reconocimiento' ? 'orbitar' : 'acercarse', t: 0, marca: 0, bombas: def.bombas || 0, radio: def.radio * def.escala, mult: def.mult,
      rumbo: 0, ang: rnd() * 6.283, lado: rnd() < 0.5 ? -1 : 1, x, z };
    lista.push(d); total++;
    return d;
  }
  function quitar(d) { scene.remove(d.obj); const k = lista.indexOf(d); if (k >= 0) lista.splice(k, 1); }

  /** Aparece por delante (o por detrás) en la vía, apartado a un lado y alto. */
  function nacer(tipo, veh, k, n, detras = false) {
    const def = TIPOS[tipo], dObj = veh.sup.dist + (detras ? -(110 + rnd() * 40) : 150 + rnd() * 60 + k * 18);
    let i = 0; while (i < P.n - 1 && P.dist[i] < dObj) i++;
    const extra = Math.max(0, dObj - P.dist[i]);
    const lado = n > 1 ? (k % 2 ? 1 : -1) : (rnd() < 0.5 ? -1 : 1), l = lado * (30 + rnd() * 45);
    const x = P.px[i] + P.tx[i] * extra + P.rx[i] * l, z = P.pz[i] + P.tz[i] * extra + P.rz[i] * l;
    return nuevo(tipo, x, suelo(x, z) + def.alto[0] + rnd() * (def.alto[1] - def.alto[0]), z);
  }

  /** Vuela hacia un punto con velocidad y aceleración máximas; frena al llegar si `frena`. */
  function volar(d, x, y, z, vmax, acc, dt, frena = true) {
    W.set(x - d.pos.x, y - d.pos.y, z - d.pos.z); const l = W.length() || 1;
    W.multiplyScalar(vmax * (frena ? Math.min(1, l / 14) : 1) / l).sub(d.vel);
    const dv = W.length(), max = acc * dt; if (dv > max) W.multiplyScalar(max / dv);
    d.vel.add(W); d.pos.addScaledVector(d.vel, dt);
  }
  function orientar(d, dt) {
    if (d.tipo === 'suicida' && d.estado === 'picada') { d.obj.lookAt(V.copy(d.pos).add(d.vel)); return; }
    const vh = Math.hypot(d.vel.x, d.vel.z);
    if (vh > 0.5) d.rumbo += angulo(Math.atan2(d.vel.x, d.vel.z) - d.rumbo) * (1 - Math.exp(-3 * dt));
    d.obj.rotation.set(clamp(vh / d.def.vel * 0.32, 0, 0.38), d.rumbo, Math.sin(d.t * 1.7) * 0.03, 'YXZ');
  }
  function soltar(d) {
    const obj = new THREE.Mesh(MOD.bomba, mCuerpo); obj.castShadow = true;
    obj.position.copy(d.pos).y -= 0.3; scene.add(obj);
    bombas.push({ obj, vel: d.vel.clone() }); d.bombas--;
    const r = d.rack.find((b) => b.visible); if (r) r.visible = false;
  }

  return {
    lista, bombas, total: () => total,
    reiniciar() { for (const d of [...lista]) quitar(d); for (const b of bombas) scene.remove(b.obj); bombas.length = 0; sig = 0; total = 0; },
    /** Bala que acierta: true si lo derriba. */
    impactar(d, dano) {
      if (!d.viva) return false;
      d.vida -= dano; if (d.vida > 0) return false;
      d.viva = false; d.peligro = false;
      if (d.tipo === 'suicida') { quitar(d); cb.derribo(d, d.pos.clone(), true); }   // la carga estalla en el aire
      else { d.vel.y = Math.min(d.vel.y, 0); cb.derribo(d, d.pos.clone(), false); }
      return true;
    },
    actualizar(dt, veh, activa, t) {
      if (activa) {
        const recorrido = veh.sup.dist - P.dist[inicio];
        while (sig < oleadas.length && recorrido >= oleadas[sig][0]) { const [, tipo, n] = oleadas[sig++]; for (let k = 0; k < n; k++) nacer(tipo, veh, k, n); }
      }
      const sp = Math.sin(veh.psi), cp = Math.cos(veh.psi);
      tp.set(veh.x, veh.y + 1.1, veh.z); vt.set(veh.u * sp + veh.v * cp, 0, veh.u * cp - veh.v * sp);
      for (const d of [...lista]) {
        d.t += dt;
        if (!d.viva) {   // derribado: cae girando y dejando humo
          d.vel.y -= 9.8 * dt; d.pos.addScaledVector(d.vel, dt); d.obj.rotation.x += dt * 3; d.obj.rotation.z += dt * 5;
          if (Math.random() < 0.5) cb.humo(d.pos);
          if (d.pos.y <= suelo(d.pos.x, d.pos.z)) { quitar(d); cb.choque(d, d.pos.clone(), 0.3); }
          continue;
        }
        if (!activa && d.estado !== 'huir') { d.estado = 'huir'; d.peligro = false; }
        const dx = tp.x - d.pos.x, dz = tp.z - d.pos.z, dh = Math.hypot(dx, dz), dist = d.pos.distanceTo(tp);
        if (d.estado === 'huir') {
          volar(d, d.pos.x - dx / (dh || 1) * 60, d.pos.y + 6, d.pos.z - dz / (dh || 1) * 60, d.def.vel, 10, dt);
          if (dist > 300) { quitar(d); continue; }
        } else if (d.tipo === 'suicida') {
          if (d.estado === 'acercarse') {
            volar(d, tp.x + sp * 30, suelo(tp.x, tp.z) + d.def.alto[0], tp.z + cp * 30, d.def.vel, 14, dt);
            if (dh < 65) { d.estado = 'picada'; d.t = 0; d.peligro = true; cb.aviso(d, 'picada'); }
          } else {
            const tt = dist / d.def.picada;
            volar(d, tp.x + vt.x * tt, tp.y, tp.z + vt.z * tt, d.def.picada, 55, dt, false);
            if (dist < 2.6) { quitar(d); cb.impacto(d, d.pos.clone()); continue; }
            if (d.pos.y < suelo(d.pos.x, d.pos.z) + 0.3 || d.t > 9) { quitar(d); cb.choque(d, d.pos.clone(), 0.6); continue; }
          }
        } else if (d.tipo === 'bombardero') {
          const h = Math.max(5, d.pos.y - suelo(d.pos.x, d.pos.z)), tc = Math.sqrt(2 * h / 9.8);
          const px = tp.x + vt.x * tc, pz = tp.z + vt.z * tc;
          if (d.estado === 'acercarse') {
            volar(d, px, suelo(px, pz) + d.def.alto[0], pz, d.def.vel, 8, dt);
            const cae = Math.hypot(d.pos.x + d.vel.x * tc - px, d.pos.z + d.vel.z * tc - pz);   // dónde caería la granada ahora
            d.peligro = cae < 25;
            if (d.bombas > 0 && cae < 4) { soltar(d); d.estado = 'retirarse'; d.t = 0; cb.aviso(d, 'bomba'); }
            if (d.t > 30) d.estado = 'huir';
          } else if (d.estado === 'retirarse') {
            d.peligro = false;
            volar(d, d.pos.x + cp * 40 * d.lado, d.pos.y + 3, d.pos.z - sp * 40 * d.lado, d.def.vel, 8, dt);
            if (d.t > 5) { d.estado = d.bombas > 0 ? 'acercarse' : 'huir'; d.t = 0; }
          }
        } else if (d.tipo === 'reconocimiento') {
          d.ang += dt * 0.28;
          volar(d, tp.x + Math.cos(d.ang) * 55, suelo(tp.x, tp.z) + d.def.alto[0], tp.z + Math.sin(d.ang) * 55, d.def.vel, 6, dt);
          if (d.detectada) d.marca += dt;
          if (d.marca > 14) { cb.aviso(d, 'llamada'); for (let k = 0; k < 2; k++) nacer('suicida', veh, k, 2, true); d.estado = 'huir'; }
        }
        orientar(d, dt);
        d.led.visible = ((t * 2 + d.ang) % 1) < 0.15;
        d.x = d.pos.x; d.z = d.pos.z;
      }
      for (let i = bombas.length - 1; i >= 0; i--) {
        const b = bombas[i]; b.vel.y -= 9.8 * dt; b.obj.position.addScaledVector(b.vel, dt);
        if (b.obj.position.y <= suelo(b.obj.position.x, b.obj.position.z)) { scene.remove(b.obj); bombas.splice(i, 1); cb.bomba(b.obj.position.clone()); }
      }
    },
  };
}
