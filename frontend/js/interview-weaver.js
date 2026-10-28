// ══════════════════════════════════════════════════════════════
// INTERVIEW WEAVER — Deep Prep + Web Speech API TTS
// ══════════════════════════════════════════════════════════════
const InterviewWeaver = {
  data: null,
  ready: false,
  currentUtterance: null,
  currentPlayingId: null,

  async init(){
    try {
      const r = await fetch('data/my-interview-qa.json');
      this.data = await r.json();
      this.ready = true;
    } catch(e){ console.warn('InterviewWeaver: could not load Q&A data',e); }
  },

  // Score questions by relevance to the current JD
  scoreQuestion(q){
    if(!S.analyzed) return 0;
    const jdL = S.jd.toLowerCase();
    let score = 0;
    if(q.tags.includes('all')) score += 5;
    q.tags.forEach(t => { if(jdL.includes(t)) score += 3; });
    // Category boosts
    if(q.category === 'finance' && S.match.focusArea === 'fin') score += 4;
    if(q.category === 'tech' && S.match.focusArea === 'data') score += 4;
    if(q.category === 'remote' && S.match.remote) score += 5;
    return score;
  },

  // Get best Spanish voice available
  getSpanishVoice(){
    const voices = speechSynthesis.getVoices();
    // Priority order
    const preferred = ['google español', 'microsoft sabina', 'sabina', 'paulina', 'monica', 'español'];
    for(const pref of preferred){
      const v = voices.find(v => v.name.toLowerCase().includes(pref) && v.lang.startsWith('es'));
      if(v) return v;
    }
    // Fallback: any Spanish voice
    return voices.find(v => v.lang.startsWith('es')) || null;
  },

  // TTS: Speak text
  speak(text, id){
    if(!('speechSynthesis' in window)){ alert('Tu navegador no soporta Text-to-Speech.'); return; }

    // If clicking the same button that's playing, toggle pause/resume
    if(this.currentPlayingId === id){
      if(speechSynthesis.paused){
        speechSynthesis.resume();
        this.updateBtn(id, 'playing');
        return;
      }
      if(speechSynthesis.speaking){
        speechSynthesis.pause();
        this.updateBtn(id, 'paused');
        return;
      }
    }

    // Cancel any ongoing speech
    speechSynthesis.cancel();
    if(this.currentPlayingId) this.updateBtn(this.currentPlayingId, 'stopped');

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-CO';
    utterance.rate = 0.9;
    utterance.pitch = 1;

    const voice = this.getSpanishVoice();
    if(voice) utterance.voice = voice;

    utterance.onend = () => {
      this.updateBtn(id, 'stopped');
      this.currentPlayingId = null;
      this.currentUtterance = null;
    };
    utterance.onerror = () => {
      this.updateBtn(id, 'stopped');
      this.currentPlayingId = null;
    };

    this.currentUtterance = utterance;
    this.currentPlayingId = id;
    speechSynthesis.speak(utterance);
    this.updateBtn(id, 'playing');
  },

  // Update button state
  updateBtn(id, state){
    const btn = document.getElementById('tts-' + id);
    if(!btn) return;
    if(state === 'playing'){
      btn.innerHTML = '⏸️ Pausar';
      btn.style.background = 'var(--amg)';
      btn.style.color = 'var(--am)';
      btn.style.borderColor = 'rgba(234,179,8,.2)';
    } else if(state === 'paused'){
      btn.innerHTML = '▶️ Reanudar';
      btn.style.background = 'var(--gg)';
      btn.style.color = 'var(--gn)';
      btn.style.borderColor = 'rgba(34,197,94,.2)';
    } else {
      btn.innerHTML = '▶️ Escuchar';
      btn.style.background = '';
      btn.style.color = '';
      btn.style.borderColor = '';
    }
  },

  // Render a single Q&A block
  renderQA(q, idx, lang){
    const isES = lang === 'es';
    const question = isES ? q.q_es : q.q_en;
    const answer = isES ? q.a_es : q.a_en;
    const answerClean = answer.replace(/\[Company\]/g, S.company || 'la empresa');
    const qClean = question.replace(/\[Company\]/g, S.company || 'la empresa');
    const ttsId = `${lang}-${q.id}`;

    return `<div style="background:var(--el);border:1px solid var(--bd);border-radius:10px;padding:16px;margin-bottom:8px;cursor:pointer" onclick="this.querySelector('.iw-answer').classList.toggle('show');this.querySelector('.iw-tip')?.classList.toggle('show')">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
        <div style="font-size:13px;font-weight:600;color:var(--tx)">${idx}. "${qClean}"</div>
        <span class="sk sk-${q.category==='finance'?'g':q.category==='tech'?'c':q.category==='remote'?'v':'y'}" style="flex-shrink:0;font-size:9px">${q.category}</span>
      </div>
      <div class="iw-answer" style="display:none;font-size:12px;color:var(--t2);line-height:1.6;margin-top:8px;white-space:pre-wrap">${answerClean}</div>
      <div class="iw-tip" style="display:none;margin-top:8px">
        <button id="tts-${ttsId}" class="btn bo bs" style="font-size:10px" onclick="event.stopPropagation();InterviewWeaver.speak(\`${answerClean.replace(/`/g,"'").replace(/\\/g,"\\\\")}\`,'${ttsId}')">▶️ Escuchar</button>
      </div>
    </div>`;
  },

  // Main render
  autoPrep(){
    if(!S.analyzed){ alert('Analiza una vacante primero.'); return; }
    if(!this.ready){ alert('Q&A data no cargada.'); return; }

    // Score and sort all questions
    const allQ = [...this.data.behavioral, ...this.data.technical];
    const scored = allQ.map(q => ({...q, score: this.scoreQuestion(q)}));
    scored.sort((a, b) => b.score - a.score);

    // Split: top behavioral and top technical
    const topBehavioral = scored.filter(q => this.data.behavioral.find(b => b.id === q.id)).slice(0, 5);
    const topTechnical = scored.filter(q => this.data.technical.find(t => t.id === q.id)).slice(0, 5);

    const matchedTags = S.match.found.map(s => s.name).slice(0, 6).join(', ');

    let html = `<div style="background:var(--el);border:1px solid rgba(139,92,246,.15);border-radius:10px;padding:14px;margin-bottom:12px">
      <div style="font-size:12px;font-weight:700;color:var(--a2);margin-bottom:4px">🎯 Interview Weaver — ${S.role} @ ${S.company}</div>
      <div style="font-size:10px;color:var(--t2)">Preguntas rankeadas por relevancia al JD. Tags match: <strong style="color:var(--gn)">${matchedTags}</strong></div>
      <div style="font-size:10px;color:var(--t3);margin-top:4px">Click en una pregunta para ver la respuesta. ▶️ para escuchar con Text-to-Speech.</div>
    </div>`;

    // Español section
    html += `<div class="card"><div class="card-t">🇪🇸 Preguntas Conductuales (Español)</div>`;
    topBehavioral.forEach((q, i) => { html += this.renderQA(q, i + 1, 'es'); });
    html += `</div>`;

    html += `<div class="card"><div class="card-t">🇪🇸 Preguntas Técnicas (Español)</div>`;
    topTechnical.forEach((q, i) => { html += this.renderQA(q, i + 1, 'es'); });
    html += `</div>`;

    // English section
    html += `<div class="card"><div class="card-t">🇺🇸 Behavioral Questions (English)</div>`;
    topBehavioral.forEach((q, i) => { html += this.renderQA(q, i + 1, 'en'); });
    html += `</div>`;

    html += `<div class="card"><div class="card-t">🇺🇸 Technical Questions (English)</div>`;
    topTechnical.forEach((q, i) => { html += this.renderQA(q, i + 1, 'en'); });
    html += `</div>`;

    document.getElementById('interviewWeaverContent').innerHTML = html;

    // Preload voices (needed for some browsers)
    if('speechSynthesis' in window) speechSynthesis.getVoices();
  }
};

InterviewWeaver.init();
// Voices load async in Chrome — preload
if('speechSynthesis' in window) speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
