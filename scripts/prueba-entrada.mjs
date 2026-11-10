// 19-JUE · Prueba de regresión de la entrada: qué control escucha el juego cuando hay varios conectados.
// Uso: node scripts/prueba-entrada.mjs   (sale con código 1 si algo falla)
// Origen (9-nov-2026): con el volante USB enchufado (Windows lo presenta como «Controlador de Xbox 360») y el
// mando Xbox por Bluetooth, el juego elegía el control con el `timestamp` más reciente. El volante tiembla en
// reposo y renueva su timestamp en cada cuadro, así que ganaba siempre y el mando no hacía nada.
import { pathToFileURL } from 'node:url';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const almacen = new Map();
globalThis.localStorage = { getItem: (k) => (almacen.has(k) ? almacen.get(k) : null), setItem: (k, v) => almacen.set(k, String(v)), removeItem: (k) => almacen.delete(k) };
globalThis.addEventListener = () => {};
globalThis.document = { pointerLockElement: null };
let conectados = [];
Object.defineProperty(globalThis, 'navigator', { value: { getGamepads: () => conectados }, configurable: true });

const { Entrada, BOTON, tipoPad, glifo, nombrePad } = await import(pathToFileURL(resolve(aqui, '../frontend/juegos/js/entrada.js')).href);

let reloj = 1000;
function mando(id, index, { ejes = 4, botones = 17, mapping = 'standard' } = {}) {
  return { id, index, connected: true, mapping, timestamp: reloj, axes: new Array(ejes).fill(0), buttons: Array.from({ length: botones }, () => ({ pressed: false, value: 0 })) };
}
const pulsar = (gp, b, v = 1) => { gp.buttons[b] = { pressed: v > 0.5, value: v }; gp.timestamp = reloj; };
const VOLANTE = 'Xbox 360 Controller (XInput STANDARD GAMEPAD)';
const XBOX = 'Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 02e0)';
const ACC = { acciones: { acelerar: { k: ['KeyW'], b: [BOTON.RT] }, salto: { k: ['Space'], b: [BOTON.A] } }, ejes: { giro: { neg: ['KeyA'], pos: ['KeyD'], eje: 0 } } };

/** Avanza n cuadros; el volante (si se pasa) tiembla y renueva su timestamp en cada uno, como el de verdad. */
function cuadros(inp, n, volante, cada) {
  for (let i = 0; i < n; i++) {
    reloj += 16.7;
    if (volante) { volante.axes[0] = 0.03 + (Math.random() - 0.5) * 0.008; volante.timestamp = reloj; }
    inp.actualizar();
    if (cada) cada(i);
  }
}

const fallos = [];
let total = 0;
function prueba(nombre, fn) {
  total++; almacen.clear(); conectados = []; reloj += 1000;
  try { fn(); console.log('  ok   ' + nombre); } catch (e) { fallos.push(nombre); console.log('  FALLA ' + nombre + '\n        ' + e.message); }
}
function igual(real, esperado, que) { if (real !== esperado) throw new Error(`${que}: esperaba ${JSON.stringify(esperado)}, salió ${JSON.stringify(real)}`); }
function cierto(v, que) { if (!v) throw new Error(que); }

console.log('Entrada · selección de control');

prueba('volante que tiembla + mando con RT a fondo: el juego acelera en todos los cuadros', () => {
  const v = mando(VOLANTE, 0), x = mando(XBOX, 1); conectados = [v, x];
  const inp = new Entrada(ACC);
  cuadros(inp, 30, v);
  pulsar(x, BOTON.RT); x.axes[0] = 0.9;
  let conGas = 0, conGiro = 0;
  cuadros(inp, 120, v, () => { if (inp.v('acelerar') > 0.9) conGas++; if (inp.e('giro') > 0.8) conGiro++; });
  igual(conGas, 120, 'cuadros con acelerador'); igual(conGiro, 120, 'cuadros con giro');
  igual(inp.pad.index, 1, 'control en uso');
});

prueba('el botón ya viene pulsado en el primer cuadro (el gesto que hace visible el control en Chrome)', () => {
  const v = mando(VOLANTE, 0), x = mando(XBOX, 1); pulsar(x, BOTON.A); conectados = [v, x];
  const inp = new Entrada(ACC);
  cuadros(inp, 1, v);
  igual(inp.pad.index, 1, 'control en uso'); cierto(inp.j('salto'), 'la primera pulsación debe contar como recién pulsada');
});

prueba('solo se mueve el stick del mando (sin botones): el juego pasa al mando en menos de medio segundo', () => {
  const v = mando(VOLANTE, 0), x = mando(XBOX, 1); conectados = [v, x];
  const inp = new Entrada(ACC);
  pulsar(v, 0); cuadros(inp, 2, v); pulsar(v, 0, 0); cuadros(inp, 5, v);
  igual(inp.pad.index, 0, 'antes: el volante');
  x.axes[0] = -0.95;
  cuadros(inp, 30, v);
  igual(inp.pad.index, 1, 'después: el mando'); cierto(inp.e('giro') < -0.8, 'el giro debe leerse del mando');
});

prueba('cambio deliberado: gana el último control en el que se pulsó un botón', () => {
  const v = mando(VOLANTE, 0), x = mando(XBOX, 1); conectados = [v, x];
  const inp = new Entrada(ACC);
  pulsar(x, BOTON.A); cuadros(inp, 3, v); pulsar(x, BOTON.A, 0); cuadros(inp, 3, v);
  igual(inp.pad.index, 1, 'tras pulsar en el mando');
  pulsar(v, BOTON.RT); cuadros(inp, 3, v);
  igual(inp.pad.index, 0, 'tras pulsar en el volante'); cierto(inp.v('acelerar') > 0.9, 'acelera con el volante');
  pulsar(v, BOTON.RT, 0); cuadros(inp, 3, v); pulsar(x, BOTON.A); cuadros(inp, 2, v);
  igual(inp.pad.index, 1, 'de vuelta al mando');
});

prueba('control fijado a mano: no cambia aunque se pulse en otro; al soltarlo vuelve el modo automático', () => {
  const v = mando(VOLANTE, 0), x = mando(XBOX, 1); conectados = [v, x];
  const inp = new Entrada(ACC);
  cuadros(inp, 2, v);
  inp.fijarPad(0);
  pulsar(x, BOTON.A); cuadros(inp, 5, v);
  igual(inp.pad.index, 0, 'fijado al volante'); igual(inp.padFijo, 0, 'padFijo');
  igual(new Entrada(ACC).padFijo, null, 'otra instancia aún no ha visto el control');
  const otra = new Entrada(ACC); cuadros(otra, 2, v);
  igual(otra.pad.index, 0, 'la preferencia se recuerda al recargar');
  inp.fijarPad(null); pulsar(x, BOTON.A, 0); cuadros(inp, 2, v); pulsar(x, BOTON.A); cuadros(inp, 2, v);
  igual(inp.pad.index, 1, 'automático otra vez');
});

prueba('se desconecta el control en uso: el juego pasa al que queda y avisa una sola vez', () => {
  const v = mando(VOLANTE, 0), x = mando(XBOX, 1); conectados = [v, x];
  const inp = new Entrada(ACC);
  let avisos = 0; inp.alPerderPad = () => avisos++;
  pulsar(x, BOTON.A); cuadros(inp, 3, v); pulsar(x, BOTON.A, 0);
  conectados = [v, null]; cuadros(inp, 5, v);
  igual(inp.pad.index, 0, 'queda el volante'); igual(avisos, 1, 'avisos de pérdida');
  conectados = [null, null]; cuadros(inp, 3);
  igual(inp.pad, null, 'sin controles');
});

prueba('un solo mando: todo igual que antes (valor analógico, recién pulsado una sola vez)', () => {
  const x = mando(XBOX, 0); conectados = [x];
  const inp = new Entrada(ACC);
  cuadros(inp, 2);
  pulsar(x, BOTON.RT, 0.62); pulsar(x, BOTON.A);
  cuadros(inp, 1); cierto(inp.j('salto'), 'recién pulsado en el primer cuadro'); igual(+inp.v('acelerar').toFixed(2), 0.62, 'gatillo analógico');
  cuadros(inp, 1); cierto(!inp.j('salto'), 'no se repite mientras se mantiene');
  igual(inp.pads.length, 1, 'lista de controles'); igual(inp.pads[0].activo, true, 'marcado en uso');
});

prueba('un control genérico con gatillos-eje en reposo en -1 no le roba el turno al mando en uso', () => {
  const x = mando(XBOX, 0), g = mando('PG-9076 (Vendor: 1949 Product: 0402)', 1, { ejes: 10, botones: 16, mapping: '' });
  g.axes[3] = -1; g.axes[4] = -1; g.axes[9] = 1.2857;
  conectados = [x, g];
  const inp = new Entrada(ACC);
  pulsar(x, BOTON.A); cuadros(inp, 3); pulsar(x, BOTON.A, 0); cuadros(inp, 60);
  igual(inp.pad.index, 0, 'sigue el mando');
  igual(inp.pads.length, 2, 'los dos aparecen en la lista'); igual(inp.pads[1].estandar, false, 'el genérico se marca sin mapa estándar');
});

prueba('los botones se rotulan según el control: Xbox por Bluetooth lleva A B X Y, no los símbolos de PlayStation', () => {
  igual(tipoPad(XBOX), 'xbox', 'Xbox Wireless Controller'); igual(glifo(BOTON.A, tipoPad(XBOX)), 'A', 'rótulo del botón de abajo');
  igual(tipoPad(VOLANTE), 'xbox', 'XInput');
  igual(tipoPad('Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 09cc)'), 'ps', 'DualShock 4');
  igual(tipoPad('PG-9076 (Vendor: 1949 Product: 0402)'), 'generico', 'genérico');
  igual(nombrePad(XBOX), 'Xbox Wireless Controller', 'nombre corto'); igual(nombrePad(VOLANTE), 'Xbox 360 Controller', 'nombre corto XInput');
});

console.log(fallos.length ? `\n${fallos.length} de ${total} FALLAN` : `\n${total} de ${total} pasan`);
process.exit(fallos.length ? 1 : 0);
