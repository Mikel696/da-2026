# Informe nocturno · 2026-10-23

1. Versiones en lockstep: 🟢 cloud-sync.js?v=p20 (29 páginas) y nb-shared.js?v=p22 (3 páginas). Una sola versión por archivo.
2. Frescura de datos: 🟢 credit-co.json y jobs-feed.json generados hoy 01:49 UTC (la Action corre).
3. Sintaxis: 🟢 node --check sin fallos en frontend/js/ y frontend/.
4. Enlaces internos: 🟢 ningún enlace roto real (solo falsos positivos: about:blank, "...", "x", "mix", "fav", "words", "phrases", que son texto de ejemplo en el código).
5. Seguridad: 🟡 sin service_role, sin tokens ni sk-. La clave SUPA_ANON (rol anon, pública por diseño) está en 5 archivos: normal. Menciones de 'Ficohsa': 255 (decisión tuya, ya pendiente: retirar 14-WORK del sitio público).
   Nota: scraper/node_modules está versionado en el repo (ruido; conviene sacarlo con .gitignore, requiere tu OK).
6. Sesiones: sin archivos en docs/sesiones/ modificados en 48 h.

Arreglos hechos: ninguno (nada que arreglar).
Necesita decisión de Miguel: Ficohsa en repo público; scraper/node_modules versionado.
