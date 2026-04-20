// ══════════════════════════════════════════════════════════════
// PROMPT WEAVER v2 — Complete Brain AI Prompt Generator
// Each prompt is a fully self-contained intelligence briefing.
// Paste any prompt into Claude/ChatGPT and get expert output
// without needing extra context in that session.
// ══════════════════════════════════════════════════════════════
const PromptWeaver = {

  copyPrompt(id){
    const el=document.getElementById(id);if(!el)return;
    const text=el.textContent.trim();
    const done=()=>{const btn=el.parentElement?.querySelector('.pw-copy');if(btn){const orig=btn.innerHTML;btn.innerHTML='✅ ¡Copiado!';btn.style.background='var(--gg)';btn.style.color='var(--gn)';setTimeout(()=>{btn.innerHTML=orig;btn.style.background='';btn.style.color='';},2200);}};
    const fb=()=>{const ta=document.createElement('textarea');ta.value=text;ta.style.cssText='position:fixed;top:-999px;opacity:0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy')}catch(_){}document.body.removeChild(ta);done();};
    if(navigator.clipboard){navigator.clipboard.writeText(text).then(done).catch(fb);}else{fb();}
  },

  // ── Shared context block injected into every prompt ──
  _ctx(){
    const co=S.company||'[Empresa]', ro=S.role||'[Puesto]';
    const kws=S.match.found.map(s=>s.name).join(', ')||'N/A';
    const gaps=S.match.missing.join(', ')||'Ninguno detectado';
    const techFound=S.match.found.filter(s=>s.cat==='tech').map(s=>s.name).join(', ')||'N/A';
    const finFound=S.match.found.filter(s=>s.cat==='fin').map(s=>s.name).join(', ')||'N/A';
    const tactical=S.profile.tacticalSkills?.map(t=>t.desc||t.name).join('; ')||'N/A';
    const industry=S.profile.industry?.label||'Corporativo';
    const powerVerbs=S.profile.powerWords?.actions?.join(', ')||'N/A';
    const hiddenKws=S.profile.hiddenKeywords?.map(k=>k.kw).join(', ')||'N/A';
    const langs=Object.values(P.langs).map(l=>`${l.n} (${l.lv})`).join(', ');
    return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 BRIEFING COMPLETO — VACANTE + CANDIDATO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VACANTE:
• Empresa: ${co} | Puesto: ${ro}
• Industria: ${industry} | Modalidad: ${S.match.remote?'✅ 100% Remoto':'Presencial/Híbrido'}
• Seniority: ${S.match.level} | Tono JD: ${S.profile.toneMatch||'formal'}
• Match: ${S.match.pct}% | ATS: ${S.match.ats}% | Culture Fit: ${S.profile.cultureFit||0}%

ANÁLISIS DE FIT:
• Skills con MATCH (${S.match.found.length}): ${kws}
• Skills con GAP (${S.match.missing.length}): ${gaps}
• Tech detectado: ${techFound}
• Finance/AP detectado: ${finFound}
• Keywords culturales ocultas: ${hiddenKws}
• Verbos de acción de la JD (usar como espejo): ${powerVerbs}

CANDIDATO — Miguel Ángel Barros Torres:
• Contacto: miguelbarros2416@gmail.com | +57 314 437 3585 | Bogotá, Colombia (UTC-5)
• Experiencia total: 8+ años en finanzas y análisis de datos

BRINKS INTERNATIONAL — AP ANALYST / REGIONAL LEAD (Jun 2018 – Ene 2025 · 7 años):
• Rol: Gestión AP end-to-end para Brasil y Caribe en Shared Services global
• Scope: 15+ proveedores multinacionales, multi-moneda (BRL/USD/COP), 2 regiones
• Ciclo completo: intake de facturas → validación → codificación → conciliación → aprobación → pagos → cierre mensual
• Resultado 1: Resolví 60% del backlog histórico de discrepancias de facturación (categorización sistemática + three-way matching)
• Resultado 2: SQL automations → 15% optimización en tracking de pagos (eliminé errores manuales de seguimiento)
• Resultado 3: Dashboards Power BI en tiempo real para KPIs AP (aging, throughput, excepciones, discount capture rate)
• Impacto: Pasé de inherited-chaos a procesos audit-ready con near-zero discrepancias

TELEPERFORMANCE — CONTENT MODERATOR ES/PT (Ago 2025 – Presente · Remoto):
• Multi-queue management bajo SLAs estrictos con 95%+ accuracy
• Análisis y moderación de contenido en español y portugués
• Demuestra: capacidad remota, disciplina bajo presión, atención al detalle

EXPRESS MICROFINANZAS — AUXILIAR MESA DE CONTROL (Sep 2016 – May 2018):
• Análisis de riesgo crediticio con impacto en decisiones de cartera
• Herramientas internas que redujeron tiempos de respuesta 30%

TECH STACK (nivel real, sé honesto en soluciones):
• SQL: AVANZADO — JOINs complejos, CTEs, window functions (ROW_NUMBER/LAG/LEAD/DENSE_RANK), subqueries, optimization
• Excel: EXPERTO — Pivot tables, INDEX-MATCH/VLOOKUP, Power Query (M), fórmulas array, gráficos dinámicos
• Power BI: INTERMEDIO-AVANZADO — DAX básico-avanzado, DirectQuery, relaciones, dashboards ejecutivos
• Python: BÁSICO-INTERMEDIO — Pandas (load/clean/groupby/merge/pivot), matplotlib, openpyxl
• MySQL/PostgreSQL: INTERMEDIO-AVANZADO
• Microsoft 365: EXPERTO (Teams, SharePoint, Forms, Power Automate básico)

IDIOMAS: ${langs}

EDUCACIÓN:
• Ingeniería de Sistemas — 8° Semestre (CUN Virtual, 2026, en curso)
• Tecnólogo Análisis y Desarrollo de Software — SENA
• Técnico en Contabilidad — Campo Alto

VENTAJAS TÁCTICAS (diferenciadores escasos en el mercado):
${tactical}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  },

  // ── PROMPT 1: MOCK INTERVIEWER ──
  buildMockInterviewer(){
    const co=S.company||'[Empresa]', ro=S.role||'[Puesto]';
    const focus=S.match.focusArea;
    const techKws=S.match.found.filter(s=>s.cat==='tech').map(s=>s.name).slice(0,6).join(', ')||'SQL, Excel, Power BI';
    const finKws=S.match.found.filter(s=>s.cat==='fin').map(s=>s.name).slice(0,6).join(', ')||'accounts payable, reconciliation';
    const gaps=S.match.missing.slice(0,3).join(', ')||'ninguno mayor';
    const tone=S.profile.toneMatch||'formal';
    const industry=S.profile.industry?.label||'Corporativo';
    const level=S.match.level;
    const isRemote=S.match.remote;
    const hiddenKws=S.profile.hiddenKeywords?.map(k=>k.kw).slice(0,5).join(', ')||'';

    return `${this._ctx()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎭 MOCK INTERVIEWER — INSTRUCCIONES COMPLETAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ROLE: Eres un Senior Hiring Manager de ${co} (industria: ${industry}), con 15 años de experiencia contratando para roles de ${focus==='fin'?'finanzas/AP':'data/analytics'}. Estás entrevistando a Miguel para ${ro}. Eres directo, profesional y evaluás con rigor real — no condescendiente, no permisivo.

PROTOCOLO ESTRICTO:
1. Haz UNA pregunta a la vez. ESPERA mi respuesta antes de continuar.
2. Después de CADA respuesta: feedback en 2-3 oraciones concretas:
   → Qué estuvo bien (cita algo específico de mi respuesta)
   → Qué mejorar (sugerencia accionable, no vaga)
   → Cómo reformular en 1 oración si fue débil
3. Sigue el orden de bloques exactamente.
4. Al terminar las 10 preguntas: genera INFORME FINAL completo.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BLOQUES DE PREGUNTAS (10 en total):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BLOQUE 1 — APERTURA [1 pregunta]:
"Cuéntame sobre ti en 2 minutos."
→ Evalúa: estructura lógica, relevancia para el rol, confianza, si abre con impacto o con la historia personal.
→ Criterio ideal: "Tengo X años de experiencia en [área], en [empresa] logré [resultado]. Hoy busco [objetivo específico en ${co}]."

BLOQUE 2 — EXPERIENCIA CORE [3 preguntas, tú eliges las más relevantes según el foco]:
${focus==='fin'?`• "Describe el proceso AP más complejo que hayas gestionado. ¿Qué volumen manejabas y cómo garantizabas accuracy bajo presión?"
• "Cuéntame sobre una disputa difícil con un proveedor. ¿Qué pasó, qué hiciste y cuál fue el resultado?" [STAR]
• "¿Cómo aseguraste compliance normativo manejando operaciones en múltiples países con regulaciones diferentes?"
• "¿Cómo construiste los KPIs de tu proceso AP? ¿Qué métricas monitoreabas y cómo reportabas a liderazgo?"
→ Skills a sondear específicamente: ${finKws}`:`• "Describe un proyecto donde SQL fue determinante para resolver un problema de negocio. ¿Qué query construiste, qué datos analizaste y qué impacto tuvo?"
• "¿Cómo construiste un dashboard de KPIs de principio a fin? ¿Qué fuentes de datos, qué métricas y para quién fue?"
• "Cuéntame cómo abordas datos sucios o inconsistentes en un proceso crítico donde el error tiene consecuencias reales."
• "Describe cómo automatizaste un proceso manual. ¿Qué herramienta usaste, cuánto tiempo tardaste y cuál fue el ahorro?"
→ Skills a sondear específicamente: ${techKws}`}

BLOQUE 3 — CONDUCTUALES STAR [2 preguntas]:
• "Cuéntame una vez que fallaste en cumplir un deadline o entregaste algo que no estaba a tu mejor nivel. ¿Qué pasó y qué aprendiste?"
• "Describe una situación donde tuviste que aprender algo completamente nuevo en muy poco tiempo bajo presión. ¿Cómo lo manejaste?"
→ Evalúa: autoconciencia real, capacidad de tomar responsabilidad sin excusas, aprendizaje concreto, no respuesta "positiva disfrazada de negativa".
→ TRAMPA: Si la respuesta no incluye un fallo real, presiona: "Eso suena a que salió bien al final. Cuéntame de una vez que genuinamente falló."

BLOQUE 4 — TÉCNICO ESPECÍFICO [2 preguntas]:
${focus==='fin'?`• [Pregunta técnica real] "Tenemos un aging report que muestra 40% de facturas en 60+ días. ¿Cuál sería tu diagnóstico y tu plan de acción en los primeros 30 días?"
• [Deep dive] "Si tuvieras acceso a la base de datos de AP, ¿qué query escribirías para identificar las facturas que están bloqueando el cierre mensual?" — evalúa su razonamiento SQL, no solo la respuesta correcta.`:`• [Pregunta técnica real] "Tienes un dataset de 500K transacciones financieras con campos nulos en columnas críticas, duplicados y formatos inconsistentes. ¿Cuál es tu proceso de limpieza y validación con SQL y Python?"
• [Deep dive] "¿Cómo diseñarías un modelo de datos para un reporte de aging AP que necesita actualizarse diariamente y ser consultado por Power BI?" — evalúa pensamiento de modelado, no solo respuesta técnica.`}

BLOQUE 5 — FIT Y MOTIVACIÓN [2 preguntas]:
• "¿Por qué ${co} específicamente? ¿Qué sabes de nosotros que te hace querer este rol en particular?"
• ${isRemote?'"Llevas tiempo trabajando remoto. ¿Cómo garantizas productividad, comunicación proactiva y presencia de equipo cuando no estás físicamente en la oficina?"':'"¿Cómo manejas situaciones donde tienes múltiples prioridades urgentes al mismo tiempo y recursos limitados?"'}

${gaps&&gaps!=='ninguno mayor'?`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TRAMPA OBLIGATORIA (gap detectado — prepárate):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"Veo que no tienes experiencia con ${gaps.split(',')[0].trim()}. Esta posición lo requiere. ¿Cómo compensas esa falta?"
→ Mi posición correcta: honestidad total + velocidad de aprendizaje demostrada + skills transferibles concretos.
→ NO decir "aprendería rápido" sin evidencia. SÍ decir: "En Brinks aprendí X en Y semanas partiendo de cero porque..."` :''}

${hiddenKws?`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SONDEO CULTURAL (keywords detectadas en la JD):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
La empresa usa estas palabras en la JD: ${hiddenKws}
→ Haz al menos 1 pregunta que sonde cómo vivo estos valores en mi trabajo real. Evalúa si hay evidencia concreta o solo discurso.`:''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INFORME FINAL (después de las 10 preguntas):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. PUNTUACIÓN GLOBAL /100 (con desglose por bloque /20)
2. TOP 3 Fortalezas detectadas (cita frases exactas de mis respuestas)
3. TOP 3 Áreas de mejora con sugerencias accionables y específicas
4. Respuestas que sonaron débiles o genéricas — reescritas mejor
5. VEREDICTO: ¿Avanzo a la siguiente ronda? ¿Con reservas? ¿Cuáles?
6. Script mejorado de "Cuéntame sobre ti" (60 segundos, específico para ${co})

El tono de la entrevista es: ${tone}. Saluda como el interviewer de ${co} y lanza la primera pregunta ahora:`;
  },

  // ── PROMPT 2: TECHNICAL ASSESSMENT SOLVER ──
  buildTechAssessment(){
    const co=S.company||'[Empresa]', ro=S.role||'[Puesto]';
    const focus=S.match.focusArea;
    const techSkills=S.match.found.filter(s=>s.cat==='tech').map(s=>s.name).join(', ')||'SQL, Excel, Power BI';
    const finSkills=S.match.found.filter(s=>s.cat==='fin').map(s=>s.name).join(', ')||'accounts payable, reconciliation';
    const kws=S.match.found.map(s=>s.name).join(', ');
    const industry=S.profile.industry?.label||'Corporativo';
    const companySize=S.profile.companySize||'unknown';

    return `${this._ctx()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💻 TECHNICAL ASSESSMENT SOLVER — INSTRUCCIONES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ROLE: Eres un Senior ${focus==='fin'?'AP/Finance Manager':'Data Engineer'} de ${co} (${companySize}, ${industry}). Estás creando Y resolviendo el take-home assessment técnico para el proceso de selección de ${ro}. El assessment debe ser realista para esta industria y este tamaño de empresa.

MI NIVEL REAL — sé honesto y preciso con las soluciones (no simplifiques ni sobre-compliques):
• SQL: AVANZADO — JOINs complejos, LEFT/RIGHT/FULL OUTER, CTEs recursivos, window functions (ROW_NUMBER, RANK, DENSE_RANK, LAG, LEAD, FIRST_VALUE), subqueries correlacionados, PIVOT/UNPIVOT, índices y optimization
• Excel: EXPERTO — INDEX/MATCH (multi-criterio), SUMIFS/COUNTIFS, arrays dinámicos (FILTER/SORT/UNIQUE), Power Query M, pivot tables con campos calculados, dashboard con slicers
• Power BI: INTERMEDIO-AVANZADO — DAX (CALCULATE, ALL, FILTER, RELATED, time intelligence: SAMEPERIODLASTYEAR, DATESYTD), DirectQuery, relaciones snowflake, RLS básico
• Python: BÁSICO-INTERMEDIO — Pandas (read_csv/excel, merge, groupby, pivot_table, melt, apply), matplotlib/seaborn básico, openpyxl para Excel automation
• ${focus==='fin'?'AP/Finance: 7 años experience — three-way matching, aging analysis, month-end close, multi-currency reconciliation':'Data Analysis: 5+ años en datos financieros transaccionales, KPIs, ETL básico'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GENERA ESTE ASSESSMENT COMPLETO (4 ejercicios):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EJERCICIO 1 — SQL REAL (${focus==='fin'?'AP Analytics':'Financial Data Analysis'}):
Crea un schema de base de datos realista (4-6 tablas: invoices, vendors, payments, gl_accounts, cost_centers, currency_rates) con:
• DDL CREATE TABLE + INSERT sample data (10-20 filas por tabla, con casos reales: duplicados, nulls, inconsistencias de moneda)
• Query 1 (BÁSICO): ${focus==='fin'?'Lista de facturas pendientes por vendor con aging calculado (días desde fecha_factura hasta HOY), agrupadas por bucket: 0-30, 31-60, 61-90, 90+':'Calcula el total de transacciones por categoría y mes, con % de participación sobre el total del mes usando window functions'}
• Query 2 (INTERMEDIO): ${focus==='fin'?'Identifica facturas duplicadas (mismo vendor_id, amount, date ±3 días) usando CTE + ROW_NUMBER para marcar duplicados sin eliminar los originales':'Encuentra los top-5 vendors por volumen de transacciones inconsistentes (amount desviado >2 sigmas del promedio) usando subquery o CTE con estadísticas'}
• Query 3 (AVANZADO): ${focus==='fin'?'Reporte de aging con conversión multi-moneda usando la tasa de cambio más reciente disponible, filtrado por status y con ranking de vendors por monto total pendiente':'Construye un reporte de variance analysis: compara el gasto real vs. presupuesto por cost_center, calcula variance absoluta y %, identifica los top-3 overspend usando LAG/LEAD para tendencia mes-a-mes'}
• Para cada query: código completo + comentarios explicativos + resultado esperado descrito + 1 optimización alternativa si existe

EJERCICIO 2 — EXCEL / POWER QUERY:
Scenario: "Te envían un archivo Excel con 3 pestañas: raw_invoices (sucias), vendor_master (con duplicados y nulls) y payment_terms. Debes producir un informe ejecutivo en 2 horas."
• Paso 1 — Power Query: limpieza paso a paso (M code exacto) para: normalizar fechas, eliminar duplicados, rellenar nulls con lógica de negocio, unir las 3 tablas
• Paso 2 — Modelo: fórmulas INDEX-MATCH multi-criterio para traer payment_terms desde vendor_master
• Paso 3 — Análisis: pivot table con aging report (buckets 0-30/31-60/61-90/90+), campo calculado para early payment discount potential
• Paso 4 — Dashboard: diseño del reporte ejecutivo (qué incluir, qué omitir, cómo hacerlo autorefresca con refresh de Power Query)
• Errores comunes que cometen los candidatos y cómo evitarlos

EJERCICIO 3 — CASO DE NEGOCIO (Power BI / Análisis estratégico):
Escenario: "El CFO tiene una reunión en 48 horas. Necesita entender por qué ${focus==='fin'?'el proceso AP tarda un promedio de 45 días cuando el objetivo es 30 días, y cuáles son los vendors que más impactan':'los costos operativos subieron 18% vs. el año anterior y no hay una explicación clara en los reportes actuales'}. Tienes acceso a SQL + Excel + Power BI."
• Fase 1 (2h): ¿Qué queries SQL corres primero para diagnóstico? Escríbelos.
• Fase 2 (3h): ¿Cómo estructuras el análisis? ¿Qué 5 hipótesis validas?
• Fase 3 (43h): Diseño del dashboard Power BI: qué páginas, qué visualizaciones, qué métricas DAX (escribe al menos 2 medidas DAX completas), cómo lo presentas al CFO
• Entregable escrito: template del email para enviar los findings al CFO (150 palabras, ejecutivo, con 3 bullets de insight y 1 recomendación accionable)

EJERCICIO 4 — PROBLEMA ABIERTO (Razonamiento y autonomía):
"Primer día en ${co}. Nadie te dice exactamente qué hacer. Ves que el equipo tiene un proceso de ${focus==='fin'?'conciliación mensual que tarda 5 días y se hace 80% en Excel manualmente':'reporte semanal de KPIs que tarda 2 días y usa 4 archivos Excel sin conexión entre sí'}. Tienes SQL, Python y Power BI."
• ¿Qué haces en la primera semana? (plan día a día)
• ¿Cómo priorizas qué automatizar primero?
• ¿Qué quick wins logras en 30 días? ¿En 90 días?
• ¿Qué riesgos considera tu plan?
→ Escribe la solución completa como si fuera un email de actualización a tu manager al día 30.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PARA CADA EJERCICIO incluye:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Solución completa y correcta (no pseudocódigo)
✓ Código exacto (SQL/M/DAX/Python) con comentarios
✓ 2-3 talking points para explicar tu approach en 60 segundos
✓ Los 2 errores más comunes que cometen candidatos (y cómo los evito)
✓ Una pregunta inteligente que puedo hacer al entrevistador sobre el ejercicio

BONUS:
• Template email profesional para entregar el assessment
• Cómo presentar las soluciones en la debriefing de 30 minutos

Keywords ATS a demostrar: ${kws}

Genera el assessment completo ahora:`;
  },

  // ── PROMPT 3: SALARY NEGOTIATION COACH ──
  buildSalaryNegotiator(){
    const co=S.company||'[Empresa]', ro=S.role||'[Puesto]';
    const salary=S.profile.salaryRange?.raw||'no especificado';
    const companySize=S.profile.companySize||'unknown';
    const isRemote=S.match.remote;
    const industry=S.profile.industry?.label||'Corporativo';
    const focus=S.match.focusArea;
    const urgency=S.profile.urgency||0;
    const matchPct=S.match.pct;
    const level=S.match.level;

    return `${this._ctx()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 SALARY NEGOTIATION COACH — INSTRUCCIONES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ROLE: Eres un Executive Career Coach + Salary Negotiation Specialist con 15 años de experiencia en el mercado LATAM. Tienes acceso a market data de LinkedIn Salary, Glassdoor, Levels.fyi, RemoteOK, Talent.com, Bumeran y datos propios de negociaciones. Conoces las diferencias salariales entre empresas colombianas, empresas LATAM y empresas US/EU contratando talento remoto en Colombia.

CONTEXTO DE NEGOCIACIÓN:
• Empresa: ${co} | Industria: ${industry} | Tamaño: ${companySize}
• Puesto: ${ro} | Nivel: ${level} | Modalidad: ${isRemote?'100% Remoto (candidato en Colombia)':'Presencial/Híbrido Bogotá'}
• Salario mencionado en JD: ${salary}
• Urgencia de la empresa: ${urgency>=4?'🔥 ALTA — mi leverage aumenta':urgency>=2?'🟡 MEDIA':'🟢 BAJA'}
• Mi match con la vacante: ${matchPct}% → posición de negociación: ${matchPct>=75?'💪 FUERTE':matchPct>=55?'🤝 MEDIA':'📋 MODERADA'}

MI LEVERAGE (argumentos reales para negociar, no inventados):
1. 8+ años experiencia finanzas multinacional (Brinks) — no es un junior ni un mid estándar
2. SQL + Power BI en un perfil financiero (combinación escasa: la mayoría de AP/Finance no sabe SQL)
3. Trilingüe ES/PT/EN — elimina costo de contratación de perfiles bilingüe/trilingüe
4. Empleado actualmente en Teleperformance — tengo ingreso, no tengo urgencia, tengo leverage
5. Setup remoto ya establecido y probado — cero onboarding de infraestructura
6. Ing. Sistemas en curso — perfil que sigue escalando, inversión a largo plazo para la empresa
7. Multi-región, multi-moneda, compliance multi-país — raro y costoso reemplazar

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GENERA TODO ESTO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. BENCHMARKING SALARIAL DETALLADO:
Para "${ro}" ${isRemote?'remoto desde Colombia (para empresa ${companySize})':'en Bogotá'} — industria ${industry}:
• Rango junior (0-3 años) en USD mensual y COP mensual
• Rango mid (4-7 años) en USD mensual y COP mensual [MI RANGO OBJETIVO]
• Rango senior (8+ años) en USD mensual y COP mensual
• Premio por bilingüismo/trilingüismo verificado: +X%
• Premio por SQL + tech skills en perfil financiero: +X%
• Diferencial empresa colombiana vs empresa US/EU contratando remoto LATAM: X multiplicador
• Fuentes sugeridas para verificar: LinkedIn Salary Colombia, Glassdoor, RemoteOK salary insights, Talent.com

2. MIS TRES NÚMEROS:
Basado en mi perfil y market data:
• Número ANCLA: (el que digo primero para anclar la negociación) — con justificación
• Número TARGET: (lo que genuinamente quiero lograr) — con justificación
• Número WALK-AWAY: (mínimo aceptable, por debajo del cual declino) — con justificación
Incluye los mismos números en USD y COP según la modalidad.

3. SCRIPTS EXACTOS — 4 ESCENARIOS:

ESCENARIO A — "¿Cuál es tu expectativa salarial?" (ellos preguntan primero):
Script completo de 4-5 oraciones. Ancla sin asustar, usa rango estratégico, no número exacto.
→ Da 3 variantes: directa, con pregunta de retorno, y defensiva.

ESCENARIO B — La oferta es buena (igual o mayor a mi target):
Script de aceptación que cierra bien pero deja puerta abierta a revisión en 3-6 meses.
→ Include: cómo pedir fecha de revisión como condición de aceptación.

ESCENARIO C — La oferta es baja (20-35% menos que mi target):
Script de contraoferta que: agradece, reafirma interés, presenta el número correcto con justificación de mercado, propone alternativas (benefits, signing bonus, revisión en 3 meses).
→ Tono: confiado y colaborativo, nunca confrontacional.

ESCENARIO D — "No tenemos flexibilidad en el base salary":
Script para negociar compensación total: benefits no salariales como compensación al gap.
→ Lleva con los 3 más valiosos primero.

4. BENEFICIOS NO SALARIALES (lista priorizada para ${isRemote?'remote LATAM':'Colombia'}):
Para cada uno: nombre → cómo pedirlo en 1 oración → valor económico estimado → cuándo pedirlo en la negociación
Incluye: signing bonus, home office stipend, internet allowance, professional development budget, equity/phantom equity, extra vacation days, flexible schedule, health coverage upgrade, equipment upgrade, performance review schedule.

5. EMAILS Y MENSAJES LISTOS:
• Email para preguntar el compensation range ANTES de la primera entrevista (subject line + cuerpo 100 palabras)
• Email de seguimiento post-oferta para "darme tiempo sin perder momentum" (48-72h)
• Mensaje WhatsApp/Slack si la comunicación es informal
• Email de aceptación formal (con condiciones claramente establecidas)

6. RED FLAGS SALARIALES (3 señales de que la empresa no negociará de buena fe):
Para cada una: cómo reconocerla + cómo responder + cuándo simplemente declinar.

Genera todo ahora con los scripts completos listos para copiar y usar:`;
  },

  // ── PROMPT 4: APPLICATION STRATEGY COACH ──
  buildApplicationCoach(){
    const co=S.company||'[Empresa]', ro=S.role||'[Puesto]';
    const industry=S.profile.industry?.label||'Corporativo';
    const matchPct=S.match.pct;
    const kws=S.match.found.map(s=>s.name).slice(0,10).join(', ');
    const gaps=S.match.missing.join(', ')||'Ninguno detectado';
    const powerVerbs=S.profile.powerWords?.actions?.join(', ')||'N/A';
    const hiddenKws=S.profile.hiddenKeywords?.map(k=>k.kw).join(', ')||'N/A';
    const flags=S.profile.redFlags?.map(f=>f.text).join(' | ')||'N/A';
    const urgency=S.profile.urgency||0;
    const tone=S.profile.toneMatch||'formal';
    const level=S.match.level;
    const isRemote=S.match.remote;

    return `${this._ctx()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧠 APPLICATION STRATEGY COACH — INSTRUCCIONES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ROLE: Eres un Senior Career Strategist con 20 años de experiencia en hiring para ${industry}. Acabas de leer la JD de ${co} para ${ro} y el perfil completo del candidato arriba. Tu trabajo es construir la estrategia de aplicación más efectiva posible — honesta, accionable y sin frases genéricas de coaching.

DATOS DEL ANÁLISIS (usa estos en todas tus recomendaciones):
• Match: ${matchPct}% | Nivel detectado: ${level} | Tono JD: ${tone}
• Skills con match: ${kws}
• Gaps: ${gaps}
• Keywords culturales ocultas: ${hiddenKws}
• Verbos de acción JD (espejo obligatorio): ${powerVerbs}
• Urgencia empresa: ${urgency>=4?'🔥 ALTA':urgency>=2?'🟡 MEDIA':'🟢 BAJA'}
• Señales a evaluar: ${flags}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GENERA ESTE PLAN ESTRATÉGICO COMPLETO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. DECODIFICACIÓN DE LA JD — LO QUE REALMENTE BUSCAN:
Más allá de los bullets literales, ¿qué problema quiere resolver ${co} con este hire?
• El problema real (en 1 oración directa)
• Las 3 capacidades más críticas aunque no estén explícitas
• El tipo de persona que encaja con esta cultura (basado en cómo está escrita la JD, el tono, las palabras usadas)
• Lo que NO quieren (red flags de candidato basadas en la JD)

2. INVESTIGACIÓN DE ${co} — GUÍA EN 30 MINUTOS:
Step-by-step con Google queries exactas:
• Query 1: [X] → qué extraer
• Query 2: [X] → qué extraer
• Query 3: [X] → qué extraer
• LinkedIn: qué buscar en el perfil de la empresa y de sus empleados
• Glassdoor: cómo leer las reviews estratégicamente (qué buscar, qué ignorar)
• 5 datos concretos que DEBO conocer antes de la entrevista (y cómo usarlos)

3. POSICIONAMIENTO Y NARRATIVA:
Con ${matchPct}% de match y los gaps de: ${gaps||'ninguno relevante'}:
• La narrativa exacta que construyo para ${co} (3-4 oraciones del elevator pitch)
• Los 3 ángulos competitivos únicos vs. candidatos típicos para este rol
• Cómo abordar proactivamente el gap más relevante (si existe)
• Lo que NO debo mencionar o enfatizar (por qué me puede perjudicar)

4. CUSTOMIZACIÓN DEL MATERIAL — LO ESPECÍFICO:
• Headline del CV: [escribe el headline exacto recomendado para esta aplicación]
• 3 bullets de experiencia Brinks que más deben destacar y cómo reformularlos con los verbos de la JD
• Sección de skills: qué agregar, qué reordenar, qué quitar para este JD específico
• Cover letter párrafo 1: [draft completo, 3-4 oraciones, con datos reales de ${co}]
• Asunto del email si aplico directo: [2 opciones de subject line]

5. ESTRATEGIA DE CANAL Y TIMING:
• Canal óptimo: portal directo vs LinkedIn Easy Apply vs referido (justifica con razón específica)
• Mejor momento para aplicar: día de la semana y hora (y por qué)
• Si existe un "additional message" en el portal: [draft de 100 palabras]
• Cómo aplicar en 3 frentes simultáneos: portal + LinkedIn + networking

6. OUTREACH PARALELO — NETWORKING EN MOVIMIENTO:
Paso a paso para encontrar al hiring manager de ${co}:
• Búsqueda LinkedIn con filtros exactos
• Template de connection request (300 chars, personalizado)
• Mensaje post-conexión cuando acepten (800 chars)
• Cómo pedir un referido si encuentro un contacto en común
• Qué NO hacer en el outreach (errores que destruyen la candidatura)

7. TIMELINE Y SEGUIMIENTO (día a día):
• Día 1-2 post-aplicación: [acciones específicas]
• Día 7 si no hay respuesta: [script de follow-up exacto]
• Día 14: [segundo follow-up, diferente ángulo]
• Cuándo marcar como dead y seguir: [criterio objetivo]
• Si hay silencio total: [estrategia de escalada o pivot]

Genera el plan completo y accionable ahora — sin frases de coaching genérico:`;
  },

  // ── PROMPT 5: COVER LETTER OPTIMIZER ──
  buildCoverOptimizer(){
    const co=S.company||'[Empresa]', ro=S.role||'[Puesto]';
    const tone=S.profile.toneMatch||'formal';
    const focus=S.match.focusArea;
    const atsScore=S.match.ats;
    const kws=S.match.found.map(s=>s.name).slice(0,10).join(', ');
    const hiddenKws=S.profile.hiddenKeywords?.map(k=>k.kw).join(', ')||'';
    const powerVerbs=S.profile.powerWords?.actions?.join(', ')||'';
    const industry=S.profile.industry?.label||'Corporativo';
    const isRemote=S.match.remote;
    const matchPct=S.match.pct;

    return `${this._ctx()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✉️ COVER LETTER OPTIMIZER — INSTRUCCIONES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ROLE: Eres un experto en escritura persuasiva y comunicación ejecutiva, especializado en cover letters para roles ${industry}. Sabes exactamente:
• Cómo un ATS procesa y puntúa una carta (keyword density, formatting, length)
• Cómo un HR lee una carta en 6 segundos (apertura, escaneabilidad, cierre)
• Cómo un hiring manager lee una carta en 90 segundos (narrativa, diferenciación, evidencia)
• Las diferencias entre el mercado colombiano/LATAM y el mercado US/EU en tono y estructura

PARÁMETROS DE OPTIMIZACIÓN:
• ATS Score actual del perfil: ${atsScore}% → objetivo para la carta: 80%+
• Tono JD detectado: ${tone} → la carta DEBE reflejar este tono exacto
• Keywords ATS obligatorias (incluir al menos 6): ${kws}
• Keywords culturales a reflejar sutilmente: ${hiddenKws||'ninguna detectada'}
• Verbos de acción de la JD para espejo (usar al menos 4): ${powerVerbs||'N/A'}
• Modalidad: ${isRemote?'Remoto (resaltar infraestructura y experiencia remota)':'Presencial/Híbrido'}
• Match actual: ${matchPct}% → la carta debe enfatizar los puntos de match más fuertes

ESTRUCTURA QUE CONVIERTE PARA ${industry} (evidencia-based):
• [Header]: Solo nombre + datos de contacto (fuera del cuerpo de la carta)
• [P1 — GANCHO, 2-3 oraciones]: Por qué ${co} específicamente + cuál es mi propuesta de valor única. NUNCA empezar con "I am writing to apply for..."
• [P2 — PRUEBA, 3-4 oraciones]: El logro más relevante para ESTE rol con datos reales. Conectar directamente con un dolor o necesidad de ${co}.
• [P3 — DIFERENCIADOR, 2-3 oraciones]: Lo que me hace único vs. los otros 50 candidatos. El unfair advantage específico para ${co}.
• [P4 — CIERRE, 1-2 oraciones]: Call to action confiado y específico. No "espero ser contactado" — algo activo.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GENERA 3 VERSIONES COMPLETAS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VERSIÓN A — ATS-OPTIMIZED (para portales con filtro automático):
• Tono: ${tone==='casual'?'semiformal':'formal-ejecutivo'}
• Enfoque: keyword density máxima + resultados cuantificados
• Longitud: 260-300 palabras
• Idioma: Inglés
• Apertura que no empieza con "I"
• Incluye: 3 bullets cortos para escaneabilidad

VERSIÓN B — BOLD (para hiring managers directos, LinkedIn InMail, emails directos):
• Tono: más directo, muestra personalidad y confianza
• Enfoque: impacto + pensamiento estratégico + diferenciación
• Longitud: 200-240 palabras (el HM tiene menos tiempo)
• Idioma: Inglés
• Apertura disruptiva (que interrumpa el pattern reading)
• Sin bullets — flujo narrativo

VERSIÓN C — ESPAÑOL (para Computrabajo, Torre.ai, Elempleo, portales CO/LATAM):
• Tono: más formal que EN, pero no burocrático
• Enfoca: trayectoria + estabilidad + técnico + logros
• Longitud: 230-270 palabras
• Adaptación cultural al mercado colombiano

PARA CADA VERSIÓN:
1. La carta completa (lista para copiar y usar)
2. Mapa de keywords incluidas vs. requeridas
3. Los 3 elementos más fuertes de esta versión
4. 1 cosa que debes personalizar si tienes más info de ${co}

BONUS:
• Checklist de 10 preguntas antes de enviar cualquier cover letter
• Los 5 errores más comunes en cover letters para ${industry} y cómo los evité en estas versiones
• Subject line para email directo: 3 opciones A/B/C

Genera las 3 versiones ahora:`;
  },

  // ── PROMPT 6: LINKEDIN OUTREACH MACHINE ──
  buildLinkedInOutreach(){
    const co=S.company||'[Empresa]', ro=S.role||'[Puesto]';
    const industry=S.profile.industry?.label||'Corporativo';
    const companySize=S.profile.companySize||'unknown';
    const isRemote=S.match.remote;
    const kws=S.match.found.map(s=>s.name).slice(0,6).join(', ');
    const tone=S.profile.toneMatch||'formal';
    const matchPct=S.match.pct;

    return `${this._ctx()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 LINKEDIN OUTREACH MACHINE — INSTRUCCIONES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ROLE: Eres un experto en networking profesional digital y LinkedIn outreach. Conoces la psicología de los hiring managers y recruiters en ${industry}. Sabes exactamente qué messages obtienen respuesta (y cuáles van directamente al archivo). Conoces las diferencias de tono entre Colombia, LATAM y empresas US/EU.

CONTEXTO:
• Target: ${co} (${companySize}, ${industry})
• Puesto objetivo: ${ro} | Modalidad: ${isRemote?'Remoto':'Presencial'}
• Mis diferenciadores a comunicar: ${kws}
• Tono detectado en la empresa (JD): ${tone}
• Mi posición actual: empleado en Teleperformance — no aplico desde desempleo

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CÓMO ENCONTRAR A LA PERSONA CORRECTA EN ${co}:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step-by-step con la búsqueda LinkedIn exacta:
• Filtros para encontrar al Hiring Manager de ${ro} en ${co}
• Filtros para encontrar al Recruiter/HR que publica roles en ${co}
• Cómo verificar si es la persona correcta (título, ubicación, actividad reciente)
• Plan B: si no encuentro al HM, quién es el segundo mejor contacto

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GENERA ESTOS 6 MENSAJES (todos listos para copiar):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MENSAJE 1 — CONNECTION REQUEST AL HIRING MANAGER (máx 300 chars):
Objetivo: conseguir la conexión, no el trabajo. Mencionas ${co} y el rol, muestras una razón específica para conectar.
→ Variante A: directa (menciona el puesto)
→ Variante B: indirecta (menciona un interés en la empresa/industria)
→ Variante C: si tenemos contacto en común

MENSAJE 2 — FOLLOW-UP POST-CONNECTION (cuando aceptan · máx 800 chars):
Primer mensaje real. No pides trabajo directamente. Aportas algo de valor o muestras conocimiento de ${co}.
→ CTA suave: "¿Estarías disponible para 15 minutos esta semana?"
→ Variante A: si ya apliqué por portal (lo mencionas sutilmente)
→ Variante B: si no he aplicado aún (genero interés antes)

MENSAJE 3 — InMail AL RECRUITER QUE PUBLICÓ EL ROL (máx 1000 chars):
El recruiter ya conoce el rol. Sé directo. Formato: gancho → prueba social rápida → CTA.
→ Incluye los 2 diferenciadores más relevantes para ${ro}
→ Referencia explícita al puesto y ${co}

MENSAJE 4 — COLD EMAIL AL HIRING MANAGER (si tengo su email corporativo):
• Asunto: 3 opciones de subject line (A: directo, B: intrigante, C: referido)
• Cuerpo: 150-180 palabras, tono ejecutivo
• Estructura: una línea de contexto → 2 bullets de valor → CTA específico

MENSAJE 5 — REQUEST DE REFERIDO A EMPLEADO ACTUAL DE ${co}:
Para alguien que trabaja en ${co} pero no está en hiring.
• Cómo encontrarlo en LinkedIn (búsqueda exacta)
• Mensaje de conexión (200 chars)
• Mensaje de request de referido (sin presionar, con contexto) — el referido aumenta mi probabilidad de entrevista en 4-7x

MENSAJE 6 — SEGUIMIENTO POST-APLICACIÓN (portal + LinkedIn simultáneo):
Si ya apliqué por el portal y quiero acelerar.
• Timing exacto: cuántos días después de aplicar
• Cómo mencionar que ya apliqué formalmente sin parecer ansioso
• Qué nuevo valor o información aportar para justificar el contacto

PARA CADA MENSAJE:
✓ Texto completo (copy-paste ready)
✓ Variables marcadas con [PERSONALIZAR: instrucción específica]
✓ Mejor día y hora para enviarlo (y por qué)
✓ Qué hacer si no hay respuesta en 5 días

BONUS:
• Los 5 errores que destruyen el outreach en LinkedIn (y qué hacer en su lugar)
• Cómo usar LinkedIn Voice Messages para diferenciarse (cuándo y cómo)

Genera todos los mensajes ahora:`;
  },

  // ── MAIN RENDER ──
  generate(){
    if(!S.analyzed){ alert('Analiza una vacante primero.'); return; }
    const co=S.company||'la empresa', ro=S.role||'el puesto';
    const industry=S.profile.industry?.label||'Corporativo';

    let html=`<div style="background:linear-gradient(135deg,rgba(139,92,246,.08),rgba(6,182,212,.05));border:1px solid rgba(139,92,246,.2);border-radius:12px;padding:16px;margin-bottom:14px">
      <div style="font-size:13px;font-weight:700;color:var(--a2);margin-bottom:6px">🤖 Prompt Weaver v2 — ${ro} @ ${co}</div>
      <div style="font-size:11px;color:var(--t2);margin-bottom:10px">6 prompts completos con briefing total. Pega cualquiera en Claude/ChatGPT — no necesitas agregar contexto adicional.</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <span style="font-size:10px;padding:2px 8px;border-radius:10px;background:var(--ag);color:var(--a2);border:1px solid rgba(139,92,246,.2)">Match ${S.match.pct}%</span>
        <span style="font-size:10px;padding:2px 8px;border-radius:10px;background:var(--gg);color:var(--gn);border:1px solid rgba(34,197,94,.15)">ATS ${S.match.ats}%</span>
        <span style="font-size:10px;padding:2px 8px;border-radius:10px;background:var(--el);color:var(--t2);border:1px solid var(--bd)">${industry}</span>
        <span style="font-size:10px;padding:2px 8px;border-radius:10px;background:var(--cg);color:var(--cy);border:1px solid rgba(6,182,212,.15)">${S.match.found.length} skills match</span>
      </div>
    </div>`;

    const prompts=[
      {id:'pw-mock',icon:'🎭',title:'Mock Interviewer',tag:'Entrevista Simulada',tagColor:'var(--ag)',tagText:'var(--a2)',
       desc:`Reclutador de ${co} te entrevista 1-a-1. Feedback real después de cada respuesta + evaluación /100 + veredicto final.`,fn:()=>this.buildMockInterviewer()},
      {id:'pw-tech',icon:'💻',title:'Technical Assessment Solver',tag:'Take-Home Técnico',tagColor:'rgba(6,182,212,.08)',tagText:'var(--cy)',
       desc:`4 ejercicios realistas (SQL + Excel/Power Query + caso de negocio + problema abierto). Soluciones completas con código exacto.`,fn:()=>this.buildTechAssessment()},
      {id:'pw-salary',icon:'💰',title:'Salary Negotiation Coach',tag:'Negociación',tagColor:'var(--amg)',tagText:'var(--am)',
       desc:`Benchmarking + mis 3 números + 4 scripts de negociación + beneficios no salariales + emails listos para ${co}.`,fn:()=>this.buildSalaryNegotiator()},
      {id:'pw-coach',icon:'🧠',title:'Application Strategy Coach',tag:'Estrategia Total',tagColor:'var(--gg)',tagText:'var(--gn)',
       desc:`Decodifica la JD, guía de investigación de ${co}, narrativa de posicionamiento, customización del material, timeline de seguimiento.`,fn:()=>this.buildApplicationCoach()},
      {id:'pw-cover',icon:'✉️',title:'Cover Letter Optimizer',tag:'Cover Letter',tagColor:'rgba(239,68,68,.08)',tagText:'#f87171',
       desc:`3 versiones: ATS-first (EN), Bold para HM (EN), Español para portales LATAM. Cada una con análisis de keywords y checklist de revisión.`,fn:()=>this.buildCoverOptimizer()},
      {id:'pw-outreach',icon:'🔗',title:'LinkedIn Outreach Machine',tag:'Networking',tagColor:'rgba(139,92,246,.12)',tagText:'var(--a2)',
       desc:`6 mensajes completos: connection request, follow-up, InMail, cold email, referido, seguimiento post-aplicación. Listos para ${co}.`,fn:()=>this.buildLinkedInOutreach()},
    ];

    prompts.forEach(p=>{
      html+=`<div class="card">
        <div class="card-t" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          ${p.icon} ${p.title}
          <span style="font-size:9px;font-weight:700;padding:2px 8px;border-radius:4px;background:${p.tagColor};color:${p.tagText};margin-left:auto">${p.tag}</span>
        </div>
        <div style="font-size:10px;color:var(--t3);margin-bottom:10px;line-height:1.5">${p.desc}</div>
        <div class="tpl" id="${p.id}">${this.escapeHtml(p.fn())}</div>
        <button class="btn bp bs pw-copy" style="margin-top:8px" onclick="PromptWeaver.copyPrompt('${p.id}')">📋 Copiar Prompt Completo</button>
      </div>`;
    });

    document.getElementById('promptWeaverContent').innerHTML=html;
  },

  escapeHtml(text){
    return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
};
