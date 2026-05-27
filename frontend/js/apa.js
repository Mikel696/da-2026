/* ═══════════════════════════════════════════════════════════════
   DA-2026 · 16-APA · Document Studio (v2)
   ─────────────────────────────────────────────────────────────
   Two-pane editor: form (header + dynamic sections) + live APA
   preview. Each document has a `sections[]` array — user picks
   from 11 section types and reorders freely with ↑↓.
   Exports: PDF (html2pdf), Word .docx (html-docx-js), Excel
   .xlsx (SheetJS — sheet per section).
═══════════════════════════════════════════════════════════════ */

const APA = (function(){
  'use strict';

  const KEY = 'tools_apa_docs';
  // Per-user defaults for new docs. When the user types into these
  // fields, the values are saved here and auto-fill into the next doc.
  // Synced via SYNC_REGISTRY so all the user's PCs share defaults.
  const DEFAULTS_KEY = 'apa_defaults';
  let _docs = [];
  let _activeId = null;
  let _saveTimer = null;
  let _filling = false; // guard: when true, snapshot() must not write back

  // 10-SYS subjects · sincronizadas con SUBJECTS array de systems_logic.js
  // Cambios: añadir nueva materia acá Y en systems_logic.js (single source of truth visual).
  const SUBJECTS = [
    // ── Bloque I (Mar 30 - May 24) ──
    { id: 'ing_web',            code: 'DIS34',   group: '52211', name: 'Ingeniería Web',                       professor: 'BECERRA RAMIREZ HEYNER LEONEL' },
    { id: 'mat_especiales',     code: 'DIS31',   group: '52247', name: 'Matemáticas Especiales',               professor: 'Juan Sebastián Cortés Cruz'   },
    { id: 'inv_ciencia',        code: 'DIS36',   group: '52218', name: 'Investigación Ciencia y Tecnología',   professor: 'CORTES TOBAR DARIO FERNANDO'  },
    // ── Bloque II (May 25 - Jul 19) ──
    { id: 'admin_bd',           code: 'DIS-BD',  group: '52291', name: 'Administración de Bases de Datos',     professor: 'Sergio Alexander Mora Novoa'  },
    { id: 'calidad_sw',         code: 'DIS-CSW', group: '52278', name: 'Calidad del Software',                 professor: 'Alexander Calderón Martínez'  },
    { id: 'redes_inalambricas', code: 'DIS-RWL', group: '',      name: 'Redes Inalámbricas',                   professor: ''                            },
    // ── Continuas / Idiomas ──
    { id: 'english_beginner',   code: 'A1I01',   group: '50608', name: 'Virtual English Beginner 1',           professor: 'CINDY PAOLA MORENO'           },
    { id: 'placement_test',     code: 'CE1026',  group: '5TB01', name: 'Placement Test BE Plus',               professor: ''                            },
    { id: 'other',              code: '',        group: '',      name: '— Otra (escribir manualmente) —',      professor: ''                            },
  ];

  // Section types — `mode` controls APA preview rendering style and
  // `ownPage` indicates the section gets its own page (cover, abstract,
  // references, appendix per APA 7).
  const SECTION_TYPES = {
    abstract:       { label: '📋 Resumen / Abstract',     heading: 'Resumen',                mode: 'abstract',   ownPage: true  },
    introduction:   { label: '💡 Introducción',            heading: 'Introducción',           mode: 'normal',     ownPage: false },
    background:     { label: '📚 Marco teórico',           heading: 'Marco Teórico',          mode: 'normal',     ownPage: false },
    methodology:    { label: '🔬 Metodología',             heading: 'Metodología',            mode: 'normal',     ownPage: false },
    body:           { label: '📄 Desarrollo / Cuerpo',     heading: '',                       mode: 'normal',     ownPage: false },
    results:        { label: '📊 Resultados',              heading: 'Resultados',             mode: 'normal',     ownPage: false },
    discussion:     { label: '💬 Discusión',               heading: 'Discusión',              mode: 'normal',     ownPage: false },
    conclusion:     { label: '🎯 Conclusiones',            heading: 'Conclusiones',           mode: 'normal',     ownPage: false },
    recommendation: { label: '✅ Recomendaciones',         heading: 'Recomendaciones',        mode: 'normal',     ownPage: false },
    citation:       { label: '📝 Citas / Notas al pie',    heading: 'Citas y Notas',          mode: 'references', ownPage: true  },
    references:     { label: '📚 Referencias',             heading: 'Referencias',            mode: 'references', ownPage: true  },
    appendix:       { label: '📎 Anexos',                  heading: 'Anexos',                 mode: 'normal',     ownPage: true  },
    custom:         { label: '✏️ Personalizado',           heading: '',                       mode: 'normal',     ownPage: false },
  };

  /* ── Storage ─────────────────────────────────────────────── */
  function load(){
    try { _docs = JSON.parse(localStorage.getItem(KEY)||'[]'); }
    catch { _docs = []; }
    // Migrate legacy {abstract, body, references, appendix} → sections[]
    _docs.forEach(migrateDoc);
  }
  function persist(){
    try { localStorage.setItem(KEY, JSON.stringify(_docs)); }
    catch(e){
      if (e && (e.name==='QuotaExceededError'||/quota/i.test(e.message||''))) {
        alert('💾 Almacenamiento lleno. Eliminá documentos viejos antes de seguir.');
      } else throw e;
    }
  }
  function getActive(){ return _docs.find(d => d.id === _activeId) || null; }
  function loadDefaults(){
    try { return JSON.parse(localStorage.getItem(DEFAULTS_KEY) || '{}'); } catch { return {}; }
  }
  function saveDefaults(obj){
    try { localStorage.setItem(DEFAULTS_KEY, JSON.stringify(obj)); } catch {}
  }
  function esc(s){ const d=document.createElement('div'); d.textContent=s==null?'':s; return d.innerHTML; }
  function escAttr(s){ return String(s||'').replace(/"/g,'&quot;').replace(/&/g,'&amp;'); }
  function fmtDate(iso){ if (!iso) return ''; return new Date(iso).toLocaleDateString('es',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}); }
  function fmtAPADate(iso){
    if (!iso) return '';
    try {
      const d = new Date(iso + (iso.length===10?'T00:00:00':''));
      const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
      return d.getDate() + ' de ' + meses[d.getMonth()] + ' de ' + d.getFullYear();
    } catch { return iso; }
  }
  function showStatus(msg){
    const el = document.getElementById('apaStatus'); if (!el) return;
    el.textContent = msg; el.classList.add('on');
    clearTimeout(el._t); el._t = setTimeout(()=>el.classList.remove('on'), 1800);
  }
  function newSecId(){ return 's_' + Date.now() + Math.random().toString(36).slice(2,6); }

  /* ── Migration: legacy fields → sections[] + subjectId rename + rawContent ─── */
  const SUBJ_ID_RENAMES = { english_b1: 'english_beginner' };
  function migrateDoc(d){
    // Subject ID renames (forward compat)
    if (d.subjectId && SUBJ_ID_RENAMES[d.subjectId]) d.subjectId = SUBJ_ID_RENAMES[d.subjectId];
    if (!Array.isArray(d.sections)) {
      d.sections = [];
      if (d.abstract && d.abstract.trim()) d.sections.push({ id: newSecId(), type: 'abstract', title: '', content: d.abstract });
      if (d.body && d.body.trim())         d.sections.push({ id: newSecId(), type: 'body', title: '', content: d.body });
      if (d.references && d.references.trim()) d.sections.push({ id: newSecId(), type: 'references', title: '', content: d.references });
      if (d.appendix && d.appendix.trim()) d.sections.push({ id: newSecId(), type: 'appendix', title: '', content: d.appendix });
    }
    // NEW: rawContent es el texto crudo que el usuario edita en el textarea.
    // Si no existe, lo generamos desde sections para preservar contenido viejo.
    if (typeof d.rawContent !== 'string') {
      d.rawContent = sectionsToRaw(d.sections);
    }
    return d;
  }

  /** Convierte sections[] → texto crudo con encabezados (round-trippable). */
  function sectionsToRaw(sections){
    if (!sections || !sections.length) return '';
    return sections.map(s => {
      const tp = SECTION_TYPES[s.type] || SECTION_TYPES.custom;
      const head = (s.type === 'custom' && s.title) ? s.title : tp.heading;
      const lines = [];
      if (head) lines.push(head);
      if (s.content) lines.push(s.content);
      return lines.join('\n');
    }).filter(Boolean).join('\n\n');
  }

  /* ── Default doc ─────────────────────────────────────────── */
  function emptyDoc(){
    const today = new Date().toISOString().slice(0,10);
    const def = loadDefaults();
    const studentName = def.student
      || (typeof localStorage !== 'undefined' && localStorage.getItem('sb_name'))
      || '';
    return {
      id: 'apa_' + Date.now(),
      title: 'Nuevo documento',
      kind: 'academic',
      subjectId: 'ing_web',
      subjectName: '',
      institution: def.institution || 'Corporación Unificada Nacional · CUN',
      program: def.program || 'Ingeniería de Sistemas',
      professor: def.professor || '',
      student: studentName,
      date: today,
      subtitle: '',
      sections: [
        { id: newSecId(), type: 'abstract', title: '', content: '' },
        { id: newSecId(), type: 'introduction', title: '', content: '' },
        { id: newSecId(), type: 'body', title: '', content: '' },
        { id: newSecId(), type: 'conclusion', title: '', content: '' },
        { id: newSecId(), type: 'references', title: '', content: '' },
      ],
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    };
  }

  /* ── Merge overrides desde 10-SYS · sys_subjects_custom ──────
   *  Si el usuario editó una materia en el módulo 10-SYS (ej: añadir
   *  profesor a Redes Inalámbricas), esos cambios viven en
   *  localStorage.sys_subjects_custom. Acá los mezclamos sobre los
   *  defaults hardcoded para que APA refleje siempre lo último. */
  function getSubjectsMerged(){
    let custom = [];
    try { custom = JSON.parse(localStorage.getItem('sys_subjects_custom') || '[]'); }
    catch { custom = []; }
    const overMap = Object.fromEntries(custom.map(c => [c.id, c]));
    return SUBJECTS.map(s => {
      const o = overMap[s.id];
      if (!o) return s;
      return {
        ...s,
        // Preserve original code/name when override no las tiene
        code:      o.code      || s.code,
        group:     o.group     || s.group,
        name:      o.name      || s.name,
        professor: o.professor || s.professor,
      };
    });
  }

  /* ── Subject dropdown ───────────────────────────────────── */
  function buildSubjectDropdown(){
    const sel = document.getElementById('apaSubject'); if (!sel) return;
    const subs = getSubjectsMerged();
    sel.innerHTML = subs.map(s =>
      `<option value="${s.id}">${s.code ? s.code + ' · ' : ''}${s.name}</option>`
    ).join('');
    sel.addEventListener('change', () => {
      if (_filling) return;
      const all = getSubjectsMerged();
      const subject = all.find(s => s.id === sel.value);
      const profEl = document.getElementById('apaProfessor');
      if (subject && profEl) {
        const cur = (profEl.value || '').trim();
        const fromCatalog = all.some(s => s.professor && s.professor === cur);
        // FIX bug: actualizar siempre que el valor actual venga del catálogo
        // (otra materia) o esté vacío — incluso si la nueva materia tiene
        // profesor vacío (limpia el campo para que escribas el correcto).
        if (!cur || fromCatalog) {
          profEl.value = subject.professor || '';
          // Disparar el guardado del header
          profEl.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
      schedulePreview();
    });
  }

  function kindChanged(){
    const k = document.getElementById('apaKind').value;
    const grp = document.getElementById('apaKindAcademicGrp');
    if (grp) grp.style.display = (k === 'academic') ? '' : 'none';
    if (!_filling) schedulePreview();
  }

  /* ── CRUD ───────────────────────────────────────────────── */
  function create(){
    const doc = emptyDoc();
    _docs.push(doc);
    persist();
    open(doc.id);
    renderList();
    showStatus('✨ Nuevo documento');
  }

  function remove(id){
    const d = _docs.find(x => x.id === id); if (!d) return;
    if (!confirm(`¿Eliminar documento "${d.title}"?`)) return;
    _docs = _docs.filter(x => x.id !== id);
    persist();
    if (_activeId === id) { _activeId = null; clearForm(); }
    renderList();
  }

  function open(id){
    const d = _docs.find(x => x.id === id); if (!d) return;
    migrateDoc(d);
    _activeId = id;
    fillForm(d);
    renderList();
    renderSections();
    renderPreview();
  }

  function clearForm(){
    _filling = true;
    ['apaTitle','apaInstitution','apaProgram','apaProfessor','apaStudent','apaDate','apaSubtitle']
      .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    const ta = document.getElementById('apaContent'); if (ta) ta.value = '';
    const sec = document.getElementById('apaSections'); if (sec) sec.innerHTML = '';
    _filling = false;
    document.getElementById('apaPreview').innerHTML = '<div style="text-align:center;padding:60px 20px;color:var(--t3)">📍 Seleccioná un documento o creá uno nuevo.</div>';
  }

  function fillForm(d){
    _filling = true;
    document.getElementById('apaKind').value = d.kind || 'academic';
    document.getElementById('apaSubject').value = d.subjectId || 'ing_web';
    document.getElementById('apaTitle').value = d.title || '';
    document.getElementById('apaInstitution').value = d.institution || '';
    document.getElementById('apaProgram').value = d.program || '';
    document.getElementById('apaProfessor').value = d.professor || '';
    document.getElementById('apaStudent').value = d.student || '';
    document.getElementById('apaDate').value = d.date || '';
    document.getElementById('apaSubtitle').value = d.subtitle || '';
    const ta = document.getElementById('apaContent');
    if (ta) ta.value = d.rawContent || sectionsToRaw(d.sections);
    // Update kind-related visibility manually (no event side effects)
    const grp = document.getElementById('apaKindAcademicGrp');
    if (grp) grp.style.display = (d.kind === 'academic') ? '' : 'none';
    _filling = false;
  }

  /* ── Header snapshot (only for top form fields) ─────────── */
  function snapshotHeader(){
    if (_filling) return null;
    const d = getActive(); if (!d) return null;
    d.kind = document.getElementById('apaKind').value;
    d.subjectId = document.getElementById('apaSubject').value;
    const subj = getSubjectsMerged().find(s => s.id === d.subjectId);
    d.subjectName = subj ? (subj.code ? subj.code + ' · ' + subj.name : subj.name) : '';
    d.title = document.getElementById('apaTitle').value;
    d.institution = document.getElementById('apaInstitution').value;
    d.program = document.getElementById('apaProgram').value;
    d.professor = document.getElementById('apaProfessor').value;
    d.student = document.getElementById('apaStudent').value;
    d.date = document.getElementById('apaDate').value;
    d.subtitle = document.getElementById('apaSubtitle').value;
    d.updated = new Date().toISOString();
    // Persist these as user defaults so future docs auto-fill them.
    // Professor is per-subject so only saved if NOT a 10-SYS auto-filled value.
    if (d.institution || d.program || d.student) {
      const cur = loadDefaults();
      const next = {
        institution: d.institution || cur.institution || '',
        program:     d.program     || cur.program     || '',
        student:     d.student     || cur.student     || '',
        // Persist professor only when not part of the 10-SYS subject map
        professor:   (subj && subj.professor === d.professor) ? (cur.professor || '') : (d.professor || cur.professor || ''),
      };
      saveDefaults(next);
    }
    return d;
  }

  function save(){
    const d = snapshotHeader(); if (!d) { alert('Creá un documento primero.'); return; }
    persist();
    renderList();
    showStatus('💾 Guardado');
  }

  function schedulePreview(){
    snapshotHeader();
    clearTimeout(_saveTimer);
    _saveTimer = setTimeout(() => { persist(); renderList(); renderPreview(); }, 350);
  }

  /* ── SMART PASTE — analiza texto crudo y lo divide en secciones APA ── */
  // Mapa de palabras-clave → tipo de sección (case-insensitive, sin tildes/acentos)
  const HEADING_PATTERNS = [
    { type: 'abstract',       re: /^(resumen|abstract|sintesis|síntesis)\s*\.?\s*$/i },
    { type: 'introduction',   re: /^(introducci[oó]n|introduction)\s*\.?\s*$/i },
    { type: 'background',     re: /^(marco\s+te[oó]rico|background|antecedentes|estado\s+del\s+arte|marco\s+conceptual)\s*\.?\s*$/i },
    { type: 'methodology',    re: /^(metodolog[ií]a|methodology|m[eé]todo|materiales\s+y\s+m[eé]todos|dise[ñn]o\s+metodol[oó]gico)\s*\.?\s*$/i },
    { type: 'results',        re: /^(resultados|results|hallazgos|findings)\s*\.?\s*$/i },
    { type: 'discussion',     re: /^(discusi[oó]n|discussion|an[aá]lisis\s+de\s+resultados)\s*\.?\s*$/i },
    { type: 'conclusion',     re: /^(conclusiones?|conclusion[es]?)\s*\.?\s*$/i },
    { type: 'recommendation', re: /^(recomendaciones?|recommendations?)\s*\.?\s*$/i },
    { type: 'references',     re: /^(referencias|references|bibliograf[ií]a|bibliography)\s*\.?\s*$/i },
    { type: 'appendix',       re: /^(anexos?|appendix|appendices)\s*\.?\s*$/i },
  ];

  /** Detecta si una línea actúa como heading. Heurística:
   *  · longitud <= 80 chars
   *  · no termina en '.', ',', ':', ';' (a menos que sea solo un keyword)
   *  · matchea una palabra-clave APA, o es markdown (#/##/###),
   *    o es una línea solitaria en MAYÚSCULAS (estilo títulos).
   *  Devuelve { type, label } si es heading, null si no. */
  function detectHeading(line){
    const trimmed = line.trim();
    if (!trimmed || trimmed.length > 80) return null;
    // Markdown
    const md = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (md) {
      const text = md[2].replace(/[*_`]/g,'').trim();
      // Try to match a keyword inside markdown heading text
      for (const p of HEADING_PATTERNS) if (p.re.test(text)) return { type: p.type, label: text };
      return { type: 'custom', label: text };
    }
    // Keyword match (sin numeración previa)
    const cleaned = trimmed.replace(/^[0-9.\-)\s]+/, '').replace(/[*_]/g,'');
    for (const p of HEADING_PATTERNS) if (p.re.test(cleaned)) return { type: p.type, label: cleaned };
    // UPPER CASE solitario (heurística agresiva — solo si la línea entera está en mayúsculas y no termina en . o : sin más texto en la línea)
    if (trimmed.length >= 4 && trimmed.length <= 50 && trimmed === trimmed.toUpperCase() && /^[A-ZÁÉÍÓÚÑ\s]+$/.test(trimmed)) {
      // Verificar si el siguiente párrafo NO está en mayúsculas (sino sería un párrafo todo-caps por error)
      return { type: 'custom', label: trimmed.charAt(0) + trimmed.slice(1).toLowerCase() };
    }
    return null;
  }

  /** Toma texto crudo y devuelve un array de secciones APA. */
  function smartParse(text){
    if (!text || !text.trim()) return [];
    // Normalizar: \r\n → \n, colapsar 3+ saltos a 2
    const norm = text.replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    const lines = norm.split('\n');
    const sections = [];
    let current = { type: 'body', title: '', buf: [] };
    const push = () => {
      const content = current.buf.join('\n').trim();
      if (content || current.title) sections.push({ id: newSecId(), type: current.type, title: current.title, content });
    };
    for (let i = 0; i < lines.length; i++) {
      const head = detectHeading(lines[i]);
      if (head) {
        push();
        current = { type: head.type, title: head.type === 'custom' ? head.label : '', buf: [] };
      } else {
        current.buf.push(lines[i]);
      }
    }
    push();
    // Si no se detectó ninguna sección titulada y todo cayó en un solo "body",
    // dejamos eso como un único body. Si se detectó al menos una titulada,
    // mantenemos la estructura.
    return sections.filter(s => s.content || s.title);
  }

  /** APLICAR NORMAS APA · botón principal del flujo simple.
   *  Toma el texto del textarea, lo analiza con smartParse, y crea/actualiza
   *  las secciones APA. El preview entonces muestra el documento formateado
   *  correctamente (Times 12pt, doble espacio, márgenes 2.54cm, sangría 1.27cm,
   *  referencias con hanging indent, portada centrada).
   *  Si no detecta encabezados estructurados, crea una única sección "Cuerpo"
   *  con todo el contenido — el preview lo formatea igual con normas APA. */
  function applyApaNorms(){
    const d = getActive();
    if (!d) { alert('Creá un documento primero (botón "+ Nuevo" arriba).'); return; }
    const ta = document.getElementById('apaContent');
    if (!ta) return;
    const text = ta.value || '';
    if (!text.trim()) { alert('Pegá tu texto en el área de contenido primero.'); return; }
    d.rawContent = text;
    const parsed = smartParse(text);
    d.sections = parsed.length ? parsed : [{ id: newSecId(), type: 'body', title: '', content: text }];
    // Cualquier edición manual previa al preview se invalida (volvemos al render automático
    // con normas APA estrictas).
    d.useEditedHTML = false;
    d.updated = new Date().toISOString();
    persist();
    renderList();
    renderPreview();
    const n = d.sections.length;
    showStatus('✨ Normas APA aplicadas · ' + n + ' sección' + (n>1?'es':'') + ' detectada' + (n>1?'s':''));
  }

  /** Auto-save del textarea — guarda rawContent sin parsear (preserva texto literal). */
  function updateRawContent(){
    const d = getActive(); if (!d) return;
    const ta = document.getElementById('apaContent'); if (!ta) return;
    d.rawContent = ta.value;
    d.updated = new Date().toISOString();
    clearTimeout(_saveTimer);
    _saveTimer = setTimeout(() => { persist(); renderList(); }, 500);
  }

  /** Abre modal donde pegar texto crudo (LEGACY · ahora el flujo simple está en línea). */
  function openSmartPaste(){
    if (!getActive()) { alert('Creá un documento primero (botón "+ Nuevo" arriba a la izquierda).'); return; }
    let ov = document.getElementById('apaPasteOv');
    if (!ov) {
      ov = document.createElement('div');
      ov.id = 'apaPasteOv';
      ov.className = 'apa-pick-overlay';
      ov.innerHTML = `<div class="apa-pick-modal" style="max-width:780px" onclick="event.stopPropagation()">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
          <h3>📥 Pegar texto · APA Auto-formato</h3>
          <button class="btn bo bs" onclick="APA.closeSmartPaste()">✕</button>
        </div>
        <div style="font-size:11px;color:var(--t3);margin-bottom:8px;line-height:1.6">
          Pegá tu texto (essay, borrador, notas). El motor detecta automáticamente los <b>encabezados</b>
          (Resumen, Introducción, Metodología, Resultados, Conclusiones, Referencias, etc.) y crea las
          secciones APA en el orden correcto. Soporta <code>#</code> markdown y líneas en MAYÚSCULAS.
        </div>
        <textarea id="apaPasteTxt" class="inp" style="width:100%;min-height:280px;font-family:'IBM Plex Mono',monospace;font-size:11px;line-height:1.6;padding:10px" placeholder="Pegá acá. Ejemplo:&#10;&#10;Resumen&#10;Este trabajo analiza... (texto del resumen)&#10;&#10;Introducción&#10;En los últimos años...&#10;&#10;Metodología&#10;Se realizó un estudio cualitativo...&#10;&#10;Referencias&#10;Apellido, N. (Año). Título. Editorial.&#10;Otro autor (Año). Otro título."></textarea>
        <div style="display:flex;align-items:center;gap:10px;margin-top:10px;flex-wrap:wrap">
          <label style="font-size:11px;display:flex;align-items:center;gap:6px;color:var(--t2)">
            <input type="radio" name="apaPasteMode" id="apaPasteAppend" value="append" checked>
            Añadir al final (preserva secciones existentes) <span style="color:var(--t3)">— seguro</span>
          </label>
          <label style="font-size:11px;display:flex;align-items:center;gap:6px;color:var(--rd)">
            <input type="radio" name="apaPasteMode" id="apaPasteReplace" value="replace">
            Reemplazar todas las secciones existentes
          </label>
          <span style="flex:1"></span>
          <button class="btn bo" onclick="APA.previewSmartPaste()">👁 Previsualizar detección</button>
          <button class="btn bp" onclick="APA.applySmartPaste()">✨ Aplicar formato APA</button>
        </div>
        <div id="apaPastePreview" style="margin-top:10px;font-size:11px;color:var(--t2);max-height:200px;overflow-y:auto;background:var(--el);border:1px solid var(--bd);border-radius:6px;padding:10px;display:none"></div>
      </div>`;
      ov.addEventListener('click', e => { if (e.target === ov) closeSmartPaste(); });
      document.body.appendChild(ov);
    }
    document.getElementById('apaPasteTxt').value = '';
    document.getElementById('apaPastePreview').style.display = 'none';
    ov.classList.add('on');
  }

  function closeSmartPaste(){
    const ov = document.getElementById('apaPasteOv'); if (ov) ov.classList.remove('on');
  }

  function previewSmartPaste(){
    const txt = document.getElementById('apaPasteTxt').value;
    const secs = smartParse(txt);
    const out = document.getElementById('apaPastePreview');
    if (!secs.length) {
      out.style.display = 'block';
      out.innerHTML = '<i>No se detectaron secciones. El texto se agregará como un único bloque "Cuerpo".</i>';
      return;
    }
    out.style.display = 'block';
    out.innerHTML = '<b>Se detectaron ' + secs.length + ' sección' + (secs.length>1?'es':'') + ':</b><br>' +
      secs.map((s,i) => {
        const tp = SECTION_TYPES[s.type] || SECTION_TYPES.custom;
        const head = (s.type === 'custom' && s.title) ? s.title : tp.heading || tp.label.replace(/^[^\w]+\s/,'');
        const wc = (s.content || '').split(/\s+/).filter(Boolean).length;
        return `<div style="padding:4px 0;border-bottom:1px solid var(--bd)">${i+1}. <b>${esc(head)}</b> <span style="color:var(--t3)">· ${tp.label.split(' ')[0]} · ${wc} palabras</span></div>`;
      }).join('');
  }

  function applySmartPaste(){
    const d = getActive(); if (!d) return;
    const txt = document.getElementById('apaPasteTxt').value;
    const secs = smartParse(txt);
    if (!secs.length && !txt.trim()) { alert('Pegá texto primero.'); return; }
    const mode = document.querySelector('input[name="apaPasteMode"]:checked')?.value || 'append';
    // Si el parse no detectó nada, creamos un único body
    const newSections = secs.length ? secs : [{ id: newSecId(), type: 'body', title: '', content: txt.trim() }];
    if (mode === 'replace') {
      if (!confirm('¿Reemplazar TODAS las secciones existentes? Esta acción no se puede deshacer.')) return;
      d.sections = newSections;
    } else {
      d.sections = (d.sections || []).concat(newSections);
    }
    d.updated = new Date().toISOString();
    persist();
    renderSections();
    renderPreview();
    closeSmartPaste();
    showStatus('✨ ' + newSections.length + ' sección' + (newSections.length>1?'es':'') + ' importada' + (newSections.length>1?'s':'') + ' en formato APA');
  }

  /* ── Section CRUD ───────────────────────────────────────── */
  function openSectionPicker(){
    if (!getActive()) return alert('Creá un documento primero.');
    const grid = document.getElementById('apaPickGrid');
    grid.innerHTML = Object.entries(SECTION_TYPES).map(([k,v]) => {
      const parts = v.label.split(' ');
      const ico = parts.shift();
      return `<button class="apa-pick-btn" onclick="APA.addSection('${k}')">
        <span class="apa-pick-btn-ico">${ico}</span>
        <span>
          ${parts.join(' ')}
          <div class="apa-pick-btn-meta">${k}</div>
        </span>
      </button>`;
    }).join('');
    document.getElementById('apaPickOverlay').classList.add('on');
  }
  function closeSectionPicker(){
    document.getElementById('apaPickOverlay').classList.remove('on');
  }

  function addSection(type){
    const d = getActive(); if (!d) return;
    if (!d.sections) d.sections = [];
    d.sections.push({ id: newSecId(), type, title: type==='custom'?'Sección personalizada':'', content: '' });
    d.updated = new Date().toISOString();
    persist();
    renderSections();
    renderPreview();
    closeSectionPicker();
  }

  function removeSection(id){
    const d = getActive(); if (!d) return;
    if (!confirm('¿Eliminar esta sección?')) return;
    d.sections = (d.sections||[]).filter(s => s.id !== id);
    d.updated = new Date().toISOString();
    persist();
    renderSections();
    renderPreview();
  }

  function moveSection(id, delta){
    const d = getActive(); if (!d || !d.sections) return;
    const idx = d.sections.findIndex(s => s.id === id);
    if (idx < 0) return;
    const newIdx = idx + delta;
    if (newIdx < 0 || newIdx >= d.sections.length) return;
    const [s] = d.sections.splice(idx, 1);
    d.sections.splice(newIdx, 0, s);
    d.updated = new Date().toISOString();
    persist();
    renderSections();
    renderPreview();
  }

  function changeSectionType(id, type){
    const d = getActive(); if (!d) return;
    const s = d.sections.find(x => x.id === id); if (!s) return;
    s.type = type;
    d.updated = new Date().toISOString();
    persist();
    renderSections(); // re-render so 'custom' shows title input
    renderPreview();
  }

  function updateSectionField(id, field, value){
    const d = getActive(); if (!d) return;
    const s = (d.sections||[]).find(x => x.id === id); if (!s) return;
    s[field] = value;
    d.updated = new Date().toISOString();
    clearTimeout(_saveTimer);
    _saveTimer = setTimeout(() => { persist(); renderList(); renderPreview(); }, 350);
  }

  /* ── Render section list (form area) ────────────────────── */
  function renderSections(){
    const wrap = document.getElementById('apaSections'); if (!wrap) return;
    const d = getActive();
    if (!d) { wrap.innerHTML = ''; return; }
    if (!d.sections || !d.sections.length) {
      wrap.innerHTML = '<div class="apa-sec-empty">📍 Sin secciones aún. Click <b>+ Agregar sección</b> arriba para empezar.</div>';
      return;
    }
    wrap.innerHTML = d.sections.map((s, i) => {
      const tp = SECTION_TYPES[s.type] || SECTION_TYPES.custom;
      const isCustom = s.type === 'custom';
      const placeholders = {
        abstract: 'Resumen del trabajo (150–250 palabras). Incluye objetivo, método, resultados clave y conclusión.',
        introduction: 'Contextualizá el problema, presentá el objetivo del trabajo y por qué es relevante.',
        background: 'Marco teórico: teorías, autores y antecedentes que sustentan el trabajo.',
        methodology: 'Diseño de investigación, instrumentos, muestra, procedimiento.',
        body: 'Desarrollo principal. Usá # encabezado / ## subencabezado / ### sub-sub. Línea en blanco = párrafo nuevo.',
        results: 'Hallazgos del estudio. Tablas y figuras se citan en texto (Tabla 1, Figura 1).',
        discussion: 'Interpretación de resultados, comparación con otros estudios.',
        conclusion: 'Síntesis de hallazgos, implicaciones y limitaciones.',
        recommendation: 'Sugerencias accionables derivadas de los resultados.',
        references: 'Una referencia por línea en formato APA: Apellido, N. (Año). Título. Editorial.',
        appendix: 'Material complementario: tablas extensas, instrumentos, gráficos.',
        custom: 'Contenido de la sección personalizada.',
      };
      return `<div class="apa-sec-card" data-sec="${s.id}">
        <div class="apa-sec-h">
          <select class="apa-sec-type-sel" onchange="APA.changeSectionType('${s.id}',this.value)">
            ${Object.entries(SECTION_TYPES).map(([k,v]) => `<option value="${k}" ${s.type===k?'selected':''}>${v.label}</option>`).join('')}
          </select>
          ${isCustom ? `<input class="apa-sec-title-inp" placeholder="Título de la sección" value="${escAttr(s.title)}" oninput="APA.updateSectionField('${s.id}','title',this.value)">` : ''}
          <div class="apa-sec-controls">
            <button class="apa-sec-btn" onclick="APA.moveSection('${s.id}',-1)" ${i===0?'disabled':''} title="Subir">↑</button>
            <button class="apa-sec-btn" onclick="APA.moveSection('${s.id}',1)" ${i===d.sections.length-1?'disabled':''} title="Bajar">↓</button>
            <button class="apa-sec-btn del" onclick="APA.removeSection('${s.id}')" title="Eliminar">✕</button>
          </div>
        </div>
        <textarea class="apa-sec-content" placeholder="${esc(placeholders[s.type]||placeholders.custom)}" oninput="APA.updateSectionField('${s.id}','content',this.value)">${esc(s.content||'')}</textarea>
      </div>`;
    }).join('');
  }

  /* ── Render APA preview ─────────────────────────────────── */
  function renderBody(text){
    if (!text) return '';
    const lines = text.split(/\n/);
    const out = []; let buf = [];
    const flush = () => {
      if (buf.length) {
        const para = buf.join(' ').trim();
        if (para) out.push('<p>' + esc(para) + '</p>');
        buf = [];
      }
    };
    for (const line of lines) {
      const t = line.trim();
      if (t === '') { flush(); continue; }
      const h3 = t.match(/^###\s+(.+)/);
      const h2 = t.match(/^##\s+(.+)/);
      const h1 = t.match(/^#\s+(.+)/);
      if (h3) { flush(); out.push('<h3 class="apa-h3">'+esc(h3[1])+'</h3>'); continue; }
      if (h2) { flush(); out.push('<h2 class="apa-h2">'+esc(h2[1])+'</h2>'); continue; }
      if (h1) { flush(); out.push('<h1 class="apa-h1">'+esc(h1[1])+'</h1>'); continue; }
      buf.push(line);
    }
    flush();
    return out.join('\n');
  }

  function renderRefs(text){
    if (!text) return '';
    return text.split(/\n/).map(l => l.trim()).filter(Boolean)
      .map(l => '<p>' + esc(l) + '</p>').join('\n');
  }

  function renderSectionPreview(s){
    const tp = SECTION_TYPES[s.type] || SECTION_TYPES.custom;
    const heading = (s.type === 'custom' && s.title) ? s.title : tp.heading;
    const headHTML = heading ? `<h2 class="apa-h2" style="text-align:center">${esc(heading)}</h2>` : '';
    if (tp.mode === 'abstract') {
      return `<div class="apa-abstract">${headHTML}<p>${esc(s.content)}</p></div>`;
    }
    if (tp.mode === 'references') {
      return `<div class="apa-references">${headHTML}${renderRefs(s.content)}</div>`;
    }
    return `${headHTML}${renderBody(s.content)}`;
  }

  /* Build the cover page HTML (APA 7 Student Paper title page).
   * Order: Title (3-4 lines from top) → Author → Affiliation → Course → Instructor → Date. */
  function buildCoverHTML(d){
    const isAcademic = d.kind === 'academic';
    const titleHTML = d.title
      ? `<h1>${esc(d.title)}${d.subtitle ? '<br><span style="font-weight:normal;font-style:italic">'+esc(d.subtitle)+'</span>' : ''}</h1>`
      : '<h1 style="color:#999">[Título del trabajo]</h1>';
    const studentLine = d.student ? `<div>${esc(d.student)}</div>` : '';
    const affiliation = [d.program, d.institution].filter(Boolean).map(esc).join(', ');
    const affiliationLine = isAcademic && affiliation ? `<div>${affiliation}</div>` : (d.institution ? `<div>${esc(d.institution)}</div>` : '');
    const subjectLine = isAcademic && d.subjectName ? `<div>${esc(d.subjectName)}</div>` : '';
    const profLine = d.professor ? `<div>${isAcademic?'Docente: ':''}${esc(d.professor)}</div>` : '';
    const dateLine = d.date ? `<div>${esc(fmtAPADate(d.date))}</div>` : '';
    return `<div class="apa-cover">${titleHTML}<div class="apa-cover-meta">${studentLine}${affiliationLine}${subjectLine}${profLine}${dateLine}</div></div>`;
  }

  /* Build the multi-page document.
   * APA 7 logical pagination:
   *   Page 1: cover
   *   Page 2: abstract (if any)
   *   Page 3+: body sections (intro, methodology, etc) — title repeated bold-centered at top
   *   New page: references
   *   New page each: citations, appendix
   * Returns array of {label, html} where html is the inner HTML of an .apa-page. */
  function buildPages(d){
    const pages = [];
    // Cover (page 1)
    pages.push({ label: 'Portada', cls: 'apa-cover-page', html: buildCoverHTML(d) });
    // Group sections per APA convention. Sections with ownPage:true each get their own page.
    // Sections with ownPage:false flow together on a single "body" page (labeled "Cuerpo").
    const sections = d.sections || [];
    let bodyBuf = [];
    const flushBody = () => {
      if (!bodyBuf.length) return;
      // Repeat the title at the top of the FIRST body page (APA 7 § 2.16)
      const titleRepeat = !pages.some(p => p.cls === 'apa-body-page')
        ? `<div class="apa-body-title">${esc(d.title || '[Título del trabajo]')}</div>`
        : '';
      pages.push({
        label: 'Cuerpo',
        cls: 'apa-body-page',
        html: titleRepeat + bodyBuf.map(renderSectionPreview).join('\n')
      });
      bodyBuf = [];
    };
    sections.forEach(s => {
      const tp = SECTION_TYPES[s.type] || SECTION_TYPES.custom;
      if (tp.ownPage) {
        flushBody();
        pages.push({
          label: tp.heading || tp.label.replace(/^[^\w]+\s/,''),
          cls: 'apa-' + s.type + '-page',
          html: renderSectionPreview(s)
        });
      } else {
        bodyBuf.push(s);
      }
    });
    flushBody();
    if (pages.length === 1) {
      // Only cover — add an empty body page hint
      pages.push({
        label: 'Cuerpo',
        cls: 'apa-body-page',
        html: '<p class="apa-empty-msg">[Sin secciones de cuerpo — agregá una sección desde el panel de la izquierda]</p>'
      });
    }
    return pages;
  }

  function renderPreview(){
    const d = getActive();
    const target = document.getElementById('apaPreview');
    if (!target) return;
    if (!d) {
      target.innerHTML = '<div style="text-align:center;padding:60px 20px;color:var(--t3)">📍 Seleccioná un documento o creá uno nuevo.</div>';
      return;
    }
    // If user has manually edited the preview, preserve their edits.
    // Edit-mode persists d.editedHTML and we render that verbatim.
    if (d.editedHTML && d.useEditedHTML) {
      target.innerHTML = `<div class="apa-paper-inner">${d.editedHTML}</div>`;
      return;
    }
    const pages = buildPages(d);
    const pagesHTML = pages.map((p, i) => {
      const num = i + 1;
      return `<div class="apa-page ${p.cls}" data-page="${num}">
        <div class="apa-page-num-label">${esc(p.label)} · pág ${num}</div>
        <div class="apa-page-num">${num}</div>
        ${p.html}
      </div>`;
    }).join('');
    target.innerHTML = `<div class="apa-paper-inner" id="apaPaperInner">${pagesHTML}</div>`;
    // If edit mode is active, re-apply contenteditable
    if (_editMode) applyEditMode(true);
  }

  /* ── Edit mode ──────────────────────────────────────────── */
  let _editMode = false;
  function applyEditMode(on){
    document.querySelectorAll('.apa-page').forEach(p => {
      if (on) p.setAttribute('contenteditable','true');
      else p.removeAttribute('contenteditable');
    });
  }
  function toggleEdit(){
    _editMode = !_editMode;
    const btn = document.getElementById('apaEditBtn');
    const d = getActive();
    if (_editMode) {
      applyEditMode(true);
      document.body.classList.add('apa-edit-mode'); // shows the Word-style toolbar
      if (btn) { btn.textContent = '💾 Guardar edición'; btn.classList.add('on'); }
      showStatus('✏️ Edición libre + toolbar Word activados');
    } else {
      const inner = document.getElementById('apaPaperInner');
      if (d && inner) {
        d.editedHTML = inner.innerHTML;
        d.useEditedHTML = true;
        d.updated = new Date().toISOString();
        persist();
      }
      applyEditMode(false);
      document.body.classList.remove('apa-edit-mode');
      if (btn) { btn.textContent = '✏️ Editar preview'; btn.classList.remove('on'); }
      showStatus('💾 Ediciones guardadas (afectan PDF / Word)');
    }
  }

  /* ── Word-style execCommand wrappers ────────────────────── */
  function fmtCmd(cmd, val){
    if (!_editMode) return;
    try { document.execCommand('styleWithCSS', false, true); } catch(e){}
    try {
      // hiliteColor doesn't work in Chrome — fallback to backColor
      if (cmd === 'hiliteColor') {
        if (!document.execCommand('hiliteColor', false, val)) {
          document.execCommand('backColor', false, val);
        }
      } else {
        document.execCommand(cmd, false, val);
      }
    } catch(e){ console.warn('execCommand failed:', cmd, e); }
  }

  /* execCommand fontSize takes 1-7. To support real pt values we use
     a temporary marker (size=7), then rewrite the resulting <font>
     elements with style.fontSize in pt. */
  function fmtSize(pt){
    if (!_editMode) return;
    try { document.execCommand('styleWithCSS', false, false); } catch(e){}
    document.execCommand('fontSize', false, '7');
    document.querySelectorAll('font[size="7"]').forEach(f => {
      f.removeAttribute('size');
      f.style.fontSize = pt + 'pt';
    });
    try { document.execCommand('styleWithCSS', false, true); } catch(e){}
  }

  /* Line-height applies to the block ancestor (P/DIV/LI/Hn) of the
     current selection. Inline applies via style.lineHeight. */
  function fmtLineHeight(v){
    if (!_editMode) return;
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    let node = range.commonAncestorContainer;
    if (node && node.nodeType === 3) node = node.parentNode;
    const blocks = ['P','DIV','LI','H1','H2','H3','H4','H5','H6','BLOCKQUOTE'];
    while (node && !blocks.includes(node.tagName)) node = node.parentNode;
    if (node) node.style.lineHeight = v;
  }
  function discardEdits(){
    const d = getActive(); if (!d) return;
    if (!d.editedHTML) return alert('No hay ediciones manuales para descartar.');
    if (!confirm('¿Descartar ediciones manuales y volver al render automático?')) return;
    delete d.editedHTML;
    d.useEditedHTML = false;
    d.updated = new Date().toISOString();
    persist();
    if (_editMode) toggleEdit();
    renderPreview();
    showStatus('↻ Ediciones descartadas — volvió al render automático');
  }

  function toggleFullPreview(){
    document.body.classList.toggle('apa-full');
    const btn = document.getElementById('apaFullBtn');
    if (btn) btn.textContent = document.body.classList.contains('apa-full') ? '⛶ Salir' : '⛶ Ampliar';
  }

  /* ── Exports ────────────────────────────────────────────── */
  function exportPDF(){
    const d = getActive(); if (!d) return alert('Creá un documento primero.');
    if (typeof html2pdf === 'undefined') return alert('html2pdf no cargó.');
    persist();
    const target = document.getElementById('apaPaperInner');
    if (!target) return alert('No hay contenido para exportar.');
    showStatus('🔄 Generando PDF…');
    html2pdf().set({
      margin: 0,
      filename: (d.title || 'documento').replace(/[^\w\-]+/g,'_') + '.pdf',
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'cm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    }).from(target).save().then(()=> showStatus('📕 PDF descargado'));
  }

  function exportWord(){
    const d = getActive(); if (!d) return alert('Creá un documento primero.');
    if (typeof htmlDocx === 'undefined') return alert('html-docx-js no cargó.');
    persist();
    const target = document.getElementById('apaPaperInner');
    if (!target) return alert('No hay contenido para exportar.');
    /* APA 7 Student Paper compliant Word export: 12pt Times New Roman,
       double-space, left-aligned (NOT justified), all headings 12pt with
       weight differentiation only, hanging-indent references. Each
       .apa-page becomes a Word page via page-break-after. */
    const css = `<style>
      @page { size: Letter; margin: 2.54cm; mso-header-margin: 1.27cm; mso-footer-margin: 1.27cm; }
      body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 2; margin: 0; }
      .apa-page { page-break-after: always; break-after: page; padding: 0; min-height: 0; }
      .apa-page:last-child { page-break-after: auto; }
      .apa-page-num, .apa-page-num-label { display: none; } /* hidden in Word — use real page numbers via @page */
      h1 { font-size: 12pt; font-weight: bold; text-align: center; margin: 1em 0 .5em; }
      h2 { font-size: 12pt; font-weight: bold; text-align: left; margin: 1em 0 .3em; }
      h3 { font-size: 12pt; font-weight: bold; font-style: italic; text-align: left; margin: .8em 0 .3em; }
      p { margin: 0; text-indent: 1.27cm; text-align: left; }
      .apa-cover-page { padding-top: 7em; text-align: center; }
      .apa-cover { text-align: center; }
      .apa-cover h1 { font-family: 'Times New Roman', Times, serif; font-size: 12pt; font-weight: bold; text-align: center; margin: 0 0 4em; line-height: 2; text-indent: 0; }
      .apa-cover .apa-cover-meta { font-family: 'Times New Roman', Times, serif; font-size: 12pt; text-align: center; line-height: 2; }
      .apa-cover .apa-cover-meta div { margin: 0; text-align: center; text-indent: 0; }
      .apa-body-title { font-size: 12pt; font-weight: bold; text-align: center; margin: 0 0 1em; }
      .apa-section-title { font-size: 12pt; font-weight: bold; text-align: center; margin: 1em 0 .5em; }
      .apa-abstract p { text-indent: 0; }
      .apa-references p { text-indent: -1.27cm; padding-left: 1.27cm; margin-bottom: .5em; text-align: left; }
    </style>`;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">${css}</head><body>${target.outerHTML}</body></html>`;
    const blob = htmlDocx.asBlob(html);
    const filename = (d.title || 'documento').replace(/[^\w\-]+/g,'_') + '.docx';
    if (typeof saveAs === 'function') saveAs(blob, filename);
    else { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); }
    showStatus('📘 Word descargado');
  }

  function exportExcel(){
    const d = getActive(); if (!d) return alert('Creá un documento primero.');
    if (typeof XLSX === 'undefined') return alert('SheetJS no cargó.');
    persist();
    const wb = XLSX.utils.book_new();

    // Sheet 1: Portada
    const cover = [
      ['Campo','Valor'],
      ['Título', d.title || ''],
      ['Subtítulo', d.subtitle || ''],
      ['Tipo', d.kind === 'academic' ? 'Académico' : 'Personal'],
      ['Materia', d.subjectName || ''],
      ['Universidad', d.institution || ''],
      ['Programa', d.program || ''],
      ['Profesor', d.professor || ''],
      ['Estudiante', d.student || ''],
      ['Fecha', fmtAPADate(d.date) || ''],
      ['Creado', fmtDate(d.created)],
      ['Actualizado', fmtDate(d.updated)],
      ['Total secciones', (d.sections||[]).length],
    ];
    const wsCover = XLSX.utils.aoa_to_sheet(cover);
    wsCover['!cols'] = [{ wch: 20 }, { wch: 70 }];
    XLSX.utils.book_append_sheet(wb, wsCover, 'Portada');

    // One sheet per section (or one combined sheet for short docs)
    (d.sections || []).forEach((s, idx) => {
      const tp = SECTION_TYPES[s.type] || SECTION_TYPES.custom;
      const heading = (s.type === 'custom' && s.title) ? s.title : tp.heading || tp.label;
      const sheetName = (heading || 'Sección').slice(0, 25).replace(/[^\w\sáéíóúñÁÉÍÓÚÑ-]/g,'') || ('Sección '+(idx+1));
      let rows;
      if (tp.mode === 'references') {
        const refs = (s.content || '').split(/\n/).map(l=>l.trim()).filter(Boolean);
        rows = [['#','Referencia (APA)']];
        refs.forEach((r,i) => rows.push([i+1, r]));
      } else {
        const paragraphs = (s.content || '').split(/\n\s*\n/).map(p=>p.trim()).filter(Boolean);
        rows = [['#','Párrafo']];
        paragraphs.forEach((p,i) => rows.push([i+1, p]));
      }
      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = [{ wch: 6 }, { wch: 110 }];
      let safeName = sheetName.slice(0,28); // Excel sheet name limit
      // Avoid duplicate sheet names
      let n = 1;
      while (wb.SheetNames.includes(safeName)) { safeName = sheetName.slice(0,26) + ' ' + (++n); }
      XLSX.utils.book_append_sheet(wb, ws, safeName);
    });

    const filename = (d.title || 'documento').replace(/[^\w\-]+/g,'_') + '.xlsx';
    XLSX.writeFile(wb, filename);
    showStatus('📗 Excel descargado');
  }

  function copyText(){
    const d = getActive(); if (!d) return;
    const lines = [];
    if (d.title) lines.push(d.title.toUpperCase());
    if (d.subtitle) lines.push(d.subtitle);
    lines.push('');
    if (d.student) lines.push(d.student);
    if (d.institution) lines.push(d.institution);
    if (d.program) lines.push(d.program);
    if (d.kind==='academic' && d.subjectName) lines.push(d.subjectName);
    if (d.professor) lines.push('Docente: ' + d.professor);
    if (d.date) lines.push(fmtAPADate(d.date));
    lines.push('','---','');
    (d.sections || []).forEach(s => {
      const tp = SECTION_TYPES[s.type] || SECTION_TYPES.custom;
      const heading = (s.type === 'custom' && s.title) ? s.title : tp.heading;
      if (heading) lines.push(heading.toUpperCase());
      if (s.content) lines.push(s.content);
      lines.push('');
    });
    const txt = lines.join('\n');
    if (navigator.clipboard) navigator.clipboard.writeText(txt).then(()=>showStatus('📋 Copiado'));
    else { const ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); showStatus('📋 Copiado'); }
  }

  /* ── List render ────────────────────────────────────────── */
  function renderList(){
    const el = document.getElementById('apaList'); if (!el) return;
    if (!_docs.length) {
      el.innerHTML = '<div class="apa-empty">📍 Sin documentos aún.<br>Click <b>+ Nuevo</b>.</div>';
      return;
    }
    el.innerHTML = _docs.slice().sort((a,b)=> (b.updated||'').localeCompare(a.updated||'')).map(d =>
      `<div class="apa-item ${d.id===_activeId?'on':''}" onclick="APA.open('${d.id}')">
        <div class="apa-item-t">${esc(d.title || 'Sin título')}</div>
        <div class="apa-item-m">
          <span>${fmtDate(d.updated || d.created)} · ${(d.sections||[]).length} sec</span>
          <button class="apa-item-del" onclick="event.stopPropagation();APA.remove('${d.id}')" title="Eliminar">✕</button>
        </div>
      </div>`
    ).join('');
  }

  /* ── Init ──────────────────────────────────────────────── */
  function wireForm(){
    const ids = ['apaTitle','apaInstitution','apaProgram','apaProfessor','apaStudent','apaDate','apaSubtitle'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', schedulePreview);
        el.addEventListener('change', schedulePreview);
      }
    });
    const k = document.getElementById('apaKind');
    if (k) k.addEventListener('change', () => { kindChanged(); });
  }

  function init(){
    load();
    buildSubjectDropdown();
    wireForm();
    renderList();
    if (_docs.length) {
      const latest = _docs.slice().sort((a,b)=> (b.updated||'').localeCompare(a.updated||''))[0];
      if (latest) open(latest.id);
    } else {
      clearForm();
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else setTimeout(init, 0);

  return {
    create, open, save, remove, kindChanged,
    applyApaNorms, updateRawContent,
    openSectionPicker, closeSectionPicker, addSection, removeSection, moveSection,
    changeSectionType, updateSectionField,
    openSmartPaste, closeSmartPaste, previewSmartPaste, applySmartPaste,
    exportPDF, exportWord, exportExcel, copyText, toggleFullPreview,
    toggleEdit, discardEdits, fmtCmd, fmtSize, fmtLineHeight,
  };
})();
window.APA = APA;
