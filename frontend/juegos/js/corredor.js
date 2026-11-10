// 19-JUE · Corredor · Tramo de realismo. Una camioneta táctica por una carretera rural de 760 m, de día.
// Aquí la luz, el cielo, el asfalto, la tierra, las rocas, los arbustos y la carga son material real escaneado
// (Poly Haven, CC0: ver assets/ph/CREDITOS.json). La camioneta se arma en código (no hay modelo libre) y se viste
// con chapa escaneada. Este archivo orquesta: carga, escena, sol, posproceso, cámara, HUD.
// Licencia: MIT (código propio). Motor 3D: three.js 0.186.1 (MIT, vendorizado sin modificar).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { PERFILES, Particulas } from './render.js';
import { Entrada, BOTON } from './entrada.js';
import { Menus, opcion, calidad, fijarCalidad, NIVELES, Medidor, Sacudida, clamp, amort } from './comun.js';
import { iniciarAudio, ui, audio, sonidoActivo, fijarSonido } from './sonido.js';
import { semilla } from './lc-util.js';
import { TRAMO, crearVia, ARCEN } from './co-via.js';
import { crearCamion } from './co-camion.js';
import { Vehiculo, AJUSTE } from './lc-fisica.js';
import { Sonidos } from './lc-audio.js';

const $ = (id) => document.getElementById(id);
const nivel = calidad(), q = PERFILES[nivel];
const BASE = new URL('../assets/ph/', import.meta.url).href;
// Dos cielos reales: soleado con nubes (por defecto) y nublado (añadir ?cielo=nublado a la dirección).
const CIELO = new URLSearchParams(location.search).get('cielo') === 'nublado' ? 'kloppenheim_06_puresky' : 'kloofendal_48d_partly_cloudy_puresky';
const CONTROLES = [['Acelerar', 'W · ↑', 'RT'], ['Frenar / marcha atrás', 'S · ↓', 'LT'], ['Girar', 'A D · ← →', 'Stick izquierdo'], ['Freno de mano', 'Espacio', 'A'],
  ['Mirar atrás', 'B', 'B'], ['Mirar alrededor', '—', 'Stick derecho'], ['Cámara', 'C', 'Y'], ['Volver al centro de la vía', 'R', 'Select'], ['Pausa', 'Esc · P', 'Start']];
const inp = new Entrada({
  acciones: { acelerar: { k: ['KeyW', 'ArrowUp'], b: [BOTON.RT] }, frenar: { k: ['KeyS', 'ArrowDown'], b: [BOTON.LT] }, mano: { k: ['Space'], b: [BOTON.A] },
    atras: { k: ['KeyB'], b: [BOTON.B] }, camara: { k: ['KeyC'], b: [BOTON.Y] }, reaparecer: { k: ['KeyR'], b: [BOTON.SELECT] } },
  ejes: { giro: { neg: ['KeyA', 'ArrowLeft'], pos: ['KeyD', 'ArrowRight'], eje: 0, bneg: [BOTON.IZQ], bpos: [BOTON.DER] }, mirar: { eje: 2 } },
});
const menus = new Menus(inp), medidor = new Medidor(), sacudida = new Sacudida(0.12, 0.012);

// ───────────── Render ─────────────
const renderer = new THREE.WebGLRenderer({ canvas: $('lienzo'), antialias: false, powerPreference: 'high-performance', stencil: false });
renderer.setPixelRatio(q.escala);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = q.sombras > 0; renderer.shadowMap.type = THREE.PCFShadowMap;
const scene = new THREE.Scene();
const camara = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.3, 2500);
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: q.msaa }));
composer.addPass(new RenderPass(scene, camara));
let gtao = null;
if (nivel === 'alta') {   // oclusión ambiental: la sombra suave donde dos cosas se tocan. Es lo que más «asienta» los objetos
  gtao = new GTAOPass(scene, camara, innerWidth, innerHeight);
  gtao.updateGtaoMaterial({ radius: 0.6, distanceExponent: 1.4, thickness: 1.2, scale: 1.1, samples: 12 });
  composer.addPass(gtao);
}
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.12, 0.5, 1.4); bloom.enabled = q.bloom; composer.addPass(bloom);
const fx = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uVel: { value: 0 }, uT: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uVel, uT; varying vec2 vUv;
    float h(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    void main(){
      vec2 d = vUv - 0.5; float r2 = dot(d, d), f = uVel * 0.045 * smoothstep(0.03, 0.45, r2);
      vec3 c = vec3(0.0); float tot = 0.0;
      for (int i = 0; i < 6; i++){ float k = float(i) / 5.0, w = 1.0 - k * 0.5; c += texture2D(tDiffuse, vUv - d * f * k).rgb * w; tot += w; }
      c /= tot; c *= 1.0 - smoothstep(0.16, 0.7, r2) * 0.28;
      c *= 1.0 + (h(vUv * 811.0 + fract(uT) * 37.0) - 0.5) * 0.035;
      gl_FragColor = vec4(max(c, 0.0), 1.0);
    }`,
});
fx.enabled = nivel !== 'baja'; composer.addPass(fx);
composer.addPass(new OutputPass());
let altoPx = 1;
function tamano() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false); composer.setPixelRatio(q.escala); composer.setSize(w, h);
  camara.aspect = w / h; camara.updateProjectionMatrix(); altoPx = h * renderer.getPixelRatio();
}
addEventListener('resize', tamano);

// ───────────── Carga del material escaneado ─────────────
const tl = new THREE.TextureLoader(), gl = new GLTFLoader(), aniso = renderer.capabilities.getMaxAnisotropy();
let hechos = 0, total = 0;
const avance = (p) => { total++; return p.then((v) => { hechos++; $('cargando').textContent = `Cargando el corredor… ${Math.round(hechos / total * 100)} %`; return v; }); };
async function textura(id, res) {
  const una = async (cual, color) => { const t = await avance(tl.loadAsync(`${BASE}tex/${id}/${cual}_${res}.jpg`)); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = aniso; if (color) t.colorSpace = THREE.SRGBColorSpace; return t; };
  const [map, normalMap, armMap] = await Promise.all([una('diff', true), una('nor', false), una('arm', false)]);
  return { map, normalMap, armMap };
}
const material = (t, extra = {}) => new THREE.MeshStandardMaterial(Object.assign({ map: t.map, normalMap: t.normalMap, roughnessMap: t.armMap, aoMap: t.armMap, roughness: 1, metalness: 0 }, extra));
const modelo = (id) => avance(gl.loadAsync(`${BASE}mod/${id}/${id}.gltf`));

/** Lee el cielo HDR: encuentra el sol, mide cuánta luz da y devuelve un cielo sin sol para iluminar (el sol va aparte, con sombras). */
function leerCielo(tex) {
  const { data, width: W, height: H } = tex.image, de = THREE.DataUtils.fromHalfFloat, a = THREE.DataUtils.toHalfFloat, sinSol = new Uint16Array(data.length), TOPE = 12;
  let sx = 0, sy = 0, sz = 0, er = 0, eg = 0, eb = 0, hr = 0, hg = 0, hb = 0, hn = 0;
  for (let y = 0; y < H; y++) {
    const phi = (0.5 - (y + 0.5) / H) * Math.PI, c = Math.cos(phi), s = Math.sin(phi), dOm = (2 * Math.PI / W) * (Math.PI / H) * c, horizonte = phi > 0.01 && phi < 0.07;
    for (let x = 0; x < W; x++) {
      const o = (y * W + x) * 4; let r = de(data[o]), g = de(data[o + 1]), b = de(data[o + 2]);
      const m = Math.max(r, g, b);
      if (m > TOPE) {
        const k = TOPE / m, xr = r * (1 - k), xg = g * (1 - k), xb = b * (1 - k), w = (xr + xg + xb) * dOm, an = ((x + 0.5) / W - 0.5) * 2 * Math.PI;
        sx += Math.cos(an) * c * w; sy += s * w; sz += Math.sin(an) * c * w; er += xr * dOm; eg += xg * dOm; eb += xb * dOm; r *= k; g *= k; b *= k;
      }
      sinSol[o] = a(r); sinSol[o + 1] = a(g); sinSol[o + 2] = a(b); sinSol[o + 3] = data[o + 3];
      if (horizonte) { hr += r; hg += g; hb += b; hn++; }
    }
  }
  const env = new THREE.DataTexture(sinSol, W, H, THREE.RGBAFormat, THREE.HalfFloatType);
  env.mapping = THREE.EquirectangularReflectionMapping; env.colorSpace = THREE.LinearSRGBColorSpace; env.minFilter = env.magFilter = THREE.LinearFilter; env.flipY = tex.flipY; env.needsUpdate = true;
  const dir = new THREE.Vector3(sx, Math.abs(sy), sz).normalize(), E = Math.max(er, eg, eb, 1e-6);
  return { env, dir, sol: new THREE.Color().setRGB(er / E, eg / E, eb / E), fuerza: E, bruma: new THREE.Color().setRGB(hr / hn, hg / hn, hb / hn) };
}

/** Reparte copias de un modelo escaneado: una sola llamada de dibujo por cada malla del modelo. */
function repartir(gltf, matrices, { sombra = true, hojas = false } = {}) {
  const g = new THREE.Group(), m = new THREE.Matrix4();
  gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse((o) => {
    if (!o.isMesh) return;
    if (hojas) { o.material.transparent = false; o.material.alphaTest = 0.45; o.material.side = THREE.DoubleSide; o.material.depthWrite = true; }
    const im = new THREE.InstancedMesh(o.geometry, o.material, matrices.length);
    matrices.forEach((M, k) => im.setMatrixAt(k, m.multiplyMatrices(M, o.matrixWorld)));
    im.castShadow = sombra; im.receiveShadow = true; im.frustumCulled = false; g.add(im);
  });
  return g;
}

async function iniciar() {
  const [cielo, tAsf, tTer, tGra, tMet, mRoca1, mRoca2, mArb1, mArb2, mTronco, mBarrera, mBidon, mCaja, mBarril] = await Promise.all([
    avance(new HDRLoader().loadAsync(`${BASE}cielo/${CIELO}_2k.hdr`)),
    textura('asphalt_02', '2k'), textura('rocky_terrain_02', '1k'), textura('sandy_gravel_02', '1k'), textura('green_metal_rust', '1k'),
    modelo('namaqualand_boulder_02'), modelo('namaqualand_boulder_05'), modelo('wild_rooibos_bush'), modelo('shrub_04'), modelo('dead_tree_trunk_02'),
    modelo('concrete_road_barrier'), modelo('metal_jerrycan'), modelo('wooden_crate_02'), modelo('barrel_03'),
  ]);

  // Cielo y sol.
  cielo.mapping = THREE.EquirectangularReflectionMapping;
  const C = leerCielo(cielo);
  scene.background = cielo; scene.environment = C.env; scene.environmentIntensity = 1; scene.backgroundIntensity = 1;
  scene.fog = new THREE.FogExp2(C.bruma, 0.0011);
  const sol = new THREE.DirectionalLight(C.sol, C.fuerza);
  if (q.sombras) {
    sol.castShadow = true; sol.shadow.mapSize.set(q.sombras * 2, q.sombras * 2);
    Object.assign(sol.shadow.camera, { left: -42, right: 42, top: 42, bottom: -42, near: 10, far: 420 });
    sol.shadow.bias = -0.0004; sol.shadow.normalBias = 0.06;
  }
  scene.add(sol, sol.target);

  // Vía y terreno.
  const P = crearVia(TRAMO, { asfalto: material(tAsf), grava: material(tGra, { color: new THREE.Color().setRGB(0.6, 0.56, 0.5) }), terreno: material(tTer, { vertexColors: true }) });
  scene.add(P.grupo);

  // Rocas, arbustos y troncos junto a la vía; barreras y barriles en el puesto de control del final.
  {
    const rnd = semilla(31), M4 = () => new THREE.Matrix4(), qn = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3();
    const sembrar = (cuantos, dmin, dmax, tmin, tmax, hunde, inclina = 0.12) => {
      const out = [];
      for (let k = 0; out.length < cuantos && k < cuantos * 30; k++) {
        const i = 6 + Math.floor(rnd() * (P.n - 12)), sg = rnd() < 0.5 ? -1 : 1, l = sg * (TRAMO.ancho + ARCEN + dmin + (rnd() ** 1.6) * (dmax - dmin));
        const x = P.px[i] + P.rx[i] * l, z = P.pz[i] + P.rz[i] * l, y = P.terreno(x, z);
        if (P.fuera.d < TRAMO.ancho + ARCEN + dmin - 0.2) continue;
        const t = tmin + rnd() * (tmax - tmin);
        qn.setFromEuler(e.set((rnd() - 0.5) * inclina, rnd() * 6.283, (rnd() - 0.5) * inclina));
        out.push(M4().compose(p.set(x, y - hunde * t, z), qn, s.set(t, t * (0.85 + rnd() * 0.3), t)));
      }
      return out;
    };
    const k = q.distancia;
    // Cada roca escaneada son ~98 000 triángulos y se dibuja hasta tres veces por cuadro (imagen, sombra, oclusión):
    // con 18 copias el tramo bajaba a 52 fps en 1080p alta. Pocas, grandes y cerca de la vía.
    scene.add(repartir(mRoca1, sembrar(Math.round(4 * k), 2.5, 40, 0.7, 1.8, 0.12)));
    scene.add(repartir(mRoca2, sembrar(Math.round(4 * k), 2.5, 40, 0.7, 2, 0.12)));
    scene.add(repartir(mTronco, sembrar(2, 4, 26, 0.8, 1.2, 0.1, 0.05), { sombra: false }));
    scene.add(repartir(mArb1, sembrar(Math.round(13 * k), 1.2, 40, 1.4, 2.8, 0.02, 0.05), { sombra: false, hojas: true }));
    scene.add(repartir(mArb2, sembrar(Math.round(15 * k), 0.6, 26, 2.2, 4.2, 0.01, 0.05), { sombra: false, hojas: true }));
    const fin = P.n - 16, barr = [], bar = [];
    for (const [di, l, giro] of [[0, -2.6, 0], [0, -1.05, 0], [-9, 1.05, 0], [-9, 2.6, 0]]) {
      const i = fin + di; qn.setFromEuler(e.set(0, Math.atan2(-P.rz[i], P.rx[i]) + giro, 0));
      barr.push(M4().compose(p.set(P.px[i] + P.rx[i] * l, P.py[i] - l * P.peralte[i], P.pz[i] + P.rz[i] * l), qn, s.set(1, 1, 1)));
    }
    for (const [di, l] of [[1, -3.9], [1, 0.1], [-8, 3.9], [-8, -0.1], [2, -4.6]]) { const i = fin + di; bar.push(M4().makeTranslation(P.px[i] + P.rx[i] * l, P.py[i] - l * P.peralte[i] - 0.02, P.pz[i] + P.rz[i] * l)); }
    scene.add(repartir(mBarrera, barr)); scene.add(repartir(mBarril, bar));
  }

  // Camioneta.
  const camion = crearCamion({ pintura: tMet, modelos: { caja: mCaja, bidon: mBidon, barril: mBarril } });
  scene.add(camion.grupo);
  const veh = new Vehiculo(Object.assign({}, AJUSTE.tactica));
  const SALIDA = P.iInicio, FIN = P.n - 30;
  veh.colocar(P, SALIDA, -1.6);
  const polvo = new Particulas(scene, Math.round(500 * q.particulas), { aditivo: false, suave: 1 });
  const tono = Math.min(1.6, 0.16 * C.fuerza + 0.5), POLVO = [0.62 * tono, 0.55 * tono, 0.44 * tono];   // el polvo recibe el mismo sol que el suelo

  // ───────────── Estado, conducción y reglas ─────────────
  const est = { fase: 'titulo', fin: 0, t: 0 }, ent = { gas: 0, freno: 0, giro: 0, mano: false }, uT = { value: 0 };
  let jugando = false, pausado = false, ultimo = 0, acum = 0, padsVistos = null, msgT = 0;
  const hMsg = $('hMsg'), mensaje = (txt, seg = 2.2) => { hMsg.textContent = txt; hMsg.classList.add('ver'); msgT = seg; };
  const auto = { on: false, pensar() {
    const s = veh.sup, vel = Math.abs(veh.u), ad = Math.min(P.n - 1, s.i + 4 + Math.round(vel * 0.35)), a = Math.atan2(P.px[ad] - P.rx[ad] * 1.6 - veh.x, P.pz[ad] - P.rz[ad] * 1.6 - veh.z) - veh.psi;
    let vmax = 24; for (let k = 0; k < 30 && s.i + k < P.n; k++) { const c = Math.abs(P.curv[s.i + k]); if (c > 0.003) vmax = Math.min(vmax, Math.sqrt(4.2 / c) + k * 0.4); }
    if (s.i > FIN - 26) vmax = Math.min(vmax, 9);
    ent.giro = clamp(-Math.atan2(Math.sin(a), Math.cos(a)) * 2.4, -1, 1); ent.gas = vel < vmax ? 0.8 : 0; ent.freno = vel > vmax + 1.5 ? clamp((vel - vmax) / 6, 0.2, 1) : 0; ent.mano = false;
  } };
  function salir() { veh.colocar(P, SALIDA, -1.6); cam.listo = false; est.fase = 'ruta'; est.fin = 0; est.t = 0; menus.cerrarTodo(); jugando = true; pausado = false; $('hud').hidden = false; document.body.classList.add('corriendo'); mensaje('Lleva la carga hasta el puesto de control', 3); }
  const DT_F = 1 / 120;
  function conducir(dt) {
    acum = Math.min(acum + dt, 0.1);
    while (acum >= DT_F) {
      acum -= DT_F;
      const libre = est.fase !== 'ruta';
      if (auto.on || libre) { auto.pensar(); if (libre) { ent.gas = 0; ent.freno = veh.u > 0.4 ? 1 : 0; } }
      veh.paso(DT_F, ent, P);
      if (veh.evento === 'sube' || veh.evento === 'baja') { son.cambio(veh.evento === 'sube'); inp.vibrar(0.2, 0.25, 70); }
      if (veh.soplido > 0) { son.soplido(veh.soplido * 0.6); veh.soplido = 0; }
      if (veh.sup.i <= 1 && veh.u < 0) veh.u = 0;
      if (veh.sup.i >= P.n - 4 && veh.u > 0) veh.u = 0;
      if (est.fase === 'ruta') { est.t += DT_F; if (veh.sup.i >= FIN) { est.fase = 'fin'; est.fin = 3.2; mensaje('Puesto de control alcanzado', 3); inp.vibrar(0.5, 0.7, 250); ui.cuenta(true); } }
    }
  }

  // ───────────── Camioneta en pantalla ─────────────
  let giroRueda = 0, cabeceo = 0, balanceo = 0, frenoLuz = 0, tVib = 0;
  function vestir(dt) {
    const s = veh.sup, vel = Math.hypot(veh.u, veh.v), fxh = Math.sin(veh.psi), fzh = Math.cos(veh.psi);
    const cuesta = (s.ty || 0) * (fxh * (s.tx || 0) + fzh * (s.tz || 1)), lateral = (s.peralte || 0) * (fxh * (s.tz || 1) - fzh * (s.tx || 0));
    camion.grupo.position.set(veh.x, veh.y, veh.z); camion.grupo.rotation.set(-Math.atan(cuesta), veh.psi, lateral, 'YXZ');
    // Suspensión blanda y centro de gravedad alto: cabecea al frenar y se inclina en las curvas mucho más que un turismo.
    cabeceo = amort(cabeceo, clamp(-veh.gLon * 0.0075, -0.05, 0.075), 4.5, dt); balanceo = amort(balanceo, clamp(veh.gLat * 0.0095, -0.085, 0.085), 4, dt);
    const bache = vel > 1 ? (Math.sin(uT.value * 23 + veh.x * 0.7) * 0.004 + Math.sin(uT.value * 9.1 + veh.z * 0.31) * 0.007) * clamp(vel / 14, 0, 1) * (veh.arcen ? 3.2 : 1) : 0;
    camion.cuerpo.rotation.set(cabeceo + bache * 0.9, 0, balanceo + (veh.arcen ? Math.sin(uT.value * 17) * 0.006 : 0)); camion.cuerpo.position.y = bache * 2.4;
    giroRueda += veh.u / camion.E.radio * dt;
    for (const r of camion.ruedas) { r.giro.rotation.x = (ent.mano && !r.delantera) ? r.giro.rotation.x : giroRueda; if (r.delantera) r.pivote.rotation.y = veh.delta; }
    frenoLuz = amort(frenoLuz, (veh.marcha > 0 ? ent.freno : ent.gas) > 0.05 || ent.mano ? 1 : 0, 20, dt); camion.luzFreno(frenoLuz);
    // Polvo: mucho en el arcén de grava, un velo fino sobre el asfalto.
    const fuerza = veh.arcen ? clamp(vel / 9, 0, 1) : clamp((vel - 9) / 30, 0, 0.35) + veh.chirrido * 0.5;
    if (fuerza > 0.03 && q.particulas > 0) for (const sx of [-1, 1]) {
      if (Math.random() > fuerza * 1.2) continue;
      const lx = Math.cos(veh.psi) * sx * 0.86, lz = -Math.sin(veh.psi) * sx * 0.86, g = 0.9 + Math.random() * 0.2;
      polvo.emitir(veh.x - fxh * 1.7 + lx, veh.y + 0.2, veh.z - fzh * 1.7 + lz, (Math.random() - 0.5) * 1.8 - fxh * vel * 0.08, 0.5 + Math.random() * 1.1, (Math.random() - 0.5) * 1.8 - fzh * vel * 0.08,
        1.2 + Math.random() * 1.1, 0.7, POLVO[0] * g, POLVO[1] * g, POLVO[2] * g, (veh.arcen ? 0.3 : 0.12) * fuerza + 0.03, -0.25, 0.7, 3.2);
    }
    polvo.actualizar(dt, camara, altoPx);
    if ((tVib -= dt) <= 0 && jugando && !pausado) { tVib = 0.09; if (veh.arcen && vel > 3) inp.vibrar(0.4, 0.25, 100); else if (veh.chirrido > 0.2) inp.vibrar(veh.chirrido * 0.3, veh.chirrido * 0.6, 100); }
  }

  // ───────────── Cámara ─────────────
  const cam = { yaw: veh.psi, pos: new THREE.Vector3(), modo: 0, fov: 55, t: 0, listo: false, mirar: 0 };
  const MODOS = [{ dist: 8.6, alto: 3.3, mira: 1.7, adel: 3 }, { dist: 6.2, alto: 2.2, mira: 1.5, adel: 2 }, { capo: true }];
  function moverCamara(dt) {
    const vel = Math.hypot(veh.u, veh.v); let fov;
    if (est.fase === 'titulo') {
      cam.t += dt; const a = veh.psi + 2.5 + cam.t * 0.13, r = 8.6 + Math.sin(cam.t * 0.17) * 0.9, px = veh.x + Math.sin(a) * r, pz = veh.z + Math.cos(a) * r;
      camara.position.set(px, Math.max(veh.y + 1.7 + Math.sin(cam.t * 0.2) * 0.7, P.terreno(px, pz) + 0.6), pz); camara.lookAt(veh.x, veh.y + 1.15, veh.z); fov = 38; cam.listo = false;
    } else {
      const m = MODOS[cam.modo];
      cam.mirar = amort(cam.mirar, inp.p('atras') ? Math.PI : inp.e('mirar') * 1.9, 9, dt);
      const obj = veh.psi + (vel > 5 ? Math.atan2(veh.v, Math.abs(veh.u)) * 0.5 : 0);
      cam.yaw += Math.atan2(Math.sin(obj - cam.yaw), Math.cos(obj - cam.yaw)) * (1 - Math.exp(-4.5 * dt));
      const a = cam.yaw + cam.mirar, sx = Math.sin(a), sz = Math.cos(a);
      if (m.capo) { const fxh = Math.sin(veh.psi), fzh = Math.cos(veh.psi); camara.position.set(veh.x + fxh * 1.25, veh.y + 1.62, veh.z + fzh * 1.25); camara.lookAt(veh.x + sx * 25, veh.y + 1.2 + (veh.sup.ty || 0) * 25, veh.z + sz * 25); fov = 66; }
      else {
        const px = veh.x - sx * m.dist, pz = veh.z - sz * m.dist, py = Math.max(veh.y + m.alto, P.terreno(px, pz) + 0.8);
        if (!cam.listo) { cam.pos.set(px, py, pz); cam.listo = true; }
        cam.pos.set(amort(cam.pos.x, px, 11, dt), amort(cam.pos.y, py, 6, dt), amort(cam.pos.z, pz, 11, dt));
        camara.position.copy(cam.pos); camara.lookAt(veh.x + sx * m.adel, veh.y + m.mira, veh.z + sz * m.adel);
        fov = 52 + clamp(vel / 34, 0, 1) * 12;
      }
      if (veh.arcen && vel > 4) sacudida.sumar(0.5 * dt * 60 * 0.02);
      sacudida.aplicar(camara, dt);
    }
    cam.fov = amort(cam.fov, fov, 4, dt);
    if (Math.abs(camara.fov - cam.fov) > 0.04) { camara.fov = cam.fov; camara.updateProjectionMatrix(); }
    sol.position.set(veh.x + C.dir.x * 200, veh.y + C.dir.y * 200, veh.z + C.dir.z * 200); sol.target.position.set(veh.x, veh.y, veh.z);
    fx.uniforms.uVel.value = est.fase === 'titulo' ? 0 : clamp((vel - 10) / 26, 0, 1);
  }

  // ───────────── HUD ─────────────
  const hRpm = $('hRpm'), tramoM = P.dist[FIN] - P.dist[SALIDA];
  function pintarHud() {
    $('hKmh').textContent = Math.round(veh.kmh); $('hMarcha').textContent = veh.marcha < 0 ? 'R' : veh.marcha;
    hRpm.style.width = clamp(veh.rpm / AJUSTE.tactica.rpmMax, 0, 1) * 100 + '%'; hRpm.classList.toggle('alto', veh.rpm > AJUSTE.tactica.rpmMax * 0.9);
    const hecho = clamp((veh.sup.dist - P.dist[SALIDA]) / tramoM, 0, 1);
    $('hAvance').style.width = (hecho * 100).toFixed(1) + '%'; $('hFalta').textContent = hecho >= 1 ? 'En el puesto de control' : `Puesto de control a ${Math.round((1 - hecho) * tramoM)} m`;
  }

  // ───────────── Sonido (nace apagado) y menús ─────────────
  const son = new Sonidos(); let sonidoOn = sonidoActivo(), faltaGesto = null;
  addEventListener('pointerdown', () => iniciarAudio()); addEventListener('keydown', () => iniciarAudio());
  function sonidoCuadro() {
    const falta = sonidoOn && !audio.activo(); if (falta !== faltaGesto) { faltaGesto = falta; $('tSonido').hidden = !falta; }
    if (!son.preparar()) return;
    const activo = jugando && !pausado; son.encender(activo);
    if (activo) son.actualizar({ rpm: veh.rpm, gas: veh.marcha < 0 ? ent.freno : ent.gas, turbo: veh.turbo * 0.7, chirrido: veh.chirrido, vel: Math.hypot(veh.u, veh.v), arcen: veh.arcen && Math.abs(veh.u) > 2, corte: veh.cambio > 0 });
  }
  $('tablaCtl').innerHTML = '<tr><th>Acción</th><th>Teclado</th><th>Mando</th></tr>' + CONTROLES.map(([a, t, m]) => `<tr><td>${a}</td><td>${t}</td><td>${m}</td></tr>`).join('');
  opcion($('mCal'), NIVELES, nivel, 'Calidad', (v) => { fijarCalidad(v); location.reload(); });
  function pintarSonido() { for (const id of ['mSonido', 'pSonido']) $(id).innerHTML = `<span>Sonido</span><b>‹ ${sonidoOn ? 'sí' : 'no'} ›</b>`; }
  for (const id of ['mSonido', 'pSonido']) { const b = $(id), cambiar = () => { sonidoOn = !sonidoOn; fijarSonido(sonidoOn); pintarSonido(); if (sonidoOn) ui.ok(); }; b.dataset.nav = 'opcion'; b.addEventListener('click', cambiar); b.addEventListener('ajustar', cambiar); }
  pintarSonido();
  function pintarPad() {
    if (inp.pads === padsVistos) return; padsVistos = inp.pads;
    const p = inp.pads.find((x) => x.activo), n = inp.pads.length; $('tPad').hidden = !p; if (!p) return;
    $('tPad').textContent = `Control en uso: ${p.nombre}` + (n > 1 ? ` · hay ${n} conectados: manda el último en el que pulses un botón` : '') + (!p.estandar && !inp.mapas[p.id] ? ' · no usa el mapa estándar: configúralo en la sala de juegos' : '');
  }
  const pausar = () => { if (!jugando || pausado || menus.abierto) return; pausado = true; document.body.classList.remove('corriendo'); menus.abrir($('pPausa'), 0); };
  const seguir = () => { pausado = false; menus.cerrarTodo(); document.body.classList.add('corriendo'); };
  const alMenu = () => { jugando = false; pausado = false; est.fase = 'titulo'; $('hud').hidden = true; document.body.classList.remove('corriendo'); menus.cerrarTodo(); veh.colocar(P, SALIDA, -1.6); menus.abrir($('pTitulo'), 0); };
  $('mJugar').addEventListener('click', () => { iniciarAudio(); ui.ok(); salir(); });
  for (const id of ['mCtl', 'pCtl']) $(id).addEventListener('click', () => { ui.ok(); menus.abrir($('pControles'), 0); });
  $('cVolver').addEventListener('click', () => { ui.atras(); menus.cerrar(); });
  $('mSalir').addEventListener('click', () => { location.href = '../juegos.html'; });
  $('pSeguir').addEventListener('click', seguir); $('pReiniciar').addEventListener('click', () => { ui.ok(); salir(); }); $('pMenu').addEventListener('click', alMenu);
  document.addEventListener('visibilitychange', () => { if (document.hidden) pausar(); });
  inp.alPerderPad = () => pausar();
  addEventListener('keydown', (e) => { if (e.code === 'F3') { e.preventDefault(); medidor.alternar(); } });

  // ───────────── Bucle ─────────────
  function cuadro(t) {
    requestAnimationFrame(cuadro);
    const dt = Math.min(0.05, (t - ultimo) / 1000 || 0.016); ultimo = t;
    medidor.inicio(); inp.actualizar(); pintarPad();
    if (!audio.activo() && inp.botones[BOTON.A] > 0.5 && inp.previos[BOTON.A] <= 0.5) iniciarAudio();
    if (menus.abierto) { menus.actualizar(dt); if (pausado && inp.botones[BOTON.START] > 0.5 && inp.previos[BOTON.START] <= 0.5) $('pSeguir').click(); }
    else if (jugando) {
      if (inp.j('pausa')) pausar();
      else {
        if (inp.j('camara')) { cam.modo = (cam.modo + 1) % MODOS.length; cam.listo = false; }
        if (est.fase === 'ruta' && inp.j('reaparecer')) { veh.colocar(P, clamp(veh.sup.i, 2, P.n - 6), -1.6); cam.listo = false; ui.atras(); }
        if (!auto.on && est.fase === 'ruta') { ent.gas = inp.v('acelerar'); ent.freno = inp.v('frenar'); ent.giro = inp.e('giro'); ent.mano = inp.p('mano'); }
        conducir(dt); pintarHud();
        if (est.fase === 'fin' && (est.fin -= dt) <= 0) salir();
      }
    }
    if (!pausado) { uT.value += dt; fx.uniforms.uT.value = uT.value; vestir(dt); if (msgT > 0 && (msgT -= dt) <= 0) hMsg.classList.remove('ver'); }
    sonidoCuadro(); moverCamara(dt);
    composer.render(); medidor.fin(dt);
  }
  tamano(); $('cargando').remove(); menus.abrir($('pTitulo'), 0); requestAnimationFrame(cuadro);
  // Para pruebas desde la consola. El juego no lo usa.
  window.__co = { veh, P, renderer, scene, camara, est, inp, ent, auto, cam, camion, sol, C, gtao, salir,
    sonido: () => ({ activado: sonidoOn, contexto: audio.ctx ? audio.ctx.state : null, motor: son.listo }) };
}
iniciar().catch((e) => { console.error(e); $('cargando').textContent = 'No se pudo cargar el tramo: ' + e.message; });
