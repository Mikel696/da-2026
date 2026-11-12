// 19-JUE · Corredor · La guerra de ahora, sin bandos ni insignias: erizos antitanque, dientes de dragón, trincheras con
// sacos, vehículos quemados, cráteres y túneles de red antidrones sobre la vía. Formas en código; superficies escaneadas
// de Poly Haven (CC0): acero oxidado, hormigón, barro, tierra quemada y tela. Todo son datos (GUERRA_*): un solo código
// los vuelve mundo. La red sí juega: los FPV y las granadas se quedan en ella. Licencia: MIT (código propio).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { semilla, cinta } from './lc-util.js';
import { ARCEN } from './co-via.js';

/**
 * s = metros desde la salida; lado = -1 izquierda, 1 derecha; l = metros desde el centro de la vía.
 * erizos [s, lado, cuántos, l0] · dientes [s, lado, largo] · trincheras [s, lado, largo, l] · restos [s, lado, giro]
 * crateres [s, l, radio] · redes [s0, s1] (túnel sobre la vía).
 */
export const GUERRA_RUTA = {
  erizos: [[40, 1, 4, 10], [40, -1, 4, 10], [700, 1, 6, 9], [700, -1, 6, 9], [1455, 1, 5, 9], [1455, -1, 5, 9], [1900, 1, 3, 13],
    [2290, 1, 6, 9], [2290, -1, 6, 9], [3500, 1, 4, 10], [3500, -1, 4, 10], [4620, 1, 5, 9], [4620, -1, 5, 9], [5850, -1, 4, 10]],
  dientes: [[85, -1, 60], [85, 1, 55], [1425, -1, 70], [1425, 1, 50], [1875, 1, 40], [2320, -1, 80], [2320, 1, 80], [2700, 1, 60], [3050, -1, 50],
    [4650, -1, 60], [4650, 1, 60], [5300, 1, 45]],
  trincheras: [[290, -1, 70, 36], [1000, 1, 90, 30], [1630, -1, 60, 32], [1990, 1, 50, 28], [2400, -1, 120, 34], [2650, 1, 100, 30], [3150, -1, 80, 40],
    [4700, 1, 90, 32], [5550, -1, 70, 30]],
  restos: [[210, 1, 0.4], [560, -1, -0.8], [1150, 1, 2.6], [1720, -1, 0.9], [2120, 1, -0.3], [2480, -1, 0.3], [2860, 1, -2.8], [3300, -1, 1.2],
    [3900, 1, 0.5], [4400, -1, -0.6], [5100, 1, 2.2], [5700, -1, 0.2]],
  crateres: [[150, 4.3, 1.5], [420, -4.4, 1.4], [480, 18, 3], [640, -25, 4], [870, 12, 2.5], [980, -4.2, 1.6], [1120, 30, 3.5], [1262, 4.4, 1.5],
    [1550, -16, 3], [1600, -1.5, 1.2], [1820, 22, 3], [2050, 4.3, 1.5], [330, 40, 3.2], [1330, -34, 4], [2350, 4.4, 1.5], [2520, -20, 3.5],
    [2780, 26, 3], [3020, -4.3, 1.4], [3380, 15, 2.8], [3720, -4.4, 1.5], [4060, 30, 4], [4500, -18, 3], [4760, 4.3, 1.5], [5000, -28, 3.5],
    [5260, 20, 3], [5640, -4.2, 1.6]],
  redes: [[880, 1060], [1290, 1400], [1975, 2085], [2480, 2700], [3080, 3260], [5480, 5640]],
};
export const GUERRA_TRAMO = {
  erizos: [[30, 1, 3, 10], [30, -1, 3, 10]], dientes: [[60, -1, 45]], trincheras: [[250, 1, 60, 30]], restos: [[180, -1, 0.6], [470, 1, 2.4]],
  crateres: [[120, 4.3, 1.4], [340, -20, 3], [520, 14, 2.6]], redes: [[380, 470]],
};

const RED_ALTO = 6.8;   // altura de la red sobre la vía: por encima de la cámara de persecución
/** Caja con coordenadas de textura en metros (la textura no se estira a lo largo de una viga). */
function caja(w, h, d, m = 1) {
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / m, uv.getY(i) * dims[f][1] / m); }
  return g;
}
/** Erizo checo: tres vigas en L que se cruzan por el medio, apoyado en tres puntas. */
function erizo() {
  const L = 1.8, partes = [];
  const viga = () => { const a = caja(0.13, 0.013, L), b = caja(0.013, 0.13, L); a.translate(0, -0.06, 0); b.translate(-0.06, 0, 0); return mergeGeometries([a, b]); };
  const x = viga(); x.rotateY(Math.PI / 2); const y = viga(); y.rotateX(Math.PI / 2); const z = viga();
  partes.push(x, y, z);
  const g = mergeGeometries(partes);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 1, 1).normalize(), new THREE.Vector3(0, 1, 0)));
  g.computeBoundingBox(); g.translate(0, -g.boundingBox.min.y - 0.03, 0); g.computeVertexNormals();
  return g;
}
/** Diente de dragón: pirámide truncada de hormigón. */
function diente() { const g = new THREE.CylinderGeometry(0.26, 0.66, 0.95, 4, 1); g.rotateY(Math.PI / 4); g.translate(0, 0.45, 0); g.computeVertexNormals(); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 2.6, uv.getY(i)); return g; }
/** Saco terrero: una almohada aplastada. */
function saco() { const g = new THREE.CapsuleGeometry(0.15, 0.34, 3, 7); g.rotateZ(Math.PI / 2); g.scale(1, 0.62, 1.12); g.translate(0, 0.09, 0); return g; }

/**
 * tex: { oxido, hormigon, barro, quemado, tela } escaneadas ({map, normalMap, armMap}) · restos: grupo del vehículo a quemar
 * evitar: [{ centro, radio }] · Devuelve: { grupo, humeantes, enRed(p), tuneles, red(s) }
 */
export function crearGuerra(scene, P, inicio, datos, { tex, vehiculo, excluir = null, evitar = [] }) {
  const rnd = semilla(1945), grupo = new THREE.Group(), W = P.def.ancho, zonas = []; scene.add(grupo);
  const zona = (p, radio) => zonas.push({ centro: new THREE.Vector3(p.x, 0, p.z), radio });
  const D = Object.assign({ erizos: [], dientes: [], trincheras: [], restos: [], crateres: [], redes: [] }, datos);
  const idx = (s) => { const d = P.dist[inicio] + s; let i = inicio; while (i < P.n - 2 && P.dist[i + 1] < d) i++; return i; };
  const en = (i, l, u = 0) => new THREE.Vector3(P.px[i] + P.rx[i] * l + P.tx[i] * u, 0, P.pz[i] + P.rz[i] * l + P.tz[i] * u);
  const libre = (p, r = 2) => !evitar.some((c) => (p.x - c.centro.x) ** 2 + (p.z - c.centro.z) ** 2 < (c.radio + r) ** 2);
  const mat = (t, color, extra = {}) => new THREE.MeshStandardMaterial(Object.assign({ map: t.map, normalMap: t.normalMap, roughnessMap: t.armMap, aoMap: t.armMap, color, roughness: 1, metalness: 0 }, extra));
  const mOxido = mat(tex.oxido, new THREE.Color().setRGB(0.75, 0.68, 0.62), { metalness: 0.5 });
  const mHormigon = mat(tex.hormigon, new THREE.Color().setRGB(0.82, 0.82, 0.8));
  const mBarro = mat(tex.barro, new THREE.Color().setRGB(0.62, 0.56, 0.5));
  const mSaco = mat(tex.tela, new THREE.Color().setRGB(0.62, 0.6, 0.42));
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), S = new THREE.Vector3(1, 1, 1);
  const instancias = (geo, material, mats, sombra = true) => {
    if (!mats.length) return;
    const im = new THREE.InstancedMesh(geo, material, mats.length); mats.forEach((m, k) => im.setMatrixAt(k, m));
    im.castShadow = sombra; im.receiveShadow = true; im.computeBoundingSphere(); grupo.add(im);
  };
  const pon = (p, giro, esc = 1, hunde = 0, inclina = 0) => { p.y = P.terreno(p.x, p.z) - hunde; return new THREE.Matrix4().compose(p, Q.setFromEuler(E.set((rnd() - 0.5) * inclina, giro, (rnd() - 0.5) * inclina)), S.set(esc, esc, esc)); };

  // Erizos en fila hacia el campo y dientes de dragón en dos filas al tresbolillo: las líneas que cortan los campos.
  const mErizos = [], mDientes = [];
  for (const [s, lado, n, l0] of D.erizos) { const i = idx(s); for (let k = 0; k < n; k++) { const p = en(i, lado * (l0 + k * 2.7), (rnd() - 0.5) * 1.2); if (libre(p)) { mErizos.push(pon(p, rnd() * 6.283, 0.9 + rnd() * 0.2, 0.04, 0.12)); zona(p, 2); } } }
  for (const [s, lado, largo] of D.dientes) {
    const i = idx(s), l0 = W + ARCEN + 6.5;
    for (let f = 0; f < 2; f++) for (let l = l0 + f * 0.9; l < l0 + largo; l += 1.8) { const p = en(i, lado * l, f * 1.5 - 0.75); if (libre(p)) { mDientes.push(pon(p, rnd() * 0.3, 0.9 + rnd() * 0.25, 0.15, 0.1)); if (f === 0 && Math.round(l) % 5 === 0) zona(p, 3); } }
  }
  instancias(erizo(), mOxido, mErizos); instancias(diente(), mHormigon, mDientes);

  // Trincheras en zigzag paralelas a la vía: zanja de barro, terraplén hacia la vía y sacos encima.
  const mSacos = [], zanjas = [];
  for (const [s, lado, largo, l] of D.trincheras) {
    const pts = [];
    for (let u = 0; u <= largo; u += 2) { const i = idx(s + u), z = Math.abs(((u / 8) % 2) - 1) * 4 - 2; pts.push({ i, l: lado * (l + z) }); }
    zanjas.push({ pts, lado }); for (let k = 0; k < pts.length; k += 3) zona(en(pts[k].i, pts[k].l), 4);
    for (let k = 0; k < pts.length - 1; k++) {
      const a = en(pts[k].i, pts[k].l - lado * 0.9), b = en(pts[k + 1].i, pts[k + 1].l - lado * 0.9), giro = Math.atan2(b.x - a.x, b.z - a.z);
      for (let f = 0; f < 2; f++) for (let t = 0; t < 1; t += 0.24) {
        const p = a.clone().lerp(b, t + f * 0.12); p.x += (rnd() - 0.5) * 0.06;
        const m = pon(p, giro + Math.PI / 2 + (rnd() - 0.5) * 0.2, 1, -0.32 - f * 0.17, 0.12); mSacos.push(m);
      }
    }
  }
  instancias(saco(), mSaco, mSacos);
  for (const z of zanjas) {
    const n = z.pts.length;   // zanja de barro (dos primeras columnas) y terraplén hacia la vía
    const g = cinta(n, 5, (r, c, v) => {
      const { i, l } = z.pts[r], off = [0.6, -0.5, -0.8, -1.25, -1.9][c] * z.lado, p = en(i, l + off);
      const alto = [0.02, 0.02, 0.38, 0.42, 0.02][c];
      v[0] = p.x; v[2] = p.z; v[1] = P.terreno(p.x, p.z) + alto; v[3] = p.x / 2; v[4] = p.z / 2;
    });
    const m = new THREE.Mesh(g, mBarro); m.receiveShadow = true; m.castShadow = true; grupo.add(m);
  }

  // Vehículos quemados en la cuneta: el mismo blindado, sin carga ni vidrios, con la chapa oxidada y negra de hollín.
  const humeantes = [];
  if (vehiculo && D.restos.length) {
    const chapa = mat(tex.oxido, new THREE.Color().setRGB(0.2, 0.17, 0.15), { metalness: 0.35 }), negro = new THREE.MeshStandardMaterial({ color: new THREE.Color().setRGB(0.025, 0.022, 0.02), roughness: 1 });
    const porMat = new Map();
    vehiculo.updateMatrixWorld(true);
    const base = [], inv = vehiculo.matrixWorld.clone().invert(), fuera = (o) => { for (let p = o; p; p = p.parent) if (p === excluir) return true; return false; };
    vehiculo.traverse((o) => { if (o.isMesh && o.visible && o.material && !o.material.transparent && o.geometry.attributes.uv && o.geometry.attributes.normal && !fuera(o)) base.push(o); });
    for (const [s, lado, giro] of D.restos) {
      const i = idx(s), p = en(i, lado * (W + ARCEN + 3.2)); if (!libre(p, 4)) continue;
      p.y = P.terreno(p.x, p.z) - 0.35;
      const R = new THREE.Matrix4().compose(p, Q.setFromEuler(E.set(0.05, Math.atan2(P.tx[i], P.tz[i]) + giro, lado * 0.16, 'YXZ')), S.set(1, 1, 1));
      for (const o of base) {
        const oscuro = o.material.color && o.material.color.r + o.material.color.g + o.material.color.b < 0.3;
        const key = oscuro ? 'negro' : 'chapa', g = o.geometry.clone();
        for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
        g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(R, inv).multiply(o.matrixWorld));
        if (!porMat.has(key)) porMat.set(key, []); porMat.get(key).push(g.index ? g.toNonIndexed() : g);
      }
      humeantes.push(new THREE.Vector3(p.x, p.y + 1.6, p.z)); zona(p, 5);
    }
    for (const [k, lista] of porMat) { const m = new THREE.Mesh(mergeGeometries(lista), k === 'chapa' ? chapa : negro); m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; grupo.add(m); }
  }

  // Cráteres: tierra quemada escaneada recortada en círculo, ceñida al suelo (o a la vía).
  if (D.crateres.length) {
    const img = tex.quemado.map.image, cv = document.createElement('canvas'), sz = 512; cv.width = cv.height = sz;
    const g2 = cv.getContext('2d'); g2.drawImage(img, 0, 0, sz, sz);
    const d = g2.getImageData(0, 0, sz, sz);
    for (let y = 0; y < sz; y++) for (let x = 0; x < sz; x++) {
      const r = Math.hypot(x - sz / 2, y - sz / 2) / (sz / 2), k = (y * sz + x) * 4, oscuro = Math.max(0, 1 - r * 1.4);
      d.data[k] *= 1 - oscuro * 0.6; d.data[k + 1] *= 1 - oscuro * 0.62; d.data[k + 2] *= 1 - oscuro * 0.64;
      d.data[k + 3] = 255 * Math.max(0, Math.min(1, (1 - r) * 3.2)) * (0.75 + 0.25 * Math.sin(Math.atan2(y - sz / 2, x - sz / 2) * 7 + r * 9));
    }
    g2.putImageData(d, 0, 0);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    const mC = new THREE.MeshStandardMaterial({ map: t, normalMap: tex.quemado.normalMap, transparent: true, depthWrite: false, roughness: 1, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
    const geos = [], o = {};
    for (const [s, l, r] of D.crateres) {
      const i = idx(s), c = en(i, l); if (!libre(c, r)) continue; zona(c, r);
      const g = new THREE.PlaneGeometry(2 * r, 2 * r, 8, 8); g.rotateX(-Math.PI / 2); g.rotateY(rnd() * 6.283);
      const p = g.attributes.position;
      for (let k = 0; k < p.count; k++) {
        const x = c.x + p.getX(k), z = c.z + p.getZ(k); let y;
        if (Math.abs(l) < W + 0.2) { P.consulta(x, z, -1, o); y = o.y + 0.015; } else y = P.terreno(x, z) + 0.05;
        p.setXYZ(k, x, y, z);
      }
      g.computeVertexNormals(); geos.push(g);
    }
    if (geos.length) { const m = new THREE.Mesh(mergeGeometries(geos), mC); m.receiveShadow = true; m.renderOrder = 2; m.frustumCulled = false; grupo.add(m); }
  }

  // Túneles de red antidrones: postes a los dos lados del arcén cada 6 m y red tendida arriba y a los costados.
  const tuneles = [];
  if (D.redes.length) {
    const tRed = new THREE.CanvasTexture((() => {
      const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
      g.strokeStyle = 'rgba(40,44,30,1)'; g.lineWidth = 3.2;
      for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(k * 64, 0); g.lineTo(k * 64 + 128, 128); g.stroke(); g.beginPath(); g.moveTo(k * 64 + 128, 0); g.lineTo(k * 64, 128); g.stroke(); }
      g.fillStyle = 'rgba(30,32,22,1)'; for (const [x, y] of [[32, 32], [96, 96], [96, 32], [32, 96], [0, 0], [64, 64], [128, 0], [0, 128], [128, 128], [64, 0], [0, 64], [128, 64], [64, 128]]) { g.beginPath(); g.arc(x, y, 3.6, 0, 7); g.fill(); }
      return c;
    })());
    tRed.wrapS = tRed.wrapT = THREE.RepeatWrapping; tRed.anisotropy = 8; tRed.colorSpace = THREE.SRGBColorSpace;
    const mRed = new THREE.MeshStandardMaterial({ map: tRed, alphaTest: 0.35, side: THREE.DoubleSide, roughness: 0.95, color: new THREE.Color().setRGB(0.55, 0.6, 0.45) });
    mRed.alphaToCoverage = true;
    const gPoste = new THREE.CylinderGeometry(0.07, 0.085, RED_ALTO + 0.5, 7); gPoste.translate(0, (RED_ALTO + 0.5) / 2 - 0.4, 0);
    const mPostes = [], LR = W + ARCEN + 0.25;
    for (const [s0, s1] of D.redes) {
      const i0 = idx(s0), i1 = idx(s1), filas = i1 - i0 + 1;
      tuneles.push({ d0: P.dist[i0], d1: P.dist[i1] });
      for (let i = i0; i <= i1; i += 3) for (const sg of [-1, 1]) { const p = en(i, sg * LR); p.y = P.py[i] - sg * LR * P.peralte[i] - 0.25; mPostes.push(new THREE.Matrix4().compose(p, Q.set(0, 0, 0, 1), S.set(1, 1, 1))); }
      const comba = (i) => 0.45 * Math.sin(((P.dist[i] - P.dist[i0]) / 6) % 1 * Math.PI);   // la red cuelga entre poste y poste
      const techo = cinta(filas, 9, (r, c, v) => {
        const i = i0 + r, l = (c / 8 * 2 - 1) * LR, p = en(i, l);
        v[0] = p.x; v[2] = p.z; v[1] = P.py[i] - l * P.peralte[i] + RED_ALTO - comba(i) - 0.6 * (1 - (c / 4 - 1) ** 2); v[3] = l / 0.5; v[4] = P.dist[i] / 0.5;
      });
      grupo.add(new THREE.Mesh(techo, mRed));
      for (const sg of [-1, 1]) {
        const lado = cinta(filas, 2, (r, c, v) => { const i = i0 + r, l = sg * LR, p = en(i, l); v[0] = p.x; v[2] = p.z; v[1] = P.py[i] - l * P.peralte[i] + (c ? RED_ALTO - comba(i) : 1.4); v[3] = (c ? RED_ALTO : 1.4) / 0.5; v[4] = P.dist[i] / 0.5; });
        grupo.add(new THREE.Mesh(lado, mRed));
      }
    }
    instancias(gPoste, mOxido, mPostes);
  }

  const o = {};
  return {
    grupo, humeantes, tuneles, zonas,
    /** ¿Está `p` dentro de un túnel de red (o tocándolo)? Un FPV o una granada que entra se queda en la red. */
    enRed(p) {
      if (!tuneles.length) return false;
      P.consulta(p.x, p.z, -1, o);
      if (!tuneles.some((t) => o.dist >= t.d0 - 1 && o.dist <= t.d1 + 1)) return false;
      return Math.abs(o.lat) < W + ARCEN + 0.4 && p.y < o.y + RED_ALTO;
    },
    /** ¿Va la camioneta bajo una red? (para el aviso) */
    bajoRed(dist) { return tuneles.some((t) => dist >= t.d0 && dist <= t.d1); },
  };
}

/**
 * El frente: la guerra que no te toca pero se ve y se oye. Fogonazos en el horizonte (a 350-1.100 m), una columna de humo
 * donde cayó, ráfagas de trazadoras al cielo y el retumbo que llega con el retraso real del sonido (distancia / 343 m/s).
 * cb: { humo(x, y, z), sonido(d, pan) } · ritmo: eventos más seguidos con el nivel. Barato: 1 malla de destellos y 1 de trazas.
 */
export function crearFrente(scene, P, cb, ritmo = 1) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 64;
  { const g = cv.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,240,200,1)'); gr.addColorStop(0.25, 'rgba(255,170,70,0.85)'); gr.addColorStop(1, 'rgba(255,90,20,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }
  const tDest = new THREE.CanvasTexture(cv);
  const MAXF = 6, MAXT = 48, destellos = [], trazas = [], ecos = [], M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), V = new THREE.Vector3(), Z = new THREE.Vector3(0, 0, 1);
  const mDest = new THREE.MeshBasicMaterial({ map: tDest, color: new THREE.Color().setRGB(6, 3.2, 1.2), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const fl = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), mDest, MAXF); fl.frustumCulled = false; fl.count = 0; scene.add(fl);
  const gT = new THREE.BoxGeometry(0.5, 0.5, 9); const mT = new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(9, 4, 1), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const tr = new THREE.InstancedMesh(gT, mT, MAXT); tr.frustumCulled = false; tr.count = 0; scene.add(tr);
  let sig = 3, sigT = 6;
  const lejos = (veh, dmin, dmax) => { const a = veh.psi + (Math.random() < 0.85 ? (Math.random() - 0.5) * 2.6 : Math.PI + (Math.random() - 0.5) * 1.6), d = dmin + Math.random() * (dmax - dmin); const x = veh.x + Math.sin(a) * d, z = veh.z + Math.cos(a) * d; return { x, y: P.terreno(x, z), z, d, a }; };
  return {
    actualizar(dt, veh, cam, activo) {
      if (activo && (sig -= dt) <= 0) {   // impacto de artillería en el horizonte
        sig = (2.5 + Math.random() * 6) / ritmo;
        const p = lejos(veh, 350, 1100);
        if (destellos.length < MAXF) destellos.push({ ...p, t: 0, tam: 40 + Math.random() * 50 });
        for (let k = 0; k < 4; k++) cb.humo(p.x + (Math.random() - 0.5) * 20, p.y + 4 + k * 6, p.z + (Math.random() - 0.5) * 20);
        const pan = Math.sin(Math.atan2(p.x - veh.x, p.z - veh.z) - veh.psi);
        ecos.push({ t: p.d / 343, d: p.d, pan: -pan });
      }
      if (activo && (sigT -= dt) <= 0) {   // ráfaga antiaérea: trazadoras que suben en abanico
        sigT = (5 + Math.random() * 9) / ritmo;
        const p = lejos(veh, 500, 1000), n = 6 + ((Math.random() * 8) | 0), az = Math.random() * 6.283;
        for (let k = 0; k < n && trazas.length < MAXT; k++) {
          const el = 0.6 + Math.random() * 0.5, a = az + (Math.random() - 0.5) * 0.35, v = 260 + Math.random() * 60;
          trazas.push({ p: new THREE.Vector3(p.x, p.y + 2, p.z), v: new THREE.Vector3(Math.sin(a) * Math.cos(el), Math.sin(el), Math.cos(a) * Math.cos(el)).multiplyScalar(v), t: -k * 0.11, vida: 2.4 });
        }
      }
      for (let k = ecos.length - 1; k >= 0; k--) if ((ecos[k].t -= dt) <= 0) { cb.sonido(ecos[k].d, ecos[k].pan); ecos.splice(k, 1); }
      let n = 0;
      for (let k = destellos.length - 1; k >= 0; k--) {
        const f = destellos[k]; f.t += dt; if (f.t > 0.6) { destellos.splice(k, 1); continue; }
        const e = f.tam * (f.t < 0.08 ? f.t / 0.08 : Math.max(0, 1 - (f.t - 0.08) / 0.52));
        Q.copy(cam.quaternion); fl.setMatrixAt(n++, M.compose(V.set(f.x, f.y + f.tam * 0.25, f.z), Q, S.set(e, e * 0.75, 1)));
      }
      fl.count = n; fl.instanceMatrix.needsUpdate = true;
      n = 0;
      for (let k = trazas.length - 1; k >= 0; k--) {
        const t = trazas[k]; t.t += dt; if (t.t < 0) continue; if (t.t > t.vida) { trazas.splice(k, 1); continue; }
        t.v.y -= 9.8 * dt; t.p.addScaledVector(t.v, dt);
        Q.setFromUnitVectors(Z, V.copy(t.v).normalize()); tr.setMatrixAt(n++, M.compose(t.p, Q, S.set(1, 1, 1)));
      }
      tr.count = n; tr.instanceMatrix.needsUpdate = true;
    },
    reiniciar() { destellos.length = trazas.length = ecos.length = 0; fl.count = tr.count = 0; },
  };
}
