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
- Commit: <pending>
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

## 🌐 Project-Wide Prompts (3)

<!-- Whole-project triad · tab 🧩 Módulos → "🌐 PROYECTO COMPLETO".
     Append entries for: PROJECT.P1 (improve), PROJECT.P2 (audit), PROJECT.P3 (creative). -->

## 📚 Library Prompts

<!-- Append entries below for: LIB.bootstrap, LIB.bug-hunt, LIB.sync-audit, LIB.design-audit, LIB.cross-module, LIB.capabilities-audit, etc. -->

---

*Created 2026-05-15 · Fase D · token-saving overhaul.*
