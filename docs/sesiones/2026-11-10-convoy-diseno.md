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
- [x] Paso 3: torreta y drones (11-nov) — tres tramos en el menú
- [x] Paso 4: inhibidor, humo, heridos y puesto de socorro (11-nov) — el récord pasa a ser un puntaje
- [x] Paso 5a: drones interceptores propios (pedido de Miguel, 11-nov) y motor diésel sintetizado provisional
- [x] **Sonido grabado real** (11-nov, con su permiso): motor, disparos, explosiones y ambiente. Falta el dron (abajo).

## Misión completa (11-nov, noche) · lo hecho
- Conducción: 2 fallos reales en `lc-fisica.js` (signo de la llanta en reversa; el borde giraba media vuelta) + ABS,
  control de estabilidad, subviraje, caja automática 4L80-E, retención en parado, reversa al soltar y volver a pisar.
  Prueba: `node scripts/prueba-fisica.mjs`.
- Vehículo táctico blindado, cámara lejana con retraso de brazo, misión de 2,4 km (tramo 4), campamentos, puestos,
  lanzacohetes, reparación de campaña, áloes de Poly Haven, humo más suave, motor sin bucle audible.
- **Sin verificar:** con el mando físico de Miguel; cómo suena de verdad (medido, no oído); el lanzamiento del cohete y
  la herramienta del mecánico son sonidos sintetizados cortos.

## Próxima sesión · pedido de Miguel (11-nov), sin empezar
> «que el juego se vea como un camino de los bálticos, y esta guerra actual que tenemos» · «misiones de noche, tarde,
> lloviendo» · «más real sin comprometer la jugabilidad, bien optimizado».
1. **Paisaje báltico** (lo más visible): llano con lomas suaves, campos verdes y bosque de pino y abedul a los lados,
   cuneta con agua, asfalto gastado o grava. Material CC0 de Poly Haven (ya autorizado): pasto, suelo de bosque, cielo
   nublado (`kloppenheim_06_puresky` ya está). **El bosque no cabe con modelos de 400 k a 17 M de triángulos:**
   impostores (renderizar `fir_sapling` / `pine_sapling_small` a textura al cargar y plantar cientos de billboards
   cruzados); modelos reales solo en los primeros 40 m.
2. **Guerra actual, sin bandos ni insignias:** erizos antitanque y dientes de dragón, trincheras con sacos, vehículos
   quemados al costado, cráteres, túneles de red antidrones sobre la vía, drones FPV con fibra óptica (inmunes al
   inhibidor: obligan a usar la torreta).
3. **Hora y clima por misión** (dato en `TRAMOS`): tarde (cielo HDR de atardecer), noche (cielo nocturno, faros y pilotos
   con luz real, trazadoras que brillan, el radar como ojos), lluvia (partículas, asfalto mojado con menos roughness,
   menos agarre en `lc-fisica`, sonido de lluvia CC0 con su permiso). Campaña: misiones 5-7 en la misma ruta.
4. Mantener 60 fps en la RX 580 (`renderer.info`, `LEJOS`). Correr `node scripts/prueba-fisica.mjs` si se toca el agarre.

## Sonido grabado (11-nov)
- **11 piezas, 1,87 MB, CC0 o dominio público** en `frontend/juegos/assets/sonido/`, cada una con autor, fuente y suma en
  `CREDITOS.json`: motor **Detroit 6.2 L V8 diésel** (el del Humvee original; Commons, CC0); 5 disparos recortados de
  **The Free Firearm Sound Library** de Still North Media (CC0, OpenGameArt: Springfield .30-06 y AK-47, pasados a mono
  48 kHz con `recortar.mjs`); 3 grabaciones de explosiones, brisa con pájaros y un combate lejano (Commons).
- **Descartado:** motores de OpenGameArt con CC-BY y GPL (el permiso fue para CC0). Freesound pide cuenta para los originales.
- **Sin grabación libre: el zumbido de los drones** (Commons solo trae la palabra «quadcopter» pronunciada). Sigue sintetizado.
- `co-sonido-real.js`: se descarga solo al encender el sonido; si falla, vuelve el sintetizado. Motor = dos bucles de la
  misma grabación (ralentí 6,6–9,8 s y altas vueltas 4,0–5,0 s, medidos) mezclados por acelerador y vueltas; disparo = uno
  de los 5 al azar con ±5 % de tono; explosión = un estallido de los 12 que traen los archivos, más bajo y apagado con la
  distancia; ambiente en bucle y un combate lejano cada 35–75 s.
- **Medido sin altavoces** (OfflineAudioContext): motor 0,07 → 0,14 de nivel al acelerar; ráfaga de 9 tiros/s pico 0,28;
  explosión cercana pico ~1,0 (el compresor del juego la recorta). **Sin oír:** cómo suena de verdad; eso lo juzga Miguel.
- [ ] Ruta completa (tramos encadenados): diseñada y aparcada, Miguel pidió antes lo de arriba

## Paso 5a · interceptores y diésel (11-nov)
- **Drones interceptores** (`co-interceptores.js`, B o E, 4 por tramo): salen de la plataforma, eligen el dron marcado más
  urgente que nadie persigue (primero el que ataca) y lo embisten a menos de 3 m. Sin blanco, hacen guardia a 22 m sobre la
  camioneta 30 s y vuelven a la plataforma (se recuperan). El inhibidor no les afecta. Triángulo azul en el radar, marca
  azul «Interceptor → bombardero» en pantalla. El piloto automático lanza uno por cada dron libre a menos de 200 m.
- **Prueba (simulación, tramo 2, torreta apagada):** 4 interceptores + inhibidor derribaron 7 de 10 drones; 2 golpes
  (blindaje 48 %); 3 de 3 heridos; 3.412 puntos. Solos no bastan: hay que combinarlos con la torreta.
- **Motor diésel sintetizado** (`PERFILES_MOTOR.diesel` en `lc-audio.js`): 4 cilindros (nota = rpm/30), más grave, golpeteo
  de inyectores. Medido sin altavoces: la nota domina (×90 sobre una ajena), pico 0,87. Provisional hasta tener grabaciones.
- En el puntaje, un herido a bordo cuenta desde que sube (antes solo al llegar).

## Paso 4 · inhibidor, humo, heridos y puntaje (11-nov)
- **Inhibidor de señal** (LB / Q): 4 s, radio 70 m, recarga 14 s. Los drones al alcance pierden la señal: el suicida sigue a
  ciegas, desviado, y cae (cuenta como neutralizado si se estrella lejos); bombardero y reconocimiento flotan a la deriva y
  bajan, y el de reconocimiento pierde lo que había marcado. Burbuja azul que se expande.
- **Cortina de humo** (X / G): 3 granadas por tramo; 5 nubes alrededor que duran 16 s. Dentro (9 m) los drones no te ven:
  atacan el último punto donde te vieron, el bombardero no suelta y el de reconocimiento no marca. El humo se queda donde
  se lanzó: sirve para detenerse, no para correr.
- **Heridos** (`co-heridos.js`, `HERIDOS`: 2, 3 y 2 por tramo): en camilla a la orilla, con bengala de humo naranja visible
  de lejos, marca verde en pantalla y en el radar. Se suben deteniéndose a menos de 7,5 m durante 4 s. Carpa de socorro (sin
  emblema) en el puesto de control. Aviso si dejas uno atrás.
- **Puntaje** (récord por tramo en `p1..p3`; la sala muestra el del 1): carga ×10 · herido 500 · dron 100 · mina superada 25 ·
  blindaje ×5 · rapidez 10 por segundo bajo 1:30. Sin entrega no hay puntaje. Rescatar cuesta tiempo pero vale más.
- **`__co.simular(seg)`**: corre la lógica sin dibujar. Con la app de Claude tapada por otra ventana, Windows deja el 3D en
  2 cuadros por segundo aunque la tarjeta esté libre (medido: 31 % de uso, la sala sin 3D a 61 fps): así se prueba igual.
- **Verificado (simulación en local):** tramo 3: 2 de 2 heridos, inhibidor contra un suicida en picada, 4 de 4 drones, 0 minas
  pisadas, 3.453 puntos. Tramo 2: 3 de 3 heridos, 10 de 10 drones, sin daño, 4.145 puntos. Humo: «oculto» mientras sube un
  herido. Encontró un fallo real: frenar a fondo parado mete la reversa; el piloto ahora se sujeta con el freno de mano.
- **Sin verificar:** fps de esta versión (la ventana estaba tapada; la del paso 3 medía 60) y el mando físico de Miguel.

## Paso 3 · torreta y drones (11-nov)
- **Tres tramos** (menú «Tramo», se recuerda en `jue_co_tramo`; `?tramo=N` para probar): 1 · Campo minado (la vía de
  siempre, 19 minas) · 2 · Cielo hostil (la misma vía al revés, `TRAMO_INVERSO`, 10 drones en 8 oleadas, sin minas) ·
  3 · Corredor completo (minas + 4 drones). Récord propio por tramo (`tramo1..3`); la sala muestra el del 1.
- **Torreta** (`co-arma.js`): la cámara apunta (stick derecho / ratón) y el arma la sigue a su propia velocidad, así que
  hay dos marcas: la retícula (dónde miras) y un círculo ámbar (dónde apunta el cañón). Balas reales a 650 m/s con
  trazadora y caída; 9 tiros/s; el cañón se calienta y se traba hasta enfriarse. Apuntando al suelo compensa la caída
  (a ras de suelo, 10 cm de caída son 4 m de error). Una bala que pasa a menos de 1 m de una mina la detona.
- **Ayuda de puntería:** si la retícula pasa a menos de 7° de un dron marcado, se fija (se pone roja), lo sigue y el arma
  apunta adelantada. Más fuerte con mando que con ratón.
- **Drones** (`co-drones.js`, oleadas en `OLEADAS`): suicida (FPV con carga; a 65 m se lanza en picada; 2 tiros),
  bombardero (hexacóptero; suelta granadas donde calcula que vas a pasar; 6 tiros) y reconocimiento (da vueltas alto;
  si lo dejas vivo 14 s después de marcado, llama a dos suicidas por detrás). Modelos en código, sin bandos reales.
  El radar los ve 1,8-2,2 veces más lejos que a las minas; en pantalla llevan marca con distancia o flecha en el borde.
  Avisos «Suicida a las 2 · 140 m». Zumbido sintetizado del dron más cercano (solo con sonido encendido).
- **Daño:** suicida que llega −26 % de blindaje; granada hasta −32 % según distancia; derribar un suicida cerca también
  hace daño. Pantalla final con drones derribados y ataques recibidos, y un consejo según qué te destruyó.
- **Verificado en local (panel a la vista):** tramo 2 con tirador automático: 4 drones derribados en 24 s sin daño; con el
  tirador apagado 30 s, 3 impactos (blindaje 36 %) y entrega igual. Tramo 3 completo: 19 de 19 minas marcadas, 0 pisadas,
  4 de 4 drones, 55,5 s, **60 fps, 238 llamadas de dibujo**. Mina detonada a tiros a 95 m. 0 errores de consola.
- **Sin verificar:** puntería y disparo con el mando físico de Miguel; el ratón con captura de puntero (clic en la escena).

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
