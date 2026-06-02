/* ═══════════════════════════════════════════════════════════════
   DA-2026 · SYSTEMS ENGINEERING — Mission Control Logic v1.0
   ─────────────────────────────────────────────────────────────
   Autor: Miguel Angel Barros Torres · CUN Virtual · 8vo Semestre
   Módulo: Ingeniería de Sistemas — Semáforo, Calendario, Tracker
═══════════════════════════════════════════════════════════════ */

const SYS = (() => {
  // ── STORAGE ──
  const NS = 'sys_';
  const db = {
    get(k, d = null) { try { const v = localStorage.getItem(NS + k); return v !== null ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(NS + k, JSON.stringify(v)); } catch {} },
  };

  // ── SUBJECTS (Período 26V02 — Datos reales CDigital, verificados 2026-04-08) ──
  const SUBJECTS = [
    { id: 'ing_web', code: 'DIS34', name: 'Ingeniería Web', group: '52211', icon: '🌐', color: 'hsl(200,80%,50%)', credits: 3, type: 'Desarrollo de Software', professor: 'BECERRA RAMIREZ HEYNER LEONEL', cdigital_id: 104362, schedule: 'Miércoles 6:15 PM', subject_links: { clase: 'https://cdigital.cun.edu.co/mod/url/view.php?id=6403524', grabaciones: 'https://cdigital.cun.edu.co/mod/url/view.php?id=6403525', material: 'https://cdigital.cun.edu.co/mod/url/view.php?id=6403526', reglas: 'https://cdigital.cun.edu.co/mod/url/view.php?id=6104282' }, desc: 'Arquitectura web, APIs REST, frameworks frontend/backend, despliegue, seguridad web, patrones MVC.', resources: ['https://developer.mozilla.org/en-US/docs/Learn', 'https://www.freecodecamp.org/learn/back-end-development-and-apis/'] },
    { id: 'mat_especiales', code: 'DIS31', name: 'Matemáticas Especiales', group: '52247', icon: '🔢', color: 'hsl(263,70%,55%)', credits: 3, type: 'Ciencia Básica', professor: 'Juan Sebastián Cortés Cruz', professor_email: 'juan_cortesc@cun.edu.co', cdigital_id: 101285, schedule: 'Miércoles y Viernes · 6:15-7:45 PM (Google Meet)', subject_links: { clase: 'https://meet.google.com/tcx-apcm-dey', grabaciones: 'https://drive.google.com/drive/folders/1blfMmlYoI9r30v11cLFNef9rYV41qHHT?usp=sharing', material: 'https://drive.google.com/drive/folders/1kDKLX_mVXxHJZDdD7wT4p3jnLZhp-4ju?usp=sharing' }, desc: 'Números complejos, transformadas de Laplace, series de Fourier, funciones especiales, variable compleja, aplicaciones en ingeniería.', resources: ['https://www.khanacademy.org/math/differential-equations', 'https://ocw.mit.edu/courses/18-04-complex-variables-with-applications-spring-2018/'] },
    { id: 'inv_ciencia', code: 'DIS36', name: 'Investigación Ciencia y Tecnología', group: '52218', icon: '🔬', color: 'hsl(320,60%,50%)', credits: 3, type: 'Investigación', professor: 'CORTES TOBAR DARIO FERNANDO', cdigital_id: 104253, desc: 'Metodología de investigación, estado del arte, proyecto de aula, artículos científicos, normas APA, desinformación.', resources: ['https://scholar.google.com/', 'https://www.scielo.org/'] },
    { id: 'english_beginner', code: 'A1I01', name: 'Virtual English - Beginner 1', group: '50608', icon: '🇺🇸', color: 'hsl(45,85%,50%)', credits: 0, type: 'Idiomas (IV001)', professor: 'CINDY PAOLA MORENO', schedule: 'Lunes 7:00 PM', cdigital_id: 100774, subject_links: { clase: 'https://cdigital.cun.edu.co/course/view.php?id=100774' }, desc: 'Inglés nivel A1: presentaciones, vocabulario básico, gramática elemental, listening y speaking.', resources: ['https://www.duolingo.com/', 'https://www.bbc.co.uk/learningenglish/'] },
    { id: 'placement_test', code: 'CE1026', name: 'Placement Test BE Plus', group: '5TB01', icon: '📝', color: 'hsl(15,70%,50%)', credits: 0, type: 'Idiomas (IV002)', cdigital_id: 106289, desc: 'Test de ubicación para determinar nivel de inglés en el programa BE Plus de la CUN.', resources: ['https://cdigital.cun.edu.co/course/view.php?id=106289'] },
    // ── BLOQUE 2 (25 May - 19 Jul 2026) ──────────────────────────────
    { id: 'admin_bd', code: 'DIS-BD', name: 'Administración de Bases de Datos', group: '52291', icon: '🗄️', color: 'hsl(190,75%,45%)', credits: 3, type: 'Disciplinares · Bloque II',
      professor: 'Sergio Alexander Mora Novoa',
      desc: 'Período 26V02 · Bloque II (25 May - 19 Jul 2026). Diseño de BD, SQL avanzado, administración, backup/recovery, optimización.',
      cronograma: [
        // ── Primer Corte (30%) ──
        { id: 'abd_1',  title: 'Presentación Foro · Prueba Diagnóstica · Reglas de juego', date: '2026-05-31', type: 'foro' },
        { id: 'abd_2',  title: 'Evaluación docente 1',                                     date: '2026-06-07', type: 'otro' },
        { id: 'abd_3',  title: 'Quiz 1 (10%)',                                             date: '2026-06-07', type: 'quiz' },
        { id: 'abd_4',  title: 'Parcial 1 (20% → 1er Corte 30%)',                          date: '2026-06-14', type: 'parcial' },
        // ── Segundo Corte (30%) ──
        { id: 'abd_5',  title: 'Evaluación docente 2',                                     date: '2026-06-21', type: 'otro' },
        { id: 'abd_6',  title: 'Quiz 2 (10%)',                                             date: '2026-06-21', type: 'quiz' },
        { id: 'abd_7',  title: 'Parcial 2 (20% → 2do Corte 30%)',                          date: '2026-06-28', type: 'parcial' },
        { id: 'abd_8',  title: 'Verificación de notas por estudiantes',                    date: '2026-06-28', type: 'otro' },
        // ── Tercer Corte (40%) ──
        { id: 'abd_9',  title: 'Evaluación docente 3',                                     date: '2026-07-05', type: 'otro' },
        { id: 'abd_10', title: 'Proyecto de Aula · Entrega Final ACA (34%)',               date: '2026-07-05', type: 'proyecto' },
        { id: 'abd_11', title: 'Quiz 3 (2%)',                                              date: '2026-07-12', type: 'quiz' },
        { id: 'abd_12', title: 'Auto-Evaluación (2%)',                                     date: '2026-07-12', type: 'otro' },
        { id: 'abd_13', title: 'Co-Evaluación (2%)',                                       date: '2026-07-12', type: 'otro' },
        { id: 'abd_14', title: 'Socialización de Notas',                                   date: '2026-07-19', type: 'otro' },
      ],
      resources: ['https://www.postgresqltutorial.com/', 'https://use-the-index-luke.com/'] },
    { id: 'calidad_sw', code: 'DIS-CSW', name: 'Calidad del Software', group: '52278', icon: '🛡️', color: 'hsl(160,60%,40%)', credits: 3, type: 'Disciplinares · Bloque II',
      professor: 'Alexander Calderón Martínez',
      desc: 'Período 26V02 · Bloque II (25 May - 19 Jul 2026). Aseguramiento de calidad, testing, normas ISO/IEC 25010, métricas.',
      cronograma: [
        // ── Primer Corte (30%) ──
        { id: 'csw_1',  title: 'Introducción · Sesión de clase',                  date: '2026-05-31', type: 'tarea' },
        { id: 'csw_2',  title: 'Quiz 1 (10%) · Sesión de Clase',                  date: '2026-06-07', type: 'quiz' },
        { id: 'csw_3',  title: 'Parcial 1 (20% → 1er Corte 30%)',                 date: '2026-06-14', type: 'parcial' },
        // ── Segundo Corte (30%) ──
        { id: 'csw_4',  title: 'Quiz 2 (10%) · Sesión de Clase',                  date: '2026-06-21', type: 'quiz' },
        { id: 'csw_5',  title: 'Parcial 2 (20% → 2do Corte 30%)',                 date: '2026-06-28', type: 'parcial' },
        // ── Tercer Corte (40%) ──
        { id: 'csw_6',  title: 'ACA · Pitch Disciplinares-NIP (34%)',             date: '2026-07-05', type: 'proyecto' },
        { id: 'csw_7',  title: 'Quiz 3 · Sesión de Clase (2%)',                   date: '2026-07-11', type: 'quiz' },
        { id: 'csw_8',  title: 'Coevaluación (2%)',                               date: '2026-07-11', type: 'otro' },
        { id: 'csw_9',  title: 'Autoevaluación (2%)',                             date: '2026-07-11', type: 'otro' },
        { id: 'csw_10', title: 'Cierre de Notas',                                 date: '2026-07-19', type: 'otro' },
      ],
      resources: ['https://www.iso.org/standard/35733.html', 'https://martinfowler.com/articles/practical-test-pyramid.html'] },
    { id: 'redes_inalambricas', code: 'DIS-RWL', name: 'Redes Inalámbricas', group: '', icon: '📶', color: 'hsl(280,55%,55%)', credits: 3, type: 'Disciplinares · Bloque II',
      professor: '',
      desc: 'Período 26V02 · Bloque II (25 May - 19 Jul 2026). Protocolos WiFi, redes celulares, seguridad inalámbrica, diseño de redes ad-hoc.',
      cronograma: [
        // ── Primer Corte (30%) ──
        { id: 'rwl_1',  title: 'Introducción · Sesión de clase',                  date: '2026-05-31', type: 'tarea' },
        { id: 'rwl_2',  title: 'Quiz 1 (10%) · Sesión de Clase',                  date: '2026-06-07', type: 'quiz' },
        { id: 'rwl_3',  title: 'Parcial 1 (20% → 1er Corte 30%)',                 date: '2026-06-14', type: 'parcial' },
        // ── Segundo Corte (30%) ──
        { id: 'rwl_4',  title: 'Quiz 2 (10%) · Sesión de Clase',                  date: '2026-06-21', type: 'quiz' },
        { id: 'rwl_5',  title: 'Parcial 2 (20% → 2do Corte 30%)',                 date: '2026-06-28', type: 'parcial' },
        // ── Tercer Corte (40%) ──
        { id: 'rwl_6',  title: 'ACA · Pitch Disciplinares-NIP (34%)',             date: '2026-07-05', type: 'proyecto' },
        { id: 'rwl_7',  title: 'Quiz 3 · Sesión de Clase (2%)',                   date: '2026-07-11', type: 'quiz' },
        { id: 'rwl_8',  title: 'Coevaluación (2%)',                               date: '2026-07-11', type: 'otro' },
        { id: 'rwl_9',  title: 'Autoevaluación (2%)',                             date: '2026-07-11', type: 'otro' },
        { id: 'rwl_10', title: 'Cierre de Notas',                                 date: '2026-07-19', type: 'otro' },
      ],
      resources: ['https://www.wi-fi.org/discover-wi-fi', 'https://www.cisco.com/c/en/us/solutions/enterprise-networks/wireless-networking-overview.html'] },
  ];

  // ── CALENDAR 2026 (extracted from official PDF) ──
  const CALENDAR = {
    '26V01': {
      label: 'Período 26V01',
      inscriptions: { start: '2025-12-02', end: '2026-01-28' },
      academic: { start: '2026-02-02', end: '2026-05-24' },
      block1: { start: '2026-02-02', end: '2026-03-29', label: 'Primer Bloque' },
      block2: { start: '2026-03-30', end: '2026-05-24', label: 'Segundo Bloque' },
      gradeClose1: { start: '2026-05-19', end: '2026-05-25', label: 'Cierre notas Bloque 1' },
      gradeClose2: { start: '2026-05-26', end: '2026-05-30', label: 'Cierre notas Bloque 2' },
      periodClose: { start: '2026-05-27', end: '2026-06-01', label: 'Cierre período' },
      enrollment: [
        { label: 'Descuento -15%', start: '2025-12-01', end: '2025-12-31' },
        { label: 'Descuento -10%', start: '2026-01-01', end: '2026-01-08' },
        { label: 'Descuento -5%', start: '2026-01-09', end: '2026-01-16' },
        { label: 'Matrícula ordinaria', start: '2026-01-17', end: '2026-01-24' },
        { label: 'Matrícula extraordinaria (+20%)', start: '2026-01-25', end: '2026-01-31' },
      ]
    },
    '26V02': { label: 'Período 26V02', academic: { start: '2026-03-30', end: '2026-07-19' }, block1: { start: '2026-03-30', end: '2026-05-24', label: 'Primer Bloque' }, block2: { start: '2026-05-25', end: '2026-07-19', label: 'Segundo Bloque' }, gradeClose1: { start: '2026-05-19', end: '2026-05-25', label: 'Cierre notas Bloque 1' }, gradeClose2: { start: '2026-07-14', end: '2026-07-19', label: 'Cierre notas Bloque 2' }, periodClose: { start: '2026-07-20', end: '2026-07-26', label: 'Cierre período' } },
    '26V03': { label: 'Período 26V03', academic: { start: '2026-05-25', end: '2026-09-27' }, block1: { start: '2026-05-25', end: '2026-07-19', label: 'Primer Bloque' }, block2: { start: '2026-07-20', end: '2026-09-27', label: 'Segundo Bloque' } },
    '26V04': { label: 'Período 26V04', academic: { start: '2026-08-03', end: '2026-11-22' }, block1: { start: '2026-08-03', end: '2026-09-27', label: 'Primer Bloque' }, block2: { start: '2026-09-28', end: '2026-11-22', label: 'Segundo Bloque' } },
    '26V05': { label: 'Período 26V05', academic: { start: '2026-09-28', end: '2027-01-17' }, block1: { start: '2026-09-28', end: '2026-11-22', label: 'Primer Bloque' }, block2: { start: '2026-11-23', end: '2027-01-17', label: 'Segundo Bloque' } },
    '26V06': { label: 'Período 26V06', academic: { start: '2026-11-23', end: '2027-03-28' }, block1: { start: '2026-11-23', end: '2027-01-17', label: 'Primer Bloque' }, block2: { start: '2027-01-18', end: '2027-03-28', label: 'Segundo Bloque' } },
  };

  // ── BLOCK 1 ACTIVITIES (Período 26V02 — Calendario oficial CUN 2026A, verificado contra PDF) ──
  // Aplica a las 3 materias académicas: ing_web, mat_especiales, inv_ciencia
  // English Beginner (IV001) y Placement Test (IV002) usan flujos separados
  const BLOCK_ACTIVITIES = [
    { week: 1, start: '2026-03-30', end: '2026-04-05', name: 'Introducción',                                            weight: 0,  type: 'session', cut: 1 },
    { week: 2, start: '2026-04-06', end: '2026-04-12', name: 'Quiz 1',                                                  weight: 10, type: 'quiz',    cut: 1 },
    { week: 3, start: '2026-04-13', end: '2026-04-19', name: 'Parcial 1',                                               weight: 20, type: 'exam',    cut: 1, cutLabel: 'Primer Corte 30%' },
    { week: 4, start: '2026-04-20', end: '2026-04-26', name: 'Quiz 2',                                                  weight: 10, type: 'quiz',    cut: 2 },
    { week: 5, start: '2026-04-27', end: '2026-05-03', name: 'Parcial 2',                                               weight: 20, type: 'exam',    cut: 2, cutLabel: 'Segundo Corte 30%' },
    { week: 6, start: '2026-05-04', end: '2026-05-16', name: 'ACA · Pitch Disciplinares-NIP',                           weight: 34, type: 'project', cut: 3 },
    { week: 7, start: '2026-05-11', end: '2026-05-16', name: 'Quiz 3 (2%) + Coevaluación (2%) + Autoevaluación (2%)',    weight: 6,  type: 'quiz',    cut: 3, cutLabel: 'Tercer Corte 40%' },
    { week: 8, start: '2026-05-18', end: '2026-05-24', name: 'Cierre de Notas',                                         weight: 0,  type: 'closing', cut: 3, cutLabel: '100%' },
  ];

  // Subjects que siguen este calendario académico estándar
  const ACADEMIC_SUBJ_IDS = ['ing_web', 'mat_especiales', 'inv_ciencia'];

  // ── MALLA CURRICULAR (10 semesters, from official PDF) ──
  const MALLA = [
    { sem: 1, level: 'Técnica Profesional', subjects: ['Fundamentos de Programación','Introducción a Sistemas Informáticos','Cátedra Pensamiento Cunista I','Cableado Estructurado','Habilidades Comunicativas','Circuitos Básicos','Explorar para Investigar','Espíritu Emprendedor'] },
    { sem: 2, level: 'Técnica Profesional', subjects: ['Programación Avanzada','Mantenimiento de SO','Cátedra Pensamiento Cunista II','Redes I','Razonamiento Cuantitativo','Arquitectura y Mto. de Computadores','Creatividad y Pensamiento Innovador','Proyecto de Vida'] },
    { sem: 3, level: 'Técnica Profesional', subjects: ['POO I','Bases de Datos I','Formación Ciudadana','Redes II','Informática y Convergencia','Mantenimiento Dispositivos Móviles','Electiva Complementaria I','Práctica Técnica'] },
    { sem: 4, level: 'Técnica Profesional', subjects: ['POO II','Bases de Datos II','Cátedra Pensamiento Cunista III','Enrutamiento y Conmutación','Estadística Descriptiva','Lógica para Ingeniería','Electiva Complementaria II','Opción de Grado Técnico'] },
    { sem: 5, level: 'Tecnología en Desarrollo de Software', subjects: ['Programación Web','Bases de Datos III','Requerimientos de Software','Seguridad en Redes','Fundamentos de Física Eléctrica','Cálculo Diferencial','Electiva Complementaria III','Práctica Tecnológica'] },
    { sem: 6, level: 'Tecnología en Desarrollo de Software', subjects: ['Desarrollo Web','Diseño de Software','Arquitectura de Software','Computación en la Nube','Álgebra Lineal','Cálculo Integral','Investigación Ciencia y Tecnología','Opción de Grado Tecnológico'] },
    { sem: 7, level: 'Tecnología en Desarrollo de Software', subjects: ['Ingeniería Web','Calidad de Software','Analitica de Datos','Actualización en Telecomunicaciones','Física Mecánica','Cálculo Multivariado','Plan de Negocios I'] },
    { sem: 8, level: 'Ingeniería de Sistemas', subjects: ['Matemáticas Discretas','Álgebra Moderna','Refinamiento en Producción de Software','Administración de Base de Datos','Redes Inalámbricas','Ecuaciones Diferenciales','Plan de Negocios II','Electiva de Profundización I'] },
    { sem: 9, level: 'Ingeniería de Sistemas', subjects: ['Matemáticas Especiales','Inteligencia de Negocios','Gerencia en Proyectos Informáticos','Investigación de Operaciones','Innovación Tecnológica de Redes','Trabajo de Investigación','Electiva de Profundización II'] },
    { sem: 10, level: 'Ingeniería de Sistemas', subjects: ['Auditoría de Sistemas','Electiva de Profundización III','Práctica Profesional','Opción de Grado Profesional'] },
  ];

  // ── SKILL MODULES — Roadmap de Ing. Informática + énfasis AI/Data Science ──
  // Auditado 2026-05-27 · cada SKILL es un módulo desplegable con learning
  // path ordenado: principiante → intermedio → avanzado → pro.
  // Cada cert lleva:
  //   · level: nivel del path
  //   · learn: qué aprenderás (bullets)
  //   · relatesTo: cómo se conecta con el siguiente paso
  //   · reputation: alta / media / nicho — peso del cert en el mercado
  //   · demand: demanda actual del skill
  //   · cost: GRATIS o precio si es pro (incluido para que veas la siguiente
  //     inversión real después de exprimir las gratis).
  // Fuentes curadas: Harvard, U. Helsinki, Linux Foundation, MIT (vía edX),
  // Google, Microsoft, AWS, Oracle, IBM, Cisco, Hugging Face, freeCodeCamp,
  // Kaggle, MongoDB, Databricks, Postman, DeepLearning.AI, Meta, fast.ai,
  // CertiProf, Scrum.org, Applitools, Atlassian, Docker, Cambridge, EF,
  // British Council, ISTQB.
  const SKILL_MODULES = [
    // ═══ 🐍 PYTHON · base de todo el stack moderno ═══════════════
    { id: 'python', name: 'Python', icon: '🐍', color: 'hsl(220,80%,55%)',
      summary: 'El lenguaje #1 del mundo tech. Base de IA, Data Science, automatización y backend moderno.',
      why: 'Sin Python no podés ser ML Engineer ni Data Scientist. Es la herramienta más versátil y demandada del mercado. Empezá acá.',
      demand: 'Muy Alta · TIOBE #1 desde 2021',
      roles: ['Data Scientist', 'ML Engineer', 'Backend Dev', 'Data Engineer', 'AI Researcher', 'DevOps'],
      duration: '3-6 meses al nivel intermedio sólido',
      next: ['data_analysis', 'ml'],
      certs: [
        { level: 'principiante', order: 1, name: 'Intro to Programming (Python)', issuer: 'Kaggle Learn', icon: '🥚', color: 'hsl(120,60%,45%)', desc: 'Python desde cero: variables, loops, funciones. Tu primer paso si nunca programaste.', learn: ['Variables y tipos', 'Conditionals (if/else)', 'Loops (for, while)', 'Funciones'], relatesTo: 'Base para todo lo demás. Después acá, vas a PCAP o HackerRank Basic.', hours: 15, link: 'https://www.kaggle.com/learn/intro-to-programming', free: true, cost: 'GRATIS', reputation: 'Práctico Kaggle', featured: false },
        { level: 'intermedio', order: 2, name: 'PCAP · Python Programming Essentials', issuer: 'Cisco NetAcad', icon: '🎓', color: 'hsl(220,80%,55%)', desc: 'Curso oficial Cisco completo. La base profesional de Python que todo Ing usa.', learn: ['OOP completo', 'Modules y packages', 'Exceptions', 'File I/O', 'List comprehensions', 'Decoradores'], relatesTo: 'Después: HackerRank Intermediate · prereq directa para PCPP (pro).', hours: 60, link: 'https://www.netacad.com/courses/python-essentials-1', free: true, cost: 'GRATIS', reputation: 'Cisco · reconocido globalmente', featured: true },
        { level: 'intermedio', order: 3, name: 'Python (Basic + Intermediate)', issuer: 'HackerRank', icon: '✅', color: 'hsl(120,60%,40%)', desc: 'Tests cronometrados con certificado verificable. Bueno para LinkedIn y validar nivel.', learn: ['Sintaxis bajo presión', 'Algoritmos básicos', 'Manejo de strings', 'Funciones avanzadas'], relatesTo: 'Refuerza lo de PCAP. El test mismo es una mini-entrevista técnica.', hours: 20, link: 'https://www.hackerrank.com/skills-directory/python', free: true, cost: 'GRATIS', reputation: 'HackerRank · usado por reclutadores', featured: false },
        { level: 'avanzado', order: 4, name: 'Problem Solving (Basic + Intermediate)', issuer: 'HackerRank', icon: '🧩', color: 'hsl(45,75%,50%)', desc: 'Estructuras de datos y algoritmos en Python. Esencial para entrevistas FAANG y Big Tech.', learn: ['Big-O y complejidad', 'Arrays, hash maps, trees', 'Recursión y DP básica', 'Greedy y two-pointers'], relatesTo: 'El skill que abre puertas a Big Tech. Combina con LeetCode para práctica continua.', hours: 60, link: 'https://www.hackerrank.com/skills-directory/problem_solving', free: true, cost: 'GRATIS', reputation: 'Estándar entrevistas técnicas', featured: false },
        { level: 'pro', order: 5, name: 'PCPP-32-101 · Python Professional 1', issuer: 'Python Institute · OpenEDG', icon: '🏆', color: 'hsl(220,80%,40%)', desc: 'Cert oficial vía Pearson VUE. Reconocida globalmente para roles senior Python. Inversión que paga.', learn: ['OOP avanzado', 'GUI', 'Network programming', 'Files & DBs', 'PEPs', 'Math/Stats con Python'], relatesTo: 'El siguiente paso después de PCAP. Diferenciador en CV para roles senior.', hours: 80, link: 'https://pythoninstitute.org/pcpp1', free: false, cost: 'USD 195', reputation: 'Python Institute · industry standard', featured: false },
      ]
    },

    // ═══ 🗄️ SQL & BASES DE DATOS ════════════════════════════════
    { id: 'sql', name: 'SQL & Bases de Datos', icon: '🗄️', color: 'hsl(210,75%,50%)',
      summary: 'El lenguaje universal de datos. Toda empresa lo necesita y todo Data Scientist lo usa diario.',
      why: 'SQL es el skill #2 más demandado después de programación. Sin SQL no podés ser Data Analyst, DS, ni siquiera Backend serio. Imprescindible.',
      demand: 'Muy Alta · transversal a TODO rol de datos',
      roles: ['Data Analyst', 'Data Engineer', 'DBA', 'BI Developer', 'Backend Dev'],
      duration: '2-3 meses al nivel avanzado',
      next: ['data_analysis', 'bigdata'],
      certs: [
        { level: 'principiante', order: 1, name: 'SQL (Basic)', issuer: 'HackerRank', icon: '🔰', color: 'hsl(210,75%,55%)', desc: 'Empezá acá si nunca tocaste SQL. SELECT, WHERE, JOINs simples.', learn: ['SELECT, FROM, WHERE', 'JOINs (INNER, LEFT)', 'GROUP BY básico', 'Funciones agregadas (COUNT, SUM, AVG)'], relatesTo: 'Base para SQL Intermediate y para Pandas (sintaxis similar).', hours: 10, link: 'https://www.hackerrank.com/skills-verification/sql_basic', free: true, cost: 'GRATIS', reputation: 'HackerRank · estándar reclutadores', featured: true },
        { level: 'intermedio', order: 2, name: 'SQL (Intermediate)', issuer: 'HackerRank', icon: '📊', color: 'hsl(210,75%,45%)', desc: 'Window functions, CTEs, subqueries complejas. El nivel real de un Data Analyst.', learn: ['Window functions (RANK, ROW_NUMBER)', 'CTEs (WITH)', 'Subqueries correladas', 'CASE WHEN avanzado'], relatesTo: 'Lo que separa juniors de mid-level en entrevistas de datos.', hours: 20, link: 'https://www.hackerrank.com/skills-verification/sql_intermediate', free: true, cost: 'GRATIS', reputation: 'HackerRank · usado en filtros técnicos', featured: false },
        { level: 'avanzado', order: 3, name: 'SQL (Advanced)', issuer: 'HackerRank', icon: '🚀', color: 'hsl(210,75%,35%)', desc: 'Recursividad, pivot, optimización, indexes. Tema para roles senior.', learn: ['Recursive CTEs', 'PIVOT / UNPIVOT', 'Query optimization', 'Indexing strategy'], relatesTo: 'Prereq mental para los certs Pro de Microsoft/Oracle SQL.', hours: 20, link: 'https://www.hackerrank.com/skills-verification/sql_advanced', free: true, cost: 'GRATIS', reputation: 'HackerRank', featured: false },
        { level: 'avanzado', order: 4, name: 'MongoDB Basics (M001)', issuer: 'MongoDB University', icon: '🍃', color: 'hsl(142,60%,40%)', desc: 'NoSQL · la BD #1 no-relacional. Cert oficial MongoDB.', learn: ['Documentos vs filas', 'CRUD MongoDB', 'Aggregation pipeline', 'Indexes y performance'], relatesTo: 'Complementa SQL — toda app moderna combina ambos.', hours: 15, link: 'https://learn.mongodb.com/courses/m001-mongodb-basics', free: true, cost: 'GRATIS', reputation: 'MongoDB oficial', featured: false },
        { level: 'pro', order: 5, name: 'Oracle Database SQL Certified Associate (1Z0-071)', issuer: 'Oracle', icon: '🔶', color: 'hsl(15,80%,50%)', desc: 'Cert oficial Oracle SQL. Reconocida globalmente para roles de DBA y Data Engineer.', learn: ['SQL avanzado Oracle', 'Subqueries multi-tabla', 'DDL/DML completo', 'Schemas y constraints'], relatesTo: 'Después de HackerRank Advanced. Marca tu CV como SQL professional.', hours: 40, link: 'https://education.oracle.com/oracle-database-sql-certified-associate/trackp_457', free: false, cost: 'USD 245', reputation: 'Oracle · industry standard DBA', featured: false },
      ]
    },

    // ═══ 📊 ANÁLISIS DE DATOS · Pandas, NumPy, Stats ════════════════
    { id: 'data_analysis', name: 'Análisis de Datos', icon: '📊', color: 'hsl(43,80%,50%)',
      summary: 'Limpieza, transformación, exploración. El día a día de un Data Scientist es 80% esto.',
      why: 'Antes de modelos hay datos. Y los datos vienen sucios, incompletos, sesgados. Saber prepararlos es lo que separa un proyecto exitoso de un fracaso.',
      demand: 'Muy Alta · base para todo rol DS/DA',
      roles: ['Data Analyst', 'Data Scientist', 'BI Engineer', 'Analytics Engineer'],
      duration: '2-4 meses al nivel profesional',
      next: ['ml', 'bigdata'],
      certs: [
        { level: 'principiante', order: 1, name: 'Pandas', issuer: 'Kaggle Learn', icon: '🐼', color: 'hsl(120,40%,40%)', desc: 'La librería Python #1 para datos. DataFrames son tu nuevo Excel con esteroides.', learn: ['DataFrames y Series', 'Indexing y selecting', 'groupby y agregaciones', 'merge y joins', 'missing data'], relatesTo: 'Imprescindible para ML, Viz y todo lo siguiente. Empezá acá.', hours: 12, link: 'https://www.kaggle.com/learn/pandas', free: true, cost: 'GRATIS', reputation: 'Kaggle · referencia Python data', featured: true },
        { level: 'principiante', order: 2, name: 'Data Visualization', issuer: 'Kaggle Learn', icon: '📈', color: 'hsl(43,80%,50%)', desc: 'Seaborn y matplotlib. Saber mostrar tus hallazgos es 50% del trabajo de un DA.', learn: ['Line, bar, scatter plots', 'Heatmaps y correlaciones', 'Distribution plots', 'Custom styling'], relatesTo: 'Combina con Pandas para reports completos. Prereq para Power BI / Tableau.', hours: 8, link: 'https://www.kaggle.com/learn/data-visualization', free: true, cost: 'GRATIS', reputation: 'Kaggle oficial', featured: false },
        { level: 'intermedio', order: 3, name: 'IBM Data Science Foundations', issuer: 'IBM SkillsBuild', icon: '💎', color: 'hsl(210,85%,40%)', desc: 'Path completo IBM con badges acreditables y proyectos guiados.', learn: ['Big data concepts', 'Python para datos', 'ML intro', 'Visualización avanzada', 'Storytelling'], relatesTo: 'Te lleva de Pandas/Viz a tener proyectos de portfolio.', hours: 60, link: 'https://skillsbuild.org/students/course-catalog/data-science', free: true, cost: 'GRATIS', reputation: 'IBM · reconocido por reclutadores', featured: true },
        { level: 'avanzado', order: 4, name: 'Google Data Analytics Professional Certificate', issuer: 'Google · Coursera', icon: '🟦', color: 'hsl(220,85%,55%)', desc: 'Path completo de Google. 7 cursos. Cert profesional reconocido globalmente.', learn: ['SQL avanzado', 'R básico', 'Tableau', 'Análisis exploratorio', 'Storytelling executive'], relatesTo: 'Te prepara para roles Data Analyst con salarios USD 60-80k.', hours: 240, link: 'https://www.coursera.org/professional-certificates/google-data-analytics', free: false, cost: 'USD 49/mes (~6 meses)', reputation: 'Google · top-tier para reclutamiento', featured: false },
        { level: 'pro', order: 5, name: 'Microsoft Power BI Data Analyst (PL-300)', issuer: 'Microsoft', icon: '🔷', color: 'hsl(45,85%,55%)', desc: 'Cert oficial PL-300. Power BI domina BI corporativo en LATAM. Alta demanda.', learn: ['DAX (Data Analysis Expressions)', 'Power Query', 'Modelado dimensional', 'Dashboards profesionales'], relatesTo: 'Da un upgrade salarial inmediato. Power BI = pasaporte a BI corporativo.', hours: 60, link: 'https://learn.microsoft.com/credentials/certifications/data-analyst-associate/', free: false, cost: 'USD 165', reputation: 'Microsoft · top en BI', featured: false },
      ]
    },

    // ═══ 🤖 MACHINE LEARNING ════════════════════════════════════
    { id: 'ml', name: 'Machine Learning', icon: '🤖', color: 'hsl(195,85%,50%)',
      summary: 'Construir sistemas que aprenden de datos. El skill más buscado en 2026.',
      why: 'ML Engineers son los profesionales mejor pagados en tech (USD 120k-200k+). Demanda explotó con la IA generativa. Tu énfasis de carrera.',
      demand: 'Explosiva · escasez global de talento',
      roles: ['ML Engineer', 'Data Scientist', 'AI Researcher', 'Applied Scientist'],
      duration: '6-12 meses con dedicación seria',
      next: ['deep_learning', 'nlp_genai'],
      certs: [
        { level: 'principiante', order: 1, name: 'Elements of AI', issuer: 'Universidad de Helsinki', icon: '🎓', color: 'hsl(195,85%,50%)', desc: 'EL curso intro a IA del mundo. +1M completados. Sin código · conceptos sólidos.', learn: ['Qué es IA realmente', 'ML supervisado/no supervisado', 'Redes neuronales conceptual', 'Ética en IA', 'Futuro del trabajo'], relatesTo: 'Punto de partida obligatorio. Cero código. Para tener la mentalidad correcta antes de ensuciarte con Python.', hours: 30, link: 'https://www.elementsofai.com/', free: true, cost: 'GRATIS', reputation: 'Universidad de Helsinki · cert verificable', featured: true },
        { level: 'principiante', order: 2, name: 'Machine Learning Crash Course', issuer: 'Google', icon: '🔬', color: 'hsl(220,90%,55%)', desc: 'Curso oficial Google. 15 horas con código real en TensorFlow.', learn: ['Loss functions', 'Gradient descent', 'Generalization y overfitting', 'Regularization', 'Neural nets intro'], relatesTo: 'Después de Elements of AI. Te mete las manos en TF sin que duela.', hours: 15, link: 'https://developers.google.com/machine-learning/crash-course', free: true, cost: 'GRATIS', reputation: 'Google AI Education', featured: true },
        { level: 'intermedio', order: 3, name: 'Intro to Machine Learning', issuer: 'Kaggle Learn', icon: '🌳', color: 'hsl(195,85%,50%)', desc: 'Scikit-learn práctico. Tu primer modelo real con código que funciona.', learn: ['Decision trees', 'Random forests', 'Cross-validation', 'Model evaluation', 'Sklearn API'], relatesTo: 'Bridge entre teoría (Google MLCC) y práctica diaria en Kaggle.', hours: 8, link: 'https://www.kaggle.com/learn/intro-to-machine-learning', free: true, cost: 'GRATIS', reputation: 'Kaggle · estándar práctico', featured: false },
        { level: 'intermedio', order: 4, name: 'Intermediate Machine Learning', issuer: 'Kaggle Learn', icon: '🎯', color: 'hsl(195,75%,45%)', desc: 'Pipelines, XGBoost, manejo serio de missing values.', learn: ['Missing values strategies', 'Categorical encoding', 'sklearn Pipelines', 'XGBoost', 'Data leakage'], relatesTo: 'Próximo paso natural. Acá es donde dejás de ser principiante.', hours: 10, link: 'https://www.kaggle.com/learn/intermediate-machine-learning', free: true, cost: 'GRATIS', reputation: 'Kaggle', featured: false },
        { level: 'avanzado', order: 5, name: 'Feature Engineering', issuer: 'Kaggle Learn', icon: '⚙️', color: 'hsl(35,80%,50%)', desc: 'El skill más subvalorado y más impactante. Donde se gana o pierde el modelo.', learn: ['Mutual information', 'Target encoding', 'Clustering features', 'Principal components'], relatesTo: 'Una vez sabés esto, ganás competiciones de Kaggle. Y entrevistas.', hours: 8, link: 'https://www.kaggle.com/learn/feature-engineering', free: true, cost: 'GRATIS', reputation: 'Kaggle', featured: false },
        { level: 'pro', order: 6, name: 'Machine Learning Specialization', issuer: 'DeepLearning.AI · Coursera', icon: '🏆', color: 'hsl(220,80%,40%)', desc: 'Por Andrew Ng — el GOAT. 3 cursos. El estándar de oro de ML.', learn: ['Linear/Logistic regression desde cero', 'Neural networks fundamentals', 'Unsupervised learning', 'Recommender systems', 'Reinforcement learning'], relatesTo: 'La especialización que ven todos los hiring managers de ML. Inversión que paga.', hours: 100, link: 'https://www.coursera.org/specializations/machine-learning-introduction', free: false, cost: 'USD 49/mes (~3 meses)', reputation: 'Andrew Ng · GOAT de ML', featured: true },
        { level: 'pro', order: 7, name: 'AWS Certified Machine Learning Specialty (MLS-C01)', issuer: 'AWS', icon: '☁️', color: 'hsl(35,90%,50%)', desc: 'La cert ML más reconocida del mercado. Demuestra que sabés llevar ML a producción.', learn: ['SageMaker', 'Data engineering AWS', 'Modelado', 'ML Ops básico'], relatesTo: 'Para ML Engineers seniors. Después de Andrew Ng + experiencia práctica.', hours: 80, link: 'https://aws.amazon.com/certification/certified-machine-learning-specialty/', free: false, cost: 'USD 300', reputation: 'AWS · top cert ML mercado', featured: false },
      ]
    },

    // ═══ 🧠 DEEP LEARNING ═══════════════════════════════════════
    { id: 'deep_learning', name: 'Deep Learning', icon: '🧠', color: 'hsl(280,70%,55%)',
      summary: 'Redes neuronales profundas. La tecnología detrás de ChatGPT, Stable Diffusion, autos autónomos.',
      why: 'Deep learning impulsa todo el boom actual de IA. Para roles avanzados (Research Engineer, AI Scientist) es indispensable.',
      demand: 'Alta · pico de hype + demanda real',
      roles: ['Deep Learning Engineer', 'Research Engineer', 'CV Engineer', 'NLP Engineer'],
      duration: '4-8 meses (requiere ML previo)',
      next: ['nlp_genai'],
      certs: [
        { level: 'principiante', order: 1, name: 'Intro to Deep Learning', issuer: 'Kaggle Learn', icon: '🌱', color: 'hsl(280,70%,55%)', desc: 'Redes neuronales con Keras. Sin matemática pesada — pura intuición + código.', learn: ['Neuronas y capas', 'Activation functions', 'Backpropagation intuitiva', 'TensorFlow/Keras basics'], relatesTo: 'Entrada amistosa al DL. Después: Computer Vision o fast.ai.', hours: 8, link: 'https://www.kaggle.com/learn/intro-to-deep-learning', free: true, cost: 'GRATIS', reputation: 'Kaggle', featured: false },
        { level: 'intermedio', order: 2, name: 'Computer Vision', issuer: 'Kaggle Learn', icon: '👁️', color: 'hsl(160,70%,45%)', desc: 'CNNs · transfer learning · clasificación de imágenes. Aplicación más popular del DL.', learn: ['Convolutional layers', 'Transfer learning con modelos pre-entrenados', 'Data augmentation', 'Image classification end-to-end'], relatesTo: 'Skill aplicado más demandado dentro de DL. Combina con fast.ai.', hours: 10, link: 'https://www.kaggle.com/learn/computer-vision', free: true, cost: 'GRATIS', reputation: 'Kaggle', featured: true },
        { level: 'avanzado', order: 3, name: 'Practical Deep Learning for Coders', issuer: 'fast.ai', icon: '🚀', color: 'hsl(280,75%,45%)', desc: 'EL curso práctico de DL del mundo. Jeremy Howard te enseña a entrenar SOTA en sesiones reales.', learn: ['fastai library', 'Transfer learning avanzado', 'NLP con DL', 'Tabular DL', 'Mejores prácticas de entrenamiento'], relatesTo: 'No es cert pero es OBLIGATORIO si querés ser serio en DL.', hours: 80, link: 'https://course.fast.ai/', free: true, cost: 'GRATIS', reputation: 'fast.ai · referencia mundial', featured: true },
        { level: 'pro', order: 4, name: 'Deep Learning Specialization', issuer: 'DeepLearning.AI · Coursera', icon: '🏆', color: 'hsl(280,80%,40%)', desc: 'Andrew Ng nuevamente. 5 cursos. El cert DL más respetado en LATAM y mundo.', learn: ['NNs from scratch', 'CNNs profundos', 'RNNs y LSTMs', 'Transformers basics', 'Strategy de ML projects'], relatesTo: 'Inversión definitiva en DL. Lo que tu LinkedIn necesita para roles DL serios.', hours: 120, link: 'https://www.coursera.org/specializations/deep-learning', free: false, cost: 'USD 49/mes (~4 meses)', reputation: 'Andrew Ng · estándar DL global', featured: true },
        { level: 'pro', order: 5, name: 'TensorFlow Developer Certificate', issuer: 'Google · TensorFlow', icon: '🔶', color: 'hsl(35,90%,50%)', desc: 'Cert oficial Google de TensorFlow. Examen práctico de 5 horas.', learn: ['TF para CV', 'TF para NLP', 'TF para series temporales', 'Optimización de modelos'], relatesTo: 'Demuestra que SÍ podés codear DL en producción.', hours: 40, link: 'https://www.tensorflow.org/certificate', free: false, cost: 'USD 100', reputation: 'Google TensorFlow oficial', featured: false },
      ]
    },

    // ═══ 🤗 NLP & GENERATIVE AI (LLMs) ══════════════════════════
    { id: 'nlp_genai', name: 'NLP & Generative AI', icon: '🤗', color: 'hsl(45,95%,55%)',
      summary: 'Procesamiento de Lenguaje Natural + LLMs (GPT, Claude, Llama). El frente más caliente de la IA.',
      why: 'Toda empresa quiere chatbots, RAG, asistentes. Hugging Face + LangChain dominan el ecosistema. Acá es donde se pagan los salarios USD 200k+.',
      demand: 'Explosiva 2024-2026 · #1 skill emergente',
      roles: ['NLP Engineer', 'LLM Engineer', 'AI Application Developer', 'Prompt Engineer'],
      duration: '3-6 meses (necesitás DL básico antes)',
      next: [],
      certs: [
        { level: 'intermedio', order: 1, name: 'Hugging Face Course (NLP + Transformers)', issuer: 'Hugging Face', icon: '🤗', color: 'hsl(45,95%,55%)', desc: 'El curso oficial de Hugging Face — el GitHub de los modelos AI. NLP de última generación.', learn: ['Transformers architecture', 'BERT, GPT, Llama', 'Fine-tuning', 'Datasets library', 'Deploy con HF Spaces'], relatesTo: 'Después de DL básico. Te conecta directo al ecosistema profesional GenAI.', hours: 60, link: 'https://huggingface.co/learn/nlp-course', free: true, cost: 'GRATIS', reputation: 'Hugging Face · estándar GenAI', featured: true },
        { level: 'avanzado', order: 2, name: 'NLP Specialization', issuer: 'DeepLearning.AI · Coursera', icon: '💬', color: 'hsl(45,90%,40%)', desc: '4 cursos · Andrew Ng. De clasificación de texto a attention mechanisms.', learn: ['Word embeddings', 'Sentiment analysis', 'Machine translation', 'Seq2Seq', 'Attention y Transformers'], relatesTo: 'Profundiza lo de HF Course con bases teóricas sólidas.', hours: 90, link: 'https://www.coursera.org/specializations/natural-language-processing', free: false, cost: 'USD 49/mes (~3 meses)', reputation: 'DeepLearning.AI', featured: false },
        { level: 'pro', order: 3, name: 'Microsoft Azure AI Engineer (AI-102)', issuer: 'Microsoft', icon: '🔷', color: 'hsl(210,80%,50%)', desc: 'Cert oficial AI-102. Construir aplicaciones AI en Azure usando Cognitive Services + OpenAI Service.', learn: ['Azure OpenAI', 'Cognitive Services', 'Language understanding', 'CV en Azure', 'AI responsibility'], relatesTo: 'Para llevar tus skills NLP a un cert empresarial reconocido.', hours: 60, link: 'https://learn.microsoft.com/credentials/certifications/azure-ai-engineer/', free: false, cost: 'USD 165', reputation: 'Microsoft · enterprise AI', featured: false },
      ]
    },

    // ═══ ☁️ CLOUD COMPUTING ═════════════════════════════════════
    { id: 'cloud', name: 'Cloud Computing', icon: '☁️', color: 'hsl(15,80%,50%)',
      summary: 'AWS, Azure, GCP, Oracle. Toda app moderna corre en cloud — sin cloud, no hay carrera.',
      why: 'AWS solo factura USD 90B/año. Cloud Architects son top earners. Aprendelo o quedate fuera del 80% de las ofertas.',
      demand: 'Muy Alta · transversal a todo tech',
      roles: ['Cloud Engineer', 'Solutions Architect', 'DevOps Engineer', 'Cloud Security'],
      duration: '3-6 meses (depende del nivel)',
      next: ['devops', 'bigdata'],
      certs: [
        { level: 'principiante', order: 1, name: 'OCI Foundations Associate', issuer: 'Oracle MyLearn', icon: '🔶', color: 'hsl(15,80%,50%)', desc: 'EXAMEN OFICIAL GRATUITO real. Oracle hace el cert verdaderamente accesible.', learn: ['Cloud concepts', 'Compute, Storage, Networking en OCI', 'Identity & security', 'Pricing y billing'], relatesTo: 'Primera cert cloud sin pagar. Brand reconocido. Buenísima para empezar.', hours: 30, link: 'https://mylearn.oracle.com/ou/learning-path/become-an-oci-foundations-associate-2024/138393', free: true, cost: 'GRATIS', reputation: 'Oracle · cert real sin pago', featured: true },
        { level: 'principiante', order: 2, name: 'AWS Cloud Quest · Cloud Practitioner', issuer: 'AWS Skill Builder', icon: '🎮', color: 'hsl(35,90%,55%)', desc: 'Aprende AWS jugando en un mundo 3D. Badge oficial digital. Divertido y efectivo.', learn: ['EC2, S3, RDS, Lambda', 'IAM básico', 'VPCs', 'CloudWatch'], relatesTo: 'Te prepara mentalmente para CLF-C02 (cert paga).', hours: 20, link: 'https://aws.amazon.com/training/digital/aws-cloud-quest/', free: true, cost: 'GRATIS', reputation: 'AWS oficial gamificado', featured: true },
        { level: 'intermedio', order: 3, name: 'Azure Fundamentals (AZ-900) · Path', issuer: 'Microsoft Learn', icon: '🔷', color: 'hsl(210,80%,50%)', desc: 'Training oficial Microsoft para AZ-900. El curso es gratis (el examen sí cuesta).', learn: ['Azure architecture', 'Compute, networking, storage Azure', 'Identity (Entra ID)', 'Governance'], relatesTo: 'Cubre el 70% de lo que se ve en LATAM (banca y enterprise).', hours: 12, link: 'https://learn.microsoft.com/training/paths/azure-fundamentals/', free: true, cost: 'GRATIS (examen: USD 99)', reputation: 'Microsoft path oficial', featured: false },
        { level: 'pro', order: 4, name: 'AWS Certified Cloud Practitioner (CLF-C02)', issuer: 'AWS', icon: '☁️', color: 'hsl(35,90%,45%)', desc: 'Primera cert AWS oficial. Inversión mínima · ROI altísimo en CV.', learn: ['Pilares AWS', 'Servicios core profundos', 'Pricing y billing', 'Cloud adoption framework'], relatesTo: 'Te pone en el radar de reclutadores. Punto.', hours: 40, link: 'https://aws.amazon.com/certification/certified-cloud-practitioner/', free: false, cost: 'USD 100', reputation: 'AWS · cert entry-level estándar', featured: false },
        { level: 'pro', order: 5, name: 'AWS Solutions Architect Associate (SAA-C03)', issuer: 'AWS', icon: '🏗️', color: 'hsl(35,90%,40%)', desc: 'LA cert AWS más demandada y mejor pagada en LATAM. El siguiente nivel tras CLF.', learn: ['Diseño de arquitecturas resilientes', 'Costo + performance', 'Seguridad multi-capa', 'Migration'], relatesTo: 'Salto salarial directo al obtenerla. Apúntale después de 1-2 años AWS hands-on.', hours: 80, link: 'https://aws.amazon.com/certification/certified-solutions-architect-associate/', free: false, cost: 'USD 150', reputation: 'AWS · TOP demanda mercado', featured: true },
      ]
    },

    // ═══ 🌐 DESARROLLO WEB ══════════════════════════════════════
    { id: 'web_dev', name: 'Desarrollo Web', icon: '🌐', color: 'hsl(335,80%,55%)',
      summary: 'Frontend + Backend + APIs. La especialidad más amplia y con más oportunidades en LATAM.',
      why: 'Toda empresa necesita devs web. Y el mercado es enorme tanto local como remoto.',
      demand: 'Alta · sostenida hace 10+ años',
      roles: ['Frontend Dev', 'Backend Dev', 'Full-stack Dev', 'Web Architect'],
      duration: '6-12 meses para ser empleable',
      next: ['devops'],
      certs: [
        { level: 'principiante', order: 1, name: 'Responsive Web Design', issuer: 'freeCodeCamp', icon: '🎨', color: 'hsl(335,80%,55%)', desc: 'HTML5 + CSS3 + Flexbox + Grid + accesibilidad. 300h. Cert verificable.', learn: ['HTML semántico', 'CSS layouts modernos', 'Responsive design', 'Accesibilidad (a11y)'], relatesTo: 'Punto de partida obligatorio. Base para todo lo siguiente.', hours: 300, link: 'https://www.freecodecamp.org/learn/2022/responsive-web-design/', free: true, cost: 'GRATIS', reputation: 'freeCodeCamp · referencia global', featured: true },
        { level: 'intermedio', order: 2, name: 'JavaScript Essentials 1', issuer: 'Cisco NetAcad', icon: '🟨', color: 'hsl(45,90%,50%)', desc: 'Fundamentos JS oficial Cisco. Sintaxis · DOM · eventos · async.', learn: ['JS sintaxis moderna (ES6+)', 'DOM manipulation', 'Eventos y closures', 'Async/await y promises'], relatesTo: 'Después de RWD. Te abre el frontend dinámico.', hours: 40, link: 'https://www.netacad.com/courses/javascript-essentials-1', free: true, cost: 'GRATIS', reputation: 'Cisco', featured: false },
        { level: 'intermedio', order: 3, name: 'JS Algorithms & Data Structures', issuer: 'freeCodeCamp', icon: '🧮', color: 'hsl(35,90%,50%)', desc: 'ES6 · OOP · programación funcional · regex. 300h con cert.', learn: ['ES6+ avanzado', 'OOP en JS', 'Functional programming', 'Regex', 'AJAX y APIs'], relatesTo: 'Cierra el ciclo JS pro. Prereq para React seriamente.', hours: 300, link: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/', free: true, cost: 'GRATIS', reputation: 'fCC', featured: false },
        { level: 'avanzado', order: 4, name: 'Front End Development Libraries', issuer: 'freeCodeCamp', icon: '⚛️', color: 'hsl(195,85%,55%)', desc: 'React · Redux · Bootstrap · Sass. React = framework #1 del mercado laboral.', learn: ['React hooks', 'Component composition', 'Redux state management', 'CSS frameworks'], relatesTo: 'Con esto sos empleable como Frontend Junior.', hours: 300, link: 'https://www.freecodecamp.org/learn/front-end-development-libraries/', free: true, cost: 'GRATIS', reputation: 'fCC', featured: true },
        { level: 'avanzado', order: 5, name: 'API Fundamentals (Student Expert)', issuer: 'Postman Academy', icon: '📮', color: 'hsl(15,85%,55%)', desc: 'APIs REST end-to-end. Insignia oficial Postman.', learn: ['REST principles', 'Postman colecciones avanzadas', 'API testing', 'Authentication (JWT, OAuth)'], relatesTo: 'Para entender qué consumís desde frontend y qué exponés como backend.', hours: 20, link: 'https://academy.postman.com/path/postman-api-fundamentals-student-expert', free: true, cost: 'GRATIS', reputation: 'Postman', featured: false },
        { level: 'pro', order: 6, name: 'Meta Front-End Developer Certificate', issuer: 'Meta · Coursera', icon: '📘', color: 'hsl(220,85%,55%)', desc: 'Path completo de Meta (Facebook). 9 cursos. Reconocido para roles tier-1.', learn: ['React avanzado', 'UX/UI principles', 'Version control con Git', 'Coding interview prep'], relatesTo: 'Salto a roles mid-level con respaldo de Meta.', hours: 250, link: 'https://www.coursera.org/professional-certificates/meta-front-end-developer', free: false, cost: 'USD 49/mes (~7 meses)', reputation: 'Meta · top frontend cert', featured: false },
      ]
    },

    // ═══ 🐧 LINUX & SISTEMAS ════════════════════════════════════
    { id: 'linux_sys', name: 'Linux & Sistemas', icon: '🐧', color: 'hsl(45,85%,45%)',
      summary: 'Linux corre el 80% de los servidores del mundo y el 100% del cloud. Sin Linux no hay DevOps ni Cloud.',
      why: 'Es el sistema operativo de internet. Todo lo serio (servers, AI training, IoT) corre Linux.',
      demand: 'Alta · prereq para Cloud y DevOps',
      roles: ['SysAdmin', 'Cloud Engineer', 'DevOps', 'Security Engineer'],
      duration: '2-4 meses al nivel sólido',
      next: ['devops', 'cloud'],
      certs: [
        { level: 'principiante', order: 1, name: 'Linux Essentials', issuer: 'Cisco NetAcad', icon: '🐧', color: 'hsl(45,85%,45%)', desc: 'Línea de comandos · permisos · scripting · networking en Linux. Cert oficial Cisco.', learn: ['Filesystem y navegación', 'Permisos y users', 'Bash básico', 'Networking commands'], relatesTo: 'Base imprescindible para todo lo cloud/devops.', hours: 40, link: 'https://www.netacad.com/courses/linux-essentials', free: true, cost: 'GRATIS', reputation: 'Cisco oficial', featured: true },
        { level: 'intermedio', order: 2, name: 'Introduction to Linux (LFS101)', issuer: 'Linux Foundation · edX', icon: '🏛️', color: 'hsl(30,75%,50%)', desc: 'Curso oficial Linux Foundation. Audit gratis · cert verificable.', learn: ['Linux para usuarios y desarrolladores', 'Distribuciones', 'Package management', 'Scripting'], relatesTo: 'Profundiza lo de Cisco. Prereq mental para LPI y RHCSA.', hours: 40, link: 'https://www.edx.org/course/introduction-to-linux', free: true, cost: 'GRATIS', reputation: 'Linux Foundation', featured: false },
        { level: 'pro', order: 3, name: 'LPIC-1 Linux Administrator', issuer: 'LPI', icon: '🛡️', color: 'hsl(45,85%,35%)', desc: 'Cert vendor-neutral de Linux. Reconocida globalmente para SysAdmin roles.', learn: ['System architecture', 'Linux installation', 'Shell scripting avanzado', 'Networking config'], relatesTo: 'Estándar para roles SysAdmin pagados.', hours: 80, link: 'https://www.lpi.org/our-certifications/lpic-1-overview', free: false, cost: 'USD 200 x examen (2 exámenes)', reputation: 'LPI · vendor-neutral', featured: false },
        { level: 'pro', order: 4, name: 'Red Hat Certified System Administrator (RHCSA)', issuer: 'Red Hat', icon: '🎩', color: 'hsl(0,75%,40%)', desc: 'EL cert sysadmin más respetado. Examen 100% práctico (no preguntas).', learn: ['RHEL administration', 'Storage management', 'Selinux', 'systemd avanzado', 'Containers'], relatesTo: 'Cert que justifica salarios USD 70k+ en LATAM.', hours: 120, link: 'https://www.redhat.com/services/certification/rhcsa', free: false, cost: 'USD 400', reputation: 'Red Hat · gold standard sysadmin', featured: false },
      ]
    },

    // ═══ 🔌 NETWORKING ══════════════════════════════════════════
    { id: 'networking', name: 'Networking', icon: '🔌', color: 'hsl(195,80%,45%)',
      summary: 'TCP/IP, routing, switching, WiFi. La plomería de internet. Sin redes, nada conecta.',
      why: 'Toda app vive sobre la red. Cisco domina la industria con CCNA como cert puerta-de-entrada.',
      demand: 'Alta · base de cloud y security',
      roles: ['Network Engineer', 'Network Admin', 'Cloud Network Specialist'],
      duration: '4-6 meses para CCNA',
      next: ['cloud', 'security'],
      certs: [
        { level: 'principiante', order: 1, name: 'Networking Essentials', issuer: 'Cisco NetAcad', icon: '🌐', color: 'hsl(195,80%,45%)', desc: 'TCP/IP · OSI · routing · switching básico. Base para CCNA.', learn: ['Modelo OSI y TCP/IP', 'IP addressing y subnetting', 'Switching básico', 'WiFi fundamentals'], relatesTo: 'Empezá acá. Prereq directo para CCNA.', hours: 70, link: 'https://www.netacad.com/courses/networking-essentials', free: true, cost: 'GRATIS', reputation: 'Cisco oficial', featured: true },
        { level: 'intermedio', order: 2, name: 'CCNA Self-Paced', issuer: 'Cisco NetAcad', icon: '📡', color: 'hsl(195,85%,40%)', desc: 'Curso oficial preparatorio para CCNA. NetAcad lo ofrece sin costo de training.', learn: ['Routing dinámico (OSPF)', 'VLANs avanzadas', 'STP', 'WAN technologies', 'Network security básico'], relatesTo: 'Te lleva al examen CCNA (cert paga).', hours: 200, link: 'https://www.netacad.com/courses/networking/ccna-introduction-networks', free: true, cost: 'GRATIS (training)', reputation: 'Cisco NetAcad', featured: false },
        { level: 'pro', order: 3, name: 'CCNA · 200-301', issuer: 'Cisco', icon: '🏆', color: 'hsl(195,85%,35%)', desc: 'EL cert networking más demandado del mundo. Pasaporte para roles Network Engineer.', learn: ['Routing & switching avanzado', 'Network security', 'Automation y programmability', 'IP services'], relatesTo: 'La inversión que cambia tu CV de junior a empleable seriamente en redes.', hours: 200, link: 'https://www.cisco.com/c/en/us/training-events/training-certifications/certifications/associate/ccna.html', free: false, cost: 'USD 300', reputation: 'Cisco · GOLD STANDARD redes', featured: true },
      ]
    },

    // ═══ 🔒 CIBERSEGURIDAD ══════════════════════════════════════
    { id: 'security', name: 'Ciberseguridad', icon: '🔒', color: 'hsl(0,70%,50%)',
      summary: 'Defensa, ataque ético, criptografía. La carrera con MENOS desempleo del mundo tech.',
      why: 'Demanda crónicamente insatisfecha. Salarios top desde junior. Trabajo remoto abundante.',
      demand: 'Crítica · gap de 4M profesionales globalmente',
      roles: ['Security Analyst', 'Pentester', 'SOC Engineer', 'Security Architect', 'CISO'],
      duration: '6-12 meses para entry-level',
      next: ['cloud'],
      certs: [
        { level: 'principiante', order: 1, name: 'Introduction to Cybersecurity', issuer: 'Cisco NetAcad', icon: '🔒', color: 'hsl(0,70%,50%)', desc: 'Amenazas · ataques · vulnerabilidades · defensa · ética. Primera capa de pensar seguro.', learn: ['Threat landscape', 'Tipos de ataques (malware, phishing)', 'Defensa básica', 'Ética en seguridad'], relatesTo: 'Punto de partida obligatorio. Te da mentalidad correcta.', hours: 30, link: 'https://www.netacad.com/courses/introduction-to-cybersecurity', free: true, cost: 'GRATIS', reputation: 'Cisco', featured: true },
        { level: 'intermedio', order: 2, name: 'Cybersecurity Essentials', issuer: 'Cisco NetAcad', icon: '🛡️', color: 'hsl(0,75%,40%)', desc: 'Criptografía · controles de acceso · respuesta a incidentes. Path hacia CCNA Security.', learn: ['Criptografía simétrica/asimétrica', 'IAM y políticas', 'Incident response', 'Risk management'], relatesTo: 'Profundiza lo intro. Te prepara para Security+ y CCNA Security.', hours: 60, link: 'https://www.netacad.com/courses/cybersecurity-essentials', free: true, cost: 'GRATIS', reputation: 'Cisco', featured: false },
        { level: 'intermedio', order: 3, name: 'TryHackMe · Pre-Security Path', issuer: 'TryHackMe', icon: '🎯', color: 'hsl(15,80%,50%)', desc: 'Aprende hackeando en labs reales. Práctico vs teórico.', learn: ['Web hacking básico', 'Linux para hackers', 'Network exploitation', 'Scripting offensive'], relatesTo: 'La práctica que te falta de los cursos teóricos.', hours: 60, link: 'https://tryhackme.com/path/outline/presecurity', free: true, cost: 'GRATIS', reputation: 'TryHackMe · práctico', featured: false },
        { level: 'pro', order: 4, name: 'CompTIA Security+ (SY0-701)', issuer: 'CompTIA', icon: '🔰', color: 'hsl(0,75%,35%)', desc: 'EL cert security entry-level más reconocido. Aprobado por DoD USA.', learn: ['Threat analysis', 'Architecture and design', 'Operations and incident response', 'Compliance'], relatesTo: 'Te abre roles SOC L1, Junior Security Analyst.', hours: 80, link: 'https://www.comptia.org/certifications/security', free: false, cost: 'USD 370', reputation: 'CompTIA · industry standard entry', featured: true },
        { level: 'pro', order: 5, name: 'CISSP', issuer: 'ISC2', icon: '👑', color: 'hsl(0,80%,30%)', desc: 'EL cert security senior. Necesita 5 años exp. Salarios USD 100k+ inmediatos.', learn: ['8 dominios (Security & Risk · Asset · Architecture · Communication · IAM · Assessment · Ops · Software Dev Security)'], relatesTo: 'El destino final del seniority. Empezá a estudiarlo años antes.', hours: 200, link: 'https://www.isc2.org/certifications/cissp', free: false, cost: 'USD 749', reputation: 'ISC2 · TOP del mundo en security', featured: false },
      ]
    },

    // ═══ 🔧 DEVOPS & GIT ════════════════════════════════════════
    { id: 'devops', name: 'DevOps & Git', icon: '🔧', color: 'hsl(263,50%,50%)',
      summary: 'Git, Docker, K8s, CI/CD. La cultura + tooling que lleva código a producción confiablemente.',
      why: 'DevOps Engineers son los mejor pagados después de ML. Es el puente entre dev y ops.',
      demand: 'Muy Alta · seniors USD 120k+',
      roles: ['DevOps Engineer', 'SRE', 'Platform Engineer', 'Cloud Engineer'],
      duration: '4-8 meses para nivel intermedio',
      next: ['cloud', 'bigdata'],
      certs: [
        { level: 'principiante', order: 1, name: 'GitHub Foundations', issuer: 'Microsoft Learn', icon: '🐙', color: 'hsl(263,50%,50%)', desc: 'Git · GitHub Actions · PRs · security. Path oficial con badges + cert disponible.', learn: ['Git workflow profesional', 'PRs y code review', 'GitHub Actions (CI/CD)', 'Branch protection', 'Security scanning'], relatesTo: 'Git es el lenguaje universal del software. Sin esto, no podés colaborar.', hours: 30, link: 'https://learn.microsoft.com/training/paths/github-foundations/', free: true, cost: 'GRATIS', reputation: 'Microsoft Learn · top reconocimiento', featured: true },
        { level: 'intermedio', order: 2, name: 'Docker · Get Started', issuer: 'Docker Inc.', icon: '🐳', color: 'hsl(200,75%,50%)', desc: 'Containers · imágenes · Dockerfile · networks. Training oficial Docker.', learn: ['Containers vs VMs', 'Dockerfile profesional', 'docker-compose', 'Networking y volumes', 'Multi-stage builds'], relatesTo: 'Containers son la unidad básica del cloud moderno. Antes de K8s.', hours: 20, link: 'https://docs.docker.com/get-started/', free: true, cost: 'GRATIS', reputation: 'Docker oficial', featured: false },
        { level: 'intermedio', order: 3, name: 'Introduction to DevOps (LFS161)', issuer: 'Linux Foundation · edX', icon: '⚙️', color: 'hsl(280,55%,55%)', desc: 'Curso oficial Linux Foundation. CI/CD · cultura DevOps · automation.', learn: ['Cultura DevOps', 'CI/CD pipelines', 'Infrastructure as Code', 'Monitoring básico'], relatesTo: 'La teoría que necesitás antes de practicar con tools específicas.', hours: 40, link: 'https://www.edx.org/course/introduction-to-devops-practices-and-tools', free: true, cost: 'GRATIS', reputation: 'Linux Foundation', featured: false },
        { level: 'pro', order: 4, name: 'CKAD · Certified Kubernetes Application Developer', issuer: 'CNCF · Linux Foundation', icon: '☸️', color: 'hsl(263,55%,40%)', desc: 'Cert oficial Kubernetes. Examen 100% práctico de 2 horas. K8s es el cloud OS.', learn: ['Pods y workloads', 'Deployments y services', 'Networking K8s', 'Persistent storage', 'Troubleshooting'], relatesTo: 'Después de dominar Docker. K8s = el siguiente nivel de Cloud Native.', hours: 80, link: 'https://www.cncf.io/training/certification/ckad/', free: false, cost: 'USD 395', reputation: 'CNCF · Kubernetes oficial', featured: true },
      ]
    },

    // ═══ 🏞️ BIG DATA & MLOps ════════════════════════════════════
    { id: 'bigdata', name: 'Big Data & MLOps', icon: '🏞️', color: 'hsl(0,75%,50%)',
      summary: 'Spark, Kafka, Airflow, ML en producción. Donde los datos masivos se vuelven valor de negocio.',
      why: 'Toda empresa grande pelea con sus datos. Data Engineers y MLOps Engineers son escasos y bien pagados.',
      demand: 'Alta · senior shortage crítico',
      roles: ['Data Engineer', 'MLOps Engineer', 'Analytics Engineer', 'Platform Engineer'],
      duration: '6-12 meses (requiere SQL + Python sólidos)',
      next: [],
      certs: [
        { level: 'intermedio', order: 1, name: 'Databricks Lakehouse Fundamentals', issuer: 'Databricks Academy', icon: '🏞️', color: 'hsl(0,75%,50%)', desc: 'Lakehouse · Delta Lake · Spark. Cert oficial gratis.', learn: ['Lakehouse architecture', 'Delta Lake', 'Spark intro', 'Unity Catalog'], relatesTo: 'Databricks es la plataforma #1 de Data+AI a escala. Punto de entrada.', hours: 4, link: 'https://customer-academy.databricks.com/learn/course/1325/databricks-lakehouse-platform-accreditation', free: true, cost: 'GRATIS', reputation: 'Databricks oficial', featured: true },
        { level: 'intermedio', order: 2, name: 'Time Series Forecasting', issuer: 'Kaggle Learn', icon: '⏱️', color: 'hsl(15,75%,50%)', desc: 'Forecasting · tendencias · estacionalidad. Skill core de Data Engineering.', learn: ['Trend y seasonality', 'Time features', 'Forecasting with ML', 'Hybrid models'], relatesTo: 'Caso de uso #1 en industria (ventas, demand, IoT).', hours: 10, link: 'https://www.kaggle.com/learn/time-series', free: true, cost: 'GRATIS', reputation: 'Kaggle', featured: false },
        { level: 'pro', order: 3, name: 'Databricks Certified Data Engineer Associate', issuer: 'Databricks', icon: '🚀', color: 'hsl(0,80%,40%)', desc: 'Cert oficial Data Engineer en Databricks. Reconocida en Fortune 500.', learn: ['Spark SQL avanzado', 'Delta Lake en producción', 'ETL pipelines', 'Workflows orchestration'], relatesTo: 'Cert que abre puertas a roles Data Engineer USD 100k+.', hours: 60, link: 'https://www.databricks.com/learn/certification/data-engineer-associate', free: false, cost: 'USD 200', reputation: 'Databricks · enterprise gold', featured: false },
        { level: 'pro', order: 4, name: 'AWS Certified Data Engineer Associate (DEA-C01)', issuer: 'AWS', icon: '⚡', color: 'hsl(35,90%,40%)', desc: 'Cert oficial AWS para Data Engineers. Cubre todo el stack AWS de datos.', learn: ['AWS Glue', 'Kinesis', 'EMR', 'Redshift', 'Lake Formation'], relatesTo: 'Combina con Databricks para tener pasaporte multi-cloud.', hours: 60, link: 'https://aws.amazon.com/certification/certified-data-engineer-associate/', free: false, cost: 'USD 150', reputation: 'AWS oficial', featured: false },
      ]
    },

    // ═══ ✅ AGILE & PM ══════════════════════════════════════════
    { id: 'agile_pm', name: 'Agile & Project Management', icon: '✅', color: 'hsl(172,60%,45%)',
      summary: 'Scrum, Kanban, Jira. La habilidad humana que separa proyectos exitosos de fracasos.',
      why: 'Eventualmente liderarás. Y los Project Managers ganan tan bien como los devs senior.',
      demand: 'Alta · transversal a todo equipo',
      roles: ['Scrum Master', 'Product Owner', 'Project Manager', 'Tech Lead'],
      duration: '2-4 meses para SFPC, años para PMP',
      next: [],
      certs: [
        { level: 'principiante', order: 1, name: 'Scrum Foundation (SFPC)', issuer: 'CertiProf', icon: '🔄', color: 'hsl(172,60%,45%)', desc: 'Scrum framework · roles · eventos. Reconocida en LATAM. Vouchers gratis periódicos.', learn: ['Scrum theory', 'Roles (PO, SM, Dev Team)', 'Events (Sprint, Daily, Review, Retro)', 'Artifacts'], relatesTo: 'Tu primer cert agile profesional.', hours: 15, link: 'https://certiprof.com/pages/scrum-foundation-professional-certificate-sfpc-en', free: true, cost: 'GRATIS (con voucher)', reputation: 'CertiProf · top LATAM', featured: true },
        { level: 'intermedio', order: 2, name: 'Jira Fundamentals', issuer: 'Atlassian University', icon: '📋', color: 'hsl(220,85%,50%)', desc: 'Gestión ágil con Jira. Badge oficial Atlassian. Jira = herramienta #1 en empresas tech.', learn: ['Workflows custom', 'Boards (Scrum, Kanban)', 'Reports (Burndown, Velocity)', 'JQL queries'], relatesTo: 'Combina con Scrum SFPC para ser Scrum Master operativo.', hours: 5, link: 'https://university.atlassian.com/student/path/1077727-jira-fundamentals', free: true, cost: 'GRATIS', reputation: 'Atlassian oficial', featured: false },
        { level: 'pro', order: 3, name: 'Professional Scrum Master I (PSM I)', issuer: 'Scrum.org', icon: '🏆', color: 'hsl(172,60%,35%)', desc: 'Cert Scrum Master más respetada del mercado. Examen open-book online.', learn: ['Scrum profundo', 'Servant leadership', 'Coaching de equipos', 'Métricas ágiles'], relatesTo: 'El upgrade desde SFPC. Reconocida en USA y Europa.', hours: 30, link: 'https://www.scrum.org/professional-scrum-master-i-certification', free: false, cost: 'USD 200', reputation: 'Scrum.org · top del mundo', featured: true },
        { level: 'pro', order: 4, name: 'Project Management Professional (PMP)', issuer: 'PMI', icon: '👔', color: 'hsl(220,75%,40%)', desc: 'EL cert PM más reconocido del planeta. Requiere 3-5 años exp PM.', learn: ['Project lifecycle completo', 'Predictive + agile + híbrido', 'Stakeholder management', 'Risk management'], relatesTo: 'El destino senior. Salarios PM USD 100k+.', hours: 100, link: 'https://www.pmi.org/certifications/project-management-pmp', free: false, cost: 'USD 555', reputation: 'PMI · GOLD STANDARD PM', featured: false },
      ]
    },

    // ═══ 🧪 CALIDAD & TESTING ═══════════════════════════════════
    { id: 'testing', name: 'Calidad & Testing', icon: '🧪', color: 'hsl(282,60%,50%)',
      summary: 'QA, test automation, ISTQB. La especialidad que protege el código en producción.',
      why: 'QA Engineers buenos son escasos. Test Automation Engineers ganan tan bien como devs.',
      demand: 'Media-Alta · estable y creciente',
      roles: ['QA Engineer', 'Test Automation Engineer', 'SDET', 'QA Lead'],
      duration: '3-6 meses para entry-level',
      next: ['devops'],
      certs: [
        { level: 'principiante', order: 1, name: 'Test Automation University', issuer: 'Applitools', icon: '🎓', color: 'hsl(282,60%,50%)', desc: 'Múltiples certs por curso. Selenium · Cypress · Playwright · API testing. La universidad #1 gratuita.', learn: ['Selenium WebDriver', 'Cypress moderno', 'Playwright cross-browser', 'API testing strategies'], relatesTo: 'Stack práctico completo de un Test Automation Engineer.', hours: 60, link: 'https://testautomationu.applitools.com/', free: true, cost: 'GRATIS', reputation: 'Applitools · ref. global', featured: true },
        { level: 'pro', order: 2, name: 'ISTQB Foundation Level (CTFL)', issuer: 'ISTQB', icon: '🌍', color: 'hsl(282,65%,40%)', desc: 'EL cert testing internacional. Reconocido globalmente para QA Engineers.', learn: ['Fundamentos de testing', 'Test design techniques', 'Test management', 'Tool support para testing'], relatesTo: 'El cert que separa testers amateurs de profesionales.', hours: 40, link: 'https://www.istqb.org/certifications/certified-tester-foundation-level', free: false, cost: 'USD 230', reputation: 'ISTQB · international standard', featured: true },
      ]
    },

    // ═══ 🇬🇧 INGLÉS PROFESIONAL ════════════════════════════════
    { id: 'english', name: 'Inglés Profesional', icon: '🇬🇧', color: 'hsl(220,70%,50%)',
      summary: 'El 70% de las ofertas tech globales requieren inglés B2+. Sin inglés, te quedas en LATAM con menos salario.',
      why: 'Triplicás tu rango salarial al pasar de español-only a inglés fluido. Es la inversión #1 de retorno fuera de tech mismo.',
      demand: 'Crítica · multiplicador salarial inmediato',
      roles: ['Cualquier rol tech remoto', 'Tech a empresas USA/EU', 'Roles de liderazgo'],
      duration: '6 meses - 2 años (depende del punto de partida)',
      next: [],
      certs: [
        { level: 'principiante', order: 1, name: 'EF SET English Test', issuer: 'EF Education First', icon: '🇬🇧', color: 'hsl(220,70%,50%)', desc: 'Test CEFR A1-C2 (50 min). Certificado verificable gratis. Equivalente referencia TOEFL.', learn: ['Tu nivel CEFR actual', 'Listening + Reading', 'Score 0-100'], relatesTo: 'Empezá midiendo tu nivel real. EF SET es la mejor opción gratis.', hours: 1, link: 'https://www.efset.org/', free: true, cost: 'GRATIS', reputation: 'EF · referencia global gratis', featured: true },
        { level: 'principiante', order: 2, name: 'EnglishScore Skills Test', issuer: 'British Council', icon: '🌍', color: 'hsl(0,75%,45%)', desc: 'Test del British Council. App móvil. Resultado CEFR + cert digital verificable gratis.', learn: ['Grammar, vocabulary, reading, listening', 'CEFR level', 'Resultado en 40 min'], relatesTo: 'Confirma tu nivel con la autoridad #1 mundial en inglés.', hours: 1, link: 'https://www.englishscore.com/', free: true, cost: 'GRATIS', reputation: 'British Council · top globally', featured: false },
        { level: 'pro', order: 3, name: 'Cambridge B2 First (FCE)', issuer: 'Cambridge English', icon: '🎓', color: 'hsl(220,70%,35%)', desc: 'Cert formal nivel B2. Reconocido por universidades y empresas globalmente.', learn: ['Reading & Use of English', 'Writing (essays, emails formales)', 'Listening', 'Speaking face-to-face'], relatesTo: 'Tu primer cert de papel realmente útil para CV internacional.', hours: 100, link: 'https://www.cambridgeenglish.org/exams-and-tests/first/', free: false, cost: 'USD 230', reputation: 'Cambridge · gold standard internacional', featured: false },
        { level: 'pro', order: 4, name: 'TOEFL iBT', issuer: 'ETS', icon: '🇺🇸', color: 'hsl(220,75%,30%)', desc: 'Cert exigida por universidades y empresas USA. Score 0-120.', learn: ['Reading, Listening, Speaking, Writing', '4 horas test', 'Aceptado en 11,000+ instituciones globalmente'], relatesTo: 'Si tu objetivo es USA (estudios o trabajo), esta es la apuesta.', hours: 50, link: 'https://www.ets.org/toefl', free: false, cost: 'USD 265', reputation: 'ETS · USA standard', featured: true },
      ]
    },
  ];

  /* Helper · obtiene metadata de una materia 10-SYS (no usado en nueva UI
   * pero conservado por si lo extendemos en el futuro). */
  const _SUBJ_BADGE = (id) => {
    const s = SUBJECTS.find(x => x.id === id);
    return s ? { icon: s.icon, name: s.name, color: s.color } : null;
  };

  // Legacy: el array CERTS plano se reemplazó por SKILL_MODULES.
  // Mantengo placeholder vacío para que código externo que importe SYS.CERTS no rompa.
  const CERT_CATEGORIES = {};
  const CERT_CATEGORY_ORDER = [];

  const _LEGACY_CERTS = [
    // ═══ 🤖 INTELIGENCIA ARTIFICIAL (énfasis carrera) ═══
    { category: 'ai', featured: true,  name: 'Elements of AI', issuer: 'Universidad de Helsinki', icon: '🎓', color: 'hsl(195,85%,50%)', desc: 'EL mejor intro a IA del mundo. ¿Qué es la IA? · ML real · ética · futuro. Certificado oficial verificable. Ya completaron +1M de personas. PUNTO DE PARTIDA OBLIGATORIO.', tags: ['IA', 'Universidad', 'TOP'], subjects: ['inv_ciencia'], link: 'https://www.elementsofai.com/', difficulty: 'Básico', time: '4-6 semanas', free: true },
    { category: 'ai', featured: true,  name: 'Machine Learning Crash Course', issuer: 'Google', icon: '🔬', color: 'hsl(220,90%,55%)', desc: 'Curso oficial de Google. 15 horas con código real en TensorFlow. Conceptos + práctica intensiva. Badge de finalización.', tags: ['ML', 'Google', 'TensorFlow'], subjects: ['inv_ciencia', 'mat_especiales'], link: 'https://developers.google.com/machine-learning/crash-course', difficulty: 'Intermedio', time: '15 horas', free: true },
    { category: 'ai', featured: true,  name: 'Hugging Face Course (NLP + Transformers)', issuer: 'Hugging Face', icon: '🤗', color: 'hsl(45,95%,55%)', desc: 'NLP de última generación · transformers · BERT · GPT · fine-tuning. Hugging Face es el GitHub de modelos AI. Cert oficial. Necesario para AI moderna.', tags: ['NLP', 'Transformers', 'TOP'], subjects: ['inv_ciencia'], link: 'https://huggingface.co/learn/nlp-course', difficulty: 'Intermedio', time: '6-8 semanas', free: true },
    { category: 'ai', name: 'Intro to Machine Learning', issuer: 'Kaggle Learn', icon: '🤖', color: 'hsl(195,85%,50%)', desc: 'Scikit-learn · árboles de decisión · random forests · validación cruzada. Cert oficial Kaggle. Tu primer modelo real.', tags: ['ML', 'Python', 'Kaggle'], subjects: ['inv_ciencia', 'mat_especiales'], link: 'https://www.kaggle.com/learn/intro-to-machine-learning', difficulty: 'Básico-Intermedio', time: '3-4 semanas', free: true },
    { category: 'ai', name: 'Intermediate Machine Learning', issuer: 'Kaggle Learn', icon: '🎯', color: 'hsl(195,75%,45%)', desc: 'Missing values · variables categóricas · pipelines · cross-validation · XGBoost · data leakage. Continuación natural.', tags: ['ML', 'XGBoost', 'Kaggle'], subjects: ['inv_ciencia'], link: 'https://www.kaggle.com/learn/intermediate-machine-learning', difficulty: 'Intermedio', time: '2-3 semanas', free: true },
    { category: 'ai', name: 'Deep Learning', issuer: 'Kaggle Learn', icon: '🧠', color: 'hsl(280,70%,55%)', desc: 'Redes neuronales · TensorFlow · Keras · entrenamiento · regularización. Cert Kaggle. El siguiente paso después de ML clásico.', tags: ['DL', 'Neural Nets', 'Kaggle'], subjects: ['inv_ciencia'], link: 'https://www.kaggle.com/learn/intro-to-deep-learning', difficulty: 'Intermedio-Avanzado', time: '3-4 semanas', free: true },
    { category: 'ai', name: 'Computer Vision', issuer: 'Kaggle Learn', icon: '👁️', color: 'hsl(160,70%,45%)', desc: 'CNNs · transfer learning · data augmentation · clasificación de imágenes. Cert Kaggle. Skill clave de AI aplicada.', tags: ['CV', 'CNN', 'Kaggle'], subjects: ['inv_ciencia'], link: 'https://www.kaggle.com/learn/computer-vision', difficulty: 'Intermedio-Avanzado', time: '2-3 semanas', free: true },
    { category: 'ai', name: 'Feature Engineering', issuer: 'Kaggle Learn', icon: '⚙️', color: 'hsl(35,80%,50%)', desc: 'Crear features que los modelos puedan aprender. Mutual information · target encoding · clustering. Donde se gana o pierde el modelo.', tags: ['ML', 'Features', 'Kaggle'], subjects: ['inv_ciencia'], link: 'https://www.kaggle.com/learn/feature-engineering', difficulty: 'Intermedio', time: '1-2 semanas', free: true },

    // ═══ 📊 CIENCIA DE DATOS (énfasis carrera) ═══
    { category: 'data_science', featured: true, name: 'Pandas (Data Analysis)', issuer: 'Kaggle Learn', icon: '🐼', color: 'hsl(120,40%,40%)', desc: 'DataFrames · groupby · merge · missing data. La librería #1 para manipular datos en Python. Imprescindible para todo data scientist.', tags: ['Pandas', 'Python', 'TOP'], subjects: ['inv_ciencia'], link: 'https://www.kaggle.com/learn/pandas', difficulty: 'Básico', time: '1-2 semanas', free: true },
    { category: 'data_science', name: 'Data Visualization', issuer: 'Kaggle Learn', icon: '📈', color: 'hsl(43,80%,50%)', desc: 'Seaborn · matplotlib · gráficos estadísticos · storytelling. Saber mostrar resultados es 50% del trabajo de un DS.', tags: ['Viz', 'Seaborn', 'Kaggle'], subjects: ['inv_ciencia'], link: 'https://www.kaggle.com/learn/data-visualization', difficulty: 'Básico', time: '1 semana', free: true },
    { category: 'data_science', featured: true, name: 'IBM Data Science Foundations', issuer: 'IBM SkillsBuild', icon: '💎', color: 'hsl(210,85%,40%)', desc: 'Path completo IBM con badges acreditables. Big data · análisis · ML básico. Reconocido por reclutadores. Incluye proyectos reales.', tags: ['IBM', 'Badges', 'TOP'], subjects: ['inv_ciencia'], link: 'https://skillsbuild.org/students/course-catalog/data-science', difficulty: 'Básico-Intermedio', time: '8-12 semanas', free: true },
    { category: 'data_science', name: 'Databricks Lakehouse Fundamentals', issuer: 'Databricks Academy', icon: '🏞️', color: 'hsl(0,75%,50%)', desc: 'Lakehouse · Delta Lake · Spark. Databricks es la plataforma #1 de Data + AI a escala. Cert oficial gratis. Skill diferenciador.', tags: ['BigData', 'Spark', 'Oficial'], subjects: ['inv_ciencia'], link: 'https://customer-academy.databricks.com/learn/course/1325/databricks-lakehouse-platform-accreditation', difficulty: 'Básico-Intermedio', time: '2-3 horas', free: true },
    { category: 'data_science', name: 'Time Series Forecasting', issuer: 'Kaggle Learn', icon: '⏱️', color: 'hsl(15,75%,50%)', desc: 'Forecasting · tendencias · estacionalidad · features cíclicos. Cert Kaggle. Aplica a finanzas, ventas, IoT.', tags: ['Forecasting', 'Python', 'Kaggle'], subjects: ['inv_ciencia', 'mat_especiales'], link: 'https://www.kaggle.com/learn/time-series', difficulty: 'Intermedio', time: '1-2 semanas', free: true },

    // ═══ 💻 PROGRAMACIÓN · FUNDAMENTOS ═══
    { category: 'programming', featured: true, name: 'CS50x · Introduction to Computer Science', issuer: 'HarvardX (edX)', icon: '🏛️', color: 'hsl(0,60%,40%)', desc: 'El curso más famoso del mundo. C · Python · SQL · JavaScript · algoritmos · estructuras. Cert oficial Harvard verificable. Cambia carreras. INVERSIÓN DEL AÑO.', tags: ['Harvard', 'Universidad', 'TOP'], subjects: ['ing_web', 'inv_ciencia'], link: 'https://cs50.harvard.edu/x/', difficulty: 'Básico-Intermedio', time: '10-12 semanas', free: true },
    { category: 'programming', featured: true, name: 'PCAP · Python Programming Essentials', issuer: 'Cisco NetAcad', icon: '🐍', color: 'hsl(220,80%,55%)', desc: 'Curso oficial Python completo de Cisco (PCAP). Sintaxis · estructuras · OOP · modules · exceptions. Badge oficial. Base de toda IA / DS.', tags: ['Python', 'Cisco', 'TOP'], subjects: ['inv_ciencia', 'mat_especiales'], link: 'https://www.netacad.com/courses/python-essentials-1', difficulty: 'Básico', time: '6-8 semanas', free: true },
    { category: 'programming', name: 'Python (Basic + Intermediate)', issuer: 'HackerRank', icon: '✅', color: 'hsl(120,60%,40%)', desc: 'Tests cronometrados con certificado verificable. Útil para LinkedIn y portfolio. 2 niveles: Basic + Intermediate.', tags: ['Python', 'HackerRank', 'Oficial'], subjects: ['inv_ciencia'], link: 'https://www.hackerrank.com/skills-directory/python', difficulty: 'Básico-Intermedio', time: '2 semanas', free: true },
    { category: 'programming', name: 'Intro to Programming (Python)', issuer: 'Kaggle Learn', icon: '🧠', color: 'hsl(263,70%,55%)', desc: 'Python desde cero · variables · loops · funciones. Cert Kaggle. Si no programaste antes, empezá acá.', tags: ['Python', 'Beginner', 'Kaggle'], subjects: ['mat_especiales'], link: 'https://www.kaggle.com/learn/intro-to-programming', difficulty: 'Principiante', time: '1 semana', free: true },
    { category: 'programming', name: 'Problem Solving (Basic + Intermediate)', issuer: 'HackerRank', icon: '🧩', color: 'hsl(45,75%,50%)', desc: 'Estructuras de datos · algoritmos · complejidad. Cert HackerRank. Esencial para entrevistas técnicas (Big Tech, FAANG).', tags: ['Algoritmos', 'Entrevistas', 'Oficial'], subjects: ['inv_ciencia'], link: 'https://www.hackerrank.com/skills-directory/problem_solving', difficulty: 'Básico-Intermedio', time: '3-4 semanas', free: true },

    // ═══ 🌐 DESARROLLO WEB ═══
    { category: 'web', featured: true, name: 'Responsive Web Design', issuer: 'freeCodeCamp', icon: '🎨', color: 'hsl(335,80%,55%)', desc: 'HTML5 · CSS3 · Flexbox · Grid · accesibilidad. 300h con cert verificable. Núcleo del frontend. fCC reconocido globalmente.', tags: ['HTML', 'CSS', 'TOP'], subjects: ['ing_web'], link: 'https://www.freecodecamp.org/learn/2022/responsive-web-design/', difficulty: 'Básico', time: '4-6 semanas', free: true },
    { category: 'web', name: 'JavaScript Essentials 1', issuer: 'Cisco NetAcad', icon: '🟨', color: 'hsl(45,90%,50%)', desc: 'Fundamentos JS oficial Cisco. Sintaxis · DOM · eventos · async. Badge digital. Refuerza directamente DIS34.', tags: ['JS', 'Cisco', 'Badge'], subjects: ['ing_web'], link: 'https://www.netacad.com/courses/javascript-essentials-1', difficulty: 'Básico', time: '4 semanas', free: true },
    { category: 'web', name: 'JS Algorithms & Data Structures', issuer: 'freeCodeCamp', icon: '🧮', color: 'hsl(35,90%,50%)', desc: 'ES6 · OOP · algoritmos · programación funcional · regex. 300h con cert. Sale del basic y entra al pro.', tags: ['JS', 'Algoritmos', 'fCC'], subjects: ['ing_web'], link: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/', difficulty: 'Intermedio', time: '8-10 semanas', free: true },
    { category: 'web', name: 'API Fundamentals · Student Expert', issuer: 'Postman Academy', icon: '📮', color: 'hsl(15,85%,55%)', desc: 'APIs REST · requests · environments · tests · colecciones. Insignia oficial Postman. APIs son el lenguaje de la web moderna.', tags: ['API', 'REST', 'Oficial'], subjects: ['ing_web'], link: 'https://academy.postman.com/path/postman-api-fundamentals-student-expert', difficulty: 'Básico', time: '2-3 semanas', free: true },
    { category: 'web', name: 'Front End Development Libraries', issuer: 'freeCodeCamp', icon: '⚛️', color: 'hsl(195,85%,55%)', desc: 'React · Redux · Bootstrap · Sass · jQuery. 300h con cert. React es el framework #1 en el mercado laboral.', tags: ['React', 'Redux', 'fCC'], subjects: ['ing_web'], link: 'https://www.freecodecamp.org/learn/front-end-development-libraries/', difficulty: 'Intermedio', time: '8-10 semanas', free: true },

    // ═══ 🗄️ BASES DE DATOS ═══
    { category: 'databases', featured: true, name: 'SQL (Basic + Intermediate + Advanced)', issuer: 'HackerRank', icon: '🗄️', color: 'hsl(210,75%,50%)', desc: '3 niveles · cada uno con cert verificable. SELECT · JOIN · window functions · CTEs · optimización. SQL es el lenguaje universal de datos.', tags: ['SQL', 'BD', 'TOP'], subjects: ['admin_bd'], link: 'https://www.hackerrank.com/skills-directory/sql', difficulty: 'Básico-Avanzado', time: '3-4 semanas', free: true },
    { category: 'databases', name: 'MongoDB Basics (M001)', issuer: 'MongoDB University', icon: '🍃', color: 'hsl(142,60%,40%)', desc: 'CRUD · queries · agregaciones · indexes. Cert oficial MongoDB. La NoSQL #1 en el mercado.', tags: ['NoSQL', 'BD', 'Oficial'], subjects: ['admin_bd'], link: 'https://learn.mongodb.com/courses/m001-mongodb-basics', difficulty: 'Básico', time: '2-3 semanas', free: true },
    { category: 'databases', name: 'MongoDB M121 · Aggregation Framework', issuer: 'MongoDB University', icon: '🔀', color: 'hsl(142,55%,35%)', desc: 'Pipelines · agregaciones complejas · transformaciones. Cert oficial. El skill que separa juniors de seniors en NoSQL.', tags: ['NoSQL', 'Avanzado', 'Oficial'], subjects: ['admin_bd'], link: 'https://learn.mongodb.com/courses/m121-the-mongodb-aggregation-framework', difficulty: 'Intermedio-Avanzado', time: '3-4 semanas', free: true },

    // ═══ 🔌 REDES Y SISTEMAS ═══
    { category: 'networks', featured: true, name: 'Networking Essentials', issuer: 'Cisco NetAcad', icon: '🌐', color: 'hsl(195,80%,45%)', desc: 'TCP/IP · OSI · routing · switching · WiFi. Base para CCNA (cert paga). Cisco es el estándar de redes globalmente.', tags: ['Redes', 'Cisco', 'TOP'], subjects: ['redes_inalambricas'], link: 'https://www.netacad.com/courses/networking-essentials', difficulty: 'Básico-Intermedio', time: '6-8 semanas', free: true },
    { category: 'networks', featured: true, name: 'Linux Essentials', issuer: 'Cisco NetAcad', icon: '🐧', color: 'hsl(45,85%,45%)', desc: 'Línea de comandos · permisos · scripting · networking en Linux. Cert oficial Cisco. Linux corre el 80% de servidores del mundo.', tags: ['Linux', 'Cisco', 'TOP'], subjects: ['redes_inalambricas'], link: 'https://www.netacad.com/courses/linux-essentials', difficulty: 'Básico', time: '4-6 semanas', free: true },
    { category: 'networks', name: 'Introduction to Linux (LFS101)', issuer: 'Linux Foundation (edX)', icon: '🏛️', color: 'hsl(30,75%,50%)', desc: 'Curso oficial Linux Foundation · audit gratis · cert verificable. El estándar reconocido por la industria.', tags: ['Linux', 'edX', 'Universidad'], subjects: ['redes_inalambricas'], link: 'https://www.edx.org/course/introduction-to-linux', difficulty: 'Básico-Intermedio', time: '4-6 semanas', free: true },

    // ═══ 🔒 CIBERSEGURIDAD ═══
    { category: 'security', featured: true, name: 'Introduction to Cybersecurity', issuer: 'Cisco NetAcad', icon: '🔒', color: 'hsl(0,70%,50%)', desc: 'Amenazas · ataques · vulnerabilidades · defensa · ética. Badge Cisco oficial. Primera capa de pensar en seguro.', tags: ['Seguridad', 'Cisco', 'TOP'], subjects: ['redes_inalambricas', 'calidad_sw'], link: 'https://www.netacad.com/courses/introduction-to-cybersecurity', difficulty: 'Básico', time: '6 semanas', free: true },
    { category: 'security', name: 'Cybersecurity Essentials', issuer: 'Cisco NetAcad', icon: '🛡️', color: 'hsl(0,75%,40%)', desc: 'Siguiente paso después de Intro. Criptografía · controles de acceso · respuesta a incidentes. Path hacia CCNA Security.', tags: ['Seguridad', 'Cisco', 'Badge'], subjects: ['redes_inalambricas'], link: 'https://www.netacad.com/courses/cybersecurity-essentials', difficulty: 'Intermedio', time: '6-8 semanas', free: true },
    { category: 'security', name: 'Pre-Security Path', issuer: 'TryHackMe', icon: '🎯', color: 'hsl(15,80%,50%)', desc: 'Aprende hackeando en labs reales · networking · Linux · web · scripting. Badges desbloqueables. Práctico vs teórico.', tags: ['Hacking', 'Labs', 'Práctico'], subjects: ['redes_inalambricas'], link: 'https://tryhackme.com/path/outline/presecurity', difficulty: 'Básico', time: '4-6 semanas', free: true },

    // ═══ ☁️ CLOUD COMPUTING ═══
    { category: 'cloud', featured: true, name: 'OCI Foundations Associate', issuer: 'Oracle MyLearn', icon: '☁️', color: 'hsl(15,80%,50%)', desc: 'Oracle Cloud Foundations. Examen oficial GRATUITO real (sin trucos). Cert reconocido. Una de las pocas certs cloud verdaderamente gratis.', tags: ['Cloud', 'Oracle', 'TOP'], subjects: ['admin_bd', 'redes_inalambricas'], link: 'https://mylearn.oracle.com/ou/learning-path/become-an-oci-foundations-associate-2024/138393', difficulty: 'Básico-Intermedio', time: '4-6 semanas', free: true },
    { category: 'cloud', featured: true, name: 'AWS Cloud Quest · Cloud Practitioner', issuer: 'AWS Skill Builder', icon: '🎮', color: 'hsl(35,90%,55%)', desc: 'Aprende AWS jugando en un mundo 3D. Badge oficial digital. AWS es el cloud #1 del mundo. Path divertido y efectivo.', tags: ['AWS', 'Cloud', 'TOP'], subjects: ['redes_inalambricas'], link: 'https://aws.amazon.com/training/digital/aws-cloud-quest/', difficulty: 'Básico', time: '15-20 horas', free: true },
    { category: 'cloud', name: 'Microsoft Azure Fundamentals (AZ-900) Path', issuer: 'Microsoft Learn', icon: '🔷', color: 'hsl(210,80%,50%)', desc: 'Training oficial para AZ-900 (cert es paga). Conceptos cloud · servicios Azure · pricing. Badges desbloqueables al avanzar.', tags: ['Azure', 'Microsoft', 'Path'], subjects: ['redes_inalambricas'], link: 'https://learn.microsoft.com/training/paths/azure-fundamentals/', difficulty: 'Básico', time: '8-12 horas', free: true },
    { category: 'cloud', name: 'Google Cloud Digital Leader Path', issuer: 'Google Cloud Skills Boost', icon: '🟦', color: 'hsl(220,85%,55%)', desc: 'Conceptos GCP · cloud transformation. Badges por completar módulos. Google es el cloud con más crecimiento en LATAM.', tags: ['GCP', 'Google', 'Path'], subjects: [], link: 'https://www.cloudskillsboost.google/paths/9', difficulty: 'Básico', time: '6-8 horas', free: true },

    // ═══ 🔧 DEVOPS · CI/CD ═══
    { category: 'devops', featured: true, name: 'GitHub Foundations', issuer: 'Microsoft Learn', icon: '🐙', color: 'hsl(263,50%,50%)', desc: 'Git · GitHub Actions · Codespaces · PRs · security. Path oficial con badges + cert disponible. Git es el lenguaje universal del software.', tags: ['Git', 'DevOps', 'TOP'], subjects: ['ing_web', 'calidad_sw'], link: 'https://learn.microsoft.com/training/paths/github-foundations/', difficulty: 'Básico', time: '2-4 semanas', free: true },
    { category: 'devops', name: 'Introduction to DevOps (LFS161)', issuer: 'Linux Foundation (edX)', icon: '⚙️', color: 'hsl(280,55%,55%)', desc: 'Curso oficial Linux Foundation. CI/CD · cultura DevOps · automation · monitoring. Audit gratis, cert verificable.', tags: ['DevOps', 'edX', 'Universidad'], subjects: ['calidad_sw'], link: 'https://www.edx.org/course/introduction-to-devops-practices-and-tools', difficulty: 'Básico-Intermedio', time: '4-6 semanas', free: true },
    { category: 'devops', name: 'Docker · Get Started', issuer: 'Docker Inc.', icon: '🐳', color: 'hsl(200,75%,50%)', desc: 'Containers · imágenes · Dockerfile · networks · volumes. Training oficial Docker. Containers son la unidad básica del cloud moderno.', tags: ['Docker', 'Containers', 'Oficial'], subjects: ['ing_web'], link: 'https://docs.docker.com/get-started/', difficulty: 'Básico', time: '1-2 semanas', free: true },

    // ═══ ✅ CALIDAD Y METODOLOGÍA ═══
    { category: 'quality', featured: true, name: 'Scrum Foundation (SFPC)', issuer: 'CertiProf', icon: '🔄', color: 'hsl(172,60%,45%)', desc: 'Scrum framework · roles · eventos · artefactos. Cert profesional reconocido en LATAM. Vouchers gratis periódicos en redes oficiales.', tags: ['Agile', 'Scrum', 'TOP'], subjects: ['calidad_sw', 'inv_ciencia'], link: 'https://certiprof.com/pages/scrum-foundation-professional-certificate-sfpc-en', difficulty: 'Básico', time: '1-2 semanas', free: true },
    { category: 'quality', name: 'Test Automation University', issuer: 'Applitools', icon: '🧪', color: 'hsl(282,60%,50%)', desc: 'Múltiples certs por curso. Selenium · Cypress · Playwright · API testing. La universidad #1 de QA automatizado gratuita.', tags: ['Testing', 'QA', 'Oficial'], subjects: ['calidad_sw'], link: 'https://testautomationu.applitools.com/', difficulty: 'Básico-Avanzado', time: '4-12 semanas', free: true },
    { category: 'quality', name: 'Atlassian University · Jira Fundamentals', issuer: 'Atlassian', icon: '📋', color: 'hsl(220,85%,50%)', desc: 'Gestión ágil con Jira · workflows · sprints · reportes. Badge oficial Atlassian. Jira es la herramienta #1 en empresas tech.', tags: ['Jira', 'Agile', 'Oficial'], subjects: ['calidad_sw'], link: 'https://university.atlassian.com/student/path/1077727-jira-fundamentals', difficulty: 'Básico', time: '4-6 horas', free: true },

    // ═══ 🇬🇧 INGLÉS PROFESIONAL ═══
    { category: 'english', featured: true, name: 'EF SET English Test', issuer: 'EF Education First', icon: '🇬🇧', color: 'hsl(220,70%,50%)', desc: 'Test CEFR A1-C2 (50 min) · certificado verificable gratis. Equivalente referencia TOEFL/IELTS. EF es global y reconocido.', tags: ['CEFR', 'Test', 'TOP'], subjects: ['english_beginner', 'placement_test'], link: 'https://www.efset.org/', difficulty: 'Variable', time: '50 min', free: true },
    { category: 'english', name: 'EnglishScore Skills Test', issuer: 'British Council', icon: '🌍', color: 'hsl(0,75%,45%)', desc: 'Test del British Council. Resultado CEFR + cert digital verificable gratis. App móvil. La autoridad #1 mundial en inglés.', tags: ['British Council', 'CEFR', 'Oficial'], subjects: ['english_beginner', 'placement_test'], link: 'https://www.englishscore.com/', difficulty: 'Variable', time: '40 min', free: true },
  ];
  const CERTS = _LEGACY_CERTS; // alias

  // ── QUICK ACCESS LINKS ──
  const QUICK_ACCESS = [
    { title: 'CUN Digital', desc: 'LMS principal: aulas virtuales, foros, entregas', icon: '🎓', color: 'hsl(263,70%,55%)', url: 'https://cdigital.cun.edu.co/my/' },
    { title: 'CUN 360', desc: 'Carnet, horarios, tickets CAMI, pagos', icon: '📱', color: 'hsl(82,100%,37%)', url: 'https://360.cunapp.pro/#/estudiante/dashboard' },
    { title: 'SGA Campus (SINU)', desc: 'Notas oficiales · matrícula · historial', icon: '🏛️', color: 'hsl(200,80%,50%)', url: 'https://sigwt.cun.edu.co/sgacampus/#home' },
    { title: 'Gmail CUN', desc: 'Correo institucional', icon: '📧', color: 'hsl(0,70%,55%)', url: 'https://mail.google.com/mail/u/3/?ogbl#inbox' },
    { title: 'Calendario 2026', desc: 'PDF oficial de calendarios virtuales', icon: '📅', color: 'hsl(172,60%,45%)', url: 'https://repo.cunapp.dev/web/2025/calendarios/calendarios_virtuales_2026_.pdf' },
    { title: 'Plan de Estudios', desc: 'Malla curricular oficial PDF', icon: '📋', color: 'hsl(45,90%,50%)', url: 'https://repo.cunapp.dev/web/2024/planestudios/ingenieria_sistemas_virtual.pdf' },
  ];

  // ── CUN ECOSYSTEM MAP ──
  const CUN_ECOSYSTEM = [
    { title: 'CUN 360', desc: 'App central: carnet digital, horarios, tickets CAMI, pagos y chatbot 24/7', icon: '📱', color: 'hsl(82,100%,37%)', url: 'https://360.cunapp.pro/#/estudiante/dashboard' },
    { title: 'CUN Digital (Moodle)', desc: 'LMS principal · materiales, foros, entregas, calificaciones', icon: '🎓', color: 'hsl(263,70%,55%)', url: 'https://cdigital.cun.edu.co/my/' },
    { title: 'SGA Campus (SINU)', desc: 'Matrícula, notas oficiales, historial académico, certificados', icon: '🏛️', color: 'hsl(200,80%,50%)', url: 'https://sigwt.cun.edu.co/sgacampus/#home' },
    { title: 'Gmail CUN', desc: 'Correo institucional · comunicación con profesores y admin', icon: '📧', color: 'hsl(0,70%,55%)', url: 'https://mail.google.com/mail/u/3/?ogbl#inbox' },
    { title: 'Inducción Virtual', desc: 'Onboarding, guías, kit de bienvenida, tutoriales de plataformas', icon: '🚀', color: 'hsl(172,60%,45%)', url: 'https://cun.edu.co/induccion-virtual/' },
    { title: 'Calendario 2026 (PDF)', desc: 'Documento oficial con fechas de los 6 períodos académicos', icon: '📅', color: 'hsl(320,60%,50%)', url: 'https://repo.cunapp.dev/web/2025/calendarios/calendarios_virtuales_2026_.pdf' },
    { title: 'Plan de Estudios (PDF)', desc: 'Malla curricular oficial · Ing. de Sistemas Virtual', icon: '📋', color: 'hsl(15,70%,50%)', url: 'https://repo.cunapp.dev/web/2024/planestudios/ingenieria_sistemas_virtual.pdf' },
    { title: 'CUN App (Google Play)', desc: 'Descarga la app móvil CUN 360 para Android', icon: '🤖', color: 'hsl(120,50%,40%)', url: 'https://play.google.com/store/apps/details?id=co.edu.cun.cun360' },
  ];

  // ── METHODOLOGY STEPS ──
  const METHOD_STEPS = [
    { step: 1, title: 'Revisa CUN Digital', desc: 'Entra al aula virtual de cada materia. Revisa materiales nuevos, foros y actividades del bloque actual.', icon: '📖', action: 'Diario o cada 2 días' },
    { step: 2, title: 'Coordina con profesores', desc: 'No hay horario fijo. Tú y tu profesor acuerdan encuentros sincrónicos por chat o correo.', icon: '🤝', action: 'Inicio de cada bloque' },
    { step: 3, title: 'Registra deadlines aquí', desc: 'Cada tarea que veas en CUN Digital, agrégala al semáforo con fecha límite. El sistema la prioriza.', icon: '🚦', action: 'Cada vez que revises CUN Digital' },
    { step: 4, title: 'Trabaja por prioridad', desc: 'Resuelve P0 (rojo) primero, luego P1 (naranja). Los P2 son tu flujo normal de trabajo.', icon: '⚡', action: 'Diario' },
    { step: 5, title: 'Entrega en CUN Digital', desc: 'Sube tus trabajos en el LMS. Marca la tarea como completada aquí para trackear tu avance.', icon: '✅', action: 'Antes del deadline' },
    { step: 6, title: 'Revisa notas en SGA', desc: 'Las calificaciones oficiales aparecen en SGA Campus / SINU. Verifica que coincidan con lo entregado.', icon: '📊', action: 'Después de cierre de notas' },
  ];

  // ── WEEKLY WORKFLOW ──
  const WEEKLY_WORKFLOW = [
    { day: 'Lunes', tasks: ['Revisar CUN Digital — materiales nuevos de todas las materias', 'Actualizar semáforo con tareas descubiertas', 'Planificar la semana'] },
    { day: 'Martes-Miércoles', tasks: ['Trabajar en tareas P0 y P1', 'Estudiar contenido teórico (Mat. Especiales, Inv. Ciencia)', 'Coordinar encuentros sincrónicos'] },
    { day: 'Jueves-Viernes', tasks: ['Completar talleres y laboratorios (Ing. Web)', 'Participar en foros de discusión', 'Avanzar en proyectos y entregas'] },
    { day: 'Sábado', tasks: ['Entregar pendientes antes de deadlines dominicales', 'Revisar recursos de certificaciones', 'Respaldo de datos (exportar JSON)'] },
    { day: 'Domingo', tasks: ['Revisión semanal — ¿qué completé? ¿qué falta?', 'Limpiar tareas completadas', 'Preparar prioridades de la siguiente semana'] },
  ];

  const STUDY_RESOURCES = [
    { title: 'SQLBolt', desc: 'Tutorial interactivo de SQL (Admin BD)', icon: '⚡', color: 'hsl(45,90%,50%)', url: 'https://sqlbolt.com/' },
    { title: 'Cisco NetAcad', desc: 'Cursos de redes y networking', icon: '🌐', color: 'hsl(200,80%,50%)', url: 'https://www.netacad.com/' },
    { title: 'FreeCodeCamp QA', desc: 'Quality Assurance y testing', icon: '✅', color: 'hsl(142,60%,45%)', url: 'https://www.freecodecamp.org/learn/quality-assurance/' },
    { title: 'MDN Web Docs', desc: 'Referencia completa de Ingeniería Web', icon: '📚', color: 'hsl(35,90%,55%)', url: 'https://developer.mozilla.org/en-US/docs/Learn' },
    { title: 'Khan Academy', desc: 'Matemáticas Especiales y cálculo', icon: '💡', color: 'hsl(263,70%,55%)', url: 'https://www.khanacademy.org/math' },
    { title: 'Google Scholar', desc: 'Búsqueda de artículos para Investigación', icon: '🔬', color: 'hsl(320,60%,50%)', url: 'https://scholar.google.com/' },
  ];

  // ── HELPER FUNCTIONS ──
  function daysBetween(a, b) {
    return Math.ceil((new Date(b) - new Date(a)) / 86400000);
  }

  function formatDate(d) {
    const dt = new Date(d + 'T00:00:00');
    const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${dt.getDate()} ${months[dt.getMonth()]}`;
  }

  function formatDateFull(d) {
    const dt = new Date(d + 'T00:00:00');
    const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    return `${dt.getDate()} de ${months[dt.getMonth()]} de ${dt.getFullYear()}`;
  }

  function todayStr() {
    return new Date().toISOString().split('T')[0];
  }

  function detectPeriod() {
    const today = todayStr();
    // Student is enrolled in 26V02 — prioritize it when active or within 7 days
    const enrolled = '26V02';
    const enrolledCal = CALENDAR[enrolled];
    if (enrolledCal?.academic) {
      const daysToStart = daysBetween(today, enrolledCal.academic.start);
      if (today >= enrolledCal.academic.start && today <= enrolledCal.academic.end) return enrolled;
      if (daysToStart > 0 && daysToStart <= 7) return enrolled;
    }
    // Fallback: find any active period
    for (const [id, cal] of Object.entries(CALENDAR)) {
      if (cal.academic && today >= cal.academic.start && today <= cal.academic.end) return id;
    }
    return enrolled;
  }

  function esc(s) {
    const el = document.createElement('div');
    el.textContent = s || '';
    return el.innerHTML;
  }

  // ── TASK MANAGEMENT ──
  function getTasks() { return db.get('tasks', []); }
  function saveTasks(t) {
    db.set('tasks', t);
    if (window.CLOUD) t.forEach(task => CLOUD.push('sys_tasks', { ...task, id: String(task.id), updated_at: new Date().toISOString() }));
  }

  function addTask() {
    const text = document.getElementById('newTaskText')?.value?.trim();
    if (!text) return;
    const subj = document.getElementById('newTaskSubj')?.value || 'general';
    const priority = document.getElementById('newTaskPriority')?.value || 'p2';
    const due = document.getElementById('newTaskDue')?.value || '';
    const tasks = getTasks();
    tasks.push({ id: Date.now(), text, subj, priority, due, done: false, created: todayStr() });
    saveTasks(tasks);
    document.getElementById('newTaskText').value = '';
    render();
  }

  function toggleTask(id) {
    const tasks = getTasks();
    const t = tasks.find(x => x.id === id);
    if (t) t.done = !t.done;
    saveTasks(tasks);
    render();
  }

  function deleteTask(id) {
    if (window.CLOUD) CLOUD.remove('sys_tasks', String(id));
    saveTasks(getTasks().filter(x => x.id !== id));
    render();
  }

  function getTaskPriority(task) {
    if (task.done) return 'done';
    if (!task.due) return task.priority || 'p2';
    const days = daysBetween(todayStr(), task.due);
    if (days < 0) return 'p0';
    if (days <= 2) return 'p0';
    if (days <= 7) return 'p1';
    return task.priority || 'p2';
  }

  // ── RENDER: SEMAPHORE ──
  function renderSemaphore() {
    const el = document.getElementById('semaphoreList');
    if (!el) return;
    const tasks = getTasks().filter(t => !t.done);
    const priorities = { p0: [], p1: [], p2: [], p3: [], p4: [] };

    tasks.forEach(t => {
      const p = getTaskPriority(t);
      if (priorities[p]) priorities[p].push(t);
    });

    const labels = {
      p0: { icon: '🔴', label: 'CRÍTICO — Menos de 48 horas', cls: 'sem-p0' },
      p1: { icon: '🟠', label: 'URGENTE — Esta semana', cls: 'sem-p1' },
      p2: { icon: '🟡', label: 'EN CAMINO — On track', cls: 'sem-p2' },
      p3: { icon: '🟢', label: 'FUTURO — Próximamente', cls: 'sem-p3' },
      p4: { icon: '🟣', label: 'OPCIONAL — Sin presión', cls: 'sem-p4' },
    };

    let html = '';
    for (const [p, info] of Object.entries(labels)) {
      const items = priorities[p] || [];
      html += `<div class="gc" style="margin-bottom:8px;${items.length === 0 ? 'opacity:.5' : ''}">
        <div class="gc-h">
          <div class="gc-t"><span class="sem ${info.cls}">${info.icon} ${p.toUpperCase()}</span> ${info.label}</div>
          <span style="font-family:'IBM Plex Mono',monospace;font-size:12px;color:var(--t3)">${items.length} tarea${items.length !== 1 ? 's' : ''}</span>
        </div>`;
      if (items.length > 0) {
        html += items.map(t => {
          const subjData = SUBJECTS.find(s => s.id === t.subj);
          const subjLabel = subjData ? subjData.icon + ' ' + subjData.name : '📌 General';
          const dueLabel = t.due ? formatDate(t.due) : '';
          const daysLeft = t.due ? daysBetween(todayStr(), t.due) : null;
          const daysText = daysLeft !== null ? (daysLeft < 0 ? `<span style="color:var(--rd)">Vencido hace ${Math.abs(daysLeft)}d</span>` : daysLeft === 0 ? '<span style="color:var(--rd)">HOY</span>' : `${daysLeft}d restantes`) : '';
          return `<div class="atask">
            <div class="atask-check" onclick="SYS.toggleTask(${t.id})"></div>
            <span class="atask-text">${esc(t.text)}</span>
            <span style="font-size:10px;color:var(--t3);cursor:pointer" onclick="SYS.showTaskGuide('${t.subj}')">${subjLabel}</span>
            ${dueLabel ? `<span class="atask-due">${dueLabel} · ${daysText}</span>` : ''}
            ${subjData ? `<button style="background:none;border:none;color:var(--vi2);cursor:pointer;font-size:11px;padding:2px 4px;opacity:.7;transition:opacity .2s" onclick="SYS.showTaskGuide('${t.subj}')" title="Ver guía de la materia">📖</button>` : ''}
            <button class="atask-del" onclick="SYS.deleteTask(${t.id})">✕</button>
          </div>`;
        }).join('');
      } else {
        html += `<div style="padding:8px;text-align:center;font-size:11px;color:var(--t3)">Sin tareas en esta categoría</div>`;
      }
      html += '</div>';
    }

    // Completed tasks
    const done = getTasks().filter(t => t.done);
    if (done.length > 0) {
      html += `<div class="gc" style="opacity:.6;margin-bottom:8px">
        <div class="gc-h"><div class="gc-t">✅ Completadas (${done.length})</div></div>
        ${done.slice(0, 10).map(t => `<div class="atask">
          <div class="atask-check done" onclick="SYS.toggleTask(${t.id})">✓</div>
          <span class="atask-text crossed">${esc(t.text)}</span>
          <button class="atask-del" onclick="SYS.deleteTask(${t.id})">✕</button>
        </div>`).join('')}
      </div>`;
    }

    el.innerHTML = html || '<div style="text-align:center;padding:20px;color:var(--t3);font-size:12px">Sin tareas registradas. Agrega tu primera tarea arriba.</div>';
  }

  // ── RENDER: SUBJECT DETAIL (Tab 1) — Embeds tasks semáforo + notebook per subject ──
  function renderSubjectDetail() {
    const el = document.getElementById('subjectDetail');
    if (!el) return;
    const tasks = getTasks();
    const priorityMeta = {
      p0: { icon: '🔴', label: 'CRÍTICO', cls: 'sem-p0' },
      p1: { icon: '🟠', label: 'URGENTE', cls: 'sem-p1' },
      p2: { icon: '🟡', label: 'ON TRACK', cls: 'sem-p2' },
      p3: { icon: '🟢', label: 'FUTURO', cls: 'sem-p3' },
      p4: { icon: '🟣', label: 'OPCIONAL', cls: 'sem-p4' },
    };

    const allSubjects = getSubjects();
    // Status counts for filter pills
    const counts = { all: allSubjects.length };
    STATUS_ORDER.forEach(st => counts[st] = 0);
    allSubjects.forEach(s => { const st = s.status || 'en_curso'; counts[st] = (counts[st] || 0) + 1; });
    const filterPills = `<div class="subj-filt">
      <button class="subj-filt-pill ${_subjFilter==='all'?'on':''}" onclick="SYS.setSubjFilter('all')">Todas (${counts.all})</button>
      ${STATUS_ORDER.map(st => counts[st] > 0 ? `<button class="subj-filt-pill ${_subjFilter===st?'on':''}" onclick="SYS.setSubjFilter('${st}')">${STATUSES[st].icon} ${STATUSES[st].label} (${counts[st]})</button>` : '').join('')}
    </div>`;
    const visible = _subjFilter === 'all' ? allSubjects : allSubjects.filter(s => (s.status || 'en_curso') === _subjFilter);
    const collState = db.get('subjects_collapsed', {});
    el.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;gap:10px;flex-wrap:wrap">
      <div style="flex:1;min-width:200px">${filterPills}</div>
      <button class="tf-btn" style="background:var(--vi);font-size:12px;flex-shrink:0" onclick="SYS.openSubjectModal(null)">+ Nueva materia</button>
    </div>
    <div class="subj-list-toolbar">
      <button class="subj-list-btn" onclick="SYS.expandAllSubjects()">▼ Expandir todas</button>
      <button class="subj-list-btn" onclick="SYS.collapseAllSubjects()">▶ Colapsar todas</button>
    </div>` + (visible.length === 0 ? `<div class="cs-empty">Sin materias en este estado.</div>` : '') + visible.map(s => {
      const subjTasks = tasks.filter(t => t.subj === s.id);
      const done = subjTasks.filter(t => t.done).length;
      const total = subjTasks.length;
      const pending = total - done;
      const pct = total > 0 ? Math.round(done / total * 100) : 0;
      const cdLink = s.cdigital_id ? `https://cdigital.cun.edu.co/course/view.php?id=${s.cdigital_id}` : null;
      const sl = s.subject_links || {};

      // Tasks grouped by priority (semáforo)
      const grouped = { p0: [], p1: [], p2: [], p3: [], p4: [], done: [] };
      subjTasks.forEach(t => {
        if (t.done) grouped.done.push(t);
        else grouped[getTaskPriority(t)]?.push(t);
      });

      let tasksHtml = '';
      ['p0','p1','p2','p3','p4'].forEach(p => {
        const items = grouped[p];
        if (!items.length) return;
        const m = priorityMeta[p];
        tasksHtml += `<div style="margin-bottom:8px"><div style="font-size:10px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px"><span class="sem ${m.cls}">${m.icon} ${p.toUpperCase()}</span> ${m.label} · ${items.length}</div>` +
          items.map(t => {
            const daysLeft = t.due ? daysBetween(todayStr(), t.due) : null;
            const daysText = daysLeft !== null ? (daysLeft < 0 ? `<span style="color:var(--rd)">Vencido ${Math.abs(daysLeft)}d</span>` : daysLeft === 0 ? '<span style="color:var(--rd)">HOY</span>' : `${daysLeft}d`) : '';
            return `<div class="atask">
              <div class="atask-check" onclick="SYS.toggleTask(${t.id})"></div>
              <span class="atask-text">${esc(t.text)}</span>
              ${t.due ? `<span class="atask-due">${formatDate(t.due)} · ${daysText}</span>` : ''}
              <button class="atask-del" onclick="SYS.deleteTask(${t.id})">✕</button>
            </div>`;
          }).join('') + `</div>`;
      });
      if (grouped.done.length) {
        tasksHtml += `<div style="margin-top:8px;opacity:.6"><div style="font-size:10px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">✅ Completadas · ${grouped.done.length}</div>` +
          grouped.done.slice(0,8).map(t => `<div class="atask">
            <div class="atask-check done" onclick="SYS.toggleTask(${t.id})">✓</div>
            <span class="atask-text crossed">${esc(t.text)}</span>
            <button class="atask-del" onclick="SYS.deleteTask(${t.id})">✕</button>
          </div>`).join('') + `</div>`;
      }
      if (!tasksHtml) tasksHtml = '<div style="font-size:11px;color:var(--t3);padding:6px 0;text-align:center">Sin tareas. Agrega la primera abajo.</div>';

      // Notebook HTML per subject (rendered by NB.renderSubjectPanel)
      const nbHtml = (window.NB && NB.renderSubjectPanel) ? NB.renderSubjectPanel(s.id) : '';

      const stCur = s.status || 'en_curso';
      const stMeta = STATUSES[stCur] || STATUSES.en_curso;
      const dimCard = ['ganada','perdida','retirada'].includes(stCur);
      const isExpanded = !!collState[s.id];
      const stMenuHtml = `<div class="subj-st-wrap">
        <button class="subj-st-bdg st-${stCur}" onclick="event.stopPropagation();SYS.toggleStatusMenu('${s.id}')">${stMeta.icon} ${stMeta.label} ▾</button>
        <div class="subj-st-menu" id="stMenu-${s.id}">
          ${STATUS_ORDER.map(st => `<button class="${st===stCur?'cur':''}" onclick="event.stopPropagation();SYS.setSubjectStatus('${s.id}','${st}')">${STATUSES[st].icon} ${STATUSES[st].label}</button>`).join('')}
        </div>
      </div>`;
      // Próxima entrega pendiente (para mostrar en el header colapsado)
      const today = todayStr();
      const nextEntry = (s.cronograma || [])
        .filter(c => !c.done && c.date && daysBetween(today, c.date) >= 0)
        .sort((a, b) => a.date.localeCompare(b.date))[0];
      const nextHint = nextEntry ? (() => {
        const d = daysBetween(today, nextEntry.date);
        const dl = d === 0 ? 'HOY' : `${d}d`;
        return `<span class="subj-card-next" title="${esc(nextEntry.title)}">⏱ ${dl} · ${formatDate(nextEntry.date)}</span>`;
      })() : '';
      return `<div class="gc subj-card${dimCard?' subj-card-dim':''}${isExpanded?' expanded':''}" id="subjCard-${s.id}" style="border-left:3px solid ${s.color}">
        <div class="subj-card-h" onclick="SYS.toggleSubjectCard('${s.id}')">
          <div class="subj-card-h-l">
            <span class="subj-card-arr">▶</span>
            <span style="font-size:18px">${s.icon}</span>
            <span class="gc-t" style="margin:0">${s.name} <span style="font-size:11px;color:var(--t3);font-weight:400">· ${s.code}</span></span>
          </div>
          <div class="subj-card-h-r" onclick="event.stopPropagation()">
            ${nextHint}
            ${total > 0 ? `<span class="sem sem-p3" style="font-size:10px" title="Progreso">${pct}% (${done}/${total})</span>` : ''}
            ${stMenuHtml}
            ${s.grade ? `<span class="sem sem-p3" style="font-size:10px" title="Nota final">📊 ${s.grade}</span>` : ''}
            ${s.credits ? `<span class="sem sem-p3" style="font-size:10px">${s.credits} créd</span>` : ''}
            <div class="subj-edit-btns">
              <button class="subj-btn-edit" onclick="SYS.openSubjectModal('${s.id}')">✏</button>
              <button class="subj-btn-del" onclick="SYS.deleteSubjectCRUD('${s.id}')">🗑</button>
            </div>
          </div>
        </div>
        <div class="subj-card-body">
        ${s.professor ? `<div style="font-size:11px;color:var(--t2);margin-bottom:2px">👨‍🏫 ${s.professor}${s.professor_email ? ` · <a href="mailto:${s.professor_email}" style="color:var(--vi2);text-decoration:none">${s.professor_email}</a>` : ''}</div>` : ''}
        ${s.schedule ? `<div style="font-size:11px;color:var(--cy);margin-bottom:8px">⏰ ${s.schedule}</div>` : ''}
        ${total > 0 ? `<div style="display:flex;align-items:center;gap:10px;margin:8px 0">
          <div class="pbar" style="flex:1"><div class="pbar-fill pbar-vi" style="width:${pct}%"></div></div>
          <span style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--vi2)">${pct}% · ${done}/${total}</span>
        </div>` : ''}

        <!-- TASKS DROPDOWN -->
        <div class="sj-drop" id="sjTasks-${s.id}">
          <div class="sj-drop-h" onclick="SYS.toggleSubjectDrop('sjTasks-${s.id}')">
            <div>🚦 Tareas <span class="sj-drop-count">(${pending} pendiente${pending!==1?'s':''} · ${done}/${total})</span></div>
            <span class="sj-drop-arr">▶</span>
          </div>
          <div class="sj-drop-body">
            ${tasksHtml}
            <div class="sj-task-add">
              <input id="sjTaskNew-${s.id}" placeholder="Nueva tarea para ${esc(s.name)}..." onkeydown="if(event.key==='Enter')SYS.addSubjectTask('${s.id}')">
              <select id="sjTaskPri-${s.id}">
                <option value="p2">🟡 P2</option>
                <option value="p1">🟠 P1</option>
                <option value="p0">🔴 P0</option>
                <option value="p3">🟢 P3</option>
                <option value="p4">🟣 P4</option>
              </select>
              <input type="date" id="sjTaskDue-${s.id}">
              <button onclick="SYS.addSubjectTask('${s.id}')">+ Agregar</button>
            </div>
          </div>
        </div>

        <!-- NOTEBOOK DROPDOWN -->
        ${nbHtml}

        <!-- CRONOGRAMA (solo si tiene entradas · expandido por defecto) -->
        ${s.cronograma && s.cronograma.length ? `<div class="sj-drop on" id="sjCrono-${s.id}" style="margin-top:8px">
          <div class="sj-drop-h" onclick="SYS.toggleSubjectDrop('sjCrono-${s.id}')">
            <div>📅 Cronograma <span class="sj-drop-count">(${s.cronograma.length} entrega${s.cronograma.length!==1?'s':''})</span></div>
            <span class="sj-drop-arr">▶</span>
          </div>
          <div class="sj-drop-body">
            ${s.cronograma.map(c => {
              const d = c.date ? daysBetween(todayStr(), c.date) : null;
              const sc2 = c.done ? 'sem-p3' : d === null ? 'sem-p4' : d < 0 ? 'sem-p0' : d <= 2 ? 'sem-p0' : d <= 7 ? 'sem-p1' : d <= 14 ? 'sem-p2' : 'sem-p3';
              const dl = c.done ? '✓ Listo' : d === null ? '' : d < 0 ? `hace ${Math.abs(d)}d` : d === 0 ? 'HOY' : `${d}d`;
              const typeIc = { tarea:'📋', parcial:'📝', quiz:'❓', proyecto:'🎯', foro:'💬', otro:'📌' }[c.type] || '📌';
              return `<div style="display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:7px;background:var(--el);margin-bottom:4px${c.done ? ';opacity:.55' : ''}">
                <div class="atask-check${c.done ? ' done' : ''}" onclick="SYS.toggleCronoEntry('${s.id}','${c.id}')" title="Marcar como ${c.done ? 'pendiente' : 'completada'}">${c.done ? '✓' : ''}</div>
                ${dl ? `<span class="sem ${sc2}" style="flex-shrink:0;min-width:52px;justify-content:center;font-size:10px">${dl}</span>` : ''}
                <span style="font-size:12px;flex:1${c.done ? ';text-decoration:line-through' : ''}">${typeIc} ${esc(c.title)}</span>
                ${c.date ? `<span style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--t3)">${formatDate(c.date)}</span>` : ''}
              </div>`;
            }).join('')}
          </div>
        </div>` : ''}

        ${(() => {
          const files = db.get('subj_files_' + s.id, []);
          if (!files.length) return '';
          return `<div class="sj-drop on" id="sjFiles-${s.id}" style="margin-top:8px">
            <div class="sj-drop-h" onclick="SYS.toggleSubjectDrop('sjFiles-${s.id}')">
              <div>📎 Adjuntos <span class="sj-drop-count">(${files.length})</span></div>
              <span class="sj-drop-arr">▶</span>
            </div>
            <div class="sj-drop-body">
              <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px">
                ${files.map(f => {
                  const isImg = /^image\//.test(f.type) || /\.(png|jpe?g|gif|webp|svg)$/i.test(f.name);
                  const delBtn = `<button class="att-thumb-del" onclick="event.stopPropagation();SYS.subjectFileDel('${s.id}','${f.id}')" title="Eliminar">✕</button>`;
                  if (isImg) {
                    return `<div class="att-thumb" onclick="SYS.openFileViewer('${s.id}','${f.id}')" title="${esc(f.name)}">
                      ${delBtn}
                      <img src="${f.data}" alt="${esc(f.name)}">
                      <div class="att-thumb-cap">${esc(f.name)}</div>
                    </div>`;
                  }
                  const ext = (f.name.split('.').pop() || '').toLowerCase();
                  const icMap = { pdf:'📄', doc:'📝', docx:'📝', xls:'📊', xlsx:'📊', ppt:'📑', pptx:'📑', zip:'🗜️', rar:'🗜️' };
                  const ic = icMap[ext] || '📎';
                  return `<div class="att-thumb" onclick="SYS.subjectFileDL('${s.id}','${f.id}')" title="${esc(f.name)}">
                    ${delBtn}
                    <div class="att-thumb-ic">${ic}</div>
                    <div class="att-thumb-cap">${esc(f.name)}</div>
                  </div>`;
                }).join('')}
              </div>
            </div>
          </div>`;
        })()}

        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">
          ${cdLink ? `<a href="${cdLink}" target="_blank" rel="noopener" style="font-size:10px;padding:4px 9px;background:${s.color}18;border:1px solid ${s.color}55;border-radius:6px;color:${s.color};text-decoration:none;font-weight:600">🎓 CDigital</a>` : ''}
          ${sl.clase ? `<a href="${sl.clase}" target="_blank" rel="noopener" style="font-size:10px;padding:4px 9px;background:var(--vg);border:1px solid rgba(124,58,237,.25);border-radius:6px;color:var(--vi2);text-decoration:none">📡 Clase</a>` : ''}
          ${sl.grabaciones ? `<a href="${sl.grabaciones}" target="_blank" rel="noopener" style="font-size:10px;padding:4px 9px;background:var(--vg);border:1px solid rgba(124,58,237,.25);border-radius:6px;color:var(--vi2);text-decoration:none">📹 Grabaciones</a>` : ''}
          ${sl.material ? `<a href="${sl.material}" target="_blank" rel="noopener" style="font-size:10px;padding:4px 9px;background:var(--vg);border:1px solid rgba(124,58,237,.25);border-radius:6px;color:var(--vi2);text-decoration:none">📂 Material</a>` : ''}
        </div>
        </div>
      </div>`;
    }).join('');

    // After DOM insertion, restore any open page editors
    if (window.NB && NB.restoreAfterRender) NB.restoreAfterRender();
  }

  function toggleSubjectDrop(id) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('on');
  }

  // ── COLLAPSIBLE SUBJECT CARDS ──
  function toggleSubjectCard(id) {
    const coll = db.get('subjects_collapsed', {});
    coll[id] = !coll[id];
    db.set('subjects_collapsed', coll);
    const el = document.getElementById('subjCard-' + id);
    if (el) el.classList.toggle('expanded');
  }

  function expandAllSubjects() {
    const coll = {};
    getSubjects().forEach(s => coll[s.id] = true);
    db.set('subjects_collapsed', coll);
    render();
  }

  function collapseAllSubjects() {
    db.set('subjects_collapsed', {});
    render();
  }

  function addSubjectTask(sid) {
    const inp = document.getElementById('sjTaskNew-' + sid);
    const pri = document.getElementById('sjTaskPri-' + sid);
    const due = document.getElementById('sjTaskDue-' + sid);
    const text = inp?.value?.trim();
    if (!text) return;
    const tasks = getTasks();
    tasks.push({ id: Date.now(), text, subj: sid, priority: pri?.value || 'p2', due: due?.value || '', done: false, created: todayStr() });
    saveTasks(tasks);
    if (inp) inp.value = '';
    render();
    // Reopen the dropdown that was just used
    setTimeout(() => {
      const drop = document.getElementById('sjTasks-' + sid);
      if (drop) drop.classList.add('on');
    }, 0);
  }

  // ── RENDER: CALENDAR TIMELINE (Tab 2) ──
  function renderCalendar() {
    const el = document.getElementById('calendarTimeline');
    if (!el) return;
    const period = detectPeriod();
    const cal = CALENDAR[period] || CALENDAR['26V01'];
    const today = todayStr();

    const events = [
      { date: cal.academic?.start, label: 'Inicio período académico', sub: cal.label },
      { date: cal.block1?.start, label: cal.block1?.label + ' — Inicio', sub: `${formatDateFull(cal.block1?.start)} → ${formatDateFull(cal.block1?.end)}` },
      { date: cal.block1?.end, label: cal.block1?.label + ' — Fin', sub: 'Cierre de actividades del primer bloque' },
      { date: cal.block2?.start, label: cal.block2?.label + ' — Inicio', sub: `${formatDateFull(cal.block2?.start)} → ${formatDateFull(cal.block2?.end)}` },
      ...(cal.gradeClose1 ? [{ date: cal.gradeClose1.start, label: cal.gradeClose1.label, sub: `${formatDateFull(cal.gradeClose1.start)} → ${formatDateFull(cal.gradeClose1.end)}` }] : []),
      ...(cal.gradeClose2 ? [{ date: cal.gradeClose2.start, label: cal.gradeClose2.label, sub: `${formatDateFull(cal.gradeClose2.start)} → ${formatDateFull(cal.gradeClose2.end)}` }] : []),
      { date: cal.block2?.end, label: cal.block2?.label + ' — Fin', sub: 'Cierre de actividades del segundo bloque' },
      ...(cal.periodClose ? [{ date: cal.periodClose.start, label: cal.periodClose.label, sub: `${formatDateFull(cal.periodClose.start)} → ${formatDateFull(cal.periodClose.end)}` }] : []),
      { date: cal.academic?.end, label: 'Fin del período académico', sub: 'Cierre total del período' },
    ].filter(e => e.date);

    el.innerHTML = `<div class="tl">
      ${events.map(e => {
        const isPast = e.date < today;
        const isNow = e.date === today || (daysBetween(e.date, today) >= -3 && daysBetween(e.date, today) <= 3);
        const dotClass = isPast ? 'done' : isNow ? 'active' : '';
        const daysAway = daysBetween(today, e.date);
        const daysLabel = daysAway < 0 ? `hace ${Math.abs(daysAway)}d` : daysAway === 0 ? 'HOY' : `en ${daysAway}d`;
        return `<div class="tl-item">
          <div class="tl-dot ${dotClass}"></div>
          <div class="tl-date">${formatDate(e.date)} · <span style="color:${daysAway <= 0 ? 'var(--gn)' : daysAway <= 7 ? 'var(--am)' : 'var(--t3)'}">${daysLabel}</span></div>
          <div class="tl-label">${e.label}</div>
          <div class="tl-sub">${e.sub}</div>
        </div>`;
      }).join('')}
    </div>`;

    // All periods summary
    const allEl = document.getElementById('allPeriods');
    if (!allEl) return;
    allEl.innerHTML = Object.entries(CALENDAR).map(([id, cal]) => {
      const isActive = id === period;
      return `<div class="gc" style="${isActive ? 'border-color:rgba(16,185,129,.3);box-shadow:0 0 16px rgba(16,185,129,.08)' : ''}">
        <div class="gc-h">
          <div class="gc-t">${isActive ? '🟢' : '⚪'} ${cal.label}</div>
          ${isActive ? '<span class="sem sem-p3">ACTIVO</span>' : ''}
        </div>
        <div style="font-size:12px;color:var(--t2)">
          ${cal.academic ? `Período académico: ${formatDateFull(cal.academic.start)} → ${formatDateFull(cal.academic.end)}` : ''}
        </div>
      </div>`;
    }).join('');
  }

  // ── RENDER: QUICK ACCESS (Tab 3) ──
  function renderQuickAccess() {
    const el = document.getElementById('quickAccess');
    if (!el) return;
    el.innerHTML = QUICK_ACCESS.map(q => `
      <a href="${q.url}" target="_blank" rel="noopener" class="qa">
        <div class="qa-icon" style="background:${q.color}18;border:1px solid ${q.color}30">${q.icon}</div>
        <div class="qa-info"><div class="qa-title">${q.title}</div><div class="qa-desc">${q.desc}</div></div>
      </a>
    `).join('');

    const el2 = document.getElementById('studyResources');
    if (!el2) return;
    el2.innerHTML = STUDY_RESOURCES.map(q => `
      <a href="${q.url}" target="_blank" rel="noopener" class="qa">
        <div class="qa-icon" style="background:${q.color}18;border:1px solid ${q.color}30">${q.icon}</div>
        <div class="qa-info"><div class="qa-title">${q.title}</div><div class="qa-desc">${q.desc}</div></div>
      </a>
    `).join('');
  }

  // ── RENDER: MALLA CURRICULAR (Tab 4) ──
  function renderMalla() {
    const el = document.getElementById('mallaGrid');
    if (!el) return;
    el.innerHTML = MALLA.map(m => {
      const isCurrent = m.sem === 8;
      const levelColors = {
        'Técnica Profesional': 'var(--cy)',
        'Tecnología en Desarrollo de Software': 'var(--am)',
        'Ingeniería de Sistemas': 'var(--em)',
      };
      const color = levelColors[m.level] || 'var(--t3)';
      return `<div class="malla-sem ${isCurrent ? 'current' : ''}">
        <div class="malla-num" style="color:${color}">Semestre ${m.sem} ${isCurrent ? '← TÚ ESTÁS AQUÍ' : ''}</div>
        <div class="malla-title" style="color:${color}">${m.level}</div>
        <ul class="malla-list">
          ${m.subjects.map(s => {
            const isCurrentSubj = isCurrent && SUBJECTS.some(sub => sub.name === s);
            return `<li style="${isCurrentSubj ? 'color:var(--tx);font-weight:600' : ''}">${isCurrentSubj ? '▶ ' : '·'} ${s}</li>`;
          }).join('')}
        </ul>
      </div>`;
    }).join('');
  }

  // ── RENDER: CERTIFICATIONS (Tab 5) ──
  /** RENDER · Skill modules como cards desplegables con learning path.
   *  Cada skill: header (icon, nombre, demanda, # certs) + body con why,
   *  roles, roadmap visual y certs ordenados por nivel.
   *  Estado expandido/colapsado persistido en sys_skills_open. */
  function renderCerts() {
    const el = document.getElementById('certList');
    if (!el) return;
    const open = db.get('skills_open', {});
    const LEVELS = {
      principiante: { label: 'Principiante', icon: '🥚', n: 1, color: '#22c55e' },
      intermedio:   { label: 'Intermedio',   icon: '🌱', n: 2, color: '#3b82f6' },
      avanzado:     { label: 'Avanzado',     icon: '🌳', n: 3, color: '#a855f7' },
      pro:          { label: 'Pro',          icon: '🏆', n: 4, color: '#fbbf24' },
    };
    const renderCert = (c) => {
      const lvl = LEVELS[c.level] || LEVELS.principiante;
      const learnList = (c.learn || []).map(l => `<li>${esc(l)}</li>`).join('');
      const starBadge = c.featured
        ? `<span style="display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;background:linear-gradient(135deg,rgba(245,158,11,.2),rgba(251,191,36,.15));border:1px solid rgba(245,158,11,.4);color:#fbbf24;margin-left:6px">⭐ TOP</span>`
        : '';
      return `<div class="cert-card${c.featured?' cert-featured':''}" style="border-left:3px solid ${lvl.color}">
        <div class="cert-card-top">
          <span class="cert-level-badge" style="background:${lvl.color}25;color:${lvl.color};border:1px solid ${lvl.color}55">${lvl.icon} ${lvl.n}. ${lvl.label}</span>
          <span class="cert-icon-circle" style="background:${c.color}22;border:1px solid ${c.color}55;color:${c.color}">${c.icon}</span>
          <div class="cert-name-wrap">
            <div class="cert-name-main">${esc(c.name)}${starBadge}</div>
            <div class="cert-issuer-sub">${esc(c.issuer)} · ${c.hours}h · <span style="color:${c.free?'#22c55e':'#fbbf24'};font-weight:600">${c.cost || (c.free?'GRATIS':'De pago')}</span></div>
          </div>
        </div>
        <div class="cert-desc-line">${esc(c.desc)}</div>
        ${learnList ? `<div class="cert-learn-block">
          <div class="cert-learn-h">📚 Lo que aprenderás:</div>
          <ul class="cert-learn-list">${learnList}</ul>
        </div>` : ''}
        ${c.relatesTo ? `<div class="cert-relates">🔗 <b>Conexión:</b> ${esc(c.relatesTo)}</div>` : ''}
        ${c.reputation ? `<div class="cert-rep">📊 <b>Reputación:</b> ${esc(c.reputation)}</div>` : ''}
        <a href="${c.link}" target="_blank" rel="noopener" class="cert-link-btn" style="background:${lvl.color}">Ver certificación →</a>
      </div>`;
    };

    const renderSkillModule = (s) => {
      const isOpen = !!open[s.id];
      const featuredCount = (s.certs || []).filter(c => c.featured).length;
      const freeCount = (s.certs || []).filter(c => c.free).length;
      const proCount = (s.certs || []).filter(c => !c.free).length;
      const totalHours = (s.certs || []).reduce((sum, c) => sum + (c.hours || 0), 0);
      // Roadmap visual: pequeñas pills por nivel presente
      const levelsPresent = [...new Set((s.certs || []).map(c => c.level))];
      const roadmapHtml = ['principiante','intermedio','avanzado','pro'].map((lv, i, arr) => {
        const isPresent = levelsPresent.includes(lv);
        const meta = LEVELS[lv];
        const cls = isPresent ? '' : ' roadmap-step-empty';
        return `<span class="roadmap-step${cls}" style="${isPresent?`background:${meta.color}25;color:${meta.color};border-color:${meta.color}55`:''}">${meta.icon} ${meta.label}</span>${i < arr.length-1 ? '<span class="roadmap-arrow">→</span>' : ''}`;
      }).join('');
      // Next steps
      const nextHtml = (s.next || []).map(nid => {
        const ns = SKILL_MODULES.find(x => x.id === nid);
        return ns ? `<button class="next-skill-btn" onclick="event.stopPropagation();SYS.openSkill('${ns.id}')">${ns.icon} ${esc(ns.name)}</button>` : '';
      }).join('');
      return `<div class="skill-module${isOpen?' on':''}" id="skill-${s.id}" style="border-left:4px solid ${s.color}">
        <div class="skill-head" onclick="SYS.toggleSkill('${s.id}')">
          <span class="skill-head-icon" style="background:${s.color}22;border:1px solid ${s.color}55">${s.icon}</span>
          <div class="skill-head-info">
            <div class="skill-head-name" style="color:${s.color}">${esc(s.name)}</div>
            <div class="skill-head-summary">${esc(s.summary)}</div>
          </div>
          <div class="skill-head-meta">
            <span class="skill-meta-pill" style="background:rgba(239,68,68,.15);color:#ef4444;border:1px solid rgba(239,68,68,.3)">📈 ${esc(s.demand)}</span>
            <span class="skill-meta-pill">${s.certs.length} certs</span>
            ${featuredCount ? `<span class="skill-meta-pill" style="background:rgba(245,158,11,.15);color:#fbbf24;border:1px solid rgba(245,158,11,.4)">⭐ ${featuredCount}</span>` : ''}
          </div>
          <span class="skill-head-arrow">▶</span>
        </div>
        <div class="skill-body">
          <div class="skill-why">
            <strong style="color:${s.color}">¿Qué aporta?</strong> ${esc(s.why)}
          </div>
          <div class="skill-meta-grid">
            <div class="skill-meta-item"><b>🎯 Roles:</b> ${(s.roles || []).map(esc).join(' · ')}</div>
            <div class="skill-meta-item"><b>⏱️ Duración:</b> ${esc(s.duration)}</div>
            <div class="skill-meta-item"><b>📚 Total:</b> ~${totalHours}h · ${freeCount} gratis · ${proCount} pro</div>
          </div>
          <div class="skill-roadmap-title">🗺️ Ruta de aprendizaje:</div>
          <div class="skill-roadmap">${roadmapHtml}</div>
          <div class="skill-certs-list">
            ${(s.certs || []).slice().sort((a,b)=>a.order-b.order).map(renderCert).join('')}
          </div>
          ${nextHtml ? `<div class="skill-next">
            <strong>🎯 Después de dominar ${s.name}, sigue con:</strong>
            <div class="skill-next-list">${nextHtml}</div>
          </div>` : ''}
        </div>
      </div>`;
    };

    // Toolbar arriba con expandir / colapsar todo + filtro de demanda
    const toolbarHtml = `<div class="skills-toolbar">
      <button class="subj-list-btn" onclick="SYS.expandAllSkills()">▼ Expandir todas</button>
      <button class="subj-list-btn" onclick="SYS.collapseAllSkills()">▶ Colapsar todas</button>
      <span style="flex:1"></span>
      <span style="font-size:10px;color:var(--t3);font-family:'IBM Plex Mono',monospace">${SKILL_MODULES.length} skills · ${SKILL_MODULES.reduce((n,s)=>n+s.certs.length,0)} certs totales</span>
    </div>`;
    el.innerHTML = toolbarHtml + SKILL_MODULES.map(renderSkillModule).join('');
  }

  function toggleSkill(id) {
    const open = db.get('skills_open', {});
    open[id] = !open[id];
    db.set('skills_open', open);
    const el = document.getElementById('skill-' + id);
    if (el) el.classList.toggle('on');
  }
  function expandAllSkills() {
    const open = {};
    SKILL_MODULES.forEach(s => open[s.id] = true);
    db.set('skills_open', open);
    renderCerts();
  }
  function collapseAllSkills() {
    db.set('skills_open', {});
    renderCerts();
  }
  function openSkill(id) {
    showTab(4);
    const open = db.get('skills_open', {});
    open[id] = true;
    db.set('skills_open', open);
    renderCerts();
    setTimeout(() => {
      const el = document.getElementById('skill-' + id);
      if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }, 100);
  }

  // ── RENDER: STATS BAR ──
  function renderStats() {
    const tasks = getTasks();
    const pending = tasks.filter(t => !t.done).length;
    const done = tasks.filter(t => t.done).length;
    const total = tasks.length;
    const pct = total > 0 ? Math.round(done / total * 100) : 0;
    const period = detectPeriod();
    const cal = CALENDAR[period] || CALENDAR['26V01'];
    const daysLeft = cal.academic ? Math.max(0, daysBetween(todayStr(), cal.academic.end)) : 0;

    const setV = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    const _allSubj = getSubjects();
    const totalCredits = _allSubj.reduce((sum, s) => sum + (s.credits || 0), 0);
    setV('statMaterias', _allSubj.length);
    setV('statCredits', totalCredits);
    setV('statProgress', pct + '%');
    setV('statPending', pending);
    setV('statDaysLeft', daysLeft);
    const badge = document.getElementById('periodBadge');
    if (badge) badge.textContent = period;
  }

  // ── TAB SYSTEM ──
  function showTab(n) {
    document.querySelectorAll('.pnl').forEach((p, i) => p.classList.toggle('on', i === n));
    document.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('on', i === n));
  }

  // ── RENDER: CUN HUB (Tab 6) ──
  function renderCUNHub() {
    const ecoEl = document.getElementById('cunEcosystem');
    if (ecoEl) {
      ecoEl.innerHTML = CUN_ECOSYSTEM.map(q => `
        <a href="${q.url}" target="_blank" rel="noopener" class="qa">
          <div class="qa-icon" style="background:${q.color}18;border:1px solid ${q.color}30">${q.icon}</div>
          <div class="qa-info"><div class="qa-title">${q.title}</div><div class="qa-desc">${q.desc}</div></div>
        </a>
      `).join('');
    }

    const methEl = document.getElementById('methodSteps');
    if (methEl) {
      methEl.innerHTML = METHOD_STEPS.map(s => `
        <div style="background:var(--el);border:1px solid var(--bd);border-radius:10px;padding:14px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
            <span style="font-size:16px">${s.icon}</span>
            <span style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--vi2)">PASO ${s.step}</span>
          </div>
          <div style="font-size:13px;font-weight:600;margin-bottom:4px">${s.title}</div>
          <div style="font-size:11px;color:var(--t2);margin-bottom:6px">${s.desc}</div>
          <div style="font-size:10px;padding:3px 8px;background:var(--vg);border:1px solid rgba(124,58,237,.15);border-radius:6px;color:var(--vi2);display:inline-block">⏰ ${s.action}</div>
        </div>
      `).join('');
    }

    const wfEl = document.getElementById('weeklyWorkflow');
    if (wfEl) {
      wfEl.innerHTML = WEEKLY_WORKFLOW.map(d => `
        <div style="margin-bottom:10px">
          <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--em);font-weight:600;margin-bottom:6px">${d.day.toUpperCase()}</div>
          ${d.tasks.map(t => `<div style="font-size:12px;color:var(--t2);padding:4px 0 4px 12px;border-left:2px solid var(--bd)">· ${t}</div>`).join('')}
        </div>
      `).join('');
    }

    // Render academic history timeline
    renderHistoryTimeline();

    // Set default date for bulk import
    const bulkDate = document.getElementById('bulkDue');
    if (bulkDate && !bulkDate.value) {
      bulkDate.value = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    }
  }

  // ── BULK IMPORT ──
  function bulkImport() {
    const textarea = document.getElementById('bulkImport');
    const text = textarea?.value?.trim();
    if (!text) return;
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return;

    const subj = document.getElementById('bulkSubj')?.value || 'general';
    const priority = document.getElementById('bulkPriority')?.value || 'p2';
    const due = document.getElementById('bulkDue')?.value || '';
    const tasks = getTasks();
    let count = 0;

    lines.forEach(line => {
      tasks.push({ id: Date.now() + count, text: line, subj, priority, due, done: false, created: todayStr() });
      count++;
    });

    saveTasks(tasks);
    textarea.value = '';
    const result = document.getElementById('bulkResult');
    if (result) {
      result.textContent = `✅ ${count} tarea${count !== 1 ? 's' : ''} importada${count !== 1 ? 's' : ''} exitosamente.`;
      result.style.display = 'block';
      setTimeout(() => result.style.display = 'none', 4000);
    }
    render();
  }

  // ── EXPORT DATA ──
  function exportData() {
    const tasks = getTasks();
    const data = { version: 1, exported: new Date().toISOString(), tasks };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sys_backup_${todayStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── IMPORT DATA ──
  function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.tasks && Array.isArray(data.tasks)) {
          const existing = getTasks();
          const existingIds = new Set(existing.map(t => t.text));
          let imported = 0;
          data.tasks.forEach(t => {
            if (!existingIds.has(t.text)) {
              existing.push({ ...t, id: Date.now() + imported });
              imported++;
            }
          });
          saveTasks(existing);
          render();
          alert(`✅ Importadas ${imported} tareas nuevas (${data.tasks.length - imported} duplicadas omitidas).`);
        }
      } catch { alert('❌ Error al leer el archivo. Asegúrate de que sea un JSON válido.'); }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  // ── BULK DELETE — propaga removes a Supabase, no solo localStorage ──
  function deleteOverdueTasks() {
    const today = todayStr();
    const tasks = getTasks();
    const overdue = tasks.filter(t => !t.done && t.due && t.due < today);
    if (!overdue.length) { alert('No hay tareas vencidas pendientes.'); return; }
    if (!confirm(`¿Eliminar ${overdue.length} tarea${overdue.length > 1 ? 's' : ''} vencida${overdue.length > 1 ? 's' : ''}?\n\nLas tareas completadas no se ven afectadas.`)) return;
    // CRÍTICO: borrar también en Supabase, si no las vencidas vuelven al recargar.
    if (window.CLOUD) overdue.forEach(t => CLOUD.remove('sys_tasks', String(t.id)));
    const remaining = tasks.filter(t => !overdue.includes(t));
    saveTasks(remaining);
    render();
  }

  function clearCompleted() {
    const tasks = getTasks();
    const pending = tasks.filter(t => !t.done);
    const removed = tasks.filter(t => t.done);
    if (removed.length === 0) { alert('No hay tareas completadas para limpiar.'); return; }
    if (!confirm(`¿Eliminar ${removed.length} tarea${removed.length !== 1 ? 's' : ''} completada${removed.length !== 1 ? 's' : ''}?`)) return;
    // CRÍTICO: borrar también en Supabase para que no vuelvan al recargar.
    if (window.CLOUD) removed.forEach(t => CLOUD.remove('sys_tasks', String(t.id)));
    saveTasks(pending);
    render();
  }

  // ── MAIN RENDER ──
  // ── RENDER: ACTION NOW (What to do right now) ──
  function renderActionNow() {
    const el = document.getElementById('actionNow');
    if (!el) return;
    const tasks = getTasks().filter(t => !t.done);
    const period = detectPeriod();
    const cal = CALENDAR[period] || CALENDAR['26V02'];
    const today = new Date();
    const blockStart = new Date(cal.block1?.start || cal.academic?.start || '2026-03-30');
    const daysToStart = daysBetween(todayStr(), blockStart.toISOString().split('T')[0]);
    const isPreSemester = daysToStart > 0;

    // Find most urgent task
    const urgents = tasks.filter(t => ['p0','p1'].includes(getTaskPriority(t)));
    const nextTask = urgents.sort((a,b) => (a.due||'9999') > (b.due||'9999') ? 1 : -1)[0];

    // Count by status
    const overdue = tasks.filter(t => t.due && daysBetween(todayStr(), t.due) < 0).length;
    const thisWeek = tasks.filter(t => { const d = t.due ? daysBetween(todayStr(), t.due) : 99; return d >= 0 && d <= 7; }).length;

    // Detect current Block 1 week (8-week structure)
    const todayS = todayStr();
    const currentActivity = (BLOCK_ACTIVITIES || []).find(a => todayS >= a.start && todayS <= a.end);
    const nextActivity = (BLOCK_ACTIVITIES || []).find(a => todayS < a.start);

    let heroMsg, heroSub, heroAction;
    if (isPreSemester) {
      heroMsg = `⏳ El semestre inicia en ${daysToStart} día${daysToStart!==1?'s':''}`;
      heroSub = 'Período 26V02 · Bloque 1: 30 Mar — 24 May. Usa este tiempo para prepararte.';
      heroAction = `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">
        <a href="#" onclick="showTab(6);return false" style="font-size:11px;padding:6px 12px;background:var(--vi);color:#fff;border-radius:6px;text-decoration:none;font-weight:600">🔄 Abrir Portales CUN</a>
        <a href="#" onclick="showTab(1);return false" style="font-size:11px;padding:6px 12px;background:var(--el);color:var(--t2);border:1px solid var(--bd);border-radius:6px;text-decoration:none">📚 Ver Materias</a>
        <a href="https://cdigital.cun.edu.co/my/" target="_blank" style="font-size:11px;padding:6px 12px;background:var(--el);color:var(--t2);border:1px solid var(--bd);border-radius:6px;text-decoration:none">🎓 CUN Digital</a>
      </div>`;
    } else if (currentActivity) {
      heroMsg = `📍 Semana ${currentActivity.week}/8 · ${currentActivity.name}`;
      heroSub = `Bloque 1 · 26V02. ${currentActivity.weight ? `Peso: ${currentActivity.weight}%. ` : ''}${nextActivity ? `Siguiente (Sem ${nextActivity.week}): ${nextActivity.name}.` : 'Última actividad del bloque.'}`;
      heroAction = `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">
        <a href="#" onclick="showTab(1);return false" style="font-size:11px;padding:6px 12px;background:var(--vi);color:#fff;border-radius:6px;text-decoration:none;font-weight:600">📚 Ver Materias</a>
        <a href="https://cdigital.cun.edu.co/my/courses.php" target="_blank" style="font-size:11px;padding:6px 12px;background:var(--el);color:var(--t2);border:1px solid var(--bd);border-radius:6px;text-decoration:none">🎓 Mis Cursos CDigital</a>
        <a href="#" onclick="showTab(7);return false" style="font-size:11px;padding:6px 12px;background:var(--el);color:var(--t2);border:1px solid var(--bd);border-radius:6px;text-decoration:none">📹 Clases Perdidas</a>
      </div>`;
    } else if (overdue > 0) {
      heroMsg = `🚨 ${overdue} tarea${overdue!==1?'s':''} vencida${overdue!==1?'s':''}`;
      heroSub = nextTask ? `Más urgente: "${nextTask.text}"` : 'Revisa el semáforo abajo para ponerte al día.';
      heroAction = `<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        <div style="font-size:11px;color:var(--rd);font-weight:600;flex:1;min-width:200px">Acción: Completa o elimina las tareas vencidas para enfocarte en lo nuevo.</div>
        <button onclick="SYS.deleteOverdueTasks()" style="font-size:11px;padding:6px 14px;background:rgba(239,68,68,.15);color:var(--rd);border:1px solid rgba(239,68,68,.4);border-radius:6px;cursor:pointer;font-family:inherit;font-weight:600">⏰ Eliminar ${overdue} vencida${overdue!==1?'s':''}</button>
      </div>`;
    } else if (thisWeek > 0) {
      heroMsg = `📋 ${thisWeek} tarea${thisWeek!==1?'s':''} para esta semana`;
      heroSub = nextTask ? `Siguiente: "${nextTask.text}" — ${nextTask.due ? formatDate(nextTask.due) : 'sin fecha'}` : '';
      heroAction = '';
    } else {
      heroMsg = '✅ ¡Todo al día!';
      heroSub = 'No tienes tareas pendientes urgentes. Buen momento para adelantar material.';
      heroAction = '';
    }

    el.innerHTML = `
      <div style="font-size:18px;font-weight:700;margin-bottom:4px">${heroMsg}</div>
      <div style="font-size:12px;color:var(--t2);line-height:1.6">${heroSub}</div>
      ${heroAction}
      <div style="display:flex;gap:12px;margin-top:12px;flex-wrap:wrap">
        <div style="font-size:10px;padding:4px 10px;border-radius:6px;background:${overdue?'rgba(239,68,68,.1)':'var(--el)'};color:${overdue?'var(--rd)':'var(--t3)'};border:1px solid ${overdue?'rgba(239,68,68,.2)':'var(--bd)'}">🔴 ${overdue} vencidas</div>
        <div style="font-size:10px;padding:4px 10px;border-radius:6px;background:${thisWeek?'rgba(249,115,22,.1)':'var(--el)'};color:${thisWeek?'var(--or)':'var(--t3)'};border:1px solid ${thisWeek?'rgba(249,115,22,.2)':'var(--bd)'}">🟠 ${thisWeek} esta semana</div>
        <div style="font-size:10px;padding:4px 10px;border-radius:6px;background:var(--el);color:var(--t3);border:1px solid var(--bd)">📝 ${tasks.length} pendientes total</div>
      </div>`;
  }

  // ── RENDER: ENTREGAS PENDIENTES POR MATERIA (Tab 2) — TAREAS + CRONOGRAMA combinados ──
  function renderDeadlines() {
    const el = document.getElementById('deadlinesBySubject');
    if (!el) return;
    const today = todayStr();
    const subjects = getSubjects();
    const subjMap = Object.fromEntries(subjects.map(s => [s.id, s]));

    // 1) Tareas pendientes con fecha
    const items = getTasks().filter(t => !t.done && t.due).map(t => ({
      kind: 'task', id: t.id, subj: t.subj, text: t.text, due: t.due
    }));
    // 2) Entregas del cronograma no marcadas como done
    subjects.forEach(s => (s.cronograma || []).forEach(c => {
      if (!c.done && c.date) {
        items.push({ kind: 'crono', id: c.id, subj: s.id, text: c.title, due: c.date, type: c.type });
      }
    }));

    if (!items.length) {
      el.innerHTML = `<div class="cs-empty">Sin entregas pendientes. Agrega tareas en cada materia o crea un cronograma desde "✏ Editar".</div>`;
      return;
    }
    items.sort((a, b) => a.due.localeCompare(b.due));

    // Conteo global de vencidas
    const overdueAll = items.filter(it => it.due < today);
    const toolbarHtml = overdueAll.length ? `<div style="display:flex;justify-content:flex-end;margin-bottom:8px">
      <button class="tf-btn" onclick="SYS.deleteOverdueTasks()" style="background:var(--el);color:var(--rd);border:1px solid rgba(239,68,68,.25);font-size:11px">⏰ Eliminar ${overdueAll.length} tarea${overdueAll.length>1?'s':''} vencida${overdueAll.length>1?'s':''}</button>
    </div>` : '';

    const bySubj = {};
    items.forEach(it => {
      const s = subjMap[it.subj] || { id: it.subj, name: 'General', icon: '📌', color: 'hsl(0,0%,50%)', code: '' };
      if (!bySubj[s.id]) bySubj[s.id] = { s, items: [] };
      bySubj[s.id].items.push(it);
    });

    el.innerHTML = toolbarHtml + Object.values(bySubj).map(({ s, items }) => {
      const typeIcMap = { tarea:'📋', parcial:'📝', quiz:'❓', proyecto:'🎯', foro:'💬', otro:'📌' };
      const rows = items.map(it => {
        const d = daysBetween(today, it.due);
        const sc = d < 0 ? 'sem-p0' : d <= 2 ? 'sem-p0' : d <= 7 ? 'sem-p1' : d <= 14 ? 'sem-p2' : 'sem-p3';
        const dl = d < 0 ? `hace ${Math.abs(d)}d` : d === 0 ? 'HOY' : `${d}d`;
        const kindIc = it.kind === 'crono' ? (typeIcMap[it.type] || '📌') : '🚦';
        return `<div style="display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:7px;background:var(--el);margin-bottom:4px">
          <span class="sem ${sc}" style="flex-shrink:0;min-width:56px;justify-content:center">${dl}</span>
          <span style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--t3);flex-shrink:0">${formatDate(it.due)}</span>
          <span style="font-size:12px;flex:1">${kindIc} ${esc(it.text)}</span>
          ${it.kind === 'crono' ? '<span style="font-size:9px;color:var(--t3);text-transform:uppercase">cronograma</span>' : ''}
        </div>`;
      }).join('');
      const urgentCount = items.filter(it => { const d = daysBetween(today, it.due); return d <= 2; }).length;
      return `<div class="gc" style="margin-bottom:8px;padding:14px 16px;border-left:3px solid ${s.color}">
        <div class="gc-h" style="margin-bottom:10px">
          <div class="gc-t">
            <span>${s.icon}</span><span>${esc(s.name)}</span>
            ${s.code ? `<span style="font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--t3)">${s.code}</span>` : ''}
          </div>
          <div style="display:flex;gap:4px;align-items:center">
            ${urgentCount ? `<span class="sem sem-p0">${urgentCount} urgente${urgentCount > 1 ? 's' : ''}</span>` : ''}
            <span class="sem sem-p3">${items.length} entrega${items.length > 1 ? 's' : ''}</span>
          </div>
        </div>
        ${rows}
      </div>`;
    }).join('');
  }

  function render() {
    renderSubjTaskSelects();
    renderStats();
    renderActionNow();
    renderSemaphore();
    renderSubjectDetail();
    renderCalendar();
    renderDeadlines();
    renderQuickAccess();
    renderMalla();
    renderCerts();
    renderCUNHub();
    renderClassSessions();
  }

  // ── INIT ──
  function init() {
    // Set today's date as default for new tasks
    const dateInput = document.getElementById('newTaskDue');
    if (dateInput) {
      const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
      dateInput.value = nextWeek;
    }

    // ── Migración de seeds ──
    // v1: tareas con materias falsas (calidad_sw/admin_bd/redes)
    // v2: seeds parciales — Ing Web + extrapolaciones inventadas para Mat Esp / Inv C&T (PURGADO)
    // v3: SOLO Ing Web tiene calendario real verificado. Resto pendiente de syllabus del usuario.
    // v4: Mat Especiales (DIS31) syllabus verificado por usuario — calendario idéntico al de Ing Web (Cortés Cruz, mié/vie 6:15 PM)
    // v5: Inv C&T (DIS36) — Corte 1 parcial confirmado por usuario (Tarea 1 12-abr, Quiz 1 19-abr, Tarea 2 19-abr). Sin pesos ni Cortes 2-3.
    // v6: SEED VACÍO. Usuario migrado a cronograma por materia (Subject CRUD). Tareas se crean manualmente o desde Bulk Import.
    const SEED_VERSION = 6;
    const STALE_IDS = new Set(['calidad_sw', 'admin_bd', 'redes']);
    const currentSeedVer = db.get('seed_version', 0);
    const existing = getTasks();
    const hasStale = existing.some(t => STALE_IDS.has(t.subj));
    // Textos de seeds previas (v1, v2 — todas con datos extrapolados/inventados que hay que purgar)
    const oldSeedTexts = new Set([
      // v1
      'Quiz 1 — Ingeniería Web (10%)',
      'Quiz 1 — Matemáticas Especiales (10%)',
      'Quiz 1 — Investigación Ciencia y Tecnología (10%)',
      'Parcial 1 — Ingeniería Web (20%) → 1er Corte 30%',
      'Parcial 1 — Matemáticas Especiales (20%)',
      'Parcial 1 — Investigación C&T (20%)',
      'Quiz 2 — Ingeniería Web (10%)',
      'Parcial 2 — Ingeniería Web (20%) → 2do Corte 30%',
      'ACA · Pitch Disciplinares-NIP (34%) — preparar presentación',
      'Completar inducción Week 2 — Virtual English Beginner',
      'Presentar Placement Test BE Plus (única actividad)',
      // v2 — extrapoladas (HALLUCINADAS) para Mat Esp e Inv C&T
      'Quiz 1 — Matemáticas Especiales (10%)',
      'Parcial 1 — Matemáticas Especiales (20% → 1er Corte 30%)',
      'Quiz 2 — Matemáticas Especiales (10%)',
      'Parcial 2 — Matemáticas Especiales (20% → 2do Corte 30%)',
      'ACA · Pitch Disciplinares-NIP — Matemáticas Especiales (34%)',
      'Quiz 3 + Coevaluación + Autoevaluación — Matemáticas Especiales (6% → 3er Corte 40%)',
      'Quiz 1 — Investigación C&T (10%)',
      'Parcial 1 — Investigación C&T (20% → 1er Corte 30%)',
      'Quiz 2 — Investigación C&T (10%)',
      'Parcial 2 — Investigación C&T (20% → 2do Corte 30%)',
      'ACA · Pitch Disciplinares-NIP — Investigación C&T (34%)',
      'Quiz 3 + Coevaluación + Autoevaluación — Investigación C&T (6% → 3er Corte 40%)',
      // viejos placeholders v0
      'Revisar material Bloque 1 — Matemáticas Especiales (DIS31)',
      'Estudiar transformadas y series para primer corte',
      'Revisar estándares de calidad ISO para entrega',
      'Configurar entorno de pruebas unitarias — proyecto QA',
      'Práctica de optimización de queries SQL — Admin BD',
      'Desarrollar proyecto web con API REST — Ingeniería Web',
      'Revisar HTML/CSS/JS y frameworks para quiz',
      'Laboratorio de configuración WiFi empresarial',
      'Revisar protocolos wireless y seguridad para quiz',
      'Definir tema y estado del arte — Investigación',
      'Completar actividad de inducción — English Beginner',
      'Realizar Placement Test BE Plus',
      // v5 seeds (purgados en v6 — usuario migró a cronograma por materia)
      'Quiz 1 — Ingeniería Web (10%)',
      'Parcial 1 — Ingeniería Web (20% → 1er Corte 30%)',
      'Quiz 2 — Ingeniería Web (10%)',
      'Parcial 2 — Ingeniería Web (20% → 2do Corte 30%)',
      'ACA · Pitch Disciplinares-NIP — Ingeniería Web (34%)',
      'Quiz 3 + Coev + Auto — Ingeniería Web (6% → 3er Corte 40%)',
      'Asistir a clase Ing Web — Miércoles 6:15 PM',
      'Quiz 1 — Mat Especiales (10%)',
      'Parcial 1 — Mat Especiales (20% → 1er Corte 30%)',
      'Quiz 2 — Mat Especiales (10%)',
      'Parcial 2 — Mat Especiales (20% → 2do Corte 30%)',
      'ACA — Mat Especiales (34%)',
      'Quiz 3 + Coev + Auto — Mat Especiales (6% → 3er Corte 40%)',
      'Sesión sincrónica Mat Especiales — Mié/Vie 6:15 PM',
      'Tarea 1 — Inv C&T (Corte 1)',
      'Quiz 1 — Inv C&T (Corte 1)',
      'Tarea 2 — Inv C&T (Corte 1)',
    ]);
    if (hasStale || currentSeedVer < SEED_VERSION) {
      // Preserve user-created tasks; purge stale subjects + all old seed texts.
      // Mat Esp e Inv C&T (parcial) ahora tienen datos verificados — ya no se filtran sus textos.
      const userTasks = existing.filter(t =>
        !STALE_IDS.has(t.subj) &&
        !oldSeedTexts.has(t.text)
      );
      // CRÍTICO: borrar las purgadas también en Supabase — si no, vuelven al sync.
      const purged = existing.filter(t => !userTasks.includes(t));
      if (window.CLOUD && purged.length) purged.forEach(t => CLOUD.remove('sys_tasks', String(t.id)));
      saveTasks(userTasks);
      db.set('seed_version', SEED_VERSION);
    }

    // v6 (2026-05-27): SEED_TASKS vacío. El usuario crea tareas manualmente
    // por materia (botón "+ Agregar" en cada card) o desde Bulk Import.
    // El cronograma por materia (Subject CRUD) reemplaza el sistema de seeds.
    const SEED_TASKS = [];

    render();
  }

  // ── CUN PORTAL OPENER ──
  // Portal queue — opens one at a time to bypass popup blocker
  let _portalQueue = [];
  let _portalIdx = 0;

  function openCUNPortals() {
    _portalQueue = [
      { url: 'https://360.cunapp.pro/#/estudiante/dashboard', name: 'CUN 360' },
      { url: 'https://sigwt.cun.edu.co/sgacampus/#notr29', name: 'SGA Notas' },
      { url: 'https://cdigital.cun.edu.co/', name: 'CUN Digital' },
      { url: 'https://mail.google.com/mail/u/3/', name: 'Gmail CUN' }
    ];
    _portalIdx = 0;
    // Open first immediately (user-triggered, won't be blocked)
    window.open(_portalQueue[0].url, '_blank');
    _portalIdx = 1;
    // Show the "next portal" UI
    showNextPortalBtn();
  }

  function showNextPortalBtn() {
    let el = document.getElementById('portalProgress');
    if (!el) {
      el = document.createElement('div');
      el.id = 'portalProgress';
      el.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:999;background:var(--c1);border:2px solid var(--vi);border-radius:12px;padding:16px 20px;box-shadow:0 8px 30px rgba(0,0,0,.5);max-width:320px';
      document.body.appendChild(el);
    }
    if (_portalIdx >= _portalQueue.length) {
      el.innerHTML = '<div style="font-size:13px;font-weight:600;color:var(--gn);margin-bottom:4px">✅ Todos los portales abiertos</div><div style="font-size:11px;color:var(--t2)">Inicia sesión en cada tab. Luego pega el prompt de escaneo en Claude Code.</div><button onclick="this.parentElement.remove()" style="margin-top:8px;padding:5px 12px;border:none;border-radius:6px;background:var(--el);color:var(--t2);font-family:inherit;font-size:11px;cursor:pointer">Cerrar</button>';
      return;
    }
    const next = _portalQueue[_portalIdx];
    el.innerHTML = `<div style="font-size:11px;color:var(--t3);margin-bottom:4px">Portal ${_portalIdx}/${_portalQueue.length} abierto</div>
      <div style="font-size:13px;font-weight:600;color:var(--tx);margin-bottom:8px">Siguiente: ${next.name}</div>
      <button onclick="openNextPortal()" style="padding:8px 16px;border:none;border-radius:8px;background:var(--vi);color:#fff;font-family:inherit;font-size:12px;font-weight:600;cursor:pointer;width:100%">🚀 Abrir ${next.name}</button>`;
  }

  function openNextPortal() {
    if (_portalIdx < _portalQueue.length) {
      window.open(_portalQueue[_portalIdx].url, '_blank');
      _portalIdx++;
      showNextPortalBtn();
    }
  }

  function openSinglePortal(url) {
    window.open(url, '_blank');
  }

  // ── ACADEMIC HISTORY TIMELINE ──
  function renderHistoryTimeline() {
    const el = document.getElementById('historyTimeline');
    if (!el) return;

    const HISTORY = [
      { sem: 1, level: 'Técnica Profesional', subjects: 8, avg: 4.56, highlight: '5.0 en Cátedra Cunista I' },
      { sem: 2, level: 'Técnica Profesional', subjects: 7, avg: 4.50, highlight: 'POO I, Cálculo Diferencial' },
      { sem: 3, level: 'Técnica Profesional', subjects: 7, avg: 4.50, highlight: 'POO II, Redes 2, Física Eléctrica' },
      { sem: 4, level: 'Técnica Profesional', subjects: 8, avg: 4.50, highlight: '🎓 TÍTULO TÉCNICO PROFESIONAL', milestone: true },
      { sem: 5, level: 'Tecnología', subjects: 7, avg: 4.50, highlight: 'Prog. Web, BD Avanzadas, Álgebra Lineal' },
      { sem: 6, level: 'Tecnología', subjects: 7, avg: 4.50, highlight: 'Diseño SW, Desarrollo Web, Cálc. Multivariado' },
      { sem: 7, level: 'Tecnología', subjects: 8, avg: 4.56, highlight: '🎓 TÍTULO TECNÓLOGO EN DESARROLLO DE SOFTWARE', milestone: true },
      { sem: 8, level: 'Ingeniería', subjects: 8, avg: null, highlight: '⏳ CURSANDO — Período 26V02', current: true }
    ];

    el.innerHTML = HISTORY.map(h => {
      const barWidth = h.avg ? Math.round((h.avg / 5.0) * 100) : 0;
      const barColor = h.milestone ? 'var(--gn)' : h.current ? 'var(--am)' : 'var(--vi2)';
      const borderStyle = h.milestone ? 'border-left:3px solid var(--gn)' : h.current ? 'border-left:3px solid var(--am)' : 'border-left:3px solid var(--bd)';

      return `<div style="display:flex;gap:12px;padding:10px 14px;background:var(--el);border:1px solid var(--bd);border-radius:8px;margin-bottom:6px;${borderStyle};align-items:center">
        <div style="min-width:40px;text-align:center">
          <div style="font-family:'IBM Plex Mono',monospace;font-size:16px;font-weight:700;color:${barColor}">S${h.sem}</div>
          <div style="font-size:8px;color:var(--t3)">${h.level}</div>
        </div>
        <div style="flex:1">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
            <span style="font-size:11px;color:var(--t2)">${h.subjects} materias</span>
            <span style="font-family:'IBM Plex Mono',monospace;font-size:12px;font-weight:600;color:${h.avg?'var(--gn)':'var(--am)'}">${h.avg || '—'}</span>
          </div>
          <div style="background:var(--c1);border-radius:3px;height:4px;overflow:hidden${h.current?'':''};margin-bottom:4px">
            <div style="width:${barWidth}%;height:100%;background:${barColor};border-radius:3px;transition:width .5s"></div>
          </div>
          <div style="font-size:10px;color:${h.milestone?'var(--gn)':h.current?'var(--am)':'var(--t3)'};font-weight:${h.milestone||h.current?'600':'400'}">${h.highlight}</div>
        </div>
      </div>`;
    }).join('');
  }

  // ── SUBJECT GUIDES — Step-by-step instructions per subject ──
  const SUBJECT_GUIDES = {
    mat_especiales: {
      platform: 'CUN Digital (Moodle)',
      courseUrl: 'https://cdigital.cun.edu.co/',
      howToAccess: 'CUN Digital → Mis cursos → Matemáticas Especiales (DIS31, Grupo 52247)',
      evidenceType: 'Talleres PDF/Word + Quizzes online en la plataforma',
      submitMethod: 'Subir archivo en la actividad correspondiente dentro del aula virtual. Los quizzes se responden directamente en Moodle.',
      tips: [
        'Revisa los materiales de cada semana ANTES de intentar los talleres',
        'Los talleres normalmente se suben como PDF o Word — nombra el archivo con tu nombre y la actividad',
        'Los quizzes tienen tiempo límite — prepárate antes de abrirlos',
        'Si tienes dudas, contacta al profesor por el foro del curso o por correo CUN'
      ],
      weeklySteps: [
        { title: 'Entra al aula virtual', desc: 'Ve a CUN Digital → Mis cursos → Matemáticas Especiales. Revisa si hay materiales nuevos o actividades habilitadas.', action: 'Cada lunes' },
        { title: 'Estudia el material teórico', desc: 'Lee las guías, PDFs o videos que el profesor suba. Toma notas de transformadas de Laplace, series de Fourier y variable compleja.', action: 'Martes-Miércoles' },
        { title: 'Resuelve el taller/actividad', desc: 'Descarga el taller, resuélvelo paso a paso. Usa herramientas como Wolfram Alpha o Symbolab para verificar tus respuestas.', action: 'Jueves-Viernes' },
        { title: 'Sube tu evidencia', desc: 'En la sección de la actividad, clic en "Agregar entrega" → Sube tu archivo PDF/Word → Clic en "Guardar cambios".', action: 'Antes del deadline' },
        { title: 'Verifica la calificación', desc: 'Después del cierre, revisa en SGA Campus → notr29 si la nota fue registrada.', action: 'Después del cierre' }
      ]
    },
    ing_web: {
      platform: 'CUN Digital (Moodle)',
      courseUrl: 'https://cdigital.cun.edu.co/',
      howToAccess: 'CUN Digital → Mis cursos → Ingeniería Web (DIS34, Grupo 52211)',
      evidenceType: 'Proyectos web (HTML/CSS/JS), repositorios GitHub, documentación técnica',
      submitMethod: 'Subir ZIP del proyecto o link a repositorio GitHub en Moodle. Incluir README con instrucciones.',
      tips: [
        'Usa GitHub para versionar tu código — los profesores valoran esto',
        'Siempre incluye un README.md explicando cómo ejecutar tu proyecto',
        'Practica con MDN Web Docs y FreeCodeCamp',
        'Despliega tus proyectos en GitHub Pages para demostración en vivo'
      ],
      weeklySteps: [
        { title: 'Revisa el aula virtual', desc: 'CUN Digital → Ingeniería Web. Verifica proyectos, talleres y entregas de la semana.', action: 'Cada lunes' },
        { title: 'Estudia la tecnología', desc: 'HTML5, CSS3, JavaScript, APIs REST, frameworks (React/Angular/Vue), patrones MVC, seguridad web.', action: 'Martes-Miércoles' },
        { title: 'Desarrolla el proyecto', desc: 'Crea tu código en VS Code, prueba localmente, versiona en GitHub con commits descriptivos.', action: 'Miércoles-Viernes' },
        { title: 'Prepara la entrega', desc: 'Haz ZIP del proyecto + README.md, o proporciona el link de GitHub. Incluye capturas de funcionamiento.', action: 'Antes del deadline' },
        { title: 'Sube a Moodle', desc: 'Actividad → "Agregar entrega" → Sube ZIP o pega link GitHub → "Guardar cambios".', action: 'Antes del deadline' }
      ]
    },
    inv_ciencia: {
      platform: 'CUN Digital (Moodle)',
      courseUrl: 'https://cdigital.cun.edu.co/',
      howToAccess: 'CUN Digital → Mis cursos → Inv. Ciencia y Tecnología (DIS36, Grupo 52218)',
      evidenceType: 'Documentos de investigación: estado del arte, marco teórico, artículos con normas APA',
      submitMethod: 'Subir documentos Word/PDF en Moodle. Los avances del proyecto de investigación se suben por etapas.',
      tips: [
        'Usa Google Scholar y Scielo para buscar artículos científicos',
        'Aplica normas APA 7ª edición para todas las referencias',
        'El proyecto de investigación se construye por entregas parciales — no dejes todo para el final',
        'Usa Zotero o Mendeley para gestionar tus referencias bibliográficas'
      ],
      weeklySteps: [
        { title: 'Revisa el aula virtual', desc: 'CUN Digital → Inv. Ciencia y Tecnología. Verifica qué entrega parcial corresponde esta semana.', action: 'Cada lunes' },
        { title: 'Investiga en fuentes', desc: 'Busca artículos en Google Scholar, Scielo, IEEE. Lee y extrae ideas relevantes para tu tema.', action: 'Martes-Miércoles' },
        { title: 'Redacta tu avance', desc: 'Escribe la sección correspondiente: planteamiento, marco teórico, metodología, etc. Usa normas APA.', action: 'Jueves-Viernes' },
        { title: 'Sube tu entrega', desc: 'Actividad → "Agregar entrega" → Sube Word/PDF con normas APA → "Guardar cambios".', action: 'Antes del deadline' },
        { title: 'Participa en foros', desc: 'Si hay foros de discusión sobre temas de investigación, participa con aportes fundamentados.', action: 'Cuando estén habilitados' }
      ]
    },
    english_beginner: {
      platform: 'CUN Digital (Moodle)',
      courseUrl: 'https://cdigital.cun.edu.co/',
      howToAccess: 'CUN Digital → Mis cursos → Virtual English - Beginner 1 (A1I01, Grupo 50608)',
      evidenceType: 'Actividades interactivas, quizzes de vocabulario, grabaciones de audio, foros en inglés',
      submitMethod: 'Completar actividades directamente en Moodle. Algunas requieren grabación de audio o video.',
      tips: [
        'Practica diariamente con Duolingo o BBC Learning English además del curso',
        'Las grabaciones de audio: usa un ambiente silencioso, habla claro',
        'Lee las instrucciones EN INGLÉS — es parte del aprendizaje',
        'Participa en los foros escribiendo en inglés aunque sea básico'
      ],
      weeklySteps: [
        { title: 'Revisa el aula virtual', desc: 'CUN Digital → English Beginner 1. Verifica lecciones y actividades de la semana.', action: 'Cada lunes' },
        { title: 'Estudia el vocabulario', desc: 'Repasa las palabras y frases nuevas. Usa flashcards o apps como Anki.', action: 'Diario (15 min)' },
        { title: 'Completa las actividades', desc: 'Quizzes, ejercicios de gramática, listening activities — todo se hace dentro de Moodle.', action: 'Martes-Jueves' },
        { title: 'Graba audio/video si aplica', desc: 'Algunas actividades piden pronunciación. Graba con tu celular y sube el archivo.', action: 'Cuando se requiera' },
        { title: 'Participa en foros', desc: 'Escribe en inglés. No importa si cometes errores — la participación cuenta.', action: 'Antes del cierre del foro' }
      ]
    },
    placement_test: {
      platform: 'CUN Digital (Moodle)',
      courseUrl: 'https://cdigital.cun.edu.co/',
      howToAccess: 'CUN Digital → Mis cursos → Placement Test BE Plus (CE1026, Grupo 5TB01)',
      evidenceType: 'Test de ubicación online — se presenta una sola vez',
      submitMethod: 'El test se realiza directamente en la plataforma. No hay archivo que subir.',
      tips: [
        'Este test determina tu nivel de inglés — no lo presentes sin prepararte',
        'Tiene secciones de reading, listening, grammar y writing',
        'Una vez lo inicies, debes completarlo — no se puede pausar',
        'Tu resultado define en qué nivel de inglés te ubican'
      ],
      weeklySteps: [
        { title: 'Verifica disponibilidad', desc: 'Entra a CUN Digital → Placement Test. Revisa si el test ya está habilitado.', action: 'Inicio del período' },
        { title: 'Prepárate', desc: 'Repasa gramática básica, vocabulario general, y practica listening con BBC o podcasts.', action: '2-3 días antes' },
        { title: 'Presenta el test', desc: 'Asegúrate de tener buena conexión a internet. El test tiene tiempo límite. Lee cada pregunta cuidadosamente.', action: 'Cuando estés listo' },
        { title: 'Revisa tu resultado', desc: 'El resultado aparece automáticamente. Te ubicarán en el nivel que corresponda.', action: 'Después del test' }
      ]
    }
  };

  // ── SHOW TASK GUIDE MODAL ──
  function showTaskGuide(subjId) {
    const subj = SUBJECTS.find(s => s.id === subjId);
    if (!subj) return;
    const guide = SUBJECT_GUIDES[subjId];
    if (!guide) return;

    const tasks = getTasks();
    const subjTasks = tasks.filter(t => t.subj === subjId);
    const pending = subjTasks.filter(t => !t.done);
    const done = subjTasks.filter(t => t.done);
    const overdue = pending.filter(t => t.due && daysBetween(todayStr(), t.due) < 0);

    // Header
    const headerEl = document.getElementById('tgHeader');
    headerEl.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
        <span style="font-size:28px">${subj.icon}</span>
        <div>
          <div style="font-size:16px;font-weight:700">${subj.name}</div>
          <div style="font-size:11px;color:var(--t3)">${subj.code} · Grupo ${subj.group} · ${subj.credits} créditos · ${subj.type}${subj.professor ? ` · 👨‍🏫 ${subj.professor}` : ''}</div>
        </div>
      </div>
      <div style="font-size:12px;color:var(--t2);margin-top:4px">${subj.desc}</div>`;

    // Body
    let html = '';

    // Status badges
    html += `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px">
      <span class="tg-badge" style="background:${pending.length?'rgba(234,179,8,.1)':'rgba(34,197,94,.1)'};color:${pending.length?'var(--am)':'var(--gn)'};border:1px solid ${pending.length?'rgba(234,179,8,.2)':'rgba(34,197,94,.2)'}">📝 ${pending.length} pendientes</span>
      <span class="tg-badge" style="background:rgba(34,197,94,.1);color:var(--gn);border:1px solid rgba(34,197,94,.2)">✅ ${done.length} completadas</span>
      ${overdue.length ? `<span class="tg-badge" style="background:rgba(239,68,68,.1);color:var(--rd);border:1px solid rgba(239,68,68,.2)">🔴 ${overdue.length} vencidas</span>` : ''}
    </div>`;

    // Info box — how to access
    html += `<div class="tg-info">
      <strong>📍 ¿Dónde está?</strong> ${guide.howToAccess}<br>
      <strong>📎 Tipo de evidencia:</strong> ${guide.evidenceType}<br>
      <strong>📤 ¿Cómo se entrega?</strong> ${guide.submitMethod}
    </div>`;

    // Pending tasks with guide
    if (pending.length > 0) {
      html += `<div class="tg-section">
        <div class="tg-section-title">📋 Tareas pendientes</div>`;
      pending.forEach(t => {
        const daysLeft = t.due ? daysBetween(todayStr(), t.due) : null;
        const dueColor = daysLeft !== null ? (daysLeft < 0 ? 'var(--rd)' : daysLeft <= 2 ? 'var(--or)' : 'var(--t3)') : 'var(--t3)';
        const dueText = daysLeft !== null ? (daysLeft < 0 ? `Vencida hace ${Math.abs(daysLeft)}d` : daysLeft === 0 ? 'HOY' : `${daysLeft}d restantes`) : 'Sin fecha';
        html += `<div class="tg-task-item">
          <div class="atask-check${t.done?' done':''}" onclick="SYS.toggleTask(${t.id});SYS.showTaskGuide('${subjId}')" style="cursor:pointer">${t.done?'✓':''}</div>
          <div style="flex:1">
            <div style="font-size:12px;font-weight:500">${esc(t.text)}</div>
            <div style="font-size:10px;color:${dueColor};margin-top:2px">${t.due ? formatDate(t.due) + ' · ' : ''}${dueText}</div>
          </div>
          <button onclick="SYS.deleteTask(${t.id});SYS.showTaskGuide('${subjId}')" style="background:none;border:none;color:var(--t3);cursor:pointer;font-size:11px">✕</button>
        </div>`;
      });
      html += '</div>';
    }

    // Weekly workflow steps
    html += `<div class="tg-section">
      <div class="tg-section-title">📅 ¿Qué hacer cada semana? — Paso a paso</div>`;
    guide.weeklySteps.forEach((step, i) => {
      html += `<div class="tg-step">
        <div class="tg-step-num">${i + 1}</div>
        <div class="tg-step-content">
          <div class="tg-step-title">${step.title}</div>
          <div class="tg-step-desc">${step.desc}</div>
          <div style="margin-top:4px;font-size:9px;padding:2px 7px;background:var(--vg);border:1px solid rgba(124,58,237,.15);border-radius:4px;color:var(--vi2);display:inline-block">⏰ ${step.action}</div>
        </div>
      </div>`;
    });
    html += '</div>';

    // Tips
    html += `<div class="tg-section">
      <div class="tg-section-title">💡 Tips importantes</div>
      <div class="tg-warn">
        ${guide.tips.map(t => `<div style="padding:2px 0">• ${t}</div>`).join('')}
      </div>
    </div>`;

    // Quick links
    html += `<div style="display:flex;gap:6px;flex-wrap:wrap">
      <a href="${guide.courseUrl}" target="_blank" rel="noopener" class="tg-link">🎓 Abrir CUN Digital</a>
      ${subj.resources.map(r => `<a href="${r}" target="_blank" rel="noopener" class="tg-link" style="background:var(--el);color:var(--vi2);border:1px solid rgba(124,58,237,.15)">📎 ${new URL(r).hostname.replace('www.','')}</a>`).join('')}
    </div>`;

    document.getElementById('tgBody').innerHTML = html;
    document.getElementById('taskGuideOverlay').classList.add('vis');
    document.body.style.overflow = 'hidden';
  }

  function closeGuide() {
    document.getElementById('taskGuideOverlay').classList.remove('vis');
    document.body.style.overflow = '';
  }

  // ── CLASS SESSION STORE ──
  const CS_KEY = 'class_sessions';
  // One-time migration: fix double-prefix bug (sys_sys_class_sessions → sys_class_sessions)
  (() => { try { const old = localStorage.getItem('sys_sys_class_sessions'); if (old && !localStorage.getItem('sys_class_sessions')) { localStorage.setItem('sys_class_sessions', old); localStorage.removeItem('sys_sys_class_sessions'); } else if (old) { const merged = [...JSON.parse(old), ...JSON.parse(localStorage.getItem('sys_class_sessions') || '[]')]; const unique = merged.filter((s, i, a) => a.findIndex(x => x.id === s.id) === i); localStorage.setItem('sys_class_sessions', JSON.stringify(unique)); localStorage.removeItem('sys_sys_class_sessions'); } } catch {} })();
  function getClassSessions() { return db.get(CS_KEY, []); }
  function saveClassSessions(arr) {
    db.set(CS_KEY, arr);
    if (window.CLOUD) arr.forEach(s => CLOUD.push('class_sessions', { ...s, id: String(s.id), updated_at: new Date().toISOString() }));
  }

  function deleteClassSession(id) {
    if (window.CLOUD) CLOUD.remove('class_sessions', String(id));
    saveClassSessions(getClassSessions().filter(s => s.id !== id));
    renderClassSessions();
  }

  function updateClassStatus(id, status) {
    const arr = getClassSessions();
    const s = arr.find(x => x.id === id);
    if (s) { s.status = status; saveClassSessions(arr); renderClassSessions(); }
  }

  // Called by Claude via JS injection after analysis
  function injectClassSession(data) {
    const arr = getClassSessions();
    const existing = arr.findIndex(s => s.url === data.url);
    const session = { id: data.id || Date.now(), url: data.url || '', subject_id: data.subject_id || 'general',
      subject_name: data.subject_name || '', date: data.date || todayStr(), title: data.title || 'Clase sin título',
      summary: data.summary || '', topics: data.topics || [], assignments: data.assignments || [],
      resources: data.resources || [], status: data.status || 'pending', saved_at: new Date().toISOString() };
    if (existing >= 0) arr[existing] = session; else arr.unshift(session);
    saveClassSessions(arr);
    renderClassSessions();
    return '✅ Sesión guardada: ' + session.title;
  }

  function copyClassPrompt() {
    const url = (document.getElementById('classUrl') || {}).value || '';
    const subjEl = document.getElementById('classSubjSel');
    const subj = subjEl ? SUBJECTS.find(s => s.id === subjEl.value) : null;
    const subjName = subj ? subj.name + ' (' + subj.code + ')' : 'la materia';
    const prompt = `CEREBRO: ANALIZA CLASE\nURL: ${url || '[pega la URL aquí]'}\nMateria: ${subjName}\n\n⚠️ PRERREQUISITO DEL USUARIO:\nAntes de pegar este prompt, abre la URL en TU Chrome (la misma ventana donde corre la extensión "Claude"), asegúrate de estar logueado en Google Drive con tu correo @cun.edu.co, y activa el panel de Transcripción del reproductor de Drive (click en ⋮ → Transcripción). Con el panel visible, pega este prompt.\n\nProtocolo (Chrome MCP — SOLO transcripción, NO ver frames del video):\n1. tabs_context_mcp → identifica la pestaña ya abierta con el título "Recording - Google Drive" del video. NO navegues a una URL nueva — usa la pestaña que el usuario ya preparó.\n2. javascript_tool → extrae el transcript del panel lateral con este selector probado:\n   const sidebar = Array.from(document.querySelectorAll('[aria-label*="ranscripci"]')).find(e => e.getAttribute('role') === 'complementary');\n   const lines = sidebar.innerText.split('\\n').filter(l => l.trim() && l.trim() !== 'Copiar enlace en esta transcripción' && l.trim() !== 'Cerrar hoja lateral' && l.trim() !== 'Transcripción');\n   window.__transcript = lines.join('\\n');\n3. Pre-procesa EN LA PÁGINA (no en tu contexto): parsea a segmentos [timestamp, texto], filtra por keywords (tarea|entrega|parcial|examen|quiz|fecha|plazo|abril|mayo|cdigital|drive|http|recuerden|no olviden|para el|hasta el), y dame solo los hits relevantes + los últimos 25 segmentos (ahí están los anuncios de cierre).\n4. Con esos excerpts reales (verbatim, con timestamps), genera informe estructurado:\n   - Resumen ejecutivo (qué se vio — solo hechos verificables)\n   - Temas principales (lista de lo enseñado)\n   - Tareas detectadas (con cita verbatim del profesor + timestamp + fecha de entrega)\n   - Dónde/cómo entregar (plataforma, link, formato)\n   - Recursos mencionados (URLs, carpetas, materiales)\n5. Ejecuta SYS.injectClassSession() DIRECTAMENTE EN LA PESTAÑA REAL DEL USUARIO (https://mikel696.github.io/da-2026/frontend/systems.html), NO en localhost. Esa es la única forma de que llegue al Supabase del usuario.\n   SYS.injectClassSession({ url:'${url}', subject_id:'${subj ? subj.id : ''}', subject_name:'${subjName}', date:'YYYY-MM-DD', title:'...', summary:'...', topics:[], assignments:[{title,desc,due_date,submit_where,submit_how,evidence_type,moodle_url}], resources:[], status:'analyzed' })\n6. Verifica visualmente: showTab(7) → screenshot → confirmar que la tarjeta aparece en "Sesiones guardadas".\n\n🚨 REGLAS ANTI-HALLUCINACIÓN (obligatorias):\n- Si NO puedes conectar a Chrome MCP, NO inventes el contenido. Pide al usuario que verifique la extensión.\n- Si la transcripción está vacía o no hay panel, NO extrapoles. Reporta el problema y pide que el usuario active el panel.\n- NO uses curl/fetch contra Drive — falla con 401.\n- Solo datos verbatim del transcript. Toda tarea debe citar el timestamp + frase del profesor como evidencia.`;
    if (navigator.clipboard) navigator.clipboard.writeText(prompt).catch(() => {});
    const preview = document.getElementById('classPromptPreview');
    const textEl = document.getElementById('classPromptText');
    const copiedEl = document.getElementById('classPromptCopied');
    if (preview) preview.style.display = 'block';
    if (textEl) textEl.textContent = prompt;
    if (copiedEl) { copiedEl.style.display = 'block'; setTimeout(() => copiedEl.style.display = 'none', 3000); }
  }

  function renderClassSessions() {
    const el = document.getElementById('classSessionsList');
    const countEl = document.getElementById('classSessionCount');
    if (!el) return;
    const sessions = getClassSessions();
    if (countEl) countEl.textContent = sessions.length + ' sesión' + (sessions.length !== 1 ? 'es' : '');
    if (!sessions.length) {
      el.innerHTML = `<div class="cs-empty">📹 Aún no hay clases guardadas.<br><span style="font-size:11px">Pega el link de un video de clase arriba y copia el prompt para Claude.</span></div>`;
      return;
    }
    const statusIcon = { pending: '⏳', in_progress: '🔄', done: '✅' };
    const statusLabel = { pending: 'Pendiente', in_progress: 'En proceso', done: 'Completado' };
    const statusCls = { pending: 'cs-status-pending', in_progress: 'cs-status-inprogress', done: 'cs-status-done' };
    el.innerHTML = sessions.map(s => {
      const subj = SUBJECTS.find(x => x.id === s.subject_id);
      const clsCls = s.status === 'done' ? 'cs-done' : s.status === 'in_progress' ? 'cs-inprogress' : '';
      const assigns = (s.assignments || []).map(a => `
        <div class="cs-assign">
          <div class="cs-assign-title">📌 ${esc(a.title)}</div>
          ${a.desc ? `<div class="cs-assign-row"><span class="cs-assign-label">Descripción:</span>${esc(a.desc)}</div>` : ''}
          ${a.due_date ? `<div class="cs-assign-row"><span class="cs-assign-label">Entrega:</span><strong style="color:var(--am)">${a.due_date}</strong></div>` : ''}
          ${a.submit_where ? `<div class="cs-assign-row"><span class="cs-assign-label">Dónde:</span>${esc(a.submit_where)}</div>` : ''}
          ${a.submit_how ? `<div class="cs-assign-row"><span class="cs-assign-label">Cómo:</span>${esc(a.submit_how)}</div>` : ''}
          ${a.evidence_type ? `<div class="cs-assign-row"><span class="cs-assign-label">Evidencia:</span>${esc(a.evidence_type)}</div>` : ''}
          ${a.moodle_url ? `<div class="cs-assign-row"><span class="cs-assign-label">Link:</span><a href="${a.moodle_url}" target="_blank" style="color:var(--cy)">${esc(a.moodle_url)}</a></div>` : ''}
        </div>`).join('');
      const topics = (s.topics || []).map(t => `<span class="cs-topic">${esc(t)}</span>`).join('');
      return `
      <div class="cs-card ${clsCls}" id="cs-${s.id}">
        <div class="cs-head" onclick="SYS.toggleCS(${s.id})">
          <div class="cs-icon">${subj ? subj.icon : '📹'}</div>
          <div class="cs-info">
            <div class="cs-title">${esc(s.title)}</div>
            <div class="cs-meta">
              <span>${subj ? subj.name : s.subject_name}</span>
              <span>·</span><span>${s.date}</span>
              <span>·</span><span class="${statusCls[s.status] || 'cs-status-pending'}">${statusIcon[s.status] || '⏳'} ${statusLabel[s.status] || 'Pendiente'}</span>
              ${(s.assignments||[]).length ? `<span>· ${s.assignments.length} tarea${s.assignments.length!==1?'s':''}</span>` : ''}
            </div>
          </div>
          <div class="cs-actions" onclick="event.stopPropagation()">
            ${s.status !== 'done' ? `<button class="cs-btn cs-btn-status" onclick="SYS.updateClassStatus(${s.id},'${s.status==='pending'?'in_progress':'done'}')">${s.status==='pending'?'▶ Iniciar':'✅ Listo'}</button>` : `<button class="cs-btn cs-btn-status" onclick="SYS.updateClassStatus(${s.id},'pending')">↩ Reabrir</button>`}
            <button class="cs-btn cs-btn-del" onclick="if(confirm('¿Eliminar esta sesión?'))SYS.deleteClassSession(${s.id})">🗑</button>
          </div>
        </div>
        <div class="cs-body" id="csb-${s.id}">
          ${s.url ? `<div style="margin-bottom:10px"><a href="${esc(s.url)}" target="_blank" style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--cy);word-break:break-all">🔗 ${esc(s.url)}</a></div>` : ''}
          ${s.summary ? `<div class="cs-summary">${esc(s.summary)}</div>` : ''}
          ${topics ? `<div class="cs-topics">${topics}</div>` : ''}
          ${assigns || '<div style="font-size:11px;color:var(--t3);padding:8px 0">Sin actividades detectadas.</div>'}
          ${(s.resources||[]).length ? `<div style="margin-top:10px;font-size:10px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">Recursos recomendados</div>${s.resources.map(r=>`<a href="${esc(r)}" target="_blank" style="display:block;font-size:11px;color:var(--cy);margin-bottom:3px;word-break:break-all">📎 ${esc(r)}</a>`).join('')}` : ''}
        </div>
      </div>`;
    }).join('');
  }

  function toggleCS(id) {
    const body = document.getElementById('csb-' + id);
    if (body) body.classList.toggle('open');
  }

  // ── SUBJECT CRUD ──────────────────────────────────────────────

  const SM_COLORS = [
    'hsl(200,80%,50%)','hsl(263,70%,55%)','hsl(320,60%,50%)','hsl(45,85%,50%)',
    'hsl(15,70%,50%)','hsl(160,60%,40%)','hsl(0,65%,55%)','hsl(35,80%,50%)',
    'hsl(240,70%,60%)','hsl(190,75%,45%)','hsl(280,55%,55%)','hsl(100,55%,40%)',
  ];
  const STATUSES = {
    en_curso:  { label: 'En curso',  icon: '🟢' },
    pendiente: { label: 'Pendiente', icon: '⏳' },
    pausada:   { label: 'Pausada',   icon: '⏸' },
    ganada:    { label: 'Ganada',    icon: '🏆' },
    perdida:   { label: 'Perdida',   icon: '💔' },
    retirada:  { label: 'Retirada',  icon: '🚪' },
  };
  const STATUS_ORDER = ['en_curso','pendiente','pausada','ganada','perdida','retirada'];
  let _smEditId = null;

  function setSubjectStatus(id, status) {
    if (!STATUSES[status]) return;
    const custom = db.get('subjects_custom', []);
    const idx = custom.findIndex(s => s.id === id);
    if (idx >= 0) {
      custom[idx].status = status;
      custom[idx]._updated = new Date().toISOString();
    } else {
      custom.push({ id, status, _updated: new Date().toISOString() });
    }
    db.set('subjects_custom', custom);
    closeStatusMenu();
    render();
  }

  function toggleStatusMenu(id) {
    document.querySelectorAll('.subj-st-menu').forEach(m => {
      if (m.id !== 'stMenu-' + id) m.classList.remove('on');
    });
    const menu = document.getElementById('stMenu-' + id);
    if (menu) menu.classList.toggle('on');
  }

  function closeStatusMenu() {
    document.querySelectorAll('.subj-st-menu').forEach(m => m.classList.remove('on'));
  }

  // Close status menu on outside click
  document.addEventListener('click', e => {
    if (!e.target.closest('.subj-st-wrap')) closeStatusMenu();
  });

  // ── SUBJECT FILTER STATE ──
  let _subjFilter = 'all';
  function setSubjFilter(f) { _subjFilter = f; render(); }

  function getSubjects() {
    const custom = db.get('subjects_custom', []);
    const hidden = new Set(db.get('subjects_hidden', []));
    const overMap = Object.fromEntries(custom.map(s => [s.id, s]));
    const hardIds = new Set(SUBJECTS.map(s => s.id));
    const base = SUBJECTS.filter(s => !hidden.has(s.id)).map(s => overMap[s.id] ? { ...s, ...overMap[s.id] } : s);
    const extras = custom.filter(s => !hardIds.has(s.id) && !hidden.has(s.id));
    return [...base, ...extras];
  }

  function _saveSubj(subj) {
    const custom = db.get('subjects_custom', []);
    const idx = custom.findIndex(s => s.id === subj.id);
    if (idx >= 0) custom[idx] = subj; else custom.push(subj);
    db.set('subjects_custom', custom);
  }

  function deleteSubjectCRUD(id) {
    const s = getSubjects().find(s => s.id === id);
    if (!s) return;
    if (!confirm(`¿Ocultar la materia "${s.name}"?\n\nLas tareas asociadas se conservan. Puedes rehidratarla volviendo a crearla con el mismo ID.`)) return;
    const hidden = db.get('subjects_hidden', []);
    if (!hidden.includes(id)) hidden.push(id);
    db.set('subjects_hidden', hidden);
    db.set('subjects_custom', db.get('subjects_custom', []).filter(c => c.id !== id));
    render();
  }

  function openSubjectModal(id) {
    // Si es nueva materia, generamos ID provisional para que los uploads funcionen antes del save.
    _smEditId = id || ('subj_' + Date.now());
    const ov = document.getElementById('smOv');
    if (!ov) return;
    const cp = document.getElementById('smColorPicks');
    if (cp) cp.innerHTML = SM_COLORS.map(c => `<div class="sm-col-pick" style="background:${c}" data-c="${c}" onclick="SYS._smColor(this,'${c}')"></div>`).join('');
    const sv = (eid, v) => { const e = document.getElementById(eid); if (e) e.value = v ?? ''; };
    const s = id ? getSubjects().find(x => x.id === id) : null;
    document.getElementById('smTitle').textContent = s ? 'Editar Materia' : 'Nueva Materia';
    sv('smIcon', s?.icon || '📚');
    sv('smCode', s?.code || '');
    sv('smName', s?.name || '');
    sv('smColor', s?.color || SM_COLORS[0]);
    sv('smCredits', s?.credits ?? '');
    sv('smGroup', s?.group || '');
    sv('smType', s?.type || '');
    sv('smSchedule', s?.schedule || '');
    sv('smProfessor', s?.professor || '');
    sv('smDesc', s?.desc || '');
    sv('smCdigitalId', s?.cdigital_id || '');
    sv('smLinkClase', s?.subject_links?.clase || '');
    sv('smLinkGrab', s?.subject_links?.grabaciones || '');
    sv('smLinkMat', s?.subject_links?.material || '');
    sv('smStatus', s?.status || 'en_curso');
    sv('smGrade', s?.grade ?? '');
    document.querySelectorAll('#smColorPicks .sm-col-pick').forEach(el => el.classList.toggle('on', el.dataset.c === (s?.color || SM_COLORS[0])));
    document.getElementById('smCronoList').innerHTML = (s?.cronograma || []).map((r, i) => _crRow(r, i)).join('');
    _renderSmFiles(id);
    ov.style.display = 'flex';
  }

  function closeSubjectModal() {
    const ov = document.getElementById('smOv');
    if (ov) ov.style.display = 'none';
    _smEditId = null;
  }

  function _smColor(el, val) {
    document.getElementById('smColor').value = val;
    document.querySelectorAll('#smColorPicks .sm-col-pick').forEach(e => e.classList.remove('on'));
    el.classList.add('on');
  }

  function _crRow(r, i) {
    const rid = r.id || ('cr' + i);
    return `<div class="cr-row" id="cr-${rid}">
      <input class="sm-i" placeholder="Ej: Entrega Taller 1" value="${esc(r.title || '')}" data-crf="title" data-cri="${rid}">
      <input class="sm-i" type="date" value="${r.date || ''}" data-crf="date" data-cri="${rid}">
      <select class="sm-i" data-crf="type" data-cri="${rid}">
        <option value="tarea"${r.type==='tarea'?' selected':''}>📋 Tarea</option>
        <option value="parcial"${r.type==='parcial'?' selected':''}>📝 Parcial</option>
        <option value="quiz"${r.type==='quiz'?' selected':''}>❓ Quiz</option>
        <option value="proyecto"${r.type==='proyecto'?' selected':''}>🎯 Proyecto</option>
        <option value="foro"${r.type==='foro'?' selected':''}>💬 Foro</option>
        <option value="otro"${r.type==='otro'?' selected':''}>📌 Otro</option>
      </select>
      <button class="cr-del" onclick="SYS.removeCrono('${rid}')">✕</button>
    </div>`;
  }

  function addCrono() {
    const list = document.getElementById('smCronoList');
    if (!list) return;
    const id = 'cr' + Date.now();
    const tmp = document.createElement('div');
    tmp.innerHTML = _crRow({ id, title: '', date: '', type: 'tarea' });
    list.appendChild(tmp.firstChild);
  }

  function removeCrono(rowId) {
    const el = document.getElementById('cr-' + rowId);
    if (el) el.remove();
  }

  function _readCrono() {
    return Array.from(document.querySelectorAll('#smCronoList .cr-row')).map(row => {
      const g = f => row.querySelector(`[data-crf="${f}"]`)?.value || '';
      const id = row.querySelector('[data-cri]')?.dataset.cri || ('cr' + Date.now());
      return { id, title: g('title'), date: g('date'), type: g('type') };
    }).filter(r => r.title || r.date);
  }

  function saveSubjectModal() {
    const gv = id => document.getElementById(id)?.value?.trim() || '';
    const name = gv('smName');
    if (!name) { alert('El nombre de la materia es obligatorio.'); return; }
    const color = gv('smColor') || SM_COLORS[0];
    const cdigId = parseInt(gv('smCdigitalId')) || null;
    const sl = {};
    const lc = gv('smLinkClase'); if (lc) sl.clase = lc;
    const lg = gv('smLinkGrab');  if (lg) sl.grabaciones = lg;
    const lm = gv('smLinkMat');   if (lm) sl.material = lm;
    const id = _smEditId || ('subj_' + Date.now());
    const gradeRaw = gv('smGrade');
    const grade = gradeRaw === '' ? null : parseFloat(gradeRaw);
    const subj = {
      id, name, color,
      code:      gv('smCode'),
      icon:      gv('smIcon') || '📚',
      credits:   parseInt(gv('smCredits')) || 0,
      group:     gv('smGroup'),
      type:      gv('smType'),
      schedule:  gv('smSchedule'),
      professor: gv('smProfessor'),
      desc:      gv('smDesc'),
      cdigital_id: cdigId,
      subject_links: Object.keys(sl).length ? sl : undefined,
      cronograma: _readCrono(),
      status:    gv('smStatus') || 'en_curso',
      grade:     grade != null && !isNaN(grade) ? grade : null,
      _custom: true,
      _updated: new Date().toISOString(),
    };
    _saveSubj(subj);
    closeSubjectModal();
    render();
  }

  // ── FILE ATTACHMENTS (per subject) ──
  function _getFiles(sid) { return db.get('subj_files_' + sid, []); }
  function _setFiles(sid, arr) { db.set('subj_files_' + sid, arr); }

  function _renderSmFiles(sid) {
    const el = document.getElementById('smAttList');
    if (!el) return;
    if (!sid) { el.innerHTML = ''; return; }
    const files = _getFiles(sid);
    if (!files.length) { el.innerHTML = ''; return; }
    const icMap = { pdf:'📄', doc:'📝', docx:'📝', xls:'📊', xlsx:'📊', ppt:'📑', pptx:'📑', jpg:'🖼️', jpeg:'🖼️', png:'🖼️', gif:'🖼️', zip:'🗜️', rar:'🗜️' };
    el.innerHTML = files.map(f => {
      const ext = (f.name.split('.').pop() || '').toLowerCase();
      const isImg = /^image\//.test(f.type) || /\.(png|jpe?g|gif|webp|svg)$/i.test(f.name);
      const ic = isImg ? '🖼️' : (icMap[ext] || '📎');
      const sz = f.size > 1048576 ? (f.size / 1048576).toFixed(1) + ' MB' : Math.round(f.size / 1024) + ' KB';
      return `<div class="att-c">
        ${isImg ? `<img src="${f.data}" class="att-mini" onclick="SYS.openFileViewer('${sid}','${f.id}')" title="Click para ampliar">` : `<span class="att-ic">${ic}</span>`}
        <span class="att-nm" title="${esc(f.name)}" ${isImg ? `onclick="SYS.openFileViewer('${sid}','${f.id}')" style="cursor:zoom-in"` : ''}>${esc(f.name)}</span>
        <span class="att-sz">${sz}</span>
        <button class="att-b" onclick="SYS.subjectFileDL('${sid}','${f.id}')" title="Descargar">⬇</button>
        <button class="att-b" onclick="SYS.subjectFileDel('${sid}','${f.id}')" title="Eliminar">✕</button>
      </div>`;
    }).join('');
  }

  function subjectFileUpload(input) {
    const sid = _smEditId;
    if (!sid) return;
    const existing = _getFiles(sid);
    Array.from(input.files).forEach(f => {
      if (f.size > 2 * 1024 * 1024) { alert(`"${f.name}" supera los 2 MB. Comprime e intenta de nuevo.`); return; }
      const reader = new FileReader();
      reader.onload = e => {
        existing.push({ id: 'f' + Date.now(), name: f.name, type: f.type, size: f.size, data: e.target.result, added: new Date().toISOString() });
        _setFiles(sid, existing);
        _renderSmFiles(sid);
      };
      reader.readAsDataURL(f);
    });
    input.value = '';
  }

  function subjectFileDL(sid, fileId) {
    const f = _getFiles(sid).find(x => x.id === fileId);
    if (!f?.data) return;
    const a = document.createElement('a');
    a.href = f.data; a.download = f.name; a.click();
  }

  function subjectFileDel(sid, fileId) {
    if (!confirm('¿Eliminar este archivo?')) return;
    _setFiles(sid, _getFiles(sid).filter(f => f.id !== fileId));
    _renderSmFiles(sid);
    render();
  }

  // ── TOGGLE CRONOGRAMA ENTRY (mark as done/pending) ──
  function toggleCronoEntry(sid, entryId) {
    const allSubj = getSubjects();
    const s = allSubj.find(x => x.id === sid);
    if (!s) return;
    const crono = (s.cronograma || []).map(c =>
      c.id === entryId ? { ...c, done: !c.done } : c
    );
    // Save back: build a full subj override so the cronograma persists
    const subj = { ...s, cronograma: crono, _updated: new Date().toISOString() };
    _saveSubj(subj);
    render();
  }

  // ── IMAGE/FILE LIGHTBOX VIEWER ──
  function openFileViewer(sid, fileId) {
    const f = _getFiles(sid).find(x => x.id === fileId);
    if (!f) return;
    const isImage = /^image\//.test(f.type) || /\.(png|jpe?g|gif|webp|svg)$/i.test(f.name);
    if (!isImage) { subjectFileDL(sid, fileId); return; }
    let lb = document.getElementById('fileLightbox');
    if (!lb) {
      lb = document.createElement('div');
      lb.id = 'fileLightbox';
      lb.className = 'lb-ov';
      lb.onclick = (e) => { if (e.target === lb) closeFileViewer(); };
      document.body.appendChild(lb);
    }
    lb.innerHTML = `<button class="lb-close" onclick="SYS.closeFileViewer()" title="Cerrar (Esc)">✕</button>
      <button class="lb-dl" onclick="SYS.subjectFileDL('${sid}','${fileId}')" title="Descargar">⬇</button>
      <div class="lb-content">
        <img src="${f.data}" alt="${esc(f.name)}">
        <div class="lb-caption">${esc(f.name)} · ${f.size > 1048576 ? (f.size/1048576).toFixed(1)+' MB' : Math.round(f.size/1024)+' KB'}</div>
      </div>`;
    lb.style.display = 'flex';
  }

  function closeFileViewer() {
    const lb = document.getElementById('fileLightbox');
    if (lb) lb.style.display = 'none';
  }

  // ESC closes lightbox
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeFileViewer();
  });

  // ── SYNC TASK SELECTS ──
  function renderSubjTaskSelects() {
    const subjects = getSubjects();
    const opts = subjects.map(s => `<option value="${s.id}">${s.icon} ${esc(s.name)}</option>`).join('') +
      '<option value="general">📌 General</option>';
    ['newTaskSubj', 'bulkSubj'].forEach(eid => {
      const el = document.getElementById(eid);
      if (!el) return;
      const cur = el.value;
      el.innerHTML = opts;
      if ([...el.options].some(o => o.value === cur)) el.value = cur;
    });
  }

  // ── EXPOSE GLOBALLY
  window.showTab = showTab;
  window.openCUNPortals = openCUNPortals;
  window.openSinglePortal = openSinglePortal;
  window.openNextPortal = openNextPortal;

  // Run on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ── Cloud Sync: pull tasks + sessions on sign-in ──
  window.addEventListener('sb:signed_in', async () => {
    if (!window.CLOUD) return;
    await CLOUD.fullSync('sys_tasks', 'sys_tasks');
    await CLOUD.fullSync('class_sessions', 'sys_class_sessions');
    render();
    renderClassSessions();
  });

  return { addTask, toggleTask, deleteTask, bulkImport, exportData, importData, clearCompleted, deleteOverdueTasks, render, showTaskGuide, closeGuide, injectClassSession, deleteClassSession, updateClassStatus, copyClassPrompt, toggleCS, toggleSubjectDrop, addSubjectTask, openSubjectModal, closeSubjectModal, saveSubjectModal, deleteSubjectCRUD, addCrono, removeCrono, subjectFileUpload, subjectFileDL, subjectFileDel, _smColor, setSubjectStatus, toggleStatusMenu, setSubjFilter, toggleCronoEntry, openFileViewer, closeFileViewer, toggleSubjectCard, expandAllSubjects, collapseAllSubjects, toggleSkill, expandAllSkills, collapseAllSkills, openSkill };
})();
window.SYS = SYS;

// ═══════════════════════════════════════
// NB — Notebook Module (inline per-subject in Materias tab)
// ═══════════════════════════════════════
const NB = (function() {
  const KEY = 'sys_notebook';
  // activePage maps subjectId → pageId (which page editor is open per subject)
  const activePage = {};
  // openSubjects: subjectIds whose dropdowns were open (preserved across re-render)
  const openSubjects = new Set();
  const saveTimers = {};
  let lbCtx = null; // { subjectId, pageId, index }
  // Paste-dialog context
  const pim = { sid: null, dataUrl: null };

  function esc(s) { const d = document.createElement('div'); d.textContent = s == null ? '' : s; return d.innerHTML; }
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } }
  /** Save with quota check — surfaces clear alert when localStorage is full
   *  instead of failing silently (was causing pages/images to silently drop). */
  function save(data) {
    const json = JSON.stringify(data);
    const sizeKB = Math.round(json.length / 1024);
    try {
      localStorage.setItem(KEY, json);
    } catch (e) {
      if (e && (e.name === 'QuotaExceededError' || /quota/i.test(e.message || ''))) {
        let imgKB = 0, imgs = 0;
        Object.values(data || {}).forEach(sub => (sub.pages || []).forEach(p =>
          (p.images || []).forEach(im => {
            if (im && im.data) { imgKB += Math.floor(im.data.length * 0.75 / 1024); imgs++; }
          })
        ));
        alert('💾 Almacenamiento local lleno (≈ ' + sizeKB + ' KB usados).\n\n' +
              imgs + ' imágenes pesan ≈ ' + Math.round(imgKB/1024) + ' MB.\n\n' +
              'Soluciones:\n' +
              '• Eliminá imágenes viejas (las más pesadas primero)\n' +
              '• Las nuevas imágenes ya se comprimen automáticamente\n' +
              '• El navegador limita localStorage a ~5 MB por sitio');
        throw e;
      }
      throw e;
    }
  }
  function getSubjectData(sid) {
    const d = load();
    if (!d[sid]) d[sid] = { pages: [], links: [], images: [] };
    return d;
  }

  // ── PER-SUBJECT PANEL RENDERING ──
  // Returns HTML for the notebook dropdown inside a subject card.
  function renderSubjectPanel(sid) {
    const d = load();
    const sub = d[sid] || { pages: [] };
    const pageCount = sub.pages.length;
    const isOpen = openSubjects.has(sid);
    const activeId = activePage[sid];
    const page = activeId ? sub.pages.find(p => p.id === activeId) : null;

    const pagesListHtml = pageCount ? sub.pages.map(p => {
      const preview = (p.body || '').substring(0, 60).replace(/\n/g, ' ');
      const isActive = activeId === p.id;
      return `<div class="nb-entry${isActive ? ' open' : ''}">
        <div class="nb-entry-h" onclick="NB.openPage('${sid}',${p.id})">
          <div style="min-width:0;flex:1"><div class="nb-entry-title">${esc(p.title || 'Sin título')}</div><div style="font-size:10px;color:var(--t3);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(preview)}${preview.length >= 60 ? '…' : ''}</div></div>
          <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
            <span class="nb-entry-date">${new Date(p.updated || p.created).toLocaleDateString('es', { day: 'numeric', month: 'short' })}</span>
            <span style="font-size:10px;color:var(--t3)">${(p.links||[]).length ? '🔗'+p.links.length : ''} ${(p.images||[]).length ? '🖼'+p.images.length : ''}</span>
            <button onclick="event.stopPropagation();NB.deletePage('${sid}',${p.id})" style="background:none;border:none;color:var(--t3);cursor:pointer;font-size:11px;opacity:.5">🗑</button>
          </div>
        </div>
      </div>`;
    }).join('') : '<div style="text-align:center;padding:14px;color:var(--t3);font-size:11px">Sin páginas. Haz click en "+ Nueva página".</div>';

    const editorHtml = buildEditorHtml(sid, page);

    return `<div class="sj-drop${isOpen ? ' on' : ''}" id="sjNb-${sid}">
      <div class="sj-drop-h" onclick="NB.toggleSubject('${sid}')">
        <div>📓 Cuaderno <span class="sj-drop-count">(${pageCount} página${pageCount!==1?'s':''})</span></div>
        <span class="sj-drop-arr">▶</span>
      </div>
      <div class="sj-drop-body">
        <div class="sj-nb-toolbar">
          <button onclick="NB.newPage('${sid}')" style="background:var(--vi);color:#fff">+ Nueva página</button>
          ${page ? `<button onclick="NB.addLink('${sid}')" style="background:var(--el);color:var(--t2);border:1px solid var(--bd)">🔗 Link</button>
          <button onclick="NB.openPasteDialog('${sid}')" style="background:var(--el);color:var(--t2);border:1px solid var(--bd)">🖼️ Imagen HD</button>
          <button onclick="NB.attachFile('${sid}')" style="background:var(--el);color:var(--t2);border:1px solid var(--bd)">📎 Adjuntar</button>` : ''}
          ${(window.NBShared && NBShared.pageJumpHtml) ? NBShared.pageJumpHtml({ nbId: sid, ns:'NB', pages: sub.pages, activePageId: activeId }) : ''}
        </div>
        ${editorHtml}
        <div class="sl" style="margin-top:12px">· páginas ·</div>
        <div class="nb-entries">${pagesListHtml}</div>
      </div>
    </div>`;
  }

  // ── SHARED PAGE EDITOR HTML (used by subject + custom notebooks) ──
  function renderBodyContent(body) {
    if (!body) return '';
    // If stored content already has tags (new rich format), render as-is.
    if (/<[a-z][^>]*>/i.test(body)) return body;
    // Otherwise escape (legacy plain-text content).
    return esc(body);
  }

  function buildEditorHtml(sid, page) {
    if (!page) return '';
    const toolbarHtml = (window.NBShared && NBShared.toolbarHtml) ? NBShared.toolbarHtml(sid, 'NB') : '';
    return `${toolbarHtml}
      <div class="nb-page" style="margin-bottom:12px">
        <div class="nb-header">
          <input class="nb-title-inp" id="nbTitle-${sid}" value="${esc(page.title || '').replace(/"/g,'&quot;')}" placeholder="Título de la página..." oninput="NB.autoSave('${sid}')">
          <span class="nb-saved" id="nbSaved-${sid}">✓ guardado</span>
          <span class="nb-date">${new Date(page.created).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
        <div class="nb-spine"></div>
        <div class="nb-holes"><div class="nb-hole" style="top:24px"></div><div class="nb-hole" style="top:72px"></div><div class="nb-hole" style="top:120px"></div><div class="nb-hole" style="top:168px"></div><div class="nb-hole" style="top:216px"></div><div class="nb-hole" style="top:264px"></div><div class="nb-hole" style="top:312px"></div><div class="nb-hole" style="top:360px"></div></div>
        <div class="nb-margin"></div>
        <div class="nb-content" id="nbBody-${sid}" contenteditable="true" data-placeholder="Escribe tus apuntes aquí..." oninput="NB.autoSave('${sid}')">${renderBodyContent(page.body)}</div>
      </div>
      <div class="sl" style="margin-top:12px">· links de estudio ·</div>
      <div id="nbLinks-${sid}">${renderLinksHtml(sid, page)}</div>
      <div class="sl" style="margin-top:12px">· archivos adjuntos · <span style="font-size:9px;color:var(--t3);text-transform:none;letter-spacing:0;font-weight:400">(local — no sync)</span></div>
      <div class="nb-att-list" id="nbAtt-${sid}">${renderAttachmentsHtml(sid, page)}</div>
      <div class="sl" style="margin-top:12px">· imágenes ·</div>
      <div class="nb-images" id="nbImages-${sid}">${renderImagesHtml(sid, page)}</div>`;
  }

  function renderLinksHtml(sid, page) {
    if (!page.links || !page.links.length) return '<div style="font-size:11px;color:var(--t3);padding:4px 0">Sin links aún. Usa "🔗 Link".</div>';
    return page.links.map((l, i) =>
      `<div class="nb-link"><span class="nb-link-icon">🔗</span><div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:500">${esc(l.label)}</div><a href="${esc(l.url)}" target="_blank" rel="noopener" class="nb-link-url">${esc(l.url)}</a></div><button onclick="NB.removeLink('${sid}',${i})" style="background:none;border:none;color:var(--t3);cursor:pointer;font-size:10px">✕</button></div>`
    ).join('');
  }

  function renderImagesHtml(sid, page) {
    if (!page.images || !page.images.length) return '<div style="font-size:11px;color:var(--t3);padding:4px 0;grid-column:1/-1">Sin imágenes. Usa "🖼️ Imagen HD" para pegar/arrastrar.</div>';
    return page.images.map((im, i) => {
      const src = im.thumbnail || im.data || '';
      const orphan = im.id && !im.thumbnail && !im.data;
      return `<div class="nb-img-card">
        <button class="nb-img-del" onclick="event.stopPropagation();NB.removeImage('${sid}',${i})" title="Eliminar">✕</button>
        <button class="nb-img-rename" onclick="event.stopPropagation();NB.renameImage('${sid}',${i})" title="Renombrar">✏</button>
        ${orphan
          ? '<div style="aspect-ratio:1;background:var(--el);display:flex;align-items:center;justify-content:center;color:var(--t3);font-size:11px;text-align:center;padding:8px">📷<br>Solo en otro<br>dispositivo</div>'
          : `<img src="${src}" alt="${esc(im.caption)}" onclick="NB.viewImage('${sid}',${i})">`}
        <div class="nb-img-caption">${esc(im.caption || 'Sin nombre')}</div>
      </div>`;
    }).join('');
  }

  function renameImage(sid, idx) {
    const d = load();
    const pid = activePage[sid];
    const page = d[sid] && d[sid].pages.find(p => p.id === pid);
    if (!page || !page.images || !page.images[idx]) return;
    const cur = page.images[idx].caption || '';
    const next = prompt('Nombre / descripción de la imagen:', cur);
    if (next === null) return;
    page.images[idx].caption = next;
    page.updated = new Date().toISOString();
    save(d);
    const el = document.getElementById('nbImages-' + sid);
    if (el) el.innerHTML = renderImagesHtml(sid, page);
  }

  function renderAttachmentsHtml(sid, page) {
    if (!window.NBShared) return '<div style="font-size:11px;color:var(--t3);padding:4px 0">Cargando módulo de adjuntos…</div>';
    const atts = (page && page.attachments) || [];
    return NBShared.renderAttachmentChips(atts, { onRemove: "NB.removeAttachment.bind(null,'"+sid+"')" });
  }

  async function attachFile(sid) {
    if (!window.NBShared) return alert('Módulo de adjuntos no disponible.');
    const pid = activePage[sid];
    if (!pid) return alert('Primero crea o abre una página.');
    const meta = await NBShared.pickAttachmentViaModal('cnb_' + sid + '_' + pid);
    if (!meta) return; // user cancelled
    const d = load();
    const page = d[sid].pages.find(p => p.id === pid);
    if (!page.attachments) page.attachments = [];
    page.attachments.push(meta);
    page.updated = new Date().toISOString();
    save(d);
    const el = document.getElementById('nbAtt-' + sid);
    if (el) el.innerHTML = renderAttachmentsHtml(sid, page);
  }

  async function removeAttachment(sid, attId) {
    if (!confirm('¿Eliminar este adjunto del dispositivo?')) return;
    const d = load();
    const pid = activePage[sid];
    const page = d[sid] && d[sid].pages.find(p => p.id === pid);
    if (!page || !page.attachments) return;
    page.attachments = page.attachments.filter(a => a.id !== attId);
    page.updated = new Date().toISOString();
    save(d);
    if (window.NBShared) { try { await NBShared.deleteBlob(attId); } catch(e){} }
    const el = document.getElementById('nbAtt-' + sid);
    if (el) el.innerHTML = renderAttachmentsHtml(sid, page);
  }

  function restoreAfterRender() {
    // Adjuntar paste handler (limpia HTML pegado) + checklist toggle a TODOS
    // los editores de cuaderno renderizados en la página.
    if (window.NBShared && NBShared.attachEditorHandlers) {
      document.querySelectorAll('.nb-content[contenteditable="true"]').forEach(el => {
        NBShared.attachEditorHandlers(el);
      });
    }
    // Wire page selector bar (arrows + auto-scroll a tab activa)
    if (window.NBShared && NBShared.wirePageBar) NBShared.wirePageBar(document);
  }

  // ── SUBJECT DROPDOWN TOGGLE ──
  function toggleSubject(sid) {
    const el = document.getElementById('sjNb-' + sid);
    if (!el) return;
    el.classList.toggle('on');
    if (el.classList.contains('on')) openSubjects.add(sid);
    else openSubjects.delete(sid);
  }

  // ── PAGE OPS ──
  function isCustom(sid) { return typeof sid === 'string' && sid.startsWith('cnb_'); }
  function refreshOwner(sid) {
    if (isCustom(sid)) renderCustomList();
    else if (window.SYS) SYS.render();
  }

  function newPage(sid) {
    const d = getSubjectData(sid);
    const sub = d[sid];
    const page = { id: Date.now(), title: '', body: '', links: [], images: [], created: new Date().toISOString(), updated: new Date().toISOString() };
    sub.pages.unshift(page);
    save(d);
    activePage[sid] = page.id;
    openSubjects.add(sid);
    refreshOwner(sid);
  }

  async function openPage(sid, pid) {
    activePage[sid] = pid;
    openSubjects.add(sid);
    // Auto-migrate legacy {data} images to {id, thumbnail} on first open
    if (window.NBShared) {
      try {
        const d = load();
        const page = (d[sid]||{pages:[]}).pages.find(p => p.id === pid);
        if (page && page.images && page.images.some(im => im && im.data && !im.id)) {
          await NBShared.migrateLegacyImages(page);
          if (page._migrated) { delete page._migrated; save(d); }
        }
      } catch(e) { /* migration failure is non-fatal */ }
    }
    refreshOwner(sid);
  }

  function deletePage(sid, pid) {
    if (!confirm('¿Eliminar esta página?')) return;
    const d = load();
    const sub = d[sid];
    if (!sub) return;
    sub.pages = sub.pages.filter(p => p.id !== pid);
    save(d);
    if (activePage[sid] === pid) delete activePage[sid];
    refreshOwner(sid);
  }

  function _commitNow(sid){
    const pid = activePage[sid];
    if (!pid) return;
    const d = load();
    const sub = d[sid];
    if (!sub) return;
    const page = sub.pages.find(p => p.id === pid);
    if (!page) return;
    const tIn = document.getElementById('nbTitle-' + sid);
    const bIn = document.getElementById('nbBody-' + sid);
    if (tIn) page.title = tIn.value;
    if (bIn) page.body = bIn.innerHTML;
    page.updated = new Date().toISOString();
    save(d);
    const badge = document.getElementById('nbSaved-' + sid);
    if (badge) {
      badge.classList.add('on');
      clearTimeout(badge._t);
      badge._t = setTimeout(() => badge.classList.remove('on'), 1200);
    }
  }
  function autoSave(sid) {
    clearTimeout(saveTimers[sid]);
    saveTimers[sid] = setTimeout(() => _commitNow(sid), 500);
  }
  function flushAllNB(){
    Object.keys(saveTimers).forEach(sid => { clearTimeout(saveTimers[sid]); _commitNow(sid); });
  }
  window.addEventListener('beforeunload', flushAllNB);
  document.addEventListener('visibilitychange', () => { if (document.hidden) flushAllNB(); });
  document.addEventListener('focusout', (e) => {
    const t = e.target; if (!t || !t.id) return;
    if (t.id.startsWith('nbBody-')) _commitNow(t.id.slice(7));
    else if (t.id.startsWith('nbTitle-')) _commitNow(t.id.slice(8));
  });

  // ── RICH-TEXT FORMAT ──
  // Ensures the contenteditable has focus + an active selection before
  // calling execCommand (otherwise Chrome silently no-ops).
  function focusEditor(sid) {
    const bIn = document.getElementById('nbBody-' + sid);
    if (!bIn) return null;
    if (document.activeElement !== bIn) bIn.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      const r = document.createRange();
      r.selectNodeContents(bIn);
      r.collapse(false);
      sel.removeAllRanges();
      sel.addRange(r);
    }
    return bIn;
  }

  function fmt(sid, kind, value) {
    const bIn = focusEditor(sid);
    if (!bIn) return;
    // Comandos extendidos centralizados en NBShared (listas, checklist, hr)
    if (window.NBShared && NBShared.fmtExtended && NBShared.fmtExtended(kind)) {
      autoSave(sid);
      return;
    }
    try {
      if (kind === 'bold') {
        document.execCommand('bold', false, null);
      } else if (kind === 'size') {
        // execCommand fontSize accepts 1..7; we map S/M/L → 2/3/5.
        const map = { s: '2', m: '3', l: '5' };
        document.execCommand('fontSize', false, map[value] || '3');
      } else if (kind === 'hl') {
        const map = {
          y: '#fff59d',   // yellow
          g: '#a5d6a7',   // green
          p: '#f8bbd0'    // pink
        };
        // styleWithCSS so backColor / foreColor produce inline CSS (not <font> tags).
        try { document.execCommand('styleWithCSS', false, true); } catch (e) {}
        // Force dark text so the highlighted portion is readable against the light fill
        // (the default editor color is near-white — would disappear over yellow/green/pink).
        document.execCommand('foreColor', false, '#1a1a1a');
        // Try hiliteColor first (Firefox), fall back to backColor (Chrome).
        if (!document.execCommand('hiliteColor', false, map[value] || '#fff59d')) {
          document.execCommand('backColor', false, map[value] || '#fff59d');
        }
      } else if (kind === 'clear') {
        // 1) Strip standard formatting in the current selection (bold, size, color, bg).
        document.execCommand('removeFormat', false, null);
        // 2) Remove URGENTE / HECHO badges — execCommand('removeFormat') doesn't touch
        //    custom spans with classes, so we delete them manually.
        removeLabelsInRange(bIn);
      }
    } catch (e) {
      console.warn('NB.fmt failed:', e);
    }
    autoSave(sid);
  }

  // Remove any .rt-label spans inside the current selection (or all labels in the
  // editor if the selection is collapsed / nothing is selected).
  function removeLabelsInRange(bIn) {
    const sel = window.getSelection();
    const labels = Array.from(bIn.querySelectorAll('.rt-label'));
    if (!labels.length) return;
    if (!sel || !sel.rangeCount || sel.getRangeAt(0).collapsed) {
      // No active selection → nuke every badge in this editor.
      labels.forEach(el => el.remove());
      return;
    }
    const range = sel.getRangeAt(0);
    labels.forEach(el => {
      try { if (range.intersectsNode(el)) el.remove(); } catch (_) { /* old browsers */ }
    });
  }

  function insertLabel(sid, type) {
    const bIn = focusEditor(sid);
    if (!bIn) return;
    // onclick on the badge itself gives the user a one-click delete even without
    // using the toolbar ✕ — UX shortcut requested by the user.
    const html = type === 'urgent'
      ? '<span class="rt-label rt-lbl-urgent" contenteditable="false" title="Click para eliminar" onclick="NB.removeLabelEl(this,\'' + sid + '\')">⚠ URGENTE</span>&nbsp;'
      : '<span class="rt-label rt-lbl-done" contenteditable="false" title="Click para eliminar" onclick="NB.removeLabelEl(this,\'' + sid + '\')">✓ HECHO</span>&nbsp;';
    try {
      document.execCommand('insertHTML', false, html);
    } catch (e) {
      // Manual fallback
      const sel = window.getSelection();
      if (sel && sel.rangeCount) {
        const range = sel.getRangeAt(0);
        const frag = range.createContextualFragment(html);
        range.deleteContents();
        range.insertNode(frag);
      }
    }
    autoSave(sid);
  }

  // Called when a badge is clicked — remove that specific badge and persist.
  function removeLabelEl(el, sid) {
    if (el && el.parentNode) el.parentNode.removeChild(el);
    autoSave(sid);
  }

  // ── LINKS ──
  function addLink(sid) {
    const pid = activePage[sid];
    if (!pid) return alert('Primero abre o crea una página.');
    const url = prompt('URL del link de estudio:');
    if (!url) return;
    const label = prompt('Nombre del link (opcional):') || url;
    const d = load();
    const page = d[sid].pages.find(p => p.id === pid);
    if (!page.links) page.links = [];
    page.links.push({ url, label, added: new Date().toISOString() });
    page.updated = new Date().toISOString();
    save(d);
    const el = document.getElementById('nbLinks-' + sid);
    if (el) el.innerHTML = renderLinksHtml(sid, page);
  }

  function removeLink(sid, idx) {
    const d = load();
    const pid = activePage[sid];
    const page = d[sid].pages.find(p => p.id === pid);
    page.links.splice(idx, 1);
    page.updated = new Date().toISOString();
    save(d);
    const el = document.getElementById('nbLinks-' + sid);
    if (el) el.innerHTML = renderLinksHtml(sid, page);
  }

  // ── IMAGES (HD) ──
  /** Compress image for storage. Aligned with NBShared.compressImage so 10-SYS
   *  and 13-NOT produce same-sized images. Reduced from 1920·92% to 1200·72%
   *  → typical phone photo (3-5 MB) becomes 80-150 KB, fits localStorage AND
   *  syncs reliably to Supabase JSONB. Falls back to NBShared if available. */
  function compressImageToHD(srcDataUrl) {
    if (window.NBShared && typeof NBShared.compressImage === 'function') {
      return NBShared.compressImage(srcDataUrl);
    }
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = function() {
        const canvas = document.createElement('canvas');
        const maxDim = 1200;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        try { resolve(canvas.toDataURL('image/jpeg', 0.72)); } catch (e) { reject(e); }
      };
      img.onerror = reject;
      img.src = srcDataUrl;
    });
  }

  /** Store image: full → IDB, thumbnail in payload (sync-safe). */
  async function pushImage(sid, dataUrl, caption) {
    const pid = activePage[sid];
    if (!pid) return;
    const d = load();
    const page = d[sid].pages.find(p => p.id === pid);
    if (!page.images) page.images = [];
    let rec;
    if (window.NBShared && typeof NBShared.storeImageWithThumbnail === 'function') {
      try {
        rec = await NBShared.storeImageWithThumbnail(dataUrl, caption || '');
      } catch (e) { console.warn('IDB image store failed, fallback to inline:', e); }
    }
    if (rec) {
      page.images.push({ id: rec.id, thumbnail: rec.thumbnail, caption: rec.caption || caption || '', size: rec.size, addedAt: rec.addedAt });
    } else {
      page.images.push({ data: dataUrl, caption: caption || '', added: new Date().toISOString() });
    }
    page.updated = new Date().toISOString();
    save(d);
    const el = document.getElementById('nbImages-' + sid);
    if (el) el.innerHTML = renderImagesHtml(sid, page);
  }

  async function removeImage(sid, idx) {
    if (!confirm('¿Eliminar esta imagen?')) return;
    const d = load();
    const pid = activePage[sid];
    const page = d[sid].pages.find(p => p.id === pid);
    const im = page.images[idx];
    if (im && im.id && window.NBShared) { try { await NBShared.deleteImage(im.id); } catch(e){} }
    page.images.splice(idx, 1);
    page.updated = new Date().toISOString();
    save(d);
    const el = document.getElementById('nbImages-' + sid);
    if (el) el.innerHTML = renderImagesHtml(sid, page);
  }

  // ── PASTE / DRAG / FILE DIALOG ──
  function openPasteDialog(sid) {
    const pid = activePage[sid];
    if (!pid) { alert('Primero abre o crea una página.'); return; }
    pim.sid = sid;
    pim.dataUrl = null;
    const ov = document.getElementById('pasteImgOverlay');
    const preview = document.getElementById('pimPreview');
    const cap = document.getElementById('pimCaption');
    const save = document.getElementById('pimSave');
    if (preview) preview.style.display = 'none';
    if (cap) cap.value = '';
    if (save) save.disabled = true;
    const dz = document.getElementById('pimDropzone');
    if (dz) {
      dz.classList.remove('drag');
      dz.querySelector('.pim-dz-icon').textContent = '📋';
      dz.querySelector('.pim-dz-text').textContent = 'Pega o suelta tu imagen aquí';
    }
    ov.classList.add('on');
    document.body.style.overflow = 'hidden';
    setTimeout(() => dz && dz.focus(), 50);
  }

  function closePasteDialog() {
    const ov = document.getElementById('pasteImgOverlay');
    if (ov) ov.classList.remove('on');
    document.body.style.overflow = '';
    pim.sid = null;
    pim.dataUrl = null;
  }

  function pimPickFile() {
    const input = document.getElementById('nbImgInput');
    if (!input) return;
    input.onchange = function(e) {
      const f = e.target.files[0];
      if (f) pimIngestFile(f);
      e.target.value = '';
    };
    input.click();
  }

  function pimIngestFile(file) {
    if (!file || !file.type.startsWith('image/')) { alert('El archivo no es una imagen.'); return; }
    const reader = new FileReader();
    reader.onload = ev => pimIngestDataUrl(ev.target.result, file.name || '');
    reader.readAsDataURL(file);
  }

  async function pimIngestDataUrl(dataUrl, suggestedCaption) {
    try {
      const hd = await compressImageToHD(dataUrl);
      pim.dataUrl = hd;
      const img = document.getElementById('pimPreviewImg');
      const preview = document.getElementById('pimPreview');
      const cap = document.getElementById('pimCaption');
      const save = document.getElementById('pimSave');
      const dz = document.getElementById('pimDropzone');
      if (img) img.src = hd;
      if (preview) preview.style.display = 'flex';
      if (cap && !cap.value && suggestedCaption) cap.value = suggestedCaption;
      if (save) save.disabled = false;
      if (dz) {
        dz.querySelector('.pim-dz-icon').textContent = '✅';
        dz.querySelector('.pim-dz-text').textContent = 'Listo para guardar';
      }
    } catch (e) {
      alert('Error procesando la imagen: ' + e.message);
    }
  }

  function pimSave() {
    if (!pim.sid || !pim.dataUrl) return;
    const cap = document.getElementById('pimCaption');
    pushImage(pim.sid, pim.dataUrl, cap ? cap.value : '');
    closePasteDialog();
  }

  // Paste event: handles Ctrl+V when modal is open
  function handlePaste(e) {
    const ov = document.getElementById('pasteImgOverlay');
    if (!ov || !ov.classList.contains('on')) return;
    const items = e.clipboardData && e.clipboardData.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.type && it.type.startsWith('image/')) {
        const f = it.getAsFile();
        if (f) { e.preventDefault(); pimIngestFile(f); return; }
      }
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    const dz = document.getElementById('pimDropzone');
    if (dz) dz.classList.remove('drag');
    const files = e.dataTransfer && e.dataTransfer.files;
    if (files && files[0]) pimIngestFile(files[0]);
  }

  function handleDragOver(e) {
    e.preventDefault();
    const dz = document.getElementById('pimDropzone');
    if (dz) dz.classList.add('drag');
  }

  function handleDragLeave(e) {
    const dz = document.getElementById('pimDropzone');
    if (dz && e.target === dz) dz.classList.remove('drag');
  }

  // ── LIGHTBOX ──
  async function viewImage(sid, idx) {
    const d = load();
    const pid = activePage[sid];
    const page = d[sid].pages.find(p => p.id === pid);
    if (!page || !page.images || !page.images[idx]) return;
    lbCtx = { subjectId: sid, pageId: pid, index: idx };
    const lb = document.getElementById('nbLightbox');
    const img = document.getElementById('nbLbImg');
    const cap = document.getElementById('nbLbCaption');
    const im = page.images[idx];
    // Resolve full image from IDB; fall back to legacy inline `data`
    const fullUrl = window.NBShared
      ? await NBShared.resolveImageData(im)
      : (im.data || im.thumbnail);
    if (!fullUrl) {
      alert('No se pudo cargar la imagen original (puede estar solo en otro dispositivo).');
      return;
    }
    img.src = fullUrl;
    cap.textContent = `${idx + 1}/${page.images.length} — ${im.caption || ''}`;
    lb.classList.add('on');
    document.body.style.overflow = 'hidden';
  }

  function closeImage() {
    const lb = document.getElementById('nbLightbox');
    if (lb) lb.classList.remove('on');
    document.body.style.overflow = '';
    lbCtx = null;
  }

  function prevImage() {
    if (!lbCtx) return;
    const d = load();
    const page = d[lbCtx.subjectId].pages.find(p => p.id === lbCtx.pageId);
    if (!page || !page.images || !page.images.length) return;
    lbCtx.index = (lbCtx.index - 1 + page.images.length) % page.images.length;
    viewImage(lbCtx.subjectId, lbCtx.index);
  }

  function nextImage() {
    if (!lbCtx) return;
    const d = load();
    const page = d[lbCtx.subjectId].pages.find(p => p.id === lbCtx.pageId);
    if (!page || !page.images || !page.images.length) return;
    lbCtx.index = (lbCtx.index + 1) % page.images.length;
    viewImage(lbCtx.subjectId, lbCtx.index);
  }

  // ── GLOBAL HOOKS ──
  function init() {
    document.addEventListener('keydown', e => {
      const lb = document.getElementById('nbLightbox');
      const pim = document.getElementById('pasteImgOverlay');
      if (pim && pim.classList.contains('on')) {
        if (e.key === 'Escape') closePasteDialog();
        return;
      }
      if (lb && lb.classList.contains('on')) {
        if (e.key === 'Escape') closeImage();
        else if (e.key === 'ArrowLeft') prevImage();
        else if (e.key === 'ArrowRight') nextImage();
      }
    });
    // Paste anywhere when paste-modal is open
    document.addEventListener('paste', handlePaste);
    // Drag/drop on dropzone
    setTimeout(() => {
      const dz = document.getElementById('pimDropzone');
      if (!dz) return;
      dz.addEventListener('dragover', handleDragOver);
      dz.addEventListener('dragleave', handleDragLeave);
      dz.addEventListener('drop', handleDrop);
      dz.addEventListener('click', () => pimPickFile());
    }, 100);
  }

  // ═══════════════════════════════════════
  // CUSTOM NOTEBOOKS — User-defined notebooks for external courses
  // (SQL Course, AWS Cloud, Python Bootcamp, etc.)
  // ═══════════════════════════════════════
  const META_KEY = 'sys_notebook_meta';

  function loadMeta() { try { return JSON.parse(localStorage.getItem(META_KEY) || '[]'); } catch { return []; } }
  function saveMeta(list) { localStorage.setItem(META_KEY, JSON.stringify(list)); }

  function getCustoms() { return loadMeta(); }

  function createCustom() {
    const nameInp = document.getElementById('cnbNewName');
    const iconHidden = document.getElementById('cnbNewIconValue');
    const coverHidden = document.getElementById('cnbNewCoverValue');
    const iconSel = document.getElementById('cnbNewIcon'); // legacy fallback
    const name = (nameInp?.value || '').trim();
    if (!name) { alert('Dale un nombre al cuaderno.'); return; }
    const palette = ['#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#6366f1','#14b8a6'];
    const list = loadMeta();
    const id = 'cnb_' + Date.now();
    list.push({
      id, name,
      icon: (iconHidden?.value || iconSel?.value || '📘'),
      cover: (coverHidden?.value || 'c1'),
      color: palette[list.length % palette.length],
      created: new Date().toISOString(),
    });
    saveMeta(list);
    // Initialize its data bucket
    getSubjectData(id);
    if (nameInp) nameInp.value = '';
    openSubjects.add(id);
    renderCustomList();
  }

  // Open design picker modal for new-notebook form
  async function openDesignPicker() {
    if (!window.NBShared) { alert('Módulo de diseño no cargado.'); return; }
    const iconH = document.getElementById('cnbNewIconValue');
    const coverH = document.getElementById('cnbNewCoverValue');
    const nameInp = document.getElementById('cnbNewName');
    const r = await NBShared.openDesignModal({
      cover: coverH?.value || 'c1',
      icon: iconH?.value || '📘',
      name: nameInp?.value || '',
    });
    if (!r) return;
    if (iconH) iconH.value = r.icon;
    if (coverH) coverH.value = r.cover;
    refreshNewFormPreview();
  }

  function refreshNewFormPreview() {
    const iconH = document.getElementById('cnbNewIconValue');
    const coverH = document.getElementById('cnbNewCoverValue');
    const previewEl = document.getElementById('cnbDesignPreview');
    const iconEl = document.getElementById('cnbDesignIconPreview');
    if (previewEl && coverH) previewEl.className = 'nb-cover-' + coverH.value;
    if (iconEl && iconH) iconEl.textContent = iconH.value;
  }

  // Open design picker modal for an existing custom notebook
  async function editCustomDesign(id) {
    if (!window.NBShared) { alert('Módulo de diseño no cargado.'); return; }
    const list = loadMeta();
    const cnb = list.find(c => c.id === id);
    if (!cnb) return;
    const r = await NBShared.openDesignModal({ cover: cnb.cover || 'c1', icon: cnb.icon, name: cnb.name });
    if (!r) return;
    cnb.cover = r.cover;
    cnb.icon = r.icon;
    cnb.updated = new Date().toISOString();
    saveMeta(list);
    renderCustomList();
  }

  function renameCustom(id) {
    const list = loadMeta();
    const cnb = list.find(c => c.id === id);
    if (!cnb) return;
    const newName = prompt('Nuevo nombre del cuaderno:', cnb.name);
    if (!newName || !newName.trim()) return;
    cnb.name = newName.trim();
    cnb.updated = new Date().toISOString();
    saveMeta(list);
    renderCustomList();
  }

  function changeCustomIcon(id) {
    const list = loadMeta();
    const cnb = list.find(c => c.id === id);
    if (!cnb) return;
    const newIcon = prompt('Nuevo ícono (emoji):', cnb.icon);
    if (!newIcon || !newIcon.trim()) return;
    cnb.icon = newIcon.trim();
    cnb.updated = new Date().toISOString();
    saveMeta(list);
    renderCustomList();
  }

  function deleteCustom(id) {
    const list = loadMeta();
    const cnb = list.find(c => c.id === id);
    if (!cnb) return;
    if (!confirm(`¿Eliminar el cuaderno "${cnb.name}" y todas sus páginas? Esta acción no se puede deshacer.`)) return;
    saveMeta(list.filter(c => c.id !== id));
    // Remove pages data
    const d = load();
    delete d[id];
    save(d);
    delete activePage[id];
    openSubjects.delete(id);
    renderCustomList();
  }

  /* Move custom notebook to another module (NB-ENGINE standard) */
  function moveNotebook(id) {
    if (!window.NBEngine) { alert('Motor de cuadernos no cargado.'); return; }
    NBEngine.transferUI(id, '10-SYS', () => {
      delete activePage[id];
      openSubjects.delete(id);
      renderCustomList();
    });
  }

  // Render a custom notebook card — header with rename/delete + shared editor UI
  function renderCustomCard(meta) {
    const d = load();
    const sub = d[meta.id] || { pages: [] };
    const pageCount = sub.pages.length;
    const isOpen = openSubjects.has(meta.id);
    const activeId = activePage[meta.id];
    const page = activeId ? sub.pages.find(p => p.id === activeId) : null;

    const pagesListHtml = pageCount ? sub.pages.map(p => {
      const preview = (p.body || '').substring(0, 60).replace(/\n/g, ' ');
      const isActive = activeId === p.id;
      return `<div class="nb-entry${isActive ? ' open' : ''}">
        <div class="nb-entry-h" onclick="NB.openPage('${meta.id}',${p.id})">
          <div style="min-width:0;flex:1"><div class="nb-entry-title">${esc(p.title || 'Sin título')}</div><div style="font-size:10px;color:var(--t3);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(preview)}${preview.length >= 60 ? '…' : ''}</div></div>
          <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
            <span class="nb-entry-date">${new Date(p.updated || p.created).toLocaleDateString('es', { day: 'numeric', month: 'short' })}</span>
            <span style="font-size:10px;color:var(--t3)">${(p.links||[]).length ? '🔗'+p.links.length : ''} ${(p.images||[]).length ? '🖼'+p.images.length : ''}</span>
            <button onclick="event.stopPropagation();NB.deletePage('${meta.id}',${p.id})" style="background:none;border:none;color:var(--t3);cursor:pointer;font-size:11px;opacity:.5">🗑</button>
          </div>
        </div>
      </div>`;
    }).join('') : '<div style="text-align:center;padding:14px;color:var(--t3);font-size:11px">Sin páginas. Haz click en "+ Nueva página".</div>';

    const editorHtml = buildEditorHtml(meta.id, page);

    const created = meta.created ? new Date(meta.created).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
    const cover = meta.cover || 'c1';

    return `<div class="gc" style="border-left:3px solid ${meta.color};margin-bottom:12px;padding:0;overflow:visible"><!-- visible para sticky toolbar -->
      <div class="nb-cover-card nb-cover-${cover}">
        <div class="nb-cover-icon">${meta.icon}</div>
        <div>
          <div class="nb-cover-title">${esc(meta.name)}</div>
          <div class="nb-cover-sub">${pageCount} página${pageCount!==1?'s':''}${created ? ' · creado ' + created : ''}</div>
        </div>
      </div>
      <div style="padding:14px">
      <div class="gc-h" style="margin-bottom:8px">
        <div class="gc-t" style="font-size:13px;color:var(--t2)">⚙️ Personalización</div>
        <div style="display:flex;gap:4px">
          <button onclick="NB.editCustomDesign('${meta.id}')" title="Cambiar portada/ícono" style="background:none;border:1px solid var(--bd);color:var(--t2);border-radius:6px;padding:4px 8px;font-size:11px;cursor:pointer">🎨 Diseño</button>
          <button onclick="NB.renameCustom('${meta.id}')" title="Renombrar" style="background:none;border:1px solid var(--bd);color:var(--t2);border-radius:6px;padding:4px 8px;font-size:11px;cursor:pointer">✏️ Nombre</button>
          <button onclick="NB.moveNotebook('${meta.id}')" title="Mover a otro módulo" style="background:none;border:1px solid var(--bd);color:var(--t2);border-radius:6px;padding:4px 8px;font-size:11px;cursor:pointer">📦 Mover</button>
          <button onclick="NB.deleteCustom('${meta.id}')" title="Eliminar" style="background:none;border:1px solid rgba(239,68,68,.3);color:var(--rd);border-radius:6px;padding:4px 8px;font-size:11px;cursor:pointer">🗑</button>
        </div>
      </div>

      <div class="sj-drop${isOpen ? ' on' : ''}" id="sjNb-${meta.id}" style="margin-top:8px">
        <div class="sj-drop-h" onclick="NB.toggleSubject('${meta.id}')">
          <div>📓 Contenido <span class="sj-drop-count">(click para ${isOpen?'cerrar':'abrir'})</span></div>
          <span class="sj-drop-arr">▶</span>
        </div>
        <div class="sj-drop-body">
          <div class="sj-nb-toolbar">
            <button onclick="NB.newPage('${meta.id}')" style="background:var(--vi);color:#fff">+ Nueva página</button>
            ${page ? `<button onclick="NB.addLink('${meta.id}')" style="background:var(--el);color:var(--t2);border:1px solid var(--bd)">🔗 Link</button>
            <button onclick="NB.openPasteDialog('${meta.id}')" style="background:var(--el);color:var(--t2);border:1px solid var(--bd)">🖼️ Imagen HD</button>
            <button onclick="NB.attachFile('${meta.id}')" style="background:var(--el);color:var(--t2);border:1px solid var(--bd)">📎 Adjuntar</button>` : ''}
            ${(window.NBShared && NBShared.pageJumpHtml) ? NBShared.pageJumpHtml({ nbId: meta.id, ns:'NB', pages: sub.pages, activePageId: activeId }) : ''}
          </div>
          ${editorHtml}
          <div class="sl" style="margin-top:12px">· páginas ·</div>
          <div class="nb-entries">${pagesListHtml}</div>
        </div>
      </div>
      </div>
    </div>`;
  }

  function toggleCustomEdit(id) {
    const el = document.getElementById('nbDesignEdit-' + id);
    if (!el) return;
    el.style.display = (el.style.display === 'none' || !el.style.display) ? 'block' : 'none';
  }

  // Currently-selected custom notebook — survives re-renders within the session
  // and is persisted to localStorage so it reopens on reload.
  let activeCustomId = (function() {
    try { return localStorage.getItem('sys_active_custom') || null; } catch { return null; }
  })();

  function selectCustom(id) {
    activeCustomId = id || null;
    try { localStorage.setItem('sys_active_custom', activeCustomId || ''); } catch {}
    // Make the selected notebook auto-expand so the user sees its content immediately.
    if (id) openSubjects.add(id);
    renderCustomList();
  }

  function renderCustomList() {
    const el = document.getElementById('cnbList');
    if (!el) return;
    const list = loadMeta();
    if (!list.length) {
      activeCustomId = null;
      el.innerHTML = `<div class="gc" style="text-align:center;padding:40px 20px;color:var(--t3);border-style:dashed">
        <div style="font-size:32px;margin-bottom:8px">📚</div>
        <div style="font-size:14px;font-weight:600;color:var(--tx);margin-bottom:4px">Sin cuadernos aún</div>
        <div style="font-size:12px">Crea tu primer cuaderno personalizado arriba.<br>Ej: "SQL Course", "AWS Cloud", "Python Bootcamp"...</div>
      </div>`;
      return;
    }
    // Default to the first notebook if the previously-selected one was deleted or never set
    if (!activeCustomId || !list.find(m => m.id === activeCustomId)) {
      activeCustomId = list[0].id;
      try { localStorage.setItem('sys_active_custom', activeCustomId); } catch {}
    }
    const activeMeta = list.find(m => m.id === activeCustomId);
    // Ensure the selected notebook is expanded so the editor is visible
    if (activeCustomId) openSubjects.add(activeCustomId);

    const options = list.map(m =>
      `<option value="${m.id}"${m.id === activeCustomId ? ' selected' : ''}>${m.icon} ${esc(m.name)}</option>`
    ).join('');

    el.innerHTML = `
      <div class="cnb-selector">
        <label class="cnb-selector-lbl">Cuaderno activo</label>
        <select class="cnb-selector-sel" onchange="NB.selectCustom(this.value)">${options}</select>
        <span class="cnb-selector-hint">${list.length} cuaderno${list.length !== 1 ? 's' : ''} · selecciona uno para trabajar de forma independiente</span>
      </div>
      <div class="cnb-active">${renderCustomCard(activeMeta)}</div>
    `;
  }

  function initPickers() { refreshNewFormPreview(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { init(); renderCustomList(); initPickers(); });
  else setTimeout(() => { init(); renderCustomList(); initPickers(); }, 0);

  // Re-render custom list on tab switch (when showTab(7) is hit)
  window.addEventListener('sb:signed_in', () => setTimeout(renderCustomList, 300));

  return {
    renderSubjectPanel, restoreAfterRender, toggleSubject,
    newPage, openPage, deletePage, autoSave,
    fmt, insertLabel, removeLabelEl,
    addLink, removeLink, removeImage, renameImage,
    openPasteDialog, closePasteDialog, pimPickFile, pimSave,
    viewImage, closeImage, prevImage, nextImage,
    // Custom notebooks
    getCustoms, createCustom, renameCustom, changeCustomIcon, deleteCustom, renderCustomList, selectCustom, moveNotebook,
    // New: covers + icons + attachments (modal-based)
    openDesignPicker, editCustomDesign, refreshNewFormPreview, toggleCustomEdit,
    attachFile, removeAttachment,
  };
})();
window.NB = NB;
