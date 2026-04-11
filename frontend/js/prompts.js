// ══════════════════════════════════════════════════════════════
// 8-PRO · Prompt Lab v2 — IIFE PRO
// Single localStorage key: sb_prompts
// ══════════════════════════════════════════════════════════════
const PRO = (function () {
  'use strict';

  const STORE_KEY = 'sb_prompts';
  let _state = null;
  let _seed = null;
  let _activeTab = 'lib';
  let _filter = { cat: 'all', search: '', sort: 'recent' };
  let _editId = null; // id of prompt being edited in Create tab

  // ── Helpers ──────────────────────────────────────────────
  function _esc(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function _uuid() { return crypto.randomUUID(); }

  function _now() { return new Date().toISOString(); }

  function _toast(msg) {
    const el = document.getElementById('pro-toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2200);
  }

  function _$(id) { return document.getElementById(id); }

  // ── State persistence ───────────────────────────────────
  function _defaultState() {
    return {
      _seedVersion: 0,
      library: [],
      history: [],
      settings: { defaultCtx: 'general', defaultTone: 'professional', defaultLang: 'es' }
    };
  }

  function _load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      _state = raw ? JSON.parse(raw) : _defaultState();
    } catch {
      _state = _defaultState();
    }
    if (!_state.library) _state.library = [];
    if (!_state.history) _state.history = [];
    if (!_state.settings) _state.settings = { defaultCtx: 'general', defaultTone: 'professional', defaultLang: 'es' };
  }

  function _save() {
    localStorage.setItem(STORE_KEY, JSON.stringify(_state));
  }

  // ── Migration (one-time, idempotent) ────────────────────
  function _migrate() {
    // Migrate plab_h → history
    const plabRaw = localStorage.getItem('plab_h');
    if (plabRaw && _state.history.length === 0) {
      try {
        const old = JSON.parse(plabRaw);
        if (Array.isArray(old)) {
          _state.history = old.map(h => ({
            id: _uuid(),
            input: h.input || '',
            output: h.output || '',
            ctx: 'general',
            tone: 'professional',
            lang: 'es',
            createdAt: h.date || _now()
          }));
        }
      } catch { /* skip bad data */ }
      localStorage.removeItem('plab_h');
    }

    // Migrate custom_prompts → library
    const cpRaw = localStorage.getItem('custom_prompts');
    const hasMigrated = _state.library.some(p => p.source === 'migrated');
    if (cpRaw && !hasMigrated) {
      try {
        const old = JSON.parse(cpRaw);
        if (Array.isArray(old)) {
          old.forEach(c => {
            _state.library.push({
              id: _uuid(),
              title: c.title || 'Prompt importado',
              category: _mapLegacyCat(c.cat),
              tags: [],
              description: '',
              body: c.text || '',
              variables: [],
              source: 'migrated',
              favorite: false,
              usageCount: 0,
              createdAt: _now(),
              updatedAt: _now()
            });
          });
        }
      } catch { /* skip bad data */ }
      localStorage.removeItem('custom_prompts');
    }

    _save();
  }

  function _mapLegacyCat(cat) {
    const map = { SQL: 'data', Python: 'data', BI: 'data', Otro: 'custom' };
    return map[cat] || 'custom';
  }

  // ── Seed merge ──────────────────────────────────────────
  function _mergeSeed() {
    if (!_seed || !_seed.prompts) return;
    if (_state._seedVersion >= _seed.seedVersion) return;

    const existingTitles = new Set(_state.library.map(p => p.title));
    _seed.prompts.forEach(sp => {
      if (!existingTitles.has(sp.title)) {
        _state.library.push({
          ...sp,
          favorite: false,
          usageCount: 0,
          createdAt: _now(),
          updatedAt: _now()
        });
      }
    });

    _state._seedVersion = _seed.seedVersion;
    _save();
  }

  // ── Library access ──────────────────────────────────────
  function _getLibrary() {
    let items = _state.library.slice();

    // Filter by category
    if (_filter.cat !== 'all') {
      items = items.filter(p => p.category === _filter.cat);
    }

    // Filter by search
    if (_filter.search) {
      const q = _filter.search.toLowerCase();
      items = items.filter(p =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.body || '').toLowerCase().includes(q) ||
        (p.tags || []).some(t => t.toLowerCase().includes(q))
      );
    }

    // Sort
    if (_filter.sort === 'az') {
      items.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (_filter.sort === 'used') {
      items.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
    } else if (_filter.sort === 'fav') {
      items.sort((a, b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0));
    } else {
      // recent (default)
      items.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
    }

    return items;
  }

  // ── Render: Tabs ────────────────────────────────────────
  function _bindTabs() {
    document.querySelectorAll('.tab[data-p]').forEach(t => {
      t.addEventListener('click', () => {
        _activeTab = t.dataset.p;
        document.querySelectorAll('.tab').forEach(x => x.classList.remove('on'));
        document.querySelectorAll('.pnl').forEach(x => x.classList.remove('on'));
        t.classList.add('on');
        const pnl = _$('p-' + _activeTab);
        if (pnl) pnl.classList.add('on');
        _renderActiveTab();
      });
    });
  }

  function _renderActiveTab() {
    switch (_activeTab) {
      case 'lib': _renderLibrary(); break;
      case 'opt': break; // static, already wired
      case 'new': _renderCreate(); break;
      case 'guide': break; // static content
      case 'hist': _renderHistory(); break;
    }
  }

  // ── Render: Library ─────────────────────────────────────
  function _renderLibrary() {
    const items = _getLibrary();
    const el = _$('lib-list');
    if (!el) return;

    // Stats bar
    const statsEl = _$('lib-stats');
    if (statsEl) {
      const total = _state.library.length;
      const custom = _state.library.filter(p => p.source === 'custom' || p.source === 'migrated').length;
      const favs = _state.library.filter(p => p.favorite).length;
      statsEl.innerHTML = `<span class="stat"><strong>${total}</strong> prompts</span>` +
        `<span class="stat"><strong>${custom}</strong> personalizados</span>` +
        `<span class="stat"><strong>${favs}</strong> favoritos</span>`;
    }

    if (!items.length) {
      el.innerHTML = '<div class="empty"><div class="empty-icon">🔍</div>No se encontraron prompts.</div>';
      return;
    }

    el.innerHTML = items.map(p => {
      const catCls = 'cat-' + _esc(p.category);
      const catLabel = _seed?.categories?.find(c => c.key === p.category);
      const badgeText = catLabel ? catLabel.icon + ' ' + catLabel.label : p.category;
      const tags = (p.tags || []).map(t => `<span class="prompt-tag">${_esc(t)}</span>`).join('');
      const hasVars = p.variables && p.variables.length > 0;
      const isCustom = p.source === 'custom' || p.source === 'migrated';

      return `<div class="prompt-card" id="pc-${_esc(p.id)}">
  <div class="prompt-header">
    <div>
      <span class="cat-badge ${catCls}">${_esc(badgeText)}</span>
      <div class="prompt-title">${_esc(p.title)}</div>
    </div>
    <button class="fav-btn ${p.favorite ? 'on' : ''}" onclick="PRO.toggleFavorite('${_esc(p.id)}')" title="Favorito">${p.favorite ? '★' : '☆'}</button>
  </div>
  <div class="prompt-desc">${_esc(p.description)}</div>
  ${tags ? '<div class="prompt-tags">' + tags + '</div>' : ''}
  <div class="prompt-actions">
    <button class="btn bp bs" onclick="PRO.copyPrompt('${_esc(p.id)}')">📋 Copiar</button>
    <button class="btn bo bs" onclick="PRO.toggleBody('${_esc(p.id)}')">👁 Ver</button>
    ${hasVars ? `<button class="btn bo bs" onclick="PRO.toggleVars('${_esc(p.id)}')">✏️ Variables</button>` : ''}
    ${isCustom ? `<button class="btn bo bs" onclick="PRO.editPrompt('${_esc(p.id)}')">✎ Editar</button>
    <button class="btn br bs" onclick="PRO.deletePrompt('${_esc(p.id)}')">✕</button>` : ''}
  </div>
  <div class="prompt-body">${_esc(p.body)}</div>
  ${hasVars ? _renderVarsPanel(p) : ''}
</div>`;
    }).join('');
  }

  function _renderVarsPanel(p) {
    const fields = (p.variables || []).map(v =>
      `<div class="var-row">
  <label class="var-label">${_esc(v.key)}: ${_esc(v.label)}</label>
  ${v.type === 'textarea'
    ? `<textarea class="textarea" style="min-height:60px" data-var="${_esc(v.key)}" data-pid="${_esc(p.id)}" placeholder="${_esc(v.label)}"></textarea>`
    : `<input class="input" type="text" data-var="${_esc(v.key)}" data-pid="${_esc(p.id)}" placeholder="${_esc(v.label)}">`}
</div>`
    ).join('');

    return `<div class="vars-panel" id="vp-${_esc(p.id)}">
  <div class="lbl">· completa las variables ·</div>
  ${fields}
  <button class="btn bg bs" onclick="PRO.copyWithVars('${_esc(p.id)}')">📋 Copiar con variables</button>
</div>`;
  }

  // ── Render: History ─────────────────────────────────────
  function _renderHistory() {
    const el = _$('hist-list');
    if (!el) return;
    const hist = (_state.history || []).slice().reverse();

    if (!hist.length) {
      el.innerHTML = '<div class="empty"><div class="empty-icon">📜</div>Sin prompts guardados. Optimiza uno y guárdalo aquí.</div>';
      return;
    }

    el.innerHTML = hist.map(h => {
      const date = h.createdAt ? new Date(h.createdAt).toLocaleDateString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
      return `<div class="hist-item">
  <button class="hist-del" onclick="PRO.deleteHistory('${_esc(h.id)}')">✕</button>
  <div class="hist-date">${_esc(date)}</div>
  <div class="hist-input"><strong>💡</strong> ${_esc((h.input || '').substring(0, 120))}${(h.input || '').length > 120 ? '...' : ''}</div>
  <div class="hist-output" onclick="this.classList.toggle('exp')">${_esc(h.output)}</div>
  <div style="margin-top:6px;display:flex;gap:6px">
    <button class="btn bo bs" onclick="PRO.copyText('${_esc(h.id)}','hist')">📋 Copiar</button>
    <button class="btn bo bs" onclick="PRO.histToLibrary('${_esc(h.id)}')">📚 Guardar en Librería</button>
  </div>
</div>`;
    }).join('');
  }

  // ── Render: Create/Edit ─────────────────────────────────
  function _renderCreate() {
    const el = _$('create-form');
    if (!el) return;

    let p = null;
    if (_editId) {
      p = _state.library.find(x => x.id === _editId);
    }

    const title = p ? _esc(p.title) : '';
    const desc = p ? _esc(p.description) : '';
    const body = p ? _esc(p.body) : '';
    const cat = p ? p.category : 'custom';
    const tags = p ? (p.tags || []) : [];

    const catOpts = (_seed?.categories || []).map(c =>
      `<option value="${_esc(c.key)}" ${c.key === cat ? 'selected' : ''}>${c.icon} ${_esc(c.label)}</option>`
    ).join('');

    const tagChips = tags.map(t =>
      `<span class="tag-chip">${_esc(t)} <button onclick="PRO._removeTag('${_esc(t)}')">&times;</button></span>`
    ).join('');

    const sugTags = (_seed?.suggestedTags || []).filter(t => !tags.includes(t)).slice(0, 15).map(t =>
      `<span class="tag-sug" onclick="PRO._addTag('${_esc(t)}')">${_esc(t)}</span>`
    ).join('');

    el.innerHTML = `
<div class="card">
  <div class="card-t">${_editId ? '✏️ Editar prompt' : '✏️ Crear nuevo prompt'}</div>
  <div class="form-group">
    <label class="form-label">Título</label>
    <input class="input" id="cf-title" value="${title}" placeholder="Título del prompt">
  </div>
  <div class="form-group" style="display:flex;gap:10px;flex-wrap:wrap">
    <div style="flex:1;min-width:150px">
      <label class="form-label">Categoría</label>
      <select class="select" id="cf-cat" style="width:100%">${catOpts}</select>
    </div>
    <div style="flex:2;min-width:200px">
      <label class="form-label">Tags</label>
      <input class="input" id="cf-tag-input" placeholder="Escribe tag y Enter" onkeydown="if(event.key==='Enter'){event.preventDefault();PRO._addTagFromInput();}">
      <div class="tag-chips" id="cf-tags">${tagChips}</div>
      <div class="tag-suggestions">${sugTags}</div>
    </div>
  </div>
  <div class="form-group">
    <label class="form-label">Descripción breve</label>
    <input class="input" id="cf-desc" value="${desc}" placeholder="Una línea que describa el prompt">
  </div>
  <div class="form-group">
    <label class="form-label">Cuerpo del prompt</label>
    <textarea class="textarea" id="cf-body" style="min-height:160px" placeholder="Escribe el prompt completo. Usa {{VARIABLE}} para crear campos rellenables.">${body}</textarea>
  </div>
  <div style="display:flex;gap:8px;flex-wrap:wrap">
    <button class="btn bp" onclick="PRO.saveCustom()">${_editId ? '💾 Actualizar' : '💾 Guardar prompt'}</button>
    ${_editId ? '<button class="btn bo" onclick="PRO.cancelEdit()">Cancelar</button>' : ''}
    <button class="btn bo" onclick="PRO.previewCustom()">👁 Vista previa</button>
  </div>
  <div id="cf-preview" style="display:none;margin-top:12px"></div>
</div>`;
  }

  // ── Tag management for Create form ──────────────────────
  let _createTags = [];

  function _addTag(tag) {
    if (!tag || _createTags.includes(tag)) return;
    _createTags.push(tag);
    _renderCreate();
  }

  function _removeTag(tag) {
    _createTags = _createTags.filter(t => t !== tag);
    _renderCreate();
  }

  function _addTagFromInput() {
    const inp = _$('cf-tag-input');
    if (!inp) return;
    const tag = inp.value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (tag) {
      _addTag(tag);
      inp.value = '';
    }
  }

  // ── Actions ─────────────────────────────────────────────
  function toggleFavorite(id) {
    const p = _state.library.find(x => x.id === id);
    if (!p) return;
    p.favorite = !p.favorite;
    p.updatedAt = _now();
    _save();
    _renderLibrary();
  }

  function copyPrompt(id) {
    const p = _state.library.find(x => x.id === id);
    if (!p) return;
    navigator.clipboard.writeText(p.body).then(() => {
      p.usageCount = (p.usageCount || 0) + 1;
      p.updatedAt = _now();
      _save();
      _toast('📋 Prompt copiado');
    });
  }

  function copyWithVars(id) {
    const p = _state.library.find(x => x.id === id);
    if (!p) return;
    let text = p.body;
    const inputs = document.querySelectorAll(`[data-pid="${id}"]`);
    inputs.forEach(inp => {
      const key = inp.dataset.var;
      const val = inp.value.trim();
      if (val) text = text.split(key).join(val);
    });
    navigator.clipboard.writeText(text).then(() => {
      p.usageCount = (p.usageCount || 0) + 1;
      p.updatedAt = _now();
      _save();
      _toast('📋 Prompt copiado con variables');
    });
  }

  function copyText(id, type) {
    let text = '';
    if (type === 'hist') {
      const h = _state.history.find(x => x.id === id);
      if (h) text = h.output;
    }
    if (text) navigator.clipboard.writeText(text).then(() => _toast('📋 Copiado'));
  }

  function toggleBody(id) {
    const card = _$('pc-' + id);
    if (card) card.classList.toggle('open');
  }

  function toggleVars(id) {
    const vp = _$('vp-' + id);
    if (vp) vp.classList.toggle('on');
  }

  function deletePrompt(id) {
    if (!confirm('¿Eliminar este prompt?')) return;
    _state.library = _state.library.filter(p => p.id !== id);
    _save();
    _renderLibrary();
    _toast('Prompt eliminado');
  }

  function editPrompt(id) {
    const p = _state.library.find(x => x.id === id);
    if (!p) return;
    _editId = id;
    _createTags = (p.tags || []).slice();
    // Switch to Create tab
    _activeTab = 'new';
    document.querySelectorAll('.tab').forEach(x => x.classList.remove('on'));
    document.querySelectorAll('.pnl').forEach(x => x.classList.remove('on'));
    const tab = document.querySelector('.tab[data-p="new"]');
    if (tab) tab.classList.add('on');
    const pnl = _$('p-new');
    if (pnl) pnl.classList.add('on');
    _renderCreate();
  }

  function cancelEdit() {
    _editId = null;
    _createTags = [];
    _renderCreate();
  }

  function saveCustom() {
    const title = (_$('cf-title')?.value || '').trim();
    const cat = _$('cf-cat')?.value || 'custom';
    const desc = (_$('cf-desc')?.value || '').trim();
    const body = (_$('cf-body')?.value || '').trim();

    if (!title || !body) { _toast('⚠️ Título y cuerpo son obligatorios'); return; }

    // Auto-detect variables from body
    const varMatches = body.match(/\{\{[A-Z_]+\}\}/g) || [];
    const uniqueVars = [...new Set(varMatches)];
    const variables = uniqueVars.map(v => ({
      key: v, label: v.replace(/\{\{|\}\}/g, '').toLowerCase().replace(/_/g, ' '), type: 'text'
    }));

    if (_editId) {
      // Update existing
      const p = _state.library.find(x => x.id === _editId);
      if (p) {
        p.title = title;
        p.category = cat;
        p.tags = _createTags.slice();
        p.description = desc;
        p.body = body;
        p.variables = variables;
        p.updatedAt = _now();
      }
      _editId = null;
      _toast('✅ Prompt actualizado');
    } else {
      // Create new
      _state.library.push({
        id: _uuid(),
        title, category: cat, tags: _createTags.slice(),
        description: desc, body, variables,
        source: 'custom', favorite: false, usageCount: 0,
        createdAt: _now(), updatedAt: _now()
      });
      _toast('✅ Prompt creado');
    }

    _createTags = [];
    _save();
    _renderCreate();
  }

  function previewCustom() {
    const body = (_$('cf-body')?.value || '').trim();
    const prev = _$('cf-preview');
    if (!prev) return;
    if (!body) { prev.style.display = 'none'; return; }
    prev.style.display = 'block';
    prev.innerHTML = `<div class="result">${_esc(body)}</div>`;
  }

  // ── Optimizer ───────────────────────────────────────────
  function optimize() {
    const idea = (_$('rawIdea')?.value || '').trim();
    if (!idea) { _toast('⚠️ Escribe tu idea primero'); return; }

    const ctx = _$('pCtx')?.value || 'general';
    const tone = _$('pTone')?.value || 'professional';
    const lang = _$('pLang')?.value || 'es';

    const roles = _seed?.optimizer?.roles || {};
    const tones = _seed?.optimizer?.tones || {};
    const formats = _seed?.optimizer?.formats || {};

    const role = roles[ctx]?.[lang] || roles.general?.[lang] || 'an expert assistant';
    const toneText = tones[tone]?.[lang] || '';
    const formatText = formats[ctx]?.[lang] || formats.general?.[lang] || '';

    const words = idea.split(/\s+/);
    const isLong = words.length > 30;

    let prompt = '';
    if (lang === 'es') {
      prompt = `Actúa como ${role}.

<contexto>
${idea}
</contexto>

<tarea>
${_extractTask(idea, lang)}
</tarea>

<formato>
${formatText}
${toneText}
</formato>

<restricciones>
- No incluyas introducciones genéricas ni despedidas
- No repitas información que ya proporcioné en el contexto
- Prioriza información accionable sobre teoría
- Si no tienes suficiente información, pregunta antes de asumir${isLong ? '' : '\n- Máximo 300 palabras'}
</restricciones>`;
    } else {
      prompt = `Act as ${role}.

<context>
${idea}
</context>

<task>
${_extractTask(idea, lang)}
</task>

<format>
${formatText}
${toneText}
</format>

<constraints>
- Do not include generic introductions or goodbyes
- Do not repeat information already in the context
- Prioritize actionable information over theory
- If you lack information, ask before assuming${isLong ? '' : '\n- Maximum 300 words'}
</constraints>`;
    }

    // Display result
    const resultDiv = _$('optResult');
    const output = _$('optOutput');
    if (!resultDiv || !output) return;
    resultDiv.style.display = 'block';

    const highlighted = _esc(prompt)
      .replace(/&lt;(\/?)(contexto|context|tarea|task|formato|format|restricciones|constraints|ejemplo|example)&gt;/g,
        '<span class="tag">&lt;$1$2&gt;</span>')
      .replace(/^(Actúa como|Act as)(.+)$/m, '<span class="role">$1$2</span>');

    output.innerHTML = highlighted;
    output.dataset.raw = prompt;
    output.dataset.input = idea;
    output.dataset.ctx = ctx;
    output.dataset.tone = tone;
    output.dataset.lang = lang;

    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function _extractTask(idea, lang) {
    const hasData = /datos|data|dataset|csv|tabla|table|excel/i.test(idea);
    const hasCode = /código|code|sql|python|script|query|función|function/i.test(idea);
    const hasBiz = /negocio|business|empresa|company|estrategia|strategy|ventas|sales|cliente|customer/i.test(idea);
    const hasQ = idea.includes('?');

    if (lang === 'es') {
      let t = 'Basándote en el contexto proporcionado, necesito que:\n';
      if (hasData) t += '1. Analices los datos mencionados e identifiques patrones clave\n2. Proporciones insights accionables con evidencia\n3. Recomiendes acciones concretas con impacto estimado';
      else if (hasCode) t += '1. Generes código limpio, funcional y bien comentado\n2. Incluyas manejo de errores donde sea necesario\n3. Agregues un ejemplo de uso al final';
      else if (hasBiz) t += '1. Analices la situación desde perspectiva de negocio\n2. Identifiques oportunidades y riesgos principales\n3. Propongas un plan de acción con timeline y métricas';
      else if (hasQ) t += '1. Respondas de forma directa y precisa\n2. Proporciones contexto necesario para entender la respuesta\n3. Incluyas ejemplos prácticos si es relevante';
      else t += '1. Abordes lo solicitado de forma directa y estructurada\n2. Proporciones valor concreto y accionable\n3. Incluyas ejemplos o pasos claros cuando sea útil';
      return t;
    } else {
      let t = 'Based on the context provided, I need you to:\n';
      if (hasData) t += '1. Analyze the mentioned data and identify key patterns\n2. Provide actionable insights with evidence\n3. Recommend concrete actions with estimated impact';
      else if (hasCode) t += '1. Generate clean, functional, well-commented code\n2. Include error handling where necessary\n3. Add a usage example at the end';
      else if (hasBiz) t += '1. Analyze the situation from a business perspective\n2. Identify main opportunities and risks\n3. Propose an action plan with timeline and metrics';
      else if (hasQ) t += '1. Answer directly and precisely\n2. Provide necessary context to understand the answer\n3. Include practical examples if relevant';
      else t += '1. Address the request directly and structurally\n2. Provide concrete, actionable value\n3. Include examples or clear steps when useful';
      return t;
    }
  }

  function copyOpt() {
    const raw = _$('optOutput')?.dataset.raw;
    if (raw) navigator.clipboard.writeText(raw).then(() => _toast('📋 Prompt copiado'));
  }

  function saveToHistory() {
    const o = _$('optOutput');
    if (!o?.dataset.raw) return;
    _state.history.push({
      id: _uuid(),
      input: o.dataset.input || '',
      output: o.dataset.raw || '',
      ctx: o.dataset.ctx || 'general',
      tone: o.dataset.tone || 'professional',
      lang: o.dataset.lang || 'es',
      createdAt: _now()
    });
    _save();
    _toast('💾 Guardado en historial');
  }

  function saveOptToLibrary() {
    const o = _$('optOutput');
    if (!o?.dataset.raw) return;
    const input = o.dataset.input || '';
    _state.library.push({
      id: _uuid(),
      title: input.substring(0, 60) + (input.length > 60 ? '...' : ''),
      category: _mapOptCtx(o.dataset.ctx),
      tags: [],
      description: 'Generado por el optimizador',
      body: o.dataset.raw,
      variables: [],
      source: 'custom',
      favorite: false,
      usageCount: 0,
      createdAt: _now(),
      updatedAt: _now()
    });
    _save();
    _toast('📚 Guardado en librería');
  }

  function _mapOptCtx(ctx) {
    const map = { data: 'data', code: 'code', business: 'career', writing: 'writing', learning: 'learning', career: 'career' };
    return map[ctx] || 'custom';
  }

  function deleteHistory(id) {
    _state.history = _state.history.filter(h => h.id !== id);
    _save();
    _renderHistory();
    _toast('Eliminado');
  }

  function clearHistory() {
    if (!confirm('¿Borrar todo el historial?')) return;
    _state.history = [];
    _save();
    _renderHistory();
    _toast('Historial borrado');
  }

  function histToLibrary(id) {
    const h = _state.history.find(x => x.id === id);
    if (!h) return;
    _state.library.push({
      id: _uuid(),
      title: (h.input || '').substring(0, 60) + ((h.input || '').length > 60 ? '...' : ''),
      category: _mapOptCtx(h.ctx),
      tags: [],
      description: 'Importado del historial',
      body: h.output || '',
      variables: [],
      source: 'custom',
      favorite: false,
      usageCount: 0,
      createdAt: _now(),
      updatedAt: _now()
    });
    _save();
    _toast('📚 Guardado en librería');
  }

  // ── Search & Filter ─────────────────────────────────────
  function _bindSearch() {
    const searchInput = _$('lib-search');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        _filter.search = searchInput.value;
        _renderLibrary();
      });
    }
    const sortSelect = _$('lib-sort');
    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        _filter.sort = sortSelect.value;
        _renderLibrary();
      });
    }
  }

  function _bindCatFilters() {
    const container = _$('cat-filters');
    if (!container) return;

    const cats = [{ key: 'all', label: 'Todos', icon: '' }].concat(_seed?.categories || []);
    container.innerHTML = cats.map(c =>
      `<button class="cat-btn ${c.key === _filter.cat ? 'on' : ''}" data-cat="${_esc(c.key)}">${c.icon ? c.icon + ' ' : ''}${_esc(c.label)}</button>`
    ).join('');

    container.querySelectorAll('.cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        _filter.cat = btn.dataset.cat;
        container.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('on'));
        btn.classList.add('on');
        _renderLibrary();
      });
    });
  }

  // ── Cloud sync listener ─────────────────────────────────
  function _bindSync() {
    window.addEventListener('cloud:sync_complete', () => {
      _load();
      renderAll();
    });
  }

  // ── Public API ──────────────────────────────────────────
  function renderAll() {
    _renderLibrary();
    _renderHistory();
  }

  async function init() {
    // Load seed data
    try {
      const r = await fetch('data/prompts-data.json');
      _seed = await r.json();
    } catch (e) {
      console.warn('PRO: could not load seed data', e);
      _seed = { categories: [], suggestedTags: [], prompts: [], optimizer: {} };
    }

    // Load state
    _load();

    // Run migrations
    _migrate();

    // Merge seed prompts
    _mergeSeed();

    // Bind UI
    _bindTabs();
    _bindSearch();
    _bindCatFilters();
    _bindSync();

    // Initial render
    _renderLibrary();
    _renderHistory();
  }

  return {
    init,
    renderAll,
    // Library
    toggleFavorite,
    copyPrompt,
    copyWithVars,
    toggleBody,
    toggleVars,
    // Custom CRUD
    editPrompt,
    cancelEdit,
    saveCustom,
    previewCustom,
    deletePrompt,
    // Optimizer
    optimize,
    copyOpt,
    saveToHistory,
    saveOptToLibrary,
    // History
    deleteHistory,
    clearHistory,
    histToLibrary,
    copyText,
    // Tag helpers (exposed for onclick)
    _addTag: _addTag,
    _removeTag: _removeTag,
    _addTagFromInput: _addTagFromInput
  };
})();

// Boot
document.addEventListener('DOMContentLoaded', () => PRO.init());
