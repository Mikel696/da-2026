// 19-JUE · Luciérnaga · Conducción. Un coche visto como una bicicleta: un eje delante, otro detrás, y en cada uno
// una llanta que agarra hasta un pico y luego cede poco a poco. El derrape no es un botón: sale de pedirle a las
// ruedas traseras más de lo que pueden dar (gas a fondo, freno de mano o entrar pasado).
// Licencia: MIT (código propio). Todas las fuerzas van por unidad de masa (m/s²).
import { clamp, lerp, suave } from './lc-util.js';
import { ARCEN } from './lc-pista.js';

export const AJUSTE = {
  // Camioneta táctica 4x4 cargada: pesa, balancea, frena largo y no derrapa por potencia.
  tactica: {
    a: 1.55, b: 1.75, alto: 0.95, inercia: 2.7,
    agarre: 0.94, B: 9.5, C: 1.3, suelta: 0.45,
    // Caja automática de 4 marchas con convertidor de par, relaciones de la 4L80-E y reducción final con cubos (5,24) de
    // un vehículo táctico ligero; llantas de 37 pulgadas.
    fuerza: 1.75, marchas: [2.48, 1.48, 1.0, 0.75], final: 5.24, radio: 0.47, automatica: [0.42, 0.32],
    rpmMax: 4200, ralenti: 750,
    arrastre: 0.0016, rodadura: 0.02, frenos: 8.5, reparto: 0.6,
    giroMax: 0.5, giroVel: 2.2,
    ayuda: 0.5,
    // Lo que la vuelve una camioneta de verdad y no un coche de derrape (11-nov, «giro y se va de lado»):
    giroCae: 9.5,          // el volante pierde recorrido con la velocidad antes que en un deportivo (11 en el cupé)
    trasera: 1.4,          // las llantas de atrás agarran más que las de delante: si algo cede, es el morro (subviraje)
    abs: 0.85,             // ABS: ninguna rueda se bloquea al frenar, así que la cola no se cruza
    esc: 0.07,             // control de estabilidad: si la cola se desliza más de 4°, corta gas y frena el giro
    atrasMax: 5,           // la reversa no pasa de 18 km/h
    medio: [1.08, 2.3],    // medio ancho y medio largo de la carrocería: el borde de la vía contiene la camioneta entera
  },
  raijin: {
    a: 1.25, b: 1.42, alto: 0.5, inercia: 1.6,            // del centro de gravedad a cada eje; altura; inercia de giro
    agarre: 1.1, B: 13, C: 1.38, suelta: 0.82,           // llanta: pico a ~9,5°, conserva el 83 % derrapando
    fuerza: 3.3, marchas: [3.2, 2.0, 1.45, 1.1, 0.88, 0.72], final: 3.9, radio: 0.33,
    rpmMax: 8000, ralenti: 950,
    arrastre: 0.00052, rodadura: 0.012, frenos: 11.5, reparto: 0.62,
    giroMax: 0.56, giroVel: 3.4,
    ayuda: 0.55,                                          // contravolante automático: 0 = simulador, 0.8 = muy asistido
  },
};

const PAR = [[800, 0.42], [2000, 0.6], [3200, 0.78], [4500, 0.95], [5800, 1], [7000, 0.96], [8000, 0.8], [8400, 0.5]];
function par(rpm) {
  if (rpm <= PAR[0][0]) return PAR[0][1];
  for (let k = 1; k < PAR.length; k++) if (rpm <= PAR[k][0]) { const a = PAR[k - 1], b = PAR[k]; return a[1] + (b[1] - a[1]) * (rpm - a[0]) / (b[0] - a[0]); }
  return 0.5;
}
const envolver = (a) => Math.atan2(Math.sin(a), Math.cos(a));

export class Vehiculo {
  constructor(aj) { this.aj = aj; this.sup = { i: 0 }; this.x = this.z = this.y = this.psi = 0; this.parar(); }
  parar() {
    Object.assign(this, { u: 0, v: 0, r: 0, delta: 0, marcha: 1, rpm: this.aj.ralenti, turbo: 0, cambio: 0, tAtras: 0, listoAtras: true, patinaje: 0,
      deriva: 0, gLat: 0, gLon: 0, axS: 0, chirrido: 0, golpe: 0, ladoGolpe: 0, evento: '', arcen: false, soplido: 0, gasPrev: 0 });
  }
  /** Coloca el coche en la muestra `i` de la pista, mirando en el sentido de marcha. */
  colocar(P, i, lat = 0) {
    this.x = P.px[i] + P.rx[i] * lat; this.z = P.pz[i] + P.rz[i] * lat; this.psi = Math.atan2(P.tx[i], P.tz[i]);
    this.parar(); P.consulta(this.x, this.z, -1, this.sup); this.y = this.sup.y;
  }
  get kmh() { return Math.abs(this.u) * 3.6; }

  /** ent = { gas 0..1, freno 0..1, giro -1..1 (derecha +), mano bool }. */
  paso(dt, ent, P) {
    const A = this.aj, s = this.sup, L = A.a + A.b, kRpm = A.rpmMax / 8000;   // kRpm: un diésel de 4200 rpm usa la misma lógica que un motor de 8000
    let { u, v, r } = this;
    const uAbs = Math.abs(u), vel = Math.hypot(u, v);

    // Marcha atrás: parado, soltar el freno y volver a pisarlo. Mantenerlo pisado deja la camioneta quieta: para subir a
    // un herido hay que esperar parado, y antes la reversa entraba sola y se la llevaba hacia atrás.
    if (this.marcha > 0) {
      if (uAbs < 0.3 && ent.freno < 0.1) this.listoAtras = true; else if (u > 1.5) this.listoAtras = false;
      if (this.listoAtras && u < 1.2 && ent.freno > 0.25 && ent.gas < 0.1) { if ((this.tAtras += dt) > 0.15) this.marcha = -1; } else this.tAtras = 0;
    }
    else if (ent.gas > 0.25 && ent.freno < 0.1 && u > -1.5) { this.marcha = 1; this.tAtras = 0; }
    const atras = this.marcha < 0, gas = atras ? ent.freno : ent.gas, freno = atras ? ent.gas : ent.freno;

    // Motor, turbo y caja automática.
    const rel = atras ? 3 : A.marchas[this.marcha - 1];
    const rpmRueda = uAbs / A.radio * rel * A.final * 9.5493;
    const embrague = (this.marcha === 1 || atras) ? gas * 2700 * kRpm * clamp(1 - uAbs / 9, 0, 1) : 0;
    const rpm = Math.min(A.rpmMax + 120, Math.max(rpmRueda * (1 + this.patinaje * 0.3), A.ralenti + embrague));
    // Con convertidor de par las vueltas bajan resbalando durante el cambio, no de golpe.
    this.rpm += (rpm - this.rpm) * (1 - Math.exp(-dt * (this.cambio > 0 && A.automatica ? 4.5 : 13)));
    this.evento = '';
    if (this.cambio > 0) this.cambio -= dt;
    else if (!atras) {
      const sube = lerp(4200, 7550, gas) * kRpm, baja = lerp(1900, 4300, gas) * kRpm;
      if (this.rpm > sube && this.marcha < A.marchas.length && this.patinaje < 0.3) { this.marcha++; this.cambio = A.automatica ? A.automatica[0] : 0.17; this.evento = 'sube'; }
      else if (this.marcha > 1 && rpmRueda < baja && rpmRueda * A.marchas[this.marcha - 2] / rel < 7300 * kRpm) { this.marcha--; this.cambio = A.automatica ? A.automatica[1] : 0.13; this.evento = 'baja'; }
    }
    const objetivo = gas > 0.15 ? suave(2600 * kRpm, 4600 * kRpm, this.rpm) * gas : 0;
    if (!A.automatica && this.gasPrev > 0.6 && gas < 0.25 && this.turbo > 0.55) this.soplido = this.turbo;   // válvula de alivio (el diésel no la lleva)
    this.gasPrev = gas;
    this.turbo += (objetivo - this.turbo) * (1 - Math.exp(-dt / (objetivo > this.turbo ? 0.5 : 0.16)));
    const limitador = this.rpm > A.rpmMax - 50;
    let motor = limitador ? 0 : A.fuerza * rel * par(this.rpm / kRpm) * (0.68 + 0.32 * this.turbo) * gas;
    if (this.cambio > 0) motor *= A.automatica ? 0.55 : 0;   // la automática baja el par durante el cambio; la secuencial lo corta
    if (atras && A.atrasMax) motor *= clamp((A.atrasMax - uAbs) / 1.5, 0, 1);
    if (limitador && gas > 0.5 && !this.evento) this.evento = 'corte';
    const sg = clamp(u / 0.5, -1, 1);
    const retencion = (1 - gas) * (0.3 + 1.1 * this.rpm / A.rpmMax) * rel / 3.2;

    // Peso sobre cada eje: al acelerar se va atrás, al frenar adelante.
    const Nf = Math.max(0.6, 9.81 * A.b / L - this.axS * A.alto / L), Nr = Math.max(0.6, 9.81 * A.a / L + this.axS * A.alto / L);
    this.arcen = Math.abs(s.lat || 0) > (s.ancho || 99);
    const mu = A.agarre * (this.arcen ? 0.74 : 1);

    // Dirección: menos giro cuanto más rápido, y una ayuda que lleva las ruedas hacia donde de verdad va el coche.
    const tope = A.giroMax / Math.sqrt(1 + (uAbs / (A.giroCae || 11)) ** 2);
    const mando = Math.sign(ent.giro) * Math.abs(ent.giro) ** 1.55, sgU = u >= 0 ? 1 : -1;
    const haciaDonde = vel > 6 ? sgU * Math.atan2(v + A.a * r, Math.max(uAbs, 4)) : 0;
    const dObj = clamp(-mando * tope + clamp(haciaDonde * A.ayuda, -0.45, 0.45), -0.62, 0.62);
    this.delta += clamp(dObj - this.delta, -A.giroVel * dt, A.giroVel * dt);

    // Deriva de cada eje y fuerza lateral de su llanta. La llanta se opone siempre a su propio deslizamiento lateral, vaya
    // hacia delante o en reversa: por eso |u| abajo y el volante con el signo de la marcha. Con `u` con signo (hasta el
    // 11-nov) en reversa las llantas empujaban hacia el lado al que ya iba la camioneta y la cruzaban en la vía.
    const uR = Math.max(uAbs, 3.2);
    const af = sgU * this.delta - Math.atan((v + A.a * r) / uR), ar = -Math.atan((v - A.b * r) / uR);
    const llanta = (al) => Math.sin(A.C * Math.atan(A.B * al));
    const capF = mu * Nf, capR = mu * Nr;
    const abs = A.abs || 1;
    let Fxf = clamp(-sg * freno * A.frenos * A.reparto, -capF * abs, capF * abs);
    let Fxr = (atras ? -motor * 0.6 : motor) - sg * (retencion + freno * A.frenos * (1 - A.reparto));
    if (A.abs && !ent.mano) Fxr = clamp(Fxr, -capR * abs * 0.7, capR * abs * 0.7);   // ABS y control de tracción atrás
    let kr, patina = 0;
    if (ent.mano && !atras) { Fxr = -sg * capR * 0.95; kr = 0.3; patina = uAbs > 3 ? 1 : 0; }
    else {
      const pide = Math.abs(Fxr) / capR;
      if (pide > 1) { Fxr = Math.sign(Fxr) * capR * 0.93; patina = Math.min(1, 0.35 + (pide - 1) * 1.5); }
      kr = Math.sqrt(Math.max(0.05, 1 - Math.min(1, pide) ** 2 * A.suelta));
    }
    const kf = Math.sqrt(Math.max(0.12, 1 - (Fxf / capF) ** 2));
    let Fyf = capF * kf * llanta(af), Fyr = capR * kr * llanta(ar) * (A.trasera || 1);
    this.patinaje += (patina - this.patinaje) * (1 - Math.exp(-dt * 10));

    // Antitrompo: pasado de 35° de deriva y girando todavía hacia fuera, la ayuda recorta gas y frena el giro.
    const beta = vel > 3 ? Math.atan2(v, uAbs) : 0;
    let frenoGiro = 0.35;
    if (A.ayuda > 0 && u > 0 && Math.abs(beta) > 0.6 && beta * r < 0) { Fxr *= 0.45; frenoGiro += A.ayuda * 3 * (Math.abs(beta) - 0.6); }
    if (A.esc && uAbs > 2 && Math.abs(ar) > A.esc) { const e = Math.abs(ar) - A.esc; Fxr *= Math.max(0.25, 1 - e * 8); frenoGiro += e * 30; }

    const cd = Math.cos(this.delta), sd = Math.sin(this.delta);
    const fx = Math.sin(this.psi), fz = Math.cos(this.psi);
    const cuesta = -9.81 * (s.ty || 0) * (fx * (s.tx || 0) + fz * (s.tz || 1));
    const ax = Fxf * cd - Fyf * sd + Fxr - A.arrastre * u * uAbs - A.rodadura * 9.81 * sg * (this.arcen ? 3 : 1) + cuesta;
    const ay = Fyf * cd + Fxf * sd + Fyr;
    const rp = (A.a * (Fyf * cd + Fxf * sd) - A.b * Fyr) / A.inercia - r * frenoGiro;
    u += (ax + v * r) * dt; v += (ay - u * r) * dt; r += rp * dt;
    if (vel < 2.5 && gas < 0.05) { const k = Math.exp(-dt * 4 * (1 - vel / 2.5)); v *= k; r *= k; if (freno < 0.05) u *= Math.exp(-dt * 0.4); }

    this.psi += r * dt;
    const sp = Math.sin(this.psi), cp = Math.cos(this.psi);
    let vx = u * sp + v * cp, vz = u * cp - v * sp;
    this.x += vx * dt; this.z += vz * dt;

    // Guardarraíl o muro: devuelve el coche a la carretera, le quita velocidad y lo endereza.
    P.consulta(this.x, this.z, s.i, s);
    const blando = s.blando === true;   // borde sin muro ni guardarraíl: la vía te devuelve sin golpe
    let lim = s.margen !== undefined ? s.ancho + s.margen : s.ancho + 0.05 + ((s.lat > 0 ? s.muroDer : s.muroIzq) ? ARCEN - 0.97 : 0);
    if (s.margen !== undefined && A.medio) {   // atravesada ocupa más ancho: el borde contiene la carrocería entera, no solo el centro
      const rel = Math.abs(envolver(this.psi - Math.atan2(s.tx, s.tz))), ang = Math.min(rel, Math.PI - rel);
      lim -= Math.sin(ang) * A.medio[1] + Math.cos(ang) * A.medio[0] - A.medio[0];
    }
    if (Math.abs(s.lat) > lim) {
      const lado = Math.sign(s.lat), exc = Math.abs(s.lat) - lim;
      this.x -= s.rx * lado * exc; this.z -= s.rz * lado * exc;
      const vn = (vx * s.rx + vz * s.rz) * lado;
      if (vn > 0) {
        const vt = vx * s.tx + vz * s.tz, nvt = vt - Math.sign(vt) * Math.min(Math.abs(vt), vn * (blando ? 0.1 : 0.5)), nvn = -vn * (blando ? 0 : 0.2) * lado;
        vx = s.rx * nvn + s.tx * nvt; vz = s.rz * nvn + s.tz * nvt;
        u = vx * sp + vz * cp; v = vx * cp - vz * sp;
        // Se endereza con la vía hacia el lado al que ya mira. Con el rumbo de la velocidad (hasta el 11-nov), en reversa
        // giraba la camioneta media vuelta contra el borde y la dejaba atravesada.
        const via = Math.atan2(s.tx, s.tz), rumbo = Math.abs(envolver(this.psi - via)) > Math.PI / 2 ? via + Math.PI : via;
        this.psi += envolver(rumbo - this.psi) * clamp(vn / 14, 0.04, blando ? 0.1 : 0.45); r *= blando ? 0.8 : 0.35;
        if (vn > 1.2 && !blando) { this.golpe = Math.max(this.golpe, clamp(vn / 11, 0.1, 1)); this.ladoGolpe = lado; }
      }
      P.consulta(this.x, this.z, s.i, s);
    }

    this.u = u; this.v = v; this.r = r; this.y = s.y;
    this.deriva = beta; this.gLat = ay; this.gLon = ax;
    this.axS += (ax - this.axS) * (1 - Math.exp(-dt * 8));
    const rapido = clamp(vel / 9, 0, 1);
    this.chirrido = clamp(Math.max((Math.abs(af) - 0.13) / 0.22, (Math.abs(ar) - 0.13) / 0.25, this.patinaje * 0.9), 0, 1) * rapido;
  }
}
