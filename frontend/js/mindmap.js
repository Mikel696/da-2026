/* ═══════════════════════════════════════════════════════════════
   DA-2026 · Mind Map Studio
   ─────────────────────────────────────────────────────────────
   Engine: jsMind (MIT, pure-JS, mature). Loaded from CDN.
   PNG export: html2canvas (CDN).
   Storage: tools_mindmaps (array, syncs to Supabase via SYNC_REGISTRY).
   Cross-module attach: exports rendered map as PNG, runs through
   NBShared.storeImageWithThumbnail (3-tier IDB+payload pipeline),
   then appends image record to the chosen notebook page in 10-SYS,
   13-NOT or 14-WORK.
═══════════════════════════════════════════════════════════════ */

const MM = (function(){
  'use strict';

  const KEY = 'tools_mindmaps';
  let _maps = []; let _activeId = null; let _jm = null;
  const saveTimers = {};

  /* ── Storage ─────────────────────────────────────────────── */
  function load(){ try { _maps = JSON.parse(localStorage.getItem(KEY)||'[]'); } catch { _maps = []; } }
  function persist(){
    try { localStorage.setItem(KEY, JSON.stringify(_maps)); }
    catch(e){
      if (e && (e.name==='QuotaExceededError'||/quota/i.test(e.message||''))) {
        alert('💾 Almacenamiento lleno. Eliminá mind maps viejos antes de seguir.');
      } else throw e;
    }
  }
  function getActive(){ return _maps.find(m => m.id === _activeId) || null; }
  function esc(s){ const d=document.createElement('div'); d.textContent=s==null?'':s; return d.innerHTML; }
  function fmtDate(iso){ if (!iso) return ''; return new Date(iso).toLocaleDateString('es',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}); }
  function showStatus(msg){
    const el = document.getElementById('mmStatus'); if (!el) return;
    el.textContent = msg; el.classList.add('on');
    clearTimeout(el._t); el._t = setTimeout(()=>el.classList.remove('on'), 1800);
  }

  /* ── Default empty map ──────────────────────────────────── */
  function emptyData(rootText){
    return {
      meta: { name: rootText || 'Mind Map', author: 'DA-2026', version: '1.0' },
      format: 'node_tree',
      data: {
        id: 'root', topic: rootText || 'Idea central',
        children: [
          { id: 'c1', topic: 'Concepto 1', direction: 'right' },
          { id: 'c2', topic: 'Concepto 2', direction: 'right' },
          { id: 'c3', topic: 'Concepto 3', direction: 'left' },
        ]
      }
    };
  }

  /* ── jsMind init ────────────────────────────────────────── */
  function initEngine(){
    if (typeof jsMind === 'undefined') {
      document.getElementById('mmCanvas').innerHTML =
        '<div style="text-align:center;padding:60px 20px;color:var(--t3)">Cargando jsMind…<br><small>Si no carga revisá la conexión.</small></div>';
      return null;
    }
    const opts = {
      container: 'mmCanvas',
      editable: true,
      theme: 'primary',
      mode: 'full',
      view: { engine: 'canvas', hmargin: 80, vmargin: 50, line_width: 2, line_color: '#a78bfa', draggable: true, hide_scrollbars_when_draggable: true },
      layout: { hspace: 60, vspace: 28, pspace: 14 },
      shortcut: { enable: true },
    };
    return new jsMind(opts);
  }

  /* ── CRUD ───────────────────────────────────────────────── */
  function create(){
    const name = prompt('Nombre del nuevo mind map:', 'Mi mapa');
    if (!name || !name.trim()) return;
    const id = 'mm_' + Date.now();
    _maps.push({
      id, name: name.trim(),
      data: emptyData(name.trim()),
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    });
    persist();
    open(id);
    renderList();
  }

  function rename(){
    const m = getActive(); if (!m) return;
    const v = document.getElementById('mmName').value.trim();
    if (!v) return;
    m.name = v;
    if (m.data && m.data.meta) m.data.meta.name = v;
    m.updated = new Date().toISOString();
    persist(); renderList();
  }

  function remove(id){
    const m = _maps.find(x => x.id === id); if (!m) return;
    if (!confirm(`¿Eliminar mind map "${m.name}"?`)) return;
    _maps = _maps.filter(x => x.id !== id);
    persist();
    if (_activeId === id) { _activeId = null; clearCanvas(); }
    renderList();
  }

  function open(id){
    const m = _maps.find(x => x.id === id);
    if (!m) return;
    _activeId = id;
    if (!_jm) _jm = initEngine();
    if (!_jm) return;
    try {
      _jm.show(m.data);
    } catch(e) {
      console.warn('jsMind show error, recreating:', e);
      _jm = initEngine();
      _jm.show(m.data);
    }
    document.getElementById('mmName').value = m.name;
    renderList();
    showStatus('Cargado');
  }

  function clearCanvas(){
    const el = document.getElementById('mmCanvas');
    if (el) el.innerHTML = '<div style="text-align:center;padding:80px 20px;color:var(--t3)">📍 Selecciona un mapa de la lista o crea uno nuevo.</div>';
    document.getElementById('mmName').value = '';
  }

  /* ── Auto-save (after each edit) ────────────────────────── */
  function snapshot(){
    const m = getActive(); if (!m || !_jm) return;
    try {
      const data = _jm.get_data('node_tree');
      m.data = data;
      m.updated = new Date().toISOString();
      clearTimeout(saveTimers.snap);
      saveTimers.snap = setTimeout(() => { persist(); showStatus('✓ guardado'); }, 600);
    } catch(e) {}
  }

  function save(){
    snapshot();
    persist();
    renderList();
    showStatus('💾 Guardado manual');
  }

  /* ── Node ops (toolbar) ─────────────────────────────────── */
  function addChild(){
    if (!_jm) return;
    const sel = _jm.get_selected_node(); if (!sel) return alert('Seleccioná un nodo primero.');
    const id = 'n_' + Date.now() + Math.random().toString(36).slice(2,5);
    _jm.add_node(sel, id, 'Nuevo nodo');
    snapshot();
  }
  function addSibling(){
    if (!_jm) return;
    const sel = _jm.get_selected_node(); if (!sel || !sel.parent) return alert('Seleccioná un nodo (no la raíz).');
    const id = 'n_' + Date.now() + Math.random().toString(36).slice(2,5);
    _jm.add_node(sel.parent, id, 'Hermano');
    snapshot();
  }
  function removeNode(){
    if (!_jm) return;
    const sel = _jm.get_selected_node(); if (!sel) return;
    if (sel.id === 'root' || !sel.parent) return alert('No podés borrar la raíz.');
    if (!confirm('¿Eliminar este nodo y sus hijos?')) return;
    _jm.remove_node(sel);
    snapshot();
  }
  function zoomIn(){ if (_jm && _jm.view && _jm.view.zoomIn) _jm.view.zoomIn(); }
  function zoomOut(){ if (_jm && _jm.view && _jm.view.zoomOut) _jm.view.zoomOut(); }
  function zoomReset(){ if (_jm && _jm.view && _jm.view.setZoom) _jm.view.setZoom(1); }

  /* ── PNG export via html2canvas ─────────────────────────── */
  async function renderToPNG(){
    if (!_jm || !getActive()) { alert('Abrí un mind map primero.'); return null; }
    if (typeof html2canvas === 'undefined') { alert('html2canvas no cargó.'); return null; }
    const target = document.querySelector('.jsmind-inner') || document.getElementById('mmCanvas');
    const canvas = await html2canvas(target, {
      backgroundColor: '#0d0d12',
      scale: 2,
      logging: false,
      useCORS: true,
      windowWidth: target.scrollWidth,
      windowHeight: target.scrollHeight,
    });
    return canvas.toDataURL('image/png', 1);
  }

  async function exportPng(){
    showStatus('Renderizando…');
    const dataUrl = await renderToPNG();
    if (!dataUrl) return;
    const m = getActive();
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = (m && m.name ? m.name.replace(/[^\w\-]+/g,'_') : 'mindmap') + '.png';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    showStatus('📷 PNG descargado');
  }

  /* ── Attach to notebook (cross-module) ──────────────────── */
  function openPicker(){
    if (!getActive()) return alert('Abrí un mind map primero.');
    document.getElementById('mmPickOverlay').classList.add('on');
    refreshPickerNbs();
  }
  function closePicker(){
    document.getElementById('mmPickOverlay').classList.remove('on');
  }

  // Notebook list keys per module
  const NB_KEYS = {
    '13-NOT': { meta: 'not_nb_meta', data: 'not_nb_data' },
    '10-SYS': { meta: 'sys_notebook_meta', data: 'sys_notebook' },
    '14-WORK': { meta: 'work_nb_meta', data: 'work_nb_data' },
  };

  function refreshPickerNbs(){
    const mod = document.getElementById('mmPickModule').value;
    const sel = NB_KEYS[mod];
    let metaList = [];
    try { metaList = JSON.parse(localStorage.getItem(sel.meta) || '[]'); } catch {}
    const nbSel = document.getElementById('mmPickNb');
    if (!metaList.length) {
      nbSel.innerHTML = '<option value="">— Sin cuadernos en este módulo —</option>';
      document.getElementById('mmPickPage').innerHTML = '';
      document.getElementById('mmPickInfo').textContent = 'Crea un cuaderno en ' + mod + ' antes de adjuntar.';
      return;
    }
    nbSel.innerHTML = metaList.map(n => `<option value="${n.id}">${n.icon||'📓'} ${esc(n.name)}</option>`).join('');
    refreshPickerPages();
  }

  function refreshPickerPages(){
    const mod = document.getElementById('mmPickModule').value;
    const nbId = document.getElementById('mmPickNb').value;
    const sel = NB_KEYS[mod];
    let dataObj = {}; try { dataObj = JSON.parse(localStorage.getItem(sel.data) || '{}'); } catch {}
    // sys uses {[sid]:{pages:[]}} structure (same as not/work). Extract pages.
    const pages = (dataObj[nbId] && dataObj[nbId].pages) || [];
    const pageSel = document.getElementById('mmPickPage');
    if (!pages.length) {
      pageSel.innerHTML = '<option value="">— Sin páginas (se creará una nueva) —</option>';
      document.getElementById('mmPickInfo').textContent = 'No hay páginas en este cuaderno. Se creará una página nueva con el mind map.';
      return;
    }
    pageSel.innerHTML = '<option value="__new__">+ Crear página nueva</option>' +
      pages.map(p => `<option value="${p.id}">${esc(p.title || 'Sin título')}</option>`).join('');
    document.getElementById('mmPickInfo').textContent = pages.length + ' página(s) disponibles. La imagen se adjunta a la página seleccionada.';
  }

  document.addEventListener('change', e => {
    if (e.target && e.target.id === 'mmPickNb') refreshPickerPages();
  });

  async function confirmAttach(){
    const m = getActive(); if (!m) return;
    if (!window.NBShared || !NBShared.storeImageWithThumbnail) return alert('Módulo nb-shared no cargado.');
    const mod = document.getElementById('mmPickModule').value;
    const nbId = document.getElementById('mmPickNb').value;
    let pageId = document.getElementById('mmPickPage').value;
    if (!nbId) return alert('Elegí un cuaderno.');

    showStatus('Renderizando PNG…');
    const dataUrl = await renderToPNG();
    if (!dataUrl) return;

    showStatus('Comprimiendo + guardando en IDB…');
    const rec = await NBShared.storeImageWithThumbnail(dataUrl, '🗺️ Mind map: ' + m.name);

    // Append to notebook page
    const sel = NB_KEYS[mod];
    let dataObj = {}; try { dataObj = JSON.parse(localStorage.getItem(sel.data) || '{}'); } catch {}
    if (!dataObj[nbId]) dataObj[nbId] = { pages: [] };
    let page;
    if (pageId === '__new__' || !pageId) {
      page = { id: Date.now(), title: '🗺️ Mind Map: ' + m.name, body: '', images: [], attachments: [], links: [], created: new Date().toISOString(), updated: new Date().toISOString() };
      dataObj[nbId].pages.unshift(page);
      pageId = page.id;
    } else {
      page = dataObj[nbId].pages.find(p => String(p.id) === String(pageId));
      if (!page) { alert('Página no encontrada.'); return; }
    }
    if (!page.images) page.images = [];
    page.images.push({ id: rec.id, thumbnail: rec.thumbnail, preview: rec.preview, caption: rec.caption, size: rec.size, addedAt: rec.addedAt });
    page.updated = new Date().toISOString();

    try { localStorage.setItem(sel.data, JSON.stringify(dataObj)); }
    catch(e){
      alert('Error al guardar en el cuaderno: '+(e && e.message ? e.message : e));
      return;
    }
    closePicker();
    showStatus('✅ Adjuntado a ' + mod + ' · '+(page.title||''));
    if (confirm('Adjuntado correctamente. ¿Querés abrir el módulo ahora?')) {
      const url = mod === '13-NOT' ? 'notes.html' : mod === '10-SYS' ? 'systems.html' : 'work.html';
      window.location.href = url + '#' + pageId;
    }
  }

  /* ── List render ────────────────────────────────────────── */
  function renderList(){
    const el = document.getElementById('mmList'); if (!el) return;
    if (!_maps.length) {
      el.innerHTML = '<div class="mm-empty">📍 Sin mind maps aún.<br>Click <b>+ Nuevo</b> arriba.</div>';
      return;
    }
    el.innerHTML = _maps.slice().sort((a,b)=> (b.updated||'').localeCompare(a.updated||'')).map(m =>
      `<div class="mm-item ${m.id===_activeId?'on':''}" onclick="MM.open('${m.id}')">
        <div class="mm-item-t">${esc(m.name)}</div>
        <div class="mm-item-m">
          <span>${fmtDate(m.updated || m.created)}</span>
          <button class="mm-item-del" onclick="event.stopPropagation();MM.remove('${m.id}')" title="Eliminar">✕</button>
        </div>
      </div>`
    ).join('');
  }

  /* ── Init ──────────────────────────────────────────────── */
  function init(){
    load();
    renderList();
    clearCanvas();
    // Open the most recently updated map automatically
    if (_maps.length) {
      const latest = _maps.slice().sort((a,b)=> (b.updated||'').localeCompare(a.updated||''))[0];
      if (latest) open(latest.id);
    }
    // Hook auto-save to jsMind events (the engine doesn't expose perfect
    // hooks; poll on user activity within the canvas as a safety net)
    const canvas = document.getElementById('mmCanvas');
    if (canvas) {
      canvas.addEventListener('mouseup', snapshot);
      canvas.addEventListener('keyup', snapshot);
      canvas.addEventListener('blur', snapshot, true);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else setTimeout(init, 0);

  return {
    create, rename, remove, open, save, snapshot,
    addChild, addSibling, removeNode, zoomIn, zoomOut, zoomReset,
    exportPng,
    attachToNotebook: openPicker, closePicker, refreshPickerNbs, refreshPickerPages, confirmAttach,
  };
})();
window.MM = MM;
