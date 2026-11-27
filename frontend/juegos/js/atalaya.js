// 19-JUE · Atalaya · Shooter en primera persona. Un blindado de guardia en un puesto del camino báltico: desde su torreta
// aguantas oleadas de drones que crecen (suicidas, bombarderos, reconocimiento y FPV de fibra) y lanzacohetes que se asoman
// en la linde del bosque. Entre oleadas, un respiro para reparar. Reutiliza el mundo de Corredor (vía, bosque horneado,
// guerra, frente, drones, torreta, interceptores, sonido grabado): todo CC0, ver assets/ph/CREDITOS.json y
// assets/sonido/CREDITOS.json. Juego original: sin bandos, insignias ni nombres reales. Licencia: MIT (código propio).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { PERFILES, Particulas } from './render.js';
import { Entrada, BOTON } from './entrada.js';
import { Menus, opcion, calidad, fijarCalidad, NIVELES, Medidor, Sacudida, clamp, amort, records } from './comun.js';
import { iniciarAudio, ui, audio, sonidoActivo, fijarSonido, tono, ruido } from './sonido.js';
import { TRAMO, crearVia } from './co-via.js';
import { crearCamion } from './co-camion.js';
import { crearDrones, NOMBRES } from './co-drones.js';
import { Torreta, VEL_BALA } from './co-arma.js';
import { crearInterceptores } from './co-interceptores.js';
import { crearEmboscadas, NOMBRE_TIRADOR } from './co-cohetes.js';
import { crearCampamento } from './co-campo.js';
import { crearPaisaje } from './co-paisaje.js';
import { crearGuerra, crearFrente } from './co-guerra.js';
import { SonidoReal } from './co-sonido-real.js';
import { JUEGOS } from './catalogo.js';

const $ = (id) => document.getElementById(id);
const DEF = JUEGOS.find((j) => j.id === 'atalaya');
const nivel = calidad(), q = PERFILES[nivel];
const BASE = new URL('../assets/ph/', import.meta.url).href;
const angulo = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const V = new THREE.Vector3(), V2 = new THREE.Vector3(), V3 = new THREE.Vector3(), V4 = new THREE.Vector3(), camDir = new THREE.Vector3(0, 0, 1);
const RESPIRO = 9, OLEADAS_MAX = 60, KITS = 2, REPARA = 25, REPARA_T = 4;

/** Una oleada: n sube y con él cuántos y qué drones. [segundo dentro de la oleada, tipo, cuántos]. */
export function planOleada(n) {
  const p = [], sui = 2 + Math.round(1.4 * n + 0.08 * n * n), fib = n >= 2 ? Math.floor(n / 2) : 0, bom = Math.floor(n / 2);
  let t = 2;
  for (let q = sui; q > 0; t += 4) { const k = Math.min(q, 1 + Math.min(3, Math.floor(n / 3))); p.push([t, 'suicida', k]); q -= k; }
  for (let k = 0; k < bom; k++) p.push([5 + k * 7, 'bombardero', 1]);
  for (let k = 0; k < fib; k++) p.push([8 + k * 6, 'fibra', 1]);
  if (n % 3 === 0) p.push([3, 'reconocimiento', 1]);
  return p.sort((a, b) => a[0] - b[0]);
}
/** Lanzacohetes por oleada y cómo apuntan (más rápido con cada oleada). */
const cohetes = (n) => ({ n: Math.min(8, Math.floor(n / 2)), apunta: Math.max(0.9, 1.7 - 0.06 * n), recarga: Math.max(4, 8 - 0.3 * n) });

const inp = new Entrada({
  acciones: { disparar: { k: ['Mouse0', 'KeyF'], b: [BOTON.RT, BOTON.RB] }, mirar: { k: ['Mouse2'], b: [BOTON.LT] }, centrar: { k: ['KeyV'], b: [BOTON.R3] },
    inhibidor: { k: ['KeyQ'], b: [BOTON.LB] }, interceptor: { k: ['KeyE'], b: [BOTON.B] }, reparar: { k: ['KeyT'], b: [BOTON.A] } },
  ejes: { apuntarX: { neg: ['KeyJ', 'KeyA', 'ArrowLeft'], pos: ['KeyL', 'KeyD', 'ArrowRight'], eje: 2 }, apuntarY: { neg: ['KeyI', 'KeyW', 'ArrowUp'], pos: ['KeyK', 'KeyS', 'ArrowDown'], eje: 3 } },
});
const menus = new Menus(inp), medidor = new Medidor(), sacudida = new Sacudida(0.1, 0.01);

// ───────────── Render ─────────────
const renderer = new THREE.WebGLRenderer({ canvas: $('lienzo'), antialias: false, powerPreference: 'high-performance', stencil: false });
renderer.setPixelRatio(q.escala); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = q.sombras > 0; renderer.shadowMap.type = THREE.PCFShadowMap;
const scene = new THREE.Scene(), camara = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.2, 2500);
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: q.msaa }));
composer.addPass(new RenderPass(scene, camara));
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.14, 0.5, 1.4); bloom.enabled = q.bloom; composer.addPass(bloom);
composer.addPass(new OutputPass());
let altoPx = 1;
function tamano() { renderer.setSize(innerWidth, innerHeight, false); composer.setPixelRatio(q.escala); composer.setSize(innerWidth, innerHeight); camara.aspect = innerWidth / innerHeight; camara.updateProjectionMatrix(); altoPx = innerHeight * renderer.getPixelRatio(); }
addEventListener('resize', tamano);

// ───────────── Material escaneado ─────────────
const tl = new THREE.TextureLoader(), gl = new GLTFLoader(), aniso = renderer.capabilities.getMaxAnisotropy();
let hechos = 0, total = 0;
const avance = (p) => { total++; return p.then((v) => { hechos++; $('cargando').textContent = `Cargando la atalaya… ${Math.round(hechos / total * 100)} %`; return v; }); };
async function textura(id, res) {
  const una = async (cual, color) => { const t = await avance(tl.loadAsync(`${BASE}tex/${id}/${cual}_${res}.jpg`)); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = aniso; if (color) t.colorSpace = THREE.SRGBColorSpace; return t; };
  const [map, normalMap, armMap] = await Promise.all([una('diff', true), una('nor', false), una('arm', false)]); return { map, normalMap, armMap };
}
async function impostor(id) {
  const una = async (cual, color) => { const t = await avance(tl.loadAsync(`${BASE}imp/${id}_${cual}.webp`)); t.anisotropy = aniso; if (color) t.colorSpace = THREE.SRGBColorSpace; return t; };
  const [c, n] = await Promise.all([una('color', true), una('normal', false)]); return { c, n };
}
const modelo = (id) => avance(gl.loadAsync(`${BASE}mod/${id}/${id}.gltf`));
const material = (t, extra = {}) => new THREE.MeshStandardMaterial(Object.assign({ map: t.map, normalMap: t.normalMap, roughnessMap: t.armMap, aoMap: t.armMap, roughness: 1, metalness: 0 }, extra));
/** El sol sale del cielo HDR: se mide y se quita del entorno para no contarlo dos veces (igual que en Corredor). */
function leerCielo(tex) {
  const { data, width: W, height: H } = tex.image, de = THREE.DataUtils.fromHalfFloat, a = THREE.DataUtils.toHalfFloat, sinSol = new Uint16Array(data.length), TOPE = 12;
  let sx = 0, sy = 0, sz = 0, er = 0, eg = 0, eb = 0, hr = 0, hg = 0, hb = 0, hn = 0;
  for (let y = 0; y < H; y++) {
    const phi = (0.5 - (y + 0.5) / H) * Math.PI, c = Math.cos(phi), s = Math.sin(phi), dOm = (2 * Math.PI / W) * (Math.PI / H) * c, horiz = phi > 0.01 && phi < 0.07;
    for (let x = 0; x < W; x++) {
      const o = (y * W + x) * 4; let r = de(data[o]), g = de(data[o + 1]), b = de(data[o + 2]); const m = Math.max(r, g, b);
      if (m > TOPE) { const k = TOPE / m, w = (r + g + b) * (1 - k) * dOm, an = ((x + 0.5) / W - 0.5) * 2 * Math.PI; sx += Math.cos(an) * c * w; sy += s * w; sz += Math.sin(an) * c * w; er += r * (1 - k) * dOm; eg += g * (1 - k) * dOm; eb += b * (1 - k) * dOm; r *= k; g *= k; b *= k; }
      sinSol[o] = a(r); sinSol[o + 1] = a(g); sinSol[o + 2] = a(b); sinSol[o + 3] = data[o + 3];
      if (horiz) { hr += r; hg += g; hb += b; hn++; }
    }
  }
  const env = new THREE.DataTexture(sinSol, W, H, THREE.RGBAFormat, THREE.HalfFloatType);
  env.mapping = THREE.EquirectangularReflectionMapping; env.minFilter = env.magFilter = THREE.LinearFilter; env.flipY = tex.flipY; env.needsUpdate = true;
  const E = Math.max(er, eg, eb, 1e-6), dir = E > 1e-3 ? new THREE.Vector3(sx, Math.abs(sy), sz).normalize() : new THREE.Vector3(0.4, 0.75, -0.5).normalize();
  return { env, dir, sol: new THREE.Color().setRGB(er / E, eg / E, eb / E), fuerza: E, bruma: new THREE.Color().setRGB(hr / hn, hg / hn, hb / hn) };
}

async function iniciar() {
  const [cielo, tAsf, tTer, tGra, tMet, tOxido, tHormigon, tBarro, tQuemado, tTela, mBarrera, mBidon, mCaja, mBarril, mBotiquin, mEstufa, mJoven, mHelecho, mTocon, mRocas, mTronco, iAbeto, iPino, iJoven, iPasto] = await Promise.all([
    avance(new HDRLoader().loadAsync(`${BASE}cielo/kloppenheim_06_puresky_2k.hdr`)),
    textura('asphalt_02', '2k'), textura('leafy_grass', '1k'), textura('sandy_gravel_02', '1k'), textura('green_metal_rust', '1k'),
    textura('rusty_metal_02', '1k'), textura('chipped_concrete', '1k'), textura('brown_mud_02', '1k'), textura('burned_ground_01', '1k'), textura('denim_fabric', '1k'),
    modelo('concrete_road_barrier'), modelo('metal_jerrycan'), modelo('wooden_crate_02'), modelo('barrel_03'), modelo('medical_box'), modelo('barrel_stove'),
    modelo('fir_sapling'), modelo('fern_02'), modelo('tree_stump_01'), modelo('rock_moss_set_01'), modelo('dead_tree_trunk'),
    impostor('abeto'), impostor('pino'), impostor('abeto_joven'), impostor('pasto'),
  ]);
  cielo.mapping = THREE.EquirectangularReflectionMapping;
  const C = leerCielo(cielo);
  scene.background = cielo; scene.environment = C.env; scene.fog = new THREE.FogExp2(C.bruma, 0.0017);
  const sol = new THREE.DirectionalLight(C.sol, C.fuerza);
  if (q.sombras) { sol.castShadow = true; sol.shadow.mapSize.set(q.sombras * 2, q.sombras * 2); Object.assign(sol.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 10, far: 420 }); sol.shadow.bias = -0.0004; sol.shadow.normalBias = 0.06; }
  scene.add(sol, sol.target);
  const luz = Math.min(1.6, 0.16 * C.fuerza + 0.5);

  // El puesto, en un tercio del tramo: el frente queda delante, a lo largo de la vía.
  const mVia = { asfalto: material(tAsf), grava: material(tGra, { color: new THREE.Color().setRGB(0.4, 0.44, 0.48) }), terreno: material(tTer, { vertexColors: true }),
    agua: new THREE.MeshStandardMaterial({ color: new THREE.Color().setRGB(0.02, 0.024, 0.017), roughness: 0.1 }) };
  const P = crearVia(TRAMO, mVia); scene.add(P.grupo);
  const INI = P.iInicio, iP = Math.round(P.n * 0.32), sP = P.dist[iP] - P.dist[INI];
  const camion = crearCamion({ pintura: tMet, modelos: { caja: mCaja, bidon: mBidon, barril: mBarril } }); scene.add(camion.grupo);
  const o = {}; { const l = 1.9, x = P.px[iP] + P.rx[iP] * l, z = P.pz[iP] + P.rz[iP] * l; P.consulta(x, z, -1, o); camion.grupo.position.set(x, o.y, z); camion.grupo.rotation.set(0, Math.atan2(P.tx[iP], P.tz[iP]), 0); }
  camion.grupo.updateMatrixWorld(true);
  const veh = { x: camion.grupo.position.x, y: camion.grupo.position.y, z: camion.grupo.position.z, psi: camion.grupo.rotation.y, u: 0, v: 0, sup: { dist: P.dist[iP], i: iP, lat: 1.9 } };
  const RC = { modelos: { barrera: mBarrera, barril: mBarril, caja: mCaja, bidon: mBidon, botiquin: mBotiquin, estufa: mEstufa },
    mats: { grava: mVia.grava, hesco: material(tGra, { color: new THREE.Color().setRGB(0.5, 0.43, 0.33) }), liso: camion.mats.liso }, vehiculo: camion.grupo };
  const campos = [crearCampamento(scene, P, iP - 10, -1, 'puesto', RC)];
  const torreta = new Torreta(scene, camion, P);
  const EMB = [[sP + 95, 1, 1], [sP + 120, -1, 1], [sP + 70, -1, 1], [sP + 150, 1, 1], [sP + 135, -1, 1], [sP + 110, 1, 1], [sP + 155, 1, 1], [sP + 85, -1, 1]];   // todos a menos de 170 m: más lejos no se asoman
  const tiradores = crearEmboscadas(scene, P, INI, EMB, { aviso: avisoCohete, disparo: () => {}, estela: estelaCohete, impacto: impactoCohete, suelo: sueloCohete, abatido: abatidoTirador }, cohetes(1));
  tiradores.rearmar(0);
  // Oleadas: una sola lista para crearDrones, en «metros» = 10 × segundos del reloj de oleadas (que solo corre en combate).
  const inicioOla = [0], finOla = [];
  const lista = [];
  for (let n = 1; n <= OLEADAS_MAX; n++) { const p = planOleada(n), dur = Math.max(...p.map((x) => x[0])) + 6; for (const [t, tipo, k] of p) lista.push([(inicioOla[n - 1] + t) * 10, tipo, k]); finOla.push(inicioOla[n - 1] + dur); inicioOla.push(inicioOla[n - 1] + dur); }
  // De dónde llegan: un abanico delante que se abre con cada oleada hasta rodear el puesto (oleada 12 en adelante).
  const lugar = () => { const abre = Math.min(Math.PI, 0.45 + 0.22 * est.ola), a2 = veh.psi + (Math.random() * 2 - 1) * abre, d = 160 + Math.random() * 70; return { x: veh.x + Math.sin(a2) * d, z: veh.z + Math.cos(a2) * d }; };
  const drones = crearDrones(scene, P, INI, lista, { lugar, aviso: avisoDron, impacto: impactoDron, choque: choqueDron, derribo: derriboDron, bomba: bombaDron, humo: humoDron });
  const propios = crearInterceptores(scene, (x, z) => P.terreno(x, z), { caza: () => {}, golpe: golpePropio, recuperado: () => { est.intN++; } });
  NOMBRES.tirador = NOMBRE_TIRADOR;
  const zonaGuerra = { erizos: [[sP + 28, 1, 5, 8], [sP + 28, -1, 5, 8]], dientes: [[sP + 55, -1, 45], [sP + 55, 1, 45]], trincheras: [[sP - 14, -1, 50, 16], [sP + 4, 1, 40, 22]],
    restos: [[sP + 130, 1, 0.5], [sP + 230, -1, -0.4], [sP - 60, 1, 2.6]], crateres: [[sP + 40, 3.8, 1.5], [sP + 85, -14, 3], [sP + 140, 22, 3.5], [sP + 200, -4.2, 1.4]], redes: [] };
  const guerra = crearGuerra(scene, P, INI, zonaGuerra, { tex: { oxido: tOxido, hormigon: tHormigon, barro: tBarro, quemado: tQuemado, tela: tTela }, vehiculo: camion.grupo, excluir: camion.carga, evitar: campos });
  const evitar = campos.concat(tiradores.lista.map((t) => ({ centro: new THREE.Vector3(t.x, t.y, t.z), radio: 3.5 })), guerra.zonas, [{ centro: new THREE.Vector3(veh.x, veh.y, veh.z), radio: 8 }]);
  const paisaje = crearPaisaje(scene, P, { tex: { abeto: iAbeto, pino: iPino, joven: iJoven, pasto: iPasto }, mod: { joven: mJoven, helecho: mHelecho, tocon: mTocon, rocas: mRocas, tronco: mTronco }, evitar, msaa: q.msaa, densidad: Math.min(1, q.distancia) });
  const humo = new Particulas(scene, Math.round(1000 * q.particulas), { aditivo: false, suave: 1 }), fuego = new Particulas(scene, Math.round(420 * q.particulas), { aditivo: true, suave: 0.75 });
  const destello = new THREE.PointLight(new THREE.Color().setRGB(1, 0.62, 0.3), 0, 60, 2); scene.add(destello);
  const frente = crearFrente(scene, P, { humo: (x, y, z) => humo.emitir(x, y, z, 0.8, 2.2, 0.3, 9 + Math.random() * 5, 9, 0.09 * luz, 0.085 * luz, 0.08 * luz, 0.5, -0.08, 0.1, 2.2), sonido: (d, pan) => { if (sonidoOn && real.listo) real.lejana(d, pan); } }, 1.3);

  // ───────────── Estado ─────────────
  const CERO = { fase: 'titulo', integ: 100, puntos: 0, ola: 0, tv: 0, respiro: 0, derribados: 0, abatidos: 0, inhCarga: 1, intN: 4, kits: KITS, reparando: 0, t: 0, causa: '' };
  const est = Object.assign({}, CERO);
  const mira = { yaw: 0, pitch: 0.06, fijo: null, acierto: 0, zoom: 0 };
  const auto = { on: false, tirador: true, equipo: true, fuego: false, error: 0 };   // error: radianes de puntería, para imitar a una persona
  let jugando = false, pausado = false, ultimo = 0, msgT = 0, radioT = 0, sonidoOn = sonidoActivo();
  const real = new SonidoReal(), colaRadio = [], hMsg = $('hMsg'), hRadio = $('hRadio');
  const mensaje = (txt, seg = 2.2, alerta = false) => { hMsg.textContent = txt; hMsg.classList.toggle('alerta', alerta); hMsg.classList.add('ver'); msgT = seg; };
  const radio = (txt) => { if (colaRadio.length < 3) colaRadio.push(txt); };
  const enemigos = () => drones.lista.concat(tiradores.lista.filter((t) => t.viva));
  const mejor = () => records.mejor('atalaya', 'puntos');
  const pintarMejor = () => { const m = mejor(); $('tRecord').textContent = m ? `Tu mejor defensa: ${m.v.toLocaleString('es-CO')} puntos · ${m.det || ''}` : 'Aún sin récord: aguanta todas las oleadas que puedas.'; };

  // ───────────── Oleadas ─────────────
  function empezarOla(n) {
    est.ola = n; est.tv = inicioOla[n - 1]; est.respiro = 0;
    const c = cohetes(n); tiradores.rearmar(c.n, [4, 22]);
    const p = planOleada(n), cuenta = {}; for (const [, tipo, k] of p) cuenta[tipo] = (cuenta[tipo] || 0) + k;
    mensaje(`Oleada ${n}`, 2.4, true);
    radio(`Mando a Sierra 07: oleada ${n}. ${Object.entries(cuenta).map(([t, k]) => `${k} ${NOMBRES[t].toLowerCase()}`).join(', ')}${c.n ? ` y ${c.n} lanzacohetes en la linde` : ''}.`);
  }
  function oleadas(dt) {
    if (est.respiro > 0) { if ((est.respiro -= dt) <= 0) empezarOla(est.ola + 1); return; }
    est.tv = Math.min(est.tv + dt, finOla[est.ola - 1]);
    const vivos = drones.lista.some((d) => d.viva);
    if (est.tv >= finOla[est.ola - 1] && !vivos) {
      const bono = 250 * est.ola; est.puntos += bono; est.integ = Math.min(100, est.integ + 15); est.intN = Math.min(6, est.intN + 1); if (est.ola % 3 === 0) est.kits++;
      for (const t of tiradores.lista) if (t.viva) { t.viva = false; t.obj.visible = false; }   // los que quedaban se retiran
      mensaje(`Oleada ${est.ola} rechazada · +${bono} puntos`, 3); radio('Mando: buen trabajo, Sierra 07. Recarguen, viene otra.');
      est.respiro = RESPIRO;
    }
  }

  // ───────────── Daño, explosiones y sonido ─────────────
  function danar(dano, causa) {
    if (est.fase !== 'juego' || dano <= 0) return;
    est.integ = Math.max(0, Math.round(est.integ - dano)); est.causa = causa; sacudida.sumar(Math.min(0.8, dano / 30)); inp.vibrar(0.6, 0.9, 260);
    if (est.integ <= 0) { est.fase = 'caida'; est.fin = 2.5; mensaje('El puesto cayó', 3, true); explosion(veh.x, veh.y + 1, veh.z, 1.4); }
  }
  const onda = (x, y, z, radio, max, causa) => { const d = Math.hypot(x - veh.x, y - veh.y - 1, z - veh.z); if (d < radio) danar(max * (1 - d / radio), causa); };
  function explosion(x, y, z, k, aire = false) {
    const n = (b) => Math.round(b * k * q.particulas) + 4;
    for (let i = 0, N = n(36); i < N; i++) { const a = Math.random() * 6.283, h = Math.random(); fuego.emitir(x, y + 0.3, z, Math.cos(a) * 5 * h * k, (aire ? (Math.random() - 0.5) * 8 : 3 + Math.random() * 9) * k, Math.sin(a) * 5 * h * k, 0.22 + Math.random() * 0.35, (1.1 + Math.random() * 1.3) * k, 2.6, 1.25 + Math.random() * 0.5, 0.3, 1, -2, 2.5, 1.6); }
    for (let i = 0, N = n(40); i < N; i++) { const g = 0.75 + Math.random() * 0.3; humo.emitir(x + (Math.random() - 0.5) * 1.2, y + 0.6 + Math.random(), z + (Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 2, 1.5 + Math.random() * 3.5, (Math.random() - 0.5) * 2, 3.5 + Math.random() * 3, (1.6 + Math.random() * 1.2) * Math.max(0.5, k), 0.2 * g * luz, 0.19 * g * luz, 0.18 * g * luz, 0.4, -0.5, 0.7, 2.4); }
    destello.position.set(x, y + 1.2, z); destello.intensity = Math.max(destello.intensity, 300 * k);
    const d = Math.hypot(x - veh.x, y - veh.y, z - veh.z); if (d < 30) sacudida.sumar(k * clamp(12 / (d + 6), 0, 0.8));
    if (sonidoOn && audio.activo() && !real.explosion(k, d)) ruido({ dur: 1.4, vol: 0.8 * clamp(25 / (d + 5), 0.15, 1) * k, tipo: 'lowpass', f: 900, f2: 60, q: 0.7 });
  }
  function avisoDron(d, que) { if (que === 'picada') mensaje(d.tipo === 'fibra' ? '¡FPV de fibra en picada! El inhibidor no lo para' : '¡Suicida en picada!', 1.6, true); else if (que === 'llamada') radio('El de reconocimiento marcó el puesto: vienen dos suicidas por detrás.'); else if (que === 'bomba') mensaje('¡Bomba soltada!', 1.4, true); }
  function impactoDron(d, p) { explosion(p.x, p.y, p.z, 0.85, true); danar(24, 'dron'); }
  function choqueDron(d, p, k) { if (d.cegado > 0 && d.tipo === 'suicida') { est.derribados++; est.puntos += 100; } explosion(p.x, p.y, p.z, k); onda(p.x, p.y, p.z, 7, 22 * k, 'dron'); }
  function derriboDron(d, p, estalla) {
    est.derribados++; est.puntos += d.tipo === 'fibra' ? 150 : d.tipo === 'bombardero' ? 130 : 100; mensaje(`${NOMBRES[d.tipo]} derribado`, 1.3);
    if (estalla) { explosion(p.x, p.y, p.z, 0.6, true); onda(p.x, p.y, p.z, 8, 14, 'dron'); }
  }
  function bombaDron(p) { explosion(p.x, p.y, p.z, 1); onda(p.x, p.y, p.z, 11, 30, 'bomba'); }
  function humoDron(p) { humo.emitir(p.x, p.y, p.z, 0, 0.5, 0, 1.4, 0.5, 0.12 * luz, 0.11 * luz, 0.1 * luz, 0.6, -0.2, 0.6, 2); }
  function golpePropio(o, e, p) { explosion(p.x, p.y, p.z, 0.5, true); }
  function avisoCohete(t, d) { mensaje(`¡Lanzacohetes a las ${reloj(t.x, t.z)}, ${Math.round(d)} m!`, 1.8, true); }
  function estelaCohete(p) { if (Math.random() < 0.6) humo.emitir(p.x, p.y, p.z, 0, 0.3, 0, 1.2, 0.35, 0.5 * luz, 0.48 * luz, 0.45 * luz, 0.5, -0.2, 0.4, 2); }
  function impactoCohete(p) { explosion(p.x, p.y, p.z, 1); danar(20, 'cohete'); }
  function sueloCohete(p, aire) { explosion(p.x, p.y, p.z, aire ? 0.5 : 0.9, aire); onda(p.x, p.y, p.z, 9, 16, 'cohete'); }
  function abatidoTirador() { est.abatidos++; est.puntos += 150; mensaje('Lanzacohetes abatido', 1.4); }
  const reloj = (x, z) => { const a = angulo(Math.atan2(x - veh.x, z - veh.z) - (veh.psi + mira.yaw)); return ((Math.round(-a / (Math.PI / 6)) % 12) + 12) % 12 || 12; };

  // ───────────── Equipo ─────────────
  let espInh = 0, espInt = 0;
  function usarInhibidor() {
    if (est.inhCarga < 1) return; est.inhCarga = 0;
    const n = drones.inhibir(veh.x, veh.y + 1, veh.z, 70, 0.6);
    mensaje((n ? `Inhibidor · ${n} ${n === 1 ? 'dron pierde' : 'drones pierden'} la señal` : 'Inhibidor · ningún dron al alcance') + (drones.inmunes ? ' · el FPV de fibra no tiene señal: derríbalo' : ''), 2.2, drones.inmunes > 0);
  }
  function lanzarInterceptor() {
    if (est.intN <= 0 || espInt > 0) return; est.intN--; espInt = 0.6;
    propios.lanzar(V.set(veh.x - Math.sin(veh.psi) * 1.8, veh.y + 1.8, veh.z - Math.cos(veh.psi) * 1.8), V2.set(0, 0, 0)); mensaje(`Interceptor en el aire · quedan ${est.intN}`, 1.6);
  }
  function reparar() { if (est.kits <= 0 || est.reparando > 0 || est.integ >= 100) return; est.kits--; est.reparando = REPARA_T; mensaje('Reparando: el cañón calla unos segundos', 2); }

  // ───────────── Puntería y disparo (la torreta de Corredor) ─────────────
  function adelanto(d, out) { torreta.boca(V3, V4); const t = d.pos.distanceTo(V3) / VEL_BALA; return out.copy(d.pos).addScaledVector(d.vel || V.set(0, 0, 0), t).add(V.set(0, 4.9 * t * t, 0)); }
  function tirarHacia(d, f) {
    adelanto(d, V2); V.subVectors(V2, camara.position).normalize();
    const yawT = angulo(Math.atan2(V.x, V.z) - veh.psi), pitchT = clamp(Math.asin(clamp(V.y, -1, 1)), -0.2, 1.15);
    mira.yaw = angulo(mira.yaw + angulo(yawT - mira.yaw) * Math.min(1, f)); mira.pitch += (pitchT - mira.pitch) * Math.min(1, f);
  }
  function apuntar(dt) {
    const [mx, my] = inp.tomarRaton(), sx = inp.e('apuntarX'), sy = inp.e('apuntarY'), k = mira.zoom > 0.5 ? 0.45 : 1;
    mira.yaw = angulo(mira.yaw + (sx * 2.3 * dt + mx * 0.0022) * k); mira.pitch = clamp(mira.pitch - (sy * 1.5 * dt + my * 0.0022) * k, -0.2, 1.15);
    mira.zoom = amort(mira.zoom, inp.p('mirar') ? 1 : 0, 10, dt); mira.fijo = null; auto.fuego = false;
    if (est.fase !== 'juego') return;
    if (auto.on && auto.tirador) {
      let elegido = null, md = 260;
      for (const d of enemigos()) if (d.viva && (d.detectada || d.tipo !== 'tirador' || d.estado === 'apunta')) { const kk = d.pos.distanceTo(camara.position) - (d.peligro ? 90 : 0); if (kk < md) { md = kk; elegido = d; } }
      if (!elegido) return;
      mira.fijo = elegido; tirarHacia(elegido, 1); if (auto.error) { mira.yaw += (Math.random() - 0.5) * 2 * auto.error; mira.pitch += (Math.random() - 0.5) * 2 * auto.error; } torreta.boca(V3, V4); adelanto(elegido, V2);
      auto.fuego = V4.angleTo(V2.sub(V3).normalize()) < 0.03 + auto.error && torreta.calor < 0.85 && elegido.pos.distanceTo(V3) < 240; return;
    }
    let mejorA = 0.13 * (1 - 0.5 * mira.zoom);   // ayuda de puntería: se fija si la mira pasa cerca de un blanco
    for (const d of enemigos()) { if (!d.viva) continue; V.subVectors(d.pos, camara.position); if (V.length() > 280) continue; const a = V.angleTo(camDir); if (a < mejorA) { mejorA = a; mira.fijo = d; } }
    if (mira.fijo) tirarHacia(mira.fijo, (inp.dispositivo === 'pad' ? 3.5 : 1.2) * dt);
  }
  function puntoMira(out) {
    const o2 = camara.position; let lejos = 300;
    for (let s = 6; s < 300; s += 6) { const x = o2.x + camDir.x * s, y = o2.y + camDir.y * s, z = o2.z + camDir.z * s; if (y < P.terreno(x, z)) { lejos = s; break; } if (y > o2.y + 60) break; }
    return out.copy(o2).addScaledVector(camDir, lejos);
  }
  function alDron(d, p) {
    if (d.tipo === 'tirador') { tiradores.impactar(d, 1); mira.acierto = 0.12; return; }
    for (let i = 0; i < 5; i++) fuego.emitir(p.x, p.y, p.z, (Math.random() - 0.5) * 7, (Math.random() - 0.5) * 7, (Math.random() - 0.5) * 7, 0.12, 0.16, 3, 2.2, 1, 1, 6, 1, 0);
    mira.acierto = 0.12; drones.impactar(d, 1);
  }
  function alSuelo(p) { for (let i = 0; i < 3; i++) humo.emitir(p.x, p.y + 0.1, p.z, (Math.random() - 0.5) * 2, 1.5 + Math.random() * 2.5, (Math.random() - 0.5) * 2, 0.7, 0.35, 0.42 * luz, 0.38 * luz, 0.3 * luz, 0.6, 3, 1, 2); }
  function combatir(dt) {
    camara.updateMatrixWorld();
    let obj; if (mira.fijo && mira.fijo.viva) obj = adelanto(mira.fijo, V2); else { obj = puntoMira(V2); torreta.boca(V3, V4); const tb = obj.distanceTo(V3) / VEL_BALA; obj.y += 4.9 * tb * tb; }
    torreta.apuntar(dt, obj);
    const tiro = torreta.gatillo(dt, est.fase === 'juego' && est.reparando <= 0 && (auto.on && auto.tirador ? auto.fuego : inp.p('disparar')));
    if (tiro) {
      const { boca: b, dir } = tiro;
      for (let i = 0; i < 3; i++) fuego.emitir(b.x, b.y, b.z, dir.x * 9 + (Math.random() - 0.5) * 2, dir.y * 9 + (Math.random() - 0.5) * 2, dir.z * 9 + (Math.random() - 0.5) * 2, 0.05 + Math.random() * 0.03, 0.32, 2.6, 1.6, 0.6, 1, 0, 6, 0.8);
      sacudida.sumar(0.02); inp.vibrar(0.12, 0.3, 45);
      if (sonidoOn && audio.activo() && !real.disparo()) { ruido({ dur: 0.09, vol: 0.32, tipo: 'bandpass', f: 1500, f2: 450, q: 0.8 }); tono({ f: 120, f2: 55, dur: 0.07, tipo: 'square', vol: 0.12, filtro: 700 }); }
    }
    torreta.actualizar(dt, enemigos(), alDron, alSuelo);
  }
  /** Piloto de pruebas: inhibe a un suicida en picada, lanza interceptores y repara en el respiro. */
  function autoEquipo() {
    if (est.inhCarga >= 1 && drones.lista.some((d) => d.viva && d.tipo === 'suicida' && d.estado === 'picada' && d.pos.distanceTo(V.set(veh.x, veh.y, veh.z)) < 60)) usarInhibidor();
    if (est.intN > 0 && drones.lista.filter((d) => d.viva && Math.hypot(d.pos.x - veh.x, d.pos.z - veh.z) < 200).length > propios.lista.length + 1) lanzarInterceptor();
    if (est.respiro > 0 && est.integ < 60) reparar();
  }

  // ───────────── Cámara ─────────────
  function moverCamara(dt) {
    const yaw = veh.psi + mira.yaw, cp = Math.cos(mira.pitch);
    camDir.set(Math.sin(yaw) * cp, Math.sin(mira.pitch), Math.cos(yaw) * cp);
    if (est.fase === 'titulo') {   // de lejos, girando despacio alrededor del puesto
      const a = performance.now() / 9000, x = veh.x + Math.sin(a) * 16, z = veh.z + Math.cos(a) * 16;
      camara.position.set(x, Math.max(veh.y + 4, P.terreno(x, z) + 2), z); camara.lookAt(veh.x, veh.y + 1.8, veh.z); camara.fov = 45;
    } else {
      camion.torreta.getWorldPosition(V); camara.position.set(V.x - camDir.x * 0.9, V.y + 0.62, V.z - camDir.z * 0.9);
      camara.lookAt(V.copy(camara.position).addScaledVector(camDir, 50)); camara.fov = 62 - 34 * mira.zoom; sacudida.aplicar(camara, dt);
    }
    camara.updateProjectionMatrix();
    sol.position.set(veh.x + C.dir.x * 200, veh.y + C.dir.y * 200, veh.z + C.dir.z * 200); sol.target.position.set(veh.x, veh.y, veh.z);
    paisaje.actualizar(camara.position, 450);
  }

  // ───────────── HUD ─────────────
  const hMira = $('hMira'), hCanon = $('hCanon');
  const blancos = Array.from({ length: 14 }, () => { const el = document.createElement('div'); el.className = 'blanco'; el.hidden = true; el.innerHTML = '<b>▲</b><span></span>'; $('hBlancos').appendChild(el); return el; });
  const barra = (id, v) => { const u = $(id); u.style.width = v + '%'; u.classList.toggle('bajo', v < 40); $(id + 'N').textContent = v + ' %'; };
  function marcar(el, p, clase, texto) {
    V.copy(p).project(camara); const delante = V.z < 1; let x = V.x, y = V.y; const dentro = delante && Math.abs(x) < 0.92 && Math.abs(y) < 0.86;
    if (!dentro) { if (!delante) { x = -x; y = -y; } const s = 1 / Math.max(Math.abs(x) / 0.9, Math.abs(y) / 0.82, 1e-3); x *= s; y *= s; }
    el.hidden = false; el.style.transform = `translate(${(x * 0.5 + 0.5) * innerWidth}px, ${(-y * 0.5 + 0.5) * innerHeight}px)`;
    el.className = 'blanco' + clase + (dentro ? '' : ' fuera'); if (!dentro) el.firstChild.style.transform = `rotate(${Math.atan2(x, y)}rad)`; el.lastChild.textContent = texto;
  }
  function pintarHud() {
    let k = 0;
    for (const d of enemigos()) { if (!d.viva || k >= blancos.length || (d.tipo === 'tirador' && d.estado !== 'apunta')) continue; marcar(blancos[k++], d.pos, (d.peligro ? ' peligro' : '') + (d === mira.fijo ? ' fijo' : '') + (d.cegado > 0 ? ' cegado' : ''), `${NOMBRES[d.tipo]} · ${Math.round(d.pos.distanceTo(camara.position))} m`); }
    for (const o2 of propios.lista) { if (k >= blancos.length) break; marcar(blancos[k++], o2.pos, ' propio', o2.blanco ? `Interceptor → ${NOMBRES[o2.blanco.tipo].toLowerCase()}` : 'Interceptor'); }
    for (; k < blancos.length; k++) blancos[k].hidden = true;
    barra('hBlindaje', est.integ); $('hInh').style.width = Math.round(est.inhCarga * 100) + '%'; $('hInhN').textContent = est.inhCarga >= 1 ? 'listo' : 'cargando';
    $('hIntN').textContent = `${est.intN} listos`; $('hRepN').textContent = est.reparando > 0 ? 'reparando…' : `${est.kits} kits`; $('hDerN').textContent = `${est.derribados} drones · ${est.abatidos} lanzacohetes`;
    $('hPuntos').textContent = est.puntos.toLocaleString('es-CO'); $('hNum').textContent = est.ola;
    const vivos = drones.lista.filter((d) => d.viva).length;
    $('hOleada').textContent = est.respiro > 0 ? `Respiro · la oleada ${est.ola + 1} llega en ${Math.ceil(est.respiro)} s` : `Oleada ${est.ola} · ${vivos} ${vivos === 1 ? 'dron' : 'drones'} en el aire`;
    $('hAvance').style.width = (est.respiro > 0 ? 100 * (1 - est.respiro / RESPIRO) : 100 * clamp((est.tv - inicioOla[est.ola - 1]) / (finOla[est.ola - 1] - inicioOla[est.ola - 1]), 0, 1)).toFixed(1) + '%';
    $('hCalor').style.width = Math.round(torreta.calor * 100) + '%'; $('hArmaT').textContent = torreta.trabada ? 'Cañón caliente' : 'Cañón';
    hMira.classList.toggle('fijo', !!mira.fijo); hMira.classList.toggle('acierto', mira.acierto > 0);
    torreta.boca(V3, V4); V.copy(V3).addScaledVector(V4, 80); V.project(camara); hCanon.hidden = V.z > 1; hCanon.style.transform = `translate(${(V.x * 0.5 + 0.5) * innerWidth}px, ${(-V.y * 0.5 + 0.5) * innerHeight}px)`;
  }

  // ───────────── Partida ─────────────
  function salir() {
    Object.assign(est, CERO, { fase: 'juego' }); Object.assign(mira, { yaw: 0, pitch: 0.06, fijo: null, zoom: 0 });
    drones.reiniciar(); torreta.reiniciar(); propios.reiniciar(); tiradores.rearmar(0); frente.reiniciar(); colaRadio.length = 0; radioT = 0; hRadio.classList.remove('ver');
    camion.verTorreta(true); menus.cerrarTodo(); jugando = true; pausado = false; $('hud').hidden = false; document.body.classList.add('corriendo');
    empezarOla(1);
  }
  function fin() {
    est.fase = 'resultado'; const previo = mejor();
    const puesto = records.registrar('atalaya', 'puntos', est.puntos, false, { det: `oleada ${est.ola} · ${est.derribados} drones` });
    $('fTitulo').textContent = 'El puesto cayó';
    $('fSub').textContent = puesto === 0 ? (previo ? `Nuevo récord: ${(est.puntos - previo.v).toLocaleString('es-CO')} puntos más que tu mejor defensa.` : 'Primera defensa registrada: ese es el puntaje a batir.') : `Tu mejor defensa sigue en ${previo.v.toLocaleString('es-CO')} puntos.`;
    const filas = [['Oleadas aguantadas', String(est.ola - 1)], ['Drones derribados', String(est.derribados)], ['Lanzacohetes abatidos', String(est.abatidos)], ['Total', est.puntos.toLocaleString('es-CO')]];
    $('fTabla').innerHTML = filas.map(([a, b], i) => `<tr${i === filas.length - 1 ? ' class="yo"' : ''}><td>${a}</td><td></td><td>${b}</td></tr>`).join('');
    document.body.classList.remove('corriendo'); $('hud').hidden = true; camion.verTorreta(false); if (document.exitPointerLock && document.pointerLockElement) document.exitPointerLock();
    menus.abrir($('pFin'), 0);
  }

  // ───────────── Menús ─────────────
  $('tablaCtl').innerHTML = '<tr><th>Acción</th><th>Teclado</th><th>Mando</th></tr>' + DEF.controles.map(([a, t, m]) => `<tr><td>${a}</td><td>${t}</td><td>${m}</td></tr>`).join('');
  opcion($('mCal'), NIVELES, nivel, 'Calidad', (v) => { fijarCalidad(v); location.reload(); });
  function pintarSonido() { for (const id of ['mSonido', 'pSonido']) $(id).innerHTML = `<span>Sonido</span><b>‹ ${sonidoOn ? 'sí' : 'no'} ›</b>`; }
  for (const id of ['mSonido', 'pSonido']) { const b = $(id), cambiar = () => { sonidoOn = !sonidoOn; fijarSonido(sonidoOn); pintarSonido(); if (sonidoOn) ui.ok(); }; b.dataset.nav = 'opcion'; b.addEventListener('click', cambiar); b.addEventListener('ajustar', cambiar); }
  pintarSonido();
  const lienzo = $('lienzo');
  const pausar = () => { if (!jugando || pausado || menus.abierto) return; pausado = true; document.body.classList.remove('corriendo'); if (document.exitPointerLock && document.pointerLockElement) document.exitPointerLock(); menus.abrir($('pPausa'), 0); };
  const seguir = () => { pausado = false; menus.cerrarTodo(); document.body.classList.add('corriendo'); };
  const alMenu = () => { jugando = false; pausado = false; Object.assign(est, CERO); $('hud').hidden = true; camion.verTorreta(false); drones.reiniciar(); propios.reiniciar(); tiradores.rearmar(0); document.body.classList.remove('corriendo'); menus.cerrarTodo(); pintarMejor(); menus.abrir($('pTitulo'), 0); };
  lienzo.addEventListener('click', () => { if (jugando && !pausado && !menus.abierto && est.fase === 'juego' && lienzo.requestPointerLock && document.pointerLockElement !== lienzo) lienzo.requestPointerLock(); });
  lienzo.addEventListener('contextmenu', (e) => e.preventDefault());
  document.addEventListener('pointerlockchange', () => { if (!document.pointerLockElement && jugando && est.fase === 'juego') pausar(); });
  $('mJugar').addEventListener('click', () => { iniciarAudio(); ui.ok(); salir(); });
  for (const id of ['mCtl', 'pCtl']) $(id).addEventListener('click', () => { ui.ok(); menus.abrir($('pControles'), 0); });
  $('cVolver').addEventListener('click', () => { ui.atras(); menus.cerrar(); });
  $('mSalir').addEventListener('click', () => { location.href = '../juegos.html'; });
  $('pSeguir').addEventListener('click', seguir); $('pReiniciar').addEventListener('click', () => { ui.ok(); salir(); }); $('pMenu').addEventListener('click', alMenu);
  $('fOtra').addEventListener('click', () => { ui.ok(); salir(); }); $('fMenu').addEventListener('click', alMenu);
  document.addEventListener('visibilitychange', () => { if (document.hidden) pausar(); });
  inp.alPerderPad = () => pausar();
  addEventListener('keydown', (e) => { if (e.code === 'F3') { e.preventDefault(); medidor.alternar(); } });

  // ───────────── Bucle ─────────────
  function cuadro(t) { requestAnimationFrame(cuadro); const dt = Math.min(0.05, (t - ultimo) / 1000 || 0.016); ultimo = t; medidor.inicio(); logica(dt); composer.render(); medidor.fin(dt); }
  function logica(dt) {
    inp.actualizar();
    if (!audio.activo() && inp.botones[BOTON.A] > 0.5 && inp.previos[BOTON.A] <= 0.5) iniciarAudio();
    let combate = false;
    if (menus.abierto) { menus.actualizar(dt); if (pausado && inp.botones[BOTON.START] > 0.5 && inp.previos[BOTON.START] <= 0.5) $('pSeguir').click(); }
    else if (jugando) {
      if (inp.j('pausa')) pausar();
      else {
        combate = true; est.t += dt; apuntar(dt);
        if (est.fase === 'juego') {
          if (inp.j('inhibidor')) usarInhibidor(); if (inp.j('interceptor')) lanzarInterceptor(); if (inp.j('reparar')) reparar(); if (inp.j('centrar')) { mira.yaw = 0; mira.pitch = 0.06; }
          if (auto.on && auto.equipo) autoEquipo();
          est.inhCarga = Math.min(1, est.inhCarga + dt / 14); espInt -= dt;
          if (est.reparando > 0 && (est.reparando -= dt) <= 0) { est.integ = Math.min(100, est.integ + REPARA); mensaje(`Reparado · blindaje ${est.integ} %`, 1.6); }
          oleadas(dt);
        }
        for (const d of drones.lista) if (!d.detectada && Math.hypot(d.pos.x - veh.x, d.pos.z - veh.z) < 300) d.detectada = true;   // sin radar: desde la atalaya se ven a 300 m
        drones.actualizar(dt, veh, est.fase === 'juego' && est.respiro <= 0, est.t, false, est.tv * 10);
        tiradores.actualizar(dt, veh, est.fase === 'juego', false);
        propios.actualizar(dt, drones.lista, V3.set(veh.x, veh.y, veh.z), V4.set(0, 0, 0), est.t);
        frente.actualizar(dt, veh, camara, est.fase === 'juego');
        if (radioT > 0) { if ((radioT -= dt) <= 0) { hRadio.classList.remove('ver'); if (sonidoOn && real.radio) real.radio.pitido(); } }
        else if (colaRadio.length) { const txt = colaRadio.shift(); hRadio.textContent = txt; hRadio.classList.add('ver'); radioT = 2.8 + txt.length * 0.035; if (sonidoOn && audio.activo() && real.radio) real.radio.voz(radioT); }
        for (const p of guerra.humeantes) if (Math.random() < 0.15) humo.emitir(p.x + (Math.random() - 0.5) * 1.5, p.y, p.z + (Math.random() - 0.5) * 2, 0.4, 1.2 + Math.random(), 0.2, 2.6 + Math.random(), 0.7, 0.07 * luz, 0.065 * luz, 0.06 * luz, 0.5, -0.15, 0.5, 3.5);
        if (est.fase === 'caida' && (est.fin -= dt) <= 0) fin();
      }
    }
    if (!pausado) { humo.actualizar(dt, camara, altoPx); fuego.actualizar(dt, camara, altoPx); destello.intensity *= Math.exp(-dt * 9); mira.acierto -= dt; if (msgT > 0 && (msgT -= dt) <= 0) hMsg.classList.remove('ver'); }
    camion.grupo.updateMatrixWorld(true);
    moverCamara(dt);
    if (combate && est.fase !== 'resultado') combatir(dt);
    if (jugando && !$('hud').hidden) pintarHud();
    if (sonidoOn && audio.activo()) { real.cargar(); real.actualizar({ activo: jugando && !pausado && est.fase === 'juego', rn: 0.03, gas: 0, corte: false }, dt); }
  }
  tamano(); $('cargando').remove(); pintarMejor(); menus.abrir($('pTitulo'), 0); requestAnimationFrame(cuadro);
  // Para pruebas desde la consola. El juego no lo usa.
  window.__at = { est, auto, drones, tiradores, propios, torreta, camion, veh, P, renderer, scene, camara, composer, medidor, paisaje, mira, salir, usarInhibidor, lanzarInterceptor, reparar,
    simular: (seg, dt = 1 / 60) => { for (let t = 0; t < seg; t += dt) logica(dt); }, sonido: () => ({ activado: sonidoOn, contexto: audio.ctx ? audio.ctx.state : null }) };
}
iniciar().catch((e) => { console.error(e); $('cargando').textContent = 'No se pudo cargar la atalaya: ' + e.message; });
