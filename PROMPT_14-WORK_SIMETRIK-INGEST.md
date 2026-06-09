# 🧠 PROMPT · INGESTA · Simetrik Knowledge Engine

> Copialo en una sesión con Chrome MCP. Actualiza `frontend/data/simetrik-kb.json` con SOLO el material nuevo de la bandeja de ingesta. El espejo de este prompt vive en el botón "📋 Copiar Prompt de Ingesta" dentro de `pages/simetrik-kb.html`.

Objetivo: leer SOLO el material NUEVO de la bandeja de ingesta, extraer conocimiento Simetrik atómico y verificable, y actualizar `frontend/data/simetrik-kb.json`. Nada inventado: sin evidencia, no entra.

## Fuentes
- Cuaderno **"Simetrik · Ingesta"** en el live site (`work.html`, sesión autenticada del usuario). Un drop = una página; el título suele traer la fecha.
- Base actual: `frontend/data/simetrik-kb.json`. El campo `meta.ingested_sources` lista los IDs de página ya procesados.

## ✅ GATE DE VALIDACIÓN (obligatorio · ANTES de ingerir cualquier entrada)
El cerebro alimenta las secciones del módulo (Diccionario/Guía/Simulador) → una entrada mala se propaga como si fuera verdad y **daña el módulo**. Toda candidata debe pasar las 4:
1. **Coherente** — idea completa y clara; NO fragmentos de auto-subtitulado/word-salad ("Foreign speech", palabras sueltas).
2. **Racional** — consistente con el funcionamiento conocido de Simetrik. Si **contradice** una entrada `verificado` existente → FRENAR y preguntar al usuario, no auto-agregar.
3. **Con evidencia** — cita verbatim / dato / captura que la respalde. Sin evidencia → NO entra.
4. **Confirmada** — afirmación de fuente autoritativa (Simetrik/trainer/dato) → `verificado`. Duda/no confirmada → `hipotesis`, y NO usar `dcat`/`detail` (así NO alimenta Diccionario/Guía/Simulador; queda solo en la vista KB, etiquetada).
Si una candidata no pasa las 4 → **se descarta**. Mejor un cerebro chico y confiable que grande y dudoso. Reportá qué pasó el gate y qué descartaste y por qué.

## Protocolo
1. Chrome MCP → `tabs_context_mcp` → abrir/usar `work.html` del usuario (`https://mikel696.github.io/da-2026/frontend/work.html`). NO navegar fuera; reusar su sesión.
2. `javascript_tool` → leer `localStorage` `work_nb_meta` y `work_nb_data`; ubicar el cuaderno cuyo `name` = "Simetrik · Ingesta". Listar sus páginas `{id, title}`.
3. Para cada PÁGINA cuyo `id` NO esté en `meta.ingested_sources`:
   - a. Extraer el texto: `innerText` del `page.body` (parsear el HTML en un div).
   - b. Resolver e **INSPECCIONAR las imágenes** (chips `.nb-img-chip`): usar `data-preview` (data URI embebido) o IndexedDB `da2026_nb` store `attachments` por `data-img-id`; renderizarlas y MIRARLAS. Las capturas son la verdad visual (rutas de UI, configs, errores) — prioridad sobre lo verbal.
   - c. Si hay un link de Drive (grabación/transcript/doc), leerlo con la Drive MCP (`read_file_content`; si excede tokens, parsear el archivo guardado).
4. Extraer UNIDADES DE CONOCIMIENTO atómicas (una idea por entrada). Cada una:
   `{id (kebab corto), cat, title, body, evidence, source, date (YYYY-MM-DD), confidence}`
   - `cat` ∈ `regla | plataforma | funcion | gotcha | conciliacion | caso | glosario`
   - `confidence` = `"verificado"` si hay dato/captura/fuente que lo respalde; `"hipotesis"` si es deducción sin confirmar.
   - `evidence` = cita verbatim del transcript, o descripción de la captura, o resultado del dato. **Obligatorio.**
   - Si `cat="glosario"` (un término/definición): agregá también `dcat` ∈ `acro|term|process|platform|software` → el Diccionario del módulo se alimenta del cerebro y agrupa por `dcat`. Si `cat="plataforma"` y es un how-to de UI con ruta/pasos, podés agregar `detail:{path,steps,...}` → la Guía Simple los rendea.
5. **DEDUPE** contra `entries` existentes (por title/contenido). No dupliques. Si una entrada vieja queda incompleta o contradicha, ACTUALIZALA (mejorá body/evidence, subí su `date`). Si lo nuevo contradice algo "verificado", marcalo y avisá en el reporte.
6. Editar `simetrik-kb.json`: append/merge `entries`; agregar los ids de página procesados a `meta.ingested_sources`; subir `meta.version` y `meta.last_updated`.
7. Commit: `feat(14-WORK): KB ingesta YYYY-MM-DD (+N entradas)` · push origin main. Registrar en `PROMPT_RUNS.md`.
8. (Opcional) Chrome MCP → inyectar al final de cada página procesada un "✅ ingerido YYYY-MM-DD" como marca visual.

## Reglas
- CERO invención. Atómico (1 idea = 1 entrada). Español, breve, sin relleno.
- Capturas > texto para rutas/UI. Sin evidencia → no se ingresa.
- No reprocesar páginas ya en `ingested_sources`.

## Salida
Reporte: N entradas nuevas (por categoría) · M actualizadas · páginas procesadas (ids) · dudas que el material no aclaró.
