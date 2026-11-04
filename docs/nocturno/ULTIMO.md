# Informe del guardián · 2026-11-04

1. Versiones: 🟢 cloud-sync.js?v=p22 (28 páginas), nb-shared.js?v=p24 (4 páginas). Una sola versión cada uno.
2. Frescura de datos: 🟢 credit-co, jobs-feed, macro-co y world generados hoy 03:11 UTC. Los demás JSON no traen fecha de generación.
3. Sintaxis: 🟢 `node --check` sin fallos en frontend/js/ y frontend/.
4. Enlaces internos: 🟢 sin archivos inexistentes (solo marcadores de plantilla dentro de scripts).
5. Seguridad: 🟡
   - Claves: solo la clave `anon` de Supabase (pública por diseño, rol verificado "anon"). Sin service_role, tokens ni sk-.
   - Nombres de clientes: 0 en el árbol, 2 en el historial con búsqueda por subcadena (commits dba63f1 y eec95e3,
     english-engine.html y 08_app.js). Con palabra completa da 0 en todo el historial: falso positivo por una palabra
     técnica más larga, igual que ayer. Sin citar texto.
6. Sesiones: sin cambios (no existe docs/sesiones/).

Cola: cola en espera de revisión (2 tareas en [r]: 19-JUE·1 y 19-JUE·2, rama claude/juegos). No se hizo ninguna.
Arreglos: ninguno necesario.
Decisión de Miguel: revisar y fusionar las dos tareas [r] de claude/juegos para que la cola avance.
