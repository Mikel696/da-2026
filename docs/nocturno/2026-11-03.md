# Informe del guardián · 2026-11-03

1. Versiones: 🟢 cloud-sync.js?v=p22 (28 páginas), nb-shared.js?v=p24 (4 páginas). Una sola versión cada uno.
2. Frescura de datos: 🟢 credit-co, jobs-feed, macro-co y world generados hoy 04:00 UTC. Los demás JSON no traen fecha de generación.
3. Sintaxis: 🟢 `node --check` sin fallos en frontend/js/ y frontend/.
4. Enlaces internos: 🟢 sin archivos inexistentes (solo marcadores de plantilla dentro de scripts: about:blank, "...", x, mix, fav, words, phrases).
5. Seguridad: 🟡 
   - Claves: solo la clave `anon` de Supabase (pública por diseño, rol verificado "anon"). Sin service_role, tokens ni sk-.
   - Nombres de clientes: 0 en el árbol, 1 en el historial (conteo con -G sin palabra completa).
     Es el commit eec95e3 (english-engine.html y 08_app.js): coincidencia con una palabra técnica más larga
     ("ytapi"); con palabra completa da 0. Falso positivo casi seguro; confirmado sin citar texto.
6. Sesiones: sin cambios (no existe docs/sesiones/).

Cola: en espera de revisión (2 tareas en [r]: 19-JUE·1 y ·2, rama claude/juegos). No se hizo ninguna tarea nueva.
Arreglos: ninguno necesario.
Decisión de Miguel: revisar y fusionar las 2 tareas [r] de claude/juegos para que la cola avance.
Nota: el clon vino superficial; se corrió fetch --unshallow antes de contar el historial.
