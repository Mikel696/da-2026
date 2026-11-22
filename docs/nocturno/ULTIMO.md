# Informe del guardián · 2026-11-22

1. Versiones en lockstep: VERDE. cloud-sync.js?v=p25 en 28 páginas; nb-shared.js?v=p24 en 4. Una sola versión por archivo.
2. Frescura de datos: VERDE. credit-co, jobs-feed, macro-co y world generados hoy 22-nov (03:27 UTC). ofertas-caza y ofertas-juegos revisados el 21-nov. Los demás JSON son estáticos (sin fecha de generación).
3. Sintaxis: VERDE. node --check sin fallos en frontend/js/ y frontend/.
4. Enlaces internos: VERDE. Ninguno roto de verdad (solo texto de código que parece enlace: about:blank, «...», «x», «mix», «fav», «words», «phrases»).
5. Seguridad: VERDE. Sin service_role, tokens ni sk-. Solo la clave anon de Supabase (pública por diseño). Nombres de clientes: 0 en el árbol, 0 en el historial publicado (como palabra completa).
6. Sesiones: sin archivos en docs/sesiones/ modificados en las últimas 48 h.

Cola: no se hizo nada. No hay tareas en [ ]; solo 1 en [r] (3-ENG · 5, rama claude/noche-20261116, commit 5a32284, sin revisar). La cola está vacía: hay que rellenarla.

Arreglos: ninguno necesario (no se creó rama).

Necesita decisión de Miguel: revisar la tarea [r] pendiente y recargar la cola con nuevas tareas.
