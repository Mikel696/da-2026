# 🚀 Sistema DA-2026 — Guía de Despliegue en GitHub Pages (GRATIS)

## ¿Qué es esto?
Tu segundo cerebro para convertirte en Analista de Datos. App web completa que funciona
100% en el navegador, sin servidor, sin base de datos, sin costos.

---

## PASO A PASO PARA PUBLICARLO GRATIS

### 1. Crear cuenta en GitHub (si no tienes)
1. Ve a → https://github.com
2. Clic en "Sign up"
3. Username recomendado: `tu-nombre-da` (ej: `juan-data-analyst`)
4. Confirma tu email

### 2. Crear el repositorio
1. En GitHub, clic en el botón verde "+ New repository"
2. Nombre del repositorio: `da-2026` (exactamente así)
3. Selecciona: **Public** (obligatorio para GitHub Pages gratis)
4. NO marques "Initialize with README"
5. Clic en "Create repository"

### 3. Subir los archivos (Método más fácil — sin instalar nada)
1. En tu repositorio recién creado, clic en "uploading an existing file"
2. Arrastra y suelta TODOS los archivos y carpetas de esta carpeta:
   - `index.html`
   - `css/` (carpeta completa)
   - `js/` (carpeta completa)
   - `pages/` (carpeta completa)
3. En el mensaje de commit escribe: `Primera versión del sistema DA-2026`
4. Clic en "Commit changes"

### 4. Activar GitHub Pages
1. En tu repositorio, ve a **Settings** (pestaña superior)
2. En el menú lateral izquierdo, clic en **Pages**
3. En "Source" selecciona: **Deploy from a branch**
4. En "Branch" selecciona: **main** y carpeta **/ (root)**
5. Clic en **Save**
6. Espera 2-3 minutos

### 5. Tu URL pública
```
https://TU-USERNAME.github.io/da-2026/
```
Ejemplo: `https://juan-data-analyst.github.io/da-2026/`

---

## ACTUALIZAR EL SITIO

Para actualizar cualquier página:
1. Abre el archivo en GitHub (clic sobre él)
2. Clic en el ícono de lápiz ✏️ (Edit)
3. Haz los cambios
4. Clic en "Commit changes"
5. En 1-2 minutos se actualiza tu sitio

---

## RESPALDO DE TU PROGRESO

**El progreso se guarda en tu navegador (localStorage)**. Para no perderlo:
1. Ve a la página "Mi Perfil" en la app
2. Clic en "Exportar mi progreso (.json)"
3. Guarda el archivo en Google Drive o un lugar seguro
4. Para restaurar: "Importar progreso" y sube ese archivo

---

## OPCIÓN ALTERNATIVA: Netlify (aún más fácil)

1. Ve a → https://app.netlify.com
2. "Sign up" con tu cuenta de GitHub
3. Clic en "Add new site" → "Deploy manually"
4. Arrastra y suelta la carpeta `da-2026` completa
5. Tu sitio queda en línea en segundos con URL tipo: `random-name.netlify.app`

---

## PROMPT DE RECUPERACIÓN

Si pierdes este código o necesitas mejoras, usa este prompt con Claude:

```
Necesito que reconstruyas mi "Sistema DA-2026", una aplicación web multi-página 
(HTML/CSS/JS puro, sin frameworks) que funciona como segundo cerebro para 
convertirme en analista de datos empleable.

El sistema tiene estas páginas:
- index.html (Dashboard: stats, hack del día, prompt del día, palabra inglés)
- pages/ruta.html (Ruta 6 meses con checkboxes de progreso persistente)
- pages/sesion.html (Timer 70/20/10, notas guardables, log de sesión)
- pages/prompts.html (Biblioteca prompts + colección personal guardable)
- pages/ingles.html (Vocabulario, quiz interactivo, frases CV, frases entrevistas)
- pages/proyectos.html (3 proyectos portafolio con guía táctica)
- pages/tacticas.html (16 hacks de empleabilidad)
- pages/empleos.html (Tablero empleos + salarios LATAM)
- pages/recursos.html (Recursos gratuitos)
- pages/configurar.html (Perfil, export/import backup JSON, stats)

Stack: HTML/CSS/JS puro. LocalStorage namespace 'da2026_'. 
Diseño dark neon (--acid:#c8ff00, --sky:#38bfff, --mint:#00e5b0, --ember:#ff6b35).
Fuentes: Bricolage Grotesque + Fira Code + DM Sans.
Sistemas: XP/nivel, racha diaria, sesiones cronometradas, notas, mis prompts.
Datos en js/core.js: CURRICULUM (6 fases), HACKS (16), VOCAB (20), PROMPTS_DATA (8).
Deploy: GitHub Pages (gratis).

[Indica qué página o funcionalidad necesitas reconstruir o mejorar]
```

---

## ESTRUCTURA DE ARCHIVOS

```
da-2026/
├── index.html          ← Dashboard principal
├── css/
│   └── main.css        ← Todos los estilos
├── js/
│   ├── core.js         ← Motor central: datos, XP, progreso, storage
│   └── dashboard.js    ← Lógica específica del dashboard
└── pages/
    ├── ruta.html       ← Ruta curricular
    ├── sesion.html     ← Timer de estudio
    ├── prompts.html    ← Biblioteca de IA
    ├── ingles.html     ← Inglés técnico
    ├── proyectos.html  ← Proyectos de portafolio
    ├── tacticas.html   ← Hacks tácticos
    ├── empleos.html    ← Empleos y mercado
    ├── recursos.html   ← Recursos gratuitos
    └── configurar.html ← Perfil y backup
```
