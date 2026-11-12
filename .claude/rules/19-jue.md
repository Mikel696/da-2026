---
paths:
  - "frontend/juegos.html"
  - "frontend/juegos/**"
  - "scripts/prueba-entrada.mjs"
  - "scripts/prueba-fisica.mjs"
  - "scripts/hornear-impostores/**"
  - "scripts/recortar-disparos.mjs"
---

<!-- Se carga solo cuando Claude lee, escribe o edita un archivo de `paths`. Extraído de CLAUDE.md el 12-nov-2026; el contenido no cambió. -->

## 🎮 PROTOCOLO 19-JUE · JUEGOS

Sala `frontend/juegos.html`; cada juego es `frontend/juegos/<juego>.html` + `juegos/js/`. Usan módulos ES con importmap
porque three.js 0.186.1 solo se distribuye así (vendorizado sin modificar en `juegos/vendor/three/`, con `SHA256SUMS.txt`).
1. **Realismo con material real, no dibujado.** Miguel rechazó el aspecto procedural (10-nov) y el sonido sintetizado
   (11-nov). Cielos, texturas y modelos escaneados de Poly Haven en `juegos/assets/ph/`; sonidos grabados en
   `juegos/assets/sonido/`. Todo CC0 o dominio público, cada pieza con autor, fuente y suma en su `CREDITOS.json` y en los
   créditos de la sala. Nada de pago ni de licencia dudosa: el repo es público. Descargar más requiere su permiso.
2. **Vías, campos de minas y vehículos son datos** (`TRAMO`, `CAMPO_1`, `TACTICA`, `AJUSTE`): un solo código los vuelve mundo.
3. **Control:** manda el último mando en el que se pulsó un botón, nunca el `timestamp` (el volante USB tiembla y tapaba al
   mando Bluetooth). Prueba: `node scripts/prueba-entrada.mjs`.
4. **Sonido apagado al nacer (`jue_sonido`) y nunca se reproduce al probar.** En el Chrome de Miguel está encendido:
   verificar allí sin pulsar teclas ni hacer clic en la página.
5. **Verificar con el panel a la vista** (oculto, `requestAnimationFrame` da 0 cuadros) y la lógica con el piloto
   automático (`__co.auto`: `esquivar`, `tirador`, `rescatar`, `equipo`; `?tramo=N` elige el tramo). Con la ventana de
   Claude tapada el 3D cae a 2 fps: `__co.simular(seg)` corre la lógica sin dibujar. Medir fps a 1920×1080 en calidad alta: meta 60 con la RX 580.
6. **Se trabaja en la copia aparte `.claude/worktrees/convoy`** (rama `claude/convoy`) y se publica con
   `git push origin HEAD:main`: la carpeta principal suele tener cambios sin guardar de otra sesión.
7. **Conducción: `node scripts/prueba-fisica.mjs` antes de publicar** (27 comprobaciones: cola que no se desliza al
   girar, frenada recta, freno pisado quieta, reversa al soltar y volver a pisar, cuesta sin gas quieta, 0-60 de
   camioneta, borde que contiene la carrocería). La llanta se opone siempre a su deslizamiento: |u|, nunca u con signo.
8. **Sonido grabado sin bucles audibles:** nunca repetir tal cual un tramo que cambia (un acelerón): bucle con la costura
   fundida o textura de granos al azar. Medirlo sin altavoces: parecido del volumen consigo mismo desplazado (< 30 %).
9. **Vegetación por trozos con distancia de dibujo** (`LEJOS`, 450 m): con la vía larga, todo entra en cámara.
   Presupuesto medido en la RX 580: 5-8 M de triángulos y ≤ 800 llamadas por cuadro, 60 fps.
10. **Árboles = impostores horneados** (`scripts/hornear-impostores/`): el modelo escaneado se fotografía una vez y se planta
   como 3 planos cruzados (`co-paisaje.js`, medidas en `IMP`). **Follaje con transparencia en dos pasadas** (`dosPasadas`:
   profundidad y luego color con profundidad igual): un material pesado con alpha-test sobre filas superpuestas costó 30 ms.
   El bosque no proyecta sombra; la oclusión ambiental no ve los impostores. Medir con `EXT_disjoint_timer_query_webgl2`.
11. **Hora, clima y guerra son datos:** `clima` de cada misión → `ATMOS` (exposición, niebla, sol/luna, faros, lluvia y agarre);
   `GUERRA_RUTA` / `GUERRA_TRAMO` en `co-guerra.js`. Las misiones 5-7 son la 4 con otro cielo. El juego abre en la misión
   larga (`jue_co_mision`). Al cambiar la caja o el agarre, `prueba-fisica.mjs` en verde.
12. **Dificultad por nivel** (`co-nivel.js`, `jue_co_nivel`): `escalar(MIS, nivel)` sobre los datos. Toda regla nueva de
   dificultad se prueba con el piloto en los niveles 1, 3 y 5 (el 3, al menos 2 de 3) y las minas extra siempre dejan hueco.
