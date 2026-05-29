# 🤖 PROMPT MAESTRO · 14-WORK · Ecosistema Simetrik

> Copiá este prompt COMPLETO al inicio de cada sesión donde quieras trabajar en 14-WORK.
> Al final, agregá las instrucciones específicas para esa sesión.
> Claude leerá el contexto, ejecutará, **comiteará** y **actualizará la documentación del cerebro** automáticamente.

---

## CONTEXTO DEL PROYECTO

Estás trabajando en **DA-2026 · Segundo Cerebro**, sistema operativo personal de **BARROS TORRES MIGUEL ANGEL** (Reconciliations Analyst en Simetrik · CUN Ing. Sistemas 8vo).

- **Stack:** 100% Vanilla JS, sin frameworks ni build step. HTML+CSS+JS planos servidos por GitHub Pages.
- **Live URL:** https://mikel696.github.io/da-2026/frontend/
- **Repo local:** `E:\Aplicaciones\ANALISIS DE DATOS\Pagina Web\HTML\da-2026`
- **Live URL del módulo:** https://mikel696.github.io/da-2026/frontend/work.html

**Reglas globales:** leé `CLAUDE.md` completo antes de actuar. Resumen crítico:
1. Vanilla JS puro · IIFE namespace por módulo · sin frameworks.
2. Offline-first localStorage proxy → sync automático a Supabase JSONB vía `cloud-sync.js`.
3. State-driven rendering (mutar state → `render()` → `innerHTML`).
4. **NO INVENTAR DATOS.** Si no hay evidencia (archivo pegado / screenshot / fuente verificable), no escribís el dato.
5. Auth chain obligatoria en cada HTML: supabase-client.js + auth.js + cloud-sync.js.

---

## ARQUITECTURA DEL MÓDULO 14-WORK

### Archivos involucrados

| Archivo | Rol |
|---|---|
| `frontend/work.html` | Shell del módulo. Define las 11 pestañas + navbar. |
| `frontend/css/work.css` | Estilos específicos (tema dark, glass-cards, eco-editor, dict-card). |
| `frontend/js/work.js` | Lógica principal. Namespace `WORK` (cases/errors/learnings/KB/copilot) + sub-namespace `WORK.eco` (workflow editor + course editor + dictionary CRUD + seed) + sub-namespace `WorkNB` (cuadernos compartidos con 13-NOT). |
| `frontend/js/nb-shared.js` | Engine de cuadernos compartido. NO modificar sin coordinar con 13-NOT y 10-SYS. |
| `frontend/pages/simetrik-playbook.html` | Documento canónico Ficohsa autogenerado del zip del usuario. Cargado en iframe. |
| `frontend/pages/simetrik-learn.html` | Guía didáctica "Empieza Aquí" con tour interactivo + curso 10 lecciones + diccionario rápido + recursos. Cargado en iframe. |

### Pestañas actuales (14) — en orden visual

1. **🧭 Empieza Aquí** (default) → iframe `pages/simetrik-learn.html`. Tour interactivo + curso 10 lecciones + recursos.
2. **📘 Playbook Ficohsa** → iframe `pages/simetrik-playbook.html`. Documento canónico del proyecto.
3. **📖 Diccionario** → CRUD con búsqueda, filtro por categoría, edición inline. Storage `work_eco_dict`.
4. **📝 Notas Workflow** → editor rich-text personal sobre el workflow. Storage `work_eco_workflow`.
5. **🎓 Notas Curso** → editor rich-text personal del mini-curso. Storage `work_eco_course`.
6. **📓 Cuadernos** → sub-módulo `WorkNB` con páginas, imágenes IDB, adjuntos. Storage `work_nb_meta` + `work_nb_data`.
7. **📋 Casos** → CRUD de casos reales del día. Storage `work_cases`.
8. **🐛 Errores** → CRUD de errores recurrentes. Storage `work_errors`.
9. **💡 Aprendizajes** → CRUD de tips/atajos. Storage `work_learnings`.
10. **📚 KB** → markdown libre con info estática de Simetrik. Storage `work_kb`.
11. **🤖 Copilot** → generador de prompts contextualizados para Claude (3 modos: Quick Ask · 🧪 Nueva Prueba Simetrik · Master Review).
12. **🗓️ MOIF** → Monitoreo y Observabilidad de Integraciones Ficohsa (reuniones). Storage `work_moif_meetings`.
13. **🖥️ Simulador App** → iframe `pages/simetrik-app.html`. Sandbox didáctico de la app Simetrik.
14. **🧪 Prueba DOTA** → iframe `pages/simetrik-dota-test.html`. Roadmap del caso DOTA × FD con fórmulas exactas Simetrik + checklist con sync (clave `work_dota_progress`).

### Storage keys (todas sincronizadas en `cloud-sync.js` SYNC_REGISTRY)

```
work_cases, work_errors, work_learnings, work_kb, work_nb_meta, work_nb_data,
work_eco_workflow, work_eco_course, work_eco_dict, work_kb_atts,
work_moif_meetings, work_dota_progress
work_eco_dict_seed_v  (control de versiones del seed — NO sincronizar, es local)
work_learn_progress   (progreso de lecciones en simetrik-learn.html — solo local)
work_nb_active        (cuaderno activo seleccionado — solo local)
```

### Diccionario · sistema de seed

- Definido en `js/work.js` dentro del namespace `eco`. Constante `SEED_DICT` (array de objetos).
- Cada entrada: `{sid, term, cat, en, def, ex}`. **`sid` es la llave idempotente.**
- `SEED_VERSION` (string fechado) controla cuándo re-inyectar. Si bumpeo el seed con nuevas entradas:
  1. Añadir objetos al array `SEED_DICT` con un `sid` único.
  2. Bumpear `SEED_VERSION` (formato `simetrik-YYYY-MM-DD.N`).
- El seed nunca pisa entradas custom del usuario (matchea por `sid`; los user-created no tienen `sid`).
- Categorías válidas: `term`, `acro`, `process`, `platform`, `software`.

### Curso de aprendizaje (simetrik-learn.html)

- 10 lecciones con `data-id="L01"`...`L10`.
- Progreso persiste en `localStorage` key `work_learn_progress` (objeto `{L01: true, L02: false, ...}`).
- Cada lección se expande con click en el body; se marca completa con click en el checkbox (✓).
- Tour interactivo: lista `#mockNav` con 8 items (`data-s="home|sources|rules|exceptions|agents|reports|audit|admin"`).

---

## MEMORIA OPERATIVA (qué se hizo, en qué orden)

Cronología relevante de 14-WORK:

- **2026-04-XX** — Creación inicial 14-WORK "Simetrik Copilot" con 6 tabs (Casos / Errores / Aprendizajes / KB / Cuadernos / Copilot).
- **2026-05-13a** — Redesign a "Simetrik Ecosystem": añadidas 3 tabs (Workflow / Mini-curso / Diccionario) con editores rich-text. Autosave hardening en 3 módulos NB (work / notes-nb / systems_logic) con flush en `beforeunload` + `visibilitychange` + `focusout`.
- **2026-05-13b** — Integración del ZIP del usuario: copia de `Documento completo.html` → `pages/simetrik-playbook.html` con back-nav. Diccionario seedeado con 40 entradas (SEED_VERSION `simetrik-2026-05-13.1`).
- **2026-05-13c** — Pestaña "🧭 Empieza Aquí" agregada como default → `pages/simetrik-learn.html` (guía didáctica completa, tour interactivo, curso 10 lecciones, recursos). Diccionario expandido a ~100 términos (SEED_VERSION `simetrik-2026-05-13.2`).
- **2026-05-27a** — Pestaña "🧪 Prueba DOTA" agregada (`pages/simetrik-dota-test.html`). Roadmap del caso DOTA × FD para Implementation Specialist con los 16 puntos del Documento Guía + cronograma de barridas + tableros. Checklist con sync cross-device (clave `work_dota_progress` en SYNC_REGISTRY).
- **2026-05-27b** — Diccionario expandido con 12 términos del dominio DOTA × Simetrik (LPAD, COALESCE, ADICIONAR_FECHA_HABIL, PAN, BIN, Barrida, Compensación, Add-ons, Saldos Persistentes, etc.). SEED_VERSION `simetrik-2026-05-27.2`.
- **2026-05-27c** — Reescritura del roadmap Prueba DOTA usando insumos REALES del Drive del usuario (carpeta Imagenes): sintaxis Simetrik verificada (`CONCATENAR`, `RELLENAR`, `SI`, `Y`, `O`, `ESBLANCO`, `MAYUSC`, `IZQUIERDA`, `DERECHA`, `EXTRAER_EXPREGULAR`, `EXTRAER_FECHA`, `ADICIONAR_FECHA_TIEMPO`, `ADICIONAR_DIAS_SEMANA`, `DIFERENCIA_FECHA`, `CALCULO`, `ABS`, `LARGO`). Todas las 16 fórmulas reescritas con sintaxis EXACTA. Tabla de tipos de dato + sección "Best practices que califica el evaluador". Simulador de 5 barridas eliminado por feedback del usuario.
- **2026-05-27d** — Modo 3 "🧪 Nueva Prueba Simetrik" agregado al Copilot. Genera prompt reusable estilo DOTA para futuros casos de Simetrik (nuevos clientes / nuevos tests / case studies). Plantilla persistente en `PROMPT_14-WORK_TEST.md`.

---

## PROTOCOLO DE EJECUCIÓN (CADA SESIÓN)

Cuando recibís una instrucción en este prompt, ejecutá EN ESTE ORDEN sin pedir confirmación:

### 1. Investigá antes de tocar
- Usá `Grep`/`Read` con `offset/limit` para entender el estado actual del archivo afectado.
- Nunca leas un archivo enorme entero — siempre con paginación.
- Si la tarea toca el diccionario: leé el `SEED_DICT` actual y la `SEED_VERSION`.

### 2. Implementá con precisión quirúrgica
- Preferí `Edit` con `old_string` específico sobre `Write`.
- Si tocás `work.html`: respetá el orden de pestañas; las nuevas se añaden al final salvo orden contrario.
- Si tocás `simetrik-learn.html` o `simetrik-playbook.html`: mantené la tira `.da-strip` con back-nav al ecosistema y el script `body.in-iframe` que la oculta cuando se carga embebido.
- Si añadís un nuevo storage key: agregalo a `frontend/js/cloud-sync.js` en `SYNC_REGISTRY` (sección 14-WORK).
- Si añadís entradas al `SEED_DICT`: bumpeá `SEED_VERSION` (siguiente patch o nueva fecha).

### 3. Verificá sintaxis
```bash
cd "E:/Aplicaciones/ANALISIS DE DATOS/Pagina Web/HTML/da-2026" && node -c frontend/js/work.js
```
Si tocaste otros JS, verificalos también. Cero warnings tolerados.

### 4. Comiteá completo
```bash
git add <archivos específicos — NO usar git add .>
git commit -m "feat(14-WORK): <descripción concisa>

<bullets de qué cambió>
- ...

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
git push origin main
```

Reglas del commit:
- Tipo: `feat(14-WORK):` para features · `fix(14-WORK):` para bugs · `docs(14-WORK):` para documentación.
- Título ≤ 70 caracteres. Detalle en el cuerpo.
- Usá HEREDOC para evitar problemas de escape.

### 5. Actualizá el Cerebro
Después de cada push, **siempre**:

**A) Anexá entrada en `CEREBRO_STATE.md`** (al inicio del archivo, después del header):

```markdown
## 💼 14-WORK · <Titular corto> — YYYY-MM-DD

### Qué cambió
- ...

### Archivos modificados
- ✏️ `frontend/...` (qué se hizo)
- ➕ `frontend/...` (NEW, qué hace)

### Storage keys nuevos
- `work_eco_xxx` (descripción)

### Decisiones técnicas relevantes
- ...

### Estado actual de 14-WORK
- Pestañas activas: 11 (lista corta)
- Diccionario: N términos (SEED_VERSION x)
- Curso: 10 lecciones (progreso del usuario en `work_learn_progress`)
```

**B) Si cambia la nomenclatura, el storage layer, o el contrato cross-module:** actualizá `CLAUDE.md`. (La tabla de nomenclatura, los pilares arquitectónicos, las reglas de integridad.)

**C) Si el cambio amplía o redefine este prompt:** actualizá este archivo `PROMPT_14-WORK.md`.

### 6. Reportá al usuario (en español, conciso)
Formato:
```
✅ Deployado a producción → https://mikel696.github.io/da-2026/frontend/work.html

**Lo que cambié:**
- bullet 1
- bullet 2

**Archivos tocados:** N archivos (link al commit si fuera relevante)

**Pendientes detectados:** (si aplica)
```

---

## REGLAS DE INTEGRIDAD ESPECÍFICAS DE 14-WORK

1. **No fabriqués contenido de Simetrik.** Toda info sobre Simetrik/Ficohsa que aterrice en el código debe venir del material que el usuario te pasó (ZIPs, PDFs, texto pegado). Si te falta info para una sección, dejá el placeholder visible y pedila explícitamente.
2. **No pises el diccionario user-created.** El seed solo añade entradas con `sid` nuevo. Si una `sid` ya existe en el storage, NO la sobreescribís.
3. **No rompás el contrato de Cuadernos.** `js/work.js` consume `js/nb-shared.js`. Cualquier cambio en `nb-shared.js` impacta 10-SYS y 13-NOT — coordinalo o no lo toques.
4. **Iframes con back-nav:** las páginas en `frontend/pages/` deben tener la tira `.da-strip` con `← Ecosistema Simetrik` y el script `body.in-iframe` que la oculta al embedirse.
5. **Imágenes en cuadernos:** se guardan en IndexedDB (3-tier: thumb 320 / preview 1280 / full 1920). Solo el preview viaja a Supabase. NO cambiés este patrón sin actualizar `nb-shared.js`.
6. **Autosave NB:** confiá en el patrón `_commitNow + autoSave debounce + flush en blur/hide/unload`. Si tocás esa función en `work.js`, replicá el cambio en `notes-nb.js` y `systems_logic.js`.

---

## RECURSOS DEL PROYECTO QUE EL USUARIO YA PROVEYÓ

Para evitar pedir cosas que ya pasaste, asumí disponibles:

- ZIP Simetrik con: `Documento completo.html` (45KB · playbook completo Ficohsa con 7 secciones), `Terminologias.html` (22KB · 16 términos fintech extendidos), `Simetrik ↔ Ficohsa.html` (35KB), `ecosistema-fintech.html/png`, `Credit cards.csv` + `Debit cards.csv` + `Gateways.csv` (datos de prueba reconciliación), `Ficohsa/Ecosistem,a Simetrik.md` (95KB), `Módulo de Servicios 3 Metodología A.md` (40KB), `Service Module 2.pdf`, `Service Module 3.pdf` (Simetrik Applied Methodology), `RFP - Automatización de Conciliaciones.pdf`, `V2_Nov25_SDD_Propuesta de Servicios - Ficohsa_Alcance ampliado.pdf`, `Guide for the Exercises.pdf`, ejercicios xlsx (`MB_Credit Card`, `MB_Debit Card`, `MB_Fee Dictionary`, `MB_DB MAGALU`, `Merchant`, `ADQ`).
- Resumen ejecutivo: Simetrik es capa de orquestación financiera con IA · Connect/Reconcile/Resolve · SBBs no-code · Snowflake+AWS · -5d cierre / -95% errores / -70% TI.
- Stakeholders Ficohsa: Sponsor + PM, Seguridad (Carlos Avila), Cloud (Daniel Jojoa), Datos (Gabriel Cortes), Tecnología (William/Williams/Erik/Wilson), Integraciones (Noel/Jorge/Carlos/Jose), Arquitectura (Gary).
- Equipo Simetrik del proyecto: SM Ana M., PM Lina Azcárate, Senior IS Juan C. / Wilson, CSM Carolina Toro.
- 5 fases reales: Preventa→Kick-off (5 Jun 2026)→Discovery→SDD→Implementación→Pruebas+Go-Live→Transición CSM.
- Volumen RFP: 32.4M tx/mes · 945 cuentas · 30 analistas impactados · 98 procesos regionales (Honduras → Guatemala/Nicaragua/Panamá).
- Sistemas core a integrar: T24 (Temenos) · Vision Plus · SAP ERP · Visa/Mastercard · SFTP.
- Material de aprendizaje externo: Simetrik Academy (academy.simetrik.com), Help Center (help.simetrik.com), YouTube @Simetrik (+140 videos), MaxMunus para capacitación externa.

Si necesitás algo de este material que aún no procesé: **pedímelo explícitamente** mencionando el archivo concreto del ZIP.

---

## INSTRUCCIONES DE ESTA SESIÓN

<!-- AGREGÁ ACÁ ABAJO QUÉ QUERÉS QUE HAGA -->



---

**FIN DEL PROMPT MAESTRO.** Versión `2026-05-13.1`.
