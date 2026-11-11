# Hornear impostores (19-JUE · Corredor)

Los árboles escaneados de Poly Haven pesan demasiado para el juego (`fir_tree_01`: 4,2 M de triángulos y 487 MB;
`pine_tree_01`: 7 M y 958 MB). Estas herramientas los fotografían **una vez** desde 3 ángulos (color + normales) y guardan
solo la foto en WebP (`frontend/juegos/assets/ph/imp/`). El juego planta cada árbol como 3 planos cruzados.

1. Bajar los modelos a una carpeta de trabajo **fuera del repo** (CC0, con autor y suma):
   `node bajar.mjs <trabajo>/dl fir_tree_01:mod:1k pine_tree_01:mod:1k > <trabajo>/dl/creditos.json`
2. Servir: `node servidor.mjs <raíz del repo> <trabajo>` y abrir `http://localhost:3472/h/hornear.html`
   (sirve `/f/` = frontend, `/dl/` = descargas, `/h/` = esta carpeta copiada en `<trabajo>/herr`; guarda en `<trabajo>/out`).
3. En la consola de esa página:
   - `await hornearArbol('/dl/mod/fir_tree_01/fir_tree_01.gltf', 'abeto', ['fir_tree_01_a_LOD0','fir_tree_01_b_LOD0','fir_tree_01_c_LOD0'], { K: 3, densidad: 0.011 })`
   - `await hornearArbol('/dl/mod/pine_tree_01/pine_tree_01.gltf', 'pino', ['pine_tree_01_a_LOD0','pine_tree_01_b_LOD0','pine_tree_01_c_LOD0'], { K: 3, densidad: 0.011 })`
   - `await hornearArbol('/f/juegos/assets/ph/mod/fir_sapling/fir_sapling.gltf', 'abeto_joven', ['fir_sapling_a','fir_sapling_b','fir_sapling_c'], { K: 3, densidad: 0.004 })`
   - `await hornearPasto('<url de grass_medium_02.gltf>', 'pasto', 0.45, 26, { K: 2, densidad: 0.0025, aoMin: 0.55 })`
4. Copiar `<trabajo>/out/*.webp` a `frontend/juegos/assets/ph/imp/` y pasar las medidas que devuelve (`R`, `H`, alturas,
   alto del atlas) a `IMP` en `frontend/juegos/js/co-paisaje.js`. Anotar sumas en `assets/ph/CREDITOS.json`.

Trampa: la vista previa del panel de Claude se congela si queda oculta (sin cuadros); hornear no la necesita visible.
