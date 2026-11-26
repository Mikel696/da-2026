# Informe nocturno 2026-11-26

1. Versiones en lockstep: VERDE. cloud-sync.js?v=p26 en 28 páginas; nb-shared.js?v=p28 en 4. Una sola versión por archivo.
2. Frescura de datos: VERDE. credit-co, jobs-feed, macro-co y world generados hoy (26-nov 05:2x UTC). jobs-companies y rol-objetivo 24-nov, plan-cerebro 25-nov (son fechas editoriales, no de la Action).
3. Sintaxis: VERDE. node --check sin fallos en todos los .js de frontend/js/ y frontend/.
4. Enlaces internos: VERDE. Ningún href/src relativo apunta a un archivo inexistente (lo que sale en el escaneo son plantillas JS tipo '+x+', `about:blank` y palabras dentro de textos).
5. Seguridad: VERDE. Sin service_role, ghp_ ni sk-. Solo aparece la clave anon de Supabase (pública por diseño). Nombres de clientes: 0 en el árbol, 0 en el historial publicado (búsqueda por palabra completa; la búsqueda por subcadena da coincidencias dentro de otras palabras, sin ser nombre de cliente).
6. Sesiones: VERDE. Ningún archivo de docs/sesiones/ cambió en las últimas 48 h (el más reciente: convoy-diseno, 10-nov).

Cola: no hice ninguna tarea. Hay 1 tarea en [r] (3-ENG · 5, rama claude/noche-20261116, commit 5a32284) y ninguna marcada [ ]; la cola está vacía de pendientes.

Arreglé: nada (no hacía falta).

Necesita decisión de Miguel / Integrador:
- Revisar y fusionar 3-ENG · 5 (probar «He doesn't speak English.» sin «No puedo verificar»).
- Rellenar la cola con tareas nuevas `[ ]` para las próximas noches.
