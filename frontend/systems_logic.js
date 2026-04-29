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
    { id: 'english_beginner', code: 'A1I01', name: 'Virtual English - Beginner 1', group: '50608', icon: '🇺🇸', color: 'hsl(45,85%,50%)', credits: 0, type: 'Idiomas (IV001)', cdigital_id: 100774, desc: 'Inglés nivel A1: presentaciones, vocabulario básico, gramática elemental, listening y speaking.', resources: ['https://www.duolingo.com/', 'https://www.bbc.co.uk/learningenglish/'] },
    { id: 'placement_test', code: 'CE1026', name: 'Placement Test BE Plus', group: '5TB01', icon: '📝', color: 'hsl(15,70%,50%)', credits: 0, type: 'Idiomas (IV002)', cdigital_id: 106289, desc: 'Test de ubicación para determinar nivel de inglés en el programa BE Plus de la CUN.', resources: ['https://cdigital.cun.edu.co/course/view.php?id=106289'] },
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
    '26V02': { label: 'Período 26V02', academic: { start: '2026-03-30', end: '2026-07-19' }, block1: { start: '2026-03-30', end: '2026-05-24', label: 'Primer Bloque' }, block2: { start: '2026-05-25', end: '2026-07-19', label: 'Segundo Bloque' }, gradeClose1: { start: '2026-05-19', end: '2026-05-25', label: 'Cierre notas Bloque 1' } },
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

  // ── CERTIFICATIONS ──
  const CERTS = [
    { name: 'AWS Cloud Practitioner', issuer: 'Amazon Web Services', icon: '☁️', color: 'hsl(35,90%,55%)', desc: 'Fundamentos de cloud computing. Ideal para 8vo semestre: complementa Redes Inalámbricas y Admin BD. Alta demanda en Colombia.', tags: ['Cloud', 'Fundamentos', 'Alto Impacto'], link: 'https://aws.amazon.com/certification/certified-cloud-practitioner/', difficulty: 'Intermedio', time: '4-6 semanas', free: true },
    { name: 'Azure Fundamentals AZ-900', issuer: 'Microsoft Azure', icon: '🔷', color: 'hsl(210,80%,50%)', desc: 'Conceptos de nube, servicios Azure, seguridad, gobernanza. Microsoft ofrece path gratuito en Learn.', tags: ['Cloud', 'Microsoft', 'Gratis'], link: 'https://learn.microsoft.com/en-us/certifications/azure-fundamentals/', difficulty: 'Básico', time: '3-4 semanas', free: true },
    { name: 'Docker Certified Associate', issuer: 'Docker Inc.', icon: '🐳', color: 'hsl(200,70%,50%)', desc: 'Contenedores, orquestación, networking Docker. Complementa Refinamiento de Software (CI/CD, DevOps).', tags: ['DevOps', 'Containers', 'CI/CD'], link: 'https://www.docker.com/docker-certified-associate/', difficulty: 'Intermedio-Avanzado', time: '6-8 semanas', free: false },
    { name: 'CompTIA Network+', issuer: 'CompTIA', icon: '🌐', color: 'hsl(142,60%,45%)', desc: 'Networking profesional. Refuerza directamente Redes Inalámbricas. Reconocida internacionalmente para infraestructura.', tags: ['Redes', 'Infraestructura', 'Internacional'], link: 'https://www.comptia.org/certifications/network', difficulty: 'Intermedio', time: '8-10 semanas', free: false },
    { name: 'Oracle Database SQL Certified', issuer: 'Oracle', icon: '🔶', color: 'hsl(15,80%,50%)', desc: 'SQL avanzado, administración Oracle. Refuerza Admin de Base de Datos. Oracle ofrece examen online.', tags: ['SQL', 'DBA', 'Enterprise'], link: 'https://education.oracle.com/oracle-database-sql-certified-associate/trackp_457', difficulty: 'Intermedio', time: '6-8 semanas', free: false },
    { name: 'GitHub Actions CI/CD', issuer: 'GitHub', icon: '🐙', color: 'hsl(263,50%,50%)', desc: 'Automatización de pipelines. Complementa perfectamente Refinamiento en Producción de Software.', tags: ['DevOps', 'CI/CD', 'Gratis'], link: 'https://resources.github.com/learn/pathways/automation/', difficulty: 'Básico-Intermedio', time: '2-3 semanas', free: true },
    { name: 'Scrum Foundation (SFPC)', issuer: 'CertiProf', icon: '🔄', color: 'hsl(172,60%,45%)', desc: 'Metodologías ágiles, Scrum framework. Gratis y reconocida. Útil para gestión de proyectos de software.', tags: ['Agile', 'Scrum', 'Gratis'], link: 'https://certiprof.com/pages/scrum-foundation-professional-certificate-sfpc', difficulty: 'Básico', time: '1-2 semanas', free: true },
    { name: 'Google IT Support Professional', issuer: 'Google / Coursera', icon: '🎓', color: 'hsl(45,90%,50%)', desc: 'Soporte IT, redes, seguridad, sysadmin. Base sólida que integra múltiples materias del semestre.', tags: ['IT', 'Google', 'Coursera'], link: 'https://www.coursera.org/professional-certificates/google-it-support', difficulty: 'Básico-Intermedio', time: '6 meses (a tu ritmo)', free: false },
  ];

  // ── QUICK ACCESS LINKS ──
  const QUICK_ACCESS = [
    { title: 'CUN Digital', desc: 'Plataforma de cursos y aulas virtuales', icon: '🎓', color: 'hsl(263,70%,55%)', url: 'https://cdigital.cun.edu.co/' },
    { title: 'Curso ID: 28494', desc: 'Tu aula virtual del semestre actual', icon: '📖', color: 'hsl(142,60%,45%)', url: 'https://cdigital.cun.edu.co/course/view.php?id=28494&expand#section-1' },
    { title: 'SGA Campus', desc: 'Sistema de Gestión Académica', icon: '🏛️', color: 'hsl(200,80%,50%)', url: 'https://sigwt.cun.edu.co/sgacampus/#home' },
    { title: 'Gmail CUN', desc: 'Correo institucional', icon: '📧', color: 'hsl(0,70%,55%)', url: 'https://mail.google.com/mail/u/3/?ogbl#inbox' },
    { title: 'Inducción Virtual', desc: 'Portal de inducción CUN', icon: '🚀', color: 'hsl(35,90%,55%)', url: 'https://cun.edu.co/induccion-virtual/' },
    { title: 'Calendario 2026', desc: 'PDF oficial de calendarios virtuales', icon: '📅', color: 'hsl(172,60%,45%)', url: 'https://repo.cunapp.dev/web/2025/calendarios/calendarios_virtuales_2026_.pdf' },
    { title: 'Plan de Estudios', desc: 'Malla curricular oficial PDF', icon: '📋', color: 'hsl(45,90%,50%)', url: 'https://repo.cunapp.dev/web/2024/planestudios/ingenieria_sistemas_virtual.pdf' },
    { title: 'Repositorio GitHub', desc: 'Código fuente del proyecto DA-2026', icon: '🐙', color: 'hsl(0,0%,60%)', url: 'https://github.com/Mikel696/da-2026' },
  ];

  // ── CUN ECOSYSTEM MAP ──
  const CUN_ECOSYSTEM = [
    { title: 'CUN 360', desc: 'App central: carnet digital, horarios, tickets CAMI, pagos y chatbot 24/7', icon: '📱', color: 'hsl(82,100%,37%)', url: 'https://360.cunapp.pro/#/estudiante/dashboard' },
    { title: 'CUN Digital (Moodle)', desc: 'LMS: materiales, foros, entregas, calificaciones. Aquí vives académicamente', icon: '🎓', color: 'hsl(263,70%,55%)', url: 'https://cdigital.cun.edu.co/' },
    { title: 'Curso Activo (28494)', desc: 'Tu aula virtual del semestre actual — acceso directo a contenido', icon: '📖', color: 'hsl(142,60%,45%)', url: 'https://cdigital.cun.edu.co/course/view.php?id=28494&expand#section-1' },
    { title: 'SGA Campus (SINU)', desc: 'Matrícula, notas oficiales, historial académico, certificados', icon: '🏛️', color: 'hsl(200,80%,50%)', url: 'https://sigwt.cun.edu.co/sgacampus/#home' },
    { title: 'Gmail CUN', desc: 'Correo institucional — comunicación con profesores y admin', icon: '📧', color: 'hsl(0,70%,55%)', url: 'https://mail.google.com/mail/u/3/?ogbl#inbox' },
    { title: 'CamiTicket', desc: 'Sistema de soporte: solicitudes académicas, financieras y técnicas', icon: '🎫', color: 'hsl(35,90%,55%)', url: 'https://cdigital.cun.edu.co/' },
    { title: 'Inducción Virtual', desc: 'Onboarding, guías, kit de bienvenida, tutoriales de plataformas', icon: '🚀', color: 'hsl(172,60%,45%)', url: 'https://cun.edu.co/induccion-virtual/' },
    { title: 'Campus Digital (Alt)', desc: 'Punto de entrada alternativo al LMS — mismo contenido que CDigital', icon: '🔄', color: 'hsl(45,90%,50%)', url: 'https://campusdigital.cun.edu.co/' },
    { title: 'Calendario 2026 (PDF)', desc: 'Documento oficial con fechas de los 6 períodos académicos', icon: '📅', color: 'hsl(320,60%,50%)', url: 'https://repo.cunapp.dev/web/2025/calendarios/calendarios_virtuales_2026_.pdf' },
    { title: 'Plan de Estudios (PDF)', desc: 'Malla curricular oficial — Ing. de Sistemas Virtual', icon: '📋', color: 'hsl(15,70%,50%)', url: 'https://repo.cunapp.dev/web/2024/planestudios/ingenieria_sistemas_virtual.pdf' },
    { title: 'CUN App (Google Play)', desc: 'Descarga la app móvil CUN 360 para Android', icon: '🤖', color: 'hsl(120,50%,40%)', url: 'https://play.google.com/store/apps/details?id=co.edu.cun.cun360' },
    { title: 'DA-2026 GitHub', desc: 'Código fuente de este proyecto — tu segundo cerebro', icon: '🐙', color: 'hsl(0,0%,55%)', url: 'https://github.com/Mikel696/da-2026' },
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

    el.innerHTML = SUBJECTS.map(s => {
      const subjTasks = tasks.filter(t => t.subj === s.id);
      const done = subjTasks.filter(t => t.done).length;
      const total = subjTasks.length;
      const pending = total - done;
      const pct = total > 0 ? Math.round(done / total * 100) : 0;
      const cdLink = s.cdigital_id ? `https://cdigital.cun.edu.co/course/view.php?id=${s.cdigital_id}` : null;
      const sl = s.subject_links || {};
      const VERIFIED_SUBJECTS = new Set(['ing_web', 'mat_especiales', 'inv_ciencia']);
      const hasRealCalendar = VERIFIED_SUBJECTS.has(s.id);

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

      return `<div class="gc" style="border-left:3px solid ${s.color}">
        <div class="gc-h">
          <div class="gc-t"><span style="font-size:18px">${s.icon}</span> ${s.name} <span style="font-size:11px;color:var(--t3);font-weight:400">· ${s.code}</span></div>
          ${s.credits ? `<span class="sem sem-p3" style="font-size:10px">${s.credits} créditos</span>` : ''}
        </div>
        ${s.professor ? `<div style="font-size:11px;color:var(--t2);margin-bottom:2px">👨‍🏫 ${s.professor}${s.professor_email ? ` · <a href="mailto:${s.professor_email}" style="color:var(--vi2);text-decoration:none">${s.professor_email}</a>` : ''}</div>` : ''}
        ${s.schedule ? `<div style="font-size:11px;color:var(--cy);margin-bottom:8px">⏰ ${s.schedule}</div>` : ''}
        ${total > 0 ? `<div style="display:flex;align-items:center;gap:10px;margin:8px 0">
          <div class="pbar" style="flex:1"><div class="pbar-fill pbar-vi" style="width:${pct}%"></div></div>
          <span style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--vi2)">${pct}% · ${done}/${total}</span>
        </div>` : ''}
        ${!hasRealCalendar ? `<div style="margin:8px 0;padding:8px 10px;background:rgba(234,179,8,.06);border:1px dashed rgba(234,179,8,.25);border-radius:6px;font-size:11px;color:var(--am)">⏳ Sin syllabus cargado. Pega el calendario real desde CDigital para crear tareas.</div>` : ''}

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

        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">
          ${cdLink ? `<a href="${cdLink}" target="_blank" rel="noopener" style="font-size:10px;padding:4px 9px;background:${s.color}18;border:1px solid ${s.color}55;border-radius:6px;color:${s.color};text-decoration:none;font-weight:600">🎓 CDigital</a>` : ''}
          ${sl.clase ? `<a href="${sl.clase}" target="_blank" rel="noopener" style="font-size:10px;padding:4px 9px;background:var(--vg);border:1px solid rgba(124,58,237,.25);border-radius:6px;color:var(--vi2);text-decoration:none">📡 Clase</a>` : ''}
          ${sl.grabaciones ? `<a href="${sl.grabaciones}" target="_blank" rel="noopener" style="font-size:10px;padding:4px 9px;background:var(--vg);border:1px solid rgba(124,58,237,.25);border-radius:6px;color:var(--vi2);text-decoration:none">📹 Grabaciones</a>` : ''}
          ${sl.material ? `<a href="${sl.material}" target="_blank" rel="noopener" style="font-size:10px;padding:4px 9px;background:var(--vg);border:1px solid rgba(124,58,237,.25);border-radius:6px;color:var(--vi2);text-decoration:none">📂 Material</a>` : ''}
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
  function renderCerts() {
    const el = document.getElementById('certList');
    if (!el) return;
    el.innerHTML = CERTS.map((c, i) => `
      <div class="cert">
        <div class="cert-h">
          <div class="cert-logo" style="background:${c.color}18;border:1px solid ${c.color}30">${c.icon}</div>
          <div class="cert-info">
            <div class="cert-name">${c.name}</div>
            <div class="cert-issuer">${c.issuer} · ${c.difficulty} · ${c.time}</div>
          </div>
          ${c.free ? '<span class="sem sem-p3">GRATIS</span>' : '<span class="sem sem-p4">De pago</span>'}
        </div>
        <div class="cert-body">${c.desc}</div>
        <div class="cert-tags">${c.tags.map(t => `<span class="cert-tag">${t}</span>`).join('')}</div>
        <a href="${c.link}" target="_blank" rel="noopener" class="cert-link">Ver certificación →</a>
      </div>
    `).join('');
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
    const totalCredits = SUBJECTS.reduce((sum, s) => sum + (s.credits || 0), 0);
    setV('statMaterias', SUBJECTS.length);
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

  // ── CLEAR COMPLETED ──
  function clearCompleted() {
    const tasks = getTasks();
    const pending = tasks.filter(t => !t.done);
    const removed = tasks.length - pending.length;
    if (removed === 0) { alert('No hay tareas completadas para limpiar.'); return; }
    if (!confirm(`¿Eliminar ${removed} tarea${removed !== 1 ? 's' : ''} completada${removed !== 1 ? 's' : ''}?`)) return;
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
      heroAction = `<div style="margin-top:8px;font-size:11px;color:var(--rd);font-weight:600">Acción: Completa las tareas vencidas ANTES de las nuevas.</div>`;
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

  function render() {
    renderStats();
    renderActionNow();
    renderSemaphore();
    renderSubjectDetail();
    renderCalendar();
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
    const SEED_VERSION = 5;
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
    ]);
    if (hasStale || currentSeedVer < SEED_VERSION) {
      // Preserve user-created tasks; purge stale subjects + all old seed texts.
      // Mat Esp e Inv C&T (parcial) ahora tienen datos verificados — ya no se filtran sus textos.
      const userTasks = existing.filter(t =>
        !STALE_IDS.has(t.subj) &&
        !oldSeedTexts.has(t.text)
      );
      saveTasks(userTasks);
      db.set('seed_version', SEED_VERSION);
    }

    // Seed tasks — SOLO datos verificados por el usuario.
    // Ing Web (DIS34) y Mat Especiales (DIS31): calendario completo confirmado.
    // Inv C&T (DIS36): SOLO Corte 1 parcial (Tarea 1, Quiz 1, Tarea 2). Sin pesos. Cortes 2-3 pendientes.
    // English Beginner y Placement Test: siguen esperando syllabus real (NO inventar).
    const SEED_TASKS = [
      // ── Ing Web (DIS34) — verificado 2026-04-08 ──
      { id: 1,  text: 'Quiz 1 — Ingeniería Web (10%)',                                  subj: 'ing_web',        priority: 'p0', due: '2026-04-12' },
      { id: 2,  text: 'Parcial 1 — Ingeniería Web (20% → 1er Corte 30%)',               subj: 'ing_web',        priority: 'p1', due: '2026-04-19' },
      { id: 3,  text: 'Quiz 2 — Ingeniería Web (10%)',                                  subj: 'ing_web',        priority: 'p2', due: '2026-04-26' },
      { id: 4,  text: 'Parcial 2 — Ingeniería Web (20% → 2do Corte 30%)',               subj: 'ing_web',        priority: 'p2', due: '2026-05-03' },
      { id: 5,  text: 'ACA · Pitch Disciplinares-NIP — Ingeniería Web (34%)',           subj: 'ing_web',        priority: 'p3', due: '2026-05-16' },
      { id: 6,  text: 'Quiz 3 + Coev + Auto — Ingeniería Web (6% → 3er Corte 40%)',     subj: 'ing_web',        priority: 'p3', due: '2026-05-16' },
      { id: 7,  text: 'Asistir a clase Ing Web — Miércoles 6:15 PM',                    subj: 'ing_web',        priority: 'p0', due: '2026-04-08' },
      // ── Mat Especiales (DIS31) — verificado 2026-04-08 (syllabus Cortés Cruz, mismo calendario 26V02) ──
      { id: 8,  text: 'Quiz 1 — Mat Especiales (10%)',                                  subj: 'mat_especiales', priority: 'p0', due: '2026-04-12' },
      { id: 9,  text: 'Parcial 1 — Mat Especiales (20% → 1er Corte 30%)',               subj: 'mat_especiales', priority: 'p1', due: '2026-04-19' },
      { id: 10, text: 'Quiz 2 — Mat Especiales (10%)',                                  subj: 'mat_especiales', priority: 'p2', due: '2026-04-26' },
      { id: 11, text: 'Parcial 2 — Mat Especiales (20% → 2do Corte 30%)',               subj: 'mat_especiales', priority: 'p2', due: '2026-05-03' },
      { id: 12, text: 'ACA — Mat Especiales (34%)',                                     subj: 'mat_especiales', priority: 'p3', due: '2026-05-16' },
      { id: 13, text: 'Quiz 3 + Coev + Auto — Mat Especiales (6% → 3er Corte 40%)',     subj: 'mat_especiales', priority: 'p3', due: '2026-05-16' },
      { id: 14, text: 'Sesión sincrónica Mat Especiales — Mié/Vie 6:15 PM',             subj: 'mat_especiales', priority: 'p0', due: '2026-04-08' },
      // ── Inv C&T (DIS36) — Corte 1 parcial verificado 2026-04-09 (sin pesos; Cortes 2-3 TBD) ──
      { id: 15, text: 'Tarea 1 — Inv C&T (Corte 1)',                                    subj: 'inv_ciencia',    priority: 'p0', due: '2026-04-12' },
      { id: 16, text: 'Quiz 1 — Inv C&T (Corte 1)',                                     subj: 'inv_ciencia',    priority: 'p1', due: '2026-04-19' },
      { id: 17, text: 'Tarea 2 — Inv C&T (Corte 1)',                                    subj: 'inv_ciencia',    priority: 'p1', due: '2026-04-19' },
    ].map(t => ({ ...t, done: false, created: todayStr() }));

    // Re-seed when version bumps OR when DB is empty. Dedupe by text so user tasks survive.
    const needSeed = currentSeedVer < SEED_VERSION || getTasks().length === 0;
    if (needSeed) {
      const current = getTasks();
      const seedTextSet = new Set(SEED_TASKS.map(s => s.text));
      const userKept = current.filter(t => !seedTextSet.has(t.text));
      saveTasks([...SEED_TASKS, ...userKept]);
    }

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

  // Expose globally
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

  return { addTask, toggleTask, deleteTask, bulkImport, exportData, importData, clearCompleted, render, showTaskGuide, closeGuide, injectClassSession, deleteClassSession, updateClassStatus, copyClassPrompt, toggleCS, toggleSubjectDrop, addSubjectTask };
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
    return `<div class="nb-rt-toolbar">
        <button class="nb-rt-btn" onclick="NB.fmt('${sid}','bold')" title="Negrita (Ctrl+B)"><b>B</b></button>
        <span class="nb-rt-sep"></span>
        <button class="nb-rt-btn nb-rt-sz-s" onclick="NB.fmt('${sid}','size','s')" title="Texto pequeño">S</button>
        <button class="nb-rt-btn nb-rt-sz-m" onclick="NB.fmt('${sid}','size','m')" title="Texto normal">M</button>
        <button class="nb-rt-btn nb-rt-sz-l" onclick="NB.fmt('${sid}','size','l')" title="Texto grande">L</button>
        <span class="nb-rt-sep"></span>
        <button class="nb-rt-btn nb-rt-hl nb-rt-hl-y" onclick="NB.fmt('${sid}','hl','y')" title="Resaltar amarillo"></button>
        <button class="nb-rt-btn nb-rt-hl nb-rt-hl-g" onclick="NB.fmt('${sid}','hl','g')" title="Resaltar verde"></button>
        <button class="nb-rt-btn nb-rt-hl nb-rt-hl-p" onclick="NB.fmt('${sid}','hl','p')" title="Resaltar rosa"></button>
        <button class="nb-rt-btn" onclick="NB.fmt('${sid}','clear')" title="Quitar formato">✕</button>
        <span class="nb-rt-sep"></span>
        <button class="nb-rt-btn nb-rt-lbl nb-rt-lbl-u" onclick="NB.insertLabel('${sid}','urgent')" title="Insertar etiqueta URGENTE">⚠ URGENTE</button>
        <button class="nb-rt-btn nb-rt-lbl nb-rt-lbl-d" onclick="NB.insertLabel('${sid}','done')" title="Insertar etiqueta HECHO">✓ HECHO</button>
      </div>
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
    // No-op; could restore scroll or focus here.
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

  function autoSave(sid) {
    clearTimeout(saveTimers[sid]);
    saveTimers[sid] = setTimeout(() => {
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
    }, 500);
  }

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

    return `<div class="gc" style="border-left:3px solid ${meta.color};margin-bottom:12px;padding:0;overflow:hidden">
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
    getCustoms, createCustom, renameCustom, changeCustomIcon, deleteCustom, renderCustomList, selectCustom,
    // New: covers + icons + attachments (modal-based)
    openDesignPicker, editCustomDesign, refreshNewFormPreview, toggleCustomEdit,
    attachFile, removeAttachment,
  };
})();
window.NB = NB;
