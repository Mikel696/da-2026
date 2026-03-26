// ══════════════════════════════════════════════════════════════
// PROMPT WEAVER — Dynamic AI Prompt Generator
// ══════════════════════════════════════════════════════════════
const PromptWeaver = {

  copyPrompt(id){
    const el = document.getElementById(id);
    if(!el) return;
    navigator.clipboard.writeText(el.textContent.trim()).then(() => {
      const btn = el.parentElement.querySelector('.pw-copy');
      if(btn){
        const orig = btn.innerHTML;
        btn.innerHTML = '✅ ¡Copiado!';
        btn.style.background = 'var(--gg)';
        btn.style.color = 'var(--gn)';
        setTimeout(() => { btn.innerHTML = orig; btn.style.background = ''; btn.style.color = ''; }, 2000);
      }
    });
  },

  buildMockInterviewer(){
    const co = S.company || '[Empresa]';
    const ro = S.role || '[Puesto]';
    const kws = S.match.found.map(s => s.name).join(', ') || 'accounts payable, SQL, Excel';
    const tone = S.profile.toneMatch || 'formal';
    const focus = S.match.focusArea === 'fin' ? 'finance/accounting' : S.match.focusArea === 'data' ? 'data analysis' : 'financial operations & data';

    return `Actúa como un reclutador senior estricto de ${co} que está entrevistando para el puesto de ${ro}.

INSTRUCCIONES:
- Hazme UNA pregunta a la vez. Espera mi respuesta antes de continuar.
- Empieza con una pregunta de presentación, luego pasa a preguntas técnicas sobre: ${kws}
- Incluye al menos 2 preguntas conductuales (STAR method) y 2 preguntas técnicas específicas de ${focus}.
- Después de cada respuesta mía, dame feedback breve (1-2 oraciones): qué estuvo bien, qué mejorar.
- El tono de la entrevista debe ser: ${tone}.
- Al final (después de 8-10 preguntas), dame una evaluación general con:
  1. Puntuación /10
  2. Fortalezas detectadas
  3. Áreas de mejora
  4. Veredicto: ¿Pasé a la siguiente ronda?

MI PERFIL (para evaluar mis respuestas en contexto):
- 8+ años operaciones financieras (Brinks International, Brasil y Caribe)
- AP end-to-end: validación facturas, conciliación proveedores, cierre mensual
- SQL avanzado, Power BI, Excel experto
- Trilingüe: Español (nativo), Portugués (C1), Inglés (B2+)
- Ing. Sistemas en curso (8° semestre)
- Actualmente: Content Moderator en Teleperformance (remoto, 95%+ accuracy)

Comienza la entrevista ahora. Primera pregunta:`;
  },

  buildTechAssessment(){
    const co = S.company || '[Empresa]';
    const ro = S.role || '[Puesto]';
    const kws = S.match.found.map(s => s.name).join(', ') || 'SQL, Excel, Power BI';
    const techSkills = S.match.found.filter(s => s.cat === 'tech').map(s => s.name).join(', ') || 'SQL, Excel, Power BI';
    const finSkills = S.match.found.filter(s => s.cat === 'fin').map(s => s.name).join(', ') || 'accounts payable, reconciliation';

    return `Actúa como un Senior ${S.match.focusArea === 'fin' ? 'AP/Finance' : 'Data'} Analyst que me ayuda a resolver un take-home assessment técnico.

CONTEXTO:
- Estoy aplicando a: ${ro} en ${co}
- Tech stack de la vacante: ${techSkills}
- Skills financieros requeridos: ${finSkills}
- Todas las keywords ATS detectadas: ${kws}

MI NIVEL REAL (sé honesto en las soluciones que me des):
- SQL: Avanzado (JOINs complejos, window functions, CTEs, subqueries)
- Excel: Experto (pivot tables, VLOOKUP/INDEX-MATCH, macros básicas, Power Query)
- Power BI: Intermedio-avanzado (DAX, DirectQuery, dashboards)
- Python: Básico-intermedio (Pandas, limpieza de datos)
- AP/Finance: 7 años experiencia (conciliación, aging, cierre mensual)

INSTRUCCIONES:
1. Genera un assessment técnico realista de 3-4 ejercicios que ${co} podría enviar para ${ro}
2. Para cada ejercicio:
   - Describe el problema claramente
   - Dame la solución completa paso a paso
   - Incluye el código SQL/Python/fórmulas Excel exactas
   - Explica la lógica detrás de cada paso
3. Incluye un ejercicio tipo "caso de negocio" donde debo analizar datos y presentar conclusiones
4. Al final, dame tips para presentar las soluciones de manera profesional

Genera el assessment ahora:`;
  },

  buildSalaryNegotiator(){
    const co = S.company || '[Empresa]';
    const ro = S.role || '[Puesto]';
    const salary = S.profile.salaryRange?.raw || 'no especificado';
    const companySize = S.profile.companySize || 'unknown';
    const isRemote = S.match.remote;

    return `Actúa como un coach de negociación salarial especializado en el mercado remoto LATAM para roles de ${S.match.focusArea === 'fin' ? 'finanzas/contabilidad' : 'data/analytics'}.

CONTEXTO DE LA NEGOCIACIÓN:
- Empresa: ${co} (tamaño: ${companySize})
- Puesto: ${ro}
- Modalidad: ${isRemote ? '100% Remoto' : 'Presencial/Híbrido'}
- Salario mencionado en la oferta: ${salary}
- Ubicación del candidato: Bogotá, Colombia (costo de vida medio-bajo)

MI PERFIL PARA CALCULAR MI VALOR DE MERCADO:
- 8+ años experiencia financiera (Brinks International — multinacional)
- AP regional lead (Brasil + Caribe) — no es un rol junior
- SQL + Power BI + Excel avanzado (raro en perfiles de finanzas)
- Trilingüe: ES/PT/EN
- Ing. Sistemas en curso
- Actualmente empleado en Teleperformance (tengo leverage)

GENERA:
1. INVESTIGACIÓN SALARIAL: Rango realista para ${ro} remoto en LATAM (en USD y COP)
   - Glassdoor / LinkedIn Salary / niveles.fyi data para referencia
   - Diferencia entre empresa local CO vs. empresa US que contrata remoto LATAM

2. ESTRATEGIA DE NEGOCIACIÓN (3 escenarios):
   - Escenario A: La empresa propone primero → cómo responder
   - Escenario B: Me piden expectativa salarial → script exacto
   - Escenario C: La oferta es baja → cómo contra-ofertar sin perder la oportunidad

3. SCRIPTS LISTOS PARA USAR:
   - Email/mensaje para preguntar sobre compensation antes de avanzar
   - Respuesta cuando la oferta es más baja de lo esperado
   - Mensaje de aceptación que deja la puerta abierta a revisión en 6 meses

4. BENEFICIOS NO SALARIALES para negociar si el salario tiene tope:
   - Específicos para roles remotos LATAM

Genera todo ahora:`;
  },

  // Main render
  generate(){
    if(!S.analyzed){ alert('Analiza una vacante primero.'); return; }

    const co = S.company || 'la empresa';
    const ro = S.role || 'el puesto';
    const kws = S.match.found.map(s => s.name).slice(0, 8).join(', ');

    let html = `<div style="background:var(--el);border:1px solid rgba(139,92,246,.15);border-radius:10px;padding:14px;margin-bottom:12px">
      <div style="font-size:12px;font-weight:700;color:var(--a2);margin-bottom:4px">🤖 Prompt Weaver — ${ro} @ ${co}</div>
      <div style="font-size:10px;color:var(--t2)">3 prompts generados con tus datos ATS. Copia y pega en Claude/ChatGPT.</div>
      <div style="font-size:10px;color:var(--t3);margin-top:2px">Keywords inyectadas: <strong style="color:var(--gn)">${kws}</strong></div>
    </div>`;

    // Prompt 1: Mock Interviewer
    html += `<div class="card">
      <div class="card-t">🎯 Prompt 1: Mock Interviewer</div>
      <div style="font-size:10px;color:var(--t3);margin-bottom:8px">IA actúa como reclutador de ${co}. Te entrevista pregunta por pregunta con feedback.</div>
      <div class="tpl" id="pw-mock">${this.escapeHtml(this.buildMockInterviewer())}</div>
      <button class="btn bp bs pw-copy" style="margin-top:8px" onclick="PromptWeaver.copyPrompt('pw-mock')">📋 Copiar Prompt</button>
    </div>`;

    // Prompt 2: Technical Assessment
    html += `<div class="card">
      <div class="card-t">💻 Prompt 2: Technical Assessment Solver</div>
      <div style="font-size:10px;color:var(--t3);margin-bottom:8px">IA genera un assessment realista para ${ro} y lo resuelve paso a paso.</div>
      <div class="tpl" id="pw-tech">${this.escapeHtml(this.buildTechAssessment())}</div>
      <button class="btn bp bs pw-copy" style="margin-top:8px" onclick="PromptWeaver.copyPrompt('pw-tech')">📋 Copiar Prompt</button>
    </div>`;

    // Prompt 3: Salary Negotiator
    html += `<div class="card">
      <div class="card-t">💰 Prompt 3: Salary Negotiator</div>
      <div style="font-size:10px;color:var(--t3);margin-bottom:8px">IA roleplayea una negociación salarial para ${ro} en mercado remoto LATAM.</div>
      <div class="tpl" id="pw-salary">${this.escapeHtml(this.buildSalaryNegotiator())}</div>
      <button class="btn bp bs pw-copy" style="margin-top:8px" onclick="PromptWeaver.copyPrompt('pw-salary')">📋 Copiar Prompt</button>
    </div>`;

    document.getElementById('promptWeaverContent').innerHTML = html;
  },

  escapeHtml(text){
    return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
};
