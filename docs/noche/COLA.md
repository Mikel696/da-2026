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

## Estados
`[ ]` pendiente · `[r]` hecha de noche, espera revisión (rama, commit, verificación) ·
`[x]` revisada y publicada (la marca el Integrador) · `[-]` descartada (con la razón)

## Tareas

- [ ] **19-JUE · 1 · Sala de juegos.** Rama `claude/juegos` (ya existe: trabajar sobre ella). Leer primero
  `docs/sesiones/2026-10-23-juegos.md` (investigación, licencias y plan). Terminar el núcleo compartido
  (`frontend/juegos/js/`) y la sala `frontend/juegos.html`: 3 tarjetas (carreras, shooter, arcade; las tres
  «próximamente» por ahora), detector de control, probador de botones, tabla de controles y créditos con la
  licencia de cada base. Sin juegos todavía.
  *Verificación:* `node --check` a cada `.js` de `frontend/juegos/`; cada ruta del `importmap` y cada
  `import` relativo apunta a un archivo que existe; ningún archivo de terceros sin licencia MIT o Unlicense anotada.

- [ ] **19-JUE · 2 · Juego 1 (carreras), parte A.** Rama `claude/juegos`. Juego **original**: no recrea ningún
  juego existente ni usa sus nombres, naves, pistas o marcas. Diseño tomado de `pmndrs/racing-game` (MIT),
  reescrito en vanilla con three.js vendorizado. Todos los modelos, texturas y sonidos generados en código.
  Parte A: una pista generada en código, un vehículo, control con teclado y mando (Gamepad API, vibración si
  existe), cámara de persecución, selector de calidad. Presupuesto de render: ≤ 300 llamadas de dibujo,
  ≤ 2 pases de posproceso, DPR acotado. La tarjeta de carreras en la sala abre el juego.
  *Verificación:* la misma de la tarea 1, más un comentario al inicio del archivo del juego con su licencia y su base.

- [ ] **19-JUE · 3 · Juego 1 (carreras), parte B.** Rama `claude/juegos`. Vueltas, cronómetro, récord local
  (`localStorage`, clave con prefijo `jue_`), sonido sintetizado con Web Audio y menú de pausa navegable con
  el mando. *Verificación:* la de la tarea 2.

## Hecho
(vacío)
