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
import { crearAereo, crearBateria, TIPOS_AEREOS, SAM, AM, SUELTA, PASADA } from './at-aereo.js';
import { crearMesa } from './at-mando.js';

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
/** Amenazas aéreas de la oleada: misiles de crucero desde la 2 y aviones desde la 3 (uno alto y otro rasante, alternados). */
export function planAereo(n) {
  const p = [], cru = n >= 2 ? Math.min(8, Math.floor(n / 2)) : 0, caz = n >= 3 ? Math.min(6, 1 + Math.floor((n - 3) / 3)) : 0;
  for (let k = 0; k < cru; k++) p.push([7 + k * 8, 'crucero']);
  for (let k = 0; k < caz; k++) p.push([3 + k * 12, k % 2 ? 'rasante' : 'caza']);
  return p.sort((a, b) => a[0] - b[0]);
}
/** Lanzacohetes por oleada y cómo apuntan (más rápido con cada oleada). */
const cohetes = (n) => ({ n: Math.min(8, Math.floor(n / 2)), apunta: Math.max(0.9, 1.7 - 0.06 * n), recarga: Math.max(4, 8 - 0.3 * n) });
const SAM_MAX = 8, AM_MAX = 10, VISTAS = { torreta: 'Torreta', mando: 'Puesto de mando · mesa táctica', libre: 'Cámara libre' };

const inp = new Entrada({
  acciones: { disparar: { k: ['Mouse0', 'KeyF'], b: [BOTON.RT, BOTON.RB] }, mirar: { k: ['Mouse2'], b: [BOTON.LT] }, centrar: { k: ['KeyV'], b: [BOTON.R3] },
    inhibidor: { k: ['KeyQ'], b: [BOTON.LB] }, interceptor: { k: ['KeyE'], b: [BOTON.B] }, reparar: { k: ['KeyT'], b: [BOTON.A] },
    vista: { k: ['KeyC'], b: [BOTON.Y] }, misil: { k: ['KeyG'], b: [BOTON.X] }, modo: { k: ['KeyM'], b: [BOTON.SELECT] },
    siguiente: { k: ['KeyR', 'Tab'], b: [BOTON.DER] }, anterior: { k: ['KeyZ'], b: [BOTON.IZQ] } },
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
  // Defensa antiaérea: lanzador de misiles de alto alcance con su radar, y antimisil de corto alcance, cada uno tras sacos.
  const sitio = (ds, lat) => { const meta = P.dist[iP] + ds; let i = iP; while (i > 0 && P.dist[i] > meta) i--; while (i < P.n - 1 && P.dist[i] < meta) i++;
    const x = P.px[i] + P.rx[i] * lat, z = P.pz[i] + P.rz[i] * lat; return { pos: new THREE.Vector3(x, P.terreno(x, z), z), giro: Math.atan2(P.tx[i], P.tz[i]) }; };
  const sSam = sitio(-34, 15), sAm = sitio(14, 15);
  const bSam = crearBateria(scene, tMet, RC.mats.hesco, sSam.pos, sSam.giro, { tubos: [2, 2], largo: 5.2, radio: 0.36, radar: true });
  const bAm = crearBateria(scene, tMet, RC.mats.hesco, sAm.pos, sAm.giro, { tubos: [4, 3], largo: 2.6, radio: 0.13 });
  const PUESTO = new THREE.Vector3(veh.x, veh.y, veh.z);
  const aereo = crearAereo(scene, tMet, { estela: estelaAerea, impacto: impactoAereo, derribo: derriboAereo, lanza: lanzaAereo, estalla: estallaPropio, bengalas: bengalasAereo }, (x, z) => P.terreno(x, z));
  const mesa = crearMesa(P, PUESTO, { sam: SAM.alcance, am: AM.alcance });
  const esAereo = (d) => d && d.tipo in TIPOS_AEREOS;
  Object.assign(NOMBRES, { caza: 'Avión de combate', crucero: 'Misil de crucero', misil: 'Misil' });
  const EMB = [[sP + 95, 1, 1], [sP + 120, -1, 1], [sP + 70, -1, 1], [sP + 150, 1, 1], [sP + 135, -1, 1], [sP + 110, 1, 1], [sP + 155, 1, 1], [sP + 85, -1, 1]];   // todos a menos de 170 m: más lejos no se asoman
  const tiradores = crearEmboscadas(scene, P, INI, EMB, { aviso: avisoCohete, disparo: () => {}, estela: estelaCohete, impacto: impactoCohete, suelo: sueloCohete, abatido: abatidoTirador }, cohetes(1));
  tiradores.rearmar(0);
  // Oleadas: una sola lista para crearDrones, en «metros» = 10 × segundos del reloj de oleadas (que solo corre en combate).
  const inicioOla = [0], finOla = [];
  const lista = [];
  for (let n = 1; n <= OLEADAS_MAX; n++) { const p = planOleada(n), dur = Math.max(...p.map((x) => x[0]), ...planAereo(n).map((x) => x[0])) + 6; for (const [t, tipo, k] of p) lista.push([(inicioOla[n - 1] + t) * 10, tipo, k]); finOla.push(inicioOla[n - 1] + dur); inicioOla.push(inicioOla[n - 1] + dur); }
  const colaAire = [];   // [segundo del reloj de oleadas, tipo] de la oleada en curso
  // De dónde llegan: un abanico delante que se abre con cada oleada hasta rodear el puesto (oleada 12 en adelante).
  const lugar = () => { const abre = Math.min(Math.PI, 0.45 + 0.22 * est.ola), a2 = veh.psi + (Math.random() * 2 - 1) * abre, d = 160 + Math.random() * 70; return { x: veh.x + Math.sin(a2) * d, z: veh.z + Math.cos(a2) * d }; };
  const drones = crearDrones(scene, P, INI, lista, { lugar, aviso: avisoDron, impacto: impactoDron, choque: choqueDron, derribo: derriboDron, bomba: bombaDron, humo: humoDron });
  const propios = crearInterceptores(scene, (x, z) => P.terreno(x, z), { caza: () => {}, golpe: golpePropio, recuperado: () => { est.intN++; } });
  NOMBRES.tirador = NOMBRE_TIRADOR;
  const zonaGuerra = { erizos: [[sP + 28, 1, 5, 8], [sP + 28, -1, 5, 8]], dientes: [[sP + 55, -1, 45], [sP + 55, 1, 45]], trincheras: [[sP - 14, -1, 50, 16], [sP + 4, 1, 40, 22]],
    restos: [[sP + 130, 1, 0.5], [sP + 230, -1, -0.4], [sP - 60, 1, 2.6]], crateres: [[sP + 40, 3.8, 1.5], [sP + 85, -14, 3], [sP + 140, 22, 3.5], [sP + 200, -4.2, 1.4]], redes: [] };
  const guerra = crearGuerra(scene, P, INI, zonaGuerra, { tex: { oxido: tOxido, hormigon: tHormigon, barro: tBarro, quemado: tQuemado, tela: tTela }, vehiculo: camion.grupo, excluir: camion.carga, evitar: campos });
  const evitar = campos.concat(tiradores.lista.map((t) => ({ centro: new THREE.Vector3(t.x, t.y, t.z), radio: 3.5 })), guerra.zonas, [{ centro: new THREE.Vector3(veh.x, veh.y, veh.z), radio: 8 }],
    [{ centro: sSam.pos, radio: 9 }, { centro: sAm.pos, radio: 7 }]);
  const paisaje = crearPaisaje(scene, P, { tex: { abeto: iAbeto, pino: iPino, joven: iJoven, pasto: iPasto }, mod: { joven: mJoven, helecho: mHelecho, tocon: mTocon, rocas: mRocas, tronco: mTronco }, evitar, msaa: q.msaa, densidad: Math.min(1, q.distancia) });
  const humo = new Particulas(scene, Math.round(1000 * q.particulas), { aditivo: false, suave: 1 }), fuego = new Particulas(scene, Math.round(420 * q.particulas), { aditivo: true, suave: 0.75 });
  const estelas = new Particulas(scene, Math.round(3600 * q.particulas), { aditivo: false, suave: 1 }), brillo = new Particulas(scene, Math.round(500 * q.particulas), { aditivo: true, suave: 0.6 });
  const destello = new THREE.PointLight(new THREE.Color().setRGB(1, 0.62, 0.3), 0, 60, 2); scene.add(destello);
  const frente = crearFrente(scene, P, { humo: (x, y, z) => humo.emitir(x, y, z, 0.8, 2.2, 0.3, 9 + Math.random() * 5, 9, 0.09 * luz, 0.085 * luz, 0.08 * luz, 0.5, -0.08, 0.1, 2.2), sonido: (d, pan) => { if (sonidoOn && real.listo) real.lejana(d, pan); } }, 1.3);

  // ───────────── Estado ─────────────
  const CERO = { fase: 'titulo', integ: 100, puntos: 0, ola: 0, tv: 0, respiro: 0, derribados: 0, abatidos: 0, inhCarga: 1, intN: 4, kits: KITS, reparando: 0, t: 0, causa: '',
    sam: SAM_MAX, am: AM_MAX, samAuto: false, aviones: 0, misiles: 0, vista: 'torreta' };
  const est = Object.assign({}, CERO);
  const mira = { yaw: 0, pitch: 0.06, fijo: null, acierto: 0, zoom: 0 };
  const auto = { on: false, tirador: true, equipo: true, fuego: false, error: 0 };   // error: radianes de puntería, para imitar a una persona
  let jugando = false, pausado = false, ultimo = 0, msgT = 0, radioT = 0, sonidoOn = sonidoActivo();
  const real = new SonidoReal(), colaRadio = [], hMsg = $('hMsg'), hRadio = $('hRadio');
  const mensaje = (txt, seg = 2.2, alerta = false) => { hMsg.textContent = txt; hMsg.classList.toggle('alerta', alerta); hMsg.classList.add('ver'); msgT = seg; };
  const radio = (txt) => { if (colaRadio.length < 3) colaRadio.push(txt); };
  const enemigos = () => drones.lista.concat(tiradores.lista.filter((t) => t.viva), aereo.lista.filter((e) => e.detectada));
  let sel = null;   // pista elegida en la mesa táctica
  const mejor = () => records.mejor('atalaya', 'puntos');
  const pintarMejor = () => { const m = mejor(); $('tRecord').textContent = m ? `Tu mejor defensa: ${m.v.toLocaleString('es-CO')} puntos · ${m.det || ''}` : 'Aún sin récord: aguanta todas las oleadas que puedas.'; };

  // ───────────── Oleadas ─────────────
  function empezarOla(n) {
    est.ola = n; est.tv = inicioOla[n - 1]; est.respiro = 0;
    const c = cohetes(n); tiradores.rearmar(c.n, [4, 22]);
    const p = planOleada(n), cuenta = {}; for (const [, tipo, k] of p) cuenta[tipo] = (cuenta[tipo] || 0) + k;
    colaAire.length = 0; for (const [t, tipo] of planAereo(n)) colaAire.push([inicioOla[n - 1] + t, tipo]);
    const aviones = colaAire.filter((x) => x[1] !== 'crucero').length, cruceros = colaAire.length - aviones;
    mensaje(`Oleada ${n}`, 2.4, true);
    radio(`Mando a Sierra 07: oleada ${n}. ${Object.entries(cuenta).map(([t, k]) => `${k} ${NOMBRES[t].toLowerCase()}`).join(', ')}${c.n ? `, ${c.n} lanzacohetes en la linde` : ''}${aviones ? `, ${aviones} ${aviones === 1 ? 'avión' : 'aviones'}` : ''}${cruceros ? `, ${cruceros} de crucero` : ''}.`);
  }
  /** Nace una amenaza aérea en el abanico de la oleada: el avión a 11 km, el de crucero a 7 km y bajo los árboles del radar. */
  function nacerAereo(tipo) {
    const abre = Math.min(Math.PI, 0.6 + 0.15 * est.ola), a = veh.psi + (Math.random() * 2 - 1) * abre;
    const e = tipo === 'crucero' ? aereo.nacer('crucero', PUESTO, a, 7000, 26 + Math.random() * 12) : aereo.nacer('caza', PUESTO, a, 11000, tipo === 'rasante' ? 200 + Math.random() * 60 : 800 + Math.random() * 500);
    if (e.detectada) radio(e.rasante ? `Radar: avión rasante a ${km(e)}, viene a pasar por encima.` : `Radar: avión de combate a ${km(e)}, ${Math.round(e.pos.y - PUESTO.y)} m de altura.`);
  }
  const km = (e) => { const d = Math.hypot(e.pos.x - PUESTO.x, e.pos.z - PUESTO.z); return d < 1000 ? `${Math.round(d)} m` : `${(d / 1000).toLocaleString('es-CO', { maximumFractionDigits: 1 })} km`; };
  function oleadas(dt) {
    if (est.respiro > 0) { if ((est.respiro -= dt) <= 0) empezarOla(est.ola + 1); return; }
    est.tv = Math.min(est.tv + dt, finOla[est.ola - 1]);
    while (colaAire.length && est.tv >= colaAire[0][0]) nacerAereo(colaAire.shift()[1]);
    const vivos = drones.lista.some((d) => d.viva) || colaAire.length > 0 || aereo.lista.some((e) => e.viva && (e.tipo !== 'caza' || e.estado === 'aproxima'));
    if (est.tv >= finOla[est.ola - 1] && !vivos) {
      const bono = 250 * est.ola; est.puntos += bono; est.integ = Math.min(100, est.integ + 15); est.intN = Math.min(6, est.intN + 1); if (est.ola % 3 === 0) est.kits++;
      est.sam = Math.min(SAM_MAX, est.sam + 4); est.am = Math.min(AM_MAX, est.am + 5);
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

  // Aéreos: estelas, impactos, derribos. Lo lejano se agranda con la distancia para que se vea (un avión a 4 km es un punto).
  const lejania = (p) => Math.max(1, p.distanceTo(camara.position) / 700);
  function estelaAerea(p, tipo, e) {
    if (tipo === 'caza') {
      if (e.pos.y - PUESTO.y > 500) { if (Math.random() < 0.5) estelas.emitir(p.x, p.y, p.z, 0, 0, 0, 10, 5, 0.72 * luz, 0.73 * luz, 0.76 * luz, 0.5, 0, 0, 1.3); }   // estela de condensación
      else if (Math.random() < 0.6) estelas.emitir(p.x, p.y, p.z, 0, 0, 0, 1.8, 2.4, 0.16 * luz, 0.15 * luz, 0.14 * luz, 0.28, 0, 0, 2);
      brillo.emitir(p.x - e.vel.x * 0.04, p.y - e.vel.y * 0.04, p.z - e.vel.z * 0.04, 0, 0, 0, 0.05, 1.6 * lejania(p), 3, 1.5, 0.6, 1, 0, 0, 0);
      return;
    }
    const sam = tipo === 'sam', am = tipo === 'am', f = lejania(p);
    if (!am || Math.random() < 0.7) estelas.emitir(p.x, p.y, p.z, (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.8, sam ? 5.5 : am ? 2 : 3, (sam ? 2.2 : am ? 1 : 1.5) * Math.min(f, 2.5), 0.66 * luz, 0.65 * luz, 0.63 * luz, sam || am ? 0.62 : 0.45, -0.05, 0.3, sam ? 1.5 : 1.1);
    brillo.emitir(p.x, p.y, p.z, 0, 0, 0, 0.05, (sam ? 1.5 : 0.8) * f, 3, 1.5, 0.55, 1, 0, 0, 0);
  }
  /** Bola de fuego en el aire, del tamaño que se ve desde donde mira la cámara. */
  function estallidoAereo(p, k) {
    const f = lejania(p), d = p.distanceTo(camara.position);
    if (d < 350) { explosion(p.x, p.y, p.z, k, true); return; }
    for (let i = 0; i < 22; i++) { const a = Math.random() * 6.283, b = Math.random() * 2 - 1, s = (5 + Math.random() * 12) * k, c = Math.sqrt(1 - b * b); brillo.emitir(p.x, p.y, p.z, Math.cos(a) * s * c, b * s, Math.sin(a) * s * c, 0.25 + Math.random() * 0.4, (1.6 + Math.random() * 1.6) * k * f, 3, 1.5, 0.5, 1, 0, 2, 1.5); }
    for (let i = 0; i < 14; i++) estelas.emitir(p.x + (Math.random() - 0.5) * 4 * k, p.y + (Math.random() - 0.5) * 4 * k, p.z + (Math.random() - 0.5) * 4 * k, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3, 5 + Math.random() * 4, (2.5 + Math.random() * 2) * k * Math.min(f, 4), 0.11 * luz, 0.1 * luz, 0.09 * luz, 0.75, -0.1, 0.5, 1.2);
    if (sonidoOn && audio.activo()) real.explosion(k, d);
  }
  // Restos de un avión derribado: caen ardiendo y dejan humo hasta el suelo.
  const caidos = [];
  function moverCaidos(dt) {
    for (let i = caidos.length - 1; i >= 0; i--) {
      const c = caidos[i]; c.t += dt; c.v.y -= 9.8 * dt; c.v.multiplyScalar(1 - dt * 0.12); c.p.addScaledVector(c.v, dt); const f = Math.min(lejania(c.p), 4);
      if (Math.random() < 0.5) estelas.emitir(c.p.x, c.p.y, c.p.z, 0, 0, 0, 6, (2.5 + c.t * 0.3) * f, 0.07 * luz, 0.065 * luz, 0.06 * luz, 0.7, -0.1, 0.2, 1.3);
      brillo.emitir(c.p.x, c.p.y, c.p.z, 0, 0, 0, 0.07, 2 * f, 3, 1.4, 0.4, 1, 0, 0, 0);
      if (c.p.y < P.terreno(c.p.x, c.p.z) || c.t > 40) { if (c.p.distanceTo(camara.position) < 1500) explosion(c.p.x, c.p.y, c.p.z, 0.8); caidos.splice(i, 1); }
    }
  }
  function impactoAereo(e, p, enSuelo) {
    explosion(p.x, p.y, p.z, e.tipo === 'crucero' ? 1.8 : 1.3);
    if (enSuelo) onda(p.x, p.y, p.z, 16, e.def.dano * 0.8, e.tipo); else { danar(e.def.dano, e.tipo); mensaje(`${NOMBRES[e.tipo]} impactó el puesto`, 2, true); }
    if (sel === e) sel = null;
  }
  function derriboAereo(e, p) {
    est.puntos += e.def.puntos; if (e.tipo === 'caza') est.aviones++; else est.misiles++;
    estallidoAereo(p, e.tipo === 'caza' ? 2.2 : 0.9);
    if (e.tipo === 'caza') { for (let i = 0; i < 4; i++) caidos.push({ p: p.clone(), v: e.vel.clone().multiplyScalar(0.35 + Math.random() * 0.3).add(V.set((Math.random() - 0.5) * 40, Math.random() * 25, (Math.random() - 0.5) * 40)), t: 0 }); radio('Radar: avión derribado. Buen tiro, Sierra 07.'); }
    mensaje(`${NOMBRES[e.tipo]} derribado · +${e.def.puntos}`, 1.6);
    if (sel === e) sel = null;
  }
  function lanzaAereo(e) { mensaje(e.rasante ? '¡El rasante soltó un misil! Viene bajo' : '¡Misil lanzado desde el avión!', 1.6, true); }
  function estallaPropio(p, clase, fallo) { estallidoAereo(p, clase === 'sam' ? 0.7 : 0.4); if (fallo && clase === 'sam') mensaje('Misil perdido: se fue tras las bengalas o se acabó el vuelo', 1.6); }
  function bengalasAereo(e) {
    const f = lejania(e.pos);
    for (let i = 0; i < 12; i++) brillo.emitir(e.pos.x, e.pos.y, e.pos.z, e.vel.x * 0.15 + (Math.random() - 0.5) * 50, -5 - Math.random() * 20, e.vel.z * 0.15 + (Math.random() - 0.5) * 50, 2.4 + Math.random(), 2.2 * f, 4, 3.2, 2.2, 1, 6, 0.6, 0);
    mensaje('El avión rompe y suelta bengalas', 1.3);
  }

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

  // ───────────── Defensa antiaérea ─────────────
  // Misil de alto alcance: lo disparas tú (o la batería en automático, que tira de a dos y gasta más). Antimisil: siempre
  // automático contra lo que entra a 1,7 km. Se recargan en el respiro.
  let espSam = 0, espAm = 0;
  const lejos = (e) => Math.hypot(e.pos.x - PUESTO.x, e.pos.z - PUESTO.z);
  /** Segundos que faltan para que haga daño: el avión, hasta soltar sus misiles; el misil, hasta llegar. */
  function urgencia(e) { const d = lejos(e); if (e.tipo === 'caza') return e.estado === 'aproxima' ? Math.max(0, d - (e.rasante ? PASADA : SUELTA)) / e.def.vel : 900; return d / e.def.vel; }
  function prioritario() {
    let mejorE = null, m = Infinity;
    for (const e of aereo.lista) { if (!e.viva || !e.detectada || lejos(e) > SAM.alcance) continue; const u = urgencia(e) + e.sam * 40; if (u < m) { m = u; mejorE = e; } }
    return mejorE;
  }
  function lanzarMisil(b) {
    if (est.fase !== 'juego' || espSam > 0) return false;
    if (!esAereo(b) || !b.viva) b = prioritario();
    if (!b) { mensaje('Sin blanco aéreo al alcance del misil', 1.4); return false; }
    if (est.sam <= 0) { mensaje('Sin misiles: la recarga llega con el respiro', 1.6, true); return false; }
    if (lejos(b) > SAM.alcance) { mensaje(`Fuera de alcance: ${km(b)}. El misil llega a 8 km`, 1.6); return false; }
    est.sam--; espSam = 0.8; bSam.boca(V, V2); aereo.disparar('sam', V, V2, b);
    for (let i = 0; i < 30; i++) humo.emitir(V.x - V2.x * 3, V.y - V2.y * 3, V.z - V2.z * 3, -V2.x * 7 + (Math.random() - 0.5) * 7, 0.5 + Math.random() * 3, -V2.z * 7 + (Math.random() - 0.5) * 7, 4 + Math.random() * 3, 2.4 + Math.random() * 2, 0.55 * luz, 0.54 * luz, 0.52 * luz, 0.6, -0.1, 0.6, 1.4);
    for (let i = 0; i < 10; i++) fuego.emitir(V.x, V.y, V.z, -V2.x * 20 + (Math.random() - 0.5) * 8, -V2.y * 20 + (Math.random() - 0.5) * 8, -V2.z * 20 + (Math.random() - 0.5) * 8, 0.2, 1.6, 3, 1.6, 0.6, 1, 0, 3, 1);
    destello.position.copy(V); destello.intensity = Math.max(destello.intensity, 420);
    if (sonidoOn && audio.activo()) real.explosion(0.35, V.distanceTo(camara.position));
    mensaje(`Misil en vuelo → ${NOMBRES[b.tipo].toLowerCase()} a ${km(b)} · quedan ${est.sam}`, 1.8);
    return true;
  }
  function lanzarAntimisil(b) {
    est.am--; espAm = 0.45; bAm.boca(V, V2); aereo.disparar('am', V, V2, b);
    for (let i = 0; i < 10; i++) humo.emitir(V.x, V.y, V.z, -V2.x * 5 + (Math.random() - 0.5) * 4, Math.random() * 2, -V2.z * 5 + (Math.random() - 0.5) * 4, 2.5 + Math.random() * 2, 1.4 + Math.random(), 0.55 * luz, 0.54 * luz, 0.52 * luz, 0.55, -0.1, 0.6, 1.4);
    destello.position.copy(V); destello.intensity = Math.max(destello.intensity, 200);
    if (sonidoOn && audio.activo()) real.explosion(0.15, V.distanceTo(camara.position));
  }
  function defensa(dt) {
    espSam -= dt; espAm -= dt; bSam.girar(dt);
    for (const e of aereo.lista) if (e.detectada && e.visto < 0) { e.visto = est.t; if (e.tipo === 'crucero') { radio(`Radar: misil de crucero a ${km(e)}, rasante.`); mensaje('¡Misil de crucero en el radar!', 1.8, true); } }
    const obj = esAereo(sel) && sel.viva ? sel : prioritario(); if (obj) bSam.apuntar(dt, obj.pos);
    let cerca = null, dc = AM.alcance;
    for (const e of aereo.lista) if (e.viva && e.detectada && e.tipo !== 'caza' && e.am === 0) { const d = e.pos.distanceTo(PUESTO); if (d < dc) { dc = d; cerca = e; } }
    if (cerca) { bAm.apuntar(dt, cerca.pos); if (est.am > 0 && espAm <= 0 && est.fase === 'juego') lanzarAntimisil(cerca); }
    if (est.samAuto && est.fase === 'juego' && est.sam > 0 && espSam <= 0)
      for (const e of aereo.lista) {
        if (!e.viva || !e.detectada || e.sam >= 2 || est.t - e.visto < 1.5 || lejos(e) > SAM.alcance) continue;
        if (e.tipo === 'caza' ? e.estado !== 'aproxima' : lejos(e) < 2200) continue;
        lanzarMisil(e); break;
      }
  }
  function cambiarModo() { est.samAuto = !est.samAuto; mensaje(est.samAuto ? 'Batería en automático: tira de a dos misiles por blanco' : 'Batería en manual: tú eliges a qué tirarle', 2); }
  const puntaje = (d) => esAereo(d) ? urgencia(d) : d.pos.distanceTo(PUESTO) / 30;
  function elegir(paso) {
    const l = enemigos().filter((d) => d.viva && (d.tipo !== 'tirador' || d.estado === 'apunta')).sort((a, b) => puntaje(a) - puntaje(b));
    if (!l.length) { sel = null; mensaje('Sin pistas en el radar', 1.2); return; }
    const k = l.indexOf(sel); sel = l[k < 0 ? 0 : (k + paso + l.length) % l.length]; mensaje(`Pista: ${NOMBRES[sel.tipo]} · ${km(sel)}`, 1.2);
  }

  // ───────────── Puntería y disparo (la torreta de Corredor) ─────────────
  function adelanto(d, out) { torreta.boca(V3, V4); const t = d.pos.distanceTo(V3) / VEL_BALA; return out.copy(d.pos).addScaledVector(d.vel || V.set(0, 0, 0), t).add(V.set(0, 4.9 * t * t, 0)); }
  function tirarHacia(d, f) {
    adelanto(d, V2); V.subVectors(V2, camara.position).normalize();
    const yawT = angulo(Math.atan2(V.x, V.z) - veh.psi), pitchT = clamp(Math.asin(clamp(V.y, -1, 1)), -0.2, 1.15);
    mira.yaw = angulo(mira.yaw + angulo(yawT - mira.yaw) * Math.min(1, f)); mira.pitch += (pitchT - mira.pitch) * Math.min(1, f);
  }
  // Fuera de la vista de la torreta (o con el piloto) el cañón lo maneja el artillero: algo menos fino que el piloto de pruebas.
  const artillero = () => est.vista !== 'torreta' || (auto.on && auto.tirador);
  function apuntar(dt) {
    const [mx, my] = inp.tomarRaton(), sx = inp.e('apuntarX'), sy = inp.e('apuntarY'), k = mira.zoom > 0.5 ? 0.45 : 1;
    if (est.vista === 'mando') { vc.mesaYaw += sx * 1.6 * dt + mx * 0.004; vc.mesaPitch = clamp(vc.mesaPitch - (sy * 1.2 * dt + my * 0.003), 0.4, 1.4); }
    else if (est.vista === 'libre') { vc.yaw += sx * 1.8 * dt + mx * 0.003; vc.pitch = clamp(vc.pitch + (sy * 1.2 * dt + my * 0.003), 0.04, 1.3); }
    else { mira.yaw = angulo(mira.yaw + (sx * 2.3 * dt + mx * 0.0022) * k); mira.pitch = clamp(mira.pitch - (sy * 1.5 * dt + my * 0.0022) * k, -0.2, 1.15); }
    mira.zoom = amort(mira.zoom, est.vista === 'torreta' && inp.p('mirar') ? 1 : 0, 10, dt); mira.fijo = null; auto.fuego = false;
    if (est.fase !== 'juego') return;
    if (artillero()) {
      const err = auto.on ? auto.error : 0.012;
      let elegido = null, md = 260;
      for (const d of enemigos()) if (d.viva && (d.detectada || d.tipo !== 'tirador' || d.estado === 'apunta')) { const kk = d.pos.distanceTo(camara.position) - (d.peligro ? 90 : 0); if (kk < md) { md = kk; elegido = d; } }
      if (!elegido) return;
      mira.fijo = elegido; tirarHacia(elegido, 1); if (err) { mira.yaw += (Math.random() - 0.5) * 2 * err; mira.pitch += (Math.random() - 0.5) * 2 * err; } torreta.boca(V3, V4); adelanto(elegido, V2);
      auto.fuego = V4.angleTo(V2.sub(V3).normalize()) < 0.03 + err && torreta.calor < 0.85 && elegido.pos.distanceTo(V3) < 240; return;
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
    mira.acierto = 0.12; if (esAereo(d)) aereo.impactar(d, 1); else drones.impactar(d, 1);
  }
  function alSuelo(p) { for (let i = 0; i < 3; i++) humo.emitir(p.x, p.y + 0.1, p.z, (Math.random() - 0.5) * 2, 1.5 + Math.random() * 2.5, (Math.random() - 0.5) * 2, 0.7, 0.35, 0.42 * luz, 0.38 * luz, 0.3 * luz, 0.6, 3, 1, 2); }
  function combatir(dt) {
    camara.updateMatrixWorld();
    let obj; if (mira.fijo && mira.fijo.viva) obj = adelanto(mira.fijo, V2); else { obj = puntoMira(V2); torreta.boca(V3, V4); const tb = obj.distanceTo(V3) / VEL_BALA; obj.y += 4.9 * tb * tb; }
    torreta.apuntar(dt, obj);
    const tiro = torreta.gatillo(dt, est.fase === 'juego' && est.reparando <= 0 && (artillero() ? auto.fuego : inp.p('disparar')));
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
    if (est.sam > 0) { const e = prioritario(); if (e && e.sam === 0 && (e.tipo === 'caza' ? e.estado === 'aproxima' : lejos(e) > 2000)) lanzarMisil(e); }
  }

  // ───────────── Cámara: torreta, mando (seguimiento electroóptico + mesa táctica) y libre ─────────────
  const vc = { yaw: 0, pitch: 0.42, mesaYaw: 0, mesaPitch: 0.95, foco: new THREE.Vector3(), eo: new THREE.Vector3(0, 0.1, 1), fov: 50, enLibre: false, eoX: innerWidth * 0.75, eoY: innerHeight * 0.3 };
  const F = new THREE.Vector3();
  function ponerVista(v) {
    est.vista = v; const mando = v === 'mando';
    camara.near = mando ? 0.5 : 0.2; camara.far = v === 'torreta' ? 2500 : 16000; scene.fog.density = v === 'torreta' ? 0.0017 : mando ? 0.0001 : 0.0008;
    if (mando) { vc.mesaYaw = veh.psi + mira.yaw; vc.eo.copy(camDir); vc.fov = 50; }
    else { camara.clearViewOffset(); camara.aspect = innerWidth / innerHeight; }
    if (v === 'libre') { vc.yaw = veh.psi + mira.yaw + 0.5; vc.pitch = 0.42; vc.enLibre = false; }
    camion.verTorreta(v === 'torreta' && est.fase !== 'titulo'); $('hud').dataset.vista = v; camara.updateProjectionMatrix();
  }
  function cambiarVista() { const l = Object.keys(VISTAS), v = l[(l.indexOf(est.vista) + 1) % l.length]; ponerVista(v); mensaje(VISTAS[v], 1.4); }
  /** Centro de la pelea para la cámara libre (y cuánto abarca): la pista elegida, o lo que vuela cerca, mezclado con el puesto. */
  function focoPelea() {
    let n = 0; F.set(0, 0, 0); const sumar = (p) => { F.add(p); n++; };
    if (sel && sel.viva && sel.pos.distanceTo(PUESTO) < 3000) sumar(sel.pos);
    else {
      for (const p of aereo.propios) if (p.pos.distanceTo(PUESTO) < 2500) sumar(p.pos);
      for (const e of aereo.lista) if (e.detectada && e.pos.distanceTo(PUESTO) < 2000) sumar(e.pos);
      for (const d of drones.lista) if (d.viva && d.detectada) sumar(d.pos);
      for (const o of propios.lista) sumar(o.pos);
    }
    if (n) F.multiplyScalar(1 / n); else F.copy(PUESTO);
    F.lerp(V4.set(PUESTO.x, PUESTO.y + 3, PUESTO.z), 0.45);
    const abre = F.distanceTo(PUESTO); V4.subVectors(F, PUESTO); if (V4.length() > 200) F.copy(PUESTO).addScaledVector(V4.normalize(), 200);   // más allá se acaba el mundo
    return abre;
  }
  function moverCamara(dt) {
    const yaw = veh.psi + mira.yaw, cp = Math.cos(mira.pitch);
    camDir.set(Math.sin(yaw) * cp, Math.sin(mira.pitch), Math.cos(yaw) * cp);
    if (est.fase === 'titulo') {   // de lejos, girando despacio alrededor del puesto
      const a = performance.now() / 9000, x = veh.x + Math.sin(a) * 16, z = veh.z + Math.cos(a) * 16;
      camara.position.set(x, Math.max(veh.y + 4, P.terreno(x, z) + 2), z); camara.lookAt(veh.x, veh.y + 1.8, veh.z); camara.fov = 45;
    } else if (est.vista === 'mando') {
      // Seguimiento electroóptico desde lo alto del mástil de 30 m: busca la pista elegida (o la más urgente) y cierra el zoom
      // a su tamaño. El eje óptico cae a la derecha, fuera de la mesa táctica.
      bSam.sensor.getWorldPosition(V); camara.position.set(V.x, V.y + 0.6, V.z);
      const b = sel && sel.viva ? sel : prioritario(); let fov = 48;
      if (b) { V2.subVectors(b.pos, camara.position); const d = V2.length(); V2.normalize(); fov = clamp(2 * Math.atan(24 / d) * 180 / Math.PI, 0.8, 48); }
      else V2.set(Math.sin(veh.psi), 0.1, Math.cos(veh.psi)).normalize();
      vc.eo.lerp(V2, Math.min(1, dt * 12)).normalize(); vc.fov = amort(vc.fov, fov * (inp.p('mirar') ? 0.5 : 1), 6, dt);
      camara.lookAt(V.copy(camara.position).add(vc.eo)); camara.fov = vc.fov;
      // El eje óptico cae en (vc.eoX, vc.eoY), el hueco entre la mesa y el panel: se agranda el cuadro virtual y se recorta.
      const W = innerWidth, H = innerHeight, fw = 2 * Math.max(vc.eoX, W - vc.eoX), fh = 2 * Math.max(vc.eoY, H - vc.eoY);
      camara.aspect = fw / fh; camara.setViewOffset(fw, fh, fw / 2 - vc.eoX, fh / 2 - vc.eoY, W, H);
    } else if (est.vista === 'libre') {
      const abre = focoPelea(); if (!vc.enLibre || vc.foco.distanceTo(F) > 400) vc.foco.copy(F); vc.enLibre = true;   // al entrar, salta: sin recorrido
      vc.foco.lerp(F, 1 - Math.exp(-2.2 * dt));
      const dist = clamp(32 + abre * 0.5, 32, 140) * (inp.p('mirar') ? 0.55 : 1), x = vc.foco.x - Math.sin(vc.yaw) * Math.cos(vc.pitch) * dist, z = vc.foco.z - Math.cos(vc.yaw) * Math.cos(vc.pitch) * dist;
      // Tope de altura: más arriba se ve dónde se acaba el bosque (y el mundo).
      camara.position.set(x, Math.max(Math.min(vc.foco.y + Math.sin(vc.pitch) * dist, PUESTO.y + 34), P.terreno(x, z) + 3), z); camara.lookAt(vc.foco); camara.fov = 58;
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
  // Mesa táctica: en la torreta y en la libre, chica abajo a la izquierda; en el mando, grande, con rótulos de las pistas.
  const pistas = [], rotulos = Array.from({ length: 7 }, () => { const el = document.createElement('div'); el.className = 'pista'; el.hidden = true; $('hPistas').appendChild(el); return el; });
  let mesaRect = null; const PX = { x: 0, y: 0 }, hEo = document.querySelector('.eo');
  function pistasMesa() {
    pistas.length = 0;
    for (const e of aereo.lista) if (e.detectada) { e.glifo = e.tipo === 'caza' ? 'caza' : 'misil'; e.clase = e.peligro ? 'peligro' : 'amenaza'; pistas.push(e); }
    for (const d of drones.lista) if (d.viva && d.detectada) { d.glifo = 'dron'; d.clase = d.cegado > 0 ? 'cegado' : d.peligro ? 'peligro' : 'amenaza'; pistas.push(d); }
    for (const t of tiradores.lista) if (t.viva && t.estado === 'apunta') { t.glifo = 'tirador'; t.clase = 'peligro'; pistas.push(t); }
    for (const p of aereo.propios) { p.glifo = 'misil'; p.clase = 'propio'; pistas.push(p); }
    for (const o of propios.lista) { o.glifo = 'dron'; o.clase = 'propio'; pistas.push(o); }
    return pistas;
  }
  function pintarMesa(dt) {
    const mando = est.vista === 'mando';
    if (mando) {
      const h = innerHeight * 0.84; mesaRect = { x: innerWidth * 0.012, y: innerHeight * 0.08, w: Math.min(innerWidth * 0.6, h * 1.3), h };
      // Cámara de seguimiento: en el hueco a la derecha de la mesa, por encima del panel de mando (que va abajo a la derecha).
      const panel = $('hMando').getBoundingClientRect(), der = mesaRect.x + mesaRect.w;
      vc.eoX = der + (innerWidth - der) / 2; vc.eoY = Math.max(90, Math.min(innerHeight * 0.32, (panel.top || innerHeight * 0.6) / 2));
      hEo.style.left = vc.eoX + 'px'; hEo.style.top = vc.eoY + 'px';
    }
    else { const s = Math.min(290, innerWidth * 0.26); mesaRect = { x: 10, y: innerHeight - s * 0.86 - 44, w: s, h: s * 0.86 }; }
    const lejosMesa = 3.1 * Math.max(1, 1.2 / (mesaRect.w / mesaRect.h));   // que el disco entero quepa en el rectángulo
    mesa.actualizar(dt, pistasMesa(), sel, mando ? { yaw: vc.mesaYaw, pitch: vc.mesaPitch, dist: lejosMesa } : { yaw: est.vista === 'libre' ? vc.yaw : veh.psi + mira.yaw, pitch: 1.0, dist: lejosMesa });
    let k = 0;
    if (mando) {
      const l = pistas.filter((p) => p.clase !== 'propio' && p !== sel).sort((a, b) => puntaje(a) - puntaje(b)).slice(0, 5); if (sel && sel.viva) l.unshift(sel);
      for (const p of l) {
        mesa.aPantalla(p.pos, mesaRect, PX); if (PX.x < mesaRect.x || PX.x > mesaRect.x + mesaRect.w - 60 || PX.y < mesaRect.y + 20 || PX.y > mesaRect.y + mesaRect.h) continue;
        const el = rotulos[k++]; el.hidden = false; el.style.transform = `translate(${PX.x}px, ${PX.y}px)`; el.className = 'pista' + (p === sel ? ' sel' : p.clase === 'peligro' ? ' peligro' : ''); el.textContent = `${NOMBRES[p.tipo]} · ${km(p)}`; }
    }
    for (; k < rotulos.length; k++) rotulos[k].hidden = true;
  }
  function pintarMando() {
    $('mOla').textContent = `${est.puntos.toLocaleString('es-CO')} puntos · ${$('hOleada').textContent}`; $('mBli').textContent = `${est.integ} %`; $('mBli').classList.toggle('bajo', est.integ < 40);
    $('mSam').textContent = `${est.sam} de ${SAM_MAX} · ${est.samAuto ? 'automático, de a dos' : 'manual'}`; $('mAm').textContent = `${est.am} de ${AM_MAX} · automático`;
    $('mInt').textContent = `${est.intN} listos · ${propios.lista.length} en el aire`; $('mInh').textContent = est.inhCarga >= 1 ? 'listo' : `cargando ${Math.round(est.inhCarga * 100)} %`;
    $('mTor').textContent = torreta.trabada ? 'artillero · cañón caliente' : 'artillero en el cañón';
    const b = sel && sel.viva ? sel : null, s = $('mSel');
    if (!b) { s.innerHTML = '<b>Sin pista elegida</b><span>R o la cruceta eligen una. La cámara sigue a la más urgente.</span>'; return; }
    const alto = Math.round(b.pos.y - P.terreno(b.pos.x, b.pos.z)), u = esAereo(b) ? urgencia(b) : null;
    const estado = !esAereo(b) ? (b.peligro ? 'en ataque' : 'en el área') : b.tipo === 'caza' ? (b.estado === 'aproxima' ? `suelta misiles en ${Math.round(u)} s` : b.estado === 'pasa' ? 'pasando por encima' : 'escapando') : `impacto en ${Math.max(0, u).toFixed(0)} s`;
    s.innerHTML = `<b>${NOMBRES[b.tipo]}</b><span>${km(b)} · ${alto} m de altura · ${Math.round((b.vel ? b.vel.length() : 0) * 3.6)} km/h</span><span>${estado}${b.sam ? ` · ${b.sam} misil${b.sam > 1 ? 'es' : ''} en camino` : ''}${b.am ? ' · antimisil en camino' : ''}</span>`;
  }
  function pintarHud() {
    let k = 0; const mando = est.vista === 'mando';
    for (const d of enemigos()) { if (!d.viva || k >= blancos.length || (d.tipo === 'tirador' && d.estado !== 'apunta') || (mando && d !== sel)) continue; marcar(blancos[k++], d.pos, (d.peligro ? ' peligro' : '') + (d === mira.fijo || d === sel ? ' fijo' : '') + (d.cegado > 0 ? ' cegado' : ''), `${NOMBRES[d.tipo]} · ${km(d)}`); }
    if (!mando) for (const o2 of propios.lista) { if (k >= blancos.length) break; marcar(blancos[k++], o2.pos, ' propio', o2.blanco ? `Interceptor → ${NOMBRES[o2.blanco.tipo].toLowerCase()}` : 'Interceptor'); }
    for (; k < blancos.length; k++) blancos[k].hidden = true;
    if (mando) pintarMando();
    $('hSamN').textContent = `${est.sam} · ${est.samAuto ? 'auto' : 'manual'}`; $('hAmN').textContent = `${est.am} listos`;
    barra('hBlindaje', est.integ); $('hInh').style.width = Math.round(est.inhCarga * 100) + '%'; $('hInhN').textContent = est.inhCarga >= 1 ? 'listo' : 'cargando';
    $('hIntN').textContent = `${est.intN} listos`; $('hRepN').textContent = est.reparando > 0 ? 'reparando…' : `${est.kits} kits`; $('hDerN').textContent = `${est.derribados} drones · ${est.abatidos} lanzacohetes`;
    $('hPuntos').textContent = est.puntos.toLocaleString('es-CO'); $('hNum').textContent = est.ola;
    const vivos = drones.lista.filter((d) => d.viva).length, aire = aereo.lista.filter((e) => e.detectada).length;
    $('hOleada').textContent = est.respiro > 0 ? `Respiro · la oleada ${est.ola + 1} llega en ${Math.ceil(est.respiro)} s` : `Oleada ${est.ola} · ${vivos} ${vivos === 1 ? 'dron' : 'drones'}${aire ? ` y ${aire} en el radar` : ' en el aire'}`;
    $('hAvance').style.width = (est.respiro > 0 ? 100 * (1 - est.respiro / RESPIRO) : 100 * clamp((est.tv - inicioOla[est.ola - 1]) / (finOla[est.ola - 1] - inicioOla[est.ola - 1]), 0, 1)).toFixed(1) + '%';
    $('hCalor').style.width = Math.round(torreta.calor * 100) + '%'; $('hArmaT').textContent = torreta.trabada ? 'Cañón caliente' : artillero() ? 'Cañón · artillero' : 'Cañón';
    hMira.classList.toggle('fijo', !!mira.fijo); hMira.classList.toggle('acierto', mira.acierto > 0);
    torreta.boca(V3, V4); V.copy(V3).addScaledVector(V4, 80); V.project(camara); hCanon.hidden = V.z > 1; hCanon.style.transform = `translate(${(V.x * 0.5 + 0.5) * innerWidth}px, ${(-V.y * 0.5 + 0.5) * innerHeight}px)`;
  }

  // ───────────── Partida ─────────────
  function salir() {
    Object.assign(est, CERO, { fase: 'juego' }); Object.assign(mira, { yaw: 0, pitch: 0.06, fijo: null, zoom: 0 });
    drones.reiniciar(); torreta.reiniciar(); propios.reiniciar(); tiradores.rearmar(0); frente.reiniciar(); colaRadio.length = 0; radioT = 0; hRadio.classList.remove('ver');
    aereo.reiniciar(); caidos.length = 0; colaAire.length = 0; sel = null; espSam = espAm = 0; ponerVista('torreta');
    menus.cerrarTodo(); jugando = true; pausado = false; $('hud').hidden = false; document.body.classList.add('corriendo');
    empezarOla(1);
  }
  function fin() {
    est.fase = 'resultado'; const previo = mejor();
    const puesto = records.registrar('atalaya', 'puntos', est.puntos, false, { det: `oleada ${est.ola} · ${est.derribados} drones · ${est.aviones} aviones` });
    $('fTitulo').textContent = 'El puesto cayó';
    $('fSub').textContent = puesto === 0 ? (previo ? `Nuevo récord: ${(est.puntos - previo.v).toLocaleString('es-CO')} puntos más que tu mejor defensa.` : 'Primera defensa registrada: ese es el puntaje a batir.') : `Tu mejor defensa sigue en ${previo.v.toLocaleString('es-CO')} puntos.`;
    const filas = [['Oleadas aguantadas', String(est.ola - 1)], ['Drones derribados', String(est.derribados)], ['Aviones derribados', String(est.aviones)], ['Misiles abatidos', String(est.misiles)],
      ['Lanzacohetes abatidos', String(est.abatidos)], ['Total', est.puntos.toLocaleString('es-CO')]];
    ponerVista('torreta');
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
  const alMenu = () => { jugando = false; pausado = false; Object.assign(est, CERO); $('hud').hidden = true; ponerVista('torreta'); drones.reiniciar(); propios.reiniciar(); tiradores.rearmar(0); aereo.reiniciar(); caidos.length = 0; sel = null; document.body.classList.remove('corriendo'); menus.cerrarTodo(); pintarMejor(); menus.abrir($('pTitulo'), 0); };
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
  function cuadro(t) { requestAnimationFrame(cuadro); const dt = Math.min(0.05, (t - ultimo) / 1000 || 0.016); ultimo = t; medidor.inicio(); logica(dt); composer.render(); if (mesaRect) mesa.dibujar(renderer, mesaRect); medidor.fin(dt); }
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
          if (inp.j('vista')) cambiarVista(); if (inp.j('modo')) cambiarModo(); if (inp.j('siguiente')) elegir(1); if (inp.j('anterior')) elegir(-1);
          if (inp.j('misil') || (est.vista === 'mando' && inp.j('disparar'))) lanzarMisil(est.vista === 'torreta' && esAereo(mira.fijo) ? mira.fijo : sel);
          if (auto.on && auto.equipo) autoEquipo();
          est.inhCarga = Math.min(1, est.inhCarga + dt / 14); espInt -= dt;
          if (est.reparando > 0 && (est.reparando -= dt) <= 0) { est.integ = Math.min(100, est.integ + REPARA); mensaje(`Reparado · blindaje ${est.integ} %`, 1.6); }
          oleadas(dt);
        }
        for (const d of drones.lista) if (!d.detectada && Math.hypot(d.pos.x - veh.x, d.pos.z - veh.z) < 300) d.detectada = true;   // sin radar: desde la atalaya se ven a 300 m
        drones.actualizar(dt, veh, est.fase === 'juego' && est.respiro <= 0, est.t, false, est.tv * 10);
        tiradores.actualizar(dt, veh, est.fase === 'juego', false);
        propios.actualizar(dt, drones.lista, V3.set(veh.x, veh.y, veh.z), V4.set(0, 0, 0), est.t);
        aereo.actualizar(dt, PUESTO); defensa(dt); moverCaidos(dt); if (sel && !sel.viva) sel = null;
        frente.actualizar(dt, veh, camara, est.fase === 'juego');
        if (radioT > 0) { if ((radioT -= dt) <= 0) { hRadio.classList.remove('ver'); if (sonidoOn && real.radio) real.radio.pitido(); } }
        else if (colaRadio.length) { const txt = colaRadio.shift(); hRadio.textContent = txt; hRadio.classList.add('ver'); radioT = 2.8 + txt.length * 0.035; if (sonidoOn && audio.activo() && real.radio) real.radio.voz(radioT); }
        for (const p of guerra.humeantes) if (Math.random() < 0.15) humo.emitir(p.x + (Math.random() - 0.5) * 1.5, p.y, p.z + (Math.random() - 0.5) * 2, 0.4, 1.2 + Math.random(), 0.2, 2.6 + Math.random(), 0.7, 0.07 * luz, 0.065 * luz, 0.06 * luz, 0.5, -0.15, 0.5, 3.5);
        if (est.fase === 'caida' && (est.fin -= dt) <= 0) fin();
      }
    }
    if (!pausado) { humo.actualizar(dt, camara, altoPx); fuego.actualizar(dt, camara, altoPx); estelas.actualizar(dt, camara, altoPx); brillo.actualizar(dt, camara, altoPx); destello.intensity *= Math.exp(-dt * 9); mira.acierto -= dt; if (msgT > 0 && (msgT -= dt) <= 0) hMsg.classList.remove('ver'); }
    camion.grupo.updateMatrixWorld(true);
    moverCamara(dt);
    if (combate && est.fase !== 'resultado') combatir(dt);
    if (jugando && !$('hud').hidden) { pintarHud(); pintarMesa(dt); } else mesaRect = null;
    if (sonidoOn && audio.activo()) { real.cargar(); real.actualizar({ activo: jugando && !pausado && est.fase === 'juego', rn: 0.03, gas: 0, corte: false }, dt); }
  }
  tamano(); $('cargando').remove(); pintarMejor(); menus.abrir($('pTitulo'), 0); requestAnimationFrame(cuadro);
  // Para pruebas desde la consola. El juego no lo usa.
  window.__at = { est, auto, drones, tiradores, propios, torreta, camion, veh, P, renderer, scene, camara, composer, medidor, paisaje, mira, salir, usarInhibidor, lanzarInterceptor, reparar,
    aereo, mesa, bSam, bAm, lanzarMisil, cambiarVista, ponerVista, cambiarModo, elegir, prioritario, sel: () => sel, planAereo,
    dibujar: () => { composer.render(); if (mesaRect) mesa.dibujar(renderer, mesaRect); },
    simular: (seg, dt = 1 / 60) => { for (let t = 0; t < seg; t += dt) logica(dt); }, sonido: () => ({ activado: sonidoOn, contexto: audio.ctx ? audio.ctx.state : null }) };
}
iniciar().catch((e) => { console.error(e); $('cargando').textContent = 'No se pudo cargar la atalaya: ' + e.message; });
