// 19-JUE · Luciérnaga · Mundo: lo que rodea a la carretera. Cielo (luna, estrellas, nubes, sierras y la ciudad
// del valle, todo en un sombreador), ladera, bosque de cedros, luciérnagas y el entorno que reflejan la pintura
// y el asfalto mojado. Licencia: MIT (código propio). Nada viene de un archivo.
import * as THREE from 'three';
import { texturaCanvas } from './render.js';
import { clamp, suave, fbm, ruido, semilla, pintar, fusionar } from './lc-util.js';
import { ARCEN } from './lc-pista.js';

export const NOCHE = {
  zenit: new THREE.Color().setRGB(0.010, 0.017, 0.045),
  horizonte: new THREE.Color().setRGB(0.055, 0.08, 0.15),
  niebla: new THREE.Color().setRGB(0.034, 0.048, 0.088),
  luna: new THREE.Vector3(-0.42, 0.5, 0.76).normalize(),   // hacia dónde hay que mirar para verla
};

const GLSL_RUIDO = `
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(h21(i), h21(i+vec2(1.0,0.0)), f.x), mix(h21(i+vec2(0.0,1.0)), h21(i+vec2(1.0,1.0)), f.x), f.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++){ v += a * n2(p); p = p * 2.03 + 7.1; a *= 0.5; } return v; }`;

/** Cúpula que sigue a la cámara. Bajo el horizonte no hay vacío: hay un valle con una ciudad encendida. */
export function crearCielo({ valleY = -40, ciudadX = 250 } = {}) {
  const u = {
    uT: { value: 0 }, uCam: { value: new THREE.Vector3() }, uLuna: { value: NOCHE.luna }, uValle: { value: valleY }, uCiudad: { value: ciudadX },
    cZ: { value: NOCHE.zenit }, cH: { value: NOCHE.horizonte }, cN: { value: NOCHE.niebla },
  };
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms: u,
    vertexShader: 'varying vec3 vD; void main(){ vD = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }',
    fragmentShader: `uniform float uT, uValle, uCiudad; uniform vec3 uCam, uLuna, cZ, cH, cN; varying vec3 vD;
${GLSL_RUIDO}
void main(){
  vec3 d = normalize(vD); float y = d.y;
  vec3 c = mix(cH, cZ, pow(clamp(y, 0.0, 1.0), 0.5));
  vec3 g = floor(d * 380.0); float s = h21(g.xy + g.z * 17.3);
  c += vec3(0.85, 0.9, 1.0) * step(0.9965, s) * smoothstep(0.03, 0.3, y) * (0.55 + 0.45 * sin(uT * (1.5 + s * 40.0) + s * 90.0)) * 1.3;
  float ml = dot(d, uLuna);
  c += vec3(1.0, 0.97, 0.9) * smoothstep(0.99955, 0.99975, ml) * (0.72 + 0.28 * n2(d.xy * 70.0 + d.z * 31.0)) * 3.2;
  c += vec3(0.42, 0.52, 0.9) * (pow(max(ml, 0.0), 700.0) * 0.5 + pow(max(ml, 0.0), 28.0) * 0.11);
  if (y > 0.02) {
    float n = smoothstep(0.5, 0.85, fbm(d.xz / (y + 0.18) * 1.3 + vec2(uT * 0.004, 0.0)));
    float luz = 0.14 + 0.86 * pow(max(ml, 0.0), 6.0);
    c = mix(c, mix(vec3(0.05, 0.065, 0.11), vec3(0.4, 0.48, 0.7), luz), n * 0.55 * smoothstep(0.02, 0.2, y));
  }
  float az = atan(d.z, d.x);
  if (y < 0.03 + 0.085 * fbm(vec2(az * 2.2 + 3.0, 1.7))) c = mix(cN, vec3(0.03, 0.043, 0.075), 0.55);
  if (y < 0.006 + 0.06 * fbm(vec2(az * 4.1 + 11.0, 5.3))) c = mix(cN, vec3(0.016, 0.024, 0.042), 0.78);
  if (y < 0.0) {
    float t = (uCam.y - uValle) / max(-y, 0.004);
    vec2 w = uCam.xz + d.xz * t;
    float dens = smoothstep(0.38, 0.66, fbm(w / 520.0)) * smoothstep(uCiudad, uCiudad + 190.0, w.x);
    vec2 cel = floor(w / 16.0), fr = fract(w / 16.0) - 0.5; float hh = h21(cel);
    float calle = (mod(cel.x, 7.0) < 1.0 || mod(cel.y, 9.0) < 1.0) ? 1.0 : 0.0;
    float on = step(1.0 - (0.1 + 0.55 * calle) * dens, hh) * smoothstep(0.42, 0.04, length(fr));
    float lej = exp(-t * 0.0007);
    vec3 luzc = mix(vec3(1.0, 0.6, 0.26), vec3(0.72, 0.88, 1.0), step(0.74, h21(cel + 3.7)));
    c = cN * 0.5 + luzc * on * (0.62 + 0.38 * sin(uT * 2.0 + hh * 50.0)) * 2.4 * lej + vec3(1.0, 0.52, 0.22) * dens * 0.055 * lej;
  }
  c = mix(c, cN, exp(-abs(y) * 30.0) * 0.8);
  gl_FragColor = vec4(c, 1.0);
}`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(400, 48, 24), mat);
  mesh.frustumCulled = false; mesh.renderOrder = -10;
  return { mesh, u };
}

/** La ladera: una malla regular que la carretera ya recortó (ver `terreno` en lc-pista.js). */
export function crearLadera(P) {
  const paso = 2.5;
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (let i = 0; i < P.n; i++) { x0 = Math.min(x0, P.px[i]); x1 = Math.max(x1, P.px[i]); z0 = Math.min(z0, P.pz[i]); z1 = Math.max(z1, P.pz[i]); }
  x0 -= 85; x1 += 135; z0 -= 85; z1 += 85;
  const nx = Math.ceil((x1 - x0) / paso) + 1, nz = Math.ceil((z1 - z0) / paso) + 1;
  const pos = new Float32Array(nx * nz * 3), uv = new Float32Array(nx * nz * 2), idx = new Uint32Array((nx - 1) * (nz - 1) * 6);
  for (let j = 0, k = 0; j < nz; j++) for (let i = 0; i < nx; i++, k++) {
    const x = x0 + i * paso, z = z0 + j * paso;
    pos[k * 3] = x; pos[k * 3 + 1] = P.terreno(x, z); pos[k * 3 + 2] = z; uv[k * 2] = x / 7; uv[k * 2 + 1] = z / 7;
  }
  for (let j = 0, o = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
    idx[o++] = a; idx[o++] = c; idx[o++] = b; idx[o++] = b; idx[o++] = c; idx[o++] = d;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeVertexNormals();
  const nor = g.attributes.normal.array, col = new Float32Array(nx * nz * 3);
  for (let k = 0; k < nx * nz; k++) {   // tierra de bosque en lo llano, roca en lo que cae a pico
    const roca = suave(0.8, 0.55, nor[k * 3 + 1]), m = 0.75 + 0.5 * ruido(pos[k * 3] / 9, pos[k * 3 + 2] / 9);
    col[k * 3] = (0.085 + 0.1 * roca) * m; col[k * 3 + 1] = (0.115 + 0.075 * roca) * m; col[k * 3 + 2] = (0.07 + 0.13 * roca) * m;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const rnd = semilla(4411);
  const tex = texturaCanvas(256, 256, (c, W, H) => {
    c.fillStyle = '#9a9a9a'; c.fillRect(0, 0, W, H);
    for (let k = 0; k < 5200; k++) { const v = 90 + rnd() * 150; c.fillStyle = `rgba(${v},${v},${v},0.5)`; c.beginPath(); c.ellipse(rnd() * W, rnd() * H, 1 + rnd() * 4, 1 + rnd() * 2, rnd() * 3, 0, 7); c.fill(); }
  });
  const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: tex, vertexColors: true, roughness: 1, metalness: 0 }));
  mesh.receiveShadow = true;
  return mesh;
}

/** Bosque de cedros: un solo dibujo con miles de copias, cada una con su tamaño, giro y tono. */
export function crearBosque(P, q, uT) {
  const cono = (r, h, y, c) => { const g = new THREE.ConeGeometry(r, h, 7); g.translate(0, y, 0); return pintar(g, c); };
  const tronco = new THREE.CylinderGeometry(0.15, 0.24, 2.4, 5); tronco.translate(0, 1.2, 0); pintar(tronco, new THREE.Color().setRGB(0.1, 0.07, 0.045));
  const geo = fusionar([tronco,
    cono(1.95, 3.5, 3.3, new THREE.Color().setRGB(0.035, 0.085, 0.045)),
    cono(1.5, 3.1, 5.1, new THREE.Color().setRGB(0.045, 0.105, 0.055)),
    cono(0.98, 2.7, 6.8, new THREE.Color().setRGB(0.06, 0.135, 0.07))]);
  const rnd = semilla(1090);
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (let i = 0; i < P.n; i++) { x0 = Math.min(x0, P.px[i]); x1 = Math.max(x1, P.px[i]); z0 = Math.min(z0, P.pz[i]); z1 = Math.max(z1, P.pz[i]); }
  x0 -= 70; x1 += 90; z0 -= 70; z1 += 70;
  const max = Math.round(2100 * q.distancia), mats = [], M = new THREE.Matrix4(), qn = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3(), cols = [];
  for (let k = 0; k < max * 6 && mats.length < max; k++) {
    const x = x0 + rnd() * (x1 - x0), z = z0 + rnd() * (z1 - z0), y = P.terreno(x, z), d = P.fuera.d;
    if (d < P.def.ancho + ARCEN + 6.5 || d > 78 || fbm(x / 40 + 2, z / 40 + 9, 2) < 0.34) continue;
    if (d > 45 && rnd() < 0.5) continue;
    const t = 0.8 + rnd() * rnd() * 1.3;
    qn.setFromEuler(e.set((rnd() - 0.5) * 0.08, rnd() * 6.283, (rnd() - 0.5) * 0.08));
    mats.push(M.compose(p.set(x, y - 0.25, z), qn, s.set(t * (0.85 + rnd() * 0.3), t, t * (0.85 + rnd() * 0.3))).clone());
    const v = 0.7 + rnd() * 0.6; cols.push(v, v * (0.9 + rnd() * 0.2), v);
  }
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 });
  mat.onBeforeCompile = (sh) => {   // el viento mece las copas: más arriba, más se mueven
    sh.uniforms.uT = uT;
    sh.vertexShader = 'uniform float uT;\n' + sh.vertexShader.split('#include <begin_vertex>').join(
      '#include <begin_vertex>\n#ifdef USE_INSTANCING\n float vie = sin(uT * 1.25 + instanceMatrix[3].x * 0.31 + instanceMatrix[3].z * 0.23) * 0.022 * position.y;\n transformed.x += vie; transformed.z += vie * 0.6;\n#endif');
  };
  const im = new THREE.InstancedMesh(geo, mat, mats.length), c = new THREE.Color();
  mats.forEach((m, k) => { im.setMatrixAt(k, m); im.setColorAt(k, c.setRGB(cols[k * 3], cols[k * 3 + 1], cols[k * 3 + 2])); });
  im.castShadow = q.sombras > 0; im.receiveShadow = false; im.frustumCulled = false;
  return im;
}

/** Luciérnagas en las cunetas: flotan y parpadean en el sombreador, sin trabajo por cuadro. */
export function crearLuciernagas(P, cuantas, uT) {
  const rnd = semilla(77), pos = new Float32Array(cuantas * 3), fase = new Float32Array(cuantas);
  for (let k = 0; k < cuantas; k++) {
    const i = 4 + Math.floor(rnd() * (P.n - 8)), sg = rnd() < 0.5 ? -1 : 1, l = sg * (P.ancho[i] + ARCEN + 1.5 + rnd() * 11);
    const x = P.px[i] + P.rx[i] * l, z = P.pz[i] + P.rz[i] * l;
    pos[k * 3] = x; pos[k * 3 + 1] = Math.max(P.terreno(x, z), P.py[i] - 1.5) + 0.5 + rnd() * 2.2; pos[k * 3 + 2] = z; fase[k] = rnd();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aFase', new THREE.BufferAttribute(fase, 1));
  const u = { uT, uEscala: { value: 900 } };
  const pts = new THREE.Points(g, new THREE.ShaderMaterial({
    uniforms: u, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `uniform float uT, uEscala; attribute float aFase; varying float vB;
      void main(){ vec3 p = position + vec3(sin(uT * 0.7 + aFase * 30.0) * 0.9, sin(uT * 0.9 + aFase * 17.0) * 0.5, cos(uT * 0.6 + aFase * 23.0) * 0.9);
        vec4 mv = modelViewMatrix * vec4(p, 1.0); vB = smoothstep(0.25, 1.0, sin(uT * (1.1 + aFase * 1.6) + aFase * 40.0));
        gl_PointSize = (0.1 + 0.08 * aFase) * uEscala / max(1.0, -mv.z); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying float vB; void main(){ float d = length(gl_PointCoord - 0.5) * 2.0; if (d > 1.0) discard;
        float a = pow(1.0 - d, 2.2); gl_FragColor = vec4(vec3(0.72, 1.0, 0.3) * 4.0 * vB * a, a * vB); }`,
  }));
  pts.frustumCulled = false;
  return { pts, u };
}

/** Lo que se refleja en la pintura, los cristales y el asfalto mojado: cielo de noche, luna y farolas de sodio. */
export function entornoNocturno(renderer) {
  const esc = new THREE.Scene();
  esc.add(new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, uniforms: { uLuna: { value: NOCHE.luna } },
    vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform vec3 uLuna; varying vec3 vD; void main(){ vec3 d = normalize(vD);
      vec3 c = mix(vec3(0.075, 0.105, 0.19), vec3(0.016, 0.026, 0.065), pow(clamp(d.y, 0.0, 1.0), 0.45));
      if (d.y < 0.0) c = mix(vec3(0.03, 0.04, 0.065), vec3(0.008, 0.01, 0.016), clamp(-d.y * 3.0, 0.0, 1.0));
      float ml = max(dot(d, uLuna), 0.0); c += vec3(0.7, 0.8, 1.0) * (pow(ml, 90.0) * 5.0 + pow(ml, 8.0) * 0.22);
      gl_FragColor = vec4(c, 1.0); }`,
  })));
  const tira = (x, y, z, w, h, l, r, g, b) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, l), new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(r, g, b) })); m.position.set(x, y, z); esc.add(m); };
  tira(-14, 9, 6, 1.2, 0.4, 5, 16, 9.5, 3.6); tira(15, 10, -9, 1.2, 0.4, 5, 16, 9.5, 3.6);   // farolas
  tira(0, 16, 22, 9, 0.4, 1.4, 2.2, 2.8, 4.2);                                                   // claro de luna entre nubes
  const pm = new THREE.PMREMGenerator(renderer), tex = pm.fromScene(esc, 0.035, 0.1, 100).texture;
  pm.dispose();
  return tex;
}
