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

  /* ── PUBLIC API ────────────────────────────────────────────── */
  window.NBShared = {
    COVERS, ICON_GROUPS, ALL_ICONS,
    iconForExt, fmtBytes, extOf,
    pickAndStoreAttachment, downloadAttachment, deleteBlob, getBlob,
    renderAttachmentChips, renderCoverPicker, renderIconPicker,
    MAX_BYTES,
  };
})();
