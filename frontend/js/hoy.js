/* ═══════════════════════════════════════════════════════════════
   DA-2026 · 1-IND · Vista HOY
   ─────────────────────────────────────────────────────────────
   El dashboard tenía 16 tarjetas para ENTRAR a los módulos, pero no
   decía qué requiere atención. Este panel cruza los stores que ya
   existen y responde una sola pregunta: ¿qué toca hoy?

   TRES REGLAS QUE ESTE ARCHIVO NO ROMPE
   ─────────────────────────────────────
   1. Una tarjeta aparece SOLO si hay dato que la sostenga. Nada de
      "0 pendientes" ni "todo al día" cuando el módulo jamás se usó:
      no haber usado 9-GOA no es lo mismo que tener los hábitos al
      día, y el panel distingue los dos casos (ver _estado()).

   2. Cada fuente se cuenta con LA MISMA expresión que usa su módulo.
      Este panel es un espejo, no una segunda autoridad — si 3-ENG
      dice 5 tarjetas, acá dice 5. Cuando encontré que la definición
      del módulo tiene un defecto (ver SRS abajo) lo repliqué igual y
      lo dejé anotado, en vez de arreglarlo por mi cuenta y que los
      dos números se contradigan en pantalla.

   3. Las fechas se calculan en UTC, como TODO el resto de la
      plataforma (goals.js:_today y systems_logic.js:todayStr usan
      toISOString). En Colombia (UTC-5) eso adelanta el cambio de día
      a las 7 p.m. locales. Es discutible, pero divergir acá haría
      que el panel y 9-GOA no coincidieran en qué día es hoy.
═══════════════════════════════════════════════════════════════ */

const HOY = (() => {

  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const leer = (k, def) => {
    try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? def : v; }
    catch { return def; }
  };
  const arr = k => { const v = leer(k, []); return Array.isArray(v) ? v : []; };

  /* Mismo criterio de "hoy" que goals.js y systems_logic.js — ver regla 3. */
  const hoyStr = () => new Date().toISOString().split('T')[0];
  const diasHasta = iso => Math.ceil((Date.parse(iso) - Date.now()) / 86400000);

  let _macro = null, _jobs = null, _cargando = false;

  /* Estado de una fuente. La diferencia entre "sin datos" y "al día" es
     la que evita que el panel invente tranquilidad que no verificó. */
  const _estado = (total, pend) => !total ? 'sin-datos' : (pend ? 'pendiente' : 'al-dia');

  /* ── Fuentes ─────────────────────────────────────────────────
     Cada una devuelve { estado, n, detalle?, mod?, extra? } y NO toca
     el DOM. Así se pueden probar una por una desde la consola. */

  /* 12-FIN · tesis vencidas — espejo de FINLAB.pendientes() */
  function fTesis() {
    const all = arr('fin_theses');
    const abiertas = all.filter(t => !t.cerrada);
    const venc = abiertas.filter(t => diasHasta(t.revisar) <= 0);
    return {
      estado: _estado(all.length, venc.length), n: venc.length, mod: 'finance',
      detalle: venc.length ? (venc[0].tesis || '').slice(0, 90) : ''
    };
  }

  /* 12-FIN · alertas disparadas.
     FINRADAR.pendientes() necesita FINCO, que no vive en el dashboard.
     Pero METRICAS solo lee 4 números de data/macro-co.json — el mismo
     archivo de mismo origen que lee 12-FIN. Se replica la comparación
     (4 campos), no el motor entero: no hay proxy ni duplicación real. */
  const METRICAS = {
    trm:    d => d.trm    && d.trm.value,
    cpi:    d => d.cpi    && d.cpi.value,
    policy: d => d.policy && d.policy.value,
    ibr:    d => d.ibr    && d.ibr.value
  };
  const ETIQ = { trm:'el dólar', cpi:'la inflación', policy:'la tasa del Banrep', ibr:'el IBR' };

  function fAlertas() {
    const all = arr('fin_alerts');
    if (!all.length) return { estado: 'sin-datos', n: 0, mod: 'finance' };
    if (!_macro) return { estado: 'sin-fuente', n: 0, mod: 'finance' };

    const d = _macro.data || {};
    const disparadas = all.filter(a => {
      const get = METRICAS[a.metrica]; if (!get) return false;
      const v = get(d);
      if (v == null || !isFinite(v)) return false;      // sin dato ≠ disparada
      return a.dir === 'mayor' ? v > a.valor : v < a.valor;
    });
    return {
      estado: _estado(all.length, disparadas.length), n: disparadas.length, mod: 'finance',
      detalle: disparadas.length
        ? `${ETIQ[disparadas[0].metrica] || disparadas[0].metrica} ${disparadas[0].dir === 'mayor' ? 'superó' : 'bajó de'} ${disparadas[0].valor}`
        : ''
    };
  }

  /* 5-JOB · vacantes abiertas a LatAm que todavía no viste.
     "Nueva para vos" ≠ "recién publicada": se compara contra
     jt_radar_conocidas, que es lo que usa el radar de 5-JOB. */
  function fVacantes() {
    if (!_jobs) return { estado: 'sin-fuente', n: 0, mod: 'jobs' };
    const jobs = Array.isArray(_jobs.jobs) ? _jobs.jobs : [];
    if (!jobs.length) return { estado: 'sin-datos', n: 0, mod: 'jobs' };

    const vistas = new Set(arr('jt_radar_conocidas'));
    const abiertas = jobs.filter(j => j.elegibilidad === 'abierta');
    const nuevas = abiertas.filter(j => !vistas.has(j.url));
    const primera = nuevas.slice().sort((a, b) => (b.score || 0) - (a.score || 0))[0];

    return {
      estado: _estado(abiertas.length, nuevas.length), n: nuevas.length, mod: 'jobs',
      detalle: primera ? `${primera.titulo} · ${primera.empresa}`.slice(0, 90) : '',
      extra: vistas.size === 0 && nuevas.length
        ? 'Es tu primera visita al radar: todas cuentan como nuevas.' : ''
    };
  }

  /* 10-SYS · entregas vencidas o dentro de 7 días.
     Tarea: { id, text, subj, priority, due:'YYYY-MM-DD'|'', done, created } */
  function fEntregas() {
    const all = arr('sys_tasks');
    const pend = all.filter(t => !t.done);
    const conFecha = pend.filter(t => t.due);
    const cerca = conFecha
      .map(t => ({ t, d: diasHasta(t.due) }))
      .filter(x => x.d <= 7)
      .sort((a, b) => a.d - b.d);

    return {
      estado: _estado(all.length, cerca.length), n: cerca.length, mod: 'systems',
      detalle: cerca.length
        ? `${(cerca[0].t.text || '').slice(0, 70)} · ${cerca[0].d < 0 ? 'vencida' : cerca[0].d === 0 ? 'hoy' : 'en ' + cerca[0].d + ' d'}`
        : '',
      items: cerca.slice(0, 4).map(x => ({ id: x.t.id, text: x.t.text, dias: x.d }))
    };
  }

  /* 9-GOA · hábitos sin marcar hoy. { id, text, icon, log:{'YYYY-MM-DD':bool} } */
  function fHabitos() {
    const all = arr('sb_habits');
    const hoy = hoyStr();
    const sin = all.filter(h => !(h.log && h.log[hoy]));
    return {
      estado: _estado(all.length, sin.length), n: sin.length, mod: 'goals',
      items: sin.slice(0, 6).map(h => ({ id: h.id, text: h.text, icon: h.icon || '🎯' })),
      hechos: all.length - sin.length, total: all.length
    };
  }

  /* 3-ENG · tarjetas para repasar.
     Espejo EXACTO de eng-practice.js:_genSRS → (!c.due || c.due <= now).
     Ese "!c.due" hace que las tarjetas creadas desde 13-NOT — que usan
     `nextReview` en vez de `due` — cuenten siempre como vencidas. Es un
     defecto de 3-ENG, no mío: dos productores escriben formas distintas
     en el mismo mazo. Lo replico para no dar un número que contradiga al
     módulo, y queda anotado como tarea del plan. */
  function fSrs() {
    const deck = arr('eng_srs_deck');
    const now = Date.now();
    const due = deck.filter(c => !c.due || c.due <= now);
    return { estado: _estado(deck.length, due.length), n: due.length, mod: 'english', total: deck.length };
  }

  /* ── Acciones (lo único que escribe) ───────────────────────── */

  /* 9-GOA · sb_habits está en SYNC_REGISTRY (Tier 2): el proxy de
     cloud-sync intercepta este setItem y lo sube solo. */
  function marcarHabito(id) {
    const all = arr('sb_habits');
    const h = all.find(x => x.id === id);
    if (!h) return;
    if (!h.log) h.log = {};
    h.log[hoyStr()] = true;
    try { localStorage.setItem('sb_habits', JSON.stringify(all)); } catch (e) { console.warn('[HOY]', e && e.message); }
    render();
  }

  /* 10-SYS · sys_tasks es tabla dedicada (Tier 1) y está en SKIP_KEYS:
     el proxy lo IGNORA a propósito. Escribir solo con setItem guardaría
     local y no sincronizaría — marcarías la tarea acá y en el otro PC
     seguiría pendiente. Por eso se replica el CLOUD.push() explícito que
     hace systems_logic.js:saveTasks. */
  function completarTarea(id) {
    const all = arr('sys_tasks');
    const t = all.find(x => String(x.id) === String(id));
    if (!t) return;
    t.done = true;
    try { localStorage.setItem('sys_tasks', JSON.stringify(all)); } catch (e) { console.warn('[HOY]', e && e.message); }
    try {
      if (window.CLOUD && CLOUD.push) {
        CLOUD.push('sys_tasks', { ...t, id: String(t.id), updated_at: new Date().toISOString() });
      }
    } catch (e) { console.warn('[HOY] push sys_tasks', e && e.message); }
    render();
  }

  /* ── Carga de los archivos de mismo origen ─────────────────── */
  async function cargar() {
    if (_cargando) return;
    _cargando = true;
    const dia = hoyStr();
    const pedir = async ruta => {
      try {
        const r = await fetch(`${ruta}?d=${dia}`, { cache: 'no-cache' });
        return r.ok ? await r.json() : null;
      } catch { return null; }
    };
    /* Los dos archivos se piden siempre. Primero hice el de macro
       condicional a que hubiera alertas configuradas, para ahorrar 26 KB.
       Al probarlo salió el defecto: si la primera alerta se crea después
       de cargar la página, el panel mostraba «no se pudo leer la fuente»
       cuando en realidad nunca la había pedido — un mensaje que miente
       sobre la causa. La rama ahorraba poco y creaba un estado falso. */
    const [j, m] = await Promise.all([
      pedir('data/jobs-feed.json'),
      pedir('data/macro-co.json')
    ]);
    _jobs = j; _macro = m;
    _cargando = false;
    render();
  }

  /* ── Render ──────────────────────────────────────────────────── */

  function tarjeta(f, icono, titulo, verbo) {
    if (f.estado !== 'pendiente') return '';
    return `<button class="hoy-c hoy-go" data-mod="${esc(f.mod)}">
      <span class="hoy-n">${f.n}</span>
      <span class="hoy-t">${icono} ${esc(titulo)}</span>
      ${f.detalle ? `<span class="hoy-d">${esc(f.detalle)}</span>` : ''}
      ${f.extra ? `<span class="hoy-x">${esc(f.extra)}</span>` : ''}
      <span class="hoy-ir">${esc(verbo)} →</span>
    </button>`;
  }

  /* Frescura de los archivos que bajan del recolector. Un panel que
     muestra vacantes tiene que decir de cuándo son. */
  function frescura() {
    const gen = _jobs && _jobs.generatedAt;
    if (!gen) return '';
    const h = (Date.now() - Date.parse(gen)) / 3600000;
    if (!isFinite(h)) return '';
    const viejo = h > 36;
    const cuando = h < 1 ? 'hace minutos' : h < 24 ? `hace ${Math.round(h)} h` : `hace ${Math.round(h / 24)} d`;
    return `<span class="hoy-fresh ${viejo ? 'hoy-fresh-old' : ''}">
      ${viejo ? '⚠ vacantes de' : '✓ vacantes de'} ${cuando}</span>`;
  }

  function render() {
    const host = document.getElementById('hoyPanel');
    if (!host) return;

    const F = {
      alertas: fAlertas(), tesis: fTesis(), vacantes: fVacantes(),
      entregas: fEntregas(), habitos: fHabitos(), srs: fSrs()
    };

    const cards = [
      tarjeta(F.alertas,  '🔔', F.alertas.n === 1 ? 'regla se cumplió' : 'reglas se cumplieron', 'Ver el radar'),
      tarjeta(F.tesis,    '🧮', F.tesis.n === 1 ? 'tesis para revisar' : 'tesis para revisar',   'Ver el laboratorio'),
      tarjeta(F.vacantes, '💼', F.vacantes.n === 1 ? 'vacante nueva abierta a LatAm' : 'vacantes nuevas abiertas a LatAm', 'Ver el radar'),
      tarjeta(F.srs,      '🇺🇸', F.srs.n === 1 ? 'tarjeta para repasar' : 'tarjetas para repasar', 'Practicar')
    ].filter(Boolean);

    // Entregas: con acción directa (✓ completar), por eso no usa tarjeta().
    let entregas = '';
    if (F.entregas.estado === 'pendiente') {
      entregas = `<div class="hoy-c hoy-lista">
        <span class="hoy-n">${F.entregas.n}</span>
        <span class="hoy-t">📚 ${F.entregas.n === 1 ? 'entrega próxima' : 'entregas próximas'}</span>
        <div class="hoy-items">
          ${F.entregas.items.map(i => `<div class="hoy-item">
            <button class="hoy-check" data-tarea="${esc(i.id)}" title="Marcar como hecha">○</button>
            <span class="hoy-item-t">${esc((i.text || '').slice(0, 60))}</span>
            <span class="hoy-item-d ${i.dias < 0 ? 'hoy-venc' : ''}">${i.dias < 0 ? 'vencida' : i.dias === 0 ? 'hoy' : i.dias + ' d'}</span>
          </div>`).join('')}
        </div>
        <button class="hoy-ir hoy-go" data-mod="systems">Ver 10-SYS →</button>
      </div>`;
    }

    // Hábitos: marcables desde acá.
    let habitos = '';
    if (F.habitos.estado === 'pendiente') {
      habitos = `<div class="hoy-c hoy-lista">
        <span class="hoy-n">${F.habitos.n}</span>
        <span class="hoy-t">✅ ${F.habitos.n === 1 ? 'hábito sin marcar' : 'hábitos sin marcar'}</span>
        <span class="hoy-d">${F.habitos.hechos} de ${F.habitos.total} hechos hoy</span>
        <div class="hoy-chips">
          ${F.habitos.items.map(h => `<button class="hoy-chip" data-habito="${esc(h.id)}">
            ${esc(h.icon)} ${esc((h.text || '').slice(0, 26))}</button>`).join('')}
        </div>
      </div>`;
    }

    const todo = cards.join('') + entregas + habitos;

    // Nada pendiente. Acá se separa lo que está al día de lo que nunca
    // se usó — decir "todo al día" de un módulo vacío sería mentir.
    let vacio = '';
    if (!todo) {
      const nombres = { alertas:'alertas', tesis:'tesis', vacantes:'vacantes', entregas:'entregas', habitos:'hábitos', srs:'inglés' };
      const alDia   = Object.keys(F).filter(k => F[k].estado === 'al-dia').map(k => nombres[k]);
      const sinDato = Object.keys(F).filter(k => F[k].estado === 'sin-datos').map(k => nombres[k]);
      const sinFuente = Object.keys(F).filter(k => F[k].estado === 'sin-fuente').map(k => nombres[k]);
      vacio = `<div class="hoy-vacio">
        ${alDia.length ? `<b>Al día:</b> ${alDia.join(' · ')}.` : ''}
        ${sinDato.length ? `<span class="hoy-sindato"><b>Sin datos todavía:</b> ${sinDato.join(' · ')} — esos módulos no tienen nada cargado, no es que estén al día.</span>` : ''}
        ${sinFuente.length ? `<span class="hoy-sindato">No se pudo leer la fuente de: ${sinFuente.join(' · ')}.</span>` : ''}
        ${!alDia.length && !sinDato.length && !sinFuente.length ? 'Cargando…' : ''}
      </div>`;
    }

    host.innerHTML = `
      <div class="hoy-head">
        <span class="hoy-h1">⚡ Qué requiere tu atención</span>
        ${frescura()}
      </div>
      <div class="hoy-grid">${todo}</div>
      ${vacio}`;

    host.querySelectorAll('[data-mod]').forEach(b => {
      b.onclick = e => { e.stopPropagation(); if (window.Cerebro) Cerebro.go(b.dataset.mod); };
    });
    host.querySelectorAll('[data-habito]').forEach(b => {
      b.onclick = e => { e.stopPropagation(); marcarHabito(b.dataset.habito); };
    });
    host.querySelectorAll('[data-tarea]').forEach(b => {
      b.onclick = e => { e.stopPropagation(); completarTarea(b.dataset.tarea); };
    });
  }

  function init() {
    if (!document.getElementById('hoyPanel')) return;
    render();   // pinta ya con lo que hay en localStorage
    cargar();   // y completa cuando lleguen los archivos
  }

  return { init, render, marcarHabito, completarTarea,
           fuentes: () => ({ alertas:fAlertas(), tesis:fTesis(), vacantes:fVacantes(),
                             entregas:fEntregas(), habitos:fHabitos(), srs:fSrs() }) };
})();

window.HOY = HOY;
