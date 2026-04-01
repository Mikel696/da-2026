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
    const batch = _queue.splice(0, _queue.length);
    for (const item of batch) {
      try {
        if (item.action === 'upsert') {
          const { error } = await SB.from(TABLES[item.table])
            .upsert({ ...item.record, user_id: _uid(), updated_at: new Date().toISOString() },
                     { onConflict: 'id,user_id' });
          if (error) { _queue.push(item); }
        } else if (item.action === 'delete') {
          await SB.from(TABLES[item.table]).delete().eq('id', item.record.id).eq('user_id', _uid());
        }
      } catch { _queue.push(item); }
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
    if (!_ready()) { _enqueue(table, record, 'upsert'); return { error: 'not_ready' }; }
    try {
      const { error } = await SB.from(TABLES[table])
        .upsert({ ...record, user_id: _uid(), updated_at: new Date().toISOString() },
                 { onConflict: 'id,user_id' });
      if (error) { _enqueue(table, record, 'upsert'); return { error }; }
      return { error: null };
    } catch (e) {
      _enqueue(table, record, 'upsert');
      return { error: e.message };
    }
  }

  /**
   * pull — Fetch all records for the current user from a Supabase table.
   */
  async function pull(table) {
    if (!_ready()) return { data: null, error: 'not_ready' };
    try {
      const { data, error } = await SB.from(TABLES[table])
        .select('*')
        .eq('user_id', _uid())
        .order('updated_at', { ascending: false });
      return { data, error };
    } catch (e) {
      return { data: null, error: e.message };
    }
  }

  /**
   * remove — Delete a record from Supabase by id.
   */
  async function remove(table, id) {
    if (!_ready()) { _enqueue(table, { id }, 'delete'); return; }
    try {
      await SB.from(TABLES[table]).delete().eq('id', id).eq('user_id', _uid());
    } catch {
      _enqueue(table, { id }, 'delete');
    }
  }

  /**
   * syncDown — Pull cloud data and merge into localStorage.
   * Returns the merged data array.
   */
  async function syncDown(table, localKey, mergeStrategy) {
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
    if (!_ready()) return null;
    // 1. Pull cloud
    const { data: cloud } = await pull(table);
    // 2. Merge with local
    let local = [];
    try { local = JSON.parse(localStorage.getItem(localKey) || '[]'); } catch { /* skip */ }
    const merged = _mergeByUpdatedAt(local, cloud || []);
    // 3. Write merged back to localStorage
    localStorage.setItem(localKey, JSON.stringify(merged));
    // 4. Push any local-only records to cloud
    const cloudIds = new Set((cloud || []).map(r => String(r.id)));
    const localOnly = merged.filter(r => !cloudIds.has(String(r.id)));
    for (const record of localOnly) {
      await push(table, record);
    }
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
    if (_queue.length > 0) _scheduleFlush();
  });

  return { push, pull, remove, syncDown, syncUp, fullSync, TABLES };
})();

window.CLOUD = CLOUD;
