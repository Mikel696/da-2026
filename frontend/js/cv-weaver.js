// ══════════════════════════════════════════════════════════════
// SMART CV WEAVER — Dynamic Profiler & PDF Export
// ══════════════════════════════════════════════════════════════
const CVWeaver = {
  cvData: null,
  ready: false,

  async init(){
    try {
      const r = await fetch('data/my-base-cv.json');
      this.cvData = await r.json();
      this.ready = true;
    } catch(e){ console.warn('CVWeaver: could not load base CV',e); }
  },

  // Determine best profile focus from ATS match categories
  detectFocus(matchedSkills){
    const w = {accounting:0, data_entry:0, hybrid:0};
    matchedSkills.forEach(s => {
      const cat = s.cat || '';
      if(cat === 'fin') w.accounting += (s.weight||1);
      else if(cat === 'tech' && /data.entry|typing|speed|accuracy|sla/i.test(s.name)) w.data_entry += (s.weight||1);
      else if(cat === 'tech') w.hybrid += (s.weight||1);
      else w.hybrid += (s.weight||0.5);
    });
    if(w.accounting >= w.data_entry && w.accounting >= w.hybrid) return 'accounting';
    if(w.data_entry > w.accounting && w.data_entry >= w.hybrid) return 'data_entry';
    return 'hybrid';
  },

  // Weave {kw:keyword} placeholders — bold if matched, plain if not
  weaveKeywords(text, matchedNames){
    const lowerMatched = matchedNames.map(n => n.toLowerCase());
    return text.replace(/\{kw:([^}]+)\}/g, (_, kw) => {
      const isMatched = lowerMatched.some(m =>
        kw.toLowerCase().includes(m) || m.includes(kw.toLowerCase())
      );
      return isMatched ? `<strong>${kw}</strong>` : kw;
    });
  },

  // Build skill tags HTML
  buildSkillTags(skills, matchedNames){
    const lower = matchedNames.map(n=>n.toLowerCase());
    return skills.map(s => {
      const matched = lower.some(m => s.toLowerCase().includes(m) || m.includes(s.toLowerCase()));
      return `<span style="display:inline-block;font-size:10px;padding:2px 6px;border-radius:3px;margin:1px;${matched?'background:#e0e7ff;color:#312e81;font-weight:600':'background:#f3f4f6;color:#6b7280'}">${s}</span>`;
    }).join(' ');
  },

  // Generate the full profiled CV HTML
  generate(lang){
    if(!this.ready || !this.cvData) return '<p>CV data not loaded.</p>';
    if(!S.analyzed) return '<p>Analiza una vacante primero.</p>';

    const d = this.cvData;
    const matched = S.match.found.map(s => s.name);
    const focus = this.detectFocus(S.match.found);
    const isEN = lang === 'en';
    const co = d.contact;

    // Select summary
    const summaryRaw = isEN ? d.summaries[focus].en : d.summaries[focus].es;
    const summary = this.weaveKeywords(summaryRaw, matched);

    // Select Brinks title & bullets
    const brinks = d.experience[0];
    const titleKey = focus + (isEN ? '_en' : '_es');
    const brTitle = brinks.titles[titleKey] || brinks.titles['hybrid' + (isEN?'_en':'_es')];
    const brBullets = brinks.bullets[titleKey] || brinks.bullets['hybrid' + (isEN?'_en':'_es')];
    const brSub = isEN ? brinks.subtitle_en : brinks.subtitle_es;
    const brDate = isEN ? brinks.date_en : brinks.date_es;

    // Teleperformance & Express
    const tp = d.experience[1];
    const ex = d.experience[2];

    // Skills
    const pool = d.skills_pool;
    const priSkills = focus === 'accounting' ? pool.accounting :
                      focus === 'data_entry' ? pool.data_entry : pool.tech;
    const secSkills = focus === 'accounting' ? pool.tech :
                      focus === 'data_entry' ? pool.tech : pool.accounting;

    // Education & Languages
    const edu = isEN ? d.education.en : d.education.es;
    const langs = d.languages;
    const achv = isEN ? d.achievements.en : d.achievements.es;

    // Role headline
    const roleHeadline = S.role && S.role !== 'el puesto'
      ? S.role
      : (isEN ? 'Financial & Data Analyst' : 'Analista Financiero & Datos');

    const remoteLabel = S.match.remote ? (isEN ? ' · Open to Remote' : ' · Disponible Remoto') : '';

    return `
    <div style="font-family:'IBM Plex Sans',sans-serif;color:#1a1a1a;background:#fff;max-width:800px;margin:0 auto">
      <!-- HEADER -->
      <div style="background:linear-gradient(135deg,#1e1b4b,#312e81);color:#fff;padding:24px 28px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-family:'Newsreader',serif;font-size:24px;font-weight:600">${co.name}</div>
            <div style="font-size:12px;color:#c7d2fe;margin-top:2px">${roleHeadline}${remoteLabel}</div>
          </div>
          <div style="text-align:right;font-size:10px;color:#c7d2fe;line-height:1.8">
            📱 ${co.phone}<br>📧 ${co.email}<br>🔗 ${co.linkedin}<br>📍 ${co.location}
          </div>
        </div>
      </div>

      <!-- BODY -->
      <div style="padding:22px 28px">
        <div style="display:flex;gap:24px">
          <!-- MAIN COLUMN -->
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#312e81;border-bottom:2px solid #e0e7ff;padding-bottom:3px;margin-bottom:8px">${isEN?'Professional Summary':'Perfil Profesional'}</div>
            <div style="font-size:11px;line-height:1.6;color:#374151;margin-bottom:12px">${summary}</div>

            <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#312e81;border-bottom:2px solid #e0e7ff;padding-bottom:3px;margin-bottom:8px">${isEN?'Professional Experience':'Experiencia Profesional'}</div>

            <!-- Brinks -->
            <div style="font-size:12px;font-weight:600">${brTitle}</div>
            <div style="font-size:11px;color:#6366f1;font-weight:500">${brinks.company} (${brSub})</div>
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">${brDate}</div>
            <ul style="list-style:none;margin:4px 0 10px;padding:0">${brBullets.map(b =>
              `<li style="font-size:10px;color:#374151;padding:1px 0 1px 10px;position:relative;line-height:1.5"><span style="position:absolute;left:0;color:#6366f1">▸</span>${this.weaveKeywords(b, matched)}</li>`
            ).join('')}</ul>

            <!-- Teleperformance -->
            <div style="font-size:12px;font-weight:600">${isEN?tp.title_en:tp.title_es}</div>
            <div style="font-size:11px;color:#6366f1;font-weight:500">${tp.company}</div>
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">${isEN?tp.date_en:tp.date_es}</div>
            <ul style="list-style:none;margin:4px 0 10px;padding:0">${(isEN?tp.bullets_en:tp.bullets_es).map(b =>
              `<li style="font-size:10px;color:#374151;padding:1px 0 1px 10px;position:relative;line-height:1.5"><span style="position:absolute;left:0;color:#6366f1">▸</span>${this.weaveKeywords(b, matched)}</li>`
            ).join('')}</ul>

            <!-- Express -->
            <div style="font-size:12px;font-weight:600">${isEN?ex.title_en:ex.title_es}</div>
            <div style="font-size:11px;color:#6366f1;font-weight:500">${ex.company}</div>
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">${isEN?ex.date_en:ex.date_es}</div>
            <ul style="list-style:none;margin:4px 0 10px;padding:0">${(isEN?ex.bullets_en:ex.bullets_es).map(b =>
              `<li style="font-size:10px;color:#374151;padding:1px 0 1px 10px;position:relative;line-height:1.5"><span style="position:absolute;left:0;color:#6366f1">▸</span>${this.weaveKeywords(b, matched)}</li>`
            ).join('')}</ul>

            <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#312e81;border-bottom:2px solid #e0e7ff;padding-bottom:3px;margin-bottom:8px">${isEN?'Education':'Educación'}</div>
            ${edu.map(e => `<div style="font-size:12px;font-weight:600">${e.title}</div>${e.date?'<div style="font-size:10px;color:#6b7280">'+e.date+'</div>':''}`).join('')}
          </div>

          <!-- SIDEBAR -->
          <div style="width:220px;flex-shrink:0;border-left:1px solid #e5e7eb;padding-left:20px">
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#312e81;margin-bottom:6px">${isEN?(focus==='accounting'?'Core AP Competencies':'Technical Skills'):(focus==='accounting'?'Competencias AP':'Habilidades Técnicas')}</div>
            ${this.buildSkillTags(priSkills, matched)}

            <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#312e81;margin:12px 0 6px">${isEN?(focus==='accounting'?'Technical Skills':'Analytical Tools'):(focus==='accounting'?'Habilidades Técnicas':'Herramientas')}</div>
            ${this.buildSkillTags(secSkills, matched)}

            <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#312e81;margin:12px 0 6px">${isEN?'Languages':'Idiomas'}</div>
            ${langs.map(l => `
              <div style="font-size:10px;color:#374151;margin-top:4px">${isEN?l.name_en:l.name_es} — ${isEN?l.level_en:l.level_es}</div>
              <div style="height:3px;background:#e5e7eb;border-radius:2px;margin-top:1px"><div style="height:100%;border-radius:2px;background:#6366f1;width:${l.pct}%"></div></div>
            `).join('')}

            <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#312e81;margin:12px 0 6px">${isEN?'Key Achievements':'Logros'}</div>
            ${achv.map(a => `<div style="font-size:10px;color:#374151;padding:1px 0;display:flex;align-items:center;gap:5px"><span style="width:5px;height:5px;border-radius:50%;background:#22c55e;flex-shrink:0"></span>${a}</div>`).join('')}
          </div>
        </div>
      </div>
    </div>`;
  },

  // Render into the preview canvas
  renderPreview(lang){
    const canvas = document.getElementById('cv-preview-canvas');
    if(!canvas) return;
    canvas.innerHTML = this.generate(lang || 'en');
  },

  // Auto-profile: generate both versions
  autoProfile(){
    if(!S.analyzed){ alert('Analiza una vacante primero.'); return; }
    const focus = this.detectFocus(S.match.found);
    const matchedKws = S.match.found.map(s=>s.name).join(', ');

    let html = `<div style="background:var(--el);border:1px solid rgba(139,92,246,.15);border-radius:10px;padding:14px;margin-bottom:12px">
      <div style="font-size:12px;font-weight:700;color:var(--a2);margin-bottom:4px">🧠 Smart CV Weaver — Perfil: ${focus.toUpperCase()}</div>
      <div style="font-size:10px;color:var(--t2)">Keywords tejidas: <strong style="color:var(--gn)">${matchedKws}</strong></div>
      <div style="font-size:10px;color:var(--t3);margin-top:4px">ATS Score: ${S.match.ats}% · Match: ${S.match.pct}% · ${S.match.found.length} skills encontrados</div>
    </div>
    <div style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap">
      <button class="btn bp bs" onclick="CVWeaver.renderPreview('en')">🇺🇸 English</button>
      <button class="btn bg bs" onclick="CVWeaver.renderPreview('es')">🇪🇸 Español</button>
      <button class="btn bo bs" onclick="CVWeaver.exportPDF()">📄 Descargar PDF</button>
    </div>`;
    document.getElementById('cvWeaverToolbar').innerHTML = html;
    this.renderPreview('en');
  },

  // Export to PDF via html2pdf
  exportPDF(){
    const canvas = document.getElementById('cv-preview-canvas');
    if(!canvas || !canvas.innerHTML.trim()){ alert('Genera el CV primero.'); return; }
    if(typeof html2pdf === 'undefined'){ alert('html2pdf no cargado. Revisa la conexión.'); return; }

    const name = S.company && S.company !== 'la empresa'
      ? `CV_MiguelBarros_${S.company.replace(/\s+/g,'_')}`
      : 'CV_MiguelBarros_Profiled';

    html2pdf().set({
      margin: 0,
      filename: name + '.pdf',
      image: { type:'jpeg', quality:0.98 },
      html2canvas: { scale:2, useCORS:true, letterRendering:true },
      jsPDF: { unit:'mm', format:'a4', orientation:'portrait' }
    }).from(canvas).save();
  }
};

// Init on load
CVWeaver.init();
