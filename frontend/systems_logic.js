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
    { id: 'mat_especiales', code: 'DIS31', name: 'Matemáticas Especiales', group: '52247', icon: '🔢', color: 'hsl(263,70%,55%)', credits: 3, type: 'Ciencia Básica', desc: 'Transformadas de Laplace, series de Fourier, funciones especiales, variable compleja, aplicaciones en ingeniería.', resources: ['https://www.khanacademy.org/math/differential-equations', 'https://ocw.mit.edu/courses/18-04-complex-variables-with-applications-spring-2018/'] },
    { id: 'calidad_sw', code: 'DIS32', name: 'Calidad del Software', group: '52278', icon: '⚙️', color: 'hsl(142,60%,45%)', credits: 3, type: 'Desarrollo de Software', desc: 'Testing, QA, estándares ISO, métricas de calidad, pruebas unitarias, integración continua, cobertura de código.', resources: ['https://www.freecodecamp.org/learn/quality-assurance/', 'https://refactoring.guru/'] },
    { id: 'admin_bd', code: 'DIS33', name: 'Administración de Bases de Datos', group: '52291', icon: '🗄️', color: 'hsl(35,90%,55%)', credits: 3, type: 'Desarrollo de Software', desc: 'DBA, optimización de queries, índices, backup/recovery, seguridad, replicación, administración de servidores.', resources: ['https://www.w3schools.com/sql/', 'https://sqlbolt.com/'] },
    { id: 'ing_web', code: 'DIS34', name: 'Ingeniería Web', group: '52211', icon: '🌐', color: 'hsl(200,80%,50%)', credits: 3, type: 'Desarrollo de Software', desc: 'Arquitectura web, APIs REST, frameworks frontend/backend, despliegue, seguridad web, patrones MVC.', resources: ['https://developer.mozilla.org/en-US/docs/Learn', 'https://www.freecodecamp.org/learn/back-end-development-and-apis/'] },
    { id: 'redes', code: 'DIS35', name: 'Redes Inalámbricas', group: '52226', icon: '📡', color: 'hsl(172,60%,45%)', credits: 3, type: 'Telecomunicaciones', desc: 'WiFi, Bluetooth, 5G, protocolos inalámbricos, seguridad wireless, IoT, configuración de redes.', resources: ['https://www.netacad.com/', 'https://www.coursera.org/learn/computer-networking'] },
    { id: 'inv_ciencia', code: 'DIS36', name: 'Inv. Ciencia y Tecnología', group: '52218', icon: '🔬', color: 'hsl(320,60%,50%)', credits: 3, type: 'Investigación', desc: 'Metodología de investigación, estado del arte, formulación de proyectos, artículos científicos, normas APA.', resources: ['https://scholar.google.com/', 'https://www.scielo.org/'] },
    { id: 'english_beginner', code: 'A1I01', name: 'Virtual English - Beginner 1', group: '50608', icon: '🇺🇸', color: 'hsl(45,85%,50%)', credits: 0, type: 'Idiomas (IV001)', desc: 'Inglés nivel A1: presentaciones, vocabulario básico, gramática elemental, listening y speaking.', resources: ['https://www.duolingo.com/', 'https://www.bbc.co.uk/learningenglish/'] },
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
    { day: 'Martes-Miércoles', tasks: ['Trabajar en tareas P0 y P1', 'Estudiar contenido teórico (Discretas, Álgebra, Ecuaciones)', 'Coordinar encuentros sincrónicos'] },
    { day: 'Jueves-Viernes', tasks: ['Completar talleres y laboratorios (Software, BD, Redes)', 'Participar en foros de discusión', 'Avanzar en Plan de Negocios II'] },
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
    for (const [id, cal] of Object.entries(CALENDAR)) {
      if (cal.academic && today >= cal.academic.start && today <= cal.academic.end) return id;
    }
    return '26V01';
  }

  function esc(s) {
    const el = document.createElement('div');
    el.textContent = s || '';
    return el.innerHTML;
  }

  // ── TASK MANAGEMENT ──
  function getTasks() { return db.get('tasks', []); }
  function saveTasks(t) { db.set('tasks', t); }

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
            <span style="font-size:10px;color:var(--t3)">${subjLabel}</span>
            ${dueLabel ? `<span class="atask-due">${dueLabel} · ${daysText}</span>` : ''}
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
      return `<div class="subj" onclick="showTab(1)">
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
  function render() {
    renderStats();
    renderSemaphore();
    renderSubjectCards();
    renderSubjectDetail();
    renderCalendar();
    renderQuickAccess();
    renderMalla();
    renderCerts();
    renderNextActions();
    renderCUNHub();
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
  function openCUNPortals() {
    const portals = [
      'https://360.cunapp.pro/#/estudiante/dashboard',
      'https://sigwt.cun.edu.co/sgacampus/#notr29',
      'https://cdigital.cun.edu.co/',
      'https://mail.google.com/mail/u/3/'
    ];
    portals.forEach((url, i) => setTimeout(() => window.open(url, '_blank'), i * 400));
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

  // Expose globally
  window.showTab = showTab;
  window.openCUNPortals = openCUNPortals;
  window.openSinglePortal = openSinglePortal;

  // Run on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { addTask, toggleTask, deleteTask, bulkImport, exportData, importData, clearCompleted, render };
})();
