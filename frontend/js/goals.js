/* ═══════════════════════════════════════════════════════════════
   DA-2026 · 9-GOA · Objetivos & Hábitos — Logic & Rendering
   ─────────────────────────────────────────────────────────────
   Data:  localStorage 'sb_goals' / 'sb_habits' / 'sb_reviews'
          → cloud-sync.js proxy auto-pushes to app_state JSONB
   Depends on: cloud-sync.js (proxy + cloud:sync_complete event)
   Architecture (per PLAN_HABITS_UI.md):
     L1 — Data Singletons   (state + I/O)
     L2 — Pure Compute      (no DOM, no I/O)
     L3 — Rendering         (DOM only)
     L4 — Events & Init
═══════════════════════════════════════════════════════════════ */

const GOA = (() => {

  /* ══════════════════════════════════════════════════════════════
     SECTION 0 — Helpers
  ══════════════════════════════════════════════════════════════ */

  const DAY_MS = 86400000;
  const DAY_NAMES = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

  function _esc(s) {
    const d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }

  function _today() {
    return new Date().toISOString().split('T')[0];
  }

  function _addDays(date, n) {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
  }

  function _fmtReviewDate(iso) {
    try {
      return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return iso || '';
    }
  }


  /* ══════════════════════════════════════════════════════════════
     SECTION 1 — Data Singletons (L1)
  ══════════════════════════════════════════════════════════════ */

  const GOALS = {
    KEY: 'sb_goals',
    getAll()  { try { return JSON.parse(localStorage.getItem(GOALS.KEY) || '[]'); } catch { return []; } },
    save(arr) { localStorage.setItem(GOALS.KEY, JSON.stringify(arr)); },
    add(goal) {
      const all = GOALS.getAll();
      const period = parseInt(goal.period, 10) || 30;
      const deadline = _addDays(new Date(), period).toISOString().split('T')[0];
      all.push({
        id: crypto.randomUUID(),
        text: String(goal.text || '').trim(),
        period,
        deadline,
        progress: 0,
        done: false,
        created: _today()
      });
      GOALS.save(all);
      return all;
    },
    del(id) {
      GOALS.save(GOALS.getAll().filter(g => g.id !== id));
    },
    update(id, patch) {
      const all = GOALS.getAll();
      const idx = all.findIndex(g => g.id === id);
      if (idx >= 0) {
        Object.assign(all[idx], patch);
        if (typeof all[idx].progress === 'number') {
          all[idx].progress = Math.max(0, Math.min(100, all[idx].progress));
          all[idx].done = all[idx].progress >= 100;
        }
        GOALS.save(all);
      }
    },
    bumpProgress(id, delta) {
      const all = GOALS.getAll();
      const g = all.find(x => x.id === id);
      if (!g) return;
      g.progress = Math.max(0, Math.min(100, (g.progress || 0) + delta));
      g.done = g.progress >= 100;
      GOALS.save(all);
    }
  };

  const HABITS = {
    KEY: 'sb_habits',
    getAll()  { try { return JSON.parse(localStorage.getItem(HABITS.KEY) || '[]'); } catch { return []; } },
    save(arr) { localStorage.setItem(HABITS.KEY, JSON.stringify(arr)); },
    add(habit) {
      const all = HABITS.getAll();
      all.push({
        id: crypto.randomUUID(),
        text: String(habit.text || '').trim(),
        icon: String(habit.icon || '🎯').trim() || '🎯',
        log: {},
        created: _today()
      });
      HABITS.save(all);
      return all;
    },
    del(id) {
      HABITS.save(HABITS.getAll().filter(h => h.id !== id));
    },
    toggle(id, day) {
      const all = HABITS.getAll();
      const h = all.find(x => x.id === id);
      if (!h) return;
      if (!h.log) h.log = {};
      h.log[day] = !h.log[day];
      HABITS.save(all);
    }
  };

  const REVIEWS = {
    KEY: 'sb_reviews',
    getAll()  { try { return JSON.parse(localStorage.getItem(REVIEWS.KEY) || '[]'); } catch { return []; } },
    save(arr) { localStorage.setItem(REVIEWS.KEY, JSON.stringify(arr)); },
    add(text) {
      const all = REVIEWS.getAll();
      all.push({
        id: crypto.randomUUID(),
        text: String(text || '').trim(),
        date: new Date().toISOString()
      });
      REVIEWS.save(all);
      return all;
    },
    del(id) {
      REVIEWS.save(REVIEWS.getAll().filter(r => r.id !== id));
    }
  };


  /* ══════════════════════════════════════════════════════════════
     SECTION 2 — Migration (back-fill UUIDs for legacy records)
  ══════════════════════════════════════════════════════════════ */

  function migrateGoalsAndHabits() {
    let changed;

    const goals = GOALS.getAll();
    changed = false;
    goals.forEach(g => {
      if (!g.id) { g.id = crypto.randomUUID(); changed = true; }
      if (typeof g.progress !== 'number') { g.progress = 0; changed = true; }
      if (typeof g.done !== 'boolean') { g.done = g.progress >= 100; changed = true; }
    });
    if (changed) GOALS.save(goals);

    const habits = HABITS.getAll();
    changed = false;
    habits.forEach(h => {
      if (!h.id) { h.id = crypto.randomUUID(); changed = true; }
      if (!h.log || typeof h.log !== 'object') { h.log = {}; changed = true; }
    });
    if (changed) HABITS.save(habits);

    const reviews = REVIEWS.getAll();
    changed = false;
    reviews.forEach(r => {
      if (!r.id) { r.id = crypto.randomUUID(); changed = true; }
      // Legacy reviews stored a localized display string in `date`. Keep it,
      // but ensure new ones have ISO. We do not rewrite legacy strings.
    });
    if (changed) REVIEWS.save(reviews);
  }


  /* ══════════════════════════════════════════════════════════════
     SECTION 3 — Pure Compute (L2 — no DOM, no I/O)
  ══════════════════════════════════════════════════════════════ */

  function getDaysLeft(deadline) {
    if (!deadline) return 0;
    const d = new Date(deadline);
    if (isNaN(d.getTime())) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((d - today) / DAY_MS);
  }

  function goalColor(goal) {
    if (goal.done) return 'var(--gn)';
    const left = getDaysLeft(goal.deadline);
    if (left < 7) return 'var(--rd)';
    if (left < 15) return 'var(--am)';
    return 'var(--ac)';
  }

  function calcGoalStats(goals) {
    const total = goals.length;
    const done = goals.filter(g => g.done).length;
    const active = total - done;
    const pctComplete = total ? Math.round((done / total) * 100) : 0;
    return { total, done, active, pctComplete };
  }

  function calcStreak(log) {
    if (!log) return 0;
    let streak = 0;
    const d = new Date();
    for (let i = 0; i < 365; i++) {
      const key = d.toISOString().split('T')[0];
      if (log[key]) streak++;
      else break;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  }

  function calcMaxStreak(habits) {
    return habits.reduce((max, h) => Math.max(max, calcStreak(h.log)), 0);
  }

  function calcHabitCompletion(habits) {
    const today = _today();
    const todayTotal = habits.length;
    const todayDone = habits.filter(h => h.log && h.log[today]).length;
    const pct = todayTotal ? Math.round((todayDone / todayTotal) * 100) : 0;
    return { todayDone, todayTotal, pct };
  }

  function last7Days() {
    const out = [];
    for (let d = 6; d >= 0; d--) {
      out.push(_addDays(new Date(), -d).toISOString().split('T')[0]);
    }
    return out;
  }


  /* ══════════════════════════════════════════════════════════════
     SECTION 4 — Rendering (L3 — DOM only)
  ══════════════════════════════════════════════════════════════ */

  function renderStats() {
    const goals = GOALS.getAll();
    const habits = HABITS.getAll();
    const stats = calcGoalStats(goals);
    const max = calcMaxStreak(habits);

    const sG = document.getElementById('sG');
    const sH = document.getElementById('sH');
    const sR = document.getElementById('sR');
    const sP = document.getElementById('sP');
    if (sG) sG.textContent = goals.length;
    if (sH) sH.textContent = habits.length;
    if (sR) sR.textContent = max + '🔥';
    if (sP) sP.textContent = stats.pctComplete + '%';
  }

  function renderGoals() {
    const goals = GOALS.getAll();

    [30, 60, 90].forEach(period => {
      const el = document.getElementById('g' + period);
      if (!el) return;
      const items = goals.filter(g => g.period === period);
      if (!items.length) {
        el.innerHTML = '<div class="empty">Sin objetivos de ' + period + ' días. Agrega uno arriba.</div>';
        return;
      }
      el.innerHTML = items.map(g => {
        const left = getDaysLeft(g.deadline);
        const color = goalColor(g);
        const status = g.done
          ? 'Completado'
          : (left > 0 ? left + ' días' : (left === 0 ? 'Hoy' : '¡Venció!'));
        const checkmark = g.done ? '✅ ' : '';
        const safeId = _esc(g.id);
        return (
          '<div class="goal">' +
            '<button class="goal-del" data-act="del-goal" data-id="' + safeId + '" title="Eliminar">✕</button>' +
            '<div class="goal-h">' +
              '<div class="goal-t">' + checkmark + _esc(g.text) +
                '<span class="goal-category goal-cat-' + period + '">' + period + 'd</span>' +
              '</div>' +
              '<div class="goal-dl" style="color:' + color + '">' + _esc(status) + '</div>' +
            '</div>' +
            '<div class="bar"><div class="bar-f" style="width:' + (g.progress || 0) + '%;background:' + color + '"></div></div>' +
            '<div style="display:flex;justify-content:space-between;align-items:center">' +
              '<span class="goal-pct" style="color:' + color + '">' + (g.progress || 0) + '%</span>' +
              '<div class="goal-actions">' +
                '<button class="btn bo bs" data-act="goal-progress" data-id="' + safeId + '" data-delta="-10">−10%</button>' +
                '<button class="btn bo bs" data-act="goal-progress" data-id="' + safeId + '" data-delta="10">+10%</button>' +
                '<button class="btn bg bs" data-act="goal-progress" data-id="' + safeId + '" data-delta="25">+25%</button>' +
              '</div>' +
            '</div>' +
          '</div>'
        );
      }).join('');
    });
  }

  function renderHabits() {
    const habits = HABITS.getAll();
    const list = document.getElementById('habitList');
    if (!list) return;

    if (!habits.length) {
      list.innerHTML = '<div class="empty">Sin hábitos aún. Agrega tu primer hábito diario.</div>';
      return;
    }

    const days = last7Days();
    const today = _today();

    list.innerHTML = habits.map(h => {
      const streak = calcStreak(h.log);
      const safeId = _esc(h.id);
      const streakBadge = streak >= 7
        ? '<span class="streak-badge hot">🔥 ' + streak + 'd</span>'
        : '🔥 Racha: ' + streak + ' días';
      const cells = days.map(d => {
        const done = h.log && h.log[d];
        const isToday = d === today;
        const dt = new Date(d + 'T12:00:00');
        const cls = 'habit-day' + (done ? ' done' : '') + (isToday ? ' today' : '');
        return '<div class="' + cls + '" data-act="toggle-habit" data-id="' + safeId + '" data-day="' + d + '">' + DAY_NAMES[dt.getDay()] + '</div>';
      }).join('');
      return (
        '<div class="habit">' +
          '<div class="habit-icon">' + _esc(h.icon || '🎯') + '</div>' +
          '<div class="habit-info">' +
            '<div class="habit-name">' + _esc(h.text) + '</div>' +
            '<div class="habit-streak">' + streakBadge + '</div>' +
          '</div>' +
          '<div class="habit-days">' + cells + '</div>' +
          '<button class="habit-del" data-act="del-habit" data-id="' + safeId + '" title="Eliminar">✕</button>' +
        '</div>'
      );
    }).join('');
  }

  function renderReviews() {
    const reviews = REVIEWS.getAll();
    const list = document.getElementById('revList');
    if (!list) return;

    if (!reviews.length) {
      list.innerHTML = '<div class="empty">Sin revisiones aún.</div>';
      return;
    }

    list.innerHTML = reviews.slice().reverse().map(r => {
      const safeId = _esc(r.id);
      // Legacy records may have a localized display string in `date`.
      // ISO strings (new format) get reformatted; legacy strings render as-is.
      const dateStr = r.date && /^\d{4}-\d{2}-\d{2}T/.test(r.date) ? _fmtReviewDate(r.date) : (r.date || '');
      return (
        '<div class="review">' +
          '<button class="review-del" data-act="del-review" data-id="' + safeId + '" title="Eliminar">✕</button>' +
          '<div class="review-d">' + _esc(dateStr) + '</div>' +
          '<div class="review-t">' + _esc(r.text) + '</div>' +
        '</div>'
      );
    }).join('');
  }

  function renderAll() {
    renderGoals();
    renderHabits();
    renderReviews();
    renderStats();
  }


  /* ══════════════════════════════════════════════════════════════
     SECTION 5 — Events & Init (L4)
  ══════════════════════════════════════════════════════════════ */

  function bindTabs() {
    document.querySelectorAll('.tab').forEach(t => {
      t.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(x => x.classList.remove('on'));
        document.querySelectorAll('.pnl').forEach(x => x.classList.remove('on'));
        t.classList.add('on');
        const pnl = document.getElementById('p-' + t.dataset.p);
        if (pnl) pnl.classList.add('on');
      });
    });
  }

  function bindForms() {
    const goalBtn = document.getElementById('addGoalBtn');
    if (goalBtn) goalBtn.addEventListener('click', () => {
      const text = (document.getElementById('gText').value || '').trim();
      const period = parseInt(document.getElementById('gPeriod').value, 10) || 30;
      if (!text) return;
      GOALS.add({ text, period });
      document.getElementById('gText').value = '';
      renderAll();
    });

    const gText = document.getElementById('gText');
    if (gText) gText.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); goalBtn && goalBtn.click(); }
    });

    const habitBtn = document.getElementById('addHabitBtn');
    if (habitBtn) habitBtn.addEventListener('click', () => {
      const text = (document.getElementById('hText').value || '').trim();
      const icon = (document.getElementById('hIcon').value || '').trim() || '🎯';
      if (!text) return;
      HABITS.add({ text, icon });
      document.getElementById('hText').value = '';
      document.getElementById('hIcon').value = '';
      renderAll();
    });

    const hText = document.getElementById('hText');
    if (hText) hText.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); habitBtn && habitBtn.click(); }
    });

    const revBtn = document.getElementById('addReviewBtn');
    if (revBtn) revBtn.addEventListener('click', () => {
      const text = (document.getElementById('revText').value || '').trim();
      if (!text) return;
      REVIEWS.add(text);
      document.getElementById('revText').value = '';
      renderAll();
    });
  }

  function bindDelegation() {
    document.body.addEventListener('click', e => {
      const t = e.target.closest('[data-act]');
      if (!t) return;
      const act = t.dataset.act;
      const id = t.dataset.id;

      if (act === 'del-goal') {
        if (!confirm('¿Eliminar este objetivo?')) return;
        GOALS.del(id);
        renderAll();
      } else if (act === 'goal-progress') {
        const delta = parseInt(t.dataset.delta, 10) || 0;
        GOALS.bumpProgress(id, delta);
        renderAll();
      } else if (act === 'toggle-habit') {
        HABITS.toggle(id, t.dataset.day);
        renderAll();
      } else if (act === 'del-habit') {
        if (!confirm('¿Eliminar este hábito y su historial?')) return;
        HABITS.del(id);
        renderAll();
      } else if (act === 'del-review') {
        if (!confirm('¿Eliminar esta revisión?')) return;
        REVIEWS.del(id);
        renderAll();
      }
    });
  }

  function init() {
    migrateGoalsAndHabits();
    bindTabs();
    bindForms();
    bindDelegation();
    renderAll();
    window.addEventListener('cloud:sync_complete', renderAll);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }


  /* ══════════════════════════════════════════════════════════════
     SECTION 6 — Public API (for debugging / console use)
  ══════════════════════════════════════════════════════════════ */

  return {
    GOALS, HABITS, REVIEWS,
    renderAll, renderGoals, renderHabits, renderReviews, renderStats,
    calcGoalStats, calcStreak, calcMaxStreak, calcHabitCompletion,
    getDaysLeft, goalColor, last7Days,
    migrateGoalsAndHabits
  };

})();
