# Planes archivados · abril 2026

Estos 8 documentos (~2.180 líneas) vivían en la raíz del repo. Los movimos acá
el **17 de agosto de 2026** por una razón concreta: los ocho decían
*"DRAFT — Awaiting approval"* y la mayoría describía trabajo que **ya está hecho
y en producción**. Un plan sin aprobar que describe algo terminado no es un plan:
es ruido que una sesión nueva lee y confunde con trabajo pendiente.

**No se borran.** Son la memoria de por qué las cosas son como son — varios
comentarios de cabecera en `frontend/js/` todavía los citan como fuente de la
arquitectura de su módulo (`accounting.js` → `PLAN_ACCOUNTING.md`,
`goals.js` → `PLAN_HABITS_UI.md`).

| Archivo | Última edición | Estado real de lo que planeaba |
|---|---|---|
| `PLAN_ACCOUNTING.md` | 2026-04-10 | 11-ACC existe; su futuro está por decidir (tarea O3.3) |
| `PLAN_FINANCE_UI.md` | 2026-04-04 | Superado — 12-FIN se rehízo entero en agosto (8 secciones) |
| `PLAN_GLOBAL_SYNC.md` | 2026-04-03 | Implementado — `cloud-sync.js` con outbox y proxy de escritura |
| `PLAN_HABITS_UI.md` | 2026-04-05 | Implementado — 9-GOA en producción |
| `PLAN_MIGRATION.md` | 2026-04-05 | Ejecutado — migración a la arquitectura de 4 capas |
| `PLAN_NOTES_UI.md` | 2026-04-04 | Implementado — 13-NOT en producción |
| `PLAN_PROMPT_LAB.md` | 2026-04-10 | Implementado — 8-PRO en producción |
| `PLAN_TRACKER_UI.md` | 2026-04-03 | Superado — 5-JOB se rehízo en agosto (radar + elegibilidad) |

## Dónde vive el plan hoy

`frontend/data/plan-cerebro.json` — versionado en git, con estado por tarea.
Se lee desde dos lugares y **no hay una segunda copia en texto**:

- **13-NOT → pestaña 🗺️ Plan** — Miguel ve las 4 olas, filtra por prioridad y
  consulta los 7 criterios que definen "terminado".
- **8-PRO → pestaña 🚀 Plan** — un prompt listo por tarea
  (`frontend/data/prompts-plan.json`), se copia y se pega sin editar nada.

Cuando una tarea se termina, cambia de estado en ese JSON y las dos vistas lo
reflejan solas. Esa es la diferencia con estos ocho archivos: no hay forma de que
el plan y lo que se ve queden diciendo cosas distintas.
