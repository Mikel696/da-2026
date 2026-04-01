# ESTADO DEL CEREBRO DA-2026

- **Última actualización:** 2026-04-01

---

## 🔜 PRÓXIMO SPRINT — Supabase Integration (PLAN.md — AWAITING APPROVAL)

**Objetivo:** Migrar de localStorage puro → localStorage + Supabase (cloud sync + auth).
**Plan completo:** `PLAN.md` en raíz del proyecto.

**Hallazgos del audit:**
- Toda la persistencia es localStorage (JSON.parse/stringify). No hay IndexedDB real.
- 3 namespaces: `da_vacancies` (VacancyDB), `sys_*` (SYS module), `sb_*`/`jt8` (sidebar stats)
- VDB está duplicado en jobs.js y apply.js (mismo objeto, misma key)
- Zero auth / zero user identity

**Plan de 5 fases (ver PLAN.md para SQL completo y código):**
- **Fase 1:** CDN Supabase JS v2 + `js/supabase-client.js` (singleton)
- **Fase 2:** `js/auth.js` — modal Login/Signup Vanilla JS, widget flotante, `onAuthStateChange`
- **Fase 3:** `js/cloud-sync.js` — capa genérica CLOUD.push/pull/remove/syncDown/syncUp + augmentar VDB + SYS tasks con write-through
- **Fase 4:** Schema PostgreSQL — 4 tablas: `vacancies`, `sys_tasks`, `class_sessions`, `user_prefs` (con RLS)
- **Fase 5:** Configuración Supabase dashboard (URL redirect, Site URL) + fill credentials

**Archivos nuevos:** 3 (`supabase-client.js`, `auth.js`, `cloud-sync.js`)
**Archivos editados:** `jobs.js`, `apply.js`, `systems_logic.js` (additive, no breaking changes) + 14 HTML shells (2 script tags cada uno)
**Estrategia:** Offline-first write-through — localStorage es L1 cache, Supabase es L2 truth. App funciona sin internet.

---

- **Última actualización:** 2026-03-31

- **SCAN CUN — 2026-03-31 (Día 2 de 26V02) — ✅ COMPLETADO**
  - ✅ **Gmail CUN (31-Mar):** 2 emails nuevos: (1) DARIO FERNANDO CORTES TOBAR → **Inv. C&T horario confirmado: Jueves 6pm-7pm semanal** (invitación Google Calendar). (2) CINDY PAOLA MORENO → 2 sesiones de inducción English: 31-Mar 7pm y 8pm.
  - ✅ **CUN Digital — Actividades por curso:**
    - **Ing. Web (104362):** Link clase, Grabaciones, Material, Acuerdo Pedagógico (PENDIENTE), Avisos
    - **Inv. C&T (104253):** Avisos, Acuerdo Pedagógico (PENDIENTE — NUEVO)
    - **Mat. Especiales (101285):** Calendario, Link reuniones Miérc+Viernes 6:15pm, Syllabus, Grabaciones, Material, Avisos
    - **English Beginner (100774):** Avisos, Términos y Condiciones (PENDIENTE), Link al curso de inglés
    - **Inducción TICS (28494):** 7 secciones — Bienvenida, Para tus clases, Aprendiendo C-Digital, etc. Progress: 14%
  - ✅ **CUN 360:** Deuda $0.00. Mismos 6 docentes confirmados. Calidad SW / Admin BD / Redes: sin docente registrado aún.
  - ✅ **SGA Campus:** Sin notas (esperado — día 2 del semestre).
  - ✅ **academic-8vo.json actualizado:** last_scan→31-Mar, inv_ciencia.schedule→"Jueves 6pm-7pm", inv_ciencia.pending_tasks→Acuerdo Pedagógico, alert acuerdo_pedagogico_inv_ciencia→true
  - ⚠️ **Pendientes CUN:** Acuerdo Pedagógico (Ing. Web + Inv. C&T) | Términos y Condiciones English | Inducción TICS 14%→100% | Subir documentos CUN 360

- **SCAN CUN — 2026-03-30 (Primer día 26V02) — ✅ COMPLETADO**
  - ✅ **CUN Digital (Moodle):** 6 cursos publicados. IDs: Ing Web=104362, Inv C&T=104253, Mat Especiales=101285, Placement Test=106289, English=100774, Induccion TICS=28494. Calidad SW, Admin BD, Redes: NO publicados aún.
  - ✅ **Inducción TICS:** 14% completado. Docentes completos. Horarios: Mat.Especiales→Miérc+Viernes 6:15pm | Ing.Web→Martes 6:15pm | English→Lunes 7pm | Inv.C&T→Jueves 6pm (confirmado 31-Mar).
  - ✅ **CUN 360:** Período 26V02, Deuda $0.00.

- **Actualizaciones 2026-03-31 (Sesión P0 + SCAN)**
  - ✅ **deals.json** actualizado: Epic (Havendock+Hyper Echelon hasta Apr 2, Clone Drone in the Danger Zone Apr 2-9), Amazon Prime (4 juegos hasta May 26), GOG (Deep Sky Derelicts hasta Apr 3), Steam (6 juegos keep forever), Udemy (link a freecourses.me)
  - ✅ **VacancyDB** +5 vacantes totales sesión: AR/AP Specialist (Remote Talent LATAM), AP/AR Specialist (Legal Tech US EST), Data Analyst LATAM, Financial Analyst FP&A LATAM, AP/AR Specialist (Activate Talent, NetSuite, LATAM remote). Total: **13 vacantes**.
  - ✅ **Tab 7 Clases Perdidas (10-SYS):** Feature completa — CSS+JS+HTML+Prompt P12. Sesión Reinducción Pregrado guardada.

- **Última actualización:** 2026-03-27
- **Módulo 2-APP (Application Command Center & Motor ATS) — ✅ 100% FEATURE COMPLETE**
  - ✅ Analizador de Vacantes con 5 tabs (Analizador, CV Perfilado, Cover & Msgs, Entrevista, Prompt Lab)
  - ✅ Motor ATS v2 con sinónimos (`js/ats-engine.js` + `data/my-skills.json`)
  - ✅ Integración bidireccional VacancyDB (apply.html ↔ jobs.html)
  - ✅ Job Tracker con Master-Detail viewer + Kanban pipeline drag-and-drop
  - ✅ Motor de perfilamiento avanzado (tono, timezone, salario, urgencia, culture fit, ATS score)
  - ✅ Modularización apply.html — CSS → `css/apply.css`, JS → `js/apply.js`. HTML shell: 8 KB (era 84 KB)
  - ✅ Modularización jobs.html — CSS → `css/jobs.css`, JS → `js/jobs.js`. HTML shell: 24 KB (era 52 KB)
  - ✅ Dashboard Analytics — Métricas en tiempo real: contadores por columna, tasas de conversión, win rate
  - ✅ Win-Rate Optimizer — 12 búsquedas booleanas en 6 plataformas (LinkedIn, Indeed, Computrabajo, Torre, RemoteOK, Upwork)
  - ✅ Smart CV Weaver — CV dinámico con {kw:} tejidas, 3 perfiles, contenteditable, export PDF (`js/cv-weaver.js` + `data/my-base-cv.json`)
  - ✅ Cover & Msgs Weaver — 2 templates (formal/startup), selección por tono, app msg, LinkedIn msg (`js/cover-weaver.js` + `data/my-cover-templates.json`)
  - ✅ Interview Weaver + TTS — 13 Q&A STAR-method, relevancia por JD, Web Speech API Play/Pause (`js/interview-weaver.js` + `data/my-interview-qa.json`)
  - ✅ Prompt Lab Weaver — 3 prompts IA dinámicos: Mock Interviewer, Tech Assessment Solver, Salary Negotiator (`js/prompt-weaver.js`)

- **Módulo 1-IND (Global Dashboard & Mission Control) — ✅ 100% FEATURE COMPLETE + DEALS & URGENT TASKS**
  - ✅ Modularización index.html — CSS → `css/index.css`, JS → `js/index.js`. HTML shell optimizado
  - ✅ Mission Control: 4 widgets (Pipeline Overview, Meta Semanal, Actividad Reciente, Acciones Rápidas)
  - ✅ Pipeline Overview — contadores por columna (Saved/Applied/Interview/Offer/Rejected), barra de progreso, tasas de conversión
  - ✅ Meta Semanal — ring SVG animado, conteo de apps esta semana vs target (10/semana), desglose Lun–Dom
  - ✅ Actividad Reciente — timeline de últimos movimientos del VacancyDB con timeAgo
  - ✅ Acciones Rápidas — links directos a Command Center, Tracker, Kanban, CV Weaver, Ruta DA, English
  - ✅ Lectura en tiempo real de VacancyDB (`da_vacancies` localStorage) — datos sincronizados con jobs.html y apply.html
  - ✅ **Gratis & Ofertas Colombia** (reemplazó "Tareas del Día"):
    - Panel principal con ofertas GRATIS organizadas por tienda (Cajita Tech, Amazon, Epic Games, Udemy, GOG, MercadoLibre, Éxito, Steam)
    - Chips de tiendas clickeables con links directos
    - Cada deal: icono por tienda, tag GRATIS, fecha de vencimiento
    - Data layer: `data/deals.json` (sources + deals con categorías)
    - Se actualiza automáticamente con P0 al inicio de cada sesión
  - ✅ **Tareas Urgentes** (reemplazó "Cajita Tech" en sidebar):
    - Lee tareas del sistema 10-SYS (sys_tasks localStorage) + alertas estáticas del scan
    - Muestra tareas vencidas, de hoy y próximas 7 días con colores por urgencia
    - Alertas fijas: Inducción TICS pendiente, documentos CUN 360
    - Lee VacancyDB para follow-up de vacantes aplicadas
    - Links directos "Ir →" a cada módulo/plataforma relevante

- **Módulo 3-ENG (English Interview Dojo) — ✅ 100% FEATURE COMPLETE**
  - ✅ Interview Dojo tab añadido a english.html (nuevo tab 🎙️ Interview Dojo)
  - ✅ TTS Engine — Web Speech API `speechSynthesis` con voz US English, Play/Pause/Resume
  - ✅ STT Engine — `webkitSpeechRecognition` API, transcripción en tiempo real, continuous mode
  - ✅ 3 categorías: Recruiter Screening (5 Q&A), Finance & Data Vocabulary (5 Q&A), Remote LATAM Idioms (5 Q&A)
  - ✅ Cada pregunta: Listen (TTS) → Record (STT) → Compare (Ideal STAR Answer)
  - ✅ Data layer: `data/english-dojo.json` (15 Q&A con tips y tags)
  - ✅ Modular: `css/english.css` + `js/english.js` (additive, no rompe el English Total System existente)

- **Módulo 4-RUT (Excel Technical Test Simulator) — ✅ 100% FEATURE COMPLETE + INTERACTIVE ENGINE**
  - ✅ Split-panel UI: sidebar con lista de escenarios + workspace con mock Excel table
  - ✅ 15 escenarios realistas AP/Finance en 3 categorías:
    - Data Cleaning (TRIM, UPPER, VALUE, SUBSTITUTE, MID, DATE, LEFT, FIND, PROPER)
    - Reconciliation / Lookups (XLOOKUP, INDEX/MATCH, IFERROR, VLOOKUP)
    - Aging & Logic (nested IFs, TODAY, SUMIFS, AND, OR, LEN, LEFT)
  - ✅ Mock data tables estilo Excel con headers A/B/C, row numbers, gridlines, yellow target cells
  - ✅ Formula input bar con prefix `fx` y validación regex de funciones clave
  - ✅ **INTERACTIVE ENGINE v2:** celdas se actualizan dinámicamente con `expected_results` + green flash animation
  - ✅ **Hint-based errors:** mensajes específicos en español por función faltante (campo `hints` en JSON)
  - ✅ **Solution slide-down:** panel se desliza con CSS transition + auto-popula celdas al revelar
  - ✅ **Pedagogía paso a paso:** explicaciones en español con bloques visuales (Paso 1, Paso 2...) y code highlighting
  - ✅ Staggered cell animation (120ms por celda) simula cálculo secuencial de Excel
  - ✅ Progress tracking persistente (solved set, attempts, accuracy) en localStorage
  - ✅ Data layer: `data/excel-tests.json` (15 escenarios con business_case, mock_data, expected_results, hints, explanation)

- **Módulo 10-SYS (Ingeniería de Sistemas) — ✅ CUN SCANNER + DATOS REALES + DASHBOARD INTELIGENTE**
  - ✅ Protocolo CUN Scanner integrado en CLAUDE.md (SCAN CUN / NOTAS / TAREAS / EMAIL)
  - ✅ Escaneo real vía Chrome MCP: SGA Campus, CUN Digital, Gmail CUN, **CUN 360**
  - ✅ Extracción de PDFs de notas (notr29.pdf) con PyPDF2
  - ✅ **CUN 360 Dashboard scraped** — 52 materias históricas extraídas página por página
  - ✅ `data/academic-history.json` — HISTORIAL ACADÉMICO COMPLETO:
    - 52 materias aprobadas (semestres 1-7)
    - GPA acumulado histórico: 4.49/5.0
    - 2 títulos obtenidos: Técnico Profesional (Sem 4) + Tecnólogo en Desarrollo de SW (Sem 7)
    - Deuda $0, documentos pendientes por cargar
  - ✅ `data/academic-8vo.json` con datos REALES del SGA/SINU:
    - Estudiante: BARROS TORRES MIGUEL ANGEL (1063955980)
    - Período: 26V02 (no 26V01 como estaba hardcodeado)
    - 3 programas activos: VP15G (Ing. Sistemas), IV001 (Inglés), IV002 (Placement Test)
  - ✅ `systems_logic.js` SUBJECTS actualizado con materias REALES del período 26V02:
    - DIS31 Matemáticas Especiales (Grupo 52247)
    - DIS32 Calidad del Software (Grupo 52278)
    - DIS33 Administración de Bases de Datos (Grupo 52291)
    - DIS34 Ingeniería Web (Grupo 52211)
    - DIS35 Redes Inalámbricas (Grupo 52226)
    - DIS36 Inv. Ciencia y Tecnología (Grupo 52218)
    - A1I01 Virtual English Beginner 1 (Grupo 50608)
    - CE1026 Placement Test BE Plus (Grupo 5TB01)
  - ✅ Eliminadas materias incorrectas: Álgebra Moderna, Ecuaciones Diferenciales, Plan de Negocios II, Electiva Prof. I
  - ✅ Sample tasks, study resources y selectores HTML actualizados
  - ✅ systems.html selectores de materia actualizados (newTaskSubj + bulkSubj)
  - ✅ **Dashboard Inteligente v2:**
    - ✅ Hero Card "¿Qué hacer AHORA?" — countdown pre-semestre, alertas vencidas, resumen semanal
    - ✅ Subject Health Grid — 8 materias con status visual (🔴 ATRASADO, 🟠 URGENTE, 🟡 AL DÍA, ✅ COMPLETO, ⬜ SIN TAREAS)
    - ✅ Study Plan auto-generado — plan semanal dinámico con overdue, hoy, próximos días, materias descuidadas
    - ✅ Semáforo compacto — reubicado debajo del plan de estudio
  - ✅ **Portal Opener v2** — Queue-based sequential opener (bypass popup blocker) con floating progress UI
  - ✅ **detectPeriod()** — Prioriza 26V02 (enrolled period) incluyendo pre-periodo de 7 días
  - ✅ **Prompts Cerebro** — 11 prompts documentados (P0-P10) en notes.html con click-to-copy
  - ✅ WEEKLY_WORKFLOW actualizado con materias reales 26V02
  - ✅ **Task Guide Modal** — Ventana emergente por materia con guía paso a paso:
    - Info box: ¿Dónde está? + Tipo de evidencia + ¿Cómo se entrega?
    - Tareas pendientes con estado y vencimiento
    - 5 pasos semanales numerados (Revisa aula → Estudia → Desarrolla → Arma entrega → Sube a Moodle)
    - Tips importantes específicos por materia
    - Links rápidos: CUN Digital + recursos externos
    - Se abre desde: Subject Health grid, Subject Cards, y botón 📖 en semáforo
  - ✅ `SUBJECT_GUIDES` — 8 guías completas (1 por materia) con plataforma, evidenceType, submitMethod, tips, weeklySteps
  - ✅ **SCAN COMPLETO 2026-03-27** — Escaneo exhaustivo de las 4 plataformas CUN vía Chrome MCP:
    - ✅ **CUN Digital**: Solo curso "INDUCCION TICS - ESTUDIANTES" (course 28494, 0% completado, 7 secciones). Cursos 26V02 NO publicados aún (inician 30 Mar).
    - ✅ **SGA Campus (notr29)**: 3 programas activos (VP15G/26V02, IV001/26I02, IV002/26I32). Sin notas aún.
    - ✅ **Gmail CUN**: 13 emails (Mar 11-24), setup/bienvenida, sin alertas urgentes.
    - ✅ **CUN 360 Dashboard**: Deuda $0, 52 materias históricas, docs pendientes por cargar.
    - ✅ **CUN 360 Materias Virtuales**: 6 materias modalidad virtual confirmadas con docentes:
      - REDES INALAMBRICAS — Docente: No registra
      - MATEMATICAS ESPECIALES — Docente: CORTES CRUZ JUAN SEBASTIAN
      - ADMINISTRACION DE BASES DE DATOS — Docente: No registra
      - CALIDAD DEL SOFTWARE — Docente: No registra
      - INVESTIGACION CIENCIA Y TECNOLOGIA — Docente: CORTES TOBAR DARIO FERNANDO
      - INGENIERIA WEB — Docente: BECERRA RAMIREZ HEYNER LEONEL
    - ✅ **CUN 360 Financiero**: Transacciones $0, sin pagos pendientes.
    - ✅ **CUN 360 Links de Interés**: 15 enlaces de recursos (SINU, Campus Digital, Biblioteca, Calendario, etc.)
  - ✅ **Docentes en SUBJECTS** — 3 profesores confirmados agregados a `SUBJECTS[]` y `academic-8vo.json`
  - ✅ **Docente en Task Guide Modal** — El nombre del profesor se muestra en el header del modal
  - ✅ **Prompts actualizados (CLAUDE.md + notes.html P0-P11):**
    - CLAUDE.md reescrito: ecosistema 4 plataformas, datos período 26V02, funcionalidades 10-SYS, regla de oro "actualizar siempre"
    - P1 expandido: escaneo 4 plataformas con instrucciones detalladas por paso
    - P2 actualizado: incluye risk_level y doble clic en período
    - P3 actualizado: historial + docentes + financiero en un solo scan
    - P4 actualizado: navegar cada sección del Moodle, importar tareas con materia + fecha
    - P4b NUEVO: Scan solo docentes (CUN 360 → Materias Virtuales)
    - P5 expandido: describe los 5 tabs del Application Command Center
    - P9 actualizado: incluye verificación de prompts actualizados
    - P10 actualizado: incluye verificación de prompts antes de push
    - P11 NUEVO: Guía de Materia (Task Guide Modal) con las 8 materias disponibles
    - Flujo de trabajo: 6 pasos (antes 5), incluye P4b y P11

- **Módulo 10-SYS — Tab 7 "Clases Perdidas" — ✅ IMPLEMENTADO 2026-03-31**
  - ✅ Nueva tab `📹 Clases Perdidas` (Tab 7) en systems.html
  - ✅ Panel pnl7: input URL + selector materia + generador de prompt con copy-to-clipboard
  - ✅ Session cards: título, materia, fecha, estado, resumen, temas (tags), assignments con deadline/evidencia/cómo entregar, recursos
  - ✅ Status workflow: Pendiente → En proceso → Completado (con botones de transición)
  - ✅ localStorage: `sys_class_sessions` — persiste entre sesiones
  - ✅ `SYS.injectClassSession(data)` — Claude llama esta función para guardar el informe
  - ✅ CSS `.cs-*` classes — diseño consistente con el sistema
  - ✅ P12 prompt en notes.html: `CEREBRO: ANALIZA CLASE [URL]`
  - ✅ Memoria guardada: `project_class_analyzer.md`

- **Siguiente fase sugerida (próxima sesión):**
  1. **10-SYS: Completar Inducción TICS** — 14% completado, 7 secciones. URGENTE completar al 100%.
  2. **10-SYS: Completar Acuerdo Pedagógico Ing. Web** — Pendiente en Moodle del curso 104362.
  3. **10-SYS: Aceptar Términos y Condiciones English** — Pendiente en Moodle del curso 100774.
  4. **10-SYS: Subir documentos CUN 360** — Alerta persistente de documentos faltantes.
  5. **10-SYS: Grade Tracker Engine** — Cuando haya notas registradas, cálculo predictivo "¿cuánto necesito para pasar?"
  6. **10-SYS: Re-scan CUN Digital** — En ~1-2 semanas re-escanear para ver si Calidad SW, Admin BD y Redes publican sus aulas.
  7. **Global System Polish & Finetuning** — UI consistency pass, cross-module navigation, responsive fixes.

## Arquitectura de Archivos — Module 1-IND

| Archivo | Función |
|---|---|
| `frontend/index.html` | Global Dashboard — HTML shell (10.5 KB) |
| `frontend/css/index.css` | Estilos del Dashboard + Mission Control widgets |
| `frontend/js/index.js` | Clock, tasks, pomodoro, RSS feed, Mission Control engine |

## Arquitectura de Archivos — Module 3-ENG

| Archivo | Función |
|---|---|
| `frontend/english.html` | English Total System + Interview Dojo tab |
| `frontend/css/english.css` | Estilos del Interview Dojo (TTS/STT UI) |
| `frontend/js/english.js` | Dojo engine: TTS, STT, categories, rendering |
| `frontend/data/english-dojo.json` | 15 Q&A (3 categorías × 5 preguntas) con ideal STAR answers |

## Arquitectura de Archivos — Module 4-RUT

| Archivo | Función |
|---|---|
| `frontend/ruta.html` | Ruta Data Analyst + Excel Technical Test Simulator |
| `frontend/css/ruta.css` | Estilos del Excel Simulator (split-panel, Excel-style tables, toast) |
| `frontend/js/ruta.js` | ExcelDojo engine: fetch, render, validate, progress tracking |
| `frontend/data/excel-tests.json` | 9 AP/Finance scenarios (3 categorías × 3 escenarios) con mock data |

## Arquitectura de Archivos — Module 2-APP

| Archivo | Función |
|---|---|
| `frontend/apply.html` | Application Command Center — HTML shell (8 KB) |
| `frontend/css/apply.css` | Estilos del Application Command Center |
| `frontend/js/apply.js` | Lógica core: VDB, profiling engine, state management |
| `frontend/js/ats-engine.js` | Motor ATS v2 con matching por sinónimos |
| `frontend/js/cv-weaver.js` | Smart CV Weaver: perfilado dinámico + PDF export |
| `frontend/js/cover-weaver.js` | Cover Weaver: cartas y mensajes dinámicos con tono |
| `frontend/js/interview-weaver.js` | Interview Weaver: prep rankeada + Web Speech API TTS |
| `frontend/js/prompt-weaver.js` | Prompt Weaver: 3 prompts IA dinámicos por vacante |
| `frontend/data/my-skills.json` | Inventario de skills con categorías y sinónimos |
| `frontend/data/my-base-cv.json` | Base CV modular con {kw:} placeholders |
| `frontend/data/my-cover-templates.json` | Templates cover letter (formal/startup) + msgs |
| `frontend/data/my-interview-qa.json` | 13 Q&A STAR-method (behavioral + technical) |
| `frontend/jobs.html` | Job Tracker — HTML shell (24 KB) |
| `frontend/css/jobs.css` | Estilos del Job Tracker + Kanban |
| `frontend/js/jobs.js` | Kanban, VDB, analytics, drag-and-drop, win-rate optimizer |
| `frontend/index.html` | Global Dashboard + Mission Control — HTML shell (10.5 KB) |
