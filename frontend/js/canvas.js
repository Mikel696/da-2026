/* ═══════════════════════════════════════════════════════════════
   DA-2026 · 15-MM · Free Canvas (Miro-style)
   ─────────────────────────────────────────────────────────────
   Infinite canvas with pan/zoom, draggable shape nodes, edge
   connections, in-place text editing, color picker, save / load /
   PNG export / attach-to-notebook. Pure DOM + SVG, no library.
   Storage: tools_canvases (synced).
═══════════════════════════════════════════════════════════════ */

const CV = (function(){
  'use strict';

  const KEY = 'tools_canvases';
  let _items = [];
  let _activeId = null;
  let _selected = null;          // currently selected node id
  let _connectMode = false;
  let _connectFrom = null;       // node id when in connect-source state
  let _view = { x: 0, y: 0, zoom: 1 };
  let _saveTimer = null;

  /* ── Storage ─────────────────────────────────────────────── */
  function load(){ try { _items = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { _items = []; } }
  function persist(){
    try { localStorage.setItem(KEY, JSON.stringify(_items)); }
    catch(e){
      if (e && (e.name==='QuotaExceededError'||/quota/i.test(e.message||''))) {
        alert('💾 Almacenamiento lleno. Borrá canvases viejos.');
      } else throw e;
    }
  }
  function getActive(){ return _items.find(c => c.id === _activeId) || null; }
  function esc(s){ const d=document.createElement('div'); d.textContent=s==null?'':s; return d.innerHTML; }
  function fmtDate(iso){ if (!iso) return ''; return new Date(iso).toLocaleDateString('es',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}); }
  function showStatus(msg){
    const el = document.getElementById('cvStatus'); if (!el) return;
    el.textContent = msg; el.classList.add('on');
    clearTimeout(el._t); el._t = setTimeout(()=>el.classList.remove('on'), 1800);
  }

  /* ── Default canvas ─────────────────────────────────────── */
  function emptyCanvas(){
    return {
      id: 'cv_' + Date.now(),
      name: 'Mi canvas',
      nodes: [
        { id: 'n1', type: 'rect',     x: 100, y: 100, w: 160, h: 60, text: 'Idea principal', color: '#7c3aed' },
        { id: 'n2', type: 'sticky',   x: 320, y: 60,  w: 160, h: 100, text: 'Nota inicial · click 2× para editar', color: '#fef3c7' },
        { id: 'n3', type: 'ellipse',  x: 320, y: 200, w: 140, h: 80, text: 'Concepto B', color: '#06b6d4' },
        { id: 'n4', type: 'diamond',  x: 100, y: 240, w: 110, h: 110, text: 'Decisión', color: '#22c55e' },
      ],
      edges: [
        { id: 'e1', from: 'n1', to: 'n2' },
        { id: 'e2', from: 'n1', to: 'n3' },
        { id: 'e3', from: 'n1', to: 'n4' },
      ],
      view: { x: 0, y: 0, zoom: 1 },
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    };
  }

  /* ── CRUD ───────────────────────────────────────────────── */
  function create(){
    const name = prompt('Nombre del canvas:', 'Nuevo canvas');
    if (!name || !name.trim()) return;
    const c = emptyCanvas();
    c.name = name.trim();
    _items.push(c);
    persist();
    open(c.id);
    renderList();
  }
  function rename(){
    const c = getActive(); if (!c) return;
    const inp = document.getElementById('cvName'); const v = inp.value.trim();
    if (!v) return;
    c.name = v; c.updated = new Date().toISOString();
    persist(); renderList();
  }
  function remove(id){
    const c = _items.find(x => x.id === id); if (!c) return;
    if (!confirm(`¿Eliminar canvas "${c.name}"?`)) return;
    _items = _items.filter(x => x.id !== id);
    persist();
    if (_activeId === id) { _activeId = null; clearStage(); }
    renderList();
  }
  function open(id){
    const c = _items.find(x => x.id === id); if (!c) return;
    _activeId = id; _selected = null; _connectMode = false; _connectFrom = null;
    _view = c.view ? Object.assign({ x:0, y:0, zoom:1 }, c.view) : { x:0, y:0, zoom:1 };
    document.getElementById('cvName').value = c.name;
    renderList();
    renderStage();
  }
  function clearStage(){
    const world = document.getElementById('cvWorld');
    if (world) world.innerHTML = '<svg class="cv-edges" id="cvEdges"></svg>';
    document.getElementById('cvName').value = '';
  }

  /* ── Render: nodes + edges ──────────────────────────────── */
  function applyView(){
    const world = document.getElementById('cvWorld'); if (!world) return;
    world.style.transform = `translate(${_view.x}px,${_view.y}px) scale(${_view.zoom})`;
  }

  function renderStage(){
    const c = getActive();
    const world = document.getElementById('cvWorld');
    if (!world) return;
    if (!c) { clearStage(); return; }
    // Reset world content. Keep one SVG for edges + DOM for nodes.
    world.innerHTML = '<svg class="cv-edges" id="cvEdges" xmlns="http://www.w3.org/2000/svg"><defs><marker id="cvArrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" class="cv-edge-arrow" fill="#8b5cf6"></path></marker></defs></svg>';
    const svg = document.getElementById('cvEdges');
    // Render nodes
    (c.nodes || []).forEach(n => world.appendChild(buildNodeEl(n)));
    // Render edges
    renderEdges();
    applyView();
  }

  function buildNodeEl(n){
    const el = document.createElement('div');
    el.className = `cv-node cv-node-${n.type}` + (_selected === n.id ? ' selected' : '') + (_connectFrom === n.id ? ' connect-source' : '');
    el.dataset.id = n.id;
    el.style.left = n.x + 'px';
    el.style.top = n.y + 'px';
    el.style.width = n.w + 'px';
    el.style.minHeight = n.h + 'px';
    el.style.background = n.color || (n.type === 'sticky' ? '#fef3c7' : 'var(--c1)');
    el.style.borderColor = (n.type === 'sticky' || n.type === 'text') ? '' : (n.color || 'var(--ac)');
    if (n.type === 'sticky') el.style.color = '#1a1a1a';
    el.innerHTML = (n.type === 'diamond')
      ? `<span>${esc(n.text||'')}</span>`
      : esc(n.text||'');
    // Drag handle (left)
    const handle = document.createElement('div');
    handle.className = 'cv-node-handle';
    handle.title = 'Mover';
    el.appendChild(handle);
    // Resize corner (bottom-right)
    const resize = document.createElement('div');
    resize.className = 'cv-node-resize';
    resize.title = 'Redimensionar';
    el.appendChild(resize);
    // Wire interactions
    el.addEventListener('mousedown', e => {
      if (e.target === handle) { startDrag(n, e); return; }
      if (e.target === resize) { startResize(n, e); return; }
    });
    el.addEventListener('click', e => {
      e.stopPropagation();
      if (_connectMode) {
        if (!_connectFrom) {
          _connectFrom = n.id;
          showStatus('Conectando desde: ' + (n.text||'') + ' · click otro nodo para crear flecha');
          renderStage();
        } else if (_connectFrom !== n.id) {
          addEdge(_connectFrom, n.id);
          _connectFrom = null;
          toggleConnect(false);
        }
        return;
      }
      selectNode(n.id);
    });
    el.addEventListener('dblclick', e => { e.stopPropagation(); editText(n); });
    return el;
  }

  function renderEdges(){
    const c = getActive(); if (!c) return;
    const svg = document.getElementById('cvEdges'); if (!svg) return;
    const defs = svg.querySelector('defs');
    svg.innerHTML = '';
    if (defs) svg.appendChild(defs);
    (c.edges || []).forEach(e => {
      const a = c.nodes.find(n => n.id === e.from);
      const b = c.nodes.find(n => n.id === e.to);
      if (!a || !b) return;
      const ax = a.x + a.w/2 + 3000;
      const ay = a.y + a.h/2 + 3000;
      const bx = b.x + b.w/2 + 3000;
      const by = b.y + b.h/2 + 3000;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M ${ax} ${ay} L ${bx} ${by}`);
      path.setAttribute('class', 'cv-edge');
      path.setAttribute('marker-end', 'url(#cvArrow)');
      path.dataset.id = e.id;
      path.addEventListener('click', () => {
        if (confirm('¿Eliminar conexión?')) removeEdge(e.id);
      });
      svg.appendChild(path);
    });
  }

  /* ── Selection / edit / mutations ───────────────────────── */
  function selectNode(id){
    _selected = id;
    document.querySelectorAll('.cv-node').forEach(el => el.classList.toggle('selected', el.dataset.id === id));
    const c = getActive();
    if (c && id) {
      const n = c.nodes.find(x => x.id === id);
      if (n && n.color) document.getElementById('cvColor').value = (/^#/.test(n.color) ? n.color : '#7c3aed');
    }
  }

  function editText(n){
    const el = document.querySelector('.cv-node[data-id="'+n.id+'"]');
    if (!el) return;
    el.setAttribute('contenteditable','true');
    if (n.type === 'diamond') el.querySelector('span').setAttribute('contenteditable','true');
    el.focus();
    document.execCommand('selectAll', false, null);
    const finish = () => {
      el.removeAttribute('contenteditable');
      const span = el.querySelector('span');
      if (span) span.removeAttribute('contenteditable');
      const txt = (n.type === 'diamond' ? span?.textContent : el.textContent.replace(/⠿|◣/g,'')) || '';
      n.text = txt.trim();
      schedulePersist();
      renderStage();
    };
    el.addEventListener('blur', finish, { once: true });
    el.addEventListener('keydown', e => {
      if (e.key === 'Escape' || (e.key === 'Enter' && !e.shiftKey)) { e.preventDefault(); el.blur(); }
    });
  }

  function startDrag(n, e){
    e.preventDefault();
    const startX = e.clientX, startY = e.clientY;
    const ox = n.x, oy = n.y;
    const move = ev => {
      n.x = ox + (ev.clientX - startX) / _view.zoom;
      n.y = oy + (ev.clientY - startY) / _view.zoom;
      const el = document.querySelector('.cv-node[data-id="'+n.id+'"]');
      if (el) { el.style.left = n.x + 'px'; el.style.top = n.y + 'px'; }
      renderEdges();
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      schedulePersist();
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  }

  function startResize(n, e){
    e.preventDefault(); e.stopPropagation();
    const startX = e.clientX, startY = e.clientY;
    const ow = n.w, oh = n.h;
    const move = ev => {
      n.w = Math.max(60, ow + (ev.clientX - startX) / _view.zoom);
      n.h = Math.max(36, oh + (ev.clientY - startY) / _view.zoom);
      const el = document.querySelector('.cv-node[data-id="'+n.id+'"]');
      if (el) { el.style.width = n.w + 'px'; el.style.minHeight = n.h + 'px'; }
      renderEdges();
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      schedulePersist();
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  }

  /* ── Add / delete shapes + edges ───────────────────────── */
  function addShape(type){
    const c = getActive(); if (!c) return alert('Creá un canvas primero.');
    const cx = (-_view.x + 200) / _view.zoom;
    const cy = (-_view.y + 200) / _view.zoom;
    const presets = {
      rect:    { w: 160, h: 60,  text: 'Nuevo bloque',  color: '#7c3aed' },
      ellipse: { w: 140, h: 80,  text: 'Concepto',       color: '#06b6d4' },
      sticky:  { w: 160, h: 100, text: 'Nota adhesiva',  color: '#fef3c7' },
      diamond: { w: 110, h: 110, text: 'Decisión',       color: '#22c55e' },
      text:    { w: 160, h: 40,  text: 'Texto libre',    color: 'transparent' },
    };
    const p = presets[type] || presets.rect;
    const n = { id: 'n_' + Date.now() + Math.random().toString(36).slice(2,5),
                type, x: cx, y: cy, w: p.w, h: p.h, text: p.text, color: p.color };
    c.nodes.push(n); c.updated = new Date().toISOString();
    schedulePersist();
    renderStage();
    selectNode(n.id);
    showStatus('+ ' + type);
  }

  function deleteSelected(){
    const c = getActive(); if (!c || !_selected) return;
    if (!confirm('¿Eliminar nodo seleccionado y sus conexiones?')) return;
    c.edges = c.edges.filter(e => e.from !== _selected && e.to !== _selected);
    c.nodes = c.nodes.filter(n => n.id !== _selected);
    _selected = null;
    c.updated = new Date().toISOString();
    schedulePersist();
    renderStage();
  }

  function addEdge(fromId, toId){
    const c = getActive(); if (!c) return;
    if (fromId === toId) return;
    if (c.edges.some(e => e.from === fromId && e.to === toId)) return;
    c.edges.push({ id: 'e_' + Date.now() + Math.random().toString(36).slice(2,5), from: fromId, to: toId });
    c.updated = new Date().toISOString();
    schedulePersist();
    renderStage();
    showStatus('🔗 Conexión creada');
  }

  function removeEdge(id){
    const c = getActive(); if (!c) return;
    c.edges = c.edges.filter(e => e.id !== id);
    c.updated = new Date().toISOString();
    schedulePersist();
    renderStage();
  }

  function colorSelected(color){
    const c = getActive(); if (!c || !_selected) return;
    const n = c.nodes.find(x => x.id === _selected); if (!n) return;
    n.color = color; c.updated = new Date().toISOString();
    schedulePersist();
    renderStage();
  }

  function toggleConnect(force){
    _connectMode = (typeof force === 'boolean') ? force : !_connectMode;
    const btn = document.getElementById('cvConnectBtn');
    if (btn) btn.classList.toggle('on', _connectMode);
    document.getElementById('cvViewport').classList.toggle('cv-connect', _connectMode);
    if (!_connectMode) { _connectFrom = null; renderStage(); }
    if (_connectMode) showStatus('Modo conectar · click 2 nodos');
  }

  /* ── Pan / zoom ─────────────────────────────────────────── */
  function setupViewport(){
    const vp = document.getElementById('cvViewport'); if (!vp || vp._wired) return;
    vp._wired = true;
    let panning = false, sx = 0, sy = 0, ox = 0, oy = 0;
    vp.addEventListener('mousedown', e => {
      // Pan only when click on viewport background (not nodes)
      if (e.target.closest('.cv-node') || e.target.closest('.cv-edge')) return;
      // Deselect on background click
      _selected = null;
      document.querySelectorAll('.cv-node.selected').forEach(el => el.classList.remove('selected'));
      panning = true; sx = e.clientX; sy = e.clientY; ox = _view.x; oy = _view.y;
      vp.classList.add('cv-panning');
    });
    window.addEventListener('mousemove', e => {
      if (!panning) return;
      _view.x = ox + (e.clientX - sx);
      _view.y = oy + (e.clientY - sy);
      applyView();
    });
    window.addEventListener('mouseup', () => {
      if (panning) {
        panning = false; vp.classList.remove('cv-panning');
        const c = getActive(); if (c) { c.view = Object.assign({}, _view); schedulePersist(); }
      }
    });
    vp.addEventListener('wheel', e => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const old = _view.zoom;
      _view.zoom = Math.max(0.2, Math.min(3, _view.zoom * delta));
      // Zoom toward cursor
      const rect = vp.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      _view.x = px - (px - _view.x) * (_view.zoom / old);
      _view.y = py - (py - _view.y) * (_view.zoom / old);
      applyView();
      const c = getActive(); if (c) { c.view = Object.assign({}, _view); schedulePersist(); }
    }, { passive: false });
    // Keyboard shortcuts (Delete / Backspace to remove selected)
    document.addEventListener('keydown', e => {
      if (!isCanvasActive()) return;
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && _selected) { e.preventDefault(); deleteSelected(); }
    });
  }
  function isCanvasActive(){
    const pane = document.querySelector('.mm-pane[data-pane="canvas"]');
    return pane && !pane.hidden;
  }
  function zoomIn(){ _view.zoom = Math.min(3, _view.zoom * 1.2); applyView(); }
  function zoomOut(){ _view.zoom = Math.max(0.2, _view.zoom / 1.2); applyView(); }
  function zoomReset(){ _view = { x: 0, y: 0, zoom: 1 }; applyView(); }

  /* ── Persistence helpers ────────────────────────────────── */
  function schedulePersist(){
    clearTimeout(_saveTimer);
    _saveTimer = setTimeout(() => { persist(); }, 400);
  }
  function save(){ persist(); showStatus('💾 Guardado'); }

  /* ── PNG export + attach to notebook ────────────────────── */
  async function exportPng(){
    if (typeof html2canvas === 'undefined') { alert('html2canvas no cargó.'); return; }
    const c = getActive(); if (!c) return;
    showStatus('Renderizando…');
    const target = document.getElementById('cvWorld');
    const canvas = await html2canvas(target, { backgroundColor: '#0d0d12', scale: 2, useCORS: true });
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png', 1);
    a.download = (c.name || 'canvas').replace(/[^\w\-]+/g,'_') + '.png';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    showStatus('📷 PNG descargado');
  }

  // Reuse the notebook picker modal (lives in mindmap.html)
  async function attachToNotebook(){
    if (!getActive()) return alert('Abrí un canvas primero.');
    if (typeof html2canvas === 'undefined' || !window.NBShared) return alert('Dependencias no cargadas.');
    const target = document.getElementById('cvWorld');
    const canvas = await html2canvas(target, { backgroundColor: '#0d0d12', scale: 2 });
    const dataUrl = canvas.toDataURL('image/png', 1);
    const c = getActive();
    const rec = await NBShared.storeImageWithThumbnail(dataUrl, '🎨 Canvas: ' + c.name);
    // Quick prompt-based picker (no UI overlap with MM picker)
    const mod = prompt('Adjuntar a módulo (13-NOT / 10-SYS / 14-WORK):', '13-NOT');
    if (!mod) return;
    const KEYS = { '13-NOT':{meta:'not_nb_meta',data:'not_nb_data'}, '10-SYS':{meta:'sys_notebook_meta',data:'sys_notebook'}, '14-WORK':{meta:'work_nb_meta',data:'work_nb_data'} };
    const sel = KEYS[mod]; if (!sel) return alert('Módulo inválido.');
    let metaList = []; try { metaList = JSON.parse(localStorage.getItem(sel.meta)||'[]'); } catch {}
    if (!metaList.length) return alert('Sin cuadernos en ' + mod);
    const nbName = prompt('Cuaderno (nombre del existente):', metaList[0].name);
    const nb = metaList.find(m => m.name === nbName); if (!nb) return alert('Cuaderno no encontrado.');
    let data = {}; try { data = JSON.parse(localStorage.getItem(sel.data)||'{}'); } catch {}
    if (!data[nb.id]) data[nb.id] = { pages: [] };
    const page = { id: Date.now(), title: '🎨 Canvas: ' + c.name, body: '', images: [{ id: rec.id, thumbnail: rec.thumbnail, preview: rec.preview, caption: rec.caption, size: rec.size, addedAt: rec.addedAt }], attachments: [], links: [], created: new Date().toISOString(), updated: new Date().toISOString() };
    data[nb.id].pages.unshift(page);
    localStorage.setItem(sel.data, JSON.stringify(data));
    showStatus('✅ Adjuntado a ' + mod + ' · ' + nbName);
  }

  /* ── List render ────────────────────────────────────────── */
  function renderList(){
    const el = document.getElementById('cvList'); if (!el) return;
    if (!_items.length) { el.innerHTML = '<div class="cv-empty">📍 Sin canvases.<br>Click <b>+ Nuevo</b>.</div>'; return; }
    el.innerHTML = _items.slice().sort((a,b)=>(b.updated||'').localeCompare(a.updated||'')).map(c =>
      `<div class="cv-item ${c.id===_activeId?'on':''}" onclick="CV.open('${c.id}')">
        <div class="cv-item-t">${esc(c.name)}</div>
        <div class="cv-item-m"><span>${fmtDate(c.updated||c.created)} · ${(c.nodes||[]).length}n / ${(c.edges||[]).length}e</span><button class="cv-item-del" onclick="event.stopPropagation();CV.remove('${c.id}')">✕</button></div>
      </div>`
    ).join('');
  }

  /* ── Init / show ─────────────────────────────────────────── */
  function init(){
    load();
    renderList();
    setupViewport();
    if (_items.length) {
      const latest = _items.slice().sort((a,b)=>(b.updated||'').localeCompare(a.updated||''))[0];
      if (latest) open(latest.id);
    } else {
      clearStage();
    }
  }
  function onShow(){
    setupViewport(); // ensure wiring (in case viewport DOM was re-rendered)
    applyView();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else setTimeout(init, 0);

  return {
    create, open, save, remove, rename,
    addShape, deleteSelected, colorSelected, toggleConnect,
    zoomIn, zoomOut, zoomReset,
    exportPng, attachToNotebook,
    onShow,
  };
})();
window.CV = CV;
