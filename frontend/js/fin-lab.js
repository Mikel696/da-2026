/* ═══════════════════════════════════════════════════════════════
   DA-2026 · 12-FIN · Laboratorio · Bitácora de tesis (Fase 4)
   ─────────────────────────────────────────────────────────────
   Por qué existe: el módulo entero da datos, pero los datos no
   enseñan a decidir. Esto sí.

   Escribís qué creés que va a pasar y por qué. El sistema CONGELA el
   contexto de mercado de ese instante (TRM, inflación, tasa de
   política) y te lo devuelve el día de la revisión, junto al valor de
   ese momento. Ahí escribís qué pasó de verdad.

   La gracia está en no poder reescribir la historia: tu razonamiento
   quedó guardado con fecha, y el mercado de entonces también. Es la
   única forma honesta de saber si acertás por criterio o por suerte.

   NO es asesoría: el sistema no opina, no sugiere y no puntúa tus
   decisiones. Solo te devuelve lo que vos mismo escribiste.

   Se guarda en `fin_theses` — sincroniza (es tuyo).
═══════════════════════════════════════════════════════════════ */

const FINLAB = (() => {

  const KEY = 'fin_theses';

  const esc = s => String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const nf = (n, d = 2) => isFinite(n)
    ? new Intl.NumberFormat('es-CO', { minimumFractionDigits:d, maximumFractionDigits:d }).format(n) : '—';
  const fechaEs = iso => {
    if (!iso) return '—';
    const d = new Date(iso);
    return isNaN(d) ? '—' : d.toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'numeric' });
  };
  const diasHasta = iso => Math.ceil((Date.parse(iso) - Date.now()) / 86400000);

  const get = () => { try { const a = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(a) ? a : []; } catch { return []; } };
  const set = a => { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) { console.warn('[FINLAB]', e && e.message); } };

  /** Foto del mercado en este instante, desde el estado vivo de FINCO. */
  function contextoAhora() {
    const d = (window.FINCO && FINCO.state && FINCO.state.data) || {};
    const c = { fecha: new Date().toISOString() };
    if (d.trm)    c.trm    = d.trm.value;
    if (d.cpi)    c.cpi    = d.cpi.value;
    if (d.policy) c.policy = d.policy.value;
    return c;
  }

  const METRICAS = [
    { k:'trm',    l:'Dólar',            u:'',   d:0 },
    { k:'cpi',    l:'Inflación',        u:'%',  d:2 },
    { k:'policy', l:'Tasa de política', u:'%',  d:2 }
  ];

  /** Compara el contexto congelado contra el de hoy. Sin interpretar:
   *  solo pone los dos números uno al lado del otro. */
  function _comparativa(ctx) {
    const hoy = contextoAhora();
    const filas = METRICAS.map(m => {
      const antes = ctx && ctx[m.k], ahora = hoy[m.k];
      if (antes == null || ahora == null) return '';
      const dif = ahora - antes;
      const cls = Math.abs(dif) < 0.005 ? 'flab-flat' : (dif > 0 ? 'flab-up' : 'flab-down');
      return `<tr>
        <td>${esc(m.l)}</td>
        <td class="flab-n">${nf(antes, m.d)}${m.u}</td>
        <td class="flab-n">${nf(ahora, m.d)}${m.u}</td>
        <td class="flab-n ${cls}">${dif >= 0 ? '+' : ''}${nf(dif, m.d)}${m.u}</td>
      </tr>`;
    }).filter(Boolean).join('');
    if (!filas) return '';
    return `<table class="flab-cmp">
      <thead><tr><th></th><th class="flab-n">Cuando escribiste</th><th class="flab-n">Hoy</th><th class="flab-n">Cambio</th></tr></thead>
      <tbody>${filas}</tbody></table>`;
  }

  /* ── Render ── */

  function _tarjeta(t, i) {
    const abierta = !t.cerrada;
    const dias = abierta ? diasHasta(t.revisar) : 0;
    const vencida = abierta && dias <= 0;

    return `<div class="flab-card ${abierta ? (vencida ? 'flab-due' : 'flab-open') : 'flab-done'}">
      <div class="flab-top">
        <span class="flab-estado">${
          !abierta ? (t.acerto === true ? '✓ acertaste' : t.acerto === false ? '✗ no se dio' : '— cerrada')
          : vencida ? '⏰ toca revisarla' : `abierta · faltan ${dias} ${dias === 1 ? 'día' : 'días'}`
        }</span>
        <span class="flab-fecha">escrita el ${esc(fechaEs(t.ctx && t.ctx.fecha))}</span>
      </div>

      <div class="flab-tesis">${esc(t.tesis)}</div>
      <div class="flab-campo"><b>Por qué lo creo:</b> ${esc(t.porque)}</div>
      ${t.accion ? `<div class="flab-campo"><b>Qué voy a hacer:</b> ${esc(t.accion)}</div>` : ''}

      ${abierta ? `
        <div class="flab-ctx">${_comparativa(t.ctx)}</div>
        ${vencida ? `
          <div class="flab-cerrar">
            <div class="flab-pregunta">Mirá los números de arriba. <b>¿Qué pasó de verdad?</b></div>
            <textarea class="inp flab-ta" id="flabRes${i}" rows="2" placeholder="Lo que pasó, sin maquillar…"></textarea>
            <textarea class="inp flab-ta" id="flabApr${i}" rows="2" placeholder="Qué aprendo de esto para la próxima…"></textarea>
            <div class="flab-btns">
              <button class="btn bg bs" data-cerrar="${i}" data-acerto="1">✓ Acerté</button>
              <button class="btn bo bs" data-cerrar="${i}" data-acerto="0">✗ No se dio</button>
              <button class="btn bo bs" data-cerrar="${i}" data-acerto="">— Ni una cosa ni otra</button>
            </div>
          </div>` : `
          <button class="flab-early" data-vencer="${i}">Revisarla ya, sin esperar</button>`}
      ` : `
        <div class="flab-cierre">
          <div class="flab-campo"><b>Qué pasó:</b> ${esc(t.resultado || '—')}</div>
          ${t.aprendizaje ? `<div class="flab-campo flab-apr"><b>Lo que aprendí:</b> ${esc(t.aprendizaje)}</div>` : ''}
          <div class="flab-fecha">cerrada el ${esc(fechaEs(t.cerrada))}</div>
        </div>`}

      <button class="flab-del" data-borrar="${i}" aria-label="Eliminar tesis">✕</button>
    </div>`;
  }

  function render() {
    const host = document.getElementById('p-lab');
    if (!host) return;

    const all = get();
    const abiertas = all.filter(t => !t.cerrada);
    const cerradas = all.filter(t => t.cerrada);
    const vencidas = abiertas.filter(t => diasHasta(t.revisar) <= 0).length;
    const aciertos = cerradas.filter(t => t.acerto === true).length;
    const fallos   = cerradas.filter(t => t.acerto === false).length;

    const hoy = new Date();
    const enUnMes = new Date(hoy.getTime() + 30 * 86400000).toISOString().slice(0, 10);

    host.innerHTML = `
      <div class="fc-head">
        <div>
          <div class="fc-title">🧮 Laboratorio</div>
          <div class="fc-sub">Tu bitácora de decisiones — la única forma de saber si acertás por criterio o por suerte</div>
        </div>
        ${cerradas.length ? `<div class="flab-score">
          <span class="flab-up">${aciertos}</span> / <span class="flab-down">${fallos}</span>
          <em>aciertos / fallos en ${cerradas.length} cerradas</em>
        </div>` : ''}
      </div>

      <div class="fco-intro">
        <b>Escribí qué creés que va a pasar, y por qué.</b>
        El sistema congela el dólar, la inflación y la tasa de hoy, y te los devuelve el día de la
        revisión junto a los de ese momento. Ahí escribís qué pasó de verdad.
        <em>No podés reescribir la historia: tu razonamiento queda con fecha.</em>
        El panel no opina ni te puntúa — solo te devuelve lo que vos escribiste.
      </div>

      ${vencidas ? `<div class="flab-aviso">⏰ Tenés ${vencidas} ${vencidas === 1 ? 'tesis que toca revisar' : 'tesis que tocan revisar'}. Hacelo antes de escribir una nueva: ahí está el aprendizaje.</div>` : ''}

      <details class="flab-nueva" ${all.length ? '' : 'open'}>
        <summary>+ Escribir una tesis nueva</summary>
        <div class="flab-form">
          <label class="frd-f"><span>Qué creo que va a pasar</span>
            <input class="inp" id="flabTesis" placeholder="ej. El dólar va a bajar de 3.000 antes de fin de año"></label>
          <label class="frd-f"><span>Por qué lo creo <em>tu razonamiento, con detalle — esto es lo que vas a releer</em></span>
            <textarea class="inp flab-ta" id="flabPorque" rows="3" placeholder="Por qué. Qué viste, qué leíste, qué te hace pensar eso…"></textarea></label>
          <label class="frd-f"><span>Qué voy a hacer al respecto <em>opcional</em></span>
            <input class="inp" id="flabAccion" placeholder="ej. esperar para cambiar dólares"></label>
          <label class="frd-f"><span>Cuándo la reviso</span>
            <input class="inp" id="flabFecha" type="date" value="${enUnMes}" min="${hoy.toISOString().slice(0,10)}"></label>
          <button class="btn bp bs" id="flabAdd">Guardar tesis</button>
        </div>
      </details>

      ${abiertas.length ? `<div class="lb">· abiertas ·</div>
        <div class="flab-list">${all.map((t, i) => t.cerrada ? '' : _tarjeta(t, i)).join('')}</div>` : ''}

      ${cerradas.length ? `<div class="lb">· cerradas ·</div>
        <div class="flab-list">${all.map((t, i) => t.cerrada ? _tarjeta(t, i) : '').join('')}</div>` : ''}

      ${!all.length ? `<div class="fco-empty">
        Todavía no escribiste ninguna tesis.
        <span class="fco-dim">Empezá con algo chico y comprobable: «creo que la inflación va a seguir bajando»,
        «creo que el CDT me conviene más que dejar la plata quieta». No importa acertar: importa
        que dentro de un mes puedas leer qué estabas pensando.</span>
      </div>` : ''}
    `;
    _wire();
  }

  function _wire() {
    const host = document.getElementById('p-lab');
    if (!host) return;

    const add = host.querySelector('#flabAdd');
    if (add) add.onclick = () => {
      const tesis  = (host.querySelector('#flabTesis').value  || '').trim();
      const porque = (host.querySelector('#flabPorque').value || '').trim();
      if (!tesis)  { host.querySelector('#flabTesis').focus();  return; }
      if (!porque) { host.querySelector('#flabPorque').focus(); return; }

      const arr = get();
      arr.unshift({
        id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'l' + Date.now().toString(36),
        tesis: tesis.slice(0, 220),
        porque: porque.slice(0, 1200),
        accion: (host.querySelector('#flabAccion').value || '').trim().slice(0, 220),
        revisar: host.querySelector('#flabFecha').value || new Date(Date.now() + 30*86400000).toISOString().slice(0,10),
        ctx: contextoAhora(),
        cerrada: null, acerto: null, resultado: '', aprendizaje: ''
      });
      set(arr);
      render();
    };

    host.querySelectorAll('[data-cerrar]').forEach(b => {
      b.onclick = () => {
        const i = +b.dataset.cerrar;
        const arr = get();
        if (!arr[i]) return;
        const res = document.getElementById('flabRes' + i);
        const apr = document.getElementById('flabApr' + i);
        arr[i].resultado   = (res ? res.value : '').trim().slice(0, 1200);
        arr[i].aprendizaje = (apr ? apr.value : '').trim().slice(0, 1200);
        arr[i].acerto = b.dataset.acerto === '1' ? true : (b.dataset.acerto === '0' ? false : null);
        arr[i].cerrada = new Date().toISOString();
        arr[i].ctxCierre = contextoAhora();
        set(arr);
        render();
      };
    });

    host.querySelectorAll('[data-vencer]').forEach(b => {
      b.onclick = () => {
        const i = +b.dataset.vencer;
        const arr = get();
        if (!arr[i]) return;
        arr[i].revisar = new Date().toISOString().slice(0, 10);
        set(arr);
        render();
      };
    });

    host.querySelectorAll('[data-borrar]').forEach(b => {
      b.onclick = () => {
        const i = +b.dataset.borrar;
        const arr = get();
        if (!arr[i]) return;
        if (!confirm('¿Borrar esta tesis? Se pierde el razonamiento que escribiste.')) return;
        arr.splice(i, 1);
        set(arr);
        render();
      };
    });
  }

  /** Cuántas tesis están vencidas — lo usa el briefing de la pestaña Hoy. */
  function pendientes() {
    return get().filter(t => !t.cerrada && diasHasta(t.revisar) <= 0).length;
  }

  function init() {
    if (!document.getElementById('p-lab')) return;
    render();
  }

  return { init, render, pendientes };
})();

window.FINLAB = FINLAB;
