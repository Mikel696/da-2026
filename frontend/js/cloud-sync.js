/* ═══════════════════════════════════════════════════════════════
   DA-2026 · Cloud Sync Layer — Offline-First Write-Through
   ─────────────────────────────────────────────────────────────
   Strategy:
     WRITE → localStorage (instant) → Supabase (async, non-blocking)
     READ  → localStorage (immediate render) + Supabase pull (merge)

   Two sync tiers:
     1. DEDICATED tables (vacancies, sys_tasks, class_sessions, user_prefs)
        — record-level merge via _mergeByUpdatedAt
     2. GENERIC app_state table (JSONB payload, one row per key)
        — whole-key last-write-wins for everything else

   localStorage.setItem proxy intercepts writes → auto-pushes to cloud.
   Depends on: window.SB (supabase-client.js), window.AUTH (auth.js)
═══════════════════════════════════════════════════════════════ */

/* ── Cerebro launcher: iframe-mode detection ─────────────────────
   When this page is loaded INSIDE the launcher's iframe (parent =
   index.html with the left rail), hide:
   - The "← Cerebro" back-link (rail handles navigation) — covers all
     href variants: "index.html", "./index.html", "/index.html", "../index.html"
   - The duplicate auth widget (the launcher already shows one)
   - Backup pass: text-based matching for links containing "Cerebro"
     to catch any non-href back-buttons that might exist in modules. */
(function(){
  if (window.self === window.top) return;
  document.documentElement.classList.add('in-cerebro-frame');
  const css = '.in-cerebro-frame #sb-auth-widget{display:none!important}'
            + '.in-cerebro-frame a[href="index.html"],'
            + '.in-cerebro-frame a[href="./index.html"],'
            + '.in-cerebro-frame a[href="/index.html"],'
            + '.in-cerebro-frame a[href$="/index.html"],'
            + '.in-cerebro-frame a[href*="index.html#"],'
            + '.in-cerebro-frame .nav-back,'
            + '.in-cerebro-frame .back-cerebro{display:none!important}';
  const s = document.createElement('style'); s.textContent = css;
  (document.head || document.documentElement).appendChild(s);
  // Belt-and-suspenders: text-based matcher for any leftover "← Cerebro" links
  function hideTextual(){
    const links = document.querySelectorAll('a, button');
    links.forEach(el => {
      const t = (el.textContent || '').trim().toLowerCase();
      if (/^[\s←]*cerebro$/i.test(t) || /←\s*cerebro/i.test(t)) {
        el.style.setProperty('display','none','important');
      }
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hideTextual);
  } else { hideTextual(); }
})();

const CLOUD = (() => {

  /* ══════════════════════════════════════════════════════════════
     TIER 1 — Dedicated tables (existing logic, unchanged)
  ══════════════════════════════════════════════════════════════ */

  const TABLES = {
    vacancies:      'vacancies',
    sys_tasks:      'sys_tasks',
    class_sessions: 'class_sessions',
    user_prefs:     'user_prefs'
  };

  /* ── Field mapping: vacancies camelCase ↔ snake_case ── */
  const _V_TO_DB = {
    salaryInput:  'salary_input',
    focusArea:    'focus_area',
    appliedDate:  'applied_date',
    followUpDate: 'follow_up_date',
    foundDate:    'found_date',
    updatedAt:    'updated_at'
  };
  const _V_TO_JS = Object.fromEntries(Object.entries(_V_TO_DB).map(([k,v])=>[v,k]));

  function _toDb(table, record) {
    if (table !== 'vacancies') return { ...record };
    const out = {};
    for (const [k, v] of Object.entries(record)) {
      out[_V_TO_DB[k] || k] = v;
    }
    if (out.status && !out['column']) out['column'] = out.status;
    return out;
  }

  function _toLocal(table, record) {
    if (table !== 'vacancies') return { ...record };
    const out = {};
    for (const [k, v] of Object.entries(record)) {
      out[_V_TO_JS[k] || k] = v;
    }
    return out;
  }

  /* ── Helpers ── */
  function _uid()   { return window.AUTH?.getUserId() ?? null; }
  function _ready() { return !!(window.SB && _uid()); }

  /* ── Access-token cache ──────────────────────────────────────────
     `SB.auth.session()` es API v1 (síncrona) y NO existe en v2 → daba
     undefined y el flush de cierre de pestaña terminaba mandando el
     anon key como Bearer (RLS lo rechaza → guardado perdido en silencio).
     Cacheamos el access_token con el listener async de v2; autoRefresh
     lo mantiene fresco vía el evento TOKEN_REFRESHED. En `beforeunload`
     leemos esta variable de forma síncrona — sin llamadas async. */
  let _accessToken = null;
  try {
    SB.auth.getSession().then(({ data }) => { _accessToken = data?.session?.access_token ?? null; });
    SB.auth.onAuthStateChange((_e, session) => { _accessToken = session?.access_token ?? null; });
  } catch (e) { console.warn('[CLOUD] token cache init failed:', e); }

  /* ── Queue: enqueue failed pushes for retry ── */
  const _queue = [];
  let _flushing = false;

  function _enqueue(table, record, action) {
    _queue.push({ table, record, action, ts: Date.now() });
    _scheduleFlush();
  }

  function _scheduleFlush() {
    if (_flushing || _queue.length === 0) return;
    setTimeout(_flushQueue, 3000);
  }

  async function _flushQueue() {
    if (!_ready() || _queue.length === 0) { _flushing = false; return; }
    _flushing = true;
    console.log('[CLOUD] Flushing queue:', _queue.length, 'items');
    const batch = _queue.splice(0, _queue.length);
    for (const item of batch) {
      try {
        if (item.action === 'upsert') {
          const dbRecord = _toDb(item.table, item.record);
          const { error } = await SB.from(TABLES[item.table])
            .upsert({ ...dbRecord, user_id: _uid(), updated_at: new Date().toISOString() },
                     { onConflict: 'id,user_id' });
          if (error) { console.error('[CLOUD] flush upsert error:', item.table, error); _queue.push(item); }
        } else if (item.action === 'delete') {
          const { error } = await SB.from(TABLES[item.table]).delete().eq('id', item.record.id).eq('user_id', _uid());
          if (error) console.error('[CLOUD] flush delete error:', item.table, error);
        } else if (item.action === 'state_upsert') {
          // Retry for app_state pushes — al confirmar, SACAR del outbox y alinear TS
          // (sin esto el push se hacía pero el contador quedaba fantasma en "N sin subir")
          await _pushStateRaw(item.record.key, item.record.payload);
          _setLocalTs(item.record.key, Date.now());
          _outboxRemove(item.record.key);
        }
      } catch (e) { console.error('[CLOUD] flush exception:', item.table, e); _queue.push(item); }
    }
    _flushing = false;
    if (_queue.length > 0) _scheduleFlush();
  }

  /* ══════════════════════════════════════════════════════════════
     TIER 1 — Public API (dedicated tables)
  ══════════════════════════════════════════════════════════════ */

  async function push(table, record) {
    if (!_ready()) { console.warn('[CLOUD] push queued (not ready):', table, record.id); _enqueue(table, record, 'upsert'); return { error: 'not_ready' }; }
    try {
      const dbRecord = _toDb(table, record);
      const { error } = await SB.from(TABLES[table])
        .upsert({ ...dbRecord, user_id: _uid(), updated_at: new Date().toISOString() },
                 { onConflict: 'id,user_id' });
      if (error) { console.error('[CLOUD] push error:', table, record.id, error); _enqueue(table, record, 'upsert'); return { error }; }
      console.log('[CLOUD] push OK:', table, record.id);
      return { error: null };
    } catch (e) {
      console.error('[CLOUD] push exception:', table, record.id, e);
      _enqueue(table, record, 'upsert');
      return { error: e.message };
    }
  }

  async function pull(table) {
    if (!_ready()) { console.warn('[CLOUD] pull skipped (not ready):', table); return { data: null, error: 'not_ready' }; }
    try {
      const { data, error } = await SB.from(TABLES[table])
        .select('*')
        .eq('user_id', _uid())
        .order('updated_at', { ascending: false });
      if (error) { console.error('[CLOUD] pull error:', table, error); return { data: null, error }; }
      const mapped = data ? data.map(r => _toLocal(table, r)) : null;
      console.log('[CLOUD] pull OK:', table, mapped?.length ?? 0, 'records');
      return { data: mapped, error: null };
    } catch (e) {
      console.error('[CLOUD] pull exception:', table, e);
      return { data: null, error: e.message };
    }
  }

  async function remove(table, id) {
    if (!_ready()) { console.warn('[CLOUD] remove queued (not ready):', table, id); _enqueue(table, { id }, 'delete'); return; }
    try {
      const { error } = await SB.from(TABLES[table]).delete().eq('id', id).eq('user_id', _uid());
      if (error) { console.error('[CLOUD] remove error:', table, id, error); return; }
      console.log('[CLOUD] remove OK:', table, id);
    } catch (e) {
      console.error('[CLOUD] remove exception:', table, id, e);
      _enqueue(table, { id }, 'delete');
    }
  }

  async function syncDown(table, localKey, mergeStrategy) {
    console.log('[CLOUD] syncDown:', table, mergeStrategy || 'latest_wins');
    const { data, error } = await pull(table);
    if (error || !data) return null;
    if (mergeStrategy === 'cloud_wins') {
      localStorage.setItem(localKey, JSON.stringify(data));
      return data;
    }
    let local = [];
    try { local = JSON.parse(localStorage.getItem(localKey) || '[]'); } catch { /* skip */ }
    const merged = _mergeByUpdatedAt(local, data);
    localStorage.setItem(localKey, JSON.stringify(merged));
    console.log('[CLOUD] syncDown merged:', table, merged.length, 'records');
    return merged;
  }

  async function syncUp(table, localKey) {
    if (!_ready()) return;
    let local = [];
    try { local = JSON.parse(localStorage.getItem(localKey) || '[]'); } catch { return; }
    for (const record of local) {
      await push(table, record);
    }
  }

  async function fullSync(table, localKey) {
    if (!_ready()) { console.warn('[CLOUD] fullSync skipped (not ready):', table); return null; }
    console.log('[CLOUD] fullSync START:', table);
    const { data: cloud, error } = await pull(table);
    if (error) { console.error('[CLOUD] fullSync pull failed:', table, error); return null; }
    let local = [];
    try { local = JSON.parse(localStorage.getItem(localKey) || '[]'); } catch { /* skip */ }
    const merged = _mergeByUpdatedAt(local, cloud || []);
    localStorage.setItem(localKey, JSON.stringify(merged));
    const cloudIds = new Set((cloud || []).map(r => String(r.id)));
    const localOnly = merged.filter(r => !cloudIds.has(String(r.id)));
    console.log('[CLOUD] fullSync:', table, '| local:', local.length, '| cloud:', (cloud||[]).length, '| merged:', merged.length, '| toUpload:', localOnly.length);
    for (const record of localOnly) {
      await push(table, record);
    }
    console.log('[CLOUD] fullSync DONE:', table);
    return merged;
  }

  /* ── Merge helper ── */
  function _safeTs(val) {
    if (!val) return 0;
    const d = new Date(val);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  }

  function _mergeByUpdatedAt(local, cloud) {
    const map = new Map();
    for (const r of local) {
      const rec = { ...r };
      if (!rec.updated_at) {
        const fallback = rec.saved_at || rec.created || rec.ts;
        rec.updated_at = _safeTs(fallback) ? new Date(fallback).toISOString() : new Date().toISOString();
      }
      map.set(String(rec.id), rec);
    }
    for (const r of cloud) {
      const key = String(r.id);
      const existing = map.get(key);
      if (!existing || _safeTs(r.updated_at) >= _safeTs(existing.updated_at)) {
        map.set(key, r);
      }
    }
    return [...map.values()];
  }


  /* ══════════════════════════════════════════════════════════════
     TIER 2 — Generic app_state (JSONB payload, one row per key)
  ══════════════════════════════════════════════════════════════ */

  /* ── Sync Registry: static keys to sync via app_state ── */
  const SYNC_REGISTRY = [
    // Arrays — user-generated data
    'sb_goals', 'sb_habits', 'sb_reviews', 'sb_notes2', 'sb_ratings',
    'eng_notes', 'eng_srs_deck', 'eng_tense_progress', 'eng_imported_lessons', 'eng_error_log', 'eng_daily_session', 'eng_practice_streak',
    'ruta_log5', 'news_saved',
    // Opaque state objects
    'sb_prompts', 'sb_accounting', 'e4', 'ruta5', 'dojo_stats', 'excel_dojo', 'sys_notebook', 'sys_notebook_meta', 'sim_interview_chks', 'plab_h',
    // 13-NOT Cuadernos (metadata only — attachment binaries stay local in IndexedDB)
    'not_nb_meta', 'not_nb_data',
    // 13-NOT · P4 · Mapas mentales por cuaderno (nodos + edges JSONB)
    'not_nb_maps',
    // 14-WORK Simetrik Copilot (cases, errors, learnings, KB, notebooks)
    'work_cases', 'work_errors', 'work_learnings', 'work_kb',
    'work_nb_meta', 'work_nb_data',
    // 14-WORK Workspace de Implementación (casos multi-cliente · 3 pilares · PRIVADO via RLS)
    'work_impl',
    // 14-WORK Ecosistema (Workflow doc, Mini-curso, Diccionario)
    'work_eco_workflow', 'work_eco_course', 'work_eco_dict',
    // 14-WORK KB attachment metadata (blobs viven en IDB local)
    'work_kb_atts',
    // 14-WORK MOIF · Monitoreo y Observabilidad Integraciones Ficohsa (reuniones)
    'work_moif_meetings',
    // 14-WORK · Prueba DOTA · checklist de 16 puntos del Documento Guia
    'work_dota_progress',
    // 15-MM Mind Map Studio (maps array; each holds jsMind node_tree data)
    'tools_mindmaps',
    // 15-MM Free Canvas (Miro-style: nodes + edges + view state per canvas)
    'tools_canvases',
    // 16-APA Document Studio (APA-formatted academic + personal docs)
    'tools_apa_docs', 'apa_defaults',
    // Config / prefs (small scalars)
    'jt_profile', 'jt_form_expanded',
    'sb_name', 'sb_streak', 'sb_start', 'sb_last', 'sb_hours', 'sb_pomo_total',
    // ─── Sync Audit fixes · 2026-05-15b ───
    // 1-IND Mission Control · tareas y workshop history
    'sb_tasks', 'sb_ws_hist',
    // 5-JOB Job Tracker · master key del módulo (vacancies/jobs array)
    'jt8',
    // 10-SYS Systems Engineering · cuaderno custom activo seleccionado
    'sys_active_custom',
    // 10-SYS Subject CRUD · materias custom (overrides + nuevas) + lista de ocultas
    // Los binarios de adjuntos (sys_subj_files_*) viven solo local — no sync.
    'sys_subjects_custom', 'sys_subjects_hidden', 'sys_subjects_collapsed',
    // 4-RUT Ruta Data Analyst · timestamp de inicio del journey
    'ruta_st',
    // ─── Bug Hunt fix · 2026-05-15j (Fase 3) ───
    // 5-JOB · timestamp de inicio del tracker (para conteo de días cross-device)
    'jt_s8',
    // ─── 2-APP Second Brain · 2026-05-15 (2-APP.P3) ───
    // Historial de análisis de vacantes (snapshots + outcomes para el Coach)
    'app_analyses'
  ];

  /* ── Dynamic key prefixes discovered at runtime ── */
  const DYNAMIC_PREFIXES = ['fin_', 'sb_pomo_'];

  /* ── Keys explicitly excluded from sync ── */
  const SKIP_KEYS = new Set([
    'news_cache',
    // Dedicated-table keys handled by Tier 1:
    'da_vacancies', 'sys_tasks', 'sys_class_sessions'
  ]);

  const _registrySet = new Set(SYNC_REGISTRY);

  /** Check if a localStorage key should sync via app_state */
  function _shouldSync(key) {
    if (SKIP_KEYS.has(key)) return false;
    if (_registrySet.has(key)) return true;
    for (const p of DYNAMIC_PREFIXES) {
      if (key.startsWith(p)) return true;
    }
    return false;
  }

  /** Safely parse a localStorage string value into JSONB-safe data */
  function _safeParse(value) {
    if (value === null || value === undefined) return null;
    try { return JSON.parse(value); } catch { return value; }
  }

  /* ── app_state CRUD ── */

  /** Push a single key's payload to app_state (fire-and-forget) */
  async function _pushStateRaw(storeKey, payload) {
    const { error } = await SB.from('app_state')
      .upsert({
        user_id:    _uid(),
        store_key:  storeKey,
        payload:    payload,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,store_key' });
    if (error) throw error;
  }

  async function pushState(storeKey, payload) {
    if (!_ready()) {
      _outboxAdd(storeKey);
      _queue.push({ table: 'app_state', record: { key: storeKey, payload }, action: 'state_upsert', ts: Date.now() });
      _scheduleFlush();
      return;
    }
    try {
      await _pushStateRaw(storeKey, payload);
      console.log('[CLOUD] pushState OK:', storeKey);
      _outboxRemove(storeKey);
    } catch (e) {
      console.error('[CLOUD] pushState error:', storeKey, e);
      // Sesión vencida → auto-refresh (patrón family-system) y un reintento
      const msg = String(e && (e.message || e));
      if (/jwt|expired|401|invalid.*token|not.*auth/i.test(msg)) {
        try {
          await SB.auth.refreshSession();
          await _pushStateRaw(storeKey, payload);
          console.log('[CLOUD] pushState OK tras refresh de sesión:', storeKey);
          _outboxRemove(storeKey);
          return;
        } catch (e2) {
          console.warn('[CLOUD] sesión irrecuperable — cambios quedan en outbox');
          window.dispatchEvent(new CustomEvent('cloud:session_expired'));
        }
      }
      _outboxAdd(storeKey);
      _queue.push({ table: 'app_state', record: { key: storeKey, payload }, action: 'state_upsert', ts: Date.now() });
      _scheduleFlush();
    }
  }

  /** Pull ALL app_state rows for the current user in one query */
  async function _pullAllStates() {
    if (!_ready()) return null;
    try {
      const { data, error } = await SB.from('app_state')
        .select('store_key, payload, updated_at')
        .eq('user_id', _uid());
      if (error) { console.error('[CLOUD] pullAllStates error:', error); return null; }
      // Convert to Map<storeKey, {payload, updated_at}>
      const map = new Map();
      for (const row of (data || [])) {
        map.set(row.store_key, { payload: row.payload, updated_at: row.updated_at });
      }
      console.log('[CLOUD] pullAllStates OK:', map.size, 'keys');
      return map;
    } catch (e) {
      console.error('[CLOUD] pullAllStates exception:', e);
      return null;
    }
  }


  /* ══════════════════════════════════════════════════════════════
     fullSyncAll — Master orchestrator (called on sign-in)
  ══════════════════════════════════════════════════════════════ */

  let _syncing = false;
  let _initialSyncDone = false;

  async function fullSyncAll() {
    if (!_ready()) { console.warn('[CLOUD] fullSyncAll skipped (not ready)'); return; }
    if (_syncing) { console.warn('[CLOUD] fullSyncAll already in progress'); return; }
    _syncing = true;
    const t0 = performance.now();
    console.log('[CLOUD] ══ fullSyncAll START ══');

    try {
      // ── Step 1: Dedicated tables (existing logic) ──
      await fullSync('vacancies', 'da_vacancies');
      await fullSync('sys_tasks', 'sys_tasks');

      // ── Step 2: Pull all app_state rows in one query ──
      const cloudMap = await _pullAllStates();
      if (!cloudMap) { console.warn('[CLOUD] fullSyncAll: pullAllStates failed, skipping JSONB sync'); return; }

      // ── Step 3: Reconcile static registry keys ──
      for (const key of SYNC_REGISTRY) {
        await _reconcileKey(key, cloudMap);
      }

      // ── Step 4: Discover and reconcile dynamic keys ──
      // 4a. Local dynamic keys → push if not in cloud
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (_registrySet.has(key)) continue; // already handled above
        if (!_shouldSync(key)) continue;
        await _reconcileKey(key, cloudMap);
        cloudMap.delete(key); // mark as handled
      }
      // 4b. Cloud dynamic keys not in localStorage → pull down
      for (const [key, cloud] of cloudMap.entries()) {
        if (_registrySet.has(key)) continue; // already handled
        if (SKIP_KEYS.has(key)) continue;
        // This is a cloud-only dynamic key — write to localStorage
        const matchesDynamic = DYNAMIC_PREFIXES.some(p => key.startsWith(p));
        if (matchesDynamic) {
          console.log('[CLOUD] fullSyncAll: cloud→local (new device):', key);
          _origSetItem(key, JSON.stringify(cloud.payload));
        }
      }

      // ── Step 5: Flush any queued items ──
      if (_queue.length > 0) _scheduleFlush();

      _initialSyncDone = true;
      console.log('[CLOUD] ══ fullSyncAll DONE ══ (' + Math.round(performance.now() - t0) + 'ms)');

      // ── Step 6: Notify modules to re-render ──
      window.dispatchEvent(new CustomEvent('cloud:sync_complete'));

    } catch (e) {
      console.error('[CLOUD] fullSyncAll exception:', e);
    } finally {
      _syncing = false;
    }
  }

  /* ── STRUCTURAL MERGE para cuadernos (nested data) ─────────────
   * Los cuadernos son objetos anidados {nbId:{pages:[...]}}: el LWW
   * por key completa pierde páginas cuando dos devices divergen.
   * Acá se mergea por página (gana p.updated más reciente; lo que
   * existe en un solo lado se conserva). Empate → gana cloud.      */
  const NB_DATA_KEYS = new Set(['work_nb_data', 'not_nb_data', 'sys_notebook']);
  const NB_META_KEYS = new Set(['work_nb_meta', 'not_nb_meta', 'sys_notebook_meta']);

  function _mergeNbData(local, cloud) {
    const out = {};
    const ids = new Set([...Object.keys(local || {}), ...Object.keys(cloud || {})]);
    ids.forEach(id => {
      const l = (local || {})[id], c = (cloud || {})[id];
      if (!l) { out[id] = c; return; }
      if (!c) { out[id] = l; return; }
      const byPage = {};
      [...(c.pages || []), ...(l.pages || [])].forEach(p => {
        if (!p || p.id == null) return;
        const prev = byPage[p.id];
        if (!prev || String(p.updated || '') > String(prev.updated || '')) byPage[p.id] = p;
      });
      out[id] = { ...c, ...l, pages: Object.values(byPage).sort((a, b) => String(a.created || '').localeCompare(String(b.created || ''))) };
    });
    return out;
  }
  function _mergeNbMeta(local, cloud) {
    const by = {}; const ts = x => String((x && (x.updated || x.created)) || '');
    [...(cloud || []), ...(local || [])].forEach(m => {
      if (!m || m.id == null) return;
      const p = by[m.id];
      if (!p || ts(m) > ts(p)) by[m.id] = m;
    });
    return Object.values(by);
  }
  /** Devuelve el merge estructural si la key es de cuadernos; null si no aplica. */
  function _structuralMerge(key, localVal, cloudVal) {
    try {
      if (NB_DATA_KEYS.has(key)) return _mergeNbData(localVal, cloudVal);
      if (NB_META_KEYS.has(key)) return _mergeNbMeta(localVal, cloudVal);
    } catch (e) { console.warn('[CLOUD] structuralMerge failed for', key, e); }
    return null;
  }

  /** Escritura local con QUOTA-GUARD: una key que no entra NO aborta toda la sync.
   *  Devuelve true si escribió. Emite cloud:quota_exceeded para que la UI avise. */
  function _safeWrite(key, str) {
    try { _origSetItem(key, str); return true; }
    catch (e) {
      console.error('[CLOUD] ✗ QUOTA al escribir', key, '(' + Math.round(str.length/1024) + 'KB) — sync continúa con las demás keys');
      window.dispatchEvent(new CustomEvent('cloud:quota_exceeded', { detail: { key, kb: Math.round(str.length/1024) } }));
      return false;
    }
  }

  /**
   * Reconcile a single localStorage key against the cloud map.
   * First-sync safe: local data uploads if cloud is empty.
   */
  async function _reconcileKey(key, cloudMap, opts) {
    const localRaw = localStorage.getItem(key);
    const cloud    = cloudMap.get(key) || null;
    const force    = opts && opts.forceCloudWin;

    const localExists = localRaw !== null && localRaw !== '' && localRaw !== 'undefined';
    const cloudExists = cloud !== null;

    if (cloudExists && localExists) {
      // Cuadernos → merge estructural por página (nunca pisa un lado entero)
      const sm = _structuralMerge(key, _safeParse(localRaw), cloud.payload);
      if (sm !== null) {
        const mergedStr = JSON.stringify(sm);
        if (mergedStr !== localRaw) _safeWrite(key, mergedStr);
        if (mergedStr !== JSON.stringify(cloud.payload)) {
          console.log('[CLOUD] reconcile MERGE→both:', key);
          await pushState(key, sm);
          _setLocalTs(key, Date.now());
        } else {
          // Local y nube YA equivalentes → alinear el TS local con el de la nube.
          // (Sellar Date.now() acá envenenaba el merge: el local quedaba "siempre
          //  más nuevo" y la key reaparecía como "cambio sin subir" en cada carga.)
          console.log('[CLOUD] reconcile MERGE (cloud ya completo):', key);
          _setLocalTs(key, new Date(cloud.updated_at || 0).getTime());
        }
        return;
      }
      // Resto — compare timestamps (LWW por key)
      const localTs = _getLocalTs(key);
      const cloudTs = new Date(cloud.updated_at || 0).getTime();

      if (force || cloudTs > localTs) {
        // Cloud wins → overwrite local
        console.log('[CLOUD] reconcile cloud→local:', key, force?'(forced)':'');
        if (_safeWrite(key, JSON.stringify(cloud.payload))) _setLocalTs(key, cloudTs || Date.now());
      } else {
        // "Local más nuevo" por TIMESTAMP — pero SOLO subir si el CONTENIDO realmente
        // difiere. Si es idéntico al cloud (lo normal una vez sincronizado), NO re-subir:
        // solo alinear el TS. Comparar normalizado (parse+stringify de ambos lados) evita
        // falsos positivos por orden de claves. Esto mata el cascade de re-push en CADA
        // carga/poll que generaba el fantasma de "N cambios sin subir".
        const localNorm = JSON.stringify(_safeParse(localRaw));
        const cloudNorm = JSON.stringify(cloud.payload);
        if (localNorm === cloudNorm) {
          _setLocalTs(key, cloudTs);                 // ya sincronizado → solo alinear, sin red
        } else {
          console.log('[CLOUD] reconcile local→cloud:', key);
          await pushState(key, _safeParse(localRaw));
          _setLocalTs(key, Date.now());
        }
      }
    } else if (cloudExists && !localExists) {
      console.log('[CLOUD] reconcile cloud→local (new):', key);
      if (_safeWrite(key, JSON.stringify(cloud.payload))) _setLocalTs(key, new Date(cloud.updated_at || 0).getTime());
    } else if (!cloudExists && localExists) {
      console.log('[CLOUD] reconcile local→cloud (first):', key);
      await pushState(key, _safeParse(localRaw));
      _setLocalTs(key, Date.now());
    }
  }

  /** Force pull cloud → local for ALL syncable keys, ignoring timestamps.
   *  Resuelve casos donde local TS quedó stuck por encima del cloud. */
  /** Devuelve un objeto con info diagnóstica del estado actual. */
  function diagnostics() {
    const out = {
      sb_loaded: !!window.SB,
      auth_loaded: !!window.AUTH,
      uid: null,
      session: null,
      syncing: _syncing,
      initial_sync_done: _initialSyncDone,
      last_sync_age_s: _lastSyncTs ? Math.round((Date.now()-_lastSyncTs)/1000) : null,
      queue_size: _queue.length,
    };
    try { out.uid = window.AUTH?.getUserId() ?? null; } catch {}
    return out;
  }

  /** Espera (polling) a que la sync en curso termine. Hasta `timeoutMs` ms. */
  async function _waitForSyncIdle(timeoutMs){
    const start = Date.now();
    while (_syncing && (Date.now() - start) < timeoutMs) {
      await new Promise(r => setTimeout(r, 200));
    }
    return !_syncing;
  }

  async function forceResyncFromCloud() {
    if (!window.SB)        return { ok:false, reason:'sb-not-loaded', detail:'window.SB is not initialized. supabase-client.js no cargó.' };
    if (!window.AUTH)      return { ok:false, reason:'auth-not-loaded', detail:'window.AUTH is not initialized. auth.js no cargó.' };
    const uid = window.AUTH.getUserId();
    if (!uid)              return { ok:false, reason:'not-authenticated', detail:'No hay sesión activa. Iniciá sesión primero (botón en la nav superior).' };
    // Si hay otra sync corriendo, esperá a que termine (hasta 20s) en vez de bailar out
    if (_syncing) {
      console.log('[CLOUD] forceResync: aguardando que termine la sync en curso…');
      const ok = await _waitForSyncIdle(20000);
      if (!ok) return { ok:false, reason:'syncing-timeout', detail:'La sincronización anterior tardó más de 20 segundos. Refresca la página y reintentá.' };
    }
    _syncing = true;
    console.log('[CLOUD] ══ forceResyncFromCloud START · uid=', uid);
    try {
      const cloudMap = await _pullAllStates();
      if (!cloudMap) return { ok:false, reason:'pull-failed', detail:'No se pudo descargar de app_state. Probable causa: RLS de la tabla app_state no configurada o tabla no existe. Verificá en Supabase dashboard → Database → Tables → app_state.' };
      let applied = 0;
      const keys = [];
      for (const [key, cloud] of cloudMap.entries()) {
        if (SKIP_KEYS.has(key)) continue;
        const isSyncable = _registrySet.has(key) || DYNAMIC_PREFIXES.some(p => key.startsWith(p));
        if (!isSyncable) continue;
        // Cuadernos: ni siquiera el force pisa páginas locales — merge estructural
        const smF = _structuralMerge(key, _safeParse(localStorage.getItem(key)), cloud.payload);
        if (_safeWrite(key, JSON.stringify(smF !== null ? smF : cloud.payload))) _setLocalTs(key, new Date(cloud.updated_at || 0).getTime());
        keys.push(key);
        applied++;
      }
      console.log('[CLOUD] forceResync DONE · applied:', applied, 'keys', keys);
      window.dispatchEvent(new CustomEvent('cloud:force_resynced', { detail: { count: applied } }));
      return { ok:true, count: applied, keys };
    } catch (e) {
      console.error('[CLOUD] forceResync exception:', e);
      return { ok:false, reason:'exception', detail: e.message || String(e) };
    } finally {
      _syncing = false;
    }
  }

  async function forcePushKey(key) {
    if (!_ready()) return { ok:false, reason:'not-ready' };
    const raw = localStorage.getItem(key);
    if (raw === null) return { ok:false, reason:'no-local-data' };
    try {
      await _pushStateRaw(key, _safeParse(raw));
      _setLocalTs(key, Date.now());
      console.log('[CLOUD] forcePush OK:', key);
      return { ok:true };
    } catch (e) {
      console.error('[CLOUD] forcePush error:', key, e);
      return { ok:false, reason:'exception', detail: e.message || String(e) };
    }
  }

  async function forcePushAll() {
    if (!window.SB)        return { ok:false, reason:'sb-not-loaded', detail:'window.SB is not initialized.' };
    if (!window.AUTH)      return { ok:false, reason:'auth-not-loaded', detail:'window.AUTH is not initialized.' };
    const uid = window.AUTH.getUserId();
    if (!uid)              return { ok:false, reason:'not-authenticated', detail:'No hay sesión activa. Iniciá sesión primero.' };
    if (_syncing) {
      const ok = await _waitForSyncIdle(20000);
      if (!ok) return { ok:false, reason:'syncing-timeout', detail:'La sincronización anterior tardó más de 20 segundos. Refresca la página y reintentá.' };
    }
    let pushed = 0, failed = 0;
    const errors = [];
    for (const key of SYNC_REGISTRY) {
      const raw = localStorage.getItem(key);
      if (raw === null) continue;
      try {
        await _pushStateRaw(key, _safeParse(raw));
        _setLocalTs(key, Date.now());
        pushed++;
      } catch (e) {
        failed++;
        errors.push(key + ': ' + (e.message||e));
      }
    }
    console.log('[CLOUD] forcePushAll done · pushed:', pushed, 'failed:', failed);
    return { ok:true, pushed, failed, errors };
  }

  /* ── Per-key timestamp tracking (stored in one localStorage key) ── */
  const _TS_META_KEY = '_cloud_ts';

  function _getTsMeta() {
    try { return JSON.parse(localStorage.getItem(_TS_META_KEY) || '{}'); } catch { return {}; }
  }
  function _getLocalTs(key) {
    return _getTsMeta()[key] || 0;
  }
  function _setLocalTs(key, ts) {
    const meta = _getTsMeta();
    meta[key] = ts;
    _origSetItem(_TS_META_KEY, JSON.stringify(meta));
  }


  /* ══════════════════════════════════════════════════════════════
     localStorage.setItem Proxy — Automatic write-through
     + OUTBOX persistente (patrón family-system): todo cambio real
       queda en cola en disco hasta confirmar push — sobrevive
       logout, refresh y crash. Nada se queda sin subir.
  ══════════════════════════════════════════════════════════════ */

  const _origSetItem = localStorage.setItem.bind(localStorage);

  const _OUTBOX_KEY = 'cloud_outbox';
  function _outboxGet(){ try { return JSON.parse(localStorage.getItem(_OUTBOX_KEY)||'[]'); } catch { return []; } }
  function _outboxSet(a){ _origSetItem(_OUTBOX_KEY, JSON.stringify(a)); window.dispatchEvent(new CustomEvent('cloud:outbox_change',{detail:{count:a.length}})); }
  function _outboxAdd(key){ const a=_outboxGet(); if(a.indexOf(key)===-1){ a.push(key); _outboxSet(a); } }
  function _outboxRemove(key){ const a=_outboxGet(); const i=a.indexOf(key); if(i>=0){ a.splice(i,1); _outboxSet(a); } }
  async function _flushOutbox(){
    if (!_ready()) return;
    const keys=_outboxGet(); if(!keys.length) return;
    console.log('[CLOUD] outbox flush:', keys.length, 'keys', keys);
    for(const key of keys.slice()){
      const raw=localStorage.getItem(key);
      if(raw===null){ _outboxRemove(key); continue; }
      try { await _pushStateRaw(key, _safeParse(raw)); _setLocalTs(key, Date.now()); _outboxRemove(key); }
      catch(e){ console.warn('[CLOUD] outbox push failed', key, e); }
    }
  }

  // Debounce map: key → timeoutId (avoid flooding Supabase on rapid writes)
  const _debounceMap = new Map();
  const _DEBOUNCE_MS = 1500;

  localStorage.setItem = function(key, value) {
    const prev = localStorage.getItem(key);
    // Always write to actual localStorage immediately
    _origSetItem(key, value);

    // Skip non-syncable keys and our own metadata key
    if (key === _TS_META_KEY || key === _OUTBOX_KEY) return;
    if (!_shouldSync(key)) return;

    // No-op write (mismo contenido) → no stamp, no push. Mata el timestamp
    // poisoning de los re-saves de arranque en TODOS los módulos.
    if (prev === value) return;

    // Cambio REAL → a la outbox persistente SIEMPRE (aún deslogueado/hidratando)
    _outboxAdd(key);

    // Durante hidratación inicial no stampeamos TS (el motor está escribiendo)
    if (_syncing || !_initialSyncDone) return;

    // Update local timestamp
    _setLocalTs(key, Date.now());

    // Debounced push to cloud
    if (_debounceMap.has(key)) clearTimeout(_debounceMap.get(key));
    _debounceMap.set(key, setTimeout(() => {
      _debounceMap.delete(key);
      pushState(key, _safeParse(value));
    }, _DEBOUNCE_MS));
  };

  /** Flush ALL pending debounced pushes immediately. */
  async function _flushPendingPushes(){
    if (_debounceMap.size === 0) return;
    const keys = Array.from(_debounceMap.keys());
    console.log('[CLOUD] flushPending · keys:', keys);
    for (const key of keys) {
      clearTimeout(_debounceMap.get(key));
      _debounceMap.delete(key);
      const raw = localStorage.getItem(key);
      if (raw === null) continue;
      try { await _pushStateRaw(key, _safeParse(raw)); }
      catch(e) { console.warn('[CLOUD] flushPending failed for', key, e); }
    }
  }

  /** Sync flush on tab close / hide using sendBeacon as last-resort. */
  function _flushPendingSync(){
    if (_debounceMap.size === 0) return;
    if (!_ready()) return;
    const uid = _uid();
    const keys = Array.from(_debounceMap.keys());
    keys.forEach(key => {
      clearTimeout(_debounceMap.get(key));
      _debounceMap.delete(key);
      const raw = localStorage.getItem(key);
      if (raw === null) return;
      // navigator.sendBeacon: fire-and-forget, survives page unload
      try {
        const body = JSON.stringify({
          user_id: uid,
          store_key: key,
          payload: _safeParse(raw),
          updated_at: new Date().toISOString(),
        });
        const url = SB.supabaseUrl + '/rest/v1/app_state?on_conflict=user_id,store_key';
        const blob = new Blob([body], { type: 'application/json' });
        // sendBeacon doesn't allow setting headers, so we fallback to fetch keepalive
        fetch(url, {
          method: 'POST',
          headers: {
            'apikey': SB.supabaseKey,
            'Authorization': 'Bearer ' + (_accessToken || SB.supabaseKey),
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates,return=minimal',
          },
          body,
          keepalive: true,
        }).catch(()=>{});
      } catch(e) { /* ignore */ }
    });
    console.log('[CLOUD] flushPending sync (beforeunload) · keys:', keys);
  }

  window.addEventListener('beforeunload', _flushPendingSync);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { _flushPendingPushes(); }
  });

  /** Push immediately bypassing debounce. Called for critical writes like deletes.
   *  Si falla, dispara un evento cloud:push_failed para que la UI pueda mostrar warning. */
  async function pushNow(key){
    if (_debounceMap.has(key)) { clearTimeout(_debounceMap.get(key)); _debounceMap.delete(key); }
    if (!_ready()) {
      window.dispatchEvent(new CustomEvent('cloud:push_failed', { detail: { key, reason: 'not-ready' } }));
      return { ok:false, reason:'not-ready' };
    }
    const raw = localStorage.getItem(key);
    if (raw === null) return { ok:false, reason:'no-local-data' };
    try {
      await _pushStateRaw(key, _safeParse(raw));
      _setLocalTs(key, Date.now());
      console.log('[CLOUD] pushNow OK:', key);
      return { ok:true };
    } catch (e) {
      console.error('[CLOUD] pushNow FAILED:', key, e);
      // Enqueue for retry
      _queue.push({ table: 'app_state', record: { key, payload: _safeParse(raw) }, action: 'state_upsert', ts: Date.now() });
      _scheduleFlush();
      window.dispatchEvent(new CustomEvent('cloud:push_failed', { detail: { key, reason:'exception', detail: e.message||String(e), error: e } }));
      return { ok:false, reason:'exception', detail: e.message||String(e) };
    }
  }


  /* ══════════════════════════════════════════════════════════════
     Event listeners
  ══════════════════════════════════════════════════════════════ */

  window.addEventListener('sb:signed_in', () => {
    console.log('[CLOUD] sb:signed_in received — starting fullSyncAll + realtime');
    setTimeout(() => { fullSyncAll().then(()=>_flushOutbox()).catch(()=>{}); setupRealtime(); }, 300);
  });

  /* ═══════════════════════════════════════════════════════════════
     REALTIME — auto-pull cuando otro device cambia un key
  ═══════════════════════════════════════════════════════════════ */
  let _rtChannel = null;
  function setupRealtime(){
    if (!_ready()) return;
    if (_rtChannel) return; // ya suscrito
    const uid = _uid();
    if (!uid) return;
    try {
      _rtChannel = SB.channel('app_state_changes_' + uid)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'app_state',
          filter: 'user_id=eq.' + uid,
        }, (payload) => {
          handleRealtimeChange(payload);
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('[CLOUD] realtime ✓ suscrito a app_state · uid=', uid);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            console.warn('[CLOUD] realtime status:', status, '— probable: realtime no habilitado en la tabla app_state. Setup: ALTER PUBLICATION supabase_realtime ADD TABLE app_state;');
            _rtChannel = null;
          }
        });
    } catch (e) {
      console.warn('[CLOUD] realtime setup exception:', e);
    }
  }
  function handleRealtimeChange(payload){
    const evType = payload.eventType; // INSERT | UPDATE | DELETE
    const row = payload.new || payload.old || {};
    const key = row.store_key;
    if (!key) return;
    console.log('[CLOUD] realtime ←', evType, key);
    if (evType === 'DELETE') {
      // Remove local key too
      if (localStorage.getItem(key) !== null) {
        _origSetItem(key, JSON.stringify(null));
      }
      window.dispatchEvent(new CustomEvent('cloud:realtime_change', { detail: { key, type: 'delete' } }));
      return;
    }
    // INSERT or UPDATE → write new payload to local, stamp TS
    const payloadVal = row.payload;
    const cloudTs = new Date(row.updated_at || 0).getTime();
    // Cuadernos → merge estructural: lo remoto entra SIEMPRE, sin pisar páginas locales
    const _prevLocalRt = localStorage.getItem(key);
    const smRt = _structuralMerge(key, _safeParse(_prevLocalRt), payloadVal);
    if (smRt !== null) {
      const mergedStr = JSON.stringify(smRt);
      // Eco de mi propio cambio (o nada nuevo) → NO reescribir ni re-renderizar (mata el loop "cambió desde otro PC")
      if (mergedStr === _prevLocalRt) return;
      if (_safeWrite(key, mergedStr)) _setLocalTs(key, cloudTs);
      // Si el merge aporta algo que la nube no tiene, subirlo (converge y corta el loop: payload idéntico → no difiere más)
      if (mergedStr !== JSON.stringify(payloadVal)) { pushNow(key).catch(()=>{}); }
      window.dispatchEvent(new CustomEvent('cloud:realtime_change', { detail: { key, type: evType.toLowerCase() } }));
      return;
    }
    // Only overwrite if cloud TS is newer than local TS (avoid clobbering local writes that haven't pushed yet)
    const localTs = _getLocalTs(key);
    if (cloudTs <= localTs) {
      console.log('[CLOUD] realtime: local newer for', key, '— ignoring cloud event');
      return;
    }
    // Sin cambio real (eco del propio push) → no re-render
    const _newStrRt = JSON.stringify(payloadVal);
    if (_newStrRt === _prevLocalRt) return;
    if (_safeWrite(key, _newStrRt)) _setLocalTs(key, cloudTs);
    window.dispatchEvent(new CustomEvent('cloud:realtime_change', { detail: { key, type: evType.toLowerCase() } }));
  }
  function teardownRealtime(){
    if (_rtChannel) { try { SB.removeChannel(_rtChannel); } catch{} _rtChannel = null; }
  }

  /* ── Polling de respaldo LIVIANO (resiliencia si realtime falla) ──
     CLAVE de rendimiento: NO baja los payloads cada vez (work_nb_data
     puede pesar MBs). El tick solo trae `store_key + updated_at` (bytes)
     y compara contra el TS local. Solo descarga el payload COMPLETO de
     las keys cuya nube es más nueva (cambio real). Si no cambió nada →
     cero descarga de contenido. Realtime sigue siendo la vía instantánea;
     esto es el respaldo. Solo con pestaña visible y sin sync en curso. ── */
  /** Pull LIVIANO: trae solo timestamps, baja payload SOLO de lo que cambió.
   *  Reusado por el poll de respaldo y por el resync al volver a la pestaña. */
  async function _lightPull() {
    if (!_ready()) return;
    try {
      // 1) Solo timestamps (bytes) — NO baja los MB de los cuadernos
      const { data: heads, error } = await SB.from('app_state')
        .select('store_key, updated_at')
        .eq('user_id', _uid());
      if (error || !heads) return;
      // 2) Keys sincronizables cuya nube es MÁS NUEVA que el local
      const stale = [];
      for (const row of heads) {
        const key = row.store_key;
        if (SKIP_KEYS.has(key)) continue;
        if (!(_registrySet.has(key) || DYNAMIC_PREFIXES.some(p => key.startsWith(p)))) continue;
        if (new Date(row.updated_at || 0).getTime() > _getLocalTs(key)) stale.push(key);
      }
      if (!stale.length) return;   // nada nuevo → cero descarga de payloads
      // 3) Bajar el payload SOLO de las que cambiaron y reconciliar
      const { data: full, error: e2 } = await SB.from('app_state')
        .select('store_key, payload, updated_at')
        .eq('user_id', _uid())
        .in('store_key', stale);
      if (e2 || !full) return;
      const map = new Map(full.map(r => [r.store_key, { payload: r.payload, updated_at: r.updated_at }]));
      for (const key of stale) { if (map.has(key)) await _reconcileKey(key, map); }
    } catch (e) { /* silencioso — reintenta en el próximo tick */ }
  }
  setInterval(() => {
    if (document.hidden || _syncing || !_ready() || !_initialSyncDone) return;
    _lightPull();
  }, 45000);

  /* ── Auto-recuperación del outbox (sin botón) ──────────────────────
     Si quedó algo sin subir (push transitorio fallido), se reintenta
     solo cada 20s. _flushOutbox quita del outbox al confirmar. Así el
     contador "N sin subir" nunca se queda pegado esperando un reload. */
  setInterval(() => {
    if (document.hidden || _syncing || !_ready() || !_initialSyncDone) return;
    if (_outboxGet().length) _flushOutbox().catch(()=>{});
  }, 20000);

  window.addEventListener('sb:signed_out', () => {
    console.log('[CLOUD] sb:signed_out — clearing queue + teardown realtime');
    _queue.length = 0;
    _syncing = false;
    teardownRealtime();
  });

  /* ── Auto-resync on tab visibility change ──
     Cuando volvés a la pestaña después de N segundos, si la última sync
     fue hace > 30 segundos, dispará una resync silenciosa para traer
     cambios hechos en otro device.
  */
  let _lastSyncTs = 0;
  window.addEventListener('cloud:sync_complete', () => { _lastSyncTs = Date.now(); });
  window.addEventListener('cloud:force_resynced', () => { _lastSyncTs = Date.now(); });
  document.addEventListener('visibilitychange', async () => {
    if (document.hidden) return;
    if (!_ready() || _syncing) return;
    const age = Date.now() - _lastSyncTs;
    if (age < 30000) return; // less than 30s, skip
    console.log('[CLOUD] tab focused after', Math.round(age/1000), 's — light pull');
    // LIVIANO: solo trae lo que cambió en la nube (no re-descarga los MB de cuadernos
    // en cada cambio de pestaña). Los cambios locales pendientes los sube el outbox-retry.
    await _lightPull();
    _lastSyncTs = Date.now();
    window.dispatchEvent(new CustomEvent('cloud:auto_resynced'));
  });


  /* ══════════════════════════════════════════════════════════════
     Public API
  ══════════════════════════════════════════════════════════════ */

  return {
    // Tier 1 — dedicated tables
    push, pull, remove, syncDown, syncUp, fullSync, TABLES,
    // Tier 2 — app_state (JSONB)
    pushState, fullSyncAll,
    // Manual recovery
    forceResyncFromCloud, forcePushKey, forcePushAll, diagnostics,
    // Immediate push / realtime
    pushNow, setupRealtime, teardownRealtime,
    // Outbox persistente (cambios pendientes de subir)
    flushOutbox: _flushOutbox, outboxCount: () => _outboxGet().length,
    // Utilities
    SYNC_REGISTRY, DYNAMIC_PREFIXES
  };
})();

window.CLOUD = CLOUD;

/* ═══════════════════════════════════════════════════════════════
   IFRAME BACK-NAV INTERCEPTOR
   ─────────────────────────────────────────────────────────────
   Cuando un módulo se carga dentro del iframe stage de index.html,
   los links "← Cerebro" (href="index.html") harían que el iframe
   navegue a index.html, generando recursión visual (index dentro
   de index). Este interceptor detecta el contexto iframe y, en
   lugar de navegar, le pide al Cerebro padre que cierre el stage
   con go('home'). Preserva ctrl/cmd-click para abrir en nueva tab.
   También se aplica para evitar el bug reverso del rail lateral.
═══════════════════════════════════════════════════════════════ */
(function initBackNav(){
  // Solo activa cuando el módulo vive dentro de un iframe (parent != self)
  if (window === window.top) return;
  function handler(e){
    if (e.defaultPrevented) return;
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return;
    const link = e.target.closest('a[href]');
    if (!link) return;
    if (link.target === '_blank') return;
    const href = link.getAttribute('href');
    const clean = href.split('#')[0].split('?')[0];
    if (clean !== 'index.html' && clean !== '/' && clean !== './') return;
    // Si el padre tiene Cerebro, usamos su router (mantiene URL hash y estado)
    try {
      if (window.parent && window.parent.Cerebro && typeof window.parent.Cerebro.go === 'function') {
        e.preventDefault();
        window.parent.Cerebro.go('home');
        return;
      }
    } catch (err) { /* cross-origin u otra cosa: caer a navegación top */ }
    // Fallback: navega el top window (cierra el iframe natural)
    e.preventDefault();
    try { window.top.location.href = href; } catch (err) { window.location.href = href; }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => document.addEventListener('click', handler));
  } else {
    document.addEventListener('click', handler);
  }
})();
