# 🚀 PROMPT 14-WORK · FASE B · CIERRE PROFUNDO KB SIMETRIK + RE-TEST DOTA

> **Cómo usar este archivo:** Cuando tu sesión de Claude se reinicie y el límite de tokens vuelva a estar fresco, pega TODO el contenido de este `.md` como mensaje inicial. Es autocontenido: tiene contexto, estado actual, objetivos concretos, metodología validada, reglas anti-hallucination y criterios de cierre. NO requiere leer otros archivos para arrancar (aunque sí los irás leyendo durante la ejecución).

---

## 🎯 OBJETIVO MAESTRO DE LA FASE B

La **Fase A** (commit `eb5b8d2`) dejó la KB Simetrik v1.5 con cobertura de **intros + prerrequisitos** de ~30 artículos del Help Center. La Fase B debe **profundizar y cerrar** el módulo 14-WORK Simetrik:

1. **Drill-down completo** de cada artículo: extraer los pasos accordion ("¿Cómo crear...?", "Posibilidades y restricciones", "¿Qué hacer si…?") que en Fase A quedaron sin tocar.
2. **Re-testear los 16 pasos** de la Prueba DOTA **uno por uno** contra la KB: validar que cada path UI, cada función, cada operador, cada nombre de columna coincide exactamente con la documentación oficial. Corregir donde no coincida.
3. **Refactor del módulo 14-WORK** (si aplica): alinear `work.html`, `work.js`, iframes Playbook/Diccionario con el lenguaje oficial validado.
4. **Actualizar los dos PROMPT** del módulo (`PROMPT_14-WORK.md` y `PROMPT_14-WORK_TEST.md`) para que apunten a la KB como fuente de verdad y reflejen la versión actualizada del roadmap.
5. **Commit + push** al final.

---

## 👤 CONTEXTO DEL USUARIO

- **Quién:** BARROS TORRES MIGUEL ANGEL (1063955980).
- **Rol:** Reconciliations Analyst / Implementation Specialist en **Simetrik** (proyecto Ficohsa Honduras).
- **Estudios paralelos:** Ing. de Sistemas 8vo semestre — CUN Virtual, período 26V02.
- **Email:** miguelbarros2416@gmail.com.
- **Idioma:** Español SIEMPRE.
- **Estilo:** tokens cortos, módulo por código, sin explicaciones decorativas. Una tarea por mensaje.

## 🏛 PROYECTO DA-2026

- **Stack:** 100% Vanilla JS, sin frameworks, sin build step. HTML + CSS + JS plano servido por GitHub Pages.
- **Live URL:** https://mikel696.github.io/da-2026/frontend/
- **Repo:** https://github.com/Mikel696/da-2026
- **Cwd local:** `E:\Aplicaciones\ANALISIS DE DATOS\Pagina Web\HTML\da-2026`
- **Patrón canónico:** IIFE namespace por módulo (`const WORK = (() => { ... })()`).
- **Storage:** localStorage write-through proxy → Supabase JSONB sync via `frontend/js/cloud-sync.js`. SYNC_REGISTRY gobierna qué keys sincronizan.
- **Módulo 14-WORK:** Ecosistema Simetrik con 14 pestañas (Empieza Aquí, Playbook Ficohsa, Diccionario, Notas Workflow, Notas Curso, Cuadernos, Casos, Errores, Aprendizajes, KB, Copilot, **Prueba DOTA**, etc.).
- **Storage keys 14-WORK:** `work_cases, work_errors, work_learnings, work_kb, work_nb_meta, work_nb_data, work_eco_workflow, work_eco_course, work_eco_dict, work_dota_progress`.

---

## 📂 ARCHIVOS CLAVE DE LA FASE B

| Archivo | Rol |
|---|---|
| `SIMETRIK_KNOWLEDGE_BASE.md` (raíz) | **Fuente de verdad** — KB v1.5. Ampliar a v2.0 con drill-down. |
| `frontend/pages/simetrik-dota-test.html` | Roadmap interactivo Prueba DOTA con 16 pasos + tabla mapeo `#kb`. Re-validar paso por paso. |
| `frontend/work.html` | Shell del módulo 14-WORK con 14 tabs. Revisar si el copy de cada tab usa lenguaje oficial. |
| `frontend/js/work.js` | Namespace IIFE `WORK`. `SEED_DICT` está aquí (versión actual `simetrik-2026-05-27.2`). Si agregás términos, bumpea `SEED_VERSION`. |
| `frontend/pages/simetrik-learn.html` | Curso 10 lecciones + tour. Alinear con KB. |
| `frontend/pages/simetrik-playbook.html` | Playbook Ficohsa del usuario (7 secciones). NO inventar contenido — sólo ajustar referencias técnicas a la KB. |
| `PROMPT_14-WORK.md` | Prompt maestro del módulo. Actualizar al final. |
| `PROMPT_14-WORK_TEST.md` | Template reutilizable para nuevas pruebas Simetrik. Actualizar al final. |
| `CEREBRO_STATE.md` | Estado global. Append bloque de cierre Fase B al final. |
| `CLAUDE.md` | Reglas inmutables del proyecto. **NO modificar arquitectura.** Sólo agregar referencia a la KB si aplica. |

---

## 📊 ESTADO ACTUAL (FIN FASE A · commit `eb5b8d2`)

### KB v1.5 ya cubre (paráfrasis intros + prerrequisitos + casos de uso):
- **Recursos y conciliaciones (14):** Tipos de columnas, Columnas de transformación/vencimiento/Hoy, Fuentes, Uniones, Configuración de cruce, Conciliación estándar, Conciliaciones avanzadas, Estándar vs Avanzada, Optimización (columnas/programación/KPIs), Conciliación encadenada, Agrupaciones, Eliminar registros, Hoja de cálculo, Columnas del sistema.
- **Integraciones (4):** Parsers, Smart Parsers, Repositorios, Conexiones.
- **Análisis (8):** Tableros, Estado conc. est/avz, Monitores, Tabla Personalizada, Tabla Dinámica, KPI Individual, Gráficos, Combinaciones.
- **Contabilidad (5):** Gestión de cuentas, Automatizaciones contables, Estructuras ERP, Configuración de cierre, Conexiones ERP.
- **Gestionar (6):** Conciliaciones de cuentas, Períodos contables, Asientos contables, Gestiones manuales, Buscador de registros, Alarmas.
- **Auditar (2):** Fotos, Historial de actividad.
- **Cuenta y Herramientas (6):** Consola, Solicitudes colaboración, Central descargas, Papelera, Procesos, Mapas + Admin/2FA/Soporte/Accesos.
- **Tabla mapeo DOTA → Help Center** con 12 componentes vinculados.

### Lo que FALTA (Fase B):
- ❌ Sub-pasos accordion de cada artículo (los **"¿Cómo crear...?"** detallados, **"Posibilidades y restricciones"**, **"¿Qué hacer si…?"**).
- ❌ Re-validación paso por paso de los 16 pasos DOTA contra la KB.
- ❌ Refactor de `work.html` / `work.js` si hay desalineación de vocabulario.
- ❌ Update de `PROMPT_14-WORK.md` y `PROMPT_14-WORK_TEST.md`.
- ❌ Cierre en `CEREBRO_STATE.md`.

---

## 🔧 METODOLOGÍA VALIDADA EN FASE A — REUSAR

### Prerrequisitos del usuario (recordarle si no están):
1. Chrome MCP debe estar conectado y el usuario logueado en `https://simetriksoporte.zendesk.com/hc/es-419`.
2. La pestaña del Help Center debe estar abierta en el mismo Chrome donde corre la extensión.

### Patrón de scraping batch (validado, NO navegar artículo por artículo):

```javascript
// Ejecutar EN LA PESTAÑA del Help Center vía mcp__Claude_in_Chrome__javascript_tool
(async () => {
  const urls = [
    ['Nombre1', 'https://simetriksoporte.zendesk.com/hc/es-419/articles/XXX'],
    // ...
  ];
  const fetchOne = async ([n, u]) => {
    try {
      const r = await fetch(u);
      const html = await r.text();
      const m = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
      const tmp = document.createElement('div');
      tmp.innerHTML = m ? m[1] : '';
      // CLAVE Fase B: expandir accordions ANTES de innerText
      tmp.querySelectorAll('details').forEach(d => d.setAttribute('open', ''));
      const txt = tmp.innerText.replace(/\s+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, 3000);
      return [n, txt];
    } catch (e) { return [n, 'ERROR:' + e.message]; }
  };
  window.__r = await Promise.all(urls.map(fetchOne));
  return 'done ' + window.__r.length;
})();
```

### Por qué funciona:
- `fetch()` reutiliza la sesión autenticada del usuario (cookies). No requiere navegar.
- Parsea HTML en el browser → solo devuelve `innerText` filtrado (10× menos tokens que `read_page`).
- Resultados se guardan en `window.__r` → consultar por chunks via `window.__r[i][1].slice(0,N)`.

### Anti-pattern (evitar):
- ❌ NO usar `curl` desde Bash — falla con 401 (no tiene cookies).
- ❌ NO navegar uno por uno (10 navigates = 10× más latencia).
- ❌ NO usar `read_page` para artículos completos (devuelve árbol enorme).
- ❌ NO devolver más de ~3KB por artículo en una sola tool call (el output se trunca).

---

## 🚨 REGLAS ANTI-HALLUCINATION (no negociables)

1. **Toda afirmación sobre Simetrik debe respaldarse con un bloque de `SIMETRIK_KNOWLEDGE_BASE.md`.** Si no está en la KB → scrapear y actualizar la KB ANTES de afirmar.
2. **Toda síntesis es paráfrasis propia.** Citar URL fuente. No reproducir bloques verbatim del Help Center (copyright).
3. **Si un paso DOTA no tiene equivalente claro en la KB**, marcarlo `🟡 PENDIENTE VERIFICAR` y pedirle al usuario screenshot/clarificación. **No inventar paths UI.**
4. **No tocar Playbook del usuario** (`simetrik-playbook.html`) sin permiso explícito — es su contenido personal. Sólo se ajustan referencias técnicas cuando claramente están mal según la KB.
5. **No bumpear `SEED_VERSION` del diccionario sin agregar contenido nuevo.** Versionado debe reflejar cambio real.

---

## 📋 PLAN DE EJECUCIÓN FASE B (orden recomendado)

### Bloque 1 · Drill-down KB (3-5 tool calls)
Para cada artículo crítico del DOTA (lista abajo), expandir accordions y agregar al KB un sub-bloque **"Flujo paso a paso"** con los `pasos` detallados:

**Críticos (8):**
- Configuración de cruce → "Barridas y llaves de cruce", "Tolerancias", "Tipos de cruce", "Universal ID", "Versión con cambios" (los 5 sub-accordions).
- Conciliaciones avanzadas → "¿Cómo crear una conciliación avanzada?", "¿Qué tipos de barridas tienes?", "¿Cómo segmentar registros?".
- Conciliación estándar → "¿Cómo crear una conciliación estándar?", "Tipos de barridas estándar".
- Columnas de transformación → catálogo COMPLETO de las 24 funciones (CONCATENAR, EXTRAER_*, ADICIONAR_*, DIFERENCIA_FECHA, CALCULO, SI, Y, O, ESBLANCO, MAYUSC, IZQUIERDA, DERECHA, RELLENAR, ABS, LARGO, etc.) con sintaxis y ejemplo.
- Fuentes → "¿Cómo crear una fuente?" + restricciones formato.
- Uniones de fuentes → "¿Cómo crear y editar una unión?" + gestión inconsistencias.
- Tableros → "¿Cómo crear un tablero?" + acciones disponibles.
- Agrupaciones → "¿Cómo crear una agrupación?" + acumulativas vs no.

**Bumpear:** changelog KB de `v1.5` → `v2.0`.

### Bloque 2 · Re-test 16 pasos DOTA contra KB
Leer `frontend/pages/simetrik-dota-test.html` por bloques. Para cada paso (1-16):
1. Identificar funcionalidad oficial (de la tabla `#kb`).
2. Validar nombre de columna esperado, función usada, sintaxis del separador (`;`), strings (`"…"`), UPPERCASE.
3. Validar path UI (clicks) contra "Flujo paso a paso" recién extraído.
4. Si difiere → corregir el bloque del paso. Si está alineado → dejar nota inline `<!-- ✓ validado v2.0 -->`.

**Pasos prioritarios (los más sensibles a desalineación):**
- Paso 8 (Cruce con parametría) → tipo de cruce, tolerancia, Universal ID.
- Paso 12 (Conciliación avanzada principal) → segmentación, barridas agrupadas, compensación.
- Check "> 15 días" → debe usar **Columna de vencimiento** (no transformación pura).
- Paso 13 (Saldo neto diario) → Tabla Dinámica + Agrupación + columna "Hoy".
- Pasos 14-16 (Tableros) → KPI Individual + Tabla Personalizada + Gráficos.

### Bloque 3 · Refactor 14-WORK (sólo si hay desalineación)
- `work.html` tab labels: revisar si algún copy contradice la KB (ej. "Conciliación" vs "Cruce" vs "Barrida"). Corregir.
- `work.js` `SEED_DICT`: agregar términos nuevos descubiertos en el drill-down (sub-accordions). Bumpear `SEED_VERSION` a `simetrik-2026-05-30.1` (siguiente versión).
- `simetrik-learn.html`: cada lección debe terminar con un link al artículo Help Center correspondiente.

### Bloque 4 · Actualizar PROMPTS
- `PROMPT_14-WORK.md`: agregar bloque "Fuente de verdad" apuntando a la KB. Actualizar lista de pestañas si cambió.
- `PROMPT_14-WORK_TEST.md`: en el template, instruir a futuras pruebas a **leer SIMETRIK_KNOWLEDGE_BASE.md primero**, mapear cada paso de la prueba a un artículo, validar con drill-down.

### Bloque 5 · Cerrar
- Append a `CEREBRO_STATE.md`: bloque "14-WORK · KB v2.0 cerrada + Prueba DOTA validada".
- `git add` selectivo (NO `git add .`).
- Commit con mensaje `feat(14-WORK): KB v2.0 + DOTA validada paso a paso contra Help Center`.
- `git push origin main`.
- Verificar deploy: `git log --oneline -3`.

---

## ✅ CRITERIOS DE ACEPTACIÓN

Para considerar Fase B cerrada, debe cumplirse TODO:

- [ ] `SIMETRIK_KNOWLEDGE_BASE.md` v2.0 con "Flujo paso a paso" en los 8 artículos críticos.
- [ ] Cada uno de los 16 pasos DOTA tiene marker `<!-- ✓ validado v2.0 -->` o corrección aplicada.
- [ ] `SEED_DICT` bumpeado con términos nuevos del drill-down.
- [ ] `PROMPT_14-WORK.md` y `PROMPT_14-WORK_TEST.md` apuntan a la KB.
- [ ] `CEREBRO_STATE.md` con bloque de cierre.
- [ ] Commit + push exitoso (verificar con `git log --oneline -3`).
- [ ] GitHub Pages refleja los cambios en `https://mikel696.github.io/da-2026/frontend/pages/simetrik-dota-test.html` (probar abrir y ver la tabla `#kb` + correcciones).

---

## 🧭 PRIMERA TOOL CALL RECOMENDADA EN FASE B

```
1. Read SIMETRIK_KNOWLEDGE_BASE.md (offset 1, limit 50) → confirmar v1.5
2. Read simetrik-dota-test.html (offset 1, limit 60) → ver índice de pasos
3. Crear TaskList con los 5 bloques arriba
4. Pedirle al usuario: "¿Confirmás que tenés Chrome MCP conectado y logueado en simetriksoporte.zendesk.com?"
5. Una vez confirmado → tabs_context_mcp + arranque del Bloque 1
```

---

## 📝 NOTAS DE PRECISIÓN (errores que cometí en Fase A para no repetir)

1. **Anuncié cierre falso.** Dije "KB completa, módulo restructurado, commiteado, pusheado, synced" cuando sólo había hecho la KB de intros. **Sé honesto sobre lo que está vs lo que falta.**
2. **Output `javascript_tool` se trunca a ~1KB.** Para textos largos, guardar en `window.__var` y consultar por chunks `.slice(N, M)`.
3. **No quemar tokens en explicaciones decorativas.** Una tabla > 5 párrafos.
4. **Verificar siempre con `git log --oneline -3` después del push.** El push no es real hasta que aparece en el log con el hash correcto.

---

**Fin del prompt. Cuando lo ejecutes, arrancá directo con el paso 1 de "Primera tool call recomendada". No preguntés "¿continuamos?" — el usuario ya dijo que sí al pegar este prompt.**
