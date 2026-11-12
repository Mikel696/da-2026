---
paths:
  - "frontend/systems.html"
  - "frontend/systems_logic.js"
  - "frontend/css/systems-modulos.css"
  - "frontend/data/academic-*.json"
  - "PROMPT_10-SYS_SEMANA.md"
---

<!-- Se carga solo cuando Claude lee, escribe o edita un archivo de `paths`. Extraído de CLAUDE.md el 12-nov-2026; el contenido no cambió. -->

## 🎓 PROTOCOLO 10-SYS · ECOSISTEMA CUN

### Ecosistema CUN (4 plataformas):
| Plataforma | URL | Qué contiene |
|---|---|---|
| **CUN Digital (Moodle)** | cdigital.cun.edu.co | Aulas virtuales, tareas, materiales, calificaciones por actividad |
| **SGA Campus (SINU)** | sigwt.cun.edu.co/sgacampus | Notas oficiales, programas activos |
| **CUN 360** | 360.cunapp.pro | Historial completo, GPA, deuda, materias virtuales con docentes |
| **Gmail CUN** | mail.google.com | Comunicaciones oficiales, alertas |

### Datos académicos verificados (período 26V05 · 9no semestre · leídos de CDigital 2026-09-29):
- **Bloque I:** 28 Sep — 22 Nov 2026 (plan semanal en `BLOCK_PLANS['26V05']`, de la imagen
  "Calendario académico virtual" del aula 55500). Bloque único: Trabajo de Investigación → 19-ene-2027.
- DIS38 Inteligencia de Negocios · 55500 · FELIPE ALEXANDER GARZON · Mié 6:15-8:30 PM · cdigital_id 126973
- DIS39 Auditoría de Sistemas · 55506 · ANDRES FELIPE CORREA ESPITIA · jue 6:15-7:45 PM (Calendar) · 126979
- DIS40 Computación en la Nube · 55516 · MARIO ALEXANDER REALES MARTINEZ · jue 6:15-7:45 PM + tutoría vie 6:15-7:15 · 126989
- ISD37 Trabajo de Investigación en Ingeniería · 55520 · MANUEL ALBERTO SALGADO ALBA · 126584 · **16 semanas, actividades finales hasta el 10-ene-2027 (correo del docente, 4-nov-2026)**, mié 6:15-7:45 PM; regla: no resolver nada en la plataforma sin sus instrucciones (todo va en su PDF "Clases ... P0"). **Caso aparte:** da las instrucciones de cada corte en clase, en ese PDF y por **mensaje de CDigital** (no por correo) — revisar las tres fuentes en cada parte
- A1I01 Virtual English Beginner 1 · 50610 (26I05) · ANYI MILENA ALVAREZ COGOLLO · L-V 6:15-7:45 PM · 130590
- Se excluye a propósito "INDUCCION TICS - ESTUDIANTES" (28494).
- 26V02 (8vo) quedó en 🗂 Historial: 6 ganadas, English 50608 y Placement en "pausada".

**Cómo se registra un período nuevo** (prompt 5 del CUN Hub): cada materia en `SUBJECTS` con
`period`, `code`, `group`, `cdigital_id`, `professor` (Participantes → rol Profesor), `clases`
`[{dias:[1..7], ini, fin}]` + `schedule` + `subject_links.clase` (Próximos eventos / Meet),
`cronograma` y `esquema: 'cun_b8'` si sigue el calendario de 8 semanas. Añadir `BLOCK_PLANS[período]`.
`detectPeriod()` toma el período más reciente de las materias "en curso": no hay que tocar nada más.
Los quizzes están **ocultos** hasta que abren → su fecha es el cierre de la semana del calendario.
Sin fecha publicada: o se deja vacía, o se estima con método explícito y `est: true` (se pinta "≈ estimada"). Nunca una estimada sin marca.
Las evaluaciones de CDigital se desbloquean por **requisito** (Acuerdo → Eval. docente N → Quiz/Parcial), no por fecha: esos pasos van en el cronograma.
**`_mergeSubj()`**: el override de `subjects_custom` se mezcla por id de entrega con el código; no volver a `{...base, ...override}` (tapaba fechas nuevas).

**Notas:** `sys_subjects_custom[].notas` (claves `q1 p1 q2 p2 aca q3 co au` + `meta`), cargables con
`SYS.setNota(id, clave, valor)` en la pestaña real del live site.

**📡 Semana en vivo (Dashboard, desde 18-oct-2026):** parte semanal de Claude. Protocolo completo en
`PROMPT_10-SYS_SEMANA.md`. El parte se inyecta con `SYS.injectWeek({...})` en la pestaña real del live site →
`sys_week_live` (Supabase, **nunca en el repo público**: lleva citas de clase y notas). Los checks de Miguel van en
`sys_week_state`, aparte, para que un parte nuevo no los pise. Cada actividad lleva `mode`: `tu` (trámites,
formularios, evaluaciones) · `prep` (Claude prepara guía y simulacro; **Miguel presenta**) · `juntos` (ACA:
Claude investiga y redacta el borrador, Miguel revisa y entrega) · `claude`. **Claude no presenta quizzes,
parciales ni exámenes por Miguel.** Moodle CUN admite una sola sesión: trabajar en la misma pestaña que Miguel.
El Dashboard entero lee de ahí: la tarjeta de arriba muestra "Lo siguiente" (3 pasos pendientes de la `route`) y
la barra de números cuenta pendientes/P0/hechas del parte. Un ítem con `crono: 'materia:entrada'` comparte el
check con el cronograma (`wlToggle` ↔ `toggleCronoEntry`); `SYS.setCrono(refs, {done|date})` sincroniza.
**El override de una materia guarda solo `cronograma`** (`_setCronoSilent`): guardar la materia entera congelaba
desc, enlaces y horarios del código en `sys_subjects_custom`.

**🧱 Módulos por materia y 🎯 ACAs (desde 4-nov-2026):** Dashboard y Materias abren con una rejilla 2×3 de bloques
(5 materias + ACAs); cada bloque despliega todo lo de su materia por prioridad (`renderTiles`, `_subjFeed`). Las listas
largas quedan plegadas ("Ver el parte completo", "Ponte al día", "Fichas completas"). Las ACAs viven en `semana.acas`
(contrato en `PROMPT_10-SYS_SEMANA.md` → Esquema) y se actualizan sin reinyectar con `SYS.setAca(id, patch)` /
`SYS.getAcas()`; los checks van en `sys_week_state` (`aca:<id>`, `aca:<id>:<paso>`). `showTab(n)` va por número de
panel (`pnlN` / `data-tab`), no por posición: ACAs es `showTab(8)` aunque sale 3.ª en el menú.

**Grabaciones de clase (verificado 8-oct-2026):** el evento de Calendar CUN (`/calendar/u/3/`) adjunta Recording + Chat + Transcript. El Transcript (Doc) da 403; el Recording se transcribe desde `drive.google.com` con `get_video_info?docid=ID&drive_originator_app=303` → `ttsurl` → pista `asr` `fmt=json3`, sin abrir el panel de Drive. Detalle en CEREBRO_STATE 2026-10-08.

### Tab 7 · Clases Perdidas (Missed Classes Analyzer) — DIRECT-FETCH PROTOCOL v2

Feature operativa para cuando el usuario pierde una clase. Hay **dos modos** para alimentar el store `sys_class_sessions`:

**Modo A — Direct Fetch autónomo (preferido cuando estoy disponible vía Chrome MCP):**
1. El usuario me pega la URL del video grabado de Google Drive en el chat (no necesita usar la UI del Tab 7).
2. Prerrequisito del usuario: tener abierta en su Chrome (la misma ventana donde corre la extensión Claude/Chrome MCP) una pestaña con el video y el panel lateral de **Transcripción** activado (⋮ → Transcripción). Drive solo expone el transcript en el DOM cuando ese panel está visible.
3. Yo hago `tabs_context_mcp` → identifico la pestaña ya abierta del video (NO navego a Drive con `navigate` — fallaría con 401 o pediría login). Reuso la sesión autenticada del usuario.
4. Yo hago `javascript_tool` → extraigo el `innerText` del panel `[role="complementary"]` con `aria-label*="ranscripci"`, filtro las etiquetas de UI ("Copiar enlace en esta transcripción", "Cerrar hoja lateral", "Transcripción") y lo guardo en `window.__transcript`.
5. Pre-proceso EN LA PÁGINA (no en mi contexto) — parseo a `[timestamp, texto]`, filtro por keywords (`tarea|entrega|parcial|examen|quiz|fecha|plazo|abril|mayo|cdigital|drive|http|recuerden|no olviden|para el|hasta el`) y me devuelvo solo los excerpts relevantes + los últimos ~25 segmentos (donde están los anuncios de cierre). **Esto es clave**: 100K+ caracteres de transcript reventarían mi context window — el filtrado se hace en el browser y solo regresan los hits.
6. Genero el informe estructurado **solo con datos verbatim** (cada tarea cita la frase del profesor + timestamp como evidencia).
7. **Ejecuto `SYS.injectClassSession({ ... })` directamente en la pestaña REAL del usuario en `https://mikel696.github.io/da-2026/frontend/systems.html`**, NO en localhost ni en preview. Esa es la única vía para que llegue al Supabase del usuario y aparezca en sus otros devices. El proxy `cloud-sync.js` intercepta el `setItem` y dispara `CLOUD.push('class_sessions', ...)` automáticamente.
8. Verifico visualmente: `showTab(7)` → screenshot → confirmo que la tarjeta aparece en "Sesiones guardadas".

**Modo B — Prompt portable (fallback cuando no tengo Chrome MCP en esta sesión):**
1. Usuario pega la URL en `#classUrl` + selecciona materia en `#classSubjSel`.
2. Click "📋 Copiar Prompt para Claude" → `systems_logic.js` genera el prompt actualizado (que incluye el prerrequisito del panel de transcripción y el SOP completo de Chrome MCP).
3. El usuario pega ese prompt en otra sesión de Claude (Desktop con Chrome MCP) → esa instancia ejecuta el Modo A.

### 🚨 Reglas anti-hallucinación de Tab 7
1. **Nunca extrapolar.** Si la transcripción está vacía o el panel no está visible, NO inventar — pedir al usuario que active el panel y reintentar.
2. **Nunca usar `curl`/`fetch` contra Drive** — falla con 401. Solo via la sesión autenticada del browser del usuario (Chrome MCP).
3. **Toda tarea detectada debe llevar timestamp + verbatim** del profesor en el campo de evidencia. Sin verbatim, no se inyecta.
4. **Inyectar siempre en la pestaña REAL del live site** (`mikel696.github.io/da-2026/frontend/systems.html`), nunca en localhost ni preview — el push a Supabase requiere la sesión autenticada del usuario.
5. **Una sesión por video.** Si el video ya tiene una sesión guardada (mismo `url` o `subject_id + date`), update en vez de duplicar.
