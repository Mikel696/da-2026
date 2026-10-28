// 19-JUE · Piezas compartidas sin three.js: récords, calidad, menús navegables con control,
// avisos, medidor de rendimiento, sacudida de cámara. El vestíbulo las usa sin cargar el motor 3D.
import { ui } from './sonido.js';

const REC_KEY = 'jue_records';
const CAL_KEY = 'jue_calidad';

export const NIVELES = ['baja', 'media', 'alta'];
export function calidad() { try { const q = localStorage.getItem(CAL_KEY); return NIVELES.includes(q) ? q : 'media'; } catch (e) { return 'media'; } }
export function fijarCalidad(q) { try { localStorage.setItem(CAL_KEY, q); } catch (e) { /* vale para esta partida */ } }

// Récords: solo en este navegador. No pasan por cloud-sync a propósito (ver CLAUDE.md · 19-JUE).
function leerRec() { try { return JSON.parse(localStorage.getItem(REC_KEY)) || {}; } catch (e) { return {}; } }
export const records = {
  lista(juego, tabla) { const r = leerRec(); return (r[juego] && r[juego][tabla]) || []; },
  mejor(juego, tabla) { return this.lista(juego, tabla)[0] || null; },
  /** Devuelve el puesto (0 = nuevo récord) o -1 si no entra en el top 5. */
  registrar(juego, tabla, valor, menorEsMejor = true, extra = {}) {
    const r = leerRec();
    r[juego] = r[juego] || {};
    const l = r[juego][tabla] = r[juego][tabla] || [];
    const fila = Object.assign({ v: valor, f: new Date().toISOString().slice(0, 10) }, extra);
    l.push(fila);
    l.sort((a, b) => menorEsMejor ? a.v - b.v : b.v - a.v);
    if (l.length > 5) l.length = 5;
    try { localStorage.setItem(REC_KEY, JSON.stringify(r)); } catch (e) { return -1; }
    return l.indexOf(fila);
  },
  todos() { return leerRec(); },
};

export function tiempo(seg) {
  if (seg == null || !isFinite(seg)) return '—';
  const m = Math.floor(seg / 60), s = seg - m * 60;
  return m + ':' + (s < 10 ? '0' : '') + s.toFixed(2);
}

/** Pila de pantallas superpuestas. Cruceta/stick mueven el foco, A confirma, B vuelve. */
export class Menus {
  constructor(entrada) { this.inp = entrada; this.pila = []; }
  get abierto() { return this.pila.length > 0; }
  actual() { return this.pila[this.pila.length - 1] || null; }
  abrir(el, foco = 0) {
    const prev = this.actual(); if (prev) prev.hidden = true;
    el.hidden = false; this.pila.push(el);
    requestAnimationFrame(() => this.enfocar(el, foco));
  }
  cerrar() {
    const el = this.pila.pop(); if (el) el.hidden = true;
    const top = this.actual(); if (top) { top.hidden = false; this.enfocar(top, 0); }
  }
  cerrarTodo() { while (this.pila.length) this.pila.pop().hidden = true; }
  items(el) { return [...el.querySelectorAll('[data-nav]')].filter((b) => !b.disabled && b.offsetParent !== null); }
  enfocar(el, i) { const it = this.items(el); if (it.length) it[Math.max(0, Math.min(i, it.length - 1))].focus({ preventScroll: true }); }
  actualizar(dt) {
    const el = this.actual(); if (!el) return false;
    const it = this.items(el); if (!it.length) return true;
    const { dx, dy } = this.inp.menuDir(dt);
    let i = it.indexOf(document.activeElement);
    if (i < 0) { i = 0; if (dx || dy) { it[0].focus(); return true; } }
    if (dy) { i = (i + dy + it.length) % it.length; it[i].focus({ preventScroll: true }); ui.mover(); }
    if (dx && it[i].dataset.nav === 'opcion') { it[i].dispatchEvent(new CustomEvent('ajustar', { detail: dx })); ui.mover(); }
    // Enter/Espacio ya hacen clic nativo sobre el botón enfocado; el control necesita hacerlo a mano.
    if (this.inp.botones[0] > 0.5 && this.inp.previos[0] <= 0.5) it[i].click();
    if ((this.inp.botones[1] > 0.5 && this.inp.previos[1] <= 0.5) || this.inp.recien.has('Escape') || this.inp.recien.has('Backspace')) {
      const atras = el.querySelector('[data-atras]');
      if (atras) atras.click();
    }
    return true;
  }
}

/** Un botón de opción cíclica: «Calidad: media». Clic o ←/→ cambian el valor. */
export function opcion(btn, valores, actual, etiqueta, alCambiar) {
  let i = Math.max(0, valores.indexOf(actual));
  const pintar = () => { btn.innerHTML = `<span>${etiqueta}</span><b>‹ ${valores[i]} ›</b>`; };
  const mover = (d) => { i = (i + d + valores.length) % valores.length; pintar(); alCambiar(valores[i]); };
  btn.dataset.nav = 'opcion';
  btn.addEventListener('click', () => mover(1));
  btn.addEventListener('ajustar', (e) => mover(e.detail));
  pintar();
}

let avisoTimer = null;
export function aviso(texto, ms = 2200) {
  let el = document.getElementById('aviso');
  if (!el) { el = document.createElement('div'); el.id = 'aviso'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
  el.textContent = texto; el.classList.add('ver');
  clearTimeout(avisoTimer); avisoTimer = setTimeout(() => el.classList.remove('ver'), ms);
}

/** Tiempo de CPU por cuadro (lo que el juego controla) y cuadros por segundo reales. */
export class Medidor {
  constructor() { this.cpu = 0; this.fps = 0; this._t0 = 0; this._n = 0; this._acc = 0; this._cpuAcc = 0; this.el = null; this.visible = false; window.__jue_perf = this; }
  inicio() { this._t0 = performance.now(); }
  fin(dt) {
    this._cpuAcc += performance.now() - this._t0; this._acc += dt; this._n++;
    if (this._acc >= 0.5) {
      this.fps = Math.round(this._n / this._acc); this.cpu = +(this._cpuAcc / this._n).toFixed(2);
      this._n = 0; this._acc = 0; this._cpuAcc = 0;
      if (this.visible && this.el) this.el.textContent = `${this.fps} fps · CPU ${this.cpu} ms`;
    }
  }
  alternar() {
    if (!this.el) { this.el = document.createElement('div'); this.el.className = 'medidor'; document.body.appendChild(this.el); }
    this.visible = !this.visible; this.el.hidden = !this.visible;
  }
}

/** Sacudida por «trauma»: los golpes chicos casi no mueven, los grandes sí (desplazamiento = trauma²). */
export class Sacudida {
  constructor(max = 0.5, giro = 0.06) { this.trauma = 0; this.t = 0; this.max = max; this.giro = giro; this.reducida = matchMedia('(prefers-reduced-motion: reduce)').matches; }
  sumar(a) { this.trauma = Math.min(1, this.trauma + a); }
  aplicar(cam, dt) {
    this.t += dt; this.trauma = Math.max(0, this.trauma - 1.5 * dt);
    if (this.trauma <= 0) return;
    const s = this.trauma * this.trauma * (this.reducida ? 0.25 : 1), f = this.t * 31;
    const n = (k) => { const x = Math.sin(f * (1 + k * 0.37) + k * 78.2) * 43758.5453; return (x - Math.floor(x)) * 2 - 1; };
    cam.position.x += this.max * s * n(1); cam.position.y += this.max * s * n(2); cam.position.z += this.max * s * n(4) * 0.5;
    cam.rotation.z += this.giro * s * n(3);
  }
}

export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
/** Suavizado independiente de los fps: la misma sensación a 30, 60 o 144 Hz. */
export const amort = (a, b, rapidez, dt) => b + (a - b) * Math.exp(-rapidez * dt);
