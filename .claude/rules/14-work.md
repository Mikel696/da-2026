---
paths:
  - "frontend/work.html"
  - "frontend/js/work.js"
  - "frontend/css/work.css"
---

<!-- Se carga solo cuando Claude lee, escribe o edita un archivo de `paths`. Extraído de CLAUDE.md el 12-nov-2026; el contenido no cambió. -->

## 💼 PROTOCOLO 14-WORK · TRABAJO (cascarón público desde 2026-10-28)

Módulo del trabajo de Miguel (Reconciliations Analyst en Simetrik). Se rehace como **Coach de trabajo**:
implementación de proyectos y optimización de procesos con IA. El plan está **fuera del repo**
(`E:\CLAUDE\PROYECTOS\PLAN-14-WORK.md`, privado), igual que la lista de nombres a vigilar.


### Lo que queda en el sitio
| Archivo | Qué hace |
|---|---|
| `frontend/work.html` | Cascarón: aviso, **Mapa del rol** con **rutas de estudio**, conteo de registros privados, cuadernos |
| `frontend/js/work.js` | Solo `WorkNB` (editor de cuadernos sobre `nb-shared.js`) + `WorkShell` (cuenta registros, solo lee) |
| `frontend/js/work-rol.js` | `WorkRol` (24-nov): pinta el mapa del rol. **Solo lee** `data/rol-objetivo.json` y `data/jobs-feed.json`; no escribe en localStorage; sin red usa Cache Storage `work-datos` y lo dice |
| `frontend/data/rol-objetivo.json` | Muestra fechada (24-nov-2026): 39 vacantes de LinkedIn (Colombia, último mes), 25 habilidades contadas en sus descripciones, estado «en tu perfil» según `YA_TIENE` de `scripts/fetch-jobs.mjs`. Solo datos públicos de vacantes. Se regenera con una muestra nueva (no la toca la foto diaria) |
| `frontend/js/work-rutas.js` | `WorkRutas` (24-nov): rutas de estudio. Lee `data/rutas.json`; escribe **solo** `work_rutas` y, al pulsar «Empezar», el cuaderno de la ruta vía `WorkNB.ensureNotebook` (id `work_nb_ruta_<ruta>`, páginas con id numérico fijo 8e15 + FNV-1a del paso) |
| `frontend/js/work-ruta-vista.js` | `WorkRutaVista` (25-nov): **solo pinta** la ruta abierta en formato didáctico (frase, usos, mapa de estaciones y la estación elegida en 4 bloques). WorkRol la llama si la ruta trae `frase`; los clics (estación, tarea, escuchar, copiar) los atiende WorkRol |
| `frontend/data/rutas.json` | 25 rutas (una por habilidad del mapa), 108 pasos (estaciones), 51 videos. Formato didáctico obligatorio: ruta con `disciplina`, `frase`, 3 `usos`, `portafolio`; estación con `logro`, `idea`, `mira`, `hazlo`, `comprueba`, `errores` (+ `hoja`, `codigo`). El verificador **ejecuta** cada programa Python/SQL contra su `comprueba.salida` (o `patron`). «mira» solo dice lo que muestran el título o los capítulos publicados del video: nadie los vio completos. Comprobar con `node scripts/verificar-rutas.mjs` antes de publicar: cada habilidad del mapa con ruta, ids, enlaces con 200, cada video con oEmbed de YouTube (título y canal exactos), al menos un video por ruta, «gratis» solo donde la fuente lo dice. Los videos se eligieron por canal, vistas y español; nadie los vio completos |
| `frontend/js/work-juego.js` | `WorkJuego` (24-nov): panel de juego sobre el mapa — constelación de las 25 habilidades (posiciones y 31 conexiones fijas, criterio de diseño), nivel y XP (10 por paso, nivel cada 100), 6 logros e historia de XP por día. **Solo lee** (`WorkRutas.registros()`); WorkRol lo repinta y le presta `abrir(id)` |
| `frontend/css/work.css` | Estilos · acento cyan `#06b6d4` · bloques `.rol-*` (mapa), `.ruta-*` (rutas) y `.j-*` (juego). Colores de estado de datos validados con el validador de dataviz para fondo oscuro: perfil `#0aa2c0`, no figura `#bd860b`, en progreso `#8f6cf2` |

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
