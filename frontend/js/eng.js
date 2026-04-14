// ══════════════════════════════════════════════════════════════
// ENGLISH ACADEMY v2 — IIFE Module (ENG)
// 4-layer: english.html shell + css/english.css + js/eng.js + data/english-data.json
// ══════════════════════════════════════════════════════════════
const ENG = (function(){
  'use strict';

  // ── State ──────────────────────────────
  let D = null;           // data from JSON
  let S = { xp:0, strk:0, w:0, r:0, e:0, fi:0, fs:[], ep:0 };
  let ttsVoice = null;
  let currentBtn = null;
  let fcClickTimer = null;

  // ── Persistence ────────────────────────
  function save(){ try{ localStorage.setItem('e4', JSON.stringify(S)); }catch(e){} }
  function load(){
    try{
      const d = localStorage.getItem('e4');
      if(d) Object.assign(S, JSON.parse(d));
    }catch(e){}
  }

  function addXP(n){ S.xp += n; _updStats(); save(); }

  function _updStats(){
    _txt('xp', S.xp);
    _txt('strk', S.strk);
    _txt('sw', S.w);
    _txt('sr', S.r);
    _txt('se', S.e);
    const notes = _getNotes();
    _txt('sn', notes.length);
  }

  // ── Helpers ────────────────────────────
  function _el(id){ return document.getElementById(id); }
  function _txt(id, v){ const e = _el(id); if(e) e.textContent = v; }
  function _esc(t){ return (t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function _escAttr(t){ return (t||'').replace(/'/g,"\\'").replace(/"/g,'&quot;'); }

  // ── TTS Engine ─────────────────────────
  function _initTTS(){
    if(!window.speechSynthesis) return;
    const loadV = () => {
      const v = speechSynthesis.getVoices();
      const prefs = ['Google US English','Samantha','Alex','Microsoft Aria Online','en-US'];
      for(const p of prefs){
        const f = v.find(x => x.name.includes(p) || x.lang.includes(p));
        if(f){ ttsVoice = f; break; }
      }
      if(!ttsVoice) ttsVoice = v.find(x => x.lang.startsWith('en')) || v[0];
    };
    loadV();
    speechSynthesis.onvoiceschanged = loadV;
  }

  function speak(text, btn){
    if(!window.speechSynthesis) return;
    if(btn && btn === currentBtn && speechSynthesis.speaking){
      speechSynthesis.cancel();
      btn.classList.remove('playing');
      currentBtn = null;
      return;
    }
    speechSynthesis.cancel();
    if(currentBtn) currentBtn.classList.remove('playing');
    const clean = text.replace(/<[^>]*>/g,'').replace(/\(.*?\)/g,'').trim();
    const u = new SpeechSynthesisUtterance(clean);
    if(ttsVoice) u.voice = ttsVoice;
    u.lang = 'en-US'; u.rate = 0.82; u.pitch = 1;
    if(btn){
      btn.classList.add('playing'); currentBtn = btn;
      u.onend = () => { btn.classList.remove('playing'); currentBtn = null; };
      u.onerror = () => { btn.classList.remove('playing'); currentBtn = null; };
    }
    speechSynthesis.speak(u);
  }

  // ── Vocabulary ─────────────────────────
  function _renderVocab(data, containerId){
    const el = _el(containerId);
    if(!el || !D) return;
    const cats = D.vocabCategories;
    let html = '';
    Object.keys(data).forEach(cat => {
      const words = data[cat];
      const ci = cats[cat] || { icon:'📚', name: cat };
      html += '<div class="card vcat" data-cat="'+cat+'"><div class="card-h"><div class="card-t">'+ci.icon+' '+ci.name+'</div><span class="pl pl-e">'+words.length+'</span></div>';
      for(let i = 0; i < words.length; i++){
        const w = words[i];
        const sp = w.en.replace(/\s*\/\s*/g,' or ').replace(/\.\.\./g,'').replace(/\?/g,'');
        html += '<div class="word" onclick="ENG.toggleEx(this)">' +
          '<div class="word-num">' + String(i+1).padStart(2,'0') + '</div>' +
          '<button class="tts" onclick="event.stopPropagation();ENG.speak(\'' + _escAttr(sp) + '\',this)">🔊</button>' +
          '<div class="word-body">' +
          '<div><span class="word-en" data-tip="' + _escAttr(w.es) + '">' + w.en + '</span> <span class="word-tp">' + w.tp + '</span></div>' +
          (w.ph && w.ph !== '' ? '<div class="word-ph">' + w.ph + '</div>' : '') +
          '<div class="word-es">' + w.es + '</div>' +
          '<div class="word-ex">' + w.ex + '</div>' +
          '</div></div>';
      }
      html += '</div>';
    });
    el.innerHTML = html;
  }

  function toggleEx(el){
    const ex = el.querySelector('.word-ex');
    if(ex) ex.classList.toggle('show');
  }

  // ── Grammar ────────��───────────────────
  function _renderGrammar(){
    if(!D) return;
    const el = _el('gL');
    if(!el) return;
    el.innerHTML = D.grammar.map(r => {
      const lc = r.l==='b' ? 'pl-b' : r.l==='i' ? 'pl-i' : 'pl-a';
      const ll = r.l==='b' ? 'Basic' : r.l==='i' ? 'Intermediate' : 'Advanced';
      return '<div class="card"><div class="card-h"><div class="card-t">'+r.i+' '+r.t+'</div><span class="pl '+lc+'">'+ll+'</span></div>' +
        '<p style="color:var(--t2);font-size:12px;margin-bottom:3px">'+_esc(r.s)+'</p>' +
        '<p style="font-size:12px;margin-bottom:12px;line-height:1.6">'+_esc(r.x)+'</p>' +
        '<div style="font-size:9px;color:var(--t3);text-transform:uppercase;letter-spacing:1px;margin-bottom:3px">FORMULA</div>' +
        '<div class="gr-f">'+r.f+'</div>' +
        '<div style="font-size:9px;color:var(--gn);text-transform:uppercase;letter-spacing:1px;margin:10px 0 4px">✓ CORRECT</div>' +
        r.ok.map(e => '<div class="gx"><span style="color:var(--gn)">✓</span><span style="font-size:12px">'+_esc(e.e)+'</span><span style="color:var(--t3);font-size:11px">→ '+_esc(e.t)+'</span><button class="tts" onclick="event.stopPropagation();ENG.speak(\''+_escAttr(e.e)+'\',this)">🔊</button></div>').join('') +
        '<div style="font-size:9px;color:var(--rd);text-transform:uppercase;letter-spacing:1px;margin:10px 0 4px">✗ COMMON ERRORS</div>' +
        r.no.map(e => '<div class="gx"><span style="color:var(--rd)">✗</span><span style="color:var(--rd);text-decoration:line-through;opacity:.6;font-size:11px">'+_esc(e.t)+'</span><span style="color:var(--am);font-size:10px">→ '+_esc(e.w)+'</span></div>').join('') +
        '</div>';
    }).join('');
  }

  // ── Understand ─────────────────────────
  function _renderUnderstand(){
    if(!D) return;
    const el = _el('uL');
    if(!el) return;
    const u = D.understand;

    let html = '<div class="tipbox"><b>🎧 Why can\'t you understand native speakers?</b><p><strong>Contractions + connected speech.</strong> They swallow syllables. Learn these patterns and you\'ll understand 80% more.</p></div>';

    // Contractions table
    html += '<div class="card"><div class="card-h"><div class="card-t">🔗 Contractions</div><span class="pl pl-e">Critical</span></div><table class="tbl"><tr><th>Formal</th><th>Real Speech</th><th>Sounds Like</th><th>Español</th></tr>';
    u.contractions.forEach(c => {
      html += '<tr><td>'+_esc(c.formal)+'</td><td class="hl">'+_esc(c.real)+'</td><td>'+_esc(c.sound)+'</td><td>'+_esc(c.es)+'</td></tr>';
    });
    html += '</table></div>';

    // Hispanic errors table
    html += '<div class="card"><div class="card-h"><div class="card-t">⚠️ Hispanic Speaker Errors</div><span class="pl pl-a">Avoid</span></div><table class="tbl"><tr><th>❌ Wrong</th><th>✅ Correct</th><th>Why</th></tr>';
    u.hispanicErrors.forEach(e => {
      html += '<tr><td style="color:var(--rd)">'+_esc(e.wrong)+'</td><td style="color:var(--gn)">'+_esc(e.right)+'</td><td>'+_esc(e.why)+'</td></tr>';
    });
    html += '</table></div>';

    // Strategies
    html += '<div class="card"><div class="card-h"><div class="card-t">🧪 Strategies</div></div>';
    const colors = ['var(--gn)','var(--am)','var(--cy)','var(--pk)','var(--or)'];
    u.strategies.forEach((s, i) => {
      html += '<div class="gr-rule" style="border-left-color:'+colors[i%colors.length]+'"><h4>'+(i+1)+'. '+_esc(s.title)+'</h4><p style="font-size:12px;color:var(--t2)">'+_esc(s.desc)+'</p></div>';
    });
    html += '</div>';

    el.innerHTML = html;
  }

  // ── Conversations ────���─────────────────
  function _renderConv(cat){
    if(!D) return;
    const d = D.conversations[cat] || D.conversations.greetings;
    const el = _el('cL');
    if(!el) return;
    el.innerHTML = d.map(x => {
      return '<div class="card"><div style="font-size:13px;font-weight:600;margin-bottom:10px">'+_esc(x.t)+'</div>' +
        x.m.map(m => {
          return '<div class="msg"><div class="msg-av '+m.w+'">'+(m.w==='a'?'👤':'🎤')+'</div><div class="msg-body"><div class="msg-name '+m.w+'">'+_esc(m.n)+'</div><span class="msg-text '+m.w+'">'+_esc(m.t)+' <button class="tts" onclick="event.stopPropagation();ENG.speak(\''+_escAttr(m.t)+'\',this)" style="width:18px;height:18px;font-size:8px">🔊</button></span><div class="msg-tr">'+_esc(m.r)+'</div></div></div>';
        }).join('') +
        '<div style="margin-top:8px;padding:8px;background:var(--ag);border-radius:7px;border:1px solid rgba(139,92,246,.1)"><div style="font-size:9px;font-weight:600;color:var(--a2);margin-bottom:3px">🔑 Key Vocabulary</div>' +
        x.v.map(v => '<div style="font-size:11px;color:var(--t2)">• '+_esc(v)+'</div>').join('') +
        '</div></div>';
    }).join('');
  }

  // ── Professional ───��───────────────────
  function _renderPro(c){
    if(!D) return;
    const cats = c === 'all' ? Object.keys(D.professional) : [c];
    const el = _el('pL');
    if(!el) return;
    const pc = D.profCategories;
    el.innerHTML = cats.map(k => {
      const d = D.professional[k] || [];
      const ci = pc[k] || { icon:'📚', name: k };
      return '<div class="card vcat" data-cat="'+k+'"><div class="card-h"><div class="card-t">'+ci.icon+' '+ci.name+'</div><span class="pl pl-e">'+d.length+'</span></div>' +
        d.map((w, i) => {
          const sp = w.en.replace(/\.\.\./g,'').replace(/'/g,"\\'");
          return '<div class="word" onclick="ENG.toggleEx(this)"><div class="word-num">'+String(i+1).padStart(2,'0')+'</div><button class="tts" onclick="event.stopPropagation();ENG.speak(\''+_escAttr(sp)+'\',this)">🔊</button><div class="word-body"><div><span class="word-en" data-tip="'+_escAttr(w.es)+'">'+w.en+'</span> <span class="word-tp">'+w.tp+'</span></div><div class="word-es">'+w.es+'</div><div class="word-ex">'+w.ex+'</div></div></div>';
        }).join('') + '</div>';
    }).join('');
  }

  // ── Exercises ──��───────────────────────
  function _renderEx(){
    if(!D) return;
    const el = _el('eL');
    if(!el) return;
    const s = S.ep * 6;
    const b = D.exercises.slice(s, s + 6);
    el.innerHTML = b.map((e, i) => {
      const g = s + i;
      if(e.ty === 'f'){
        return '<div class="exr"><div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:var(--a2)">Fill in the blank</span><span class="pl '+(e.d==='A2'?'pl-b':e.d==='B1'?'pl-i':'pl-a')+'">'+e.d+'</span></div><div class="eq">'+_esc(e.q)+'</div><div class="eo">'+e.o.map((o, j) => '<div class="eop" onclick="ENG.chkAns('+g+','+j+',this)"><span class="elt">'+('ABCD')[j]+'</span><span>'+_esc(o)+'</span></div>').join('')+'</div><div class="efb" id="f'+g+'"></div></div>';
      }
      return '<div class="exr"><div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:var(--a2)">Translation</span><span class="pl '+(e.d==='A2'?'pl-b':e.d==='B1'?'pl-i':'pl-a')+'">'+e.d+'</span></div><div class="eq">'+_esc(e.q)+'</div><input class="ein" id="i'+g+'" placeholder="Your translation..." onkeydown="if(event.key===\'Enter\')ENG.chkTrans('+g+')"><div style="margin-top:6px"><button class="btn bp bs" onclick="ENG.chkTrans('+g+')">Verify</button> <button class="btn bo bs" onclick="ENG.showAns('+g+')">Show answer</button></div><div class="efb" id="f'+g+'"></div></div>';
    }).join('');
  }

  function chkAns(i, o, el){
    const e = D.exercises[i];
    const p = el.closest('.exr');
    const os = p.querySelectorAll('.eop');
    const fb = _el('f'+i);
    os.forEach(x => x.style.pointerEvents = 'none');
    if(o === e.c){
      el.classList.add('ok');
      fb.className = 'efb sh suc';
      fb.innerHTML = '✅ ' + _esc(e.w);
      addXP(10);
    } else {
      el.classList.add('no');
      os[e.c].classList.add('ok');
      fb.className = 'efb sh err';
      fb.innerHTML = '❌ "' + _esc(e.o[e.c]) + '". ' + _esc(e.w);
    }
    S.e++; _updStats(); save();
  }

  function chkTrans(i){
    const e = D.exercises[i];
    const v = (_el('i'+i).value || '').trim().toLowerCase();
    const fb = _el('f'+i);
    if(v === e.a.toLowerCase() || (e.al||[]).some(a => v === a.toLowerCase())){
      fb.className = 'efb sh suc';
      fb.innerHTML = '�� ' + _esc(e.w);
      addXP(15);
    } else {
      fb.className = 'efb sh inf';
      fb.innerHTML = '💡 "' + _esc(e.a) + '" — ' + _esc(e.w);
    }
    S.e++; _updStats(); save();
  }

  function showAns(i){
    const e = D.exercises[i];
    const fb = _el('f'+i);
    fb.className = 'efb sh inf';
    fb.innerHTML = '💡 "' + _esc(e.a) + '" — ' + _esc(e.w);
  }

  function moreEx(){
    S.ep++;
    if(S.ep * 6 >= D.exercises.length) S.ep = 0;
    _renderEx();
    _el('p-ex').scrollIntoView({ behavior:'smooth' });
  }

  function _renderDaily(){
    const i = new Date().getDate() % D.exercises.length;
    const e = D.exercises[i];
    const el = _el('dC');
    if(!el) return;
    if(e.ty === 'f'){
      el.innerHTML = '<div class="eq">'+_esc(e.q)+'</div><div class="eo">'+e.o.map((o, j) => '<div class="eop" onclick="ENG.chkDaily('+i+','+j+',this)"><span class="elt">'+('ABCD')[j]+'</span><span>'+_esc(o)+'</span></div>').join('')+'</div><div class="efb" id="fd"></div>';
    } else {
      el.innerHTML = '<div class="eq">'+_esc(e.q)+'</div><input class="ein" id="id" placeholder="Translate..." onkeydown="if(event.key===\'Enter\')ENG.chkDailyT('+i+')"><div style="margin-top:6px"><button class="btn bp bs" onclick="ENG.chkDailyT('+i+')">Verify</button></div><div class="efb" id="fd"></div>';
    }
  }

  function chkDaily(i, o, el){
    const e = D.exercises[i];
    const os = el.closest('.daily').querySelectorAll('.eop');
    const fb = _el('fd');
    os.forEach(x => x.style.pointerEvents = 'none');
    if(o === e.c){
      el.classList.add('ok'); fb.className = 'efb sh suc';
      fb.innerHTML = '🏆 +25XP! ' + _esc(e.w); addXP(25);
    } else {
      el.classList.add('no'); os[e.c].classList.add('ok'); fb.className = 'efb sh err';
      fb.innerHTML = '❌ "' + _esc(e.o[e.c]) + '". ' + _esc(e.w);
    }
    S.e++; _updStats(); save();
  }

  function chkDailyT(i){
    const e = D.exercises[i];
    const v = (_el('id').value || '').trim().toLowerCase();
    const fb = _el('fd');
    if(v === e.a.toLowerCase() || (e.al||[]).some(a => v === a.toLowerCase())){
      fb.className = 'efb sh suc'; fb.innerHTML = '🏆 +25XP! ' + _esc(e.w); addXP(25);
    } else {
      fb.className = 'efb sh inf'; fb.innerHTML = '💡 "' + _esc(e.a) + '" — ' + _esc(e.w);
    }
    S.e++; _updStats(); save();
  }

  // ── Flashcards ────��────────────────────
  function _buildFC(){
    S.fs = [];
    Object.values(D.vocabulary).flat().forEach(w => S.fs.push({ f: w.en, h: w.tp, b: w.es, d: w.ex.replace(/<\/?b>/g,'') }));
    Object.values(D.professional).flat().forEach(w => S.fs.push({ f: w.en, h: w.tp, b: w.es, d: w.ex.replace(/<\/?b>/g,'') }));
    shuffleFC();
  }

  function shuffleFC(){
    for(let i = S.fs.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [S.fs[i], S.fs[j]] = [S.fs[j], S.fs[i]];
    }
    S.fi = 0;
    _showFC();
  }

  function _showFC(){
    if(!S.fs.length) return;
    const c = S.fs[S.fi];
    _txt('fW', c.f); _txt('fH', c.h + ' — click=TTS | double click=Flip');
    _txt('fA', c.b); _txt('fD', c.d);
    _txt('fN', S.fi + 1); _txt('fT', S.fs.length);
    const p = _el('fP');
    if(p) p.style.width = ((S.fi + 1) / S.fs.length * 100) + '%';
    const fc = _el('mainFC');
    if(fc) fc.classList.remove('fl');
  }

  function handleFcClick(){
    clearTimeout(fcClickTimer);
    fcClickTimer = setTimeout(() => {
      if(!_el('mainFC').classList.contains('fl')){
        speak(_el('fW').textContent);
      }
    }, 250);
  }

  function handleFcDblClick(){
    clearTimeout(fcClickTimer);
    _el('mainFC').classList.toggle('fl');
  }

  function rateFC(r){
    if(r === 3){ addXP(5); S.w++; }
    else if(r === 2){ addXP(2); }
    S.fi++;
    if(S.fi >= S.fs.length){ S.fi = 0; shuffleFC(); }
    _showFC(); _updStats(); save();
  }

  // ── Interview Prep ─────────────────────
  function _renderIV(c){
    if(!D) return;
    const d = D.interviews[c] || D.interviews.behavioral;
    const el = _el('iL');
    if(!el) return;
    el.innerHTML = d.map((x, i) => {
      return '<div class="card"><div class="card-h"><div class="card-t">❓ Q'+(i+1)+'</div><span class="pl pl-e">Must Know</span></div>' +
        '<div class="ivs"><div class="ivr iw">👤 INTERVIEWER</div><div style="font-size:16px;font-weight:600">"'+_esc(x.q)+'" <button class="tts" onclick="event.stopPropagation();ENG.speak(\''+_escAttr(x.q)+'\',this)">🔊</button></div></div>' +
        '<div class="clh" onclick="ENG.togColl(this)" style="margin-top:6px"><h3>🎯 Model Answer</h3><span class="cla">▼</span></div>' +
        '<div class="clb"><div class="cli">' +
        '<div class="ivs" style="border-left:3px solid var(--gn)"><div class="ivr you">🎤 YOUR ANSWER</div><div style="font-size:13px;line-height:1.6">"'+_esc(x.m)+'" <button class="tts" onclick="event.stopPropagation();ENG.speak(\''+_escAttr(x.m)+'\',this)">🔊</button></div></div>' +
        '<div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:3px">'+x.k.map(k => '<span style="padding:2px 6px;background:var(--ag);border:1px solid rgba(139,92,246,.12);border-radius:8px;font-size:10px;color:var(--a2);font-weight:600">'+_esc(k)+'</span>').join('')+'</div>' +
        '<div class="ivt" style="margin-top:6px"><b>💡</b> '+x.t.map(t => _esc(t)).join(' • ')+'</div>' +
        '</div></div></div>';
    }).join('');
  }

  function togColl(h){ h.classList.toggle('op'); h.nextElementSibling.classList.toggle('op'); }

  // ── Notes ──────────────────────────────
  function _getNotes(){ try{ return JSON.parse(localStorage.getItem('eng_notes')||'[]'); }catch(e){ return []; } }
  function _saveNotes(n){ localStorage.setItem('eng_notes', JSON.stringify(n)); }

  function _renderNotes(){
    if(!D) return;
    const notes = _getNotes();
    const stamps = D.stamps;
    const el = _el('notesArea');
    if(!el) return;
    el.innerHTML = '<div class="card" style="margin-bottom:16px"><div style="font-size:13px;font-weight:600;margin-bottom:10px">✍️ New Note</div><textarea class="note-area" id="noteText" placeholder="Write a sentence to practice..."></textarea><div style="display:flex;align-items:center;gap:5px;margin-top:8px;flex-wrap:wrap"><span style="font-size:11px;color:var(--t3)">Stamp:</span>' +
      stamps.map((s, i) => '<span class="note-stamp '+s.cls+'" onclick="ENG.selStamp(\''+s.id+'\',this)" data-s="'+s.id+'"'+(i===2?' style="outline:2px solid var(--ac)"':'')+'>'+s.label+'</span>').join('') +
      '</div><input type="hidden" id="noteStamp" value="phrase"><div style="margin-top:8px;display:flex;gap:6px"><button class="btn bp" onclick="ENG.addNote()">💾 Save</button><button class="btn bo" onclick="ENG.speakNote()">🔊 Read Aloud</button></div></div>' +
      (notes.length ? '<div style="font-size:11px;color:var(--t3);margin-bottom:8px">'+notes.length+' note'+(notes.length>1?'s':'')+' saved</div>' : '') +
      notes.slice().reverse().map((n, ri) => {
        const idx = notes.length - 1 - ri;
        const st = stamps.find(s => s.id === n.stamp) || stamps[2];
        return '<div class="note"><button class="note-del" onclick="ENG.delNote('+idx+')">✕</button><div class="note-top"><span class="note-stamp '+st.cls+'">'+st.label+'</span><span style="font-size:10px;color:var(--t3)">'+_esc(n.date)+'</span></div><div class="note-text">'+_esc(n.text)+'</div><button class="tts" onclick="ENG.speak(\''+_escAttr(n.text)+'\',this)" style="margin-top:6px">🔊</button></div>';
      }).join('');
    _updStats();
  }

  function selStamp(id, el){
    _el('noteStamp').value = id;
    document.querySelectorAll('#notesArea .note-stamp').forEach(s => s.style.outline = 'none');
    el.style.outline = '2px solid var(--ac)';
  }

  function addNote(){
    const t = (_el('noteText').value || '').trim();
    if(!t) return;
    const notes = _getNotes();
    notes.push({ text: t, stamp: _el('noteStamp').value, date: new Date().toLocaleDateString('es',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) });
    _saveNotes(notes);
    _renderNotes();
  }

  function delNote(i){
    const n = _getNotes();
    n.splice(i, 1);
    _saveNotes(n);
    _renderNotes();
  }

  function speakNote(){
    const t = (_el('noteText').value || '').trim();
    if(t) speak(t);
  }

  // ── Timer ──────────────────────────────
  function _updTimer(){
    const n = new Date(), t = new Date(n);
    t.setDate(t.getDate() + 1); t.setHours(0,0,0,0);
    const d = t - n;
    _txt('tmr', String(Math.floor(d/36e5)).padStart(2,'0')+':'+String(Math.floor(d%36e5/6e4)).padStart(2,'0')+':'+String(Math.floor(d%6e4/1e3)).padStart(2,'0'));
  }

  // ── Tabs & Filters ─────────────────────
  function _setupTabs(){
    document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(x => x.classList.remove('on'));
      document.querySelectorAll('.pnl').forEach(x => x.classList.remove('on'));
      t.classList.add('on');
      const pnl = _el('p-' + t.dataset.p);
      if(pnl) pnl.classList.add('on');
    }));
  }

  function _setupFilter(id, fn){
    const el = _el(id);
    if(!el) return;
    el.addEventListener('click', e => {
      const pill = e.target.closest('.cpi');
      if(!pill) return;
      el.querySelectorAll('.cpi').forEach(x => x.classList.remove('on'));
      pill.classList.add('on');
      const c = pill.dataset.c;
      if(fn){ fn(c); return; }
      pill.closest('.pnl').querySelectorAll('.vcat').forEach(cd => {
        cd.style.display = (c === 'all' || cd.dataset.cat === c) ? '' : 'none';
      });
    });
  }

  function _buildPills(id, keys, hasAll){
    const el = _el(id);
    if(!el || !D) return;
    const cats = D.vocabCategories;
    el.innerHTML = (hasAll ? '<span class="cpi on" data-c="all">All</span>' : '') +
      keys.map((c, i) => {
        const ci = cats[c] || D.profCategories[c] || { icon:'📚', name: c };
        return '<span class="cpi '+(!hasAll && i === 0 ? 'on' : '')+'" data-c="'+c+'">'+ci.icon+' '+ci.name+'</span>';
      }).join('');
  }

  function _buildNamedPills(id, items){
    const el = _el(id);
    if(!el) return;
    el.innerHTML = items.map((x, i) => '<span class="cpi '+(i===0?'on':'')+'" data-c="'+x.c+'">'+x.label+'</span>').join('');
  }

  // ── Init ────────��──────────────────────
  async function init(){
    try {
      const r = await fetch('data/english-data.json');
      D = await r.json();
    } catch(e){
      console.error('ENG: failed to load data', e);
      return;
    }

    load();
    _initTTS();

    // Build filter pills
    _buildPills('sC', Object.keys(D.vocabulary), true);
    _buildPills('pC', Object.keys(D.professional), true);
    _buildNamedPills('cC', [
      {c:'greetings',label:'👋 Greetings'},{c:'standup',label:'📋 Standup'},{c:'food',label:'🍽️ Restaurant'},
      {c:'interview',label:'🎯 Interview'},{c:'phone',label:'📱 Phone'},{c:'smalltalk',label:'☕ Small Talk'}
    ]);
    _buildNamedPills('iC', [
      {c:'behavioral',label:'🎭 Behavioral'},{c:'technical',label:'🔧 Technical'},{c:'situational',label:'🧩 Situational'}
    ]);

    // Render all sections
    _renderVocab(D.vocabulary, 'sL');
    _renderGrammar();
    _renderUnderstand();
    _renderConv('greetings');
    _renderPro('all');
    _renderEx();
    _renderDaily();
    _buildFC();
    _renderIV('behavioral');
    _renderNotes();

    // Setup tabs and filters
    _setupTabs();
    _setupFilter('sC', null);
    _setupFilter('pC', _renderPro);
    _setupFilter('cC', _renderConv);
    _setupFilter('iC', _renderIV);

    // Timer
    _updTimer();
    setInterval(_updTimer, 1000);

    _updStats();

    // Init Dojo if present
    if(typeof Dojo !== 'undefined' && Dojo.init) Dojo.init();
  }

  // ── Public API ───��─────────────────────
  return {
    init,
    speak,
    toggleEx,
    chkAns,
    chkTrans,
    showAns,
    moreEx,
    chkDaily,
    chkDailyT,
    shuffleFC,
    handleFcClick,
    handleFcDblClick,
    rateFC,
    togColl,
    selStamp,
    addNote,
    delNote,
    speakNote
  };
})();

// Boot
ENG.init();
