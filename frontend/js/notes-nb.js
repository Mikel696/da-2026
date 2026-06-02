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

  /* ── NOTEBOOK TEMPLATES · 5 starters (estudio sistemas / programación) ── */
  const NB_TEMPLATES = {
    blank: { label:'⚪ En blanco', desc:'Sin páginas pre-creadas', pages: [] },
    prog: {
      label: '💻 Lenguaje de programación',
      desc: 'Sintaxis · Tipos · Control · Funciones · OOP · Stdlib · Ejemplos · Recursos',
      pages: [
        { title:'📖 Introducción y motivación', body:'<div><b>Origen e historia.</b></div><div>Año, autor, motivo de diseño, problemas que resolvía.</div><div><br></div><div><b>Filosofía.</b></div><div>Principios de diseño que el lenguaje defiende (legibilidad, performance, seguridad, etc.).</div><div><br></div><div><b>Casos de uso típicos.</b></div><div>Ámbitos donde brilla y ámbitos donde no se recomienda.</div>' },
        { title:'✏️ Sintaxis básica', body:'<div><b>Estructura general de un programa.</b></div><div>Punto de entrada, comentarios, indentación o llaves.</div><div><br></div><div><b>Variables y constantes.</b></div><div>Declaración, inferencia, mutabilidad.</div><div><br></div><div><b>Operadores.</b></div><div>Aritméticos, lógicos, comparación, asignación, bitwise.</div>' },
        { title:'🏷️ Sistema de tipos', body:'<div><b>Tipos primitivos.</b></div><div>int, float, bool, char, string — tamaño y rango.</div><div><br></div><div><b>Tipos compuestos.</b></div><div>array, list, tuple, dict / map, set, struct.</div><div><br></div><div><b>Tipado estático vs dinámico · fuerte vs débil.</b></div><div>¿Hay inferencia? ¿Hay genéricos?</div>' },
        { title:'⚙️ Control de flujo', body:'<div><b>Condicionales.</b></div><div>if / else / switch · pattern matching (si aplica).</div><div><br></div><div><b>Loops.</b></div><div>for, while, do-while, break, continue.</div><div><br></div><div><b>Manejo de errores.</b></div><div>try/catch · result types · panics.</div>' },
        { title:'🧩 Funciones', body:'<div><b>Definición y argumentos.</b></div><div>Sintaxis, default args, kwargs, varargs.</div><div><br></div><div><b>Paso por valor vs referencia.</b></div><div><br></div><div><b>Funciones de primera clase.</b></div><div>Closures, lambdas, higher-order functions.</div>' },
        { title:'🏛️ OOP / Estructuras', body:'<div><b>Clases, structs, objetos.</b></div><div>Constructor, atributos, métodos.</div><div><br></div><div><b>Herencia, polimorfismo, encapsulamiento.</b></div><div><br></div><div><b>Interfaces / Traits / Protocols.</b></div>' },
        { title:'📚 Librería estándar', body:'<div><b>Módulos core.</b></div><div>I/O, strings, collections, math, time, random, regex.</div><div><br></div><div><b>Cómo importar y nombrar.</b></div><div><br></div><div><b>Top-3 librerías más usadas del ecosistema.</b></div>' },
        { title:'🚀 Ejemplos de código', body:'<div><b>Hello world.</b></div><div>(insertá un code block aquí)</div><div><br></div><div><b>FizzBuzz.</b></div><div><br></div><div><b>Lectura de archivo + procesamiento.</b></div><div><br></div><div><b>API HTTP request.</b></div>' },
        { title:'📡 Ecosistema y herramientas', body:'<div><b>Package manager.</b></div><div>Comandos básicos.</div><div><br></div><div><b>Build / runner.</b></div><div><br></div><div><b>Testing framework.</b></div><div><br></div><div><b>Linter / formatter.</b></div>' },
        { title:'📌 Recursos y referencia', body:'<div><b>Documentación oficial.</b></div><div>Link.</div><div><br></div><div><b>Libros recomendados.</b></div><div><br></div><div><b>Cursos / Tutoriales.</b></div><div><br></div><div><b>Cheatsheet personal.</b></div>' },
      ]
    },
    algo: {
      label: '🧮 Algoritmo / Estructura de datos',
      desc: 'Problema · Análisis · Pseudocódigo · Implementación · Complejidad · Tests',
      pages: [
        { title:'❓ Problema', body:'<div><b>Enunciado.</b></div><div>Descripción clara y autónoma.</div><div><br></div><div><b>Entrada / Salida.</b></div><div>Tipos, rangos, casos borde.</div><div><br></div><div><b>Restricciones.</b></div><div>Tamaño máximo, tiempo, memoria.</div>' },
        { title:'🧠 Análisis y enfoque', body:'<div><b>Idea general.</b></div><div>Cómo se piensa la solución antes de codear.</div><div><br></div><div><b>Estructura de datos elegida y por qué.</b></div><div><br></div><div><b>Trade-offs descartados.</b></div>' },
        { title:'📝 Pseudocódigo', body:'<div>Pasos numerados, lenguaje natural + estructura algorítmica.</div><div><br></div><div>(insertá un code block para el pseudo)</div>' },
        { title:'💻 Implementación', body:'<div>Código real en el lenguaje elegido.</div><div><br></div><div>(insertá un code block)</div>' },
        { title:'⏱️ Complejidad', body:'<div><b>Tiempo.</b></div><div>Mejor caso · promedio · peor caso (Big-O).</div><div><br></div><div><b>Espacio.</b></div><div>Estructuras auxiliares.</div><div><br></div><div><b>Justificación.</b></div>' },
        { title:'✅ Tests y casos borde', body:'<div><b>Happy path.</b></div><div>Entrada típica.</div><div><br></div><div><b>Casos borde.</b></div><div>Vacío, 1 elemento, máximo, negativos.</div><div><br></div><div><b>Casos que rompen ingenuamente.</b></div>' },
        { title:'🔍 Variantes y extensiones', body:'<div><b>Versión optimizada.</b></div><div><br></div><div><b>Problemas similares.</b></div><div>LeetCode / HackerRank IDs.</div>' },
      ]
    },
    concept: {
      label: '🧠 Concepto académico',
      desc: 'Definición · Por qué importa · Ejemplos · Conexiones · Examen',
      pages: [
        { title:'📖 Definición formal', body:'<div>Definición textual del concepto, lo más cercana al libro/profesor.</div>' },
        { title:'💡 Intuición', body:'<div>Explicación con tus propias palabras, como se la explicarías a alguien sin contexto.</div>' },
        { title:'🚀 Ejemplos', body:'<div><b>Ejemplo 1.</b></div><div><br></div><div><b>Ejemplo 2.</b></div><div><br></div><div><b>Contra-ejemplo (cuándo NO aplica).</b></div>' },
        { title:'🔗 Conexiones', body:'<div><b>Conceptos relacionados.</b></div><div>De qué depende, qué cosas dependen de esto.</div><div><br></div><div><b>Otros cursos / materias donde aparece.</b></div>' },
        { title:'❓ Preguntas de examen', body:'<div><b>Pregunta tipo 1.</b></div><div>(redactá con respuesta corta abajo)</div><div><br></div><div><b>Pregunta tipo 2.</b></div>' },
        { title:'📚 Fuentes', body:'<div><b>Libro / capítulo.</b></div><div><br></div><div><b>Video / clase.</b></div><div><br></div><div><b>Link oficial.</b></div>' },
      ]
    },
    workflow: {
      label: '🛠️ Workflow / Proyecto',
      desc: 'Objetivo · Stack · Tareas · Recursos · Logs · Retrospectiva',
      pages: [
        { title:'🎯 Objetivo y alcance', body:'<div><b>¿Qué resultado quiero al terminar?</b></div><div><br></div><div><b>Lo que NO está dentro del alcance.</b></div><div><br></div><div><b>Criterios de éxito.</b></div>' },
        { title:'⚙️ Stack y arquitectura', body:'<div><b>Lenguajes / frameworks.</b></div><div><br></div><div><b>Servicios externos.</b></div><div><br></div><div><b>Diagrama (insertá imagen o exportá un mapa mental).</b></div>' },
        { title:'✅ Tareas pendientes', body:'<div><span class="nb-check">☐</span> Tarea 1</div><div><span class="nb-check">☐</span> Tarea 2</div><div><span class="nb-check">☐</span> Tarea 3</div>' },
        { title:'📚 Recursos y comandos', body:'<div><b>Comandos frecuentes.</b></div><div>(code blocks)</div><div><br></div><div><b>Links útiles.</b></div>' },
        { title:'📝 Log diario', body:'<div><b>YYYY-MM-DD.</b> Resumen de lo que hice y bloqueos.</div>' },
        { title:'🔄 Retrospectiva', body:'<div><b>¿Qué funcionó?</b></div><div><br></div><div><b>¿Qué reharía?</b></div><div><br></div><div><b>Aprendizajes para el siguiente proyecto.</b></div>' },
      ]
    },
  };
  function _createWithTemplate(tplKey){
    const nameInp = document.getElementById('notNbName');
    const iconV = (document.getElementById('notNbIconValue')||{}).value || '📘';
    const coverV = (document.getElementById('notNbCoverValue')||{}).value || 'c1';
    const name = (nameInp?.value || '').trim();
    if (!name) { alert('Dale un nombre al cuaderno.'); return; }
    const tpl = NB_TEMPLATES[tplKey] || NB_TEMPLATES.blank;
    const list = loadMeta();
    const id = 'not_nb_' + Date.now();
    list.push({ id, name, icon: iconV, cover: coverV, color: PALETTE[list.length % PALETTE.length], created: new Date().toISOString() });
    saveMeta(list);
    const data = loadData();
    const now = new Date().toISOString();
    const pages = (tpl.pages || []).map((p, i) => ({
      id: Date.now() + i,
      title: p.title || '',
      body: p.body || '',
      images: [], attachments: [], links: [],
      created: now, updated: now,
    }));
    data[id] = { pages: pages.reverse() }; // last pushed = first
    saveData(data);
    if (nameInp) nameInp.value = '';
    setActive(id);
    activePageId = pages.length ? pages[0].id : null;
    render();
  }

  /* ── CRUD notebooks ───────────────────────────────────────── */
  function create(){
    const tplSel = document.getElementById('notNbTpl');
    const tplKey = (tplSel && tplSel.value) || 'blank';
    _createWithTemplate(tplKey);
    if (tplSel) tplSel.value = 'blank';
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

  /* ── Move notebook to another module (NB-ENGINE standard) ── */
  function moveNotebook(id){
    if (!window.NBEngine) { alert('Motor de cuadernos no cargado.'); return; }
    NBEngine.transferUI(id, '13-NOT', () => {
      if (activeNbId === id) { setActive(null); activePageId = null; }
      render();
    });
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

  function _commitNow(nbId){
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
  }
  function autoSave(nbId){
    clearTimeout(saveTimers[nbId]);
    saveTimers[nbId] = setTimeout(() => _commitNow(nbId), 500);
  }
  function flushAll(){
    Object.keys(saveTimers).forEach(nbId => { clearTimeout(saveTimers[nbId]); _commitNow(nbId); });
  }
  window.addEventListener('beforeunload', flushAll);
  document.addEventListener('visibilitychange', () => { if (document.hidden) flushAll(); });
  document.addEventListener('focusout', (e) => {
    const t = e.target; if (!t || !t.id) return;
    if (t.id.startsWith('nbBody-')) _commitNow(t.id.slice(7));
    else if (t.id.startsWith('nbTitle-')) _commitNow(t.id.slice(8));
  });

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

  /* ── PAGE EDITOR HTML (centralized · usa NBShared.toolbarHtml) ── */
  function buildEditorHtml(nbId, page){
    if (!page) return '';
    const toolbarHtml = (window.NBShared && NBShared.toolbarHtml) ? NBShared.toolbarHtml(nbId, 'NotNB') : '';
    return `${toolbarHtml}
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
      return `<div class="nb-entry${isActive?' open':''}" draggable="true" data-pg="${p.id}" data-nb="${nb.id}">
        <div class="nb-entry-h" onclick="NotNB.openPage('${nb.id}',${p.id})">
          <span class="nb-entry-grip" title="Arrastrá para reordenar" style="cursor:grab;color:var(--t3);font-size:14px;padding-right:6px;user-select:none">⋮⋮</span>
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

    return `<div class="cd" style="border-left:3px solid ${nb.color||'#8b5cf6'};padding:0;overflow:visible"><!-- visible para sticky toolbar -->
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
            <button onclick="NotNB.toggleMap('${nb.id}')" class="btn bo bs" title="Mostrar/ocultar mapa mental del cuaderno">🗺️ Mapa</button>
            <button onclick="NotNB.editDesign('${nb.id}')" class="btn bo bs">🎨 Diseño</button>
            <button onclick="NotNB.rename('${nb.id}')" class="btn bo bs">✏️</button>
            <button onclick="NotNB.moveNotebook('${nb.id}')" class="btn bo bs" title="Mover a otro módulo">📦 Mover</button>
            <button onclick="NotNB.remove('${nb.id}')" class="btn bo bs" style="border-color:rgba(239,68,68,.3);color:var(--rd)">🗑</button>
          </div>
        </div>
        ${editorHtml || '<div style="text-align:center;padding:20px;color:var(--t3);font-size:12px;background:var(--c1);border:1px dashed var(--bd);border-radius:8px;margin:10px 0">Crea o selecciona una página para empezar a escribir.</div>'}
        ${mapHtml(nb.id)}
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
    // Attach paste-cleaner + checklist + code highlight a todos los editores recién renderizados.
    if (window.NBShared && NBShared.attachEditorHandlers) {
      wrap.querySelectorAll('.nb-content[contenteditable="true"]').forEach(el => NBShared.attachEditorHandlers(el));
    }
    // Drag-to-reorder de páginas del cuaderno activo
    _wirePageReorder(wrap);
  }

  /* ══════════════════════════════════════════════════════════════
     MINDMAP POR CUADERNO · SVG canvas con nodos drag + edges
     Store: not_nb_maps = { [nbId]: { nodes, edges, updatedAt } }
     Interacciones:
       · Click vacío → crear nodo (prompt texto)
       · Drag nodo → mover
       · Shift/Ctrl + click nodo → marcar origen para conectar
                                    (siguiente click nodo crea edge)
       · Doble-click nodo → editar texto
       · Click derecho nodo → eliminar
       · Botón "Limpiar mapa" → reset total
  ══════════════════════════════════════════════════════════════ */
  const MAP_KEY = 'not_nb_maps';
  const MAP_PAL = ['#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#6366f1','#14b8a6'];
  // Palette de iconos rápidos para nodos del mapa (estudio, código, ciencia, conceptos)
  const MAP_ICONS = ['💡','📘','📗','📕','🧠','🎯','⚙️','🔧','🔬','🧪','📊','📈','📉','🗂️','🏷️','⭐','🚀','🔑','❓','⚠️','✅','🔥','🌐','💾','📡','🤖','🐍','☕','🦀','🟨','⚛️','🅰️','🅱️','🅾️','#️⃣','➕','➖','✖️','➗','∑','∞','π','λ','∂','∇','⇒','⇔','∀','∃','∈','⊆','∪','∩','→','↑','↓','✏️','📝','📌','🔖'];
  // Parser: si el texto empieza con emoji + espacio, lo separa como icon
  // Detecta primer carácter unicode emoji-ish (rangos surrogate u otros simbolos comunes)
  function _splitIcon(raw){
    const s = (raw||'').trim();
    if (!s) return { icon:'', text:'' };
    // Match: 1-2 code-unit emoji al inicio, opcional ZWJ extensions, seguido de space y/o resto
    const m = s.match(/^(\p{Extended_Pictographic}(?:‍\p{Extended_Pictographic})*|[#*0-9]️⃣|[☀-➿⬀-⯿©®‼⁉™ℹ↔-↙↩↪])\s*(.*)$/u);
    if (m) return { icon:m[1], text:(m[2]||'').trim() };
    return { icon:'', text:s };
  }
  let _mapLink = { nbId:null, fromId:null };

  function loadMaps(){ try { return JSON.parse(localStorage.getItem(MAP_KEY)||'{}'); } catch { return {}; } }
  function saveMaps(m){ try { localStorage.setItem(MAP_KEY, JSON.stringify(m)); } catch(e){ console.warn('saveMaps:',e); } }
  function getMap(nbId){
    const all = loadMaps();
    if (!all[nbId]) all[nbId] = { nodes:[], edges:[], updatedAt:new Date().toISOString() };
    return all[nbId];
  }
  function setMap(nbId, mp){
    const all = loadMaps();
    mp.updatedAt = new Date().toISOString();
    all[nbId] = mp;
    saveMaps(all);
  }
  function toggleMap(nbId){
    const el = document.getElementById('nbMapWrap-'+nbId);
    if (!el) return;
    const showing = el.style.display !== 'none';
    el.style.display = showing ? 'none' : 'block';
    if (!showing) renderMap(nbId);
  }
  function renderMap(nbId){
    const root = document.getElementById('nbMapSvg-'+nbId);
    if (!root) return;
    const mp = getMap(nbId);
    const W=800, H=460;
    const linking = _mapLink.nbId === nbId && _mapLink.fromId;
    let svg = '<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet" style="width:100%;height:auto;background:radial-gradient(circle at 50% 40%,rgba(139,92,246,.06),transparent 70%),var(--c1);border:1px solid var(--bd);border-radius:10px;cursor:crosshair" id="nbMapSvgEl-'+nbId+'">';
    // edges
    mp.edges.forEach(e=>{
      const a = mp.nodes.find(n=>n.id===e.from);
      const b = mp.nodes.find(n=>n.id===e.to);
      if (!a||!b) return;
      svg += '<line x1="'+a.x+'" y1="'+a.y+'" x2="'+b.x+'" y2="'+b.y+'" stroke="rgba(167,139,250,.55)" stroke-width="2" stroke-linecap="round"/>';
    });
    // nodes
    mp.nodes.forEach(n=>{
      const col = n.color || MAP_PAL[0];
      const isFrom = linking && _mapLink.fromId === n.id;
      const ring = isFrom ? '<circle cx="'+n.x+'" cy="'+n.y+'" r="34" fill="none" stroke="#fde047" stroke-width="2" stroke-dasharray="4 3"/>' : '';
      const hasIcon = !!(n.icon && n.icon.length);
      const hasPage = !!n.pageId;
      const radius = hasIcon ? 32 : 28;
      const cursor = hasPage ? 'pointer' : 'grab';
      svg += ring + '<g class="mm-node" data-id="'+n.id+'" style="cursor:'+cursor+'">';
      // halo extra para nodos con página vinculada
      if (hasPage) {
        svg += '<circle cx="'+n.x+'" cy="'+n.y+'" r="'+(radius+3)+'" fill="none" stroke="#10b981" stroke-width="1.5" opacity=".7"/>';
      }
      svg += '<circle cx="'+n.x+'" cy="'+n.y+'" r="'+radius+'" fill="'+col+'22" stroke="'+col+'" stroke-width="2"/>';
      if (hasIcon) {
        svg += '<text x="'+n.x+'" y="'+(n.y-6)+'" text-anchor="middle" font-size="18" pointer-events="none">'+esc(n.icon)+'</text>';
        const txt = esc(n.text||'').slice(0,18);
        svg += '<text x="'+n.x+'" y="'+(n.y+18)+'" text-anchor="middle" font-size="10" font-weight="600" fill="var(--tx)" font-family="IBM Plex Sans,sans-serif" pointer-events="none">'+txt+'</text>';
      } else {
        const txt = esc(n.text||'').slice(0,18);
        svg += '<text x="'+n.x+'" y="'+(n.y+4)+'" text-anchor="middle" font-size="11" font-weight="600" fill="var(--tx)" font-family="IBM Plex Sans,sans-serif" pointer-events="none">'+txt+'</text>';
      }
      // marker de página vinculada (arriba-derecha)
      if (hasPage) {
        svg += '<circle cx="'+(n.x+radius-4)+'" cy="'+(n.y-radius+4)+'" r="8" fill="#0a0a0c" stroke="#10b981" stroke-width="1.5"/>';
        svg += '<text x="'+(n.x+radius-4)+'" y="'+(n.y-radius+8)+'" text-anchor="middle" font-size="9" pointer-events="none">🔗</text>';
      }
      svg += '</g>';
    });
    svg += '</svg>';
    root.innerHTML = svg;
    _wireMapEvents(nbId);
  }
  function _wireMapEvents(nbId){
    const svgEl = document.getElementById('nbMapSvgEl-'+nbId);
    if (!svgEl) return;
    const ptOf = (evt) => {
      const r = svgEl.getBoundingClientRect();
      const x = ((evt.clientX - r.left) / r.width) * 800;
      const y = ((evt.clientY - r.top)  / r.height) * 460;
      return { x, y };
    };
    let drag = null;
    svgEl.addEventListener('mousedown', (e) => {
      const g = e.target.closest('.mm-node');
      if (!g) return;
      const id = g.getAttribute('data-id');
      if (e.ctrlKey || e.shiftKey || e.metaKey) {
        // link mode
        if (_mapLink.nbId === nbId && _mapLink.fromId && _mapLink.fromId !== id) {
          const mp = getMap(nbId);
          if (!mp.edges.some(x => (x.from===_mapLink.fromId && x.to===id) || (x.from===id && x.to===_mapLink.fromId))) {
            mp.edges.push({ from:_mapLink.fromId, to:id });
            setMap(nbId, mp);
          }
          _mapLink = { nbId:null, fromId:null };
        } else {
          _mapLink = { nbId, fromId:id };
        }
        renderMap(nbId);
        return;
      }
      drag = { id, started:false, startX:e.clientX, startY:e.clientY };
    });
    svgEl.addEventListener('mousemove', (e) => {
      if (!drag) return;
      if (!drag.started && (Math.abs(e.clientX-drag.startX)+Math.abs(e.clientY-drag.startY)) < 4) return;
      drag.started = true;
      const p = ptOf(e);
      const mp = getMap(nbId);
      const n = mp.nodes.find(x => x.id === drag.id);
      if (!n) return;
      n.x = Math.max(34, Math.min(800-34, p.x));
      n.y = Math.max(34, Math.min(460-34, p.y));
      setMap(nbId, mp);
      renderMap(nbId);
    });
    // mouseup: si fue un tap (sin drag) y el nodo tiene página vinculada → abrir página
    svgEl.addEventListener('mouseup', (e) => {
      if (drag && drag.id && !drag.started) {
        const mp = getMap(nbId);
        const n = mp.nodes.find(x => x.id === drag.id);
        if (n && n.pageId) {
          activePageId = isNaN(Number(n.pageId)) ? n.pageId : Number(n.pageId);
          render();
          // scroll al editor + abrir el wrap del mapa si aún está visible
          setTimeout(() => {
            const ed = document.getElementById('nbBody-'+nbId);
            if (ed) ed.scrollIntoView({ behavior:'smooth', block:'start' });
          }, 80);
        }
      }
      drag = null;
    });
    svgEl.addEventListener('mouseleave', () => { drag = null; });
    // Click vacío → crear nodo (acepta "📘 Python" → icon + text auto-split)
    // Alt+click nodo → abrir picker de icono
    // Click nodo plano → handled por mousedown
    // Doble click nodo → editar texto+icono (formato "icon texto")
    svgEl.addEventListener('click', (e) => {
      if (drag && drag.started) return;
      const g = e.target.closest('.mm-node');
      if (g) {
        if (e.altKey) {
          e.preventDefault();
          openIconPicker(nbId, g.getAttribute('data-id'));
        }
        return; // handled por mousedown
      }
      const p = ptOf(e);
      const raw = prompt('Texto del nodo (podés empezar con un emoji, ej "📘 Python"):');
      if (raw == null || !raw.trim()) return;
      const { icon, text } = _splitIcon(raw);
      const mp = getMap(nbId);
      const color = MAP_PAL[mp.nodes.length % MAP_PAL.length];
      mp.nodes.push({ id:'n_'+Date.now()+'_'+Math.random().toString(36).slice(2,6), x:p.x, y:p.y, text, icon, color });
      setMap(nbId, mp);
      renderMap(nbId);
    });
    svgEl.addEventListener('dblclick', (e) => {
      const g = e.target.closest('.mm-node');
      if (!g) return;
      const id = g.getAttribute('data-id');
      const mp = getMap(nbId);
      const n = mp.nodes.find(x => x.id === id);
      if (!n) return;
      const current = (n.icon ? n.icon + ' ' : '') + (n.text || '');
      const raw = prompt('Editar (formato: "icono texto" o solo texto):', current);
      if (raw == null) return;
      const { icon, text } = _splitIcon(raw);
      n.text = text;
      n.icon = icon;
      setMap(nbId, mp);
      renderMap(nbId);
    });
    svgEl.addEventListener('contextmenu', (e) => {
      const g = e.target.closest('.mm-node');
      if (!g) return;
      e.preventDefault();
      if (!confirm('¿Eliminar este nodo y sus conexiones?')) return;
      const id = g.getAttribute('data-id');
      const mp = getMap(nbId);
      mp.nodes = mp.nodes.filter(n => n.id !== id);
      mp.edges = mp.edges.filter(x => x.from !== id && x.to !== id);
      setMap(nbId, mp);
      renderMap(nbId);
    });
  }
  function clearMap(nbId){
    if (!confirm('¿Limpiar el mapa entero?')) return;
    setMap(nbId, { nodes:[], edges:[] });
    renderMap(nbId);
  }
  /* Settings de nodo · icono + link a página del cuaderno · overlay flotante */
  function openIconPicker(nbId, nodeId){
    let ov = document.getElementById('nbMapIconOverlay');
    if (ov) ov.remove();
    const mp = getMap(nbId);
    const node = mp.nodes.find(x => x.id === nodeId);
    const pages = getPages(nbId);
    const currentLink = node && node.pageId ? node.pageId : '';
    const linkedPage = pages.find(p => String(p.id) === String(currentLink));
    ov = document.createElement('div');
    ov.id = 'nbMapIconOverlay';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:99998;display:flex;align-items:center;justify-content:center;padding:20px';
    const grid = MAP_ICONS.map(ic =>
      '<button data-ic="'+ic+'" style="font-size:22px;width:42px;height:42px;border-radius:8px;border:1px solid var(--bd);background:var(--c1);color:var(--tx);cursor:pointer;transition:background .15s,border-color .15s" onmouseover="this.style.background=\'var(--ag,rgba(139,92,246,.12))\';this.style.borderColor=\'#a78bfa\'" onmouseout="this.style.background=\'var(--c1)\';this.style.borderColor=\'var(--bd)\'">'+ic+'</button>'
    ).join('');
    const pageOpts = pages.map((p, i) =>
      '<option value="'+p.id+'"'+(String(p.id)===String(currentLink)?' selected':'')+'>'+esc((p.title||'').slice(0,60) || 'Página '+(i+1))+'</option>'
    ).join('');
    const linkStatus = linkedPage
      ? '<span style="color:#10b981">🔗 Vinculado a: <b>'+esc(linkedPage.title||'sin título')+'</b></span>'
      : '<span style="color:var(--t3)">Sin vínculo a página</span>';
    ov.innerHTML = '<div style="background:var(--c1);border:1px solid var(--bd);border-radius:14px;padding:20px;max-width:560px;width:100%;max-height:88vh;overflow:auto;box-shadow:0 20px 60px rgba(0,0,0,.5)">'+
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px"><div><div style="font-size:14px;font-weight:600;color:var(--tx)">⚙️ Settings del nodo</div><div style="font-size:11px;color:var(--t3);margin-top:2px">Asigná un icono y/o vinculá una página del cuaderno</div></div><button id="nbIcCancel" style="background:transparent;border:none;color:var(--t3);font-size:18px;cursor:pointer;padding:4px 8px" aria-label="Cerrar">✕</button></div>'+

      '<div style="font-size:11px;font-weight:600;color:var(--t2);margin:6px 0 6px;text-transform:uppercase;letter-spacing:1px">🎨 Icono</div>'+
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(42px,1fr));gap:6px;max-height:240px;overflow:auto;padding:4px;border:1px solid var(--bd);border-radius:8px;background:var(--bg,rgba(0,0,0,.2))">'+grid+'</div>'+
      '<div style="margin-top:8px;display:flex;justify-content:flex-end"><button id="nbIcRemove" class="btn bo bs">Quitar icono</button></div>'+

      '<div style="font-size:11px;font-weight:600;color:var(--t2);margin:18px 0 6px;text-transform:uppercase;letter-spacing:1px">🔗 Link a página del cuaderno</div>'+
      '<div style="font-size:11px;margin-bottom:6px">'+linkStatus+'</div>'+
      (pages.length
        ? '<div style="display:flex;gap:6px"><select id="nbIcPage" class="inp" style="flex:1">'+
            '<option value="">— Sin vínculo —</option>'+pageOpts+
          '</select><button id="nbIcLinkSave" class="btn bg bs">Guardar</button></div>'
        : '<div style="font-size:11px;color:var(--t3);padding:8px;border:1px dashed var(--bd);border-radius:6px">Este cuaderno aún no tiene páginas. Creá una primero para poder vincular.</div>'
      )+
      '<div style="font-size:10px;color:var(--t3);margin-top:6px">Cuando un nodo tiene página vinculada, hacés <b>click simple</b> sobre él y se abre esa página automáticamente.</div>'+
      '</div>';
    document.body.appendChild(ov);
    const close = () => ov.remove();
    document.getElementById('nbIcCancel').onclick = close;
    ov.addEventListener('click', (e) => { if (e.target === ov) close(); });
    document.getElementById('nbIcRemove').onclick = () => {
      const m = getMap(nbId);
      const n = m.nodes.find(x => x.id === nodeId);
      if (n) { n.icon = ''; setMap(nbId, m); renderMap(nbId); }
      close();
    };
    ov.querySelectorAll('button[data-ic]').forEach(btn => {
      btn.onclick = () => {
        const ic = btn.getAttribute('data-ic');
        const m = getMap(nbId);
        const n = m.nodes.find(x => x.id === nodeId);
        if (n) { n.icon = ic; setMap(nbId, m); renderMap(nbId); }
        close();
      };
    });
    const linkBtn = document.getElementById('nbIcLinkSave');
    if (linkBtn) linkBtn.onclick = () => {
      const sel = document.getElementById('nbIcPage');
      const val = sel ? sel.value : '';
      const m = getMap(nbId);
      const n = m.nodes.find(x => x.id === nodeId);
      if (n) { if (val) n.pageId = val; else delete n.pageId; setMap(nbId, m); renderMap(nbId); }
      close();
    };
  }
  /* ── Templates de mindmap · 4 starters ─────────────────────────── */
  const MAP_TEMPLATES = {
    blank:   { label:'⚪ Blanco',                  desc:'Vacío para empezar de cero' },
    radial:  { label:'🌟 Radial',                  desc:'Nodo central con 6 ramas' },
    concept: { label:'🧠 Mapa conceptual',          desc:'Jerarquía top-down (4 niveles)' },
    prog:    { label:'💻 Lenguaje de programación', desc:'Sintaxis · Semántica · Paradigma · Tipos · Ejemplos' },
  };
  function _tplBlank(){ return { nodes:[], edges:[] }; }
  function _tplRadial(center){
    const c = { id:'tpl_c', x:400, y:230, text:center||'Tema', icon:'🎯', color:MAP_PAL[0] };
    const labels = ['Definición','Ejemplos','Aplicaciones','Conexiones','Preguntas','Recursos'];
    const ics = ['📖','💡','🚀','🔗','❓','📚'];
    const nodes = [c]; const edges = [];
    const N = labels.length;
    for (let i=0;i<N;i++){
      const ang = (i / N) * Math.PI * 2 - Math.PI/2;
      const x = 400 + Math.cos(ang)*160;
      const y = 230 + Math.sin(ang)*150;
      const id = 'tpl_n'+i;
      nodes.push({ id, x, y, text:labels[i], icon:ics[i], color:MAP_PAL[(i+1)%MAP_PAL.length] });
      edges.push({ from:'tpl_c', to:id });
    }
    return { nodes, edges };
  }
  function _tplConcept(){
    const N = (id,x,y,t,ic,ci)=>({id,x,y,text:t,icon:ic,color:MAP_PAL[ci%MAP_PAL.length]});
    const nodes = [
      N('cc', 400, 60, 'Concepto principal','🧠',0),
      N('s1', 180, 180, 'Sub-tema A','📘',1),
      N('s2', 400, 180, 'Sub-tema B','📗',2),
      N('s3', 620, 180, 'Sub-tema C','📕',3),
      N('d1', 120, 320, 'Detalle','💡',4),
      N('d2', 240, 320, 'Detalle','💡',4),
      N('d3', 400, 320, 'Detalle','💡',4),
      N('d4', 620, 320, 'Detalle','💡',4),
      N('ex', 400, 420, 'Ejemplo / Aplicación','🚀',5),
    ];
    const edges = [
      {from:'cc',to:'s1'},{from:'cc',to:'s2'},{from:'cc',to:'s3'},
      {from:'s1',to:'d1'},{from:'s1',to:'d2'},
      {from:'s2',to:'d3'},
      {from:'s3',to:'d4'},
      {from:'d3',to:'ex'},{from:'d4',to:'ex'},
    ];
    return { nodes, edges };
  }
  function _tplProg(lang){
    const L = lang || 'Lenguaje';
    const N = (id,x,y,t,ic,ci)=>({id,x,y,text:t,icon:ic,color:MAP_PAL[ci%MAP_PAL.length]});
    const nodes = [
      N('lang', 400, 230, L, '💻', 0),
      N('syn',  180,  90, 'Sintaxis',     '✏️', 1),
      N('sem',  620,  90, 'Semántica',    '🧠', 2),
      N('par',  120, 230, 'Paradigma',    '⚙️', 3),
      N('typ',  680, 230, 'Sistema de tipos','🏷️', 4),
      N('std',  180, 370, 'Librería estándar','📚', 5),
      N('eco',  620, 370, 'Ecosistema',   '🌐', 6),
      N('ex',   400, 420, 'Ejemplos',     '🚀', 7),
    ];
    const edges = [
      {from:'lang',to:'syn'},{from:'lang',to:'sem'},{from:'lang',to:'par'},
      {from:'lang',to:'typ'},{from:'lang',to:'std'},{from:'lang',to:'eco'},
      {from:'lang',to:'ex'},{from:'std',to:'ex'},{from:'eco',to:'ex'},
    ];
    return { nodes, edges };
  }
  function applyMapTemplate(nbId, key){
    const mp = getMap(nbId);
    if (mp.nodes.length || mp.edges.length) {
      if (!confirm('El mapa ya tiene contenido. ¿Reemplazarlo por el template?')) return;
    }
    let data;
    if (key === 'radial')  data = _tplRadial(getNb(nbId) ? getNb(nbId).name : 'Tema');
    else if (key === 'concept') data = _tplConcept();
    else if (key === 'prog') {
      const lang = prompt('¿Qué lenguaje? (ej: Python, C, Java, JavaScript)', 'Python');
      data = _tplProg(lang || 'Lenguaje');
    }
    else data = _tplBlank();
    setMap(nbId, data);
    renderMap(nbId);
  }
  /* Export del mapa a PNG · serializa SVG → canvas → download */
  function exportMapPNG(nbId){
    const svgEl = document.getElementById('nbMapSvgEl-'+nbId);
    if (!svgEl) { alert('Abrí el mapa primero.'); return; }
    const mp = getMap(nbId);
    if (!mp.nodes.length) { alert('El mapa está vacío.'); return; }
    try {
      const xml = new XMLSerializer().serializeToString(svgEl);
      // Garantizar xmlns para que el browser pueda renderizarlo standalone
      const svgWithNS = xml.indexOf('xmlns=') === -1
        ? xml.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')
        : xml;
      const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgWithNS);
      const img = new Image();
      img.onload = () => {
        const scale = 2; // 2x para retina
        const cv = document.createElement('canvas');
        cv.width = 800 * scale; cv.height = 460 * scale;
        const ctx = cv.getContext('2d');
        ctx.fillStyle = '#0a0a0c';
        ctx.fillRect(0,0,cv.width,cv.height);
        ctx.drawImage(img, 0, 0, cv.width, cv.height);
        cv.toBlob((blob) => {
          if (!blob) { alert('Falló la exportación.'); return; }
          const nb = getNb(nbId);
          const fname = 'mapa-' + ((nb && nb.name) || 'cuaderno').replace(/[^a-z0-9_-]+/gi,'-').toLowerCase() + '.png';
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = fname;
          document.body.appendChild(a); a.click(); a.remove();
          setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        }, 'image/png');
      };
      img.onerror = () => alert('No pude renderizar el SVG para exportar.');
      img.src = url;
    } catch(e) {
      console.warn('exportMapPNG:', e);
      alert('Falló la exportación: ' + (e.message||e));
    }
  }
  function mapHtml(nbId){
    const mp = getMap(nbId);
    const tplOptions = Object.entries(MAP_TEMPLATES).map(([k,v]) =>
      `<option value="${k}">${v.label} — ${v.desc}</option>`
    ).join('');
    return `<div id="nbMapWrap-${nbId}" style="display:none;margin-top:14px;padding:14px;background:var(--c1);border:1px solid var(--bd);border-radius:10px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;gap:6px;flex-wrap:wrap">
        <div style="flex:1;min-width:200px">
          <div style="font-size:12px;font-weight:600;color:var(--tx)">🗺️ Mapa mental del cuaderno</div>
          <div style="font-size:10px;color:var(--t3);margin-top:2px;line-height:1.55">Click vacío → crear nodo (acepta "📘 Texto") · drag → mover · Ctrl/Shift+click 2 nodos → conectar · doble-click → editar · Alt+click → settings (icono + vincular página) · click nodo vinculado 🔗 → abrir página · click derecho → eliminar</div>
        </div>
        <div style="display:flex;gap:4px;flex-wrap:wrap;align-items:center">
          <span style="font-size:10px;color:var(--t3);font-family:'IBM Plex Mono',monospace">${mp.nodes.length} nodos · ${mp.edges.length} conexiones</span>
          <select id="nbMapTpl-${nbId}" onchange="if(this.value){NotNB.applyMapTemplate('${nbId}',this.value);this.value='';}" style="background:var(--el);border:1px solid var(--bd);color:var(--tx);border-radius:6px;padding:5px 9px;font-size:11px;font-family:inherit;cursor:pointer" title="Aplicar un template inicial">
            <option value="">📐 Template…</option>
            ${tplOptions}
          </select>
          <button onclick="NotNB.exportMapPNG('${nbId}')" class="btn bo bs" title="Descargar mapa como PNG (2x)">⬇ PNG</button>
          <button onclick="NotNB.clearMap('${nbId}')" class="btn bo bs" style="border-color:rgba(239,68,68,.3);color:var(--rd)" title="Limpiar todo el mapa">🗑 Limpiar</button>
        </div>
      </div>
      <div id="nbMapSvg-${nbId}"></div>
    </div>`;
  }

  /* ══════════════════════════════════════════════════════════════
     DRAG-TO-REORDER páginas del cuaderno · HTML5 drag-drop nativo
     - Cada .nb-entry es draggable=true con data-pg + data-nb
     - dragover muestra indicador (border-top) en el target
     - drop reordena en data y re-render
  ══════════════════════════════════════════════════════════════ */
  let _dragPgId = null;
  function _wirePageReorder(rootEl){
    if (!rootEl) return;
    const entries = rootEl.querySelectorAll('.nb-entry[draggable="true"]');
    entries.forEach(el => {
      el.addEventListener('dragstart', (e) => {
        _dragPgId = el.getAttribute('data-pg');
        el.style.opacity = '0.4';
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = 'move';
          try { e.dataTransfer.setData('text/plain', _dragPgId); } catch {}
        }
      });
      el.addEventListener('dragend', () => {
        el.style.opacity = '';
        entries.forEach(x => x.style.borderTop = '');
      });
      el.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (!_dragPgId || el.getAttribute('data-pg') === _dragPgId) return;
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
        entries.forEach(x => x.style.borderTop = '');
        el.style.borderTop = '2px solid #a78bfa';
      });
      el.addEventListener('dragleave', () => { el.style.borderTop = ''; });
      el.addEventListener('drop', (e) => {
        e.preventDefault();
        const src = _dragPgId;
        const tgt = el.getAttribute('data-pg');
        const nbId = el.getAttribute('data-nb');
        _dragPgId = null;
        if (!src || !tgt || src === tgt) return;
        reorderPages(nbId, src, tgt);
      });
    });
  }
  function reorderPages(nbId, srcPgId, tgtPgId){
    const data = loadData();
    if (!data[nbId] || !data[nbId].pages) return;
    const pages = data[nbId].pages;
    const si = pages.findIndex(p => String(p.id) === String(srcPgId));
    const ti = pages.findIndex(p => String(p.id) === String(tgtPgId));
    if (si < 0 || ti < 0) return;
    const [moved] = pages.splice(si, 1);
    pages.splice(ti, 0, moved);
    saveData(data);
    render();
  }

  /* ── INIT ─────────────────────────────────────────────────── */
  function init(){ render(); }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else setTimeout(init, 0);

  return {
    create, rename, remove, render, selectActive, moveNotebook,
    openDesignPicker, refreshNewFormPreview, editDesign,
    newPage, openPage, deletePage, autoSave,
    fmt, insertLabel, removeLabelEl,
    addLink, removeLink,
    addImage, renameImage, removeImage, viewImage,
    attachFile, removeAttachment,
    toggleMap, renderMap, clearMap,
    openIconPicker, applyMapTemplate, exportMapPNG,
    reorderPages,
    createFromTemplate: function(template){ return _createWithTemplate(template); },
  };
})();
window.NotNB = NotNB;
