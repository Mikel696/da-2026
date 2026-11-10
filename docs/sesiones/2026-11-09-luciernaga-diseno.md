# 19-JUE · Luciérnaga (carreras) — diseño y ruta · 9-nov-2026

Aprobado por Miguel el 9-nov («Sí, constrúyelo») tras `analisis-profundo` → **HACER DISTINTO**.
Si el cupo se acaba, **la próxima sesión retoma desde «Dónde quedó»** al final.

## Qué es
Carreras callejeras japonesas de noche. Aspecto de consola **estilizado**, no fotorrealista: sin modelos de
artista no se llega a un Gran Turismo, y no se promete. La noche esconde lo que falta y es la cultura de esos coches.
El nombre se queda: las luciérnagas son las luces traseras bajando la montaña.

- **Escenarios (4):** Paso Hotaru 蛍峠 (montaña, noche) · autopista de la bahía · ciudad de neón con lluvia ·
  costa al amanecer.
- **Coches (6):** arquetipos japoneses de los 80-90 con **nombre propio**, sin marcas (repo público con el nombre
  de Miguel): cupé turbo 6 en línea · rotativo ligero · hatchback de tracción trasera · sedán de rally 4x4 ·
  GT biturbo · roadster.
- **Modos:** historia (4 zonas, un jefe por zona, duelos 1 contra 1) · carrera rápida · contrarreloj contra tu
  fantasma · derrape por puntos.
- **Lo que se toma de los grandes del género** (ideas de diseño, ningún código ni asset): lista de rivales con
  nombre y carácter; duelo de montaña 1 contra 1; premio al riesgo y sensación de velocidad; ayudas de conducción
  graduables; garaje donde cada coche suena y se conduce distinto; estilo propio en vez de realismo a medias.

## Reglas que no se rompen
1. **Todo se genera en código:** carrocerías, texturas, cielo, sonido. Cero archivos de terceros, cero marcas.
   Si el tramo de prueba no convence a Miguel, se evalúan cielos y texturas CC0 **antes** de construir lo ancho.
2. **Pistas y coches son datos.** Una pista es una lista de puntos; un coche, una tabla de medidas. El código que
   los convierte en mundo es uno solo. Añadir el coche 2 no debe tocar el motor del juego.
3. **El sonido nace apagado** (`jue_sonido`) y Claude nunca lo reproduce al probar: se verifica renderizando a un
   búfer sin altavoces y midiendo.
4. **Presupuesto:** ≤ 300 llamadas de dibujo, 2 mapas de sombra, 60 fps a 1080p en «alta» con la RX 580.
5. **Verificar a la vista:** con el panel del navegador oculto `requestAnimationFrame` da 0 cuadros.

## Piezas (`frontend/juegos/`)
| Archivo | Qué hace |
|---|---|
| `luciernaga.html` | Página, HUD y menús |
| `js/luciernaga.js` | Orquesta: escena, luces, posproceso, cámara, estados, HUD |
| `js/lc-util.js` | Ruido, azar con semilla, fusión de geometrías |
| `js/lc-pista.js` | De una lista de puntos: asfalto, arcén, muros, guardarraíles, pintura, farolas y la consulta «¿dónde estoy?» |
| `js/lc-mundo.js` | Cielo (luna, estrellas, sierras, ciudad en el valle), ladera, bosque, luciérnagas, entorno para reflejos |
| `js/lc-coche.js` | Carrocería por secciones (pasos de rueda recortados), cristales, luces, llantas |
| `js/lc-fisica.js` | Conducción: agarre por eje, derrape por potencia o freno de mano, turbo, caja automática |
| `js/lc-audio.js` | Motor por órdenes del cigüeñal, turbo, válvula de alivio, petardeo, llantas, viento |
El juego anterior (`neon.html`, `js/neon*.js`) se queda hasta que Miguel acepte el nuevo.

## Decisiones de conducción
- Modelo de bicicleta con curva de agarre que cae pasado el pico: el derrape sale de la física, no de un botón.
- Ayuda de contravolante (las ruedas delanteras tienden a apuntar hacia donde va el coche). Graduable; 0 = simulador.
- Tracción trasera, turbo con retardo, 6 marchas automáticas. Freno de mano en A.

## HUD (plan de diseño)
- **Paleta:** noche `#070a12` · sodio `#ffb35c` (farolas, tacómetro) · luna `#9db4ff` (tiempos) · señal `#1f5fd0`
  (placa de lugar, como las señales de carretera japonesas) · freno `#ff2d3d` · papel `#efe9dc`.
- **Tipos:** los del módulo (Saira Extra Condensed para cifras y títulos, Saira para texto), cifras tabulares.
- **Lo memorable, uno solo:** el tacómetro de arco por segmentos, como los tableros digitales de los 90.
  Todo lo demás, callado: placa del lugar arriba a la izquierda, tiempos arriba a la derecha, mapa abajo a la izquierda.
- Sin etiquetas en mayúsculas ni adornos: cada texto dice una cosa.

## Ruta
1. **Tramo de prueba** — 1 coche + ~1 km del Paso Hotaru con luz y sonido finales. Miguel lo juzga en producción. ← aquí
2. Conducción afinada con su opinión + contrarreloj con fantasma en el paso completo (3-4 km).
3. Los otros 3 escenarios.
4. Los 6 coches, garaje y sonidos.
5. Rivales, duelos e historia.
6. Pulido, rendimiento, `contraparte`, cierre.

## Criterios de éxito (fijados antes de empezar)
≥ 55 fps a 1080p en «alta» con la RX 580 en Chrome real · historia completable solo con el mando · 0 errores de
consola · 4 escenarios y 6 coches con sonido distinto · Miguel dice «este nivel» al ver el tramo de prueba.

## Dónde quedó
- [x] Control: el juego escuchaba al volante USB (`b89e3eb`)
- [ ] Tramo de prueba construido
- [ ] Tramo de prueba verificado en local (fps, vuelta completa con piloto automático, sonido medido)
- [ ] Tramo de prueba publicado y verificado en producción
- [ ] Miguel lo juega con su mando y decide
