/* ═══════════════════════════════════════════════════════════════
   DA-2026 · 8-PRO · Prompts del plan
   ─────────────────────────────────────────────────────────────
   Un prompt por tarea de data/plan-cerebro.json. Se copian y se
   pegan: no hay que editar nada antes de usarlos.

   Por qué se rehízo esta parte: los prompts existentes eran
   plantillas largas con huecos tipo "[DESCRIBE TU TAREA]" que
   había que completar a mano cada vez. Un prompt que exige trabajo
   antes de usarlo no se usa. Estos ya traen el problema real, la
   entrega esperada y el criterio de verificación.

   La cabecera común (rol, reglas, qué leer antes) se antepone sola
   al copiar, así cada prompt individual queda corto y legible.
═══════════════════════════════════════════════════════════════ */

const PROMPTSPLAN = (() => {

  const SRC = 'data/prompts-plan.json';
  let _data = null, _loading = false;

  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const PRIO = { P0: 'Ahora', P1: 'Sigue', P2: 'Después', P3: 'Luego' };

  async function load() {
    if (_data) return _data;
    if (_loading) return null;
    _loading = true; render();
    try {
      const dia = new Date().toISOString().slice(0, 10);
      const res = await fetch(`${SRC}?d=${dia}`, { cache: 'no-cache' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      _data = await res.json();
    } catch (e) {
      console.warn('[PROMPTSPLAN]', e && e.message);
      _data = null;
    }
    _loading = false; render();
    return _data;
  }

  /** Texto final: cabecera común + el cuerpo de la tarea. */
  function textoCompleto(p) {
    return `${_data.cabecera}\n\n${'═'.repeat(60)}\n\n${p.cuerpo}`;
  }

  async function copiar(p, btn) {
    const txt = textoCompleto(p);
    try {
      await navigator.clipboard.writeText(txt);
      btn.textContent = '✓ Copiado — pegalo en una sesión nueva';
      btn.classList.add('ok');
    } catch {
      // Sin permiso de portapapeles: se muestra para copiar a mano.
      const ta = document.createElement('textarea');
      ta.value = txt; ta.className = 'pp-fallback';
      btn.parentElement.appendChild(ta); ta.select();
      btn.textContent = 'Seleccionalo y copiá con Ctrl+C';
    }
    setTimeout(() => { btn.textContent = '📋 Copiar prompt'; btn.classList.remove('ok'); }, 3200);
  }

  function render() {
    const host = document.getElementById('p-planprompts');
    if (!host) return;

    if (!_data) {
      host.innerHTML = `<div class="pp-empty">${_loading ? '⟳ Cargando…' : 'No se pudieron cargar los prompts del plan.'}
        ${_loading ? '' : '<button class="btn bp bs" id="ppRetry">Reintentar</button>'}</div>`;
      const r = document.getElementById('ppRetry');
      if (r) r.onclick = () => { _data = null; load(); };
      return;
    }

    const items = (_data.prompts || []).map((p, i) => `
      <div class="pp-card">
        <div class="pp-top">
          <span class="pp-id">${esc(p.id)}</span>
          <span class="pp-mod">${esc(p.modulo)}</span>
          <span class="pp-prio pp-${esc(p.prioridad)}">${esc(PRIO[p.prioridad] || p.prioridad)}</span>
        </div>
        <div class="pp-titulo">${esc(p.titulo)}</div>
        <details class="pp-ver">
          <summary>Ver el prompt completo</summary>
          <pre class="pp-pre">${esc(p.cuerpo)}</pre>
        </details>
        <button class="pp-copy" data-copiar="${i}">📋 Copiar prompt</button>
      </div>`).join('');

    host.innerHTML = `
      <div class="pp-head">
        <div class="pp-h1">🚀 Prompts del plan</div>
        <div class="pp-h2">${(_data.prompts || []).length} tareas · v${esc(_data.version)} · ${esc(_data.actualizado)}</div>
      </div>

      <div class="pp-intro">
        <b>Uno por tarea del plan. Se copian y se pegan — no hay que editar nada.</b>
        Cada uno trae el problema real, qué tiene que entregar y cómo se verifica.
        Al copiar se le antepone sola la cabecera con el rol, las reglas que más se
        incumplen y qué leer antes de tocar código.
        <span class="pp-link">El plan completo vive en <b>13-NOT → pestaña Plan</b>.</span>
      </div>

      <div class="pp-list">${items}</div>

      <details class="pp-cab">
        <summary>Ver la cabecera que se antepone a todos</summary>
        <pre class="pp-pre">${esc(_data.cabecera)}</pre>
      </details>

      <div class="pp-pie">${esc(_data.nota)}</div>`;

    host.querySelectorAll('[data-copiar]').forEach(b => {
      b.onclick = () => copiar(_data.prompts[+b.dataset.copiar], b);
    });
  }

  function init() {
    if (!document.getElementById('p-planprompts')) return;
    if (_data) { render(); return; }
    load();
  }

  return { init, render, textoCompleto };
})();

window.PROMPTSPLAN = PROMPTSPLAN;
