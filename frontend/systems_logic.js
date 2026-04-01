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

  // ── SUBJECTS (8vo Semestre) ──
  // ── SUBJECTS (Período 26V02 — Datos reales SGA/SINU) ──
  const SUBJECTS = [
    { id: 'mat_especiales', code: 'DIS31', name: 'Matemáticas Especiales', group: '52247', icon: '🔢', color: 'hsl(263,70%,55%)', credits: 3, type: 'Ciencia Básica', professor: 'CORTES CRUZ JUAN SEBASTIAN', desc: 'Transformadas de Laplace, series de Fourier, funciones especiales, variable compleja, aplicaciones en ingeniería.', resources: ['https://www.khanacademy.org/math/differential-equations', 'https://ocw.mit.edu/courses/18-04-complex-variables-with-applications-spring-2018/'] },
    { id: 'calidad_sw', code: 'DIS32', name: 'Calidad del Software', group: '52278', icon: '⚙️', color: 'hsl(142,60%,45%)', credits: 3, type: 'Desarrollo de Software', desc: 'Testing, QA, estándares ISO, métricas de calidad, pruebas unitarias, integración continua, cobertura de código.', resources: ['https://www.freecodecamp.org/learn/quality-assurance/', 'https://refactoring.guru/'] },
    { id: 'admin_bd', code: 'DIS33', name: 'Administración de Bases de Datos', group: '52291', icon: '🗄️', color: 'hsl(35,90%,55%)', credits: 3, type: 'Desarrollo de Software', desc: 'DBA, optimización de queries, índices, backup/recovery, seguridad, replicación, administración de servidores.', resources: ['https://www.w3schools.com/sql/', 'https://sqlbolt.com/'] },
    { id: 'ing_web', code: 'DIS34', name: 'Ingeniería Web', group: '52211', icon: '🌐', color: 'hsl(200,80%,50%)', credits: 3, type: 'Desarrollo de Software', professor: 'BECERRA RAMIREZ HEYNER LEONEL', desc: 'Arquitectura web, APIs REST, frameworks frontend/backend, despliegue, seguridad web, patrones MVC.', resources: ['https://developer.mozilla.org/en-US/docs/Learn', 'https://www.freecodecamp.org/learn/back-end-development-and-apis/'] },
    { id: 'redes', code: 'DIS35', name: 'Redes Inalámbricas', group: '52226', icon: '📡', color: 'hsl(172,60%,45%)', credits: 3, type: 'Telecomunicaciones', desc: 'WiFi, Bluetooth, 5G, protocolos inalámbricos, seguridad wireless, IoT, configuración de redes.', resources: ['https://www.netacad.com/', 'https://www.coursera.org/learn/computer-networking'] },
    { id: 'inv_ciencia', code: 'DIS36', name: 'Inv. Ciencia y Tecnología', group: '52218', icon: '🔬', color: 'hsl(320,60%,50%)', credits: 3, type: 'Investigación', professor: 'CORTES TOBAR DARIO FERNANDO', desc: 'Metodología de investigación, estado del arte, formulación de proyectos, artículos científicos, normas APA.', resources: ['https://scholar.google.com/', 'https://www.scielo.org/'] },
    { id: 'english_beginner', code: 'A1I01', name: 'Virtual English - Beginner 1', group: '50608', icon: '🇺🇸', color: 'hsl(45,85%,50%)', credits: 0, type: 'Idiomas (IV001)', professor: 'CINDY PAOLA MORENO', desc: 'Inglés nivel A1: presentaciones, vocabulario básico, gramática elemental, listening y speaking.', resources: ['https://www.duolingo.com/', 'https://www.bbc.co.uk/learningenglish/'] },
    { id: 'placement_test', code: 'CE1026', name: 'Placement Test BE Plus', group: '5TB01', icon: '📝', color: 'hsl(15,70%,50%)', credits: 0, type: 'Idiomas (IV002)', desc: 'Test de ubicación para determinar nivel de inglés en el programa BE Plus de la CUN.', resources: ['https://cdigital.cun.edu.co/'] },
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
    '26V02': { label: 'Período 26V02', academic: { start: '2026-03-30', end: '2026-07-19' }, block1: { start: '2026-03-30', end: '2026-05-24', label: 'Primer Bloque' }, block2: { start: '2026-05-25', end: '2026-07-19', label: 'Segundo Bloque' } },
    '26V03': { label: 'Período 26V03', academic: { start: '2026-05-25', end: '2026-09-27' }, block1: { start: '2026-05-25', end: '2026-07-19', label: 'Primer Bloque' }, block2: { start: '2026-07-20', end: '2026-09-27', label: 'Segundo Bloque' } },
    '26V04': { label: 'Período 26V04', academic: { start: '2026-08-03', end: '2026-11-22' }, block1: { start: '2026-08-03', end: '2026-09-27', label: 'Primer Bloque' }, block2: { start: '2026-09-28', end: '2026-11-22', label: 'Segundo Bloque' } },
    '26V05': { label: 'Período 26V05', academic: { start: '2026-09-28', end: '2027-01-17' }, block1: { start: '2026-09-28', end: '2026-11-22', label: 'Primer Bloque' }, block2: { start: '2026-11-23', end: '2027-01-17', label: 'Segundo Bloque' } },
    '26V06': { label: 'Período 26V06', academic: { start: '2026-11-23', end: '2027-03-28' }, block1: { start: '2026-11-23', end: '2027-01-17', label: 'Primer Bloque' }, block2: { start: '2027-01-18', end: '2027-03-28', label: 'Segundo Bloque' } },
  };

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
    { day: 'Martes-Miércoles', tasks: ['Trabajar en tareas P0 y P1', 'Estudiar contenido teórico (Mat. Especiales, Calidad SW, Inv. Ciencia)', 'Coordinar encuentros sincrónicos'] },
    { day: 'Jueves-Viernes', tasks: ['Completar talleres y laboratorios (Admin BD, Ing. Web, Redes)', 'Participar en foros de discusión', 'Avanzar en proyectos y entregas'] },
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

  // ── RENDER: SUBJECT CARDS (dashboard) ──
  function renderSubjectCards() {
    const el = document.getElementById('subjectCards');
    if (!el) return;
    const tasks = getTasks();
    el.innerHTML = SUBJECTS.map(s => {
      const subjTasks = tasks.filter(t => t.subj === s.id);
      const done = subjTasks.filter(t => t.done).length;
      const total = subjTasks.length;
      const pct = total > 0 ? Math.round(done / total * 100) : 0;
      const pending = subjTasks.filter(t => !t.done).length;
      const urgent = subjTasks.filter(t => !t.done && ['p0','p1'].includes(getTaskPriority(t))).length;
      return `<div class="subj" onclick="SYS.showTaskGuide('${s.id}')">
        <div class="subj-icon" style="background:${s.color}22;border:1px solid ${s.color}33">${s.icon}</div>
        <div class="subj-body">
          <div class="subj-name">${s.name}</div>
          <div class="subj-meta">${s.credits} créditos · ${s.type}${pending > 0 ? ` · <strong>${pending} pendiente${pending !== 1 ? 's' : ''}</strong>` : ''}${urgent > 0 ? ` · <span style="color:var(--rd)">${urgent} urgente${urgent !== 1 ? 's' : ''}</span>` : ''}</div>
          <div class="pbar"><div class="pbar-fill pbar-vi" style="width:${pct}%"></div></div>
        </div>
        <div class="subj-right">
          <div class="subj-pct" style="color:${pct === 100 ? 'var(--gn)' : 'var(--vi2)'}">${pct}%</div>
        </div>
      </div>`;
    }).join('');
  }

  // ── RENDER: SUBJECT DETAIL (Tab 1) ──
  function renderSubjectDetail() {
    const el = document.getElementById('subjectDetail');
    if (!el) return;
    const tasks = getTasks();
    el.innerHTML = SUBJECTS.map(s => {
      const subjTasks = tasks.filter(t => t.subj === s.id);
      const done = subjTasks.filter(t => t.done).length;
      const total = subjTasks.length;
      const pct = total > 0 ? Math.round(done / total * 100) : 0;
      return `<div class="gc">
        <div class="gc-h">
          <div class="gc-t"><span style="font-size:20px">${s.icon}</span> ${s.name}</div>
          <span class="sem sem-p3" style="font-size:10px">${s.credits} créditos</span>
        </div>
        <p style="font-size:12px;color:var(--t2);margin-bottom:12px">${s.desc}</p>
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
          <div class="pbar" style="flex:1"><div class="pbar-fill pbar-vi" style="width:${pct}%"></div></div>
          <span style="font-family:'IBM Plex Mono',monospace;font-size:12px;color:var(--vi2)">${pct}% (${done}/${total})</span>
        </div>
        <div style="font-size:11px;color:var(--t3);margin-bottom:8px">Área: ${s.type}</div>
        ${subjTasks.length > 0 ? `<div style="margin-bottom:10px">
          ${subjTasks.map(t => `<div class="atask">
            <div class="atask-check${t.done ? ' done' : ''}" onclick="SYS.toggleTask(${t.id})">${t.done ? '✓' : ''}</div>
            <span class="atask-text${t.done ? ' crossed' : ''}">${esc(t.text)}</span>
            ${t.due ? `<span class="atask-due">${formatDate(t.due)}</span>` : ''}
            <button class="atask-del" onclick="SYS.deleteTask(${t.id})">✕</button>
          </div>`).join('')}
        </div>` : ''}
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          ${s.resources.map(r => `<a href="${r}" target="_blank" rel="noopener" style="font-size:10px;padding:4px 8px;background:var(--vg);border:1px solid rgba(124,58,237,.15);border-radius:6px;color:var(--vi2);text-decoration:none;transition:all .2s">📎 ${new URL(r).hostname.replace('www.','')}</a>`).join('')}
        </div>
      </div>`;
    }).join('');
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

  // ── RENDER: NEXT ACTIONS ──
  function renderNextActions() {
    const el = document.getElementById('nextActions');
    if (!el) return;
    const period = detectPeriod();
    const cal = CALENDAR[period] || CALENDAR['26V01'];
    const today = todayStr();
    const tasks = getTasks().filter(t => !t.done);
    const urgentCount = tasks.filter(t => ['p0','p1'].includes(getTaskPriority(t))).length;

    let blockStatus = '';
    if (cal.block1 && today >= cal.block1.start && today <= cal.block1.end) {
      const daysLeft = daysBetween(today, cal.block1.end);
      blockStatus = `Estás en el <strong>Primer Bloque</strong>. Quedan <strong>${daysLeft} días</strong> para el cierre.`;
    } else if (cal.block2 && today >= cal.block2.start && today <= cal.block2.end) {
      const daysLeft = daysBetween(today, cal.block2.end);
      blockStatus = `Estás en el <strong>Segundo Bloque</strong>. Quedan <strong>${daysLeft} días</strong> para el cierre.`;
    } else {
      blockStatus = 'Período entre bloques o fuera del rango académico.';
    }

    const tips = [];
    if (urgentCount > 0) tips.push(`⚠️ Tienes <strong>${urgentCount} tarea${urgentCount > 1 ? 's' : ''} urgente${urgentCount > 1 ? 's' : ''}</strong>. Resuélvelas primero.`);
    if (tasks.length === 0) tips.push('✅ No tienes tareas pendientes. Revisa <a href="https://cdigital.cun.edu.co/course/view.php?id=28494" target="_blank" style="color:var(--vi2)">CUN Digital</a> para nuevas actividades.');
    tips.push('📡 Revisa el aula virtual regularmente para no perder entregas.');
    tips.push('🏆 Considera obtener una certificación AWS o Azure para destacar en tu perfil profesional.');

    el.innerHTML = `
      <div class="gc-t" style="margin-bottom:12px">⚡ Estado Actual & Recomendaciones</div>
      <div style="padding:10px 14px;background:var(--vg);border:1px solid rgba(124,58,237,.15);border-radius:8px;font-size:12px;color:var(--vi2);margin-bottom:10px">
        📅 ${blockStatus}
      </div>
      ${tips.map(t => `<div style="padding:8px 0;font-size:12px;color:var(--t2);border-bottom:1px solid rgba(255,255,255,.03)">${t}</div>`).join('')}
      <div style="margin-top:12px;padding:10px 14px;background:var(--eg);border:1px solid rgba(16,185,129,.15);border-radius:8px;font-size:12px;color:var(--em)">
        💡 <strong>Tip de carrera:</strong> Con 8vo semestre, enfócate en proyectos reales para tu portafolio. Integra las certificaciones cloud con tus materias de Redes y Base de Datos para un perfil competitivo.
      </div>
    `;
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

    let heroMsg, heroSub, heroAction;
    if (isPreSemester) {
      heroMsg = `⏳ El semestre inicia en ${daysToStart} día${daysToStart!==1?'s':''}`;
      heroSub = 'Período 26V02 · Bloque 1: 30 Mar — 24 May. Usa este tiempo para prepararte.';
      heroAction = `<div style="margin-top:8px;padding:8px 12px;background:rgba(234,179,8,.08);border:1px solid rgba(234,179,8,.2);border-radius:8px;font-size:11px;color:var(--am)">
        <strong>⚠️ EN PROGRESO:</strong> Completar curso <strong>"Inducción TICS - Estudiantes"</strong> en CUN Digital (14% completado, 7 secciones).
        <a href="https://cdigital.cun.edu.co/course/view.php?id=28494" target="_blank" style="color:var(--cy);font-weight:600;margin-left:4px">Ir al curso →</a>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">
        <a href="#" onclick="showTab(6);return false" style="font-size:11px;padding:6px 12px;background:var(--vi);color:#fff;border-radius:6px;text-decoration:none;font-weight:600">🔄 Abrir Portales CUN</a>
        <a href="#" onclick="showTab(1);return false" style="font-size:11px;padding:6px 12px;background:var(--el);color:var(--t2);border:1px solid var(--bd);border-radius:6px;text-decoration:none">📚 Ver Materias</a>
        <a href="https://cdigital.cun.edu.co/my/" target="_blank" style="font-size:11px;padding:6px 12px;background:var(--el);color:var(--t2);border:1px solid var(--bd);border-radius:6px;text-decoration:none">🎓 CUN Digital</a>
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

  // ── RENDER: SUBJECT HEALTH (Compact Visual Grid) ──
  function renderSubjectHealth() {
    const el = document.getElementById('subjectHealth');
    if (!el) return;
    const tasks = getTasks();

    el.innerHTML = SUBJECTS.map(s => {
      const subjTasks = tasks.filter(t => t.subj === s.id);
      const done = subjTasks.filter(t => t.done).length;
      const total = subjTasks.length;
      const pending = subjTasks.filter(t => !t.done).length;
      const overdue = subjTasks.filter(t => !t.done && t.due && daysBetween(todayStr(), t.due) < 0).length;
      const urgent = subjTasks.filter(t => !t.done && ['p0','p1'].includes(getTaskPriority(t))).length;

      // Health status
      let status, statusColor, statusBg;
      if (overdue > 0) { status = '🔴 ATRASADO'; statusColor = 'var(--rd)'; statusBg = 'rgba(239,68,68,.08)'; }
      else if (urgent > 0) { status = '🟠 URGENTE'; statusColor = 'var(--or)'; statusBg = 'rgba(249,115,22,.08)'; }
      else if (pending > 0) { status = '🟡 AL DÍA'; statusColor = 'var(--am)'; statusBg = 'rgba(234,179,8,.06)'; }
      else if (done > 0) { status = '✅ COMPLETO'; statusColor = 'var(--gn)'; statusBg = 'rgba(34,197,94,.06)'; }
      else { status = '⬜ SIN TAREAS'; statusColor = 'var(--t3)'; statusBg = 'var(--el)'; }

      const pct = total > 0 ? Math.round(done / total * 100) : 0;

      return `<div onclick="SYS.showTaskGuide('${s.id}')" style="background:var(--c1);border:1px solid var(--bd);border-radius:10px;padding:12px;cursor:pointer;transition:all .2s;border-left:3px solid ${s.color}" onmouseover="this.style.borderColor='${s.color}'" onmouseout="this.style.borderColor='var(--bd)'">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <div style="display:flex;align-items:center;gap:6px">
            <span style="font-size:16px">${s.icon}</span>
            <span style="font-size:12px;font-weight:600">${s.name}</span>
          </div>
          <span style="font-size:9px;font-weight:700;padding:2px 7px;border-radius:4px;background:${statusBg};color:${statusColor}">${status}</span>
        </div>
        <div style="display:flex;gap:4px;align-items:center;margin-bottom:4px">
          <div style="flex:1;background:var(--el);border-radius:3px;height:5px;overflow:hidden">
            <div style="width:${pct}%;height:100%;background:${s.color};border-radius:3px;transition:width .5s"></div>
          </div>
          <span style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--t3);min-width:30px;text-align:right">${pct}%</span>
        </div>
        <div style="font-size:10px;color:var(--t3)">${s.credits} cr · ${s.type}${pending ? ' · <strong style=\"color:'+statusColor+'\">'+pending+' pendiente'+(pending!==1?'s':'')+'</strong>' : ''}</div>
      </div>`;
    }).join('');
  }

  // ── RENDER: STUDY PLAN ──
  function renderStudyPlan() {
    const el = document.getElementById('studyPlan');
    if (!el) return;
    const tasks = getTasks().filter(t => !t.done);
    const today = new Date();
    const dayNames = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

    // Group tasks by due date into next 7 days
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayTasks = tasks.filter(t => t.due === dateStr);
      const isToday = i === 0;
      days.push({ date: dateStr, label: isToday ? '📌 HOY' : dayNames[d.getDay()], day: d.getDate(), month: d.getMonth()+1, tasks: dayTasks, isToday });
    }

    // Also get overdue
    const overdue = tasks.filter(t => t.due && daysBetween(todayStr(), t.due) < 0);

    // Unscheduled
    const unscheduled = tasks.filter(t => !t.due);

    // Build recommendations based on subjects without tasks
    const activeSubjIds = new Set(tasks.map(t => t.subj));
    const neglected = SUBJECTS.filter(s => !activeSubjIds.has(s.id) && s.credits > 0);

    let html = '';

    if (overdue.length > 0) {
      html += `<div style="background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.15);border-radius:8px;padding:10px 12px;margin-bottom:8px">
        <div style="font-size:11px;font-weight:700;color:var(--rd);margin-bottom:4px">⚠️ VENCIDAS — Resolver primero</div>
        ${overdue.map(t => {
          const subj = SUBJECTS.find(s => s.id === t.subj);
          return `<div style="font-size:11px;color:var(--t2);padding:2px 0">${subj?.icon||'📌'} ${esc(t.text)} <span style="color:var(--rd);font-size:10px">(vencida ${formatDate(t.due)})</span></div>`;
        }).join('')}
      </div>`;
    }

    html += days.map(d => {
      if (d.tasks.length === 0 && !d.isToday) return '';
      const border = d.isToday ? 'border-left:3px solid var(--vi)' : 'border-left:3px solid var(--bd)';
      return `<div style="background:var(--el);border:1px solid var(--bd);border-radius:8px;padding:10px 12px;margin-bottom:4px;${border}">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:${d.tasks.length?'6':'0'}px">
          <span style="font-size:11px;font-weight:600;color:${d.isToday?'var(--vi2)':'var(--tx)'}">${d.label} · ${d.day}/${d.month}</span>
          <span style="font-size:10px;color:var(--t3)">${d.tasks.length} tarea${d.tasks.length!==1?'s':''}</span>
        </div>
        ${d.tasks.length > 0 ? d.tasks.map(t => {
          const subj = SUBJECTS.find(s => s.id === t.subj);
          return `<div style="font-size:11px;color:var(--t2);padding:2px 0;display:flex;align-items:center;gap:4px">
            <span class="atask-check" onclick="SYS.toggleTask(${t.id})" style="width:14px;height:14px;min-width:14px"></span>
            ${subj?.icon||'📌'} ${esc(t.text)}
          </div>`;
        }).join('') : d.isToday ? '<div style="font-size:11px;color:var(--t3);padding:2px 0">Sin tareas programadas para hoy</div>' : ''}
      </div>`;
    }).filter(Boolean).join('');

    if (neglected.length > 0) {
      html += `<div style="background:rgba(234,179,8,.04);border:1px solid rgba(234,179,8,.12);border-radius:8px;padding:10px 12px;margin-top:8px">
        <div style="font-size:11px;font-weight:700;color:var(--am);margin-bottom:4px">💡 Materias sin tareas — agrega actividades</div>
        ${neglected.map(s => `<div style="font-size:11px;color:var(--t2);padding:2px 0">${s.icon} ${s.name} <span style="color:var(--t3)">— ${s.credits} cr, ${s.type}</span></div>`).join('')}
      </div>`;
    }

    el.innerHTML = html || '<div style="text-align:center;padding:16px;color:var(--t3);font-size:12px">Sin tareas programadas esta semana. ¡Agrega tareas desde el formulario abajo!</div>';
  }

  function render() {
    renderStats();
    renderActionNow();
    renderSubjectHealth();
    renderStudyPlan();
    renderSemaphore();
    renderSubjectCards();
    renderSubjectDetail();
    renderCalendar();
    renderQuickAccess();
    renderMalla();
    renderCerts();
    renderNextActions();
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

    // Add sample tasks if first time
    if (getTasks().length === 0) {
      const sampleTasks = [
        { id: 1, text: 'Revisar material Bloque 1 — Matemáticas Especiales (DIS31)', subj: 'mat_especiales', priority: 'p1', due: '2026-04-05', done: false, created: todayStr() },
        { id: 2, text: 'Estudiar transformadas y series para primer corte', subj: 'mat_especiales', priority: 'p2', due: '2026-04-15', done: false, created: todayStr() },
        { id: 3, text: 'Revisar estándares de calidad ISO para entrega', subj: 'calidad_sw', priority: 'p1', due: '2026-04-03', done: false, created: todayStr() },
        { id: 4, text: 'Configurar entorno de pruebas unitarias — proyecto QA', subj: 'calidad_sw', priority: 'p2', due: '2026-04-12', done: false, created: todayStr() },
        { id: 5, text: 'Práctica de optimización de queries SQL — Admin BD', subj: 'admin_bd', priority: 'p2', due: '2026-04-08', done: false, created: todayStr() },
        { id: 6, text: 'Desarrollar proyecto web con API REST — Ingeniería Web', subj: 'ing_web', priority: 'p2', due: '2026-04-20', done: false, created: todayStr() },
        { id: 7, text: 'Revisar HTML/CSS/JS y frameworks para quiz', subj: 'ing_web', priority: 'p1', due: '2026-04-01', done: false, created: todayStr() },
        { id: 8, text: 'Laboratorio de configuración WiFi empresarial', subj: 'redes', priority: 'p3', due: '2026-04-20', done: false, created: todayStr() },
        { id: 9, text: 'Revisar protocolos wireless y seguridad para quiz', subj: 'redes', priority: 'p1', due: '2026-04-02', done: false, created: todayStr() },
        { id: 10, text: 'Definir tema y estado del arte — Investigación', subj: 'inv_ciencia', priority: 'p2', due: '2026-04-10', done: false, created: todayStr() },
        { id: 11, text: 'Completar actividad de inducción — English Beginner', subj: 'english_beginner', priority: 'p3', due: '2026-04-18', done: false, created: todayStr() },
        { id: 12, text: 'Realizar Placement Test BE Plus', subj: 'placement_test', priority: 'p2', due: '2026-04-05', done: false, created: todayStr() },
      ];
      saveTasks(sampleTasks);
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
    calidad_sw: {
      platform: 'CUN Digital (Moodle)',
      courseUrl: 'https://cdigital.cun.edu.co/',
      howToAccess: 'CUN Digital → Mis cursos → Calidad del Software (DIS32, Grupo 52278)',
      evidenceType: 'Documentos de QA, casos de prueba, reportes de testing, participación en foros',
      submitMethod: 'Subir documentos en Moodle. Foros de discusión se responden directamente en la plataforma.',
      tips: [
        'Lee los estándares ISO 9126 y ISO 25010 — son base de esta materia',
        'Practica creando casos de prueba con formato profesional',
        'Los foros suelen tener fecha límite — participa ANTES del cierre',
        'Usa herramientas como Selenium o JUnit para prácticas de testing'
      ],
      weeklySteps: [
        { title: 'Revisa el aula virtual', desc: 'CUN Digital → Calidad del Software. Verifica nuevas actividades, foros y materiales.', action: 'Cada lunes' },
        { title: 'Estudia la teoría QA', desc: 'Lee sobre testing, métricas de calidad, estándares ISO, y tipos de pruebas (unitarias, integración, aceptación).', action: 'Martes-Miércoles' },
        { title: 'Desarrolla la actividad', desc: 'Crea documentos de planes de prueba, matrices de trazabilidad o reportes según lo que pida el profesor.', action: 'Jueves-Viernes' },
        { title: 'Sube tu entrega', desc: 'Actividad → "Agregar entrega" → Sube PDF/Word → "Guardar cambios". Para foros: escribe tu participación directamente.', action: 'Antes del deadline' },
        { title: 'Revisa retroalimentación', desc: 'El profesor puede dejar comentarios en tu entrega. Revísalos para mejorar en la siguiente actividad.', action: 'Después de calificación' }
      ]
    },
    admin_bd: {
      platform: 'CUN Digital (Moodle)',
      courseUrl: 'https://cdigital.cun.edu.co/',
      howToAccess: 'CUN Digital → Mis cursos → Administración de Bases de Datos (DIS33, Grupo 52291)',
      evidenceType: 'Scripts SQL, capturas de pantalla de resultados, documentos de diseño de BD',
      submitMethod: 'Subir archivos .sql, PDFs con capturas, o documentos Word en la actividad de Moodle.',
      tips: [
        'Instala MySQL/PostgreSQL o usa un entorno online como db-fiddle.com',
        'Siempre incluye capturas de pantalla de tus queries ejecutándose correctamente',
        'Practica con SQLBolt (sqlbolt.com) para reforzar conceptos',
        'Nombra tus archivos: "BarrosTorres_Taller1_AdminBD.pdf"'
      ],
      weeklySteps: [
        { title: 'Revisa el aula virtual', desc: 'CUN Digital → Admin. Bases de Datos. Verifica actividades de la semana: talleres SQL, laboratorios, foros.', action: 'Cada lunes' },
        { title: 'Estudia teoría DBA', desc: 'Optimización de queries, índices, backup/recovery, replicación, seguridad de bases de datos.', action: 'Martes' },
        { title: 'Practica con SQL', desc: 'Ejecuta los ejercicios en tu SGBD local o en db-fiddle.com. Captura pantalla de cada resultado.', action: 'Miércoles-Jueves' },
        { title: 'Arma tu entrega', desc: 'Crea un PDF con: portada, desarrollo, scripts SQL, capturas de resultados, y conclusiones.', action: 'Viernes' },
        { title: 'Sube a Moodle', desc: 'Actividad → "Agregar entrega" → Sube tu PDF → "Guardar cambios".', action: 'Antes del deadline' }
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
    redes: {
      platform: 'CUN Digital (Moodle)',
      courseUrl: 'https://cdigital.cun.edu.co/',
      howToAccess: 'CUN Digital → Mis cursos → Redes Inalámbricas (DIS35, Grupo 52226)',
      evidenceType: 'Informes de laboratorio, configuraciones de red, capturas de Packet Tracer/simuladores',
      submitMethod: 'Subir PDF con informe + capturas en Moodle. Archivos de simulación (.pkt) si aplica.',
      tips: [
        'Instala Cisco Packet Tracer para las simulaciones de red',
        'Toma capturas de CADA paso de configuración — los profesores quieren ver el proceso',
        'Estudia los protocolos: WiFi (802.11), Bluetooth, 5G, seguridad WPA3',
        'Los laboratorios suelen tener pasos muy específicos — síguelos al pie de la letra'
      ],
      weeklySteps: [
        { title: 'Revisa el aula virtual', desc: 'CUN Digital → Redes Inalámbricas. Busca guías de laboratorio, quizzes y foros habilitados.', action: 'Cada lunes' },
        { title: 'Estudia la teoría', desc: 'Protocolos inalámbricos, WiFi empresarial, seguridad wireless, IoT, configuración de APs.', action: 'Martes' },
        { title: 'Realiza el laboratorio', desc: 'Abre Packet Tracer o el simulador indicado. Sigue la guía paso a paso. Captura pantalla de cada configuración.', action: 'Miércoles-Jueves' },
        { title: 'Redacta el informe', desc: 'PDF con: portada, objetivo, desarrollo paso a paso con capturas, resultados y conclusiones.', action: 'Viernes' },
        { title: 'Sube a Moodle', desc: 'Actividad → "Agregar entrega" → Sube PDF + archivo .pkt si aplica → "Guardar cambios".', action: 'Antes del deadline' }
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
  const CS_KEY = 'sys_class_sessions';
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
    const prompt = `CEREBRO: ANALIZA CLASE\nURL: ${url || '[pega la URL aquí]'}\nMateria: ${subjName}\n\nProtocolo:\n1. Abre la URL en Chrome MCP o extrae su contenido (título, descripción, transcript/captions).\n2. Busca en web qué temas cubre este tipo de clase de ${subjName} en la CUN.\n3. Genera informe estructurado:\n   - Resumen ejecutivo (qué se vio)\n   - Temas principales (lista)\n   - Qué debo hacer (actividades/tareas detectadas)\n   - Cómo y dónde entregar (evidencia, plataforma, método)\n   - Cuándo entregar (deadline si se menciona)\n4. Llama SYS.injectClassSession(data) en http://localhost:3456/systems.html con la estructura:\n   { url, subject_id: '${subj ? subj.id : ''}', subject_name: '${subjName}', date: 'YYYY-MM-DD', title, summary, topics:[], assignments:[{title,desc,due_date,submit_where,submit_how,evidence_type,moodle_url}], resources:[], status:'pending' }\n5. Confirma guardado y muestra el informe completo.`;
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

  return { addTask, toggleTask, deleteTask, bulkImport, exportData, importData, clearCompleted, render, showTaskGuide, closeGuide, injectClassSession, deleteClassSession, updateClassStatus, copyClassPrompt, toggleCS };
})();
