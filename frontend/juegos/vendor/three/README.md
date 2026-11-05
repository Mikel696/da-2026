# three.js 0.186.1 · vendorizado para 19-JUE

- Origen: paquete npm `three@0.186.1` (publicado 24-sep-2026), **sin modificar ni minificar**.
- Licencia: MIT — ver `LICENSE` (© 2010-2026 three.js authors).
- `SHA256SUMS.txt` permite comprobar que cada archivo es idéntico al del paquete:
  `curl -sL https://registry.npmjs.org/three/-/three-0.186.1.tgz | tar xz` y comparar.
- Solo se copió lo que usan los juegos: `build/three.module.js` + `build/three.core.js` y, de
  `examples/jsm/`, Octree, Capsule, el compositor de post-proceso (bloom + salida) y RoomEnvironment.
- Para subir de versión: copiar los mismos archivos de la versión nueva, regenerar las sumas y
  jugar los 3 juegos antes de publicar (la API de three.js cambia entre versiones).
