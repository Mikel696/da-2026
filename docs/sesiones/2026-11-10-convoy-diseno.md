# 19-JUE · El juego de carreras pasa a ser «Corredor» (convoy de suministros) · 10-nov-2026

Si el cupo se acaba, **la próxima sesión retoma desde «Dónde quedó»** al final.

## Qué pasó
- 9-nov: se construyó el tramo de prueba de «Luciérnaga» (bajada de montaña de noche, cupé japonés), todo
  generado en código. Funcionaba: cargó sin errores y el piloto automático completó la bajada (37,6 s, 140 km/h).
- 10-nov: **Miguel lo vio y lo rechazó**: «no me entregues ese dibujo de baja calidad». Y cambió el juego entero
  (texto suyo abajo). El tramo de prueba cumplió su función: mostró en una sesión, y no en seis, que el aspecto
  «dibujado por código» no es lo que él quiere.
- El trabajo no se publicó. Está en la rama **local** `claude/convoy` (commits `9332087` y `932fbf0`).
  `main` quedó idéntico a lo publicado (juego viejo `neon.html` + arreglo del control).

## El encargo de Miguel (10-nov, textual)
> «una camioneta del Army que necesita llevar suministros a un punto de avance, pero debe pasar por campos
> minados, ataques de drones; nos defendemos con un radar que detecte las minas, enemigos, etc., armado para atacar
> drones; nunca nos salimos de la vía, solo vamos repeliendo los ataques de diferentes maneras; también buscar
> heridos y ponerlos a salvo […] muy realista la conducción, las armas, la carretera […] gráficos ultra realistas,
> pero optimizando la experiencia de juego».

## La verdad sobre los gráficos (lo que decide todo)
- Lo que se vio el 9-nov es **el techo de dibujar todo con código**. Más horas no lo vuelven realista.
- El realismo sale de tres cosas que no se programan: **texturas escaneadas del mundo real, cielos HDR
  fotografiados y modelos 3D hechos o escaneados por artistas**.
- Búsqueda del 10-nov:
  - **Poly Haven** publica cielos HDR, texturas escaneadas y modelos como **CC0** y sin cuenta (confirmar en
    `polyhaven.com/license` antes de bajar). Sirve para carretera, tierra, roca, vegetación, escombros y luz.
  - **Camioneta militar y drones realistas gratis y CC0: no se encontró ninguno.** Lo que hay es de pago
    (≈ 24–25 USD) o con licencias que no permiten redistribuir. Un modelo de pago **no puede vivir en este repo**:
    es público, y publicarlo sería redistribuirlo.
- **Consecuencia:** entorno y luz pueden ser reales; la camioneta y los drones habría que hacerlos en código pero
  vestidos con materiales escaneados (una camioneta militar es de paneles planos: mucho más fácil de hacer creíble
  que un cupé curvo), o Miguel consigue un modelo con licencia CC0 / CC-BY.
- **No se promete «ultra realista».** En un navegador se puede llegar a realismo de materiales y luz; no a un
  juego de consola de gran estudio. Se comprueba con un tramo de prueba antes de construir el resto.

## Propuesta de juego: «Corredor» (nombre de trabajo)
Una camioneta táctica lleva suministros por una carretera bajo ataque hasta un punto de avance. La vía es el
carril: no se puede salir de ella. El jugador reparte su atención entre tres cosas.

| Modo | Qué haces | Mando |
|---|---|---|
| Manejo | Velocidad y posición dentro de la vía; esquivar minas y cráteres | Stick izquierdo, RT, LT |
| Ataque | Torreta del techo contra drones | Stick derecho apunta, RB dispara (con ayuda de puntería) |
| Defensa | Inhibidor de señal (deja ciegos a los drones un momento), humo, señuelos | LB, X, Y |

- **Radar:** barrido circular en pantalla. Muestra minas dentro de su alcance, drones en el aire, heridos y
  puestos de control. Ir más rápido deja menos tiempo para reaccionar a lo que el radar descubre.
- **Minas:** se esquivan, o se detonan disparando desde lejos. Pisar una daña la camioneta y la carga.
- **Drones:** de reconocimiento (marcan tu posición), suicidas (se lanzan en picada) y bombarderos (sueltan carga).
- **Heridos:** una bengala de humo los señala al borde de la vía. Te detienes junto a ellos unos segundos
  (mientras te defiendes) y los dejas en el siguiente puesto de socorro.
- **Lo que está en juego:** la carga (cuánto llega), el estado de la camioneta (afecta cómo se conduce) y los heridos.
- **Sin sangre ni bandos reales:** ejército y conflicto ficticios, sin insignias de ningún país.

## Qué se reutiliza de la rama `claude/convoy`
`lc-pista.js` (carretera desde una lista de puntos, terreno recortado, «¿dónde estoy?») · `lc-fisica.js` (modelo de
conducción: hay que reajustarlo a una camioneta pesada 4x4) · `lc-audio.js` (motor por órdenes: pasa a diésel) ·
`entrada.js` (ya en `main`) · posproceso, cámara, HUD y menús de `luciernaga.js` · el piloto automático (prueba).

## Ruta
1. **Tramo de realismo** — 300 m de carretera con cielo HDR, suelo y rocas escaneados y la camioneta rodando.
   Miguel juzga si ese nivel le sirve. **Si no le sirve, este juego no debe hacerse en el navegador.** ← aquí
2. Radar y minas.
3. Torreta y drones.
4. Inhibidor, humo, daños, heridos y puestos de control.
5. Ruta completa, misión, sonido, pulido.

## Necesita la decisión de Miguel
Permiso para descargar al repo (público) material **CC0 de Poly Haven** (cielos HDR, texturas, rocas, vegetación) y
los **cargadores oficiales del paquete `three` 0.186.1** (leer modelos glTF y cielos HDR). Estimado: 30–60 MB.
Cada archivo se anota con su licencia y su fuente en los créditos de la sala. Sin ese permiso, lo mejor posible es
lo que ya vio.

## Dónde quedó
- [x] Trabajo anterior a salvo en `claude/convoy` (local, sin subir); `main` = lo publicado
- [x] Búsqueda de material libre (arriba)
- [ ] Permiso de Miguel para descargar material CC0
- [ ] Tramo de realismo
