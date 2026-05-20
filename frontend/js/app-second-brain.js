/* ═══════════════════════════════════════════════════════════════════════
   DA-2026 · 2-APP · Second Brain Layer (5 phases) · 2026-05-15
   ─────────────────────────────────────────────────────────────────────
   F1 · Foundation + CLI ............ APP.History, window.APP.{list,get,load,...}
   F2 · Web Clipper ................. APP.Clipper (bookmarklet generator + URL handler)
   F3 · Outcome Coach ............... APP.Coach  (status tracking + correlations)
   F4 · Job Market Wiki ............. APP.Wiki   (concept aggregator)
   F5 · Career Canvas ............... APP.Canvas (visual knowledge graph)
   ─────────────────────────────────────────────────────────────────────
   Storage: app_analyses (TIER 2 · JSONB · SYNC_REGISTRY-registered).
   Local-first · privacy first · no external APIs.
   ═══════════════════════════════════════════════════════════════════════ */

const APP = (() => {
'use strict';

const KEY = 'app_analyses';
const MAX_HISTORY = 50;

/* ── Storage primitives ── */
const store = {
  getAll() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } },
  saveAll(arr) {
    if (arr.length > MAX_HISTORY) arr = arr.slice(-MAX_HISTORY);
    localStorage.setItem(KEY, JSON.stringify(arr));
  },
  upsert(entry) {
    const arr = this.getAll();
    const idx = arr.findIndex(x => x.id === entry.id);
    entry.updated_at = new Date().toISOString();
    if (idx >= 0) arr[idx] = entry; else arr.push(entry);
    this.saveAll(arr);
    return entry;
  },
  get(id) { return this.getAll().find(x => x.id === id) || null; },
  del(id) { this.saveAll(this.getAll().filter(x => x.id !== id)); }
};

/* ═════════════════════════════════════════════════════════════════════
   F1 · HISTORY + CLI
   Auto-snapshots every runAnalysis() result. Provides re-load + bridges.
   ═════════════════════════════════════════════════════════════════════ */
const History = {
  /* Capture a snapshot of global state S after analysis */
  snapshot() {
    if (typeof S === 'undefined' || !S.analyzed) return null;
    const entry = {
      id: S.vacancyId || (Date.now().toString(36) + Math.random().toString(36).slice(2, 6)),
      ts: Date.now(),
      company: S.company || '',
      role: S.role || '',
      url: S.url || '',
      salaryInput: S.salaryInput || '',
      jd: S.jd || '',
      match: { ...S.match },
      profile: { ...S.profile },
      outcome: store.get(S.vacancyId)?.outcome || { status: 'analyzed', notes: '', salary_asked: '', date_applied: null }
    };
    store.upsert(entry);
    return entry;
  },
  /* Restore an analysis into the form + global state */
  load(id) {
    const e = store.get(id);
    if (!e) return false;
    const set = (sel, v) => { const el = document.getElementById(sel); if (el) el.value = v || ''; };
    set('inCompany', e.company);
    set('inRole', e.role);
    set('inUrl', e.url);
    set('inSalary', e.salaryInput);
    set('inJD', e.jd);
    if (typeof S !== 'undefined') {
      Object.assign(S, { company: e.company, role: e.role, url: e.url, jd: e.jd, salaryInput: e.salaryInput, match: e.match, profile: e.profile, analyzed: true, vacancyId: e.id });
    }
    if (typeof renderAnalysis === 'function') renderAnalysis();
    if (typeof renderCV === 'function') renderCV();
    if (typeof renderCover === 'function') renderCover();
    if (typeof renderInterview === 'function') renderInterview();
    return true;
  },
  /* Render the history list panel */
  render() {
    const root = document.getElementById('appHistList');
    if (!root) return;
    const arr = store.getAll().slice().reverse(); // newest first
    if (arr.length === 0) {
      root.innerHTML = '<div class="empty" style="padding:20px"><div class="empty-icon">📭</div><h3>Sin análisis previos</h3><p>Analiza una vacante para que quede en el historial.</p></div>';
      return;
    }
    let h = '';
    arr.slice(0, 20).forEach(e => {
      const d = new Date(e.ts);
      const dateStr = d.toLocaleDateString('es', { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
      const status = (e.outcome && e.outcome.status) || 'analyzed';
      const statusColor = { analyzed: 'var(--t3)', applied: 'var(--cy)', callback: 'var(--am)', interview: 'var(--a2)', offer: 'var(--gn)', rejected: 'var(--rd)' }[status] || 'var(--t3)';
      const pct = (e.match && e.match.pct) || 0;
      h += '<div class="appHist-row" data-id="' + e.id + '" style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--el);border:1px solid var(--bd);border-radius:6px;margin-bottom:4px;cursor:pointer;transition:border-color var(--transition-fast)">';
      h += '<div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:600;color:var(--tx);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(e.company || '?') + ' — ' + esc(e.role || '?') + '</div>';
      h += '<div style="font-size:10px;color:var(--t3)">' + dateStr + ' · ' + pct + '% match · <span style="color:' + statusColor + ';font-weight:600">' + status + '</span></div></div>';
      h += '<button class="btn bo bs" data-load="' + e.id + '" style="font-size:10px">↺ Cargar</button>';
      h += '<button class="btn bo bs" data-status="' + e.id + '" style="font-size:10px">📊</button>';
      h += '<button class="btn bo bs" data-del="' + e.id + '" style="font-size:10px;color:var(--rd)">✕</button>';
      h += '</div>';
    });
    root.innerHTML = h;
    /* Wire events */
    root.querySelectorAll('[data-load]').forEach(b => b.addEventListener('click', ev => {
      ev.stopPropagation();
      const id = b.getAttribute('data-load');
      if (History.load(id)) {
        showTab('analyzer');
        toast('Análisis cargado: ' + (store.get(id).company || ''));
      }
    }));
    root.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', ev => {
      ev.stopPropagation();
      if (!confirm('¿Eliminar este análisis del historial?')) return;
      store.del(b.getAttribute('data-del'));
      History.render();
    }));
    root.querySelectorAll('[data-status]').forEach(b => b.addEventListener('click', ev => {
      ev.stopPropagation();
      Coach.openOutcomeEditor(b.getAttribute('data-status'));
    }));
  }
};

/* ═════════════════════════════════════════════════════════════════════
   F2 · WEB CLIPPER (bookmarklet generator + URL param handler)
   ═════════════════════════════════════════════════════════════════════ */
const Clipper = {
  /* Generate a bookmarklet that captures the current page and opens 2-APP */
  bookmarkletCode() {
    const target = (location.origin + location.pathname).replace(/[^/]*$/, 'apply.html');
    // Bookmarklet · runs on target site (LinkedIn / Indeed / Computrabajo)
    // Captures URL · title · main text · opens apply.html with payload
    const src = `(function(){
      var u=location.href, t=document.title;
      // Try common JD selectors for major job boards · fallback to body
      var sels=['.show-more-less-html__markup','.jobsearch-jobDescriptionText','.description','[data-test=job-description]','.job-description','main article'];
      var jd='';
      for(var i=0;i<sels.length;i++){ var el=document.querySelector(sels[i]); if(el && el.innerText.length > jd.length) jd=el.innerText; }
      if(!jd || jd.length<200) jd=document.body.innerText.slice(0, 8000);
      var url='${target}?clip=1&t='+encodeURIComponent(t.slice(0,200))+'&u='+encodeURIComponent(u)+'&jd='+encodeURIComponent(jd.slice(0,8000));
      window.open(url,'_blank');
    })();`.replace(/\s+/g, ' ').trim();
    return 'javascript:' + src;
  },
  /* Detect ?clip=1 on apply.html load · prefill form */
  handleUrlParams() {
    const p = new URLSearchParams(location.search);
    if (p.get('clip') !== '1') return false;
    const t = p.get('t') || '';
    const u = p.get('u') || '';
    const jd = p.get('jd') || '';
    /* Try to extract company + role from title · pattern "Role at Company | Site" */
    let company = '', role = '';
    const m = t.match(/^(.+?)\s+(?:at|en|@)\s+(.+?)(?:\s+[|·]\s+|$)/i);
    if (m) { role = m[1].trim(); company = m[2].trim(); }
    const set = (id, v) => { const el = document.getElementById(id); if (el && v) el.value = v; };
    set('inCompany', company);
    set('inRole', role);
    set('inUrl', u);
    set('inJD', jd);
    toast('📎 Vacante capturada · click "Analizar" para procesar');
    return true;
  },
  /* Render the bookmarklet modal */
  showModal() {
    const code = this.bookmarkletCode();
    let modal = document.getElementById('appClipModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'appClipModal';
      modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.78);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
      document.body.appendChild(modal);
    }
    modal.innerHTML = '<div style="background:var(--c1);border:1px solid var(--bd);border-radius:var(--radius-md);padding:22px;max-width:560px;width:100%">' +
      '<div style="font-size:16px;font-weight:700;margin-bottom:8px">📎 Vacancy Web Clipper</div>' +
      '<p style="font-size:12px;color:var(--t2);line-height:1.6;margin-bottom:10px">Arrastrá el botón de abajo a tu barra de marcadores. En cualquier oferta de LinkedIn / Indeed / Computrabajo · click el bookmark → se abre 2-APP con la vacante capturada.</p>' +
      '<div style="text-align:center;padding:18px;background:var(--el);border:1px dashed var(--bd2);border-radius:var(--radius-sm);margin-bottom:12px">' +
      '<a href="' + esc(code) + '" style="display:inline-block;padding:10px 20px;background:var(--ac);color:#fff;border-radius:var(--radius-sm);text-decoration:none;font-weight:600;cursor:grab">📎 Capturar Vacante → DA-2026</a>' +
      '<div style="font-size:10px;color:var(--t3);margin-top:6px">↑ arrastrá esto a tu barra de marcadores</div>' +
      '</div>' +
      '<div style="font-size:11px;color:var(--t3);margin-bottom:10px"><b>Cómo usarlo:</b><br>1. Arrastra el botón a tu barra de marcadores (o copia el código de abajo y crea un favorito).<br>2. Visita una oferta de LinkedIn / Indeed / Computrabajo.<br>3. Click el bookmark → se abre apply.html con todo pre-cargado.<br>4. Click "Analizar" → CV/Cover/Interview/Prompts se generan automático.</div>' +
      '<details style="margin-bottom:12px"><summary style="font-size:11px;color:var(--a2);cursor:pointer">Ver código del bookmarklet</summary><textarea readonly style="width:100%;height:80px;background:var(--bg);border:1px solid var(--bd);border-radius:var(--radius-sm);padding:8px;color:var(--t2);font-family:\'IBM Plex Mono\',monospace;font-size:10px;margin-top:6px">' + esc(code) + '</textarea></details>' +
      '<button class="btn bo" onclick="document.getElementById(\'appClipModal\').remove()">Cerrar</button>' +
    '</div>';
  }
};

/* ═════════════════════════════════════════════════════════════════════
   F3 · OUTCOME COACH (local correlation engine)
   ═════════════════════════════════════════════════════════════════════ */
const Coach = {
  STATUSES: ['analyzed', 'applied', 'callback', 'interview', 'offer', 'rejected'],
  STATUS_LABELS: { analyzed: '📝 Analizado', applied: '📨 Aplicado', callback: '📞 Callback', interview: '🎯 Entrevista', offer: '🏆 Oferta', rejected: '❌ Rechazado' },

  openOutcomeEditor(id) {
    const e = store.get(id);
    if (!e) return;
    let modal = document.getElementById('appOutcomeModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'appOutcomeModal';
      modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.78);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
      document.body.appendChild(modal);
    }
    const o = e.outcome || { status: 'analyzed', notes: '', salary_asked: '', date_applied: null };
    let opts = Coach.STATUSES.map(s => `<option value="${s}" ${s === o.status ? 'selected' : ''}>${Coach.STATUS_LABELS[s]}</option>`).join('');
    modal.innerHTML = '<div style="background:var(--c1);border:1px solid var(--bd);border-radius:var(--radius-md);padding:22px;max-width:480px;width:100%">' +
      '<div style="font-size:15px;font-weight:700;margin-bottom:4px">📊 ' + esc(e.company || '?') + ' — ' + esc(e.role || '?') + '</div>' +
      '<div style="font-size:11px;color:var(--t3);margin-bottom:14px">Match: ' + (e.match?.pct || 0) + '% · ATS: ' + (e.match?.ats || 0) + '</div>' +
      '<label style="font-size:11px;color:var(--t3);text-transform:uppercase;letter-spacing:1px">Estado</label>' +
      '<select class="sel" id="oStatus" style="width:100%;margin-bottom:10px">' + opts + '</select>' +
      '<label style="font-size:11px;color:var(--t3);text-transform:uppercase;letter-spacing:1px">Salario pedido (opcional)</label>' +
      '<input class="inp" id="oSalary" style="width:100%;margin-bottom:10px" placeholder="ej: $5M COP" value="' + esc(o.salary_asked || '') + '">' +
      '<label style="font-size:11px;color:var(--t3);text-transform:uppercase;letter-spacing:1px">Notas (lecciones · feedback · etc.)</label>' +
      '<textarea class="txa" id="oNotes" style="width:100%;min-height:80px;margin-bottom:12px">' + esc(o.notes || '') + '</textarea>' +
      '<div style="display:flex;gap:8px;justify-content:flex-end">' +
      '<button class="btn bo" onclick="document.getElementById(\'appOutcomeModal\').remove()">Cancelar</button>' +
      '<button class="btn bp" id="oSave">Guardar</button>' +
      '</div></div>';
    document.getElementById('oSave').addEventListener('click', () => {
      const newStatus = document.getElementById('oStatus').value;
      e.outcome = {
        status: newStatus,
        salary_asked: document.getElementById('oSalary').value.trim(),
        notes: document.getElementById('oNotes').value.trim(),
        date_applied: o.date_applied || (newStatus !== 'analyzed' ? Date.now() : null)
      };
      store.upsert(e);
      modal.remove();
      History.render();
      Coach.renderInsights();
      toast('Outcome actualizado');
    });
  },

  /* Compute correlations · 100% local · output 3-5 insights */
  computeInsights() {
    const arr = store.getAll();
    if (arr.length < 3) return [{ text: 'Necesito al menos 3 vacantes analizadas con outcome para sacar patrones. Tenés ' + arr.length + '.', strength: 'info' }];
    const insights = [];
    /* Outcome buckets */
    const positive = arr.filter(e => ['callback', 'interview', 'offer'].includes(e.outcome?.status));
    const negative = arr.filter(e => e.outcome?.status === 'rejected');
    const callbackRate = arr.filter(e => e.outcome?.status !== 'analyzed').length > 0 ?
      Math.round(positive.length / arr.filter(e => e.outcome?.status !== 'analyzed').length * 100) : 0;
    insights.push({ text: `Callback rate: <b>${callbackRate}%</b> (${positive.length} positivos de ${arr.filter(e => e.outcome?.status !== 'analyzed').length} aplicaciones)`, strength: callbackRate >= 30 ? 'good' : 'warn' });

    /* Match % bucket vs outcome */
    const highMatch = arr.filter(e => (e.match?.pct || 0) >= 75);
    const highMatchPositive = highMatch.filter(e => ['callback', 'interview', 'offer'].includes(e.outcome?.status));
    if (highMatch.length >= 2) {
      const r = Math.round(highMatchPositive.length / highMatch.length * 100);
      insights.push({ text: `Vacantes con Match ≥75% tienen <b>${r}%</b> de tasa positiva (vs callback rate global ${callbackRate}%)`, strength: r > callbackRate ? 'good' : 'warn' });
    }

    /* Keyword analysis · top skills in positive vs negative */
    const skillCount = (subset) => {
      const c = {};
      subset.forEach(e => (e.match?.found || []).forEach(s => { c[s.name] = (c[s.name] || 0) + 1; }));
      return c;
    };
    const posSk = skillCount(positive), negSk = skillCount(negative);
    const allSkills = new Set([...Object.keys(posSk), ...Object.keys(negSk)]);
    const skillLift = [];
    allSkills.forEach(sk => {
      const p = (posSk[sk] || 0) / Math.max(1, positive.length);
      const n = (negSk[sk] || 0) / Math.max(1, negative.length);
      if ((posSk[sk] || 0) >= 2) skillLift.push({ skill: sk, lift: p - n, count: posSk[sk] || 0 });
    });
    skillLift.sort((a, b) => b.lift - a.lift);
    if (skillLift.length > 0) {
      insights.push({ text: `Skills más correlacionados con respuesta positiva: <b>${skillLift.slice(0, 3).map(s => s.skill).join(' · ')}</b>`, strength: 'good' });
    }

    /* Industry / company size */
    const indGroups = {};
    arr.forEach(e => { const ind = e.profile?.industry || 'general'; indGroups[ind] = indGroups[ind] || { total: 0, pos: 0 }; indGroups[ind].total++; if (['callback', 'interview', 'offer'].includes(e.outcome?.status)) indGroups[ind].pos++; });
    const indSorted = Object.entries(indGroups).filter(([, v]) => v.total >= 2).sort(([, a], [, b]) => (b.pos / b.total) - (a.pos / a.total));
    if (indSorted.length > 0) {
      const [ind, v] = indSorted[0];
      insights.push({ text: `Mejor industria: <b>${ind}</b> · ${Math.round(v.pos / v.total * 100)}% positivas (${v.pos}/${v.total})`, strength: 'good' });
    }

    /* Word count of JD vs outcome */
    const wcAvgPos = positive.length ? Math.round(positive.reduce((a, e) => a + (e.profile?.wordCount || 0), 0) / positive.length) : 0;
    const wcAvgNeg = negative.length ? Math.round(negative.reduce((a, e) => a + (e.profile?.wordCount || 0), 0) / negative.length) : 0;
    if (wcAvgPos && wcAvgNeg && Math.abs(wcAvgPos - wcAvgNeg) > 100) {
      insights.push({ text: `JDs que llevan a respuesta positiva promedian <b>${wcAvgPos}</b> palabras vs <b>${wcAvgNeg}</b> para rechazo`, strength: 'info' });
    }

    /* Recommendation */
    if (skillLift.length >= 3) {
      const toLearn = skillLift.slice(-3).filter(s => s.lift < 0).map(s => s.skill);
      if (toLearn.length) insights.push({ text: `Skills a mejorar / agregar: <b>${toLearn.join(' · ')}</b> aparecen más en rechazos`, strength: 'warn' });
    }

    return insights;
  },

  renderInsights() {
    const root = document.getElementById('appCoachPanel');
    if (!root) return;
    const ins = Coach.computeInsights();
    const colors = { good: 'var(--gn)', warn: 'var(--am)', info: 'var(--cy)' };
    let h = '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px"><div style="font-size:13px;font-weight:600">📊 Mi Coach (100% local · sin APIs externas)</div><button class="btn bo bs" id="appCoachRefresh">↻ Recalcular</button></div>';
    h += ins.map(i => '<div style="padding:10px 12px;background:var(--el);border-left:3px solid ' + colors[i.strength] + ';border-radius:var(--radius-sm);margin-bottom:6px;font-size:12px;line-height:1.6">' + i.text + '</div>').join('');
    h += '<div style="font-size:10px;color:var(--t3);margin-top:10px;font-style:italic">Insights basados en ' + store.getAll().length + ' análisis. Marca outcomes en el historial (botón 📊) para mejorar la precisión.</div>';
    root.innerHTML = h;
    const btn = document.getElementById('appCoachRefresh');
    if (btn) btn.addEventListener('click', () => Coach.renderInsights());
  }
};

/* ═════════════════════════════════════════════════════════════════════
   F4 · JOB MARKET WIKI (concept aggregator)
   ═════════════════════════════════════════════════════════════════════ */
const Wiki = {
  /* Extract concepts from corpus · skills (found), missing (gaps), powerWords, redFlags */
  computeConcepts() {
    const arr = store.getAll();
    const concepts = {};
    const add = (name, type, vacancyId) => {
      const key = type + ':' + name.toLowerCase();
      if (!concepts[key]) concepts[key] = { name, type, vacancies: new Set(), count: 0 };
      concepts[key].vacancies.add(vacancyId);
      concepts[key].count++;
    };
    arr.forEach(e => {
      (e.match?.found || []).forEach(s => add(s.name, 'have', e.id));
      (e.match?.missing || []).forEach(g => add(g, 'gap', e.id));
      (e.profile?.tacticalSkills || []).forEach(s => add(s, 'tactical', e.id));
      (e.profile?.powerWords || []).forEach(w => add(w, 'powerWord', e.id));
      (e.profile?.redFlags || []).forEach(f => add(f, 'redFlag', e.id));
    });
    return Object.values(concepts).map(c => ({ ...c, vacancies: Array.from(c.vacancies) })).sort((a, b) => b.count - a.count);
  },

  render() {
    const root = document.getElementById('appWikiPanel');
    if (!root) return;
    const arr = store.getAll();
    if (arr.length === 0) {
      root.innerHTML = '<div class="empty" style="padding:40px"><div class="empty-icon">📚</div><h3>Wiki vacío</h3><p>Analiza vacantes para que el wiki se llene de conceptos.</p></div>';
      return;
    }
    const concepts = Wiki.computeConcepts();
    const types = { have: { label: '✅ Skills que tenés', color: 'var(--gn)' }, gap: { label: '⚠️ Skills que el mercado pide', color: 'var(--am)' }, tactical: { label: '🎯 Tactical (raros / diferenciadores)', color: 'var(--a2)' }, powerWord: { label: '💬 Power words', color: 'var(--cy)' }, redFlag: { label: '🚩 Red flags detectados', color: 'var(--rd)' } };
    let h = '<div style="font-size:11px;color:var(--t3);margin-bottom:14px"><b>' + arr.length + '</b> vacantes analizadas · <b>' + concepts.length + '</b> conceptos únicos extraídos.</div>';
    Object.keys(types).forEach(t => {
      const ts = concepts.filter(c => c.type === t).slice(0, 25);
      if (ts.length === 0) return;
      h += '<div class="card" style="margin-bottom:12px"><div style="font-size:13px;font-weight:600;color:' + types[t].color + ';margin-bottom:8px">' + types[t].label + ' (' + ts.length + ')</div>';
      h += '<div style="display:flex;flex-wrap:wrap;gap:5px">';
      ts.forEach(c => {
        const pctOfVacancies = Math.round(c.vacancies.length / arr.length * 100);
        h += '<span class="appWiki-chip" data-concept="' + esc(t + ':' + c.name) + '" style="display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:14px;background:var(--el);border:1px solid var(--bd);cursor:pointer;font-size:11px;transition:border-color var(--transition-fast)" title="' + c.vacancies.length + ' vacantes (' + pctOfVacancies + '%)">' + esc(c.name) + ' <span style="color:var(--t3);font-family:\'IBM Plex Mono\',monospace;font-size:9px">' + c.count + '</span></span>';
      });
      h += '</div></div>';
    });
    root.innerHTML = h;
    root.querySelectorAll('[data-concept]').forEach(el => el.addEventListener('click', () => Wiki.drillDown(el.getAttribute('data-concept'))));
  },

  drillDown(conceptKey) {
    const arr = store.getAll();
    const [type, ...nameParts] = conceptKey.split(':');
    const name = nameParts.join(':');
    const matching = arr.filter(e => {
      if (type === 'have') return (e.match?.found || []).some(s => s.name === name);
      if (type === 'gap') return (e.match?.missing || []).includes(name);
      if (type === 'tactical') return (e.profile?.tacticalSkills || []).includes(name);
      if (type === 'powerWord') return (e.profile?.powerWords || []).includes(name);
      if (type === 'redFlag') return (e.profile?.redFlags || []).includes(name);
      return false;
    });
    let modal = document.getElementById('appWikiDrill');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'appWikiDrill';
      modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.78);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
      document.body.appendChild(modal);
    }
    let h = '<div style="background:var(--c1);border:1px solid var(--bd);border-radius:var(--radius-md);padding:22px;max-width:640px;width:100%;max-height:80vh;overflow:auto">';
    h += '<div style="font-size:15px;font-weight:700;margin-bottom:4px">Concepto: <span style="color:var(--a2)">' + esc(name) + '</span></div>';
    h += '<div style="font-size:11px;color:var(--t3);margin-bottom:14px">Tipo: ' + type + ' · presente en ' + matching.length + ' vacantes</div>';
    matching.forEach(e => {
      h += '<div style="padding:8px 10px;background:var(--el);border-radius:var(--radius-sm);margin-bottom:4px;font-size:12px">';
      h += '<b>' + esc(e.company) + '</b> — ' + esc(e.role) + ' <span style="color:var(--t3);font-size:10px">· match ' + (e.match?.pct || 0) + '% · ' + (e.outcome?.status || 'analyzed') + '</span>';
      h += '</div>';
    });
    h += '<div style="margin-top:12px;text-align:right"><button class="btn bo" onclick="document.getElementById(\'appWikiDrill\').remove()">Cerrar</button></div></div>';
    modal.innerHTML = h;
  }
};

/* ═════════════════════════════════════════════════════════════════════
   F5 · CAREER CANVAS (HTML+CSS knowledge graph · no jsMind dep)
   ═════════════════════════════════════════════════════════════════════ */
const Canvas = {
  render() {
    const root = document.getElementById('appCanvasPanel');
    if (!root) return;
    const arr = store.getAll();
    if (arr.length === 0) {
      root.innerHTML = '<div class="empty" style="padding:40px"><div class="empty-icon">🗺️</div><h3>Canvas vacío</h3><p>Analiza vacantes y marca outcomes para verlo dibujado.</p></div>';
      return;
    }
    /* Layout: 6 columns by outcome status · vertical timeline by ts */
    const cols = ['analyzed', 'applied', 'callback', 'interview', 'offer', 'rejected'];
    const colors = { analyzed: 'var(--t3)', applied: 'var(--cy)', callback: 'var(--am)', interview: 'var(--a2)', offer: 'var(--gn)', rejected: 'var(--rd)' };
    const buckets = {}; cols.forEach(c => buckets[c] = []);
    arr.forEach(e => { const s = e.outcome?.status || 'analyzed'; (buckets[s] || buckets.analyzed).push(e); });
    cols.forEach(c => buckets[c].sort((a, b) => b.ts - a.ts));
    let h = '<div style="font-size:11px;color:var(--t3);margin-bottom:12px"><b>' + arr.length + '</b> vacantes · pipeline visual por estado. Click en un nodo para ver detalles.</div>';
    h += '<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px">';
    cols.forEach(c => {
      h += '<div style="background:var(--c1);border:1px solid var(--bd);border-radius:var(--radius-md);padding:8px;min-height:200px">';
      h += '<div style="font-size:11px;font-weight:700;color:' + colors[c] + ';text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;display:flex;justify-content:space-between"><span>' + (Coach.STATUS_LABELS[c] || c) + '</span><span style="opacity:.6;font-family:\'IBM Plex Mono\',monospace">' + buckets[c].length + '</span></div>';
      buckets[c].forEach(e => {
        h += '<div class="appCanvas-node" data-id="' + e.id + '" style="background:var(--el);border:1px solid var(--bd);border-left:3px solid ' + colors[c] + ';border-radius:6px;padding:6px 8px;margin-bottom:5px;cursor:pointer;transition:border-color var(--transition-fast)">';
        h += '<div style="font-size:11px;font-weight:600;color:var(--tx);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(e.company || '?') + '</div>';
        h += '<div style="font-size:9px;color:var(--t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(e.role || '?') + ' · ' + (e.match?.pct || 0) + '%</div>';
        h += '</div>';
      });
      h += '</div>';
    });
    h += '</div>';
    /* Cross-link with 5-JOB · if da_vacancies present, show count overlap */
    try {
      const jobTracker = JSON.parse(localStorage.getItem('da_vacancies') || '[]');
      if (jobTracker.length > 0) {
        const linked = arr.filter(a => jobTracker.some(j => j.company === a.company && j.role === a.role));
        h += '<div style="margin-top:12px;padding:10px 12px;background:rgba(139,92,246,.06);border:1px solid rgba(139,92,246,.15);border-radius:var(--radius-sm);font-size:11px;color:var(--t2)">🔗 <b>' + linked.length + '/' + arr.length + '</b> vacantes del Canvas también están en 5-JOB Tracker.</div>';
      }
    } catch (e) { /* ignore */ }
    root.innerHTML = h;
    root.querySelectorAll('.appCanvas-node').forEach(n => n.addEventListener('click', () => {
      const id = n.getAttribute('data-id');
      Coach.openOutcomeEditor(id);
    }));
  }
};

/* ═════════════════════════════════════════════════════════════════════
   HELPERS
   ═════════════════════════════════════════════════════════════════════ */
function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function toast(msg) {
  let t = document.getElementById('appToast');
  if (!t) { t = document.createElement('div'); t.id = 'appToast'; t.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:var(--ac);color:#fff;padding:8px 16px;border-radius:var(--radius-sm);font-size:12px;font-weight:600;z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,.4);opacity:0;transition:opacity .2s'; document.body.appendChild(t); }
  t.textContent = msg; t.style.opacity = '1';
  setTimeout(() => t.style.opacity = '0', 2200);
}
function showTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('on'));
  document.querySelectorAll('.pnl').forEach(p => p.classList.remove('on'));
  const tab = document.querySelector('[data-p="' + name + '"]');
  const pnl = document.getElementById('p-' + name);
  if (tab) tab.classList.add('on');
  if (pnl) pnl.classList.add('on');
}

/* ═════════════════════════════════════════════════════════════════════
   AUTO-INIT + HOOK
   ═════════════════════════════════════════════════════════════════════ */
function init() {
  /* F2 · handle ?clip= */
  Clipper.handleUrlParams();

  /* F1 · hook runAnalysis to auto-snapshot */
  if (typeof window.runAnalysis === 'function' && !window._appHooked) {
    const original = window.runAnalysis;
    window.runAnalysis = function(...args) {
      const r = original.apply(this, args);
      try { History.snapshot(); } catch (e) { console.warn('APP snapshot failed', e); }
      try { History.render(); } catch (e) { /* ignore */ }
      return r;
    };
    window._appHooked = true;
  }

  /* Initial render of all panels (if mounted) */
  History.render();
  Coach.renderInsights();
  Wiki.render();
  Canvas.render();

  /* Wire tab switches to re-render + toggle history visibility */
  const histBox = document.getElementById('appHistContainer');
  function syncHistVisibility(p) {
    if (histBox) histBox.style.display = (p === 'analyzer') ? '' : 'none';
  }
  syncHistVisibility(document.querySelector('.tab.on')?.getAttribute('data-p') || 'analyzer');
  document.querySelectorAll('.tab').forEach(t => {
    t.addEventListener('click', () => {
      const p = t.getAttribute('data-p');
      syncHistVisibility(p);
      setTimeout(() => {
        if (p === 'analyzer') History.render();
        if (p === 'coach') Coach.renderInsights();
        if (p === 'wiki') Wiki.render();
        if (p === 'canvas') Canvas.render();
      }, 50);
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

/* Public CLI · window.APP.* */
return {
  /* F1 · History */
  list: () => store.getAll(),
  get: id => store.get(id),
  load: id => History.load(id),
  current: () => (typeof S !== 'undefined' && S.analyzed) ? History.snapshot() : null,
  clear: () => { store.saveAll([]); History.render(); },
  exportAll: () => JSON.stringify(store.getAll(), null, 2),
  /* F2 · Clipper */
  showClipper: () => Clipper.showModal(),
  bookmarklet: () => Clipper.bookmarkletCode(),
  /* F3 · Coach */
  setOutcome: (id, outcome) => { const e = store.get(id); if (e) { e.outcome = { ...e.outcome, ...outcome }; store.upsert(e); Coach.renderInsights(); History.render(); return e; } },
  insights: () => Coach.computeInsights(),
  openOutcome: id => Coach.openOutcomeEditor(id),
  /* F4 · Wiki */
  concepts: () => Wiki.computeConcepts(),
  /* F5 · Canvas */
  renderCanvas: () => Canvas.render(),
  /* Bridges to existing weavers */
  analyze: () => typeof runAnalysis === 'function' && runAnalysis(),
  weaveCV: () => typeof CVWeaver !== 'undefined' && CVWeaver.autoProfile(),
  weaveCover: () => typeof CoverWeaver !== 'undefined' && CoverWeaver.autoRedact(),
  weaveInterview: () => typeof InterviewWeaver !== 'undefined' && InterviewWeaver.autoPrep(),
  weavePrompts: () => typeof PromptWeaver !== 'undefined' && PromptWeaver.generate(),
  /* Inbox · accept a JD from external source (agents, scrapers) */
  inbox: (payload) => {
    const set = (id, v) => { const el = document.getElementById(id); if (el && v) el.value = v; };
    set('inCompany', payload.company || '');
    set('inRole', payload.role || '');
    set('inUrl', payload.url || '');
    set('inSalary', payload.salary || '');
    set('inJD', payload.jd || '');
    showTab('analyzer');
    if (payload.autoAnalyze !== false && payload.jd && payload.jd.length > 50) {
      setTimeout(() => { if (typeof runAnalysis === 'function') runAnalysis(); }, 200);
    }
    return true;
  }
};
})();

window.APP = APP;
