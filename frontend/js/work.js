/* ═══════════════════════════════════════════════════════════════
   DA-2026 · 14-WORK · Simetrik Copilot
   ─────────────────────────────────────────────────────────────
   Storage:
     - work_cases     [{id,title,client,severity,status,body,date}]
     - work_errors    [{id,title,code,body,date}]
     - work_learnings [{id,title,tag,body,date}]
     - work_kb        string (raw markdown of personal Simetrik KB)
     - work_nb_meta   notebook list (NotNB-style)
     - work_nb_data   notebook page data
   Reuses nb-shared.js for the cuadernos sub-module — same UX as
   13-NOT and 10-SYS. The Copilot tab generates structured prompts
   that include KB + recent cases as context, so Claude has Miguel's
   Simetrik workflow pre-loaded when answering.
═══════════════════════════════════════════════════════════════ */

const WORK = (function(){
  'use strict';

  const K_CASES = 'work_cases';
  const K_ERRORS = 'work_errors';
  const K_LEARN = 'work_learnings';
  const K_KB = 'work_kb';

  function _load(k){ try { return JSON.parse(localStorage.getItem(k)||'[]'); } catch { return []; } }
  function _save(k, v){ localStorage.setItem(k, JSON.stringify(v)); }
  function esc(s){ const d=document.createElement('div'); d.textContent=s==null?'':s; return d.innerHTML; }
  function fmtDate(iso){
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('es',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
  }

  /* ── CASES ─────────────────────────────────────────────────── */
  function saveCase(){
    const title = document.getElementById('caseTitle').value.trim();
    const client = document.getElementById('caseClient').value.trim();
    const severity = document.getElementById('caseSeverity').value;
    const status = document.getElementById('caseStatus').value;
    const body = document.getElementById('caseBody').value.trim();
    if (!title || !body) return alert('Título y descripción son obligatorios.');
    const list = _load(K_CASES);
    list.push({ id:'c_'+Date.now(), title, client, severity, status, body, date:new Date().toISOString() });
    _save(K_CASES, list);
    clearForm('case');
    render();
  }

  function delCase(id){
    if (!confirm('¿Eliminar caso?')) return;
    _save(K_CASES, _load(K_CASES).filter(c => c.id !== id));
    render();
  }

  /* ── ERRORS ────────────────────────────────────────────────── */
  function saveError(){
    const title = document.getElementById('errTitle').value.trim();
    const code = document.getElementById('errCode').value.trim();
    const body = document.getElementById('errBody').value.trim();
    if (!title) return alert('Título obligatorio.');
    const list = _load(K_ERRORS);
    list.push({ id:'e_'+Date.now(), title, code, body, date:new Date().toISOString() });
    _save(K_ERRORS, list);
    clearForm('err');
    render();
  }

  function delError(id){
    if (!confirm('¿Eliminar error?')) return;
    _save(K_ERRORS, _load(K_ERRORS).filter(e => e.id !== id));
    render();
  }

  /* ── LEARNINGS ─────────────────────────────────────────────── */
  function saveLearning(){
    const title = document.getElementById('learnTitle').value.trim();
    const tag = document.getElementById('learnTag').value;
    const body = document.getElementById('learnBody').value.trim();
    if (!title || !body) return alert('Título y contenido obligatorios.');
    const list = _load(K_LEARN);
    list.push({ id:'l_'+Date.now(), title, tag, body, date:new Date().toISOString() });
    _save(K_LEARN, list);
    clearForm('learn');
    render();
  }

  function delLearning(id){
    if (!confirm('¿Eliminar?')) return;
    _save(K_LEARN, _load(K_LEARN).filter(l => l.id !== id));
    render();
  }

  /* ── KNOWLEDGE BASE ────────────────────────────────────────── */
  function loadKB(){ try { return localStorage.getItem(K_KB) || ''; } catch { return ''; } }
  function saveKB(){
    const v = document.getElementById('kbBody').value;
    localStorage.setItem(K_KB, v);
    const b = document.getElementById('kbSavedBadge');
    if (b) { b.style.opacity='1'; setTimeout(()=>b.style.opacity='0', 1500); }
  }

  /* ── COPILOT PROMPT BUILDER ────────────────────────────────── */
  function buildAskPrompt(){
    const ask = document.getElementById('askBody').value.trim();
    if (!ask) return alert('Escribí tu pregunta primero.');
    const kind = document.getElementById('askKind').value;
    const kb = loadKB().trim();
    const cases = _load(K_CASES).slice(-3).reverse();
    const errors = _load(K_ERRORS).slice(-3).reverse();

    const kindRoles = {
      reconcile: 'You are a senior reconciliation analyst at Simetrik with 10 years of experience in financial data reconciliation, AP/AR cycles, and FinTech operations.',
      error: 'You are a senior debugging engineer specialized in financial reconciliation systems, particularly Simetrik\'s reconciliation engine.',
      explain: 'You are a senior financial systems instructor. Explain concepts at a level appropriate for a Reconciliations Analyst.',
      learn: 'You are a senior mentor. Teach concretely with concrete Simetrik-relevant examples.',
      review: 'You are a senior reviewer. Audit the request for correctness, edge cases, and process gaps.',
    };

    const role = kindRoles[kind] || kindRoles.explain;

    let prompt = `<role>\n${role}\nRespond in Spanish (es). Be precise, evidence-driven, and actionable.\n</role>\n\n`;

    prompt += '<simetrik_context>\n';
    prompt += '<personal_kb>\n';
    prompt += kb ? kb : '(No personal KB loaded yet — see KB tab in 14-WORK module)';
    prompt += '\n</personal_kb>\n\n';

    if (cases.length){
      prompt += '<recent_cases>\n';
      cases.forEach(c => {
        prompt += `- [${c.severity}/${c.status}] ${c.title}${c.client?' · '+c.client:''}\n  ${c.body.replace(/\n/g,' ').slice(0,200)}${c.body.length>200?'...':''}\n`;
      });
      prompt += '</recent_cases>\n\n';
    }

    if (errors.length){
      prompt += '<recent_errors>\n';
      errors.forEach(e => {
        prompt += `- ${e.title}${e.code?' ['+e.code+']':''}\n  ${(e.body||'').slice(0,150)}${(e.body||'').length>150?'...':''}\n`;
      });
      prompt += '</recent_errors>\n\n';
    }
    prompt += '</simetrik_context>\n\n';

    prompt += '<task>\n' + ask + '\n</task>\n\n';

    prompt += '<rules>\n';
    prompt += '- Respond in Spanish.\n';
    prompt += '- Use the personal_kb + recent_cases + recent_errors as context — they reflect Miguel\'s actual Simetrik environment.\n';
    prompt += '- Cite specific evidence when claiming.\n';
    prompt += '- If the personal_kb is empty or insufficient, say so and ask for the specific info needed.\n';
    prompt += '- No filler, no generic intros.\n';
    prompt += '</rules>\n';

    document.getElementById('askResult').style.display = 'block';
    document.getElementById('askOutput').textContent = prompt;
    document.getElementById('askOutput').dataset.raw = prompt;
  }

  function copyAsk(){
    const raw = document.getElementById('askOutput').dataset.raw;
    if (raw && navigator.clipboard) navigator.clipboard.writeText(raw).then(()=>alert('Copiado'));
  }

  /* ── FORM HELPERS ──────────────────────────────────────────── */
  function clearForm(prefix){
    if (prefix === 'case') {
      ['caseTitle','caseClient','caseBody'].forEach(id => { const el = document.getElementById(id); if (el) el.value=''; });
    } else if (prefix === 'err') {
      ['errTitle','errCode','errBody'].forEach(id => { const el = document.getElementById(id); if (el) el.value=''; });
    } else if (prefix === 'learn') {
      ['learnTitle','learnBody'].forEach(id => { const el = document.getElementById(id); if (el) el.value=''; });
    }
  }

  /* ── RENDER ────────────────────────────────────────────────── */
  function renderCases(){
    const el = document.getElementById('casesList');
    if (!el) return;
    const list = _load(K_CASES).slice().reverse();
    if (!list.length) { el.innerHTML = '<div style="text-align:center;padding:30px;color:var(--t3);font-size:12px">Sin casos aún. Guardá el primero arriba.</div>'; return; }
    el.innerHTML = list.map(c => `
      <div class="item">
        <div class="item-h">
          <div class="item-t">${esc(c.title)}</div>
          <div class="item-meta">
            <span class="tag tag-${c.severity}">${c.severity.toUpperCase()}</span>
            <span class="tag tag-${c.status}">${c.status}</span>
            ${c.client ? `<span class="client-tag">${esc(c.client)}</span>` : ''}
            <span class="item-date">${fmtDate(c.date)}</span>
            <button class="item-del" onclick="WORK.delCase('${c.id}')">✕</button>
          </div>
        </div>
        <div class="item-body">${esc(c.body)}</div>
      </div>`).join('');
  }

  function renderErrors(){
    const el = document.getElementById('errorsList');
    if (!el) return;
    const list = _load(K_ERRORS).slice().reverse();
    if (!list.length) { el.innerHTML = '<div style="text-align:center;padding:30px;color:var(--t3);font-size:12px">Sin errores registrados aún.</div>'; return; }
    el.innerHTML = list.map(e => `
      <div class="item">
        <div class="item-h">
          <div class="item-t">${esc(e.title)}</div>
          <div class="item-meta">
            ${e.code ? `<span class="client-tag">${esc(e.code)}</span>` : ''}
            <span class="item-date">${fmtDate(e.date)}</span>
            <button class="item-del" onclick="WORK.delError('${e.id}')">✕</button>
          </div>
        </div>
        ${e.body ? `<div class="item-body">${esc(e.body)}</div>` : ''}
      </div>`).join('');
  }

  function renderLearnings(){
    const el = document.getElementById('learnList');
    if (!el) return;
    const list = _load(K_LEARN).slice().reverse();
    if (!list.length) { el.innerHTML = '<div style="text-align:center;padding:30px;color:var(--t3);font-size:12px">Sin aprendizajes aún.</div>'; return; }
    el.innerHTML = list.map(l => `
      <div class="item">
        <div class="item-h">
          <div class="item-t">${esc(l.title)}</div>
          <div class="item-meta">
            <span class="tag tag-${l.tag}">${l.tag}</span>
            <span class="item-date">${fmtDate(l.date)}</span>
            <button class="item-del" onclick="WORK.delLearning('${l.id}')">✕</button>
          </div>
        </div>
        <div class="item-body">${esc(l.body)}</div>
      </div>`).join('');
  }

  function renderStats(){
    const set = (id,v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('sCases', _load(K_CASES).length);
    set('sErrors', _load(K_ERRORS).length);
    set('sLearn', _load(K_LEARN).length);
    let nbCount = 0; try { nbCount = JSON.parse(localStorage.getItem('work_nb_meta')||'[]').length; } catch {}
    set('sNbs', nbCount);
  }

  function render(){
    renderStats();
    renderCases();
    renderErrors();
    renderLearnings();
    const kbField = document.getElementById('kbBody');
    if (kbField && !kbField.value) kbField.value = loadKB();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
  else setTimeout(render, 0);

  return {
    saveCase, delCase, saveError, delError, saveLearning, delLearning,
    saveKB, buildAskPrompt, copyAsk, clearForm, render,
  };
})();
window.WORK = WORK;

/* ═══════════════════════════════════════════════════════════════
   WorkNB — wrapper around the same NB pattern as NotNB but with
   work_nb_meta / work_nb_data namespacing and 'workNb*' DOM IDs.
   Mirrors notes-nb.js feature set: covers, design picker, IDB images,
   attachments, auto-save, rich-text toolbar.
═══════════════════════════════════════════════════════════════ */
const WorkNB = (function(){
  'use strict';

  const META_KEY = 'work_nb_meta';
  const DATA_KEY = 'work_nb_data';
  const ACTIVE_KEY = 'work_nb_active';
  const PALETTE = ['#06b6d4','#10b981','#8b5cf6','#f59e0b','#ec4899','#6366f1','#14b8a6','#ef4444'];

  let activeNbId = (function(){ try { return localStorage.getItem(ACTIVE_KEY) || null; } catch { return null; } })();
  let activePageId = null;
  const saveTimers = {};

  function esc(s){ const d=document.createElement('div'); d.textContent=s==null?'':s; return d.innerHTML; }
  function loadMeta(){ try { return JSON.parse(localStorage.getItem(META_KEY)||'[]'); } catch { return []; } }
  function saveMeta(m){ localStorage.setItem(META_KEY, JSON.stringify(m)); }
  function loadData(){ try { return JSON.parse(localStorage.getItem(DATA_KEY)||'{}'); } catch { return {}; } }
  function saveData(d){
    const json = JSON.stringify(d);
    try { localStorage.setItem(DATA_KEY, json); }
    catch(e){
      if (e && (e.name==='QuotaExceededError' || /quota/i.test(e.message||''))) {
        alert('💾 Almacenamiento local lleno.\nLas imágenes nuevas se almacenan en IndexedDB para evitar este problema.\nEliminá imágenes/páginas viejas si seguís viendo este mensaje.');
        throw e;
      }
      throw e;
    }
  }
  function getPages(id){ const d=loadData(); return (d[id] && d[id].pages) || []; }
  function setActive(id){ activeNbId = id || null; try { localStorage.setItem(ACTIVE_KEY, activeNbId||''); } catch {} if (window.WORK) WORK.render(); }

  /* ── Design picker ────────────────────────────────────────── */
  async function openDesignPicker(){
    if (!window.NBShared) return alert('Módulo de diseño no cargado.');
    const iconH = document.getElementById('workNbIconValue');
    const coverH = document.getElementById('workNbCoverValue');
    const nameInp = document.getElementById('workNbName');
    const r = await NBShared.openDesignModal({
      cover: coverH?.value || 'c6',
      icon: iconH?.value || '💼',
      name: nameInp?.value || '',
    });
    if (!r) return;
    if (iconH) iconH.value = r.icon;
    if (coverH) coverH.value = r.cover;
    refreshNewFormPreview();
  }
  function refreshNewFormPreview(){
    const iconH = document.getElementById('workNbIconValue');
    const coverH = document.getElementById('workNbCoverValue');
    const previewEl = document.getElementById('workNbDesignPreview');
    const iconEl = document.getElementById('workNbDesignIconPreview');
    if (previewEl && coverH) previewEl.className = 'nb-cover-' + coverH.value;
    if (iconEl && iconH) iconEl.textContent = iconH.value;
  }
  async function editDesign(id){
    if (!window.NBShared) return;
    const list = loadMeta(); const nb = list.find(n => n.id === id); if (!nb) return;
    const r = await NBShared.openDesignModal({ cover: nb.cover || 'c6', icon: nb.icon, name: nb.name });
    if (!r) return;
    nb.cover = r.cover; nb.icon = r.icon; nb.updated = new Date().toISOString();
    saveMeta(list); render();
  }

  /* ── CRUD ─────────────────────────────────────────────────── */
  function create(){
    const nameInp = document.getElementById('workNbName');
    const iconV = (document.getElementById('workNbIconValue')||{}).value || '💼';
    const coverV = (document.getElementById('workNbCoverValue')||{}).value || 'c6';
    const name = (nameInp?.value || '').trim();
    if (!name) { alert('Dale un nombre al cuaderno.'); return; }
    const list = loadMeta();
    const id = 'work_nb_' + Date.now();
    list.push({ id, name, icon: iconV, cover: coverV, color: PALETTE[list.length % PALETTE.length], created: new Date().toISOString() });
    saveMeta(list);
    const data = loadData(); data[id] = { pages: [] }; saveData(data);
    if (nameInp) nameInp.value = '';
    setActive(id); activePageId = null; render();
  }
  function rename(id){
    const list = loadMeta(); const nb = list.find(n => n.id === id); if (!nb) return;
    const next = prompt('Nombre del cuaderno:', nb.name);
    if (!next || !next.trim()) return;
    nb.name = next.trim(); nb.updated = new Date().toISOString();
    saveMeta(list); render();
  }
  function remove(id){
    const list = loadMeta(); const nb = list.find(n => n.id === id); if (!nb) return;
    if (!confirm(`¿Eliminar "${nb.name}" y todo su contenido?`)) return;
    saveMeta(list.filter(n => n.id !== id));
    const data = loadData();
    if (data[id] && window.NBShared) {
      (data[id].pages || []).forEach(p => {
        (p.images||[]).forEach(im => { if (im.id) NBShared.deleteImage(im.id).catch(()=>{}); });
        (p.attachments||[]).forEach(a => NBShared.deleteBlob(a.id).catch(()=>{}));
      });
    }
    delete data[id]; saveData(data);
    if (activeNbId === id) { setActive(null); activePageId = null; }
    render();
  }
  function selectActive(id){ setActive(id); activePageId = null; render(); }

  /* ── PAGE OPS ─────────────────────────────────────────────── */
  function newPage(nbId){
    const data = loadData();
    if (!data[nbId]) data[nbId] = { pages: [] };
    const page = { id: Date.now(), title: '', body: '', images: [], attachments: [], links: [], created: new Date().toISOString(), updated: new Date().toISOString() };
    data[nbId].pages.unshift(page); saveData(data);
    activePageId = page.id; render();
  }
  async function openPage(nbId, pid){
    activePageId = pid;
    if (window.NBShared) {
      try {
        const data = loadData();
        const page = (data[nbId]||{pages:[]}).pages.find(p => p.id === pid);
        if (page && page.images && page.images.some(im => im && im.data && !im.id)) {
          await NBShared.migrateLegacyImages(page);
          if (page._migrated) { delete page._migrated; saveData(data); }
        }
      } catch(e){}
    }
    render();
  }
  function deletePage(nbId, pid){
    if (!confirm('¿Eliminar esta página?')) return;
    const data = loadData();
    if (!data[nbId]) return;
    const page = data[nbId].pages.find(p => p.id === pid);
    if (page && window.NBShared) {
      (page.images||[]).forEach(im => { if (im.id) NBShared.deleteImage(im.id).catch(()=>{}); });
      (page.attachments||[]).forEach(a => NBShared.deleteBlob(a.id).catch(()=>{}));
    }
    data[nbId].pages = data[nbId].pages.filter(p => p.id !== pid);
    saveData(data);
    if (activePageId === pid) activePageId = null;
    render();
  }
  function autoSave(nbId){
    clearTimeout(saveTimers[nbId]);
    saveTimers[nbId] = setTimeout(() => {
      if (!activePageId) return;
      const data = loadData();
      if (!data[nbId]) return;
      const page = data[nbId].pages.find(p => p.id === activePageId);
      if (!page) return;
      const tIn = document.getElementById('nbTitle-' + nbId);
      const bIn = document.getElementById('nbBody-' + nbId);
      if (tIn) page.title = tIn.value;
      if (bIn) page.body = bIn.innerHTML;
      page.updated = new Date().toISOString();
      saveData(data);
      const badge = document.getElementById('nbSaved-' + nbId);
      if (badge) { badge.classList.add('on'); clearTimeout(badge._t); badge._t = setTimeout(()=>badge.classList.remove('on'), 1200); }
    }, 500);
  }

  /* ── RICH-TEXT ────────────────────────────────────────────── */
  function focusEditor(nbId){
    const bIn = document.getElementById('nbBody-' + nbId);
    if (!bIn) return null;
    if (document.activeElement !== bIn) bIn.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      const r = document.createRange(); r.selectNodeContents(bIn); r.collapse(false);
      sel.removeAllRanges(); sel.addRange(r);
    }
    return bIn;
  }
  function fmt(nbId, kind, value){
    const bIn = focusEditor(nbId); if (!bIn) return;
    try {
      if (kind === 'bold') document.execCommand('bold', false, null);
      else if (kind === 'size') {
        const map = { s:'2', m:'3', l:'5' };
        document.execCommand('fontSize', false, map[value] || '3');
      } else if (kind === 'hl') {
        const map = { y:'#fff59d', g:'#a5d6a7', p:'#f8bbd0' };
        try { document.execCommand('styleWithCSS', false, true); } catch(e){}
        document.execCommand('foreColor', false, '#1a1a1a');
        if (!document.execCommand('hiliteColor', false, map[value] || '#fff59d')) {
          document.execCommand('backColor', false, map[value] || '#fff59d');
        }
      } else if (kind === 'clear') {
        document.execCommand('removeFormat', false, null);
      }
    } catch(e){}
    autoSave(nbId);
  }
  function insertLabel(nbId, type){
    const bIn = focusEditor(nbId); if (!bIn) return;
    const html = type === 'urgent'
      ? '<span class="rt-label rt-lbl-urgent" contenteditable="false" onclick="WorkNB.removeLabelEl(this,\''+nbId+'\')">⚠ URGENTE</span>&nbsp;'
      : '<span class="rt-label rt-lbl-done" contenteditable="false" onclick="WorkNB.removeLabelEl(this,\''+nbId+'\')">✓ HECHO</span>&nbsp;';
    try { document.execCommand('insertHTML', false, html); } catch(e){}
    autoSave(nbId);
  }
  function removeLabelEl(el, nbId){ if (el && el.parentNode) el.parentNode.removeChild(el); autoSave(nbId); }

  /* ── LINKS ────────────────────────────────────────────────── */
  function addLink(nbId){
    if (!activePageId) return alert('Primero abrí una página.');
    const url = prompt('URL:'); if (!url) return;
    const label = prompt('Nombre:') || url;
    const data = loadData();
    const page = data[nbId].pages.find(p => p.id === activePageId);
    if (!page.links) page.links = [];
    page.links.push({ url, label, added: new Date().toISOString() });
    page.updated = new Date().toISOString(); saveData(data); render();
  }
  function removeLink(nbId, idx){
    const data = loadData();
    const page = data[nbId].pages.find(p => p.id === activePageId);
    if (!page || !page.links) return;
    page.links.splice(idx, 1); page.updated = new Date().toISOString(); saveData(data); render();
  }

  /* ── IMAGES (IDB-backed) ──────────────────────────────────── */
  async function addImage(nbId){
    if (!activePageId) return alert('Primero abrí una página.');
    if (!window.NBShared) return alert('Módulo no cargado.');
    const rec = await NBShared.pickImageRecordViaModal();
    if (!rec) return;
    const data = loadData();
    const page = data[nbId].pages.find(p => p.id === activePageId);
    if (!page.images) page.images = [];
    page.images.push({ id: rec.id, thumbnail: rec.thumbnail, caption: rec.caption||rec.name||'', size: rec.size, addedAt: rec.addedAt });
    page.updated = new Date().toISOString(); saveData(data); render();
  }
  function renameImage(nbId, idx){
    const data = loadData();
    const page = data[nbId].pages.find(p => p.id === activePageId);
    if (!page || !page.images || !page.images[idx]) return;
    const next = prompt('Nombre/descripción:', page.images[idx].caption || '');
    if (next === null) return;
    page.images[idx].caption = next;
    page.updated = new Date().toISOString(); saveData(data); render();
  }
  async function removeImage(nbId, idx){
    if (!confirm('¿Eliminar imagen?')) return;
    const data = loadData();
    const page = data[nbId].pages.find(p => p.id === activePageId);
    if (!page) return;
    const im = page.images[idx];
    if (im && im.id && window.NBShared) { try { await NBShared.deleteImage(im.id); } catch(e){} }
    page.images.splice(idx, 1);
    page.updated = new Date().toISOString(); saveData(data); render();
  }
  async function viewImage(nbId, idx){
    const data = loadData();
    const page = data[nbId].pages.find(p => p.id === activePageId);
    if (!page || !page.images || !page.images[idx]) return;
    const im = page.images[idx];
    const fullUrl = window.NBShared ? await NBShared.resolveImageData(im) : (im.data || im.thumbnail);
    if (!fullUrl) return alert('Imagen original no disponible en este dispositivo.');
    let lb = document.getElementById('workNbLightbox');
    if (!lb) {
      lb = document.createElement('div');
      lb.id = 'workNbLightbox';
      lb.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.92);backdrop-filter:blur(8px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:40px;cursor:zoom-out';
      lb.onclick = () => lb.remove();
      document.body.appendChild(lb);
    }
    lb.innerHTML = `<img src="${fullUrl}" style="max-width:95vw;max-height:90vh;border-radius:8px"><div style="position:fixed;bottom:20px;left:50%;transform:translateX(-50%);color:#fff;font-family:'IBM Plex Mono',monospace;font-size:12px;background:rgba(0,0,0,.6);padding:8px 16px;border-radius:6px">${esc(im.caption||'')}</div>`;
  }

  /* ── ATTACHMENTS ──────────────────────────────────────────── */
  async function attachFile(nbId){
    if (!window.NBShared) return alert('Módulo no cargado.');
    if (!activePageId) return alert('Primero abrí una página.');
    const meta = await NBShared.pickAttachmentViaModal('work_'+nbId+'_'+activePageId);
    if (!meta) return;
    const data = loadData();
    const page = data[nbId].pages.find(p => p.id === activePageId);
    if (!page.attachments) page.attachments = [];
    page.attachments.push(meta);
    page.updated = new Date().toISOString(); saveData(data); render();
  }
  async function removeAttachment(nbId, attId){
    if (!confirm('¿Eliminar adjunto?')) return;
    const data = loadData();
    const page = data[nbId].pages.find(p => p.id === activePageId);
    if (!page) return;
    page.attachments = (page.attachments||[]).filter(a => a.id !== attId);
    page.updated = new Date().toISOString(); saveData(data);
    if (window.NBShared) { try { await NBShared.deleteImage(attId); } catch(e){} try { await NBShared.deleteBlob(attId); } catch(e){} }
    render();
  }

  /* ── RENDER ───────────────────────────────────────────────── */
  function renderBodyContent(body){ if (!body) return ''; if (/<[a-z][^>]*>/i.test(body)) return body; return esc(body); }
  function renderLinks(nbId, page){
    if (!page.links || !page.links.length) return '<div style="font-size:11px;color:var(--t3);padding:4px 0">Sin links.</div>';
    return page.links.map((l, i) =>
      `<div class="nb-link"><span class="nb-link-icon">🔗</span><div style="flex:1;min-width:0"><div style="font-size:12px">${esc(l.label)}</div><a href="${esc(l.url)}" target="_blank" rel="noopener" class="nb-link-url">${esc(l.url)}</a></div><button onclick="WorkNB.removeLink('${nbId}',${i})" style="background:none;border:none;color:var(--t3);cursor:pointer">✕</button></div>`
    ).join('');
  }
  function renderImages(nbId, page){
    if (!page.images || !page.images.length) return '<div style="font-size:11px;color:var(--t3);padding:4px 0;grid-column:1/-1">Sin imágenes.</div>';
    return page.images.map((im, i) => {
      const src = im.thumbnail || im.data || '';
      const orphan = im.id && !im.thumbnail && !im.data;
      return `<div class="nb-img-card">
        <button class="nb-img-del" onclick="event.stopPropagation();WorkNB.removeImage('${nbId}',${i})">✕</button>
        <button class="nb-img-rename" onclick="event.stopPropagation();WorkNB.renameImage('${nbId}',${i})">✏</button>
        ${orphan?'<div style="aspect-ratio:1;background:var(--el);display:flex;align-items:center;justify-content:center;color:var(--t3);font-size:11px;text-align:center">📷<br>Solo en otro<br>dispositivo</div>':`<img src="${src}" alt="${esc(im.caption)}" onclick="WorkNB.viewImage('${nbId}',${i})">`}
        <div class="nb-img-caption">${esc(im.caption||'Sin nombre')}</div>
      </div>`;
    }).join('');
  }
  function renderAttachments(nbId, page){
    if (!window.NBShared) return '';
    return NBShared.renderAttachmentChips((page&&page.attachments)||[], { onRemove: "WorkNB.removeAttachment.bind(null,'"+nbId+"')" });
  }

  function buildEditorHtml(nbId, page){
    if (!page) return '';
    return `<div class="nb-rt-toolbar">
        <button class="nb-rt-btn" onclick="WorkNB.fmt('${nbId}','bold')"><b>B</b></button>
        <span class="nb-rt-sep"></span>
        <button class="nb-rt-btn nb-rt-sz-s" onclick="WorkNB.fmt('${nbId}','size','s')">S</button>
        <button class="nb-rt-btn nb-rt-sz-m" onclick="WorkNB.fmt('${nbId}','size','m')">M</button>
        <button class="nb-rt-btn nb-rt-sz-l" onclick="WorkNB.fmt('${nbId}','size','l')">L</button>
        <span class="nb-rt-sep"></span>
        <button class="nb-rt-btn nb-rt-hl nb-rt-hl-y" onclick="WorkNB.fmt('${nbId}','hl','y')"></button>
        <button class="nb-rt-btn nb-rt-hl nb-rt-hl-g" onclick="WorkNB.fmt('${nbId}','hl','g')"></button>
        <button class="nb-rt-btn nb-rt-hl nb-rt-hl-p" onclick="WorkNB.fmt('${nbId}','hl','p')"></button>
        <button class="nb-rt-btn" onclick="WorkNB.fmt('${nbId}','clear')">✕</button>
        <span class="nb-rt-sep"></span>
        <button class="nb-rt-btn nb-rt-lbl nb-rt-lbl-u" onclick="WorkNB.insertLabel('${nbId}','urgent')">⚠ URGENTE</button>
        <button class="nb-rt-btn nb-rt-lbl nb-rt-lbl-d" onclick="WorkNB.insertLabel('${nbId}','done')">✓ HECHO</button>
      </div>
      <div class="nb-page" style="margin-bottom:12px">
        <div class="nb-header">
          <input class="nb-title-inp" id="nbTitle-${nbId}" value="${esc(page.title||'').replace(/"/g,'&quot;')}" placeholder="Título..." oninput="WorkNB.autoSave('${nbId}')">
          <span class="nb-saved" id="nbSaved-${nbId}">✓ guardado</span>
          <span class="nb-date">${new Date(page.created).toLocaleDateString('es',{day:'numeric',month:'short',year:'numeric'})}</span>
        </div>
        <div class="nb-spine"></div>
        <div class="nb-holes"><div class="nb-hole" style="top:24px"></div><div class="nb-hole" style="top:72px"></div><div class="nb-hole" style="top:120px"></div><div class="nb-hole" style="top:168px"></div><div class="nb-hole" style="top:216px"></div><div class="nb-hole" style="top:264px"></div><div class="nb-hole" style="top:312px"></div><div class="nb-hole" style="top:360px"></div></div>
        <div class="nb-margin"></div>
        <div class="nb-content" id="nbBody-${nbId}" contenteditable="true" data-placeholder="Escribe aquí..." oninput="WorkNB.autoSave('${nbId}')">${renderBodyContent(page.body)}</div>
      </div>
      <div class="lb">· links ·</div>
      <div>${renderLinks(nbId, page)}</div>
      <div class="lb">· archivos · <span style="font-size:9px;color:var(--t3);text-transform:none">(local)</span></div>
      <div class="nb-att-list">${renderAttachments(nbId, page)}</div>
      <div class="lb">· imágenes ·</div>
      <div class="nb-images">${renderImages(nbId, page)}</div>`;
  }

  function renderEditor(nb){
    const pages = getPages(nb.id);
    const page = activePageId ? pages.find(p => p.id === activePageId) : null;
    const pagesList = pages.length ? pages.map(p => {
      const preview = (p.body||'').replace(/<[^>]*>/g,'').substring(0,70);
      const isActive = activePageId === p.id;
      return `<div class="nb-entry${isActive?' open':''}">
        <div class="nb-entry-h" onclick="WorkNB.openPage('${nb.id}',${p.id})">
          <div style="min-width:0;flex:1">
            <div class="nb-entry-title">${esc(p.title||'Sin título')}</div>
            <div style="font-size:10px;color:var(--t3);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(preview)}${preview.length>=70?'…':''}</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
            <span class="nb-entry-date">${new Date(p.updated||p.created).toLocaleDateString('es',{day:'numeric',month:'short'})}</span>
            <span style="font-size:10px;color:var(--t3)">${(p.images||[]).length?'🖼'+p.images.length:''} ${(p.attachments||[]).length?'📎'+p.attachments.length:''}</span>
            <button onclick="event.stopPropagation();WorkNB.deletePage('${nb.id}',${p.id})" style="background:none;border:none;color:var(--t3);cursor:pointer">🗑</button>
          </div>
        </div>
      </div>`;
    }).join('') : '<div style="text-align:center;padding:14px;color:var(--t3);font-size:11px">Sin páginas.</div>';

    const editor = buildEditorHtml(nb.id, page);
    return `<div class="cd" style="border-left:3px solid ${nb.color||'#06b6d4'};padding:0;overflow:hidden">
      <div class="nb-cover-card nb-cover-${nb.cover||'c6'}">
        <div class="nb-cover-icon">${nb.icon}</div>
        <div>
          <div class="nb-cover-title">${esc(nb.name)}</div>
          <div class="nb-cover-sub">${pages.length} página${pages.length!==1?'s':''}</div>
        </div>
      </div>
      <div style="padding:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:6px">
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button class="btn bp" onclick="WorkNB.newPage('${nb.id}')">+ Nueva página</button>
            ${page?`<button class="btn bo" onclick="WorkNB.addLink('${nb.id}')">🔗 Link</button>
            <button class="btn bo" onclick="WorkNB.addImage('${nb.id}')">🖼️ Imagen</button>
            <button class="btn bo" onclick="WorkNB.attachFile('${nb.id}')">📎 Adjuntar</button>`:''}
          </div>
          <div style="display:flex;gap:4px">
            <button class="btn bo bs" onclick="WorkNB.editDesign('${nb.id}')">🎨</button>
            <button class="btn bo bs" onclick="WorkNB.rename('${nb.id}')">✏️</button>
            <button class="btn bo bs" onclick="WorkNB.remove('${nb.id}')" style="border-color:rgba(239,68,68,.3);color:var(--rd)">🗑</button>
          </div>
        </div>
        ${editor || '<div style="text-align:center;padding:20px;color:var(--t3);font-size:12px;border:1px dashed var(--bd);border-radius:8px">Crea una página para empezar.</div>'}
        <div class="lb" style="margin-top:14px">· páginas ·</div>
        <div class="nb-entries">${pagesList}</div>
      </div>
    </div>`;
  }

  function render(){
    refreshNewFormPreview();
    const list = loadMeta();
    const wrap = document.getElementById('workNbWrap');
    if (!wrap) return;
    if (!list.length){
      wrap.innerHTML = `<div class="cd" style="text-align:center;padding:40px 20px;color:var(--t3);border-style:dashed">
        <div style="font-size:32px;margin-bottom:8px">📓</div>
        <div style="font-size:14px;font-weight:600;color:var(--tx);margin-bottom:4px">Sin cuadernos aún</div>
        <div style="font-size:12px">Crea uno para empezar a documentar tu trabajo en Simetrik.</div>
      </div>`;
      return;
    }
    if (!activeNbId || !list.find(n => n.id === activeNbId)) {
      activeNbId = list[0].id;
      try { localStorage.setItem(ACTIVE_KEY, activeNbId); } catch {}
    }
    const nb = list.find(n => n.id === activeNbId);
    const options = list.map(n => `<option value="${n.id}"${n.id===activeNbId?' selected':''}>${n.icon} ${esc(n.name)}</option>`).join('');
    wrap.innerHTML = `<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap">
        <label style="font-size:11px;color:var(--t3);font-family:'IBM Plex Mono',monospace">CUADERNO →</label>
        <select onchange="WorkNB.selectActive(this.value)" style="flex:1;min-width:200px;background:var(--el);border:1px solid var(--bd);border-radius:7px;color:var(--tx);padding:7px 10px;font-family:inherit;font-size:13px">${options}</select>
      </div>
      ${renderEditor(nb)}`;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
  else setTimeout(render, 0);

  return {
    create, rename, remove, render, selectActive,
    openDesignPicker, refreshNewFormPreview, editDesign,
    newPage, openPage, deletePage, autoSave,
    fmt, insertLabel, removeLabelEl,
    addLink, removeLink,
    addImage, renameImage, removeImage, viewImage,
    attachFile, removeAttachment,
  };
})();
window.WorkNB = WorkNB;
