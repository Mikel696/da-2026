/* ═══════════════════════════════════════════════════════════════
   DA-2026 · 14-WORK · Simetrik Copilot
   ─────────────────────────────────────────────────────────────
   Storage:
     - work_cases     [{id,title,client,severity,status,body,date}]
     - work_errors    [{id,title,code,body,date}]
     - work_learnings [{id,title,tag,body,date}]
     - work_kb        string (raw markdown of personal Simetrik KB)
     - work_nb_meta   notebook list (NotNB-style)
     - work_nb_data   notebook page data
   Reuses nb-shared.js for the cuadernos sub-module — same UX as
   13-NOT and 10-SYS. The Copilot tab generates structured prompts
   that include KB + recent cases as context, so Claude has Miguel's
   Simetrik workflow pre-loaded when answering.
═══════════════════════════════════════════════════════════════ */

const WORK = (function(){
  'use strict';

  const K_CASES = 'work_cases';
  const K_ERRORS = 'work_errors';
  const K_LEARN = 'work_learnings';
  const K_KB = 'work_kb';
  const K_KB_ATTS = 'work_kb_atts';
  const K_MOIF = 'work_moif_meetings';

  /* Temp staging for attachments before saving a new item */
  const _pendAtts = { case: [], err: [], learn: [], moif: [] };
  function _renderPendAtts(prefix){
    const el = document.getElementById(prefix+'PendAtts');
    if (!el) return;
    const arr = _pendAtts[prefix] || [];
    if (!arr.length) { el.innerHTML = ''; return; }
    el.innerHTML = arr.map((a,i) =>
      `<span class="pend-att"><span class="pa-ic">${(window.NBShared?NBShared.iconForExt(a.ext):'📄')}</span>${esc(a.name)}<span class="pa-rm" onclick="WORK.removePendAtt('${prefix}',${i})">✕</span></span>`
    ).join('');
  }
  async function addPendAtt(prefix){
    if (!window.NBShared) return alert('Módulo de adjuntos no cargado (recargá la página).');
    try {
      const r = await NBShared.pickAndStoreAttachment(prefix);
      if (!r) return;
      _pendAtts[prefix] = _pendAtts[prefix] || [];
      _pendAtts[prefix].push(r);
      _renderPendAtts(prefix);
    } catch (e) { if (e && e.message !== 'No file') console.warn(e); }
  }
  function removePendAtt(prefix, idx){
    if (!_pendAtts[prefix]) return;
    const a = _pendAtts[prefix][idx];
    if (a && a.id && window.NBShared) NBShared.deleteBlob(a.id).catch(()=>{});
    _pendAtts[prefix].splice(idx,1);
    _renderPendAtts(prefix);
  }
  function _kindToKey(kind){
    return kind==='case'?K_CASES : kind==='err'?K_ERRORS : kind==='learn'?K_LEARN : kind==='moif'?K_MOIF : null;
  }
  async function addAttToItem(kind, id){
    if (!window.NBShared) return alert('Módulo de adjuntos no cargado.');
    const K = _kindToKey(kind);
    if (!K) return;
    try {
      const r = await NBShared.pickAndStoreAttachment(kind);
      if (!r) return;
      const list = _load(K);
      const it = list.find(x => x.id === id);
      if (!it) return;
      it.attachments = it.attachments || [];
      it.attachments.push(r); // r ya incluye cloud:bool
      _save(K, list);
      render();
      if (!r.cloud) {
        console.warn('[14-WORK] Adjunto guardado SOLO local — verificá el bucket "attachments" de Supabase y RLS.');
      }
    } catch (e) { if (e && e.message !== 'No file') console.warn(e); }
  }
  async function removeAttFromItem(kind, id, attId){
    const K = _kindToKey(kind);
    if (!K) return;
    const list = _load(K);
    const it = list.find(x => x.id === id);
    if (!it || !it.attachments) return;
    it.attachments = it.attachments.filter(a => a.id !== attId);
    if (window.NBShared) NBShared.deleteBlob(attId).catch(()=>{});
    _save(K, list);
    // Push inmediato al cloud (sin debounce) para que otros devices vean el delete en tiempo real
    if (window.CLOUD && window.CLOUD.pushNow) window.CLOUD.pushNow(K).catch(()=>{});
    render();
  }
  /** Re-sync an attachment blob from local IDB to Supabase Storage.
   *  Para arreglar adjuntos viejos que se guardaron antes del cloud sync. */
  async function syncAttToCloud(kind, id, attId){
    if (!window.NBShared) return;
    try {
      const rec = await NBShared.getBlob(attId);
      if (!rec || !rec.blob) { alert('Blob no encontrado localmente. Tenés que abrir esto en el device donde subiste el archivo originalmente.'); return; }
      const res = await NBShared.cloudUploadAttachment(attId, rec.blob);
      if (!res.ok) {
        if (res.reason === 'not-authenticated') alert('No hay sesión activa. Iniciá sesión primero.');
        else if (res.reason === 'upload-failed' && res.error) alert('Falló el upload a Supabase Storage:\n\n' + (res.error.message||res.error) + '\n\nVerificá que el bucket "attachments" exista en tu Supabase project con políticas RLS para tu usuario.');
        else alert('No se pudo sincronizar a la nube. Ver consola para detalles.');
        return;
      }
      // Marcar como cloud:true en la metadata del item
      const K = _kindToKey(kind);
      if (!K) return;
      const list = _load(K);
      const it = list.find(x => x.id === id);
      if (it && it.attachments) {
        const a = it.attachments.find(a => a.id === attId);
        if (a) { a.cloud = true; _save(K, list); }
      }
      render();
      alert('✓ Archivo sincronizado a la nube. Ya podés descargarlo desde otro device.');
    } catch (e) { console.warn(e); alert('Error sincronizando: ' + (e.message||e)); }
  }
  async function syncKbAttToCloud(attId){
    if (!window.NBShared) return;
    try {
      const rec = await NBShared.getBlob(attId);
      if (!rec || !rec.blob) { alert('Blob no encontrado localmente.'); return; }
      const res = await NBShared.cloudUploadAttachment(attId, rec.blob);
      if (!res.ok) {
        alert('Falló el upload. Detalle: ' + (res.reason||'')+(res.error?' · '+(res.error.message||res.error):''));
        return;
      }
      const list = _loadKbAtts();
      const a = list.find(a => a.id === attId);
      if (a) { a.cloud = true; localStorage.setItem(K_KB_ATTS, JSON.stringify(list)); }
      renderKbAtts();
      alert('✓ Archivo sincronizado a la nube.');
    } catch(e){ console.warn(e); alert('Error: '+(e.message||e)); }
  }
  /** Re-sync TODOS los adjuntos locales a la nube */
  function _explainSyncError(r){
    const d = window.CLOUD && window.CLOUD.diagnostics ? window.CLOUD.diagnostics() : {};
    let msg = '❌ No se pudo sincronizar.\n\n';
    msg += 'Motivo: ' + (r.reason || 'desconocido') + '\n';
    if (r.detail) msg += '\nDetalle: ' + r.detail + '\n';
    msg += '\n── Estado actual ──\n';
    msg += '• SB cargado: ' + (d.sb_loaded?'sí':'no') + '\n';
    msg += '• AUTH cargado: ' + (d.auth_loaded?'sí':'no') + '\n';
    msg += '• Usuario logueado: ' + (d.uid || 'NO · sesión inactiva') + '\n';
    msg += '• Sincronización corriendo: ' + (d.syncing?'sí':'no') + '\n';
    msg += '• Sync inicial completado: ' + (d.initial_sync_done?'sí':'no') + '\n';
    msg += '• Cola de pendientes: ' + (d.queue_size||0) + '\n';
    if (r.reason === 'not-authenticated') {
      msg += '\n👉 Solución: iniciá sesión arriba a la derecha.';
    } else if (r.reason === 'pull-failed') {
      msg += '\n👉 Probable causa: la tabla "app_state" no existe en tu Supabase, o no tiene políticas RLS configuradas. Revisá Supabase Dashboard → Database → Tables.';
    } else if (r.errors && r.errors.length) {
      msg += '\n── Errores específicos por key ──\n' + r.errors.slice(0,5).join('\n');
    }
    return msg;
  }
  /* ── Sync toast no-bloqueante ── */
  function _syncToast(msg, kind){
    let el = document.getElementById('syncToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'syncToast';
      el.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;padding:14px 18px;border-radius:10px;font-size:13px;font-weight:600;font-family:inherit;box-shadow:0 10px 40px rgba(0,0,0,.4);max-width:340px;line-height:1.5;transition:opacity .25s,transform .25s';
      document.body.appendChild(el);
    }
    const palette = {
      info: { bg:'rgba(6,182,212,.95)', color:'#001016' },
      ok: { bg:'rgba(34,197,94,.95)', color:'#001f0d' },
      err: { bg:'rgba(239,68,68,.95)', color:'#fff' },
      load: { bg:'rgba(99,102,241,.95)', color:'#fff' },
    };
    const p = palette[kind||'info'];
    el.style.background = p.bg;
    el.style.color = p.color;
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
    el.textContent = msg;
    return el;
  }
  function _syncToastHide(delay){
    const el = document.getElementById('syncToast');
    if (!el) return;
    setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateY(8px)'; }, delay||1500);
  }
  function _setSyncBtnsDisabled(busy){
    document.querySelectorAll('[data-syncbtn]').forEach(b => {
      b.disabled = busy;
      b.style.opacity = busy ? '.55' : '';
      b.style.cursor = busy ? 'wait' : '';
    });
  }
  function _setBtnBusy(ev, label){
    if (!ev || !ev.currentTarget) return null;
    const b = ev.currentTarget;
    b.dataset._orig = b.dataset._orig || b.textContent;
    b.textContent = label;
    return b;
  }
  function _restoreBtn(b){
    if (b && b.dataset._orig) { b.textContent = b.dataset._orig; delete b.dataset._orig; }
  }
  /** Force PULL cloud → local. */
  async function forceResync(ev){
    if (!window.CLOUD || !window.CLOUD.forceResyncFromCloud) return alert('cloud-sync.js no cargó. Refresca la página.');
    const btn = _setBtnBusy(ev, '⏳ Bajando…');
    _setSyncBtnsDisabled(true);
    _syncToast('⏳ Sincronizando desde la nube… (puede tardar unos segundos)', 'load');
    try {
      const r = await window.CLOUD.forceResyncFromCloud();
      if (!r.ok) {
        _syncToast('❌ ' + (r.detail || r.reason), 'err');
        _syncToastHide(6000);
        console.warn('[14-WORK] sync error', r);
        return;
      }
      render();
      _syncToast('✓ ' + r.count + ' keys descargadas del cloud', 'ok');
      _syncToastHide(2500);
    } finally {
      _restoreBtn(btn);
      _setSyncBtnsDisabled(false);
    }
  }
  /** Force PUSH local → cloud. */
  async function forcePush(ev){
    if (!window.CLOUD || !window.CLOUD.forcePushAll) return alert('cloud-sync.js no cargó. Refresca la página.');
    if (!confirm('Esto sube tu estado local al cloud, sobrescribiendo lo que haya allá. ¿Continuar?')) return;
    const btn = _setBtnBusy(ev, '⏳ Subiendo…');
    _setSyncBtnsDisabled(true);
    _syncToast('⏳ Subiendo al cloud… (puede tardar unos segundos)', 'load');
    try {
      const r = await window.CLOUD.forcePushAll();
      if (!r.ok) {
        _syncToast('❌ ' + (r.detail || r.reason), 'err');
        _syncToastHide(6000);
        console.warn('[14-WORK] push error', r);
        return;
      }
      _syncToast('✓ Pusheadas ' + r.pushed + ' keys' + (r.failed?' · '+r.failed+' fallaron':''), r.failed?'err':'ok');
      _syncToastHide(3000);
    } finally {
      _restoreBtn(btn);
      _setSyncBtnsDisabled(false);
    }
  }
  /** Muestra el estado completo de la sincronización */
  function showSyncDiagnostics(){
    const d = window.CLOUD && window.CLOUD.diagnostics ? window.CLOUD.diagnostics() : null;
    if (!d) { alert('cloud-sync.js no está cargado.'); return; }
    let msg = '🔍 Diagnóstico de sincronización\n\n';
    msg += 'Supabase client (SB): ' + (d.sb_loaded?'✓ cargado':'✗ NO cargado') + '\n';
    msg += 'Auth module (AUTH): ' + (d.auth_loaded?'✓ cargado':'✗ NO cargado') + '\n';
    msg += 'Usuario logueado: ' + (d.uid ? '✓ ' + d.uid : '✗ NO · iniciá sesión') + '\n';
    msg += 'Sincronización en curso: ' + (d.syncing?'sí (esperá)':'no') + '\n';
    msg += 'Sync inicial completado: ' + (d.initial_sync_done?'✓ sí':'✗ no') + '\n';
    msg += 'Última sync hace: ' + (d.last_sync_age_s != null ? d.last_sync_age_s+'s' : 'nunca') + '\n';
    msg += 'Cola de pendientes: ' + d.queue_size + '\n\n';
    if (!d.uid) msg += '⚠️ NO HAY SESIÓN ACTIVA. Iniciá sesión arriba a la derecha y reintentá.';
    else if (!d.initial_sync_done) msg += '⚠️ El sync inicial no terminó. Refresca la página.';
    else msg += '✓ Todo OK. Podés usar "Bajar del cloud" o "Subir al cloud".';
    alert(msg);
  }
  /** SMART SYNC · UN SOLO BOTÓN HACE TODO:
   *  1. Diagnóstico previo (auth · sb · ready) → si no está listo, bail con toast claro.
   *  2. Sync bidireccional (fullSyncAll · reconcile por timestamp · pulla y pushea lo necesario).
   *  3. Compare local vs cloud → detecta mismatches que sobrevivieron.
   *  4. Re-render TODAS las secciones del módulo (Cases, Errors, Learnings, MOIF, KB, Dict, Cuadernos, editores).
   *  5. Toast verde si todo OK, alert con detalles si hay mismatches.
   */
  async function smartSync(ev){
    const btn = ev && ev.currentTarget;
    if (btn) { btn.dataset._orig = btn.dataset._orig || btn.textContent; btn.textContent = '⏳ Sincronizando…'; btn.disabled = true; btn.style.opacity = '.6'; }
    _syncToast('⏳ Sincronizando · 1/4 verificando sesión…', 'load');
    try {
      // ── PASO 1: Diagnóstico ──
      if (!window.CLOUD || !window.CLOUD.diagnostics) {
        _syncToast('❌ cloud-sync no cargó. Refresca la página (F5).', 'err'); _syncToastHide(6000); return;
      }
      const d = window.CLOUD.diagnostics();
      if (!d.sb_loaded || !d.auth_loaded) {
        _syncToast('❌ Supabase no cargó (' + (d.sb_loaded?'auth':'sb') + '). Refresca con F5.', 'err'); _syncToastHide(7000); return;
      }
      if (!d.uid) {
        _syncToast('❌ No hay sesión activa. Iniciá sesión arriba a la derecha.', 'err'); _syncToastHide(7000); return;
      }
      if (!d.initial_sync_done) {
        _syncToast('⏳ El sync inicial todavía corre · aguardá unos segundos y reintentá', 'err'); _syncToastHide(5000); return;
      }

      // ── PASO 2: Sync bidireccional ──
      _syncToast('⏳ Sincronizando · 2/4 reconcile bidireccional…', 'load');
      try { await window.CLOUD.fullSyncAll(); } catch(e) { console.warn('[smartSync] fullSyncAll error', e); }

      // ── PASO 3: Compare silencioso ──
      _syncToast('⏳ Sincronizando · 3/4 verificando consistencia…', 'load');
      const report = await _silentCompare();

      // ── PASO 4: Re-render TODO ──
      _syncToast('⏳ Sincronizando · 4/4 refrescando vistas…', 'load');
      try { render(); } catch(e) { console.warn(e); }
      try { if (eco && eco.dictRender) eco.dictRender(); } catch(e) { console.warn(e); }
      try { if (window.WorkNB && WorkNB.render) WorkNB.render(); } catch(e) { console.warn(e); }
      // Refrescar editores rich-text (Workflow / Curso) si el localStorage cambió
      try {
        const wf = document.getElementById('wfBody');
        if (wf) wf.innerHTML = localStorage.getItem('work_eco_workflow') || '';
        const cu = document.getElementById('cuBody');
        if (cu) cu.innerHTML = localStorage.getItem('work_eco_course') || '';
        const kb = document.getElementById('kbBody');
        if (kb) kb.value = localStorage.getItem(K_KB) || '';
      } catch(e) { console.warn(e); }

      // ── RESULTADO ──
      const mismatches = report.mismatches || [];
      if (mismatches.length === 0) {
        _syncToast('✓ Sincronizado · ' + d.uid.slice(0,8) + ' · todo coincide local↔cloud', 'ok');
        _syncToastHide(3500);
      } else {
        _syncToast('⚠ Sincronizado con ' + mismatches.length + ' diferencia(s) · click acá para ver detalles', 'err');
        _syncToastHide(8000);
        // Mostrar alert con el detalle solo si hay algo concreto
        setTimeout(() => {
          if (confirm('Sincronización terminada con diferencias detectadas:\n\n' + mismatches.join('\n').slice(0,1200) + '\n\n¿Querés ver el comparativo completo?')) {
            compareLocalVsCloud();
          }
        }, 400);
      }
    } finally {
      if (btn) { btn.disabled = false; btn.style.opacity = ''; if (btn.dataset._orig) { btn.textContent = btn.dataset._orig; delete btn.dataset._orig; } }
    }
  }

  /** Versión silenciosa de compareLocalVsCloud que devuelve un report en vez de mostrar alert. */
  async function _silentCompare(){
    const out = { mismatches: [] };
    if (!window.SB || !window.AUTH || !window.AUTH.getUserId()) return out;
    const uid = window.AUTH.getUserId();
    const keys = ['work_cases','work_errors','work_learnings','work_kb_atts','work_nb_meta','work_nb_data','work_moif_meetings'];
    for (const k of keys) {
      const localRaw = localStorage.getItem(k);
      let localCount = 0, localObj = null;
      try {
        const parsed = JSON.parse(localRaw||'null');
        localObj = parsed;
        if (Array.isArray(parsed)) localCount = parsed.length;
        else if (parsed && typeof parsed === 'object') localCount = Object.keys(parsed).length;
      } catch{}
      let cloudCount = 0, cloudObj = null;
      try {
        const { data, error } = await window.SB.from('app_state').select('payload').eq('user_id', uid).eq('store_key', k).maybeSingle();
        if (error) { out.mismatches.push(k+': error · '+error.message); continue; }
        if (data) {
          cloudObj = data.payload;
          if (Array.isArray(data.payload)) cloudCount = data.payload.length;
          else if (data.payload && typeof data.payload === 'object') cloudCount = Object.keys(data.payload).length;
        }
      } catch(e) { out.mismatches.push(k+': exception · '+(e.message||e)); continue; }
      if (localCount !== cloudCount) {
        out.mismatches.push(k+': local='+localCount+' · cloud='+cloudCount);
      }
      // Detalle de attachments
      if (['work_learnings','work_cases','work_errors','work_moif_meetings'].includes(k) && localObj && cloudObj) {
        const local = Array.isArray(localObj)?localObj:[];
        const cloud = Array.isArray(cloudObj)?cloudObj:[];
        local.forEach(l => {
          const cl = cloud.find(c => c.id === l.id);
          const la = (l.attachments||[]).length;
          const ca = cl ? (cl.attachments||[]).length : 'N/A';
          if (la !== ca) out.mismatches.push('  └ "'+(l.title||l.id)+'": local='+la+' atts · cloud='+ca);
        });
      }
    }
    return out;
  }

  /** Compara local vs cloud para todos los stores. */
  async function compareLocalVsCloud(){
    if (!window.SB || !window.AUTH || !window.AUTH.getUserId()) { alert('No hay sesión activa.'); return; }
    const uid = window.AUTH.getUserId();
    const keys = ['work_cases','work_errors','work_learnings','work_kb_atts','work_nb_meta','work_nb_data'];
    let report = '🔍 Comparación Local vs Cloud\n\n';
    for (const k of keys) {
      const localRaw = localStorage.getItem(k);
      let localCount = 0;
      let localObj = null;
      try {
        const parsed = JSON.parse(localRaw||'null');
        localObj = parsed;
        if (Array.isArray(parsed)) localCount = parsed.length;
        else if (parsed && typeof parsed === 'object') localCount = Object.keys(parsed).length;
      } catch{}
      let cloudCount = 0, cloudTs = '—', err = null, cloudObj = null;
      try {
        const { data, error } = await window.SB.from('app_state').select('payload, updated_at').eq('user_id', uid).eq('store_key', k).maybeSingle();
        if (error) err = error.message;
        else if (data) {
          cloudObj = data.payload;
          if (Array.isArray(data.payload)) cloudCount = data.payload.length;
          else if (data.payload && typeof data.payload === 'object') cloudCount = Object.keys(data.payload).length;
          cloudTs = data.updated_at;
        }
      } catch(e) { err = e.message; }
      const match = localCount === cloudCount ? '✓' : '⚠️ MISMATCH';
      report += `${match} ${k}\n  Local: ${localCount} items  ·  Cloud: ${cloudCount} items\n  Cloud TS: ${cloudTs}\n` + (err?`  Error: ${err}\n`:'');
      // Attachments details for learnings/cases/errors
      if (['work_learnings','work_cases','work_errors'].includes(k) && localObj && cloudObj) {
        const local = Array.isArray(localObj)?localObj:[];
        const cloud = Array.isArray(cloudObj)?cloudObj:[];
        local.forEach(l => {
          const cl = cloud.find(c => c.id === l.id);
          const la = (l.attachments||[]).length;
          const ca = cl ? (cl.attachments||[]).length : 'N/A';
          if (la !== ca) report += `    ⚠️ "${l.title}": local=${la} attachments · cloud=${ca}\n`;
        });
      }
      // Notebook attachments
      if (k === 'work_nb_data' && localObj && cloudObj) {
        Object.keys(localObj).forEach(nbId => {
          const nbL = localObj[nbId];
          const nbC = cloudObj[nbId];
          if (!nbC) { report += `    ⚠️ Cuaderno "${nbId}": en local, NO en cloud\n`; return; }
          const pagesL = nbL.pages || [];
          const pagesC = nbC.pages || [];
          pagesL.forEach(pL => {
            const pC = pagesC.find(p => p.id === pL.id);
            const aL = (pL.attachments||[]).length;
            const aC = pC ? (pC.attachments||[]).length : 'N/A';
            if (aL !== aC) report += `    ⚠️ Página "${pL.title||'(sin título)'}" en cuad ${nbId}: local=${aL} · cloud=${aC}\n`;
            // List specific files
            (pL.attachments||[]).forEach(a => {
              if (pC && !(pC.attachments||[]).find(c => c.id === a.id)) {
                report += `       └─ Local tiene "${a.name}" · Cloud NO\n`;
              }
            });
            if (pC) (pC.attachments||[]).forEach(a => {
              if (!(pL.attachments||[]).find(l => l.id === a.id)) {
                report += `       └─ Cloud tiene "${a.name}" · Local NO\n`;
              }
            });
          });
        });
      }
      report += '\n';
    }
    alert(report);
    console.log(report);
  }
  /* ── Guard de edición ──────────────────────────────────────────
     NUNCA re-renderizar mientras el usuario escribe: el re-render
     reconstruye el contenteditable y borra lo tipeado. Si llega un
     cambio de nube mientras editás, se aplica SILENCIOSO a
     localStorage (sin tocar el DOM) y el re-render se difiere hasta
     que dejes de escribir (focusout). Los datos no se pierden:
     _commitNow lee localStorage fresco al guardar. */
  function _nbEditing(){
    const a = document.activeElement;
    return !!(a && (a.isContentEditable || a.tagName === 'INPUT' || a.tagName === 'TEXTAREA'));
  }
  let _nbRenderPending = false;
  function _renderNbSafe(){
    if (_nbEditing()) { _nbRenderPending = true; return; }
    _nbRenderPending = false;
    if (window.WorkNB && WorkNB.render) { try { WorkNB.render(); } catch(e){ console.warn(e); } }
  }
  // Cuando dejás de editar, aplicá el render diferido (tras el autosave de 500ms)
  document.addEventListener('focusout', () => {
    if (!_nbRenderPending) return;
    setTimeout(() => { if (_nbRenderPending && !_nbEditing()) _renderNbSafe(); }, 700);
  }, true);

  /** Re-render cuando hay auto-resync silencioso (nunca interrumpe la edición) */
  window.addEventListener('cloud:auto_resynced', () => {
    if (_nbEditing()) { _nbRenderPending = true; return; }
    try { render(); if (eco && eco.dictRender) eco.dictRender(); _renderNbSafe(); } catch(e){ console.warn(e); }
  });

  /** Si un push inmediato falla, mostrar toast rojo bien visible. */
  window.addEventListener('cloud:push_failed', (e) => {
    const d = e.detail || {};
    const msg = '⚠️ El cambio en "' + (d.key||'?') + '" NO se sincronizó al cloud. ' +
      (d.detail || d.reason || '') +
      ' · El cambio quedó SOLO local — puede revertirse al refrescar. Probar "⬆ Subir al cloud" arriba.';
    if (typeof _syncToast === 'function') {
      _syncToast(msg, 'err');
      _syncToastHide(8000);
    } else {
      console.error('[14-WORK] push failed:', d);
    }
  });

  /** Cambio entrante por realtime — aplica SIN avisos y SIN interrumpir la edición.
      El dato ya está mergeado en localStorage por cloud-sync; acá solo refrescamos
      la UI cuando es seguro (no estás escribiendo). */
  window.addEventListener('cloud:realtime_change', (e) => {
    const k = e.detail && e.detail.key;
    if (!(k && k.startsWith('work_'))) return;
    try {
      if (k === 'work_nb_meta' || k === 'work_nb_data') { _renderNbSafe(); }
      else if (k === 'work_eco_dict') { if (!_nbEditing() && eco && eco.dictRender) eco.dictRender(); }
      else if (!_nbEditing()) { render(); }
    } catch(err){ console.warn(err); }
  });

  async function syncAllAttsToCloud(){
    if (!window.NBShared) return;
    if (!confirm('Esto sube a la nube todos los adjuntos locales que aún no estén sincronizados. ¿Continuar?')) return;
    let done=0, fail=0, skip=0;
    const all = [
      ['case', K_CASES],
      ['err', K_ERRORS],
      ['learn', K_LEARN],
    ];
    for (const [kind, K] of all) {
      const list = _load(K);
      for (const it of list) {
        if (!it.attachments) continue;
        for (const a of it.attachments) {
          if (a.cloud) { skip++; continue; }
          try {
            const rec = await NBShared.getBlob(a.id);
            if (!rec || !rec.blob) { skip++; continue; }
            const res = await NBShared.cloudUploadAttachment(a.id, rec.blob);
            if (res.ok) { a.cloud = true; done++; } else fail++;
          } catch { fail++; }
        }
      }
      _save(K, list);
    }
    // KB
    const kbList = _loadKbAtts();
    for (const a of kbList) {
      if (a.cloud) { skip++; continue; }
      try {
        const rec = await NBShared.getBlob(a.id);
        if (!rec || !rec.blob) { skip++; continue; }
        const res = await NBShared.cloudUploadAttachment(a.id, rec.blob);
        if (res.ok) { a.cloud = true; done++; } else fail++;
      } catch { fail++; }
    }
    localStorage.setItem(K_KB_ATTS, JSON.stringify(kbList));
    render();
    alert('Sincronización completa.\n\n✓ Subidos: '+done+'\n✗ Fallidos: '+fail+'\n— Skipped: '+skip);
  }
  async function addKbAtt(){
    if (!window.NBShared) return alert('Módulo de adjuntos no cargado.');
    try {
      const r = await NBShared.pickAndStoreAttachment('kb');
      if (!r) return;
      const list = _loadKbAtts();
      list.push(r);
      localStorage.setItem(K_KB_ATTS, JSON.stringify(list));
      renderKbAtts();
    } catch (e) { if (e && e.message !== 'No file') console.warn(e); }
  }
  function removeKbAtt(attId){
    const list = _loadKbAtts().filter(a => a.id !== attId);
    localStorage.setItem(K_KB_ATTS, JSON.stringify(list));
    if (window.NBShared) NBShared.deleteBlob(attId).catch(()=>{});
    if (window.CLOUD && window.CLOUD.pushNow) window.CLOUD.pushNow(K_KB_ATTS).catch(()=>{});
    renderKbAtts();
  }
  function _loadKbAtts(){ try { return JSON.parse(localStorage.getItem(K_KB_ATTS)||'[]'); } catch { return []; } }
  function renderKbAtts(){
    const el = document.getElementById('kbAttsList');
    if (!el) return;
    const list = _loadKbAtts();
    if (!list.length) { el.innerHTML='<div style="font-size:11px;color:var(--t3);padding:6px 0">Sin archivos adjuntos.</div>'; return; }
    el.innerHTML = list.map(a => `
      <div class="nb-att">
        <span class="nb-att-ico">${window.NBShared?NBShared.iconForExt(a.ext):'📄'}</span>
        <div class="nb-att-info">
          <div class="nb-att-name" title="${esc(a.name)}">${esc(a.name)}</div>
          <div class="nb-att-meta">${(a.ext||'').toUpperCase()} · ${window.NBShared?NBShared.fmtBytes(a.size||0):a.size+' B'}</div>
        </div>
        ${_kbAttCloudBadge(a)}
        <button class="nb-att-btn" onclick="NBShared.downloadAttachment('${a.id}','${esc(a.name).replace(/'/g,'')}')" title="Descargar">⬇</button>
        <button class="nb-att-btn nb-att-del" onclick="WORK.removeKbAtt('${a.id}')" title="Eliminar">✕</button>
      </div>`).join('');
  }

  function _load(k){ try { return JSON.parse(localStorage.getItem(k)||'[]'); } catch { return []; } }
  function _save(k, v){ localStorage.setItem(k, JSON.stringify(v)); }
  function esc(s){ const d=document.createElement('div'); d.textContent=s==null?'':s; return d.innerHTML; }
  function fmtDate(iso){
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('es',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
  }

  /* ── CASES ─────────────────────────────────────────────────── */
  function saveCase(){
    const title = document.getElementById('caseTitle').value.trim();
    const client = document.getElementById('caseClient').value.trim();
    const severity = document.getElementById('caseSeverity').value;
    const status = document.getElementById('caseStatus').value;
    const body = document.getElementById('caseBody').value.trim();
    if (!title || !body) return alert('Título y descripción son obligatorios.');
    const list = _load(K_CASES);
    const attachments = (_pendAtts.case||[]).slice();
    list.push({ id:'c_'+Date.now(), title, client, severity, status, body, attachments, date:new Date().toISOString() });
    _save(K_CASES, list);
    _pendAtts.case = [];
    _renderPendAtts('case');
    clearForm('case');
    render();
  }

  function delCase(id){
    if (!confirm('¿Eliminar caso?')) return;
    const it = _load(K_CASES).find(c => c.id === id);
    if (it && it.attachments && window.NBShared) it.attachments.forEach(a => NBShared.deleteBlob(a.id).catch(()=>{}));
    _save(K_CASES, _load(K_CASES).filter(c => c.id !== id));
    if (window.CLOUD && window.CLOUD.pushNow) window.CLOUD.pushNow(K_CASES).catch(()=>{});
    render();
  }

  /* ── ERRORS ────────────────────────────────────────────────── */
  function saveError(){
    const title = document.getElementById('errTitle').value.trim();
    const code = document.getElementById('errCode').value.trim();
    const body = document.getElementById('errBody').value.trim();
    if (!title) return alert('Título obligatorio.');
    const list = _load(K_ERRORS);
    const attachments = (_pendAtts.err||[]).slice();
    list.push({ id:'e_'+Date.now(), title, code, body, attachments, date:new Date().toISOString() });
    _save(K_ERRORS, list);
    _pendAtts.err = [];
    _renderPendAtts('err');
    clearForm('err');
    render();
  }

  function delError(id){
    if (!confirm('¿Eliminar error?')) return;
    const it = _load(K_ERRORS).find(e => e.id === id);
    if (it && it.attachments && window.NBShared) it.attachments.forEach(a => NBShared.deleteBlob(a.id).catch(()=>{}));
    _save(K_ERRORS, _load(K_ERRORS).filter(e => e.id !== id));
    if (window.CLOUD && window.CLOUD.pushNow) window.CLOUD.pushNow(K_ERRORS).catch(()=>{});
    render();
  }

  /* ── LEARNINGS ─────────────────────────────────────────────── */
  function saveLearning(){
    const title = document.getElementById('learnTitle').value.trim();
    const tag = document.getElementById('learnTag').value;
    const body = document.getElementById('learnBody').value.trim();
    if (!title || !body) return alert('Título y contenido obligatorios.');
    const list = _load(K_LEARN);
    const attachments = (_pendAtts.learn||[]).slice();
    list.push({ id:'l_'+Date.now(), title, tag, body, attachments, date:new Date().toISOString() });
    _save(K_LEARN, list);
    _pendAtts.learn = [];
    _renderPendAtts('learn');
    clearForm('learn');
    render();
  }

  function delLearning(id){
    if (!confirm('¿Eliminar?')) return;
    const it = _load(K_LEARN).find(l => l.id === id);
    if (it && it.attachments && window.NBShared) it.attachments.forEach(a => NBShared.deleteBlob(a.id).catch(()=>{}));
    _save(K_LEARN, _load(K_LEARN).filter(l => l.id !== id));
    if (window.CLOUD && window.CLOUD.pushNow) window.CLOUD.pushNow(K_LEARN).catch(()=>{});
    render();
  }

  /* ── MOIF · Monitoreo y Observabilidad Integraciones Ficohsa ─
     Reuniones de seguimiento del proyecto. Cada entrada es una reunión
     con fecha, participantes, transcript y acciones derivadas.
  */
  function saveMoif(){
    const date = document.getElementById('moifDate').value;
    const title = document.getElementById('moifTitle').value.trim();
    const type = document.getElementById('moifType').value;
    const participants = document.getElementById('moifParticipants').value.trim();
    const transcript = document.getElementById('moifTranscript').value.trim();
    const summary = document.getElementById('moifSummary').value.trim();
    const actions = document.getElementById('moifActions').value.trim();
    if (!date || !title || !transcript) return alert('Fecha, título y transcripción son obligatorios.');
    const list = _load(K_MOIF);
    const editingId = document.getElementById('moifEditingId')?.value || '';
    const attachments = (_pendAtts.moif||[]).slice();
    if (editingId) {
      const it = list.find(x => x.id === editingId);
      if (it) {
        Object.assign(it, { date, title, type, participants, transcript, summary, actions });
        if (attachments.length) it.attachments = (it.attachments||[]).concat(attachments);
        it.updated = new Date().toISOString();
      }
    } else {
      list.push({
        id: 'moif_'+Date.now(),
        date, title, type, participants, transcript, summary, actions,
        attachments,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      });
    }
    _save(K_MOIF, list);
    if (window.CLOUD && window.CLOUD.pushNow) window.CLOUD.pushNow(K_MOIF).catch(()=>{});
    _pendAtts.moif = [];
    _renderPendAtts('moif');
    clearForm('moif');
    render();
  }
  function delMoif(id){
    if (!confirm('¿Eliminar esta reunión MOIF?')) return;
    const it = _load(K_MOIF).find(m => m.id === id);
    if (it && it.attachments && window.NBShared) it.attachments.forEach(a => NBShared.deleteBlob(a.id).catch(()=>{}));
    _save(K_MOIF, _load(K_MOIF).filter(m => m.id !== id));
    if (window.CLOUD && window.CLOUD.pushNow) window.CLOUD.pushNow(K_MOIF).catch(()=>{});
    render();
  }
  function editMoif(id){
    const it = _load(K_MOIF).find(m => m.id === id);
    if (!it) return;
    document.getElementById('moifDate').value = it.date || '';
    document.getElementById('moifTitle').value = it.title || '';
    document.getElementById('moifType').value = it.type || 'weekly';
    document.getElementById('moifParticipants').value = it.participants || '';
    document.getElementById('moifTranscript').value = it.transcript || '';
    document.getElementById('moifSummary').value = it.summary || '';
    document.getElementById('moifActions').value = it.actions || '';
    document.getElementById('moifEditingId').value = id;
    document.getElementById('moifFormTitle').textContent = '✏️ Editar reunión';
    document.getElementById('moifSaveBtn').textContent = '💾 Guardar cambios';
    // Scroll al form
    document.getElementById('moifFormCard').scrollIntoView({ behavior:'smooth', block:'start' });
  }
  function toggleMoif(id){
    const el = document.querySelector('.moif-item[data-id="'+id+'"]');
    if (el) el.classList.toggle('open');
  }
  function renderMoif(){
    const el = document.getElementById('moifList');
    if (!el) return;
    const list = _load(K_MOIF).slice().sort((a,b) => (b.date||'').localeCompare(a.date||''));
    if (!list.length) {
      el.innerHTML = '<div style="text-align:center;padding:36px;color:var(--t3);font-size:13px;line-height:1.6">Sin reuniones aún. Empezá pegando la transcripción de tu primera reunión arriba.<br><br><span style="font-size:11px">💡 Tip: cuando guardes una reunión, podés clickear "🤖 Generar prompt MOIF" en ella para que Claude actualice el ecosistema con lo nuevo.</span></div>';
      return;
    }
    const typeLbl = { weekly:'📅 Weekly', discovery:'🔍 Discovery', retro:'🔄 Retro', adhoc:'⚡ Ad-hoc', kickoff:'🚀 Kick-off', other:'📋 Otros' };
    el.innerHTML = list.map(m => `
      <div class="moif-item" data-id="${m.id}">
        <div class="moif-h" onclick="WORK.toggleMoif('${m.id}')">
          <div class="moif-date">${esc(m.date||'')}</div>
          <div class="moif-h-main">
            <div class="moif-h-title">${esc(m.title||'(sin título)')}</div>
            <div class="moif-h-meta">
              <span class="moif-type">${typeLbl[m.type]||m.type||'—'}</span>
              ${m.participants?`<span class="moif-parts">👥 ${esc(m.participants.split(',').length)} participantes</span>`:''}
              ${m.attachments && m.attachments.length?`<span class="moif-atts">📎 ${m.attachments.length}</span>`:''}
              <span class="moif-len">${m.transcript?Math.round(m.transcript.length/1000)+'K chars':''}</span>
            </div>
          </div>
          <span class="moif-chev">▾</span>
        </div>
        <div class="moif-body">
          ${m.participants?`<div class="moif-section"><h5>👥 Participantes</h5><div class="moif-text">${esc(m.participants)}</div></div>`:''}
          ${m.summary?`<div class="moif-section"><h5>📌 Resumen ejecutivo</h5><div class="moif-text">${esc(m.summary).replace(/\n/g,'<br>')}</div></div>`:''}
          ${m.actions?`<div class="moif-section"><h5>✅ Acciones / pendientes</h5><div class="moif-text moif-actions">${esc(m.actions).replace(/\n/g,'<br>')}</div></div>`:''}
          <div class="moif-section">
            <h5>📝 Transcripción completa <button class="moif-mini" onclick="event.stopPropagation();WORK.copyMoifTranscript('${m.id}')">📋 Copiar</button></h5>
            <div class="moif-transcript">${esc(m.transcript||'').replace(/\n/g,'<br>')}</div>
          </div>
          ${_itemAttsHtml('moif', m.id, m.attachments)}
          <div class="moif-foot">
            <button class="btn bp bs" onclick="event.stopPropagation();WORK.buildMoifPrompt('${m.id}')">🤖 Generar prompt MOIF · actualizar ecosistema</button>
            <button class="btn bo bs" onclick="event.stopPropagation();WORK.editMoif('${m.id}')">✏️ Editar</button>
            <button class="btn bo bs" onclick="event.stopPropagation();WORK.delMoif('${m.id}')" style="color:var(--rd)">🗑️ Eliminar</button>
          </div>
        </div>
      </div>`).join('');
  }
  function copyMoifTranscript(id){
    const it = _load(K_MOIF).find(m => m.id === id);
    if (!it || !navigator.clipboard) return;
    navigator.clipboard.writeText(it.transcript||'').then(() => {
      if (typeof _syncToast === 'function') { _syncToast('✓ Transcripción copiada', 'ok'); _syncToastHide(1500); }
    });
  }
  /** Genera un prompt focalizado en UNA reunión MOIF: extrae info nueva y propone
   *  cambios al ecosistema (dictionary, mind map, simulator, playbook). */
  function buildMoifPrompt(id){
    const m = _load(K_MOIF).find(x => x.id === id);
    if (!m) return alert('Reunión no encontrada.');
    let dict = []; try { dict = JSON.parse(localStorage.getItem('work_eco_dict')||'[]'); } catch {}
    const dictSids = dict.map(d => d.sid).filter(Boolean);

    let p = '<role>\n';
    p += 'You are Claude, the agent maintaining DA-2026 14-WORK · Simetrik Ecosystem module of Miguel Barros Torres.\n';
    p += 'Miguel just attended a MOIF meeting (Monitoreo y Observabilidad Integraciones Ficohsa) for the Simetrik+Ficohsa project, and pasted the transcript below.\n';
    p += 'Your job: AUDIT the meeting, detect what is NEW (terms, stakeholders, processes, decisions, risks, action items) and produce a STRUCTURED UPDATE PROPOSAL in Spanish.\n';
    p += 'Respond in Spanish. Be precise. NO INVENTION — only use info present in the meeting transcript or already in the project context.\n';
    p += '</role>\n\n';

    p += '<project_context>\n';
    p += '- Proyecto: Ficohsa Honduras → CAM regional. 98 procesos, 945 cuentas, 32.4M tx/mes.\n';
    p += '- Equipo Simetrik: Ana M. (SM), Lina Azcárate (PM), Juan C. + Wilson (Senior IS), Carolina Toro (CSM), Miguel (IS).\n';
    p += '- Stakeholders Ficohsa: Carlos Avila (Seguridad), Daniel Jojoa (Cloud), Gabriel Cortes (Datos), William/Williams/Erik/Wilson (Tecnología), Noel/Jorge/Carlos/Jose (Integraciones), Gary (Arquitectura).\n';
    p += '- Procesos priorizados Fase 1: SERCOM (recargas), Cartera de Préstamos, Descuento de Documentos.\n';
    p += '- Sistemas: T24 Temenos · Vision Plus · SAP S/4HANA · Visa/MC · CLARO · SFTP.\n';
    p += '- Display sections del módulo: 🧭 Empieza Aquí (mapa mental) · 🖥️ Simulador App · 📘 Playbook Ficohsa · 📖 Diccionario (' + dict.length + ' entradas).\n';
    p += '- Dictionary sids ya existentes (NO duplicar): ' + dictSids.slice(0,80).join(', ') + (dictSids.length>80?'... y '+(dictSids.length-80)+' más':'') + '\n';
    p += '</project_context>\n\n';

    p += '<meeting>\n';
    p += '  <date>' + (m.date||'') + '</date>\n';
    p += '  <type>' + (m.type||'') + '</type>\n';
    p += '  <title>' + (m.title||'') + '</title>\n';
    p += '  <participants>' + (m.participants||'') + '</participants>\n';
    if (m.summary)  p += '  <prior_summary><![CDATA[\n' + m.summary + '\n]]></prior_summary>\n';
    if (m.actions)  p += '  <prior_actions><![CDATA[\n' + m.actions + '\n]]></prior_actions>\n';
    p += '  <transcript><![CDATA[\n' + (m.transcript||'') + '\n]]></transcript>\n';
    if (m.attachments && m.attachments.length) {
      p += '  <attachments>\n';
      m.attachments.forEach(a => { p += '    <file>' + a.name + ' (' + (a.ext||'') + ', ' + (a.size||0) + ' bytes)</file>\n'; });
      p += '  </attachments>\n';
    }
    p += '</meeting>\n\n';

    p += '<task>\n';
    p += 'Producí en español, con secciones claramente delimitadas:\n\n';
    p += '## 1. RESUMEN EJECUTIVO\n';
    p += '   2-4 bullets con lo más importante de la reunión. Solo lo verbalizado.\n\n';
    p += '## 2. DECISIONES TOMADAS\n';
    p += '   Lista de decisiones formales. Una por línea. Si no hubo, decir "Sin decisiones formales".\n\n';
    p += '## 3. ACCIONES / PENDIENTES (machine-readable)\n';
    p += '   Una línea por acción en formato: `- [responsable] · acción · due:YYYY-MM-DD o "sin fecha"`.\n\n';
    p += '## 4. RIESGOS / BLOQUEOS DETECTADOS\n';
    p += '   Lista de riesgos verbalizados. Si no hubo, omitir esta sección.\n\n';
    p += '## 5. CAMBIOS PROPUESTOS · DICCIONARIO\n';
    p += '   Para cada término NUEVO mencionado en la reunión que NO esté ya en el diccionario (revisar contra sids listados arriba), generar una línea copy-pasteable a SEED_DICT:\n';
    p += '   {sid:\'xxx\',term:\'YYY\',cat:\'term|acro|process|platform|software\',en:\'\',def:\'...\',ex:\'... (basado en lo que se dijo en la reunión)\'},\n';
    p += '   Si no hay términos nuevos, decir "Sin entradas nuevas para el diccionario".\n\n';
    p += '## 6. CAMBIOS PROPUESTOS · MAPA MENTAL (Empieza Aquí)\n';
    p += '   Si la reunión introduce conceptos que deberían aparecer en alguno de los 8 nodos (que-es · cuenta · la-app · ia · dominios · contabilidad · conciliacion · ejercicios), proponer: NODE: <key> · ADD: <sub-item> · CONTENT: <texto>.\n\n';
    p += '## 7. CAMBIOS PROPUESTOS · SIMULADOR APP\n';
    p += '   Si la reunión menciona nuevas funcionalidades/pantallas/hotspots de Simetrik, proponer: SCREEN: <screen-key> · ADD-HOTSPOT: <elemento> · CAT: <categoria> · TITLE: <h3> · BODY: <p> · USE: <ejemplo> · TIP: <consejo>.\n\n';
    p += '## 8. CAMBIOS PROPUESTOS · PLAYBOOK FICOHSA\n';
    p += '   Si la reunión actualiza info Ficohsa-specific (stakeholders, procesos, cuentas, cronograma), proponer: SECTION: <id> · ADD/UPDATE: <qué> · CONTENT: <markdown>.\n\n';
    p += '## 9. PREGUNTAS PENDIENTES PARA MIGUEL\n';
    p += '   Si la transcripción menciona algo importante pero incompleto (ej. "el de seguridad dijo que...") sin nombre o detalle, listarlo como pregunta abierta.\n\n';
    p += '## 10. CONFLICTOS / INCONSISTENCIAS\n';
    p += '   Si la reunión contradice algo del project_context (por ejemplo, cambia el nombre del SM, o reasigna un proceso prioritario), flaggearlo explícitamente.\n';
    p += '</task>\n\n';

    p += '<rules>\n';
    p += '- Solo lo dicho en la reunión. No inferir más allá.\n';
    p += '- Si la transcripción es ambigua, marcarla como tal en la sección 9.\n';
    p += '- Citar el fragmento exacto que justifica cada cambio propuesto.\n';
    p += '- Output machine-friendly en las secciones 3, 5, 6, 7, 8 para que otra sesión de Claude Code aplique los cambios directo.\n';
    p += '- Spanish responses, technical terms en inglés se mantienen (workspace, sweep, source union, etc).\n';
    p += '</rules>\n';

    document.getElementById('askResult').style.display = 'block';
    const heading = document.getElementById('askResultHead'); if (heading) heading.textContent = '· prompt MOIF · ' + (m.date||'') + ' · ' + (m.title||'') + ' ·';
    document.getElementById('askOutput').textContent = p;
    document.getElementById('askOutput').dataset.raw = p;
    // Scroll al output
    document.getElementById('askResult').scrollIntoView({ behavior:'smooth', block:'start' });
    // Cambiar a la tab Copilot para mostrar el output
    const tab = document.querySelector('.tab[data-p="copilot"]');
    if (tab) tab.click();
    setTimeout(() => document.getElementById('askResult').scrollIntoView({ behavior:'smooth', block:'start' }), 300);
  }

  /* ── KNOWLEDGE BASE ────────────────────────────────────────── */
  function loadKB(){ try { return localStorage.getItem(K_KB) || ''; } catch { return ''; } }
  function saveKB(){
    const v = document.getElementById('kbBody').value;
    localStorage.setItem(K_KB, v);
    const b = document.getElementById('kbSavedBadge');
    if (b) { b.style.opacity='1'; setTimeout(()=>b.style.opacity='0', 1500); }
  }

  /* ══════════════════════════════════════════════════════════════
     SISTEMA TUTOR · Q&A desde KB oficial Simetrik
     Cada entrada: { q (pregunta), a (respuesta HTML), tags (array de palabras clave), cat (categoría) }
     ══════════════════════════════════════════════════════════════ */
  const TUTOR_QA = [
    // ── FUENTES ──
    { cat:'fuentes', tags:['fuente','source','cargar','subir','archivo','excel','csv','txt'],
      q:'¿Cómo creo una fuente y subo un archivo?',
      a:`<b>Una Fuente es la puerta de entrada de tus datos a Simetrik.</b> Pensalo como una "carpeta inteligente" que siempre espera archivos del mismo formato.<br><br>
<ol>
<li><b>Automatizar → Recursos y conciliaciones → Recursos</b></li>
<li>Click <b>"Crear recurso" → Fuentes</b></li>
<li>Poné un nombre (ej: <code>DB_DOTA</code>) → Crear</li>
<li>Abrí el <b>Gestor de Archivos</b> que aparece → arrastrá tu archivo o hacé click para buscarlo</li>
<li>Esperá que el estado cambie a <span style="color:#22c55e">✓ Listo</span></li>
</ol>
<br><b>Formatos que acepta:</b> Excel de UNA sola hoja, TXT, CSV.<br>
<b>⚠️ Trampas comunes:</b><br>
— Excel con múltiples hojas → no funciona directamente, hay que usar un Parser primero<br>
— Si el estado queda en "Error" → ir a <b>Herramientas → Consola de Desarrollo</b> para ver exactamente qué columna falló` },

    { cat:'fuentes', tags:['tipo de dato','formato','texto','número','fecha','columna','cambiar','formatear'],
      q:'¿Cómo cambio el tipo de dato de una columna?',
      a:`<b>Esto es lo primero que hacés con cualquier fuente nueva — antes de crear fórmulas.</b><br><br>
<ol>
<li>Abrí la fuente en vista tabla</li>
<li>Click derecho sobre el <b>encabezado de la columna</b></li>
<li>"Dar formato a una columna"</li>
<li>Elegí el tipo correcto en el dropdown:</li>
</ol>
<br>
<table style="width:100%;font-size:12px;border-collapse:collapse">
<tr style="background:#1a1f29"><th style="padding:4px 8px;text-align:left">Tipo</th><th style="padding:4px 8px;text-align:left">Cuándo usarlo</th><th style="padding:4px 8px;text-align:left">Ejemplo DOTA</th></tr>
<tr><td style="padding:4px 8px"><b>Texto</b></td><td style="padding:4px 8px">Códigos, PAN, IDs con ceros</td><td style="padding:4px 8px">CARD_NUMBER, GTWC_AUTH_CODE</td></tr>
<tr style="background:#1a1f2944"><td style="padding:4px 8px"><b>Número</b></td><td style="padding:4px 8px">Montos con decimales</td><td style="padding:4px 8px">MONTO, IMPORTE</td></tr>
<tr><td style="padding:4px 8px"><b>Fecha</b></td><td style="padding:4px 8px">Solo fecha, sin hora</td><td style="padding:4px 8px">MOV_CREATION_DATE, FPRES</td></tr>
<tr style="background:#1a1f2944"><td style="padding:4px 8px"><b>Entero</b></td><td style="padding:4px 8px">Conteos, cantidades sin decimales</td><td style="padding:4px 8px">DIAS_A_SUMAR</td></tr>
</table>
<br><b>⚠️ Crítico para DOTA:</b> <code>CARD_SIX_FIRST_DIGITS</code> y <code>CARD_FOUR_LAST_DIGITS</code> deben ser <b>Texto</b> ANTES de crear la columna CARD_NUMBER. Si los dejás como Número, los ceros a la izquierda desaparecen.` },

    { cat:'fuentes', tags:['union','unión','combinar','fuentes','join','multiples'],
      q:'¿Cuándo uso una Unión de fuentes en lugar de una Fuente sola?',
      a:`<b>Usás una Unión cuando dos archivos distintos tienen los mismos datos pero de distintas fuentes.</b><br><br>
Ejemplo real DOTA: las transacciones DOTA vienen en varios archivos separados (uno por período o por comercio). En lugar de conciliar cada uno por separado, los "unís" en una sola tabla y conciliás de una.<br><br>
<b>Cuándo Fuente sola:</b> un solo archivo recurrente del mismo origen.<br>
<b>Cuándo Unión:</b> múltiples archivos del mismo tipo que necesitás ver como uno solo.<br><br>
<b>Cómo crear:</b><br>
<ol>
<li>Automatizar → Recursos → "Crear recurso" → <b>Unión de fuentes</b></li>
<li>Nombrala (ej: <code>Union_DOTA</code>)</li>
<li>Elegí la primera fuente → seleccioná las columnas a incluir</li>
<li>Verificá el tipo de dato de cada columna</li>
<li>Agregá más fuentes → "Ejecutar cambios"</li>
</ol>
<br><b>Tip de oro:</b> siempre es mejor usar una Unión como base de la conciliación, no la Fuente directa. Si el formato del archivo cambia algún día, sólo actualizás la Unión sin tocar la conciliación.` },

    // ── COLUMNAS DE TRANSFORMACIÓN ──
    { cat:'formulas', tags:['concatenar','pegar','unir','texto','columnas','rellenar','pad','ceros','lpad'],
      q:'¿Cómo construyo el número de tarjeta (PAN) de 16 dígitos?',
      a:`<b>Este es el Punto 1 del caso DOTA. El PAN viene roto en dos columnas y hay que armarlo.</b><br><br>
<b>El problema:</b> CARD_SIX_FIRST_DIGITS tiene los primeros 6 dígitos y CARD_FOUR_LAST_DIGITS los últimos 4. El medio son 6 "X". Pero ambas columnas pueden venir sin los ceros iniciales.<br><br>
<b>La fórmula:</b>
<pre style="background:#0a1820;border-left:3px solid #06b6d4;padding:10px;border-radius:6px;font-size:12px;color:#dff5fb">CONCATENAR(
  RELLENAR(<span style="color:#a78bfa">CARD_SIX_FIRST_DIGITS</span>; 6; <span style="color:#fbbf24">"0"</span>; <span style="color:#fbbf24">"IZQUIERDA"</span>);
  <span style="color:#fbbf24">"XXXXXX"</span>;
  RELLENAR(<span style="color:#a78bfa">CARD_FOUR_LAST_DIGITS</span>; 4; <span style="color:#fbbf24">"0"</span>; <span style="color:#fbbf24">"IZQUIERDA"</span>)
)</pre>
<b>Qué hace cada parte:</b><br>
— <code>RELLENAR(col; 6; "0"; "IZQUIERDA")</code> → rellena con ceros por la izquierda hasta llegar a 6 caracteres<br>
— <code>CONCATENAR(...)</code> → une las 3 partes en un solo string de 16 chars<br><br>
<b>⚠️ ANTES de crear esta fórmula:</b> cambiar el tipo de CARD_SIX_FIRST_DIGITS y CARD_FOUR_LAST_DIGITS a <b>Texto</b>. Si están como Número, el RELLENAR falla.<br><br>
<b>Verificación:</b> crear una columna auxiliar temporal <code>LARGO(CARD_NUMBER)</code> → todas las filas deben dar 16.` },

    { cat:'formulas', tags:['si','condicional','if','condicion','cuando','vacio','blanco','esblanco'],
      q:'¿Cómo uso la función SI en Simetrik?',
      a:`<b>SI en Simetrik funciona igual que el IF de Excel, pero con ; (punto y coma) como separador.</b><br><br>
<b>Sintaxis:</b>
<pre style="background:#0a1820;border-left:3px solid #06b6d4;padding:10px;border-radius:6px;font-size:12px;color:#dff5fb">SI(<span style="color:#22d3ee">CONDICION</span>; <span style="color:#22c55e">valor_si_verdadero</span>; <span style="color:#ef4444">valor_si_falso</span>)</pre>
<b>Ejemplos del caso DOTA:</b><br>
<br>— Verificar si un código de autorización está vacío:
<pre style="background:#0a1820;border-left:3px solid #06b6d4;padding:10px;border-radius:6px;font-size:12px;color:#dff5fb">SI(
  Y(<span style="color:#a78bfa">CAPTURE_AUTHORIZATION_CODE</span> = <span style="color:#fbbf24">"000000"</span>;
    <span style="color:#a78bfa">CAPTURE_ACQUIRER</span> = <span style="color:#fbbf24">"Cabal"</span>);
  <span style="color:#fbbf24">""</span>;
  <span style="color:#a78bfa">CAPTURE_AUTHORIZATION_CODE</span>
)</pre>
<b>Reglas clave:</b><br>
— Separador siempre <b>;</b> (punto y coma)<br>
— Strings siempre entre <b>"comillas dobles"</b><br>
— Nombres de columna en <b>MAYÚSCULAS</b><br>
— Para combinar condiciones: <code>Y(cond1; cond2)</code> = ambas deben cumplirse, <code>O(cond1; cond2)</code> = al menos una` },

    { cat:'formulas', tags:['extraer','regex','expregular','buscar','patron','marca','brand','acquirer'],
      q:'¿Cómo busco una palabra dentro de un texto (búsqueda tipo "contiene")?',
      a:`<b>Simetrik no tiene una función "CONTIENE" directa, pero EXTRAER_EXPREGULAR hace lo mismo.</b><br><br>
<b>El truco:</b> si EXTRAER_EXPREGULAR no encuentra el patrón, devuelve <code>""</code> (string vacío). Entonces comparás con <code>&lt;&gt; ""</code> para saber si encontró algo.<br><br>
<b>Ejemplo (Punto 3 DOTA — detectar la marca del adquirente):</b>
<pre style="background:#0a1820;border-left:3px solid #06b6d4;padding:10px;border-radius:6px;font-size:12px;color:#dff5fb">SI(
  EXTRAER_EXPREGULAR(
    MAYUSC(CONCATENAR(<span style="color:#a78bfa">CAPTURE_ACQUIRER</span>; <span style="color:#fbbf24">"|"</span>; <span style="color:#a78bfa">PURCHASE_ACQUIRER</span>));
    <span style="color:#fbbf24">"MASTERCARD|FIRSTDATA|DINERS"</span>;
    0
  ) &lt;&gt; <span style="color:#fbbf24">""</span>;
  <span style="color:#fbbf24">"FD"</span>;
  <span style="color:#fbbf24">"OTRO"</span>
)</pre>
<b>Parámetros de EXTRAER_EXPREGULAR:</b><br>
— Parámetro 1: el texto donde buscar<br>
— Parámetro 2: el patrón (regex), usando | para "o"<br>
— Parámetro 3: <code>0</code> = devolver el match completo<br><br>
<b>¿Por qué MAYUSC y CONCATENAR?</b> Para normalizar el texto antes de buscar. Si "mastercard" viene en minúscula, MAYUSC lo convierte y el patrón "MASTERCARD" lo encuentra.` },

    { cat:'formulas', tags:['fecha','diferencia','dias','vencimiento','hoy','today','aging','antigüedad'],
      q:'¿Cómo calculo cuántos días tiene un registro sin conciliar?',
      a:`<b>Usás DIFERENCIA_FECHA combinada con TODAY() dentro de una agrupación.</b><br><br>
<b>Importante:</b> <code>TODAY()</code> solo está disponible dentro de <b>Agrupaciones</b>, no en columnas de transformación de una Fuente directa.<br><br>
<b>El flujo correcto:</b><br>
<ol>
<li>Creás la columna de fecha en la fuente normalmente (ej: <code>MOV_CREATION_DATE</code>)</li>
<li>Creás una <b>Agrupación</b> sobre la fuente o conciliación</li>
<li>Dentro de la agrupación, agregás una columna tipo <b>"Hoy" (TODAY())</b></li>
<li>Después agregás una columna de transformación:</li>
</ol>
<pre style="background:#0a1820;border-left:3px solid #06b6d4;padding:10px;border-radius:6px;font-size:12px;color:#dff5fb">DIFERENCIA_FECHA(<span style="color:#a78bfa">MOV_CREATION_DATE</span>; TODAY(); <span style="color:#fbbf24">"días"</span>)</pre>
<b>Resultado:</b> un número entero con cuántos días pasaron desde la transacción hasta hoy.<br><br>
<b>⚠️ Error común:</b> intentar usar HOY() → <b>no existe en Simetrik</b>. La función correcta es <code>TODAY()</code>.` },

    { cat:'formulas', tags:['adicionar','dias habiles','semana','laborales','sumar','fecha'],
      q:'¿Cómo sumo días hábiles a una fecha?',
      a:`<b>La función es ADICIONAR_DIASEMANA y tiene exactamente 2 parámetros.</b><br><br>
<pre style="background:#0a1820;border-left:3px solid #06b6d4;padding:10px;border-radius:6px;font-size:12px;color:#dff5fb">ADICIONAR_DIASEMANA(<span style="color:#a78bfa">FECHA</span>; <span style="color:#22d3ee">CANTIDAD</span>)</pre>
<b>Qué hace:</b> agrega N días hábiles (omite sábados y domingos). <b>No omite feriados</b> — para eso se necesita el workaround con la fuente de calendario.<br><br>
<b>Ejemplo Punto 7 DOTA</b> (30 días hábiles para el pago esperado):
<pre style="background:#0a1820;border-left:3px solid #06b6d4;padding:10px;border-radius:6px;font-size:12px;color:#dff5fb">ADICIONAR_DIASEMANA(<span style="color:#a78bfa">MOV_CREATION_DATE</span>; 30)</pre>
<b>⚠️ No existe:</b><br>
— <code>ADICIONAR_FECHA_TIEMPO</code> → no está en la documentación oficial<br>
— <code>HOY()</code> → usar <code>TODAY()</code><br>
— Un tercer parámetro para el país (ARG) → no documentado oficialmente` },

    // ── BUSCARV ──
    { cat:'buscarv', tags:['buscarv','vlookup','enriquecer','traer','columna','otra fuente','parametria','comercio'],
      q:'¿Cómo traigo datos de otra fuente a mi fuente actual (tipo VLOOKUP)?',
      a:`<b>En Simetrik esto se hace con BuscarV — equivalente exacto al VLOOKUP de Excel.</b><br><br>
<b>El caso concreto del DOTA (Punto 8):</b> traer TIPO_COMERCIO de la fuente Parametria_Comercio a DB_DOTA, usando GTWT_MERCHANT_NUMBER como llave.<br><br>
<b>Pasos oficiales:</b>
<ol>
<li>Abrí la fuente <code>DB_DOTA</code> en vista tabla</li>
<li>Buscá el ícono <b>"Crear BuscarV"</b> en la barra de herramientas de columnas</li>
<li>Nombre de la columna nueva: <code>TIPO_COMERCIO</code></li>
<li>Recurso fuente: <code>Parametria_Comercio</code></li>
<li>Columnas a traer: ✅ <code>TIPO_COMERCIO</code></li>
<li>Condición de cruce: <code>GTWT_MERCHANT_NUMBER</code> = <code>CODIGO_COMERCIO</code></li>
<li>"Guardar y ver tabla"</li>
</ol>
<br><b>Verificación:</b> la mayoría de filas DOTA deben tener TIPO_COMERCIO completo. Si quedan vacíos, revisá que los tipos de dato coincidan en ambas columnas.<br><br>
<b>⚠️ No confundir con:</b> Unión de fuentes (combina dos fuentes horizontalmente para conciliar). BuscarV es solo para enriquecer con columnas extra.` },

    // ── CONCILIACIÓN ──
    { cat:'conciliacion', tags:['estandar','avanzada','diferencia','cuando','elegir','tipo','standard','advanced'],
      q:'¿Cuándo uso conciliación estándar y cuándo avanzada?',
      a:`<b>Regla práctica: si tu proceso tiene compensaciones entre débitos y créditos, o barridas de agrupación, necesitás Avanzada.</b><br><br>
<table style="width:100%;font-size:12px;border-collapse:collapse">
<tr style="background:#1a1f29"><th style="padding:6px;text-align:left">Criterio</th><th style="padding:6px;text-align:left">Estándar</th><th style="padding:6px;text-align:left">Avanzada</th></tr>
<tr><td style="padding:6px"><b>Número de fuentes</b></td><td style="padding:6px">Exactamente 2</td><td style="padding:6px">2 o más (con cadenas)</td></tr>
<tr style="background:#1a1f2944"><td style="padding:6px"><b>Compensación</b></td><td style="padding:6px">No</td><td style="padding:6px">Sí (PAYMENT vs REFUND)</td></tr>
<tr><td style="padding:6px"><b>Barridas agrupadas</b></td><td style="padding:6px">No</td><td style="padding:6px">Sí (comparar totales por lote)</td></tr>
<tr style="background:#1a1f2944"><td style="padding:6px"><b>Segmentación</b></td><td style="padding:6px">No</td><td style="padding:6px">Sí (separar por categoría)</td></tr>
<tr><td style="padding:6px"><b>Ejemplo DOTA</b></td><td style="padding:6px">SERCOM T24 vs CLARO</td><td style="padding:6px">DOTA × FD (5 barridas)</td></tr>
</table>
<br><b>Caso DOTA:</b> necesitás Avanzada porque las primeras 2 barridas son de <b>Compensación</b> (DOTA se cruza consigo misma para anular PAYMENT vs REFUND del mismo comercio).` },

    { cat:'conciliacion', tags:['barrida','crear','configurar','regla','llave','cruce','robustez'],
      q:'¿Cómo creo y configuro una barrida?',
      a:`<b>Una barrida es el conjunto de reglas que define cuándo dos registros "hacen match".</b><br><br>
<b>Pasos para crear una barrida de conciliación estándar:</b>
<ol>
<li>Entrá a la conciliación → <b>"Configurar cruce"</b></li>
<li>Click <b>"+ Agregar barrida"</b> → nombrala (ej: <code>B3 · DOTA × FD exacto</code>)</li>
<li>Elegí las fuentes (Fuente A = DB_DOTA, Fuente B = Reporte_FD)</li>
<li>Agregá las llaves de cruce (botón "+ Agregar llave"):
<ul style="margin:6px 0 6px 20px">
<li><code>A.GTWC_AUTHORIZATION_CODE</code> = <code>B.AUTORIZACION</code></li>
<li><code>A.GTWT_MERCHANT_NUMBER</code> = <code>B.COMERCIO</code></li>
<li><code>ABS(A.MONTO)</code> = <code>B.IMPORTE</code></li>
</ul>
</li>
<li>"Guardar barrida" → revisá la <b>Robustez</b></li>
</ol>
<br><b>Robustez:</b><br>
— 🟢 Alta (verde) → las reglas son suficientemente únicas, la barrida va a funcionar bien<br>
— 🟡 Media (amarillo) → puede haber algunos falsos positivos, pero funciona<br>
— 🔴 Débil (rojo) → las reglas no son suficientes. Simetrik <b>no ejecuta</b> la barrida. Agregá más llaves.` },

    { cat:'conciliacion', tags:['tolerancia','diferencia','margen','monto','fecha','casi igual','~='],
      q:'¿Cómo configuro una tolerancia de monto en una barrida?',
      a:`<b>La tolerancia permite que dos registros "hagan match" aunque sus montos no sean exactamente iguales.</b><br><br>
<b>Ejemplo DOTA (Barrida B2 — compensación con tolerancia $5):</b>
<ol>
<li>Creás la barrida igual que la B1 (mismas llaves de comercio + auth)</li>
<li>En la llave del monto, en vez de igualdad estricta, usás la opción <b>"Tolerancia numérica"</b>:
<ul style="margin:6px 0 6px 20px">
<li>Columna A: <code>ABS(A.MONTO)</code></li>
<li>Operador: <b>~= (casi iguales)</b> o "Diferencia absoluta ≤"</li>
<li>Columna B: <code>ABS(B.MONTO)</code></li>
<li>Valor: <b>5</b></li>
</ul>
</li>
</ol>
<br><b>Restricciones de tolerancia:</b><br>
— Solo funciona en cruces <b>1:1</b><br>
— <b>No funciona</b> en cruces N:N<br>
— Ambas columnas deben ser tipo Número o Entero<br><br>
<b>Para fechas:</b> la tolerancia direccional permite que FD llegue 1 día después que DOTA (FD.fecha - DOTA.fecha ∈ {0, +1}).` },

    { cat:'conciliacion', tags:['compensacion','barrida','payment','refund','offset','anulacion'],
      q:'¿Qué es una barrida de compensación y cómo funciona?',
      a:`<b>Una barrida de compensación cruza UNA fuente consigo misma para anular pares de débito y crédito.</b><br><br>
<b>El caso DOTA (Barridas B1 y B2):</b> dentro de DB_DOTA hay transacciones de tipo PAYMENT y REFUND. Cuando un REFUND cancela a un PAYMENT del mismo comercio y monto, los dos deben "compensarse" antes de cruzar contra First Data.<br><br>
<b>Por qué es importante:</b> si no compensás primero, esas transacciones quedarían como pendientes en la conciliación DOTA × FD aunque en realidad están resueltas dentro de DOTA.<br><br>
<b>Cómo configurarla en Simetrik:</b>
<ol>
<li>Crear la conciliación → elegir tipo <b>Avanzada</b></li>
<li>Agregar barrida → tipo <b>"Barrida de Compensación"</b></li>
<li>Recurso a compensar: <b>Lado A</b> (DB_DOTA)</li>
<li>Grupo Compensable 1 + Grupo Compensable 2: columnas que identifican el par:<br>
<code>GTWT_MERCHANT_NUMBER</code> + <code>GTWC_AUTHORIZATION_CODE</code> + <code>ABS(MONTO)</code></li>
<li>Agregar restricción: <code>A.OP ≠ B.OP</code> (no cruzar PAYMENT con PAYMENT)</li>
</ol>
<br><b>Restricción oficial:</b> solo se pueden compensar registros en estado "Unreconciled".` },

    // ── TABLEROS ──
    { cat:'tableros', tags:['tablero','crear','dashboard','visual','path','ruta'],
      q:'¿Cómo creo un tablero en Simetrik?',
      a:`<b>Los tableros son los dashboards donde analizás los resultados de tus conciliaciones.</b><br><br>
<b>Path oficial:</b> <code>Automatizar → Análisis → Tableros</code><br><br>
<b>Pasos:</b>
<ol>
<li>Automatizar → Análisis → Tableros</li>
<li>Click <b>"Crear" → "Tableros"</b></li>
<li>Asigná un nombre (ej: <code>14 · % Conciliación por barrida</code>)</li>
<li>Elegí el tipo: <b>Operativo</b> (para análisis de conciliaciones) o <b>Contable</b> (para cierre)</li>
<li>Click <b>"Configuración"</b> para agregar visuales</li>
</ol>
<br><b>Límite importante:</b> 21 elementos por tablero. Cada visual consume un número de elementos (ej: "Estado de conciliación estándar" = 7 elementos). Planificá antes de agregar.<br><br>
<b>Para el caso DOTA necesitás 3 tableros:</b><br>
— Tablero 14: % conciliación por barrida (tabla + gráfico de barras)<br>
— Tablero 15: KPI global (3 KPIs: conciliadas, pendientes, % eficiencia)<br>
— Tablero 16: tablero libre de tu elección con justificación operativa` },

    { cat:'tableros', tags:['kpi','métrica','número','grande','contar','suma'],
      q:'¿Cómo agrego un KPI individual al tablero?',
      a:`<b>Un KPI Individual muestra un número grande y destacado — ideal para conciliadas/pendientes/% eficiencia.</b><br><br>
<b>Pasos:</b>
<ol>
<li>Abrí el tablero → modo <b>Configuración</b></li>
<li>Panel "Visuales" → <b>KPI Individual</b> → "Añadir"</li>
<li>Seleccioná la fuente de datos (ej: DB_DOTA con los resultados de la conciliación)</li>
<li>Definí la métrica: <code>CONTAR(id)</code>, <code>SUMA(MONTO)</code>, etc.</li>
<li>Filtros opcionales: ej. solo registros donde <code>_BARRIDA_ &lt;&gt; NULL</code> (= conciliados)</li>
</ol>
<br><b>Para el Tablero 15 DOTA:</b><br>
— KPI 1: <code>CONTAR_SI(_BARRIDA_ &lt;&gt; NULL)</code> → "Conciliadas"<br>
— KPI 2: <code>CONTAR_SI(_BARRIDA_ = NULL)</code> → "Pendientes"<br>
— KPI 3: KPI1 / (KPI1 + KPI2) × 100 → "% eficiencia"<br><br>
<b>Verificación:</b> KPI Conciliadas debe igualar la suma de partidas del Tablero 14.` },

    // ── HERRAMIENTAS ──
    { cat:'herramientas', tags:['error','fallo','proceso','diagnostico','consola','no funciona','debug'],
      q:'Algo no funciona, ¿por dónde empiezo a diagnosticar?',
      a:`<b>Hay 3 lugares para ir cuando algo falla, en este orden:</b><br><br>
<b>1. Herramientas → Procesos</b><br>
Ver si el proceso terminó, sigue corriendo o falló. Si falló, te da el resource ID y la duración.<br><br>
<b>2. Herramientas → Consola de Desarrollo</b><br>
Logs en tiempo real de cada archivo procesado. Muestra exactamente qué columna y qué fila tienen el error. Es tu diagnóstico más útil.<br><br>
<b>3. Auditar → Historial de actividad</b><br>
Si no entendés quién hizo qué o cuándo cambió algo, el historial es inmutable y tiene todo.<br><br>
<b>Errores más comunes en DOTA y sus soluciones:</b><br>
— "Tipo de dato incompatible" en RELLENAR → cambiar la columna fuente a Texto antes<br>
— Barrida roja (débil) → agregar más llaves de cruce<br>
— Filas vacías en BuscarV → verificar que los tipos de dato de las columnas llave coincidan<br>
— TODAY() no disponible → estás en una fuente, no en una agrupación. Crear la agrupación primero.` },

    { cat:'herramientas', tags:['papelera','borrar','eliminar','recuperar','restaurar','accidente'],
      q:'Borré algo por error, ¿puedo recuperarlo?',
      a:`<b>Sí, tenés 30 días para recuperar cualquier recurso eliminado.</b><br><br>
<b>Pasos:</b>
<ol>
<li>Herramientas → <b>Papelera</b></li>
<li>Buscá el recurso por nombre</li>
<li>Click <b>"Restaurar"</b></li>
</ol>
<br><b>Después de 30 días</b> la eliminación es definitiva. No hay vuelta atrás.<br><br>
<b>Antes de borrar algo:</b> ir a <b>Herramientas → Mapas</b>, buscar el recurso, y ver qué otras cosas dependen de él (downstream). Si tiene dependencias, borrar rompe la cadena.` },

    // ── FLUJO DOTA ──
    { cat:'dota', tags:['dota','empezar','primer','paso','primero','arrancar','donde'],
      q:'¿Por dónde empiezo la prueba DOTA?',
      a:`<b>Antes de escribir la primera fórmula, hay 4 cosas que verificar:</b><br><br>
<b>Checklist de arranque:</b>
<ol>
<li>✅ El workspace tiene <b>nueva herencia</b> activada (preguntale al trainer si no estás seguro)</li>
<li>✅ Los <b>add-ons</b> están activos: conciliación avanzada, saldos persistentes, días hábiles</li>
<li>✅ Las 4 fuentes están cargadas como insumos:
<ul style="margin:6px 0 6px 20px">
<li><code>DB_DOTA</code> (base de transacciones)</li>
<li><code>Reporte_FD</code> (reporte First Data)</li>
<li><code>Parametria_Comercio</code> (tabla de tipos de comercio)</li>
<li><code>Normalización_fechas_habiles</code> (calendario ARG)</li>
</ul>
</li>
<li>✅ El tipo de dato de las columnas numéricas con ceros está en <b>Texto</b> (CARD_SIX_FIRST_DIGITS, CARD_FOUR_LAST_DIGITS)</li>
</ol>
<br><b>Después:</b> seguí los puntos 1-7 de la Prueba DOTA en orden. El orden importa porque el punto 4 (BRAND) depende del 1 (CARD_NUMBER) y el 7 (EXPECTED_PAYMENT_DATE) depende del 6 (MOV_CREATION_DATE).` },

    { cat:'dota', tags:['barrida','b1','b2','b3','b4','b5','orden','secuencia','cinco','conciliacion avanzada'],
      q:'¿Cuáles son las 5 barridas del DOTA y en qué orden van?',
      a:`<b>Las 5 barridas de la conciliación avanzada DOTA × FD, en orden obligatorio:</b><br><br>
<table style="width:100%;font-size:12px;border-collapse:collapse">
<tr style="background:#1a1f29"><th style="padding:6px;text-align:left">Barrida</th><th style="padding:6px;text-align:left">Tipo</th><th style="padding:6px;text-align:left">Qué hace</th></tr>
<tr><td style="padding:6px"><b>B1</b></td><td style="padding:6px">Compensación exacta</td><td style="padding:6px">DOTA × DOTA — anula pares PAYMENT/REFUND exactos</td></tr>
<tr style="background:#1a1f2944"><td style="padding:6px"><b>B2</b></td><td style="padding:6px">Compensación tol. $5</td><td style="padding:6px">DOTA × DOTA — igual que B1 pero con diferencia de monto hasta $5</td></tr>
<tr><td style="padding:6px"><b>B3</b></td><td style="padding:6px">DOTA × FD exacto</td><td style="padding:6px">Cruza pendientes DOTA con FD usando 5 llaves (auth + comercio + monto + fecha + PAN)</td></tr>
<tr style="background:#1a1f2944"><td style="padding:6px"><b>B4</b></td><td style="padding:6px">DOTA × FD +1 día</td><td style="padding:6px">Igual que B3 pero la fecha de FD puede ser hasta 1 día después</td></tr>
<tr><td style="padding:6px"><b>B5</b></td><td style="padding:6px">Batch FD</td><td style="padding:6px">Agrupa FD por lote y cruza la suma contra suma DOTA por comercio</td></tr>
</table>
<br><b>La clave del orden:</b> cada barrida recibe los <b>pendientes</b> de la anterior. B1 corre primero, los que no cruzan van a B2, los de B2 van a B3, etc.` },

    { cat:'dota', tags:['tablero','14','15','16','dashboard','kpi','porcentaje','eficiencia'],
      q:'¿Qué muestran los tableros 14, 15 y 16 del DOTA?',
      a:`<b>Tablero 14 — % de conciliación por barrida:</b><br>
Muestra cuántas partidas y qué monto concilió cada barrida (B1 a B5). Visual recomendado: tabla + gráfico de barras horizontal.<br>
Dimensión: <code>_BARRIDA_</code>. Métricas: CONTAR(id), SUMA(ABS(MONTO)), % sobre total.<br><br>
<b>Tablero 15 — KPI global:</b><br>
3 números grandes: <b>Conciliadas</b> (donde _BARRIDA_ ≠ NULL) + <b>Pendientes</b> (donde _BARRIDA_ = NULL) + <b>% eficiencia</b> (conciliadas/total × 100).<br>
<i>Verificación: KPI Conciliadas debe igualar exactamente la suma del Tablero 14.</i><br><br>
<b>Tablero 16 — Libre:</b><br>
Elegís 1 de estas 4 opciones y justificás el valor operativo:<br>
— Top 10 comercios con mayor monto pendiente<br>
— Heatmap compensaciones >15 días por adquirente<br>
— % pendientes por motivo (sin auth / sin PAN / fuera de SLA)<br>
— Saldo acumulado vs línea base mensual (usa el saldo del punto 13)` },
  ];

  /* ── Búsqueda del tutor ─── */
  function tutorSearch(query){
    if (!query || query.length < 2) return TUTOR_QA;
    const q = query.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
    return TUTOR_QA.filter(item => {
      const searchable = (item.q + ' ' + item.tags.join(' ') + ' ' + item.cat)
        .toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
      return q.split(' ').every(word => word.length < 2 || searchable.includes(word));
    });
  }

  function tutorRenderQA(results, activeIdx){
    const list = document.getElementById('tutorList');
    const detail = document.getElementById('tutorDetail');
    if (!list || !detail) return;

    if (results.length === 0){
      list.innerHTML = '<div style="padding:12px;color:var(--t3);font-size:12px;text-align:center">No encontré respuesta para eso.<br>Probá con otras palabras clave, o usá el <b>Generador de Prompts</b> de abajo para preguntarle a Claude.</div>';
      detail.innerHTML = '';
      return;
    }

    list.innerHTML = results.map((item, i) => {
      const cats = {fuentes:'🗄️ Fuentes',formulas:'🧮 Fórmulas',buscarv:'🔍 BuscarV',conciliacion:'🔄 Conciliación',tableros:'📊 Tableros',herramientas:'🛠️ Herramientas',dota:'🧪 DOTA'};
      const active = i === (activeIdx||0);
      return `<div onclick="WORK.tutorSelect(${i})" style="padding:10px 14px;cursor:pointer;border-bottom:1px solid var(--bd);background:${active?'rgba(6,182,212,.10)':'transparent'};border-left:${active?'3px solid var(--ac)':'3px solid transparent'};transition:all .1s">
        <div style="font-size:10px;color:var(--t3);margin-bottom:3px;font-weight:600">${cats[item.cat]||item.cat}</div>
        <div style="font-size:13px;color:${active?'var(--ac)':'var(--tx)'};font-weight:${active?'600':'400'};line-height:1.4">${item.q}</div>
      </div>`;
    }).join('');

    const show = results[activeIdx||0];
    detail.innerHTML = show ? `
      <div style="padding:16px 18px">
        <div style="font-size:11px;color:var(--t3);font-weight:700;letter-spacing:.8px;text-transform:uppercase;margin-bottom:8px">${show.cat}</div>
        <div style="font-size:15px;font-weight:700;color:var(--ac);margin-bottom:14px;line-height:1.4">${show.q}</div>
        <div style="font-size:13px;line-height:1.75;color:var(--tx)">${show.a}</div>
      </div>` : '';
  }

  let _tutorCurrentResults = TUTOR_QA;
  let _tutorCurrentIdx = 0;

  function tutorSelect(idx){
    _tutorCurrentIdx = idx;
    tutorRenderQA(_tutorCurrentResults, idx);
  }

  function tutorInit(){
    _tutorCurrentResults = TUTOR_QA;
    _tutorCurrentIdx = 0;
    tutorRenderQA(TUTOR_QA, 0);

    const inp = document.getElementById('tutorSearch');
    if (inp) inp.addEventListener('input', () => {
      _tutorCurrentResults = tutorSearch(inp.value.trim());
      _tutorCurrentIdx = 0;
      tutorRenderQA(_tutorCurrentResults, 0);
    });
  }

  /* ── Guía de hoy (basada en progreso DOTA) ── */
  function tutorGuiaHoy(){
    const progress = (() => { try { return JSON.parse(localStorage.getItem('work_dota_progress')||'{}'); } catch { return {}; } })();
    const steps = [
      { n:1, label:'CARD_NUMBER — el número de tarjeta de 16 dígitos', q:'¿Cómo construyo el número de tarjeta (PAN) de 16 dígitos?' },
      { n:2, label:'GTWC_AUTHORIZATION_CODE — limpiar el código de autorización', q:'¿Cómo uso la función SI en Simetrik?' },
      { n:3, label:'GTWT_ACQUIRER — detectar la marca del adquirente', q:'¿Cómo busco una palabra dentro de un texto (búsqueda tipo "contiene")?' },
      { n:4, label:'BRAND — VISA / MASTERCARD / AMEX según el PAN', q:'¿Cómo busco una palabra dentro de un texto (búsqueda tipo "contiene")?' },
      { n:5, label:'GTWT_MERCHANT_NUMBER — prioridad entre 3 columnas', q:'¿Cómo uso la función SI en Simetrik?' },
      { n:6, label:'MOV_CREATION_DATE — convertir datetime a fecha', q:'¿Cómo sumo días hábiles a una fecha?' },
      { n:7, label:'EXPECTED_PAYMENT_DATE — 30 días hábiles', q:'¿Cómo sumo días hábiles a una fecha?' },
      { n:8, label:'BuscarV con Parametría de Comercios', q:'¿Cómo traigo datos de otra fuente a mi fuente actual (tipo VLOOKUP)?' },
      { n:9, label:'LIQ_6_TARJETA — primeros 6 dígitos de NUM_TAR', q:'¿Cómo uso la función SI en Simetrik?' },
      { n:10,label:'LIQ_4_TARJETA — últimos 4 dígitos de NUM_TAR', q:'¿Cómo uso la función SI en Simetrik?' },
      { n:11,label:'DEADLINE — último día del mes (bisiesto-safe)', q:'¿Cómo calculo cuántos días tiene un registro sin conciliar?' },
      { n:12,label:'Conciliación avanzada DOTA × FD con 5 barridas', q:'¿Cuáles son las 5 barridas del DOTA y en qué orden van?' },
      { n:13,label:'Saldo neto diario (Add-on Saldos Persistentes)', q:'¿Cómo calculo cuántos días tiene un registro sin conciliar?' },
      { n:14,label:'Tablero 14 — % conciliación por barrida', q:'¿Qué muestran los tableros 14, 15 y 16 del DOTA?' },
      { n:15,label:'Tablero 15 — KPI global', q:'¿Cómo agrego un KPI individual al tablero?' },
      { n:16,label:'Tablero 16 — tablero libre con justificación', q:'¿Qué muestran los tableros 14, 15 y 16 del DOTA?' },
    ];

    const completedNums = Object.keys(progress).filter(k => progress[k]).map(k => parseInt(k.replace('n',''))).filter(n => !isNaN(n));
    const nextStep = steps.find(s => !completedNums.includes(s.n));
    const pct = Math.round(completedNums.length / 16 * 100);

    const el = document.getElementById('tutorGuiaHoy');
    if (!el) return;

    if (!nextStep){
      el.innerHTML = `<div style="text-align:center;padding:20px">
        <div style="font-size:32px;margin-bottom:8px">🎉</div>
        <div style="font-weight:700;font-size:16px;color:var(--gn)">¡Completaste los 16 pasos del DOTA!</div>
        <div style="font-size:12px;color:var(--t3);margin-top:6px">Revisá los tableros 14-16 para asegurarte que los números cuadren.</div>
      </div>`;
      return;
    }

    el.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
        <div style="flex:1;background:var(--bg3);border-radius:4px;height:6px"><div style="width:${pct}%;background:linear-gradient(90deg,var(--ac),var(--gn));height:100%;border-radius:4px;transition:width .3s"></div></div>
        <span style="font-size:11px;font-weight:700;color:var(--ac);font-family:'IBM Plex Mono',monospace">${pct}% · ${completedNums.length}/16</span>
      </div>
      <div style="font-size:11px;color:var(--t3);margin-bottom:6px;font-weight:600;letter-spacing:.5px">PRÓXIMO PASO</div>
      <div style="font-size:16px;font-weight:700;color:var(--tx);margin-bottom:4px">Punto ${nextStep.n} · ${nextStep.label}</div>
      <div style="font-size:12px;color:var(--t2);margin-bottom:12px">Abrí la Prueba DOTA para ver la fórmula exacta y las trampas del evaluador.</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button onclick="document.querySelector('[data-p=dotatest]').click()" class="btn bp" style="font-size:12px">🧪 Ir al paso ${nextStep.n}</button>
        <button onclick="WORK.tutorShowQuestion('${nextStep.q.replace(/'/g,"\\'")}')" class="btn bo" style="font-size:12px">💡 Explicame cómo hacerlo</button>
      </div>`;
  }

  function tutorShowQuestion(q){
    const idx = TUTOR_QA.findIndex(item => item.q === q);
    if (idx >= 0){
      _tutorCurrentResults = TUTOR_QA;
      _tutorCurrentIdx = idx;
      tutorRenderQA(TUTOR_QA, idx);
      const inp = document.getElementById('tutorSearch');
      if (inp) inp.value = '';
      document.getElementById('tutorList').children[idx].scrollIntoView({behavior:'smooth',block:'nearest'});
    }
  }

  /* ── COPILOT PROMPT BUILDER ────────────────────────────────── */
  function buildAskPrompt(){
    const ask = document.getElementById('askBody').value.trim();
    if (!ask) return alert('Escribí tu pregunta primero.');
    const kind = document.getElementById('askKind').value;
    const kb = loadKB().trim();
    const cases = _load(K_CASES).slice(-3).reverse();
    const errors = _load(K_ERRORS).slice(-3).reverse();

    const kindRoles = {
      reconcile: 'You are a senior reconciliation analyst at Simetrik with 10 years of experience in financial data reconciliation, AP/AR cycles, and FinTech operations.',
      error: 'You are a senior debugging engineer specialized in financial reconciliation systems, particularly Simetrik\'s reconciliation engine.',
      explain: 'You are a senior financial systems instructor. Explain concepts at a level appropriate for a Reconciliations Analyst.',
      learn: 'You are a senior mentor. Teach concretely with concrete Simetrik-relevant examples.',
      review: 'You are a senior reviewer. Audit the request for correctness, edge cases, and process gaps.',
    };

    const role = kindRoles[kind] || kindRoles.explain;

    let prompt = `<role>\n${role}\nRespond in Spanish (es). Be precise, evidence-driven, and actionable.\n</role>\n\n`;

    prompt += '<simetrik_context>\n';
    prompt += '<personal_kb>\n';
    prompt += kb ? kb : '(No personal KB loaded yet — see KB tab in 14-WORK module)';
    prompt += '\n</personal_kb>\n\n';

    if (cases.length){
      prompt += '<recent_cases>\n';
      cases.forEach(c => {
        prompt += `- [${c.severity}/${c.status}] ${c.title}${c.client?' · '+c.client:''}\n  ${c.body.replace(/\n/g,' ').slice(0,200)}${c.body.length>200?'...':''}\n`;
      });
      prompt += '</recent_cases>\n\n';
    }

    if (errors.length){
      prompt += '<recent_errors>\n';
      errors.forEach(e => {
        prompt += `- ${e.title}${e.code?' ['+e.code+']':''}\n  ${(e.body||'').slice(0,150)}${(e.body||'').length>150?'...':''}\n`;
      });
      prompt += '</recent_errors>\n\n';
    }
    prompt += '</simetrik_context>\n\n';

    prompt += '<task>\n' + ask + '\n</task>\n\n';

    prompt += '<rules>\n';
    prompt += '- Respond in Spanish.\n';
    prompt += '- Use the personal_kb + recent_cases + recent_errors as context — they reflect Miguel\'s actual Simetrik environment.\n';
    prompt += '- Cite specific evidence when claiming.\n';
    prompt += '- If the personal_kb is empty or insufficient, say so and ask for the specific info needed.\n';
    prompt += '- No filler, no generic intros.\n';
    prompt += '</rules>\n';

    document.getElementById('askResult').style.display = 'block';
    document.getElementById('askOutput').textContent = prompt;
    document.getElementById('askOutput').dataset.raw = prompt;
  }

  function copyAsk(){
    const raw = document.getElementById('askOutput').dataset.raw;
    if (raw && navigator.clipboard) navigator.clipboard.writeText(raw).then(()=>alert('Copiado'));
  }

  /* ── TEST DEV PROMPT (DOTA-style) ────────────────────────────
     Plantilla reutilizable para desarrollar pruebas de Simetrik
     con material en Drive. Genera fórmulas exactas + roadmap +
     checklist con sync. Fuente: PROMPT_14-WORK_TEST.md
  */
  function buildTestDevPrompt(){
    const p = `# 🧪 PROMPT · Desarrollo de Pruebas / Proyectos Simetrik

CONTEXT (rellenar):
  Material en Drive:   [URL del folder]
  Nombre proyecto:     [DOTA / FOO / etc.]
  Tipo:                [test conocimiento / implementación / case study]
  Cliente/país:        [DOTA Argentina / Ficohsa Honduras / etc.]
  Slug interno:        [dota / foo · usado para work_<slug>_progress + pages/simetrik-<slug>-test.html]

PROTOCOLO:

1. LEÉ TODOS los insumos del Drive (Chrome MCP):
   · Guía .docx → /mobilebasic
   · xlsx → identificá columnas desde la guía (no descargues)
   · Capturas .png → extraé funciones disponibles + tipos de dato
   · Anotaciones .txt → fuente de verdad de la sintaxis Simetrik

2. MAPEÁ LA SINTAXIS:
   · Separador (;), strings ("..."), funciones MAYÚSCULAS sin acentos
   · IZQUIERDA/DERECHA, RELLENAR(col;n;"0";"IZQUIERDA")
   · ADICIONAR_FECHA_TIEMPO(fecha;n;"días")
   · ADICIONAR_DIAS_SEMANA(fecha;n;"sitio")
   · EXTRAER_EXPREGULAR(texto;patrón;grupo)
   · EXTRAER_FECHA(fecha;"año|mes|día")
   · SI / Y / O / ESBLANCO / CALCULO / MAYUSC

3. PARA CADA PUNTO genera:
   - nombre_columna_salida
   - tipo_dato_salida (Texto/Número/Entero/Fecha/Fecha y hora/Hora/Booleano)
   - formula_simetrik (sintaxis EXACTA del Drive · NO inventar)
   - depende_de (otros puntos)
   - trampa_evaluador
   - best_practice

4. CONCILIACIÓN / BARRIDAS:
   · Llaves explícitas con nombres reales de columna
   · Restricciones: auto-cross, tipo operación, tolerancias direccionales
   · Add-on Simetrik (Saldos Persistentes, Calendario Hábil)

5. TABLEROS / KPIs:
   · Métricas exactas (SUMA/CONTAR/%)
   · Tablero libre: 3-4 sugerencias con justificación operativa

6. ROADMAP STANDALONE:
   frontend/pages/simetrik-<slug>-test.html
   · Hero + TOC + Preparación + Tipos de dato Simetrik
   · Una sección por punto: fórmula + best practices + trampas
   · Sección "Best practices · qué califica el evaluador"
   · Checklist marcable persistente en work_<slug>_progress
   · Script IIFE con toggle/markAll/reset + bridge parent.CLOUD.pushState
   · SIN simuladores ni gimmicks

7. INTEGRACIÓN 14-WORK:
   · work.html: nueva tab + panel con iframe
   · cloud-sync.js: work_<slug>_progress en SYNC_REGISTRY
   · work.js: bumpear SEED_VERSION + términos nuevos del dict si aplica

8. DOCUMENTACIÓN:
   · PROMPT_RUNS.md: entry ID:14-WORK.P2 (CONT) · YYYY-MM-DD
   · CEREBRO_STATE.md: sección 14-WORK · Prueba <NOMBRE> · YYYY-MM-DD
   · PROMPT_14-WORK.md: actualizar cronología

9. COMMIT + PUSH (un solo commit):
   git add <archivos específicos>
   git commit -m "feat(14-WORK): Prueba <NOMBRE> · roadmap + fórmulas Simetrik + checklist sync"
   git push origin main

REGLAS CRÍTICAS:
  ❌ NO inventar fórmulas — extraé del Drive
  ❌ NO inventar columnas — verificá en capturas / xlsx
  ✅ Tipo dato correcto: PAN/IDs ceros = Texto, fechas sin hora = Fecha
  ✅ Bisiesto-safe: "mes cambia al +1 día"
  ✅ Restricciones de barrida explícitas
  ✅ Add-ons en lugar de simular con fórmulas
  ✅ Sync registry obligatorio para keys nuevas
  ✅ Un solo commit con mensaje detallado

CHECKLIST DE SALIDA:
  [ ] Roadmap HTML con TOC
  [ ] Cada punto con fórmula EXACTA Simetrik
  [ ] Tabla tipos de dato por columna
  [ ] Sección best practices del evaluador
  [ ] Checklist con sync cross-device
  [ ] Tab en work.html
  [ ] Storage key en SYNC_REGISTRY
  [ ] Diccionario expandido (si aplica) + SEED_VERSION bump
  [ ] node -c sin errores
  [ ] PROMPT_RUNS + CEREBRO_STATE + PROMPT_14-WORK actualizados
  [ ] Commit + push

---

INSTRUCCIÓN ESPECÍFICA DE ESTA SESIÓN:
[ESCRIBÍ ACÁ la tarea específica · ejemplo: "Material en Drive: https://...
Slug: foo-bar. Procedé."]`;
    document.getElementById('askResult').style.display = 'block';
    const h = document.getElementById('askResultHead'); if (h) h.textContent = '· test dev prompt listo ·';
    document.getElementById('askOutput').textContent = p;
    document.getElementById('askOutput').dataset.raw = p;
    document.getElementById('askResult').scrollIntoView({ behavior:'smooth', block:'start' });
  }

  /* ── SIMETRIK WORK PROMPT (trabajo puro de plataforma) ───────
     Prompt autónomo para resolver tareas reales en Simetrik.
     NO toca el módulo DA-2026. Fuente: PROMPT_14-WORK_SIMETRIK-PURO.md
  */
  function buildSimetrikWorkPrompt(){
    const p = [
'# 🛠️ PROMPT · TRABAJO PURO EN SIMETRIK',
'',
'Plantilla autónoma para resolver tareas reales en la plataforma Simetrik.',
'NO desarrolla el módulo DA-2026, NO escribe HTML/JS, NO publica roadmaps.',
'Solo te ayuda a TRABAJAR dentro de Simetrik: fórmulas, uniones, BuscarV, conciliaciones, tableros, troubleshooting.',
'',
'---',
'',
'## 📥 ZONA PARA PEGAR (lo único que tenés que llenar)',
'',
'>>> LO QUE QUIERO TRABAJAR HOY EN SIMETRIK:',
'[ Pegá acá tu tarea, lo más concreto posible. Ej: "fórmula que arme un ID con ceros a la izquierda" /',
'  "el BuscarV trae vacío, te paso captura" / "mi columna de fecha no se actualiza tras castear" ]',
'',
'>>> EVIDENCIA QUE TENGO (opcional pero ayuda):',
'[ Capturas, URL de Drive, texto del Help Center, nombres exactos de columnas/recursos, muestra de datos.',
'  Si no tenés, decilo y te pido lo mínimo. ]',
'',
'---',
'',
'## 🎭 TU ROL (Claude)',
'Sos un especialista senior en Simetrik asistiendo a Miguel Ángel Barros (Implementation Specialist /',
'Reconciliations Analyst en Simetrik — proyecto Ficohsa Honduras + Prueba DOTA × First Data). Resolvé la',
'tarea con pasos accionables, fórmulas listas para copiar y nombres exactos de recursos/columnas.',
'',
'## 🧠 BASE DE CONOCIMIENTO SIMETRIK (verificada)',
'FUENTE CANÓNICA: el cerebro completo vive en https://mikel696.github.io/da-2026/frontend/data/simetrik-kb.json (440+ entradas con evidencia y confianza). Si tenés herramienta de fetch, consultalo PRIMERO ante cualquier duda — lo de abajo es el resumen.',
'### Arquitectura',
'- Fuente: el xlsx crudo. Acá vive el TIPO DE DATO de cada columna.',
'- Unión de fuentes: capa de trabajo sobre las fuentes. Siempre trabajás sobre la Unión, nunca la fuente directa (best practice #8). Hereda columnas.',
'- Columna de transformación: columna calculada con fórmula dentro de la Unión. Salida tipada (Texto/Fecha/Entero/Decimal).',
'- BuscarV: trae una columna de OTRO recurso cruzando por una condición (como un VLOOKUP).',
'- Conciliación (simple/avanzada): cruza dos uniones por barridas (cada barrida = un set de llaves).',
'- Tablero: Automatizar → Análisis → Tableros → Crear → tipo Operativo.',
'- Ruta típica: Automatizar → Recursos y conciliaciones → Recursos → Crear recurso.',
'',
'### Sintaxis (no negociable)',
'- Separador de parámetros: ; (punto y coma).',
'- Textos entre "comillas dobles".',
'- Nombres de columna y de función en MAYÚSCULAS.',
'',
'### Funciones más usadas',
'- CONCATENAR(a; b; …) — pegar strings.',
'- RELLENAR(col; n; "0"; "IZQUIERDA") — rellenar a n caracteres.',
'- DIVIDIR(col; "delim"; pos) — cortar por delimitador y tomar posición (quitar decimales con ".", cortar ISO con "T").',
'- CALCULO(expr) — aritmética (ej. CALCULO(N_DIA_BASE + 30)).',
'- ADICIONAR_FECHA_TIEMPO(fecha; n; "dias") — sumar/restar tiempo. Período plural sin tilde: "dias","meses","años".',
'- DIFERENCIA_FECHA / DIASEM / ADICIONAR_DIAS_SEMANA — operaciones de fecha/calendario.',
'- MAYUSC(col) — a mayúscula (clave antes de comparar texto).',
'- ESBLANCO(col) / SI(cond; v1; v2) — lógica condicional. ABS / DERECHA.',
'⚠ Si no estás 100% seguro de que una función existe con ese nombre/firma, decilo y pedí confirmar en el catálogo "Fórmulas disponibles". No inventes funciones.',
'',
'### 🔑 Las 4 REGLAS DE ORO de propagación (causa #1 de "no se actualiza")',
'1. Los casteos de tipo van SIEMPRE en la FUENTE, nunca en la Unión (la Unión hereda y rechaza el cambio).',
'2. Tras castear en la fuente, RE-EJECUTÁ la Unión. Simetrik solo recalcula registros vacíos; las filas ya cargadas conservan el formato viejo.',
'3. Las columnas de transformación solo recalculan filas vacías → para refrescar TODAS, borrá la columna y recreala.',
'4. Casteá ANTES de crear fórmulas; una columna casteada mal mapeada se bloquea (🚫) y obliga a rehacer la Unión.',
'',
'### Manejo de fechas (lección DOTA)',
'- ISO tipo 2022-01-03T00:01:19-04:00 → castear a tipo Fecha (NO "Fecha y hora", que da T001 y vacía celdas):',
'  Dar formato a columna → Paso 1 tipo Fecha → Paso 2 identificar formato original → Paso 3 visualización 2016-11-24 (YYYY-MM-DD).',
'- Con eso ya NO hace falta el workaround DIVIDIR(...; "T"; 1).',
'- Para cruzar dos fechas, ambas deben ser del mismo tipo (Fecha = Fecha).',
'',
'### Contexto Prueba DOTA',
'- Insumos Drive: DB_DOTA_v3.xlsx, Reporte_FD_v3.xlsx, Parametria_Comercio_v2.xlsx, y el calendario',
'  Formato DIAS HABILES ARGENTINA.xlsx (cubre 2019→2072; columnas PAIS, FECHA, CONCEPTO, CLASIFICATION, ID_SUM, ID_FINAL, DAY, YEAR;',
'  ID_SUM = contador de día hábil, ID_FINAL = mapeo número→fecha).',
'',
'## ⚙️ PARÁMETROS DE OPERACIÓN',
'1. CERO ALUCINACIÓN. No inventes comportamiento, nombres de columna, datos ni resultados. Si falta un dato, pedilo antes de responder.',
'2. Toda afirmación sobre datos = con evidencia. Si pega captura/texto, citá lo que ves; no extrapoles de un archivo a otro.',
'3. Si comparte capturas/archivos de Drive y tenés herramientas (Drive MCP / lectura de imágenes), usalas para leer el contenido real. Si no, pedí transcribir el dato clave.',
'4. Idioma: español. Tono directo, sin relleno. Interacciones cortas, una tarea por mensaje.',
'5. NO toques código del módulo DA-2026. Si la tarea deriva en actualizar la guía del módulo, avisá que eso es otro flujo (PROMPT_14-WORK_TEST) y seguí con el trabajo de plataforma.',
'6. Antes de una fórmula compleja, confirmá: nombres de columna, tipo de cada una, y qué tiene que salir (ejemplo entrada→salida).',
'',
'## 🚦 PROTOCOLO AL INICIAR',
'1. Leé la ZONA PARA PEGAR. 2. Si está claro y tenés lo necesario → resolvé directo. 3. Si falta evidencia → hacé 1-3 preguntas concretas y esperá. 4. Si es grande → proponé un plan numerado corto y pedí OK. 5. Recordá las reglas de oro si hay casteos o columnas que no se actualizan.',
'',
'## 📤 FORMATO DE SALIDA',
'- Qué vamos a hacer (1 línea) · Pasos numerados con ruta de menú + nombres exactos · Fórmula lista para copiar en bloque de código · Resultado esperado (entrada→salida) · ⚠ Gotcha solo si aplica. Nada de relleno.'
    ].join('\n');
    document.getElementById('askResult').style.display = 'block';
    const h = document.getElementById('askResultHead'); if (h) h.textContent = '· trabajo puro Simetrik · prompt listo ·';
    document.getElementById('askOutput').textContent = p;
    document.getElementById('askOutput').dataset.raw = p;
    document.getElementById('askResult').scrollIntoView({ behavior:'smooth', block:'start' });
  }

  /* ── MASTER REVIEW PROMPT ────────────────────────────────────
     Construye un prompt completo de auditoría/restructuración:
     incluye TODO el contenido del módulo + instrucciones para que
     Claude detecte info nueva y proponga cambios estructurados a
     Empieza Aquí, Simulador App, Playbook Ficohsa y Diccionario.
  */
  function buildMasterReviewPrompt(){
    const kb = loadKB().trim();
    const cases = _load(K_CASES);
    const errors = _load(K_ERRORS);
    const learnings = _load(K_LEARN);
    const wf = (function(){try{return localStorage.getItem('work_eco_workflow')||'';}catch{return '';}})();
    const cu = (function(){try{return localStorage.getItem('work_eco_course')||'';}catch{return '';}})();
    let dict = []; try { dict = JSON.parse(localStorage.getItem('work_eco_dict')||'[]'); } catch {}
    let nbMeta = []; try { nbMeta = JSON.parse(localStorage.getItem('work_nb_meta')||'[]'); } catch {}
    let nbData = {}; try { nbData = JSON.parse(localStorage.getItem('work_nb_data')||'{}'); } catch {}
    const kbAtts = _loadKbAtts();

    const stripHtml = (h) => (h||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
    const totalDictByCat = {};
    dict.forEach(d => { totalDictByCat[d.cat] = (totalDictByCat[d.cat]||0)+1; });

    let p = '';
    p += '<role>\n';
    p += 'You are Claude, the agent maintaining the DA-2026 14-WORK · Simetrik Ecosystem module of Miguel Barros Torres. ';
    p += 'Miguel works as a Reconciliations Analyst / Implementation Specialist at Simetrik on the Ficohsa Honduras project. ';
    p += 'He populated his personal Simetrik knowledge base from his work PC and asks you to AUDIT it, detect what is new or changed, and propose precise updates to the 4 main display sections of the module: ';
    p += '(1) Empieza Aquí (mind map · pages/simetrik-learn.html), ';
    p += '(2) Simulador App (interactive replica · pages/simetrik-app.html), ';
    p += '(3) Playbook Ficohsa (Ficohsa-specific manual · pages/simetrik-playbook.html), and ';
    p += '(4) Diccionario (~210 entries with sid-based seed in js/work.js).\n';
    p += 'Respond in Spanish (es). Be precise, evidence-driven, and reference what you read from the user content. NO INVENTION — never propose info that is not supported by the user content or by the official Simetrik App.md / Domain Framework already loaded in the project.\n';
    p += '</role>\n\n';

    p += '<project_architecture>\n';
    p += '- Stack: 100% Vanilla JS, GitHub Pages, Supabase JSONB sync via SYNC_REGISTRY in cloud-sync.js.\n';
    p += '- Module 14-WORK has 13 tabs: 🧭 Empieza Aquí · 🖥️ Simulador App · 📘 Playbook Ficohsa · 📖 Diccionario · 📝 Notas Workflow · 🎓 Notas Curso · 📓 Cuadernos · 📋 Casos · 🐛 Errores · 💡 Aprendizajes · 🗓️ MOIF (Monitoreo y Observabilidad Integraciones Ficohsa · reuniones del proyecto con transcripts) · 📚 KB · 🤖 Copilot.\n';
    p += '- Storage keys (synced): work_cases, work_errors, work_learnings, work_kb, work_nb_meta, work_nb_data, work_eco_workflow, work_eco_course, work_eco_dict, work_moif_meetings.\n';
    p += '- Local only (not synced): work_kb_atts (metadata only — file blobs in IDB), work_eco_dict_seed_v, work_learn_progress.\n';
    p += '- Dictionary seed in js/work.js, namespace WORK.eco. Each entry: {sid, term, cat, en, def, ex}. Categories: term · acro · process · platform · software. SEED_VERSION current = simetrik-2026-05-14.1. Idempotent by sid — never overwrites user-created entries.\n';
    p += '- Mind map nodes (Empieza Aquí · 8 nodos): que-es · cuenta · la-app · ia · dominios · contabilidad · conciliacion · ejercicios.\n';
    p += '- Simulador App screens (24): resumen · ad-recursos · ad-concil · ad-repos · catalogo · replicas · repositorios · conexiones · recursos · conciliaciones · fuentes3 · auto-contables · config-cierre · erp · agentes · alarmas · tableros-op · consolidaciones · buscador · g-recursos · tableros-cont · asientos · periodos · concil-cuentas · historial · fotos · mapas · procesos · papelera · descargas. Each screen has hotspots (interactive tooltips).\n';
    p += '- Playbook sections (11): snapshot · team · timeline · accounting (5-lesson mini-course) · puc · recon-course (5 lessons) · processes · cheatsheet · faq · resources.\n';
    p += '</project_architecture>\n\n';

    p += '<user_content_to_audit>\n';

    p += '<kb><![CDATA[\n' + (kb || '(empty)') + '\n]]></kb>\n';
    p += '<kb_attachments count="' + kbAtts.length + '">' + kbAtts.map(a => a.name + ' (' + (a.ext||'') + ')').join(' · ') + '</kb_attachments>\n\n';

    p += '<cases count="' + cases.length + '">\n';
    cases.forEach(c => {
      p += '  <case severity="'+(c.severity||'')+'" status="'+(c.status||'')+'" client="'+(c.client||'')+'" date="'+(c.date||'')+'">\n';
      p += '    <title>'+(c.title||'')+'</title>\n';
      p += '    <body>'+(c.body||'').slice(0,1500)+(c.body && c.body.length>1500?'... [truncated]':'')+'</body>\n';
      if (c.attachments && c.attachments.length) p += '    <attachments>'+c.attachments.map(a=>a.name).join(' · ')+'</attachments>\n';
      p += '  </case>\n';
    });
    p += '</cases>\n\n';

    p += '<errors count="' + errors.length + '">\n';
    errors.forEach(e => {
      p += '  <error code="'+(e.code||'')+'" date="'+(e.date||'')+'">\n';
      p += '    <title>'+(e.title||'')+'</title>\n';
      p += '    <body>'+(e.body||'').slice(0,1000)+(e.body && e.body.length>1000?'... [truncated]':'')+'</body>\n';
      if (e.attachments && e.attachments.length) p += '    <attachments>'+e.attachments.map(a=>a.name).join(' · ')+'</attachments>\n';
      p += '  </error>\n';
    });
    p += '</errors>\n\n';

    const moifs = _load(K_MOIF);
    p += '<moif_meetings count="' + moifs.length + '">\n';
    moifs.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'')).forEach(m => {
      p += '  <meeting date="'+(m.date||'')+'" type="'+(m.type||'')+'">\n';
      p += '    <title>'+(m.title||'')+'</title>\n';
      if (m.participants) p += '    <participants>'+m.participants+'</participants>\n';
      if (m.summary) p += '    <summary>'+m.summary.slice(0,600)+'</summary>\n';
      if (m.actions) p += '    <actions>'+m.actions.slice(0,600)+'</actions>\n';
      p += '    <transcript_excerpt>'+(m.transcript||'').slice(0,2000)+((m.transcript||'').length>2000?'... [truncated · '+m.transcript.length+' chars total]':'')+'</transcript_excerpt>\n';
      if (m.attachments && m.attachments.length) p += '    <attachments>'+m.attachments.map(a=>a.name).join(' · ')+'</attachments>\n';
      p += '  </meeting>\n';
    });
    p += '</moif_meetings>\n\n';

    p += '<learnings count="' + learnings.length + '">\n';
    learnings.forEach(l => {
      p += '  <learning tag="'+(l.tag||'')+'" date="'+(l.date||'')+'">\n';
      p += '    <title>'+(l.title||'')+'</title>\n';
      p += '    <body>'+(l.body||'').slice(0,1000)+(l.body && l.body.length>1000?'... [truncated]':'')+'</body>\n';
      if (l.attachments && l.attachments.length) p += '    <attachments>'+l.attachments.map(a=>a.name).join(' · ')+'</attachments>\n';
      p += '  </learning>\n';
    });
    p += '</learnings>\n\n';

    p += '<workflow_notes><![CDATA[\n' + (stripHtml(wf) || '(empty)').slice(0,3000) + '\n]]></workflow_notes>\n';
    p += '<course_notes><![CDATA[\n' + (stripHtml(cu) || '(empty)').slice(0,3000) + '\n]]></course_notes>\n\n';

    p += '<notebooks count="' + (nbMeta.length||0) + '">\n';
    nbMeta.forEach(n => {
      const pages = (nbData[n.id] && nbData[n.id].pages) || [];
      p += '  <notebook name="'+(n.name||'')+'" icon="'+(n.icon||'')+'" cover="'+(n.cover||'')+'" pages="'+pages.length+'">\n';
      pages.slice(0,10).forEach(pg => {
        p += '    <page title="'+(pg.title||'(sin título)')+'">'+stripHtml(pg.body||'').slice(0,400)+'</page>\n';
      });
      p += '  </notebook>\n';
    });
    p += '</notebooks>\n\n';

    p += '<dictionary total="' + dict.length + '">\n';
    Object.keys(totalDictByCat).forEach(cat => {
      p += '  <category cat="'+cat+'" count="'+totalDictByCat[cat]+'"/>\n';
    });
    p += '</dictionary>\n';
    p += '</user_content_to_audit>\n\n';

    p += '<task>\n';
    p += 'AUDIT the user_content_to_audit above and produce a STRUCTURED UPDATE PROPOSAL in Spanish, with 5 sections clearly delimited:\n\n';
    p += '## 1. RESUMEN DEL CONTENIDO NUEVO DETECTADO\n';
    p += '   Bullet list with NEW concepts, processes, platforms, terms, examples, gotchas, or workflows that appear in user content and that are NOT already covered in the 4 display sections (mind map / simulator / playbook / dictionary).\n\n';
    p += '## 2. CAMBIOS PROPUESTOS · DICCIONARIO\n';
    p += '   For each NEW dictionary entry, output one line in this exact format so it can be copy-pasted into SEED_DICT in js/work.js:\n';
    p += '   {sid:\'XXX\',term:\'YYY\',cat:\'term|acro|process|platform|software\',en:\'\',def:\'...\',ex:\'...\'},\n';
    p += '   The sid must be lowercase, no spaces, unique. Do NOT propose entries already in the seed (check the project_architecture context).\n\n';
    p += '## 3. CAMBIOS PROPUESTOS · EMPIEZA AQUÍ (mind map)\n';
    p += '   For each existing node (que-es, cuenta, la-app, ia, dominios, contabilidad, conciliacion, ejercicios), list any new sub-items or examples that should be added based on user content. Format: NODE: <node-key> · ADD: <sub-item title> · CONTENT: <one short paragraph>.\n';
    p += '   If a NEW top-level node is justified (rare), propose it with name + 3-line summary.\n\n';
    p += '## 4. CAMBIOS PROPUESTOS · SIMULADOR APP\n';
    p += '   For each of the 24 screens, list any new hotspot or sub-card that should be added. Format: SCREEN: <screen-key> · ADD-HOTSPOT: <element> · CAT: <category> · TITLE: <h3> · BODY: <p> · USE: <example> · TIP: <tip>.\n';
    p += '   Use tip categories from the existing hotspot system (Métrica · Panel · Acción · Proceso · Estado · Dashboard · Mapa · Diagnóstico · Workflow · Config · Plantilla · Conciliación · Agente IA · Auditar).\n\n';
    p += '## 5. CAMBIOS PROPUESTOS · PLAYBOOK FICOHSA\n';
    p += '   For each existing section (snapshot, team, timeline, accounting, puc, recon-course, processes, cheatsheet, faq), list additions. Format: SECTION: <section-id> · ADD: <what> · CONTENT: <markdown>.\n\n';
    p += '## 6. INFO INSUFICIENTE / PREGUNTAS PARA MIGUEL\n';
    p += '   If user content references something that is incomplete (e.g. mentions "the X process" without details), list specific questions to ask Miguel BEFORE proposing display changes. Anti-hallucination rule applies.\n\n';
    p += '## 7. CONFLICTOS / INCONSISTENCIAS\n';
    p += '   If user content contradicts what is already documented (in Simetrik App.md or current dictionary), flag it explicitly. Do NOT silently resolve.\n';
    p += '</task>\n\n';

    p += '<rules>\n';
    p += '- Spanish responses, English technical terms preserved (workspace, sweep, source union, etc.).\n';
    p += '- NEVER fabricate Simetrik functionality not present in user content or in the official App.md.\n';
    p += '- If user attached files (binaries listed in <attachments> tags), say "necesito que Miguel me pegue el contenido del archivo X" — you cannot read attachment blobs from this prompt.\n';
    p += '- Cite which user content (case / error / learning / KB / notebook page / note) justifies each proposed change.\n';
    p += '- Prefer additions over rewrites. Existing content stays unless explicitly contradicted.\n';
    p += '- If the audit finds NO new info worth adding, say so plainly — do not invent changes.\n';
    p += '- Output is consumed by another Claude Code session that will apply changes to the actual codebase. Be machine-friendly in the format of sections 2, 3, 4, 5.\n';
    p += '</rules>\n';

    document.getElementById('askResult').style.display = 'block';
    const heading = document.getElementById('askResultHead'); if (heading) heading.textContent = '· master review prompt listo ·';
    document.getElementById('askOutput').textContent = p;
    document.getElementById('askOutput').dataset.raw = p;
  }

  /* ── FORM HELPERS ──────────────────────────────────────────── */
  function clearForm(prefix){
    if (prefix === 'case') {
      ['caseTitle','caseClient','caseBody'].forEach(id => { const el = document.getElementById(id); if (el) el.value=''; });
    } else if (prefix === 'err') {
      ['errTitle','errCode','errBody'].forEach(id => { const el = document.getElementById(id); if (el) el.value=''; });
    } else if (prefix === 'learn') {
      ['learnTitle','learnBody'].forEach(id => { const el = document.getElementById(id); if (el) el.value=''; });
    } else if (prefix === 'moif') {
      ['moifTitle','moifParticipants','moifTranscript','moifSummary','moifActions','moifEditingId'].forEach(id => { const el = document.getElementById(id); if (el) el.value=''; });
      const dt = document.getElementById('moifDate'); if (dt) dt.value = new Date().toISOString().slice(0,10);
      const ft = document.getElementById('moifFormTitle'); if (ft) ft.textContent = '🗓️ Nueva reunión MOIF';
      const sb = document.getElementById('moifSaveBtn'); if (sb) sb.textContent = '💾 Guardar reunión';
    }
  }

  /* ── RENDER ────────────────────────────────────────────────── */
  function _attCloudBadge(a, kind, itemId){
    if (a.cloud) return `<span class="att-cloud on" title="Sincronizado a la nube · descargable desde cualquier device">☁</span>`;
    return `<button class="att-cloud off" onclick="WORK.syncAttToCloud('${kind}','${itemId}','${a.id}')" title="Solo en este device. Click para subir a la nube y poder descargarlo desde otro PC.">☁↑</button>`;
  }
  function _kbAttCloudBadge(a){
    if (a.cloud) return `<span class="att-cloud on" title="Sincronizado a la nube">☁</span>`;
    return `<button class="att-cloud off" onclick="WORK.syncKbAttToCloud('${a.id}')" title="Solo local. Click para subir a la nube.">☁↑</button>`;
  }
  function _itemAttsHtml(kind, id, atts){
    let inner = '';
    if (atts && atts.length){
      inner = atts.map(a => `
        <div class="nb-att">
          <span class="nb-att-ico">${window.NBShared?NBShared.iconForExt(a.ext):'📄'}</span>
          <div class="nb-att-info">
            <div class="nb-att-name" title="${esc(a.name)}">${esc(a.name)}</div>
            <div class="nb-att-meta">${(a.ext||'').toUpperCase()} · ${window.NBShared?NBShared.fmtBytes(a.size||0):a.size+' B'}</div>
          </div>
          ${_attCloudBadge(a, kind, id)}
          <button class="nb-att-btn" onclick="NBShared.downloadAttachment('${a.id}','${esc(a.name).replace(/'/g,'')}')" title="Descargar">⬇</button>
          <button class="nb-att-btn nb-att-del" onclick="WORK.removeAttFromItem('${kind}','${id}','${a.id}')" title="Eliminar">✕</button>
        </div>`).join('');
    }
    return `<div class="item-atts">
      ${inner}
      <button class="item-att-add" onclick="WORK.addAttToItem('${kind}','${id}')">📎 Adjuntar archivo</button>
    </div>`;
  }

  function renderCases(){
    const el = document.getElementById('casesList');
    if (!el) return;
    const list = _load(K_CASES).slice().reverse();
    if (!list.length) { el.innerHTML = '<div style="text-align:center;padding:30px;color:var(--t3);font-size:12px">Sin casos aún. Guardá el primero arriba.</div>'; return; }
    el.innerHTML = list.map(c => `
      <div class="item">
        <div class="item-h">
          <div class="item-t">${esc(c.title)}</div>
          <div class="item-meta">
            <span class="tag tag-${c.severity}">${c.severity.toUpperCase()}</span>
            <span class="tag tag-${c.status}">${c.status}</span>
            ${c.client ? `<span class="client-tag">${esc(c.client)}</span>` : ''}
            <span class="item-date">${fmtDate(c.date)}</span>
            <button class="item-del" onclick="WORK.delCase('${c.id}')">✕</button>
          </div>
        </div>
        <div class="item-body">${esc(c.body)}</div>
        ${_itemAttsHtml('case', c.id, c.attachments)}
      </div>`).join('');
  }

  function renderErrors(){
    const el = document.getElementById('errorsList');
    if (!el) return;
    const list = _load(K_ERRORS).slice().reverse();
    if (!list.length) { el.innerHTML = '<div style="text-align:center;padding:30px;color:var(--t3);font-size:12px">Sin errores registrados aún.</div>'; return; }
    el.innerHTML = list.map(e => `
      <div class="item">
        <div class="item-h">
          <div class="item-t">${esc(e.title)}</div>
          <div class="item-meta">
            ${e.code ? `<span class="client-tag">${esc(e.code)}</span>` : ''}
            <span class="item-date">${fmtDate(e.date)}</span>
            <button class="item-del" onclick="WORK.delError('${e.id}')">✕</button>
          </div>
        </div>
        ${e.body ? `<div class="item-body">${esc(e.body)}</div>` : ''}
        ${_itemAttsHtml('err', e.id, e.attachments)}
      </div>`).join('');
  }

  function renderLearnings(){
    const el = document.getElementById('learnList');
    if (!el) return;
    const list = _load(K_LEARN).slice().reverse();
    if (!list.length) { el.innerHTML = '<div style="text-align:center;padding:30px;color:var(--t3);font-size:12px">Sin aprendizajes aún.</div>'; return; }
    el.innerHTML = list.map(l => `
      <div class="item">
        <div class="item-h">
          <div class="item-t">${esc(l.title)}</div>
          <div class="item-meta">
            <span class="tag tag-${l.tag}">${l.tag}</span>
            <span class="item-date">${fmtDate(l.date)}</span>
            <button class="item-del" onclick="WORK.delLearning('${l.id}')">✕</button>
          </div>
        </div>
        <div class="item-body">${esc(l.body)}</div>
        ${_itemAttsHtml('learn', l.id, l.attachments)}
      </div>`).join('');
  }

  function renderStats(){
    const set = (id,v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('sCases', _load(K_CASES).length);
    set('sErrors', _load(K_ERRORS).length);
    set('sLearn', _load(K_LEARN).length);
    set('sMoif', _load(K_MOIF).length);
    let nbCount = 0; try { nbCount = JSON.parse(localStorage.getItem('work_nb_meta')||'[]').length; } catch {}
    set('sNbs', nbCount);
  }

  function render(){
    renderStats();
    renderCases();
    renderErrors();
    renderLearnings();
    renderMoif();
    renderKbAtts();
    const kbField = document.getElementById('kbBody');
    if (kbField && !kbField.value) kbField.value = loadKB();
    // Default date for MOIF form if empty
    const dt = document.getElementById('moifDate');
    if (dt && !dt.value) dt.value = new Date().toISOString().slice(0,10);
  }

  /* ── ECOSISTEMA: Workflow + Mini-curso + Diccionario ──────── */
  const eco = (function(){
    const K_WF='work_eco_workflow', K_CU='work_eco_course', K_DICT='work_eco_dict';
    const EDITORS={ wf:{key:K_WF,body:'wfBody',badge:'wfSaved'}, cu:{key:K_CU,body:'cuBody',badge:'cuSaved'} };
    let timers={};
    function loadStr(k){ try{return localStorage.getItem(k)||'';}catch{return '';} }
    function saveStr(k,v){ try{localStorage.setItem(k,v);}catch(e){alert('Sin espacio: '+e.message);} }
    function loadDict(){ try{return JSON.parse(localStorage.getItem(K_DICT)||'[]');}catch{return [];} }
    function saveDict(v){ try{localStorage.setItem(K_DICT,JSON.stringify(v));}catch(e){alert('Sin espacio: '+e.message);} }

    function initEditor(kind){
      const cfg=EDITORS[kind]; if(!cfg) return;
      const el=document.getElementById(cfg.body); if(!el) return;
      if(el._inited) return; el._inited=true;
      el.innerHTML=loadStr(cfg.key);
      el.addEventListener('input',()=>{
        clearTimeout(timers[kind]);
        timers[kind]=setTimeout(()=>{
          saveStr(cfg.key, el.innerHTML);
          const b=document.getElementById(cfg.badge);
          if(b){ b.style.opacity='1'; clearTimeout(b._t); b._t=setTimeout(()=>b.style.opacity='0',1200);}
        },500);
      });
      el.addEventListener('blur',()=>{ clearTimeout(timers[kind]); saveStr(cfg.key, el.innerHTML); });
    }
    function fmt(kind, op){
      const cfg=EDITORS[kind]; if(!cfg) return;
      const el=document.getElementById(cfg.body); if(!el) return;
      el.focus();
      try{
        if(op==='bold') document.execCommand('bold');
        else if(op==='italic') document.execCommand('italic');
        else if(op==='h2') document.execCommand('formatBlock',false,'H2');
        else if(op==='h3') document.execCommand('formatBlock',false,'H3');
        else if(op==='ul') document.execCommand('insertUnorderedList');
        else if(op==='ol') document.execCommand('insertOrderedList');
        else if(op==='quote') document.execCommand('formatBlock',false,'BLOCKQUOTE');
        else if(op==='code') document.execCommand('formatBlock',false,'PRE');
      }catch(e){}
      el.dispatchEvent(new Event('input'));
    }
    function insertLink(kind){
      const url=prompt('URL:'); if(!url) return;
      const cfg=EDITORS[kind]; const el=document.getElementById(cfg.body); el.focus();
      document.execCommand('createLink',false,url);
      el.dispatchEvent(new Event('input'));
    }
    function insertImg(kind){
      const inp=document.createElement('input'); inp.type='file'; inp.accept='image/*';
      inp.onchange=()=>{
        const f=inp.files[0]; if(!f) return;
        const r=new FileReader();
        r.onload=()=>{
          const cfg=EDITORS[kind]; const el=document.getElementById(cfg.body); el.focus();
          document.execCommand('insertImage',false,r.result);
          el.dispatchEvent(new Event('input'));
        };
        r.readAsDataURL(f);
      };
      inp.click();
    }

    let editingId=null;
    function dictAdd(){
      editingId=null;
      document.getElementById('dTerm').value='';
      document.getElementById('dCat').value='term';
      document.getElementById('dEn').value='';
      document.getElementById('dDef').value='';
      document.getElementById('dEx').value='';
      document.getElementById('dictForm').style.display='block';
      document.getElementById('dTerm').focus();
    }
    function dictEdit(id){
      const e=loadDict().find(x=>x.id===id); if(!e) return;
      editingId=id;
      document.getElementById('dTerm').value=e.term||'';
      document.getElementById('dCat').value=e.cat||'term';
      document.getElementById('dEn').value=e.en||'';
      document.getElementById('dDef').value=e.def||'';
      document.getElementById('dEx').value=e.ex||'';
      document.getElementById('dictForm').style.display='block';
      window.scrollTo({top:document.getElementById('dictForm').offsetTop-80,behavior:'smooth'});
    }
    function dictCancel(){ document.getElementById('dictForm').style.display='none'; editingId=null; }
    function dictSave(){
      const term=document.getElementById('dTerm').value.trim();
      if(!term) return alert('Término requerido.');
      const entry={
        id: editingId || 'd_'+Date.now(),
        term, cat:document.getElementById('dCat').value,
        en:document.getElementById('dEn').value.trim(),
        def:document.getElementById('dDef').value.trim(),
        ex:document.getElementById('dEx').value.trim(),
        updated:new Date().toISOString(),
      };
      const list=loadDict();
      if(editingId){ const i=list.findIndex(x=>x.id===editingId); if(i>=0) list[i]=entry; }
      else list.push(entry);
      list.sort((a,b)=>a.term.localeCompare(b.term));
      saveDict(list);
      dictCancel();
      dictRender();
    }
    function dictDel(id){
      if(!confirm('¿Eliminar entrada?')) return;
      saveDict(loadDict().filter(x=>x.id!==id));
      dictRender();
    }
    const CAT_LBL={term:'📚 Términos',acro:'🔤 Siglas',process:'⚙️ Procesos',platform:'🏛️ Plataformas',software:'💻 Software'};
    const CAT_ORDER=['acro','term','process','platform','software'];
    function dictRender(){
      const wrap=document.getElementById('dictList'); if(!wrap) return;
      const q=(document.getElementById('dictSearch')?.value||'').toLowerCase();
      const filter=document.getElementById('dictFilter')?.value||'';
      let list=loadDict();
      if(filter) list=list.filter(e=>e.cat===filter);
      if(q) list=list.filter(e=>(e.term+' '+e.en+' '+e.def).toLowerCase().includes(q));
      if(!list.length){
        wrap.innerHTML='<div style="text-align:center;padding:40px;color:var(--t3);font-size:13px">Sin coincidencias. Probá otra búsqueda o agregá una entrada con <b>+ Nueva entrada</b>.</div>';
        return;
      }
      // Group by cat
      const grouped={};
      list.forEach(e=>{ (grouped[e.cat]=grouped[e.cat]||[]).push(e); });
      const total=list.length;
      let html=`<div style="font-size:11px;color:var(--t3);font-family:'IBM Plex Mono',monospace;margin-bottom:10px;letter-spacing:.5px">${total} entradas · click en cualquier término para expandir definición</div>`;
      CAT_ORDER.forEach(cat=>{
        if(!grouped[cat]||!grouped[cat].length) return;
        const entries=grouped[cat].sort((a,b)=>a.term.localeCompare(b.term));
        html+=`<div class="dict-group">
          <div class="dict-group-h">${CAT_LBL[cat]||cat} <span class="dict-group-c">${entries.length}</span></div>
          <div class="dict-group-grid">
            ${entries.map(e=>`<div class="dict-row" data-id="${e.id}" onclick="WORK.eco.dictToggle('${e.id}')">
              <div class="dict-row-h">
                <span class="dict-row-t">${esc(e.term)}</span>${e.en?`<span class="dict-row-en">${esc(e.en)}</span>`:''}
                <span class="dict-row-chev">▾</span>
              </div>
              <div class="dict-row-body" id="dr-${e.id}">
                ${e.def?`<div class="dict-row-def">${esc(e.def)}</div>`:''}
                ${e.ex?`<div class="dict-row-ex">${esc(e.ex)}</div>`:''}
                <div class="dict-row-act" onclick="event.stopPropagation()">
                  <button onclick="WORK.eco.dictEdit('${e.id}')">✏️ Editar</button>
                  <button onclick="WORK.eco.dictDel('${e.id}')">🗑️ Eliminar</button>
                </div>
              </div>
            </div>`).join('')}
          </div>
        </div>`;
      });
      wrap.innerHTML=html;
    }
    function dictToggle(id){
      const row=document.querySelector('.dict-row[data-id="'+id+'"]');
      if(row) row.classList.toggle('open');
    }
    /* ── Dictionary seed (one-time, idempotent by `seed_id`) ─── */
    const SEED_VERSION = 'simetrik-2026-06-04.1'; // v3.1: +9 entradas Dota rebuild (4 reglas de oro, T001, casteo ISO→Fecha, calendario AR nuevo, ID_SUM/ID_FINAL)
    const SEED_DICT = [
      // ── Project roles & artifacts ──
      {sid:'is',term:'IS',cat:'acro',en:'Implementation Specialist',def:'Especialista de Implementación. El encargado de llevar el diseño en papel a la configuración real en la plataforma Simetrik.',ex:'Tú eres el IS en el proyecto Ficohsa.'},
      {sid:'rfp',term:'RFP',cat:'acro',en:'Request For Proposal',def:'Solicitud de Propuesta. Documento original donde el cliente describe la necesidad y los proveedores cotizan.',ex:'El RFP de Ficohsa pidió conciliar 945 cuentas y +35M transacciones/mes.'},
      {sid:'sdd',term:'SDD',cat:'acro',en:'Solution Design Document',def:'Documento de Diseño de la Solución. Tu mapa de trabajo: define reglas de matching, integraciones, parseos y outputs.',ex:'El SDD estimó 54h para configurar el proceso SERCOM.'},
      {sid:'sftp',term:'SFTP',cat:'acro',en:'Secure File Transfer Protocol',def:'Protocolo de transferencia segura de archivos. La carpeta donde el banco deposita archivos TXT cada noche para que Simetrik los lea.',ex:'T24 deja un .TXT en la SFTP cada 23:30; Simetrik lo ingiere a las 23:45.'},
      {sid:'gl',term:'GL',cat:'acro',en:'General Ledger',def:'Libro Mayor. Registro central contable. El objetivo de Simetrik es que todo cruce contra el GL.',ex:'El GL de Ficohsa vive en SAP.'},
      {sid:'kyc',term:'KYC',cat:'acro',en:'Know Your Customer',def:'Conoce a tu Cliente. Normativa que obliga a validar identidad y perfil de riesgo.',ex:'KYC alimenta scoring de fraude.'},
      {sid:'aml',term:'AML',cat:'acro',en:'Anti-Money Laundering',def:'Anti Lavado de Activos. Monitorea y reporta operaciones inusuales.',ex:'Simetrik genera trazabilidad para reportes AML.'},
      {sid:'csm',term:'CSM',cat:'acro',en:'Customer Success Manager',def:'Gerente de Éxito del Cliente. Toma la posta después del Go-Live para asegurar adopción y crecimiento.',ex:'Carolina Toro es la CSM del proyecto Ficohsa.'},
      {sid:'pm',term:'PM',cat:'acro',en:'Project Manager',def:'Gerente de Proyecto. Lidera planificación, ejecución y comunicación con stakeholders.',ex:'Lina Azcárate es la PM en Simetrik.'},
      // ── Financial terms ──
      {sid:'insights',term:'Insights',cat:'term',en:'Perspectivas / Hallazgos',def:'Información accionable derivada de datos brutos. Detecta patrones, fugas o mejoras.',ex:'Los insights muestran que 2% de las recargas no cruzan por formato de fecha.'},
      {sid:'fees',term:'Fees',cat:'term',en:'Tarifas / Comisiones',def:'Lo que cobra el procesador (Claro, Visa, Mastercard). Muchas conciliaciones fallan porque el monto no incluye el fee descontado.',ex:'Visa cobra fee de interchange en cada autorización.'},
      {sid:'clearing',term:'Clearing',cat:'process',en:'Compensación',def:'Paso donde Visa/Mastercard calcula cuánto le toca al banco por las transacciones del día.',ex:'Clearing ocurre antes del Settlement.'},
      {sid:'settlement',term:'Settlement',cat:'process',en:'Liquidación',def:'Transferencia definitiva de fondos. El dinero real entra a la cuenta del banco en SAP.',ex:'Simetrik cruza el Clearing contra el Settlement diario.'},
      {sid:'chargeback',term:'Chargeback',cat:'process',en:'Contracargo / Devolución',def:'Cuando un tarjetahabiente impugna un cargo, el banco emisor revierte la transacción.',ex:'Compra online no reconocida → cliente abre chargeback → comercio presenta evidencia.'},
      {sid:'aging',term:'Aging',cat:'term',en:'Antigüedad (Mora)',def:'Partidas no conciliadas que llevan días sin cruzar. Se "pintan de rojo" según reglas configurables.',ex:'En SERCOM las partidas se marcan rojo a los 3 días sin cruce.'},
      {sid:'writeoff',term:'Write-off',cat:'process',en:'Castigo Contable / Ajuste',def:'Si sobran centavos por redondeo que nunca van a cruzar, se ajustan automáticamente a gastos menores.',ex:'Write-off de 0.05 Lempiras por diferencia de redondeo.'},
      {sid:'leakage',term:'Leakage',cat:'term',en:'Fuga de Ingresos',def:'Pérdida de dinero por errores operativos, malas configuraciones de tarifas o conciliación ineficiente.',ex:'Gateway mal configurado genera revenue leakage del 2% mensual.'},
      {sid:'parseo',term:'Parseo',cat:'process',en:'Parsing / Transformación',def:'Limpieza y estandarización de datos crudos antes del matching: fechas, prefijos, símbolos.',ex:'Quitar el prefijo "504" de los teléfonos hondureños antes de cruzar contra CLARO.'},
      {sid:'dispute',term:'Dispute',cat:'process',en:'Disputa',def:'Cuando el comercio presenta evidencia para rechazar un chargeback (representment).',ex:'Simetrik gestiona el flujo de representment con evidencia adjunta.'},
      {sid:'accrual',term:'Accrual',cat:'term',en:'Devengo / Provisión',def:'Reconocimiento contable de ingresos/gastos antes del flujo de efectivo.',ex:'Los accruals de intereses deben cuadrar con el core bancario.'},
      {sid:'oversight',term:'Oversight',cat:'process',en:'Supervisión',def:'Vigilancia continua de riesgos, cumplimiento y efectividad de controles.',ex:'El comité de oversight revisa mensualmente las cuentas en rojo.'},
      {sid:'compliance',term:'Compliance',cat:'term',en:'Cumplimiento normativo',def:'Función que asegura cumplimiento de KYC, AML, PCI, GDPR y licencias.',ex:'Simetrik genera audit trail para compliance.'},
      {sid:'audittrail',term:'Audit Trail',cat:'term',en:'Rastro de auditoría',def:'Registro inmutable de cada acción del conciliador (maker-checker).',ex:'Cada ajuste manual queda con usuario, fecha y motivo en el audit trail.'},
      {sid:'issuing',term:'Issuing',cat:'process',en:'Emisión',def:'Banco/fintech emite medios de pago asociados a una cuenta. Incluye autorización y gestión del plástico o token digital.',ex:'Ficohsa hace issuing de tarjetas de crédito procesadas en Vision Plus.'},
      {sid:'acquiring',term:'Acquiring',cat:'process',en:'Adquirencia',def:'Permite a comercios aceptar pagos con tarjeta o medios digitales y gestiona la liquidación.',ex:'Getnet, Fiserv, Adyen son adquirentes.'},
      {sid:'gateway',term:'Gateway',cat:'platform',en:'Pasarela de pagos',def:'Software que conecta tienda online con procesadores y emisores, tokenizando datos sensibles.',ex:'Stripe, Checkout.com, Mercado Pago.'},
      {sid:'recon',term:'Reconciliation',cat:'process',en:'Conciliación bancaria',def:'Comparación sistemática entre registros internos y extractos externos para detectar discrepancias.',ex:'Simetrik concilia 50k transacciones diarias contra adquirentes.'},
      {sid:'openbank',term:'Open Banking',cat:'term',en:'Banca abierta',def:'Modelo donde bancos comparten datos de clientes (con consentimiento) mediante APIs estandarizadas.',ex:'Regulado por PSD2 en Europa.'},
      {sid:'scoring',term:'Credit Scoring',cat:'process',en:'Puntaje de crédito',def:'Modelo predictivo de probabilidad de impago usando datos transaccionales, bureau y comportamiento.',ex:'BNPL calcula scoring en 2 segundos para aprobar cuotas.'},
      {sid:'payout',term:'Payout Settlement',cat:'process',en:'Desembolso',def:'Transferencia de fondos a terceros: repartidores, freelancers, afiliados.',ex:'Plataformas de delivery liquidan payout semanal a sus drivers.'},
      {sid:'domain',term:'Domain Framework',cat:'term',en:'Marco de dominio',def:'Organización conceptual de los subdominios (pagos, fraude, clientes) y sus interacciones.',ex:'Aplica Domain Driven Design para separar core transaccional de riesgo.'},
      // ── Platforms / software ──
      {sid:'simetrik',term:'Simetrik',cat:'platform',en:'',def:'Plataforma SaaS de conciliación financiera automatizada. Ingesta + parseo + matching + outputs + audit trail.',ex:'Ficohsa migra 30 analistas de Excel a Simetrik.'},
      {sid:'t24',term:'T24 (Temenos)',cat:'software',en:'',def:'Core bancario de Ficohsa. Maneja préstamos, cuentas, cajas. Exporta TXT/CSV vía SFTP.',ex:'T24 envía transacciones de cajas con TXN_CODE que requiere filtrado (SGN, 4, 54 = efecto cero).'},
      {sid:'visionplus',term:'Vision Plus',cat:'software',en:'',def:'Procesador de tarjetas de crédito (cartera TC, PILs). Genera reportes planos TXT.',ex:'Cruce de saldos de Vision Plus contra GL en SAP.'},
      {sid:'sap',term:'SAP ERP',cat:'software',en:'',def:'Libro Mayor contable. Registro central de todas las cuentas. Recibe asientos de ajuste desde Simetrik.',ex:'El saldo de la cuenta 1-04-01-001 vive en SAP.'},
      {sid:'visa',term:'Visa / Mastercard',cat:'platform',en:'',def:'Marcas de tarjetas. Liquidan adquirencia e issuing. Envían archivos TXT/CSV por FTP o correo.',ex:'Visa publica el archivo de clearing T+1.'},
      // ── Specific Ficohsa codes ──
      {sid:'txncode',term:'TXN_CODE',cat:'term',en:'Transaction Code',def:'Código de transacción en T24. Los códigos SGN, 4 y 54 son de efecto cero (no afectan saldo) y se excluyen del matching.',ex:'Filtrar TXN_CODE NOT IN (SGN, 4, 54) antes de cruzar.'},
      {sid:'transref',term:'TRANS_REFERENCE',cat:'term',en:'Transaction Reference',def:'Llave única de la transacción en T24. Se usa como matching key contra TRANSACCIONBANCO en SAP.',ex:'T24.TRANS_REFERENCE = SAP.TRANSACCIONBANCO'},
      {sid:'sercom',term:'SERCOM',cat:'process',en:'',def:'Servicios de Comunicaciones. Cuenta transitoria 2-01-01-003 / 2330203151 para recargas de telefonía móvil.',ex:'Recargas SERCOM cruzan T24 (débito) vs CLARO (crédito) vs SAP (saldo).'},
      {sid:'transitoria',term:'Cuenta Transitoria',cat:'term',en:'Suspense / Transit Account',def:'Cuenta puente temporal. Débitos = Créditos. Saldo final debe ser CERO.',ex:'En 2-01-01-003 la suma algebraica del día debe ser 0.'},
      {sid:'matching',term:'Matching',cat:'process',en:'Cruce',def:'Motor lógico que asocia una transacción de la Fuente A con una o varias de la Fuente B según reglas (1:1, 1:N, N:M, con tolerancias).',ex:'Regla: A.Num_Referencia == B.Referencia AND A.Monto == B.Monto.'},
      // ── Simetrik-specific (building blocks, arquitectura) ──
      {sid:'sbb',term:'SBB',cat:'term',en:'Simetrik Building Block',def:'Bloque modular drag-and-drop con el que ensamblás flujos sin programar. Hay SBBs de ingesta, parseo, matching, output.',ex:'El SBB "Date Parser" convierte cualquier formato de fecha al estándar ISO.'},
      {sid:'ruleset',term:'Rule Set',cat:'term',en:'Conjunto de reglas',def:'Cadena ordenada de reglas de matching. Simetrik intenta primero la más estricta; si falla pasa a la siguiente.',ex:'Regla 1 = match perfecto, Regla 2 = ±$0.05, Regla 3 = ±1 día, Regla 4 = excepción.'},
      {sid:'sourceunion',term:'Source Union',cat:'process',en:'Unificación de fuentes',def:'Mecanismo que unifica varias fuentes con esquemas distintos en uno común. Mapeo columna a columna.',ex:'3 bancos envían extractos con columnas distintas → Source Union los normaliza.'},
      {sid:'matchperfect',term:'Match Perfecto',cat:'term',en:'Perfect Match',def:'Cruce 1:1 sin tolerancias. Es el ideal: máxima confianza, sin ambigüedad.',ex:'A.id == B.id AND A.amount == B.amount AND A.date == B.date.'},
      {sid:'tolerance',term:'Tolerancia',cat:'term',en:'Tolerance',def:'Margen permitido para considerar match (típicamente por redondeo, timing o fees descontados).',ex:'Tolerancia de ±$0.05 en monto y ±1 día en fecha.'},
      {sid:'exception',term:'Excepción',cat:'term',en:'Exception',def:'Transacción que no encontró contraparte tras aplicar todas las reglas. Cae al dashboard para investigación manual.',ex:'Excepción por 5 días = "valor en rojo".'},
      {sid:'workspace',term:'Workspace',cat:'platform',en:'',def:'Ambiente aislado del cliente. Cada cliente (Ficohsa, otro banco) tiene su workspace con sources, reglas y usuarios separados.',ex:'app.simetrik.com/workspace/ficohsa'},
      {sid:'snowflake',term:'Snowflake',cat:'software',en:'',def:'Data warehouse en la nube. Es el motor de almacenamiento debajo de Simetrik. No lo tocás, pero permite consultas sobre miles de millones de filas con latencia ~0.',ex:'Simetrik corre sobre Snowflake + AWS.'},
      {sid:'aws',term:'AWS',cat:'software',en:'Amazon Web Services',def:'Proveedor de nube donde corre la infraestructura de Simetrik. Garantiza escalabilidad y disponibilidad.',ex:'Compliance SOC 2 Type II vía AWS.'},
      {sid:'nocode',term:'No-Code',cat:'term',en:'Sin código',def:'Filosofía donde configurás reglas y flujos sin escribir programación. Reduce dependencia de TI hasta 70%.',ex:'El contador define "fee aceptable ±2%" sin abrir ticket a tecnología.'},
      {sid:'aiagent',term:'AI Agent',cat:'term',en:'Agente de IA',def:'Bot que corre en background asistiendo en tareas repetitivas: limpia datos, sugiere matches, detecta fraude.',ex:'Match Suggester: "85% de probabilidad que esta excepción cruce con tx #99281".'},
      {sid:'datacleaner',term:'Data Cleaner Agent',cat:'process',en:'',def:'Agente IA que detecta inconsistencias en datos crudos y sugiere parseos (formatos de fecha, encoding, espacios).',ex:'Detecta que un source mezcla DD/MM/YYYY y MM-DD-YY → sugiere normalizar.'},
      {sid:'frauddet',term:'Fraud Detector',cat:'process',en:'',def:'Agente IA que marca transacciones anómalas: montos atípicos, horarios extraños, comercios sospechosos.',ex:'Marca tx de $50K a las 3 AM en un comercio nuevo.'},
      {sid:'rootcause',term:'Root Cause Analyst',cat:'process',en:'',def:'Agente IA que analiza patrones históricos y propone la causa raíz de una excepción.',ex:'"Este tipo de excepción suele ser por falta de aplicar el fee de Visa".'},
      // ── Connect / Reconcile / Resolve ──
      {sid:'connect',term:'Connect',cat:'process',en:'Conectar',def:'Primer pilar del ciclo Simetrik: traer los datos. Conectás fuentes vía API, SFTP o upload manual.',ex:'Conectar SAP, Stripe y un banco al workspace Ficohsa.'},
      {sid:'reconcile',term:'Reconcile',cat:'process',en:'Conciliar',def:'Segundo pilar: configurar Rule Sets para que el motor cruce las fuentes automáticamente.',ex:'Reconcile = el corazón de Simetrik.'},
      {sid:'resolve',term:'Resolve',cat:'process',en:'Resolver',def:'Tercer pilar: trabajar las excepciones del dashboard con ayuda de IA, dejando audit trail completo.',ex:'Resolver una excepción con motivo "duplicado en origen + write-off $0.02".'},
      // ── ERPs y sistemas ──
      {sid:'erp',term:'ERP',cat:'acro',en:'Enterprise Resource Planning',def:'Sistema integrado de gestión empresarial. Maneja contabilidad, RRHH, inventario, ventas en un solo lugar.',ex:'SAP y Oracle son los ERPs más comunes en bancos grandes.'},
      {sid:'oracle',term:'Oracle ERP',cat:'software',en:'',def:'Alternativa a SAP para gestión financiera. Muchas fintech latinoamericanas lo usan.',ex:'Algunos clientes de Simetrik corren Oracle como GL.'},
      {sid:'stripe',term:'Stripe',cat:'platform',en:'',def:'Pasarela de pagos global. Provee API y reportes de settlement, fees y disputes.',ex:'Conectás Stripe vía API key y trae diariamente los settlements.'},
      {sid:'mp',term:'Mercado Pago',cat:'platform',en:'',def:'Pasarela líder en Latam. Reportes vía API o CSV de transacciones, fees y payouts.',ex:'Crítico en e-commerce regional.'},
      {sid:'core',term:'Core Bancario',cat:'term',en:'Core Banking',def:'Sistema principal del banco que registra cuentas, transacciones, préstamos en tiempo real.',ex:'T24 (Temenos) es el core bancario de Ficohsa.'},
      {sid:'fintech',term:'Fintech',cat:'term',en:'',def:'Empresa que aplica tecnología a servicios financieros. Suelen ser nativas digitales y operar con APIs abiertas.',ex:'Nubank, Revolut, Ualá.'},
      {sid:'baas',term:'BaaS',cat:'acro',en:'Banking as a Service',def:'Modelo donde una fintech alquila la licencia bancaria de un banco para emitir tarjetas o cuentas.',ex:'Uber emite tarjetas para conductores vía BaaS con un partner bancario.'},
      {sid:'bnpl',term:'BNPL',cat:'acro',en:'Buy Now Pay Later',def:'Compra ahora, paga después. Fintech otorga cuotas en checkout sin tarjeta de crédito tradicional.',ex:'Klarna, Affirm, Mercado Crédito.'},
      // ── Normas y compliance ──
      {sid:'sox',term:'SOX',cat:'acro',en:'Sarbanes-Oxley Act',def:'Ley estadounidense de controles internos financieros. Obliga audit trail, segregación de funciones y maker-checker.',ex:'Simetrik genera evidencia para auditorías SOX (audit trail + segregación de roles).'},
      {sid:'ifrs15',term:'IFRS 15',cat:'acro',en:'',def:'Norma internacional sobre reconocimiento de ingresos. Define cuándo y cómo reconocer una venta como ingreso.',ex:'La conciliación de Settlement debe cumplir IFRS 15 para reportar ingresos correctamente.'},
      {sid:'pci',term:'PCI DSS',cat:'acro',en:'Payment Card Industry Data Security Standard',def:'Estándar de seguridad para procesamiento de tarjetas. Define cifrado, tokenización y controles de acceso.',ex:'Simetrik no almacena PAN (número de tarjeta) crudo: cumple PCI por tokenización.'},
      {sid:'gdpr',term:'GDPR',cat:'acro',en:'General Data Protection Regulation',def:'Reglamento europeo de protección de datos. Aplica también si manejás datos de europeos.',ex:'Derecho al olvido, consentimiento explícito, breach notification 72h.'},
      {sid:'fatf',term:'FATF',cat:'acro',en:'Financial Action Task Force',def:'Organismo intergubernamental que define estándares anti-lavado (AML) y financiamiento al terrorismo.',ex:'Las recomendaciones FATF guían los procedimientos KYC.'},
      {sid:'uif',term:'UIF',cat:'acro',en:'Unidad de Información Financiera',def:'Autoridad nacional que recibe reportes de operaciones sospechosas (ROS) de los bancos.',ex:'Si AML detecta lavado → se reporta a UIF en 48h.'},
      {sid:'pep',term:'PEP',cat:'acro',en:'Politically Exposed Person',def:'Personas Expuestas Políticamente. KYC obliga a validar si un cliente es PEP por riesgo elevado.',ex:'Listas Dow Jones / World-Check incluyen PEPs globales.'},
      // ── Datos y data engineering ──
      {sid:'etl',term:'ETL',cat:'acro',en:'Extract Transform Load',def:'Proceso de extraer datos de un origen, transformarlos (parseo, validación) y cargarlos en un destino.',ex:'Simetrik hace ETL automatizado entre sources y su data warehouse.'},
      {sid:'elt',term:'ELT',cat:'acro',en:'Extract Load Transform',def:'Variante del ETL: primero se cargan crudos, luego se transforman in-warehouse. Más moderno con Snowflake.',ex:'Simetrik usa ELT — todo aterriza primero en Snowflake.'},
      {sid:'api',term:'API',cat:'acro',en:'Application Programming Interface',def:'Punto de conexión entre sistemas. Permite que Simetrik consulte datos de Stripe, T24, etc. en tiempo real.',ex:'API REST de Stripe: GET /v1/charges devuelve cobros del día.'},
      {sid:'webhook',term:'Webhook',cat:'term',en:'',def:'Notificación HTTP automática: cuando ocurre un evento, el sistema externo "empuja" la info a tu URL.',ex:'Stripe envía webhook cada vez que se completa un settlement.'},
      {sid:'csv',term:'CSV',cat:'acro',en:'Comma-Separated Values',def:'Formato de archivo de texto plano para tablas. Separador comúnmente coma, pero puede ser pipe |.',ex:'T24 exporta a CSV con delimitador pipe.'},
      {sid:'json',term:'JSON',cat:'acro',en:'JavaScript Object Notation',def:'Formato de datos estructurado, jerárquico. Estándar en APIs modernas.',ex:'Las APIs de Stripe devuelven JSON.'},
      {sid:'xml',term:'XML',cat:'acro',en:'',def:'Formato de datos jerárquico más viejo que JSON. Aún común en banca core tradicional.',ex:'SWIFT MT103 viene en formato XML.'},
      {sid:'schema',term:'Schema',cat:'term',en:'Esquema',def:'Definición de la estructura de los datos: nombres de columnas, tipos, restricciones.',ex:'Schema común post Source Union: {date, amount, currency, reference}.'},
      // ── Roles y stakeholders ──
      {sid:'sa',term:'SA',cat:'acro',en:'Solutions Architect',def:'Arquitecto de Soluciones. Diseña el SDD que vos implementás.',ex:'El SA traduce el RFP en un SDD técnico.'},
      {sid:'sm',term:'SM',cat:'acro',en:'Services Manager',def:'Gerente de Servicios. Lidera la implementación del lado Simetrik.',ex:'Ana M. es la SM del proyecto Ficohsa.'},
      {sid:'sc',term:'SC',cat:'acro',en:'Solutions Consultant',def:'Rol comercial-técnico que analiza el RFP y co-define el alcance de preventa.',ex:'El SC participa en Fase 0 (Preventa & RFP).'},
      {sid:'seniorIS',term:'Senior IS',cat:'acro',en:'',def:'Implementation Specialist con experiencia. Lidera mesas de Discovery y supervisa al IS junior.',ex:'Juan C. / Wilson son Senior IS en Ficohsa.'},
      {sid:'sponsor',term:'Sponsor',cat:'term',en:'Patrocinador',def:'Persona del cliente con autoridad para aprobar presupuesto y decisiones críticas.',ex:'En Ficohsa, el sponsor es del comité ejecutivo.'},
      {sid:'stakeholder',term:'Stakeholder',cat:'term',en:'',def:'Cualquier persona impactada o con interés en el proyecto: operaciones, IT, contabilidad, auditoría.',ex:'Mapa de stakeholders: Seguridad, Cloud, Datos, Integraciones, Arquitectura.'},
      // ── Métricas operativas ──
      {sid:'kpi',term:'KPI',cat:'acro',en:'Key Performance Indicator',def:'Métrica que mide éxito. Para conciliación: % auto-match, % excepciones >3 días, tiempo de cierre.',ex:'KPI objetivo: 95%+ auto-match en producción.'},
      {sid:'sla',term:'SLA',cat:'acro',en:'Service Level Agreement',def:'Acuerdo de niveles de servicio. Define respuestas comprometidas (uptime, soporte) con penalizaciones por incumplimiento.',ex:'SLA Ficohsa: 99.9% uptime + soporte 4h en caso crítico.'},
      {sid:'autorate',term:'Auto-Match Rate',cat:'term',en:'Tasa de auto-cruce',def:'% de transacciones que cruzan automáticamente sin intervención humana. KPI estrella.',ex:'Auto-match rate < 80% = el SDD necesita revisión.'},
      {sid:'mttr',term:'MTTR',cat:'acro',en:'Mean Time To Resolution',def:'Tiempo promedio para resolver una excepción.',ex:'MTTR objetivo < 30 min por excepción.'},
      // ── Términos contables ──
      {sid:'partidadoble',term:'Partida Doble',cat:'term',en:'Double-Entry',def:'Principio fundamental: cada transacción afecta al menos dos cuentas (un débito y un crédito que se balancean).',ex:'Cobro a cliente: Débito Caja, Crédito Cuentas por Cobrar.'},
      {sid:'activo',term:'Activo',cat:'term',en:'Asset',def:'Lo que la empresa tiene o le deben. Naturaleza Débito. Códigos PUC empiezan en 1.',ex:'Caja, Bancos, Cartera de Préstamos.'},
      {sid:'pasivo',term:'Pasivo',cat:'term',en:'Liability',def:'Lo que la empresa debe a terceros. Naturaleza Crédito. Códigos PUC empiezan en 2.',ex:'Cuentas de Ahorro de clientes (la plata es del cliente).'},
      {sid:'patrimonio',term:'Patrimonio',cat:'term',en:'Equity',def:'Capital propio de los dueños. Naturaleza Crédito. Códigos PUC empiezan en 3.',ex:'Capital social + utilidades retenidas.'},
      {sid:'ingreso',term:'Ingreso',cat:'term',en:'Revenue',def:'Plata ganada por la operación. Naturaleza Crédito. Códigos PUC empiezan en 4.',ex:'Intereses cobrados por préstamos.'},
      {sid:'gasto',term:'Gasto',cat:'term',en:'Expense',def:'Plata consumida en la operación. Naturaleza Débito. Códigos PUC empiezan en 5.',ex:'Comisiones pagadas a Visa.'},
      {sid:'puc',term:'PUC',cat:'acro',en:'Plan Único de Cuentas',def:'Catálogo estandarizado de cuentas contables. En cada país tiene su propio formato.',ex:'1-04-01-001 = Préstamos por Cobrar (Activo).'},
      {sid:'asientogl',term:'Asiento Contable',cat:'term',en:'Journal Entry',def:'Registro de una operación en el libro mayor. Tiene al menos un débito y un crédito que suman cero.',ex:'Asiento de ajuste por write-off de $0.05.'},
      {sid:'cierre',term:'Cierre Contable',cat:'process',en:'Closing',def:'Proceso de cerrar el periodo (mensual/trimestral). Reconciliación es prerequisito para cierre.',ex:'Cierre mensual: del día 1 al 5 del mes siguiente.'},
      // ── Cuentas Ficohsa específicas ──
      {sid:'cuentat',term:'Cuenta Transitoria',cat:'term',en:'Suspense Account',def:'Cuenta puente. Los débitos deben igualar los créditos. Saldo final del día debe ser CERO.',ex:'2-01-01-003 SERCOM debe quedar en 0 cada cierre diario.'},
      {sid:'ach',term:'ACH',cat:'acro',en:'Automated Clearing House',def:'Red de pagos electrónicos entre bancos. Procesa transferencias en lote.',ex:'Cuenta transitoria 2-01-01-002 = ACH en tránsito.'},
      {sid:'atm',term:'ATM',cat:'acro',en:'Cajero Automático',def:'Dispositivo de retiro/depósito de efectivo. Genera transacciones en cuenta transitoria hasta liquidación.',ex:'2-01-01-001 = transitoria ATMs.'},
      // ── Procesos Ficohsa adicionales ──
      {sid:'discovery',term:'Discovery',cat:'process',en:'Levantamiento As-Is',def:'Fase 2 del proyecto. Mesas de 2h por proceso donde el cliente explica el flujo actual.',ex:'En Discovery vos tomás notas detalladas de cada regla y excepción.'},
      {sid:'kickoff',term:'Kick-Off',cat:'term',en:'',def:'Reunión inicial formal del proyecto. Se alinean expectativas con sponsor y se definen canales.',ex:'Kick-off Ficohsa: 5 Jun 2026.'},
      {sid:'golive',term:'Go-Live',cat:'term',en:'',def:'Momento en que la solución pasa a producción real. El "encendido" oficial.',ex:'Pre-go-live: ciclos de prueba con datos reales del cliente.'},
      // ── Pagos y reconciliación ──
      {sid:'representment',term:'Representment',cat:'process',en:'',def:'Cuando el comercio responde a un chargeback con evidencia para revertir la disputa.',ex:'Representment exitoso = el comercio retiene el dinero.'},
      {sid:'interchange',term:'Interchange',cat:'term',en:'Tasa de intercambio',def:'Fee que el adquirente paga al emisor por cada transacción. Lo regula Visa/Mastercard.',ex:'Visa cobra interchange ~1.5-2.5% según categoría comercio.'},
      {sid:'mdr',term:'MDR',cat:'acro',en:'Merchant Discount Rate',def:'Tasa total que paga el comercio por aceptar tarjetas. Incluye interchange + scheme fee + acquirer fee.',ex:'MDR típico Latam: 2.5-4%.'},
      {sid:'tplus1',term:'T+1 / T+2',cat:'term',en:'',def:'Días hábiles desde la transacción hasta el settlement. T+1 = al día siguiente.',ex:'Venta con tarjeta viernes → settlement T+1 = lunes en cuenta del comercio.'},
      {sid:'tokenizacion',term:'Tokenización',cat:'process',en:'Tokenization',def:'Reemplazo de datos sensibles (PAN tarjeta) por un token sin valor fuera del sistema.',ex:'Apple Pay tokeniza tu tarjeta — el comercio nunca ve el número real.'},
      // ── Output / reportes ──
      {sid:'dashboard',term:'Dashboard',cat:'platform',en:'',def:'Panel visual de KPIs en tiempo real. Permite filtrado y drill-down.',ex:'Dashboard ejecutivo Ficohsa: tx procesadas, auto-match %, excepciones por aging.'},
      {sid:'output',term:'Output',cat:'term',en:'Salida / Entregable',def:'Lo que Simetrik produce al final del flujo: reporte CSV/Excel, asientos para SAP, alertas.',ex:'Output del proceso SERCOM: 3 archivos diarios al equipo de operaciones.'},
      {sid:'sftpfolder',term:'SFTP Folder',cat:'platform',en:'',def:'Carpeta remota segura donde Simetrik deposita los outputs y donde el cliente deja inputs.',ex:'sftp://ficohsa.simetrik.com/outputs/sercom/2026-05-13.csv'},
      // ── Otros conceptos clave ──
      {sid:'sox404',term:'SOX 404',cat:'acro',en:'',def:'Sección 404 de SOX: gerencia debe declarar adecuación de controles internos sobre reportes financieros.',ex:'Audit trail de Simetrik es evidencia para SOX 404.'},
      {sid:'ros',term:'ROS',cat:'acro',en:'Reporte de Operación Sospechosa',def:'Notificación a la UIF cuando AML detecta posible lavado.',ex:'ROS debe enviarse en 48-72h según jurisdicción.'},
      {sid:'risk',term:'Risk Framework',cat:'term',en:'',def:'Marco de gestión de riesgos: identificar, medir, mitigar, monitorear.',ex:'Risk framework de un banco incluye fraude, AML, operacional, crédito.'},
      {sid:'maker',term:'Maker',cat:'term',en:'',def:'Persona que crea/edita una acción en Simetrik. Requiere aprobación de un Checker.',ex:'Maker = analista que resuelve una excepción.'},
      {sid:'checker',term:'Checker',cat:'term',en:'',def:'Persona que aprueba la acción del Maker antes de impactar producción/GL.',ex:'Checker = supervisor que firma la resolución.'},
      {sid:'segregation',term:'Segregación de Funciones',cat:'term',en:'Segregation of Duties (SoD)',def:'Principio: Maker ≠ Checker. Nadie puede crear y aprobar la misma acción. Crítico para SOX.',ex:'Si vos creás la regla, otra persona la activa.'},
      // ── 2026-05-15 · MOIF Ficohsa · integridad de datos + observabilidad ──
      {sid:'manifest',term:'Manifest',cat:'term',en:'Manifest file',def:'Archivo complementario que acompaña a un lote transferido y describe su contenido (archivos incluidos, conteos, hashes). Permite al receptor confirmar que el lote llegó completo y sin alteraciones.',ex:'Ficohsa solicitó que cada batch transferido incluya manifest + checksum SHA256 para que Simetrik valide la integridad antes de procesar.'},
      {sid:'sha256',term:'SHA-256',cat:'acro',en:'Secure Hash Algorithm 256-bit',def:'Algoritmo criptográfico de hash que produce una huella de 256 bits única por archivo. Comparar SHA256 antes y después de la transferencia confirma que el contenido no fue alterado.',ex:'Cada archivo del lote Ficohsa lleva su SHA256 en el manifest; Simetrik recalcula al recibir y valida.'},
      {sid:'checksum',term:'Checksum',cat:'term',en:'',def:'Valor calculado a partir del contenido de un archivo (típicamente un hash criptográfico) usado para verificar integridad. Si el checksum recalculado coincide con el reportado, los datos no fueron alterados.',ex:'Verificación de checksum SHA256 por lote es requerimiento de integridad solicitado por Ficohsa.'},
      {sid:'observabilidad',term:'Observabilidad',cat:'term',en:'Observability',def:'Capacidad de inferir el estado interno de un sistema a partir de sus señales externas (logs, métricas, traces). En integraciones, implica dashboards de archivos cargados, retries, fallas y volúmenes anómalos.',ex:'Ficohsa pidió observabilidad de la integración con dashboards segregados por país (CAM regional).'},
      {sid:'integridaddatos',term:'Integridad de datos',cat:'term',en:'Data Integrity',def:'Propiedad de que los datos no fueron alterados, perdidos o corrompidos en el camino entre origen y destino. Se valida con manifests + checksums + reconciliaciones de conteo.',ex:'Requisito Fase 1 Ficohsa: garantizar integridad de cada batch antes de cargar a Simetrik.'},
      {sid:'reintento',term:'Reintento',cat:'term',en:'Retry',def:'Intento adicional de procesar un archivo o transacción tras un fallo previo. Las métricas de reintentos son señal de salud de la integración.',ex:'El dashboard de observabilidad de Ficohsa debe mostrar conteo de reintentos por país.'},
      {sid:'volumenanomalo',term:'Volumen anómalo',cat:'term',en:'Anomalous volume',def:'Cantidad de transacciones o archivos por fuera del rango esperado para un día/hora típico. Detectarlos a tiempo previene cierres incorrectos.',ex:'Métrica solicitada por Ficohsa en el dashboard de integración.'},
      {sid:'cargafallida',term:'Carga fallida',cat:'term',en:'Failed load',def:'Archivo que no pudo procesarse exitosamente por error de formato, layout, conexión o validación. Cuenta clave en dashboards de observabilidad.',ex:'Métrica solicitada por Ficohsa para vigilancia de la integración.'},
      {sid:'traductorcontable',term:'Traductor contable',cat:'term',en:'Accounting translator',def:'Fee/módulo que agrupa transacciones por categoría contable (ej. ingreso, gasto) para alimentar el flujo contable de Simetrik. — DEFINICIÓN PRELIMINAR · pendiente de validar con Miguel/Jhonattan.',ex:'Mencionado en capacitación con Jhonattan junto con el análisis del domain framework.'},
      {sid:'calculadora',term:'Calculadora (deal Simetrik)',cat:'platform',en:'',def:'Herramienta interna usada con el cliente sobre el domain framework para alinear lo que el cliente NECESITA controlar vs lo que el cliente HACE. Define el alcance del deal y qué módulos se contratan. — DEFINICIÓN PRELIMINAR · pendiente de validar.',ex:'En Ficohsa, las integraciones NO se negociaron en la calculadora durante el deal, por eso la Fase 1 no incluye IA en integraciones.'},
      {sid:'simetrik27',term:'Simetrik 2.7',cat:'platform',en:'',def:'Versión del release de la plataforma Simetrik con 13 features nuevas centradas en: flexibilidad de configuración, robustecimiento del proceso contable end-to-end e integración de IA en los workflows que más la necesitan.',ex:'Mencionado en el Learning "Discovering What\'s New" (Miguel · 2026-05-15). Audiencia: reconciliations, accounting close, client data distribution.'},
      {sid:'quickconfig',term:'Quick Configurations',cat:'platform',en:'Configuraciones rápidas',def:'Sub-sección del menú Automate que agrupa accesos a configuraciones de despliegue rápido: Template Catalog y Réplicas. Diseñada para evitar partir de cero.',ex:'Path UI: Automate → Quick configurations → Template catalog.'},
      // ── Estructura cuenta (Account / Workspace / Roles) ──
      {sid:'account',term:'Account',cat:'platform',en:'Cuenta',def:'Nivel superior de organización en Simetrik. Se crea por solicitud formal al soporte (no self-service). Al crearse se designa un administrador responsable.',ex:'Un mismo usuario puede pertenecer a múltiples accounts.'},
      {sid:'wkspace',term:'Workspace',cat:'platform',en:'Espacio de trabajo',def:'Unidad dentro de un Account donde los equipos colaboran. Cada Account puede tener múltiples workspaces (por cliente, proyecto, área). Información y permisos quedan aislados.',ex:'Workspace Ficohsa · Workspace Magalu · Workspace Internal QA.'},
      {sid:'role_viewer',term:'Viewer Role',cat:'term',en:'Rol Visor',def:'Rol del sistema. Solo lectura. Puede consultar información pero no modifica nada. Para auditores, clientes finales, observadores.',ex:'El analista junior empieza como Viewer durante onboarding.'},
      {sid:'role_builder',term:'Builder Role',cat:'term',en:'Rol Constructor',def:'Rol del sistema. Puede crear y editar recursos (sources, reconciliations, dashboards). Rol típico del Implementation Specialist en fase de implementación.',ex:'Como Builder podés crear Sources, Source Unions, Standard Recons.'},
      {sid:'role_operator',term:'Operator Role',cat:'term',en:'Rol Operador',def:'Rol del sistema. Gestiona la operación diaria: ejecuta procesos, resuelve excepciones, ajusta reglas en producción.',ex:'Día a día del analista de conciliación.'},
      {sid:'role_supervisor',term:'Supervisor Role',cat:'term',en:'Rol Supervisor',def:'Rol del sistema. Permisos amplios: aprueba acciones de operadores (maker-checker), certifica períodos contables, gestiona el workspace.',ex:'Aprueba write-offs > umbral y certifica cierre mensual.'},
      {sid:'role_custom',term:'Custom Role',cat:'term',en:'Rol personalizado',def:'Cuando los 4 system roles no encajan. Se crea seleccionando exactamente qué permisos por sección. Aplica el principio de menor privilegio.',ex:'Rol "Treasury Viewer" con acceso solo a Reconciliations + Reports.'},
      {sid:'admin',term:'Admin',cat:'term',en:'Administrador',def:'Usuario con permisos para crear workspaces, invitar usuarios y definir roles dentro del Account.',ex:'El admin del Account decide qué workspace ve cada usuario.'},
      {sid:'guardian',term:'Guardian',cat:'software',en:'',def:'App de 2FA usada en Simetrik para verificación en dos pasos al hacer login. Aprobás desde el celular.',ex:'Continue with Google → Guardian pide aprobación → entrás al workspace.'},
      // ── Resources (Source / Union / Recon) ──
      {sid:'source',term:'Source',cat:'term',en:'Fuente de datos',def:'Recurso base que contiene un archivo cargado. Cada tipo de archivo (banco, ERP, pasarela) tiene su propio Source. Almacena columnas del sistema + las del archivo.',ex:'Source "T24 SERCOM diario" recibe el TXT que el banco deja en SFTP.'},
      {sid:'syscolumn',term:'System Columns',cat:'term',en:'Columnas del sistema',def:'Columnas generadas automáticamente por Simetrik en cada Source. Identificadas con ícono de escudo: Unique ID, fecha/hora carga, File ID, file name, line number.',ex:'Podés ocultarlas con el ícono de ojo si no las necesitás.'},
      {sid:'createresource',term:'Create Resource',cat:'process',en:'',def:'Botón principal en el menú Automate → Resources para crear cualquier tipo de recurso: Source, Source Union, Standard Recon, Advanced Recon, etc.',ex:'Click → elegís tipo → completás config.'},
      {sid:'normalization',term:'Normalization',cat:'process',en:'Normalización',def:'Proceso de revisar y estandarizar cada columna de un Source para que el formato sea consistente con su naturaleza (numeric, text, date). Se hace una sola vez por Source.',ex:'Convertir todas las fechas a YYYY-MM-DD; amounts con 2 decimales; IDs sin separadores.'},
      {sid:'changeformat',term:'Change Format',cat:'process',en:'',def:'Funcionalidad para cambiar el formato de una columna. 3 etapas: definir tipo (numeric/text/date) · revisar formato original · establecer formato deseado.',ex:'Transaction ID llega con comas, lo configurás como integer sin separadores.'},
      {sid:'smartdate',term:'Smart Date Format',cat:'process',en:'',def:'Smart Building Block (IA) que identifica el formato original de una columna de fecha entre 500+ formatos posibles. Ahorra horas en normalización.',ex:'Detecta automáticamente que "16-Apr-2026" es DD-MMM-YYYY.'},
      {sid:'manualupload',term:'Manual Upload',cat:'process',en:'',def:'Forma directa de cargar archivos. Crear Source → drag&drop. Formatos: XLS/XLSX/CSV/TXT. Máx 5 GB. Layout tabular obligatorio.',ex:'Sin merged cells, sin filas en blanco, sin multi-sheet.'},
      {sid:'selfmanaged',term:'Self-Managed Integration',cat:'process',en:'',def:'Forma automatizada de carga configurable por el usuario. Tipos: SFTP Pull, SFTP Push, S3 Pull. Máx 120 GB. Configurable desde Automate → Integrations In.',ex:'SFTP Pull: Simetrik retira archivos del directorio del cliente cada noche.'},
      {sid:'sftppull',term:'SFTP Pull',cat:'process',en:'',def:'Modalidad self-managed: Simetrik accede al directorio del cliente y extrae los archivos.',ex:'T24 deja TXT en su SFTP; Simetrik lo lee.'},
      {sid:'sftppush',term:'SFTP Push',cat:'process',en:'',def:'Modalidad self-managed: el cliente envía archivos al directorio de Simetrik.',ex:'El cliente programa su ETL para subir CSV al SFTP de Simetrik.'},
      {sid:'s3pull',term:'S3 Pull',cat:'process',en:'',def:'Modalidad self-managed: conexión a un bucket de Amazon S3 desde donde Simetrik retira archivos.',ex:'Pasarela de pagos deja JSON diario en bucket S3 → Simetrik lo levanta.'},
      {sid:'bucket',term:'Bucket (Simetrik)',cat:'platform',en:'',def:'Contenedor intermedio de almacenamiento dentro del self-managed integration. Simetrik retira archivos del bucket y los sube al Source correspondiente.',ex:'Crear un bucket por Source destino para ordenar el flujo.'},
      {sid:'integrationservices',term:'Integration Services Team',cat:'platform',en:'',def:'Equipo de Simetrik que resuelve conexiones complejas (formatos raros, >120 GB, layouts no tabulares). Servicio con costo adicional.',ex:'API custom, web scraping, GCP, parsing avanzado.'},
      {sid:'smartparser',term:'Smart Parser',cat:'process',en:'',def:'Agente de IA en desarrollo que permitirá al usuario hacer parsing autónomo de archivos sin recurrir al services team. Reduce costos y tiempos.',ex:'Detecta el formato del archivo y aplica parseo automático.'},
      {sid:'parsing',term:'Parsing (Simetrik)',cat:'process',en:'',def:'Proceso de ajustar formato y layout de un archivo para que la plataforma lo pueda leer. Simetrik NO modifica el contenido, solo la estructura.',ex:'Convertir un PDF en una tabla CSV para que pueda procesarse.'},
      {sid:'srcunion',term:'Source Union (Union of Sources)',cat:'process',en:'Unión de fuentes',def:'Recurso que agrupa verticalmente varios Sources con el mismo esquema. Protege todas las configuraciones que dependen de él. Best practice obligatoria.',ex:'Aún con una sola Source, creá su Union para que si cambia el layout no rehagas nada.'},
      {sid:'aia',term:'AIA · Smart Building Block',cat:'term',en:'',def:'Sistema de inteligencia artificial de Simetrik que sugiere columnas automáticamente al armar un Source Union, identifica formatos de fecha, propone fórmulas, sugiere reglas de matching.',ex:'Al sumar la 2da fuente al Union, la AIA mapea columnas equivalentes a la 1ra.'},
      // ── Reconciliations ──
      {sid:'stdrecon',term:'Standard Reconciliation',cat:'process',en:'Conciliación estándar',def:'Tipo de reconciliation lineal recomendada para procesos simples y cortos. Comparación directa entre 2 Sources con uno o varios sweeps.',ex:'Cruce merchant vs acquirer 1-a-1 por date+amount+ID.'},
      {sid:'advrecon',term:'Advanced Reconciliation',cat:'process',en:'Conciliación avanzada',def:'Tipo de reconciliation modular que permite encadenar múltiples sweeps independientes en el mismo recurso: reconciliation + grouping + offset.',ex:'Para procesos largos donde un cruce simple no captura todos los casos.'},
      {sid:'sweep',term:'Sweep',cat:'term',en:'Barrido',def:'"Bag of rules" — conjunto ordenado de reglas dentro de una reconciliation. Múltiples sweeps se ejecutan en cascada según prioridad.',ex:'Sweep 1 sin tolerancia, sweep 2 con tolerancia ±0.05, sweep 3 catch-all.'},
      {sid:'reconsweep',term:'Reconciliation Sweep',cat:'process',en:'',def:'Tipo de sweep en Advanced Recon. Mini-reconciliation 1-a-1 dentro del recurso.',ex:'Sweep simple por date+ID+amount.'},
      {sid:'groupingsweep',term:'Grouping Sweep',cat:'process',en:'',def:'Tipo de sweep en Advanced Recon. Agrupa transacciones que aparecen divididas en varias líneas en una source. Se configura con Create Aggregation.',ex:'1 venta merchant $100 vs 2 líneas acquirer de $50 c/u.'},
      {sid:'offsetsweep',term:'Offset Sweep · Compensation',cat:'process',en:'',def:'Tipo de sweep en Advanced Recon. Compensa tx con contrapartes en la misma source (payment cancelado con refund).',ex:'Match por date+ID+amount; no incluye tx_type porque payment ≠ refund por definición.'},
      {sid:'1to1',term:'1-to-1 Crossover',cat:'term',en:'Cruce 1-a-1',def:'Tipo de cruce donde cada tx de Source A tiene exactamente una contraparte en Source B.',ex:'Cada venta merchant tiene exactamente 1 entrada en acquirer.'},
      {sid:'1ton',term:'1-to-N Crossover',cat:'term',en:'Cruce 1-a-N',def:'Tipo de cruce donde una tx de A se concilia con varias de B. Side N es la fuente cuyas filas se replican.',ex:'Una venta dividida en 2 tarjetas (1 línea merchant, 2 líneas acquirer).'},
      {sid:'nto1',term:'N-to-1 Crossover',cat:'term',en:'Cruce N-a-1',def:'Tipo de cruce donde varias tx de A se consolidan con una sola tx de B.',ex:'Micro-pagos diarios consolidados en un settlement semanal.'},
      {sid:'ntonm',term:'N-to-N Crossover',cat:'term',en:'Cruce N-a-N',def:'Tipo de cruce donde múltiples registros se cruzan entre sí.',ex:'Múltiples comisiones afectando múltiples transacciones.'},
      {sid:'businessrule',term:'Business Rule',cat:'term',en:'',def:'Criterio que Simetrik usa para validar matches. Se construyen desde columnas incluidas en los Source Unions.',ex:'A.transaction_id == B.transaction_id'},
      {sid:'recongroup',term:'Reconcilable Group',cat:'process',en:'',def:'Filtro guardado aplicado sobre un Source para aislar un subset de registros. Se reutiliza en N reconciliations.',ex:'Group "Mastercard credit" filtra Card_Type=MC para usar en múltiples recons.'},
      {sid:'sktid',term:'SKT ID',cat:'term',en:'',def:'Identificador estándar de transacción usado por Simetrik. Best practice: crear un Reconcilable Group donde SKT ID != empty para excluir registros sin identificador válido.',ex:'Reconciliation que solo procesa registros con SKT ID asignado.'},
      {sid:'smartrules',term:'Smart Rules',cat:'process',en:'',def:'Smart Building Block (IA) en Advanced Recon. Analiza las 2 sources y sugiere matching keys óptimas para lograr mayor match rate.',ex:'IA propone date+id+amount+type; vos aceptás o rechazás.'},
      // ── Enrichment ──
      {sid:'vlookup',term:'VLOOKUP (Simetrik)',cat:'process',en:'',def:'Funcionalidad de enrichment similar a Excel: trae data de una tabla a otra por columna común. Recomendado solo cuando la fuente enriquecedora es estática.',ex:'Botón Create VLOOKUP. Si fuente cambia, hay que vaciar y reprocesar todo.'},
      {sid:'enrichrecon',term:'Enrichment by Reconciliation',cat:'process',en:'',def:'Alternativa robusta a VLOOKUP: enriquece via 1-N or N-1 reconciliation. Si fuente cambia, solo se reprocesan tx afectadas, sin tocar histórico.',ex:'Recomendado cuando la fuente puede actualizarse (ej. fee dictionary renegociable).'},
      {sid:'transformcol',term:'Transformation Column',cat:'process',en:'Columna transformación',def:'Columna nueva creada con fórmula sobre columnas existentes. Funciona similar a Excel.',ex:'Delta = Real Cost − Theoretical Cost.'},
      {sid:'smarttransf',term:'Smart Transformation',cat:'process',en:'',def:'Smart Building Block (IA) que permite escribir en lenguaje natural lo que querés calcular y sugiere la fórmula. También corrige errores en fórmulas existentes.',ex:'Escribís "diferencia entre real y teórico" y propone Real_Cost - Theoretical_Cost.'},
      {sid:'costcontrol',term:'Cost Control',cat:'process',en:'',def:'Control que verifica si lo que el adquirente cobra coincide con lo negociado en contrato. Usa transformation columns: Real Cost, Theoretical Cost, Delta.',ex:'Detectás que MC Credit y MC Debit cobran fees > contrato → revenue leakage.'},
      {sid:'feedictionary',term:'Fee Dictionary',cat:'term',en:'Diccionario de tarifas',def:'Source que contiene rates por combinación (red+tipo de tarjeta). Se usa para enriquecer transacciones con su rate teórico.',ex:'5 rates: Visa Credit, Visa Debit, MC Credit, MC Debit, Amex Credit.'},
      // ── Accounting ──
      {sid:'chartaccounts',term:'Chart of Accounts',cat:'term',en:'Plan de cuentas',def:'Catálogo de todas las cuentas contables que usa una empresa. Se carga en Simetrik desde Automate → Accounting Parameters con un template.',ex:'Template con account number + company + descriptive name.'},
      {sid:'erpintegration',term:'ERP Integration',cat:'process',en:'',def:'Configuración para que Simetrik envíe asientos contables al ERP del cliente. Dos pasos: Connection + Structure.',ex:'Generate ERP Integration → SAP S/4HANA → modo Standard App.'},
      {sid:'middleware',term:'Middleware (ERP)',cat:'platform',en:'',def:'Modo de conexión ERP donde un conector intermedio recibe info de Simetrik y la envía al ERP. Funciona con cualquier ERP. Configurable desde Simetrik.',ex:'Útil cuando no hay Standard App para tu ERP.'},
      {sid:'standardapp',term:'Standard App (ERP)',cat:'platform',en:'',def:'Modo de conexión ERP directo, sin intermediarios. Solo disponible para NetSuite y SAP S/4HANA. Requiere accounting capabilities team.',ex:'Conexión rápida y robusta cuando aplica.'},
      {sid:'accmodel',term:'Accounting Model',cat:'term',en:'Modelo contable',def:'Reglas que Simetrik usa para llenar los campos de la estructura del asiento. Define qué campos son fijos, qué columnas vienen de qué recurso.',ex:'Document.company = "FICOHSA" (fixed value); Lines.amount = Recon.amount (resource).'},
      {sid:'accstructure',term:'Accounting Structure',cat:'term',en:'Estructura del asiento',def:'Define los campos que contiene un asiento contable. Tres tipos: Document fields, Lines, Header.',ex:'Predefined structure → JSON enviado al ERP.'},
      {sid:'docfields',term:'Document Fields',cat:'term',en:'Campos documento',def:'Campos transversales al asiento entero: fecha de generación, compañía, currency.',ex:'Date = today, Company = FICOHSA, Currency = HNL.'},
      {sid:'jelines',term:'Lines (Journal Entry)',cat:'term',en:'Líneas del asiento',def:'Definen débitos y créditos. Llevan accounting code, cost center, amount.',ex:'Línea 1: Débito Caja 12,450 · Línea 2: Crédito Transitoria 12,450.'},
      {sid:'jeheader',term:'Header (Journal Entry)',cat:'term',en:'Cabecera del asiento',def:'Campos opcionales sin impacto contable. Información adicional útil.',ex:'Submission date al ERP.'},
      {sid:'normalseat',term:'Normal Seat',cat:'term',en:'Asiento normal',def:'Tipo de journal entry estándar generado por la conciliación.',ex:'El asiento del día de SERCOM.'},
      {sid:'cancelseat',term:'Cancellation Seat',cat:'term',en:'Asiento de cancelación',def:'Reverso del asiento normal. Pre-configurado automáticamente: invierte débitos y créditos.',ex:'Cuando se cancela un asiento por error, esto lo revierte.'},
      {sid:'postsiege',term:'Post-Siege Seat',cat:'term',en:'',def:'Tercer tipo de asiento que se configura en el accounting model junto con normal y cancellation.',ex:'Para casos especiales de cierre posterior.'},
      {sid:'postclosing',term:'Post After Closing',cat:'term',en:'',def:'Parámetro de Generate Automation: día del mes siguiente hasta el cual se aceptan asientos del período anterior.',ex:'Hasta el 3er día hábil del mes siguiente.'},
      {sid:'partialreverse',term:'Partial Reversal',cat:'process',en:'Reverso parcial',def:'Cuando una tx dentro de un asiento consolidado se concilia individualmente, se genera un reverso parcial que requiere aprobación manual.',ex:'Asiento agrupado de 100 tx; una de ellas se reconcilia → reverso parcial.'},
      {sid:'dummyrecon',term:'Dummy Reconciliation',cat:'term',en:'',def:'Reconciliation falsa creada solo para que Simetrik pueda generar asientos desde una source (que no permite asientos directos).',ex:'Convertís una source en dummy recon para postear sus tx al GL.'},
      // ── Accounting Close ──
      {sid:'accparams',term:'Accounting Parameters',cat:'platform',en:'',def:'Sección en Automate → Accounting donde se carga el chart of accounts.',ex:'Click Upload Account → descargás template → llenás → subís.'},
      {sid:'trialbalance',term:'Trial Balance',cat:'term',en:'Balance de comprobación',def:'Reporte con saldos por cuenta para un período. Se carga en Simetrik desde Operate → Accounting Controls → Update Trial Balance.',ex:'Balance del mes de noviembre con saldos por cada cuenta del PUC.'},
      {sid:'beginbalance',term:'Beginning Balance',cat:'term',en:'Saldo inicial',def:'Saldo de una cuenta al inicio del período contable.',ex:'BB Nov = $14,000 (cierre Oct).'},
      {sid:'endbalance',term:'Ending Balance',cat:'term',en:'Saldo final',def:'Saldo de una cuenta al cierre del período. Beginning + change.',ex:'EB Nov = $16,000.'},
      {sid:'recogbalance',term:'Recognized Balance',cat:'term',en:'Saldo reconocido',def:'Porción del saldo final que tiene evidencia documental. Lo edita el preparer.',ex:'EB $16K, Recognized $15K, gap $1K (6.25%).'},
      {sid:'preparer',term:'Preparer',cat:'term',en:'Preparador',def:'Rol responsable de revisar y documentar la evidencia de una cuenta antes del cierre.',ex:'Sube snapshots, external files, notas explicativas.'},
      {sid:'certifier',term:'Certifier',cat:'term',en:'Certificador',def:'Rol responsable de aprobar la validación del preparer. No puede ser la misma persona que preparó (maker-checker).',ex:'Aprueba o rechaza con motivo. Garantiza control interno.'},
      {sid:'readycertify',term:'Ready to Certify',cat:'process',en:'',def:'Botón que el preparer clickea al terminar de cargar evidencia para enviar la cuenta al certifier.',ex:'Trigger del workflow preparer → certifier.'},
      {sid:'supportresource',term:'Support Resource',cat:'term',en:'Recurso de soporte',def:'Evidencia documental adjunta a una cuenta. Incluye: snapshots, external files, notas.',ex:'Snapshot de la recon SERCOM al 30 de noviembre.'},
      {sid:'snapshot',term:'Snapshot',cat:'process',en:'',def:'Captura estática de una reconciliation en un momento puntual. Útil porque una recon cambia constantemente. Configurable en Audit menu (ej. último día del mes).',ex:'Snapshot mensual automático para evidencia de auditoría.'},
      {sid:'accgrouping',term:'Account Grouping',cat:'process',en:'Agrupación de cuentas',def:'Funcionalidad de cierre: agrupar múltiples cuentas con misma naturaleza para certificarlas con una sola acción.',ex:'10 cuentas similares certificadas en 1 click.'},
      {sid:'autocert',term:'Auto-certification',cat:'process',en:'Auto-certificación',def:'Regla automática para cuentas cuyo balance rara vez cambia. El sistema certifica sin pasos manuales.',ex:'Fixed assets · activos fijos que no se mueven.'},
      {sid:'accdashboard',term:'Accounting Dashboard',cat:'platform',en:'',def:'Dashboard que muestra el % de cuentas en cada estado del cierre: pending preparation, ready, rejected, certified, self-certification.',ex:'Filtros por usuario, compañía, fecha.'},
      // ── Analysis ──
      {sid:'customdash',term:'Custom Dashboard',cat:'platform',en:'',def:'Dashboard configurable libremente con componentes: pivot tables, custom tables, reconciliation status, KPIs individuales, charts.',ex:'Dashboard ejecutivo SERCOM con KPIs + pivot.'},
      {sid:'pivottable',term:'Pivot Table (Simetrik)',cat:'term',en:'',def:'Tabla dinámica similar a Excel. Permite filtros, columnas, drill-down al detalle.',ex:'Cost por card type + tx type + mes.'},
      {sid:'reconmonitor',term:'Conciliation Monitor',cat:'platform',en:'',def:'Monitor en Analysis que muestra resumen consolidado de todas las reconciliations del workspace. Indicadores verde/rojo + % reconciled.',ex:'Vista panorámica de salud de las 30 recons activas.'},
      {sid:'srcmonitor',term:'Source Monitor',cat:'platform',en:'',def:'Monitor que muestra estado de uploads por día y source. Estados: processed, pending, failed, empty, stopped. Número de filas por día.',ex:'Detectar rápido si T24 SERCOM no levantó esta noche.'},
      {sid:'bucketmonitor',term:'Bucket Monitor',cat:'platform',en:'',def:'Monitor equivalente al Source Monitor pero para buckets self-managed.',ex:'Monitoreo de buckets S3.'},
      {sid:'accmonitor',term:'Accounting Monitor',cat:'platform',en:'',def:'Monitor con vista consolidada del estado de balances contables.',ex:'Quick view del avance del cierre mensual.'},
      {sid:'consolidation',term:'Consolidation',cat:'process',en:'Consolidación',def:'Une verticalmente diferentes groupings en una sola vista. Caso típico: cost controls de varios adquirentes consolidados.',ex:'Cost control Visa + Cost control MC + Cost control Amex → 1 vista.'},
      {sid:'combination',term:'Combination',cat:'process',en:'Combinación',def:'Une horizontalmente diferentes reconciliations. Caso típico: lifecycle de tx (Authorization → Clearing → Settlement → Anchorage).',ex:'Una visión narrativa de la tx en cada etapa.'},
      {sid:'grouping',term:'Grouping',cat:'process',en:'Agrupación',def:'Resumen ejecutivo de resultados agregados. Permite top-down y bottom-up.',ex:'Cost grouping por card type para ver dónde está el delta.'},
      // ── Data Sharing ──
      {sid:'datasharing',term:'Data Sharing',cat:'platform',en:'',def:'Sección de Automate dedicada a extracción de información. Incluye Exports y Customer Reports.',ex:'Última sección del menú Automate.'},
      {sid:'export',term:'Export (Simetrik)',cat:'process',en:'',def:'Transmisión automatizada de data a destinos cloud. Solo conecta a Amazon S3 y Google Cloud Storage. CSV o Parquet, máx 5 GB.',ex:'Export by event cada vez que se concilia una tx.'},
      {sid:'exportevent',term:'Export by Event',cat:'process',en:'',def:'Export que se dispara con eventos específicos: auto-recon, adjustment, auto-unreconcile.',ex:'Cuando una tx se concilia → archivo a S3 inmediatamente.'},
      {sid:'exportrecur',term:'Recurring Export',cat:'process',en:'',def:'Export programado por frecuencia: días + hora + zona horaria + columna fecha como trigger.',ex:'Lunes a las 6am, las recons del fin de semana van a GCS.'},
      {sid:'destination',term:'Destination (Data Sharing)',cat:'platform',en:'',def:'Configuración del destino donde se envían los exports. Se solicita al support team con Request Destination.',ex:'Bucket S3 del cliente preparado para recibir Parquet.'},
      {sid:'customerreports',term:'Customer Reports',cat:'platform',en:'',def:'Feature de Simetrik para distribuir reportes segmentados a múltiples clientes finales. SBB con costo adicional. SFTP propio Simetrik incluido.',ex:'Amazon distribuye reportes diarios a 100 merchants vendor.'},
      {sid:'partitioning',term:'Partitioning',cat:'process',en:'Particionado',def:'Segmentación de reportes en hasta 3 niveles jerárquicos de carpetas. Cada nivel 1 recibe credenciales únicas.',ex:'Nivel 1: por merchant · Nivel 2: por tx type · Nivel 3: por mes.'},
      // ── Solutions / Templates ──
      {sid:'solutions',term:'Solutions (Templates)',cat:'platform',en:'',def:'Sección en Automate que será renombrada Templates. Permite exportar/importar configuraciones como JSON.',ex:'Generate template → JSON → import en otro workspace.'},
      {sid:'template',term:'Template',cat:'term',en:'Plantilla',def:'Estructura pre-configurada de un control. Almacena reglas, columnas, validaciones. Exportable como JSON.',ex:'Template de standard recon para Mastercard acquiring.'},
      {sid:'templatescatalog',term:'Templates Catalog',cat:'platform',en:'',def:'Catálogo de configuraciones diseñadas por el services team de Simetrik. SBB con costo adicional. Objetivo: fast first time to value.',ex:'Mastercard Controls for Acquirers, Visa Issuing Controls, etc.'},
      {sid:'firsttimevalue',term:'First Time to Value',cat:'term',en:'',def:'Métrica que mide qué tan rápido un cliente experimenta valor de la plataforma. Objetivo principal de los templates.',ex:'Implementar Mastercard clearing en 30 min vs 30 días.'},
      // ── Operate / Audit / Tools ──
      {sid:'operate',term:'Operate Menu',cat:'platform',en:'',def:'Menú dedicado a gestionar lo automatizado en Automate. Incluye Insights, Operational Controls, Record Finder, Accounting Controls.',ex:'Operate es el control room; Automate es la fábrica.'},
      {sid:'automate',term:'Automate Menu',cat:'platform',en:'',def:'Menú principal donde se construye toda la automatización: Integrations In, Resources, Accounting, Analysis, Data Sharing, Solutions.',ex:'El menú donde más tiempo pasás en fase de implementación.'},
      {sid:'audit',term:'Audit Menu',cat:'platform',en:'',def:'Menú con 2 features: Snapshots y Activity Logs. Garantiza trazabilidad completa.',ex:'Audit de cada acción ejecutada en la plataforma.'},
      {sid:'tools',term:'Tools Menu',cat:'platform',en:'',def:'Menú con utilidades: Downloads, Recycle Bin, Process View, Relationship Maps.',ex:'Diagnóstico, recovery, dependencias.'},
      {sid:'insights',term:'Insights (Operate)',cat:'platform',en:'',def:'Sub-sección de Operate para configurar alertas. Si una recon cae bajo % esperado → notificación por email.',ex:'Si SERCOM cruza <90% → email automático al PM.'},
      {sid:'agentfactory',term:'Agent Factory',cat:'platform',en:'',def:'Sistema de monitoreo amplio dentro de Insights. Agentes monitorean recursos y notifican vía Slack, email o plataforma.',ex:'Agente Slack: "T24 SERCOM upload failed at 23:50".'},
      {sid:'recordfinder',term:'Record Finder',cat:'platform',en:'',def:'Feature en Operate para trazar una tx específica hasta el Source al que pertenece. Muestra todos los recursos asociados.',ex:'Buscás ID LF7715101 → ves en qué recons aparece.'},
      {sid:'activitylogs',term:'Activity Logs',cat:'platform',en:'',def:'Registro inmutable de todas las acciones ejecutadas en Simetrik. Indispensable para SOX y auditoría externa.',ex:'Filtros por usuario, ID de recurso, fecha.'},
      {sid:'downloads',term:'Downloads (Tools)',cat:'platform',en:'',def:'Lista todas las descargas manuales hechas en la plataforma. Si tu rol no tiene permisos, aparece vacía.',ex:'Usuarios @simetrik.com tienen descargas bloqueadas por seguridad.'},
      {sid:'recyclebin',term:'Recycle Bin',cat:'platform',en:'Papelera',def:'Almacena recursos eliminados durante 30 días. Pasado ese período, eliminación definitiva. Filtrable por tipo de recurso.',ex:'Si borraste un Source por accidente, restaurás dentro de los 30 días.'},
      {sid:'processview',term:'Process View',cat:'platform',en:'',def:'Vista de tareas en ejecución, en cola o terminadas. Útil para diagnosticar procesos largos.',ex:'Si una recon lleva 4 horas → screenshot + ticket con resource ID.'},
      {sid:'relmap',term:'Relationship Maps',cat:'platform',en:'Mapas de relación',def:'Representación gráfica de dependencias entre recursos. Muestra upstream y downstream.',ex:'Antes de modificar una source crítica, abrir el map para ver qué se rompe.'},
      // ── Domain Framework ──
      {sid:'domainframework',term:'Domain Framework',cat:'term',en:'',def:'Marco organizacional de Simetrik que agrupa los controles posibles en 8 dominios. Cada uno con stages, use cases y controls.',ex:'8 dominios distribuidos en 4 macro-objetivos (Funds Flow, Profitability, Continuous Closing, Compliance & Oversight).'},
      {sid:'cashin',term:'Cash In (Dominio 1)',cat:'process',en:'',def:'Asegurar flujos de efectivo entrantes y eliminar revenue leakage.',ex:'Conciliación bancaria, SERCOM, recaudo.'},
      {sid:'cashout',term:'Cash Out (Dominio 2)',cat:'process',en:'',def:'Ejecutar pagos salientes con precisión, sin fugas ni duplicados.',ex:'Payouts, transferencias, dispersión de comisiones.'},
      {sid:'feesbilling',term:'Fees & Billing (Dominio 3)',cat:'process',en:'',def:'Aplicar pricing con precisión y sistemáticamente. Margin protection.',ex:'Cost control de fees de adquirentes vs contrato.'},
      {sid:'disputes',term:'Disputes & Claims (Dominio 4)',cat:'process',en:'',def:'Contener pérdidas por chargebacks, disputas y reclamos operacionales.',ex:'Gestión de representment y workflow de disputas.'},
      {sid:'accauto',term:'Accounting Automation (Dominio 5)',cat:'process',en:'',def:'Automatizar reconocimiento, accruals y provisiones a escala transaccional.',ex:'Asientos automáticos diarios al ERP.'},
      {sid:'accops',term:'Accounting Operations (Dominio 6)',cat:'process',en:'',def:'Asegurar integridad contable y cierres de libros rápidos y predecibles.',ex:'Cuadre saldos préstamos, certificación cuentas.'},
      {sid:'regreporting',term:'Reporting & Regulations (Dominio 7)',cat:'process',en:'',def:'Entregar reportes audit-ready con confianza.',ex:'Reportes regulatorios SOX, IFRS, locales.'},
      {sid:'oversight2',term:'Unified Oversight & Alerts (Dominio 8)',cat:'process',en:'',def:'Visibilidad en tiempo real de KPIs y señales tempranas de riesgo.',ex:'Dashboard ejecutivo + alerts automáticas.'},
      {sid:'reportingentity',term:'Reporting Entity',cat:'term',en:'',def:'Third party que reporta data transaccional y operacional al cliente Simetrik. Actúa como proveedor de data.',ex:'Card Network, Acquirer Processor, Local Switch, Clearing House.'},
      {sid:'actor',term:'Actor (Simetrik)',cat:'term',en:'',def:'Cliente o prospect de Simetrik. Quien experimenta los riesgos y necesita controles.',ex:'Bancos, fintechs, PSPs.'},
      {sid:'stage',term:'Stage',cat:'term',en:'Etapa',def:'Dentro de un dominio, define los momentos clave donde el control importa.',ex:'Authorization, Clearing, Settlement, Anchorage.'},
      {sid:'substage',term:'Sub-Stage',cat:'term',en:'Sub-etapa',def:'Punto de control concreto dentro de una stage. Define cómo se ejecuta el control en la práctica.',ex:'Match clearing vs settlement amounts.'},
      // ── Simetrik Box ──
      {sid:'simbox',term:'Simetrik Box',cat:'platform',en:'',def:'Modelo de integración donde un partner embebe la solución Simetrik en su propio portal. Los clientes finales del partner acceden a controles pre-configurados sin contratar Simetrik directo.',ex:'Banco embebe "Reconcile with Simetrik" en su home banking.'},
      // ── KPIs operativos ──
      {sid:'gap',term:'Gap',cat:'term',en:'Brecha',def:'Discrepancia o inconsistencia entre data esperada y data real en un proceso financiero u operacional. Detectarla a tiempo evita pérdidas.',ex:'Gap entre saldo SAP y suma de transacciones origen.'},
      {sid:'sourceunion2',term:'Smart Building Block · Sources',cat:'process',en:'',def:'IA que al armar Source Union sugiere proactivamente columnas que matchean entre la 1ra y 2da fuente.',ex:'Acelera la implementación de Unions complejos.'},
      {sid:'columnmap',term:'Column Mapping Agent',cat:'process',en:'',def:'Agente IA (release abril 2026). Al cambiar source en un recurso ya implementado, mapea automáticamente columnas del nuevo a las del que reemplaza.',ex:'Cliente cambia layout → IA realinea sin intervención.'},
      {sid:'safedelete',term:'Safe Column Removal',cat:'process',en:'',def:'Agente IA (release abril 2026). Antes de borrar una columna, detecta qué recursos quedan impactados.',ex:'Proactivo: te muestra dependencias antes del delete.'},
      {sid:'accreviewagent',term:'Accounting Review Agent',cat:'process',en:'',def:'Agente IA (roadmap). Lee todos los dashboards/charts del accounting layer y genera insights ejecutivos.',ex:'Resumen mensual: "este mes 3 cuentas tienen gap > 10%, foco aquí".'},
      {sid:'educationagent',term:'Education Agent',cat:'process',en:'',def:'Agente IA (roadmap). Conoce a profundidad cada control embebido en templates. Te ayuda a entender lógica de negocio, KPIs, arquitectura.',ex:'"¿Por qué este control usa N-1 en vez de 1-1?" → te explica.'},
      {sid:'summaryagent',term:'Summary Agent',cat:'process',en:'',def:'Agente IA (roadmap). Interpreta resultados de dashboards y entrega resumen ejecutivo predictivo basado en patrones.',ex:'Predice qué KPIs tendrán problema el próximo mes.'},
      {sid:'datamonitor',term:'Data Monitoring Agent',cat:'process',en:'',def:'Agente IA (custom, en algunos clientes). Monitorea sources 24/7 y notifica anomalías al subir archivos.',ex:'Detecta que el T24 de hoy tiene 30% menos filas que la media → alerta.'},
      // ── Trazabilidad ──
      {sid:'traceability',term:'Full Traceability',cat:'term',en:'Trazabilidad completa',def:'Capacidad de rastrear cada dato paso a paso a lo largo de todo el proceso, sin perder contexto. Diferenciador de Simetrik.',ex:'Frase oficial: "from the moment a transaction is born, until it dies in accounting".'},
      {sid:'sourceoftruth',term:'Single Source of Truth',cat:'term',en:'Fuente única de verdad',def:'Repositorio único y confiable donde todos los equipos (finance, ops, accounting) consultan la misma información.',ex:'Simetrik elimina inconsistencias entre Excel locales en distintas áreas.'},
      // ── Onboarding & Certification ──
      {sid:'assessment',term:'Assessment',cat:'term',en:'Evaluación',def:'Primera certificación Simetrik. Test con preguntas que mide entendimiento teórico de los conceptos.',ex:'Aprobás → primera certificación.'},
      {sid:'practical',term:'Practical Activity',cat:'term',en:'Actividad práctica',def:'Segunda certificación Simetrik. Implementás un caso real en un workspace asignado con script y archivos.',ex:'Workspace + script + xlsx → implementás → segunda certificación.'},
      {sid:'qa',term:'Q&A Sessions',cat:'platform',en:'',def:'Sesiones grupales dedicadas a resolver dudas durante la formación Simetrik.',ex:'Espacio semanal en el calendario de onboarding.'},
      {sid:'gtm',term:'Go-To-Market Sessions',cat:'platform',en:'',def:'Reuniones recurrentes que alinean equipos de venta con cambios de producto y estrategias de lanzamiento.',ex:'Mensual: novedades + sales arguments + casos de uso.'},
      // ── DOTA × FD test (seed 2026-05-27.2) · fórmulas + términos Simetrik ──
      {sid:'lpad',term:'LPAD',cat:'term',en:'Left Pad',def:'Función de transformación: rellena texto a la izquierda con un carácter hasta alcanzar un largo dado. En DOTA punto 1 se usa para garantizar que CARD_SIX_FIRST_DIGITS quede en 6 chars.',ex:'LPAD("123", 6, "0") → "000123" para componer CARD_NUMBER de 16 chars.'},
      {sid:'coalesce',term:'COALESCE',cat:'term',en:'Coalesce',def:'Devuelve el primer valor no-nulo de una lista. En DOTA punto 5 se usa para consolidar GTWT_MERCHANT_NUMBER con prioridad PURCHASE > CAPTURE > AUTH.',ex:'COALESCE(PURCHASE_MERCHANT_NUMBER, CAPTURE_MERCHANT_NUMBER, AUTH_MERCHANT_NUMBER).'},
      {sid:'adicfechahabil',term:'ADICIONAR_DIASEMANA',cat:'term',en:'Add days/time to date',def:'Función oficial Simetrik. Sintaxis: ADICIONAR_DIASEMANA(FECHA;CANTIDAD). Agrega o resta unidades de tiempo. Con add-on días hábiles puede aceptar un 3er parámetro de sitio ("ARG"). Verificar con trainer.',ex:'EXPECTED_PAYMENT_DATE = ADICIONAR_DIASEMANA(MOV_CREATION_DATE; 30; "ARG").'},
      {sid:'adicfechatiempo',term:'TODAY()',cat:'term',en:'Current date',def:'Función oficial Simetrik que devuelve la fecha actual. Solo disponible dentro de agrupaciones. Equivalente a HOY() en Excel. Usar en columnas de vencimiento y aging.',ex:'DIFERENCIA_FECHA(FECHA_TXN; TODAY(); "días") — calcula días de antigüedad.'},
      {sid:'pan',term:'PAN',cat:'acro',en:'Primary Account Number',def:'Número de la tarjeta de pago (16 dígitos). En DOTA viene enmascarado como CARD_SIX_FIRST_DIGITS + XXXXXX + CARD_FOUR_LAST_DIGITS.',ex:'PAN reconstruido se usa como llave en la barrida 3 (DOTA vs FD detalle exacto).'},
      {sid:'bin',term:'BIN',cat:'acro',en:'Bank Identification Number',def:'Los primeros 6 dígitos del PAN identifican al emisor y la marca. En DOTA punto 4, los dos primeros se usan para deducir BRAND.',ex:'BIN 4xxxxx = VISA · 5x/2x = MASTERCARD · 34/37 = AMEX.'},
      {sid:'barrida',term:'Barrida',cat:'term',en:'Sweep / Pass',def:'Cada iteración de una conciliación avanzada. Las barridas se ejecutan en orden y cada una recibe el pendiente de la anterior. En DOTA × FD hay 5 barridas: 1-2 compensación DOTA, 3-4 DOTA vs FD detalle, 5 batch.',ex:'Barrida 1 = compensación exacta DOTA ↔ DOTA con llaves comercio + auth + |monto|.'},
      {sid:'compensacion',term:'Compensación',cat:'term',en:'Self-clearing',def:'Auto-cruce de una fuente contra sí misma para limpiar pares positivos/negativos del mismo origen (PAYMENT ↔ REFUND). Es el primer paso ANTES de cruzar contra la contraparte.',ex:'Barridas 1 y 2 del caso DOTA aplican compensación con restricción PAYMENT ≠ PAYMENT.'},
      {sid:'addons',term:'Add-ons',cat:'platform',en:'',def:'Módulos adicionales del workspace Simetrik que habilitan funcionalidades como Saldos Persistentes, fechas hábiles, conciliación avanzada multi-barrida, tableros KPI. El caso DOTA requiere TODOS los add-ons activos.',ex:'Sin add-on de saldos no podés resolver el punto 13 (saldo neto diario por comercio).'},
      {sid:'saldopersist',term:'Saldos Persistentes',cat:'platform',en:'',def:'Add-on Simetrik que mantiene un saldo acumulado por [clave, fecha] de forma incremental. Cada día parte del saldo del día anterior + movimientos del día.',ex:'Punto 13 DOTA: saldo neto diario por comercio = Saldo[día-1] + Σ movimientos del día.'},
      {sid:'nuevaherencia',term:'Nueva Herencia',cat:'platform',en:'',def:'Configuración moderna de workspace Simetrik que habilita las funciones más recientes (conciliación avanzada V2, fechas hábiles, saldos). El caso DOTA solo es resoluble en workspaces con nueva herencia.',ex:'Antes de empezar la prueba DOTA, verificá que tu workspace tenga nueva herencia activada.'},
      {sid:'tolerancia',term:'Tolerancia',cat:'term',en:'Tolerance',def:'Umbral permitido para que dos partidas crucen aunque no coincidan exactamente. En DOTA hay tolerancia de monto ($5 en barrida 2) y tolerancia de fecha (+1 día direccional en barrida 4).',ex:'Tolerancia $5 = dos partidas cruzan si |montoA − montoB| ≤ 5.'},
      // ── Nuevos términos KB v2.0 drill-down ──
      {sid:'barridacomp',term:'Barrida de Compensación',cat:'term',en:'Compensation sweep',def:'Tipo especial de barrida en conciliación avanzada. Aplica auto-cruce dentro de UN solo recurso para compensar registros opuestos (débitos vs créditos) antes del cruce con la contraparte.',ex:'B1 DOTA: compensación exacta de la misma fuente DB_DOTA con llaves comercio + auth + ABS(monto).'},
      {sid:'barridaagrup',term:'Barrida Agrupada',cat:'term',en:'Grouped sweep',def:'Tipo especial de barrida avanzada que agrupa el recurso (SUMA, CONTEO) antes de ejecutar el cruce. Permite comparar totales de lote vs detalle.',ex:'B5 DOTA: suma FD por BATCH_ID vs suma DOTA por comercio.'},
      {sid:'segmentacion',term:'Segmentación',cat:'term',en:'Segmentation',def:'Opción en conciliación avanzada que divide la fuente en subconjuntos antes del cruce. Las columnas de segmentación deben ser tipo Texto, Booleano o Entero, sin comportamiento dinámico.',ex:'Segmentar Lado A por OP (PAYMENT vs REFUND) para aplicar reglas distintas por tipo.'},
      {sid:'cardinalidad',term:'Cardinalidad',cat:'term',en:'Cardinality',def:'Tipo de relación entre registros en el cruce: 1:1 (uno a uno), 1:N, N:1, N:N. N:N requiere robustez alta o media y no admite tolerancias.',ex:'DOTA vs FD es cruce 1:1 (cada transacción DOTA corresponde a un registro FD).'},
      {sid:'robustezbarrida',term:'Robustez de barrida',cat:'term',en:'Sweep robustness',def:'Evaluación de Simetrik sobre la solidez de las reglas configuradas: verde (alta), amarillo (media), rojo (débil). Si es débil en N:N, la conciliación no ejecuta.',ex:'Barrida con 5 llaves (B3 DOTA×FD) tiene robustez alta (verde) automáticamente.'},
      {sid:'sktid',term:'Universal ID / SKT_ID',cat:'term',en:'Universal ID',def:'Identificador único que Simetrik asigna a cada registro para trazabilidad cross-recursos. Se configura en la barra de herramientas de la conciliación → "Global ID". La columna debe ser SKT_ID u ORIGIN_SKT_ID.',ex:'Universal ID permite seguir un registro DOTA a través de B1→B2→B3 sin perder la trazabilidad.'},
      {sid:'desencadenante',term:'Desencadenante',cat:'term',en:'Trigger',def:'Recurso que activa la ejecución de una conciliación cuando recibe nuevos datos. Por defecto es el Recurso B; si es unión/foto/agrupación, toma el Recurso A. También puede ser un horario programado.',ex:'En DOTA × FD el desencadenante es Reporte_FD (Recurso B).'},
      {sid:'acumvsnoacum',term:'Acumulativa vs No Acumulativa',cat:'term',en:'Cumulative vs Non-cumulative',def:'Tipos de agrupación en Simetrik. Acumulativa: sigue agrupando aunque el registro se concilie. No acumulativa: al conciliarse un registro, se bloquea y nuevos registros crean entrada separada.',ex:'Agrupación acumulativa para aging de pendientes; no acumulativa para snapshot diario.'},
      {sid:'versioncambios',term:'Versión con cambios',cat:'term',en:'Version with changes',def:'Mecanismo que permite modificar una conciliación Confirmada de forma segura, manteniendo historial de ajustes. Los cambios son visibles en la "Versión con cambios" hasta confirmarlos.',ex:'Para agregar barrida de desconciliación se debe crear primero una Versión con cambios.'},
      // ── Nuevos términos KB v3.0 ──
      {sid:'buscarv',term:'BuscarV',cat:'term',en:'VLOOKUP / Lookup column',def:'Función oficial Simetrik para enriquecer una fuente con datos de otra. Equivalente a VLOOKUP de Excel. Flujo: Vista tabla → ícono "Crear BuscarV" → seleccionar recurso fuente → columnas a traer → condiciones de cruce (col_A = col_B) → Guardar y ver tabla.',ex:'Paso 8 DOTA: BuscarV DB_DOTA × Parametria_Comercio · llave GTWT_MERCHANT_NUMBER = CODIGO_COMERCIO → trae TIPO_COMERCIO.'},
      {sid:'papelera',term:'Papelera',cat:'platform',en:'Trash / Recycle bin',def:'Recursos eliminados que se conservan 30 días antes de borrado definitivo. Path: Herramientas → Papelera. Se pueden restaurar dentro del período de retención.',ex:'Si se elimina una fuente por error, ir a Papelera y restaurarla dentro de los 30 días.'},
      {sid:'procesos',term:'Procesos',cat:'platform',en:'Processes monitor',def:'Monitor de ejecuciones del workspace: conciliaciones, ingestas, exportaciones. Path: Herramientas → Procesos. Campos: estado, fecha inicio, duración, usuario.',ex:'Después de ejecutar la conciliación DOTA × FD, verificar en Procesos que terminó sin error.'},
      {sid:'mapas',term:'Mapas',cat:'platform',en:'Resource maps',def:'Visualización gráfica del flujo de datos entre recursos (Fuentes → Uniones → Conciliaciones → Agrupaciones). Path: Herramientas → Mapas. Usar antes de eliminar un recurso para ver dependencias.',ex:'Antes de modificar DB_DOTA, ver en Mapas qué conciliaciones dependen de ella.'},
      {sid:'buscadorreg',term:'Buscador de registros',cat:'platform',en:'Record finder',def:'Búsqueda cross-recurso de un registro a lo largo de la cadena de conciliación. Path: Gestionar → Controles operativos → Buscador de registros. Soporta hasta 5 recursos descendentes.',ex:'Buscar una transacción por PAN desde DB_DOTA hasta FD para rastrear si concilió.'},
      {sid:'alarmas',term:'Alarmas',cat:'platform',en:'Alerts',def:'Notificaciones automáticas cuando un monitor supera un umbral (% pendientes, monto, tiempo sin ejecutar). Path: Gestionar → Hallazgos → Alarmas.',ex:'Alarma: si pendientes DOTA > 5% al cerrar B5, notificar al equipo de reconciliaciones.'},
      {sid:'adicdiasmana2p',term:'ADICIONAR_DIASEMANA — definitivo',cat:'term',en:'Add business days (weekdays only)',def:'ADICIONAR_DIASEMANA(FECHA;CANTIDAD) — exactamente 2 parámetros. Omite sábados y domingos. NO omite feriados de ningún país. No hay parámetro de calendario/sitio en la doc oficial. Para feriados ARG usar Camino C (BuscarV contra el calendario de días hábiles "Formato DIAS HABILES ARGENTINA").',ex:'ADICIONAR_DIASEMANA(MOV_CREATION_DATE; 30) → 30 días hábiles (sin sáb/dom).'},
      // ── Reconstrucción Dota · reglas de oro de propagación (2026-06-04) ──
      {sid:'reglaoro1cast',term:'Casteo en la fuente',cat:'process',en:'Cast type in the source',def:'Regla de oro #1: los cambios de tipo de dato (Texto/Fecha/Entero) se hacen SIEMPRE en la FUENTE, nunca en la Unión. En la Unión las columnas son heredadas y dan "la columna seleccionada no admite cambio de formato".',ex:'Para castear MOV_CREATED_DATE a Fecha, abrir la fuente DB_DOTA, no Union_DOTA.'},
      {sid:'reejecutarunion',term:'Re-ejecutar la unión',cat:'process',en:'Re-run the union',def:'Regla de oro #2: tras castear en la fuente hay que re-ejecutar la unión ("Ejecutar cambios"). Simetrik solo recalcula registros vacíos; las filas ya cargadas conservan el formato viejo si no se re-ejecuta.',ex:'Cambié el tipo en la fuente pero la unión sigue con el dato viejo → "Ejecutar cambios".'},
      {sid:'recrearcoltrans',term:'Borrar y recrear columna',cat:'process',en:'Delete & recreate transformation column',def:'Regla de oro #3: las columnas de transformación solo recalculan filas vacías. Para refrescar TODAS las filas tras un cambio aguas arriba, hay que borrar la columna y volver a crearla.',ex:'MOV_CREATION_DATE no se actualizó tras recastear la fecha → borrarla y recrearla.'},
      {sid:'colbloqueada',term:'Columna bloqueada 🚫',cat:'term',en:'Blocked column',def:'Regla de oro #4: una columna casteada que quedó mal mapeada se bloquea (🚫) y obliga a rehacer la unión entera. Por eso se castea ANTES de crear cualquier fórmula.',ex:'Castée una columna mal mapeada → 🚫 → toca rehacer Union_DOTA.'},
      {sid:'errt001',term:'Error T001',cat:'term',en:'T001 format error',def:'Error de Simetrik al castear una fecha ISO con T/timezone (2022-01-03T00:01:19-04:00) directo a "Fecha y hora": no parsea y vacía todas las celdas. Solución: castear a tipo Fecha identificando el formato original.',ex:'Castear MOV_CREATED_DATE a "Fecha y hora" → T001, celdas vacías.'},
      {sid:'castfechaiso',term:'Casteo de fecha ISO',cat:'process',en:'ISO date casting',def:'Para fechas ISO (con T y zona horaria) castear a tipo Fecha (NO "Fecha y hora"): Dar formato a columna → Paso 1 tipo Fecha → Paso 2 identificar el formato original → Paso 3 visualización 2016-11-24 (YYYY-MM-DD). Evita el workaround DIVIDIR(...;"T";1).',ex:'MOV_CREATED_DATE 2022-01-03T00:01:19-04:00 → Fecha 2022-01-03.'},
      {sid:'calhabilarg',term:'Calendario días hábiles ARG',cat:'platform',en:'Argentina business-days calendar',def:'Archivo "Formato DIAS HABILES ARGENTINA.xlsx" (reemplaza al viejo "Normalización días hábiles Argentina.xlsx"). Cubre 2019→2072. Columnas: PAIS, FECHA, CONCEPTO, CLASIFICATION, ID_SUM, ID_FINAL, DAY, YEAR.',ex:'Cargar como fuente Calendario_MLA para el cálculo de 30 días hábiles del Paso 7 DOTA.'},
      {sid:'idsumcol',term:'ID_SUM',cat:'term',en:'Business-day counter',def:'Columna del calendario de días hábiles ARG: contador de día hábil (incrementa solo en filas HABIL). Antes se llamaba ID_CONTADOR_SUMA.',ex:'BuscarV #1 del Paso 7 trae ID_SUM cruzando MOV_CREATION_DATE = FECHA.'},
      {sid:'idfinalcol',term:'ID_FINAL',cat:'term',en:'Day-number to date map',def:'Columna del calendario de días hábiles ARG: mapea de número de día hábil de vuelta a fecha. Antes se llamaba ID_FECHA_FINAL.',ex:'BuscarV #2 del Paso 7: N_TARGET = ID_FINAL → trae la FECHA de pago.'},
    ];
    function seedDict(){
      try {
        const v = localStorage.getItem('work_eco_dict_seed_v');
        if (v === SEED_VERSION) return;
        const existing = loadDict();
        const bySid = new Set(existing.filter(e=>e.sid).map(e=>e.sid));
        let added=0;
        SEED_DICT.forEach(s => {
          if (bySid.has(s.sid)) return;
          existing.push({ id:'d_seed_'+s.sid, sid:s.sid, term:s.term, cat:s.cat, en:s.en, def:s.def, ex:s.ex, updated:new Date().toISOString() });
          added++;
        });
        existing.sort((a,b)=>a.term.localeCompare(b.term));
        saveDict(existing);
        localStorage.setItem('work_eco_dict_seed_v', SEED_VERSION);
        console.log('[14-WORK] Dictionary seeded: +'+added+' entries (v'+SEED_VERSION+')');
      } catch(e){ console.warn('seedDict failed', e); }
    }

    // El Diccionario se alimenta del cerebro (simetrik-kb.json · glosario). Aditivo por sid, no destructivo.
    async function seedDictFromBrain(){
      try{
        const res=await fetch('data/simetrik-kb.json',{cache:'no-store'});
        if(!res.ok) return;
        const kb=await res.json();
        const bv=(kb.meta&&kb.meta.version)||'';
        if(localStorage.getItem('work_eco_dict_brain_v')===bv) return;
        const existing=loadDict();
        const bySid=new Set(existing.filter(e=>e.sid).map(e=>e.sid));
        let added=0;
        (kb.entries||[]).forEach(e=>{
          if(e.cat!=='glosario'||!e.id||e.id.indexOf('dict-')!==0) return;
          const sid=e.id.slice(5);
          if(bySid.has(sid)) return;
          let term=e.title||'', en='';
          const m=term.match(/^(.*?)\s+\((.+)\)\s*$/); if(m){term=m[1];en=m[2];}
          existing.push({id:'d_brain_'+sid, sid, term, cat:e.dcat||'term', en, def:e.body||'', ex:(e.evidence&&e.evidence!=='—')?e.evidence:'', updated:new Date().toISOString()});
          bySid.add(sid); added++;
        });
        if(added){ existing.sort((a,b)=>a.term.localeCompare(b.term)); saveDict(existing); }
        localStorage.setItem('work_eco_dict_brain_v', bv);
        if(added){ console.log('[14-WORK] Diccionario alimentado desde el cerebro: +'+added); dictRender(); }
      }catch(e){ console.warn('seedDictFromBrain failed', e); }
    }

    function init(){
      seedDict();
      seedDictFromBrain();
      initEditor('wf');
      initEditor('cu');
      dictRender();
    }
    return { fmt, insertLink, insertImg, dictAdd, dictEdit, dictCancel, dictSave, dictDel, dictRender, dictToggle, init };
  })();

  /* ═══════════════════════════════════════════════════════════════
     WORKSPACE DE IMPLEMENTACIÓN · multi-caso (TAPI + futuros)
     ───────────────────────────────────────────────────────────────
     Miguel es Implementation Specialist: hoy TAPI, mañana otros
     casos/clientes/canales. Cada caso tiene 3 pilares:
       general  → qué está pasando (estado del proyecto)
       saber    → qué debo saber (conocimiento / tutor)
       tasks    → trabajo a EJECUTAR en Simetrik (accionable)
     DATOS PRIVADOS: work_impl vive en localStorage → app_state
     (Supabase RLS, por usuario). NUNCA en el repo público.
  ═══════════════════════════════════════════════════════════════ */
  const K_IMPL = 'work_impl';
  const K_IMPL_ACTIVE = 'work_impl_active';   // local-only (selección UI)
  let _implPillar = 'general';

  function _iesc(s){ const d=document.createElement('div'); d.textContent=(s==null?'':String(s)); return d.innerHTML; }
  function _implMd(s){
    let h = _iesc(s||'');
    h = h.replace(/`([^`]+)`/g,'<code>$1</code>');
    h = h.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
    h = h.replace(/^###\s+(.+)$/gm,'<h4 style="margin:12px 0 4px;font-size:13px;color:var(--ac)">$1</h4>');
    h = h.replace(/^##\s+(.+)$/gm,'<h3 style="margin:14px 0 6px;font-size:15px">$1</h3>');
    h = h.replace(/(?:^- .+(?:\n|$))+/gm, m => '<ul style="margin:6px 0 6px 18px;padding:0">'+m.trim().split(/\n/).map(li=>'<li style="margin:3px 0">'+li.replace(/^- /,'')+'</li>').join('')+'</ul>');
    h = h.replace(/(?:^\d+\.\s.+(?:\n|$))+/gm, m => '<ol style="margin:6px 0 6px 20px;padding:0">'+m.trim().split(/\n/).map(li=>'<li style="margin:3px 0">'+li.replace(/^\d+\.\s/,'')+'</li>').join('')+'</ol>');
    h = h.replace(/\n{2,}/g,'<br><br>').replace(/\n/g,'<br>');
    h = h.replace(/<br>\s*(<(?:h3|h4|ul|ol)>)/g,'$1');
    return h;
  }

  function loadImpl(){ try { return JSON.parse(localStorage.getItem(K_IMPL)||'[]'); } catch { return []; } }
  function saveImpl(arr){ localStorage.setItem(K_IMPL, JSON.stringify(arr)); }
  function _implActive(){ try { return localStorage.getItem(K_IMPL_ACTIVE)||''; } catch { return ''; } }
  function _setImplActive(id){ try { localStorage.setItem(K_IMPL_ACTIVE, id||''); } catch {} }

  function implSelect(id){ _setImplActive(id); _implPillar='general'; renderImpl(); }
  function implPillar(which){ _implPillar=which; renderImpl(); }

  function implNew(){
    const name = prompt('Nombre del nuevo caso (cliente / canal):');
    if(!name) return;
    const arr = loadImpl();
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'').slice(0,32) || ('caso-'+Date.now());
    if(arr.some(c=>c.id===id)){ alert('Ya existe un caso con ese nombre.'); return; }
    arr.push({ id, name, client:'', role:'Implementation Specialist', channel:'', status:'Nuevo', deadline:'', updatedAt:new Date().toISOString(), general:'', saber:'', tasks:[], sources:[], open:[] });
    saveImpl(arr); _setImplActive(id); _implPillar='general'; renderImpl();
  }

  function implDelete(id){
    if(!confirm('¿Eliminar este caso de tu workspace?')) return;
    const arr = loadImpl().filter(c=>c.id!==id);
    saveImpl(arr);
    if(_implActive()===id) _setImplActive(arr[0]?arr[0].id:'');
    renderImpl();
  }

  function implToggleTask(caseId, taskId){
    const arr = loadImpl();
    const c = arr.find(x=>x.id===caseId); if(!c) return;
    const t = (c.tasks||[]).find(x=>x.id===taskId); if(!t) return;
    t.status = t.status==='done' ? 'todo' : t.status==='doing' ? 'done' : 'doing';
    c.updatedAt = new Date().toISOString();
    saveImpl(arr); renderImpl();
  }

  /** Upsert de un caso (merge by id). Vía privada de ingesta:
   *  Claude genera WORK.injectImplCase({...}) y Miguel lo corre logueado.
   *  El proxy de cloud-sync sube a Supabase (RLS) — nunca toca el repo. */
  function injectImplCase(obj){
    if(!obj || !obj.id || !obj.name){ console.warn('injectImplCase: falta id/name'); return '✗ objeto inválido (necesita id y name)'; }
    const arr = loadImpl();
    const i = arr.findIndex(c=>c.id===obj.id);
    obj.updatedAt = new Date().toISOString();
    if(i>=0){ arr[i] = { ...arr[i], ...obj }; } else { arr.push(obj); }
    saveImpl(arr); _setImplActive(obj.id);
    renderImpl();
    const msg = '✅ Caso "'+obj.name+'" cargado · '+((obj.tasks||[]).length)+' tareas. Abrí la pestaña 🚀 Implementación.';
    console.log('[14-WORK]', msg);
    return msg;
  }
  function injectImplFromJSON(str){ try { return injectImplCase(JSON.parse(str)); } catch(e){ return '✗ JSON inválido: '+e.message; } }

  /** Generador del prompt-asistente del proyecto. mode:
   *  ask | update | new | meeting | summary | deck | free
   *  Siempre lleva la lista de proyectos + el estado del activo como contexto. */
  function implIngestPrompt(id, mode){
    mode = mode || 'ask';
    const all = loadImpl();
    const c = all.find(x=>x.id===id) || null;
    const nm = c ? c.name : '(sin caso activo)';
    const cid = c ? c.id : '(nuevo)';
    const list = all.length ? all.map(x=>'- '+x.name+' (id: '+x.id+')').join('\n') : '(todavía no hay proyectos cargados)';
    const ctx = c ? ('\nESTADO ACTUAL DEL PROYECTO "'+nm+'" (id `'+cid+'`):\n```json\n'+JSON.stringify(c,null,1)+'\n```\n') : '';

    let head = '# CEREBRO · ASISTENTE DE PROYECTOS (14-WORK · Simetrik)\n\n';
    head += 'Soy **Implementation Specialist** en Simetrik. Mis proyectos cargados:\n'+list+'\n';
    head += '\n**Reglas:** NO inventes datos (solo evidencia: mi Drive / lo que pegue / el estado actual de abajo). Lo que no puedas confirmar, preguntámelo o marcalo "[a confirmar]". Respondé en español.\n';

    let body;
    if(mode==='update'){
      body = '\n## Tarea: ACTUALIZAR el proyecto "'+nm+'"\n'+
        'Tengo info nueva (en mi Drive o la pego abajo). Mergeá sobre el estado actual SIN perder nada (conservá el `status` de las tareas existentes y sus `id`). Actualizá los 3 pilares (general/saber/tasks) y "open". Devolveme el **JSON completo** (mismo id="'+cid+'") para pegar en el import del panel 🚀 Implementación.\n\nMATERIAL NUEVO:\n[pegá acá o decime que lea mi Drive]\n';
    } else if(mode==='new'){
      body = '\n## Tarea: CREAR un proyecto NUEVO\n'+
        'Te paso info de un caso nuevo (Drive o pegada). Preguntá lo mínimo que falte (nombre, cliente, canal, deadline). Armá los 3 pilares con lo que haya y "open" para lo no confirmado. Devolveme el **JSON completo** (con un id corto en minúsculas-con-guiones) para pegar en el import.\n\nMATERIAL:\n[pegá acá o decime que lea mi Drive]\n';
    } else if(mode==='meeting'){
      body = '\n## Tarea: PREPARARME una REUNIÓN del proyecto "'+nm+'"\n'+
        'Con el estado actual (+ lo que pegue), armá una prep accionable y lista para leer:\n'+
        '- Objetivo y contexto (2 líneas).\n- Estado actual / avances.\n- Pendientes y bloqueos (con responsable si se sabe).\n- Riesgos y decisiones a tomar.\n- Preguntas que debo hacer / temas a confirmar (incluí los "open").\n- Próximos pasos propuestos.\nSi falta algo, marcá "[a confirmar]".\n';
    } else if(mode==='summary'){
      body = '\n## Tarea: RESUMEN EJECUTIVO del proyecto "'+nm+'"\n'+
        'Media página, tono profesional, para alguien que no conoce el caso: qué es, estado actual, arquitectura/flujo en breve, pendientes críticos con fechas, riesgos. Solo evidencia.\n';
    } else if(mode==='deck'){
      body = '\n## Tarea: ARMAR PRESENTACIÓN del proyecto "'+nm+'"\n'+
        'Estructura de slides (título + 3-5 bullets c/u): portada, contexto/objetivo, arquitectura y fuentes, flujo de conciliación, estado actual, pendientes y cronograma, riesgos, próximos pasos. **Si querés que la genere como archivo .pptx real, pedímelo** y la armo. Solo evidencia.\n';
    } else if(mode==='free'){
      body = '\n## Consulta libre sobre "'+nm+'"\n[describí qué necesitás]\n';
    } else { // ask
      body = '\n## Asistente — preguntame primero\n'+
        'Antes de ejecutar, PREGUNTAME (1 sola tanda, breve):\n'+
        '1. **¿Sobre qué proyecto?** (elegí de la lista de arriba, o decí "NUEVO").\n'+
        '2. **¿Qué necesitás?** → (a) actualizar el caso con info nueva · (b) crear proyecto nuevo · (c) preparar una reunión · (d) resumen ejecutivo/estado · (e) armar presentación (puedo generar .pptx) · (f) otra consulta.\n'+
        '3. **¿Qué material tenés?** (¿lo subiste al Drive? ¿lo pegás? ¿falta algo que deba pedirte?).\n'+
        'Después ejecutá. Si el resultado modifica un caso, devolveme el **JSON completo** (mismo id) para pegar en el import del panel.\n';
    }

    const p = head + ctx + body;
    const out = document.getElementById('implOut');
    if(out){ document.getElementById('implOutPre').textContent = p; out.style.display='block'; out.scrollIntoView({behavior:'smooth',block:'nearest'}); }
    try{ navigator.clipboard.writeText(p); }catch{}
    if(!out){ try{ alert('Prompt copiado al portapapeles. Pegalo en Claude.'); }catch{} }
  }

  /** Importar/actualizar un caso pegando su JSON (sin DevTools).
   *  Acepta JSON estricto o un WORK.injectImplCase({...}) — limpia el wrapper. */
  function implImport(taId, msgId){
    const ta = document.getElementById(taId||'implImportTa');
    const msg = document.getElementById(msgId||'implImportMsg');
    if(!ta){ return; }
    let raw = (ta.value||'').trim();
    if(!raw){ if(msg){ msg.textContent='Pegá el JSON del caso primero.'; msg.style.color='var(--t3)'; } return; }
    // tolerar que peguen el call entero: WORK.injectImplCase( {...} );
    raw = raw.replace(/^[^([{]*WORK\.injectImpl\w*\(/,'').replace(/\)\s*;?\s*$/,'').trim();
    const r = injectImplFromJSON(raw);
    if(msg){ msg.textContent = r; msg.style.color = r.indexOf('✅')===0 ? 'var(--gn,#22c55e)' : '#ef4444'; }
  }

  function _implWhen(iso){ if(!iso) return '—'; try{ const d=new Date(iso); return d.toLocaleDateString('es',{day:'numeric',month:'short'})+' '+d.toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit'}); }catch{ return '—'; } }
  function _implDueBadge(deadline){
    try{
      const d=new Date(deadline+'T00:00:00'); const days=Math.ceil((d-new Date())/86400000);
      const col = days<0?'#ef4444':days<=3?'#f59e0b':days<=7?'#06b6d4':'var(--t3)';
      const txt = days<0?('venció hace '+(-days)+'d'):days===0?'¡HOY!':('en '+days+' días');
      return '<span style="margin-left:auto;font-size:11px;font-weight:700;color:'+col+'">⏰ '+_iesc(deadline)+' · '+txt+'</span>';
    }catch{ return ''; }
  }

  function implInit(){
    const arr = loadImpl();
    if(arr.length && !arr.some(c=>c.id===_implActive())) _setImplActive(arr[0].id);
    renderImpl();
  }

  function renderImpl(){
    const root = document.getElementById('implRoot');
    if(!root) return;
    const arr = loadImpl();
    if(!arr.length){
      root.innerHTML =
        '<div class="cd" style="text-align:center;padding:30px 20px">'+
        '<div style="font-size:34px;margin-bottom:8px">🚀</div>'+
        '<div style="font-size:16px;font-weight:700;margin-bottom:6px">Tu Workspace de Implementación está vacío</div>'+
        '<div style="font-size:12.5px;color:var(--t2);line-height:1.7;max-width:540px;margin:0 auto 14px">Acá vive cada caso que te asignen como Implementation Specialist (TAPI hoy, lo que venga mañana). Cada caso trae 3 pilares: <b>📡 qué está pasando</b>, <b>🧠 qué debo saber</b> y <b>🛠️ el trabajo a ejecutar en Simetrik</b>.</div>'+
        '<div style="font-size:12px;color:var(--t3);line-height:1.7;max-width:540px;margin:0 auto">Pedile a Claude que cargue tu primer caso: te da un <code>WORK.injectImplCase({...})</code> para correr acá logueado — los datos quedan privados (Supabase RLS), no tocan el repo. O creá uno vacío:</div>'+
        '<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;justify-content:center">'+
          '<button class="btn bp" onclick="WORK.implNew()">+ Nuevo caso vacío</button>'+
          '<button class="btn bg" onclick="WORK.implIngestPrompt(\'\',\'new\')">🤖 Prompt: armar proyecto con Claude</button>'+
        '</div>'+
        '<details style="margin-top:16px;text-align:left;max-width:560px;margin-left:auto;margin-right:auto" open>'+
          '<summary style="cursor:pointer;font-size:12px;color:var(--ac)">📥 Pegar caso (JSON) para cargar</summary>'+
          '<textarea id="implImportTa" class="inp" style="width:100%;min-height:90px;margin-top:8px;font-family:\'IBM Plex Mono\',monospace;font-size:11px" placeholder="Pegá el JSON que te dio Claude (o el WORK.injectImplCase({...}) completo)"></textarea>'+
          '<div style="display:flex;gap:8px;align-items:center;margin-top:6px"><button class="btn bp bs" onclick="WORK.implImport()">Cargar caso</button><span id="implImportMsg" style="font-size:11px"></span></div>'+
        '</details>'+
        '</div>';
      return;
    }
    const c = arr.find(x=>x.id===(_implActive()||arr[0].id)) || arr[0];

    let h = '<div class="cd" style="margin-bottom:12px">';
    h += '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">';
    h += '<select class="inp" style="max-width:220px;font-weight:700" onchange="WORK.implSelect(this.value)">'+
         arr.map(x=>'<option value="'+_iesc(x.id)+'"'+(x.id===c.id?' selected':'')+'>'+_iesc(x.name)+'</option>').join('')+'</select>';
    h += '<button class="btn bg bs" onclick="WORK.implNew()">+ Caso</button>';
    h += '<button class="btn bo bs" onclick="WORK.implDelete(\''+_iesc(c.id)+'\')">🗑</button>';
    h += (c.deadline?_implDueBadge(c.deadline):'');
    h += '</div>';
    h += '<div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:8px;font-size:11.5px;color:var(--t2)">';
    if(c.client) h += '<span>🏦 '+_iesc(c.client)+'</span>';
    if(c.role) h += '<span>👤 '+_iesc(c.role)+'</span>';
    if(c.channel) h += '<span>🔁 '+_iesc(c.channel)+'</span>';
    if(c.status) h += '<span>📊 '+_iesc(c.status)+'</span>';
    h += '<span style="color:var(--t3)">act. '+_implWhen(c.updatedAt)+'</span>';
    h += '</div></div>';

    const tasksDone = (c.tasks||[]).filter(t=>t.status==='done').length;
    const tasksTot = (c.tasks||[]).length;
    const P = [['general','📡 Qué está pasando'],['saber','🧠 Qué debo saber'],['ejecutar','🛠️ Trabajo en Simetrik'+(tasksTot?' ('+tasksDone+'/'+tasksTot+')':'')]];
    h += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">'+
         P.map(p=>'<button class="btn '+(_implPillar===p[0]?'bp':'bg')+' bs" onclick="WORK.implPillar(\''+p[0]+'\')">'+p[1]+'</button>').join('')+'</div>';

    h += '<div class="cd">';
    if(_implPillar==='general'){
      h += c.general ? _implMd(c.general) : '<div style="color:var(--t3);font-size:12px">Sin contenido todavía. Pedile a Claude que actualice este caso.</div>';
    } else if(_implPillar==='saber'){
      h += c.saber ? _implMd(c.saber) : '<div style="color:var(--t3);font-size:12px">Sin contenido todavía.</div>';
      if((c.open||[]).length){
        h += '<div style="margin-top:14px;padding:10px 12px;background:rgba(245,158,11,.08);border-radius:8px;border-left:3px solid #f59e0b">';
        h += '<div style="font-weight:700;font-size:12px;color:#f59e0b;margin-bottom:6px">❓ A confirmar (no inventado)</div>';
        h += '<ul style="margin:0 0 0 18px;font-size:12px;color:var(--t2)">'+(c.open||[]).map(q=>'<li style="margin:3px 0">'+_iesc(q)+'</li>').join('')+'</ul></div>';
      }
      if((c.sources||[]).length){
        h += '<div style="margin-top:12px;font-size:11.5px;color:var(--t3)">📎 Fuentes: '+(c.sources||[]).map(s=>s.url?'<a href="'+_iesc(s.url)+'" target="_blank" rel="noopener">'+_iesc(s.title||s.url)+'</a>':_iesc(s.title)).join(' · ')+'</div>';
      }
    } else {
      if(!tasksTot){ h += '<div style="color:var(--t3);font-size:12px">Sin tareas todavía.</div>'; }
      else {
        const pct = Math.round(tasksDone/tasksTot*100);
        h += '<div style="margin-bottom:10px"><div style="height:7px;background:var(--bd);border-radius:6px;overflow:hidden"><div style="height:100%;width:'+pct+'%;background:var(--gn,#22c55e)"></div></div><div style="font-size:11px;color:var(--t3);margin-top:3px">'+tasksDone+'/'+tasksTot+' completadas ('+pct+'%)</div></div>';
        h += (c.tasks||[]).map(t=>{
          const ic = t.status==='done'?'✅':t.status==='doing'?'🔵':'⬜';
          const col = t.status==='done'?'var(--gn,#22c55e)':t.status==='doing'?'var(--ac)':'var(--bd)';
          return '<div style="border:1px solid var(--bd);border-left:3px solid '+col+';border-radius:8px;padding:10px 12px;margin-bottom:8px">'+
            '<div style="display:flex;align-items:flex-start;gap:8px">'+
            '<span style="cursor:pointer;font-size:16px;user-select:none" onclick="WORK.implToggleTask(\''+_iesc(c.id)+'\',\''+_iesc(t.id)+'\')" title="Cambiar estado (⬜→🔵→✅)">'+ic+'</span>'+
            '<div style="flex:1"><div style="font-weight:600;font-size:13px;'+(t.status==='done'?'text-decoration:line-through;color:var(--t3)':'')+'">'+_iesc(t.title)+'</div>'+
            (t.detail?'<div style="font-size:12px;color:var(--t2);margin-top:3px;line-height:1.6">'+_implMd(t.detail)+'</div>':'')+
            (t.simetrik?'<div style="font-size:11.5px;margin-top:6px;background:rgba(6,182,212,.06);border-radius:6px;padding:7px 10px"><b style="color:var(--ac)">En Simetrik:</b> '+_implMd(t.simetrik)+'</div>':'')+
            '</div></div></div>';
        }).join('');
      }
    }
    h += '</div>';

    const cidJs = _iesc(c.id);
    h += '<div class="cd" style="margin-top:12px;border-left:3px solid var(--vi,#7c3aed)">';
    h += '<div style="font-size:13px;font-weight:600;margin-bottom:4px">🤖 Asistente del proyecto</div>';
    h += '<div style="font-size:11.5px;color:var(--t2);line-height:1.6;margin-bottom:8px">Generá un prompt y dámelo en Claude. El asistente puede actualizar el caso, prepararte una reunión, hacer un resumen o armar una presentación — siempre con el contexto de <b>'+_iesc(c.name)+'</b> precargado. Datos privados.</div>';
    h += '<div style="display:flex;gap:6px;flex-wrap:wrap">';
    h += '<button class="btn bp bs" style="background:var(--vi,#7c3aed)" onclick="WORK.implIngestPrompt(\''+cidJs+'\',\'ask\')">🤖 Asistente (preguntame)</button>';
    h += '<button class="btn bg bs" onclick="WORK.implIngestPrompt(\''+cidJs+'\',\'update\')">🔄 Actualizar</button>';
    h += '<button class="btn bg bs" onclick="WORK.implIngestPrompt(\''+cidJs+'\',\'meeting\')">🗓️ Reunión</button>';
    h += '<button class="btn bg bs" onclick="WORK.implIngestPrompt(\''+cidJs+'\',\'summary\')">📋 Resumen</button>';
    h += '<button class="btn bg bs" onclick="WORK.implIngestPrompt(\''+cidJs+'\',\'deck\')">🖥️ Presentación</button>';
    h += '<button class="btn bg bs" onclick="WORK.implIngestPrompt(\''+cidJs+'\',\'new\')">➕ Nuevo proyecto</button>';
    h += '</div>';
    h += '<div id="implOut" style="display:none;margin-top:10px"><pre class="result" id="implOutPre" style="white-space:pre-wrap"></pre><button class="btn bg bs" style="margin-top:6px" onclick="document.getElementById(\'implOut\').style.display=\'none\'">✕ Cerrar</button></div>';
    h += '<details style="margin-top:10px"><summary style="cursor:pointer;font-size:11.5px;color:var(--ac)">📥 Pegar caso actualizado (JSON)</summary>'+
         '<textarea id="implImportTa" class="inp" style="width:100%;min-height:80px;margin-top:8px;font-family:\'IBM Plex Mono\',monospace;font-size:11px" placeholder="Pegá el JSON que te devuelvo (o el WORK.injectImplCase({...}) completo) para crear/actualizar un caso"></textarea>'+
         '<div style="display:flex;gap:8px;align-items:center;margin-top:6px"><button class="btn bp bs" onclick="WORK.implImport()">Cargar / actualizar</button><span id="implImportMsg" style="font-size:11px"></span></div></details>';
    h += '</div>';

    root.innerHTML = h;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { render(); eco.init(); });
  else setTimeout(() => { render(); eco.init(); }, 0);

  return {
    saveCase, delCase, saveError, delError, saveLearning, delLearning,
    saveKB, buildAskPrompt, buildMasterReviewPrompt, buildTestDevPrompt, buildSimetrikWorkPrompt, copyAsk, clearForm, render, eco,
    addPendAtt, removePendAtt, addAttToItem, removeAttFromItem,
    addKbAtt, removeKbAtt,
    syncAttToCloud, syncKbAttToCloud, syncAllAttsToCloud,
    forceResync, forcePush, showSyncDiagnostics, compareLocalVsCloud, smartSync,
    // MOIF
    saveMoif, delMoif, editMoif, toggleMoif, copyMoifTranscript, buildMoifPrompt,
    // TUTOR
    tutorSelect, tutorInit, tutorGuiaHoy, tutorShowQuestion,
    // IMPLEMENTACIÓN (workspace multi-caso · 3 pilares · datos privados)
    implInit, renderImpl, implSelect, implPillar, implNew, implDelete, implToggleTask, injectImplCase, injectImplFromJSON, implIngestPrompt, implImport,
  };
})();
window.WORK = WORK;

// Auto-init tutor si el panel está visible al cargar la página
(function(){
  function _tryInitTutor(){
    const panel = document.getElementById('p-copilot');
    if(panel && panel.classList.contains('on')){
      WORK.tutorInit();
      WORK.tutorGuiaHoy();
    }
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', _tryInitTutor);
  } else {
    _tryInitTutor();
  }
})();

/* ═══════════════════════════════════════════════════════════════
   WorkNB — wrapper around the same NB pattern as NotNB but with
   work_nb_meta / work_nb_data namespacing and 'workNb*' DOM IDs.
   Mirrors notes-nb.js feature set: covers, design picker, IDB images,
   attachments, auto-save, rich-text toolbar.
═══════════════════════════════════════════════════════════════ */
const WorkNB = (function(){
  'use strict';

  const META_KEY = 'work_nb_meta';
  const DATA_KEY = 'work_nb_data';
  const ACTIVE_KEY = 'work_nb_active';
  const PALETTE = ['#06b6d4','#10b981','#8b5cf6','#f59e0b','#ec4899','#6366f1','#14b8a6','#ef4444'];

  let activeNbId = (function(){ try { return localStorage.getItem(ACTIVE_KEY) || null; } catch { return null; } })();
  let activePageId = null;
  const saveTimers = {};

  function esc(s){ const d=document.createElement('div'); d.textContent=s==null?'':s; return d.innerHTML; }
  function loadMeta(){ try { return JSON.parse(localStorage.getItem(META_KEY)||'[]'); } catch { return []; } }
  function saveMeta(m){ localStorage.setItem(META_KEY, JSON.stringify(m)); }
  function loadData(){ try { return JSON.parse(localStorage.getItem(DATA_KEY)||'{}'); } catch { return {}; } }
  function saveData(d){
    const json = JSON.stringify(d);
    try { localStorage.setItem(DATA_KEY, json); }
    catch(e){
      if (e && (e.name==='QuotaExceededError' || /quota/i.test(e.message||''))) {
        alert('💾 Almacenamiento local lleno.\nLas imágenes nuevas se almacenan en IndexedDB para evitar este problema.\nEliminá imágenes/páginas viejas si seguís viendo este mensaje.');
        throw e;
      }
      throw e;
    }
  }
  function getPages(id){ const d=loadData(); return (d[id] && d[id].pages) || []; }
  function setActive(id){ activeNbId = id || null; try { localStorage.setItem(ACTIVE_KEY, activeNbId||''); } catch {} if (window.WORK) WORK.render(); }

  /* ── Design picker ────────────────────────────────────────── */
  async function openDesignPicker(){
    if (!window.NBShared) return alert('Módulo de diseño no cargado.');
    const iconH = document.getElementById('workNbIconValue');
    const coverH = document.getElementById('workNbCoverValue');
    const nameInp = document.getElementById('workNbName');
    const r = await NBShared.openDesignModal({
      cover: coverH?.value || 'c6',
      icon: iconH?.value || '💼',
      name: nameInp?.value || '',
    });
    if (!r) return;
    if (iconH) iconH.value = r.icon;
    if (coverH) coverH.value = r.cover;
    refreshNewFormPreview();
  }
  function refreshNewFormPreview(){
    const iconH = document.getElementById('workNbIconValue');
    const coverH = document.getElementById('workNbCoverValue');
    const previewEl = document.getElementById('workNbDesignPreview');
    const iconEl = document.getElementById('workNbDesignIconPreview');
    if (previewEl && coverH) previewEl.className = 'nb-cover-' + coverH.value;
    if (iconEl && iconH) iconEl.textContent = iconH.value;
  }
  async function editDesign(id){
    if (!window.NBShared) return;
    const list = loadMeta(); const nb = list.find(n => n.id === id); if (!nb) return;
    const r = await NBShared.openDesignModal({ cover: nb.cover || 'c6', icon: nb.icon, name: nb.name });
    if (!r) return;
    nb.cover = r.cover; nb.icon = r.icon; nb.updated = new Date().toISOString();
    saveMeta(list); render();
  }

  /* ── CRUD ─────────────────────────────────────────────────── */
  function create(){
    const nameInp = document.getElementById('workNbName');
    const iconV = (document.getElementById('workNbIconValue')||{}).value || '💼';
    const coverV = (document.getElementById('workNbCoverValue')||{}).value || 'c6';
    const name = (nameInp?.value || '').trim();
    if (!name) { alert('Dale un nombre al cuaderno.'); return; }
    const list = loadMeta();
    const id = 'work_nb_' + Date.now();
    list.push({ id, name, icon: iconV, cover: coverV, color: PALETTE[list.length % PALETTE.length], created: new Date().toISOString() });
    saveMeta(list);
    const data = loadData(); data[id] = { pages: [] }; saveData(data);
    if (nameInp) nameInp.value = '';
    setActive(id); activePageId = null; render();
  }
  function rename(id){
    const list = loadMeta(); const nb = list.find(n => n.id === id); if (!nb) return;
    const next = prompt('Nombre del cuaderno:', nb.name);
    if (!next || !next.trim()) return;
    nb.name = next.trim(); nb.updated = new Date().toISOString();
    saveMeta(list); render();
  }
  function remove(id){
    const list = loadMeta(); const nb = list.find(n => n.id === id); if (!nb) return;
    if (!confirm(`¿Eliminar "${nb.name}" y todo su contenido?`)) return;
    saveMeta(list.filter(n => n.id !== id));
    const data = loadData();
    if (data[id] && window.NBShared) {
      (data[id].pages || []).forEach(p => {
        (p.images||[]).forEach(im => { if (im.id) NBShared.deleteImage(im.id).catch(()=>{}); });
        (p.attachments||[]).forEach(a => NBShared.deleteBlob(a.id).catch(()=>{}));
      });
    }
    delete data[id]; saveData(data);
    if (activeNbId === id) { setActive(null); activePageId = null; }
    render();
  }
  function selectActive(id){ setActive(id); activePageId = null; render(); }

  /* Move notebook to another module (NB-ENGINE standard) */
  function moveNotebook(id){
    if (!window.NBEngine) { alert('Motor de cuadernos no cargado.'); return; }
    NBEngine.transferUI(id, '14-WORK', () => {
      if (activeNbId === id) { setActive(null); activePageId = null; }
      render();
    });
  }

  /* ── PAGE OPS ─────────────────────────────────────────────── */
  function newPage(nbId){
    const data = loadData();
    if (!data[nbId]) data[nbId] = { pages: [] };
    const page = { id: Date.now(), title: '', body: '', images: [], attachments: [], links: [], created: new Date().toISOString(), updated: new Date().toISOString() };
    data[nbId].pages.unshift(page); saveData(data);
    activePageId = page.id; render();
  }
  async function openPage(nbId, pid){
    activePageId = pid;
    if (window.NBShared) {
      try {
        const data = loadData();
        const page = (data[nbId]||{pages:[]}).pages.find(p => p.id === pid);
        if (page && page.images && page.images.some(im => im && im.data && !im.id)) {
          await NBShared.migrateLegacyImages(page);
          if (page._migrated) { delete page._migrated; saveData(data); }
        }
      } catch(e){}
    }
    render();
  }
  function deletePage(nbId, pid){
    if (!confirm('¿Eliminar esta página?')) return;
    const data = loadData();
    if (!data[nbId]) return;
    const page = data[nbId].pages.find(p => p.id === pid);
    if (page && window.NBShared) {
      (page.images||[]).forEach(im => { if (im.id) NBShared.deleteImage(im.id).catch(()=>{}); });
      (page.attachments||[]).forEach(a => NBShared.deleteBlob(a.id).catch(()=>{}));
    }
    data[nbId].pages = data[nbId].pages.filter(p => p.id !== pid);
    saveData(data);
    if (activePageId === pid) activePageId = null;
    render();
  }
  function _commitNow(nbId){
    if (!activePageId) return;
    const data = loadData();
    if (!data[nbId]) return;
    const page = data[nbId].pages.find(p => p.id === activePageId);
    if (!page) return;
    const tIn = document.getElementById('nbTitle-' + nbId);
    const bIn = document.getElementById('nbBody-' + nbId);
    const newTitle = tIn ? tIn.value : page.title;
    const newBody  = bIn ? bIn.innerHTML : page.body;
    // Sin cambios reales → NO re-sellar updated (evita envenenar el merge cross-device)
    if (newTitle === page.title && newBody === page.body) return;
    page.title = newTitle;
    page.body  = newBody;
    page.updated = new Date().toISOString();
    saveData(data);
    const badge = document.getElementById('nbSaved-' + nbId);
    if (badge) { badge.classList.add('on'); clearTimeout(badge._t); badge._t = setTimeout(()=>badge.classList.remove('on'), 1200); }
  }
  function autoSave(nbId){
    clearTimeout(saveTimers[nbId]);
    saveTimers[nbId] = setTimeout(() => _commitNow(nbId), 500);
  }
  function flushAll(){
    Object.keys(saveTimers).forEach(nbId => {
      clearTimeout(saveTimers[nbId]);
      _commitNow(nbId);
    });
  }
  // Flush on blur / tab hide / unload to prevent data loss
  window.addEventListener('beforeunload', flushAll);
  document.addEventListener('visibilitychange', () => { if (document.hidden) flushAll(); });
  document.addEventListener('focusout', (e) => {
    const t = e.target;
    if (t && (t.id||'').startsWith('nbBody-')) {
      const nbId = t.id.slice(7); _commitNow(nbId);
    } else if (t && (t.id||'').startsWith('nbTitle-')) {
      const nbId = t.id.slice(8); _commitNow(nbId);
    }
  });

  /* ── RICH-TEXT ────────────────────────────────────────────── */
  function focusEditor(nbId){
    const bIn = document.getElementById('nbBody-' + nbId);
    if (!bIn) return null;
    if (document.activeElement !== bIn) bIn.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      const r = document.createRange(); r.selectNodeContents(bIn); r.collapse(false);
      sel.removeAllRanges(); sel.addRange(r);
    }
    return bIn;
  }
  function fmt(nbId, kind, value){
    const bIn = focusEditor(nbId); if (!bIn) return;
    // Comandos extendidos centralizados (listas, checklist, hr)
    if (window.NBShared && NBShared.fmtExtended && NBShared.fmtExtended(kind)) {
      autoSave(nbId);
      return;
    }
    try {
      if (kind === 'bold') document.execCommand('bold', false, null);
      else if (kind === 'size') {
        const map = { s:'2', m:'3', l:'5' };
        document.execCommand('fontSize', false, map[value] || '3');
      } else if (kind === 'hl') {
        const map = { y:'#fff59d', g:'#a5d6a7', p:'#f8bbd0' };
        try { document.execCommand('styleWithCSS', false, true); } catch(e){}
        document.execCommand('foreColor', false, '#1a1a1a');
        if (!document.execCommand('hiliteColor', false, map[value] || '#fff59d')) {
          document.execCommand('backColor', false, map[value] || '#fff59d');
        }
      } else if (kind === 'clear') {
        document.execCommand('removeFormat', false, null);
      }
    } catch(e){}
    autoSave(nbId);
  }
  function insertLabel(nbId, type){
    const bIn = focusEditor(nbId); if (!bIn) return;
    const html = type === 'urgent'
      ? '<span class="rt-label rt-lbl-urgent" contenteditable="false" onclick="WorkNB.removeLabelEl(this,\''+nbId+'\')">⚠ URGENTE</span>&nbsp;'
      : '<span class="rt-label rt-lbl-done" contenteditable="false" onclick="WorkNB.removeLabelEl(this,\''+nbId+'\')">✓ HECHO</span>&nbsp;';
    try { document.execCommand('insertHTML', false, html); } catch(e){}
    autoSave(nbId);
  }
  function removeLabelEl(el, nbId){ if (el && el.parentNode) el.parentNode.removeChild(el); autoSave(nbId); }

  /* ── LINKS ────────────────────────────────────────────────── */
  function addLink(nbId){
    if (!activePageId) return alert('Primero abrí una página.');
    const url = prompt('URL:'); if (!url) return;
    const label = prompt('Nombre:') || url;
    const data = loadData();
    const page = data[nbId].pages.find(p => p.id === activePageId);
    if (!page.links) page.links = [];
    page.links.push({ url, label, added: new Date().toISOString() });
    page.updated = new Date().toISOString(); saveData(data); render();
  }
  function removeLink(nbId, idx){
    const data = loadData();
    const page = data[nbId].pages.find(p => p.id === activePageId);
    if (!page || !page.links) return;
    page.links.splice(idx, 1); page.updated = new Date().toISOString(); saveData(data); render();
  }

  /* ── IMAGES (IDB-backed) ──────────────────────────────────── */
  async function addImage(nbId){
    if (!activePageId) return alert('Primero abrí una página.');
    if (!window.NBShared) return alert('Módulo no cargado.');
    const rec = await NBShared.pickImageRecordViaModal();
    if (!rec) return;
    const data = loadData();
    const page = data[nbId].pages.find(p => p.id === activePageId);
    if (!page.images) page.images = [];
    page.images.push({ id: rec.id, thumbnail: rec.thumbnail, caption: rec.caption||rec.name||'', size: rec.size, addedAt: rec.addedAt });
    page.updated = new Date().toISOString(); saveData(data); render();
  }
  function renameImage(nbId, idx){
    const data = loadData();
    const page = data[nbId].pages.find(p => p.id === activePageId);
    if (!page || !page.images || !page.images[idx]) return;
    const next = prompt('Nombre/descripción:', page.images[idx].caption || '');
    if (next === null) return;
    page.images[idx].caption = next;
    page.updated = new Date().toISOString(); saveData(data); render();
  }
  async function removeImage(nbId, idx){
    if (!confirm('¿Eliminar imagen?')) return;
    const data = loadData();
    const page = data[nbId].pages.find(p => p.id === activePageId);
    if (!page) return;
    const im = page.images[idx];
    if (im && im.id && window.NBShared) { try { await NBShared.deleteImage(im.id); } catch(e){} }
    page.images.splice(idx, 1);
    page.updated = new Date().toISOString(); saveData(data); render();
  }
  async function viewImage(nbId, idx){
    const data = loadData();
    const page = data[nbId].pages.find(p => p.id === activePageId);
    if (!page || !page.images || !page.images[idx]) return;
    const im = page.images[idx];
    const fullUrl = window.NBShared ? await NBShared.resolveImageData(im) : (im.data || im.thumbnail);
    if (!fullUrl) return alert('Imagen original no disponible en este dispositivo.');
    let lb = document.getElementById('workNbLightbox');
    if (!lb) {
      lb = document.createElement('div');
      lb.id = 'workNbLightbox';
      lb.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.92);backdrop-filter:blur(8px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:40px;cursor:zoom-out';
      lb.onclick = () => lb.remove();
      document.body.appendChild(lb);
    }
    lb.innerHTML = `<img src="${fullUrl}" style="max-width:95vw;max-height:90vh;border-radius:8px"><div style="position:fixed;bottom:20px;left:50%;transform:translateX(-50%);color:#fff;font-family:'IBM Plex Mono',monospace;font-size:12px;background:rgba(0,0,0,.6);padding:8px 16px;border-radius:6px">${esc(im.caption||'')}</div>`;
  }

  /* ── ATTACHMENTS ──────────────────────────────────────────── */
  async function attachFile(nbId){
    if (!window.NBShared) return alert('Módulo no cargado.');
    if (!activePageId) return alert('Primero abrí una página.');
    const meta = await NBShared.pickAttachmentViaModal('work_'+nbId+'_'+activePageId);
    if (!meta) return;
    const data = loadData();
    const page = data[nbId].pages.find(p => p.id === activePageId);
    if (!page.attachments) page.attachments = [];
    page.attachments.push(meta);
    page.updated = new Date().toISOString(); saveData(data);
    if (window.CLOUD && window.CLOUD.pushNow) window.CLOUD.pushNow('work_nb_data').catch(()=>{});
    render();
  }
  async function removeAttachment(nbId, attId){
    if (!confirm('¿Eliminar adjunto?')) return;
    const data = loadData();
    if (!data[nbId]) { console.warn('[WorkNB] removeAttachment: notebook not found', nbId); return; }
    // Buscar el attachment en activePageId primero, sino en todas las páginas
    let pageHit = null;
    if (activePageId) {
      const p = data[nbId].pages.find(p => p.id === activePageId);
      if (p && (p.attachments||[]).some(a => a.id === attId)) pageHit = p;
    }
    if (!pageHit) {
      // Fallback: buscar en TODAS las páginas del cuaderno
      pageHit = data[nbId].pages.find(p => (p.attachments||[]).some(a => a.id === attId));
    }
    if (!pageHit) {
      console.warn('[WorkNB] removeAttachment: attachment id no encontrado en ninguna página', { nbId, attId, activePageId });
      alert('No se encontró el adjunto en ninguna página de este cuaderno. Probable causa: el ID local quedó desincronizado. Refresca la página (F5) e intentalo de nuevo.');
      return;
    }
    const before = pageHit.attachments.length;
    pageHit.attachments = pageHit.attachments.filter(a => a.id !== attId);
    const after = pageHit.attachments.length;
    console.log('[WorkNB] removeAttachment · page', pageHit.id, '· attachments', before, '→', after, '· removed id:', attId);
    pageHit.updated = new Date().toISOString();
    saveData(data);
    if (window.NBShared) { try { await NBShared.deleteImage(attId); } catch(e){} try { await NBShared.deleteBlob(attId); } catch(e){} }
    // Push inmediato del cambio en work_nb_data
    if (window.CLOUD && window.CLOUD.pushNow) {
      const r = await window.CLOUD.pushNow('work_nb_data');
      console.log('[WorkNB] pushNow work_nb_data after delete:', r);
      if (!r.ok) alert('⚠️ Borrado localmente pero NO se subió al cloud · '+(r.detail||r.reason)+'\n\nEl cambio puede revertirse al refrescar. Click "⬆ Subir al cloud" arriba.');
    }
    render();
  }

  /* ── RENDER ───────────────────────────────────────────────── */
  function renderBodyContent(body){ if (!body) return ''; if (/<[a-z][^>]*>/i.test(body)) return body; return esc(body); }
  function renderLinks(nbId, page){
    if (!page.links || !page.links.length) return '<div style="font-size:11px;color:var(--t3);padding:4px 0">Sin links.</div>';
    return page.links.map((l, i) =>
      `<div class="nb-link"><span class="nb-link-icon">🔗</span><div style="flex:1;min-width:0"><div style="font-size:12px">${esc(l.label)}</div><a href="${esc(l.url)}" target="_blank" rel="noopener" class="nb-link-url">${esc(l.url)}</a></div><button onclick="WorkNB.removeLink('${nbId}',${i})" style="background:none;border:none;color:var(--t3);cursor:pointer">✕</button></div>`
    ).join('');
  }
  function renderImages(nbId, page){
    if (!page.images || !page.images.length) return '<div style="font-size:11px;color:var(--t3);padding:4px 0;grid-column:1/-1">Sin imágenes.</div>';
    return page.images.map((im, i) => {
      const src = im.thumbnail || im.data || '';
      const orphan = im.id && !im.thumbnail && !im.data;
      return `<div class="nb-img-card">
        <button class="nb-img-del" onclick="event.stopPropagation();WorkNB.removeImage('${nbId}',${i})">✕</button>
        <button class="nb-img-rename" onclick="event.stopPropagation();WorkNB.renameImage('${nbId}',${i})">✏</button>
        ${orphan?'<div style="aspect-ratio:1;background:var(--el);display:flex;align-items:center;justify-content:center;color:var(--t3);font-size:11px;text-align:center">📷<br>Solo en otro<br>dispositivo</div>':`<img src="${src}" alt="${esc(im.caption)}" onclick="WorkNB.viewImage('${nbId}',${i})">`}
        <div class="nb-img-caption">${esc(im.caption||'Sin nombre')}</div>
      </div>`;
    }).join('');
  }
  function renderAttachments(nbId, page){
    if (!window.NBShared) return '';
    return NBShared.renderAttachmentChips((page&&page.attachments)||[], { onRemove: "WorkNB.removeAttachment.bind(null,'"+nbId+"')" });
  }

  function buildEditorHtml(nbId, page){
    if (!page) return '';
    const toolbarHtml = (window.NBShared && NBShared.toolbarHtml) ? NBShared.toolbarHtml(nbId, 'WorkNB') : '';
    return `${toolbarHtml}
      <div class="nb-page" style="margin-bottom:12px">
        <div class="nb-header">
          <input class="nb-title-inp" id="nbTitle-${nbId}" value="${esc(page.title||'').replace(/"/g,'&quot;')}" placeholder="Título..." oninput="WorkNB.autoSave('${nbId}')">
          <span class="nb-saved" id="nbSaved-${nbId}">✓ guardado</span>
          <span class="nb-date">${new Date(page.created).toLocaleDateString('es',{day:'numeric',month:'short',year:'numeric'})}</span>
        </div>
        <div class="nb-spine"></div>
        <div class="nb-holes"><div class="nb-hole" style="top:24px"></div><div class="nb-hole" style="top:72px"></div><div class="nb-hole" style="top:120px"></div><div class="nb-hole" style="top:168px"></div><div class="nb-hole" style="top:216px"></div><div class="nb-hole" style="top:264px"></div><div class="nb-hole" style="top:312px"></div><div class="nb-hole" style="top:360px"></div></div>
        <div class="nb-margin"></div>
        <div class="nb-content" id="nbBody-${nbId}" contenteditable="true" data-placeholder="Escribe aquí..." oninput="WorkNB.autoSave('${nbId}')">${renderBodyContent(page.body)}</div>
      </div>
      <div class="lb">· links ·</div>
      <div>${renderLinks(nbId, page)}</div>
      <div class="lb">· archivos · <span style="font-size:9px;color:var(--t3);text-transform:none">(local)</span></div>
      <div class="nb-att-list">${renderAttachments(nbId, page)}</div>
      <div class="lb">· imágenes ·</div>
      <div class="nb-images">${renderImages(nbId, page)}</div>`;
  }

  function renderEditor(nb){
    const pages = getPages(nb.id);
    const page = activePageId ? pages.find(p => p.id === activePageId) : null;
    const pagesList = pages.length ? pages.map(p => {
      const preview = (p.body||'').replace(/<[^>]*>/g,'').substring(0,70);
      const isActive = activePageId === p.id;
      return `<div class="nb-entry${isActive?' open':''}">
        <div class="nb-entry-h" onclick="WorkNB.openPage('${nb.id}',${p.id})">
          <div style="min-width:0;flex:1">
            <div class="nb-entry-title">${esc(p.title||'Sin título')}</div>
            <div style="font-size:10px;color:var(--t3);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(preview)}${preview.length>=70?'…':''}</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
            <span class="nb-entry-date">${new Date(p.updated||p.created).toLocaleDateString('es',{day:'numeric',month:'short'})}</span>
            <span style="font-size:10px;color:var(--t3)">${(p.images||[]).length?'🖼'+p.images.length:''} ${(p.attachments||[]).length?'📎'+p.attachments.length:''}</span>
            <button onclick="event.stopPropagation();WorkNB.deletePage('${nb.id}',${p.id})" style="background:none;border:none;color:var(--t3);cursor:pointer">🗑</button>
          </div>
        </div>
      </div>`;
    }).join('') : '<div style="text-align:center;padding:14px;color:var(--t3);font-size:11px">Sin páginas.</div>';

    const editor = buildEditorHtml(nb.id, page);
    return `<div class="nb-shell" style="border-left:3px solid ${nb.color||'#06b6d4'};padding:0;overflow:visible">
      <div class="nb-cover-card nb-cover-${nb.cover||'c6'}">
        <div class="nb-cover-icon">${nb.icon}</div>
        <div>
          <div class="nb-cover-title">${esc(nb.name)}</div>
          <div class="nb-cover-sub">${pages.length} página${pages.length!==1?'s':''}</div>
        </div>
      </div>
      <div style="padding:14px">
        <div class="nb-perso">
          <div class="nb-perso-t">⚙️ Personalización</div>
          <div class="nb-perso-actions">
            <button onclick="WorkNB.editDesign('${nb.id}')" title="Cambiar portada/ícono">🎨 Diseño</button>
            <button onclick="WorkNB.rename('${nb.id}')" title="Renombrar">✏️ Nombre</button>
            <button onclick="WorkNB.moveNotebook('${nb.id}')" title="Mover a otro módulo">📦 Mover</button>
            <button onclick="WorkNB.remove('${nb.id}')" class="nb-perso-del" title="Eliminar cuaderno">🗑</button>
          </div>
        </div>

        <div class="nb-drop on" id="nbDrop-${nb.id}">
          <div class="nb-drop-h" onclick="NBShared.toggleCollapse('nbDrop-${nb.id}')">
            <div>📓 Contenido <span class="nb-drop-count">(${pages.length} página${pages.length!==1?'s':''})</span></div>
            <span class="nb-drop-arr">▶</span>
          </div>
          <div class="nb-drop-body">
            <div class="nb-inner-toolbar">
              <button class="btn bp" onclick="WorkNB.newPage('${nb.id}')">+ Nueva página</button>
              ${(window.NBShared && NBShared.pageJumpHtml) ? NBShared.pageJumpHtml({ nbId: nb.id, ns:'WorkNB', pages, activePageId: activePageId }) : ''}
            </div>
            ${editor || '<div style="text-align:center;padding:20px;color:var(--t3);font-size:12px;border:1px dashed var(--bd);border-radius:8px">Crea una página para empezar.</div>'}
            <div class="nb-pages-label">· páginas ·</div>
            <div class="nb-entries">${pagesList}</div>
          </div>
        </div>
      </div>
    </div>`;
  }

  function render(){
    refreshNewFormPreview();
    const list = loadMeta();
    const wrap = document.getElementById('workNbWrap');
    if (!wrap) return;
    if (!list.length){
      wrap.innerHTML = `<div class="cd" style="text-align:center;padding:40px 20px;color:var(--t3);border-style:dashed">
        <div style="font-size:32px;margin-bottom:8px">📓</div>
        <div style="font-size:14px;font-weight:600;color:var(--tx);margin-bottom:4px">Sin cuadernos aún</div>
        <div style="font-size:12px">Crea uno para empezar a documentar tu trabajo en Simetrik.</div>
      </div>`;
      return;
    }
    if (!activeNbId || !list.find(n => n.id === activeNbId)) {
      activeNbId = list[0].id;
      try { localStorage.setItem(ACTIVE_KEY, activeNbId); } catch {}
    }
    const nb = list.find(n => n.id === activeNbId);
    const options = list.map(n => `<option value="${n.id}"${n.id===activeNbId?' selected':''}>${n.icon} ${esc(n.name)}</option>`).join('');
    wrap.innerHTML = `<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap">
        <label style="font-size:11px;color:var(--t3);font-family:'IBM Plex Mono',monospace">CUADERNO →</label>
        <select onchange="WorkNB.selectActive(this.value)" style="flex:1;min-width:200px;background:var(--el);border:1px solid var(--bd);border-radius:7px;color:var(--tx);padding:7px 10px;font-family:inherit;font-size:13px">${options}</select>
      </div>
      ${renderEditor(nb)}`;
    // Attach paste-cleaner + checklist toggle a todos los editores recién renderizados.
    if (window.NBShared && NBShared.attachEditorHandlers) {
      wrap.querySelectorAll('.nb-content[contenteditable="true"]').forEach(el => NBShared.attachEditorHandlers(el));
    }
    // Page selector bar · arrows + auto-scroll a tab activa
    if (window.NBShared && NBShared.wirePageBar) NBShared.wirePageBar(wrap);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
  else setTimeout(render, 0);

  return {
    create, rename, remove, render, selectActive, moveNotebook,
    openDesignPicker, refreshNewFormPreview, editDesign,
    newPage, openPage, deletePage, autoSave,
    fmt, insertLabel, removeLabelEl,
    addLink, removeLink,
    addImage, renameImage, removeImage, viewImage,
    attachFile, removeAttachment,
  };
})();
window.WorkNB = WorkNB;
