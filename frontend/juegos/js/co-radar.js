// 19-JUE · Corredor · Radar. Un haz gira sin parar; un contacto aparece cuando el haz pasa sobre él y está dentro del
// alcance. El alcance baja con la velocidad (parado ve 88 m; a 90 km/h, 34 m): correr deja menos tiempo para decidir.
// Pinta la vía, los contactos y el haz con el frente de la camioneta siempre hacia arriba.
// Contactos: cualquier objeto con { x, z, viva, detectada }. Hoy son minas; en el paso siguiente, drones.
// Licencia: MIT (código propio).
import { clamp } from './lc-util.js';

export const ESCALA = 90;   // metros del centro al borde del lienzo
const VUELTA = Math.PI * 2;

export class Radar {
  constructor(lienzo, { periodo = 1.5 } = {}) {
    this.c = lienzo; this.g = lienzo.getContext('2d'); this.ang = 0; this.periodo = periodo; this.alcance = ESCALA; this.alDetectar = null;
  }

  /** Gira el haz y revela los contactos que barre. Llama a `alDetectar([{o, d, de}])` con lo nuevo de este cuadro. */
  barrer(dt, veh, contactos) {
    this.alcance = clamp(88 - veh.kmh * 0.6, 34, 88);
    const a0 = this.ang, a1 = (a0 + dt * VUELTA / this.periodo) % VUELTA, sp = Math.sin(veh.psi), cp = Math.cos(veh.psi), nuevos = [];
    for (const o of contactos) {
      if (!o.viva || o.detectada) continue;
      const dx = o.x - veh.x, dz = o.z - veh.z, fr = dx * sp + dz * cp, de = -dx * cp + dz * sp, d = Math.hypot(fr, de);
      if (d > this.alcance * (o.mult || 1)) continue;   // mult: un dron en el aire se ve más lejos que una mina enterrada
      const b = (Math.atan2(de, fr) + VUELTA) % VUELTA;   // 0 = al frente, crece hacia la derecha
      if (a1 >= a0 ? b > a0 && b <= a1 : b > a0 || b <= a1) { o.detectada = true; nuevos.push({ o, d, de }); }
    }
    this.ang = a1;
    if (nuevos.length && this.alDetectar) this.alDetectar(nuevos);
  }

  pintar(veh, P, contactos, t) {
    const g = this.g, W = this.c.width, c = W / 2, R = c - 6, k = R / ESCALA, sp = Math.sin(veh.psi), cp = Math.cos(veh.psi);
    const pant = (x, z) => { const dx = x - veh.x, dz = z - veh.z; return [c + (-dx * cp + dz * sp) * k, c - (dx * sp + dz * cp) * k]; };
    const linea = (i0, i1, l) => { for (let i = i0; i <= i1; i++) { const [x, y] = pant(P.px[i] + P.rx[i] * l, P.pz[i] + P.rz[i] * l); i === i0 ? g.moveTo(x, y) : g.lineTo(x, y); } };
    g.clearRect(0, 0, W, W);
    g.save(); g.beginPath(); g.arc(c, c, R, 0, VUELTA); g.fillStyle = 'rgba(14, 18, 11, 0.72)'; g.fill(); g.clip();

    const i0 = Math.max(0, veh.sup.i - 48), i1 = Math.min(P.n - 1, veh.sup.i + 48), A = P.def.ancho;
    g.beginPath(); linea(i0, i1, A);
    for (let i = i1; i >= i0; i--) { const [x, y] = pant(P.px[i] - P.rx[i] * A, P.pz[i] - P.rz[i] * A); g.lineTo(x, y); }
    g.closePath(); g.fillStyle = 'rgba(190, 214, 150, 0.13)'; g.fill(); g.strokeStyle = 'rgba(190, 214, 150, 0.5)'; g.lineWidth = 2; g.stroke();
    g.setLineDash([6, 8]); g.beginPath(); linea(i0, i1, 0); g.strokeStyle = 'rgba(190, 214, 150, 0.3)'; g.stroke(); g.setLineDash([]);
    g.strokeStyle = 'rgba(190, 214, 150, 0.16)'; g.lineWidth = 1.5;
    for (const r of [30, 60]) { g.beginPath(); g.arc(c, c, r * k, 0, VUELTA); g.stroke(); }
    g.setLineDash([4, 6]); g.strokeStyle = 'rgba(242, 179, 61, 0.8)'; g.lineWidth = 2;
    g.beginPath(); g.arc(c, c, this.alcance * k, 0, VUELTA); g.stroke(); g.setLineDash([]);

    // Haz: un abanico que se desvanece detrás de la línea que gira.
    for (let s = 0; s < 14; s++) {
      const a = this.ang - s * 0.06 - Math.PI / 2;
      g.fillStyle = `rgba(150, 230, 120, ${0.24 * (1 - s / 14)})`;
      g.beginPath(); g.moveTo(c, c); g.arc(c, c, this.alcance * k, a - 0.06, a); g.closePath(); g.fill();
    }
    const p = 0.5 + 0.5 * Math.sin(t * 7);
    for (const o of contactos) {
      if (o.viva && !o.detectada) continue;
      let [x, y] = pant(o.x, o.z);
      const r2 = (x - c) ** 2 + (y - c) ** 2;
      if (o.tipo !== 'mina') {   // dron: rombo ámbar, rojo si está atacando; si está lejos, en el borde del radar
        if (!o.viva) continue;
        const fuera = r2 > (R - 9) ** 2;
        if (fuera) { const s = (R - 9) / Math.sqrt(r2); x = c + (x - c) * s; y = c + (y - c) * s; }
        g.fillStyle = o.peligro ? '#ff5a3a' : '#ffb340';
        g.beginPath(); g.moveTo(x, y - 9); g.lineTo(x + 7, y); g.lineTo(x, y + 9); g.lineTo(x - 7, y); g.closePath(); g.fill();
        if (!fuera) { g.strokeStyle = `rgba(255, 179, 64, ${0.7 - p * 0.5})`; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 11 + p * 6, 0, VUELTA); g.stroke(); }
        continue;
      }
      if (r2 > R * R) continue;
      if (!o.viva) { g.strokeStyle = 'rgba(190, 214, 150, 0.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 5, y - 5); g.lineTo(x + 5, y + 5); g.moveTo(x + 5, y - 5); g.lineTo(x - 5, y + 5); g.stroke(); continue; }
      g.fillStyle = '#ff5a3a'; g.beginPath(); g.arc(x, y, 7, 0, VUELTA); g.fill();
      g.strokeStyle = `rgba(255, 90, 58, ${0.75 - p * 0.55})`; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 10 + p * 8, 0, VUELTA); g.stroke();
    }
    g.fillStyle = '#f2b33d'; g.fillRect(c - 1.05 * k, c - 2.7 * k, 2.1 * k, 5.4 * k);   // la camioneta, a escala real
    g.restore();
    g.strokeStyle = 'rgba(190, 214, 150, 0.55)'; g.lineWidth = 3; g.beginPath(); g.arc(c, c, R, 0, VUELTA); g.stroke();
  }
}
