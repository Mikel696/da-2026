/* ═══════════════════════════════════════════════════════════════
   DA-2026 · 16-APA · Document Studio
   ─────────────────────────────────────────────────────────────
   Two-pane editor: form on left/center, live APA preview on right.
   Exports: PDF (html2pdf.js), Word .docx (html-docx-js), Excel
   .xlsx (SheetJS). Storage in tools_apa_docs (synced).
═══════════════════════════════════════════════════════════════ */

const APA = (function(){
  'use strict';

  const KEY = 'tools_apa_docs';
  let _docs = [];
  let _activeId = null;
  let _saveTimer = null;

  // Subjects from 10-SYS Systems Engineering (verified for period 26V02).
  // User can also pick "Otra" to type a custom subject.
  const SUBJECTS = [
    { id: 'ing_web', code: 'DIS34', name: 'Ingeniería Web', professor: 'BECERRA RAMIREZ HEYNER LEONEL' },
    { id: 'mat_especiales', code: 'DIS31', name: 'Matemáticas Especiales', professor: 'Juan Sebastián Cortés Cruz' },
    { id: 'inv_ciencia', code: 'DIS36', name: 'Investigación en C&T', professor: 'CORTES TOBAR DARIO FERNANDO' },
    { id: 'english_b1', code: 'A1I01', name: 'Virtual English Beginner 1', professor: '' },
    { id: 'placement_test', code: 'CE1026', name: 'Placement Test BE Plus', professor: '' },
    { id: 'other', code: '', name: '— Otra (escribir manualmente) —', professor: '' },
  ];

  /* ── Storage ─────────────────────────────────────────────── */
  function load(){ try { _docs = JSON.parse(localStorage.getItem(KEY)||'[]'); } catch { _docs = []; } }
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
  function fmtDate(iso){ if (!iso) return ''; return new Date(iso).toLocaleDateString('es',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}); }
  function fmtAPADate(iso){
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
      return d.getDate() + ' de ' + meses[d.getMonth()] + ' de ' + d.getFullYear();
    } catch { return iso; }
  }
  function showStatus(msg){
    const el = document.getElementById('apaStatus'); if (!el) return;
    el.textContent = msg; el.classList.add('on');
    clearTimeout(el._t); el._t = setTimeout(()=>el.classList.remove('on'), 1800);
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
      abstract: '',
      body: '',
      references: '',
      appendix: '',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    };
  }

  /* ── Subject dropdown ───────────────────────────────────── */
  function buildSubjectDropdown(){
    const sel = document.getElementById('apaSubject');
    if (!sel) return;
    sel.innerHTML = SUBJECTS.map(s =>
      `<option value="${s.id}">${s.code ? s.code + ' · ' : ''}${s.name}</option>`
    ).join('');
    sel.addEventListener('change', () => {
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
    schedulePreview();
  }

  /* ── CRUD ───────────────────────────────────────────────── */
  function create(){
    const doc = emptyDoc();
    _docs.push(doc);
    persist();
    open(doc.id);
    renderList();
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
    _activeId = id;
    fillForm(d);
    renderList();
    renderPreview();
  }

  function clearForm(){
    ['apaTitle','apaInstitution','apaProgram','apaProfessor','apaStudent','apaDate',
     'apaSubtitle','apaAbstract','apaBody','apaReferences','apaAppendix']
      .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    document.getElementById('apaPreview').innerHTML = '<div style="text-align:center;padding:60px 20px;color:var(--t3)">📍 Seleccioná un documento o creá uno nuevo.</div>';
  }

  function fillForm(d){
    document.getElementById('apaKind').value = d.kind || 'academic';
    kindChanged();
    document.getElementById('apaSubject').value = d.subjectId || 'ing_web';
    document.getElementById('apaTitle').value = d.title || '';
    document.getElementById('apaInstitution').value = d.institution || '';
    document.getElementById('apaProgram').value = d.program || '';
    document.getElementById('apaProfessor').value = d.professor || '';
    document.getElementById('apaStudent').value = d.student || '';
    document.getElementById('apaDate').value = d.date || '';
    document.getElementById('apaSubtitle').value = d.subtitle || '';
    document.getElementById('apaAbstract').value = d.abstract || '';
    document.getElementById('apaBody').value = d.body || '';
    document.getElementById('apaReferences').value = d.references || '';
    document.getElementById('apaAppendix').value = d.appendix || '';
  }

  function snapshot(){
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
    d.abstract = document.getElementById('apaAbstract').value;
    d.body = document.getElementById('apaBody').value;
    d.references = document.getElementById('apaReferences').value;
    d.appendix = document.getElementById('apaAppendix').value;
    d.updated = new Date().toISOString();
    return d;
  }

  function save(){
    const d = snapshot(); if (!d) { alert('Creá un documento primero.'); return; }
    persist();
    renderList();
    showStatus('💾 Guardado');
  }

  function schedulePreview(){
    snapshot();
    clearTimeout(_saveTimer);
    _saveTimer = setTimeout(() => { persist(); renderPreview(); }, 350);
  }

  /* ── Render APA preview (HTML "paper") ──────────────────── */
  function renderBody(text){
    if (!text) return '';
    const lines = text.split(/\n/);
    const out = [];
    let buf = [];
    const flush = () => {
      if (buf.length) {
        const para = buf.join(' ').trim();
        if (para) out.push('<p>' + esc(para) + '</p>');
        buf = [];
      }
    };
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === '') { flush(); continue; }
      // Headings: # H1, ## H2, ### H3
      const h1 = trimmed.match(/^#\s+(.+)/);
      const h2 = trimmed.match(/^##\s+(.+)/);
      const h3 = trimmed.match(/^###\s+(.+)/);
      if (h3) { flush(); out.push('<h3 class="apa-h3">' + esc(h3[1]) + '</h3>'); continue; }
      if (h2) { flush(); out.push('<h2 class="apa-h2">' + esc(h2[1]) + '</h2>'); continue; }
      if (h1) { flush(); out.push('<h1 class="apa-h1">' + esc(h1[1]) + '</h1>'); continue; }
      buf.push(line);
    }
    flush();
    return out.join('\n');
  }

  function renderReferences(text){
    if (!text) return '';
    return text.split(/\n/).map(l => l.trim()).filter(Boolean)
      .map(l => '<p>' + esc(l) + '</p>').join('\n');
  }

  function renderPreview(){
    const d = getActive();
    const target = document.getElementById('apaPreview');
    if (!d) {
      target.innerHTML = '<div style="text-align:center;padding:60px 20px;color:var(--t3)">📍 Seleccioná un documento o creá uno nuevo.</div>';
      return;
    }
    const isAcademic = d.kind === 'academic';
    const subjectLine = isAcademic && d.subjectName ? `<div>${esc(d.subjectName)}</div>` : '';
    const profLine = isAcademic && d.professor ? `<div>Docente: ${esc(d.professor)}</div>` : (d.professor ? `<div>${esc(d.professor)}</div>` : '');
    const dateLine = d.date ? `<div>${esc(fmtAPADate(d.date))}</div>` : '';
    const studentLine = d.student ? `<div>${esc(d.student)}</div>` : '';
    const institutionLine = d.institution ? `<div>${esc(d.institution)}</div>` : '';
    const programLine = isAcademic && d.program ? `<div>${esc(d.program)}</div>` : '';
    const titleHTML = d.title ? `<h1>${esc(d.title)}${d.subtitle ? '<br><span style="font-weight:normal;font-style:italic">'+esc(d.subtitle)+'</span>' : ''}</h1>` : '<h1 style="color:#999">[Título del trabajo]</h1>';

    const cover = `<div class="apa-cover">
      ${titleHTML}
      <div class="apa-cover-meta">
        ${studentLine}
        ${institutionLine}
        ${programLine}
        ${subjectLine}
        ${profLine}
        ${dateLine}
      </div>
    </div>`;

    const abstractHTML = d.abstract ? `<div class="apa-abstract"><div class="apa-abstract-h">Resumen</div><p>${esc(d.abstract)}</p></div>` : '';
    const bodyHTML = renderBody(d.body) || '<p class="apa-empty-msg">[Cuerpo del trabajo vacío]</p>';
    const refsHTML = d.references ? `<div class="apa-references"><div class="apa-references-h">Referencias</div>${renderReferences(d.references)}</div>` : '';
    const appendixHTML = d.appendix ? `<div class="apa-appendix"><h2 class="apa-h2">Anexos</h2><p>${esc(d.appendix).replace(/\n/g,'</p><p>')}</p></div>` : '';

    target.innerHTML = `<div class="apa-paper-inner">
      ${cover}
      ${abstractHTML}
      ${bodyHTML}
      ${refsHTML}
      ${appendixHTML}
    </div>`;
  }

  function toggleFullPreview(){
    document.body.classList.toggle('apa-full');
    const btn = document.getElementById('apaFullBtn');
    if (btn) btn.textContent = document.body.classList.contains('apa-full') ? '⛶ Salir' : '⛶ Ampliar';
  }

  /* ── Export: PDF ────────────────────────────────────────── */
  function exportPDF(){
    const d = snapshot(); if (!d) return alert('Creá un documento primero.');
    if (typeof html2pdf === 'undefined') return alert('html2pdf no cargó.');
    persist();
    const target = document.querySelector('.apa-paper-inner');
    if (!target) return alert('No hay contenido para exportar.');
    showStatus('🔄 Generando PDF…');
    const opts = {
      margin: 0,
      filename: (d.title || 'documento').replace(/[^\w\-]+/g,'_') + '.pdf',
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'cm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    };
    html2pdf().set(opts).from(target).save().then(()=> showStatus('📕 PDF descargado'));
  }

  /* ── Export: Word .docx ─────────────────────────────────── */
  function exportWord(){
    const d = snapshot(); if (!d) return alert('Creá un documento primero.');
    if (typeof htmlDocx === 'undefined') return alert('html-docx-js no cargó.');
    persist();
    const target = document.querySelector('.apa-paper-inner');
    if (!target) return alert('No hay contenido para exportar.');
    const css = `<style>
      body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 2; margin: 2.54cm; }
      h1 { font-size: 14pt; font-weight: bold; text-align: center; margin: 1em 0 .5em; }
      h2 { font-size: 12pt; font-weight: bold; margin: 1em 0 .3em; }
      h3 { font-size: 12pt; font-weight: bold; font-style: italic; margin: .8em 0 .3em; }
      p { margin: 0; text-indent: 1.27cm; text-align: justify; }
      .apa-cover { text-align: center; min-height: 100vh; }
      .apa-cover h1 { margin-bottom: 2cm; }
      .apa-cover-meta div { margin-bottom: .4cm; }
      .apa-abstract p { text-indent: 0; }
      .apa-references-h { font-weight: bold; text-align: center; margin-top: 1em; }
      .apa-references p { text-indent: -1.27cm; padding-left: 1.27cm; margin-bottom: .5em; text-align: left; }
    </style>`;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">${css}</head><body>${target.outerHTML}</body></html>`;
    const blob = htmlDocx.asBlob(html);
    const filename = (d.title || 'documento').replace(/[^\w\-]+/g,'_') + '.docx';
    if (typeof saveAs === 'function') saveAs(blob, filename);
    else {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = filename;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    }
    showStatus('📘 Word descargado');
  }

  /* ── Export: Excel .xlsx ────────────────────────────────── */
  function exportExcel(){
    const d = snapshot(); if (!d) return alert('Creá un documento primero.');
    if (typeof XLSX === 'undefined') return alert('SheetJS no cargó.');
    persist();
    const wb = XLSX.utils.book_new();

    // Sheet 1: Portada (header info)
    const cover = [
      ['Campo', 'Valor'],
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
    ];
    const wsCover = XLSX.utils.aoa_to_sheet(cover);
    wsCover['!cols'] = [{ wch: 18 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(wb, wsCover, 'Portada');

    // Sheet 2: Cuerpo (paragraphs)
    const paragraphs = (d.body || '').split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    const bodyRows = [['#', 'Párrafo']];
    paragraphs.forEach((p, i) => bodyRows.push([i+1, p]));
    if (d.abstract) bodyRows.unshift(['Abstract', d.abstract]);
    const wsBody = XLSX.utils.aoa_to_sheet(bodyRows);
    wsBody['!cols'] = [{ wch: 6 }, { wch: 100 }];
    XLSX.utils.book_append_sheet(wb, wsBody, 'Cuerpo');

    // Sheet 3: Referencias
    const refs = (d.references || '').split(/\n/).map(r => r.trim()).filter(Boolean);
    const refRows = [['#', 'Referencia (APA)']];
    refs.forEach((r, i) => refRows.push([i+1, r]));
    const wsRefs = XLSX.utils.aoa_to_sheet(refRows);
    wsRefs['!cols'] = [{ wch: 6 }, { wch: 120 }];
    XLSX.utils.book_append_sheet(wb, wsRefs, 'Referencias');

    const filename = (d.title || 'documento').replace(/[^\w\-]+/g,'_') + '.xlsx';
    XLSX.writeFile(wb, filename);
    showStatus('📗 Excel descargado');
  }

  /* ── Copy plain text to clipboard ───────────────────────── */
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
    if (d.abstract) { lines.push('RESUMEN'); lines.push(d.abstract); lines.push(''); }
    if (d.body) { lines.push(d.body); lines.push(''); }
    if (d.references) { lines.push('REFERENCIAS'); lines.push(d.references); lines.push(''); }
    if (d.appendix) { lines.push('ANEXOS'); lines.push(d.appendix); }
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
          <span>${fmtDate(d.updated || d.created)}</span>
          <button class="apa-item-del" onclick="event.stopPropagation();APA.remove('${d.id}')" title="Eliminar">✕</button>
        </div>
      </div>`
    ).join('');
  }

  /* ── Init: hook live preview to form changes ────────────── */
  function wireForm(){
    const ids = ['apaTitle','apaInstitution','apaProgram','apaProfessor','apaStudent','apaDate',
                 'apaSubtitle','apaAbstract','apaBody','apaReferences','apaAppendix','apaSubject','apaKind'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', schedulePreview);
        el.addEventListener('change', schedulePreview);
      }
    });
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
    create, open, save, remove, snapshot, kindChanged,
    exportPDF, exportWord, exportExcel, copyText, toggleFullPreview,
  };
})();
window.APA = APA;
