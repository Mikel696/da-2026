// 19-JUE · Render compartido: perfiles de calidad, bloom, entorno para reflejos, partículas y cielo.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// Meta del encargo: 60 fps a 1080p en «media» con i3-10100 + RX 580.
export const PERFILES = {
  baja: { escala: 0.75, msaa: 0, sombras: 0, bloom: false, particulas: 0.5, distancia: 0.75 },
  media: { escala: 1, msaa: 4, sombras: 1024, bloom: true, particulas: 1, distancia: 1 },
  alta: { escala: Math.min(window.devicePixelRatio || 1, 2), msaa: 4, sombras: 2048, bloom: true, particulas: 1.6, distancia: 1.3 },
};

export function crearRender(canvas, nivel, { exposicion = 1, bloom = {} } = {}) {
  const q = PERFILES[nivel] || PERFILES.media;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !q.bloom && q.msaa > 0, powerPreference: 'high-performance', stencil: false });
  renderer.setPixelRatio(q.escala);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = exposicion;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = q.sombras > 0;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  let composer = null, bloomPass = null, camara = null;
  const r = {
    renderer, q, nivel,
    montar(scene, camera) {
      camara = camera;
      if (q.bloom) {
        const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: q.msaa });
        composer = new EffectComposer(renderer, rt);
        composer.addPass(new RenderPass(scene, camera));
        bloomPass = new UnrealBloomPass(new THREE.Vector2(256, 256), bloom.fuerza ?? 0.8, bloom.radio ?? 0.5, bloom.umbral ?? 0.82);
        composer.addPass(bloomPass);
        composer.addPass(new OutputPass());
        r.bloom = bloomPass;
      }
      this.tamano();
      addEventListener('resize', () => this.tamano());
      r.escena = scene;
    },
    tamano() {
      const w = innerWidth, h = innerHeight;
      renderer.setSize(w, h, false);
      if (composer) { composer.setPixelRatio(q.escala); composer.setSize(w, h); }
      if (camara) { camara.aspect = w / h; camara.updateProjectionMatrix(); }
      r.alto = h * renderer.getPixelRatio();
    },
    dibujar(scene, camera) { if (composer) composer.render(); else renderer.render(scene, camera); },
    entorno(scene, intensidad = 0.35) {
      const pm = new THREE.PMREMGenerator(renderer);
      scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environmentIntensity = intensidad;
      pm.dispose();
    },
  };
  return r;
}

export function texturaCanvas(w, h, dibujar, { repetir = [1, 1], srgb = true } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  dibujar(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repetir[0], repetir[1]);
  t.anisotropy = 8;
  return t;
}

/** Cúpula de cielo con degradado y estrellas, sin texturas. */
export function cielo({ arriba = 0x05060f, horizonte = 0x2a1440, abajo = 0x020205, estrellas = 1, radio = 900 } = {}) {
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { cA: { value: new THREE.Color(arriba) }, cH: { value: new THREE.Color(horizonte) }, cB: { value: new THREE.Color(abajo) }, uE: { value: estrellas } },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); vec4 p = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * p; gl_Position.z = gl_Position.w; }',
    fragmentShader: `uniform vec3 cA,cH,cB; uniform float uE; varying vec3 vD;
      float h(vec3 p){ p = fract(p*0.3183099 + 0.1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
      void main(){ float y = vD.y; vec3 c = y > 0.0 ? mix(cH, cA, pow(clamp(y,0.0,1.0), 0.45)) : mix(cH, cB, pow(clamp(-y,0.0,1.0), 0.3));
        vec3 g = floor(vD * 420.0); float s = h(g); float est = step(0.9975, s) * smoothstep(0.02, 0.25, y) * uE;
        c += vec3(est) * (0.6 + 0.4 * h(g + 3.1));
        gl_FragColor = vec4(c, 1.0); }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radio, 32, 16), m);
  mesh.frustumCulled = false; mesh.renderOrder = -1;
  return mesh;
}

/** Partículas en GPU con piscina fija: chispas, humo, fuego, escombros. Un draw call por sistema. */
export class Particulas {
  constructor(scene, max, { aditivo = true, suave = 0.5 } = {}) {
    this.max = max; this.i = 0; this.vivas = 0;
    this.pos = new Float32Array(max * 3); this.vel = new Float32Array(max * 3);
    this.col = new Float32Array(max * 4); this.tam = new Float32Array(max);
    this.vida = new Float32Array(max); this.vidaMax = new Float32Array(max);
    this.grav = new Float32Array(max); this.arr = new Float32Array(max); this.tam0 = new Float32Array(max); this.crece = new Float32Array(max);
    const g = new THREE.BufferGeometry();
    this.aPos = new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage);
    this.aCol = new THREE.BufferAttribute(this.col, 4).setUsage(THREE.DynamicDrawUsage);
    this.aTam = new THREE.BufferAttribute(this.tam, 1).setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('position', this.aPos); g.setAttribute('color', this.aCol); g.setAttribute('tam', this.aTam);
    this.mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: aditivo ? THREE.AdditiveBlending : THREE.NormalBlending,
      uniforms: { uEscala: { value: 600 }, uSuave: { value: suave } },
      vertexShader: 'attribute vec4 color; attribute float tam; uniform float uEscala; varying vec4 vC; void main(){ vC = color; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = tam * uEscala / max(0.1, -mv.z); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform float uSuave; varying vec4 vC; void main(){ float d = length(gl_PointCoord - 0.5) * 2.0; if (d > 1.0) discard; float a = 1.0 - smoothstep(1.0 - uSuave, 1.0, d); gl_FragColor = vec4(vC.rgb, vC.a * a); }',
    });
    this.puntos = new THREE.Points(g, this.mat);
    this.puntos.frustumCulled = false;
    scene.add(this.puntos);
  }
  emitir(x, y, z, vx, vy, vz, vida, tam, r, g, b, a = 1, grav = 0, arrastre = 0, crece = 0) {
    const i = this.i; this.i = (this.i + 1) % this.max;
    this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z;
    this.vel[i * 3] = vx; this.vel[i * 3 + 1] = vy; this.vel[i * 3 + 2] = vz;
    this.col[i * 4] = r; this.col[i * 4 + 1] = g; this.col[i * 4 + 2] = b; this.col[i * 4 + 3] = a;
    this.vida[i] = vida; this.vidaMax[i] = vida; this.tam[i] = tam; this.tam0[i] = tam;
    this.grav[i] = grav; this.arr[i] = arrastre; this.crece[i] = crece;
  }
  actualizar(dt, camara, altoPx) {
    if (camara) this.mat.uniforms.uEscala.value = altoPx / (2 * Math.tan(THREE.MathUtils.degToRad(camara.fov) / 2));
    const p = this.pos, v = this.vel, c = this.col;
    for (let i = 0; i < this.max; i++) {
      if (this.vida[i] <= 0) { if (this.tam[i] !== 0) { this.tam[i] = 0; c[i * 4 + 3] = 0; } continue; }
      const vi = (this.vida[i] -= dt);
      if (vi <= 0) { this.tam[i] = 0; c[i * 4 + 3] = 0; continue; }
      const k = Math.exp(-this.arr[i] * dt);
      v[i * 3] *= k; v[i * 3 + 1] = v[i * 3 + 1] * k - this.grav[i] * dt; v[i * 3 + 2] *= k;
      p[i * 3] += v[i * 3] * dt; p[i * 3 + 1] += v[i * 3 + 1] * dt; p[i * 3 + 2] += v[i * 3 + 2] * dt;
      const t = vi / this.vidaMax[i];
      this.tam[i] = this.tam0[i] * (1 + this.crece[i] * (1 - t));
      c[i * 4 + 3] = Math.min(c[i * 4 + 3], t * 1.6);
    }
    this.aPos.needsUpdate = true; this.aCol.needsUpdate = true; this.aTam.needsUpdate = true;
  }
}
