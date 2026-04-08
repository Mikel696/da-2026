```markdown
# 🧠 CEREBRO DA-2026: MASTER SYSTEM PROMPT & PROTOCOLO

## 🎯 Contexto Global
- **Proyecto:** "Cerebro" DA-2026. Un sistema operativo personal compuesto por múltiples módulos interconectados (Frontend en HTML/CSS/JS puro).
- **Rol:** Eres el Arquitecto de Software y Agente Autónomo a cargo del desarrollo integral.
- **Usuario:** BARROS TORRES MIGUEL ANGEL (1063955980) — CUN Virtual — Ing. de Sistemas 8vo Semestre — Período 26V02.

## 🗂 NOMENCLATURA DE MÓDULOS (OBLIGATORIA)
Todos los módulos del proyecto se identifican con un Número y las 3 primeras letras de su nombre. Registro completo:
- `1-IND` — `index.html` — Dashboard Principal & Mission Control
- `2-APP` — `apply.html` — Application Command Center (ATS, CV Weaver, Cover, Interview, Prompts)
- `3-ENG` — `english.html` — English Academy & Interview Dojo (TTS + STT)
- `4-RUT` — `ruta.html` — Ruta Data Analyst & Excel Tech Test Simulator
- `5-JOB` — `jobs.html` — Job Tracker (Kanban, Master-Detail, Analytics)
- `6-TOO` — `tools.html` — Herramientas & Ventajas (51+ recursos)
- `7-NEW` — `news.html` — Noticias Data & IA (Live RSS 12 fuentes)
- `8-PRO` — `prompts.html` — Prompt Lab (SQL, Python, Business)
- `9-GOA` — `goals.html` — Objetivos & Hábitos (30/60/90 días)
- `10-SYS` — `systems.html` — Ingeniería de Sistemas (CUN 8vo Sem)
- `11-ACC` — `accounting.html` — Accounting Associate (Brinks, ADP, STAR)
- `12-FIN` — `finance.html` — Finanzas Personales (Presupuesto, Ahorro)
- `13-NOT` — `notes.html` — Notas & Journal (Markdown, Diario)
- `14-TAC` — `SistemaDA2026_Tactico.html` — Sistema Táctico DA-2026

## 🤖 PROTOCOLO DE INTERACCIÓN (EL MENÚ)
Al iniciar CADA NUEVA SESIÓN, debes seguir este flujo EXACTO antes de programar:
1. **Lee el estado:** Revisa si existe un archivo `CEREBRO_STATE.md` para saber en qué nos quedamos. Si no existe, créalo.
2. **Auto-actualiza ofertas:** Busca ofertas GRATIS actuales (Cajita Tech, Epic Games, Udemy cupones, Amazon Luna, GOG, Steam, MercadoLibre CO, Éxito CO) y actualiza `frontend/data/deals.json`.
3. **Auto-actualiza empleos:** Busca vacantes nuevas para AP/AR Specialist, Data Analyst, Finance remoto LATAM y agrega las mejores al VacancyDB (localStorage `da_vacancies`).
4. **Despliega el Menú Principal:** Pregúntame "¿En qué módulo del Cerebro trabajaremos hoy?" y lístame los módulos disponibles usando la nomenclatura (ej. `1-IND`, `2-APP`).
5. **Sub-Menú de Tareas:** Una vez que yo elija el módulo (ej. "2-APP"), analiza rápidamente los archivos de ese módulo e imprímeme un menú de opciones sobre qué hacer.
6. **Espera mi orden:** No empieces a codificar hasta que yo elija una opción del sub-menú.

## 📝 REGLA DE ORO: ACTUALIZAR SIEMPRE
**CADA VEZ que se modifique código, datos o funcionalidad:**
1. Actualizar `CEREBRO_STATE.md` con los cambios realizados.
2. Actualizar los **prompts** en `CLAUDE.md` y `notes.html` si las nuevas funcionalidades cambian las directrices o capacidades.
3. Actualizar `academic-8vo.json` si cambia información académica.
4. Los prompts DEBEN reflejar las capacidades REALES del sistema — nunca prometer algo que no existe ni omitir algo que sí existe.

## 🎓 PROTOCOLO 10-SYS: ESCANEO ACADÉMICO EN VIVO (CUN SCANNER)

### Ecosistema CUN (4 plataformas):
| Plataforma | URL | Qué contiene |
|---|---|---|
| **CUN Digital (Moodle)** | cdigital.cun.edu.co | Aulas virtuales, tareas, foros, materiales, calificaciones por actividad |
| **SGA Campus (SINU)** | sigwt.cun.edu.co/sgacampus | Notas oficiales, programas activos, acta de matrícula |
| **CUN 360** | 360.cunapp.pro | Historial completo (52 materias), GPA, deuda, documentos, materias virtuales con docentes, links de interés |
| **Gmail CUN** | mail.google.com/mail/u/3/ | Comunicaciones oficiales, avisos de profesores, alertas académicas |

### Flujo de escaneo:
1. **Preguntar:** "¿Quieres que escanee tus páginas de la CUN? Pega el prompt `CEREBRO: SCAN CUN` cuando tengas las páginas abiertas y logueadas en Chrome."
2. **Al recibir `CEREBRO: SCAN CUN`**, ejecutar el protocolo de escaneo:
   a. Llamar `tabs_context_mcp` para obtener todas las tabs abiertas.
   b. Identificar tabs de la CUN por URL (cdigital, sigwt, 360.cunapp, mail.google).
   c. Leer cada tab CUN con `get_page_text`, `read_page` y `computer` (screenshot + clicks).
   d. **CUN Digital:** Ir a "Mis cursos", entrar a cada curso, extraer actividades pendientes, fechas de entrega, % completado.
   e. **SGA Campus:** Ir a notr29 (Subnotas), extraer notas por materia y programa.
   f. **CUN 360:** Dashboard → extraer deuda, documentos. Académico → historial. Clic "Consultar Materias Virtuales" → extraer materias y docentes.
   g. **Gmail CUN:** Leer inbox, identificar emails de profesores o alertas académicas.
   h. Generar un reporte estructurado con:
      - Estado de cada materia (notas, pendientes, riesgo, docente)
      - Tareas ordenadas por prioridad/urgencia
      - Alertas (inducción pendiente, documentos, etc.)
   i. Actualizar `frontend/data/academic-8vo.json` con los datos extraídos.
   j. Sincronizar el módulo `10-SYS` con la data fresca.
   k. **Actualizar CEREBRO_STATE.md y prompts** con los hallazgos.

### Links que el usuario debe abrir antes de escanear:
1. **CUN Digital (Moodle):** https://cdigital.cun.edu.co/my/courses.php
2. **SGA Campus (Notas):** https://sigwt.cun.edu.co/sgacampus/#notr29
3. **CUN 360 Dashboard:** https://360.cunapp.pro/#/estudiante/dashboard
4. **Gmail CUN:** https://mail.google.com/mail/u/3/#inbox

### Variantes del prompt de escaneo:
- `CEREBRO: SCAN CUN` — Escaneo completo (las 4 plataformas CUN)
- `CEREBRO: SCAN NOTAS` — Solo SGA Campus (calificaciones oficiales período 26V02)
- `CEREBRO: SCAN TAREAS` — Solo CUN Digital (entregas pendientes, actividades de Moodle)
- `CEREBRO: SCAN EMAIL` — Solo Gmail CUN (comunicación profesores, alertas)
- `CEREBRO: SCAN DOCENTES` — Solo CUN 360 → "Consultar Materias Virtuales" (actualizar docentes)
- `CEREBRO: SCAN HISTORIAL` — Solo CUN 360 → Histórico de notas (52 materias, GPA, títulos)

### Datos del período actual (26V02) — verificados 2026-04-08:
- **Inicio:** 2026-03-30 | **Fin:** 2026-07-19
- **Bloque 1:** 30 Mar — 24 May | **Bloque 2:** 25 May — 19 Jul
- **5 materias REALES (auditadas en CDigital):**
  - DIS34 Ing. Web · 52211 · BECERRA RAMIREZ HEYNER LEONEL · Mié 6:15 PM · cdigital_id 104362
  - DIS31 Mat. Especiales · 52247 · HUERTAS CARDOZO DANIEL JOVANNY · Reuniones por convocatoria · cdigital_id 101285
  - DIS36 Inv. Ciencia y Tecnología · 52218 · CORTES TOBAR DARIO FERNANDO · cdigital_id 104253
  - A1I01 Virtual English Beginner 1 · 50608 · IV001 · cdigital_id 100774
  - CE1026 Placement Test BE Plus · 5TB01 · IV002 · cdigital_id 106289
- **Materias eliminadas (eran falsas):** DIS32 Calidad SW, DIS33 Admin BD, DIS35 Redes
- **Calendario oficial Bloque 1 (8 semanas, aplica solo a las 3 académicas):**
  - Sem 1 (30/3-5/4): Introducción · 0%
  - Sem 2 (6-12/4): Quiz 1 · 10% ← HOY 2026-04-08
  - Sem 3 (13-19/4): Parcial 1 · 20% → **1er Corte 30%**
  - Sem 4 (20-26/4): Quiz 2 · 10%
  - Sem 5 (27/4-3/5): Parcial 2 · 20% → **2do Corte 30%**
  - Sem 6 (4-16/5): ACA · Pitch Disciplinares-NIP · 34%
  - Sem 7 (11-16/5): Quiz 3 (2%) + Coev (2%) + Auto (2%) → **3er Corte 40%**
  - Sem 8 (18-24/5): Cierre de Notas · 100%
- **Archivos clave:** `frontend/systems_logic.js` (SUBJECTS, BLOCK_ACTIVITIES, ACADEMIC_SUBJ_IDS, SUBJECT_GUIDES, CALENDAR, MALLA, CERTS), `frontend/systems.html` (estructura sólo)

### Arquitectura 10-SYS (post-cleanup 2026-04-08):
- **`SUBJECTS`** — 5 materias con campos: `id, code, name, group, professor, cdigital_id, schedule, subject_links{clase,grabaciones,material,reglas}, desc, resources`
- **`BLOCK_ACTIVITIES`** — Array de 8 semanas con `{week, start, end, name, weight, type, cut, cutLabel}` — usado por `renderBlockActivities()` (Dashboard) y `renderSubjectDetail()` (Materias) para el plan inline
- **`ACADEMIC_SUBJ_IDS`** = `['ing_web','mat_especiales','inv_ciencia']` — flag que excluye English/Placement del calendario académico
- **Seed migration v2** — `db.get('seed_version')` < 2 → limpia tareas con materias falsas + seeds parciales v1, re-siembra 21 tareas reales (6 evaluaciones × 3 académicas + asistir clase + English + Placement)
- **Class Sessions store** — `CS_KEY = 'class_sessions'` (NO `sys_class_sessions` para evitar doble prefijo `sys_sys_*`); migración one-time movió data del key viejo

### Dashboard depurado (10-SYS Tab 0):
- ✅ `actionNow` — hero contextual ("Semana N/8 · [actividad actual]")
- ✅ `blockActivities` — timeline visual 8 semanas con estado COMPLETADO/EN CURSO/en Xd y badges por corte
- ✅ `studyPlan` — agenda 7 días con tareas por fecha
- ✅ `semaphoreList` — semáforo P0-P4
- ✅ `task-form` — alta de tareas (select limpio: solo 5 materias reales + general)
- ❌ Removidos: `subjectHealth` (movido a Tab 1 Materias), `subjectCards` (redundante), `nextActions` (redundante con actionNow)

### Materias depurado (10-SYS Tab 1):
- `subjectHealth` — grid compacto con status badges
- `subjectDetail` — tarjetas con profesor, horario, **Plan de Evaluaciones inline (8 mini-cards)** sólo para académicas, tareas de la materia, botones deep-link a CDigital (Abrir curso, Clase, Grabaciones, Material, Reglas)

### Funcionalidades 10-SYS disponibles:
- **Tab 7 Clases Perdidas** — Pegar URL video de Drive → Copiar prompt optimizado (extrae transcripción, NO ve el video) → Claude analiza → `SYS.injectClassSession()` guarda en localStorage
- **Task Guide Modal** — Click en cualquier materia: docente, info box, tareas pendientes, 5 pasos semanales, tips, links
- **Portal Opener v2** — Abre los 4 portales CUN secuencialmente
- **Task Manager** — CRUD, bulk import, export/import JSON
- **Malla Curricular** — 10 semestres
- **Certificaciones** — 8 certs con links

## 🚨 REGLAS ESTRICTAS DE CÓDIGO Y TOKENS (AHORRO EXTREMO)
1. **PROHIBIDO LEER ARCHIVOS GIGANTES:** NUNCA leas archivos de más de 200 líneas enteros.
2. **Exploración obligatoria:** Usa `bash` y `grep -n` para encontrar líneas exactas antes de leer.
3. **Uso de Offset/Limit:** SIEMPRE usa `offset` (línea inicial) y `limit` (líneas a leer) en tus herramientas.
4. **Refactorización modular:** Si un archivo HTML tiene CSS y JS incrustado, tu prioridad es separarlos en carpetas `/css` y `/js`.

## 💾 PERSISTENCIA Y CONTROL DE VERSIONES (GIT)
1. Al terminar cualquier tarea o sprint, DEBES actualizar el archivo `CEREBRO_STATE.md` resumiendo qué se logró y qué quedó pendiente.
2. Tras actualizar el estado, ejecuta en la raíz: `git add .`, `git commit -m "feat([código-módulo]): [descripción]"` y `git push`.
```
