// ══════════════════════════════════════════════════════════════
// ATS ENGINE v2.0 — Synonym-Aware Skill Matching
// Loaded BEFORE apply.html inline script
// Exposes: ATS.init(), ATS.match(jdText), ATS.score(result)
// ══════════════════════════════════════════════════════════════

const ATS = (() => {
  let _db = null;       // parsed my-skills.json
  let _index = [];      // [{canonical, lv, yr, weight, cat, catLabel, catColor, patterns:[RegExp]}]
  let _gapPatterns = []; // [RegExp] for known gaps
  let _ready = false;

  // ── INIT: fetch JSON and build index ──
  async function init(jsonPath) {
    if (_ready) return true;
    try {
      const basePath = jsonPath || detectBasePath() + 'data/my-skills.json';
      const res = await fetch(basePath);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      _db = await res.json();
      _buildIndex();
      _ready = true;
      console.log('[ATS] Engine ready —', _index.length, 'skills indexed,', _gapPatterns.length, 'gaps');
      return true;
    } catch (e) {
      console.error('[ATS] Init failed:', e);
      return false;
    }
  }

  function detectBasePath() {
    // Works for both local and GitHub Pages
    const path = window.location.pathname;
    const idx = path.lastIndexOf('/');
    return path.substring(0, idx + 1);
  }

  // ── BUILD SEARCH INDEX ──
  function _buildIndex() {
    _index = [];
    const cats = _db.categories;
    for (const catId in cats) {
      const cat = cats[catId];
      const skills = cat.skills;
      for (const canonical in skills) {
        const s = skills[canonical];
        // Build regex patterns: canonical name + all synonyms
        const allTerms = [canonical, ...(s.syn || [])];
        const patterns = allTerms.map(t => {
          // Escape regex special chars, create word-boundary-aware pattern
          const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          // For short terms (≤3 chars like "AP", "GL"), require word boundaries
          // For longer terms, use includes-style matching
          if (t.length <= 3) {
            return new RegExp('\\b' + escaped + '\\b', 'i');
          }
          return new RegExp(escaped, 'i');
        });

        _index.push({
          canonical,
          lv: s.lv,
          yr: s.yr,
          weight: s.weight || 5,
          cat: catId,
          catLabel: cat.label,
          catIcon: cat.icon,
          catColor: cat.color,
          patterns
        });
      }
    }

    // Build gap patterns
    _gapPatterns = (_db.gaps || []).map(g => {
      const escaped = g.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return { term: g, rx: new RegExp('\\b' + escaped + '\\b', 'i') };
    });
  }

  // ── MAIN MATCH FUNCTION ──
  function match(jdText) {
    if (!_ready) {
      console.warn('[ATS] Engine not initialized. Call ATS.init() first.');
      return { found: [], missing: [], byCat: {}, totalWeight: 0, matchedWeight: 0 };
    }

    const found = [];
    const matched = new Set(); // track canonical names already matched

    // Phase 1: Match skills (canonical + synonyms)
    for (const entry of _index) {
      if (matched.has(entry.canonical)) continue;

      let hitTerm = null;
      for (const rx of entry.patterns) {
        if (rx.test(jdText)) {
          hitTerm = jdText.match(rx)?.[0] || entry.canonical;
          break;
        }
      }

      if (hitTerm) {
        matched.add(entry.canonical);
        found.push({
          name: entry.canonical,
          matchedAs: hitTerm,
          lv: entry.lv,
          yr: entry.yr,
          weight: entry.weight,
          cat: entry.cat,
          catLabel: entry.catLabel,
          catIcon: entry.catIcon,
          catColor: entry.catColor
        });
      }
    }

    // Phase 2: Detect gaps (skills JD asks for that I don't have)
    const missing = [];
    for (const gap of _gapPatterns) {
      if (gap.rx.test(jdText)) {
        missing.push(gap.term);
      }
    }

    // Phase 3: Group by category
    const byCat = {};
    for (const f of found) {
      if (!byCat[f.cat]) byCat[f.cat] = { label: f.catLabel, icon: f.catIcon, color: f.catColor, skills: [] };
      byCat[f.cat].skills.push(f);
    }

    // Phase 4: Calculate weighted scores
    const totalWeight = found.reduce((s, f) => s + f.weight, 0) + missing.length * 5;
    const matchedWeight = found.reduce((s, f) => s + f.weight, 0);

    // Sort found by weight descending
    found.sort((a, b) => b.weight - a.weight);

    return { found, missing, byCat, totalWeight, matchedWeight };
  }

  // ── ATS SCORE CALCULATOR ──
  function score(matchResult, langCount, tacticalCount, isRemote) {
    langCount = langCount || 0;
    tacticalCount = tacticalCount || 0;

    const { found, missing, matchedWeight, totalWeight } = matchResult;

    // Weighted match percentage (not just count-based)
    const weightedPct = totalWeight > 0 ? Math.round((matchedWeight / totalWeight) * 100) : 50;

    // Count-based percentage (legacy compatibility)
    const total = found.length + missing.length;
    const countPct = total > 0 ? Math.round((found.length / total) * 100) : 50;

    // Blended match score: 60% weighted + 40% count
    let matchPct = Math.round(weightedPct * 0.6 + countPct * 0.4);
    matchPct += langCount * 3;
    matchPct += tacticalCount * 1;
    if (isRemote) matchPct += 3;
    matchPct = Math.min(95, Math.max(10, matchPct));

    // ATS keyword density score
    const kwDensity = found.length / Math.max(1, total);
    const langBonus = langCount * 0.05;
    const tactBonus = tacticalCount * 0.02;
    const atsPct = Math.min(98, Math.round((kwDensity * 0.7 + langBonus + tactBonus + 0.1) * 100));

    // Category breakdown scores
    const catScores = {};
    for (const f of found) {
      if (!catScores[f.cat]) catScores[f.cat] = { matched: 0, label: f.catLabel, icon: f.catIcon };
      catScores[f.cat].matched++;
    }

    return { matchPct, atsPct, weightedPct, countPct, catScores };
  }

  // ── RENDER: ATS Semaphore UI ──
  function renderSemaphore(matchResult, scores) {
    const { found, missing, byCat } = matchResult;

    let html = '<div id="atsSemaphore" style="margin-top:14px">';

    // ── Category breakdown bars ──
    html += '<div style="margin-bottom:14px">';
    for (const catId in byCat) {
      const cat = byCat[catId];
      const count = cat.skills.length;
      html += `<div style="margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
          <span style="font-size:11px;font-weight:600">${cat.icon} ${cat.label}</span>
          <span style="font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:700;color:${cat.color}">${count} skills</span>
        </div>
        <div style="height:6px;background:var(--el);border-radius:3px;overflow:hidden">
          <div style="height:100%;width:${Math.min(100, count * 12)}%;background:${cat.color};border-radius:3px;transition:width .4s ease"></div>
        </div>
      </div>`;
    }
    html += '</div>';

    // ── Matched skills (green tags) ──
    if (found.length) {
      html += `<div style="font-size:12px;font-weight:700;color:var(--gn);margin-bottom:6px">✓ MATCH — Skills detectados (${found.length})</div>`;
      html += '<div style="margin-bottom:10px">';
      for (const f of found) {
        const synonymNote = f.matchedAs.toLowerCase() !== f.name.toLowerCase()
          ? ` <small style="opacity:.6">via "${f.matchedAs}"</small>` : '';
        html += `<span class="sk sk-g" title="Nivel: ${f.lv}/5 · ${f.yr} años · Peso: ${f.weight} · ${f.catLabel}">${f.name} ${'★'.repeat(f.lv)}${synonymNote}</span> `;
      }
      html += '</div>';
    }

    // ── Missing skills (red tags) ──
    if (missing.length) {
      html += `<div style="font-size:12px;font-weight:700;color:var(--am);margin-bottom:6px">⚠ GAPS — Skills requeridos sin match (${missing.length})</div>`;
      html += '<div style="margin-bottom:10px">';
      for (const m of missing) {
        html += `<span class="sk sk-r">${m}</span> `;
      }
      html += '</div>';
    }

    // ── No gaps message ──
    if (!missing.length && found.length) {
      html += '<div style="font-size:11px;color:var(--gn);margin-bottom:10px">✅ Sin gaps detectados — Match completo con la vacante.</div>';
    }

    html += '</div>';
    return html;
  }

  // ── PUBLIC API ──
  return { init, match, score, renderSemaphore, isReady: () => _ready, getIndex: () => _index };
})();
