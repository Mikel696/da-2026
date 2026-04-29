/* ═══════════════════════════════════════════════════════════════
   DA-2026 · 13-NOT · Cuadernos (Notebook sub-module)
   ─────────────────────────────────────────────────────────────
   Identical editor UX as 10-SYS: spiral binding, ruled paper,
   red margin, holes, rich-text toolbar (bold/size/highlight/labels),
   image grid with rename, IndexedDB attachments, drag-drop modal.

   Storage:
     - not_nb_meta   → [{id,name,icon,cover,color,created,updated}]
     - not_nb_data   → { [nbId]: { pages: [{id,title,body,images,attachments,links,created,updated}] } }
   Cloud sync: payload.attachments contains only metadata; binaries are
   IndexedDB-only (via NBShared) and stay on-device.
═══════════════════════════════════════════════════════════════ */

const NotNB = (function(){
  'use strict';

  const META_KEY = 'not_nb_meta';
  const DATA_KEY = 'not_nb_data';
  const ACTIVE_KEY = 'not_nb_active';
  const PALETTE = ['#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#6366f1','#14b8a6'];

  let activeNbId = (function(){ try { return localStorage.getItem(ACTIVE_KEY) || null; } catch { return null; } })();
  let activePageId = null;
  const saveTimers = {};

  /* ── helpers ──────────────────────────────────────────────── */
  function esc(s){ const d=document.createElement('div'); d.textContent=s==null?'':s; return d.innerHTML; }
  function loadMeta(){ try { return JSON.parse(localStorage.getItem(META_KEY)||'[]'); } catch { return []; } }
  function saveMeta(m){ localStorage.setItem(META_KEY, JSON.stringify(m)); }
  function loadData(){ try { return JSON.parse(localStorage.getItem(DATA_KEY)||'{}'); } catch { return {}; } }
  /** Save with quota check. Surfaces a clear alert when localStorage is
   *  full instead of failing silently (which used to drop new pages/images). */
  function saveData(d){
    const json=JSON.stringify(d);
    const sizeKB=Math.round(json.length/1024);
    try {
      localStorage.setItem(DATA_KEY, json);
    } catch(e) {
      if (e && (e.name==='QuotaExceededError' || /quota/i.test(e.message||''))) {
        // Tally per-page image weight to show user where the bloat lives
        let imgKB=0,imgs=0;
        Object.values(d||{}).forEach(nb=>(nb.pages||[]).forEach(p=>(p.images||[]).forEach(im=>{
          if(im && im.data){ imgKB += Math.floor(im.data.length*0.75/1024); imgs++; }
        })));
        alert('💾 Almacenamiento local lleno (≈ '+sizeKB+' KB usados).\n\n'+
              imgs+' imágenes pesan ≈ '+Math.round(imgKB/1024)+' MB.\n\n'+
              'Soluciones:\n'+
              '• Eliminá imágenes viejas (las más pesadas primero)\n'+
              '• Las nuevas imágenes ya se comprimen automáticamente\n'+
              '• El navegador limita localStorage a ~5 MB por sitio');
        throw e; // rethrow so caller knows save failed
      }
      throw e;
    }
  }
  function getNb(id){ return loadMeta().find(n => n.id === id); }
  function getPages(id){ const d=loadData(); return (d[id] && d[id].pages) || []; }
  function setActive(id){ activeNbId = id || null; try { localStorage.setItem(ACTIVE_KEY, activeNbId||''); } catch {} }
  function getCurrentPage(nbId){ const d=loadData(); return (d[nbId]||{pages:[]}).pages.find(p => p.id === activePageId); }

  /* ── design picker (modal) ────────────────────────────────── */
  async function openDesignPicker(){
    if (!window.NBShared) return alert('Módulo de diseño no cargado.');
    const iconH = document.getElementById('notNbIconValue');
    const coverH = document.getElementById('notNbCoverValue');
    const nameInp = document.getElementById('notNbName');
    const r = await NBShared.openDesignModal({
      cover: coverH?.value || 'c1',
      icon: iconH?.value || '📘',
      name: nameInp?.value || '',
    });
    if (!r) return;
    if (iconH) iconH.value = r.icon;
    if (coverH) coverH.value = r.cover;
    refreshNewFormPreview();
  }
  function refreshNewFormPreview(){
    const iconH = document.getElementById('notNbIconValue');
    const coverH = document.getElementById('notNbCoverValue');
    const previewEl = document.getElementById('notNbDesignPreview');
    const iconEl = document.getElementById('notNbDesignIconPreview');
    if (previewEl && coverH) previewEl.className = 'nb-cover-' + coverH.value;
    if (iconEl && iconH) iconEl.textContent = iconH.value;
  }
  async function editDesign(id){
    if (!window.NBShared) return alert('Módulo de diseño no cargado.');
    const list = loadMeta();
    const nb = list.find(n => n.id === id);
    if (!nb) return;
    const r = await NBShared.openDesignModal({ cover: nb.cover || 'c1', icon: nb.icon, name: nb.name });
    if (!r) return;
    nb.cover = r.cover;
    nb.icon = r.icon;
    nb.updated = new Date().toISOString();
    saveMeta(list);
    render();
  }

  /* ── CRUD notebooks ───────────────────────────────────────── */
  function create(){
    const nameInp = document.getElementById('notNbName');
    const iconV = (document.getElementById('notNbIconValue')||{}).value || '📘';
    const coverV = (document.getElementById('notNbCoverValue')||{}).value || 'c1';
    const name = (nameInp?.value || '').trim();
    if (!name) { alert('Dale un nombre al cuaderno.'); return; }
    const list = loadMeta();
    const id = 'not_nb_' + Date.now();
    list.push({ id, name, icon: iconV, cover: coverV, color: PALETTE[list.length % PALETTE.length], created: new Date().toISOString() });
    saveMeta(list);
    const data = loadData();
    if (!data[id]) { data[id] = { pages: [] }; saveData(data); }
    if (nameInp) nameInp.value = '';
    setActive(id);
    activePageId = null;
    render();
  }

  function rename(id){
    const list = loadMeta();
    const nb = list.find(n => n.id === id);
    if (!nb) return;
    const next = prompt('Nombre del cuaderno:', nb.name);
    if (!next || !next.trim()) return;
    nb.name = next.trim();
    nb.updated = new Date().toISOString();
    saveMeta(list);
    render();
  }

  function remove(id){
    const list = loadMeta();
    const nb = list.find(n => n.id === id);
    if (!nb) return;
    if (!confirm(`¿Eliminar "${nb.name}" y todas sus páginas? Los archivos adjuntos también se borran.`)) return;
    saveMeta(list.filter(n => n.id !== id));
    const data = loadData();
    if (data[id] && window.NBShared) {
      (data[id].pages || []).forEach(p => (p.attachments || []).forEach(a => NBShared.deleteBlob(a.id).catch(()=>{})));
    }
    delete data[id];
    saveData(data);
    if (activeNbId === id) { setActive(null); activePageId = null; }
    render();
  }

  function selectActive(id){
    setActive(id);
    activePageId = null;
    render();
  }

  /* ── PAGE OPS ─────────────────────────────────────────────── */
  function newPage(nbId){
    const data = loadData();
    if (!data[nbId]) data[nbId] = { pages: [] };
    const page = { id: Date.now(), title: '', body: '', images: [], attachments: [], links: [], created: new Date().toISOString(), updated: new Date().toISOString() };
    data[nbId].pages.unshift(page);
    saveData(data);
    activePageId = page.id;
    render();
  }

  async function openPage(nbId, pid){
    activePageId = pid;
    // Migrate legacy {data: ...} images to {id, thumbnail} on first open.
    // Keeps localStorage payload small + makes images survive cross-PC sync.
    if (window.NBShared) {
      try {
        const data = loadData();
        const page = (data[nbId]||{pages:[]}).pages.find(p => p.id === pid);
        if (page && page.images && page.images.some(im => im && im.data && !im.id)) {
          await NBShared.migrateLegacyImages(page);
          if (page._migrated) {
            delete page._migrated;
            saveData(data);
          }
        }
      } catch(e) { /* migration failure is non-fatal */ }
    }
    render();
  }

  function deletePage(nbId, pid){
    if (!confirm('¿Eliminar esta página?')) return;
    const data = loadData();
    if (!data[nbId]) return;
    const page = data[nbId].pages.find(p => p.id === pid);
    if (page && window.NBShared) (page.attachments||[]).forEach(a => NBShared.deleteBlob(a.id).catch(()=>{}));
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

  /* ── RICH-TEXT FORMAT ─────────────────────────────────────── */
  function focusEditor(nbId){
    const bIn = document.getElementById('nbBody-' + nbId);
    if (!bIn) return null;
    if (document.activeElement !== bIn) bIn.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      const r = document.createRange();
      r.selectNodeContents(bIn);
      r.collapse(false);
      sel.removeAllRanges();
      sel.addRange(r);
    }
    return bIn;
  }
  function removeLabelsInRange(bIn){
    const sel = window.getSelection();
    const labels = Array.from(bIn.querySelectorAll('.rt-label'));
    if (!labels.length) return;
    if (!sel || !sel.rangeCount || sel.getRangeAt(0).collapsed) {
      labels.forEach(el => el.remove());
      return;
    }
    const range = sel.getRangeAt(0);
    labels.forEach(el => { try { if (range.intersectsNode(el)) el.remove(); } catch (_) {} });
  }
  function fmt(nbId, kind, value){
    const bIn = focusEditor(nbId);
    if (!bIn) return;
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
        removeLabelsInRange(bIn);
      }
    } catch(e) { console.warn('NotNB.fmt failed:', e); }
    autoSave(nbId);
  }
  function insertLabel(nbId, type){
    const bIn = focusEditor(nbId);
    if (!bIn) return;
    const html = type === 'urgent'
      ? '<span class="rt-label rt-lbl-urgent" contenteditable="false" title="Click para eliminar" onclick="NotNB.removeLabelEl(this,\''+nbId+'\')">⚠ URGENTE</span>&nbsp;'
      : '<span class="rt-label rt-lbl-done" contenteditable="false" title="Click para eliminar" onclick="NotNB.removeLabelEl(this,\''+nbId+'\')">✓ HECHO</span>&nbsp;';
    try { document.execCommand('insertHTML', false, html); }
    catch(e) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount) {
        const range = sel.getRangeAt(0);
        const frag = range.createContextualFragment(html);
        range.deleteContents();
        range.insertNode(frag);
      }
    }
    autoSave(nbId);
  }
  function removeLabelEl(el, nbId){
    if (el && el.parentNode) el.parentNode.removeChild(el);
    autoSave(nbId);
  }

  /* ── LINKS ────────────────────────────────────────────────── */
  function addLink(nbId){
    if (!activePageId) return alert('Primero abre o crea una página.');
    const url = prompt('URL del link de estudio:');
    if (!url) return;
    const label = prompt('Nombre del link (opcional):') || url;
    const data = loadData();
    const page = data[nbId].pages.find(p => p.id === activePageId);
    if (!page.links) page.links = [];
    page.links.push({ url, label, added: new Date().toISOString() });
    page.updated = new Date().toISOString();
    saveData(data);
    const el = document.getElementById('notNbLinks-' + nbId);
    if (el) el.innerHTML = renderLinksHtml(nbId, page);
  }
  function removeLink(nbId, idx){
    const data = loadData();
    const page = data[nbId].pages.find(p => p.id === activePageId);
    if (!page || !page.links) return;
    page.links.splice(idx, 1);
    page.updated = new Date().toISOString();
    saveData(data);
    const el = document.getElementById('notNbLinks-' + nbId);
    if (el) el.innerHTML = renderLinksHtml(nbId, page);
  }

  /* ── IMAGE OPS (IDB-backed) ───────────────────────────────────
   * Full image stored in IndexedDB; only {id, thumbnail} flows through
   * localStorage → Supabase. Solves quota + JSONB-row size limits. */
  async function addImage(nbId){
    if (!activePageId) return alert('Primero crea o abre una página.');
    if (!window.NBShared) return alert('Módulo compartido no cargado.');
    const rec = await NBShared.pickImageRecordViaModal();
    if (!rec) return;
    const data = loadData();
    const page = data[nbId].pages.find(p => p.id === activePageId);
    if (!page) return;
    if (!page.images) page.images = [];
    page.images.push({ id: rec.id, thumbnail: rec.thumbnail, caption: rec.caption || rec.name || '', size: rec.size, addedAt: rec.addedAt });
    page.updated = new Date().toISOString();
    saveData(data);
    const el = document.getElementById('notNbImages-' + nbId);
    if (el) el.innerHTML = renderImagesHtml(nbId, page);
  }

  /** View full image: resolves from IDB (or legacy `data` field) and opens
   *  a simple lightbox overlay. */
  async function viewImage(nbId, idx){
    const data = loadData();
    const page = data[nbId].pages.find(p => p.id === activePageId);
    if (!page || !page.images || !page.images[idx]) return;
    const im = page.images[idx];
    const fullUrl = window.NBShared ? await NBShared.resolveImageData(im) : (im.data || im.thumbnail);
    if (!fullUrl) return alert('No se pudo cargar la imagen original (puede estar solo en otro dispositivo).');
    let lb = document.getElementById('notNbLightbox');
    if (!lb) {
      lb = document.createElement('div');
      lb.id = 'notNbLightbox';
      lb.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.92);backdrop-filter:blur(8px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:40px;cursor:zoom-out';
      lb.onclick = () => lb.remove();
      document.body.appendChild(lb);
    }
    lb.innerHTML = `<img src="${fullUrl}" style="max-width:95vw;max-height:90vh;border-radius:8px;box-shadow:0 20px 60px rgba(0,0,0,.8)"><div style="position:fixed;bottom:20px;left:50%;transform:translateX(-50%);color:#fff;font-family:'IBM Plex Mono',monospace;font-size:12px;background:rgba(0,0,0,.6);padding:8px 16px;border-radius:6px;max-width:80vw">${esc(im.caption || '')}</div>`;
  }
  function renameImage(nbId, idx){
    const data = loadData();
    const page = data[nbId].pages.find(p => p.id === activePageId);
    if (!page || !page.images || !page.images[idx]) return;
    const cur = page.images[idx].caption || '';
    const next = prompt('Nombre / descripción de la imagen:', cur);
    if (next === null) return;
    page.images[idx].caption = next;
    page.updated = new Date().toISOString();
    saveData(data);
    const el = document.getElementById('notNbImages-' + nbId);
    if (el) el.innerHTML = renderImagesHtml(nbId, page);
  }
  async function removeImage(nbId, idx){
    if (!confirm('¿Eliminar esta imagen?')) return;
    const data = loadData();
    const page = data[nbId].pages.find(p => p.id === activePageId);
    if (!page) return;
    const im = page.images[idx];
    if (im && im.id && window.NBShared) { try { await NBShared.deleteImage(im.id); } catch(e){} }
    page.images.splice(idx, 1);
    page.updated = new Date().toISOString();
    saveData(data);
    const el = document.getElementById('notNbImages-' + nbId);
    if (el) el.innerHTML = renderImagesHtml(nbId, page);
  }

  /* ── ATTACHMENTS ──────────────────────────────────────────── */
  async function attachFile(nbId){
    if (!window.NBShared) return alert('Módulo de adjuntos no cargado.');
    if (!activePageId) return alert('Primero crea o abre una página.');
    const meta = await NBShared.pickAttachmentViaModal('not_' + nbId + '_' + activePageId);
    if (!meta) return;
    const data = loadData();
    const page = data[nbId].pages.find(p => p.id === activePageId);
    if (!page.attachments) page.attachments = [];
    page.attachments.push(meta);
    page.updated = new Date().toISOString();
    saveData(data);
    const el = document.getElementById('notNbAtt-' + nbId);
    if (el) el.innerHTML = renderAttachmentsHtml(nbId, page);
  }
  async function removeAttachment(nbId, attId){
    if (!confirm('¿Eliminar este adjunto del dispositivo?')) return;
    const data = loadData();
    const page = data[nbId].pages.find(p => p.id === activePageId);
    if (!page) return;
    page.attachments = (page.attachments||[]).filter(a => a.id !== attId);
    page.updated = new Date().toISOString();
    saveData(data);
    if (window.NBShared) { try { await NBShared.deleteBlob(attId); } catch(e){} }
    const el = document.getElementById('notNbAtt-' + nbId);
    if (el) el.innerHTML = renderAttachmentsHtml(nbId, page);
  }

  /* ── RENDER HELPERS (mirror systems_logic.js) ─────────────── */
  function renderBodyContent(body){
    if (!body) return '';
    if (/<[a-z][^>]*>/i.test(body)) return body;
    return esc(body);
  }
  function renderLinksHtml(nbId, page){
    if (!page.links || !page.links.length) return '<div style="font-size:11px;color:var(--t3);padding:4px 0">Sin links aún. Usa "🔗 Link".</div>';
    return page.links.map((l, i) =>
      `<div class="nb-link"><span class="nb-link-icon">🔗</span><div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:500">${esc(l.label)}</div><a href="${esc(l.url)}" target="_blank" rel="noopener" class="nb-link-url">${esc(l.url)}</a></div><button onclick="NotNB.removeLink('${nbId}',${i})" style="background:none;border:none;color:var(--t3);cursor:pointer;font-size:10px">✕</button></div>`
    ).join('');
  }
  function renderImagesHtml(nbId, page){
    if (!page.images || !page.images.length) return '<div style="font-size:11px;color:var(--t3);padding:4px 0;grid-column:1/-1">Sin imágenes. Usa "🖼️ Imagen".</div>';
    return page.images.map((im, i) => {
      // Prefer thumbnail (IDB-migrated); fall back to legacy inline `data`
      const src = im.thumbnail || im.data || '';
      const orphan = im.id && !im.thumbnail && !im.data;
      return `<div class="nb-img-card">
        <button class="nb-img-del" onclick="event.stopPropagation();NotNB.removeImage('${nbId}',${i})" title="Eliminar">✕</button>
        <button class="nb-img-rename" onclick="event.stopPropagation();NotNB.renameImage('${nbId}',${i})" title="Renombrar">✏</button>
        ${orphan
          ? '<div style="aspect-ratio:1;background:var(--el);display:flex;align-items:center;justify-content:center;color:var(--t3);font-size:11px;text-align:center;padding:8px">📷<br>Solo en otro<br>dispositivo</div>'
          : `<img src="${src}" alt="${esc(im.caption)}" onclick="NotNB.viewImage('${nbId}',${i})" style="cursor:zoom-in">`}
        <div class="nb-img-caption">${esc(im.caption || 'Sin nombre')}</div>
      </div>`;
    }).join('');
  }
  function renderAttachmentsHtml(nbId, page){
    if (!window.NBShared) return '<div style="font-size:11px;color:var(--t3);padding:4px 0">Cargando módulo de adjuntos…</div>';
    return NBShared.renderAttachmentChips((page && page.attachments) || [], { onRemove: "NotNB.removeAttachment.bind(null,'"+nbId+"')" });
  }

  /* ── PAGE EDITOR HTML (mirrors buildEditorHtml from 10-SYS) ── */
  function buildEditorHtml(nbId, page){
    if (!page) return '';
    return `<div class="nb-rt-toolbar">
        <button class="nb-rt-btn" onclick="NotNB.fmt('${nbId}','bold')" title="Negrita (Ctrl+B)"><b>B</b></button>
        <span class="nb-rt-sep"></span>
        <button class="nb-rt-btn nb-rt-sz-s" onclick="NotNB.fmt('${nbId}','size','s')" title="Texto pequeño">S</button>
        <button class="nb-rt-btn nb-rt-sz-m" onclick="NotNB.fmt('${nbId}','size','m')" title="Texto normal">M</button>
        <button class="nb-rt-btn nb-rt-sz-l" onclick="NotNB.fmt('${nbId}','size','l')" title="Texto grande">L</button>
        <span class="nb-rt-sep"></span>
        <button class="nb-rt-btn nb-rt-hl nb-rt-hl-y" onclick="NotNB.fmt('${nbId}','hl','y')" title="Resaltar amarillo"></button>
        <button class="nb-rt-btn nb-rt-hl nb-rt-hl-g" onclick="NotNB.fmt('${nbId}','hl','g')" title="Resaltar verde"></button>
        <button class="nb-rt-btn nb-rt-hl nb-rt-hl-p" onclick="NotNB.fmt('${nbId}','hl','p')" title="Resaltar rosa"></button>
        <button class="nb-rt-btn" onclick="NotNB.fmt('${nbId}','clear')" title="Quitar formato">✕</button>
        <span class="nb-rt-sep"></span>
        <button class="nb-rt-btn nb-rt-lbl nb-rt-lbl-u" onclick="NotNB.insertLabel('${nbId}','urgent')" title="Insertar etiqueta URGENTE">⚠ URGENTE</button>
        <button class="nb-rt-btn nb-rt-lbl nb-rt-lbl-d" onclick="NotNB.insertLabel('${nbId}','done')" title="Insertar etiqueta HECHO">✓ HECHO</button>
      </div>
      <div class="nb-page" style="margin-bottom:12px">
        <div class="nb-header">
          <input class="nb-title-inp" id="nbTitle-${nbId}" value="${esc(page.title || '').replace(/"/g,'&quot;')}" placeholder="Título de la página..." oninput="NotNB.autoSave('${nbId}')">
          <span class="nb-saved" id="nbSaved-${nbId}">✓ guardado</span>
          <span class="nb-date">${new Date(page.created).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
        <div class="nb-spine"></div>
        <div class="nb-holes"><div class="nb-hole" style="top:24px"></div><div class="nb-hole" style="top:72px"></div><div class="nb-hole" style="top:120px"></div><div class="nb-hole" style="top:168px"></div><div class="nb-hole" style="top:216px"></div><div class="nb-hole" style="top:264px"></div><div class="nb-hole" style="top:312px"></div><div class="nb-hole" style="top:360px"></div></div>
        <div class="nb-margin"></div>
        <div class="nb-content" id="nbBody-${nbId}" contenteditable="true" data-placeholder="Escribe tus apuntes aquí..." oninput="NotNB.autoSave('${nbId}')">${renderBodyContent(page.body)}</div>
      </div>
      <div class="lb">· links de estudio ·</div>
      <div id="notNbLinks-${nbId}">${renderLinksHtml(nbId, page)}</div>
      <div class="lb">· archivos adjuntos · <span style="font-size:9px;color:var(--t3);text-transform:none;letter-spacing:0;font-weight:400">(local — no sync)</span></div>
      <div class="nb-att-list" id="notNbAtt-${nbId}">${renderAttachmentsHtml(nbId, page)}</div>
      <div class="lb">· imágenes ·</div>
      <div class="nb-images" id="notNbImages-${nbId}">${renderImagesHtml(nbId, page)}</div>`;
  }

  /* ── RENDER (full notebook card) ──────────────────────────── */
  function renderEditor(nb){
    const pages = getPages(nb.id);
    const page = activePageId ? pages.find(p => p.id === activePageId) : null;

    const pagesList = pages.length ? pages.map(p => {
      const preview = (p.body || '').replace(/<[^>]*>/g,'').substring(0, 70);
      const isActive = activePageId === p.id;
      return `<div class="nb-entry${isActive?' open':''}">
        <div class="nb-entry-h" onclick="NotNB.openPage('${nb.id}',${p.id})">
          <div style="min-width:0;flex:1">
            <div class="nb-entry-title">${esc(p.title || 'Sin título')}</div>
            <div style="font-size:10px;color:var(--t3);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(preview)}${preview.length>=70?'…':''}</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
            <span class="nb-entry-date">${new Date(p.updated || p.created).toLocaleDateString('es', { day:'numeric', month:'short' })}</span>
            <span style="font-size:10px;color:var(--t3)">${(p.links||[]).length?'🔗'+p.links.length:''} ${(p.images||[]).length?'🖼'+p.images.length:''} ${(p.attachments||[]).length?'📎'+p.attachments.length:''}</span>
            <button onclick="event.stopPropagation();NotNB.deletePage('${nb.id}',${p.id})" style="background:none;border:none;color:var(--t3);cursor:pointer;font-size:11px;opacity:.5">🗑</button>
          </div>
        </div>
      </div>`;
    }).join('') : '<div style="text-align:center;padding:14px;color:var(--t3);font-size:11px">Sin páginas. Haz click en "+ Nueva página".</div>';

    const editorHtml = buildEditorHtml(nb.id, page);
    const created = nb.created ? new Date(nb.created).toLocaleDateString('es',{day:'numeric',month:'short',year:'numeric'}) : '';

    return `<div class="cd" style="border-left:3px solid ${nb.color||'#8b5cf6'};padding:0;overflow:hidden">
      <div class="nb-cover-card nb-cover-${nb.cover||'c1'}">
        <div class="nb-cover-icon">${nb.icon}</div>
        <div>
          <div class="nb-cover-title">${esc(nb.name)}</div>
          <div class="nb-cover-sub">${pages.length} página${pages.length!==1?'s':''}${created?' · creado '+created:''}</div>
        </div>
      </div>
      <div style="padding:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:6px">
          <div class="nb-toolbar">
            <button onclick="NotNB.newPage('${nb.id}')" style="background:var(--ac);color:#fff">+ Nueva página</button>
            ${page ? `<button onclick="NotNB.addLink('${nb.id}')" style="background:var(--el);color:var(--t2);border:1px solid var(--bd)">🔗 Link</button>
            <button onclick="NotNB.addImage('${nb.id}')" style="background:var(--el);color:var(--t2);border:1px solid var(--bd)">🖼️ Imagen</button>
            <button onclick="NotNB.attachFile('${nb.id}')" style="background:var(--el);color:var(--t2);border:1px solid var(--bd)">📎 Adjuntar</button>` : ''}
          </div>
          <div style="display:flex;gap:4px">
            <button onclick="NotNB.editDesign('${nb.id}')" class="btn bo bs">🎨 Diseño</button>
            <button onclick="NotNB.rename('${nb.id}')" class="btn bo bs">✏️</button>
            <button onclick="NotNB.remove('${nb.id}')" class="btn bo bs" style="border-color:rgba(239,68,68,.3);color:var(--rd)">🗑</button>
          </div>
        </div>
        ${editorHtml || '<div style="text-align:center;padding:20px;color:var(--t3);font-size:12px;background:var(--c1);border:1px dashed var(--bd);border-radius:8px;margin:10px 0">Crea o selecciona una página para empezar a escribir.</div>'}
        <div class="lb" style="margin-top:14px">· páginas ·</div>
        <div class="nb-entries">${pagesList}</div>
      </div>
    </div>`;
  }

  function render(){
    refreshNewFormPreview();
    const list = loadMeta();
    const wrap = document.getElementById('notNbWrap');
    if (!wrap) return;

    if (!list.length){
      wrap.innerHTML = `<div class="cd" style="text-align:center;padding:40px 20px;color:var(--t3);border-style:dashed">
        <div style="font-size:32px;margin-bottom:8px">📓</div>
        <div style="font-size:14px;font-weight:600;color:var(--tx);margin-bottom:4px">Sin cuadernos aún</div>
        <div style="font-size:12px">Crea tu primer cuaderno arriba.<br>Elige portada, ícono y empieza a escribir.</div>
      </div>`;
      return;
    }
    if (!activeNbId || !list.find(n => n.id === activeNbId)) {
      activeNbId = list[0].id;
      try { localStorage.setItem(ACTIVE_KEY, activeNbId); } catch {}
    }
    const nb = list.find(n => n.id === activeNbId);
    const options = list.map(n => `<option value="${n.id}"${n.id===activeNbId?' selected':''}>${n.icon} ${esc(n.name)}</option>`).join('');
    wrap.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap">
        <label style="font-size:11px;color:var(--t3);font-family:'IBM Plex Mono',monospace">CUADERNO ACTIVO →</label>
        <select onchange="NotNB.selectActive(this.value)" style="flex:1;min-width:200px;background:var(--el);border:1px solid var(--bd);border-radius:7px;color:var(--tx);padding:7px 10px;font-family:inherit;font-size:13px">${options}</select>
        <span style="font-size:10px;color:var(--t3)">${list.length} cuaderno${list.length!==1?'s':''}</span>
      </div>
      ${renderEditor(nb)}
    `;
  }

  /* ── INIT ─────────────────────────────────────────────────── */
  function init(){ render(); }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else setTimeout(init, 0);

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
window.NotNB = NotNB;
