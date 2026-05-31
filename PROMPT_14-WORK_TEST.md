# 🧪 PROMPT · Desarrollo de Pruebas / Proyectos / Casos Simetrik

> Plantilla reutilizable para resolver tareas reales de Simetrik (DOTA-style)
> con fórmulas exactas y roadmap publicado en el módulo 14-WORK.

---

## CUÁNDO USAR ESTE PROMPT

Cualquier tarea que tenga:
- Material en Google Drive (xlsx + docx + capturas + anotaciones)
- Un documento guía que define puntos a desarrollar
- Fórmulas Simetrik que hay que escribir con sintaxis exacta
- Tableros / KPIs / saldos a configurar
- Un evaluador que califica

Ejemplos: **Prueba DOTA · proyecto Ficohsa · case study × cualquier cliente**.

---

## CONTEXT (rellenar ANTES de copiar)

```
Material en Drive:    [URL del folder Drive]
Nombre del proyecto:  [DOTA / Ficohsa / etc.]
Tipo:                 [test de conocimiento / implementación real / case study]
Cliente / país:       [DOTA Argentina / Ficohsa Honduras / etc.]
Deadline:             [YYYY-MM-DD]
Slug interno:         [dota / ficohsa / kebab-case-sin-acentos]
                      → se usa para: work_<slug>_progress + pages/simetrik-<slug>-test.html
```

---

## PROTOCOLO DE EJECUCIÓN

### 0. Leé SIMETRIK_KNOWLEDGE_BASE.md primero

Antes de leer el Drive o escribir código, leé `SIMETRIK_KNOWLEDGE_BASE.md` (raíz del repo, v2.0).
- Contiene el catálogo completo de 24 funciones con sintaxis exacta.
- Contiene flujos paso a paso de los 8 artículos críticos (Configuración de cruce, Conciliaciones avanzadas, estándar, Transformación, Fuentes, Uniones, Tableros, Agrupaciones).
- **Funciones clave a verificar siempre:**
  - `ADICIONAR_DIASEMANA(FECHA;CANTIDAD)` — sumar tiempo a fecha (2 params base; 3er param con add-on días hábiles).
  - `TODAY()` — fecha actual, **solo en agrupaciones**.
  - Si usás una función que NO está en la KB → scrapear el Help Center antes de usarla.

### 1. Leé TODOS los insumos del Drive antes de tocar código

Usá Chrome MCP (`mcp__Claude_in_Chrome__*`). NO inventes fórmulas ni columnas.

Por archivo:
- **Guía .docx** → leé via `https://docs.google.com/document/d/<ID>/mobilebasic`
- **xlsx grandes** → no descargues. Identificá columnas mencionadas en la guía. Si necesitás más detalle, pedile al usuario screenshot puntuales.
- **Capturas .png** → abrilas en el viewer de Drive. Extraé:
  - Nombres de funciones disponibles del panel "Fórmulas disponibles"
  - Sintaxis exacta de cada función (separador, comillas, parámetros)
  - Tipos de dato del diálogo "Dar formato a una columna"
- **Anotaciones .txt** → es la fuente de verdad de la sintaxis Simetrik. Copiala literal y derivá el resto de fórmulas con el mismo patrón.

### 2. Mapeá la sintaxis Simetrik

Construí una tabla mental:
- ¿Separador? `;` o `,`
- ¿Strings? `"..."` o `'...'`
- ¿Funciones en MAYÚSCULAS sin acentos? (típico Simetrik en español)
- ¿IZQUIERDA/DERECHA disponibles vs LEFT/RIGHT?
- ¿RELLENAR para LPAD? ¿Con qué parámetros?
- Función para sumar tiempo: `ADICIONAR_DIASEMANA(FECHA;CANTIDAD)` — nombre oficial verificado en KB.
- Fecha actual: `TODAY()` — solo disponible en agrupaciones.
- Funciones de regex: `EXTRAER_EXPREGULAR(VALOR;PATRÓN;GRUPO)` con grupo numérico.
- Funciones de fecha: `EXTRAER_FECHA(VALOR;"año"|"mes"|"día")` y `DIFERENCIA_FECHA(FECHA1;FECHA2;"días")`.

### 3. Para CADA punto del documento guía, generá:

```yaml
punto_N:
  nombre_columna_salida: STRING
  tipo_dato_salida: Texto | Número | Entero | Fecha | Fecha y hora | Hora | Booleano
  formula_simetrik: |
    FORMULA EXACTA AQUÍ
    (sintaxis verificada con anotaciones del usuario)
  depende_de: [punto_X, punto_Y]
  trampa_evaluador: "qué califica el evaluador acá"
  best_practice: "qué hacer para no perder puntos"
```

### 4. Identificá los puntos con conciliación / barridas

Para puntos de conciliación avanzada:
- Documentá las **llaves** de cada barrida con nombres de columna reales
- Documentá las **restricciones** (auto-cross, tipo de operación, tolerancias direccionales)
- Mencioná el **add-on** Simetrik necesario (Saldos Persistentes, Calendario Hábil, etc.)

### 5. Identificá los tableros / KPIs

Para cada tablero pedido:
- Métricas exactas: SUMA / CONTAR / % calculado
- Filtros y dimensiones
- Si hay tablero libre (criterio), aportá 3-4 sugerencias con justificación operativa

### 6. Generá el roadmap standalone

```
frontend/pages/simetrik-<slug>-test.html
```

Estructura:
- Hero con título + meta
- TOC interactivo
- Sección Preparación + Tipos de dato Simetrik
- Una sección por cada punto del documento guía
  - Fórmula en `<pre class="formula">` con coloreo (fn / str / col / cm)
  - Card formula / tip / warn según corresponda
  - Best practices y trampas destacadas
- Sección "Best practices · qué va a revisar el evaluador" (tabla)
- Checklist marcable que persiste en `work_<slug>_progress`
- Script IIFE `<SLUG>` con `toggle / markAll / reset` + bridge `parent.CLOUD.pushState`

NO incluir simuladores ni gimmicks. Foco 100% en el desarrollo de la tarea.

### 7. Integrá al módulo 14-WORK

- `frontend/work.html`:
  - Nueva tab `<button class="tab" data-p="<slug>test">🧪 Prueba <NOMBRE></button>`
  - Nuevo panel `<div class="pnl" id="p-<slug>test">` con header descriptivo + iframe al HTML
- `frontend/js/cloud-sync.js`:
  - Añadir `work_<slug>_progress` al SYNC_REGISTRY (sección 14-WORK)
- `frontend/js/work.js` (opcional, si hay términos nuevos):
  - Bumpear `SEED_VERSION` y añadir entradas al `SEED_DICT` con los términos Simetrik específicos del caso
  - Cada entrada `{sid, term, cat, en, def, ex}` con un ejemplo aplicado a este proyecto

### 8. Documentación

- `PROMPT_RUNS.md` → entry `### ID:14-WORK.P2 (CONT) · YYYY-MM-DD — Prueba <NOMBRE>`
  - Commit hash · archivos · 1-2 líneas qué cambió · qué probar la próxima
- `CEREBRO_STATE.md` → sección "## ⚙️ 14-WORK · Prueba <NOMBRE> — YYYY-MM-DD"
  - Qué se entregó + arquitectura del HTML + storage keys + commits relacionados
- `PROMPT_14-WORK.md` → actualizar cronología (sección "MEMORIA OPERATIVA") con la nueva tab y la versión del diccionario

### 9. Commit + push (UN SOLO commit)

```bash
git add frontend/pages/simetrik-<slug>-test.html frontend/work.html \
        frontend/js/cloud-sync.js frontend/js/work.js \
        PROMPT_RUNS.md CEREBRO_STATE.md PROMPT_14-WORK.md

git commit -m "feat(14-WORK): Prueba <NOMBRE> · roadmap + fórmulas Simetrik + checklist sync

<bullets de qué cambió>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"

git push origin main
```

---

## REGLAS CRÍTICAS

| Regla | Por qué |
|---|---|
| **NO inventar fórmulas** | Si no está en las anotaciones / capturas del Drive, no la usás. Pedile al usuario el insumo faltante. |
| **NO inventar columnas** | Verificá nombres en las capturas o en el xlsx. Notar diferencias entre DB DOTA y Reporte FD. |
| **Tipo de dato correcto** | CARD_NUMBER / PAN / IDs con ceros a la izquierda → SIEMPRE Texto · fechas sin hora → Fecha · montos con decimales → Número. |
| **Bisiesto-safe en fechas** | El evaluador busca este patrón. Resolver fin-de-mes con "mes cambia al +1 día", no codificando 28/29/30/31. |
| **Restricciones de barrida** | No auto-cross · operaciones opuestas · tolerancias direccionales. Documentar EXPLICITAMENTE. |
| **Add-ons** | Saldos persistentes para acumulados · calendario hábil para fechas. NO simular con fórmulas. |
| **Sync registry** | Toda nueva storage key DEBE ir en `SYNC_REGISTRY` de cloud-sync.js. |
| **Un solo commit** | Roadmap + arquitectura + docs todo en el mismo push. Mensaje detallado. |

---

## CHECKLIST DE SALIDA (antes de commitear)

- [ ] Roadmap HTML standalone con TOC funcional
- [ ] Cada punto con fórmula EXACTA Simetrik (sintaxis verificada)
- [ ] Tabla de tipos de dato por columna
- [ ] Sección "Best practices · qué va a revisar el evaluador"
- [ ] Checklist 16 items con sync cross-device
- [ ] Tab agregada en work.html en orden lógico
- [ ] Storage key `work_<slug>_progress` en SYNC_REGISTRY
- [ ] Diccionario expandido (si hay términos nuevos) + SEED_VERSION bumpeada
- [ ] `node -c frontend/js/work.js` y `cloud-sync.js` → sin errores
- [ ] PROMPT_RUNS.md + CEREBRO_STATE.md + PROMPT_14-WORK.md actualizados
- [ ] Commit con mensaje detallado · push a main

---

## INSTRUCCIÓN FINAL DE ESTA SESIÓN

[ESCRIBÍ ACÁ qué tarea específica querés que se desarrolle.

Ejemplo:
"Material en Drive: https://drive.google.com/drive/u/0/folders/XXXX
Es un nuevo case study de conciliación entre cliente FOO y procesadora BAR.
Slug: foo-bar.
Procedé."]
