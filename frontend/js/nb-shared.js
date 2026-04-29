/* ═══════════════════════════════════════════════════════════════
   DA-2026 · NB-SHARED — Notebook covers, icons & attachments
   ─────────────────────────────────────────────────────────────
   - 12 cover designs (CSS classes nb-cover-1..12)
   - 32 grouped icons (Estudio / Trabajo / Tech / Personal)
   - IndexedDB-backed attachments (PDF/Word/Excel) up to ~50MB
   - Image rename helper

   Local-only by design: attachment binaries live in IndexedDB and are
   NOT synced to Supabase (would blow JSONB row limits). Only metadata
   {id,name,type,size,addedAt} flows through cloud-sync.js.
═══════════════════════════════════════════════════════════════ */

(function(){
  'use strict';

  /* ── COVER CATALOG ─────────────────────────────────────────── */
  const COVERS = [
    { id:'c1',  label:'Lila Vector',     theme:'study'    },
    { id:'c2',  label:'Verde Botánico',  theme:'study'    },
    { id:'c3',  label:'Cyan Tech',       theme:'tech'     },
    { id:'c4',  label:'Ámbar Solar',     theme:'work'     },
    { id:'c5',  label:'Rosa Creativo',   theme:'creative' },
    { id:'c6',  label:'Negro Ejecutivo', theme:'work'     },
    { id:'c7',  label:'Vintage Papel',   theme:'study'    },
    { id:'c8',  label:'Index Card',      theme:'study'    },
    { id:'c9',  label:'Grid Engineer',   theme:'tech'     },
    { id:'c10', label:'Sunset Gradient', theme:'creative' },
    { id:'c11', label:'Forest Calm',     theme:'personal' },
    { id:'c12', label:'Nebula',          theme:'tech'     },
  ];

  /* ── ICON CATALOG (grouped) ────────────────────────────────── */
  const ICON_GROUPS = {
    'Estudio':  ['📘','📗','📙','📕','📒','📔','📓','🗒️','✏️','📝'],
    'Trabajo':  ['💼','📊','📈','📉','💰','🏦','🧾','📋','📁','🗂️'],
    'Tech':     ['💻','🖥️','⌨️','🖱️','🐍','☁️','🔧','⚙️','🔌','🧠'],
    'Personal': ['🎯','🎨','🎵','📷','✈️','🍕','🏃','💡','🔥','⭐'],
    'Especial': ['🚀','🎓','📚'],
  };
  const ALL_ICONS = Object.values(ICON_GROUPS).flat();

  /* ── INDEXEDDB ATTACHMENTS ─────────────────────────────────── */
  const DB_NAME = 'da2026_nb';
  const STORE = 'attachments';
  const VERSION = 1;
  const MAX_BYTES = 52428800; // 50 MB hard limit
  let _dbPromise = null;

  function openDB(){
    if (_dbPromise) return _dbPromise;
    _dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return _dbPromise;
  }

  async function putBlob(id, blob, meta){
    const db = await openDB();
    return new Promise((res, rej) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put({ id, blob, ...meta });
      tx.oncomplete = () => res(true);
      tx.onerror = () => rej(tx.error);
    });
  }

  async function getBlob(id){
    const db = await openDB();
    return new Promise((res, rej) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => res(req.result || null);
      req.onerror = () => rej(req.error);
    });
  }

  async function deleteBlob(id){
    const db = await openDB();
    return new Promise((res, rej) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => res(true);
      tx.onerror = () => rej(tx.error);
    });
  }

  /* Allowed types (extension whitelist) */
  const ALLOWED_EXT = ['pdf','doc','docx','xls','xlsx','ppt','pptx','txt','csv','md','zip'];
  function extOf(name){
    const m = String(name||'').toLowerCase().match(/\.([a-z0-9]+)$/);
    return m ? m[1] : '';
  }
  function iconForExt(ext){
    if (ext === 'pdf') return '📕';
    if (ext === 'doc' || ext === 'docx') return '📘';
    if (ext === 'xls' || ext === 'xlsx' || ext === 'csv') return '📗';
    if (ext === 'ppt' || ext === 'pptx') return '📙';
    if (ext === 'txt' || ext === 'md') return '📄';
    if (ext === 'zip') return '🗜️';
    return '📎';
  }
  function fmtBytes(n){
    if (n < 1024) return n + ' B';
    if (n < 1048576) return (n/1024).toFixed(1) + ' KB';
    return (n/1048576).toFixed(1) + ' MB';
  }

  /**
   * Pick a file from disk and store it in IndexedDB.
   * @returns Promise<{id, name, type, size, ext, addedAt}>
   */
  function pickAndStoreAttachment(prefix){
    return new Promise((resolve, reject) => {
      const inp = document.createElement('input');
      inp.type = 'file';
      inp.accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.md,.zip';
      inp.onchange = async (e) => {
        const f = e.target.files && e.target.files[0];
        if (!f) return reject(new Error('No file'));
        if (f.size > MAX_BYTES) {
          alert('Archivo demasiado grande (máx 50 MB). El tuyo: ' + fmtBytes(f.size));
          return reject(new Error('File too large'));
        }
        const ext = extOf(f.name);
        if (ALLOWED_EXT.indexOf(ext) === -1) {
          alert('Tipo no permitido. Soportados: ' + ALLOWED_EXT.join(', '));
          return reject(new Error('Type not allowed'));
        }
        const id = (prefix || 'att') + '_' + Date.now() + '_' + Math.random().toString(36).slice(2,7);
        try {
          await putBlob(id, f, { name: f.name, type: f.type, size: f.size, ext, addedAt: new Date().toISOString() });
          resolve({ id, name: f.name, type: f.type, size: f.size, ext, addedAt: new Date().toISOString() });
        } catch (err) { reject(err); }
      };
      inp.click();
    });
  }

  /** Trigger download of an attachment */
  async function downloadAttachment(id, fallbackName){
    const rec = await getBlob(id);
    if (!rec) { alert('Archivo no encontrado en este dispositivo. Los adjuntos no se sincronizan a la nube.'); return; }
    const url = URL.createObjectURL(rec.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = rec.name || fallbackName || 'attachment';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 200);
  }

  /** Render attachment chips list (read-only HTML) */
  function renderAttachmentChips(attachments, ctx){
    if (!attachments || !attachments.length) {
      return '<div style="font-size:11px;color:var(--t3);padding:4px 0">Sin archivos. Usa "📎 Adjuntar".</div>';
    }
    return attachments.map((a, i) =>
      `<div class="nb-att">
        <span class="nb-att-ico">${iconForExt(a.ext)}</span>
        <div class="nb-att-info">
          <div class="nb-att-name" title="${a.name}">${a.name}</div>
          <div class="nb-att-meta">${(a.ext||'').toUpperCase()} · ${fmtBytes(a.size||0)}</div>
        </div>
        <button class="nb-att-btn" onclick="NBShared.downloadAttachment('${a.id}','${a.name.replace(/'/g,"\\'")}')" title="Descargar">⬇</button>
        <button class="nb-att-btn nb-att-del" onclick="${ctx && ctx.onRemove ? ctx.onRemove + "('"+a.id+"')" : ''}" title="Eliminar">✕</button>
      </div>`
    ).join('');
  }

  /* ── COVER PICKER UI ───────────────────────────────────────── */
  function renderCoverPicker(currentId, onPick){
    const opts = COVERS.map(c =>
      `<div class="nb-cover-opt nb-cover-${c.id}${c.id===currentId?' on':''}" onclick="${onPick}('${c.id}')" title="${c.label}">
        <span class="nb-cover-lbl">${c.label}</span>
      </div>`
    ).join('');
    return `<div class="nb-cover-grid">${opts}</div>`;
  }

  /* ── ICON PICKER UI ────────────────────────────────────────── */
  function renderIconPicker(current, onPick){
    return Object.entries(ICON_GROUPS).map(([group, icons]) => `
      <div class="nb-icogrp">
        <div class="nb-icogrp-h">${group}</div>
        <div class="nb-icogrp-row">
          ${icons.map(ic => `<button class="nb-icobtn${ic===current?' on':''}" onclick="${onPick}('${ic}')" type="button">${ic}</button>`).join('')}
        </div>
      </div>
    `).join('');
  }

  /* ═══════════════════════════════════════════════════════════════
     UNIFIED DROP MODAL — drag/drop/paste/click for files
     Used by both 10-SYS and 13-NOT, for images AND attachments.
  ═══════════════════════════════════════════════════════════════ */
  let _dm = { active: false, file: null, dataUrl: null, opts: null, resolve: null };

  function _ensureModal(){
    if (document.getElementById('nbsDropOverlay')) return;
    const html = `
<div class="nbs-drop-overlay" id="nbsDropOverlay">
  <div class="nbs-drop-modal" onclick="event.stopPropagation()">
    <button class="nbs-drop-close" onclick="NBShared._dmCancel()" title="Cerrar (Esc)">✕</button>
    <div class="nbs-drop-head">
      <div class="nbs-drop-title" id="nbsDropTitle">📎 Adjuntar archivo</div>
      <div class="nbs-drop-sub"><span id="nbsDropPasteHint"></span>Arrastra archivo · o <span class="nbs-drop-link" onclick="NBShared._dmPick()">busca en tu PC</span></div>
    </div>
    <div class="nbs-drop-zone" id="nbsDropZone" tabindex="0">
      <div class="nbs-drop-icon" id="nbsDropIcon">📋</div>
      <div class="nbs-drop-text" id="nbsDropText">Suelta tu archivo aquí</div>
      <div class="nbs-drop-hint" id="nbsDropHint"></div>
      <div class="nbs-drop-preview" id="nbsDropPreview"><img id="nbsDropPreviewImg" alt=""><div class="nbs-drop-fileinfo" id="nbsDropFileInfo"></div></div>
    </div>
    <input class="nbs-drop-caption" id="nbsDropCaption" placeholder="Descripción (opcional)...">
    <div class="nbs-drop-actions">
      <button class="nbs-drop-btn nbs-drop-btn-cancel" onclick="NBShared._dmCancel()">Cancelar</button>
      <button class="nbs-drop-btn nbs-drop-btn-save" id="nbsDropSave" onclick="NBShared._dmSave()" disabled>💾 Guardar</button>
    </div>
  </div>
  <input type="file" id="nbsDropFileInput" style="display:none">
</div>`;
    document.body.insertAdjacentHTML('beforeend', html);

    const ov = document.getElementById('nbsDropOverlay');
    const dz = document.getElementById('nbsDropZone');
    ov.addEventListener('click', e => { if (e.target === ov) _dmCancel(); });
    dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('drag'); });
    dz.addEventListener('dragleave', e => { if (e.target === dz || dz.contains(e.target) === false) dz.classList.remove('drag'); });
    dz.addEventListener('drop', e => {
      e.preventDefault();
      dz.classList.remove('drag');
      const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) _dmIngest(f);
    });
    dz.addEventListener('click', () => _dmPick());
    document.addEventListener('paste', _dmPasteHandler);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && _dm.active) _dmCancel();
    });
  }

  function _dmPasteHandler(e){
    if (!_dm.active) return;
    if (!_dm.opts || !_dm.opts.allowPaste) return;
    const items = e.clipboardData && e.clipboardData.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++){
      const it = items[i];
      if (it.type && it.type.startsWith('image/')){
        const f = it.getAsFile();
        if (f) { e.preventDefault(); _dmIngest(f); return; }
      }
    }
  }

  function _dmPick(){
    const input = document.getElementById('nbsDropFileInput');
    if (!input) return;
    input.value = '';
    input.accept = (_dm.opts && _dm.opts.accept) || '*';
    input.onchange = e => {
      const f = e.target.files && e.target.files[0];
      if (f) _dmIngest(f);
    };
    input.click();
  }

  function _validate(file){
    const max = (_dm.opts && _dm.opts.maxBytes) || MAX_BYTES;
    if (file.size > max) {
      alert('Archivo demasiado grande (máx ' + fmtBytes(max) + '). El tuyo: ' + fmtBytes(file.size));
      return false;
    }
    if (_dm.opts && _dm.opts.acceptImages) {
      if (!file.type.startsWith('image/')) { alert('El archivo no es una imagen.'); return false; }
    } else if (_dm.opts && _dm.opts.allowedExt) {
      const ext = extOf(file.name);
      if (_dm.opts.allowedExt.indexOf(ext) === -1) {
        alert('Tipo no permitido. Soportados: ' + _dm.opts.allowedExt.join(', '));
        return false;
      }
    }
    return true;
  }

  /**
   * Compress an image dataURL to fit within localStorage / Supabase JSONB limits.
   * Default: max 1200px on longest side, JPEG quality 0.72. This typically
   * brings a phone photo (3-5MB) down to 80-150 KB while keeping legibility
   * for screenshots, diagrams, photos. Cross-PC sync becomes reliable.
   * @returns {Promise<string>} compressed dataURL (image/jpeg)
   */
  function compressImage(dataUrl, opts){
    return new Promise((resolve, reject) => {
      const o = Object.assign({ maxDim: 1200, quality: 0.72 }, opts || {});
      const img = new Image();
      img.onload = () => {
        const w0 = img.naturalWidth, h0 = img.naturalHeight;
        const scale = Math.min(1, o.maxDim / Math.max(w0, h0));
        const w = Math.round(w0 * scale), h = Math.round(h0 * scale);
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#fff'; // white BG for transparent PNGs (JPEG has no alpha)
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        try {
          const out = c.toDataURL('image/jpeg', o.quality);
          resolve(out);
        } catch (e) { reject(e); }
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = dataUrl;
    });
  }

  /** Approximate byte size of a base64 data URL. */
  function dataUrlBytes(dataUrl){
    if (!dataUrl) return 0;
    const i = dataUrl.indexOf(',');
    if (i === -1) return dataUrl.length;
    return Math.floor((dataUrl.length - i - 1) * 3 / 4);
  }

  function _dmIngest(file){
    if (!_validate(file)) return;
    _dm.file = file;
    const preview = document.getElementById('nbsDropPreview');
    const previewImg = document.getElementById('nbsDropPreviewImg');
    const fileInfo = document.getElementById('nbsDropFileInfo');
    const icon = document.getElementById('nbsDropIcon');
    const text = document.getElementById('nbsDropText');
    const cap = document.getElementById('nbsDropCaption');
    const save = document.getElementById('nbsDropSave');

    if (_dm.opts && _dm.opts.acceptImages) {
      const reader = new FileReader();
      reader.onload = async ev => {
        const original = ev.target.result;
        // Always compress images for predictable storage size + cross-PC sync.
        // (localStorage cap ~5MB per origin, Supabase JSONB cap ~1MB per row.)
        let compressed = original;
        try {
          compressed = await compressImage(original, _dm.opts.compress || {});
        } catch (e) { console.warn('Image compression failed, using original:', e); }
        _dm.dataUrl = compressed;
        if (previewImg) previewImg.src = compressed;
        if (preview) preview.style.display = 'flex';
        if (fileInfo) {
          const origKB = (file.size / 1024).toFixed(0);
          const compKB = (dataUrlBytes(compressed) / 1024).toFixed(0);
          fileInfo.textContent = `${file.name} · ${origKB} KB → ${compKB} KB compressed`;
        }
        if (icon) icon.textContent = '✅';
        if (text) text.textContent = 'Listo para guardar';
        if (cap && !cap.value) cap.value = file.name.replace(/\.[a-z0-9]+$/i, '');
        if (save) save.disabled = false;
      };
      reader.readAsDataURL(file);
    } else {
      _dm.dataUrl = null;
      if (preview) preview.style.display = 'flex';
      if (previewImg) previewImg.style.display = 'none';
      const ext = extOf(file.name);
      if (fileInfo) {
        fileInfo.innerHTML = `<div class="nbs-drop-doc">${iconForExt(ext)}<div><div class="nbs-drop-doc-n">${file.name}</div><div class="nbs-drop-doc-m">${(ext||'').toUpperCase()} · ${fmtBytes(file.size)}</div></div></div>`;
      }
      if (icon) icon.textContent = '✅';
      if (text) text.textContent = 'Archivo seleccionado';
      if (cap && !cap.value) cap.value = file.name;
      if (save) save.disabled = false;
    }
  }

  function _dmReset(){
    _dm.file = null;
    _dm.dataUrl = null;
    const preview = document.getElementById('nbsDropPreview');
    const previewImg = document.getElementById('nbsDropPreviewImg');
    const fileInfo = document.getElementById('nbsDropFileInfo');
    const icon = document.getElementById('nbsDropIcon');
    const text = document.getElementById('nbsDropText');
    const cap = document.getElementById('nbsDropCaption');
    const save = document.getElementById('nbsDropSave');
    if (preview) preview.style.display = 'none';
    if (previewImg) { previewImg.src = ''; previewImg.style.display = ''; }
    if (fileInfo) fileInfo.innerHTML = '';
    if (icon) icon.textContent = '📋';
    if (text) text.textContent = (_dm.opts && _dm.opts.acceptImages) ? 'Pega o suelta tu imagen aquí' : 'Suelta tu archivo aquí';
    if (cap) cap.value = '';
    if (save) save.disabled = true;
  }

  function _dmCancel(){
    const ov = document.getElementById('nbsDropOverlay');
    if (ov) ov.classList.remove('on');
    document.body.style.overflow = '';
    if (_dm.resolve) { _dm.resolve(null); }
    _dm.active = false;
    _dm.resolve = null;
    _dmReset();
  }

  function _dmSave(){
    if (!_dm.file) return;
    const cap = document.getElementById('nbsDropCaption');
    const result = {
      file: _dm.file,
      name: _dm.file.name,
      size: _dm.file.size,
      type: _dm.file.type,
      dataUrl: _dm.dataUrl,
      caption: cap ? cap.value : '',
    };
    const resolve = _dm.resolve;
    const ov = document.getElementById('nbsDropOverlay');
    if (ov) ov.classList.remove('on');
    document.body.style.overflow = '';
    _dm.active = false;
    _dm.resolve = null;
    _dmReset();
    if (resolve) resolve(result);
  }

  /**
   * Open unified drag/drop/paste/click modal.
   * @param {{title?:string, hint?:string, acceptImages?:boolean, allowedExt?:string[], accept?:string, maxBytes?:number}} opts
   * @returns {Promise<{file, name, size, type, dataUrl?, caption}|null>}  Resolves to result or null if cancelled.
   */
  function openDropModal(opts){
    return new Promise(resolve => {
      _ensureModal();
      _dm.active = true;
      _dm.opts = Object.assign({ allowPaste: !!(opts && opts.acceptImages) }, opts || {});
      _dm.resolve = resolve;
      _dmReset();
      const title = document.getElementById('nbsDropTitle');
      const hint = document.getElementById('nbsDropHint');
      const pasteHint = document.getElementById('nbsDropPasteHint');
      const text = document.getElementById('nbsDropText');
      if (title) title.textContent = (opts && opts.title) || (opts && opts.acceptImages ? '🖼️ Agregar imagen en HD' : '📎 Adjuntar archivo');
      if (hint) hint.textContent = (opts && opts.hint) || (opts && opts.acceptImages ? 'PNG · JPG · WEBP · calidad HD (máx ' + fmtBytes(_dm.opts.maxBytes||MAX_BYTES) + ')' : 'PDF · Word · Excel · PPT · TXT · CSV · ZIP (máx ' + fmtBytes(_dm.opts.maxBytes||MAX_BYTES) + ')');
      if (pasteHint) pasteHint.innerHTML = _dm.opts.allowPaste ? 'Pega (<kbd>Ctrl+V</kbd>) · ' : '';
      if (text) text.textContent = _dm.opts.acceptImages ? 'Pega o suelta tu imagen aquí' : 'Suelta tu archivo aquí';
      const ov = document.getElementById('nbsDropOverlay');
      if (ov) ov.classList.add('on');
      document.body.style.overflow = 'hidden';
      setTimeout(() => { const dz = document.getElementById('nbsDropZone'); if (dz) dz.focus(); }, 50);
    });
  }

  /**
   * High-level helper: open modal for an attachment and store it in IndexedDB.
   * @param {string} prefix  ID prefix
   * @returns {Promise<{id,name,type,size,ext,addedAt,caption}|null>}
   */
  async function pickAttachmentViaModal(prefix){
    const r = await openDropModal({
      title: '📎 Adjuntar archivo',
      acceptImages: false,
      allowedExt: ALLOWED_EXT,
      accept: '.' + ALLOWED_EXT.join(',.'),
      maxBytes: MAX_BYTES,
    });
    if (!r) return null;
    const ext = extOf(r.name);
    const id = (prefix || 'att') + '_' + Date.now() + '_' + Math.random().toString(36).slice(2,7);
    await putBlob(id, r.file, { name: r.name, type: r.type, size: r.size, ext, addedAt: new Date().toISOString(), caption: r.caption || '' });
    return { id, name: r.name, type: r.type, size: r.size, ext, addedAt: new Date().toISOString(), caption: r.caption || '' };
  }

  /**
   * High-level helper: open modal for an image and return its dataUrl + caption.
   * @returns {Promise<{dataUrl, caption, name}|null>}
   */
  async function pickImageViaModal(){
    const r = await openDropModal({
      title: '🖼️ Agregar imagen en HD',
      acceptImages: true,
      accept: 'image/*',
      maxBytes: 25 * 1024 * 1024, // 25 MB for images
    });
    if (!r) return null;
    return { dataUrl: r.dataUrl, caption: r.caption || '', name: r.name };
  }

  /* ═══════════════════════════════════════════════════════════════
     DESIGN MODAL — Cover + Icon picker as popup
  ═══════════════════════════════════════════════════════════════ */
  let _design = { active: false, cover: 'c1', icon: '📘', resolve: null, name: '' };

  function _ensureDesignModal(){
    if (document.getElementById('nbsDesignOverlay')) return;
    const html = `
<div class="nbs-design-overlay" id="nbsDesignOverlay">
  <div class="nbs-design-modal" onclick="event.stopPropagation()">
    <button class="nbs-drop-close" onclick="NBShared._designCancel()" title="Cerrar (Esc)">✕</button>
    <div class="nbs-drop-head">
      <div class="nbs-drop-title">🎨 Diseño del cuaderno</div>
      <div class="nbs-drop-sub">Elige una portada y un ícono. Los cambios se aplican al confirmar.</div>
    </div>
    <div class="nbs-design-preview" id="nbsDesignPreview"></div>
    <div class="nb-pickergroup">
      <div class="nb-pickergroup-h">· portada ·</div>
      <div id="nbsDesignCoverPicker"></div>
    </div>
    <div class="nb-pickergroup">
      <div class="nb-pickergroup-h">· ícono ·</div>
      <div id="nbsDesignIconPicker"></div>
    </div>
    <div class="nbs-drop-actions">
      <button class="nbs-drop-btn nbs-drop-btn-cancel" onclick="NBShared._designCancel()">Cancelar</button>
      <button class="nbs-drop-btn nbs-drop-btn-save" onclick="NBShared._designSave()">✓ Aplicar diseño</button>
    </div>
  </div>
</div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    const ov = document.getElementById('nbsDesignOverlay');
    ov.addEventListener('click', e => { if (e.target === ov) _designCancel(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && _design.active) _designCancel(); });
  }

  function _designRender(){
    const cover = document.getElementById('nbsDesignCoverPicker');
    const icon = document.getElementById('nbsDesignIconPicker');
    const preview = document.getElementById('nbsDesignPreview');
    if (cover) cover.innerHTML = renderCoverPicker(_design.cover, 'NBShared._designPickCover');
    if (icon) icon.innerHTML = renderIconPicker(_design.icon, 'NBShared._designPickIcon');
    if (preview) preview.innerHTML = `<div class="nb-cover-card nb-cover-${_design.cover}">
      <div class="nb-cover-icon">${_design.icon}</div>
      <div>
        <div class="nb-cover-title">${_design.name || 'Vista previa'}</div>
        <div class="nb-cover-sub">${COVERS.find(c=>c.id===_design.cover)?.label || ''}</div>
      </div>
    </div>`;
  }

  function _designPickCover(c){ _design.cover = c; _designRender(); }
  function _designPickIcon(ic){ _design.icon = ic; _designRender(); }

  function _designCancel(){
    const ov = document.getElementById('nbsDesignOverlay');
    if (ov) ov.classList.remove('on');
    document.body.style.overflow = '';
    if (_design.resolve) _design.resolve(null);
    _design.active = false;
    _design.resolve = null;
  }

  function _designSave(){
    const result = { cover: _design.cover, icon: _design.icon };
    const resolve = _design.resolve;
    const ov = document.getElementById('nbsDesignOverlay');
    if (ov) ov.classList.remove('on');
    document.body.style.overflow = '';
    _design.active = false;
    _design.resolve = null;
    if (resolve) resolve(result);
  }

  /**
   * Open design picker modal.
   * @param {{cover?:string, icon?:string, name?:string}} current
   * @returns {Promise<{cover, icon}|null>}
   */
  function openDesignModal(current){
    return new Promise(resolve => {
      _ensureDesignModal();
      _design.active = true;
      _design.cover = (current && current.cover) || 'c1';
      _design.icon = (current && current.icon) || '📘';
      _design.name = (current && current.name) || '';
      _design.resolve = resolve;
      _designRender();
      const ov = document.getElementById('nbsDesignOverlay');
      if (ov) ov.classList.add('on');
      document.body.style.overflow = 'hidden';
    });
  }

  /* ── PUBLIC API ────────────────────────────────────────────── */
  window.NBShared = {
    COVERS, ICON_GROUPS, ALL_ICONS,
    iconForExt, fmtBytes, extOf,
    pickAndStoreAttachment, downloadAttachment, deleteBlob, getBlob,
    renderAttachmentChips, renderCoverPicker, renderIconPicker,
    MAX_BYTES,
    // Image compression utilities
    compressImage, dataUrlBytes,
    // Drop modal
    openDropModal, pickAttachmentViaModal, pickImageViaModal,
    _dmCancel, _dmSave, _dmPick,
    // Design modal
    openDesignModal,
    _designCancel, _designSave, _designPickCover, _designPickIcon,
  };
})();
