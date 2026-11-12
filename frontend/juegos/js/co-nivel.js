// 19-JUE · Corredor · Nivel de dificultad: sube con cada entrega y se guarda (jue_co_nivel). Con cada nivel la misma misión
// trae más drones y antes, más FPV de fibra, más lanzacohetes que apuntan más rápido y recargan antes, y más minas (siempre
// con un hueco por donde pasar). Funciones puras sobre los datos de la misión: se prueban con el piloto automático.
// Licencia: MIT (código propio).
import { semilla } from './lc-util.js';

export const NIVEL_MAX = 10;
const CLAVE = 'jue_co_nivel';
export function leerNivel() { try { const n = +localStorage.getItem(CLAVE); return n >= 1 && n <= NIVEL_MAX ? Math.floor(n) : 1; } catch (e) { return 1; } }
export function fijarNivel(n) { try { localStorage.setItem(CLAVE, String(Math.max(1, Math.min(NIVEL_MAX, n)))); } catch (e) { /* vale para esta visita */ } }

const VIA = 0.86, PASO_RUEDA = 0.62;   // mitad de la trocha y distancia mínima rueda-mina (la misma regla del piloto)
/** ¿Queda algún carril por donde las dos ruedas pasen lejos de todas las minas del grupo? */
function hayHueco(laterales) {
  for (let c = -3.9; c <= 3.9001; c += 0.1) if (!laterales.some((m) => Math.abs(c - VIA - m) < PASO_RUEDA || Math.abs(c + VIA - m) < PASO_RUEDA)) return true;
  return false;
}

/**
 * Datos de la misión a este nivel. k = nivel − 1.
 * drones: cada oleada × (1 + 0,22 k), 12 m antes por nivel; desde el nivel 2, FPV de fibra extra cada ~700 m.
 * lanzacohetes: +1 por grupo cada 2 niveles y grupos nuevos desde el nivel 4; apuntan 1,6 → 0,9 s, recargan 7 → 4 s.
 * minas: cada grupo gana minas con probabilidad 0,12 k mientras quede hueco.
 */
export function escalar(MIS, nivel) {
  const k = Math.max(0, nivel - 1), rnd = semilla(900 + nivel);
  const drones = MIS.drones.map(([s, tipo, n]) => [Math.max(0, s - 12 * k), tipo, Math.max(n, Math.round(n * (1 + 0.22 * k)))]);
  if (k >= 1 && MIS.drones.length) { const fin = MIS.drones[MIS.drones.length - 1][0]; for (let s = 350; s < fin; s += Math.max(320, 760 - 60 * k)) drones.push([s, 'fibra', 1 + Math.floor(k / 4)]); }
  drones.sort((a, b) => a[0] - b[0]);
  const emb = (MIS.emboscadas || []).map(([s, lado, n]) => [s, lado, n + Math.floor(k / 2)]);
  if (k >= 3) for (const [s, lado] of MIS.emboscadas || []) if (rnd() < 0.15 * (k - 2)) emb.push([s + 140, -lado, 1]);
  const minas = MIS.minas.map(([s, ls]) => {
    const l = ls.slice();
    for (let intento = 0; intento < 3 && rnd() < 0.12 * k && l.length < 5; intento++) {
      const nueva = Math.round((rnd() * 7.2 - 3.6) * 20) / 20;
      if (l.every((m) => Math.abs(m - nueva) > 0.5) && hayHueco(l.concat(nueva))) l.push(nueva);
    }
    return [s, l];
  });
  const cohetes = { apunta: Math.max(0.9, 1.6 - 0.1 * k), recarga: Math.max(4, 7 - 0.4 * k), tiros: 2 + Math.floor(k / 3) };
  return { ...MIS, drones, emboscadas: emb, minas, cohetes, nivel };
}
