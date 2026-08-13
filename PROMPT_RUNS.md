# 🗂 PROMPT_RUNS · Execution Log for 8-PRO Prompt Lab

This file tracks every time a curated prompt (from 8-PRO tab 🧩 Módulos or 📚 Library) is executed by Claude Code.

## Why this exists
The user runs the same prompt multiple times across sessions. Without history:
- Claude redoes work already done.
- Improvements stack noisily instead of compounding.
- No memory of what was tried, what worked, what failed.

## How Claude uses this
**Before starting** any curated prompt, Claude:
1. Greps this file for the prompt ID (e.g. `ID:13-NOT.P1`).
2. Reads prior runs · understands what's been done · what's pending.
3. Picks an EXTENSION or NEW angle · never repeats.

**After completing**, Claude appends an entry (see template below).

## Entry template

```
### ID:<promptId> · <YYYY-MM-DD>
- Commit: <hash>
- Files: <list>
- Changed: <1-2 lines what was actually done>
- Next: <what to try in the next run · what to skip>
```

## Conventions
- Prompt IDs follow `{module-code}.{kind}` for module prompts (e.g. `12-FIN.P1`, `10-SYS.P3`) or `LIB.{slug}` for library prompts (e.g. `LIB.bug-hunt`, `LIB.sync-audit`).
- Append at the BOTTOM of the relevant section. Don't rewrite history.
- One commit = one entry (don't combine multiple runs).
- If a run produced no changes (was an audit), still log it with `Files: -` so the next run knows it was already audited.

---

## 📒 Module Prompts (16 × 3 = 48 prompts)

<!-- Append entries below for: 1-IND.P1, 1-IND.P2, 1-IND.P3, 2-APP.P1, ... 16-APA.P3 -->

### ID:2-APP.P3 · 2026-05-19
- Commit: b53c416
- Files: frontend/js/app-second-brain.js (NEW · 33K) · frontend/apply.html · frontend/js/cloud-sync.js
- Changed: Built the full 5-phase "Second Brain" layer for 2-APP. New `APP` IIFE namespace + `window.APP` CLI. 3 new tabs (Coach · Wiki · Canvas) + analysis history panel.
  - F1 · Foundation+CLI: `app_analyses` localStorage (registered in SYNC_REGISTRY) · auto-snapshot hook on runAnalysis() · history panel (last 20 · re-load) · `window.APP.{list,get,load,current,clear,exportAll,inbox,...}`.
  - F2 · Web Clipper: bookmarklet generator modal (`APP.showClipper()`) · captures JD from LinkedIn/Indeed/Computrabajo · `apply.html?clip=1` URL handler prefills form.
  - F3 · Outcome Coach: outcome editor modal (status/salary/notes per analysis) · local correlation engine (callback rate · skill lift · industry · word-count) · insights panel.
  - F4 · Job Market Wiki: concept aggregator (have/gap/tactical/powerWord/redFlag) · frequency-sorted chips · drill-down modal showing vacancies per concept.
  - F5 · Career Canvas: 6-column pipeline by outcome status · click node → outcome editor · cross-link count with 5-JOB `da_vacancies`.
- Next: P3 chosen idea was "all 5". For the NEXT 2-APP.P3 run — DO NOT rebuild these. Instead pick a NEW angle: e.g. (a) JSON Canvas export of the career graph to 15-MM · (b) Karpathy-style auto-clustering of the Wiki concepts into themes · (c) scheduled cron that re-scores stale analyses · (d) cross-device realtime for app_analyses. Verify the 5 phases still work before extending.

### ID:13-NOT.P3 · 2026-05-19
- Commit: 6e599d9
- Files: frontend/js/notes-brain.js (NEW · 33K) · frontend/notes.html (6 surgical edits)
- Changed: Built the full 5-phase "Second Brain" layer for 13-NOT. New `NOT` IIFE + `window.NOT` CLI. New tab 🗺️ Grafo. Notes go from flat list to connected knowledge base.
  - F1 · CLI+Daily: stable-`id` migration for sb_notes2 · daily note (`type:'daily'`) as quick-capture inbox · `window.NOT.{all,get,search,create,append,today,capture,link,backlinks,toFlashcard,graph,organize,...}`.
  - F2 · Wiki-links: `[[note title]]` syntax · clickable links · `[[`-autocomplete on #nBody · backlinks footer ("Mencionada en") per note card.
  - F3 · Notes→SRS: 🃏 Flashcard button per note (hover) → modal → adds card to eng_srs_deck (box 1, with sourceNoteId backlink).
  - F4 · Knowledge Graph: 🗺️ Grafo tab · radial SVG · nodes=notes, edges=wiki-links (solid) + shared tags (dashed) · color by tag · orphan detection · click node → jump to note.
  - F5 · Karpathy Organizer: 🧹 "Ordená mi cerebro" button · heuristic local analysis (near-dupes via Jaccard · tag suggestions via keywords · link suggestions via title mentions · orphans) with one-click apply · "Copy Karpathy prompt" for deep AI reorg.
- Next: For the NEXT 13-NOT.P3 run — DO NOT rebuild. New angles: (a) export the F4 graph to 15-MM as a real jsMind map · (b) realtime cross-device for the daily note · (c) auto-flashcard from selected text (not whole note) · (d) wire the deep-reorg prompt to actually run via a sub-agent. Verify the 5 phases still work first.

### ID:3-ENG.P3 · 2026-05-25
- Commit: 8da1088
- Files: frontend/data/tenses.json (NEW · 12 tiempos curados) · frontend/js/eng-tenses.js (NEW · ~290 líneas IIFE) · frontend/english.html (3 edits: tab + panel + script boot) · frontend/css/english.css (+~120 líneas bloque F1) · frontend/js/cloud-sync.js (eng_tense_progress añadido a SYNC_REGISTRY)
- Changed: F1 del rediseño "Second Brain" para 3-ENG. Fusión de las 5 ideas (Karpathy/Clipper/Canvas/CLI/Local-first) atacando el dolor real del usuario: "no sé los tiempos". Entregada **Tab ⏰ Tiempos** con grid 4×3 (Pasado/Presente/Futuro × Simple/Continuous/Perfect/Perfect Continuous). Cada celda abre modal de lección con: fórmulas (afirm/neg/pregunta), palabras señal, 3 ejemplos data-analyst con TTS, trampa hispana destacada, top de errores comunes y verbos irregulares clave. Stats bar (Vistos/Dominados/% curso). Estados visuales: untouched/viewed/mastered + ring inferior por nivel (basic verde / intermediate ámbar / advanced rojo). API `window.ENG_TENSES.{init,openLesson,mark,getProgress,closeModal}` expuesta como CLI. Progreso persistido en `eng_tense_progress` y sincronizado vía SYNC_REGISTRY. Cero alucinación: tiempos curados con fórmulas estándar y ejemplos data-analyst específicos.
- Next: Para la próxima 3-ENG.P3 — NO rehacer F1. Angles disponibles: F2 — Forja de Oraciones (builder interactivo tense+mood+subject+verb → oración + `ENG_TENSES.buildSentence()` expuesto) · F3 — Vista Canvas global del módulo (Idea C) · F4 — Importador desde cuaderno English/Platzi del 13-NOT (Idea B) · F5 — Detector top-10 errores hispanos en texto pegado (Idea A) · F6 — Auto-feed de vocab importado al SRS deck. Verificar que F1 sigue funcional antes de extender.

### ID:3-ENG.P3 · F2 · 2026-05-25
- Commit: ccd675a
- Files: frontend/js/eng-tenses.js (+~340 líneas · SUBJECTS + VERBS + buildSentence engine + Forja UI) · frontend/english.html (1 edit: `<div id="forja"></div>` arriba del grid) · frontend/css/english.css (+~80 líneas bloque "F2 · FORJA DE ORACIONES" + responsive)
- Changed: F2 del rediseño Second Brain. Ejecuta la **técnica D (CLI/Skills)**: motor de conjugación + UI Forja como skill reutilizable.
  - **Motor `buildSentence(tenseId, mood, subjectKey, verbBase, complement)`** expuesto como `window.ENG_TENSES.buildSentence()`. Cubre los **12 tiempos × 3 modos = 36 casos**. Devuelve `{ text, parts:[{t,w}], tense, subject, verb, mood }` con slots tipados ('s','aux','v','not','c') para rendering color-coded.
  - Conjugación correcta de auxiliares (am/is/are, was/were, have/has, do/does, did, will/won't), tercera persona singular con regla `_thirdSing` (work→works, study→studies, go→goes, have→has via override), -ing forms y participios irregulares (write→written, get→gotten, run→run, etc.).
  - **22+ verbos** del dominio data-analyst pre-cargados (work, build, write, run, send, get, make, do, have, go, see, take, give, find, lead, come, speak, know, learn, use, create, analyze, design, deploy, fix, review, present, study, finish, plan, ship, test). Mezcla regulares e irregulares con marcador `irr:true` (✦ en UI).
  - **7 sujetos** con conjugaciones precomputadas (I/you/he/she/it/we/they) + traducción ES.
  - **UI Forja** colapsable arriba del grid: form (tense select / mood radios / subject select / verb select / complement input) + botones "⚡ Generar", "🎲 5 variaciones aleatorias", "Limpiar". Resultado renderiza oración con slots coloreados (sujeto verde · auxiliar ámbar · verbo violeta · neg rojo · complemento neutro) + breakdown con etiquetas por slot.
  - **Save to notes**: cada oración generada tiene botón 💾 que la guarda en `eng_notes` con `source:'forja'`.
  - **TTS** en oración generada y cada variación.
  - **Integración con F1**: botón "🧱 Forjar oración con este tiempo" añadido al footer del modal de lección — cierra modal, expande Forja, scrollea suave y pre-selecciona el tense.
  - API completa expuesta: `window.ENG_TENSES.{buildSentence, randomSentence, openForja, SUBJECTS, VERBS}` — invocable por Copilot, sub-agentes o cualquier módulo del Cerebro.
- Verificación: smoke test de 25 combinaciones en preview · todas correctas excepto verbos no incluidos (corregido añadiendo finish/come/etc.). Flujo modal→Forja con pre-selección verificado. TTS y guardar en notas funcionales.
- Next: F3 — Vista Canvas global del módulo · F4 — Importador Platzi/cuaderno English (13-NOT) · F5 — Detector top-10 errores hispanos · F6 — Auto-feed vocab al SRS. NO rehacer F1+F2.

### ID:3-ENG.P3 · F3 · 2026-05-25
- Commit: 9f1665f
- Files: frontend/js/eng-tenses.js (+~230 líneas · TENSE_EDGES + _renderMap + _renderViewToggle + switchView + hover/click handlers) · frontend/english.html (1 edit: tense-toolbar + #tenseMap container) · frontend/css/english.css (+~110 líneas bloque "F3 · TOGGLE VISTA + MAPA" + responsive)
- Changed: F3 del rediseño Second Brain. Ejecuta la **técnica C (JSON Canvas)** del Modelo: knowledge graph visual de los 12 tiempos verbales con relaciones tipadas.
  - **Toggle Grid/Mapa** en la toolbar arriba del grid. Persiste preferencia en `localStorage.eng_tense_view` (NO sincronizado — preferencia local).
  - **SVG knowledge graph** (760×520 viewBox, responsive) con layout 3 columnas (Past/Present/Future) × 4 filas (Simple/Continuous/Perfect/PerfCont). 12 nodos circulares con icono + nombre simplificado + estrella si dominado.
  - **16 aristas tipadas** entre tiempos: `trap` (4 trampas hispanas · ámbar punteada · curvas pronunciadas), `seq` (3 secuencias temporales como past→past_perfect · verde sólida), `evo` (9 evoluciones por aspecto en cada fila · violeta sutil).
  - **Interactividad:** hover en nodo destaca vecinos (dim no-vecinos a opacity .25 + activa aristas conectadas) y muestra detalle en sidebar (uso del tense + pills nivel/trampas/secuencias). Hover en arista muestra la regla en sidebar. Click en nodo abre el modal de lección de F1.
  - **Sidebar fijo** (sticky desktop, stack en mobile) con leyenda (3 tipos de conexión + 3 niveles + 3 estados de progreso) + zona de detalle que se actualiza con hover.
  - **Estados visuales en nodos:** untouched (gris), viewed (borde ámbar), mastered (borde verde + 🌟). Color del nombre = nivel (verde basic / ámbar intermediate / rojo advanced).
  - API añadida a `window.ENG_TENSES`: `switchView(view)` + `TENSE_EDGES` (export del dataset para uso externo).
- Verificación: smoke test en preview · 12 nodos + 16 aristas renderizados sin errores · hover sobre Present Perfect destaca 4 vecinos + muestra "2 trampas" en sidebar · hover sobre arista trap muestra "Present Perfect ⇄ Past Simple · Con fecha específica..." · click en Future Perfect Continuous abre modal F1 · vista persistida en localStorage al reload.
- Next: F4 — Importador desde cuaderno English / Platzi (13-NOT) · F5 — Detector top-10 errores hispanos en texto pegado · F6 — Auto-feed vocab importado al SRS deck. NO rehacer F1+F2+F3.

### ID:3-ENG.P3 · F4 · 2026-05-25
- Commit: 71da1e2
- Files: frontend/js/eng-import.js (NEW · ~430 líneas IIFE) · frontend/english.html (3 edits: tab + panel + script tag) · frontend/css/english.css (+~110 líneas bloque "F4 · IMPORTAR" + modal + toast) · frontend/js/cloud-sync.js (eng_imported_lessons añadido a SYNC_REGISTRY)
- Changed: F4 del rediseño Second Brain. Ejecuta la **técnica B (Web Clipper)** del Modelo: importador que parsea contenido raw o auto-detecta cuadernos del 13-NOT y empuja items estructurados a los stores de 3-ENG.
  - **Nueva tab `📥 Importar`** entre Notes y Dojo.
  - **Auto-scan** de fuentes en localStorage del 13-NOT: `not_nb_meta`/`not_nb_data` (cuadernos completos o páginas individuales con keywords `english|inglés|platzi|practical|conversational|grammar|vocab`) + `sb_notes2` (notas flat con tags o contenido matching).
  - **Modo Paste** con textarea para pegar texto raw (Platzi, PDFs, transcripts, cualquier fuente). Stats live (palabras/caracteres).
  - **Parser** que detecta 3 categorías:
    - **Vocab**: pares "word — definición" con 5 separadores (—, –, :, =, →, /) · valida formato alfabético y filtra falsos positivos (URLs, líneas largas).
    - **Phrases**: oraciones entre comillas dobles/simples · spans con `<b>...</b>` · líneas sentencia (3-18 palabras, mayúscula inicial, terminadas en .!?).
    - **Tips**: líneas con prefijo `tip:|regla:|rule:|nota:|note:|💡|⚠️`.
  - **Modal de revisión** con checkboxes por item, botones "Seleccionar todo/Ninguno", summary pills (vocab/phrases/tips) + agrupación por categoría con headers.
  - **Importación** dispatched a stores correctos:
    - Vocab → `eng_srs_deck` como flashcards box 1 con metadata `{source:'import', importedFrom, imported:ts}`.
    - Phrases → `eng_notes` con `stamp:'phrase', source:'import'`.
    - Tips → `eng_notes` con `stamp:'idea', source:'import'`.
  - **Historial** en `eng_imported_lessons` (cap 50, synced via SYNC_REGISTRY) con date + source + results · últimas 5 visibles en UI.
  - **Toast** "✓ Importado: N vocab → SRS deck · N frases → Notes · N tips → Notes" al confirmar.
  - **API CLI**: `window.ENG_IMPORT.{scan, extract, importItems, log, openTab}`.
- Verificación: smoke test en preview con texto sample tipo Platzi · parser detectó correctamente **5 vocab + 8 frases + 3 tips = 16 items** · modal de revisión renderea agrupados · importación impactó stores correctos (verificado deck=5, notes_sources=11, log=1 entry).
- Next: F5 — Detector top-10 errores hispanos en texto pegado (sub-vista o sección en Importar) · F6 — Auto-feed vocab importado al SRS con scheduler. NO rehacer F1+F2+F3+F4.

### ID:3-ENG.P3 · F5 · 2026-05-25
- Commit: d3198e3
- Files: frontend/js/eng-errors.js (NEW · ~470 líneas IIFE · 15 patrones regex + analyze + highlight + wiki + UI) · frontend/english.html (3 edits: tab + panel + script) · frontend/css/english.css (+~110 líneas bloque "F5 · DETECTOR DE ERRORES" · highlighted text + lista expandible + wiki cards) · frontend/js/cloud-sync.js (eng_error_log añadido a SYNC_REGISTRY)
- Changed: F5 del rediseño Second Brain. Ejecuta la **técnica A (Karpathy auto-organize)** del Modelo: detector local de errores hispanos en texto del usuario + wiki personal de patrones recurrentes.
  - **Nueva tab `🔍 Errores`** entre Importar y Dojo.
  - **15 patrones regex** verificables que cubren los errores hispanos más documentados:
    - `no_aux_negative` (I no understand → I don't), `third_sg_no_s` (She work → She works), `double_negative` (don't know nothing → anything), `have_years` (I have 25 years → I am 25 years old), `have_state` (I have hungry → I am hungry), `have_that_verb` (have that go → have to go), `state_verb_continuous` (am knowing → know), `will_to_verb` (will to send → will send), `people_is` (people is → people are), `uncountable_plural` (informations → information), `depend_of` (→ depend on), `married_with` (→ married to), `since_duration` (since 3 years → for 3 years), `make_homework` (→ do homework / ask a question), `question_no_aux` (You have time? → Do you have time?).
  - **3 niveles de severidad**: high (rompe gramática) · med (interferencia clara) · low (estilo/preposición).
  - **Engine `analyze(text)`**: corre los 15 patrones, deduplica overlaps, devuelve array ordenado por índice con suggestion + why + tenseId (vínculo a lección F1 cuando aplica).
  - **`highlight(text, results)`**: devuelve HTML con `<mark>` coloreado por severidad y superíndice de número.
  - **UI 3 secciones**: (A) Textarea + Analizar → resultado con texto highlighted + lista de errores expandibles con cada uno mostrando ✗ encontrado / ✓ sugerencia / 📖 regla / → Ver lección. (B) Wiki personal: cards ordenadas por frecuencia (×N veces), agrupadas por patrón con last sample. (C) Historial últimos 5 análisis.
  - **Vínculo a F1**: cuando un error está asociado a un tense (present_simple, present_continuous, present_perfect, future_simple), botón "→ Ver lección del tiempo relacionado" salta a la tab Tiempos y abre el modal correspondiente.
  - **Historial** en `eng_error_log` (cap 50, synced via SYNC_REGISTRY) con sample/errorCount/results.
  - **API CLI**: `window.ENG_ERRORS.{analyze, highlight, save, log, wiki, openTab, PATTERNS}`.
- Verificación: smoke test en preview con texto sample de 13 oraciones con errores típicos · **13/13 errores detectados correctamente** (no_aux_negative, third_sg_no_s, have_that_verb, will_to_verb, double_negative, depend_of, uncountable_plural, people_is, married_with, since_duration, state_verb_continuous, 2× have_state) con suggestions correctas. Wiki personal poblado con 12 patrones únicos. Vínculo a lección F1 funcional.
- Fix in-flight: bug "She workworks" en suggest de third_sg_no_s corregido (concat doble del verbo) → ahora devuelve "She works" correctamente.
- Next: F6 — Auto-feed scheduled de vocab importado al SRS deck. Tras F6 cierra el plan de 6 fases del rediseño Second Brain de 3-ENG.

### ID:3-ENG.P3 · F6 · 2026-05-25 · CIERRE PLAN SECOND BRAIN
- Commit: c771a2d
- Files: frontend/js/eng-practice.js (NEW · ~340 líneas IIFE · sesión diaria + streak) · frontend/english.html (2 edits: #dailySession placeholder + script tag) · frontend/css/english.css (+~80 líneas bloque "F6 · DAILY PRACTICE SESSION") · frontend/js/cloud-sync.js (eng_daily_session + eng_practice_streak añadidos a SYNC_REGISTRY)
- Changed: F6 cierra el plan de 6 fases del rediseño Second Brain. Ejecuta la **técnica E (Local-first learning)** del Modelo: integra F1-F5 en una rutina diaria personalizada que pega los pedazos en un único loop de aprendizaje.
  - **Banner "Tu sesión de hoy"** arriba del hero, siempre visible al entrar al módulo. Colapsable. Muestra progreso 0/4 + streak.
  - **Generador de 4 pasos** que pulla datos de F1-F5:
    - **🃏 SRS**: N cards "due" hoy (con cap de 5). Si deck vacío → CTA a F4 Importar.
    - **⏰ Tense**: pick determinístico por prioridad — primero `viewed + !mastered` (de basic a advanced), luego `untouched` de menor nivel, finalmente repaso advanced si todo dominado.
    - **🔍 Error #1**: top patrón del wiki F5 ordenado por frecuencia, con last sample + regla + link a lección F1 cuando aplica.
    - **💬 Phrase**: random determinístico-por-fecha desde `eng_notes` con stamp:phrase/idea.
  - **Streak tracker** en `eng_practice_streak` con count + lastDate + max. Se incrementa solo cuando los 4 pasos están marcados hechos. Se rompe si pasa un día sin completar (+1 si días=1 con la última fecha, reset a 1 si días≠1).
  - **UX rico**: barra de progreso animada, checkboxes redondos con pop animation al marcar, banner cambia de violeta a verde cuando completo, mensaje "¡Vuelve mañana para mantener el streak.", botón "↻ Regenerar sesión" (con confirm).
  - **Cross-fase navigation**: cada paso tiene botón "→ Ir a [feature]" que cambia de tab y, en el caso del tense, abre el modal de lección F1 directamente.
  - **API CLI**: `window.ENG_PRACTICE.{session, markStep, streak, regenerate, openTab}`.
  - **Sincronización**: `eng_daily_session` + `eng_practice_streak` añadidos a SYNC_REGISTRY → racha cross-device.
- Verificación: smoke test en preview con localStorage vacío (todos los pasos muestran estado "empty" con CTA correcto al tab faltante). Re-test con datos sintéticos poblados (deck SRS, tense progress, error log, eng_notes) — sesión generó correctamente los 4 pasos personalizados ("2 de 2 cards due", "Present Perfect intermedio a repasar", error "no_aux_negative ×1 con sample I no understand", phrase "I'll get back to you on that"). Completar los 4 → banner cambia a verde "¡Sesión completa de hoy!" + "streak 1 día". Streak persiste en localStorage. Mensaje de cierre mostrado.
- **CIERRE DEL PLAN**: las 6 fases del rediseño Second Brain de 3-ENG están completas. F1 (grid + lecciones · técnica C+E) · F2 (Forja + buildSentence · técnica D) · F3 (mapa SVG · técnica C) · F4 (importador · técnica B) · F5 (detector errores · técnica A) · F6 (sesión diaria · técnica E integradora). Cubre las 5 técnicas del Modelo.md aplicadas al dominio English.
- Next: NO rehacer ninguna fase. Next-angles posibles: (a) export de la sesión diaria a calendar/iCal (b) "modo Sprint" con sesión intensiva de 30 min (c) integration con Dojo (TTS+STT) para shadowing del phrase del día (d) cross-device streak leaderboard (e) generar el cuaderno English en 13-NOT vía CLI ENG_IMPORT.createNotebook(). Verificar que F1-F6 sigan funcionales antes de extender.

## 🌐 Project-Wide Prompts (3)

<!-- Whole-project triad · tab 🧩 Módulos → "🌐 PROYECTO COMPLETO".
     Append entries for: PROJECT.P1 (improve), PROJECT.P2 (audit), PROJECT.P3 (creative). -->

### ID:PROJECT.P3 · 2026-07-09
- Commit: 83b10df
- Scope: infra compartida (cloud-sync.js) · stack cuadernos (notes-nb.js · work.js · systems_logic.js) · 1-IND (index.html) · 19 HTML cache-bust
- Changed: Fase 1 entregó 5 ideas sistema (Spotlight Ctrl+K · Inbox universal · Grafo global · Vista HOY · Organizador Karpathy); el usuario eligió #4 Vista HOY y se armó el blueprint (adaptadores read-only + 2 write-through, cero keys nuevas), pero pivotó a hardening whole-project antes de codificar. Auditoría completa del motor de sync (1117 líneas) + stack NB → 3 bugs REALES arreglados:
  1. **Carrera de autosave (pérdida de datos)**: openPage/newPage/deletePage/selectActive movían activePageId sin flushear el timer de 500ms — ediciones vía toolbar (imagen/lista/code, que no pasan por focusout) se descartaban al cambiar de página rápido. Fix `_flushPending` replicado en los 3 módulos NB.
  2. **cloud-sync**: `_flushPendingPushes` (visibilitychange) pusheaba sin alinear TS ni limpiar outbox → contador fantasma "N sin subir" + re-descarga en lightPull; realtime DELETE escribía string `"null"` (JSON.parse→null rompe módulos sin try/catch) → ahora removeItem; pushNow/forcePushKey/forcePushAll limpian outbox al confirmar.
  3. **prompt() letal en 1-IND**: primera visita (sb_name vacío) ejecutaba prompt() inline; en entornos sin diálogos (sandbox/kiosk/automation) LANZA y mataba todo el script del launcher (rail + router Cerebro). Fix: diferido 1.2s + try/catch. Repro confirmado en preview ("prompt() is not supported").
  - Visual 1-IND: +2 tarjetas faltantes en el grid (15-MM, 16-APA — estaban solo en el rail) · eliminado CTA vencido "Simetrik Interview · 15 Abr".
  - Verificación: regresión de la carrera PASS en 13-NOT y 14-WORK (marker sobrevive switch <500ms) · no-restamp sin cambios PASS · launcher PASS (Cerebro object, rail 16 items) · consolas limpias en index/systems/work.
- Next: (a) codificar la Vista HOY (blueprint listo: adaptadores sys_tasks/sb_habits/atlas_daily/eng_srs_deck/da_vacancies, writes solo hábitos+tareas) · (b) merge estructural para work_moif_meetings · (c) limpiar blobs huérfanos de IDB/Storage al borrar páginas con imágenes · (d) fase futura: tabla per-record para cuadernos (modelo family-system). NO rehacer los 3 fixes.

### ID:PROJECT.P3 (CONT · estándar sync cuadernos) · 2026-07-15
- Commit: 7108878
- Scope: nb-shared.js · cloud-sync.js · 19 HTML cache-bust (p13/p20)
- Changed: El usuario reportó que texto e imágenes de cuadernos NO llegaban al otro PC. CAUSA RAÍZ triple: (1) `retryPendingUploads` buscaba el blob solo en el store de ADJUNTOS — las HD de imágenes viven en STORE_IMG → todo `img_*` encolado (pegado offline/deslogueado) se sacaba de la cola SIN subir jamás a Storage; (2) los chips nuevos no llevaban thumbnail inline → sin HD en Storage el otro PC no veía nada; (3) sin sesión nada sube y no había ninguna señal visible. FIXES (estándar para los 3 módulos de cuadernos, que comparten nb-shared+cloud-sync): retry con fallback a STORE_IMG + triggers extra (online/60s) · chip con `data-preview` ~320px que viaja dentro del body por app_state (la imagen SE VE siempre; la HD baja de Storage al abrir) · overlay con fallback a preview y aviso si no hay nada · red final `insertAdjacentHTML` (imagen en IDB sin chip = invisible) · `reuploadMissingImages()` repara el histórico (escanea los 3 stores, `storage.list` 1 call, sube lo que falte) · **badge ☁ universal en las 19 páginas** con panel doctor (sesión/última sync/outbox/imágenes/realtime/quota + botones Sincronizar ahora y Traer de la nube) · boot resilience (retry backoff del fullSyncAll fallido) · JWT recovery en el pull · listener `online` · re-suscripción realtime cada 5 min.
- Tests preview: paste→chip con preview en body guardado PASS · retry conserva cola en fallo / sube desde STORE_IMG en éxito PASS · overlay fallback PASS · recovery histórico PASS · badge+doctor PASS · consolas limpias.
- PENDIENTE DEL USUARIO: (1) Ctrl+F5 en ambos PCs; (2) verificar badge ☁ verde (sesión iniciada) en ambos; (3) en el PC de origen de las imágenes: badge → Sincronizar ahora; (4) opcional realtime instantáneo: correr en Supabase SQL editor `alter publication supabase_realtime add table public.app_state;`
- Next: si tras esto algo sigue sin cruzar, el doctor (`CLOUD.doctor()` o click en badge) dice exactamente dónde se atora. Fase futura: tabla per-record.

### ID:PROJECT.P1 · 2026-08-10 (AUDITORÍA · sin commit)
- Commit: - (read-only)
- Scope: barrido del shell compartido — 28 HTML, cloud-sync.js, core.js, pages/*
- Changed: nada. Primera ejecución de PROJECT.P1; se entregó el TOP-3 de oportunidades con evidencia:
  1. **🔴 El backup no respalda nada.** `pages/configurar.html:178` filtra `k.startsWith('da2026_')`, pero ese
     namespace (`DB.NS` de core.js) solo tiene ~10 keys legacy. Todo el Cerebro real (`not_nb_*`, `work_*`,
     `sys_*`, `fin_*`, `eng_*`, `tools_*`, `atlas_*`, `sb_*`, `jt8`) usa keys crudas y queda FUERA del archivo.
     No existe otro export global en el repo. **Confirmado en la práctica el 2026-08-10**: durante el incidente
     de Supabase el usuario tuvo que respaldar con un script en consola (111 keys · 4,8 MB).
  2. **🟡 9 páginas de `pages/` cargan la infra sin cache-bust** (`../js/cloud-sync.js`, `auth.js`,
     `supabase-client.js`, `core.js` sin `?v=`), mientras las 19 principales van pineadas. Tras cada deploy del
     motor hay ventana en que esas pestañas arrancan con el anterior — el "motor viejo" del clobber del 15-jul.
  3. **🟡 El namespace `da2026_*` no sincroniza.** Profile/XP/Streak de core.js:51-109 no están en SYNC_REGISTRY
     ni matchean DYNAMIC_PREFIXES → el perfil de "Mi Perfil" es local para siempre.
- Next: ejecutar el pase (1 → 3 → 2 por impacto). El #1 subió a urgente tras el incidente: si Supabase se vuelve
  a pausar, el único respaldo del usuario es un botón que saca un archivo casi vacío. NO re-auditar: los tres
  hallazgos están verificados con file:line.

## 📚 Library Prompts

<!-- Append entries below for: LIB.bootstrap, LIB.bug-hunt, LIB.sync-audit, LIB.design-audit, LIB.cross-module, LIB.capabilities-audit, etc. -->

---

*Created 2026-05-15 · Fase D · token-saving overhaul.*

---

### ID:10-SYS.P2 · 2026-05-26
- Commit: a7e77ce
- Files: systems_logic.js, systems.html, CEREBRO_STATE.md
- Changed: Audit READ-ONLY completo · Tier A aplicado: CALENDAR['26V02'] completado (gradeClose2+periodClose), renderDeadlines() en Tab 2, english_beginner enriquecida (profesor+horario), CSS transition fix
- Next: Tier B — conectar Chrome MCP o pegar syllabus CDigital para Bloque 2 de ing_web/mat_especiales/inv_ciencia y actividades de A1I01+CE1026 → bump SEED_VERSION 6

### ID:10-SYS.P2 (CONT) · 2026-05-26 — Subject CRUD
- Commit: e847ea6
- Files: systems_logic.js (+230 líneas), systems.html (+155 líneas)
- Changed: CRUD completo de materias — nueva/editar/ocultar, modal con color picker, cronograma de entregas, adjuntos base64, getSubjects() merge hardcoded+custom, selects dinámicos
- Next: Tier B aún pendiente (Bloque 2 tasks, Bloque 2 cronograma real)

### ID:14-WORK.P2 · 2026-05-27 — Prueba DOTA Roadmap
- Commit: pending
- Files: frontend/pages/simetrik-dota-test.html (new, ~350 líneas), frontend/work.html (+nueva tab + panel iframe)
- Modified: Nueva pestaña "🧪 Prueba DOTA" en 14-WORK · roadmap completo con los 16 puntos del Documento Guia.docx · fórmulas, lógicas de barrida, cálculo FECHA_FINAL, errores comunes
- Next: si el usuario quiere, agregar simulador interactivo de las barridas + integración con la tabla de DB_DOTA_v3 como ejemplos clickables

### ID:14-WORK.P2 (CONT) · 2026-05-27 — Plantilla reutilizable + docs
- Commit: pending
- Files: PROMPT_14-WORK_TEST.md (NEW), PROMPT_14-WORK.md (cronología 4 iteraciones + 14 tabs + storage keys), CEREBRO_STATE.md (sesión completa), frontend/work.html (+Modo 3 Copilot), frontend/js/work.js (+buildTestDevPrompt)
- Modified: Plantilla persistente del prompt de desarrollo de pruebas Simetrik (estilo DOTA) + integración como Modo 3 del Copilot · cronología completa en PROMPT_14-WORK.md
- Next: Aplicar la plantilla a la próxima prueba real (cualquier cliente diferente a DOTA)

### ID:13-NOT.P4 · 2026-06-02
- Commit: (pending)
- Files: frontend/js/nb-shared.js · frontend/css/nb-shared.css · frontend/js/notes-nb.js · frontend/js/cloud-sync.js
- Changed: (a) Botón "🖼️ Imagen" en toolbar shared + NBShared.insertImage(sid,ns) con 3-tier compression (full→IDB, preview→inline body, ~150KB); (b) Paste de imagen ahora ingesta inline en vez de bloquear con alert; (c) Click en .nb-img → overlay HD desde IDB; (d) Mindmap por cuaderno: nuevo store not_nb_maps {nodes,edges} + sub-toggle "🗺️ Mapa" en detalle de cuaderno con SVG canvas (click→crear, drag→mover, Ctrl/Shift+click 2 nodos→conectar, doble-click→editar, right-click→eliminar); (e) Registrado not_nb_maps en SYNC_REGISTRY (cross-device).
- Next: (a) Export mapa a PNG/SVG · (b) Templates de mapas (kanban, swot, fishbone) · (c) Auto-extraer entidades de páginas para sugerir nodos · (d) Link nodo del mapa → página específica del cuaderno · (e) Resize/move overlay HD con keyboard nav.

### ID:13-NOT.P5 · 2026-06-02
- Commit: (pending)
- Files: frontend/js/nb-shared.js · frontend/css/nb-shared.css · frontend/js/notes-nb.js · frontend/notes.html
- Changed: (a) Iconos en nodos del mindmap — palette de 56 iconos (estudio/codigo/matematica/ciencia), Alt+click nodo abre picker, parse automatico de emoji al inicio del texto al crear/editar; (b) 4 templates de mindmap (Blanco, Radial 6 ramas, Mapa conceptual jerarquico, Lenguaje de programacion con 8 nodos pre-conectados); (c) Export mapa a PNG 2x (SVG -> canvas -> download); (d) 5 templates de cuaderno (Blank, Lenguaje de programacion 10 paginas, Algoritmo 7 paginas, Concepto academico 6 paginas, Workflow 6 paginas) con selector en el form "Nuevo cuaderno"; (e) Boton "</> Code" en toolbar shared (NBShared.insertCodeBlock) que inserta pre+code monospace dark con tag de lenguaje opcional. CSS: nb-rt-code, nb-code-wrap, nb-code-lang con estilo GitHub-dark.
- Next: (a) Syntax highlighting real (Prism/highlight.js via CDN) en .nb-code · (b) Link nodo del mapa <-> pagina del cuaderno (click nodo abre pagina) · (c) Templates de cuaderno editables/exportables · (d) Auto-extract entities de paginas para sugerir nodos del mapa · (e) Re-orden de paginas por drag.

### ID:13-NOT.P6 · 2026-06-02
- Commit: (pending)
- Files: frontend/notes.html · frontend/js/nb-shared.js · frontend/js/notes-nb.js
- Changed: (a) Syntax highlighting con highlight.js (CDN 11.9.0 + tema github-dark) auto-aplicado a .nb-code[data-lang] en cada render; focusin strippea spans para edicion plana, focusout re-highlightea. (b) Link bidireccional nodo del mapa <-> pagina del cuaderno: nuevo campo node.pageId, halo verde + marker 🔗 en nodos vinculados, click simple en nodo vinculado abre la pagina; overlay de settings expandido (icono + selector de pagina del cuaderno). (c) Drag-to-reorder de paginas: HTML5 drag-drop nativo con grip ⋮⋮, indicador de drop, persist via saveData + re-render. (d) Pendientes uncommitted resueltos: commit b16a18f del rework 6-TOO a Mantenimiento del PC + Modelo.md (apuntes Obsidian) + Diagnostico-PC-2026-06-02.html.
- Next: (a) Drag-to-reorder NODOS del mapa por categorias · (b) Custom themes para code blocks (mas alla de github-dark) · (c) Export cuaderno entero a PDF · (d) Templates de cuaderno editables por el usuario · (e) Backlinks: una pagina conoce que nodos del mapa la referencian.

### ID:13-NOT.P7 · 2026-06-02
- Commit: (pending)
- Files: frontend/js/nb-shared.js · frontend/js/notes-nb.js · frontend/css/nb-shared.css
- Changed: FIX delete completo · todo lo que se crea ahora se puede eliminar. (a) Code blocks: boton × hover en top-right de .nb-code-wrap + Backspace en code vacio elimina el wrapper entero (antes contenteditable=false bloqueaba el delete); (b) Imagenes inline: nuevo boton "🗑 Eliminar imagen" en el overlay HD, remueve el <img> del editor + borra el blob de IDB; (c) Edges del mapa: ahora cada line tiene hit-area de 14px invisible y click confirma + elimina la conexion. CSS: .nb-block-del con hover scale + focus-visible WCAG.
- Audit cubierto: notas, journal, cuadernos, paginas, links, attachments, imagenes (grid legacy + inline), code blocks, nodos, edges, mapa entero, labels urgente/hecho. Todo creable es editable y eliminable.
- Next: (a) Undo/redo de acciones del mapa · (b) Bulk delete de paginas (checkbox + delete N) · (c) Trash con restore de paginas eliminadas accidentalmente.

### ID:13-NOT.P8 · 2026-06-02
- Commit: (pending)
- Files: frontend/js/nb-shared.js · frontend/css/nb-shared.css
- Changed: Imagenes ya no cubren la hoja del editor. (a) insertImage e ingest por paste ahora producen un <span class="nb-img-chip"> compacto en vez de <img class="nb-img"> grande; chip lleva data-img-id (full IDB) + data-preview (1280px inline para sync). (b) Click en chip → mismo overlay HD que antes con eliminar. (c) attachEditorHandlers ejecuta _migrateInlineImagesToChips() idempotente que convierte imagenes legacy a chips automaticamente al abrir cualquier cuaderno. (d) Nuevo boton "📂 Lista" en toolbar shared abre overlay con thumbnails de TODAS las imagenes de la pagina (grid auto-fill 140px), click un thumb abre el HD overlay correspondiente.
- Next: (a) Captions editables en el overlay HD · (b) Drag-and-drop reorder de chips dentro de la pagina · (c) Bulk delete desde el menu Lista · (d) Export al cuaderno con imagenes flat o como chips.

### ID:13-NOT.P9 · 2026-06-02
- Commit: (pending)
- Files: frontend/js/nb-shared.js · frontend/css/nb-shared.css
- Changed: HOTFIX P7 regresion · code blocks legacy ahora migran automaticamente para tener boton de eliminar. (a) Nueva _migrateCodeBlocks(editor) idempotente que detecta .nb-code-wrap sin .nb-block-del hijo e inyecta el boton dinamicamente. (b) Wired en attachEditorHandlers despues de _migrateInlineImagesToChips. (c) CSS: boton × ahora opacity .55 default (era 0) + size 24px (era 22) + radius 12 + escala 1.12 en hover (era 1.08) — siempre visible para que el usuario lo descubra sin tener que hover el bloque.
- Next: (a) Tooltip mas obvio "Eliminar" sin tener que hover · (b) Animacion suave al eliminar · (c) Drag handle para reordenar code blocks dentro de la pagina.

### ID:13-NOT.P10 · 2026-06-02
- Commit: (pending)
- Files: frontend/js/nb-shared.js
- Changed: Insert imagen unificado · 3 caminos paralelos en un mismo modal. Click en "🖼️ Imagen" ahora abre _openInsertImageDialog en vez de saltar directo al file picker. El modal soporta: (a) drag-and-drop sobre la zona destacada con border morado al hover; (b) Ctrl+V en cualquier parte del overlay (pega imagen del clipboard); (c) boton "📁 Seleccionar archivo" como antes. Esc cierra. Click afuera cierra. Cualquiera de los 3 caminos llama a _insertImageFromFile → chip compacto en el editor. La paste via Ctrl+V dentro del editor (sin abrir el modal) sigue funcionando como antes via attachCleanPaste.
- Next: (a) URL paste como 4to camino (validar y descargar) · (b) Multi-file drop (procesar batch) · (c) Captura de pantalla integrada con el browser API.

### ID:13-NOT.P11 · 2026-06-02
- Commit: (pending)
- Files: frontend/js/nb-shared.js · frontend/css/nb-shared.css · frontend/js/notes-nb.js · frontend/systems_logic.js · frontend/js/work.js
- Changed: Page Selector Bar genérico para los 3 módulos (10-SYS · 13-NOT · 14-WORK). (a) NBShared.pageSelectorHtml({nbId, ns, pages, activePageId}) construye barra sticky con tabs scroll horizontal + arrow buttons + dropdown jump-to. Cada tab muestra emoji extraído del título o número de página. Tab activa resaltada en morado. (b) NBShared.wirePageBar(root) post-render: cablea arrows con scrollBy smooth y auto-scrolls a la tab activa. (c) Embebida en NotNB.renderEditor (13-NOT), en NB.renderSubjectPanel y NB.renderCustomCard (10-SYS · ambos tipos de cuaderno), y en WorkNB.renderEditor (14-WORK). (d) CSS sticky top:48px (debajo del nav), scrollbar morado custom, focus-visible WCAG AA, responsive (arrows ocultas en mobile).
- Next: (a) Search/filter input dentro del bar para muchas páginas · (b) Drag tabs para reordenar (sustituye al drag de la lista) · (c) Keyboard shortcut Ctrl+Tab / Ctrl+Shift+Tab para navegar entre páginas.

### ID:13-NOT.P12 · 2026-06-02
- Commit: (pending)
- Files: frontend/js/nb-shared.js · frontend/css/nb-shared.css · frontend/js/notes-nb.js · frontend/systems_logic.js · frontend/js/work.js
- Changed: (a) Dropdown de paginas movido al toolbar inline en vez de barra sticky aparte. Nueva NBShared.pageJumpHtml(ctx) compacta (solo select). Embebida en los toolbars de los 3 modulos. Sticky bar removida. (b) Paste de imagen robustecido: ahora soporta 4 caminos — clipboardData.items kind=file (screenshot Win+Shift+S), clipboardData.files (Explorer drag), HTML pegado con <img src="data:..."> (typical copy-from-web), text/uri-list o text/plain con data:image directo. Helper _dataUrlToFile convierte base64 a File. Modal de insert tambien usa el mismo flow + listener global mientras esta abierto para captar paste desde body.
- Next: (a) Drag & drop directo sobre el editor (no solo en el modal) · (b) Image URL paste (https://) que descargue · (c) Search en el dropdown cuando hay >15 paginas.

### ID:13-NOT.P13 · 2026-06-02
- Commit: (pending)
- Files: frontend/js/nb-shared.js · frontend/css/nb-shared.css · frontend/js/notes-nb.js · frontend/systems_logic.js · frontend/js/work.js
- Changed: Reorganizacion del toolbar. Top toolbar ahora solo tiene "+ Nueva pagina" + dropdown de paginas (1 sola linea, limpio). Link y Adjuntar movidos al editor toolbar (junto a Imagen / Lista / Code) — quedan inline con el formato de la pagina activa. Los nuevos botones en NBShared.toolbarHtml llaman a ${ns}.addLink y ${ns}.attachFile con namespace correcto (funcionan en NB/NotNB/WorkNB). CSS: nb-rt-link verde, nb-rt-attach amber, hover states matching la paleta. Aplicado en los 3 modulos. Tambien removida la sticky bar legacy en los 3 sitios.
- Next: (a) Mostrar contador de links/adjuntos en el badge del boton ("📎 3") · (b) Quick preview al hover sobre el chip de link · (c) Drag-drop de archivos sobre el editor para adjuntar directo.

### ID:13-NOT.P14 · 2026-06-02
- Commit: (pending)
- Files: frontend/js/nb-shared.js · frontend/css/nb-shared.css · frontend/js/notes-nb.js · frontend/js/work.js
- Changed: Estandarizacion estructural de cuadernos en 13-NOT + 14-WORK para igualar al de 10-SYS (la canonica). Layout final por cuaderno: (1) cover-card con icono+nombre+sub; (2) header "⚙️ Personalizacion" con botones Diseño/Nombre/Mover/🗑 a la derecha (en 13-NOT tambien Mapa); (3) seccion colapsable "📓 Contenido" con la cuenta de paginas; (4) dentro del contenido: toolbar "+ Nueva pagina + dropdown" en su linea, editor con su rich toolbar (Imagen/Lista/Link/Adjuntar/Code), mapa para 13-NOT, label "· paginas ·" y lista. CSS nuevo en nb-shared: nb-shell (contenedor), nb-perso (header), nb-perso-actions (botones), nb-drop+nb-drop-h+nb-drop-body (collapsible), nb-inner-toolbar, nb-pages-label. Helper NBShared.toggleCollapse(elId) flippa la clase .on y persiste estado en localStorage. Estado inicial: dropdown abierto.
- Next: (a) Migrar 10-SYS para usar las mismas clases shared y deduplicar CSS · (b) Persist por-cuaderno del estado colapsado · (c) Animacion smooth al expand/collapse.

### ID:13-NOT.P15 · 2026-06-02
- Commit: (pending)
- Files: frontend/notes.html · frontend/css/notes.css · frontend/css/work.css
- Changed: Ancho de pagina unificado a 1200px (canon de 10-SYS systems.html .wrap). 13-NOT venia con 900px (notes.html inline + notes.css), 14-WORK venia con 1100px (work.css). Tambien padding-top de 24 a 28 para igualar exacto. Resultado: las paginas de los 3 modulos ahora tienen el mismo ancho maximo y los cuadernos se ven identicos.
- Next: (a) Igualar tambien el padding lateral en mobile · (b) Verificar que stats/hero arriba no se vean estirados en 13-NOT con el nuevo ancho · (c) Si el usuario quiere podemos hacer el wrapper responsive (1200/1100/900 segun viewport).

### ID:13-NOT.P16 · 2026-06-02
- Commit: (pending)
- Files: frontend/js/nb-shared.js · frontend/css/nb-shared.css · frontend/notes.html · frontend/work.html · frontend/systems.html
- Changed: 2 fixes + cache bust. (a) BUG paste duplicado: cuando se ingestaba imagen via file picker en el modal de Insertar imagen, close() viejo no removia el document paste listener huerfano. Cada modal abierto+cerrado dejaba un listener vivo. Con N modales previos cada paste posterior insertaba N+1 chips. Refactor: una sola funcion close() que SIEMPRE limpia _docPasteFn rastreado en closure. (b) Chip mas chico + draggable: font 11 -> 9.5, padding 2px 10px -> 1px 7px, label 28 -> 22 chars, max-width 280 -> 200. Atributo draggable="true" + cursor grab/grabbing + class nb-img-chip-dragging con opacity .35 al arrastrar. Nuevo attachChipDragHandler usa caretRangeFromPoint/caretPositionFromPoint para detectar el punto exacto en el editor donde dropear y mueve el chip ahi (preserva el &nbsp; trailing). Editor recibe clase nb-img-droptarget con outline morado dashed durante el drag. Migracion auto agrega draggable=true a chips viejos. (c) ?v=p15 -> ?v=p16 en los 3 HTMLs para forzar refetch.
- Next: (a) Mostrar mini-thumbnail del preview al hover sobre el chip · (b) Drag entre cuadernos o paginas distintas · (c) Atajo de teclado para enfocar chips y moverlos con flechas.

### ID:13-NOT.P17 · 2026-06-02
- Commit: (pending)
- Files: frontend/js/nb-shared.js · frontend/notes.html · frontend/work.html · frontend/systems.html
- Changed: Triple defensa contra el paste-x3 + cache. (a) Lock anti-duplicado dentro de _insertImageFromFile: key = file.size + file.name + file.lastModified; si llaman 2 veces con la misma key en menos de 1000ms, la segunda se ignora silenciosamente con warn. Asi aunque 3 listeners disparen (huerfanos, modal, editor), solo el primer call inserta un chip. (b) Meta http-equiv Cache-Control en los 3 HTMLs para que el browser NO cachee el HTML mismo (sino las cache busters ?v= no llegan al usuario). (c) NBShared.VERSION = 'p17-2026-06-02' + console.log de carga para verificar en DevTools. (d) ?v=p16 -> ?v=p17.
- Next: (a) Investigar y eliminar el handlePaste/openPasteDialog legacy de 10-SYS si el unified flow ya cubre todo · (b) Eliminar la opcion "🖼️ Imagen HD" de 10-SYS y usar solo NBShared.insertImage · (c) Service worker o ETag para refresh forzado.

### ID:14-WORK.P3 · 2026-06-04
- Commit: 3955233
- Files: frontend/pages/simetrik-dota-test.html
- Changed: Punto 7 del Dota Test (EXPECTED_PAYMENT_DATE, 30 días hábiles AR) actualizado al nuevo calendario del trainer "Formato DIAS HABILES ARGENTINA.xlsx" (Drive). Verificado vía Drive MCP: cubre 2019-01-01 → 2072 (el viejo "Normalización días hábiles Argentina.xlsx" arrancaba 2026-03-23 y dejaba sin día hábil a las transacciones DOTA desde 2022 — ese era el bloqueo 🔴). Cambios: archivo en tabla "Qué cargar" + paso 7.0; columnas renombradas ID_CONTADOR_SUMA→ID_SUM, ID_FECHA_FINAL→ID_FINAL en 7.1/7.3/resumen; columnas de la unión ahora PAIS,FECHA,CONCEPTO,CLASIFICATION,ID_SUM,ID_FINAL,DAY,YEAR (8); caja 🔴 "pregunta para el trainer" reemplazada por ✅ "bloqueo resuelto" (clase box do). Lógica BuscarV idéntica: ID_SUM = contador día hábil (incrementa solo en HABIL), ID_FINAL = mapeo número→fecha. Semántica verificada contra los datos del xlsx.
- Next: (a) Si el trainer responde sobre puntos 3/12, cerrar esas preguntas amarillas · (b) Revisar si DB_DOTA_v3 / Reporte_FD_v3 / Parametria_v2 tienen versiones nuevas en Drive · (c) Considerar dejar nota de tipo de dato FECHA en el nuevo archivo (header trae celda título "DIAS HABILES ARGENTINA" mergeada).

### ID:14-WORK.P4 · 2026-06-04
- Commit: 839881e
- Files: frontend/pages/simetrik-dota-test.html
- Changed: Normalización de fecha del Dota Test reestructurada según imagen del trainer "cambio formato Fechas.png" (Drive folder Imagenes). Nuevo enfoque: MOV_CREATED_DATE se castea directamente a tipo Fecha en la fuente DB_DOTA vía "Dar formato a columna" (Paso 1 tipo Fecha · Paso 2 identificar formato original ISO con T · Paso 3 visualización 2016-11-24 = YYYY-MM-DD). Esto elimina el workaround DIVIDIR(...;"T";1) que se usaba porque "Fecha y hora" daba error T001 y vaciaba celdas. Cambios: caja ⚠ ISO (warn→do con receta 3 pasos), tabla cast Paso 0b (MOV_CREATED_DATE Texto→Fecha), Paso 6 fórmula simplificada a ADICIONAR_FECHA_TIEMPO(MOV_CREATED_DATE; 1; "dias") (+1 día se mantiene), lecciones del Paso 6, caja warn cruce 7.1 (ambas ya son Fecha), resumen "Resuelto" (525). Corrige inconsistencia previa: el checklist (n:6) ya tenía la fórmula simple sin DIVIDIR pero el cuerpo del Paso 6 no — ahora todo coincide.
- Next: (a) Verificar en el workspace real que el formato original elegido en Paso 2 matchea el ISO con timezone (-04:00) sin vaciar celdas · (b) Confirmar si el +1 día de MOV_CREATION_DATE es regla de negocio o ajuste de timezone · (c) Cerrar preguntas 🟡 puntos 3 y 12.

### ID:14-WORK.P5 · 2026-06-04
- Commit: 63fc0e2
- Files: frontend/pages/simetrik-dota-test.html
- Changed: Agregada sección maestra "🆕 Reconstrucción desde cero" al inicio del Dota Test (antes de Preparación), porque el usuario va a borrar todo y rehacerlo. Contiene (a) las 4 REGLAS DE ORO de propagación de Simetrik que explican por qué MOV_CREATION_DATE no se actualizaba: casteo solo en la FUENTE / re-ejecutar unión (solo recalcula registros vacíos) / borrar-y-recrear columnas de transformación / castear antes de fórmulas o se bloquea 🚫; y (b) el orden macro de 9 pasos (cargar fuentes con archivos actualizados incl. calendario nuevo → castear tipos → uniones → norm DOTA 1-7 → cruce 8 → norm FD 9-11 → conciliación 12 → saldo 13 → tableros 14-16). Versión v5→v6. Corregido conteo "5 fuentes" → nombradas las 4 reales (DB_DOTA, Reporte_FD, Parametria, Calendario_MLA). Guardada memoria project-simetrik-dota-test.md con las 4 reglas + estado del test.
- Next: (a) Verificar render de la nueva sección en el live site · (b) Si el usuario reporta más gotchas durante el rebuild, sumarlos a las reglas de oro · (c) Cerrar preguntas 🟡 puntos 3 y 12.

### ID:14-WORK.P6 · 2026-06-04
- Commit: c0ae13e
- Files: PROMPT_14-WORK_SIMETRIK-PURO.md (NEW)
- Changed: Creado un 4º prompt autónomo de 14-WORK para TRABAJO PURO en la plataforma Simetrik (no toca el módulo DA-2026, no genera HTML/JS, no publica roadmaps). Diferencia vs PROMPT_14-WORK_TEST.md (que publica roadmap en el módulo): este es solo asistencia operativa de plataforma. Estructura: zona para pegar (tarea + evidencia) → rol especialista Simetrik → base de conocimiento embebida (arquitectura Fuentes/Uniones/transformación/BuscarV/conciliación/tableros, sintaxis ;+comillas+MAYUS, tabla de funciones, las 4 reglas de oro de propagación, manejo de fechas ISO→Fecha, contexto DOTA) → parámetros (cero alucinación, evidencia verbatim, español, no tocar módulo) → protocolo de inicio → formato de salida. Autónomo para abrir en sesión nueva.
- Next: (a) Si el usuario quiere, exponerlo como botón "Copiar" en la tab Copilot de 14-WORK · (b) Ir sumando funciones Simetrik verificadas a la tabla a medida que aparezcan · (c) Sumar gotchas nuevos a las reglas de oro.

### ID:14-WORK.P7 · 2026-06-04
- Commit: fb385f3
- Files: frontend/js/work.js · frontend/work.html
- Changed: Expuesto el prompt "Trabajo Puro Simetrik" como botón en la tab 🎓 Tutor/Copilot. (a) work.js: nueva función buildSimetrikWorkPrompt() que arma el prompt embebido (line array .join para no chocar con backticks del code-fence) y lo vuelca a #askOutput con el patrón estándar (display block + textContent + dataset.raw + scrollIntoView); agregada a la API pública del IIFE. (b) work.html: nueva tarjeta "MODO 4" (borde cyan #06b6d4) con botón ⚡ Generar Prompt Trabajo Simetrik → WORK.buildSimetrikWorkPrompt(). BONUS: corregido bug latente en buildTestDevPrompt() que llamaba showResult() (función inexistente) → tiraba ReferenceError al click; reemplazado por el patrón estándar de output. node --check OK. Verificación en vivo no posible: el preview rebota work.html a root (guard de auth del módulo); validado por syntax-check + consistencia botón/función/export + paridad con Modos 1-3.
- Next: (a) Verificar el click en vivo en el live site autenticado · (b) Si suma, exponer también los otros prompts .md como botones · (c) Mantener el prompt embebido sincronizado con PROMPT_14-WORK_SIMETRIK-PURO.md si cambia.

### ID:14-WORK.P8 · 2026-06-04
- Commit: b1afb24
- Files: frontend/js/work.js · frontend/work.html · frontend/pages/simetrik-playbook.html
- Changed: Propagada la info nueva de Simetrik a todo el módulo 14-WORK. (a) Diccionario (seed idempotente, canal de conocimiento compartido cross-device): +9 entradas — reglaoro1cast, reejecutarunion, recrearcoltrans, colbloqueada (las 4 reglas de oro de propagación), errt001, castfechaiso, calhabilarg, idsumcol, idfinalcol. SEED_VERSION simetrik-2026-05-31.2 → 2026-06-04.1. Corregida referencia stale al calendario viejo en la entrada adicdiasmana2p. (b) Playbook (pages/simetrik-playbook.html): nuevo bloque cheatsheet cyan "🔑 Reglas de oro · fórmulas y propagación" (3 cols: las 4 reglas, fechas ISO→Fecha, calendario AR). (c) Cache-buster work.js p22→p23. Nota: Casos/Errores/Aprendizajes son CRUD sin seed → no se pueden auto-inyectar; el conocimiento queda en el Diccionario (buscable) + Playbook + guía Dota Test. Verificado: node --check OK, Playbook renderiza el bloque (screenshot, T001/ID_SUM/calendario presentes).
- Next: (a) Si querés seed para Aprendizajes/Errores hay que construir el mecanismo (hoy no existe) · (b) Verificar el seed del Diccionario en el live site logueado (auth guard impide test local).

### ID:14-WORK.P9 · 2026-06-04
- Commit: 8eb0ae1
- Files: frontend/pages/simetrik-dota-test.html
- Changed: Expandido el Sub-paso 8.2 del Dota Test (Grupo Conciliable / Filtrar ESTANDAR) con el paso a paso completo que antes solo estaba en el chat: (a) qué es un Grupo Conciliable (filtro guardado = vista guardada, por qué es el Lado A del Paso 12), (b) ruta numerada de 5 pasos (Automatizar→Recursos→Crear recurso→Grupo Conciliable→base Union_DOTA→filtro TIPO_COMERCIO="ESTANDAR"→nombre DOTA_Estandar), (c) caja ⚠ "3 cosas que dejan el grupo vacío" (valor debe matchear exacto incl. tildes, tipo Texto, BuscarV OK), (d) caja ✅ Verificá. Ruta confirmada contra simetrik-app.html (Grupo Conciliable es tipo de "Crear recurso") y simetrik-learn (filtro guardado). Guardada memoria feedback-step-by-step.
- Next: Paso 12 (conciliación avanzada · 5 barridas · Lado A DOTA_Estandar × Lado B Union_FD) cuando el usuario lo pida.

### ID:14-WORK.P10 · 2026-06-04
- Commit: 6e42bd7
- Files: frontend/pages/simetrik-dota-test.html
- Changed: CORRECCIÓN del 8.2 (el P9 tenía info errada). El usuario reportó que en "Crear recurso" NO aparece "Grupo Conciliable" (solo Fuentes, Agrupaciones, Concil. estándar, Concil. avanzada, Fuentes de apertura, Unión de fuentes). Verifiqué la captura Fuentes.png del Drive: el "Grupo conciliable*" es un CAMPO dentro de la configuración de la Unión de fuentes (default "Recurso completo"), no un recurso aparte. Reescrito 8.2: caja 📍 "Dónde vive (¡OJO!)" + pasos corregidos (abrir Union_DOTA config → campo Grupo conciliable → condición TIPO_COMERCIO=ESTANDAR → Guardar cambios). Origen del error: el simulador simetrik-app.html:448 lista "Reconcilable Group" como opción de Crear recurso, lo cual no coincide con la plataforma real.
- Next: (a) Confirmar con el usuario qué opciones muestra el dropdown "Grupo conciliable" para finalizar el paso 3 exacto · (b) Corregir simetrik-app.html:448 (Crear recurso no tiene Reconcilable Group/VLOOKUP en la versión real) · (c) Paso 12.

### ID:14-WORK.P11 · 2026-06-04
- Commit: e977c4d
- Files: frontend/pages/simetrik-dota-test.html
- Changed: Re-corrección del 8.2 tras 2da info del usuario (el dropdown "Grupo conciliable" SOLO muestra "Recurso completo", no deja crear). Leí el Documento Guia.docx oficial del Drive (id 1J2gfbvP...): el Punto 8 solo pide "filtrar únicamente TIPO_COMERCIO = ESTANDAR para poder avanzar con la creación de la conciliación" — NO menciona Grupo Conciliable. Reescrito 8.2: caja 📄 verbatim de la guía, caja 📍 explicando que el dropdown solo selecciona grupos existentes, y CAMINO RECOMENDADO = aplicar el filtro ESTANDAR al armar la Conciliación Avanzada (Punto 12) sobre el Lado A vía filtro/segmentación. Alternativa (grupo desde vista de tabla) marcada como "confirmá en tu workspace". Actualizada memoria project-simetrik-dota-test con la lección anti-hallucination (no confiar en el simulador para rutas de UI).
- Next: (a) Corregir simetrik-app.html:448 (Crear recurso real NO tiene Reconcilable Group/VLOOKUP) · (b) Cuando el usuario llegue al Punto 12, confirmar dónde exactamente se aplica el filtro/segmentación en la conciliación avanzada de su versión.

### ID:14-WORK.P12 · 2026-06-05
- Commit: ab3962d
- Files: frontend/pages/simetrik-dota-test.html
- Changed: Aclaración en Barrida 1 del Paso 12 tras captura Barridas.png del usuario. El usuario no podía poner DOTA en el Lado B porque tenía la barrida en "Tipo de barrida: Conciliación" (cruce A vs B, fija Lado B=FD). La guía oficial define la Barrida 1 como "auto-cruce de DOTA contra sí misma" = tipo COMPENSACIÓN, que opera sobre un solo recurso. Agregadas 2 cajas: 🚨 "Si te pide Lado B=FD" (cambiar Tipo de barrida→Compensación, ahí desaparece el FD y elegís un solo recurso UNION_DOTA) y ⚠ "El ABS no se escribe en la regla" (crear columna de transformación ABS_MONTO=ABS(MOV_AMOUNT) en Union_DOTA y usarla como llave). Todo verificado contra Documento Guia.docx + screenshot real.
- Next: Cuando el usuario configure las barridas 3-5 (DOTA vs FD), confirmar el lugar del filtro ESTANDAR y las tolerancias (fecha 1 día direccional en B4, batch por lote en B5).

### ID:14-WORK.P13 · 2026-06-05
- Commit: d411c52
- Files: frontend/pages/simetrik-dota-test.html
- Changed: Agregado al gotcha de Barrida 1 (Paso 12) el detalle verificado en workspace: el TIPO de barrida se elige al CREAR (botón Agregar) y queda fijo, NO editable después. Recuperación: si no guardaste cambios, te deja salir y rehacer la barrida con el tipo correcto (Compensación). Confirmado por el usuario en su plataforma real (como no había cambios guardados, lo dejó salir e intentar de nuevo). Cierra la duda de "no me deja cambiar el tipo de barrida".
- Next: Barridas 3-5 (DOTA vs FD): confirmar lugar del filtro ESTANDAR y tolerancias (B4 fecha 1 día direccional, B5 batch por lote).

### ID:14-WORK.P14 · 2026-06-05
- Commit: 4a8a561
- Files: frontend/pages/simetrik-dota-test.html
- Changed: Sol 1/Sol 2 del cuaderno "Prueba Dota" (leído vía Chrome MCP desde la sesión live del usuario, imágenes resueltas de IndexedDB da2026_nb/attachments y data-preview). Diagnóstico: "Guardar barrida" deshabilitado por el PASO OBLIGATORIO "Configurar grupos compensables" incompleto (punto amarillo) — Criterio de compensación vacío. Agregada caja 🟡 en Barrida 1 del Paso 12 con el paso a paso: Configurar grupos compensables → Criterio = MOV_OPERATION → arrastrar PAYMENT al grupo 1, REFUND al grupo 2 → guardar. Esto implementa la restricción "PAYMENT solo compensa con REFUND" de la guía oficial. NUEVO FLUJO establecido: el usuario pone solicitudes en cuaderno Prueba Dota pág Documentacion ("Revisa Docu Dota Sol N"), yo leo vía Chrome MCP.
- Next: Confirmar con el usuario que tras configurar los grupos compensables ya guarda y ejecuta. Luego Barrida 2 (tolerancia $5) y barridas 3-5 (DOTA vs FD).

### ID:14-WORK.P15 · 2026-06-05
- Commit: 823df8e
- Files: frontend/pages/simetrik-dota-test.html
- Changed: Corrección Barrida 2 (Paso 12). El doc tenía el operador del monto como "~= (tol. 5)" lo que hizo que el usuario buscara un operador "≤"/"~=" inexistente. En Simetrik la tolerancia NO es un operador: la condición queda en "=" y el valor 5 va en el campo aparte "Tolerancia" (+ Unidad numérica, no "días"). Reescrita la tabla de B2 con columnas reales (Columna A | Condición | Columna B | Tolerancia | Unidad) + caja ⚠ "La tolerancia NO es un operador". Confirmado contra el screenshot real de B1 que mostraba los campos Tolerancia/Unidad por regla.
- Next: Unidad exacta para tolerancia de monto a confirmar con el usuario cuando la vea. Luego barridas 3-5 (DOTA vs FD) — el 403 del deep-link impide inspección live, usar capturas (Sol N) del cuaderno.

### ID:14-WORK.P16 · 2026-06-05
- Commit: ec2bd14
- Files: frontend/pages/simetrik-dota-test.html
- Changed: Aclaración Barrida 2: el usuario reportó que el campo "Unidad" del monto no deja modificar nada. Es correcto/esperado — la tolerancia de un monto es valor absoluto (±5) y NO lleva unidad, por eso el dropdown queda bloqueado/vacío. La Unidad solo se habilita para tolerancias de FECHA (días, Barrida 4). Corregido el doc (antes decía erróneamente "elegí la opción numérica"): ahora dice Unidad bloqueada/no aplica + caja ⚠ actualizada.
- Next: Confirmar con el usuario que con Condición=, Tolerancia=5, Unidad vacía ya guarda la barrida. Luego barridas 3-5 (DOTA vs FD).

### ID:14-WORK.P17 · 2026-06-05
- Commit: 8af92a0
- Files: frontend/pages/simetrik-dota-test.html
- Changed: RESUELTAS con datos las 2 llaves dudosas de la Barrida 3 (el trainer no respondió). Crucé DB_DOTA_v3 × Reporte_FD_v3 en Python por PAN+monto(+auth). Resultados: Comercio → NUM_EST (37 hits vs 0 de NUM_COM); Fecha → FORIG_COMPRA (0 de FPRES, que es 2021/otro período). Hallazgo extra: FORIG_COMPRA = MOV_CREATED_DATE (19) ó +1 (33) → la llave de fecha debe usar MOV_CREATED_DATE CRUDO (no MOV_CREATION_DATE +1) para que la tolerancia direccional de Barrida 4 ("FD un día después") funcione; con el +1, 19 pares caen fuera del rango. Quitadas las 2 cajas 🟡 de pregunta, reemplazadas por caja ✅ con la evidencia. Actualizado el resumen de preguntas al trainer.
- Next: Quedan abiertas: Punto 3 (acquirer, cuál columna cuando hay 3) y tolerancia DIRECCIONAL de Barrida 4 (Simetrik aplica tolerancia a ambos lados; hipótesis: regla de desigualdad FD>=DOTA + tol 1 día). Verificar con datos/captura cuando el usuario llegue ahí.

### ID:14-WORK.P18 · 2026-06-05
- Commit: e56d661
- Files: frontend/pages/simetrik-dota-test.html
- Changed: AUDITORÍA COMPLETA de los 16 puntos contra guía oficial + dataset real (56.777 filas, parseado con openpyxl del xlsx binario, no del volcado de texto que estaba truncado a ~6k). HALLAZGO CRÍTICO: CAPTURE_* vacío en 52.717 filas (93%); cada fila trae su data en UN bloque: PURCHASE_* (52.717) o CAPTURE_*+AUTH_* (4.060). Correcciones: (a) Punto 2 GTWC_AUTHORIZATION_CODE — el "else" pasa de CAPTURE solo a coalesce PURCHASE→CAPTURE→AUTH (idéntico al Punto 5), manteniendo la excepción Cabal/000000; sin esto la llave de auth de Barrida 3 quedaba vacía en 93%. (b) Punto 3 GTWT_ACQUIRER — el fallback "else" pasa de CAPTURE solo a coalesce (la detección Mastercard/Visa ya estaba bien); quitada la pregunta al trainer. Verificados OK sin cambios: P1 (CARD_NUMBER, padding), P4 (BRAND, BIN logic + MAYUSC), P5 (merchant coalesce — patrón de referencia), P9/P10 (IZQUIERDA/DERECHA), P11 (DEADLINE fin de mes), P12b (FECHA_FINAL), P13 (MOV_AMOUNT con signo: PAYMENT+ 56481 / REFUND- 296, verificado), P14-16 (tableros). Resumen final actualizado.
- Next: Quedan SOLO 2 preguntas reales: tolerancia direccional Barrida 4 (FD>=DOTA) y llave de lote Barrida 5 (batch). Confirmar Punto 2/3 coalesce con trainer si responde (deviación menor del texto literal, pero datos inequívocos).

### ID:14-WORK.P19 · 2026-06-05
- Commit: bf2dbee
- Files: frontend/pages/simetrik-dota-test.html
- Changed: Verificación tras tip de un compañero (usó PURCHASE_AUTHORIZATION_CODE en las barridas del P12). Crucé NUM_AUT(FD) vs cada bloque DOTA en 6291 pares PAN+monto: PURCHASE=541, CAPTURE=225, AUTH=0. CONCLUSIÓN: PURCHASE-solo pierde 225 conciliaciones (bloque CAPTURE); el coalesce PURCHASE→CAPTURE→AUTH atrapa las 766 (+42%). El compañero pasó pero está incompleto. Confirma que el fix P18 (coalesce en GTWC) es estrictamente mejor que PURCHASE directo. Añadida esta evidencia a la caja del Punto 2. Puntos a rehacer para el usuario: P2 (GTWC coalesce), P3 (GTWT_ACQUIRER coalesce en else), y re-apuntar/re-ejecutar las barridas del P12 a la GTWC corregida (no PURCHASE directo).
- Next: Barrida 4 (tolerancia direccional) y Barrida 5 (llave batch) siguen abiertas.

### ID:14-WORK.P20 · 2026-06-05
- Commit: 7c330b1
- Files: frontend/pages/simetrik-dota-test.html
- Changed: El usuario no tenía PURCHASE_AUTHORIZATION_CODE en Union_DOTA (no la seleccionó al armar la unión) y preguntó si debía recrear la unión. Respuesta: NO recrear — la columna existe en la fuente (52.717 pobladas), solo agregarla a la unión + Ejecutar cambios. Agregada caja 📋 en Paso 0b listando las columnas de origen que Union_DOTA necesita para los coalesce de P2/P3 (3 auth + 3 acquirer + 3 merchant) y el procedimiento de agregar-sin-recrear (con el gotcha de re-ejecutar si quedan vacías).
- Next: Usuario agrega columnas → recrea P2/P3 con coalesce → re-ejecuta barridas del P12. Luego Barrida 4/5.

### ID:14-WORK.P21 · 2026-06-05
- Commit: 9a7656f
- Files: frontend/pages/simetrik-dota-test.html
- Changed: A pedido del usuario, marcado en ROJO en cada punto qué actualizar (para no equivocarse). Añadida clase CSS .box.redo (rojo --rd #ef4444) + .redo-tag (badge rojo). Insertado: (a) checklist rojo arriba de todo "SI YA AVANZASTE" con los 4 ítems en orden; (b) badge 🔴 ACTUALIZAR + caja roja en Paso 0b (agregar columnas a la unión sin recrear), Punto 2 (recrear GTWC coalesce), Punto 3 (recrear acquirer coalesce), Punto 12 (re-apuntar llave auth a GTWC + Barrida 3 NUM_EST/FORIG_COMPRA/MOV_CREATED_DATE crudo). Versión v6→v7. Los puntos OK (1,4-11,12b,13-16) sin marca.
- Next: Verificar render del rojo en vivo. Usuario ejecuta las actualizaciones en orden.

### ID:14-WORK.P22 · 2026-06-05
- Commit: ee3e156
- Files: frontend/data/simetrik-kb.json (NEW) · frontend/pages/simetrik-kb.html (NEW) · frontend/work.html (+tab) · PROMPT_14-WORK_SIMETRIK-INGEST.md (NEW)
- Changed: Construido el "Simetrik Knowledge Engine" (profesionalización del módulo). 3 piezas: (1) data/simetrik-kb.json — base estructurada {id,cat,title,body,evidence,source,date,confidence} + meta.ingested_sources para capturar solo lo nuevo; sembrada con 20 entradas verificadas de esta sesión (4 reglas de oro, plataforma/UI, catálogo de funciones, gotchas incl. coalesce CAPTURE 93%, patrones de conciliación DOTA, casos/dataset, calendario AR). (2) pages/simetrik-kb.html — visor self-contained: fetch del JSON, buscador, filtros por categoría/confianza, tarjetas con evidencia, + botón "Copiar Prompt de Ingesta" embebido. (3) Pestaña "🧠 Simetrik KB" en work.html (iframe). + PROMPT_14-WORK_SIMETRIK-INGEST.md. Loop: usuario dropea en cuaderno "Simetrik · Ingesta" (1 drop=1 página) → prompt de ingesta → Claude lee páginas no-ingeridas vía Chrome MCP (texto+capturas+links Drive) → extrae atómico con evidencia → dedupe → append a JSON + ingested_sources → commit. Drop zone = notebook (reusa texto+imágenes+sync ya probados).
- Next: (a) Crear el cuaderno "Simetrik · Ingesta" (el usuario o yo vía Chrome MCP inject) · (b) primera ingesta real de una reunión · (c) verificar render live del KB.

### ID:14-WORK.P23 · 2026-06-05
- Commit: 6d1a2f8
- Files: frontend/work.html · frontend/css/work.css
- Changed: (a) Creado cuaderno "Simetrik · Ingesta" vía Chrome MCP (inyección en work_nb_meta/work_nb_data del usuario + página instructiva, sincroniza por el proxy). (b) Rediseño de navegación: las 16 pestañas horizontales pasaron a 3 DESPLEGABLES por función — 📚 Aprender (Empieza Aquí/Simulador/Playbook/Guía Simple/Tutor/Notas Curso) · 🧠 Trabajo & Conocimiento (Simetrik KB/Prueba DOTA/Diccionario/Casos/Errores/Aprendizajes/KB) · 🗂️ Registro & Capturas (MOIF/Cuadernos/Notas Workflow). CSS .navbar/.navdd/.navdd-menu en work.css; JS de toggle+active-label en work.html (reusa el switch de .tab existente, los items mantienen data-p). El desplegable activo se resalta y muestra la sección actual. work.css ?v=p21→p22. Minimalista, sin paneles eliminados (cero pérdida de data).
- Next: Verificar dropdowns en vivo. Primera ingesta real cuando el usuario dropee una reunión.

### ID:14-WORK.P24 · 2026-06-05
- Commit: d6fcf81
- Files: frontend/data/simetrik-kb.json
- Changed: CONSOLIDACIÓN tanda 1 — el cerebro absorbe el conocimiento Help-Center/curso ya existente en el módulo (que yo había ignorado al sembrarlo). Extractor Node (eval de los arrays JS reales, no regex frágil): GUIDE de simetrik-guia.html (47 how-tos módulo por módulo: ruta+pasos+warn) → cat plataforma/funcion/conciliacion; SEED_DICT de work.js (301 términos, 2 dupes deduped) → glosario. Brain pasó de 19 a 367 entradas (regla 4, plataforma 38, funcion 8, gotcha 2, conciliacion 12, caso 2, glosario 301). Cada entrada con su fuente (Guía/Diccionario · curso Simetrik) + link Help Center cuando aplica.
- Next: Tanda 2 = Simulador App (simetrik-app.html, ~129 hotspots tip()) + Playbook (secciones). Luego: que las secciones del módulo se alimenten del brain (invertir flujo, fase posterior). Principio operativo: consultar/actualizar el brain ANTES de cualquier cosa Simetrik.

### ID:14-WORK.P25 · 2026-06-05
- Commit: 3327bd6
- Files: frontend/data/simetrik-kb.json
- Changed: CONSOLIDACIÓN tanda 2 — Simulador App (58 tooltips tip(cat,título,desc,ej,consejo,code), parser string-aware) → plataforma; Playbook Ficohsa (10 lecciones, pares h3+alead) → conciliacion. Brain de 367 a 435 entradas. Breakdown final: regla 4, plataforma 96, funcion 8, gotcha 2, conciliacion 22, caso 2, glosario 301. El cerebro Simetrik queda COMPLETO: Diccionario+Guía+Simulador+Playbook (curso/Help Center) + hallazgos DOTA, todo con source+evidence, categorizado. JSON válido.
- Next: FASE 2 (pendiente, mayor): que las secciones del módulo se ALIMENTEN del brain (invertir flujo — Diccionario/Guía/Simulador renderizando desde simetrik-kb.json). Principio: el brain es la única fuente de verdad; consultar/actualizar SIEMPRE primero.

### ID:14-WORK.P26 · 2026-06-05
- Commit: f29b77a
- Files: frontend/data/simetrik-kb.json · frontend/js/work.js · frontend/work.html
- Changed: FASE 2 (tanda 1) — el Diccionario se alimenta del cerebro, lossless y sin romper nada. (a) Enriquecí las 301 entradas glosario del cerebro con `dcat` (sub-categoría original acro/term/process/platform/software) para no perder el agrupamiento. (b) work.js: nueva seedDictFromBrain() (async, aditiva por sid, mapea dcat→cat, parsea term/en del title, fallback con try/catch — si el fetch falla no rompe; términos existentes por sid no se duplican), llamada en init() tras seedDict(). Usa work_eco_dict_brain_v como marca de versión → cuando ingese un término nuevo al cerebro, aparece solo en el Diccionario. (c) work.js ?v=p23→p24. CRUD/sync del usuario intactos. node --check OK. HALLAZGO: la consolidación había aplanado el dict cat a 'glosario'; por eso enriquecí con dcat antes de alimentar (si no, se perdía el agrupamiento — mismo riesgo aplica a Guía/Simulador, que se harán enriqueciendo primero).
- Next: Fase 2 tanda 2 = Guía Simple (página estática, sin CRUD) alimentándose del cerebro, enriqueciendo primero las entradas guia- con sus campos ricos (path/steps/analogy). Luego Simulador.

### ID:14-WORK.P27 · 2026-06-05
- Commit: fdf9cd3
- Files: frontend/pages/simetrik-app.html · frontend/pages/simetrik-guia.html · frontend/data/simetrik-kb.json
- Changed: QA + Fase 2 tanda 2. (a) FIX error Simulador: "Crear recurso" listaba "Reconcilable Group" y "VLOOKUP" (inexistentes) → corregido a las opciones reales (Fuentes, Agrupaciones, Concil. estándar, Concil. avanzada, Fuentes de apertura, Unión de fuentes) en los 2 lugares (scr desc + tip); ahora coincide con el cerebro. (b) Fase 2 Guía Simple: enriquecí las 47 entradas guia- del cerebro con detail (objeto rico completo: path/steps/analogy/simple/usoCases/formats/warn/tags/doc/icon/dota); la página simetrik-guia.html ahora SE ALIMENTA del cerebro (fetch ../data/simetrik-kb.json → GUIDE = entries.guia-.detail → renderAll), con el array embebido como fallback offline. const GUIDE→let GUIDE. (c) Integridad del cerebro verificada: 435 entradas, 0 ids dup, todas con evidence+source. version 2026-06-05.6.
- Next: Fase 2 Simulador App (mismo patrón: enriquecer + alimentar desde cerebro). Considerar eventualmente quitar arrays embebidos (hoy fallback). Primera ingesta real de reunión.

### ID:14-WORK.P28 · 2026-06-05
- Commit: 38cd350
- Files: frontend/pages/simetrik-app.html · frontend/data/simetrik-kb.json
- Changed: FASE 2 FINAL — el Simulador App se alimenta del cerebro. Enriquecidas las 58 entradas sim- con detail {cat,title,body,use,tp} (re-parse de los tip()). En simetrik-app.html: carga el cerebro al boot (BRAIN_SIM, map por title) y openTip() usa el detail del cerebro si hay match, con fallback inline (HOT). NO se tocaron las 24 pantallas ni los 59 tip() — solo openTip + el loader. Así el contenido de los tooltips es canónico del cerebro. version 2026-06-05.7. → Las 3 secciones de conocimiento (Diccionario, Guía, Simulador) YA se alimentan del cerebro. Fase 2 completa.
- Next: Quitar arrays/tooltips embebidos (hoy fallback) si se quiere depurar · absorber work_kb legacy · primera ingesta real de reunión.

### ID:14-WORK.P29 · 2026-06-09
- Commit: ec6634e
- Files: frontend/data/simetrik-kb.json
- Changed: PRIMERA INGESTA REAL. Fuente: cuaderno "Simetrik · Ingesta" pág "09/06/2026. Inside the V 2.8 Session 1/3" (id 1781019060658), leída vía Chrome MCP. Transcripción ~80% ruido de auto-subtitulado (Foreign speech, palabras sueltas); extraído SOLO lo coherente con cita verbatim: 5 entradas sobre Data Sets de V2.8 → (1) glosario "Data Set" (dcat platform), (2) no se auto-actualiza al cambiar columnas, (3) agregar columna OK / renombrar-eliminar rompe, (4) hasta 5 schedules mín 15 min, (5) gotcha charts no cargan al publicar nueva versión (hipotesis, sin respuesta clara). Cerebro 435→440. Page id en ingested_sources (no se reprocesa). version 2026-06-09.1. Resto (Operation Centers, etc.) demasiado degradado → no se inventó.
- Next: pedir transcript más limpio o el link de grabación para extraer Operation Centers y el resto de V2.8. Sesiones 2/3 y 3/3 pendientes.

### ID:14-WORK.P30 · 2026-06-09
- Commit: 541dc04
- Files: PROMPT_14-WORK_SIMETRIK-INGEST.md · frontend/pages/simetrik-kb.html
- Changed: Regla del usuario — GATE DE VALIDACIÓN obligatorio ANTES de cada ingesta (porque el cerebro alimenta las secciones, info dudosa daña el módulo). Agregado al prompt de ingesta (.md + embebido): 4 criterios (Coherente / Racional-no-contradictoria / Con evidencia / Confirmada-vs-hipótesis-quarantine). Hipótesis NO usan dcat/detail (no alimentan Diccionario/Guía/Simulador, solo vista KB). "Mejor cerebro chico y confiable que grande y dudoso". Grabado en memoria. Revisión P29 vs gate: las 4 entradas verificado pasan (verbatim de Simetrik); la hipótesis (charts) cumple (cat gotcha, sin dcat/detail, etiquetada, no alimenta secciones).
- Next: aplicar el gate en toda ingesta futura; reportar siempre lo descartado.

### ID:14-WORK.P31 · 2026-06-10
- Commit: ccae605
- Files: frontend/pages/simetrik-dota-test.html · frontend/work.html · frontend/js/work.js
- Changed: LIMPIEZA + REESCRITURA Paso 12 (v8). (a) Eliminados todos los parches en capas: checklist rojo "SI YA AVANZASTE" del inicio, cajas/tags 🔴 ACTUALIZAR de P0b/P2/P3/P12 (su contenido ya está en las fórmulas canónicas). (b) FIX dato roto: "Crear la conciliación" decía Lado A = grupo DOTA_Estandar (inexistente) → ahora Lado A = UNION_DOTA + filtro/segmentación TIPO_COMERCIO=ESTANDAR; también corregida la caja Verificá del 8.2 que lo referenciaba. (c) B1 consolidada: 3 cajas warn apiladas → pasos canónicos a/b (grupos compensables MOV_OPERATION PAYMENT/REFUND con nombres obligatorios + tabla de reglas con ABS_MONTO y campo Tolerancia real). (d) Caja única "tipo de barrida se elige al crear y queda fijo" + guardar antes de ejecutar. (e) B4 ahora ACCIONABLE: tabla con tolerancia 1/días + regla de desigualdad FORIG_COMPRA>=MOV_CREATED_DATE si existe el operador (hipótesis razonada, datos 33/0). (f) B5 accionable: agrupar FD por LOTE SUMA(IMPORTE) vs detalle DOTA, validar con vista previa. (g) Módulo: tab "📚 KB Simetrik" renombrada a "📄 Apuntes libres" (colisión de nombre con 🧠 Simetrik KB) · prompt Modo 4 ahora referencia el cerebro (simetrik-kb.json) como fuente canónica · work.js p24→p25.
- Next: usuario ejecuta B1→B5 con la guía limpia; confirmar direccionalidad B4 y llave de lote B5 con trainer/práctica; ingerir al cerebro lo que salga de ejecutar las barridas.

### ID:14-WORK.P32 · 2026-06-10
- Commit: ccb1fdc
- Files: frontend/pages/simetrik-dota-test.html
- Changed: Auditoría pedida por el usuario sobre la reescritura v8: (a) Re-escaneado el Drive completo — carpeta raíz sin cambios desde 2026-06-04 (los 10 archivos ya analizados: DB_DOTA_v3, Reporte_FD_v3, Parametria_v2, calendario nuevo+viejo, Documento Guia, Mapeo_Features, best-practices) y carpeta Imagenes sin archivos nuevos desde 2026-06-05 (Barridas.png fue el último). Cero material sin procesar. (b) Verificado que el contexto "no tengo PURCHASE_AUTHORIZATION_CODE en la unión" sobrevivió la limpieza: la caja 📋 del Paso 0b (agregar columnas sin recrear) quedó intacta. (c) Reforzado el prerrequisito 1 del Paso 12 con el recordatorio inline: el coalesce requiere las 3 columnas de auth en Union_DOTA — si falta, agregar desde el origen + Ejecutar cambios, NO recrear (las columnas están en la fuente aunque no se vean en la unión).
- Next: usuario ejecuta B1→B5 con guía v8; ingerir resultados al cerebro.

### ID:14-WORK.P33 · 2026-06-10
- Commit: 6109e6d
- Files: frontend/pages/simetrik-dota-test.html
- Changed: Validación a raíz de la duda del usuario sobre P2 (¿por qué la excepción Cabal usa CAPTURE y no PURCHASE?) + preparación para arranque desde cero en la carpeta del Trainer (v9). Validado contra dota.xlsx (56.777 filas): las 20 filas Cabal viven TODAS en el bloque CAPTURE (PURCHASE_* vacío), las 20 tienen CAPTURE_AUTHORIZATION_CODE="000000", y "000000" NO existe en PURCHASE ni AUTH en ninguna fila → una excepción sobre PURCHASE atraparía cero filas. Además la guía oficial lo nombra textual (CAPTURE). Fórmula P2 queda como está. Agregada caja ❓ "validado a raíz" en P2 con la evidencia. phase-sub de Reconstrucción actualizado para arranque limpio en carpeta del Trainer (corregida una afirmación sin evidencia sobre mover recursos antes de commitear). v8→v9.
- Next: usuario reconstruye desde cero en la carpeta del Trainer siguiendo el orden macro; reportar resultados de las barridas para ingerir al cerebro.

### ID:14-WORK.P34 · 2026-06-10
- Commit: a8ff812
- Files: CLAUDE.md · frontend/work.html · frontend/pages/simetrik-dota-test.html · frontend/pages/simetrik-kb.html · frontend/js/module-prompts.js · PROMPT_14-WORK_SIMETRIK-PURO.md · frontend/prompts.html
- Changed: AUDITORÍA INTEGRAL del segundo cerebro. Salud verificada: sintaxis JS OK (work/cloud-sync/nb-shared), cerebro 440 entradas 0 dups, 16 tabs ↔ 16 panels sin huérfanos, deploy.yml correcto (Pages desde main + workflow_dispatch), SYNC_REGISTRY cubre todo (solo marcas de versión locales, por diseño). FIXES: (a) CLAUDE.md sección 14-WORK reescrita (decía 11 pestañas; ahora documenta cerebro+ingesta+gate+3 desplegables+keys actuales). (b) work.html hero y tarjeta 3-fases actualizados a la arquitectura real (decían mini-curso/Copilot; ahora segundo cerebro/3 menús/Ingesta). (c) CSS muerto .box.redo/.redo-tag eliminado de la guía DOTA. (d) module-prompts.js 14-WORK actualizado (decía 13 tabs → Second Brain con cerebro). (e) PROMPT_SIMETRIK-PURO.md con FUENTE CANÓNICA (paridad con Modo 4 embebido). (f) prompts.html cache-bust de module-prompts.js. DISEÑO KB viewer: contadores por categoría en chips, badge dcat, botón 📋 copiar por entrada, contador de resultados, hover lift.
- Next: verificación live post-deploy. Ingesta de sesiones V2.8 2/3 y 3/3 cuando lleguen.

### ID:14-WORK.P35 · 2026-06-11
- Commit: 8d9972e
- Files: frontend/pages/simetrik-dota-test.html · frontend/data/simetrik-kb.json
- Changed: GAP real reportado por el usuario: la guía mencionaba ABS_MONTO en P12 pero NUNCA tuvo paso formal de creación, y B3/P14 decían ABS(MOV_AMOUNT) en vez del nombre de columna. Fixes (v10): (a) NUEVO Paso 11b · ABS_MONTO — columna de transformación en Union_DOTA, salida Número, fórmula ABS(MOV_AMOUNT), con caja 🚨 explicando por qué MOV_AMOUNT directo rompe todo (con signo: B1/B2 cero cruces +700≠−700; B3/B4 los 296 REFUNDs no cruzan contra IMPORTE siempre positivo de FD) y que MOV_AMOUNT cruda se conserva para el saldo P13. (b) CHECKLIST MAESTRO DE COLUMNAS en Paso 0b: por unión, qué se SELECCIONA del origen (Union_DOTA 16 cols, FD 8+1, Parametria 2, Calendario 8) vs qué se CREA (transformaciones/BuscarV con paso y tipo). (c) Consistencia: B3 tabla, caja evidencia B3, prereq 2 de P12 y métrica del tablero P14 ahora referencian ABS_MONTO (Paso 11b). (d) Cerebro +1: gotcha-abs-monto (441 entradas, v2026-06-11.1).
- Next: usuario crea ABS_MONTO y sigue con las barridas; B4 direccionalidad y B5 lote siguen abiertas.

### ID:14-WORK.P36 · 2026-06-11
- Commit: 0930338
- Files: frontend/js/cloud-sync.js · frontend/js/nb-shared.js · frontend/js/work.js · frontend/js/notes-nb.js · frontend/systems_logic.js · 19 HTML (cache-bust)
- Changed: OVERHAUL DEL MOTOR DE SYNC tras la pérdida de datos de hoy (post-mortem: el LWW por key completa pisó páginas no subidas del PC laboral; el autosave re-sellaba updated sin cambios y envenenó el merge; el upload de imágenes a Storage solo se intenta al pegar y nunca se reintenta; cloud-sync.js se cargaba SIN cache-bust en 17 páginas → motores viejos cacheados). FIXES: (1) cloud-sync.js: MERGE ESTRUCTURAL por página para los 6 keys de cuadernos (work/not/sys × meta/data) — _mergeNbData (por nbId→por page.id, gana updated más reciente, empate gana cloud, unión sin pérdida) + _mergeNbMeta (por id) — cableado en los 3 caminos: _reconcileKey (push del merge si difiere del cloud), handleRealtimeChange (lo remoto entra SIEMPRE sin pisar local; push si el merge aporta; converge sin loop) y forceResyncFromCloud (ni el force pisa páginas). (2) Guard anti-resellado en _commitNow de work.js + notes-nb.js + systems_logic.js (sin cambios reales → no re-stamp; regla CLAUDE.md de replicar en los 3). (3) nb-shared.js: cola nb_pending_uploads (local-only) — cloudUploadAttachment encola al fallar (deslogueado/offline) y retryPendingUploads() reintenta en sb:signed_in y al cargar con sesión. (4) Cache-bust: cloud-sync.js?v=p2 en TODAS las páginas (19), nb-shared p21→p18sync... (nb-shared.js?v=p18, notes-nb p18, systems_logic p18, work.js p26). Sintaxis OK en los 5 JS.
- Next: probar cross-device real (editar en un PC → ver merge en el otro) · monitorear convergencia realtime · considerar merge estructural también para work_moif_meetings (array con id+date).

### ID:14-WORK.P37 · 2026-06-11
- Commit: a3e3dd5
- Files: frontend/js/cloud-sync.js · frontend/work.html · 19 HTML (cache p3)
- Changed: PORT DEL MODELO FAMILY-SYSTEM al motor de da-2026 (el usuario señaló https://mikel696.github.io/family-system como referencia de sync instantáneo; leí su cloud-sync.js: per-record rows + outbox persistente + realtime granular + _tryRefreshSession). Portado: (1) OUTBOX PERSISTENTE 'cloud_outbox' (local-only): el proxy de setItem encola TODO cambio real (aunque estés deslogueado o en hidratación — antes la línea `if(_syncing||!_initialSyncDone) return` descartaba el día entero de trabajo sin sesión); pushState confirma (éxito → sale de la cola) y al loguear fullSyncAll→_flushOutbox sube lo pendiente. (2) NO-OP GUARD universal en el proxy (prev===value → ni stamp ni push: mata el timestamp-poisoning de los re-saves de arranque en TODOS los módulos). (3) AUTO-REFRESH DE SESIÓN en pushState (patrón _tryRefreshSession): error JWT/401 → SB.auth.refreshSession() + reintento; si muere → evento cloud:session_expired. (4) UI: badge #syncOutboxBadge en work.html (⏳ N cambios en cola / 🔒 sesión vencida) via eventos cloud:outbox_change. (5) CLOUD.flushOutbox + CLOUD.outboxCount expuestos. Cache cloud-sync p2→p3 en 19 páginas. NO portado (documentado como fase futura): tablas per-record para cuadernos (migración de schema).
- Next: verificar outbox en vivo cross-device · fase futura: tabla nb_pages per-record (modelo family-system completo).

### ID:14-WORK.P38 · 2026-06-11
- Commit: 8d7a1f9
- Files: frontend/js/cloud-sync.js · frontend/work.html · 19 HTML (cache p4) · [migración de datos in-page, sin archivo]
- Changed: CAUSA RAÍZ FINAL del "no sincroniza": QuotaExceededError — localStorage 9.65MB/10 (work_nb_data 6MB por imágenes base64 LEGACY embebidas en bodies de páginas viejas: Mi Cargo 1.8MB, Jhonattan 1.3MB, Ficohsa 1.1MB...). El merge funcionaba pero el write local explotaba y abortaba TODO fullSyncAll. (a) MIGRACIÓN ejecutada in-page vía Chrome MCP: 11 imágenes inline + 8 chips gordos → IndexedDB + chip con thumbnail ~10KB (canvas 280px JPEG 0.5) + 16 blobs subidos a Supabase Storage (cross-device). localStorage 9.65→4.39MB; work_nb_data 6.0→1.5MB; not_nb 1.2→0.8; sys 0.9→0.5. (b) MOTOR: _safeWrite() quota-guard en TODOS los caminos de escritura (reconcile estructural/cloud-wins/cloud-new, realtime ×2, forceResync) — una key gorda ya no aborta la sync, emite cloud:quota_exceeded; badge rojo en work.html. (c) POLLING DE RESPALDO: cada 60s (pestaña visible) reconcile liviano de las 6 NB keys — sync cross-device funciona aunque realtime esté caído. (d) Confirmado vía test: realtime NO entrega eventos (publicación no incluye app_state) → pendiente que el usuario corra: alter publication supabase_realtime add table public.app_state;
- INCIDENTE COLATERAL: el slim re-stampeó updated en páginas tocadas → la "Prueba Dota" local (contenido 06-05) le ganó a la edición 21:52Z del PC laboral en el merge y la pisó en cloud. Esa versión vive SOLO en el laboral → rescate modo-avión instruido (desconectar red → abrir work.html → copiar contenido → reconectar). LECCIÓN: las migraciones NUNCA deben re-stampear updated si el contenido textual no cambió.
- Next: usuario corre el SQL de realtime · rescate Prueba Dota en laboral · Ctrl+F5 en laboral (motor p4 + payload flaco le alivia su quota también).

### ID:12-FIN.P1 · 2026-08-11
- Commit: 586d452
- Files: frontend/js/fin-colombia.js (NUEVO · ~380 líneas IIFE) · frontend/finance.html (shell de 8 secciones + router) · frontend/css/finance.css (+~110 líneas) · frontend/js/cloud-sync.js (SKIP_KEYS) · 19 HTML cache-bust p16
- Changed: Fase 1 del rediseño de 12-FIN a Centro Financiero. Investigación previa de 24 endpoints probados con curl (headers CORS incluidos, nada asumido). Sirven directo sin llave: datos.gov.co Socrata, Banrep mercado cambiario (dólar intradía), CoinGecko, Binance, Banco Mundial, SEC. Con llave gratis y CORS: Finnhub (60/min), Twelve Data (800/día). Descartados: Yahoo (429), Alpha Vantage (25/día).
  - **`FINCO`**: Banrep DataSerie entrega TRM + tasa de política + IBR + inflación + PIB + desempleo + cuenta corriente con historia en UNA llamada (sin CORS → proxy de 7-NEW); datos.gov.co como fuente primaria de TRM y respaldo. `Promise.allSettled` para que la caída de una no tumbe a la otra. Caché 6h, offline muestra el último valor con su fecha.
  - **Tres defectos propios detectados AL VERIFICAR y corregidos antes de commitear**: (a) la TRM se atribuía a Banrep siendo de datos.gov.co; (b) los deltas comparaban primer vs último punto de 60 registros → ventanas de 3 meses a 15 años según la cadencia de cada serie, incomparables entre sí; (c) % sobre la cuenta corriente negativa. Fix: ventana uniforme de 12 meses con el período real impreso, y puntos en vez de % cuando hay negativos.
  - **cloud-sync**: `fin_mkt_cache` y `fin_ui_prefs` a SKIP_KEYS — `fin_` está en DYNAMIC_PREFIXES y los habría subido solos. Verificado por comportamiento (outbox), no leyendo código.
- Verificación: 7/7 series en vivo con errors:[] · Mi plata intacta (5 tabs/KPIs/form/meta) · calculadora real 9,5% → +3,47% con IPC 6,03% · 13-NOT/14-WORK/10-SYS/1-IND sin regresión, todos en p16 · desplegado y confirmado en el live site.
- Next: Fase 2 — comparador de CDT (`axk9-g2nh`) y de crédito (`yvb2-ppaa`) banco por banco + screener de FIC (`qhpu-8ixx`, 2,88M filas) CON los filtros anti-espejismo por defecto: el orden crudo por rentabilidad pone primero un fondo forestal EN LIQUIDACIÓN con 1 574% anual y 12 inversionistas. Filtros sanos (tipo general, >1000 inversionistas, sin liquidación) dan el cuadro real. Fase 3 — global + radar SECOP II (`p6dx-8zbt`). Fase 4 — laboratorio, muro de noticias y foto diaria vía GitHub Action. NO rehacer la Fase 1.

### ID:12-FIN.P1 (CONT · resiliencia) · 2026-08-11
- Commit: 15e183d + 0abd902
- Files: scripts/fetch-macro.mjs (NUEVO) · .github/workflows/macro-snapshot.yml (NUEVO) · frontend/data/macro-co.json (NUEVO, generado) · frontend/js/fin-colombia.js · frontend/finance.html (p3)
- Changed: **El preview local mintió.** Verde en localhost, pero el live site salió con 1 de 7 indicadores. Medición: allorigins da 200 sin cabecera `Origin` (curl) y **522 con `Origin: mikel696.github.io`** (navegador); Banrep directo 200. Lección: un proxy público gratuito no puede estar en el camino crítico, y **verificar en preview no equivale a verificar en producción** — el origen cambia el resultado.
  - Foto diaria del lado servidor vía GitHub Action → `data/macro-co.json` leído desde el MISMO origen: sin proxy, sin CORS, sin llaves, y viaja con la página (offline real).
  - Orden de carga por confiabilidad: foto del repo → datos.gov.co directo → proxy como extra. El subtítulo declara el origen ("al minuto" vs "Foto del <fecha>").
  - Segundo bug hallado al verificar en vivo: el caché de 6h congelaba el panel degradado. TTL ahora depende de la salud: 6h si completa, 15 min si parcial; caché sin `snapshotAt` cuenta como degradado y se cura solo.
- Verificación EN PRODUCCIÓN: allorigins + datos.gov.co rotos a propósito → 7/7 visibles · caché envenenado de hace 30 min → se cura solo a 7/7 · última corrida con el proxy caído de verdad (`live:false`) → panel completo desde la foto, rotulado con su fecha.
- Next: extender la foto a DTF/UVR/TES es barato (mismo script). Para Fase 2, las consultas pesadas de FIC (2,88M filas) conviene precomputarlas en la misma Action en vez de pegarle a Socrata desde el navegador.

### ID:PROJECT.P1 (MANDATO · mantenimiento continuo) · 2026-08-11
- Commit: 9871f83 · 438b055 · fb27d1d · ac244a8
- Scope: 1-IND (pages/configurar.html) · 12-FIN (finance.html, fin-calc.js, fin-world.js, fin-colombia.js) · infra (cloud-sync.js SKIP_KEYS, 28 páginas cache-bust) · CI (.github/workflows) · docs (CLAUDE.md, PROMPT_MANTENIMIENTO.md)
- Changed: Se asume el mandato de mantenimiento continuo y se ejecuta la cola por prioridad.
  1. **Backup real** — export capturaba 1 clave de 21 (filtro `da2026_`); import escribía sin preguntar y restauraba `_cloud_ts`, lo que dejaba a la nube deshacer el restore; `resetAll` solo borraba el namespace legacy. Los tres medidos y arreglados. Cierra el hallazgo #2 de la auditoría (cache-bust en las 9 páginas de pages/); las 28 van en lockstep.
  2. **Calculadora flotante** — 10 funciones financieras con explicación llana, alimentadas por FINCO, accesible desde cualquier sección y scroll. Matemática verificada contra cálculo independiente.
  3. **Panel global** — recolector server-side (Yahoo 429 al navegador pero OK desde servidor; RSS sin CORS) → data/world.json. 12 instrumentos + 24 titulares, agrupados con criterio colombiano.
  4. **Proxy eliminado** — allorigins fuera del proyecto. Única fuente externa en el navegador: datos.gov.co.
  5. **Marco de trabajo** — CLAUDE.md con el mandato (P0-P4 + 7 reglas de oficio) y PROMPT_MANTENIMIENTO.md autocontenido con chequeo de salud ejecutable (se corrigió el paso que usaba `gh`: no está instalado).
- Defectos propios hallados AL VERIFICAR (no al escribir): variación diaria calculada con `chartPreviousClose` (−0,08% vs −0,28% real) · entidades numéricas crudas en titulares · caché degradado congelado 6h · TRM atribuida a Banrep siendo de datos.gov.co · deltas con ventanas incomparables entre series.
- Verificación: en PRODUCCIÓN, no en preview. HOY 7/7 · GLOBAL 5 grupos/12 instrumentos/24 titulares/enlaces seguros · calculadora operativa desde otra sección estando scrolleado · Mi plata intacta · 13-NOT/14-WORK/10-SYS/1-IND sin regresión.
- Next: **12-FIN Fase 2** (comparador CDT `axk9-g2nh` + crédito `yvb2-ppaa` + screener FIC `qhpu-8ixx` con filtros anti-espejismo por defecto). Luego: radar SECOP II (`p6dx-8zbt`) · hallazgo #3 (namespace `da2026_` sin sync) · medir cuota de localStorage · Vista HOY en 1-IND. NO rehacer nada de lo de arriba.

### ID:12-FIN.P2 (Fases 2 y 3) · 2026-08-11
- Commit: 46099e6 · e48e2a6
- Files: scripts/fetch-credit.mjs (NUEVO) · frontend/data/credit-co.json (NUEVO) · frontend/js/fin-co.js (NUEVO) · frontend/js/fin-radar.js (NUEVO) · frontend/js/finance.js (fix colisión) · css/finance.css · finance.html · workflow
- Changed: Fase 2 (Colombia: CDT / crédito+usura / screener FIC / pensiones) y Fase 3 parcial (Radar: SECOP II + reglas de vigilancia). 12-FIN queda en 5 de 8 secciones vivas.
  - **Elección de implementación MEDIDA por recurso**: FIC 895ms y CDT 1,2s y SECOP 627ms → en vivo; crédito 4,8s → precomputado en la Action. No se asumió: se cronometró.
  - **Dataset trampa**: `yvb2-ppaa` (el que figuraba en la investigación inicial como fuente de tasas de crédito) llevaba congelado desde junio 2022. Sustituido por `qzsc-9esp` + `pare-7x5i`. Regla nueva: verificar max(fecha) antes de construir.
  - **Tope de usura** (TIBC × 1,5) como dato destacado: casi nadie lo conoce y sirve para saber si te están cobrando ilegalmente. Hoy consumo: 29,66%.
  - **Bug de raíz arreglado**: `finance.js` escuchaba `[data-del]` en todo el documento → borrar una alerta del Radar disparaba `FIN.del()` + push espurio a Supabase. Listener acotado; Radar renombrado a `data-alert-del`.
  - **NO se construyó el calendario económico**: sin fuente verificada de fechas 2026 del Banrep/DANE. Se prefirió el hueco a inventarlo.
- Verificación EN PRODUCCIÓN: CDT Pichincha 13,52%/+7,07% real · usura 29,66% · fondos Credicorp 37,26% con 2.229 inversionistas · Radar 40 procesos/$3,1 mil M · borrado de transacciones intacto tras el fix.
- Next: Inteligencia (directorio curado) · Laboratorio (bitácora de tesis) · Ajustes (llaves de API locales). NO rehacer Colombia ni Radar.

### ID:12-FIN.P3 (verificación + noticias + briefing) · 2026-08-12
- Commit: d395137 · cdb63d3
- Files: .github/workflows/macro-snapshot.yml · scripts/fetch-world.mjs · frontend/js/fin-news.js (NUEVO) · fin-calc.js · fin-colombia.js · cloud-sync.js · css/finance.css · finance.html
- Changed:
  1. **FALLO CRÍTICO encontrado al verificar lo programado**: la Action corría, commiteaba (25bcfaf, 12:02 UTC) y el sitio seguía sirviendo la foto del día anterior 4 horas después. Causa: GitHub NO dispara workflows con push hechos con GITHUB_TOKEN (anti-recursión), así que `pages-build-deployment` nunca se lanzaba. **El fallo era invisible porque mis propios push sí desplegaban** — cada verificación tras un commit mío salía verde. Fix: `pages: write` + POST a /pages/builds. **DESPLEGADO PERO NO PROBADO**: solo se ejercita en la próxima corrida del bot o con «Run workflow» manual.
  2. **Burbuja de noticias** a la izquierda (left 70, junto a la calculadora en 14, exclusión mutua). Solo 5 del día, elegidas en servidor por impacto sobre el bolsillo, con el motivo visible en cada nota. Punto rojo de no-leído por día.
  3. **Briefing del día** en Hoy: cruza FINCO + finance.js + fin-radar, que estaban aisladas. Reglas cumplidas con salto al Radar, tu mes, en dólares, y lo que la inflación le come a tu ahorro quieto.
- Defectos propios hallados al probar: puntuar noticias DESPUÉS de recortar a 24 (elegía de un subconjunto) · MAX_PER_FEED=6 dejaba solo 1 noticia calificada.
- Verificado en PRODUCCIÓN: 7 indicadores con corte 12-ago · TRM 3.121,07 · 5 noticias con motivo · burbujas sin solaparse · briefing con datos sembrados (US$ 801, ahorro pierde 48.210/año).
- Next: **confirmar que el fix de Pages funciona** revisando mañana que `generatedAt` en el sitio traiga la fecha del día sin push manual. Luego: Inteligencia · Laboratorio · Ajustes.

### ID:12-FIN.P4 (Fase 4 · módulo completo) · 2026-08-12
- Commit: 9cdbdaf
- Files: frontend/data/fin-sources.json (NUEVO) · js/fin-intel.js · js/fin-lab.js · js/fin-cfg.js (NUEVOS) · scripts/_prev.mjs (NUEVO) · los 3 recolectores · fin-colombia.js · cloud-sync.js · css · finance.html
- Changed: 12-FIN queda COMPLETO en 8 de 8 secciones. Inteligencia (25 fuentes con cada URL comprobada, con "qué es" y "cuándo te sirve", puente a 13-NOT) · Laboratorio (bitácora de tesis que congela el contexto de mercado y te confronta después — lo único que enseña a decidir en vez de informar) · Ajustes (salud de datos + llaves locales por seguridad).
- **El hallazgo de la sesión**: el panel de salud, a los dos minutos de existir, destapó que `credit-co.json` tenía CERO usura en producción — una caída transitoria hizo que el recolector sobrescribiera el archivo bueno con uno incompleto. La guardia solo protegía el caso "falla todo"; el daño lo hace el éxito parcial. Fix en dos niveles: preservar sección vacía Y fusionar elemento por elemento (al probar el primer fix apareció el mismo bug a menor escala: 3 de 4 tipos de crédito y el cuarto desaparecido).
- Bug propio: `FININTEL.init()` ponía `_loading=true` antes de llamar a `load()`, cuyo guard empieza con `if (_data || _loading) return` — la bandera anti-duplicados impedía la primera carga.
- Verificado en producción: 8 secciones, 25 fuentes (1 marcada sin verificar), usura 29,66% con 7 modalidades recuperadas, Ajustes con las 3 fuentes al día.
- Next: 12-FIN no necesita más secciones. Lo que sigue es de OTROS módulos — Vista HOY en 1-IND (blueprint listo), hallazgo #3 de PROJECT.P1 (namespace da2026_ sin sync), medir cuota de localStorage. NO agregar secciones a 12-FIN por agregar: el módulo ya cubre su función.

### ID:5-JOB.P1 (radar de vacantes) · 2026-08-13
- Commit: bcaf1ac
- Files: scripts/fetch-jobs.mjs (NUEVO) · frontend/data/jobs-companies.json (NUEVO) · frontend/data/jobs-feed.json (NUEVO) · frontend/js/jobs-radar.js (NUEVO) · jobs.html · css/jobs.css · workflow
- Changed: **5-JOB no traía NADA diario** — cero peticiones de red, Kanban 100% manual, y una `loadLiveJobs()` en core.js que nadie llamaba (código muerto). Ahora hay radar diario de 11 fuentes.
  - **El dato que definió el diseño**: de 100 vacantes de RemoteOK, CERO aceptan LatAm; en Remotive, 56%. La elegibilidad es filtro DURO, no un punto más.
  - 7 ATS de empresas LatAm verificados uno por uno (Clara, Bitso, Laika, Belvo, Simetrik, Bold, Fintual). Señal muy superior a los portales genéricos. Lista editable en jobs-companies.json.
  - Un clic manda la vacante al Kanban existente con el motivo y el % de afinidad.
- Tres errores propios corregidos midiendo: (1) mezclé afinidad con elegibilidad — marketing en Bogotá calificaba por decir "LatAm"; (2) penalizaba por palabras de la DESCRIPCIÓN, lo que dejó el radar en 0 resultados; (3) parchear con manipulación de cadenas convirtió los `\b` de los regex en caracteres 0x08 y ningún patrón matcheaba — el volcado de bytes lo delató, se reescribió el archivo limpio.
- Verificado en producción: 464 revisadas → 16 relevantes → 6 abiertas · 4 descartadas por región · Kanban intacto.
- Next: medir el embudo real cuando tenga datos (dónde pierde: ¿no aplica, o aplica y no le responden?) · sumar más empresas al jobs-companies.json a medida que aparezcan · alerta cuando salga una con score alto.

### ID:5-JOB.P2 (frescura + ventaja competitiva) · 2026-08-13
- Commit: 0850c5d · bd367d3
- Files: scripts/fetch-jobs.mjs (Greenhouse ?content=true + extracción de palabras) · frontend/js/jobs-radar.js · css/jobs.css · jobs.html
- Changed: Miguel pidió (a) saber que las búsquedas están al día y (b) VER la ventaja competitiva, que decía no percibir. Tenía razón: estaba construida y escondida.
  - **Aviso de frescura**: "✓ Actualizado a hoy, 13 de agosto de 2026 · 464 revisadas en 11 fuentes". Si el feed tiene más de 30 h se pone ámbar y lo dice, en vez de dejarlo creer que mira lo de hoy. Mismo principio que el badge de 12-FIN.
  - **LA VENTAJA REAL (nueva)**: los ATS descartan CVs por coincidencia de palabras antes de que un humano lea. Ahora cada vacante abre "🎯 Las palabras que esta vacante busca en tu CV" con dos columnas: las que ya puede sostener (ponerlas textual) y las que piden y no menciona. Habilitado con `?content=true` en Greenhouse (9.908 caracteres por vacante). Vocabulario CERRADO de ~70 términos verificables: no se infiere ninguna habilidad que la oferta no nombre; sin descripción no se muestra la sección.
- Dos defectos propios corregidos al probar: (1) el badge 🔥 "reciente" salía junto a "hace 2 días" — el mismo dato diciendo dos cosas; hasta 48 h se muestra en horas. (2) La afinidad se mapeaba con ×2,2 y techo 99, así que casi todo llegaba a "99%" — un número confiado que el dato no sostiene. Nueva escala con techo en 80.
- Verificado en producción: aviso verde con la fecha de hoy · 9 publicadas en 48 h · 8 de 10 con palabras clave · guardar al Kanban con afinidad 80% · badge coherente ("🔥 hace 47 h").
- Next: cuando tenga historial de postulaciones, medir el embudo real (¿dónde pierde: no aplica, o aplica y no le responden?). Sumar empresas a jobs-companies.json a medida que aparezcan.
