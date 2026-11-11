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
- [x] Permiso de Miguel para descargar material CC0 (10-nov, «Sí, autorizo»)
- [x] Tramo de realismo construido y publicado sin enlazar en la sala: `frontend/juegos/corredor.html`
- [x] Miguel aprobó el nivel visual como base (11-nov, «Sí, sigue»)
- [x] Paso 2: radar y minas — publicado y enlazado en la sala (sustituye al juego viejo de carreras)
- [ ] Miguel lo juega con su mando
- [ ] Paso 3: torreta y drones

## Paso 2 · radar y minas (11-nov)
- **Minas antitanque en las rodadas** (`co-minas.js`, campo `CAMPO_1`: 19 minas en 10 grupos). Estallan si una rueda pasa a
  menos de 38 cm: una mina que queda entre las ruedas no estalla. Tierra removida encima (casi invisible); el radar las marca
  con anillo y baliza. Cada mina: −34 % de blindaje, −15 % de carga y cae parte de la carga; tres inutilizan la camioneta.
- **Radar** (`co-radar.js`): haz que gira cada 1,5 s; detecta lo que barre dentro del alcance, que baja con la velocidad
  (88 m parado, 34 m a 90 km/h). Pinta la vía, las minas y la camioneta a escala real. Genérico: los drones irán ahí.
- **Explosión:** fogonazo, tierra que cae, columna de humo, cráter, salto y cabeceo de la camioneta, vibración del mando,
  sonido (solo si está encendido). Blindaje bajo 70 %: humo del motor; bajo 35 %: humo negro y llamas.
- **Misión:** llegar al puesto de control. Pantalla final con tiempo, carga, blindaje, minas marcadas y pisadas. Récord: el
  tiempo, con carga y blindaje anotados.
- **Verificado en local (panel a la vista):** piloto automático sin esquivar → pisa 3 minas en 23 s y la camioneta queda
  inutilizada; esquivando con el radar → 19 de 19 marcadas, 0 pisadas, entrega en 55,5 s a 60 fps; 0 errores de consola.
- **Sala:** Corredor ocupa la tarjeta de Carreras; el juego viejo pasó a `ANTERIORES` y sigue abriendo en `juegos/neon.html`.
  Los créditos ya nombran a Poly Haven y la nota que decía «nada viene de afuera» se corrigió.
- **Sin verificar:** el mando físico de Miguel en este juego; el sonido diésel (el motor sigue siendo el del cupé).

## Tramo de realismo · lo que hay (10-nov)
- **Material real (Poly Haven, CC0, 51,2 MB, 15 piezas):** 2 cielos HDR (soleado por defecto; `?cielo=nublado`), asfalto,
  tierra, grava y chapa verde escaneados; 2 rocas, 2 arbustos, tronco, barrera de hormigón, bidón, caja y barril.
  Cada archivo con autor, fuente y suma en `frontend/juegos/assets/ph/CREDITOS.json`.
- **Cargadores oficiales de three 0.186.1** añadidos al vendor: GLTFLoader, HDRLoader, BufferGeometryUtils,
  SkeletonUtils, GTAOPass y sus sombreadores (sumas en `SHA256SUMS.txt`).
- **El sol sale del propio cielo:** `leerCielo` busca los píxeles más brillantes, mide cuánta luz dan y los quita del
  entorno; esa luz pasa a un foco direccional con sombras. Así el sol no se cuenta dos veces.
- **Camioneta:** carrocería por secciones (mismo generador del cupé, ahora con coordenadas de textura), chapa
  escaneada teñida de oliva, ruedas con tacos, defensa, rejilla, torreta con arma (ya gira y cabecea: falta usarla),
  antena y carga escaneada. `AJUSTE.tactica` en `lc-fisica.js`: diésel de 4200 rpm, 5 marchas, pesada.
- **Medido en el panel (RX 580):** 1920×1080, calidad alta con oclusión ambiental: **60 fps** estables, 2,7 ms de CPU,
  448 llamadas de dibujo, 7,8 M de triángulos por cuadro. Con 18 rocas daba 52-54 fps: cada roca escaneada son
  ~98 000 triángulos y se dibuja hasta 3 veces por cuadro. El piloto automático recorre la vía sin salirse.
- **Sin verificar:** el mando físico en este juego; el sonido (el motor sigue siendo el del cupé, falta el diésel).
- **Pendiente conocido:** 448 llamadas pasan del presupuesto de 300 (la camioneta son ~120 piezas sueltas: fundirlas);
  el campo se ve liso (faltan piedras pequeñas y vegetación ligera); el cielo a 2K se ve blando de cerca.
- **Para probar en local:** vista previa `corredor` (sirve `.claude/worktrees/convoy/frontend` en el puerto 3463) y
  abrir `/juegos/corredor`. En consola: `__co.salir(); __co.auto.on = true`.
