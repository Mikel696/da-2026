// 19-JUE · Sala · La portada es una transmisión en vivo del mundo de los juegos: el puesto del camino báltico al atardecer,
// el blindado con su torreta, soldados de guardia, trinchera y erizos, el bosque horneado, drones en vuelo y la torreta
// que les tira ráfagas con trazadora. Todo con el material escaneado de los juegos (CC0), en modo ligero (sin modelos
// pesados). La cámara responde al ratón y a la tarjeta que se elija. Licencia: MIT (código propio).
import * as THREE from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { TRAMO, crearVia } from './co-via.js';
import { crearCamion } from './co-camion.js';
import { crearPaisaje } from './co-paisaje.js';
import { crearGuerra } from './co-guerra.js';
import { figura, PROPIO } from './co-cohetes.js';
import { modelos, NOMBRES } from './co-drones.js';
import { leerCielo } from './co-cielo.js';
import { calidad } from './comun.js';

const BASE = new URL('../assets/ph/', import.meta.url).href;
const QUIETO = matchMedia('(prefers-reduced-motion: reduce)').matches;
const amort = (a, b, r, dt) => b + (a - b) * Math.exp(-r * dt);

/** progreso(0..1) mientras carga · marcas(lista) cada cuadro con los drones en pantalla: { x, y, d, nombre, fijo } */
export async function crearSala(canvas, { progreso = () => {}, marcas = () => {} } = {}) {
  const alta = calidad() === 'alta';
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, alta ? 1.5 : 1)); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(42, 1, 0.3, 2000);

  const tl = new THREE.TextureLoader(), gl = new GLTFLoader(), aniso = renderer.capabilities.getMaxAnisotropy();
  let hechos = 0, total = 0;
  const avance = (p) => { total++; return p.then((v) => { progreso(++hechos / total); return v; }); };
  const textura = async (id, res) => { const una = async (c, color) => { const t = await avance(tl.loadAsync(`${BASE}tex/${id}/${c}_${res}.jpg`)); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = aniso; if (color) t.colorSpace = THREE.SRGBColorSpace; return t; }; const [map, normalMap, armMap] = await Promise.all([una('diff', true), una('nor'), una('arm')]); return { map, normalMap, armMap }; };
  const impostor = async (id) => { const una = async (c, color) => { const t = await avance(tl.loadAsync(`${BASE}imp/${id}_${c}.webp`)); t.anisotropy = aniso; if (color) t.colorSpace = THREE.SRGBColorSpace; return t; }; const [c, n] = await Promise.all([una('color', true), una('normal')]); return { c, n }; };
  const modelo = (id) => avance(gl.loadAsync(`${BASE}mod/${id}/${id}.gltf`));
  const material = (t, extra = {}) => new THREE.MeshStandardMaterial(Object.assign({ map: t.map, normalMap: t.normalMap, roughnessMap: t.armMap, aoMap: t.armMap, roughness: 1, metalness: 0 }, extra));

  const [cielo, tAsf, tTer, tGra, tMet, tOxido, tBarro, tTela, mCaja, mBidon, mBarril, iAbeto, iPino, iJoven, iPasto] = await Promise.all([
    avance(new HDRLoader().loadAsync(`${BASE}cielo/belfast_sunset_puresky_2k.hdr`)),
    textura('asphalt_02', '2k'), textura('leafy_grass', '1k'), textura('sandy_gravel_02', '1k'), textura('green_metal_rust', '1k'),
    textura('rusty_metal_02', '1k'), textura('brown_mud_02', '1k'), textura('denim_fabric', '1k'),
    modelo('wooden_crate_02'), modelo('metal_jerrycan'), modelo('barrel_03'),
    impostor('abeto'), impostor('pino'), impostor('abeto_joven'), impostor('pasto'),
  ]);
  cielo.mapping = THREE.EquirectangularReflectionMapping;
  const C = leerCielo(cielo);
  scene.background = cielo; scene.environment = C.env; scene.fog = new THREE.FogExp2(C.bruma, 0.0022);
  const sol = new THREE.DirectionalLight(C.sol, C.fuerza); sol.castShadow = true; sol.shadow.mapSize.set(2048, 2048);
  Object.assign(sol.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 10, far: 400 }); sol.shadow.bias = -0.0004; sol.shadow.normalBias = 0.05; scene.add(sol, sol.target);

  // El puesto: la vía de los tramos cortos, el blindado a un lado, erizos, una trinchera con sacos y un resto quemado.
  const mVia = { asfalto: material(tAsf), grava: material(tGra, { color: new THREE.Color().setRGB(0.4, 0.44, 0.48) }), terreno: material(tTer, { vertexColors: true }),
    agua: new THREE.MeshStandardMaterial({ color: new THREE.Color().setRGB(0.02, 0.024, 0.017), roughness: 0.1 }) };
  const P = crearVia(TRAMO, mVia); scene.add(P.grupo);
  const iP = Math.round(P.n * 0.45), sP = P.dist[iP] - P.dist[P.iInicio], o = {};
  const camion = crearCamion({ pintura: tMet, modelos: { caja: mCaja, bidon: mBidon, barril: mBarril } }); scene.add(camion.grupo);
  { const l = 1.9, x = P.px[iP] + P.rx[iP] * l, z = P.pz[iP] + P.rz[iP] * l; P.consulta(x, z, -1, o); camion.grupo.position.set(x, o.y, z); camion.grupo.rotation.y = Math.atan2(P.tx[iP], P.tz[iP]); }
  camion.grupo.updateMatrixWorld(true);
  const V0 = camion.grupo.position.clone(), F = new THREE.Vector3(P.tx[iP], 0, P.tz[iP]), R = new THREE.Vector3(P.rx[iP], 0, P.rz[iP]), ARR = new THREE.Vector3(0, 1, 0);
  const guerra = crearGuerra(scene, P, P.iInicio, { erizos: [[sP + 16, 1, 3, 7.5], [sP + 16, -1, 3, 7.5]], trincheras: [[sP - 8, -1, 26, 10]], restos: [[sP + 70, 1, 0.5]], crateres: [], dientes: [], redes: [] },
    { tex: { oxido: tOxido, hormigon: tOxido, barro: tBarro, quemado: null, tela: tTela }, vehiculo: camion.grupo, excluir: camion.carga, evitar: [] });
  crearPaisaje(scene, P, { tex: { abeto: iAbeto, pino: iPino, joven: iJoven, pasto: iPasto }, mod: null, evitar: guerra.zonas.concat([{ centro: V0, radio: 9 }]), msaa: 0, densidad: alta ? 1 : 0.7 })
    .actualizar(V0, 450);

  // Soldados de guardia (sin insignias): dos junto al blindado y dos en la trinchera.
  const mSold = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 }), gSold = [figura(false, PROPIO), figura(true, PROPIO)];
  for (const [f, l, giro, k] of [[-3.2, 3.6, 0.6, 0], [-1.2, 3.9, -1.9, 1], [-8, -9.6, 0.2, 1], [-4, -10.2, -0.3, 0]]) {
    const p = V0.clone().addScaledVector(F, f).addScaledVector(R, l - 1.9); p.y = P.terreno(p.x, p.z) - (l < 0 ? 0.25 : 0);
    const m = new THREE.Mesh(gSold[k], mSold); m.position.copy(p); m.rotation.y = camion.grupo.rotation.y + giro; m.castShadow = m.receiveShadow = true; scene.add(m);
  }

  // Drones dando vueltas delante del puesto; la torreta les tira ráfagas cortas con trazadora.
  const MOD = modelos(), mCuerpo = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.3 });
  const mHel = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide });
  const mLed = new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(6, 0.25, 0.15) }), gLed = new THREE.SphereGeometry(0.02, 6, 4);
  const drones = ['reconocimiento', 'suicida', 'bombardero', 'fibra', 'suicida'].map((tipo, k) => {
    const g = new THREE.Group(); g.add(new THREE.Mesh(MOD[tipo].cuerpo, mCuerpo), new THREE.Mesh(MOD[tipo].helices, mHel)); const led = new THREE.Mesh(gLed, mLed); led.position.set(0, 0.03, -0.1); g.add(led);
    g.scale.setScalar(tipo === 'bombardero' ? 1.1 : 1.5); scene.add(g);
    return { tipo, g, led, r: 34 + k * 13, alto: 6 + k * 2.6 + (tipo === 'reconocimiento' ? 9 : 0), vel: (0.07 + k * 0.025) * (k % 2 ? -1 : 1), fase: k * 1.7, caida: 0, pos: g.position, vida: 1 };
  });
  const centro = V0.clone().addScaledVector(F, 38);
  const gT = new THREE.BoxGeometry(0.07, 0.07, 3.2); gT.translate(0, 0, -1.6);
  const trazas = new THREE.InstancedMesh(gT, new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(7, 3.2, 0.8), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }), 40);
  trazas.frustumCulled = false; trazas.count = 0; scene.add(trazas);
  const fogonazo = new THREE.PointLight(new THREE.Color().setRGB(1, 0.7, 0.4), 0, 14, 2); camion.arma.add(fogonazo); fogonazo.position.set(0, 0.02, 1.35);
  const estallido = new THREE.PointLight(new THREE.Color().setRGB(1, 0.55, 0.25), 0, 90, 2); scene.add(estallido);
  const balas = [], M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), Z = new THREE.Vector3(0, 0, 1), V = new THREE.Vector3(), W = new THREE.Vector3(), S1 = new THREE.Vector3(1, 1, 1);
  let blanco = drones[1], rafaga = 0, espera = 2.5, cadencia = 0, yaw = 0, pitch = 0.2;

  // Cámara: un plano general que gira despacio; cada tarjeta la lleva a su juego. El ratón la desplaza un poco.
  let enfoque = 'general', mx = 0, my = 0, t = 0, ultimo = performance.now(), visible = true, activo = true;
  const camPos = new THREE.Vector3().copy(V0).add(new THREE.Vector3(10, 4, -10)), camMira = V0.clone(), objPos = new THREE.Vector3(), objMira = new THREE.Vector3();
  function plano() {
    const torre = camion.torreta.getWorldPosition(new THREE.Vector3());
    if (enfoque === 'corredor') { objPos.copy(V0).addScaledVector(F, -10).addScaledVector(R, 1.6).addScaledVector(ARR, 2.6); objMira.copy(V0).addScaledVector(F, 28).addScaledVector(ARR, 1); }
    else if (enfoque === 'atalaya') { W.subVectors(blanco.pos, torre).setY(0).normalize(); objPos.copy(torre).addScaledVector(W, -4.6).addScaledVector(V.crossVectors(W, ARR), -1.7).addScaledVector(ARR, 1.5); objMira.lerpVectors(torre, blanco.pos, 0.55); }   // sobre el hombro: el arma delante, el dron al frente
    else if (enfoque === 'vaiven') { objPos.copy(V0).addScaledVector(F, -16).addScaledVector(ARR, 36); objMira.copy(V0).addScaledVector(F, 12); }
    else { const a = t * (QUIETO ? 0.01 : 0.045) + 2.2, cs = Math.cos(a), sn = Math.sin(a); objPos.copy(V0).addScaledVector(F, cs * 15).addScaledVector(R, sn * 15).addScaledVector(ARR, 5.2); objMira.copy(V0).addScaledVector(ARR, 2.2).addScaledVector(F, 6); }
    if (enfoque === 'general') { W.subVectors(objMira, objPos).cross(ARR).normalize(); objMira.addScaledVector(W, -4.5); }   // el blindado al tercio derecho: a la izquierda va el título
    objPos.addScaledVector(R, mx * 1.4).addScaledVector(ARR, -my * 0.7); objMira.addScaledVector(R, mx * 3).addScaledVector(ARR, -my * 1.5);
    objPos.y = Math.max(objPos.y, P.terreno(objPos.x, objPos.z) + 0.8);
  }
  function tamano() { const w = canvas.clientWidth, h = canvas.clientHeight; if (canvas.width !== Math.round(w * renderer.getPixelRatio()) || canvas.height !== Math.round(h * renderer.getPixelRatio())) { renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); } }

  function cuadro(ahora) {
    requestAnimationFrame(cuadro);
    const dt = Math.min(0.05, (ahora - ultimo) / 1000); ultimo = ahora;
    if (!visible || !activo || document.hidden) return;
    t += dt; tamano();
    const vel = QUIETO ? 0.3 : 1;
    for (const d of drones) {
      if (d.caida > 0) { d.caida -= dt; d.pos.y -= dt * 18; d.g.rotation.z += dt * 6; if (d.caida <= 0) { d.fase += Math.PI; d.vida = 1; d.g.rotation.set(0, 0, 0); } continue; }
      const a = d.fase + t * d.vel * vel;
      d.pos.set(centro.x + Math.cos(a) * d.r, P.terreno(centro.x, centro.z) + d.alto + Math.sin(t * 0.7 + d.fase) * 3, centro.z + Math.sin(a) * d.r * 0.6);
      d.g.rotation.set(0.18, a + (d.vel > 0 ? Math.PI : 0), Math.sin(t * 1.3 + d.fase) * 0.05);
      d.led.visible = ((t * 2 + d.fase) % 1) < 0.15;
    }
    // La torreta sigue a su blanco y le tira una ráfaga de vez en cuando.
    camion.grupo.updateMatrixWorld(true);
    const boca = camion.arma.localToWorld(V.set(0, 0.012, 1.3)), tiempo = blanco.pos.distanceTo(boca) / 420;
    W.copy(blanco.pos).sub(camion.grupo.position).applyQuaternion(Q.copy(camion.grupo.quaternion).invert());
    yaw += (Math.atan2(W.x, W.z) - yaw) * Math.min(1, dt * 3); pitch += (Math.atan2(W.y - 2, Math.hypot(W.x, W.z)) - pitch) * Math.min(1, dt * 3);
    camion.torreta.rotation.y = yaw; camion.arma.rotation.x = -pitch;
    if ((espera -= dt) <= 0 && rafaga <= 0 && !QUIETO) { rafaga = 9 + Math.floor(Math.random() * 8); const vivos = drones.filter((d) => d.caida <= 0 && d.tipo !== 'reconocimiento'); blanco = vivos[Math.floor(Math.random() * vivos.length)] || blanco; }
    if (rafaga > 0 && (cadencia -= dt) <= 0) {
      cadencia = 1 / 8; rafaga--; fogonazo.intensity = 60;
      const dir = W.copy(blanco.pos).addScaledVector(V.set(0, 0, 0), 0).sub(boca).normalize().add(V.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(0.03)).normalize();
      balas.push({ p: boca.clone(), v: dir.multiplyScalar(420), vida: tiempo + 0.05 });
      if (rafaga === 0) { espera = 3 + Math.random() * 4; if (Math.random() < 0.45 && blanco.caida <= 0) { blanco.vida = 0; blanco.caida = 3.5; estallido.position.copy(blanco.pos); estallido.intensity = 900; } }
    }
    fogonazo.intensity *= Math.exp(-dt * 40); estallido.intensity *= Math.exp(-dt * 5);
    let n = 0;
    for (let i = balas.length - 1; i >= 0; i--) { const b = balas[i]; b.p.addScaledVector(b.v, dt); if ((b.vida -= dt) <= 0) { balas.splice(i, 1); continue; } Q.setFromUnitVectors(Z, W.copy(b.v).normalize()); trazas.setMatrixAt(n++, M4.compose(b.p, Q, S1)); }
    trazas.count = n; trazas.instanceMatrix.needsUpdate = true;

    plano(); camPos.x = amort(camPos.x, objPos.x, 1.8, dt); camPos.y = amort(camPos.y, objPos.y, 1.8, dt); camPos.z = amort(camPos.z, objPos.z, 1.8, dt);
    camMira.x = amort(camMira.x, objMira.x, 2.4, dt); camMira.y = amort(camMira.y, objMira.y, 2.4, dt); camMira.z = amort(camMira.z, objMira.z, 2.4, dt);
    cam.position.copy(camPos); cam.lookAt(camMira);
    sol.position.copy(V0).addScaledVector(C.dir, 200); sol.target.position.copy(V0);
    renderer.render(scene, cam);
    // Marcas para la retícula de la portada: dónde cae cada dron en pantalla y a qué distancia.
    const w = canvas.clientWidth, h = canvas.clientHeight, lista = [];
    for (const d of drones) { if (d.caida > 0) continue; V.copy(d.pos).project(cam); if (V.z > 1 || Math.abs(V.x) > 1 || Math.abs(V.y) > 1) continue; lista.push({ x: (V.x * 0.5 + 0.5) * w, y: (-V.y * 0.5 + 0.5) * h, d: Math.round(d.pos.distanceTo(cam.position)), nombre: NOMBRES[d.tipo], fijo: d === blanco && rafaga > 0 }); }
    marcas(lista);
  }
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
  requestAnimationFrame(cuadro);
  return {
    /** Lleva la cámara al plano de un juego (o al general). */
    enfocar(id) { enfoque = id || 'general'; },
    /** Ratón normalizado (−1..1) para el desplazamiento de la cámara. */
    mirar(x, y) { mx = x; my = y; },
    pausar(si) { activo = !si; },
  };
}
