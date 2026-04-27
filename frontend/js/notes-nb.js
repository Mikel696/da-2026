/* ═══════════════════════════════════════════════════════════════
   DA-2026 · 13-NOT · Cuadernos (Notebook sub-module)
   ─────────────────────────────────────────────────────────────
   Storage:
     - not_nb_meta   → [{id,name,icon,cover,color,created,updated}]
     - not_nb_data   → { [nbId]: { pages: [{id,title,body,images,attachments,created,updated}] } }
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
  function saveData(d){ localStorage.setItem(DATA_KEY, JSON.stringify(d)); }
  function getNb(id){ return loadMeta().find(n => n.id === id); }
  function getPages(id){ const d=loadData(); return (d[id] && d[id].pages) || []; }
  function setActive(id){ activeNbId = id || null; try { localStorage.setItem(ACTIVE_KEY, activeNbId||''); } catch {} }

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

  /* ── CRUD ─────────────────────────────────────────────────── */
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
    // Remove attachments from IndexedDB
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
    const page = { id: Date.now(), title: '', body: '', images: [], attachments: [], created: new Date().toISOString(), updated: new Date().toISOString() };
    data[nbId].pages.unshift(page);
    saveData(data);
    activePageId = page.id;
    render();
  }

  function openPage(nbId, pid){ activePageId = pid; render(); }

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
      const tIn = document.getElementById('notNbTitle');
      const bIn = document.getElementById('notNbBody');
      if (tIn) page.title = tIn.value;
      if (bIn) page.body = bIn.innerHTML;
      page.updated = new Date().toISOString();
      saveData(data);
      const badge = document.getElementById('notNbSaved');
      if (badge) { badge.textContent = '✓ guardado'; badge.classList.add('on'); clearTimeout(badge._t); badge._t = setTimeout(()=>badge.classList.remove('on'), 1200); }
    }, 500);
  }

  /* ── IMAGE OPS ────────────────────────────────────────────── */
  async function addImage(nbId){
    if (!activePageId) return alert('Primero crea o abre una página.');
    if (!window.NBShared) return alert('Módulo compartido no cargado.');
    const r = await NBShared.pickImageViaModal();
    if (!r) return;
    const data = loadData();
    const page = data[nbId].pages.find(p => p.id === activePageId);
    if (!page) return;
    if (!page.images) page.images = [];
    page.images.push({ data: r.dataUrl, caption: r.caption || r.name || '' });
    page.updated = new Date().toISOString();
    saveData(data);
    render();
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
    render();
  }

  function removeImage(nbId, idx){
    if (!confirm('¿Eliminar esta imagen?')) return;
    const data = loadData();
    const page = data[nbId].pages.find(p => p.id === activePageId);
    if (!page) return;
    page.images.splice(idx, 1);
    page.updated = new Date().toISOString();
    saveData(data);
    render();
  }

  /* ── ATTACHMENTS ──────────────────────────────────────────── */
  async function attachFile(nbId){
    if (!window.NBShared) return alert('Módulo de adjuntos no cargado.');
    if (!activePageId) return alert('Primero crea o abre una página.');
    const meta = await NBShared.pickAttachmentViaModal('not_' + nbId + '_' + activePageId);
    if (!meta) return; // user cancelled
    const data = loadData();
    const page = data[nbId].pages.find(p => p.id === activePageId);
    if (!page.attachments) page.attachments = [];
    page.attachments.push(meta);
    page.updated = new Date().toISOString();
    saveData(data);
    render();
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
    render();
  }

  /* ── RENDER ───────────────────────────────────────────────── */
  function renderEditor(nb){
    const pages = getPages(nb.id);
    const page = activePageId ? pages.find(p => p.id === activePageId) : null;

    const pagesList = pages.length ? pages.map(p => {
      const preview = (p.body || '').replace(/<[^>]*>/g,'').substring(0, 80);
      const isActive = activePageId === p.id;
      return `<div class="nb-entry${isActive?' open':''}" style="background:var(--c1);border:1px solid var(--bd);border-radius:8px;padding:10px;margin-bottom:6px;cursor:pointer" onclick="NotNB.openPage('${nb.id}',${p.id})">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
          <div style="min-width:0;flex:1">
            <div style="font-size:13px;font-weight:600;color:var(--tx);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.title || 'Sin título')}</div>
            <div style="font-size:10px;color:var(--t3);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(preview)}${preview.length>=80?'…':''}</div>
          </div>
          <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
            <span style="font-size:10px;color:var(--t3);font-family:'IBM Plex Mono',monospace">${new Date(p.updated||p.created).toLocaleDateString('es',{day:'numeric',month:'short'})}</span>
            <span style="font-size:10px;color:var(--t3)">${(p.images||[]).length?'🖼'+p.images.length:''} ${(p.attachments||[]).length?'📎'+p.attachments.length:''}</span>
            <button onclick="event.stopPropagation();NotNB.deletePage('${nb.id}',${p.id})" style="background:none;border:none;color:var(--t3);cursor:pointer;font-size:11px;opacity:.6">🗑</button>
          </div>
        </div>
      </div>`;
    }).join('') : '<div style="text-align:center;padding:20px;color:var(--t3);font-size:11px;border:1px dashed var(--bd);border-radius:8px">Sin páginas. Click "+ Nueva página".</div>';

    const editorBlock = page ? `
      <div style="background:var(--c1);border:1px solid var(--bd);border-radius:10px;padding:12px;margin:10px 0">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <input id="notNbTitle" value="${esc(page.title||'').replace(/"/g,'&quot;')}" placeholder="Título de la página..." oninput="NotNB.autoSave('${nb.id}')" style="flex:1;background:var(--el);border:1px solid var(--bd);border-radius:7px;padding:8px 10px;color:var(--tx);font-family:inherit;font-size:14px;font-weight:600">
          <span id="notNbSaved" style="font-size:10px;color:var(--gn);opacity:0;transition:opacity .3s;font-family:'IBM Plex Mono',monospace">✓ guardado</span>
        </div>
        <div id="notNbBody" contenteditable="true" oninput="NotNB.autoSave('${nb.id}')" data-placeholder="Escribe aquí tus apuntes..." style="min-height:200px;background:var(--el);border:1px solid var(--bd);border-radius:7px;padding:12px;color:var(--tx);font-family:inherit;font-size:13px;line-height:1.7;outline:none">${page.body || ''}</div>
        <style>#notNbBody:empty::before{content:attr(data-placeholder);color:var(--t3);font-style:italic} #notNbSaved.on{opacity:1}</style>
      </div>
      <div class="lb">· imágenes ·</div>
      <div class="nb-images" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px;margin-bottom:10px">${
        (page.images||[]).length ? page.images.map((im,i) =>
          `<div class="nb-img-card" style="position:relative;background:var(--c1);border:1px solid var(--bd);border-radius:8px;overflow:hidden">
            <button class="nb-img-del" onclick="event.stopPropagation();NotNB.removeImage('${nb.id}',${i})" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,.7);border:none;color:#fff;width:22px;height:22px;border-radius:50%;cursor:pointer;font-size:11px;z-index:2" title="Eliminar">✕</button>
            <button class="nb-img-rename" onclick="event.stopPropagation();NotNB.renameImage('${nb.id}',${i})" style="position:absolute;top:4px;right:30px;background:rgba(0,0,0,.7);border:none;color:#fff;width:22px;height:22px;border-radius:50%;cursor:pointer;font-size:11px;z-index:2" title="Renombrar">✏</button>
            <img src="${im.data}" alt="${esc(im.caption)}" style="width:100%;aspect-ratio:1;object-fit:cover;display:block">
            <div style="padding:6px 8px;font-size:11px;color:var(--t2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(im.caption||'Sin nombre')}</div>
          </div>`
        ).join('') : '<div style="font-size:11px;color:var(--t3);padding:4px 0;grid-column:1/-1">Sin imágenes. Usa "🖼️ Imagen".</div>'
      }</div>
      <div class="lb">· archivos · <span style="font-size:9px;color:var(--t3);text-transform:none;letter-spacing:0;font-weight:400">(local — no sync)</span></div>
      <div class="nb-att-list">${window.NBShared ? NBShared.renderAttachmentChips(page.attachments||[], { onRemove: "NotNB.removeAttachment.bind(null,'"+nb.id+"')" }) : ''}</div>
    ` : '<div style="text-align:center;padding:20px;color:var(--t3);font-size:12px;background:var(--c1);border:1px dashed var(--bd);border-radius:8px;margin:10px 0">Crea o selecciona una página para empezar a escribir.</div>';

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
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button class="btn bp" onclick="NotNB.newPage('${nb.id}')">+ Nueva página</button>
            ${page ? `<button class="btn bo" onclick="NotNB.addImage('${nb.id}')">🖼️ Imagen</button>
            <button class="btn bo" onclick="NotNB.attachFile('${nb.id}')">📎 Adjuntar</button>` : ''}
          </div>
          <div style="display:flex;gap:4px">
            <button onclick="NotNB.editDesign('${nb.id}')" class="btn bo bs">🎨 Diseño</button>
            <button onclick="NotNB.rename('${nb.id}')" class="btn bo bs">✏️</button>
            <button onclick="NotNB.remove('${nb.id}')" class="btn bo bs" style="border-color:rgba(239,68,68,.3);color:var(--rd)">🗑</button>
          </div>
        </div>
        ${editorBlock}
        <div class="lb" style="margin-top:14px">· páginas ·</div>
        ${pagesList}
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
    addImage, renameImage, removeImage,
    attachFile, removeAttachment,
  };
})();
window.NotNB = NotNB;
