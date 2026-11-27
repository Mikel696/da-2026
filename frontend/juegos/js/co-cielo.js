// 19-JUE · Cielo HDR: encuentra el sol en la foto del cielo, mide cuánta luz da y lo quita del entorno (así no se cuenta
// dos veces: va aparte, en un foco con sombras). De noche, sin sol, la luz viene de arriba. Licencia: MIT (código propio).
import * as THREE from 'three';

export function leerCielo(tex) {
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
