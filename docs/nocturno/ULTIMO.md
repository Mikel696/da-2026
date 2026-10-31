# Informe del guardián · 2026-10-31

1. Versiones: 🟢 cloud-sync.js?v=p22 (28 páginas) y nb-shared.js?v=p24 (4 páginas), una sola versión cada uno.
2. Frescura de datos: 🟢 credit-co, jobs-feed, macro-co y world generados hoy 02:41 UTC. Los demás JSON con fecha son registros, no feeds.
3. Sintaxis: 🟢 node --check sin fallos en frontend/js/ y frontend/.
4. Enlaces internos: 🟢 sin rotos reales (solo falsos positivos: textos dentro de scripts como "mix", "fav", "words").
5. Seguridad: 🔴 nombres de clientes: 0 en el árbol, 1 en el historial.
   - Claves: solo la anon pública de Supabase; sin service_role, sk- ni tokens.
   - Detalle rojo: el commit eec95e3 (el commit inicial público) contiene una coincidencia de uno de los términos (la búsqueda en historial es por subcadena, no palabra completa) en frontend/pages/english-engine.html y src/english-engine/08_app.js. En el árbol actual da 0 con palabra completa, así que probablemente es una palabra normal del vocabulario de inglés que contiene esas letras (falso positivo). No lo toqué: Miguel decide si lo revisa.
6. Sesiones: sin cambios (no existe docs/sesiones/).

Cola: no se hizo ninguna tarea porque el chequeo 5 salió ROJO. (Estado de la cola: tarea 1 en [r], tareas 2 y 3 pendientes.)

Arreglos: ninguno necesario.

Necesita decisión de Miguel: confirmar si la coincidencia del commit eec95e3 es un falso positivo (palabra de vocabulario). Si lo es, conviene que el Integrador cambie la búsqueda del guardián a palabra completa (-w) también para el historial.
