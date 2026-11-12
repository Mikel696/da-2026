// 19-JUE · Corredor. Una camioneta táctica lleva suministros por 760 m de carretera rural hasta un puesto de control.
// Tres tramos: 1 · campo minado (minas antitanque en las rodadas), 2 · cielo hostil (drones suicidas, bombarderos y de
// reconocimiento), 3 · los dos a la vez. En todos hay heridos que rescatar. El radar revela minas y drones; la torreta
// los derriba; el inhibidor les corta la señal y el humo te esconde. Se puntúa la carga, los heridos y lo demás.
// La luz, el cielo, el asfalto, la tierra, las rocas, los arbustos y la carga son material escaneado (Poly Haven, CC0:
// ver assets/ph/CREDITOS.json). La camioneta, las minas y los drones se arman en código.
// Este archivo orquesta: carga, escena, sol, posproceso, misión, puntería, cámara y HUD. Licencia: MIT (código propio).
// Motor 3D: three.js 0.186.1 (MIT, vendorizado sin modificar).
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
import { Menus, opcion, calidad, fijarCalidad, NIVELES, Medidor, Sacudida, clamp, amort, records, tiempo } from './comun.js';
import { iniciarAudio, ui, audio, sonidoActivo, fijarSonido, tono, ruido } from './sonido.js';
import { semilla } from './lc-util.js';
import { TRAMO, TRAMO_INVERSO, RUTA, crearVia, ARCEN } from './co-via.js';
import { crearCamion } from './co-camion.js';
import { crearMinas, CAMPO_1, CAMPO_2, RUEDAS, DISPARO } from './co-minas.js';
import { crearDrones, OLEADAS, NOMBRES } from './co-drones.js';
import { Torreta, VEL_BALA } from './co-arma.js';
import { crearHeridos, HERIDOS, RADIO_SUBIR } from './co-heridos.js';
import { crearInterceptores, INTERCEPTORES } from './co-interceptores.js';
import { Radar } from './co-radar.js';
import { crearEmboscadas, NOMBRE_TIRADOR, figura, PROPIO } from './co-cohetes.js';
import { crearCampamento } from './co-campo.js';
import { crearPaisaje } from './co-paisaje.js';
import { crearGuerra, crearFrente, GUERRA_RUTA, GUERRA_TRAMO } from './co-guerra.js';
import { leerNivel, fijarNivel, escalar, NIVEL_MAX } from './co-nivel.js';
import { Vehiculo, AJUSTE } from './lc-fisica.js';
import { Sonidos } from './lc-audio.js';
import { SonidoReal } from './co-sonido-real.js';
import { JUEGOS } from './catalogo.js';

const $ = (id) => document.getElementById(id);
const DEF = JUEGOS.find((j) => j.id === 'corredor');
const nivel = calidad(), q = PERFILES[nivel];
const BASE = new URL('../assets/ph/', import.meta.url).href;
// Cielo báltico nublado por defecto; el soleado de antes con ?cielo=soleado en la dirección.
const SOLEADO = new URLSearchParams(location.search).get('cielo') === 'soleado';
const mover = (lista, d) => lista.map(([s, ...r]) => [s + d, ...r]);   // los datos de un tramo, corridos d metros
const TRAMOS = {
  1: { nombre: 'Campo minado', via: TRAMO, minas: CAMPO_1, drones: [], heridos: HERIDOS[1], guerra: GUERRA_TRAMO,
    texto: 'Hay minas antitanque enterradas en las rodadas: el radar las marca y tú decides por dónde pasar. Estallan con el peso de una rueda, así que una mina que queda entre tus ruedas no te toca. También puedes volarlas a tiros desde lejos. Hay heridos en la orilla: los marca un humo naranja.' },
  2: { nombre: 'Cielo hostil', via: TRAMO_INVERSO, minas: [], drones: OLEADAS[2], heridos: HERIDOS[2], guerra: GUERRA_TRAMO,
    texto: 'Sin minas, pero el cielo no está vacío: drones suicidas que se lanzan en picada, bombarderos que sueltan granadas por delante de ti y uno de reconocimiento que llama refuerzos si lo dejas vivo. La torreta del techo es tuya; el inhibidor les corta la señal y el humo te esconde mientras subes a los heridos.' },
  3: { nombre: 'Corredor completo', via: TRAMO, minas: CAMPO_1, drones: OLEADAS[3], heridos: HERIDOS[3], emboscadas: [[380, 1, 1]], guerra: GUERRA_TRAMO,
    texto: 'Minas en la vía, drones en el aire y heridos que esperan. Maneja, mira el radar, dispara y decide a quién te detienes a recoger.' },
  4: { nombre: 'Misión completa', via: RUTA, par: 830, guerra: GUERRA_RUTA,
    minas: mover(CAMPO_1, 40).concat(mover(CAMPO_2, 1590), mover(CAMPO_2, 2800), mover(CAMPO_1, 4700)),
    drones: mover(OLEADAS[2], 740).concat(mover(OLEADAS[3], 1500), [[2330, 'fibra', 1], [2600, 'fibra', 2], [2900, 'suicida', 1], [2950, 'fibra', 1], [3250, 'bombardero', 1],
      [3600, 'bombardero', 1], [3780, 'reconocimiento', 1], [4000, 'fibra', 1], [4250, 'suicida', 2], [4420, 'bombardero', 1]], mover(OLEADAS[3], 4650),
      [[5050, 'fibra', 2], [5400, 'suicida', 1], [5600, 'fibra', 1]]).sort((a, b) => a[0] - b[0]),
    heridos: [[270, -1], [510, 1], [920, 1], [1140, -1], [1300, 1], [1760, -1], [2020, 1], [2420, 1], [2980, -1], [3380, 1], [3820, -1], [4320, 1], [4880, -1], [5330, 1], [5760, -1]],
    emboscadas: [[1250, -1, 1], [1700, 1, 2], [1960, -1, 1], [2080, 1, 1], [3700, -1, 2], [3950, 1, 1], [4180, -1, 2], [4430, 1, 1], [5200, 1, 2], [5480, -1, 1]],
    puestos: [730, 1480, 2240, 3480, 4580],
    secciones: [[0, 'Valle minado', 'minas antitanque en las rodadas: mira el radar'], [760, 'Cielo hostil', 'suicidas, bombarderos y un dron de reconocimiento'],
      [1520, 'Paso de las emboscadas', 'minas, drones y lanzacohetes escondidos tras sacos'],
      [2270, 'Línea de defensa', 'trincheras, erizos y FPV de fibra: el inhibidor no los corta; la torreta y las redes sí'],
      [3510, 'Bosque cerrado', 'emboscadas desde la linde del bosque y bombarderos'], [4610, 'Último tramo', 'minas, drones y lanzacohetes hasta la base avanzada']],
    texto: 'La misión entera, unos 6 km de la base de salida a la base avanzada: el valle minado, el cielo hostil, el paso de las emboscadas, la línea de defensa, el bosque cerrado y el último tramo. Cinco puestos de control para reabastecer y kits para bajar a reparar: cada parada cuesta tiempo y te deja expuesto. Bajo las redes antidrones los FPV no pasan.' },
};
// Las misiones 5-7 son la misión completa a otra hora o con otro tiempo: cambia el cielo (HDR de Poly Haven) y lo que trae.
TRAMOS[5] = { ...TRAMOS[4], nombre: 'Misión de tarde', cielo: 'belfast_sunset_puresky', clima: 'tarde',
  texto: 'La misión completa con el sol bajo: sombras largas, contraluz y drones recortados contra el cielo naranja. ' + TRAMOS[4].texto };
TRAMOS[6] = { ...TRAMOS[4], nombre: 'Misión de noche', cielo: 'kloppenheim_02_puresky', clima: 'noche',
  texto: 'De noche las minas no se ven: el radar son tus ojos. Faros encendidos, trazadoras que brillan y drones que solo delatan sus luces. ' + TRAMOS[4].texto };
TRAMOS[7] = { ...TRAMOS[4], nombre: 'Misión con lluvia', cielo: 'kloofendal_overcast_puresky', clima: 'lluvia',
  texto: 'Lluvia sobre el asfalto: la camioneta agarra menos, frena antes y la cortina de agua acorta la vista. ' + TRAMOS[4].texto };
/** Hora y clima: exposición de la cámara, luz del cielo, niebla, sol (o luna), polvo y lo que cambia en la vía. */
const ATMOS = {
  dia: { exposicion: 1, ambiente: 1, niebla: 0.0017, sol: 1, polvo: 1 },
  tarde: { exposicion: 0.9, ambiente: 0.95, niebla: 0.0013, sol: 1, polvo: 0.9 },
  noche: { exposicion: 1.25, ambiente: 0.85, niebla: 0.0024, sol: 1, polvo: 0.22, faros: true, luna: 0.4 },
  lluvia: { exposicion: 1.12, ambiente: 0.95, niebla: 0.0036, sol: 0.5, polvo: 0.55, lluvia: true, agarre: 0.8 },
};
const N_TRAMO = (() => { const u = +new URLSearchParams(location.search).get('tramo'); if (TRAMOS[u]) return u; try { const v = +localStorage.getItem('jue_co_mision'); return TRAMOS[v] ? v : 4; } catch (e) { return 4; } })();
// Nivel de dificultad: sube con cada entrega (co-nivel.js) y la misma misión trae más enemigo.
const NIVEL = leerNivel(), MIS = escalar(TRAMOS[N_TRAMO], NIVEL), TABLA = 'p' + N_TRAMO, AT = ATMOS[MIS.clima || 'dia'];   // puntaje (hasta el paso 3 se guardaba el tiempo en «tramoN»)
const CARRIL = 1.6;                      // se circula por el centro del carril derecho
const DANO_MINA = 34, CARGA_MINA = 15;   // tres minas dejan la camioneta inutilizada
const KITS = 2, KITS_MAX = 3, REPARA = 16, REPARA_PCT = 30;   // reparación de campaña: kits, segundos de trabajo y blindaje que devuelve
const inp = new Entrada({
  acciones: { acelerar: { k: ['KeyW', 'ArrowUp'], b: [BOTON.RT] }, frenar: { k: ['KeyS', 'ArrowDown'], b: [BOTON.LT] }, mano: { k: ['Space'], b: [BOTON.A] },
    disparar: { k: ['Mouse0', 'KeyF'], b: [BOTON.RB] }, centrar: { k: ['KeyV'], b: [BOTON.R3] }, inhibidor: { k: ['KeyQ'], b: [BOTON.LB] }, humo: { k: ['KeyG'], b: [BOTON.X] }, interceptor: { k: ['KeyE'], b: [BOTON.B] }, reparar: { k: ['KeyT'], b: [BOTON.ABAJO] }, camara: { k: ['KeyC'], b: [BOTON.Y] }, reaparecer: { k: ['KeyR'], b: [BOTON.SELECT] } },
  ejes: { giro: { neg: ['KeyA', 'ArrowLeft'], pos: ['KeyD', 'ArrowRight'], eje: 0, bneg: [BOTON.IZQ], bpos: [BOTON.DER] },
    apuntarX: { neg: ['KeyJ'], pos: ['KeyL'], eje: 2 }, apuntarY: { neg: ['KeyI'], pos: ['KeyK'], eje: 3 } },
});
const menus = new Menus(inp), medidor = new Medidor(), sacudida = new Sacudida(0.12, 0.012);
const angulo = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const V = new THREE.Vector3(), V2 = new THREE.Vector3(), V3 = new THREE.Vector3(), V4 = new THREE.Vector3(), camDir = new THREE.Vector3(0, 0, 1);

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
// Velocidad en los bordes, viñeta y grano; uGolpe = el fogonazo y la vista que se desdobla cuando estalla algo cerca.
const fx = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uVel: { value: 0 }, uT: { value: 0 }, uGolpe: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uVel, uT, uGolpe; varying vec2 vUv;
    float h(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    void main(){
      vec2 d = vUv - 0.5; float r2 = dot(d, d), f = uVel * 0.045 * smoothstep(0.03, 0.45, r2);
      vec3 c = vec3(0.0); float tot = 0.0;
      for (int i = 0; i < 6; i++){ float k = float(i) / 5.0, w = 1.0 - k * 0.5; c += texture2D(tDiffuse, vUv - d * f * k).rgb * w; tot += w; }
      c /= tot;
      float g = min(1.0, uGolpe * 2.0), ab = uGolpe * 0.05 * (0.2 + r2);
      c.r = mix(c.r, texture2D(tDiffuse, vUv + d * ab).r, g); c.b = mix(c.b, texture2D(tDiffuse, vUv - d * ab).b, g);
      c += vec3(1.0, 0.82, 0.62) * uGolpe * uGolpe * 0.16;
      c *= 1.0 - smoothstep(0.16, 0.7, r2) * (0.28 + uGolpe * 0.3);
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
/** Atlas de un impostor horneado (color con transparencia + normales). */
async function impostor(id) {
  const una = async (cual, color) => { const t = await avance(tl.loadAsync(`${BASE}imp/${id}_${cual}.webp`)); t.anisotropy = aniso; if (color) t.colorSpace = THREE.SRGBColorSpace; return t; };
  const [c, n] = await Promise.all([una('color', true), una('normal', false)]);
  return { c, n };
}

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
  const E = Math.max(er, eg, eb, 1e-6), dir = E > 1e-3 ? new THREE.Vector3(sx, Math.abs(sy), sz).normalize() : new THREE.Vector3(0.4, 0.75, -0.5).normalize();   // sin sol (noche): luz de arriba
  return { env, dir, sol: new THREE.Color().setRGB(er / E, eg / E, eb / E), fuerza: E, bruma: new THREE.Color().setRGB(hr / hn, hg / hn, hb / hn) };
}

/** Reparte copias de un modelo escaneado: una sola llamada de dibujo por cada malla del modelo. */
function repartir(gltf, matrices, { sombra = true, hojas = false } = {}) {
  const g = new THREE.Group(), m = new THREE.Matrix4();
  if (!matrices.length) return g;
  gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse((o) => {
    if (!o.isMesh) return;
    if (hojas) { o.material.transparent = false; o.material.alphaTest = 0.45; o.material.side = THREE.DoubleSide; o.material.depthWrite = true; }
    const im = new THREE.InstancedMesh(o.geometry, o.material, matrices.length);
    matrices.forEach((M, k) => im.setMatrixAt(k, m.multiplyMatrices(M, o.matrixWorld)));
    im.castShadow = sombra; im.receiveShadow = true; im.computeBoundingSphere(); g.add(im);
  });
  return g;
}

async function iniciar() {
  const [cielo, tAsf, tTer, tGra, tMet, mBarrera, mBidon, mCaja, mBarril, mBotiquin, mEstufa, mJoven, mHelecho, mTocon, mRocas, mTronco, iAbeto, iPino, iJoven, iPasto, tOxido, tHormigon, tBarro, tQuemado, tTela] = await Promise.all([
    avance(new HDRLoader().loadAsync(`${BASE}cielo/${SOLEADO ? 'kloofendal_48d_partly_cloudy_puresky' : (MIS.cielo || 'kloppenheim_06_puresky')}_2k.hdr`)),
    textura('asphalt_02', '2k'), textura('leafy_grass', '1k'), textura('sandy_gravel_02', '1k'), textura('green_metal_rust', '1k'),
    modelo('concrete_road_barrier'), modelo('metal_jerrycan'), modelo('wooden_crate_02'), modelo('barrel_03'), modelo('medical_box'), modelo('barrel_stove'),
    modelo('fir_sapling'), modelo('fern_02'), modelo('tree_stump_01'), modelo('rock_moss_set_01'), modelo('dead_tree_trunk'),
    impostor('abeto'), impostor('pino'), impostor('abeto_joven'), impostor('pasto'),
    textura('rusty_metal_02', '1k'), textura('chipped_concrete', '1k'), textura('brown_mud_02', '1k'), textura('burned_ground_01', '1k'), textura('denim_fabric', '1k'),
  ]);

  // Cielo y sol.
  cielo.mapping = THREE.EquirectangularReflectionMapping;
  const C = leerCielo(cielo);
  scene.background = cielo; scene.environment = C.env; scene.environmentIntensity = AT.ambiente; scene.backgroundIntensity = 1;
  renderer.toneMappingExposure = AT.exposicion;
  scene.fog = new THREE.FogExp2(C.bruma, AT.niebla);   // bruma báltica: el bosque del fondo se aclara
  // De noche el «sol» que se encuentra en el cielo es la luna (o nada): una luz fría y tenue que deja ver el contorno.
  const sol = new THREE.DirectionalLight(AT.luna ? new THREE.Color().setRGB(0.62, 0.72, 1) : C.sol, AT.luna ? Math.min(C.fuerza, AT.luna) : C.fuerza * AT.sol);
  if (q.sombras) {
    sol.castShadow = true; sol.shadow.mapSize.set(q.sombras * 2, q.sombras * 2);
    Object.assign(sol.shadow.camera, { left: -42, right: 42, top: 42, bottom: -42, near: 10, far: 420 });
    sol.shadow.bias = -0.0004; sol.shadow.normalBias = 0.06;
  }
  scene.add(sol, sol.target);

  // Vía y terreno.
  const mVia = { asfalto: material(tAsf), grava: material(tGra, { color: new THREE.Color().setRGB(0.4, 0.44, 0.48) }), terreno: material(tTer, { vertexColors: true }),
    agua: new THREE.MeshStandardMaterial({ color: new THREE.Color().setRGB(0.02, 0.024, 0.017), roughness: 0.1, metalness: 0 }) };   // agua turbia de cuneta: refleja el cielo
  const P = crearVia(MIS.via, mVia);
  scene.add(P.grupo);

  // Paisaje báltico (co-paisaje.js): bosque de abeto y pino, abetos jóvenes, pasto, helechos, tocones, rocas y troncos.
  // Los trozos se dibujan solo a menos de LEJOS (el bosque, que es barato, hasta 2,2 veces más lejos).
  const LEJOS = 450;
  let paisaje = null;
  const poblar = (evitar) => {
    const qn = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3(), M4 = () => new THREE.Matrix4();
    paisaje = crearPaisaje(scene, P, { tex: { abeto: iAbeto, pino: iPino, joven: iJoven, pasto: iPasto }, mod: { joven: mJoven, helecho: mHelecho, tocon: mTocon, rocas: mRocas, tronco: mTronco }, evitar, msaa: q.msaa, densidad: Math.min(1, q.distancia) });
    const fin = P.n - 16, barr = [], bar = [];
    for (const [di, l] of [[0, -2.6], [0, -1.05], [-9, 1.05], [-9, 2.6]]) {
      const i = fin + di; qn.setFromEuler(e.set(0, Math.atan2(-P.rz[i], P.rx[i]), 0));
      barr.push(M4().compose(p.set(P.px[i] + P.rx[i] * l, P.py[i] - l * P.peralte[i], P.pz[i] + P.rz[i] * l), qn, s.set(1, 1, 1)));
    }
    for (const [di, l] of [[1, -3.9], [1, 0.1], [-8, 3.9], [-8, -0.1], [2, -4.6]]) { const i = fin + di; bar.push(M4().makeTranslation(P.px[i] + P.rx[i] * l, P.py[i] - l * P.peralte[i] - 0.02, P.pz[i] + P.rz[i] * l)); }
    scene.add(repartir(mBarrera, barr)); scene.add(repartir(mBarril, bar));
  };

  // Camioneta, torreta, minas, drones y radar.
  const camion = crearCamion({ pintura: tMet, modelos: { caja: mCaja, bidon: mBidon, barril: mBarril } });
  scene.add(camion.grupo);
  const veh = new Vehiculo(Object.assign({}, AJUSTE.tactica, AT.agarre ? { agarre: AJUSTE.tactica.agarre * AT.agarre } : {}));   // con lluvia la llanta agarra menos
  // Noche: faros con luz de verdad (un foco con sombra que sale del morro), faros y pilotos que brillan.
  if (AT.faros) {
    const faro = new THREE.SpotLight(new THREE.Color().setRGB(1, 0.94, 0.82), 2600, 150, 0.5, 0.55, 2);
    faro.position.set(0, 1.25, camion.E.morro + 0.1); faro.target.position.set(0, -0.4, 40); camion.cuerpo.add(faro, faro.target);
    if (q.sombras) { faro.castShadow = true; faro.shadow.mapSize.set(1024, 1024); faro.shadow.bias = -0.0005; faro.shadow.camera.near = 0.5; }
    camion.mats.faro.emissiveIntensity = 7;
    const lf = camion.luzFreno; camion.luzFreno = (k) => { lf(k); camion.mats.piloto.emissiveIntensity += 1.6; };
    document.body.classList.add('noche');
  }
  // Lluvia: el asfalto mojado brilla (menos rugosidad, más oscuro) y una cortina de gotas sigue a la cámara.
  if (AT.lluvia) { mVia.asfalto.roughness = 0.38; mVia.asfalto.color.setRGB(0.72, 0.72, 0.74); mVia.grava.roughness = 0.75; mVia.terreno.roughness = 0.88; }
  const lluvia = AT.lluvia ? crearLluvia(Math.round(3200 * q.particulas)) : null;
  const SALIDA = P.iInicio, FIN = P.n - 30;
  veh.colocar(P, SALIDA, CARRIL);
  const torreta = new Torreta(scene, camion, P);
  const minas = crearMinas(P, MIS.minas, SALIDA, tMet); scene.add(minas.grupo);
  let guerra = null;
  const drones = crearDrones(scene, P, SALIDA, MIS.drones, { oleada: radioOleada, red: (p) => !!guerra && guerra.enRed(p), enRed: enRedDron, aviso: avisoDron, impacto: impactoDron, choque: choqueDron, derribo: derriboDron, bomba: bombaDron, humo: humoDron });
  const radar = new Radar($('hRadar'));
  const heridos = crearHeridos(scene, P, SALIDA, MIS.heridos);
  const propios = crearInterceptores(scene, (x, z) => P.terreno(x, z), { caza: cazaPropio, golpe: golpePropio, recuperado: recuperadoPropio });
  NOMBRES.tirador = NOMBRE_TIRADOR;
  const tiradores = crearEmboscadas(scene, P, SALIDA, MIS.emboscadas || [], { aviso: avisoCohete, disparo: disparoCohete, estela: estelaCohete, impacto: impactoCohete, suelo: sueloCohete, abatido: abatidoTirador }, MIS.cohetes);
  const enemigos = () => drones.lista.concat(tiradores.lista);
  const contactos = () => minas.lista.concat(drones.lista, heridos.lista, propios.lista, tiradores.lista);
  // Campamentos: base de salida, base avanzada de llegada y los puestos del camino. Después, la vegetación (los esquiva).
  const indice = (s) => { let i = SALIDA; while (i < P.n - 2 && P.dist[i] < P.dist[SALIDA] + s) i++; return i; };
  const RC = { modelos: { barrera: mBarrera, barril: mBarril, caja: mCaja, bidon: mBidon, botiquin: mBotiquin, estufa: mEstufa },
    mats: { grava: mVia.grava, hesco: material(tGra, { color: new THREE.Color().setRGB(0.5, 0.43, 0.33) }), liso: camion.mats.liso }, vehiculo: camion.grupo };
  const campos = [crearCampamento(scene, P, Math.max(14, SALIDA - 8), -1, 'base', RC), crearCampamento(scene, P, P.n - 24, 1, 'base', RC)];
  const puestos = (MIS.puestos || []).map((s, k) => { campos.push(crearCampamento(scene, P, indice(s), 1, 'puesto', RC)); return { n: k + 1, dist: P.dist[indice(s)], hecho: false, t: 0, avisado: false }; });
  const evitar = campos.concat(tiradores.lista.map((t) => ({ centro: new THREE.Vector3(t.x, t.y, t.z), radio: 3.5 })), heridos.lista.map((h) => ({ centro: new THREE.Vector3(h.x, h.y, h.z), radio: 3 })));
  guerra = crearGuerra(scene, P, SALIDA, MIS.guerra, { tex: { oxido: tOxido, hormigon: tHormigon, barro: tBarro, quemado: tQuemado, tela: tTela }, vehiculo: camion.grupo, excluir: camion.carga, evitar });
  poblar(evitar.concat(guerra.zonas));
  // El frente: fogonazos, humo y trazadoras lejanas; el retumbo llega con el retraso del sonido. Más seguido con el nivel.
  const frente = crearFrente(scene, P, {
    humo: (x, y, z) => humo.emitir(x, y, z, 0.8, 2.2, 0.3, 9 + Math.random() * 5, 9, 0.09 * luz, 0.085 * luz, 0.08 * luz, 0.5, -0.08, 0.1, 2.2),
    sonido: (d, pan) => { if (sonidoOn && real.listo) real.lejana(d, pan); },
  }, 1 + 0.15 * (NIVEL - 1));
  if (gtao) { const r0 = gtao.render.bind(gtao); gtao.render = (...a) => { paisaje.ocultarImpostores(true); guerra.grupo.visible = false; r0(...a); guerra.grupo.visible = true; paisaje.ocultarImpostores(false); }; }
  // El mecánico que baja a reparar (figura hecha en código, uniforme oliva).
  const mecanico = new THREE.Mesh(figura(false, PROPIO), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92 })); mecanico.castShadow = true; mecanico.visible = false; scene.add(mecanico);
  let chispa = 0;
  const polvo = new Particulas(scene, Math.round(500 * q.particulas), { aditivo: false, suave: 1 });
  const humo = new Particulas(scene, Math.round(1000 * q.particulas), { aditivo: false, suave: 1 });
  const fuego = new Particulas(scene, Math.round(420 * q.particulas), { aditivo: true, suave: 0.75 });
  const niebla = new Particulas(scene, Math.round(1100 * q.particulas), { aditivo: false, suave: 1 });   // cortinas de humo
  const bengalas = new Particulas(scene, Math.round(500 * q.particulas), { aditivo: false, suave: 1 });   // humo naranja de los heridos
  const destello = new THREE.PointLight(new THREE.Color().setRGB(1, 0.62, 0.3), 0, 60, 2); scene.add(destello);
  const luz = Math.min(1.6, 0.16 * C.fuerza + 0.5) * AT.polvo, POLVO = [0.62 * luz, 0.55 * luz, 0.44 * luz];   // el polvo recibe el mismo sol que el suelo

  // ───────────── Misión ─────────────
  const CERO = { fin: 0, t: 0, integ: 100, carga: 100, pisadas: 0, evitadas: 0, detectadas: 0, voladas: 0, derribados: 0, impactos: 0, causa: '', boom: 0, puesto: -1, previo: null,
    aBordo: 0, rescatados: 0, abandonados: 0, inhCarga: 1, inhActivo: 0, humoN: 3, oculto: false, puntos: 0, intN: INTERCEPTORES, intEspera: 0,
    abatidos: 0, seccion: 0, entregados: 0, kits: KITS, rep: 0, reparando: false, repPausa: 0, subir: 0 };
  const est = Object.assign({ fase: 'titulo' }, CERO);
  const ent = { gas: 0, freno: 0, giro: 0, mano: false }, uT = { value: 0 }, salto = { y: 0, vy: 0, p: 0, vp: 0, r: 0, vr: 0 };
  const mira = { yaw: 0, pitch: -0.04, quieto: 0, centrar: 0, fijo: null, acierto: 0, dist: 60 };
  let jugando = false, pausado = false, ultimo = 0, acum = 0, padsVistos = null, msgT = 0, avisoReversa = false, frenoQuieto = 0;
  const hMsg = $('hMsg');
  const mensaje = (txt, seg = 2.2, alerta = false) => { hMsg.textContent = txt; hMsg.classList.toggle('alerta', alerta); hMsg.classList.add('ver'); msgT = seg; };
  const mejor = () => records.mejor('corredor', TABLA);
  const pintarMejor = () => { const m = mejor(); $('tRecord').textContent = m ? `Tu mejor puntaje: ${m.v.toLocaleString('es-CO')} · ${m.det || m.f}` : 'Aún sin entrega: llega al puesto de control para marcar el primer puntaje.'; };

  // Piloto automático: sigue el carril y, si `esquivar`, busca el hueco más cercano entre las minas que ya marcó el
  // radar; si `tirador`, maneja la torreta. Hoy sirve para probar; será la base de los vehículos del convoy.
  const auto = { on: false, esquivar: true, tirador: true, rescatar: true, equipo: true, fuego: false, lat: CARRIL, pensar() {
    const s = veh.sup, vel = Math.abs(veh.u);
    let pref = CARRIL, obj = CARRIL, peligro = false, parar = false;
    const h = this.rescatar ? heridos.lista.find((x) => x.estado === 'espera' && x.dist - s.dist > -6 && x.dist - s.dist < 60) : null;
    if (h) { pref = obj = h.lado * 3.4; parar = h.dist - s.dist < 2 && Math.hypot(h.x - veh.x, h.z - veh.z) < RADIO_SUBIR - 0.5; }
    if (this.esquivar) {
      const cerca = minas.lista.filter((m) => m.viva && m.detectada && m.dist > s.dist - 3 && m.dist < (h ? Math.min(s.dist + 48, h.dist + 8) : s.dist + 48));   // con un herido por subir, primero arrimarse
      if (cerca.length) {
        peligro = true; let mejorL = null, md = Infinity;
        for (let c = -3.9; c <= 3.9001; c += 0.1) {
          if (cerca.some((m) => Math.abs(c - RUEDAS[0][0] - m.l) < 0.62 || Math.abs(c + RUEDAS[0][0] - m.l) < 0.62)) continue;
          const d = Math.abs(c - this.lat) * 0.6 + Math.abs(c - pref) * 0.4;
          if (d < md) { md = d; mejorL = c; }
        }
        if (mejorL !== null) obj = mejorL;
      }
    }
    this.lat += clamp(obj - this.lat, -2.2 * DT_F, 2.2 * DT_F);
    const ad = Math.min(P.n - 1, s.i + 4 + Math.round(vel * 0.35)), a = Math.atan2(P.px[ad] + P.rx[ad] * this.lat - veh.x, P.pz[ad] + P.rz[ad] * this.lat - veh.z) - veh.psi;
    let vmax = this.esquivar ? 16 : 24;
    for (let k = 0; k < 30 && s.i + k < P.n; k++) { const c = Math.abs(P.curv[s.i + k]); if (c > 0.003) vmax = Math.min(vmax, Math.sqrt(4.2 / c) + k * 0.4); }
    if (peligro) vmax = Math.min(vmax, 13);
    if (s.i > FIN - 26) vmax = Math.min(vmax, 9);
    if (h) vmax = Math.min(vmax, Math.max(Math.hypot(h.x - veh.x, h.z - veh.z) < RADIO_SUBIR - 0.5 ? 0 : 1.3, (h.dist - s.dist) * 0.45));   // sin estar a su lado, sigue al paso (con la retención en parado no avanzaría solo)
    const pu = puestos.find((p) => !p.hecho && p.dist - s.dist > -8 && p.dist - s.dist < 70);
    if (pu) { vmax = Math.min(vmax, Math.max(0, (pu.dist - s.dist) * 0.45)); if (pu.dist - s.dist < 2.5) parar = true; }
    if (est.reparando || (this.equipo && est.integ <= 55 && est.kits > 0 && !enemigos().some((d) => d.viva && d.peligro))) parar = true;
    ent.giro = clamp(-angulo(a) * 2.4, -1, 1); ent.gas = vel < vmax ? 0.8 : 0; ent.freno = vel > vmax + 1.5 ? clamp((vel - vmax) / 6, 0.2, 1) : 0; ent.mano = false;
    if (parar) { ent.gas = 0; ent.freno = veh.u > 0.3 ? 1 : 0; ent.mano = true; }   // parado se sujeta con el de mano: con el freno pisado se queda quieta, pero el de mano no deja dudas
  } };

  function salir() {
    veh.colocar(P, SALIDA, CARRIL); veh.aj.fuerza = AJUSTE.tactica.fuerza; auto.lat = CARRIL;
    Object.assign(est, CERO, { fase: 'ruta' }); Object.assign(salto, { y: 0, vy: 0, p: 0, vp: 0, r: 0, vr: 0 }); Object.assign(mira, { yaw: 0, pitch: -0.04, quieto: 0, fijo: null });
    minas.reiniciar(); drones.reiniciar(); torreta.reiniciar(); heridos.reiniciar(); propios.reiniciar(); tiradores.reiniciar(); nubes.length = 0; mecanico.visible = false; for (const pu of puestos) Object.assign(pu, { hecho: false, t: 0, avisado: false }); camion.carga.children.forEach((o) => { o.visible = true; });
    menus.cerrarTodo(); jugando = true; pausado = false; $('hud').hidden = false; document.body.classList.add('corriendo');
    frente.reiniciar(); colaRadio.length = 0; radioT = 0; charlaT = 25; hRadio.classList.remove('ver');
    for (const x of [...tiradores.lista, ...heridos.lista, ...guerra.tuneles]) x.radiado = false;
    radio(`Mando a Sierra 07: nivel ${NIVEL}. Ruta abierta hasta el puesto ${MIS.puestos ? 1 : 'de control'}. Ojo con las minas en las rodadas.`);
    mensaje(MIS.drones.length ? 'Lleva la carga al puesto de control · stick derecho apunta, RB dispara' : 'Lleva la carga al puesto de control · el radar marca las minas', 3.5);
  }
  function llegar() {
    est.fase = 'fin'; est.fin = 2.6; ui.cuenta(true); inp.vibrar(0.5, 0.7, 250);
    est.rescatados = est.aBordo; est.puntos = puntaje().total; est.previo = mejor();
    est.puesto = records.registrar('corredor', TABLA, est.puntos, false, { det: `${tiempo(est.t)} · ${est.rescatados} ${est.rescatados === 1 ? 'herido' : 'heridos'} a salvo · nivel ${NIVEL}` });
    if (NIVEL < NIVEL_MAX) fijarNivel(NIVEL + 1);   // la próxima partida, más dura
    mensaje(est.carga === 100 ? 'Carga completa en el puesto de control' : `Puesto de control · llega el ${est.carga} % de la carga`, 3);
  }
  const CONSEJO = {
    mina: 'Las minas van en las rodadas: una que queda entre tus ruedas no te toca, y también puedes volarlas a tiros desde lejos. Mira el radar antes de acelerar.',
    dron: 'Los suicidas se lanzan en picada cuando están a unos 65 m: derríbalos antes, mientras se acercan. El radar los marca y la retícula se fija sola cuando apuntas cerca de uno. Al FPV de fibra el inhibidor no le hace nada: torreta, interceptores, o espéralo bajo una red.',
    cohete: 'Los lanzacohetes se levantan detrás de sacos al costado de la vía y apuntan segundo y medio: bájalos con la torreta en ese momento, tírales humo (dentro no te ven) o cambia de velocidad cuando disparan, porque apuntan adonde vas a estar.',
    bomba: 'Los bombarderos sueltan la granada donde calculan que vas a pasar: cambia de velocidad cuando veas uno encima, o bájalo antes (aguanta seis tiros).',
  };
  /** Puntaje: lo que vale cada cosa, en filas [concepto, detalle, puntos]. */
  function puntaje() {
    const f = [['Carga entregada', est.carga + ' %', est.carga * 10]];
    const salvo = Math.max(est.rescatados, est.aBordo);
    if (MIS.heridos.length) f.push(['Heridos a salvo', `${salvo} de ${heridos.lista.length}`, salvo * 500]);
    if (MIS.drones.length) f.push(['Drones neutralizados', `${est.derribados} de ${drones.total()}`, est.derribados * 100]);
    if (tiradores.total()) f.push(['Lanzacohetes abatidos', `${est.abatidos} de ${tiradores.total()}`, est.abatidos * 150]);
    if (MIS.minas.length) f.push(['Minas superadas', `${est.evitadas + est.voladas} de ${minas.lista.length} · ${est.pisadas} pisadas`, (est.evitadas + est.voladas) * 25]);
    f.push(['Blindaje restante', est.integ + ' %', est.integ * 5], ['Rapidez', tiempo(est.t), Math.max(0, Math.round(((MIS.par || 90) - est.t) * 10))]);
    return { filas: f, total: f.reduce((a, r) => a + r[2], 0) };
  }
  function pantalla(exito) {
    est.fase = 'resultado';
    const pr = est.previo;
    $('fTitulo').textContent = !exito ? 'Camioneta inutilizada' : est.carga === 100 ? 'Carga completa' : 'Carga entregada';
    $('fSub').textContent = !exito ? 'El blindaje no aguantó: sin entrega no hay puntaje. ' + (CONSEJO[est.causa] || '')
      : est.puesto === 0 ? (pr ? `Nuevo récord: ${(est.puntos - pr.v).toLocaleString('es-CO')} puntos más que tu mejor entrega.` : 'Primera entrega registrada: ese es el puntaje a batir.')
      : `Tu mejor puntaje sigue en ${pr.v.toLocaleString('es-CO')}.`;
    if (exito) $('fSub').textContent += NIVEL < NIVEL_MAX ? ` Nivel ${NIVEL} superado: la próxima partida es nivel ${NIVEL + 1}, con más drones, lanzacohetes y minas.` : ' Superaste el nivel más alto.';
    const filas = puntaje().filas.map(([a, b, c]) => [a, b, exito ? c : 0]);
    filas.push(['Total', '', exito ? est.puntos : 0]);
    $('fTabla').innerHTML = '<tr><th></th><th></th><th>Puntos</th></tr>' + filas.map(([a, b, c], i) => `<tr${i === filas.length - 1 ? ' class="yo"' : ''}><td>${a}</td><td>${b}</td><td>${c.toLocaleString('es-CO')}</td></tr>`).join('');
    document.body.classList.remove('corriendo'); hMsg.classList.remove('ver'); msgT = 0; $('hud').hidden = true;
    if (document.exitPointerLock && document.pointerLockElement) document.exitPointerLock();
    menus.abrir($('pFin'), 0);
  }

  // ───────────── Explosiones y daños ─────────────
  function sonExplosion(k, d) {
    if (real.explosion(k, d)) return;   // grabación real; si no está cargada, la sintetizada de abajo
    const f = clamp(25 / (d + 5), 0.15, 1) * k;
    ruido({ dur: 1.7, vol: 0.9 * f, tipo: 'lowpass', f: 900, f2: 60, q: 0.7, ataque: 0.002 });
    tono({ f: 70, f2: 26, dur: 1.1, tipo: 'sine', vol: 0.9 * f });
    ruido({ dur: 0.25, vol: 0.5 * f, tipo: 'bandpass', f: 2400, f2: 600, q: 1.2 });
  }
  function explosion(x, y, z, k, aire = false) {
    const n = (base) => Math.round(base * k * q.particulas) + 4;
    for (let i = 0, N = n(36); i < N; i++) {
      const a = Math.random() * 6.283, h = Math.random();
      fuego.emitir(x + (Math.random() - 0.5) * 0.6, y + 0.3, z + (Math.random() - 0.5) * 0.6, Math.cos(a) * 5 * h * k, (aire ? (Math.random() - 0.5) * 8 : 3 + Math.random() * 9) * k, Math.sin(a) * 5 * h * k,
        0.22 + Math.random() * 0.35, (1.1 + Math.random() * 1.3) * k, 2.6, 1.25 + Math.random() * 0.5, 0.3, 1, -2, 2.5, 1.6);
    }
    if (!aire) for (let i = 0, N = n(70); i < N; i++) {   // tierra y piedras: suben y caen con la gravedad
      const a = Math.random() * 6.283, h = Math.random(), g = 0.6 + Math.random() * 0.4;
      humo.emitir(x, y + 0.2, z, Math.cos(a) * 7 * h, 5 + Math.random() * 11, Math.sin(a) * 7 * h, 1.3 + Math.random() * 1.1, 0.16 + Math.random() * 0.22, 0.2 * g * luz, 0.16 * g * luz, 0.12 * g * luz, 1, 9.8, 0.35, 0);
    }
    for (let i = 0, N = n(36); i < N; i++) {   // humo que se queda flotando
      const g = 0.75 + Math.random() * 0.3;
      humo.emitir(x + (Math.random() - 0.5) * 1.2, y + 0.6 + Math.random(), z + (Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 2, 1.5 + Math.random() * 3.5, (Math.random() - 0.5) * 2,
        3.5 + Math.random() * 3, (1.6 + Math.random() * 1.2) * Math.max(0.5, k), 0.2 * g * luz, 0.19 * g * luz, 0.18 * g * luz, 0.4, -0.5, 0.7, 2.4);
    }
    destello.position.set(x, y + 1.2, z); destello.intensity = Math.max(destello.intensity, 300 * k);
    const d = Math.hypot(x - veh.x, y - veh.y, z - veh.z);
    fx.uniforms.uGolpe.value = Math.min(1, fx.uniforms.uGolpe.value + 0.9 * k * clamp(18 / (d + 4), 0, 1));
    if (d < 30) sacudida.sumar(k * clamp(12 / (d + 6), 0, 0.8));
    sonExplosion(k, d);
  }
  /** Daño a la camioneta. fuerza 0..1 decide cuánto salta; cabeceo: −1 morro arriba, +1 cola arriba. */
  function danar(dano, carga, causa, fuerza = 1, lado = 1, cabeceo = -1) {
    if (est.fase !== 'ruta' || dano <= 0) return;
    est.integ = Math.max(0, est.integ - dano); est.carga = Math.max(0, est.carga - carga); est.causa = causa;
    if (causa !== 'mina') est.impactos++;
    const quedan = camion.carga.children.filter((o) => o.visible);   // la onda tira parte de la carga
    for (let k = 0; k < (carga >= 12 ? 2 : carga > 0 ? 1 : 0) && quedan.length; k++) quedan.splice(Math.floor(Math.random() * quedan.length), 1)[0].visible = false;
    veh.aj.fuerza = AJUSTE.tactica.fuerza * (0.45 + 0.55 * est.integ / 100);   // motor tocado: tira menos
    veh.u *= 1 - 0.58 * fuerza; veh.v += (Math.random() - 0.5) * 3 * fuerza; veh.r += (Math.random() - 0.5) * 1.4 * fuerza;
    salto.vy = Math.max(salto.vy, 3.3 * fuerza); salto.vp = cabeceo * 2.4 * fuerza; salto.vr = lado * 1.6 * fuerza;
    inp.vibrar(fuerza, fuerza, 600);
    if (est.integ <= 0) { est.fase = 'perdida'; est.fin = 4; est.boom = 0.55; mensaje('Camioneta inutilizada', 4, true); }
    else mensaje(`${causa === 'mina' ? 'Mina' : causa === 'bomba' ? 'Bomba' : causa === 'cohete' ? 'Cohete' : 'Impacto de dron'} · blindaje ${est.integ} % · carga ${est.carga} %${est.reparando ? ' · el mecánico se cubre' : ''}`, 2.6, true);
    if (est.reparando) est.repPausa = Math.max(est.repPausa, 3);
  }
  const ladoDe = (x, z) => (-(x - veh.x) * Math.cos(veh.psi) + (z - veh.z) * Math.sin(veh.psi) > 0 ? 1 : -1);
  /** Onda expansiva: daño que baja con la distancia al centro de la camioneta. */
  function onda(x, y, z, radio, max, causa) {
    const d = Math.hypot(x - veh.x, y - veh.y - 1, z - veh.z); if (d >= radio) return;
    const k = 1 - d / radio; danar(Math.round(max * k), Math.round(max * k * 0.35), causa, k * 0.8, ladoDe(x, z));
  }
  function pisarMina(m, delantera) {
    minas.estallar(m); explosion(m.x, m.y, m.z, 1); est.pisadas++;
    danar(DANO_MINA, CARGA_MINA, 'mina', 1, m.l > veh.sup.lat ? 1 : -1, delantera ? -1 : 1);
  }
  function detonarMina(m) { minas.estallar(m); explosion(m.x, m.y, m.z, 0.9); est.voladas++; mensaje('Mina detonada a distancia', 1.8); onda(m.x, m.y, m.z, 10, 30, 'mina'); }
  function pisar() {
    const sp = Math.sin(veh.psi), cp = Math.cos(veh.psi);
    for (const m of minas.lista) {
      if (!m.viva) continue;
      const dx = m.x - veh.x, dz = m.z - veh.z;
      if (dx * dx + dz * dz > 20) { if (!m.pasada && m.dist < veh.sup.dist - 5) { m.pasada = true; est.evitadas++; } continue; }
      for (const [lx, lz] of RUEDAS) {
        const wx = veh.x + lx * cp + lz * sp, wz = veh.z - lx * sp + lz * cp;
        if ((wx - m.x) ** 2 + (wz - m.z) ** 2 < DISPARO * DISPARO) { pisarMina(m, lz > 0); break; }
      }
      if (est.fase !== 'ruta') return;
    }
  }

  // ───────────── Drones ─────────────
  function avisoDron(d, que) {
    if (que === 'picada') { mensaje(d.tipo === 'fibra' ? '¡FPV de fibra en picada! El inhibidor no lo para' : '¡Suicida en picada!', 1.6, true); inp.vibrar(0.1, 0.45, 140); }
    else if (que === 'llamada') mensaje('El dron de reconocimiento marcó tu posición: vienen dos suicidas por detrás', 3.4, true);
    else if (que === 'bomba') mensaje('¡Bomba soltada!', 1.4, true);
  }
  /** Un FPV o una granada se quedó en la red antidrones: estalla a unos 5 m, mucho menos daño que encima. */
  function enRedDron(d, p) {
    explosion(p.x, p.y, p.z, 0.45, true); onda(p.x, p.y, p.z, 6.5, 9, 'dron');
    if (d) { est.derribados++; mensaje(`${NOMBRES[d.tipo]} atrapado en la red`, 1.8); } else mensaje('La red detuvo una granada', 1.6);
  }
  // ───────────── Radio del mando ─────────────
  // Texto en pantalla con pitido y estática sintetizados (solo si el sonido está encendido). Ficticio: ningún bando real.
  const hRadio = $('hRadio'), colaRadio = []; let radioT = 0, charlaT = 25;
  const CHARLA = ['Mando a todas las unidades: artillería activa al este. Mantengan la marcha.', 'Sierra 03 en posición, sin novedad en el cruce.',
    'Atención: actividad de drones en todo el sector. Ojos al cielo.', 'Columna de suministro, aquí Mando: el próximo puesto tiene combustible y kits.',
    'Sierra 05 reporta contacto en el bosque, a su izquierda. No se detengan.', 'Mando: el enemigo usa FPV de fibra. El inhibidor no sirve contra ellos.',
    'Evacuación médica lista en la base avanzada. Traigan a los heridos.', 'Aquí Sierra 02: morteros al norte del valle. Sigan por la vía.',
    'Mando: la red antidrones del sector aguanta. Úsenla para respirar.', 'Sierra 07, le cubrimos desde la loma. Adelante.'];
  const NOMBRE_RADIO = { suicida: ['suicida', 'suicidas'], fibra: ['FPV de fibra', 'FPV de fibra'], bombardero: ['bombardero', 'bombarderos'], reconocimiento: ['dron de reconocimiento', 'drones de reconocimiento'] };
  const NUM = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis'];
  function radio(txt) { if (est.fase === 'ruta' && colaRadio.length < 3 && !colaRadio.includes(txt)) colaRadio.push(txt); }
  function estatica(dur) { if (!sonidoOn || !audio.activo()) return; tono({ f: 1500, dur: 0.06, tipo: 'sine', vol: 0.05 }); ruido({ dur, vol: 0.045, tipo: 'bandpass', f: 1900, q: 1.3 }); }
  /** Posición de reloj de un punto respecto al morro: las 12 delante, las 3 a la derecha, las 6 detrás. */
  const reloj = (x, z) => { const a = angulo(Math.atan2(x - veh.x, z - veh.z) - veh.psi); return ((Math.round(-a / (Math.PI / 6)) % 12) + 12) % 12 || 12; };
  function radioOleada(tipo, n, d) {
    const [uno, varios] = NOMBRE_RADIO[tipo] || [tipo, tipo];
    radio(`Mando: ${NUM[n] || n} ${n > 1 ? varios : uno} a las ${reloj(d.pos.x, d.pos.z)}, ${Math.round(Math.hypot(d.pos.x - veh.x, d.pos.z - veh.z) / 10) * 10} m.${tipo === 'fibra' ? ' El inhibidor no los para: torreta.' : ''}`);
  }
  function radioCuadro(dt) {
    if (radioT > 0) { if ((radioT -= dt) <= 0) { hRadio.classList.remove('ver'); estatica(0.1); } return; }
    if ((charlaT -= dt) <= 0) { charlaT = (22 + Math.random() * 24) / (1 + 0.1 * (NIVEL - 1)); radio(CHARLA[(Math.random() * CHARLA.length) | 0]); }
    const dv = veh.sup.dist;
    for (const t of tiradores.lista) if (t.viva && !t.radiado && t.dist - dv < 330 && t.dist > dv) { t.radiado = true; radio(`Sierra 04: lanzacohetes en la linde ${t.lado > 0 ? 'derecha' : 'izquierda'}, a ${Math.round((t.dist - dv) / 10) * 10} m.`); break; }
    for (const h of heridos.lista) if (h.estado === 'espera' && !h.radiado && h.dist - dv < 300 && h.dist > dv) { h.radiado = true; radio(`Herido en la orilla ${h.lado > 0 ? 'derecha' : 'izquierda'}, a ${Math.round((h.dist - dv) / 10) * 10} m: deténganse a su lado.`); break; }
    for (const r of guerra.tuneles) if (!r.radiado && r.d0 - dv < 260 && r.d0 > dv) { r.radiado = true; radio('Mando: red antidrones en 250 m. Bajo ella los FPV no pasan.'); }
    if (colaRadio.length) { const txt = colaRadio.shift(); hRadio.textContent = txt; hRadio.classList.add('ver'); radioT = 2.8 + txt.length * 0.035; estatica(0.22); }
  }
  function impactoDron(d, p) { explosion(p.x, p.y, p.z, 0.85, true); danar(26, 8, 'dron', 0.75, ladoDe(p.x, p.z)); }
  function choqueDron(d, p, k) {
    if (d.cegado > 0 && d.tipo === 'suicida') { est.derribados++; mensaje('Suicida sin señal: se estrelló', 1.6); }
    explosion(p.x, p.y, p.z, k); onda(p.x, p.y, p.z, 7, 24 * k, 'dron');
  }
  function derriboDron(d, p, estalla) {
    est.derribados++; mensaje(`${NOMBRES[d.tipo]} derribado`, 1.6); inp.vibrar(0.2, 0.4, 120);
    if (estalla) { explosion(p.x, p.y, p.z, 0.6, true); onda(p.x, p.y, p.z, 8, 16, 'dron'); }
    else for (let i = 0; i < 14; i++) fuego.emitir(p.x, p.y, p.z, (Math.random() - 0.5) * 6, (Math.random() - 0.2) * 5, (Math.random() - 0.5) * 6, 0.3 + Math.random() * 0.3, 0.6, 2.4, 1.1, 0.3, 1, 4, 1, 1);
  }
  function bombaDron(p) { explosion(p.x, p.y, p.z, 0.75); onda(p.x, p.y, p.z, 9, 32, 'bomba'); }
  const horaDe = (x, z) => { const sp = Math.sin(veh.psi), cp = Math.cos(veh.psi), dx = x - veh.x, dz = z - veh.z, b = Math.atan2(-dx * cp + dz * sp, dx * sp + dz * cp); return (((Math.round(b / (Math.PI / 6)) % 12) + 12) % 12) || 12; };
  function avisoCohete(t, d) { mensaje(`¡Lanzacohetes a las ${horaDe(t.x, t.z)} · ${Math.round(d)} m!`, 1.8, true); inp.vibrar(0.15, 0.5, 160); }
  function disparoCohete(t, p, dir) {
    for (let i = 0; i < 16; i++) humo.emitir(p.x - dir.x * 1.4, p.y, p.z - dir.z * 1.4, -dir.x * (3 + Math.random() * 6) + (Math.random() - 0.5) * 3, Math.random() * 1.5, -dir.z * (3 + Math.random() * 6) + (Math.random() - 0.5) * 3,
      1.2 + Math.random(), 0.9 + Math.random() * 0.8, POLVO[0], POLVO[1], POLVO[2], 0.75, -0.3, 0.8, 2);   // rebufo: el polvo que levanta por detrás
    for (let i = 0; i < 6; i++) fuego.emitir(p.x, p.y, p.z, dir.x * 8 + (Math.random() - 0.5) * 3, dir.y * 8 + Math.random() * 2, dir.z * 8 + (Math.random() - 0.5) * 3, 0.12, 0.7, 2.6, 1.3, 0.4, 1, 0, 1, 0);
    const d = Math.hypot(p.x - veh.x, p.z - veh.z); ruido({ dur: 1.1, vol: 0.55 * clamp(45 / (d + 10), 0.1, 1), tipo: 'bandpass', f: 800, f2: 260, q: 0.7, ataque: 0.004 });
  }
  function estelaCohete(p, v) {
    humo.emitir(p.x, p.y, p.z, (Math.random() - 0.5) * 0.6, 0.35, (Math.random() - 0.5) * 0.6, 1.4 + Math.random(), 0.3, 0.55 * luz, 0.53 * luz, 0.5 * luz, 0.32, -0.15, 0.7, 2.4);
    fuego.emitir(p.x, p.y, p.z, -v.x * 0.03, -v.y * 0.03, -v.z * 0.03, 0.06, 0.3, 2.6, 1.3, 0.4, 1, 0, 1, 0);
  }
  function impactoCohete(p) { explosion(p.x, p.y, p.z, 0.95, true); danar(30, 10, 'cohete', 0.9, ladoDe(p.x, p.z)); }
  function sueloCohete(p, aire) { explosion(p.x, p.y, p.z, 0.7, aire); onda(p.x, p.y, p.z, 6, 18, 'cohete'); }
  function abatidoTirador() { est.abatidos++; mensaje('Lanzacohetes abatido', 1.6); inp.vibrar(0.2, 0.4, 120); }

  // Reparación de campaña: parado, el mecánico baja con un kit (16 s de trabajo, +30 % de blindaje y el motor vuelve a
  // tirar). La torreta sigue siendo tuya para cubrirlo; un golpe lo obliga a cubrirse 3 s, y si aceleras se sube (lo hecho
  // queda hecho). Los kits se reponen en los puestos de control.
  function reparar() {
    if (est.fase !== 'ruta' || est.reparando || est.subir > 0) return;
    if (est.kits <= 0) { mensaje('Sin kits de reparación: los reponen en los puestos de control', 2.4); return; }
    if (est.integ >= 100) { mensaje('El blindaje está entero', 1.6); return; }
    if (Math.abs(veh.u) > 0.5) { mensaje('Detén la camioneta para bajar a reparar', 1.8); return; }
    est.reparando = true; est.repPausa = 1.4; mensaje('El mecánico baja a reparar · cúbrelo con la torreta', 2.6);
  }
  function cancelarReparacion() { if (!est.reparando) return; est.reparando = false; est.subir = 1.2; mensaje(`Reparación interrumpida · lleva ${Math.round(est.rep * 100)} %`, 2); }
  function repararCuadro(dt) {
    if (est.reparando && est.fase !== 'ruta') est.reparando = false;
    if (est.reparando && (est.repPausa -= dt) <= 0) {
      est.rep += dt / REPARA;
      if ((chispa -= dt) <= 0) {   // golpes de herramienta: chispas en el vano del motor
        chispa = 0.2 + Math.random() * 0.45; const sp = Math.sin(veh.psi), cp = Math.cos(veh.psi);
        for (let i = 0; i < 5; i++) fuego.emitir(veh.x + sp * 1.7 + cp * 0.9, veh.y + 1.0, veh.z + cp * 1.7 - sp * 0.9, (Math.random() - 0.5) * 3, 1 + Math.random() * 2, (Math.random() - 0.5) * 3, 0.15, 0.06, 2.6, 1.6, 0.6, 1, 9.8, 1, 0);
        tono({ f: 1500 + Math.random() * 900, f2: 900, dur: 0.05, tipo: 'triangle', vol: 0.05 });
      }
      if (est.rep >= 1) {
        est.rep = 0; est.kits--; est.integ = Math.min(100, est.integ + REPARA_PCT); veh.aj.fuerza = AJUSTE.tactica.fuerza * (0.45 + 0.55 * est.integ / 100);
        est.reparando = false; est.subir = 1.2; mensaje(`Reparado · blindaje ${est.integ} % · ${est.kits === 1 ? 'queda 1 kit' : 'quedan ' + est.kits + ' kits'}`, 2.6);
      }
    } else if (!est.reparando && est.subir > 0) est.subir -= dt;
    const fuera = est.reparando || est.subir > 0; mecanico.visible = fuera;
    if (fuera) {   // del costado derecho a la altura del motor; bajando y subiendo, junto a la puerta
      const sp = Math.sin(veh.psi), cp = Math.cos(veh.psi), puerta = !est.reparando || est.repPausa > 0.2 ? 0 : 1, f = 0.3 + 1.2 * puerta, l = 1.35 + 0.25 * puerta;
      const x = veh.x + sp * f + cp * l, z = veh.z + cp * f - sp * l; mecanico.position.set(x, P.terreno(x, z) + (puerta ? Math.sin(uT.value * 7) * 0.015 : 0), z);
      mecanico.rotation.y = veh.psi - Math.PI / 2;
    }
  }
  function mision(dt) {
    repararCuadro(dt);
    if (est.fase !== 'ruta') return;
    const sec = MIS.secciones;
    if (sec) { const s = veh.sup.dist - P.dist[SALIDA]; let k = 0; for (let j = 0; j < sec.length; j++) if (s >= sec[j][0]) k = j; if (k > est.seccion) { est.seccion = k; mensaje(`${sec[k][1]} · ${sec[k][2]}`, 4.5, true); } }
    for (const pu of puestos) {
      if (pu.hecho) continue;
      const dS = pu.dist - veh.sup.dist;
      if (!pu.avisado && dS < 150) { pu.avisado = true; mensaje(`Puesto de control ${pu.n} a 150 m · detente en él para reabastecer`, 3.2); }
      if (Math.abs(dS) < 14 && Math.abs(veh.u) < 0.8) { if ((pu.t += dt) > 2.5) reabastecer(pu); } else pu.t = 0;
    }
  }
  function reabastecer(pu) {
    pu.hecho = true; est.humoN = 3; est.intN = Math.max(est.intN, INTERCEPTORES); est.inhCarga = 1; est.kits = Math.min(KITS_MAX, est.kits + 1);
    est.integ = Math.min(100, est.integ + 15); veh.aj.fuerza = AJUSTE.tactica.fuerza * (0.45 + 0.55 * est.integ / 100);
    const n = est.aBordo - est.entregados; est.entregados = est.aBordo;
    mensaje(`Puesto ${pu.n}: humo, interceptores y un kit · el taller da +15 % de blindaje${n ? ` · ${n} ${n === 1 ? 'herido atendido' : 'heridos atendidos'}` : ''}`, 4.5);
  }
  function humoDron(p) { humo.emitir(p.x, p.y, p.z, 0, 0.5, 0, 1.4, 0.5, 0.12 * luz, 0.11 * luz, 0.1 * luz, 0.6, -0.2, 0.6, 2); }

  // ───────────── Equipo: inhibidor de señal, cortina de humo y rescate ─────────────
  const RECARGA_INH = 14, DURA_INH = 4, RADIO_INH = 70, nubes = [], VIENTO = [0.9, 0.35];   // m/s: arrastra el humo de lado
  const burbuja = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(0.5, 0.8, 1.8), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  burbuja.visible = false; scene.add(burbuja); let burbujaT = 9;
  function usarInhibidor() {
    if (est.fase !== 'ruta' || est.inhCarga < 1) return;
    est.inhCarga = 0; est.inhActivo = DURA_INH; burbujaT = 0; burbuja.visible = true;
    const n = drones.inhibir(veh.x, veh.y + 1, veh.z, RADIO_INH, 0.6);
    mensaje((n ? `Inhibidor activo · ${n} ${n === 1 ? 'dron pierde' : 'drones pierden'} la señal` : 'Inhibidor activo · ningún dron al alcance') + (drones.inmunes ? ' · el FPV de fibra no tiene señal: derríbalo' : ''), drones.inmunes ? 3 : 2, drones.inmunes > 0);
    inp.vibrar(0.3, 0.2, 200);
    tono({ f: 220, f2: 880, dur: 0.6, tipo: 'sawtooth', vol: 0.08, filtro: 1800 }); ruido({ dur: 0.8, vol: 0.12, tipo: 'bandpass', f: 3000, q: 3 });
  }
  function lanzarHumo() {
    if (est.fase !== 'ruta' || est.humoN <= 0) return;
    est.humoN--;
    for (let k = 0; k < 5; k++) { const a = veh.psi + (k / 5) * Math.PI * 2 + 0.3, x = veh.x + Math.sin(a) * 6, z = veh.z + Math.cos(a) * 6; nubes.push({ x, y: P.terreno(x, z), z, t: -k * 0.08, dur: 12 }); }
    mensaje(`Cortina de humo · quedan ${est.humoN}`, 2); inp.vibrar(0.25, 0.3, 150);
    for (let k = 0; k < 5; k++) ruido({ dur: 0.08, vol: 0.3, tipo: 'bandpass', f: 900, q: 1.5, en: audio.activo() ? audio.ctx.currentTime + k * 0.08 : 0 });
  }
  /** Recarga del inhibidor, la burbuja que se expande, el humo de las cortinas y el de las bengalas de los heridos. */
  function equipo(dt) {
    if (est.inhActivo > 0) { est.inhActivo -= dt; drones.inhibir(veh.x, veh.y + 1, veh.z, RADIO_INH, 0.6); }
    else est.inhCarga = Math.min(1, est.inhCarga + dt / RECARGA_INH);
    if (burbujaT < 0.9) { burbujaT += dt; const k = Math.min(1, burbujaT / 0.9); burbuja.position.set(veh.x, veh.y + 1, veh.z); burbuja.scale.setScalar(RADIO_INH * (1 - (1 - k) ** 3)); burbuja.material.opacity = 0.22 * (1 - k); }
    else burbuja.visible = false;
    est.oculto = false;
    const emitir = (tasa, fn) => { let e = tasa * 60 * dt * Math.max(q.particulas, 0.5); while (e > 0) { if (e >= 1 || Math.random() < e) fn(); e -= 1; } };
    for (let i = nubes.length - 1; i >= 0; i--) {
      const n = nubes[i]; n.t += dt;
      if (n.t > n.dur + 6) { nubes.splice(i, 1); continue; }
      if (n.t < 0) continue;
      // Más suave y más real (11-nov, «el humo satura»): la granada suelta un golpe denso que luego se adelgaza, y el viento
      // lo arrastra de lado. Antes: partículas de 3-5 m al 42 % durante 16 s, una pared blanca.
      emitir(n.t < 1 ? 1.2 : n.t < n.dur ? 0.28 : 0, () => { const g = 0.78 + Math.random() * 0.12, fino = n.t < 1 ? 1 : 1 - n.t / (n.dur * 1.6);
        niebla.emitir(n.x + (Math.random() - 0.5) * 4, n.y + 0.4 + Math.random(), n.z + (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 1.2 + VIENTO[0], 0.3 + Math.random() * 0.6, (Math.random() - 0.5) * 1.2 + VIENTO[1],
          4 + Math.random() * 2.5, 2.2 + Math.random() * 1.6, 0.55 * g * luz, 0.55 * g * luz, 0.54 * g * luz, 0.26 * fino, -0.05, 0.6, 1.4); });
      if (n.t < n.dur && Math.hypot(n.x - veh.x, n.z - veh.z) < 9) est.oculto = true;
    }
    for (const h of heridos.lista) {
      if (h.estado !== 'espera' || Math.hypot(h.x - veh.x, h.z - veh.z) > 350) continue;
      emitir(0.3, () => { const g = 0.85 + Math.random() * 0.15;
        bengalas.emitir(h.bengala.x, h.bengala.y + 0.1, h.bengala.z, (Math.random() - 0.5) * 0.6 + 0.4, 2 + Math.random() * 1.5, (Math.random() - 0.5) * 0.6, 5 + Math.random() * 2, 0.9, 0.95 * g * luz, 0.42 * g * luz, 0.12 * g * luz, 0.34, -0.15, 0.3, 2.6); });
    }
  }
  // Interceptores: B o E lanza uno desde la plataforma de carga; caza solo al dron más urgente que marque el radar.
  function lanzarInterceptor() {
    if (est.fase !== 'ruta' || est.intN <= 0 || est.intEspera > 0) return;
    est.intN--; est.intEspera = 0.6;
    const sp = Math.sin(veh.psi), cp = Math.cos(veh.psi);
    propios.lanzar(V.set(veh.x - sp * 1.8, veh.y + salto.y + 1.8, veh.z - cp * 1.8), V2.set(veh.u * sp + veh.v * cp, 0, veh.u * cp - veh.v * sp));
    mensaje(`Interceptor en el aire · quedan ${est.intN}`, 1.8); inp.vibrar(0.2, 0.35, 120);
    ruido({ dur: 0.35, vol: 0.25, tipo: 'bandpass', f: 1200, f2: 2600, q: 1.2 });
  }
  function cazaPropio(d, e) { mensaje(`Interceptor tras el ${NOMBRES[e.tipo].toLowerCase()}`, 1.4); }
  function golpePropio(d, e, p) { explosion(p.x, p.y, p.z, 0.35, true); drones.impactar(e, 99); }
  function recuperadoPropio() { est.intN++; mensaje('Interceptor recuperado en la plataforma', 1.6); }
  function eventosHeridos(ev) {
    if (ev.subido) { est.aBordo++; mensaje(`Herido a bordo (${est.aBordo}) · llévalo al puesto de control`, 2.6); inp.vibrar(0.3, 0.5, 200); ui.ok(); }
    else if (ev.subiendo) mensaje(`Subiendo al herido · ${Math.round(ev.subiendo.prog * 100)} %`, 0.3);
    else if (ev.cerca) mensaje('Detente junto al herido para subirlo', 0.4);
    if (ev.abandonado) { est.abandonados++; mensaje('Dejaste atrás a un herido', 2.2, true); }
  }
  /** Equipo del piloto automático: inhibe a un suicida en picada y tira humo cuando se detiene a subir un herido. */
  function autoEquipo() {
    if (est.integ <= 55 && est.kits > 0 && !est.reparando && est.subir <= 0 && Math.abs(veh.u) < 0.4) reparar();
    V.set(veh.x, veh.y, veh.z);
    const vivos = drones.lista.filter((d) => d.viva && !(d.cegado > 0));
    if (est.inhCarga >= 1 && vivos.some((d) => d.tipo === 'suicida' && d.estado === 'picada' && d.pos.distanceTo(V) < 60)) usarInhibidor();
    if (est.humoN > 0 && !est.oculto && Math.abs(veh.u) < 1 && heridos.lista.some((h) => h.estado === 'espera' && h.prog > 0) && vivos.some((d) => d.pos.distanceTo(V) < 160)) lanzarHumo();
    // un interceptor por cada dron marcado que nadie persigue, si está a menos de 200 m
    const libres = vivos.filter((d) => d.detectada && !propios.lista.some((o) => o.blanco === d) && d.pos.distanceTo(V) < 200);
    if (libres.length > propios.lista.filter((o) => o.estado !== 'caza').length) lanzarInterceptor();
  }

  radar.alDetectar = (nuevos) => {
    if (est.fase !== 'ruta') return;
    const ms = nuevos.filter((n) => n.o.tipo === 'mina'), ds = nuevos.filter((n) => n.o.tipo !== 'mina');
    est.detectadas += ms.length;
    const sp = Math.sin(veh.psi), cp = Math.cos(veh.psi);
    if (ds.length) {
      const o = ds[0].o, dx = o.x - veh.x, dz = o.z - veh.z, b = Math.atan2(-dx * cp + dz * sp, dx * sp + dz * cp);
      const hora = (((Math.round(b / (Math.PI / 6)) % 12) + 12) % 12) || 12;   // a las 12 = al frente, a las 3 = a la derecha
      mensaje(`${NOMBRES[o.tipo]} a las ${hora} · ${Math.round(ds[0].d)} m`, 2.4, true);
      tono({ f: 1560, dur: 0.07, tipo: 'sine', vol: 0.07 });
      if (audio.activo()) tono({ f: 1560, dur: 0.07, tipo: 'sine', vol: 0.07, en: audio.ctx.currentTime + 0.1 });
      inp.vibrar(0.05, 0.25, 60);
    } else if (ms.length) {
      const cerca = ms.reduce((a, b) => (b.d < a.d ? b : a)), l = cerca.o.l;
      const lado = Math.abs(l) > TRAMO.ancho ? 'en el arcén' : Math.abs(l) < 0.45 ? 'sobre la línea central' : l > 0 ? 'en el carril derecho' : 'en el carril izquierdo';
      mensaje(ms.length > 1 ? `${ms.length} minas a ${Math.round(cerca.d)} m` : `Mina a ${Math.round(cerca.d)} m · ${lado}`, 2.2, true);
      tono({ f: 1180, dur: 0.08, tipo: 'sine', vol: 0.07 });
      if (audio.activo()) tono({ f: 1180, dur: 0.08, tipo: 'sine', vol: 0.07, en: audio.ctx.currentTime + 0.12 });
      inp.vibrar(0.05, 0.25, 60);
    }
  };

  // ───────────── Puntería y disparo ─────────────
  /** Dónde hay que apuntar para darle: su posición dentro de lo que tarda la bala, más lo que cae la bala. */
  function adelanto(d, out) {
    torreta.boca(V3, V4); const t = d.pos.distanceTo(V3) / VEL_BALA;
    return out.copy(d.pos).addScaledVector(d.vel, t).add(V.set(0, 4.9 * t * t, 0));
  }
  /** Lleva la mira hacia un dron (f = cuánto de la distancia se recorre en este cuadro). */
  function tirarHacia(d, f) {
    adelanto(d, V2); V.subVectors(V2, camara.position).normalize();
    const yawT = angulo(Math.atan2(V.x, V.z) - cam.yaw), pitchT = clamp(Math.asin(clamp(V.y, -1, 1)), -0.22, 1.15);
    mira.yaw = angulo(mira.yaw + angulo(yawT - mira.yaw) * Math.min(1, f)); mira.pitch += (pitchT - mira.pitch) * Math.min(1, f);
  }
  function apuntarMira(dt) {
    const [mx, my] = inp.tomarRaton(), sx = inp.e('apuntarX'), sy = inp.e('apuntarY');
    const mueve = Math.abs(sx) + Math.abs(sy) > 0.05 || mx !== 0 || my !== 0;
    mira.yaw = angulo(mira.yaw + sx * 2.3 * dt + mx * 0.0022); mira.pitch = clamp(mira.pitch - sy * 1.5 * dt - my * 0.0022, -0.22, 1.15);
    mira.quieto = mueve ? 0 : mira.quieto + dt;
    if (inp.j('centrar')) mira.centrar = 0.5;
    if ((mira.centrar -= dt) > 0 || (mira.quieto > 2.5 && !mira.fijo)) { const r = mira.centrar > 0 ? 9 : 1.4; mira.yaw = amort(mira.yaw, 0, r, dt); mira.pitch = amort(mira.pitch, -0.04, r, dt); }
    mira.fijo = null; auto.fuego = false;
    if (est.fase !== 'ruta') return;
    if (auto.on && auto.tirador) {   // tirador automático (pruebas): el dron más cercano, primero el que ataca
      let elegido = null, md = 250;
      for (const d of enemigos()) if (d.viva && d.detectada) { const k = d.pos.distanceTo(camara.position) - (d.peligro ? 80 : 0); if (k < md) { md = k; elegido = d; } }
      if (!elegido) return;
      mira.fijo = elegido; tirarHacia(elegido, 1);
      torreta.boca(V3, V4); adelanto(elegido, V2);
      auto.fuego = V4.angleTo(V2.sub(V3).normalize()) < 0.03 && torreta.calor < 0.85 && elegido.pos.distanceTo(V3) < 240;
      return;
    }
    // Ayuda de puntería: si la mira pasa a menos de 7° de un dron marcado, se fija y lo sigue.
    let mejorA = 0.13;
    for (const d of enemigos()) {
      if (!d.viva || !d.detectada) continue;
      V.subVectors(d.pos, camara.position); if (V.length() > 280) continue;
      const a = V.angleTo(camDir); if (a < mejorA) { mejorA = a; mira.fijo = d; }
    }
    if (mira.fijo) tirarHacia(mira.fijo, (inp.dispositivo === 'pad' ? 3.5 : 1.2) * dt);
  }
  /** Punto del mundo en el centro de la pantalla: el suelo si el rayo lo toca antes de 300 m. */
  function puntoMira(out) {
    const o = camara.position; let lejos = 300;
    for (let s = 6; s < 300; s += 6) {
      const x = o.x + camDir.x * s, y = o.y + camDir.y * s, z = o.z + camDir.z * s;
      if (y < P.terreno(x, z)) {   // afina entre la muestra anterior y esta: rasante, 6 m de paso son mucho error
        let lo = s - 6, hi = s;
        for (let k = 0; k < 6; k++) { const m = (lo + hi) / 2; if (o.y + camDir.y * m < P.terreno(o.x + camDir.x * m, o.z + camDir.z * m)) hi = m; else lo = m; }
        lejos = hi; break;
      }
      if (y > o.y + 45) break;
    }
    return out.copy(o).addScaledVector(camDir, lejos);
  }
  function efectosTiro({ boca, dir }) {
    for (let i = 0; i < 3; i++) fuego.emitir(boca.x, boca.y, boca.z, dir.x * 9 + (Math.random() - 0.5) * 2, dir.y * 9 + (Math.random() - 0.5) * 2, dir.z * 9 + (Math.random() - 0.5) * 2, 0.05 + Math.random() * 0.03, 0.32, 2.6, 1.6, 0.6, 1, 0, 6, 0.8);
    if (Math.random() < 0.5) humo.emitir(boca.x, boca.y, boca.z, dir.x * 2, 0.6, dir.z * 2, 0.6, 0.25, 0.5 * luz, 0.48 * luz, 0.45 * luz, 0.25, -0.3, 1.5, 3);
    sacudida.sumar(0.025); inp.vibrar(0.12, 0.3, 45);
    if (!real.disparo()) { ruido({ dur: 0.09, vol: 0.32, tipo: 'bandpass', f: 1500, f2: 450, q: 0.8 }); tono({ f: 120, f2: 55, dur: 0.07, tipo: 'square', vol: 0.12, filtro: 700 }); }
  }
  function alDron(d, p) {
    if (d.tipo === 'mina') { detonarMina(d); return; }
    if (d.tipo === 'tirador') { for (let i = 0; i < 4; i++) humo.emitir(p.x, p.y, p.z, (Math.random() - 0.5) * 2, Math.random() * 2, (Math.random() - 0.5) * 2, 0.6, 0.3, POLVO[0], POLVO[1], POLVO[2], 0.6, 3, 1, 2); mira.acierto = 0.12; tiradores.impactar(d, 1); return; }
    for (let i = 0; i < 5; i++) fuego.emitir(p.x, p.y, p.z, (Math.random() - 0.5) * 7, (Math.random() - 0.5) * 7, (Math.random() - 0.5) * 7, 0.12, 0.16, 3, 2.2, 1, 1, 6, 1, 0);
    mira.acierto = 0.12; drones.impactar(d, 1);
  }
  function alSuelo(p) {
    for (let i = 0; i < 4; i++) humo.emitir(p.x, p.y + 0.1, p.z, (Math.random() - 0.5) * 2, 1.5 + Math.random() * 2.5, (Math.random() - 0.5) * 2, 0.7 + Math.random() * 0.5, 0.35, POLVO[0] * 0.8, POLVO[1] * 0.8, POLVO[2] * 0.8, 0.6, 3, 1, 2);
    if (Math.random() < 0.4) fuego.emitir(p.x, p.y + 0.05, p.z, (Math.random() - 0.5) * 4, 2 + Math.random() * 3, (Math.random() - 0.5) * 4, 0.1, 0.1, 2.6, 1.8, 0.8, 1, 9.8, 0.5, 0);
    for (const m of minas.lista) if (m.viva && (p.x - m.x) ** 2 + (p.z - m.z) ** 2 < 1.21) { detonarMina(m); break; }
  }
  function combatir(dt) {
    camara.updateMatrixWorld();
    let objetivo;
    if (mira.fijo && mira.fijo.viva) objetivo = adelanto(mira.fijo, V2);
    else { objetivo = puntoMira(V2); torreta.boca(V3, V4); const tb = objetivo.distanceTo(V3) / VEL_BALA; objetivo.y += 4.9 * tb * tb; }   // casi a ras del suelo, 10 cm de caída son metros de error
    torreta.boca(V3, V4); mira.dist = Math.max(15, objetivo.distanceTo(V3));
    torreta.apuntar(dt, objetivo);
    const tiro = torreta.gatillo(dt, est.fase === 'ruta' && (auto.on && auto.tirador ? auto.fuego : inp.p('disparar')));
    if (tiro) efectosTiro(tiro);
    // Las minas también son blanco: una bala que pasa a menos de 1 m de una la hace estallar.
    torreta.actualizar(dt, enemigos().concat(minas.lista), alDron, alSuelo);
  }

  const DT_F = 1 / 120;
  function conducir(dt) {
    acum = Math.min(acum + dt, 0.1);
    while (acum >= DT_F) {
      acum -= DT_F;
      const libre = est.fase !== 'ruta';
      if (auto.on || libre) { auto.pensar(); if (libre) { ent.gas = 0; ent.freno = veh.u > 0.4 ? 1 : 0; } }
      veh.paso(DT_F, ent, P);
      // Una vez por visita: quien se queda parado con el freno pisado (y no junto a un herido) se entera de cómo dar reversa.
      if (!auto.on && !avisoReversa && est.fase === 'ruta' && veh.marcha > 0 && Math.abs(veh.u) < 0.2 && ent.freno > 0.5) {
        if ((frenoQuieto += DT_F) > 1.5 && !heridos.lista.some((h) => h.estado === 'espera' && Math.hypot(h.x - veh.x, h.z - veh.z) < RADIO_SUBIR + 3)) { avisoReversa = true; mensaje('Reversa: suelta el freno y vuelve a pisarlo', 3); }
      } else frenoQuieto = 0;
      // Caja automática: el cambio se oye en la grabación del motor (las vueltas bajan resbalando), sin chasquidos sintetizados.
      if (veh.evento === 'sube' || veh.evento === 'baja') inp.vibrar(0.08, 0.12, 90);
      if (veh.sup.i <= 1 && veh.u < 0) veh.u = 0;
      if (veh.sup.i >= P.n - 4 && veh.u > 0) veh.u = 0;
      if (est.fase === 'ruta') { est.t += DT_F; pisar(); if (est.fase === 'ruta' && veh.sup.i >= FIN) llegar(); }
    }
  }

  // ───────────── Camioneta en pantalla ─────────────
  let giroRueda = 0, cabeceo = 0, balanceo = 0, frenoLuz = 0, tVib = 0;
  function vestir(dt) {
    const s = veh.sup, vel = Math.hypot(veh.u, veh.v), fxh = Math.sin(veh.psi), fzh = Math.cos(veh.psi);
    const cuesta = (s.ty || 0) * (fxh * (s.tx || 0) + fzh * (s.tz || 1)), lateral = (s.peralte || 0) * (fxh * (s.tz || 1) - fzh * (s.tx || 0));
    // Salto por una explosión: la camioneta sube, cabecea y vuelve a caer sobre la suspensión.
    salto.vy -= 9.8 * dt; salto.y += salto.vy * dt; if (salto.y < 0) { salto.y = 0; salto.vy = salto.vy < -1 ? -salto.vy * 0.25 : 0; }
    salto.vp += (-salto.p * 70 - salto.vp * 7) * dt; salto.p += salto.vp * dt;
    salto.vr += (-salto.r * 70 - salto.vr * 7) * dt; salto.r += salto.vr * dt;
    camion.grupo.position.set(veh.x, veh.y + salto.y, veh.z); camion.grupo.rotation.set(-Math.atan(cuesta) + salto.p, veh.psi, lateral + salto.r, 'YXZ');
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
    // Motor tocado: humo gris bajo 70 % de blindaje; negro y con llamas bajo 35 %.
    if (jugando && est.integ < 70 && Math.random() < (est.integ < 35 ? 0.9 : 0.45) * q.particulas + 0.05) {
      const g = est.integ < 35 ? 0.35 : 0.75, hx = veh.x + fxh * 2.1, hz = veh.z + fzh * 2.1;
      humo.emitir(hx + (Math.random() - 0.5) * 0.5, veh.y + salto.y + 1.4, hz + (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.6 - fxh * veh.u * 0.3, 1.2 + Math.random(), (Math.random() - 0.5) * 0.6 - fzh * veh.u * 0.3,
        2 + Math.random() * 1.5, 0.5, 0.2 * g * luz, 0.19 * g * luz, 0.18 * g * luz, 0.35, -0.4, 0.8, 3);
      if (est.integ < 35 && Math.random() < 0.3) fuego.emitir(hx, veh.y + salto.y + 1.3, hz, 0, 1.5, 0, 0.25, 0.45, 2.6, 1.1, 0.3, 1, -1, 1, 1);
    }
    polvo.actualizar(dt, camara, altoPx); humo.actualizar(dt, camara, altoPx); fuego.actualizar(dt, camara, altoPx); niebla.actualizar(dt, camara, altoPx); bengalas.actualizar(dt, camara, altoPx);
    destello.intensity = destello.intensity > 1 ? destello.intensity * Math.exp(-dt * 10) : 0;
    fx.uniforms.uGolpe.value = Math.max(0, fx.uniforms.uGolpe.value - dt * 2.2);
    if ((tVib -= dt) <= 0 && jugando && !pausado) { tVib = 0.09; if (veh.arcen && vel > 3) inp.vibrar(0.4, 0.25, 100); else if (veh.chirrido > 0.2) inp.vibrar(veh.chirrido * 0.3, veh.chirrido * 0.6, 100); }
  }

  // ───────────── Cámara: detrás de la torreta, mira hacia donde apuntas ─────────────
  const cam = { yaw: veh.psi, modo: 0, fov: 55, t: 0 };
  // Lejana (por defecto, la de un juego de conducción), cercana y desde la torreta. El ancla sigue a la camioneta con un
  // pequeño retraso, como una cámara montada en un brazo: al acelerar se queda atrás y al frenar se acerca.
  const MODOS = [{ dist: 12, alto: 1.9 }, { dist: 8.4, alto: 1.5 }, { torreta: true }], ancla = new THREE.Vector3(veh.x, veh.y, veh.z);
  /** Gotas de lluvia como trazos cortos en coordenadas del mundo; las que se alejan de la cámara reaparecen del otro lado. */
  function crearLluvia(n) {
    const g = new THREE.BufferGeometry(), pos = new Float32Array(n * 6), p = new Float32Array(n * 3), R = 26, ALTO = 22, VY = -17, VX = 2.2;
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const m = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: new THREE.Color().setRGB(0.62, 0.66, 0.72), transparent: true, opacity: 0.3, depthWrite: false }));
    m.frustumCulled = false; scene.add(m);
    for (let k = 0; k < n; k++) { p[k * 3] = (Math.random() - 0.5) * 2 * R; p[k * 3 + 1] = Math.random() * ALTO; p[k * 3 + 2] = (Math.random() - 0.5) * 2 * R; }
    return {
      mover(c, dt) {
        for (let k = 0; k < n; k++) {
          let x = p[k * 3] + VX * dt, y = p[k * 3 + 1] + VY * dt, z = p[k * 3 + 2];
          while (y < c.y - 6) y += ALTO; while (y > c.y - 6 + ALTO) y -= ALTO;
          while (x < c.x - R) x += 2 * R; while (x > c.x + R) x -= 2 * R;
          while (z < c.z - R) z += 2 * R; while (z > c.z + R) z -= 2 * R;
          p[k * 3] = x; p[k * 3 + 1] = y; p[k * 3 + 2] = z;
          pos.set([x, y, z, x - VX * 0.035, y - VY * 0.035, z], k * 6);
        }
        g.attributes.position.needsUpdate = true;
      },
    };
  }
  function moverCamara(dt) {
    const vel = Math.hypot(veh.u, veh.v); let fov;
    if (est.fase === 'titulo') {
      cam.t += dt; const a = veh.psi + 2.5 + cam.t * 0.13, r = 11 + Math.sin(cam.t * 0.17) * 1.2, px = veh.x + Math.sin(a) * r, pz = veh.z + Math.cos(a) * r;
      camara.position.set(px, Math.max(veh.y + 1.7 + Math.sin(cam.t * 0.2) * 0.7, P.terreno(px, pz) + 0.6), pz); camara.lookAt(veh.x, veh.y + 1.15, veh.z); fov = 38; cam.yaw = veh.psi;
    } else {
      const m = MODOS[cam.modo];
      if (ancla.distanceToSquared(V.set(veh.x, veh.y, veh.z)) > 400) ancla.copy(V);   // tras reaparecer, sin barrido
      ancla.x = amort(ancla.x, veh.x, 7, dt); ancla.z = amort(ancla.z, veh.z, 7, dt); ancla.y = amort(ancla.y, veh.y + salto.y, 5, dt);
      cam.yaw = angulo(cam.yaw + angulo(veh.psi - cam.yaw) * (1 - Math.exp(-6 * dt)));
      const yaw = cam.yaw + mira.yaw, cpch = Math.cos(mira.pitch);
      camDir.set(Math.sin(yaw) * cpch, Math.sin(mira.pitch), Math.cos(yaw) * cpch);
      if (m.torreta) {   // desde la torreta: el escudo y las mirillas se vuelven casi transparentes para ver el camino
        camion.torreta.getWorldPosition(V); camara.position.set(V.x - camDir.x * 0.9, V.y + 0.62, V.z - camDir.z * 0.9); fov = 62;
      } else {
        const dist = m.dist * (1 - 0.4 * Math.max(0, camDir.y)), px = ancla.x - camDir.x * dist, pz = ancla.z - camDir.z * dist;
        camara.position.set(px, Math.max(ancla.y + 2.2 + m.alto - camDir.y * dist, P.terreno(px, pz) + 0.8, veh.y + 0.9), pz);
        fov = 52 + clamp(vel / 34, 0, 1) * 10;
      }
      camara.lookAt(V.copy(camara.position).addScaledVector(camDir, 50));
      if (veh.arcen && vel > 4) sacudida.sumar(0.5 * dt * 60 * 0.02);
      sacudida.aplicar(camara, dt);
    }
    camion.verTorreta(est.fase !== 'titulo' && !!MODOS[cam.modo].torreta);
    cam.fov = amort(cam.fov, fov, 4, dt);
    if (Math.abs(camara.fov - cam.fov) > 0.04) { camara.fov = cam.fov; camara.updateProjectionMatrix(); }
    sol.position.set(veh.x + C.dir.x * 200, veh.y + C.dir.y * 200, veh.z + C.dir.z * 200); sol.target.position.set(veh.x, veh.y, veh.z);
    fx.uniforms.uVel.value = est.fase === 'titulo' ? 0 : clamp((vel - 10) / 26, 0, 1);
    paisaje.actualizar(camara.position, LEJOS);
    if (lluvia) lluvia.mover(camara.position, dt);
  }

  // ───────────── HUD ─────────────
  const hRpm = $('hRpm'), hMira = $('hMira'), hCanon = $('hCanon'), tramoM = P.dist[FIN] - P.dist[SALIDA];
  const blancos = Array.from({ length: 12 }, () => { const el = document.createElement('div'); el.className = 'blanco'; el.hidden = true; el.innerHTML = '<b>▲</b><span></span>'; $('hBlancos').appendChild(el); return el; });
  const barra = (id, v) => { const u = $(id); u.style.width = v + '%'; u.classList.toggle('bajo', v < 40); $(id + 'N').textContent = v + ' %'; };
  /** Coloca un elemento en el punto de la pantalla que corresponde a `p`. Devuelve false si queda detrás de la cámara. */
  function enPantalla(p, el) {
    V.copy(p).project(camara);
    if (V.z > 1) { el.hidden = true; return false; }
    el.hidden = false; el.style.transform = `translate(${(V.x * 0.5 + 0.5) * innerWidth}px, ${(-V.y * 0.5 + 0.5) * innerHeight}px)`;
    return true;
  }
  /** Pone una marca sobre `p`, o una flecha en el borde si queda fuera de la vista. */
  function marcar(el, p, clase, texto) {
    V.copy(p).project(camara);
    const delante = V.z < 1; let x = V.x, y = V.y;
    const dentro = delante && Math.abs(x) < 0.92 && Math.abs(y) < 0.86;
    if (!dentro) { if (!delante) { x = -x; y = -y; } const s = 1 / Math.max(Math.abs(x) / 0.9, Math.abs(y) / 0.82, 1e-3); x *= s; y *= s; }
    el.hidden = false; el.style.transform = `translate(${(x * 0.5 + 0.5) * innerWidth}px, ${(-y * 0.5 + 0.5) * innerHeight}px)`;
    el.className = 'blanco' + clase + (dentro ? '' : ' fuera');
    if (!dentro) el.firstChild.style.transform = `rotate(${Math.atan2(x, y)}rad)`;
    el.lastChild.textContent = texto;
  }
  function pintarBlancos() {
    let k = 0;
    for (const d of enemigos()) {
      if (!d.viva || !d.detectada || k >= blancos.length) continue;
      marcar(blancos[k++], d.pos, (d.peligro ? ' peligro' : '') + (d === mira.fijo ? ' fijo' : '') + (d.cegado > 0 ? ' cegado' : ''), `${NOMBRES[d.tipo]}${d.cegado > 0 ? ' sin señal' : ''} · ${Math.round(d.pos.distanceTo(camara.position))} m`);
    }
    for (const o of propios.lista) {
      if (k >= blancos.length) continue;
      marcar(blancos[k++], o.pos, ' propio', o.blanco ? `Interceptor → ${NOMBRES[o.blanco.tipo].toLowerCase()}` : 'Interceptor');
    }
    for (const h of heridos.lista) {
      if (h.estado !== 'espera' || k >= blancos.length) continue;
      const dist = h.pos.distanceTo(camara.position); if (dist > 400) continue;
      marcar(blancos[k++], h.pos, ' herido', h.prog > 0 ? `Herido · subiendo ${Math.round(h.prog * 100)} %` : `Herido · ${Math.round(dist)} m`);
    }
    for (; k < blancos.length; k++) blancos[k].hidden = true;
  }
  function pintarHud() {
    $('hKmh').textContent = Math.round(veh.kmh); $('hMarcha').textContent = veh.marcha < 0 ? 'R' : veh.marcha;
    hRpm.style.width = clamp(veh.rpm / AJUSTE.tactica.rpmMax, 0, 1) * 100 + '%'; hRpm.classList.toggle('alto', veh.rpm > AJUSTE.tactica.rpmMax * 0.9);
    const hecho = clamp((veh.sup.dist - P.dist[SALIDA]) / tramoM, 0, 1);
    $('hAvance').style.width = (hecho * 100).toFixed(1) + '%'; const sig = puestos.find((p) => !p.hecho && p.dist > veh.sup.dist - 14);
    $('hFalta').textContent = hecho >= 1 ? 'En la base avanzada' : sig ? `Puesto ${sig.n} a ${Math.max(0, Math.round(sig.dist - veh.sup.dist))} m · base a ${Math.round((1 - hecho) * tramoM)} m` : `Base avanzada a ${Math.round((1 - hecho) * tramoM)} m`;
    barra('hBlindaje', est.integ); barra('hCarga', est.carga);
    radar.pintar(veh, P, contactos(), uT.value); $('hAlcance').textContent = `Radar · alcance ${Math.round(radar.alcance)} m`;
    $('hCalor').style.width = (torreta.calor * 100).toFixed(0) + '%'; $('hCalor').classList.toggle('trabada', torreta.trabada);
    $('hArmaT').textContent = torreta.trabada ? 'Cañón caliente' : 'Cañón';
    const inh = $('hInh'); inh.style.width = ((est.inhActivo > 0 ? est.inhActivo / DURA_INH : est.inhCarga) * 100).toFixed(0) + '%'; inh.classList.toggle('activo', est.inhActivo > 0);
    $('hInhN').textContent = est.inhActivo > 0 ? 'activo' : est.inhCarga >= 1 ? 'listo' : Math.ceil((1 - est.inhCarga) * RECARGA_INH) + ' s';
    $('hHumoN').textContent = (est.humoN === 1 ? '1 granada' : est.humoN + ' granadas') + (est.oculto ? ' · oculto' : '');
    const quedan = heridos.lista.filter((h) => h.estado === 'espera').length;
    $('hHeridosN').textContent = `${est.aBordo} a bordo · ${quedan} en la vía`;
    const enAire = propios.lista.length;
    $('hRepN').textContent = est.reparando ? `reparando · ${Math.round(est.rep * 100)} %` : `${est.kits} ${est.kits === 1 ? 'kit' : 'kits'}` + (est.rep > 0 ? ` · ${Math.round(est.rep * 100)} % hecho` : '');
    $('hIntN').textContent = `${est.intN} ${est.intN === 1 ? 'listo' : 'listos'}` + (enAire ? ` · ${enAire} en el aire` : '');
    mira.acierto -= 1 / 60;
    hMira.className = 'mira' + (mira.fijo ? ' fija' : '') + (mira.acierto > 0 ? ' acierto' : '');
    if (est.fase !== 'titulo') { torreta.boca(V3, V4); enPantalla(V2.copy(V3).addScaledVector(V4, mira.dist), hCanon); }
    pintarBlancos();
  }

  // ───────────── Sonido (nace apagado) y menús ─────────────
  // Sonido: grabaciones reales (co-sonido-real.js) y el sintetizado de reserva por si no cargan.
  const son = new Sonidos('diesel'), real = new SonidoReal(); let sonidoOn = sonidoActivo(), faltaGesto = null, zumb = null;
  addEventListener('pointerdown', () => iniciarAudio()); addEventListener('keydown', () => iniciarAudio());
  function sonidoCuadro(dt) {
    const falta = sonidoOn && !audio.activo(); if (falta !== faltaGesto) { faltaGesto = falta; $('tSonido').hidden = !falta; }
    if (!son.preparar()) return;
    real.cargar();
    const activo = jugando && !pausado && est.fase !== 'resultado' && est.integ > 0;
    if (real.listo) {   // con las grabaciones cargadas el motor sintetizado calla
      son.encender(false);
      real.actualizar({ activo, rn: (veh.rpm - AJUSTE.tactica.ralenti) / (AJUSTE.tactica.rpmMax - AJUSTE.tactica.ralenti), gas: veh.marcha < 0 ? ent.freno : ent.gas, corte: veh.cambio > 0.18 }, dt);
    } else son.encender(activo);
    if (activo && !real.listo) son.actualizar({ rpm: veh.rpm, gas: veh.marcha < 0 ? ent.freno : ent.gas, turbo: veh.turbo * 0.7, chirrido: veh.chirrido, vel: Math.hypot(veh.u, veh.v), arcen: veh.arcen && Math.abs(veh.u) > 2, corte: veh.cambio > 0 });
    // Zumbido del dron más cercano: más agudo el suicida en picada, más grave el bombardero.
    if (!zumb) {
      const c = audio.ctx, o1 = c.createOscillator(), o2 = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
      o1.type = o2.type = 'sawtooth'; f.type = 'bandpass'; f.Q.value = 1.2; g.gain.value = 0;
      o1.connect(f); o2.connect(f); f.connect(g); g.connect(audio.efectos); o1.start(); o2.start(); zumb = { o1, o2, f, g };
    }
    let cerca = null, dc = Infinity;
    for (const d of drones.lista) if (d.viva) { const k = d.pos.distanceTo(camara.position); if (k < dc) { dc = k; cerca = d; } }
    const t = audio.ctx.currentTime, fq = !cerca ? 200 : (cerca.tipo === 'suicida' || cerca.tipo === 'fibra') ? (cerca.estado === 'picada' ? 560 : 330) : cerca.tipo === 'bombardero' ? 120 : 210;
    zumb.g.gain.setTargetAtTime(activo && cerca ? clamp(18 / dc, 0, 0.3) * (cerca.peligro ? 1.4 : 1) : 0, t, 0.1);
    zumb.o1.frequency.setTargetAtTime(fq, t, 0.2); zumb.o2.frequency.setTargetAtTime(fq * 1.013, t, 0.2); zumb.f.frequency.setTargetAtTime(fq * 2.5, t, 0.2);
  }
  $('tablaCtl').innerHTML = '<tr><th>Acción</th><th>Teclado</th><th>Mando</th></tr>' + DEF.controles.map(([a, t, m]) => `<tr><td>${a}</td><td>${t}</td><td>${m}</td></tr>`).join('');
  $('tClave').textContent = `Tramo ${N_TRAMO} · ${MIS.nombre}`; $('tSub').textContent = MIS.texto;
  const NOMBRES_TRAMO = Object.entries(TRAMOS).map(([n, t]) => `${n} · ${t.nombre}`);
  opcion($('mNivel'), Array.from({ length: NIVEL_MAX }, (_, k) => String(k + 1)), String(NIVEL), 'Nivel', (v) => { fijarNivel(+v); location.href = location.pathname; });
  opcion($('mTramo'), NOMBRES_TRAMO, NOMBRES_TRAMO[N_TRAMO - 1], 'Tramo', (v) => { try { localStorage.setItem('jue_co_mision', String(NOMBRES_TRAMO.indexOf(v) + 1)); } catch (e) { /* vale para esta visita */ } location.href = location.pathname; });
  opcion($('mCal'), NIVELES, nivel, 'Calidad', (v) => { fijarCalidad(v); location.reload(); });
  function pintarSonido() { for (const id of ['mSonido', 'pSonido']) $(id).innerHTML = `<span>Sonido</span><b>‹ ${sonidoOn ? 'sí' : 'no'} ›</b>`; }
  for (const id of ['mSonido', 'pSonido']) { const b = $(id), cambiar = () => { sonidoOn = !sonidoOn; fijarSonido(sonidoOn); pintarSonido(); if (sonidoOn) ui.ok(); }; b.dataset.nav = 'opcion'; b.addEventListener('click', cambiar); b.addEventListener('ajustar', cambiar); }
  pintarSonido();
  function pintarPad() {
    if (inp.pads === padsVistos) return; padsVistos = inp.pads;
    const p = inp.pads.find((x) => x.activo), n = inp.pads.length; $('tPad').hidden = !p; if (!p) return;
    $('tPad').textContent = `Control en uso: ${p.nombre}` + (n > 1 ? ` · hay ${n} conectados: manda el último en el que pulses un botón` : '') + (!p.estandar && !inp.mapas[p.id] ? ' · no usa el mapa estándar: configúralo en la sala de juegos' : '');
  }
  const lienzo = $('lienzo');
  const pausar = () => {
    if (!jugando || pausado || menus.abierto) return; pausado = true; document.body.classList.remove('corriendo');
    if (document.exitPointerLock && document.pointerLockElement) document.exitPointerLock();
    menus.abrir($('pPausa'), 0);
  };
  const seguir = () => { pausado = false; menus.cerrarTodo(); document.body.classList.add('corriendo'); };
  const alMenu = () => {
    jugando = false; pausado = false; est.fase = 'titulo'; est.integ = 100; $('hud').hidden = true; document.body.classList.remove('corriendo'); menus.cerrarTodo();
    veh.colocar(P, SALIDA, CARRIL); minas.reiniciar(); drones.reiniciar(); torreta.reiniciar(); heridos.reiniciar(); propios.reiniciar(); tiradores.reiniciar(); nubes.length = 0; mecanico.visible = false; for (const pu of puestos) Object.assign(pu, { hecho: false, t: 0, avisado: false }); camion.carga.children.forEach((o) => { o.visible = true; }); Object.assign(salto, { y: 0, vy: 0, p: 0, vp: 0, r: 0, vr: 0 });
    pintarMejor(); menus.abrir($('pTitulo'), 0);
  };
  // Con ratón: un clic sobre la escena lo captura para apuntar; Esc lo suelta y pausa.
  lienzo.addEventListener('click', () => { if (jugando && !pausado && !menus.abierto && est.fase === 'ruta' && lienzo.requestPointerLock && document.pointerLockElement !== lienzo) lienzo.requestPointerLock(); });
  document.addEventListener('pointerlockchange', () => { if (!document.pointerLockElement && jugando && est.fase === 'ruta') pausar(); });
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
  function cuadro(t) {
    requestAnimationFrame(cuadro);
    const dt = Math.min(0.05, (t - ultimo) / 1000 || 0.016); ultimo = t;
    medidor.inicio(); logica(dt); composer.render(); medidor.fin(dt);
  }
  /** Todo lo que pasa en un cuadro menos dibujarlo. */
  function logica(dt) {
    inp.actualizar(); pintarPad();
    if (!audio.activo() && inp.botones[BOTON.A] > 0.5 && inp.previos[BOTON.A] <= 0.5) iniciarAudio();
    let combate = false;
    if (menus.abierto) { menus.actualizar(dt); if (pausado && inp.botones[BOTON.START] > 0.5 && inp.previos[BOTON.START] <= 0.5) $('pSeguir').click(); }
    else if (jugando) {
      if (inp.j('pausa')) pausar();
      else {
        combate = true;
        if (inp.j('camara')) { cam.modo = (cam.modo + 1) % MODOS.length; }
        if (est.fase === 'ruta' && inp.j('reaparecer')) { veh.colocar(P, clamp(veh.sup.i, 2, P.n - 6), CARRIL); ui.atras(); }
        if (!auto.on && est.fase === 'ruta') { ent.gas = est.reparando || est.subir > 0 ? 0 : inp.v('acelerar'); if (est.reparando && inp.v('acelerar') > 0.3) cancelarReparacion(); ent.freno = inp.v('frenar'); ent.giro = inp.e('giro'); ent.mano = inp.p('mano'); }
        apuntarMira(dt);
        if (est.fase === 'ruta') { if (inp.j('inhibidor')) usarInhibidor(); if (inp.j('humo')) lanzarHumo(); if (inp.j('interceptor')) lanzarInterceptor(); if (inp.j('reparar')) reparar(); if (auto.on && auto.equipo) autoEquipo(); }
        conducir(dt);
        equipo(dt); eventosHeridos(heridos.actualizar(dt, veh, est.fase === 'ruta'));
        drones.actualizar(dt, veh, est.fase === 'ruta', uT.value, est.oculto);
        tiradores.actualizar(dt, veh, est.fase === 'ruta', est.oculto); mision(dt); radioCuadro(dt); frente.actualizar(dt, veh, camara, est.fase === 'ruta');
        for (const p of guerra.humeantes) if (Math.random() < 0.18 && (p.x - veh.x) ** 2 + (p.z - veh.z) ** 2 < 260 * 260) humo.emitir(p.x + (Math.random() - 0.5) * 1.5, p.y, p.z + (Math.random() - 0.5) * 2, 0.4, 1.2 + Math.random(), 0.2, 2.6 + Math.random(), 0.7, 0.07 * luz, 0.065 * luz, 0.06 * luz, 0.5, -0.15, 0.5, 3.5);
        { const bajo = est.fase === 'ruta' && guerra.bajoRed(veh.sup.dist); if (bajo && !est.bajoRed) mensaje('Túnel de red antidrones: aquí los FPV no pasan', 2.4); est.bajoRed = bajo; }
        { const sp = Math.sin(veh.psi), cp = Math.cos(veh.psi); est.intEspera -= dt;
          propios.actualizar(dt, drones.lista, V3.set(veh.x, veh.y, veh.z), V4.set(veh.u * sp + veh.v * cp, 0, veh.u * cp - veh.v * sp), uT.value); }
        if (est.fase === 'ruta') radar.barrer(dt, veh, contactos());
        if (est.boom > 0 && (est.boom -= dt) <= 0) explosion(veh.x + Math.sin(veh.psi) * 1.6, veh.y + 0.6, veh.z + Math.cos(veh.psi) * 1.6, 1.3);
        if ((est.fase === 'fin' || est.fase === 'perdida') && (est.fin -= dt) <= 0) pantalla(est.fase === 'fin');
      }
    }
    if (!pausado) { uT.value += dt; fx.uniforms.uT.value = uT.value; minas.actualizar(uT.value); vestir(dt); if (msgT > 0 && (msgT -= dt) <= 0) hMsg.classList.remove('ver'); }
    camion.grupo.updateMatrixWorld(true);
    moverCamara(dt);
    if (combate && est.fase !== 'resultado') combatir(dt);
    if (jugando && !$('hud').hidden) pintarHud();
    sonidoCuadro(dt);
  }
  tamano(); $('cargando').remove(); pintarMejor(); menus.abrir($('pTitulo'), 0); requestAnimationFrame(cuadro);
  // Para pruebas desde la consola. El juego no lo usa.
  window.__co = { NIVEL, MIS, frente, radio, AT, guerra, paisaje, composer, medidor, tiradores, puestos, campos, mecanico, reparar, cancelarReparacion, veh, P, renderer, scene, camara, est, inp, ent, auto, cam, camion, minas, drones, heridos, torreta, radar, mira, sol, C, gtao, salir, usarInhibidor, lanzarHumo, lanzarInterceptor, propios, puntaje, real, tramo: N_TRAMO,
    /** Simula `seg` segundos de juego sin dibujar: prueba la lógica aunque la ventana esté tapada y no haya cuadros. */
    simular: (seg, dt = 1 / 60) => { for (let t = 0; t < seg; t += dt) logica(dt); },
    sonido: () => ({ activado: sonidoOn, contexto: audio.ctx ? audio.ctx.state : null, motor: son.listo }) };
}
iniciar().catch((e) => { console.error(e); $('cargando').textContent = 'No se pudo cargar el tramo: ' + e.message; });
