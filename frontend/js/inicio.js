/* 1-IND · Portada «Cerebro 2» (O5.2, 24-nov-2026), sobre el boceto v3 que Miguel aprobó el 24-nov (sin el radar de noticias: lo quitó él).
   SOLO LECTURA: no escribe ninguna key de localStorage. Cada lectura llama a localStorage.getItem en ese momento:
   con cloud-sync cargado es el envuelto, que también devuelve lo que no cupo en disco (p21).
   Se carga antes que la cadena de sesión (CDN de Supabase) para pintar sin esperarla; vuelve a pintar con cada
   evento de sincronización. La evaluación de cada módulo vive en data/modulos.json. */
'use strict';

const INICIO = (() => {
  const $ = id => document.getElementById(id);
  const LS = {
    raw: k => { try { return localStorage.getItem(k); } catch { return null; } },
    json: k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
    keys: () => { try { return Object.keys(localStorage); } catch { return []; } }
  };
  const MES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const esc = t => String(t ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const dia = iso => { const [, m, d] = String(iso).slice(0,10).split('-'); return (+d)+' '+MES[m-1]; };
  const mes = iso => { const [y, m] = String(iso).slice(0,10).split('-'); return MES[m-1]+' '+y; };
  const diaLocal = ms => { const f = new Date(ms); return f.getDate()+' '+MES[f.getMonth()]; };
  const fmt = {};
  const num = (v, dec = 0) => (fmt[dec] ||= new Intl.NumberFormat('es-CO', {minimumFractionDigits:dec, maximumFractionDigits:dec})).format(v);
  const hoy = () => { const h = new Date(); return h.getFullYear()+'-'+String(h.getMonth()+1).padStart(2,'0')+'-'+String(h.getDate()).padStart(2,'0'); };
  const len = v => Array.isArray(v) ? v.length : (v && typeof v === 'object') ? Object.keys(v).length : 0;
  const hace = ms => { const d = Math.floor((Date.now()-ms)/864e5); return d<=0 ? 'hoy' : d===1 ? 'ayer' : d<30 ? 'hace '+d+' d' : d<365 ? 'hace '+Math.round(d/30)+' m' : 'hace +1 año'; };
  const linea = (serie, desde, color, alto = 30) => {
    const pts = (serie||[]).filter(p => p[0] >= desde); if (pts.length < 2) return '';
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const d = pts.map((p,i) => (i?'L':'M')+((p[0]-x0)/(x1-x0||1)*200).toFixed(1)+' '+((alto-2)-(p[1]-y0)/(y1-y0||1)*(alto-4)).toFixed(1)).join(' ');
    return '<svg class="spark" viewBox="0 0 200 '+alto+'" preserveAspectRatio="none" aria-hidden="true"><path d="'+d+'" fill="none" stroke="'+color+'" stroke-width="1.8" vector-effect="non-scaling-stroke"/></svg>';
  };

  /* Datos públicos del sitio (foto diaria, directorio, evaluación). Si la red falla, usa la última copia buena
     de este navegador (Cache Storage, no localStorage) y lo dice: un dato sin fecha no se muestra. */
  const CACHE = 'inicio-datos';
  async function traer(u){
    try {
      const r = await fetch(u, {cache:'no-cache'});
      if (r.ok) {
        const copia = r.clone(), d = await r.json();
        if (window.caches) caches.open(CACHE).then(c => c.put(u, copia)).catch(() => {});
        return {d, guardado:false};
      }
    } catch {}
    try { const r = window.caches && await (await caches.open(CACHE)).match(u); if (r) return {d: await r.json(), guardado:true}; } catch {}
    return null;
  }
  const DATOS = {};   // macro: undefined = leyendo, null = no se pudo
  let EVAL = null, LAZOS = [], NOTA_EVAL = '', evalEstado = 'leyendo';

  // ── Los 19 módulos: qué son, qué leen de tus datos y dónde abren. `id` es el hash del router (#systems…).
  //    Los 7 con `grande` van en tarjeta; el resto, a un clic en «Más módulos».
  const MODS = [
    {n:'10',s:'SYS',fam:'estudio',nombre:'Ingeniería de Sistemas',c:'Sistemas',url:'systems.html',id:'systems',pre:['sys_'],grande:'g5',
     d:'Tus materias de la CUN en el 9.º semestre: actividades, notas y el bloque en curso.',
     info(){ const w = (LS.json('sys_week_live')||{}).weeks || []; if (!w.length) return null; const h = hoy();
       const cur = w.find(x => x.start <= h && h <= x.end) || w[0], st = LS.json('sys_week_state') || {}, it = cur.items || [];
       const hechas = it.filter(i => st[i.id] && st[i.id].done).length;
       const abiertas = it.filter(i => !(st[i.id] && st[i.id].done) && i.due).sort((a,b) => a.due < b.due ? -1 : 1);
       const prox = abiertas.find(i => i.due.slice(0,10) >= h);
       return {stats:[[hechas+'/'+it.length,'hechas en el parte '+cur.id],[w.length,'partes guardados']], prog:it.length ? hechas/it.length : 0,
         linea: prox ? 'Siguiente: «'+prox.title+'», vence el '+dia(prox.due)+'.' : abiertas.length ? 'El parte '+cur.id+' no tiene fechas por venir; '+abiertas.length+' con fecha pasada sin marcar.' : 'El parte '+cur.id+' no tiene actividades abiertas.'}; }},
    {n:'13',s:'NOT',fam:'vida',nombre:'Notas',c:'Notas',url:'notes.html',id:'notes',pre:['not_'],grande:'g4',
     d:'Notas, diario y cuadernos con repaso espaciado.',
     info(){ const meta = LS.json('not_nb_meta'), d = LS.json('not_nb_data'); if (!len(meta) && !len(d)) return null;
       return {stats:[[len(meta)||len(d),'cuadernos'],[d ? Object.values(d).reduce((k,x) => k + len(x && x.pages), 0) : 0,'páginas']]}; }},
    {n:'3',s:'ENG',fam:'estudio',nombre:'English Academy',c:'Inglés',url:'english.html',id:'english',pre:['eng_','dojo_'],grande:'',
     d:'Gramática, vocabulario, conversación y el Dojo de entrevistas, con voz.',
     info(){ const deck = LS.json('eng_srs_deck'), tp = LS.json('eng_tense_progress') || {}, sk = LS.json('eng_streak');
       const v = Object.values(tp).filter(x => x && x.viewed).length, dm = Object.values(tp).filter(x => x && x.mastered).length;
       if (!len(deck) && !v) return null;
       return {stats:[[num(len(deck)),'tarjetas en tu mazo'],[dm+'/'+v,'tiempos dominados']], linea: sk && sk.last ? 'Última práctica: '+dia(sk.last)+'.' : ''}; }},
    {n:'14',s:'WOR',fam:'carrera',nombre:'Trabajo',c:'Trabajo',url:'work.html',id:'work',pre:['work_'],grande:'',
     d:'Tus cuadernos de trabajo. El coach de procesos con IA está en obra.',
     info(){ const d = LS.json('work_nb_data'); if (!len(d)) return null;
       return {stats:[[len(d),'cuadernos'],[Object.values(d).reduce((k,x) => k + len(x && x.pages), 0),'páginas']]}; }},
    {n:'17',s:'IA',fam:'ia',nombre:'AI Dojo',c:'Dojo IA',url:'pages/ai-dojo.html',id:'aidojo',pre:['ia_'],grande:'',
     d:'El taller: proyectos con varias IA, misiones por cinturones y criterio.',
     info(){ const s = LS.json('ia_streak'); return s && s.last ? {stats:[], linea:'Última práctica: '+dia(s.last)+'.'} : null; }},
    {n:'18',s:'MUS',fam:'ia',nombre:'Cerebro Musical',c:'Música',url:'music.html',id:'music',pre:['mus_'],grande:'',
     d:'Teoría que suena, el ADN de 10 géneros y la fábrica de canciones.',
     info(){ const p = LS.json('mus_proy'); return p && p.titulo ? {stats:[[p.bpm||'—','BPM'],[len(p.pistas),'pistas']], linea:'Proyecto abierto: «'+p.titulo+'».'} : null; }},
    {n:'12',s:'FIN',fam:'vida',nombre:'Finanzas',c:'Finanzas',url:'finance.html',id:'finance',pre:['fin_'],grande:'',
     d:'Datos oficiales de Colombia, calculadoras y tus cuentas.',
     info(){ const D = DATOS.macro;
       if (D === undefined) return {stats:[['…','dólar hoy (TRM)'],['…','tasa BanRep']], hueco:true};   // reserva el sitio: sin saltos al llegar
       return D && D.trm ? {stats:[['$ '+num(D.trm.value,0),'dólar hoy (TRM)'],[num(D.policy.value,2)+' %','tasa BanRep']], spark:D.trm.series} : null; }},
    {n:'5',s:'JOB',fam:'carrera',nombre:'Job Tracker',c:'Vacantes',url:'jobs.html',id:'jobs',pre:['jt_','da_vacancies'],
     d:'El radar diario de vacantes y tu tablero de postulaciones.',
     info(){ const v = LS.json('da_vacancies'), j = DATOS.jobs; return len(v) || j ? {stats:[[len(v),'vacantes en tu tablero'], ...(j ? [[j.relevantes,'relevantes en el radar del '+dia(j.fecha)]] : [])]} : null; }},
    {n:'2',s:'APP',fam:'carrera',nombre:'Application Center',c:'Postular',url:'apply.html',id:'apply',pre:['app_','apply_'],
     d:'Analiza una vacante y arma la hoja de vida, la carta y la entrevista.',
     info(){ const a = LS.json('app_analyses'); return len(a) ? {stats:[[len(a),'vacantes analizadas']]} : null; }},
    {n:'16',s:'APA',fam:'info',nombre:'APA Document Studio',c:'APA 7',url:'apa.html',id:'apa',pre:['apa_','tools_apa_docs'],
     d:'Trabajos académicos en APA 7 con vista previa por páginas.',
     info(){ const a = LS.json('tools_apa_docs'); return len(a) ? {stats:[[len(a),'documentos']]} : null; }},
    {n:'15',s:'MM',fam:'info',nombre:'Mind Map Studio',c:'Mapas',url:'mindmap.html',id:'mindmap',pre:['tools_mindmaps','tools_canvases'],
     d:'Mapas mentales y un lienzo libre para ordenar ideas.',
     info(){ const m = LS.json('tools_mindmaps'), c = LS.json('tools_canvases'); return len(m) || len(c) ? {stats:[[len(m),'mapas'],[len(c),'lienzos']]} : null; }},
    {n:'4',s:'RUT',fam:'estudio',nombre:'Ruta Data Analyst',c:'Ruta datos',url:'ruta.html',id:'ruta',pre:['ruta','excel_','atlas_'],
     d:'De Excel a Power BI en 7 fases, con simulador de pruebas técnicas de Excel.'},
    {n:'8',s:'PRO',fam:'ia',nombre:'Prompt Lab',c:'Prompts',url:'prompts.html',id:'prompts',pre:['plab_'],
     d:'Prompts listos por tarea y el plan del Cerebro.',
     info(){ const h = LS.json('plab_h'); return len(h) ? {stats:[[len(h),'prompts optimizados']]} : null; }},
    {n:'17',s:'IA',sub:'b',fam:'ia',nombre:'AI Engine',c:'Biblioteca IA',url:'pages/ai-engine.html',id:'aiengine',pre:[],
     d:'La biblioteca: términos, catálogo de herramientas y prompts.'},
    {n:'19',s:'JUE',fam:'vida',nombre:'Juegos',c:'Juegos',url:'juegos.html',id:'juegos',pre:['jue_'],
     d:'Corredor: una misión de 6,3 km para jugar con control o teclado.',
     info(){ const r = LS.json('jue_records'); if (!r) return null; let n = 0; Object.values(r).forEach(j => Object.values(j||{}).forEach(a => n += len(a))); return {stats:[[n,'récords guardados']]}; }},
    {n:'6',s:'TOO',fam:'estudio',nombre:'Hub de Sistemas',c:'Hub',url:'tools.html',id:'tools',pre:[],
     d:'Temas de la carrera con casos reales, y mantenimiento del PC.'},
    {n:'7',s:'NEW',fam:'info',nombre:'Noticias',c:'Noticias',url:'news.html',id:'news',pre:['news_'],
     d:'Noticias de datos, IA y tecnología.'},
    {n:'11',s:'ACC',fam:'carrera',nombre:'Contabilidad',c:'Contabilidad',url:'accounting.html',id:'accounting',pre:[],
     d:'Ruta de contabilidad, ADP y entrevistas con el método STAR.'},
    {n:'9',s:'GOA',fam:'vida',nombre:'Objetivos',c:'Objetivos',url:'goals.html',id:'goals',pre:['sb_goals'],
     d:'Metas a 30, 60 y 90 días, y hábitos.',
     info(){ const g = LS.json('sb_goals'); return len(g) ? {stats:[[len(g),'metas'],[g.filter(x => x.done).length,'cumplidas']]} : null; }}
  ];
  const FAM = {estudio:'Estudio', carrera:'Trabajo y carrera', ia:'IA y creación', vida:'Vida', info:'Escribir, pensar, leer'};
  MODS.forEach(m => m.k = m.n+m.s+(m.sub||''));
  const porK = k => MODS.find(m => m.k === k);
  const sim = m => esc(m.s)+(m.sub ? '<sub>'+esc(m.sub)+'</sub>' : '');
  const codigo = m => m.n+'-'+m.s+(m.sub?'.'+m.sub:'');
  const infoDe = m => { try { return m.info ? m.info() : null; } catch { return null; } };
  function ultimos(){   // hora del último cambio de cada módulo, de los sellos de cloud-sync
    const TS = LS.json('_cloud_ts') || {}, v = t => typeof t === 'number' ? t : (+t || Date.parse(t) || 0);
    MODS.forEach(m => { let u = 0; for (const [k,t] of Object.entries(TS)) if (m.pre.some(p => k.startsWith(p)) && v(t) > u) u = v(t); m.ult = u; });
    return Math.max(0, ...Object.values(TS).map(v).filter(Boolean));
  }

  // ── Sesión, sincronización y disco ──
  let vencida = false;
  function sesion(){
    try { const u = window.AUTH && AUTH.getUser(); if (u) return {si:true, correo:u.email || ''}; } catch {}
    const k = LS.keys().find(x => /^sb-.*-auth-token$/.test(x)), t = k && LS.json(k);
    return t && t.user ? {si:true, correo:t.user.email || ''} : {si:false, correo:''};
  }
  function estadoSync(){
    let pend = 0, sync = false;
    try { pend = window.CLOUD && CLOUD.outboxCount ? CLOUD.outboxCount() : len(LS.json('cloud_outbox')); } catch {}
    try { sync = !!(window.CLOUD && CLOUD.diagnostics && CLOUD.diagnostics().syncing); } catch {}
    const ses = sesion();
    const s = !navigator.onLine ? 'off' : !ses.si ? 'nada' : vencida ? 'exp' : pend ? 'pend' : sync ? 'sync' : 'ok';
    return {s, pend, ses};
  }
  function disco(){   // bytes en disco (UTF-16). Con cloud-sync, su reporte; sin él, la suma de keys.
    try { if (window.CLOUD && CLOUD.storageReport) return CLOUD.storageReport().totalKB * 2048; } catch {}
    let b = 0; LS.keys().forEach(k => b += (k.length + (LS.raw(k)||'').length) * 2); return b;
  }
  const llavesRespaldo = () => {
    let enMemoria = []; try { enMemoria = (window.CLOUD && CLOUD.storageReport && CLOUD.storageReport().unsaved) || []; } catch {}
    return [...new Set([...LS.keys(), ...enMemoria])].filter(k => !/^sb-.*-auth-token$/.test(k) && !k.startsWith('karen_'));
  };
  function nombre(){ return (LS.raw('sb_name') || '').replace(/["“”']/g,'').trim(); }   // sb_name se guardó con comillas: se limpian al mostrar

  // ── Cabecera, reloj, HUD y cuenta ──
  function saludo(){
    const h = new Date(), p = h.getHours() < 12 ? 'Buenos días' : h.getHours() < 19 ? 'Buenas tardes' : 'Buenas noches', n = nombre();
    $('hora').textContent = h.getHours()+':'+String(h.getMinutes()).padStart(2,'0');
    $('hola').textContent = p + (n ? ', '+n.split(/\s+/)[0] : '') + '.';
    $('fecha').textContent = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][h.getDay()]+' '+h.getDate()+' de '+['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'][h.getMonth()]+'.';
    $('ini').textContent = (n || sesion().correo || '·').split(/[\s@.]+/).filter(Boolean).slice(0,2).map(x => x[0].toUpperCase()).join('');
  }
  const SYNC = {ok:'Al día', sync:'Sincronizando', off:'Sin internet', nada:'Sin sesión', exp:'Sesión vencida'};
  const COL = {ok:'var(--vida)', pend:'var(--alerta)', sync:'var(--alerta)', off:'var(--mal)', exp:'var(--mal)', nada:'var(--texto-3)'};
  function hud(){
    const {s, pend} = estadoSync(), pct = Math.round(disco() / (10*1048576) * 100), ult = ultimos();
    const activos = MODS.filter(m => m.ult && Date.now()-m.ult < 30*864e5).length;
    $('hud').innerHTML =
      '<div class="r"><span>Sincronización</span><b style="--c:'+COL[s]+'"><i></i>'+(s === 'pend' ? pend+' por subir' : SYNC[s])+'</b></div>'+
      '<div class="r"><span>Disco del navegador</span><b style="--c:'+(pct>=85?'var(--mal)':pct>=70?'var(--alerta)':'var(--vida)')+'"><i></i>'+pct+' %</b></div>'+
      '<div class="r"><span>Módulos con cambios en 30 días</span><b style="--c:var(--info)"><i></i>'+activos+' de '+MODS.length+'</b></div>'+
      (ult ? '<div class="r"><span>Último cambio</span><b style="--c:var(--ia)"><i></i>'+hace(ult)+'</b></div>' : '');
    $('avatar').dataset.s = s;
  }
  function cuenta(){
    const {s, pend, ses} = estadoSync(), b = disco(), pct = Math.min(100, Math.round(b / (10*1048576) * 100)), n = nombre(), resp = llavesRespaldo();
    const txt = {off:'Sin internet: los cambios quedan en este navegador y suben al volver la conexión.',
      nada:'Sin sesión en este navegador: tus datos no se respaldan en la nube.',
      exp:'La sesión venció: vuelve a entrar para que tus cambios suban. Mientras tanto quedan en este navegador.',
      sync:'Cruzando tus cambios con la nube.', pend: pend+(pend===1?' cambio espera':' cambios esperan')+' para subir a la nube.',
      ok:'Todo lo de este navegador está subido a la nube.'}[s];
    const entrar = !ses.si || s === 'exp'
      ? (window.AUTH && window.SB ? '<button class="resp entrar" id="entrar">Iniciar sesión<small>Para respaldar en la nube y ver tus datos en otro equipo.</small></button>'
                     : '<p class="vacio">El inicio de sesión necesita internet: el servicio de sesión no cargó.</p>')
      : '';
    $('cuenta').innerHTML =
      '<div class="quien"><span class="ini">'+esc($('ini').textContent)+'</span><div><b>'+esc(n || 'Sin nombre')+'</b><span>'+esc(ses.correo || 'sin sesión')+'</span></div></div>'+
      '<h3>Sincronización</h3><p>'+esc(txt)+'</p>'+entrar+
      '<h3>Disco del navegador</h3><div class="disco'+(pct>=85?' alto':'')+'"><i style="width:'+pct+'%"></i></div>'+
      '<p>≈ '+num(b/1048576,1)+' MB de unos 10 MB que da Chrome ('+pct+' %).</p>'+
      '<button class="resp" id="respaldo">Descargar respaldo<small>'+resp.length+' keys de este navegador en un archivo .json. No incluye tu sesión.</small></button>'+
      (ses.si && window.AUTH && window.SB ? '<button class="salir" id="salir">Cerrar sesión en este navegador</button>' : '');
  }
  function respaldo(){
    const datos = {}; llavesRespaldo().forEach(k => { const v = LS.raw(k); if (v != null) datos[k] = v; });
    const blob = new Blob([JSON.stringify({exportado:new Date().toISOString(), origen:location.origin, keys:datos})], {type:'application/json'});
    const a = Object.assign(document.createElement('a'), {href:URL.createObjectURL(blob), download:'cerebro-respaldo-'+hoy()+'.json'});
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  // ── Bento: los 7 módulos que más te aportan, en grande y con sus datos; el resto, a un clic ──
  let primera = true;
  function tarjetas(){
    ultimos();
    const html = MODS.filter(m => m.grande !== undefined).map((m,i) => {
      const d = infoDe(m);
      return '<article class="vid card'+(primera?' entra':'')+' f-'+m.fam+' '+(m.grande||'')+'" style="--i:'+(i+3)+'" data-k="'+m.k+'">'+
        '<div class="top"><span class="cod">'+esc(codigo(m))+'</span><span class="ult">'+(m.ult ? esc(hace(m.ult)) : '')+'</span>'+
        '<button class="info" data-det="'+m.k+'" aria-label="Detalle de '+esc(m.nombre)+'">i</button></div>'+
        '<div class="sim" aria-hidden="true">'+sim(m)+'</div><h2>'+esc(m.nombre)+'</h2>'+
        (d && d.linea ? '<p class="linea">'+esc(d.linea)+'</p>' : '')+
        (d && d.prog != null ? '<div class="prog"><i style="width:'+Math.round(d.prog*100)+'%"></i></div>' : '')+
        (d && d.spark ? linea(d.spark, Date.now()-90*864e5, 'var(--vida)', 36) : d && d.hueco ? '<svg class="spark" aria-hidden="true"></svg>' : '')+
        (d && d.stats && d.stats.length ? '<div class="datos">'+d.stats.slice(0,2).map(([v,l]) => '<div><b>'+esc(typeof v==='number'?num(v):v)+'</b><span>'+esc(l)+'</span></div>').join('')+'</div>'
          : '<p class="linea des">'+esc(m.d)+'</p>')+
        '<a class="ir" href="'+esc(m.url)+'"><span class="oculto">Abrir '+esc(m.nombre)+'</span></a></article>';
    }).join('');
    if ($('bento').innerHTML !== html) $('bento').innerHTML = html;
    const mas = '<h2>Más módulos</h2>'+MODS.filter(m => m.grande === undefined).map(m =>
      '<a class="chip f-'+m.fam+(m.ult && Date.now()-m.ult > 45*864e5 ? ' dormido' : '')+'" href="'+esc(m.url)+'" data-k="'+m.k+'"><b aria-hidden="true">'+sim(m)+'</b><span>'+esc(m.c)+'<small>'+(m.ult ? esc(hace(m.ult)) : esc(codigo(m)))+'</small></span></a>').join('');
    if ($('mas').innerHTML !== mas) $('mas').innerHTML = mas;
    primera = false;
  }

  // ── Detalle en panel lateral (dialog nativo): evaluación, datos, conexiones ──
  const barras = n => '<span class="barras" role="img" aria-label="'+n+' de 5">'+[1,2,3,4,5].map(i => '<i'+(i<=n?' class="on"':'')+'></i>').join('')+'</span>';
  function detalle(m){
    if (!m) return; const det = $('detalle'), d = infoDe(m), ev = EVAL && EVAL[m.k];
    const lz = LAZOS.filter(l => l[0] === m.k || l[1] === m.k).map(l => ({o: porK(l[0] === m.k ? l[1] : l[0]), q: l[2]})).filter(x => x.o);
    det.style.setProperty('--c', 'var(--'+m.fam+')');
    det.innerHTML = '<button class="cerrar" data-cerrar>Cerrar</button><div class="sim" aria-hidden="true">'+sim(m)+'</div><p class="cod">'+esc(codigo(m))+' · '+esc(FAM[m.fam])+'</p>'+
      '<h2>'+esc(m.nombre)+'</h2><p class="des">'+esc(m.d)+'</p>'+
      (ev ? '<div class="eval"><div>Desarrollo'+barras(ev.nivel)+'</div><div>Te aporta hoy'+barras(ev.aporte)+'</div></div>'+
            '<p class="sirve">'+(ev.sirve||[]).map(x => '<i>'+esc(x)+'</i>').join('')+'</p><p class="como"><b>Cómo aprovecharlo.</b> '+esc(ev.como)+'</p><p class="ver">'+esc(ev.ver)+'</p>'
          : '<p class="linea"><small>'+(evalEstado === 'leyendo' ? 'Leyendo la evaluación…' : 'La evaluación no se pudo leer (sin conexión y sin copia guardada).')+'</small></p>')+
      (d && !d.hueco && d.stats && d.stats.length ? '<div class="stats">'+d.stats.map(([v,l]) => '<div class="stat"><b>'+esc(typeof v==='number'?num(v):v)+'</b><span>'+esc(l)+'</span></div>').join('')+'</div>' : '')+
      (d && d.linea ? '<p class="linea">'+esc(d.linea)+'</p>' : '')+
      '<p class="linea"><small>'+(m.ult ? 'Último cambio en este navegador: '+esc(hace(m.ult))+' ('+diaLocal(m.ult)+').' : !m.pre.length ? 'Este módulo no guarda datos propios.' : 'Sin hora de último cambio en este navegador.')+'</small></p>'+
      (lz.length ? '<div class="lazos">'+lz.map(x => '<button data-det="'+x.o.k+'" title="'+esc(x.q)+'">'+esc(codigo(x.o))+'</button>').join('')+'</div>' : '')+
      (ev && NOTA_EVAL ? '<p class="linea"><small>'+esc(NOTA_EVAL)+'</small></p>' : '')+
      '<div class="acc"><a class="abrir" href="'+esc(m.url)+'">Abrir '+esc(m.c)+'</a><a class="otra" href="'+esc(m.url)+'" target="_blank" rel="noopener">Pestaña nueva</a></div>';
    if (!det.open) det.showModal();
  }

  // ── Pulso de Colombia (foto diaria de 12-FIN) ──
  function pulso(macro, jobs){
    const el = $('pulso'), out = [], D = macro && macro.d && macro.d.data, ahora = Date.now();
    DATOS.macro = D || null;
    if (D) {
      $('pulsoFecha').innerHTML = 'foto del '+dia(macro.d.generatedAt)+(macro.guardado ? '<br><span class="guardado">copia guardada, sin conexión</span>' : '');
      const f = (k, val, cuando, dias, ventana) => D[k] && D[k].value != null && out.push('<div class="medida"><div class="v">'+val(D[k].value)+'</div><div class="l">'+esc(D[k].label)+'</div>'+
        linea(D[k].series, ahora - dias*864e5, 'var(--info)', 26)+'<div class="f">'+cuando(D[k].asOf)+'. Línea: '+ventana+'. '+esc(D[k].source)+'</div></div>');
      f('trm', v => '$ '+num(v,2), a => 'Vigente el '+dia(a), 90, '90 días');
      f('policy', v => num(v,2)+' %', a => 'Efectiva anual, al '+dia(a), 365, '12 meses');
      f('cpi', v => num(v,2)+' %', a => 'Anual, a '+mes(a), 365, '12 meses');
      f('unemp', v => num(v,1)+' %', a => 'A '+mes(a), 365, '12 meses');
    }
    const J = jobs && jobs.d && jobs.d.resumen;
    if (J) DATOS.jobs = {relevantes:J.relevantes, revisadas:J.revisadas, fecha:jobs.d.generatedAt};
    el.innerHTML = out.length ? out.join('') : '<p class="vacio">No se pudo leer la foto diaria y no hay copia guardada en este navegador. Los módulos funcionan igual; vuelve a cargar con internet.</p>';
    tarjetas();
  }

  // ── Ofertas: directorio fijo; Black Friday y Cyber Monday se calculan, no se escriben a mano ──
  function ofertas(r){
    const cuerpo = $('ofertasCuerpo'), d = r && r.d;
    if (!d || !Array.isArray(d.clases)) { cuerpo.innerHTML = '<p class="vacio">No se pudo leer el directorio y no hay copia guardada. Vuelve a cargar con internet.</p>'; return; }
    $('ofertasN').textContent = d.clases.reduce((k,c) => k + c.sitios.length, 0)+' páginas';
    const h = new Date(); h.setHours(0,0,0,0); let aviso = '';
    for (const y of [h.getFullYear(), h.getFullYear()+1]) {
      const n1 = new Date(y,10,1), j = 1 + ((4 - n1.getDay() + 7) % 7) + 21, bf = new Date(y,10,j+1), cm = new Date(y,10,j+4);
      const dB = Math.round((bf-h)/864e5), dC = Math.round((cm-h)/864e5);
      if (dC < 0) continue; if (dB > 30) break;
      const c = (x,f) => x===0 ? 'es hoy' : x<0 ? 'ya empezó' : x===1 ? 'es mañana' : 'en '+x+' días ('+f.getDate()+' '+MES[f.getMonth()]+')';
      aviso = '<p class="temporada">Black Friday '+c(dB,bf)+'. Cyber Monday '+c(dC,cm)+'.</p>'; break;
    }
    cuerpo.innerHTML = aviso + (r.guardado ? '<p class="temporada guardado">Copia guardada en este navegador: sin conexión.</p>' : '') +
      d.clases.map(c => '<div class="grupo"><h3>'+esc(c.nombre)+'</h3>'+c.sitios.filter(s => /^https:\/\//.test(s.url||'')).map(s =>
      '<a href="'+esc(s.url)+'" target="_blank" rel="noopener"><b>'+esc(s.nombre)+'</b>'+(s.top?'<i class="empieza">Empieza aquí</i>':'')+'<span>'+esc(s.para)+'</span></a>').join('')+'</div>').join('');
  }

  // ── Buscador (Ctrl K) ──
  const EXTRA = [
    {s:'RES', nombre:'Descargar respaldo', d:'tus datos en un .json', hacer:() => { $('cuenta').showPopover(); $('respaldo').focus(); }},
    {s:'OFE', nombre:'Ofertas y eventos', d:'directorio de páginas', hacer:() => $('ofertas').showPopover()},
    {s:'PUL', nombre:'Pulso de Colombia', d:'dólar, tasas, inflación', hacer:() => $('pulso').scrollIntoView({behavior:'smooth'})}];
  let vis = [], sel = 0;
  const norm = t => t.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
  function pintarPaleta(){
    const q = $('q'), t = norm(q.value.trim());
    const cands = [...MODS.map(m => ({...m, texto:norm(m.n+' '+m.s+' '+m.c+' '+m.nombre+' '+m.d+' '+FAM[m.fam]+' '+((EVAL && EVAL[m.k] && EVAL[m.k].como) || ''))})),
                   ...EXTRA.map(x => ({...x, texto:norm(x.s+' '+x.nombre+' '+x.d)}))];
    vis = t ? cands.filter(c => t.split(/\s+/).every(p => c.texto.includes(p))) : cands;
    sel = Math.min(sel, Math.max(vis.length-1, 0));
    $('resultados').innerHTML = vis.length ? vis.map((c,i) => '<li role="option" id="op'+i+'" data-i="'+i+'" aria-selected="'+(i===sel)+'" style="--c:var(--'+(c.fam||'texto')+')"><span class="s">'+esc(c.s)+(c.sub?esc(c.sub):'')+'</span><span>'+esc(c.nombre)+'</span><span class="d">'+esc(c.fam ? codigo(c)+(c.ult?', '+hace(c.ult):'') : c.d)+'</span></li>').join('')
      : '<li role="option" aria-disabled="true" aria-selected="false" class="vacio">Nada con «'+esc(q.value)+'». Prueba con el código de tres letras o el número del módulo.</li>';
    q.setAttribute('aria-activedescendant', vis.length ? 'op'+sel : '');
  }
  function ir(c){ if (!c) return; $('paleta').close(); c.hacer ? c.hacer() : window.Cerebro.go(c.id); }
  function abrirPaleta(){ ultimos(); $('q').value = ''; sel = 0; pintarPaleta(); $('paleta').showModal(); $('q').focus(); }

  // ── Repintado: después de cada sync o cambio en otra pestaña; nunca mientras hay un módulo abierto encima ──
  let tRef = 0, tHud = 0;
  function refrescar(){ clearTimeout(tRef); tRef = setTimeout(() => { if (document.body.classList.contains('in-frame')) return;
    try { saludo(); hud(); tarjetas(); } catch (e) { console.warn('[INICIO] repintado', e); } }, 250); }
  function hudPronto(){ clearTimeout(tHud); tHud = setTimeout(() => { try { hud(); } catch {} }, 200); }

  function init(){
    for (const f of [saludo, hud, tarjetas]) { try { f(); } catch (e) { console.warn('[INICIO]', f.name, e); } }
    setInterval(() => { try { saludo(); } catch {} }, 30000);
    traer('data/modulos.json').then(r => {
      if (r && r.d && r.d.modulos) { EVAL = r.d.modulos; LAZOS = r.d.lazos || []; NOTA_EVAL = (r.d.nota || '') + (r.guardado ? ' (copia guardada, sin conexión)' : ''); evalEstado = 'ok'; }
      else evalEstado = 'falla';
      const det = $('detalle'); if (det.open && det.dataset.k) detalle(porK(det.dataset.k));
    });
    Promise.all([traer('data/macro-co.json'), traer('data/jobs-feed.json')]).then(([m, j]) => pulso(m, j));
    traer('data/ofertas-directorio.json').then(ofertas);

    // Luz que sigue al mouse dentro de cada tarjeta (una variable CSS; sin repintar nada).
    $('bento').addEventListener('pointermove', e => { const c = e.target.closest('.card'); if (!c) return; const r = c.getBoundingClientRect();
      c.style.setProperty('--mx', (e.clientX-r.left)+'px'); c.style.setProperty('--my', (e.clientY-r.top)+'px'); });
    document.addEventListener('click', e => {
      const b = e.target.closest('[data-det]'); if (b) { e.preventDefault(); const m = porK(b.dataset.det); $('detalle').dataset.k = m ? m.k : ''; detalle(m); return; }
      const det = $('detalle');
      if (e.target.closest('[data-cerrar]')) { det.close(); return; }
      if (e.target === det) { const r = det.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) det.close(); }
      if (e.target.closest('#respaldo')) respaldo();
      if (e.target.closest('#entrar')) { $('cuenta').hidePopover(); window.AUTH && AUTH.openModal(); }
      if (e.target.closest('#salir')) { $('cuenta').hidePopover(); window.AUTH && AUTH.signOut(); }
    });
    $('cuenta').addEventListener('beforetoggle', e => { if (e.newState === 'open') try { cuenta(); } catch (err) { console.warn('[INICIO] cuenta', err); } });

    $('abrirPaleta').addEventListener('click', abrirPaleta);
    document.addEventListener('keydown', e => {
      const pal = $('paleta');
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); pal.open ? pal.close() : abrirPaleta(); }
      else if (e.key === '/' && !pal.open && !$('detalle').open && !/input|textarea|select/i.test(document.activeElement.tagName)) { e.preventDefault(); abrirPaleta(); }
    });
    $('q').addEventListener('input', () => { sel = 0; pintarPaleta(); });
    $('q').addEventListener('keydown', e => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); sel = (sel + (e.key==='ArrowDown'?1:-1) + vis.length) % Math.max(vis.length,1); pintarPaleta(); $('resultados').querySelector('[aria-selected="true"]')?.scrollIntoView({block:'nearest'}); }
      else if (e.key === 'Enter') { e.preventDefault(); ir(vis[sel]); }
    });
    $('resultados').addEventListener('click', e => { const li = e.target.closest('li[data-i]'); if (li) ir(vis[+li.dataset.i]); });
    $('paleta').addEventListener('click', e => { if (e.target === $('paleta')) $('paleta').close(); });

    ['cloud:sync_complete','cloud:realtime_change','cloud:force_resynced','cloud:auto_resynced','sb:signed_in','sb:signed_out','online','offline','storage']
      .forEach(ev => addEventListener(ev, refrescar));
    addEventListener('sb:signed_in', () => { vencida = false; });
    addEventListener('cloud:session_expired', () => { vencida = true; hudPronto(); });
    addEventListener('cloud:outbox_change', hudPronto);
  }

  return { init, refrescar, MODS, esc, sim, codigo, porK };
})();

// ═══ Cerebro Router · cada módulo abre dentro de #stageFrame sin salir de la portada ═══
// El hash (#systems, #apply…) deja enlazar un módulo directo. cloud-sync.js, dentro del iframe, esconde el
// «← Cerebro» y el botón de sesión duplicado, y llama a parent.Cerebro.go('home').
const Cerebro = (() => {
  const $ = id => document.getElementById(id);
  const MODS = INICIO.MODS, porId = id => MODS.find(m => m.id === id);
  const porUrl = Object.fromEntries(MODS.map(m => [m.url, m.id]));
  let tip = null;
  function mostrarTip(el){
    if (matchMedia('(max-width:768px)').matches) return;
    if (!tip) { tip = document.createElement('div'); tip.id = 'cerebroTip'; tip.setAttribute('role','tooltip'); document.body.appendChild(tip); }
    const r = el.getBoundingClientRect(), m = porId(el.dataset.mod);
    tip.innerHTML = INICIO.esc(m ? m.nombre : 'Inicio') + (m ? '<small>'+INICIO.esc(INICIO.codigo(m))+'</small>' : '');
    tip.style.top = (r.top + r.height/2)+'px'; tip.style.left = (r.right + 10)+'px'; tip.classList.add('on');
  }
  const ocultarTip = () => tip && tip.classList.remove('on');
  function rail(){
    const boton = m => '<button class="rail-btn f-'+m.fam+'" data-mod="'+m.id+'" aria-label="'+INICIO.esc(m.nombre)+'">'+INICIO.sim(m)+'</button>';
    const grandes = MODS.filter(m => m.grande !== undefined), resto = MODS.filter(m => m.grande === undefined);
    $('railMods').innerHTML = grandes.map(boton).join('') + '<span class="rail-sep" aria-hidden="true"></span>' + resto.map(boton).join('');
    const nav = $('rail');
    nav.addEventListener('click', e => { const b = e.target.closest('[data-mod]'); if (b) { ocultarTip(); go(b.dataset.mod); } });
    $('railInicio').addEventListener('click', () => { ocultarTip(); if (document.body.classList.contains('in-frame')) go('home'); else scrollTo({top:0, behavior:'smooth'}); });
    nav.addEventListener('pointerover', e => { const b = e.target.closest('.rail-btn,.rail-inicio'); if (b) mostrarTip(b); });
    nav.addEventListener('pointerout', ocultarTip);
    nav.addEventListener('focusin', e => { const b = e.target.closest('.rail-btn,.rail-inicio'); if (b) mostrarTip(b); });
    nav.addEventListener('focusout', ocultarTip);
    nav.addEventListener('scroll', ocultarTip, {passive:true});
  }
  function cerrarCapas(){
    ['detalle','paleta'].forEach(id => { const d = $(id); if (d && d.open) d.close(); });
    ['cuenta','ofertas'].forEach(id => { const p = $(id); try { if (p && p.matches(':popover-open')) p.hidePopover(); } catch {} });
  }
  function marcar(id){
    const poner = (el, si) => si ? el.setAttribute('aria-current','page') : el.removeAttribute('aria-current');
    document.querySelectorAll('.rail-btn').forEach(b => poner(b, b.dataset.mod === id));
    poner($('railInicio'), id === 'home');
  }
  function go(id, inicial){
    cerrarCapas();
    const f = $('stageFrame');
    if (id === 'home') {
      document.body.classList.remove('in-frame','frame-loading');
      if (f.dataset.cur) { f.src = 'about:blank'; delete f.dataset.cur; }
      if (location.hash) history.replaceState(null, '', location.pathname + location.search);
      document.title = 'Cerebro';
      marcar('home');
      if (!inicial) INICIO.refrescar();
      return;
    }
    const m = porId(id); if (!m) return;
    marcar(id);
    document.body.classList.add('in-frame','frame-loading');
    if (f.dataset.cur !== m.url) { f.onload = () => document.body.classList.remove('frame-loading'); f.src = m.url; f.dataset.cur = m.url; }
    else document.body.classList.remove('frame-loading');
    history.replaceState(null, '', '#'+id);
    document.title = m.nombre + ' · Cerebro';
  }
  // Cualquier <a href="systems.html"> de la portada abre en el iframe. Ctrl/Cmd/Shift/clic medio: pestaña nueva, como siempre.
  document.addEventListener('click', e => {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return;
    const a = e.target.closest('a[href]'); if (!a || a.target === '_blank') return;
    const id = porUrl[a.getAttribute('href').split('#')[0].split('?')[0]]; if (!id) return;
    e.preventDefault(); go(id);
  });
  addEventListener('hashchange', () => { const h = location.hash.slice(1).toLowerCase(); if (porId(h)) go(h); else if (!h) go('home'); });
  function goHero(){ go('home'); scrollTo({top:0, behavior:'smooth'}); }
  try { rail(); } catch (e) { console.warn('[Cerebro] rail', e); }
  const h = location.hash.slice(1).toLowerCase();
  go(porId(h) ? h : 'home', true);
  return { go, goHero, MODULES: MODS.map(m => [m.id, m.s, m.nombre, m.url]) };
})();
window.Cerebro = Cerebro;
window.INICIO = INICIO;
INICIO.init();
