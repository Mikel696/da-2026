// 19-JUE · Entrada unificada: teclado + ratón + Gamepad API (mapa estándar de Chrome).
// Los juegos piden acciones por nombre ("acelerar", "disparar") y nunca leen teclas ni botones sueltos.

export const BOTON = { A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7, SELECT: 8, START: 9, L3: 10, R3: 11, ARRIBA: 12, ABAJO: 13, IZQ: 14, DER: 15 };

const MAPAS_KEY = 'jue_pad_map';
const VIB_KEY = 'jue_vibracion';
const PREF_KEY = 'jue_pad_pref';
const ZONA_MUERTA = 0.16;
const QUIETO = 20;   // cuadros seguidos sin tocar el control en uso antes de cederle el turno al stick de otro

const GLIFOS = {
  xbox: ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'View', 'Menu', 'LS', 'RS', '↑', '↓', '←', '→'],
  ps: ['✕', '○', '□', '△', 'L1', 'R1', 'L2', 'R2', 'Share', 'Options', 'L3', 'R3', '↑', '↓', '←', '→'],
  generico: ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'Select', 'Start', 'LS', 'RS', '↑', '↓', '←', '→'],
};

export function tipoPad(id) {
  const s = (id || '').toLowerCase();
  // Xbox primero: el mando de Xbox por Bluetooth se llama «Xbox Wireless Controller» y el de PlayStation,
  // «Wireless Controller» a secas. Con el orden al revés, al de Xbox se le pintaban ✕ ○ □ △.
  if (/045e|xbox|xinput/.test(s)) return 'xbox';
  if (/054c|dualshock|dualsense|playstation|wireless controller/.test(s)) return 'ps';
  return 'generico';
}

export function glifo(boton, tipo) { return (GLIFOS[tipo] || GLIFOS.generico)[boton] || '?'; }

/** Nombre corto para mostrar: sin la coletilla técnica «(STANDARD GAMEPAD Vendor: … Product: …)». */
export function nombrePad(id) {
  const s = (id || '').replace(/\s*\((?:XInput )?STANDARD GAMEPAD[^)]*\)\s*$/i, '').replace(/\s*\(Vendor:[^)]*\)\s*$/i, '').trim();
  return s || 'Control';
}
function leerPref() { try { return JSON.parse(localStorage.getItem(PREF_KEY)) || null; } catch (e) { return null; } }

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
    this.alPerderPad = null;   // se fue el control EN USO (no cualquiera): los juegos pausan con esto
    this.pads = [];            // todos los controles conectados: [{ index, id, nombre, tipo, estandar, activo }]
    this._est = new Map();     // por control: reposo de cada eje, botones del cuadro anterior, cuadros quieto
    this._idx = -1;
    this._fijo = null;
    this._pref = leerPref();
    this._firma = '';
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
    const gp = this._elegir(navigator.getGamepads ? navigator.getGamepads() : []);
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

  /** Decide qué control escucha el juego cuando hay varios. NUNCA por `timestamp`: un volante o un stick que
   *  tiembla lo renueva en cada cuadro y le quitaba el turno al mando que el jugador tiene en las manos
   *  (9-nov-2026: volante USB + mando Bluetooth → el mando no hacía nada). Manda el último control en el que
   *  se PULSÓ un botón; mover un stick solo cuenta si el control en uso lleva un rato quieto. */
  _elegir(lista) {
    const vivos = [];
    for (const gp of lista) {
      if (!gp || !gp.connected) continue;
      let e = this._est.get(gp.index);
      if (!e || e.id !== gp.id) {
        // Reposo de cada eje: un gatillo que llega como eje descansa en -1 y la cruceta tipo «hat» en 1,29, no en 0.
        e = { id: gp.id, base: Array.from(gp.axes, (v) => (Math.abs(v) > 0.75 ? v : 0)), prev: new Uint8Array(gp.buttons.length), quieto: 0 };
        this._est.set(gp.index, e);
      }
      let flanco = false, pulsado = false, desvio = 0;
      for (let i = 0; i < gp.buttons.length; i++) {
        const b = gp.buttons[i], on = b && (b.pressed || b.value > 0.5) ? 1 : 0;
        if (on) { pulsado = true; if (!e.prev[i]) flanco = true; }
        e.prev[i] = on;
      }
      for (let i = 0; i < gp.axes.length; i++) { const d = Math.abs(gp.axes[i] - (e.base[i] || 0)); if (d > desvio) desvio = d; }
      e.quieto = pulsado || desvio > 0.25 ? 0 : e.quieto + 1;
      vivos.push({ gp, e, flanco, desvio });
    }
    if (this._est.size > vivos.length) for (const k of [...this._est.keys()]) if (!vivos.some((v) => v.gp.index === k)) this._est.delete(k);

    const actual = vivos.find((v) => v.gp.index === this._idx) || null;
    if (this._idx >= 0 && !actual && this.alPerderPad) this.alPerderPad();
    let elegido = actual;
    this._fijo = null;
    if (this._pref) {   // control fijado a mano en la sala de juegos
      const mismos = vivos.filter((v) => v.gp.id === this._pref.id);
      const f = mismos.find((v) => v.gp.index === this._pref.index) || mismos[0];
      if (f) { elegido = f; this._fijo = f.gp.index; }
    }
    if (this._fijo === null && !(actual && actual.flanco)) {
      const pulso = vivos.find((v) => v.flanco);
      if (pulso) elegido = pulso;
      else if (!actual) elegido = vivos.reduce((m, v) => (!m || v.desvio > m.desvio ? v : m), null);
      else if (actual.e.quieto >= QUIETO) elegido = vivos.find((v) => v !== actual && v.desvio > 0.7) || actual;
    }
    this._idx = elegido ? elegido.gp.index : -1;

    let firma = this._idx + '|' + this._fijo;
    for (const v of vivos) firma += '|' + v.gp.index + v.gp.id + v.gp.mapping;
    if (firma !== this._firma) {
      this._firma = firma;
      this.pads = vivos.map((v) => ({ index: v.gp.index, id: v.gp.id, nombre: nombrePad(v.gp.id), tipo: tipoPad(v.gp.id),
        estandar: v.gp.mapping === 'standard', activo: v.gp.index === this._idx }));
    }
    return elegido ? elegido.gp : null;
  }

  /** Índice del control fijado a mano, o null si la elección es automática. */
  get padFijo() { return this._fijo; }
  /** Fija el control de ese índice (se recuerda entre visitas) o, con null, vuelve a la elección automática. */
  fijarPad(index) {
    const e = index == null ? null : this._est.get(index);
    this._pref = e ? { id: e.id, index } : null;
    try { if (this._pref) localStorage.setItem(PREF_KEY, JSON.stringify(this._pref)); else localStorage.removeItem(PREF_KEY); } catch (err) { /* vale para esta pestaña */ }
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
