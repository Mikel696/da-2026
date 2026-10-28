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

// ── DEALS & OFFERS ───────────────────────────────
function renderDealsPanel(){
  const srcEl=document.getElementById('dealsSources');
  const listEl=document.getElementById('dealsList');
  if(!srcEl||!listEl)return;

  fetch('data/deals.json').then(r=>r.json()).then(data=>{
    const cats=data.sources||[];
    const sites=data.sites||[];

    // Category filter chips
    srcEl.innerHTML=`<button class="ds-chip active" data-cat="all"><span class="ds-chip-icon">📌</span>Todos</button>`+
      cats.map(c=>`<button class="ds-chip" data-cat="${c.id}"><span class="ds-chip-icon">${c.icon}</span>${c.label}</button>`).join('');

    function renderSites(filter){
      const filtered=filter==='all'?sites:sites.filter(s=>s.cat===filter);
      const catMap={};cats.forEach(c=>catMap[c.id]=c);
      const grouped={};
      filtered.forEach(s=>{if(!grouped[s.cat])grouped[s.cat]=[];grouped[s.cat].push(s)});

      let html='';
      for(const [catId,items] of Object.entries(grouped)){
        const cat=catMap[catId]||{label:catId,icon:'🔗'};
        html+=`<div class="dl-cat"><div class="dl-cat-label">${cat.icon} ${cat.label}</div><div class="dl-cat-grid">`;
        items.forEach(s=>{
          html+=`<a href="${s.url}" target="_blank" rel="noopener" class="dl-btn" title="${s.desc}">${s.name}</a>`;
        });
        html+='</div></div>';
      }
      if(!filtered.length) html='<div style="text-align:center;padding:16px;color:var(--tx3);font-size:11px">Sin sitios en esta categoria.</div>';
      listEl.innerHTML=html;
    }

    renderSites('all');

    srcEl.querySelectorAll('.ds-chip').forEach(chip=>{
      chip.addEventListener('click',()=>{
        srcEl.querySelectorAll('.ds-chip').forEach(c=>c.classList.remove('active'));
        chip.classList.add('active');
        renderSites(chip.dataset.cat);
      });
    });
  }).catch(()=>{
    listEl.innerHTML='<div style="text-align:center;padding:16px;color:var(--tx3);font-size:11px">No se pudieron cargar las ofertas.</div>';
  });
}

// ── URGENT TASKS ─────────────────────────────────
function renderUrgentTasks(){
  const el=document.getElementById('urgentTasks');
  const badge=document.getElementById('urgentCount');
  if(!el)return;

  const urgentItems=[];
  const today=new Date().toISOString().split('T')[0];

  // 1. Academic tasks from 10-SYS (sys_ localStorage)
  try{
    const sysTasks=JSON.parse(localStorage.getItem('sys_tasks')||'[]');
    const pending=sysTasks.filter(t=>!t.done);
    pending.forEach(t=>{
      const daysLeft=t.due?Math.floor((new Date(t.due)-new Date(today))/(864e5)):99;
      if(daysLeft<=7){
        urgentItems.push({
          text:t.text,
          meta:(t.subj||'CUN')+(t.due?' · '+t.due:''),
          daysLeft,
          type:daysLeft<0?'overdue':daysLeft===0?'today':'soon',
          link:'systems.html'
        });
      }
    });
  }catch(e){}

  // 2. Static alerts from scan data
  const staticAlerts=[
    {text:'Completar curso "Inducción TICS - Estudiantes" en CUN Digital',meta:'CUN Digital · 0% completado · 7 secciones',daysLeft:2,type:'action',link:'https://cdigital.cun.edu.co/course/view.php?id=28494'},
    {text:'Subir documentos pendientes en CUN 360',meta:'CUN 360 · Documentos requeridos',daysLeft:5,type:'action',link:'https://360.cunapp.pro/#/estudiante/dashboard'},
  ];
  urgentItems.push(...staticAlerts);

  // 3. Job hunting tasks (vacancies that need follow-up)
  try{
    const vdb=JSON.parse(localStorage.getItem('da_vacancies')||'[]');
    const applied=vdb.filter(v=>(v.column||'').toLowerCase()==='applied');
    if(applied.length>0){
      urgentItems.push({
        text:`${applied.length} vacante${applied.length>1?'s':''} aplicada${applied.length>1?'s':''} — hacer follow-up`,
        meta:'Job Tracker · Pipeline activo',
        daysLeft:3,
        type:'action',
        link:'jobs.html'
      });
    }
  }catch(e){}

  // Sort by urgency
  urgentItems.sort((a,b)=>a.daysLeft-b.daysLeft);

  if(badge)badge.textContent=urgentItems.length;
  document.getElementById('statTasks').textContent=urgentItems.length;

  if(!urgentItems.length){
    el.innerHTML='<div style="text-align:center;padding:16px;color:var(--gn);font-size:11px">✅ ¡Todo al día! Sin tareas urgentes.</div>';
    return;
  }

  el.innerHTML=urgentItems.map(t=>{
    const dotClass='urg-dot-'+(t.type||'soon');
    const timeLabel=t.daysLeft<0?`<span style="color:var(--rd);font-weight:600">Vencida hace ${Math.abs(t.daysLeft)}d</span>`:
      t.daysLeft===0?'<span style="color:var(--or);font-weight:600">HOY</span>':
      t.daysLeft<=2?`<span style="color:var(--am)">${t.daysLeft}d restantes</span>`:
      `${t.daysLeft}d`;
    return `<div class="urg-item">
      <div class="urg-dot ${dotClass}"></div>
      <div class="urg-info">
        <div class="urg-text">${t.text}</div>
        <div class="urg-meta">${t.meta} · ${timeLabel} · <a href="${t.link}" class="urg-link">Ir →</a></div>
      </div>
    </div>`;
  }).join('');
}

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

// ── (Legacy Cajita — replaced by renderDealsPanel) ──

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
function feedToTask(t){alert('📰 '+t+'\n\nAbre el módulo 10-SYS para agregar tareas.')}

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
(function(){if(!localStorage.getItem('sb_name')){localStorage.setItem('sb_name','Miguel')}})();

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
setTimeout(()=>{renderDealsPanel();renderUrgentTasks();updateStats();renderFeed();renderQuote();initMissionControl()},0);
