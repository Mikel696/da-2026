/* ════════════════════════════════════════════════════════════════
   4-RUT · PROYECTO ATLAS v3.1 — IA desde el Día 1
   Cert-first · visual · 1h/día · una sola cosa a la vez.
   F1 Google AI Essentials → F2 n8n (automatización visual) →
   F3 Python Kaggle → F4 Agentes + RAG (Hugging Face).
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
     LA RUTA v3.1 — IA desde el día 1 · 4 fases · certificados
  ══════════════════════════════════════════════════════════ */
  const AYUDA='Si algo del curso no se entiende: pégale el pantallazo o el texto a Claude y pide "explícamelo con manzanas". Nunca te quedes atascado más de 10 minutos.';
  const CURR=[
  {id:'F1',icon:'✨',name:'Fase 1 · Google AI Essentials — tu primer certificado de IA',weeks:'jul 2026 · ~2-3 semanas',
   why:'Empiezas EN IA desde el día 1: qué es, cómo usarla bien y el arte del prompting. 100% videos y práctica guiada, en español, CERO código, ~10 horas totales. Certificado de Google en tu LinkedIn en semanas, no meses.',
   items:[
    {id:'a1-1',t:'Cuenta Coursera + AYUDA ECONÓMICA (hoy, 20 min)',d:'La beca tarda 2-3 semanas en aprobarse — por eso es el paso 1',steps:[
      {s:'Crea tu cuenta en Coursera con tu Gmail',link:'https://www.coursera.org/specializations/ai-essentials-google',ln:'Coursera — Google AI Essentials'},
      {s:'Clic en <b>"Ayuda económica disponible"</b> (bajo el precio) y llena la solicitud (15 min, honesto y simple).'},
      {s:'Mientras aprueban: usa la <b>prueba gratis de 7 días</b> — con ~1h/día puedes terminar el certificado ANTES de pagar un solo peso. En ajustes cambia el idioma a <b>español</b>.'},
    ],check:'Solicitud de ayuda enviada y curso 1 abierto en español.'},
    {id:'a1-2',t:'Cursos 1-2 · Introducción a la IA + Productividad con IA',d:'~3 horas (1h + 2h, verificado)',steps:[{s:'1 hora al día: 45 min de video/práctica + 15 min de notas en tu registro diario (abajo). '+AYUDA}],check:'Cursos 1 y 2 aprobados (badges en Coursera).'},
    {id:'a1-3',t:'Cursos 3-4 · El arte del prompting + IA responsable',d:'~3 horas (2h + 1h) · el corazón del certificado',steps:[{s:'El curso de prompting es ORO para ti: lo que aprendas ahí lo aplicas el mismo día conmigo y con Gemini. Guarda tus mejores prompts en tu módulo 8-PRO.'}],check:'Cursos 3 y 4 aprobados.'},
    {id:'a1-4',t:'Curso 5 · Mantenerse al día en IA → 🎓 CERTIFICADO 1',d:'~2 horas + cierre',steps:[
      {s:'Termina el último curso y descarga tu certificado.'},
      {s:'Publícalo en LinkedIn el MISMO día (Coursera tiene botón directo). Tu primera credencial de IA es real.'},
    ],check:'🎓 Google AI Essentials en tu LinkedIn.'},
   ]},
  {id:'F2',icon:'🔧',name:'Fase 2 · n8n — construir automatizaciones de IA (visual)',weeks:'ago → sep 2026',
   why:'n8n es programación 100% VISUAL: cajas y flechas, cero código. Con él construyes agentes y automatizaciones de IA REALES — y es exactamente la habilidad vendible a PYMEs del plan original. Aquí dejas de estudiar IA y empiezas a FABRICARLA.',
   items:[
    {id:'a2-1',t:'Montar tu n8n (conmigo, ~30 min)',d:'Tu PC ya tiene Docker instalado — lo usamos',steps:[
      {s:'Sesión conmigo (Claude Code): levantamos n8n local con Docker en tu PC, paso a paso. Alternativa sin instalar nada: prueba gratis de n8n Cloud.',link:'https://docs.n8n.io/hosting/installation/docker/',ln:'n8n con Docker (guía oficial)'},
    ],check:'n8n abre en tu navegador y creaste tu primer workflow de prueba.'},
    {id:'a2-2',t:'Curso oficial n8n Level 1 → 🎖️ badge',d:'~2 semanas a 1h/día · interactivo',steps:[
      {s:'Curso oficial gratis, con badge verificable al aprobar el quiz final',link:'https://docs.n8n.io/courses/level-one/',ln:'n8n Course — Level 1'},
      {s:AYUDA},
    ],check:'🎖️ Badge Level 1 obtenido.'},
    {id:'a2-3',t:'Curso oficial n8n Level 2 → 🎖️ badge',d:'~2 semanas · manejo de datos y errores',steps:[
      {s:'La continuación oficial',link:'https://docs.n8n.io/courses/level-two/',ln:'n8n Course — Level 2'},
    ],check:'🎖️ Badge Level 2 obtenido.'},
    {id:'a2-4',t:'Construir 5 automatizaciones de IA REALES (conmigo)',d:'~2-3 semanas · tu primer portafolio de IA',steps:[
      {s:'Ideas con tus propios datos: resumen diario de tus correos CUN con IA · clasificador de gastos (12-FIN) · alerta de vacantes que cruce tu 5-JOB · digest de noticias IA (7-NEW) · lo que se te ocurra. Las plantillas de la comunidad son tu base.',link:'https://n8n.io/workflows/',ln:'Plantillas n8n'},
      {s:'Cada una: screenshot + descripción de 3 líneas en tu repo atlas-portfolio. Eso ES un portafolio de automatización con IA.'},
    ],check:'5 workflows con IA funcionando y documentados.'},
    {id:'a2-5',t:'(Opcional 💵) Primer servicio real',d:'La vía de ingresos del plan original arranca aquí',steps:[
      {s:'Ofrece UNA automatización a un conocido con negocio (gratis o simbólico la primera — a cambio de testimonio). Con eso validas que puedes vender esto.'},
    ],check:'Primera automatización entregada a alguien real.'},
   ]},
  {id:'F3',icon:'🐍',name:'Fase 3 · Python sin dolor (Kaggle Learn)',weeks:'oct → nov 2026',
   why:'Para pasar de armar automatizaciones a construir agentes serios, toca algo de código — y Kaggle es la forma visual: gratis, en el navegador, cero instalación, resultado AL INSTANTE. Llegas al código con motivo: potenciar tu IA.',
   items:[
    {id:'a3-1',t:'Kaggle · Intro to Programming',d:'~5 horas',steps:[{s:'Crea cuenta en Kaggle y arranca. Cada lección: lees 10 min, practicas 20 en el mismo navegador.',link:'https://www.kaggle.com/learn/intro-to-programming',ln:'Kaggle — Intro to Programming'}],check:'Mini-certificado obtenido.'},
    {id:'a3-2',t:'Kaggle · Python',d:'~5 horas · el curso central',steps:[{s:AYUDA,link:'https://www.kaggle.com/learn/python',ln:'Kaggle — Python'}],check:'Mini-certificado obtenido.'},
    {id:'a3-3',t:'Kaggle · Pandas',d:'~4 horas · datos con código',steps:[{s:'Pandas = Excel con superpoderes. Todo lo que sabes de hojas de cálculo se traduce aquí.',link:'https://www.kaggle.com/learn/pandas',ln:'Kaggle — Pandas'}],check:'Mini-certificado obtenido.'},
    {id:'a3-4',t:'Tu primer script de IA en Python (conmigo)',d:'~1 semana · unir los dos mundos',steps:[
      {s:'Con Claude: un script que llama a una API de IA (el tier gratuito de Gemini sirve de laboratorio sin gastar) y hace algo útil con tus datos. Tu PC ya tiene Python 3.13 listo.'},
      {s:'Al repo atlas-portfolio con README.'},
    ],check:'Ejecutaste TU código llamando a una IA. Ya eres peligroso.'},
   ]},
  {id:'F4',icon:'🤖',name:'Fase 4 · Agentes + RAG — la graduación ATLAS',weeks:'dic 2026 → ene 2027',
   why:'La meta final del plan original: construir agentes de IA y sistemas RAG con certificado internacional y proyecto público. Llegas aquí con prompting (F1), automatización (F2) y Python (F3) — el orden correcto.',
   items:[
    {id:'a4-1',t:'Hugging Face · AI Agents Course → 🎓 certificado',d:'~4-5 semanas · gratis',steps:[
      {s:'El curso de agentes del hub de IA más famoso del mundo, con certificado',link:'https://huggingface.co/learn/agents-course',ln:'HF Agents Course'},
      {s:AYUDA},
    ],check:'🎓 Certificado de agentes de Hugging Face.'},
    {id:'a4-2',t:'Anthropic Academy · Claude con la API',d:'~1 semana · gratis, del fabricante de tu IA',steps:[
      {s:'Cursos oficiales de Anthropic: API, tool use — lo que hace que un agente ACTÚE',link:'https://anthropic.skilljar.com/',ln:'Anthropic Academy'},
    ],check:'Hiciste tool-use real: Claude ejecutando funciones TUYAS.'},
    {id:'a4-3',t:'🏆 Proyecto estrella: "chatea con tus documentos" (RAG)',d:'~3 semanas · con Claude como copiloto',steps:[
      {s:'Subes documentos → preguntas → respuestas con citas. Demo pública + GitHub + video de 60s.'},
      {s:'Publícalo en LinkedIn. Con esto en la mano: servicios de IA a PYMEs y/o vacantes de IA desde tu 5-JOB. Graduación ATLAS. 🎓'},
    ],check:'Demo pública funcionando. Oficialmente construyes IA.'},
   ]},
  ];

  /* ══════════════════════════════════════════════════════════
     CERTIFICACIONES v3.1 — los hitos de la ruta (en orden)
  ══════════════════════════════════════════════════════════ */
  const CERTS=[
    {id:'c-aie',t:'Google AI Essentials',tag:'BECA / $49',when:'F1',link:'https://www.coursera.org/specializations/ai-essentials-google',d:'Tu primer certificado de IA — Google, en español, cero código, ~10 horas (5 cursos). Ayuda económica de Coursera (solicitar el día 1).'},
    {id:'c-n8n',t:'n8n · Level 1 + Level 2 (badges oficiales)',tag:'GRATIS',when:'F2',link:'https://docs.n8n.io/courses/',d:'La credencial de la herramienta con la que fabricarás y venderás automatizaciones de IA.'},
    {id:'c-kaggle',t:'Kaggle Learn · 3 mini-certificados de Python',tag:'GRATIS',when:'F3',link:'https://www.kaggle.com/learn',d:'Intro to Programming, Python y Pandas — en el navegador, resultado inmediato.'},
    {id:'c-hf',t:'Hugging Face · AI Agents Course',tag:'GRATIS',when:'F4',link:'https://huggingface.co/learn/agents-course',d:'Certificado de agentes del hub de IA más famoso del mundo. La joya de la ruta.'},
    {id:'c-anthropic',t:'Anthropic Academy · Claude con la API',tag:'GRATIS',when:'F4',link:'https://anthropic.skilljar.com/',d:'El curso oficial del fabricante de tu herramienta principal. Diferenciador brutal.'},
    {id:'c-efset',t:'EF SET English Certificate (50 min)',tag:'GRATIS',when:'cuando quieras',link:'https://www.efset.org/',d:'Certificado de inglés gratis y linkeable. Tómalo 2 veces (antes/después) para VER tu progreso.'},
  ];

  /* ══════════════════════════════════════════════════════════
     PROMPTS v3.1 — continuidad multi-IA
  ══════════════════════════════════════════════════════════ */
  const RUTA_TXT='F1 Google AI Essentials (prompting, sin codigo) -> F2 n8n automatizacion visual (badges L1+L2, primeros servicios) -> F3 Python en Kaggle -> F4 Agentes + RAG (certificado Hugging Face, proyecto publico)';

  const P_CLAUDE=[
'ERES: el acompanante de estudio del PROYECTO ATLAS v3.1 de Miguel Angel Barros (Colombia, Ing. de Sistemas CUN, analista en Simetrik, aprendiz VISUAL, 1 h/dia).',
'',
'EL PROYECTO (v3.1 — IA desde el dia 1, camino de certificados): '+RUTA_TXT+'. Una sola cosa a la vez; los cursos ya estan hechos por Google/n8n/Kaggle/HF — tu NO dictas lecciones.',
'',
'TU TRABAJO REAL:',
'1. DESBLOQUEAR: cuando Miguel pegue un pantallazo o texto de un curso que no entiende, explicaselo CON MANZANAS: analogias simples, tablas, ejemplos con SUS datos (finanzas, conciliaciones de Simetrik, notas de la CUN). Es aprendiz visual: diagramas y ejemplos concretos antes que definiciones abstractas.',
'2. CONSTANCIA: preguntale por su racha y su registro diario. Si lleva dias sin estudiar, sin regano: ayudale a retomar con la accion mas pequena posible (20 min cuentan).',
'3. CONSTRUIR JUNTOS (F2 en adelante): el setup de n8n, las 5 automatizaciones, el script de Python y el proyecto RAG se hacen con vos de copiloto paso a paso, siempre de lo visual hacia el codigo.',
'4. NO AGREGAR CURSOS NI CAMBIAR EL PLAN: si Miguel propone algo nuevo, anotalo como "idea aparcada" para la revision dominical. Anti-dispersion es sagrado.',
'',
'REGLAS: espanol siempre. Nunca respondas "eso lo veras mas adelante" — desbloquea la duda YA con lo minimo necesario. No inventes links ni contenido de cursos. Honestidad carinosa: si algo no lo domina, dilo y repasenlo distinto. Jamas usar material de Simetrik. Cierra cada sesion con 1 linea para su bitacora.',
  ].join('\n');

  const P_GEMINI=[
'ERES: la investigadora, bibliotecaria y coach de ingles del PROYECTO ATLAS v3.1 de Miguel Angel Barros (Colombia, hispanohablante, aprendiz visual, 1 h/dia).',
'',
'EL PROYECTO: IA desde el dia 1, camino de certificados: '+RUTA_TXT+'. Su acompanante de estudio es Claude; tu rol es complementario.',
'',
'TUS FUNCIONES:',
'1. BIBLIOTECA: resumenes visuales de lo que estudio en la semana (tablas, esquemas), tarjetas de repaso y quizzes cortos.',
'2. INGLES (10-20 min, opcional pero valioso): mini-sesion hablada — el explica en ingles lo que estudio hoy, tu corriges con carino; 5 palabras tecnicas de IA; sube dificultad gradual.',
'3. INVESTIGACION: cuando pida "investiga X" — mercado de automatizacion/IA para PYMEs hispanas, tarifas, vacantes remotas junior de IA en LATAM. Con fuentes.',
'4. MARKETING (F2+): posts de LinkedIn mostrando certificados, automatizaciones y el proyecto RAG (ES/EN).',
'',
'PROTOCOLO: si pega un bloque "ESTADO PROYECTO ATLAS", usalo como contexto. Espanol salvo la sesion de ingles. No inventes fuentes.',
  ].join('\n');

  const P_DIARIO=[
'Hola. Sesion de estudio ATLAS v3.1.',
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
'Revision dominical ATLAS v3.1 (20 min). Modo: director de proyecto, honesto y practico.',
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
'CONTEXTO DE EMERGENCIA — Continuidad del PROYECTO ATLAS v3.1.',
'',
'Soy Miguel Angel Barros (Colombia, Ing. de Sistemas CUN, analista en Simetrik, aprendiz VISUAL). Mi plan es "IA desde el dia 1, camino de certificados": '+RUTA_TXT+'. Reglas: una sola cosa a la vez, 1 h/dia (20 min cuentan), cero dias de cero, ideas nuevas se aparcan para el domingo. Claude me desbloquea dudas con explicaciones visuales y construye conmigo; Gemini investiga y entrena mi ingles. Plan visual: hub ATLAS en mi web da-2026 (Ruta) + E:\\CLAUDE\\My Project\\.',
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
    return ['=== ESTADO PROYECTO ATLAS v3.1 · '+todayISO()+' ===',
      'Ruta (IA desde el día 1): F1 AI Essentials → F2 n8n → F3 Python Kaggle → F4 Agentes+RAG',
      'Fase actual: '+cf.n+'/4 ('+cf.m.name.split('·')[1].trim()+') · Pasos: '+cs.dn+'/'+cs.t+' ('+cs.pct+'%) · Certificados: '+ce.dn+'/'+ce.t,
      'Racha de estudio: '+streak()+(streak()===1?' día':' días'),
      'Últimos 7 días [E=estudio N=notas I=inglés]: '+last7,
      'Última nota de bitácora: "'+lastNote+'"',
      'QUÉ TOCA AHORA: '+(nx?nx.fase.icon+' '+nx.item.t:'🎓 Ruta completa — graduación ATLAS'),
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

    let h='<div class="at-hero"><h2>🚀 Proyecto ATLAS v3.1 — <em style="color:var(--gn)">IA desde el Día 1</em></h2>'+
      '<p>Cert-first · visual · <b>una sola cosa a la vez</b> · 1 h/día (20 min cuentan) · F1 Google AI Essentials → F2 n8n (automatización visual) → F3 Python Kaggle → F4 Agentes + RAG. Las 3 reglas: el recuadro rojo dice qué toca; cero días de cero; si te pierdes, pégale el pantallazo a Claude — jamás abandones en silencio.</p>'+
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
    h+=sec('atHk','⚡','Trucos del oficio (para aprendiz visual)',
      '<div class="at-hack"><b>1 · La regla del pantallazo</b>Atascado más de 10 minutos = pantallazo a Claude. No es trampa: es cómo estudia la gente que avanza. El curso da la estructura; Claude da la explicación a TU medida.</div>'+
      '<div class="at-hack"><b>2 · Aplica lo aprendido EL MISMO DÍA</b>Lo que veas de prompting (F1) úsalo esa misma tarde conmigo o con Gemini. Lo que armes en n8n (F2) conéctalo a TUS datos (correos, finanzas, vacantes). Un concepto usado el mismo día no se olvida.</div>'+
      '<div class="at-hack"><b>3 · El registro diario ES el método</b>La nota de 1 línea al final de cada sesión (qué vi, qué no entendí) vale más que 2 horas extra de video. Obliga al cerebro a cerrar el archivo del día.</div>'+
      '<div class="at-hack"><b>4 · Certificado terminado = LinkedIn el mismo día</b>No los acumules en silencio. Cada credencial publicada te acerca reclutadores y clientes mientras duermes (Gemini te redacta el post en 2 min).</div>'+
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
