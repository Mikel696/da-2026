// ══════════════════════════════════════════════════════════════
// COVER WEAVER — Dynamic Cover Letter & Msgs Generator
// ══════════════════════════════════════════════════════════════
const CoverWeaver = {
  data: null,
  ready: false,

  async init(){
    try {
      const r = await fetch('data/my-cover-templates.json');
      this.data = await r.json();
      this.ready = true;
    } catch(e){ console.warn('CoverWeaver: could not load templates',e); }
  },

  // Select template based on detected tone
  selectTemplate(tone){
    if(!this.data) return null;
    const t = this.data.templates;
    if(tone === 'casual' && t.startup) return t.startup;
    return t.formal;
  },

  // Weave {kw:}, {company}, {role}, {focus_skill}, {name} placeholders
  weave(text, matchedNames, company, role, focus, lang){
    const focusSkills = this.data.focus_skills[focus] || this.data.focus_skills.hybrid;
    let result = text
      .replace(/\{company\}/g, company || 'la empresa')
      .replace(/\{role\}/g, role || 'el puesto')
      .replace(/\{name\}/g, '[Nombre]')
      .replace(/\{focus_skill\}/g, lang === 'en' ? focusSkills.en : focusSkills.es);

    // Weave {kw:keyword} — bold if matched
    const lowerMatched = matchedNames.map(n => n.toLowerCase());
    result = result.replace(/\{kw:([^}]+)\}/g, (_, kw) => {
      const isMatched = lowerMatched.some(m =>
        kw.toLowerCase().includes(m) || m.includes(kw.toLowerCase())
      );
      return isMatched ? `<strong>${kw}</strong>` : kw;
    });
    return result;
  },

  // Build full cover letter HTML
  buildCover(lang){
    if(!this.ready || !S.analyzed) return '';
    const tone = S.profile.toneMatch || 'formal';
    const tpl = this.selectTemplate(tone);
    if(!tpl) return '';

    const matched = S.match.found.map(s => s.name);
    const co = S.company, ro = S.role;
    const focus = typeof CVWeaver !== 'undefined' ? CVWeaver.detectFocus(S.match.found) : 'hybrid';
    const t = lang === 'en' ? tpl.en : tpl.es;

    const greeting = this.weave(t.greeting, matched, co, ro, focus, lang);
    const intro = this.weave(t.intro, matched, co, ro, focus, lang);
    const p1 = this.weave(t.body_p1, matched, co, ro, focus, lang);
    const p2 = this.weave(t.body_p2, matched, co, ro, focus, lang);
    const close = this.weave(t.close, matched, co, ro, focus, lang);

    return `${greeting}\n\n${intro}\n\n${p1}\n\n${p2}\n\n${close}`;
  },

  // Build application message
  buildAppMsg(lang){
    if(!this.ready || !S.analyzed) return '';
    const matched = S.match.found.map(s => s.name);
    const focus = typeof CVWeaver !== 'undefined' ? CVWeaver.detectFocus(S.match.found) : 'hybrid';
    const tpl = lang === 'en' ? this.data.application_message.en : this.data.application_message.es;
    return this.weave(tpl, matched, S.company, S.role, focus, lang);
  },

  // Build LinkedIn message
  buildLinkedIn(lang){
    if(!this.ready || !S.analyzed) return '';
    const matched = S.match.found.map(s => s.name);
    const focus = typeof CVWeaver !== 'undefined' ? CVWeaver.detectFocus(S.match.found) : 'hybrid';
    const tpl = lang === 'en' ? this.data.linkedin_message.en : this.data.linkedin_message.es;
    return this.weave(tpl, matched, S.company, S.role, focus, lang);
  },

  // Copy text from an element
  copyFrom(id){
    const el = document.getElementById(id);
    if(!el) return;
    const text = (el.innerText || el.textContent).trim();
    const done = () => { const btn=el.parentElement?.querySelector('.copy-btn'); if(btn){const o=btn.innerHTML;btn.innerHTML='✅ Copiado!';setTimeout(()=>{btn.innerHTML=o;},2000);} };
    const fallback = () => { const ta=document.createElement('textarea');ta.value=text;ta.style.cssText='position:fixed;top:-999px;opacity:0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy')}catch(_){}document.body.removeChild(ta);done(); };
    if(navigator.clipboard){ navigator.clipboard.writeText(text).then(done).catch(fallback); } else { fallback(); }
  },

  // Main render: auto-generate all cover content
  autoRedact(){
    if(!S.analyzed){ alert('Analiza una vacante primero.'); return; }
    if(!this.ready){ alert('Templates no cargados.'); return; }

    const tone = S.profile.toneMatch || 'formal';
    const focus = typeof CVWeaver !== 'undefined' ? CVWeaver.detectFocus(S.match.found) : 'hybrid';
    const matchedKws = S.match.found.map(s => s.name).slice(0, 8).join(', ');

    let html = `<div style="background:var(--el);border:1px solid rgba(139,92,246,.15);border-radius:10px;padding:14px;margin-bottom:12px">
      <div style="font-size:12px;font-weight:700;color:var(--a2);margin-bottom:4px">✉️ Cover Weaver — Tono: ${tone.toUpperCase()} · Perfil: ${focus.toUpperCase()}</div>
      <div style="font-size:10px;color:var(--t2)">Keywords tejidas: <strong style="color:var(--gn)">${matchedKws}</strong></div>
    </div>`;

    // Cover Letter EN
    html += `<div class="card"><div class="card-t">✉️ Cover Letter — English (${S.company}) <span class="sk sk-v">${tone}</span></div>
    <div id="cover-en" contenteditable="true" style="background:var(--el);border:1px solid var(--bd);border-radius:8px;padding:14px;font-size:11px;color:var(--t2);line-height:1.7;white-space:pre-wrap;min-height:120px">${this.buildCover('en')}</div>
    <button class="btn bo bs copy-btn" style="margin-top:8px" onclick="CoverWeaver.copyFrom('cover-en')">📋 Copiar</button></div>`;

    // Cover Letter ES
    html += `<div class="card"><div class="card-t">✉️ Carta — Español (${S.company})</div>
    <div id="cover-es" contenteditable="true" style="background:var(--el);border:1px solid var(--bd);border-radius:8px;padding:14px;font-size:11px;color:var(--t2);line-height:1.7;white-space:pre-wrap;min-height:120px">${this.buildCover('es')}</div>
    <button class="btn bo bs copy-btn" style="margin-top:8px" onclick="CoverWeaver.copyFrom('cover-es')">📋 Copiar</button></div>`;

    // Application Message
    html += `<div class="card"><div class="card-t">💬 Mensaje de Aplicación (Portal)</div>
    <div id="msg-app-w" contenteditable="true" style="background:var(--el);border:1px solid var(--bd);border-radius:8px;padding:14px;font-size:11px;color:var(--t2);line-height:1.7;white-space:pre-wrap;min-height:80px">${this.buildAppMsg('en')}</div>
    <button class="btn bo bs copy-btn" style="margin-top:8px" onclick="CoverWeaver.copyFrom('msg-app-w')">📋 Copiar</button></div>`;

    // LinkedIn Message
    html += `<div class="card"><div class="card-t">🔗 Mensaje LinkedIn Networking</div>
    <div id="msg-ln-w" contenteditable="true" style="background:var(--el);border:1px solid var(--bd);border-radius:8px;padding:14px;font-size:11px;color:var(--t2);line-height:1.7;white-space:pre-wrap;min-height:60px">${this.buildLinkedIn('en')}</div>
    <button class="btn bo bs copy-btn" style="margin-top:8px" onclick="CoverWeaver.copyFrom('msg-ln-w')">📋 Copiar</button></div>`;

    document.getElementById('coverWeaverContent').innerHTML = html;
  }
};

CoverWeaver.init();
