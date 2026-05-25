// ══════════════════════════════════════════════════════════════
// ENG_IMPORT · F4 · Importador desde Notas (13-NOT) + Texto Pegado
// Web Clipper-style: extrae vocab/phrases/tips desde cuadernos del
// 13-NOT (English/Platzi) o texto raw pegado, y los empuja a:
//   - eng_srs_deck (vocab → flashcards box 1)
//   - eng_notes    (phrases con stamp:'phrase', source:'import')
// Storage: localStorage 'eng_imported_lessons' (synced via cloud-sync.js)
// Exposes: window.ENG_IMPORT { scan, extract, importItems, log, openTab }
// ══════════════════════════════════════════════════════════════
const ENG_IMPORT = (function(){
  'use strict';

  const LOG_KEY = 'eng_imported_lessons';
  const SRS_KEY = 'eng_srs_deck';
  const NOTES_KEY = 'eng_notes';

  // Detectores de relevancia para auto-scan
  const ENG_KEYWORDS = /english|inglés|ingles|platzi|practical|conversational|grammar|vocab/i;

  // ── Helpers ────────────────────────────
  function _by(id){ return document.getElementById(id); }
  function _esc(s){
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function _escAttr(s){
    return String(s||'').replace(/'/g,"\\'").replace(/"/g,'&quot;');
  }
  function _stripHTML(html, keepBold){
    if(!html) return '';
    let s = String(html);
    if(keepBold){
      // Preserve <b> and <strong> as markers · convert everything else
      s = s.replace(/<\s*(b|strong)\s*>/gi, '⟦b⟧').replace(/<\s*\/\s*(b|strong)\s*>/gi, '⟦/b⟧');
      s = s.replace(/<[^>]+>/g, ' ');
      s = s.replace(/⟦b⟧/g, '<b>').replace(/⟦\/b⟧/g, '</b>');
    } else {
      s = s.replace(/<[^>]+>/g, ' ');
    }
    s = s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
    return s.replace(/[ \t]+/g, ' ').trim();
  }
  function _readJSON(key, fallback){
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch(e){ return fallback; }
  }
  function _writeJSON(key, val){
    try { localStorage.setItem(key, JSON.stringify(val)); } catch(e){}
  }

  // ── Parser de contenido ────────────────
  // Devuelve { vocab:[{en,es}], phrases:[{text}], tips:[{text}] }
  function extract(rawText){
    if(!rawText) return { vocab:[], phrases:[], tips:[] };

    const stripped = _stripHTML(rawText, true);
    const lines = stripped.split(/[\r\n]+/).map(l => l.trim()).filter(Boolean);

    const items = { vocab:[], phrases:[], tips:[] };
    const seenVocab = new Set();
    const seenPhrase = new Set();

    for(const rawLine of lines){
      // Normalize · keep <b>...</b> markers but strip for tests
      const line = rawLine.replace(/\s+/g, ' ').trim();
      if(!line || line.length < 3) continue;

      // 1. TIP detection (prefix: "tip:", "regla:", "rule:", "nota:", "note:")
      const tipM = line.match(/^(tip|regla|rule|nota|note|💡|⚠️)\s*[:\-—]\s*(.+)$/i);
      if(tipM){
        const t = tipM[2].trim();
        if(t.length > 5 && t.length < 280){
          items.tips.push({ text: t });
          continue;
        }
      }

      // 2. VOCAB pair detection · "word — definition" with multiple separators
      // Permitir <b> wrapping
      const pairM = line.match(/^(?:<b>)?([A-Za-z][A-Za-z\s'\-/]{1,40}?)(?:<\/b>)?\s*(?:—|–|−|→|=|:|\s-\s|\s\/\s)\s*(.{2,140})$/);
      if(pairM){
        const en = pairM[1].replace(/<\/?b>/g,'').trim();
        const es = pairM[2].replace(/<\/?b>/g,'').trim();
        // Heurística anti-falsos-positivos: en debe ser principalmente alfabético + ES no debe parecer URL
        if(en && es && /^[A-Za-z][A-Za-z\s'\-/]+$/.test(en) && !/https?:|www\.|\/\//.test(es) && en.length <= 40){
          const k = en.toLowerCase();
          if(!seenVocab.has(k)){
            seenVocab.add(k);
            items.vocab.push({ en, es });
          }
          continue;
        }
      }

      // 3. PHRASE between quotes — extrae todas las frases entrecomilladas
      const quoteRe = /"([^"]{5,140})"|'([^']{5,140})'/g;
      let qm, foundQuote = false;
      while((qm = quoteRe.exec(line)) !== null){
        const t = (qm[1] || qm[2]).trim();
        if(t && /[A-Za-z]/.test(t) && t.split(' ').length >= 2){
          const k = t.toLowerCase();
          if(!seenPhrase.has(k)){
            seenPhrase.add(k);
            items.phrases.push({ text: t });
            foundQuote = true;
          }
        }
      }
      if(foundQuote) continue;

      // 4. PHRASE marked with <b>...</b> bold spans (frase con énfasis)
      const boldRe = /<b>([^<]{5,140})<\/b>/g;
      let bm, foundBold = false;
      while((bm = boldRe.exec(line)) !== null){
        const t = bm[1].trim();
        if(t && /[A-Za-z]/.test(t) && t.split(' ').length >= 2 && t.split(' ').length <= 18){
          const k = t.toLowerCase();
          if(!seenPhrase.has(k)){
            seenPhrase.add(k);
            items.phrases.push({ text: t });
            foundBold = true;
          }
        }
      }
      if(foundBold) continue;

      // 5. Line as sentence (heurística suave · solo si parece oración inglesa)
      // Empieza con mayúscula, termina en .!?, tiene 3-18 palabras, mayoría ASCII
      if(/^[A-Z][a-zA-Z0-9\s,'"\-]+[.!?]$/.test(line)){
        const words = line.split(/\s+/).length;
        if(words >= 3 && words <= 18){
          const clean = line.replace(/<\/?b>/g, '').trim();
          const k = clean.toLowerCase();
          if(!seenPhrase.has(k)){
            seenPhrase.add(k);
            items.phrases.push({ text: clean });
          }
        }
      }
    }

    return items;
  }

  // ── Scan de fuentes ───────────────────
  // Devuelve [{ id, kind:'notebook'|'page'|'note', name, preview, raw }]
  function scan(){
    const found = [];

    // 1. Cuadernos del 13-NOT
    const nbMeta = _readJSON('not_nb_meta', []);
    const nbData = _readJSON('not_nb_data', {});

    if(Array.isArray(nbMeta)){
      nbMeta.forEach(nb => {
        if(!nb || !nb.id) return;
        const name = nb.name || '';
        const isEnglish = ENG_KEYWORDS.test(name);
        const pages = (nbData[nb.id] && nbData[nb.id].pages) ? nbData[nb.id].pages : [];

        if(isEnglish){
          // Todo el cuaderno como fuente
          const concatBody = pages.map(p => `${p.title||''}\n${p.body||''}`).join('\n\n');
          found.push({
            id: 'nb:' + nb.id,
            kind: 'notebook',
            icon: nb.icon || '📓',
            name: name,
            pageCount: pages.length,
            preview: _stripHTML(concatBody, false).substring(0, 220),
            raw: concatBody,
            sourceLabel: `Cuaderno · ${pages.length} página${pages.length===1?'':'s'}`
          });
        } else {
          // Buscar páginas individuales que matcheen keywords
          pages.forEach(p => {
            const pTitle = p.title || '';
            const pBody = p.body || '';
            if(ENG_KEYWORDS.test(pTitle) || ENG_KEYWORDS.test(_stripHTML(pBody, false).substring(0, 500))){
              found.push({
                id: 'pg:' + nb.id + ':' + (p.id||''),
                kind: 'page',
                icon: '📄',
                name: pTitle || '(sin título)',
                pageCount: 1,
                preview: _stripHTML(pBody, false).substring(0, 220),
                raw: `${pTitle}\n${pBody}`,
                sourceLabel: `Página de "${name||'cuaderno'}"`
              });
            }
          });
        }
      });
    }

    // 2. Notas flat sb_notes2
    const flatNotes = _readJSON('sb_notes2', []);
    if(Array.isArray(flatNotes)){
      const buckets = {};
      flatNotes.forEach(n => {
        if(!n) return;
        const body = (n.body || n.text || '') + ' ' + (n.title || '');
        const tags = Array.isArray(n.tags) ? n.tags.join(' ') : '';
        const matches = ENG_KEYWORDS.test(body) || ENG_KEYWORDS.test(tags) || ENG_KEYWORDS.test(n.title||'');
        if(matches){
          const bucket = tags.match(ENG_KEYWORDS) ? 'tagged' : 'content';
          if(!buckets[bucket]) buckets[bucket] = [];
          buckets[bucket].push(n);
        }
      });
      Object.keys(buckets).forEach(b => {
        const arr = buckets[b];
        const concat = arr.map(n => `${n.title||''}\n${n.body||n.text||''}`).join('\n\n');
        found.push({
          id: 'notes:' + b,
          kind: 'note',
          icon: '🗒️',
          name: b === 'tagged' ? 'Notas con tag English/Platzi' : 'Notas con contenido EN',
          pageCount: arr.length,
          preview: _stripHTML(concat, false).substring(0, 220),
          raw: concat,
          sourceLabel: `${arr.length} nota${arr.length===1?'':'s'} sueltas`
        });
      });
    }

    return found;
  }

  // ── Importación ───────────────────────
  function importItems(items, source){
    const results = { vocab:0, phrases:0, tips:0 };

    // Vocab → SRS deck (box 1)
    if(items.vocab && items.vocab.length){
      const deck = _readJSON(SRS_KEY, []);
      items.vocab.forEach(v => {
        deck.push({
          id: 'imp-' + Date.now() + '-' + Math.random().toString(36).substring(2,7),
          front: v.en,
          back: v.es,
          box: 1,
          due: Date.now(),
          source: 'import',
          importedFrom: source || 'paste',
          imported: Date.now()
        });
        results.vocab++;
      });
      _writeJSON(SRS_KEY, deck);
    }

    // Phrases → eng_notes
    if(items.phrases && items.phrases.length){
      const notes = _readJSON(NOTES_KEY, []);
      const today = new Date().toLocaleDateString('es', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' });
      items.phrases.forEach(p => {
        notes.push({
          text: p.text,
          stamp: 'phrase',
          date: today,
          source: 'import',
          importedFrom: source || 'paste'
        });
        results.phrases++;
      });
      _writeJSON(NOTES_KEY, notes);
    }

    // Tips → eng_notes con stamp:'idea'
    if(items.tips && items.tips.length){
      const notes = _readJSON(NOTES_KEY, []);
      const today = new Date().toLocaleDateString('es', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' });
      items.tips.forEach(t => {
        notes.push({
          text: t.text,
          stamp: 'idea',
          date: today,
          source: 'import',
          importedFrom: source || 'paste'
        });
        results.tips++;
      });
      _writeJSON(NOTES_KEY, notes);
    }

    // Log
    const log = _readJSON(LOG_KEY, []);
    log.push({
      id: 'log-' + Date.now(),
      ts: Date.now(),
      date: new Date().toLocaleString('es', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }),
      source: source || 'paste',
      results
    });
    // Cap a 50 entradas
    if(log.length > 50) log.splice(0, log.length - 50);
    _writeJSON(LOG_KEY, log);

    return results;
  }

  function log(){
    return _readJSON(LOG_KEY, []);
  }

  // ── UI ────────────────────────────────
  function _renderTab(){
    const host = _by('p-import');
    if(!host) return;

    const sources = scan();
    const history = log().slice().reverse().slice(0, 5);

    host.innerHTML = `
      <div class="sl">· importar desde notas o texto · F4 ·</div>
      <div class="sd">Extrae vocab, frases y tips desde tu cuaderno English del 13-NOT, desde notas con tag/contenido inglés, o pegando texto raw de Platzi/cualquier fuente.</div>

      <div class="tipbox">
        <b>💡 Cómo funciona</b>
        <p>El parser detecta patrones <strong>palabra — definición</strong> (vocab), frases entre comillas o en <b>negrita</b> (phrases), y líneas que empiezan con <strong>tip:</strong>/<strong>regla:</strong> (tips). Vocab va a tu <strong>SRS deck</strong>, frases y tips a <strong>My Notes</strong>.</p>
      </div>

      <!-- A · Fuentes detectadas -->
      <div class="imp-section">
        <div class="imp-sec-h">
          <span class="imp-sec-icon">🔍</span>
          <div>
            <div class="imp-sec-title">Fuentes detectadas en 13-NOT</div>
            <div class="imp-sec-sub">${sources.length} fuente${sources.length===1?'':'s'} con contenido en inglés · auto-scan de cuadernos y notas</div>
          </div>
          <button class="btn bo bs" id="impRescan">↻ Re-escanear</button>
        </div>
        <div id="impSources">
          ${sources.length ? sources.map(s => _sourceCardHTML(s)).join('') : '<div class="imp-empty">No se detectaron cuadernos ni notas con contenido en inglés. Crea un cuaderno llamado "English" en 13-NOT o pega texto abajo.</div>'}
        </div>
      </div>

      <!-- B · Paste -->
      <div class="imp-section">
        <div class="imp-sec-h">
          <span class="imp-sec-icon">📋</span>
          <div>
            <div class="imp-sec-title">Pegar contenido</div>
            <div class="imp-sec-sub">Pega texto de Platzi, PDFs, transcripts, o cualquier fuente con contenido en inglés</div>
          </div>
        </div>
        <textarea class="imp-paste" id="impPaste" placeholder="Pega aquí. Ejemplos de patrones que detecto:&#10;&#10;accomplish — lograr&#10;deadline: fecha límite&#10;&#10;tip: usa present perfect cuando la fecha no es específica&#10;&#10;&quot;I have worked here for 3 years&quot;&#10;&#10;She has led multiple projects."></textarea>
        <div class="imp-paste-actions">
          <button class="btn bp" id="impScanPaste">🔎 Analizar texto</button>
          <button class="btn bo" id="impClearPaste">Limpiar</button>
          <span id="impPasteStats" class="imp-stats"></span>
        </div>
      </div>

      <!-- C · Historial -->
      <div class="imp-section">
        <div class="imp-sec-h">
          <span class="imp-sec-icon">📜</span>
          <div>
            <div class="imp-sec-title">Historial de importaciones</div>
            <div class="imp-sec-sub">Últimas 5 importaciones</div>
          </div>
        </div>
        <div id="impHistory">
          ${history.length ? history.map(h => `
            <div class="imp-hist">
              <div class="imp-hist-date">${_esc(h.date)}</div>
              <div class="imp-hist-source">${_esc(h.source)}</div>
              <div class="imp-hist-stats">
                ${h.results.vocab ? `<span class="imp-hist-pill imp-p-vocab">${h.results.vocab} vocab</span>` : ''}
                ${h.results.phrases ? `<span class="imp-hist-pill imp-p-phrase">${h.results.phrases} frases</span>` : ''}
                ${h.results.tips ? `<span class="imp-hist-pill imp-p-tip">${h.results.tips} tips</span>` : ''}
              </div>
            </div>`).join('') : '<div class="imp-empty">Sin importaciones aún. Importa una fuente o pega contenido para empezar.</div>'}
        </div>
      </div>

      <div id="impPreviewModal" class="imp-modal-host"></div>
    `;

    _wireEvents();
  }

  function _sourceCardHTML(s){
    return `
      <div class="imp-source" data-src-id="${_escAttr(s.id)}">
        <div class="imp-src-head">
          <span class="imp-src-icon">${s.icon || '📓'}</span>
          <div class="imp-src-info">
            <div class="imp-src-name">${_esc(s.name)}</div>
            <div class="imp-src-meta">${_esc(s.sourceLabel)}</div>
          </div>
          <button class="btn bp bs" data-imp-src="${_escAttr(s.id)}">Importar →</button>
        </div>
        <div class="imp-src-preview">${_esc(s.preview)}${s.preview.length>=220?'…':''}</div>
      </div>`;
  }

  function _wireEvents(){
    const rescanBtn = _by('impRescan');
    if(rescanBtn) rescanBtn.addEventListener('click', _renderTab);

    document.querySelectorAll('[data-imp-src]').forEach(btn => {
      btn.addEventListener('click', () => {
        const srcId = btn.dataset.impSrc;
        const sources = scan();
        const src = sources.find(s => s.id === srcId);
        if(!src){ alert('Fuente no encontrada · re-escanea'); return; }
        _showPreviewModal(src.raw, src.name);
      });
    });

    const scanBtn = _by('impScanPaste');
    if(scanBtn) scanBtn.addEventListener('click', () => {
      const txt = (_by('impPaste').value || '').trim();
      if(!txt){ alert('Pega contenido primero'); return; }
      _showPreviewModal(txt, 'Texto pegado');
    });

    const clearBtn = _by('impClearPaste');
    if(clearBtn) clearBtn.addEventListener('click', () => {
      _by('impPaste').value = '';
      _by('impPasteStats').textContent = '';
    });

    // Live stats on paste
    const paste = _by('impPaste');
    if(paste){
      paste.addEventListener('input', () => {
        const txt = paste.value || '';
        const words = txt.trim().split(/\s+/).filter(Boolean).length;
        _by('impPasteStats').textContent = txt ? `${words} palabras · ${txt.length} caracteres` : '';
      });
    }
  }

  function _showPreviewModal(rawText, sourceName){
    const items = extract(rawText);
    const totalCount = items.vocab.length + items.phrases.length + items.tips.length;

    if(totalCount === 0){
      alert('No se detectaron items importables. Verifica que el contenido tenga patrones como "word — definición" o frases entre comillas.');
      return;
    }

    const host = _by('impPreviewModal');
    if(!host) return;

    const itemRow = (it, idx, type, label) => `
      <div class="imp-item" data-type="${type}" data-idx="${idx}">
        <label class="imp-item-l">
          <input type="checkbox" class="imp-item-chk" checked data-type="${type}" data-idx="${idx}">
          <span class="imp-item-tag imp-item-${type}">${label}</span>
          <div class="imp-item-content">
            ${type==='vocab' ? `<span class="imp-item-en">${_esc(it.en)}</span><span class="imp-item-sep">—</span><span class="imp-item-es">${_esc(it.es)}</span>` : `<span class="imp-item-txt">${_esc(it.text)}</span>`}
          </div>
        </label>
      </div>`;

    host.innerHTML = `
      <div class="imp-modal-bg" id="impMBg"></div>
      <div class="imp-modal" role="dialog">
        <div class="imp-modal-head">
          <div>
            <div class="imp-modal-title">Revisar importación</div>
            <div class="imp-modal-sub">Desde: <strong>${_esc(sourceName)}</strong> · ${totalCount} items detectados</div>
          </div>
          <button class="tl-close" id="impMClose" aria-label="Cerrar">✕</button>
        </div>
        <div class="imp-modal-body">

          <div class="imp-modal-summary">
            <span class="imp-sum imp-sum-vocab">🔤 <b>${items.vocab.length}</b> vocab</span>
            <span class="imp-sum imp-sum-phrase">💬 <b>${items.phrases.length}</b> frases</span>
            <span class="imp-sum imp-sum-tip">💡 <b>${items.tips.length}</b> tips</span>
          </div>

          <div class="imp-toolbar">
            <button class="btn bo bs" id="impSelAll">✓ Seleccionar todo</button>
            <button class="btn bo bs" id="impSelNone">○ Ninguno</button>
            <span class="imp-help">Desmarca los items que no quieras importar.</span>
          </div>

          ${items.vocab.length ? `<div class="imp-cat-h">🔤 Vocab → SRS deck (box 1)</div>${items.vocab.map((v,i) => itemRow(v,i,'vocab','VOCAB')).join('')}` : ''}
          ${items.phrases.length ? `<div class="imp-cat-h">💬 Phrases → My Notes</div>${items.phrases.map((p,i) => itemRow(p,i,'phrase','PHRASE')).join('')}` : ''}
          ${items.tips.length ? `<div class="imp-cat-h">💡 Tips → My Notes</div>${items.tips.map((t,i) => itemRow(t,i,'tip','TIP')).join('')}` : ''}
        </div>
        <div class="imp-modal-foot">
          <button class="btn bo" id="impMCancel">Cancelar</button>
          <button class="btn bp" id="impMConfirm">⚡ Importar seleccionados</button>
        </div>
      </div>`;
    host.classList.add('on');

    _by('impMClose').addEventListener('click', _closeModal);
    _by('impMBg').addEventListener('click', _closeModal);
    _by('impMCancel').addEventListener('click', _closeModal);

    _by('impSelAll').addEventListener('click', () => {
      host.querySelectorAll('.imp-item-chk').forEach(c => { c.checked = true; });
    });
    _by('impSelNone').addEventListener('click', () => {
      host.querySelectorAll('.imp-item-chk').forEach(c => { c.checked = false; });
    });

    _by('impMConfirm').addEventListener('click', () => {
      // Build filtered items
      const filtered = { vocab:[], phrases:[], tips:[] };
      host.querySelectorAll('.imp-item-chk').forEach(c => {
        if(!c.checked) return;
        const type = c.dataset.type;
        const idx = parseInt(c.dataset.idx, 10);
        if(type === 'vocab') filtered.vocab.push(items.vocab[idx]);
        else if(type === 'phrase') filtered.phrases.push(items.phrases[idx]);
        else if(type === 'tip') filtered.tips.push(items.tips[idx]);
      });
      const total = filtered.vocab.length + filtered.phrases.length + filtered.tips.length;
      if(total === 0){
        alert('Seleccionar al menos un item');
        return;
      }
      const results = importItems(filtered, sourceName);
      _closeModal();
      _renderTab();
      const msg = [
        results.vocab ? `${results.vocab} vocab → SRS deck` : null,
        results.phrases ? `${results.phrases} frases → Notes` : null,
        results.tips ? `${results.tips} tips → Notes` : null
      ].filter(Boolean).join(' · ');
      _toast('✓ Importado: ' + msg);
    });
  }

  function _closeModal(){
    const host = _by('impPreviewModal');
    if(!host) return;
    host.classList.remove('on');
    host.innerHTML = '';
  }

  function _toast(msg){
    let t = document.getElementById('impToast');
    if(!t){
      t = document.createElement('div');
      t.id = 'impToast';
      t.className = 'imp-toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('on');
    setTimeout(() => t.classList.remove('on'), 3200);
  }

  function openTab(){
    const tab = document.querySelector('[data-p="import"]');
    if(!tab) return;
    document.querySelectorAll('.tab').forEach(x => x.classList.remove('on'));
    document.querySelectorAll('.pnl').forEach(x => x.classList.remove('on'));
    tab.classList.add('on');
    _by('p-import').classList.add('on');
    _renderTab();
  }

  // ── Init ──────────────────────────────
  function init(){
    // Re-render cuando la tab se activa (datos de 13-NOT pueden haber cambiado)
    const tab = document.querySelector('[data-p="import"]');
    if(tab){
      tab.addEventListener('click', () => setTimeout(_renderTab, 50));
    }
    _renderTab();

    // Re-render tras sync
    window.addEventListener('cloud:sync_complete', () => {
      if(_by('p-import') && _by('p-import').classList.contains('on')) _renderTab();
    });

    // ESC cierra modal
    document.addEventListener('keydown', e => {
      if(e.key === 'Escape') _closeModal();
    });
  }

  return { init, scan, extract, importItems, log, openTab };
})();

window.ENG_IMPORT = ENG_IMPORT;
document.addEventListener('DOMContentLoaded', () => {
  if(window.ENG_IMPORT && typeof ENG_IMPORT.init === 'function') ENG_IMPORT.init();
});
