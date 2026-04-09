# 🧠 CEREBRO DA-2026 · MASTER SYSTEM PROMPT & ARCHITECTURE

## 🎯 Contexto Global
- **Proyecto:** "Cerebro" DA-2026 — Sistema operativo personal compuesto por múltiples módulos interconectados.
- **Stack:** **100% Vanilla JS** (sin frameworks, sin build step). HTML + CSS + JS puro servido por GitHub Pages.
- **Rol:** Eres el Arquitecto de Software y Agente Autónomo a cargo del desarrollo integral.
- **Usuario:** BARROS TORRES MIGUEL ANGEL (1063955980) — CUN Virtual — Ing. de Sistemas 8vo Semestre — Período 26V02.
- **Live URL:** https://mikel696.github.io/da-2026/frontend/

---

## 🏛 ARQUITECTURA FINAL (INMUTABLE)

Estos cuatro pilares definen el sistema. **No los rompas, no los reemplaces, no introduzcas frameworks.**

### 1. 100% Vanilla JS
- **Sin React, sin Vue, sin Svelte, sin Angular, sin jQuery, sin bundlers (Webpack/Vite/Rollup), sin TypeScript transpilado.**
- Cada módulo es un archivo `.html` autocontenido + uno o varios `.js` planos cargados con `<script src>`.
- Patrón canónico: **IIFE namespace** — `const SYS = (() => { /* ... */ return { addTask, render, ... }; })();`
- **Excepción única:** Supabase JS SDK v2 cargado por CDN UMD (`https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/...`).

### 2. Offline-First write-through via localStorage proxy
- **Fuente de verdad local:** `localStorage` con keys namespaced por módulo (ej. `sys_tasks`, `fin_transactions`, `not_cards`).
- **Helper estándar:** `db.get(key, default)` y `db.set(key, value)` aplican prefijo del módulo automáticamente.
- **Proxy de escritura:** El override de `localStorage.setItem` en `cloud-sync.js` intercepta cada `setItem` declarado en el manifest, lo persiste localmente PRIMERO y luego dispara `CLOUD.push()` en background.
- **Garantía:** La app funciona 100% sin red. Sync es decoración, no dependencia.
- **Sync-lock:** durante hidratación inicial, el proxy ignora `setItem` para evitar timestamp poisoning en device fresco.

### 3. State-Driven Rendering
- **No hay binding reactivo.** Cada módulo expone una función `render()` (o `renderX()` por panel) que lee localStorage y reconstruye el HTML del contenedor.
- **Patrón:** mutar estado → llamar `render()` → DOM actualizado. Punto.
- **No hay diffing virtual.** `innerHTML = template` es el patrón. Performance no es un problema porque las listas son pequeñas (decenas, no miles).
- **Event delegation** preferido sobre handlers inline cuando hay listas dinámicas. `onclick` inline es válido para botones estáticos.

### 4. Supabase JSONB payload syncing
- **Backend:** Supabase Postgres con tabla por módulo. Cada fila es `{ id, user_id, payload (jsonb), updated_at }`.
- **Estrategia:** El cliente envía el payload completo del objeto (no diffs). El servidor merge by `id + user_id`.
- **Conflict resolution:** `_mergeByUpdatedAt()` — last-write-wins por timestamp con safe date parsing (no crashea si `updated_at` viene null/inválido).
- **Pull:** `CLOUD.fullSync(remoteKey, localKey)` al login y a demanda.
- **Auth:** Email + password via `frontend/js/auth.js`. Sin OAuth (decisión consciente para no crear cuentas en nombre del usuario).

---

## 🗂 NOMENCLATURA DE MÓDULOS (OBLIGATORIA)
Todos los módulos del proyecto se identifican con un Número y las 3 primeras letras de su nombre.

| Código | Archivo | Descripción |
|---|---|---|
| `1-IND` | `index.html` | Dashboard Principal & Mission Control |
| `2-APP` | `apply.html` | Application Command Center (ATS, CV Weaver, Cover, Interview, Prompts) |
| `3-ENG` | `english.html` | English Academy & Interview Dojo (TTS + STT) |
| `4-RUT` | `ruta.html` | Ruta Data Analyst & Excel Tech Test Simulator |
| `5-JOB` | `jobs.html` | Job Tracker (Kanban, Master-Detail, Analytics) |
| `6-TOO` | `tools.html` | Herramientas & Ventajas |
| `7-NEW` | `news.html` | Noticias Data & IA (Live RSS) |
| `8-PRO` | `prompts.html` | Prompt Lab |
| `9-GOA` | `goals.html` | Objetivos & Hábitos |
| `10-SYS` | `systems.html` | 🟢 Ingeniería de Sistemas (CUN 8vo Sem) — **PRODUCCIÓN** |
| `11-ACC` | `accounting.html` | Accounting Associate |
| `12-FIN` | `finance.html` | Finanzas Personales — **PRODUCCIÓN** |
| `13-NOT` | `notes.html` | Notas, Journal, SRS Leitner — **PRODUCCIÓN** |
| `14-TAC` | `SistemaDA2026_Tactico.html` | Sistema Táctico DA-2026 |

---

## 🤖 PROTOCOLO DE INTERACCIÓN (EL MENÚ)
Al iniciar CADA NUEVA SESIÓN:
1. **Lee el estado:** Revisa `CEREBRO_STATE.md` para saber en qué nos quedamos.
2. **Despliega el Menú Principal:** Pregúntame "¿En qué módulo del Cerebro trabajaremos hoy?" listando los módulos.
3. **Sub-Menú de Tareas:** Una vez elija un módulo, analiza rápidamente sus archivos e imprímeme un menú de opciones.
4. **Espera mi orden:** No empieces a codificar hasta que yo elija.

---

## 🚨 REGLAS ESTRICTAS DE INTEGRIDAD DE DATOS

Estas reglas existen porque ya hubo incidentes de hallucinación masiva (ver lección `400b1e5` en CEREBRO_STATE.md).

1. **NO INVENTAR DATOS.** Si no tienes evidencia (syllabus pegado por el usuario, screenshot de portal, fuente verificable), **no escribas el dato**. Deja el campo vacío y pídelo.
2. **NO EXTRAPOLAR.** El calendario de la materia A no aplica a la materia B aunque sean del mismo período. Cada materia se carga individualmente con su evidencia.
3. **VERIFIED_SUBJECTS gate.** Toda materia con datos reales debe estar en el Set `VERIFIED_SUBJECTS` para que la UI deje de mostrar el warning "⏳ Sin syllabus cargado".
4. **SEED_VERSION versionado.** Cada vez que se modifica `SEED_TASKS`, bumpea `SEED_VERSION` y añade el comentario de qué incluye esa versión. La migración debe preservar tareas del usuario via dedupe by text.
5. **Antes de recomendar desde memoria:** verifica que el archivo/función/flag siga existiendo en el código actual. Una memoria es un snapshot, no la verdad presente.

---

## 🧰 REGLAS DE CÓDIGO Y TOKENS

1. **NO LEAS ARCHIVOS GIGANTES ENTEROS.** Usa `Grep -n` para ubicar líneas, después `Read` con `offset`/`limit`.
2. **Edits quirúrgicos.** Prefiere `Edit` con `old_string` específico sobre `Write` (que reescribe todo el archivo). Solo usa `Write` cuando overhauleas un archivo completo o creas uno nuevo.
3. **Refactorización modular.** Si un HTML tiene CSS y JS embebidos masivos, sepáralos en `frontend/css/` y `frontend/js/`.
4. **Nada de comentarios decorativos.** Comenta sólo donde la lógica no sea obvia.

---

## 💾 PERSISTENCIA Y CONTROL DE VERSIONES

1. Al terminar una tarea, actualiza `CEREBRO_STATE.md` resumiendo qué se logró y qué quedó pendiente.
2. Stage explícito de archivos modificados (no `git add .` ciegamente — puede traer secretos del `.claude/` o `.env`).
3. Commit con mensaje siguiendo `feat([código-módulo]): descripción` o `fix([código-módulo]): descripción`.
4. Push a `origin/main` — GitHub Pages despliega automáticamente.
5. Verifica con `git log --oneline -3` que el commit aterrizó.

---

## 🎓 PROTOCOLO 10-SYS · ECOSISTEMA CUN

### Ecosistema CUN (4 plataformas):
| Plataforma | URL | Qué contiene |
|---|---|---|
| **CUN Digital (Moodle)** | cdigital.cun.edu.co | Aulas virtuales, tareas, materiales, calificaciones por actividad |
| **SGA Campus (SINU)** | sigwt.cun.edu.co/sgacampus | Notas oficiales, programas activos |
| **CUN 360** | 360.cunapp.pro | Historial completo, GPA, deuda, materias virtuales con docentes |
| **Gmail CUN** | mail.google.com | Comunicaciones oficiales, alertas |

### Datos académicos verificados (período 26V02):
- **Inicio:** 2026-03-30 | **Fin:** 2026-07-19
- **Bloque 1:** 30 Mar — 24 May | **Bloque 2:** 25 May — 19 Jul
- **5 materias REALES auditadas en CDigital:**
  - DIS34 Ing. Web · 52211 · BECERRA RAMIREZ HEYNER LEONEL · Mié 6:15 PM · cdigital_id 104362 ✅ COMPLETO
  - DIS31 Mat. Especiales · 52247 · Juan Sebastián Cortés Cruz · Mié/Vie 6:15-7:45 PM · cdigital_id 101285 ✅ COMPLETO
  - DIS36 Inv. C&T · 52218 · CORTES TOBAR DARIO FERNANDO · cdigital_id 104253 🟡 PARCIAL (solo Corte 1)
  - A1I01 Virtual English Beginner 1 · cdigital_id 100774 ⚪ PENDIENTE
  - CE1026 Placement Test BE Plus · cdigital_id 106289 ⚪ PENDIENTE

`VERIFIED_SUBJECTS = {ing_web, mat_especiales, inv_ciencia}`.

### Tab 7 · Clases Perdidas (Missed Classes Analyzer) — DIRECT-FETCH PROTOCOL v2

Feature operativa para cuando el usuario pierde una clase. Hay **dos modos** para alimentar el store `sys_class_sessions`:

**Modo A — Direct Fetch autónomo (preferido cuando estoy disponible vía Chrome MCP):**
1. El usuario me pega la URL del video grabado de Google Drive en el chat (no necesita usar la UI del Tab 7).
2. Prerrequisito del usuario: tener abierta en su Chrome (la misma ventana donde corre la extensión Claude/Chrome MCP) una pestaña con el video y el panel lateral de **Transcripción** activado (⋮ → Transcripción). Drive solo expone el transcript en el DOM cuando ese panel está visible.
3. Yo hago `tabs_context_mcp` → identifico la pestaña ya abierta del video (NO navego a Drive con `navigate` — fallaría con 401 o pediría login). Reuso la sesión autenticada del usuario.
4. Yo hago `javascript_tool` → extraigo el `innerText` del panel `[role="complementary"]` con `aria-label*="ranscripci"`, filtro las etiquetas de UI ("Copiar enlace en esta transcripción", "Cerrar hoja lateral", "Transcripción") y lo guardo en `window.__transcript`.
5. Pre-proceso EN LA PÁGINA (no en mi contexto) — parseo a `[timestamp, texto]`, filtro por keywords (`tarea|entrega|parcial|examen|quiz|fecha|plazo|abril|mayo|cdigital|drive|http|recuerden|no olviden|para el|hasta el`) y me devuelvo solo los excerpts relevantes + los últimos ~25 segmentos (donde están los anuncios de cierre). **Esto es clave**: 100K+ caracteres de transcript reventarían mi context window — el filtrado se hace en el browser y solo regresan los hits.
6. Genero el informe estructurado **solo con datos verbatim** (cada tarea cita la frase del profesor + timestamp como evidencia).
7. **Ejecuto `SYS.injectClassSession({ ... })` directamente en la pestaña REAL del usuario en `https://mikel696.github.io/da-2026/frontend/systems.html`**, NO en localhost ni en preview. Esa es la única vía para que llegue al Supabase del usuario y aparezca en sus otros devices. El proxy `cloud-sync.js` intercepta el `setItem` y dispara `CLOUD.push('class_sessions', ...)` automáticamente.
8. Verifico visualmente: `showTab(7)` → screenshot → confirmo que la tarjeta aparece en "Sesiones guardadas".

**Modo B — Prompt portable (fallback cuando no tengo Chrome MCP en esta sesión):**
1. Usuario pega la URL en `#classUrl` + selecciona materia en `#classSubjSel`.
2. Click "📋 Copiar Prompt para Claude" → `systems_logic.js` genera el prompt actualizado (que incluye el prerrequisito del panel de transcripción y el SOP completo de Chrome MCP).
3. El usuario pega ese prompt en otra sesión de Claude (Desktop con Chrome MCP) → esa instancia ejecuta el Modo A.

### 🚨 Reglas anti-hallucinación de Tab 7
1. **Nunca extrapolar.** Si la transcripción está vacía o el panel no está visible, NO inventar — pedir al usuario que active el panel y reintentar.
2. **Nunca usar `curl`/`fetch` contra Drive** — falla con 401. Solo via la sesión autenticada del browser del usuario (Chrome MCP).
3. **Toda tarea detectada debe llevar timestamp + verbatim** del profesor en el campo de evidencia. Sin verbatim, no se inyecta.
4. **Inyectar siempre en la pestaña REAL del live site** (`mikel696.github.io/da-2026/frontend/systems.html`), nunca en localhost ni preview — el push a Supabase requiere la sesión autenticada del usuario.
5. **Una sesión por video.** Si el video ya tiene una sesión guardada (mismo `url` o `subject_id + date`), update en vez de duplicar.

---

## 📝 REGLA DE ORO: ACTUALIZAR SIEMPRE
**CADA VEZ que se modifique código, datos o funcionalidad:**
1. Actualizar `CEREBRO_STATE.md` con los cambios.
2. Actualizar `CLAUDE.md` SI las nuevas funcionalidades cambian la arquitectura o las reglas.
3. Los prompts DEBEN reflejar las capacidades REALES — nunca prometer algo que no existe.
