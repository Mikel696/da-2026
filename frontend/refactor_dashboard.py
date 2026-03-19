import codecs
import re

with codecs.open('index.html', 'r', 'utf-8') as f:
    html = f.read()

# 1. Tareas del Dia + English Memorization
# Extrayendo the actual 'today' string
today_match = re.search(r'<div class="today">.*?<div id="taskList"></div>.*?</div>', html, re.DOTALL)
if today_match:
    old_today = today_match.group(0)
    
    new_today = '''<div class="today"><div class="today-header"><div class="today-title">📋 Tareas del Día</div><div class="today-date" id="todayDate"></div></div><div class="task-add" style="margin-top:0; margin-bottom:14px;"><input class="task-input" id="taskInput" placeholder="Agregar tarea..." onkeydown="if(event.key==='Enter')addTask()"><select class="task-select" id="taskCat"><option value="study">📚 Estudio</option><option value="work">💼 Trabajo</option><option value="personal">🏠 Personal</option><option value="health">💪 Salud</option></select><button class="task-btn" onclick="addTask()">+ Agregar</button></div><div id="taskList" style="min-height:50px;"></div><hr style="border-color: hsla(0,0%,100%,0.05); margin: 20px 0;"><div class="english-daily"><div class="sec-label" style="margin-bottom:8px; border:none;">🇬🇧 English Memorization</div><div class="eng-phrase" id="engPhrase" style="font-size:13px; font-weight:500; font-style:italic; color:var(--tx); margin-bottom:4px;"></div><div class="eng-trans" id="engTrans" style="font-size:11px; color:var(--tx3);"></div></div></div>'''
    html = html.replace(old_today, new_today)

# 2. Reemplazo Finanzas por Deals
fin_match = re.search(r'<div class="fin">.*?<button class="fin-btn fin-btn-e" onclick="addFin\(\'exp\'\)">− Gas</button></div></div>', html, re.DOTALL)
if fin_match:
    old_fin = fin_match.group(0)
    new_deals = '''<div class="deals mod" style="background: hsla(240, 10%, 8%, 0.6) !important; backdrop-filter: blur(12px) !important; border: 1px solid hsla(0,0%,100%,0.07) !important; border-radius:12px; padding:16px"><div class="deals-title" style="font-size:12px;font-weight:600;margin-bottom:12px;">🎁 Ofertas y Regalos</div><div class="deals-list" id="dealsList" style="display:flex;flex-direction:column;gap:10px;"></div><div id="dealsEmpty" style="display:none; color: var(--tx3); font-size:11px; font-style: italic; text-align:center; padding: 10px 0;">Buscando próximas oportunidades...</div></div>'''
    html = html.replace(old_fin, new_deals)

# 3. Remover logica de finanzas del script
fin_logic = re.search(r'function getFin\(\).*?renderFin\(\)', html, re.DOTALL)
if fin_logic:
    html = html.replace(fin_logic.group(0), '')

# 4. Injectar logica de deals y english
new_logic = '''
async function renderDeals() {
    try {
        const res = await fetch('data/deals.json');
        const deals = await res.json();
        const el = document.getElementById('dealsList');
        const empty = document.getElementById('dealsEmpty');
        
        if(!deals || deals.length === 0) {
            empty.style.display = 'block';
            el.innerHTML = '';
            return;
        }
        
        el.innerHTML = deals.map(d => {
            let badge = '';
            if(d.isFree) badge = '<span style="font-size:8px;font-weight:800;letter-spacing:0.5px;padding:2px 6px;border-radius:4px;background:hsla(142, 100%, 50%, 0.15);color:hsl(142, 100%, 65%);border:1px solid hsla(142, 100%, 50%, 0.3);margin-bottom:6px;display:inline-block">GRATIS</span>';
            else if(d.isEarlyAlert) badge = '<span style="font-size:8px;font-weight:800;letter-spacing:0.5px;padding:2px 6px;border-radius:4px;background:hsla(30, 100%, 50%, 0.15);color:hsl(30, 100%, 65%);border:1px solid hsla(30, 100%, 50%, 0.3);margin-bottom:6px;display:inline-block">ALERTA TEMPRANA</span>';
            
            return `<div style="display:flex;flex-direction:column;font-size:11px;line-height:1.4;border-bottom:1px solid hsla(0,0%,100%,0.05);padding-bottom:8px">
                <div>${badge}</div>
                <a href="${d.link}" target="_blank" style="color:var(--tx2);text-decoration:none;font-weight:500;transition:color 0.2s" onmouseover="this.style.color='var(--ac)'" onmouseout="this.style.color='var(--tx2)'">${d.title}</a>
            </div>`;
        }).join('');
    } catch(e) {
        document.getElementById('dealsEmpty').style.display = 'block';
        document.getElementById('dealsEmpty').textContent = 'Error cargando ofertas.';
    }
}

async function renderEnglish() {
    try {
        const res = await fetch('data/phrases.json');
        const phrases = await res.json();
        const epochDays = Math.floor(Date.now() / 86400000);
        const phrase = phrases[epochDays % phrases.length];
        
        document.getElementById('engPhrase').textContent = `"${phrase.en}"`;
        document.getElementById('engTrans').textContent = `"${phrase.es}"`;
    } catch(e) {
        document.getElementById('engPhrase').textContent = '"Consistency is key."';
        document.getElementById('engTrans').textContent = '"La consistencia es clave."';
    }
}
renderDeals();
renderEnglish();
'''

if 'renderDeals();' not in html:
    html = html.replace('renderTasks();updateStats();renderFeed();renderQuote();', 'renderTasks();updateStats();renderFeed();renderQuote();\n' + new_logic)

with codecs.open('index.html', 'w', 'utf-8') as f:
    f.write(html)
