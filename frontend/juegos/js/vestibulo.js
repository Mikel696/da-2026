// 19-JUE · Vestíbulo: detector de control en vivo, carteles, controles, récords y créditos.
import { Entrada, glifo, guardarMapa, leerMapas, fijarVibracion, vibracionActiva } from './entrada.js';
import { calidad, fijarCalidad, NIVELES, opcion, records, tiempo, aviso } from './comun.js';
import { iniciarAudio, volumenes, fijarVolumen, ui } from './sonido.js';
import { JUEGOS, CREDITOS } from './catalogo.js';

const $ = (id) => document.getElementById(id);
const inp = new Entrada({ capturarFlechas: false });
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

addEventListener('pointerdown', iniciarAudio, { once: true });
addEventListener('keydown', iniciarAudio, { once: true });

// ---------- Carteles ----------
function formato(j, v) { return j.formato === 'tiempo' ? tiempo(v) : Math.round(v).toLocaleString('es-CO'); }
function pintarCarteles() {
  $('juegos').innerHTML = JUEGOS.map((j) => {
    const listo = j.listo !== false;
    const m = records.mejor(j.id, j.tabla);
    return `<button class="cartel" type="button" data-nav data-juego="${j.id}" style="--c:${j.color}" ${listo ? '' : 'aria-disabled="true"'}>
      <div class="arte arte-${j.id}" aria-hidden="true"></div>
      <div class="info"><span class="gen">${esc(j.genero)}</span><h2>${esc(j.nombre)}</h2><p>${esc(j.lema)}</p>
      ${listo ? `<span class="rec">${m ? `Tu mejor marca: <b>${formato(j, m.v)}</b>` : 'Aún sin récord'}</span>` : '<span class="pronto">Próximamente</span>'}</div></button>`;
  }).join('');
}
$('juegos').addEventListener('click', (e) => {
  const b = e.target.closest('.cartel'); if (!b) return;
  const j = JUEGOS.find((x) => x.id === b.dataset.juego);
  if (j.listo === false) { aviso(j.nombre + ' todavía no está listo'); return; }
  ui.ok();
  const url = new URL(j.archivo, location.href).href;
  setTimeout(() => { try { window.top.location.href = url; } catch (err) { location.href = url; } }, 120);
});
$('juegos').addEventListener('focusin', (e) => {
  const b = e.target.closest('.cartel'); if (b) document.documentElement.style.setProperty('--acento', b.style.getPropertyValue('--c'));
});

// ---------- Controles y récords ----------
let tabActiva = JUEGOS[0].id;
function pintarControles() {
  $('pestanas').innerHTML = JUEGOS.map((j) => `<button role="tab" type="button" data-nav data-tab="${j.id}" aria-selected="${j.id === tabActiva}">${esc(j.nombre)}</button>`).join('');
  const j = JUEGOS.find((x) => x.id === tabActiva);
  $('tablaCtl').innerHTML = j.controles.length
    ? `<table class="ctl"><thead><tr><th>Acción</th><th>Teclado y ratón</th><th>Control</th></tr></thead><tbody>${
      j.controles.map(([a, k, p]) => `<tr><td>${esc(a)}</td><td>${k.split(' · ').map((x) => `<kbd>${esc(x)}</kbd>`).join(' o ')}</td><td><kbd>${esc(p)}</kbd></td></tr>`).join('')}</tbody></table>`
    : '<p class="vacio">Los controles aparecen cuando el juego esté publicado.</p>';
}
$('pestanas').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) { tabActiva = b.dataset.tab; pintarControles(); $('pestanas').querySelector(`[data-tab="${tabActiva}"]`).focus(); } });

function pintarRecords() {
  $('recs').innerHTML = JUEGOS.filter((j) => j.listo !== false).map((j) => {
    const l = records.lista(j.id, j.tabla);
    return `<h4 style="color:${j.color}">${esc(j.nombre)}</h4>` + (l.length
      ? `<ol>${l.map((r) => `<li><b>${formato(j, r.v)}</b> · ${esc(r.f)}${r.det ? ' · ' + esc(r.det) : ''}</li>`).join('')}</ol>`
      : '<p class="vacio">Juega una partida y tu marca aparece aquí.</p>');
  }).join('');
}

$('creditosLista').innerHTML = CREDITOS.map((c) => `<dt><a href="${c.url}" target="_blank" rel="noopener">${esc(c.que)}</a><small>${esc(c.quien)} · ${esc(c.licencia)}</small></dt><dd>${esc(c.uso)}</dd>`).join('');

// ---------- Ajustes ----------
opcion($('optCalidad'), NIVELES, calidad(), 'Calidad', (v) => fijarCalidad(v));
const pasos = ['0%', '25%', '50%', '75%', '100%'];
const aPaso = (v) => pasos[Math.round(v * 4)];
opcion($('optMusica'), pasos, aPaso(volumenes().musica), 'Música', (v) => fijarVolumen('musica', parseInt(v, 10) / 100));
opcion($('optEfectos'), pasos, aPaso(volumenes().efectos), 'Efectos', (v) => { fijarVolumen('efectos', parseInt(v, 10) / 100); ui.ok(); });
opcion($('optVib'), ['sí', 'no'], vibracionActiva() ? 'sí' : 'no', 'Vibración', (v) => { fijarVibracion(v === 'sí'); inp.vibracion = v === 'sí'; });
$('btnVibrar').addEventListener('click', () => {
  if (!inp.pad) { aviso('Primero pulsa un botón del control'); return; }
  if (!inp.pad.vibrationActuator) { aviso('Este control no expone vibración en el navegador'); return; }
  inp.vibrar(1, 1, 400); aviso('Vibrando…');
});

// ---------- Mando en vivo ----------
const svgB = [...Array(16)].map((_, i) => $('b' + i));
let ultimoId = null;
function pintarEstado(gp) {
  const est = $('estado');
  if (!gp) {
    est.className = 'estado'; $('estadoTxt').textContent = 'Ningún control detectado';
    $('estadoSub').textContent = 'Conéctalo por Bluetooth y pulsa cualquier botón: Chrome solo lo muestra después de una pulsación.';
    $('btnAsistente').hidden = true; $('datosPad').textContent = ''; return;
  }
  const estandar = gp.mapping === 'standard';
  const mapeado = !!leerMapas()[gp.id];
  est.className = 'estado ' + (estandar || mapeado ? 'ok' : 'aviso');
  $('estadoTxt').textContent = estandar ? 'Control conectado y listo' : mapeado ? 'Control conectado con tu configuración' : 'Control conectado, sin mapa estándar';
  $('estadoSub').textContent = estandar ? 'Usa mapa estándar: todos los botones funcionan en los tres juegos.'
    : 'Si los botones no coinciden, pulsa «Configurar control genérico».';
  $('btnAsistente').hidden = estandar;
  $('datosPad').textContent = gp.id + (gp.vibrationActuator ? ' · vibra' : '');
  for (let i = 0; i < 4; i++) $('rot' + i).textContent = glifo(i, inp.padTipo);
  $('rot6').textContent = glifo(6, inp.padTipo); $('rot7').textContent = glifo(7, inp.padTipo);
}
inp.alConectar = (gp) => { aviso('Control conectado'); ui.ok(); };
inp.alDesconectar = () => { aviso('Control desconectado'); pintarEstado(null); ultimoId = null; };

function pintarMando() {
  for (let i = 0; i < 16; i++) if (svgB[i] && i !== 6 && i !== 7) svgB[i].classList.toggle('on', inp.botones[i] > 0.5);
  for (const t of [6, 7]) { const h = 30 * inp.botones[t]; const r = $('gat' + t); r.setAttribute('y', 38 - h); r.setAttribute('height', h); }
  $('stickL').setAttribute('cx', 150 + inp.ejes[0] * 14); $('stickL').setAttribute('cy', 142 + inp.ejes[1] * 14);
  $('stickR').setAttribute('cx', 322 + inp.ejes[2] * 14); $('stickR').setAttribute('cy', 226 + inp.ejes[3] * 14);
  $('stickL').classList.toggle('on', inp.botones[10] > 0.5); $('stickR').classList.toggle('on', inp.botones[11] > 0.5);
}

// ---------- Navegación espacial con el control ----------
function navegables() { return [...document.querySelectorAll('[data-nav]')].filter((el) => !el.hidden && el.offsetParent !== null); }
function moverFoco(dx, dy) {
  const actual = document.activeElement && document.activeElement.matches('[data-nav]') ? document.activeElement : null;
  const lista = navegables(); if (!lista.length) return;
  if (!actual) { (lista.find((e) => e.classList.contains('cartel')) || lista[0]).focus(); return; }
  const a = actual.getBoundingClientRect(), ax = a.left + a.width / 2, ay = a.top + a.height / 2;
  let mejor = null, md = Infinity;
  for (const el of lista) {
    if (el === actual) continue;
    const r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    const p = dx ? (x - ax) * dx : (y - ay) * dy; if (p <= 4) continue;
    const o = dx ? Math.abs(y - ay) : Math.abs(x - ax);
    const d = p + o * 2.2; if (d < md) { md = d; mejor = el; }
  }
  if (mejor) { mejor.focus(); mejor.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); ui.mover(); }
}

// ---------- Asistente para controles sin mapa estándar ----------
const PASOS = [
  ['el botón de abajo (A / ✕)', 'b', 0], ['el botón de la derecha (B / ○)', 'b', 1], ['el de la izquierda (X / □)', 'b', 2], ['el de arriba (Y / △)', 'b', 3],
  ['el botón superior izquierdo (LB / L1)', 'b', 4], ['el superior derecho (RB / R1)', 'b', 5], ['el gatillo izquierdo (LT / L2)', 'b', 6], ['el gatillo derecho (RT / R2)', 'b', 7],
  ['Select / Share', 'b', 8], ['Start / Options', 'b', 9], ['la cruceta ↑', 'b', 12], ['la cruceta ↓', 'b', 13], ['la cruceta ←', 'b', 14], ['la cruceta →', 'b', 15],
  ['el stick izquierdo hacia la derecha', 'e', 0], ['el stick izquierdo hacia abajo', 'e', 1], ['el stick derecho hacia la derecha', 'e', 2], ['el stick derecho hacia abajo', 'e', 3],
];
const asis = { activo: false, paso: 0, base: null, mapa: null, esperarSuelta: false };
function crudo(gp) { return { b: gp.buttons.map((b) => b.value || (b.pressed ? 1 : 0)), a: [...gp.axes] }; }
function asisMostrar() {
  if (asis.paso >= PASOS.length) {
    guardarMapa(inp.pad.id, asis.mapa); inp.mapas = leerMapas(); asis.activo = false;
    $('asisPaso').textContent = 'Listo. Tu configuración quedó guardada para este control.'; pintarEstado(inp.pad); return;
  }
  $('asisPaso').textContent = 'Pulsa ' + PASOS[asis.paso][0];
}
function asisTick() {
  const gp = inp.pad; if (!asis.activo || !gp) return;
  const c = crudo(gp);
  if (asis.esperarSuelta) {
    const quieto = c.b.every((v, i) => Math.abs(v - asis.base.b[i]) < 0.25) && c.a.every((v, i) => Math.abs(v - asis.base.a[i]) < 0.35);
    if (quieto) asis.esperarSuelta = false; return;
  }
  const [, tipo, idx] = PASOS[asis.paso];
  let hecho = false;
  if (tipo === 'b') {
    const bi = c.b.findIndex((v, i) => v > 0.6 && asis.base.b[i] < 0.3);
    if (bi >= 0) { asis.mapa.b[idx] = { t: 'b', i: bi }; hecho = true; }
    else { const ai = c.a.findIndex((v, i) => Math.abs(v - asis.base.a[i]) > 0.6); if (ai >= 0) { asis.mapa.b[idx] = { t: 'a', i: ai, rest: asis.base.a[ai], full: c.a[ai] }; hecho = true; } }
  } else {
    const ai = c.a.findIndex((v, i) => Math.abs(v - asis.base.a[i]) > 0.6 && Math.abs(asis.base.a[i]) < 0.5);
    if (ai >= 0) { asis.mapa.ejes[idx] = { i: ai, s: Math.sign(c.a[ai]) }; hecho = true; }
  }
  if (hecho) { ui.ok(); asis.paso++; asis.esperarSuelta = true; asisMostrar(); }
}
$('btnAsistente').addEventListener('click', () => {
  if (!inp.pad) return;
  Object.assign(asis, { activo: true, paso: 0, base: crudo(inp.pad), mapa: { b: {}, ejes: {} }, esperarSuelta: true });
  asisMostrar(); $('asistente').showModal();
});
$('asisSaltar').addEventListener('click', () => { asis.paso++; asisMostrar(); });
$('asisBorrar').addEventListener('click', () => { if (inp.pad) guardarMapa(inp.pad.id, null); inp.mapas = leerMapas(); asis.activo = false; $('asisPaso').textContent = 'Mapa borrado.'; pintarEstado(inp.pad); });
$('asisCerrar').addEventListener('click', () => { asis.activo = false; $('asistente').close(); });

// ---------- Bucle ----------
let tPrev = performance.now();
function bucle(t) {
  const dt = Math.min(0.1, (t - tPrev) / 1000); tPrev = t;
  inp.actualizar();
  const id = inp.pad ? inp.pad.id + inp.pad.mapping : null;
  if (id !== ultimoId) { ultimoId = id; pintarEstado(inp.pad); }
  if (inp.pad) pintarMando();
  if (asis.activo) asisTick();
  else if (inp.pad && !$('asistente').open) {
    const { dx, dy } = inp.menuDir(dt);
    if (dx || dy) moverFoco(dx, dy);
    const el = document.activeElement;
    if (el && el.matches('[data-nav]')) {
      if (inp.botones[0] > 0.5 && inp.previos[0] <= 0.5) el.click();
      if (inp.botones[1] > 0.5 && inp.previos[1] <= 0.5 && el.dataset.nav === 'opcion') el.dispatchEvent(new CustomEvent('ajustar', { detail: -1 }));
    }
  }
  requestAnimationFrame(bucle);
}

pintarCarteles(); pintarControles(); pintarRecords();
requestAnimationFrame(bucle);
