# Informe nocturno · 2026-11-28

1. Versiones en lockstep: 🟢 cloud-sync.js?v=p26 (28 páginas) y nb-shared.js?v=p28 (4 páginas); una sola versión por archivo.
2. Frescura de datos: 🟢 credit-co, jobs-feed, macro-co y world generados hoy 28-nov (04:56 UTC). Las fechas de jobs-companies, rol-objetivo y plan-cerebro son de edición manual (24-26 nov).
3. Sintaxis: 🟢 `node --check` sin fallos en frontend/js/ y frontend/.
4. Enlaces internos: 🟢 10 hallazgos, todos falsos positivos (cadenas de JS como «mix», «fav», «words», «about:blank»); ningún archivo real falta.
5. Seguridad: 🟢 sin service_role, sk-, tokens ni contraseñas reales (solo textos de ejemplo en scraper/node_modules y menciones en informes viejos). Nombres de clientes: 0 en el árbol, 0 en el historial.
6. Sesiones: docs/sesiones/2026-11-10-convoy-diseno.md — el juego de carreras pasa a ser «Corredor» (convoy); retoma desde «Dónde quedó».

Cola: en espera de revisión. Solo hay una tarea en [r] (3-ENG · 5, «English»/«Spanish») y ninguna en [ ]; no se hizo nada nuevo.

Arreglos: ninguno necesario.
Decisión de Miguel: ninguna. Nota menor: `scraper/node_modules` está dentro del repo (ocupa espacio; conviene que el Integrador lo revise).
