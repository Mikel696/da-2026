---
paths:
  - "src/english-engine/**"
  - "frontend/pages/english-engine.html"
---

<!-- Se carga solo cuando Claude lee, escribe o edita un archivo de `paths`. Extraído de CLAUDE.md el 12-nov-2026; el contenido no cambió. -->

## 🏗 3-ENG · EL ÚNICO MÓDULO CON BUILD

`frontend/pages/english-engine.html` (1,2 MB) **NO se edita a mano**. Se ensambla desde las
piezas de `src/english-engine/`:

```bash
bash src/english-engine/build.sh
```

Es la excepción a «cada módulo es un `.html` autocontenido que se edita directo». La
arquitectura del resultado no cambia: sigue siendo un solo archivo, vanilla, sin dependencias,
que funciona sin internet. Lo que cambia es de dónde sale.

**La regla:** si tocas el HTML construido y no tocas las piezas, tu cambio muere en el
siguiente build. Hasta el 11-sep-2026 esas piezas vivían en un directorio temporal fuera del
repositorio — el HTML publicado no tenía fuente versionada.

- `src/english-engine/README.md` documenta el orden del build, el formato de los datos, cómo
  añadir vocabulario y **tres trampas que ya han roto cosas** (el acento grave con comillas
  dobles en `build.sh`, las copias sueltas de módulos que NO entran en el build, y
  `String.replace` interpretando `$&` dentro del reemplazo).
- `.gitattributes` fija `eol=lf` en estas piezas: con `core.autocrlf=true` el build dejaría de
  ser reproducible.
- Todo el motor está en `08_app.js` (409 kB). **No hay copias sueltas de los módulos** y es a
  propósito: existían y eran una trampa.
- `node --check` **no es prueba de nada**. La verificación real son las 8 auditorías en el
  navegador sobre el HTML construido, y **en producción**, no solo en el preview.
