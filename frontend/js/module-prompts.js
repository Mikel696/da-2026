/* ═══════════════════════════════════════════════════════════════════════
   DA-2026 · 8-PRO · MODULE PROMPTS LIBRARY (Fase D · token-saving rewrite)
   ─────────────────────────────────────────────────────────────────────
   48 prompts (16 modules × 3) · compact English · ~500 chars each.
   Each prompt instructs Claude to:
   - READ PROMPT_RUNS.md before starting (grep for ID)
   - APPEND an entry to PROMPT_RUNS.md after finishing
   This makes repeated runs cumulative, not redundant.
   ─────────────────────────────────────────────────────────────────────
   Rewritten: 2026-05-15
   ═══════════════════════════════════════════════════════════════════════ */

(function(){
'use strict';

/* ── Module metadata (compact · matches CO_MODULE in prompts.html) ── */
const MODULES = {
  '1-IND':  { name:'Dashboard · Mission Control', files:'index.html (inline JS)', keys:'sb_tasks · sb_ws_hist · sb_name · sb_streak · sb_start · sb_last · sb_hours · sb_pomo_* (DYN)', notes:'Hub · links to 16 modules · quick tasks · workshop history · global streak.' },
  '2-APP':  { name:'Application Command Center', files:'apply.html + css/apply.css', keys:'(no persistent state · 5 sub-sections: ATS/CV/Cover/Interview/Prompts)', notes:'html2pdf integrated.' },
  '3-ENG':  { name:'English Academy + Interview Dojo', files:'english.html + css/english.css + js/eng.js + js/english.js + js/srs.js + data/english-data.json + data/english-dojo.json', keys:'e4 · eng_notes · eng_srs_deck · dojo_stats', notes:'20 grammar rules · 130+ vocab · SRS Leitner · Dojo (TTS+STT).' },
  '4-RUT':  { name:'Data Analyst Path + Excel Tech Test', files:'ruta.html + css/ruta.css + js/ruta.js + data/ruta-data.json', keys:'ruta5 · ruta_log5 · ruta_st · excel_dojo', notes:'5-phase roadmap · AI roleplay · Excel split-panel + drills.' },
  '5-JOB':  { name:'Job Tracker · Kanban', files:'jobs.html + css/jobs.css + js/jobs.js', keys:'jt8 · jt_profile · jt_form_expanded · jt_s8 (registered Fase 3)', notes:'Trilingual ES/PT/EN · kanban DnD · master-detail · analytics · profile-based filtering.' },
  '6-TOO':  { name:'Tools & Advantages', files:'tools.html (inline CSS)', keys:'(no storage · static directory)', notes:'Tools directory + hacks + certifications.' },
  '7-NEW':  { name:'Data & AI News', files:'news.html (inline CSS) + js/news.js', keys:'news_saved · news_cache (SKIPPED)', notes:'Live RSS · 5 sources · saved articles persisted.' },
  '8-PRO':  { name:'Prompt Lab (this module)', files:'prompts.html (inline) + js/module-prompts.js', keys:'sb_prompts · plab_h', notes:'6 tabs (Claude Optimize · Optimize · Módulos · Library · Master · History) · CO v2026-05-15.B.' },
  '9-GOA':  { name:'Goals & Habits', files:'goals.html + css/goals.css + js/goals.js', keys:'sb_goals · sb_habits · sb_reviews · sb_ratings', notes:'30/60/90 goals · weekly habit tracker · per-habit streak.' },
  '10-SYS': { name:'Systems Engineering CUN (8th · 26V02)', files:'systems.html + systems_logic.js', keys:'sys_tasks (TIER1) · sys_class_sessions (TIER1) · sys_notebook · sys_notebook_meta · sys_active_custom · sim_interview_chks', notes:'5 VERIFIED subjects (SEED_VERSION=5) · 8 tabs · Tab 7 (Missed Classes · Direct-Fetch Protocol v2 via Chrome MCP + injectClassSession) · rich-text NB.fmt + NB.insertLabel.' },
  '11-ACC': { name:'Accounting Associate', files:'accounting.html + css/accounting.css + js/accounting.js + data/accounting-data.json', keys:'sb_accounting', notes:'6 tabs · career path · drills · IFRS/GAAP dict · resources with inline --rc accent.' },
  '12-FIN': { name:'Personal Finance', files:'finance.html + css/finance.css + js/finance.js', keys:'fin_* (DYNAMIC_PREFIX: fin_YYYY-MM, fin_sav_goal, etc.)', notes:'4 KPIs · monthly nav · 5 tabs.' },
  '13-NOT': { name:'Notes · Journal · SRS Leitner', files:'notes.html + css/notes.css + js/notes-nb.js + js/srs.js + js/nb-shared.js', keys:'sb_notes2 · not_nb_meta · not_nb_data (attachments in IDB local + Supabase Storage)', notes:'Notebooks · rich-text · cross-device attachments via nb-shared.js (cloud upload/download fallback IDB→Cloud).' },
  '14-WORK':{ name:'Simetrik Copilot · 13 tabs · MOIF', files:'work.html + css/work.css + js/work.js + js/nb-shared.js', keys:'work_cases · work_errors · work_learnings · work_kb · work_nb_meta · work_nb_data · work_eco_workflow · work_eco_course · work_eco_dict · work_kb_atts · work_moif_meetings · work_eco_dict_seed_v (local-only)', notes:'Cyan #06b6d4 preserved as Simetrik identity · 13 tabs · MOIF=Monitoreo Observabilidad Integraciones Ficohsa · attachments via Supabase Storage · smartSync + realtime postgres_changes.' },
  '15-MM':  { name:'Mind Map Studio (jsMind + Free Canvas)', files:'mindmap.html + css/mindmap.css + js/mindmap.js (+ jsmind CDN)', keys:'tools_mindmaps (jsMind node_tree) · tools_canvases (Miro-style)', notes:'Violet --vi local override · cross-module attach to 10-SYS/13-NOT/14-WORK via NBShared.storeImageWithThumbnail (3-tier IDB+payload).' },
  '16-APA': { name:'APA Document Studio', files:'apa.html + css/apa.css + js/apa.js', keys:'tools_apa_docs · apa_defaults', notes:'Cyan #06b6d4 academic identity · two-pane editor · subject picker from 10-SYS · exports PDF/Word/Excel.' }
};

/* ── Compact base block included in every prompt ── */
function base(code, m, promptId) {
  return `Module ${code} · ${m.name}
Files: ${m.files}
Keys: ${m.keys}
Notes: ${m.notes}

PRIOR RUNS: grep PROMPT_RUNS.md for "ID:${promptId}" before starting. Read what was done. EXTEND or take a NEW angle — never repeat.
PRE-READ: CEREBRO_STATE.md (last entry of ${code}) + CLAUDE.md (architecture + rules).
STACK: Vanilla JS · IIFE · localStorage→render()→DOM · Supabase JSONB sync via cloud-sync.js (SYNC_REGISTRY + DYNAMIC_PREFIXES) · Design System v1.0 (design-tokens.css + components.css).`;
}

/* ── Common tail · logging instruction ── */
function tail(code, promptId) {
  return `LOG: append to PROMPT_RUNS.md:
  ### ID:${promptId} · YYYY-MM-DD
  - Commit: <hash>
  - Files: <list>
  - Changed: <1-2 lines>
  - Next: <what to try next time · what to skip>
COMMIT: feat/fix(${code}): <imperative description> → push origin main.
UPDATE: CEREBRO_STATE.md with the changes.`;
}

/* ── Build prompts ── */
const MODULE_PROMPTS = {};

Object.keys(MODULES).forEach(code => {
  const m = MODULES[code];
  const idBase = code; // promptId becomes "{code}.P1" etc.

  MODULE_PROMPTS[code] = [
    /* ═══ P1 · IMPROVE / OPTIMIZE / UPDATE ═══ */
    {
      kind: 'optimize',
      icon: '⚡',
      title: `${code} · Improve · Optimize · Update`,
      desc: `Iteración productiva sobre ${m.name}: features, performance, UX polish sin romper lo que funciona.`,
      prompt: `${base(code, m, `${idBase}.P1`)}

TASK: [describe the improvement — e.g. "add feature X", "redesign panel Y", "improve performance of Z", "polish UX of flow A"]

PROTOCOL:
1. Plan-first: 3-5 bullets · files · ~lines · risk · verification.
2. Grep -n → Read offset/limit. No full-file reads.
3. Surgical Edit > Write. Preserve IIFE namespace + DS v1.0 tokens + focus-visible + WCAG AA.
4. New persisted key → add to SYNC_REGISTRY in cloud-sync.js (or DYNAMIC_PREFIXES if applicable). Realtime cross-device → verify postgres_changes propagates.
5. If multi-step (3+) → use TodoWrite.

${tail(code, `${idBase}.P1`)}`
    },

    /* ═══ P2 · AUDIT · BUGS · UPDATES ═══ */
    {
      kind: 'audit',
      icon: '🔬',
      title: `${code} · Audit · Bugs · Updates`,
      desc: `Scan read-only de ${m.name}: bugs, regressions, deuda técnica, gaps de sync, oportunidades.`,
      prompt: `${base(code, m, `${idBase}.P2`)}

TASK: READ-ONLY audit of ${code}. Do NOT modify files until approved.

CHECKLIST (cap report ~250 lines):
1. Code health · stale getElementById · addEventListener without null-check · JSON.parse without try/catch · race conditions.
2. Sync · every setItem('X') has X in SYNC_REGISTRY or covered by DYNAMIC_PREFIXES · no double-prefix typos · critical deletes call pushNow.
3. DS v1.0 · hex hardcoded · undefined var(--token) · focus-visible · WCAG contrast · transitions specific (not 'all').
4. UX · empty states · loading skeletons · mobile <768px touch targets ≥44px · no horizontal overflow.
5. Data · XSS via _esc() before innerHTML · data/*.json schema matches code · localStorage budget <1MB/key.
6. CEREBRO_STATE.md alignment · documented matches actual.

OUTPUT: [SEVERITY] [file:line] — issue + 1-line fix.
SEVERITY: 🔴 Critical · 🟡 Medium · 🟢 Minor · 🔵 Nice-to-have.
Delegate deep scan to sub-agent Explore if context is heavy.
End: top-3 fixes + ask "apply now?"

${tail(code, `${idBase}.P2`)}`
    },

    /* ═══ P3 · CREATIVE · SECOND BRAIN (Modelo.md) ═══ */
    {
      kind: 'creative',
      icon: '🧠',
      title: `${code} · Creative · Second Brain (Modelo.md)`,
      desc: `Aplicá una técnica de Modelo.md (Karpathy · Web Clipper · JSON Canvas · CLI Skills · Local-first) al módulo ${code}.`,
      prompt: `${base(code, m, `${idBase}.P3`)}

INPUT · Modelo.md techniques (Obsidian Second Brain):
A) KARPATHY · AI agent auto-organizes raw data → wiki/concepts/entities/sources with bidirectional links.
B) WEB CLIPPER · one-click capture of external info with structured metadata.
C) JSON CANVAS · skill generates visual knowledge-graph from structured data.
D) CLI / SKILLS · module exposes reusable helpers (window.MOD.xxx) callable by external AI agents.
E) LOCAL-FIRST · everything works offline · plugins extend · zero lock-in.

TASK · CREATIVE (2 phases):

PHASE 1 · BRAINSTORM (no code, just concepts):
- 5 distinct "second brain" ideas for ${code} (no variations of the same one).
- For each: technique used (A/B/C/D/E) · user value (1 line) · effort (S/M/L).
- Wait for user to pick ONE.

PHASE 2 · BLUEPRINT (only after user picks):
- Architectural diff (files · keys · sync changes).
- Data schema (if new storage).
- UI mock (text · controls · microinteractions).
- Critical-flow pseudo-code.
- Risks · trade-offs · how it fits without breaking existing.
- Wait for green light before coding.

INSPIRATION (do NOT copy literal):
- 10-SYS: Karpathy on class transcripts → auto wiki concepts/tools/tasks.
- 13-NOT: JSON Canvas of inter-notebook knowledge graph.
- 5-JOB: Web Clipper of LinkedIn/Indeed listings → enriched jt8 entries.
- 12-FIN: Local-first AI suggesting personal categorization rules.
- 14-WORK: CLI exposing work.cases.create/link/relate to external agents.
- 3-ENG: Canvas auto-mapping vocab by domain + grammar interconnections.
- 1-IND: Global Cerebro canvas · 16 modules as knowledge graph.

CONSTRAINTS: Vanilla JS · local-first (Supabase=decoration not dependency) · privacy (no external APIs without explicit consent) · reuse DS v1.0 · reuse existing patterns.

${tail(code, `${idBase}.P3`)}`
    }
  ];
});

/* ═══════════════════════════════════════════════════════════════════════
   PROJECT-WIDE PROMPTS · 3 prompts for the WHOLE Cerebro
   Same triad as the module prompts (improve / audit / creative) but
   whole-project scope: the 16 modules as ONE system + shared infra.
   ═══════════════════════════════════════════════════════════════════════ */
const PROJECT_META = {
  name: 'PROYECTO COMPLETO · DA-2026 Cerebro',
  files: '16 módulos + infra compartida: cloud-sync.js · nb-shared.js · nb-engine.js · design-tokens.css · components.css · auth chain',
  keys: 'SYNC_REGISTRY + DYNAMIC_PREFIXES (cloud-sync.js) · TIER1 dedicated tables · IndexedDB da2026_nb · Supabase Storage bucket attachments',
  notes: 'Vista whole-project: los 16 módulos como UN sistema interconectado. Estos 3 prompts operan cross-cutting — no sobre un módulo aislado.'
};

const PROJECT_BASE = `DA-2026 "Cerebro" · WHOLE-PROJECT scope (16 modules + shared infra).
REPO: E:\\\\Aplicaciones\\\\ANALISIS DE DATOS\\\\Pagina Web\\\\HTML\\\\da-2026
LIVE: https://mikel696.github.io/da-2026/frontend/

PRE-READ (mandatory): CEREBRO_STATE.md (FULL · all-module status matrix + last entries) + CLAUDE.md (architecture + strict rules) + MEMORY.md (user prefs).
SHARED INFRA: cloud-sync.js (SYNC_REGISTRY + DYNAMIC_PREFIXES + smartSync + realtime postgres_changes) · nb-shared.js + nb-engine.js (notebook standard + cross-module transfer) · design-tokens.css + components.css (Design System v1.0) · auth chain (4 scripts on EVERY .html).
16 MODULES: 1-IND 2-APP 3-ENG 4-RUT 5-JOB 6-TOO 7-NEW 8-PRO 9-GOA 10-SYS 11-ACC 12-FIN 13-NOT 14-WORK 15-MM 16-APA.
STACK: Vanilla JS · IIFE · localStorage→render()→DOM · Supabase JSONB · no frameworks · no build step.`;

function projectTail(pid) {
  return `LOG: append to PROMPT_RUNS.md (section "Library Prompts"):
  ### ID:${pid} · YYYY-MM-DD
  - Commit: <hash or - if read-only>
  - Scope: <which modules / infra touched>
  - Changed: <1-2 lines>
  - Next: <what to extend next run · what to skip>
COMMIT: feat/fix(<lead-code>): <imperative description> → push origin main.
UPDATE: CEREBRO_STATE.md (status of ALL affected modules, not just one).`;
}

MODULE_PROMPTS['PROJECT'] = [
  /* ═══ PROJECT.P1 · IMPROVE / OPTIMIZE / UPDATE — whole project ═══ */
  {
    kind: 'optimize',
    icon: '⚡',
    title: 'PROYECTO · Improve · Optimize · Update',
    desc: 'Mejora cross-cutting de TODO el Cerebro: elige el trabajo de mayor leverage para el sistema completo, no un módulo aislado.',
    prompt: `${PROJECT_BASE}

PRIOR RUNS: grep PROMPT_RUNS.md for "ID:PROJECT.P1" — read prior runs. EXTEND or take a NEW angle, never repeat.

TASK: cross-cutting improvement of the whole Cerebro.
[describe a goal · OR leave blank → you choose the highest-leverage item]

PROTOCOL:
1. Read the CEREBRO_STATE.md status matrix + pending list.
2. List the TOP-3 highest-LEVERAGE opportunities — work that affects multiple modules, shared infra, or system-wide consistency (not a single-module tweak).
3. Rank by impact ÷ effort · propose · wait for green light.
4. Execute ONE. Surgical edits. Preserve Design System v1.0, IIFE pattern, auth chain.
5. If it touches shared infra (cloud-sync / nb-shared / nb-engine / design-tokens / components) → verify EVERY dependent module still works.
6. New persistent key → add to SYNC_REGISTRY.

RULES: no frameworks · Grep -n → Read offset/limit (no full-file reads) · Edit > Write · TodoWrite if 3+ steps · delegate broad research to an Explore sub-agent.

${projectTail('PROJECT.P1')}`
  },

  /* ═══ PROJECT.P2 · AUDIT / BUGS / HEALTH — whole project ═══ */
  {
    kind: 'audit',
    icon: '🔬',
    title: 'PROYECTO · Audit · Bugs · Health',
    desc: 'Auditoría read-only system-wide: los 16 módulos + infra compartida. Delega a sub-agent Explore. Reporte por severidad.',
    prompt: `${PROJECT_BASE}

PRIOR RUNS: grep PROMPT_RUNS.md for "ID:PROJECT.P2" — skip already-fixed issues, compare vs last audit.

TASK: READ-ONLY system-wide health audit. Do NOT modify until approved.
Delegate the deep scan to an Explore sub-agent (cover all 16 modules + shared infra · cap report ~350 lines).

CHECK across the whole project:
1. JS health · undefined refs · stale getElementById · addEventListener without null-check · JSON.parse without try/catch · race conditions.
2. Sync · every persistent key in SYNC_REGISTRY or DYNAMIC_PREFIXES · no double-prefix typos · critical deletes call pushNow · realtime propagation.
3. Design System v1.0 drift · hex hardcoded · undefined var(--token) · focus-visible · WCAG AA contrast · transitions specific (not 'all').
4. Cross-module inconsistency · same component styled differently · logic duplicated that should live in shared infra.
5. Dead code · orphan files · stale CEREBRO_STATE entries vs actual code · legacy pages/*.
6. Shared infra integrity · auth chain on every HTML · nb-engine standard respected · cloud-sync registry complete.

OUTPUT: [SEVERITY] [file:line] — issue + 1-line fix. 🔴 Critical · 🟡 Medium · 🟢 Minor · 🔵 Nice-to-have.
End: table by severity × module · TOP-5 fixes ranked by impact · ask "apply now? which first?".

${projectTail('PROJECT.P2')}`
  },

  /* ═══ PROJECT.P3 · CREATIVE / SECOND BRAIN — whole project ═══ */
  {
    kind: 'creative',
    icon: '🧠',
    title: 'PROYECTO · Creative · Second Brain (sistema)',
    desc: 'Aplica Modelo.md a NIVEL SISTEMA: los 16 módulos como UN cerebro interconectado, no 16 silos.',
    prompt: `${PROJECT_BASE}

PRIOR RUNS: grep PROMPT_RUNS.md for "ID:PROJECT.P3" — read prior system-level designs, take a new angle.

INPUT · Modelo.md (Obsidian Second Brain) at SYSTEM level — the 16 modules as ONE interconnected brain, not 16 silos.
Techniques: A) Karpathy auto-organize · B) Web Clipper capture · C) JSON Canvas knowledge-graph · D) CLI/Skills · E) Local-first/Plugins.

TASK · CREATIVE (2 phases):

PHASE 1 · BRAINSTORM (no code, just concepts):
- 5 distinct SYSTEM-LEVEL ideas (cross-module · not a single-module feature). Examples to spark — do NOT copy literal:
  · global knowledge graph linking notes/cases/tasks/goals across all 16 modules
  · universal capture inbox that routes a dropped item to the right module
  · cross-module search (one bar searches everything)
  · the Cerebro as a navigable Obsidian-style vault
  · a global "Hoy" view aggregating today's items from every module
- For each: technique (A-E) · user value (1 line) · effort (S/M/L).
- Wait for the user to pick ONE.

PHASE 2 · BLUEPRINT (only after pick):
- Architecture diff · which modules touched · new shared infra needed · data schema.
- UI mock (text · controls · microinteractions).
- Critical-flow pseudo-code · risks · how it fits without breaking the 16 modules.
- Wait for green light before coding.

CONSTRAINTS: reuse shared infra (nb-engine · cloud-sync · design-tokens) · local-first (Supabase = decoration) · privacy (no external APIs without consent) · don't fragment the system · Vanilla JS.

${projectTail('PROJECT.P3')}`
  }
];

/* ── Expose to window ── */
window.MODULE_PROMPTS = MODULE_PROMPTS;
window.MODULE_PROMPTS_META = Object.assign({ PROJECT: PROJECT_META }, MODULES);

/* ── Renderer ── */
window.renderModulePrompts = function(selectedCode){
  const container = document.getElementById('modContent');
  if (!container) return;
  const code = selectedCode || 'PROJECT';
  const m = (code === 'PROJECT') ? PROJECT_META : MODULES[code];
  const prompts = MODULE_PROMPTS[code] || [];
  if (!m) return;

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
    html += '    <button class="btn bp bs" data-mp-copy="'+id+'">📋 Copy</button>';
    html += '    <button class="btn bo bs" data-mp-toggle="'+id+'">👁 View prompt</button>';
    html += '  </div>';
    html += '</div>';
  });

  container.innerHTML = html;

  container.querySelectorAll('[data-mp-toggle]').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.prompt-card');
      card.classList.toggle('open');
      btn.textContent = card.classList.contains('open') ? '🙈 Hide' : '👁 View prompt';
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
        btn.textContent = '✅ Copied';
        setTimeout(() => btn.textContent = orig, 1500);
      });
    });
  });
};

function escapeHtml(s){
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

window.buildModuleSelector = function(){
  const sel = document.getElementById('modSelect');
  if (!sel) return;
  sel.innerHTML = '';
  /* PROYECTO COMPLETO first — whole-project prompts */
  const pOpt = document.createElement('option');
  pOpt.value = 'PROJECT';
  pOpt.textContent = '🌐 PROYECTO COMPLETO · 16 módulos como un sistema';
  sel.appendChild(pOpt);
  const divider = document.createElement('option');
  divider.disabled = true;
  divider.textContent = '──────── módulos individuales ────────';
  sel.appendChild(divider);
  Object.keys(MODULES).forEach(code => {
    const opt = document.createElement('option');
    opt.value = code;
    opt.textContent = code + ' · ' + MODULES[code].name;
    sel.appendChild(opt);
  });
  sel.addEventListener('change', () => window.renderModulePrompts(sel.value));
};

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
