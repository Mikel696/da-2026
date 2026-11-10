// 19-JUE · Luciérnaga · Tramo de prueba (Paso Hotaru). Carreras callejeras de noche: una bajada de montaña.
// Licencia: MIT (código propio del proyecto). Motor 3D: three.js 0.186.1 (MIT, vendorizado sin modificar).
// Todo lo que se ve y se oye se genera en código: ningún modelo, textura ni sonido viene de un archivo.
// Este archivo orquesta: escena, luces, posproceso, cámara, estados, HUD. Las piezas están en lc-*.js.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { PERFILES, Particulas, texturaCanvas } from './render.js';
import { Entrada, BOTON, fijarVibracion, vibracionActiva } from './entrada.js';
import { Menus, opcion, calidad, fijarCalidad, NIVELES, Medidor, Sacudida, clamp, amort, records, tiempo } from './comun.js';
import { iniciarAudio, ui, audio, Musica, volumenes, fijarVolumen, sonidoActivo, fijarSonido } from './sonido.js';
import { HOTARU, crearPista } from './lc-pista.js';
import { NOCHE, crearCielo, crearLadera, crearBosque, crearLuciernagas, entornoNocturno } from './lc-mundo.js';
import { crearCoche, PINTURAS, RAIJIN } from './lc-coche.js';
import { Vehiculo, AJUSTE } from './lc-fisica.js';
import { Sonidos, CANCION, medirMotor } from './lc-audio.js';

const $ = (id) => document.getElementById(id);
const nivel = calidad(), q = PERFILES[nivel];
const AYUDAS = { simulador: 0, media: 0.4, asistida: 0.62 };
const PREF = 'jue_lc';
const pref = Object.assign({ pintura: 'bahia', ayuda: 'media' }, (() => { try { return JSON.parse(localStorage.getItem(PREF)) || {}; } catch (e) { return {}; } })());
const guardarPref = () => { try { localStorage.setItem(PREF, JSON.stringify(pref)); } catch (e) { /* vale para esta partida */ } };
const CONTROLES = [['Acelerar', 'W · ↑', 'RT'], ['Frenar / marcha atrás', 'S · ↓', 'LT'], ['Girar', 'A D · ← →', 'Stick izquierdo'], ['Freno de mano', 'Espacio', 'A'],
  ['Mirar atrás', 'B', 'B'], ['Mirar alrededor', '—', 'Stick derecho'], ['Cámara', 'C', 'Y'], ['Volver a la carretera', 'R', 'Select'], ['Pausa', 'Esc · P', 'Start']];

const inp = new Entrada({
  acciones: {
    acelerar: { k: ['KeyW', 'ArrowUp'], b: [BOTON.RT] }, frenar: { k: ['KeyS', 'ArrowDown'], b: [BOTON.LT] },
    mano: { k: ['Space'], b: [BOTON.A] }, atras: { k: ['KeyB'], b: [BOTON.B] },
    camara: { k: ['KeyC'], b: [BOTON.Y] }, reaparecer: { k: ['KeyR'], b: [BOTON.SELECT] },
  },
  ejes: { giro: { neg: ['KeyA', 'ArrowLeft'], pos: ['KeyD', 'ArrowRight'], eje: 0, bneg: [BOTON.IZQ], bpos: [BOTON.DER] }, mirar: { eje: 2 } },
});
const menus = new Menus(inp), medidor = new Medidor(), sacudida = new Sacudida(0.2, 0.025);

// ───────────── Render: escena en HDR → resplandor → velocidad, viñeta y grano → tono de película ─────────────
const canvas = $('lienzo');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false });
renderer.setPixelRatio(q.escala);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = q.sombras > 0; renderer.shadowMap.type = THREE.PCFShadowMap;
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(NOCHE.niebla, 0.0058);
const camara = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.25, 1500);
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: q.msaa }));
composer.addPass(new RenderPass(scene, camara));
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.5, 0.62, 0.92); bloom.enabled = q.bloom; composer.addPass(bloom);
const fx = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uVel: { value: 0 }, uT: { value: 0 }, uGolpe: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uVel, uT, uGolpe; varying vec2 vUv;
    float h(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    void main(){
      vec2 d = vUv - 0.5; float r2 = dot(d, d);
      float f = uVel * 0.085 * smoothstep(0.015, 0.42, r2);          // el centro queda nítido; los bordes se estiran con la velocidad
      vec3 c = vec3(0.0); float tot = 0.0;
      for (int i = 0; i < 8; i++){ float k = float(i) / 7.0, w = 1.0 - k * 0.55; c += texture2D(tDiffuse, vUv - d * f * k).rgb * w; tot += w; }
      c /= tot;
      float ab = (0.004 + uGolpe * 0.03) * r2;
      c.r = mix(c.r, texture2D(tDiffuse, vUv + d * ab).r, 0.7); c.b = mix(c.b, texture2D(tDiffuse, vUv - d * ab).b, 0.7);
      c *= 1.0 - smoothstep(0.1, 0.62, r2) * 0.6;
      c += (h(vUv * 811.0 + fract(uT) * 37.0) - 0.5) * 0.01;
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

// ───────────── Mundo ─────────────
const uT = { value: 0 };
const P = crearPista(HOTARU);
scene.add(P.grupo);
scene.add(crearLadera(P));
scene.add(crearBosque(P, q, uT));
const cielo = crearCielo({ valleY: P.py[P.n - 1] - 45, ciudadX: 250 }); scene.add(cielo.mesh);
const bichos = crearLuciernagas(P, Math.round(520 * q.particulas), uT); scene.add(bichos.pts);
scene.environment = entornoNocturno(renderer); scene.environmentIntensity = 1;
scene.add(new THREE.HemisphereLight(new THREE.Color().setRGB(0.2, 0.27, 0.5), new THREE.Color().setRGB(0.02, 0.025, 0.035), 0.9));
const luna = new THREE.DirectionalLight(new THREE.Color().setRGB(0.55, 0.68, 1), 1.5);
if (q.sombras) {
  luna.castShadow = true; luna.shadow.mapSize.set(q.sombras, q.sombras);
  Object.assign(luna.shadow.camera, { left: -55, right: 55, top: 55, bottom: -55, near: 20, far: 420 });
  luna.shadow.bias = -0.0006; luna.shadow.normalBias = 0.05;
}
scene.add(luna, luna.target);
// Tres focos de verdad se reparten entre las farolas más cercanas; el resto se queda con su halo y su charco pintado.
const focos = [0, 1, 2].map(() => { const l = new THREE.SpotLight(new THREE.Color().setRGB(1, 0.6, 0.24), 0, 38, 1.12, 0.9, 1.6); scene.add(l, l.target); return { l, f: -1 }; });
function repartirFocos(x, z) {
  const cerca = P.farolas.map((f, k) => [k, (f.x - x) ** 2 + (f.z - z) ** 2]).sort((a, b) => a[1] - b[1]).slice(0, focos.length).map((a) => a[0]);
  for (const s of focos) if (!cerca.includes(s.f)) s.f = -1;
  for (const k of cerca) if (!focos.some((s) => s.f === k)) { const s = focos.find((o) => o.f < 0); if (s) { s.f = k; const f = P.farolas[k]; s.l.position.set(f.x, f.y - 0.1, f.z); s.l.target.position.set(f.x, f.y - 7, f.z); s.l.intensity = 150; } }
}

// ───────────── Coche ─────────────
const pintura = PINTURAS.find((p) => p.id === pref.pintura) || PINTURAS[0];
const coche = crearCoche(RAIJIN, pintura); scene.add(coche.grupo);
const veh = new Vehiculo(Object.assign({}, AJUSTE.raijin, { ayuda: AYUDAS[pref.ayuda] ?? 0.4 }));
const SALIDA = P.iInicio - 4;
veh.colocar(P, SALIDA, -1.5);
const blanco = new THREE.Color().setRGB(1, 0.93, 0.8);
const haz = new THREE.SpotLight(blanco, 1500, 150, 0.52, 0.6, 1.5); haz.position.set(0, 0.66, 2.05); haz.target.position.set(0, -0.2, 30);
if (q.sombras) {
  haz.castShadow = true; haz.shadow.mapSize.set(1024, 1024); haz.shadow.camera.near = 0.8; haz.shadow.camera.far = 95; haz.shadow.bias = -0.0015;
  haz.map = texturaCanvas(256, 256, (g, W, H) => {   // forma del haz de cruce: mancha ancha con el corte arriba
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    const gr = g.createRadialGradient(W / 2, 0, 3, W / 2, 0, W * 0.5);
    gr.addColorStop(0, '#fff'); gr.addColorStop(0.4, '#b4b4b4'); gr.addColorStop(0.78, '#3c3c3c'); gr.addColorStop(1, '#000');
    g.save(); g.translate(0, H * 0.57); g.scale(1, 0.6); g.fillStyle = gr; g.fillRect(0, -H, W, H * 2); g.restore();
    const corte = g.createLinearGradient(0, 0, 0, H);
    corte.addColorStop(0, 'rgba(0,0,0,1)'); corte.addColorStop(0.36, 'rgba(0,0,0,0.9)'); corte.addColorStop(0.46, 'rgba(0,0,0,0)'); corte.addColorStop(0.62, 'rgba(0,0,0,0.25)'); corte.addColorStop(1, 'rgba(0,0,0,0.93)');   // lo de abajo cae a un metro del morro: sin atenuarlo, deslumbra
    g.fillStyle = corte; g.fillRect(0, 0, W, H);
  }, { srgb: false });
  haz.map.wrapS = haz.map.wrapT = THREE.ClampToEdgeWrapping;
}
const relleno = new THREE.SpotLight(blanco, 150, 75, 0.85, 0.9, 1.5); relleno.position.set(0, 0.8, 2.0); relleno.target.position.set(0, 1.4, 22);
const piloto = new THREE.PointLight(new THREE.Color().setRGB(1, 0.06, 0.04), 0, 11, 2); piloto.position.set(0, 0.75, -2.7);
coche.grupo.add(haz, haz.target, relleno, relleno.target, piloto);

const humo = new Particulas(scene, Math.round(420 * q.particulas), { aditivo: false, suave: 0.95 });
const chispas = new Particulas(scene, Math.round(320 * q.particulas), { aditivo: true, suave: 0.6 });

// ───────────── Carrera ─────────────
const carrera = { fase: 'titulo', cuenta: 0, t: 0, vmax: 0, puntos: 0, racha: 0, rachaT: 0, finEspera: 0, puesto: -1, previo: null, contra: 0 };
const ent = { gas: 0, freno: 0, giro: 0, mano: false };
const hMsg = $('hMsg'), hCuenta = $('cuenta'), hDerrape = $('hDerrape');
let msgT = 0, cuentaVista = 4, ocultarCuenta = 0, perdidoT = 0, rpmVisible = AJUSTE.raijin.ralenti, petardos = [], tVib = 0;
const mensaje = (txt, aviso = false, seg = 1.6) => { hMsg.textContent = txt; hMsg.classList.toggle('aviso', aviso); hMsg.classList.add('ver'); msgT = seg; };
const mejor = () => records.mejor('luciernaga', 'hotaru');

function nuevaBajada() {
  veh.colocar(P, SALIDA, -1.5); cam.yaw = veh.psi; cam.listo = false;
  Object.assign(carrera, { fase: 'cuenta', cuenta: 3, t: 0, vmax: 0, puntos: 0, racha: 0, rachaT: 0, finEspera: 0, puesto: -1, previo: null, contra: 0 });
  cuentaVista = 4; ocultarCuenta = 0; msgT = 0; hMsg.classList.remove('ver'); hDerrape.classList.remove('ver', 'perdido'); petardos = [];
  menus.cerrarTodo(); jugando = true; pausado = false; $('hud').hidden = false; document.body.classList.add('corriendo');
}
function terminar() {
  carrera.fase = 'fin'; carrera.finEspera = 1.8;
  if (carrera.racha > 0) { carrera.puntos += Math.round(carrera.racha); carrera.racha = 0; }
  carrera.previo = mejor();
  carrera.puesto = records.registrar('luciernaga', 'hotaru', +carrera.t.toFixed(3), true, { det: `${Math.round(carrera.vmax)} km/h de punta · ${carrera.puntos} de derrape` });
  const record = carrera.puesto === 0;
  mensaje(record ? 'Nuevo récord' : 'Abajo', false, 2); ui.cuenta(true); inp.vibrar(0.6, 0.8, 300);
}
function pantallaFin() {
  const record = carrera.puesto === 0, pr = carrera.previo;
  $('fTitulo').textContent = record ? 'Nuevo récord' : 'Abajo';
  $('fSub').textContent = record && pr ? `Le quitaste ${(pr.v - carrera.t).toFixed(2)} s a tu mejor bajada.` : record ? 'Primera bajada registrada. Ese es el tiempo a batir.'
    : carrera.t - pr.v < 0.005 ? 'Igualaste tu mejor bajada.' : `Te faltaron ${(carrera.t - pr.v).toFixed(2)} s para tu mejor bajada.`;
  $('fTabla').innerHTML = `<tr class="yo"><td>Tiempo</td><td>${tiempo(carrera.t)}</td></tr><tr><td>Tu mejor bajada</td><td>${tiempo(record ? carrera.t : pr.v)}</td></tr>`
    + `<tr><td>Velocidad de punta</td><td>${Math.round(carrera.vmax)} km/h</td></tr><tr><td>Derrape</td><td>${carrera.puntos.toLocaleString('es-CO')} puntos</td></tr>`;
  document.body.classList.remove('corriendo'); hMsg.classList.remove('ver'); msgT = 0;
  menus.abrir($('pFin'), 0);
}
function tickCuenta(dt) {
  carrera.cuenta -= dt;
  const n = Math.ceil(carrera.cuenta);
  if (n === cuentaVista) return;
  cuentaVista = n; hCuenta.hidden = false;
  if (n > 0) { hCuenta.textContent = n; hCuenta.classList.remove('ya'); ui.cuenta(false); return; }
  hCuenta.textContent = 'YA'; hCuenta.classList.add('ya'); ui.cuenta(true); inp.vibrar(0.2, 0.6, 150);
  carrera.fase = 'carrera'; carrera.t = 0; ocultarCuenta = 0.8;
}

function leerMando() { ent.gas = inp.v('acelerar'); ent.freno = inp.v('frenar'); ent.giro = inp.e('giro'); ent.mano = inp.p('mano'); }

const DT_F = 1 / 120;
let acum = 0;
function conducir(dt) {
  acum = Math.min(acum + dt, 0.1);
  while (acum >= DT_F) {
    acum -= DT_F;
    // Pasada la meta nadie conduce: el piloto automático mantiene el coche en la carretera mientras frena a fondo.
    const libre = carrera.fase !== 'carrera';
    if (auto.on || libre) { auto.pensar(); if (libre) { ent.gas = 0; ent.freno = veh.u > 0.4 ? 1 : 0; } }
    veh.paso(DT_F, ent, P);
    if (carrera.fase === 'carrera') carrera.t += DT_F;
    if (veh.evento === 'sube' || veh.evento === 'baja') { son.cambio(veh.evento === 'sube'); inp.vibrar(0.12, 0.3, 60); if (veh.evento === 'sube' && veh.turbo > 0.5) petardos.push(0.03); }
    else if (veh.evento === 'corte' && Math.random() < 0.06) petardos.push(0);
    if (veh.soplido > 0) { son.soplido(veh.soplido); if (veh.rpm > 5200) petardos.push(0.08, 0.2 + Math.random() * 0.2); veh.soplido = 0; }
    if (veh.golpe > 0) golpear(veh.golpe, veh.ladoGolpe);
    if (veh.sup.i >= P.n - 4 && veh.u > 0) veh.u = 0;
    if (veh.sup.i <= 1 && veh.u < 0) veh.u = 0;
    if (carrera.fase === 'carrera' && veh.sup.i >= P.iMeta && veh.u > 0) terminar();
  }
}
function golpear(k, lado) {
  veh.golpe = 0;
  sacudida.sumar(k * 0.8); fx.uniforms.uGolpe.value = Math.max(fx.uniforms.uGolpe.value, k); inp.vibrar(k, k * 0.7, 180); son.golpe(k, -lado * 0.5);
  const n = Math.round(14 * k * q.particulas), s = veh.sup, ox = veh.x + s.rx * lado * 0.9, oz = veh.z + s.rz * lado * 0.9;
  for (let i = 0; i < n; i++) chispas.emitir(ox, veh.y + 0.4 + Math.random() * 0.4, oz, s.tx * veh.u * 0.5 + (Math.random() - 0.5) * 5 - s.rx * lado * 3, 1.5 + Math.random() * 4, s.tz * veh.u * 0.5 + (Math.random() - 0.5) * 5 - s.rz * lado * 3, 0.5, 0.11, 2.6, 1.5, 0.5, 1, 16, 0.6, 0);
  if (carrera.racha > 0) { carrera.racha = 0; perdidoT = 1.1; $('hDerrapeN').textContent = 'perdido'; $('hDerrapeT').textContent = 'tocaste el borde'; hDerrape.classList.add('ver', 'perdido'); }
}

function reglas(dt) {
  const vel = Math.hypot(veh.u, veh.v);
  if (carrera.fase === 'carrera') {
    carrera.vmax = Math.max(carrera.vmax, veh.kmh);
    // Derrape: puntos mientras el coche va de lado y rápido. Se cobran al enderezar; tocar el borde los pierde.
    const derrapa = Math.abs(veh.deriva) > 0.2 && vel > 11 && veh.u > 0;
    if (perdidoT > 0) { if ((perdidoT -= dt) <= 0) hDerrape.classList.remove('ver', 'perdido'); }
    else if (derrapa) {
      carrera.racha += Math.abs(veh.deriva) * vel * dt * 7; carrera.rachaT = 0.7;
      $('hDerrapeN').textContent = Math.round(carrera.racha).toLocaleString('es-CO'); $('hDerrapeT').textContent = `derrape · ${Math.round(Math.abs(veh.deriva) * 57.3)}°`; hDerrape.classList.add('ver');
    } else if (carrera.racha > 0 && (carrera.rachaT -= dt) <= 0) {
      carrera.puntos += Math.round(carrera.racha); carrera.racha = 0; hDerrape.classList.remove('ver');
    }
    const s = veh.sup, haciaAdelante = Math.sin(veh.psi) * s.tx + Math.cos(veh.psi) * s.tz;
    carrera.contra = haciaAdelante < -0.35 && veh.u > 3 ? carrera.contra + dt : 0;
    if (carrera.contra > 0.6 && msgT <= 0) mensaje('Sentido contrario', true, 0.5);
  }
  if (msgT > 0 && (msgT -= dt) <= 0) hMsg.classList.remove('ver');
  if (ocultarCuenta > 0 && (ocultarCuenta -= dt) <= 0) hCuenta.hidden = true;
  if (carrera.fase === 'fin' && (carrera.finEspera -= dt) <= 0) { carrera.fase = 'resultado'; pantallaFin(); }
  // El mando cuenta lo que hacen las llantas: zumbido fino al deslizar, golpeteo en el arcén.
  if ((tVib -= dt) <= 0 && jugando && !pausado) {
    tVib = 0.09;
    if (veh.arcen && vel > 4) inp.vibrar(0.45, 0.2, 100); else if (veh.chirrido > 0.18) inp.vibrar(veh.chirrido * 0.3, veh.chirrido * 0.75, 100);
  }
}

// Piloto automático: sigue la línea central y frena para las curvas. Hoy sirve para probar; será la base de los rivales.
const auto = {
  on: false,
  pensar() {
    const s = veh.sup, vel = Math.abs(veh.u), adel = Math.min(P.n - 1, s.i + 3 + Math.round(vel * 0.32));
    const err = Math.atan2(Math.sin(Math.atan2(P.px[adel] - veh.x, P.pz[adel] - veh.z) - veh.psi), Math.cos(Math.atan2(P.px[adel] - veh.x, P.pz[adel] - veh.z) - veh.psi));
    let vmax = 60;
    for (let k = 0; k < 34 && s.i + k < P.n; k++) { const c = Math.abs(P.curv[s.i + k]); if (c > 0.004) vmax = Math.min(vmax, Math.sqrt(9.2 / c) + k * PASO_AUTO); }
    ent.giro = clamp(-err * 2.6, -1, 1); ent.gas = vel < vmax ? 0.85 : 0; ent.freno = vel > vmax + 1.5 ? clamp((vel - vmax) / 6, 0.2, 1) : 0; ent.mano = false;
  },
};
const PASO_AUTO = 0.55;

// ───────────── Coche en pantalla: postura, ruedas, luces, humo ─────────────
let giroRueda = 0, giroTras = 0, cabeceo = 0, balanceo = 0, frenoLuz = 0, destello = 0;
function vestirCoche(dt) {
  const s = veh.sup, vel = Math.hypot(veh.u, veh.v), fxh = Math.sin(veh.psi), fzh = Math.cos(veh.psi);
  const cuesta = (s.ty || 0) * (fxh * (s.tx || 0) + fzh * (s.tz || 1)), lateral = (s.peralte || 0) * (fxh * (s.tz || 1) - fzh * (s.tx || 0));
  coche.grupo.position.set(veh.x, veh.y, veh.z);
  coche.grupo.rotation.set(-Math.atan(cuesta), veh.psi, lateral, 'YXZ');
  cabeceo = amort(cabeceo, clamp(-veh.gLon * 0.0042, -0.035, 0.05), 7, dt);
  balanceo = amort(balanceo, clamp(veh.gLat * 0.0048, -0.06, 0.06), 6, dt);
  coche.cuerpo.rotation.set(cabeceo, 0, balanceo);
  coche.cuerpo.position.y = vel > 2 ? Math.sin(uT.value * 31) * 0.0022 * clamp(vel / 30, 0, 1) + (veh.arcen ? Math.sin(uT.value * 55) * 0.012 : 0) : 0;
  giroRueda += veh.u / coche.E.radio * dt;
  giroTras += (ent.mano && veh.marcha > 0 ? 0 : veh.u / coche.E.radio + veh.patinaje * 26 * (veh.marcha > 0 ? 1 : -1)) * dt;
  for (const r of coche.ruedas) { r.giro.rotation.x = r.delantera ? giroRueda : giroTras; if (r.delantera) r.pivote.rotation.y = veh.delta; }
  const frena = (veh.marcha > 0 ? ent.freno : ent.gas) > 0.05 || ent.mano ? 1 : 0;
  frenoLuz = amort(frenoLuz, frena, 22, dt); coche.luzFreno(frenoLuz); piloto.intensity = 2.5 + frenoLuz * 22;
  destello = Math.max(0, destello - dt * 9); coche.escape(destello);

  // Humo de las ruedas traseras al deslizar, y petardeo por el escape al soltar gas con el turbo cargado.
  if (veh.chirrido > 0.3 && vel > 6 && q.particulas > 0) for (const sx of [-1, 1]) {
    if (Math.random() > veh.chirrido * 0.75) continue;
    const lx = Math.cos(veh.psi) * sx * 0.78, lz = -Math.sin(veh.psi) * sx * 0.78, g = 0.3 + Math.random() * 0.12;
    humo.emitir(veh.x - fxh * 1.35 + lx, veh.y + 0.14, veh.z - fzh * 1.35 + lz, (Math.random() - 0.5) * 1.6, 0.5 + Math.random() * 0.9, (Math.random() - 0.5) * 1.6, 0.9 + Math.random() * 0.5, 0.5, g, g, g * 1.08, 0.2 * veh.chirrido, -0.35, 0.9, 3.4);
  }
  for (let k = petardos.length - 1; k >= 0; k--) if ((petardos[k] -= dt) <= 0) {
    petardos.splice(k, 1); son.petardeo(0.7 + Math.random() * 0.5); destello = 1;
    const ex = veh.x - fxh * 2.4 + Math.cos(veh.psi) * 0.42, ez = veh.z - fzh * 2.4 - Math.sin(veh.psi) * 0.42;
    for (let i = 0; i < 5; i++) chispas.emitir(ex, veh.y + 0.28, ez, -fxh * (3 + Math.random() * 4) + veh.u * fxh * 0.9, Math.random() * 0.6, -fzh * (3 + Math.random() * 4) + veh.u * fzh * 0.9, 0.1 + Math.random() * 0.08, 0.2, 2.8, 1.3 + Math.random(), 0.35, 1, 0, 2, 1.2);
  }
  humo.actualizar(dt, camara, altoPx); chispas.actualizar(dt, camara, altoPx);
}

// ───────────── Cámara ─────────────
const cam = { yaw: 0, pos: new THREE.Vector3(), modo: 0, fov: 60, t: 0, listo: false, mirar: 0 }, camSup = { i: 0 };
const MODOS = [{ dist: 6.2, alto: 2.0, mira: 1.2, adel: 2.4 }, { dist: 4.5, alto: 1.15, mira: 0.9, adel: 1.6 }, { capo: true }];
function moverCamara(dt) {
  const vel = Math.hypot(veh.u, veh.v);
  let fov;
  if (carrera.fase === 'titulo') {   // escaparate: la cámara rodea despacio el coche parado
    cam.t += dt; const a = veh.psi + 2.45 + cam.t * 0.16, r = 6.1 + Math.sin(cam.t * 0.17) * 0.6;
    camara.position.set(veh.x + Math.sin(a) * r, veh.y + 1.15 + Math.sin(cam.t * 0.2) * 0.4, veh.z + Math.cos(a) * r);
    camara.lookAt(veh.x, veh.y + 0.72, veh.z); fov = 40; cam.listo = false;
  } else {
    const m = MODOS[cam.modo];
    cam.mirar = amort(cam.mirar, inp.p('atras') ? Math.PI : inp.e('mirar') * 1.9, 9, dt);
    const obj = veh.psi + (vel > 5 ? Math.atan2(veh.v, Math.abs(veh.u)) * 0.55 : 0);
    cam.yaw += Math.atan2(Math.sin(obj - cam.yaw), Math.cos(obj - cam.yaw)) * (1 - Math.exp(-6 * dt));
    const a = cam.yaw + cam.mirar, sx = Math.sin(a), sz = Math.cos(a);
    if (m.capo) {
      const fxh = Math.sin(veh.psi), fzh = Math.cos(veh.psi);
      camara.position.set(veh.x + fxh * 0.75, veh.y + 1.08, veh.z + fzh * 0.75); camara.lookAt(veh.x + sx * 20, veh.y + 0.75 + (veh.sup.ty || 0) * 20, veh.z + sz * 20); fov = 68;
    } else {
      let px = veh.x - sx * m.dist, pz = veh.z - sz * m.dist;
      // La cámara no sale de la carretera: en las horquillas se iba detrás del guardarraíl y atravesaba las señales.
      P.consulta(px, pz, veh.sup.i, camSup);
      const sobra = Math.abs(camSup.lat) - (camSup.ancho + 0.2);
      if (sobra > 0) { const lado = Math.sign(camSup.lat); px -= camSup.rx * lado * sobra; pz -= camSup.rz * lado * sobra; }
      const py = Math.max(veh.y + m.alto, P.terreno(px, pz) + 0.75);
      if (!cam.listo) { cam.pos.set(px, py, pz); cam.listo = true; }
      cam.pos.set(amort(cam.pos.x, px, 13, dt), amort(cam.pos.y, py, 7, dt), amort(cam.pos.z, pz, 13, dt));
      camara.position.copy(cam.pos); camara.lookAt(veh.x + sx * m.adel, veh.y + m.mira, veh.z + sz * m.adel);
      fov = 56 + clamp(vel / 62, 0, 1.15) * 18 + veh.turbo * 2;
    }
    if (vel > 38) sacudida.sumar((vel - 38) * 0.0009 * dt * 60);
    sacudida.aplicar(camara, dt);
  }
  cam.fov = amort(cam.fov, fov, 5, dt);
  if (Math.abs(camara.fov - cam.fov) > 0.04) { camara.fov = cam.fov; camara.updateProjectionMatrix(); }
  luna.position.set(veh.x + NOCHE.luna.x * 170, veh.y + NOCHE.luna.y * 170, veh.z + NOCHE.luna.z * 170); luna.target.position.set(veh.x, veh.y, veh.z);
  cielo.mesh.position.copy(camara.position); cielo.u.uCam.value.copy(camara.position);
  bichos.u.uEscala.value = altoPx / (2 * Math.tan(THREE.MathUtils.degToRad(camara.fov) / 2));
  fx.uniforms.uVel.value = carrera.fase === 'titulo' ? 0 : clamp((vel - 14) / 55, 0, 1);
  fx.uniforms.uGolpe.value = Math.max(0, fx.uniforms.uGolpe.value - dt * 2.5);
}

// ───────────── HUD ─────────────
const gR = $('hReloj').getContext('2d'), gM = $('hMapa').getContext('2d');
const SEG = 36, A0 = Math.PI * 0.75, BARRIDO = Math.PI * 1.5;
function pintarReloj(rpm, marcha, kmh, turbo) {
  const W = 660, c = W / 2, paso = BARRIDO / SEG, hueco = 0.022, enc = rpm / 250;
  gR.clearRect(0, 0, W, W);
  gR.fillStyle = 'rgba(5,7,13,0.5)'; gR.beginPath(); gR.arc(c, c, 306, 0, 7); gR.fill();
  gR.lineWidth = 38; gR.lineCap = 'butt';
  for (let k = 0; k < SEG; k++) {
    const rojo = k >= 30, on = k < enc;
    gR.strokeStyle = on ? (rojo ? '#ff2d3d' : '#ffb35c') : (rojo ? 'rgba(255,45,61,0.26)' : 'rgba(255,255,255,0.1)');
    if (on) { gR.shadowColor = rojo ? '#ff2d3d' : '#ff9a3c'; gR.shadowBlur = 16; } else gR.shadowBlur = 0;
    gR.beginPath(); gR.arc(c, c, 262, A0 + k * paso + hueco / 2, A0 + (k + 1) * paso - hueco / 2); gR.stroke();
  }
  gR.shadowBlur = 0; gR.textAlign = 'center'; gR.textBaseline = 'middle';
  gR.font = "600 25px 'Saira', sans-serif"; gR.fillStyle = 'rgba(239,233,220,0.5)';
  for (let k = 0; k <= 9; k++) { const a = A0 + k * 4 * paso; gR.fillText(k, c + Math.cos(a) * 212, c + Math.sin(a) * 212); }
  gR.fillStyle = '#efe9dc'; gR.font = "800 172px 'Saira Extra Condensed', 'Arial Narrow', sans-serif"; gR.fillText(kmh, c, c + 6);
  gR.font = "400 24px 'Saira', sans-serif"; gR.fillStyle = 'rgba(169,179,199,0.9)'; gR.fillText('km/h', c, c + 92);
  gR.font = "800 84px 'Saira Extra Condensed', 'Arial Narrow', sans-serif"; gR.fillStyle = '#ffb35c'; gR.fillText(marcha, c, c - 118);
  gR.fillStyle = 'rgba(255,255,255,0.12)'; gR.fillRect(c - 84, c + 132, 168, 7);
  gR.fillStyle = '#9db4ff'; gR.fillRect(c - 84, c + 132, 168 * turbo, 7);
  gR.font = "400 20px 'Saira', sans-serif"; gR.fillStyle = 'rgba(169,179,199,0.75)'; gR.fillText('turbo', c, c + 162);
}
const mapaBase = document.createElement('canvas'); mapaBase.width = 340; mapaBase.height = 440;
const mp = (() => {
  let a = Infinity, b = -Infinity, c = Infinity, d = -Infinity;
  for (let i = 0; i < P.n; i++) { a = Math.min(a, P.px[i]); b = Math.max(b, P.px[i]); c = Math.min(c, P.pz[i]); d = Math.max(d, P.pz[i]); }
  const esc = Math.min(290 / (b - a), 390 / (d - c));
  return { esc, cx: (a + b) / 2, cz: (c + d) / 2 };
})();
// Norte (+z) arriba; x se invierte porque, mirando hacia +z, +x queda a la izquierda.
const mx = (x) => 170 - (x - mp.cx) * mp.esc, my = (z) => 220 - (z - mp.cz) * mp.esc;
{
  const g = mapaBase.getContext('2d'); g.lineJoin = g.lineCap = 'round';
  const trazo = (i0, i1) => { g.beginPath(); for (let i = i0; i <= i1; i++) i === i0 ? g.moveTo(mx(P.px[i]), my(P.pz[i])) : g.lineTo(mx(P.px[i]), my(P.pz[i])); g.stroke(); };
  g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 15; trazo(0, P.n - 1);
  g.strokeStyle = 'rgba(157,180,255,0.35)'; g.lineWidth = 7; trazo(0, P.n - 1);
  g.strokeStyle = '#c9d4ff'; g.lineWidth = 7; trazo(P.iInicio, P.iMeta);
  for (const [i, col] of [[P.iInicio, '#efe9dc'], [P.iMeta, '#ffb35c']]) { g.fillStyle = col; g.beginPath(); g.arc(mx(P.px[i]), my(P.pz[i]), 9, 0, 7); g.fill(); }
}
const tramo = P.dist[P.iMeta] - P.dist[P.iInicio];
function pintarHud() {
  const enCuenta = carrera.fase === 'cuenta';
  rpmVisible = enCuenta ? amort(rpmVisible, AJUSTE.raijin.ralenti + inp.v('acelerar') * 5600, 9, 1 / 60) : veh.rpm;
  pintarReloj(rpmVisible, veh.marcha < 0 ? 'R' : enCuenta ? 'N' : veh.marcha, Math.round(veh.kmh), veh.turbo);
  $('hTiempo').textContent = tiempo(carrera.t);
  const hecho = clamp((veh.sup.dist - P.dist[P.iInicio]) / tramo, 0, 1);
  $('hAvance').style.width = (hecho * 100).toFixed(1) + '%';
  $('hFalta').textContent = hecho >= 1 ? 'Meta' : `Faltan ${Math.round((1 - hecho) * tramo)} m`;
  gM.clearRect(0, 0, 340, 440); gM.drawImage(mapaBase, 0, 0);
  gM.fillStyle = '#ffb35c'; gM.strokeStyle = '#05070d'; gM.lineWidth = 4; gM.beginPath(); gM.arc(mx(veh.x), my(veh.z), 10, 0, 7); gM.fill(); gM.stroke();
}
function pintarMejor() {
  const m = mejor();
  $('hMejor').textContent = m ? tiempo(m.v) : '—';
  $('tRecord').textContent = m ? `Tu mejor bajada: ${tiempo(m.v)} · ${m.f}` : 'Aún sin tiempo: llega abajo para marcar el primero.';
}
$('hPie').textContent = 'Pausa: Esc o Start · Volver a la carretera: R o Select · Cámara: C o Y';

// ───────────── Sonido: nace apagado (jue_sonido). Encendido, arranca con la primera tecla o clic ─────────────
const son = new Sonidos(), musica = new Musica(CANCION);
let sonidoOn = sonidoActivo(), faltaGesto = null;
addEventListener('pointerdown', () => iniciarAudio());
addEventListener('keydown', () => iniciarAudio());
function sonidoCuadro() {
  const falta = sonidoOn && !audio.activo();
  if (falta !== faltaGesto) { faltaGesto = falta; $('tSonido').hidden = !falta; }
  if (!son.preparar()) return;
  const activo = jugando && !pausado;
  son.encender(activo);
  if (activo) {
    const enCuenta = carrera.fase === 'cuenta';
    son.actualizar({ rpm: enCuenta ? rpmVisible : veh.rpm, gas: enCuenta ? inp.v('acelerar') : (veh.marcha < 0 ? ent.freno : ent.gas), turbo: enCuenta ? 0 : veh.turbo,
      chirrido: veh.chirrido, vel: Math.hypot(veh.u, veh.v), arcen: veh.arcen && Math.abs(veh.u) > 2, corte: veh.cambio > 0 });
    if (!musica.sonando) musica.iniciar();
  } else if (musica.sonando) musica.parar();
}

// ───────────── Menús: todos se manejan con cruceta o stick, A elige, B vuelve, Start reanuda ─────────────
let jugando = false, pausado = false, ultimo = 0, padsVistos = null, cuadroN = 0;
$('tablaCtl').innerHTML = '<tr><th>Acción</th><th>Teclado</th><th>Mando</th></tr>' + CONTROLES.map(([a, t, m]) => `<tr><td>${a}</td><td>${t}</td><td>${m}</td></tr>`).join('');
opcion($('mPintura'), PINTURAS.map((p) => p.nombre), pintura.nombre, 'Pintura', (v) => { const p = PINTURAS.find((x) => x.nombre === v); coche.pintar(p); pref.pintura = p.id; guardarPref(); });
const TXT_AYUDA = 'Ayuda de derrape';
const ponerAyuda = (v) => { pref.ayuda = v; veh.aj.ayuda = AYUDAS[v]; guardarPref(); for (const id of ['mAyuda', 'pAyuda']) $(id).innerHTML = `<span>${TXT_AYUDA}</span><b>‹ ${v} ›</b>`; };
for (const id of ['mAyuda', 'pAyuda']) {
  const b = $(id), mover = (d) => { const k = Object.keys(AYUDAS); ponerAyuda(k[(k.indexOf(pref.ayuda) + d + k.length) % k.length]); };
  b.dataset.nav = 'opcion'; b.addEventListener('click', () => mover(1)); b.addEventListener('ajustar', (e) => mover(e.detail));
}
ponerAyuda(pref.ayuda in AYUDAS ? pref.ayuda : 'media');
opcion($('mCal'), NIVELES, nivel, 'Calidad', (v) => { fijarCalidad(v); location.reload(); });
const PASOS_VOL = ['0%', '25%', '50%', '75%', '100%'], aPaso = (v) => PASOS_VOL[Math.round(v * 4)];
opcion($('pMusica'), PASOS_VOL, aPaso(volumenes().musica), 'Música', (v) => fijarVolumen('musica', parseInt(v, 10) / 100));
opcion($('pEfectos'), PASOS_VOL, aPaso(volumenes().efectos), 'Efectos', (v) => { fijarVolumen('efectos', parseInt(v, 10) / 100); ui.ok(); });
opcion($('pVib'), ['sí', 'no'], vibracionActiva() ? 'sí' : 'no', 'Vibración', (v) => { fijarVibracion(v === 'sí'); inp.vibracion = v === 'sí'; if (v === 'sí') inp.vibrar(0.5, 0.5, 150); });
function pintarSonido() { for (const id of ['mSonido', 'pSonido']) $(id).innerHTML = `<span>Sonido</span><b>‹ ${sonidoOn ? 'sí' : 'no'} ›</b>`; }
for (const id of ['mSonido', 'pSonido']) {
  const b = $(id), cambiar = () => { sonidoOn = !sonidoOn; fijarSonido(sonidoOn); pintarSonido(); if (sonidoOn) ui.ok(); };
  b.dataset.nav = 'opcion'; b.addEventListener('click', cambiar); b.addEventListener('ajustar', cambiar);
}
pintarSonido();
function pintarPad() {
  if (inp.pads === padsVistos) return;
  padsVistos = inp.pads;
  const p = inp.pads.find((x) => x.activo), n = inp.pads.length;
  $('tPad').hidden = !p; if (!p) return;
  $('tPad').textContent = `Control en uso: ${p.nombre}` + (n > 1 ? ` · hay ${n} conectados: manda el último en el que pulses un botón (se puede fijar uno en la sala de juegos)` : '')
    + (!p.estandar && !inp.mapas[p.id] ? ' · no usa el mapa estándar: configúralo en la sala de juegos' : '');
}
function empezar() { iniciarAudio(); ui.ok(); nuevaBajada(); }
function pausar() { if (!jugando || pausado || menus.abierto) return; pausado = true; document.body.classList.remove('corriendo'); menus.abrir($('pPausa'), 0); }
function seguir() { pausado = false; menus.cerrarTodo(); document.body.classList.add('corriendo'); }
function alMenu() {
  jugando = false; pausado = false; carrera.fase = 'titulo'; $('hud').hidden = true; hCuenta.hidden = true; document.body.classList.remove('corriendo');
  menus.cerrarTodo(); veh.colocar(P, SALIDA, -1.5); pintarMejor(); menus.abrir($('pTitulo'), 0);
}
$('mJugar').addEventListener('click', empezar);
for (const id of ['mCtl', 'pCtl']) $(id).addEventListener('click', () => { ui.ok(); menus.abrir($('pControles'), 0); });
$('cVolver').addEventListener('click', () => { ui.atras(); menus.cerrar(); });
$('mSalir').addEventListener('click', () => { location.href = '../juegos.html'; });
$('pSeguir').addEventListener('click', seguir);
$('pReiniciar').addEventListener('click', () => { ui.ok(); nuevaBajada(); });
$('pMenu').addEventListener('click', alMenu);
$('fOtra').addEventListener('click', () => { ui.ok(); pintarMejor(); nuevaBajada(); });
$('fMenu').addEventListener('click', alMenu);
document.addEventListener('visibilitychange', () => { if (document.hidden) pausar(); });
inp.alPerderPad = () => pausar();
addEventListener('keydown', (e) => { if (e.code === 'F3') { e.preventDefault(); medidor.alternar(); } });

// ───────────── Bucle ─────────────
function cuadro(t) { requestAnimationFrame(cuadro); unCuadro(t); }
// El cuadro va aparte del `requestAnimationFrame` a propósito: con la pestaña o el panel ocultos el navegador no
// anima (0 cuadros) y las pruebas necesitan poder avanzar el juego a mano con `__lc.unCuadro(performance.now())`.
function unCuadro(t) {
  const dt = clamp((t - ultimo) / 1000 || 0.016, 0, 0.05); ultimo = Math.max(ultimo, t);
  medidor.inicio();
  inp.actualizar(); pintarPad();
  if (!audio.activo() && inp.botones[BOTON.A] > 0.5 && inp.previos[BOTON.A] <= 0.5) iniciarAudio();
  if (menus.abierto) {
    menus.actualizar(dt);
    if (pausado && inp.botones[BOTON.START] > 0.5 && inp.previos[BOTON.START] <= 0.5) $('pSeguir').click();
    if (jugando && !pausado && carrera.fase === 'resultado') conducir(dt);   // detrás del resultado el coche termina de frenar, no se congela
  } else if (jugando) {
    if (inp.j('pausa')) pausar();
    else {
      if (inp.j('camara')) { cam.modo = (cam.modo + 1) % MODOS.length; cam.listo = false; }
      if (carrera.fase === 'cuenta') tickCuenta(dt);
      else {
        if (carrera.fase === 'carrera' && inp.j('reaparecer')) { veh.colocar(P, clamp(veh.sup.i, 2, P.n - 6)); cam.listo = false; ui.atras(); }
        if (!auto.on && carrera.fase === 'carrera') leerMando();
        conducir(dt);
      }
      pintarHud();
    }
  }
  if (!pausado) {
    uT.value += dt; cielo.u.uT.value = uT.value; fx.uniforms.uT.value = uT.value;
    if (jugando) reglas(dt);
    vestirCoche(dt);
  }
  sonidoCuadro();
  moverCamara(dt);
  if ((cuadroN++ & 7) === 0) repartirFocos(veh.x + Math.sin(veh.psi) * 14, veh.z + Math.cos(veh.psi) * 14);
  composer.render();
  medidor.fin(dt);
}

tamano();
$('cargando').remove();
pintarMejor();
menus.abrir($('pTitulo'), 0);
requestAnimationFrame(cuadro);
// Para pruebas desde la consola: estado, piloto automático y medición del motor sin altavoces. El juego no lo usa.
window.__lc = { veh, P, renderer, scene, camara, carrera, inp, ent, auto, cam, coche, medirMotor, nuevaBajada, unCuadro, tamano,
  sonido: () => ({ activado: sonidoOn, contexto: audio.ctx ? audio.ctx.state : null, motor: son.listo, musica: musica.sonando }) };
