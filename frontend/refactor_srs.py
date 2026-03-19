import re
import os

filepath = r"e:\Aplicaciones\ANALISIS DE DATOS\Pagina Web\HTML\da-2026\frontend\english.html"

with open(filepath, 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Inject CSS
css = """
/* Premium Refactor Overrides */
/* SRS Buttons */
.btn-srs-hard { background: hsla(25, 95%, 53%, 0.15) !important; color: hsl(25, 95%, 53%) !important; border: 1px solid hsla(25, 95%, 53%, 0.3) !important; font-size: 11px !important; }
.btn-srs-hard:hover { background: hsl(25, 95%, 53%) !important; color: #fff !important; transform: scale(1.05); }
.btn-srs-good { background: hsla(142, 71%, 45%, 0.15) !important; color: hsl(142, 71%, 45%) !important; border: 1px solid hsla(142, 71%, 45%, 0.3) !important; font-size: 11px !important; }
.btn-srs-good:hover { background: hsl(142, 71%, 45%) !important; color: #fff !important; transform: scale(1.05); }
.btn-srs-easy { background: hsla(188, 86%, 53%, 0.15) !important; color: hsl(188, 86%, 53%) !important; border: 1px solid hsla(188, 86%, 53%, 0.3) !important; font-size: 11px !important; }
.btn-srs-easy:hover { background: hsl(188, 86%, 53%) !important; color: #fff !important; transform: scale(1.05); }
body { font-family: 'Inter', sans-serif !important; background: var(--bg) !important; color: var(--tx) !important; }"""

html = html.replace("/* Premium Refactor Overrides */\nbody { font-family: 'Inter', sans-serif !important; background: var(--bg) !important; color: var(--tx) !important; }", css)

# 2. Inject HTML for #p-fc
old_html = """<div class="pnl" id="p-fc"><div class="sl">· flashcards ·</div><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><div style="display:flex;gap:8px;align-items:center"><span style="font-size:11px;color:var(--t2)"><b id="fN">1</b>/<b id="fT">0</b></span><div class="prg" style="width:160px"><div class="prf" id="fP" style="width:0%"></div></div></div><button class="btn bs bo" onclick="shuffleFC()">🔀</button></div><div class="fcw"><div class="fc" id="mainFC" onclick="flipFC()"><div class="fcf fcfr"><div class="fcwd" id="fW">...</div><div class="fch" id="fH"></div></div><div class="fcf fcbk"><div class="fca" id="fA"></div><div class="fcd" id="fD"></div></div></div></div><div style="display:flex;justify-content:center;gap:8px;margin-top:12px"><button class="btn bs" style="background:var(--rd);color:#fff" onclick="rateFC(1)">😰 No sé</button><button class="btn bs" style="background:var(--am);color:#000" onclick="rateFC(2)">🤔 Algo</button><button class="btn bs" style="background:var(--gn);color:#fff" onclick="rateFC(3)">😎 Lo sé</button></div></div>"""

new_html = """<div class="pnl" id="p-fc"><div class="sl">· flashcards (srs) ·</div><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><div style="display:flex;gap:8px;align-items:center"><span style="font-size:11px;color:var(--t2)"><b id="fN">0</b>/<b id="fT">0</b></span><div class="prg" style="width:100px"><div class="prf" id="fP" style="width:0%"></div></div></div><div id="fcDueBadge" style="font-size:10px;font-weight:600;padding:4px 8px;background:hsla(25, 95%, 53%, 0.15);color:hsl(25, 95%, 53%);border:1px solid hsla(25, 95%, 53%, 0.3);border-radius:6px;box-shadow: 0 0 10px hsla(25, 95%, 53%, 0.2)">🔥 Due: <span id="fDue">0</span></div><button class="btn bs bo" onclick="buildFC()">🔀 Refrescar</button></div><div class="fcw"><div class="fc" id="mainFC" onclick="flipFC()"><div class="fcf fcfr"><div class="fcwd" id="fW" style="font-size:18px;">Cargando Mazo SRS...</div><div class="fch" id="fH"></div></div><div class="fcf fcbk"><div class="fca" id="fA" style="font-size:14px;"></div><div class="fcd" id="fD"></div></div></div></div><div id="srsControls" style="display:none;justify-content:center;gap:8px;margin-top:12px"><button class="btn bs btn-srs-hard" onclick="rateFC('hard')">😰 Hard (1d)</button><button class="btn bs btn-srs-good" onclick="rateFC('good')">🤔 Good</button><button class="btn bs btn-srs-easy" onclick="rateFC('easy')">😎 Easy</button></div><div class="fc-empty" id="fcEmpty" style="display:none; text-align:center; padding: 20px 0; color:var(--tx2); font-style:italic; font-size:12px">¡Mazo al día! Vuelve mañana para repasar.</div></div>"""

html = html.replace(old_html, new_html)

# 3. Inject JS
old_js = """// Flashcards
function buildFC(){S.fs=[];Object.values(surv).flat().forEach(w=>S.fs.push({f:w.en,h:w.tp,b:w.es,d:w.ex.replace(/<\/?b>/g,'')}));Object.values(proDB).flat().forEach(w=>S.fs.push({f:w.en,h:w.tp,b:w.es,d:w.ex.replace(/<\/?b>/g,'')}));shuffleFC()}
function shuffleFC(){for(let i=S.fs.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[S.fs[i],S.fs[j]]=[S.fs[j],S.fs[i]]}S.fi=0;showFC()}
function showFC(){if(!S.fs.length)return;const c=S.fs[S.fi];document.getElementById('fW').textContent=c.f;document.getElementById('fH').textContent=c.h+' — click voltear';document.getElementById('fA').textContent=c.b;document.getElementById('fD').textContent=c.d;document.getElementById('fN').textContent=S.fi+1;document.getElementById('fT').textContent=S.fs.length;document.getElementById('fP').style.width=((S.fi+1)/S.fs.length*100)+'%';document.getElementById('mainFC').classList.remove('fl')}
function flipFC(){document.getElementById('mainFC').classList.toggle('fl')}
function rateFC(r){if(r===3){addXP(5);S.w++}else if(r===2)addXP(2);S.fi++;if(S.fi>=S.fs.length){S.fi=0;shuffleFC()}showFC();upd();save()}"""

new_js = """// SRS Flashcards Engine
async function buildFC(){
  let deck=JSON.parse(localStorage.getItem('eng_srs_deck')||'[]');
  let m=[];
  try{const res=await fetch('data/srs_deck.json');const dj=await res.json();m=m.concat(dj);}catch(e){}
  Object.values(surv).flat().forEach(w=>m.push({q:w.en,a:w.es,h:w.tp,d:w.ex.replace(/<\\/?b>/g,'')}));
  Object.values(proDB).flat().forEach(w=>m.push({q:w.en,a:w.es,h:w.tp,d:w.ex.replace(/<\\/?b>/g,'')}));
  let newC=0;
  m.forEach(i=>{if(!deck.find(c=>c.q===i.q)){deck.push({id:Math.random().toString(36).substr(2,9),q:i.q,a:i.a,h:i.h,d:i.d,interval:0,ease:2.5,reps:0,nextDue:0});newC++;}});
  if(newC>0)localStorage.setItem('eng_srs_deck',JSON.stringify(deck));
  const now=Date.now();
  S.fcDue=deck.filter(c=>c.nextDue<=now);
  S.fcAll=deck;
  document.getElementById('fDue').textContent=S.fcDue.length;
  shuffleFC();
}
function shuffleFC(){if(!S.fcDue)return;for(let i=S.fcDue.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[S.fcDue[i],S.fcDue[j]]=[S.fcDue[j],S.fcDue[i]]}S.fi=0;showFC()}
function showFC(){
  document.getElementById('mainFC').classList.remove('fl');
  document.getElementById('srsControls').style.display='none';
  if(!S.fcDue || !S.fcDue.length || S.fi>=S.fcDue.length){
    document.getElementById('fW').textContent='¡Al Día!';
    document.getElementById('fH').textContent='No hay más repasos pendientes.';
    document.getElementById('fA').textContent='';
    document.getElementById('fD').textContent='';
    document.getElementById('fcEmpty').style.display='block';
    document.getElementById('mainFC').style.pointerEvents='none';
    document.getElementById('fN').textContent='0';document.getElementById('fT').textContent='0';document.getElementById('fP').style.width='100%';
    return;
  }
  document.getElementById('fcEmpty').style.display='none';
  document.getElementById('mainFC').style.pointerEvents='auto';
  const c=S.fcDue[S.fi];
  document.getElementById('fW').textContent=c.q;
  document.getElementById('fH').textContent=c.h+' — click voltear';
  document.getElementById('fA').textContent=c.a;
  document.getElementById('fD').textContent=c.d;
  document.getElementById('fN').textContent=S.fi+1;
  document.getElementById('fT').textContent=S.fcDue.length;
  document.getElementById('fP').style.width=((S.fi)/S.fcDue.length*100)+'%';
}
function flipFC(){
  if(!S.fcDue || S.fi>=S.fcDue.length) return;
  document.getElementById('mainFC').classList.add('fl');
  document.getElementById('srsControls').style.display='flex';
  const c=S.fcDue[S.fi];
  document.querySelector('.btn-srs-good').textContent=`🤔 Good (${Math.max(1, Math.round(c.interval===0?1:c.interval*c.ease))}d)`;
  document.querySelector('.btn-srs-easy').textContent=`😎 Easy (${Math.max(2, Math.round(c.interval===0?2:c.interval*c.ease*1.3))}d)`;
}
function rateFC(r){
  const c=S.fcDue[S.fi];
  if(r==='hard'){ c.interval=1; c.ease=Math.max(1.3, c.ease-0.2); c.reps=0; }
  else if(r==='good'){ c.interval=Math.max(1, Math.round(c.interval===0?1:c.interval*c.ease)); c.reps++; addXP(2); S.w++; }
  else if(r==='easy'){ c.interval=Math.max(2, Math.round(c.interval===0?2:c.interval*c.ease*1.3)); c.ease+=0.15; c.reps++; addXP(5); S.w++; }
  c.nextDue = Date.now() + (c.interval * 86400000);
  const deckIndex = S.fcAll.findIndex(x=>x.id===c.id);
  if(deckIndex!==-1) S.fcAll[deckIndex]=c;
  localStorage.setItem('eng_srs_deck',JSON.stringify(S.fcAll));
  S.fi++;
  document.getElementById('fDue').textContent = S.fcDue.length - S.fi;
  showFC();upd();save();
}"""

html = html.replace(old_js, new_js)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(html)
