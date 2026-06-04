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
