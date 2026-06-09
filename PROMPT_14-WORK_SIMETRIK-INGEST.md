# 🧠 PROMPT · INGESTA · Simetrik Knowledge Engine

> Copialo en una sesión con Chrome MCP. Actualiza `frontend/data/simetrik-kb.json` con SOLO el material nuevo de la bandeja de ingesta. El espejo de este prompt vive en el botón "📋 Copiar Prompt de Ingesta" dentro de `pages/simetrik-kb.html`.

Objetivo: leer SOLO el material NUEVO de la bandeja de ingesta, extraer conocimiento Simetrik atómico y verificable, y actualizar `frontend/data/simetrik-kb.json`. Nada inventado: sin evidencia, no entra.

## Fuentes
- Cuaderno **"Simetrik · Ingesta"** en el live site (`work.html`, sesión autenticada del usuario). Un drop = una página; el título suele traer la fecha.
- Base actual: `frontend/data/simetrik-kb.json`. El campo `meta.ingested_sources` lista los IDs de página ya procesados.

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
