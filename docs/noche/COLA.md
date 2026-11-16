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

- [x] **3-ENG · 4 · El corrector deja pasar «He don't speak English».** Rama nueva `claude/noche-AAAAMMDD`.
  Hallazgo del 5-nov (CEREBRO_STATE, entrada «8 errores de vocabulario»): el analizador de frases (`ANL`, en
  `src/english-engine/08_app.js`; ubícalo con `grep -n "ANL" src/english-engine/08_app.js`) marca bien «He
  doesn't speaks» y «Where she lives?» pero da luz verde a «He don't speak English.» y «She don't live in
  Bogotá.». Falta la regla de concordancia sujeto–auxiliar: he/she/it y un sustantivo singular van con
  *doesn't / does*; I/you/we/they con *don't / do*. Mismo tono y formato que las reglas vecinas. Lee antes
  `src/english-engine/README.md` (sus tres trampas). Edita **solo las piezas** de `src/english-engine/` y corre
  `bash src/english-engine/build.sh`; nunca edites el HTML construido a mano. *Verificación:* el build termina
  sin error; `git diff --stat` muestra solo `08_app.js` y `frontend/pages/english-engine.html`; en la nota deja
  las 4 frases de prueba (2 que ahora deben marcarse y «He doesn't speak English.» / «They don't live here.» que
  deben seguir en verde) para que el Integrador las pruebe en el navegador y corra las 8 auditorías.
  > Rama `claude/noche-20261113` · commit `b392c3e` · Nueva regla R2b en `08_app.js` (he/she/it + don't y I/you/we/they + doesn't se marcan en rojo; solo pronombres, no sustantivos singulares) y HTML reconstruido con build.sh.
  > Verificación: navegador sin interfaz sobre el HTML construido: «He don't speak English.» y «She don't live in Bogotá.» dan 1 rojo; «He doesn't speak English.» y «They don't live here.» dan 0. Falsos positivos [0,0,0,0]; auditorías LAB/MORFO/CLUB/GL/SONG/BUSCA/EXPR en verde; sin errores de consola. Falta probar en producción tras fusionar.
  > **Integrador 15-nov:** build reproducible (mismo SHA-256). En el preview, la regla marcaba en rojo inglés correcto:
  > «Take it, don't wait.» y «I said it, don't worry.» (recorría las palabras sin la coma). Corregido antes de fusionar
  > (`7ecc659`): recorre los tokens con puntuación, añade las preguntas («Do he work?», «Where does they live?») y
  > 14 casos a `ANL.CASOS`. En `main` (`436962e` + `7ecc659`) y **verificado en producción**: las 4 frases y las 3
  > vecinas (excepto «My brother don't like it.», que sigue en verde: los sustantivos quedan fuera a propósito),
  > `ANL.probar()` 80/80, falsos positivos 0/0/0/0, las 8 auditorías en verde, 11 pestañas visibles, 0 errores de
  > consola y la caja «Escribir» muestra R2b con la luz roja.
  > Después, `contraparte` encontró otro: «What I told you doesn't matter.» y «People who saw it don't believe it.»
  > en rojo («you» e «it» de objeto). Corregido el mismo día (esos dos solo cuentan al abrir la frase o tras coma o
  > conjunción), 4 casos más (84) y vuelto a verificar en producción.

- [r] **3-ENG · 5 · «English» y «Spanish» no están en el vocabulario.** Rama nueva `claude/noche-AAAAMMDD`.
  Hallazgo del 5-nov (CEREBRO_STATE, entrada «8 errores de vocabulario»): en «He doesn't speak English.» el
  corrector añade «No puedo verificar: english». El 15-nov se comprobó que tampoco está «Spanish»:
  `grep -i "^english|\|^spanish|" src/english-engine/_W*.txt` no devuelve nada. Lee antes
  `src/english-engine/README.md` (formato y trampas).
  Añade **dos líneas al final de `src/english-engine/_W2m.txt`**, una por palabra, con el formato
  `inglés|español|categoría|uso|ejemplo EN|ejemplo ES`, categoría `sust` y la palabra con mayúscula, como `Monday`
  en `_W.txt`. **Solo al final de ese archivo:** los favoritos de Miguel (`eng_fav_w`) se guardan por número de
  palabra, y una línea metida en medio cambiaría a qué palabra apunta cada favorito de detrás. Después, desde
  `src/english-engine/` (el script lee `_W.txt` de la carpeta actual): `node revisa.js _W2*.txt`, **sin** `--limpia`;
  luego `bash src/english-engine/build.sh` desde la raíz. Nunca edites el HTML construido a mano.
  *Verificación:* `revisa.js` da 0 problemas y pasa de 4230 a 4232; el build dice **4233 palabras** (hoy 4231);
  `git diff --stat` muestra solo `_W2m.txt` y `frontend/pages/english-engine.html`; `git diff src/english-engine/_W2m.txt`
  son 2 líneas añadidas al final y ninguna cambiada. En la nota, la frase de prueba para el Integrador: «He doesn't
  speak English.» ya no debe decir «No puedo verificar».
  > Rama `claude/noche-20261116` · commit `5a32284` · Añadidas «English» y «Spanish» al final de `_W2m.txt` (2 líneas, ninguna cambiada).
  > Verificación: `revisa.js` 0 problemas y 4232 palabras; build dice 4233 palabras; `git diff --stat` solo `_W2m.txt` y `english-engine.html` (+2 cada uno). No se probó la frase en navegador: falta que el Integrador la compruebe.

## Hecho
- 9-nov-2026 · Tareas 1, 2 y 3 de 19-JUE están en `main` (fusionadas el 5-nov). Falta la aceptación de Miguel con
  su control: no se pudo dar porque el juego escuchaba al volante USB en vez del mando (arreglado en `b89e3eb`).
