// 19-JUE · Atalaya · Amenazas aéreas y defensa antiaérea. Enemigos: aviones de combate (llegan alto, sueltan dos misiles y
// escapan; ante un misil propio rompen y sueltan bengalas), misiles de crucero (a ras de los árboles: el radar los ve tarde)
// y los misiles que sueltan los aviones. Propios: misil de alto alcance (persigue el punto donde va a estar el blanco,
// espoleta de proximidad) y antimisil de corto alcance (cohetes que salen solos contra lo que viene). Modelos en código con
// chapa escaneada, como el blindado; sin bandos ni insignias. Licencia: MIT (código propio).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const TIPOS_AEREOS = {
  caza: { vida: 12, vel: 230, radio: 7, puntos: 400, nombre: 'Avión de combate' },
  crucero: { vida: 3, vel: 235, radio: 2.4, puntos: 220, nombre: 'Misil de crucero', dano: 45 },
  misil: { vida: 2, vel: 320, radio: 1.8, puntos: 120, nombre: 'Misil', dano: 30 },
};
export const SAM = { vel: 700, acel: 340, vida: 17, prox: 22, dano: 20, alcance: 8000, pk: 0.85 };
export const AM = { vel: 540, acel: 460, vida: 5, prox: 8, dano: 10, alcance: 1700, pk: 0.72 };
// El avión alto suelta a 4,5 km y vira; el rasante suelta a 2,2 km y pasa por encima. El radar ve al de crucero desde 4,5 km.
export const SUELTA = 4500, PASADA = 2200, VE_CRUCERO = 4500;
const amort = (a, b, k) => a + (b - a) * Math.min(1, k);

/** Geometrías: avión de ala en flecha, misil de crucero y misil corto; todas con el morro hacia +z. */
function modelos() {
  const lat = (perfil) => new THREE.LatheGeometry(perfil.map(([r, z]) => new THREE.Vector2(r, z)), 14).rotateX(Math.PI / 2);
  const plano = (pts, grueso, fn) => { const f = new THREE.Shape(); f.moveTo(pts[0][0], pts[0][1]); for (const [x, y] of pts.slice(1)) f.lineTo(x, y); const g = new THREE.ExtrudeGeometry(f, { depth: grueso, bevelEnabled: false }); fn(g); return g; };
  const caza = [lat([[0, -7.6], [0.62, -7.2], [0.95, -4.5], [1.1, -1], [1.0, 2.6], [0.7, 5.4], [0.3, 7.6], [0, 8.8]])];
  for (const s of [1, -1]) {
    caza.push(plano([[0, 2.2], [s * 5.4, -2.6], [s * 5.4, -3.5], [0, -3.4]], 0.14, (g) => { g.rotateX(Math.PI / 2); g.translate(0, -0.15, 0); }));   // ala
    caza.push(plano([[0, -4.8], [s * 2.3, -6.4], [s * 2.3, -7.2], [0, -6.9]], 0.1, (g) => { g.rotateX(Math.PI / 2); g.translate(0, 0.05, 0); }));   // estabilizador
    const toma = new THREE.BoxGeometry(0.6, 0.8, 3.2); toma.translate(s * 1.15, -0.2, 0.6); caza.push(toma);
  }
  caza.push(plano([[0, 0], [-2.6, 2.8], [-3.6, 2.8], [-3.0, 0]], 0.12, (g) => { g.rotateY(Math.PI / 2); g.translate(0, 0.6, -4.2); }));   // deriva
  const cabina = new THREE.SphereGeometry(0.56, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2); cabina.scale(1, 0.85, 2.8); cabina.translate(0, 0.62, 3.6);
  const crucero = [lat([[0, -3], [0.29, -2.9], [0.31, 2.3], [0.2, 3.1], [0, 3.45]])];
  for (const s of [1, -1]) { const g = new THREE.BoxGeometry(1.25, 0.05, 0.5); g.translate(s * 0.62, 0, 0.3); crucero.push(g); }
  for (const a of [0, 1, 2, 3]) { const g = new THREE.BoxGeometry(0.04, 0.42, 0.42); g.translate(0, 0.5, -2.7); g.rotateZ(a * Math.PI / 2 + Math.PI / 4); crucero.push(g); }
  const misil = [lat([[0, -1.9], [0.14, -1.8], [0.14, 1.4], [0.06, 1.85], [0, 1.95]])];
  for (const a of [0, 1, 2, 3]) { const g = new THREE.BoxGeometry(0.03, 0.42, 0.34); g.translate(0, 0.3, -1.5); g.rotateZ(a * Math.PI / 2); misil.push(g); const c = new THREE.BoxGeometry(0.02, 0.16, 0.2); c.translate(0, 0.2, 0.9); c.rotateZ(a * Math.PI / 2 + Math.PI / 4); misil.push(c); }
  const limpiar = (gs) => mergeGeometries(gs.map((g) => { const n = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(n.attributes)) if (!['position', 'normal', 'uv'].includes(k)) n.deleteAttribute(k); if (!n.attributes.uv) n.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(n.attributes.position.count * 2), 2)); n.computeVertexNormals(); return n; }));
  return { caza: limpiar(caza), cabina, crucero: limpiar(crucero), misil: limpiar(misil) };
}

/** cb: { estela(p, tipo, e), impacto(e, p, suelo), derribo(e, p), lanza(e), estalla(p, clase, fallo), bengalas(e) } · suelo(x, z). */
export function crearAereo(scene, chapa, cb, suelo) {
  const M = modelos();
  const pintura = (r, g, b, met = 0.4) => new THREE.MeshStandardMaterial({ map: chapa.map, normalMap: chapa.normalMap, roughnessMap: chapa.armMap, color: new THREE.Color().setRGB(r, g, b), roughness: 1, metalness: met });
  const mCaza = pintura(0.4, 0.43, 0.46, 0.5), mMisil = pintura(0.62, 0.62, 0.58, 0.3), mPropio = pintura(0.33, 0.37, 0.25, 0.3);
  const mVidrio = new THREE.MeshStandardMaterial({ color: 0x0b1014, roughness: 0.04, metalness: 0.8, envMapIntensity: 1.6 });
  const mFuego = new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(9, 4, 1.2) }), gFuego = new THREE.SphereGeometry(1, 10, 6);
  const lista = [], propios = [], senuelos = [], V = new THREE.Vector3(), W = new THREE.Vector3(), Z = new THREE.Vector3(0, 0, 1); let sig = 1;

  function cuerpo(tipo) {
    const g = new THREE.Group(), llama = new THREE.Mesh(gFuego, mFuego);
    if (tipo === 'caza') { g.add(new THREE.Mesh(M.caza, mCaza), new THREE.Mesh(M.cabina, mVidrio)); llama.scale.set(0.62, 0.62, 2.2); llama.position.z = -8.6; }
    else { g.add(new THREE.Mesh(tipo === 'crucero' ? M.crucero : M.misil, tipo === 'propio' ? mPropio : mMisil)); llama.scale.set(0.22, 0.22, tipo === 'crucero' ? 0.5 : 0.9); llama.position.z = tipo === 'crucero' ? -3.2 : -2.2; }
    g.add(llama); g.traverse((o) => { if (o.isMesh && o !== llama) o.castShadow = true; }); scene.add(g); return g;
  }
  const quitar = (arr, e) => { scene.remove(e.obj); const k = arr.indexOf(e); if (k >= 0) arr.splice(k, 1); };
  function orientar(e, alabeo = 0) { if (e.vel.lengthSq() > 1) { e.obj.quaternion.setFromUnitVectors(Z, W.copy(e.vel).normalize()); if (alabeo) e.obj.rotateZ(alabeo); } }
  const soltar = (p) => { const b = p.blanco; if (b && !b.senuelo && b[p.clase] > 0) b[p.clase]--; };

  const api = {
    lista, propios, TIPOS: TIPOS_AEREOS,
    reiniciar() { for (const e of [...lista]) quitar(lista, e); for (const e of [...propios]) quitar(propios, e); senuelos.length = 0; },
    /** Aparece a `d` m del centro en la dirección `a` (rad), a `alto` m sobre el suelo, rumbo al centro. */
    nacer(tipo, centro, a, d, alto) {
      const def = TIPOS_AEREOS[tipo], obj = cuerpo(tipo);
      const x = centro.x + Math.sin(a) * d, z = centro.z + Math.cos(a) * d, pos = obj.position.set(x, suelo(x, z) + alto, z);
      const e = { id: sig++, tipo, def, obj, pos, vel: new THREE.Vector3(-Math.sin(a), 0, -Math.cos(a)).multiplyScalar(def.vel), vida: def.vida, viva: true,
        detectada: tipo !== 'crucero', visto: -1, peligro: tipo !== 'caza', radio: def.radio, estado: 'aproxima', t: 0, armas: tipo === 'caza' ? 2 : 0,
        bengalas: 2, rompe: 0, alabeo: 0, giro: 1, alto, sam: 0, am: 0, rasante: tipo === 'caza' && alto < 400 };
      orientar(e); lista.push(e); return e;
    },
    /** Daño (bala 1, misil 10-20). Devuelve true si lo derriba. */
    impactar(e, dano) { if (!e.viva) return false; e.vida -= dano; if (e.vida > 0) return false; e.viva = false; quitar(lista, e); cb.derribo(e, e.pos.clone()); return true; },
    /** Misil propio: 'sam' (alto alcance) o 'am' (antimisil), sale de `desde` por el eje `dir` del tubo. */
    disparar(clase, desde, dir, blanco) {
      const def = clase === 'sam' ? SAM : AM, obj = cuerpo('propio'); obj.scale.setScalar(clase === 'sam' ? 1.6 : 0.75); obj.position.copy(desde);
      const p = { clase, def, obj, pos: obj.position, vel: dir.clone().multiplyScalar(clase === 'sam' ? 55 : 90), blanco, t: 0, visto: false };
      blanco[clase]++; propios.push(p); orientar(p); return p;
    },
    actualizar(dt, objetivo) {
      for (const s of [...senuelos]) { s.t += dt; s.vel.y -= 9.8 * dt; s.vel.multiplyScalar(1 - dt * 0.6); s.pos.addScaledVector(s.vel, dt); if (s.t > 3.5) { s.viva = false; senuelos.splice(senuelos.indexOf(s), 1); } }
      for (const e of [...lista]) {
        e.t += dt; const def = e.def;
        if (e.tipo === 'caza') {
          W.set(objetivo.x - e.pos.x, 0, objetivo.z - e.pos.z); const dh = W.length();
          if (e.rompe > 0) {   // rotura: viraje cerrado con alabeo, y después vuelve a su rumbo
            e.rompe -= dt; const a = Math.atan2(e.vel.x, e.vel.z) + e.giro * dt * 0.5; e.vel.set(Math.sin(a), 0, Math.cos(a)).multiplyScalar(def.vel * 1.1); e.alabeo = amort(e.alabeo, e.giro * 1.25, dt * 4);
          } else if (e.estado === 'aproxima') {
            W.normalize().multiplyScalar(def.vel); e.vel.lerp(W, Math.min(1, dt * 0.6)); e.alabeo = amort(e.alabeo, 0, dt * 3);
            if (dh < (e.rasante ? PASADA : SUELTA) && e.armas > 0 && (e.tLanza = (e.tLanza || 0) - dt) <= 0) {
              e.armas--; e.tLanza = 1.1; const m = api.nacer('misil', e.pos, 0, 0, 0); m.pos.copy(e.pos).y -= 2.5; m.vel.copy(e.vel).setLength(TIPOS_AEREOS.misil.vel * 0.7); cb.lanza(e);
              if (e.armas <= 0) { e.estado = e.rasante ? 'pasa' : 'escapa'; e.giro = Math.random() < 0.5 ? 1 : -1; }
            }
          } else if (e.estado === 'pasa') {   // el rasante sigue de largo por encima del puesto y trepa al salir
            e.vel.y = amort(e.vel.y, 25, dt * 0.5); e.alabeo = amort(e.alabeo, 0, dt * 3);
            if (dh > 2500 && W.dot(e.vel) < 0) e.estado = 'escapa';
          } else {   // escapa: vira hasta darle la espalda al puesto y se va recto
            const actual = Math.atan2(e.vel.x, e.vel.z), dif = Math.atan2(Math.sin(Math.atan2(-W.x, -W.z) - actual), Math.cos(Math.atan2(-W.x, -W.z) - actual));
            const a = actual + Math.sign(dif) * Math.min(Math.abs(dif), dt * 0.4); e.vel.set(Math.sin(a), 0.08, Math.cos(a)).multiplyScalar(def.vel * 1.25);
            e.alabeo = amort(e.alabeo, Math.sign(dif) * Math.min(1.1, Math.abs(dif) * 2), dt * 3); if (dh > 13000) { e.viva = false; quitar(lista, e); continue; }
          }
          e.peligro = e.estado === 'aproxima' && dh < (e.rasante ? PASADA : SUELTA) + 3000;
        } else {
          V.set(objetivo.x, objetivo.y + 1, objetivo.z).sub(e.pos); const d = V.length(), dh = Math.hypot(V.x, V.z);
          if (e.tipo === 'crucero') { if (dh > 900) V.y = (suelo(e.pos.x, e.pos.z) + e.alto) - e.pos.y; if (!e.detectada && dh < VE_CRUCERO) e.detectada = true; }   // a ras de los árboles hasta el final
          e.vel.lerp(V.normalize().multiplyScalar(def.vel), Math.min(1, dt * (e.tipo === 'misil' ? 2.4 : 1.4)));
          if (d < Math.max(6, def.vel * dt * 1.5)) { e.viva = false; quitar(lista, e); cb.impacto(e, e.pos.clone(), false); continue; }
          if (e.pos.y < suelo(e.pos.x, e.pos.z) + 0.4) { e.viva = false; quitar(lista, e); cb.impacto(e, e.pos.clone(), true); continue; }
        }
        e.pos.addScaledVector(e.vel, dt); orientar(e, e.alabeo);
        cb.estela(e.pos, e.tipo, e);
      }
      for (const p of [...propios]) {
        p.t += dt; const def = p.def; let b = p.blanco;
        if (b && b.viva) {
          const d = b.pos.distanceTo(p.pos);
          // Un avión que ve venir el misil a 1,5 km rompe y suelta bengalas: si el misil muerde el señuelo, se pierde.
          if (!b.senuelo && b.tipo === 'caza' && !p.visto && d < 1500) {
            p.visto = true;
            if (b.bengalas > 0) { b.bengalas--; b.rompe = 3.5; b.giro = Math.random() < 0.5 ? 1 : -1; cb.bengalas(b);
              if (Math.random() < 0.45) { const s = { senuelo: true, viva: true, t: 0, pos: b.pos.clone(), vel: b.vel.clone().multiplyScalar(0.25) }; senuelos.push(s); soltar(p); p.blanco = b = s; } }
          }
          const tf = d / Math.max(250, p.vel.length());
          V.copy(b.pos).addScaledVector(b.vel, Math.min(tf, 6)).sub(p.pos).normalize().multiplyScalar(def.vel);
          W.subVectors(V, p.vel); const a = W.length(), max = def.acel * dt; if (a > max) W.multiplyScalar(max / a); p.vel.add(W);
          if (d < def.prox + (p.vel.length() + (b.vel ? b.vel.length() : 0)) * dt * 0.5) {
            // La espoleta no siempre alcanza: probabilidad de derribo por disparo (el antimisil, contra algo chico y rápido, falla más).
            const acierta = !b.senuelo && Math.random() < (p.clase === 'am' ? AM.pk : b.tipo === 'caza' ? 0.9 : SAM.pk);
            if (acierta) api.impactar(b, def.dano); cb.estalla(p.pos.clone(), p.clase, !acierta); soltar(p); quitar(propios, p); continue;
          }
        } else if (p.t > 0.4) p.vel.y -= 9.8 * dt;
        p.pos.addScaledVector(p.vel, dt); orientar(p); cb.estela(p.pos, p.clase, p);
        if (p.t > def.vida || p.pos.y < suelo(p.pos.x, p.pos.z)) { cb.estalla(p.pos.clone(), p.clase, true); soltar(p); quitar(propios, p); }
      }
    },
  };
  return api;
}

/**
 * Lanzador sobre pedestal giratorio (tubos en filas) y, si `radar`, una antena plana que gira en su mástil. Chapa escaneada
 * y una barrera de sacos (hesco) en U alrededor. opc: { tubos: [columnas, filas], largo, radio, radar }.
 */
export function crearBateria(scene, chapa, hesco, pos, giro, opc) {
  const { tubos: [nc, nf], largo, radio, radar = false } = opc;
  const m = new THREE.MeshStandardMaterial({ map: chapa.map, normalMap: chapa.normalMap, roughnessMap: chapa.armMap, color: new THREE.Color().setRGB(0.5, 0.55, 0.38), roughness: 1, metalness: 0.35 });
  const negro = new THREE.MeshStandardMaterial({ color: 0x0d0f0c, roughness: 0.6 });
  const base = new THREE.Group(); base.position.copy(pos); base.rotation.y = giro; scene.add(base);
  const caja = (w, h, d, x, y, z, padre = base, mat = m) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; padre.add(o); return o; };
  // Remolque: chasis, gatos de apoyo, ruedas y pedestal.
  caja(2.6, 0.45, 5.4, 0, 0.75, 0); for (const [x, z] of [[-1.5, -2.2], [1.5, -2.2], [-1.5, 2.2], [1.5, 2.2]]) caja(0.25, 0.9, 0.25, x, 0.45, z);
  for (const x of [-1.25, 1.25]) for (const z of [-0.9, 0.9]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.32, 16).rotateZ(Math.PI / 2), negro); r.position.set(x, 0.48, z); r.castShadow = true; base.add(r); }
  const torre = new THREE.Group(); torre.position.set(0, 1.0, -0.2); base.add(torre);
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.9, 0.7, 20), m); ped.position.y = 0.35; ped.castShadow = true; torre.add(ped);
  const lanzador = new THREE.Group(); lanzador.position.set(0, 1.25, 0); torre.add(lanzador);
  const paso = radio * 2.25, ancho = nc * paso, alto = nf * paso;
  for (let c = 0; c < nc; c++) for (let f = 0; f < nf; f++) {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(radio, radio, largo, 14, 1, true).rotateX(Math.PI / 2), m); t.position.set((c - (nc - 1) / 2) * paso, (f - (nf - 1) / 2) * paso, largo * 0.18); t.castShadow = true; lanzador.add(t);
    const tapa = new THREE.Mesh(new THREE.CircleGeometry(radio * 0.92, 14), negro); tapa.position.set(t.position.x, t.position.y, t.position.z + largo / 2 + 0.01); lanzador.add(tapa);
  }
  caja(ancho + 0.2, 0.12, largo * 0.9, 0, alto / 2 + 0.08, largo * 0.18, lanzador); caja(ancho + 0.2, 0.12, largo * 0.9, 0, -alto / 2 - 0.08, largo * 0.18, lanzador);
  for (const s of [-1, 1]) caja(0.25, 0.6, 0.5, s * (ancho / 2 + 0.25), 0, 0, lanzador);
  let antena = null, sensor = null;
  if (radar) {
    const mastil = new THREE.Group(); mastil.position.set(0, 1.0, 2.0); base.add(mastil); caja(0.35, 2.8, 0.35, 0, 1.4, 0, mastil);
    antena = new THREE.Group(); antena.position.y = 2.9; mastil.add(antena);
    const panel = caja(2.8, 1.7, 0.2, 0, 0.55, 0, antena); panel.rotation.x = -0.32;
    for (let k = -3; k <= 3; k++) caja(0.04, 1.5, 0.03, k * 0.37, 0.55, 0.12, antena, negro).rotation.x = -0.32;
    // Mástil telescópico de 30 m con la cámara electroóptica arriba: por encima de los árboles, que tapan lo que vuela bajo.
    const tele = new THREE.Group(); tele.position.set(2.6, 0, -2.2); base.add(tele); let y = 0;
    for (const [r, h] of [[0.22, 10.5], [0.17, 10.5], [0.12, 10]]) { const s = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 12), m); s.position.y = y + h / 2; s.castShadow = true; tele.add(s); y += h - 0.5; }
    sensor = new THREE.Mesh(new THREE.SphereGeometry(0.42, 18, 12), m); sensor.position.y = y + 0.4; tele.add(sensor);
    const lente = new THREE.Mesh(new THREE.CircleGeometry(0.2, 16), new THREE.MeshStandardMaterial({ color: 0x0a0e12, roughness: 0.05, metalness: 0.9 })); lente.position.set(0, 0.05, 0.41); sensor.add(lente);
    const tens = []; for (const a of [0.6, 2.7, 4.8]) tens.push(0, y * 0.72, 0, Math.sin(a) * 9, 0.1, Math.cos(a) * 9);   // vientos de cable
    const gT = new THREE.BufferGeometry(); gT.setAttribute('position', new THREE.Float32BufferAttribute(tens, 3)); tele.add(new THREE.LineSegments(gT, new THREE.LineBasicMaterial({ color: 0x2a2d28 })));
  }
  // Barrera de sacos en U, abierta hacia atrás (por ahí entra la recarga).
  if (hesco) for (const [w, d, x, z] of [[ancho + 4.6, 1.1, 0, 3.7], [1.1, 7.0, -(ancho / 2 + 2.3), 0.2], [1.1, 7.0, ancho / 2 + 2.3, 0.2]]) caja(w, 1.4, d, x, 0.7, z, base, hesco);
  const tmp = new THREE.Vector3(), eje = new THREE.Vector3(); let siguiente = 0;
  return {
    base, torre, lanzador, antena, sensor,
    /** Boca del próximo tubo (va rotando) y eje del lanzador, en el mundo. */
    boca(o, d) {
      lanzador.updateWorldMatrix(true, false); const c = siguiente % nc, f = Math.floor(siguiente / nc) % nf; siguiente++;
      lanzador.localToWorld(o.set((c - (nc - 1) / 2) * paso, (f - (nf - 1) / 2) * paso, largo * 0.7));
      lanzador.localToWorld(d.set(0, 0, 10)).sub(lanzador.localToWorld(eje.set(0, 0, 0))).normalize(); return o;
    },
    /** Gira el pedestal y alza los tubos hacia p (mínimo 20°: un misil no sale rasante). */
    apuntar(dt, p) {
      torre.updateWorldMatrix(true, false); const l = torre.worldToLocal(tmp.copy(p));
      torre.rotation.y += Math.atan2(l.x, l.z) * Math.min(1, dt * 2.2);
      const el = Math.max(0.35, Math.min(1.3, Math.atan2(l.y, Math.hypot(l.x, l.z)) + 0.15)); lanzador.rotation.x += (-el - lanzador.rotation.x) * Math.min(1, dt * 2.2);
    },
    girar(dt) { if (antena) antena.rotation.y += dt * 2.5; },
  };
}
