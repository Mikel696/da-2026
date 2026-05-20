/* ═══════════════════════════════════════════════════════════════════════
   DA-2026 · NB-ENGINE — Notebook Standard + Cross-Module Transfer
   ─────────────────────────────────────────────────────────────────────
   THE NOTEBOOK STANDARD. All notebooks across 10-SYS / 13-NOT / 14-WORK
   share ONE canonical schema. This module owns:
     · the module registry (where each module stores its notebooks)
     · the canonical schema definition + validator
     · transfer() — MOVE a notebook between modules (not copy)
     · transferUI() — module-picker modal

   Why MOVE works without touching binaries:
     attachment + image blobs live in IndexedDB `da2026_nb` which is
     GLOBAL (not namespaced per module). Page data only stores metadata
     refs {id,name,...}. So a transfer = moving meta + data entries
     between localStorage keys — the blob refs still resolve afterward.

   All 6 storage keys are in SYNC_REGISTRY → transfers sync cross-device.
   ═══════════════════════════════════════════════════════════════════════ */

const NBEngine = (() => {
'use strict';

/* ── THE STANDARD · canonical schema ─────────────────────────────────
   meta entry : { id, name, icon, cover, color, created, updated }
   data bucket: { pages: [ {id,title,body,images,attachments,links,created,updated} ] }
   data store : { [notebookId]: <data bucket> }
   ──────────────────────────────────────────────────────────────────── */
const SCHEMA = {
  metaFields: ['id', 'name', 'icon', 'cover', 'color', 'created', 'updated'],
  pageFields: ['id', 'title', 'body', 'images', 'attachments', 'links', 'created', 'updated'],
  version: 1
};

/* ── MODULE REGISTRY · where each module keeps its notebooks ── */
const MODULES = {
  '13-NOT':  { label: 'Notas & Journal',        icon: '📝', metaKey: 'not_nb_meta',     dataKey: 'not_nb_data',  activeKey: 'not_nb_active',  page: 'notes.html',   render: () => window.NotNB && NotNB.render && NotNB.render() },
  /* 10-SYS requires the cnb_ id prefix — isCustom() in systems_logic.js keys off it */
  '10-SYS':  { label: 'Ingeniería Sistemas',    icon: '⚙️', metaKey: 'sys_notebook_meta', dataKey: 'sys_notebook', activeKey: null,            page: 'systems.html', render: () => window.NB && NB.renderCustomList && NB.renderCustomList(), requirePrefix: 'cnb_' },
  '14-WORK': { label: 'Simetrik Copilot',       icon: '🛡️', metaKey: 'work_nb_meta',    dataKey: 'work_nb_data', activeKey: 'work_nb_active', page: 'work.html',    render: () => window.WorkNB && WorkNB.render && WorkNB.render() }
};

/* ── storage helpers ── */
function _getJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || fallback); } catch { return JSON.parse(fallback); }
}
function loadMeta(moduleId) {
  const m = MODULES[moduleId];
  return m ? _getJSON(m.metaKey, '[]') : [];
}
function loadData(moduleId) {
  const m = MODULES[moduleId];
  return m ? _getJSON(m.dataKey, '{}') : {};
}
function saveMeta(moduleId, arr) {
  const m = MODULES[moduleId];
  if (m) localStorage.setItem(m.metaKey, JSON.stringify(arr));
}
function saveData(moduleId, obj) {
  const m = MODULES[moduleId];
  if (m) localStorage.setItem(m.dataKey, JSON.stringify(obj));
}

/* ── public · list notebooks of a module ── */
function list(moduleId) {
  return loadMeta(moduleId).map(nb => {
    const data = loadData(moduleId);
    const pages = (data[nb.id] && data[nb.id].pages) || [];
    return { ...nb, _pages: pages.length, _module: moduleId };
  });
}

/* ── public · validate a notebook against the standard ── */
function validate(nb) {
  const issues = [];
  if (!nb || typeof nb !== 'object') return ['not an object'];
  if (!nb.id) issues.push('missing id');
  if (!nb.name) issues.push('missing name');
  if (!nb.cover) issues.push('missing cover (defaulting to c1)');
  if (!nb.icon) issues.push('missing icon (defaulting to 📘)');
  return issues;
}

/* ── public · normalize a notebook to the standard (idempotent) ── */
function normalize(nb) {
  return {
    id: nb.id || ('nb_' + Date.now() + Math.random().toString(36).slice(2, 6)),
    name: nb.name || 'Cuaderno',
    icon: nb.icon || '📘',
    cover: nb.cover || 'c1',
    color: nb.color || '#8b5cf6',
    created: nb.created || new Date().toISOString(),
    updated: nb.updated || new Date().toISOString()
  };
}

/* ═════════════════════════════════════════════════════════════════════
   TRANSFER · MOVE a notebook from one module to another
   Moves the meta entry + the data bucket. Removes from source.
   Returns { ok, reason? }.
   ═════════════════════════════════════════════════════════════════════ */
function transfer(notebookId, fromModule, toModule) {
  if (fromModule === toModule) return { ok: false, reason: 'same-module' };
  if (!MODULES[fromModule] || !MODULES[toModule]) return { ok: false, reason: 'unknown-module' };

  const srcMeta = loadMeta(fromModule);
  const nbEntry = srcMeta.find(n => n.id === notebookId);
  if (!nbEntry) return { ok: false, reason: 'notebook-not-found' };

  const srcData = loadData(fromModule);
  const bucket = srcData[notebookId] || { pages: [] };

  /* Target id: re-id on collision OR when target module requires a prefix
     (10-SYS keys isCustom() off the cnb_ prefix → a foreign id would break). */
  let targetId = notebookId;
  const dstMeta = loadMeta(toModule);
  const reqPrefix = MODULES[toModule].requirePrefix;
  const needsReId = dstMeta.some(n => n.id === targetId) || (reqPrefix && !String(targetId).startsWith(reqPrefix));
  if (needsReId) {
    targetId = (reqPrefix || 'nb_') + Date.now() + Math.random().toString(36).slice(2, 6);
  }

  /* 1 · write into target */
  const movedMeta = normalize({ ...nbEntry, id: targetId, updated: new Date().toISOString() });
  dstMeta.push(movedMeta);
  saveMeta(toModule, dstMeta);
  const dstData = loadData(toModule);
  dstData[targetId] = bucket;
  saveData(toModule, dstData);

  /* 2 · remove from source */
  saveMeta(fromModule, srcMeta.filter(n => n.id !== notebookId));
  delete srcData[notebookId];
  saveData(fromModule, srcData);

  /* 3 · clear source active pointer if it was the moved one */
  const srcMod = MODULES[fromModule];
  if (srcMod.activeKey) {
    try { if (localStorage.getItem(srcMod.activeKey) === notebookId) localStorage.setItem(srcMod.activeKey, ''); } catch {}
  }

  return { ok: true, targetId, toModule, name: movedMeta.name };
}

/* ═════════════════════════════════════════════════════════════════════
   TRANSFER UI · module-picker modal
   onDone(result) fires after a successful move so the caller re-renders.
   ═════════════════════════════════════════════════════════════════════ */
function transferUI(notebookId, fromModule, onDone) {
  const nb = loadMeta(fromModule).find(n => n.id === notebookId);
  if (!nb) { _toast('Cuaderno no encontrado'); return; }

  let modal = document.getElementById('nbeMoveModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'nbeMoveModal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.78);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px';
    document.body.appendChild(modal);
  }
  const targets = Object.keys(MODULES).filter(m => m !== fromModule);
  const opts = targets.map(m => {
    const md = MODULES[m];
    const count = loadMeta(m).length;
    return '<button class="nbe-move-opt" data-target="' + m + '" style="display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:12px 14px;background:var(--el);border:1px solid var(--bd);border-radius:var(--radius-sm);cursor:pointer;margin-bottom:6px;transition:border-color var(--transition-fast),background var(--transition-fast)">' +
      '<span style="font-size:20px">' + md.icon + '</span>' +
      '<div><div style="font-size:13px;font-weight:600;color:var(--tx)">' + md.label + '</div>' +
      '<div style="font-size:10px;color:var(--t3)">' + m + ' · ' + count + ' cuaderno' + (count !== 1 ? 's' : '') + '</div></div></button>';
  }).join('');

  modal.innerHTML = '<div style="background:var(--c1);border:1px solid var(--bd);border-radius:var(--radius-md);padding:22px;max-width:440px;width:100%">' +
    '<div style="font-size:15px;font-weight:700;margin-bottom:2px">📦 Mover cuaderno</div>' +
    '<div style="font-size:11px;color:var(--t3);margin-bottom:4px">"' + _esc(nb.name) + '" se moverá (no se copia) a otro módulo.</div>' +
    '<div style="font-size:10px;color:var(--t3);margin-bottom:14px;font-style:italic">Páginas, imágenes y adjuntos viajan con él. Quedará disponible en el módulo destino.</div>' +
    opts +
    '<div style="display:flex;justify-content:flex-end;margin-top:10px">' +
    '<button class="btn bo" onclick="document.getElementById(\'nbeMoveModal\').remove()">Cancelar</button></div></div>';

  modal.querySelectorAll('.nbe-move-opt').forEach(btn => {
    btn.onmouseenter = () => { btn.style.borderColor = 'var(--ac)'; btn.style.background = 'var(--ag)'; };
    btn.onmouseleave = () => { btn.style.borderColor = 'var(--bd)'; btn.style.background = 'var(--el)'; };
    btn.addEventListener('click', () => {
      const toModule = btn.getAttribute('data-target');
      const res = transfer(notebookId, fromModule, toModule);
      modal.remove();
      if (res.ok) {
        _toast('✓ "' + res.name + '" movido a ' + MODULES[toModule].label);
        /* re-render source module */
        try { MODULES[fromModule].render(); } catch (e) { /* ignore */ }
        if (typeof onDone === 'function') onDone(res);
      } else {
        _toast('No se pudo mover: ' + res.reason);
      }
    });
  });
}

/* ── helpers ── */
function _esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function _toast(msg) {
  let t = document.getElementById('nbeToast');
  if (!t) { t = document.createElement('div'); t.id = 'nbeToast'; t.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:var(--ac);color:#fff;padding:9px 18px;border-radius:var(--radius-sm);font-size:12px;font-weight:600;z-index:10001;box-shadow:0 4px 16px rgba(0,0,0,.4);opacity:0;transition:opacity .2s'; document.body.appendChild(t); }
  t.textContent = msg; t.style.opacity = '1';
  setTimeout(() => t.style.opacity = '0', 2400);
}

/* ── PUBLIC API ── */
return {
  SCHEMA, MODULES,
  list, loadMeta, loadData, validate, normalize,
  transfer, transferUI
};
})();

window.NBEngine = NBEngine;
