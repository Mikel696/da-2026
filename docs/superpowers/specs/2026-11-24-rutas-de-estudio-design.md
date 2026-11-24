# 14-WORK · Rutas de estudio por habilidad — diseño

Fecha: 2026-11-24 · Aprobado por Miguel («Sí, apruebo», sobre el boceto mostrado en el chat).

## Por qué

El Mapa del rol (24-nov) muestra qué piden 39 vacantes reales de implementación y automatización con IA y qué de eso
ya figura en el perfil de Miguel. Pedido textual: «quiero que cada item me dé la ruta de estudio de cada cosa,
cuadernos especializados para cada cosa, quiero comenzar […] todo debe estar interconectado, todo debe ser interactivo,
con seguimiento de proceso, en lenguaje natural que debo aprender en que porcentaje». El mapa dice dónde está la
distancia; las rutas son cómo se recorre.

## Metas

1. Clic en una habilidad del mapa → se abre su ruta: qué es en palabras simples, qué vacantes de la muestra la piden,
   y 4–6 pasos. Cada paso: qué aprender, un recurso gratis y real (enlace comprobado), y una práctica que deja algo hecho.
2. «Empezar» crea el cuaderno de esa ruta en 14-WORK (una página por paso, con la práctica escrita) y lo abre.
3. Seguimiento: marcar cada paso hecho; % por ruta y una frase global: «Hoy cubres el N % de lo que piden las 39
   vacantes», más «si terminas X, subes a Y %».
4. Conectado: los pasos de IA enlazan a misiones del AI Dojo (17-IA), inglés a 3-ENG, todo a 5-JOB; la portada muestra
   las rutas empezadas y los pasos hechos.

## No metas (v1)

- Rutas para las 25 habilidades: v1 cubre las 6 de más demanda que no están en el perfil (Python 14, IA generativa 12,
  levantamiento de requerimientos 11, Power Automate 10, RPA 10) e inglés (26, «en progreso»). El resto, después.
- Marcar pasos automáticamente según el avance en el Dojo o en 3-ENG (se enlaza; el check es de Miguel).
- Cambiar la lista «ya lo tienes» (`YA_TIENE`): sigue pendiente que Miguel la confirme.

## Anti-metas (si pasa esto, falló aunque funcione)

- Un recurso inventado, un enlace roto o una duración que la fuente no publica.
- Perder un paso marcado al usar dos equipos, o duplicar el cuaderno de una ruta.
- Copiar contenido del AI Dojo o de 3-ENG en vez de enlazarlo.
- Un % que no se puede explicar en una frase.

## Restricciones

- Vanilla JS, offline-first, repo público (nada interno del empleador ni de sus clientes).
- P0: el avance vive en una key sincronizada nueva; probarlo con dos «equipos» antes de darlo por bueno.
- Tocar `cloud-sync.js` obliga a subir su versión en las 28 páginas a la vez (regla 7) y a correr
  `node scripts/prueba-sync-carrera.mjs`.
- El contrato de cuadernos (`nb-shared.js`) no se toca. `work.js` gana una función de creación; no se toca el autoguardado.
- Verificar en producción, no en la vista previa.

## Enfoques considerados

| Enfoque | A favor | En contra | Decisión |
|---|---|---|---|
| **A · Rutas dentro del Mapa del rol** (14-WORK) | Un solo lugar; el % sale directo del mapa; el coach queda entero | Más código en 14-WORK | **Elegido** (recomendación aceptada) |
| B · Rutas solo como cuadernos | Casi sin código | El % se vuelve frágil (editar el texto lo mueve); poca interacción | Descartado |
| C · Rehacer 4-RUT como ruta del rol nuevo | Reusa un módulo de «rutas» | 4-RUT es del objetivo viejo; parte el coach en dos módulos | Descartado (4-RUT se decide aparte) |

## Cómo (decidido)

### Datos

- `frontend/data/rutas.json` (estático, versionado, público): por ruta `{id, competencia (nombre exacto del mapa),
  queEs, pasos:[{id, titulo, aprender:[…], recurso:{nombre, proveedor, url}, practica, enlace?:{modulo, url, texto}}]}`.
  Los ids son estables (`python`, `python-1`…). «Qué vacantes la piden» se deriva de `rol-objetivo.json` (no se escribe).
- Avance: key nueva **`work_rutas`**, array de registros `{id, tipo:'ruta'|'paso', ruta, hecho?, empezada?, nb?, updated}`.
  En `SYNC_REGISTRY` y en `ARRAY_MERGE_KEYS` con `{id:'id', ts:'updated'}`: la nube mezcla registro por registro y
  gana el más nuevo. Desmarcar = `hecho:false` con hora nueva (no se borra el registro: así no hacen falta lápidas).
- Cuaderno de ruta: id fijo `work_nb_ruta_<id>`, páginas `ruta_<id>_<paso>`. Si los dos equipos lo crean, la mezcla de
  cuadernos (por id de cuaderno y de página) los une. Si ya existe, «Empezar» solo lo abre.

### Pantalla

- En el mapa, las filas con ruta muestran «Ver ruta» (botón con `aria-expanded`); el panel se abre debajo de la fila.
- Arriba del mapa, el bloque «Tu avance»: frase global, «si terminas X, subes a Y %», y las rutas empezadas.
- Panel de ruta: qué es · lo piden (nombres de las vacantes de la muestra) · pasos con casilla, recurso y práctica ·
  % de la ruta · «Empezar» / «Abrir mi cuaderno».

### El % (una frase, sin magia)

- Ruta: pasos hechos / pasos totales.
- Global = Σ (vacantes que piden la habilidad × cobertura) / Σ vacantes que piden cada habilidad, sobre las 25.
  Cobertura: 1 si figura en el perfil; el % de su ruta si tiene ruta; 0 si no. Se explica en un desplegable, con la
  salvedad de que «en el perfil» viene de una lista que Miguel aún no confirmó.

### Archivos

- Nuevo `js/work-rutas.js` (`WorkRutas`: lee `rutas.json`, lee y escribe `work_rutas`, calcula %).
- `js/work-rol.js`: botón y panel por fila; bloque «Tu avance». Sigue sin escribir nada él mismo.
- `js/work.js`: `WorkNB.ensureNotebook(id, nombre, icono, paginas)` (crea si falta; devuelve el id) y `WorkNB.open(id)`.
- `js/cloud-sync.js`: `work_rutas` en `SYNC_REGISTRY` y `ARRAY_MERGE_KEYS`; versión p25 → p26 en las 28 páginas.
- `js/inicio.js`: la tarjeta de 14-WORK cuenta rutas empezadas y pasos hechos.
- `css/work.css`: bloque `.ruta-*`.

## Lo que queda al constructor

- Elegir los recursos de cada paso entre fuentes oficiales y gratuitas (Microsoft Learn, UiPath Academy, Kaggle Learn,
  Atlassian, la Guía de Scrum, el AI Dojo, 3-ENG), comprobando cada enlace (HTTP 200 y título) el día que se publica.
  Sin duraciones salvo que la página las publique.
- Redacción de «qué es» y de cada práctica: lenguaje simple, sin prometer resultados de empleo.
- Diseño visual del panel dentro del sistema actual de 14-WORK (cian, IBM Plex, Newsreader).

## Decisiones menores (tomadas en la revisión del constructor)

- `rutas.json` sin red: misma copia en Cache Storage `work-datos` que el mapa, con aviso.
- Inglés («en progreso») cuenta en el % global con el % de su ruta.
- Las páginas del cuaderno de ruta son HTML simple (título, qué aprender, recurso con enlace, práctica, «Mis apuntes»);
  todo texto de `rutas.json` se escapa al armarlas.
- Los pasos de IA nombran las misiones reales del Dojo (títulos leídos de `MISSIONS` en `pages/ai-dojo.html`).
- La prueba de dos equipos se agrega como escenario nuevo en `scripts/prueba-sync-carrera.mjs` (ya simula pestañas,
  nube falsa y reloj virtual).

## Verificación (antes de darlo por hecho)

- En producción con su sesión: abrir una ruta, «Empezar» (crea el cuaderno con sus páginas), marcar y desmarcar pasos,
  recargar (persiste), ver el % moverse con la cuenta exacta.
- Dos equipos simulados (dos perfiles o una prueba de merge con `prueba-sync-carrera.mjs` ampliada): pasos marcados en
  cada uno se conservan; el cuaderno no se duplica.
- `cloud-sync` p26 en las 28 páginas (contado con grep); 0 errores en 14-WORK, 10-SYS, 13-NOT y la portada.
- Todos los enlaces de `rutas.json` responden 200 el día de publicar.
- Contraparte antes de cerrar.
