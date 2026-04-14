// ══════════════════════════════════════════════════════════════
// ENGLISH INTERVIEW DOJO — TTS + STT Shadowing Engine
// Uses Web Speech API (speechSynthesis + webkitSpeechRecognition)
// ══════════════════════════════════════════════════════════════
const Dojo = {
  data: null,
  ready: false,
  currentCat: 'recruiter',
  recognition: null,
  recognizing: false,
  currentTTSId: null,
  sessionsCompleted: 0,
  questionsAnswered: 0,

  async init(){
    try {
      const r = await fetch('data/english-dojo.json');
      this.data = await r.json();
      this.ready = true;
      this.loadStats();
      this.render();
    } catch(e){ console.warn('Dojo: could not load data', e); }
  },

  loadStats(){
    try {
      const s = JSON.parse(localStorage.getItem('dojo_stats')||'{}');
      this.sessionsCompleted = s.sessions || 0;
      this.questionsAnswered = s.answered || 0;
    } catch(e){}
  },

  saveStats(){
    localStorage.setItem('dojo_stats', JSON.stringify({
      sessions: this.sessionsCompleted,
      answered: this.questionsAnswered
    }));
  },

  // ── TTS: Read recruiter question aloud ──────────
  getUSVoice(){
    const voices = speechSynthesis.getVoices();
    const preferred = ['google us', 'microsoft zira', 'microsoft david', 'samantha', 'alex', 'english'];
    for(const pref of preferred){
      const v = voices.find(v => v.name.toLowerCase().includes(pref) && v.lang.startsWith('en'));
      if(v) return v;
    }
    return voices.find(v => v.lang.startsWith('en-US')) || voices.find(v => v.lang.startsWith('en')) || null;
  },

  speakQuestion(text, qId){
    if(!('speechSynthesis' in window)){ alert('Your browser does not support Text-to-Speech.'); return; }

    const btnId = 'tts-' + qId;
    const btn = document.getElementById(btnId);

    // Toggle if same question
    if(this.currentTTSId === qId){
      if(speechSynthesis.speaking && !speechSynthesis.paused){
        speechSynthesis.pause();
        if(btn){ btn.innerHTML = '▶️ Resume'; btn.classList.remove('playing'); }
        return;
      }
      if(speechSynthesis.paused){
        speechSynthesis.resume();
        if(btn){ btn.innerHTML = '⏸️ Pause'; btn.classList.add('playing'); }
        return;
      }
    }

    // Cancel any ongoing
    speechSynthesis.cancel();
    this.resetAllTTSButtons();

    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'en-US';
    utt.rate = 0.85;
    utt.pitch = 1;
    const voice = this.getUSVoice();
    if(voice) utt.voice = voice;

    utt.onend = () => {
      this.currentTTSId = null;
      if(btn){ btn.innerHTML = '▶️ Listen'; btn.classList.remove('playing'); }
    };
    utt.onerror = () => {
      this.currentTTSId = null;
      if(btn){ btn.innerHTML = '▶️ Listen'; btn.classList.remove('playing'); }
    };

    this.currentTTSId = qId;
    speechSynthesis.speak(utt);
    if(btn){ btn.innerHTML = '⏸️ Pause'; btn.classList.add('playing'); }
  },

  resetAllTTSButtons(){
    document.querySelectorAll('.dojo-btn-tts').forEach(b => {
      b.innerHTML = '▶️ Listen';
      b.classList.remove('playing');
    });
    this.currentTTSId = null;
  },

  // ── STT: Record user's spoken answer ────────────
  startSTT(qId){
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(!SpeechRecognition){
      alert('Speech Recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    const textarea = document.getElementById('stt-' + qId);
    const btn = document.getElementById('stt-btn-' + qId);
    const dot = document.getElementById('stt-dot-' + qId);
    const status = document.getElementById('stt-status-' + qId);

    // Toggle off if already recording
    if(this.recognizing && this.recognition){
      this.recognition.stop();
      return;
    }

    // Stop TTS if playing
    if(speechSynthesis.speaking) speechSynthesis.cancel();
    this.resetAllTTSButtons();

    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'en-US';
    this.recognition.continuous = true;
    this.recognition.interimResults = true;

    let finalTranscript = textarea.value;

    this.recognition.onstart = () => {
      this.recognizing = true;
      if(btn){ btn.innerHTML = '⏹️ Stop Recording'; btn.classList.add('recording'); }
      if(dot) dot.classList.add('live');
      if(status) status.textContent = 'Listening...';
    };

    this.recognition.onresult = (event) => {
      let interim = '';
      for(let i = event.resultIndex; i < event.results.length; i++){
        if(event.results[i].isFinal){
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      if(textarea){
        textarea.value = finalTranscript + interim;
        textarea.scrollTop = textarea.scrollHeight;
      }
    };

    this.recognition.onerror = (event) => {
      console.warn('STT error:', event.error);
      if(event.error === 'not-allowed'){
        if(status) status.textContent = 'Microphone access denied. Check browser permissions.';
      }
    };

    this.recognition.onend = () => {
      this.recognizing = false;
      if(btn){ btn.innerHTML = '🎙️ Record Answer'; btn.classList.remove('recording'); }
      if(dot) dot.classList.remove('live');
      if(status) status.textContent = 'Recording stopped.';
      if(textarea) textarea.value = finalTranscript.trim();

      // Track answered
      if(finalTranscript.trim().length > 10){
        this.questionsAnswered++;
        this.saveStats();
        this.updateStatsUI();
      }
    };

    this.recognition.start();
  },

  // ── Show/Hide Ideal Answer ──────────────────────
  toggleIdeal(qId){
    const el = document.getElementById('ideal-' + qId);
    const btn = document.getElementById('show-btn-' + qId);
    if(!el) return;
    const showing = el.classList.toggle('show');
    if(btn) btn.innerHTML = showing ? '🙈 Hide Answer' : '👁️ Show Ideal Answer';
  },

  // ── Render ──────────────────────────────────────
  render(){
    const el = document.getElementById('dojoContent');
    if(!el || !this.ready) return;

    const cat = this.data.categories.find(c => c.id === this.currentCat);
    if(!cat){ el.innerHTML = '<div style="color:var(--t3);font-size:12px">Category not found.</div>'; return; }

    // Check browser support
    const hasTTS = 'speechSynthesis' in window;
    const hasSTT = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

    let html = '';

    // Stats bar
    html += `<div class="dojo-stats">
      <div class="dojo-stat"><div class="dojo-stat-v" style="color:var(--a2)">${cat.questions.length}</div><div class="dojo-stat-l">Questions</div></div>
      <div class="dojo-stat"><div class="dojo-stat-v" style="color:var(--gn)" id="dojoAnswered">${this.questionsAnswered}</div><div class="dojo-stat-l">Answered</div></div>
      <div class="dojo-stat"><div class="dojo-stat-v" style="color:var(--cy)">${hasTTS ? '✓' : '✗'}</div><div class="dojo-stat-l">TTS</div></div>
      <div class="dojo-stat"><div class="dojo-stat-v" style="color:${hasSTT ? 'var(--gn)' : 'var(--rd)'};">${hasSTT ? '✓' : '✗'}</div><div class="dojo-stat-l">STT</div></div>
    </div>`;

    if(!hasSTT){
      html += `<div class="dojo-warn">⚠️ <strong>Speech Recognition not supported</strong> in this browser. Use <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong> for the full microphone experience. TTS (listening) still works.</div>`;
    }

    // Category pills
    html += `<div class="dojo-cats">`;
    this.data.categories.forEach(c => {
      html += `<button class="dojo-cat${c.id===this.currentCat?' on':''}" onclick="Dojo.switchCat('${c.id}')">${c.icon} ${c.name}</button>`;
    });
    html += `</div>`;

    html += `<div style="font-size:11px;color:var(--t3);margin-bottom:16px;line-height:1.5">${cat.icon} <strong>${cat.name}</strong> — ${cat.description}</div>`;

    // Questions
    cat.questions.forEach((q, i) => {
      html += `<div class="dojo-q">
        <div class="dojo-q-num">Q${i+1} · ${cat.name}</div>
        <div class="dojo-q-text">"${this.esc(q.recruiter_says)}"</div>

        <div class="dojo-actions">
          <button id="tts-${q.id}" class="dojo-btn dojo-btn-tts" onclick="Dojo.speakQuestion('${this.escAttr(q.recruiter_says)}','${q.id}')">▶️ Listen</button>
          <button id="stt-btn-${q.id}" class="dojo-btn dojo-btn-stt" onclick="Dojo.startSTT('${q.id}')">🎙️ Record Answer</button>
          <button id="show-btn-${q.id}" class="dojo-btn dojo-btn-show" onclick="Dojo.toggleIdeal('${q.id}')">👁️ Show Ideal Answer</button>
        </div>

        <div class="dojo-stt-status"><div class="dojo-stt-dot" id="stt-dot-${q.id}"></div><span id="stt-status-${q.id}">Ready</span></div>
        <textarea class="dojo-transcript" id="stt-${q.id}" placeholder="Your spoken answer will appear here... Or type it manually."></textarea>

        <div class="dojo-q-tip"><b>💡 Tip:</b> ${this.esc(q.tips)}</div>

        <div class="dojo-ideal" id="ideal-${q.id}">
          <div class="dojo-ideal-label">✅ Ideal STAR Answer</div>
          <div class="dojo-ideal-text">${this.esc(q.ideal_answer)}</div>
        </div>

        <div class="dojo-tags">${q.tags.map(t => `<span class="dojo-tag">${t}</span>`).join('')}</div>
      </div>`;
    });

    el.innerHTML = html;
  },

  switchCat(catId){
    this.currentCat = catId;
    // Stop any active TTS/STT
    if(speechSynthesis.speaking) speechSynthesis.cancel();
    if(this.recognizing && this.recognition) this.recognition.stop();
    this.render();
  },

  updateStatsUI(){
    const el = document.getElementById('dojoAnswered');
    if(el) el.textContent = this.questionsAnswered;
  },

  esc(text){
    return (text||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  },

  escAttr(text){
    return (text||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'\\"');
  }
};

// Preload voices
if('speechSynthesis' in window) speechSynthesis.getVoices();
if('speechSynthesis' in window) speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();

// Init when DOM is ready (script loaded at bottom)
Dojo.init();
