# ESTADO DEL CEREBRO DA-2026

- **Última actualización:** 2026-04-26
- **Estado global:** 🟢 PRODUCCIÓN — Todos los módulos críticos online en GitHub Pages
- **Live URL:** https://mikel696.github.io/da-2026/frontend/

---

## 🎨 UI/UX Audit + Fixes — Todos los módulos — 2026-04-26

### Auditoría completada (Score promedio: 6.4/10 → ~8/10 post-fix)

**🔴 Críticos resueltos (4):**
1. `css/auth.css` — Reescrito completo: 34 líneas de hex hardcodeado → 100% CSS tokens (`var(--acid)`, `var(--ink)`, `var(--mint)`, `var(--rose)`, etc.)
2. `css/main.css:27` — `a:hover{color:#fff}` → `color:var(--txt)`
3. `css/main.css:68+77` — `.btn-study:hover` y `.btn-ghost:hover` hardcoded `#fff/#e8ff40` → tokens
4. `SistemaDA2026_Tactico.html` — Aliases estándar añadidos en `:root` (`--ac`, `--bd`, `--tx`, `--t2`, `--t3`, `--bg`, `--el`, `--gn`) para alinear con la API de tokens del resto del proyecto

**🟡 Medios resueltos (5):**
5. `js/jobs.js` — Kanban columns: empty state `'Sin postulaciones'` cuando columna vacía
6. `systems.html` — Orbs: `hsl(142,72%,29%)`, `hsl(263,70%,50%)`, `hsl(172,66%,50%)` → `var(--gn)`, `var(--vi)`, `var(--tl)`
7. `news.html` — RSS error state sin cache: añadido botón "↺ Reintentar" en el path de error
8. `css/jobs.css` — `.jsite-btn-es/pt/en/remote`: hex/rgba hardcodeados → `var(--rg/--rd)`, `var(--gg/--gn)`, `var(--cg/--cy)`

**✅ Módulos con empty states pre-existentes (no requirieron cambios):**
- 1-IND: feed offline/error ya manejado
- 8-PRO: histList "Sin prompts guardados" + library "No hay prompts"
- 9-GOA (goals.js): "Sin objetivos", "Sin hábitos aún", "Sin revisiones aún"
- 10-SYS (systems_logic.js): "📹 Aún no hay clases guardadas"
- 13-NOT (notes.js): "Sin notas aún. Crea tu primera nota." + journal vacío

### Estado de diseño por módulo post-fix:
| Módulo | Score | Estado |
|---|---|---|
| 1-IND index | 7/10 | 🟢 |
| 2-APP apply | 7/10 | 🟢 |
| 3-ENG english | 7/10 | 🟢 |
| 4-RUT ruta | 8/10 | 🟢 |
| 5-JOB jobs | **8/10** | 🟢 (empty state + tokens) |
| 6-TOO tools | 8/10 | 🟢 |
| 7-NEW news | **8/10** | 🟢 (retry btn) |
| 8-PRO prompts | 7/10 | 🟢 |
| 9-GOA goals | 7/10 | 🟢 |
| 10-SYS systems | **8/10** | 🟢 (orbs tokenizados) |
| 11-ACC accounting | 7/10 | 🟢 |
| 12-FIN finance | 7/10 | 🟢 |
| 13-NOT notes | 7/10 | 🟢 |
| 14-TAC Tactico | **7/10** | 🟢 (aliases añadidos) |
| auth.css | **8/10** | 🟢 (reescrito total) |
| main.css | **7/10** | 🟢 (color leaks corregidos) |

### Deuda técnica restante (baja prioridad):
- Borders de `.jsite-btn-*` aún usan `rgba()` inline (no hay tokens de borde por color disponibles)
- Token naming duality (`--acid` en main.css/Tactico vs `--ac` en módulos nuevos) — requiere decisión arquitectural de unificación futura

---

## fix(8-PRO) · Prompt Lab — Copy button & Bootstrap prompt — 2026-04-26

### Qué cambió
- **Bug copy raíz:** `window._PLIB=lib` + funciones globales `_copyPrompt(idx)` y `_toggleCard(card)` en lugar de event delegation con `lib` en closure (que no era accesible tras innerHTML replace en algunos engines). Ahora el botón 📋 copia con onclick inline directo a globales.
- **Fallback clipboard mejorado:** `textarea` con `focus()` antes de `select()` → `execCommand('copy')` más confiable.
- **Nuevo prompt:** `🧠 CEREBRO Bootstrap · Sesión Nueva` en categoría `claude` — protocolo de inicio de sesión fresca, lee CEREBRO_STATE.md + CLAUDE.md, extrae pendientes y despliega menú.
- Commits: `38aee48` (first fix) → `3610f9f` (delegation attempt) → `HEAD` (bulletproof globals)

### Estado 8-PRO: 🟢 PRODUCCIÓN
Cards abren · Botón 📋 copia · Bootstrap prompt disponible en filtro 🤖 Claude Code

---

## 📹 10-SYS · DIS34 Ingeniería Web — Auditoría de sesiones grabadas — 2026-04-22

### Contexto
Miguel perdió las clases de Ing. Web de Abr 8 y Abr 15. Se extrajeron transcripts vía Direct-Fetch Protocol (Chrome MCP) desde las grabaciones de Drive ya abiertas en tabs del navegador. Tab 59537227 = Apr 8, Tab 59537238 = Apr 15.

### Sesión 2 — Abr 8 (2h 24min) · Prof. HEYNER LEONEL BECERRA RAMIREZ
**Tema central: Configuración del entorno de desarrollo**

Pasos cubiertos en clase:
1. Verificar PHP en terminal: `php -v`
2. Instalar **XAMPP (SAM)** — Apache + MySQL activos
3. Instalar **Node.js**
4. Instalar **Composer** → descargar desde `getcomposer.org` → ejecutar `composer-setup.exe`
5. Comando clave: `composer global require laravel/installer`
6. Crear proyecto Laravel: `laravel new [nombre]` → No a Pest/PHPUnit → MySQL como DB
   - Versión instalada por la mayoría: Laravel 9 (algunos obtuvieron versión 12)
7. XAMPP: Apache + MySQL corriendo para levantar el servidor local

**Nota del profe [109:28]:** *"Para la siguiente clase les voy a indicar qué versiones debemos utilizar"* — hubo confusión de versiones de PHP/XAMPP en clase.

**Parcial #1 anunciado [110:14]:** *"Pasar a la presentación que va a entrar para la próxima semana para el **parcial número uno**"*

Segunda mitad de la clase (min 115–144): Presentación teórica — frameworks, Scrum, producto mínimo viable (MVP), calidad del software (QA/CUA), conversación con el producto.

### Sesión 3 — Abr 15 (2h 21min)
**Tema central: UX + Contenido Web + Metodología Ágil (material del Quiz 2)**

**Parcial 1 confirmado [3:41]:** *"Esta semana, muchachos, tienen **del 13 al 19 para presentar el parcial uno**. Ya está disponible"*

**Quiz 2 anunciado [4:19]:** *"la sesión tres, para poder desarrollar el **quiz dos**"*
→ Quiz 2 cubre el material presentado en ESTA clase (sesión 3).

Contenido del Quiz 2 (lo que se presentó):
| Tema | Detalle |
|------|---------|
| **Pilares del Contenido Efectivo** | 4 pilares: Estrategia de Contenido · Claridad y Concisión · Jerarquía Visual y Semántica · Mantenimiento Continuo |
| **UX / Experiencia de Usuario** | Usabilidad, satisfacción del usuario, relevancia del contenido, rapidez de carga |
| **Metodología Ágil / Scrum** | Sprint, Product Owner, Backlog, verificación/testeo, MVP |
| **Tendencias actuales** | Arquitectura de microservicios, contenedores en la nube, Kubernetes, Machine Learning |

**Cierre [140:39]:** *"las personas que tengan problemas con el quizo, mandarme el correíto"* y *"la próxima clase va a ser a las 6:30"* (= clase de hoy Miércoles Apr 22).

### Estado del Quiz 2 (URGENTE)
- **Abrió:** Lunes 20 Abr 00:00 | **Cierra:** Domingo 26 Abr 23:59
- **Intentos:** 2 · **Tiempo:** 45 min · **Calificación:** Más alta
- **Estado Miguel:** ❌ NO INICIADO — 4 días restantes
- **URL:** `https://cdigital.cun.edu.co/mod/quiz/view.php?id=6104299`

### Tabs de Drive identificados (para referencia futura)
- `1GYph10Khg5YvwZMzn3eU1h886km10o1e` — Sesión 2 (Abr 8)
- `1feeLz1xgdMsc_zJYMDpLQ92awxtscwon` — Sesión 3 (Abr 15)
- Carpeta Grabaciones DIS34: `https://drive.google.com/drive/u/3/folders/1MHvHG5WDCUUjfTrPkivzbuuG0uzjtgYR`

### Pendiente
- ⏳ **Sesión 4 — Abr 22:** Miguel está en clase AHORA. Pasará la grabación al finalizar → ejecutar Direct-Fetch Protocol (Modo A) para extraer transcript e inyectar en Tab 7 de 10-SYS.
- ⚠️ **Quiz 2** debe completarse antes del Domingo 26 Abr 23:59.
- Parcial 1 cerró el 19 Abr — ya pasó (no verificado si Miguel lo presentó).

---

## ✨ feat(5-JOB) · Job Tracker — Reestructura tabs de búsqueda — 2026-04-20

### Qué cambió

**Tabs eliminados:** Experiencia, Ruta Data, Ingresos, Empresas

**Tabs nuevos (3 plataformas):**
- `p-li` — LinkedIn: 6 secciones accordion por rol (AP/CxP, Content Mod, Accounting Asst, Customer Service, Data Entry, Skills-based). Primeras 2 secciones pre-abiertas.
- `p-ct` — Computrabajo: 6 secciones equivalentes con URLs colombianas (`computrabajo.com.co`).
- `p-pt` — Job Portals: Indeed CO, Torre.ai, GetOnBoard, RemoteOK, Elempleo, Bumeran.

**Botones por idioma/modalidad** (color-coded):
- 🇪🇸 rojo · 🇧🇷 verde · 🇺🇸 azul · combo púrpura · remoto cyan · presencial ámbar

**JS:** `toggleSec(id)` — abre/cierra accordion. Guard en `renderCmp()` (elemento opcional). `goTab()` actualizado con IDs nuevos + aliases legacy.

**CSS:** `.jsite-*` classes (section, header, body, buttons) añadidas al final de `jobs.css`.

### Archivos modificados
- `frontend/jobs.html` — 4 panels viejos → 3 panels accordion nuevos
- `frontend/css/jobs.css` — añadidas `.jsite-*` classes
- `frontend/js/jobs.js` — `toggleSec()`, guard `renderCmp()`, `goTab()` actualizado

### Estado 5-JOB: 🟢 PRODUCCIÓN
Commit: `e0a2dfd`

---

## ✨ feat(8-PRO) · Prompt Lab — Overhaul profesional — 2026-04-19

### Qué cambió

**Categorías nuevas:**
- `asistente` (cyan) — Companion de Clase, MCQ Rápido (solo letra), MCQ con Explicación completa
- `exam` (rojo) — 8 prompts: Selección Múltiple, V/F con Evidencia, Ensayo/Pregunta Abierta, Examen Oral, Caso de Estudio, Matemáticas P-a-P, ICFES/SABER Pro, Examen de Código Técnico

**UX — Interacción mejorada:**
- Filter bar de categorías (pills): `Todos | Datos | Código | Negocio & Carrera | Aprendizaje | Taller & MCQ | Exámenes | Claude Code`
- **Un clic** = expandir tarjeta (debounce 220ms)
- **Doble clic** = copiar al instante (cancela el timer del clic simple)
- `showCopiedToast()` — toast verde flotante reemplaza `alert()` en toda la librería

**Prompts bonus:**
- `data`: Power Query — Transformación de Datos (código M)
- `learn`: Flashcards para Retención Activa (método Pareto + mnemónicos)

### Archivos modificados
- `frontend/prompts.html` — CSS (`.c-exam`, `.c-asistente`, `.cat-filters`, `.cat-btn`), 13 prompts nuevos, `showCopiedToast()`, `renderLib(filter)` reescrita

### Estado 8-PRO: 🟢 PRODUCCIÓN
Commit: `5441b69`

---

## 🧬 BUGFIX v2 · Highlight legible + Labels removibles + Cuadernos con dropdown — 2026-04-16

### Qué cambió (3 UX bugs reportados por el usuario)

**Bug 1 — Texto resaltado ilegible.** Raíz: `NB.fmt('hl')` solo aplicaba `hiliteColor/backColor`. El color base del editor (`.nb-content { color: #e4e8f4 }`, casi blanco) quedaba sobre el fondo claro (amarillo/verde/rosa) → texto invisible.
- `fmt()` ahora encadena `document.execCommand('foreColor', false, '#1a1a1a')` ANTES del `hiliteColor`, garantizando contraste WCAG-AA.
- Safety net CSS: selectores `[style*="background-color: rgb(255, 245, 157)"]` y variantes hex/rgb/shorthand fuerzan `color:#1a1a1a !important` sobre cualquier elemento resaltado — cubre notas guardadas antes del fix y cualquier edge case donde Chrome aplique solo el background.

**Bug 2 — Labels URGENTE/HECHO no se podían borrar.** Raíz: `document.execCommand('removeFormat')` no elimina `<span>` con clases custom; los badges sobrevivían al botón ✕.
- `fmt('clear')` ahora ejecuta `removeFormat` y luego llama a `removeLabelsInRange(bIn)` que elimina los `.rt-label` que intersectan el rango actual (o todos si la selección está colapsada).
- UX extra: cada badge tiene ahora `onclick="NB.removeLabelEl(this, sid)"` + `cursor:pointer` + pseudo `::after` que muestra " ✕" al hover → un click sobre el badge lo elimina sin pasar por la toolbar.
- Nuevo `removeLabelEl(el, sid)` en el API público de NB.

**Bug 3 — Cuadernos personalizados apilados.** Raíz: `renderCustomList` hacía `list.map(renderCustomCard).join('')` → todos los cuadernos renderizados uno debajo del otro.
- Nueva variable de sesión `activeCustomId` (persistida en `localStorage['sys_active_custom']`).
- `renderCustomList()` ahora pinta:
  1. Un `<select class="cnb-selector-sel">` con `icono + nombre` por cada cuaderno (handler `onchange="NB.selectCustom(this.value)"`).
  2. UN SOLO `renderCustomCard(activeMeta)` debajo, con `cnb-active` wrapper (animación `fu` de entrada).
- `selectCustom(id)` persiste la selección + fuerza `openSubjects.add(id)` para que el `sj-drop` se auto-expanda al cambiar.
- Si el activo fue eliminado / es null, hace fallback al primer cuaderno de la lista.
- CSS nuevo: `.cnb-selector` (barra flex con label + select + hint), responsive a ≤768px.

### Archivos modificados (3)
- `frontend/systems_logic.js` — `fmt` (hl+clear), `removeLabelsInRange`, `removeLabelEl`, `insertLabel` con onclick, `activeCustomId`, `selectCustom`, `renderCustomList` refactor. Exports actualizados.
- `frontend/systems.html` — CSS `.rt-label` hover + "✕" pseudo, safety net `color:#1a1a1a !important`, `.cnb-selector/-lbl/-sel/-hint/-active`.
- `CEREBRO_STATE.md` — esta entrada.

### Verificación manual
- ✅ Resaltar texto con cualquiera de los 3 colores → letras negras sobre fondo pastel, legibles.
- ✅ Insertar ⚠ URGENTE → click directo sobre el badge lo borra.
- ✅ Insertar ✓ HECHO → seleccionar frase con el badge adentro + click ✕ lo elimina junto con otros formatos.
- ✅ ✕ sin selección → borra TODOS los badges del editor activo (atajo "limpiar todo").
- ✅ Tab 7 con 3+ cuadernos: solo se ve el seleccionado, dropdown arriba permite saltar entre ellos.
- ✅ Recargar la página mantiene el cuaderno activo previo (persistencia `localStorage`).

---

## 🧬 BUGFIX · Notebook rich-text + Auth chain platform-wide + Optimizer reforzado — 2026-04-15

### Qué cambió (3 problemas raíz corregidos)

**Problema 1 — Cuadernos sin formato.** El editor `contenteditable` guardaba `textContent` (texto plano), descartando cualquier `<b>`, `<span style="font-size…">` o `<span style="background:…">` que el usuario intentara aplicar. Además no existían controles UI.

- `autoSave(sid)` ahora persiste `bIn.innerHTML` en lugar de `bIn.textContent` → el formato sobrevive al reload y al cloud-sync.
- Añadido helper `renderBodyContent(body)`: detecta tags HTML con regex `/<[a-z][^>]*>/i` y renderiza raw; si no, escapa (backward-compat con notas viejas).
- Nueva toolbar `.nb-rt-toolbar` renderizada por `buildEditorHtml(sid, page)` (compartida entre materias y cuadernos personalizados). Botones:
  - **B** (bold) · **S / M / L** (3 tamaños vía `fontSize` 2/3/5) · **3 resaltadores** (amarillo `#fff59d`, verde `#a5d6a7`, rosa `#f8bbd0`) · **✕** (clear format) · **⚠ URGENTE** / **✓ HECHO** (etiquetas badge).
- Funciones nuevas en NB IIFE:
  - `fmt(sid, kind, value)` — usa `document.execCommand('bold'|'fontSize'|'hiliteColor'|'backColor'|'removeFormat')`. Hace `styleWithCSS` antes de hiliteColor para evitar `<font>` deprecated. Fallback `backColor` para Chrome.
  - `insertLabel(sid, type)` — inserta `<span class="rt-label rt-lbl-urgent|done" contenteditable="false">` vía `insertHTML`, con fallback manual por Range API si execCommand falla.
  - `focusEditor(sid)` helper garantiza foco + rango antes de execCommand (Chrome silenciaba los comandos sin selección).
- CSS añadido en `systems.html`: `.nb-rt-toolbar`, `.nb-rt-btn`, `.nb-rt-sz-s/m/l`, `.nb-rt-hl-y/g/p`, `.nb-rt-lbl-u/d`, `.rt-label`, `.rt-lbl-urgent` (rojo con glow), `.rt-lbl-done` (verde con tachado).
- `renderCustomCard(meta)` refactorizado: ahora llama `buildEditorHtml(meta.id, page)` en lugar de duplicar el HTML inline — los cuadernos personalizados heredan la toolbar automáticamente.

**Problema 2 — "Sesión iniciada" solo visible en 10-SYS.** La cadena de auth (Supabase CDN → `supabase-client.js` → `auth.js` → `cloud-sync.js`) estaba instalada solo en algunos HTML. En los demás, el indicador `#authBadge` nunca se pintaba y el cloud-sync silenciosamente no funcionaba por página.

- Añadida la cadena de 4 scripts antes de `</body>` en **13 archivos**:
  - **Root (4):** `index.html`, `interview-pi3.html`, `interview-sim.html`, `notes.html` (paths: `js/supabase-client.js`, `js/auth.js`, `js/cloud-sync.js`).
  - **Pages (9):** `pages/configurar.html`, `empleos.html`, `ingles.html`, `prompts.html`, `proyectos.html`, `recursos.html`, `ruta.html`, `sesion.html`, `tacticas.html` (paths: `../js/...`).
- Comentario estándar: `<!-- Auth chain: must load on every page so session persists platform-wide -->`.
- Resultado: el badge de sesión y la sincronización ahora funcionan uniformemente en toda la plataforma, no solo en el módulo donde se estaba.

**Problema 3 — Optimizer de prompts no forzaba auth platform-wide.** El generador 8-PRO tenía un constraint débil ("Auth scripts load before module JS") que podía interpretarse como "solo en el módulo trabajado".

- `defaultConstraints` en `claudeOptimize()` reforzado con 2 líneas explícitas:
  - `PLATFORM-WIDE AUTH: Every HTML page MUST include the full auth chain before </body> — Supabase CDN → supabase-client.js → auth.js → cloud-sync.js. The "Sesión iniciada" sync indicator must be visible on EVERY module, not just one. Never ship a page without it.`
  - `If you create, copy, or rename any .html page, immediately add the 4-script auth chain — otherwise cloud sync silently breaks on that module.`
- Nuevos `CO_SIGNALS` (detección automática por regex):
  - Trigger de creación de páginas (`new page|create .html|copy .html|rename .html|new module`) → inyecta recordatorio de añadir auth.
  - Trigger de auth/session/login/supabase → fuerza verificación de scripts en TODAS las páginas.
- Actualizado nota de módulo `GENERAL` + "Full Context Recovery" + "Token Exhaustion Recovery" + "Work on 10-SYS" en `lib[]` con la regla platform-wide.

**Added to SYNC_REGISTRY:** `sys_notebook_meta` (metadatos de cuadernos personalizados — nombre, ícono, color, fecha de creación).

### Archivos modificados (16 total)
- `frontend/systems_logic.js` — NB.fmt, NB.insertLabel, focusEditor, buildEditorHtml, renderBodyContent, autoSave(innerHTML), renderCustomCard refactor.
- `frontend/systems.html` — CSS toolbar + labels (~30 líneas).
- `frontend/prompts.html` — defaultConstraints (+2 líneas) + CO_SIGNALS (+2 reglas) + GENERAL notes + 3 lib prompts actualizados.
- `frontend/js/cloud-sync.js` — SYNC_REGISTRY += `sys_notebook_meta`.
- 13 × HTML — auth chain inyectado antes de `</body>`.

### Verificación manual
- ✅ Escribir texto, seleccionar, click B → bold aplica y persiste tras reload.
- ✅ Cambiar tamaño S/M/L → visible en el editor y en la preview de la lista.
- ✅ Resaltar con los 3 colores → inline CSS `background-color` se guarda.
- ✅ Insertar URGENTE / HECHO → badge renderizado, `contenteditable="false"` evita que se edite el texto del badge.
- ✅ "Sesión iniciada" aparece en cualquier módulo abierto (probado index, notes, ingles, sesion, tacticas).

---

## 🧬 10-SYS · REFACTOR MAYOR — Dashboard limpio + Materias integradas + Cuadernos HD — 2026-04-15

### Qué cambió
Reestructuración completa del módulo 10-SYS para consolidar la información dispersa en 9 pestañas a 8 con flujo coherente "tareas + apuntes dentro de la materia". Testeado con prompt generado por el optimizador 8-PRO (validación end-to-end del pipeline optimizer → refactor).

### Cambios de pestañas (9 → 8)
- **Eliminada:** `🔗 Accesos` (pestaña 3). Sus `quickAccess` y `studyResources` grids se movieron al **Dashboard**.
- **Reemplazada:** `📓 Cuaderno` (antes pestaña 8 para las 5 materias oficiales) → ahora es un **manager de cuadernos personalizados** (pestaña 7, ej: "SQL Course", "AWS Cloud", "Python Bootcamp"). Los cuadernos de materias ahora viven dentro de cada materia.
- **Renumeradas:** Malla (3), Certificaciones (4), CUN Hub (5), Clases Perdidas (6), Cuaderno Personalizado (7).

### Dashboard (Tab 0) — Limpieza
- Eliminado `#semaphoreList` (el semáforo ahora vive dentro de cada materia).
- Movidos `#quickAccess` + `#studyResources` desde Accesos → Dashboard.
- Conservado el form de "agregar tarea académica" + ActionNow card.

### Materias (Tab 1) — Nueva arquitectura por materia
Cada tarjeta de materia ahora incluye **dos dropdowns colapsables**:

1. **🚦 Tareas** — semáforo de prioridades (P0–P4 + Completadas) filtrado por materia. Form inline para agregar tareas específicas a esa materia (texto + prioridad + fecha + `Enter` para guardar). Hace `refreshOwner(sid)` que llama `SYS.render()` o `NB.renderCustomList()` según el contexto.

2. **📓 Cuaderno** — editor inline con mismas funciones que el cuaderno original pero scoped a esa materia. IDs sufijados con `-${sid}` para evitar colisiones. Toolbar con "+ Nueva página", "🔗 Link", "🖼️ Imagen HD".

### Imágenes HD (bug crítico resuelto)
- **Antes:** `maxW = 600px` + `canvas.toDataURL('image/jpeg', 0.7)` → imágenes borrosas.
- **Ahora:** `maxW = 1920px` + `ctx.imageSmoothingEnabled = true` + `imageSmoothingQuality = 'high'` + `canvas.toDataURL('image/jpeg', 0.92)` → HD real.
- Función reutilizable `compressImageToHD(dataUrl)` devuelve una Promise.

### Diálogo de pegado de imágenes (feature nueva)
Modal overlay `#pasteImgOverlay` con 3 métodos de entrada:
1. **Pegar (Ctrl+V)** — handler `handlePaste(e)` escucha `document.addEventListener('paste')` y filtra items con `type.startsWith('image/')`.
2. **Arrastrar y soltar** — dropzone con `dragover/dragleave/drop` listeners, clase `.drag` para feedback visual.
3. **Picker tradicional** — link "busca en tu PC" reutiliza `#nbImgInput` (file input compartido).

Flujo: `openPasteDialog(sid)` → user paste/drop/pick → `pimIngestFile(f)` → FileReader → `pimIngestDataUrl()` → `compressImageToHD()` → preview + caption input → `pimSave()` → `pushImage(sid, dataUrl, caption)` → re-render grid.

### Cuadernos Personalizados (Tab 7) — NUEVO
Manager CRUD completo de cuadernos externos a la malla (cursos auto-dirigidos):
- **Crear:** input nombre + selector de ícono (15 emojis: 📘📗📙📕📒🗒️💻🐍☁️🔧📊🔐🎨🎯⚡) + botón. Paleta de 8 colores rotativos.
- **Listar:** cada cuaderno es una tarjeta `.gc` con ícono clickable (cambiar), título editable (click → prompt), badge de páginas y fecha de creación, botones ✏️ (renombrar) y 🗑 (eliminar con confirm).
- **Editar contenido:** cada cuaderno expande un dropdown idéntico al de materias (mismas funciones NB: newPage, openPage, deletePage, addLink, removeLink, addImage via paste-dialog, removeImage, autoSave).
- **IDs:** prefijo `cnb_<timestamp>`. La función `isCustom(sid)` + `refreshOwner(sid)` enruta re-renders al destino correcto (SYS.render para materias, renderCustomList para customs).

### localStorage schemas
- **`sys_notebook`** (existente, extendido): `{ [subjectId|cnb_id]: { pages: [{id,title,body,links,images,created,updated}], links, images } }`.
- **`sys_notebook_meta`** (NUEVO): `[{ id:'cnb_<ts>', name, icon, color, created, updated }]` — registro de cuadernos personalizados.
- Ambos agregados al `SYNC_REGISTRY` de `cloud-sync.js` para sync Supabase JSONB.

### Fix crítico de scope
- `SYS` y `NB` eran `const` top-level en script clásico → no se asignaban a `window` → guards `if (window.NB && ...)` siempre false.
- **Fix:** `window.SYS = SYS;` y `window.NB = NB;` al final de cada IIFE. Restaura interoperabilidad entre módulos y con inline `onclick` handlers (aunque estos funcionaban vía global declarative env, la detección cross-module necesitaba window).

### Archivos tocados
- **`frontend/systems.html`** — tab strip (9→8), pnl0 Dashboard (sin semáforo, con QA+resources), removido pnl3 Accesos, removido pnl8 (Cuaderno viejo), agregado pnl7 (Cuadernos Personalizados), agregado modal de pegado `#pasteImgOverlay`, CSS nuevo (`.sj-drop`, `.pim-*`).
- **`frontend/systems_logic.js`** — `renderSubjectDetail` reescrito con dropdowns tasks+notebook, agregados `toggleSubjectDrop` + `addSubjectTask`, módulo NB completamente reescrito (per-subject IDs, compressImageToHD, paste-dialog, custom notebooks CRUD), `window.SYS = SYS` + `window.NB = NB`.
- **`frontend/js/cloud-sync.js`** — `'sys_notebook_meta'` agregado al `SYNC_REGISTRY`.

### Smoke tests
- `node -c frontend/systems_logic.js` → OK (1918 líneas).
- Pipeline end-to-end validado: optimizador 8-PRO generó el prompt → este refactor ejecutó sin ambigüedad el plan de 6 sub-tareas.

---

## 🎯 8-PRO · Claude Optimize — NUEVA FEATURE — 2026-04-15

### Qué se creó
Nueva pestaña **🎯 Claude Optimize** (primera pestaña, default) en `frontend/prompts.html` — **token-saver autónomo** para solicitudes a Claude Code. El usuario pega texto en inglés verboso, elige módulo objetivo + tipo de tarea, y obtiene un prompt estructurado (ROLE · REPO · LIVE · MODULE · FILES · STATE KEYS · NOTES · CONTEXT · TASK · CONSTRAINTS · DELIVERABLE) listo para pegar en una nueva sesión. 100% cliente, sin API, sin tokens, sin costo.

### Controles
- **Módulo objetivo** (15 opciones): HOME, 3-ENG, 5-JOB, 8-PRO, 9-GOA, 10-SYS, 11-ACC, 12-FIN, 13-NOT, APPLY, SIM, RUTA, NEWS, TOOLS, GENERAL. Cada uno trae metadata pre-cargada (files, state keys, notes).
- **Tipo de tarea** (7 opciones): feature, bugfix, refactor, rewrite, explore, doc, deploy. Cada tipo inyecta constraints específicas (ej: `explore` → "read-only, return file paths and line ranges"; `refactor` → "preserve observable behavior").
- **Textarea** para pegar el input en inglés verboso.
- **⚡ Optimize Prompt** — dispara el motor autónomo.
- **Stats** live: `N words → M words` (compresión).

### Motor de optimización (IIFE al final de `<script>`)
1. **`coClean(txt)`** — strip fillers con 30 regex multi-word (`so i was thinking maybe we could`, `could you please`, `basically`, `thanks in advance`, `oh and`, `kind of`, etc.) + conversión polite→imperativo (`can you fix` → `fix`) + normalización whitespace + capitalización.
2. **`coExtractTasks(cleaned)`** — split por boundaries oracionales + marcadores numerados + "then/also/and also". Dedup por key de primeros 40 chars.
3. **`coDetectSignals(raw)`** — 8 detectores (`commit|push` → "commit and push when done", `don't break` → "preserve existing", `css|style|design` → "match design tokens", `cloud sync|supabase` → "ensure SYNC_REGISTRY", etc).
4. **Assemble** — combina `CO_MODULE[mod]` metadata + `CO_TASK_HINTS[type]` constraints + detected signals + 4 reglas default (short responses, module codes, 4-layer arch, auth script order).
5. **Stats** — cuenta palabras/chars IN vs OUT, estima tokens (4 chars ≈ 1 token), muestra banner de savings (verde si comprimió, informativo si el input ya era corto).

### Persistencia
- Historial guarda con `plab_h` (existente, ahora con tag `kind:'claude-opt'` + módulo en la fecha).
- `'plab_h'` agregado a `SYNC_REGISTRY` en `frontend/js/cloud-sync.js` → sincroniza entre dispositivos via Supabase JSONB proxy.

### Archivos tocados
- **`frontend/prompts.html`** — pestaña nueva + UI (55 líneas HTML) + motor (~220 líneas JS).
- **`frontend/js/cloud-sync.js`** — `plab_h` agregado al `SYNC_REGISTRY`.

### Smoke tests ejecutados (Node)
- Feature/3-ENG: "So I was thinking maybe we could add..." → 56w → 192w (stripped fillers; 4 tasks extraídos).
- Bugfix/5-JOB: "Could you please help me fix..." → 35w → 151w (imperative + identify root cause constraint).
- Explore/3-ENG: "Explore how the SRS deck works..." → 17w → 155w (añade read-only constraint + file paths requirement).

---

## 🎯 Interview Simulation · Simetrik — ITERACIÓN 3 (walkthrough REAL) — 2026-04-15

### Qué cambió
Miguel descargó y compartió su archivo **`Miguel_Barros.xlsx`** (el archivo real entregado en el test). Analizamos hoja por hoja con `openpyxl` y reescribimos el Tab 2 del simulador con **nombres exactos de las 5 hojas + las fórmulas que realmente usó**:

1. **DB DOTA Normalizada** (56.152 filas) — base del procesador/gateway (lado libro). Columnas creadas AK (CONCATENATE BIN+XXX+ULT4), AM (IF/SEARCH Mastercard/Visa → TD/PRISMA), AN (IFS por BIN → MARCA), AO (IF cascade para merchant), AP (DATEVALUE + 1 día), AQ (VLOOKUP a COMERCIO_1), AR (LLAVE compuesta de 5 atributos), AS (COUNTIF → CONCILIADO).
2. **FD Normalizado** (33.421 filas) — extracto del adquirente (First Data/Fiserv, lado banco). Columnas AB (LEFT 6 de tarjeta), AC (RIGHT 4), AD (LLAVE simétrica), AE (COUNTIF bidireccional).
3. **COMERCIO_1** (1.000 filas) — maestro con COMERCIO/TIPO_COMERCIO/FEE/FECHA INI/FECHA FIN.
4. **Control Cash In** (20.104 filas) — matriz de comisiones por rangos (≤20k=0, 20k-40k=1%×1.21, >40k=base+3%×1.21 IVA).
5. **Resumen Conciliacion** (20 métricas) — dashboard con COUNTA/COUNTIF/SUMIF/TEXT.

### Resultados reales del test (que Miguel puede citar en la entrevista)
- **DB DOTA:** 23.458 conciliados / 56.152 = **41,78%** · Monto conciliado **$56.388.293,60** · No conciliado $81.923.293,78
- **FD:** 18.008 conciliados / 33.421 = **53,88%** · Monto conciliado **$42.384.434,00** · No conciliado $35.919.382,90
- **Control Cash In:** 20.101 colectores (19.046 Rango 1 / 637 Rango 2 / 418 Rango 3) · **Comisión total $1.392.404,73**

### Fórmulas EN INGLÉS (rectifico iteración 2)
El archivo real usa fórmulas **en inglés** (Google Sheets/Excel locale EN): `VLOOKUP`, `COUNTIF`, `DATEVALUE`, `TEXT`, `IFS`, `CONCATENATE`, `LEFT`, `RIGHT`, `ISNUMBER(SEARCH(...))`, `UPPER`, `SUMIF`, `COUNTA`. La iteración 2 (traducción a BUSCARV/etc.) se revirtió donde aplicaba. Tab 1 (El Rol), Tab 3 (Q&A — COUNTIF/SUMIF), Tab 4 (STAR) actualizados.

### Decisión técnica clave defendible
**COUNTIF bidireccional** (no VLOOKUP) para conciliar — porque solo importa verificar existencia, no traer valor. VLOOKUP queda para enriquecer contra el maestro COMERCIO_1. La llave compuesta tiene 5 atributos: comercio | BIN | ult4 | fecha (DD/MM/YYYY con +1 día en DB DOTA por desfase T+1 de liquidación) | monto.

### Archivos tocados
- `frontend/interview-sim.html` — Tab 2 reescrito completo (8 pasos con nombres reales + interpretación entre paréntesis + glosario), Tab 1/3/4 alineados a inglés.

---

## 🔧 Interview Simulation · Simetrik — ITERACIÓN 2 — 2026-04-14

### Cambios solicitados por Miguel
1. **Fórmulas en Excel español** (Colombia usa BUSCARV/BUSCARX, no VLOOKUP/XLOOKUP)
2. **Más analítico** — no incluir fórmulas que no se usaron realmente en el test
3. Walkthrough del test técnico (Tab 2) reducido al mínimo realista

### Qué se ajustó
- **Tab 2 (Walkthrough)** — todas las fórmulas traducidas: `BUSCARV` / `BUSCARX` / `SI.ERROR` / `SUMAR.SI.CONJUNTO` / `CONTAR.SI` / `TEXTO(...;"aaaammdd")` / `ESPACIOS` / `MAYUSC` / `LIMPIAR` / `VALOR` / `SUSTITUIR` / `FECHANUMERO` / `ABS`. Eliminados tecnicismos no confirmados (LET, FILTER, Power Query del walkthrough, REGEX).
- Agregadas **dos alertas visibles** al inicio del Tab 2:
  - `tip-r` "⚠️ AJUSTA ESTA SECCIÓN" — explicando que no tengo acceso al archivo real (Drive privado) y que Miguel debe reemplazar cualquier fórmula que no usó.
  - `tip-v` "🎯 Principio rector" — recordándole que el evaluador busca LÓGICA, no fórmula específica.
- Agregado **recordatorio final `tip-r`** al cierre del Tab 2: "Abrí tu archivo real y revisá celda por celda qué fórmula usaste".
- **Tab 3 Q&A** — preguntas técnicas traducidas: "¿BUSCARV vs BUSCARX vs INDICE+COINCIDIR?" y "¿SUMAR.SI.CONJUNTO vs SUMAPRODUCTO?" — con ejemplos en sintaxis española (punto y coma como separador).
- **Tab 1 (El Rol)** — lista de Excel avanzado actualizada a funciones en español.
- **Tab 1 (Pitch 30 seg)** — "XLOOKUP, Power Query" → "BUSCARV, BUSCARX, SUMAR.SI.CONJUNTO".
- **Tab 4 STAR** — respuesta de proyecto difícil usa ahora `BUSCARV`+`SI.ERROR` / `INDICE+COINCIDIR`.

### Por qué no pude verificar al 100%
Los archivos de Drive (test original + archivo completado + carpeta) requieren auth de Google — WebFetch devuelve 401. Miguel debe <strong>abrir su archivo real antes de ensayar</strong> y editar cualquier fórmula del walkthrough que no haya usado. El cambio se hizo pensando en <strong>minimizar el riesgo de decir fórmulas incorrectas</strong> durante la entrevista.

---

## 🎯 Interview Simulation · Simetrik (Pi3Ai) — NUEVA FEATURE — 2026-04-14

### Contexto
Entrevista agendada **miércoles 15 abril 4:00–4:30pm COT** con Juan Henao / Aide López / Angie García (Simetrik staff) para validar rol **Implementation Specialist COL** del proceso Pi3Ai. Miguel ya pasó el test técnico (conciliación bancaria en Excel) y este es el último filtro.

### Qué se creó
Página `frontend/interview-sim.html` — módulo completo de preparación 360° con 7 tabs:
1. **🏢 Simetrik** — Perfil corporativo (fundada 2019, Y Combinator W18, $114M raised, Goldman Sachs, clientes Nubank/Rappi/Mercado Libre), arquitectura del producto (ingestión → matching → excepciones), casos de uso, diferenciadores vs BlackLine/Trintech.
2. **💼 El Rol** — Responsabilidades traducidas, pitch de 30 seg memorizable, skills blandas, preguntas sobre compensación PJ (rango USD 1,800–2,500).
3. **🧪 Test Técnico (Walkthrough)** — **7 pasos** de explicación para compartir pantalla: entendimiento → limpieza → diseño de llave compuesta → matching XLOOKUP → clasificación de excepciones → tabla dinámica → reporte final. Defiende el concepto "llave robusta" (exigido literalmente en JD).
4. **❓ Q&A Técnico** — 12 preguntas probables con respuesta modelo (VLOOKUP vs XLOOKUP, llave robusta, FULL OUTER JOIN en SQL, matching 1:N/N:M, Power Query, conciliación bancaria vs switch, 4x1000 colombiano, query de duplicados, levantamiento de requerimientos semana 1, debugging, Power BI para 10 implementaciones, SUMIFS).
5. **🗣️ Q&A Personal / STAR** — 10 preguntas comportamentales con framework STAR (presentación, por qué Simetrik, proyecto difícil, cliente difícil, error cometido, múltiples clientes, 3 años, preguntas para ellos, contrapropuestas, pretensión salarial).
6. **🇧🇷 Português BR** — 6 Q&A bilingües ES/PT-BR + glosario de 19 términos técnicos + tips de pronunciación (por si Juan/team BR cambia de idioma para validar).
7. **✅ Checklist** — Preparación T-24h / T-2h / T-10min / durante / post-entrevista con checkboxes persistentes en localStorage (key `sim_interview_chks`).

### Archivos tocados
- **`frontend/interview-sim.html`** (NUEVO, ~600 líneas) — módulo self-contained matching design de apply.html.
- **`frontend/index.html`** — agregado link destacado en Quick Workshop: "🎯 Simetrik Interview · 15 Abr" con border rojo/violeta para destacar urgencia.

### Research realizado
- WebFetch a `getsimetrik.com/es/platform` → arquitectura 3 pasos + 4,990 integraciones
- WebSearch `Simetrik founders funding` → Alejandro Casas + Santiago Gómez, ex-YC W18, pivot de Ropeo, Series B $55M + extensión $30M en 2025 con Goldman Sachs
- WebFetch a `simetrik.com` → use cases (fees, disputas, FX, liquidity, merchant reporting, cierre)

### Cloud sync status
✅ Checkboxes del checklist se guardan en localStorage (`sim_interview_chks`). **Pendiente agregar key al SYNC_REGISTRY** si Miguel quiere que el progreso del checklist se sincronice entre dispositivos.

### Deep link
`https://mikel696.github.io/da-2026/frontend/interview-sim.html` — accesible desde Quick Workshop en la home.

---

## 📓 10-SYS · Tab 8 "Cuaderno" — NUEVA FEATURE — 2026-04-14

### Qué se agregó
Cuaderno digital con apariencia de cuaderno real (tema oscuro para cuidar la vista del operador) dentro del módulo de Ingeniería de Sistemas. 5 secciones/materias, páginas con título + cuerpo contenteditable sobre cuadrícula con renglones azules, links de estudio, galería de imágenes con **lightbox** (visor con navegación ←/→/Esc), autoguardado 500 ms + badge "✓ guardado", contadores de páginas por materia.

### Archivos tocados
- **`frontend/systems.html`** — CSS notebook re-escrito en tema oscuro (#1a1f2e base, tinta `#e4e8f4`, renglones `rgba(120,160,230,.18)`, margen rojo, lomo bronce, agujeros con sombra interna). Lightbox modal agregado al final del body (`#nbLightbox` con botones prev/next/close). Badge "✓ guardado" en header. Tab 8 "📓 Cuaderno" visible en la tira de tabs.
- **`frontend/systems_logic.js`** — Módulo `NB` IIFE (~230 líneas). Nuevas funciones: `viewImage`, `closeImage`, `prevImage`, `nextImage` (lightbox). `init` ahora pinta puntos de color por materia + contador de páginas. `autoSave` dispara el badge de guardado. Shortcuts teclado Esc/←/→ para el lightbox.
- **`frontend/js/cloud-sync.js`** — `SYNC_REGISTRY` incluye `sys_notebook` → sincronización automática vía proxy de `localStorage.setItem`.

### Fix crítico aplicado en esta sesión
- **Imagen abría pestaña en blanco** al hacer click — era `window.open(this.src)` con data URLs base64. Reemplazado por lightbox modal in-page con navegación entre imágenes.
- **Fondo claro lastimaba la vista** — migrado a paleta oscura completa (paper → #1a1f2e, header gradient → #1f2638/#181d2c, spine → bronce #4a3820, holes → #0a0d16).

### Polish aplicado
- Gradiente radial sutil violeta en la página
- Glow en margen rojo y brillo en spine
- Focus-state: líneas de cuadrícula más visibles al escribir
- Placeholder itálico gris suave
- Caret azul suave (`#8bb4ff`)
- Puntos de color por materia (violeta, cian, verde, ámbar, rojo)
- Contador de páginas por materia en los chips

### Estado cloud sync
✅ `sys_notebook` registrado en `SYNC_REGISTRY` (línea 232 de `cloud-sync.js`). Al modificar una página, el proxy de `localStorage.setItem` dispara `CLOUD.push()` automáticamente. Disponible desde cualquier dispositivo al hacer login.

### Claves localStorage
- `sys_notebook` — objeto `{ [subjectId]: { pages: [...], links: [], images: [] } }`

---

## 🔒 10-SYS · Ingeniería de Sistemas — 100% COMPLETO Y CERRADO — 2026-04-09

### Estado final del módulo
**MÓDULO CERRADO PERMANENTEMENTE.** Listo para uso diario. La inyección manual de syllabus se detuvo por decisión del operador. Todo lo que está cargado es **dato real, verificado por el usuario** — cero extrapolación, cero invención. El Direct-Fetch Protocol para Tab 7 quedó verificado end-to-end (Mat Especiales en producción). No hay trabajo pendiente en este módulo: cualquier nueva sesión de clase usa el protocolo Modo A o Modo B ya documentado, sin necesidad de modificar código.

### Datos académicos cargados (período 26V02)
| Materia | cdigital_id | Estado | Datos cargados |
|---|---|---|---|
| ✅ DIS34 Ing. Web | 104362 | COMPLETO | Profesor, horario, 4 subject_links, 7 tareas (Cortes 1-3) |
| ✅ DIS31 Mat. Especiales | 101285 | COMPLETO | Profesor (Cortés Cruz), email, horario Mié/Vie, 3 subject_links, 7 tareas |
| 🟡 DIS36 Inv. C&T | 104253 | PARCIAL | Solo 3 tareas Corte 1 (Tarea 1, Quiz 1, Tarea 2). Sin pesos, sin Cortes 2-3 |
| ⚪ A1I01 English Beginner 1 | 100774 | PENDIENTE | Solo placeholder en SUBJECTS — sin syllabus |
| ⚪ CE1026 Placement Test BE+ | 106289 | PENDIENTE | Solo placeholder en SUBJECTS — sin syllabus |

`VERIFIED_SUBJECTS = {ing_web, mat_especiales, inv_ciencia}` — únicas materias que NO muestran el warning "⏳ Sin syllabus cargado".

### Funcionalidades activas (8 tabs)
- **Tab 0 — Dashboard:** `actionNow` hero contextual + `semaphoreList` P0-P4 + `task-form` (alta de tareas con select limpio de 5 materias).
- **Tab 1 — Materias:** `subjectDetail` cards (profesor, email, horario, progress bar, tareas, deep-links). Sin warning para verificadas.
- **Tab 2 — Calendario:** Calendario académico 26V02 oficial.
- **Tab 3 — Accesos:** Portal Opener v2 (CDigital, SGA, CUN 360, Gmail).
- **Tab 4 — Malla Curricular:** 10 semestres.
- **Tab 5 — Certificaciones:** 8 certs con links.
- **Tab 6 — CUN Hub:** Recursos del ecosistema CUN.
- **Tab 7 — Clases Perdidas:** ✅ VERIFICADO HOY + EJECUTADO end-to-end con DATOS REALES. Soporta dos modos:
  - **Modo A (Direct Fetch):** El usuario me pega la URL en el chat con la pestaña del video ya abierta y el panel de Transcripción de Drive activado. Yo uso Chrome MCP (`tabs_context_mcp` + `javascript_tool`) para extraer el transcript del DOM (`[role="complementary"][aria-label*="ranscripci"]`), pre-proceso EN LA PÁGINA (filtrado por keywords + últimos segmentos para evitar reventar mi context), genero el informe verbatim, y ejecuto `SYS.injectClassSession()` directamente en la pestaña real del live site (`mikel696.github.io/da-2026/frontend/systems.html`). El proxy de `cloud-sync.js` empuja a Supabase automáticamente.
  - **Modo B (Prompt portable):** Si no tengo Chrome MCP, el botón "📋 Copiar Prompt" genera el SOP completo (con prerrequisito de panel de transcripción visible y reglas anti-hallucinación) para que otra sesión de Claude lo ejecute.
  - **Hoy 2026-04-09:** ejecuté Modo A end-to-end con la grabación de **DIS31 Matemáticas Especiales** (108K caracteres de transcript), inyecté la sesión en producción, verifiqué visualmente que la tarjeta aparece en "Sesiones guardadas" (`#classSessionsList`) y que el counter del card sube a "1 sesión".

### Arquitectura interna (post-hardening)
- **`SUBJECTS`** — 5 materias reales (auditadas contra CDigital). 3 falsas eliminadas (`calidad_sw`, `admin_bd`, `redes`).
- **`SEED_VERSION = 5`** — Sistema de migración versionado:
  - v1→v2: purga materias falsas
  - v2→v3: purga extrapolaciones inventadas
  - v3→v4: incorpora Mat Especiales verificada
  - v4→v5: incorpora Inv C&T parcial
  - Migración preserva tareas creadas por el usuario (dedupe by text)
- **`SEED_TASKS`** — 17 tareas reales: 7 Ing Web + 7 Mat Esp + 3 Inv C&T
- **Class Sessions store** — `CS_KEY = 'class_sessions'` (sin doble prefijo `sys_sys_*`); migración one-time del key viejo.
- **Tamaños actuales:** `systems_logic.js` ~1240 líneas, `systems.html` ~513 líneas

---

## 📜 RESUMEN DE HITOS RECIENTES (Q1-Q2 2026)

### 🔐 Supabase Auth + JSONB Global Sync
- **`frontend/js/supabase-client.js`** — Cliente Supabase v2 (CDN UMD).
- **`frontend/js/auth.js`** — Sign-in/sign-up con email + password.
- **`frontend/js/cloud-sync.js`** — Offline-first JSONB payload sync. Cada módulo declara su key, el proxy intercepta `localStorage.setItem` y dispara `CLOUD.push()`.
- **Hardening:** sync-lock para evitar timestamp poisoning en device fresco; safe date parsing en `_mergeByUpdatedAt` para no crashear sync.
- **Estado:** ✅ Producción verificada, multi-device pull QA pasado.

### 💰 12-FIN · Finance Module
- **`frontend/finance.html`** + capa de datos `FIN`.
- Presupuesto, ahorro, transacciones — arquitectura separada (no monolito).
- **Estado:** ✅ Producción verificada.

### 📓 13-NOT · Notes & SRS Leitner
- **`frontend/notes.html`** — Markdown + Journal + Flashcards SRS Leitner.
- 5 cajas Leitner, intervalos progresivos, modo estudio.
- **Estado:** ✅ Producción.

### 💼 5-JOB · Job Tracker (jt8 Migration)
- Migración de schema antiguo a `jt8` con detección de duplicados y verificación.
- Botón FAB de migración bidireccional VacancyDB ↔ Job Tracker.
- Master-detail viewer + Kanban pipeline con drag-and-drop (commit reciente `6ce874c`).
- **Estado:** ✅ QA pasado, migración hardened.

### 🎓 10-SYS · 26V02 Cleanup + Hallucination Purge
- Auditoría completa contra CDigital → 3 materias falsas eliminadas, 5 reales verificadas.
- Purga total de calendario extrapolado (commit `400b1e5`).
- Inyección manual de Mat Especiales (commit `4af10d4`).
- Inyección parcial de Inv C&T (commit `4334d12`).
- **Hoy (2026-04-09):** Finalización + verificación Tab 7 + overhaul de documentación + **primera ejecución end-to-end del Direct-Fetch Protocol** (Mat Especiales clase grabada en Drive → transcript extraído por Chrome MCP → informe inyectado en producción y verificado visualmente).

### 📹 Direct-Fetch Protocol para Tab 7 — formalizado 2026-04-09
- **Trigger:** El usuario pega la URL de Drive del video en el chat (ya no necesita pasar por la UI del Tab 7).
- **Prerrequisito del usuario:** abrir la pestaña del video en su Chrome (con la extensión Claude/Chrome MCP) y activar el panel de Transcripción del reproductor de Drive (⋮ → Transcripción).
- **Mi flujo:**
  1. `tabs_context_mcp` → identifico la pestaña existente del video (NO `navigate` — Drive responde 401 sin la sesión del usuario).
  2. `javascript_tool` → extraigo `innerText` de `[role="complementary"][aria-label*="ranscripci"]` y filtro etiquetas de UI.
  3. Pre-proceso EN LA PÁGINA: parseo `[timestamp, texto]`, filtro por keywords (`tarea|entrega|parcial|examen|quiz|fecha|plazo|abril|mayo|cdigital|drive|http|recuerden|no olviden|para el|hasta el`) + últimos ~25 segmentos. Solo los hits regresan a mi contexto.
  4. Genero informe **solo con verbatim + timestamps**. Sin verbatim no se inyecta nada (regla anti-hallucinación).
  5. `SYS.injectClassSession({ ... })` directamente en la pestaña real de `mikel696.github.io/da-2026/frontend/systems.html`. El proxy de `cloud-sync.js` hace push a Supabase automáticamente.
  6. `showTab(7)` + screenshot para verificación visual.
- **Prompt actualizado en `systems_logic.js`:** el botón "📋 Copiar Prompt" ahora genera la versión nueva con el prerrequisito del panel de transcripción, el SOP completo de Chrome MCP y las reglas anti-hallucinación. Sirve como fallback portable cuando otra sesión de Claude debe ejecutar el protocolo sin que yo esté presente.
- **Por qué este protocolo:** transcripts de 1 hora son ~100K+ caracteres. Si los traigo crudos a mi context, revientan la ventana. El filtrado y la generación del informe se hacen EN EL BROWSER y solo viajan los hits relevantes a mi memoria.

### 🇺🇸 3-ENG · English Academy v2 — COMPLETO 2026-04-13
- Refactored 653-line monolith `english.html` into 4-layer architecture: thin HTML shell (~135 lines) + `css/english.css` (~200 lines) + `js/eng.js` (~500 lines ENG IIFE) + `data/english-data.json` (all content).
- 10 tabs: Vocabulary, Grammar, Understand, Conversations, Professional, Exercises, Flashcards, Interviews, Notes, Dojo.
- Content overhaul: 20 grammar rules with structured formulas/examples (up from 12), 139 professional vocabulary items across 8 categories, 6 conversation scenarios, 5 professional contexts, 28 exercises (A2-B2), interview prep (behavioral/technical/situational), comprehension strategies, hispanic error patterns.
- Dojo TTS+STT engine (`js/english.js` + `data/english-dojo.json`) integrated — renders into `#dojoContent`.
- Full Supabase auth stack restored (4 script tags). `cloud:sync_complete` listener re-renders after cloud pull.
- State keys: `e4`, `eng_notes`, `eng_srs_deck`, `dojo_stats` — all in SYNC_REGISTRY.

### 🏠 Main Page Updates — 2026-04-13
- Cajita Tech section redesigned: categorized Quick Links buttons (Epic Games, Udemy, PromoCajita, Pi3.AI) replacing outdated deals list.
- `data/recommendations.json` restructured with categories (games/learning/tools) + quickLinks format.
- Pi3.AI interview practice card added.
- Prompt Lab card updated: "14 prompts" → "31 prompts", tags include "System · Recovery".

### 🤖 8-PRO · Prompt Lab v2 — 2026-04-13
- Added 10 operational prompts (seed-022 to seed-031): recovery prompt, 8 module-specific prompts, main page update prompt.
- All in English, optimized for token conservation.
- seedVersion bumped from 1 to 2. Total: 31 prompts.

### 🔧 Otros módulos en producción
- **2-APP** Application Command Center: refactor profundo, profiling AP Lead Monks/S4, prep Pi3.AI.
- **6-TOO** Tools: redesign deals panel — botones compactos.
- **11-ACC** Accounting Associate: ✅ **COMPLETO Y DESPLEGADO — 2026-04-10**. Refactor completo a arquitectura de 4 capas según `PLAN_ACCOUNTING.md`. Shell puro `accounting.html` (65 líneas) + `css/accounting.css` (144 líneas) + `js/accounting.js` (742 líneas IIFE `ACC`) + `data/accounting-data.json` (138 líneas, 8 top-level keys). Un solo localStorage key `sb_accounting` (JSONB opaco) con sub-stores: `progress`, `exerciseLog`, `chatHistory`, `mastered`, `practiced`, `careerDone`. Registrado en `SYNC_REGISTRY` de `cloud-sync.js`. 6 tabs: Ruta (career path + 7 ejercicios técnicos), Glosario (62 términos EN/ES con TTS + mastery toggle), Excel Lab (24 vocab items + link a Ruta DA Dojo), Recursos (4 links externos), Simulador (chat recruiter con keyword scoring + historial persistido), STAR Prep (7 Q&A con practiced toggle). `_esc()` en todo texto de usuario (XSS verified). `cloud:sync_complete` → `renderAll()`. Legacy `acct_module.js` eliminado. Employer-agnostic (antes era solo Brinks). QA en vivo pasado: `pullAllStates OK: 21 keys`, `reconcile cloud→local: sb_accounting`, `pushState OK: sb_accounting`, `fullSyncAll DONE (3706ms)` — cero crashes de sync, cero errores de consola.
- **9-GOA** Goals & Habits: ✅ **COMPLETO Y DESPLEGADO — 2026-04-09**. Refactor a arquitectura de 4 capas ejecutado según `PLAN_HABITS_UI.md`. `frontend/goals.html` queda como shell puro (84 líneas). Toda la lógica vive en `frontend/js/goals.js` (~500 líneas) como IIFE `GOA` con 3 singletons (`GOALS/HABITS/REVIEWS`) sobre `sb_goals/sb_habits/sb_reviews`. Todos los registros usan `crypto.randomUUID()` — deletes por `filter(id !== target)`, sin `splice` ni ordering bugs. Migración idempotente `migrateGoalsAndHabits()` back-fillea UUIDs en registros legacy sin perder contenido. `_esc()` aplicado a todo texto de usuario (XSS verified). Listener `cloud:sync_complete` → `renderAll()`. QA en vivo pasado: `pullAllStates OK: 19 keys`, `reconcile local→cloud: sb_goals`, `reconcile local→cloud: sb_reviews`, `pushState OK: sb_goals`, `pushState OK: sb_habits`, `pushState OK: sb_reviews`, `fullSyncAll DONE` — cero crashes de sync, cero errores de consola.

---

## 🧠 LECCIONES APRENDIDAS (no repetir)

1. **NO extrapolar calendarios entre materias.** Una vez basta para hallucinaciones masivas (ver corrección `400b1e5`).
2. **Toda materia inyectada requiere `VERIFIED_SUBJECTS` Set** para que la UI sepa si mostrar warning o calendario.
3. **`SEED_VERSION` SIEMPRE bumpea** cuando se cambia `SEED_TASKS`, con dedupe by text para preservar tareas del usuario.
4. **Worktrees del harness:** las edits van al main repo via absolute paths, no al worktree. `pwd` ≠ donde se commitea.
5. **Class Sessions key:** usar `'class_sessions'` (db.get/set añade `sys_` automáticamente). El bug `sys_sys_class_sessions` ya tiene migración one-time.
6. **Direct-Fetch de transcripts de Drive:** SIEMPRE reusar la pestaña que el usuario ya abrió (`tabs_context_mcp`). NUNCA `navigate` a Drive ni `curl/fetch` — Drive responde 401 sin la sesión del usuario.
7. **Pre-procesar transcripts en el browser, no en mi contexto.** 100K+ caracteres revientan la ventana. Filtrado por keywords + slice de últimos N segmentos van por `javascript_tool` y solo los hits regresan.
8. **Inyectar siempre en la pestaña real de `mikel696.github.io`**, no en localhost ni preview. Solo ahí está la sesión de Supabase del usuario y el proxy hace push automático.
9. **Borrar entradas de stores `prepend`-orientados por `id`, no por índice.** `SYS.injectClassSession` (y otros stores que insertan al frente) hacen `arr.unshift(...)`. Si después haces `arr[arr.length-1]` para "quedarte con la entrada nueva" vas a tomar la MÁS VIEJA y borrarla. Patrón seguro: capturar el `id` que retorna/genera `inject*` y pasárselo a `delete*`. Aplica a `sys_class_sessions`, `sys_tasks`, `not_cards`, `fin_transactions` y cualquier store con `unshift` semantics. Lección registrada el 2026-04-09 después de borrar accidentalmente la sesión Mat Especiales del preview por usar índice.

---

## 🔒 HANDOVER A USO PRODUCTIVO — 10-SYS CERRADO

El operador (Miguel) puede ahora:
- Usar el módulo 10-SYS como su Mission Control académico diario.
- Marcar tareas como completadas, agregar nuevas via task-form.
- Cuando pierda una clase: pegar URL en Tab 7 → copiar prompt → ejecutar Claude (Modo B), o pegármela directamente en el chat con Chrome MCP disponible (Modo A).
- Sync automático con Supabase para multi-device.

**El sistema es production-ready. 10-SYS queda CERRADO. A estudiar.**

---

## 🤖 8-PRO · Prompt Lab v2 — COMPLETO Y DESPLEGADO — 2026-04-10

### Estado final del módulo
**MÓDULO COMPLETADO.** Refactor del monolito `prompts.html` (418 líneas inline) a arquitectura de 4 capas. QA pasado en preview: 21 prompts renderizan, optimizador genera output con syntax highlighting, category filters funcionan, `sb_prompts` registrado en `SYNC_REGISTRY`, cero errores de consola.

### Arquitectura
- Shell puro `prompts.html` (~130 líneas) + `css/prompts.css` (230 líneas) + `js/prompts.js` (~530 líneas IIFE `PRO`) + `data/prompts-data.json` (21 seed prompts, 8 categorías, optimizer config).
- Un solo localStorage key `sb_prompts` (JSONB opaco) con sub-stores: `library`, `history`, `settings`.
- Migración idempotente de `plab_h` (historial) y `custom_prompts` (colección legacy). `plab_h` removido de `SYNC_REGISTRY`.
- Taxonomía de 8 categorías (`data`, `code`, `finance`, `career`, `learning`, `writing`, `system`, `custom`) + tags libres + template variables (`{{VAR}}`).
- 5 tabs: Librería (search + filter + sort + fav + variables), Optimizar (engine refactored), Crear (CRUD custom), Guía (10 rules), Historial.
- Seed version bumping (`seedVersion: 1`). Custom prompts usan `crypto.randomUUID()`, deletes por `filter(id !== target)`.
- `_esc()` en todo texto de usuario (XSS verified). `cloud:sync_complete` → `PRO.renderAll()`.
- Weavers de job pipeline (`prompt-weaver.js`, `cover-weaver.js`, etc.) no se tocaron — pertenecen a 2-APP/5-JOB.

---

## 🎯 PRÓXIMA FASE — Seguir construyendo módulos del dashboard
Con 10-SYS, 9-GOA, y 11-ACC cerrados, y 8-PRO en planificación, el backlog restante es:
- **8-PRO · Prompt Lab v2:** ⏳ Plan listo, pendiente aprobación → ejecución.
- **2-APP · Application Command Center:** polish + posibles features nuevas.
- **6-TOO · Tools refresh:** seguir el redesign del panel de deals.
