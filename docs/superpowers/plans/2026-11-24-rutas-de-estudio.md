# 14-WORK · Rutas de estudio — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> Miguel pidió ejecutar con **executing-plans en esta misma sesión**.

**Goal:** Cada habilidad del Mapa del rol abre su ruta de estudio, con cuaderno propio, pasos marcables y % (por ruta y global).

**Architecture:** `data/rutas.json` (estático) + key sincronizada `work_rutas` (array mezclado por registro en
`cloud-sync.js`) + `js/work-rutas.js` (lógica y %) + panel dentro de `js/work-rol.js`. Los cuadernos de ruta se crean
con ids fijos en `work_nb_*` vía `WorkNB.ensureNotebook`.

**Tech Stack:** Vanilla JS (IIFE), localStorage + cloud-sync, Node 22 para pruebas (sin dependencias).

**Spec:** `docs/superpowers/specs/2026-11-24-rutas-de-estudio-design.md`

## Global Constraints

- Sin frameworks ni dependencias. IIFE `const X = (function(){ … return {…}; })();`.
- Repo público: nada interno del empleador ni de sus clientes.
- `cloud-sync.js` p25 → **p26** en las 28 páginas que lo cargan (contar con `grep -rl "cloud-sync.js?v=" --include=*.html frontend`).
- Recursos: solo fuentes oficiales y gratuitas, enlace comprobado (HTTP 200) el día de publicar; sin duraciones inventadas.
- `nb-shared.js` y el autoguardado de `work.js` no se tocan.
- Textos en español, frase simple, sin prometer empleo. Todo texto de datos se escapa al pintarlo.
- Verificar en producción (`mikel696.github.io`), no en vista previa.

## Review Focus

1. Marcar pasos sin sesión o sin red → queda en el disco y sube al entrar (Task 1, escenario «sin sesión · marca pasos»).
2. Una competencia de `rutas.json` que no existe en `rol-objetivo.json` → la ruta no aparece sin aviso (Task 2, el verificador falla).
3. Miguel borró el cuaderno de una ruta y pulsa «Abrir mi cuaderno» → se vuelve a crear, sin error (Task 3, prueba `reabre tras borrar`).
4. Dos equipos pulsan «Empezar» en la misma ruta → un solo cuaderno (Task 1, escenario «dos equipos · mismo cuaderno»).
5. Disco lleno al crear el cuaderno → aviso de cuota y la ruta no queda «empezada» (Task 3, prueba `cuota llena`).

---

### Task 1: `work_rutas` sincroniza registro por registro (P0)

**Files:**
- Modify: `frontend/js/cloud-sync.js` (`SYNC_REGISTRY` ~línea 307, `ARRAY_MERGE_KEYS` ~línea 619)
- Modify: las 28 páginas con `cloud-sync.js?v=p25` → `?v=p26`
- Test: `scripts/prueba-sync-carrera.mjs` (escenarios nuevos al final de la lista)

**Interfaces:**
- Produces: key `work_rutas` = `Array<{id:string, tipo:'ruta'|'paso', ruta:string, hecho?:boolean, empezada?:string, nb?:string, updated:string}>`; ids `'<ruta>'` (tipo ruta) y `'<ruta>:<paso>'` (tipo paso).

- [ ] **Step 1: Escribir 3 escenarios** en `prueba-sync-carrera.mjs`:
  - `rutas · dos equipos marcan pasos distintos`: equipo A marca `python:python-1` (hecho), equipo C (otro disco) marca `python:python-2` casi a la vez → al final, nube y ambos discos tienen los dos registros con `hecho:true`.
  - `rutas · desmarcar gana si es más nuevo`: A marca `python-1`; 10 s después C lo desmarca (`hecho:false`, `updated` nuevo) → nube y A terminan con `hecho:false`.
  - `rutas · dos equipos · mismo cuaderno`: A y C escriben en `work_nb_meta` el cuaderno `work_nb_ruta_python` (mismo id, distinto `created`) → la nube tiene uno solo con ese id.
- [ ] **Step 2: Correr y ver fallar** los dos primeros: `node scripts/prueba-sync-carrera.mjs` → FAIL (la key no está registrada; no sube).
- [ ] **Step 3:** agregar `'work_rutas'` a `SYNC_REGISTRY` (junto a las de 14-WORK) y `work_rutas: { id: 'id', ts: 'updated' }` a `ARRAY_MERGE_KEYS`.
- [ ] **Step 4: Correr** `node scripts/prueba-sync-carrera.mjs` → todos los escenarios PASS (los viejos también).
- [ ] **Step 5:** subir `?v=p25` → `?v=p26` en las 28 páginas; `grep -rl "cloud-sync.js?v=p25" --include=*.html frontend | wc -l` = 0 y `…v=p26…` = 28.
- [ ] **Step 6: Commit** `fix(CORE): work_rutas sincroniza por registro (cloud-sync p26)`.

### Task 2: `rutas.json` con 6 rutas y su verificador

**Files:**
- Create: `frontend/data/rutas.json`
- Create: `scripts/verificar-rutas.mjs`

**Interfaces:**
- Produces: `{ version:'2026-11-24', rutas:[{ id, competencia, icono, queEs, pasos:[{ id, titulo, aprender:string[], recurso:{nombre, proveedor, url}, practica, enlace?:{modulo, url, texto} }] }] }`.
  Rutas: `python` (Python), `ia-generativa` (IA generativa (LLM, ChatGPT, Copilot)), `requerimientos` (Levantamiento de requerimientos (discovery)), `power-automate` (Power Automate / Power Platform), `rpa` (RPA (UiPath, Automation Anywhere)), `ingles` (Inglés). 4–6 pasos cada una; ids de paso `<ruta>-<n>`.

- [ ] **Step 1: Escribir `scripts/verificar-rutas.mjs`** que falla (código 1) si: una `competencia` no está en `rol-objetivo.json`; hay ids repetidos; un paso no tiene `recurso.url` https o `practica`; alguna URL (recursos y enlaces externos) no responde 200 con `fetch` (GET, sigue redirecciones). Enlaces internos (`*.html`) se comprueban como archivo existente en `frontend/`.
- [ ] **Step 2: Correr** `node scripts/verificar-rutas.mjs` → FAIL (no existe `rutas.json`).
- [ ] **Step 3: Escribir `rutas.json`.** IA: pasos que nombran misiones reales del Dojo (títulos de `MISSIONS` en `pages/ai-dojo.html`) con `enlace` a `pages/ai-dojo.html`. Inglés: pasos con `enlace` a `english.html` (nombrando la pestaña). Power Automate y RPA: Power Automate para escritorio viene gratis con Windows 11.
- [ ] **Step 4: Correr** `node scripts/verificar-rutas.mjs` → «6 rutas, N pasos, N enlaces 200» y código 0.
- [ ] **Step 5: Commit** `feat(14-WORK): rutas.json con 6 rutas de estudio y su verificador`.

### Task 3: `WorkRutas` (lógica) y `WorkNB.ensureNotebook`

**Files:**
- Create: `frontend/js/work-rutas.js`
- Modify: `frontend/js/work.js` (dentro de `WorkNB`, exportar las 2 funciones)
- Test: `scratchpad/prueba-rutas.cjs` (Node, localStorage y DOM mínimos; no se versiona)

**Interfaces:**
- Consumes: `work_rutas` (Task 1), `rutas.json` (Task 2), `rol-objetivo.json`.
- Produces:
  - `WorkNB.ensureNotebook(id:string, nombre:string, icono:string, paginas:Array<{id,title,body}>) → string|null` (crea si falta, devuelve `id`; `null` si no cupo en el disco) · `WorkNB.open(id:string) → void` (lo activa y hace scroll a `#workNbWrap`).
  - `WorkRutas.cargar() → Promise<{d, guardado}|null>` · `WorkRutas.rutaDe(competencia:string) → ruta|null` ·
    `WorkRutas.marcar(rutaId, pasoId, hecho:boolean) → void` · `WorkRutas.empezar(rutaId) → string|null` (id del cuaderno) ·
    `WorkRutas.pct(rutaId) → number` (0–100, entero) · `WorkRutas.global(rol) → {pct:number, siguiente:{ruta, competencia, pct}|null}` ·
    `WorkRutas.hecho(rutaId, pasoId) → boolean` · `WorkRutas.empezada(rutaId) → boolean`.

- [ ] **Step 1: Escribir pruebas** (`prueba-rutas.cjs`): `pct` = 0 sin marcas y 40 con 2 de 5; `marcar` deja un registro por paso con `updated` ISO y desmarcar pone `hecho:false` (no borra); `global` con el `rol-objetivo.json` real y sin marcas = Σ(vacantes de las «si») / Σ(vacantes de las 25) redondeado; con la ruta python completa sube exactamente 14/Σ×100; `siguiente` = la ruta sin terminar que más sube el global; `empezar` dos veces crea un solo cuaderno con 1 página por paso; `reabre tras borrar` (quitar el cuaderno de `work_nb_meta` y volver a `empezar` lo recrea); `cuota llena` (setItem que lanza `QuotaExceededError`) → `empezar` devuelve `null` y no escribe el registro `tipo:'ruta'`.
- [ ] **Step 2: Correr y ver fallar** (no existe `work-rutas.js`).
- [ ] **Step 3: Implementar** `ensureNotebook`/`open` en `work.js` con `loadMeta/saveMeta/loadData/saveData` (cubierta `c6`, color de `PALETTE`), y `work-rutas.js`. Páginas del cuaderno: HTML simple con título, «Qué aprender», recurso con enlace, «Práctica», «Mis apuntes». Cache `work-datos` igual que `work-rol.js`.
- [ ] **Step 4: Correr** → todo PASS.
- [ ] **Step 5: Commit** `feat(14-WORK): lógica de las rutas (avance, %, cuaderno por ruta)`.

### Task 4: Panel de ruta y «Tu avance» en el mapa

**Files:**
- Modify: `frontend/js/work-rol.js`, `frontend/css/work.css` (bloque `.ruta-*`), `frontend/work.html` (script `work-rutas.js` antes de `work-rol.js`; subir `?v=`)
- Test: `scratchpad/simular.cjs` ampliado

**Interfaces:**
- Consumes: `WorkRutas.*` (Task 3).

- [ ] **Step 1: Ampliar la simulación**: las filas de las 6 competencias con ruta tienen botón `[data-ruta]` con `aria-expanded="false"`; al pulsarlo, el panel muestra «Qué es», las vacantes que la piden (nombres de `rol-objetivo.json`), los pasos con `input[type=checkbox][data-paso]`, el % y «Empezar»; marcar un paso cambia el % del panel y la frase global; «Tu avance» aparece arriba con «Hoy cubres el N % …» y «Si terminas …».
- [ ] **Step 2: Correr y ver fallar.**
- [ ] **Step 3: Implementar** (delegación de eventos sobre `#workRol`; un panel abierto a la vez; foco al panel al abrir; el `<details>` de la frase explica la fórmula y la salvedad de `YA_TIENE`).
- [ ] **Step 4: Correr** → PASS. Revisar a 375 px en un marco (sin desborde).
- [ ] **Step 5: Commit** `feat(14-WORK): panel de ruta y avance dentro del mapa`.

### Task 5: Portada, documentos y producción

**Files:**
- Modify: `frontend/js/inicio.js` (tarjeta 14: rutas empezadas y pasos hechos), `CEREBRO_STATE.md`, `frontend/data/modulos.json` (14WOR), `frontend/data/plan-cerebro.json` (H8), `.claude/rules/14-work.md`, `CLAUDE.md` (fila 14-WORK)

- [ ] **Step 1:** tarjeta 14 en `inicio.js`: `stats` = `[[rutas empezadas,'rutas'],[pasos hechos,'pasos']]` cuando `work_rutas` tenga registros; si no, lo de hoy.
- [ ] **Step 2: Publicar** (push; si Pages falla, commit vacío) y **verificar en producción con su sesión**: abrir ruta, Empezar (cuaderno con N páginas), marcar/desmarcar, recargar (persiste), el % coincide con la cuenta a mano; `cloud-sync` p26 cargado en 14-WORK, 10-SYS, 13-NOT y portada sin errores; localStorage de las otras keys intacto.
- [ ] **Step 3: Contraparte** sobre rutas, recursos y %; corregir lo que salga.
- [ ] **Step 4: Documentos** (estado, ficha, plan H8, protocolo, CLAUDE.md) y commit `docs(14-WORK): rutas de estudio en producción`.
