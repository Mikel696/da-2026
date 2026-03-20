// ═══════════════════════════════════════════════════
// ACCOUNTING ASSOCIATE MODULE — Senior Edition
// 8 Years Experience (Brinks) · Financial Automation Specialist
// ═══════════════════════════════════════════════════

// ─── SENIOR ACCOUNTING PITCH SCRIPT (Expert Edition) ───
const eliteScript = [
  {en:"Good day. I am Miguel, a Senior Accounting Associate with over 8 years of specialized experience in financial reconciliation and cash logistics at Brinks.", es:"Buen día. Soy Miguel, Especialista Sénior en Contabilidad con más de 8 años de experiencia especializada en conciliación financiera y logística de efectivo en Brinks."},
  {en:"Throughout my tenure, I led a root-cause analysis project that successfully resolved 60% of historical discrepancies that had been pending for several quarters.", es:"Durante mi trayectoria, lideré un proyecto de análisis de causa raíz que resolvió con éxito el 60% de las discrepancias históricas que habían estado pendientes durante varios trimestres."},
  {en:"I am currently in my 8th semester of Systems Engineering, which I treat as a powerful technical tool to bridge the gap between ledger requirements and automation.", es:"Actualmente curso el 8vo semestre de Ingeniería de Sistemas, la cual trato como una poderosa herramienta técnica para cerrar la brecha entre los requerimientos contables y la automatización."},
  {en:"I specialize in implementing Power Query workflows and advanced Excel systematization to eliminate human error in complex tax liability processing.", es:"Me especializo en implementar flujos de trabajo de Power Query y sistematización avanzada en Excel para eliminar el error humano en el procesamiento de pasivos fiscales complejos."},
  {en:"This technical edge resulted in a 15% optimization of monthly payment cycles and improved accuracy in payroll tax reporting.", es:"Esta ventaja técnica resultó en una optimización del 15% en los ciclos de pago mensuales y mejoró la precisión en los reportes de impuestos de nómina."},
  {en:"My core toolkit includes Master Tax and V-ficcient, paired with a focus on data integrity that only a senior auditor can provide.", es:"Mi kit de herramientas principal incluye Master Tax y V-ficcient, sumado a un enfoque en la integridad de datos que solo un auditor sénior puede proporcionar."},
  {en:"I am ready to bring this 'Tech-Accounting' expertise to the BR Accounting team to ensure 100% compliance through robust automation.", es:"Estoy listo para aportar esta experiencia en 'Contabilidad Tecnológica' al equipo de BR Accounting para asegurar un cumplimiento del 100% mediante una automatización robusta."}
];

// ─── ADP / PAYROLL GLOSSARY ───
const acctGloss = {
  payrollCore:[
    {en:"Gross Pay",es:"Salario Bruto",ph:"/ɡroʊs peɪ/",ex:"Calculate <b>gross pay</b> before any deductions.",tp:"noun"},
    {en:"Net Pay",es:"Salario Neto",ph:"/net peɪ/",ex:"<b>Net pay</b> is what the employee actually receives.",tp:"noun"},
    {en:"Taxable Wages",es:"Salarios Gravables",ph:"/ˈtæk.sə.bəl/",ex:"<b>Taxable wages</b> determine the tax liability.",tp:"noun"},
    {en:"Pre-tax Deductions",es:"Deducciones Pre-impuesto",ph:"—",ex:"401k contributions are <b>pre-tax deductions</b>.",tp:"noun"},
    {en:"Post-tax Deductions",es:"Deducciones Post-impuesto",ph:"—",ex:"Roth IRA is a <b>post-tax deduction</b>.",tp:"noun"},
    {en:"Payroll Register",es:"Registro de Nómina",ph:"—",ex:"Review the <b>payroll register</b> for accuracy.",tp:"noun"},
    {en:"Direct Deposit",es:"Depósito Directo",ph:"—",ex:"Most employees use <b>direct deposit</b>.",tp:"noun"},
    {en:"ACH (Automated Clearing House)",es:"Cámara de Compensación Automatizada",ph:"/eɪ siː eɪtʃ/",ex:"Payments processed via <b>ACH</b> debit.",tp:"noun"},
    {en:"EFT (Electronic Funds Transfer)",es:"Transferencia Electrónica",ph:"—",ex:"Tax deposits made by <b>EFT</b>.",tp:"noun"},
    {en:"Garnishment",es:"Embargo Salarial",ph:"/ˈɡɑːr.nɪʃ.mənt/",ex:"Process the court-ordered <b>garnishment</b>.",tp:"noun"},
    {en:"W-2 Form",es:"Formulario W-2",ph:"—",ex:"Issue <b>W-2 forms</b> by January 31st.",tp:"noun"},
    {en:"Pay Period",es:"Período de Pago",ph:"—",ex:"Our <b>pay period</b> is bi-weekly.",tp:"noun"}
  ],
  taxSystems:[
    {en:"FICA (Federal Insurance Contributions Act)",es:"Ley Federal de Contribuciones al Seguro",ph:"/ˈfaɪ.kə/",ex:"<b>FICA</b> covers Social Security and Medicare.",tp:"noun"},
    {en:"FUTA (Federal Unemployment Tax Act)",es:"Impuesto Federal de Desempleo",ph:"/ˈfjuː.tə/",ex:"Employers pay <b>FUTA</b> tax quarterly.",tp:"noun"},
    {en:"SUI (State Unemployment Insurance)",es:"Seguro Estatal de Desempleo",ph:"—",ex:"<b>SUI</b> rates vary by state.",tp:"noun"},
    {en:"Form 941",es:"Formulario 941",ph:"—",ex:"File <b>Form 941</b> quarterly for federal taxes.",tp:"noun"},
    {en:"Tax Liability",es:"Obligación Tributaria",ph:"—",ex:"Calculate total <b>tax liability</b> for the period.",tp:"noun"},
    {en:"Tax Deposit",es:"Depósito de Impuestos",ph:"—",ex:"<b>Tax deposits</b> must be timely.",tp:"noun"},
    {en:"Withholding",es:"Retención",ph:"/wɪðˈhoʊl.dɪŋ/",ex:"Federal <b>withholding</b> based on W-4.",tp:"noun"},
    {en:"Jurisdiction",es:"Jurisdicción",ph:"/ˌdʒʊr.ɪsˈdɪk.ʃən/",ex:"File in each applicable <b>jurisdiction</b>.",tp:"noun"},
    {en:"Filing",es:"Presentación / Declaración",ph:"/ˈfaɪ.lɪŋ/",ex:"Quarterly tax <b>filing</b> is due.",tp:"noun"},
    {en:"Compliance",es:"Cumplimiento Normativo",ph:"/kəmˈplaɪ.əns/",ex:"Ensure payroll <b>compliance</b> at all times.",tp:"noun"}
  ],
  reconciliation:[
    {en:"Payroll Reconciliation",es:"Conciliación de Nómina",ph:"—",ex:"Perform <b>payroll reconciliation</b> each period.",tp:"noun"},
    {en:"Variance Analysis",es:"Análisis de Varianza",ph:"/ˈver.i.əns/",ex:"<b>Variance analysis</b> detected the error.",tp:"noun"},
    {en:"Discrepancy",es:"Discrepancia",ph:"/dɪˈskrep.ən.si/",ex:"Investigate every <b>discrepancy</b> found.",tp:"noun"},
    {en:"General Ledger (GL)",es:"Libro Mayor",ph:"—",ex:"Post entries to the <b>general ledger</b>.",tp:"noun"},
    {en:"Clearing Account",es:"Cuenta de Compensación",ph:"—",ex:"Use the <b>clearing account</b> to balance.",tp:"noun"},
    {en:"Bank Reconciliation",es:"Conciliación Bancaria",ph:"—",ex:"Monthly <b>bank reconciliation</b> is required.",tp:"noun"},
    {en:"Quarter-End Close",es:"Cierre Trimestral",ph:"—",ex:"Prepare for <b>quarter-end</b> close process.",tp:"noun"},
    {en:"Year-End Close",es:"Cierre Anual",ph:"—",ex:"<b>Year-end close</b> requires W-2 issuance.",tp:"noun"}
  ],
  adpSpecific:[
    {en:"Master Tax",es:"Sistema Master Tax de ADP",ph:"—",ex:"<b>Master Tax</b> automates tax filing.",tp:"noun"},
    {en:"RTS (Reconciliation Tax Summary)",es:"Resumen de Conciliación Fiscal",ph:"—",ex:"Generate the <b>RTS</b> file quarterly.",tp:"noun"},
    {en:"Tax Register",es:"Registro Fiscal",ph:"—",ex:"Review the <b>tax register</b> for accuracy.",tp:"noun"},
    {en:"FUTA Credit Adjustment",es:"Ajuste de Crédito FUTA",ph:"—",ex:"Apply <b>FUTA credit adjustment</b> entry.",tp:"noun"},
    {en:"Tax Locator",es:"Localizador de Impuestos",ph:"—",ex:"Use <b>tax locator</b> for local rates.",tp:"noun"},
    {en:"Agency Notice",es:"Notificación de Agencia",ph:"—",ex:"Respond to <b>agency notices</b> promptly.",tp:"noun"},
    {en:"E-filing",es:"Presentación Electrónica",ph:"—",ex:"All returns submitted via <b>e-filing</b>.",tp:"noun"},
    {en:"ADP Workforce Now",es:"ADP Workforce Now (HCM)",ph:"—",ex:"Manage payroll in <b>ADP Workforce Now</b>.",tp:"noun"}
  ]
};

// ─── EXCEL VOCABULARY ENGINE ───
const excelVocab = {
  formulas:[
    {en:"VLOOKUP",es:"Búsqueda Vertical",ph:"/viː lʊk ʌp/",ex:"Use <b>VLOOKUP</b> to find employee tax rates.",tp:"func"},
    {en:"XLOOKUP",es:"Búsqueda Extendida",ph:"/eks lʊk ʌp/",ex:"<b>XLOOKUP</b> replaces VLOOKUP with more flexibility.",tp:"func"},
    {en:"INDEX-MATCH",es:"Índice-Coincidir",ph:"—",ex:"<b>INDEX-MATCH</b> is more powerful than VLOOKUP.",tp:"func"},
    {en:"SUMIF / SUMIFS",es:"Suma Condicional",ph:"/sʌm ɪf/",ex:"<b>SUMIFS</b> totals taxes by jurisdiction.",tp:"func"},
    {en:"COUNTIF",es:"Contar Condicional",ph:"/kaʊnt ɪf/",ex:"<b>COUNTIF</b> counts discrepancies found.",tp:"func"},
    {en:"IF / IFS",es:"Condicional SI",ph:"/ɪf/",ex:"Use <b>IF</b> to flag variances above threshold.",tp:"func"},
    {en:"IFERROR",es:"Si Error",ph:"—",ex:"Wrap formulas in <b>IFERROR</b> for clean output.",tp:"func"},
    {en:"TEXT",es:"Texto (formateo)",ph:"—",ex:"<b>TEXT</b> function formats dates for reports.",tp:"func"}
  ],
  features:[
    {en:"Pivot Table",es:"Tabla Dinámica",ph:"/ˈpɪv.ət ˈteɪ.bəl/",ex:"Create a <b>Pivot Table</b> to summarize payroll by department.",tp:"tool"},
    {en:"Pivot Chart",es:"Gráfico Dinámico",ph:"—",ex:"Add a <b>Pivot Chart</b> for visual analysis.",tp:"tool"},
    {en:"Power Query",es:"Consulta de Datos",ph:"/ˈpaʊ.ər ˈkwɪr.i/",ex:"Use <b>Power Query</b> to clean payroll data.",tp:"tool"},
    {en:"Conditional Formatting",es:"Formato Condicional",ph:"—",ex:"<b>Conditional formatting</b> highlights variances in red.",tp:"tool"},
    {en:"Data Validation",es:"Validación de Datos",ph:"—",ex:"Set <b>data validation</b> for account codes.",tp:"tool"},
    {en:"Filter / Sort",es:"Filtrar / Ordenar",ph:"—",ex:"<b>Filter</b> by tax jurisdiction to check deposits.",tp:"tool"},
    {en:"Freeze Panes",es:"Inmovilizar Paneles",ph:"—",ex:"<b>Freeze panes</b> to keep headers visible.",tp:"tool"},
    {en:"Named Ranges",es:"Rangos con Nombre",ph:"—",ex:"Use <b>named ranges</b> for cleaner formulas.",tp:"tool"}
  ],
  accounting:[
    {en:"Variance Analysis",es:"Análisis de Varianza",ph:"/ˈver.i.əns əˈnæl.ə.sɪs/",ex:"Perform <b>variance analysis</b> on quarterly taxes.",tp:"concept"},
    {en:"Payroll Tax Liabilities",es:"Pasivos de Impuestos de Nómina",ph:"—",ex:"Track <b>payroll tax liabilities</b> monthly.",tp:"concept"},
    {en:"Accounts Payable",es:"Cuentas por Pagar",ph:"—",ex:"Record vendor invoices in <b>accounts payable</b>.",tp:"concept"},
    {en:"Accounts Receivable",es:"Cuentas por Cobrar",ph:"—",ex:"<b>Accounts receivable</b> aging report is due.",tp:"concept"},
    {en:"Trial Balance",es:"Balance de Comprobación",ph:"—",ex:"Run the <b>trial balance</b> before closing.",tp:"concept"},
    {en:"Journal Entry",es:"Asiento Contable",ph:"—",ex:"Post the adjusting <b>journal entry</b>.",tp:"concept"},
    {en:"Accrual",es:"Devengo / Acumulación",ph:"/əˈkruː.əl/",ex:"Record the payroll <b>accrual</b> at month-end.",tp:"concept"},
    {en:"Depreciation",es:"Depreciación",ph:"/dɪˌpriː.ʃiˈeɪ.ʃən/",ex:"Calculate <b>depreciation</b> for fixed assets.",tp:"concept"}
  ]
};

// ─── HELPERS ───
function acctCatIcon(c){return{payrollCore:'💰',taxSystems:'🏛️',reconciliation:'🔄',adpSpecific:'⚙️',formulas:'📐',features:'📊',accounting:'📒'}[c]||'📚'}
function acctCatName(c){return{payrollCore:'Payroll Core',taxSystems:'Tax Systems',reconciliation:'Reconciliation',adpSpecific:'ADP / Master Tax',formulas:'Excel Formulas',features:'Excel Features',accounting:'Accounting Concepts'}[c]||c}

// ─── RENDER FUNCTIONS ───
function renderAcctScript(){
  document.getElementById('acct-script').innerHTML =
    '<div class="sl" style="color:var(--em)">· senior accounting pitch ·</div>'+
    '<div class="sd">Presentación de alto impacto. 8 años de experiencia enfocados en precisión y automatización.</div>'+
    '<div class="tipbox" style="border-color:rgba(16,185,129,.15);background:linear-gradient(135deg,rgba(16,185,129,.04),rgba(5,150,105,.02))"><b style="color:var(--em)">🎯 Perfil Sénior Automatizador</b><p>Enfatiza el 60% de reducción de discrepancias. El inglés técnico es tu herramienta para el éxito.</p></div>'+
    eliteScript.map((s,i)=>{
      const sp=s.en.replace(/'/g,"\\'").replace(/"/g,'\\"');
      return '<div class="word" onclick="toggleEx(this)" style="border-left:3px solid '+(i===0?'var(--em)':i===eliteScript.length-1?'var(--em)':'transparent')+'">'+
        '<div class="word-num" style="color:var(--em)">'+(i+1).toString().padStart(2,'0')+'</div>'+
        '<button class="tts" onclick="event.stopPropagation();speak(\''+sp+'\',this)">🔊</button>'+
        '<div class="word-body">'+
          '<div class="word-en" style="font-size:13px;line-height:1.6;font-weight:500;cursor:auto">'+s.en+'</div>'+
          '<div class="word-ex" style="display:block;border-left-color:var(--em)">'+s.es+'</div>'+
        '</div></div>';
    }).join('')+
    '<div style="text-align:center;margin-top:16px">'+
      '<button class="btn bp" style="background:var(--em)" onclick="speakFullScript()">🎤 Reproducir Pitch Completo</button>'+
    '</div>';
}

function speakFullScript(){ speak(eliteScript.map(s=>s.en).join('. ')); }

function renderAcctGlossary(){
  const el=document.getElementById('acct-glossary');
  el.innerHTML='<div class="sl" style="color:var(--em)">· ADP / payroll glossary ·</div><div class="sd">38 términos del mundo contable/tax.</div><div class="cp" id="agC"></div><div id="agL"></div>';
  buildAcctPills('agC',Object.keys(acctGloss),true);
  renderAcctVocab(acctGloss,'agL');
  setupAcctFilter('agC','agL');
}

function renderAcctVocab(data,containerId){
  const el=document.getElementById(containerId);
  let html='';
  Object.keys(data).forEach(cat=>{
    const words=data[cat];
    html+='<div class="card vcat" data-cat="'+cat+'" style="border-color:rgba(16,185,129,.15)"><div class="card-h"><div class="card-t">'+acctCatIcon(cat)+' '+acctCatName(cat)+'</div><span class="pl" style="background:rgba(16,185,129,.08);color:var(--em);border:1px solid rgba(16,185,129,.15)">'+words.length+'</span></div>';
    words.forEach((w,i)=>{
      const sp=w.en.replace(/\s*\/\s*/g,' or ').replace(/\.\.\./g,'').replace(/\(.*?\)/g,'').replace(/'/g,"\\'");
      html+='<div class="word" onclick="toggleEx(this)">'+
        '<div class="word-num">'+(i+1).toString().padStart(2,'0')+'</div>'+
        '<button class="tts" onclick="event.stopPropagation();speak(\''+sp+'\',this)">🔊</button>'+
        '<div class="word-body">'+
          '<div><span class="word-en" data-tip="'+w.es.replace(/"/g,'&quot;')+'">'+w.en+'</span> <span class="word-tp">'+w.tp+'</span></div>'+
          (w.ph&&w.ph!=='—'?'<div class="word-ph">'+w.ph+'</div>':'')+'<div class="word-es">'+w.es+'</div>'+
          '<div class="word-ex">'+w.ex+'</div></div></div>';
    });
    html+='</div>';
  });
  el.innerHTML=html;
}

function renderExcelVocab(){
  document.getElementById('acct-excel').innerHTML='<div class="sl" style="color:var(--em)">· excel vocabulary engine ·</div><div class="sd">Fórmulas y herramientas para finanzas.</div><div class="cp" id="exvC"></div><div id="exvL"></div>';
  buildAcctPills('exvC',Object.keys(excelVocab),true);
  renderAcctVocab(excelVocab,'exvL');
  setupAcctFilter('exvC','exvL');
}

function buildAcctPills(id,keys,hasAll){
  const el = document.getElementById(id);
  if(!el) return;
  el.innerHTML=(hasAll?'<span class="cpi on" data-c="all">Todas</span>':'')+
    keys.map(c=>'<span class="cpi" data-c="'+c+'">'+acctCatIcon(c)+' '+acctCatName(c)+'</span>').join('');
}

function setupAcctFilter(pillsId,listId){
  const el = document.getElementById(pillsId);
  if(!el) return;
  el.addEventListener('click',e=>{
    const pill=e.target.closest('.cpi');if(!pill)return;
    document.querySelectorAll('#'+pillsId+' .cpi').forEach(x=>x.classList.remove('on'));
    pill.classList.add('on');
    const c=pill.dataset.c;
    document.querySelectorAll('#'+listId+' .vcat').forEach(cd=>{cd.style.display=(c==='all'||cd.dataset.cat===c)?'':'none';});
  });
}

function renderResources(){
  const resources=[
    {icon:'🎯',title:'Interactive Excel Practice',desc:'VLOOKUP & Pivot Tables',url:'https://excelexercises.com/',tag:'PRACTICE',color:'var(--em)'},
    {icon:'📹',title:'Accounting Test Walkthrough',desc:'Hiring test solved',url:'https://www.youtube.com/watch?v=vBcbuqpAI7M',tag:'VIDEO',color:'var(--am)'},
    {icon:'🎓',title:'Excel for Finance',desc:'Masterclass course',url:'https://www.youtube.com/watch?v=hkybRW7Z3Yk',tag:'COURSE',color:'var(--cy)'},
    {icon:'📝',title:'Accounting Knowledge',desc:'TestDome simulators',url:'https://www.testdome.com/tests/accounting-online-test/73',tag:'TEST',color:'var(--rd)'}
  ];
  document.getElementById('acct-resources').innerHTML='<div class="sl" style="color:var(--em)">· technical exercise hub ·</div><div class="sd">Domina Excel para Brinks.</div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px">'+
    resources.map(r=>'<a href="'+r.url+'" target="_blank" class="res-card" style="--rc:'+r.color+'"><div style="font-size:32px;margin-bottom:8px">'+r.icon+'</div><span class="pl" style="background:color-mix(in srgb,'+r.color+' 10%,transparent);color:'+r.color+';border:1px solid color-mix(in srgb,'+r.color+' 20%,transparent);margin-bottom:6px;display:inline-block">'+r.tag+'</span><div style="font-size:14px;font-weight:600">'+r.title+'</div><div style="font-size:11px;color:var(--t2)">'+r.desc+'</div></a>').join('')+'</div>';
}

// ─── RECRUITMENT SIMULATOR ───
const chatDB = [
  {q:"Tell me about yourself as an accounting professional.", category:"intro",
   model:"I am a Senior Accounting Associate with over 8 years of specialized experience at Brinks. My focus is on financial accuracy and discrepancy resolution. I currently use my 8th-semester Systems Engineering knowledge as a tool to automate reconciliation workflows, resulting in a 60% reduction in historic variances.",
   keywords:["senior","8 years","brinks","accountant","accuracy"],
   tips:["Emphasize the 8-year tenure","Mention the 60% resolution achievement"]},
  {q:"How do you use technology to improve accounting processes?", category:"star",
   model:"I treat systems engineering as a technical lever. At Brinks, I implemented Power Query and advanced Excel automation to consolidate ledger data, which optimized payment cycles by 15% and ensured 100% accuracy in payroll tax liabilities.",
   keywords:["power query","automation","15%","accuracy","systems logic"],
   tips:["Focus on the 15% optimization","Treat tech as a tool for accuracy"]},
  {q:"How do you handle payroll tax reconciliation?", category:"technical",
   model:"I conduct root-cause analysis by cross-referencing Master Tax data with Form 941 filings. My 8 years of experience allows me to spot anomalies that purely automated systems might miss, ensuring total compliance through a hybrid approach.",
   keywords:["root cause","master tax","941","compliance","anomalies"],
   tips:["Highlight the 'Senior Eye' for anomalies","Mention specific compliance forms"]}
];

let chatState={qIdx:0,msgs:[]};
function renderSimulator(){
  const el = document.getElementById('acct-simulator');
  if(!el) return;
  el.innerHTML='<div class="sl" style="color:var(--em)">· recruitment simulator ·</div><div class="sd">Entrevista con Jose Angel Rojas. Responde como Senior.</div><div id="chatBox" style="max-height:450px;overflow-y:auto;margin-bottom:12px;padding:10px;background:hsla(240,10%,8%,0.4);border-radius:10px"></div><div style="display:flex;gap:8px"><input class="ein" id="chatInput" placeholder="Responder en inglés..." onkeydown="if(event.key===\'Enter\')sendChat()"><button class="btn bp" style="background:var(--em)" onclick="sendChat()">Send</button></div><div style="display:flex;gap:6px;margin-top:8px"><button class="btn bo bs" onclick="showModelAnswer()">💡 Model Answer</button><button class="btn bo bs" onclick="nextQuestion()">⏭️ Next</button><button class="btn bo bs" onclick="resetChat()">🔄 Reset</button></div>';
  chatState={qIdx:0,msgs:[]}; addRecruiterMsg();
}

function addRecruiterMsg(){ 
  const q=chatDB[chatState.qIdx]; 
  chatState.msgs.push({who:'recruiter',text:q.q,cat:q.category}); 
  renderChatMsgs(); 
}
function renderChatMsgs(){
  const box=document.getElementById('chatBox');
  if(!box) return;
  box.innerHTML=chatState.msgs.map(m=>{
    if(m.who==='recruiter') return '<div class="msg"><div class="msg-av a">👔</div><div class="msg-body"><div class="msg-name a">Jose Rojas — Recruiter</div><span class="msg-text a">'+m.text+' <button class="tts" onclick="event.stopPropagation();speak(\''+m.text.replace(/'/g,"\\'")+'\',this)" style="width:16px;height:16px;font-size:7px">🔊</button></span></div></div>';
    if(m.who==='you') return '<div class="msg"><div class="msg-av b">🎤</div><div class="msg-body"><div class="msg-name b">You (Senior Specialist)</div><span class="msg-text b">'+m.text+'</span><div style="font-size:9px;color:var(--gn);margin-top:2px">Keywords: '+m.score+'/'+m.total+'</div></div></div>';
    if(m.who==='model') return '<div class="msg"><div class="msg-av">💡</div><div class="msg-body"><div class="msg-name" style="color:var(--em)">Senior Answer</div><span class="msg-text" style="background:rgba(16,185,129,.05)">'+m.text+'</span></div></div>';
    return '';
  }).join(''); box.scrollTop=box.scrollHeight;
}
function sendChat(){
  const input=document.getElementById('chatInput'); if(!input.value.trim())return;
  const q=chatDB[chatState.qIdx]; let matched=0; const lower=input.value.toLowerCase();
  q.keywords.forEach(k=>{if(lower.includes(k.toLowerCase()))matched++});
  chatState.msgs.push({who:'you',text:input.value,score:matched,total:q.keywords.length});
  input.value=''; renderChatMsgs();
}
function showModelAnswer(){ chatState.msgs.push({who:'model',text:chatDB[chatState.qIdx].model}); renderChatMsgs(); }
function nextQuestion(){ chatState.qIdx=(chatState.qIdx+1)%chatDB.length; addRecruiterMsg(); }
function resetChat(){ chatState={qIdx:0,msgs:[]}; addRecruiterMsg(); }

// ─── INTERVIEW PANELS ───
const acctIvDB = {
  behavioral:[
    {q:"Tell me about your 8 years at Brinks.",m:"I managed high-stakes financial operations. Beyond basic accounting, I identified that 60% of reconciliation discrepancies could be solved by automating database cross-checks. I am an expert in creating those systems.",t:["Focus on the 8 years","Mention the 60% result"],k:["8 years","Brinks","reconciliation","60%","automating"]},
    {q:"How do you handle complex tax reconciliations?",m:"I use a systematic approach with Power Query to clean historical data, then I apply variance analysis formulas to catch errors. I ensure 100% compliance with Form 941 and local tax liabilities.",t:["Show technical systems knowledge"],k:["systematic","power query","variance","941","compliance"]}
  ]
};

function renderAcctInterview(c){
  const d=acctIvDB[c]||acctIvDB.behavioral;
  const el = document.getElementById('acctIvL');
  if(!el) return;
  el.innerHTML=d.map((x,i)=>'<div class="card" style="border-color:rgba(16,185,129,.15)"><div class="ivr iw" style="color:var(--em)">👔 QUESTION</div><div style="font-size:15px;font-weight:600;margin-bottom:8px">"'+x.q+'"</div><div class="ivs" style="border-left:3px solid var(--em)"><div class="ivr you" style="color:var(--em)">🎤 SENIOR RESPONSE</div><div style="font-size:12px">'+x.m+'</div></div><div style="margin-top:6px">'+x.k.map(k=>'<span class="pl" style="background:rgba(16,185,129,.05);color:var(--em);margin-right:4px">'+k+'</span>').join('')+'</div></div>').join('');
}

function renderAcctInterviewPanel(){
  const el = document.getElementById('acct-interview');
  if(!el) return;
  el.innerHTML='<div class="sl" style="color:var(--em)">· senior interview prep ·</div><div class="cp" id="acctIvC"></div><div id="acctIvL"></div>';
  const items=[{c:'behavioral',label:'🎭 Behavioral & Seniority'},{c:'technical',label:'🔧 Tech & Tax Compliance'}];
  document.getElementById('acctIvC').innerHTML=items.map((x,i)=>'<span class="cpi '+(i===0?'on':'')+'" data-c="'+x.c+'">'+x.label+'</span>').join('');
  document.getElementById('acctIvC').addEventListener('click',e=>{
    const pill=e.target.closest('.cpi');if(!pill)return;
    document.querySelectorAll('#acctIvC .cpi').forEach(x=>x.classList.remove('on'));
    pill.classList.add('on'); renderAcctInterview(pill.dataset.c);
  });
  renderAcctInterview('behavioral');
}

// ─── MODE SWITCHING ───
function switchMode(mode){
  document.querySelectorAll('.mode-btn').forEach(b=>b.classList.remove('on'));
  const targetBtn = document.querySelector('.mode-btn[data-mode="'+mode+'"]');
  if(targetBtn) targetBtn.classList.add('on');
  
  document.getElementById('ds-section').style.display=mode==='ds'?'block':'none';
  document.getElementById('acct-section').style.display=mode==='acct'?'block':'none';
  
  if(mode === 'acct') {
    document.body.classList.add('mode-acct');
    if(!window._acctInit){
      window._acctInit=true; 
      renderAcctScript(); 
      renderAcctGlossary(); 
      renderExcelVocab(); 
      renderResources(); 
      renderSimulator(); 
      renderAcctInterviewPanel();
    }
  } else {
    document.body.classList.remove('mode-acct');
  }
}

function initAcctTabs(){
  document.querySelectorAll('.acct-tab').forEach(t=>t.addEventListener('click',()=>{
    document.querySelectorAll('.acct-tab').forEach(x=>x.classList.remove('on'));
    document.querySelectorAll('.acct-pnl').forEach(x=>x.classList.remove('on'));
    t.classList.add('on'); 
    const pnl = document.getElementById('ap-'+t.dataset.p);
    if(pnl) pnl.classList.add('on');
  }));
}
