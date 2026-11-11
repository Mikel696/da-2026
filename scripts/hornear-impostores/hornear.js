// Hornea impostores: fotografía un modelo escaneado desde K ángulos (color + normales) y guarda un atlas WebP.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, premultipliedAlpha: true });
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NoToneMapping; renderer.setPixelRatio(1);
renderer.setClearColor(0x000000, 0);
const estado = (t) => { document.getElementById('estado').textContent = t; };

const VS = `varying vec2 vUv; varying vec3 vW; varying vec3 vN;
void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * viewMatrix * w; }`;
const FS_COLOR = `uniform sampler2D map; uniform vec3 color; uniform float R, H, y0, corte, usaMapa, aoMin; varying vec2 vUv; varying vec3 vW; varying vec3 vN;
void main(){
  vec4 c = usaMapa > 0.5 ? texture2D(map, vUv) : vec4(1.0); if (c.a < corte) discard;
  float h = clamp((vW.y - y0) / H, 0.0, 1.0), r = length(vW.xz);
  float rmax = max(R * (1.0 - 0.75 * h), 0.08 * R);
  float ao = mix(aoMin, 1.0, smoothstep(0.0, 0.95, r / rmax)) * mix(0.72, 1.0, h);
  gl_FragColor = vec4(c.rgb * color * ao, 1.0);
  #include <colorspace_fragment>
}`;
const FS_NORMAL = `uniform sampler2D map; uniform float corte, usaMapa; varying vec2 vUv; varying vec3 vW; varying vec3 vN;
void main(){ vec4 c = usaMapa > 0.5 ? texture2D(map, vUv) : vec4(1.0); if (c.a < corte) discard;
  vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n; gl_FragColor = vec4(n * 0.5 + 0.5, 1.0); }`;

/** Copia de un nodo (variante) del modelo, centrada en el origen en x-z y con el pie en y = 0. */
function variante(gltf, nombre) {
  const o = gltf.scene.getObjectByName(nombre).clone(); o.position.set(0, 0, 0); const g = new THREE.Group(); g.add(o); g.updateMatrixWorld(true);
  const b = new THREE.Box3().setFromObject(g), c = b.getCenter(new THREE.Vector3());
  o.position.set(-c.x, -b.min.y, -c.z); g.updateMatrixWorld(true); return g;
}
/** Radio horizontal máximo y alturas, recorriendo los vértices de verdad. */
function medir(obj) {
  let R = 0, y0 = Infinity, y1 = -Infinity, tri = 0; const v = new THREE.Vector3();
  obj.traverse((o) => {
    if (!o.isMesh) return; const p = o.geometry.attributes.position; tri += (o.geometry.index ? o.geometry.index.count : p.count) / 3;
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld); R = Math.max(R, Math.hypot(v.x, v.z)); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); }
  });
  return { R, y0, y1, H: y1 - y0, tri };
}
function materiales(obj, m, aoMin) {
  const col = [], nor = [];
  obj.traverse((o) => {
    if (!o.isMesh) return; const mt = o.material, corte = mt.alphaTest > 0 ? mt.alphaTest : (mt.transparent ? 0.35 : 0.0);
    const u = { map: { value: mt.map }, color: { value: mt.color.clone() }, R: { value: m.R }, H: { value: m.H }, y0: { value: m.y0 }, corte: { value: mt.map && (mt.alphaTest > 0 || mt.transparent) ? Math.max(corte, 0.35) : -1 }, usaMapa: { value: mt.map ? 1 : 0 }, aoMin: { value: aoMin } };
    col.push([o, new THREE.ShaderMaterial({ uniforms: u, vertexShader: VS, fragmentShader: FS_COLOR, side: THREE.DoubleSide })]);
    nor.push([o, new THREE.ShaderMaterial({ uniforms: u, vertexShader: VS, fragmentShader: FS_NORMAL, side: THREE.DoubleSide })]);
  });
  return { col, nor };
}
function dilatar(img, pasadas) {
  const { width: w, height: h, data: d } = img, ok = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) ok[i] = d[i * 4 + 3] > 8 ? 1 : 0;
  for (let p = 0; p < pasadas; p++) {
    const nuevo = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x; if (ok[i]) continue; let r = 0, g = 0, b = 0, n = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue; const j = yy * w + xx; if (ok[j]) { r += d[j * 4]; g += d[j * 4 + 1]; b += d[j * 4 + 2]; n++; } }
      if (n) nuevo.push(i, r / n, g / n, b / n);
    }
    for (let k = 0; k < nuevo.length; k += 4) { const i = nuevo[k]; d[i * 4] = nuevo[k + 1]; d[i * 4 + 1] = nuevo[k + 2]; d[i * 4 + 2] = nuevo[k + 3]; ok[i] = 1; }
  }
}
const blob = (cv, tipo, q) => new Promise((r) => cv.toBlob(r, tipo, q));
async function guardar(nombre, datos) { const r = await fetch('/guardar/' + nombre, { method: 'POST', body: datos }); return r.text(); }

/**
 * variantes: [{obj, m}] ya medidas. K vistas por variante (ángulos k·180/K). densidad = metros por píxel.
 * Atlas: una fila por variante, una columna por vista; celdas del tamaño de la variante más grande.
 */
async function atlas(nombre, variantes, { K = 3, densidad = 0.012, aoMin = 0.4, sin = false } = {}) {
  const maxR = Math.max(...variantes.map((v) => v.m.R)), maxH = Math.max(...variantes.map((v) => v.m.H));
  const cw = Math.ceil(2 * maxR / densidad / 4) * 4, ch = Math.ceil(maxH / densidad / 4) * 4, SS = 2;
  const W = cw * K, Hh = ch * variantes.length;
  const cvC = document.createElement('canvas'), cvN = document.createElement('canvas'); cvC.width = cvN.width = W; cvC.height = cvN.height = Hh;
  const gC = cvC.getContext('2d'), gN = cvN.getContext('2d'); gC.imageSmoothingQuality = gN.imageSmoothingQuality = 'high';
  renderer.setSize(cw * SS, ch * SS, false);
  const escena = new THREE.Scene(), cam = new THREE.OrthographicCamera(-maxR, maxR, maxH / 2, -maxH / 2, 0.1, 100);
  const celdas = [];
  for (const [fila, v] of variantes.entries()) {
    escena.clear(); escena.add(v.obj);
    const mats = materiales(v.obj, v.m, aoMin);
    for (let k = 0; k < K; k++) {
      const a = k * Math.PI / K;
      cam.position.set(Math.sin(a) * 40, maxH / 2, Math.cos(a) * 40); cam.lookAt(0, maxH / 2, 0); cam.updateMatrixWorld();
      for (const [pase, lista, g] of [['c', mats.col, gC], ['n', mats.nor, gN]]) {
        for (const [o, mt] of lista) o.material = mt;
        renderer.clear(); renderer.render(escena, cam);
        g.drawImage(renderer.domElement, 0, 0, cw * SS, ch * SS, k * cw, fila * ch, cw, ch);
      }
    }
    celdas.push({ fila, R: +v.m.R.toFixed(3), H: +v.m.H.toFixed(3), tri: v.m.tri });
  }
  for (const [cv, g, conAlfa] of [[cvC, gC, true], [cvN, gN, false]]) {
    const img = g.getImageData(0, 0, W, Hh); dilatar(img, 12);
    if (!conAlfa) for (let i = 3; i < img.data.length; i += 4) img.data[i] = 255;
    g.putImageData(img, 0, 0);
  }
  if (!sin) {
    document.getElementById('vista').append(cvC, cvN);
  }
  const meta = { nombre, K, densidad, celda: [cw, ch], atlas: [W, Hh], maxR: +maxR.toFixed(3), maxH: +maxH.toFixed(3), variantes: celdas };
  const r1 = await guardar(nombre + '_color.webp', await blob(cvC, 'image/webp', 0.9));
  const r2 = await guardar(nombre + '_normal.webp', await blob(cvN, 'image/webp', 0.9));
  await guardar(nombre + '.json', JSON.stringify(meta, null, 1));
  return { meta, r1, r2 };
}

const gl = new GLTFLoader();
window.hornearArbol = async (url, nombre, nodos, opc) => {
  estado('cargando ' + url); const t0 = performance.now();
  const gltf = await gl.loadAsync(url);
  estado('midiendo'); const variantes = nodos.map((n) => { const obj = variante(gltf, n); return { obj, m: medir(obj) }; });
  estado('horneando'); const r = await atlas(nombre, variantes, opc);
  estado('listo ' + nombre); gltf.scene.traverse((o) => { if (o.isMesh) o.geometry.dispose(); });
  return { seg: ((performance.now() - t0) / 1000).toFixed(1), ...r };
};
/** Mata de pasto: muchas matas pequeñas juntas en un disco, horneadas como una sola. */
window.hornearPasto = async (url, nombre, radio, cuantas, opc) => {
  const gltf = await gl.loadAsync(url); const nombres = []; gltf.scene.traverse((o) => { if (o.isMesh) nombres.push(o.name); });
  const g = new THREE.Group(); let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < cuantas; i++) {
    const v = variante(gltf, nombres[Math.floor(rnd() * nombres.length)]), a = rnd() * 6.283, r = Math.sqrt(rnd()) * radio, e = 0.8 + rnd() * 0.6;
    v.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); v.rotation.y = rnd() * 6.283; v.scale.setScalar(e); g.add(v);
  }
  g.updateMatrixWorld(true);
  const r = await atlas(nombre, [{ obj: g, m: medir(g) }], opc);
  return r;
};
estado('listo para hornear');
