// 19-JUE · Corredor · Motor granular. Una sola grabación real de un blindado diésel que pasa de ralentí a un acelerón
// fuerte (Freesound 405086, CC0) y un mapa medido de qué vueltas suenan en cada instante (motor-blindado.json:
// frecuencia de encendido por autocorrelación). Cada ~50 ms suena un trocito de 0,11 s tomado del instante cuyas vueltas
// son las que pide el juego, con una ventana suave y solapado al 50 %: el timbre cambia de verdad con las rpm (no se
// estira un bucle), y al cambiar de marcha las vueltas caen y el sonido corta. Sin librerías. Licencia: MIT (código propio).

const GRANO = 0.11;   // s de grabación por trocito: dos períodos o más incluso al ralentí (37 Hz)
const VENTANA = (() => { const n = 64, c = new Float32Array(n); for (let i = 0; i < n; i++) c[i] = Math.sin(Math.PI * i / (n - 1)) ** 2; return c; })();

export class MotorGranular {
  /** mapa = { cuadros: [[t, f0, nivel], …] } · destino: nodo al que suena · rpm: { ralenti, max } del vehículo. */
  constructor(ctx, buffer, mapa, destino, rpm) {
    this.ctx = ctx; this.buffer = buffer; this.destino = destino; this.rpm = rpm;
    this.cuadros = mapa.cuadros.filter((c) => c[0] > GRANO / 2 && c[0] < buffer.duration - GRANO / 2).sort((a, b) => a[1] - b[1]);
    const f = this.cuadros.map((c) => c[1]), niv = this.cuadros.map((c) => c[2]).sort((a, b) => a - b);
    this.fMin = f[Math.floor(f.length * 0.03)]; this.fMax = f[Math.floor(f.length * 0.97)]; this.nivelRef = niv[niv.length >> 1];
    this.sig = 0; this.ultimos = []; this.amp = 0.8;
  }
  /** Qué trocito y a qué velocidad para unas vueltas: el instante cuyo tono más se parece (el rango del juego, 750-4200
   *  rpm, es más ancho que el de la grabación: el resto lo pone una subida de tono moderada, ^0,35). */
  elegir(rn, carga) {
    const r = Math.min(1, Math.max(0, rn)), fSel = this.fMin * (this.fMax / this.fMin) ** r, fReal = this.fMin * (1 + r * (this.rpm.max / this.rpm.ralenti - 1));
    const c = this.cuadros; let lo = 0, hi = c.length - 1;
    while (lo < hi) { const m = (lo + hi) >> 1; if (c[m][1] < fSel) lo = m + 1; else hi = m; }
    // Candidatos dentro de ±6 % de tono, al azar y sin repetir ninguno de los 4 últimos: con pocos candidatos alternándose
    // se oía un ciclo (medido: 75 % de parecido del volumen consigo mismo a 0,44 s). Con carga pesan más los fuertes.
    const cand = [];
    for (let k = Math.max(0, lo - 14); k < Math.min(c.length, lo + 14); k++) if (Math.abs(c[k][1] / fSel - 1) < 0.06 && !this.ultimos.includes(k)) cand.push(k);
    if (!cand.length) cand.push(Math.min(c.length - 1, lo));
    let tot = 0; const peso = cand.map((k) => { const w = carga ? 0.5 + c[k][2] / this.nivelRef : 0.5 + this.nivelRef / c[k][2]; tot += w; return w; });
    let r0 = Math.random() * tot, k = cand[0]; for (let j = 0; j < cand.length; j++) { if ((r0 -= peso[j]) <= 0) { k = cand[j]; break; } }
    this.ultimos.push(k); if (this.ultimos.length > 4) this.ultimos.shift();
    return { t: c[k][0], f0: c[k][1], nivel: c[k][2], vel: Math.min(1.5, Math.max(0.85, (fReal / fSel) ** 0.35 * fSel / c[k][1])) };
  }
  /** Programa trocitos hasta el tiempo `hasta` del reloj de audio. estado(t) → { rn, gas, corte, activo }. */
  programar(hasta, estado) {
    const ctx = this.ctx;
    if (this.sig < ctx.currentTime) this.sig = ctx.currentTime + 0.01;   // se atrasó (pestaña oculta): sin ráfaga de golpe
    while (this.sig < hasta) {
      const e = estado(this.sig);
      if (!e.activo) { this.sig += 0.05; continue; }
      const g = this.elegir(e.rn, e.gas > 0.3 && !e.corte), dur = GRANO / g.vel;
      // Volumen: la grabación sube mucho al acelerar (está más cerca); se compensa a medias para que siga habiendo esfuerzo.
      // Suavizado entre trocitos: si cada uno trae su propio volumen, el cambio a ritmo fijo se oye como un pulso.
      this.amp += (Math.min(2.2, (this.nivelRef / g.nivel) ** 0.55) * (e.corte ? 0.4 : 0.7 + 0.45 * Math.min(1, e.gas)) - this.amp) * (e.corte ? 0.7 : 0.35);
      const amp = this.amp;
      const s = ctx.createBufferSource(), v = ctx.createGain(); s.buffer = this.buffer; s.playbackRate.value = g.vel;
      const curva = new Float32Array(VENTANA.length); for (let i = 0; i < curva.length; i++) curva[i] = VENTANA[i] * amp;
      v.gain.setValueAtTime(0, this.sig); v.gain.setValueCurveAtTime(curva, this.sig, dur);
      s.connect(v); v.connect(this.destino);
      s.start(this.sig, Math.max(0, g.t - GRANO / 2 + (Math.random() - 0.5) * 0.06), GRANO); s.stop(this.sig + dur + 0.01);
      this.sig += dur * (0.42 + Math.random() * 0.16);   // solape de ~50 % con algo de azar: sin un ritmo fijo de trocitos
    }
  }
}
