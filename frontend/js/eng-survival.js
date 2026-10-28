/* ═══════════════════════════════════════════════════════════════
   DA-2026 · 3-ENG · Defenderme
   ─────────────────────────────────────────────────────────────
   Miguel pidió que el módulo le enseñe a DEFENDERSE, no a saber
   inglés en abstracto. La diferencia es concreta:

   Lo que había: `professional` = 39 entradas con forma
   {en, es, ex, tp} — o sea, PALABRAS sueltas con un ejemplo.
   Saber que "dashboard" es "panel de control" no te salva cuando
   no entendiste lo que dijo el cliente y tenés que reaccionar ya.

   Lo que hace falta: frases completas, agrupadas por SITUACIÓN, y
   sobre todo el campo `cuando` — el momento exacto en que se usa.
   Defenderse no es saberlo todo: es no quedarse trabado nunca.
   El problema real no es desconocer la palabra, es no saber qué
   decir en el segundo en que te toca hablar.

   Por eso el grupo más grande no es vocabulario técnico sino
   "No entendí": pedir que te repitan sin perder la compostura es
   la habilidad número uno de alguien que se defiende.

   Los datos viven en data/english-survival.json, no acá.
═══════════════════════════════════════════════════════════════ */

const ENGSURV = (() => {

  const SRC = 'data/english-survival.json';
  let _data = null, _cargando = false, _grupo = 'todos', _busca = '';

  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  async function cargar() {
    if (_data || _cargando) return _data;
    _cargando = true; render();
    try {
      const r = await fetch(`${SRC}?d=${new Date().toISOString().slice(0, 10)}`, { cache: 'no-cache' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      _data = await r.json();
    } catch (e) {
      console.warn('[ENGSURV]', e && e.message);
      _data = null;
    }
    _cargando = false; render();
    return _data;
  }

  /* Reusa el TTS de eng.js — no se duplica el motor de voz. */
  function decir(texto, btn) {
    if (window.ENG && typeof ENG.speak === 'function') return ENG.speak(texto, btn);
    if (window.speechSynthesis) {
      const u = new SpeechSynthesisUtterance(texto);
      u.lang = 'en-US'; u.rate = 0.9;
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    }
  }

  const coincide = f => {
    if (!_busca) return true;
    const q = _busca.toLowerCase();
    return (f.en + ' ' + f.es + ' ' + f.cuando).toLowerCase().includes(q);
  };

  /* Buscar por SITUACIÓN, no solo por texto de la frase. Si escribís
     "no entendí" querés ese grupo entero, no la única frase que además
     menciona esas palabras. Se busca primero por situación y, si el
     grupo coincide, entra completo. */
  const grupoCoincide = g => {
    if (!_busca) return false;
    const q = _busca.toLowerCase();
    return (g.titulo + ' ' + g.porque).toLowerCase().includes(q);
  };

  function fila(f, i) {
    return `<div class="sv-f">
      <div class="sv-en">
        <button class="sv-play" data-decir="${esc(f.en)}" title="Escuchar">🔊</button>
        <span class="sv-en-t">${esc(f.en)}</span>
      </div>
      <div class="sv-es">${esc(f.es)}</div>
      <div class="sv-cuando"><b>Cuándo:</b> ${esc(f.cuando)}</div>
    </div>`;
  }

  function render() {
    const host = document.getElementById('p-defen');
    if (!host) return;

    if (!_data) {
      host.innerHTML = `<div class="sv-vacio">${_cargando ? '⟳ Cargando frases…'
        : 'No se pudieron cargar las frases. <button class="btn bs bo" id="svRetry">Reintentar</button>'}</div>`;
      const r = document.getElementById('svRetry');
      if (r) r.onclick = () => { _data = null; cargar(); };
      return;
    }

    const grupos = _data.grupos || [];
    const total = grupos.reduce((a, g) => a + g.frases.length, 0);

    const visibles = grupos
      .filter(g => _grupo === 'todos' || g.id === _grupo)
      .map(g => ({ g, fs: grupoCoincide(g) ? g.frases : g.frases.filter(coincide) }))
      .filter(x => x.fs.length);

    const mostradas = visibles.reduce((a, x) => a + x.fs.length, 0);

    host.innerHTML = `
      <div class="sl">· defenderme ·</div>
      <div class="sv-intro">${esc(_data.premisa)}</div>

      <div class="sv-barra">
        <input class="sv-buscar" id="svBuscar" placeholder="Buscar una frase o una situación…" value="${esc(_busca)}">
        <span class="sv-conteo">${mostradas} de ${total}</span>
      </div>

      <div class="sv-tabs">
        <button class="sv-tb${_grupo === 'todos' ? ' on' : ''}" data-g="todos">Todas</button>
        ${grupos.map(g => `<button class="sv-tb${_grupo === g.id ? ' on' : ''}" data-g="${esc(g.id)}">
          ${esc(g.icon)} ${esc(g.titulo)} <em>${g.frases.length}</em></button>`).join('')}
      </div>

      ${visibles.map(({ g, fs }) => `<div class="sv-g">
        <div class="sv-g-h">${esc(g.icon)} ${esc(g.titulo)}</div>
        <div class="sv-g-p">${esc(g.porque)}</div>
        <div class="sv-fs">${fs.map(fila).join('')}</div>
      </div>`).join('') || `<div class="sv-vacio">Nada coincide con «${esc(_busca)}».</div>`}`;

    const inp = document.getElementById('svBuscar');
    if (inp) {
      inp.oninput = e => {
        _busca = e.target.value;
        const pos = e.target.selectionStart;
        render();
        const n = document.getElementById('svBuscar');
        if (n) { n.focus(); n.setSelectionRange(pos, pos); }
      };
    }
    host.querySelectorAll('[data-g]').forEach(b => {
      b.onclick = () => { _grupo = b.dataset.g; render(); };
    });
    host.querySelectorAll('[data-decir]').forEach(b => {
      b.onclick = () => decir(b.dataset.decir, b);
    });
  }

  function init() {
    if (!document.getElementById('p-defen')) return;
    cargar();
  }

  return { init, render, get data() { return _data; } };
})();

window.ENGSURV = ENGSURV;
