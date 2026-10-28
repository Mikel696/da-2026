# Informe del guardián · 2026-10-28

1. 🟢 Versiones: cloud-sync.js?v=p21 en 29 páginas, nb-shared.js?v=p24 en 4. Una sola versión por archivo.
2. 🟢 Frescura: credit-co, jobs-feed, macro-co y world generados hoy (02:32-02:36 UTC). Los demás JSON no llevan fecha de generación (recommendations.json: 2026-08-27, es manual).
3. 🟢 Sintaxis: node --check sin errores en frontend/js/ y frontend/.
4. 🟢 Enlaces internos: 11 candidatos, todos falsos positivos (textos de JavaScript como "fav", "x", "..."). Ninguno roto de verdad.
5. 🟢 Seguridad: ninguna service_role, token ni sk- en el repo. Solo aparece la clave anon de Supabase (pública por diseño). Nombre del cliente: 265 menciones en 24 archivos (solo conteo).
6. 🟢 Sesiones: no hay archivos en docs/sesiones/ modificados en 48 h.

Arreglos: ninguno necesario, no se creó rama.
Decisión de Miguel: ninguna urgente. Opcional: qué hacer con las menciones al cliente en un repo público.
