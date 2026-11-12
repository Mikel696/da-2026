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
| `frontend/work.html` | Cascarón: aviso, conteo de registros privados, cuadernos |
| `frontend/js/work.js` | Solo `WorkNB` (editor de cuadernos sobre `nb-shared.js`) + `WorkShell` (cuenta registros, solo lee) |
| `frontend/css/work.css` | Estilos · acento cyan `#06b6d4` |

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
4. **El Coach (Fase B) no arranca sin el mapa de vacantes reales** (B1 del plan privado). Casos ficticios
   marcados como ficticios. Lo de herramientas de IA se enlaza al AI Dojo (17-IA), no se duplica.
