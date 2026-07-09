/* ════════════════════════════════════════════════════════════════
   4-RUT · PROYECTO ATLAS v3.0 — El Camino de los Certificados
   Cert-first · visual · 1h/día · una sola cosa a la vez.
   F1 Google Data Analytics → F2 Power BI PL-300 → F3 Python Kaggle
   → F4 IA Aplicada (la v2.0 vive ahí, pospuesta no cancelada).
   Keys: atlas_daily (array) · atlas_curr (obj) · atlas_meta (obj)
   — las 3 registradas en SYNC_REGISTRY de cloud-sync.js.
   ════════════════════════════════════════════════════════════════ */
const ATLAS = (() => {

  /* ── State ── */
  const K_DAILY='atlas_daily', K_CURR='atlas_curr', K_META='atlas_meta';
  const gJ=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}};
  const sJ=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const getDaily=()=>gJ(K_DAILY,[]);
  const getCurr=()=>gJ(K_CURR,{});
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const todayISO=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};

  /* ══════════════════════════════════════════════════════════
     LA RUTA v3.0 — 4 fases · certificados en orden de dificultad
  ══════════════════════════════════════════════════════════ */
  const AYUDA='Si algo del curso no se entiende: pégale el pantallazo o el texto a Claude y pide "explícamelo con manzanas". Nunca te quedes atascado más de 10 minutos.';
  const CURR=[
  {id:'F1',icon:'📊',name:'Fase 1 · Certificado Google de Análisis de Datos',weeks:'jul → sep 2026',
   why:'100% guiado y visual (videos + clics, casi nada de código), disponible en español, valida lo que ya haces en Simetrik y es el certificado de entrada más reconocido del mercado.',
   items:[
    {id:'f1-1',t:'Cuenta Coursera + AYUDA ECONÓMICA (hoy, 20 min)',d:'La beca tarda 2-3 semanas en aprobarse — por eso es el paso 1',steps:[
      {s:'Crea tu cuenta en Coursera con tu Gmail',link:'https://www.coursera.org/professional-certificates/google-data-analytics',ln:'Coursera — Google Data Analytics'},
      {s:'En la página del certificado, clic en <b>"Ayuda económica disponible"</b> (bajo el precio) y llena la solicitud (15 min, respuestas honestas y simples).'},
      {s:'Mientras aprueban: usa la <b>prueba gratis de 7 días</b> para arrancar el Curso 1. En ajustes del curso cambia el idioma a <b>español</b>.'},
    ],check:'Solicitud de ayuda enviada y Curso 1 abierto en español.'},
    {id:'f1-2',t:'Curso 1 · Fundamentos: datos en todas partes',d:'~2 semanas a 1h/día · el más largo porque construye la base',steps:[{s:'1 hora al día: 45 min de video/lecturas + 15 min de notas en tu registro diario (abajo). '+AYUDA}],check:'Curso 1 aprobado (badge en Coursera).'},
    {id:'f1-3',t:'Curso 2 · Hacer preguntas para tomar decisiones',d:'~1 semana',steps:[{s:'Mismo ritmo. Verás que esto YA lo haces en tu trabajo — ahora le pones nombre y método.'}],check:'Curso 2 aprobado.'},
    {id:'f1-4',t:'Curso 3 · Preparar los datos para explorarlos',d:'~1 semana',steps:[{s:'Aquí empieza SQL suave (BigQuery guiado). '+AYUDA}],check:'Curso 3 aprobado.'},
    {id:'f1-5',t:'Curso 4 · Procesar los datos (limpieza)',d:'~1 semana',steps:[{s:'Limpieza de datos = el 80% del trabajo real. Conecta esto con lo que haces en Simetrik.'}],check:'Curso 4 aprobado.'},
    {id:'f1-6',t:'Curso 5 · Analizar los datos',d:'~1 semana',steps:[{s:'Hojas de cálculo + SQL para responder preguntas. Tu terreno.'}],check:'Curso 5 aprobado.'},
    {id:'f1-7',t:'Curso 6 · Compartir con visualizaciones (Tableau)',d:'~1 semana · tu lado visual brilla aquí',steps:[{s:'Tableau Public es gratis, arrastrar y soltar. Guarda tus gráficos — sirven de portafolio.'}],check:'Curso 6 aprobado y 1 visualización propia guardada.'},
    {id:'f1-8',t:'Curso 7 · Análisis con R (verlo ligero)',d:'~1 semana · sin estresarse',steps:[{s:'R es opcional en el mercado. Míralo para aprobar, sin exigirte dominarlo — tu lenguaje será Python (Fase 3).'}],check:'Curso 7 aprobado.'},
    {id:'f1-9',t:'Curso 8 · Caso práctico final → 🎓 CERTIFICADO 1',d:'~1 semana · tu primer credencial de mercado',steps:[
      {s:'El caso final se hace con calma, es tu primera pieza de portafolio.'},
      {s:'Al recibir el certificado: agrégalo a LinkedIn (Coursera tiene botón directo) y celébralo — es real.'},
    ],check:'🎓 Certificado Google Data Analytics en tu LinkedIn.'},
   ]},
  {id:'F2',icon:'📈',name:'Fase 2 · Power BI + Certificación Microsoft PL-300',weeks:'oct → nov 2026',
   why:'Power BI es la herramienta MÁS visual del mercado (arrastrar y soltar, cero código) y la más pedida en vacantes remotas de datos en LATAM. Con tu condición de estudiante CUN el examen tiene descuento.',
   items:[
    {id:'f2-1',t:'Descuento de estudiante + instalar Power BI',d:'30 min de setup',steps:[
      {s:'En tu perfil de Microsoft Learn, verifica tu condición de <b>estudiante</b> (correo CUN) — activa el descuento del examen (~50%)',link:'https://learn.microsoft.com/es-es/credentials/certifications/data-analyst-associate/',ln:'Certificación PL-300'},
      {s:'Instala <b>Power BI Desktop</b> (gratis)',link:'https://www.microsoft.com/es-es/download/details.aspx?id=58494',ln:'Descargar Power BI Desktop'},
    ],check:'Estudiante verificado y Power BI abierto en tu PC.'},
    {id:'f2-2',t:'Ruta oficial Microsoft Learn para PL-300',d:'~4 semanas · gratis y en español',steps:[
      {s:'Sigue la ruta de aprendizaje oficial "Preparación para el examen PL-300" módulo por módulo (es interactiva, con laboratorios guiados)',link:'https://learn.microsoft.com/es-es/credentials/certifications/data-analyst-associate/',ln:'Ruta PL-300 en MS Learn'},
      {s:AYUDA},
    ],check:'Ruta de MS Learn completada (todos los módulos con check verde).'},
    {id:'f2-3',t:'Proyecto: dashboard con TUS datos reales',d:'~1 semana · con Claude como copiloto',steps:[
      {s:'Exporta tus datos de finanzas personales (módulo 12-FIN) y construye un dashboard real: gastos por mes, categorías, tendencias.'},
      {s:'Claude te guía pantalla por pantalla. Este dashboard va al portafolio (repo atlas-portfolio).'},
    ],check:'Dashboard funcionando con datos tuyos + screenshot en el repo.'},
    {id:'f2-4',t:'Simulacros del examen',d:'~1 semana',steps:[
      {s:'Microsoft ofrece <b>Practice Assessment</b> gratis del PL-300 — hazlo hasta pasar con 85%+',link:'https://learn.microsoft.com/es-es/credentials/certifications/practice-assessments-for-microsoft-certifications',ln:'Practice Assessments'},
      {s:'Las preguntas que falles: me las pegas y las destripamos juntos.'},
    ],check:'Simulacro en 85%+ dos veces seguidas.'},
    {id:'f2-5',t:'Examen PL-300 → 🎓 CERTIFICADO 2 (Microsoft oficial)',d:'1 día · ~USD $80-100 con descuento',steps:[
      {s:'Agenda el examen online (con supervisión remota) o en centro Pearson VUE. Con el descuento de estudiante aplicado.'},
      {s:'Al aprobar: LinkedIn + <b>empezar a aplicar a vacantes remotas junior</b> de Data Analyst/BI desde tu módulo 5-JOB. Este certificado ya abre puertas reales.'},
    ],check:'🎓 Microsoft Certified: Power BI Data Analyst Associate. Aplicando a vacantes.'},
   ]},
  {id:'F3',icon:'🐍',name:'Fase 3 · Python sin dolor (Kaggle Learn)',weeks:'dic 2026 → ene 2027',
   why:'Kaggle es gratis, corre en el navegador (cero instalación, cero terminal), lecciones cortas y ves el resultado de tu código AL INSTANTE — hecho para aprendices visuales. Aquí el código entra, y entra suave.',
   items:[
    {id:'f3-1',t:'Kaggle · Intro to Programming',d:'~5 horas',steps:[{s:'Crea cuenta en Kaggle y arranca. Cada lección: lees 10 min, practicas 20 en el mismo navegador.',link:'https://www.kaggle.com/learn/intro-to-programming',ln:'Kaggle — Intro to Programming'}],check:'Mini-certificado de Kaggle obtenido.'},
    {id:'f3-2',t:'Kaggle · Python',d:'~5 horas',steps:[{s:'El curso central. '+AYUDA,link:'https://www.kaggle.com/learn/python',ln:'Kaggle — Python'}],check:'Mini-certificado obtenido.'},
    {id:'f3-3',t:'Kaggle · Pandas',d:'~4 horas · tablas de datos con código',steps:[{s:'Pandas = Excel con superpoderes. Todo lo que sabes de hojas de cálculo se traduce aquí.',link:'https://www.kaggle.com/learn/pandas',ln:'Kaggle — Pandas'}],check:'Mini-certificado obtenido.'},
    {id:'f3-4',t:'Kaggle · Data Visualization',d:'~4 horas',steps:[{s:'Gráficos con código. Tu cierre perfecto: visual + Python juntos.',link:'https://www.kaggle.com/learn/data-visualization',ln:'Kaggle — Data Visualization'}],check:'Mini-certificado obtenido.'},
    {id:'f3-5',t:'Mini-proyecto con Claude: analiza TUS datos',d:'~1 semana · el examen final real',steps:[
      {s:'Con Claude: un análisis de tus datos reales (finanzas, hábitos del 9-GOA, lo que quieras) en un notebook de Kaggle — de la pregunta al gráfico.'},
      {s:'Publícalo en Kaggle + súbelo al repo atlas-portfolio con README.'},
    ],check:'Notebook público con un análisis tuyo de punta a punta. Ya programas en Python.'},
   ]},
  {id:'F4',icon:'🤖',name:'Fase 4 · Inteligencia Artificial Aplicada',weeks:'2027 · se desbloquea al llegar',
   why:'La meta original de ATLAS no se canceló — se pospuso hasta tener piso. Con 2 certificados + Python básico: agentes, RAG y automatización con salida real a ingresos. El detalle lo diseñamos al cerrar la Fase 3 (la v2.0 archivada es la referencia).',
   items:[
    {id:'f4-1',t:'Google AI Essentials (certificado corto, puente)',d:'~8 horas',steps:[{s:'Certificado rápido de Google sobre uso profesional de IA. Calentamiento de la fase.',link:'https://www.coursera.org/professional-certificates/google-ai-essentials',ln:'Google AI Essentials'}],check:'🎓 Certificado obtenido.'},
    {id:'f4-2',t:'Automatización visual con n8n (L1 + L2)',d:'~3 semanas · cajas y flechas, no código',steps:[{s:'Cursos oficiales gratis con badge',link:'https://docs.n8n.io/courses/',ln:'n8n Courses'}],check:'Badges L1+L2 y tus primeros workflows reales.'},
    {id:'f4-3',t:'Agentes de IA + RAG → proyecto de portafolio',d:'~6 semanas · aquí vuelve lo mejor de la v2.0',steps:[
      {s:'Curso de agentes de Hugging Face (gratis, con certificado)',link:'https://huggingface.co/learn/agents-course',ln:'HF Agents Course'},
      {s:'Proyecto estrella con Claude: "chatea con tus documentos" (RAG) — demo pública para vender o para entrevistas.'},
    ],check:'🎓 Certificado HF + demo pública funcionando. Bienvenido a la ingeniería de IA.'},
   ]},
  ];

  /* ══════════════════════════════════════════════════════════
     CERTIFICACIONES v3 — los hitos de la ruta (en orden)
  ══════════════════════════════════════════════════════════ */
  const CERTS=[
    {id:'c-gda',t:'Google Data Analytics Professional Certificate',tag:'BECA / $49 mes',when:'F1',link:'https://www.coursera.org/professional-certificates/google-data-analytics',d:'El certificado de entrada al mercado de datos. Ayuda económica de Coursera disponible (solicitar el día 1).'},
    {id:'c-pl300',t:'Microsoft PL-300 · Power BI Data Analyst Associate',tag:'~$80 estudiante',when:'F2',link:'https://learn.microsoft.com/es-es/credentials/certifications/data-analyst-associate/',d:'Certificación oficial Microsoft. La más pedida en vacantes BI remotas LATAM. Descuento verificando estudiante CUN.'},
    {id:'c-kaggle',t:'Kaggle Learn · 4 mini-certificados de Python',tag:'GRATIS',when:'F3',link:'https://www.kaggle.com/learn',d:'Intro to Programming, Python, Pandas y Data Visualization — en el navegador, resultado inmediato.'},
    {id:'c-aie',t:'Google AI Essentials',tag:'BECA / pago',when:'F4',link:'https://www.coursera.org/professional-certificates/google-ai-essentials',d:'Puente corto hacia la fase de IA.'},
    {id:'c-n8n',t:'n8n · Level 1 + Level 2 (badges oficiales)',tag:'GRATIS',when:'F4',link:'https://docs.n8n.io/courses/',d:'Automatización visual — la credencial del servicio vendible a PYMEs.'},
    {id:'c-hf',t:'Hugging Face · AI Agents Course',tag:'GRATIS',when:'F4',link:'https://huggingface.co/learn/agents-course',d:'Certificado de agentes del hub de IA más famoso del mundo.'},
    {id:'c-efset',t:'EF SET English Certificate (50 min)',tag:'GRATIS',when:'cuando quieras',link:'https://www.efset.org/',d:'Certificado de inglés gratis y linkeable. Tómalo 2 veces (antes/después) para VER tu progreso.'},
  ];

  /* ══════════════════════════════════════════════════════════
     PROMPTS v3 — continuidad multi-IA
  ══════════════════════════════════════════════════════════ */
  const P_CLAUDE=[
'ERES: el acompanante de estudio del PROYECTO ATLAS v3.0 de Miguel Angel Barros (Colombia, Ing. de Sistemas CUN, analista en Simetrik, aprendiz VISUAL, 1 h/dia).',
'',
'EL PROYECTO (v3.0 — camino de certificados, en orden): F1 Google Data Analytics (Coursera, jul-sep 2026) -> F2 Power BI + examen PL-300 (oct-nov) -> F3 Python en Kaggle Learn (dic-ene) -> F4 IA Aplicada (2027: n8n, agentes, RAG). Una sola cosa a la vez; los cursos ya estan hechos por Google/Microsoft/Kaggle — tu NO dictas lecciones.',
'',
'TU TRABAJO REAL:',
'1. DESBLOQUEAR: cuando Miguel pegue un pantallazo o texto de un curso que no entiende, explicaselo CON MANZANAS: analogias simples, tablas, ejemplos con SUS datos (finanzas, conciliaciones de Simetrik, notas de la CUN). Es aprendiz visual: diagramas y ejemplos concretos antes que definiciones abstractas.',
'2. CONSTANCIA: preguntale por su racha y su registro diario. Si lleva dias sin estudiar, sin regano: ayudale a retomar con la accion mas pequena posible (20 min cuentan).',
'3. PROYECTOS (F2 en adelante): el dashboard de Power BI y el mini-proyecto de Kaggle se hacen JUNTOS, tu como copiloto paso a paso, siempre de lo visual hacia el codigo.',
'4. NO AGREGAR CURSOS NI CAMBIAR EL PLAN: si Miguel propone algo nuevo, anotalo como "idea aparcada" para la revision dominical. Anti-dispersion es sagrado.',
'',
'REGLAS: espanol siempre. Nunca respondas "eso lo veras mas adelante" — desbloquea la duda YA con lo minimo necesario. No inventes links ni contenido de cursos. Honestidad carinosa: si algo no lo domina, dilo y repasenlo distinto. Cierra cada sesion con 1 linea para su bitacora.',
  ].join('\n');

  const P_GEMINI=[
'ERES: la investigadora, bibliotecaria y coach de ingles del PROYECTO ATLAS v3.0 de Miguel Angel Barros (Colombia, hispanohablante, aprendiz visual, 1 h/dia).',
'',
'EL PROYECTO: camino de certificados en orden: F1 Google Data Analytics -> F2 Power BI PL-300 -> F3 Python Kaggle -> F4 IA Aplicada (2027). Su acompanante de estudio es Claude; tu rol es complementario.',
'',
'TUS FUNCIONES:',
'1. BIBLIOTECA: resumenes visuales de lo que estudio en la semana (tablas, esquemas), tarjetas de repaso y quizzes cortos.',
'2. INGLES (10-20 min, opcional pero valioso): mini-sesion hablada — el explica en ingles lo que estudio hoy, tu corriges con carino; 5 palabras tecnicas de datos; sube dificultad gradual.',
'3. INVESTIGACION: cuando pida "investiga X" — vacantes remotas junior LATAM de Data Analyst/BI, salarios, que piden. Con fuentes.',
'4. MARKETING (F2+): posts de LinkedIn mostrando certificados y dashboards (ES/EN).',
'',
'PROTOCOLO: si pega un bloque "ESTADO PROYECTO ATLAS", usalo como contexto. Espanol salvo la sesion de ingles. No inventes fuentes.',
  ].join('\n');

  const P_DIARIO=[
'Hola. Sesion de estudio ATLAS v3.0.',
'',
'[PEGA AQUI TU ESTADO — boton "Copiar Estado" en da-2026 > Ruta > ATLAS]',
'',
'Hoy estudie/voy a estudiar: ___ (curso y leccion).',
'Me atasque en / no entendi: ___ (pega pantallazo o texto si tienes).',
'Tiempo disponible: ___ minutos.',
'',
'Explicame lo que no entendi con manzanas (soy visual: analogias, tablas, ejemplos con mis datos). Si no me atasque, hazme 3 preguntas de repaso de lo de hoy y dame la linea para mi bitacora.',
  ].join('\n');

  const P_DOMINGO=[
'Revision dominical ATLAS v3.0 (20 min). Modo: director de proyecto, honesto y practico.',
'',
'[PEGA AQUI TU ESTADO — boton "Copiar Estado"]',
'',
'Revisa conmigo:',
'1. Racha y dias estudiados esta semana (la meta es 5+ de 7, con 20 min ya cuenta).',
'2. Donde voy en la fase actual vs el calendario del plan. Atrasado? Por que, sin excusas blandas.',
'3. Que UNA cosa ajustamos la proxima semana.',
'4. Ideas aparcadas: cuales mueren hoy y cuales esperan a su fase.',
'5. Cierra con 1 linea para la bitacora.',
  ].join('\n');

  const P_RESCATE=[
'CONTEXTO DE EMERGENCIA — Continuidad del PROYECTO ATLAS v3.0.',
'',
'Soy Miguel Angel Barros (Colombia, Ing. de Sistemas CUN, analista en Simetrik, aprendiz VISUAL). Mi plan es el "camino de los certificados": F1 Google Data Analytics (Coursera, jul-sep 2026) -> F2 Power BI + examen PL-300 con descuento estudiante (oct-nov) -> F3 Python en Kaggle Learn (dic-ene) -> F4 IA Aplicada (2027: n8n, agentes, RAG — mi meta de fondo). Reglas: una sola cosa a la vez, 1 h/dia (20 min cuentan), cero dias de cero, ideas nuevas se aparcan para el domingo. Claude me desbloquea dudas con explicaciones visuales; Gemini investiga y entrena mi ingles. Plan visual completo: E:\\CLAUDE\\My Project\\PLAN_MAESTRO.html y el hub ATLAS en mi web da-2026 (Ruta).',
'',
'Mi estado actual es:',
'[PEGA AQUI TU ESTADO — boton "Copiar Estado"]',
'',
'Asume tu rol y continuemos exactamente donde iba. No me hagas re-explicar el proyecto.',
  ].join('\n');

  const PROMPTS={pclaude:P_CLAUDE,pgemini:P_GEMINI,pdiario:P_DIARIO,pdomingo:P_DOMINGO,prescate:P_RESCATE};

  /* ══════════════════════════════════════════════════════════
     ESTADO COPIABLE
  ══════════════════════════════════════════════════════════ */
  function streak(){
    const days=new Set(getDaily().filter(e=>e.est||e.con||e.eng).map(e=>e.d));
    let n=0;const d=new Date();
    const iso=x=>x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');
    if(!days.has(iso(d)))d.setDate(d.getDate()-1); // hoy aún no registrado no rompe racha
    while(days.has(iso(d))){n++;d.setDate(d.getDate()-1)}
    return n;
  }
  function currStats(){
    const c=getCurr();let t=0,dn=0;
    CURR.forEach(m=>m.items.forEach(i=>{t++;if(c[i.id])dn++}));
    return{t,dn,pct:t?Math.round(dn/t*100):0};
  }
  function certStats(){
    const c=getCurr();let dn=0;CERTS.forEach(x=>{if(c[x.id])dn++});
    return{t:CERTS.length,dn};
  }
  function currentFase(){
    const c=getCurr();
    for(let i=0;i<CURR.length;i++){if(CURR[i].items.some(x=>!c[x.id]))return{m:CURR[i],n:i+1};}
    return{m:CURR[CURR.length-1],n:CURR.length};
  }
  function nextItem(){
    const c=getCurr();
    for(const m of CURR){for(const i of m.items){if(!c[i.id])return{fase:m,item:i};}}
    return null;
  }
  function buildEstado(){
    const cs=currStats(),ce=certStats(),cf=currentFase(),nx=nextItem();
    const last7=getDaily().slice(-7).map(e=>e.d.slice(5)+' ['+(e.est?'E':'-')+(e.con?'N':'-')+(e.eng?'I':'-')+']').join(' · ')||'(sin registros aún)';
    const lastNote=(getDaily().slice(-1)[0]||{}).note||'—';
    return ['=== ESTADO PROYECTO ATLAS v3.0 · '+todayISO()+' ===',
      'Ruta: F1 Google Data Analytics → F2 Power BI PL-300 → F3 Python Kaggle → F4 IA Aplicada',
      'Fase actual: '+cf.n+'/4 ('+cf.m.name.split('·')[1].trim()+') · Pasos: '+cs.dn+'/'+cs.t+' ('+cs.pct+'%) · Certificados: '+ce.dn+'/'+ce.t,
      'Racha de estudio: '+streak()+(streak()===1?' día':' días'),
      'Últimos 7 días [E=estudio N=notas I=inglés]: '+last7,
      'Última nota de bitácora: "'+lastNote+'"',
      'QUÉ TOCA AHORA: '+(nx?nx.fase.icon+' '+nx.item.t:'🎓 Ruta completa — diseñar Fase 4 en detalle'),
      '=== FIN ESTADO ==='].join('\n');
  }

  /* ── Copy helpers ── */
  function doCopy(text,btn){
    const ok=()=>{if(btn){const o=btn.textContent;btn.textContent='✅ Copiado';setTimeout(()=>btn.textContent=o,1600)}};
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(ok).catch(()=>fallback())}
    else fallback();
    function fallback(){const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);ok();}
  }
  function copyPrompt(key,btn){doCopy(PROMPTS[key],btn)}
  function copyEstado(btn){doCopy(buildEstado(),btn)}

  /* ── Google Calendar link (domingo recurrente) ── */
  function calLink(){
    const d=new Date();d.setDate(d.getDate()+((7-d.getDay())%7));
    const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),dd=String(d.getDate()).padStart(2,'0');
    return 'https://calendar.google.com/calendar/render?action=TEMPLATE'+
      '&text='+encodeURIComponent('🚀 ATLAS · Revisión Dominical (20 min)')+
      '&dates='+y+m+dd+'T140000/'+y+m+dd+'T142000'+
      '&recur='+encodeURIComponent('RRULE:FREQ=WEEKLY;BYDAY=SU')+
      '&details='+encodeURIComponent('1) Abrir da-2026 → Ruta → ATLAS → botón Copiar Estado.\n2) Claude → pegar Prompt Dominical + Estado.\n3) Guardar la línea en la bitácora.');
  }

  /* ══════════════════════════════════════════════════════════
     DAILY TRACKER
  ══════════════════════════════════════════════════════════ */
  function saveDay(){
    const est=document.getElementById('atEst').checked,
          con=document.getElementById('atCon').checked,
          eng=document.getElementById('atEng').checked,
          note=document.getElementById('atNote').value.trim();
    if(!est&&!con&&!eng&&!note)return;
    const list=getDaily(),d=todayISO(),ix=list.findIndex(e=>e.d===d);
    const entry={d,est,con,eng,note,fase:currentFase().n};
    if(ix>=0)list[ix]=entry;else list.push(entry);
    sJ(K_DAILY,list);
    document.getElementById('atNote').value='';
    renderDaily();renderHeader();
  }
  function loadToday(){
    const e=getDaily().find(x=>x.d===todayISO());
    if(!e)return;
    document.getElementById('atEst').checked=!!e.est;
    document.getElementById('atCon').checked=!!e.con;
    document.getElementById('atEng').checked=!!e.eng;
  }
  function renderDaily(){
    const box=document.getElementById('atDailyList');if(!box)return;
    box.innerHTML=getDaily().slice(-14).reverse().map(e=>
      '<div class="rt-log-e"><div class="rt-log-d">'+esc(e.d)+' · '+(e.fase?('F'+e.fase):('sem '+(e.week||'?')))+' · '+
      (e.est?'📖':'·')+(e.con?'📝':'·')+(e.eng?'🇺🇸':'·')+'</div>'+esc(e.note||'(sin nota)')+'</div>').join('')||'<div style="font-size:12px;color:var(--t3)">Aún no hay registros. Hoy es un gran día para el primero.</div>';
  }

  /* ── Curriculum / cert toggles ── */
  function togItem(id,el){
    const c=getCurr();c[id]=!c[id];sJ(K_CURR,c);
    el.classList.toggle('done',!!c[id]);el.textContent=c[id]?'✓':'';
    const title=el.parentElement.querySelector('.rt-les-title');if(title)title.classList.toggle('struck',!!c[id]);
    renderHeader();
  }

  /* ══════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════ */
  function renderHeader(){
    const cs=currStats(),cf=currentFase(),nx=nextItem();
    const el=document.getElementById('atHead');if(!el)return;
    el.innerHTML=
      '<div class="at-hoy"><div class="at-hoy-tag">▶ QUÉ TOCA HOY</div>'+
      '<div class="at-hoy-acc">'+(nx?esc(nx.item.t):'🎉 ¡Ruta completa!')+'</div>'+
      (nx?'<div class="at-hoy-fase">'+nx.fase.icon+' '+esc(nx.fase.name)+' · '+esc(nx.fase.weeks)+'</div>':'')+'</div>'+
      '<div class="at-kpis">'+
      '<div class="at-kpi"><div class="at-kv">Fase '+cf.n+'/4</div><div class="at-kl">de la ruta</div></div>'+
      '<div class="at-kpi"><div class="at-kv">🔥 '+streak()+'</div><div class="at-kl">racha días</div></div>'+
      '<div class="at-kpi"><div class="at-kv">'+cs.dn+'/'+cs.t+'</div><div class="at-kl">pasos</div></div>'+
      '<div class="at-kpi"><div class="at-kv">'+certStats().dn+'/'+certStats().t+'</div><div class="at-kl">certificados</div></div>'+
      '</div>'+
      '<div class="rt-bar" style="margin:10px 0 4px"><div class="rt-bar-fill" style="width:'+cs.pct+'%"></div></div>';
  }

  function lesHTML(item){
    const ok=!!getCurr()[item.id];
    let h='<div class="rt-les"><div class="rt-les-head" onclick="togLesson(this)">'+
      '<div class="rt-chk'+(ok?' done':'')+'" onclick="ATLAS.togItem(\''+item.id+'\',this);event.stopPropagation()">'+(ok?'✓':'')+'</div>'+
      '<div class="rt-les-info"><div class="rt-les-title'+(ok?' struck':'')+'">'+item.t+'</div><div class="rt-les-brief">'+item.d+'</div></div>'+
      '<div class="rt-les-arrow">▼</div></div><div class="rt-les-body"><div class="rt-les-content">';
    (item.steps||[]).forEach((g,gi)=>{
      h+='<div class="rt-step"><div class="rt-step-n">'+(gi+1)+'</div><div class="rt-step-body">'+g.s+
         (g.link?'<br><a href="'+g.link+'" target="_blank" rel="noopener">🔗 '+g.ln+'</a>':'')+'</div></div>';
    });
    if(item.check)h+='<div class="rt-checkpoint"><b>✅ Lo lograste cuando:</b>'+item.check+'</div>';
    return h+'</div></div></div>';
  }

  function promptCard(title,desc,key,extra){
    return '<div class="at-prompt"><div class="at-pr-head"><div><b>'+title+'</b><div style="font-size:11px;color:var(--t2)">'+desc+'</div></div>'+
      '<button class="rt-pbtn rt-next" style="font-size:11px;padding:6px 12px;flex-shrink:0" onclick="ATLAS.copyPrompt(\''+key+'\',this)">📋 Copiar</button></div>'+
      (extra||'')+'<pre class="at-pre">'+esc(PROMPTS[key])+'</pre></div>';
  }

  function render(){
    const stub=document.getElementById('atlasStub');if(!stub)return;

    /* styles */
    if(!document.getElementById('atlasCSS')){
      const st=document.createElement('style');st.id='atlasCSS';st.textContent=`
.at-hero{background:linear-gradient(135deg,rgba(34,197,94,.06),rgba(139,92,246,.05));border:1px solid rgba(34,197,94,.2);border-radius:12px;padding:18px 20px;margin-bottom:14px}
.at-hero h2{font-family:'Newsreader',serif;font-size:20px;margin-bottom:4px}
.at-hero p{font-size:12px;color:var(--t2)}
.at-hoy{background:linear-gradient(135deg,rgba(239,68,68,.12),rgba(139,92,246,.06));border:2px solid rgba(239,68,68,.45);border-radius:12px;padding:14px 16px;margin-top:12px;text-align:center}
.at-hoy-tag{font-size:10px;font-weight:800;letter-spacing:2px;color:#ef4444}
.at-hoy-acc{font-size:16px;font-weight:700;margin:6px 0 2px}
.at-hoy-fase{font-size:11px;color:var(--t3)}
.at-kpis{display:flex;gap:1px;background:var(--bd);border-radius:8px;overflow:hidden;margin-top:12px}
.at-kpi{flex:1;background:var(--c1);padding:8px;text-align:center}
.at-kv{font-family:'IBM Plex Mono',monospace;font-size:15px;font-weight:600;color:var(--gn)}
.at-kl{font-size:9px;color:var(--t3);text-transform:uppercase;letter-spacing:.5px}
.at-sec{background:var(--c1);border:1px solid var(--bd);border-radius:10px;margin-bottom:8px;overflow:hidden}
.at-sec-head{display:flex;align-items:center;gap:10px;padding:13px 16px;cursor:pointer}
.at-sec-head:hover{background:rgba(255,255,255,.02)}
.at-sec-head b{flex:1;font-size:13px}
.at-sec-head .rt-les-arrow{font-size:12px}
.at-sec.open .rt-les-arrow{transform:rotate(180deg)}
.at-sec-body{display:none;padding:4px 16px 16px;border-top:1px solid var(--bd)}
.at-sec.open .at-sec-body{display:block}
.at-fase-why{background:var(--el);border-left:3px solid var(--gn);border-radius:6px;padding:9px 12px;font-size:12px;color:var(--t2);margin:10px 0}
.at-prompt{background:var(--el);border:1px solid var(--bd);border-radius:9px;padding:12px 14px;margin:10px 0}
.at-pr-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:8px}
.at-pre{background:#07090d;border:1px solid var(--bd);border-radius:7px;padding:10px 12px;font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:var(--t2);white-space:pre-wrap;max-height:180px;overflow-y:auto;margin-top:8px}
.at-chkrow{display:flex;gap:14px;flex-wrap:wrap;margin:10px 0}
.at-chkrow label{display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;background:var(--el);border:1px solid var(--bd);border-radius:8px;padding:8px 14px}
.at-chkrow input{accent-color:var(--gn);width:16px;height:16px}
.at-estado{position:sticky;bottom:12px;z-index:40;display:flex;justify-content:flex-end;margin-top:10px}
.at-estado button{box-shadow:0 4px 20px rgba(0,0,0,.5)}
.at-step-mini{font-size:12px;line-height:1.7;color:var(--t2);margin:8px 0}
.at-step-mini b{color:var(--tx)}
.at-hack{background:linear-gradient(135deg,rgba(234,179,8,.05),transparent);border:1px solid rgba(234,179,8,.15);border-radius:9px;padding:11px 14px;margin:8px 0;font-size:12px;color:var(--t2)}
.at-hack b{color:var(--am);display:block;margin-bottom:2px}
.at-cert-tag{font-size:9px;font-weight:700;padding:2px 7px;border-radius:4px;background:var(--gg);color:var(--gn);flex-shrink:0}
.at-cert-tag.pay{background:rgba(234,179,8,.1);color:var(--am)}`;
      document.head.appendChild(st);
    }

    const sec=(id,icon,title,body,open)=>'<div class="at-sec'+(open?' open':'')+'" id="'+id+'"><div class="at-sec-head" onclick="this.parentElement.classList.toggle(\'open\')"><span>'+icon+'</span><b>'+title+'</b><div class="rt-les-arrow">▼</div></div><div class="at-sec-body">'+body+'</div></div>';

    let h='<div class="at-hero"><h2>🚀 Proyecto ATLAS v3.0 — <em style="color:var(--gn)">El Camino de los Certificados</em></h2>'+
      '<p>Cert-first · visual · <b>una sola cosa a la vez</b> · 1 h/día (20 min cuentan) · F1 Google Data Analytics → F2 Power BI PL-300 → F3 Python Kaggle → F4 IA Aplicada. Las 3 reglas: el recuadro rojo dice qué toca; cero días de cero; si te pierdes, pégale el pantallazo a Claude — jamás abandones en silencio.</p>'+
      '<div id="atHead"></div></div>';

    /* ── 1 · LA RUTA ── */
    let cur='';
    CURR.forEach(m=>{
      cur+='<div class="rt-label" style="margin-top:14px">'+m.icon+' '+m.name+' · <span style="color:var(--gn)">'+m.weeks+'</span></div>'+
        '<div class="at-fase-why"><b>Por qué:</b> '+m.why+'</div>';
      m.items.forEach(i=>cur+=lesHTML(i));
    });
    h+=sec('atCur','🗺️','La Ruta — marca cada paso conquistado (se guarda y sincroniza)',
      '<div style="font-size:12px;color:var(--t2);margin:8px 0">Click en cada paso para ver el detalle con links. El círculo marca completado — alimenta el recuadro "QUÉ TOCA HOY", tu % y el Estado copiable.</div>'+cur,true);

    /* ── 2 · CERTIFICADOS ── */
    let cert='';
    CERTS.forEach(x=>{
      const ok=!!getCurr()[x.id];
      cert+='<div class="rt-les"><div class="rt-les-head" style="cursor:default">'+
        '<div class="rt-chk'+(ok?' done':'')+'" onclick="ATLAS.togItem(\''+x.id+'\',this)" style="cursor:pointer">'+(ok?'✓':'')+'</div>'+
        '<div class="rt-les-info"><div class="rt-les-title'+(ok?' struck':'')+'">'+x.t+'</div><div class="rt-les-brief">'+x.d+'</div></div>'+
        '<span class="at-cert-tag'+(x.tag.includes('$')?' pay':'')+'">'+x.tag+'</span>'+
        '<span style="font-size:10px;color:var(--t3);flex-shrink:0">'+x.when+'</span>'+
        '<a href="'+x.link+'" target="_blank" rel="noopener" style="font-size:11px;color:var(--a2);flex-shrink:0">🔗 Abrir</a></div></div>';
    });
    h+=sec('atCert','🏅','Los certificados de la ruta — tus hitos de mercado',
      '<div style="font-size:12px;color:var(--t2);margin:8px 0">Cada fase termina en credencial real para LinkedIn. Regla: no se compra ni se agenda nada de una fase futura — el dinero y la energía van a la fase ACTUAL.</div>'+cert);

    /* ── 3 · RUTA DIARIA ── */
    h+=sec('atDay','📆','Ruta diaria — registra tu día (se guarda y sincroniza)',
      '<div style="font-size:12px;color:var(--t2);margin:8px 0">Marca lo que cumpliste HOY + nota de 1 línea. Alimenta tu racha y el Estado copiable. La hora ideal: la misma todos los días.</div>'+
      '<div class="at-chkrow">'+
      '<label><input type="checkbox" id="atEst"> 📖 Curso (45 min)</label>'+
      '<label><input type="checkbox" id="atCon"> 📝 Notas / práctica (15 min)</label>'+
      '<label><input type="checkbox" id="atEng"> 🇺🇸 Inglés (opcional)</label>'+
      '</div>'+
      '<textarea class="rt-log-area" id="atNote" placeholder="¿Qué viste hoy en el curso? ¿Qué no entendiste? (1-3 líneas)"></textarea>'+
      '<div style="margin-top:8px"><button class="rt-pbtn rt-next" onclick="ATLAS.saveDay()" style="font-size:11px;padding:7px 14px">💾 Guardar día</button>'+
      '<span style="font-size:11px;color:var(--t3);margin-left:10px">Día mínimo viable: 20 min + nota. Cero días de cero.</span></div>'+
      '<div id="atDailyList" style="margin-top:12px"></div>');

    /* ── 4 · CLAUDE COMO DESBLOQUEADOR ── */
    h+=sec('atSetC','🤖','Claude: tu desbloqueador de dudas (setup una sola vez)',
      '<div class="at-step-mini"><b>A. Crear el Project (claude.ai):</b><br>'+
      '1. Entra a <a href="https://claude.ai/projects" target="_blank" rel="noopener">claude.ai/projects</a> → <b>"+ New project"</b> → nómbralo <b>PROYECTO ATLAS</b>.<br>'+
      '2. En <b>"Set custom instructions"</b> pega el <b>Prompt Maestro Claude</b> (abajo) → guarda.<br>'+
      '3. En <b>"Project knowledge"</b> sube PLAN_MAESTRO.html y BITACORA.md (E:\\CLAUDE\\My Project). Re-sube la bitácora los domingos.<br>'+
      '4. <b>El uso real del día a día:</b> algo del curso no se entiende → pantallazo → pegarlo en un chat del Project → "explícamelo con manzanas". Eso es todo. Sin ceremonia.</div>'+
      promptCard('Prompt Maestro Claude','Custom Instructions del Project — define su rol de acompañante visual','pclaude')+
      promptCard('Prompt Diario (para dudas o repaso)','Chat nuevo dentro del Project cuando estudies','pdiario'));

    /* ── 5 · GEMINI ── */
    h+=sec('atSetG','💎','Gemini: biblioteca, inglés e investigación (setup una sola vez)',
      '<div class="at-step-mini">1. <a href="https://gemini.google.com" target="_blank" rel="noopener">gemini.google.com</a> → "Explorar Gems" → "+ Nueva Gem" → nombre <b>ATLAS · Mentor</b> → pega el prompt de abajo en Instrucciones → guarda.<br>'+
      '2. <b>NotebookLM</b> (<a href="https://notebooklm.google.com" target="_blank" rel="noopener">notebooklm.google.com</a>): crea el notebook "ATLAS" y sube tus apuntes semanales — genera resúmenes de AUDIO para repasar caminando (oro para memoria visual/auditiva).<br>'+
      '3. <b>Gemini Live (voz):</b> cuando quieras practicar inglés hablado (opcional en F1, valioso desde F2).</div>'+
      promptCard('Prompt Maestro Gemini','Instrucciones de la Gem','pgemini'));

    /* ── 6 · DOMINGO ── */
    h+=sec('atSun','🗓️','El Domingo (20 min) — la revisión que mantiene todo vivo',
      '<div class="at-step-mini">1. Botón <b>Copiar Estado ATLAS</b> (flotante, abajo) → Claude → Project ATLAS → pega <b>Prompt Dominical + Estado</b>.<br>'+
      '2. Guarda la línea de cierre en tu registro diario.<br>'+
      '3. Re-sube BITACORA.md al Project knowledge (memoria de largo plazo de la IA).</div>'+
      '<a class="rt-pbtn rt-next" style="text-decoration:none;display:inline-flex;margin-top:6px" href="'+calLink()+'" target="_blank" rel="noopener">📅 Crear recordatorio dominical en Google Calendar</a>'+
      promptCard('Prompt Dominical','Domingos, 20 min','pdomingo')+
      promptCard('Prompt de Rescate','Si la IA "no recuerda" o estrenas modelo: contexto completo en un pegado','prescate')+
      '<div class="at-hack"><b>🧠 Por qué eres inmune a cambios de modelo</b>La memoria del proyecto no vive en ninguna IA: vive en esta página (estado sincronizado), tu bitácora (historia) y tus certificados (evidencia). Cualquier IA, cualquier día: Prompt de Rescate + Estado y sigues como si nada.</div>');

    /* ── 7 · HACKS v3 ── */
    h+=sec('atHk','⚡','Trucos del oficio (v3 — para aprendiz visual)',
      '<div class="at-hack"><b>1 · La regla del pantallazo</b>Atascado más de 10 minutos = pantallazo a Claude. No es trampa: es cómo estudia la gente que avanza. El curso da la estructura; Claude da la explicación a TU medida.</div>'+
      '<div class="at-hack"><b>2 · Conecta todo con tus datos</b>Cada concepto nuevo, pregúntate: "¿cómo se ve esto en mis finanzas / en Simetrik / en mis notas de la CUN?". Un concepto anclado a TU vida no se olvida.</div>'+
      '<div class="at-hack"><b>3 · El registro diario ES el método</b>La nota de 1 línea al final de cada sesión (qué vi, qué no entendí) vale más que 2 horas extra de video. Obliga al cerebro a cerrar el archivo del día.</div>'+
      '<div class="at-hack"><b>4 · Certificado terminado = LinkedIn el mismo día</b>No los acumules en silencio. Cada credencial publicada te acerca reclutadores mientras duermes (y Gemini te redacta el post en 2 min).</div>'+
      '<div class="at-hack"><b>5 · NotebookLM con TUS apuntes</b>Domingos: sube tus notas de la semana y pide el resumen de audio. Escuchar tu propia semana narrada consolida memoria de largo plazo gratis.</div>');

    /* ── Botón estado flotante ── */
    h+='<div class="at-estado"><button class="rt-pbtn rt-next" style="font-size:12px;padding:10px 18px" onclick="ATLAS.copyEstado(this)">📋 Copiar Estado ATLAS</button></div>';

    stub.innerHTML=h;
    renderHeader();renderDaily();loadToday();
  }

  document.addEventListener('DOMContentLoaded',render);
  if(document.readyState!=='loading')render();

  return{render,saveDay,togItem,copyPrompt,copyEstado,buildEstado};
})();
