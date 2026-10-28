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

### ID:PROJECT.P2 (documentación + plan + 8-PRO) · 2026-08-17
- Prompt: revisar toda la documentación del Cerebro, optimizar los prompts, proponer un plan de desarrollo para los 16 módulos "en la misma línea de los que hemos venido trabajando", optimizar 8-PRO para que sea sencillo y efectivo, y **dejar el plan en notas, actualizable a medida que se desarrolla**.
- **La decisión que definió todo: el plan se resolvió como DATOS, no como texto.** Miguel dijo "en notas", y lo obvio era crear una nota en 13-NOT. No se hizo: una nota se edita a mano, se duplica y envejece. Eso ya pasó — los 8 `PLAN_*.md` de abril decían "DRAFT — Awaiting approval" describiendo trabajo que llevaba meses en producción. Ahora `frontend/data/plan-cerebro.json` es la única fuente, versionada en git, y la leen tanto Miguel (13-NOT → 🗺️ Plan) como la sesión de Claude que ejecuta (8-PRO → 🚀 Plan). No pueden decir cosas distintas.
- **"Terminado" tiene definición, no es una sensación.** 7 criterios extraídos de lo que hizo buenos a 12-FIN y 5-JOB: dato de fuente primaria · se actualiza solo · dice de cuándo es · todo número lleva su período · los rankings muestran su criterio · el éxito parcial no degrada · habla con los demás módulos.
- **El diagnóstico que ordenó las olas:** de 16 módulos solo 2 tienen datos que se actualizan solos. Y 1-IND y 7-NEW siguen colgados de `api.rss2json.com` — la misma clase de proxy gratuito de tercero que reventó en 12-FIN el 11 de agosto (allorigins, 522 solo a las peticiones del navegador). Matarlos es una ola propia (O2), no un pendiente suelto.
- **8-PRO rehecho:** los prompts existentes eran plantillas de 40 líneas con huecos `[DESCRIBE TU TAREA]`. Un prompt que exige trabajo antes de usarlo no se usa. Los 10 nuevos traen el problema real, la entrega y la verificación; la cabecera común (rol, qué leer antes, **las 3 reglas que más se incumplen**) se antepone sola al copiar.
- **Un defecto propio, atrapado a tiempo:** parcheé `prompts.html` con un script de sustitución de texto y mi `replace('</body>')` matcheó un `</body>` que estaba **dentro del texto de un prompt** — inyectó el `<script>` en medio de una cadena de JS. Misma clase de error que los `\b` convertidos en 0x08 del 13 de agosto. Revertido con `git checkout` y rehecho con `Edit` sobre anclas exactas. **Regla que ya estaba escrita y volví a incumplir: no se parchea código con sustitución de texto.**
- Documentación: los 8 `PLAN_*.md` (~2.180 líneas) pasaron a `docs/archivo/` con un índice que dice qué pasó con cada uno. No se borran — varios comentarios de cabecera en `frontend/js/` los citan como origen de la arquitectura de su módulo.
- Verificado en local y en producción: 8-PRO con 10 tarjetas y el texto compuesto correctamente; 13-NOT con 4 olas / 12 tareas / 7 criterios / 4 hitos y los filtros de prioridad respondiendo; las 6 pestañas viejas de 8-PRO intactas; consola sin errores.
- Next: ejecutar el plan por prioridad — O1.1 (Vista HOY), O1.2 (radar→2-APP), O2.1 (7-NEW del lado servidor) y O4.1 (cuota de localStorage) son los P0. Al cerrar cada una, cambiar su `estado` en `plan-cerebro.json`.
- **Segundo defecto propio, y el más instructivo: los estilos del plan de 13-NOT iban a un archivo que la página no carga.** En local comprobé que los elementos EXISTÍAN; en producción se veían sin estilo — fondo transparente, sin borde, prioridades en color de texto plano. `notes.html` nunca enlazó `css/notes.css`: sus estilos viven embebidos en su propio `<style>`. **Existir no es funcionar, y el chequeo correcto es el estilo computado, no `querySelectorAll().length`.** Las 52 reglas se movieron al `<style>` de la página.
- **Hallazgo que quedó como tarea O4.4 (P1):** `css/notes.css` lleva meses tragándose ediciones en silencio. El commit `da90c35` ("ancho unificado a 1200px en los 3 módulos") también lo editó creyendo que aplicaba, y `module-prompts.js:30` sigue documentando que 13-NOT lo usa — o sea, la próxima sesión vuelve a caer. El prompt de la tarea extiende el chequeo: cruzar cada `css/*.css` contra los `<link>` de las 28 páginas.
- **Una ficha del propio plan corregida contra el código:** decía "perfil, XP y racha de core.js". Verificado — `core.js:20` define `DB.NS='da2026_'` y guarda **6** claves (`profile`, `xp`, `streak`, `tasks`, `notes`, `sessions`), y `DB` lo usan también `apply.js` y `dashboard.js`. El prefijo no aparece en ninguna línea de `cloud-sync.js`.
- Dos detalles de honestidad y de uso, ambos encontrados mirando producción: los dos JSON decían "actualizado 2026-08-14" habiéndose publicado el 17 (el criterio 3 del propio plan existe para evitar justo eso), y los prompts salían sin ordenar — O4.1 es P0 y aparecía séptimo. Al ordenar, probé el riesgo real (que el botón copie el prompt de otra tarjeta): cada botón conserva su índice original, cero desalineadas de 12.
- Cierre verificado en producción, no en preview: 13-NOT con 13 tareas / 7 criterios / 52 reglas de estilo aplicadas / las 13 con criterio de verificación; 8-PRO con 12 prompts ordenados P0→P2, sin un solo hueco tipo `[COMPLETAR]` y 861 caracteres de promedio. Móvil 375 px sin scroll horizontal.

### ID:O1.1 (Vista HOY · 1-IND) · 2026-08-17
- Prompt: construir la Vista HOY en el dashboard, cruzando los stores que ya existen. Solo lectura salvo marcar un hábito o completar una tarea.
- **Antes de escribir una línea, verifiqué la forma REAL de cada store.** El prompt nombraba seis y no todos eran como decía. `sys_tasks` no aparece en `systems.html` — la lógica vive en `systems_logic.js`, en la raíz de `frontend/`, con `NS='sys_'` + `'tasks'`. Casi lo doy por inexistente.
- **La trampa que definió el diseño: `sys_tasks` está en `SKIP_KEYS`.** El proxy de `cloud-sync.js` lo ignora **a propósito** porque es tabla dedicada Tier 1 y `systems_logic.js:saveTasks` la empuja con `CLOUD.push()` explícito. Si el panel hubiera escrito solo con `setItem`, Miguel marcaba la entrega en el dashboard y en el otro PC seguía pendiente — pérdida silenciosa, P0 del mandato. `completarTarea()` replica el push explícito. `sb_habits` sí es Tier 2 y va por el proxy.
- **Probado el comportamiento, no leído el código** (regla 2): vacié la outbox y medí. Marcar un hábito encola `sb_habits`. Completar una tarea **no** aparece ahí — correcto, es Tier 1 — y sí dispara `CLOUD.push('sys_tasks', {id:'3', done:true, updated_at})`, verificado interceptando la función. La outbox, dicho sea de paso, guarda **nombres de clave como strings**, no objetos: mi primera lectura de sus campos dio `?` y tuve que mirar la forma real.
- **La honestidad del panel está en distinguir dos silencios.** Con los seis stores vacíos no pinta ni una tarjeta ni un número, y el mensaje separa «Al día: vacantes» (verificado) de «Sin datos todavía: alertas · tesis · entregas · hábitos · inglés — esos módulos no tienen nada cargado, **no es que estén al día**». No haber usado 9-GOA no es tener los hábitos al día.
- **Es un espejo, no una segunda autoridad.** Cada fuente se cuenta con la misma expresión que su módulo. Donde el módulo tiene un defecto lo repliqué igual y lo anoté, en vez de arreglarlo por mi cuenta y poner dos números distintos en pantalla (ver O2.4).
- Un defecto propio corregido al probar: hice el fetch de `macro-co.json` condicional a que hubiera alertas, para ahorrar 26 KB. Si la primera alerta se creaba después de cargar la página, el panel decía «no se pudo leer la fuente» cuando nunca la había pedido. La rama ahorraba poco y mentía sobre la causa.
- **Tres hallazgos que entran al plan:**
  - **O4.5 (P1)** · `js/index.js` (425 líneas) y `js/dashboard.js` (134) **no los carga nadie** — cero referencias en todo el repo. `index.js` contiene un «mission control» entero que es un intento previo de esta misma tarea, muerto en el disco. Mismo patrón que `css/notes.css`. ⚠️ `core.js` **sí** se carga, desde `pages/`.
  - **O2.4 (P1)** · el mazo `eng_srs_deck` tiene **dos esquemas incompatibles**: `eng-import.js` usa `due` (epoch) y `notes-brain.js` usa `nextReview` (fecha). Como `_genSRS` filtra con `!c.due || c.due <= now`, toda tarjeta creada desde 13-NOT cuenta como vencida **para siempre**. El repaso espaciado deja de espaciar.
  - **O2.2 sube a P0** · `api.rss2json.com` devuelve **422 ahora mismo**, verificado con una petición real. El feed del dashboard no es un riesgo futuro: está roto hoy.
- Verificado en producción: el panel monta, lee los dos archivos de mismo origen y muestra 9 vacantes abiertas a LatAm con la más relevante (Data Analyst en Clara) y el aviso de frescura. Estilos aplicados (fondo `rgb(34,34,40)`, número 24 px). Móvil 375 px sin scroll horizontal ni desbordes. Los 5 destinos de navegación validados contra `Cerebro.MODULES`.
- Next: O1.2 (radar→2-APP) y O2.1/O2.2 (matar rss2json), que ahora es urgente y no preventivo.
