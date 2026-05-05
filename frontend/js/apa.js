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
  let _docs = [];
  let _activeId = null;
  let _saveTimer = null;
  let _filling = false; // guard: when true, snapshot() must not write back

  // 10-SYS subjects (verified period 26V02)
  const SUBJECTS = [
    { id: 'ing_web', code: 'DIS34', name: 'Ingeniería Web', professor: 'BECERRA RAMIREZ HEYNER LEONEL' },
    { id: 'mat_especiales', code: 'DIS31', name: 'Matemáticas Especiales', professor: 'Juan Sebastián Cortés Cruz' },
    { id: 'inv_ciencia', code: 'DIS36', name: 'Investigación en C&T', professor: 'CORTES TOBAR DARIO FERNANDO' },
    { id: 'english_b1', code: 'A1I01', name: 'Virtual English Beginner 1', professor: '' },
    { id: 'placement_test', code: 'CE1026', name: 'Placement Test BE Plus', professor: '' },
    { id: 'other', code: '', name: '— Otra (escribir manualmente) —', professor: '' },
  ];

  // 11 section types (mode controls APA preview rendering style)
  const SECTION_TYPES = {
    abstract:       { label: '📋 Resumen / Abstract',   heading: 'Resumen',         mode: 'abstract' },
    introduction:   { label: '💡 Introducción',          heading: 'Introducción',    mode: 'normal'   },
    background:     { label: '📚 Marco teórico',         heading: 'Marco Teórico',   mode: 'normal'   },
    methodology:    { label: '🔬 Metodología',           heading: 'Metodología',     mode: 'normal'   },
    body:           { label: '📄 Desarrollo / Cuerpo',   heading: '',                mode: 'normal'   },
    results:        { label: '📊 Resultados',            heading: 'Resultados',      mode: 'normal'   },
    discussion:     { label: '💬 Discusión',             heading: 'Discusión',       mode: 'normal'   },
    conclusion:     { label: '🎯 Conclusiones',          heading: 'Conclusiones',    mode: 'normal'   },
    recommendation: { label: '✅ Recomendaciones',       heading: 'Recomendaciones', mode: 'normal'   },
    references:     { label: '📚 Referencias',           heading: 'Referencias',     mode: 'references' },
    appendix:       { label: '📎 Anexos',                heading: 'Anexos',          mode: 'normal'   },
    custom:         { label: '✏️ Personalizado',         heading: '',                mode: 'normal'   },
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

  /* ── Migration: legacy fields → sections[] ──────────────── */
  function migrateDoc(d){
    if (Array.isArray(d.sections)) return d;
    d.sections = [];
    if (d.abstract && d.abstract.trim()) d.sections.push({ id: newSecId(), type: 'abstract', title: '', content: d.abstract });
    if (d.body && d.body.trim())         d.sections.push({ id: newSecId(), type: 'body', title: '', content: d.body });
    if (d.references && d.references.trim()) d.sections.push({ id: newSecId(), type: 'references', title: '', content: d.references });
    if (d.appendix && d.appendix.trim()) d.sections.push({ id: newSecId(), type: 'appendix', title: '', content: d.appendix });
    return d;
  }

  /* ── Default doc ─────────────────────────────────────────── */
  function emptyDoc(){
    const today = new Date().toISOString().slice(0,10);
    const studentName = (typeof localStorage !== 'undefined' && localStorage.getItem('sb_name')) || '';
    return {
      id: 'apa_' + Date.now(),
      title: 'Nuevo documento',
      kind: 'academic',
      subjectId: 'ing_web',
      subjectName: '',
      institution: 'Corporación Unificada Nacional · CUN',
      program: 'Ingeniería de Sistemas',
      professor: '',
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

  /* ── Subject dropdown ───────────────────────────────────── */
  function buildSubjectDropdown(){
    const sel = document.getElementById('apaSubject'); if (!sel) return;
    sel.innerHTML = SUBJECTS.map(s =>
      `<option value="${s.id}">${s.code ? s.code + ' · ' : ''}${s.name}</option>`
    ).join('');
    sel.addEventListener('change', () => {
      if (_filling) return;
      const subject = SUBJECTS.find(s => s.id === sel.value);
      const profEl = document.getElementById('apaProfessor');
      if (subject && subject.professor && profEl && !profEl.value) {
        profEl.value = subject.professor;
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
    const subj = SUBJECTS.find(s => s.id === d.subjectId);
    d.subjectName = subj ? (subj.code ? subj.code + ' · ' + subj.name : subj.name) : '';
    d.title = document.getElementById('apaTitle').value;
    d.institution = document.getElementById('apaInstitution').value;
    d.program = document.getElementById('apaProgram').value;
    d.professor = document.getElementById('apaProfessor').value;
    d.student = document.getElementById('apaStudent').value;
    d.date = document.getElementById('apaDate').value;
    d.subtitle = document.getElementById('apaSubtitle').value;
    d.updated = new Date().toISOString();
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

  function renderPreview(){
    const d = getActive();
    const target = document.getElementById('apaPreview');
    if (!target) return;
    if (!d) {
      target.innerHTML = '<div style="text-align:center;padding:60px 20px;color:var(--t3)">📍 Seleccioná un documento o creá uno nuevo.</div>';
      return;
    }
    // APA 7 Student Paper title-page order (top to bottom):
    //   Title (3-4 lines from top, bold, centered, Title Case)
    //   [blank double-space line]
    //   Author Name
    //   Author Affiliation (Department, Institution)
    //   Course (code: name)
    //   Instructor (Dr./Prof. ...)
    //   Due Date (Month DD, YYYY)
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
    const cover = `<div class="apa-cover">${titleHTML}<div class="apa-cover-meta">${studentLine}${affiliationLine}${subjectLine}${profLine}${dateLine}</div></div>`;
    const sectionsHTML = (d.sections || []).map(renderSectionPreview).join('\n')
      || '<p class="apa-empty-msg">[Sin secciones — agregá una desde el panel de la izquierda]</p>';
    target.innerHTML = `<div class="apa-paper-inner">${cover}${sectionsHTML}</div>`;
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
    const target = document.querySelector('.apa-paper-inner');
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
    const target = document.querySelector('.apa-paper-inner');
    if (!target) return alert('No hay contenido para exportar.');
    /* APA 7 Student Paper compliant Word export: 12pt Times New Roman,
       double-space, left-aligned (NOT justified), all headings 12pt with
       weight differentiation only, hanging-indent references. */
    const css = `<style>
      @page { size: Letter; margin: 2.54cm; }
      body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 2; margin: 0; }
      h1 { font-size: 12pt; font-weight: bold; text-align: center; margin: 1em 0 .5em; }
      h2 { font-size: 12pt; font-weight: bold; text-align: left; margin: 1em 0 .3em; }
      h3 { font-size: 12pt; font-weight: bold; font-style: italic; text-align: left; margin: .8em 0 .3em; }
      p { margin: 0; text-indent: 1.27cm; text-align: left; }
      .apa-cover { text-align: center; }
      .apa-cover h1 { margin-bottom: 2cm; line-height: 2; }
      .apa-cover-meta div { margin-bottom: 0; }
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
    openSectionPicker, closeSectionPicker, addSection, removeSection, moveSection,
    changeSectionType, updateSectionField,
    exportPDF, exportWord, exportExcel, copyText, toggleFullPreview,
  };
})();
window.APA = APA;
