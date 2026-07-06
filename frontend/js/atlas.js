/* ════════════════════════════════════════════════════════════════
   4-RUT · PROYECTO ATLAS — Ingeniería de IA Aplicada
   Hub de continuidad multi-IA: prompts, ruta diaria, currículo,
   certificaciones y Estado copiable para Claude + Gemini.
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
  const getMeta=()=>gJ(K_META,{start:'2026-07-06'});
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const todayISO=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};

  /* ══════════════════════════════════════════════════════════
     CURRÍCULO — 12 semanas · 4 módulos (espejo de PLAN_MAESTRO v2.0)
  ══════════════════════════════════════════════════════════ */
  const CURR=[
  {id:'M1',icon:'🐍',name:'Módulo 1 · Fundamentos de producción',weeks:'Semanas 1–3 · jul 6–26',
   items:[
    {id:'m1-1',t:'Setup del laboratorio',d:'Python + VS Code + Git configurados y verificados',steps:[
      {s:'Instala <strong>Python 3.12+</strong> (marca "Add to PATH" al instalar)',link:'https://www.python.org/downloads/',ln:'python.org'},
      {s:'Instala <strong>VS Code</strong> + extensión oficial de Python',link:'https://code.visualstudio.com/',ln:'VS Code'},
      {s:'Instala <strong>Git</strong> y configura tu nombre/email (git config --global)',link:'https://git-scm.com/downloads',ln:'Git'},
      {s:'Pídele a Claude: <em>"Verifica mi setup: guíame para correr python --version, git --version y un hola-mundo"</em>'},
    ],check:'Ejecutaste un script .py desde la terminal y hiciste tu primer commit.'},
    {id:'m1-2',t:'Python desde JS',d:'Sintaxis, tipos, funciones, módulos — el puente desde JavaScript',steps:[
      {s:'Curso interactivo gratis con certificado: <strong>Kaggle Intro to Programming + Python</strong>',link:'https://www.kaggle.com/learn/python',ln:'Kaggle Learn — Python'},
      {s:'Cada día: 1 lección con Claude usando el Prompt Diario (sección Prompts). Claude te da el reto; tú lo tecleas — jamás copies/pegues su código.'},
      {s:'Refuerzo opcional pago: <strong>boot.dev</strong> (gamificado, muy bueno para constancia)',link:'https://www.boot.dev/',ln:'boot.dev'},
    ],check:'Puedes escribir funciones, listas/dicts, comprehensions y leer archivos sin googlear.'},
    {id:'m1-3',t:'Git & GitHub nivel pro',d:'Commits, branches, PRs, README que venden',steps:[
      {s:'Curso oficial interactivo gratis: <strong>GitHub Skills</strong> (Introduction to GitHub + Communicate using Markdown)',link:'https://skills.github.com/',ln:'GitHub Skills'},
      {s:'Crea el repo <strong>atlas-portfolio</strong> (público) — ahí vive TODO tu progreso.'},
      {s:'Hábito: <strong>1 commit diario mínimo</strong>. El gráfico verde de GitHub es tu credencial silenciosa ante reclutadores.'},
    ],check:'Repo atlas-portfolio creado, con README y racha de commits de 7+ días.'},
    {id:'m1-4',t:'APIs REST a fondo',d:'Consumir, autenticar, paginar, manejar errores + FastAPI básico',steps:[
      {s:'Aprende requests con Python',link:'https://realpython.com/api-integration-in-python/',ln:'Real Python — APIs'},
      {s:'Practica con 2–3 APIs públicas gratuitas (clima, crypto, países)',link:'https://github.com/public-apis/public-apis',ln:'Public APIs List'},
      {s:'Tutorial oficial de <strong>FastAPI</strong> (solo First Steps → Query Params)',link:'https://fastapi.tiangolo.com/tutorial/',ln:'FastAPI Tutorial'},
    ],check:'Consumiste una API con auth y paginación, y expusiste un endpoint propio con FastAPI.'},
    {id:'m1-5',t:'🏆 PROYECTO 1',d:'API propia desplegada que consume una fuente externa, con README impecable',steps:[
      {s:'Con Claude: diseña y construye una mini-API (ej: agregador de datos de una API pública con caché y endpoints propios).'},
      {s:'Súbela a GitHub con README profesional: qué hace, screenshot, cómo correrla, qué aprendiste.'},
    ],check:'Proyecto 1 público en GitHub y funcionando. Puedes explicarlo en 60 segundos.'},
   ]},
  {id:'M2',icon:'🧠',name:'Módulo 2 · Ingeniería LLM',weeks:'Semanas 4–6 · jul 27–ago 16',
   items:[
    {id:'m2-1',t:'APIs de Claude y Gemini',d:'Chat, system prompts, streaming, manejo de tokens y costos',steps:[
      {s:'Cursos oficiales gratis de Anthropic: <strong>Anthropic Academy</strong> (Claude with the Anthropic API)',link:'https://anthropic.skilljar.com/',ln:'Anthropic Academy'},
      {s:'Documentación de la API de Gemini (tienes tier gratuito para desarrollo)',link:'https://ai.google.dev/gemini-api/docs',ln:'Gemini API Docs'},
      {s:'Ejercicio: el mismo mini-chat en consola contra ambas APIs — compara respuestas, latencia y costo.'},
    ],check:'Llamaste a ambas APIs desde Python, con system prompt y control de tokens.'},
    {id:'m2-2',t:'Tool Use / Function Calling',d:'El corazón de los agentes: la IA ejecuta TUS funciones',steps:[
      {s:'Guía oficial de tool use de Anthropic (está en la Academy y en docs.anthropic.com)',link:'https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview',ln:'Anthropic — Tool Use'},
      {s:'Ejercicio con Claude: asistente que consulta una "base de datos" local (JSON) vía funciones: buscar producto, calcular total, registrar pedido.'},
    ],check:'Tu código define herramientas, el modelo las invoca y tú orquestas el loop completo.'},
    {id:'m2-3',t:'Embeddings y búsqueda semántica',d:'Vectores, similitud, cuándo usarlos (base de RAG)',steps:[
      {s:'Short course gratis: <strong>DeepLearning.AI</strong> (busca "Embeddings" o "Vector Databases")',link:'https://www.deeplearning.ai/short-courses/',ln:'DeepLearning.AI Short Courses'},
      {s:'Práctica: indexa 50 frases y busca por significado (no por palabra exacta) con Chroma local.',link:'https://docs.trychroma.com/',ln:'Chroma Docs'},
    ],check:'Explicas qué es un embedding con tus palabras y montaste búsqueda semántica local.'},
    {id:'m2-4',t:'n8n — la fábrica visual',d:'Self-hosted gratis · el vehículo de entrega para clientes',steps:[
      {s:'Curso oficial gratis con badge: <strong>n8n Level 1</strong>',link:'https://docs.n8n.io/courses/level-one/',ln:'n8n Course L1'},
      {s:'Luego <strong>Level 2</strong> (avanzado)',link:'https://docs.n8n.io/courses/level-two/',ln:'n8n Course L2'},
      {s:'Meta: <strong>10 workflows</strong> construidos (usa plantillas de la comunidad como base)',link:'https://n8n.io/workflows/',ln:'n8n Templates'},
    ],check:'Badges L1+L2 obtenidos y 10 workflows funcionando en tu instancia.'},
    {id:'m2-5',t:'🏆 PROYECTO 2',d:'Asistente con tool-use sobre datos reales (ej: bot de inventario por Telegram)',steps:[
      {s:'Con Claude: define alcance pequeño y útil. Constrúyelo en Python puro O n8n+código (decide con tu profesor).'},
      {s:'GitHub + video-demo de 60s (Gemini te ayuda a guionarlo).'},
    ],check:'Proyecto 2 público, con demo grabada. Un extraño entiende qué hace en 1 minuto.'},
   ]},
  {id:'M3',icon:'📚',name:'Módulo 3 · RAG + Agentes (la especialización que paga)',weeks:'Semanas 7–9 · ago 17–sep 6',
   items:[
    {id:'m3-1',t:'RAG de producción',d:'Chunking, retrieval, re-ranking, evaluación — el premium de +$40-80/h',steps:[
      {s:'Short courses de <strong>DeepLearning.AI</strong>: "Building Applications with Vector Databases" / RAG',link:'https://www.deeplearning.ai/short-courses/',ln:'DeepLearning.AI'},
      {s:'Construye con Claude un RAG local: tus PDFs → chunks → Chroma → respuestas con citas.'},
      {s:'Aprende a MEDIR calidad: casos de prueba, respuestas esperadas, % de aciertos.'},
    ],check:'Tu RAG responde con citas correctas y sabes medir cuándo falla.'},
    {id:'m3-2',t:'Agentes',d:'Loops agénticos, orquestación, memoria, guardrails',steps:[
      {s:'Curso gratis con certificado: <strong>Hugging Face Agents Course</strong>',link:'https://huggingface.co/learn/agents-course',ln:'HF Agents Course'},
      {s:'Guía de Anthropic: "Building Effective Agents" — léela con Claude y discútanla',link:'https://www.anthropic.com/research/building-effective-agents',ln:'Anthropic — Effective Agents'},
      {s:'Regla de oro: workflow simple > agente complejo. Aprende a decidir cuál usar.'},
    ],check:'Certificado HF obtenido + construiste un agente con 2+ herramientas y memoria.'},
    {id:'m3-3',t:'💵 Primeros gigs (arranca la Vía A)',d:'Vender automatizaciones simples MIENTRAS estudias',steps:[
      {s:'Perfil en <strong>Workana</strong> (mercado hispano) + <strong>Upwork</strong>: "Automatización e Integración de IA"',link:'https://www.workana.com/',ln:'Workana'},
      {s:'5 propuestas/día con la plantilla que Claude te redacta. Gigs objetivo: $50–150 (scraping suave, workflows n8n, chatbots simples).'},
      {s:'Cada entrega: pedir reseña SIEMPRE. Meta del módulo: 3 gigs cobrados.'},
    ],check:'Primeros $ cobrados vía Payoneer y 3+ reseñas 5★.'},
    {id:'m3-4',t:'🏆 PROYECTO 3',d:'RAG completo: "chatea con los documentos de tu negocio" — demo pública',steps:[
      {s:'El proyecto estrella: sube docs → pregunta → respuestas con citas. UI simple (Streamlit o HTML).'},
      {s:'Deploy público (Módulo 4 lo pule) + GitHub + video-demo.'},
    ],check:'Proyecto 3 con demo pública en vivo. Es tu mejor argumento de venta.'},
   ]},
  {id:'M4',icon:'🚢',name:'Módulo 4 · Deploy + Portafolio + Venta',weeks:'Semanas 10–12 · sep 7–27',
   items:[
    {id:'m4-1',t:'Docker + deploy real',d:'Contenedores, VPS/Railway/Render, dominio propio',steps:[
      {s:'Tutorial oficial: <strong>Docker 101</strong>',link:'https://www.docker.com/101-tutorial/',ln:'Docker 101'},
      {s:'Dockeriza el Proyecto 3 y móntalo en un VPS de $5–8/mes (con Claude paso a paso).'},
    ],check:'Tu RAG corre 24/7 en internet con tu dominio.'},
    {id:'m4-2',t:'Seguridad y evals de LLM apps',d:'Prompt injection, sanitización, control de costos',steps:[
      {s:'Estudia el <strong>OWASP Top 10 para LLMs</strong> con Claude (una sesión)',link:'https://owasp.org/www-project-top-10-for-large-language-model-applications/',ln:'OWASP LLM Top 10'},
      {s:'Aplica 3 defensas a tu Proyecto 3: validación de input, límites de gasto, output filtering.'},
    ],check:'Sabes explicar prompt injection y tu app tiene defensas reales.'},
    {id:'m4-3',t:'Portafolio + LinkedIn ES/EN',d:'La identidad profesional: AI Engineer',steps:[
      {s:'Web en GitHub Pages con los 3 proyectos + video-demos (Gemini produce los visuales).'},
      {s:'LinkedIn: titular "AI Engineer | Automatización & RAG | Python" — About en ES y EN con Claude.'},
      {s:'Primer post de LinkedIn mostrando el Proyecto 3 (guion con Gemini).'},
    ],check:'Portafolio en vivo + LinkedIn optimizado + primer post publicado.'},
    {id:'m4-4',t:'🏆 GRADUACIÓN ATLAS',d:'Checkpoint final de la maestría',steps:[
      {s:'Sesión de evaluación con Claude: te hace entrevista técnica simulada de 30 min (en español y luego en inglés).'},
      {s:'Revisión del plan: activar Fase 2 (Tracción) del PLAN_MAESTRO — paquetes A1/A2/A3 a la venta.'},
    ],check:'Superaste la entrevista simulada. Eres oficialmente peligroso. 🎓'},
   ]},
  ];

  /* ══════════════════════════════════════════════════════════
     CERTIFICACIONES — priorizadas (gratis primero)
  ══════════════════════════════════════════════════════════ */
  const CERTS=[
    {id:'c-kaggle',t:'Kaggle Learn · Python + Intro to Programming',tag:'GRATIS',when:'M1',link:'https://www.kaggle.com/learn',d:'Certificados rápidos y respetados para arrancar. 2–4 h cada uno.'},
    {id:'c-fcc',t:'freeCodeCamp · Scientific Computing with Python',tag:'GRATIS',when:'M1–M2',link:'https://www.freecodecamp.org/learn/scientific-computing-with-python/',d:'Certificación completa (~60 h, hazla en paralelo sin bloquear el plan). Muy citada en CVs.'},
    {id:'c-gh',t:'GitHub Skills (badges oficiales)',tag:'GRATIS',when:'M1',link:'https://skills.github.com/',d:'Badges de GitHub que aparecen en tu perfil. Reclutadores los ven.'},
    {id:'c-anthropic',t:'Anthropic Academy · Claude with the API',tag:'GRATIS',when:'M2',link:'https://anthropic.skilljar.com/',d:'El curso oficial del fabricante de tu herramienta principal. Diferenciador brutal.'},
    {id:'c-n8n',t:'n8n · Level 1 + Level 2 (badges oficiales)',tag:'GRATIS',when:'M2',link:'https://docs.n8n.io/courses/',d:'La credencial exacta del servicio que venderás en la Vía A.'},
    {id:'c-hf',t:'Hugging Face · AI Agents Course (certificado)',tag:'GRATIS',when:'M3',link:'https://huggingface.co/learn/agents-course',d:'Certificado de agentes del hub de IA más famoso del mundo.'},
    {id:'c-dlai',t:'DeepLearning.AI · Short Courses (RAG, Embeddings, Agents)',tag:'GRATIS',when:'M2–M3',link:'https://www.deeplearning.ai/short-courses/',d:'De Andrew Ng. 1–2 h cada uno. Colecciona 4–6 de tu especialidad.'},
    {id:'c-efset',t:'EF SET English Certificate (50 min, nivel CEFR)',tag:'GRATIS',when:'M2 y M4',link:'https://www.efset.org/',d:'Certificado de inglés gratis y linkeable en LinkedIn. Tómalo 2 veces: antes/después, para VER tu progreso.'},
    {id:'c-duo',t:'Duolingo English Test (score oficial)',tag:'~$65 USD',when:'Fase 3',link:'https://englishtest.duolingo.com/',d:'Cuando la Vía B se active: score de inglés aceptado por empresas. Solo cuando el EF SET te dé B2.'},
    {id:'c-aws',t:'AWS Certified Cloud Practitioner',tag:'$100 USD',when:'Fase 3 (opcional)',link:'https://aws.amazon.com/certification/certified-cloud-practitioner/',d:'Solo si la Vía B lo pide. Con lo aprendido en M4 la preparas en 3–4 semanas.'},
  ];

  /* ══════════════════════════════════════════════════════════
     PROMPTS — la biblioteca de continuidad multi-IA
  ══════════════════════════════════════════════════════════ */
  const P_CLAUDE=[
'ERES: el Profesor, CTO y socio del PROYECTO ATLAS de Miguel Angel Barros (Colombia, Ing. de Sistemas 9no semestre, viene de JavaScript, 2-3 h/dia disponibles).',
'',
'EL PROYECTO: Miguel domina Ingenieria de IA Aplicada en 12 semanas (4 modulos) con doble via de ingresos: (A) servicios de automatizacion/IA a PYMEs desde la semana 7; (B) empleo remoto nearshore como AI Engineer al graduarse.',
'',
'CURRICULO: M1 Fundamentos (sem 1-3): Python desde JS, Git/GitHub, APIs REST, FastAPI -> Proyecto 1: API propia. M2 Ingenieria LLM (sem 4-6): APIs Claude/Gemini, tool use, embeddings, n8n -> Proyecto 2: asistente tool-use. M3 RAG+Agentes (sem 7-9): RAG produccion, agentes, primeros gigs -> Proyecto 3: RAG demo publica. M4 Deploy (sem 10-12): Docker, seguridad LLM, portafolio, LinkedIn -> graduacion.',
'',
'PROTOCOLO DE CADA SESION:',
'1. Si Miguel pega un bloque "ESTADO PROYECTO ATLAS", leelo: ahi esta la semana, el modulo, la racha y lo pendiente. Si NO lo pega, pideselo antes de empezar (el lo copia desde su web da-2026 > Ruta > ATLAS con un boton).',
'2. Da la leccion del dia en este formato EXACTO: (a) CONCEPTO en 5 min, con analogia a JavaScript cuando aplique; (b) CODIGO GUIADO: Miguel teclea, tu NUNCA le das el bloque completo para copiar; (c) RETO sin ayuda (5-15 min); (d) CORRECCION linea por linea explicando el porque; (e) MINI-QUIZ de 3 preguntas.',
'3. Si el reto no se supera, NO avances: re-explica distinto y da un reto mas facil.',
'4. Cierra SIEMPRE con el BLOQUE CIERRE: === CIERRE ATLAS === Fecha / Leccion vista / Resultado del reto (superado o no) / Concepto debil a repasar / Proxima leccion / 1 frase para la bitacora === FIN ===. Miguel guarda eso en su tracker diario.',
'',
'REGLAS: responde siempre en espanol (el codigo y terminos tecnicos en ingles). Honestidad brutal: si Miguel no domina algo, dilo. Nada de teoria infinita: 70% practica. Anti-dispersion: si Miguel propone cambiar de tecnologia o plan, recuerdale la regla de las 12 semanas y anota la idea para la revision dominical. No inventes datos ni links: si no estas seguro, dilo. Se exigente: el estandar es codigo de produccion, no de tutorial.',
  ].join('\n');

  const P_GEMINI=[
'ERES: la Investigadora, Bibliotecaria y Coach de ingles del PROYECTO ATLAS de Miguel Angel Barros (Colombia, Ing. de Sistemas 9no semestre, hispanohablante, ingles en mejora, 2-3 h/dia).',
'',
'EL PROYECTO: Miguel domina Ingenieria de IA Aplicada en 12 semanas (Python -> APIs LLM -> RAG -> agentes -> deploy) con doble via de ingresos: (A) servicios de automatizacion a PYMEs, (B) empleo remoto nearshore como AI Engineer. Su profesor de codigo es Claude; TU rol es complementario, no duplicado.',
'',
'TUS 4 FUNCIONES:',
'1. INVESTIGACION: cuando pida "investiga X", usa busqueda profunda y entrega: hallazgos con fuentes, 3 conclusiones accionables, y que significa para ATLAS. Temas tipicos: nichos de clientes, tarifas, herramientas, vacantes remotas LATAM.',
'2. BIBLIOTECA: ayudale a digerir documentacion tecnica y cursos: resumenes por niveles (basico -> profundo), tarjetas de repaso, quizzes de lo estudiado en la semana.',
'3. INGLES DIARIO (20 min): al pedir "ingles de hoy", haz una mini-sesion hablada: (a) el explica en ingles lo que programo hoy, tu corriges pronunciacion y gramatica con carino pero sin dejar pasar errores; (b) 5 palabras nuevas de vocabulario tecnico de IA con ejemplo; (c) 1 pregunta de entrevista tecnica en ingles para responder oral. Nivel actual: intermedio-bajo; sube la dificultad gradualmente.',
'4. MARKETING: guiones de video-demos (60s), posts de LinkedIn (ES/EN), imagenes para el portafolio.',
'',
'PROTOCOLO: si Miguel pega un bloque "ESTADO PROYECTO ATLAS", usalo como contexto de donde va. Responde en espanol salvo en la sesion de ingles. No inventes fuentes: si no encuentras evidencia, dilo. Cierra cada sesion con 1 linea resumen para su bitacora.',
  ].join('\n');

  const P_DIARIO=[
'Hola profesor. Sesion diaria ATLAS.',
'',
'[PEGA AQUI TU ESTADO — boton "Copiar Estado" en da-2026 > Ruta > ATLAS]',
'',
'Tiempo disponible hoy: ___ minutos.',
'Como me senti ayer con el tema: (facil / normal / me costo / no entendi ___).',
'',
'Dame la leccion de hoy siguiendo el protocolo (concepto -> codigo guiado -> reto -> correccion -> quiz -> BLOQUE CIERRE).',
  ].join('\n');

  const P_DOMINGO=[
'Sesion dominical ATLAS (45 min). Modo: director de proyecto, exigente y honesto.',
'',
'[PEGA AQUI TU ESTADO — boton "Copiar Estado"]',
'',
'Revisa conmigo, en este orden:',
'1. KPIs de la semana: dias de protocolo cumplidos (racha), items del curriculo completados vs plan, minutos de ingles, commits en GitHub, y (desde M3) propuestas enviadas + $ facturado.',
'2. Diagnostico: donde me atrase y POR QUE (sin excusas blandas).',
'3. Decision: que ajustamos la proxima semana (maximo 2 ajustes).',
'4. Ideas aparcadas: te pego las ideas que anote en la semana; dime cuales merecen entrar al plan y cuales mueren hoy.',
'5. Plan de la semana: lista dia por dia (lun-sab) con leccion/tarea concreta.',
'6. Cierra con BLOQUE CIERRE para mi bitacora.',
  ].join('\n');

  const P_RESCATE=[
'CONTEXTO DE EMERGENCIA — Continuidad del PROYECTO ATLAS.',
'',
'Soy Miguel Angel Barros (Colombia, Ing. de Sistemas 9no semestre). Estoy en un plan de 12 semanas para dominar Ingenieria de IA Aplicada (Python -> APIs LLM -> RAG -> agentes -> deploy), con doble via de ingresos: (A) servicios de automatizacion/IA a PYMEs hispanas desde la semana 7 (paquetes: workflow $100-400, RAG a medida $500-2000, retainer $200-800/mes), y (B) empleo remoto nearshore como AI Engineer al graduarme. Mi profesor de codigo es Claude, mi investigadora es Gemini. Protocolo diario de 2-3 h: estudio activo + construccion + 20 min de ingles + bitacora. Revision dominical semanal. Regla anti-dispersion: 12 semanas sin cambiar el plan. Plan completo en E:\\CLAUDE\\My Project\\PLAN_MAESTRO.html.',
'',
'Mi estado actual es:',
'[PEGA AQUI TU ESTADO — boton "Copiar Estado"]',
'',
'Asume tu rol (profesor si eres Claude, investigadora/coach si eres Gemini) y continuemos exactamente donde iba. No me hagas re-explicar el proyecto.',
  ].join('\n');

  const PROMPTS={pclaude:P_CLAUDE,pgemini:P_GEMINI,pdiario:P_DIARIO,pdomingo:P_DOMINGO,prescate:P_RESCATE};

  /* ══════════════════════════════════════════════════════════
     ESTADO COPIABLE — el corazón de la continuidad
  ══════════════════════════════════════════════════════════ */
  function weekNum(){
    const st=new Date((getMeta().start||'2026-07-06')+'T00:00:00');
    return Math.min(12,Math.max(1,Math.floor((new Date()-st)/(7*864e5))+1));
  }
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
  function currentModule(){
    const c=getCurr();
    for(const m of CURR){if(m.items.some(i=>!c[i.id]))return m;}
    return CURR[CURR.length-1];
  }
  function nextItem(){
    const c=getCurr();
    for(const m of CURR){for(const i of m.items){if(!c[i.id])return m.icon+' '+i.t;}}
    return '🎓 Currículo completo — activar Fase 2 del plan';
  }
  function buildEstado(){
    const cs=currStats(),ce=certStats(),m=currentModule();
    const last7=getDaily().slice(-7).map(e=>e.d.slice(5)+' ['+(e.est?'E':'-')+(e.con?'C':'-')+(e.eng?'I':'-')+']').join(' · ')||'(sin registros aún)';
    const lastNote=(getDaily().slice(-1)[0]||{}).note||'—';
    return ['=== ESTADO PROYECTO ATLAS · '+todayISO()+' ===',
      'Semana del plan: '+weekNum()+'/12 · Módulo actual: '+m.id+' ('+m.name.split('·')[1].trim()+')',
      'Racha de protocolo: '+streak()+(streak()===1?' día':' días')+' · Currículo: '+cs.dn+'/'+cs.t+' items ('+cs.pct+'%) · Certificaciones: '+ce.dn+'/'+ce.t,
      'Últimos 7 días [E=estudio C=construcción I=inglés]: '+last7,
      'Última nota de bitácora: "'+lastNote+'"',
      'SIGUIENTE PENDIENTE: '+nextItem(),
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
    const d=new Date();d.setDate(d.getDate()+((7-d.getDay())%7)); // próximo domingo (o hoy si es domingo)
    const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),dd=String(d.getDate()).padStart(2,'0');
    return 'https://calendar.google.com/calendar/render?action=TEMPLATE'+
      '&text='+encodeURIComponent('🚀 ATLAS · Revisión Dominical con la IA')+
      '&dates='+y+m+dd+'T140000/'+y+m+dd+'T144500'+
      '&recur='+encodeURIComponent('RRULE:FREQ=WEEKLY;BYDAY=SU')+
      '&details='+encodeURIComponent('1) Abrir da-2026 → Ruta → ATLAS → botón Copiar Estado.\n2) Abrir Claude (Project ATLAS) → pegar Prompt Dominical + Estado.\n3) Registrar decisiones en la bitácora y marcar el check del domingo.');
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
    const entry={d,est,con,eng,note,week:weekNum()};
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
      '<div class="rt-log-e"><div class="rt-log-d">'+esc(e.d)+' · sem '+(e.week||'?')+' · '+
      (e.est?'📖':'·')+(e.con?'🔨':'·')+(e.eng?'🇺🇸':'·')+'</div>'+esc(e.note||'(sin nota)')+'</div>').join('')||'<div style="font-size:12px;color:var(--t3)">Aún no hay registros. Hoy es un gran día para el primero.</div>';
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
    const cs=currStats();
    const el=document.getElementById('atHead');if(!el)return;
    el.innerHTML=
      '<div class="at-kpis">'+
      '<div class="at-kpi"><div class="at-kv">Sem '+weekNum()+'/12</div><div class="at-kl">del plan</div></div>'+
      '<div class="at-kpi"><div class="at-kv">🔥 '+streak()+'</div><div class="at-kl">racha días</div></div>'+
      '<div class="at-kpi"><div class="at-kv">'+cs.dn+'/'+cs.t+'</div><div class="at-kl">currículo</div></div>'+
      '<div class="at-kpi"><div class="at-kv">'+certStats().dn+'/'+certStats().t+'</div><div class="at-kl">certificaciones</div></div>'+
      '</div>'+
      '<div class="rt-bar" style="margin:10px 0 4px"><div class="rt-bar-fill" style="width:'+cs.pct+'%"></div></div>'+
      '<div style="font-size:11px;color:var(--t3)">Siguiente pendiente: <b style="color:var(--tx)">'+esc(nextItem())+'</b></div>';
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
    if(item.check)h+='<div class="rt-checkpoint"><b>✅ Lo dominas cuando:</b>'+item.check+'</div>';
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

    const sec=(id,icon,title,body)=>'<div class="at-sec" id="'+id+'"><div class="at-sec-head" onclick="this.parentElement.classList.toggle(\'open\')"><span>'+icon+'</span><b>'+title+'</b><div class="rt-les-arrow">▼</div></div><div class="at-sec-body">'+body+'</div></div>';

    let h='<div class="at-hero"><h2>🚀 Proyecto ATLAS — <em style="color:var(--gn)">Ingeniería de IA Aplicada</em></h2>'+
      '<p>12 semanas · doble vía (servicios + carrera remota) · Claude enseña y construye · Gemini investiga y entrena tu inglés. Constitución completa: <b>E:\\CLAUDE\\My Project\\PLAN_MAESTRO.html</b></p>'+
      '<div id="atHead"></div></div>';

    /* ── 1 · SETUP CLAUDE ── */
    h+=sec('atSetC','🤖','Paso 1 · Montar el cuartel en Claude (una sola vez)',
      '<div class="at-step-mini"><b>A. Crear el Project (claude.ai):</b><br>'+
      '1. Entra a <a href="https://claude.ai/projects" target="_blank" rel="noopener">claude.ai/projects</a> → botón <b>"+ New project"</b> → nómbralo <b>PROYECTO ATLAS</b>.<br>'+
      '2. En el panel del proyecto busca <b>"Set custom instructions"</b> (Instrucciones personalizadas) → pega el <b>Prompt Maestro Claude</b> (abajo) → guarda.<br>'+
      '3. En <b>"Project knowledge"</b> sube: PLAN_MAESTRO.html y BITACORA.md (desde E:\\CLAUDE\\My Project). Re-sube la bitácora cada domingo — así el Project "recuerda" aunque cambie el modelo.<br>'+
      '4. Desde hoy, TODA sesión diaria de estudio se abre DENTRO de ese Project (nuevo chat dentro del proyecto, nunca chat suelto).</div>'+
      '<div class="at-step-mini"><b>B. Qué modelo elegir en el selector:</b><br>'+
      '• <b>Lección diaria y código:</b> el <b>Sonnet</b> más reciente — rápido, excelente en código, gasta menos límite de tu plan Pro.<br>'+
      '• <b>Decisiones de arquitectura, planes, revisión dominical:</b> el modelo más capaz disponible en tu selector (<b>Opus</b> o superior si tu plan lo muestra).<br>'+
      '• <b>Construir en tu PC (proyectos, portafolio):</b> <b>Claude Code</b> — abre una terminal en E:\\CLAUDE\\My Project (ya dejé un CLAUDE.md ahí que le da todo el contexto automáticamente).</div>'+
      promptCard('Prompt Maestro Claude','Va en las Custom Instructions del Project — define su rol de Profesor/CTO para siempre','pclaude'));

    /* ── 2 · SETUP GEMINI ── */
    h+=sec('atSetG','💎','Paso 2 · Montar el cuartel en Gemini (una sola vez)',
      '<div class="at-step-mini"><b>A. Crear la Gem:</b><br>'+
      '1. Entra a <a href="https://gemini.google.com/gems/create" target="_blank" rel="noopener">gemini.google.com</a> → menú lateral → <b>"Explorar Gems"</b> → <b>"+ Nueva Gem"</b>.<br>'+
      '2. Nombre: <b>ATLAS · Mentor</b>. En "Instrucciones" pega el <b>Prompt Maestro Gemini</b> (abajo).<br>'+
      '3. En "Conocimiento" adjunta PLAN_MAESTRO.html y BITACORA.md (mismos archivos; re-sube la bitácora los domingos).<br>'+
      '4. Guarda. Tus sesiones con Gemini siempre arrancan desde esa Gem.</div>'+
      '<div class="at-step-mini"><b>B. Qué herramienta de Google usar para qué:</b><br>'+
      '• <b>Gem ATLAS·Mentor (modelo Pro):</b> sesión diaria de inglés + repasos + marketing.<br>'+
      '• <b>Deep Research:</b> investigaciones semanales (nichos, tarifas, vacantes). Actívalo en el selector de herramientas del prompt.<br>'+
      '• <b>NotebookLM</b> (<a href="https://notebooklm.google.com" target="_blank" rel="noopener">notebooklm.google.com</a>): tu biblioteca — crea un notebook "ATLAS" y sube ahí docs de cursos, APIs y n8n; pregunta contra tus fuentes y genera resúmenes de audio para escuchar mientras caminas.<br>'+
      '• <b>Gemini Live (voz):</b> la sesión hablada de inglés de 20 min — hablar &gt; leer.</div>'+
      promptCard('Prompt Maestro Gemini','Va en las Instrucciones de la Gem — investigadora, bibliotecaria y coach de inglés','pgemini'));

    /* ── 3 · PROMPTS DIARIOS ── */
    h+=sec('atPr','📋','Paso 3 · Prompts de operación diaria (copiar y pegar)',
      promptCard('Prompt Diario (lección)','Cada día, en un chat nuevo DENTRO del Project ATLAS de Claude','pdiario')+
      promptCard('Prompt Dominical (revisión)','Domingos 45 min — con el modelo más capaz del selector','pdomingo')+
      promptCard('Prompt de Rescate (continuidad)','Si la IA "no recuerda" o estrenas modelo/cuenta: contexto completo en un pegado','prescate')+
      '<div class="at-hack"><b>⚡ El truco que lo une todo</b>Los prompts piden tu ESTADO. No lo escribas a mano jamás: el botón verde flotante <b>"Copiar Estado ATLAS"</b> (abajo a la derecha) genera el bloque con tu semana, racha, currículo y siguiente pendiente — leído directo de esta página. Pegar y listo: cualquier IA, cualquier modelo, cualquier día, sabe exactamente dónde vas.</div>');

    /* ── 4 · RUTA DIARIA ── */
    h+=sec('atDay','📆','Ruta diaria — registra tu día (se guarda y sincroniza)',
      '<div style="font-size:12px;color:var(--t2);margin:8px 0">Marca los bloques que cumpliste HOY y guarda una nota de 1 línea. Esto alimenta tu racha, el Estado copiable y el sync a la nube (cross-device).</div>'+
      '<div class="at-chkrow">'+
      '<label><input type="checkbox" id="atEst"> 📖 Estudio (60–90 min)</label>'+
      '<label><input type="checkbox" id="atCon"> 🔨 Construcción (45–60 min)</label>'+
      '<label><input type="checkbox" id="atEng"> 🇺🇸 Inglés (20 min)</label>'+
      '</div>'+
      '<textarea class="rt-log-area" id="atNote" placeholder="¿Qué aprendiste/construiste hoy? ¿Qué te costó? (1-3 líneas)"></textarea>'+
      '<div style="margin-top:8px"><button class="rt-pbtn rt-next" onclick="ATLAS.saveDay()" style="font-size:11px;padding:7px 14px">💾 Guardar día</button>'+
      '<span style="font-size:11px;color:var(--t3);margin-left:10px">Día mínimo viable: 30 min de estudio + nota. La racha no se rompe — se encoge.</span></div>'+
      '<div id="atDailyList" style="margin-top:12px"></div>');

    /* ── 5 · CURRÍCULO ── */
    let cur='';
    CURR.forEach(m=>{
      cur+='<div class="rt-label" style="margin-top:14px">'+m.icon+' '+m.name+' · <span style="color:var(--gn)">'+m.weeks+'</span></div>';
      m.items.forEach(i=>cur+=lesHTML(i));
    });
    h+=sec('atCur','🎓','Currículo de la maestría — 12 semanas · marca cada skill conquistada',
      '<div style="font-size:12px;color:var(--t2);margin:8px 0">Click en cada item para ver el paso a paso con links. El círculo marca completado (se guarda y sincroniza). Claude desarrolla cada lección a tu medida — esto es el mapa, él es el territorio.</div>'+cur);

    /* ── 6 · CERTIFICACIONES ── */
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
    h+=sec('atCert','🏅','Certificaciones priorizadas — gratis primero, pagas solo cuando pesan',
      '<div style="font-size:12px;color:var(--t2);margin:8px 0">Orden de ataque: las GRATIS en su módulo correspondiente. Las pagas (Duolingo, AWS) SOLO cuando la Vía B lo exija — no antes. Regla: <b>3 proyectos en GitHub valen más que 10 certificados</b>; los certificados acompañan, no reemplazan.</div>'+cert);

    /* ── 7 · INGLÉS ── */
    h+=sec('atEng2','🇺🇸','Inglés — la palanca salarial nº1 (20 min diarios, innegociable)',
      '<div class="at-step-mini">'+
      '<b>El sistema (20 min/día, ya está en tu checklist diaria):</b><br>'+
      '1. <b>Lun–Vie con Gemini Live (voz):</b> abre la Gem ATLAS·Mentor y di <i>"inglés de hoy"</i> — explica EN INGLÉS lo que programaste, ella te corrige; 5 palabras técnicas nuevas; 1 pregunta de entrevista oral.<br>'+
      '2. <b>Sábados con Claude:</b> pídele <i>"simula 10 min de entrevista técnica en inglés sobre lo que aprendí esta semana"</i> — por texto primero, por voz cuando te sientas listo.<br>'+
      '3. <b>Inmersión pasiva:</b> los videos de los cursos (DeepLearning.AI, HF) véelos en inglés con subtítulos en inglés. NotebookLM te genera resúmenes de audio en inglés de tus propios apuntes.<br><br>'+
      '<b>Medición (no opcional):</b> <a href="https://www.efset.org/" target="_blank" rel="noopener">EF SET</a> gratis en la semana 2 (línea base) y en la semana 12 (progreso). Certificado linkeable en LinkedIn. Cuando llegues a B2: Duolingo English Test para la Vía B.</div>');

    /* ── 8 · DOMINGO ── */
    h+=sec('atSun','🗓️','El Domingo Sagrado — cómo las IAs "recuerdan" todo el proyecto',
      '<div class="at-step-mini"><b>El ritual (45 min, mismo día, misma hora):</b><br>'+
      '1. Abre esta página → botón <b>Copiar Estado ATLAS</b>.<br>'+
      '2. Abre Claude → Project ATLAS → chat nuevo → pega <b>Prompt Dominical + Estado</b>. Revisión completa de KPIs y plan de la semana.<br>'+
      '3. Guarda el BLOQUE CIERRE que te dé en la bitácora (y en el registro diario de arriba).<br>'+
      '4. Re-sube BITACORA.md actualizada al Project knowledge de Claude y a la Gem de Gemini (2 min). <b>Este paso es la memoria de largo plazo de ambas IAs.</b><br>'+
      '5. (Cada 2 domingos) Pide a Gemini Deep Research UNA investigación estratégica: nichos, tarifas, o vacantes remotas junior AI LATAM.</div>'+
      '<a class="rt-pbtn rt-next" style="text-decoration:none;display:inline-flex;margin-top:6px" href="'+calLink()+'" target="_blank" rel="noopener">📅 Crear evento recurrente en Google Calendar (domingos 2:00 PM)</a>'+
      '<div class="at-hack" style="margin-top:12px"><b>🧠 Por qué funciona aunque cambien los modelos</b>La memoria del proyecto NO vive en ninguna IA: vive en TRES lugares tuyos — esta página (estado vivo sincronizado), la bitácora (historia), y GitHub (evidencia). Las IAs son motores intercambiables que leen ese estado. Si mañana cambia el modelo, el chat, o la empresa: pegas el Prompt de Rescate + Estado y sigues como si nada. Eres inmune a la rotación de modelos.</div>');

    /* ── 9 · GITHUB ── */
    h+=sec('atGH','🐙','GitHub — tu credencial pública (paso a paso)',
      '<div class="at-step-mini">'+
      '1. Tu cuenta ya existe: <a href="https://github.com/Mikel696" target="_blank" rel="noopener">github.com/Mikel696</a>. Complétala: foto, bio ("Systems Engineer → AI Engineer · Python · LLMs · Automation"), ubicación Colombia.<br>'+
      '2. Crea el repo <b>atlas-portfolio</b> (público) — semana 1, con Claude. Estructura: /proyecto-1-api, /proyecto-2-asistente, /proyecto-3-rag, README raíz que te presenta.<br>'+
      '3. <b>Perfil README:</b> crea un repo llamado exactamente <b>Mikel696</b> — su README.md se muestra en tu portada de GitHub. Claude te lo diseña (quién eres, stack, proyectos, cómo contactarte).<br>'+
      '4. <b>1 commit diario mínimo</b> (aunque sea la nota del día en el repo). El calendario verde de contribuciones es lo primero que mira un reclutador técnico.<br>'+
      '5. Semana 10: activa <b>GitHub Pages</b> en atlas-portfolio → tu web de portafolio gratis en mikel696.github.io/atlas-portfolio.<br>'+
      '6. Cada proyecto lleva README con: qué hace, screenshot/GIF, stack, cómo correrlo, qué aprendiste. Claude revisa cada README antes de publicar.</div>');

    /* ── 10 · HACKS ── */
    h+=sec('atHk','⚡','Hacks del oficio — lo que casi nadie usa',
      '<div class="at-hack"><b>1 · La IA como profesor socrático, no como máquina de respuestas</b>El 95% pide "hazme el código" y no aprende nada. Tu Prompt Maestro obliga a Claude a hacerte teclear y a no avanzar si fallas el reto. Esa fricción ES el aprendizaje. No la saltes pidiéndole el código directo — te estarías robando a ti mismo.</div>'+
      '<div class="at-hack"><b>2 · Doble profesor = detector de humo</b>Cuando algo no te cierre, pregunta lo mismo a Claude y a Gemini por separado. Si coinciden, es sólido. Si difieren, encontraste un punto fino: profundiza ahí — esos matices son los que se preguntan en entrevistas.</div>'+
      '<div class="at-hack"><b>3 · NotebookLM con TUS apuntes, no solo docs ajenos</b>Cada domingo sube tu bitácora de la semana a NotebookLM y pídele un resumen de audio. Escuchar TU propia semana narrada consolida memoria a largo plazo (efecto testing + spaced repetition gratis).</div>'+
      '<div class="at-hack"><b>4 · El API tier gratuito de Gemini como laboratorio</b>Para practicar código LLM sin gastar: la API de Gemini tiene free tier generoso. Prototipa ahí, y aprende la API de Claude con los créditos mínimos ($5) solo cuando el ejercicio lo pida. Costo de laboratorio: casi cero.</div>'+
      '<div class="at-hack"><b>5 · Construye en público (build in public)</b>1 post corto de LinkedIn cada semana desde la semana 4: "Semana N aprendiendo ingeniería de IA: construí X, aprendí Y". Los clientes de la Vía A y los reclutadores de la Vía B te encontrarán a TI — inbound, no solo outbound. Gemini redacta, tú publicas.</div>'+
      '<div class="at-hack"><b>6 · Los proyectos de cliente son currículo</b>Desde M3, cada gig se hace con estándar de portafolio: pide permiso de mostrar versión anonimizada. 3 gigs = 3 casos de estudio = tarifas más altas. El trabajo se convierte en marketing sin costo extra.</div>'+
      '<div class="at-hack"><b>7 · Al PC también le toca (Claude Code)</b>Para construir los proyectos usa Claude Code apuntando a E:\\CLAUDE\\My Project — ya tiene un CLAUDE.md con todo el contexto de ATLAS. Es la diferencia entre "chatear sobre código" y tener un ingeniero DENTRO de tu disco duro.</div>');

    /* ── Botón estado flotante ── */
    h+='<div class="at-estado"><button class="rt-pbtn rt-next" style="font-size:12px;padding:10px 18px" onclick="ATLAS.copyEstado(this)">📋 Copiar Estado ATLAS</button></div>';

    stub.innerHTML=h;
    renderHeader();renderDaily();loadToday();
  }

  document.addEventListener('DOMContentLoaded',render);
  if(document.readyState!=='loading')render();

  return{render,saveDay,togItem,copyPrompt,copyEstado,buildEstado};
})();
