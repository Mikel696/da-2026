// 19-JUE · Atalaya · Mesa táctica del puesto de mando: el radar como holograma 3D sobre el campo. El terreno real (muestreado
// de la vía) en una escala de alcance que se comprime con la distancia, así caben juntos el dron a 200 m y el avión a 10 km;
// anillos de 0,3 / 1 / 3 / 10 km, cúpulas del alcance del misil y del antimisil, barrido que gira, pistas con su altura
// (línea al suelo) y su vector de rumbo a 8 s. Se dibuja encima de la escena con su propia cámara. Licencia: MIT (código propio).
import * as THREE from 'three';

const R_MAX = 11000, K = 300, LN = Math.log(1 + R_MAX / K);
/** Distancia horizontal (m) → radio en la mesa (0 a 1). */
export const aRadio = (d) => Math.log(1 + Math.max(0, d) / K) / LN;
const aAlto = (h) => Math.log(1 + Math.max(0, h) / 90) * 0.075;
const relieve = (h) => Math.max(-40, Math.min(80, h)) * 0.0012;
const C = (r, g, b) => new THREE.Color().setRGB(r, g, b);
export const COLOR = { rejilla: C(0.38, 0.8, 0.55), via: C(1, 0.6, 0.18), amenaza: C(1, 0.62, 0.16), peligro: C(1, 0.2, 0.12), propio: C(0.3, 0.68, 1), cegado: C(0.55, 0.62, 0.7), sam: C(0.3, 0.75, 1), am: C(0.55, 0.95, 0.5), sel: C(1, 0.95, 0.8) };
const aditivo = (extra = {}) => Object.assign({ transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }, extra);

const VERT_SUELO = `attribute float aR; varying float vR; varying vec2 vP; varying float vH;
void main() { vR = aR; vP = position.xz; vH = position.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const FRAG_SUELO = `uniform float uBarrido; uniform vec4 uAnillos; uniform vec2 uArmas; uniform vec3 uCol; uniform vec3 uSam; uniform vec3 uAm;
varying float vR; varying vec2 vP; varying float vH;
float linea(float d, float w) { return 1.0 - smoothstep(0.0, w, abs(d)); }
void main() {
  float fw = fwidth(vR) * 1.4, anillo = 0.0;
  for (int i = 0; i < 4; i++) anillo = max(anillo, linea(vR - uAnillos[i], fw));
  float g = abs(fract(vR * 22.0 + 0.5) - 0.5) / 22.0, fino = linea(g, fw * 0.8);
  float rayo = 1e3, fp = length(fwidth(vP)) * 1.2;
  for (int k = 0; k < 6; k++) { float t = float(k) * 0.5236; rayo = min(rayo, abs(vP.x * cos(t) - vP.y * sin(t))); }
  float radial = linea(rayo, fp) * step(0.04, vR);
  float a = atan(vP.x, vP.y), dif = mod(uBarrido - a, 6.28318), estela = exp(-dif * 2.2) * smoothstep(0.0, 0.05, vR);
  float borde = 1.0 - smoothstep(0.965, 1.0, vR);
  vec3 c = uCol * (0.035 + 0.16 * fino + 0.16 * radial + 0.85 * anillo + 0.55 * estela + vH * 6.0);
  c += uSam * linea(vR - uArmas.x, fw * 1.2) * 0.9 + uAm * linea(vR - uArmas.y, fw * 1.2) * 0.9;
  gl_FragColor = vec4(c * borde, 1.0);
}`;
const VERT_CUPULA = `varying vec3 vN; varying float vY; void main() { vN = normalize(normalMatrix * normal); vY = position.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const FRAG_CUPULA = `uniform vec3 uCol; varying vec3 vN; varying float vY;
void main() { float f = pow(1.0 - abs(vN.z), 2.6), w = fwidth(vY) * 1.5, l = 0.0;
  for (int i = 1; i < 4; i++) l = max(l, 1.0 - smoothstep(0.0, w, abs(vY - float(i) * 0.25)));
  gl_FragColor = vec4(uCol * (0.05 + f * 0.32 + l * 0.22), 1.0); }`;

/** P: la vía (terreno), centro: Vector3 del puesto, armas: { sam, am } alcances en m. */
export function crearMesa(P, centro, armas) {
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(34, 1, 0.05, 30);
  const suelo = (x, z) => relieve(P.terreno(x, z) - centro.y);
  const V = new THREE.Vector3(), W = new THREE.Vector3();
  /** Punto del mundo → punto de la mesa. */
  const aMesa = (x, y, z, out) => { const dx = x - centro.x, dz = z - centro.z, d = Math.hypot(dx, dz), k = d > 1e-3 ? aRadio(d) / d : 0; return out.set(dx * k, suelo(x, z) + aAlto(y - P.terreno(x, z)), dz * k); };

  // Vidrio de la mesa, borde y marcas de rumbo cada 5°.
  const vidrio = new THREE.Mesh(new THREE.CircleGeometry(1.07, 96).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: C(0.012, 0.03, 0.024), transparent: true, opacity: 0.74, depthWrite: false, toneMapped: false }));
  vidrio.position.y = -0.006; vidrio.renderOrder = -5; scene.add(vidrio);
  const aro = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.012, 160).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial(aditivo({ color: COLOR.rejilla }))); scene.add(aro);
  { const p = []; for (let k = 0; k < 72; k++) { const a = k * Math.PI / 36, l = k % 6 === 0 ? 0.06 : 0.025; p.push(Math.sin(a) * 1.018, 0, Math.cos(a) * 1.018, Math.sin(a) * (1.018 + l), 0, Math.cos(a) * (1.018 + l)); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); scene.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial(aditivo({ color: COLOR.rejilla, opacity: 0.8 })))); }

  // Terreno: malla polar con el relieve real.
  const NR = 44, NA = 120, pos = [], aR = [], idx = [];
  for (let i = 0; i <= NR; i++) for (let j = 0; j <= NA; j++) {
    const r = i / NR, a = (j / NA) * Math.PI * 2, d = K * (Math.exp(r * LN) - 1), x = centro.x + Math.sin(a) * d, z = centro.z + Math.cos(a) * d;
    pos.push(Math.sin(a) * r, i ? suelo(x, z) : 0, Math.cos(a) * r); aR.push(r);
  }
  for (let i = 0; i < NR; i++) for (let j = 0; j < NA; j++) { const a = i * (NA + 1) + j, b = a + NA + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const gT = new THREE.BufferGeometry(); gT.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); gT.setAttribute('aR', new THREE.Float32BufferAttribute(aR, 1)); gT.setIndex(idx);
  const uT = { uBarrido: { value: 0 }, uAnillos: { value: new THREE.Vector4(aRadio(300), aRadio(1000), aRadio(3000), aRadio(10000)) }, uArmas: { value: new THREE.Vector2(aRadio(armas.sam), aRadio(armas.am)) },
    uCol: { value: COLOR.rejilla }, uSam: { value: COLOR.sam }, uAm: { value: COLOR.am } };
  scene.add(new THREE.Mesh(gT, new THREE.ShaderMaterial(aditivo({ uniforms: uT, vertexShader: VERT_SUELO, fragmentShader: FRAG_SUELO, side: THREE.DoubleSide }))));

  // La vía, en ámbar.
  { const p = []; for (let i = 0; i < P.n; i += 3) { if (Math.hypot(P.px[i] - centro.x, P.pz[i] - centro.z) > R_MAX) continue; aMesa(P.px[i], P.terreno(P.px[i], P.pz[i]), P.pz[i], V); p.push(V.x, V.y + 0.004, V.z); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); scene.add(new THREE.Line(g, new THREE.LineBasicMaterial(aditivo({ color: COLOR.via })))); }

  // Cúpulas de alcance de las armas propias.
  const cupula = (r, col) => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.ShaderMaterial(aditivo({ uniforms: { uCol: { value: col } }, vertexShader: VERT_CUPULA, fragmentShader: FRAG_CUPULA, side: THREE.DoubleSide })));
    m.scale.set(r, r * 0.42, r); scene.add(m); return m; };
  cupula(aRadio(armas.sam), COLOR.sam); cupula(aRadio(armas.am), COLOR.am);

  // El puesto: un haz vertical y un pulso en el suelo.
  const haz = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.22, 6), new THREE.MeshBasicMaterial(aditivo({ color: COLOR.sel }))); haz.position.y = 0.11; scene.add(haz);
  const pulso = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial(aditivo({ color: COLOR.sel, opacity: 1 }))); scene.add(pulso);

  // Etiquetas de los anillos.
  const etiqueta = (txt) => { const c = document.createElement('canvas'); c.width = 128; c.height = 40; const x = c.getContext('2d'); x.font = '600 26px Saira, sans-serif'; x.fillStyle = '#8fd8a8'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, 64, 20);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, toneMapped: false, opacity: 0.9 })); s.scale.set(0.15, 0.047, 1); scene.add(s); return s; };
  const rotulos = [[300, '300 m'], [1000, '1 km'], [3000, '3 km'], [10000, '10 km']].map(([d, t]) => ({ r: aRadio(d), s: etiqueta(t) }));

  // Pistas: un glifo por pista (pool), línea al suelo y vector de rumbo.
  const geo = {
    dron: new THREE.OctahedronGeometry(0.014),
    caza: (() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.05, -0.034, 0, -0.03, 0, 0.006, -0.016, 0, 0, 0.05, 0, 0.006, -0.016, 0.034, 0, -0.03, 0, 0, 0.05, 0.034, 0, -0.03, -0.034, 0, -0.03], 3)); g.computeVertexNormals(); return g; })(),
    misil: new THREE.ConeGeometry(0.007, 0.042, 6).rotateX(Math.PI / 2),
    tirador: new THREE.ConeGeometry(0.012, 0.024, 4).translate(0, 0.012, 0),
  };
  const mat = {}; for (const k of ['amenaza', 'peligro', 'propio', 'cegado', 'sel']) mat[k] = new THREE.MeshBasicMaterial(aditivo({ color: COLOR[k], side: THREE.DoubleSide }));
  const N = 90, glifos = Array.from({ length: N }, () => { const m = new THREE.Mesh(geo.dron, mat.amenaza); m.visible = false; scene.add(m); return m; });
  const lpos = new Float32Array(N * 12), lcol = new Float32Array(N * 12), gL = new THREE.BufferGeometry();
  gL.setAttribute('position', new THREE.BufferAttribute(lpos, 3)); gL.setAttribute('color', new THREE.BufferAttribute(lcol, 3));
  const lineas = new THREE.LineSegments(gL, new THREE.LineBasicMaterial(aditivo({ vertexColors: true }))); lineas.frustumCulled = false; scene.add(lineas);
  const anillo = new THREE.Mesh(new THREE.RingGeometry(0.03, 0.037, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial(aditivo({ color: COLOR.sel }))); scene.add(anillo);
  const Z = new THREE.Vector3(0, 0, 1), U = new THREE.Vector3(), TAM = new THREE.Vector2();
  let barrido = 0, t = 0;

  return {
    scene, cam, aMesa,
    /**
     * pistas: [{ pos, vel, glifo: 'dron'|'caza'|'misil'|'tirador', clase: 'amenaza'|'peligro'|'propio'|'cegado' }] · sel: la pista elegida
     * vista: { yaw, pitch, dist } de la cámara de la mesa.
     */
    actualizar(dt, pistas, sel, vista) {
      t += dt; barrido = (barrido + dt * Math.PI * 2 / 3) % (Math.PI * 2); uT.uBarrido.value = barrido;
      const s = (t * 0.6) % 1; pulso.scale.setScalar(0.02 + s * 0.12); pulso.material.opacity = 1 - s;
      let k = 0, l = 0; anillo.visible = false;
      for (const p of pistas) {
        if (k >= N) break; const g = glifos[k++]; aMesa(p.pos.x, p.pos.y, p.pos.z, g.position);
        g.geometry = geo[p.glifo] || geo.dron; g.material = p === sel ? mat.sel : mat[p.clase]; g.visible = true;
        if (p.vel && p.vel.lengthSq() > 1) { aMesa(p.pos.x + p.vel.x * 0.5, p.pos.y + p.vel.y * 0.5, p.pos.z + p.vel.z * 0.5, V); U.subVectors(V, g.position); if (U.lengthSq() > 1e-10) g.quaternion.setFromUnitVectors(Z, U.normalize()); }
        const a = Math.atan2(g.position.x, g.position.z), dif = ((barrido - a) % 6.2832 + 6.2832) % 6.2832;
        g.scale.setScalar((p === sel ? 1.7 : 1) * (1 + 0.6 * Math.exp(-dif * 5)));
        const c = p === sel ? COLOR.sel : COLOR[p.clase], o = l * 6;
        const piso = suelo(p.pos.x, p.pos.z);
        lpos.set([g.position.x, g.position.y, g.position.z, g.position.x, piso, g.position.z], o); lcol.set([c.r * 0.7, c.g * 0.7, c.b * 0.7, c.r * 0.15, c.g * 0.15, c.b * 0.15], o); l++;
        if (p.vel && p.clase !== 'cegado' && p.glifo !== 'tirador') { aMesa(p.pos.x + p.vel.x * 8, p.pos.y + p.vel.y * 8, p.pos.z + p.vel.z * 8, W); lpos.set([g.position.x, g.position.y, g.position.z, W.x, W.y, W.z], l * 6); lcol.set([c.r, c.g, c.b, c.r * 0.1, c.g * 0.1, c.b * 0.1], l * 6); l++; }
        if (p === sel) { anillo.visible = true; anillo.position.set(g.position.x, piso + 0.002, g.position.z); anillo.scale.setScalar(1 + 0.25 * Math.sin(t * 7)); }
      }
      for (; k < N; k++) glifos[k].visible = false;
      gL.setDrawRange(0, l * 2); gL.attributes.position.needsUpdate = true; gL.attributes.color.needsUpdate = true;
      const { yaw, pitch, dist } = vista;
      cam.position.set(-Math.sin(yaw) * Math.cos(pitch) * dist, Math.sin(pitch) * dist, -Math.cos(yaw) * Math.cos(pitch) * dist); cam.lookAt(0, 0.06, 0);
      for (const r of rotulos) r.s.position.set(-Math.sin(yaw + 0.3) * r.r, 0.03, -Math.cos(yaw + 0.3) * r.r);
    },
    /** Dibuja la mesa en el rectángulo (px CSS desde arriba a la izquierda), encima de lo que ya hay en pantalla. */
    dibujar(renderer, rect) {
      const { x: w, y: h } = renderer.getSize(TAM); cam.aspect = rect.w / rect.h; cam.updateProjectionMatrix();
      const auto = renderer.autoClear; renderer.autoClear = false;
      renderer.setScissorTest(true); renderer.setViewport(rect.x, h - rect.y - rect.h, rect.w, rect.h); renderer.setScissor(rect.x, h - rect.y - rect.h, rect.w, rect.h);
      renderer.clearDepth(); renderer.render(scene, cam);
      renderer.setScissorTest(false); renderer.setViewport(0, 0, w, h); renderer.autoClear = auto;
    },
    /** Punto del mundo → px CSS en pantalla, dentro del rectángulo de la mesa. */
    aPantalla(p, rect, out) { aMesa(p.x, p.y, p.z, V).project(cam); out.x = rect.x + (V.x * 0.5 + 0.5) * rect.w; out.y = rect.y + (-V.y * 0.5 + 0.5) * rect.h; return out; },
  };
}
