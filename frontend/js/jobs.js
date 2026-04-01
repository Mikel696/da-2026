// ══════════════════════════════════════════════════════════════
// VACANCY DATABASE — SHARED STORAGE LAYER (mirrors apply.html)
// ══════════════════════════════════════════════════════════════
const VDB={
  KEY:'da_vacancies',
  getAll(){try{return JSON.parse(localStorage.getItem(this.KEY)||'[]');}catch(e){return[];}},
  save(v){
    v.updated_at=new Date().toISOString();
    const all=this.getAll();const idx=all.findIndex(x=>x.id===v.id);if(idx>=0)all[idx]=v;else all.push(v);localStorage.setItem(this.KEY,JSON.stringify(all));
    if(window.CLOUD)CLOUD.push('vacancies',v);
    return v;
  },
  get(id){return this.getAll().find(x=>x.id===id)||null;},
  del(id){
    localStorage.setItem(this.KEY,JSON.stringify(this.getAll().filter(x=>x.id!==id)));
    if(window.CLOUD)CLOUD.remove('vacancies',id);
  },
  updateStatus(id,status){const all=this.getAll();const v=all.find(x=>x.id===id);if(v){v.status=status;if(status==='applied'&&!v.appliedDate)v.appliedDate=Date.now();v.updated_at=new Date().toISOString();localStorage.setItem(this.KEY,JSON.stringify(all));if(window.CLOUD)CLOUD.push('vacancies',v);}},
  updateNotes(id,notes){const all=this.getAll();const v=all.find(x=>x.id===id);if(v){v.notes=notes;v.updated_at=new Date().toISOString();localStorage.setItem(this.KEY,JSON.stringify(all));if(window.CLOUD)CLOUD.push('vacancies',v);}}
};

// ══════════════════════════════════════════════════════════════
// PIPELINE COLUMNS CONFIG
// ══════════════════════════════════════════════════════════════
const COLS=[
  {id:'saved',   label:'💾 Guardados',  color:'var(--t2)', next:'applied'},
  {id:'applied', label:'📤 Aplicados',  color:'var(--a2)', next:'interview'},
  {id:'interview',label:'🎯 Entrevista', color:'var(--am)', next:'finalist'},
  {id:'finalist', label:'🏆 Finalista',  color:'var(--gn)', next:null}
];
const COL_MAP=Object.fromEntries(COLS.map(c=>[c.id,c]));
// Map legacy "offer" status to "finalist"
function normStatus(s){return s==='offer'?'finalist':(COL_MAP[s]?s:'saved');}

let selectedCard=null; // {type:'vdb'|'manual', id:string|number}

// ══════════════════════════════════════════════════════════════
// UNIFIED KANBAN RENDER
// ══════════════════════════════════════════════════════════════
function getAllCards(){
  const cards=[];
  // VDB vacancies
  VDB.getAll().forEach(v=>{
    cards.push({
      type:'vdb', id:v.id, title:v.role||'Sin cargo', company:v.company||'Sin empresa',
      status:normStatus(v.status), url:v.url, date:v.ts,
      matchPct:v.match?.pct||0, ats:v.match?.ats||0, focusArea:v.match?.focusArea||'general',
      found:v.match?.found||[], missing:v.match?.missing||[],
      toneMatch:v.profile?.toneMatch, timezone:v.profile?.timezone,
      cultureFit:v.profile?.cultureFit||0, remoteReady:v.profile?.remoteReady||0,
      priority:v.profile?.applicationPriority||'',
      notes:v.notes||'', raw:v
    });
  });
  // Manual entries
  getA().forEach((x,i)=>{
    cards.push({
      type:'manual', id:i, title:x.t, company:x.c, status:normStatus(x.s),
      url:x.u, date:null, dateLabel:x.d,
      matchPct:0, ats:0, notes:'', raw:x
    });
  });
  return cards;
}

function mcColor(pct){return pct>=70?'var(--gn)':pct>=40?'var(--am)':pct>0?'var(--rd)':'var(--t3)';}

function rK(){
  const cards=getAllCards();
  const kb=document.getElementById('kb');

  kb.innerHTML=COLS.map(col=>{
    const items=cards.filter(c=>c.status===col.id);
    return`<div class="kcol" data-col="${col.id}"
      ondragover="event.preventDefault();this.classList.add('drag-over')"
      ondragleave="this.classList.remove('drag-over')"
      ondrop="handleDrop(event,'${col.id}');this.classList.remove('drag-over')">
      <div class="kh" style="color:${col.color}">${col.label}<span class="kh-cnt">${items.length}</span></div>
      <div class="k-scroll">${items.map(c=>{
        const sel=selectedCard&&selectedCard.type===c.type&&String(selectedCard.id)===String(c.id);
        const mc=mcColor(c.matchPct);
        return`<div class="ka${sel?' ka-sel':''}" draggable="true"
          ondragstart="startDrag(event,'${c.type}','${c.id}')"
          ondragend="this.classList.remove('dragging')"
          onclick="showDetail('${c.type}','${c.id}')">
          <button class="ka-del" onclick="event.stopPropagation();delCard('${c.type}','${c.id}')" title="Eliminar">✕</button>
          <div class="ka-t">${c.url?'<a href="'+c.url+'" target="_blank" style="color:var(--tx);text-decoration:none" onclick="event.stopPropagation()">'+c.title+'</a>':c.title}</div>
          <div class="ka-c">${c.company}</div>
          ${c.matchPct?'<div class="ka-m" style="color:'+mc+'">'+c.matchPct+'% match · ATS '+c.ats+'%</div>':''}
          <div class="ka-d">${c.dateLabel||( c.date?Math.floor((Date.now()-c.date)/864e5)+'d ago':'')}</div>
        </div>`;
      }).join('')}</div>
    </div>`;
  }).join('');
}

// ══════════════════════════════════════════════════════════════
// DETAIL VIEWER
// ══════════════════════════════════════════════════════════════
function showDetail(type,id){
  selectedCard={type,id:type==='manual'?parseInt(id):id};
  const card=getAllCards().find(c=>c.type===type&&String(c.id)===String(id));
  if(!card){closeDetail();return;}

  const dv=document.getElementById('detailViewer');
  document.getElementById('dvRole').textContent=card.title;
  document.getElementById('dvCompany').textContent=card.company;

  const age=card.date?Math.floor((Date.now()-card.date)/864e5):null;
  let meta=[];
  if(age!==null)meta.push('Guardado hace '+age+' día'+(age!==1?'s':''));
  if(card.focusArea&&card.focusArea!=='general')meta.push('Foco: '+card.focusArea);
  if(card.toneMatch)meta.push('Tono: '+card.toneMatch);
  if(card.timezone)meta.push('TZ: '+card.timezone);
  if(card.priority)meta.push('Prioridad: '+card.priority);
  document.getElementById('dvMeta').textContent=meta.join(' · ');

  // Meters
  const meters=document.getElementById('dvMeters');
  if(card.type==='vdb'){
    const mc=mcColor(card.matchPct);
    meters.innerHTML=`
      <div class="dv-meter"><div class="dv-meter-v" style="color:${mc}">${card.matchPct}%</div><div class="dv-meter-l">Match</div></div>
      <div class="dv-meter"><div class="dv-meter-v" style="color:${card.ats>=60?'var(--gn)':'var(--am)'}">${card.ats}%</div><div class="dv-meter-l">ATS</div></div>
      <div class="dv-meter"><div class="dv-meter-v" style="color:${card.cultureFit>=60?'var(--gn)':'var(--am)'}">${card.cultureFit}%</div><div class="dv-meter-l">Culture</div></div>
      <div class="dv-meter"><div class="dv-meter-v" style="color:${card.remoteReady>=60?'var(--gn)':'var(--am)'}">${card.remoteReady}%</div><div class="dv-meter-l">Remote</div></div>`;
  } else {
    meters.innerHTML='<div style="font-size:11px;color:var(--t3);padding:4px 0">Entrada manual — analízala en el Application Command Center para obtener métricas.</div>';
  }

  // Body
  const body=document.getElementById('dvBody');
  const topSkills=(card.found||[]).slice(0,8).map(s=>s.name||s);
  const missingSkills=(card.missing||[]).slice(0,5);
  body.innerHTML=`
    <div class="dv-sec"><h5>Skills encontrados</h5>
      ${topSkills.length?topSkills.map(s=>'<span class="sk sk-g">'+s+'</span> ').join(''):'<span style="font-size:11px;color:var(--t3)">—</span>'}
    </div>
    <div class="dv-sec"><h5>Skills faltantes</h5>
      ${missingSkills.length?missingSkills.map(s=>'<span class="sk" style="background:var(--rg);color:var(--rd);border:1px solid rgba(239,68,68,.12)">'+s+'</span> ').join(''):'<span style="font-size:11px;color:var(--gn)">✓ Sin gaps detectados</span>'}
    </div>
    <div class="dv-sec" style="grid-column:1/-1"><h5>Notas</h5>
      <textarea class="inp" style="min-height:40px;font-size:11px;resize:vertical" placeholder="Agrega notas sobre esta vacante..."
        onchange="saveNotes('${type}','${id}',this.value)">${card.notes}</textarea>
    </div>`;

  // Actions
  const actions=document.getElementById('dvActions');
  const col=COL_MAP[card.status];
  const nextCol=col?.next?COL_MAP[col.next]:null;
  actions.innerHTML=`
    ${card.type==='vdb'?'<a href="apply.html?v='+card.id+'" class="btn bp" style="font-size:12px">🔍 Abrir Perfilación Completa</a>':''}
    ${card.url?'<a href="'+card.url+'" target="_blank" rel="noopener" class="btn bo">🔗 Ver oferta original</a>':''}
    ${nextCol?'<button class="dv-advance" onclick="advanceCard(\''+type+'\',\''+id+'\',\''+nextCol.id+'\')">→ Avanzar a '+nextCol.label+'</button>':'<span class="sk sk-g" style="font-size:11px">🏆 Etapa final</span>'}
    <button class="btn bo bs" style="color:var(--rd);border-color:rgba(239,68,68,.2)" onclick="delCard('${type}','${id}')">🗑️ Eliminar</button>`;

  dv.classList.add('open');
  rK(); // re-render to highlight selected
}

function closeDetail(){
  selectedCard=null;
  document.getElementById('detailViewer').classList.remove('open');
  rK();
}

// ══════════════════════════════════════════════════════════════
// STATE TRANSITIONS
// ══════════════════════════════════════════════════════════════
function advanceCard(type,id,newStatus){
  if(type==='vdb'){
    VDB.updateStatus(id,newStatus);
  } else {
    const a=getA();const idx=parseInt(id);
    if(a[idx]){a[idx].s=newStatus;setA(a);}
  }
  rK();uS();calculateMetrics();
  if(selectedCard)showDetail(type,id);
}

function delCard(type,id){
  if(!confirm('¿Eliminar esta vacante?'))return;
  if(type==='vdb'){VDB.del(id);}
  else{const a=getA();a.splice(parseInt(id),1);setA(a);}
  closeDetail();rK();uS();calculateMetrics();
}

function saveNotes(type,id,notes){
  if(type==='vdb')VDB.updateNotes(id,notes);
  // manual entries don't support notes in jt8 schema
}

// ══════════════════════════════════════════════════════════════
// DRAG & DROP
// ══════════════════════════════════════════════════════════════
let dragData=null;
function startDrag(e,type,id){
  dragData={type,id};
  e.target.classList.add('dragging');
  e.dataTransfer.effectAllowed='move';
  e.dataTransfer.setData('text/plain','');
}
function handleDrop(e,colId){
  e.preventDefault();
  if(!dragData)return;
  advanceCard(dragData.type,dragData.id,colId);
  dragData=null;
}

// TABS
document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>{
document.querySelectorAll('.tab').forEach(x=>x.classList.remove('on'));
document.querySelectorAll('.pnl').forEach(x=>x.classList.remove('on'));
t.classList.add('on');document.getElementById('p-'+t.dataset.p).classList.add('on');
}));

// ═══ COMPANIES — ROTATION ═══
const CMP=[
{n:"ScotiaGBS Colombia",r:"Centro Servicios Scotiabank · 4000+ empleados · Bogotá",i:"Unidades de Finanzas, ScotiaTech, Analytics. Contrato indefinido. Operan en 30+ países. <strong>Buscan AP Analysts y Data Analysts frecuentemente.</strong>",m:92,c:"var(--gn)",ro:"Financial Analyst, AP Analyst, Data Analyst",lk:[["Portal Scotiabank","https://jobs.scotiabank.com/search/?q=analyst&locationsearch=bogota&locale=es_ES"],["LinkedIn ScotiaGBS","https://www.linkedin.com/jobs/search/?keywords=ScotiaGBS+analyst&location=Bogota&sortBy=DD"]]},
{n:"Globant",r:"Tech multinacional NYSE · 30K empleados · Bogotá",i:"Studios de Data & AI. Clientes: Disney, Google, Santander. <strong>$5M-$9M COP. Remoto posible.</strong>",m:78,c:"var(--a2)",ro:"Data Analyst, BI Developer, Analytics Consultant",lk:[["Careers Globant","https://board.globant.com/jobs?q=data+analyst&location=Colombia"],["LinkedIn Globant","https://www.linkedin.com/jobs/search/?keywords=Globant+data&location=Colombia&sortBy=DD"]]},
{n:"Bancolombia",r:"Banco #1 Colombia · 35K empleados",i:"Inversión masiva en datos e IA. Nequi. <strong>$4M-$8M COP.</strong> Contabilidad + Ing. Sistemas = combo perfecto.",m:85,c:"var(--am)",ro:"Analista de Datos, Analista BI, Analista Financiero",lk:[["LinkedIn Bancolombia","https://www.linkedin.com/jobs/search/?keywords=Bancolombia+analista&sortBy=DD"],["Indeed","https://co.indeed.com/jobs?q=bancolombia+analista"]]},
{n:"Rappi",r:"Unicornio colombiano · Tech · Bogotá",i:"Equipo de datos masivo. <strong>$4M-$8M COP. Remote-friendly.</strong>",m:72,c:"var(--or)",ro:"Data Analyst, Financial Analyst, BI Analyst",lk:[["Careers Rappi","https://boards.greenhouse.io/rappi"],["LinkedIn","https://www.linkedin.com/jobs/search/?keywords=Rappi+analyst&sortBy=DD"]]},
{n:"Mercado Libre",r:"E-commerce #1 LATAM · Colombia",i:"Data-driven. Tu portugués = ventaja Brasil. <strong>$5M-$10M COP o USD.</strong>",m:70,c:"var(--cy)",ro:"Data Analyst, Financial Analyst, BI Engineer",lk:[["Jobs MeLi","https://mercadolibre.eightfold.ai/careers?query=analyst&location=Colombia"],["LinkedIn","https://www.linkedin.com/jobs/search/?keywords=Mercado+Libre+analyst+Colombia&sortBy=DD"]]},
{n:"Accenture Colombia",r:"Consultoría global · 10K+ en CO",i:"Proyectos Fortune 500. <strong>$3.5M-$7M COP. Contratan masivamente analistas SQL + BI.</strong>",m:75,c:"var(--gn)",ro:"Data Analyst, Analytics Consultant, BI Developer",lk:[["Careers","https://www.accenture.com/co-es/careers/jobsearch?jk=analyst&sb=1"],["LinkedIn","https://www.linkedin.com/jobs/search/?keywords=Accenture+analyst+Colombia&sortBy=DD"]]},
{n:"NTT DATA",r:"Consultoría IT · Bogotá",i:"Proyectos BI para bancos y telcos. <strong>$3.5M-$6.5M COP.</strong> Tu exp financiera + SQL es ideal.",m:74,c:"var(--a2)",ro:"Analista de Datos, Consultor BI",lk:[["Careers","https://careers.nttdata.com/location/colombia-jobs/26089/27/2/3"],["LinkedIn","https://www.linkedin.com/jobs/search/?keywords=NTT+DATA+analyst+Colombia&sortBy=DD"]]},
{n:"Endava",r:"Tech UK/Colombia · Bogotá + Medellín",i:"Desarrollo + datos. <strong>$5M-$9M COP. Remoto.</strong>",m:68,c:"var(--cy)",ro:"Data Analyst, BI Developer",lk:[["Careers","https://www.endava.com/careers"],["LinkedIn","https://www.linkedin.com/jobs/search/?keywords=Endava+analyst+Colombia&sortBy=DD"]]},
{n:"Grupo Nutresa",r:"Alimentos #1 CO · Medellín/Bogotá",i:"Analytics en crecimiento. <strong>$3.5M-$6M COP.</strong> Estabilidad, beneficios excelentes.",m:70,c:"var(--gn)",ro:"Analista de Datos, Analista Financiero",lk:[["Talento Humano","https://www.gruponutresa.com/talento-humano/"],["LinkedIn","https://www.linkedin.com/jobs/search/?keywords=Nutresa+analista&sortBy=DD"]]},
{n:"Teleperformance (movilidad)",r:"Tu empresa actual · BPO global",i:"Ya estás adentro. Busca movilidad a datos/reporting/BI. <strong>Ventaja: conoces la cultura.</strong>",m:80,c:"var(--am)",ro:"Reporting Analyst, BI Analyst, Quality Analyst",lk:[["Careers TP","https://www.teleperformance.com/en-us/careers/"],["LinkedIn TP","https://www.linkedin.com/jobs/search/?keywords=Teleperformance+analyst+Bogota&sortBy=DD"]]},
{n:"Brinks (volver)",r:"Tu ex empresa · Seguridad · Bogotá",i:"Conoces todo. <strong>Negocia mejor salario con tu nuevo perfil.</strong> Contacta ex colegas.",m:88,c:"var(--gn)",ro:"Financial Analyst, Data Analyst, AP Senior",lk:[["Careers Brinks","https://careers.brinksinc.com/"],["LinkedIn","https://www.linkedin.com/jobs/search/?keywords=Brinks+analyst+Colombia&sortBy=DD"]]},
{n:"Sophos Solutions",r:"Fintech CO · Core bancario · Bogotá",i:"Tech para bancos. <strong>$4M-$7M COP.</strong> Tu contable + técnico = ideal.",m:76,c:"var(--a2)",ro:"Analista de Datos, Analista Funcional, BI",lk:[["Careers","https://sophossolutions.com/trabaja-con-nosotros/"],["LinkedIn","https://www.linkedin.com/jobs/search/?keywords=Sophos+Solutions+analyst&sortBy=DD"]]},
];

function renderCmp(){
const d=new Date().getDate();
const picks=[];for(let i=0;i<3;i++)picks.push(CMP[(d*3+i)%CMP.length]);
document.getElementById('cmpList').innerHTML=picks.map((c,i)=>{
const mc=c.m>=85?'var(--gn)':c.m>=70?'var(--am)':'var(--t2)';
return`<div class="cmp"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px"><div><div class="cmp-n" style="color:${c.c}">${i+1}. ${c.n}</div><div class="cmp-r">${c.r}</div></div><span style="font-family:monospace;font-size:14px;font-weight:700;color:${mc}">${c.m}%</span></div><div class="cmp-i">${c.i}<br><br><strong>Roles:</strong> ${c.ro}</div><div class="mbar"><div class="mfill" style="width:${c.m}%;background:${mc}"></div></div><div style="display:flex;gap:5px;margin-top:8px;flex-wrap:wrap">${c.lk.map(l=>`<a href="${l[1]}" target="_blank" rel="noopener" class="btn bo bs">🔗 ${l[0]}</a>`).join('')}</div></div>`;
}).join('')+'<div style="text-align:center;padding:10px;color:var(--t3);font-size:11px">🔄 Pool de '+CMP.length+' empresas. Rotan diariamente.</div>';
}

// ═══ TRACKER (manual) ═══
function getA(){try{return JSON.parse(localStorage.getItem('jt8')||'[]')}catch(e){return[]}}
function setA(a){localStorage.setItem('jt8',JSON.stringify(a))}
function addA(){const t=document.getElementById('aT').value.trim(),c=document.getElementById('aC').value.trim(),u=document.getElementById('aU').value.trim(),s=document.getElementById('aS').value;if(!t||!c)return;const a=getA();a.push({t,c,u,s,d:new Date().toLocaleDateString('es',{day:'numeric',month:'short'})});setA(a);document.getElementById('aT').value='';document.getElementById('aC').value='';document.getElementById('aU').value='';rK();uS();calculateMetrics()}

function uS(){
  const cards=getAllCards();
  document.getElementById('tA').textContent=cards.length;
  document.getElementById('sA').textContent=cards.filter(c=>c.status==='applied').length;
  document.getElementById('sI').textContent=cards.filter(c=>c.status==='interview').length;
  document.getElementById('sO').textContent=cards.filter(c=>c.status==='finalist').length;
}

// ═══ DASHBOARD ANALYTICS ═══
function calculateMetrics(){
  const cards=getAllCards();
  const total=cards.length;
  const saved=cards.filter(c=>c.status==='saved').length;
  const applied=cards.filter(c=>c.status==='applied').length;
  const interview=cards.filter(c=>c.status==='interview').length;
  const finalist=cards.filter(c=>c.status==='finalist').length;

  // Counters
  document.querySelector('#mSaved .meter-v').textContent=saved;
  document.querySelector('#mApplied .meter-v').textContent=applied;
  document.querySelector('#mInterview .meter-v').textContent=interview;
  document.querySelector('#mFinalist .meter-v').textContent=finalist;

  // Rates
  const rApply=total>0?Math.round((applied+interview+finalist)/total*100):0;
  const rInterview=(applied+interview+finalist)>0?Math.round((interview+finalist)/(applied+interview+finalist)*100):0;
  const rWin=total>0?Math.round(finalist/total*100):0;

  document.getElementById('rateApply').textContent=rApply+'%';
  document.getElementById('rateInterview').textContent=rInterview+'%';
  document.getElementById('rateWin').textContent=rWin+'%';

  // Color coding rates
  document.getElementById('rateApply').style.color=rApply>=50?'var(--gn)':rApply>=25?'var(--am)':'var(--cy)';
  document.getElementById('rateInterview').style.color=rInterview>=30?'var(--gn)':rInterview>=15?'var(--am)':'var(--rd)';
  document.getElementById('rateWin').style.color=rWin>=10?'var(--gn)':rWin>0?'var(--am)':'var(--t3)';

  document.getElementById('analyticsUpdate').textContent='Actualizado · '+new Date().toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit'});
}

// ═══ WIN-RATE OPTIMIZER: Quick Searches ═══
const QUICK_SEARCHES=[
  {label:'🏦 AP Remoto LATAM',tag:'tg',platform:'LinkedIn',
   url:'https://www.linkedin.com/jobs/search/?keywords=%22accounts+payable%22+OR+%22bookkeeper%22+OR+%22accounts+receivable%22+remote&location=Latin+America&f_WT=2&sortBy=DD'},
  {label:'📊 Data Entry + Excel',tag:'tc',platform:'LinkedIn',
   url:'https://www.linkedin.com/jobs/search/?keywords=%22data+entry%22+OR+%22virtual+assistant%22+%22excel%22+OR+%22spreadsheets%22+remote&f_WT=2&sortBy=DD'},
  {label:'💰 Bookkeeper Bilingüe',tag:'ty',platform:'LinkedIn',
   url:'https://www.linkedin.com/jobs/search/?keywords=bookkeeper+remote+bilingual+spanish&f_WT=2&f_TPR=r2592000&sortBy=DD'},
  {label:'🇧🇷 CxP Brasil (PT)',tag:'tg',platform:'LinkedIn',
   url:'https://www.linkedin.com/jobs/search/?keywords=contas+a+pagar+remoto+OR+%22accounts+payable%22&location=Brazil&f_WT=2&sortBy=DD'},
  {label:'⚡ AP + SQL + Excel',tag:'tg',platform:'LinkedIn',
   url:'https://www.linkedin.com/jobs/search/?keywords=%22accounts+payable%22+%22excel%22+%22SQL%22+remote&f_WT=2&sortBy=DD'},
  {label:'🔍 Indeed CxP CO',tag:'to',platform:'Indeed',
   url:'https://co.indeed.com/jobs?q=%22cuentas+por+pagar%22+remoto&fromage=7'},
  {label:'💻 Computrabajo CxP',tag:'to',platform:'Computrabajo',
   url:'https://www.computrabajo.com.co/trabajo-de-cuentas-por-pagar?q=remoto'},
  {label:'🗼 Torre AP Remoto',tag:'ta',platform:'Torre',
   url:'https://torre.ai/jobs?q=accounts+payable+remote&remote=true'},
  {label:'🌍 RemoteOK Analyst',tag:'ty',platform:'RemoteOK',
   url:'https://remoteok.com/remote-analyst-jobs'},
  {label:'📒 Upwork Bookkeeping',tag:'tg',platform:'Upwork',
   url:'https://www.upwork.com/nx/search/jobs/?q=bookkeeping+spanish+OR+%22accounts+payable%22&sort=recency'},
  {label:'🎯 Financial Analyst LATAM',tag:'tg',platform:'LinkedIn',
   url:'https://www.linkedin.com/jobs/search/?keywords=financial+data+analyst+remote&location=Latin+America&f_WT=2&sortBy=DD'},
  {label:'🌱 Jr Data Analyst',tag:'ta',platform:'LinkedIn',
   url:'https://www.linkedin.com/jobs/search/?keywords=junior+data+analyst+remote&location=Latin+America&f_WT=2&sortBy=DD'},
];

function renderQuickSearches(){
  const el=document.getElementById('quickSearchBtns');
  if(!el) return;
  el.innerHTML=QUICK_SEARCHES.map(s=>
    `<a href="${s.url}" target="_blank" rel="noopener" class="btn bo bs" style="font-size:10px;text-decoration:none;display:inline-flex;align-items:center;gap:3px" title="${s.platform}: ${s.label}">${s.label} <span style="font-size:8px;color:var(--t3)">${s.platform}</span></a>`
  ).join('');
}

// ═══ DAYS ═══
if(!localStorage.getItem('jt_s8'))localStorage.setItem('jt_s8',new Date().toISOString());
document.getElementById('sD').textContent=Math.max(1,Math.floor((new Date()-new Date(localStorage.getItem('jt_s8')))/864e5));

// INIT
renderCmp();rK();uS();calculateMetrics();renderQuickSearches();

// Hash navigation (from apply.html links)
function goTab(hash){
  const map={'#tracker':'tr','#estrategia':'str','#experiencia':'exp','#ruta':'data','#ingresos':'quick','#empresas':'co'};
  const p=map[hash];if(!p)return;
  document.querySelectorAll('.tab').forEach(b=>{b.classList.toggle('on',b.dataset.p===p);});
  document.querySelectorAll('.pnl').forEach(el=>{el.classList.toggle('on',el.id==='p-'+p);});
}
if(location.hash)goTab(location.hash);
window.addEventListener('hashchange',()=>goTab(location.hash));

// ── Cloud Sync: pull vacancies on sign-in ──
window.addEventListener('sb:signed_in',async()=>{
  if(!window.CLOUD)return;
  await CLOUD.fullSync('vacancies',VDB.KEY);
  renderCmp();rK();uS();calculateMetrics();
});
