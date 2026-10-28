/* ═══════════════════════════════════════════════════════════════
   DA-2026 · 13-NOT · Plan de desarrollo del Cerebro
   ─────────────────────────────────────────────────────────────
   Miguel pidió que el plan viviera "en notas" y fuera actualizable
   a medida que avanzamos. Se resolvió como DATOS, no como texto:
   data/plan-cerebro.json es la única fuente de verdad, versionada
   en git. Cuando una tarea se termina cambia su estado ahí y esta
   vista lo refleja — sin copiar y pegar, sin dos verdades.

   Por qué no una nota común: una nota se edita a mano, se duplica y
   envejece. El plan tiene que ser el mismo para él y para la sesión
   de Claude que lo ejecuta.

   Cada tarea trae su PROBLEMA REAL (no un título vago), qué entrega
   y cómo se verifica. Un plan sin criterio de verificación es una
   lista de deseos.
═══════════════════════════════════════════════════════════════ */

const NOTPLAN = (() => {

  const SRC = 'data/plan-cerebro.json';
  let _data = null, _loading = false, _filtro = 'todo';

  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const PRIO = { P0: 'Ahora', P1: 'Sigue', P2: 'Después', P3: 'Cuando haya tiempo' };

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
      console.warn('[NOTPLAN]', e && e.message);
      _data = null;
    }
    _loading = false; render();
    return _data;
  }

  function item(it) {
    if (_filtro !== 'todo' && it.prioridad !== _filtro) return '';
    const hecho = it.estado === 'hecho';
    return `<div class="np-item np-${esc(it.estado)}">
      <div class="np-i-top">
        <span class="np-id">${esc(it.id)}</span>
        <span class="np-mod">${esc(it.modulo)}</span>
        <span class="np-prio np-${esc(it.prioridad)}">${esc(PRIO[it.prioridad] || it.prioridad)}</span>
        <span class="np-estado">${hecho ? '✓ hecho' : it.estado === 'a-decidir' ? '? por decidir' : '○ pendiente'}</span>
      </div>
      <div class="np-titulo">${esc(it.titulo)}</div>
      <div class="np-campo"><b>El problema:</b> ${esc(it.problema)}</div>
      ${it.entrega ? `<div class="np-campo"><b>Qué entrega:</b> ${esc(it.entrega)}</div>` : ''}
      ${it.verificacion ? `<div class="np-campo np-verif"><b>Cómo se verifica:</b> ${esc(it.verificacion)}</div>` : ''}
      ${it.reusa ? `<div class="np-reusa">♻ Reusa: ${esc(it.reusa)}</div>` : ''}
    </div>`;
  }

  function render() {
    const host = document.getElementById('p-plan');
    if (!host) return;

    if (!_data) {
      host.innerHTML = `<div class="np-empty">${_loading ? '⟳ Cargando el plan…' : 'No se pudo cargar el plan.'}
        ${_loading ? '' : '<button class="btn bp bs" id="npRetry">Reintentar</button>'}</div>`;
      const r = document.getElementById('npRetry');
      if (r) r.onclick = () => { _data = null; load(); };
      return;
    }

    const olas = (_data.olas || []).map(o => {
      const items = (o.items || []).map(item).filter(Boolean).join('');
      if (!items) return '';
      const pend = (o.items || []).filter(i => i.estado === 'pendiente').length;
      return `<div class="np-ola">
        <div class="np-o-h">
          <span class="np-o-id">${esc(o.id)}</span>
          <span class="np-o-t">${esc(o.titulo)}</span>
          <span class="np-o-n">${pend} pendiente${pend === 1 ? '' : 's'}</span>
        </div>
        <div class="np-o-porque">${esc(o.porque)}</div>
        <div class="np-items">${items}</div>
      </div>`;
    }).join('');

    const totalPend = (_data.olas || []).reduce((a, o) => a + (o.items || []).filter(i => i.estado === 'pendiente').length, 0);

    host.innerHTML = `
      <div class="np-head">
        <div>
          <div class="np-h1">🗺️ ${esc(_data.titulo)}</div>
          <div class="np-h2">v${esc(_data.version)} · actualizado ${esc(_data.actualizado)} ·
            ${totalPend} tareas pendientes · ${(_data.hecho || []).length} hitos completados</div>
        </div>
      </div>

      <div class="np-premisa">${esc(_data.premisa)}</div>

      <details class="np-criterios">
        <summary>Qué significa «terminado» — los ${(_data.criterios || []).length} criterios</summary>
        <div class="np-c-body">
          ${(_data.criterios || []).map((c, i) => `<div class="np-crit">
            <span class="np-c-n">${i + 1}</span>
            <span><b>${esc(c.c)}</b><em>${esc(c.d)}</em></span>
          </div>`).join('')}
        </div>
      </details>

      <div class="np-filtros">
        ${['todo', 'P0', 'P1', 'P2', 'P3'].map(f => `<button class="np-f${_filtro === f ? ' on' : ''}" data-npf="${f}">
          ${f === 'todo' ? 'Todo' : esc(PRIO[f])}</button>`).join('')}
      </div>

      ${olas || '<div class="np-empty">Nada con esa prioridad.</div>'}

      ${(_data.hecho || []).length ? `
        <details class="np-hecho">
          <summary>✓ Ya entregado (${(_data.hecho || []).length})</summary>
          <div class="np-h-body">
            ${(_data.hecho || []).map(h => `<div class="np-h-item">
              <span class="np-h-fecha">${esc(h.fecha)}</span>
              <span class="np-h-mod">${esc(h.modulo)}</span>
              <span class="np-h-que">${esc(h.que)}</span>
            </div>`).join('')}
          </div>
        </details>` : ''}

      <div class="np-pie">
        Este plan vive en <code>data/plan-cerebro.json</code>, versionado en git. No es una nota que
        se edita a mano: es la misma fuente que lee la sesión de Claude que ejecuta las tareas.
        Cuando algo se termina, cambia de estado ahí y acá se refleja solo.
      </div>`;

    host.querySelectorAll('[data-npf]').forEach(b => {
      b.onclick = () => { _filtro = b.dataset.npf; render(); };
    });
  }

  function init() {
    if (!document.getElementById('p-plan')) return;
    if (_data) { render(); return; }
    load();
  }

  return { init, render, get data() { return _data; } };
})();

window.NOTPLAN = NOTPLAN;
