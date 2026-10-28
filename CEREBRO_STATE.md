# ESTADO DEL CEREBRO DA-2026

- **Última actualización:** 2026-10-28 (14-WORK fuera del repo público y repo nuevo sin historial: Fase A del plan privado)
- **Estado global:** 🟢 PRODUCCIÓN — Todos los módulos críticos online en GitHub Pages
- **Live URL:** https://mikel696.github.io/da-2026/frontend/
- **Modo de trabajo:** 🛠 Mantenimiento continuo — ver `MANDATO DE INGENIERÍA` en CLAUDE.md
  y `PROMPT_MANTENIMIENTO.md` para arrancar sesión.
- **📍 El plan vive en `frontend/data/plan-cerebro.json`** — no en este archivo, no en un `.md`.
  Se lee desde 13-NOT (pestaña 🗺️ Plan) y desde 8-PRO (pestaña 🚀 Plan, un prompt listo por tarea).
  Cuando termines una tarea, cambiá su `estado` ahí: las dos vistas se actualizan solas.

---

## 🔒 14-WORK · Fase A, paso 1: el material del trabajo sale del repo público — miércoles 28-oct

**Por qué:** el repo es público y tenía material interno del empleador y de clientes (riesgo de
confidencialidad, no de datos: nada de Miguel se borró). Decisión y criterios en el plan privado
`E:\CLAUDE\PROYECTOS\PLAN-14-WORK.md`.

- **Retirado del árbol:** las 6 páginas `pages/simetrik-*.html`, `data/simetrik-kb.json`, los 6 `PROMPT_14-WORK*.md`,
  `SIMETRIK_KNOWLEDGE_BASE.md` e `interview-sim.html` (traía el recorrido de una prueba técnica con sus datos).
- **14-WORK queda como cascarón:** `work.html` + `js/work.js` (solo `WorkNB`, el editor de cuadernos, y `WorkShell`,
  que cuenta los registros privados sin tocarlos). Todas las claves `work_*` siguen en SYNC_REGISTRY.
- **Redactado:** nombres de clientes en CLAUDE.md, prompts, `cloud-sync.js` (solo comentarios), `module-prompts.js`,
  `nb-engine.js` e informes del guardián. De este archivo y de `PROMPT_RUNS.md` salieron las 30 entradas y las
  38 ejecuciones de 14-WORK.
- **Copia privada** de todo lo retirado: `E:\CLAUDE\PROYECTOS\14-WORK-archivo-privado\2026-10-28\` (tamaños
  verificados archivo por archivo contra el commit `36e3f47`). El texto completo sigue en el historial privado.
- **Cache-bust:** `cloud-sync.js` p21 → **p22** en las **28** páginas (eran 29: `interview-sim.html` salió).
- **Verificado en preview y en producción** (con la sesión real de Miguel, sin escribir datos): el cuaderno se crea,
  guarda y recarga; enlaces internos OK en 33 páginas; las 8 URLs retiradas dan 404; login y sync (outbox 0) en
  14-WORK, 10-SYS, inglés y English Engine.

## 🔒 14-WORK · Fase A, paso 2: el historial queda enterrado sin reescribirlo — miércoles 28-oct

- **El repo viejo pasó a `Mikel696/da-2026-historial`, PRIVADO**, con sus Actions apagadas. Ahí está el historial
  completo (nada se destruyó). Su `main` quedó en `6a58631`.
- **`Mikel696/da-2026` es un repo NUEVO** (mismo nombre → misma URL, mismo origen: localStorage, Supabase y enlaces
  siguen igual, comprobado abajo). Arrancó con un solo commit sin padres, `eec95e3`, árbol idéntico al de `6a58631`.
  En un clon nuevo: solo commits de hoy encima de esa raíz, `git log --all -i -G` con los nombres de clientes = 0,
  raíz vieja ausente.
- **Incidente del mismo día (sitio caído ~40 min, 15:40–16:20 UTC):** el primer repo nuevo (creado 15:42 UTC) quedó
  con Actions bloqueado **del lado de GitHub** después de la primera subida ("GitHub Actions is not currently
  enabled" con la política en "Allow all"; re-guardar no sirvió; el modo rama + `.nojekyll` tampoco publicó porque
  también necesita Actions). Miguel lo borró y se recreó (id 1437332105, 16:17 UTC): esta vez Pages en
  "GitHub Actions" **antes** de subir y **solo `main`**. Actions registró los flujos y el despliegue salió verde.
  Lección: en un repo nuevo, configurar Pages primero y subir de a una rama, mirando Actions entre cada subida.
- **`claude/juegos-wip` preparada pero NO subida:** está en local como `publico-juegos-wip` (`11e6bc5`, 28 archivos
  idénticos al original). En el primer intento se subió junto con `main` y no se sabe cuál de las dos disparó el
  bloqueo; se sube cuando la foto de 12-FIN haya corrido sola al menos una vez. `claude/sweet-swanson` (abril) se
  quedó solo en el historial.
- **Pendiente:** secretos de Socrata en el repo nuevo (Miguel: son llaves) · que la foto de 12-FIN corra sola mañana ·
  guardián con 0 nombres 7 noches seguidas · subir `claude/juegos-wip`.
- **Clon local reconectado:** `origin` = repo nuevo, remoto `historial` = el privado; `main` sigue a `origin/main`;
  la rama vieja queda como `main-historial-20261028`. Las otras ramas locales `claude/*` son del historial viejo.
- **Candado `pre-push`** en `.git/hooks/` del clon (con permiso de Miguel): rechaza subir al repo público cualquier
  rama que descienda de la raíz vieja `c0344e2` (sin importar mayúsculas ni formato de la URL; probado con 4
  variantes). Para retomar trabajo de una rama vieja: rama nueva desde `origin/main` + cherry-pick o parche.
- **Producción verificada en el repo recreado** (sesión real de Miguel, solo lectura): index, 10-SYS, inglés, English
  Engine, finanzas y `macro-co.json` dan 200; las 8 URLs retiradas y el sitio de `da-2026-historial` dan 404; login y
  sync completos con outbox 0 en 14-WORK (15 cuadernos), 10-SYS e inglés.
- **Sin copias públicas conocidas** del material viejo: Wayback Machine sin capturas de `mikel696.github.io/da-2026/`,
  Software Heritage nunca archivó el repo (28-oct).
- **Guardián nocturno:** cuenta los nombres de clientes en árbol e historial **sin escribirlos** en el informe.

---

## 🧰 Estabilización de los 4 proyectos — miércoles 28-oct

Pedido: "solucionar los errores que hemos encontrado y estabilizar los 4 proyectos". Inventario hecho desde los
`ESTADO.md` de `E:\CLAUDE\PROYECTOS`, los informes del guardián (`docs/nocturno/`) y los lotes de QA de inglés.
- **3-ENG · 10 errores de vocabulario del QA nocturno corregidos** (`858dec1`): `_W.txt` líneas 271, 426, 434,
  438, 634, 651, 719, 763, 844, 874 (solo uso o ejemplos; el índice de cada palabra no cambia, el progreso no se
  toca). Build reproducible: el HTML cambió solo esas 10 líneas. **8/8 auditorías en verde en producción.**
  Las ~40 "dudas" de los lotes siguen abiertas: son de criterio, no se tocan sin revisión.
- **4-INGRESOS · el 30-oct de NubeSDK no tiene fuente:** la guía oficial de re-homologación dice que el script viejo
  y el nuevo conviven hasta coordinar el retiro. `nuvemshop.dev` no resuelve desde la nube: se lee desde el PC.
- **🚫 NO fusionar `origin/claude/guardian-20261027`.** Está superada: bajaría `mindmap.html` a `nb-shared.js?v=p22`
  cuando main va en p24 (deriva de versiones = causa del clobber del 15-jul). **Borrada el 28-oct con permiso de
  Miguel**; su commit era `20a85b89936f560deca901dd792f7310d66d7399` por si hubiera que recuperarla.
- **Sigue pendiente de Miguel:** pulsar "🗜️ Optimizar imágenes" (14-WORK, 10-SYS, 13-NOT) · decidir qué hacer con
  14-WORK en el repo público (el guardián cuenta 265 menciones del cliente en 24 archivos; regla global: nada
  confidencial de terceros en repos públicos) · aprobar la decisión F0 de 2-INGLES · las 5 preguntas de 4-INGRESOS.

---

## 🛡 CLOUD · P0 cerrado: con el disco lleno el cambio ya no se pierde — martes 27-oct

Pedido (sesión del 25-oct, retomada): los 3 defectos del incidente de cuota. Commits `5f569a5` y `a5961b4` en main.
- **Roto a propósito antes de tocar nada** (producción, p20, navegador integrado sin sesión, Supabase simulado):
  disco lleno con relleno → escribir `sys_notebook` → `QuotaExceededError`, **cero subidas**, disco con la copia
  vieja. El cambio solo vivía en el DOM.
- **`cloud-sync.js` p21:** lo que no cabe queda en memoria (`_unsaved`, key → valor + sello) y el `getItem`
  envuelto lo devuelve, así que módulos, outbox, `pushNow`, flushes, reconcile y `optimizeImages` ven la versión
  nueva y **nunca suben la copia vieja del disco**. Se sube con el debounce normal. **El TS de disco no se sella**
  mientras el disco tenga la copia vieja: el sello va a memoria y muere con la pestaña (sellar en disco haría que,
  al recargar, la copia vieja pareciera más nueva que la nube). outbox, `_cloud_ts` y la hidratación ya no revientan
  por cuota. `CLOUD.storageReport()` = uso real del disco + top keys + keys solo en memoria.
- **Aviso nuevo** (`NBShared.quotaAlert`, en 10-SYS, 13-NOT y 14-WORK): total real del origen, las 5 keys más
  pesadas con dónde se aligeran, si el cambio subió a la nube o solo vive en la pestaña, y oferta de optimizar las
  imágenes de ese cuaderno (solo corre si Miguel acepta). Un aviso por minuto (el autosave reintenta cada segundo).
- **Botón 🗜️ Optimizar imágenes** también en 10-SYS (pestaña 📓 Cuaderno, abarca los cuadernos de cada materia) y
  13-NOT; los tres usan `NBShared.optimizeImagesUI`. **No se corrió por Miguel**: sigue pendiente que él lo pulse
  (14-WORK libera ~1,5 MB según la medición del 25-oct).
- **Versiones:** cloud-sync p21 en las 29 páginas, nb-shared **p24** en 4 (mindmap lo cargaba sin versión),
  systems_logic p32, notes-nb p22, work p33.
- **Verificado en producción** (misma pestaña de prueba): error relanzado ✔ · `getItem` = versión nueva ✔ · disco
  con la vieja ✔ · subida con la nueva tras el debounce ✔ · `_cloud_ts` intacto ✔ · `pushNow` sube la nueva ✔ ·
  aviso real vía `NB.newPage` con oferta de optimizar ✔ · con "No" no toca nada ✔ · botones en 10-SYS, 13-NOT y
  14-WORK ✔. Banco de pruebas en Node con cuota simulada: 24/24.
- **Lección:** el navegador integrado admite **51 200 KB** por sitio; el Chrome de Miguel se llenó en ~5 120. El
  primer aviso decía "de ~5.120 KB" → cifra falsa en otro navegador. Corregido: el límite no se afirma.
- **Límite que queda:** sin sesión y con el disco lleno, el cambio solo vive en la pestaña (el aviso lo dice). Y el
  flush de cierre usa `fetch keepalive` (tope de 64 KB del navegador): un cuaderno grande depende del flush al
  ocultar la pestaña, no del de cierre.

---

## 🧭 10-SYS · Paso a paso en ventana emergente + "Ponte al día" — martes 27-oct (21:15-22:30)

Pedido: "dame el paso a paso correcto en cada materia para ponerme al día (registro en AWS, todo lo rojo de inglés),
en orden de prioridad, con ventana emergente, enlaces directos y bien explicado".
- **Materias → "Ponte al día, en este orden"**: lo pendiente del período con fecha ≤ 14 días, agrupado en Vencido /
  Esta semana / La semana siguiente, numerado. Cada fila y cada entrega pendiente del cronograma tiene "Paso a paso".
  En el Dashboard, las actividades del parte con `crono` también.
- **Ventana** (`SYS.openStep(materia, entrada)`, reusa `#taskGuideOverlay`): pasos numerados en ruta, botón directo
  dentro del paso, enlaces directos, fuente, "Tu meta" cuando el parte fija otra fecha, y "Ya lo hice".
- **Contenido** (`GUIDES` en `systems_logic.js`, público: sin credenciales ni notas): Reglas de participación de
  inglés y de Nube (dos formularios distintos, leídos sin enviar), AWS Academy (correo del profe del 15-oct), Dexway
  U1-U4 y examen (pantalla de Dexway revisada hoy), parciales, evaluaciones docentes, ACA y TI. Lo que no tiene guía
  dice "pídemelo en el chat" en vez de inventar. Nueva entrega `nub5_aws`; el ítem `s4_nub_aws` del parte apunta a ella.
- **CDigital verificado hoy (sesión de Miguel):** los 3 Parcial 2 sin intentos; Evaluación Docente 3 hecha en BI y
  pendiente en Nube y Auditoría; Dexway en cero (U1, lección 1 "no iniciada"). Coincide con el parte: no se cambió nada.
- **Trampa de despliegue:** si la página se recarga mientras GitHub Pages aún publica, el navegador guarda la versión
  vieja con el `?v=` nuevo durante 10 min. Comprobar con `fetch(..., {cache:'no-store'})` que el archivo nuevo ya está
  antes de recargar; si se cacheó, subir otra vez el `?v=` (pasó de p32 a p35 por eso).

---

## 📡 10-SYS · Inglés desde hoy y los 4 proyectos reactivados — martes 27-oct (19:50-21:10)

Pedido: diagnóstico del PC, "activa los 4 subproyectos, ¿por qué no están trabajando?" y actualizar 10-SYS para
empezar inglés hoy.
- **Por qué "no trabajaban":** las 4 rutinas nocturnas en la nube sí corrían cada noche desde el 23-oct (todas
  `SUCCEEDED`). Tres fallas reales: (1) 2-INGLES y 4-INGRESOS tenían la decisión y el plan solo en el PC (4 y 1
  commits sin subir) → la nube trabajaba sin plan; (2) el preparador de 3-SISTEMAS terminaba en 14 s: sin
  evaluaciones ni material en su repo; (3) lo que producen queda en GitHub y Miguel no tenía dónde verlo.
  **Arreglado:** push de los dos repos, tabla de evaluaciones + material oficial de Temas 4-5 + 3 tareas para la
  noche en 3-SISTEMAS, corrida manual **verificada** (guía + simulacro del Parcial 2 de Nube en 46 s, con fuentes
  por sección) y enlaces "Lo que trabajaron de noche" en `E:\CLAUDE\PROYECTOS\INICIO.html`.
- **10-SYS:** parte `26V05-S5` replanificado con inglés desde hoy (2 lecciones/día: U1 jue 29 · U2 sáb 31 · U3 mar 3
  · U4 jue 5 · examen sáb 7-nov, cierre real vie 13), ruta y días 27-oct → 1-nov, consejos nuevos y las guías de
  los Parcial 2 enlazadas. Verificado en Supabase. **Sin verificar:** marcas contra CDigital y avance real de
  Dexway (la sesión de CDigital estaba cerrada tras reiniciar el PC; no se ingresan credenciales).
- **Guardián:** su rama `claude/guardian-20261027` (mindmap `?v=p22`) queda superada por la sesión del arreglo de
  cuota, que sube `nb-shared.js` a p23 en todas las páginas, mindmap incluida → no fusionarla.

---

## 📡 10-SYS · Parte S5 y el cuaderno que no guardaba — domingo 25-oct (22:07-22:50)

Pedido: "actualiza todo el módulo, qué pasó esta semana en las clases, qué debo entregar de inmediato".
- **CDigital (navegador de la app):** Quiz 2 de las tres materias y ED2 ✔; Parcial 1 de TI presentado. Las notas
  van solo a Supabase (`SYS.setNota`), no a este repo público. **Error mío corregido:** di el Parcial 1 de TI por no
  presentado porque `completionstate` marcaba ✘; el libro de notas y el intento finalizado decían lo contrario.
  **Regla: un quiz se verifica por intento o nota, nunca por `completionstate`** (añadida al PROMPT de la semana).
- Nada cierra esta noche. Parcial 2 ×3 abre lun 26 00:00 y cierra dom 1-nov 23:59. ED3 abiertas (abren el ACA de BI
  y Nube). ACA de Nube = Laboratorio 12 de AWS Academy + video. ACA de Auditoría 2-8 nov (individual, video, rúbrica).
- **Grabaciones leídas:** TI 21, BI 21, AUD 22, Nube 22 (esta vez con acceso), inglés 20. TI: archivo "P1" por venir.
- **Parte 26V05-S5** inyectado en el Chrome de Miguel (extensión reconectada): 18 actividades, ruta de 11 pasos,
  plan lun 26 → dom 1, 5 clases, consejos. `setCrono` (ED2/Quiz 2 ×3, `tiv_3`) y `setNota` de lo verificado.
  Nube 22:46: `sys_week_live`, `sys_week_state`, `sys_subjects_custom`; outbox 0.
- **🚨 P0 · cuota de localStorage llena (5 119 KB de ~5 120).** Miguel pegó imágenes en el cuaderno de Auditoría y
  saltó "Almacenamiento local lleno (≈ 854 KB) · 0 imágenes ≈ 0 MB". Medido por key: `work_nb_data` 2 106 KB
  (25 `data-preview` = 1 557 KB), `sys_notebook` 846, `sys_notebook_bak_2026-07-15154518` 705, un adjunto en
  `sys_subj_files_subj_1779842340935` 484, `not_nb_data` 451.
  - **Rescate:** el respaldo del 15-jul se movió a IndexedDB `da2026_nb/nb_history` (seq 1, comparado idéntico antes
    de quitarlo de localStorage) → 4,3 MB. La página "Soportes" de Auditoría se guardó (03:44Z, 3 imágenes) y llegó
    a Supabase.
  - **Causa raíz en el código (corregida el 27-oct, ver entrada CLOUD arriba):** el proxy `localStorage.setItem` de `cloud-sync.js` llama a
    `_origSetItem` primero; si la cuota revienta, lanza y **tampoco sube a la nube** → el cambio solo vive en el DOM.
    Y la alerta de `systems_logic.js`/`notes-nb.js` mide `p.images[].data` (vacío desde los chips) → dice "0 MB".
  - **Pendiente de Miguel:** botón "🗜️ Optimizar imágenes" de 14-WORK (libera ~1,5 MB; el clasificador no me dejó
    correrlo por él). **Pendiente de código:** subir a la nube aunque falle la escritura local + alerta que nombre las
    keys pesadas + botón de optimizar también en 10-SYS.

---

## 🧭 Plan Maestro 2026 · jueves 22-oct

Pedido: plan completo para exprimir el plan de Claude en el Cerebro, el inglés, el semestre y un ingreso
pasivo que **no** sea vender servicios. Documento vivo (privado, en Claude Docs):
https://claude.ai/artifact/DwUab2n6sHXSnmGKkNNCsw — 6 pestañas, cada proyecto cierra con su paso a paso.

- **Plan Pro** (leído de la cuenta): 20% del cupo semanal usado a 1 día del reinicio. Max no se justifica
  hoy; criterios para pasarse fijados en el documento.
- **Medido:** `CLAUDE.md` 477 líneas (la guía oficial pide <200); 63% son protocolos de un solo módulo →
  candidatos a `.claude/rules/` con `paths`.
- **Pendiente de decisión de Miguel:** retirar 14-WORK del sitio público · apuesta de ingresos
  (calculadoras de nómina, prueba en dic-ene, corte 15-feb-2027) · cerrar Proyecto Salida · triage de módulos.
- Pasado por `analisis-profundo` y `contraparte` (8 hallazgos corregidos antes de escribir).
- Nada de código tocado en esta sesión.

---

## 📡 10-SYS · Revisión completa del martes 20-oct (21:36-22:10)

Pedido: "la carpeta de Trabajo de Investigación no tiene ningún archivo, actualiza Dashboard revisando lo que he
marcado y las prioridades a hoy: Gmail, Drive, CDigital, de todo".
- **CDigital:** Auditoría ED2 ✔ (verificado "Usted ya ha finalizado"). **BI y Nube ED2 sin enviar** aunque
  Miguel las marcó el domingo → desmarcadas en `sys_week_state` y en el cronograma (`bi5_5`, `nub5_5`), con
  aviso P0. TI Quiz 1 = 5.0; TI Parcial 1 pendiente (cierra mié 21, el profe lo quiere antes de las 6:15 p. m.).
  Sin mensajes nuevos de docentes.
- **Dexway:** sigue en cero ("Lección no iniciada"). Asesoría del lun 19 leída: el grupo va en la U3, todo cierra el
  13-nov a las 11:55 p. m., examen final de un intento con cámara, cédula y sin audífonos.
- **Correo:** solo la invitación a la asesoría de inglés y correos masivos (grados, Bienestar). **Drive:** nada nuevo.
- **Parte S4** reescrito: plan de mar 20 a dom 25, 3 ítems nuevos de inglés (U3, U4, examen final), la asesoría como
  clase leída, consejos y ruta al día.
- **Carpetas:** `04 Guias de estudio` con 7 guías HTML (TI Parcial 1, Dexway chuleta + plan hasta el 13-nov, Quiz 2 de
  BI/Nube/Auditoría); "Enlaces oficiales del aula (TI)" en `01 Material oficial`; "Lo urgente ahora" del LEEME de TI
  al día. Pendiente de permiso: descargar el PDF "Clases ... P0" (954 KB, CDigital) y `APA_CUN.pdf` (349 KB, CDN CUN).

---

## 📡 10-SYS · Semana en vivo: Claude asume el semestre — 2026-10-18

### El encargo
Miguel: ver todas las clases de la semana, clasificar las actividades por importancia, darle un parte
compacto **en el Dashboard**, interactivo, que se actualice cada semana, y poder delegarle trabajo
("tú eres el comandante"). También pidió que Claude presente quizzes y parciales: **no** — es suplantación
en una evaluación. Quedó como regla del módulo: Claude prepara (guía + simulacro propio) y Miguel presenta;
los entregables (ACA) se hacen juntos y los entrega él.

### Lo que se construyó
- `systems_logic.js` → `renderWeekLive()` + `SYS.injectWeek()`, `setWeekItem()`, `wlSet/wlToggle/wlDelegate`.
  Tarjeta en el Dashboard con 4 vistas (🎯 Prioridades P0-P3 con cuenta regresiva viva · 🎥 Clases con citas
  y minuto · 🤖 Centro de mando por modo tú/te preparo/juntos/Claude · ⏭ Próxima semana), filtros por materia
  y "solo pendientes", y botón que copia el encargo listo para pegarle a Claude.
- **Datos fuera del repo:** `sys_week_live` (el parte, lo escribe Claude) y `sys_week_state` (los checks de
  Miguel), separados para que un parte nuevo nunca pise un check. Registradas en `SYNC_REGISTRY`;
  `cloud-sync.js` p19→p20 en las 29 páginas. El repo es público y el parte lleva citas de clase y notas.
- `render()` llama a la tarjeta dentro de try/catch: un parte mal formado no tumba el módulo.
- `PROMPT_10-SYS_SEMANA.md`: protocolo semanal (CDigital, correo, grabaciones, esquema, reglas).

### Lo que encontró el parte de la semana 3 (12-18 oct)
- **Los 3 Parcial 1 (BI, Auditoría, Nube) cerraban el domingo 18 a las 23:59 y ninguno estaba presentado**
  a las 21:15. Se le avisó a Miguel en el acto con resúmenes de estudio de cada materia.
- Quiz 1: BI 5.0 · Auditoría 5.0 · Nube 4.75.
- TI: el docente dio instrucciones por **mensaje de CDigital** (no por correo): Evaluación Docente 1 → Quiz 1
  (Temática 2) y Parcial 1 (Temática 3) hasta el 21-oct, con las preguntas en su PDF "Clases ... P0"
  (versión del 15-oct, págs. 11-13) + un formulario de Acuerdo Pedagógico propio.
- Auditoría: docente titular nuevo (Andrés Felipe Correa) desde el 15-oct; ACA individual que explica el 29-oct.
- BI 14-oct: sin grabación; un resumen Read AI de una compañera dice que hubo corte de energía y que el docente
  quitaría 3 preguntas del Parcial 1.
- Nube: grabaciones 8 y 15-oct siguen "sin permiso"; el docente envió credenciales de AWS Academy (no se copian).
- Inglés: Dexway = 92 % (auto 4 % + co 4 %), todo cierra el 13-nov, final vigilado por cámara.

### Trampas encontradas
- **Moodle CUN admite una sola sesión.** Si Miguel entra a CDigital en otra ventana, la de Claude se cierra
  (y al revés). Hay que trabajar en la misma pestaña (arrastrarla al grupo de Claude).
- El índice de cuenta de Google cambió (`u/3` → `u/4`) tras volver a iniciar sesión: usar `?authuser=correo`.
- `mod_quiz_get_quizzes_by_courses` no está habilitado para estudiantes: las fechas salen de `/mod/quiz/view.php`.
- pdf.js dentro de Moodle: RequireJS secuestra el UMD; hay que quitar `window.define` mientras carga.
- **Cuadernos (NB, 3 módulos):** pegar una imagen con el cursor dentro de una lista dejaba "🖼️image.png"
  como texto suelto y la ficha real al final de la página. `execCommand('insertHTML')` descarta el span
  `contenteditable=false` dentro de `<li>`. Ahora la ficha entra por Range y `_migrateInlineImagesToChips`
  borra los restos sueltos al abrir. `nb-shared.js` p21→p22 (systems, notes, work). Reproducido y
  probado en local (lista, párrafo y limpieza); producción sirve p22 con el arreglo.

### Segunda pasada (misma noche, 22:10)
- Miguel presentó los 3 Parcial 1: **5.0 / 5.0 / 5.0** (BI, Auditoría, Nube); cargados con `SYS.setNota` (p1).
  Él mismo los marcó hechos en el Dashboard: el check se usa.
- Parte **26V05-S4** (19-25 oct) con la vista nueva **🧭 Ruta** (17 pasos numerados con cuándo, cuánto, por qué
  y enlaces). Se abre primero; el parte por defecto es el más reciente. Los ids que siguen de S3 se conservan.
- Requisitos verificados en `/course/section.php`: Quiz 2 y Parcial 2 de BI y Nube ← Evaluación Docente 2;
  Quiz 1 de TI ← Evaluación Docente 1; ACA ← Evaluación Docente 3. Auditoría abre por fecha.
- **Dexway en cero** (Unit 1 "Lección no iniciada", todas las unidades vacías) — leído por `mod/lti/launch.php`.
- Recursos de estudio (Guía/Video/Recurso por tema) visibles en cada evaluación; regla en el protocolo.
- Nuevas exigencias de Miguel en `PROMPT_10-SYS_SEMANA.md`: revisar lo hecho en cada aula, ruta de prioridad,
  y TI como caso aparte (instrucciones por mensaje de CDigital, no correo).

### Tercera pasada · Dashboard compacto y conectado (22:40-23:10)
- Miguel: "organiza la página del dashboard, que todo esté actualizado y conectado". La tarjeta de arriba
  repetía un cronograma viejo (Parcial 1 de BI "HOY" ya presentado, 4 "vencidas" falsas).
- Ahora: semana del bloque en una línea · clases en vivo como píldoras · **"Lo siguiente"** = 3 pasos
  pendientes de la ruta, con su enlace y "✓ hecho" · cronograma vencido plegado con "✓ ya está". Barra de
  números = pendientes / P0 / hechas del parte. Accesos en píldoras (portales + aula de cada materia), tarea
  propia plegada, encabezado más bajo. Gmail CUN por `authuser` (el `u/3` ya apuntaba a otra cuenta).
- **Checks conectados** con `crono` (11 ítems de S4) y `SYS.setCrono`: se sincronizó el cronograma con lo
  verificado en CDigital (16 entradas) y `tiv_3` pasó al 21-oct. TI Quiz 1 = 5.0 (verificado).
- `toggleCronoEntry` y `_setCronoSilent` guardan solo el cronograma en el override.
- Quedan 3 vencidas sin verificar: "Reglas de participación" de Nube e inglés (formularios de Google, no se
  ven desde CDigital) y Unidad 1 de Dexway (real: está en cero).
- AWS Academy corregido en el parte: el curso es opcional, pero el ACA de Nube va en su Sandbox (dato del 9-oct
  que el parte del 18 había pasado por alto).

### Cuarta pasada · "no me gustó" (23:20-00:10)
Lo que Miguel reclamó y cómo quedó:
- **"Si algo ya está hecho, quítalo de la lista"** → todo lo hecho se oculta (Hoy, Ruta, Prioridades, Centro de
  mando); botón "👁 ver hechas (N)".
- **"Dime qué tengo que dejar hoy y para qué"** → tarjeta **Tu día** (`days` en el parte): enfoque del día, tareas
  con "🎯 Para qué", minutos, enlaces y "✓ Hecho"; anillo de avance, tira de 8 días, lo atrasado se arrastra.
- **"No hay nada de inglés"** → Dexway todos los días (4 u. × 5 lecciones leídas en Dexway; U1 lun-mié, U2 sáb-dom).
- **"Leer el PDF… ¿para qué?"** → Claude preparó el material: 5 páginas de cuaderno (guía Parcial 1 TI, chuleta
  Dexway U1-U2, guías Quiz 2 de BI/Nube/Auditoría desde las G4 oficiales), enlazadas con `SYS.openNb`.
- **"Aconséjame"** → `advice` (5 consejos: el riesgo es inglés, qué clase priorizar cuando chocan, quiz el mismo día).
- **"Más diseño"** → íconos por materia con su color, anillo SVG, tira de días, enfoque destacado.
- Revisión completa antes de armarlo: CDigital (5 aulas), correo, `sys_tasks` (solo tareas viejas de 26V02),
  cuadernos (cada materia tiene 2 páginas propias + la de contexto) y Dexway.

### Pendiente
- Dexway: arrancar la Unidad 1 el lunes 19.
- Jueves 22: actualizar la guía del Quiz 2 de Auditoría con lo que el profe vea en clase.
- Encargos 🤖 de la semana: correo pidiendo acceso a grabaciones de Nube; resumen del PDF de Auditoría.

---

## ⚙️ 10-SYS · Recorrido completo de las 5 materias + carpetas del semestre — 2026-10-09

### Qué se revisó
Aulas (inventario de las 5: cada actividad, enlaces resueltos, etiquetas), las **24 guías + 24
presentaciones oficiales** (CDN público `d3my5pcft3hnu9.cloudfront.net/2025/pregrado/{ADES_P|INTNE_V|CC_V}/{PDF|PPT|VIDEOS}/G1..8`),
syllabus de Nube (Drive), Google Calendar CUN (descripciones de los eventos) y **correo CUN** (bienvenidas,
correo del docente de TI del 1-oct, respuesta de Idiomas al ticket del Placement Test, resúmenes Read AI).

### Hallazgos nuevos
- Auditoría: el docente fija el **fin el 15-nov**; esta semana la clase pasó al viernes 9-oct; Meet xwj-puty-htw;
  coordinador Edward Ovalle; el contenido oficial = guía + video + recurso por tema; Tema 8 = proyecto de auditoría.
- Nube: grabaciones en el aula dentro de 24 h (mod/googlemeet 7953245); la del 8-oct aún sin permiso.
- Inglés: Placement Test ($72.000 según correo del 30-sep) o nivelación de unos 2 meses, vía CAMI Ticket; formulario
  de Reglas de participación.
- TI: correo del 1-oct confirma "NO REALICEN NINGUNA ACTIVIDAD EN LA PLATAFORMA"; el archivo sigue en P0.

### Entregables
- `E:\Ing de Sistemas CUN\Semestre 9\` → `00 - EMPIEZA AQUI - Semestre 9.html` + una carpeta por materia con
  `LEEME - <materia>.html` (ficha, urgente, metodología, calendario, temario con enlaces, clases vistas, recursos y
  cursos externos, ojo) y subcarpetas `01 Material oficial del curso` (guías y presentaciones en PDF en las 3 DIS),
  `02 Mis apuntes`, `03 Mis entregas`. La carpeta "NotebookLM" de Miguel en Auditoría no se tocó.
  Generador en el scratchpad de la sesión (`materias.js` + `gen.js`): los datos viven en un solo objeto.
- Cuadernos: la página "📌" de cada materia pasó a "Contexto completo + ponerme al día (act. 9-oct)". Se
  sincronizó (uid presente, outbox 0).
- `SUBJECTS`: enlaces de clase y grabaciones de Auditoría y Nube, fin de Auditoría, tarea de Reglas de participación en inglés.

### Trampa encontrada
Chrome bloquea que la página publicada (https) lea `http://localhost` (Local Network Access): el fetch se cuelga
sin error. Para pasar datos grandes a la pestaña real hay que pegarlos en el script, no servirlos en local.

---

## 🔐 3-ENG · Compartir el Engine, y el día que Supabase estuvo «Unhealthy» — 2026-10-08

### El login roto: no era la contraseña

Medido desde fuera: base de datos **522**, auth **504**, tres intentos. En el panel,
`mbuhlxypuvlxxylryjzi` figuraba ACTIVO pero con **STATUS: Unhealthy** — 167 errores/hora en la
puerta de entrada y **0 peticiones llegando a Postgres**. No estaba pausado: estaba enfermo.
**Settings → General → Restart project** y en ~2 min volvió. (El otro proyecto, «sistema familiar»,
sí está en pausa, pero no es el del Cerebro.)

Dos trampas que costaron tiempo:
- Un **401 en `/rest/v1/`** parece señal de vida y no lo es: lo contesta la puerta de entrada, no
  la base. La prueba real es consultar una tabla.
- El panel salía **traducido por Chrome**: «Resume project» → «Proyecto de curriculum»,
  «Checking…» → «De cheques…». Por eso no se entendía qué pulsar.

**Y un fallo propio que lo escondía** (`e6e09e9`): con el servidor caído el `fetch` revienta y
nadie recogía la excepción — la pantalla se quedaba en «Conectando…» 45 s y más. Ahora se recogen
las dos formas de fallar (que no conteste y que reviente) y el mensaje dice que los datos siguen en
el equipo. Medido contra el servidor realmente caído.

### Auditoría de seguridad, por comportamiento

Con la clave anónima del repositorio (que lleva meses en un repo **público**) y sin sesión:

| Prueba | Resultado |
|---|---|
| Leer `app_state`, `sys_tasks`, `user_prefs` | `[]` en las tres — **RLS bloquea la lectura** |
| Insertar | **401 · 42501** «new row violates row-level security policy», en las tres |
| Borrar | 0 filas afectadas |
| Crear cuenta | **Estaba permitido** → apagado *Allow new users to sign up*; ahora **422 `signup_disabled`** |

Veredicto: esa clave no sirve para robar ni romper nada. El único agujero era el registro abierto,
cerrado y verificado desde fuera.

### Compartir el Engine (`0652f50`)

Decidido con `analisis-profundo`: no se comparte el Cerebro (lleva finanzas, trabajo y
universidad), se comparte **una copia del Engine, sola y sin nube**:

    INVITADOS=1 bash src/english-engine/build.sh ../compartir-engine/index.html

Sustituye `09_sync.js` por `09_sync_invitados.js` (misma superficie, sin conexión) y el build
**falla** si en la copia aparece `supabase.co`, `signInWithPassword` o `SUPA_ANON`. Comprobado:
11 pestañas, auditorías en verde, y las únicas peticiones a internet son las tipografías.
Publicación y puerta (Cloudflare Pages + Access, gratis hasta 50 personas): `COMPARTIR_ENGINE.md`.

**Dato que cambió el planteamiento:** el repositorio `da-2026` es **público y clonable sin
cuenta**. «Que no me roben la app» hoy no existe como protección; lo que sí se controla es quién
llega a verla.

### Pendiente

- Sin **copias de seguridad** en Supabase (plan gratuito, «No backups»). El Cerebro guarda local
  primero, pero la copia debería ser a propósito, no por suerte.
- Decidir si `da-2026` deja de ser público (obliga a mover el hospedaje: Pages privado es de pago,
  Cloudflare Pages es gratis).

---

## ⚙️ 10-SYS · Ponerme al día con las clases grabadas (26V05, semanas 1-2) — 2026-10-08

### Qué se hizo
- Se leyeron las **grabaciones de Meet** de: Inglés (30-sep inducción, 5-oct tutoría), Inteligencia de
  Negocios (30-sep presentación, 7-oct "importancia de los datos"), Computación en la Nube (1-oct) y
  Trabajo de Investigación (7-oct) + el archivo del docente "Clases ... P0" (PDF, extraído con pdf.js).
- **Auditoría 1-oct: sin acceso** ("no tienes permiso"); Miguel debe pedir acceso desde Calendar.
- Se creó en el cuaderno de cada materia una página **"📌 Ponerme al día"** (qué se vio, reglas del
  docente, urgente, qué hacer). Se inyectó en la pestaña real: 16 → 21 páginas, sin tocar las suyas.
  ⚠️ La sesión de Supabase de ese Chrome estaba cerrada: quedó en `cloud_outbox` hasta que inicie sesión.
- Materias actualizadas en `SUBJECTS` con lo dicho en clase: Auditoría y Nube son **jueves 6:15-7:45**,
  tutoría de Nube **viernes 6:15-7:15**, inglés **lunes tutoría + mar-vie la misma clase**, correos de
  docentes, enlaces de grabaciones/material. **Trabajo de Investigación es de 8 semanas, no 16**
  (las fechas estimadas del 29-sep estaban mal y se retiraron); regla del docente: no resolver nada en
  la plataforma sin sus instrucciones; notas cierran el 11-nov. `clases[].tipo` ('tutoría') y el
  Dashboard muestra una sola vez las clases repetidas.

### Hallazgo urgente que se le dio a Miguel
Quiz 1 de las 3 DIS cierra el **domingo 11-oct** y estaba bloqueado: le falta la **Evaluación Docente 1**.

### Cómo se sacan las transcripciones (para repetirlo)
- Las clases están en **Google Calendar del correo CUN** (`calendar.google.com/calendar/u/3/`): cada
  evento trae 3 adjuntos (Recording, Chat, Transcript). El **Transcript (Google Doc) da 403**: solo lo ve
  el organizador. El **Recording sí** (salvo Auditoría).
- Desde una pestaña en `drive.google.com`: `fetch('/u/3/get_video_info?docid=ID')` → `ttsurl` → pista
  `es/asr` en `fmt=json3`. Es la transcripción automática completa, sin abrir el panel de Drive.
- Inglés: Moodle `mod/googlemeet/view.php?id=7916129` lista las grabaciones con enlace de Drive.
- Leer cada clase agrupada por minuto (`get_page_text` sobre un `<article>` creado en la página): 50 kB por llamada.

---

## ⚙️ 10-SYS · Período 26V05 registrado + módulo reorientado al semestre real — 2026-09-29

### El encargo
Revisar cómo están compuestas las materias, traer de CDigital las del período nuevo (sin
"INDUCCION TICS - ESTUDIANTES") con la misma forma, y cambiar las secciones que no sirven.

### Las 5 materias nuevas (hardcodeadas en `SUBJECTS`, `period: '26V05'`)
| id | Código · grupo | Docente (Participantes) | CDigital | Horario (Próximos eventos) |
|---|---|---|---|---|
| `inteligencia_negocios` | DIS38 · 55500 | FELIPE ALEXANDER GARZON | 126973 | Mié 6:15-8:30 PM · Meet 7896309 |
| `auditoria_sistemas` | DIS39 · 55506 | ANDRES FELIPE CORREA ESPITIA | 126979 | sin publicar |
| `computacion_nube` | DIS40 · 55516 | MARIO ALEXANDER REALES MARTINEZ | 126989 | sin publicar |
| `trabajo_investigacion` | ISD37 · 55520 (bloque único → 19-ene) | MANUEL ALBERTO SALGADO ALBA | 126584 | sin publicar |
| `english_b1_26v05` | A1I01 · 50610 (26I05, → 23-nov) | ANYI MILENA ALVAREZ COGOLLO | 130590 | L-V 6:15-7:45 PM · Meet 7916129 |

EDWARD ORVEY OVALLE ARIAS figura como Profesor en las 3 DIS (anotado en `desc`, no como docente).
**Fechas:** las del Bloque I salen de la imagen "Calendario académico virtual" del aula 55500
(S1 28-sep … S8 16-22 nov, pesos 10/20/10/20/34/2/2/2). Los quizzes/parciales están ocultos en
CDigital hasta que abren, así que la fecha es el cierre de su semana. Trabajo de Investigación e
Inglés: cronograma **sin fechas** (no publicadas) — hueco visible, no número inventado.
Créditos de las nuevas: **no cargados** (no aparecen en CDigital).

### Lo que cambió en el módulo
- **Período automático:** `detectPeriod()` = período más reciente entre materias "en curso"
  (antes, `'26V02'` fijo). Registrar las materias del próximo período cambia todo solo.
- **Materias:** filtro por defecto "📍 Período actual"; lo viejo en "🗂 Historial".
- **🧮 Notas por materia** (esquema `cun_b8`): acumulado + nota necesaria en lo que falta para
  una meta editable. Se guarda en `sys_subjects_custom[].notas` (ya sincronizada; sin tocar
  `cloud-sync.js`). `SYS.setNota(id, clave, valor)` para cargarlas por script.
- **Dashboard:** semana del bloque + qué vale, próximas clases en vivo con botón Entrar
  (campo nuevo `clases: [{dias, ini, fin}]`), entregas 14 días, aviso de materias sin horario.
- **Cifras del encabezado:** materias en curso · entregas 7 días · semana del bloque · vencidas
  · días al cierre (antes: créditos y % de tareas globales).
- **Calendario:** "todos los períodos 2026" → plan del bloque semana a semana (`BLOCK_PLANS`).
- **Malla:** semestre actual calculado (sale 9); ▶ en curso / ✓ ganada con match estricto.
  Se probó un match difuso contra `academic-history.json` y marcaba "Ingeniería Web" como
  "Lógica para Ingeniería" → descartado.
- **CUN Hub:** prompts sin `academic-8vo.json`/26V02 + prompt 5 "SCAN MATERIAS"; historial
  con fecha de corte (4.49 al 27-mar, 52+6, 8/10); "no hay horarios fijos" → esquema de notas.
- **Limpieza:** fuera `renderSemaphore` (pintaba en `#semaphoreList`, que no existe),
  `STUDY_RESOURCES` y `ACADEMIC_SUBJ_IDS`; selector de Clases Perdidas ahora dinámico.
- **Protección:** `saveSubjectModal` conserva `notas`/`period`/`clases` al editar.

### Segunda pasada (mismo día): fechas para TODAS las entregas
Miguel pidió fechas en cada actividad. Se revisó a fondo: aula por aula, Avisos (vacíos), foros,
evaluaciones docentes, restricciones de cada actividad, Canvas del curso de inglés y el PDF oficial
`calendarios_virtuales_2026_.pdf` (pág. 5, 26V05).
- **Inglés:** "Fechas importantes 26i05" → **cierre de actividades vie 13-nov-2026**. Guía de Inicio
  2026C → nota = 92% Dexway + 4% autoevaluación + 4% coevaluación; examen final con proctoring.
- **Materias DIS:** las evaluaciones NO se abren por fecha sino por requisito (verificado en las
  restricciones): Acuerdo Pedagógico → Eval. docente 1 → Quiz 1 y Parcial 1; Eval. docente 2 → Quiz 2
  y Parcial 2; Eval. docente 3 → ACA Final y Quiz 3; "Evalúa tu Entorno" → Auto/Coevaluación.
  Esos pasos entran al cronograma. Al 29-sep: Acuerdo abierto solo en Auditoría; **falta en
  Inteligencia de Negocios y Nube** (bloquea su Quiz 1).
- **Trabajo de Investigación:** el docente no publicó ninguna fecha → fechas **estimadas** (un tema
  cada 2 semanas en 16 semanas), marcadas `est: true` y pintadas "≈ estimada". Reemplazar cuando
  se publiquen.
- **Calendario:** fechas institucionales del 26V05 (`CALENDAR['26V05'].extra`): retiros hasta 13-oct,
  evaluación a docentes 7–27 nov, cierre de notas B1 23-nov, notas únicas 12–18 ene, etc.
- **Bug de datos corregido:** marcar "Listo" guardaba una copia completa del cronograma que tapaba
  para siempre fechas nuevas del código. `_mergeSubj()` ahora mezcla por id (conserva done, fecha
  editada y entregas propias).
- **Bug corregido:** `todayStr()` usaba UTC → desde las 7 PM de Colombia el módulo vivía en "mañana".

### Pendiente
- Marcar en 10-SYS el estado de English 26V02 / Placement (siguen "pausada").
- Horario y Meet de Auditoría, Nube y Trabajo de Investigación cuando los publiquen.
- Fechas reales de Trabajo de Investigación (hoy estimadas ≈).
- Notas finales del 26V02 (SGA) → prompt 3 del CUN Hub.
- Certificaciones (15 módulos) no se tocó: candidato a recortar si no se usa.

---

## 🎥 3-ENG · El vídeo tutorial completo, y los 7 fallos que salieron grabándolo — 2026-09-16

### El encargo

Miguel pidió un vídeo que explique **cada pestaña, cada herramienta y un ejemplo de uso**, «que deje
explicado el 100 % del funcionamiento de la página».

### El resultado

**`C:\Users\Miguel Barros\Videos\English Engine\English Engine - Guia completa.mp4`** — 49:15,
1920×1080, 254 MB. 14 capítulos navegables (marcas de capítulo dentro del MP4), subtítulos en
español activables, un `.srt` aparte y el índice de capítulos en `… - capitulos.txt`.

| Min | Capítulo | | Min | Capítulo |
|---|---|---|---|---|
| 0:00 | Bienvenida y mapa | | 23:39 | 🧪 Práctica |
| 1:44 | Herramientas de arriba | | 26:16 | 🎮 Club de Frases |
| 5:21 | 🧭 Estructura | | 31:58 | 🎬 Vídeos |
| 12:15 | 🧩 Piezas | | 37:45 | ✍️ Escribir |
| 15:00 | 🔀 Bifurcaciones | | 41:22 | 📓 Cuaderno |
| 17:59 | 📚 Palabras | | 44:58 | 🎯 Método |
| 21:21 | 💬 Frases | | 48:14 | Cómo se conecta todo |

### v2 — 18-sep: lo que Miguel pidió tras verlo

1. **Desfase entre lo que se dice y lo que se ve.** Su ejemplo: en Estructura se hablaba del
   final de la pestaña y la imagen subía al principio. **Causa mecánica:** `resalta()` con
   `sube`/`hasta` desplazaba hasta el CONTENEDOR padre, que empieza arriba de la página. Ahora el
   desplazamiento va al elemento buscado y el recuadro se recorta si no cabe.
2. **Auditoría de encuadre, automática.** El motor apunta en cada frase si lo explicado estaba a
   la vista **al empezar y al terminar** (`linea.json` → `vis0`/`vis1`), y `audita.js` marca lo
   descuadrado. De 19 frases a 4, y las 4 son desplazamientos intencionados que muestran la
   sección mientras se narra. Encontró además que yo narraba un botón de «ocultar filtros» que
   **solo existe en móvil**: en pantalla de ordenador no se veía nada.
3. **Voz nueva:** `es-CO-GonzaloNeural` a +15 %. El vídeo pasó de 49:15 a **40:05** diciendo lo
   mismo.
4. **Música de fondo propia** (`musica.js`): pad, bajo, arpegio con eco y maraca de ruido
   filtrado, 72 pulsos por minuto, en la menor. Sintetizada aquí, sin samples ni librerías — no
   hay nada de nadie. Va 21 dB por debajo y se agacha sola bajo la voz (`sidechaincompress`).
5. **Sin subtítulos:** ni pista dentro del MP4 ni `.srt` al lado (era lo que los encendía solos).
   La transcripción se queda en `caps/_final/transcripcion.srt`.

### Cómo se hizo (y dónde vive la máquina)

No hay persona delante de la pantalla: el vídeo lo graba un script contra **la página publicada**
(`mikel696.github.io`), con un perfil de navegador limpio — sin datos de Miguel, sin cuenta.

| Pieza | Qué hace |
|---|---|
| `motor.js` | Chrome sin ventana a 1536×864 con zoom 1,25 (sale a 1920×1080 con la letra grande). Graba con el *screencast* de Chrome: cada fotograma con su marca de tiempo. Pinta encima un cursor, el resaltado amarillo, el rótulo y las tarjetas de capítulo. |
| `guion1/2/3.js` | Los 14 capítulos: narración + acciones. Cada capítulo va en un navegador nuevo, con su preparación fuera de cámara, para poder regrabar uno solo. |
| `monta.js` | Fotogramas → vídeo a 30 fps; cada voz en el segundo exacto en que empezó; `.srt` por capítulo. |
| `final.js` | Une los capítulos con marcas de capítulo, subtítulos incrustados y un `.srt` aparte. |

- **Voz:** `edge-tts` (voces neuronales de Microsoft): `es-CO-SalomeNeural` para narrar,
  `en-US-AndrewNeural` para lo que en la página suena con 🔊. En caché por texto.
- **Vive fuera del repo**, en `E:\Aplicaciones\ANALISIS DE DATOS\Pagina Web\HTML\video-tutorial-3eng\`
  (`node_modules` y cientos de MB de fotogramas no tienen nada que hacer en GitHub Pages).
  Para regrabar tras un cambio: `node graba.js 09` y `node final.js`.
- **Vídeos:** se usa «Tour of the Moon in 4K» de NASA Goddard (dominio público) y un **texto de
  práctica escrito para el vídeo**, dicho en pantalla. Ni una letra ni un subtítulo de nadie.
- **Hablar (Club):** en el vídeo el micrófono va **simulado y se dice en pantalla**.

### Lo que salió al mirar cada pestaña como alguien nuevo

Grabar obliga a hacer cada cosa de verdad, en orden, y a narrar lo que pasa. Salieron siete fallos
que el uso normal no había destapado:

1. **Hablar no tenía puerta** (`ee1f1ba`). Su botón «Siguiente →» pasaba sin decir nada — el único
   peldaño sin puerta era el último, justo lo contrario de lo pedido el 11-sep. Y sin `terminar()`,
   `avanzar()` leía las banderas del peldaño anterior: «Peldaño 7 de 6». Ahora lo que oye el
   micrófono se puntúa con la puerta del 80 %; sin reconocimiento de voz queda «✓ La dije completa»,
   dicho claramente. Probado con micrófono simulado: bien, mal y sin micrófono.
2. **«She have a car and she like it»** dejaba pasar «she like» (`0bd1a66`). R5/R5b miraban solo el
   PRIMER he/she/it, y un auxiliar en otra oración apagaba la regla. Ahora, una revisión por oración.
3. **«No puedo verificar: years»** (`0bd1a66`) — el filtro de desconocidas no preguntaba a BUSCA.
   Mismo fallo que la ficha de Vídeos (`78022ac`), en otro sitio.
4. **Vídeos contaba «gonna · 2 veces» con una sola** (`e031480`): buscaba por trozo («is» contaba
   «this») y contaba las contracciones por su verbo base («gonna» sumaba «goes»).
5. **Textos que decían cosas falsas** (`0bd1a66`): el Cuaderno decía «No viaja a ningún servidor»
   (sí viaja con ☁️); Piezas mostraba cifras de la lista vieja de 2000 (877 sustantivos, hoy 2098 —
   ahora salen de la lista real); «las 2000 palabras», «ocho pestañas».
6. **Vídeos:** la lista de vídeos, pegajosa, tapaba «Escribe lo que oyes» al bajar.
7. **Cuaderno: la hoja parecía vacía al restaurar o cambiar de cuaderno** (`563aa26`). La
   cabecera fija de `d748fec` tapaba el principio si la página venía bajada; el contador decía
   «50 palabras» y no se veía ninguna. **Probablemente es el «no muestra el contenido completo»
   que Miguel reportó el 11-sep.** No se perdía nada; ahora la vista va al principio de la hoja
   cuando cambia lo que se enseña.

Regresión tras cada uno: 0 falsos positivos en los 4 corpus, auditorías en 0, 11 pestañas, sin
errores. Verificado en producción.

### Notas que faltaban del 11-sep

- `d748fec` — la cinta del cuaderno no se quedaba fija (`overflow:hidden` en `.nb-main` rompía el
  `sticky` y recortaba el contenido) y `mergeOneBook` podía perder texto con relojes desfasados:
  ahora, si dos versiones de una página difieren, se quedan las dos.
- `78022ac` — la ficha de Vídeos decía «no está» de una palabra que el veredicto sí encontraba.

### Trampas del grabador (por si hay que regrabar)

- **Un clic a ciegas en una coordenada** cayó sobre «WordReference» (`target=_blank`): la pestaña
  grabada pasó a segundo plano y Chrome dejó de pintarla — 2 minutos de voz sobre una imagen
  congelada. `motor.js` cierra ahora cualquier pestaña nueva, y los guiones no hacen clics a ciegas.
- **Pantalla quieta = sin fotogramas.** Un «latido» de 2 px en la esquina los mantiene, y un
  vigilante reinicia la captura si se corta. Las animaciones usan `setTimeout`, no
  `requestAnimationFrame` (se queda en cero cuando no se pinta).
- **`content-visibility:auto`** mueve las tarjetas después del scroll: `ve()` vuelve a medir, y
  los clics sobre tarjetas centran el propio botón, no la lista (si no, caen bajo la barra fija).
- **Comprobar cada capítulo** con `hoja.png` (16 fotogramas) y buscando silencios con pocos
  fotogramas por segundo: así salieron las dos congelaciones.

### La lección

**Un tutorial es una auditoría.** Explicar una función obliga a usarla entera y a decir en voz
alta lo que hace; cuando lo que dices y lo que pasa no coinciden, apareció un fallo. Los siete
estaban en funciones «terminadas y verificadas».

---

## 🎨 3-ENG · Rediseño visual: profesional, con tacto, y 3,3× más rápido de recalcular — 2026-09-11 (noche)

Encargo de Miguel: **más profesional, más viva y más rápida, sin romper nada.**
Solo CSS — ni una línea de `08_app.js`, ni un `id`, ni un `data-*`, ni una clase
que el motor conmute. `git diff --stat` lo confirma: los ocho archivos tocados son
hojas de estilo.

### Lo que de verdad costaba (medido, no estimado)

Tres pasadas, mediana, mismo ancho, antes y después en la misma sesión:

| | antes | después |
|---|---|---|
| `DOMContentLoaded` | 227 ms | **204 ms** |
| `load` | 293 ms | **233 ms** |
| Recálculo de estilo ×20 | 580 ms | **172 ms** (−70%) |
| Hojas de estilo externas bloqueantes | 1 | **0** |
| Reglas CSS | 1045 | 1029 |
| Nodos en el DOM | 12 961 | 12 961 |

Los culpables no eran los que decía el encargo:

1. **`will-change:transform` sobre miles de tarjetas.** Le pedía al navegador una
   capa de composición por elemento «por si acaso». Fuera.
2. **`backdrop-filter` en la cabecera y en la barra de filtros**, que son pegajosas:
   el desenfoque se recalculaba en **cada fotograma del scroll**. Fondo sólido.
3. **Dos animaciones en bucle infinito** (el fondo latiendo, la bola de luz de la
   portada). Cuarenta minutos de estudio con una capa compuesta encendida a cambio
   de nada — y encima contradicen el propio encargo: «viva no es animada».
4. **La hoja de Google Fonts**, que bloqueaba el primer pintado: con el wifi
   apagado la página esperaba a que la petición fallara. Ahora los `@font-face` van
   dentro y apuntan al `.woff2`. **Cero terceros en el camino crítico** (P1).

Lo que sí ayuda: `content-visibility:auto` en las 4231 tarjetas de palabra y las
1000 de frase. El nodo **sigue en el DOM** — el motor las encuentra igual.

### 🚨 Lo que el CSS NO puede arreglar · tarea pendiente de JavaScript

**Los 13 000 nodos no bajan con hojas de estilo.** ~9 600 los construye
`08_app.js` al arrancar (`renderWords(true)`, `renderPhrases(true)`, `BF.render()`…
en el `init`), **saltándose las guardas perezosas que el propio código ya tiene**
unas líneas más abajo, en el `onclick` de las pestañas. El objetivo de <6000 nodos
es una tarea de JS.

Y comprobado que **no** compensa: pasar los paneles ocultos de `display:none` a
`content-visibility:hidden` da un 7% y rompe la guarda `offsetParent` de
`CTL.apply`. Un panel en `display:none` ya no cuesta ni maquetación ni pintado.

**Falta una línea de JS para cerrar el móvil:** al cambiar de pestaña la tira no se
desplaza para enseñar la activa (`b.scrollIntoView({inline:"center"})`).

### Lo visible

- **Contraste.** `--t3` estaba en **4,15:1** — por debajo del mínimo, y es el color
  de casi toda la letra pequeña del documento. Ahora 6,3:1. Los tres niveles de
  texto: 19,2 / 9,8 / 6,3. **Nada por debajo de 11px** (había de 9).
- **La barra de once pestañas en móvil.** Se quedaba con los ~230px que sobraban al
  lado de los botones: se veían **dos de once**. Ahora ocupa todo el ancho, con
  anclaje, barra de scroll visible y la siguiente asomando por el borde.
- **Un sistema, no once.** Trece radios sueltos entre 6 y 20px → una escala de
  cinco. Misma tarjeta, mismo borde, misma luz interior y la misma sombra en todo
  el documento.
- **Se nota al tocar.** Una sola regla de `:active` para todo lo que se pulsa, y un
  destello corto **una vez** al acertar. Nada de confeti: se está estudiando.
- **44px de zona de toque**, agrandando el área invisible donde no se puede crecer
  (y **sin** agrandarla donde los vecinos están pegados — ahí crecen de verdad).
- **Borradas 16 reglas muertas**: `.acc`, `.accb`, `.audiobar`, `.pbar`, `.hl` y una
  copia literal de `.sg-mando`. Cero apariciones en el documento construido.
- Dos fallos de paso: `var(--f)` en `31_song.css` no existía (el token ahora sí), y
  el «?» del glosario heredaba `-webkit-text-fill-color:transparent` dentro de un
  titular en degradado.

### Lo que subió y no debía

El archivo pesa **3,4 kB gzip más** (394,6 → 397,9 kB). Sigue por debajo del techo
de 400 kB, pero el encargo decía «no subir». Es el precio de los `@font-face`
inlineados y de las reglas nuevas de móvil y táctil, ya descontando las 16 muertas.
Se puede recuperar recortando comentarios; no se hizo porque el rastro vale más.

### Verificado

Las **diez auditorías** en verde sobre el HTML construido, incluida la larga del
README (los cuatro contadores de falsos positivos a 0). Las once pestañas abiertas
una a una: contenido visible, cero desbordes horizontales a 360px, cero errores en
consola. A mano: Ctrl+K busca y salta, los filtros de banda y categoría responden
(4231 → 200 → 7), «ver más» pasa de 200 a 400, el semáforo de Escribir va de verde
a rojo, el cuaderno escribe/pagina/guarda en `eng_nb`, el reproductor de YouTube
monta el iframe 16:9 con su mando, y los seis modos del Club arrancan.

**Dónde se edita:** `src/english-engine/*.css` + el `<style>` de `01_head.html`, y
`bash src/english-engine/build.sh`. El README de esa carpeta documenta ahora la
capa visual, las tres trampas de rendimiento y los tres intentos de la barra de
pestañas.

---

## 🪜 3-ENG · El Club se vuelve escalera y Vídeos un puesto de trabajo — 2026-09-11 (noche)

### El Club · de seis modos sueltos a una escalera por frase

Antes se elegía modo a mano y se saltaba de frase sin haber acertado. Ahora **cada frase se
sube entera**, siempre en el mismo orden, y no se pasa de peldaño sin pasarlo.

| | Peldaño | Qué entrena |
|---|---|---|
| 1 | 📖 Leer | entiendes lo que dice (entrada, lo más fácil) |
| 2 | 👂 Escuchar | lo reconoces de oído, sin leerlo |
| 3 | 🧩 Armar | colocas las palabras en orden (estructura, con ayuda) |
| 4 | 🎧 Dictado | oyes y rellenas lo que falta |
| 5 | ✍️ Traducir | la escribes entera de memoria |
| 6 | 🎤 Hablar | la dices en voz alta (lo más difícil) |

**El orden no es capricho: va de recibir a producir**, que es como se aprende un idioma. Y la
frase siguiente vuelve a empezar por Leer: cada frase se gana entera, no se arrastra media
aprendida.

**La puerta está en el 80 %.** No llegas → misma frase, mismo peldaño. Pasas → peldaño
siguiente, misma frase. Sexto superado → frase nueva desde Leer.

Los peldaños de delante **ya no son botones, son `<span>`**: no se puede saltar a ellos, y la
interfaz lo dice sola sin necesitar un aviso. Y el resultado explica qué va a pasar, para que
la puerta no parezca un fallo del programa.

### Vídeos · tres columnas a ancho completo

```
izquierda          centro              derecha
escribes lo        el vídeo y          la letra que TÚ
que oyes           sus mandos          pegaste
```

La sección **se sale del `.wrap` de 1280 px** (`width:calc(100vw - 40px)` +
`margin-left:calc(-50vw + 50% + 20px)`): a 1280 no caben tres cosas a la vez sin que las tres
salgan estrechas. Por debajo de 1500 px la letra baja a ancho completo; en móvil, una columna.

**Lo nuevo, y por qué:**
- **Recuadro para escribir lo que oyes**, guardado automático por vídeo. Oír solo entra por un
  oído; escribir obliga a decidir **qué** palabra era, y esa decisión es la que deja huella.
- **Doble clic en cualquier palabra que hayas escrito** → su ficha, con el botón de guardarla.
- **«Comparar con la letra»: el espejo.** Palabra por palabra y línea por línea — verde lo que
  cazaste, ámbar lo que pusiste distinto, tachado lo que no llegaste a escribir, y el
  porcentaje. Es un dictado con corrección, que es el ejercicio que de verdad afina el oído.
- **«Taparla mientras escribo».** Escribir mirando la letra es copiar, no es un dictado.
- **«Llevar a un cuaderno»** con el **nombre de la canción**, no «Cuaderno sin título 4». Así
  dentro de un mes sabes de dónde salió.

### La regresión que Miguel encontró

Tocar una palabra de la letra **ya no ofrecía guardar**. Al rehacer la sección, el clic pasó a
abrir `DIC.abrir` —la ficha general del diccionario, que no tiene ese botón— y `fichaPalabra()`,
la única que sí lo tiene, quedó desconectada. **Nadie la quitó: se cayó sola.** Restaurada, y
comprobado que la palabra entra de verdad en la Práctica.

**La lección:** al sustituir una pieza por otra parecida, hay que comparar **lo que ofrecía**,
no solo que la nueva funcione. Las dos abrían una ficha; solo una guardaba.

### Lo que no cambia

El motor **no baja ni guarda letras de ningún sitio**. Lo que hay en las dos columnas lo
escribe o lo pega el usuario, y no sale de su navegador — igual que el Cuaderno. La máquina la
pongo yo, el material lo trae él.

---

## ✅ 3-ENG · Verificación del rediseño, y el fallo que destapó — 2026-09-11 (noche)

La sesión de diseño entregó la capa visual. **Mi trabajo no era creerme el informe: era
comprobarlo.** Todo pasó, y de paso salieron tres cosas que merecen quedar escritas.

### Lo que se verificó, no lo que decía el informe

Contrato JS-DOM intacto (130 `id`, 66 `data-*`, 38 clases que el motor conmuta), motor
**idéntico byte a byte**, build reproducible, 0 falsos positivos en los 4 corpus, 8 auditorías
en verde, 11 pestañas sin desbordes a 375 px, 0 errores de consola, y las 3 URL de fuentes
respondiendo 200.

### Tres veces en que el equivocado era MI medidor

1. **Marqué «texto invisible»** en Piezas. La **captura de pantalla** lo desmintió: era el
   patrón normal de texto en degradado (`background-clip:text` en el padre, relleno
   transparente heredado en el hijo). Un detector automático no sustituye a mirar.
2. **Mi medidor de contraste** daba 1,56:1 en medio documento porque **no componía los fondos
   translúcidos**. Rehecho apilando capas: 9 de 2870 elementos por debajo del mínimo (0,3 %).
3. **Mis dos primeras pruebas de rendimiento** no detectaban mejora — una daba 12 % peor.
   Medían lo que `content-visibility` **no** optimiza. Con una maquetación completa forzada,
   que es el escenario real de la lista de 4231 tarjetas: **6214 ms → 136 ms**.

**La lección:** una medida que contradice un informe honesto es, la mayoría de las veces, una
medida mal hecha. Antes de acusar, revisar el instrumento.

### Dos desplazamientos suaves a la vez se cancelan

Al añadir el desplazamiento de la tira de pestañas, la primera versión con `behavior:'smooth'`
**no funcionaba y no daba ningún error**: la línea de arriba ya lanzaba un `window.scrollTo`
suave, y el navegador solo atiende uno. Instantáneo sí funciona, y en una tira de 350 px ni se
nota.

### El fallo de fondo que destapó: «She have a car» pasaba en VERDE

La regla de la -s arranca con `if(iAux === -1)` — solo corre si la frase **no tiene auxiliar**.
Y `have` está en la lista de auxiliares, así que con «She have…» no llegaba ni a mirarse.
Medido: `She go to work` y `He want it` sí daban rojo; `She have a car`, `He have two dogs`,
`It have a problem` y `She have been working` pasaban las cuatro.

Es de los errores más comunes de un hispanohablante, porque en español «tener» no cambia ahí.

Arreglado con una regla **aparte** (R5b), no aflojando la original: relajar el `iAux === -1`
habría abierto la puerta a marcar «She can have it» o «She should have known», que están bien.
**8 casos cazados, 18 que no se tocan**, 0 falsos positivos en los corpus después de añadirla.

Sigue sin marcarse «My sister have a job», que está mal: el sujeto es un sustantivo, «my
sisters have» está bien, y por la forma no se puede saber cuál de los dos es. **Cuando no se
sabe, no se corrige.**

### Pendiente, declarado

- El peso subió 3,4 kB gzip (394,6 → 397,9). Bajo el techo de 400, pero el encargo decía «no
  subir». Es el precio de los `@font-face` y de las reglas nuevas de móvil.
- Los ~13 000 nodos del DOM **no bajan, y no es cosa del CSS**: unos 9600 los construye
  `08_app.js` en el arranque saltándose sus propias guardas perezosas (`renderWords(true)`,
  `renderPhrases(true)`, `BF.render()`). Es una tarea de JavaScript, pendiente.

---

## 🚽 3-ENG · «¿Cómo es posible que no esté la palabra Toilet?» — 2026-09-11 (tarde)

Miguel encontró el agujero con **una sola palabra**. Y tenía toda la razón: el
diccionario había llegado a 4000 palabras **sin «toilet», sin «boy» y sin «girl»**.

### El fallo no fue de memoria, fue de método
Las 2000 palabras nuevas se generaron **por temas que se me ocurrían**. Y por temas
uno nunca escribe «niño», «váter» ni «doce»: **da por hecho que ya están**. Lo obvio
es exactamente lo que no se lista.

Barriendo **881 palabras de uso corriente** faltaban **223**: los números del once al
noventa, los ordinales del cuarto al décimo, el baño entero (shower, shampoo,
toothbrush, towel), media despensa (beef, pork, ham, bacon, salmon, tuna) y medio
armario (trousers, blouse, underwear, slippers). **4016 → 4231.**

Se añaden también las variantes británicas que salen en los subtítulos: *neighbour,
colourful, theatre, tyre, petrol, pavement, trousers, tin, torch, loo*.

### Lo que vale más que las 223 palabras
`BUSCA.auditar()` comprueba ahora **175 palabras de supervivencia** — lo que hay que
poder decir para pedir algo, llegar a un sitio y seguir una conversación. Si falta
una, **la nombra**.

**Probado rompiéndolo:** quitando «toilet» y «boy» del índice, `auditar()` pasa a
`ok:false` y dice cuáles faltan. Un test que no falla cuando debe no es un test.

**La regla:** cuando el contenido se genera por temas, hace falta una lista de suelo
que se compruebe sola. El hueco lo tiene que encontrar la auditoría, no el usuario.

---

## 📖 3-ENG · El diccionario a 4000 y los 6 fallos que destapó — 2026-09-11

### De dónde salió
Miguel: *«el diccionario de las 2000 palabras se quedó pequeño, no encuentra
muchas de las palabras de las canciones»*. Tenía razón, pero **el tamaño era el
tercero de tres problemas**, y no el mayor. Medido contra el corpus del propio
documento (1000 frases + 2000 ejemplos = 11.571 palabras), la búsqueda
encontraba el **78,6 %**.

| Qué fallaba | Cuánto costaba |
|---|---|
| **No existían las contracciones** — `don't`, `it's`, `I'm`, `can't` | Son las palabras **más frecuentes del inglés hablado** |
| **No se buscaba por la raíz** — `going`, `plans`, `missed` fallaban con `go`, `plan`, `miss` dentro | 237 palabras distintas |
| **Faltaban palabras de verdad** | 462 distintas |

`LEX.raiz` ya existía **pero es solo para verbos**: exige que el resultado sea
un verbo conocido, así que `windows → window` o `minutes → minute` se le
escapaban. De ahí el módulo nuevo.

### Lo que hay ahora
- **`BUSCA`** — 95 contracciones y recortes (`gonna`, `wanna`, `ain't`,
  `'cause`, `y'all`, `nothin'`) cada uno con su forma completa; plurales,
  pasados, gerundios, comparativos, superlativos, adverbios e irregulares
  probados **contra el propio diccionario**, sea la categoría que sea. Y dice
  siempre **por qué camino llegó**: si buscas «going», tienes que ver que lo
  que hay dentro es «go», o se aprende mal.
- **`EXPR`** — 231 expresiones compuestas. `give up` no es «dar arriba». Se
  detectan **conjugadas**: «I gave up» encuentra «give up».
- **4016 palabras.** Las 2000 primeras intactas y en su orden de frecuencia;
  las 2016 nuevas en archivos aparte (`_W2*.txt`) y **por tema**, no por
  frecuencia — la banda se llama «2001-4016 · por temas» y no finge un orden
  que no tiene.

**Cobertura medida: 78,6 % → 98,7 %.**

### Las tres trampas del oficio que costaron tiempo
1. **Lematizar la frase entera rompe las expresiones.** «I gave up» necesita
   que `gave → give`, pero llevar TODO a su base convierte «held hands» en
   «hold hand» y deja de casar con «hold hands». La regla buena es la del
   idioma: **solo el verbo de cabeza se conjuga**; lo que viene detrás no se
   toca.
2. **`walkin' → walking → walk` son DOS saltos** y el primer intento solo daba
   uno. Sin apóstrofo hay que exigir que se llegue por el camino del gerundio,
   o `sin` acabaría siendo `sing`.
3. **Escribir fichas a ciegas es tirar la mitad del trabajo.** El primer lote
   salió con **152 de 242 repetidas**. Generando primero la lista de candidatas
   y filtrándola contra lo que ya había, los siguientes salieron a **cero**.

### Los 6 fallos del corrector que esto destapó
Las palabras nuevas metieron **20 falsos positivos**. Ninguno era un ejemplo
malo: eran fallos que hasta ahora **nada pisaba**.

1. **«corazón» lo daba por femenino.** La regla de `-zón` es buena para
   *razón* y *sazón*, no para *corazón* ni *buzón*.
2. **«microondas», «paraguas», «cortafuegos», «rompecabezas»** → plurales
   femeninos. Son **invariables en -s**.
3. **«guardia» y «astronauta»** → femeninos. Son de **género común**.
4. **«La admiro» → «el admiro».** Leía el **pronombre** `la` como artículo y un
   verbo como sustantivo. El peor de los seis: sale en cualquier frase normal.
5. **«It's sort of blue» → pedía «is sorting».** Y hubo que arreglarlo en
   **dos sitios**: el etiquetador y `exigencias()` tienen criterios propios, y
   hacerlo solo en uno deja el fallo vivo en el otro.
6. **«Bear in mind» y «So what if»** → reglas que no contemplaban los bloques
   hechos (`in mind`, `by heart`, `at least`…) ni una muletilla delante de la
   fórmula fija.

### Y un fallo mío al arreglarlos
Marqué los invariables en -s como **singulares** y rompí «los lunes». No son
singulares: es que **no se puede saber** por la forma —«el lunes» y «los lunes»
son correctos los dos—. Ahora `numero()` devuelve `null` y no se corrige.
**Cuando no se sabe, no se corrige**, que es la regla de la casa.

### Lo que casi se queda desfasado
Las bandas del Módulo 1 estaban **clavadas a 2000**: «Todas» se habría quedado
mostrando la mitad del diccionario sin avisar de nada. Ahora salen de
`WORDS.length`, igual que el contador del total, que también estaba a mano.
**Regla:** un número escrito a mano sobre el tamaño de los datos es una mentira
con fecha de caducidad.

### El build ahora se comprueba a sí mismo
Al meter los archivos nuevos, un acento grave entre comillas **dobles** hizo
que bash lo leyera como sustitución de comando: salió un HTML de **846 KB en
vez de 1 MB** y el script siguió diciendo «construido» tan tranquilo. Ahora
`build.sh` verifica que las piezas grandes están dentro y **sale con error** si
falta alguna. Probado rompiéndolo a propósito.

### Verificado (localhost, sobre el archivo construido)
0 falsos positivos en los 4 corpus (1000 frases EN, 1000 ES, 4016 ejemplos EN,
4016 ES) · `LAB` `MORFO` `CLUB` `GL` `SONG` `BUSCA` `EXPR` en verde · 11
pestañas y 11 paneles · contador 4016/4016 · y las reglas **siguen cazando** lo
que deben (*Do you can drive?*, *La problema*, *El casa*, *Los libro*) sin
marcar lo que está bien (*El corazón me sangra*, *los lunes*, *el lunes*).

---

## 🎬 3-ENG · La sección de vídeos deja el karaoke y pasa a ser un buscador — 2026-09-10 (tarde)

### Qué pasó
El karaoke se construyó tres veces y las tres se desincronizaba. La última tentativa
—«Empieza aquí» + anclas + interpolación por sílabas— cuadraba el arranque y se iba
perdiendo más adelante. Miguel lo cortó: *«a la mier el karaoke»*. Tenía razón, y la
razón es de fondo, no de implementación:

**Los tiempos que hacen falta no se pueden conseguir.** El reproductor va en un iframe de
YouTube (otro dominio) y su API **no expone el texto** de los subtítulos; el servidor de
`timedtext` no autoriza peticiones desde otra web. Sin los tiempos reales, cualquier
sincronía es una estimación, y una estimación que se arrastra es peor que no tener nada
cuando lo que se está haciendo es aprender. Una extensión de navegador sí puede porque
vive **dentro** de YouTube; una página como esta, no.

### Qué hay ahora
- **El vídeo con los subtítulos de YouTube encendidos** (`cc_load_policy:1`). Los pinta
  YouTube, clavados, gratis.
- **Debajo, el texto completo** que Miguel pega, con pinta de subtítulo (fondo oscuro,
  centrado, sombra) — no una lista de fichas.
- **Una casilla de búsqueda.** Dice cuántas veces sale esa palabra **en este vídeo**, la
  resalta en el texto, y luego el veredicto: si está en las 2000 palabras o en las 1000
  frases del documento, lo enseña con su traducción y sus ejemplos; si no está,
  **lo dice** y ofrece las cuatro de fuera (WordReference · Cambridge · Reverso Context ·
  YouGlish). Nada de inventar una definición que no se tiene.
- **Clic en una palabra** → su ficha del diccionario. **Doble clic** → el veredicto
  completo, y se cierra la ficha para no tapar la respuesta.

### Lo que se borró (y por qué no se echa de menos)
`pintaKaraoke`, `pintaPalabra`, `marcaLinea`, `silabas`, `palabraDe`, `repartir`,
`recalcular`, `sincronizarAuto`, `reanclar`, `correrTodo`, `karaoke3`, `barraSync`,
`pesoLinea`, `cuantasTiempos`, `tocarLinea`, `suena`, `pintaActiva`, el bucle A-B y sus
manejadores, y el CSS de `.sg-kar`/`.kr`/`.kw`. **−293 líneas netas.** El importador de
`.srt`/`.vtt`/`.lrc`/transcripción se queda: sigue sirviendo para quitar los tiempos y
dejar el texto limpio.

### Trampas que costaron sangre esta ronda
1. **Repintar mata a los manejadores puestos elemento a elemento.** Pasó dos veces. El
   bloque de texto se reconstruye en cada búsqueda; los `onclick` de cada `<span>` se van
   con él. Va por **delegación** sobre el contenedor.
2. **`render()` destruía el iframe de YouTube** mientras `P.player` seguía siendo
   verdadero, así que la guarda de remontaje no saltaba y el reloj se quedaba en 0:00. Se
   partió en `sgFijo` (cabecera + vídeo + mandos, se pinta una vez por vídeo) y `sgVar`
   (se repinta cuanto haga falta). **Medido:** cero iframes en la página antes, uno después.
3. **`DIC` lleva un `dblclick` global en `document`.** El `stopPropagation()` del manejador
   propio es lo que evita que se abran dos cosas a la vez. Si alguien lo quita, vuelve.

### Y lo que casi se queda mal
Quitar una función es la mitad del trabajo; la otra mitad es **quitar lo que la anunciaba**.
Quedaron cinco textos de cara al usuario vendiendo la sincronía muerta —«la letra siguiéndola»,
«queda sincronizado clavado», «líneas ya sincronizadas», «ahora dale a Sincronizar» y un paso 3
del método que mandaba repetir una línea en bucle con un botón que ya no existe— más `TTS.decir()`,
que solo usaba el karaoke y se quedó con **0 llamadas** en todo el documento. Se fue todo en el
commit siguiente. **Regla:** después de arrancar una función, buscar su nombre y sus promesas en
el texto de la página, no solo en el código.

### Verificado (localhost:3456, sobre el archivo ya construido)
0 falsos positivos en los 4 corpus · `LAB` `MORFO` `CLUB` `GL` `SONG` en verde · 11 pestañas
visibles, 11 paneles abren · 0 errores de consola · búsqueda dentro y fuera del documento ·
doble clic · iframe intacto · `eng_song` byte a byte igual antes y después de la prueba.

---

## 🎵 3-ENG · Canciones, la hoja y el Club por habilidades — 2026-09-10

### Canciones · karaoke didáctico (pestaña `sg`, la 11ª)
**La letra la pone Miguel.** Las letras tienen derechos de autor y no pueden vivir dentro del
documento, así que se aplica lo mismo que en el Cuaderno: *tu material, no el mío*. Está dicho
en la propia página, no escondido.

Por línea: oírla · oírla **3 veces en bucle** · **taparle palabras** y teclearlas oyendo · marcarla
como aprendida. Velocidad Normal/Lenta/Muy lenta sin tocar la del resto del documento. La palabra
que suena se ilumina con `onboundary`; donde el navegador no lo dé, la línea se oye igual y no se
ilumina. Cualquier palabra se toca y abre su ficha del diccionario. Si pega el enlace de YouTube,
el vídeo se ve ahí mismo (`youtube-nocookie`, y del enlace **solo** se extrae el id de 11
caracteres — nunca se construye una URL con texto suelto del usuario).

Delante va el **método en 5 pasos** —a ciegas, con letra, línea a línea en bucle, cazar los
recortes (*gonna/wanna/ain't*, que es donde se escapa el inglés hablado), y otra vez sin letra— más
cómo elegir canción y cómo no. Y **12 sugerencias** de pop/rock/rap con *por qué* sirve cada una:
va dicho que es criterio sobre tempo, claridad y repetición, **no un dato medido**.
**Las dos con lenguaje explícito van marcadas «solo adultos»** con aviso aparte: su hija usa esta
página, y eso se dice antes, no después. Sincroniza en `eng_song` con merge por entidad.

### El Club: cada modo entrena una cosa distinta
Miguel: *«escucha, traducir y dictado son casi lo mismo»*. Lo eran — el mismo ejercicio con otra
puerta de entrada. Ahora:

| Modo | Entrada | Qué hace | Entrena |
|---|---|---|---|
| Leer | inglés a la vista | elige el significado entre tres | entender |
| Armar | español | toca las palabras revueltas, **sin teclado** | el orden |
| Traducir | español | la teclea entera de memoria | producir |
| Dictado | solo audio | **rellena los huecos**, no transcribe | oído fino |
| Escuchar | solo audio | elige cuál de tres parecidas oyó | distinguir |
| Hablar | la frase | la dice en voz alta | pronunciar |

Leer ya **no enseña la traducción** (si la enseñara no habría nada que elegir) y Escuchar no
enseña ni texto ni molde. Los dos **puntúan y guardan progreso**: antes tenían un «Siguiente» que
dejaba pasar sin responder, así que no alimentaban nada.

La auditoría ahora recorre **las 1000 frases contra cada modo** y cazó dos cosas que jugando no se
ven: frases gemelas del documento que comparten traducción producían **tres opciones idénticas**
(imposible de responder, y dos de las tres contaban como fallo), y una frase se quedaba sin
señuelos parecidos. Las dos corregidas → `APP.CLUB.auditar()` en 0.

### La hoja del cuaderno
- **El color ya no se pega al dar Enter.** El navegador clonaba el `<mark>` en la línea nueva;
  ahora el Enter parte el párrafo y lo que baja sale fuera de la marca, y se barren las marcas
  vacías (las que reenganchan el color sin verse).
- **Seis tamaños de letra por hoja** y **A− / A+** para un trozo suelto, en siete escalones.
- **Todo lo de dentro pasó de px a `em`** — esa era la razón de que los títulos y las tarjetas no
  siguieran al tamaño de la hoja.
- La cinta de opciones ya no se esconde: cabecera *sticky*.
- Aprendido/Repasar/Error son **pegatinas arrastrables**, con la posición en % para que no se
  descoloquen al cambiar el ancho.
- **20 pegatinas dibujadas aquí**, cristal de neón: el color saturado va en el **contorno** y el
  relleno no pasa del **19%** de opacidad — por eso son translúcidas y no flúor, y el texto de la
  hoja se sigue leyendo por debajo.
- Se quitó el **scroll anidado** (editor con barra propia dentro de una página que también
  scrollea): era la causa de que no se sintiera fluido.

### Capa de estilo (`29_vibe.css`)
Va aparte y **solo añade**: quitarla del build devuelve el documento exacto a como estaba.
**No toca los seis colores de las piezas** —no son decoración, son lo que enseña el documento— ni
baja el contraste del texto. Lección anotada en el propio archivo: un degradado recortado al texto
dejó el número de sección **invisible** por especificidad; se cazó mirando la pantalla, no
suponiendo.


---

## 🎮 3-ENG · Club de Frases + la trampa del `$&` — 2026-09-09

### Lo que pidió Miguel
Investigar **julebu.co** a fondo e implementar una sección con **la misma metodología**.

### Qué es esa metodología, y por qué encaja aquí
Julebu (句乐部, «el club de las frases», 700.000 usuarios en China; revisado 09-sep-2026) no
hace estudiar frases: hace **construirlas a golpe de tecla**. Ves el español, tecleas el inglés
palabra por palabra, el **ESPACIO** confirma cada una, los aciertos seguidos suman **combo** y a
los 20 la puntuación se dobla. Al final, un rango de **C a SSS**.

Encaja porque el material ya estaba: **las 1000 frases del documento traen su molde**
(`S + was + ADJ`), su traducción, su tiempo y su nota. Las «ranuras» de ellos son **las 6 piezas
de colores** que el documento ya usa en todas las demás pestañas. No hubo que inventar datos.

**Una diferencia declarada en la propia página:** ellos muestran la transcripción fonética (IPA)
de cada palabra. No hay fuente verificada de IPA para estas 2000 palabras, así que **no se pone**
— en su lugar, el audio real. Regla de «un dato sin fuente no se muestra», aplicada.

### Piezas
`27_club.js` (módulo `CLUB`, ~460 líneas) · `03g_club.html` (pane `cf`) · `28_club.css`
(51 clases, todas con prefijo `cf-`). Progreso en `eng_cf`, sincronizado con **merge por
entidad** reusando `mergeSrs` — si juega una ronda en el móvil y otra en el PC, quedan las dos.
5 modos: Leer · Traducir · Dictado · Escuchar (3 fases) · Hablar. 42 paquetes. Lo que salga
por debajo de 90 se marca ★ solo y cae en la Práctica diaria.

### Un fallo que cazó la propia auditoría
`limpia()` borraba todo lo que no fuera `a-z`, así que las fichas `30%`, `2023` y la barra de
`Yes, please. / No, thanks.` quedaban **vacías: imposibles de teclear**. La ronda se habría
quedado clavada ahí. Arreglado en dos partes: se conservan las cifras (`30%` se teclea `30`), y
las fichas sin nada que teclear son **dadas** — no se piden, no puntúan y no cuentan en el total.
Quedan 2 fichas dadas en las 1000 frases. `APP.CLUB.auditar()` → 0 fallos.

### 🚨 La trampa del `$&` · un fallo mío que llevaba sesiones en producción
`String.replace(a, b)` **interpreta `$&`, `` $` ``, `$'` y `$1` dentro de `b`**. Los parches que
inyectaban código lo hacían con `replace`, y ese código contenía
`.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')` para escapar expresiones regulares — así que el `$&`
se sustituía por el texto del ancla y quedaba `'\\/* ─── BIFURCACIONES ───'`.

Lo grave: **es JavaScript válido**. `node --check` pasó verde en todas las sesiones. Dejó roto
el escapado en dos sitios reales — el corrector (`corregir()`) y el auto-marcador del glosario
(`GL_RE`) — y **llegó a producción** (líneas 8075 y 9901 del HTML publicado). Peor: el script
que escribí para repararlo cayó en la misma trampa y anidó la corrupción al correr dos veces.

Reparado por **índice de línea con asignación literal**, y reinyectado con `split().join()`.
La regla quedó escrita en `CLAUDE.md`. La prueba que lo detecta no es de sintaxis sino de
comportamiento (`test_escape.js`): evalúa la expresión y comprueba que `"a.b"` escapado deja de
casar con `"axb"` — pasa en el reparado y falla en el corrupto.

### El espacio dejó de regalar la palabra — 2026-09-09 (mismo día, tras probarlo Miguel)
Lo cazó jugando: *«no tiene gracia que en traducir, dictado y escuchar me dé la palabra al darle
espacio»*. Tenía razón dos veces. En `palabraHTML` la condición era `i > S.w`, así que **la ficha
activa se mostraba entera** — con su traducción y su categoría: el juego te enseñaba justo lo que
te pedía escribir. Y en Escuchar no se tapaba nada, o sea que la fase «a ciegas» mostraba la frase
completa; la fase se llamaba así y no lo era.

Ahora `tapada(i)` decide por modo, y es la regla que pidió:
**Leer y Hablar** la frase se ve entera (ahí sí se regala: es el material) · **Traducir y Dictado**
se tapa también la activa (`i >= S.w`) · **Escuchar** se tapa hasta la fase 3, la de «con el texto».

Y el ESPACIO ya no perdona: si la palabra está mal **no avanza y no dice cuál era**, se vuelve a
pedir la misma. Para que eso no sea una trampa sin salida hay una escalera: a los 2 fallos una
pista que no es la respuesta (inicial + número de letras), a los 4 un botón explícito
«Enséñamela y sigue». El rango dice la verdad: una palabra sacada tras fallar **no cuenta como
acertada** (`okPal` solo sube si `intentos === 0`), y cada palabra fallada se cuenta una sola vez.

### Las fichas del glosario que no abrían — 2026-09-09
Miguel encerró en rojo dos términos que no desplegaban nada. La causa era una errata:
tres marcas escribían **`data-g=`** en vez de `data-glo=` (`modal`, `sujetorelleno`, y la demo
«¿ves una palabra subrayada con puntitos? Tócala» — que precisamente no se podía tocar). Las
definiciones existían las tres; solo el atributo estaba mal. Ojo al corregir: `08_app.js` usa
`data-g="0|1|2"` **legítimamente** en los botones de calificar de Práctica — esos no se tocan.

**Por qué sobrevivió:** `GL.auditar()` filtraba por `.gl[data-glo]`, así que una marca con el
atributo mal escrito le era invisible y reportaba «sinDefinir: []» con tres fichas muertas.
Una auditoría que solo mira lo bien formado no audita: confirma. Ahora recorre **todas** las
`.gl`, nombra el atributo y el pane de cada una rota, y añade `huerfanas` (fichas sin ningún
camino). Probada metiéndole los dos fallos a propósito: los caza.

**Dos fallos de fondo que salieron al revisar el resto:**
1. `glAutoMarcar` marcaba **solo la primera coincidencia de cada nodo de texto**, así que en un
   párrafo que nombra tres términos los otros dos no se marcaban nunca. Por eso `contable`,
   `comparativo` o `continuo` existían sin que hubiera forma de abrirlas. Ahora la cola del nodo
   vuelve a la cola de proceso.
2. Solo se recorrían **tres pestañas** (`p0`, `pz`, `p3`), y varias se pintan al abrirlas. Ahora
   se repasa al abrir cada pestaña — y el marcador es **idempotente** (el cupo cuenta las marcas
   que ya hay), comprobado dando tres vueltas al documento: 187 marcas, 187, 187.

**9 fichas nuevas**, elegidas por frecuencia real en el texto: presente simple (sale 71 veces y
no tenía ficha), pasado simple, presente perfecto, futuro, continuo, singular/plural, verbo
irregular, sílaba y posesivo. Más 7 que existían pero eran inalcanzables (afirmativa, negativa,
conjugar, pasiva, verbo…). De 30 fichas a 39, y de 27 alcanzables a 35.

**Lo que NO se marca, a propósito:** en las fichas de las listas se protege el dato — la palabra,
su traducción, su categoría, su ejemplo, el molde — porque ahí una marca sería un error de
contenido. Las **notas** sí se marcan: son prosa, y es donde el lector se topa con «presente
perfecto» sin saber qué es. Verificado que no cae ninguna marca en `.w-en/.w-es/.p-en/.p-es/.tag`
y que los botones de la ficha siguen respondiendo. Coste medido: 13 ms en la pestaña más pesada.

Siguen sin marcarse 4 fichas: `gerundio`, `superlativo` e `interrogativa` **no aparecen en ningún
texto** del documento (no hay dónde), y `presente perfecto` solo sale en la etiqueta de tiempo de
las fichas de frase, que es dato protegido.

### Verificación (navegador, no lectura de código)
0 falsos positivos en las 1000 frases EN y las 1000 ES · siguen cazados los 4 errores conocidos
(`Why do you aren't finished…`, `I'm hungry yesterday`, `ayer me comió un manzana`, `Hice el
almuerzo mañana`) · Laboratorio 640/640 · MORFO 17/17 y 11.585 formas · 10 pestañas visibles ·
los 10 panes pintan · los 5 modos del Club pintan · ronda completa tecleada con eventos reales
de teclado en las 4 frases que estaban rotas → SSS, 0 atascos · camino del error probado (combo
a 0, rango C, guardado) · la app sobrevive a `eng_cf`, `eng_fav_p` y `eng_srs` corrompidos a
propósito · `eng_cf` registrado en `SYNC.KEYS` y con marca en `eng_meta`.

---

## 🎚️ 18-MUS · El Estudio · grabar, editar, mezclar y exportar — 2026-09-08

### El encargo, ampliado a mitad de construcción
Miguel pidió más: grabar voz con cancelación de ruido y efectos, crear y mezclar pistas,
melodías completas con instrumentación de cada género, **agregar y quitar instrumentos**,
**editar la pista entera con loops**, y **exportar en los formatos requeridos**. Y que cuando
el módulo no pueda hacer algo, genere el prompt que diga dónde y cómo hacerlo.

### La decisión que hace usable un editor para alguien que no sabe armonía
Las pistas melódicas **no guardan notas, guardan GRADOS**. Se dibuja una forma en una rejilla
y el motor la traduce al acorde que toque en cada compás. Consecuencia práctica: **no se puede
equivocar de nota**. Dibuje lo que dibuje, está en tono. Y cambiar de tonalidad o de progresión
no le borra lo dibujado, porque lo que guardó fue la forma, no las alturas.

Dos modos: grados **del acorde** (siempre consonante — bajos y armonías) o **de la escala**
(más movimiento, permite notas de paso — melodías y riffs).

El resto del modelo copia a propósito el de FL Studio, que ya maneja: patrón de 16 casillas por
pista + secciones donde suena. Cero conceptos nuevos que aprender.

### Piezas nuevas
| Archivo | Qué es |
|---|---|
| `js/music-inst.js` | Instrumentos de género + arreglista |
| `js/music-export.js` | WAV · MIDI · stems · medición |
| `js/music-rec.js` | Micrófono + cadena de voz de 9 módulos |
| `js/music-studio.js` | Proyecto editable, pistas, canales de mezcla |
| `js/music-ui.js` | La interfaz del Estudio |

### Instrumentos: síntesis, no samples
Guitarra y requinto por **Karplus-Strong** (modelado físico real: ruido en una línea de retardo
realimentada a través de un paso-bajos). Se calcula a AudioBuffer y **no** con DelayNode porque
un lazo de realimentación en Web Audio tiene un retardo mínimo de un bloque de render — 128
muestras ≈ 2,9 ms — lo que techa la frecuencia en ~344 Hz: inservible para una guitarra.

Acordeón (tres lengüetas desafinadas + vibrato), metales (el filtro ABRE con el ataque, que es
lo que suena a metal), marimba (armónico a 4× la fundamental, que es como se afina de verdad),
campana (FM con razón inarmónica), flauta con soplo, 808 con glide, stabs.

### Grabación
Cadena de 9 módulos con preset por género. Cuatro decisiones que importan:
1. **Se graba la señal CRUDA**, antes de los efectos. La cadena sigue siendo ajustable después:
   si mañana sobra la reverb se baja, no hay que volver a cantar.
2. **Captura sin pérdida** por AudioWorklet (ScriptProcessor de respaldo). MediaRecorder era
   menos código pero comprime a Opus, y empezar con pérdida algo que se va a comprimir otra vez
   al distribuir es empezar mal.
3. **"Medir el cuarto"** calibra la puerta con el ruido de fondo REAL de su casa, no con un
   umbral genérico.
4. **autoGainControl siempre apagado**: sube y baja el volumen solo y arruina la dinámica de una
   interpretación cantada.

El quita-sibilancias es un **EQ dinámico** en 7 kHz, no un divisor de bandas: partir la señal
mete problemas de fase justo en el punto de corte.

### Exportación
WAV 16/24 bits, **MIDI**, stems por instrumento y proyecto JSON.

El MIDI es el que más le sirve: lleva las notas, no el sonido. Se abre en FL Studio con cada
pista en su instrumento General MIDI (guitarra 27, bajo 33, acordeón 21, percusión en canal 10)
y ahí reemplaza el sintetizador por un acordeón grabado de verdad. Es el puente exacto entre la
maqueta y su DAW.

**MP3 no se genera, a propósito.** Exigiría una librería externa y rompe la arquitectura vanilla
del Cerebro. Queda documentado en el puente, no escondido.

### El render se colgaba · cómo se arregló
En un render offline **todos los nodos existen desde el instante cero**: no hay reproducción
progresiva que los vaya creando. Una canción entera de golpe son ~8.000 nodos vivos, y el coste
crece peor que lineal — pasaba de 45 s y seguía.

Dos arreglos, medidos:
1. **Percusión a buffer.** Cada sonido se calcula una vez como forma de onda en JS y se dispara.
   Antes unas palmas eran NUEVE nodos por golpe (tres ráfagas × fuente + filtro + ganancia).
   Bonus musical: garantiza que lo exportado suene **idéntico** a lo monitoreado.
2. **Render por tramos con suma solapada.** Tramos de 8 compases, cada uno con cola extra, que
   se suman. Es exacto porque la cadena hasta el bus es lineal — y se comprobó: pico y RMS
   idénticos con tramos de 8 y de 16 compases.

Resultado: **colgado → 39 s → 23 s → 12,2 s** para un tema de 3:14 (16× tiempo real).

### Mezcla real sin tocar quince funciones
Cada pista tiene canal propio con ganancia y panorama de potencia constante. Se logró con
`MAUDIO.withDest`, que intercambia el bus de destino antes de la llamada y lo restaura después:
funciona porque los quince instrumentos leen `master` de forma síncrona. El volumen es volumen,
no un truco escalando la velocidad de las notas.

### El puente · ser honesto sobre el límite
Cinco cosas que no caben en un navegador (voz IA, separación de stems, máster final,
instrumentos reales, mezcla multipista), cada una con **por qué**, **dónde** y **cómo volver**.
Cada una genera una instrucción ya rellenada con los datos reales de la canción abierta: título,
género, BPM, tonalidad, progresión, estructura e instrumentación.

### Fallos que encontró la verificación (ninguno se ve leyendo el código)
1. **Dos pestañas se llamaban "Estudio".** La de inicio pasó a "Inicio".
2. **Cambiar de género arrastraba la progresión anterior**: daba vallenatos con progresión de
   champeta.
3. **El título autogenerado no seguía al género**: exportaba un archivo llamado
   "Idea-en-Champeta" que era una salsa.
4. **Dos pistas llamadas "Guitarra"** en champeta (hace armonía Y riff). Ahora el papel va en el
   nombre.

### Incidente de la sesión · casi me llevo medio motor por delante
Un script de reemplazo con una regex `[\s\S]*?` para borrar código muerto se comió `ctx()`,
las voces melódicas y las funciones de render de `music-audio.js`. Se recuperó del respaldo que
se había hecho un minuto antes y se rehízo el reemplazo **solo por índices de línea, sin regex**.
**Lección: para editar por script un archivo verificado, copia primero y splice por rango — nunca
una regex codiciosa sobre todo el archivo.**

### Verificado (en producción, no solo en localhost)
Los 7 módulos cargan · proyecto se genera por género con su arreglo · agregar instrumento pasa de
1.924 a 1.996 eventos y quitarlo vuelve al punto de partida · reproducción con posición, sección
y pasos iluminados · WAV, MIDI, stems y proyecto se producen con el tamaño y tipo correctos ·
**MIDI validado parseando el archivo de vuelta**: cabecera correcta, formato 1, PPQ 480, cada
note-on con su note-off (sin eso FL Studio se queda con notas colgadas) y cada pista en su
programa GM.

### ⚠️ NO verificado
**La grabación por micrófono no se pudo probar de extremo a extremo**: el panel de navegador de
las pruebas bloquea `getUserMedia`. Lo que sí está comprobado es que la ruta de fallo degrada con
elegancia (avisa y la interfaz sigue usable). **La captura, la calidad y la cadena en vivo las
tiene que probar Miguel con auriculares puestos** — y es lo primero que hay que confirmar en la
próxima sesión.

### Sync
`mus_proy` al SYNC_REGISTRY (pocos KB: guarda grados y patrones, no audio). Las tomas de voz
viven en IndexedDB local (`da2026_mus`) y **no viajan** — hay que exportarlas para no perderlas.
Cache-bust en lockstep: `cloud-sync.js` p18 → **p19 en las 29 páginas**.

### Lo que queda
- Colocar las tomas de voz en un compás concreto (hoy entran desde el segundo 0).
- Editar la estructura desde la interfaz (añadir o quitar secciones).
- Importar un proyecto `.musproy.json` (hoy se exporta pero no se vuelve a cargar).
- Automatización de volumen por sección.

---

## 🎵 18-MUS · Nuevo módulo · Cerebro Musical — 2026-09-08

### El encargo
Miguel quiere lanzar un proyecto musical: publicar sus composiciones y **vendérselas a artistas**
nacionales e internacionales, con un universo de redes alrededor. El problema de fondo lo dijo él:
**no sabe de acordes ni de estructuras de canción**. Géneros pedidos: reggaetón, vallenato,
champeta, salsa, pop — y los que yo recomiende.

### La decisión de diseño que manda sobre todo
La primera tentación era copiar el molde del English Engine: tarjetas, Leitner, memorizar teoría.
**Es el error que ya cometimos con 17-IA** (ver `feedback_no_copiar_el_molde`). En inglés el cuello
de botella es la memoria; aquí no. Nadie compone porque se sepa la definición de «progresión».

Así que el módulo no explica teoría: **la hace sonar**. `music-audio.js` sintetiza acordes y ritmos
en el navegador con Web Audio pura — cero librerías, cero samples, cero red. Miguel elige un género,
le da a Tocar y oye el dembow con su progresión encima. Puede prender y apagar casillas de una
rejilla de 16 y oír cómo cambia. **Eso enseña; leer no.**

### Lo que hay (9 pestañas)
`es` Estudio · `fu` Fundamentos (teoría sonora + piano + rejilla) · `gn` Géneros (ADN de 10) ·
`fa` Fábrica (9 estaciones idea→canción, 41 pasos, 9 prompts) · `ar` Arsenal (36 herramientas
investigadas) · `le` Legal (9 bloques + calculadora de splits) · `ne` Negocio · `un` Universo ·
`ca` Catálogo (CRUD de obras).

### Investigación (corte 2026-09-08)
Se investigó y se citó, no se inventó: términos de Suno tras el acuerdo con Warner (nov-2025 —
licencia de explotación, **no** propiedad; plan gratuito no comercial), estado de descargas de Udio
durante la transición con UMG, informe de la US Copyright Office sobre registrabilidad con IA
(29-ene-2025: los prompts solos no bastan), licencias mecánicas para covers y la tarifa por copia,
Content ID de YouTube, política de IA y spam de Spotify (divulgación DDEX), y el circuito colombiano
DNDA / SAYCO / ACINPRO con sus requisitos y causales de devolución reales.

### Regla de integridad aplicada
Cada dato lleva `conf` (**alta** = con fuente / **media** = consenso de oficio / **hipótesis**) y se
pinta como distintivo en la ficha del género. El BPM de la champeta salió marcado `media` con aviso
explícito: **la búsqueda no arrojó ninguna fuente que lo fije**, así que el rango es de oficio y
hay que verificarlo midiendo tracks reales. Mejor un hueco visible que un número inventado.
El arsenal **no afirma precios ni versiones** (regla heredada de 17-IA): categoría de costo
cualitativa + fecha de corte + enlace oficial.

### Los tres fallos que encontró la verificación en navegador
1. **`const MAUDIO` no es `window.MAUDIO`.** Un `const` de nivel superior en un script clásico vive
   en el ámbito léxico global, no como propiedad de `window`. Todos los guardas `if (window.MAUDIO)`
   fallaban en silencio: los acordes no se pintaban y el sonido no arrancaba. Arreglado publicándolo
   explícitamente, igual que `window.NBShared`. **Esto no se ve leyendo el código** — solo probando.
2. **`requestAnimationFrame` puede dar cero frames.** El bucle visual que ilumina el pulso dependía
   de rAF, que se muere cuando el navegador no está componiendo la página. El audio seguía sonando y
   el usuario perdía justo lo pedagógico: ver dónde cae el 1. Cambiado a `setInterval` de 16 ms.
3. **Notación enarmónica.** Mostraba `Cm G# D# A#` donde un músico escribe `Cm Ab Eb Bb`. Para quien
   está aprendiendo a hablar con músicos, eso lo delata. Añadida tabla de bemoles + elección de
   escritura según la tonalidad (círculo de quintas). Ahora Do menor → **Cm Ab Eb Bb**.

### Verificado en navegador (localhost:3456, no solo leyendo código)
Las 9 pestañas renderizan con su contenido completo · progresión i–VI–III–VII en La menor da
**Am F C G** y transpone correcto en 9 tonalidades probadas · Tocar arranca el scheduler, ilumina
los 16 pasos y recorre los acordes · CRUD del catálogo guarda y pinta · la calculadora de splits
bloquea a 90% y genera el acuerdo a 100% · tarjeta en el dashboard + botón en el rail (19) ·
carga dentro del iframe del Cerebro con su nav propia oculta.

### Sync
`mus_songs`, `mus_check`, `mus_univ`, `mus_lab` al SYNC_REGISTRY. `mus_tab` queda local a propósito.
`guardarLab()` va con debounce de 700 ms **porque el slider de BPM dispara `oninput` en cada pixel**
del arrastre — sin eso, arrastrarlo sería una ráfaga de push a Supabase (el mismo motivo por el que
`fin_calc_state` está excluido). Se vacía en `pagehide` y al ocultar la pestaña.
Cache-bust en lockstep: `cloud-sync.js` p17 → **p18 en las 29 páginas**.

### Lo que queda (v2)
- Reproductor de la estructura completa (ahora el loop es de un compás; falta encadenar secciones).
- Exportar el patrón de la rejilla a MIDI para abrirlo directo en FL Studio.
- Metrónomo con cuenta de entrada y compases en 6/8 reales (vallenato merengue, puya, son).
- Fichas de artistas objetivo para el pitch, enganchadas al catálogo.

---

## 🗂 3-ENG · Las pestañas Cuaderno y Método estaban fuera de pantalla — 2026-09-03

### La pregunta de Miguel
> *«¿por qué no veo el módulo de cuadernos?»*

Porque **no estaba en pantalla**. Al añadir «✍️ Escribir» como novena pestaña, la barra pasó a
necesitar 949 px y solo disponía de 808: se cortaban 141 px, y con ellos **📓 Cuaderno y 🎯 Método**.

La regla que lo causaba estaba en `07_css2.css`:
`.tabs{flex-wrap:nowrap; overflow-x:auto; scrollbar-width:none}` — una barra deslizable con la
barra de scroll **oculta**. En móvil funciona (se desliza con el dedo); en escritorio con ratón
**no hay ninguna pista** de que haya más pestañas, así que simplemente desaparecen.

### Por qué mis pruebas no lo vieron
Comprobaba el **panel**, no el **botón**:
`window.APP.go('nb')` → `display !== 'none'` ✓ — y eso pasa aunque el botón esté fuera del borde.
Es la tercera vez en esta serie que una prueba pasa con la cosa rota. Ahora la comprobación de
pestañas hace **clic en el botón real** y verifica que su rectángulo está dentro de la pantalla.

### El arreglo
- **≥ 820 px**: las pestañas envuelven a una segunda fila. Todas visibles, nada que deslizar.
- **< 820 px**: se conserva el deslizamiento (que en táctil es lo correcto) y se añade un
  **degradado en el borde derecho** que avisa de que hay más.

### Verificación
Las 9 pestañas con clic real: botón presente, dentro de pantalla, abre su panel y queda marcado.
Móvil 375 px: Cuaderno alcanzable deslizando, degradado presente, sin desborde de página.
Y sin tocar contenido: 0 falsos positivos en los dos correctores, los tres bancos completos,
laboratorio 640/640, 15 reglas, glosario sin huecos.

---

## 🧠 3-ENG · Morfología del verbo español — 2026-09-02

### La crítica, que era de método
> *«no puedes corregir cositas, debes hacer un cerebro completo, razonable que identifique todo error»*

Miguel escribió «Hice el almuerzo mañana por la tarde» y salió verde. El fallo puntual: `hice` es un
pretérito irregular y mi «detector de verbos» era **una lista de terminaciones**, no un analizador.
Parchear «hice» habría sido otra cosita. Tenía razón en el diagnóstico de fondo: estaba jugando al
topo en vez de construir algo que razone.

### Lo que se construyó
**`MORFO`, un analizador morfológico del verbo español.** Dada CUALQUIER forma devuelve su
infinitivo, su tiempo y su persona:
- conjugación regular completa de `-ar / -er / -ir` en presente, pretérito, imperfecto, futuro y
  condicional
- **38 verbos irregulares** con sus paradigmas completos (ser, estar, haber, tener, hacer, ir,
  poder, decir, ver, dar, saber, querer, poner, venir, salir, traer, oír, andar, conducir…)
- vocabulario de **434 lemas**: los del propio documento (las 2000 palabras traen su traducción, y
  las de categoría «verbo» son infinitivos) más ~150 verbos frecuentes explícitos
- **10.664 formas indexadas**, con `auditar()` de 17 pruebas para poder repetir la comprobación

**Y de esa única fuente salen ahora las comprobaciones**, en vez de una regla suelta por caso:
concordancia de persona (`Yo hizo` → error) y tiempo verbal contra marcador temporal (`mañana` +
`hice` → error). Si una forma es ambigua —`hablamos` es presente y pretérito a la vez— **no se dice
nada**: la ambigüedad es una respuesta legítima.

### Un fallo de clase, no de caso
Al medir apareció que `ser` producía formas inventadas: `se`, `semos`, `sen`. Causa: aplicaba el
generador regular **también** a los verbos que ya tienen paradigma irregular. Por eso «Se jubiló el
año pasado» se leía como un verbo en presente. Arreglado en la raíz —los irregulares se saltan el
generador—, y con ello desaparecieron 364 formas falsas de golpe. **Ese es el tipo de arreglo que
Miguel estaba pidiendo:** uno que elimina una clase entera de errores, no uno.

### Medición
| | falsos positivos |
|---|---|
| al enchufar la morfología | 3 en frases · 5 en ejemplos |
| tras el fallo de clase y quitar `tu` posesivo | **0 · 0 · 0** |

0 en las 1000 frases españolas, 0 en las 1000 inglesas, 0 en los 2000 ejemplos.
Bancos: **66 casos en inglés, 30 en español**, más 17 de morfología. Todos pasando.

### Lo que sigue sin poder hacer, dicho claro
Esto reconoce **estructura**, no significado. Un error de vocabulario, de registro o de matiz se le
escapa, y «identificar todo error» no es alcanzable sin un modelo de lenguaje —que rompería la
regla P1 del proyecto (funcionar sin red) y metería un tercero en el camino crítico. Lo que sí
cambia es el método: **ya no se parchea caso por caso, se amplía el analizador**, y cada frase que
Miguel manda entra al banco de pruebas para que no pueda repetirse.

---

## ⏳ 3-ENG · Marcadores de tiempo — 2026-09-02

### El caso
«Tengo hambre ayer» / «I'm hungry yesterday». Las dos en verde. Ninguno de los dos analizadores
comprobaba lo más elemental: **si dices AYER, el verbo va en pasado**.

Lo llamativo es que **el dato ya estaba en el documento**: cada tiempo del Laboratorio lleva su
campo `pistas` («yesterday · last week · in 2020 · two days ago»). Lo tenía escrito como
explicación y nunca lo había usado como comprobación.

### Lo que se añadió
Chequeo de **marcador temporal contra tiempo verbal**, en los dos idiomas:
- pasado (`yesterday`, `last week`, `X ago`, `in 2020` / `ayer`, `anoche`, `hace X`, `en 2020`)
  con verbo en presente, futuro o continuo → **rojo**, con la frase ya corregida
- futuro (`tomorrow`, `next week` / `mañana`, `la semana que viene`) con verbo en pasado → rojo
- `right now` con presente simple → naranja, sugiriendo el continuo
- **Guarda:** «Desde ayer trabajo aquí» y «Since yesterday I've been here» son correctas — ahí el
  marcador es un punto de partida, no un momento cerrado. Sin esa guarda se marcarían bien frases
  correctas.

### El bug de fondo que esto destapó
`tiempo()` **no reconocía ningún verbo regular en pasado**. La prueba era `esV2(w) && !esPP(w)`,
pero para un verbo regular «worked» es a la vez pasado y participio, así que la condición **nunca
se cumplía**. Consecuencia: *It happened two days ago* se leía como **presente simple**, y el panel
«Qué estás usando» llevaba mintiendo desde el primer día en toda frase en pasado regular.
Reescrito: ahora busca si hay un `have/has/had` haciendo de auxiliar de verdad (con participio
detrás) y, si no lo hay, un verbo en forma de pasado significa pasado simple.

### La barra invertida, por cuarta vez
El heredoc del shell volvió a comerse una barra y dejó `split(/s+/)` en vez de `split(/\s+/)`,
rompiendo la exclusión del marcador **sin dar ningún error**. Van cuatro en esta sesión:
`\s*` → `s*` (coletillas), `\b` → `b` (marcador de futuro), `\s+` → `s+` (separación).
Queda `scratchpad/eng/fix_barras.js`, que además **rastrea** el archivo buscando otras barras
comidas en vez de descubrirlas de una en una. **Regla: nada con regex o comillas pasa por heredoc.**

### Medición
| | falsos positivos |
|---|---|
| al añadir el chequeo | 6 en inglés · 6 en español |
| tras arreglar `tiempo()` y acotar los marcadores | **0 · 0 · 0** |

0 en las 1000 frases inglesas, 0 en las 1000 españolas, 0 en los 2000 ejemplos.
Bancos: **66 casos en inglés, 20 en español**, todos pasando.

### Y un defecto cosmético
La corrección salía como «I was hungry yesterday**..**» porque dos arreglos se solapaban: uno
cambiaba la frase entera y el otro le añadía el punto que ya tenía. Se normaliza al final en vez de
intentar que no se solapen nunca.

---

## 🇪🇸 3-ENG · El semáforo miraba al sitio equivocado — 2026-09-02

### Lo que vio Miguel
Escribió en el recuadro de español **«ayer me comió un manzana»** —que tiene dos errores— y el
semáforo dijo **🟢 Correcta**.

### La causa, que era de diseño
Yo analizaba **siempre el inglés**. Si escribía en español, el traductor convertía su español malo
en inglés bueno (*Yesterday I ate an apple.*) y yo daba el visto bueno **a una frase que él no había
escrito**. La luz estaba mirando al sitio equivocado: no hay error de detección, hay error de a
quién se mira.

### Lo que se hizo
**1 · Analizador de español (`ES`), 100% local.** Revisa:
- **Concordancia de género y número**: `un manzana` → `una manzana`, `la problema` → `el problema`.
  Con las excepciones que hacen falta de verdad: `el agua`/`el área` (femeninas con «a» tónica),
  `la mano`/`la foto`, y los de género común (`el/la colega`, `el/la analista`), donde **las dos
  formas son correctas y por tanto no se corrige nada**.
- **Persona del verbo**: `yo comió` → error. Y `me comió` → aviso naranja con el porqué:
  *«me comió significa que otra persona te hizo eso a ti; si fuiste tú, es me comí»*.
- **Tildes de interrogativos** (`¿donde` → `¿dónde`), solo cuando abren la pregunta.
- **Signos de apertura** `¿` `¡`, mayúscula inicial y ~30 faltas de escritura inconfundibles.

**2 · La luz es la del recuadro donde escribes.** Si escribes en español se revisa tu español y lo
dice (*«revisando tu español»*); el inglés traducido se muestra debajo, pero **no manda en el
semáforo**.

**3 · El análisis del español no espera a la red.** La primera versión lo dejaba detrás del
«⏳ Traduciendo…» y no se veía nada. Es local: sale en cuanto escribes, con o sin internet.

### Medición, con la misma disciplina
Corpus: las **1000 traducciones al español** de las frases y los **2000 ejemplos** de las palabras,
que son español correcto conocido.

| ronda | falsos positivos |
|---|---|
| primera versión | 6,30 % |
| tras arreglar `\b` con acentos y excluir números | 1,70 % |
| tras género común, «-ma» ambiguo y quitar mucho/todo | 0,30 % |
| final | **0,00 % en las 1000 frases · 0,00 % en los 2000 ejemplos** |

Y 9/9 errores de español cazados, banco de 14 casos entero, **sin tocar el inglés** (sigue en 0
falsos positivos y 58/58 de su banco).

### El bug más instructivo
`\bd\b` **encontraba la «d» de «días»**: para JavaScript la «í» no es carácter de palabra, así que
hay frontera ahí. Marcaba «Buenos días» como falta. Se resolvió con una frontera propia que incluye
vocales acentuadas y ñ. **En español, `\b` no sirve.**

### Criterio que se repitió
Donde el español admite las dos formas —`el/la colega`, `-ma` (problema es masculino pero cama es
femenino), `mas` sin tilde que sí existe— **no se corrige**. Inventar un error es peor que dejar
pasar uno.

---

## 🧠 3-ENG · Motor v2 del corrector — 2026-09-02 (la frase que pasó por buena)

### El fallo
Miguel escribió **«Why do you aren't finished your university?»** y el corrector la marcó **verde**.
Es una frase rota: tiene `do` y `aren't` — **dos auxiliares conjugados pegados**. Ninguna de las
15 reglas miraba eso. Un falso NEGATIVO así es peor que un falso positivo: le enseña que algo
incorrecto está bien.

### La pieza que faltaba: la cadena verbal
En inglés el grupo verbal tiene un orden fijo — `[modal] [have] [be-progresivo] [be-pasivo] VERBO` —
y solo puede haber **un** auxiliar conjugado por oración. Además `do/does/did` es un motor de
arranque de emergencia: si ya hay otro auxiliar, sobra. Eso ahora se comprueba (`CADENA`), con tres
chequeos: dos motores en la misma frase · dos verbos conjugados pegados · la forma que exige cada
auxiliar (`have` pide participio, `be` pide -ing, los modales piden el verbo desnudo).

### Lo más difícil: distinguir auxiliar de verbo léxico
El validador ingenuo marcaba **media conversación** como error (6,5 % de las 1000 frases):
- «Do you **have** a reservation?» → ahí `have` es *tener*, no un auxiliar
- «What do you **do**?» → el segundo `do` es el verbo
- «I'm afraid **I** can't» → son dos oraciones sin «that» en medio
- «It's cold, isn't it?» → la coletilla lleva su propio auxiliar
Se resolvió con `esAuxiliar()`: un `have` solo es auxiliar si le sigue un participio; un `be`, si le
sigue -ing o participio; un `do`, si le sigue otro verbo. Y `clausulas()` corta también cuando
aparece un sujeto nuevo tras un verbo ya conjugado.

### Dos bugs propios que salieron al medir
- `conj()` **no doblaba la consonante**: generaba `permited` y marcaba como error el correcto
  `permitted`.
- Exigía `gotten` y rechazaba `got`, que es igual de válido.
La solución no fue afinar la regla hasta el infinito sino **aceptar las variantes** (`formasValidas`):
prefiero dejar pasar un error a inventarme uno. Y `verboConocido()` impide exigir formas a palabras
que solo reconozco por la terminación — «passionate» no es un verbo por acabar en -ate.

### Sugerencias · «¿Quieres decir…?»
De la frase rota se extrae la **intención** (quién, qué acción, negada o no, qué pregunta) y se
reconstruyen frases correctas con **el mismo generador que produce las 640 del Laboratorio**. No es
adivinar: sale de una gramática ya verificada. De su ejemplo salen tres, con su español:

1. **Why haven't you finished university?** — Presente perfecto — *¿Por qué no has terminado la universidad?*
2. **Why didn't you finish university?** — Pasado simple — *¿Por qué no terminaste la universidad?*
3. **Why hadn't you finished university?** — Pasado perfecto

La primera es **idéntica** a la que le dio Google Translate. Además quita el posesivo donde el
inglés no lo usa (`your university` → `university`, como *go to school*).

### Diccionario más completo
+250 verbos frecuentes que no estaban en las 2000 (sin ellos no reconocía «finished» ni «missed»),
y un adivinador por terminación para lo que no está en ninguna lista — usado **solo para orientar**,
nunca para afirmar un error.

### Medición
| | falsos positivos (sobre las 1000 frases correctas del documento) |
|---|---|
| validador nuevo, primera versión | 6,50 % |
| tras separar auxiliar de verbo léxico | 0,90 % |
| tras aceptar variantes de participio | 0,20 % |
| final | **0,00 %** |

Y a la vez: **20/20 errores cazados** (los 19 de antes + el de Miguel) y el banco de 53 casos entero.

### Segunda ronda, probando con errores tipicos
Salieron cuatro defectos mas, todos arreglados y con su caso en el banco:
- **«What you did yesterday?» pasaba por buena** — otro falso negativo. Mi guarda «el WH es el
  sujeto» era demasiado amplia: solo vale si NO hay otro sujeto detras.
- Las sugerencias **perdian el modal**: de «Do you can help me?» proponian «Do you help me?».
  Ahora conservan el modal → **«Can you help me?»**.
- **Arrastraban el error señalado** a la sugerencia (). Ahora lo corrigen.
- **«I no have money»** (el calco de «no tengo dinero») pasaba por buena. En ingles  solo
  niega sustantivos; al verbo lo niega . Acotado al patron SUJETO + no + VERBO para no
  tocar los modismos («Long time no see», «No pain, no gain»).

**Marcador final: 0 falsos positivos en las 1000 frases · 24/24 errores cazados · banco de 58 casos entero.**

---
### Lo que NO hace
No es una inteligencia artificial y no llega al 100 %. Reconoce estructuras, no significado: puede
dejar pasar un error de vocabulario o de matiz. Cuando no sabe, **lo dice** en vez de inventar un
veredicto — esa es la línea que no se cruza.

---

## ✍️ 3-ENG · Escribir + buscador de diccionario — 2026-09-02

Dos encargos de Miguel: (1) que cualquier palabra, en cualquier módulo, lleve al mejor recurso
gratis con muchísimo más contexto; (2) un módulo para escribir sus propias frases, con traducción
en los dos sentidos, corrección explicada y semáforo verde/naranja/rojo.

### 1 · El buscador de contexto
Los cuatro recursos se **probaron abriéndolos de verdad** con la palabra "as" el 02-sep. Los cuatro
cargan completos, sin login ni muro de pago, y cada uno da un tipo **distinto** de contexto:

| | para qué es el mejor |
|---|---|
| **WordReference** | Sentidos separados por función, **cada uno con su ejemplo traducido**, + foros de nativos. El mejor para una palabra suelta. |
| **Cambridge** | Nivel CEFR de la palabra (A1/A2/B1…), recuadros de gramática, ejemplos graduados. El mejor para *aprenderla*. |
| **Reverso Context** | Frases reales en los dos idiomas, lado a lado. **El mejor para expresiones de varias palabras.** |
| **YouGlish** | La palabra dicha por gente real en miles de vídeos. El mejor para el oído. |

Se abre con **doble clic sobre cualquier palabra del documento** — así funciona en todos los
módulos sin tocar el render de ninguno — y con el botón 🔎 en las filas de palabras y de frases.
Una palabra suelta ofrece WordReference primero; una expresión, Reverso.

### 2 · El módulo Escribir (pestaña ✍️, pane `wr`)
Dos recuadros, EN y ES. Escribes en cualquiera y el otro se rellena. Debajo: semáforo, las
**6 piezas** de tu frase con los colores de siempre, qué tiempo y forma estás usando (con la
explicación **reutilizada de `LAB_T`**, no duplicada), los hallazgos con ✗/✓ y el porqué, y la
frase corregida.

**Decisión de arquitectura (regla P1: ningún tercero en el camino crítico):** el **analizador es
100% local y determinista** — funciona sin internet. La traducción es un apoyo con red; si falla,
se dice y todo lo demás sigue entero.

**El corrector no es una IA.** Se apoya en lo que ya había: las 2000 palabras **con su categoría**
(491 verbos, 877 sustantivos, 241 adjetivos, 28 preposiciones) son su diccionario; las 15 reglas
no negociables son sus chequeos. Se le añadieron 85 verbos irregulares, los incontables y 11
trampas de calco del español (edad con *have*, *depends of*, *since two years*, *I am agree*…).

### El traductor: se eligió con evidencia, no por fama
Probados **desde el origen real** `mikel696.github.io` (el proyecto ya tuvo un incidente con un
tercero que respondía distinto según el `Origin`), con 6 frases de control:

| API | aciertos | veredicto |
|---|---|---|
| `translate.googleapis.com` (gtx) | **6/6** | elegido |
| Lingva | 0/6 | caído |
| MyMemory | 3/6 | **descartado como principal** |

MyMemory devolvía `I have been working here for two years` → *"elaborado a clic durante cuatro
años"*, y *"dos años"* → *"four years"*. Eso no es traducir: es enseñar cosas falsas. Queda solo
como respaldo es→en, donde sí acertaba.

### La medición que lo cambió todo: falsos positivos
Un corrector que marca en rojo inglés correcto es **peor que no tener corrector**. Se midió contra
las **1000 frases del propio documento**, que son inglés correcto conocido:

| ronda | falsos positivos |
|---|---|
| primera versión | **19,9 %** (199 de 1000) |
| tras arreglar 11 causas | 5,3 % |
| tras degradar R16 y arreglar R3/R4/R5 | 1,10 % |
| tras coletillas y elípticas | **0,00 %** |

Y a la vez, el banco de 42 casos con respuesta conocida (19 malos que **deben** salir rojos) pasa
entero. Las causas fueron todas mías: `raiz()` devolvía «works» en vez de «work»; R3 solo miraba la
posición 1 y no reconocía *«How long have you been here?»*; R9 no distinguía *touch* sustantivo de
verbo; R4 no entendía el modal perfecto *«could have told»*.

**La decisión de fondo:** R16 («no hay verbo») pasó de **error a aviso**. Con 491 verbos no puedo
demostrar que *«I missed my flight»* no tiene verbo — el que no lo conoce soy yo. **Afirmar un
error desde la propia ignorancia es justo lo que este proyecto no hace.** Ahora dice: *«puede ser
que el verbo no esté entre las 2000, no que falte»*.

### La corrección se auto-verifica
Antes ofrecía *«She works here since two years.»* como «tu frase corregida» — había aplicado la -s
pero no el *since→for*, y **la presentaba como buena**. Ahora, tras aplicar los arreglos, **vuelve
a analizar el resultado**: si sigue habiendo rojos, la etiqueta cambia a *«Corregí lo que pude —
todavía no está lista»*, dice qué falta y **no ofrece guardarla**. Dar por buena una frase que
sigue mal es el mismo pecado que inventarse un dato.

### Verificación
0 falsos positivos en 1000 frases · 42/42 del banco · las 9 pestañas · laboratorio 640/640 ·
fichas · 15 reglas · glosario sin huecos · chips `data-goto` · favoritos sin ids inválidos ·
🔎 abre los 4 recursos · traducción en los dos sentidos comprobada en vivo · móvil 375px sin
desborde (el único es `.hero`, que ya venía de antes) · **0 errores de consola**.

Colisiones: `data-say`, `data-nb-en`, `data-nb-es` son **reuso deliberado** de handlers que ya
existían — el botón «guardar en mi cuaderno» no lleva JS propio. Ningún choque nuevo de clase ni de id.

### Nota de oficio
Tres veces en esta sesión el heredoc del shell se comió las barras invertidas de una expresión
regular (`\s*` → `s*`), y una de ellas dejó el chequeo de coletillas muerto sin avisar.
**Para contenido con regex o comillas: herramienta de escritura o edición exacta, nunca heredoc.**
Y cuando la reinyección repetida de bloques solapados rompió el archivo, lo que funcionó fue
**restaurar del respaldo y aplicar el parche una sola vez**, no seguir parcheando encima.

---

## 🧪 3-ENG · Laboratorio v2 — 2026-09-01 (la seccion que le gusto, potenciada)

> Miguel: *"me encantó la seccion de Laboratorio, puedes ampliarla con mas ejemplos y dar mejor
> las explicaciones… potenciala a lo que mas puedas, sin dañar nada"*.

### De 100 a 640 frases, y de una explicacion a cinco

| | antes | ahora |
|---|---|---|
| Frases base | 5 | **16**, agrupadas (Trabajo · Día a día · Estudio · Irregulares clave) |
| Tiempos | 5 | **10** (+ going to, pasado continuo, pasado perfecto, presente perfecto continuo, would) |
| Combinaciones | 100 | **640** |
| Explicacion | 1 linea | **5 bloques** por frase |
| Vistas | 1 + casilla | **4** |

**Los 5 bloques de cada frase:** que hace el auxiliar ahi · **por que el verbo va en esa forma** ·
**cuando la usarias de verdad** (+ las palabras que delatan el tiempo: *always, yesterday, for two
years…*) · **el error tipico del hispanohablante** con ✗/✓ · **donde cae en la linea del tiempo**
(barra visual con ANTES / AHORA / DESPUES; punto, tramo punteado o flecha segun el tiempo — para un
aprendiz visual eso vale mas que el nombre del tiempo).

**Las 4 vistas:**
- **🔍 Una sola** — el detalle completo, + botones «guardar en mi cuaderno» y «otra al azar».
- **📅 Los 10 tiempos** — ahí se ve **aparecer** el auxiliar: `sin auxiliar · sin auxiliar · will ·
  am · am · was · have · had · have · would`.
- **🔀 Las 4 formas** — ahí se ve **moverse**. Con presente perfecto continuo queda clarisimo:
  `have` salta a la casilla 1 al preguntar y **`been` nunca se mueve**.
- **🎯 Ponte a prueba** — la frase con el auxiliar en blanco y 4 opciones. La opcion **«(ninguno)»**
  es la mejor pregunta del modulo: `She ? lives in Bogotá` obliga a saber que el presente simple
  afirmativo **no lleva auxiliar**. Marcador de aciertos, feedback con la explicacion y audio.

### Reuso en vez de codigo nuevo
El boton «guardar en mi cuaderno» no lleva JS propio: usa los atributos `data-nb-en` / `data-nb-es`
y el handler global que **ya existia**. Igual el audio con `data-say`. Cero superficie nueva.

### Verificacion
- **Las 640 frases generadas y revisadas.** Participios irregulares correctos: *written, eaten,
  driven, spoken, gone, done, taken, bought*. Detector de patrones imposibles (modal + verbo
  conjugado, doble marca de tiempo, have + -ing sin been): **0 coincidencias**.
- `APP.LAB.auditar()` queda en el codigo para repetir la comprobacion desde consola.
- 60 retos seguidos: esqueleto siempre bien formado, sujeto en minuscula a mitad de frase,
  signo de cierre conservado.
- Movil 375px: las 4 vistas sin desborde horizontal.
- Regresion: 8 pestañas · fichas · 15 reglas · glosario sin huecos · chips `data-goto` ·
  favoritos de palabra y frase sin ids invalidos · 2000 palabras · 1000 frases · `SYNC.KEYS` 7 ·
  **0 errores de consola**.

### Dos defectos que aparecieron al MIRAR la captura, no al leer el codigo
1. En el reto, el esqueleto mostraba `? They eaten breakfast` — sujeto en mayuscula a mitad de
   frase y sin el signo final.
2. Cuando la respuesta era «(ninguno)», el hueco salia **delante del sujeto**, sugiriendo que ahi
   iria un auxiliar. Ahora va entre sujeto y verbo, que es donde se duda de verdad.

### El auditor de colisiones, arreglado
`scratchpad/eng/auditar.js` compara clases, ids y `data-*` nuevos contra los previos. **Estaba dando
falsos positivos** (dijo que `.fp` y `.lt` ya existian; ninguna de las dos era cierta) porque el
escapado se corrompia al ir en linea con `node -e`. Ahora va como archivo y lleva un **control
positivo**: comprueba que detecta `data-fp`, que si existia. Un auditor que no puede fallar no sirve.
Con el arreglado: 0 choques de clase, 0 de id, y el unico `data-*` compartido accidental (`data-v`)
renombrado a `data-labv`. Los que quedan (`data-say`, `data-nb-en`, `data-nb-es`) son **reuso
deliberado**.

---

## 🩹 3-ENG · la colision de atributos que corrompia favoritos — 2026-09-01

### Lo que Miguel vio
> *"al darle desplegar a cualquier, por ejemplo al sujeto, no se despliega y dice añadida a practicas?"*

### Dos fallos, y el segundo estaba tapado por el primero

**1 · Colision de `data-*` con corrupcion de datos.** El proyecto YA tenia un handler global
`closest('[data-fp]')` = *marcar frase favorita*. Yo use `data-fp` para las fichas nuevas, asi que
cada click hacia `+fp.dataset.fp` → `+"suj"` → **NaN**, metia `NaN` en `eng_fav_p` y ese NaN
**se sincronizaba a los otros dispositivos**. No era un boton que no abre: era escritura de basura
en el dato del usuario.

Habia **tres** colisiones, no una:
| mio | ya existia | consecuencia |
|---|---|---|
| `data-fp` | favorito de frase | NaN en `eng_fav_p` |
| `data-goto` | 11 chips que saltan a Palabras filtradas | mi handler cerraba las fichas al azar |
| `data-g` | notas del SRS, leidas con `+b.dataset.g` | latente |

Renombrado todo lo mio a nombres que no existian: `data-ficha`, `data-fichah`, `data-pieza`,
`data-glo`. Verificado que el bloque didactico tiene **0** apariciones de los tres originales y que
los originales siguen intactos.

**2 · Referencia muerta del renombrado anterior.** Al pasar `.pz-*` → `.fp-*` (para no chocar con
la pestaña Piezas) renombre el atributo `data-pzt` pero **no** su lectura `b.dataset.pzt`. Leia
`undefined`, asi que `abierta` siempre quedaba en `undefined` y ninguna ficha abria nunca.

**Por que mi prueba no lo detecto:** comprobaba `acordeonCierra: true`, que **da verdadero
justo cuando la funcion esta rota** (nada abierto → nada que cerrar). Y el otro caso que probe
—la leyenda— usaba una ruta de codigo distinta (`PZ.abrir`) que si funcionaba.
**Leccion: una prueba que pasa con la funcion rota no es una prueba.** Toda prueba de "abre"
tiene que afirmar contenido visible (`offsetHeight > 80` + hay ejemplos), no ausencia de estado.

### Reparacion del dato (P0)
`favLimpios()` filtra al leer: solo enteros dentro del catalogo (`1..WORDS.length`). Todo lo demas
—null, NaN, texto, fuera de rango— se descarta. `sanearFavs()` reescribe limpio **una sola vez** y
solo si de verdad sobraba algo; un favorito legitimo nunca se toca. Probado sembrando basura:
`[5,null,12,"suj",99999,7]` → `[5,12,7]`.

### Barrida de regresion (click real, no llamada a funcion)
Lo mio: 6 fichas abren con contenido/ejemplos/regla/error/tip y cierran · leyenda → ficha ·
glosario abre y cierra con Escape · laboratorio (presente af sin auxiliar, continuo con `am`,
contraccion `I'm not`) · 15 reglas con sus 15 ✗/✓.
Lo que ya existia: favorito de palabra y **de frase** (sin ids invalidos) · los 11 chips
`data-goto` filtran por categoria **y ya no mueven las fichas** · 8 pestañas · 12 piezas ·
bifurcaciones · cajas de Leitner · **cuaderno: crea, edita y autoguarda, y el auto-marcado del
glosario no entra ahi (0 `.gl` dentro de `#nb`)** · Ctrl+K · `SYNC.KEYS` con sus 7 claves ·
0 errores de consola.

### Regla que queda
**Antes de inventar un `data-*` o una clase, buscarla en el archivo.** No basta con revisar
las clases CSS: los atributos tienen handlers globales que no se ven desde el CSS.

---

## 🧭 3-ENG · ESTRUCTURA didactica — 2026-09-01 (la funcion sin ejemplo)

### El defecto que lo origino
Miguel leyo la tabla de las 6 piezas y encontro esto:

> *"la funcion del auxiliar, «Marcar tiempo» no tiene ningun ejemplo para mi entendimiento"*

La fila decia que el auxiliar sirve **"al negar, preguntar o marcar tiempo"** y solo enseñaba
un ejemplo de *negar*. Tres funciones nombradas, una ilustrada. Tenia razon.

**La leccion, que vale para todo el proyecto:** *nombrar una funcion no es explicarla*. Si un
texto enumera N cosas que algo hace, tiene que traer N ejemplos. Una lista sin ejemplos se lee
como si fuera informacion, pero no enseña nada — y el hueco solo se descubre cuando alguien
intenta usarla. **Regla nueva: toda funcion enumerada lleva su propio ejemplo.**

### Lo que se hizo (todo aditivo — no se borro nada)

**1 · La tabla de las 6 piezas, con ejemplo por caso.** Las seis filas ahora traen sus casos
ilustrados dentro de la celda. La del auxiliar enseña sus **tres** trabajos:
- negar → *I work here* → *I **don't** work here*
- preguntar → *You work here* → ***Do** you work here?*
- **marcar tiempo** → *I work* → *I **am** working · I **have** worked · I **will** work · I **had** worked*

**2 · Seccion `01b` · Ficha completa de cada pieza.** Seis fichas plegables (`#fpBox`), datos en
`PIEZAS`. Cada una: *en palabras simples* · **24 casos con 59 ejemplos con audio** · regla no
negociable · el error tipico del hispanohablante (✗ vs ✓ con el porque) · tip. Arranca abierta la
del auxiliar. Los seis colores de la leyenda son botones que llevan a su ficha.

**3 · Seccion `01c` · Laboratorio de transformacion (`#labBox`, modulo `LAB`).** La pieza clave.
5 frases base × 5 tiempos × 4 formas = **100 combinaciones generadas**, con las casillas de
colores y un panel que dice *que esta haciendo el auxiliar ahi*. La casilla "ver los 5 tiempos a
la vez" pone en una columna `sin auxiliar · sin auxiliar · will · are · have`: ahi «marcar tiempo»
deja de ser una frase de tabla y se ve.

**4 · Seccion `05` · Las 15 reglas no negociables (`#regBox`).** Las que, si se rompen, la frase
deja de ser ingles. Cada una con el error real que produce. "Como usar este documento" paso a `06`.

**5 · Glosario emergente (`GLOSARIO`, 30 terminos) + auto-marcado (`glAutoMarcar`).** Marcar a mano
cada termino en 660 KB no escala y siempre quedan huecos — que es exactamente el bug original. El
auto-marcado recorre **solo nodos de texto** y envuelve las primeras apariciones de cada termino en
los paneles de explicacion (`p0`, `pz`, `p3`): **74 marcados, 0 sin definir**. Nunca toca atributos,
codigo, ejemplos, ni el cuaderno (`contenteditable`), asi que no puede corromper contenido.

### Verificado en navegador (no leyendo el codigo)
- **Diff contra produccion antes de construir:** 16 lineas reemplazadas, **todas** las que se
  quisieron enriquecer. Cero perdidas accidentales.
- **Las 100 combinaciones del laboratorio revisadas una por una**, gramaticalmente correctas.
- **El auto-marcado es demostrablemente sin perdida:** se clona cada panel, se le pasa el marcador
  otra vez y `textContent` antes === despues en los tres. Prueba reproducible en consola.
- 8 pestañas renderizando · 2000 palabras · 1000 frases · 97 elementos de bifurcaciones ·
  12 piezas · SYNC con todos sus metodos · **0 errores de consola**.
- Glosario abre/cierra, Escape funciona, la leyenda abre su ficha, el acordeon alterna,
  Ctrl+K sigue vivo. Movil 375px: sin desborde horizontal, la rejilla del laboratorio colapsa.

### Dos defectos encontrados **probando**, no leyendo
1. `Do They eat breakfast?` — el sujeto conservaba la mayuscula a mitad de frase.
2. `I do not work at a bank.` — mostraba la forma larga, justo lo que la **regla 12 del propio
   documento** dice que nadie usa hablando. Ahora manda la contraccion (`I don't work`) y la forma
   larga queda debajo como referencia.

### Colisiones evitadas (por que las clases se llaman `fp-` y no `pz-`)
`.pz`, `.pz-h`, `.pz-b` **ya existian** en `07_css2.css` para la pestaña Piezas. Usar ese prefijo
habria roto esa pestaña. Se renombro todo a `.fp-`. Igual `.bad`/`.good`: existen como selectores
compuestos (`.qz-o.bad`, `.bf-q.bad`) y una regla suelta les habria cambiado el color — se usa
`.dx-bad`/`.dx-good`. **Antes de crear una clase, buscarla.**

### Archivos
`frontend/pages/english-engine.html` (665 KB, autocontenido). Partes en el scratchpad:
`15_glosario.js` · `16_piezas.js` · `17_didac.css` · `18_glosauto.js`, ensambladas dentro del
IIFE de `APP` por `patch_wire.js` / `patch_auto.js`. **No toca `cloud-sync.js`** — lleva su SYNC
propio embebido, asi que no obliga a subir version en las 28 paginas.

---

## 🥋 17-IA · AI DOJO — 2026-08-28 (rediseño desde el metodo)

### El error, y por que importa
La primera version copio literalmente el molde del English Engine: vocabulario por frecuencia,
Leitner, flashcards. **Miguel lo rechazo en cuanto lo vio**, y tenia razon:

> *"creo que tomaste todo literal, no era copiar el curso de ingles, tenias que analizar que para
> estudiar IA es diferente."*

Lo es, y de forma fundamental. **En ingles el cuello de botella es la MEMORIA** — hay que recuperar
la palabra en medio segundo mientras hablas, y por eso Leitner y 2000 palabras funcionan. **En IA el
cuello de botella es el CRITERIO**: la informacion esta a un clic, lo que falta es saber que pedir y
si lo que volvio sirve. Y el criterio no se memoriza — se construye produciendo y juzgando.

Ademas el error caro es distinto: en ingles es decir mal una frase (se corrige y ya); en IA es
**aceptar una respuesta falsa que suena perfecta** — y ese error no se nota, que es su gracia.

**Leccion para el proyecto: antes de copiar la forma de un modulo que funciona, preguntarse si el
problema que resuelve es el mismo.** Copiar la forma sin el diagnostico es lo que produjo la v1.

### Lo que se construyo
`frontend/pages/ai-dojo.html` · **3.979 lineas · 348 KB · cero dependencias**

Un taller, no un diccionario. Todo pide **producir un artefacto** con un caso real.

| Pestaña | Qué entrena | Contenido |
|---|---|---|
| 🎼 **Proyectos** | Orquestar | **15 partituras multi-IA con ejecutor** |
| 🎯 Misiones | La rutina | 42 reps en 6 cinturones |
| 🛠️ Banco | Encargar | Constructor de encargos + auditor |
| ⚔️ Ring | Elegir | Comparador → su tabla personal |
| 📐 Criterio | **Juzgar** | 18 casos de caza + 10 rúbricas |
| 🧠 Saber | Soporte | 52 conceptos, cada uno con "qué haces distinto" |
| 🎒 Evidencia | Demostrar | Portafolio + su banco de pruebas |

### La pieza estrella · el ejecutor de partituras
Cada proyecto reparte un trabajo entre 3-6 herramientas. Cada paso trae el prompt exacto, y **lo que
el usuario pega de vuelta se inyecta automaticamente en los prompts de los pasos siguientes**
(marcador `{{N}}`). Es lo que convierte una guia en una herramienta: no lee sobre orquestacion,
orquesta. Con puntos de control humanos donde no se puede seguir a ciegas.

Ejemplos: *El informe blindado* (investigar con fuente → redactar → criticar con OTRO modelo →
verificar dato por dato) · *El detective de la conciliacion* (anonimizar en local → analizar con el
modelo grande → aplicar sobre lo real, **sin que ningun dato de cliente salga del equipo**) ·
*La fabrica con red* (modelo pequeño procesa, aparta lo dudoso, modelo grande resuelve, tu firmas).

### Decisiones de diseño que vale la pena conservar
- **La habilidad central es JUZGAR, no saber.** Por eso existe la caza de fallos: 18 salidas de IA
  realistas con un fallo escondido. Se entrena como un radiologo mira placas.
- **La tabla de herramientas se DERIVA de sus veredictos**, no se escribe aparte. Asi refleja lo que
  midio el, y no caduca porque la actualiza al usarla.
- **El "que hacer hoy" se calcula del estado real**: proyecto a medias > mision del cinturon actual >
  proyecto nuevo. Una sola recomendacion, no un menu.
- **El auditor del banco no puntua el texto**: comprueba que piezas faltan y que riesgo se esta
  corriendo (datos sin proteccion contra invento, calculo sin codigo, pregunta que invita al si,
  material sin blindaje contra inyeccion, datos sensibles).

### El Engine no se tiro: cambio de papel
`ai-engine.html` sigue vivo como **la biblioteca** (283 terminos, 31 fichas, 98 prompts) y se enlaza
desde el Dojo. Pero deja de ser la puerta de entrada: **la biblioteca se consulta, el taller se
practica.**

### Verificado en navegador
15 proyectos · 42 misiones · 6 cinturones · 18 casos de caza · 10 rubricas · 52 conceptos · 6 piezas ·
8 plantillas. Probado el flujo completo: **encadenamiento del ejecutor** (pegar salida del paso 1 →
aparece dentro de los prompts de los pasos 2 y 3), auditor del banco pasando de 1/6 a 5/6, Ring con
estrellas y tabla personal derivada, caza con feedback, mision marcada y contadores de portada
actualizados. Cero errores de consola. Validador de datos en el scratchpad que ademas comprueba el
invariante de las inyecciones (`{{N}}` siempre apunta a un paso anterior).

---

## 🎁 1-IND · OFERTAS REALES — 2026-08-27 (rediseño + auditoria de enlaces)

Miguel pidio ofertas de verdad, no una lista de portadas. Lo primero fue auditar lo que
habia: **de 16 enlaces, 4 estaban rotos o mentian**.

| Enlace | Problema |
|---|---|
| `linio.com.co/ofertas` | **muerto** (000). Linio Colombia ya no existe, lo absorbio Falabella |
| `alkosto.com/computadores-tablets` | 404 |
| `amazon.com.co/deals` | decia «Amazon Colombia» pero **redirige a Amazon US** — Amazon no opera en Colombia |
| `falabella.com.co/.../ofertas` | la coleccion no existe, tira a la portada |

### El criterio del rediseño
Un enlace a «Amazon Deals» no es una ventaja: lo tiene cualquiera. La ventaja es **saber si
el descuento es real**. Por eso ahora cada enlace lleva un campo `why` que explica que te da,
y hay una categoria entera dedicada a **historico de precios** (CamelCamelCamel, Keepa).

**6 categorias · 35 enlaces**, priorizando lo que pidio (educacion, Amazon, compras, juegos):
1. **Gratis por ser estudiante** — lo de mas valor sin reclamar. GitHub Student Pack de
   primero: JetBrains completo, $200 DigitalOcean, dominio. Azure $100 sin tarjeta.
2. **Cursos y certificados gratis** — Class Central, Kaggle Learn, freeCodeCamp, CS50.
3. **Cupones Udemy** — Real.Discount, DiscUdemy, CouponScorpion, UdemyFreebies.
4. **Antes de comprar** — CamelCamelCamel y Keepa. La ventaja real.
5. **Juegos** — Epic semanal, GOG, Prime Gaming, IsThereAnyDeal, SteamDB.
6. **Colombia** — MercadoLibre, Exito, Ktronix, Alkosto, Falabella.

### Precision, no promesa
El GitHub Student Pack se anuncia con el matiz real: **los registros de Copilot Pro se
pausaron en abr-2026** y hoy dan Copilot Free. Prometer Copilot Pro habria sido vender humo.

### Verificacion
**Los 35 enlaces comprobados uno por uno: 0 rotos.** 32 responden 200; 3
(CamelCamelCamel, Slickdeals, SteamDB) devuelven 403 a curl pero se confirmo por cabeceras
que estan **vivos detras de Cloudflare** (`Server: cloudflare` + `cf-ray`), no caidos.

UI: de lista plana estrecha a panel de 520 px con categorias, nota por categoria, insignia
TOP en los 9 de mayor ventaja y el porque bajo cada nombre. Movil 375 px: 338 px de ancho,
sin desborde. Dashboard intacto (15 modulos, feed, reloj). Respaldo del `renderDeals` viejo:
si `dealsV2` faltara, cae al listado simple en vez de quedar vacio.

---

## 🧭 3-ENG · ESTRUCTURA puesta al dia — 2026-08-27

Miguel iba a empezar a estudiar y detecto que la pagina de entrada mentia: decia
«se pinta con estos CUATRO colores» y la leyenda mostraba SEIS. Auditoria completa
del pane: eran **cuatro desajustes**, no uno.

| Decia | Realidad | Arreglo |
|---|---|---|
| «cuatro colores» | 6 en la leyenda | Tabla de las 6 con **cuando aparece cada una** |
| «Siete pestanas» | 8 desde hoy | Ocho, y con Bifurcaciones entre los pasos |
| 4 stats (2000/1000/5/3) | 8 modulos | 6 stats, con Bifurcaciones y Piezas |
| hero: «2000 palabras y 1000 frases» | tambien piezas y bifurcaciones | mencion completa |

**El arreglo de los colores es mejor que corregir el numero.** En vez de decir «son seis»,
ahora una tabla explica que **no todas aparecen siempre**: SUJETO y VERBO son obligatorios
(y omitir el sujeto es el error que mas delata al hispanohablante), COMPLEMENTO casi
siempre, y AUXILIAR / not / WH **se encienden** solo al negar o preguntar. Ese encendido
es exactamente lo que enseñan el Molde 2 y el Molde 3 de mas abajo, asi que la tabla ahora
prepara lo que sigue en vez de contradecirlo.

### Añadido: «Tu primera sesion»
Bloque nuevo arriba del todo con un plan de 30 min por minutos (10 estructura · 10
bifurcaciones QUE y NO · 8 frases de saludos · 2 practica) y tres botones que saltan.
Pedido por el contexto: dijo «para comenzar ahora si mi estudio».

### De paso
- `st3` (bifurcaciones) sale de `BIFUR.length`, no de un numero escrito a mano — no se
  puede volver a desincronizar.
- El **buscador global ahora indexa las bifurcaciones**: buscar «QUE» muestra
  «QUE → THAT · WHAT · TO · THAN» y al abrirla filtra esa ficha.
- Etiquetas corregidas: el panel de sync ya decia que sincroniza y no listaba
  bifurcaciones; el pie del buscador prometia lo que no indexaba.

### Verificacion
Las 4 afirmaciones falsas ya no aparecen. Botones de primera sesion y del Paso 3 llevan a
`bf`. Buscador encuentra y abre bifurcaciones. Regresion: 2000 palabras, 1000 frases, 12
piezas, 24 bifurcaciones, quiz, 6 plantillas, 5 cajas, 12 videos, filtros contraibles
364→58 px. Movil 375 px sin desbordes en las 8 pestanas.

---

## 🔀 3-ENG · BIFURCACIONES — 2026-08-27 (la tecnica de pizarra de Miguel)

Miguel mando dos fotos de pizarra (THAT/WHAT/TO y DONT/DIDNT/WONT) y pidio copiar y
mejorar esa tecnica. **Lo que la hace funcionar** no es que sea gramatica bonita: es que
**parte de su confusion, no del ingles**. Una palabra suya (QUE, NO) que se bifurca en
varias inglesas, con el oficio de cada rama en una linea.

### Las 5 mejoras sobre la pizarra original
1. **El hueco lo llena el.** La foto trae la respuesta escrita; aqui elige y recien ahi
   aparece el porque. Si acierta de casualidad, la explicacion se lo dice igual.
2. **Test de 3 segundos por rama.** La pizarra solo etiqueta el oficio ("Preguntas");
   aqui cada rama trae como DECIDIR sin pensarlo.
3. **La trampa del espanol** en cada bifurcacion: el ✗ concreto y su ✓.
4. **Audio** en cada rama y en la frase completa al acertar.
5. **Progreso**: marca las dominadas, filtro de pendientes, y sincroniza cross-device
   (`eng_bifur` sumada a SYNC.KEYS).

### Contenido · 24 bifurcaciones verificadas
QUE · NO · POR/PARA · HACER · DECIR · ESPERAR · VER/MIRAR · MUY/MUCHO · YA/TODAVIA · EN ·
SER/ESTAR · SABER/CONOCER · PEDIR/PREGUNTAR · LLEVAR/TRAER · HAY · DESDE/HACE ·
TAMBIEN/TAMPOCO · CUANTO · COMO · TOMAR · PONER · DE · SI · QUEDAR.

Incluye dos **inversas** (SER/ESTAR y SABER/CONOCER: dos palabras suyas -> una sola
inglesa) porque son las unicas que le REGALAN trabajo, y eso motiva.

### Fidelidad visual
Se reprodujo el look de pizarra con CSS: circulo verde ovalado (`border-radius:50%/58%`)
rotado -1.5deg alrededor de la palabra espanola, flechas ↑ subiendo desde cada rama,
vinetas • en los ejemplos y el hueco como linea subrayada. Los colores de las ramas son
los del pilar de estructura, para que el ojo los reconozca de los otros modulos.

### Nota de arquitectura
El modulo `BF` va DENTRO del IIFE de APP porque usa `store`, `TTS`, `Streak`, `toast` y
`doUndoable`, que son privados. Los datos (`BIFUR`) van fuera, como `RAW_WORDS`.

### Verificacion
24 cargadas, 8 pestanas. Probado: fallar (marca la correcta + explica), acertar todo
(5/5, tarjeta dominada, guardada), filtro de pendientes bajo de 24 a 23, progreso
sobrevive recarga. Regresion completa de los 7 modulos previos intacta. Movil 375 px sin
desbordes en las 8 pestanas, ramas apiladas a una columna.

---

## 💰 12-FIN · tasas de credito congeladas desde el 22-ago — 2026-08-27

Miguel reporto que finanzas y noticias no actualizaban y sospecho del cambio de sync del 26.
**No fue eso.** Prueba: lo unico que cambio en finance.html y news.html fue la linea del
cache-bust (p16->p17); 0 commits mios tocaron scripts/, workflows ni fin-*.js; la Action
corrio SOBRE mi commit de8e763 y commiteo datos bien (599b053).

### Lo que si estaba roto
**Tasas de credito: desde el 22-ago 15:41**, cuatro dias antes de mi primer commit (26-ago
11:31). Rastreado snapshot por snapshot: el ultimo completo fue 3cf1e67 del 22 a las 11:40.
Fallaban usura, Consumo y Productivo con `fetch failed` (nivel de conexion, no HTTP).
El sistema hacia lo correcto: conservaba el ultimo valor bueno y marcaba `partial: true`.

**Causa:** el script corria bien desde un PC (probado: completo en 28 s) y fallaba solo en
los runners. Lanzaba **5 consultas pesadas en paralelo** a datos.gov.co sin token: cupo
estrecho por IP y las IP de GitHub estan saturadas. Por eso `fetch-macro.mjs`, que hace UNA
consulta al mismo dominio, si funcionaba.

### Arreglo
- **Consultas en SERIE** en vez de `Promise.allSettled` de 5. Se conserva la forma
  `{status,value,reason}` para no tocar nada aguas abajo. Bonus: bajo de 28 s a **9 s**.
- **Reintentos** con espera creciente (3s, 12s) y etiqueta por consulta en el log.
- **Token opcional de Socrata** via `SOCRATA_APP_TOKEN` (secreto de GitHub -> `X-App-Token`).
  Sin secreto funciona igual que hoy.
- **Blindaje del token:** un token mal pegado devuelve **403 y rompia TODO** — peor que no
  tenerlo. Probado a proposito con un token invalido. Ahora al primer 403 lo descarta y sigue
  sin el: en el peor caso queda como hoy, nunca peor.

### Noticias (pendiente, punto 2)
3 de 8 fuentes. Dependen de `api.rss2json.com`, gratuito de terceros: **200 desde mi maquina,
422/500 desde mikel696.github.io**. Mismo patron de origen del incidente del 11-ago y la
misma violacion del P1. Propuesto: mover la lectura de RSS a la Action y servir un news.json.

### Nota honesta
El `credit-co.json` de este commit lo genero un `import()` mio que use como chequeo de
sintaxis — en ESM eso EJECUTA el modulo. Fue un accidente, pero el dato es correcto: se
contrasto contra la fuente oficial (43.64% y 19.77% coinciden, vigencia agosto 2026, 0
valores incoherentes, `partial:false`). Se conserva porque destraba las tasas hoy mismo.

---

## ☁️ GLOBAL · cloud-sync.js v p17 — 2026-08-26 (merge generico + lapidas)

Los dos huecos detectados en la auditoria del motor de sync, cerrados. **Cache-bust en
lockstep: las 28 paginas pasaron de `?v=p16` a `?v=p17`** (regla 7 de CLAUDE.md).

### Hueco 2 · el merge estructural era lista blanca de 6 claves
`_structuralMerge` solo cubria cuadernos (`*_nb_data`, `*_nb_meta`). Todo lo demas anidado
caia en LWW por key completa: agregar un caso en el celular y otro en el PC hacia que
**se perdiera uno entero**. Misma clase de bug del 15-jul, en modulos a los que no les
habia tocado todavia.

Ahora hay `ARRAY_MERGE_KEYS`, un registro de forma `{campoId, campoFecha}` con **9 claves
cuya forma se verifico leyendo el codigo que las escribe**:

| clave | fecha | nota |
|---|---|---|
| tools_mindmaps · tools_canvases · tools_apa_docs | `updated` | se actualiza en cada edicion |
| work_eco_dict | `updated` | |
| work_impl | `updatedAt` | campo distinto, verificado |
| work_cases · work_errors · work_learnings | `date` | solo fecha de alta; la union igual evita perder entradas |
| work_moif_meetings | `updated` | |

**`work_kb` quedo AFUERA a proposito: es un string plano, no un array.** Meterlo lo habria
corrompido. Guarda de forma en `_mergeArrayById`: si algun lado no es array devuelve `null`
y cae al LWW de siempre — nunca rompe.

### Hueco 1 · no habia lapidas: los borrados resucitaban
El merge era union pura de ids, asi que borrar algo en un equipo y reconectar otro que
todavia lo tenia lo **revivia y lo re-subia**.

Ahora hay `cloud_tombstones` (en SYNC_REGISTRY, con merge por union). **Se derivan solas en
el proxy de `setItem`**, comparando el valor anterior con el nuevo: ningun modulo tuvo que
tocarse. Una lapida solo mata un item si es **mas nueva que su ultima modificacion** — si
editaste despues de borrar en otro equipo, gana la edicion. Se purgan a los 60 dias.
Aplicadas tambien a `_mergeNbData` y `_mergeNbMeta`.

### 3-ENG · portado desde cloud-sync.js
- **Guard de contenido identico** antes de subir (el `_deepEqual` que evita el ping-pong
  entre equipos). En memoria y no en disco: al recargar se olvida y el primer push siempre
  sale, asi la optimizacion nunca puede dejar un cambio real sin subir.
- **Guard de cuota** al escribir: una clave que no entra ya no tumba el merge entero, avisa
  por evento `eng:quota` y sale un toast.

### Bug cazado de paso
`e.target.matches is not a function`: cuando un keydown llega con `document` como destino,
`.matches` no existe y **el manejador entero reventaba** — se caia tambien el `Escape` que
venia despues en el mismo listener. Resuelto con un helper `isTyping()` en los 3 sitios.

### Verificacion
Merge probado en el motor real cargado en `notes.html`: regresion de cuadernos sin lapidas
identica a antes · union sin perdida de entradas · las 4 guardas de forma (string, objeto,
clave no registrada, null) devuelven `null` · derivacion automatica de lapidas al borrar ·
no resucita · la edicion posterior gana · union de lapidas.
Carga limpia y **cero errores de consola** en notes, work, mindmap, apa y english-engine,
todos sirviendo `?v=p17`. Diff del cache-bust: **28 archivos, 28 lineas** (una por pagina).

---

## 🗣 3-ENG · ENGLISH ENGINE v3.1 — 2026-08-26 (filtros contraibles)

Miguel: los dos bloques de chips de Palabras y Frases no dejaban ver el contenido.
Ahora se contraen solos al bajar y el boton «Filtros» los reabre.

| | Desplegado | Contraido | Recupera |
|---|---|---|---|
| Frases (escritorio) | 400 px | 58 px | **342 px** |
| Palabras (escritorio) | 230 px | 58 px | **172 px** |
| Frases (movil 375) | 943 px | 138 px | **805 px** |

En movil el bloque era mas alto que la pantalla entera. Ademas el panel contraido
**dice que filtros estan puestos** (ej. «Filtros 1 · Trabajo»), para no abrirlo a ciegas,
y elegir un filtro con el panel abierto lo cierra solo para ver el resultado enseguida.
El alto de la cabecera se mide a JS y se expone como `--hh` (antes estaba fijo en 56 px).

### Lo que costo: tres intentos, misma causa raiz
El panel de preview NO compone fotogramas, y eso rompe TRES mecanismos seguidos:
1. `IntersectionObserver` — no entrega ni una sola llamada sin renderizado.
2. `requestAnimationFrame` — tampoco corre.
3. Los **eventos `scroll` ni siquiera se emiten** (`window.scrollTo` mueve la posicion
   pero no dispara nada): verificado con un listener limpio → 0 eventos.

Quedo con listener de `scroll` + throttle por `setTimeout` (no rAF, por el punto 2).
La logica se verifico llamando `CTL.apply()` a mano en las dos direcciones y en los dos
modulos. **Lo unico no verificable aqui es que el navegador emita el evento scroll** —
eso lo confirma Miguel en su navegador real.

---

## 🗣 3-ENG · ENGLISH ENGINE v3 — 2026-08-26 (sincronización + deshacer)

Miguel pidió dos cosas, con una regla explícita: **no romper nada de lo ya hecho**.
Todo lo de v1 y v2 quedó verificado intacto antes de dar por buena la entrega.

### ☁️ Sincronización cross-device
Usa **el mismo Supabase, la misma tabla `app_state` y la misma sesión** que el resto del Cerebro
(mismo proyecto = misma clave de sesión, así que si ya entró en otra página del Cerebro, aquí
arranca solo). Claves sincronizadas: `eng_nb`, `eng_nb_trash`, `eng_fav_w`, `eng_fav_p`,
`eng_srs`, `eng_streak`.

**Por qué NO reusa `cloud-sync.js`** — las dos razones son de fondo:
1. Tocarlo obliga a subir versión en **las 28 páginas** (CLAUDE.md regla 7). Eso es romper cosas
   fuera del encargo. Así el blast radius es cero: no se tocó ningún archivo compartido.
2. Su merge de `app_state` es **last-write-wins sobre el objeto completo** — el mismo mecanismo
   que perdió un cuaderno el 15-jul. Para cuadernos es inaceptable.

**Merge propio, por entidad, verificado con 6 escenarios:**
- Cuadernos: se comparan **uno a uno por `id`**, nunca el bloque completo.
- Páginas: cada una con `id` y sello `u` propios; se **unen página por página**. El escenario del
  15-jul (mismo cuaderno editado en PC y celular con páginas distintas) ahora conserva **las dos**.
- Borrado: lápidas con `deletedAt` para que se propague en vez de resucitar — pero si editaste
  DESPUÉS de borrar en otro equipo, **gana la edición**. El sesgo siempre es a no perder datos.
- Práctica: por tarjeta, con sello `ts`; gana el repaso más reciente.
- Racha: une los días de todos los equipos y recalcula la seguidilla.
- Marcadores: aquí sí last-write-wins, son baratos de rehacer.

**Offline-first intacto (P1).** El SDK se carga del CDN **solo al activar la sincronización**.
localStorage sigue siendo la fuente de verdad. Probado: con `SYNC.touch` lanzando excepción en
cada guardado, marcadores y cuaderno **siguen guardando** y la app queda intacta.

### ↶ Deshacer, papelera y edición
- **Deshacer** en guardar-en-cuaderno, borrar tarjeta, borrar página, borrar cuaderno y marcar ★.
  Botón en el aviso (8 s) + **Ctrl+Z** global (desactivado dentro del editor, donde Ctrl+Z es el
  del texto). Pila de 25 acciones; cada una guarda una foto de las claves afectadas.
- **Papelera**: borrar un cuaderno lo manda ahí, no lo destruye. Restaurable, se purga sola a los
  30 días, y el borrado definitivo sí pide confirmación.
- **Borrar página** (antes solo se podían añadir) y **borrar tarjetas EN/ES sueltas** al pasar el
  cursor, sin tocar el resto de la página.

### Bug crítico cazado ejecutando
`window.SYNC` era `undefined`: un `const` de nivel superior **no se cuelga de `window`**, así que
`if(window.SYNC)` era falso y **la sincronización no arrancaba nunca** — además dejaba muerto el
`SYNC.touch()` de cada guardado. Se arregló con `window.SYNC = SYNC` (mismo patrón que
`window.CLOUD = CLOUD` en cloud-sync.js) y `window.APP = APP`.

### Verificación
Regresión completa de v1+v2 antes de cerrar: búsqueda con acentos, filtros, moldes coloreados,
12 piezas, quiz, saltos pieza↔módulo, práctica, buscador global y panel de voz — todo OK.
Nuevo: deshacer en las 5 acciones, papelera crear/restaurar/purgar, borrar página + deshacer,
6 escenarios de merge, carga real del SDK desde CDN con respuesta real del servidor de Supabase
(credenciales falsas → error traducido al español), y las 7 pestañas a 375 px sin desbordes.
El login exitoso lo confirma Miguel: no se piden contraseñas.

---

## 🗣 3-ENG · ENGLISH ENGINE v2 — 2026-08-26 (piezas + práctica + cuaderno)

Miguel revisó la v1 y pidió tres cosas: **explicar qué es un verbo / adjetivo / modal / sustantivo
como para alguien que no sabe nada**, **un cuaderno con las opciones de los del Cerebro pero
enfocado en inglés**, y más vida en el diseño. De 4 pestañas pasó a 7. ~508 KB, sigue siendo un
solo archivo sin dependencias.

### 🧩 Las Piezas (nuevo)
Las 12 clases de palabra explicadas desde cero bajo una metáfora única: **la frase es una escena de
película** — sustantivo = actores y objetos · verbo = la acción · adjetivo = el vestuario · adverbio =
la indicación del director · preposición = el GPS · determinante = el dedo que señala · auxiliar = el
motor · modal = el dial del tono · conector = el puente · expresión = bloque prefabricado.
Cada pieza trae: analogía, **test de 3 segundos** para reconocerla, dónde va en el molde, reglas
mínimas, **la trampa del español** y ejemplos con audio. Cierra con un quiz de 10 preguntas que
baraja opciones y explica el porqué de cada respuesta.

**Cableado en los dos sentidos:** la etiqueta de categoría de cada palabra del Módulo 1 es clicable y
abre su pieza; cada pieza tiene un botón que devuelve al Módulo 1 ya filtrado por esa categoría.

### 🧪 Práctica (nuevo · Leitner)
Repetición espaciada de 5 cajas con intervalos 1/2/4/8/16 días. El Módulo 3 predicaba repetición
espaciada y el documento no la ofrecía: esto cierra esa incoherencia. Fuentes: mezcla, solo
marcadas ★, palabras o frases. Dos direcciones (EN→ES y ES→EN). Atajos: Espacio gira, 1/2/3
califican. Store `eng_srs`.

### 📓 Cuaderno (nuevo)
Adopta las **opciones** de los cuadernos del Cerebro sin la dependencia de `nb-shared.js` (105 KB +
CSS), que habría roto la portabilidad del archivo único. Páginas con navegación, negrita/cursiva,
H1/H2, listas, resaltados en 3 colores, casillas marcables, separador y quitar formato. Más lo que
solo tiene sentido aquí: **tarjeta EN/ES insertable con botón de audio**, **leer en voz alta la
selección**, 6 plantillas de inglés (vocabulario, frases, errores, escucha, dudas, diario) y
exportar a .html. Autosave con el patrón del proyecto (`commitNow` + debounce 700ms + flush en
blur/visibilitychange/beforeunload). Store `eng_nb`. **Es local a un navegador, por diseño — el
documento lo dice y ofrece exportar.**

### Diseño y fluidez
Entrada escalonada de tarjetas, hero con gradiente flotante, elevación en hover, toasts, barra de
progreso de lectura, racha diaria (`eng_streak`) y **buscador global Ctrl+K** sobre las 2000
palabras + 1000 frases + piezas + secciones del método.

**La cabecera pasó de 140 px a 49 px.** Con 7 pestañas se partía en dos filas hasta en 1440 px y
dejaba Cuaderno y Método fuera de vista. Se arregló con pestañas en una fila deslizable y moviendo
el control de voz a un desplegable (ocupaba 267 px él solo).

### Tres bugs cazados verificando, no leyendo
1. **La casilla marcable no se insertaba.** Era un `<div>` y el navegador lo desenvuelve al meterlo
   dentro de un `<p>`: quedaba texto suelto, no un elemento clicable. Ahora es
   `<span class="chk">` con `display:block` y un `<b class="cb">` para el toggle.
2. `$('nbNew').onclick` estaba cableado a una función vacía — el botón «Cuaderno nuevo» no hacía nada.
3. La cabecera de dos filas (arriba).

**Persistencia verificada de verdad**, no por inspección: se levantó `npx serve` en localhost:3456
porque el panel de preview sirve `data:` URLs y ahí `localStorage` **lanza**. Con origen real se
escribió cuaderno + favorito + tarjeta SRS + racha, se recargó la página y **los cuatro volvieron**.
Verificado además: quiz, saltos pieza↔módulo, flujo completo de práctica, autosave, navegación de
páginas, buscador global y las 7 pestañas a 375 px sin scroll horizontal.

---

## 🗣 3-ENG · ENGLISH ENGINE — 2026-08-26 (documento maestro)

Miguel pidió un documento .html completo con tres módulos y pronunciación en cada palabra y frase.
Archivo: `frontend/pages/english-engine.html` — **un solo archivo, ~390 KB, sin dependencias**
(solo Google Fonts). Se abre con doble clic y funciona sin internet. Enlazado desde el hero de 3-ENG.

**Pilar: la estructura.** El documento abre con la pestaña 🧭 Estructura (las 4 piezas, los 5 moldes,
los 3 motores BE/DO/HAVE, la rejilla de 12 tiempos, S-V-O-M-P-T) y ese mismo código de color
—🟣 sujeto · 🔵 auxiliar · 🟢 verbo · 🟡 complemento · 🔴 not · 🩷 WH— reaparece en el molde de
cada una de las 1000 frases. No es decoración: es el hilo que conecta los tres módulos.

- **M1 · 2000 palabras** ordenadas por frecuencia real (no alfabético), en 6 bloques. Cada una con
  su pieza del molde, su colocación típica y ejemplo bilingüe. 877 sust · 491 verbos · 241 adj · 174 expr.
- **M2 · 1000 frases** con molde estructural coloreado, tiempo verbal y una nota de regla en una línea.
  39 situaciones × 11 tiempos. 405 presente simple · 147 imperativo · 108 expresión fija · 92 modales.
- **M3 · Método** — 7 principios, rutina de 30 min, 10 errores a evitar, 10 acciones, 18 atajos de
  lógica, 9 fallas de pronunciación del hispanohablante, 16 falsos amigos, 12 errores estructurales,
  videos y plan de 90 días.

**Honestidad de fuentes.** YouTube no entrega transcripciones a un lector automático: **no pude ver**
**los 2 videos que pasó Miguel**. Lo que sí hice fue verificar uno por uno que los 12 enlaces existen
(título de página comprobado el 2026-08-26). El documento dice esto en su propia sección de videos —
no finge haberlos analizado. Los canales se describen por lo que publican, nunca por un video puntual.

**Dos bugs cazados verificando en el navegador** (no leyendo el código):
1. El `<select>` de voz quedaba `disabled` para siempre: Chrome devuelve `getVoices()` vacío en la
   primera pasada y lo llena después vía `onvoiceschanged`, pero nada rehabilitaba el select.
2. Todo acceso a `localStorage` estaba desnudo. En ventana privada o con almacenamiento de sitio
   bloqueado **lanza** al solo tocarlo, y tumbaba la app entera. Ahora pasa por el helper `LS`.

Verificado en navegador: 2000/1000 cargadas, búsqueda insensible a acentos (café = cafe),
filtros por bloque/pieza/situación/tiempo, marcadores ★, paginación, TTS disparando audio real,
y móvil 375px sin scroll horizontal.

---

## ⚡ 1-IND · Vista HOY — 2026-08-17 (tarea O1.1 · HECHA)

El dashboard tenía 16 tarjetas para **entrar** a los módulos y ninguna que dijera qué requiere
atención. Ahora cruza seis fuentes que ya existían: alertas disparadas y tesis vencidas (12-FIN),
vacantes abiertas a LatAm sin ver (5-JOB), entregas próximas (10-SYS), hábitos sin marcar (9-GOA)
y tarjetas SRS (3-ENG). Archivo: `frontend/js/hoy.js`.

**Lo que lo hace confiable es lo que NO hace.** Distingue dos silencios que se parecen: «al día»
(verificado — hay datos y no hay pendientes) y «sin datos todavía» (el módulo nunca se usó). Con los
seis stores vacíos no pinta una sola tarjeta ni un solo número. No haber usado 9-GOA no es tener
los hábitos al día, y el panel lo dice con todas las letras.

**Es un espejo, no una segunda autoridad.** Cada fuente se cuenta con la misma expresión que usa su
módulo. Donde el módulo tiene un defecto se replicó igual y se anotó como tarea, en vez de
arreglarlo por libre y dejar dos números contradictorios en pantalla.

**La trampa que había que esquivar — y por qué importa para cualquier módulo que escriba:**
`sys_tasks` está en `SKIP_KEYS` de `cloud-sync.js`. El proxy lo ignora **a propósito** porque es
tabla dedicada Tier 1, empujada con `CLOUD.push()` explícito desde `systems_logic.js:saveTasks`.
Escribirlo solo con `setItem` habría guardado local **sin sincronizar**: marcabas la entrega en el
dashboard y en el otro PC seguía pendiente. Pérdida silenciosa, P0 del mandato. `completarTarea()`
replica el push explícito; `sb_habits` sí es Tier 2 y viaja por el proxy.
Comprobado midiendo la outbox, no leyendo el código.

**Tres hallazgos nuevos, todos con evidencia, todos ya en el plan:**

| Tarea | Qué se encontró |
|---|---|
| **O4.5** (P1) | `js/index.js` (425 líneas) y `js/dashboard.js` (134) **no los carga nadie** — cero referencias en el repo. `index.js` trae un «mission control» que es un intento previo de esta misma tarea, muerto en disco. Mismo patrón que `css/notes.css`. ⚠️ `core.js` **sí** se carga, desde `pages/`. |
| **O2.4** (P1) | `eng_srs_deck` tiene **dos esquemas incompatibles** (`due` epoch vs `nextReview` fecha). Como `_genSRS` filtra con `!c.due`, toda tarjeta creada desde 13-NOT cuenta como vencida **para siempre**: el repaso espaciado deja de espaciar. |
| **O2.2** → **P0** | `api.rss2json.com` devuelve **422 ahora mismo**, verificado con petición real. El feed del dashboard está roto hoy, no es un riesgo futuro. |

---

## 🗺️ Plan de desarrollo · el plan como DATOS — 2026-08-17

Miguel pidió revisar toda la documentación, optimizar los prompts, proponer un plan para los 16
módulos y **dejarlo en notas, actualizable a medida que se desarrolla**.

**La decisión de diseño:** el plan no es un documento, es un JSON versionado. Un `.md` se edita a
mano, se duplica y envejece — exactamente lo que pasó con los 8 `PLAN_*.md` de abril, todos con el
sello "DRAFT — Awaiting approval" describiendo trabajo que ya estaba en producción. Ahora hay
**una sola fuente**: `frontend/data/plan-cerebro.json`, que leen tanto Miguel como la sesión de
Claude que ejecuta las tareas. No hay forma de que digan cosas distintas.

**Qué define "terminado".** Siete criterios explícitos, sacados de lo que hizo buenos a 12-FIN y
5-JOB: dato real de fuente primaria · se actualiza solo · dice de cuándo es · todo número lleva su
período · los rankings muestran su criterio · el éxito parcial no degrada · habla con los demás
módulos. Un módulo está listo cuando los cumple los siete, no cuando "se ve bien".

**El diagnóstico que ordenó las olas.** De 16 módulos, solo 2 tienen datos que se actualizan solos
(12-FIN, 5-JOB). Y **1-IND y 7-NEW siguen dependiendo de `api.rss2json.com`** — la misma clase de
proxy gratuito de tercero que reventó en 12-FIN el 11 de agosto. Por eso matarlos es una ola propia.

| Ola | Qué resuelve | Tareas |
|---|---|---|
| **O1 · Conectar el sistema** | 16 módulos que casi no se hablan. El valor está en el cruce. | Vista HOY · radar→2-APP · hábitos por evidencia |
| **O2 · Matar los proxies** | Terceros gratuitos en el camino crítico. | 7-NEW y 1-IND del lado servidor · 3-ENG con vacantes reales |
| **O3 · Carrera y estudio** | Muestran planes pero no detectan el desvío. | 4-RUT · 10-SYS · decidir 11-ACC |
| **O4 · Higiene y protección** | P0 del mandato. Deudas medidas, no hipótesis. | Cuota localStorage · namespace `da2026_` · este archivo |

**8-PRO rehecho de raíz.** Los prompts que había eran plantillas de 40 líneas con huecos tipo
`[DESCRIBE TU TAREA]`. Un prompt que exige trabajo antes de usarlo no se usa. Los 10 nuevos
(`data/prompts-plan.json`) traen el problema real, qué entrega y cómo se verifica — se copian y se
pegan. La cabecera común (rol, qué leer antes, **las 3 reglas que más se incumplen**) se antepone
sola al copiar.

**Documentación archivada.** Los 8 `PLAN_*.md` de abril pasaron a `docs/archivo/` con un índice que
dice qué pasó con cada uno. No se borran: varios comentarios de cabecera en `frontend/js/` los citan
como origen de la arquitectura de su módulo.

**Archivos:** `frontend/data/plan-cerebro.json` · `frontend/data/prompts-plan.json` ·
`frontend/js/notes-plan.js` (13-NOT) · `frontend/js/prompts-plan.js` (8-PRO) ·
`docs/archivo/README.md`.

**Verificado en local antes de desplegar:** 8-PRO renderiza 10 tarjetas con sus 10 botones, el texto
copiado compone cabecera + cuerpo (952 caracteres en la prueba), y el cambio de pestañas no rompió
las 6 que ya existían. 13-NOT renderiza 4 olas / 12 tareas / 7 criterios / 4 hitos, y los filtros de
prioridad responden (P0 → 4 tareas en 3 olas; P3 → 1). Consola sin errores en ambos.

**Dos defectos propios, encontrados al verificar en producción:**

1. **Parcheé `prompts.html` con sustitución de texto y el `replace('</body>')` matcheó un `</body>`
   que estaba DENTRO del texto de un prompt** — inyectó el `<script>` en medio de una cadena de JS.
   Misma clase de error que los `\b` convertidos en `0x08` del 13 de agosto. Revertido con
   `git checkout` y rehecho con `Edit` sobre anclas exactas. La regla ya estaba escrita y la
   volví a incumplir: **no se parchea código con sustitución de texto.**

2. **Los estilos del plan de 13-NOT iban a un archivo que la página no carga.** En producción la
   pestaña renderizaba las 12 tareas sin ningún estilo: fondo transparente, sin borde, prioridades
   en color de texto plano. En local yo había comprobado que los elementos **existían**, no que se
   **vieran**. `notes.html` nunca enlazó `css/notes.css`; sus estilos viven embebidos en su propio
   `<style>`. Las 52 reglas se movieron ahí.

   **Hallazgo abierto → tarea O4.4 (P1):** `css/notes.css` lleva meses tragándose ediciones en
   silencio — el commit `da90c35` ("ancho unificado a 1200px en los 3 módulos") también lo tocó
   creyendo que aplicaba, y `module-prompts.js:30` sigue documentando que 13-NOT lo usa. Hay que
   decidir si se rescata o se borra, y revisar si hay más CSS huérfano en las 28 páginas.

**Corrección de un dato del propio plan:** la ficha de O4.2 decía "perfil, XP y racha". Verificado:
`core.js:20` define `DB.NS = 'da2026_'` y guarda **6 claves** (`profile`, `xp`, `streak`, `tasks`,
`notes`, `sessions`), y `DB` lo usan también `apply.js` y `dashboard.js`. El prefijo no aparece en
ninguna línea de `cloud-sync.js`.

**Estado del plan:** 13 tareas, todas con criterio de verificación, 12 con prompt listo. La única
sin prompt es O3.3 y es a propósito — es una decisión de Miguel sobre 11-ACC, no algo que se ejecute.

**Pendiente de esta tanda:** O4.3 — el resumen de estado presente al inicio de este archivo
(4.071 líneas en orden cronológico siguen siendo caras de leer). Quedó como tarea P2 del plan.

---

## 🔎 5-JOB · Radar diario de vacantes — 2026-08-13 (commit bcaf1ac)

**Respuesta a "¿trae información diaria?": NO traía nada.** Cero peticiones de red, Kanban 100% manual,
y una `loadLiveJobs()` en core.js que traía empleos de RemoteOK **y no la llamaba nadie** — código
muerto hace meses.

### El dato que definió el diseño (medido antes de escribir código)
**De 100 vacantes de RemoteOK, CERO declaran aceptar candidatos de LatAm. En Remotive, 56%.**
El mayor desperdicio de tiempo de alguien que busca empleo remoto desde Colombia no es *encontrar*
vacantes: es descubrir a mitad de la postulación que eran solo para EE. UU.
**Por eso la elegibilidad es filtro DURO, no un punto más.**

### 11 fuentes
4 portales remotos + **7 ATS de empresas que contratan en LatAm**, verificados uno por uno con petición
real: Clara, Bitso, Laika (Greenhouse) · Belvo, Simetrik, Bold (Ashby) · Fintual (Lever).
Los ATS dan señal muy superior: empresas concretas con ubicación explícita. La lista vive en
`jobs-companies.json`, editable sin tocar código.
Hoy: **464 revisadas → 445 únicas → 36 con señal de rol → 16 relevantes · 6 abiertas a LatAm**.
Arriba: Data Analyst en Clara, y el **Paid Analyst de Simetrik** (movilidad interna).

### Tres errores propios, corregidos midiendo
1. **Mezclé afinidad con elegibilidad** — un empleo de marketing en Bogotá calificaba solo por decir
   "LatAm". Ahora la región no suma afinidad y se exige al menos una señal de ROL.
2. **Penalizaba por palabras de la descripción** — un puesto de analista en una empresa de ventas se
   castigaba por la palabra "sales" del texto. Dejó el radar en CERO resultados.
3. **Los `` de los regex se volvieron caracteres 0x08** al parchear el archivo con manipulación de
   cadenas: ningún patrón matcheaba y el puntaje venía solo del bonus de frescura. El volcado de bytes
   lo delató. **Lección: no parchear código con escapes vía sustitución de texto.**

Durante el desarrollo, el guardián de `_prev.mjs` preservó el feed anterior de 35 cuando una versión
del filtro dejó 0 resultados. La regla del éxito parcial funcionando en otro módulo.

---

## 🏁 12-FIN · Fase 4 — módulo COMPLETO, 8 de 8 secciones — 2026-08-12 (commit 9cdbdaf)

**Hoy · Mi plata · Colombia · Global · Radar · Inteligencia · Laboratorio · Ajustes.** Cero en construcción.

### 📚 Inteligencia
25 fuentes en 5 grupos, **cada URL comprobada con una petición real** antes de publicarse. Cada una
responde qué es y **cuándo te sirve** — eso es lo que separa un directorio de un montón de enlaces.
El orden de los grupos es la tesis: arriba el número original, abajo las opiniones sobre ese número.
Vive en `data/fin-sources.json`, editable sin tocar código. La única no verificable (Bloomberg
devuelve desafío anti-robot) va marcada **«sin verificar»** en vez de presentarse como comprobada.
Puente a 13-NOT con el formato REAL de `notes-brain.js`, leído del módulo antes de escribir.

### 🧮 Laboratorio · bitácora de tesis
Lo único del módulo que **enseña a decidir** en vez de informar. Escribís qué creés y por qué; el
sistema congela TRM, inflación y tasa de ese instante y te las devuelve el día de la revisión junto a
las de ese momento. No se puede reescribir la historia: el razonamiento queda con fecha.
El panel no opina ni puntúa — solo devuelve lo que vos escribiste.

### ⚙️ Ajustes · salud de datos
Nace del incidente del 12-ago: el módulo mostró datos de ayer durante horas y **nada lo delataba**.
Ahora dice de cuándo es cada archivo, si la actualización corrió y si las fuentes responden.
Llaves de API en `fin_apikeys` → **SKIP_KEYS por SEGURIDAD**, no por eficiencia: empieza por `fin_`
y sin esa línea DYNAMIC_PREFIXES las subiría a Supabase.

### 🐛 El bug que el propio panel destapó a los dos minutos de existir
`credit-co.json` en producción tenía **cero modalidades de usura**. La fuente falló de forma
transitoria durante la corrida del bot y **el recolector sobrescribió el archivo bueno con uno
incompleto**. La guardia solo preservaba el anterior si fallaba TODO — pero
**el daño real lo hace el éxito parcial**: escribe, parece que funcionó, y se lleva por delante lo
que sí servía.

Fix en `scripts/_prev.mjs`, aplicado a los tres recolectores:
- `conservarSiVacio` — una sección vacía conserva su último valor bueno.
- `fusionarPorClave` — **y elemento por elemento**: al probar el primer fix, 3 de 4 tipos de crédito
  llegaron y el cuarto dio timeout; el archivo se escribió con 3 y el que faltaba desapareció.
  Ahora cada elemento que falla conserva el suyo. **Nadie desaparece por una caída de 30 segundos.**
- Timeout de la consulta más pesada (6,7M filas): 90 s → 150 s.

Verificado: usura 0 → 7 · tipos 3 → 4 · los 3 archivos completos y en producción.

**Regla nueva: el éxito parcial de un recolector NUNCA debe degradar el archivo. Preservar por
elemento, no por archivo.**

### Verificado en producción
8 secciones · 25 fuentes con 1 marcada sin verificar · Laboratorio operativo · Ajustes con las 3
fuentes «al día» · tope de usura 29,66% con sus 7 modalidades recuperadas.

---

## 🧊 12-FIN · Mi caché congelaba el panel en la foto de ayer — 2026-08-12 (commit ae32f20)

Miguel reportó que seguía viendo «actualizado 11 de ago» con el servidor ya sirviendo el 12.
**El dato estaba bien; el bug era mío.**

**El síntoma que lo delataba:** el panel se contradecía solo. El subtítulo decía «11 de ago» mientras
la tarjeta de la TRM —que se trae en vivo— decía «corte 12 de ago» justo al lado.

**Causa:** le puse un TTL de 6 h a un archivo de 26 KB de **nuestro propio origen**. Ese TTL tiene
sentido para APIs externas con cuota; para un archivo propio solo sirve para quedarse viejo. El
navegador bajó la foto cuando producción aún servía la de ayer, la guardó, y quedó pegado 6 horas.

**Fix (los tres módulos):** fuera la puerta de TTL — el snapshot se pide siempre, una vez por carga.
El caché de localStorage queda solo como respaldo sin red. `?d=YYYY-MM-DD` en la URL para esquivar
la CDN al cruzar medianoche. Constantes TTL eliminadas (código muerto).

**Mejora del indicador:** el badge medía la edad de la DESCARGA, no la del DATO — decía «✓ hace 18 min»
mostrando lo de ayer. Ahora dice «✓ dato de hoy», y si la Action lleva >36 h sin correr se pone ámbar
con «⚠ dato de <fecha>». El panel ya no puede mentir por omisión.

**Regla nueva: nunca poner TTL a un recurso del propio origen. El caché HTTP ya hace ese trabajo;
un TTL en localStorage encima solo agrega una forma de quedarse viejo sin darse cuenta.**

Verificado en producción reproduciendo el caso exacto: caché de ayer marcado como sano → tras recargar,
subtítulo y tarjeta coinciden en «12 de ago», badge «✓ dato de hoy», noticias curadas.

---

## 🚨 12-FIN · El despliegue automático NO llegaba al sitio — 2026-08-12 (commit d395137)

### El fallo, encontrado porque Miguel pidió verificar
La Action corría bien y **el sitio nunca se enteraba**:

| | |
|---|---|
| Action ejecutada hoy | ✅ 12:02 UTC · commit `25bcfaf` |
| Datos frescos en el repo (`raw.githubusercontent`) | ✅ `2026-08-12T12:02` |
| **Lo que servía GitHub Pages 4 h después** | ❌ **`2026-08-11T17:34`** |

**Causa raíz:** GitHub **no dispara workflows con los push hechos usando `GITHUB_TOKEN`** — protección
anti-recursión documentada. El workflow `pages-build-deployment` nunca se lanzaba. Los push de Miguel sí
desplegaban (30 s), los del bot no (nunca). Por eso el fallo era invisible: cada vez que yo verificaba
tras un commit propio, todo salía bien.

**Fix:** permiso `pages: write` + `POST /repos/{repo}/pages/builds` explícito tras el push, con
`continue-on-error` y un `::warning::` que indica qué revisar si Pages rechaza la petición.

### ✅ VERIFICADO — pero el primer intento estaba mal (commit af99924)
Al disparar el workflow a mano, el bot commiteó y **diez minutos después Pages seguía sirviendo el
archivo viejo**. El propio `::warning::` que dejé lo delató: **«Pages no aceptó la petición de build
(HTTP 403)»**.

**Por qué 403:** `POST /repos/{repo}/pages/builds` solo funciona con Pages en modo **rama**. Este repo
tiene Pages en modo **GitHub Actions** (de ahí `deploy.yml` con `actions/deploy-pages@v4`). En ese
modo el endpoint REST está deshabilitado.

**Fix correcto:** job `deploy` dentro del mismo workflow, con los pasos oficiales
(`configure-pages` → `upload-pages-artifact` → `deploy-pages`), que corre solo si hubo push.
Detalles que importan: `ref: main` en el checkout (sin eso se despliega el commit que DISPARÓ el run,
no el que el bot acaba de empujar) · `id-token: write` · `concurrency: pages` compartido con
deploy.yml · output `pushed` entre jobs (`GITHUB_ENV` no cruza jobs).

**Prueba de extremo a extremo (2026-08-12 17:02 UTC):** disparo manual → bot commitea `e47e30e` en 80 s
→ **Pages se despliega solo en 60 s** → el sitio sirve `world.json` de hace 1 minuto, badge
«✓ dato de hoy». Sin ningún push mío. **La cadena de auto-actualización está probada completa.**

### 📰 Burbuja de noticias del día
Segunda burbuja a la izquierda (left 70, junto a la calculadora en left 14; exclusión mutua porque
comparten el hueco). `Alt+N` abre. Punto rojo mientras no hayas visto la selección de hoy.
Muestra **solo 5**, elegidas en el servidor con criterios explícitos y **con el motivo visible en cada
nota**: tema de impacto (dólar, inflación, tasas, impuestos, empresas colombianas, exportaciones,
ahorro y crédito) + peso de la prensa local + frescura, ventana de 30 h, máximo 2 por medio.
Dos defectos propios corregidos al probar: se puntuaba **después** de recortar a 24 titulares (se elegían
las 5 mejores de un charco, no del río) y `MAX_PER_FEED` era 6 (solo calificaba 1 noticia).

### 🎯 Briefing del día — las tres capas por fin se hablan
Análisis de la función del módulo: un centro de mando debe decir **qué requiere atención hoy**. Había
tres capas construidas y aisladas: cifras del país (FINCO), plata real (finance.js) y reglas
(fin-radar). La pestaña Hoy abre ahora con: reglas que se cumplieron (con salto directo al Radar) ·
tu mes real · ese balance en dólares a la TRM de hoy · **lo que la inflación le come a tu ahorro
quieto**, en pesos y al año. Cada tarjeta aparece solo si hay dato que la sostenga.

---

## 🇨🇴🔭 12-FIN · Fases 2 y 3 — Colombia + Radar — 2026-08-11 (commits 46099e6 · e48e2a6)

**5 de 8 secciones vivas**: Hoy · Mi plata · Colombia · Global · Radar.
Faltan: Inteligencia · Laboratorio · Ajustes.

### Decisión de arquitectura POR RECURSO (medida, no supuesta)
| Recurso | Medido | Elección |
|---|---|---|
| Screener FIC (`qhpu-8ixx`) | 895 ms | **En vivo** — rápido y el usuario cambia filtros |
| Comparador CDT (`axk9-g2nh`) | 1,2 s | **En vivo** — varía por plazo |
| SECOP II (`p6dx-8zbt`) | 627 ms | **En vivo** |
| Tasas de crédito (`qzsc-9esp`) | **4,8 s** | **Precomputado** en la Action |
| TIBC / usura (`pare-7x5i`) | mínimo | **Precomputado** — cambia una vez al mes |

### 🚨 Dataset trampa detectado
`yvb2-ppaa` ("Tasas de Interés Activas"), que parecía EL dataset de crédito y así figuraba en la
investigación inicial, **se congeló en junio de 2022** — cuatro años desactualizado. Presentarlo como
"lo que te cobran hoy" habría sido exactamente el dato engañoso que este módulo evita.
Reemplazado por **`qzsc-9esp`** (corte 2026-07-31) + **`pare-7x5i`** para el tope legal.
**Lección: verificar `max(fecha)` de todo dataset ANTES de construir sobre él.**

### 🇨🇴 Sección Colombia (Fase 2)
- **💰 CDT** — quién PAGA más, por plazo, con columna de rendimiento **real** descontando la inflación
  en vivo de FINCO. Hoy: Pichincha 13,52% → **+7,07% real**.
- **🏦 Crédito** — quién COBRA menos en 4 tipos, y arriba el **TOPE LEGAL DE USURA**: cobrar por encima
  es delito. Sale de la fórmula legal (TIBC × 1,5) y se muestra el cálculo para que sea verificable.
  Hoy, consumo: **29,66%**.
- **📈 Fondos** — screener con filtros anti-espejismo **puestos por defecto**. Sin ellos el primer puesto
  es un fondo forestal en liquidación con 1.574% anual y 12 inversionistas.
- **👴 Pensiones** — valor de unidad diario por AFP.
- Filtros de calidad en el precómputo: mínimo 200 créditos por entidad y se excluyen tasas bajo 2%
  (un "0% de consumo" es promocional o error de reporte, no una oferta).

### 🔭 Radar (Fase 3)
- **Contratos públicos** SECOP II filtrados por las palabras del oficio, con ciudad, presupuesto mínimo
  y ventana de días. Hoy con el perfil por defecto: **40 procesos · $3,1 mil M**.
- **Reglas de vigilancia** sobre los indicadores reales, evaluadas al abrir. Sincronizan.
- **NO se construyó el "calendario económico"**: no hay fuente verificada de las fechas 2026 de las
  juntas del Banrep ni del DANE. Inventarlo habría sido fácil y deshonesto.

### 🐛 Fix de raíz · colisión de selectores entre módulos
`finance.js` escuchaba `click` en **todo el documento** buscando `[data-del]`. Cualquier módulo que
usara ese atributo en la misma página —el Radar lo hacía para borrar alertas— disparaba `FIN.del()`
con un id ajeno y un `renderAll()`. No borraba datos (los ids son UUID) pero **escribía en localStorage
y empujaba a Supabase sin razón**. Listener acotado a `#recentTx`/`#allTx`; el Radar usa
`data-alert-del`. Verificado: borrar una alerta ya no toca transacciones ni genera push espurio, y el
borrado real de transacciones sigue intacto.
**Regla nueva: un listener global sobre un atributo genérico es una trampa para el módulo que llegue después.**

---

## 🛠 MANDATO DE MANTENIMIENTO CONTINUO — 2026-08-11 (commits 9871f83 → ac244a8)

Miguel delegó la dirección técnica: *"mantenlo rodando al 100%, implementa mejoras cada día,
analiza cada módulo, simplifica y protege"*. Se formalizó en CLAUDE.md (5 obligaciones P0-P4 +
7 reglas de oficio) y en `PROMPT_MANTENIMIENTO.md` (prompt autocontenido con chequeo de salud
ejecutable, cola priorizada y el procedimiento de reanudación de Supabase).

### 💾 El backup ahora respalda de verdad (commit 9871f83)
Tres defectos en la misma tarjeta de "Mi Perfil", los tres medidos:
1. **`exportBackup` filtraba por `da2026_`** — namespace que solo tiene ~10 claves legacy de
   core.js. Medido con datos sembrados: **el export viejo capturaba 1 clave; el nuevo, 21**.
   Ahora: localStorage completo + manifiesto (fecha, tamaño, desglose por módulo) + conteo de
   las imágenes de IndexedDB que el .json no puede cubrir, **declarado en vez de omitido**.
2. **`importBackup` escribía sin preguntar.** Ahora hay vista previa con cifras reales, y NO
   restaura `_cloud_ts` ni `cloud_outbox`: con sus marcas viejas la nube ganaría el merge y
   **desharía el restore en silencio**. Verificado: lo restaurado entra a la outbox y sube.
3. **`resetAll` llamaba a `DB.clear()`** — solo borraba `da2026_`: prometía borrar todo y dejaba
   el 95%. Ahora borra todo, con doble confirmación, y avisa que la copia en la nube sobrevive.

**Cache-bust `?v=p16` en las 9 páginas de `pages/`** → cierra el hallazgo #2 de PROJECT.P1.
Las 28 páginas del proyecto van ahora en lockstep. Queda solo el #3 (namespace `da2026_` sin sync).

### 🧮 Calculadora financiera flotante (commit 438b055)
Burbuja fija abajo a la **izquierda** (la derecha la ocupa el badge ☁). Vive fuera del flujo:
funciona en cualquier sección y a cualquier altura del scroll. `Alt+C` abre, `Escape` cierra.
**10 calculadoras** con "para qué sirve" en lenguaje llano y la lectura del resultado en cristiano:
interés compuesto · rendimiento real · cuota de crédito · conversión de tasas · CDT neto ·
meta de ahorro · dólares⇄pesos · costo de oportunidad · vivir de rentas · poder de compra.
Se alimenta de FINCO (TRM, inflación, tasa de política entran solas, marcadas "en vivo").
**Matemática verificada contra cálculo independiente**: 24% E.A. → 1,809% mensual (NO 2% — la
trampa clásica, y se muestra la diferencia) · cuota 10M/24%/36m = $380.381 · Fisher exacto 2,80%
junto a la resta de servilleta 2,97%.

### 🌍 Panel global auto-actualizable (commit ac244a8)
`scripts/fetch-world.mjs` + la Action diaria → `data/world.json` (16 KB): 10 instrumentos de
Yahoo (que responde 429 al navegador pero bien desde servidor), 5 feeds RSS y CoinGecko.
Frontend agrupado con sentido local — bolsas / materias primas / dólar / **Colombia en Nueva York**
(Ecopetrol y Bancolombia en ADR) / cripto — cada uno con su "por qué importa".
Muro de 24 titulares que **enlaza siempre a la fuente original**; el Cerebro no reescribe noticias.
Los RSS son contenido externo no confiable: todo escapado, enlaces filtrados a http(s) con
`rel="noopener noreferrer"`.

**Dos defectos propios hallados al verificar y corregidos antes de commitear:**
(a) la variación diaria salía mal — `meta.previousClose` viene `undefined` y `chartPreviousClose`
es el cierre anterior al RANGO (un mes atrás): daba −0,08% donde el movimiento real era −0,28%.
Ahora se calcula desde la serie de cierres. (b) Titulares con entidades numéricas crudas
(`Relevante &#124; MinHacienda`); decodificador reescrito, con `&amp;` resuelto al final a
propósito para no alterar el texto de la fuente.

### 🧹 Proxy público eliminado del proyecto
`allorigins` salió de 12-FIN. Devolvía 522 intermitente a las peticiones con cabecera `Origin`,
su fallo ensuciaba la consola con un error CORS que el navegador emite y **no se puede capturar**,
y los indicadores que refrescaba cambian una vez al mes. **Un tercero gratuito que aporta poco y
falla seguido es deuda, no redundancia.** Única fuente externa que queda en el navegador:
`datos.gov.co` (oficial, CORS abierto). Todo lo demás entra por la foto diaria del repo.

### Verificado EN PRODUCCIÓN (no en preview)
HOY 7/7 indicadores · GLOBAL 5 grupos, 12 instrumentos, 24 titulares, enlaces seguros, 0 entidades
crudas · CALCULADORA abre desde la sección Global estando scrolleado, 10 calculadoras con datos
en vivo · **Mi plata intacta** (5 tabs, KPIs, formulario, meta).

---

## 🛟 INCIDENTE · Supabase pausado — pérdida total de sync durante horas — 2026-08-10/11

### Qué pasó
Login del Cerebro fallaba con `Failed to fetch` en todas las páginas. Diagnóstico por capas:
`mbuhlxypuvlxxylryjzi.supabase.co` daba **NXDOMAIN en Google 8.8.8.8, Cloudflare 1.1.1.1 y DNS-over-HTTPS**
(este último descarta el router del usuario, sospechoso histórico por el caso Claro). Control: `supabase.co`
resolvía bien y un proyecto inventado daba el mismo NXDOMAIN → Supabase no usa comodín.

**Causa raíz: el plan gratuito de Supabase pausa los proyectos tras ~1 semana sin actividad, y al pausarlos
les quita el registro DNS.** Desde afuera es indistinguible de un proyecto borrado — solo el panel lo aclara.
Diagnóstico inicial dijo "eliminado o pausado-y-retirado"; era pausado. Corregido al ver el dashboard.

### Resolución
Vía Chrome MCP sobre la sesión ya autenticada del usuario (sin ingresar credenciales): panel → el proyecto
existía, pausado, con **datos y backups intactos** y reanudable hasta el **2026-09-08**. Botón `Resume`
(la UI en español lo rotula "Proyecto de currículum", traducción rota de *Resume project*) → restauración.
Verificado tras completar: DNS → 104.18.38.10 · `/auth/v1/health` → GoTrue v2.195.0 · login con credenciales
falsas → `invalid_credentials` (o sea, el servidor responde) · `app_state` vía REST → 200.

### Lecciones
1. **El offline-first cumplió.** Con el backend muerto la app siguió 100% usable; no hay gate de sesión.
2. **La red de seguridad NO existía.** El backup de `pages/configurar.html` filtra por `da2026_` y ese
   namespace solo tiene ~10 keys legacy de `core.js` — los cuadernos, finanzas, notas y Simetrik usan keys
   crudas y **quedaban fuera del archivo**. El usuario respaldó con un script en consola: **111 keys · 4,8 MB**.
3. **Riesgo de cuota:** 4,8 MB está cerca del techo de localStorage y casi todo el código guarda con
   `try{...}catch{}` — un `QuotaExceededError` se tragaría en silencio. Pendiente medir.
4. Para que no se repita: abrir el Cerebro al menos una vez por semana, o pasar a Pro.

### Pendiente
Arreglar `exportBackup` (Fase 3 del pase de seguridad, ver PROJECT.P1) · backup del segundo PC · medir cuota.

---

## 💰 12-FIN · Fase 1 · Centro Financiero — pulso macro de Colombia — 2026-08-11 (commit 586d452)

### Qué cambió
12-FIN pasa de registro de gastos a **centro financiero de 8 secciones**. Fase 1 entrega el shell + la
sección **Hoy** viva. Las 6 secciones sin construir declaran su fase real en vez de mostrar UI vacía o falsa.

### Investigación previa (24 endpoints probados con curl, headers CORS incluidos)
Sirven directo desde el navegador sin llave: **datos.gov.co (Socrata)** · **Banrep mercado cambiario**
(dólar intradía) · **CoinGecko** · **Binance** · **Banco Mundial** · **SEC data.sec.gov**.
Con llave gratuita y CORS abierto: **Finnhub** (60/min) · **Twelve Data** (800/día).
Descartados: **Yahoo Finance** (429) · **Alpha Vantage** (solo 25/día).
Hallazgos de alto valor para fases siguientes: **FIC de Superfinanciera** (`qhpu-8ixx`, 2,88M filas, corte
diario, con `rentabilidad_anual` por fondo) · **tasas de captación** (`axk9-g2nh`) y **colocación**
(`yvb2-ppaa`) banco por banco · **SECOP II** (`p6dx-8zbt`) para contratación pública.

### `js/fin-colombia.js` (NUEVO · IIFE `FINCO`)
- **Banrep `DataSerie`**: TRM, tasa de política, IBR, inflación, PIB, desempleo y cuenta corriente con serie
  histórica **en una sola llamada**. No expone CORS → pasa por el proxy de allorigins que ya usa 7-NEW.
- **datos.gov.co** (CORS abierto, sin llave) es la fuente **primaria** de la TRM y el respaldo si el proxy cae.
  Las dos fuentes son independientes vía `Promise.allSettled`: si una falla, la otra igual entra.
- **Caché local 6 h.** Sin red muestra el último valor **con su fecha de corte**. Nunca estima ni rellena.
- **Ventana uniforme de 12 meses** con el período real impreso junto al %. Sin esto un `+35%` al lado de la
  inflación medía 5 años mientras el de la TRM medía 3 meses — el mismo vicio del número sin contexto.
- Series negativas (cuenta corriente) informan **diferencia en puntos**, no % sobre base negativa.
- **Cada tarjeta cita su fuente verdadera**: la TRM dice datos.gov.co, no Banrep.
- Semáforo de inflación: el usuario mete la tasa de su producto y ve el **rendimiento real** descontada la
  inflación. Miniaturas SVG a mano, sin librerías.

### Infra compartida
`cloud-sync.js` → `fin_mkt_cache` y `fin_ui_prefs` a **SKIP_KEYS**: empiezan por `fin_` y `DYNAMIC_PREFIXES`
los habría subido solos a Supabase (cientos de KB regenerados cada 6 h, no dato del usuario).
**Verificado por comportamiento**, no por lectura de código: al escribirlas NO entran a la outbox; `fin_my_rate` sí.
Cache-bust `cloud-sync p15 → p16` en las 19 páginas (el motor debe ir en lockstep — causa del clobber de julio).

### Verificación en preview
7/7 series en vivo con `errors: []` · navegación entre las 8 secciones · **Mi plata intacta** (5 tabs, KPIs,
formulario, meta de ahorro) · calculadora real (9,5% nominal → **+3,47% real** con inflación 6,03%) ·
**sin regresión en 13-NOT, 14-WORK, 10-SYS y 1-IND** (namespaces vivos, 0 recursos locales fallidos, todos en p16).
Desplegado y confirmado en vivo: `fin-colombia.js` → 200, `finance.html` sirve p16 + las 8 secciones.

### 🔥 Fallo en PRODUCCIÓN y su arreglo (commits 15e183d + 0abd902)
El preview local pasó verde, pero **el live site salió con 1 de 7 indicadores**. Medido:
`allorigins` responde **200 sin cabecera `Origin`** (curl) y **522 con `Origin: mikel696.github.io`**
(navegador). Banrep directo: 200. → **un proxy público gratuito no puede sostener el camino crítico.**

**Fix (adelantado de la Fase 4):**
- `scripts/fetch-macro.mjs` — trae Banrep + datos.gov.co del lado **servidor** (sin CORS de por medio) y deja
  `frontend/data/macro-co.json` (26 KB · 7 series · ~400 puntos). Sin dependencias. Si NINGUNA fuente responde
  sale con código 1 y **preserva la foto anterior** en vez de escribir basura.
- `.github/workflows/macro-snapshot.yml` — cron diario 11:20 UTC (06:20 CO, tras publicarse la TRM) + disparo
  manual. Solo commitea si el archivo cambió.
- **Nuevo orden de carga**, de lo más confiable a lo más fresco: (1) foto del repo — mismo origen, imposible
  que falle si la página cargó; (2) datos.gov.co directo, refresca la TRM del día; (3) proxy del Banrep, que
  pasa a ser *mejor si está*. **Que el proxy falle ya no es una falla del panel.** El subtítulo declara el
  origen real: «al minuto» o «Foto del \<fecha\>».
- **TTL según salud del caché**: 6 h si la carga fue completa, **15 min si quedó parcial**. Sin esto, quien
  visitara durante una caída se quedaba con el panel degradado 6 horas aunque la fuente se recuperara enseguida.
  Un caché sin `snapshotAt` (motor anterior) también cuenta como degradado → se cura solo, sin limpiar nada.

**Verificado en el live site**, no en preview: rompiendo a propósito allorigins Y datos.gov.co → 7/7 indicadores
siguen visibles · caché envenenado de hace 30 min → se cura solo a 7/7 · en la última corrida el proxy estaba
caído de verdad (`live:false`) y el panel salió completo desde la foto, rotulado con su fecha.

### Next
Fase 2 — comparador de CDT y de crédito por banco + screener de FIC **con filtros anti-espejismo por defecto**
(el ranking crudo pone primero un fondo forestal en liquidación con 1 574% anual y 12 inversionistas).
Fase 3 — global + radar SECOP. Fase 4 — laboratorio y muro de noticias.
La foto diaria ya quedó hecha acá; extenderla a más series (DTF, UVR, TES) es barato.

---

## 🎓 6-TOO · Coach de Ingeniería de Sistemas — 2026-07-16 (commit 6051e01)

### Qué es
6-TOO pasa de "Mantenimiento del PC" a **Hub central de Ingeniería de Sistemas**. Nueva página `pages/coach-sistemas.html` (standalone + da-strip/in-iframe) embebida como tab principal de tools.html, con el mantenimiento del PC intacto en sus tabs.

### Las 7 secciones (cada una anclada en un CASO REAL de Miguel)
1. **🌐 Redes** — el caso Claro del 14-jul (402 Mbps OK, culpable: DNS del ZTE F680) · analogía agenda de contactos · triage de 4 comandos de un NOC L1.
2. **🗄️ Bases de Datos** — ACA préstamos + Supabase del propio Cerebro + "conciliaciones Simetrik = JOINs" · SQL traducido a Excel.
3. **🕸️ Ing. Web** — da-2026 en producción como credencial · analogía restaurante · F12/Network como habilidad #1.
4. **✅ Calidad de SW** — el incidente del sync del 15-jul como lección viva (race condition, regresión, post-mortem) · pirámide de pruebas.
5. **📐 Mat. Especiales** — Fourier=licuado, complejos=coordenadas con giro, FFT en mantenimiento predictivo.
6. **🔬 Investigación** — el diagnóstico Claro mapeado al método científico · IMRyD · tie-in con 16-APA.
7. **🖥️ Hardware & SO** — su PC real (C: crítico, plan clon SN7100) · jerarquía de memoria como restaurante.

### Estructura por sección (formato para aprendiz visual)
Caso real (timeline) → analogía → diagrama de cajas → "un día en la empresa" (ticket del rol) → kit de comandos → checklist de dominio → ruta de recursos con badges (GRATIS/ES/EN/Empezá acá).

### Datos
- Progreso: `too_coach_v1` (40 logros, barra global + contador por sección). **Local-only por diseño** (precedente: work_learn_progress).
- 30 recursos externos verificados: NetAcad, Packet Tracer, Cloudflare Learning ES, Professor Messer (Net+/A+), NetworkChuck, SQLBolt, Kaggle Intro to SQL, pgexercises, W3Schools, MS Learn ES, freeCodeCamp ES, MDN ES, javascript.info, midudev, mouredev, ISTQB, Guru99, Ministry of Testing, 3Blue1Brown, El Traductor de Ingeniería, Khan ES, GeoGebra, Scholar, Zotero, Scribbr ES, Purdue OWL, CrystalDiskInfo, Ventoy, MemTest86.
- index.html: tarjeta 6-TOO → "Hub de Ingeniería de Sistemas".
- Verificado en preview: 7 secciones/40 checks/30 recursos, persistencia+progreso OK, tabs PC intactas, consola limpia.

### Next
Ingesta de nuevas materias como secciones · botón "copiar prompt de profundización" por sección · cruce con Vista HOY (pendiente PROJECT.P3).

---

## 🤫 SYNC INVISIBLE · deep-equal + difere durante tipeo — 2026-07-15 (commit 96c82c3)

### Queja real: "se refresca cada segundo, no me deja escribir"
Causa: (1) el detector de eco comparaba strings crudos — el mismo contenido con otro orden de claves parecía "cambio remoto" → write + evento + re-render tras CADA pausa de tipeo; (2) el guard de los módulos solo miraba `activeElement` en el instante del evento; (3) ping-pong con el otro PC = eventos entrantes continuos.

### Fix (cloud-sync.js p15 · aplica a todos los módulos)
- `_deepEqual` recursivo reemplaza todos los compares por string (eco realtime NB/no-NB, decisión de re-push del merge, content-compare del reconcile). Eco → alinear TS y NADA más.
- `_userIsEditing()`: foco en editor/input O tipeo hace <4s.
- Cola `_rtDeferred`: los cambios remotos que llegan mientras se edita NO tocan ni localStorage ni la UI; se aplican de una al quedar idle (flusher 2s). El poll de 45s también respeta la edición.
- Regla de oro implantada: **la sync jamás toca la pantalla mientras el usuario escribe — todo por debajo**.
- Tests preview: eco con orden distinto → 0 writes/0 eventos PASS · remoto durante tipeo → diferido, aplicado 1 vez al idle, merge unión conservado PASS.
- NOTA: el ping-pong muere del todo cuando AMBOS PCs cargan p15 (Ctrl+F5).

---

## 🛟 INCIDENTE + FIX · Pérdida de cuaderno por merge timestamp-only — 2026-07-15 (commit 0d82897)

### Qué pasó (diagnóstico en vivo vía Chrome MCP sobre el live site)
Miguel reportó que los cuadernos de materias de 10-SYS diferían entre sus 2 PCs. Comparé página por página este PC vs la nube (sesión real). Hallazgo:
- **`admin_bd`**: local 176KB/**21 img** (editado 10-jul) vs nube 118KB/9img (congelado 22-jun). **`calidad_sw`**: local 227KB/**21 img** (10-jul) vs nube 170KB/9img (22-jun). El resto igual.
- **Se presenció el clobber EN VIVO**: el otro PC (motor viejo, datos de junio) re-selló su versión pobre de `admin_bd` con fecha de HOY 15:36:52 y la subió. El merge estructural decide **solo por timestamp** → la versión más nueva pero más pobre GANÓ y **pisó la rica en este PC** (irreversible en ese momento). Al empujar `calidad_sw` rico a la nube, el otro PC lo revirtió en **3 segundos**.
- **Pérdida real**: el TEXTO rico de `admin_bd` (10-jul) se perdió (solo existía en este PC, sin backup previo). Imágenes probablemente rescatables del IDB (112 imágenes). `calidad_sw` quedó a salvo en este PC (+ backup manual `sys_notebook_bak_2026-07-15154518`).

### Causa raíz
`_mergeNbData` (y el LWW general) confían solo en `updated`. Un device viejo que re-guarda una versión pobre le pone timestamp nuevo → gana y destruye contenido rico, en silencio y sin recuperación. Además el motor viejo (whole-key LWW) del otro PC re-empuja su estado stale como reacción a cualquier cambio (ping-pong).

### Fix de raíz (commit 0d82897 · estándar para los 3 módulos de cuadernos)
- **Historial de versiones en IndexedDB** (`nb-shared.js`): store nuevo `nb_history` (DB v2→v3, conserva `attachments`+`images`). `nbDetectRegression()` marca cuando una versión pierde imágenes/páginas/>15% de texto. `snapshotNb/listNbHistory/restoreNbSnapshot` (cap 20 por key, en IDB para no competir por la cuota).
- **Guard anti-pérdida** (`cloud-sync.js`): `_nbGuardedWrite()` envuelve TODA sobrescritura de cuaderno vía sync (reconcile + realtime + forceResync). Si la entrante reduce contenido, **snapshotea la local rica ANTES de pisarla** y emite `cloud:nb_regression`. La pérdida ya nunca es permanente.
- **Badge**: estado `⚠ versión anterior guardada` + panel con "Versiones anteriores de cuadernos" (lista con resumen + Restaurar; el restore respalda la actual primero, reversible).
- Verificado en preview: detección (sin falso positivo en crecimiento), migración IDB, restore end-to-end, badge+panel. Cache-bust cloud-sync p14 / nb-shared p21 (VERSION p24).

### Recuperación pendiente (acción del usuario)
1. **Ctrl+F5 en ESTE PC** (carga motor p14/p21, migra IDB a v3).
2. **En el OTRO PC: Ctrl+F5** (o cerrar la pestaña) para que tome el motor nuevo y DEJE de re-subir la versión vieja — es la fuente del clobber.
3. Con el otro PC ya en el motor nuevo, en este PC: badge ☁ → **Sincronizar ahora** → sube `calidad_sw` rico; ya no lo revierten.
4. `admin_bd` texto: perdido (sin backup previo al incidente). Imágenes: rescatables del IDB si se quiere, en otra sesión.
5. Pendiente histórico (recomendado): en Supabase SQL → `alter publication supabase_realtime add table public.app_state;`

---

## ☁️ ESTÁNDAR DE SYNC DE CUADERNOS — 2026-07-15 (PROJECT.P3 CONT · commit 7108878)

### El problema reportado
"No veo en el otro PC ni lo que escribo ni las imágenes pegadas." Análisis a fondo del pipeline completo (push → app_state → pull → Storage).

### Causa raíz (triple)
1. **Imágenes nunca subían**: `retryPendingUploads` buscaba el blob solo en el store de ADJUNTOS de IDB; las HD de imágenes viven en STORE_IMG → cada `img_*` encolado (pegado estando deslogueado/offline o con fallo transitorio) se sacaba de la cola **sin subir jamás** a Storage. El otro PC no tenía de dónde bajarlas.
2. **Chips ciegos**: los chips nuevos no llevaban thumbnail inline — sin HD en Storage, el otro device veía un chip vacío (overlay en blanco).
3. **Cero visibilidad**: con sesión vencida/deslogueada NADA sube (queda en outbox) y no había señal visible fuera de work.html.

### El estándar implementado (aplica a los 3 módulos con cuadernos — comparten nb-shared + cloud-sync)
- **Retry de uploads arreglado**: fallback a STORE_IMG (getImage→File); solo descarta si el blob no existe en ningún store. Triggers: signed_in, online, carga, y cada 60s si hay cola.
- **Thumbnail inline `data-preview` (~320px, 3-10KB)** dentro del chip → viaja con el body por app_state → **la imagen se VE en cualquier device siempre**; la HD llega vía Storage al abrir el overlay (con fallback al preview + aviso claro si aún no subió).
- **`NBShared.reuploadMissingImages()`**: repara el HISTÓRICO — escanea los 3 stores de cuadernos, lista Storage (1 llamada) y sube las HD que el bug viejo dejó tiradas en el IDB de origen. Cableado al botón "Sincronizar ahora".
- **Badge ☁ universal (19 páginas)** abajo a la derecha: `✓ sincronizado` / `⏳ N cambios · M img` / `☁ sin sesión` / `🔒 sesión vencida`. Click → **panel doctor**: sesión, última sync, outbox, imágenes pendientes, realtime, memoria local + botones **Sincronizar ahora** (pull+push+outbox+imágenes+reparación) y **Traer de la nube** (merge estructural, no pisa local). API: `CLOUD.doctor()`, `CLOUD.syncNow()`.
- **Boot resilience**: si el pull inicial falla, retry con backoff (antes la página quedaba muda sin poll ni outbox hasta un reload) · recovery de JWT vencido también en el PULL · listener `online` · re-suscripción realtime cada 5 min.
- **Insert a prueba de todo**: si execCommand y el range fallan, `insertAdjacentHTML` — nunca más imagen guardada en IDB sin chip visible.

### Tests (preview local)
Paste→chip con preview dentro del body guardado PASS · retry conserva cola en fallo y sube desde STORE_IMG en éxito PASS · overlay fallback a thumbnail PASS · recuperación histórica PASS · badge+doctor en notes/work PASS · consolas limpias · node --check OK.

### ACCIÓN DEL USUARIO (para activar todo)
1. **Ctrl+F5 en ambos PCs** (toma cloud-sync p13 + nb-shared p20).
2. Mirar el **badge ☁** en ambos: si dice "sin sesión" → Iniciar sesión (causa #1 histórica de "no sincroniza").
3. En el PC donde se pegaron las imágenes: click badge → **Sincronizar ahora** (sube el histórico perdido).
4. Opcional (sync instantáneo tiempo real): en Supabase → SQL editor → `alter publication supabase_realtime add table public.app_state;` (pendiente desde 2026-06-11; sin esto el respaldo es el poll de 45s).

---

## 🛡️ WHOLE-PROJECT · Hardening cuadernos + sync + launcher — 2026-07-10 (PROJECT.P3 · commit 83b10df)

### Qué se hizo
Pasada integral de robustez sobre la infra compartida, con 3 bugs reales encontrados y arreglados (auditoría completa de cloud-sync.js 1117 líneas + stack de cuadernos):

1. **Carrera de autosave en cuadernos (pérdida de datos · 13-NOT/14-WORK/10-SYS)** — `openPage`/`newPage`/`deletePage`/`selectActive` movían `activePageId` sin flushear el timer de autosave de 500ms. El `focusout` cubría el tipeo, pero las mutaciones vía toolbar (insertar imagen/lista/code despachan `input` → autoSave debounced) se PERDÍAN si cambiabas de página en <500ms: el timer disparaba con el puntero nuevo y el guard descartaba el cambio. Fix: `_flushPending(nbId)` al entrar a las 4 operaciones, replicado idéntico en `notes-nb.js`, `work.js` y `systems_logic.js` (regla de paridad).
2. **Motor cloud-sync (3 goteras)** — (a) el flush de debounce al ocultar pestaña (`_flushPendingPushes`) pusheaba sin alinear TS local ni limpiar el outbox → contador fantasma "N sin subir" hasta 20s y re-descarga innecesaria en el lightPull; (b) el DELETE de realtime escribía el string `"null"` en localStorage (JSON.parse→null revienta `.length/.map` en módulos sin try/catch) → ahora `removeItem`; (c) `pushNow`/`forcePushKey`/`forcePushAll` no sacaban la key del outbox al confirmar.
3. **prompt() letal en 1-IND** — en primera visita (`sb_name` vacío) el prompt del nombre corría inline en el script del launcher; en entornos sin diálogos (sandbox/kiosk/automation) `prompt()` LANZA → moría TODO el script: sin rail, sin router Cerebro, sin stats. Fix: diferido 1.2s + try/catch (el nombre es cosmético; el launcher ya no depende de él). Repro confirmado en preview.

### Visual 1-IND
- +2 tarjetas que faltaban en el grid de módulos: 🗺️ Mind Map Studio (15-MM) y 📄 APA Document Studio (16-APA) — estaban solo en el rail lateral. Grid ahora 15 tarjetas.
- Eliminado el CTA vencido "🎯 Simetrik Interview · 15 Abr" del Quick Workshop (la entrevista pasó — Miguel ya trabaja ahí).

### Verificación (preview local, server `da-2026`)
- Test de regresión de la carrera: PASS en 13-NOT y 14-WORK (marker insertado vía "toolbar" sobrevive el cambio de página inmediato, con `updated` re-sellado correcto).
- Anti-restamp: navegar páginas SIN editar no toca `updated` (guard intacto — clave para el merge cross-device).
- Launcher: `Cerebro` object, rail 16 items, quote/stats renderizando, consolas limpias en index/systems/work.
- `node --check` OK en los 4 JS tocados.

### Cache-busters
`cloud-sync.js?v=p12` (19 páginas) · `notes-nb.js?v=p20` · `work.js?v=p31` · `systems_logic.js?v=p20`.

### Pendiente (next-angles del run)
- **Vista HOY en 1-IND** (idea #4 del brainstorm PROJECT.P3, blueprint completo en PROMPT_RUNS.md): agregador diario cross-módulo con adaptadores read-only + writes solo en `sb_habits`/`sys_tasks`.
- Merge estructural para `work_moif_meetings` · limpieza de blobs huérfanos (IDB/Storage) al borrar páginas · fase futura per-record de cuadernos.

---

## 🎯 4-RUT · ATLAS v3.2 — Directo al Ingreso — 2026-07-09 (tercer ajuste del día, versión FINAL acordada)

### Qué cambió y por qué
Miguel precisó el rumbo: la meta es **la habilidad que paga** (el negocio de IA/automatización), no coleccionar cursos de IA; quiere **SQL, Python y Power BI como complementos**, **solo certificaciones con peso real de mercado**, **inglés innegociable**, y corrigió un dato de perfil crítico: **NO sabe programar** (cero JS/Python — los docs decían "viene de JavaScript"; los sistemas da-2026 los construyó Claude bajo su dirección).

### La ruta v3.2 (5 fases, en `atlas.js`)
- **F1 jul:** Google AI Essentials (sin cambios). 🎓
- **F2 ago→sep:** n8n — la habilidad vendible (sin cambios). 🎖️🎖️
- **F3 oct→dic (NUEVA):** Datos con peso — Kaggle Intro to SQL (mini-cert) + ruta MS Learn + **examen PL-300** (⭐ el cert de más peso LATAM, descuento estudiante ~$80-100, única inversión) → aplicar a remotos desde 5-JOB. Ids `a5-*`.
- **F4 ene→feb 27:** Python Kaggle (ex-F3, "su PRIMER lenguaje").
- **F5 mar→may 27:** Agentes+RAG (ex-F4) → graduación ~may 2027.
- **Inglés = pilar transversal innegociable:** 15 min/día hablados (Gemini Live), EF SET línea base ESTA SEMANA + trimestral (primero en lista de certs), tracker diario dice "innegociable", prompts lo auditan (diario y dominical), hack #6 nuevo.
- **Prompts v3.2:** todos declaran "NO sabe programar — analogías con Excel, jamás código antes de F4". Contadores 4→5 fases (estado + KPI header). 21 pasos + 7 certs.
- **Espejo local:** PLAN_MAESTRO.html v3.2 (5 fases + caja de inglés, key `atlas_v32_progress`), CLAUDE.md, BITACORA.md, PROMPTS_ATLAS.md. Memoria actualizada (perfil: no programa aún).

### Pendiente
- Miguel: cuenta Coursera + ayuda económica AI Essentials (20 min) + EF SET esta semana + inglés diario desde hoy.

---

## ✨ 4-RUT · ATLAS v3.1 — IA desde el Día 1 — 2026-07-09 (mismo día que v3.0; superseded por v3.2)

### Qué cambió y por qué
Miguel corrigió el rumbo de la v3.0 el mismo día: *"lo de análisis de datos está bien, pero quiero foco en las habilidades de IA, más visual, camino claro sin desvíos, lo más rápido posible"*. La v3.1 conserva la **metodología** v3.0 (visual, cert-first, HOY box, 1h/día) y cambia la **ruta**: IA como columna vertebral desde el día 1, graduación ~ene 2027 (un año antes).

### La ruta v3.1 (en `atlas.js`, commiteada)
- **F1 jul 2026 (~2-3 sem):** Google AI Essentials — Coursera, español, 5 cursos ~10h, CERO código, ayuda económica día 1. **Link verificado y corregido** (el de v3.0-WIP daba 404): `coursera.org/specializations/ai-essentials-google`. 🎓 Cert 1.
- **F2 ago→sep:** n8n automatización visual de IA — setup Docker con Claude, badges oficiales L1+L2, 5 automatizaciones reales con datos propios, opcional primer servicio 💵.
- **F3 oct→nov:** Python en Kaggle (3 mini-certs) + primer script llamando API de IA (tier gratis Gemini).
- **F4 dic→ene 2027:** HF Agents Course (🎓 cert) + Anthropic Academy (tool use) + 🏆 proyecto RAG público → graduación: servicios a PYMEs y/o vacantes IA desde 5-JOB.
- **Datos:** mismas keys sync; ids nuevos `a1-*…a4-*`, certs `c-aie/c-n8n/c-kaggle/c-hf/c-anthropic/c-efset` (16 pasos + 6 certs). Estado copiable v3.1.
- **Espejo local sincronizado:** `E:\CLAUDE\My Project\` — PLAN_MAESTRO.html v3.1 (mapa visual, key `atlas_v31_progress`), CLAUDE.md (historia v2→v3→v3.1 + rol), BITACORA.md, PROMPTS_ATLAS.md regenerado (pendiente de v3.0 saldado).

### Verificado en preview local (09-jul)
Hero v3.1, HOY box "Cuenta Coursera + AYUDA ECONÓMICA", Fase 1/4, 16 pasos, 6 certs, buildEstado() v3.1, links Coursera correctos, 0 errores consola.

### Pendiente
- Miguel: cuenta Coursera + solicitar ayuda económica de **AI Essentials** (paso 1 del mapa, 20 min).

---

## 🗺️ 4-RUT · ATLAS v3.0 — Camino de los Certificados — 2026-07-09 (superseded por v3.1 el mismo día)

### Qué cambió y por qué
Miguel reportó que ATLAS v2.0 (maestría autodidacta 12 sem con lecciones de código desde el día 1) era **confusa y lo bloqueó** — se atascó en la primera función de Python, bitácora vacía 06→09 jul. Pidió: certificados primero, formato visual, cero pérdida de tiempo. **Es aprendiz VISUAL** — regla permanente para diseñarle cualquier cosa.

### La ruta v3.0 (reescritura completa de `atlas.js`, `?v=3`)
- **F1 jul→sep 2026:** Google Data Analytics (Coursera, español; ayuda económica se solicita el DÍA 1 — tarda 2-3 sem). 9 pasos.
- **F2 oct→nov:** Power BI + examen PL-300 (MS Learn gratis; descuento estudiante CUN; ~$80-100). Dashboard con datos del 12-FIN → repo atlas-portfolio. Al certificar: aplicar a remotos junior desde 5-JOB.
- **F3 dic→ene 2027:** Python en Kaggle Learn (gratis, navegador, visual). 4 micro-cursos + mini-proyecto.
- **F4 2027 (candado):** IA Aplicada — n8n, agentes HF, RAG. La v2.0 vive ahí (archivada en `E:\CLAUDE\My Project\PLAN_MAESTRO_v2_archivo.html`).
- **UI nueva:** recuadro rojo **"QUÉ TOCA HOY"** (primer paso sin marcar, computed), KPI "Fase N/4" (reemplaza "Sem N/12"), cada fase con su "Por qué". 22 pasos + 7 certs marcables. Prompts v3 (Claude = acompañante que desbloquea con explicaciones visuales, NO profesor socrático; diario/dominical/rescate actualizados). Daily tracker: 📖 Curso 45min + 📝 Notas 15min + 🇺🇸 Inglés opcional (mismos campos est/con/eng — sync intacto).
- **Datos:** mismas keys `atlas_daily/atlas_curr/atlas_meta` en SYNC_REGISTRY. Ids nuevos (f1-1…f4-3, c-gda…) — los checks viejos (m1-1…) quedan huérfanos e inofensivos en `atlas_curr`. Entradas daily nuevas llevan `fase` en vez de `week` (render soporta ambos).
- **Espejo local:** `E:\CLAUDE\My Project\` actualizado (PLAN_MAESTRO.html v3.0 visual standalone, CLAUDE.md rol v3, BITACORA.md con historia de versiones).

### Verificado en preview local
HOY box correcto ("Cuenta Coursera + AYUDA ECONÓMICA"), Fase 1/4, 22 pasos, 7 certs, buildEstado() v3 OK, 0 errores de consola.

### Pendiente
- Miguel: cuenta Coursera + solicitar ayuda económica (paso 1 del mapa).
- `PROMPTS_ATLAS.md` (espejo local de prompts) desactualizado respecto a v3 — regenerar en próxima sesión ATLAS.

---

## 🚀 4-RUT · Hub PROYECTO ATLAS — 2026-07-06

### Qué es
Sección nueva al tope de `ruta.html`: hub de continuidad multi-IA del **Proyecto ATLAS** (maestría 12 semanas en Ingeniería de IA Aplicada, doble vía servicios + empleo remoto). La constitución del proyecto vive fuera del repo en `E:\CLAUDE\My Project\` (PLAN_MAESTRO.html v2.0 + BITACORA.md + CLAUDE.md + PROMPTS_ATLAS.md).

### Implementación
- **`frontend/js/atlas.js`** (nuevo, IIFE `ATLAS`): 10 secciones colapsables — setup Claude Project paso a paso, setup Gemini Gem, 5 prompts copiables (2 maestros + diario + dominical + rescate), ruta diaria rellenable (checkboxes estudio/construcción/inglés + nota), currículo 12 semanas (18 items · 4 módulos con links), 10 certificaciones priorizadas (gratis primero), plan de inglés, protocolo dominical con generador de evento recurrente de Google Calendar, guía GitHub, 7 hacks.
- **Botón "📋 Copiar Estado ATLAS"** (sticky): genera bloque de estado (semana/12, racha, currículo %, últimos 7 días, siguiente pendiente) para pegar en cualquier IA — la memoria del proyecto vive en la web, las IAs son intercambiables.
- **Keys nuevas en SYNC_REGISTRY** (`cloud-sync.js`): `atlas_daily`, `atlas_curr`, `atlas_meta` — cross-device via Supabase.
- `ruta.html`: stub `#atlasStub` + badge nav `🚀 ATLAS` + `<script src="js/atlas.js?v=1">`. La ruta Data Analyst clásica de 28 semanas queda intacta debajo.

### Verificado en preview local
Render completo (10 secciones, 18 items currículo, 10 certs, 3+2 prompts), guardado diario + racha + toggle currículo + Estado generado OK, 0 errores de consola.

### Pendiente
- Miguel: aprobar plan, crear Project en claude.ai y Gem en Gemini (guías en el hub), fijar hora diaria y domingo.

---

## ⚙️ 10-SYS · Subject CRUD — 2026-05-26

### Qué cambió
Sistema CRUD completo de materias para Tab 1 (Materias).

### Entregado
- **`getSubjects()`:** merge `SUBJECTS` hardcoded + `sys_subjects_custom` (custom/overrides) excluyendo `sys_subjects_hidden`. Single source of truth para toda la UI.
- **Modal Nueva/Editar materia:** ícono, código, nombre, color picker (12 colores), créditos, grupo, tipo, horario, profesor, descripción, CDigital ID, links clase/grabaciones/material.
- **Cronograma de entregas por materia:** filas título + fecha + tipo en el modal. Se renderizan como dropdown semáforo en la tarjeta de cada materia.
- **Adjuntos por materia:** `sys_subj_files_${id}` en localStorage. FileReader → base64 DataURL, max 2 MB, con descarga y eliminación.
- **Ocultar materia:** soft-delete en `sys_subjects_hidden` (las tareas se conservan).
- **Selects dinámicos:** `renderSubjTaskSelects()` pobla `#newTaskSubj` y `#bulkSubj` en tiempo real.
- **Botones ✏ Editar y 🗑 en cada tarjeta** + botón **+ Nueva materia** en el header.
- `renderStats()` y `renderDeadlines()` usan `getSubjects()` en vez de `SUBJECTS`.

### Pendiente (Tier B)
- Tareas Bloque 2 para ing_web, mat_especiales, inv_ciencia
- Actividades A1I01 y CE1026 con fechas reales
- Bump SEED_VERSION a 6 cuando haya datos verificados

### Archivos
- ✏️ `frontend/systems_logic.js` (+~230 líneas: CRUD completo)
- ✏️ `frontend/systems.html` (+~155 líneas: CSS modal + HTML modal + selects vacíos)
- **Commit:** `e847ea6`

---

## ⚙️ 10-SYS · Tier A · Audit + Calendar Upgrade — 2026-05-26

### Qué cambió
Audit READ-ONLY completo + 4 mejoras Tier A aplicadas sin tocar datos inventados.

### Entregado
- **`english_beginner` enriquecida:** profesor `CINDY PAOLA MORENO`, horario `Lunes 7:00 PM`, link directo a CDigital — datos verificados de `academic-8vo.json`.
- **`CALENDAR['26V02']` completado:** añadidos `gradeClose2` (Jul 14-19) y `periodClose` (Jul 20-26), derivados del patrón oficial 26V01. Tab 2 ya muestra eventos para todo el semestre.
- **`renderDeadlines()` — nueva función:** sección "Entregas pendientes por materia" en Tab 2. Lee `sys_tasks` dinámicamente, ordena por vencimiento, agrupa por materia, semáforos P0-P3 en tiempo real. Funciona para las 5 materias sin inventar datos.
- **CSS fix:** `.atask { transition: all .2s }` → `transition: border-color .2s, background .2s, transform .2s`.

### Pendiente (Tier B — requiere Chrome MCP o syllabus pegado)
- Tareas de **Bloque 2** para ing_web, mat_especiales, inv_ciencia (Quiz 4/5, Parcial 3/4, ACA B2)
- Actividades de **A1I01 English Beginner** con fechas reales
- Fecha del test **CE1026 Placement Test**
- Cuando haya datos: bump SEED_VERSION a 6, añadir a VERIFIED_SUBJECTS

### Archivos
- ✏️ `frontend/systems_logic.js` (3 edits: SUBJECTS[3], CALENDAR['26V02'], renderDeadlines + render())
- ✏️ `frontend/systems.html` (2 edits: transition CSS, div#deadlinesBySubject en Tab 2)

---

## 🇺🇸 3-ENG · F6 · Daily Practice Session + CIERRE PLAN — 2026-05-25

### Qué cambió
Ejecutada **F6** del rediseño Second Brain — **última fase y cierre del plan**. Materializa la **técnica E (Local-first learning)** del Modelo integrando F1-F5 en una rutina diaria personalizada. Es el "pegamento" que vuelve el módulo un sistema vs. una colección de features.

### Entregado
- **Banner "Tu sesión de hoy"** arriba del hero del módulo · siempre visible al entrar · colapsable.
- **Generador de 4 pasos** que pulla datos de las fases anteriores:
  - **🃏 SRS**: N cards due (cap 5) desde `eng_srs_deck`. Si vacío → CTA a F4.
  - **⏰ Tense**: pick por prioridad (viewed-no-mastered → untouched → review).
  - **🔍 Error #1**: top patrón del wiki F5 con sample + regla + link a F1.
  - **💬 Phrase**: random determinístico-por-fecha desde `eng_notes`.
- **Streak tracker** en `eng_practice_streak` (count + lastDate + max). Se incrementa al completar los 4 pasos; se reinicia si pasa un día sin completar.
- **UX**: barra de progreso animada, checkboxes con pop animation, banner cambia de violeta a verde al completar, mensaje "Vuelve mañana".
- **Cross-fase navigation**: cada paso tiene CTA al tab + abre modal F1 cuando aplica.
- **API CLI**: `window.ENG_PRACTICE.{session, markStep, streak, regenerate, openTab}`.
- **Sync**: `eng_daily_session` + `eng_practice_streak` añadidos a SYNC_REGISTRY · streak cross-device.

### Archivos
- ➕ `frontend/js/eng-practice.js` (NUEVO · ~340 líneas IIFE)
- ✏️ `frontend/english.html` (2 edits: `<div id="dailySession">` arriba del hero + script tag)
- ✏️ `frontend/css/english.css` (+~80 líneas bloque "F6 · DAILY PRACTICE SESSION")
- ✏️ `frontend/js/cloud-sync.js` (2 keys nuevas en SYNC_REGISTRY)

### Verificación
Smoke test en preview con localStorage vacío: los 4 pasos muestran estado "empty" con CTAs correctos. Re-test con datos sintéticos: sesión generó "2 de 2 cards due", "Present Perfect intermedio a repasar", "error no_aux_negative ×1", phrase "I'll get back to you on that". Completar los 4 pasos → banner cambia a verde "¡Sesión completa!" + streak 1 día. Streak persiste tras reload.

---

## 🎉 CIERRE PLAN SECOND BRAIN · 3-ENG · 6 fases completas

Las 6 fases del rediseño "Second Brain" de 3-ENG están desplegadas. Cubren las **5 técnicas del Modelo.md** aplicadas al dominio English:

| Fase | Técnica | Feature | Storage key | Commits |
|---|---|---|---|---|
| **F1** | C + E | Tab Tiempos · grid 4×3 + lecciones modales | `eng_tense_progress` | 8da1088 |
| **F2** | D (CLI/Skills) | Forja de Oraciones · `buildSentence()` | `eng_notes` (forja saves) | ccd675a |
| **F3** | C (Canvas) | Mapa SVG · knowledge graph con 16 aristas tipadas | `eng_tense_view` | 9f1665f |
| **F4** | B (Web Clipper) | Importador · auto-scan 13-NOT + paste | `eng_imported_lessons` | 71da1e2 |
| **F5** | A (Karpathy) | Detector 15 patrones errores hispanos + wiki | `eng_error_log` | d3198e3 |
| **F6** | E (Local-first) | Daily Practice Session integradora | `eng_daily_session` + `eng_practice_streak` | pending |

### APIs CLI expuestas
- `window.ENG_TENSES.{init, openLesson, mark, getProgress, buildSentence, randomSentence, openForja, switchView, TENSE_EDGES, SUBJECTS, VERBS}`
- `window.ENG_IMPORT.{scan, extract, importItems, log, openTab}`
- `window.ENG_ERRORS.{analyze, highlight, save, log, wiki, openTab, PATTERNS}`
- `window.ENG_PRACTICE.{session, markStep, streak, regenerate, openTab}`

### Loop de aprendizaje completo
**Importás** lecciones de Platzi en F4 → vocab va al SRS, frases a Notes → **F6** te recuerda repasar el SRS diariamente · **F5** detecta errores en lo que escribís y los acumula en tu wiki personal → **F6** te muestra tu error #1 cada día y te lleva a la **lección F1** correspondiente → **F2** te deja forjar oraciones correctas en ese tense → **F3** te muestra el mapa de cómo ese tense se relaciona con los demás → ciclo cierra y vuelves a empezar más fluido.

### Próximos angles posibles
(a) Export sesión diaria a iCal/calendar · (b) "modo Sprint" 30 min · (c) integration con Dojo TTS+STT para shadowing del phrase del día · (d) leaderboard cross-device del streak · (e) `ENG_IMPORT.createNotebook()` para crear el cuaderno English en 13-NOT desde la CLI.

---

## 🇺🇸 3-ENG · F5 · Detector de errores hispanos (Karpathy-style) — 2026-05-25

### Qué cambió
Ejecutada **F5** del rediseño Second Brain. Esta fase materializa la **técnica A (Karpathy auto-organize)** del Modelo: detector local de errores hispanos que escanea texto del usuario contra 15 patrones regex y construye un wiki personal de errores recurrentes para coaching dirigido.

### Entregado
- **Nueva tab `🔍 Errores`** entre Importar y Dojo.
- **15 patrones regex** que cubren los errores hispanos más documentados, con 3 niveles de severidad (high/med/low) y vínculo a lección F1 cuando aplica:
  - **Auxiliares/Subject-Verb**: no + verbo · 3ra sin -s · pregunta sin auxiliar.
  - **Negación**: doble negación (nothing/nobody/never tras don't/can't/etc).
  - **Be vs Have**: have años · have + estado (hungry/cold/right).
  - **Modales**: have that + verbo (tener que) · will to + verbo.
  - **Aspecto**: verbos de estado en continuo (am knowing).
  - **Plurales**: people is · uncountables en plural (informations, advices).
  - **Preposiciones**: depend of · married with · since + duración.
  - **Collocations**: make homework / make a question.
- **Engine `analyze(text)`**: 15 patrones secuenciales, deduplicación por overlap, sort por índice. Devuelve array con suggestion + why + tenseId.
- **`highlight(text, results)`**: HTML con `<mark>` coloreado por severidad + superíndice de número de error.
- **UI 3 secciones**:
  - **A · Pegá tu texto**: textarea + Analizar → resultado con texto highlighted + lista expandible de errores (✗ encontrado / ✓ sugerencia / 📖 regla / → ver lección F1).
  - **B · Wiki personal**: cards ordenadas por frecuencia (×N veces), con último sample, regla rota y botón "Ver lección" cuando el patrón está asociado a un tiempo.
  - **C · Historial**: últimos 5 análisis con date + sample + errorCount.
- **Vínculo F1 ↔ F5**: cuando un error está asociado a un tense (ej. third_sg_no_s → present_simple), botón salta a tab Tiempos y abre el modal de la lección.
- **Storage**: `eng_error_log` con cap 50, sincronizado vía SYNC_REGISTRY.
- **API CLI**: `window.ENG_ERRORS.{analyze, highlight, save, log, wiki, openTab, PATTERNS}`.

### Archivos
- ➕ `frontend/js/eng-errors.js` (NUEVO · ~470 líneas IIFE)
- ✏️ `frontend/english.html` (3 edits: tab + panel `#p-errors` + script tag)
- ✏️ `frontend/css/english.css` (+~110 líneas bloque "F5 · DETECTOR DE ERRORES" · highlighted text con mark coloreado · wiki cards · lista expandible)
- ✏️ `frontend/js/cloud-sync.js` (`eng_error_log` añadido al SYNC_REGISTRY)

### Verificación
Smoke test en preview con texto sample de 13 oraciones con errores típicos: **13/13 errores detectados correctamente** (no_aux_negative, third_sg_no_s, have_that_verb, will_to_verb, double_negative, depend_of, uncountable_plural, people_is, married_with, since_duration, state_verb_continuous, 2× have_state). Suggestions correctas en todos los casos. Wiki personal poblado con 12 patrones únicos tras guardar. Vínculo a lección F1 funcional. Bug "She workworks" en suggest de third_sg_no_s corregido in-flight (concat doble del verbo) → ahora devuelve "She works".

---

## 🇺🇸 3-ENG · F4 · Importador (web clipper + paste) — 2026-05-25

### Qué cambió
Ejecutada **F4** del rediseño Second Brain. Esta fase materializa la **técnica B (Web Clipper)** del Modelo: importador que parsea contenido raw o auto-detecta cuadernos del 13-NOT y empuja items estructurados a los stores existentes de 3-ENG (`eng_srs_deck` + `eng_notes`).

### Entregado
- **Nueva tab `📥 Importar`** entre My Notes y Dojo en el módulo 3-ENG.
- **Auto-scan** del localStorage que detecta:
  - Cuadernos en `not_nb_meta`/`not_nb_data` cuyo nombre matchea `/english|inglés|platzi|practical|conversational|grammar|vocab/i`.
  - Páginas individuales (cuando el cuaderno no matchea pero su título/body sí).
  - Notas flat en `sb_notes2` agrupadas por tag o por contenido.
- **Modo Paste** con textarea para pegar texto raw de Platzi, PDFs, transcripts. Stats live (palabras/caracteres).
- **Parser** que detecta 3 categorías con regex robustos:
  - **Vocab** (5 separadores: `— : = → /`) con validación alfabética y anti-URL.
  - **Phrases** entre comillas, en `<b>` spans, o como sentencias autónomas (3-18 palabras + mayúscula + .!?).
  - **Tips** con prefijo `tip:|regla:|rule:|nota:|note:|💡|⚠️`.
- **Modal de revisión** con checkbox por item, botones "Seleccionar todo/Ninguno", summary pills + agrupación por categoría.
- **Push a stores existentes:**
  - Vocab → `eng_srs_deck` como flashcards box 1 con metadata.
  - Phrases → `eng_notes` con `stamp:'phrase', source:'import'`.
  - Tips → `eng_notes` con `stamp:'idea', source:'import'`.
- **Historial** en `eng_imported_lessons` (cap 50, sincronizado via SYNC_REGISTRY) · últimas 5 entradas visibles en UI.
- **Toast verde** al confirmar importación.
- **API CLI**: `window.ENG_IMPORT.{scan, extract, importItems, log, openTab}`.

### Archivos
- ➕ `frontend/js/eng-import.js` (NUEVO · ~430 líneas IIFE)
- ✏️ `frontend/english.html` (3 edits: tab + panel `#p-import` + script tag)
- ✏️ `frontend/css/english.css` (+~110 líneas bloque "F4 · IMPORTAR" + modal de revisión + toast)
- ✏️ `frontend/js/cloud-sync.js` (`eng_imported_lessons` añadido al SYNC_REGISTRY)

### Verificación
Smoke test en preview con texto sample tipo Platzi (vocab/grammar tips/professional phrases): parser detectó correctamente **5 vocab + 8 frases + 3 tips = 16 items**. Modal de revisión renderizó agrupados con checkboxes. Importación impactó stores correctos: `eng_srs_deck` ganó 5 cards en box 1 con metadata `source:'import'`, `eng_notes` ganó 11 entradas (8 phrases + 3 tips) todas con `source:'import'`, log creado con timestamp + results. Toast verde mostrado. Historial visible en UI.

---

## 🇺🇸 3-ENG · F3 · Mapa de Tiempos (knowledge graph SVG) — 2026-05-25

### Qué cambió
Ejecutada **F3** del rediseño Second Brain. Esta fase materializa la **técnica C (JSON Canvas)** del Modelo: un knowledge graph visual de los 12 tiempos verbales con relaciones tipadas (trampas hispanas, secuencias temporales, evolución por aspecto).

### Entregado
- **Toggle Grid/Mapa** arriba del grid · vista preferida persiste en `localStorage.eng_tense_view` (local, no sync).
- **SVG knowledge graph** con layout 3 columnas (Past/Present/Future) × 4 filas (Simple/Cont/Perf/PerfCont). 12 nodos circulares + 16 aristas curvas tipadas:
  - **Trampa hispana** (4 aristas · ámbar punteada): `present_perfect ↔ past_simple`, `present_perfect ↔ present_simple`, `past_continuous ↔ past_simple`, `future_simple ↔ present_simple`.
  - **Secuencia temporal** (3 aristas · verde sólida): `past_simple → past_perfect`, `present_simple → future_simple`, `future_simple → future_perfect`.
  - **Evolución por aspecto** (9 aristas · violeta sutil): conecta horizontalmente Simple → Continuous → Perfect → Perfect Continuous en cada fila.
- **Interactividad rich**: hover en nodo destaca vecinos + dim no-vecinos + muestra detalle en sidebar (uso del tense + pills nivel/trampas/secuencias). Hover en arista muestra la regla específica en sidebar. Click en nodo abre el modal de lección de F1.
- **Sidebar sticky** con leyenda completa (3 tipos de conexión, 3 niveles de dificultad, 3 estados de progreso) + zona de detalle dinámica.
- **Estados visuales**: untouched (gris) · viewed (borde ámbar) · mastered (borde verde + 🌟). Nombre del tiempo coloreado por nivel (verde basic / ámbar intermediate / rojo advanced).
- **API CLI**: `window.ENG_TENSES.switchView(view)` + `window.ENG_TENSES.TENSE_EDGES` (dataset expuesto).

### Archivos
- ✏️ `frontend/js/eng-tenses.js` (+~230 líneas: TENSE_EDGES dataset, _renderMap SVG, _renderViewToggle, switchView, hover/click handlers, _highlightNeighbors)
- ✏️ `frontend/english.html` (1 edit: tense-toolbar con toggle + `<div id="tenseMap">`)
- ✏️ `frontend/css/english.css` (+~110 líneas bloque "F3 · TOGGLE VISTA + MAPA" + responsive mobile)

### Verificación
Smoke test en preview: 12 nodos + 16 aristas renderizados sin errores. Hover sobre Present Perfect destaca 4 vecinos + sidebar muestra "INTERMEDIO · 2 TRAMPAS". Hover sobre arista trap muestra "Present Perfect ⇄ Past Simple · Con fecha específica ('in 2022') cambia a past simple, NO present perfect." Click en Future Perfect Continuous abre el modal F1. Vista persistida en localStorage al reload.

---

## 🇺🇸 3-ENG · F2 · Forja de Oraciones (motor + UI + CLI) — 2026-05-25

### Qué cambió
Ejecutada **F2** del rediseño Second Brain de 3-ENG inmediatamente después de F1. Esta fase materializa la **técnica D (CLI/Skills)** del Modelo: un motor de conjugación reutilizable expuesto en `window` + una UI educativa de construcción de oraciones encima del grid.

### Entregado
- **Motor `buildSentence(tense, mood, subject, verb, complement)`** que cubre los 12 tiempos × 3 modos = 36 conjugaciones. Devuelve oración + array de slots tipados.
- **UI Forja** colapsable arriba del grid de Tiempos: select tense + radios modo + selects sujeto/verbo + input complemento. Botones: ⚡ Generar / 🎲 5 variaciones / Limpiar.
- **Resultado visual** con slots coloreados (sujeto verde · auxiliar ámbar · verbo violeta · negación rojo · complemento neutro) + breakdown etiquetado por slot.
- **TTS + Save to notes** (💾) en cada oración generada (push a `eng_notes` con `source:'forja'`).
- **Integración con F1**: botón "🧱 Forjar oración con este tiempo" en el footer del modal de lección — cierra modal, expande Forja, scrollea y pre-selecciona el tense.
- **22+ verbos** del dominio data-analyst + **7 sujetos** con conjugaciones precomputadas.
- **API CLI expuesta**: `window.ENG_TENSES.{buildSentence, randomSentence, openForja, SUBJECTS, VERBS}` — invocable por Copilot, sub-agentes o cualquier otro módulo.

### Archivos
- ✏️ `frontend/js/eng-tenses.js` (+~340 líneas: SUBJECTS, VERBS, buildSentence engine con switch sobre 12 tiempos, renderForja, openForja, save-to-notes)
- ✏️ `frontend/english.html` (1 edit: `<div id="forja"></div>` insertado arriba del grid en el panel Tiempos)
- ✏️ `frontend/css/english.css` (+~80 líneas bloque "F2 · FORJA DE ORACIONES" + responsive mobile)

### Verificación
Smoke test en preview con 25 combinaciones tense × mood × subject × verb · todas correctas. Casos críticos verificados: "She studies", "It goes", "He doesn't work", "Is she running...", "She has written...", "We had deployed...", "I will have been learning for 5 years by July." Flujo modal→Forja con pre-selección verificado. TTS funcional. Save-to-notes verificado.

---

## 🇺🇸 3-ENG · F1 · Tab ⏰ Tiempos Verbales (rediseño Second Brain) — 2026-05-25

### Qué cambió
Arrancó el rediseño "Second Brain" de 3-ENG con la **F1** del plan 6-fases. Foco en el dolor real del usuario: "no sé los tiempos verbales". Fusión de las 5 técnicas (A Karpathy / B Web Clipper / C Canvas / D CLI / E Local-first) — esta fase ejecuta principalmente C+E con la espina dorsal del módulo.

### Entregado
- **Nueva pestaña `⏰ Tiempos`** entre Vocabulary y Grammar.
- **Grid 4×3** de los 12 tiempos del inglés: filas = Pasado/Presente/Futuro · columnas = Simple/Continuous/Perfect/Perfect Continuous.
- **Modal de lección** por celda con: fórmulas (afirmativo/negativo/pregunta), palabras señal, 3 ejemplos data-analyst con TTS, **trampa hispana** destacada, top de errores comunes y verbos irregulares clave.
- **Stats bar**: Vistos / Dominados / barra % del curso.
- **Estados visuales**: untouched / viewed (ámbar) / mastered (verde con 🌟) + ring inferior por nivel (basic verde · intermediate ámbar · advanced rojo).
- **API CLI** `window.ENG_TENSES.{init, openLesson, mark, getProgress, closeModal}` expuesta para Copilot/sub-agents.
- **Sync cross-device** vía `eng_tense_progress` añadido al SYNC_REGISTRY.

### Archivos
- ➕ `frontend/data/tenses.json` (NUEVO · 12 tiempos curados manualmente · sin alucinación)
- ➕ `frontend/js/eng-tenses.js` (NUEVO · ~290 líneas IIFE)
- ✏️ `frontend/english.html` (3 edits: tab + panel + script boot)
- ✏️ `frontend/css/english.css` (+~120 líneas bloque "F1 · TIEMPOS VERBALES")
- ✏️ `frontend/js/cloud-sync.js` (1 línea · `eng_tense_progress` añadido al SYNC_REGISTRY)

### Verificación
Preview corrido en localhost:3456. La pestaña aparece, las 12 celdas se rendean, el modal abre con todo el contenido, "Marcar como dominado" persiste en localStorage y el grid se actualiza en vivo (1/12 Vistos, 1 Dominado, 8% del curso confirmado).

### Pendiente (Fases F2-F6)
- **F2**: Forja de Oraciones (builder tense+mood+subject+verb) + `ENG_TENSES.buildSentence()`.
- **F3**: Vista Canvas global del módulo como knowledge graph (técnica C).
- **F4**: Importador del cuaderno "English" / Platzi desde 13-NOT (técnica B).
- **F5**: Detector top-10 errores hispanos en texto del usuario (técnica A).
- **F6**: Auto-feed de vocab importado → SRS deck.

---

## 🌐 8-PRO · 3 prompts del proyecto completo + limpieza — 2026-05-19d

### Qué cambió
- **Limpieza:** eliminados 6 archivos basura de `frontend/` (scratch del Bug Hunt: check_tokens.txt · defined_tokens.txt · element_ids.txt · refs.txt · sync_check.txt · tokens_used.txt).
- **3 prompts whole-project** agregados a `module-prompts.js` — mismo triad que los module prompts (improve/audit/creative) pero scope = los 16 módulos como UN sistema:
  - `PROJECT.P1 · ⚡ Improve/Optimize/Update` — elige el trabajo de mayor leverage cross-cutting (no un módulo aislado).
  - `PROJECT.P2 · 🔬 Audit/Bugs/Health` — auditoría read-only system-wide, delega a sub-agent Explore, reporte por severidad × módulo.
  - `PROJECT.P3 · 🧠 Creative/Second Brain` — aplica Modelo.md a nivel SISTEMA (16 módulos interconectados, no 16 silos).
- Cada uno: inglés compacto · `PROJECT_BASE` (pre-read CEREBRO_STATE matrix + infra compartida + 16 módulos) · PRIOR RUNS + LOG con IDs `PROJECT.P1/P2/P3`.
- UI tab 🧩 Módulos: el selector ahora abre con **"🌐 PROYECTO COMPLETO"** primero, divisor, luego los 16 módulos.
- `PROMPT_RUNS.md`: nueva sección "Project-Wide Prompts (3)".

### Archivos
- `frontend/js/module-prompts.js` (PROJECT_META + PROJECT_PROMPTS + selector/renderer).
- `PROMPT_RUNS.md` (sección nueva).
- 6 .txt basura eliminados.

---

## 🔧 13-NOT · Notebook Overhaul · sprint multi-fase — 2026-05-19c

Sprint pedido por el usuario: arreglar Grafo · editar notas · estándar de notebooks · mover notebooks entre módulos · iconos pulidos · fluidez. Plan de 6 fases.

### ✅ F1 · Audit de errores + Grafo reconstruido
**Bugs encontrados y corregidos en el Grafo (`notes-brain.js`):**
- 🔴 *Tag-edge explosion*: el grafo dibujaba una arista por CADA par de notas que compartía CUALQUIER tag → 10 notas con 'study' = 45 aristas = hairball ilegible.
- 🟡 Notas diarias (`type:'daily'`) se incluían como nodos — son inbox, no conocimiento.
- 🟡 Layout radial puro · labels solapados pasados ~12 nodos.

**Solución — Grafo v2 (tag-clustered):**
- Tags pasan a ser **clusters espaciales + color**, NO líneas. Cada tag = sector angular · nodos distribuidos en 2 arcos concéntricos.
- Aristas = SOLO `[[wiki-links]]` (líneas violeta) · dedup por par.
- Solo `type:'note'` (diarias excluidas).
- Filtro por tag (chips toggle) · hover resalta nodo + vecinos y atenúa el resto · tamaño de nodo por grado · labels de sector.
- Detección de huérfanas (sin tag ni link).

### ✅ F2 · Edición de notas (gap crítico)
- **Bug confirmado:** `notes.html` no tenía `editNote` — las notas eran create-only · imposible cambiar título/cuerpo/tags tras crearlas.
- **Solución:** objeto `Editor` en notes-brain.js · modal de edición (título + tags toggle + cuerpo) · botón "✏️ Editar" en la action-bar hover de cada nota (junto a 🃏 Flashcard).
- `window.NOT.edit(id)` expuesto en el CLI.

### Archivos (F1+F2)
- `frontend/js/notes-brain.js` (Graph reescrito · Editor nuevo · afterRenderNotes con action-bar).

### ✅ F3 · Estándar de notebooks (`nb-engine.js`)
- Nuevo `frontend/js/nb-engine.js` — define EL ESTÁNDAR canónico de notebooks.
- `NBEngine.SCHEMA`: meta `{id,name,icon,cover,color,created,updated}` · data `{[id]:{pages:[{id,title,body,images,attachments,links,created,updated}]}}`.
- `NBEngine.MODULES`: registry de los 3 módulos con notebooks (13-NOT · 10-SYS · 14-WORK) y sus storage keys.
- API: `list(mod)` · `loadMeta/loadData(mod)` · `validate(nb)` · `normalize(nb)` · `transfer()` · `transferUI()`.
- Decisión: NO se reescribieron los 3 IIFEs (NotNB/WorkNB/SysNB) — eso era refactor riesgoso de alto costo/bajo valor. En su lugar nb-engine.js documenta el estándar (los 3 schemas YA eran idénticos) y agrega la capa de portabilidad encima.

### ✅ F4 · Mover notebooks entre módulos
- `NBEngine.transfer(nbId, from, to)` — MUEVE (no copia) un notebook: meta + data bucket entre storage keys · borra del origen.
- Los binarios (attachments/imágenes) viven en IndexedDB `da2026_nb` GLOBAL → los refs viajan en el page data · no hay que mover blobs.
- `NBEngine.transferUI()` — modal selector de módulo destino.
- Botón "📦 Mover" wireado en los 3 módulos: NotNB (13-NOT) · WorkNB (14-WORK) · NB custom notebooks (10-SYS).
- **Bug prevenido:** 10-SYS usa `isCustom()` = `id.startsWith('cnb_')`. transfer() re-idea el notebook con prefijo `cnb_` al entrar a 10-SYS (registry `requirePrefix`).
- Las 6 storage keys ya estaban en SYNC_REGISTRY → los moves sincronizan cross-device.

### Archivos (F3+F4)
- `frontend/js/nb-engine.js` (NUEVO).
- `frontend/js/notes-nb.js` · `frontend/js/work.js` · `frontend/systems_logic.js` (botón Mover + función moveNotebook + export).
- `frontend/notes.html` · `work.html` · `systems.html` (carga de nb-engine.js).

### ✅ F5 · Portadas + iconos rediseñados (`nb-shared.css`)
- **12 portadas reconstruidas** — cada una ahora layerea: gradiente base + textura + sheen de luz top-left + vignette para profundidad. Se ven diseñadas, no planas.
- **Cover card** (header del notebook): glass spine lateral (highlight→sombra) · overlay de sheen + vignette · sombra con inset highlight · hover lift.
- **Icono del cuaderno**: ahora va dentro de un **badge circular de vidrio esmerilado** (backdrop-blur + borde + sombra) → cualquier emoji se ve intencional y pulido sin tener que migrar a SVG.
- **Icon picker**: botones más grandes (38px) · gradiente · hover spring (scale+lift) · active glow violeta · focus-visible.
- Picker grid: check ✓ en la portada seleccionada · sheen en cada opción.

### ✅ F6 · Fluidez + microinteracciones (`nb-shared.css`)
Bloque FLUIDITY agregado · transiciones en todo el ecosistema notebook:
- Page entries · hover slide.
- Toolbar / rich-text buttons · spring press (cubic-bezier overshoot) + active scale.
- Image cards · zoom-in lift + brightness al hover.
- Attachment chips + link rows · slide affordance.
- Saved badge · pulse-in suave.
- Page editor · fade-up al abrir página (`nbFadeUp`).
- Modales (drop + design) · scale-in (`nbModalIn`).

### Archivos (F5+F6)
- `frontend/css/nb-shared.css` (covers v2 · icon picker · bloque FLUIDITY).

### 🏁 Sprint notebook overhaul · COMPLETO (6/6 fases)
| Fase | Estado |
|---|---|
| F1 · Audit + Grafo reconstruido | ✅ commit 222a105 |
| F2 · Edición de notas | ✅ commit 222a105 |
| F3 · Estándar nb-engine | ✅ commit 4e8ee2f |
| F4 · Mover entre módulos | ✅ commit 4e8ee2f |
| F5 · Portadas + iconos | ✅ (este commit) |
| F6 · Fluidez | ✅ (este commit) |

---

## 📝 13-NOT · Second Brain Layer · 5 fases (prompt 13-NOT.P3) — 2026-05-19b

### Origen
Ejecución del prompt curado `13-NOT.P3` (creative · Modelo.md). El usuario eligió "ejecutar las 5 fases en el orden más óptimo".

### Orden ejecutado (por dependencias)
**5 → 2 → 3 → 4 → 1** (CLI foundation → wiki-links → SRS pipeline → canvas → AI organizer capstone).

### Qué se construyó
Nuevo `frontend/js/notes-brain.js` (33K · IIFE `NOT` + `window.NOT` CLI) cargado al final de `notes.html`. Las notas pasan de lista plana taggeable a base de conocimiento conectada.

**F1 · CLI + Daily Note** (idea #5)
- Migración: cada nota de `sb_notes2` recibe `id` estable (antes se direccionaban por índice de array · frágil).
- Nota del día (`type:'daily'`) como inbox de captura rápida · card inyectada arriba de la pestaña "Todas".
- `window.NOT.{all,get,search,create,append,today,capture,link,backlinks,toFlashcard,graph,organize,showOrganizer,deepPrompt}`.

**F2 · Wiki-links** (idea #2 · Karpathy/wiki)
- Sintaxis `[[título de nota]]` en el cuerpo · render clickable (existe = violeta · no existe = rojo).
- Autocomplete al escribir `[[` en el editor `#nBody`.
- Footer de backlinks ("↩ Mencionada en") por nota.

**F3 · Notes → SRS** (idea #3)
- Botón 🃏 Flashcard por nota (hover) → modal (front/back editables) → tarjeta al deck `eng_srs_deck` (box 1 Leitner · campo `sourceNoteId`).
- Reusa el schema de srs.js sin tocar ese archivo.

**F4 · Knowledge Graph** (idea #4 · JSON Canvas)
- Nuevo tab "🗺️ Grafo" · SVG radial · nodos = notas · aristas = wiki-links (sólida) + tags compartidos (punteada).
- Color por tag · tamaño de nodo por grado · detección de huérfanas · click nodo → salta a la nota.

**F5 · Karpathy Organizer** (idea #1)
- Botón "🧹 Ordená mi cerebro" → panel con análisis heurístico LOCAL:
  - Near-duplicados (similitud Jaccard >50%).
  - Tags sugeridos (keyword matching) · aplicar con un click.
  - Links sugeridos (una nota menciona el título de otra) · enlazar con un click.
  - Notas huérfanas (sin tag/link/backlink).
- Botón "📋 Copiar prompt Karpathy" → genera prompt para reorganización profunda con IA en Claude Code (bridge al agente real).

### Archivos
- `frontend/js/notes-brain.js` (NUEVO · 33K).
- `frontend/notes.html` (6 ediciones quirúrgicas: `id` en saveNote · `data-note-id` + hook en renderNotes · tab Grafo · panel · script · `onNotesChanged` hook).

### Decisiones de diseño
- Cero cambios a SYNC_REGISTRY: `sb_notes2` y `eng_srs_deck` ya estaban registrados.
- Local-first estricto: el Organizer es heurístico (Jaccard + keywords) · sin APIs externas · el "deep reorg" es opt-in vía prompt copiado.
- Ediciones a `notes.html` mínimas (6 quirúrgicas) · el grueso vive en notes-brain.js · no se tocó notes-nb.js (Cuadernos intactos).
- IDs estables: antes las notas se direccionaban por índice (frágil para links/grafo) · ahora `id` estable con migración retro-compatible.

### Sanity check
- ✅ `notes-brain.js` parsea (33314 chars).
- ✅ tab Grafo + panel + script integrados.

### Pendiente / próximo run de 13-NOT.P3
Ver `PROMPT_RUNS.md` ID:13-NOT.P3 · "Next": no reconstruir · nuevos ángulos (export grafo a 15-MM como jsMind real · realtime cross-device para nota del día · flashcard desde texto seleccionado · ejecutar el deep-reorg vía sub-agent).

---

## 🧠 2-APP · Second Brain Layer · 5 fases (prompt 2-APP.P3) — 2026-05-19a

### Origen
Ejecución del prompt curado `2-APP.P3` (tab 🧩 Módulos · creative · Modelo.md). El usuario eligió "trabajar las 5 ideas del brainstorm en el orden más óptimo".

### Qué se construyó
Nuevo archivo `frontend/js/app-second-brain.js` (33K · IIFE `APP` + `window.APP` CLI) cargado al final de `apply.html`. Convierte 2-APP de tool session-based efímero a sistema con memoria + automatización + aprendizaje.

**F1 · Foundation + CLI** (idea #4)
- Storage `app_analyses` (localStorage · TIER 2 · registrado en SYNC_REGISTRY de cloud-sync.js · cross-device).
- Hook sobre `runAnalysis()`: cada análisis se auto-snapshotea (company · role · jd · match · profile · outcome).
- Panel "historial de análisis" (últimos 20 · re-cargar · editar outcome · borrar) debajo del Analizador.
- CLI: `window.APP.{list,get,load,current,clear,exportAll,inbox,showClipper,bookmarklet,setOutcome,insights,concepts,renderCanvas,analyze,weaveCV/Cover/Interview/Prompts}`.
- `APP.inbox(payload)` acepta JDs de fuentes externas (agentes · scrapers) → auto-analiza.

**F2 · Web Clipper** (idea #1)
- `APP.showClipper()` abre modal con bookmarklet generado dinámicamente.
- Bookmarklet captura URL + título + JD body (selectores LinkedIn/Indeed/Computrabajo + fallback) → abre `apply.html?clip=1&...`.
- Handler de URL params al cargar: prefilla form (parsea "Role at Company" del título).

**F3 · Outcome Coach** (idea #5)
- Editor de outcome por análisis (status: analyzed/applied/callback/interview/offer/rejected · salario pedido · notas).
- Motor de correlación 100% local (sin APIs externas): callback rate · skill lift (skills en positivos vs rechazos) · mejor industria · word-count promedio.
- Tab "📊 Coach" con panel de insights.

**F4 · Job Market Wiki** (idea #2 · Karpathy)
- Agregador de conceptos del corpus: skills que tenés / que el mercado pide / tactical / power words / red flags.
- Chips ordenados por frecuencia · drill-down modal (qué vacantes mencionan cada concepto).
- Tab "📚 Wiki".

**F5 · Career Canvas** (idea #3 · JSON Canvas)
- Pipeline visual de 6 columnas por outcome status · cada vacante = nodo · color por estado.
- Click nodo → editor de outcome. Cross-link con 5-JOB (`da_vacancies`): muestra overlap.
- Tab "🗺️ Canvas".

### Archivos
- `frontend/js/app-second-brain.js` (NUEVO · 33K).
- `frontend/apply.html` (3 tabs nuevos · 3 paneles · history container · `<script>`).
- `frontend/js/cloud-sync.js` (`app_analyses` agregado a SYNC_REGISTRY).

### Decisiones de diseño
- `app_analyses` separado de `da_vacancies` (5-JOB): el primero es cache de TODOS los análisis · el segundo solo las que el user trackea formalmente. Cross-link, no merge.
- Local-first estricto: el Coach no llama ninguna API externa · todo el análisis corre en el browser.
- Reusa Design System v1.0 (tokens · sin hex) · reusa el tab-switch genérico de apply.js (los 3 tabs nuevos funcionan sin tocar apply.js).
- Hook no invasivo sobre `runAnalysis` (wrap · `window._appHooked` guard contra doble-hook).

### Sanity check
- ✅ `app-second-brain.js` parsea (32966 chars).

### Pendiente / próximo run de 2-APP.P3
Ver `PROMPT_RUNS.md` ID:2-APP.P3 · "Next": no reconstruir · elegir nuevo ángulo (export a 15-MM · clustering Karpathy de conceptos · cron de re-scoring · realtime cross-device para app_analyses).

---

## 🌐 Prompt Lab · Fase D · English + compact + execution tracking — 2026-05-15o

### Qué pidió el usuario
- Prompts en INGLÉS (los previos eran mix Spanish/English).
- `desc` (UI summary) puede quedar en Spanish — los **bodies completos** en English.
- Token-saving es prioridad #1.
- Cada ejecución debe **quedar registrada** para que la próxima vez que el mismo prompt corra, Claude sepa qué se hizo y no repita.

### Solución entregada

**1. Nuevo archivo `PROMPT_RUNS.md`** (root del repo)
- Log central de ejecuciones por prompt-ID.
- Convención IDs: `{module-code}.P1/P2/P3` para los 48 modular · `LIB.{slug}` para Library (`LIB.recovery`, `LIB.bootstrap`, `LIB.bug-hunt`, `LIB.sync-audit`, `LIB.cross-module`, `LIB.capabilities-audit`).
- Template de entry estandarizado: `ID · Date · Commit · Files · Changed · Next`.

**2. `frontend/js/module-prompts.js` reescrito** (Fase D)
- Cada prompt body en **inglés compacto**.
- Cada prompt incluye:
  - `PRIOR RUNS: grep PROMPT_RUNS.md for "ID:..." before starting. EXTEND or take a NEW angle — never repeat.`
  - `LOG: append to PROMPT_RUNS.md` (template embebido).
- `desc` (UI) se mantuvo en Spanish para el user-facing.
- Tamaño: `module-prompts.js` pasó de 19.4K a 14.5K chars (~25% reducción) **incluyendo** los nuevos bloques PRIOR RUNS + LOG.
- Por prompt: ~2200 chars → ~1100 chars (50% reducción).

**3. Library `cat:'claude'` traducidas al inglés** (6 entries refactorizadas)
- `🔁 Full Context Recovery` (ID:LIB.recovery)
- `🧠 CEREBRO Bootstrap` (ID:LIB.bootstrap)
- `🐛 Bug Hunt periodic` (ID:LIB.bug-hunt)
- `🔄 Sync Audit periodic` (ID:LIB.sync-audit)
- `🧭 Cross-Module Wiring` (ID:LIB.cross-module)
- `🔌 Capabilities Audit` (ID:LIB.capabilities-audit)

Cada una con bloque PRIOR RUNS + LOG y `desc` en Spanish.

### Token-saving · medición
| Métrica | Antes (Fase A) | Ahora (Fase D) | Reducción |
|---|---|---|---|
| Body promedio P1 modular | ~2300 chars | ~1150 chars | **-50%** |
| Body promedio P2 audit | ~2400 chars | ~1200 chars | **-50%** |
| Body promedio P3 creative | ~3100 chars | ~1700 chars | **-45%** |
| 🐛 Bug Hunt library | ~2400 chars | ~1300 chars | **-46%** |
| 🧠 Bootstrap library | ~2300 chars | ~1500 chars | **-35%** |
| `module-prompts.js` total | 19.4K | 14.5K | **-25%** |

### Cómo funciona la memoria entre ejecuciones
1. Usuario pega el prompt (ej. `12-FIN.P1`).
2. Claude PRIMERO greppea `PROMPT_RUNS.md` por `ID:12-FIN.P1`.
3. Lee las N entradas previas · entiende qué se hizo · qué quedó pendiente.
4. Ejecuta la tarea EXTENDIENDO el trabajo previo (no repetir).
5. Al cerrar, append a `PROMPT_RUNS.md`:
   ```
   ### ID:12-FIN.P1 · 2026-05-20
   - Commit: abc1234
   - Files: frontend/finance.html
   - Changed: añadido gráfico de tendencia trimestral
   - Next: agregar export CSV de movimientos por categoría
   ```

### Sanity checks
- ✅ `prompts.html` inline JS parsea (135668 chars).
- ✅ `module-prompts.js` parsea (14468 chars).

### Pendiente · usuario decide
- Traducir los prompts NO-claude que están en Spanish (categorías `data`, `code`, `biz`, `learn`, `asistente`, `exam`) — son ~25 entries. ¿Necesarios o son OK Spanish?
- Aplicar el patrón PRIOR RUNS + LOG a esas ~25 entries Spanish (si el usuario las usa con Claude Code).

---

## 📚 Prompt Lab Overhaul · Fase C · Library refresh — 2026-05-15n

### Qué cambió
Limpieza + refresh del array `lib` (Librería) en `prompts.html`. Los prompts module-specific ahora viven en el tab **🧩 Módulos** (Fase A) · la Librería pasa a ser cross-cutting + templates universales + categorías de estudio.

### Eliminados (12 entries duplicados)
Los siguientes prompts estaban duplicados con el tab 🧩 Módulos:
- "Work on 3-ENG English Academy"
- "Work on 5-JOB Job Tracker"
- "Work on 10-SYS Systems Engineering"
- "Work on 11-ACC Accounting"
- "Work on 9-GOA / 12-FIN / 13-NOT"
- "Update Main Page"
- "⚙️ 10-SYS Sprint"
- "💰 12-FIN Sprint"
- "📝 13-NOT Sprint"
- "💼 5-JOB Sprint"
- "📚 3-ENG Sprint"
- "📋 Module Sprint Template"

### Refrescados (6 entries con estado actual)
- **🔁 Full Context Recovery** — reescrito con estado post-Fase 3 · Design System v1.0 vivo · 16 módulos · todas las capabilities listadas.
- **🧠 CEREBRO Bootstrap** — sumario actualizado: 16/16 migrados · Bug Hunt cerrado · Fase A+B · pre-reading expandido a CLAUDE.md + MEMORY.md + PROMPT_14-WORK.md.
- **Token Conservation Cheatsheet** — de 10 reglas a 12 · agregados los 16 module codes · agregadas reglas "delegá a sub-agents" + "worktree para refactors grandes".
- **🐛 Bug Hunt (periódico)** — convertido en template repetible · delegación a sub-agent Explore por defecto · checklist Design System v1.0 + WCAG.
- **🔄 Sync Audit (periódico)** — marcado como template · baseline post-Fase 3 (jt_s8, ruta_st, sys_active_custom YA registrados).
- **🎨 Design Audit (periódico)** — marcado como template post-Design System v1.0 · busca regresiones.
- **🎨 MASTER UX SPRINT** — marcado como HISTÓRICO · todas sus fases (1 + 2.1-2.6 + 3 + A + B) están cerradas. Sólo útil como reference template para el siguiente sprint maestro.

### Agregados (2 nuevos cross-cutting)
- **🧭 Cross-Module Wiring** — para features que tocan 2+ módulos (attachments compartidos · sync chain · realtime · data flow entre 10-SYS/13-NOT/14-WORK/15-MM). Protocolo plan-first · source-of-truth · sync registry check · componentes compartidos · tests cross-module.
- **🔌 Capabilities Audit** — audit de cuáles capabilities estoy aprovechando vs cuáles podría. Score 🟢🟡🔴 por tarea + top-3 capabilities infrautilizadas + recomendaciones.

### Resumen tabla
| Categoría `cat:'claude'` | Antes | Ahora |
|---|---|---|
| Total entries | 22 | **12** (-10 neto) |
| Module-specific (duplicados de 🧩 Módulos) | 12 | **0** |
| Cross-cutting (templates universales) | 10 | **10 refrescados + 2 nuevos = 12** |
| HTML/JS válido | ✅ | ✅ (138307 chars parse OK) |

### Estado del Prompt Lab (cierre Fase C)
- **🎯 Claude Optimize:** v2026-05-15.B con 17 módulos + 18 task types + 33 signals + bloque "Available Capabilities".
- **⚡ Optimize:** motor genérico de prompt engineering · sin cambios estructurales (Fase B mantuvo el contrato).
- **🧩 Módulos:** 48 prompts modulares (16 × 3) con files reales + storage keys reales + Modelo.md insights.
- **📚 Librería:** 12 prompts cross-cutting (templates universales) + ~25 prompts por dominio (data · code · biz · learn · asistente · exam · write).
- **🧠 Dominar Claude:** 10 reglas (sin cambios).
- **📜 Historial:** sin cambios.

### Cerrado · todo el sprint Prompts
Fases ejecutadas en una pasada (5 commits):
1. **Fase A** (6538368): 48 module prompts + nueva tab.
2. **Fase B** (39de577): Claude Optimizer v2026-05-15.B + capabilities awareness.
3. **Fase C** (este): Library refresh + clean up duplicados.

---

## ⚡ Prompt Lab Overhaul · Fase B · Claude Optimizer v2026-05-15.B — 2026-05-15m

### Qué cambió
Overhaul completo de `claudeOptimize()` y `populateOptDropdowns()` en `prompts.html` para reflejar el **estado actual del Cerebro** y exponer las **capacidades vigentes**.

### 1. Catálogo de módulos (CO_MODULE) — 100% reescrito
Antes: descripciones del estado pre-migración, faltaban módulos 1-IND, 2-APP, 4-RUT, 6-TOO, 7-NEW (sólo aliases legacy).
Ahora: 16 módulos + 6 aliases legacy + GENERAL. Cada entrada incluye:
- Status de migración Design System v1.0 (qué Fase 2.x cerró la migración)
- Files reales (con todos los archivos JS auxiliares · srs.js · nb-shared.js · module-prompts.js)
- Storage keys actualizadas (con `jt_s8`, `ruta_st`, `sys_active_custom` registrados en Fase 3)
- Notas con identidades preservadas (14-WORK cyan · 15-MM violet --vi · 16-APA cyan)
- TIER 1 / TIER 2 / IndexedDB / Supabase Storage distinciones

### 2. CO_GLOBAL_FILES — refrescado
Agregados: `design-tokens.css`, `components.css`, `module-prompts.js`, `Modelo.md`.
Cloud-sync.js anotado con: SYNC_REGISTRY + DYNAMIC_PREFIXES + smartSync + realtime postgres_changes.
nb-shared.js anotado con: covers/icons/attachments + **Supabase Storage upload/download**.

### 3. CO_TASK_HINTS — 6 tipos nuevos
- `plan` (📐 Plan first · architecture)
- `agent` (🤖 Delegate to sub-agent · Explore/Plan/general-purpose/claude-code-guide)
- `skill` (🧰 Invoke Skill · docx/pdf/pptx/xlsx/claude-api/simplify/update-config/loop/schedule)
- `schedule` (⏰ Schedule recurring · CronCreate/ScheduleWakeup/scheduled-tasks)
- `worktree` (🌿 Isolate · Agent isolation: "worktree")
- `mcp` (🔌 Use MCP capability · Chrome/Preview/ccd/scheduled-tasks)

Cada uno con constraints específicos (cuándo usar · qué evitar · gotchas).

### 4. CO_SIGNALS — 14 señales nuevas
Detección automática de palabras clave que activan recomendaciones de:
- Design System v1.0 (--radius/--transition/--shadow-glow/focus-visible)
- Plan mode (architect/exit plan/plan first)
- Sub-agents (subagent/delegate/explore agent)
- Worktrees (isolated branch/git worktree)
- Skills (anthropic-skills/invoke skill)
- TodoWrite (track progress/multi-step)
- Schedule (cron/loop/recurring/periodic)
- spawn_task (out of scope/flag for later)
- mark_chapter (phase shift/new phase)
- Chrome MCP (browser automation/transcript/Drive)
- Preview MCP (preview/screenshot/UI test)
- Realtime (postgres_changes/cross-device)
- Modelo.md (Obsidian/second brain/karpathy/json canvas)
- Memory persistence (consolidate/MEMORY.md)

### 5. Spec template — sección "Available Capabilities"
Nuevo bloque agregado a ambos modos (concise + full) que lista las herramientas disponibles agrupadas por categoría:
Sub-agents · Worktrees · Skills · MCP · TodoWrite · ScheduleWakeup · CronCreate · spawn_task · mark_chapter · ShareOnboardingGuide.

### 6. UI refresh
- Dropdown de módulos: orden 1-16 sin aliases legacy (los aliases siguen en CO_MODULE para compat backward).
- Dropdown de task types: 6 nuevos.
- Tip banners actualizados (Claude Optimizer menciona v2026-05-15.B y todas las capabilities; Optimize menciona el pipeline + tab Módulos).

### CO_VERSION
`2026-04-27.8` → `2026-05-15.B`

### Pendiente · Fase C
- Library refresh: los prompts `cat:'claude'` legacy (Work on 3-ENG / Work on 5-JOB / etc.) ahora viven en el nuevo tab **🧩 Módulos**. Toca: archivar/eliminar los duplicados del array `lib` o renombrarlos a "Quick Templates" más conciso.

---

## 🧩 Prompt Lab Overhaul · Fase A · 48 prompts modulares — 2026-05-15l

### Qué cambió
Nueva pestaña **🧩 Módulos** en 8-PRO (`prompts.html`). 16 módulos × 3 prompts = **48 prompts curados** generados sobre el estado real del Cerebro post-Fase 3.

### Estructura por módulo (los 3 prompts)
- **P1 · ⚡ Mejorar / Optimizar / Actualizar** — workflow productivo: Plan first → Edits quirúrgicos → sync + CEREBRO_STATE + commit.
- **P2 · 🔬 Audit · Bugs · Updates** — checklist read-only de 6 categorías: código · sync · Design System v1.0 · UX · datos · alignment con CEREBRO_STATE.
- **P3 · 🧠 Creativo · Second Brain Model** — aplicación de las 5 técnicas extraídas de `Modelo.md` (Karpathy method · Web Clipper · JSON Canvas Skill · CLI/Skills · Local-first/Plugins) al módulo. Output en 2 pasos: brainstorm (5 ideas con esfuerzo S/M/L) → blueprint técnico (diff arq + schema + UI mock + riesgos).

### Archivos
- `frontend/js/module-prompts.js` (NUEVO) — data structure + renderer + auto-init DOMContentLoaded.
- `frontend/prompts.html` (modificado) — tab `🧩 Módulos` + panel `#p-modules` (selector + container) + carga del script.

### Cada prompt incluye obligatoriamente
- `REPO` · `LIVE` · `STACK` · `ARCH` · `AUTH chain` · `STATE cycle` · `SYNC` · `DESIGN SYSTEM v1.0`
- Files reales del módulo (post-migración)
- Storage keys reales (post sync audit · incluye `jt_s8` agregado en Fase 3)
- `MANDATORY al cerrar`: verificar SYNC_REGISTRY · update CEREBRO_STATE.md · commit `feat/fix([CODE])` · push origin main

### Modelo.md (Obsidian Second Brain) → P3 mapping
- A) **Karpathy method** · agente IA estructura volcado bruto en wiki/concepts/entities/sources
- B) **Web Clipper** · captura externa estructurada con metadata
- C) **JSON Canvas Skill** · visualización estratégica auto-generada (knowledge graph)
- D) **CLI · Skills** · API JS expuesta como `window.MOD.xxx` para agentes IA externos
- E) **Local-first · Plugins** · todo funciona sin red · sync es decoración

Ejemplos pre-cocinados para inspirar (no copiar literal):
- 10-SYS: Karpathy method para transcripts de clases
- 13-NOT: JSON Canvas mapa visual entre cuadernos
- 5-JOB: Web Clipper de vacantes desde LinkedIn → jt8
- 12-FIN: Local-first AI para categorización (privacy first)
- 14-WORK: CLI exponiendo `work.cases.create/link/relate`

### Pendiente · Fase B (próxima)
- Overhaul de `optimize()` + `claudeOptimize()` con las capacidades actuales (Plan mode · Worktrees · Sub-agents · Skills · MCP · TodoWrite · ScheduleWakeup · spawn_task · mark_chapter)
- Library refresh: pasar los prompts genéricos a un layer "templates universales" y mover los module-specific al nuevo tab

---

## 🐛 Fase 3 · Bug Hunt — 2026-05-15k

### Auditoría sistemática (delegada a Explore agent)
Scan completo del frontend buscando: tokens CSS sin definir, colisiones `.ds-*`, `getElementById` rotos, gaps en SYNC_REGISTRY, refs `script src`/`link href` rotas.

### Hallazgos en producción (16 módulos migrados) → CORREGIDOS
1. **`--c0` undefined en 10-SYS** (`systems.html:387,396`) — usado en `.cnb-selector-sel` y `.pim-modal`. **Fix:** agregado alias `--c0: var(--color-bg)` en `design-tokens.css`.
2. **`jt_s8` no estaba en SYNC_REGISTRY** — timestamp de inicio del Job Tracker (cuenta de días). **Fix:** agregado a `cloud-sync.js` para sync cross-device.

### Hallazgos descartados (falsos positivos o intencionales)
- `--rc` en `accounting.css:129-130` — **Intencional.** Se inyecta inline por card via `style="--rc:colorX"` en `accounting.js:355`. No es bug.
- `fin_sav_goal`, `fin_2026-04` "missing from SYNC_REGISTRY" — **Capturados por `DYNAMIC_PREFIXES = ['fin_', ...]`** en `cloud-sync.js:307`. No es bug.
- `navXP` en `accounting.js:222` — **Tiene null-check** (`if (xpBdg)`), falla silenciosamente. Dead code de un diseño previo, sin impacto en usuario.
- `work_eco_dict_seed_v` — Documentado como "local only" en `work.js:958`. Intencional.

### Hallazgos en módulos LEGACY (no producción)
- `css/main.css` + `css/auth.css` + `pages/*.html` — 45 tokens undefined (`--fb`, `--fh`, `--ink*`, `--txt*`, `--acid`, `--sky`, `--mint`, `--ember`, etc).
- **Decisión:** estos archivos están en `frontend/pages/` (configurar, empleos, ingles, prompts, proyectos, recursos, ruta, sesion, tacticas) — son **vestigios pre-DA-2026** no enlazados desde el dashboard actual. No bloquean nada de producción. Si en algún momento se decide rescatarlos, se migran. Por ahora: ignorar.

### Resumen tabla
| Categoría | Status | Acción |
|---|---|---|
| Tokens undefined (producción) | 🟢 1 → 0 | `--c0` aliasado |
| Colisiones `.ds-*` | ✅ Clean | — |
| `getElementById` rotos | 🟡 1 (silencioso) | sin acción (null-check) |
| Gaps SYNC_REGISTRY | 🟢 1 → 0 | `jt_s8` agregado |
| Refs `src`/`href` rotas | ✅ Clean | — |
| Tokens legacy en `pages/*` | 🟡 45 | sin acción (archivos obsoletos) |

### Lo que aprendí
- Después de una migración masiva (16 módulos al Design System v1.0), un audit estructurado revela menos bugs de lo esperado. El patrón "remover `:root` + dejar que aliases cubran legacy" funcionó.
- Los pocos hallazgos verdaderos (`--c0`, `jt_s8`) eran edge cases razonablemente difíciles de prever.
- `DYNAMIC_PREFIXES` es una arma poderosa — captura todas las variantes `fin_*` sin enumerarlas. Vale la pena documentarla mejor en `CLAUDE.md`.

### Pendiente
- Decidir destino de `frontend/pages/*.html` legacy: ¿archivar (`pages/_legacy/`) o migrar también? **Sugerencia:** archivar — ya no están enlazados desde ninguna parte del dashboard activo.

---

## 🏁 Fase 2.6 · Todos los P2 migrados · DESIGN SYSTEM v1.0 CERRADO — 2026-05-15j

### Qué cambió
Última tanda — siete migraciones P2 en una sesión. **16/16 módulos** ahora corren sobre el Design System v1.0.

### Módulos migrados
| Código | Archivos | Notas |
|---|---|---|
| 2-APP | `apply.html` + `css/apply.css` | imports + remove :root + refinar .tab/.card/.btn/.txa/.inp |
| 4-RUT | `ruta.html` (inline) | imports + remove :root inline + refinar .rt-card |
| 11-ACC | `accounting.html` + `css/accounting.css` | imports + remove :root + refinar .tab (verde --em) y .btn (texto #001f0d) |
| 6-TOO | `tools.html` (inline) | imports + remove :root + refinar .tab/.card |
| 7-NEW | `news.html` (inline) | imports + remove :root + refinar .tab/.btn |
| 15-MM | `mindmap.html` + `css/mindmap.css` | imports + reducir :root a `--vi` local + refinar .btn/.inp/.mm-tab |
| 16-APA | `apa.html` + `css/apa.css` | imports + reducir :root a cyan local + refinar .btn (texto cyan #001518) |

### Pattern aplicado
- `<link>` design-tokens.css + components.css agregados antes del CSS local.
- `:root{...}` removidos completos (excepto overrides locales legítimos: --vi en 15-MM, cyan en 16-APA).
- Reset `*{margin:0...}` removido (heredado del sistema).
- `.tab`/`.card`/`.btn`/`.inp`/`.txa` refinados con `--radius-md/sm`, `--transition-fast`, `--shadow-glow`, focus-visible global.
- Botones verdes con texto `#001f0d` para contraste WCAG AA.
- Botones cyan (16-APA) con texto `#001518`.

### Matriz final 16/16 ✅
| # | Código | Módulo | Fase |
|---|---|---|---|
| 1 | 1-IND | Dashboard | 2.1 |
| 2 | 14-WORK | Simetrik Hub (cyan) | 2.2 |
| 3 | 10-SYS | Systems Engineering (glass) | 2.3 |
| 4 | 13-NOT | Notes | 2.4 |
| 5 | 12-FIN | Finance | 2.4 |
| 6 | 8-PRO | Prompt Lab | 2.5 |
| 7 | 3-ENG | English Academy | 2.5 |
| 8 | 5-JOB | Job Tracker | 2.5 |
| 9 | 9-GOA | Goals & Habits | 2.5 |
| 10 | 2-APP | Application Center | 2.6 |
| 11 | 4-RUT | Ruta Data Analyst | 2.6 |
| 12 | 11-ACC | Accounting (verde --em) | 2.6 |
| 13 | 6-TOO | Tools | 2.6 |
| 14 | 7-NEW | News | 2.6 |
| 15 | 15-MM | Mind Map Studio | 2.6 |
| 16 | 16-APA | APA Studio (cyan) | 2.6 |

### Pendiente
- **Fase 3** (Bug Hunt): scan sistemático de la pagina entera buscando errores, regressions, consola con warnings.

---

## 🎯 Fase 2.5 · Todos los P1 migrados (8-PRO + 3-ENG + 5-JOB + 9-GOA) — 2026-05-15i

### Qué cambió
Cuatro migraciones en una sesión. **Grupo P1 completo:** 9/16 módulos ahora corren sobre el Design System v1.0.

### 8-PRO · Prompt Lab
**Archivo:** `frontend/prompts.html` (CSS inline)
- Imports `design-tokens.css` + `components.css` agregados.
- `:root{}` removido del bloque inline.
- `.tabs`/`.tab`: focus-visible con shadow-glow; transiciones específicas.
- `.card`: hover con `--bd2`; radio `--radius-md`.
- `.btn` (bp/bo/bg): focus-visible; hover lift + brightness; `.bg` texto `#001f0d` para contraste.
- `.textarea`/`.select`: focus con shadow-glow.
- `.result`: radio `--radius-md`.
- `.prompt-card`: focus-visible añadido; transiciones específicas (translateX preservado).
- `.cat-btn`: focus-visible añadido.

### 3-ENG · English Academy
**Archivos:** `frontend/english.html` + `frontend/css/english.css`
- Imports agregados en HTML.
- `:root{}` removido de CSS; reset `*{margin:0...}` removido.
- `.tabs`/`.tab`: focus-visible; transiciones específicas.
- `.card`: hover con `--bd2`.
- `.btn` (bp/bo): focus-visible; primary con hover lift + brightness.
- `.ein` / `.note-area`: focus con shadow-glow.

### 5-JOB · Job Tracker
**Archivos:** `frontend/jobs.html` + `frontend/css/jobs.css`
- Imports agregados en HTML.
- `:root{}` removido de CSS; reset `*{margin:0...}` removido.
- `.tabs`/`.tab`: focus-visible con shadow-glow.
- `.card`: hover con `--bd2`.
- `.btn` (bp/bo/bg): focus-visible; hover lift + brightness; `.bg` texto `#001f0d`.
- `.inp`: focus con shadow-glow.

### 9-GOA · Goals & Habits
**Archivos:** `frontend/goals.html` + `frontend/css/goals.css`
- Imports agregados en HTML.
- `:root{}` removido de CSS; reset `*{margin:0...}` removido.
- `.tabs`/`.tab`: focus-visible con shadow-glow.
- `.cd`: hover con `--bd2`; transición específica.
- `.btn` (bp/bo/bg): focus-visible; hover lift + brightness; `.bg` texto `#001f0d`.
- `.inp`/`.sel`: focus con shadow-glow.
- `.goal`: hover con `translateY(-1px)` (antes solo cambiaba borde).

### Matriz de migración actualizada (9/16)
| Código | Módulo | Estado | Fase |
|---|---|---|---|
| 1-IND | Dashboard | ✅ Migrado | 2.1 |
| 14-WORK | Simetrik Hub | ✅ Migrado (cyan) | 2.2 |
| 10-SYS | Systems Engineering | ✅ Migrado (glass) | 2.3 |
| 13-NOT | Notes | ✅ Migrado | 2.4 |
| 12-FIN | Finance | ✅ Migrado | 2.4 |
| 8-PRO | Prompt Lab | ✅ Migrado | 2.5 |
| 3-ENG | English Academy | ✅ Migrado | 2.5 |
| 5-JOB | Job Tracker | ✅ Migrado | 2.5 |
| 9-GOA | Goals & Habits | ✅ Migrado | 2.5 |
| 2-APP | Application Center | ⏳ Pendiente (P2) | 2.6 |
| 4-RUT | Ruta DA | ⏳ Pendiente (P2) | 2.6 |
| 11-ACC | Accounting | ⏳ Pendiente (P2) | 2.6 |
| 6-TOO | Tools | ⏳ Pendiente (P2) | 2.6 |
| 7-NEW | News | ⏳ Pendiente (P2) | 2.6 |
| 15-MM | Mind Map | ⏳ Pendiente (P2) | 2.6 |
| 16-APA | APA | ⏳ Pendiente (P2) | 2.6 |

### Lo que aprendí
- Patrón de migración estabilizado: imports → remove `:root` + reset `*` → refinar tabs/card/btn/inp con tokens + focus-visible.
- 4 módulos en una sesión es viable cuando comparten patrón violeta global (no hay overrides de color).
- Mantener transiciones específicas en lugar de `transition:all` mejora performance y previene flashes.

### Pendiente inmediato
- **Fase 2.6** (P2 · 7 módulos): 2-APP, 4-RUT, 11-ACC, 6-TOO, 7-NEW, 15-MM, 16-APA.
- **Fase 3** (Bug Hunt): scan sistemático.

---

## 📝💰 Fase 2.4 · 13-NOT + 12-FIN migrados · P0 CERRADO — 2026-05-15h

### Qué cambió
Cuarta y quinta migración en una sola sesión. **Grupo P0 completo:** los 5 módulos más usados ahora corren sobre el Design System v1.0.

### 13-NOT · Notes & Journal
**Archivo:** `frontend/notes.html`
- Agregados imports de `design-tokens.css` + `components.css` ANTES de `nb-shared.css`.
- `:root{}` removido completo · todos los tokens vienen del sistema vía aliases.
- Body conserva familia `IBM Plex Sans`.

**Microinteracciones:**
- `.tab`: focus-visible con shadow-glow; transiciones específicas.
- `.cd` (cards): hover con `--bd2`; transición `border-color`.
- `.btn` (bp/bo/bg): focus-visible; primary y green con hover lift + brightness.
- `.bg`: texto oscuro `#001f0d` para mejor contraste.
- `.inp` / `.txa`: focus con `shadow-glow` violeta + transiciones específicas.
- `.note`: hover con `translateY(-1px)` + shadow-md + border violeta (antes solo cambiaba borde).
- `.search-inp`: focus con shadow-glow.
- `.ftag` (filter tags): radio `--radius-full` (pill); focus-visible; opacity más visible al hover.
- `.stats` / `.st`: hover con cambio de fondo; valor en violeta `--a2`.

### 12-FIN · Finanzas Personales
**Archivos:** `frontend/finance.html` + `frontend/css/finance.css`
- Imports agregados en `finance.html`.
- `:root{}` removido completo de `finance.css`.
- Reset `*{margin:0...}` removido (viene del sistema).

**Microinteracciones:**
- `.mn-btn` (month nav): focus-visible con shadow-glow; transiciones específicas.
- `.kpi` (Ingresos/Gastos/Balance/Ahorro): hover con `translateY(-1px)` + borde más visible.
- `.tab`: focus-visible con shadow-glow.
- `.cd` (cards): hover con `--bd2`.
- `.btn` (bp/bg/br): hover con `translateY(-1px)` + brightness; focus-visible; primary y green con texto contrastado.
- `.inp`: focus con shadow-glow.
- `.sel`: focus con border violeta + transiciones.
- `.cat-btn` (toggle categorías): focus-visible; hover con cambio de color.

### Lo que NO se tocó (ambos módulos)
- HTML estructural (panels, forms, listas de transacciones).
- JavaScript (lógica de notes, journal, SRS Leitner, finanzas, KPIs, gráficos).
- `nb-shared.css` (compartido con 10-SYS y 14-WORK).
- Auth chain.

### Archivos modificados
- ✏️ `frontend/notes.html` (imports + microinteracciones en estilos inline)
- ✏️ `frontend/finance.html` (imports + 3 nuevos `<link>` tags)
- ✏️ `frontend/css/finance.css` (reducción de `:root`, microinteracciones)

### Validación visual
1. **13-NOT** · https://mikel696.github.io/da-2026/frontend/notes.html
   - Tab por inputs/botones/notes → focus ring violeta.
   - Hover sobre notas → lift sutil + shadow + borde violeta.
   - Filter tags (pills) → focus-visible.
2. **12-FIN** · https://mikel696.github.io/da-2026/frontend/finance.html
   - Hover sobre KPIs → lift sutil.
   - Tab por month-nav buttons / tabs / inputs → focus rings.
   - Botones primary/success/danger con feedback de hover mejorado.

### 🎯 Estado actual del migrado · 5/16 módulos · P0 CERRADO

| # | Módulo | Migrado | Identidad | Fase |
|---|---|---|---|---|
| 1 | 1-IND index.html | ✅ | violeta · rail/cards/stats | 2.1 |
| 2 | 14-WORK work.html | ✅ | **cyan local** · 13 tabs | 2.2 |
| 3 | 10-SYS systems.html | ✅ | violeta + glassmorphism | 2.3 |
| 4 | **13-NOT notes.html** | **✅** | violeta · journal + SRS | **2.4** |
| 5 | **12-FIN finance.html** | **✅** | violeta · KPIs + categorías | **2.4** |
| 6-16 | 11 módulos restantes | ❌ | P1/P2 pendientes | — |

### 🏁 P0 cerrado
Los 5 módulos más usados del Cerebro corren sobre el Design System v1.0. La consistencia visual base (paleta · tipografía · espaciado · radios · sombras · transiciones · focus rings) está garantizada en el ~80% del tiempo de uso del usuario.

### Próximo · Fase 2.5 (P1)
4 módulos frecuentes:
- **3-ENG** english.html · English Academy + Interview Dojo
- **5-JOB** jobs.html · Job Tracker
- **9-GOA** goals.html · Objetivos & Hábitos
- **8-PRO** prompts.html · Prompt Lab

Después: Fase 2.6 (P2) con los 7 menos usados (2-APP, 4-RUT, 11-ACC, 6-TOO, 7-NEW, 15-MM, 16-APA).

---

## ⚙️ Fase 2.3 · 10-SYS Systems Engineering migrado al Design System — 2026-05-15g

### Qué cambió
Tercer módulo migrado. 10-SYS es el más visualmente rico de los P0 (glassmorphism · gradientes vi→em · semáforos P0-P4 · 8 tabs · Cuaderno v2 con IndexedDB). Se conservó toda la identidad visual y se conectó al sistema canónico.

### Decisión de identidad
- Accent: **violeta canónico** del sistema (`#8b5cf6`) — heredado vía aliases.
- Variables específicas del módulo conservadas en `:root` local:
  - `--vi` (violet-darker · `#7c3aed`) — gradientes
  - `--vi2` (violet-soft · `#a78bfa`)
  - `--vg` (violet-bg)
  - `--tl` (teal · `#2dd4bf`)
  - `--tlg` (teal-bg)
- Glassmorphism + gradientes + orbs **preservados intactos**.

### Archivos modificados
- ✏️ `frontend/systems.html` — agregados imports de `design-tokens.css` + `components.css` ANTES de `nb-shared.css`. `:root` reducido a las 5 variables específicas del módulo. Body conserva familia tipográfica `Outfit` propia (override del default).

### Microinteracciones aplicadas
| Componente | Mejora |
|---|---|
| **`.tabs` / `.tab`** | Border-radius y padding desde tokens; focus-visible con shadow-glow; transiciones específicas (no `all`). |
| **`.gc` (glass card)** | Transiciones específicas; border-radius desde token `--radius-lg`. Hover preserva glassmorphism. |
| **`.subj` (subject card)** | Border-radius desde token; hover con `translateY(-1px)` + borde más visible; focus-visible con glow. |
| **`.qa` (quick access)** | Border-radius desde token; hover con `shadow-lg` (en vez de sombra custom); focus-visible. |
| **`.cert` (certification)** | Hover con `translateY(-1px)`; transiciones específicas. |
| **`.cert-link` (botón cert)** | Hover con shadow violeta + lift; focus-visible con glow. |
| **`.tf-input` / `.tf-select` / `.tf-date` (task form)** | Focus con `shadow-glow` + border violeta; transiciones específicas. |
| **`.tf-btn` (task add)** | Hover con shadow violeta + lift; focus-visible con glow. |

### Tokens utilizados
- `var(--radius-sm/md/lg)` → 6px / 10px / 14px
- `var(--transition-fast/base)` → 120ms / 180ms
- `var(--shadow-glow)` → focus rings violetas
- `var(--shadow-lg)` → hover de quick access
- `var(--space-2/4/5)` → 8px / 16px / 24px (gaps)

### Lo que NO se tocó
- HTML estructural (las 8 tabs · dashboard · materias · calendario · malla · certificaciones · CUN hub · clases perdidas · cuaderno).
- JavaScript (`systems_logic.js` 2299 líneas · SEED_TASKS · VERIFIED_SUBJECTS · Tab 7 class session injector · Cuaderno v2 con IDB).
- nb-shared.css (compartido con 13-NOT y 14-WORK).
- Orbs glassmorphism (orb-1, orb-2, orb-3).
- Gradientes vi→em en tabs activos, botones, progress bars.
- Semáforos P0-P4 con colores y animación pulse.
- Auth chain.

### Validación visual
1. Abrí: https://mikel696.github.io/da-2026/frontend/systems.html
2. Click en las 8 tabs → gradiente violeta→verde mantiene su estética.
3. Tab por teclado sobre tabs/inputs/botones → focus ring violeta consistente.
4. Hover sobre subject cards → lift sutil + borde violeta más visible.
5. Hover sobre quick access → shadow grande.
6. Hover sobre botones del task form / cert-link → shadow violeta + lift.

### Estado actual del migrado · 3/16 módulos
| Módulo | Migrado | Accent | Identidad propia |
|---|---|---|---|
| 1-IND index.html | ✅ Fase 2.1 | violeta canónico | rail · cards · stats |
| 14-WORK work.html | ✅ Fase 2.2 | **cyan local** | tabs · MOIF · attachments |
| **10-SYS systems.html** | **✅ Fase 2.3** | **violeta + gradientes vi→em** | **glassmorphism · orbs · semáforos** |
| 13-NOT notes.html | ❌ | violeta (P0 pendiente) | — |
| 12-FIN finance.html | ❌ | violeta (P0 pendiente) | — |
| (resto · 11 módulos) | ❌ | — | — |

### Próximo
Quedan 2 módulos P0: **13-NOT** y **12-FIN**. Después arrancan los P1 (3-ENG, 5-JOB, 9-GOA, 8-PRO).

---

## 🏠 Fase 2 Pilot · 1-IND migrado al Design System v1.0 — 2026-05-15e

### Qué cambió
Primer módulo migrado al Design System. Estrategia de mínimo riesgo elegida:
1. Importar los 2 archivos canónicos (design-tokens.css + components.css) ANTES del `<style>` inline.
2. Remover el `:root{...}` duplicado del inline style (los aliases del system ya proveen TODAS las variables).
3. Reemplazar valores hardcoded de transición/radio por tokens (`var(--radius-md)`, `var(--transition-fast)`, `var(--shadow-glow)`).
4. Agregar `:focus-visible` styling consistente en `.mod`, `.ws-btn`, `.ws-input` (accesibilidad).
5. Footer link al showcase del Design System para QA rápido.

### Diff resumen
- Antes: `<style>:root{--bg:#09090b;--card:#16161a;...}` (duplicado, hardcoded en cada archivo del Cerebro).
- Después: `<link rel="stylesheet" href="css/design-tokens.css">` + el `:root` viene del archivo canónico.

### Microinteracciones mejoradas en index.html
- **`.mod` (cards de módulos)**: hover ahora usa `border-color:var(--ac)` + `transform:translateY(-3px)` + `box-shadow:var(--shadow-lg)`. Focus ring usa `--shadow-glow`. Más suave + más visible.
- **`.ws-btn` (Quick Workshop)**: focus-visible con shadow-glow violeta. Transiciones más rápidas (var(--transition-fast)).
- **`.ws-go` (botón Go)**: hover con `background:var(--ac2)` + lift. Antes flat sin feedback.
- **`.ws-input`**: focus muestra glow violeta consistente con el sistema.
- **`.task-btn` (Add tarea)**: hover con brillo + lift sutil.
- **`.qstat` (stats cards)**: hover con cambio de fondo. Valor numérico ahora usa color violeta `--ac2`.
- **Stats grid**: usa `var(--radius-md)` y `var(--space-6)` en lugar de valores fijos.

### Lo que NO se tocó
- HTML estructural (`<body>`, las cards, el rail, el iframe).
- JS (Cerebro router, pomo timer, RSS feed, etc).
- Auth chain.
- Cualquier funcionalidad del módulo.

### Archivos modificados
- ✏️ `frontend/index.html` (importa design system · :root removido · microinteracciones refinadas · footer link al showcase)

### Validación visual
1. Abrí: https://mikel696.github.io/da-2026/frontend/
2. Hover sobre cualquier card de módulo → debería levantarse con borde violeta y sombra suave.
3. Hover sobre los Quick Workshop → mismo efecto.
4. Tab por los botones con teclado → focus ring violeta visible en cada uno.
5. Footer abajo a la derecha: link "🎨 Design System v1.0" abre el showcase.

### Decisiones técnicas
1. **Mínimo riesgo, máximo valor:** no se reescriben componentes (`.mod`, `.ws-btn`, etc) como `.ds-btn`. Mantenemos el CSS específico del módulo y solo cambiamos su FUENTE de variables. Esto asegura cero regresiones visuales mientras conectamos al sistema canónico.
2. **Aliases hacen el trabajo pesado:** las variables viejas (`--card`, `--tx2`, `--ac`, `--em`) ya están definidas en `design-tokens.css` como aliases a los nuevos nombres. La página sigue funcionando idéntica.
3. **Microinteracciones suaves:** se aprovecha el sistema para STANDARIZAR transiciones (`var(--transition-fast)`) y focus rings (`var(--shadow-glow)`) en lugar de un sub-conjunto inconsistente.
4. **Footer link como QA shortcut:** mientras quede activo el sprint, tener un acceso de 1 click al showcase desde la home acelera la validación visual entre cambios.

### Estado actual del migrado
| Módulo | Migrado | Microinteracciones | Showcase link |
|---|---|---|---|
| 1-IND index.html | ✅ | ✅ refinadas | ✅ footer |
| 14-WORK work.html | ❌ pendiente Fase 2.2 | — | — |
| 13-NOT notes.html | ❌ pendiente | — | — |
| 10-SYS systems.html | ❌ pendiente | — | — |
| 12-FIN finance.html | ❌ pendiente | — | — |
| (resto · 11 módulos) | ❌ pendiente Fase 2.3/2.4 | — | — |

### Próximo paso
Fase 2.1 cerrada. Las opciones para Fase 2.2:
- 14-WORK (el módulo más activo del usuario · Simetrik)
- 13-NOT (segundo más usado · Notas + Journal)
- Otro módulo P0 a elección.

---

## 🎨 Fase 1 Master UX Sprint · Design System v1.0 entregado — 2026-05-15d

### Qué cambió
Ejecutada **Fase 1 (Design System)** del Master UX Sprint. Sistema canónico de diseño entregado como 4 archivos. Cero módulos migrados todavía (intencional · Fase 2 hace eso). Compatibilidad con CSS legacy preservada vía aliases.

### Hallazgo crítico previo (al hacer survey)
Inconsistencia de accent color entre módulos:
- `work.css` (14-WORK) → **cyan** `#06b6d4`
- `jobs.css` (5-JOB), `english.css` (3-ENG), `index.html` (1-IND), `notes.html` (13-NOT) → **violeta** `#8b5cf6`

**Decisión:** violeta `#8b5cf6` como **accent canónico** (4/5 ya lo usan). 14-WORK mantiene cyan localmente hasta su migración en Fase 2.

### Archivos creados
- ➕ `frontend/css/design-tokens.css` (NEW · 215 líneas)
  - Paleta: 8 colores semánticos (accent, cyan, green, emerald, amber, orange, red, pink, blue) con variantes soft + bg-bg
  - 9 neutros (bg, bg-2/3/4, border, border-2, text, text-2/3)
  - Tipografía: 3 familias (sans / mono / display) + 8 niveles + 4 weights + 3 line-heights
  - Espaciado: 9 niveles base 4px (4 → 96)
  - Radios: 6 niveles (sm 6 → full 9999)
  - Sombras: 5 niveles (sm/md/lg/xl/glow)
  - Transiciones: 3 velocidades + 2 easings
  - Z-index: escala de 7 capas
  - Layout widths: content/narrow/wide
  - **Aliases legacy completos** (--ac, --t2, --bd, etc → tokens nuevos) para no romper CSS viejo
  - Reset mínimo: box-sizing, scrollbar 4px, ::selection, :focus-visible default

- ➕ `frontend/css/components.css` (NEW · 320 líneas)
  - 10 componentes prefijados `.ds-*`: btn (5 variantes × 3 tamaños) · card (4 variantes) · input/textarea/select · label · badge (6 variantes) · toast (4 variantes) · modal (backdrop + container) · skeleton (shimmer) · tooltip (data-attribute) · nav (sticky header)
  - Typography helpers: ds-h1/h2/h3 · ds-text-* · ds-kicker
  - Layout utils: stack-2/3/4 · row-2/3/4 · grid-2/3/auto · flex-1 · divider · spacer
  - Animación canónica `.ds-fade-up`
  - Media query mobile <768px: grids colapsan a 1 columna, modal/toast full-width

- ➕ `frontend/css/DESIGN_SYSTEM.md` (NEW · documentación canónica)
  - Quick start con ejemplo end-to-end
  - Tablas de tokens (colores, tipografía, espaciado, radios, sombras, transiciones)
  - Documentación de cada componente con HTML de ejemplo
  - Sección de accesibilidad (focus, contraste, touch targets)
  - Plan de migración módulo por módulo
  - Decisiones cerradas (accent canónico violeta, prefijo .ds-* obligatorio)
  - Changelog

- ➕ `frontend/pages/design-system.html` (NEW · showcase live)
  - URL en producción: https://mikel696.github.io/da-2026/frontend/pages/design-system.html
  - 14 secciones interactivas con anchor nav sticky
  - Swatches de los 18 colores + 9 neutros con hex visible
  - Demostración de escala tipográfica con muestra de texto
  - Espaciado visualizado con barras
  - Radios + sombras en grid
  - Componentes funcionales: botones · cards · inputs · badges · toasts (click para activar) · modal funcional (Escape para cerrar) · skeleton · tooltip · tabla de utils
  - Sirve como QA visual: si algo se rompe acá, todo el Cerebro está roto

### Decisiones técnicas tomadas
1. **Prefijo `.ds-*` obligatorio** — evita colisiones con CSS legacy (.btn, .card existentes en los módulos no migrados).
2. **Aliases legacy completos** — los nombres viejos (--ac, --t2, --bd, etc.) apuntan a los tokens nuevos. CSS de módulos no migrados sigue funcionando sin cambios.
3. **Sin migración de módulos en esta fase** — Fase 1 solo entrega herramientas. Migración módulo por módulo viene en Fase 2 (P0 → P1 → P2).
4. **Accent canónico violeta `#8b5cf6`** — alineado con la mayoría existente. 14-WORK conserva cyan localmente.
5. **Showcase live como QA** — `design-system.html` es la prueba de regresión visual. Si los tokens cambian, se ve ahí primero.
6. **Sin Lucide todavía** — decidido posponer la migración de iconografía a una sesión dedicada (Fase 2.5 opcional). Las decisiones de UX no dependen de los iconos.

### Pendientes
- **Fase 2 (P0):** migrar 1-IND · 14-WORK · 13-NOT · 10-SYS · 12-FIN al design system.
- **Decisión iconografía:** mantener emojis vs migrar a Lucide SVG (recomendado, postpuesto).
- **Light theme:** opcionalmente agregar override `[data-theme="light"]` en design-tokens.css (no incluido v1.0).

### Cómo verificar
1. Abrí en producción: https://mikel696.github.io/da-2026/frontend/pages/design-system.html
2. Probá los toasts (botones de la sección 📢), abrí/cerrá el modal, hover en tooltips.
3. Si todo funciona y se ve coherente → Fase 1 OK. Lista para Fase 2.

---

## 🔄 Sync Audit ejecutado · 5 keys agregadas al SYNC_REGISTRY — 2026-05-15c

### Qué cambió
Ejecutada la **Fase 3 (Sync Audit)** del Master UX Sprint. Investigué cada key sospechosa antes de tocar el registry. Resultado: 5 keys agregadas (necesarias) · 4 confirmadas como falsos positivos (no requieren acción).

### Resultado del audit por key

| Key | Módulo | Decisión | Razón |
|---|---|---|---|
| `sb_tasks` | 1-IND Mission Control | ✅ **Agregada** | Usada en `news.html` línea 217-220 · widget de tareas rápidas · debe sync cross-device. |
| `sb_ws_hist` | 1-IND Workshop history | ✅ **Agregada** | Usada en `index.html` línea 205-206 · array de últimos 10 workshops invocados · sync útil. |
| `jt8` | 5-JOB Job Tracker | ✅ **Agregada** | Usada en `jobs.js` línea 300 + `apply.js` línea 715 · **MASTER KEY** del Job Tracker · CRÍTICO. |
| `sys_active_custom` | 10-SYS Systems | ✅ **Agregada** | Usada en `systems_logic.js` líneas 2231, 2236, 2258 · cuaderno custom activo seleccionado · scalar string. |
| `ruta_st` | 4-RUT Ruta Data Analyst | ✅ **Agregada** | Usada en `ruta.html` línea 488 · timestamp del start de la ruta · necesario para calcular streak cross-device. |
| `custom_prompts` | 8-PRO Prompt Lab | ❌ Falso positivo | LEGACY · `prompts.js` solo lo lee para migrar a `sb_prompts` (que YA está sync) y después hace `removeItem`. No requiere sync. |
| `sys_class_sessions` | 10-SYS Systems | ❌ Falso positivo | Usa **tabla dedicada (Tier 1)** vía `CLOUD.fullSync('class_sessions', ...)` en `systems_logic.js:1332`. Ya está en `SKIP_KEYS` correctamente. |
| `eng_conv_fsrs` | 3-ENG English | ❌ Falso positivo | Solo aparece en `refactor_engine.py` (script Python de refactorización ETL). No está en código JS runtime. |
| `sys_sys_class_sessions` | 10-SYS Systems | ❌ No bug activo | El typo doble prefijo **YA tiene migración en línea 1206 de `systems_logic.js`** que limpia automáticamente al cargar la página. Bug histórico ya resuelto. |

### Archivos modificados
- ✏️ `frontend/js/cloud-sync.js` (SYNC_REGISTRY · +5 keys con bloque comentado "Sync Audit fixes · 2026-05-15b")

### Impacto operativo
A partir de este commit, los siguientes datos sincronizan cross-device automáticamente:
- **Tareas del Mission Control** (1-IND) ya no se pierden al cambiar de PC
- **Historial de Workshops** (1-IND) viaja entre devices
- **Job Tracker completo** (5-JOB · todas tus vacancies/jobs) sincroniza
- **Cuaderno activo en Sistemas** (10-SYS) recuerda dónde estabas
- **Timestamp de inicio de la Ruta** (4-RUT) preserva el streak

### Validación recomendada
1. En PC A: agregar una tarea al Mission Control de 1-IND.
2. Refresh `index.html`.
3. En PC B: refresh → debería aparecer la tarea (sync automático por `INITIAL_SESSION` event).
4. Lo mismo para 5-JOB (crear una vacancy) y 10-SYS (cambiar cuaderno activo).

### Pendientes del Sync Audit
- Ninguno · audit cerrado para los hallazgos detectados.
- Próximo: cuando aparezcan nuevas features con nuevos storage keys, agregarlos al registry desde el momento 0. Pattern: cada feature nueva con persistencia → SYNC_REGISTRY actualizado en el mismo commit.

---

## 🎨 Cross-module · Sprint UX Cerebro completo · Master Prompt + Audit findings — 2026-05-15b

### Qué cambió
El usuario pidió: trabajar la UX del Cerebro completo, mejorar diseño, sincronización, bugs, iconografía y crear EL prompt maestro persistente en 8-PRO. Ejecutado todo a nivel de plan + persistencia · pendiente la implementación (esperando luz verde para Fase 1).

### A) Master UX Prompt insertado en 8-PRO (`frontend/prompts.html`)
Agregados 3 prompts nuevos al array inline, todos visibles en la UI de Prompt Lab:

1. **🎨 MASTER UX SPRINT — Rediseño profesional Cerebro completo** (el prompt grande pedido)
   - 4 fases secuenciales: Design System → Auditoría por módulo → Sync Audit → Bug Hunt
   - Cubre los 16 módulos (no 14 como el prompt viejo)
   - Define paleta + escala tipográfica + espaciado + radios + transiciones canónicas
   - 12 puntos de checklist por módulo
   - Matriz de prioridad P0/P1/P2 según frecuencia de uso
   - Recomendación de Lucide icons inline SVG
   - Reglas no-negociables del stack (vanilla, IIFE, auth chain, anti-frameworks)

2. **🔄 Sync Audit — Detectar keys no sincronizadas**
   - Grep recursivo de localStorage en frontend/
   - Cross-check con SYNC_REGISTRY + DYNAMIC_PREFIXES
   - Detecta typos (ej. doble prefijo `sys_sys_`)
   - Output: tabla key/módulo/sync-status/acción

3. **🎯 Iconos · Migrar a Lucide SVG inline**
   - Plan para unificar iconografía dispersa
   - Helper `window.icon(name, opts)` en `frontend/js/icons.js`
   - Mantener emojis decorativos · reemplazar funcionales

4. **🎨 Design Audit actualizado** de 14 a **16 módulos** (incluye 15-MM y 16-APA que faltaban).

### B) Hallazgos del audit preliminar (antes de la sesión de implementación)

**Sync bugs detectados** — keys que se usan en código pero NO están en `SYNC_REGISTRY`:

| Key | Módulo | Severidad | Acción |
|---|---|---|---|
| `sb_tasks` | 1-IND Mission Control | 🔴 Crítico | Agregar al registry · tareas del dashboard pierden cross-device |
| `custom_prompts` | 8-PRO Prompt Lab | 🔴 Crítico | Agregar · los prompts custom del usuario no sincronizan |
| `jt8` | 5-JOB Job Tracker | 🔴 Crítico | Confirmar/agregar · master key del módulo |
| `sys_class_sessions` | 10-SYS | 🟡 Medio | Agregar · sesiones de clase del Tab 7 |
| `sys_active_custom` | 10-SYS | 🟡 Medio | Agregar · selección de cuaderno activo |
| `eng_conv_fsrs` | 3-ENG | 🟡 Medio | Agregar · sistema FSRS de conversaciones |
| `sb_ws_hist` | 1-IND | 🟢 Menor | Confirmar si requiere sync (probable history local) |
| `sys_sys_class_sessions` | 10-SYS | 🐛 **BUG TYPO** | Doble prefijo `sys_sys_` — fixear en código fuente |

**Auth chain:** ✅ verificado · los 19 HTMLs cargan los 4 scripts. Sin bugs acá.

**Iconografía:** ⚠️ mix actual de emojis (90%) + algunos SVG (10%). Inconsistencia visible entre módulos. Recomendado Lucide.

**Tema dark:** ⚠️ algunos módulos viejos (2-APP, 4-RUT, 6-TOO, 7-NEW) tienen colores hardcoded en lugar de variables CSS. Detectado a ojo · pendiente audit formal.

**Mobile responsive:** ⚠️ no auditado sistemáticamente · marcado como Fase 2 del Master UX Sprint.

### C) Plan de rollout propuesto al usuario

**Sesión 1 · Fase 1 — Design System** (sugerido arrancar acá):
- Crear `frontend/css/design-tokens.css` con paleta + tipografía + espaciado canónicos.
- Crear `frontend/css/components.css` con .btn .card .input .badge .toast .modal estandarizados.
- Crear `frontend/css/DESIGN_SYSTEM.md` documentando uso.
- Decidir iconografía (Lucide vs emojis) — recomendación: Lucide.
- 1 módulo piloto refactorizado (sugerencia: 14-WORK o 1-IND) para validar el sistema.

**Sesión 2-3 · Fase 2 — Auditoría P0** (5 módulos más usados):
- 1-IND · 14-WORK · 13-NOT · 10-SYS · 12-FIN sobre el design system.

**Sesión 4 · Fase 2 — Auditoría P1** (4 frecuentes):
- 3-ENG · 5-JOB · 9-GOA · 8-PRO.

**Sesión 5 · Fase 2 — Auditoría P2** (7 menos usados):
- 2-APP · 4-RUT · 11-ACC · 6-TOO · 7-NEW · 15-MM · 16-APA.

**Sesión 6 · Fase 3 — Sync Audit**:
- Aplicar los fixes de la tabla de arriba.
- Bump SEED_VERSION de cualquier seed que cambie.
- Test cross-device.

**Sesión 7 · Fase 4 — Bug Hunt**:
- Grep sistemático de patrones de error.
- Pruebas en vivo con DevTools console.

### Archivos modificados
- ✏️ `frontend/prompts.html` (+ 3 prompts nuevos · 1 actualizado de 14 a 16 módulos)
- ✏️ `CEREBRO_STATE.md` (este entry)

### Pendientes
- **Luz verde del usuario** para arrancar Fase 1 (Design System).
- **Aplicar los sync fixes** detectados en este audit (incluido en Fase 3).
- **Decisión sobre iconografía:** Lucide vs emojis vs mixto.

### Decisiones técnicas tomadas
1. **Prompt persistente en 8-PRO** vs documento markdown suelto: el usuario lo quiere disponible siempre desde la UI de Prompt Lab. Por eso va al array inline de `prompts.html`.
2. **Plan multi-sesión** vs todo en un commit: el cerebro completo no se rediseña en una sesión. Fasear permite validar dirección con el usuario antes de seguir.
3. **NO TOCAR código de módulos todavía**: el master prompt arranca explícitamente con "esperá mi luz verde antes de tocar código". Coherente con prevenir regresiones.

---

## 📓 GENERAL · Cuadernos v2 — Covers, Icons & Attachments — 2026-04-27

### Qué cambió (cross-module)
**Nuevo módulo compartido `js/nb-shared.js` + `css/nb-shared.css`** — usado por 10-SYS y 13-NOT.

**Capacidades nuevas:**
- **12 portadas** (`nb-cover-c1`..`c12`): gradientes/patrones para Estudio, Trabajo, Tech, Personal, Creativo
- **32 íconos agrupados** (Estudio / Trabajo / Tech / Personal / Especial) con picker visual
- **Adjuntos de archivos** vía IndexedDB: PDF, Word, Excel, PPT, TXT, CSV, MD, ZIP — hasta **50 MB c/u**
- **Renombrar imágenes** con botón ✏ inline en cada image card
- **Auto-save** mientras escribes (ya existía en 10-SYS, replicado en 13-NOT)

**10-SYS (Cuadernos personalizados — Tab 7):**
- Cover picker + icon picker grouped al crear cuaderno (formulario rediseñado en glass-card)
- Card de cuaderno ahora muestra portada visual de 140px con título e ícono en overlay
- Botón **🎨 Diseño** para cambiar portada/ícono después de crear (panel inline desplegable)
- Botón **📎 Adjuntar** en toolbar de página
- Botón **✏ rename** en hover de cada imagen
- API `NB`: añadidas `pickIcon`, `pickCover`, `pickIconExisting`, `pickCoverExisting`, `toggleCustomEdit`, `attachFile`, `removeAttachment`, `renameImage`

**13-NOT (Notas & Journal — nuevo tab "📚 Cuadernos"):**
- Nuevo tab `p-notebooks` con form de creación + selector de cuaderno activo + editor full
- API global `NotNB` con CRUD completo: `create/rename/remove/selectActive`, `newPage/openPage/deletePage/autoSave`, `addImage/renameImage/removeImage`, `attachFile/removeAttachment`
- Storage keys: `not_nb_meta` (lista de cuadernos), `not_nb_data` (páginas + metadata de adjuntos)
- Editor con `contenteditable` + auto-save 500ms debounce
- Imágenes vía FileReader → base64 (cuando son pequeñas), ya con renombrado por prompt

### Behavior change intencional (flagged)
- **Adjuntos NO se sincronizan a Supabase**: los binarios viven solo en IndexedDB del navegador (clave `da2026_nb` / store `attachments`). Solo la metadata `{id,name,type,size,ext,addedAt}` viaja a `app_state`. Razón: filas JSONB de Supabase tienen límites prácticos (~1MB/row), un PDF de 50MB rompería el sync. Si el usuario abre el cuaderno en otro device, verá los chips pero al hacer download recibirá: *"Archivo no encontrado en este dispositivo. Los adjuntos no se sincronizan a la nube."*

### Auth chain (verificada en ambos módulos)
- `systems.html`: ya tenía la auth chain. Añadido `<script src="js/nb-shared.js">` después de cloud-sync, antes de systems_logic.js
- `notes.html`: ya tenía la auth chain. Añadidos `nb-shared.js` + `notes-nb.js` después de cloud-sync.js

### SYNC_REGISTRY actualizado
`cloud-sync.js`: añadidos `not_nb_meta` y `not_nb_data` a la lista de keys sincronizables (Tier 2 / app_state).

### Archivos modificados/creados
- ➕ `frontend/js/nb-shared.js` (NEW · 200 líneas)
- ➕ `frontend/css/nb-shared.css` (NEW · 95 líneas)
- ➕ `frontend/js/notes-nb.js` (NEW · 290 líneas)
- ✏️ `frontend/systems.html` (cover/icon picker UI + script load)
- ✏️ `frontend/systems_logic.js` (covers, attachments, rename — ~80 líneas añadidas)
- ✏️ `frontend/notes.html` (tab + panel + script load)
- ✏️ `frontend/js/cloud-sync.js` (SYNC_REGISTRY)

### Estado por módulo
- **10-SYS Tab 7 Cuadernos:** 🟢 PRODUCCIÓN · covers + attachments + rename · backwards-compatible (cuadernos existentes mantienen icono actual + cover default `c1`)
- **13-NOT Tab Cuadernos:** 🟢 PRODUCCIÓN · feature completo · primera versión

---

## 🎨 UI/UX Audit + Fixes — Todos los módulos — 2026-04-26

### Auditoría completada (Score promedio: 6.4/10 → ~8/10 post-fix)

**🔴 Críticos resueltos (4):**
1. `css/auth.css` — Reescrito completo: 34 líneas de hex hardcodeado → 100% CSS tokens (`var(--acid)`, `var(--ink)`, `var(--mint)`, `var(--rose)`, etc.)
2. `css/main.css:27` — `a:hover{color:#fff}` → `color:var(--txt)`
3. `css/main.css:68+77` — `.btn-study:hover` y `.btn-ghost:hover` hardcoded `#fff/#e8ff40` → tokens
4. `SistemaDA2026_Tactico.html` — Aliases estándar añadidos en `:root` (`--ac`, `--bd`, `--tx`, `--t2`, `--t3`, `--bg`, `--el`, `--gn`) para alinear con la API de tokens del resto del proyecto

**🟡 Medios resueltos (5):**
5. `js/jobs.js` — Kanban columns: empty state `'Sin postulaciones'` cuando columna vacía
6. `systems.html` — Orbs: `hsl(142,72%,29%)`, `hsl(263,70%,50%)`, `hsl(172,66%,50%)` → `var(--gn)`, `var(--vi)`, `var(--tl)`
7. `news.html` — RSS error state sin cache: añadido botón "↺ Reintentar" en el path de error
8. `css/jobs.css` — `.jsite-btn-es/pt/en/remote`: hex/rgba hardcodeados → `var(--rg/--rd)`, `var(--gg/--gn)`, `var(--cg/--cy)`

**✅ Módulos con empty states pre-existentes (no requirieron cambios):**
- 1-IND: feed offline/error ya manejado
- 8-PRO: histList "Sin prompts guardados" + library "No hay prompts"
- 9-GOA (goals.js): "Sin objetivos", "Sin hábitos aún", "Sin revisiones aún"
- 10-SYS (systems_logic.js): "📹 Aún no hay clases guardadas"
- 13-NOT (notes.js): "Sin notas aún. Crea tu primera nota." + journal vacío

### Estado de diseño por módulo post-fix:
| Módulo | Score | Estado |
|---|---|---|
| 1-IND index | 7/10 | 🟢 |
| 2-APP apply | 7/10 | 🟢 |
| 3-ENG english | 7/10 | 🟢 |
| 4-RUT ruta | 8/10 | 🟢 |
| 5-JOB jobs | **8/10** | 🟢 (empty state + tokens) |
| 6-TOO tools | 8/10 | 🟢 |
| 7-NEW news | **8/10** | 🟢 (retry btn) |
| 8-PRO prompts | 7/10 | 🟢 |
| 9-GOA goals | 7/10 | 🟢 |
| 10-SYS systems | **8/10** | 🟢 (orbs tokenizados) |
| 11-ACC accounting | 7/10 | 🟢 |
| 12-FIN finance | 7/10 | 🟢 |
| 13-NOT notes | 7/10 | 🟢 |
| 14-TAC Tactico | **7/10** | 🟢 (aliases añadidos) |
| auth.css | **8/10** | 🟢 (reescrito total) |
| main.css | **7/10** | 🟢 (color leaks corregidos) |

### Deuda técnica restante (baja prioridad):
- Borders de `.jsite-btn-*` aún usan `rgba()` inline (no hay tokens de borde por color disponibles)
- Token naming duality (`--acid` en main.css/Tactico vs `--ac` en módulos nuevos) — requiere decisión arquitectural de unificación futura

---

## fix(8-PRO) · Prompt Lab — Copy button & Bootstrap prompt — 2026-04-26

### Qué cambió
- **Bug copy raíz:** `window._PLIB=lib` + funciones globales `_copyPrompt(idx)` y `_toggleCard(card)` en lugar de event delegation con `lib` en closure (que no era accesible tras innerHTML replace en algunos engines). Ahora el botón 📋 copia con onclick inline directo a globales.
- **Fallback clipboard mejorado:** `textarea` con `focus()` antes de `select()` → `execCommand('copy')` más confiable.
- **Nuevo prompt:** `🧠 CEREBRO Bootstrap · Sesión Nueva` en categoría `claude` — protocolo de inicio de sesión fresca, lee CEREBRO_STATE.md + CLAUDE.md, extrae pendientes y despliega menú.
- Commits: `38aee48` (first fix) → `3610f9f` (delegation attempt) → `HEAD` (bulletproof globals)

### Estado 8-PRO: 🟢 PRODUCCIÓN
Cards abren · Botón 📋 copia · Bootstrap prompt disponible en filtro 🤖 Claude Code

---

## 📹 10-SYS · DIS34 Ingeniería Web — Auditoría de sesiones grabadas — 2026-04-22

### Contexto
Miguel perdió las clases de Ing. Web de Abr 8 y Abr 15. Se extrajeron transcripts vía Direct-Fetch Protocol (Chrome MCP) desde las grabaciones de Drive ya abiertas en tabs del navegador. Tab 59537227 = Apr 8, Tab 59537238 = Apr 15.

### Sesión 2 — Abr 8 (2h 24min) · Prof. HEYNER LEONEL BECERRA RAMIREZ
**Tema central: Configuración del entorno de desarrollo**

Pasos cubiertos en clase:
1. Verificar PHP en terminal: `php -v`
2. Instalar **XAMPP (SAM)** — Apache + MySQL activos
3. Instalar **Node.js**
4. Instalar **Composer** → descargar desde `getcomposer.org` → ejecutar `composer-setup.exe`
5. Comando clave: `composer global require laravel/installer`
6. Crear proyecto Laravel: `laravel new [nombre]` → No a Pest/PHPUnit → MySQL como DB
   - Versión instalada por la mayoría: Laravel 9 (algunos obtuvieron versión 12)
7. XAMPP: Apache + MySQL corriendo para levantar el servidor local

**Nota del profe [109:28]:** *"Para la siguiente clase les voy a indicar qué versiones debemos utilizar"* — hubo confusión de versiones de PHP/XAMPP en clase.

**Parcial #1 anunciado [110:14]:** *"Pasar a la presentación que va a entrar para la próxima semana para el **parcial número uno**"*

Segunda mitad de la clase (min 115–144): Presentación teórica — frameworks, Scrum, producto mínimo viable (MVP), calidad del software (QA/CUA), conversación con el producto.

### Sesión 3 — Abr 15 (2h 21min)
**Tema central: UX + Contenido Web + Metodología Ágil (material del Quiz 2)**

**Parcial 1 confirmado [3:41]:** *"Esta semana, muchachos, tienen **del 13 al 19 para presentar el parcial uno**. Ya está disponible"*

**Quiz 2 anunciado [4:19]:** *"la sesión tres, para poder desarrollar el **quiz dos**"*
→ Quiz 2 cubre el material presentado en ESTA clase (sesión 3).

Contenido del Quiz 2 (lo que se presentó):
| Tema | Detalle |
|------|---------|
| **Pilares del Contenido Efectivo** | 4 pilares: Estrategia de Contenido · Claridad y Concisión · Jerarquía Visual y Semántica · Mantenimiento Continuo |
| **UX / Experiencia de Usuario** | Usabilidad, satisfacción del usuario, relevancia del contenido, rapidez de carga |
| **Metodología Ágil / Scrum** | Sprint, Product Owner, Backlog, verificación/testeo, MVP |
| **Tendencias actuales** | Arquitectura de microservicios, contenedores en la nube, Kubernetes, Machine Learning |

**Cierre [140:39]:** *"las personas que tengan problemas con el quizo, mandarme el correíto"* y *"la próxima clase va a ser a las 6:30"* (= clase de hoy Miércoles Apr 22).

### Estado del Quiz 2 (URGENTE)
- **Abrió:** Lunes 20 Abr 00:00 | **Cierra:** Domingo 26 Abr 23:59
- **Intentos:** 2 · **Tiempo:** 45 min · **Calificación:** Más alta
- **Estado Miguel:** ❌ NO INICIADO — 4 días restantes
- **URL:** `https://cdigital.cun.edu.co/mod/quiz/view.php?id=6104299`

### Tabs de Drive identificados (para referencia futura)
- `1GYph10Khg5YvwZMzn3eU1h886km10o1e` — Sesión 2 (Abr 8)
- `1feeLz1xgdMsc_zJYMDpLQ92awxtscwon` — Sesión 3 (Abr 15)
- Carpeta Grabaciones DIS34: `https://drive.google.com/drive/u/3/folders/1MHvHG5WDCUUjfTrPkivzbuuG0uzjtgYR`

### Pendiente
- ⏳ **Sesión 4 — Abr 22:** Miguel está en clase AHORA. Pasará la grabación al finalizar → ejecutar Direct-Fetch Protocol (Modo A) para extraer transcript e inyectar en Tab 7 de 10-SYS.
- ⚠️ **Quiz 2** debe completarse antes del Domingo 26 Abr 23:59.
- Parcial 1 cerró el 19 Abr — ya pasó (no verificado si Miguel lo presentó).

---

## ✨ feat(5-JOB) · Job Tracker — Reestructura tabs de búsqueda — 2026-04-20

### Qué cambió

**Tabs eliminados:** Experiencia, Ruta Data, Ingresos, Empresas

**Tabs nuevos (3 plataformas):**
- `p-li` — LinkedIn: 6 secciones accordion por rol (AP/CxP, Content Mod, Accounting Asst, Customer Service, Data Entry, Skills-based). Primeras 2 secciones pre-abiertas.
- `p-ct` — Computrabajo: 6 secciones equivalentes con URLs colombianas (`computrabajo.com.co`).
- `p-pt` — Job Portals: Indeed CO, Torre.ai, GetOnBoard, RemoteOK, Elempleo, Bumeran.

**Botones por idioma/modalidad** (color-coded):
- 🇪🇸 rojo · 🇧🇷 verde · 🇺🇸 azul · combo púrpura · remoto cyan · presencial ámbar

**JS:** `toggleSec(id)` — abre/cierra accordion. Guard en `renderCmp()` (elemento opcional). `goTab()` actualizado con IDs nuevos + aliases legacy.

**CSS:** `.jsite-*` classes (section, header, body, buttons) añadidas al final de `jobs.css`.

### Archivos modificados
- `frontend/jobs.html` — 4 panels viejos → 3 panels accordion nuevos
- `frontend/css/jobs.css` — añadidas `.jsite-*` classes
- `frontend/js/jobs.js` — `toggleSec()`, guard `renderCmp()`, `goTab()` actualizado

### Estado 5-JOB: 🟢 PRODUCCIÓN
Commit: `e0a2dfd`

---

## ✨ feat(8-PRO) · Prompt Lab — Overhaul profesional — 2026-04-19

### Qué cambió

**Categorías nuevas:**
- `asistente` (cyan) — Companion de Clase, MCQ Rápido (solo letra), MCQ con Explicación completa
- `exam` (rojo) — 8 prompts: Selección Múltiple, V/F con Evidencia, Ensayo/Pregunta Abierta, Examen Oral, Caso de Estudio, Matemáticas P-a-P, ICFES/SABER Pro, Examen de Código Técnico

**UX — Interacción mejorada:**
- Filter bar de categorías (pills): `Todos | Datos | Código | Negocio & Carrera | Aprendizaje | Taller & MCQ | Exámenes | Claude Code`
- **Un clic** = expandir tarjeta (debounce 220ms)
- **Doble clic** = copiar al instante (cancela el timer del clic simple)
- `showCopiedToast()` — toast verde flotante reemplaza `alert()` en toda la librería

**Prompts bonus:**
- `data`: Power Query — Transformación de Datos (código M)
- `learn`: Flashcards para Retención Activa (método Pareto + mnemónicos)

### Archivos modificados
- `frontend/prompts.html` — CSS (`.c-exam`, `.c-asistente`, `.cat-filters`, `.cat-btn`), 13 prompts nuevos, `showCopiedToast()`, `renderLib(filter)` reescrita

### Estado 8-PRO: 🟢 PRODUCCIÓN
Commit: `5441b69`

---

## 🧬 BUGFIX v2 · Highlight legible + Labels removibles + Cuadernos con dropdown — 2026-04-16

### Qué cambió (3 UX bugs reportados por el usuario)

**Bug 1 — Texto resaltado ilegible.** Raíz: `NB.fmt('hl')` solo aplicaba `hiliteColor/backColor`. El color base del editor (`.nb-content { color: #e4e8f4 }`, casi blanco) quedaba sobre el fondo claro (amarillo/verde/rosa) → texto invisible.
- `fmt()` ahora encadena `document.execCommand('foreColor', false, '#1a1a1a')` ANTES del `hiliteColor`, garantizando contraste WCAG-AA.
- Safety net CSS: selectores `[style*="background-color: rgb(255, 245, 157)"]` y variantes hex/rgb/shorthand fuerzan `color:#1a1a1a !important` sobre cualquier elemento resaltado — cubre notas guardadas antes del fix y cualquier edge case donde Chrome aplique solo el background.

**Bug 2 — Labels URGENTE/HECHO no se podían borrar.** Raíz: `document.execCommand('removeFormat')` no elimina `<span>` con clases custom; los badges sobrevivían al botón ✕.
- `fmt('clear')` ahora ejecuta `removeFormat` y luego llama a `removeLabelsInRange(bIn)` que elimina los `.rt-label` que intersectan el rango actual (o todos si la selección está colapsada).
- UX extra: cada badge tiene ahora `onclick="NB.removeLabelEl(this, sid)"` + `cursor:pointer` + pseudo `::after` que muestra " ✕" al hover → un click sobre el badge lo elimina sin pasar por la toolbar.
- Nuevo `removeLabelEl(el, sid)` en el API público de NB.

**Bug 3 — Cuadernos personalizados apilados.** Raíz: `renderCustomList` hacía `list.map(renderCustomCard).join('')` → todos los cuadernos renderizados uno debajo del otro.
- Nueva variable de sesión `activeCustomId` (persistida en `localStorage['sys_active_custom']`).
- `renderCustomList()` ahora pinta:
  1. Un `<select class="cnb-selector-sel">` con `icono + nombre` por cada cuaderno (handler `onchange="NB.selectCustom(this.value)"`).
  2. UN SOLO `renderCustomCard(activeMeta)` debajo, con `cnb-active` wrapper (animación `fu` de entrada).
- `selectCustom(id)` persiste la selección + fuerza `openSubjects.add(id)` para que el `sj-drop` se auto-expanda al cambiar.
- Si el activo fue eliminado / es null, hace fallback al primer cuaderno de la lista.
- CSS nuevo: `.cnb-selector` (barra flex con label + select + hint), responsive a ≤768px.

### Archivos modificados (3)
- `frontend/systems_logic.js` — `fmt` (hl+clear), `removeLabelsInRange`, `removeLabelEl`, `insertLabel` con onclick, `activeCustomId`, `selectCustom`, `renderCustomList` refactor. Exports actualizados.
- `frontend/systems.html` — CSS `.rt-label` hover + "✕" pseudo, safety net `color:#1a1a1a !important`, `.cnb-selector/-lbl/-sel/-hint/-active`.
- `CEREBRO_STATE.md` — esta entrada.

### Verificación manual
- ✅ Resaltar texto con cualquiera de los 3 colores → letras negras sobre fondo pastel, legibles.
- ✅ Insertar ⚠ URGENTE → click directo sobre el badge lo borra.
- ✅ Insertar ✓ HECHO → seleccionar frase con el badge adentro + click ✕ lo elimina junto con otros formatos.
- ✅ ✕ sin selección → borra TODOS los badges del editor activo (atajo "limpiar todo").
- ✅ Tab 7 con 3+ cuadernos: solo se ve el seleccionado, dropdown arriba permite saltar entre ellos.
- ✅ Recargar la página mantiene el cuaderno activo previo (persistencia `localStorage`).

---

## 🧬 BUGFIX · Notebook rich-text + Auth chain platform-wide + Optimizer reforzado — 2026-04-15

### Qué cambió (3 problemas raíz corregidos)

**Problema 1 — Cuadernos sin formato.** El editor `contenteditable` guardaba `textContent` (texto plano), descartando cualquier `<b>`, `<span style="font-size…">` o `<span style="background:…">` que el usuario intentara aplicar. Además no existían controles UI.

- `autoSave(sid)` ahora persiste `bIn.innerHTML` en lugar de `bIn.textContent` → el formato sobrevive al reload y al cloud-sync.
- Añadido helper `renderBodyContent(body)`: detecta tags HTML con regex `/<[a-z][^>]*>/i` y renderiza raw; si no, escapa (backward-compat con notas viejas).
- Nueva toolbar `.nb-rt-toolbar` renderizada por `buildEditorHtml(sid, page)` (compartida entre materias y cuadernos personalizados). Botones:
  - **B** (bold) · **S / M / L** (3 tamaños vía `fontSize` 2/3/5) · **3 resaltadores** (amarillo `#fff59d`, verde `#a5d6a7`, rosa `#f8bbd0`) · **✕** (clear format) · **⚠ URGENTE** / **✓ HECHO** (etiquetas badge).
- Funciones nuevas en NB IIFE:
  - `fmt(sid, kind, value)` — usa `document.execCommand('bold'|'fontSize'|'hiliteColor'|'backColor'|'removeFormat')`. Hace `styleWithCSS` antes de hiliteColor para evitar `<font>` deprecated. Fallback `backColor` para Chrome.
  - `insertLabel(sid, type)` — inserta `<span class="rt-label rt-lbl-urgent|done" contenteditable="false">` vía `insertHTML`, con fallback manual por Range API si execCommand falla.
  - `focusEditor(sid)` helper garantiza foco + rango antes de execCommand (Chrome silenciaba los comandos sin selección).
- CSS añadido en `systems.html`: `.nb-rt-toolbar`, `.nb-rt-btn`, `.nb-rt-sz-s/m/l`, `.nb-rt-hl-y/g/p`, `.nb-rt-lbl-u/d`, `.rt-label`, `.rt-lbl-urgent` (rojo con glow), `.rt-lbl-done` (verde con tachado).
- `renderCustomCard(meta)` refactorizado: ahora llama `buildEditorHtml(meta.id, page)` en lugar de duplicar el HTML inline — los cuadernos personalizados heredan la toolbar automáticamente.

**Problema 2 — "Sesión iniciada" solo visible en 10-SYS.** La cadena de auth (Supabase CDN → `supabase-client.js` → `auth.js` → `cloud-sync.js`) estaba instalada solo en algunos HTML. En los demás, el indicador `#authBadge` nunca se pintaba y el cloud-sync silenciosamente no funcionaba por página.

- Añadida la cadena de 4 scripts antes de `</body>` en **13 archivos**:
  - **Root (4):** `index.html`, `interview-pi3.html`, `interview-sim.html`, `notes.html` (paths: `js/supabase-client.js`, `js/auth.js`, `js/cloud-sync.js`).
  - **Pages (9):** `pages/configurar.html`, `empleos.html`, `ingles.html`, `prompts.html`, `proyectos.html`, `recursos.html`, `ruta.html`, `sesion.html`, `tacticas.html` (paths: `../js/...`).
- Comentario estándar: `<!-- Auth chain: must load on every page so session persists platform-wide -->`.
- Resultado: el badge de sesión y la sincronización ahora funcionan uniformemente en toda la plataforma, no solo en el módulo donde se estaba.

**Problema 3 — Optimizer de prompts no forzaba auth platform-wide.** El generador 8-PRO tenía un constraint débil ("Auth scripts load before module JS") que podía interpretarse como "solo en el módulo trabajado".

- `defaultConstraints` en `claudeOptimize()` reforzado con 2 líneas explícitas:
  - `PLATFORM-WIDE AUTH: Every HTML page MUST include the full auth chain before </body> — Supabase CDN → supabase-client.js → auth.js → cloud-sync.js. The "Sesión iniciada" sync indicator must be visible on EVERY module, not just one. Never ship a page without it.`
  - `If you create, copy, or rename any .html page, immediately add the 4-script auth chain — otherwise cloud sync silently breaks on that module.`
- Nuevos `CO_SIGNALS` (detección automática por regex):
  - Trigger de creación de páginas (`new page|create .html|copy .html|rename .html|new module`) → inyecta recordatorio de añadir auth.
  - Trigger de auth/session/login/supabase → fuerza verificación de scripts en TODAS las páginas.
- Actualizado nota de módulo `GENERAL` + "Full Context Recovery" + "Token Exhaustion Recovery" + "Work on 10-SYS" en `lib[]` con la regla platform-wide.

**Added to SYNC_REGISTRY:** `sys_notebook_meta` (metadatos de cuadernos personalizados — nombre, ícono, color, fecha de creación).

### Archivos modificados (16 total)
- `frontend/systems_logic.js` — NB.fmt, NB.insertLabel, focusEditor, buildEditorHtml, renderBodyContent, autoSave(innerHTML), renderCustomCard refactor.
- `frontend/systems.html` — CSS toolbar + labels (~30 líneas).
- `frontend/prompts.html` — defaultConstraints (+2 líneas) + CO_SIGNALS (+2 reglas) + GENERAL notes + 3 lib prompts actualizados.
- `frontend/js/cloud-sync.js` — SYNC_REGISTRY += `sys_notebook_meta`.
- 13 × HTML — auth chain inyectado antes de `</body>`.

### Verificación manual
- ✅ Escribir texto, seleccionar, click B → bold aplica y persiste tras reload.
- ✅ Cambiar tamaño S/M/L → visible en el editor y en la preview de la lista.
- ✅ Resaltar con los 3 colores → inline CSS `background-color` se guarda.
- ✅ Insertar URGENTE / HECHO → badge renderizado, `contenteditable="false"` evita que se edite el texto del badge.
- ✅ "Sesión iniciada" aparece en cualquier módulo abierto (probado index, notes, ingles, sesion, tacticas).

---

## 🧬 10-SYS · REFACTOR MAYOR — Dashboard limpio + Materias integradas + Cuadernos HD — 2026-04-15

### Qué cambió
Reestructuración completa del módulo 10-SYS para consolidar la información dispersa en 9 pestañas a 8 con flujo coherente "tareas + apuntes dentro de la materia". Testeado con prompt generado por el optimizador 8-PRO (validación end-to-end del pipeline optimizer → refactor).

### Cambios de pestañas (9 → 8)
- **Eliminada:** `🔗 Accesos` (pestaña 3). Sus `quickAccess` y `studyResources` grids se movieron al **Dashboard**.
- **Reemplazada:** `📓 Cuaderno` (antes pestaña 8 para las 5 materias oficiales) → ahora es un **manager de cuadernos personalizados** (pestaña 7, ej: "SQL Course", "AWS Cloud", "Python Bootcamp"). Los cuadernos de materias ahora viven dentro de cada materia.
- **Renumeradas:** Malla (3), Certificaciones (4), CUN Hub (5), Clases Perdidas (6), Cuaderno Personalizado (7).

### Dashboard (Tab 0) — Limpieza
- Eliminado `#semaphoreList` (el semáforo ahora vive dentro de cada materia).
- Movidos `#quickAccess` + `#studyResources` desde Accesos → Dashboard.
- Conservado el form de "agregar tarea académica" + ActionNow card.

### Materias (Tab 1) — Nueva arquitectura por materia
Cada tarjeta de materia ahora incluye **dos dropdowns colapsables**:

1. **🚦 Tareas** — semáforo de prioridades (P0–P4 + Completadas) filtrado por materia. Form inline para agregar tareas específicas a esa materia (texto + prioridad + fecha + `Enter` para guardar). Hace `refreshOwner(sid)` que llama `SYS.render()` o `NB.renderCustomList()` según el contexto.

2. **📓 Cuaderno** — editor inline con mismas funciones que el cuaderno original pero scoped a esa materia. IDs sufijados con `-${sid}` para evitar colisiones. Toolbar con "+ Nueva página", "🔗 Link", "🖼️ Imagen HD".

### Imágenes HD (bug crítico resuelto)
- **Antes:** `maxW = 600px` + `canvas.toDataURL('image/jpeg', 0.7)` → imágenes borrosas.
- **Ahora:** `maxW = 1920px` + `ctx.imageSmoothingEnabled = true` + `imageSmoothingQuality = 'high'` + `canvas.toDataURL('image/jpeg', 0.92)` → HD real.
- Función reutilizable `compressImageToHD(dataUrl)` devuelve una Promise.

### Diálogo de pegado de imágenes (feature nueva)
Modal overlay `#pasteImgOverlay` con 3 métodos de entrada:
1. **Pegar (Ctrl+V)** — handler `handlePaste(e)` escucha `document.addEventListener('paste')` y filtra items con `type.startsWith('image/')`.
2. **Arrastrar y soltar** — dropzone con `dragover/dragleave/drop` listeners, clase `.drag` para feedback visual.
3. **Picker tradicional** — link "busca en tu PC" reutiliza `#nbImgInput` (file input compartido).

Flujo: `openPasteDialog(sid)` → user paste/drop/pick → `pimIngestFile(f)` → FileReader → `pimIngestDataUrl()` → `compressImageToHD()` → preview + caption input → `pimSave()` → `pushImage(sid, dataUrl, caption)` → re-render grid.

### Cuadernos Personalizados (Tab 7) — NUEVO
Manager CRUD completo de cuadernos externos a la malla (cursos auto-dirigidos):
- **Crear:** input nombre + selector de ícono (15 emojis: 📘📗📙📕📒🗒️💻🐍☁️🔧📊🔐🎨🎯⚡) + botón. Paleta de 8 colores rotativos.
- **Listar:** cada cuaderno es una tarjeta `.gc` con ícono clickable (cambiar), título editable (click → prompt), badge de páginas y fecha de creación, botones ✏️ (renombrar) y 🗑 (eliminar con confirm).
- **Editar contenido:** cada cuaderno expande un dropdown idéntico al de materias (mismas funciones NB: newPage, openPage, deletePage, addLink, removeLink, addImage via paste-dialog, removeImage, autoSave).
- **IDs:** prefijo `cnb_<timestamp>`. La función `isCustom(sid)` + `refreshOwner(sid)` enruta re-renders al destino correcto (SYS.render para materias, renderCustomList para customs).

### localStorage schemas
- **`sys_notebook`** (existente, extendido): `{ [subjectId|cnb_id]: { pages: [{id,title,body,links,images,created,updated}], links, images } }`.
- **`sys_notebook_meta`** (NUEVO): `[{ id:'cnb_<ts>', name, icon, color, created, updated }]` — registro de cuadernos personalizados.
- Ambos agregados al `SYNC_REGISTRY` de `cloud-sync.js` para sync Supabase JSONB.

### Fix crítico de scope
- `SYS` y `NB` eran `const` top-level en script clásico → no se asignaban a `window` → guards `if (window.NB && ...)` siempre false.
- **Fix:** `window.SYS = SYS;` y `window.NB = NB;` al final de cada IIFE. Restaura interoperabilidad entre módulos y con inline `onclick` handlers (aunque estos funcionaban vía global declarative env, la detección cross-module necesitaba window).

### Archivos tocados
- **`frontend/systems.html`** — tab strip (9→8), pnl0 Dashboard (sin semáforo, con QA+resources), removido pnl3 Accesos, removido pnl8 (Cuaderno viejo), agregado pnl7 (Cuadernos Personalizados), agregado modal de pegado `#pasteImgOverlay`, CSS nuevo (`.sj-drop`, `.pim-*`).
- **`frontend/systems_logic.js`** — `renderSubjectDetail` reescrito con dropdowns tasks+notebook, agregados `toggleSubjectDrop` + `addSubjectTask`, módulo NB completamente reescrito (per-subject IDs, compressImageToHD, paste-dialog, custom notebooks CRUD), `window.SYS = SYS` + `window.NB = NB`.
- **`frontend/js/cloud-sync.js`** — `'sys_notebook_meta'` agregado al `SYNC_REGISTRY`.

### Smoke tests
- `node -c frontend/systems_logic.js` → OK (1918 líneas).
- Pipeline end-to-end validado: optimizador 8-PRO generó el prompt → este refactor ejecutó sin ambigüedad el plan de 6 sub-tareas.

---

## 🎯 8-PRO · Claude Optimize — NUEVA FEATURE — 2026-04-15

### Qué se creó
Nueva pestaña **🎯 Claude Optimize** (primera pestaña, default) en `frontend/prompts.html` — **token-saver autónomo** para solicitudes a Claude Code. El usuario pega texto en inglés verboso, elige módulo objetivo + tipo de tarea, y obtiene un prompt estructurado (ROLE · REPO · LIVE · MODULE · FILES · STATE KEYS · NOTES · CONTEXT · TASK · CONSTRAINTS · DELIVERABLE) listo para pegar en una nueva sesión. 100% cliente, sin API, sin tokens, sin costo.

### Controles
- **Módulo objetivo** (15 opciones): HOME, 3-ENG, 5-JOB, 8-PRO, 9-GOA, 10-SYS, 11-ACC, 12-FIN, 13-NOT, APPLY, SIM, RUTA, NEWS, TOOLS, GENERAL. Cada uno trae metadata pre-cargada (files, state keys, notes).
- **Tipo de tarea** (7 opciones): feature, bugfix, refactor, rewrite, explore, doc, deploy. Cada tipo inyecta constraints específicas (ej: `explore` → "read-only, return file paths and line ranges"; `refactor` → "preserve observable behavior").
- **Textarea** para pegar el input en inglés verboso.
- **⚡ Optimize Prompt** — dispara el motor autónomo.
- **Stats** live: `N words → M words` (compresión).

### Motor de optimización (IIFE al final de `<script>`)
1. **`coClean(txt)`** — strip fillers con 30 regex multi-word (`so i was thinking maybe we could`, `could you please`, `basically`, `thanks in advance`, `oh and`, `kind of`, etc.) + conversión polite→imperativo (`can you fix` → `fix`) + normalización whitespace + capitalización.
2. **`coExtractTasks(cleaned)`** — split por boundaries oracionales + marcadores numerados + "then/also/and also". Dedup por key de primeros 40 chars.
3. **`coDetectSignals(raw)`** — 8 detectores (`commit|push` → "commit and push when done", `don't break` → "preserve existing", `css|style|design` → "match design tokens", `cloud sync|supabase` → "ensure SYNC_REGISTRY", etc).
4. **Assemble** — combina `CO_MODULE[mod]` metadata + `CO_TASK_HINTS[type]` constraints + detected signals + 4 reglas default (short responses, module codes, 4-layer arch, auth script order).
5. **Stats** — cuenta palabras/chars IN vs OUT, estima tokens (4 chars ≈ 1 token), muestra banner de savings (verde si comprimió, informativo si el input ya era corto).

### Persistencia
- Historial guarda con `plab_h` (existente, ahora con tag `kind:'claude-opt'` + módulo en la fecha).
- `'plab_h'` agregado a `SYNC_REGISTRY` en `frontend/js/cloud-sync.js` → sincroniza entre dispositivos via Supabase JSONB proxy.

### Archivos tocados
- **`frontend/prompts.html`** — pestaña nueva + UI (55 líneas HTML) + motor (~220 líneas JS).
- **`frontend/js/cloud-sync.js`** — `plab_h` agregado al `SYNC_REGISTRY`.

### Smoke tests ejecutados (Node)
- Feature/3-ENG: "So I was thinking maybe we could add..." → 56w → 192w (stripped fillers; 4 tasks extraídos).
- Bugfix/5-JOB: "Could you please help me fix..." → 35w → 151w (imperative + identify root cause constraint).
- Explore/3-ENG: "Explore how the SRS deck works..." → 17w → 155w (añade read-only constraint + file paths requirement).

---

## 📓 10-SYS · Tab 8 "Cuaderno" — NUEVA FEATURE — 2026-04-14

### Qué se agregó
Cuaderno digital con apariencia de cuaderno real (tema oscuro para cuidar la vista del operador) dentro del módulo de Ingeniería de Sistemas. 5 secciones/materias, páginas con título + cuerpo contenteditable sobre cuadrícula con renglones azules, links de estudio, galería de imágenes con **lightbox** (visor con navegación ←/→/Esc), autoguardado 500 ms + badge "✓ guardado", contadores de páginas por materia.

### Archivos tocados
- **`frontend/systems.html`** — CSS notebook re-escrito en tema oscuro (#1a1f2e base, tinta `#e4e8f4`, renglones `rgba(120,160,230,.18)`, margen rojo, lomo bronce, agujeros con sombra interna). Lightbox modal agregado al final del body (`#nbLightbox` con botones prev/next/close). Badge "✓ guardado" en header. Tab 8 "📓 Cuaderno" visible en la tira de tabs.
- **`frontend/systems_logic.js`** — Módulo `NB` IIFE (~230 líneas). Nuevas funciones: `viewImage`, `closeImage`, `prevImage`, `nextImage` (lightbox). `init` ahora pinta puntos de color por materia + contador de páginas. `autoSave` dispara el badge de guardado. Shortcuts teclado Esc/←/→ para el lightbox.
- **`frontend/js/cloud-sync.js`** — `SYNC_REGISTRY` incluye `sys_notebook` → sincronización automática vía proxy de `localStorage.setItem`.

### Fix crítico aplicado en esta sesión
- **Imagen abría pestaña en blanco** al hacer click — era `window.open(this.src)` con data URLs base64. Reemplazado por lightbox modal in-page con navegación entre imágenes.
- **Fondo claro lastimaba la vista** — migrado a paleta oscura completa (paper → #1a1f2e, header gradient → #1f2638/#181d2c, spine → bronce #4a3820, holes → #0a0d16).

### Polish aplicado
- Gradiente radial sutil violeta en la página
- Glow en margen rojo y brillo en spine
- Focus-state: líneas de cuadrícula más visibles al escribir
- Placeholder itálico gris suave
- Caret azul suave (`#8bb4ff`)
- Puntos de color por materia (violeta, cian, verde, ámbar, rojo)
- Contador de páginas por materia en los chips

### Estado cloud sync
✅ `sys_notebook` registrado en `SYNC_REGISTRY` (línea 232 de `cloud-sync.js`). Al modificar una página, el proxy de `localStorage.setItem` dispara `CLOUD.push()` automáticamente. Disponible desde cualquier dispositivo al hacer login.

### Claves localStorage
- `sys_notebook` — objeto `{ [subjectId]: { pages: [...], links: [], images: [] } }`

---

## 🔒 10-SYS · Ingeniería de Sistemas — 100% COMPLETO Y CERRADO — 2026-04-09

### Estado final del módulo
**MÓDULO CERRADO PERMANENTEMENTE.** Listo para uso diario. La inyección manual de syllabus se detuvo por decisión del operador. Todo lo que está cargado es **dato real, verificado por el usuario** — cero extrapolación, cero invención. El Direct-Fetch Protocol para Tab 7 quedó verificado end-to-end (Mat Especiales en producción). No hay trabajo pendiente en este módulo: cualquier nueva sesión de clase usa el protocolo Modo A o Modo B ya documentado, sin necesidad de modificar código.

### Datos académicos cargados (período 26V02)
| Materia | cdigital_id | Estado | Datos cargados |
|---|---|---|---|
| ✅ DIS34 Ing. Web | 104362 | COMPLETO | Profesor, horario, 4 subject_links, 7 tareas (Cortes 1-3) |
| ✅ DIS31 Mat. Especiales | 101285 | COMPLETO | Profesor (Cortés Cruz), email, horario Mié/Vie, 3 subject_links, 7 tareas |
| 🟡 DIS36 Inv. C&T | 104253 | PARCIAL | Solo 3 tareas Corte 1 (Tarea 1, Quiz 1, Tarea 2). Sin pesos, sin Cortes 2-3 |
| ⚪ A1I01 English Beginner 1 | 100774 | PENDIENTE | Solo placeholder en SUBJECTS — sin syllabus |
| ⚪ CE1026 Placement Test BE+ | 106289 | PENDIENTE | Solo placeholder en SUBJECTS — sin syllabus |

`VERIFIED_SUBJECTS = {ing_web, mat_especiales, inv_ciencia}` — únicas materias que NO muestran el warning "⏳ Sin syllabus cargado".

### Funcionalidades activas (8 tabs)
- **Tab 0 — Dashboard:** `actionNow` hero contextual + `semaphoreList` P0-P4 + `task-form` (alta de tareas con select limpio de 5 materias).
- **Tab 1 — Materias:** `subjectDetail` cards (profesor, email, horario, progress bar, tareas, deep-links). Sin warning para verificadas.
- **Tab 2 — Calendario:** Calendario académico 26V02 oficial.
- **Tab 3 — Accesos:** Portal Opener v2 (CDigital, SGA, CUN 360, Gmail).
- **Tab 4 — Malla Curricular:** 10 semestres.
- **Tab 5 — Certificaciones:** 8 certs con links.
- **Tab 6 — CUN Hub:** Recursos del ecosistema CUN.
- **Tab 7 — Clases Perdidas:** ✅ VERIFICADO HOY + EJECUTADO end-to-end con DATOS REALES. Soporta dos modos:
  - **Modo A (Direct Fetch):** El usuario me pega la URL en el chat con la pestaña del video ya abierta y el panel de Transcripción de Drive activado. Yo uso Chrome MCP (`tabs_context_mcp` + `javascript_tool`) para extraer el transcript del DOM (`[role="complementary"][aria-label*="ranscripci"]`), pre-proceso EN LA PÁGINA (filtrado por keywords + últimos segmentos para evitar reventar mi context), genero el informe verbatim, y ejecuto `SYS.injectClassSession()` directamente en la pestaña real del live site (`mikel696.github.io/da-2026/frontend/systems.html`). El proxy de `cloud-sync.js` empuja a Supabase automáticamente.
  - **Modo B (Prompt portable):** Si no tengo Chrome MCP, el botón "📋 Copiar Prompt" genera el SOP completo (con prerrequisito de panel de transcripción visible y reglas anti-hallucinación) para que otra sesión de Claude lo ejecute.
  - **Hoy 2026-04-09:** ejecuté Modo A end-to-end con la grabación de **DIS31 Matemáticas Especiales** (108K caracteres de transcript), inyecté la sesión en producción, verifiqué visualmente que la tarjeta aparece en "Sesiones guardadas" (`#classSessionsList`) y que el counter del card sube a "1 sesión".

### Arquitectura interna (post-hardening)
- **`SUBJECTS`** — 5 materias reales (auditadas contra CDigital). 3 falsas eliminadas (`calidad_sw`, `admin_bd`, `redes`).
- **`SEED_VERSION = 5`** — Sistema de migración versionado:
  - v1→v2: purga materias falsas
  - v2→v3: purga extrapolaciones inventadas
  - v3→v4: incorpora Mat Especiales verificada
  - v4→v5: incorpora Inv C&T parcial
  - Migración preserva tareas creadas por el usuario (dedupe by text)
- **`SEED_TASKS`** — 17 tareas reales: 7 Ing Web + 7 Mat Esp + 3 Inv C&T
- **Class Sessions store** — `CS_KEY = 'class_sessions'` (sin doble prefijo `sys_sys_*`); migración one-time del key viejo.
- **Tamaños actuales:** `systems_logic.js` ~1240 líneas, `systems.html` ~513 líneas

---

## 📜 RESUMEN DE HITOS RECIENTES (Q1-Q2 2026)

### 🔐 Supabase Auth + JSONB Global Sync
- **`frontend/js/supabase-client.js`** — Cliente Supabase v2 (CDN UMD).
- **`frontend/js/auth.js`** — Sign-in/sign-up con email + password.
- **`frontend/js/cloud-sync.js`** — Offline-first JSONB payload sync. Cada módulo declara su key, el proxy intercepta `localStorage.setItem` y dispara `CLOUD.push()`.
- **Hardening:** sync-lock para evitar timestamp poisoning en device fresco; safe date parsing en `_mergeByUpdatedAt` para no crashear sync.
- **Estado:** ✅ Producción verificada, multi-device pull QA pasado.

### 💰 12-FIN · Finance Module
- **`frontend/finance.html`** + capa de datos `FIN`.
- Presupuesto, ahorro, transacciones — arquitectura separada (no monolito).
- **Estado:** ✅ Producción verificada.

### 📓 13-NOT · Notes & SRS Leitner
- **`frontend/notes.html`** — Markdown + Journal + Flashcards SRS Leitner.
- 5 cajas Leitner, intervalos progresivos, modo estudio.
- **Estado:** ✅ Producción.

### 💼 5-JOB · Job Tracker (jt8 Migration)
- Migración de schema antiguo a `jt8` con detección de duplicados y verificación.
- Botón FAB de migración bidireccional VacancyDB ↔ Job Tracker.
- Master-detail viewer + Kanban pipeline con drag-and-drop (commit reciente `6ce874c`).
- **Estado:** ✅ QA pasado, migración hardened.

### 🎓 10-SYS · 26V02 Cleanup + Hallucination Purge
- Auditoría completa contra CDigital → 3 materias falsas eliminadas, 5 reales verificadas.
- Purga total de calendario extrapolado (commit `400b1e5`).
- Inyección manual de Mat Especiales (commit `4af10d4`).
- Inyección parcial de Inv C&T (commit `4334d12`).
- **Hoy (2026-04-09):** Finalización + verificación Tab 7 + overhaul de documentación + **primera ejecución end-to-end del Direct-Fetch Protocol** (Mat Especiales clase grabada en Drive → transcript extraído por Chrome MCP → informe inyectado en producción y verificado visualmente).

### 📹 Direct-Fetch Protocol para Tab 7 — formalizado 2026-04-09
- **Trigger:** El usuario pega la URL de Drive del video en el chat (ya no necesita pasar por la UI del Tab 7).
- **Prerrequisito del usuario:** abrir la pestaña del video en su Chrome (con la extensión Claude/Chrome MCP) y activar el panel de Transcripción del reproductor de Drive (⋮ → Transcripción).
- **Mi flujo:**
  1. `tabs_context_mcp` → identifico la pestaña existente del video (NO `navigate` — Drive responde 401 sin la sesión del usuario).
  2. `javascript_tool` → extraigo `innerText` de `[role="complementary"][aria-label*="ranscripci"]` y filtro etiquetas de UI.
  3. Pre-proceso EN LA PÁGINA: parseo `[timestamp, texto]`, filtro por keywords (`tarea|entrega|parcial|examen|quiz|fecha|plazo|abril|mayo|cdigital|drive|http|recuerden|no olviden|para el|hasta el`) + últimos ~25 segmentos. Solo los hits regresan a mi contexto.
  4. Genero informe **solo con verbatim + timestamps**. Sin verbatim no se inyecta nada (regla anti-hallucinación).
  5. `SYS.injectClassSession({ ... })` directamente en la pestaña real de `mikel696.github.io/da-2026/frontend/systems.html`. El proxy de `cloud-sync.js` hace push a Supabase automáticamente.
  6. `showTab(7)` + screenshot para verificación visual.
- **Prompt actualizado en `systems_logic.js`:** el botón "📋 Copiar Prompt" ahora genera la versión nueva con el prerrequisito del panel de transcripción, el SOP completo de Chrome MCP y las reglas anti-hallucinación. Sirve como fallback portable cuando otra sesión de Claude debe ejecutar el protocolo sin que yo esté presente.
- **Por qué este protocolo:** transcripts de 1 hora son ~100K+ caracteres. Si los traigo crudos a mi context, revientan la ventana. El filtrado y la generación del informe se hacen EN EL BROWSER y solo viajan los hits relevantes a mi memoria.

### 🇺🇸 3-ENG · English Academy v2 — COMPLETO 2026-04-13
- Refactored 653-line monolith `english.html` into 4-layer architecture: thin HTML shell (~135 lines) + `css/english.css` (~200 lines) + `js/eng.js` (~500 lines ENG IIFE) + `data/english-data.json` (all content).
- 10 tabs: Vocabulary, Grammar, Understand, Conversations, Professional, Exercises, Flashcards, Interviews, Notes, Dojo.
- Content overhaul: 20 grammar rules with structured formulas/examples (up from 12), 139 professional vocabulary items across 8 categories, 6 conversation scenarios, 5 professional contexts, 28 exercises (A2-B2), interview prep (behavioral/technical/situational), comprehension strategies, hispanic error patterns.
- Dojo TTS+STT engine (`js/english.js` + `data/english-dojo.json`) integrated — renders into `#dojoContent`.
- Full Supabase auth stack restored (4 script tags). `cloud:sync_complete` listener re-renders after cloud pull.
- State keys: `e4`, `eng_notes`, `eng_srs_deck`, `dojo_stats` — all in SYNC_REGISTRY.

### 🏠 Main Page Updates — 2026-04-13
- Cajita Tech section redesigned: categorized Quick Links buttons (Epic Games, Udemy, PromoCajita, Pi3.AI) replacing outdated deals list.
- `data/recommendations.json` restructured with categories (games/learning/tools) + quickLinks format.
- Pi3.AI interview practice card added.
- Prompt Lab card updated: "14 prompts" → "31 prompts", tags include "System · Recovery".

### 🤖 8-PRO · Prompt Lab v2 — 2026-04-13
- Added 10 operational prompts (seed-022 to seed-031): recovery prompt, 8 module-specific prompts, main page update prompt.
- All in English, optimized for token conservation.
- seedVersion bumped from 1 to 2. Total: 31 prompts.

### 🔧 Otros módulos en producción
- **2-APP** Application Command Center: refactor profundo, profiling AP Lead Monks/S4, prep Pi3.AI.
- **6-TOO** Tools: redesign deals panel — botones compactos.
- **11-ACC** Accounting Associate: ✅ **COMPLETO Y DESPLEGADO — 2026-04-10**. Refactor completo a arquitectura de 4 capas según `PLAN_ACCOUNTING.md`. Shell puro `accounting.html` (65 líneas) + `css/accounting.css` (144 líneas) + `js/accounting.js` (742 líneas IIFE `ACC`) + `data/accounting-data.json` (138 líneas, 8 top-level keys). Un solo localStorage key `sb_accounting` (JSONB opaco) con sub-stores: `progress`, `exerciseLog`, `chatHistory`, `mastered`, `practiced`, `careerDone`. Registrado en `SYNC_REGISTRY` de `cloud-sync.js`. 6 tabs: Ruta (career path + 7 ejercicios técnicos), Glosario (62 términos EN/ES con TTS + mastery toggle), Excel Lab (24 vocab items + link a Ruta DA Dojo), Recursos (4 links externos), Simulador (chat recruiter con keyword scoring + historial persistido), STAR Prep (7 Q&A con practiced toggle). `_esc()` en todo texto de usuario (XSS verified). `cloud:sync_complete` → `renderAll()`. Legacy `acct_module.js` eliminado. Employer-agnostic (antes era solo Brinks). QA en vivo pasado: `pullAllStates OK: 21 keys`, `reconcile cloud→local: sb_accounting`, `pushState OK: sb_accounting`, `fullSyncAll DONE (3706ms)` — cero crashes de sync, cero errores de consola.
- **9-GOA** Goals & Habits: ✅ **COMPLETO Y DESPLEGADO — 2026-04-09**. Refactor a arquitectura de 4 capas ejecutado según `PLAN_HABITS_UI.md`. `frontend/goals.html` queda como shell puro (84 líneas). Toda la lógica vive en `frontend/js/goals.js` (~500 líneas) como IIFE `GOA` con 3 singletons (`GOALS/HABITS/REVIEWS`) sobre `sb_goals/sb_habits/sb_reviews`. Todos los registros usan `crypto.randomUUID()` — deletes por `filter(id !== target)`, sin `splice` ni ordering bugs. Migración idempotente `migrateGoalsAndHabits()` back-fillea UUIDs en registros legacy sin perder contenido. `_esc()` aplicado a todo texto de usuario (XSS verified). Listener `cloud:sync_complete` → `renderAll()`. QA en vivo pasado: `pullAllStates OK: 19 keys`, `reconcile local→cloud: sb_goals`, `reconcile local→cloud: sb_reviews`, `pushState OK: sb_goals`, `pushState OK: sb_habits`, `pushState OK: sb_reviews`, `fullSyncAll DONE` — cero crashes de sync, cero errores de consola.

---

## 🧠 LECCIONES APRENDIDAS (no repetir)

1. **NO extrapolar calendarios entre materias.** Una vez basta para hallucinaciones masivas (ver corrección `400b1e5`).
2. **Toda materia inyectada requiere `VERIFIED_SUBJECTS` Set** para que la UI sepa si mostrar warning o calendario.
3. **`SEED_VERSION` SIEMPRE bumpea** cuando se cambia `SEED_TASKS`, con dedupe by text para preservar tareas del usuario.
4. **Worktrees del harness:** las edits van al main repo via absolute paths, no al worktree. `pwd` ≠ donde se commitea.
5. **Class Sessions key:** usar `'class_sessions'` (db.get/set añade `sys_` automáticamente). El bug `sys_sys_class_sessions` ya tiene migración one-time.
6. **Direct-Fetch de transcripts de Drive:** SIEMPRE reusar la pestaña que el usuario ya abrió (`tabs_context_mcp`). NUNCA `navigate` a Drive ni `curl/fetch` — Drive responde 401 sin la sesión del usuario.
7. **Pre-procesar transcripts en el browser, no en mi contexto.** 100K+ caracteres revientan la ventana. Filtrado por keywords + slice de últimos N segmentos van por `javascript_tool` y solo los hits regresan.
8. **Inyectar siempre en la pestaña real de `mikel696.github.io`**, no en localhost ni preview. Solo ahí está la sesión de Supabase del usuario y el proxy hace push automático.
9. **Borrar entradas de stores `prepend`-orientados por `id`, no por índice.** `SYS.injectClassSession` (y otros stores que insertan al frente) hacen `arr.unshift(...)`. Si después haces `arr[arr.length-1]` para "quedarte con la entrada nueva" vas a tomar la MÁS VIEJA y borrarla. Patrón seguro: capturar el `id` que retorna/genera `inject*` y pasárselo a `delete*`. Aplica a `sys_class_sessions`, `sys_tasks`, `not_cards`, `fin_transactions` y cualquier store con `unshift` semantics. Lección registrada el 2026-04-09 después de borrar accidentalmente la sesión Mat Especiales del preview por usar índice.

---

## 🔒 HANDOVER A USO PRODUCTIVO — 10-SYS CERRADO

El operador (Miguel) puede ahora:
- Usar el módulo 10-SYS como su Mission Control académico diario.
- Marcar tareas como completadas, agregar nuevas via task-form.
- Cuando pierda una clase: pegar URL en Tab 7 → copiar prompt → ejecutar Claude (Modo B), o pegármela directamente en el chat con Chrome MCP disponible (Modo A).
- Sync automático con Supabase para multi-device.

**El sistema es production-ready. 10-SYS queda CERRADO. A estudiar.**

---

## 🤖 8-PRO · Prompt Lab v2 — COMPLETO Y DESPLEGADO — 2026-04-10

### Estado final del módulo
**MÓDULO COMPLETADO.** Refactor del monolito `prompts.html` (418 líneas inline) a arquitectura de 4 capas. QA pasado en preview: 21 prompts renderizan, optimizador genera output con syntax highlighting, category filters funcionan, `sb_prompts` registrado en `SYNC_REGISTRY`, cero errores de consola.

### Arquitectura
- Shell puro `prompts.html` (~130 líneas) + `css/prompts.css` (230 líneas) + `js/prompts.js` (~530 líneas IIFE `PRO`) + `data/prompts-data.json` (21 seed prompts, 8 categorías, optimizer config).
- Un solo localStorage key `sb_prompts` (JSONB opaco) con sub-stores: `library`, `history`, `settings`.
- Migración idempotente de `plab_h` (historial) y `custom_prompts` (colección legacy). `plab_h` removido de `SYNC_REGISTRY`.
- Taxonomía de 8 categorías (`data`, `code`, `finance`, `career`, `learning`, `writing`, `system`, `custom`) + tags libres + template variables (`{{VAR}}`).
- 5 tabs: Librería (search + filter + sort + fav + variables), Optimizar (engine refactored), Crear (CRUD custom), Guía (10 rules), Historial.
- Seed version bumping (`seedVersion: 1`). Custom prompts usan `crypto.randomUUID()`, deletes por `filter(id !== target)`.
- `_esc()` en todo texto de usuario (XSS verified). `cloud:sync_complete` → `PRO.renderAll()`.
- Weavers de job pipeline (`prompt-weaver.js`, `cover-weaver.js`, etc.) no se tocaron — pertenecen a 2-APP/5-JOB.

---

## 🎯 PRÓXIMA FASE — Seguir construyendo módulos del dashboard
Con 10-SYS, 9-GOA, y 11-ACC cerrados, y 8-PRO en planificación, el backlog restante es:
- **8-PRO · Prompt Lab v2:** ⏳ Plan listo, pendiente aprobación → ejecución.
- **2-APP · Application Command Center:** polish + posibles features nuevas.
- **6-TOO · Tools refresh:** seguir el redesign del panel de deals.

## 🖼️🗺️ 13-NOT · P4 · Inline images + Mindmap por cuaderno — 2026-06-02

### Qué cambió
P4 del módulo Notas. Dos features grandes + un fix de paste:

**1. Inline images en cualquier editor `.nb-content`**
- Botón nuevo "🖼️ Imagen" en `NBShared.toolbarHtml` → propaga a 10-SYS, 13-NOT, 14-WORK por construcción shared.
- `NBShared.insertImage(sid, ns)`: file picker → comprime a 3 tiers (full 1920px→IDB, preview 1280px→inline body en `<img>` `data-img-id`, thumbnail fallback). Body queda con `<img class="nb-img" data-img-id="..." src="<preview>">`.
- Paste (Ctrl+V) con imagen en clipboard ahora INGESTA inline (antes bloqueaba con un alert pidiéndole usar un botón inexistente).
- Click en imagen → overlay full-screen HD desde IDB (cae a preview si no hay IDB).

**2. Mindmap propio por cuaderno (NUEVO)**
- Nuevo store `not_nb_maps` (registrado en `SYNC_REGISTRY` → cross-device).
- Botón "🗺️ Mapa" en la toolbar del detalle del cuaderno → toggle de canvas SVG 800×460.
- Interacciones: click vacío → crear nodo (prompt texto); drag → mover; Ctrl/Shift+click en 2 nodos → conectar; doble-click → editar texto; click derecho → eliminar; botón "🗑 Limpiar" → reset.
- Persistencia automática vía proxy `localStorage.setItem` → push a Supabase JSONB.

**3. Bug fix histórico**: el clean-paste mostraba alert "usa el botón 🖼️ Imagen HD" que no existía. Ahora pega bien.

### Archivos tocados
- `frontend/js/nb-shared.js`: +1 botón toolbar, +`insertImage`, +`_insertImageFromFile`, +`_findEditor`, +`_readFileAsDataURL`, +`_openImageHD`, +`attachImageClickHandler`, paste handler reformulado.
- `frontend/css/nb-shared.css`: +`.nb-rt-img`, +`.nb-content .nb-img` (hover lift), +focus-visible WCAG AA.
- `frontend/js/notes-nb.js`: +MAP namespace inner (~130 líneas) con `loadMaps/saveMaps/getMap/setMap/toggleMap/renderMap/clearMap/mapHtml`, +1 botón en toolbar detalle, +1 export en API.
- `frontend/js/cloud-sync.js`: +`'not_nb_maps'` en SYNC_REGISTRY (cross-device sync).

### Storage shape
```
not_nb_maps = {
  [nbId]: {
    nodes: [{ id, x, y, text, color }],
    edges: [{ from, to }],
    updatedAt: ISO
  }
}
```

### Verificación
- [ ] Abrir notes.html → cuaderno → editor → botón 🖼️ → file picker → imagen inserta inline.
- [ ] Ctrl+V con imagen en clipboard → inserta inline.
- [ ] Click en imagen → overlay full-screen HD.
- [ ] Botón 🗺️ Mapa → canvas aparece; click vacío crea nodo; drag mueve; Ctrl+click 2 nodos conecta.
- [ ] Reload → mapa persiste · DevTools → `localStorage.not_nb_maps` poblado.
- [ ] 10-SYS y 14-WORK siguen funcionando (toolbar shared no rota).

### Próximos angles posibles
(a) Export mapa a PNG/SVG · (b) Templates (kanban, swot, fishbone) · (c) Auto-extraer entidades de las páginas para sugerir nodos · (d) Link nodo → página del cuaderno · (e) Keyboard nav del HD overlay.

## 💻🗺️ 13-NOT · P5 · Templates + Iconos + Code blocks — 2026-06-02

### Qué cambió
P5 enfocada en flujo de estudio (sistemas/programación). Cinco features:

**1. Iconos en nodos del mindmap**
- Palette de 56 iconos curados (libros, código, matemática, ciencia, lógica).
- Auto-parse de emoji al inicio del texto: "📘 Python" → icon `📘` + text `Python`.
- Alt+click en un nodo → overlay picker con grid + botón "Quitar".
- Render: nodo con icon usa círculo r=32 (más grande), emoji arriba (font 18), texto debajo (font 10).

**2. Templates de mindmap (4)**
- Blanco, Radial (centro + 6 ramas), Mapa conceptual (4 niveles top-down), Lenguaje de programación (Sintaxis/Semántica/Paradigma/Tipos/Stdlib/Ecosistema/Ejemplos).
- Selector en la toolbar del mapa "📐 Template…" → confirma si pisa contenido existente.
- El template "Lenguaje" pide el nombre del lenguaje via prompt.

**3. Export mapa a PNG**
- Botón "⬇ PNG" en toolbar del mapa.
- Serializa SVG → canvas 2x (retina) → blob → download como `mapa-{nombre-cuaderno}.png`.

**4. Templates de cuaderno (5)**
- Selector en form "Nuevo cuaderno": Sin plantilla, Lenguaje de programación, Algoritmo / EDA, Concepto académico, Workflow / Proyecto.
- "Lenguaje" → 10 páginas: Intro, Sintaxis, Tipos, Control de flujo, Funciones, OOP, Stdlib, Ejemplos, Ecosistema, Recursos.
- "Algoritmo" → 7 páginas: Problema, Análisis, Pseudocódigo, Implementación, Complejidad, Tests, Variantes.
- "Concepto" → 6 páginas: Definición formal, Intuición, Ejemplos, Conexiones, Preguntas examen, Fuentes.
- "Workflow" → 6 páginas: Objetivo, Stack, Tareas (checklist), Recursos, Log diario, Retrospectiva.

**5. Code block en toolbar shared**
- Botón "</> Code" en `NBShared.toolbarHtml` → propaga a 10-SYS, 13-NOT, 14-WORK.
- `NBShared.insertCodeBlock(sid, ns)` inserta `<pre class="nb-code-wrap"><code class="nb-code" data-lang="...">` con monospace dark, borde izquierdo cyan, tag de lenguaje opcional arriba-derecha.
- Pre-armado para futuro syntax highlighting (atributo `data-lang`).

### Archivos tocados
- `frontend/js/notes-nb.js`: +`MAP_ICONS` (56 items), +`_splitIcon` (regex unicode), +`openIconPicker`, +`MAP_TEMPLATES` (4 starters) + `_tplBlank/_tplRadial/_tplConcept/_tplProg`, +`applyMapTemplate`, +`exportMapPNG`, +`NB_TEMPLATES` (5 starters), +`_createWithTemplate`, modificación de `create()` para leer selector, modificación de `renderMap` para iconos, modificación de `mapHtml` con selector templates + botones PNG/Limpiar, expansión del export API.
- `frontend/js/nb-shared.js`: +botón `</>` Code en toolbar, +`insertCodeBlock(sid, ns)` con prompt de lenguaje + inserción `pre+code`, export en PUBLIC API.
- `frontend/css/nb-shared.css`: +`.nb-rt-code` botón cyan, +`.nb-content .nb-code-wrap`, +`.nb-content .nb-code-lang`, +`.nb-content .nb-code` con tipografía monospace + colores GitHub-dark.
- `frontend/notes.html`: +`<select id="notNbTpl">` con 5 opciones en el form "Nuevo cuaderno", copy actualizado.

### Verificación
- [ ] Crear cuaderno con template "Lenguaje de programación" → debe crear 10 páginas pre-rellenas en orden.
- [ ] Abrir mapa → "📐 Template…" → "🌟 Radial" → 7 nodos conectados aparecen.
- [ ] Click vacío → "📘 Python" → nodo creado con icon `📘`.
- [ ] Alt+click en nodo → picker → elegir icono → se aplica.
- [ ] Doble-click en nodo → editar "🔬 Lab" → icono cambia.
- [ ] "⬇ PNG" → descarga `mapa-{nombre}.png`.
- [ ] Toolbar editor: "</> Code" → prompt lenguaje "python" → inserta bloque dark con tag PYTHON.
- [ ] 10-SYS y 14-WORK también muestran el botón "</> Code" (shared).

### Próximos angles posibles
(a) Syntax highlighting real con Prism/highlight.js CDN sobre `.nb-code[data-lang]` · (b) Link bidireccional nodo del mapa ↔ página del cuaderno (click nodo abre página) · (c) Templates de cuaderno editables por el usuario · (d) Auto-extraer entidades (h2/h3 de páginas) como nodos sugeridos del mapa · (e) Drag-to-reorder páginas del cuaderno · (f) Tabla / checklist templates en code blocks.

## 🎨🔗🔀 13-NOT · P6 · Highlight + Link mapa-pagina + Drag reorder — 2026-06-02

### Qué cambió
P6 cierra el flujo de estudio con tres mejoras de UX + resolución de pendientes:

**1. Syntax highlighting real en code blocks**
- CDN: highlight.js 11.9.0 + tema github-dark (~28KB minified, async).
- Auto-apply en cada render: `NBShared.applyHighlight(rootEl)` busca `.nb-code[data-lang]:not([data-hl="1"])` y aplica `hljs.highlightElement` con el lenguaje del atributo.
- Patrón "highlight on idle" para no romper contenteditable: focusin strippea spans (innerText → textContent) → editás plain → focusout re-highlightea con debounce 60ms.
- Retry si highlight.js todavía no cargó (300ms × 30 tries).

**2. Link bidireccional nodo del mapa ↔ página del cuaderno**
- Nodo gana campo opcional `pageId`.
- Overlay de Settings (antes IconPicker) ahora tiene 2 secciones: 🎨 Icono + 🔗 Link a página. Selector de página del cuaderno actual + botón Guardar.
- Nodos vinculados se renderizan con halo verde alrededor + badge 🔗 en esquina superior-derecha + cursor pointer.
- Click simple en nodo vinculado (sin modifiers, sin drag) → setea `activePageId` + re-render + scroll smooth al editor. Es la navegación natural mapa → contenido.

**3. Drag-to-reorder páginas del cuaderno**
- Cada `.nb-entry` ahora es `draggable="true"` con `data-pg` + `data-nb`.
- Grip visual ⋮⋮ con `cursor:grab` para señalar la affordance.
- HTML5 drag nativo: `dragstart` baja opacidad del source, `dragover` pinta border-top del target con color de marca, `drop` reordena el array + persist + re-render.
- Sin librerías externas. Funciona en desktop; móvil seguirá usando el botón 🗑/edit.

**4. Pendientes resueltos (commit b16a18f)**
- `frontend/tools.html` (6-TOO): pivot intencional de "Herramientas & Ventajas" (cert listing) a "Mantenimiento del PC" con code blocks copiables (`.code` + `.copy`) y componente step-by-step. Conservado el design system v1.0.
- `Modelo.md`: apuntes personales sobre Obsidian como segundo cerebro (fuente de inspiración para futuras iteraciones del flow 13-NOT).
- `Diagnostico-PC-2026-06-02.html`: snapshot del diagnóstico que dio origen al rework de 6-TOO.

### Archivos tocados (P6)
- `frontend/notes.html`: + 2 tags `<link>` + `<script>` para highlight.js CDN (theme github-dark + main JS).
- `frontend/js/nb-shared.js`: + `_hljsReady`, `applyHighlight(root)`, `attachCodeBlockHandlers(el)` con focusin/focusout, integración en `attachEditorHandlers` con retry async, export en PUBLIC API.
- `frontend/js/notes-nb.js`: ampliación de `openIconPicker` (ahora "Settings del nodo" con icon + page link), update de `renderMap` (halo verde + 🔗 badge + cursor pointer), update de `_wireMapEvents` (mouseup tap-on-node abre página), update de `mapHtml` docstring, update de `renderEditor` (entries draggable + grip), +`_wirePageReorder`, +`reorderPages(nbId, srcPgId, tgtPgId)`, llamada desde `render()`, export en PUBLIC API.

### Verificación
- [ ] Crear cuaderno con template "Lenguaje", escribir code block con lang `python` → al render aparece coloreado.
- [ ] Click adentro del code → spans desaparecen → editás plain.
- [ ] Click afuera → re-coloreado correcto.
- [ ] Mapa: Alt+click un nodo → overlay con sección "Link a página" → elegir → Guardar → nodo gana halo verde + 🔗.
- [ ] Click simple en ese nodo (sin Alt) → abre la página vinculada + scroll al editor.
- [ ] Lista de páginas: drag con grip ⋮⋮ una página, soltala sobre otra → orden se actualiza, reload preserva orden.
- [ ] 6-TOO: tools.html ahora abre como "Mantenimiento del PC" con code blocks y step-by-step.

### Próximos angles posibles (P7)
(a) Drag-to-reorder de NODOS del mapa por categorías · (b) Export del cuaderno entero a PDF (pages + maps embedded) · (c) Backlinks: una página conoce qué nodos del mapa la referencian · (d) Templates de cuaderno editables por el usuario (vos creás tu propio template y se guarda) · (e) Search transversal sobre todos los cuadernos + mapas.

## 🗑️ 13-NOT · P7 · Fix delete · todo es eliminable — 2026-06-02

### Reporte del usuario
"Insert a section of code, but it cannot be deleted; check that everything created can be edited and deleted."

### Bug confirmado
El code block insertado vía toolbar usa `<pre contenteditable="false">` para evitar que el cursor entre y rompa la estructura. Side-effect: Backspace desde afuera no puede borrarlo y no hay botón visible para eliminarlo.

### Fix aplicado
1. **Code blocks** — agregado botón `×` flotante con `class="nb-block-del"` en top-right del `.nb-code-wrap`. Aparece en hover (opacity 0 → 1). Click pide confirm y `wrap.remove()` + dispatch input event para autosave. Plus: Backspace dentro de un `.nb-code` vacío también elimina el wrapper.
2. **Imágenes inline en editor** — antes solo se podían borrar moviendo el cursor adyacente y backspace. Ahora el HD overlay tiene botón `🗑 Eliminar imagen` + botón `Cerrar (Esc)`. Eliminar quita el `<img>` del DOM + `deleteImage(id)` en IDB para liberar storage.
3. **Edges del mapa** — antes solo se eliminaban en cascada al borrar un nodo. Ahora cada `<g class="mm-edge" data-ei="...">` envuelve una line invisible de 14px (hit-area generosa) + la line visible. Click sobre la línea pide confirm y splice del array de edges.

### Audit completo de "creable → editable + eliminable"
| Entidad | Editar | Eliminar |
|---|---|---|
| Notas (`sb_notes2`) | inline edit | botón ✕ por nota |
| Journal entries | inline | botón ✕ |
| Cuadernos | rename + redesign | botón 🗑 con confirm |
| Páginas | inline + título | botón 🗑 + drag reorder |
| Links de página | — | removeLink |
| Attachments | — | removeAttachment + deleteBlob |
| Imágenes grid (legacy) | renameImage | removeImage |
| **Imágenes inline (P4)** | (estática) | **🗑 en HD overlay (P7)** |
| **Code blocks (P5)** | code editable inline | **× hover + Backspace vacío (P7)** |
| Nodos del mapa | doble-click texto + Alt+click icono/link | click derecho confirm |
| **Edges del mapa** | (recreables) | **click sobre línea (P7)** |
| Mapa entero | — | botón 🗑 Limpiar |
| Labels urgente/hecho | (estáticas) | click span |
| Mapa templates | — | (aplicables, sobreescriben mapa actual) |
| Notebook templates | — | (resulting pages son normales) |

### Archivos tocados
- `frontend/js/nb-shared.js`: + `delBtn` HTML en `insertCodeBlock` · + delegated click handler en `attachCodeBlockHandlers` para `.nb-block-del` con confirm · + keydown Backspace para eliminar wrapper si code está vacío · + botones Cerrar/Eliminar en `_openImageHD` con handler de delete (DOM + IDB).
- `frontend/js/notes-nb.js`: + `<g class="mm-edge" data-ei="...">` con hit-area de 14px en `renderMap` · + click handler en `_wireMapEvents` que detecta `.mm-edge` y splica el edge · + update del docstring de la toolbar del mapa.
- `frontend/css/nb-shared.css`: + `.nb-block-del` con opacity hover + transform scale + focus-visible WCAG AA · + padding-right del wrapper + reposición del `.nb-code-lang`.

### Verificación manual sugerida
- [ ] Editor → `</> Code` → insert bloque → hover muestra × arriba-derecha → click confirma → bloque desaparece.
- [ ] Editor → `</> Code` → vacío "// código aquí" todo seleccionado y borrado → Backspace adicional → wrapper desaparece.
- [ ] Editor → click en imagen → HD overlay → "🗑 Eliminar imagen" → confirm → imagen sale del editor.
- [ ] Mapa → click en una línea (no sobre un nodo) → confirm → conexión eliminada.
- [ ] Mapa → click derecho nodo → confirm → nodo + sus edges van.

## 🖼️📂 13-NOT · P8 · Chips compactos + Dropdown imágenes — 2026-06-02

### Reporte del usuario
"The attached images should not cover the sheet; they should be in a small icon in a drop-down list to choose the image, and they appear in a pop-up window when clicked, in the best quality."

### Solución
1. **Las imágenes ya no se renderizan inline grandes.** Al insertar (file picker o paste) se inserta un **chip compacto** estilo pill: 🖼️ + nombre del archivo (truncado a 28 chars). Ocupa una sola línea de texto, no tapa la hoja.
2. **El chip lleva todo el contexto:**
   - `data-img-id` → apunta al full 1920px en IndexedDB (HD local).
   - `data-preview` → carga inline el preview 1280px (sincroniza cross-device vía JSONB).
   - `data-name` → nombre original del archivo.
3. **Click en chip → mismo overlay HD que ya existía** con botones Cerrar (Esc) y 🗑 Eliminar. Best quality desde IDB cuando existe, fallback al preview 1280px embedded.
4. **Migración automática de imágenes legacy.** `attachEditorHandlers` corre `_migrateInlineImagesToChips(el)` que reemplaza cada `<img class="nb-img">` por su chip equivalente preservando id, alt como name, src como data-preview. Idempotente (no toca chips ya creados).
5. **Nuevo botón "📂 Lista" en el toolbar shared.** Abre un overlay con grid de thumbnails de todas las imágenes de la página actual. Cada card tiene preview 90px + nombre. Click una card → abre el HD overlay correspondiente.

### Archivos tocados
- `frontend/js/nb-shared.js`:
  - Reescritura del HTML que produce `_insertImageFromFile`: ahora es `<span class="nb-img-chip" ...>🖼️ name</span>`.
  - `_openImageHD` ahora acepta tanto `<img>` (legacy) como `<span class="nb-img-chip">` (nuevo) — lee `src` del primero o `data-preview` del segundo.
  - `attachImageClickHandler` delega a `.nb-img-chip` además del legacy `img.nb-img`.
  - Nueva función `_migrateInlineImagesToChips(editor)`: parsea `img.nb-img`, construye chip equivalente, reemplaza en DOM, dispara `input` para autosave.
  - Nueva función `openImageMenu(sid, ns)`: recolecta chips + imgs legacy del editor, construye grid overlay con thumbnails y nombres, click → `_openImageHD`.
  - Botón nuevo `📂 Lista` en `toolbarHtml` que llama `openImageMenu`.
  - Exports añadidos en `window.NBShared`.
- `frontend/css/nb-shared.css`:
  - `.nb-content .nb-img-chip` — pill morado con hover lift (max-width 280px, ellipsis del nombre).
  - `.nb-img-chip-ic` y `.nb-img-chip-name`.
  - `.nb-rt-imglist` — estilo morado para el botón 📂 Lista.
  - Estilo legacy `.nb-img` conservado por compatibilidad (cae a chip vía migración automática).

### Reach colateral
Como el cambio vive en `nb-shared.js`, **automáticamente afecta también a 10-SYS Sistemas y 14-WORK Simetrik**. Todos los cuadernos del sistema ahora muestran imágenes como chips. Apertura de cualquier cuaderno con imágenes legacy las migra silenciosamente en el primer render.

### Verificación manual
- [ ] Abrir un cuaderno con imágenes pre-existentes (P4-P7) → las imágenes se muestran como chips automáticamente.
- [ ] Insertar nueva imagen via 🖼️ Imagen → aparece chip 🖼️ filename en vez de imagen grande.
- [ ] Click en chip → overlay HD con la imagen en máxima calidad.
- [ ] Botón 📂 Lista → grid de thumbnails de todas las imágenes de la página → click una → HD overlay.
- [ ] Eliminar imagen desde overlay → 🗑 → chip se borra del editor + blob IDB liberado.
- [ ] Paste de imagen (Ctrl+V) → chip compacto.
- [ ] 10-SYS y 14-WORK también muestran chips ahora (migración automática).

---

## 2026-06-11 · PLATAFORMA · Overhaul del motor de sync (post-mortem pérdida de datos)

**Incidente:** trabajo del día en el PC laboral (transcripción + imágenes en cuaderno Ingesta) se perdió al sincronizar. Causa raíz triple: (1) LWW por key completa en _reconcileKey/realtime/forceResync — un device "gana todo" y pisa páginas no subidas del otro; (2) _commitNow re-sellaba page.updated sin cambios reales (abrir una página envenenaba el merge — la versión vieja ganó por 30s); (3) uploads de imágenes a Storage solo al pegar, sin retry (deslogueado → nunca suben); (4) cloud-sync.js sin cache-bust en 17 páginas → motores viejos cacheados en los devices.

**Fix desplegado y VERIFICADO en producción (commit 0930338):**
- **Merge estructural por página** para los 6 keys de cuadernos (work/not/sys × meta/data) en los 3 caminos del motor (_reconcileKey, handleRealtimeChange, forceResyncFromCloud). Por página gana `updated` más reciente; empate gana cloud; lo que existe en un solo lado SE CONSERVA. Si el merge aporta algo que la nube no tiene → push (converge sin loops). Ni siquiera el force pull pisa páginas.
- **Guard anti-resellado** en _commitNow × 3 (work.js, notes-nb.js, systems_logic.js): sin cambios reales → no re-stamp.
- **Cola de retry de uploads** (nb-shared.js, `nb_pending_uploads` local-only): si el upload a Storage falla (deslogueado/offline) se encola y reintenta en sb:signed_in y al cargar.
- **Cache-bust global**: cloud-sync.js?v=p2 en las 19 páginas; nb-shared/notes-nb/systems_logic → p18; work.js → p26.

Verificación live: logs muestran `reconcile MERGE→both: sys_notebook` y `MERGE (cloud ya completo): work_nb_data` sin errores; realtime suscrito.

**Recuperación pendiente del incidente:** imágenes de hoy en IndexedDB del PC laboral (script de export listo); transcripción la rehace el usuario (fuente disponible).

---

## 2026-06-16 · PLATAFORMA · Pase de seguridad #1 (handoff de control)

**Contexto:** Miguel delega la dirección técnica y pide priorizar seguridad ("que no nos hackeen") antes de darle alas al Copilot de Simetrik. Decisión de arranque: **seguridad primero**.

**Auditoría (leída del código, no de memoria):**
- ✅ Anon key pública por diseño ([supabase-client.js:9](frontend/js/supabase-client.js)) — segura SOLO si RLS está activo.
- ✅ **RLS VERIFICADO LIMPIO (2026-06-16, vía SQL en dashboard).** Las 5 tablas (`app_state, vacancies, sys_tasks, class_sessions, user_prefs`) con `rls_enabled=true`. SELECT/UPDATE/DELETE con `USING (auth.uid()=user_id)`; INSERT con `WITH CHECK (auth.uid()=user_id)`; bucket `attachments` privado. Conclusión: un extraño logueado queda 100% aislado — no lee, edita, borra NI inyecta filas ajenas. Signup abierto ([auth.js:38](frontend/js/auth.js)) es seguro porque RLS aísla cada cuenta. Script de auditoría reusable: `SUPABASE_RLS_AUDIT.sql`.
- ✅ **Superficie XSS — pase #1 cerrado en los sinks de datos EXTERNOS.** Reframe del modelo de amenaza: RLS impide inyección cross-user → el innerHTML de datos del PROPIO usuario es self-XSS (riesgo bajo). El riesgo real = feeds RSS / APIs públicas renderizados sin escapar. Corregido:
  - **core.js** (dashboard 1-IND): `renderJobs` (RemoteOK API) y `renderNews` (KDNuggets RSS) inyectaban `title/company/tags/link` crudos. Agregados `escHtml` + `safeUrl` (solo http(s); bloquea javascript:/data:); aplicados a todos los campos externos.
  - **news.html** (7-NEW · RSS en vivo vía rss2json): `title/desc` ya se escapaban al ingerir; quedaban abiertos `link` (href + onclick JS-string) e `img` (breakout del atributo `src`). Agregados `escAttr` + `safeUrl`; `renderList` y `renderSaved` escapan por contexto (href, src→fallback SVG si no es http, onclick JS-string con `\`/`'`/`"`).
  - Verificación: 10/10 tests de escape contra payloads (javascript:, breakout de href/src/onclick, `<img onerror>`) en Node. `node --check core.js` OK.
  - Pendiente pase #2 (opcional, baja prioridad): sinks self-XSS de datos propios en otros módulos.

**Fix desplegado (este commit):**
- **Bug de flush en cierre de pestaña** ([cloud-sync.js:811](frontend/js/cloud-sync.js)): usaba `SB.auth.session()` (API v1, undefined en supabase-js v2) → el beacon de `beforeunload` mandaba el anon key como Bearer → RLS lo rechazaba → guardados al cerrar tab se perdían en silencio. **Fix:** cache de `_accessToken` vía `SB.auth.getSession()` + `onAuthStateChange` (v2, autoRefresh lo mantiene fresco); el flush ahora lee el token cacheado de forma síncrona.
- **Cache-bust:** cloud-sync.js?v=p4 → **p5** en las 19 páginas (sin esto los devices siguen con el sync roto cacheado).
- Verificación: `node --check js/cloud-sync.js` OK. El flush solo se ejercita con sesión real + cierre de tab + RLS (no observable en preview simple).

**Next step:** Seguridad cerrada (RLS verificado ✅ + flush fix ✅ + XSS sinks externos ✅). Próximo foco = **Copilot de trabajo** (prioridad de ingresos). BLOQUEADO por evidencia: el material del proyecto actual no existe en el repo — falta material del usuario (transcripción / PDF / capturas / texto) para construir el tutor sin violar anti-hallucination.

---

## 2026-06-16 · PLATAFORMA · Resiliencia de sync (cross-device) + UX de carga sin DevTools

**Reporte del usuario:** "cuadernos, prompts, etc. no actualizan bien o tardan" — quiere ver todo desde cualquier PC. Diagnóstico: los writes suben en ~1.5s, pero la propagación a OTRO device dependía de (1) realtime *si está habilitado*, (2) poll de respaldo 60s que **solo cubría cuadernos** (NB_DATA/META), (3) resync al reenfocar pestaña (>30s). Por eso prompts/notas en una pestaña abierta no bajaban hasta reenfocar/recargar, y cuadernos tardaban.

**Fix 1 — código ([cloud-sync.js](frontend/js/cloud-sync.js), poll de respaldo):** el intervalo ahora hace `_pullAllStates()` y reconcilia **TODAS** las keys sincronizables (registry + dynamic prefixes), no solo cuadernos. Intervalo 60s → **45s**. `_reconcileKey` ya hace merge estructural (cuadernos) y LWW (resto), así que correrlo en loop es seguro (solo escribe si la nube trae algo más nuevo). Resultado: todo converge ≤45s cross-device aunque realtime esté caído.

**Fix 2 — realtime (SQL del usuario, vía instantánea):** entregado para verificar/habilitar `app_state` en la publicación `supabase_realtime` (`alter publication supabase_realtime add table app_state;`). Si no estaba, ese era el motivo del "tarda". Tras habilitar → recargar en cada device para re-suscribir.

**Fix 3 — UX carga de casos sin DevTools ([work.js](frontend/js/work.js)):** `implImport()` + textarea en empty-state y footer del panel Implementación → pegás el JSON del caso y "Cargar" (tolera el wrapper `WORK.injectImplCase(...)`). `implIngestPrompt` ahora es **project-aware + incremental**: lleva el `id`/nombre del proyecto activo + su JSON actual, así Claude crece el caso sobre lo existente sin pisarlo ni perder el status de tareas.

**Cache-bust:** cloud-sync p6 → **p7** (19 páginas) · work.js p27 → **p28** (work.html).
**Verificado en preview:** flujo de import (empty-state → pegar JSON → render del caso) OK, 0 errores. `node --check` OK en ambos.

**Next step:** (1) Miguel habilita realtime con el SQL + recarga. (2) Carga del proyecto actual por el import box (JSON estricto entregado). (3) Pendiente: auditar/limpiar cerebro público; profundizar Operation Center.

---

## 2026-06-17 · PLATAFORMA · BUGFIX crítico — el sync borraba lo que se escribía en cuadernos

**Reporte (bloqueante):** al escribir en un cuaderno, un cambio entrante de nube (realtime/poll) re-renderizaba el editor y **borraba lo tipeado**, + avisos repetitivos "cambió desde otro PC" / "sincronizado o no". No podía trabajar.

**Causa raíz:** los handlers de `cloud:realtime_change` y `cloud:auto_resynced` en [work.js](frontend/js/work.js) llamaban `WorkNB.render()` SIN chequear si el usuario estaba editando → reconstruían el `contenteditable` y perdían las teclas desde el último autosave (500ms). Además realtime **re-emitía el eco del propio cambio** como si fuera remoto, y mostraba un toast en cada uno.

**Fix:**
- **Guard de edición ([work.js](frontend/js/work.js)):** `_nbEditing()` (activeElement contenteditable/input/textarea) + `_renderNbSafe()`. Si estás editando, NO se re-renderiza; el cambio entra silencioso a localStorage (sin tocar el DOM) y el render se difiere a `focusout` (+700ms, tras el autosave). `_commitNow` ya lee localStorage fresco, así que NO se pierde nada (ni lo tuyo ni las páginas remotas). Aplicado a ambos handlers.
- **Toast eliminado:** se quitó `_syncToast('⟲ Cambio recibido desde otro PC…')`. El sync ahora es silencioso.
- **Anti-eco ([cloud-sync.js](frontend/js/cloud-sync.js) `handleRealtimeChange`):** si el merge (cuadernos) o el payload (resto) es idéntico al local actual → NO reescribe, NO re-emite el evento. Mata el loop de "cambió desde otro PC" provocado por el propio push.
- **Badge de cola menos ruidoso ([work.html](frontend/work.html)):** "⏳ N cambios sin subir" solo aparece si el sync se atrasa >4s (backlog real), no en el ciclo normal de 1.5s. Oculta al instante cuando sube.
- **Cache-bust:** work.js p29 → **p30** · cloud-sync p7 → **p8** (19 páginas).

**Verificado en preview:** espía sobre `WorkNB.render` → **mientras un campo está enfocado: 0 re-renders** (no se borra); **al soltar foco: 1 re-render** (el sync sí aplica). 0 errores de consola. `node --check` OK en ambos.

**Next step:** Miguel prueba escribir en un cuaderno con otra pestaña/PC abierta y confirma que ya no se borra ni aparecen avisos. Luego retomar: cargar el proyecto actual, limpieza del módulo, auditar cerebro público.

---

## 2026-06-17 · 13-NOT + 10-SYS · Sync en vivo de cuadernos con guard de edición (extiende el fix)

**Contexto:** se extendió la protección del bugfix de 14-WORK a los otros dos motores de cuadernos. Descubierto: `notes.js` está MUERTO (no se carga en notes.html); el motor vivo de 13-NOT es `notes-nb.js` (NotNB) + `notes-brain.js`. 10-SYS usa `frontend/systems_logic.js` (SYS + submódulo NB). **Ninguno re-renderizaba con eventos de nube** → sus cuadernos no actualizaban en vivo con la pestaña abierta (solo al recargar/navegar). No tenían el bug de borrado (no re-render), pero tampoco sync en vivo.

**Implementado (mismo patrón guardado que 14-WORK):**
- **[notes-nb.js](frontend/js/notes-nb.js)** (13-NOT): IIFE al final con `_editing()` guard + `_safe()` (llama `NotNB.render`) + render diferido en `focusout`. Listeners: `cloud:realtime_change` (keys `not_nb*`), `cloud:auto_resynced`, `cloud:sync_complete`. notes-nb.js?v=p18 → **p19** (notes.html).
- **[systems_logic.js](frontend/systems_logic.js)** (10-SYS): IIFE al final con guard + `_safe()` (llama `SYS.render`) + diferido. Listeners: `cloud:realtime_change` (keys `sys_*`), `cloud:auto_resynced`, `cloud:sync_complete`. systems_logic.js?v=p18 → **p19** (systems.html).

**Verificado en preview (espía de render):** 13-NOT (`NotNB.render`) y 10-SYS (`SYS.render`) → **editando: 0 re-renders · idle: 1 re-render**. 0 errores de consola. `node --check` OK en ambos. Resultado: los 3 módulos de cuadernos (14-WORK, 13-NOT, 10-SYS) ahora sincronizan en vivo cross-device SIN borrar lo que se escribe ni mostrar avisos.

**Next step:** Miguel confirma en los 3 módulos. Retomar: cargar el proyecto actual, limpieza del módulo 14-WORK, auditar cerebro público.

---

## 2026-06-19 · PLATAFORMA · ROOT-CAUSE del "14 cambios sin subir" (timestamp poisoning)

**Diagnóstico EN VIVO (Chrome MCP sobre la sesión real de Miguel):** sesión válida, realtime ✓ suscrito, outbox se vaciaba al cargar — PERO cada carga disparaba un cascade `reconcile local→cloud` de ~14 keys (sb_goals, sb_prompts, sb_notes2, work_nb_meta, e4, ruta5, …). Eso era el "14 cambios". Timestamps reales confirmaron: `work_nb_meta` localTS = ahora pero cloud = ayer, **contenido idéntico** → el motor creía local más nuevo y re-subía.

**Causa raíz (en `_reconcileKey`, [cloud-sync.js](frontend/js/cloud-sync.js)):**
1. Rama de merge de cuadernos: sellaba `_setLocalTs(Date.now())` SIEMPRE (incluso cuando merged===cloud, o sea nada nuevo) → el TS local quedaba perpetuamente "ahora" mientras la nube seguía vieja → re-push eterno.
2. Rama LWW `local→cloud`: tras `pushState` NO actualizaba el TS local → "local siempre más nuevo".
3. `_flushQueue` (retry de cola): el `state_upsert` pusheaba OK pero no hacía `_outboxRemove` → contador fantasma "N sin subir".

**Fix (4 cambios, solo bookkeeping de timestamps — cero cambio de datos):**
- Merge de cuadernos: solo `_setLocalTs(Date.now())` cuando realmente se pushea algo nuevo; si local y nube ya son equivalentes → `_setLocalTs(cloud.updated_at)` (alinea, no envenena). Solo `_safeWrite` si cambió vs local.
- LWW `local→cloud`: `_setLocalTs(Date.now())` tras el push.
- `_flushQueue` state_upsert: al confirmar → `_setLocalTs` + `_outboxRemove`.
- **Auto-recuperación del outbox sin botón:** nuevo `setInterval(20s)` que reintenta `_flushOutbox()` si quedó algo pendiente (con pestaña visible + sesión lista).
- Cache-bust cloud-sync p8 → **p9** (19 páginas).

**Resultado esperado:** tras deploy + 1 refresh, el cascade converge y NO reaparece; sync 100% automático (realtime + poll 45s + outbox-retry 20s), sin necesidad del botón "Sincronizar todo".

**Next step:** verificar en la sesión real de Miguel (Chrome MCP) que el cascade desaparece tras cargar p9; confirmar que sus cuadernos reflejan cross-device.

### Actualización (mismo día) · p9 NO bastó → p10 RESUELVE (verificado live)
La verificación en la sesión real (Chrome MCP) mostró que **p9 seguía con el cascade de 46 keys en cada carga/poll**. Root cause real: la rama "local más nuevo" decidía por TIMESTAMP, y como el push deja el TS local unos ms por encima del cloud, en la carga siguiente local se veía "más nuevo" otra vez → re-subía las 46 aunque el contenido fuera idéntico.

**Fix p10 ([cloud-sync.js](frontend/js/cloud-sync.js) `_reconcileKey`, rama LWW local→cloud):** comparar el CONTENIDO normalizado (`JSON.stringify(_safeParse(localRaw)) === JSON.stringify(cloud.payload)`). Si es idéntico → NO subir, solo `_setLocalTs(cloudTs)` (cero red). Solo se sube cuando el contenido realmente difiere. cloud-sync p9 → **p10**.

**VERIFICADO EN VIVO (Chrome MCP, sesión real de Miguel, work.html p10):** `fullSyncAll START → pullAllStates OK: 52 keys → DONE (3410ms)`; únicos reconciles = los 6 cuadernos en "cloud ya completo" (solo alinean, sin push); **`reconcile local→cloud` = 0** (antes 46/carga); outbox=0, queue=0. El "14 cambios sin subir" quedó eliminado en la raíz. Sync 100% automático: realtime ✓ + poll 45s + outbox-retry 20s. Sin botón.

**Pendiente menor (cosmético, NO bloqueante):** `work_nb_meta` muestra TS local adelantado SOLO en la página work.html (WorkNB re-sella al render) — pero cae en "cloud ya completo" (no sube, no genera pendientes). Revisar si molesta.

**Acción para Miguel:** hard-refresh (Ctrl+Shift+R) en su PC del trabajo UNA vez para tomar p10. Después, automático y sin el botón.

---

## 2026-06-19 · PLATAFORMA · Rendimiento: poll/resync livianos (p11) + imágenes fuera del body (nb-shared p19)

**Diagnóstico en vivo (Chrome MCP):** `work_nb_data` = **2.1 MB** (un cuaderno solo 1 MB) porque cada imagen pegada metía un `data-preview` de 1280px (~180KB) **inline en `page.body`**. El poll de 45s + el resync al volver a la pestaña re-descargaban esos 2 MB → app trabada.

**Fix A — sync liviano ([cloud-sync.js](frontend/js/cloud-sync.js), p10→p11):** `_lightPull()` trae solo `store_key+updated_at` (bytes) y descarga payload SOLO de lo que cambió. Usado por el poll 45s y por el resync de visibilitychange (antes hacía `fullSyncAll` = 2 MB en cada cambio de pestaña). **Deployado y vivo.**

**Fix B — imágenes en almacenamiento separado ([nb-shared.js](frontend/js/nb-shared.js), p18→p19):** patrón "código público, datos privados, body liviano".
- **Pegar imagen** (`_insertImageFromFile`): HD única → IDB (local) + Supabase Storage (bucket `attachments`, cola de reintento). El chip del body YA NO lleva `data-preview` (se eliminó el preview inline de ~180KB). El body queda en bytes.
- **Abrir HD** (`_openImageHD`): IDB → si miss (otro device) baja de Storage (`cloudDownloadAttachment`) y cachea en IDB. Fallback legacy: `data-preview` (imágenes sin migrar).
- **Migración MANUAL** (`NBShared.optimizeImages(dataKey)` + botón "🗜️ Optimizar imágenes" en opciones de sync de work.html): mueve la HD de los chips legacy con `data-preview` a Storage y quita el preview del body por **string exacto** (no re-serializa el body). FAIL-SAFE: solo quita el preview si el upload a Storage dio `ok`; si quedó en cola (offline) lo conserva. IDEMPOTENTE.

**Por qué no falla:** el chip es solo referencia (ícono+nombre), nunca dependió de mostrar la imagen inline; la HD tiene 2 copias (IDB origin + Storage) con reintento; nada se borra del body hasta confirmar el upload. Resultado esperado: `work_nb_data` 2.1 MB → ~KB.

**Next step:** verificar EN VIVO (Chrome MCP, sesión real) el viaje a Storage de una imagen nueva, y correr `optimizeImages('work_nb_data')` mirando que libere espacio y que las imágenes sigan abriendo. Pendiente: botón equivalente en 13-NOT/10-SYS (la función ya es genérica).
