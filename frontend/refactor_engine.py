import re

filepath = r"e:\Aplicaciones\ANALISIS DE DATOS\Pagina Web\HTML\da-2026\frontend\english.html"

with open(filepath, 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Inject CSS for Deep Engine
css = """
/* Premium Refactor Overrides */
/* Dialogue Chat */
.chat-box { flex:1; display:flex; flex-direction:column; gap:12px; max-height:400px; overflow-y:auto; padding-right:10px; margin-bottom:16px; border-bottom:1px solid hsla(0,0%,100%,0.05); }
.chat-msg { display:inline-block; padding:10px 14px; border-radius:12px; font-size:13px; line-height:1.5; max-width:85%; animation: fu .3s ease; }
.chat-interviewer { background:var(--el); color:var(--tx); align-self:flex-start; border-bottom-left-radius:2px; border:1px solid var(--bd);}
.chat-user { background:hsla(265, 89%, 66%, 0.15); border:1px solid hsla(265, 89%, 66%, 0.3); color:var(--tx); align-self:flex-end; border-bottom-right-radius:2px; }

/* SVO Builder */
.svo-area { background:hsla(240, 10%, 8%, 0.6); backdrop-filter:blur(12px); border:1px solid hsla(0,0%,100%,0.07); padding:16px; border-radius:10px; }
.svo-target { display:flex; gap:8px; margin-bottom:12px; min-height:44px; padding:8px; background:var(--bg); border-radius:6px; border:1px dashed var(--bd2); }
.svo-slot { flex:1; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:600; color:var(--t3); border-radius:4px; padding:4px; text-transform:uppercase; letter-spacing:1px; text-align:center;}
.svo-slot.filled { background:hsla(142, 71%, 45%, 0.15); color:hsl(142, 71%, 45%); border:1px solid hsla(142, 71%, 45%, 0.3); text-transform:none; font-size:13px;}

.svo-blocks { display:flex; flex-wrap:wrap; gap:8px; }
.svo-block { padding:8px 12px; background:var(--c1); border:1px solid var(--bd2); border-radius:6px; font-size:13px; cursor:pointer; font-family:'Inter',sans-serif; transition:all 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.2); }
.svo-block:hover { border-color:var(--ac); transform:translateY(-2px); box-shadow: 0 6px 12px rgba(139,92,246,0.3); background:var(--el);}
.svo-block.wrong { background:hsla(0, 84%, 60%, 0.15) !important; border-color:hsl(0, 84%, 60%) !important; color:hsl(0, 84%, 60%) !important; animation: shake 0.4s; }

@keyframes shake { 0%, 100% {transform:translateX(0);} 25% {transform:translateX(-4px);} 75% {transform:translateX(4px);} }
"""

html = html.replace("/* Premium Refactor Overrides */", css)

# 2. Replace #p-conv HTML
old_conv_html = """<div class="pnl" id="p-conv"><div class="sl">· conversaciones ·</div><div class="sd">Usa 🔊 en cada línea. Practica ambos roles.</div><div class="cp" id="cC"></div><div id="cL"></div></div>"""

new_conv_html = """<div class="pnl" id="p-conv">
  <div class="sl" style="color:var(--a2)">· deep conversational simulator ·</div>
  
  <div id="convMenu">
    <div style="font-size:13px;color:var(--t2);margin-bottom:12px">Selecciona un escenario interactivo Tier 1 (Aplica método STAR):</div>
    <div id="convList" style="display:flex;flex-direction:column;gap:8px"></div>
  </div>

  <div id="convApp" style="display:none; flex-direction:column; min-height:500px">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
      <button class="btn bo bs" onclick="exitConv()">← Volver</button>
      <div id="convTitle" style="font-size:13px; font-weight:600; color:var(--a2)"></div>
      <div id="convProgress" style="font-size:11px; color:var(--t3)">Turno 1/X</div>
    </div>

    <div class="chat-box" id="convChat"></div>

    <div class="svo-area" id="convSvoArea">
      <div style="font-size:11px;color:var(--am);margin-bottom:4px;font-weight:600">🎯 SVO Visualizer: Ensambla la oración con sintaxis estricta</div>
      <div style="font-size:12px;color:var(--tx);margin-bottom:10px;font-style:italic" id="convMeaning"></div>
      
      <div class="svo-target" id="svoTarget">
        <div class="svo-slot" id="slot-s">Sujeto</div>
        <div class="svo-slot" id="slot-v">Verbo</div>
        <div class="svo-slot" id="slot-o">Objeto</div>
      </div>

      <div class="svo-blocks" id="svoBlocks"></div>
      
      <div style="display:none;margin-top:10px;justify-content:flex-end" id="svoSendBtn">
         <button class="btn bp" onclick="submitConvTurn()">Continuar ➔</button>
      </div>
    </div>
    
    <div id="convResults" style="display:none; flex-direction:column; align-items:center; justify-content:center; padding:30px; background:hsla(142, 71%, 45%, 0.05); border:1px solid hsla(142, 71%, 45%, 0.2); border-radius:12px; margin-top:20px;">
       <div style="font-size:24px; font-weight:600; margin-bottom:6px; color:var(--gn)">¡Escenario Completado!</div>
       <div style="font-size:13px; color:var(--t2); margin-bottom:20px">Evalúa tu fluidez para programar la curva de olvido FSRS.</div>
       <div style="display:flex; gap:10px; flex-wrap:wrap; justify-content:center;">
          <button class="btn bs btn-srs-hard" onclick="rateConv('hard')">😰 Difícil (Me trabé)</button>
          <button class="btn bs btn-srs-good" onclick="rateConv('good')">🤔 Bien (Dudé un poco)</button>
          <button class="btn bs btn-srs-easy" onclick="rateConv('easy')">😎 Fácil (Fluido)</button>
       </div>
    </div>
  </div>
</div>"""

html = html.replace(old_conv_html, new_conv_html)

# 3. Inject JS Engine
js_engine = """
let convData = [];
let currentConvId = null;
let currentTurn = 0;
let currentSvoMap = {};
let currentSvoState = 0; // 0: S, 1: V, 2: O

async function loadConvEngine() {
  try {
    const res = await fetch('data/conv_engine.json');
    convData = await res.json();
    renderConvMenu();
  } catch(e) { console.error('No conv_engine.json'); }
}

function renderConvMenu() {
  const cfsrs = JSON.parse(localStorage.getItem('eng_conv_fsrs')||'{}');
  document.getElementById('convList').innerHTML = convData.map(c => {
    const st = cfsrs[c.id];
    let dueHtml = '';
    if(st) {
        if(Date.now() >= st.nextDue) dueHtml = '<span style="font-size:10px;color:hsl(30,100%,60%);margin-left:8px;background:hsla(30,100%,60%,0.15);padding:2px 6px;border-radius:10px;">🔥 Due</span>';
        else dueHtml = `<span style="font-size:10px;color:var(--gn);margin-left:8px;">✔ Repaso en ${st.interval}d</span>`;
    }
    return '<div class="card" style="cursor:pointer;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;transition:transform 0.2s;border-left:3px solid var(--ac)" onclick="startConv(\\''+c.id+'\\')"><div style="font-size:13px;font-weight:600">'+c.title+'</div><div>'+dueHtml+'</div></div>';
  }).join('');
}

function startConv(id) {
  document.getElementById('convMenu').style.display = 'none';
  document.getElementById('convApp').style.display = 'flex';
  document.getElementById('convResults').style.display = 'none';
  expectingSvo = false;
  currentConvId = id;
  currentTurn = 0;
  
  const conv = convData.find(c => c.id === id);
  document.getElementById('convTitle').textContent = conv.title;
  document.getElementById('convChat').innerHTML = '';
  
  nextConvTurn();
}

function exitConv() {
  document.getElementById('convMenu').style.display = 'block';
  document.getElementById('convApp').style.display = 'none';
}

function nextConvTurn() {
  const conv = convData.find(c => c.id === currentConvId);
  const turn = conv.turns[currentTurn];
  
  document.getElementById('convProgress').textContent = 'Turno '+(currentTurn+1)+'/'+conv.turns.length;

  if (!turn) {
     document.getElementById('convSvoArea').style.display = 'none';
     document.getElementById('convResults').style.display = 'flex';
     return;
  }

  if (turn.role === 'interviewer') {
     document.getElementById('convSvoArea').style.display = 'none';
     appendChat(turn.text, 'interviewer');
     speak(turn.text);
     setTimeout(() => {
        currentTurn++;
        nextConvTurn();
     }, 2000);
  } else {
     document.getElementById('convSvoArea').style.display = 'block';
     document.getElementById('svoSendBtn').style.display = 'none';
     document.getElementById('convMeaning').innerHTML = `"Objetivo: `+turn.meaning+`"`;
     
     document.getElementById('slot-s').className = 'svo-slot'; document.getElementById('slot-s').textContent = 'Sujeto';
     document.getElementById('slot-v').className = 'svo-slot'; document.getElementById('slot-v').textContent = 'Verbo';
     document.getElementById('slot-o').className = 'svo-slot'; document.getElementById('slot-o').textContent = 'Objeto';
     
     currentSvoMap = { s: turn.s, v: turn.v, o: turn.o };
     currentSvoState = 0;
     
     let blocks = [
        {type: 's', txt: turn.s},
        {type: 'v', txt: turn.v},
        {type: 'o', txt: turn.o}
     ].sort(() => Math.random() - 0.5);
     
     document.getElementById('svoBlocks').innerHTML = blocks.map(b => '<div class="svo-block" onclick="clickSvoBlock(this, \\''+b.type+'\\', \\''+b.txt.replace(/'/g,"\\\\'")+'\\')">'+b.txt+'</div>').join('');
  }
}

function appendChat(text, role) {
  const chat = document.getElementById('convChat');
  // If role is user, add checkmark automatically
  chat.innerHTML += '<div class="chat-msg chat-'+role+'">' + (role === 'user' ? '👤 ' : '💼 ') + text + '</div>';
  chat.scrollTop = chat.scrollHeight;
}

function clickSvoBlock(el, type, txt) {
   const expectedType = currentSvoState === 0 ? 's' : currentSvoState === 1 ? 'v' : 'o';
   if (type === expectedType) {
       el.style.display = 'none';
       const slotId = 'slot-' + type;
       const slot = document.getElementById(slotId);
       slot.textContent = txt;
       slot.classList.add('filled');
       speak(txt);
       
       currentSvoState++;
       if (currentSvoState === 3) {
           document.getElementById('svoSendBtn').style.display = 'flex';
       }
   } else {
       el.classList.remove('wrong');
       setTimeout(() => el.classList.add('wrong'), 10);
   }
}

function submitConvTurn() {
   const s = document.getElementById('slot-s').textContent;
   const v = document.getElementById('slot-v').textContent;
   const o = document.getElementById('slot-o').textContent;
   
   appendChat(s + ' ' + v + ' ' + o + '.', 'user');
   
   currentTurn++;
   // Slight delay for realism
   document.getElementById('convSvoArea').style.display = 'none';
   setTimeout(() => nextConvTurn(), 1000);
}

function rateConv(rate) {
   let fsrs = JSON.parse(localStorage.getItem('eng_conv_fsrs')||'{}');
   let c = fsrs[currentConvId] || { interval:0, ease:2.5, reps:0 };
   
   if(rate === 'hard') { c.interval=1; c.ease=Math.max(1.3, c.ease-0.2); c.reps=0; }
   else if(rate === 'good') { c.interval=Math.max(1, Math.round(c.interval===0?1:c.interval*c.ease)); c.reps++; addXP(50); S.r++; }
   else if(rate === 'easy') { c.interval=Math.max(2, Math.round(c.interval===0?2:c.interval*c.ease*1.3)); c.ease+=0.15; c.reps++; addXP(100); S.r++; }
   
   c.nextDue = Date.now() + (c.interval * 86400000);
   fsrs[currentConvId] = c;
   localStorage.setItem('eng_conv_fsrs', JSON.stringify(fsrs));
   
   save(); upd();
   exitConv();
   renderConvMenu();
}
// ═══════════════════════════
"""

html = html.replace("// Professional", js_engine + "\n// Professional")

# 4. Remove old conv renders from init()
html = re.sub(r"renderConv\('greetings'\);", "loadConvEngine();", html)
html = re.sub(r"setupFilter\('cC',renderConv\);", "", html)
# Build named pills for old cC is there, we should remove it to clean up the UI
html = re.sub(r"buildNamedPills\('cC',.*?\);", "", html)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(html)
