// ══════════════════════════════════════════════════════════════
// DA-2026 · INDEX.JS — Global Dashboard + Mission Control
// Extracted from index.html monolith + Pipeline/Goal/Activity
// ══════════════════════════════════════════════════════════════

// ── CLOCK & GREETING ──────────────────────────────
function updateClock(){
  const n=new Date(),h=n.getHours(),m=String(n.getMinutes()).padStart(2,'0');
  document.getElementById('clock').textContent=h+':'+m;
  const g=['Buenas noches','Buenos días','Buenas tardes','Buenas noches'];
  const p=h<6?0:h<12?1:h<19?2:3;
  const name=localStorage.getItem('sb_name')||'';
  document.getElementById('greeting').textContent=g[p]+(name?', '+name:'');
}
updateClock();setInterval(updateClock,30000);

const days=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const months=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const now=new Date();
document.getElementById('todayDate').textContent=days[now.getDay()]+' '+now.getDate()+' '+months[now.getMonth()]+' '+now.getFullYear();

// ── TASKS ─────────────────────────────────────────
function getTasks(){
  const today=new Date().toISOString().split('T')[0];
  try{return(JSON.parse(localStorage.getItem('sb_tasks')||'{}'))[today]||[]}catch(e){return[]}
}
function saveTasks(tasks){
  const today=new Date().toISOString().split('T')[0];
  try{const d=JSON.parse(localStorage.getItem('sb_tasks')||'{}');d[today]=tasks;const k=Object.keys(d).sort();if(k.length>30)k.slice(0,k.length-30).forEach(x=>delete d[x]);localStorage.setItem('sb_tasks',JSON.stringify(d))}catch(e){}
}
function renderTasks(){
  const tasks=getTasks(),el=document.getElementById('taskList');
  if(!tasks.length){el.innerHTML='<div style="text-align:center;padding:16px;color:var(--tx3);font-size:12px">Sin tareas aún.</div>'}
  else{el.innerHTML=tasks.map((t,i)=>'<div class="task"><div class="task-check'+(t.done?' done':'')+'" onclick="toggleTask('+i+')">'+(t.done?'✓':'')+'</div><span class="task-text'+(t.done?' done-text':'')+'">'+t.text+'</span><span class="task-cat">'+catL(t.cat)+'</span><button class="task-del" onclick="delTask('+i+')">✕</button></div>').join('')}
  document.getElementById('statTasks').textContent=tasks.filter(t=>!t.done).length;
}
function catL(c){return{study:'📚',work:'💼',personal:'🏠',health:'💪'}[c]||'📌'}
function addTask(text,cat){
  const input=document.getElementById('taskInput'),t=text||input.value.trim(),c=cat||document.getElementById('taskCat').value;
  if(!t)return;const tasks=getTasks();tasks.push({text:t,cat:c,done:false});saveTasks(tasks);if(!text)input.value='';renderTasks();
}
function toggleTask(i){const t=getTasks();t[i].done=!t[i].done;saveTasks(t);renderTasks()}
function delTask(i){const t=getTasks();t.splice(i,1);saveTasks(t);renderTasks()}

// ── POMODORO ──────────────────────────────────────
let pomoInt=null,pomoSec=1500,pomoOn=false;
function fmtT(s){return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}
function togglePomo(){
  if(pomoOn){clearInterval(pomoInt);pomoOn=false;document.getElementById('pomoBtn').innerHTML='▶ Iniciar';return}
  pomoOn=true;document.getElementById('pomoBtn').innerHTML='⏸ Pausar';
  pomoInt=setInterval(()=>{
    pomoSec--;document.getElementById('pomoTime').textContent=fmtT(pomoSec);
    if(pomoSec<=0){
      clearInterval(pomoInt);pomoOn=false;document.getElementById('pomoBtn').innerHTML='▶ Iniciar';
      document.getElementById('ratePanel').style.display='block';
      const total=parseInt(localStorage.getItem('sb_pomo_total')||'0')+1;
      localStorage.setItem('sb_pomo_total',String(total));
      const td=new Date().toISOString().split('T')[0],tc=parseInt(localStorage.getItem('sb_pomo_'+td)||'0')+1;
      localStorage.setItem('sb_pomo_'+td,String(tc));
      document.getElementById('pomoCount').textContent=tc;
      document.getElementById('pomoTotal').textContent=total;
      const hrs=parseInt(localStorage.getItem('sb_hours')||'0');
      localStorage.setItem('sb_hours',String(hrs+1));updateStats();
      pomoSec=1500;document.getElementById('pomoTime').textContent=fmtT(pomoSec);
    }
  },1000);
}
function resetPomo(){clearInterval(pomoInt);pomoOn=false;pomoSec=1500;document.getElementById('pomoTime').textContent='25:00';document.getElementById('pomoBtn').innerHTML='▶ Iniciar';document.getElementById('ratePanel').style.display='none'}
function rateSess(v){
  document.querySelectorAll('.rate-star').forEach((s,i)=>s.classList.toggle('on',i<v));
  const r=JSON.parse(localStorage.getItem('sb_ratings')||'[]');r.push({v,d:new Date().toISOString()});
  localStorage.setItem('sb_ratings',JSON.stringify(r));setTimeout(()=>document.getElementById('ratePanel').style.display='none',600);updateStats();
}
const pt=new Date().toISOString().split('T')[0];
document.getElementById('pomoCount').textContent=localStorage.getItem('sb_pomo_'+pt)||'0';
document.getElementById('pomoTotal').textContent=localStorage.getItem('sb_pomo_total')||'0';

// ── CAJITA TECH ───────────────────────────────────
function renderDeals(){
  const el=document.getElementById('cajitaDeals');
  el.innerHTML='<div style="text-align:center;padding:10px;color:var(--tx3);font-size:10px">Cargando ofertas...</div>';
  fetch('data/recommendations.json').then(r=>r.json()).then(data=>{
    if(!data||!data.length){el.innerHTML='<div style="text-align:center;padding:10px;color:var(--tx3);font-size:10px">No hay ofertas nuevas</div>';return}
    el.innerHTML=data.slice(0,5).map((d,i)=>{
      const tags=(d.isFree?'<span class="cj-tag cj-free">Gratis</span>':'')+(d.isEarlyAlert?'<span class="cj-tag cj-hot">Hot '+d.temp+'°</span>':(!d.isFree?'<span class="cj-tag" style="background:var(--el);border:1px solid var(--bd2)">'+d.temp+'°</span>':''));
      const icon=i===0?'🔥':(d.isFree?'🎁':'⚡');
      return '<a href="'+d.link+'" target="_blank" rel="noopener" class="cj-deal"><div class="cj-icon">'+icon+'</div><div class="cj-info"><div class="cj-title">'+d.title+'</div><div class="cj-meta">'+tags+'</div></div></a>';
    }).join('');
  }).catch(()=>{
    el.innerHTML='<div style="text-align:center;padding:10px;color:var(--tx3);font-size:10px">Error de conexión</div>';
  });
}

// ── STATS ─────────────────────────────────────────
function updateStats(){
  if(!localStorage.getItem('sb_start'))localStorage.setItem('sb_start',new Date().toISOString());
  document.getElementById('statDays').textContent=Math.max(1,Math.floor((new Date()-new Date(localStorage.getItem('sb_start')))/864e5));
  document.getElementById('statStreak').textContent=(localStorage.getItem('sb_streak')||'0')+'🔥';
  document.getElementById('statHours').textContent=(localStorage.getItem('sb_hours')||'0')+'h';
  const r=JSON.parse(localStorage.getItem('sb_ratings')||'[]');
  if(r.length){document.getElementById('statProd').textContent=(r.reduce((a,x)=>a+x.v,0)/r.length).toFixed(1)+'⭐'}
}

// ── RSS FEED ──────────────────────────────────────
function renderFeed(){
  const el=document.getElementById('feedGrid');
  el.innerHTML='<div style="text-align:center;padding:20px;color:var(--tx3);font-size:11px">Cargando noticias...</div>';
  const feeds=['https://www.xataka.com/rss.xml','https://www.genbeta.com/rss.xml','https://www.portafolio.co/rss/tecnologia','https://www.eleconomista.es/rss/rss-tecnologia'];
  const srcMap={'xataka.com':'Xataka','genbeta.com':'Genbeta','portafolio.co':'Portafolio','eleconomista.es':'El Economista'};
  const API='https://api.rss2json.com/v1/api.json?rss_url=';
  Promise.allSettled(feeds.map(url=>fetch(API+encodeURIComponent(url)).then(r=>r.json()))).then(results=>{
    let items=[];
    const esc=s=>{const el=document.createElement('div');el.textContent=s||'';return el.innerHTML};
    results.forEach(r=>{if(r.status==='fulfilled'&&r.value.status==='ok'&&r.value.items){
      const host=r.value.feed?.link||'';
      const src=Object.entries(srcMap).find(([k])=>host.includes(k));
      r.value.items.slice(0,4).forEach(it=>items.push({t:esc(it.title),l:it.link,s:src?src[1]:'Tech',d:it.pubDate}));
    }});
    const seen=new Set();items=items.filter(i=>{if(seen.has(i.t))return false;seen.add(i.t);return true});
    items.sort((a,b)=>new Date(b.d)-new Date(a.d));
    if(!items.length){el.innerHTML='<div style="text-align:center;padding:20px;color:var(--tx3);font-size:11px">No se pudieron cargar noticias. <a href="news.html" style="color:var(--ac2)">Ir al módulo completo →</a></div>';return}
    el.innerHTML=items.slice(0,8).map(i=>{
      const ago=Math.floor((Date.now()-new Date(i.d))/36e5);
      const agoTxt=ago<1?'Ahora':ago<24?ago+'h':Math.floor(ago/24)+'d';
      return '<div class="feed-card"><div class="feed-src">'+i.s+'</div><div class="feed-title">'+i.t+'</div><div class="feed-bottom"><div class="feed-time">'+agoTxt+'</div><div style="display:flex;gap:3px"><a href="'+i.l+'" target="_blank" rel="noopener" class="feed-action" style="background:var(--ac);border-color:var(--ac);color:#fff" onclick="event.stopPropagation()">Leer →</a><button class="feed-action" onclick="event.stopPropagation();feedToTask(\''+i.t.replace(/'/g,"\\'")+'\')">+ Tarea</button></div></div></div>';
    }).join('');
  }).catch(()=>{el.innerHTML='<div style="text-align:center;padding:20px;color:var(--tx3);font-size:11px">Feed offline. <a href="news.html" style="color:var(--ac2)">Ver noticias →</a></div>'});
}
function feedToTask(t){addTask('📰 '+t,'study');alert('✅ Agregado a tareas')}

// ── QUOTE ─────────────────────────────────────────
function renderQuote(){
  const q=[{t:"The goal is to turn data into information, and information into insight.",a:"Carly Fiorina"},{t:"Without data, you're just another person with an opinion.",a:"W. Edwards Deming"},{t:"The world rewards those who are consistent, not those who are motivated.",a:"Anónimo"},{t:"You don't have to be great to start, but you have to start to be great.",a:"Zig Ziglar"},{t:"Success is the sum of small efforts, repeated day in and day out.",a:"Robert Collier"},{t:"Discipline is choosing between what you want now and what you want most.",a:"Abraham Lincoln"},{t:"Every expert was once a beginner.",a:"Helen Hayes"},{t:"What gets measured gets managed.",a:"Peter Drucker"},{t:"Learning never exhausts the mind.",a:"Leonardo da Vinci"},{t:"In God we trust. All others must bring data.",a:"W. Edwards Deming"}];
  const today=new Date().getDate()%q.length;
  document.getElementById('quoteText').textContent='"'+q[today].t+'"';
  document.getElementById('quoteAuthor').textContent='— '+q[today].a;
}

// ══════════════════════════════════════════════════════════════
// MISSION CONTROL — VacancyDB Pipeline + Weekly Goals
// ══════════════════════════════════════════════════════════════

function getVDB(){
  try{return JSON.parse(localStorage.getItem('da_vacancies')||'[]')}catch(e){return[]}
}

function renderPipeline(){
  const el=document.getElementById('mcPipeline');
  if(!el)return;
  const vdb=getVDB();
  const total=vdb.length;

  // Count by column
  const cols={saved:0,applied:0,interview:0,offer:0,rejected:0};
  vdb.forEach(v=>{
    const c=(v.column||'saved').toLowerCase();
    if(cols.hasOwnProperty(c)) cols[c]++;
    else cols.saved++;
  });

  // Conversion rates
  const applyRate=total>0?Math.round((cols.applied+cols.interview+cols.offer)/Math.max(1,total)*100):0;
  const interviewRate=(cols.applied+cols.interview+cols.offer)>0?Math.round((cols.interview+cols.offer)/Math.max(1,cols.applied+cols.interview+cols.offer)*100):0;
  const offerRate=(cols.interview+cols.offer)>0?Math.round(cols.offer/Math.max(1,cols.interview+cols.offer)*100):0;

  // Progress bar: how far along the pipeline
  const activeInPipeline=cols.applied+cols.interview+cols.offer;
  const pipePercent=total>0?Math.round(activeInPipeline/total*100):0;

  el.innerHTML=`
    <div class="pipe-row">
      <div class="pipe-stat"><div class="pipe-stat-v" style="color:var(--tx3)">${cols.saved}</div><div class="pipe-stat-l">Guardadas</div></div>
      <div class="pipe-stat"><div class="pipe-stat-v" style="color:var(--ac2)">${cols.applied}</div><div class="pipe-stat-l">Aplicadas</div></div>
      <div class="pipe-stat"><div class="pipe-stat-v" style="color:var(--am)">${cols.interview}</div><div class="pipe-stat-l">Entrevista</div></div>
      <div class="pipe-stat"><div class="pipe-stat-v" style="color:var(--gn)">${cols.offer}</div><div class="pipe-stat-l">Ofertas</div></div>
      <div class="pipe-stat"><div class="pipe-stat-v" style="color:var(--rd)">${cols.rejected}</div><div class="pipe-stat-l">Rechazadas</div></div>
    </div>
    <div class="pipe-bar"><div class="pipe-bar-fill" style="width:${pipePercent}%;background:linear-gradient(90deg,var(--ac),var(--gn))"></div></div>
    <div class="pipe-rates">
      <div class="pipe-rate">Apply: <b>${applyRate}%</b></div>
      <div class="pipe-rate">Interview: <b>${interviewRate}%</b></div>
      <div class="pipe-rate">Win: <b>${offerRate}%</b></div>
      <div class="pipe-rate" style="margin-left:auto;color:var(--tx3)">Total: <b>${total}</b></div>
    </div>`;
}

function renderWeeklyGoal(){
  const el=document.getElementById('mcGoal');
  if(!el)return;

  const WEEKLY_TARGET=10; // applications per week target
  const vdb=getVDB();
  const today=new Date();
  const dayOfWeek=today.getDay(); // 0=Sun
  const mondayOffset=dayOfWeek===0?6:dayOfWeek-1;

  // Get start of week (Monday)
  const weekStart=new Date(today);
  weekStart.setDate(today.getDate()-mondayOffset);
  weekStart.setHours(0,0,0,0);

  // Count applications this week (by appliedDate or date, in Applied/Interview/Offer columns)
  const appliedCols=['applied','interview','offer'];
  const weekApps=vdb.filter(v=>{
    if(!appliedCols.includes((v.column||'').toLowerCase()))return false;
    const d=v.appliedDate||v.date||'';
    if(!d)return false;
    const vDate=new Date(d);
    return vDate>=weekStart;
  });

  const count=weekApps.length;
  const pct=Math.min(100,Math.round(count/WEEKLY_TARGET*100));

  // Ring SVG (simple progress ring)
  const r=36,cx=42,cy=42,stroke=6;
  const circ=2*Math.PI*r;
  const offset=circ-(pct/100)*circ;
  const ringColor=pct>=100?'var(--gn)':pct>=60?'var(--am)':'var(--ac2)';

  // Day-by-day breakdown (Mon–Sun)
  const dayLabels=['L','M','X','J','V','S','D'];
  let daysHTML='';
  for(let i=0;i<7;i++){
    const dayDate=new Date(weekStart);
    dayDate.setDate(weekStart.getDate()+i);
    const dayStr=dayDate.toISOString().split('T')[0];
    const isToday=dayStr===today.toISOString().split('T')[0];
    const dayCount=vdb.filter(v=>{
      if(!appliedCols.includes((v.column||'').toLowerCase()))return false;
      const d=(v.appliedDate||v.date||'').split('T')[0];
      return d===dayStr;
    }).length;
    const hit=dayCount>0;
    daysHTML+=`<div class="goal-day${hit?' hit':''}${isToday?' today':''}" title="${dayStr}: ${dayCount} apps">${dayLabels[i]}${hit?'<br>'+dayCount:''}</div>`;
  }

  el.innerHTML=`
    <div class="goal-ring">
      <svg width="84" height="84" viewBox="0 0 84 84">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--el)" stroke-width="${stroke}"/>
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${ringColor}" stroke-width="${stroke}"
          stroke-dasharray="${circ}" stroke-dashoffset="${offset}"
          stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})" style="transition:stroke-dashoffset .6s"/>
        <text x="${cx}" y="${cy-4}" text-anchor="middle" fill="var(--tx)" font-family="IBM Plex Mono" font-size="16" font-weight="700">${count}</text>
        <text x="${cx}" y="${cy+10}" text-anchor="middle" fill="var(--tx3)" font-size="8">/${WEEKLY_TARGET}</text>
      </svg>
      <div class="goal-info">
        <div class="goal-count">${pct}%</div>
        <div class="goal-label">Meta semanal de aplicaciones (${count}/${WEEKLY_TARGET})</div>
      </div>
    </div>
    <div class="goal-days">${daysHTML}</div>`;
}

function renderRecentActivity(){
  const el=document.getElementById('mcActivity');
  if(!el)return;
  const vdb=getVDB();

  // Build activity list from VDB entries, sorted by most recent
  const activities=vdb.map(v=>{
    const col=(v.column||'saved').toLowerCase();
    const date=v.appliedDate||v.date||v.savedDate||'';
    return{
      company:v.company||'Empresa',
      role:v.role||'Puesto',
      column:col,
      date:date
    };
  }).filter(a=>a.date).sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,8);

  if(!activities.length){
    el.innerHTML='<div style="text-align:center;padding:16px;color:var(--tx3);font-size:11px">Sin actividad reciente. Analiza vacantes en el <a href="apply.html" style="color:var(--ac2)">Command Center</a> y guárdalas.</div>';
    return;
  }

  const colLabels={saved:'Guardada',applied:'Aplicada',interview:'Entrevista',offer:'Oferta',rejected:'Rechazada'};
  const colVerbs={saved:'guardó',applied:'aplicó a',interview:'entrevista con',offer:'oferta de',rejected:'rechazada por'};

  el.innerHTML=activities.map(a=>{
    const ago=timeAgo(a.date);
    return `<div class="act-item">
      <div class="act-dot act-dot-${a.column}"></div>
      <div class="act-text"><strong>${a.company}</strong> — ${colVerbs[a.column]||a.column} ${a.role}</div>
      <div class="act-time">${ago}</div>
    </div>`;
  }).join('');
}

function timeAgo(dateStr){
  const diff=Date.now()-new Date(dateStr).getTime();
  const mins=Math.floor(diff/60000);
  if(mins<1)return 'ahora';
  if(mins<60)return mins+'m';
  const hrs=Math.floor(mins/60);
  if(hrs<24)return hrs+'h';
  const d=Math.floor(hrs/24);
  return d+'d';
}

function renderQuickActions(){
  const el=document.getElementById('mcQuick');
  if(!el)return;
  el.innerHTML=`
    <div class="qa-grid">
      <a href="apply.html" class="qa-btn"><span class="qa-btn-icon">🎯</span> Analizar Vacante</a>
      <a href="jobs.html#tracker" class="qa-btn"><span class="qa-btn-icon">📋</span> Ver Tracker</a>
      <a href="jobs.html#kanban" class="qa-btn"><span class="qa-btn-icon">📊</span> Kanban</a>
      <a href="apply.html#cv" class="qa-btn"><span class="qa-btn-icon">📄</span> CV Weaver</a>
      <a href="ruta.html" class="qa-btn"><span class="qa-btn-icon">🗺️</span> Ruta DA</a>
      <a href="english.html" class="qa-btn"><span class="qa-btn-icon">🇺🇸</span> English</a>
    </div>`;
}

// ── INIT MISSION CONTROL ──────────────────────────
function initMissionControl(){
  renderPipeline();
  renderWeeklyGoal();
  renderRecentActivity();
  renderQuickActions();
}

// ── ONBOARDING ────────────────────────────────────
(function(){if(!localStorage.getItem('sb_name')){const n=prompt('¿Cuál es tu nombre?');if(n)localStorage.setItem('sb_name',n.trim())}})();

// ── STREAK ────────────────────────────────────────
(function(){
  const last=localStorage.getItem('sb_last'),today=new Date().toISOString().split('T')[0];
  if(last!==today){
    const y=new Date(Date.now()-864e5).toISOString().split('T')[0];
    let s=parseInt(localStorage.getItem('sb_streak')||'0');
    if(last===y)s++;else s=1;
    localStorage.setItem('sb_streak',String(s));localStorage.setItem('sb_last',today);
  }
})();

// ── BOOT ──────────────────────────────────────────
renderTasks();updateStats();renderFeed();renderQuote();renderDeals();initMissionControl();
