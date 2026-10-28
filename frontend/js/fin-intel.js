/* ═══════════════════════════════════════════════════════════════
   DA-2026 · 12-FIN · Inteligencia (Fase 4)
   ─────────────────────────────────────────────────────────────
   Directorio curado de fuentes + puente a 13-NOT.

   El directorio vive en data/fin-sources.json — editable sin tocar
   código. Cada URL se comprobó con una petición real el 2026-08-12;
   las que devuelven bloqueo anti-bot van marcadas como tales en vez
   de presentarse como verificadas.

   Cada fuente responde dos preguntas que un listado de enlaces nunca
   contesta: QUÉ es y CUÁNDO te sirve. Sin eso es un montón de links.

   El puente a 13-NOT escribe en `sb_notes2` con la forma real que usa
   notes-brain.js ({id, type, title, body, tags, date}), no una
   inventada — verificado leyendo el módulo antes de escribir.
═══════════════════════════════════════════════════════════════ */

const FININTEL = (() => {

  const SRC = 'data/fin-sources.json';
  const NOTES_KEY = 'sb_notes2';

  let _data = null, _loading = false, _filtro = '';

  const esc = s => String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const safeUrl = u => /^https?:\/\//i.test(String(u || '')) ? String(u) : '#';

  /* ── Puente a 13-NOT ── */

  function guardarEnNotas(titulo, cuerpo, tags) {
    let arr = [];
    try { arr = JSON.parse(localStorage.getItem(NOTES_KEY) || '[]'); } catch {}
    if (!Array.isArray(arr)) arr = [];

    const id = (window.crypto && crypto.randomUUID)
      ? crypto.randomUUID() : 'f' + Date.now().toString(36);

    arr.unshift({
      id,
      type: 'note',
      title: titulo,
      body: cuerpo,
      tags: tags || ['finanzas'],
      date: new Date().toISOString()
    });

    // Pasa por el proxy de cloud-sync → entra a la outbox y sube.
    localStorage.setItem(NOTES_KEY, JSON.stringify(arr));
    return id;
  }

  function toast(msg) {
    let t = document.getElementById('finIntelToast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'finIntelToast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(t._h);
    t._h = setTimeout(() => t.classList.remove('on'), 2600);
  }

  /* ── Carga ── */

  /* El estado de carga lo maneja SOLO esta función.
     Antes init() ponía _loading = true antes de llamarla, y el guard de
     acá abajo la hacía salir de inmediato: la bandera anti-duplicados
     impedía la primera carga. Quien pone la bandera es quien la levanta. */
  async function load() {
    if (_data) return _data;
    if (_loading) return null;
    _loading = true;
    render();                       // pinta "cargando…"
    try {
      const dia = new Date().toISOString().slice(0, 10);
      const res = await fetch(`${SRC}?d=${dia}`, { cache: 'no-cache' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      _data = await res.json();
    } catch (e) {
      console.warn('[FININTEL]', e && e.message);
      _data = null;
    }
    _loading = false;
    render();
    return _data;
  }

  /* ── Render ── */

  function _fuente(f) {
    const q = _filtro.toLowerCase();
    if (q && !((f.n + ' ' + f.p + ' ' + f.c).toLowerCase().includes(q))) return '';
    return `<div class="fin-src">
      <div class="fin-src-h">
        <a class="fin-src-n" href="${esc(safeUrl(f.u))}" target="_blank" rel="noopener noreferrer">${esc(f.n)} ↗</a>
        ${f.sinVerificar ? '<span class="fin-src-warn" title="El servidor responde pero bloquea la comprobación automática">sin verificar</span>' : ''}
      </div>
      <div class="fin-src-p">${esc(f.p)}</div>
      <div class="fin-src-c"><b>Cuándo te sirve:</b> ${esc(f.c)}</div>
      <button class="fin-src-save" data-save-n="${esc(f.n)}" data-save-u="${esc(safeUrl(f.u))}"
              data-save-p="${esc(f.p)}">📝 Guardar en mis notas</button>
    </div>`;
  }

  function render() {
    const host = document.getElementById('p-intel');
    if (!host) return;

    if (!_data) {
      host.innerHTML = `<div class="fc-head"><div>
        <div class="fc-title">📚 Inteligencia</div>
        <div class="fc-sub">Dónde mirar cuando querés estar seguro</div></div></div>
        <div class="fco-empty">${_loading ? '⟳ Cargando el directorio…' : 'No se pudo cargar el directorio.'}
        ${_loading ? '' : '<button class="btn bp bs" id="fiRetry">Reintentar</button>'}</div>`;
      const r = document.getElementById('fiRetry');
      if (r) r.onclick = () => { _data = null; init(); };
      return;
    }

    const grupos = (_data.grupos || []).map(g => {
      const items = (g.fuentes || []).map(_fuente).filter(Boolean).join('');
      if (!items) return '';
      return `<div class="fin-grupo">
        <div class="fin-g-h">${esc(g.titulo)}<em>${esc(g.sub)}</em></div>
        <div class="fin-g-grid">${items}</div>
      </div>`;
    }).join('');

    const total = (_data.grupos || []).reduce((a, g) => a + (g.fuentes || []).length, 0);

    host.innerHTML = `
      <div class="fc-head">
        <div>
          <div class="fc-title">📚 Inteligencia</div>
          <div class="fc-sub">Dónde mirar cuando querés estar seguro · ${total} fuentes comprobadas el ${esc(_data.verificado || '')}</div>
        </div>
      </div>

      <div class="fco-intro">
        <b>Esto no es una lista de enlaces.</b>
        Cada fuente dice <em>qué es</em> y <em>cuándo te sirve</em>, porque saber a quién preguntarle
        —y en qué orden— vale más que cualquier dato suelto. El orden de los grupos no es casual:
        arriba está el número original; abajo, las opiniones sobre ese número.
      </div>

      <div class="fin-buscar">
        <input class="inp" id="fiQ" placeholder="Buscar fuente… (ej. inflación, tasas, acciones)" value="${esc(_filtro)}">
      </div>

      ${grupos || '<div class="fco-empty">Nada coincide con esa búsqueda.</div>'}

      <div class="fco-src">${esc(_data.nota || '')}</div>
    `;
    _wire();
  }

  function _wire() {
    const host = document.getElementById('p-intel');
    if (!host) return;

    const q = host.querySelector('#fiQ');
    if (q) {
      q.oninput = () => {
        _filtro = q.value;
        const pos = q.selectionStart;
        render();
        const n = document.getElementById('fiQ');
        if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch {} }
      };
    }

    host.querySelectorAll('[data-save-n]').forEach(b => {
      b.onclick = () => {
        const n = b.dataset.saveN, u = b.dataset.saveU, p = b.dataset.saveP;
        guardarEnNotas(
          '📚 ' + n,
          `${p}\n\n${u}\n\nGuardado desde 12-FIN el ${new Date().toLocaleDateString('es-CO')}.`,
          ['finanzas', 'fuentes']
        );
        b.textContent = '✓ Guardado en Notas';
        b.classList.add('ok');
        toast('Guardado en 13-NOT · lo encontrás en Notas');
        setTimeout(() => { b.textContent = '📝 Guardar en mis notas'; b.classList.remove('ok'); }, 2600);
      };
    });
  }

  function init() {
    if (!document.getElementById('p-intel')) return;
    if (_data) { render(); return; }   // ya cargado: solo repintar
    load();                            // load() se encarga de render() en ambos extremos
  }

  return { init, render, guardarEnNotas };
})();

window.FININTEL = FININTEL;
