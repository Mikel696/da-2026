/* ═══════════════════════════════════════════════════════════════
   DA-2026 · Cloud Sync Layer — Offline-First Write-Through
   ─────────────────────────────────────────────────────────────
   Strategy:
     WRITE → localStorage (instant) → Supabase (async, non-blocking)
     READ  → localStorage (immediate render) + Supabase pull (merge)
   Depends on: window.SB (supabase-client.js), window.AUTH (auth.js)
═══════════════════════════════════════════════════════════════ */

const CLOUD = (() => {

  /* ── Table name mapping ── */
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

  /** Convert a record to DB shape (camelCase → snake_case) before push */
  function _toDb(table, record) {
    if (table !== 'vacancies') return { ...record };
    const out = {};
    for (const [k, v] of Object.entries(record)) {
      out[_V_TO_DB[k] || k] = v;
    }
    // Mirror status → "column" for kanban DB field
    if (out.status && !out['column']) out['column'] = out.status;
    return out;
  }

  /** Convert a record from DB shape (snake_case → camelCase) after pull */
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
        }
      } catch (e) { console.error('[CLOUD] flush exception:', item.table, e); _queue.push(item); }
    }
    _flushing = false;
    if (_queue.length > 0) _scheduleFlush();
  }

  /* ══════════════════════════════════════════════════════════════
     PUBLIC API
  ══════════════════════════════════════════════════════════════ */

  /**
   * push — Upsert a single record to Supabase (fire-and-forget).
   * If offline or not authenticated, enqueues for later retry.
   */
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

  /**
   * pull — Fetch all records for the current user from a Supabase table.
   */
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

  /**
   * remove — Delete a record from Supabase by id.
   */
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

  /**
   * syncDown — Pull cloud data and merge into localStorage.
   * Returns the merged data array.
   */
  async function syncDown(table, localKey, mergeStrategy) {
    console.log('[CLOUD] syncDown:', table, mergeStrategy || 'latest_wins');
    const { data, error } = await pull(table);
    if (error || !data) return null;

    if (mergeStrategy === 'cloud_wins') {
      localStorage.setItem(localKey, JSON.stringify(data));
      return data;
    }

    // Default: 'latest_wins' — merge by updated_at
    let local = [];
    try { local = JSON.parse(localStorage.getItem(localKey) || '[]'); } catch { /* skip */ }
    const merged = _mergeByUpdatedAt(local, data);
    localStorage.setItem(localKey, JSON.stringify(merged));
    console.log('[CLOUD] syncDown merged:', table, merged.length, 'records');
    return merged;
  }

  /**
   * syncUp — Push all localStorage records to Supabase.
   */
  async function syncUp(table, localKey) {
    if (!_ready()) return;
    let local = [];
    try { local = JSON.parse(localStorage.getItem(localKey) || '[]'); } catch { return; }
    for (const record of local) {
      await push(table, record);
    }
  }

  /**
   * fullSync — Bidirectional sync: pull, merge, then push orphans.
   * Returns the merged data array.
   */
  async function fullSync(table, localKey) {
    if (!_ready()) { console.warn('[CLOUD] fullSync skipped (not ready):', table); return null; }
    console.log('[CLOUD] fullSync START:', table);
    // 1. Pull cloud (already mapped to local shape by pull())
    const { data: cloud, error } = await pull(table);
    if (error) { console.error('[CLOUD] fullSync pull failed:', table, error); return null; }
    // 2. Merge with local
    let local = [];
    try { local = JSON.parse(localStorage.getItem(localKey) || '[]'); } catch { /* skip */ }
    const merged = _mergeByUpdatedAt(local, cloud || []);
    // 3. Write merged back to localStorage
    localStorage.setItem(localKey, JSON.stringify(merged));
    // 4. Push any local-only records to cloud
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
  function _mergeByUpdatedAt(local, cloud) {
    const map = new Map();
    for (const r of local) {
      const rec = { ...r };
      if (!rec.updated_at) rec.updated_at = rec.saved_at || rec.created || new Date(rec.id || 0).toISOString();
      map.set(String(rec.id), rec);
    }
    for (const r of cloud) {
      const key = String(r.id);
      const existing = map.get(key);
      if (!existing || new Date(r.updated_at || 0) >= new Date(existing.updated_at || 0)) {
        map.set(key, r);
      }
    }
    return [...map.values()];
  }

  /* ── Flush queue when auth state changes ── */
  window.addEventListener('sb:signed_in', () => {
    console.log('[CLOUD] sb:signed_in received — flushing queue if needed');
    if (_queue.length > 0) _scheduleFlush();
  });

  return { push, pull, remove, syncDown, syncUp, fullSync, TABLES };
})();

window.CLOUD = CLOUD;
