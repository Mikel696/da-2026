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

  /* ── INDEXEDDB STORAGE (attachments + images) ──────────────────
   * VERSION 2: added 'images' store. Full-quality images live here
   * (cap 50 MB each). Only thumbnails (~10 KB) flow through localStorage
   * → Supabase JSONB. This decouples notebook content size from the
   * cloud sync row limit (~1 MB) and the localStorage quota (~5 MB).
   * ─────────────────────────────────────────────────────────────── */
  const DB_NAME = 'da2026_nb';
  const STORE = 'attachments';
  const STORE_IMG = 'images';
  const VERSION = 2;
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
        if (!db.objectStoreNames.contains(STORE_IMG)) {
          db.createObjectStore(STORE_IMG, { keyPath: 'id' });
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
    // 1) Eliminar de Supabase Storage (no-op si no estaba)
    try { await cloudDeleteAttachment(id); } catch(e) { /* ignore */ }
    // 2) Eliminar de IDB local
    const db = await openDB();
    return new Promise((res, rej) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => res(true);
      tx.onerror = () => rej(tx.error);
    });
  }

  /* ── SUPABASE STORAGE · sync de blobs cross-device ───────────
     Bucket: `attachments` (privado, RLS por user_id).
     Path: <auth.uid>/<blob_id>
     Si el bucket no existe o RLS falla, los uploads simplemente no
     persisten en cloud — el blob queda local. Mensaje de error claro.
  */
  const BUCKET = 'attachments';
  async function _currentUserId(){
    try {
      if (!window.SB) return null;
      const { data } = await window.SB.auth.getUser();
      return data && data.user && data.user.id || null;
    } catch { return null; }
  }
  async function cloudUploadAttachment(id, blob){
    if (!window.SB) return { ok:false, reason:'sb-not-loaded' };
    const uid = await _currentUserId();
    if (!uid) return { ok:false, reason:'not-authenticated' };
    const path = uid + '/' + id;
    try {
      const { error } = await window.SB.storage.from(BUCKET).upload(path, blob, {
        upsert: true,
        contentType: blob.type || 'application/octet-stream',
      });
      if (error) {
        console.warn('[NBShared] cloud upload failed:', error.message || error);
        return { ok:false, reason:'upload-failed', error };
      }
      return { ok:true, path };
    } catch (e) {
      console.warn('[NBShared] cloud upload exception:', e);
      return { ok:false, reason:'exception', error:e };
    }
  }
  async function cloudDownloadAttachment(id){
    if (!window.SB) return null;
    const uid = await _currentUserId();
    if (!uid) return null;
    const path = uid + '/' + id;
    try {
      const { data, error } = await window.SB.storage.from(BUCKET).download(path);
      if (error || !data) return null;
      return data; // Blob
    } catch (e) {
      console.warn('[NBShared] cloud download exception:', e);
      return null;
    }
  }
  async function cloudDeleteAttachment(id){
    if (!window.SB) return;
    const uid = await _currentUserId();
    if (!uid) return;
    const path = uid + '/' + id;
    try { await window.SB.storage.from(BUCKET).remove([path]); } catch(e) { /* ignore */ }
  }

  /* ── IMAGE STORE (full quality) ─────────────────────────────── */
  async function putImage(id, dataUrl){
    const db = await openDB();
    return new Promise((res, rej) => {
      const tx = db.transaction(STORE_IMG, 'readwrite');
      tx.objectStore(STORE_IMG).put({ id, dataUrl, addedAt: new Date().toISOString() });
      tx.oncomplete = () => res(true);
      tx.onerror = () => rej(tx.error);
    });
  }
  async function getImage(id){
    const db = await openDB();
    return new Promise((res, rej) => {
      const tx = db.transaction(STORE_IMG, 'readonly');
      const req = tx.objectStore(STORE_IMG).get(id);
      req.onsuccess = () => res(req.result ? req.result.dataUrl : null);
      req.onerror = () => rej(req.error);
    });
  }
  async function deleteImage(id){
    const db = await openDB();
    return new Promise((res, rej) => {
      const tx = db.transaction(STORE_IMG, 'readwrite');
      tx.objectStore(STORE_IMG).delete(id);
      tx.oncomplete = () => res(true);
      tx.onerror = () => rej(tx.error);
    });
  }

  /**
   * Store an image in 3 quality tiers. Solves cross-device quality drop:
   * before, only a 240px thumbnail was synced → on other PCs the lightbox
   * showed that 240px scaled up, looking blurry.
   *
   *   Tier 1  thumbnail  ~320px  q 0.70  ~25 KB   → grid view (fast load)
   *   Tier 2  preview   ~1280px  q 0.78  ~180 KB  → cross-device lightbox
   *   Tier 3  full      ~1920px  q 0.85  ~400 KB  → IDB only (origin HD)
   *
   * Tiers 1 & 2 are stored in the page payload (sync via Supabase JSONB).
   * Tier 3 lives only in IndexedDB on the originating device.
   *
   * Storage budget per image synced: ~205 KB. 5 images = ~1 MB row.
   *
   * @param dataUrl  raw or compressed image dataURL
   * @param caption  user-provided caption
   * @returns {Promise<{id,thumbnail,preview,caption,size,addedAt}>}
   */
  async function storeImageWithThumbnail(dataUrl, caption){
    const full    = await compressImage(dataUrl, { maxDim: 1920, quality: 0.85 });
    const preview = await compressImage(dataUrl, { maxDim: 1280, quality: 0.78 });
    const thumb   = await compressImage(dataUrl, { maxDim: 320,  quality: 0.70 });
    const id = 'img_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    await putImage(id, full);
    return {
      id,
      thumbnail: thumb,
      preview,
      caption: caption || '',
      size: dataUrlBytes(full),
      addedAt: new Date().toISOString()
    };
  }

  /**
   * Resolve the BEST available image dataURL:
   *   IDB full (origin HD) > preview (synced cross-device HD) > thumbnail (grid)
   *   > legacy `data` field (un-migrated images)
   * Cross-device users get a 1280px image instead of a 240px stretched one.
   */
  async function resolveImageData(imgRecord){
    if (!imgRecord) return null;
    if (imgRecord.id) {
      const full = await getImage(imgRecord.id);
      if (full) return full;
    }
    return imgRecord.preview || imgRecord.data || imgRecord.thumbnail || null;
  }

  /**
   * Migration on page open. Two cases handled:
   *   1. Legacy {data: dataUrl} → split into 3 tiers + IDB.
   *   2. Older IDB records {id, thumbnail (240px), no preview} → if the
   *      origin device has the full image in IDB, regenerate preview +
   *      bigger thumbnail so cross-device viewing improves.
   * Caller saves the page if `page._migrated` is set.
   */
  async function migrateLegacyImages(page){
    if (!page || !page.images || !page.images.length) return page;
    let mutated = false;
    for (let i = 0; i < page.images.length; i++) {
      const im = page.images[i];
      if (!im) continue;
      // Case 1: legacy inline data
      if (im.data && !im.id) {
        try {
          const newRec = await storeImageWithThumbnail(im.data, im.caption || '');
          page.images[i] = newRec;
          mutated = true;
        } catch(e) { /* keep legacy on failure */ }
      }
      // Case 2: IDB record from older schema (no preview tier) — only
      // upgradable on origin device where IDB has the full image.
      else if (im.id && !im.preview) {
        try {
          const fullUrl = await getImage(im.id);
          if (fullUrl) {
            const preview = await compressImage(fullUrl, { maxDim: 1280, quality: 0.78 });
            const thumb   = await compressImage(fullUrl, { maxDim: 320,  quality: 0.70 });
            page.images[i] = Object.assign({}, im, { preview, thumbnail: thumb });
            mutated = true;
          }
        } catch(e) {}
      }
    }
    page._migrated = mutated || page._migrated;
    return page;
  }

  /* Allowed types (extension whitelist) */
  const ALLOWED_EXT = ['pdf','doc','docx','xls','xlsx','ppt','pptx','txt','csv','md','zip','png','jpg','jpeg','gif','webp','svg','heic','json','xml','log'];
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
      inp.accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.md,.zip,.png,.jpg,.jpeg,.gif,.webp,.svg,.heic,.json,.xml,.log';
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
        const addedAt = new Date().toISOString();
        try {
          // 1) Guardar local en IDB (rápido, offline-first)
          await putBlob(id, f, { name: f.name, type: f.type, size: f.size, ext, addedAt });
          // 2) Upload a Supabase Storage en background (no bloquea la UI)
          const upRes = await cloudUploadAttachment(id, f);
          resolve({ id, name: f.name, type: f.type, size: f.size, ext, addedAt, cloud: !!upRes.ok });
        } catch (err) { reject(err); }
      };
      inp.click();
    });
  }

  /** Trigger download of an attachment.
   *  Primero busca en IDB local. Si no está (otro device), descarga desde Supabase Storage.
   */
  async function downloadAttachment(id, fallbackName){
    // 1) Intentar local
    const rec = await getBlob(id);
    if (rec && rec.blob) {
      const url = URL.createObjectURL(rec.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = rec.name || fallbackName || 'attachment';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 200);
      return;
    }
    // 2) Fallback: descargar desde Supabase Storage y cachear en IDB
    const cloudBlob = await cloudDownloadAttachment(id);
    if (cloudBlob) {
      // cachear para próxima vez
      try {
        const meta = { name: fallbackName || 'attachment', type: cloudBlob.type || '', size: cloudBlob.size || 0, ext: (fallbackName||'').split('.').pop().toLowerCase(), addedAt: new Date().toISOString() };
        await putBlob(id, cloudBlob, meta);
      } catch {}
      const url = URL.createObjectURL(cloudBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fallbackName || 'attachment';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 200);
      return;
    }
    // 3) Nada disponible
    alert('Archivo no encontrado.\n\nPosibles causas:\n• No hay sesión activa (login en este device).\n• El bucket "attachments" de Supabase no está creado.\n• El archivo fue subido antes de que se activara cloud sync.\n\nSolución para archivos viejos: re-subilos desde el device de origen.');
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
    const addedAt = new Date().toISOString();
    await putBlob(id, r.file, { name: r.name, type: r.type, size: r.size, ext, addedAt, caption: r.caption || '' });
    // Cloud sync background
    const upRes = await cloudUploadAttachment(id, r.file);
    return { id, name: r.name, type: r.type, size: r.size, ext, addedAt, caption: r.caption || '', cloud: !!upRes.ok };
  }

  /**
   * Legacy helper: open modal and return inline dataUrl + caption.
   * Kept for back-compat. New callers should use pickImageRecordViaModal.
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

  /**
   * NEW (recommended): open modal and store the full image in IDB,
   * returning a thin metadata record {id, thumbnail, caption, size, addedAt}.
   * The thumbnail is small enough to sync (~10 KB), the full image stays
   * in IndexedDB on this device. Use NBShared.resolveImageData(record) at
   * render time to get the full image dataURL back.
   * @returns {Promise<{id, thumbnail, caption, size, addedAt, name}|null>}
   */
  async function pickImageRecordViaModal(){
    const r = await openDropModal({
      title: '🖼️ Agregar imagen en HD',
      acceptImages: true,
      accept: 'image/*',
      maxBytes: 25 * 1024 * 1024,
    });
    if (!r) return null;
    const rec = await storeImageWithThumbnail(r.dataUrl, r.caption || r.name || '');
    return Object.assign({ name: r.name }, rec);
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

  /* ══════════════════════════════════════════════════════════════
     CLEAN PASTE HANDLER · normaliza pegado dentro del editor .nb-content
     Bug fix: cuando pegabas texto desde Word/Web/Google Docs traía
     inline-styles (font-family, line-height, padding, margins) que
     rompían el alineado con los renglones del cuaderno (line-height:32px).
     Solución: interceptar paste, detectar imágenes (bloquear con hint),
     y pegar SOLO texto plano sin formato — el usuario formatea con la
     toolbar después. También maneja URLs auto-convertidas a links.
  ══════════════════════════════════════════════════════════════ */
  function attachCleanPaste(el){
    if (!el || el._nbPasteAttached) return;
    el._nbPasteAttached = true;
    el.addEventListener('paste', (e) => {
      const cb = e.clipboardData || window.clipboardData;
      if (!cb) return;
      // 1) Imagen pegada como file (screenshot, Win+Shift+S, archivo del Explorer)
      for (let i = 0; i < (cb.items || []).length; i++) {
        const it = cb.items[i];
        if (it && it.kind === 'file' && /^image\//.test(it.type)) {
          const f = it.getAsFile();
          if (f) {
            e.preventDefault();
            _insertImageFromFile(f, el).catch(err => console.warn('paste image (file) failed:', err));
            return;
          }
        }
      }
      // 1b) Lista de archivos directo (algunos navegadores)
      if (cb.files && cb.files.length) {
        for (let i = 0; i < cb.files.length; i++) {
          const f = cb.files[i];
          if (f && /^image\//.test(f.type)) {
            e.preventDefault();
            _insertImageFromFile(f, el).catch(err => console.warn('paste image (files) failed:', err));
            return;
          }
        }
      }
      // 1c) HTML paste con <img src="data:..."> (típico al copiar desde una web)
      const html = cb.getData && cb.getData('text/html');
      if (html) {
        const m = html.match(/<img[^>]+src=["']?(data:image\/[a-z+]+;base64,[^"'\s>]+)/i);
        if (m && m[1]) {
          e.preventDefault();
          _dataUrlToFile(m[1], 'pasted.png')
            .then(f => _insertImageFromFile(f, el))
            .catch(err => console.warn('paste image (html data:) failed:', err));
          return;
        }
      }
      // 1d) text/plain o text/uri-list que sea data: URL de imagen
      const txt = cb.getData && (cb.getData('text/uri-list') || cb.getData('text/plain'));
      if (txt) {
        const t = txt.trim();
        if (/^data:image\//i.test(t)) {
          e.preventDefault();
          _dataUrlToFile(t, 'pasted.png')
            .then(f => _insertImageFromFile(f, el))
            .catch(err => console.warn('paste image (data: uri) failed:', err));
          return;
        }
      }
      // 2) Texto plano → reemplazamos el comportamiento default (que pega HTML formateado)
      const text = cb.getData('text/plain');
      if (text == null || text === '') return;
      e.preventDefault();
      // insertText preserva undo/redo del navegador
      if (document.queryCommandSupported && document.queryCommandSupported('insertText')) {
        document.execCommand('insertText', false, text);
      } else {
        // Fallback: insertar en el rango actual
        const sel = window.getSelection();
        if (sel && sel.rangeCount) {
          const r = sel.getRangeAt(0);
          r.deleteContents();
          r.insertNode(document.createTextNode(text));
          r.collapse(false);
        }
      }
    });
  }

  /* ══════════════════════════════════════════════════════════════
     CHECKLIST CLICK HANDLER · alterna ☐ ↔ ✓ al hacer click
     Se monta una sola vez por editor; usa event delegation.
  ══════════════════════════════════════════════════════════════ */
  function attachChecklistToggle(el){
    if (!el || el._nbCheckAttached) return;
    el._nbCheckAttached = true;
    el.addEventListener('click', (e) => {
      const t = e.target;
      if (t && t.classList && t.classList.contains('nb-check')) {
        const isDone = t.textContent.trim() === '✓';
        t.textContent = isDone ? '☐' : '✓';
        t.classList.toggle('nb-check-done', !isDone);
        // Disparar input para que se guarde
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
  }

  /* ══════════════════════════════════════════════════════════════
     SYNTAX HIGHLIGHTING para .nb-code[data-lang] · usa highlight.js
     (cargado via CDN en notes.html). Estrategia "highlight on idle":
       - render → aplicamos hljs.highlightElement una vez (data-hl="1")
       - user click adentro → stripeamos a texto plano para editar
       - user blur fuera → re-aplicamos highlight
     Evita el conflicto cursor + spans-de-color en contenteditable.
  ══════════════════════════════════════════════════════════════ */
  function _hljsReady(){ return typeof window.hljs !== 'undefined' && window.hljs && window.hljs.highlightElement; }
  function applyHighlight(root){
    if (!_hljsReady()) return;
    const scope = root || document;
    scope.querySelectorAll('.nb-code[data-lang]:not([data-hl="1"])').forEach(code => {
      const lang = code.getAttribute('data-lang') || '';
      if (!lang) { code.setAttribute('data-hl', '1'); return; }
      try {
        code.className = 'nb-code language-' + lang;
        code.setAttribute('data-hl', '1');
        const txt = code.innerText || '';
        code.textContent = txt; // limpiar spans previos si los hubiera
        window.hljs.highlightElement(code);
      } catch(e) { /* silent: lenguaje no soportado etc */ }
    });
  }
  function attachCodeBlockHandlers(el){
    if (!el || el._nbCodeAttached) return;
    el._nbCodeAttached = true;
    // Focus dentro → stripear spans para edición plana
    el.addEventListener('focusin', (e) => {
      const code = e.target.closest && e.target.closest('.nb-code');
      if (!code) return;
      if (code.getAttribute('data-hl') === '1') {
        const txt = code.innerText;
        code.textContent = txt;
        code.removeAttribute('data-hl');
      }
    });
    // Blur fuera del code block → re-highlight
    el.addEventListener('focusout', (e) => {
      const code = e.target.closest && e.target.closest('.nb-code');
      if (!code) return;
      // Debounce: si el siguiente focus también es dentro del mismo code, no re-highlight
      setTimeout(() => {
        if (document.activeElement === code) return;
        if (!_hljsReady()) return;
        const lang = code.getAttribute('data-lang') || '';
        if (!lang) return;
        try {
          code.className = 'nb-code language-' + lang;
          code.setAttribute('data-hl', '1');
          window.hljs.highlightElement(code);
        } catch(err) {}
      }, 60);
    });
    // Delegated: click en × delete → eliminar el .nb-code-wrap entero
    el.addEventListener('click', (e) => {
      const btn = e.target && e.target.closest && e.target.closest('.nb-block-del');
      if (!btn) return;
      const wrap = btn.closest('.nb-code-wrap, .nb-block');
      if (!wrap) return;
      e.preventDefault();
      e.stopPropagation();
      if (confirm('¿Eliminar este bloque?')) {
        wrap.remove();
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.focus();
      }
    });
    // Backspace al inicio de un code vacío → eliminar el wrapper
    el.addEventListener('keydown', (e) => {
      if (e.key !== 'Backspace') return;
      const code = e.target.closest && e.target.closest('.nb-code');
      if (!code) return;
      const txt = (code.innerText || '').replace(/​/g,'');
      if (txt.trim().length > 0) return; // hay contenido → backspace normal
      const wrap = code.closest('.nb-code-wrap');
      if (!wrap) return;
      e.preventDefault();
      wrap.remove();
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.focus();
    });
  }

  /* Click en imagen O chip → abrir HD overlay (full quality desde IDB si existe) */
  function attachImageClickHandler(el){
    if (!el || el._nbImgClickAttached) return;
    el._nbImgClickAttached = true;
    el.addEventListener('click', (e) => {
      const t = e.target;
      if (!t || !t.closest) return;
      // Chip compacto (nuevo)
      const chip = t.closest('.nb-img-chip');
      if (chip) {
        e.preventDefault();
        e.stopPropagation();
        _openImageHD(chip);
        return;
      }
      // Imagen inline legacy
      if (t.tagName === 'IMG' && t.classList && t.classList.contains('nb-img')) {
        e.preventDefault();
        e.stopPropagation();
        _openImageHD(t);
      }
    });
  }
  /* Auto-migración: agrega botón × a .nb-code-wrap legacy que no lo tienen
     (code blocks insertados antes de P7 venían sin botón de eliminar) */
  function _migrateCodeBlocks(editor){
    if (!editor) return;
    const wraps = editor.querySelectorAll('.nb-code-wrap');
    let changed = false;
    wraps.forEach(wrap => {
      if (wrap.querySelector(':scope > .nb-block-del')) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nb-block-del';
      btn.setAttribute('contenteditable', 'false');
      btn.setAttribute('title', 'Eliminar bloque de código');
      btn.setAttribute('aria-label', 'Eliminar bloque de código');
      btn.textContent = '×';
      // Insertar antes del primer <code> para que CSS lo coloque arriba-derecha
      const code = wraps.length ? wrap.querySelector('.nb-code') : null;
      if (code) wrap.insertBefore(btn, code);
      else wrap.appendChild(btn);
      changed = true;
    });
    if (changed) editor.dispatchEvent(new Event('input', { bubbles: true }));
  }
  /* Auto-migración: convierte <img class="nb-img"> legacy a chips compactos
     para que las imágenes ya insertadas dejen de cubrir la hoja. */
  function _migrateInlineImagesToChips(editor){
    if (!editor) return;
    const imgs = editor.querySelectorAll('img.nb-img');
    if (!imgs.length) return;
    let changed = false;
    imgs.forEach(img => {
      const chip = document.createElement('span');
      chip.className = 'nb-img-chip';
      chip.setAttribute('contenteditable', 'false');
      const id = img.getAttribute('data-img-id') || '';
      const rawName = img.getAttribute('alt') || 'imagen';
      const name = rawName.replace(/"/g, '');
      const label = name.length > 28 ? name.slice(0, 26) + '…' : name;
      if (id) chip.setAttribute('data-img-id', id);
      chip.setAttribute('data-name', name);
      if (img.src) chip.setAttribute('data-preview', img.src);
      chip.setAttribute('title', name + ' · click para abrir en HD');
      chip.innerHTML = '<span class="nb-img-chip-ic">🖼️</span>'
        + '<span class="nb-img-chip-name"></span>';
      // Set the label safely via textContent
      chip.querySelector('.nb-img-chip-name').textContent = label;
      img.parentNode.replaceChild(chip, img);
      changed = true;
    });
    if (changed) editor.dispatchEvent(new Event('input', { bubbles: true }));
  }

  /* Helper combinado · attachable a cualquier .nb-content */
  function attachEditorHandlers(el){
    attachCleanPaste(el);
    attachChecklistToggle(el);
    attachImageClickHandler(el);
    attachCodeBlockHandlers(el);
    // Migrar imágenes inline legacy a chips compactos (idempotente)
    _migrateInlineImagesToChips(el);
    // Migrar code blocks legacy para agregarles botón × de eliminar (idempotente)
    _migrateCodeBlocks(el);
    // Apply syntax highlighting una vez por render (asíncrono para no bloquear)
    if (_hljsReady()) setTimeout(() => applyHighlight(el), 0);
    else {
      // Si hljs aún no cargó, reintentar al cargarse
      let tries = 0;
      const iv = setInterval(() => {
        tries++;
        if (_hljsReady()) { applyHighlight(el); clearInterval(iv); }
        if (tries > 30) clearInterval(iv);
      }, 200);
    }
  }

  /* ══════════════════════════════════════════════════════════════
     EXTENDED FORMAT COMMANDS · listas / checklist / divider
     Los módulos llaman fmt('ol' | 'ul' | 'check' | 'hr') desde su
     toolbar. Centralizar acá garantiza comportamiento consistente.
  ══════════════════════════════════════════════════════════════ */
  /** Limpia state de foreColor heredado de operaciones previas de highlight
   *  (que setea foreColor=#1a1a1a). Sin esto, las listas y otras inserciones
   *  posteriores heredan ese color oscuro y aparecen negras sobre el fondo
   *  oscuro del cuaderno. */
  function _resetForeColorState(){
    try {
      // styleWithCSS false → no aplicar color como inline style
      document.execCommand('styleWithCSS', false, false);
      // foreColor a un valor "transparente" para limpiar el state
      // ('inherit' no es valid argumento de foreColor — usamos el color del editor)
      document.execCommand('foreColor', false, '#e4e8f4');
    } catch(e) {}
  }

  /** Recorre la selección y remueve color inline #1a1a1a (heredado del highlight)
   *  en elementos que NO tienen background-color (preservando texto highlighted). */
  function _cleanInheritedDarkColor(rootEl){
    if (!rootEl) return;
    rootEl.querySelectorAll('font[color]').forEach(f => {
      const c = (f.getAttribute('color') || '').toLowerCase();
      if (c === '#1a1a1a' || c === 'rgb(26, 26, 26)' || c === 'rgb(26,26,26)') {
        const hasHighlight = f.style.backgroundColor || f.querySelector('[style*="background"]');
        if (!hasHighlight) f.removeAttribute('color');
      }
    });
    rootEl.querySelectorAll('[style*="color"]').forEach(e => {
      const col = (e.style.color || '').replace(/\s/g, '').toLowerCase();
      if (col === 'rgb(26,26,26)' || col === '#1a1a1a') {
        if (!e.style.backgroundColor) e.style.color = '';
      }
    });
  }

  function fmtExtended(kind){
    try {
      if (kind === 'ol' || kind === 'ul') {
        // FIX bug: si antes hiciste highlight, el state foreColor quedó en #1a1a1a
        // y las listas heredan ese color. Reseteamos primero.
        _resetForeColorState();
        document.execCommand(kind === 'ol' ? 'insertOrderedList' : 'insertUnorderedList');
        // Limpiar cualquier color oscuro residual en los nodos recién creados
        const sel = window.getSelection();
        if (sel && sel.rangeCount) {
          const node = sel.getRangeAt(0).startContainer;
          const li = (node.nodeType === 3 ? node.parentElement : node)?.closest?.('li');
          if (li) _cleanInheritedDarkColor(li);
        }
      } else if (kind === 'hr') {
        document.execCommand('insertHorizontalRule');
      } else if (kind === 'check') {
        // Insertar checkbox toggleable + espacio. contenteditable=false evita
        // que el cursor entre dentro y se rompa al escribir.
        document.execCommand('insertHTML', false, '<span class="nb-check" contenteditable="false">☐</span>&nbsp;');
      } else if (kind === 'indent') {
        document.execCommand('indent');
      } else if (kind === 'outdent') {
        document.execCommand('outdent');
      } else {
        return false;
      }
      return true;
    } catch (e) {
      console.warn('NB fmtExtended failed:', kind, e);
      return false;
    }
  }

  /* ══════════════════════════════════════════════════════════════
     SHARED TOOLBAR HTML · usado por los 3 editores (10-SYS, 13-NOT, 14-WORK)
     Cada módulo lo embebe via NBShared.toolbarHtml(sid, namespace).
     - namespace: 'NB' (10-SYS) | 'NotNB' (13-NOT) | 'WorkNB' (14-WORK)
     Las llamadas onclick siguen apuntando al fmt() del módulo, así cada
     uno mantiene su flujo de auto-save propio.
  ══════════════════════════════════════════════════════════════ */
  function toolbarHtml(sid, ns){
    const N = ns || 'NB';
    return `<div class="nb-rt-toolbar">
      <button class="nb-rt-btn" onclick="${N}.fmt('${sid}','bold')" title="Negrita (Ctrl+B)"><b>B</b></button>
      <span class="nb-rt-sep"></span>
      <button class="nb-rt-btn nb-rt-sz-s" onclick="${N}.fmt('${sid}','size','s')" title="Texto pequeño">S</button>
      <button class="nb-rt-btn nb-rt-sz-m" onclick="${N}.fmt('${sid}','size','m')" title="Texto normal">M</button>
      <button class="nb-rt-btn nb-rt-sz-l" onclick="${N}.fmt('${sid}','size','l')" title="Texto grande">L</button>
      <span class="nb-rt-sep"></span>
      <button class="nb-rt-btn" onclick="${N}.fmt('${sid}','ol')" title="Lista numerada (1. 2. 3.)">1.</button>
      <button class="nb-rt-btn" onclick="${N}.fmt('${sid}','ul')" title="Lista con viñetas">•</button>
      <button class="nb-rt-btn" onclick="${N}.fmt('${sid}','check')" title="Casilla marcable (click para tachar)">☐</button>
      <button class="nb-rt-btn" onclick="${N}.fmt('${sid}','hr')" title="Línea separadora">―</button>
      <span class="nb-rt-sep"></span>
      <button class="nb-rt-btn nb-rt-hl nb-rt-hl-y" onclick="${N}.fmt('${sid}','hl','y')" title="Resaltar amarillo"></button>
      <button class="nb-rt-btn nb-rt-hl nb-rt-hl-g" onclick="${N}.fmt('${sid}','hl','g')" title="Resaltar verde"></button>
      <button class="nb-rt-btn nb-rt-hl nb-rt-hl-p" onclick="${N}.fmt('${sid}','hl','p')" title="Resaltar rosa"></button>
      <button class="nb-rt-btn" onclick="${N}.fmt('${sid}','clear')" title="Quitar formato">✕</button>
      <span class="nb-rt-sep"></span>
      <button class="nb-rt-btn nb-rt-lbl nb-rt-lbl-u" onclick="${N}.insertLabel('${sid}','urgent')" title="Insertar etiqueta URGENTE">⚠ URGENTE</button>
      <button class="nb-rt-btn nb-rt-lbl nb-rt-lbl-d" onclick="${N}.insertLabel('${sid}','done')" title="Insertar etiqueta HECHO">✓ HECHO</button>
      <span class="nb-rt-sep"></span>
      <button class="nb-rt-btn nb-rt-img" onclick="NBShared.insertImage('${sid}','${N}')" title="Insertar imagen (archivo o portapapeles) · HD preview + IDB full" aria-label="Insertar imagen">🖼️ Imagen</button>
      <button class="nb-rt-btn nb-rt-imglist" onclick="NBShared.openImageMenu('${sid}','${N}')" title="Lista de imágenes de esta página · click para abrir en HD" aria-label="Lista de imágenes">📂 Lista</button>
      <button class="nb-rt-btn nb-rt-link" onclick="${N}.addLink('${sid}')" title="Agregar link a la página" aria-label="Agregar link">🔗 Link</button>
      <button class="nb-rt-btn nb-rt-attach" onclick="${N}.attachFile('${sid}')" title="Adjuntar archivo (PDF / Word / Excel / etc · IDB local + Supabase Storage)" aria-label="Adjuntar archivo">📎 Adjuntar</button>
      <button class="nb-rt-btn nb-rt-code" onclick="NBShared.insertCodeBlock('${sid}','${N}')" title="Insertar bloque de código (monospace · syntax-friendly)" aria-label="Insertar bloque de código">&lt;/&gt; Code</button>
    </div>`;
  }

  /* ══════════════════════════════════════════════════════════════
     INLINE IMAGE INSERT · file picker o clipboard → <img class="nb-img">
     embebido inline en el editor. Guarda preview (~1280px ~150KB) en el
     body (sincroniza cross-device vía JSONB) + full (~1920px) en IDB para
     ver HD en el dispositivo de origen.
     Uso: <button onclick="NBShared.insertImage(sid, ns)">
  ══════════════════════════════════════════════════════════════ */
  function _findEditor(sid){
    if (sid) {
      const el = document.getElementById('nbBody-' + sid);
      if (el && el.isContentEditable) return el;
    }
    const ae = document.activeElement;
    if (ae && ae.classList && ae.classList.contains('nb-content')) return ae;
    return document.querySelector('.nb-content[contenteditable="true"]');
  }
  function _readFileAsDataURL(file){
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = () => reject(fr.error);
      fr.readAsDataURL(file);
    });
  }
  /* Convierte un data:image/...;base64,... a File para el pipeline normal */
  async function _dataUrlToFile(dataUrl, filename){
    const m = String(dataUrl).match(/^data:([^;]+);base64,(.+)$/);
    if (!m) throw new Error('not-a-data-url');
    const mime = m[1] || 'image/png';
    const b64 = m[2];
    const bin = atob(b64);
    const len = bin.length;
    const buf = new Uint8Array(len);
    for (let i = 0; i < len; i++) buf[i] = bin.charCodeAt(i);
    const blob = new Blob([buf], { type: mime });
    const ext = (mime.split('/')[1] || 'png').replace('+xml','').replace('jpeg','jpg');
    return new File([blob], filename || ('pasted.' + ext), { type: mime });
  }
  async function _insertImageFromFile(file, editor){
    if (!file || !/^image\//.test(file.type)) return false;
    if (file.size > 20 * 1024 * 1024) {
      alert('Imagen demasiado grande (máx 20 MB). La tuya: ' + fmtBytes(file.size));
      return false;
    }
    try {
      const rawUrl = await _readFileAsDataURL(file);
      // 3 tiers: full → IDB · preview → inline body (sync) · thumb → fallback
      const full    = await compressImage(rawUrl, { maxDim: 1920, quality: 0.85 });
      const preview = await compressImage(rawUrl, { maxDim: 1280, quality: 0.78 });
      const id = 'img_' + Date.now() + '_' + Math.random().toString(36).slice(2,7);
      try { await putImage(id, full); } catch(e) { /* IDB optional */ }
      const alt = (file.name || 'imagen').replace(/"/g, '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      const label = alt.length > 28 ? alt.slice(0, 26) + '…' : alt;
      // CHIP compacto en vez de <img> grande: no cubre la hoja, popup al click
      // data-preview lleva el preview 1280px (sincroniza cross-device vía JSONB)
      // data-img-id apunta al full en IDB (HD local) para overlay
      const html = '<span class="nb-img-chip" contenteditable="false"'
        + ' data-img-id="' + id + '"'
        + ' data-name="' + alt + '"'
        + ' data-preview="' + preview + '"'
        + ' title="' + alt + ' · click para abrir en HD">'
        + '<span class="nb-img-chip-ic">🖼️</span>'
        + '<span class="nb-img-chip-name">' + label + '</span>'
        + '</span>&nbsp;';
      if (editor && editor.focus) editor.focus();
      // Asegurar que el cursor esté dentro del editor — si no, append al final
      const sel = window.getSelection();
      let inside = false;
      if (sel && sel.rangeCount && editor) {
        let n = sel.getRangeAt(0).commonAncestorContainer;
        while (n) { if (n === editor) { inside = true; break; } n = n.parentNode; }
      }
      if (!inside && editor) {
        const r = document.createRange();
        r.selectNodeContents(editor);
        r.collapse(false);
        sel.removeAllRanges();
        sel.addRange(r);
      }
      try { document.execCommand('insertHTML', false, html); }
      catch(e) {
        if (sel && sel.rangeCount) {
          const r = sel.getRangeAt(0);
          const frag = r.createContextualFragment(html);
          r.deleteContents();
          r.insertNode(frag);
        }
      }
      if (editor) editor.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    } catch(e) {
      console.warn('[NBShared] insertImage failed:', e);
      alert('No pude insertar la imagen: ' + (e.message || e));
      return false;
    }
  }
  /* Modal unificado de "Insertar imagen": 3 caminos paralelos
       1) Drag & drop sobre la zona
       2) Ctrl+V dentro del modal (pega desde clipboard)
       3) Click en "Seleccionar archivo" (file picker)
     Cualquiera de los 3 inyecta vía _insertImageFromFile y cierra. */
  function _openInsertImageDialog(editor){
    let ov = document.getElementById('nbImgInsert');
    if (ov) ov.remove();
    ov = document.createElement('div');
    ov.id = 'nbImgInsert';
    ov.tabIndex = -1; // necesario para que reciba focus y dispare paste
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:99998;display:flex;align-items:center;justify-content:center;padding:20px;outline:none';
    ov.innerHTML =
      '<div style="background:var(--c1);border:1px solid var(--bd);border-radius:14px;padding:20px;max-width:520px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.5)" onclick="event.stopPropagation()">'+
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">'+
          '<div>'+
            '<div style="font-size:14px;font-weight:600;color:var(--tx)">🖼️ Insertar imagen</div>'+
            '<div style="font-size:11px;color:var(--t3);margin-top:2px">Hay 3 formas: arrastrar archivo · pegar con Ctrl+V · seleccionar del PC</div>'+
          '</div>'+
          '<button id="nbImgInsClose" style="background:transparent;border:none;color:var(--t3);font-size:18px;cursor:pointer;padding:4px 8px" aria-label="Cerrar">✕</button>'+
        '</div>'+
        '<div id="nbImgInsDrop" tabindex="0" style="border:2px dashed var(--bd);border-radius:12px;padding:36px 20px;text-align:center;cursor:pointer;background:rgba(139,92,246,.04);transition:border-color .15s,background .15s;outline:none">'+
          '<div style="font-size:34px;margin-bottom:8px" aria-hidden="true">📥</div>'+
          '<div style="font-size:13px;font-weight:600;color:var(--tx);margin-bottom:4px">Soltá una imagen acá</div>'+
          '<div style="font-size:11px;color:var(--t3)">o pegá con <kbd style="background:var(--el);border:1px solid var(--bd);border-radius:4px;padding:1px 6px;font-family:inherit;font-size:10px">Ctrl</kbd> + <kbd style="background:var(--el);border:1px solid var(--bd);border-radius:4px;padding:1px 6px;font-family:inherit;font-size:10px">V</kbd></div>'+
        '</div>'+
        '<div style="display:flex;gap:6px;justify-content:space-between;align-items:center;margin-top:14px;flex-wrap:wrap">'+
          '<div style="font-size:10px;color:var(--t3)">PNG · JPG · WEBP · GIF · SVG · máx 20 MB</div>'+
          '<button id="nbImgInsPick" class="btn bo bs" style="display:inline-flex;align-items:center;gap:6px">📁 Seleccionar archivo</button>'+
        '</div>'+
      '</div>';
    document.body.appendChild(ov);
    const close = () => { ov.remove(); editor && editor.focus && editor.focus(); };
    const ingest = async (file) => {
      if (!file) return;
      const ok = await _insertImageFromFile(file, editor);
      if (ok) close();
    };
    document.getElementById('nbImgInsClose').onclick = close;
    ov.addEventListener('click', (e) => { if (e.target === ov) close(); });
    // Esc cierra
    ov.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    // File picker
    document.getElementById('nbImgInsPick').onclick = () => {
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = 'image/*';
      inp.onchange = (e) => { const f = e.target.files && e.target.files[0]; if (f) ingest(f); };
      inp.click();
    };
    // Drop zone
    const drop = document.getElementById('nbImgInsDrop');
    drop.addEventListener('click', () => document.getElementById('nbImgInsPick').click());
    ['dragenter','dragover'].forEach(ev => drop.addEventListener(ev, (e) => {
      e.preventDefault(); e.stopPropagation();
      drop.style.borderColor = '#a78bfa';
      drop.style.background = 'rgba(139,92,246,.12)';
    }));
    ['dragleave','dragend'].forEach(ev => drop.addEventListener(ev, (e) => {
      e.preventDefault();
      drop.style.borderColor = 'var(--bd)';
      drop.style.background = 'rgba(139,92,246,.04)';
    }));
    drop.addEventListener('drop', (e) => {
      e.preventDefault(); e.stopPropagation();
      drop.style.borderColor = 'var(--bd)';
      drop.style.background = 'rgba(139,92,246,.04)';
      const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) ingest(f);
    });
    // Paste handler (Ctrl+V) — robusto: files, HTML data:, text data:
    const onPaste = async (e) => {
      const cb = e.clipboardData || window.clipboardData;
      if (!cb) return;
      // files / items kind=file
      const itemArr = [];
      for (let i = 0; i < (cb.items || []).length; i++) itemArr.push(cb.items[i]);
      for (const it of itemArr) {
        if (it && it.kind === 'file' && /^image\//.test(it.type)) {
          const f = it.getAsFile();
          if (f) { e.preventDefault(); ingest(f); return; }
        }
      }
      if (cb.files && cb.files.length) {
        for (let i = 0; i < cb.files.length; i++) {
          const f = cb.files[i];
          if (f && /^image\//.test(f.type)) { e.preventDefault(); ingest(f); return; }
        }
      }
      // HTML con <img data:>
      const html = cb.getData && cb.getData('text/html');
      if (html) {
        const m = html.match(/<img[^>]+src=["']?(data:image\/[a-z+]+;base64,[^"'\s>]+)/i);
        if (m && m[1]) {
          e.preventDefault();
          try { ingest(await _dataUrlToFile(m[1], 'pasted.png')); } catch(err) { console.warn(err); }
          return;
        }
      }
      // text con data: URL pura
      const txt = cb.getData && (cb.getData('text/uri-list') || cb.getData('text/plain'));
      if (txt) {
        const t = txt.trim();
        if (/^data:image\//i.test(t)) {
          e.preventDefault();
          try { ingest(await _dataUrlToFile(t, 'pasted.png')); } catch(err) { console.warn(err); }
          return;
        }
      }
    };
    ov.addEventListener('paste', onPaste);
    drop.addEventListener('paste', onPaste);
    // Backup: listener global mientras el modal está abierto
    document.addEventListener('paste', onPaste);
    const _origClose = close;
    var _closeFn = () => { document.removeEventListener('paste', onPaste); _origClose(); };
    // Reemplazar los handlers de cierre con la versión que limpia el listener global
    document.getElementById('nbImgInsClose').onclick = _closeFn;
    ov.addEventListener('click', (e) => { if (e.target === ov) _closeFn(); });
    ov.addEventListener('keydown', (e) => { if (e.key === 'Escape') _closeFn(); });
    // Focus para captar Ctrl+V inmediato
    setTimeout(() => { try { ov.focus(); drop.focus(); } catch(e) {} }, 0);
  }
  async function insertImage(sid, ns){
    const editor = _findEditor(sid);
    if (!editor) { alert('No encontré el editor activo. Click adentro de la nota e intentá de nuevo.'); return; }
    _openInsertImageDialog(editor);
  }
  /* Dropdown · lista de imágenes de la página actual con thumbnails clickeables */
  function openImageMenu(sid, ns){
    const editor = _findEditor(sid);
    if (!editor) { alert('No encontré el editor activo.'); return; }
    // Recolectar tanto chips como imgs legacy
    const items = [];
    editor.querySelectorAll('.nb-img-chip, img.nb-img').forEach(el => {
      const id = el.getAttribute('data-img-id') || '';
      const name = el.getAttribute(el.tagName === 'IMG' ? 'alt' : 'data-name') || 'imagen';
      const preview = el.tagName === 'IMG' ? el.src : (el.getAttribute('data-preview') || '');
      items.push({ id, name, preview, el });
    });
    if (!items.length) {
      alert('Esta página todavía no tiene imágenes. Usá el botón "🖼️ Imagen" para insertar una.');
      return;
    }
    let ov = document.getElementById('nbImgMenu');
    if (ov) ov.remove();
    ov = document.createElement('div');
    ov.id = 'nbImgMenu';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:99998;display:flex;align-items:center;justify-content:center;padding:20px';
    const cards = items.map((it, i) => {
      const safeName = (it.name || 'imagen').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
      const thumbSrc = it.preview || '';
      return '<button class="nb-imgmenu-card" data-i="'+i+'" type="button" title="Click para abrir en HD" style="background:var(--c1);border:1px solid var(--bd);border-radius:10px;padding:8px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:6px;transition:border-color .15s,transform .15s;font-family:inherit;color:var(--tx)">'
        + (thumbSrc
            ? '<img src="'+thumbSrc+'" alt="" style="width:100%;height:90px;object-fit:cover;border-radius:6px;background:#111">'
            : '<div style="width:100%;height:90px;border-radius:6px;background:var(--el);display:flex;align-items:center;justify-content:center;font-size:24px">🖼️</div>')
        + '<div style="font-size:11px;color:var(--t2);max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+safeName+'</div>'
        + '</button>';
    }).join('');
    ov.innerHTML = '<div style="background:var(--c1);border:1px solid var(--bd);border-radius:14px;padding:20px;max-width:680px;width:100%;max-height:84vh;overflow:auto;box-shadow:0 20px 60px rgba(0,0,0,.5)">'+
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">'+
        '<div><div style="font-size:14px;font-weight:600;color:var(--tx)">📂 Imágenes de esta página</div>'+
        '<div style="font-size:11px;color:var(--t3);margin-top:2px">'+items.length+' imagen'+(items.length!==1?'es':'')+' · click para abrir en HD</div></div>'+
        '<button id="nbImgMenuClose" style="background:transparent;border:none;color:var(--t3);font-size:18px;cursor:pointer;padding:4px 8px" aria-label="Cerrar">✕</button>'+
      '</div>'+
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px">'+cards+'</div>'+
      '</div>';
    document.body.appendChild(ov);
    const close = () => ov.remove();
    document.getElementById('nbImgMenuClose').onclick = close;
    ov.addEventListener('click', (e) => { if (e.target === ov) close(); });
    ov.querySelectorAll('.nb-imgmenu-card').forEach(btn => {
      btn.onmouseover = () => { btn.style.borderColor = '#a78bfa'; btn.style.transform = 'translateY(-2px)'; };
      btn.onmouseout  = () => { btn.style.borderColor = 'var(--bd)';  btn.style.transform = ''; };
      btn.onclick = () => {
        const i = parseInt(btn.getAttribute('data-i'), 10);
        const it = items[i];
        if (it && it.el) {
          close();
          _openImageHD(it.el);
        }
      };
    });
  }

  /* Code block inline · <pre><code class="nb-code" data-lang="..."> */
  function insertCodeBlock(sid, ns){
    const editor = _findEditor(sid);
    if (!editor) { alert('No encontré el editor activo. Click adentro de la nota e intentá de nuevo.'); return; }
    editor.focus();
    const lang = prompt('Lenguaje (opcional, ej: python, js, sql, c, java):', '') || '';
    const safeLang = String(lang).trim().slice(0, 16).replace(/[^a-z0-9+#-]/gi, '');
    const langTag = safeLang
      ? '<span class="nb-code-lang" contenteditable="false">' + safeLang + '</span>'
      : '';
    // Insertar bloque + un párrafo vacío después para que el cursor pueda salir del code
    // Botón × contenteditable=false → click elimina el wrapper entero
    const delBtn = '<button type="button" class="nb-block-del" contenteditable="false" title="Eliminar bloque de código" aria-label="Eliminar bloque de código">×</button>';
    const html = '<pre class="nb-code-wrap" contenteditable="false">' + langTag + delBtn
      + '<code class="nb-code" data-lang="' + safeLang + '" contenteditable="true" spellcheck="false">// código aquí</code>'
      + '</pre><div><br></div>';
    try { document.execCommand('insertHTML', false, html); }
    catch(e) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount) {
        const r = sel.getRangeAt(0);
        const frag = r.createContextualFragment(html);
        r.deleteContents();
        r.insertNode(frag);
      }
    }
    // Foco dentro del bloque + selección del placeholder
    setTimeout(() => {
      const codes = editor.querySelectorAll('.nb-code');
      const last = codes[codes.length - 1];
      if (last) {
        last.focus();
        const r = document.createRange();
        r.selectNodeContents(last);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(r);
      }
    }, 0);
    editor.dispatchEvent(new Event('input', { bubbles: true }));
  }
  // Click en imagen o chip abre overlay HD desde IDB (full ~1920px) si está disponible
  // Acepta tanto <img class="nb-img" src="..."> como <span class="nb-img-chip" data-preview="...">
  // Incluye botón "Eliminar" que remueve el elemento del editor + IDB
  async function _openImageHD(imgEl){
    const id = imgEl.getAttribute('data-img-id');
    let src = imgEl.tagName === 'IMG'
      ? imgEl.src
      : (imgEl.getAttribute('data-preview') || '');
    if (id) {
      try { const hd = await getImage(id); if (hd) src = hd; } catch(e) {}
    }
    let ov = document.getElementById('nbImgOverlay');
    if (!ov) {
      ov = document.createElement('div');
      ov.id = 'nbImgOverlay';
      ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:99999;display:none;flex-direction:column;align-items:center;justify-content:center;padding:20px;gap:14px';
      ov.innerHTML = '<img id="nbImgOverlayImg" style="max-width:100%;max-height:calc(100% - 60px);object-fit:contain;border-radius:8px;box-shadow:0 20px 60px rgba(0,0,0,.6);cursor:zoom-out">'+
        '<div style="display:flex;gap:8px;align-items:center">'+
        '<button id="nbImgOverlayClose" style="padding:8px 16px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);border-radius:6px;color:#fff;font-family:inherit;font-size:12px;cursor:pointer;font-weight:600">Cerrar (Esc)</button>'+
        '<button id="nbImgOverlayDel" style="padding:8px 16px;background:rgba(239,68,68,.18);border:1px solid rgba(239,68,68,.5);border-radius:6px;color:#fca5a5;font-family:inherit;font-size:12px;cursor:pointer;font-weight:600">🗑 Eliminar imagen</button>'+
        '</div>';
      document.body.appendChild(ov);
      const closeOv = () => { ov.style.display = 'none'; ov._currentImg = null; };
      ov.querySelector('#nbImgOverlayImg').addEventListener('click', closeOv);
      ov.querySelector('#nbImgOverlayClose').addEventListener('click', closeOv);
      document.addEventListener('keydown', (ev) => {
        if (ov.style.display !== 'none' && ev.key === 'Escape') closeOv();
      });
      ov.querySelector('#nbImgOverlayDel').addEventListener('click', async () => {
        const target = ov._currentImg;
        if (!target) return;
        if (!confirm('¿Eliminar esta imagen del cuaderno? Esta acción no se puede deshacer.')) return;
        const editor = target.closest('.nb-content[contenteditable="true"]');
        const imgId = target.getAttribute('data-img-id');
        target.remove();
        if (imgId) { try { await deleteImage(imgId); } catch(e) {} }
        if (editor) editor.dispatchEvent(new Event('input', { bubbles: true }));
        closeOv();
      });
    }
    ov._currentImg = imgEl;
    document.getElementById('nbImgOverlayImg').src = src;
    ov.style.display = 'flex';
  }

  /* ══════════════════════════════════════════════════════════════
     PAGE SELECTOR · barra de tabs + dropdown jump-to para cuadernos
     Genérico para los 3 módulos (10-SYS NB · 13-NOT NotNB · 14-WORK WorkNB).
     Cada módulo embebe con:
        ${NBShared.pageSelectorHtml({nbId, ns, pages, activePageId})}
     Llama a `${ns}.openPage('${nbId}', pageId)` al clickear.
  ══════════════════════════════════════════════════════════════ */
  function _escAttr(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  /* Toggle de cualquier elemento con clase .on (usado por Contenido dropdown) */
  function toggleCollapse(elId){
    const el = document.getElementById(elId);
    if (!el) return;
    el.classList.toggle('on');
    try { localStorage.setItem('nb_drop_' + elId, el.classList.contains('on') ? '1' : '0'); } catch {}
  }
  function _restoreCollapseState(){
    document.querySelectorAll('.nb-drop[id]').forEach(d => {
      try {
        const v = localStorage.getItem('nb_drop_' + d.id);
        if (v === '1') d.classList.add('on');
        else if (v === '0') d.classList.remove('on');
      } catch {}
    });
  }
  /* Compact: solo dropdown (para embeber en toolbars del cuaderno) */
  function pageJumpHtml(ctx){
    if (!ctx) return '';
    const { nbId, ns, pages, activePageId } = ctx;
    const N = ns || 'NB';
    const list = Array.isArray(pages) ? pages : [];
    if (!list.length) return '';
    const trunc = (s, n) => { s = String(s||'').trim() || 'Sin título'; return s.length > n ? s.slice(0, n-1) + '…' : s; };
    const opts = list.map((p, i) => {
      const isActive = String(p.id) === String(activePageId);
      return '<option value="' + p.id + '"' + (isActive ? ' selected' : '') + '>'
        + _escAttr(trunc(p.title || ('Página ' + (i+1)), 60))
        + '</option>';
    }).join('');
    return '<select class="nb-page-jump-inline" title="Saltar a página del cuaderno" aria-label="Cambiar de página"'
      + ' onchange="if(this.value){' + N + '.openPage(\'' + nbId + '\',isNaN(Number(this.value))?this.value:Number(this.value));}">'
      + '<option value="">📑 ' + list.length + ' página' + (list.length!==1?'s':'') + '…</option>'
      + opts
      + '</select>';
  }
  function pageSelectorHtml(ctx){
    if (!ctx) return '';
    const { nbId, ns, pages, activePageId } = ctx;
    const N = ns || 'NB';
    const list = Array.isArray(pages) ? pages : [];
    if (!list.length) return '';
    const truncate = (s, n) => { s = String(s||'').trim(); if (!s) return 'Sin título'; return s.length > n ? s.slice(0, n-1) + '…' : s; };
    // Extraer emoji al inicio del título como icono visual (compatible con templates)
    const splitIcon = (t) => {
      const s = String(t||'').trim();
      const m = s.match(/^(\p{Extended_Pictographic}(?:‍\p{Extended_Pictographic})*)\s*(.*)$/u);
      return m ? { ic:m[1], txt:m[2]||'(sin título)' } : { ic:'', txt:s||'Sin título' };
    };
    const tabs = list.map((p, i) => {
      const { ic, txt } = splitIcon(p.title);
      const isActive = String(p.id) === String(activePageId);
      const label = truncate(txt, 22);
      return '<button type="button" class="nb-page-tab' + (isActive ? ' on' : '') + '"'
        + ' data-pg="' + p.id + '"'
        + ' onclick="' + N + '.openPage(\'' + nbId + '\',' + (typeof p.id === 'number' ? p.id : ('\''+p.id+'\'')) + ')"'
        + ' title="' + _escAttr(p.title || 'Sin título') + '">'
        + (ic ? '<span class="nb-page-tab-ic" aria-hidden="true">' + ic + '</span>' : '<span class="nb-page-tab-n">' + (i+1) + '</span>')
        + '<span class="nb-page-tab-t">' + _escAttr(label) + '</span>'
        + '</button>';
    }).join('');
    const opts = list.map((p, i) => {
      const isActive = String(p.id) === String(activePageId);
      const label = truncate(p.title || ('Página ' + (i+1)), 60);
      return '<option value="' + p.id + '"' + (isActive ? ' selected' : '') + '>' + _escAttr(label) + '</option>';
    }).join('');
    return '<div class="nb-page-bar" role="tablist" aria-label="Páginas del cuaderno">'
      + '<button type="button" class="nb-page-bar-nav" data-dir="-1" title="Anterior" aria-label="Página anterior">‹</button>'
      + '<div class="nb-page-bar-scroll">' + tabs + '</div>'
      + '<button type="button" class="nb-page-bar-nav" data-dir="1" title="Siguiente" aria-label="Página siguiente">›</button>'
      + '<select class="nb-page-bar-jump" title="Saltar a página"'
      + ' onchange="if(this.value){' + N + '.openPage(\'' + nbId + '\',isNaN(Number(this.value))?this.value:Number(this.value));}">'
      + '<option value="">📑 ' + list.length + ' página' + (list.length!==1?'s':'') + '</option>'
      + opts
      + '</select>'
      + '</div>';
  }
  /* Wire interno: arrows scroll + auto-scroll a activa.
     Debe llamarse después de render() en cada módulo. */
  function wirePageBar(root){
    const bars = (root || document).querySelectorAll('.nb-page-bar');
    bars.forEach(bar => {
      if (bar._nbBarWired) return;
      bar._nbBarWired = true;
      const scroll = bar.querySelector('.nb-page-bar-scroll');
      const navs = bar.querySelectorAll('.nb-page-bar-nav');
      navs.forEach(btn => {
        btn.onclick = () => {
          const dir = parseInt(btn.getAttribute('data-dir'), 10) || 1;
          if (scroll) scroll.scrollBy({ left: dir * 240, behavior:'smooth' });
        };
      });
      // Auto-scroll a la tab activa
      const active = bar.querySelector('.nb-page-tab.on');
      if (active && scroll) {
        setTimeout(() => {
          const rA = active.getBoundingClientRect();
          const rS = scroll.getBoundingClientRect();
          if (rA.left < rS.left || rA.right > rS.right) {
            scroll.scrollTo({ left: active.offsetLeft - 80, behavior:'smooth' });
          }
        }, 50);
      }
    });
  }

  /* ── PUBLIC API ────────────────────────────────────────────── */
  window.NBShared = {
    attachCleanPaste, attachChecklistToggle, attachEditorHandlers,
    fmtExtended, toolbarHtml, insertImage, insertCodeBlock, applyHighlight, openImageMenu,
    pageSelectorHtml, pageJumpHtml, wirePageBar, toggleCollapse,
    _insertImageFromFile, _openImageHD, _migrateInlineImagesToChips,
    COVERS, ICON_GROUPS, ALL_ICONS,
    iconForExt, fmtBytes, extOf,
    pickAndStoreAttachment, downloadAttachment, deleteBlob, getBlob,
    // Cloud sync
    cloudUploadAttachment, cloudDownloadAttachment, cloudDeleteAttachment,
    renderAttachmentChips, renderCoverPicker, renderIconPicker,
    MAX_BYTES,
    // Image compression utilities
    compressImage, dataUrlBytes,
    // Image IDB pipeline (thumbnail in payload, full in IndexedDB)
    storeImageWithThumbnail, resolveImageData, putImage, getImage, deleteImage, migrateLegacyImages,
    // Drop modal
    openDropModal, pickAttachmentViaModal, pickImageViaModal, pickImageRecordViaModal,
    _dmCancel, _dmSave, _dmPick,
    // Design modal
    openDesignModal,
    _designCancel, _designSave, _designPickCover, _designPickIcon,
  };
})();
