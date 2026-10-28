/* ═══════════════════════════════════════════════════════════════
   DA-2026 · 12-FIN · Ajustes y salud de datos (Fase 4)
   ─────────────────────────────────────────────────────────────
   Nace de lo que pasó el 2026-08-12: durante horas el módulo mostró
   datos de ayer y NADA en pantalla lo delataba. El fallo solo se vio
   comparando a mano el archivo del repo contra lo que servía el sitio.

   Este panel existe para que eso no vuelva a ser invisible: dice de
   cuándo es cada archivo, si la actualización diaria corrió, y si las
   fuentes en vivo responden. Un sistema que se puede auditar en diez
   segundos falla distinto a uno que hay que creerle.

   Las llaves de API van en `fin_apikeys`, que está en SKIP_KEYS de
   cloud-sync: empieza por `fin_` y sin esa exclusión DYNAMIC_PREFIXES
   las subiría a Supabase. Tus llaves no salen de este equipo.
═══════════════════════════════════════════════════════════════ */

const FINCFG = (() => {

  const KEYS_KEY = 'fin_apikeys';     // LOCAL ONLY · ver SKIP_KEYS

  const ARCHIVOS = [
    { f:'macro-co.json',  n:'Indicadores de Colombia', d:'TRM, inflación, tasas, PIB, desempleo' },
    { f:'world.json',     n:'Mercados y prensa',       d:'Bolsas, materias primas, cripto y titulares' },
    { f:'credit-co.json', n:'Tasas de crédito',        d:'Lo que cobra cada banco + tope de usura' }
  ];

  const VIVAS = [
    { u:'https://www.datos.gov.co/resource/ceyp-9c7c.json?$limit=1', n:'datos.gov.co · TRM',
      d:'La única fuente que el navegador consulta en directo' }
  ];

  const PROVEEDORES = [
    { k:'finnhub',   n:'Finnhub',     lim:'60 llamadas/minuto', url:'https://finnhub.io/register',
      d:'Acciones y fundamentales de EE. UU.' },
    { k:'twelvedata',n:'Twelve Data', lim:'800 llamadas/día',   url:'https://twelvedata.com/pricing',
      d:'Índices, divisas y bolsas globales' }
  ];

  let _salud = null, _probando = false;

  const esc = s => String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const fechaHora = iso => {
    if (!iso) return '—';
    const d = new Date(iso);
    return isNaN(d) ? '—' : d.toLocaleString('es-CO', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
  };
  const horas = iso => iso ? (Date.now() - Date.parse(iso)) / 3600000 : null;

  const keysGet = () => { try { return JSON.parse(localStorage.getItem(KEYS_KEY) || '{}'); } catch { return {}; } };
  const keysSet = o => { try { localStorage.setItem(KEYS_KEY, JSON.stringify(o)); } catch {} };

  /* ── Diagnóstico ── */

  async function diagnosticar() {
    _probando = true; render();
    const dia = new Date().toISOString().slice(0, 10);
    const out = { archivos: [], vivas: [], cuando: new Date().toISOString() };

    for (const a of ARCHIVOS) {
      const r = { ...a };
      const t0 = performance.now();
      try {
        const res = await fetch(`data/${a.f}?d=${dia}`, { cache:'no-cache' });
        r.http = res.status;
        if (res.ok) {
          const j = await res.json();
          r.generatedAt = j.generatedAt || null;
          r.horas = horas(r.generatedAt);
          r.partial = !!j.partial;
          r.errores = j.errors || [];
        }
      } catch (e) { r.error = String(e && e.message); }
      r.ms = Math.round(performance.now() - t0);
      out.archivos.push(r);
    }

    for (const v of VIVAS) {
      const r = { ...v };
      const t0 = performance.now();
      try {
        const res = await fetch(v.u, { cache:'no-store' });
        r.http = res.status;
        r.ok = res.ok;
      } catch (e) { r.error = String(e && e.message); }
      r.ms = Math.round(performance.now() - t0);
      out.vivas.push(r);
    }

    _salud = out;
    _probando = false;
    render();
    return out;
  }

  /* ── Peso del módulo en localStorage ── */
  function pesoModulo() {
    let total = 0, filas = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith('fin_')) continue;
      const n = k.length + (localStorage.getItem(k) || '').length;
      total += n;
      filas.push([k, n]);
    }
    filas.sort((a, b) => b[1] - a[1]);
    return { total, filas };
  }

  /* ── Render ── */

  function _filaArchivo(a) {
    let estado, cls;
    if (a.error || !a.http)      { estado = 'no responde'; cls = 'fcfg-bad'; }
    else if (a.http !== 200)     { estado = 'HTTP ' + a.http; cls = 'fcfg-bad'; }
    else if (a.horas == null)    { estado = 'sin fecha'; cls = 'fcfg-warn'; }
    else if (a.horas > 36)       { estado = 'atrasado'; cls = 'fcfg-bad'; }
    else if (a.partial)          { estado = 'parcial'; cls = 'fcfg-warn'; }
    else                         { estado = 'al día'; cls = 'fcfg-ok'; }

    return `<tr>
      <td class="fcfg-n">${esc(a.n)}<em>${esc(a.d)}</em></td>
      <td>${esc(fechaHora(a.generatedAt))}</td>
      <td class="fcfg-num">${a.horas != null ? Math.round(a.horas) + ' h' : '—'}</td>
      <td class="fcfg-num">${a.ms} ms</td>
      <td><span class="fcfg-tag ${cls}">${esc(estado)}</span></td>
    </tr>${a.errores && a.errores.length ? `<tr class="fcfg-err"><td colspan="5">⚠ ${esc(a.errores.join(' · '))}</td></tr>` : ''}`;
  }

  function render() {
    const host = document.getElementById('p-cfg');
    if (!host) return;

    const keys = keysGet();
    const peso = pesoModulo();
    const s = _salud;

    const atrasados = s ? s.archivos.filter(a => a.horas == null || a.horas > 36 || a.http !== 200).length : 0;

    host.innerHTML = `
      <div class="fc-head">
        <div>
          <div class="fc-title">⚙️ Ajustes y salud</div>
          <div class="fc-sub">De cuándo es cada dato y si las fuentes responden</div>
        </div>
        <div class="fc-actions">
          <button class="btn bp bs" id="fcfgTest">${_probando ? '⟳ probando…' : '🔎 Probar todo ahora'}</button>
        </div>
      </div>

      <div class="fco-intro">
        <b>Este panel existe por lo que pasó el 12 de agosto.</b>
        Durante horas el módulo mostró datos de ayer y nada en pantalla lo delataba: el fallo solo se
        vio comparando a mano el archivo del repo contra lo que servía el sitio.
        <em>Un sistema que podés auditar en diez segundos falla distinto a uno al que hay que creerle.</em>
      </div>

      ${s ? `
        ${atrasados ? `<div class="flab-aviso">⚠ ${atrasados} ${atrasados === 1 ? 'fuente atrasada o caída' : 'fuentes atrasadas o caídas'}. Si un archivo pasa de 36 h, la actualización diaria dejó de correr — revisá la pestaña Actions del repositorio.</div>` : ''}
        <div class="lb">· archivos de datos (se regeneran solos cada día) ·</div>
        <div class="fco-scroll"><table class="fcfg-tbl">
          <thead><tr><th>Fuente</th><th>Generado</th><th class="fcfg-num">Edad</th><th class="fcfg-num">Respuesta</th><th>Estado</th></tr></thead>
          <tbody>${s.archivos.map(_filaArchivo).join('')}</tbody>
        </table></div>

        <div class="lb">· fuentes que el navegador consulta en directo ·</div>
        <div class="fco-scroll"><table class="fcfg-tbl">
          <thead><tr><th>Fuente</th><th class="fcfg-num">Respuesta</th><th>Estado</th></tr></thead>
          <tbody>${s.vivas.map(v => `<tr>
            <td class="fcfg-n">${esc(v.n)}<em>${esc(v.d)}</em></td>
            <td class="fcfg-num">${v.ms} ms</td>
            <td><span class="fcfg-tag ${v.ok ? 'fcfg-ok' : 'fcfg-bad'}">${v.ok ? 'responde' : esc(v.error || ('HTTP ' + v.http))}</span></td>
          </tr>`).join('')}</tbody>
        </table></div>
        <div class="fco-src">Comprobado ${esc(fechaHora(s.cuando))}. Los archivos se sirven desde este mismo sitio, así que si la página cargó, ellos cargan.</div>
      ` : `<div class="fco-empty">Todavía no probaste las fuentes.
        <button class="btn bp bs" id="fcfgTest2">🔎 Probar todo ahora</button></div>`}

      <div class="lb">· llaves de API · opcional ·</div>
      <div class="cd">
        <div class="fcfg-aviso">
          🔒 <b>Estas llaves NO salen de este equipo.</b> Están excluidas de la sincronización a
          propósito: viajan menos, se filtran menos. Si cambiás de computador, las volvés a pegar.
          <br>El módulo funciona completo sin ellas — solo amplían el panel Global con más instrumentos.
        </div>
        ${PROVEEDORES.map(p => `
          <label class="frd-f fcfg-key">
            <span>${esc(p.n)} <em>${esc(p.d)} · ${esc(p.lim)}</em></span>
            <span class="fcfg-key-row">
              <input class="inp" type="password" id="fcfgK_${esc(p.k)}" value="${esc(keys[p.k] || '')}"
                     placeholder="pegá tu llave gratuita acá" autocomplete="off">
              <a class="btn bo bs" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">Obtener →</a>
            </span>
          </label>`).join('')}
        <button class="btn bp bs" id="fcfgSaveKeys">Guardar llaves en este equipo</button>
      </div>

      <div class="lb">· espacio que ocupa el módulo ·</div>
      <div class="cd">
        <div class="fcfg-peso">
          <span class="fcfg-peso-n">${(peso.total / 1024).toFixed(0)} KB</span>
          <span>en ${peso.filas.length} claves que empiezan por <code>fin_</code></span>
        </div>
        <details class="fco-more">
          <summary>Ver el detalle</summary>
          <table class="fcfg-tbl fcfg-tbl-sm">
            <tbody>${peso.filas.slice(0, 12).map(([k, n]) => `<tr>
              <td class="fcfg-n">${esc(k)}</td>
              <td class="fcfg-num">${(n / 1024).toFixed(1)} KB</td>
              <td>${['fin_mkt_cache','fin_world_cache','fin_news_cache','fin_calc_state','fin_ui_prefs','fin_apikeys','fin_news_seen'].includes(k)
                    ? '<span class="fcfg-tag fcfg-local">solo local</span>'
                    : '<span class="fcfg-tag fcfg-sync">sincroniza</span>'}</td>
            </tr>`).join('')}</tbody>
          </table>
        </details>
        <button class="btn bo bs" id="fcfgClearCache" style="margin-top:10px">🧹 Vaciar cachés de datos</button>
        <div class="fco-src">Vaciar los cachés no toca tus movimientos, tesis, reglas ni llaves:
          solo borra las copias de los datos de mercado, que se vuelven a bajar solas.</div>
      </div>
    `;
    _wire();
  }

  function _wire() {
    const host = document.getElementById('p-cfg');
    if (!host) return;

    ['#fcfgTest', '#fcfgTest2'].forEach(sel => {
      const b = host.querySelector(sel);
      if (b) b.onclick = () => diagnosticar();
    });

    const save = host.querySelector('#fcfgSaveKeys');
    if (save) save.onclick = () => {
      const o = keysGet();
      PROVEEDORES.forEach(p => {
        const el = document.getElementById('fcfgK_' + p.k);
        if (el) { const v = el.value.trim(); if (v) o[p.k] = v; else delete o[p.k]; }
      });
      keysSet(o);
      save.textContent = '✓ Guardadas solo en este equipo';
      setTimeout(() => { save.textContent = 'Guardar llaves en este equipo'; }, 2600);
    };

    const clear = host.querySelector('#fcfgClearCache');
    if (clear) clear.onclick = () => {
      ['fin_mkt_cache', 'fin_world_cache', 'fin_news_cache'].forEach(k => {
        try { localStorage.removeItem(k); } catch {}
      });
      clear.textContent = '✓ Cachés vaciados — recargá para volver a bajarlos';
      setTimeout(render, 1800);
    };
  }

  function init() {
    if (!document.getElementById('p-cfg')) return;
    render();
    if (!_salud) diagnosticar();     // el diagnóstico es el punto de la sección
  }

  return { init, render, diagnosticar, get salud() { return _salud; } };
})();

window.FINCFG = FINCFG;
