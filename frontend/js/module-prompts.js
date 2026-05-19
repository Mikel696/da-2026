/* ═══════════════════════════════════════════════════════════════════════
   DA-2026 · 8-PRO · MODULE PROMPTS LIBRARY (Fase A)
   ─────────────────────────────────────────────────────────────────────
   48 prompts (16 módulos × 3) generados sobre el ESTADO REAL del Cerebro:
   - Files reales · keys reales · SYNC_REGISTRY real · Design System v1.0
   - Cada prompt obliga a: read CEREBRO_STATE.md → verificar sync → commit + push
   - P3 (creativo) basado en Modelo.md (Obsidian Second Brain · Karpathy method ·
     JSON Canvas Skill · CLI · Local-first · Web Clipper · Plugins)
   ─────────────────────────────────────────────────────────────────────
   Generado: 2026-05-15
   ═══════════════════════════════════════════════════════════════════════ */

(function(){
'use strict';

/* ── Base contextual bloque (heredado por cada prompt) ── */
const BASE = `REPO: E:\\Aplicaciones\\ANALISIS DE DATOS\\Pagina Web\\HTML\\da-2026
LIVE: https://mikel696.github.io/da-2026/frontend/
STACK: 100% Vanilla JS · GitHub Pages · Supabase JSONB · sin frameworks · sin build step
ARCH: HTML shell + css/<mod>.css + js/<mod>.js (IIFE) + design-tokens.css + components.css
AUTH chain (4 scripts antes de </body>): supabase CDN → supabase-client.js → auth.js → cloud-sync.js
STATE cycle: mutate localStorage → render() → DOM
SYNC: cloud-sync.js · SYNC_REGISTRY + DYNAMIC_PREFIXES (['fin_','sb_pomo_']) · proxy intercepta setItem → CLOUD.push() async
DESIGN SYSTEM v1.0: css/design-tokens.css (tokens canónicos + aliases legacy) + css/components.css (.ds-* prefix)
MANDATORY al cerrar tarea: 1) verificar key en SYNC_REGISTRY si es persistible · 2) update CEREBRO_STATE.md · 3) commit feat/fix([CODE]): descripción · 4) push origin main`;

/* ── Catálogo de módulos con metadata real ──
   files: paths del módulo · keys: localStorage keys (sync mode) ── */
const MODULES = {
  '1-IND': {
    name: 'Dashboard · Mission Control',
    files: 'frontend/index.html (+ inline JS)',
    keys: 'sb_tasks · sb_ws_hist · sb_name · sb_streak · sb_start · sb_last · sb_hours · sb_pomo_total',
    notes: 'Hub central · enlaces a los 16 módulos · tareas rápidas · workshop history · streak global'
  },
  '2-APP': {
    name: 'Application Command Center',
    files: 'frontend/apply.html + css/apply.css',
    keys: '(usa estado inline de la sesión · sin storage propio relevante)',
    notes: '5 sub-secciones: ATS · CV Weaver · Cover · Interview · Prompts · html2pdf integrado'
  },
  '3-ENG': {
    name: 'English Academy + Interview Dojo',
    files: 'frontend/english.html + css/english.css + js/eng.js + js/english.js (Dojo) + js/srs.js + data/english-data.json + data/english-dojo.json',
    keys: 'e4 · eng_notes · eng_srs_deck · dojo_stats',
    notes: '20 grammar rules · 130+ vocab · phrases · conversations · flashcards · SRS Leitner · Interview Dojo (TTS+STT)'
  },
  '4-RUT': {
    name: 'Ruta Data Analyst + Excel Tech Test',
    files: 'frontend/ruta.html + css/ruta.css + js/ruta.js + data/ruta-data.json',
    keys: 'ruta5 · ruta_log5 · ruta_st · excel_dojo',
    notes: 'Roadmap 5 fases · roleplay con AI · simulador Excel Tech Test (split panel + drills)'
  },
  '5-JOB': {
    name: 'Job Tracker · Kanban · Master-Detail',
    files: 'frontend/jobs.html + css/jobs.css + js/jobs.js',
    keys: 'jt8 (vacancies) · jt_profile · jt_form_expanded · jt_s8 (start date)',
    notes: 'Búsqueda trilingüe ES/PT/EN · kanban drag-and-drop · master-detail · analytics · profile-based filtering'
  },
  '6-TOO': {
    name: 'Herramientas & Ventajas',
    files: 'frontend/tools.html (CSS inline)',
    keys: '(no storage propio · directorio estático)',
    notes: 'Directorio de tools (Notion, Obsidian, etc.) + hacks + certificaciones'
  },
  '7-NEW': {
    name: 'Noticias Data & IA',
    files: 'frontend/news.html (CSS inline) + js/news.js',
    keys: 'news_saved · news_cache (SKIPPED · efímero)',
    notes: 'RSS live · 5 fuentes · saved articles persistido · refresh manual'
  },
  '8-PRO': {
    name: 'Prompt Lab (este módulo)',
    files: 'frontend/prompts.html (CSS+JS inline) + js/module-prompts.js (este archivo)',
    keys: 'sb_prompts · plab_h (history)',
    notes: '5 tabs (Claude Optimize · Optimize · Módulos · Librería · Master · History) · genOpt/claudeOptimize 100% client-side'
  },
  '9-GOA': {
    name: 'Objetivos & Hábitos',
    files: 'frontend/goals.html + css/goals.css + js/goals.js',
    keys: 'sb_goals · sb_habits · sb_reviews · sb_ratings',
    notes: 'Metas 30/60/90 · habit tracker semanal · streak por hábito · reviews periódicas'
  },
  '10-SYS': {
    name: 'Ingeniería de Sistemas CUN (8vo · 26V02)',
    files: 'frontend/systems.html + systems_logic.js',
    keys: 'sys_tasks · sys_class_sessions · sys_notebook · sys_notebook_meta · sys_active_custom · sim_interview_chks',
    notes: '5 materias verificadas (VERIFIED_SUBJECTS · SEED_VERSION=5) · 8 tabs · Tab 7 Clases Perdidas con Direct-Fetch Protocol v2 (Chrome MCP + injectClassSession) · rich-text editor (NB.fmt + NB.insertLabel)'
  },
  '11-ACC': {
    name: 'Accounting Associate',
    files: 'frontend/accounting.html + css/accounting.css + js/accounting.js + data/accounting-data.json',
    keys: 'sb_accounting',
    notes: '6 tabs · career path · drills contables · diccionario IFRS/GAAP · resources con accent color inline (--rc)'
  },
  '12-FIN': {
    name: 'Finanzas Personales',
    files: 'frontend/finance.html + css/finance.css + js/finance.js',
    keys: 'fin_* (DYNAMIC_PREFIX · captura todas las variantes: fin_2026-MM · fin_sav_goal · etc)',
    notes: '4 KPIs (ingresos/gastos/balance/ahorro) · navegación mensual · 5 tabs (Registrar · Historial · Categorías · Gráfico · Meta Ahorro) · categorías predefinidas'
  },
  '13-NOT': {
    name: 'Notas · Journal · SRS Leitner',
    files: 'frontend/notes.html + css/notes.css + js/notes-nb.js + js/srs.js + js/nb-shared.js',
    keys: 'sb_notes2 · not_nb_meta · not_nb_data (cuadernos · attachments en IndexedDB local + Supabase Storage bucket "attachments")',
    notes: 'Notebooks con páginas · rich-text editor · attachments cross-device · SRS deck propio · filter tags pill-style'
  },
  '14-WORK': {
    name: 'Simetrik Copilot · 13 tabs · MOIF',
    files: 'frontend/work.html + css/work.css + js/work.js + js/nb-shared.js',
    keys: 'work_cases · work_errors · work_learnings · work_kb · work_nb_meta · work_nb_data · work_eco_workflow · work_eco_course · work_eco_dict · work_kb_atts · work_moif_meetings · work_eco_dict_seed_v (local-only)',
    notes: 'Simetrik Implementation Specialist · 13 tabs · MOIF (Monitoreo Observabilidad Integraciones Ficohsa) · attachments cloud via Supabase Storage · cyan local (#06b6d4) preservado como identidad · smartSync · realtime postgres_changes'
  },
  '15-MM': {
    name: 'Mind Map Studio (jsMind + Free Canvas)',
    files: 'frontend/mindmap.html + css/mindmap.css + js/mindmap.js (+ jsmind CDN)',
    keys: 'tools_mindmaps · tools_canvases',
    notes: 'Dos modos: jsMind (estructurado · node_tree JSON) + Free Canvas (Miro-style · nodes + edges + view state) · violet --vi local override'
  },
  '16-APA': {
    name: 'APA Document Studio',
    files: 'frontend/apa.html + css/apa.css + js/apa.js',
    keys: 'tools_apa_docs · apa_defaults',
    notes: 'Document Studio formato APA · 3 columnas (list/form/preview) · Times font para preview · cyan local (#06b6d4) como identidad académica'
  }
};

/* ── 48 PROMPTS (16 módulos × 3 prompts) ── */
const MODULE_PROMPTS = {};

Object.keys(MODULES).forEach(code => {
  const m = MODULES[code];
  MODULE_PROMPTS[code] = [
    /* ═══ P1 · MEJORAR / OPTIMIZAR / ACTUALIZAR ═══ */
    {
      kind: 'optimize',
      icon: '⚡',
      title: `${code} · Mejorar · Optimizar · Actualizar`,
      desc: `Iteración productiva sobre ${m.name}: features nuevas, performance, UX polish, sin romper lo que funciona.`,
      prompt: `Sos el Arquitecto de DA-2026 "Cerebro" trabajando en ${code} · ${m.name}.

${BASE}

══════════════════ MÓDULO TARGET ══════════════════
Files: ${m.files}
Storage keys: ${m.keys}
Notas: ${m.notes}

══════════════════ TAREA ══════════════════
[DESCRIBÍ LA MEJORA QUE QUERÉS — ej: "agregar X feature" / "rediseñar Y panel" / "mejorar performance de Z" / "polish del UX en flow A"]

══════════════════ PROTOCOLO ══════════════════
1. LEÉ ANTES DE TOCAR (Plan-first):
   a. CEREBRO_STATE.md → última entrada del módulo · estado · pendientes
   b. Grep -n del archivo principal por la feature/zona afectada
   c. Read offset/limit en la zona relevante (no leer todo entero)
   d. Si la zona toca sync: leer cloud-sync.js (SYNC_REGISTRY, DYNAMIC_PREFIXES, smartSync, fullSyncAll, pushNow)
   e. Si la zona toca UI: confirmar que usa tokens del Design System v1.0 (sin hex hardcoded)

2. PROPONÉ ANTES DE CODEAR:
   - Plan en 3-5 bullets · archivos a tocar · líneas estimadas · riesgo (bajo/medio/alto)
   - Esperá luz verde (excepto si el usuario dijo "no approval needed")

3. EJECUTÁ QUIRÚRGICAMENTE:
   - Edit con old_string específico > Write completo
   - Preservar IIFE namespace, naming convention, design tokens, focus-visible
   - Si agregás nuevo localStorage key persistible → ADD a SYNC_REGISTRY en cloud-sync.js
   - Si la feature toca un setting cross-device → verificar realtime postgres_changes lo propaga

4. CIERRE OBLIGATORIO:
   - update CEREBRO_STATE.md → nueva entrada con fecha, archivos modificados, qué cambió, commit hash
   - update MEMORY.md (si aplica · preferencia del usuario)
   - commit: feat(${code}): <descripción concreta · imperativo · sin "Implements/Adds/Fixes vague">
   - push origin main
   - Verificá con git log --oneline -3 que el commit aterrizó

══════════════════ CONSTRAINTS NO NEGOCIABLES ══════════════════
- Sin frameworks · sin TypeScript transpilado · sin bundlers
- No leer archivos gigantes enteros (Grep -n → Read offset/limit)
- Edits quirúrgicos · no rewrites masivos sin justificación
- Comentarios solo donde la lógica no sea obvia
- Si la tarea es ambigua: preguntá UNA pregunta concreta antes de codear`
    },

    /* ═══ P2 · BUSCAR BUGS / MEJORAS / UPDATES ═══ */
    {
      kind: 'audit',
      icon: '🔬',
      title: `${code} · Audit · Bugs · Updates`,
      desc: `Scan sistemático read-only de ${m.name}: encuentra bugs, regressions, deuda técnica, gaps de sync, oportunidades.`,
      prompt: `Sos un Senior Frontend Auditor revisando ${code} · ${m.name} en DA-2026 "Cerebro".

${BASE}

══════════════════ MÓDULO TARGET ══════════════════
Files: ${m.files}
Storage keys: ${m.keys}
Notas: ${m.notes}

══════════════════ TAREA · AUDITORÍA READ-ONLY ══════════════════
NO modifiques nada hasta que el usuario apruebe los fixes. Generá un reporte estructurado.

══════════════════ CHECKLIST DE AUDITORÍA ══════════════════

1. ESTADO DEL CÓDIGO
   - Grep funciones huérfanas (definidas pero nunca llamadas)
   - getElementById que apunten a IDs inexistentes en el HTML actual
   - addEventListener sin null-check del target
   - try/catch faltantes en JSON.parse(localStorage.getItem(...))
   - Race conditions en async (await faltantes · then chains sin catch)

2. ESTADO DE SYNC
   - Cada localStorage.setItem('XXX', ...) tiene XXX en SYNC_REGISTRY o cubierto por DYNAMIC_PREFIXES?
   - Hay typos en keys (doble prefijo · sys_sys_*, work_work_*)?
   - Deletes críticos llaman pushNow inmediato o sólo confían en debounce?
   - Conflict resolution: _mergeByUpdatedAt respeta el TS local cuando es más reciente?

3. ESTADO DEL DESIGN SYSTEM v1.0
   - Hex hardcoded (regex #[0-9a-f]{3,6}) que debería ser var(--token)
   - var(--XXX) referencias a tokens NO definidos en design-tokens.css
   - focus-visible presente en interactivos? · contraste WCAG en botones cromáticos?
   - transitions específicas (no transition:all) · radii usan --radius-*

4. ESTADO DE LA UX
   - Empty states con CTA claro · loading states con skeleton · error states informativos
   - Mobile <768px: touch targets ≥44px · sin overflow horizontal
   - Animaciones .25s · fade-up al cambiar tab · hover lift en cards interactivas

5. ESTADO DE LOS DATOS
   - data/*.json referenciados existen y matchean schema esperado
   - XSS: todo user-content pasa por _esc() / escapeHTML antes de innerHTML
   - localStorage budget: schema no infla más de 1MB por key

6. CEREBRO_STATE.md alignment
   - El estado documentado matchea el código actual?
   - Hay features documentadas que ya no existen · o features sin documentar?

══════════════════ FORMATO DE OUTPUT ══════════════════
Por cada hallazgo:
[SEVERIDAD] [categoría] [archivo:línea] — Descripción + fix sugerido (1 línea)

SEVERIDAD: 🔴 Critical · 🟡 Medium · 🟢 Minor · 🔵 Mejora opcional

Al final:
- Resumen tabla (categoría / count por severidad)
- Top-3 fixes recomendados con orden de ataque
- Preguntá: "¿Aplico los fixes ahora? ¿Cuáles primero?"

══════════════════ REGLAS ══════════════════
- READ-ONLY · NO toques código hasta aprobación
- Cap reporte a ~250 líneas (foco en señal · sin ruido)
- Distinguir bugs reales vs deuda técnica vs nice-to-have
- Si encontrás algo crítico (data loss / XSS / sync broken): flaggéalo arriba de todo`
    },

    /* ═══ P3 · CREATIVO (Modelo.md · Obsidian Second Brain) ═══ */
    {
      kind: 'creative',
      icon: '🧠',
      title: `${code} · Creativo · Modelo Second Brain`,
      desc: `Aplica las técnicas de Modelo.md (Karpathy method · JSON Canvas · CLI Skills · Local-first · Web Clipper · Plugins) al módulo ${code}.`,
      prompt: `Sos el Arquitecto Creativo de DA-2026 aplicando el Second Brain Model (Modelo.md) al módulo ${code} · ${m.name}.

${BASE}

══════════════════ MÓDULO TARGET ══════════════════
Files: ${m.files}
Storage keys: ${m.keys}
Notas: ${m.notes}

══════════════════ INPUT · TÉCNICAS DEL MODELO ══════════════════
De Modelo.md extraés 5 técnicas accionables del paradigma Obsidian Second Brain:

A) MÉTODO KARPATHY · Auto-organización con agente IA
   Dato en bruto → agente IA estructura en wiki/concepts/entities/sources con relaciones bidireccionales
   Aplicación: cualquier zona donde el usuario vuelca info sin estructura (notas crudas, transcripts, capturas)

B) WEB CLIPPER · Captura externa estructurada
   Botón un-click que extrae info de cualquier página → la guarda con metadata (URL, título, fecha, resaltados)
   Aplicación: enriquecer el módulo con captura externa (ej. capturar una vacante desde LinkedIn directo a 5-JOB)

C) CANVAS JSON · Visualización estratégica automática
   Skill genera mapa visual (nodos + edges + colores) desde data ya estructurada
   Aplicación: dar al usuario una vista panorámica del estado del módulo (knowledge graph)

D) CLI · SKILLS · Comandos componibles
   El módulo expone "skills" reutilizables que un agente IA puede invocar (crear nota / vincular concepto / generar canvas)
   Aplicación: API JS del módulo expuesta como helpers globales window.MOD.xxx para que un agente IA externo opere

E) LOCAL-FIRST · PLUGINS · Extensibilidad
   Todo funciona sin red · plugins de comunidad amplían funciones · zero lock-in
   Aplicación: confirmar que el módulo no depende de Supabase para nada crítico · sync es decoración

══════════════════ TAREA · CREATIVA ══════════════════
Diseñá UNA propuesta concreta que aplique 1-3 de estas técnicas al módulo ${code} para llevarlo de "herramienta básica" a "second brain del dominio".

DELIVERABLE EN 2 PASOS:
PASO 1 · BRAINSTORM (sin codear · sólo conceptos):
  - Top-5 ideas de "second brain" para este módulo (1 línea cada una)
  - Las 5 ideas deben ser DISTINTAS entre sí (no variaciones del mismo)
  - Para cada idea: técnica usada (A/B/C/D/E) · valor para el usuario · esfuerzo (S/M/L)

PASO 2 · BLUEPRINT TÉCNICO (de la idea que elija el usuario):
  - Diff arquitectónico (qué archivos · qué keys nuevas · qué cambia en sync)
  - Schema de datos (si requiere nuevo storage)
  - UI mock textual (qué controles · dónde · qué microinteracciones)
  - Pseudo-código del flujo crítico
  - Riesgos · trade-offs · cómo encaja con lo existente sin romperlo

══════════════════ EJEMPLOS DE APLICACIÓN POR MÓDULO ══════════════════
Para inspirarte (NO copiar literal · adaptá a ${code}):
- 10-SYS: Karpathy method para transcripts de clases → wiki auto-generado con conceptos/herramientas/tareas
- 13-NOT: JSON Canvas Skill genera mapa visual del knowledge graph entre cuadernos
- 15-MM: Web Clipper-style capture from URL → genera nodo inicial del mind map
- 12-FIN: Local-first AI sugiere reglas de categorización personales sin enviar datos a la nube
- 14-WORK: CLI exponiendo work.cases.create/link/relate desde un agente IA externo
- 5-JOB: Captura vacante desde portal externo (LinkedIn/Indeed) → llena jt8 con metadata enriquecida
- 3-ENG: Canvas auto-genera mapa de vocab por dominio temático + interconexiones gramaticales
- 9-GOA: Karpathy method estructura reviews crudas en patrones · obstáculos · wins
- 16-APA: Skill genera estructura APA-compliant desde brainstorm crudo
- 1-IND: Canvas global del Cerebro · estado de los 16 módulos como knowledge graph

══════════════════ CIERRE ══════════════════
Después del PASO 1 esperá que el usuario elija una idea.
Después del PASO 2 esperá luz verde antes de codear.
Cuando codees: respetá protocolo estándar (read CEREBRO_STATE.md primero · sync · commit · push · actualizar CEREBRO_STATE.md).

══════════════════ CONSTRAINTS ══════════════════
- 100% Vanilla JS · sin frameworks · sin lock-in
- Local-first siempre · Supabase es decoración no dependencia
- Privacidad: nada se manda a APIs externas sin permiso explícito del usuario
- Reusar Design System v1.0 · no inventar nuevas paletas
- Reusar componentes/patterns existentes · no fragmentar el sistema`
    }
  ];
});

/* ── Exponer al window para que prompts.html los renderice ── */
window.MODULE_PROMPTS = MODULE_PROMPTS;
window.MODULE_PROMPTS_META = MODULES;

/* ── Renderer · pintado del panel #p-modules ── */
window.renderModulePrompts = function(selectedCode){
  const container = document.getElementById('modContent');
  if (!container) return;
  const code = selectedCode || Object.keys(MODULES)[0];
  const m = MODULES[code];
  const prompts = MODULE_PROMPTS[code] || [];

  let html = '';
  html += '<div class="cd" style="margin-bottom:14px;padding:14px 16px">';
  html += '  <div style="font-size:13px;font-weight:600;color:var(--a2);margin-bottom:4px">'+code+' · '+m.name+'</div>';
  html += '  <div style="font-size:11px;color:var(--t2);line-height:1.6"><b>Files:</b> '+m.files+'</div>';
  html += '  <div style="font-size:11px;color:var(--t2);line-height:1.6"><b>Storage:</b> <code style="background:var(--c1);padding:1px 5px;border-radius:4px;font-size:10px">'+m.keys+'</code></div>';
  html += '  <div style="font-size:11px;color:var(--t3);line-height:1.6;margin-top:4px;font-style:italic">'+m.notes+'</div>';
  html += '</div>';

  prompts.forEach((p, i) => {
    const id = 'mp-' + code.replace(/[^a-z0-9]/gi,'') + '-' + i;
    html += '<div class="prompt-card" data-mod-id="'+id+'">';
    html += '  <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">';
    html += '    <span style="font-size:18px">'+p.icon+'</span>';
    html += '    <span class="prompt-cat c-claude" style="margin:0">'+p.kind.toUpperCase()+'</span>';
    html += '  </div>';
    html += '  <div class="prompt-title">'+p.title+'</div>';
    html += '  <div class="prompt-desc">'+p.desc+'</div>';
    html += '  <div class="prompt-body">'+escapeHtml(p.prompt)+'</div>';
    html += '  <div style="display:flex;gap:6px;margin-top:8px">';
    html += '    <button class="btn bp bs" data-mp-copy="'+id+'">📋 Copiar</button>';
    html += '    <button class="btn bo bs" data-mp-toggle="'+id+'">👁 Ver prompt</button>';
    html += '  </div>';
    html += '</div>';
  });

  container.innerHTML = html;

  /* Wire eventos · delegation */
  container.querySelectorAll('[data-mp-toggle]').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.prompt-card');
      card.classList.toggle('open');
      btn.textContent = card.classList.contains('open') ? '🙈 Ocultar' : '👁 Ver prompt';
    });
  });
  container.querySelectorAll('[data-mp-copy]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-mp-copy');
      const card = container.querySelector('[data-mod-id="'+id+'"]');
      const body = card.querySelector('.prompt-body');
      const text = body.textContent;
      navigator.clipboard.writeText(text).then(() => {
        const orig = btn.textContent;
        btn.textContent = '✅ Copiado';
        setTimeout(() => btn.textContent = orig, 1500);
      });
    });
  });
};

function escapeHtml(s){
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── Construye el selector de módulos · auto-llamado al cargar ── */
window.buildModuleSelector = function(){
  const sel = document.getElementById('modSelect');
  if (!sel) return;
  sel.innerHTML = '';
  Object.keys(MODULES).forEach(code => {
    const opt = document.createElement('option');
    opt.value = code;
    opt.textContent = code + ' · ' + MODULES[code].name;
    sel.appendChild(opt);
  });
  sel.addEventListener('change', () => window.renderModulePrompts(sel.value));
};

/* ── Auto-init cuando el DOM esté listo ── */
function init(){
  if (document.getElementById('modSelect') && !document.querySelector('#modSelect option')) {
    window.buildModuleSelector();
    window.renderModulePrompts();
  }
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})();
