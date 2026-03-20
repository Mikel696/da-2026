// ═══════════════════════════════════════════════════
// ACCOUNTING ASSOCIATE MODULE — Priority One
// BR Interview Prep · ADP Master Tax · Excel English
// ═══════════════════════════════════════════════════

// ─── ELITE HYBRID SCRIPT ───
const eliteScript = [
  {en:"Hi, I'm Miguel — a Senior Accounting Specialist who discovered that the real power of technology is making numbers tell the truth.",es:"Soy Miguel — un Especialista Contable Senior que descubrió que el verdadero poder de la tecnología es hacer que los números digan la verdad."},
  {en:"In my current role at Brinks, I reconcile accounts and resolve discrepancies — I've reduced unresolved discrepancies by 60% by building automated reconciliation workflows.",es:"En mi rol actual en Brinks, concilio cuentas y resuelvo discrepancias — reduje las discrepancias sin resolver en un 60% construyendo flujos de conciliación automatizados."},
  {en:"But what sets me apart is HOW I do it: I don't just run numbers through Excel — I architect solutions.",es:"Lo que me diferencia es CÓMO lo hago: no solo paso números por Excel — diseño soluciones."},
  {en:"When I see a payroll tax variance, I don't just flag it — I trace it to its root cause using VLOOKUP cross-references, Pivot Table analysis, and variance formulas that catch errors before they become compliance issues.",es:"Cuando veo una variación en impuestos de nómina, no solo la marco — la rastreo hasta su causa raíz usando referencias cruzadas VLOOKUP, análisis de Tablas Dinámicas y fórmulas de varianza."},
  {en:"My background in tech-driven accounting means I understand data pipelines, database logic, and automation at a level most accounting professionals don't.",es:"Mi formación en contabilidad tecnológica significa que entiendo pipelines de datos, lógica de bases de datos y automatización a un nivel que la mayoría de contadores no."},
  {en:"For this Accounting Associate role, I bring: Proven accuracy — 60% reduction in discrepancies at Brinks.",es:"Para este rol de Asociado Contable traigo: Precisión demostrada — 60% de reducción en discrepancias en Brinks."},
  {en:"Technical edge: Advanced Excel including XLOOKUP, Pivot Tables, and Power Query, plus Python automation.",es:"Ventaja técnica: Excel avanzado incluyendo XLOOKUP, Tablas Dinámicas y Power Query, más automatización con Python."},
  {en:"Process mindset: I document, optimize, and automate every reconciliation workflow I touch.",es:"Mentalidad de procesos: documento, optimizo y automatizo cada flujo de conciliación que toco."},
  {en:"Integrity first: In cash logistics at Brinks, every cent must be accounted for — I've built my career on that standard.",es:"Integridad primero: en logística de efectivo en Brinks, cada centavo debe estar contabilizado — he construido mi carrera en ese estándar."},
  {en:"I'm not just an accountant who can use a spreadsheet — I'm a specialist who thinks in systems and delivers in precision. I'm ready to bring that to your payroll tax reconciliation team.",es:"No soy solo un contador que usa hojas de cálculo — soy un especialista que piensa en sistemas y entrega con precisión. Estoy listo para llevar eso a su equipo de conciliación de impuestos."}
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

// ─── GLOSSARY CATEGORY HELPERS ───
function acctCatIcon(c){return{payrollCore:'💰',taxSystems:'🏛️',reconciliation:'🔄',adpSpecific:'⚙️',formulas:'📐',features:'📊',accounting:'📒'}[c]||'📚'}
function acctCatName(c){return{payrollCore:'Payroll Core',taxSystems:'Tax Systems',reconciliation:'Reconciliation',adpSpecific:'ADP / Master Tax',formulas:'Excel Formulas',features:'Excel Features',accounting:'Accounting Concepts'}[c]||c}

// ─── RENDER FUNCTIONS ───
function renderAcctScript(){
  document.getElementById('acct-script').innerHTML =
    '<div class="sl" style="color:var(--em)">· elite hybrid script ·</div>'+
    '<div class="sd">Tu presentación de 2 minutos como "Contador Tecnológico". Practica cada oración con 🔊.</div>'+
    '<div class="tipbox" style="border-color:rgba(16,185,129,.15);background:linear-gradient(135deg,rgba(16,185,129,.04),rgba(5,150,105,.02))"><b style="color:var(--em)">🎯 Método: Lee → Escucha → Repite 3x</b><p>Graba tu voz y compara. La entrevista es MAÑANA.</p></div>'+
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
      '<button class="btn bp" style="background:var(--em)" onclick="speakFullScript()">🎤 Reproducir Script Completo</button>'+
    '</div>';
}

function speakFullScript(){
  const full = eliteScript.map(s=>s.en).join('. ');
  speak(full);
}

function renderAcctGlossary(){
  const el=document.getElementById('acct-glossary');
  let html='<div class="sl" style="color:var(--em)">· ADP / payroll glossary ·</div>'+
    '<div class="sd">38 términos esenciales del mundo de nómina e impuestos. Aprende a decirlos en inglés.</div>'+
    '<div class="cp" id="agC"></div><div id="agL"></div>';
  el.innerHTML=html;
  buildAcctPills('agC',Object.keys(acctGloss),true,'acct');
  renderAcctVocab(acctGloss,'agL','acct');
  setupAcctFilter('agC','agL','acct');
}

function renderAcctVocab(data,containerId,prefix){
  const el=document.getElementById(containerId);
  let html='';
  Object.keys(data).forEach(cat=>{
    const words=data[cat];
    html+='<div class="card vcat" data-cat="'+cat+'" style="border-color:rgba(16,185,129,.15)"><div class="card-h"><div class="card-t">'+acctCatIcon(cat)+' '+acctCatName(cat)+'</div><span class="pl" style="background:rgba(16,185,129,.08);color:var(--em);border:1px solid rgba(16,185,129,.15)">'+words.length+'</span></div>';
    for(let i=0;i<words.length;i++){
      const w=words[i];
      const sp=w.en.replace(/\s*\/\s*/g,' or ').replace(/\.\.\./g,'').replace(/\(.*?\)/g,'').replace(/'/g,"\\'");
      html+='<div class="word" onclick="toggleEx(this)">'+
        '<div class="word-num">'+(i+1).toString().padStart(2,'0')+'</div>'+
        '<button class="tts" onclick="event.stopPropagation();speak(\''+sp+'\',this)">🔊</button>'+
        '<div class="word-body">'+
          '<div><span class="word-en" data-tip="'+w.es.replace(/"/g,'&quot;')+'">'+w.en+'</span> <span class="word-tp">'+w.tp+'</span></div>'+
          (w.ph&&w.ph!=='—'?'<div class="word-ph">'+w.ph+'</div>':'')+
          '<div class="word-es">'+w.es+'</div>'+
          '<div class="word-ex">'+w.ex+'</div>'+
        '</div></div>';
    }
    html+='</div>';
  });
  el.innerHTML=html;
}

function renderExcelVocab(){
  const el=document.getElementById('acct-excel');
  let html='<div class="sl" style="color:var(--em)">· excel vocabulary engine ·</div>'+
    '<div class="sd">Domina la pronunciación de herramientas Excel en inglés. Esencial para la entrevista técnica.</div>'+
    '<div class="cp" id="exvC"></div><div id="exvL"></div>';
  el.innerHTML=html;
  buildAcctPills('exvC',Object.keys(excelVocab),true,'excel');
  renderAcctVocab(excelVocab,'exvL','excel');
  setupAcctFilter('exvC','exvL','excel');
}

function buildAcctPills(id,keys,hasAll,prefix){
  document.getElementById(id).innerHTML=(hasAll?'<span class="cpi on" data-c="all">Todas</span>':'')+
    keys.map(c=>'<span class="cpi" data-c="'+c+'">'+acctCatIcon(c)+' '+acctCatName(c)+'</span>').join('');
}

function setupAcctFilter(pillsId,listId,prefix){
  document.getElementById(pillsId).addEventListener('click',e=>{
    const pill=e.target.closest('.cpi');if(!pill)return;
    document.querySelectorAll('#'+pillsId+' .cpi').forEach(x=>x.classList.remove('on'));
    pill.classList.add('on');
    const c=pill.dataset.c;
    document.querySelectorAll('#'+listId+' .vcat').forEach(cd=>{
      cd.style.display=(c==='all'||cd.dataset.cat===c)?'':'none';
    });
  });
}

// ─── TECHNICAL EXERCISE HUB ───
function renderResources(){
  const resources=[
    {icon:'🎯',title:'Interactive Excel Practice',desc:'Master VLOOKUP and Pivot Tables with hands-on exercises',url:'https://excelexercises.com/',tag:'PRACTICE',color:'var(--em)'},
    {icon:'📹',title:'Accounting Test Walkthrough',desc:'Real accounting assistant hiring test — solved step by step',url:'https://www.youtube.com/watch?v=vBcbuqpAI7M',tag:'VIDEO',color:'var(--am)'},
    {icon:'🎓',title:'Excel for Finance Masterclass',desc:'3-hour complete course: Excel for accounting and finance professionals',url:'https://www.youtube.com/watch?v=hkybRW7Z3Yk',tag:'COURSE',color:'var(--cy)'},
    {icon:'📝',title:'Accounting Knowledge Tests',desc:'TestDome accounting simulators — practice real interview tests',url:'https://www.testdome.com/tests/accounting-online-test/73',tag:'TEST',color:'var(--rd)'}
  ];
  document.getElementById('acct-resources').innerHTML=
    '<div class="sl" style="color:var(--em)">· technical exercise hub ·</div>'+
    '<div class="sd">Recursos directos para dominar Excel y contabilidad antes de la entrevista.</div>'+
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px">'+
    resources.map(r=>
      '<a href="'+r.url+'" target="_blank" rel="noopener" class="res-card" style="--rc:'+r.color+'">'+
        '<div style="font-size:32px;margin-bottom:8px">'+r.icon+'</div>'+
        '<span class="pl" style="background:color-mix(in srgb,'+r.color+' 10%,transparent);color:'+r.color+';border:1px solid color-mix(in srgb,'+r.color+' 20%,transparent);margin-bottom:6px;display:inline-block">'+r.tag+'</span>'+
        '<div style="font-size:14px;font-weight:600;margin-bottom:4px">'+r.title+'</div>'+
        '<div style="font-size:11px;color:var(--t2)">'+r.desc+'</div>'+
      '</a>'
    ).join('')+'</div>';
}

// ─── RECRUITMENT SIMULATOR (Jose Angel Rojas) ───
const chatDB = [
  {q:"Tell me about yourself and why you're interested in this Accounting Associate position.",
   category:"intro",
   model:"I'm Miguel, a Senior Accounting Specialist with deep technical and systems experience at Brinks. I reconcile accounts daily and have reduced unresolved discrepancies by 60% through automated workflows. I'm excited about this role because it combines my passion for precision with my technical ability to optimize processes. I see this as an opportunity to bring systems-level efficiency to your accounting operations.",
   keywords:["systems experience","brinks","discrepancies","60%","automated","reconcile"],
   tips:["Start with your unique value proposition","Connect systems thinking + accounting","Mention the 60% achievement"]},
  {q:"Describe a time you found and resolved a significant discrepancy.",
   category:"star",
   model:"Situation: At Brinks, I discovered a recurring variance in our monthly cash reconciliation reports. Task: I needed to identify the root cause and eliminate the discrepancy. Action: I built an automated cross-reference system using VLOOKUP and Pivot Tables that compared transaction records across three different databases. Result: I identified a systematic data entry error that had been causing a 15% variance. After implementing the fix, unresolved discrepancies dropped by 60%.",
   keywords:["situation","task","action","result","VLOOKUP","pivot","variance","60%","root cause"],
   tips:["Always use STAR format","Include specific numbers","Show the systematic approach"]},
  {q:"How do you ensure accuracy in your accounting work?",
   category:"integrity",
   model:"I follow a three-layer verification approach. First, I use automated validation rules in Excel to catch data entry errors immediately. Second, I perform periodic reconciliation checks throughout the process, not just at the end. Third, I document every adjustment with a clear audit trail. At Brinks, where every cent in cash logistics must be accounted for, this approach became second nature.",
   keywords:["verification","validation","reconciliation","audit trail","accuracy","documented"],
   tips:["Show your systematic process","Mention audit trails","Reference Brinks cash accuracy standards"]},
  {q:"What would you do if you discovered a colleague was not following proper accounting procedures?",
   category:"ethics",
   model:"I would first verify my understanding of the correct procedure to make sure I'm not mistaken. Then I would have a private, respectful conversation with the colleague, as it might be a training gap. If the issue persisted or involved potential fraud, I would escalate it to my supervisor immediately. Integrity is non-negotiable in accounting — protecting the company and our team is everyone's responsibility.",
   keywords:["verify","private","respectful","escalate","integrity","non-negotiable","fraud"],
   tips:["Show diplomatic approach","Demonstrate integrity","Mention escalation path"]},
  {q:"How do you handle tight deadlines, especially during quarter-end or year-end close?",
   category:"behavioral",
   model:"I prioritize by impact and deadline. During close periods, I create a detailed checklist with milestones and work backwards from the filing deadline. I communicate proactively with the team about dependencies. At Brinks, I managed multiple daily reconciliation deadlines simultaneously by automating repetitive tasks, which freed up time for analysis and review.",
   keywords:["prioritize","checklist","deadline","communicate","automate","proactively"],
   tips:["Show planning ability","Mention automation","Demonstrate team communication"]},
  {q:"What Excel functions do you use most in accounting work?",
   category:"technical",
   model:"My core toolkit includes VLOOKUP and XLOOKUP for cross-referencing data between payroll registers and tax reports. I use SUMIFS extensively for conditional totaling by jurisdiction or department. Pivot Tables are essential for summarizing large datasets quickly. I also use conditional formatting to visually flag variances and IFERROR to create clean, error-free reports.",
   keywords:["VLOOKUP","XLOOKUP","SUMIFS","pivot","conditional formatting","IFERROR","jurisdiction"],
   tips:["List specific functions","Connect to accounting context","Show advanced knowledge"]},
  {q:"What do you know about payroll tax reconciliation?",
   category:"technical",
   model:"Payroll tax reconciliation is the process of comparing payroll records against source data to ensure accurate employee compensation and tax compliance. It involves verifying gross pay calculations, confirming pre-tax and post-tax deductions, matching tax deposits with liabilities, and reconciling the payroll register with Form 941 filings. It should be done each pay period, quarterly before filing, and annually before W-2 issuance.",
   keywords:["comparing","payroll records","source data","compliance","deductions","Form 941","W-2","quarterly","deposits","liabilities"],
   tips:["Show deep process knowledge","Mention specific forms","Demonstrate compliance awareness"]}
];

let chatState={qIdx:0,msgs:[]};

function renderSimulator(){
  document.getElementById('acct-simulator').innerHTML=
    '<div class="sl" style="color:var(--em)">· recruitment simulator ·</div>'+
    '<div class="sd">Simula la entrevista con Jose Angel Rojas (BR Recruiter). Responde usando el Método STAR en inglés.</div>'+
    '<div class="tipbox" style="border-color:rgba(16,185,129,.15);background:linear-gradient(135deg,rgba(16,185,129,.04),rgba(5,150,105,.02))"><b style="color:var(--em)">💡 Método STAR</b><p><strong>S</strong>ituation → <strong>T</strong>ask → <strong>A</strong>ction → <strong>R</strong>esult. Siempre con números concretos.</p></div>'+
    '<div id="chatBox" style="max-height:500px;overflow-y:auto;margin-bottom:12px"></div>'+
    '<div style="display:flex;gap:8px">'+
      '<input class="ein" id="chatInput" placeholder="Type your answer in English..." onkeydown="if(event.key===\'Enter\')sendChat()">'+
      '<button class="btn bp" style="background:var(--em)" onclick="sendChat()">Send</button>'+
    '</div>'+
    '<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">'+
      '<button class="btn bo bs" onclick="showModelAnswer()">💡 Model Answer</button>'+
      '<button class="btn bo bs" onclick="nextQuestion()">⏭️ Next Question</button>'+
      '<button class="btn bo bs" onclick="resetChat()">🔄 Reset</button>'+
    '</div>';
  chatState={qIdx:0,msgs:[]};
  addRecruiterMsg();
}

function addRecruiterMsg(){
  const q=chatDB[chatState.qIdx];
  chatState.msgs.push({who:'recruiter',text:q.q,cat:q.category});
  renderChatMsgs();
}

function renderChatMsgs(){
  const box=document.getElementById('chatBox');
  box.innerHTML=chatState.msgs.map(m=>{
    if(m.who==='recruiter'){
      return '<div class="msg"><div class="msg-av a">👔</div><div class="msg-body"><div class="msg-name a">Jose Angel Rojas — Recruiter</div><span class="msg-text a">'+m.text+' <button class="tts" onclick="event.stopPropagation();speak(\''+m.text.replace(/'/g,"\\'")+'\',this)" style="width:18px;height:18px;font-size:8px">🔊</button></span>'+(m.cat?'<div style="margin-top:2px"><span class="pl" style="background:rgba(16,185,129,.08);color:var(--em);border:1px solid rgba(16,185,129,.15);font-size:8px">'+m.cat.toUpperCase()+'</span></div>':'')+'</div></div>';
    }
    if(m.who==='you'){
      return '<div class="msg"><div class="msg-av b">🎤</div><div class="msg-body"><div class="msg-name b">You (Miguel)</div><span class="msg-text b">'+m.text+'</span>'+(m.score!==undefined?'<div style="margin-top:4px;font-size:10px;color:'+(m.score>=3?'var(--gn)':m.score>=1?'var(--am)':'var(--rd)')+'">Keywords matched: '+m.score+'/'+m.total+' '+(m.score>=3?'✅ Great!':m.score>=1?'🤔 Add more detail':'❌ Review model answer')+'</div>':'')+'</div></div>';
    }
    if(m.who==='model'){
      return '<div class="msg"><div class="msg-av" style="background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.15)">💡</div><div class="msg-body"><div class="msg-name" style="color:var(--em)">Model Answer</div><span class="msg-text" style="background:rgba(16,185,129,.04);border:1px solid rgba(16,185,129,.1)">'+m.text+' <button class="tts" onclick="event.stopPropagation();speak(\''+m.text.replace(/'/g,"\\'")+'\',this)" style="width:18px;height:18px;font-size:8px">🔊</button></span>'+
        (m.tips?'<div style="margin-top:4px">'+m.tips.map(t=>'<span style="display:inline-block;padding:2px 6px;background:rgba(234,179,8,.06);border:1px solid rgba(234,179,8,.1);border-radius:8px;font-size:9px;color:var(--am);margin:1px 2px">💡 '+t+'</span>').join('')+'</div>':'')+'</div></div>';
    }
    return '';
  }).join('');
  box.scrollTop=box.scrollHeight;
}

function sendChat(){
  const input=document.getElementById('chatInput');
  const text=input.value.trim();
  if(!text)return;
  const q=chatDB[chatState.qIdx];
  const lower=text.toLowerCase();
  let matched=0;
  q.keywords.forEach(k=>{if(lower.includes(k.toLowerCase()))matched++});
  chatState.msgs.push({who:'you',text:text,score:matched,total:q.keywords.length});
  input.value='';
  renderChatMsgs();
  addXP(matched>=3?15:matched>=1?5:2);
}

function showModelAnswer(){
  const q=chatDB[chatState.qIdx];
  chatState.msgs.push({who:'model',text:q.model,tips:q.tips});
  renderChatMsgs();
}

function nextQuestion(){
  chatState.qIdx=(chatState.qIdx+1)%chatDB.length;
  addRecruiterMsg();
}

function resetChat(){
  chatState={qIdx:0,msgs:[]};
  addRecruiterMsg();
}

// ─── ACCOUNTING INTERVIEW (STAR) ───
const acctIvDB = {
  behavioral:[
    {q:"Tell me about yourself.",m:"I am a Senior Accounting Specialist with hands-on technical experience at Brinks. I specialize in reconciling accounts and have reduced unresolved discrepancies by 60% through automated Excel workflows. My systems and data background gives me a unique edge in optimizing accounting processes.",t:["90 seconds","Present+Past+Future"],k:["systems experience","reconciling","discrepancies","automated","60%"]},
    {q:"Why do you want this Accounting Associate position?",m:"I am passionate about accuracy and process improvement. This role perfectly combines my technical Excel skills with my accounting experience. I want to bring my technical mindset to payroll tax reconciliation and help the team operate more efficiently.",t:["Connect skills to role","Show enthusiasm"],k:["accuracy","process improvement","Excel","reconciliation","technical mindset"]},
    {q:"Describe a time you handled a high-pressure deadline.",m:"During quarter-end at Brinks, I had to reconcile three months of cash transactions in two days due to a system migration. I prioritized by creating an automated checklist, delegated data gathering, and worked systematically through each account. We closed on time with zero discrepancies.",t:["STAR method","Specific timeline"],k:["quarter-end","prioritized","automated","systematic","zero discrepancies"]}
  ],
  technical:[
    {q:"Walk me through the payroll reconciliation process.",m:"First, I verify gross pay calculations against time records. Then I confirm all pre-tax and post-tax deductions are correctly applied. Next, I match tax deposits with calculated liabilities and compare the payroll register totals to Form 941. Finally, I reconcile with the general ledger entries and document any adjustments.",t:["Step by step","Mention specific forms"],k:["gross pay","deductions","tax deposits","liabilities","Form 941","general ledger"]},
    {q:"What Excel skills do you bring to this role?",m:"I am proficient in VLOOKUP, XLOOKUP, and INDEX-MATCH for data cross-referencing. I build Pivot Tables for summarizing payroll data by department or jurisdiction. I use SUMIFS for conditional calculations, conditional formatting for variance detection, and Power Query for automating data imports from multiple sources.",t:["List specific functions","Connect to accounting"],k:["VLOOKUP","XLOOKUP","Pivot Tables","SUMIFS","conditional formatting","Power Query"]}
  ],
  integrity:[
    {q:"How do you handle discovering an error in a report that has already been shared?",m:"I immediately notify my supervisor and all stakeholders who received the report. I clearly explain the error, provide the corrected version, and document the root cause. Then I implement a preventive measure — such as an additional verification step — to ensure it does not happen again. Transparency and quick correction build more trust than hiding mistakes.",t:["Immediate transparency","Prevention"],k:["notify","stakeholders","corrected","root cause","preventive","transparency"]},
    {q:"What does integrity mean to you in an accounting context?",m:"Integrity means every number tells the truth. At Brinks, I handled cash logistics where discrepancies could mean the difference between trust and investigation. I learned that accuracy is not just a skill — it is a responsibility. I never adjust a number without documentation, I never skip a reconciliation step, and I always escalate when something does not look right.",t:["Personal example","Non-negotiable standards"],k:["truth","documentation","reconciliation","escalate","responsibility","accuracy"]}
  ]
};

function renderAcctInterview(c){
  const d=acctIvDB[c]||acctIvDB.behavioral;
  document.getElementById('acctIvL').innerHTML=d.map((x,i)=>{
    const sp=x.m.replace(/'/g,"\\'");
    return '<div class="card" style="border-color:rgba(16,185,129,.15)"><div class="card-h"><div class="card-t">❓ Q'+(i+1)+'</div><span class="pl" style="background:rgba(16,185,129,.08);color:var(--em);border:1px solid rgba(16,185,129,.15)">Must Know</span></div>'+
    '<div class="ivs" style="border-color:rgba(16,185,129,.15)"><div class="ivr iw" style="color:var(--em)">👔 INTERVIEWER</div>'+
    '<div style="font-size:16px;font-weight:600">"'+x.q+'" <button class="tts" onclick="event.stopPropagation();speak(\''+x.q.replace(/'/g,"\\'")+'\',this)">🔊</button></div></div>'+
    '<div class="clh" onclick="togColl(this)" style="margin-top:6px;border-color:rgba(16,185,129,.15)"><h3>🎯 Respuesta Modelo</h3><span class="cla">▼</span></div>'+
    '<div class="clb"><div class="cli">'+
    '<div class="ivs" style="border-left:3px solid var(--em)"><div class="ivr you" style="color:var(--em)">🎤 YOUR ANSWER</div>'+
    '<div style="font-size:13px;line-height:1.6">"'+x.m+'" <button class="tts" onclick="event.stopPropagation();speak(\''+sp+'\',this)">🔊</button></div></div>'+
    '<div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:3px">'+x.k.map(k=>'<span style="padding:2px 6px;background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.12);border-radius:8px;font-size:10px;color:var(--em);font-weight:600">'+k+'</span>').join('')+'</div>'+
    '<div class="ivt" style="margin-top:6px;background:rgba(16,185,129,.04);border-color:rgba(16,185,129,.1);color:var(--em)"><b>💡</b> '+x.t.join(' • ')+'</div>'+
    '</div></div></div>';
  }).join('');
}

function renderAcctInterviewPanel(){
  document.getElementById('acct-interview').innerHTML=
    '<div class="sl" style="color:var(--em)">· accounting interview prep ·</div>'+
    '<div class="sd">STAR-method responses for the BR Accounting Associate interview.</div>'+
    '<div class="cp" id="acctIvC"></div>'+
    '<div id="acctIvL"></div>';
  const items=[{c:'behavioral',label:'🎭 Behavioral'},{c:'technical',label:'🔧 Technical'},{c:'integrity',label:'🛡️ Integrity & Ethics'}];
  document.getElementById('acctIvC').innerHTML=items.map((x,i)=>'<span class="cpi '+(i===0?'on':'')+'" data-c="'+x.c+'">'+x.label+'</span>').join('');
  document.getElementById('acctIvC').addEventListener('click',e=>{
    const pill=e.target.closest('.cpi');if(!pill)return;
    document.querySelectorAll('#acctIvC .cpi').forEach(x=>x.classList.remove('on'));
    pill.classList.add('on');
    renderAcctInterview(pill.dataset.c);
  });
  renderAcctInterview('behavioral');
}

// ─── CAREER ROUTE & TECHNICAL SIMULATOR ───
function renderAcctCareer(){
  const pathHtml = `
    <div class="card" style="border-color:rgba(16,185,129,.15)">
      <div class="card-h">
        <div class="card-t">🚀 Ruta de Aprendizaje 2026</div>
        <span class="pl" style="background:var(--amg);color:var(--am);border:1px solid rgba(234,179,8,.15)">Senior Track</span>
      </div>
      <div class="sd">Cursos y herramientas exigidas para el rol Senior Accounting Specialist.</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <div class="word" style="border-left:3px solid var(--em)">
          <div class="word-num" style="font-size:16px;padding-top:2px">1️⃣</div>
          <div class="word-body">
            <div class="word-en" style="color:var(--em);font-size:14px;font-weight:600">ADP Master Tax Certification</div>
            <div class="word-es" style="font-size:12px;color:var(--t2)">Profundización en FICA/FUTA, SUI, e-filing y cruces del Tax Register trimestral.</div>
          </div>
        </div>
        <div class="word" style="border-left:3px solid var(--cy)">
          <div class="word-num" style="font-size:16px;padding-top:2px">2️⃣</div>
          <div class="word-body">
            <div class="word-en" style="color:var(--cy);font-size:14px;font-weight:600">Excel for High-Stakes Finance (V-ficcient)</div>
            <div class="word-es" style="font-size:12px;color:var(--t2)">Automatización de conciliación con Power Query, XLOOKUP anidados y Macros avanzadas de validación.</div>
          </div>
        </div>
        <div class="word" style="border-left:3px solid var(--am)">
          <div class="word-num" style="font-size:16px;padding-top:2px">3️⃣</div>
          <div class="word-body">
            <div class="word-en" style="color:var(--am);font-size:14px;font-weight:600">Python for Audit & Reconciliation</div>
            <div class="word-es" style="font-size:12px;color:var(--t2)">Uso de Pandas para cruzar bases de datos de +1M de filas, detectando discrepancias del General Ledger automáticamente.</div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Technical Test Simulator for Accounting (Colombia/Power Query)
  const acctExDB = [
    {q:"Conciliación Power Query: Al cruzar el extracto bancario con el libro mayor, descubres que las fechas del banco vienen en texto 'DD/MM/YYYY' y el sistema exporta 'MM-DD-YYYY'. ¿Qué función/transformación de Power Query usas para arreglarlo de forma segura?", a:"Usar configuración regional", al:["Configuración regional", "Using locale", "Change type with locale", "Regional settings"], w:"Las fechas con formatos invertidos fallan al hacer un cambio de tipo directo. Debes usar 'Change Type > Using Locale' (Con configuración regional) para parsear el string correctamente."},
    {q:"Nómina Colombiana: Un empleado tiene un salario base de $2.500.000 COP. Este mes generó $200.000 en horas extras. Dado que el Salario Mínimo en 2024 es $1.300.000 (Tope de auxilio = $2.600.000), ¿Se le debe pagar auxilio de transporte en esta quincena?", a:"Sí", al:["Si", "Se paga", "Tiene derecho"], w:"El auxilio de transporte en Colombia se otorga a quienes su salario ordinario o fijo no supere los 2 SMLMV. Las horas extras no constituyen salario fijo continuo para el cómputo de este tope."},
    {q:"Automatización Excel: Tienes que conciliar los pagos de 50 sucursales, cada sucursal envía un archivo Excel diario a una carpeta. ¿Cuál es el origen de datos correcto en Power Query para no tener que abrir los archivos nunca más?", a:"Desde carpeta", al:["From folder", "Obtener datos desde carpeta", "Folder", "Carpeta"], w:"La consulta 'Desde carpeta' (From Folder) se conecta al directorio y anexa automáticamente todos los binarios, combinando la data estructurada de los 50 Excel en una sola tabla matriz."}
  ];

  const exHtml = acctExDB.map((e,i)=>{
    return '<div class="exr" style="border-color:rgba(16,185,129,.15)"><div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:var(--em)">Simulador Técnico</span><span class="pl" style="background:rgba(239,68,68,.08);color:var(--rd);border:1px solid rgba(239,68,68,.15)">LATAM Senior</span></div><div class="eq">'+e.q+'</div><input class="ein" id="acct-i'+i+'" placeholder="Tu respuesta técnica..." onkeydown="if(event.key===\'Enter\')chkAcctTrans('+i+')"><div style="margin-top:6px"><button class="btn bp bs" style="background:var(--em)" onclick="chkAcctTrans('+i+')">Verificar</button> <button class="btn bo bs" onclick="showAcctAns('+i+')">Ver respuesta</button></div><div class="efb" id="acct-f'+i+'"></div></div>';
  }).join('');

  document.getElementById('acct-career').innerHTML = pathHtml + '<div class="sl" style="color:var(--em);margin-top:20px">· laboratorio de conciliación y nómina ·</div>' + exHtml;
  window._acctExDB = acctExDB; // Store for checks
}

window.chkAcctTrans = function(i){
  const e = window._acctExDB[i];
  const v = document.getElementById('acct-i'+i).value.trim().toLowerCase();
  const fb = document.getElementById('acct-f'+i);
  if(v===e.a.toLowerCase()||(e.al||[]).some(a=>v===a.toLowerCase())){
    fb.className='efb sh suc';fb.innerHTML='✅ ¡Correcto! '+e.w;addXP(20);
  } else {
    fb.className='efb sh inf';fb.innerHTML='💡 Respuesta Esperada: "'+e.a+'" — '+e.w;
  }
  upd();save();
};
window.showAcctAns = function(i){
  const e = window._acctExDB[i];
  const fb = document.getElementById('acct-f'+i);
  fb.className='efb sh inf';fb.innerHTML='💡 Respuesta Esperada: "'+e.a+'" — '+e.w;
};

// ─── DYNAMIC INITIALIZATION ───
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('acct-script')) renderAcctScript();
  if (document.getElementById('acct-career')) renderAcctCareer();
  if (document.getElementById('acct-glossary')) renderAcctGlossary();
  if (document.getElementById('acct-excel')) renderExcelVocab();
  if (document.getElementById('acct-resources')) renderResources();
  if (document.getElementById('acct-simulator')) renderSimulator();
  if (document.getElementById('acct-interview')) renderAcctInterviewPanel();
  
  // Standalone Accounting Tabs logic
  const acctTabs = document.querySelectorAll('.acct-tab');
  if (acctTabs.length > 0) {
    acctTabs.forEach(t => t.addEventListener('click', () => {
      document.querySelectorAll('.acct-tab').forEach(x => x.classList.remove('on'));
      document.querySelectorAll('.acct-pnl').forEach(x => x.classList.remove('on'));
      t.classList.add('on');
      const pnl = document.getElementById('ap-' + t.dataset.p);
      if(pnl) pnl.classList.add('on');
    }));
  }
});
