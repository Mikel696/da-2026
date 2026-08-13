/* ═══════════════════════════════════════════════════════════════
   DA-2026 · 5-JOB · Radar de vacantes
   ─────────────────────────────────────────────────────────────
   Lee data/jobs-feed.json del MISMO origen, generado a diario por
   scripts/fetch-jobs.mjs desde GitHub Actions.

   Antes de esto, 5-JOB era un Kanban 100% manual: cada vacante había
   que escribirla a mano. Existía una función loadLiveJobs() en
   core.js que traía empleos de RemoteOK... y no la llamaba nadie.
   Código muerto.

   Lo que este panel aporta y ningún portal da:
   · ELEGIBILIDAD explícita. De 100 vacantes de RemoteOK, cero
     declaran aceptar LatAm. El radar descarta las cerradas y marca
     las dudosas, para que no gastes una tarde en una que no podías.
   · POR QUÉ salió cada una. Un puntaje sin motivo es una caja negra.
   · Un clic la manda a tu tablero, con el motivo ya escrito.

   Sin TTL de caché: el archivo es del propio origen (lección de
   12-FIN, donde un TTL de 6h congeló el panel en la foto de ayer).
═══════════════════════════════════════════════════════════════ */

const JOBRADAR = (() => {

  const SRC = 'data/jobs-feed.json';
  const VISTOS_KEY = 'jt_radar_vistos';   // local: cuáles ya descartaste

  let _data = null, _loading = false, _filtro = 'abiertas';

  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const safeUrl = u => /^https?:\/\//i.test(String(u || '')) ? String(u) : '#';

  /* Antigüedad en horas cuando importa. Las primeras 48 h son la ventana
     donde el reclutador todavía está revisando lo que llega. */
  const RECIENTE_H = 48;
  const cuando = j => {
    const h = j.horas;
    if (h == null) return j.dias != null ? `hace ${j.dias} días` : '';
    if (h < 1) return 'recién publicada';
    // Hasta el umbral se muestra en HORAS. Antes redondeaba a días y el
    // badge 🔥 quedaba junto a "hace 2 días": el mismo dato diciendo dos
    // cosas distintas. La etiqueta y la marca tienen que coincidir.
    if (h < RECIENTE_H) return `hace ${h} h`;
    const d = Math.round(h / 24);
    return d === 1 ? 'ayer' : `hace ${d} días`;
  };
  const esReciente = j => j.horas != null && j.horas < RECIENTE_H;

  const HOY = new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });

  const vistosGet = () => { try { return JSON.parse(localStorage.getItem(VISTOS_KEY) || '[]'); } catch { return []; } };
  const vistosSet = a => { try { localStorage.setItem(VISTOS_KEY, JSON.stringify(a.slice(-300))); } catch {} };

  /* ── Carga ── */
  async function load() {
    if (_loading) return _data;
    _loading = true; render();
    try {
      const dia = new Date().toISOString().slice(0, 10);
      const res = await fetch(`${SRC}?d=${dia}`, { cache: 'no-cache' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      _data = await res.json();
    } catch (e) {
      console.warn('[JOBRADAR]', e && e.message);
      _data = null;
    }
    _loading = false; render();
    return _data;
  }

  /* ── Puente al Kanban que ya existe ── */
  function guardarEnTablero(job) {
    if (typeof VDB === 'undefined') return false;
    const yaEsta = VDB.getAll().some(v => v.url === job.url);
    if (yaEsta) return 'duplicado';

    const area = /conciliaci|reconcil/i.test(job.motivos.join(' ')) ? 'Data Analyst'
               : /contabilidad/i.test(job.motivos.join(' '))       ? 'Financial Analyst'
               : /BI|analítica|analista de datos/i.test(job.motivos.join(' ')) ? 'Data Analyst'
               : 'general';

    VDB.save({
      id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'r' + Date.now().toString(36),
      role: job.titulo,
      company: job.empresa,
      url: job.url,
      status: 'saved',
      ts: Date.now(),
      focusArea: area,
      /* El puntaje no es un porcentaje de nada: es una suma de señales.
         Mostrarlo como "99% de afinidad" prometía una precisión que el dato
         no tiene. Se mapea a una banda honesta y con techo en 80: ninguna
         coincidencia automática merece decirte que sos el candidato ideal. */
      match: { pct: Math.min(80, Math.round(25 + job.score * 0.75)), found: job.motivos || [], missing: job.peros || [] },
      notes: `Del radar · ${job.fuente} · ${job.elegibilidadNota}` +
             (job.salario ? ` · ${job.salario}` : '') +
             (job.peros?.length ? `\n\nA tener en cuenta: ${job.peros.join(', ')}` : '')
    });
    return true;
  }

  /* ── Render ── */
  function tarjeta(j, i) {
    const badge = j.elegibilidad === 'abierta'
      ? '<span class="jr-el jr-ok">✓ acepta LatAm</span>'
      : j.elegibilidad === 'dudosa'
      ? '<span class="jr-el jr-dudo">? no lo dice</span>'
      : '<span class="jr-el jr-nd">sin declarar</span>';

    return `<div class="jr-card" data-i="${i}">
      <div class="jr-top">
        <span class="jr-score" title="Afinidad con tu perfil">${j.score}</span>
        <span class="jr-titulo">${esc(j.titulo)}</span>
        ${badge}
      </div>
      <div class="jr-meta">
        <span class="jr-emp">${esc(j.empresa)}</span>
        ${j.esAts ? '<span class="jr-ats">directo de la empresa</span>' : `<span class="jr-fuente">${esc(j.fuente)}</span>`}
        ${j.ubicacion ? `<span>📍 ${esc(j.ubicacion.slice(0, 40))}</span>` : ''}
        ${j.salario ? `<span class="jr-sal">${esc(j.salario)}</span>` : ''}
        <span class="jr-fecha${esReciente(j) ? ' jr-nueva' : ''}">${esReciente(j) ? '🔥 ' : ''}${esc(cuando(j))}</span>
      </div>
      <div class="jr-por">
        <b>Por qué te sale:</b> ${esc((j.motivos || []).join(' · ')) || 'coincidencia general'}
        ${j.peros?.length ? `<span class="jr-pero">⚠ ${esc(j.peros.join(' · '))}</span>` : ''}
      </div>

      ${j.kw ? `<details class="jr-kw">
        <summary>🎯 Las palabras que esta vacante busca en tu CV</summary>
        <div class="jr-kw-body">
          ${j.kw.tenes?.length ? `<div class="jr-kw-row">
            <span class="jr-kw-lbl jr-kw-si">Ya lo tenés · ponelo textual</span>
            <span class="jr-kw-chips">${j.kw.tenes.map(k => `<span class="jr-chip jr-chip-si">${esc(k)}</span>`).join('')}</span>
          </div>` : ''}
          ${j.kw.faltan?.length ? `<div class="jr-kw-row">
            <span class="jr-kw-lbl jr-kw-no">Lo piden y no lo mencionás</span>
            <span class="jr-kw-chips">${j.kw.faltan.map(k => `<span class="jr-chip jr-chip-no">${esc(k)}</span>`).join('')}</span>
          </div>` : ''}
          <div class="jr-kw-nota">
            El filtro automático de la empresa descarta CVs por coincidencia de palabras
            <b>antes de que un humano los lea</b>. Si algo de la izquierda no está escrito
            tal cual en tu CV, agregalo. Lo de la derecha: si lo sabés aunque sea a nivel
            básico, decilo con honestidad; si no, ya sabés qué estudiar para la próxima.
          </div>
        </div>
      </details>` : ''}
      <div class="jr-acc">
        <a class="btn bp bs" href="${esc(safeUrl(j.url))}" target="_blank" rel="noopener noreferrer">Ver oferta ↗</a>
        <button class="btn bg bs" data-guardar="${i}">+ A mi tablero</button>
        <button class="btn bo bs" data-descartar="${i}">Descartar</button>
      </div>
    </div>`;
  }

  function render() {
    const host = document.getElementById('p-radar-jobs');
    if (!host) return;

    if (_loading && !_data) {
      host.innerHTML = '<div class="jr-empty">⟳ Cargando el radar…</div>';
      return;
    }
    if (!_data || !(_data.jobs || []).length) {
      host.innerHTML = `<div class="jr-empty">
        No se pudo cargar el radar de vacantes.
        <button class="btn bp bs" id="jrRetry">Reintentar</button>
      </div>`;
      const r = document.getElementById('jrRetry');
      if (r) r.onclick = () => { _data = null; load(); };
      return;
    }

    const vistos = vistosGet();
    const todas = (_data.jobs || []).filter(j => !vistos.includes(j.url));
    const lista = _filtro === 'abiertas' ? todas.filter(j => j.elegibilidad === 'abierta') : todas;
    const r = _data.resumen || {};
    const gen = _data.generatedAt ? new Date(_data.generatedAt) : null;

    /* Aviso de frescura: lo primero que se ve. Compara la fecha del feed
       con hoy, y si la actualización diaria no corrió lo dice en ámbar en
       vez de dejarte creer que estás mirando lo de hoy. */
    const horasFeed = gen ? (Date.now() - gen.getTime()) / 3600000 : null;
    const alDia = horasFeed != null && horasFeed < 30;
    const recientes = todas.filter(esReciente).length;

    host.innerHTML = `
      <div class="jr-banner ${alDia ? 'jr-banner-ok' : 'jr-banner-old'}">
        <span class="jr-banner-ico">${alDia ? '✓' : '⚠'}</span>
        <span class="jr-banner-txt">
          <b>${alDia ? `Actualizado a hoy, ${HOY}` : `Última actualización: ${gen ? gen.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) : 'desconocida'}`}</b>
          <span>${alDia
            ? `${r.revisadas || 0} vacantes revisadas esta mañana en ${(_data.fuentes || []).length} fuentes · se renueva solo cada día`
            : 'La actualización diaria no corrió. Lo que ves es de una fecha anterior.'}</span>
        </span>
        ${recientes ? `<span class="jr-banner-hot">🔥 ${recientes} publicada${recientes === 1 ? '' : 's'} en las últimas 48 h</span>` : ''}
      </div>

      <div class="jr-head">
        <div>
          <div class="jr-h1">🔎 Radar de vacantes</div>
          <div class="jr-h2">${gen ? 'corrida de las ' + gen.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : ''}</div>
        </div>
      </div>

      <div class="jr-intro">
        <b>Tus tres ventajas sobre los demás aspirantes:</b>
        <span class="jr-vent"><b>1 · No perdés el tiempo.</b> De ${r.revisadas || 0} revisadas,
          <b>${r.descartadasPorRegion || 0}</b> encajaban con tu perfil pero estaban restringidas a otra región.
          Descartadas. El resto declara que acepta LatAm o no lo especifica.</span>
        <span class="jr-vent"><b>2 · Sabés qué palabras poner en el CV.</b> Las empresas filtran por
          coincidencia de términos antes de que un humano lea. Cada vacante te dice cuáles busca —
          abrí «🎯 Las palabras que esta vacante busca».</span>
        <span class="jr-vent"><b>3 · Llegás por la puerta de la empresa.</b> Las marcadas
          <em>directo de la empresa</em> vienen del sistema de contratación oficial, no de un
          agregador. Y ves las horas exactas desde que se publicó.</span>
      </div>

      <div class="jr-filtros">
        <button class="jr-f${_filtro === 'abiertas' ? ' on' : ''}" data-f="abiertas">
          ✓ Acepta LatAm <span>${todas.filter(j => j.elegibilidad === 'abierta').length}</span>
        </button>
        <button class="jr-f${_filtro === 'todas' ? ' on' : ''}" data-f="todas">
          Todas las que encajan <span>${todas.length}</span>
        </button>
        ${vistos.length ? `<button class="jr-f jr-reset" id="jrLimpiar">↺ Ver las ${vistos.length} descartadas</button>` : ''}
      </div>

      ${lista.length
        ? `<div class="jr-list">${lista.map(tarjeta).join('')}</div>`
        : `<div class="jr-empty">
             ${_filtro === 'abiertas'
               ? 'Hoy ninguna declara aceptar LatAm.<span>Mirá «Todas las que encajan»: las dudosas no dicen la región, y a veces sí aceptan. Vale leerlas.</span>'
               : 'Ya revisaste todas las de hoy.<span>El radar se actualiza solo cada mañana.</span>'}
           </div>`}

      <div class="jr-pie">
        Fuentes: ${esc((_data.fuentes || []).join(' · '))}.
        Las marcadas <b>«directo de la empresa»</b> vienen del sistema de contratación oficial:
        son las de mejor señal. Postularte se hace en el sitio de la empresa; acá solo te enterás de que existen.
      </div>`;

    wire();
  }

  function wire() {
    const host = document.getElementById('p-radar-jobs');
    if (!host) return;
    const vistos = vistosGet();
    const todas = (_data?.jobs || []).filter(j => !vistos.includes(j.url));
    const lista = _filtro === 'abiertas' ? todas.filter(j => j.elegibilidad === 'abierta') : todas;

    host.querySelectorAll('[data-f]').forEach(b => {
      b.onclick = () => { _filtro = b.dataset.f; render(); };
    });

    const limpiar = host.querySelector('#jrLimpiar');
    if (limpiar) limpiar.onclick = () => { vistosSet([]); render(); };

    host.querySelectorAll('[data-guardar]').forEach(b => {
      b.onclick = () => {
        const j = lista[+b.dataset.guardar];
        if (!j) return;
        const r = guardarEnTablero(j);
        if (r === 'duplicado') { b.textContent = 'Ya estaba'; b.disabled = true; return; }
        if (!r) { b.textContent = 'No se pudo'; return; }
        b.textContent = '✓ En tu tablero';
        b.disabled = true;
        // Refrescar el Kanban sin recargar la página.
        try { if (typeof rK === 'function') rK(); if (typeof calculateMetrics === 'function') calculateMetrics(); } catch {}
      };
    });

    host.querySelectorAll('[data-descartar]').forEach(b => {
      b.onclick = () => {
        const j = lista[+b.dataset.descartar];
        if (!j) return;
        const v = vistosGet(); v.push(j.url); vistosSet(v);
        render();
      };
    });
  }

  function init() {
    if (!document.getElementById('p-radar-jobs')) return;
    if (_data) { render(); return; }
    load();
  }

  return { init, render, load, guardarEnTablero };
})();

window.JOBRADAR = JOBRADAR;
