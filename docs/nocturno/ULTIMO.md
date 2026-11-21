# Informe del guardián · 2026-11-21

1. Versiones en lockstep: VERDE. cloud-sync.js?v=p25 en 28 páginas; nb-shared.js?v=p24 en 4 páginas. Una sola versión por archivo.
2. Frescura de datos: VERDE. credit-co, jobs-feed, macro-co y world generados hoy 21-nov (04:15 UTC). deals/ofertas revisados el 17 y el 20-nov. Los demás JSON son estáticos (sin fecha de generación).
3. Sintaxis: VERDE. node --check sin fallos en frontend/js/ y frontend/.
4. Enlaces internos: VERDE. Ninguno roto de verdad (solo texto de código que parece enlace: about:blank, «...», «x», «mix», «fav», «words», «phrases»).
5. Seguridad: VERDE. Sin service_role, sin tokens ni sk-. Solo aparece la clave anon de Supabase (pública por diseño). Nombres de clientes: 0 en el árbol, 0 en el historial publicado como palabra completa. Nota: una de las búsquedas por trozo de texto (sin límite de palabra) da 7 commits, incluido el raíz eec95e3; son coincidencias dentro de otras palabras, no el nombre. Miguel puede revisarlo si quiere (hashes: 6f09977 32aac2e 3aadb13 142153e 9c58d5e dba63f1 eec95e3).
6. Sesiones: sin archivos en docs/sesiones/ modificados en las últimas 48 h.

Cola: no se hizo nada. Solo hay 1 tarea en [r] (3-ENG · 5, rama claude/noche-20261116, commit 5a32284, sin revisar desde el 16-nov) y ninguna en [ ]. La cola está vacía: hay que rellenarla.

Arreglos: ninguno necesario (no se creó rama).

Necesita decisión de Miguel / Integrador:
- Revisar y fusionar claude/noche-20261116 (3-ENG · 5).
- Rellenar docs/noche/COLA.md con tareas nuevas.
