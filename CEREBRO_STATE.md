# ESTADO DEL CEREBRO DA-2026

- **Última actualización:** 2026-03-25
- **Progreso actual:** Módulo 2-APP (Application Command Center & Motor ATS) — funcional y desplegado.
  - ✅ Analizador de Vacantes con 5 tabs (Analizador, CV Perfilado, Cover & Msgs, Entrevista, Prompt Lab)
  - ✅ Motor ATS v2 con sinónimos (`frontend/js/ats-engine.js` + `frontend/data/my-skills.json`)
  - ✅ Integración bidireccional VacancyDB (apply.html ↔ jobs.html)
  - ✅ Job Tracker con Master-Detail viewer + Kanban pipeline drag-and-drop
  - ✅ Motor de perfilamiento avanzado (tono, timezone, salario, urgencia, culture fit, ATS score)
  - ✅ CV Perfilado dinámico con export PDF
  - ✅ Cover Letter + LinkedIn Msg generados por tono

  - ✅ **Modularización apply.html** — CSS → `css/apply.css`, JS → `js/apply.js`. HTML shell: 8 KB (era 84 KB)
  - ✅ **Modularización jobs.html** — CSS → `css/jobs.css`, JS → `js/jobs.js`. HTML shell: 24 KB (era 52 KB)
  - ✅ **Dashboard Analytics** — Panel de métricas en tiempo real: contadores por columna, tasa de aplicación, tasa de entrevista, win rate. Se actualiza con cada movimiento de tarjeta.
  - ✅ **Win-Rate Optimizer** — 12 búsquedas booleanas preconfiguradas en LinkedIn, Indeed, Computrabajo, Torre, RemoteOK, Upwork. Optimizadas para perfil cruzado Contabilidad + Data Entry + Remoto LATAM.
  - ✅ **Smart CV Weaver** — CV dinámico con keywords ATS tejidas, 3 perfiles (accounting/data_entry/hybrid), auto-detección de foco, contenteditable preview, export PDF via html2pdf.js. Datos base en `data/my-base-cv.json`.
  - ✅ **Cover & Msgs Weaver** — Cover letters dinámicas con 2 templates (formal/startup), selección por tono, mensajes de aplicación y LinkedIn. Datos en `data/my-cover-templates.json`, lógica en `js/cover-weaver.js`.
  - ✅ **PDF Phantom Page Fix** — Intercepta jsPDF pipeline para eliminar páginas fantasma via `pdf.deletePage()`.
  - ✅ **Interview Weaver + TTS** — 13 preguntas STAR (6 conductuales + 7 técnicas), rankeadas por relevancia al JD. Web Speech API con Play/Pause/Resume, voz española auto-detectada. Datos en `data/my-interview-qa.json`, lógica en `js/interview-weaver.js`.

- **Siguiente paso sugerido:**
  1. **Cross-module integration: Link CVMaker to Tracker** — Conectar el generador de CV perfilado directamente con las vacantes del Tracker para one-click profiling.
  2. **English Interview Mode** — Añadir voz inglesa al TTS para practicar entrevistas en inglés.

## Arquitectura de Archivos Clave

| Archivo | Función |
|---|---|
| `frontend/apply.html` | Application Command Center — HTML shell (8 KB) |
| `frontend/css/apply.css` | Estilos del Application Command Center (12 KB) |
| `frontend/js/apply.js` | Lógica completa: VDB, profiling, CV, cover, interview (68 KB) |
| `frontend/jobs.html` | Job Tracker — HTML shell (24 KB) |
| `frontend/css/jobs.css` | Estilos del Job Tracker + Kanban (92 líneas) |
| `frontend/js/jobs.js` | Lógica: Kanban, VDB, analytics, drag-and-drop (295 líneas) |
| `frontend/js/cv-weaver.js` | Smart CV Weaver: perfilado dinámico + PDF export |
| `frontend/js/cover-weaver.js` | Cover Weaver: cartas y mensajes dinámicos con tono |
| `frontend/data/my-base-cv.json` | Base CV modular: summaries, bullets con {kw:} placeholders |
| `frontend/data/my-cover-templates.json` | Templates de cover letter (formal/startup) + msgs |
| `frontend/js/interview-weaver.js` | Interview Weaver: prep rankeada + Web Speech API TTS |
| `frontend/data/my-interview-qa.json` | 13 Q&A STAR-method (behavioral + technical) |
| `frontend/js/ats-engine.js` | Motor ATS v2 con matching por sinónimos |
| `frontend/data/my-skills.json` | Inventario de skills con categorías y sinónimos |
| `frontend/index.html` | Dashboard principal |

## Commits Relevantes (últimos)

- `c1da606` — ATS Engine v2 synonym-aware
- `6ce874c` — Job Tracker master-detail + kanban drag-and-drop
- `a0cd4b9` — VacancyDB bidireccional + profiling engine
- `e77d8dc` — Refactor apply.html y jobs.html
