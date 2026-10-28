// 19-JUE · Entrada unificada: teclado + ratón + Gamepad API (mapa estándar de Chrome).
// Los juegos piden acciones por nombre ("acelerar", "disparar") y nunca leen teclas ni botones sueltos.

export const BOTON = { A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7, SELECT: 8, START: 9, L3: 10, R3: 11, ARRIBA: 12, ABAJO: 13, IZQ: 14, DER: 15 };

const MAPAS_KEY = 'jue_pad_map';
const VIB_KEY = 'jue_vibracion';
const ZONA_MUERTA = 0.16;

const GLIFOS = {
  xbox: ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'View', 'Menu', 'LS', 'RS', '↑', '↓', '←', '→'],
  ps: ['✕', '○', '□', '△', 'L1', 'R1', 'L2', 'R2', 'Share', 'Options', 'L3', 'R3', '↑', '↓', '←', '→'],
  generico: ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'Select', 'Start', 'LS', 'RS', '↑', '↓', '←', '→'],
};

export function tipoPad(id) {
  const s = (id || '').toLowerCase();
  if (/054c|dualshock|dualsense|playstation|wireless controller/.test(s)) return 'ps';
  if (/045e|xbox|xinput/.test(s)) return 'xbox';
  return 'generico';
}

export function glifo(boton, tipo) { return (GLIFOS[tipo] || GLIFOS.generico)[boton] || '?'; }

export function nombreTecla(code) {
  const m = { ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', Space: 'Espacio', ShiftLeft: 'Shift', ShiftRight: 'Shift',
    ControlLeft: 'Ctrl', Escape: 'Esc', Enter: 'Enter', Tab: 'Tab', Mouse0: 'Clic', Mouse2: 'Clic der.' };
  return m[code] || code.replace(/^Key|^Digit/, '');
}

export function leerMapas() { try { return JSON.parse(localStorage.getItem(MAPAS_KEY)) || {}; } catch (e) { return {}; } }
export function guardarMapa(id, mapa) {
  const t = leerMapas();
  if (mapa) t[id] = mapa; else delete t[id];
  try { localStorage.setItem(MAPAS_KEY, JSON.stringify(t)); } catch (e) { /* almacenamiento bloqueado: el mapa vive solo en esta pestaña */ }
}
export function vibracionActiva() { try { return localStorage.getItem(VIB_KEY) !== '0'; } catch (e) { return true; } }
export function fijarVibracion(on) { try { localStorage.setItem(VIB_KEY, on ? '1' : '0'); } catch (e) { /* idem */ } }

// Un control sin mapa estándar puede traer los gatillos o la cruceta como ejes: el asistente del
// vestíbulo guarda {t:'a', i, rest, full} y aquí se normaliza a 0..1.
function valorMapeado(gp, m) {
  if (!m) return 0;
  if (m.t === 'b') { const b = gp.buttons[m.i]; return b ? (b.value || (b.pressed ? 1 : 0)) : 0; }
  const v = gp.axes[m.i]; if (v === undefined) return 0;
  if (Math.abs(m.rest) > 1.05) return Math.abs(v - m.full) < 0.15 ? 1 : 0; // cruceta tipo "hat"
  const k = (v - m.rest) / ((m.full - m.rest) || 1);
  return k < 0 ? 0 : k > 1 ? 1 : k;
}

function zonaMuerta(x, y) {
  const m = Math.hypot(x, y);
  if (m < ZONA_MUERTA) return [0, 0];
  const k = Math.min(1, (m - ZONA_MUERTA) / (1 - ZONA_MUERTA)) / m;
  return [x * k, y * k];
}

const MENU = {
  ui_arriba: { k: ['ArrowUp', 'KeyW'], b: [BOTON.ARRIBA] },
  ui_abajo: { k: ['ArrowDown', 'KeyS'], b: [BOTON.ABAJO] },
  ui_izq: { k: ['ArrowLeft', 'KeyA'], b: [BOTON.IZQ] },
  ui_der: { k: ['ArrowRight', 'KeyD'], b: [BOTON.DER] },
  ui_ok: { k: ['Enter', 'Space'], b: [BOTON.A] },
  ui_atras: { k: ['Escape', 'Backspace'], b: [BOTON.B] },
  pausa: { k: ['Escape', 'KeyP'], b: [BOTON.START] },
};

export class Entrada {
  constructor(def = {}) {
    this.acciones = Object.assign({}, MENU, def.acciones || {});
    this.ejesDef = def.ejes || {};
    this.teclas = new Set();
    this._pend = new Set();
    this.recien = new Set();
    this.botones = new Float32Array(17);
    this.previos = new Float32Array(17);
    this.ejes = new Float32Array(4);
    this.pad = null;
    this.padTipo = 'generico';
    this.dispositivo = 'teclado';
    this.mapas = leerMapas();
    this.vibracion = vibracionActiva();
    this.ratonDX = 0; this.ratonDY = 0;
    this.alConectar = null; this.alDesconectar = null;
    this._stickPrev = { x: 0, y: 0 };
    this._repetir = 0;

    const evitar = new Set(def.capturarFlechas === false ? [] : ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab']);
    addEventListener('keydown', (e) => {
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (evitar.has(e.code)) e.preventDefault();
      if (!e.repeat) this._pend.add(e.code);
      this.teclas.add(e.code);
      this.dispositivo = 'teclado';
    });
    addEventListener('keyup', (e) => this.teclas.delete(e.code));
    addEventListener('blur', () => this.teclas.clear());
    addEventListener('mousedown', (e) => { const c = 'Mouse' + e.button; this.teclas.add(c); this._pend.add(c); this.dispositivo = 'teclado'; });
    addEventListener('mouseup', (e) => this.teclas.delete('Mouse' + e.button));
    addEventListener('mousemove', (e) => {
      if (document.pointerLockElement) { this.ratonDX += e.movementX || 0; this.ratonDY += e.movementY || 0; }
    });
    addEventListener('contextmenu', (e) => { if (document.pointerLockElement) e.preventDefault(); });
    addEventListener('gamepadconnected', (e) => { this.mapas = leerMapas(); this.alConectar && this.alConectar(e.gamepad); });
    addEventListener('gamepaddisconnected', (e) => { this.alDesconectar && this.alDesconectar(e.gamepad); });
  }

  actualizar() {
    this.recien = this._pend; this._pend = new Set();
    this.previos.set(this.botones);
    this.botones.fill(0); this.ejes.fill(0);
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    let gp = null;
    for (const p of pads) if (p && p.connected && (!gp || p.timestamp > gp.timestamp)) gp = p;
    this.pad = gp;
    if (!gp) return;
    this.padTipo = tipoPad(gp.id);
    const mapa = gp.mapping === 'standard' ? null : this.mapas[gp.id];
    for (let i = 0; i < 16; i++) {
      if (mapa && mapa.b && mapa.b[i]) this.botones[i] = valorMapeado(gp, mapa.b[i]);
      else { const b = gp.buttons[i]; this.botones[i] = b ? (b.value || (b.pressed ? 1 : 0)) : 0; }
    }
    for (let i = 0; i < 4; i++) {
      const m = mapa && mapa.ejes && mapa.ejes[i];
      const v = m ? (gp.axes[m.i] || 0) * (m.s || 1) : (gp.axes[i] || 0);
      this.ejes[i] = v;
    }
    const [lx, ly] = zonaMuerta(this.ejes[0], this.ejes[1]);
    const [rx, ry] = zonaMuerta(this.ejes[2], this.ejes[3]);
    this.ejes[0] = lx; this.ejes[1] = ly; this.ejes[2] = rx; this.ejes[3] = ry;
    let activo = Math.abs(lx) > 0.5 || Math.abs(ly) > 0.5 || Math.abs(rx) > 0.5 || Math.abs(ry) > 0.5;
    for (let i = 0; i < 16 && !activo; i++) if (this.botones[i] > 0.5) activo = true;
    if (activo) this.dispositivo = 'pad';
  }

  /** Valor 0..1 de una acción: tecla pulsada vale 1, un gatillo analógico vale lo que esté apretado. */
  v(nombre) {
    const a = this.acciones[nombre]; if (!a) return 0;
    let v = 0;
    if (a.k) for (const k of a.k) if (this.teclas.has(k)) { v = 1; break; }
    if (a.b) for (const b of a.b) if (this.botones[b] > v) v = this.botones[b];
    return v;
  }
  p(nombre) { return this.v(nombre) > 0.4; }
  /** Recién pulsada en este cuadro (no se repite mientras se mantiene). */
  j(nombre) {
    const a = this.acciones[nombre]; if (!a) return false;
    if (a.k) for (const k of a.k) if (this.recien.has(k)) return true;
    if (a.b) for (const b of a.b) if (this.botones[b] > 0.5 && this.previos[b] <= 0.5) return true;
    return false;
  }
  /** Eje -1..1: el teclado da todo o nada, el stick da el valor analógico. */
  e(nombre) {
    const d = this.ejesDef[nombre]; if (!d) return 0;
    let t = 0;
    if (d.neg) for (const k of d.neg) if (this.teclas.has(k)) { t -= 1; break; }
    if (d.pos) for (const k of d.pos) if (this.teclas.has(k)) { t += 1; break; }
    let p = d.eje !== undefined ? this.ejes[d.eje] * (d.inv ? -1 : 1) : 0;
    if (d.bneg) for (const b of d.bneg) if (this.botones[b] > 0.5) p = -1;
    if (d.bpos) for (const b of d.bpos) if (this.botones[b] > 0.5) p = 1;
    const v = Math.abs(p) > Math.abs(t) ? p : t;
    return v < -1 ? -1 : v > 1 ? 1 : v;
  }
  tomarRaton() { const r = [this.ratonDX, this.ratonDY]; this.ratonDX = 0; this.ratonDY = 0; return r; }

  /** Dirección de menú con repetición al mantener (cruceta, flechas o stick izquierdo). */
  menuDir(dt) {
    let dy = 0, dx = 0;
    if (this.j('ui_arriba')) dy = -1; else if (this.j('ui_abajo')) dy = 1;
    if (this.j('ui_izq')) dx = -1; else if (this.j('ui_der')) dx = 1;
    const sx = this.ejes[0], sy = this.ejes[1];
    const fuerte = Math.max(Math.abs(sx), Math.abs(sy)) > 0.6;
    if (fuerte) {
      this._repetir -= dt;
      const prevFuerte = Math.max(Math.abs(this._stickPrev.x), Math.abs(this._stickPrev.y)) > 0.6;
      if (!prevFuerte || this._repetir <= 0) {
        if (Math.abs(sy) > Math.abs(sx)) dy = Math.sign(sy); else dx = Math.sign(sx);
        this._repetir = prevFuerte ? 0.12 : 0.38;
      }
    } else this._repetir = 0;
    this._stickPrev = { x: sx, y: sy };
    return { dx, dy };
  }

  vibrar(fuerte = 0.5, debil = 0.5, ms = 120) {
    const a = this.vibracion && this.pad && this.pad.vibrationActuator;
    if (!a || !a.playEffect) return;
    try { a.playEffect('dual-rumble', { startDelay: 0, duration: ms, weakMagnitude: Math.min(1, debil), strongMagnitude: Math.min(1, fuerte) }); } catch (e) { /* el control no vibra: no pasa nada */ }
  }

  /** Texto del botón o tecla de una acción según el último dispositivo usado. */
  etiqueta(nombre) {
    const a = this.acciones[nombre]; if (!a) return '';
    if (this.dispositivo === 'pad' && a.b && a.b.length) return glifo(a.b[0], this.padTipo);
    return a.k && a.k.length ? nombreTecla(a.k[0]) : '';
  }
}
