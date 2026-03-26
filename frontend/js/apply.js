// ══════════════════════════════════════════════════════════════
// VACANCY DATABASE — SHARED STORAGE LAYER
// ══════════════════════════════════════════════════════════════
const VDB = {
  KEY: 'da_vacancies',
  getAll(){ try { return JSON.parse(localStorage.getItem(this.KEY)||'[]'); } catch(e){ return []; } },
  save(v){ const all=this.getAll(); const idx=all.findIndex(x=>x.id===v.id); if(idx>=0) all[idx]=v; else all.push(v); localStorage.setItem(this.KEY,JSON.stringify(all)); return v; },
  get(id){ return this.getAll().find(x=>x.id===id)||null; },
  del(id){ localStorage.setItem(this.KEY,JSON.stringify(this.getAll().filter(x=>x.id!==id))); },
  updateStatus(id,status){ const all=this.getAll(); const v=all.find(x=>x.id===id); if(v){ v.status=status; if(status==='applied') v.appliedDate=Date.now(); localStorage.setItem(this.KEY,JSON.stringify(all)); } },
  genId(){ return Date.now().toString(36)+Math.random().toString(36).substr(2,6); }
};

// ══════════════════════════════════════════════════════════════
// GLOBAL STATE
// ══════════════════════════════════════════════════════════════
const S = {
  analyzed: false, vacancyId: null,
  company:'', role:'', url:'', jd:'', salaryInput:'',
  match: { pct:0, ats:0, found:[], missing:[], langs:[], remote:false, hybrid:false, level:'', focusArea:'general' },
  profile: {
    toneMatch:'formal', timezone:'', salaryRange:{min:0,max:0,cur:''},
    hiddenKeywords:[], competitiveEdge:[], tacticalSkills:[],
    companySize:'unknown', urgency:0, cultureFit:0, remoteReady:0,
    applicationPriority:'', postingAge:'unknown', wordCount:0
  }
};

// ══════════════════════════════════════════════════════════════
// MIGUEL'S PROFILE DATABASE (EXPANDED)
// ══════════════════════════════════════════════════════════════
const P = {
  name:'Miguel Ángel Barros Torres', email:'miguelbarros2416@gmail.com',
  phone:'+57 314 437 3585', linkedin:'linkedin.com/in/miguel-ángel-barros-torres-6b2460159',
  loc:'Bogotá, Colombia', tz:'UTC-5', tzNames:['EST','COT','CST','CDT','ECT'],

  // Core professional skills — level 1-5, years of experience, category
  skills: {
    'accounts payable':{lv:5,yr:7,cat:'fin'},'invoice validation':{lv:5,yr:7,cat:'fin'},'invoice processing':{lv:5,yr:7,cat:'fin'},
    'supplier reconciliation':{lv:5,yr:7,cat:'fin'},'vendor management':{lv:5,yr:7,cat:'fin'},'billing':{lv:5,yr:7,cat:'fin'},
    'reconciliation':{lv:5,yr:7,cat:'fin'},'aging reports':{lv:5,yr:7,cat:'fin'},'monthly close':{lv:5,yr:7,cat:'fin'},
    'accounts receivable':{lv:3,yr:2,cat:'fin'},'general ledger':{lv:3,yr:3,cat:'fin'},'tax compliance':{lv:4,yr:5,cat:'fin'},
    'financial analysis':{lv:5,yr:8,cat:'fin'},'cash flow':{lv:4,yr:5,cat:'fin'},'budgeting':{lv:3,yr:3,cat:'fin'},
    'audit':{lv:4,yr:5,cat:'fin'},'compliance':{lv:4,yr:5,cat:'fin'},'accounting':{lv:5,yr:8,cat:'fin'},
    'payment processing':{lv:5,yr:7,cat:'fin'},'financial reporting':{lv:4,yr:5,cat:'fin'},'cost analysis':{lv:4,yr:5,cat:'fin'},
    'bookkeeping':{lv:4,yr:3,cat:'fin'},'journal entries':{lv:4,yr:5,cat:'fin'},'bank reconciliation':{lv:5,yr:7,cat:'fin'},
    'sql':{lv:5,yr:5,cat:'tech'},'python':{lv:3,yr:2,cat:'tech'},'power bi':{lv:4,yr:3,cat:'tech'},
    'power query':{lv:4,yr:3,cat:'tech'},'excel':{lv:5,yr:8,cat:'tech'},'advanced excel':{lv:5,yr:8,cat:'tech'},
    'mysql':{lv:4,yr:4,cat:'tech'},'postgresql':{lv:4,yr:3,cat:'tech'},'data analysis':{lv:4,yr:5,cat:'tech'},
    'data modeling':{lv:3,yr:2,cat:'tech'},'reporting':{lv:5,yr:7,cat:'tech'},'automation':{lv:3,yr:2,cat:'tech'},
    'microsoft office':{lv:5,yr:8,cat:'tech'},'microsoft 365':{lv:5,yr:5,cat:'tech'},'erp':{lv:4,yr:5,cat:'tech'},
    'data entry':{lv:5,yr:5,cat:'tech'},'spreadsheet':{lv:5,yr:8,cat:'tech'},'kpi':{lv:5,yr:5,cat:'tech'},
    'dashboard':{lv:4,yr:3,cat:'tech'},'pandas':{lv:3,yr:2,cat:'tech'},'olap':{lv:3,yr:2,cat:'tech'},
    'google sheets':{lv:4,yr:3,cat:'tech'},'pivot tables':{lv:5,yr:7,cat:'tech'},
    'attention to detail':{lv:5,yr:8,cat:'soft'},'problem solving':{lv:5,yr:8,cat:'soft'},'communication':{lv:4,yr:8,cat:'soft'},
    'teamwork':{lv:4,yr:8,cat:'soft'},'analytical':{lv:5,yr:8,cat:'soft'},'organizational':{lv:5,yr:8,cat:'soft'},
    'time management':{lv:4,yr:8,cat:'soft'},'process improvement':{lv:4,yr:5,cat:'soft'},'leadership':{lv:3,yr:3,cat:'soft'},
    'multitasking':{lv:5,yr:3,cat:'soft'},'self-motivated':{lv:5,yr:8,cat:'soft'},'adaptability':{lv:5,yr:8,cat:'soft'},
    'content moderation':{lv:4,yr:1,cat:'other'},'quality assurance':{lv:4,yr:2,cat:'other'},'data quality':{lv:4,yr:3,cat:'other'},
    'virtual assistant':{lv:3,yr:1,cat:'other'},'customer service':{lv:3,yr:2,cat:'other'}
  },

  // Tactical secondary skills — subtle advantages that don't lead the CV but add value
  tactical: {
    'data entry':{desc:'High-speed data entry with 95%+ accuracy under SLAs',boost:3},
    'typing':{desc:'Fast typing / digitación rápida',boost:2},
    'multitasking':{desc:'Multi-queue management under strict deadlines',boost:3},
    'sla':{desc:'SLA compliance experience (95%+ accuracy)',boost:3},
    'remote':{desc:'Remote work infrastructure: dedicated office, 50+ Mbps, UTC-5',boost:4},
    'bilingual':{desc:'Trilingual: ES (native), PT (C1), EN (B2+)',boost:5},
    'trilingual':{desc:'Trilingual: ES (native), PT (C1), EN (B2+)',boost:5},
    'detail':{desc:'Extreme attention to detail (financial audit background)',boost:3},
    'multicurrency':{desc:'Multi-currency operations experience (BRL, USD, COP)',boost:3},
    'cross-cultural':{desc:'Cross-cultural team experience (Brazil, Caribbean, Colombia)',boost:3},
    'self-starter':{desc:'Independently managed 2 regional AP operations',boost:3},
    'documentation':{desc:'Audit-ready documentation and compliance',boost:2},
    'fast learner':{desc:'Learning Systems Engineering while working full-time',boost:2}
  },

  // Known gaps
  gaps: ['tableau','dbt','snowflake','bigquery','r ','spark','airflow','aws','azure','gcp','machine learning',
    'looker','docker','scala','mongodb','redshift','databricks','sas','spss','javascript','react','java',
    'hadoop','kafka','tensorflow','sap','oracle','netsuite','salesforce','quickbooks','workday','jira',
    'figma','photoshop','node','angular','vue','ruby','c++','c#','swift','kotlin','go ','rust ','terraform',
    'kubernetes','jenkins','ci/cd','product management','ux','ui design','adobe','confluence'],

  langs: {es:{n:'Spanish',lv:'Native',pct:100},pt:{n:'Portuguese',lv:'Advanced (C1)',pct:85},en:{n:'English',lv:'Intermediate-Advanced (B2+)',pct:65}},

  exp: {
    brinks: {
      title_en:{fin:'Accounts Payable Analyst — Regional AP Operations Lead',data:'Financial Data Analyst — AP & Reporting',general:'Accounts Payable Analyst'},
      title_es:{fin:'Analista de Cuentas por Pagar — Líder Regional de Operaciones AP',data:'Analista de Datos Financieros — CxP & Reporting',general:'Analista de Cuentas por Pagar'},
      company:'Brinks Incorporated',
      sub_en:{fin:'Global Security & Logistics — Shared Services',data:'Global Financial Operations — Data & Analytics',general:'Global Security & Logistics'},
      sub_es:{fin:'Shared Services Global — Seguridad & Logística',data:'Operaciones Financieras Globales — Data & Analytics',general:'Seguridad & Logística Global'},
      date_en:'June 2018 – January 2025 · Bogotá, Colombia', date_es:'Junio 2018 – Enero 2025 · Bogotá, Colombia',
      bullets_en:{
        fin:['Led end-to-end Accounts Payable operations for Brazil and Caribbean regions, overseeing invoice intake, validation, coding, and supplier reconciliation across 15+ vendors','Ensured on-time payments in alignment with corporate policies, internal controls, and cash flow priorities for two regional operations','Reviewed and approved AP reconciliations, aging reports, and monthly close deliverables for multi-currency environments','Managed key vendor relationships; resolved billing disputes and discrepancies, achieving a 60% reduction in historical outstanding items','Monitored and reported AP KPIs (aging, throughput, exceptions) using SQL queries and Power BI dashboards','Ensured compliance with accounting standards, local tax regulations (Brazil & Caribbean), and audit requirements','Identified and executed process improvements; built SQL-based automations that optimized payment tracking by 15%','Partnered with Treasury/Finance teams on cash flow projections and payment scheduling across multiple currencies'],
        data:['Implemented complex SQL queries analyzing large transactional datasets across two regional operations, optimizing payment processes by 15%','Designed and automated financial reports by querying databases directly, ensuring data integrity and accuracy for multi-currency environments','Built Power BI dashboards monitoring AP KPIs (aging, throughput, exceptions) providing real-time visibility to leadership','Managed the full AP cycle for Brazil and Caribbean operations, resolving 60% of historical discrepancies through data-driven analysis','Built data models in OLTP/OLAP environments to support financial decision-making across two regions','Created SQL-based automations that reduced manual data processing and improved payment tracking efficiency by 15%','Analyzed large datasets to identify patterns in vendor payment behavior, informing cash flow projections and payment scheduling'],
        general:['Managed end-to-end Accounts Payable operations for Brazil and Caribbean regions across 15+ vendors','Built SQL queries and Power BI dashboards to monitor KPIs, optimizing payment processes by 15%','Resolved 60% of historical billing discrepancies through systematic data analysis and vendor management','Ensured compliance with multi-country tax regulations and audit requirements','Partnered with Treasury on cash flow projections and multi-currency payment scheduling']
      },
      bullets_es:{
        fin:['Lideré operaciones end-to-end de CxP para Brasil y Caribe: recepción, validación, codificación de facturas y conciliación con 15+ proveedores','Aseguré pagos puntuales alineados con políticas corporativas, controles internos y prioridades de flujo de caja','Revisé y aprobé conciliaciones AP, reportes de antigüedad y entregables de cierre mensual multi-moneda','Gestioné relaciones con proveedores clave; resolví disputas de facturación logrando 60% de reducción en discrepancias históricas','Monitoreé KPIs de AP (antigüedad, throughput, excepciones) usando SQL y dashboards Power BI','Aseguré cumplimiento con normas contables, regulaciones tributarias locales y requisitos de auditoría','Identifiqué y ejecuté mejoras de procesos; automatizaciones SQL que optimizaron seguimiento de pagos en 15%','Colaboré con Tesorería/Finanzas en proyecciones de flujo de caja y programación de pagos multi-moneda'],
        data:['Implementé consultas SQL complejas para analizar grandes volúmenes de datos transaccionales, optimizando procesos de pago en 15%','Diseñé y automaticé reportes financieros consultando bases de datos directamente, garantizando integridad y precisión','Construí dashboards Power BI de KPIs de AP (antigüedad, throughput, excepciones) con visibilidad en tiempo real','Gestioné el ciclo completo de CxP para Brasil/Caribe, resolviendo 60% de discrepancias históricas con análisis data-driven','Modelado de datos en entornos OLTP/OLAP para apoyar decisiones financieras en dos regiones','Creé automatizaciones SQL que redujeron procesamiento manual y mejoraron eficiencia en 15%'],
        general:['Gestioné operaciones end-to-end de CxP para Brasil y Caribe con 15+ proveedores','Construí consultas SQL y dashboards Power BI para monitorear KPIs, optimizando pagos en 15%','Resolví 60% de discrepancias históricas mediante análisis sistemático y gestión de proveedores','Aseguré cumplimiento con regulaciones tributarias multi-país y requisitos de auditoría','Colaboré con Tesorería en proyecciones de flujo de caja y programación de pagos multi-moneda']
      }
    },
    teleperformance:{title_en:'Content Moderator — Spanish & Portuguese',title_es:'Moderador de Contenido — Español y Portugués',company:'Teleperformance',date_en:'August 2025 – Present · Bogotá (Remote)',date_es:'Agosto 2025 – Presente · Bogotá (Remoto)',bullets_en:['Manage multiple task queues simultaneously maintaining 95%+ accuracy under strict SLAs','Analyze high-volume data in Spanish and Portuguese for quality compliance'],bullets_es:['Gestión de múltiples colas con precisión 95%+ bajo SLAs estrictos','Análisis de datos en español y portugués para cumplimiento de calidad']},
    express:{title_en:'Control Desk Assistant — Financial Operations',title_es:'Auxiliar Mesa de Control — Operaciones Financieras',company:'Express Microfinanzas',date_en:'September 2016 – May 2018',date_es:'Septiembre 2016 – Mayo 2018',bullets_en:['Developed data-driven credit risk analyses supporting loan portfolio decisions','Built internal tools that reduced operational response times by 30%'],bullets_es:['Análisis de riesgo crediticio basado en datos impactando calidad de la cartera','Herramientas internas que redujeron tiempos de respuesta en 30%']}
  },

  summaries:{
    fin_en:()=>'Results-oriented Accounts Payable professional with 7+ years of end-to-end AP experience in a multinational shared services environment at Brinks International. Proven ability to lead AP operations across multiple regions (Brazil & Caribbean), managing invoice validation, supplier reconciliation, and on-time payment execution. Advanced Excel and SQL skills drive KPI monitoring, process improvements, and automation. Trilingual (Spanish, Portuguese, English) with a Systems Engineering degree in progress.',
    fin_es:()=>'Profesional de Cuentas por Pagar orientado a resultados con 7+ años de experiencia end-to-end en entorno de servicios compartidos multinacional en Brinks International. Capacidad comprobada para liderar operaciones AP en múltiples regiones (Brasil y Caribe). Excel avanzado y SQL impulsan el monitoreo de KPIs, mejoras de procesos y automatización. Trilingüe. Ingeniería de Sistemas en curso.',
    data_en:()=>'Data Analyst with 8+ years in the financial sector. Expert in SQL, Python, and Power BI. Optimized payment processes by 15% and resolved 60% of historical discrepancies at Brinks International (Brazil/Caribbean). Strong background in financial reporting, KPI dashboards, and process automation. Trilingual: Spanish, Portuguese, English. Systems Engineering in progress.',
    data_es:()=>'Analista de Datos con 8+ años en el sector financiero. Experto en SQL, Python y Power BI. Optimicé procesos de pago en 15% y resolví 60% de discrepancias históricas en Brinks International. Trilingüe. Cursando Ingeniería de Sistemas.',
    general_en:()=>'Versatile professional with 8+ years in financial operations and data analysis. Expert in SQL, Excel, and Power BI. Proven results: 15% payment optimization, 60% discrepancy reduction, 30% faster response times at Brinks International. Trilingual: Spanish (native), Portuguese (C1), English (B2+). Remote-ready, detail-oriented, process-driven.',
    general_es:()=>'Profesional versátil con 8+ años en operaciones financieras y análisis de datos. Experto en SQL, Excel y Power BI. Resultados: 15% optimización pagos, 60% reducción discrepancias, 30% mejora tiempos. Trilingüe. Cursando Ingeniería de Sistemas.'
  },
  education:{en:[{t:'B.S. Systems Engineering (8th Semester — In Progress)',d:'Expected 2026'},{t:'Software Analysis & Development Technologist — SENA',d:''},{t:'Accounting Technician — Campo Alto',d:''}],es:[{t:'Ingeniería de Sistemas (8° Semestre — En Curso)',d:'2026'},{t:'Tecnólogo Análisis y Desarrollo de Software — SENA',d:''},{t:'Técnico en Contabilidad — Campo Alto',d:''}]},
  achievements:{en:['60% AP discrepancy reduction','15% payment process optimization','30% faster response times','Multi-region AP operations (BR/CAR)'],es:['60% reducción discrepancias AP','15% optimización de pagos','30% mejora tiempos de respuesta','Operaciones AP multi-región (BR/CAR)']}
};

// ══════════════════════════════════════════════════════════════
// INTERVIEW QUESTION BANK (14 questions, tagged)
// ══════════════════════════════════════════════════════════════
const QBANK=[
  {cat:'general',q_en:'Tell me about yourself',a_en:'I have 8+ years in financial operations, 7 at Brinks International managing AP for Brazil and Caribbean. I handle the full AP cycle — invoice validation, supplier reconciliation, aging reports, monthly close. My edge: SQL and Power BI for KPI monitoring and automation. Trilingual (ES/PT/EN). Completing Systems Engineering.',q_es:'Cuéntame sobre ti',a_es:'Tengo 8+ años en operaciones financieras, 7 en Brinks gestionando CxP para Brasil y Caribe. Ciclo completo AP. Mi diferenciador: SQL y Power BI para KPIs y automatización. Trilingüe. Cursando Ing. Sistemas.',tip:'Lead with experience, highlight differentiators.',tags:['all']},
  {cat:'finance',q_en:'Walk me through your AP experience',a_en:'For 7 years at Brinks, I managed the complete AP cycle for Brazil and Caribbean in a shared services model. Invoice intake, validation, three-way matching, coding, supplier reconciliation, payment execution, monthly close. Multi-currency with different tax regulations, 15+ vendors. Built KPI dashboards with SQL and Power BI.',q_es:'Cuéntame tu experiencia en CxP',a_es:'7 años en Brinks: ciclo completo CxP para Brasil y Caribe en shared services. Validación, conciliación, pagos multi-moneda, cierre mensual. Dashboards de KPIs con SQL y Power BI.',tip:'Hit every AP keyword.',tags:['accounts payable','invoice','reconciliation','finance','accounting','payment']},
  {cat:'finance',q_en:'How do you handle vendor disputes?',a_en:'First, verify data — three-way matching (invoice, PO, receiving). Most disputes resolve at this stage. For genuine disputes, present documented evidence, negotiate professionally. Resolved 60% of historical outstanding items at Brinks.',q_es:'¿Cómo manejas disputas con proveedores?',a_es:'Primero three-way matching. La mayoría se resuelven ahí. Para disputas reales, evidencia documentada y negociación profesional. Resolví 60% de discrepancias históricas.',tip:'Systematic approach + results (60%).',tags:['vendor','supplier','billing','dispute','accounts payable']},
  {cat:'finance',q_en:'How do you ensure compliance with accounting standards?',a_en:'At Brinks, I managed AP for Brazil and Caribbean — different tax regimes. Three pillars: updated knowledge of local regulations, validation checkpoints before every payment, audit-ready documentation. Passed every audit.',q_es:'¿Cómo aseguras cumplimiento normativo?',a_es:'En Brinks gestioné AP de Brasil y Caribe — diferentes regímenes. Tres pilares: conocimiento actualizado, checkpoints de validación, documentación audit-ready.',tip:'Multi-country compliance is a strong differentiator.',tags:['compliance','audit','tax','accounting','regulation']},
  {cat:'finance',q_en:'What AP KPIs do you track?',a_en:'Aging buckets (current, 30, 60, 90+ days), payment throughput, discount capture rate, exception rate, processing cost per invoice. Built these dashboards in Power BI connected via SQL. Real-time visibility for leadership.',q_es:'¿Qué KPIs de AP monitoreas?',a_es:'Aging buckets, throughput, tasa de descuentos, excepciones, costo por factura. Todo en dashboards Power BI vía SQL.',tip:'Naming specific KPIs shows expertise.',tags:['kpi','metrics','reporting','accounts payable','dashboard']},
  {cat:'tech',q_en:'Tell me about a project where you used SQL/data analysis',a_en:'At Brinks, payment tracking was manual. I built SQL queries cross-referencing invoices against payment confirmations, flagging discrepancies in real-time. Created Power BI dashboard for AP aging, throughput, exceptions. Reduced tracking time by 15%, eliminated manual errors.',q_es:'Cuéntame un proyecto con SQL/datos',a_es:'En Brinks automaticé seguimiento de pagos con SQL + dashboard Power BI. Redujo tiempo 15% y eliminó errores manuales.',tip:'Concrete results + technical detail.',tags:['sql','data','analysis','python','power bi','automation','database','query']},
  {cat:'tech',q_en:'How do you handle messy or incomplete data?',a_en:'Structured approach: understand source and schema, identify issues (missing, duplicates, format). At Brinks, I built SQL validation queries flagging quality issues before they hit reports. For missing data, coordinate with source teams.',q_es:'¿Cómo manejas datos incompletos?',a_es:'Proceso: entender fuente, identificar problemas, queries de validación SQL. Coordinar con equipos fuente.',tip:'Show process maturity.',tags:['data','quality','cleaning','analysis','sql']},
  {cat:'leadership',q_en:'How have you led or supervised a team?',a_en:'I functionally led AP operations for two entire regions at Brinks. Coordinated with local finance teams in Brazil and Caribbean, ensured workload distribution, primary escalation point, trained colleagues on reconciliation processes.',q_es:'¿Cómo has liderado equipos?',a_es:'Lideré funcionalmente operaciones AP de dos regiones. Coordiné equipos locales, distribución de carga, escalaciones, entrenamiento de colegas.',tip:'Reframe regional management as functional leadership.',tags:['lead','manager','supervisor','team','coordinate','leadership']},
  {cat:'behavioral',q_en:'Tell me about a process improvement you implemented',a_en:'Payment tracking was manual at Brinks. Built SQL automations cross-referencing invoices + Power BI dashboard. Reduced tracking time 15%, eliminated manual errors causing delayed payments.',q_es:'¿Qué mejora de proceso implementaste?',a_es:'Seguimiento de pagos era manual. SQL + Power BI. Redujo tiempo 15%, eliminó errores.',tip:'Answers "process improvement" and "automation".',tags:['process','improvement','automation','optimize','efficiency']},
  {cat:'behavioral',q_en:'Describe a challenging situation and how you resolved it',a_en:'Inherited 60% unresolved billing discrepancies at Brinks. Systematically categorized by type/amount, prioritized high-value, applied three-way matching. Resolved entire backlog in 18 months. New process kept discrepancies near zero.',q_es:'Describe una situación difícil',a_es:'Heredé 60% de discrepancias sin resolver. Las categoricé, prioricé y apliqué matching sistemático. Resolví todo en 18 meses.',tip:'Quantified results + systematic approach.',tags:['problem','challenge','resolve','conflict']},
  {cat:'motivation',q_en:'Why do you want to work at [Company]?',a_en:'I\'ve researched [Company] and I\'m drawn to [specific aspect]. My 7+ years in financial operations combined with SQL and Power BI align well. As a Systems Engineering student, I bring an automation mindset.',q_es:'¿Por qué quieres trabajar en [Company]?',a_es:'He investigado [Company] y me atrae [aspecto específico]. Mis 7+ años + SQL/Power BI se alinean. Aporto mentalidad de automatización.',tip:'Research the company before the interview.',tags:['all']},
  {cat:'motivation',q_en:'What questions do you have for us?',a_en:'• How has the team grown over the past year?\n• What does success look like in the first 90 days?\n• What tools/systems does the team currently use?\n• What are the biggest challenges?\n• Are there automation initiatives planned?',q_es:'¿Qué preguntas tienes?',a_es:'• ¿Cómo ha crecido el equipo?\n• ¿Cómo se ve el éxito en 90 días?\n• ¿Qué herramientas usan?\n• ¿Mayores desafíos?\n• ¿Iniciativas de automatización?',tip:'Shows strategic thinking.',tags:['all']},
  {cat:'remote',q_en:'How do you manage your time working remotely?',a_en:'Currently working remotely at Teleperformance with 95%+ accuracy under strict SLAs. Structured daily schedule, dedicated home office with 50+ Mbps, proactive communication, daily prioritization.',q_es:'¿Cómo gestionas tu tiempo remoto?',a_es:'Trabajo remoto en Teleperformance con 95%+ precisión bajo SLAs. Oficina dedicada, 50+ Mbps, comunicación proactiva.',tip:'Current remote role proves capability.',tags:['remote','work from home','virtual','distributed']},
  {cat:'tech',q_en:'What experience do you have with ERP systems?',a_en:'At Brinks, I worked with financial ERP systems for invoice processing, payment execution, and reporting across regions. Extracted data via SQL for dashboards. Comfortable learning new ERPs — Systems Engineering background.',q_es:'¿Experiencia con sistemas ERP?',a_es:'En Brinks usé ERPs financieros para facturas, pagos y reporting. Extraía datos vía SQL para dashboards. Mi formación en Ing. Sistemas facilita aprender nuevos ERPs.',tip:'Position for learning curve.',tags:['erp','sap','oracle','netsuite','system']}
];

// ══════════════════════════════════════════════════════════════
// TABS
// ══════════════════════════════════════════════════════════════
document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>{
  document.querySelectorAll('.tab').forEach(x=>x.classList.remove('on'));
  document.querySelectorAll('.pnl').forEach(x=>x.classList.remove('on'));
  t.classList.add('on');document.getElementById('p-'+t.dataset.p).classList.add('on');
}));

// ══════════════════════════════════════════════════════════════
// ADVANCED PROFILING ENGINE
// ══════════════════════════════════════════════════════════════
function detectTone(jd){
  const casual = /we're|you'll|vibe|fun|chill|startup|hustle|fast.paced|move fast|rockstar|ninja/gi;
  const tech = /api|architecture|scalab|microservice|stack|deploy|devops|agile|sprint|scrum|ci\/cd/gi;
  const cM=(jd.match(casual)||[]).length, tM=(jd.match(tech)||[]).length;
  return tM>3?'tech':cM>3?'casual':'formal';
}

function detectTimezone(jd){
  const tzMap={'est':'EST (UTC-5)','cst':'CST (UTC-6)','pst':'PST (UTC-8)','mst':'MST (UTC-7)',
    'cet':'CET (UTC+1)','gmt':'GMT (UTC+0)','brt':'BRT (UTC-3)','cot':'COT (UTC-5)',
    'utc-5':'UTC-5','utc-3':'UTC-3','utc-6':'UTC-6','utc-8':'UTC-8','americas':'Americas (UTC-3 to -8)'};
  const jdL=jd.toLowerCase();
  for(const [k,v] of Object.entries(tzMap)){ if(jdL.includes(k)) return v; }
  if(/colombia|bogot|medell/i.test(jd)) return 'COT (UTC-5)';
  if(/brazil|brasil|são paulo/i.test(jd)) return 'BRT (UTC-3)';
  if(/new york|east coast|eastern/i.test(jd)) return 'EST (UTC-5)';
  if(/latin america|latam/i.test(jd)) return 'Americas';
  return '';
}

function detectSalaryAdv(jd, manual){
  if(manual){ return {raw:manual, min:0, max:0, cur:'manual'}; }
  const patterns=[
    /\$([\d,.]+)\s*[-–to]+\s*\$([\d,.]+)\s*(usd|cop|brl|eur|per year|annually|monthly|mensual|año|mes)?/gi,
    /salario?:?\s*\$([\d,.]+)[kK]?\s*[-–]\s*\$([\d,.]+)[kK]?/gi,
    /([\d,.]+)\s*[-–]\s*([\d,.]+)\s*(usd|cop|brl|eur)/gi,
    /\$([\d,.]+)[kK]?\s*(usd|cop|brl|eur|per year|annually)?/gi
  ];
  for(const p of patterns){
    const m=p.exec(jd);
    if(m) return {raw:m[0], min:parseFloat(m[1]?.replace(/,/g,'')||0), max:parseFloat(m[2]?.replace(/,/g,'')||0), cur:m[3]||''};
  }
  return {raw:'', min:0, max:0, cur:''};
}

function detectCompanySize(jd){
  const jdL=jd.toLowerCase();
  if(/startup|seed|series [ab]|early.stage|small team|<50|fewer than 50/i.test(jd)) return 'startup';
  if(/enterprise|fortune|global|multinational|10,?000|50,?000|100,?000|corporation|nyse|nasdaq/i.test(jd)) return 'enterprise';
  if(/mid.size|growing|scale.up|series [cd]|200\+|500\+/i.test(jd)) return 'mid';
  return 'unknown';
}

function detectUrgency(jd){
  let u=0;
  if(/immediately|asap|urgent|right away|inmediato|urgente/i.test(jd)) u+=4;
  if(/start date|fecha de inicio|begin immediately/i.test(jd)) u+=2;
  if(/fast.paced|high.volume|growing rapidly/i.test(jd)) u+=1;
  return Math.min(10,u);
}

function detectPostingAge(jd){
  if(/posted (today|1 day|hoy|ayer|yesterday)/i.test(jd)) return 'fresh';
  if(/posted (\d+) days/i.test(jd)){
    const d=parseInt(jd.match(/posted (\d+) days/i)[1]);
    return d<=7?'fresh':d<=14?'recent':'stale';
  }
  return 'unknown';
}

function extractHiddenKeywords(jdL){
  const hidden=[];
  const culture=['diversity','inclusion','equity','belonging','sustainability','innovation','integrity','transparency','collaboration','mentorship','growth mindset','continuous learning','work-life balance'];
  const values=['customer-first','data-driven','results-oriented','detail-oriented','proactive','ownership','accountability','empowerment'];
  culture.forEach(k=>{ if(jdL.includes(k)) hidden.push({kw:k,type:'culture'}); });
  values.forEach(k=>{ if(jdL.includes(k)) hidden.push({kw:k,type:'value'}); });
  return hidden;
}

function matchTactical(jdL){
  const matched=[];
  Object.entries(P.tactical).forEach(([k,v])=>{
    if(jdL.includes(k)) matched.push({name:k,...v});
  });
  // Also check for implicit tactical matches
  if(/fast.paced|high.volume|deadline/i.test(jdL) && !matched.find(m=>m.name==='multitasking'))
    matched.push({name:'multitasking',...P.tactical.multitasking});
  if(/accuracy|precision|quality/i.test(jdL) && !matched.find(m=>m.name==='detail'))
    matched.push({name:'detail',...P.tactical.detail});
  if(/remote|work from home|distributed/i.test(jdL) && !matched.find(m=>m.name==='remote'))
    matched.push({name:'remote',...P.tactical.remote});
  return matched;
}

function calculateCultureFit(jdL){
  let score=0;
  if(/diversity|inclusion/i.test(jdL)) score+=15; // cross-cultural exp
  if(/continuous learning|growth/i.test(jdL)) score+=15; // studying while working
  if(/data.driven/i.test(jdL)) score+=10;
  if(/process|optimization|automation/i.test(jdL)) score+=10;
  if(/trilingual|bilingual|multilingual/i.test(jdL)) score+=15;
  if(/collaboration|teamwork/i.test(jdL)) score+=5;
  return Math.min(100,score);
}

function calculateATS(found,missing,langs,tactical){
  // Weighted ATS calculation
  const kwDensity = found.length / Math.max(1, found.length+missing.length);
  const langBonus = langs.length * 0.05;
  const tactBonus = tactical.length * 0.02;
  return Math.min(98, Math.round((kwDensity*0.7 + langBonus + tactBonus + 0.1)*100));
}

function calculatePriority(matchPct, urgency, remote, level){
  let p = matchPct;
  if(urgency >= 4) p += 10;
  if(remote) p += 5;
  if(level === 'junior' || level === 'mid') p += 5;
  if(level === 'senior') p -= 5;
  if(p >= 80) return 'A — Aplicar hoy';
  if(p >= 60) return 'B — Aplicar esta semana';
  if(p >= 40) return 'C — Considerar';
  return 'D — Baja prioridad';
}

// ══════════════════════════════════════════════════════════════
// MAIN ANALYSIS ENGINE
// ══════════════════════════════════════════════════════════════
function runAnalysis(){
  const company=document.getElementById('inCompany').value.trim();
  const role=document.getElementById('inRole').value.trim();
  const url=document.getElementById('inUrl').value.trim();
  const salaryInput=document.getElementById('inSalary').value.trim();
  const jd=document.getElementById('inJD').value.trim();

  if(!jd||jd.length<50){ alert('Pega la descripción completa (mínimo 50 caracteres).'); return; }

  S.company=company||detectCompany(jd); S.role=role||detectRole(jd); S.url=url; S.jd=jd; S.salaryInput=salaryInput;
  const jdL=jd.toLowerCase();

  // ── ATS ENGINE v2: Synonym-aware matching ──
  let found, missing, atsResult;
  if(ATS.isReady()){
    atsResult=ATS.match(jd);
    found=atsResult.found.map(f=>({name:f.name,lv:f.lv,yr:f.yr,cat:f.cat==='core_accounting'?'fin':f.cat==='data_tech'?'tech':f.cat==='data_entry_ops'?'tech':'soft',matchedAs:f.matchedAs,weight:f.weight,catLabel:f.catLabel,catIcon:f.catIcon,catColor:f.catColor}));
    missing=atsResult.missing;
  } else {
    // Fallback: legacy literal matching
    found=[]; missing=[];
    Object.keys(P.skills).forEach(sk=>{ if(jdL.includes(sk)) found.push({name:sk,lv:P.skills[sk].lv,yr:P.skills[sk].yr,cat:P.skills[sk].cat}); });
    P.gaps.forEach(g=>{ if(jdL.includes(g.trim())) missing.push(g.trim()); });
    atsResult=null;
  }

  const langs=[];
  const langKws=['spanish','español','portuguese','portugués','english','inglés','bilingual','trilingual'];
  langKws.forEach(l=>{ if(jdL.includes(l)) langs.push(l); });

  const isRemote=/remote|remoto|work from home|teletrabajo|100%\s*remoto|fully remote|anywhere|distributed/i.test(jd);
  const isHybrid=/hybrid|híbrido/i.test(jd);
  const isSenior=/senior|lead|principal|manager|director|staff|head|10\+ years|8\+ years/i.test(jd);
  const isJunior=/junior|entry.level|trainee|intern|jr\.|0.2 years|1.3 years/i.test(jd);

  // Focus area determination
  const finKw=['accounts payable','invoice','reconciliation','vendor','aging','payment','tax','accounting','ledger','billing','treasury','cash flow','audit','bookkeeping'];
  const dataKw=['data analyst','data analysis','sql','power bi','dashboard','reporting','python','database','analytics','business intelligence','bi ','visualization'];
  const finScore=finKw.filter(k=>jdL.includes(k)).length;
  const dataScore=dataKw.filter(k=>jdL.includes(k)).length;
  const focusArea=finScore>dataScore?'fin':dataScore>2?'data':'general';

  // Advanced profiling
  const tactical=matchTactical(jdL);

  // ── Scoring: use ATS engine if available, else legacy ──
  let pct, atsScore;
  if(atsResult){
    const sc=ATS.score(atsResult,langs.length,tactical.length,isRemote);
    pct=sc.matchPct; atsScore=sc.atsPct;
  } else {
    const totalReq=found.length+missing.length;
    pct=totalReq>0?Math.round((found.length/totalReq)*100):50;
    pct+=langs.length*3; pct+=tactical.length*1;
    if(isRemote)pct+=3;
    pct=Math.min(95,Math.max(10,pct));
    atsScore=calculateATS(found,missing,langs,tactical);
  }
  const level=isSenior?'senior':isJunior?'junior':'mid';

  // Store ATS result for semaphore renderer
  window._lastAtsResult=atsResult||null;
  S.match={pct,ats:atsScore,found,missing,langs,remote:isRemote,hybrid:isHybrid,level,focusArea};
  S.profile={
    toneMatch:detectTone(jd), timezone:detectTimezone(jd),
    salaryRange:detectSalaryAdv(jd,salaryInput),
    hiddenKeywords:extractHiddenKeywords(jdL),
    competitiveEdge:['7+ años finanzas (Brinks multinacional)','SQL + Power BI (raro en finanzas)','Trilingüe ES/PT/EN','Ing. Sistemas en curso','Multi-región multi-moneda'],
    tacticalSkills:tactical,
    companySize:detectCompanySize(jd), urgency:detectUrgency(jd),
    cultureFit:calculateCultureFit(jdL),
    remoteReady:isRemote?95:60,
    applicationPriority:calculatePriority(pct,detectUrgency(jd),isRemote,level),
    postingAge:detectPostingAge(jd), wordCount:jd.split(/\s+/).length
  };
  S.analyzed=true;
  S.vacancyId=S.vacancyId||VDB.genId();

  // Render all sections
  renderAnalysis(); renderCV(); renderCover(); renderInterview(); updateNavState();
  if(typeof CVWeaver!=='undefined'&&CVWeaver.ready) CVWeaver.autoProfile();
  if(typeof CoverWeaver!=='undefined'&&CoverWeaver.ready) CoverWeaver.autoRedact();
  document.getElementById('nCV').classList.add('on');
  document.getElementById('nCover').classList.add('on');
  document.getElementById('nInt').classList.add('on');
  document.getElementById('saveBar').classList.add('on');
  document.getElementById('saveBarLabel').textContent=`💾 ${S.company} — ${S.role}`;
}

function detectCompany(text){
  const patterns=[/(?:at|en|@)\s+([A-Z][A-Za-z\s&.]+?)(?:\s+is|\s+we|\.|,)/,/(?:about|sobre)\s+([A-Z][A-Za-z\s&.]+?)(?:\s|\.)/];
  for(const p of patterns){ const m=text.match(p); if(m) return m[1].trim(); }
  return 'la empresa';
}
function detectRole(text){
  const patterns=[/(?:position|role|puesto|cargo|vacante)[:\s]+([^\n.]+)/i,/(?:hiring|buscamos|seeking)[:\s]+(?:a\s+)?([^\n.]+)/i];
  for(const p of patterns){ const m=text.match(p); if(m) return m[1].trim().substring(0,60); }
  return 'el puesto';
}

// ══════════════════════════════════════════════════════════════
// RENDER ANALYSIS
// ══════════════════════════════════════════════════════════════
function renderAnalysis(){
  const m=S.match, pr=S.profile;
  const c=m.pct>=70?'var(--gn)':m.pct>=40?'var(--am)':'var(--rd)';
  const ac=m.ats>=70?'var(--gn)':m.ats>=40?'var(--am)':'var(--rd)';

  let h=`<div class="card" style="margin-top:12px"><div class="card-t">🎯 Match Analysis — ${S.role} @ ${S.company}</div>
  <div class="grid-4" style="margin-bottom:12px">
  <div class="meter"><div class="meter-v" style="color:${c}">${m.pct}%</div><div class="meter-l">Match Score</div></div>
  <div class="meter"><div class="meter-v" style="color:${ac}">${m.ats}%</div><div class="meter-l">ATS Score</div></div>
  <div class="meter"><div class="meter-v" style="color:var(--cy)">${pr.cultureFit}%</div><div class="meter-l">Culture Fit</div></div>
  <div class="meter"><div class="meter-v" style="color:var(--a2)">${pr.remoteReady}%</div><div class="meter-l">Remote Ready</div></div></div>

  <div class="grid-2" style="margin-bottom:12px">
  <div style="padding:10px;background:var(--el);border-radius:7px;font-size:11px"><strong>Prioridad:</strong> <span style="color:${m.pct>=70?'var(--gn)':'var(--am)'}"> ${pr.applicationPriority}</span></div>
  <div style="padding:10px;background:var(--el);border-radius:7px;font-size:11px"><strong>Tono JD:</strong> <span class="sk sk-v">${pr.toneMatch}</span> ${pr.timezone?'<strong style="margin-left:8px">TZ:</strong> <span class="sk sk-c">'+pr.timezone+'</span>':''}</div>
  <div style="padding:10px;background:var(--el);border-radius:7px;font-size:11px"><strong>Modalidad:</strong> ${m.remote?'<span style="color:var(--gn)">✅ Remoto</span>':m.hybrid?'<span style="color:var(--am)">🟡 Híbrido</span>':'<span style="color:var(--t3)">Presencial</span>'} <strong style="margin-left:8px">Nivel:</strong> ${m.level==='senior'?'<span style="color:var(--am)">Senior+</span>':m.level==='junior'?'<span style="color:var(--gn)">Junior</span>':'<span style="color:var(--gn)">Mid</span>'}</div>
  <div style="padding:10px;background:var(--el);border-radius:7px;font-size:11px"><strong>Tamaño:</strong> <span class="sk sk-o">${pr.companySize}</span> ${pr.urgency>=4?'<strong style="margin-left:8px;color:var(--rd)">🔥 URGENTE</strong>':''} ${pr.salaryRange.raw?'<strong style="margin-left:8px">💰</strong> '+pr.salaryRange.raw:''}</div></div>

  <div style="font-size:11px;color:var(--t2);line-height:1.8">`;

  // ── ATS Semaphore: synonym-aware rendering ──
  if(ATS.isReady() && window._lastAtsResult){
    h+=ATS.renderSemaphore(window._lastAtsResult, null);
  } else {
    if(m.found.length){
      h+=`<div style="font-size:12px;font-weight:700;color:var(--gn);margin-bottom:6px">✓ SKILLS QUE TIENES (${m.found.length})</div>`;
      h+=m.found.map(s=>`<span class="sk sk-g">${s.name} ${'★'.repeat(s.lv)}</span>`).join(' ')+'<br><br>';
    }
    if(m.missing.length){
      h+=`<div style="font-size:12px;font-weight:700;color:var(--am);margin-bottom:6px">⚠ GAPS (${m.missing.length})</div>`;
      h+=m.missing.map(s=>`<span class="sk sk-r">${s}</span>`).join(' ')+'<br><br>';
    }
  }
  if(pr.tacticalSkills.length){
    h+=`<div style="font-size:12px;font-weight:700;color:var(--cy);margin-bottom:6px">🎯 VENTAJAS TÁCTICAS (${pr.tacticalSkills.length})</div>`;
    h+=pr.tacticalSkills.map(s=>`<span class="sk sk-c" title="${s.desc}">${s.name} +${s.boost}</span>`).join(' ')+'<br><br>';
  }
  if(pr.hiddenKeywords.length){
    h+=`<div style="font-size:12px;font-weight:700;color:var(--or);margin-bottom:6px">🔑 KEYWORDS OCULTAS (${pr.hiddenKeywords.length})</div>`;
    h+=pr.hiddenKeywords.map(k=>`<span class="sk sk-o">${k.kw} <small>(${k.type})</small></span>`).join(' ')+'<br><br>';
  }
  if(m.langs.length){
    h+=`<div style="font-size:12px;font-weight:700;color:var(--a2);margin-bottom:6px">🌎 IDIOMAS MATCH</div>`;
    h+=m.langs.map(l=>`<span class="sk sk-v">${l}</span>`).join(' ')+'<br><br>';
  }

  h+=`<div style="font-size:12px;font-weight:700;color:var(--a2);margin:6px 0">🌟 DIFERENCIADORES COMPETITIVOS</div>`;
  h+=pr.competitiveEdge.map(d=>`<span class="sk sk-v">${d}</span>`).join(' ');
  h+=`</div></div>`;

  h+=`<div class="tip tip-g"><b>✅ SECCIONES GENERADAS — Click las pestañas</b>
  <p><strong>CV Perfilado</strong> EN/ES (ATS: ${m.ats}%), <strong>Cover Letter</strong> (tono: ${pr.toneMatch}), <strong>Entrevista</strong> (8 preguntas relevantes). <strong>Guarda en el Tracker</strong> para no perder esta vacante.</p></div>`;

  document.getElementById('analysisResult').innerHTML=h;
}

// ══════════════════════════════════════════════════════════════
// CV GENERATOR
// ══════════════════════════════════════════════════════════════
function renderCV(){
  if(!S.analyzed) return;
  const f=S.match.focusArea;
  const atsKws=S.match.found.map(s=>s.name);
  const roleEN=buildRoleHeadline('en'), roleES=buildRoleHeadline('es');
  const allTech=[...new Set([...S.match.found.filter(s=>P.skills[s.name]?.cat==='tech').map(s=>capitalize(s.name)),'SQL (Advanced)','Excel (Advanced)','Power BI & Power Query','Python / Pandas','MySQL / PostgreSQL','Microsoft 365','Data Modeling'])].slice(0,9);
  const allFin=[...new Set([...S.match.found.filter(s=>P.skills[s.name]?.cat==='fin').map(s=>capitalize(s.name)),'End-to-End AP Management','Invoice Validation','Supplier Reconciliation','Aging Reports','KPI Monitoring','Tax Compliance','Process Optimization'])].slice(0,10);
  const bk=P.exp.brinks;
  const bulletsEN=bk.bullets_en[f]||bk.bullets_en.general;
  const bulletsES=bk.bullets_es[f]||bk.bullets_es.general;
  const titleEN=typeof bk.title_en==='object'?(bk.title_en[f]||bk.title_en.general):bk.title_en;
  const titleES=typeof bk.title_es==='object'?(bk.title_es[f]||bk.title_es.general):bk.title_es;
  const subEN=typeof bk.sub_en==='object'?(bk.sub_en[f]||bk.sub_en.general):'';
  const subES=typeof bk.sub_es==='object'?(bk.sub_es[f]||bk.sub_es.general):'';
  const summaryEN=(P.summaries[f+'_en']||P.summaries.general_en)();
  const summaryES=(P.summaries[f+'_es']||P.summaries.general_es)();

  let html=`<div class="tip tip-v"><b>🎯 ESTRATEGIA ATS — ${S.company.toUpperCase()} (Score: ${S.match.ats}%)</b>
  <p>Keywords insertadas: <strong>${atsKws.join(', ')}</strong></p></div>
  <div style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap">
  <button class="btn bp" onclick="printCV('en')">📥 Download English CV (PDF)</button>
  <button class="btn bg" onclick="printCV('es')">📥 Descargar CV Español (PDF)</button></div>
  <div class="sl">· english version — ${S.role} ·</div>
  <div class="cv-frame" id="cv-en"><div class="cv-hdr"><div class="cv-hdr-top"><div><div class="cv-name">${P.name}</div><div class="cv-role">${roleEN}</div></div><div class="cv-contact">📱 ${P.phone}<br>📧 <a href="mailto:${P.email}">${P.email}</a><br>🔗 <a href="https://${P.linkedin}" target="_blank">LinkedIn</a><br>📍 ${P.loc}${S.match.remote?' · Open to Remote':''}</div></div></div>
  <div class="cv-body"><div class="cv-cols"><div class="cv-main">
  <div class="cv-h3">Professional Summary</div><div class="cv-p">${summaryEN}</div>
  <div class="cv-h3">Professional Experience</div>
  <div class="cv-xt">${titleEN}</div><div class="cv-xc">${bk.company}${subEN?' ('+subEN+')':''}</div><div class="cv-xd">${bk.date_en}</div>
  <ul class="cv-ul">${bulletsEN.map(b=>'<li>'+b+'</li>').join('')}</ul>
  <div class="cv-xt">${P.exp.teleperformance.title_en}</div><div class="cv-xc">${P.exp.teleperformance.company}</div><div class="cv-xd">${P.exp.teleperformance.date_en}</div>
  <ul class="cv-ul">${P.exp.teleperformance.bullets_en.map(b=>'<li>'+b+'</li>').join('')}</ul>
  <div class="cv-xt">${P.exp.express.title_en}</div><div class="cv-xc">${P.exp.express.company}</div><div class="cv-xd">${P.exp.express.date_en}</div>
  <ul class="cv-ul">${P.exp.express.bullets_en.map(b=>'<li>'+b+'</li>').join('')}</ul>
  <div class="cv-h3">Education</div>${P.education.en.map(e=>`<div class="cv-xt">${e.t}</div>${e.d?'<div class="cv-xd">'+e.d+'</div>':''}`).join('')}
  </div><div class="cv-side">
  <div class="cv-h4">${f==='fin'?'Core AP Competencies':'Technical Skills'}</div>
  <ul class="cv-skl">${(f==='fin'?allFin:allTech).map(s=>'<li><span class="cv-dot"></span>'+s+'</li>').join('')}</ul>
  <div class="cv-h4">${f==='fin'?'Technical Skills':'Analytical Tools'}</div>
  <ul class="cv-skl">${(f==='fin'?allTech:['Financial Analysis','Process Optimization','Data Modeling','Task Automation','Report Generation']).map(s=>'<li><span class="cv-dot"></span>'+s+'</li>').join('')}</ul>
  <div class="cv-h4">Languages</div>${Object.values(P.langs).map(l=>`<div style="font-size:10px;color:#374151;margin-top:4px">${l.n} — ${l.lv}</div><div class="cv-bar"><div class="cv-fill" style="width:${l.pct}%"></div></div>`).join('')}
  <div class="cv-h4">Key Achievements</div><ul class="cv-skl">${P.achievements.en.map(a=>'<li><span class="cv-dot" style="background:#22c55e"></span>'+a+'</li>').join('')}</ul>
  </div></div></div></div>
  <div class="sl">· versión español ·</div>
  <div class="cv-frame" id="cv-es"><div class="cv-hdr"><div class="cv-hdr-top"><div><div class="cv-name">${P.name}</div><div class="cv-role">${roleES}</div></div><div class="cv-contact">📱 ${P.phone}<br>📧 <a href="mailto:${P.email}">${P.email}</a><br>🔗 <a href="https://${P.linkedin}" target="_blank">LinkedIn</a><br>📍 ${P.loc}${S.match.remote?' · Disponible Remoto':''}</div></div></div>
  <div class="cv-body"><div class="cv-cols"><div class="cv-main">
  <div class="cv-h3">Perfil Profesional</div><div class="cv-p">${summaryES}</div>
  <div class="cv-h3">Experiencia Profesional</div>
  <div class="cv-xt">${titleES}</div><div class="cv-xc">${bk.company}${subES?' ('+subES+')':''}</div><div class="cv-xd">${bk.date_es}</div>
  <ul class="cv-ul">${bulletsES.map(b=>'<li>'+b+'</li>').join('')}</ul>
  <div class="cv-xt">${P.exp.teleperformance.title_es}</div><div class="cv-xc">${P.exp.teleperformance.company}</div><div class="cv-xd">${P.exp.teleperformance.date_es}</div>
  <ul class="cv-ul">${P.exp.teleperformance.bullets_es.map(b=>'<li>'+b+'</li>').join('')}</ul>
  <div class="cv-xt">${P.exp.express.title_es}</div><div class="cv-xc">${P.exp.express.company}</div><div class="cv-xd">${P.exp.express.date_es}</div>
  <ul class="cv-ul">${P.exp.express.bullets_es.map(b=>'<li>'+b+'</li>').join('')}</ul>
  <div class="cv-h3">Educación</div>${P.education.es.map(e=>`<div class="cv-xt">${e.t}</div>${e.d?'<div class="cv-xd">'+e.d+'</div>':''}`).join('')}
  </div><div class="cv-side">
  <div class="cv-h4">${f==='fin'?'Competencias AP':'Habilidades Técnicas'}</div>
  <ul class="cv-skl">${(f==='fin'?['Gestión End-to-End CxP','Validación Facturas','Conciliación Proveedores','Reportes Aging','KPIs AP','Cumplimiento Tributario','Flujo de Caja','Optimización Procesos']:['SQL (Avanzado)','Python / Pandas','Power BI & Power Query','Excel Avanzado','MySQL / PostgreSQL','Microsoft 365','Modelado de Datos']).map(s=>'<li><span class="cv-dot"></span>'+s+'</li>').join('')}</ul>
  <div class="cv-h4">${f==='fin'?'Habilidades Técnicas':'Herramientas'}</div>
  <ul class="cv-skl">${(f==='fin'?['SQL (Avanzado)','Excel Avanzado','Power BI','Sistemas ERP','Python / Pandas','Microsoft 365']:['Análisis Financiero','Optimización Procesos','Modelado de Datos','Automatización','Reportes']).map(s=>'<li><span class="cv-dot"></span>'+s+'</li>').join('')}</ul>
  <div class="cv-h4">Idiomas</div>
  <div style="font-size:10px;color:#374151">Español — Nativo</div><div class="cv-bar"><div class="cv-fill" style="width:100%"></div></div>
  <div style="font-size:10px;color:#374151;margin-top:4px">Portugués — Avanzado (C1)</div><div class="cv-bar"><div class="cv-fill" style="width:85%"></div></div>
  <div style="font-size:10px;color:#374151;margin-top:4px">Inglés — Intermedio-Avanzado</div><div class="cv-bar"><div class="cv-fill" style="width:65%"></div></div>
  <div class="cv-h4">Logros</div><ul class="cv-skl">${P.achievements.es.map(a=>'<li><span class="cv-dot" style="background:#22c55e"></span>'+a+'</li>').join('')}</ul>
  </div></div></div></div>`;
  document.getElementById('cvContent').innerHTML=html;
}
function buildRoleHeadline(lang){
  const f=S.match.focusArea;
  const mt=S.match.found.filter(s=>P.skills[s.name]?.cat==='tech').slice(0,3).map(s=>capitalize(s.name));
  const tools=mt.length?mt.join(' · '):'SQL · Excel · Power BI';
  if(f==='fin') return lang==='en'?`Accounts Payable Analyst | Financial Operations | ${tools}`:`Analista CxP | Operaciones Financieras | ${tools}`;
  if(f==='data') return lang==='en'?`Data Analyst | Financial Analysis | ${tools}`:`Analista de Datos | Análisis Financiero | ${tools}`;
  return lang==='en'?`Financial & Data Analyst | ${tools}`:`Analista Financiero & Datos | ${tools}`;
}

// ══════════════════════════════════════════════════════════════
// COVER LETTER GENERATOR
// ══════════════════════════════════════════════════════════════
function renderCover(){
  if(!S.analyzed) return;
  const co=S.company,ro=S.role,f=S.match.focusArea,tone=S.profile.toneMatch;
  const coverEN=buildCoverEN(co,ro,f,tone), coverES=buildCoverES(co,ro,f);
  const msgApp=buildMsgApp(co,ro), msgLN=buildMsgLN(co,ro);
  let html=`<div class="card"><div class="card-t">✉️ Cover Letter — English (${co}) <span class="sk sk-v">${tone}</span></div>
  <div class="tpl" id="cl-en">${coverEN}</div><button class="btn bo bs" style="margin-top:8px" onclick="cpTxt('cl-en')">📋 Copiar</button></div>
  <div class="card"><div class="card-t">✉️ Carta — Español (${co})</div>
  <div class="tpl" id="cl-es">${coverES}</div><button class="btn bo bs" style="margin-top:8px" onclick="cpTxt('cl-es')">📋 Copiar</button></div>
  <div class="card"><div class="card-t">💬 Mensaje de Aplicación (Portal)</div>
  <div class="tpl" id="msg-app">${msgApp}</div><button class="btn bo bs" style="margin-top:8px" onclick="cpTxt('msg-app')">📋 Copiar</button></div>
  <div class="card"><div class="card-t">🔗 Mensaje LinkedIn Networking</div>
  <div class="tpl" id="msg-ln">${msgLN}</div><button class="btn bo bs" style="margin-top:8px" onclick="cpTxt('msg-ln')">📋 Copiar</button></div>`;
  document.getElementById('coverContent').innerHTML=html;
}
function buildCoverEN(co,ro,f,tone){
  const greeting=tone==='casual'?`Hi ${co} team,`:`Dear ${co!=='la empresa'?co:''} Hiring Team,`;
  const intro=`\n\nI am writing to express my strong interest in the ${ro} position${co!=='la empresa'?' at '+co:''}. With 8+ years of experience in financial operations and data analysis, I bring a proven combination of ${f==='fin'?'AP expertise, process optimization':'analytical skills, technical proficiency'}, and technical capabilities.`;
  const body=f==='fin'?`\n\nAs AP Analyst at Brinks International, I independently led end-to-end accounts payable operations for Brazil and Caribbean regions in a shared services environment — managing invoice validation, supplier reconciliation, aging reports, and monthly close across 15+ vendors and multiple currencies. I resolved 60% of historical billing discrepancies and built SQL-based automations that optimized payment tracking by 15%.\n\nWhat differentiates me is my technical edge: Power BI dashboards for AP KPIs — a capability rare among AP professionals. My trilingual skills (Spanish, Portuguese, English) add further value for multi-regional operations.`:`\n\nAt Brinks International (7 years), I implemented complex SQL queries analyzing large transactional datasets, optimizing payment processes by 15%. I designed Power BI dashboards for KPI monitoring and built data models in OLTP/OLAP environments. I resolved 60% of historical discrepancies through systematic analysis.\n\nMy trilingual capabilities (Spanish, Portuguese, English) combined with a Systems Engineering degree in progress make me uniquely positioned for this role.`;
  const close=`\n\n${tone==='casual'?'Looking forward to chatting!':'I am excited about the opportunity to contribute'+(co!=='la empresa'?' to '+co:'')+' and would welcome the chance to discuss how my experience aligns with your needs.'}\n\nBest regards,\n${P.name}\n${P.email} | ${P.phone}`;
  return greeting+intro+body+close;
}
function buildCoverES(co,ro,f){
  return `Estimado equipo de selección${co!=='la empresa'?' de '+co:''},\n\nExpreso mi interés en la posición de ${ro}. Con más de 8 años en operaciones financieras y análisis de datos, aporto ${f==='fin'?'expertise en CxP y optimización':'habilidades analíticas y competencia técnica'}.\n\n${f==='fin'?'En Brinks International (7 años), lideré operaciones end-to-end de CxP para Brasil y Caribe en shared services. Validación de facturas, conciliación con 15+ proveedores, reportes de antigüedad y cierre mensual multi-moneda. Resolví 60% de discrepancias históricas. Automatizaciones SQL optimizaron pagos en 15%. Dashboards Power BI para KPIs.':'En Brinks International (7 años), implementé SQL sobre grandes datasets, optimizando procesos en 15%. Dashboards Power BI de KPIs y modelos OLTP/OLAP. Resolví 60% de discrepancias históricas.'}\n\nTrilingüe (ES/PT/EN) + Ingeniería de Sistemas en curso.\n\nCordial saludo,\n${P.name}\n${P.email}`;
}
function buildMsgApp(co,ro){
  return `I'm excited to apply for the ${ro} role${co!=='la empresa'?' at '+co:''}. With 8+ years in financial operations at Brinks International (Brazil & Caribbean), I bring deep expertise plus a technical edge — SQL automations (15% optimization), Power BI dashboards, and 60% discrepancy reduction.\n\nKey highlights:\n→ 7yr financial operations (Brinks multinational)\n→ SQL + Power BI + Excel (rare for finance roles)\n→ Trilingual: Spanish, Portuguese, English\n→ Systems Engineering student\n→ Remote-ready: dedicated office, 50+ Mbps, UTC-5\n\n${P.name} | Bogotá, Colombia`;
}
function buildMsgLN(co,ro){
  return `Hi [Name],\n\nI noticed ${co!=='la empresa'?co:'your company'} has an opening for ${ro}. As a financial analyst with 8+ years at Brinks International plus SQL/Power BI skills and trilingual capabilities (ES/PT/EN), I believe I could add value.\n\nWould you be open to a brief chat?\n\nBest, Miguel`;
}

// ══════════════════════════════════════════════════════════════
// INTERVIEW GENERATOR
// ══════════════════════════════════════════════════════════════
function renderInterview(){
  if(!S.analyzed) return;
  const jdL=S.jd.toLowerCase();
  const scored=QBANK.map(q=>{
    let score=0;
    if(q.tags.includes('all')) score+=5;
    q.tags.forEach(t=>{ if(jdL.includes(t)) score+=3; });
    if(q.cat==='finance'&&S.match.focusArea==='fin') score+=4;
    if(q.cat==='tech'&&S.match.focusArea==='data') score+=4;
    if(q.cat==='remote'&&S.match.remote) score+=5;
    if(q.cat==='leadership'&&S.match.level==='senior') score+=4;
    return {...q,score};
  });
  scored.sort((a,b)=>b.score-a.score);
  const top=scored.slice(0,8);
  const co=S.company!=='la empresa'?S.company:'the company';
  const r=s=>s.replace(/\[Company\]/g,co);

  let html=`<div class="tip tip-v"><b>📋 PREP PARA ${S.role.toUpperCase()} @ ${S.company.toUpperCase()}</b>
  <p>8 preguntas seleccionadas por relevancia. <strong>Click</strong> para ver respuesta.</p></div>
  <div class="card"><div class="card-t">🗣️ English (click para respuesta)</div>
  ${top.map((q,i)=>`<div class="iq" onclick="toggleIQ(this)"><div class="iq-q">${i+1}. "${r(q.q_en)}"</div><div class="iq-a">${r(q.a_en)}</div><div class="iq-tip">💡 ${q.tip}</div></div>`).join('')}</div>
  <div class="card"><div class="card-t">🇪🇸 Español</div>
  ${top.map((q,i)=>`<div class="iq" onclick="toggleIQ(this)"><div class="iq-q">${i+1}. "${r(q.q_es)}"</div><div class="iq-a">${r(q.a_es)}</div></div>`).join('')}</div>`;
  document.getElementById('interviewContent').innerHTML=html;
}
function toggleIQ(el){ el.querySelector('.iq-a').classList.toggle('show'); const t=el.querySelector('.iq-tip'); if(t) t.classList.toggle('show'); }

// ══════════════════════════════════════════════════════════════
// SAVE / LOAD — BIDIRECTIONAL INTEGRATION
// ══════════════════════════════════════════════════════════════
function saveToTracker(){
  if(!S.analyzed){ alert('Analiza una vacante primero.'); return; }
  const existing=VDB.get(S.vacancyId);
  const vacancy={
    id: S.vacancyId,
    ts: existing?.ts || Date.now(),
    updatedAt: Date.now(),
    status: existing?.status || 'saved',
    company: S.company, role: S.role, url: S.url, jd: S.jd, salaryInput: S.salaryInput,
    match: {...S.match},
    profile: {...S.profile},
    focusArea: S.match.focusArea,
    notes: existing?.notes || '',
    appliedDate: existing?.appliedDate || null,
    followUpDate: existing?.followUpDate || null
  };
  VDB.save(vacancy);

  // Also sync to the old jt8 tracker format for backward compat
  syncToKanban(vacancy);

  const btn=document.querySelector('.save-bar .bg');
  btn.innerHTML='✅ Guardado!'; btn.style.background='var(--gn)';
  setTimeout(()=>{ btn.innerHTML='💾 Guardar en Job Tracker'; btn.style.background=''; },2000);
}

function syncToKanban(v){
  // Add to jt8 kanban if not already there
  let a=[];try{a=JSON.parse(localStorage.getItem('jt8')||'[]');}catch(e){}
  if(!a.find(x=>x.vid===v.id)){
    a.push({t:v.role,c:v.company,u:v.url,s:v.status==='saved'?'saved':'applied',d:new Date().toLocaleDateString('es',{day:'numeric',month:'short'}),vid:v.id});
    localStorage.setItem('jt8',JSON.stringify(a));
  }
}

function loadVacancy(id){
  const v=VDB.get(id);
  if(!v) return false;
  document.getElementById('inCompany').value=v.company||'';
  document.getElementById('inRole').value=v.role||'';
  document.getElementById('inUrl').value=v.url||'';
  document.getElementById('inSalary').value=v.salaryInput||'';
  document.getElementById('inJD').value=v.jd||'';
  S.vacancyId=v.id;
  runAnalysis();
  return true;
}

// ══════════════════════════════════════════════════════════════
// UI HELPERS
// ══════════════════════════════════════════════════════════════
function updateNavState(){
  const badge=document.getElementById('navBadge');
  badge.className='bdg bdg-g'; badge.innerHTML=`🎯 ${S.match.pct}% Match`;
  document.getElementById('heroSub').textContent=`centro de comando · ${S.company} · ${S.role}`;
}
function clearAnalysis(){
  S.analyzed=false; S.company=''; S.role=''; S.url=''; S.jd=''; S.vacancyId=null;
  ['inCompany','inRole','inUrl','inSalary','inJD'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('analysisResult').innerHTML='';
  document.getElementById('cvContent').innerHTML='<div class="empty"><div class="empty-icon">📄</div><h3>CV Perfilado pendiente</h3><p>Analiza una vacante primero.</p></div>';
  document.getElementById('coverContent').innerHTML='<div class="empty"><div class="empty-icon">✉️</div><h3>Cover Letter pendiente</h3><p>Analiza una vacante primero.</p></div>';
  document.getElementById('interviewContent').innerHTML='<div class="empty"><div class="empty-icon">🎯</div><h3>Prep pendiente</h3><p>Analiza una vacante primero.</p></div>';
  ['nCV','nCover','nInt'].forEach(id=>document.getElementById(id).classList.remove('on'));
  document.getElementById('navBadge').className='bdg bdg-v'; document.getElementById('navBadge').innerHTML='⚡ Listo';
  document.getElementById('heroSub').textContent='centro de comando · pega una vacante para comenzar';
  document.getElementById('saveBar').classList.remove('on');
}
function loadSample(){
  document.getElementById('inCompany').value='Rappi';
  document.getElementById('inRole').value='Financial Data Analyst';
  document.getElementById('inJD').value=`About Rappi:\nRappi is the fastest-growing Latin American tech company. We are looking for a Financial Data Analyst to join our Finance team in Bogotá (remote-friendly).\n\nRequirements:\n- 3+ years of experience in financial analysis or data analysis\n- Advanced SQL skills (complex queries, joins, window functions)\n- Experience with Power BI or Tableau for dashboard creation\n- Strong Excel skills including pivot tables and advanced formulas\n- Knowledge of accounts payable, accounts receivable, or general ledger processes\n- Experience with financial reporting and KPI monitoring\n- Python knowledge is a plus\n- Bachelor's degree in Finance, Engineering, or related field\n- Spanish native, English intermediate or above\n- Strong attention to detail and analytical thinking\n- Experience with process improvement and automation\n- Fast-paced, data-driven environment\n- We value diversity, inclusion, and continuous learning\n\nResponsibilities:\n- Analyze financial data to support decision-making\n- Build and maintain Power BI dashboards for financial KPIs\n- Automate reporting processes using SQL and Python\n- Support monthly close and reconciliation processes\n- Collaborate with cross-functional teams\n\nBenefits: Competitive salary, remote work, stock options, health insurance.\nTimezone: Americas (EST preferred)`;
}
function cpTxt(id){
  const el=document.getElementById(id);
  navigator.clipboard.writeText(el.textContent.trim()).then(()=>{
    const b=el.parentElement.querySelector('.btn');
    if(b){const o=b.innerHTML;b.innerHTML='✅ Copiado!';b.style.color='var(--gn)';setTimeout(()=>{b.innerHTML=o;b.style.color='';},2000);}
  });
}
function printCV(lang){
  const cv=document.getElementById('cv-'+lang);if(!cv)return;
  const w=window.open('','','width=900,height=1200');
  w.document.write(`<html><head><title>CV ${P.name} — ${S.role}</title><link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=Newsreader:ital,wght@0,600&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:"IBM Plex Sans",sans-serif;background:#fff}@page{size:A4;margin:0}a{color:#6366f1;text-decoration:none}.cv-frame{background:#fff;color:#1a1a1a}.cv-hdr{background:linear-gradient(135deg,#1e1b4b,#312e81);color:#fff;padding:24px 28px}.cv-hdr-top{display:flex;justify-content:space-between;align-items:center}.cv-name{font-family:"Newsreader",serif;font-size:24px;font-weight:600}.cv-role{font-size:12px;color:#c7d2fe;margin-top:2px}.cv-contact{text-align:right;font-size:10px;color:#c7d2fe;line-height:1.8}.cv-contact a{color:#c7d2fe}.cv-body{padding:22px 28px}.cv-cols{display:flex;gap:24px}.cv-main{flex:1}.cv-side{width:230px;border-left:1px solid #e5e7eb;padding-left:20px}.cv-h3{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#312e81;border-bottom:2px solid #e0e7ff;padding-bottom:3px;margin:14px 0 8px}.cv-h3:first-child{margin-top:0}.cv-p{font-size:11px;line-height:1.6;color:#374151;margin-bottom:6px}.cv-xt{font-size:12px;font-weight:600}.cv-xc{font-size:11px;color:#6366f1;font-weight:500}.cv-xd{font-size:10px;color:#6b7280}.cv-ul{list-style:none;margin:4px 0 10px;padding:0}.cv-ul li{font-size:10px;color:#374151;padding:1px 0 1px 10px;position:relative;line-height:1.5}.cv-ul li::before{content:"▸";position:absolute;left:0;color:#6366f1}.cv-h4{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#312e81;margin:12px 0 6px}.cv-h4:first-child{margin-top:0}.cv-skl{list-style:none;padding:0}.cv-skl li{font-size:10px;color:#374151;padding:1px 0;display:flex;align-items:center;gap:5px}.cv-dot{width:5px;height:5px;border-radius:50%;background:#6366f1;flex-shrink:0}.cv-bar{height:3px;background:#e5e7eb;border-radius:2px;margin-top:1px}.cv-fill{height:100%;border-radius:2px;background:#6366f1}</style></head><body>${cv.outerHTML}</body></html>`);
  w.document.close();setTimeout(()=>w.print(),600);
}
function capitalize(s){ return s.split(' ').map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(' '); }

// ══════════════════════════════════════════════════════════════
// INIT — Check URL params for loading a saved vacancy
// ══════════════════════════════════════════════════════════════
// ── Initialize ATS Engine, then check URL params ──
(async function(){
  await ATS.init();
  const params=new URLSearchParams(window.location.search);
  const vid=params.get('v');
  if(vid){ setTimeout(()=>loadVacancy(vid),100); }
})();
