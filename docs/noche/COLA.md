# Cola nocturna del Cerebro

La lee el guardián nocturno (rutina «1 · Cerebro · Guardián nocturno», 2:07 a. m. Colombia) después de
sus chequeos, si ninguno salió rojo. La llena y la revisa la sesión de día **Integrador**, que verifica
en el navegador, fusiona a `main` y comprueba en producción. Aprobado por Miguel el 28-oct-2026.

## Reglas
1. **Una tarea por noche:** la primera marcada `[ ]`.
2. **Límite de trabajo pendiente:** si hay 2 o más tareas en `[r]`, el guardián no hace ninguna.
3. **Código solo en la rama que dice la tarea.** Nunca en `main`, nunca fusionar.
4. **No borrar archivos**, tampoco en la rama. No tocar datos de usuario, Supabase, `cloud-sync.js` ni `nb-shared.js`.
5. **Tope de 30 minutos.** Si no alcanza, se deja lo hecho en la rama con una nota «quedó en: …» y se marca `[r]` igual.
6. Repositorio **público**: nada interno del trabajo de Miguel ni de sus clientes.
7. **Si la rama que dice la tarea no existe en `origin`, no se hace la tarea ni se crea la rama:** se anota
   «rama X no existe» en el informe y se termina. Solo se crea rama cuando la tarea dice «rama nueva».

## Estados
`[ ]` pendiente · `[r]` hecha de noche, espera revisión (rama, commit, verificación) ·
`[x]` revisada y publicada (la marca el Integrador) · `[-]` descartada (con la razón)

## Tareas

> **9-nov-2026 · 19-JUE sale del carril nocturno.** Los juegos los lleva la sesión de día (rediseño completo del
> de carreras, ver CEREBRO_STATE 9-nov). **No hay tareas de juegos para el guardián**: si esta sección no tiene
> ninguna `[ ]`, solo hace sus chequeos. No tocar `frontend/juegos/` ni la rama `claude/juegos`.

- [x] **19-JUE · 1 · Sala de juegos.** Rama `claude/juegos` (ya existe: trabajar sobre ella). Leer primero
  `docs/sesiones/2026-10-23-juegos.md` (investigación, licencias y plan). Terminar el núcleo compartido
  (`frontend/juegos/js/`) y la sala `frontend/juegos.html`: 3 tarjetas (carreras, shooter, arcade; las tres
  «próximamente» por ahora), detector de control, probador de botones, tabla de controles y créditos con la
  licencia de cada base. Sin juegos todavía.
  *Verificación:* `node --check` a cada `.js` de `frontend/juegos/`; cada ruta del `importmap` y cada
  `import` relativo apunta a un archivo que existe; ningún archivo de terceros sin licencia MIT o Unlicense anotada.
  > Rama `claude/juegos` · commit `ec5e041` · La sala ya existía casi completa; solo se puso Neón GP en «Próximamente» (su `js/neon.js` aún no existe) y se cambió el rótulo.
  > Verificación OK: `node --check` sin fallos, imports relativos existen, three.js MIT con sumas SHA256 correctas, sala carga en navegador sin errores (3 tarjetas, 3 «Próximamente»).

- [x] **19-JUE · 2 · Juego 1 (carreras), parte A.** Rama `claude/juegos`. Juego **original**: no recrea ningún
  juego existente ni usa sus nombres, naves, pistas o marcas. Diseño tomado de `pmndrs/racing-game` (MIT),
  reescrito en vanilla con three.js vendorizado. Todos los modelos, texturas y sonidos generados en código.
  Parte A: una pista generada en código, un vehículo, control con teclado y mando (Gamepad API, vibración si
  existe), cámara de persecución, selector de calidad. Presupuesto de render: ≤ 300 llamadas de dibujo,
  ≤ 2 pases de posproceso, DPR acotado. La tarjeta de carreras en la sala abre el juego.
  *Verificación:* la misma de la tarea 1, más un comentario al inicio del archivo del juego con su licencia y su base.
  > Rama `claude/juegos` · commit `f26ab45` · Nuevo `frontend/juegos/js/neon.js` (pista cerrada de ~1,3 km, coche, derrape y nitro, teclado y mando con vibración, 3 cámaras, selector de calidad, pausa, minimapa) y la tarjeta de carreras pasa a «listo» en `catalogo.js`.
  > Verificación OK: `node --check` a los 7 `.js` de `frontend/juegos/js/`; imports resueltos; licencia MIT y base en la cabecera; navegador sin interfaz: carga sin errores, el coche acelera y gira (80 km/h en el cuadro), HUD y minimapa se pintan. Sin probar con control físico ni a 60 fps reales (el navegador sin GPU va lento).

- [x] **19-JUE · 3 · Juego 1 (carreras), parte B.** Rama `claude/juegos`. Vueltas, cronómetro, récord local
  (`localStorage`, clave con prefijo `jue_`), sonido sintetizado con Web Audio y menú de pausa navegable con
  el mando. *Verificación:* la de la tarea 2.
  > Hecha de día el 5-nov (`33f5d0b`, ya en `main`); seguía marcada pendiente y el guardián la habría rehecho.

## Hecho
- 9-nov-2026 · Tareas 1, 2 y 3 de 19-JUE están en `main` (fusionadas el 5-nov). Falta la aceptación de Miguel con
  su control: no se pudo dar porque el juego escuchaba al volante USB en vez del mando (arreglado en `b89e3eb`).
