---
paths:
  - "frontend/work.html"
  - "frontend/js/work.js"
  - "frontend/css/work.css"
  - "frontend/js/work-*.js"
  - "frontend/data/rutas.json"
  - "scripts/verificar-rutas.mjs"
---

<!-- Se carga solo cuando Claude lee, escribe o edita un archivo de `paths`. Extraído de CLAUDE.md el 12-nov-2026; el contenido no cambió. -->

## 💼 PROTOCOLO 14-WORK · TRABAJO (cascarón público desde 2026-10-28)

Módulo del trabajo de Miguel (Reconciliations Analyst en Simetrik). Se rehace como **Coach de trabajo**:
implementación de proyectos y optimización de procesos con IA. El plan está **fuera del repo**
(`E:\CLAUDE\PROYECTOS\PLAN-14-WORK.md`, privado), igual que la lista de nombres a vigilar.


### Lo que queda en el sitio
| Archivo | Qué hace |
|---|---|
| `frontend/work.html` | Cascarón: aviso, **centro de mando** (cada habilidad abre su ruta dentro de su tarjeta), **Mapa del rol** (sin la lista «Lo que piden» desde el 25-nov), conteo de registros privados, cuadernos |
| `frontend/js/work.js` | Solo `WorkNB` (editor de cuadernos sobre `nb-shared.js`) + `WorkShell` (cuenta registros, solo lee) |
| `frontend/js/work-rol.js` | `WorkRol` (24-nov): pinta el mapa del rol. **Solo lee** `data/rol-objetivo.json` y `data/jobs-feed.json`; no escribe en localStorage; sin red usa Cache Storage `work-datos` y lo dice |
| `frontend/data/rol-objetivo.json` | Muestra fechada (24-nov-2026): 39 vacantes de LinkedIn (Colombia, último mes), 25 habilidades contadas en sus descripciones, estado «en tu perfil» según `YA_TIENE` de `scripts/fetch-jobs.mjs`. Solo datos públicos de vacantes. Se regenera con una muestra nueva (no la toca la foto diaria) |
| `frontend/js/work-rutas.js` | `WorkRutas` (24-nov): rutas de estudio. Lee `data/rutas.json`; escribe **solo** `work_rutas` y, al pulsar «Empezar», el cuaderno de la ruta vía `WorkNB.ensureNotebook` (id `work_nb_ruta_<ruta>`, páginas con id numérico fijo 8e15 + FNV-1a del paso) |
| `frontend/js/work-ruta-vista.js` | `WorkRutaVista` (25-nov): **solo pinta** la ruta abierta en formato didáctico (frase, usos, mapa de estaciones y la estación elegida en 4 bloques). WorkRol la llama si la ruta trae `frase`; los clics (estación, tarea, escuchar, copiar) los atiende WorkRol |
| `frontend/data/rutas.json` | 25 rutas (una por habilidad del mapa), 108 pasos (estaciones), 51 videos. Formato didáctico obligatorio: ruta con `disciplina`, `frase`, 3 `usos`, `portafolio`; estación con `logro`, `idea`, `mira`, `hazlo`, `comprueba`, `errores` (+ `hoja`, `codigo`). El verificador **ejecuta** cada programa Python/SQL contra su `comprueba.salida` (o `patron`). «mira» solo dice lo que muestran el título o los capítulos publicados del video: nadie los vio completos. Cada ruta trae `certificacion` (25-nov): `referencia` (del dueño de la herramienta o del estándar, no «la más pedida») o `referenciaNota`; `gratis` solo con `evidencia` = frase de la página oficial que el verificador abre y busca (o `comprobadoEnNavegador` con fecha si la página es de JavaScript); si no hay, `camino`. Un precio con cifra exige su frase. Raíz: `certificacionesNota` (40 de 955 vacantes del radar mencionan certificaciones). Comprobar con `node scripts/verificar-rutas.mjs` antes de publicar: cada habilidad del mapa con ruta, ids, enlaces con 200, cada video con oEmbed de YouTube (título y canal exactos), al menos un video por ruta, «gratis» solo donde la fuente lo dice. Los videos se eligieron por canal, vistas y español; nadie los vio completos. **Rutas por puntos (las que traen `medido`, 25-nov):** el verificador vuelve a medir cada video en YouTube (fecha igual, vistas y me gusta no por debajo de lo publicado, duración, cada capítulo citado en la descripción), exige `clasico` a lo de más de 24 meses y `razon` a lo descartado, y busca las frases del examen, de las credenciales y de cada curso gratis en su página |
| `frontend/js/work-ruta-puntos.js` | `WorkRutaPuntos` (25-nov): **solo pinta** la ruta «por puntos» (la que trae `medido`; hoy Python). Pedido de Miguel: ruta sólida, recursos al día, certificación arriba, qué aprender primero y cómo se combina; **aspecto de videojuego solo en la interfaz: nada de XP, misiones ni desafíos dentro de la ruta** («no quiero jugar en el módulo»). Orden: meta (certificación con `examen`: datos, temas con peso y punto, credenciales gratis) → camino de puntos con la bandera del examen → antes conviene / se pide junto con (calculado en vivo de las vacantes, con el total al lado) / te abre → el punto: video principal con fecha, vistas, me gusta, duración y capítulos que abren el video en su minuto; curso con lo que muestra su página; «Más opciones» y «Descartados y por qué»; la práctica de siempre. WorkRol la elige si la ruta trae `medido`; las otras siguen con `WorkRutaVista` |
| `frontend/js/work-juego.js` | `WorkJuego` (25-nov): **centro de mando** sobre el mapa (reemplaza la constelación rechazada del 24-nov): rango y XP (10 por estación, nivel cada 100, 11 niveles), % de la temporada (`WorkRutas.global()`), mayor salto, 3 misiones (siguiente estación real; «Iniciar misión» → `WorkRol.abrir(id, paso)`), 6 disciplinas con sus 25 habilidades, 6 logros y actividad de 28 días (estaciones y tareas). **Solo lee** (`WorkRutas.registros()`); WorkRol lo repinta |
| `frontend/css/work.css` | Estilos · acento cyan `#06b6d4` · bloques `.rol-*` (mapa), `.ruta-*` y `.rv-*` (rutas) y `.cm-*` (centro de mando). Colores de estado de datos validados con el validador de dataviz para fondo oscuro: perfil `#0aa2c0`, no figura `#bd860b`, en progreso `#8f6cf2` |

### Rutas por puntos · cómo se rehace una habilidad (25-nov, muestra Python)
- **Hacia atrás desde la certificación:** si hay examen de referencia, los puntos siguen su temario oficial (Python:
  PCEP-30-03, temario revisado el 2-nov-2026) y después va lo que pide el rol. **Los ids de los puntos no cambian** (el
  avance de Miguel vive en `work_rutas` por id); `ensureNotebook` nunca reescribe un cuaderno que ya existe.
- **Recursos medidos en su página, con fecha de corte (`medido`):** de cada video `publicado`, `vistas`, `megusta`,
  `minutos` y `capitulos` [{inicio, fin, nombre}] copiados de la descripción; de cada curso `datos` con lo que muestra
  su página o «la página no las muestra». Un video principal o alternativo de más de 24 meses solo se queda con
  `clasico` (la razón). Lo viejo va a `descartados` con `razon`. **Sin superlativos que no se midieron** («el más
  visto» solo «de los que medimos», con la ventana): la contraparte del 25-nov cazó dos falsos.
- **Herramientas** (fuera del repo, carpeta de notas de la sesión del 25-nov): `buscar-yt.mjs` (búsqueda pública,
  `SP=EgIIBQ%3D%3D` = este año), `yt-medir.mjs` (yt-desc ampliado: fecha, vistas, me gusta, duración, capítulos; si
  oEmbed da 401 lee título y canal de la página), `python-v2.cjs` (arma la ruta), `simular-puntos.cjs` (27
  comprobaciones de la vista). La simulación vieja `simular-mando.cjs` quedó desactualizada desde `cea8d84`.
- **Lo que se comprueba a mano en su Chrome** (página que se arma en el navegador: Kaggle, NetAcad) lleva
  `comprobadoEnNavegador` con fecha; el verificador no lo vuelve a abrir.
- **El examen (`certificacion.examen`)**: `codigo`, `url` + `evidencia` (frases que el verificador busca), `otras`
  [{url, evidencia}] para datos de otra página (p. ej. el tiempo en la página del certificado), `datos` (casillas),
  `nota`, y `temarioUrl` + `temarioRevisado` si el temario es un PDF (Microsoft MOS). `temas` solo si calzan uno a uno
  con los puntos: peso exacto (`peso`) o el rango que publica Microsoft (`pesoRango: [25, 30]`); si el temario es de otra
  herramienta (AI-900 de Azure, AB-620 de Copilot Studio, PL-200), **no se fuerza el mapeo**: va en la `nota`.
- **Excel (25-nov):** la meta pasó de MO-210 a **MO-211 Excel Expert** porque su temario oficial (PDF) incluye tablas
  dinámicas, BUSCARX y macros, que es lo que enseña la ruta.
- **Clásicos:** un video de más de 24 meses va de principal o alternativa solo si en español no hay uno reciente con
  vistas (p. ej. funciones de ventana en SQL, el tutorial de datos.gov.co del Ministerio TIC); `clasico` dice por qué.
- **Bloque «Oficial y gratis»:** la vista muestra `certificacion.gratis` (10 rutas) con el punto donde se gana
  (`gratis.punto`).

### `work_rutas` · avance de las rutas (P0)
- Array de registros `{id, tipo:'ruta'|'paso'|'tarea', ruta, hecho?, empezada?, nb?, updated}`; ids `'<ruta>'`, `'<ruta>:<paso>'` y
  `'<ruta>:<paso>:<i>'` (tarea de «Hazlo», 25-nov: no cuenta para el % ni para el XP).
- En `SYNC_REGISTRY` y en `ARRAY_MERGE_KEYS` (`{id, ts:'updated'}`): dos equipos no se pisan; desmarcar = `hecho:false`
  con hora nueva (no borrar). Pruebas: `node scripts/prueba-sync-carrera.mjs` (escenarios «rutas ·»).
- El 24-nov la verificación en producción se deshizo y dejó lápidas de `python` y `python:python-1`: no estorban
  (escenario «empezar, borrar y volver a empezar»).

### Mapa del rol · cómo se rehace la muestra
- Se lee a mano en LinkedIn con la sesión de Miguel (el radar no puede leer LinkedIn): las 3 búsquedas de 5-JOB → pestaña
  LinkedIn → «Rol objetivo». Entra una vacante si el **título** es de implementación, automatización de procesos o IA en
  operaciones; fuera ingeniería de software, desarrollo, QA, ciencia de datos, diseño, ventas, marketing.
- Contar por descripción con reglas estrictas y **revisar el contexto de cada palabra ambigua antes de publicar**: el
  24-nov «requerimientos» suelto (en Colombia también es «solicitudes»), «casos de uso», «tareas manuales» y «capa
  transversal» inflaban 3 habilidades (la brecha n.º 1 pasó de 17 a 11 de 39).
- El mapa no escribe en el tablero de postulaciones de 5-JOB (es de Miguel): cuenta y enlaza. 5-JOB sigue siendo la única puerta de vacantes.

### Storage keys · siguen en SYNC_REGISTRY, no se pierden
`work_nb_meta, work_nb_data` (editables aquí) · `work_cases, work_errors, work_learnings, work_kb, work_impl,
work_eco_workflow, work_eco_course, work_eco_dict, work_kb_atts, work_moif_meetings, work_dota_progress`
(privados, sin pantalla hasta la Fase B). **No borrarlas ni sacarlas del registro:** qué hacer con esos datos
es una decisión aparte de Miguel (borrar es irreversible).

### Reglas vigentes
1. **No fabricar contenido del trabajo.** Sin evidencia de Miguel → campo vacío y se pide.
2. **No rompas el contrato de Cuadernos.** `work.js` consume `nb-shared.js`; cambios en `nb-shared.js`
   impactan también 10-SYS y 13-NOT.
3. **Autosave NB pattern:** `_commitNow + autoSave debounce + flush en blur/hide/unload`. Si tocás en
   `work.js`, replicá en `notes-nb.js` y `systems_logic.js`.
4. **El Coach (Fase B) arrancó con el mapa de vacantes reales** (B1 del plan privado, hecho el 24-nov-2026: Mapa del rol). Casos ficticios
   marcados como ficticios. Lo de herramientas de IA se enlaza al AI Dojo (17-IA), no se duplica.
