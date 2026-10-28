/* ════════════════════════════════════════════════════════════
   DA-2026 · 14-WORK · cascarón público (desde 2026-10-28)
   ────────────────────────────────────────────────────────────
   El material del módulo salió del repositorio público. Queda solo el
   editor de cuadernos: sus datos (work_nb_meta / work_nb_data) viven en
   el navegador de Miguel y en su cuenta de Supabase, nunca en el repo.
   Los demás registros work_* siguen sincronizando (cloud-sync) y aquí
   solo se cuentan, para que se vea que no se perdieron.
═════════════════════════════════════════════════════════════ */
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
    try { localStorage.setItem(DATA_KEY, JSON.stringify(d)); }
    catch(e){
      if (e && (e.name==='QuotaExceededError' || /quota/i.test(e.message||''))) {
        if (window.NBShared && NBShared.quotaAlert) NBShared.quotaAlert(DATA_KEY, () => { if (window.WorkNB && WorkNB.render) WorkNB.render(); });
        else alert('💾 El navegador se quedó sin espacio para el Cerebro (todos los módulos comparten ese espacio). No cierres esta pestaña y libera espacio.');
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
  function selectActive(id){ if (activeNbId) _flushPending(activeNbId); setActive(id); activePageId = null; render(); }

  /* Move notebook to another module (NB-ENGINE standard) */
  function moveNotebook(id){
    if (!window.NBEngine) { alert('Motor de cuadernos no cargado.'); return; }
    NBEngine.transferUI(id, '14-WORK', () => {
      if (activeNbId === id) { setActive(null); activePageId = null; }
      render();
    });
  }

  /* ── PAGE OPS ─────────────────────────────────────────────── */
  function newPage(nbId){
    _flushPending(nbId);
    const data = loadData();
    if (!data[nbId]) data[nbId] = { pages: [] };
    const page = { id: Date.now(), title: '', body: '', images: [], attachments: [], links: [], created: new Date().toISOString(), updated: new Date().toISOString() };
    data[nbId].pages.unshift(page); saveData(data);
    activePageId = page.id; render();
  }
  async function openPage(nbId, pid){
    _flushPending(nbId);
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
    _flushPending(nbId);
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
  function _commitNow(nbId){
    if (!activePageId) return;
    const data = loadData();
    if (!data[nbId]) return;
    const page = data[nbId].pages.find(p => p.id === activePageId);
    if (!page) return;
    const tIn = document.getElementById('nbTitle-' + nbId);
    const bIn = document.getElementById('nbBody-' + nbId);
    const newTitle = tIn ? tIn.value : page.title;
    const newBody  = bIn ? bIn.innerHTML : page.body;
    // Sin cambios reales → NO re-sellar updated (evita envenenar el merge cross-device)
    if (newTitle === page.title && newBody === page.body) return;
    page.title = newTitle;
    page.body  = newBody;
    page.updated = new Date().toISOString();
    saveData(data);
    const badge = document.getElementById('nbSaved-' + nbId);
    if (badge) { badge.classList.add('on'); clearTimeout(badge._t); badge._t = setTimeout(()=>badge.classList.remove('on'), 1200); }
  }
  function autoSave(nbId){
    clearTimeout(saveTimers[nbId]);
    saveTimers[nbId] = setTimeout(() => _commitNow(nbId), 500);
  }
  /* Flush ANTES de mover activePageId: un timer pendiente que dispare después
     del cambio de página buscaría la página nueva y descartaría la edición
     (las mutaciones vía toolbar no pasan por focusout). */
  function _flushPending(nbId){
    if (saveTimers[nbId]) { clearTimeout(saveTimers[nbId]); delete saveTimers[nbId]; _commitNow(nbId); }
  }
  function flushAll(){
    Object.keys(saveTimers).forEach(nbId => {
      clearTimeout(saveTimers[nbId]);
      _commitNow(nbId);
    });
  }
  // Flush on blur / tab hide / unload to prevent data loss
  window.addEventListener('beforeunload', flushAll);
  document.addEventListener('visibilitychange', () => { if (document.hidden) flushAll(); });
  document.addEventListener('focusout', (e) => {
    const t = e.target;
    if (t && (t.id||'').startsWith('nbBody-')) {
      const nbId = t.id.slice(7); _commitNow(nbId);
    } else if (t && (t.id||'').startsWith('nbTitle-')) {
      const nbId = t.id.slice(8); _commitNow(nbId);
    }
  });

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
    // Comandos extendidos centralizados (listas, checklist, hr)
    if (window.NBShared && NBShared.fmtExtended && NBShared.fmtExtended(kind)) {
      autoSave(nbId);
      return;
    }
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
    page.updated = new Date().toISOString(); saveData(data);
    if (window.CLOUD && window.CLOUD.pushNow) window.CLOUD.pushNow('work_nb_data').catch(()=>{});
    render();
  }
  async function removeAttachment(nbId, attId){
    if (!confirm('¿Eliminar adjunto?')) return;
    const data = loadData();
    if (!data[nbId]) { console.warn('[WorkNB] removeAttachment: notebook not found', nbId); return; }
    // Buscar el attachment en activePageId primero, sino en todas las páginas
    let pageHit = null;
    if (activePageId) {
      const p = data[nbId].pages.find(p => p.id === activePageId);
      if (p && (p.attachments||[]).some(a => a.id === attId)) pageHit = p;
    }
    if (!pageHit) {
      // Fallback: buscar en TODAS las páginas del cuaderno
      pageHit = data[nbId].pages.find(p => (p.attachments||[]).some(a => a.id === attId));
    }
    if (!pageHit) {
      console.warn('[WorkNB] removeAttachment: attachment id no encontrado en ninguna página', { nbId, attId, activePageId });
      alert('No se encontró el adjunto en ninguna página de este cuaderno. Probable causa: el ID local quedó desincronizado. Refresca la página (F5) e intentalo de nuevo.');
      return;
    }
    const before = pageHit.attachments.length;
    pageHit.attachments = pageHit.attachments.filter(a => a.id !== attId);
    const after = pageHit.attachments.length;
    console.log('[WorkNB] removeAttachment · page', pageHit.id, '· attachments', before, '→', after, '· removed id:', attId);
    pageHit.updated = new Date().toISOString();
    saveData(data);
    if (window.NBShared) { try { await NBShared.deleteImage(attId); } catch(e){} try { await NBShared.deleteBlob(attId); } catch(e){} }
    // Push inmediato del cambio en work_nb_data
    if (window.CLOUD && window.CLOUD.pushNow) {
      const r = await window.CLOUD.pushNow('work_nb_data');
      console.log('[WorkNB] pushNow work_nb_data after delete:', r);
      if (!r.ok) alert('⚠️ Borrado localmente pero NO se subió al cloud · '+(r.detail||r.reason)+'\n\nEl cambio puede revertirse al refrescar. Click "⬆ Subir al cloud" arriba.');
    }
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
    const toolbarHtml = (window.NBShared && NBShared.toolbarHtml) ? NBShared.toolbarHtml(nbId, 'WorkNB') : '';
    return `${toolbarHtml}
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
    return `<div class="nb-shell" style="border-left:3px solid ${nb.color||'#06b6d4'};padding:0;overflow:visible">
      <div class="nb-cover-card nb-cover-${nb.cover||'c6'}">
        <div class="nb-cover-icon">${nb.icon}</div>
        <div>
          <div class="nb-cover-title">${esc(nb.name)}</div>
          <div class="nb-cover-sub">${pages.length} página${pages.length!==1?'s':''}</div>
        </div>
      </div>
      <div style="padding:14px">
        <div class="nb-perso">
          <div class="nb-perso-t">⚙️ Personalización</div>
          <div class="nb-perso-actions">
            <button onclick="WorkNB.editDesign('${nb.id}')" title="Cambiar portada/ícono">🎨 Diseño</button>
            <button onclick="WorkNB.rename('${nb.id}')" title="Renombrar">✏️ Nombre</button>
            <button onclick="WorkNB.moveNotebook('${nb.id}')" title="Mover a otro módulo">📦 Mover</button>
            <button onclick="WorkNB.remove('${nb.id}')" class="nb-perso-del" title="Eliminar cuaderno">🗑</button>
          </div>
        </div>

        <div class="nb-drop on" id="nbDrop-${nb.id}">
          <div class="nb-drop-h" onclick="NBShared.toggleCollapse('nbDrop-${nb.id}')">
            <div>📓 Contenido <span class="nb-drop-count">(${pages.length} página${pages.length!==1?'s':''})</span></div>
            <span class="nb-drop-arr">▶</span>
          </div>
          <div class="nb-drop-body">
            <div class="nb-inner-toolbar">
              <button class="btn bp" onclick="WorkNB.newPage('${nb.id}')">+ Nueva página</button>
              ${(window.NBShared && NBShared.pageJumpHtml) ? NBShared.pageJumpHtml({ nbId: nb.id, ns:'WorkNB', pages, activePageId: activePageId }) : ''}
            </div>
            ${editor || '<div style="text-align:center;padding:20px;color:var(--t3);font-size:12px;border:1px dashed var(--bd);border-radius:8px">Crea una página para empezar.</div>'}
            <div class="nb-pages-label">· páginas ·</div>
            <div class="nb-entries">${pagesList}</div>
          </div>
        </div>
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
        <div style="font-size:12px">Crea uno para empezar a documentar tu trabajo.</div>
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
    // Attach paste-cleaner + checklist toggle a todos los editores recién renderizados.
    if (window.NBShared && NBShared.attachEditorHandlers) {
      wrap.querySelectorAll('.nb-content[contenteditable="true"]').forEach(el => NBShared.attachEditorHandlers(el));
    }
    // Page selector bar · arrows + auto-scroll a tab activa
    if (window.NBShared && NBShared.wirePageBar) NBShared.wirePageBar(wrap);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
  else setTimeout(render, 0);

  return {
    create, rename, remove, render, selectActive, moveNotebook,
    openDesignPicker, refreshNewFormPreview, editDesign,
    newPage, openPage, deletePage, autoSave,
    fmt, insertLabel, removeLabelEl,
    addLink, removeLink,
    addImage, renameImage, removeImage, viewImage,
    attachFile, removeAttachment,
  };
})();
window.WorkNB = WorkNB;

/* Conteo de los registros privados que hoy no tienen pantalla. Solo lee. */
const WorkShell = (function(){
  'use strict';
  const KEYS = [
    ['work_cases', 'Casos'], ['work_errors', 'Errores'], ['work_learnings', 'Aprendizajes'],
    ['work_impl', 'Implementaciones'], ['work_moif_meetings', 'Reuniones'], ['work_eco_dict', 'Diccionario'],
    ['work_kb', 'Apuntes libres'], ['work_eco_workflow', 'Notas de workflow'], ['work_eco_course', 'Notas de curso'],
  ];
  function count(key){
    let raw = null;
    try { raw = localStorage.getItem(key); } catch { return null; }
    if (raw == null || raw === '') return 0;
    try {
      const v = JSON.parse(raw);
      if (Array.isArray(v)) return v.length;
      if (typeof v === 'string') return v.trim() ? 1 : 0;
      if (v && typeof v === 'object') return Object.keys(v).length;
    } catch {}
    return raw.trim() ? 1 : 0;
  }
  function render(){
    const el = document.getElementById('workPrivateCounts');
    if (!el) return;
    const nbs = count('work_nb_meta');
    const sNbs = document.getElementById('sNbs');
    if (sNbs) sNbs.textContent = nbs == null ? '—' : nbs;
    el.innerHTML = KEYS.map(([k, label]) => {
      const n = count(k);
      return '<div class="st"><div class="sv">' + (n == null ? '—' : n) + '</div><div class="sla">' + label + '</div></div>';
    }).join('');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
  else setTimeout(render, 0);
  return { render };
})();
window.WorkShell = WorkShell;

/* Re-render tras sincronizar, nunca mientras se escribe: el re-render
   reconstruye el contenteditable y borra lo tipeado. Lo diferido se aplica
   al salir del editor (después del autosave de 500 ms). */
(function(){
  let pending = false;
  function editing(){
    const a = document.activeElement;
    return !!(a && (a.isContentEditable || a.tagName === 'INPUT' || a.tagName === 'TEXTAREA'));
  }
  function refresh(){
    try { WorkShell.render(); } catch(e){ console.warn(e); }
    if (editing()) { pending = true; return; }
    pending = false;
    try { WorkNB.render(); } catch(e){ console.warn(e); }
  }
  document.addEventListener('focusout', () => {
    if (!pending) return;
    setTimeout(() => { if (pending && !editing()) refresh(); }, 700);
  }, true);
  ['cloud:sync_complete', 'cloud:force_resynced', 'cloud:auto_resynced'].forEach(ev => window.addEventListener(ev, refresh));
  window.addEventListener('cloud:realtime_change', (e) => {
    const k = e.detail && e.detail.key;
    if (k && k.indexOf('work_') === 0) refresh();
  });
})();
