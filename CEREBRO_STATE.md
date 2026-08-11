# ESTADO DEL CEREBRO DA-2026

- **Última actualización:** 2026-08-11
- **Estado global:** 🟢 PRODUCCIÓN — Todos los módulos críticos online en GitHub Pages
- **Live URL:** https://mikel696.github.io/da-2026/frontend/

---

## 🛟 INCIDENTE · Supabase pausado — pérdida total de sync durante horas — 2026-08-10/11

### Qué pasó
Login del Cerebro fallaba con `Failed to fetch` en todas las páginas. Diagnóstico por capas:
`mbuhlxypuvlxxylryjzi.supabase.co` daba **NXDOMAIN en Google 8.8.8.8, Cloudflare 1.1.1.1 y DNS-over-HTTPS**
(este último descarta el router del usuario, sospechoso histórico por el caso Claro). Control: `supabase.co`
resolvía bien y un proyecto inventado daba el mismo NXDOMAIN → Supabase no usa comodín.

**Causa raíz: el plan gratuito de Supabase pausa los proyectos tras ~1 semana sin actividad, y al pausarlos
les quita el registro DNS.** Desde afuera es indistinguible de un proyecto borrado — solo el panel lo aclara.
Diagnóstico inicial dijo "eliminado o pausado-y-retirado"; era pausado. Corregido al ver el dashboard.

### Resolución
Vía Chrome MCP sobre la sesión ya autenticada del usuario (sin ingresar credenciales): panel → el proyecto
existía, pausado, con **datos y backups intactos** y reanudable hasta el **2026-09-08**. Botón `Resume`
(la UI en español lo rotula "Proyecto de currículum", traducción rota de *Resume project*) → restauración.
Verificado tras completar: DNS → 104.18.38.10 · `/auth/v1/health` → GoTrue v2.195.0 · login con credenciales
falsas → `invalid_credentials` (o sea, el servidor responde) · `app_state` vía REST → 200.

### Lecciones
1. **El offline-first cumplió.** Con el backend muerto la app siguió 100% usable; no hay gate de sesión.
2. **La red de seguridad NO existía.** El backup de `pages/configurar.html` filtra por `da2026_` y ese
   namespace solo tiene ~10 keys legacy de `core.js` — los cuadernos, finanzas, notas y Simetrik usan keys
   crudas y **quedaban fuera del archivo**. El usuario respaldó con un script en consola: **111 keys · 4,8 MB**.
3. **Riesgo de cuota:** 4,8 MB está cerca del techo de localStorage y casi todo el código guarda con
   `try{...}catch{}` — un `QuotaExceededError` se tragaría en silencio. Pendiente medir.
4. Para que no se repita: abrir el Cerebro al menos una vez por semana, o pasar a Pro.

### Pendiente
Arreglar `exportBackup` (Fase 3 del pase de seguridad, ver PROJECT.P1) · backup del segundo PC · medir cuota.

---

## 💰 12-FIN · Fase 1 · Centro Financiero — pulso macro de Colombia — 2026-08-11 (commit 586d452)

### Qué cambió
12-FIN pasa de registro de gastos a **centro financiero de 8 secciones**. Fase 1 entrega el shell + la
sección **Hoy** viva. Las 6 secciones sin construir declaran su fase real en vez de mostrar UI vacía o falsa.

### Investigación previa (24 endpoints probados con curl, headers CORS incluidos)
Sirven directo desde el navegador sin llave: **datos.gov.co (Socrata)** · **Banrep mercado cambiario**
(dólar intradía) · **CoinGecko** · **Binance** · **Banco Mundial** · **SEC data.sec.gov**.
Con llave gratuita y CORS abierto: **Finnhub** (60/min) · **Twelve Data** (800/día).
Descartados: **Yahoo Finance** (429) · **Alpha Vantage** (solo 25/día).
Hallazgos de alto valor para fases siguientes: **FIC de Superfinanciera** (`qhpu-8ixx`, 2,88M filas, corte
diario, con `rentabilidad_anual` por fondo) · **tasas de captación** (`axk9-g2nh`) y **colocación**
(`yvb2-ppaa`) banco por banco · **SECOP II** (`p6dx-8zbt`) para contratación pública.

### `js/fin-colombia.js` (NUEVO · IIFE `FINCO`)
- **Banrep `DataSerie`**: TRM, tasa de política, IBR, inflación, PIB, desempleo y cuenta corriente con serie
  histórica **en una sola llamada**. No expone CORS → pasa por el proxy de allorigins que ya usa 7-NEW.
- **datos.gov.co** (CORS abierto, sin llave) es la fuente **primaria** de la TRM y el respaldo si el proxy cae.
  Las dos fuentes son independientes vía `Promise.allSettled`: si una falla, la otra igual entra.
- **Caché local 6 h.** Sin red muestra el último valor **con su fecha de corte**. Nunca estima ni rellena.
- **Ventana uniforme de 12 meses** con el período real impreso junto al %. Sin esto un `+35%` al lado de la
  inflación medía 5 años mientras el de la TRM medía 3 meses — el mismo vicio del número sin contexto.
- Series negativas (cuenta corriente) informan **diferencia en puntos**, no % sobre base negativa.
- **Cada tarjeta cita su fuente verdadera**: la TRM dice datos.gov.co, no Banrep.
- Semáforo de inflación: el usuario mete la tasa de su producto y ve el **rendimiento real** descontada la
  inflación. Miniaturas SVG a mano, sin librerías.

### Infra compartida
`cloud-sync.js` → `fin_mkt_cache` y `fin_ui_prefs` a **SKIP_KEYS**: empiezan por `fin_` y `DYNAMIC_PREFIXES`
los habría subido solos a Supabase (cientos de KB regenerados cada 6 h, no dato del usuario).
**Verificado por comportamiento**, no por lectura de código: al escribirlas NO entran a la outbox; `fin_my_rate` sí.
Cache-bust `cloud-sync p15 → p16` en las 19 páginas (el motor debe ir en lockstep — causa del clobber de julio).

### Verificación en preview
7/7 series en vivo con `errors: []` · navegación entre las 8 secciones · **Mi plata intacta** (5 tabs, KPIs,
formulario, meta de ahorro) · calculadora real (9,5% nominal → **+3,47% real** con inflación 6,03%) ·
**sin regresión en 13-NOT, 14-WORK, 10-SYS y 1-IND** (namespaces vivos, 0 recursos locales fallidos, todos en p16).
Desplegado y confirmado en vivo: `fin-colombia.js` → 200, `finance.html` sirve p16 + las 8 secciones.

### 🔥 Fallo en PRODUCCIÓN y su arreglo (commits 15e183d + 0abd902)
El preview local pasó verde, pero **el live site salió con 1 de 7 indicadores**. Medido:
`allorigins` responde **200 sin cabecera `Origin`** (curl) y **522 con `Origin: mikel696.github.io`**
(navegador). Banrep directo: 200. → **un proxy público gratuito no puede sostener el camino crítico.**

**Fix (adelantado de la Fase 4):**
- `scripts/fetch-macro.mjs` — trae Banrep + datos.gov.co del lado **servidor** (sin CORS de por medio) y deja
  `frontend/data/macro-co.json` (26 KB · 7 series · ~400 puntos). Sin dependencias. Si NINGUNA fuente responde
  sale con código 1 y **preserva la foto anterior** en vez de escribir basura.
- `.github/workflows/macro-snapshot.yml` — cron diario 11:20 UTC (06:20 CO, tras publicarse la TRM) + disparo
  manual. Solo commitea si el archivo cambió.
- **Nuevo orden de carga**, de lo más confiable a lo más fresco: (1) foto del repo — mismo origen, imposible
  que falle si la página cargó; (2) datos.gov.co directo, refresca la TRM del día; (3) proxy del Banrep, que
  pasa a ser *mejor si está*. **Que el proxy falle ya no es una falla del panel.** El subtítulo declara el
  origen real: «al minuto» o «Foto del \<fecha\>».
- **TTL según salud del caché**: 6 h si la carga fue completa, **15 min si quedó parcial**. Sin esto, quien
  visitara durante una caída se quedaba con el panel degradado 6 horas aunque la fuente se recuperara enseguida.
  Un caché sin `snapshotAt` (motor anterior) también cuenta como degradado → se cura solo, sin limpiar nada.

**Verificado en el live site**, no en preview: rompiendo a propósito allorigins Y datos.gov.co → 7/7 indicadores
siguen visibles · caché envenenado de hace 30 min → se cura solo a 7/7 · en la última corrida el proxy estaba
caído de verdad (`live:false`) y el panel salió completo desde la foto, rotulado con su fecha.

### Next
Fase 2 — comparador de CDT y de crédito por banco + screener de FIC **con filtros anti-espejismo por defecto**
(el ranking crudo pone primero un fondo forestal en liquidación con 1 574% anual y 12 inversionistas).
Fase 3 — global + radar SECOP. Fase 4 — laboratorio y muro de noticias.
La foto diaria ya quedó hecha acá; extenderla a más series (DTF, UVR, TES) es barato.

---

## 🎓 6-TOO · Coach de Ingeniería de Sistemas — 2026-07-16 (commit 6051e01)

### Qué es
6-TOO pasa de "Mantenimiento del PC" a **Hub central de Ingeniería de Sistemas**. Nueva página `pages/coach-sistemas.html` (standalone + da-strip/in-iframe) embebida como tab principal de tools.html, con el mantenimiento del PC intacto en sus tabs.

### Las 7 secciones (cada una anclada en un CASO REAL de Miguel)
1. **🌐 Redes** — el caso Claro del 14-jul (402 Mbps OK, culpable: DNS del ZTE F680) · analogía agenda de contactos · triage de 4 comandos de un NOC L1.
2. **🗄️ Bases de Datos** — ACA préstamos + Supabase del propio Cerebro + "conciliaciones Simetrik = JOINs" · SQL traducido a Excel.
3. **🕸️ Ing. Web** — da-2026 en producción como credencial · analogía restaurante · F12/Network como habilidad #1.
4. **✅ Calidad de SW** — el incidente del sync del 15-jul como lección viva (race condition, regresión, post-mortem) · pirámide de pruebas.
5. **📐 Mat. Especiales** — Fourier=licuado, complejos=coordenadas con giro, FFT en mantenimiento predictivo.
6. **🔬 Investigación** — el diagnóstico Claro mapeado al método científico · IMRyD · tie-in con 16-APA.
7. **🖥️ Hardware & SO** — su PC real (C: crítico, plan clon SN7100) · jerarquía de memoria como restaurante.

### Estructura por sección (formato para aprendiz visual)
Caso real (timeline) → analogía → diagrama de cajas → "un día en la empresa" (ticket del rol) → kit de comandos → checklist de dominio → ruta de recursos con badges (GRATIS/ES/EN/Empezá acá).

### Datos
- Progreso: `too_coach_v1` (40 logros, barra global + contador por sección). **Local-only por diseño** (precedente: work_learn_progress).
- 30 recursos externos verificados: NetAcad, Packet Tracer, Cloudflare Learning ES, Professor Messer (Net+/A+), NetworkChuck, SQLBolt, Kaggle Intro to SQL, pgexercises, W3Schools, MS Learn ES, freeCodeCamp ES, MDN ES, javascript.info, midudev, mouredev, ISTQB, Guru99, Ministry of Testing, 3Blue1Brown, El Traductor de Ingeniería, Khan ES, GeoGebra, Scholar, Zotero, Scribbr ES, Purdue OWL, CrystalDiskInfo, Ventoy, MemTest86.
- index.html: tarjeta 6-TOO → "Hub de Ingeniería de Sistemas".
- Verificado en preview: 7 secciones/40 checks/30 recursos, persistencia+progreso OK, tabs PC intactas, consola limpia.

### Next
Ingesta de nuevas materias como secciones · botón "copiar prompt de profundización" por sección · cruce con Vista HOY (pendiente PROJECT.P3).

---

## 🤫 SYNC INVISIBLE · deep-equal + difere durante tipeo — 2026-07-15 (commit 96c82c3)

### Queja real: "se refresca cada segundo, no me deja escribir"
Causa: (1) el detector de eco comparaba strings crudos — el mismo contenido con otro orden de claves parecía "cambio remoto" → write + evento + re-render tras CADA pausa de tipeo; (2) el guard de los módulos solo miraba `activeElement` en el instante del evento; (3) ping-pong con el otro PC = eventos entrantes continuos.

### Fix (cloud-sync.js p15 · aplica a todos los módulos)
- `_deepEqual` recursivo reemplaza todos los compares por string (eco realtime NB/no-NB, decisión de re-push del merge, content-compare del reconcile). Eco → alinear TS y NADA más.
- `_userIsEditing()`: foco en editor/input O tipeo hace <4s.
- Cola `_rtDeferred`: los cambios remotos que llegan mientras se edita NO tocan ni localStorage ni la UI; se aplican de una al quedar idle (flusher 2s). El poll de 45s también respeta la edición.
- Regla de oro implantada: **la sync jamás toca la pantalla mientras el usuario escribe — todo por debajo**.
- Tests preview: eco con orden distinto → 0 writes/0 eventos PASS · remoto durante tipeo → diferido, aplicado 1 vez al idle, merge unión conservado PASS.
- NOTA: el ping-pong muere del todo cuando AMBOS PCs cargan p15 (Ctrl+F5).

---

## 🛟 INCIDENTE + FIX · Pérdida de cuaderno por merge timestamp-only — 2026-07-15 (commit 0d82897)

### Qué pasó (diagnóstico en vivo vía Chrome MCP sobre el live site)
Miguel reportó que los cuadernos de materias de 10-SYS diferían entre sus 2 PCs. Comparé página por página este PC vs la nube (sesión real). Hallazgo:
- **`admin_bd`**: local 176KB/**21 img** (editado 10-jul) vs nube 118KB/9img (congelado 22-jun). **`calidad_sw`**: local 227KB/**21 img** (10-jul) vs nube 170KB/9img (22-jun). El resto igual.
- **Se presenció el clobber EN VIVO**: el otro PC (motor viejo, datos de junio) re-selló su versión pobre de `admin_bd` con fecha de HOY 15:36:52 y la subió. El merge estructural decide **solo por timestamp** → la versión más nueva pero más pobre GANÓ y **pisó la rica en este PC** (irreversible en ese momento). Al empujar `calidad_sw` rico a la nube, el otro PC lo revirtió en **3 segundos**.
- **Pérdida real**: el TEXTO rico de `admin_bd` (10-jul) se perdió (solo existía en este PC, sin backup previo). Imágenes probablemente rescatables del IDB (112 imágenes). `calidad_sw` quedó a salvo en este PC (+ backup manual `sys_notebook_bak_2026-07-15154518`).

### Causa raíz
`_mergeNbData` (y el LWW general) confían solo en `updated`. Un device viejo que re-guarda una versión pobre le pone timestamp nuevo → gana y destruye contenido rico, en silencio y sin recuperación. Además el motor viejo (whole-key LWW) del otro PC re-empuja su estado stale como reacción a cualquier cambio (ping-pong).

### Fix de raíz (commit 0d82897 · estándar para los 3 módulos de cuadernos)
- **Historial de versiones en IndexedDB** (`nb-shared.js`): store nuevo `nb_history` (DB v2→v3, conserva `attachments`+`images`). `nbDetectRegression()` marca cuando una versión pierde imágenes/páginas/>15% de texto. `snapshotNb/listNbHistory/restoreNbSnapshot` (cap 20 por key, en IDB para no competir por la cuota).
- **Guard anti-pérdida** (`cloud-sync.js`): `_nbGuardedWrite()` envuelve TODA sobrescritura de cuaderno vía sync (reconcile + realtime + forceResync). Si la entrante reduce contenido, **snapshotea la local rica ANTES de pisarla** y emite `cloud:nb_regression`. La pérdida ya nunca es permanente.
- **Badge**: estado `⚠ versión anterior guardada` + panel con "Versiones anteriores de cuadernos" (lista con resumen + Restaurar; el restore respalda la actual primero, reversible).
- Verificado en preview: detección (sin falso positivo en crecimiento), migración IDB, restore end-to-end, badge+panel. Cache-bust cloud-sync p14 / nb-shared p21 (VERSION p24).

### Recuperación pendiente (acción del usuario)
1. **Ctrl+F5 en ESTE PC** (carga motor p14/p21, migra IDB a v3).
2. **En el OTRO PC: Ctrl+F5** (o cerrar la pestaña) para que tome el motor nuevo y DEJE de re-subir la versión vieja — es la fuente del clobber.
3. Con el otro PC ya en el motor nuevo, en este PC: badge ☁ → **Sincronizar ahora** → sube `calidad_sw` rico; ya no lo revierten.
4. `admin_bd` texto: perdido (sin backup previo al incidente). Imágenes: rescatables del IDB si se quiere, en otra sesión.
5. Pendiente histórico (recomendado): en Supabase SQL → `alter publication supabase_realtime add table public.app_state;`

---

## ☁️ ESTÁNDAR DE SYNC DE CUADERNOS — 2026-07-15 (PROJECT.P3 CONT · commit 7108878)

### El problema reportado
"No veo en el otro PC ni lo que escribo ni las imágenes pegadas." Análisis a fondo del pipeline completo (push → app_state → pull → Storage).

### Causa raíz (triple)
1. **Imágenes nunca subían**: `retryPendingUploads` buscaba el blob solo en el store de ADJUNTOS de IDB; las HD de imágenes viven en STORE_IMG → cada `img_*` encolado (pegado estando deslogueado/offline o con fallo transitorio) se sacaba de la cola **sin subir jamás** a Storage. El otro PC no tenía de dónde bajarlas.
2. **Chips ciegos**: los chips nuevos no llevaban thumbnail inline — sin HD en Storage, el otro device veía un chip vacío (overlay en blanco).
3. **Cero visibilidad**: con sesión vencida/deslogueada NADA sube (queda en outbox) y no había señal visible fuera de work.html.

### El estándar implementado (aplica a los 3 módulos con cuadernos — comparten nb-shared + cloud-sync)
- **Retry de uploads arreglado**: fallback a STORE_IMG (getImage→File); solo descarta si el blob no existe en ningún store. Triggers: signed_in, online, carga, y cada 60s si hay cola.
- **Thumbnail inline `data-preview` (~320px, 3-10KB)** dentro del chip → viaja con el body por app_state → **la imagen se VE en cualquier device siempre**; la HD llega vía Storage al abrir el overlay (con fallback al preview + aviso claro si aún no subió).
- **`NBShared.reuploadMissingImages()`**: repara el HISTÓRICO — escanea los 3 stores de cuadernos, lista Storage (1 llamada) y sube las HD que el bug viejo dejó tiradas en el IDB de origen. Cableado al botón "Sincronizar ahora".
- **Badge ☁ universal (19 páginas)** abajo a la derecha: `✓ sincronizado` / `⏳ N cambios · M img` / `☁ sin sesión` / `🔒 sesión vencida`. Click → **panel doctor**: sesión, última sync, outbox, imágenes pendientes, realtime, memoria local + botones **Sincronizar ahora** (pull+push+outbox+imágenes+reparación) y **Traer de la nube** (merge estructural, no pisa local). API: `CLOUD.doctor()`, `CLOUD.syncNow()`.
- **Boot resilience**: si el pull inicial falla, retry con backoff (antes la página quedaba muda sin poll ni outbox hasta un reload) · recovery de JWT vencido también en el PULL · listener `online` · re-suscripción realtime cada 5 min.
- **Insert a prueba de todo**: si execCommand y el range fallan, `insertAdjacentHTML` — nunca más imagen guardada en IDB sin chip visible.

### Tests (preview local)
Paste→chip con preview dentro del body guardado PASS · retry conserva cola en fallo y sube desde STORE_IMG en éxito PASS · overlay fallback a thumbnail PASS · recuperación histórica PASS · badge+doctor en notes/work PASS · consolas limpias · node --check OK.

### ACCIÓN DEL USUARIO (para activar todo)
1. **Ctrl+F5 en ambos PCs** (toma cloud-sync p13 + nb-shared p20).
2. Mirar el **badge ☁** en ambos: si dice "sin sesión" → Iniciar sesión (causa #1 histórica de "no sincroniza").
3. En el PC donde se pegaron las imágenes: click badge → **Sincronizar ahora** (sube el histórico perdido).
4. Opcional (sync instantáneo tiempo real): en Supabase → SQL editor → `alter publication supabase_realtime add table public.app_state;` (pendiente desde 2026-06-11; sin esto el respaldo es el poll de 45s).

---

## 🛡️ WHOLE-PROJECT · Hardening cuadernos + sync + launcher — 2026-07-10 (PROJECT.P3 · commit 83b10df)

### Qué se hizo
Pasada integral de robustez sobre la infra compartida, con 3 bugs reales encontrados y arreglados (auditoría completa de cloud-sync.js 1117 líneas + stack de cuadernos):

1. **Carrera de autosave en cuadernos (pérdida de datos · 13-NOT/14-WORK/10-SYS)** — `openPage`/`newPage`/`deletePage`/`selectActive` movían `activePageId` sin flushear el timer de autosave de 500ms. El `focusout` cubría el tipeo, pero las mutaciones vía toolbar (insertar imagen/lista/code despachan `input` → autoSave debounced) se PERDÍAN si cambiabas de página en <500ms: el timer disparaba con el puntero nuevo y el guard descartaba el cambio. Fix: `_flushPending(nbId)` al entrar a las 4 operaciones, replicado idéntico en `notes-nb.js`, `work.js` y `systems_logic.js` (regla de paridad).
2. **Motor cloud-sync (3 goteras)** — (a) el flush de debounce al ocultar pestaña (`_flushPendingPushes`) pusheaba sin alinear TS local ni limpiar el outbox → contador fantasma "N sin subir" hasta 20s y re-descarga innecesaria en el lightPull; (b) el DELETE de realtime escribía el string `"null"` en localStorage (JSON.parse→null revienta `.length/.map` en módulos sin try/catch) → ahora `removeItem`; (c) `pushNow`/`forcePushKey`/`forcePushAll` no sacaban la key del outbox al confirmar.
3. **prompt() letal en 1-IND** — en primera visita (`sb_name` vacío) el prompt del nombre corría inline en el script del launcher; en entornos sin diálogos (sandbox/kiosk/automation) `prompt()` LANZA → moría TODO el script: sin rail, sin router Cerebro, sin stats. Fix: diferido 1.2s + try/catch (el nombre es cosmético; el launcher ya no depende de él). Repro confirmado en preview.

### Visual 1-IND
- +2 tarjetas que faltaban en el grid de módulos: 🗺️ Mind Map Studio (15-MM) y 📄 APA Document Studio (16-APA) — estaban solo en el rail lateral. Grid ahora 15 tarjetas.
- Eliminado el CTA vencido "🎯 Simetrik Interview · 15 Abr" del Quick Workshop (la entrevista pasó — Miguel ya trabaja ahí).

### Verificación (preview local, server `da-2026`)
- Test de regresión de la carrera: PASS en 13-NOT y 14-WORK (marker insertado vía "toolbar" sobrevive el cambio de página inmediato, con `updated` re-sellado correcto).
- Anti-restamp: navegar páginas SIN editar no toca `updated` (guard intacto — clave para el merge cross-device).
- Launcher: `Cerebro` object, rail 16 items, quote/stats renderizando, consolas limpias en index/systems/work.
- `node --check` OK en los 4 JS tocados.

### Cache-busters
`cloud-sync.js?v=p12` (19 páginas) · `notes-nb.js?v=p20` · `work.js?v=p31` · `systems_logic.js?v=p20`.

### Pendiente (next-angles del run)
- **Vista HOY en 1-IND** (idea #4 del brainstorm PROJECT.P3, blueprint completo en PROMPT_RUNS.md): agregador diario cross-módulo con adaptadores read-only + writes solo en `sb_habits`/`sys_tasks`.
- Merge estructural para `work_moif_meetings` · limpieza de blobs huérfanos (IDB/Storage) al borrar páginas · fase futura per-record de cuadernos.

---

## 🎯 4-RUT · ATLAS v3.2 — Directo al Ingreso — 2026-07-09 (tercer ajuste del día, versión FINAL acordada)

### Qué cambió y por qué
Miguel precisó el rumbo: la meta es **la habilidad que paga** (el negocio de IA/automatización), no coleccionar cursos de IA; quiere **SQL, Python y Power BI como complementos**, **solo certificaciones con peso real de mercado**, **inglés innegociable**, y corrigió un dato de perfil crítico: **NO sabe programar** (cero JS/Python — los docs decían "viene de JavaScript"; los sistemas da-2026 los construyó Claude bajo su dirección).

### La ruta v3.2 (5 fases, en `atlas.js`)
- **F1 jul:** Google AI Essentials (sin cambios). 🎓
- **F2 ago→sep:** n8n — la habilidad vendible (sin cambios). 🎖️🎖️
- **F3 oct→dic (NUEVA):** Datos con peso — Kaggle Intro to SQL (mini-cert) + ruta MS Learn + **examen PL-300** (⭐ el cert de más peso LATAM, descuento estudiante ~$80-100, única inversión) → aplicar a remotos desde 5-JOB. Ids `a5-*`.
- **F4 ene→feb 27:** Python Kaggle (ex-F3, "su PRIMER lenguaje").
- **F5 mar→may 27:** Agentes+RAG (ex-F4) → graduación ~may 2027.
- **Inglés = pilar transversal innegociable:** 15 min/día hablados (Gemini Live), EF SET línea base ESTA SEMANA + trimestral (primero en lista de certs), tracker diario dice "innegociable", prompts lo auditan (diario y dominical), hack #6 nuevo.
- **Prompts v3.2:** todos declaran "NO sabe programar — analogías con Excel, jamás código antes de F4". Contadores 4→5 fases (estado + KPI header). 21 pasos + 7 certs.
- **Espejo local:** PLAN_MAESTRO.html v3.2 (5 fases + caja de inglés, key `atlas_v32_progress`), CLAUDE.md, BITACORA.md, PROMPTS_ATLAS.md. Memoria actualizada (perfil: no programa aún).

### Pendiente
- Miguel: cuenta Coursera + ayuda económica AI Essentials (20 min) + EF SET esta semana + inglés diario desde hoy.

---

## ✨ 4-RUT · ATLAS v3.1 — IA desde el Día 1 — 2026-07-09 (mismo día que v3.0; superseded por v3.2)

### Qué cambió y por qué
Miguel corrigió el rumbo de la v3.0 el mismo día: *"lo de análisis de datos está bien, pero quiero foco en las habilidades de IA, más visual, camino claro sin desvíos, lo más rápido posible"*. La v3.1 conserva la **metodología** v3.0 (visual, cert-first, HOY box, 1h/día) y cambia la **ruta**: IA como columna vertebral desde el día 1, graduación ~ene 2027 (un año antes).

### La ruta v3.1 (en `atlas.js`, commiteada)
- **F1 jul 2026 (~2-3 sem):** Google AI Essentials — Coursera, español, 5 cursos ~10h, CERO código, ayuda económica día 1. **Link verificado y corregido** (el de v3.0-WIP daba 404): `coursera.org/specializations/ai-essentials-google`. 🎓 Cert 1.
- **F2 ago→sep:** n8n automatización visual de IA — setup Docker con Claude, badges oficiales L1+L2, 5 automatizaciones reales con datos propios, opcional primer servicio 💵.
- **F3 oct→nov:** Python en Kaggle (3 mini-certs) + primer script llamando API de IA (tier gratis Gemini).
- **F4 dic→ene 2027:** HF Agents Course (🎓 cert) + Anthropic Academy (tool use) + 🏆 proyecto RAG público → graduación: servicios a PYMEs y/o vacantes IA desde 5-JOB.
- **Datos:** mismas keys sync; ids nuevos `a1-*…a4-*`, certs `c-aie/c-n8n/c-kaggle/c-hf/c-anthropic/c-efset` (16 pasos + 6 certs). Estado copiable v3.1.
- **Espejo local sincronizado:** `E:\CLAUDE\My Project\` — PLAN_MAESTRO.html v3.1 (mapa visual, key `atlas_v31_progress`), CLAUDE.md (historia v2→v3→v3.1 + rol), BITACORA.md, PROMPTS_ATLAS.md regenerado (pendiente de v3.0 saldado).

### Verificado en preview local (09-jul)
Hero v3.1, HOY box "Cuenta Coursera + AYUDA ECONÓMICA", Fase 1/4, 16 pasos, 6 certs, buildEstado() v3.1, links Coursera correctos, 0 errores consola.

### Pendiente
- Miguel: cuenta Coursera + solicitar ayuda económica de **AI Essentials** (paso 1 del mapa, 20 min).

---

## 🗺️ 4-RUT · ATLAS v3.0 — Camino de los Certificados — 2026-07-09 (superseded por v3.1 el mismo día)

### Qué cambió y por qué
Miguel reportó que ATLAS v2.0 (maestría autodidacta 12 sem con lecciones de código desde el día 1) era **confusa y lo bloqueó** — se atascó en la primera función de Python, bitácora vacía 06→09 jul. Pidió: certificados primero, formato visual, cero pérdida de tiempo. **Es aprendiz VISUAL** — regla permanente para diseñarle cualquier cosa.

### La ruta v3.0 (reescritura completa de `atlas.js`, `?v=3`)
- **F1 jul→sep 2026:** Google Data Analytics (Coursera, español; ayuda económica se solicita el DÍA 1 — tarda 2-3 sem). 9 pasos.
- **F2 oct→nov:** Power BI + examen PL-300 (MS Learn gratis; descuento estudiante CUN; ~$80-100). Dashboard con datos del 12-FIN → repo atlas-portfolio. Al certificar: aplicar a remotos junior desde 5-JOB.
- **F3 dic→ene 2027:** Python en Kaggle Learn (gratis, navegador, visual). 4 micro-cursos + mini-proyecto.
- **F4 2027 (candado):** IA Aplicada — n8n, agentes HF, RAG. La v2.0 vive ahí (archivada en `E:\CLAUDE\My Project\PLAN_MAESTRO_v2_archivo.html`).
- **UI nueva:** recuadro rojo **"QUÉ TOCA HOY"** (primer paso sin marcar, computed), KPI "Fase N/4" (reemplaza "Sem N/12"), cada fase con su "Por qué". 22 pasos + 7 certs marcables. Prompts v3 (Claude = acompañante que desbloquea con explicaciones visuales, NO profesor socrático; diario/dominical/rescate actualizados). Daily tracker: 📖 Curso 45min + 📝 Notas 15min + 🇺🇸 Inglés opcional (mismos campos est/con/eng — sync intacto).
- **Datos:** mismas keys `atlas_daily/atlas_curr/atlas_meta` en SYNC_REGISTRY. Ids nuevos (f1-1…f4-3, c-gda…) — los checks viejos (m1-1…) quedan huérfanos e inofensivos en `atlas_curr`. Entradas daily nuevas llevan `fase` en vez de `week` (render soporta ambos).
- **Espejo local:** `E:\CLAUDE\My Project\` actualizado (PLAN_MAESTRO.html v3.0 visual standalone, CLAUDE.md rol v3, BITACORA.md con historia de versiones).

### Verificado en preview local
HOY box correcto ("Cuenta Coursera + AYUDA ECONÓMICA"), Fase 1/4, 22 pasos, 7 certs, buildEstado() v3 OK, 0 errores de consola.

### Pendiente
- Miguel: cuenta Coursera + solicitar ayuda económica (paso 1 del mapa).
- `PROMPTS_ATLAS.md` (espejo local de prompts) desactualizado respecto a v3 — regenerar en próxima sesión ATLAS.

---

## 🚀 4-RUT · Hub PROYECTO ATLAS — 2026-07-06

### Qué es
Sección nueva al tope de `ruta.html`: hub de continuidad multi-IA del **Proyecto ATLAS** (maestría 12 semanas en Ingeniería de IA Aplicada, doble vía servicios + empleo remoto). La constitución del proyecto vive fuera del repo en `E:\CLAUDE\My Project\` (PLAN_MAESTRO.html v2.0 + BITACORA.md + CLAUDE.md + PROMPTS_ATLAS.md).

### Implementación
- **`frontend/js/atlas.js`** (nuevo, IIFE `ATLAS`): 10 secciones colapsables — setup Claude Project paso a paso, setup Gemini Gem, 5 prompts copiables (2 maestros + diario + dominical + rescate), ruta diaria rellenable (checkboxes estudio/construcción/inglés + nota), currículo 12 semanas (18 items · 4 módulos con links), 10 certificaciones priorizadas (gratis primero), plan de inglés, protocolo dominical con generador de evento recurrente de Google Calendar, guía GitHub, 7 hacks.
- **Botón "📋 Copiar Estado ATLAS"** (sticky): genera bloque de estado (semana/12, racha, currículo %, últimos 7 días, siguiente pendiente) para pegar en cualquier IA — la memoria del proyecto vive en la web, las IAs son intercambiables.
- **Keys nuevas en SYNC_REGISTRY** (`cloud-sync.js`): `atlas_daily`, `atlas_curr`, `atlas_meta` — cross-device via Supabase.
- `ruta.html`: stub `#atlasStub` + badge nav `🚀 ATLAS` + `<script src="js/atlas.js?v=1">`. La ruta Data Analyst clásica de 28 semanas queda intacta debajo.

### Verificado en preview local
Render completo (10 secciones, 18 items currículo, 10 certs, 3+2 prompts), guardado diario + racha + toggle currículo + Estado generado OK, 0 errores de consola.

### Pendiente
- Miguel: aprobar plan, crear Project en claude.ai y Gem en Gemini (guías en el hub), fijar hora diaria y domingo.

---

## ⚙️ 14-WORK · Prueba DOTA · sesión completa — 2026-05-27 (P2 · 4 iteraciones)

### Estado final
- Tab **"🧪 Prueba DOTA"** producción en 14-WORK (14ª posición)
- Roadmap con **16 puntos** del Documento Guía + **fórmulas EXACTAS Simetrik** verificadas con insumos del Drive del usuario
- **Checklist de 16 items** con sync cross-device (clave `work_dota_progress` en SYNC_REGISTRY)
- **Diccionario expandido** con 12 términos DOTA + Simetrik (LPAD, COALESCE, fechas hábiles, barridas, add-ons)
- **Nuevo Modo 3 "🧪 Nueva Prueba Simetrik"** en Copilot · plantilla reutilizable para futuros casos
- **PROMPT_14-WORK_TEST.md** · plantilla persistente del prompt fuera del módulo

### Insumos REALES leídos via Chrome MCP
Carpeta Drive del usuario: `1mfh3srmGGq_y9rfqAoV0l-HngC22xjEp` (Insumos) + subcarpeta `Imagenes`:
- **Documento Guia.docx** — caso DOTA × FD completo (16 puntos)
- **Anotaciones.txt** — sintaxis Simetrik verificada (separador `;`, strings `"..."`, `RELLENAR(...;...;"0";"IZQUIERDA")`)
- **Captformulas1/2/3.png** — catálogo de funciones Simetrik disponibles
- **Formatos de las columnas.png** — diálogo "Dar formato a una columna" (tipos: Fecha · Número · Texto · Fecha y hora · Entero · Hora · Booleano)
- **DB_DOTA_v3.xlsx**, **Reporte_FD_v3.xlsx**, **Parametria_Comercio_v2.xlsx**, **Normalización_fechas_habiles_v2.xlsx** — fuentes de datos (no descargados; columnas extraídas de la guía)

### Funciones Simetrik catalogadas (24)
ABS · ADICIONAR_DIAS_SEMANA · ADICIONAR_FECHA_TIEMPO · CALCULO · CONCATENAR · DERECHA · DIASEM · DIFERENCIA_FECHA · DIVIDIR · ENCONTRAR · ESBLANCO · ESPACIOS · EXTRAE · EXTRAER_EXPREGULAR · EXTRAER_FECHA · IZQUIERDA · LARGO · MAYUSC · MINUSC · O · POTENCIA · REDONDEAR · REEMPLAZAR · REEMPLAZAR_EXPREGULAR · RELLENAR · SI · Y

### Las 16 fórmulas (sintaxis Simetrik exacta)
| # | Columna salida | Tipo | Función principal |
|---|---|---|---|
| 1 | CARD_NUMBER | Texto | `CONCATENAR + RELLENAR` |
| 2 | GTWC_AUTHORIZATION_CODE | Texto | `SI + Y` |
| 3 | GTWT_ACQUIRER | Texto | `SI + EXTRAER_EXPREGULAR + MAYUSC` |
| 4 | BRAND | Texto | `SI anidado + IZQUIERDA + O` |
| 5 | GTWT_MERCHANT_NUMBER | Texto | `SI + ESBLANCO` |
| 6 | MOV_CREATION_DATE | Fecha | `ADICIONAR_FECHA_TIEMPO` |
| 7 | EXPECTED_PAYMENT_DATE | Fecha | `ADICIONAR_DIAS_SEMANA (sitio ARG)` |
| 8 | (cruce + filtro) | — | filtro `TIPO_COMERCIO = "ESTANDAR"` post-cruce |
| 9 | LIQ_6_TARJETA | Texto | `IZQUIERDA(NUM_TAR; 6)` |
| 10 | LIQ_4_TARJETA | Texto | `DERECHA(NUM_TAR; 4)` |
| 11 | DEADLINE | Texto | `SI + EXTRAER_FECHA` (bisiesto-safe) |
| 12 | (conciliación) | — | 5 barridas con restricciones B1-B2 |
| 13 | Saldo neto diario | — | Add-on Saldos Persistentes |
| 14-16 | Tableros | — | %·KPI·tablero libre |
| Check | FECHA_FINAL / DIAS_A_SUMAR | Fecha/Entero | `CALCULO + DERECHA + ADICIONAR_FECHA_TIEMPO` |

### Archivos modificados (commits relacionados)
- `e2e7b37` · feat: nueva pestaña Prueba DOTA + roadmap inicial
- `d214de5` · feat: simulador 5 barridas + checklist sync + 12 entradas dict
- `4df4a15` · refactor: fórmulas EXACTAS Simetrik · simulador eliminado
- `<este push>` · feat: plantilla reutilizable + actualización docs

### Storage keys agregadas
- `work_dota_progress` → checklist 16 puntos · SYNC_REGISTRY ✓
- (`work_eco_dict` bumpeada a `simetrik-2026-05-27.2` con +12 términos)

### Archivos del proyecto
- 🆕 `frontend/pages/simetrik-dota-test.html` (~430 líneas standalone)
- 🆕 `PROMPT_14-WORK_TEST.md` (plantilla reutilizable)
- ✏️ `frontend/work.html` (+nueva tab 🧪 Prueba DOTA + Modo 3 Copilot)
- ✏️ `frontend/js/work.js` (+`buildTestDevPrompt` + 12 términos diccionario + SEED_VERSION bump)
- ✏️ `frontend/js/cloud-sync.js` (+`work_dota_progress` en SYNC_REGISTRY)
- ✏️ `PROMPT_14-WORK.md` (cronología 2026-05-27 a-d + 14 tabs + storage keys actualizadas)
- ✏️ `PROMPT_RUNS.md` (entry ID:14-WORK.P2 + iteraciones)

---

## ⚙️ 14-WORK · Prueba DOTA Roadmap — 2026-05-27 (P2 · iteración inicial)

### Qué cambió
14a pestaña agregada al módulo 14-WORK: **"🧪 Prueba DOTA"** con roadmap completo del caso DOTA × FD para Implementation Specialist.

### Entregado
- **`frontend/pages/simetrik-dota-test.html`** (NUEVO · ~350 líneas) — Roadmap standalone con TOC + 16 puntos del Documento Guia.docx · cards estilo why/formula/tip/warn · fórmulas formateadas en `<pre>`.
- **`frontend/work.html`** — Nueva tab `data-p="dotatest"` después de Copilot + panel `#p-dotatest` con header descriptivo + iframe que embebe la guía + botón "↗ Abrir en nueva pestaña".
- Estructura del roadmap (Documento Guia.docx leído via Drive Chrome MCP):
  1. Fuentes (DB_DOTA, Reporte_FD, Parametria_Comercio, Normalización_fechas_habiles)
  2. Normalizaciones DB DOTA (puntos 1-7): CARD_NUMBER, GTWC_AUTHORIZATION_CODE, GTWT_ACQUIRER, BRAND, GTWT_MERCHANT_NUMBER, MOV_CREATION_DATE, EXPECTED_PAYMENT_DATE
  3. Cruce con Parametría (8) · filtro TIPO_COMERCIO=ESTANDAR
  4. Normalizaciones FD (9-11): LIQ_6, LIQ_4, DEADLINE con truco "primer día del mes siguiente -1" para fin de mes bisiesto-safe
  5. Conciliación avanzada (12) · 5 barridas en orden con restricciones PAYMENT↔REFUND
  6. Check débitos >15 días · cálculo FECHA_FINAL via últimos 2 dígitos GTWT_MERCHANT_NUMBER
  7. Saldo neto diario (13) · uso recomendado de add-on Saldos persistentes
  8. Tableros 14-16: % conciliación · KPI global · tablero libre con sugerencias
  9. Top 7 errores comunes + checklist pre-video

### Archivos
- ✏️ `frontend/work.html` (+~15 líneas: nueva tab + panel iframe)
- 🆕 `frontend/pages/simetrik-dota-test.html` (~350 líneas standalone)
- ✏️ `PROMPT_RUNS.md` (entrada ID:14-WORK.P2)

---

## ⚙️ 10-SYS · Subject CRUD — 2026-05-26

### Qué cambió
Sistema CRUD completo de materias para Tab 1 (Materias).

### Entregado
- **`getSubjects()`:** merge `SUBJECTS` hardcoded + `sys_subjects_custom` (custom/overrides) excluyendo `sys_subjects_hidden`. Single source of truth para toda la UI.
- **Modal Nueva/Editar materia:** ícono, código, nombre, color picker (12 colores), créditos, grupo, tipo, horario, profesor, descripción, CDigital ID, links clase/grabaciones/material.
- **Cronograma de entregas por materia:** filas título + fecha + tipo en el modal. Se renderizan como dropdown semáforo en la tarjeta de cada materia.
- **Adjuntos por materia:** `sys_subj_files_${id}` en localStorage. FileReader → base64 DataURL, max 2 MB, con descarga y eliminación.
- **Ocultar materia:** soft-delete en `sys_subjects_hidden` (las tareas se conservan).
- **Selects dinámicos:** `renderSubjTaskSelects()` pobla `#newTaskSubj` y `#bulkSubj` en tiempo real.
- **Botones ✏ Editar y 🗑 en cada tarjeta** + botón **+ Nueva materia** en el header.
- `renderStats()` y `renderDeadlines()` usan `getSubjects()` en vez de `SUBJECTS`.

### Pendiente (Tier B)
- Tareas Bloque 2 para ing_web, mat_especiales, inv_ciencia
- Actividades A1I01 y CE1026 con fechas reales
- Bump SEED_VERSION a 6 cuando haya datos verificados

### Archivos
- ✏️ `frontend/systems_logic.js` (+~230 líneas: CRUD completo)
- ✏️ `frontend/systems.html` (+~155 líneas: CSS modal + HTML modal + selects vacíos)
- **Commit:** `e847ea6`

---

## ⚙️ 10-SYS · Tier A · Audit + Calendar Upgrade — 2026-05-26

### Qué cambió
Audit READ-ONLY completo + 4 mejoras Tier A aplicadas sin tocar datos inventados.

### Entregado
- **`english_beginner` enriquecida:** profesor `CINDY PAOLA MORENO`, horario `Lunes 7:00 PM`, link directo a CDigital — datos verificados de `academic-8vo.json`.
- **`CALENDAR['26V02']` completado:** añadidos `gradeClose2` (Jul 14-19) y `periodClose` (Jul 20-26), derivados del patrón oficial 26V01. Tab 2 ya muestra eventos para todo el semestre.
- **`renderDeadlines()` — nueva función:** sección "Entregas pendientes por materia" en Tab 2. Lee `sys_tasks` dinámicamente, ordena por vencimiento, agrupa por materia, semáforos P0-P3 en tiempo real. Funciona para las 5 materias sin inventar datos.
- **CSS fix:** `.atask { transition: all .2s }` → `transition: border-color .2s, background .2s, transform .2s`.

### Pendiente (Tier B — requiere Chrome MCP o syllabus pegado)
- Tareas de **Bloque 2** para ing_web, mat_especiales, inv_ciencia (Quiz 4/5, Parcial 3/4, ACA B2)
- Actividades de **A1I01 English Beginner** con fechas reales
- Fecha del test **CE1026 Placement Test**
- Cuando haya datos: bump SEED_VERSION a 6, añadir a VERIFIED_SUBJECTS

### Archivos
- ✏️ `frontend/systems_logic.js` (3 edits: SUBJECTS[3], CALENDAR['26V02'], renderDeadlines + render())
- ✏️ `frontend/systems.html` (2 edits: transition CSS, div#deadlinesBySubject en Tab 2)

---

## 🇺🇸 3-ENG · F6 · Daily Practice Session + CIERRE PLAN — 2026-05-25

### Qué cambió
Ejecutada **F6** del rediseño Second Brain — **última fase y cierre del plan**. Materializa la **técnica E (Local-first learning)** del Modelo integrando F1-F5 en una rutina diaria personalizada. Es el "pegamento" que vuelve el módulo un sistema vs. una colección de features.

### Entregado
- **Banner "Tu sesión de hoy"** arriba del hero del módulo · siempre visible al entrar · colapsable.
- **Generador de 4 pasos** que pulla datos de las fases anteriores:
  - **🃏 SRS**: N cards due (cap 5) desde `eng_srs_deck`. Si vacío → CTA a F4.
  - **⏰ Tense**: pick por prioridad (viewed-no-mastered → untouched → review).
  - **🔍 Error #1**: top patrón del wiki F5 con sample + regla + link a F1.
  - **💬 Phrase**: random determinístico-por-fecha desde `eng_notes`.
- **Streak tracker** en `eng_practice_streak` (count + lastDate + max). Se incrementa al completar los 4 pasos; se reinicia si pasa un día sin completar.
- **UX**: barra de progreso animada, checkboxes con pop animation, banner cambia de violeta a verde al completar, mensaje "Vuelve mañana".
- **Cross-fase navigation**: cada paso tiene CTA al tab + abre modal F1 cuando aplica.
- **API CLI**: `window.ENG_PRACTICE.{session, markStep, streak, regenerate, openTab}`.
- **Sync**: `eng_daily_session` + `eng_practice_streak` añadidos a SYNC_REGISTRY · streak cross-device.

### Archivos
- ➕ `frontend/js/eng-practice.js` (NUEVO · ~340 líneas IIFE)
- ✏️ `frontend/english.html` (2 edits: `<div id="dailySession">` arriba del hero + script tag)
- ✏️ `frontend/css/english.css` (+~80 líneas bloque "F6 · DAILY PRACTICE SESSION")
- ✏️ `frontend/js/cloud-sync.js` (2 keys nuevas en SYNC_REGISTRY)

### Verificación
Smoke test en preview con localStorage vacío: los 4 pasos muestran estado "empty" con CTAs correctos. Re-test con datos sintéticos: sesión generó "2 de 2 cards due", "Present Perfect intermedio a repasar", "error no_aux_negative ×1", phrase "I'll get back to you on that". Completar los 4 pasos → banner cambia a verde "¡Sesión completa!" + streak 1 día. Streak persiste tras reload.

---

## 🎉 CIERRE PLAN SECOND BRAIN · 3-ENG · 6 fases completas

Las 6 fases del rediseño "Second Brain" de 3-ENG están desplegadas. Cubren las **5 técnicas del Modelo.md** aplicadas al dominio English:

| Fase | Técnica | Feature | Storage key | Commits |
|---|---|---|---|---|
| **F1** | C + E | Tab Tiempos · grid 4×3 + lecciones modales | `eng_tense_progress` | 8da1088 |
| **F2** | D (CLI/Skills) | Forja de Oraciones · `buildSentence()` | `eng_notes` (forja saves) | ccd675a |
| **F3** | C (Canvas) | Mapa SVG · knowledge graph con 16 aristas tipadas | `eng_tense_view` | 9f1665f |
| **F4** | B (Web Clipper) | Importador · auto-scan 13-NOT + paste | `eng_imported_lessons` | 71da1e2 |
| **F5** | A (Karpathy) | Detector 15 patrones errores hispanos + wiki | `eng_error_log` | d3198e3 |
| **F6** | E (Local-first) | Daily Practice Session integradora | `eng_daily_session` + `eng_practice_streak` | pending |

### APIs CLI expuestas
- `window.ENG_TENSES.{init, openLesson, mark, getProgress, buildSentence, randomSentence, openForja, switchView, TENSE_EDGES, SUBJECTS, VERBS}`
- `window.ENG_IMPORT.{scan, extract, importItems, log, openTab}`
- `window.ENG_ERRORS.{analyze, highlight, save, log, wiki, openTab, PATTERNS}`
- `window.ENG_PRACTICE.{session, markStep, streak, regenerate, openTab}`

### Loop de aprendizaje completo
**Importás** lecciones de Platzi en F4 → vocab va al SRS, frases a Notes → **F6** te recuerda repasar el SRS diariamente · **F5** detecta errores en lo que escribís y los acumula en tu wiki personal → **F6** te muestra tu error #1 cada día y te lleva a la **lección F1** correspondiente → **F2** te deja forjar oraciones correctas en ese tense → **F3** te muestra el mapa de cómo ese tense se relaciona con los demás → ciclo cierra y vuelves a empezar más fluido.

### Próximos angles posibles
(a) Export sesión diaria a iCal/calendar · (b) "modo Sprint" 30 min · (c) integration con Dojo TTS+STT para shadowing del phrase del día · (d) leaderboard cross-device del streak · (e) `ENG_IMPORT.createNotebook()` para crear el cuaderno English en 13-NOT desde la CLI.

---

## 🇺🇸 3-ENG · F5 · Detector de errores hispanos (Karpathy-style) — 2026-05-25

### Qué cambió
Ejecutada **F5** del rediseño Second Brain. Esta fase materializa la **técnica A (Karpathy auto-organize)** del Modelo: detector local de errores hispanos que escanea texto del usuario contra 15 patrones regex y construye un wiki personal de errores recurrentes para coaching dirigido.

### Entregado
- **Nueva tab `🔍 Errores`** entre Importar y Dojo.
- **15 patrones regex** que cubren los errores hispanos más documentados, con 3 niveles de severidad (high/med/low) y vínculo a lección F1 cuando aplica:
  - **Auxiliares/Subject-Verb**: no + verbo · 3ra sin -s · pregunta sin auxiliar.
  - **Negación**: doble negación (nothing/nobody/never tras don't/can't/etc).
  - **Be vs Have**: have años · have + estado (hungry/cold/right).
  - **Modales**: have that + verbo (tener que) · will to + verbo.
  - **Aspecto**: verbos de estado en continuo (am knowing).
  - **Plurales**: people is · uncountables en plural (informations, advices).
  - **Preposiciones**: depend of · married with · since + duración.
  - **Collocations**: make homework / make a question.
- **Engine `analyze(text)`**: 15 patrones secuenciales, deduplicación por overlap, sort por índice. Devuelve array con suggestion + why + tenseId.
- **`highlight(text, results)`**: HTML con `<mark>` coloreado por severidad + superíndice de número de error.
- **UI 3 secciones**:
  - **A · Pegá tu texto**: textarea + Analizar → resultado con texto highlighted + lista expandible de errores (✗ encontrado / ✓ sugerencia / 📖 regla / → ver lección F1).
  - **B · Wiki personal**: cards ordenadas por frecuencia (×N veces), con último sample, regla rota y botón "Ver lección" cuando el patrón está asociado a un tiempo.
  - **C · Historial**: últimos 5 análisis con date + sample + errorCount.
- **Vínculo F1 ↔ F5**: cuando un error está asociado a un tense (ej. third_sg_no_s → present_simple), botón salta a tab Tiempos y abre el modal de la lección.
- **Storage**: `eng_error_log` con cap 50, sincronizado vía SYNC_REGISTRY.
- **API CLI**: `window.ENG_ERRORS.{analyze, highlight, save, log, wiki, openTab, PATTERNS}`.

### Archivos
- ➕ `frontend/js/eng-errors.js` (NUEVO · ~470 líneas IIFE)
- ✏️ `frontend/english.html` (3 edits: tab + panel `#p-errors` + script tag)
- ✏️ `frontend/css/english.css` (+~110 líneas bloque "F5 · DETECTOR DE ERRORES" · highlighted text con mark coloreado · wiki cards · lista expandible)
- ✏️ `frontend/js/cloud-sync.js` (`eng_error_log` añadido al SYNC_REGISTRY)

### Verificación
Smoke test en preview con texto sample de 13 oraciones con errores típicos: **13/13 errores detectados correctamente** (no_aux_negative, third_sg_no_s, have_that_verb, will_to_verb, double_negative, depend_of, uncountable_plural, people_is, married_with, since_duration, state_verb_continuous, 2× have_state). Suggestions correctas en todos los casos. Wiki personal poblado con 12 patrones únicos tras guardar. Vínculo a lección F1 funcional. Bug "She workworks" en suggest de third_sg_no_s corregido in-flight (concat doble del verbo) → ahora devuelve "She works".

---

## 🇺🇸 3-ENG · F4 · Importador (web clipper + paste) — 2026-05-25

### Qué cambió
Ejecutada **F4** del rediseño Second Brain. Esta fase materializa la **técnica B (Web Clipper)** del Modelo: importador que parsea contenido raw o auto-detecta cuadernos del 13-NOT y empuja items estructurados a los stores existentes de 3-ENG (`eng_srs_deck` + `eng_notes`).

### Entregado
- **Nueva tab `📥 Importar`** entre My Notes y Dojo en el módulo 3-ENG.
- **Auto-scan** del localStorage que detecta:
  - Cuadernos en `not_nb_meta`/`not_nb_data` cuyo nombre matchea `/english|inglés|platzi|practical|conversational|grammar|vocab/i`.
  - Páginas individuales (cuando el cuaderno no matchea pero su título/body sí).
  - Notas flat en `sb_notes2` agrupadas por tag o por contenido.
- **Modo Paste** con textarea para pegar texto raw de Platzi, PDFs, transcripts. Stats live (palabras/caracteres).
- **Parser** que detecta 3 categorías con regex robustos:
  - **Vocab** (5 separadores: `— : = → /`) con validación alfabética y anti-URL.
  - **Phrases** entre comillas, en `<b>` spans, o como sentencias autónomas (3-18 palabras + mayúscula + .!?).
  - **Tips** con prefijo `tip:|regla:|rule:|nota:|note:|💡|⚠️`.
- **Modal de revisión** con checkbox por item, botones "Seleccionar todo/Ninguno", summary pills + agrupación por categoría.
- **Push a stores existentes:**
  - Vocab → `eng_srs_deck` como flashcards box 1 con metadata.
  - Phrases → `eng_notes` con `stamp:'phrase', source:'import'`.
  - Tips → `eng_notes` con `stamp:'idea', source:'import'`.
- **Historial** en `eng_imported_lessons` (cap 50, sincronizado via SYNC_REGISTRY) · últimas 5 entradas visibles en UI.
- **Toast verde** al confirmar importación.
- **API CLI**: `window.ENG_IMPORT.{scan, extract, importItems, log, openTab}`.

### Archivos
- ➕ `frontend/js/eng-import.js` (NUEVO · ~430 líneas IIFE)
- ✏️ `frontend/english.html` (3 edits: tab + panel `#p-import` + script tag)
- ✏️ `frontend/css/english.css` (+~110 líneas bloque "F4 · IMPORTAR" + modal de revisión + toast)
- ✏️ `frontend/js/cloud-sync.js` (`eng_imported_lessons` añadido al SYNC_REGISTRY)

### Verificación
Smoke test en preview con texto sample tipo Platzi (vocab/grammar tips/professional phrases): parser detectó correctamente **5 vocab + 8 frases + 3 tips = 16 items**. Modal de revisión renderizó agrupados con checkboxes. Importación impactó stores correctos: `eng_srs_deck` ganó 5 cards en box 1 con metadata `source:'import'`, `eng_notes` ganó 11 entradas (8 phrases + 3 tips) todas con `source:'import'`, log creado con timestamp + results. Toast verde mostrado. Historial visible en UI.

---

## 🇺🇸 3-ENG · F3 · Mapa de Tiempos (knowledge graph SVG) — 2026-05-25

### Qué cambió
Ejecutada **F3** del rediseño Second Brain. Esta fase materializa la **técnica C (JSON Canvas)** del Modelo: un knowledge graph visual de los 12 tiempos verbales con relaciones tipadas (trampas hispanas, secuencias temporales, evolución por aspecto).

### Entregado
- **Toggle Grid/Mapa** arriba del grid · vista preferida persiste en `localStorage.eng_tense_view` (local, no sync).
- **SVG knowledge graph** con layout 3 columnas (Past/Present/Future) × 4 filas (Simple/Cont/Perf/PerfCont). 12 nodos circulares + 16 aristas curvas tipadas:
  - **Trampa hispana** (4 aristas · ámbar punteada): `present_perfect ↔ past_simple`, `present_perfect ↔ present_simple`, `past_continuous ↔ past_simple`, `future_simple ↔ present_simple`.
  - **Secuencia temporal** (3 aristas · verde sólida): `past_simple → past_perfect`, `present_simple → future_simple`, `future_simple → future_perfect`.
  - **Evolución por aspecto** (9 aristas · violeta sutil): conecta horizontalmente Simple → Continuous → Perfect → Perfect Continuous en cada fila.
- **Interactividad rich**: hover en nodo destaca vecinos + dim no-vecinos + muestra detalle en sidebar (uso del tense + pills nivel/trampas/secuencias). Hover en arista muestra la regla específica en sidebar. Click en nodo abre el modal de lección de F1.
- **Sidebar sticky** con leyenda completa (3 tipos de conexión, 3 niveles de dificultad, 3 estados de progreso) + zona de detalle dinámica.
- **Estados visuales**: untouched (gris) · viewed (borde ámbar) · mastered (borde verde + 🌟). Nombre del tiempo coloreado por nivel (verde basic / ámbar intermediate / rojo advanced).
- **API CLI**: `window.ENG_TENSES.switchView(view)` + `window.ENG_TENSES.TENSE_EDGES` (dataset expuesto).

### Archivos
- ✏️ `frontend/js/eng-tenses.js` (+~230 líneas: TENSE_EDGES dataset, _renderMap SVG, _renderViewToggle, switchView, hover/click handlers, _highlightNeighbors)
- ✏️ `frontend/english.html` (1 edit: tense-toolbar con toggle + `<div id="tenseMap">`)
- ✏️ `frontend/css/english.css` (+~110 líneas bloque "F3 · TOGGLE VISTA + MAPA" + responsive mobile)

### Verificación
Smoke test en preview: 12 nodos + 16 aristas renderizados sin errores. Hover sobre Present Perfect destaca 4 vecinos + sidebar muestra "INTERMEDIO · 2 TRAMPAS". Hover sobre arista trap muestra "Present Perfect ⇄ Past Simple · Con fecha específica ('in 2022') cambia a past simple, NO present perfect." Click en Future Perfect Continuous abre el modal F1. Vista persistida en localStorage al reload.

---

## 🇺🇸 3-ENG · F2 · Forja de Oraciones (motor + UI + CLI) — 2026-05-25

### Qué cambió
Ejecutada **F2** del rediseño Second Brain de 3-ENG inmediatamente después de F1. Esta fase materializa la **técnica D (CLI/Skills)** del Modelo: un motor de conjugación reutilizable expuesto en `window` + una UI educativa de construcción de oraciones encima del grid.

### Entregado
- **Motor `buildSentence(tense, mood, subject, verb, complement)`** que cubre los 12 tiempos × 3 modos = 36 conjugaciones. Devuelve oración + array de slots tipados.
- **UI Forja** colapsable arriba del grid de Tiempos: select tense + radios modo + selects sujeto/verbo + input complemento. Botones: ⚡ Generar / 🎲 5 variaciones / Limpiar.
- **Resultado visual** con slots coloreados (sujeto verde · auxiliar ámbar · verbo violeta · negación rojo · complemento neutro) + breakdown etiquetado por slot.
- **TTS + Save to notes** (💾) en cada oración generada (push a `eng_notes` con `source:'forja'`).
- **Integración con F1**: botón "🧱 Forjar oración con este tiempo" en el footer del modal de lección — cierra modal, expande Forja, scrollea y pre-selecciona el tense.
- **22+ verbos** del dominio data-analyst + **7 sujetos** con conjugaciones precomputadas.
- **API CLI expuesta**: `window.ENG_TENSES.{buildSentence, randomSentence, openForja, SUBJECTS, VERBS}` — invocable por Copilot, sub-agentes o cualquier otro módulo.

### Archivos
- ✏️ `frontend/js/eng-tenses.js` (+~340 líneas: SUBJECTS, VERBS, buildSentence engine con switch sobre 12 tiempos, renderForja, openForja, save-to-notes)
- ✏️ `frontend/english.html` (1 edit: `<div id="forja"></div>` insertado arriba del grid en el panel Tiempos)
- ✏️ `frontend/css/english.css` (+~80 líneas bloque "F2 · FORJA DE ORACIONES" + responsive mobile)

### Verificación
Smoke test en preview con 25 combinaciones tense × mood × subject × verb · todas correctas. Casos críticos verificados: "She studies", "It goes", "He doesn't work", "Is she running...", "She has written...", "We had deployed...", "I will have been learning for 5 years by July." Flujo modal→Forja con pre-selección verificado. TTS funcional. Save-to-notes verificado.

---

## 🇺🇸 3-ENG · F1 · Tab ⏰ Tiempos Verbales (rediseño Second Brain) — 2026-05-25

### Qué cambió
Arrancó el rediseño "Second Brain" de 3-ENG con la **F1** del plan 6-fases. Foco en el dolor real del usuario: "no sé los tiempos verbales". Fusión de las 5 técnicas (A Karpathy / B Web Clipper / C Canvas / D CLI / E Local-first) — esta fase ejecuta principalmente C+E con la espina dorsal del módulo.

### Entregado
- **Nueva pestaña `⏰ Tiempos`** entre Vocabulary y Grammar.
- **Grid 4×3** de los 12 tiempos del inglés: filas = Pasado/Presente/Futuro · columnas = Simple/Continuous/Perfect/Perfect Continuous.
- **Modal de lección** por celda con: fórmulas (afirmativo/negativo/pregunta), palabras señal, 3 ejemplos data-analyst con TTS, **trampa hispana** destacada, top de errores comunes y verbos irregulares clave.
- **Stats bar**: Vistos / Dominados / barra % del curso.
- **Estados visuales**: untouched / viewed (ámbar) / mastered (verde con 🌟) + ring inferior por nivel (basic verde · intermediate ámbar · advanced rojo).
- **API CLI** `window.ENG_TENSES.{init, openLesson, mark, getProgress, closeModal}` expuesta para Copilot/sub-agents.
- **Sync cross-device** vía `eng_tense_progress` añadido al SYNC_REGISTRY.

### Archivos
- ➕ `frontend/data/tenses.json` (NUEVO · 12 tiempos curados manualmente · sin alucinación)
- ➕ `frontend/js/eng-tenses.js` (NUEVO · ~290 líneas IIFE)
- ✏️ `frontend/english.html` (3 edits: tab + panel + script boot)
- ✏️ `frontend/css/english.css` (+~120 líneas bloque "F1 · TIEMPOS VERBALES")
- ✏️ `frontend/js/cloud-sync.js` (1 línea · `eng_tense_progress` añadido al SYNC_REGISTRY)

### Verificación
Preview corrido en localhost:3456. La pestaña aparece, las 12 celdas se rendean, el modal abre con todo el contenido, "Marcar como dominado" persiste en localStorage y el grid se actualiza en vivo (1/12 Vistos, 1 Dominado, 8% del curso confirmado).

### Pendiente (Fases F2-F6)
- **F2**: Forja de Oraciones (builder tense+mood+subject+verb) + `ENG_TENSES.buildSentence()`.
- **F3**: Vista Canvas global del módulo como knowledge graph (técnica C).
- **F4**: Importador del cuaderno "English" / Platzi desde 13-NOT (técnica B).
- **F5**: Detector top-10 errores hispanos en texto del usuario (técnica A).
- **F6**: Auto-feed de vocab importado → SRS deck.

---

## 🌐 8-PRO · 3 prompts del proyecto completo + limpieza — 2026-05-19d

### Qué cambió
- **Limpieza:** eliminados 6 archivos basura de `frontend/` (scratch del Bug Hunt: check_tokens.txt · defined_tokens.txt · element_ids.txt · refs.txt · sync_check.txt · tokens_used.txt).
- **3 prompts whole-project** agregados a `module-prompts.js` — mismo triad que los module prompts (improve/audit/creative) pero scope = los 16 módulos como UN sistema:
  - `PROJECT.P1 · ⚡ Improve/Optimize/Update` — elige el trabajo de mayor leverage cross-cutting (no un módulo aislado).
  - `PROJECT.P2 · 🔬 Audit/Bugs/Health` — auditoría read-only system-wide, delega a sub-agent Explore, reporte por severidad × módulo.
  - `PROJECT.P3 · 🧠 Creative/Second Brain` — aplica Modelo.md a nivel SISTEMA (16 módulos interconectados, no 16 silos).
- Cada uno: inglés compacto · `PROJECT_BASE` (pre-read CEREBRO_STATE matrix + infra compartida + 16 módulos) · PRIOR RUNS + LOG con IDs `PROJECT.P1/P2/P3`.
- UI tab 🧩 Módulos: el selector ahora abre con **"🌐 PROYECTO COMPLETO"** primero, divisor, luego los 16 módulos.
- `PROMPT_RUNS.md`: nueva sección "Project-Wide Prompts (3)".

### Archivos
- `frontend/js/module-prompts.js` (PROJECT_META + PROJECT_PROMPTS + selector/renderer).
- `PROMPT_RUNS.md` (sección nueva).
- 6 .txt basura eliminados.

---

## 🔧 13-NOT · Notebook Overhaul · sprint multi-fase — 2026-05-19c

Sprint pedido por el usuario: arreglar Grafo · editar notas · estándar de notebooks · mover notebooks entre módulos · iconos pulidos · fluidez. Plan de 6 fases.

### ✅ F1 · Audit de errores + Grafo reconstruido
**Bugs encontrados y corregidos en el Grafo (`notes-brain.js`):**
- 🔴 *Tag-edge explosion*: el grafo dibujaba una arista por CADA par de notas que compartía CUALQUIER tag → 10 notas con 'study' = 45 aristas = hairball ilegible.
- 🟡 Notas diarias (`type:'daily'`) se incluían como nodos — son inbox, no conocimiento.
- 🟡 Layout radial puro · labels solapados pasados ~12 nodos.

**Solución — Grafo v2 (tag-clustered):**
- Tags pasan a ser **clusters espaciales + color**, NO líneas. Cada tag = sector angular · nodos distribuidos en 2 arcos concéntricos.
- Aristas = SOLO `[[wiki-links]]` (líneas violeta) · dedup por par.
- Solo `type:'note'` (diarias excluidas).
- Filtro por tag (chips toggle) · hover resalta nodo + vecinos y atenúa el resto · tamaño de nodo por grado · labels de sector.
- Detección de huérfanas (sin tag ni link).

### ✅ F2 · Edición de notas (gap crítico)
- **Bug confirmado:** `notes.html` no tenía `editNote` — las notas eran create-only · imposible cambiar título/cuerpo/tags tras crearlas.
- **Solución:** objeto `Editor` en notes-brain.js · modal de edición (título + tags toggle + cuerpo) · botón "✏️ Editar" en la action-bar hover de cada nota (junto a 🃏 Flashcard).
- `window.NOT.edit(id)` expuesto en el CLI.

### Archivos (F1+F2)
- `frontend/js/notes-brain.js` (Graph reescrito · Editor nuevo · afterRenderNotes con action-bar).

### ✅ F3 · Estándar de notebooks (`nb-engine.js`)
- Nuevo `frontend/js/nb-engine.js` — define EL ESTÁNDAR canónico de notebooks.
- `NBEngine.SCHEMA`: meta `{id,name,icon,cover,color,created,updated}` · data `{[id]:{pages:[{id,title,body,images,attachments,links,created,updated}]}}`.
- `NBEngine.MODULES`: registry de los 3 módulos con notebooks (13-NOT · 10-SYS · 14-WORK) y sus storage keys.
- API: `list(mod)` · `loadMeta/loadData(mod)` · `validate(nb)` · `normalize(nb)` · `transfer()` · `transferUI()`.
- Decisión: NO se reescribieron los 3 IIFEs (NotNB/WorkNB/SysNB) — eso era refactor riesgoso de alto costo/bajo valor. En su lugar nb-engine.js documenta el estándar (los 3 schemas YA eran idénticos) y agrega la capa de portabilidad encima.

### ✅ F4 · Mover notebooks entre módulos
- `NBEngine.transfer(nbId, from, to)` — MUEVE (no copia) un notebook: meta + data bucket entre storage keys · borra del origen.
- Los binarios (attachments/imágenes) viven en IndexedDB `da2026_nb` GLOBAL → los refs viajan en el page data · no hay que mover blobs.
- `NBEngine.transferUI()` — modal selector de módulo destino.
- Botón "📦 Mover" wireado en los 3 módulos: NotNB (13-NOT) · WorkNB (14-WORK) · NB custom notebooks (10-SYS).
- **Bug prevenido:** 10-SYS usa `isCustom()` = `id.startsWith('cnb_')`. transfer() re-idea el notebook con prefijo `cnb_` al entrar a 10-SYS (registry `requirePrefix`).
- Las 6 storage keys ya estaban en SYNC_REGISTRY → los moves sincronizan cross-device.

### Archivos (F3+F4)
- `frontend/js/nb-engine.js` (NUEVO).
- `frontend/js/notes-nb.js` · `frontend/js/work.js` · `frontend/systems_logic.js` (botón Mover + función moveNotebook + export).
- `frontend/notes.html` · `work.html` · `systems.html` (carga de nb-engine.js).

### ✅ F5 · Portadas + iconos rediseñados (`nb-shared.css`)
- **12 portadas reconstruidas** — cada una ahora layerea: gradiente base + textura + sheen de luz top-left + vignette para profundidad. Se ven diseñadas, no planas.
- **Cover card** (header del notebook): glass spine lateral (highlight→sombra) · overlay de sheen + vignette · sombra con inset highlight · hover lift.
- **Icono del cuaderno**: ahora va dentro de un **badge circular de vidrio esmerilado** (backdrop-blur + borde + sombra) → cualquier emoji se ve intencional y pulido sin tener que migrar a SVG.
- **Icon picker**: botones más grandes (38px) · gradiente · hover spring (scale+lift) · active glow violeta · focus-visible.
- Picker grid: check ✓ en la portada seleccionada · sheen en cada opción.

### ✅ F6 · Fluidez + microinteracciones (`nb-shared.css`)
Bloque FLUIDITY agregado · transiciones en todo el ecosistema notebook:
- Page entries · hover slide.
- Toolbar / rich-text buttons · spring press (cubic-bezier overshoot) + active scale.
- Image cards · zoom-in lift + brightness al hover.
- Attachment chips + link rows · slide affordance.
- Saved badge · pulse-in suave.
- Page editor · fade-up al abrir página (`nbFadeUp`).
- Modales (drop + design) · scale-in (`nbModalIn`).

### Archivos (F5+F6)
- `frontend/css/nb-shared.css` (covers v2 · icon picker · bloque FLUIDITY).

### 🏁 Sprint notebook overhaul · COMPLETO (6/6 fases)
| Fase | Estado |
|---|---|
| F1 · Audit + Grafo reconstruido | ✅ commit 222a105 |
| F2 · Edición de notas | ✅ commit 222a105 |
| F3 · Estándar nb-engine | ✅ commit 4e8ee2f |
| F4 · Mover entre módulos | ✅ commit 4e8ee2f |
| F5 · Portadas + iconos | ✅ (este commit) |
| F6 · Fluidez | ✅ (este commit) |

---

## 📝 13-NOT · Second Brain Layer · 5 fases (prompt 13-NOT.P3) — 2026-05-19b

### Origen
Ejecución del prompt curado `13-NOT.P3` (creative · Modelo.md). El usuario eligió "ejecutar las 5 fases en el orden más óptimo".

### Orden ejecutado (por dependencias)
**5 → 2 → 3 → 4 → 1** (CLI foundation → wiki-links → SRS pipeline → canvas → AI organizer capstone).

### Qué se construyó
Nuevo `frontend/js/notes-brain.js` (33K · IIFE `NOT` + `window.NOT` CLI) cargado al final de `notes.html`. Las notas pasan de lista plana taggeable a base de conocimiento conectada.

**F1 · CLI + Daily Note** (idea #5)
- Migración: cada nota de `sb_notes2` recibe `id` estable (antes se direccionaban por índice de array · frágil).
- Nota del día (`type:'daily'`) como inbox de captura rápida · card inyectada arriba de la pestaña "Todas".
- `window.NOT.{all,get,search,create,append,today,capture,link,backlinks,toFlashcard,graph,organize,showOrganizer,deepPrompt}`.

**F2 · Wiki-links** (idea #2 · Karpathy/wiki)
- Sintaxis `[[título de nota]]` en el cuerpo · render clickable (existe = violeta · no existe = rojo).
- Autocomplete al escribir `[[` en el editor `#nBody`.
- Footer de backlinks ("↩ Mencionada en") por nota.

**F3 · Notes → SRS** (idea #3)
- Botón 🃏 Flashcard por nota (hover) → modal (front/back editables) → tarjeta al deck `eng_srs_deck` (box 1 Leitner · campo `sourceNoteId`).
- Reusa el schema de srs.js sin tocar ese archivo.

**F4 · Knowledge Graph** (idea #4 · JSON Canvas)
- Nuevo tab "🗺️ Grafo" · SVG radial · nodos = notas · aristas = wiki-links (sólida) + tags compartidos (punteada).
- Color por tag · tamaño de nodo por grado · detección de huérfanas · click nodo → salta a la nota.

**F5 · Karpathy Organizer** (idea #1)
- Botón "🧹 Ordená mi cerebro" → panel con análisis heurístico LOCAL:
  - Near-duplicados (similitud Jaccard >50%).
  - Tags sugeridos (keyword matching) · aplicar con un click.
  - Links sugeridos (una nota menciona el título de otra) · enlazar con un click.
  - Notas huérfanas (sin tag/link/backlink).
- Botón "📋 Copiar prompt Karpathy" → genera prompt para reorganización profunda con IA en Claude Code (bridge al agente real).

### Archivos
- `frontend/js/notes-brain.js` (NUEVO · 33K).
- `frontend/notes.html` (6 ediciones quirúrgicas: `id` en saveNote · `data-note-id` + hook en renderNotes · tab Grafo · panel · script · `onNotesChanged` hook).

### Decisiones de diseño
- Cero cambios a SYNC_REGISTRY: `sb_notes2` y `eng_srs_deck` ya estaban registrados.
- Local-first estricto: el Organizer es heurístico (Jaccard + keywords) · sin APIs externas · el "deep reorg" es opt-in vía prompt copiado.
- Ediciones a `notes.html` mínimas (6 quirúrgicas) · el grueso vive en notes-brain.js · no se tocó notes-nb.js (Cuadernos intactos).
- IDs estables: antes las notas se direccionaban por índice (frágil para links/grafo) · ahora `id` estable con migración retro-compatible.

### Sanity check
- ✅ `notes-brain.js` parsea (33314 chars).
- ✅ tab Grafo + panel + script integrados.

### Pendiente / próximo run de 13-NOT.P3
Ver `PROMPT_RUNS.md` ID:13-NOT.P3 · "Next": no reconstruir · nuevos ángulos (export grafo a 15-MM como jsMind real · realtime cross-device para nota del día · flashcard desde texto seleccionado · ejecutar el deep-reorg vía sub-agent).

---

## 🧠 2-APP · Second Brain Layer · 5 fases (prompt 2-APP.P3) — 2026-05-19a

### Origen
Ejecución del prompt curado `2-APP.P3` (tab 🧩 Módulos · creative · Modelo.md). El usuario eligió "trabajar las 5 ideas del brainstorm en el orden más óptimo".

### Qué se construyó
Nuevo archivo `frontend/js/app-second-brain.js` (33K · IIFE `APP` + `window.APP` CLI) cargado al final de `apply.html`. Convierte 2-APP de tool session-based efímero a sistema con memoria + automatización + aprendizaje.

**F1 · Foundation + CLI** (idea #4)
- Storage `app_analyses` (localStorage · TIER 2 · registrado en SYNC_REGISTRY de cloud-sync.js · cross-device).
- Hook sobre `runAnalysis()`: cada análisis se auto-snapshotea (company · role · jd · match · profile · outcome).
- Panel "historial de análisis" (últimos 20 · re-cargar · editar outcome · borrar) debajo del Analizador.
- CLI: `window.APP.{list,get,load,current,clear,exportAll,inbox,showClipper,bookmarklet,setOutcome,insights,concepts,renderCanvas,analyze,weaveCV/Cover/Interview/Prompts}`.
- `APP.inbox(payload)` acepta JDs de fuentes externas (agentes · scrapers) → auto-analiza.

**F2 · Web Clipper** (idea #1)
- `APP.showClipper()` abre modal con bookmarklet generado dinámicamente.
- Bookmarklet captura URL + título + JD body (selectores LinkedIn/Indeed/Computrabajo + fallback) → abre `apply.html?clip=1&...`.
- Handler de URL params al cargar: prefilla form (parsea "Role at Company" del título).

**F3 · Outcome Coach** (idea #5)
- Editor de outcome por análisis (status: analyzed/applied/callback/interview/offer/rejected · salario pedido · notas).
- Motor de correlación 100% local (sin APIs externas): callback rate · skill lift (skills en positivos vs rechazos) · mejor industria · word-count promedio.
- Tab "📊 Coach" con panel de insights.

**F4 · Job Market Wiki** (idea #2 · Karpathy)
- Agregador de conceptos del corpus: skills que tenés / que el mercado pide / tactical / power words / red flags.
- Chips ordenados por frecuencia · drill-down modal (qué vacantes mencionan cada concepto).
- Tab "📚 Wiki".

**F5 · Career Canvas** (idea #3 · JSON Canvas)
- Pipeline visual de 6 columnas por outcome status · cada vacante = nodo · color por estado.
- Click nodo → editor de outcome. Cross-link con 5-JOB (`da_vacancies`): muestra overlap.
- Tab "🗺️ Canvas".

### Archivos
- `frontend/js/app-second-brain.js` (NUEVO · 33K).
- `frontend/apply.html` (3 tabs nuevos · 3 paneles · history container · `<script>`).
- `frontend/js/cloud-sync.js` (`app_analyses` agregado a SYNC_REGISTRY).

### Decisiones de diseño
- `app_analyses` separado de `da_vacancies` (5-JOB): el primero es cache de TODOS los análisis · el segundo solo las que el user trackea formalmente. Cross-link, no merge.
- Local-first estricto: el Coach no llama ninguna API externa · todo el análisis corre en el browser.
- Reusa Design System v1.0 (tokens · sin hex) · reusa el tab-switch genérico de apply.js (los 3 tabs nuevos funcionan sin tocar apply.js).
- Hook no invasivo sobre `runAnalysis` (wrap · `window._appHooked` guard contra doble-hook).

### Sanity check
- ✅ `app-second-brain.js` parsea (32966 chars).

### Pendiente / próximo run de 2-APP.P3
Ver `PROMPT_RUNS.md` ID:2-APP.P3 · "Next": no reconstruir · elegir nuevo ángulo (export a 15-MM · clustering Karpathy de conceptos · cron de re-scoring · realtime cross-device para app_analyses).

---

## 🌐 Prompt Lab · Fase D · English + compact + execution tracking — 2026-05-15o

### Qué pidió el usuario
- Prompts en INGLÉS (los previos eran mix Spanish/English).
- `desc` (UI summary) puede quedar en Spanish — los **bodies completos** en English.
- Token-saving es prioridad #1.
- Cada ejecución debe **quedar registrada** para que la próxima vez que el mismo prompt corra, Claude sepa qué se hizo y no repita.

### Solución entregada

**1. Nuevo archivo `PROMPT_RUNS.md`** (root del repo)
- Log central de ejecuciones por prompt-ID.
- Convención IDs: `{module-code}.P1/P2/P3` para los 48 modular · `LIB.{slug}` para Library (`LIB.recovery`, `LIB.bootstrap`, `LIB.bug-hunt`, `LIB.sync-audit`, `LIB.cross-module`, `LIB.capabilities-audit`).
- Template de entry estandarizado: `ID · Date · Commit · Files · Changed · Next`.

**2. `frontend/js/module-prompts.js` reescrito** (Fase D)
- Cada prompt body en **inglés compacto**.
- Cada prompt incluye:
  - `PRIOR RUNS: grep PROMPT_RUNS.md for "ID:..." before starting. EXTEND or take a NEW angle — never repeat.`
  - `LOG: append to PROMPT_RUNS.md` (template embebido).
- `desc` (UI) se mantuvo en Spanish para el user-facing.
- Tamaño: `module-prompts.js` pasó de 19.4K a 14.5K chars (~25% reducción) **incluyendo** los nuevos bloques PRIOR RUNS + LOG.
- Por prompt: ~2200 chars → ~1100 chars (50% reducción).

**3. Library `cat:'claude'` traducidas al inglés** (6 entries refactorizadas)
- `🔁 Full Context Recovery` (ID:LIB.recovery)
- `🧠 CEREBRO Bootstrap` (ID:LIB.bootstrap)
- `🐛 Bug Hunt periodic` (ID:LIB.bug-hunt)
- `🔄 Sync Audit periodic` (ID:LIB.sync-audit)
- `🧭 Cross-Module Wiring` (ID:LIB.cross-module)
- `🔌 Capabilities Audit` (ID:LIB.capabilities-audit)

Cada una con bloque PRIOR RUNS + LOG y `desc` en Spanish.

### Token-saving · medición
| Métrica | Antes (Fase A) | Ahora (Fase D) | Reducción |
|---|---|---|---|
| Body promedio P1 modular | ~2300 chars | ~1150 chars | **-50%** |
| Body promedio P2 audit | ~2400 chars | ~1200 chars | **-50%** |
| Body promedio P3 creative | ~3100 chars | ~1700 chars | **-45%** |
| 🐛 Bug Hunt library | ~2400 chars | ~1300 chars | **-46%** |
| 🧠 Bootstrap library | ~2300 chars | ~1500 chars | **-35%** |
| `module-prompts.js` total | 19.4K | 14.5K | **-25%** |

### Cómo funciona la memoria entre ejecuciones
1. Usuario pega el prompt (ej. `12-FIN.P1`).
2. Claude PRIMERO greppea `PROMPT_RUNS.md` por `ID:12-FIN.P1`.
3. Lee las N entradas previas · entiende qué se hizo · qué quedó pendiente.
4. Ejecuta la tarea EXTENDIENDO el trabajo previo (no repetir).
5. Al cerrar, append a `PROMPT_RUNS.md`:
   ```
   ### ID:12-FIN.P1 · 2026-05-20
   - Commit: abc1234
   - Files: frontend/finance.html
   - Changed: añadido gráfico de tendencia trimestral
   - Next: agregar export CSV de movimientos por categoría
   ```

### Sanity checks
- ✅ `prompts.html` inline JS parsea (135668 chars).
- ✅ `module-prompts.js` parsea (14468 chars).

### Pendiente · usuario decide
- Traducir los prompts NO-claude que están en Spanish (categorías `data`, `code`, `biz`, `learn`, `asistente`, `exam`) — son ~25 entries. ¿Necesarios o son OK Spanish?
- Aplicar el patrón PRIOR RUNS + LOG a esas ~25 entries Spanish (si el usuario las usa con Claude Code).

---

## 📚 Prompt Lab Overhaul · Fase C · Library refresh — 2026-05-15n

### Qué cambió
Limpieza + refresh del array `lib` (Librería) en `prompts.html`. Los prompts module-specific ahora viven en el tab **🧩 Módulos** (Fase A) · la Librería pasa a ser cross-cutting + templates universales + categorías de estudio.

### Eliminados (12 entries duplicados)
Los siguientes prompts estaban duplicados con el tab 🧩 Módulos:
- "Work on 3-ENG English Academy"
- "Work on 5-JOB Job Tracker"
- "Work on 10-SYS Systems Engineering"
- "Work on 11-ACC Accounting"
- "Work on 9-GOA / 12-FIN / 13-NOT"
- "Update Main Page"
- "⚙️ 10-SYS Sprint"
- "💰 12-FIN Sprint"
- "📝 13-NOT Sprint"
- "💼 5-JOB Sprint"
- "📚 3-ENG Sprint"
- "📋 Module Sprint Template"

### Refrescados (6 entries con estado actual)
- **🔁 Full Context Recovery** — reescrito con estado post-Fase 3 · Design System v1.0 vivo · 16 módulos · todas las capabilities listadas.
- **🧠 CEREBRO Bootstrap** — sumario actualizado: 16/16 migrados · Bug Hunt cerrado · Fase A+B · pre-reading expandido a CLAUDE.md + MEMORY.md + PROMPT_14-WORK.md.
- **Token Conservation Cheatsheet** — de 10 reglas a 12 · agregados los 16 module codes · agregadas reglas "delegá a sub-agents" + "worktree para refactors grandes".
- **🐛 Bug Hunt (periódico)** — convertido en template repetible · delegación a sub-agent Explore por defecto · checklist Design System v1.0 + WCAG.
- **🔄 Sync Audit (periódico)** — marcado como template · baseline post-Fase 3 (jt_s8, ruta_st, sys_active_custom YA registrados).
- **🎨 Design Audit (periódico)** — marcado como template post-Design System v1.0 · busca regresiones.
- **🎨 MASTER UX SPRINT** — marcado como HISTÓRICO · todas sus fases (1 + 2.1-2.6 + 3 + A + B) están cerradas. Sólo útil como reference template para el siguiente sprint maestro.

### Agregados (2 nuevos cross-cutting)
- **🧭 Cross-Module Wiring** — para features que tocan 2+ módulos (attachments compartidos · sync chain · realtime · data flow entre 10-SYS/13-NOT/14-WORK/15-MM). Protocolo plan-first · source-of-truth · sync registry check · componentes compartidos · tests cross-module.
- **🔌 Capabilities Audit** — audit de cuáles capabilities estoy aprovechando vs cuáles podría. Score 🟢🟡🔴 por tarea + top-3 capabilities infrautilizadas + recomendaciones.

### Resumen tabla
| Categoría `cat:'claude'` | Antes | Ahora |
|---|---|---|
| Total entries | 22 | **12** (-10 neto) |
| Module-specific (duplicados de 🧩 Módulos) | 12 | **0** |
| Cross-cutting (templates universales) | 10 | **10 refrescados + 2 nuevos = 12** |
| HTML/JS válido | ✅ | ✅ (138307 chars parse OK) |

### Estado del Prompt Lab (cierre Fase C)
- **🎯 Claude Optimize:** v2026-05-15.B con 17 módulos + 18 task types + 33 signals + bloque "Available Capabilities".
- **⚡ Optimize:** motor genérico de prompt engineering · sin cambios estructurales (Fase B mantuvo el contrato).
- **🧩 Módulos:** 48 prompts modulares (16 × 3) con files reales + storage keys reales + Modelo.md insights.
- **📚 Librería:** 12 prompts cross-cutting (templates universales) + ~25 prompts por dominio (data · code · biz · learn · asistente · exam · write).
- **🧠 Dominar Claude:** 10 reglas (sin cambios).
- **📜 Historial:** sin cambios.

### Cerrado · todo el sprint Prompts
Fases ejecutadas en una pasada (5 commits):
1. **Fase A** (6538368): 48 module prompts + nueva tab.
2. **Fase B** (39de577): Claude Optimizer v2026-05-15.B + capabilities awareness.
3. **Fase C** (este): Library refresh + clean up duplicados.

---

## ⚡ Prompt Lab Overhaul · Fase B · Claude Optimizer v2026-05-15.B — 2026-05-15m

### Qué cambió
Overhaul completo de `claudeOptimize()` y `populateOptDropdowns()` en `prompts.html` para reflejar el **estado actual del Cerebro** y exponer las **capacidades vigentes**.

### 1. Catálogo de módulos (CO_MODULE) — 100% reescrito
Antes: descripciones del estado pre-migración, faltaban módulos 1-IND, 2-APP, 4-RUT, 6-TOO, 7-NEW (sólo aliases legacy).
Ahora: 16 módulos + 6 aliases legacy + GENERAL. Cada entrada incluye:
- Status de migración Design System v1.0 (qué Fase 2.x cerró la migración)
- Files reales (con todos los archivos JS auxiliares · srs.js · nb-shared.js · module-prompts.js)
- Storage keys actualizadas (con `jt_s8`, `ruta_st`, `sys_active_custom` registrados en Fase 3)
- Notas con identidades preservadas (14-WORK cyan · 15-MM violet --vi · 16-APA cyan)
- TIER 1 / TIER 2 / IndexedDB / Supabase Storage distinciones

### 2. CO_GLOBAL_FILES — refrescado
Agregados: `design-tokens.css`, `components.css`, `module-prompts.js`, `Modelo.md`.
Cloud-sync.js anotado con: SYNC_REGISTRY + DYNAMIC_PREFIXES + smartSync + realtime postgres_changes.
nb-shared.js anotado con: covers/icons/attachments + **Supabase Storage upload/download**.

### 3. CO_TASK_HINTS — 6 tipos nuevos
- `plan` (📐 Plan first · architecture)
- `agent` (🤖 Delegate to sub-agent · Explore/Plan/general-purpose/claude-code-guide)
- `skill` (🧰 Invoke Skill · docx/pdf/pptx/xlsx/claude-api/simplify/update-config/loop/schedule)
- `schedule` (⏰ Schedule recurring · CronCreate/ScheduleWakeup/scheduled-tasks)
- `worktree` (🌿 Isolate · Agent isolation: "worktree")
- `mcp` (🔌 Use MCP capability · Chrome/Preview/ccd/scheduled-tasks)

Cada uno con constraints específicos (cuándo usar · qué evitar · gotchas).

### 4. CO_SIGNALS — 14 señales nuevas
Detección automática de palabras clave que activan recomendaciones de:
- Design System v1.0 (--radius/--transition/--shadow-glow/focus-visible)
- Plan mode (architect/exit plan/plan first)
- Sub-agents (subagent/delegate/explore agent)
- Worktrees (isolated branch/git worktree)
- Skills (anthropic-skills/invoke skill)
- TodoWrite (track progress/multi-step)
- Schedule (cron/loop/recurring/periodic)
- spawn_task (out of scope/flag for later)
- mark_chapter (phase shift/new phase)
- Chrome MCP (browser automation/transcript/Drive)
- Preview MCP (preview/screenshot/UI test)
- Realtime (postgres_changes/cross-device)
- Modelo.md (Obsidian/second brain/karpathy/json canvas)
- Memory persistence (consolidate/MEMORY.md)

### 5. Spec template — sección "Available Capabilities"
Nuevo bloque agregado a ambos modos (concise + full) que lista las herramientas disponibles agrupadas por categoría:
Sub-agents · Worktrees · Skills · MCP · TodoWrite · ScheduleWakeup · CronCreate · spawn_task · mark_chapter · ShareOnboardingGuide.

### 6. UI refresh
- Dropdown de módulos: orden 1-16 sin aliases legacy (los aliases siguen en CO_MODULE para compat backward).
- Dropdown de task types: 6 nuevos.
- Tip banners actualizados (Claude Optimizer menciona v2026-05-15.B y todas las capabilities; Optimize menciona el pipeline + tab Módulos).

### CO_VERSION
`2026-04-27.8` → `2026-05-15.B`

### Pendiente · Fase C
- Library refresh: los prompts `cat:'claude'` legacy (Work on 3-ENG / Work on 5-JOB / etc.) ahora viven en el nuevo tab **🧩 Módulos**. Toca: archivar/eliminar los duplicados del array `lib` o renombrarlos a "Quick Templates" más conciso.

---

## 🧩 Prompt Lab Overhaul · Fase A · 48 prompts modulares — 2026-05-15l

### Qué cambió
Nueva pestaña **🧩 Módulos** en 8-PRO (`prompts.html`). 16 módulos × 3 prompts = **48 prompts curados** generados sobre el estado real del Cerebro post-Fase 3.

### Estructura por módulo (los 3 prompts)
- **P1 · ⚡ Mejorar / Optimizar / Actualizar** — workflow productivo: Plan first → Edits quirúrgicos → sync + CEREBRO_STATE + commit.
- **P2 · 🔬 Audit · Bugs · Updates** — checklist read-only de 6 categorías: código · sync · Design System v1.0 · UX · datos · alignment con CEREBRO_STATE.
- **P3 · 🧠 Creativo · Second Brain Model** — aplicación de las 5 técnicas extraídas de `Modelo.md` (Karpathy method · Web Clipper · JSON Canvas Skill · CLI/Skills · Local-first/Plugins) al módulo. Output en 2 pasos: brainstorm (5 ideas con esfuerzo S/M/L) → blueprint técnico (diff arq + schema + UI mock + riesgos).

### Archivos
- `frontend/js/module-prompts.js` (NUEVO) — data structure + renderer + auto-init DOMContentLoaded.
- `frontend/prompts.html` (modificado) — tab `🧩 Módulos` + panel `#p-modules` (selector + container) + carga del script.

### Cada prompt incluye obligatoriamente
- `REPO` · `LIVE` · `STACK` · `ARCH` · `AUTH chain` · `STATE cycle` · `SYNC` · `DESIGN SYSTEM v1.0`
- Files reales del módulo (post-migración)
- Storage keys reales (post sync audit · incluye `jt_s8` agregado en Fase 3)
- `MANDATORY al cerrar`: verificar SYNC_REGISTRY · update CEREBRO_STATE.md · commit `feat/fix([CODE])` · push origin main

### Modelo.md (Obsidian Second Brain) → P3 mapping
- A) **Karpathy method** · agente IA estructura volcado bruto en wiki/concepts/entities/sources
- B) **Web Clipper** · captura externa estructurada con metadata
- C) **JSON Canvas Skill** · visualización estratégica auto-generada (knowledge graph)
- D) **CLI · Skills** · API JS expuesta como `window.MOD.xxx` para agentes IA externos
- E) **Local-first · Plugins** · todo funciona sin red · sync es decoración

Ejemplos pre-cocinados para inspirar (no copiar literal):
- 10-SYS: Karpathy method para transcripts de clases
- 13-NOT: JSON Canvas mapa visual entre cuadernos
- 5-JOB: Web Clipper de vacantes desde LinkedIn → jt8
- 12-FIN: Local-first AI para categorización (privacy first)
- 14-WORK: CLI exponiendo `work.cases.create/link/relate`

### Pendiente · Fase B (próxima)
- Overhaul de `optimize()` + `claudeOptimize()` con las capacidades actuales (Plan mode · Worktrees · Sub-agents · Skills · MCP · TodoWrite · ScheduleWakeup · spawn_task · mark_chapter)
- Library refresh: pasar los prompts genéricos a un layer "templates universales" y mover los module-specific al nuevo tab

---

## 🐛 Fase 3 · Bug Hunt — 2026-05-15k

### Auditoría sistemática (delegada a Explore agent)
Scan completo del frontend buscando: tokens CSS sin definir, colisiones `.ds-*`, `getElementById` rotos, gaps en SYNC_REGISTRY, refs `script src`/`link href` rotas.

### Hallazgos en producción (16 módulos migrados) → CORREGIDOS
1. **`--c0` undefined en 10-SYS** (`systems.html:387,396`) — usado en `.cnb-selector-sel` y `.pim-modal`. **Fix:** agregado alias `--c0: var(--color-bg)` en `design-tokens.css`.
2. **`jt_s8` no estaba en SYNC_REGISTRY** — timestamp de inicio del Job Tracker (cuenta de días). **Fix:** agregado a `cloud-sync.js` para sync cross-device.

### Hallazgos descartados (falsos positivos o intencionales)
- `--rc` en `accounting.css:129-130` — **Intencional.** Se inyecta inline por card via `style="--rc:colorX"` en `accounting.js:355`. No es bug.
- `fin_sav_goal`, `fin_2026-04` "missing from SYNC_REGISTRY" — **Capturados por `DYNAMIC_PREFIXES = ['fin_', ...]`** en `cloud-sync.js:307`. No es bug.
- `navXP` en `accounting.js:222` — **Tiene null-check** (`if (xpBdg)`), falla silenciosamente. Dead code de un diseño previo, sin impacto en usuario.
- `work_eco_dict_seed_v` — Documentado como "local only" en `work.js:958`. Intencional.

### Hallazgos en módulos LEGACY (no producción)
- `css/main.css` + `css/auth.css` + `pages/*.html` — 45 tokens undefined (`--fb`, `--fh`, `--ink*`, `--txt*`, `--acid`, `--sky`, `--mint`, `--ember`, etc).
- **Decisión:** estos archivos están en `frontend/pages/` (configurar, empleos, ingles, prompts, proyectos, recursos, ruta, sesion, tacticas) — son **vestigios pre-DA-2026** no enlazados desde el dashboard actual. No bloquean nada de producción. Si en algún momento se decide rescatarlos, se migran. Por ahora: ignorar.

### Resumen tabla
| Categoría | Status | Acción |
|---|---|---|
| Tokens undefined (producción) | 🟢 1 → 0 | `--c0` aliasado |
| Colisiones `.ds-*` | ✅ Clean | — |
| `getElementById` rotos | 🟡 1 (silencioso) | sin acción (null-check) |
| Gaps SYNC_REGISTRY | 🟢 1 → 0 | `jt_s8` agregado |
| Refs `src`/`href` rotas | ✅ Clean | — |
| Tokens legacy en `pages/*` | 🟡 45 | sin acción (archivos obsoletos) |

### Lo que aprendí
- Después de una migración masiva (16 módulos al Design System v1.0), un audit estructurado revela menos bugs de lo esperado. El patrón "remover `:root` + dejar que aliases cubran legacy" funcionó.
- Los pocos hallazgos verdaderos (`--c0`, `jt_s8`) eran edge cases razonablemente difíciles de prever.
- `DYNAMIC_PREFIXES` es una arma poderosa — captura todas las variantes `fin_*` sin enumerarlas. Vale la pena documentarla mejor en `CLAUDE.md`.

### Pendiente
- Decidir destino de `frontend/pages/*.html` legacy: ¿archivar (`pages/_legacy/`) o migrar también? **Sugerencia:** archivar — ya no están enlazados desde ninguna parte del dashboard activo.

---

## 🏁 Fase 2.6 · Todos los P2 migrados · DESIGN SYSTEM v1.0 CERRADO — 2026-05-15j

### Qué cambió
Última tanda — siete migraciones P2 en una sesión. **16/16 módulos** ahora corren sobre el Design System v1.0.

### Módulos migrados
| Código | Archivos | Notas |
|---|---|---|
| 2-APP | `apply.html` + `css/apply.css` | imports + remove :root + refinar .tab/.card/.btn/.txa/.inp |
| 4-RUT | `ruta.html` (inline) | imports + remove :root inline + refinar .rt-card |
| 11-ACC | `accounting.html` + `css/accounting.css` | imports + remove :root + refinar .tab (verde --em) y .btn (texto #001f0d) |
| 6-TOO | `tools.html` (inline) | imports + remove :root + refinar .tab/.card |
| 7-NEW | `news.html` (inline) | imports + remove :root + refinar .tab/.btn |
| 15-MM | `mindmap.html` + `css/mindmap.css` | imports + reducir :root a `--vi` local + refinar .btn/.inp/.mm-tab |
| 16-APA | `apa.html` + `css/apa.css` | imports + reducir :root a cyan local + refinar .btn (texto cyan #001518) |

### Pattern aplicado
- `<link>` design-tokens.css + components.css agregados antes del CSS local.
- `:root{...}` removidos completos (excepto overrides locales legítimos: --vi en 15-MM, cyan en 16-APA).
- Reset `*{margin:0...}` removido (heredado del sistema).
- `.tab`/`.card`/`.btn`/`.inp`/`.txa` refinados con `--radius-md/sm`, `--transition-fast`, `--shadow-glow`, focus-visible global.
- Botones verdes con texto `#001f0d` para contraste WCAG AA.
- Botones cyan (16-APA) con texto `#001518`.

### Matriz final 16/16 ✅
| # | Código | Módulo | Fase |
|---|---|---|---|
| 1 | 1-IND | Dashboard | 2.1 |
| 2 | 14-WORK | Simetrik Hub (cyan) | 2.2 |
| 3 | 10-SYS | Systems Engineering (glass) | 2.3 |
| 4 | 13-NOT | Notes | 2.4 |
| 5 | 12-FIN | Finance | 2.4 |
| 6 | 8-PRO | Prompt Lab | 2.5 |
| 7 | 3-ENG | English Academy | 2.5 |
| 8 | 5-JOB | Job Tracker | 2.5 |
| 9 | 9-GOA | Goals & Habits | 2.5 |
| 10 | 2-APP | Application Center | 2.6 |
| 11 | 4-RUT | Ruta Data Analyst | 2.6 |
| 12 | 11-ACC | Accounting (verde --em) | 2.6 |
| 13 | 6-TOO | Tools | 2.6 |
| 14 | 7-NEW | News | 2.6 |
| 15 | 15-MM | Mind Map Studio | 2.6 |
| 16 | 16-APA | APA Studio (cyan) | 2.6 |

### Pendiente
- **Fase 3** (Bug Hunt): scan sistemático de la pagina entera buscando errores, regressions, consola con warnings.

---

## 🎯 Fase 2.5 · Todos los P1 migrados (8-PRO + 3-ENG + 5-JOB + 9-GOA) — 2026-05-15i

### Qué cambió
Cuatro migraciones en una sesión. **Grupo P1 completo:** 9/16 módulos ahora corren sobre el Design System v1.0.

### 8-PRO · Prompt Lab
**Archivo:** `frontend/prompts.html` (CSS inline)
- Imports `design-tokens.css` + `components.css` agregados.
- `:root{}` removido del bloque inline.
- `.tabs`/`.tab`: focus-visible con shadow-glow; transiciones específicas.
- `.card`: hover con `--bd2`; radio `--radius-md`.
- `.btn` (bp/bo/bg): focus-visible; hover lift + brightness; `.bg` texto `#001f0d` para contraste.
- `.textarea`/`.select`: focus con shadow-glow.
- `.result`: radio `--radius-md`.
- `.prompt-card`: focus-visible añadido; transiciones específicas (translateX preservado).
- `.cat-btn`: focus-visible añadido.

### 3-ENG · English Academy
**Archivos:** `frontend/english.html` + `frontend/css/english.css`
- Imports agregados en HTML.
- `:root{}` removido de CSS; reset `*{margin:0...}` removido.
- `.tabs`/`.tab`: focus-visible; transiciones específicas.
- `.card`: hover con `--bd2`.
- `.btn` (bp/bo): focus-visible; primary con hover lift + brightness.
- `.ein` / `.note-area`: focus con shadow-glow.

### 5-JOB · Job Tracker
**Archivos:** `frontend/jobs.html` + `frontend/css/jobs.css`
- Imports agregados en HTML.
- `:root{}` removido de CSS; reset `*{margin:0...}` removido.
- `.tabs`/`.tab`: focus-visible con shadow-glow.
- `.card`: hover con `--bd2`.
- `.btn` (bp/bo/bg): focus-visible; hover lift + brightness; `.bg` texto `#001f0d`.
- `.inp`: focus con shadow-glow.

### 9-GOA · Goals & Habits
**Archivos:** `frontend/goals.html` + `frontend/css/goals.css`
- Imports agregados en HTML.
- `:root{}` removido de CSS; reset `*{margin:0...}` removido.
- `.tabs`/`.tab`: focus-visible con shadow-glow.
- `.cd`: hover con `--bd2`; transición específica.
- `.btn` (bp/bo/bg): focus-visible; hover lift + brightness; `.bg` texto `#001f0d`.
- `.inp`/`.sel`: focus con shadow-glow.
- `.goal`: hover con `translateY(-1px)` (antes solo cambiaba borde).

### Matriz de migración actualizada (9/16)
| Código | Módulo | Estado | Fase |
|---|---|---|---|
| 1-IND | Dashboard | ✅ Migrado | 2.1 |
| 14-WORK | Simetrik Hub | ✅ Migrado (cyan) | 2.2 |
| 10-SYS | Systems Engineering | ✅ Migrado (glass) | 2.3 |
| 13-NOT | Notes | ✅ Migrado | 2.4 |
| 12-FIN | Finance | ✅ Migrado | 2.4 |
| 8-PRO | Prompt Lab | ✅ Migrado | 2.5 |
| 3-ENG | English Academy | ✅ Migrado | 2.5 |
| 5-JOB | Job Tracker | ✅ Migrado | 2.5 |
| 9-GOA | Goals & Habits | ✅ Migrado | 2.5 |
| 2-APP | Application Center | ⏳ Pendiente (P2) | 2.6 |
| 4-RUT | Ruta DA | ⏳ Pendiente (P2) | 2.6 |
| 11-ACC | Accounting | ⏳ Pendiente (P2) | 2.6 |
| 6-TOO | Tools | ⏳ Pendiente (P2) | 2.6 |
| 7-NEW | News | ⏳ Pendiente (P2) | 2.6 |
| 15-MM | Mind Map | ⏳ Pendiente (P2) | 2.6 |
| 16-APA | APA | ⏳ Pendiente (P2) | 2.6 |

### Lo que aprendí
- Patrón de migración estabilizado: imports → remove `:root` + reset `*` → refinar tabs/card/btn/inp con tokens + focus-visible.
- 4 módulos en una sesión es viable cuando comparten patrón violeta global (no hay overrides de color).
- Mantener transiciones específicas en lugar de `transition:all` mejora performance y previene flashes.

### Pendiente inmediato
- **Fase 2.6** (P2 · 7 módulos): 2-APP, 4-RUT, 11-ACC, 6-TOO, 7-NEW, 15-MM, 16-APA.
- **Fase 3** (Bug Hunt): scan sistemático.

---

## 📝💰 Fase 2.4 · 13-NOT + 12-FIN migrados · P0 CERRADO — 2026-05-15h

### Qué cambió
Cuarta y quinta migración en una sola sesión. **Grupo P0 completo:** los 5 módulos más usados ahora corren sobre el Design System v1.0.

### 13-NOT · Notes & Journal
**Archivo:** `frontend/notes.html`
- Agregados imports de `design-tokens.css` + `components.css` ANTES de `nb-shared.css`.
- `:root{}` removido completo · todos los tokens vienen del sistema vía aliases.
- Body conserva familia `IBM Plex Sans`.

**Microinteracciones:**
- `.tab`: focus-visible con shadow-glow; transiciones específicas.
- `.cd` (cards): hover con `--bd2`; transición `border-color`.
- `.btn` (bp/bo/bg): focus-visible; primary y green con hover lift + brightness.
- `.bg`: texto oscuro `#001f0d` para mejor contraste.
- `.inp` / `.txa`: focus con `shadow-glow` violeta + transiciones específicas.
- `.note`: hover con `translateY(-1px)` + shadow-md + border violeta (antes solo cambiaba borde).
- `.search-inp`: focus con shadow-glow.
- `.ftag` (filter tags): radio `--radius-full` (pill); focus-visible; opacity más visible al hover.
- `.stats` / `.st`: hover con cambio de fondo; valor en violeta `--a2`.

### 12-FIN · Finanzas Personales
**Archivos:** `frontend/finance.html` + `frontend/css/finance.css`
- Imports agregados en `finance.html`.
- `:root{}` removido completo de `finance.css`.
- Reset `*{margin:0...}` removido (viene del sistema).

**Microinteracciones:**
- `.mn-btn` (month nav): focus-visible con shadow-glow; transiciones específicas.
- `.kpi` (Ingresos/Gastos/Balance/Ahorro): hover con `translateY(-1px)` + borde más visible.
- `.tab`: focus-visible con shadow-glow.
- `.cd` (cards): hover con `--bd2`.
- `.btn` (bp/bg/br): hover con `translateY(-1px)` + brightness; focus-visible; primary y green con texto contrastado.
- `.inp`: focus con shadow-glow.
- `.sel`: focus con border violeta + transiciones.
- `.cat-btn` (toggle categorías): focus-visible; hover con cambio de color.

### Lo que NO se tocó (ambos módulos)
- HTML estructural (panels, forms, listas de transacciones).
- JavaScript (lógica de notes, journal, SRS Leitner, finanzas, KPIs, gráficos).
- `nb-shared.css` (compartido con 10-SYS y 14-WORK).
- Auth chain.

### Archivos modificados
- ✏️ `frontend/notes.html` (imports + microinteracciones en estilos inline)
- ✏️ `frontend/finance.html` (imports + 3 nuevos `<link>` tags)
- ✏️ `frontend/css/finance.css` (reducción de `:root`, microinteracciones)

### Validación visual
1. **13-NOT** · https://mikel696.github.io/da-2026/frontend/notes.html
   - Tab por inputs/botones/notes → focus ring violeta.
   - Hover sobre notas → lift sutil + shadow + borde violeta.
   - Filter tags (pills) → focus-visible.
2. **12-FIN** · https://mikel696.github.io/da-2026/frontend/finance.html
   - Hover sobre KPIs → lift sutil.
   - Tab por month-nav buttons / tabs / inputs → focus rings.
   - Botones primary/success/danger con feedback de hover mejorado.

### 🎯 Estado actual del migrado · 5/16 módulos · P0 CERRADO

| # | Módulo | Migrado | Identidad | Fase |
|---|---|---|---|---|
| 1 | 1-IND index.html | ✅ | violeta · rail/cards/stats | 2.1 |
| 2 | 14-WORK work.html | ✅ | **cyan local** · 13 tabs | 2.2 |
| 3 | 10-SYS systems.html | ✅ | violeta + glassmorphism | 2.3 |
| 4 | **13-NOT notes.html** | **✅** | violeta · journal + SRS | **2.4** |
| 5 | **12-FIN finance.html** | **✅** | violeta · KPIs + categorías | **2.4** |
| 6-16 | 11 módulos restantes | ❌ | P1/P2 pendientes | — |

### 🏁 P0 cerrado
Los 5 módulos más usados del Cerebro corren sobre el Design System v1.0. La consistencia visual base (paleta · tipografía · espaciado · radios · sombras · transiciones · focus rings) está garantizada en el ~80% del tiempo de uso del usuario.

### Próximo · Fase 2.5 (P1)
4 módulos frecuentes:
- **3-ENG** english.html · English Academy + Interview Dojo
- **5-JOB** jobs.html · Job Tracker
- **9-GOA** goals.html · Objetivos & Hábitos
- **8-PRO** prompts.html · Prompt Lab

Después: Fase 2.6 (P2) con los 7 menos usados (2-APP, 4-RUT, 11-ACC, 6-TOO, 7-NEW, 15-MM, 16-APA).

---

## ⚙️ Fase 2.3 · 10-SYS Systems Engineering migrado al Design System — 2026-05-15g

### Qué cambió
Tercer módulo migrado. 10-SYS es el más visualmente rico de los P0 (glassmorphism · gradientes vi→em · semáforos P0-P4 · 8 tabs · Cuaderno v2 con IndexedDB). Se conservó toda la identidad visual y se conectó al sistema canónico.

### Decisión de identidad
- Accent: **violeta canónico** del sistema (`#8b5cf6`) — heredado vía aliases.
- Variables específicas del módulo conservadas en `:root` local:
  - `--vi` (violet-darker · `#7c3aed`) — gradientes
  - `--vi2` (violet-soft · `#a78bfa`)
  - `--vg` (violet-bg)
  - `--tl` (teal · `#2dd4bf`)
  - `--tlg` (teal-bg)
- Glassmorphism + gradientes + orbs **preservados intactos**.

### Archivos modificados
- ✏️ `frontend/systems.html` — agregados imports de `design-tokens.css` + `components.css` ANTES de `nb-shared.css`. `:root` reducido a las 5 variables específicas del módulo. Body conserva familia tipográfica `Outfit` propia (override del default).

### Microinteracciones aplicadas
| Componente | Mejora |
|---|---|
| **`.tabs` / `.tab`** | Border-radius y padding desde tokens; focus-visible con shadow-glow; transiciones específicas (no `all`). |
| **`.gc` (glass card)** | Transiciones específicas; border-radius desde token `--radius-lg`. Hover preserva glassmorphism. |
| **`.subj` (subject card)** | Border-radius desde token; hover con `translateY(-1px)` + borde más visible; focus-visible con glow. |
| **`.qa` (quick access)** | Border-radius desde token; hover con `shadow-lg` (en vez de sombra custom); focus-visible. |
| **`.cert` (certification)** | Hover con `translateY(-1px)`; transiciones específicas. |
| **`.cert-link` (botón cert)** | Hover con shadow violeta + lift; focus-visible con glow. |
| **`.tf-input` / `.tf-select` / `.tf-date` (task form)** | Focus con `shadow-glow` + border violeta; transiciones específicas. |
| **`.tf-btn` (task add)** | Hover con shadow violeta + lift; focus-visible con glow. |

### Tokens utilizados
- `var(--radius-sm/md/lg)` → 6px / 10px / 14px
- `var(--transition-fast/base)` → 120ms / 180ms
- `var(--shadow-glow)` → focus rings violetas
- `var(--shadow-lg)` → hover de quick access
- `var(--space-2/4/5)` → 8px / 16px / 24px (gaps)

### Lo que NO se tocó
- HTML estructural (las 8 tabs · dashboard · materias · calendario · malla · certificaciones · CUN hub · clases perdidas · cuaderno).
- JavaScript (`systems_logic.js` 2299 líneas · SEED_TASKS · VERIFIED_SUBJECTS · Tab 7 class session injector · Cuaderno v2 con IDB).
- nb-shared.css (compartido con 13-NOT y 14-WORK).
- Orbs glassmorphism (orb-1, orb-2, orb-3).
- Gradientes vi→em en tabs activos, botones, progress bars.
- Semáforos P0-P4 con colores y animación pulse.
- Auth chain.

### Validación visual
1. Abrí: https://mikel696.github.io/da-2026/frontend/systems.html
2. Click en las 8 tabs → gradiente violeta→verde mantiene su estética.
3. Tab por teclado sobre tabs/inputs/botones → focus ring violeta consistente.
4. Hover sobre subject cards → lift sutil + borde violeta más visible.
5. Hover sobre quick access → shadow grande.
6. Hover sobre botones del task form / cert-link → shadow violeta + lift.

### Estado actual del migrado · 3/16 módulos
| Módulo | Migrado | Accent | Identidad propia |
|---|---|---|---|
| 1-IND index.html | ✅ Fase 2.1 | violeta canónico | rail · cards · stats |
| 14-WORK work.html | ✅ Fase 2.2 | **cyan local** | tabs · MOIF · attachments |
| **10-SYS systems.html** | **✅ Fase 2.3** | **violeta + gradientes vi→em** | **glassmorphism · orbs · semáforos** |
| 13-NOT notes.html | ❌ | violeta (P0 pendiente) | — |
| 12-FIN finance.html | ❌ | violeta (P0 pendiente) | — |
| (resto · 11 módulos) | ❌ | — | — |

### Próximo
Quedan 2 módulos P0: **13-NOT** y **12-FIN**. Después arrancan los P1 (3-ENG, 5-JOB, 9-GOA, 8-PRO).

---

## 💼 Fase 2.2 · 14-WORK migrado al Design System (cyan local preservado) — 2026-05-15f

### Qué cambió
Segundo módulo migrado al Design System. 14-WORK es el módulo más activo del usuario (Simetrik Ecosystem · 13 tabs). Estrategia escogida: mantener **cyan** `#06b6d4` como accent local (identidad de marca Simetrik) pero conectar todo lo demás al sistema canónico.

### Decisión de identidad
- 14-WORK conserva cyan como accent local.
- `:root` del módulo ahora sobreescribe SOLO `--ac`, `--ac2`, `--acg`, `--a2`, `--ag` a cyan.
- Las demás tokens (`--bg`, `--bd`, `--tx`, `--gn`, `--rd`, `--am`, etc.) vienen del sistema canónico vía aliases.

### Archivos modificados
- ✏️ `frontend/work.html` — agregados imports de `design-tokens.css` + `components.css` ANTES de `nb-shared.css` y `work.css`.
- ✏️ `frontend/css/work.css` — refactor del `:root{}` a override reducido (solo cyan); body reset removido (viene del sistema); todos los radios y transiciones reemplazados por tokens.

### Microinteracciones aplicadas
| Componente | Mejora |
|---|---|
| **`.tabs` / `.tab`** | Border-radius y padding desde tokens; focus-visible con shadow-glow; tab activo usa cyan + texto oscuro `#001518` para mejor contraste; transiciones específicas (no `all`). |
| **`.btn` / `.bp` / `.bo` / `.bg`** | Hover con `transform:translateY(-1px)` + brightness; texto oscuro en primario y success para mejor contraste; focus-visible con glow ring. |
| **`.inp` / `.txa`** | Focus con `box-shadow:var(--shadow-glow)` + border cyan; transiciones específicas. |
| **`.item` (Cases/Errors/Learnings)** | Hover con `transform:translateY(-1px)` + shadow-md + border cyan; antes solo cambiaba borde. |
| **`.cd` (cards)** | Border-radius desde token + hover sutil con `--bd2`. |
| **`.stats` / `.st`** | Border-radius desde tokens; `.st:hover` con cambio de fondo. |
| **`.dict-row`** | Hover con fondo `--el`; focus-visible con glow; transiciones específicas en lugar de `all .12s`. |
| **`.result`** | Border-radius `--radius-md` desde token. |

### Tokens utilizados (resumen)
- `var(--radius-sm/md)` → 6px/10px (botones, inputs, items)
- `var(--transition-fast)` → 120ms (hover, focus)
- `var(--transition-base)` → 180ms (cards, layouts)
- `var(--shadow-glow)` → focus ring cyan
- `var(--shadow-md)` → hover de items
- `var(--space-5)` → 24px (gap entre stats y tabs)

### Lo que NO se tocó
- HTML estructural (las 13 tabs, el form de MOIF, los panels, etc).
- JavaScript (toda la lógica de WORK, eco, WorkNB, smartSync, etc).
- Subpáginas (`pages/simetrik-app.html`, `simetrik-playbook.html`, `simetrik-learn.html`) — esas se migran en una sub-fase futura si querés.
- nb-shared.css (estilos de notebooks compartidos con 10-SYS y 13-NOT).
- Auth chain.

### Validación visual
1. Abrí: https://mikel696.github.io/da-2026/frontend/work.html
2. Click en cualquier tab → activo en cyan + texto oscuro para mejor legibilidad.
3. Hover sobre cards de Casos/Errores/Aprendizajes → lift sutil + borde cyan + sombra.
4. Tab por inputs con teclado → focus ring cyan visible.
5. Hover sobre stats → cambio de fondo.
6. Diccionario: click en filas → focus consistente, hover con fondo.

### Estado actual del migrado · 2/16 módulos
| Módulo | Migrado | Accent | Estado |
|---|---|---|---|
| 1-IND index.html | ✅ | violeta canónico | Fase 2.1 |
| **14-WORK work.html** | ✅ | **cyan local** | **Fase 2.2** |
| 13-NOT notes.html | ❌ | violeta (P0 pendiente) | — |
| 10-SYS systems.html | ❌ | violeta (P0 pendiente) | — |
| 12-FIN finance.html | ❌ | violeta (P0 pendiente) | — |
| (resto · 11 módulos) | ❌ | — | — |

### Próximo
Fase 2.3 sugerida: 13-NOT · 10-SYS · 12-FIN en serie o el módulo que el usuario prefiera.

---

## 🏠 Fase 2 Pilot · 1-IND migrado al Design System v1.0 — 2026-05-15e

### Qué cambió
Primer módulo migrado al Design System. Estrategia de mínimo riesgo elegida:
1. Importar los 2 archivos canónicos (design-tokens.css + components.css) ANTES del `<style>` inline.
2. Remover el `:root{...}` duplicado del inline style (los aliases del system ya proveen TODAS las variables).
3. Reemplazar valores hardcoded de transición/radio por tokens (`var(--radius-md)`, `var(--transition-fast)`, `var(--shadow-glow)`).
4. Agregar `:focus-visible` styling consistente en `.mod`, `.ws-btn`, `.ws-input` (accesibilidad).
5. Footer link al showcase del Design System para QA rápido.

### Diff resumen
- Antes: `<style>:root{--bg:#09090b;--card:#16161a;...}` (duplicado, hardcoded en cada archivo del Cerebro).
- Después: `<link rel="stylesheet" href="css/design-tokens.css">` + el `:root` viene del archivo canónico.

### Microinteracciones mejoradas en index.html
- **`.mod` (cards de módulos)**: hover ahora usa `border-color:var(--ac)` + `transform:translateY(-3px)` + `box-shadow:var(--shadow-lg)`. Focus ring usa `--shadow-glow`. Más suave + más visible.
- **`.ws-btn` (Quick Workshop)**: focus-visible con shadow-glow violeta. Transiciones más rápidas (var(--transition-fast)).
- **`.ws-go` (botón Go)**: hover con `background:var(--ac2)` + lift. Antes flat sin feedback.
- **`.ws-input`**: focus muestra glow violeta consistente con el sistema.
- **`.task-btn` (Add tarea)**: hover con brillo + lift sutil.
- **`.qstat` (stats cards)**: hover con cambio de fondo. Valor numérico ahora usa color violeta `--ac2`.
- **Stats grid**: usa `var(--radius-md)` y `var(--space-6)` en lugar de valores fijos.

### Lo que NO se tocó
- HTML estructural (`<body>`, las cards, el rail, el iframe).
- JS (Cerebro router, pomo timer, RSS feed, etc).
- Auth chain.
- Cualquier funcionalidad del módulo.

### Archivos modificados
- ✏️ `frontend/index.html` (importa design system · :root removido · microinteracciones refinadas · footer link al showcase)

### Validación visual
1. Abrí: https://mikel696.github.io/da-2026/frontend/
2. Hover sobre cualquier card de módulo → debería levantarse con borde violeta y sombra suave.
3. Hover sobre los Quick Workshop → mismo efecto.
4. Tab por los botones con teclado → focus ring violeta visible en cada uno.
5. Footer abajo a la derecha: link "🎨 Design System v1.0" abre el showcase.

### Decisiones técnicas
1. **Mínimo riesgo, máximo valor:** no se reescriben componentes (`.mod`, `.ws-btn`, etc) como `.ds-btn`. Mantenemos el CSS específico del módulo y solo cambiamos su FUENTE de variables. Esto asegura cero regresiones visuales mientras conectamos al sistema canónico.
2. **Aliases hacen el trabajo pesado:** las variables viejas (`--card`, `--tx2`, `--ac`, `--em`) ya están definidas en `design-tokens.css` como aliases a los nuevos nombres. La página sigue funcionando idéntica.
3. **Microinteracciones suaves:** se aprovecha el sistema para STANDARIZAR transiciones (`var(--transition-fast)`) y focus rings (`var(--shadow-glow)`) en lugar de un sub-conjunto inconsistente.
4. **Footer link como QA shortcut:** mientras quede activo el sprint, tener un acceso de 1 click al showcase desde la home acelera la validación visual entre cambios.

### Estado actual del migrado
| Módulo | Migrado | Microinteracciones | Showcase link |
|---|---|---|---|
| 1-IND index.html | ✅ | ✅ refinadas | ✅ footer |
| 14-WORK work.html | ❌ pendiente Fase 2.2 | — | — |
| 13-NOT notes.html | ❌ pendiente | — | — |
| 10-SYS systems.html | ❌ pendiente | — | — |
| 12-FIN finance.html | ❌ pendiente | — | — |
| (resto · 11 módulos) | ❌ pendiente Fase 2.3/2.4 | — | — |

### Próximo paso
Fase 2.1 cerrada. Las opciones para Fase 2.2:
- 14-WORK (el módulo más activo del usuario · Simetrik)
- 13-NOT (segundo más usado · Notas + Journal)
- Otro módulo P0 a elección.

---

## 🎨 Fase 1 Master UX Sprint · Design System v1.0 entregado — 2026-05-15d

### Qué cambió
Ejecutada **Fase 1 (Design System)** del Master UX Sprint. Sistema canónico de diseño entregado como 4 archivos. Cero módulos migrados todavía (intencional · Fase 2 hace eso). Compatibilidad con CSS legacy preservada vía aliases.

### Hallazgo crítico previo (al hacer survey)
Inconsistencia de accent color entre módulos:
- `work.css` (14-WORK) → **cyan** `#06b6d4`
- `jobs.css` (5-JOB), `english.css` (3-ENG), `index.html` (1-IND), `notes.html` (13-NOT) → **violeta** `#8b5cf6`

**Decisión:** violeta `#8b5cf6` como **accent canónico** (4/5 ya lo usan). 14-WORK mantiene cyan localmente hasta su migración en Fase 2.

### Archivos creados
- ➕ `frontend/css/design-tokens.css` (NEW · 215 líneas)
  - Paleta: 8 colores semánticos (accent, cyan, green, emerald, amber, orange, red, pink, blue) con variantes soft + bg-bg
  - 9 neutros (bg, bg-2/3/4, border, border-2, text, text-2/3)
  - Tipografía: 3 familias (sans / mono / display) + 8 niveles + 4 weights + 3 line-heights
  - Espaciado: 9 niveles base 4px (4 → 96)
  - Radios: 6 niveles (sm 6 → full 9999)
  - Sombras: 5 niveles (sm/md/lg/xl/glow)
  - Transiciones: 3 velocidades + 2 easings
  - Z-index: escala de 7 capas
  - Layout widths: content/narrow/wide
  - **Aliases legacy completos** (--ac, --t2, --bd, etc → tokens nuevos) para no romper CSS viejo
  - Reset mínimo: box-sizing, scrollbar 4px, ::selection, :focus-visible default

- ➕ `frontend/css/components.css` (NEW · 320 líneas)
  - 10 componentes prefijados `.ds-*`: btn (5 variantes × 3 tamaños) · card (4 variantes) · input/textarea/select · label · badge (6 variantes) · toast (4 variantes) · modal (backdrop + container) · skeleton (shimmer) · tooltip (data-attribute) · nav (sticky header)
  - Typography helpers: ds-h1/h2/h3 · ds-text-* · ds-kicker
  - Layout utils: stack-2/3/4 · row-2/3/4 · grid-2/3/auto · flex-1 · divider · spacer
  - Animación canónica `.ds-fade-up`
  - Media query mobile <768px: grids colapsan a 1 columna, modal/toast full-width

- ➕ `frontend/css/DESIGN_SYSTEM.md` (NEW · documentación canónica)
  - Quick start con ejemplo end-to-end
  - Tablas de tokens (colores, tipografía, espaciado, radios, sombras, transiciones)
  - Documentación de cada componente con HTML de ejemplo
  - Sección de accesibilidad (focus, contraste, touch targets)
  - Plan de migración módulo por módulo
  - Decisiones cerradas (accent canónico violeta, prefijo .ds-* obligatorio)
  - Changelog

- ➕ `frontend/pages/design-system.html` (NEW · showcase live)
  - URL en producción: https://mikel696.github.io/da-2026/frontend/pages/design-system.html
  - 14 secciones interactivas con anchor nav sticky
  - Swatches de los 18 colores + 9 neutros con hex visible
  - Demostración de escala tipográfica con muestra de texto
  - Espaciado visualizado con barras
  - Radios + sombras en grid
  - Componentes funcionales: botones · cards · inputs · badges · toasts (click para activar) · modal funcional (Escape para cerrar) · skeleton · tooltip · tabla de utils
  - Sirve como QA visual: si algo se rompe acá, todo el Cerebro está roto

### Decisiones técnicas tomadas
1. **Prefijo `.ds-*` obligatorio** — evita colisiones con CSS legacy (.btn, .card existentes en los módulos no migrados).
2. **Aliases legacy completos** — los nombres viejos (--ac, --t2, --bd, etc.) apuntan a los tokens nuevos. CSS de módulos no migrados sigue funcionando sin cambios.
3. **Sin migración de módulos en esta fase** — Fase 1 solo entrega herramientas. Migración módulo por módulo viene en Fase 2 (P0 → P1 → P2).
4. **Accent canónico violeta `#8b5cf6`** — alineado con la mayoría existente. 14-WORK conserva cyan localmente.
5. **Showcase live como QA** — `design-system.html` es la prueba de regresión visual. Si los tokens cambian, se ve ahí primero.
6. **Sin Lucide todavía** — decidido posponer la migración de iconografía a una sesión dedicada (Fase 2.5 opcional). Las decisiones de UX no dependen de los iconos.

### Pendientes
- **Fase 2 (P0):** migrar 1-IND · 14-WORK · 13-NOT · 10-SYS · 12-FIN al design system.
- **Decisión iconografía:** mantener emojis vs migrar a Lucide SVG (recomendado, postpuesto).
- **Light theme:** opcionalmente agregar override `[data-theme="light"]` en design-tokens.css (no incluido v1.0).

### Cómo verificar
1. Abrí en producción: https://mikel696.github.io/da-2026/frontend/pages/design-system.html
2. Probá los toasts (botones de la sección 📢), abrí/cerrá el modal, hover en tooltips.
3. Si todo funciona y se ve coherente → Fase 1 OK. Lista para Fase 2.

---

## 🔄 Sync Audit ejecutado · 5 keys agregadas al SYNC_REGISTRY — 2026-05-15c

### Qué cambió
Ejecutada la **Fase 3 (Sync Audit)** del Master UX Sprint. Investigué cada key sospechosa antes de tocar el registry. Resultado: 5 keys agregadas (necesarias) · 4 confirmadas como falsos positivos (no requieren acción).

### Resultado del audit por key

| Key | Módulo | Decisión | Razón |
|---|---|---|---|
| `sb_tasks` | 1-IND Mission Control | ✅ **Agregada** | Usada en `news.html` línea 217-220 · widget de tareas rápidas · debe sync cross-device. |
| `sb_ws_hist` | 1-IND Workshop history | ✅ **Agregada** | Usada en `index.html` línea 205-206 · array de últimos 10 workshops invocados · sync útil. |
| `jt8` | 5-JOB Job Tracker | ✅ **Agregada** | Usada en `jobs.js` línea 300 + `apply.js` línea 715 · **MASTER KEY** del Job Tracker · CRÍTICO. |
| `sys_active_custom` | 10-SYS Systems | ✅ **Agregada** | Usada en `systems_logic.js` líneas 2231, 2236, 2258 · cuaderno custom activo seleccionado · scalar string. |
| `ruta_st` | 4-RUT Ruta Data Analyst | ✅ **Agregada** | Usada en `ruta.html` línea 488 · timestamp del start de la ruta · necesario para calcular streak cross-device. |
| `custom_prompts` | 8-PRO Prompt Lab | ❌ Falso positivo | LEGACY · `prompts.js` solo lo lee para migrar a `sb_prompts` (que YA está sync) y después hace `removeItem`. No requiere sync. |
| `sys_class_sessions` | 10-SYS Systems | ❌ Falso positivo | Usa **tabla dedicada (Tier 1)** vía `CLOUD.fullSync('class_sessions', ...)` en `systems_logic.js:1332`. Ya está en `SKIP_KEYS` correctamente. |
| `eng_conv_fsrs` | 3-ENG English | ❌ Falso positivo | Solo aparece en `refactor_engine.py` (script Python de refactorización ETL). No está en código JS runtime. |
| `sys_sys_class_sessions` | 10-SYS Systems | ❌ No bug activo | El typo doble prefijo **YA tiene migración en línea 1206 de `systems_logic.js`** que limpia automáticamente al cargar la página. Bug histórico ya resuelto. |

### Archivos modificados
- ✏️ `frontend/js/cloud-sync.js` (SYNC_REGISTRY · +5 keys con bloque comentado "Sync Audit fixes · 2026-05-15b")

### Impacto operativo
A partir de este commit, los siguientes datos sincronizan cross-device automáticamente:
- **Tareas del Mission Control** (1-IND) ya no se pierden al cambiar de PC
- **Historial de Workshops** (1-IND) viaja entre devices
- **Job Tracker completo** (5-JOB · todas tus vacancies/jobs) sincroniza
- **Cuaderno activo en Sistemas** (10-SYS) recuerda dónde estabas
- **Timestamp de inicio de la Ruta** (4-RUT) preserva el streak

### Validación recomendada
1. En PC A: agregar una tarea al Mission Control de 1-IND.
2. Refresh `index.html`.
3. En PC B: refresh → debería aparecer la tarea (sync automático por `INITIAL_SESSION` event).
4. Lo mismo para 5-JOB (crear una vacancy) y 10-SYS (cambiar cuaderno activo).

### Pendientes del Sync Audit
- Ninguno · audit cerrado para los hallazgos detectados.
- Próximo: cuando aparezcan nuevas features con nuevos storage keys, agregarlos al registry desde el momento 0. Pattern: cada feature nueva con persistencia → SYNC_REGISTRY actualizado en el mismo commit.

---

## 🎨 Cross-module · Sprint UX Cerebro completo · Master Prompt + Audit findings — 2026-05-15b

### Qué cambió
El usuario pidió: trabajar la UX del Cerebro completo, mejorar diseño, sincronización, bugs, iconografía y crear EL prompt maestro persistente en 8-PRO. Ejecutado todo a nivel de plan + persistencia · pendiente la implementación (esperando luz verde para Fase 1).

### A) Master UX Prompt insertado en 8-PRO (`frontend/prompts.html`)
Agregados 3 prompts nuevos al array inline, todos visibles en la UI de Prompt Lab:

1. **🎨 MASTER UX SPRINT — Rediseño profesional Cerebro completo** (el prompt grande pedido)
   - 4 fases secuenciales: Design System → Auditoría por módulo → Sync Audit → Bug Hunt
   - Cubre los 16 módulos (no 14 como el prompt viejo)
   - Define paleta + escala tipográfica + espaciado + radios + transiciones canónicas
   - 12 puntos de checklist por módulo
   - Matriz de prioridad P0/P1/P2 según frecuencia de uso
   - Recomendación de Lucide icons inline SVG
   - Reglas no-negociables del stack (vanilla, IIFE, auth chain, anti-frameworks)

2. **🔄 Sync Audit — Detectar keys no sincronizadas**
   - Grep recursivo de localStorage en frontend/
   - Cross-check con SYNC_REGISTRY + DYNAMIC_PREFIXES
   - Detecta typos (ej. doble prefijo `sys_sys_`)
   - Output: tabla key/módulo/sync-status/acción

3. **🎯 Iconos · Migrar a Lucide SVG inline**
   - Plan para unificar iconografía dispersa
   - Helper `window.icon(name, opts)` en `frontend/js/icons.js`
   - Mantener emojis decorativos · reemplazar funcionales

4. **🎨 Design Audit actualizado** de 14 a **16 módulos** (incluye 15-MM y 16-APA que faltaban).

### B) Hallazgos del audit preliminar (antes de la sesión de implementación)

**Sync bugs detectados** — keys que se usan en código pero NO están en `SYNC_REGISTRY`:

| Key | Módulo | Severidad | Acción |
|---|---|---|---|
| `sb_tasks` | 1-IND Mission Control | 🔴 Crítico | Agregar al registry · tareas del dashboard pierden cross-device |
| `custom_prompts` | 8-PRO Prompt Lab | 🔴 Crítico | Agregar · los prompts custom del usuario no sincronizan |
| `jt8` | 5-JOB Job Tracker | 🔴 Crítico | Confirmar/agregar · master key del módulo |
| `sys_class_sessions` | 10-SYS | 🟡 Medio | Agregar · sesiones de clase del Tab 7 |
| `sys_active_custom` | 10-SYS | 🟡 Medio | Agregar · selección de cuaderno activo |
| `eng_conv_fsrs` | 3-ENG | 🟡 Medio | Agregar · sistema FSRS de conversaciones |
| `sb_ws_hist` | 1-IND | 🟢 Menor | Confirmar si requiere sync (probable history local) |
| `sys_sys_class_sessions` | 10-SYS | 🐛 **BUG TYPO** | Doble prefijo `sys_sys_` — fixear en código fuente |

**Auth chain:** ✅ verificado · los 19 HTMLs cargan los 4 scripts. Sin bugs acá.

**Iconografía:** ⚠️ mix actual de emojis (90%) + algunos SVG (10%). Inconsistencia visible entre módulos. Recomendado Lucide.

**Tema dark:** ⚠️ algunos módulos viejos (2-APP, 4-RUT, 6-TOO, 7-NEW) tienen colores hardcoded en lugar de variables CSS. Detectado a ojo · pendiente audit formal.

**Mobile responsive:** ⚠️ no auditado sistemáticamente · marcado como Fase 2 del Master UX Sprint.

### C) Plan de rollout propuesto al usuario

**Sesión 1 · Fase 1 — Design System** (sugerido arrancar acá):
- Crear `frontend/css/design-tokens.css` con paleta + tipografía + espaciado canónicos.
- Crear `frontend/css/components.css` con .btn .card .input .badge .toast .modal estandarizados.
- Crear `frontend/css/DESIGN_SYSTEM.md` documentando uso.
- Decidir iconografía (Lucide vs emojis) — recomendación: Lucide.
- 1 módulo piloto refactorizado (sugerencia: 14-WORK o 1-IND) para validar el sistema.

**Sesión 2-3 · Fase 2 — Auditoría P0** (5 módulos más usados):
- 1-IND · 14-WORK · 13-NOT · 10-SYS · 12-FIN sobre el design system.

**Sesión 4 · Fase 2 — Auditoría P1** (4 frecuentes):
- 3-ENG · 5-JOB · 9-GOA · 8-PRO.

**Sesión 5 · Fase 2 — Auditoría P2** (7 menos usados):
- 2-APP · 4-RUT · 11-ACC · 6-TOO · 7-NEW · 15-MM · 16-APA.

**Sesión 6 · Fase 3 — Sync Audit**:
- Aplicar los fixes de la tabla de arriba.
- Bump SEED_VERSION de cualquier seed que cambie.
- Test cross-device.

**Sesión 7 · Fase 4 — Bug Hunt**:
- Grep sistemático de patrones de error.
- Pruebas en vivo con DevTools console.

### Archivos modificados
- ✏️ `frontend/prompts.html` (+ 3 prompts nuevos · 1 actualizado de 14 a 16 módulos)
- ✏️ `CEREBRO_STATE.md` (este entry)

### Pendientes
- **Luz verde del usuario** para arrancar Fase 1 (Design System).
- **Aplicar los sync fixes** detectados en este audit (incluido en Fase 3).
- **Decisión sobre iconografía:** Lucide vs emojis vs mixto.

### Decisiones técnicas tomadas
1. **Prompt persistente en 8-PRO** vs documento markdown suelto: el usuario lo quiere disponible siempre desde la UI de Prompt Lab. Por eso va al array inline de `prompts.html`.
2. **Plan multi-sesión** vs todo en un commit: el cerebro completo no se rediseña en una sesión. Fasear permite validar dirección con el usuario antes de seguir.
3. **NO TOCAR código de módulos todavía**: el master prompt arranca explícitamente con "esperá mi luz verde antes de tocar código". Coherente con prevenir regresiones.

---

## 💼 14-WORK · Update 1 desde Master Review · MOIF + Learning Simetrik 2.7 → ecosistema actualizado — 2026-05-15

### Qué cambió
Primera ejecución end-to-end del **Master Review Prompt**. El usuario corrió la auditoría con su contenido cargado (1 MOIF + 1 Learning + 4 Cuadernos + Diccionario base de 120) y aplicamos las propuestas seguras al ecosistema.

**Material de origen auditado:**
- MOIF 2026-05-15 · "Monitoreo y observabilidad integraciones - Ficohsa" · Juan Camilo Lopera organizer · 7 participantes · transcripción de 4.265 chars.
- Learning · "Discovering What's New" · Simetrik 2.7 con 13 features nuevas (texto visible truncado · adjunto .txt pendiente).
- Cuaderno "Ficohsa" página 1: requerimiento técnico del cliente (manifest, checksum, observabilidad por país).
- Cuaderno "Ficohsa" página 2: decisión Fase 1 sin IA, mención de 2500 cuentas contables, Sergio Rocha como referente IS.
- Cuaderno "Capacitacion Jhonattan" página 2: traductor contable + calculadora del deal.

### Cambios aplicados

**1) Diccionario (`work.js`) · SEED_VERSION → `simetrik-2026-05-15.1`**
12 entradas nuevas:
- `manifest` · archivo descriptor de batch
- `sha256` · algoritmo hash criptográfico
- `checksum` · validación de integridad
- `observabilidad` · capacidad de inferir estado del sistema
- `integridaddatos` · propiedad de no-alteración
- `reintento` · retry tras fallo
- `volumenanomalo` · volumen fuera de rango esperado
- `cargafallida` · failed load
- `traductorcontable` · módulo agrupador (preliminar)
- `calculadora` · herramienta de scope del deal (preliminar)
- `simetrik27` · release actual (13 features)
- `quickconfig` · sub-sección Automate

Total dict: 120 → **132 entradas**. Seed idempotente; no pisa entradas custom del usuario.

**2) Mind Map (`pages/simetrik-learn.html`)**
- Nodo `la-app`: añadidos sub-items "Simetrik 2.7 · release actual" y "Observabilidad de integraciones".
- Nodo `ia`: añadido sub-item "IA no siempre habilitada en Fase 1" (citando caso Ficohsa).
- Nodo `dominios`: añadida sección "El deal y la calculadora" con sub-item "La 'calculadora' del deal".
- Nodo `contabilidad`: añadido sub-item "Traductor contable" (definición preliminar).

**3) Simulador App (`pages/simetrik-app.html`) · 6 hotspots nuevos**
- Pantalla `catalogo`: hotspot "AI Agent integrado al Catálogo (Simetrik 2.7)" + hotspot "Workflow post-implementación".
- Pantalla `repositorios`: hotspot "Observabilidad del bucket" (métricas segregadas por país).
- Pantalla `conexiones`: hotspot "Validación de integridad por lote · Manifest + SHA256".
- Pantalla `agentes`: hotspot "IA no siempre incluida en Fase 1" (advertencia).
- Pantalla `procesos`: hotspot "Retries y cargas fallidas" en la fila fallida.

**4) Playbook Ficohsa (`pages/simetrik-playbook.html`)**
- Sección `team`: agregados 3 contactos al equipo Simetrik (Juan Camilo Lopera, Sergio Rocha) + Verito al equipo Ficohsa (Integraciones) + bloque nuevo "Participantes MOIF (rol por confirmar)" con 5 stakeholders adicionales. Routing de comunicación extendido con la regla manifest/checksum → Verito vía Juan Camilo Lopera.
- Sección `timeline`: agregada caja warn al final "Decisión confirmada · Fase 1 SIN IA en integraciones" con justificación citando cuaderno.
- Sección `processes`: agregada caja warn "Discrepancia de alcance pendiente de validación" (945 vs 2.500 cuentas) **sin modificar el número 945 oficial** + bloque completo nuevo "Requerimiento técnico activo · Monitoreo y observabilidad de integraciones" con (a) lo que pide el cliente, (b) estado evaluación Simetrik, (c) próximos pasos MOIF.
- Sección `cheatsheet`: agregado tercer panel "Integraciones · manifest, checksum y observabilidad" con 3 columnas (qué hacer si piden manifest · qué hacer si piden observabilidad · versión actual Simetrik 2.7).
- Sección `faq`: 3 preguntas nuevas (observabilidad no-default · cuándo aplica IA · manifest y SHA256).

### Lo que NO se aplicó (intencional)
- **Conteo de cuentas:** se mantiene "945" en `snapshot/metrics` y `processes`. Solo se agregó banner amarillo flaggeando la discrepancia con el cuaderno (2.500). Pendiente validación con el PM.
- **Roles exactos** de Rances Acosta, Luz Adriana Prieto Acosta, Carlos Bueno Espitia, Daniel Rivera, Jhony Rivero: se agregaron como "rol por confirmar". Pendiente respuesta de Miguel.
- **Definiciones de `traductorcontable` y `calculadora`:** publicadas como "DEFINICIÓN PRELIMINAR". Pendiente validación con Miguel/Jhonattan.
- **13 features de Simetrik 2.7:** solo se documentó la portada del release. El detalle completo está en el `.txt` adjunto que el usuario tiene que pegar.

### Archivos modificados
- ✏️ `frontend/js/work.js` (SEED_VERSION bumped a `simetrik-2026-05-15.1` · +12 entradas seed)
- ✏️ `frontend/pages/simetrik-learn.html` (+5 sub-items expandibles distribuidos en 4 nodos)
- ✏️ `frontend/pages/simetrik-app.html` (+6 hotspots distribuidos en 5 pantallas)
- ✏️ `frontend/pages/simetrik-playbook.html` (+5 secciones modificadas: team, timeline, processes, cheatsheet, faq)
- ✏️ `CEREBRO_STATE.md` (este entry)

### Decisiones técnicas
1. **Preservar fuentes citadas** en cada cambio (caja con "Fuente: MOIF 2026-05-15" o "Cuaderno Ficohsa página X"). Trazabilidad para auditoría futura.
2. **Marcar definiciones preliminares** en lugar de omitirlas. Si Miguel valida, basta un pequeño ajuste; si rechaza, removemos.
3. **NO TOCAR el conteo de cuentas** (945 vs 2500) hasta validación explícita. El banner amarillo es visible pero no contradictorio.
4. **Hotspots en pantallas existentes** vs crear pantallas nuevas: prefijo de aditividad. La estructura del simulador (24 screens) queda intacta; sumamos sub-cards/hotspots dentro de cada una.
5. **Seed idempotente por `sid`**: las 12 entradas nuevas tienen sids únicos. Si el usuario ya tenía alguna creada manualmente con un sid igual (improbable), el seed la respeta.

### Pendientes para próximo Master Review
- Validar 945 vs 2.500 cuentas con el PM.
- Confirmar roles de los 5 stakeholders MOIF "rol por confirmar".
- Confirmar definición precisa de "traductor contable" y "calculadora".
- Pegar contenido completo del `.txt` "Discovering What's New" para extraer las 13 features de Simetrik 2.7.
- Pegar resto de transcripción MOIF (truncada a 4.265 chars, posibles decisiones extra).

---

## 💼 14-WORK · MOIF · Bitácora de reuniones del proyecto + auto-update del ecosistema — 2026-05-14e

### Qué cambió
Usuario pidió: un lugar para pegar transcripts de reuniones del proyecto con fecha, donde después Claude pueda revisar y actualizar el ecosistema (diccionario, mapa mental, simulador, playbook) según lo conversado. Creada la **sigla MOIF · Monitoreo y Observabilidad Integraciones Ficohsa** (encaja con la nomenclatura del proyecto: RFP, SDD, IS, KPI, SLA, MOIF).

**Nueva pestaña 🗓️ MOIF** en `work.html` (entre 💡 Aprendizajes y 📚 KB):
- Total tabs ahora: 13 (era 12).
- Stat counter "MOIF" agregado en la barra superior.

**Form de nueva reunión:**
- Date picker (default hoy)
- Title
- Type (dropdown: 📅 Weekly · 🔍 Discovery · 🔄 Retro · 🚀 Kick-off · ⚡ Ad-hoc · 📋 Otros)
- Participants (texto libre, comma-separated)
- **Transcripción** (textarea grande, mono-font, min 200px)
- Summary ejecutivo (opcional)
- Acciones/pendientes (opcional)
- 📎 Adjuntar archivo (acta, slides, screenshots) — usa NBShared con cloud sync
- 💾 Guardar reunión / ✏️ Edit mode al editar

**Lista de reuniones (cards colapsables, ordenadas por fecha desc):**
- Header con: fecha (badge cyan) + título + tipo + #participantes + #attachments + chars de transcript
- Click en header → expande/colapsa
- Body con: participantes · resumen · acciones · transcripción completa (scroll, mono) · attachments chips · footer con acciones
- Acciones por reunión: **🤖 Generar prompt MOIF** · ✏️ Editar · 🗑️ Eliminar · 📋 Copiar transcripción

**🤖 buildMoifPrompt(id) — prompt MOIF focalizado por reunión:**
- Genera un prompt completo en español con 10 secciones estructuradas:
  1. Resumen ejecutivo (2-4 bullets verbalizados)
  2. Decisiones tomadas
  3. Acciones/pendientes (machine-readable: `[responsable] · acción · due:fecha`)
  4. Riesgos/bloqueos detectados
  5. Cambios propuestos al Diccionario (formato copy-pasteable a SEED_DICT, con sids únicos)
  6. Cambios al Mapa Mental (NODE/ADD/CONTENT)
  7. Cambios al Simulador App (SCREEN/ADD-HOTSPOT/CAT/TITLE/BODY/USE/TIP)
  8. Cambios al Playbook Ficohsa (SECTION/ADD/CONTENT)
  9. Preguntas pendientes para Miguel (anti-hallucination)
  10. Conflictos/inconsistencias con el material oficial
- Project_context incluido con stakeholders, sistemas, procesos priorizados, dictionary sids existentes (para evitar duplicados).
- Reglas: solo lo dicho en la reunión, citar fragmentos exactos, output machine-friendly.
- Tras generar, scroll automático + cambio a tab 🤖 Copilot para mostrar el output.

**Master Review Prompt extendido:**
- Ahora incluye `<moif_meetings count="N">` con todas las reuniones (date/type/title/participants/summary/actions/transcript_excerpt/attachments).
- Project_architecture menciona los 13 tabs y `work_moif_meetings` en SYNC_REGISTRY.

**Sync + UX:**
- Storage key `work_moif_meetings` agregada al SYNC_REGISTRY de `cloud-sync.js`.
- saveMoif / delMoif llaman a `CLOUD.pushNow()` inmediato — los cambios viajan al toque a otros devices (y vía Realtime aparecen sin refresh).
- Refactor `_kindToKey(kind)` para que `addAttToItem/removeAttFromItem/syncAttToCloud` soporten el nuevo kind 'moif' además de case/err/learn.
- _pendAtts.moif para staging de adjuntos antes de guardar la reunión.

### Archivos modificados
- ✏️ `frontend/js/work.js` (+250 líneas: K_MOIF, helpers _kindToKey, saveMoif/delMoif/editMoif/toggleMoif/copyMoifTranscript/buildMoifPrompt, renderMoif, integración Master Review, exports)
- ✏️ `frontend/css/work.css` (+35 líneas: .moif-item, .moif-h, .moif-date, .moif-type, .moif-body, .moif-section, .moif-transcript, .moif-actions, .moif-foot)
- ✏️ `frontend/work.html` (+ tab 🗓️ MOIF · stat counter sMoif · panel p-moif con form completo)
- ✏️ `frontend/js/cloud-sync.js` (+ `work_moif_meetings` en SYNC_REGISTRY)

### Workflow del usuario
1. Termina una reunión del proyecto.
2. Abre 14-WORK → tab 🗓️ MOIF.
3. Llena: fecha, título, tipo, participantes, pega transcripción.
4. Opcional: agrega summary, acciones, adjunta acta/slides.
5. Guarda.
6. Click en la reunión → expande → **🤖 Generar prompt MOIF**.
7. La pestaña salta automáticamente a 🤖 Copilot con el prompt listo.
8. Click 📋 Copiar → pega en otra sesión Claude Code en este repo.
9. Esa sesión devuelve proposal estructurado de cambios.
10. Aplico los cambios al ecosistema (diccionario, mapa, simulador, playbook).
11. Commit + push.

### Decisiones técnicas
1. **Una entry por reunión** vs append a un log único: separado para poder editar, deduplicar, deep-link, atacar de a una.
2. **Transcript completo guardado** (no resumido) para que Claude pueda hacer análisis fino. Truncado solo en el Master Review (2000 chars excerpt) por límite de tokens.
3. **Auto-switch a tab Copilot** al generar el prompt MOIF: feedback inmediato de "está listo, copialo".
4. **MOIF en el Master Review** además del prompt individual: cuando hagas la auditoría masiva del módulo, las reuniones quedan en el contexto.
5. **Sigla MOIF** elegida por consistencia con el proyecto (RFP, SDD, IS, KPI, SLA, KYC, AML — siglas de 3-4 letras).

### Estado actual de 14-WORK
- **Pestañas:** 13 (+ 🗓️ MOIF)
- **Storage sincronizado:** + work_moif_meetings
- **Attachments:** habilitados en Cases · Errors · Learnings · KB · MOIF · Cuadernos (todos con cloud sync)
- **Prompts Copilot:** 3 modos — Quick Ask · Master Review (incluye MOIF) · Prompt MOIF por reunión

### Pendientes
- Si las reuniones traen mucha info Ficohsa-specific que requiere cambios al Playbook, considerar agregar una sección "Histórico de reuniones" dentro del Playbook propio.
- Búsqueda full-text dentro de las MOIF (cuando haya 20+ reuniones).
- Visualización tipo línea-de-tiempo de las MOIF (timeline view).

---

## 💼 14-WORK · Cross-device sync de attachments vía Supabase Storage — 2026-05-14d

### Qué cambió
Reportaste el error *"File not found on this device. Attachments are not syncing to the cloud."* en la sección Learning. Hasta hoy los blobs solo vivían en IndexedDB local de cada device, así que un archivo subido en el PC de trabajo no se podía descargar desde el PC personal — limitación documentada pero crítica para tu workflow real.

**Solución implementada: Supabase Storage como capa de blobs cross-device.**

**Cambios en `js/nb-shared.js`:**
- Nueva sección "SUPABASE STORAGE · sync de blobs cross-device" con 3 funciones:
  - `cloudUploadAttachment(id, blob)` — sube blob a Supabase Storage en path `<auth.uid>/<blob_id>`. Returns `{ok, path}` o `{ok:false, reason, error}`.
  - `cloudDownloadAttachment(id)` — descarga desde Storage. Returns Blob o null.
  - `cloudDeleteAttachment(id)` — elimina blob de Storage (silencioso si no existe).
- Bucket usado: `attachments` (privado, RLS por user_id).
- `pickAndStoreAttachment()` actualizado: guarda en IDB local **+** sube a cloud. La metadata retornada ahora incluye `cloud:bool` indicando si el upload tuvo éxito.
- `pickAttachmentViaModal()` (drop-modal usado en Cuadernos) actualizado igual.
- `downloadAttachment()` rehecho con fallback cascada:
  1. Buscar blob en IDB local — si existe, descargar.
  2. Si no, intentar `cloudDownloadAttachment()` desde Supabase Storage.
  3. Si descarga cloud tiene éxito, **cachear en IDB local** para próximas descargas instantáneas.
  4. Si nada disponible, alert con causas probables (sin sesión / bucket no creado / blob viejo pre-sync).
- `deleteBlob()` actualizado: elimina cloud primero, después local.
- API pública expandida con `cloudUploadAttachment, cloudDownloadAttachment, cloudDeleteAttachment`.

**Cambios en `js/work.js`:**
- 3 funciones nuevas para re-sincronizar archivos viejos:
  - `syncAttToCloud(kind, itemId, attId)` — toma blob local de IDB y lo sube a cloud. Marca `cloud:true` en metadata. Muestra errores específicos (sin auth / bucket no existe / etc).
  - `syncKbAttToCloud(attId)` — igual pero para attachments de KB.
  - `syncAllAttsToCloud()` — bulk: recorre TODOS los attachments de Cases/Errors/Learnings/KB y sube los que tengan `cloud:false`. Reporta done/fail/skip.
- `_attCloudBadge(a, kind, id)` y `_kbAttCloudBadge(a)` — generan el badge visual:
  - ☁ verde si `cloud:true` (sincronizado, descargable desde cualquier device).
  - ☁↑ amarillo (clickable) si solo local — al hacer click llama a `syncAttToCloud`.
- `_itemAttsHtml()` y `renderKbAtts()` actualizados con el badge.
- `addAttToItem()` ahora loggea warning si el upload cloud falló (para debug).
- Botón **☁ Sincronizar todos los archivos** agregado al tab KB para fix masivo en bulk.

**Cambios en `work.html`:**
- Tab KB: botón "☁ Sincronizar todos los archivos" + caja informativa con instrucciones de setup del bucket (link a `alert()` con SQL para crear policies RLS).

**Setup necesario por una vez:**
- Archivo nuevo `SUPABASE_STORAGE_SETUP.md` en raíz del repo con:
  - Pasos para crear el bucket `attachments` (Dashboard → Storage → New bucket).
  - SQL completo para las 4 policies RLS (select/insert/update/delete) restringiendo cada user a su carpeta `<auth.uid>/`.
  - Verificación cross-device.
  - Tabla de diagnóstico de errores (bucket not found / RLS / not auth / blob viejo).
  - Detalles técnicos (paths, límites, tipos, cache, eliminación, costos).

### Archivos modificados / creados
- ✏️ `frontend/js/nb-shared.js` (+ 80 líneas: cloud helpers + integración en pickAndStore + downloadAttachment con fallback)
- ✏️ `frontend/js/work.js` (+ 100 líneas: syncAttToCloud, syncKbAttToCloud, syncAllAttsToCloud, badges)
- ✏️ `frontend/css/work.css` (+ estilos .att-cloud)
- ✏️ `frontend/work.html` (+ botón sync all + info de setup)
- ➕ `SUPABASE_STORAGE_SETUP.md` (NEW · raíz · guía completa para el bucket)

### Decisiones técnicas
1. **Supabase Storage vs Postgres JSONB:** los binarios no entran en JSONB (~1 MB práctico por row). Storage es la primitiva correcta de Supabase para esto.
2. **Bucket privado + RLS:** cada user solo accede a su carpeta `<auth.uid>/<attachment_id>`. Cero data leakage entre cuentas.
3. **Offline-first preservado:** el blob se guarda en IDB ANTES del upload a cloud. Si la red falla, el archivo igual queda usable local; el badge ☁↑ te invita a sincronizar cuando vuelvas online.
4. **Cache en IDB tras descarga cloud:** una vez bajado desde otro device, queda local — próximas descargas son instantáneas.
5. **Eliminación coherente:** delete local + delete cloud en la misma operación. Sin huérfanos en Storage.
6. **Migración gradual:** los attachments viejos (anteriores a este commit) tienen `cloud:undefined` → se renderizan con badge ☁↑ → click los sube. No requiere migration script.
7. **Setup manual del bucket:** la anon key no puede crear buckets vía API. Documentación clara en `SUPABASE_STORAGE_SETUP.md` con SQL listo para copy-paste.

### Para resolver TU problema concreto
**El archivo de la sección Learning ("Descubriendo lo nuevo") sigue en IDB de tu PC de trabajo.** Para descargarlo desde tu PC personal:

1. **En tu PC personal:**
   - Hacé el setup del bucket (`SUPABASE_STORAGE_SETUP.md`).
   - Pull último commit (auto vía GitHub Pages).
2. **En tu PC de trabajo:**
   - Pull último commit.
   - Abrí 14-WORK → tab 💡 Aprendizajes.
   - En el item "Descubriendo lo nuevo" vas a ver el chip del adjunto con badge **☁↑ amarillo**.
   - Click en ese badge → sube el archivo a la nube.
   - O alternativamente click **☁ Sincronizar todos los archivos** en el tab KB → bulk upload de TODO lo local.
3. **En tu PC personal:**
   - Refresh la página.
   - Click ⬇ en el chip → descarga desde la nube + cachea local.

### Estado actual de 14-WORK
- **Cross-device blob sync:** ACTIVO (requiere setup one-time del bucket).
- **Attachments en:** Cases · Errors · Learnings · KB · Cuadernos.
- **Tipos:** PDF · Office · TXT/CSV/MD/JSON/XML/LOG · ZIP · imágenes (PNG/JPG/JPEG/GIF/WEBP/SVG/HEIC).
- **Tamaño máx:** 50 MB por archivo.
- **Cache:** descargas desde cloud quedan en IDB local automáticamente.
- **Eliminación:** elimina cloud + local en la misma acción.
- **Badges visuales:** ☁ verde = synced · ☁↑ amarillo = local only (click para sync).
- **Bulk re-sync:** botón único en KB tab.

### Pendientes
- Setup one-time del bucket por el usuario (5 min, instrucciones en SUPABASE_STORAGE_SETUP.md).
- Próxima iteración: notebook image attachments (3-tier 320/1280/1920) ahora viajan vía thumbnail/preview en JSONB; podrían moverse 100% a Storage para liberar payload size.

---

## 💼 14-WORK · Workflow de auditoría · Adjuntos universales · Diccionario 2-col · Master Review Prompt — 2026-05-14c

### Qué cambió
El usuario va a poblar el módulo desde su **PC de trabajo** (donde tiene acceso al portal central de Simetrik) con info real: KB, Cases, Errors, Learnings, Notebooks, Course Notes, Workflow Notes, archivos. Después vuelve a su PC personal y quiere que Claude **audite todo lo cargado y proponga cambios estructurados** a las 4 secciones de display (Empieza Aquí, Simulador App, Playbook Ficohsa, Diccionario). Implementado:

**A) Diccionario compacto · 2 columnas agrupado por tipo:**
- `dictRender()` rehecho en `js/work.js` namespace `eco`.
- Las entradas se agrupan por categoría (Siglas · Términos · Procesos · Plataformas · Software) y cada grupo se renderiza en **grid 2 columnas**.
- Vista compacta por defecto: solo término + traducción EN inline. Click en una fila → se expande con definición + ejemplo + acciones Editar/Eliminar (acordeón inline).
- Header de grupo con contador de entradas por categoría.
- Total ~210 entradas distribuidas; mucho más escaneable que la vista anterior de cards grandes.
- Función nueva `dictToggle(id)` registrada en el namespace `eco`.

**B) Adjuntos universales · Cases · Errors · Learnings · KB:**
- Reutiliza el módulo `NBShared` (mismo IDB pipeline que Cuadernos en 10-SYS/13-NOT).
- **`ALLOWED_EXT` extendido en `nb-shared.js`** para incluir imágenes y formatos extra: añadidos `png, jpg, jpeg, gif, webp, svg, heic, json, xml, log` (antes solo docs Office). Esto beneficia a TODOS los módulos que usan attachments (10-SYS, 13-NOT, 14-WORK).
- **Cases / Errors / Learnings:** cada item ahora soporta `attachments: [{id, name, type, size, ext, addedAt}]`. Los blobs viven en IDB (`da2026_nb` DB), la metadata sincroniza vía Supabase JSONB.
  - El form de cada uno tiene un botón **📎 Adjuntar archivo** que stagea attachments en `_pendAtts[prefix]` (temp staging).
  - Al guardar, los pending se transfieren al objeto del item.
  - Cada item card renderizado muestra sus attachments con chips clickables (descargar/eliminar) + un botón **📎 Adjuntar archivo** para agregar más después.
  - Al eliminar un item, sus blobs de IDB se limpian (no quedan huérfanos).
- **KB:** soporta su propio array de attachments en clave nueva `work_kb_atts` (sincronizada vía Supabase). Botón 📎 Adjuntar en el toolbar de KB + panel "archivos de referencia" listando los chips.
- Patrón de comportamiento documentado: binarios solo en IDB local del device · metadata sincroniza cross-device (en otro PC ves los chips pero al descargar te dice "no en este device").

**C) Master Review Prompt (Copilot tab rediseñado):**
- Pestaña Copilot ahora tiene **2 modos**:
  1. **🤖 Quick Ask** (modo original): pregunta puntual con KB + casos/errores recientes como contexto.
  2. **🔄 Master Review Prompt** (NUEVO): genera un prompt completo que:
     - Incluye `<role>` con descripción del agente que mantiene el módulo.
     - Incluye `<project_architecture>` (12 tabs, storage keys, dictionary system con sids, mind map nodes, simulator screens, playbook sections).
     - Incluye `<user_content_to_audit>` con TODO lo cargado: KB completo + KB attachments metadata + todos los Cases (con severity/status/client/body/attachments) + todos los Errors + todos los Learnings + Workflow Notes + Course Notes + Notebooks (con páginas) + Dictionary counts by category.
     - Incluye `<task>` con 7 secciones estructuradas que Claude debe producir:
       1. Resumen del contenido nuevo detectado.
       2. Cambios propuestos al Diccionario (formato copy-pasteable a SEED_DICT).
       3. Cambios propuestos al Mind Map (formato NODE/ADD/CONTENT).
       4. Cambios propuestos al Simulator (formato SCREEN/ADD-HOTSPOT/CAT/TITLE/BODY/USE/TIP).
       5. Cambios propuestos al Playbook (formato SECTION/ADD/CONTENT).
       6. Info insuficiente / preguntas para Miguel (anti-hallucination).
       7. Conflictos / inconsistencias con el material oficial.
     - Incluye `<rules>` enfatizando NO INVENCIÓN, citar fuente (qué case/error/etc justifica cada cambio), preferir adiciones sobre rewrites.
- Output machine-friendly para que otra sesión de Claude Code pueda aplicar los cambios al codebase directamente.
- Botón distintivo (violeta) para diferenciar del Quick Ask.
- Tip de workflow en el panel: "PC trabajo → cargás info nueva → PC personal → Master Review → otra sesión Claude → cambios aplicados".

### Archivos modificados
- ✏️ `frontend/js/work.js` (+250 líneas: helpers de attachments, dictRender rehecho, buildMasterReviewPrompt, exports nuevos)
- ✏️ `frontend/css/work.css` (+50 líneas: estilos `.dict-group`, `.dict-row`, `.item-atts`, `.pend-atts`)
- ✏️ `frontend/work.html` (botones 📎 en Cases/Errors/Learnings forms, panel `kbAttsList` en KB, Master Review button en Copilot)
- ✏️ `frontend/js/cloud-sync.js` (+ `work_kb_atts` en SYNC_REGISTRY)
- ✏️ `frontend/js/nb-shared.js` (ALLOWED_EXT extendido con imágenes + formatos extra · inp.accept actualizado)

### Storage keys nuevos
- `work_kb_atts` · array `[{id,name,type,size,ext,addedAt}]` — sync ON (metadata) / blobs en IDB local
- Campo `attachments: []` agregado a cada item de `work_cases`, `work_errors`, `work_learnings` (parte del JSONB existente, sync automático)

### Decisiones técnicas
1. **NBShared como módulo único de attachments:** se evita reimplementar el pipeline de IDB. Mismo patrón que Cuadernos. Una sola superficie de bugs.
2. **Temp staging (`_pendAtts`):** los attachments se asignan en el form antes de tener un item.id; al guardar se transfieren. Cancelar / borrar el form limpia los blobs huérfanos.
3. **Imágenes en attachments vs en rich-text:** el rich-text de Workflow/Course Notes ya usa `insertImg` (dataURL inline). Los attachments del módulo usan IDB. Dos caminos coexistiendo — el primero útil para inline en texto, el segundo para "archivos de referencia" del item.
4. **Master Review como prompt portable:** se eligió generar un texto grande copy-pasteable en lugar de integrar API directa. Razón: Miguel ya usa Claude.ai / Claude Code en otra sesión; el prompt funciona en cualquier sesión sin claves API ni infraestructura nueva. Es el patrón "P12" del proyecto (prompts reutilizables).
5. **Diccionario grupo por categoría:** mejora drastically la legibilidad cuando hay 200+ entradas. Los `acro` se buscan diferente a los `process` o `platform`. Grupos colapsables a futuro si crece más.

### Cómo usarlo (workflow del usuario)
1. **PC del trabajo** (acceso a Simetrik central):
   - Pega info en KB.
   - Crea Cases con severity/status + adjunta screenshots, exports, archivos.
   - Reporta Errors con código de módulo + adjunta logs/stack traces.
   - Guarda Learnings + tips con tag + adjunta cheatsheets.
   - Crea/edita Cuadernos con páginas e imágenes.
   - Edita Notas Workflow + Notas Curso.
2. **PC personal**:
   - Abre 14-WORK → tab 🤖 Copilot.
   - Click **🔄 Generar Master Review Prompt**.
   - Click **📋 Copiar**.
   - Abre nueva sesión Claude Code (en este mismo repo) → pega el prompt.
   - Claude audita y devuelve proposal estructurado.
   - Aplica los cambios al codebase (mind map, simulator, playbook, dictionary).
   - Commit + push.

### Estado actual de 14-WORK
- **Pestañas:** 12 (sin cambio estructural · UX mejorado)
- **Diccionario:** ~210 términos · vista compacta 2-col agrupada · expandible inline
- **Attachments:** habilitados en Cases · Errors · Learnings · KB · Cuadernos (todos comparten el mismo IDB layer)
- **Tipos de archivo soportados:** PDF · Office (Word/Excel/PowerPoint) · TXT/CSV/MD/JSON/XML/LOG · ZIP · imágenes (PNG/JPG/JPEG/GIF/WEBP/SVG/HEIC) — máx 50 MB c/u
- **Copilot:** 2 modos — Quick Ask + Master Review Prompt
- **Workflow PC-trabajo → PC-personal:** activo · metadata sincroniza, binarios local por device (limitación documentada)

### Pendientes detectados
- Próxima iteración del workflow: cuando el Master Review devuelva proposals, considerar agregar un botón "🤖 Aplicar proposal" que toma el output estructurado y modifica el codebase automáticamente (requiere parser del formato de salida).
- Mini-curso de contabilidad dentro del contexto Simetrik (marcado anteriormente como "le falta") — pendiente.
- Procesar PDFs Service Module 2/3 + RFP del primer ZIP.
- APA: feature "pegar cualquier texto → APA automático" + verificación APA_CUN.pdf.
- Mind Map Studio (15-MM) mejoras profesionales.

---

## 💼 14-WORK · Rediseño UX: Mapa mental + Simulador interactivo de la app — 2026-05-14b

### Qué cambió
El usuario pidió diferenciar claramente "Empieza Aquí" del "Playbook" (eran muy parecidos) y construir un **simulador real de la app de Simetrik** — interactivo, con botones explicativos, menos texto. Se inspeccionaron las **6 capturas reales** de `app.simetrik.com` (Principal, Automatizar, Gestionar, Auditar, Herramientas, Accesos directos) para replicar la UX fielmente.

**NUEVO · `pages/simetrik-app.html` — Simulador interactivo de la app:**
- Réplica fiel de `app.simetrik.com`: **tema claro**, sidebar idéntico al real.
- Sidebar con la estructura EXACTA de los menús reales (nombres en español de las capturas):
  - **Resumen** (pantalla de inicio con 4 stat cards: Fuentes, Conciliaciones, Usuarios, Gigabytes + paneles Recientes).
  - **Accesos directos** [badge Nuevo]: Recursos, Conciliaciones, Repositorios.
  - **Automatizar**: Configuraciones rápidas (Catálogo de plantillas [Beta], Réplicas) · Integraciones (Repositorios, Conexiones) · Recursos y conciliaciones (Recursos, Conciliaciones, Fuentes de terceros) · Contabilidad (Automatizaciones contables, Configuración de cierre, Integraciones ERP).
  - **Gestionar**: Hallazgos (Agentes, Alarmas) · Controles operativos y financieros (Tableros operativos, Consolidaciones, Buscador de registros, Recursos) · Controles contables (Tableros contables, Asientos contables, Períodos contables, Conciliaciones de cuentas).
  - **Auditar**: Historial de actividad, Fotos.
  - **Herramientas**: Mapas, Procesos, Papelera, Descargas.
- **24 pantallas mock** — cada submenú renderiza una pantalla realista (toolbars, tablas mock, cards, KPIs, badges de estado) con datos coherentes de Ficohsa.
- **Sistema de hotspots interactivos:** puntos azules pulsantes (?) sobre elementos UI clave. Click → modal con: categoría, título, qué hace, caso de uso, tip. ~50 hotspots distribuidos.
- Cada pantalla abre con un **explainer card** ("¿Qué hago aquí?") + chips de tips/warnings.
- Menús se expanden inline como acordeón (igual al real). Submenú abierto resalta el item activo.
- Todo el contenido derivado del App.md oficial. Cero ficción.

**REHECHO · `pages/simetrik-learn.html` — Mapa mental interactivo:**
- Reemplaza la guía de scroll largo por un **mapa mental visual**: nodo central "Simetrik" + 8 nodos rama radiales conectados por líneas SVG.
- Los 8 nodos: ¿Qué es Simetrik? · Tu cuenta y roles · La App (4 menús) · Agentes de IA · 8 Dominios · Contabilidad · Conciliación · Ejercicios.
- Click en un nodo → **drawer lateral** se desliza con contenido conciso + **sub-items clicables** que despliegan mini-detalles (acordeón anidado).
- Cada drawer tiene **deep-links** a `simetrik-app.html` y `simetrik-playbook.html` (botones de acción destacados).
- Botón "Marcar como visto" por nodo → progreso persiste en `work_learn_progress`.
- Barra de progreso "N/8 nodos explorados".
- Mínimo texto en el lienzo; el contenido se revela al interactuar (cumple el pedido "menos letra, más interacción").
- Líneas SVG centro→nodos se redibujan en resize.

**`work.html` — nueva pestaña + diferenciación:**
- Agregada pestaña **🖥️ Simulador App** (segunda posición, después de Empieza Aquí).
- Total 12 pestañas (era 11).
- Textos de las pestañas diferenciados claramente:
  - 🧭 Empieza Aquí → "Mapa mental de Simetrik · 8 nodos clicables"
  - 🖥️ Simulador App → "Réplica interactiva de app.simetrik.com con hotspots"
  - 📘 Playbook Ficohsa → "Manual de campo específico del proyecto Ficohsa"

### Archivos modificados / creados
- ➕ `frontend/pages/simetrik-app.html` (NEW · ~900 líneas · simulador interactivo)
- ✏️ `frontend/pages/simetrik-learn.html` (rehecho como mapa mental · ~600 líneas)
- ✏️ `frontend/work.html` (+ pestaña Simulador App · textos diferenciados)

### Decisiones técnicas
1. **Tema claro para el simulador** — decisión deliberada: el simulador DEBE verse como la app real de Simetrik (que es light theme). El mapa mental y el playbook siguen dark (integran con DA-2026). Cada página tiene el theme que su función requiere.
2. **Hotspots vs texto plano:** se eligió el patrón hotspot (punto pulsante → modal) para cumplir "menos letra, más interacción". El usuario descubre la info clickeando, no leyendo párrafos.
3. **Mapa mental con SVG dinámico:** las líneas conectoras se calculan en JS sobre las posiciones reales de los nodos (getBoundingClientRect) y se redibujan en resize — responsivo real.
4. **Drawer con acordeón anidado:** cada nodo del mapa abre un drawer; dentro, los sub-items son a su vez clicables y despliegan mini-detalles. Doble nivel de progressive disclosure.
5. **Diferenciación de roles de cada página:**
   - `simetrik-learn.html` = punto de entrada / navegación mental (mapa).
   - `simetrik-app.html` = aprender la UX haciendo (simulador).
   - `simetrik-playbook.html` = manual de campo Ficohsa-specific (referencia diaria).
   Cada una con propósito único, sin solapamiento.
6. **Progreso compartido:** el mapa mental usa la misma key `work_learn_progress` — los 8 nodos reemplazan las 12 lecciones anteriores como unidad de progreso.

### Estado actual de 14-WORK
- **Pestañas activas:** 12 (+ Simulador App)
- **Páginas embebidas:** 3 — `simetrik-learn.html` (mapa mental, dark), `simetrik-app.html` (simulador, light), `simetrik-playbook.html` (manual Ficohsa, dark)
- **Simulador:** 24 pantallas mock + ~50 hotspots interactivos, fiel a app.simetrik.com
- **Mapa mental:** 8 nodos clicables con drawers + sub-items + deep-links + progreso
- **Diccionario:** ~210 términos (SEED_VERSION simetrik-2026-05-14.1, sin cambio este commit)

### Pendientes detectados
- Reforzar el mini-curso de contabilidad dentro del contexto Simetrik (el usuario lo marcó como "le falta") — el playbook tiene 5 lecciones pero podría profundizar la conexión cuenta↔conciliación↔asiento.
- Procesar PDFs Service Module 2/3 + RFP del primer ZIP.
- Las 6 capturas PNG podrían embebirse como overlays opcionales en el simulador (mejora futura).
- APA: feature "pegar cualquier texto → APA automático" + verificación APA_CUN.pdf.
- Mind Map Studio (15-MM) mejoras profesionales.

---

## 💼 14-WORK · Ecosistema rehecho con material oficial Simetrik App.md — 2026-05-14

### Qué cambió
El usuario aportó un ZIP con el **curso oficial Simetrik completo** (`App.md` · 2904 líneas, 31 lecciones · `Domain Framework 2026.txt` · 6 capturas PNG de la UI real `app.simetrik.com`). Las 3 secciones principales fueron reescritas con material oficial verificado:

**`pages/simetrik-learn.html` (reescrito completo · 1100+ líneas):**
- Hero refrescado con kicker "curso oficial Simetrik".
- Connect → Reconcile → Resolve con frase oficial: *"From the moment a transaction is born, until it dies in accounting"*.
- Sección "Account, Workspaces y Roles" con los 4 system roles oficiales (Viewer, Builder, Operator, Supervisor) + Custom Roles + flujo de login con Guardian 2FA.
- Sección "SBBs · Simetrik Building Blocks" con los 3 tipos (estándar, feature flag, revenue propio).
- **🎯 Tour interactivo refeito con los 4 menús oficiales** + Account Management:
  - **Automate** (6 sub-sections): Integrations In, Resources, Accounting, Analysis, Data Sharing, Solutions/Templates.
  - **Operate** (4 sub-sections): Insights, Operational Controls, Record Finder, Accounting Controls.
  - **Audit** (2 sub-sections): Snapshots, Activity Logs.
  - **Tools** (4 sub-sections): Downloads, Recycle Bin, Process View, Relationship Maps.
  - Cada módulo con descripción, sub-cards de funcionalidades, tips, warnings y casos de uso reales del curso oficial.
- Sección **AI Agents** completa: 5 activos (Smart Parser, Smart Building Block · Connect Sources, Smart Date Formats, Smart Transformation, Smart Rules) + 3 release abril 2026 (Column Mapping, Accounting Model Assistance, Safe Column Removal) + 3 roadmap (Accounting Review, Education, Summary) + 1 custom (Data Monitoring).
- Sección **Domain Framework 2026** con los **8 dominios oficiales** agrupados en 4 macro-objetivos (Funds Flows · Profitability · Continuous Closing · Compliance & Oversight).
- **Curso de 12 lecciones** ampliado (vs 10 anterior) cubriendo el curso oficial completo.
- **🧪 Sección Ejercicios prácticos** con los 2 ejercicios oficiales (OP & Cost Control + Advanced Recon) y archivos xlsx ya extraídos del ZIP.
- 6 cards de Beneficios + 6 cards de Recursos.

**`pages/simetrik-playbook.html` (reescrito completo · 800+ líneas):**
- Sidebar sticky con scroll-spy + 11 anclas categorizadas (Proyecto, Contabilidad, Conciliación, Operación).
- Snapshot Ficohsa con 6 métricas + Stakeholders 2 columnas + Timeline 7 fases.
- **Mini-curso de contabilidad (5 lecciones expandibles):**
  1. La ecuación contable básica (Activo = Pasivo + Patrimonio).
  2. Partida doble (principio que nunca se rompe + asiento contable visualizado).
  3. Naturaleza de cuentas (5 tipos color-coded + transitorias).
  4. Cuentas transitorias: el reto de SERCOM (caso completo con asientos D/C).
  5. Journal entry y cierre contable (ciclo completo del cierre).
- **Mini chart of accounts** con 11 cuentas reales Ficohsa.
- **Curso completo de reconciliation (5 lecciones expandibles):**
  - A. ¿Qué es y por qué importa? (tipos de cruce: 1-1, 1-N, N-1, N-N).
  - B. Standard Reconciliation paso a paso (sweeps en cascada visualizados).
  - C. Reconcilable Groups + best practice SKT ID != empty.
  - D. Advanced Reconciliation (3 tipos de sweep: recon, grouping, offset).
  - E. Source Enrichment (VLOOKUP vs 1-N recon + Cost Control con transformation columns).
- Procesos priorizados Fase 1 (SERCOM, Cartera Préstamos, Descuento Documentos).
- **Cheatsheet operativa en 3 paneles** (Tu día IS + Reglas de oro + Best practices del curso oficial).
- FAQ blindado con 12 preguntas-respuestas literales.
- Recursos en 6 cards.

**Diccionario expandido (SEED_VERSION → simetrik-2026-05-14.1):**
- +110 nuevos términos sobre los 100 anteriores → ~210 términos totales.
- Nuevas categorías cubiertas con material oficial App.md:
  - **Estructura cuenta:** Account, Workspace, los 4 system roles (Viewer/Builder/Operator/Supervisor), Custom Role, Admin, Guardian (2FA).
  - **Resources:** Source, System Columns, Create Resource, Normalization, Change Format, Smart Date Format, Manual Upload, Self-Managed, SFTP Pull/Push, S3 Pull, Bucket, Integration Services Team, Smart Parser, Parsing, Source Union, AIA.
  - **Reconciliations:** Standard vs Advanced, Sweep, Reconciliation/Grouping/Offset Sweep, 1-1/1-N/N-1/N-N crossovers, Business Rule, Reconcilable Group, SKT ID, Smart Rules.
  - **Enrichment:** VLOOKUP (Simetrik), Enrichment by Recon, Transformation Column, Smart Transformation, Cost Control, Fee Dictionary.
  - **Accounting:** Chart of Accounts, ERP Integration, Middleware vs Standard App, Accounting Model, Accounting Structure, Document Fields, Lines, Header, Normal/Cancellation/Post-Siege Seats, Post After Closing, Partial Reversal, Dummy Recon.
  - **Accounting Close:** Trial Balance, Beginning/Ending/Recognized Balance, Preparer, Certifier, Ready to Certify, Support Resource, Snapshot, Account Grouping, Auto-certification, Accounting Dashboard.
  - **Analysis:** Custom Dashboard, Pivot Table, 4 Monitors (Conciliation, Source, Bucket, Accounting), Consolidation vs Combination, Grouping.
  - **Data Sharing:** Data Sharing, Export, Export by Event, Recurring Export, Destination, Customer Reports, Partitioning.
  - **Solutions/Templates:** Solutions, Template, Templates Catalog, First Time to Value.
  - **Menús:** Automate, Operate, Audit, Tools (sub-secciones de cada uno).
  - **Operate features:** Insights, Agent Factory, Record Finder, Activity Logs.
  - **Tools features:** Downloads, Recycle Bin, Process View, Relationship Maps.
  - **Domain Framework:** Domain Framework, los 8 dominios, Reporting Entity, Actor, Stage, Sub-Stage.
  - **Simetrik Box:** modelo de embebido para partners.
  - **AI Agents roadmap:** Column Mapping, Safe Column Removal, Accounting Review Agent, Education Agent, Summary Agent, Data Monitoring Agent.
  - **Trazabilidad:** Full Traceability, Single Source of Truth.
  - **Certificación:** Assessment, Practical Activity, Q&A Sessions, Go-To-Market Sessions.

### Archivos modificados / creados
- ✏️ `frontend/pages/simetrik-learn.html` (reescrito 100% · 1100+ líneas)
- ✏️ `frontend/pages/simetrik-playbook.html` (reescrito 100% · 800+ líneas)
- ✏️ `frontend/js/work.js` (SEED_VERSION bumpeado a simetrik-2026-05-14.1 · +110 términos)

### Decisiones técnicas
1. **Cero ficción:** todos los términos y descripciones derivan del `App.md` oficial (2904 líneas) + `Domain Framework 2026` + el material previo del usuario. No hay nada inventado.
2. **Tema dark unificado** en las 3 páginas. Tour del playbook viejo (tema claro) fue descartado por inconsistencia visual.
3. **Tour interactivo basado 1:1 en `app.simetrik.com`:** el orden y los nombres de los menús coinciden con la plataforma real. Sub-secciones reflejan exactamente lo descrito en el curso.
4. **Mini-curso de contabilidad embebido** en el playbook (5 lecciones expandibles) — incluye visualizaciones de journal entries con débito/crédito en mono-font, ecuación contable destacada, y caso SERCOM completo.
5. **Curso de reconciliation independiente** del mini-curso de contabilidad — 5 lecciones cubriendo Standard, Reconcilable Groups, Advanced, Source Enrichment.
6. **Cheatsheet en 3 paneles** (vs 2 anterior): agregado panel de "Best practices del curso oficial" con guidance específica de Simetrik.
7. **Seed dictionary idempotente:** `sid` único por entrada · no pisa entradas custom del usuario.

### Estado actual de 14-WORK
- **Pestañas activas:** 11 (sin cambio estructural)
- **Diccionario:** ~210 términos (SEED_VERSION `simetrik-2026-05-14.1`)
- **Curso Empieza Aquí:** 12 lecciones (vs 10 anterior) con progreso individual por device
- **Playbook:** 11 secciones con sidebar sticky + mini-curso accounting + curso reconciliation
- **Páginas embebidas:** 2 (`simetrik-learn.html`, `simetrik-playbook.html`), ambas dark theme integradas a DA-2026
- **Tour de la interfaz:** fiel a `app.simetrik.com` con 4 menús reales + Account Management
- **Ejercicios prácticos:** documentados con conceptos a demostrar + archivos disponibles (Ej 2 OP&Cost Control + Ej 3 Advanced Recon)

### Pendientes detectados (mantienen del entry anterior)
- Procesar PDFs Service Module 2/3 + RFP del primer ZIP (Ficohsa-specific).
- Levantar contenido de Ecosistem,a Simetrik.md (95KB) y Módulo Servicios 3.md (40KB) si profundizan algo no cubierto en App.md.
- Implementar visualización de las 6 capturas UI dentro del tour como overlays opcionales (mejora futura).
- APA: feature "pegar cualquier texto → APA automático" + verificación APA_CUN.pdf (pendiente sesiones anteriores).
- Mind Map Studio mejoras profesionales (pendiente sesiones anteriores).

---

## 💼 14-WORK · Playbook reescrito desde cero (dark theme, completo, didáctico) — 2026-05-13

### Qué cambió
El playbook anterior (`simetrik-playbook.html`) era una copia íntegra del `Documento completo.html` que el usuario me pasó en el ZIP — tema claro, layout que no integraba con el resto del Cerebro (dark), contenido fragmentado, sin cronograma personal del IS, sin cheatsheet operativa.

**Reescrito 100% desde cero (881 líneas):**
- Tema dark coherente con `simetrik-learn.html` y resto de DA-2026.
- Sidebar sticky de navegación con 11 anclas (active-state automático con scroll-spy en JS).
- 11 secciones progresivas: Snapshot → Timeline → Stakeholders → Manual de campo → Procesos priorizados → Contabilidad aplicada → Lab práctico → Sistemas core → Cheatsheet operativa → FAQ blindado → Recursos.

**Mejoras de contenido sobre el original:**
- **Snapshot del proyecto** con 6 métricas clave (32.4M tx/mes, 945 cuentas, 30 analistas, 98 procesos, 5 años contrato, USD 145K cotización).
- **Timeline 7 fases** con doble carril: qué hace el equipo Simetrik vs qué hace Miguel como IS (verde resaltado). Bullets con dates reales y nombres reales.
- **Stakeholders 2 columnas** (Simetrik vs Ficohsa) con avatars iniciales, todos los nombres reales de las mesas de Discovery (Carlos Avila, Daniel Jojoa, Gabriel Cortes, William, Wilson, Erik, Williams, Noel, Jorge, Carlos, Jose, Gary + equipo Simetrik Ana M., Lina Azcárate, Juan C., Wilson, Carolina Toro).
- **Manual de campo 3 habilidades** (Ingesta / Parseo / Matching) como accordions expandibles con: qué hacés, decisiones técnicas, trampas comunes, ejemplos de código (filtros TXN_CODE, prefijo 504, reglas de cascada).
- **Catálogo de procesos priorizados** con cards por proceso (SERCOM, Cartera Préstamos, Descuento Documentos): fuentes, llave de cruce, regla clave, filtros, outputs, aging benchmark, estimación.
- **Contabilidad aplicada**: tabla de las 5 naturalezas + transitorias con colores semánticos (act/pas/pat/ing/gas/tra) + Mini-PUC con 11 cuentas reales de Ficohsa + 3 ejemplos de cruce reglamentario.
- **Lab práctico dark-themed** con flujo Ingesta→Parseo→Cruce: raw data como llega de T24, tabla parseada con highlights, match box visual con `==` central que muestra cruce exacto entre Cajas T24 y CLARO.
- **Cheatsheet operativa** en 2 paneles:
  1. "Tu día como IS" — Inicio (15 min) · Mientras configurás · Resolviendo excepciones · Fin del día (10 min).
  2. "Reglas de oro · memoria muscular" — Antes de configurar · Mientras configurás · Cuando algo falle.
- **FAQ blindado** con 11 preguntas Q&A en `<details>` collapsibles (las que va a recibir literal en reuniones).

**Patrones de diseño nuevos:**
- Scroll-spy: el JS al final sincroniza la nav lateral con la sección visible según `window.scrollY`.
- Match box visual usando CSS Grid 1fr/auto/1fr con `==` mono grande central (rota 90deg en mobile).
- Stakeholder avatars generados con CSS gradient + iniciales (sin imágenes externas).
- Naturalezas contables con badge color-coded inline en la tabla (act=cyan, pas=orange, pat=purple, ing=green, gas=red, tra=yellow).
- Cheatsheet con doble layer (panel cyan + panel green) para diferenciar "qué hacés" vs "reglas mentales".

### Archivos modificados
- ✏️ `frontend/pages/simetrik-playbook.html` (881 líneas · reescrito 100%)

### Decisiones técnicas
1. **Dark theme definitivo:** se descarta la idea de "preservar el documento original en tema claro". El playbook ahora es código nuevo, todo del autor de DA-2026, no del usuario. Coherencia visual del Cerebro tiene prioridad.
2. **No-fabriqué contenido nuevo:** todo el material proviene del `Documento completo.html` del ZIP del usuario + el snapshot ejecutivo de Simetrik que el usuario me pegó en chat. Reorganización, no invención.
3. **Sidebar sticky vs top-tabs:** elegí sidebar para que el lector tenga siempre visibilidad del índice completo mientras lee. En mobile colapsa a flex horizontal scrolleable.
4. **Cheatsheet duplicada:** la mantengo en 2 paneles (operativa + reglas) porque tienen audiencias mentales distintas: una para acción ("¿qué hago ahora?"), otra para principios ("¿qué nunca cambia?").

### Estado actual del playbook
- **Secciones:** 11 (todas pobladas, ninguna vacía).
- **Tema:** dark, 100% integrado a DA-2026.
- **Navegación:** sidebar sticky con scroll-spy.
- **Datos verificados:** todos provienen del material del usuario.
- **Tamaño:** 881 líneas (vs 411 del original).

---

## 💼 14-WORK · Ecosistema Simetrik (rediseño completo + Empieza Aquí) — 2026-05-13

### Qué cambió
14-WORK pasó de "Simetrik Copilot" (6 tabs operativos) a **Ecosistema Simetrik didáctico** con foco en aprendizaje y referencia profesional. Foco: que un IS junior se autoenseñe sin asistencia humana.

**Pestañas finales (11):**
1. 🧭 Empieza Aquí (default) → iframe `pages/simetrik-learn.html`
2. 📘 Playbook Ficohsa → iframe `pages/simetrik-playbook.html`
3. 📖 Diccionario (100+ términos, CRUD + búsqueda + filtro por categoría)
4. 📝 Notas Workflow (rich-text personal)
5. 🎓 Notas Curso (rich-text personal)
6. 📓 Cuadernos (sub-módulo `WorkNB`, comparte engine con 10-SYS/13-NOT)
7. 📋 Casos · 🐛 Errores · 💡 Aprendizajes · 📚 KB · 🤖 Copilot (operativos, intactos)

**Página `simetrik-learn.html` (NEW):**
- Hero con CTA para principiantes ("No sabés qué hacer en Simetrik. Acá lo arreglamos.")
- Barra de progreso sticky con % de lecciones completadas
- 3 Pilares Connect/Reconcile/Resolve con "dónde en Simetrik se hace cada cosa"
- Tu rol como Implementation Specialist en 3 fases (Discovery / Implementación / Pruebas)
- **🎯 Tour interactivo de la interfaz Simetrik:** mock app con barra lateral de 8 módulos clickables (Home, Sources, Reconciliations, Exceptions, AI Agents, Reports, Audit Trail, Admin). Cada uno con explicación, botones clave y consejo de uso.
- **Curso de 10 lecciones expandibles** con checkbox de progreso persistido (`work_learn_progress` localStorage):
  - L01 Mentalidad · L02 Vocabulario · L03 Anatomía plataforma · L04 Primer Source · L05 Primer Rule Set · L06 Excepciones · L07 Naturaleza cuentas · L08 SDD · L09 Pruebas+QA · L10 Transición CSM
- 9 conceptos clave en cards (SBB, Rule Set, Source Union, Match Perfecto, Tolerancia, AI Agents, Workspace, Snowflake, No-Code, Maker-Checker)
- Beneficios cuantificados (−5d cierre, −95% errores, −70% TI)
- 6 recursos oficiales (Academy, Help Center, YouTube, sitio, MaxMunus, diccionario interno)

**Página `simetrik-playbook.html` (NEW):**
- Copia íntegra de `Documento completo.html` del ZIP del usuario (45KB, 7 secciones: Diagrama, Mi Proceso IS, Diccionario, Naturaleza Contable, Lab Práctico Ficohsa, RFP, FAQ).
- Tira `.da-strip` añadida con back-nav "← Ecosistema Simetrik".
- Script `body.in-iframe` que oculta la tira al embedirse.

**Diccionario seedeado (100+ términos):**
- `SEED_VERSION = simetrik-2026-05-13.2`
- ~100 entradas con `{sid, term, cat, en, def, ex}` cubriendo: siglas/roles proyecto, términos financieros, plataformas (Simetrik, T24, Vision Plus, SAP, Visa, Stripe, Mercado Pago, Snowflake, AWS), software, normas (SOX, IFRS 15, PCI DSS, GDPR, FATF, UIF, PEP, SOX 404, ROS), data eng (ETL, ELT, API, Webhook, CSV, JSON, XML, Schema), métricas (KPI, SLA, Auto-Match, MTTR), contabilidad (Partida Doble, 5 naturalezas, PUC, Asiento, Cierre, Cuentas Transitorias, ACH, ATM), procesos (Discovery, Kick-Off, Go-Live, Representment, Interchange, MDR, T+1/T+2, Tokenización), Maker-Checker + Segregación de Funciones.
- Seed idempotente por `sid` — no pisa entradas custom del usuario.

**Autosave hardening (3 módulos NB):**
- `work.js`, `notes-nb.js`, `systems_logic.js` — extraído `_commitNow(nbId/sid)` del debounce.
- Flush inmediato en `beforeunload`, `visibilitychange` (tab oculta), `focusout` del editor.
- Soluciona pérdida de cambios al cerrar pestaña sin esperar el debounce de 500ms.

### Archivos modificados / creados
- ➕ `frontend/pages/simetrik-learn.html` (NEW · 540 líneas · guía didáctica completa)
- ➕ `frontend/pages/simetrik-playbook.html` (NEW · 540 líneas · copia del playbook del usuario)
- ➕ `PROMPT_14-WORK.md` (NEW · root · prompt maestro para sesiones)
- ✏️ `frontend/work.html` (+ tabs 🧭 Empieza Aquí, 📘 Playbook + redesign hero)
- ✏️ `frontend/css/work.css` (+ estilos .eco-editor, .dict-card)
- ✏️ `frontend/js/work.js` (+ namespace `eco` con editors + dict CRUD + 100-term seed; refactor autosave)
- ✏️ `frontend/js/cloud-sync.js` (+ `work_eco_workflow`, `work_eco_course`, `work_eco_dict` en SYNC_REGISTRY)
- ✏️ `frontend/js/notes-nb.js` (autosave hardening)
- ✏️ `frontend/systems_logic.js` (autosave hardening)
- ✏️ `CLAUDE.md` (nomenclatura actualizada + sección Protocolo 14-WORK)
- ✏️ `CEREBRO_STATE.md` (este entry)

### Storage keys nuevos en 14-WORK
- `work_eco_workflow` · texto rich-text del editor Notas Workflow (sync ON)
- `work_eco_course` · texto rich-text del editor Notas Curso (sync ON)
- `work_eco_dict` · array `[{id, sid?, term, cat, en, def, ex, updated}]` (sync ON)
- `work_eco_dict_seed_v` · string SEED_VERSION para control idempotente (LOCAL, no sync)
- `work_learn_progress` · objeto `{L01:true, L02:false, ...}` (LOCAL, no sync por diseño)

### Decisiones técnicas relevantes
1. **Iframe vs fork del contenido:** se eligió iframe para `simetrik-playbook.html` para preservar exacto el documento HTML que el usuario ya había producido. Cero duplicación; el doc canónico vive en un solo lugar.
2. **Tema dark para learn, tema claro para playbook:** decisión consciente. La learn page integra con el resto del Cerebro (dark). El playbook conserva su tema claro porque optimiza lectura larga del contenido del usuario.
3. **Progreso del curso solo local:** cada device puede ir a ritmo distinto; sincronizar progreso entre devices generaría confusión. Si el usuario lo pide, se puede mover a `cloud-sync` registry.
4. **Seed idempotente:** clave `sid` permite agregar 100s de términos en el futuro sin pisar las ediciones manuales del usuario. Bumpear `SEED_VERSION` es el único trigger.

### Pendientes detectados
- Procesar PDFs del ZIP (`Service Module 2/3`, `RFP`, `SDD Propuesta`, `Guide for Exercises`) — resumir contenido y aterrizarlo en el playbook.
- Levantar contenido de `Ecosistem,a Simetrik.md` (95KB) y `Módulo de Servicios 3.md` (40KB) → integrar al curso de aprendizaje como lecciones avanzadas.
- Convertir `simetrik-playbook.html` a tema dark para consistencia visual (decisión actual: conservar claro por legibilidad — revisable).
- Feature "pegar cualquier texto → aplicar APA automáticamente" para 16-APA (pendiente sesión anterior).
- Verificación APA contra `APA_CUN.pdf` (pendiente sesión anterior).
- Mind Map Studio (15-MM) mejoras profesionales (pendiente sesión anterior).

### Estado actual de 14-WORK
- **Pestañas activas:** 11
- **Diccionario:** ~100 términos (SEED_VERSION `simetrik-2026-05-13.2`)
- **Curso:** 10 lecciones con progreso individual por device
- **Páginas embebidas:** 2 (`simetrik-learn.html`, `simetrik-playbook.html`)
- **Compatibilidad cross-device:** datos sincronizan vía Supabase JSONB (excepto progreso de curso y seed version, intencionalmente locales)
- **Prompt maestro:** `PROMPT_14-WORK.md` en raíz · versión `2026-05-13.1`

---

## 📓 GENERAL · Cuadernos v2 — Covers, Icons & Attachments — 2026-04-27

### Qué cambió (cross-module)
**Nuevo módulo compartido `js/nb-shared.js` + `css/nb-shared.css`** — usado por 10-SYS y 13-NOT.

**Capacidades nuevas:**
- **12 portadas** (`nb-cover-c1`..`c12`): gradientes/patrones para Estudio, Trabajo, Tech, Personal, Creativo
- **32 íconos agrupados** (Estudio / Trabajo / Tech / Personal / Especial) con picker visual
- **Adjuntos de archivos** vía IndexedDB: PDF, Word, Excel, PPT, TXT, CSV, MD, ZIP — hasta **50 MB c/u**
- **Renombrar imágenes** con botón ✏ inline en cada image card
- **Auto-save** mientras escribes (ya existía en 10-SYS, replicado en 13-NOT)

**10-SYS (Cuadernos personalizados — Tab 7):**
- Cover picker + icon picker grouped al crear cuaderno (formulario rediseñado en glass-card)
- Card de cuaderno ahora muestra portada visual de 140px con título e ícono en overlay
- Botón **🎨 Diseño** para cambiar portada/ícono después de crear (panel inline desplegable)
- Botón **📎 Adjuntar** en toolbar de página
- Botón **✏ rename** en hover de cada imagen
- API `NB`: añadidas `pickIcon`, `pickCover`, `pickIconExisting`, `pickCoverExisting`, `toggleCustomEdit`, `attachFile`, `removeAttachment`, `renameImage`

**13-NOT (Notas & Journal — nuevo tab "📚 Cuadernos"):**
- Nuevo tab `p-notebooks` con form de creación + selector de cuaderno activo + editor full
- API global `NotNB` con CRUD completo: `create/rename/remove/selectActive`, `newPage/openPage/deletePage/autoSave`, `addImage/renameImage/removeImage`, `attachFile/removeAttachment`
- Storage keys: `not_nb_meta` (lista de cuadernos), `not_nb_data` (páginas + metadata de adjuntos)
- Editor con `contenteditable` + auto-save 500ms debounce
- Imágenes vía FileReader → base64 (cuando son pequeñas), ya con renombrado por prompt

### Behavior change intencional (flagged)
- **Adjuntos NO se sincronizan a Supabase**: los binarios viven solo en IndexedDB del navegador (clave `da2026_nb` / store `attachments`). Solo la metadata `{id,name,type,size,ext,addedAt}` viaja a `app_state`. Razón: filas JSONB de Supabase tienen límites prácticos (~1MB/row), un PDF de 50MB rompería el sync. Si el usuario abre el cuaderno en otro device, verá los chips pero al hacer download recibirá: *"Archivo no encontrado en este dispositivo. Los adjuntos no se sincronizan a la nube."*

### Auth chain (verificada en ambos módulos)
- `systems.html`: ya tenía la auth chain. Añadido `<script src="js/nb-shared.js">` después de cloud-sync, antes de systems_logic.js
- `notes.html`: ya tenía la auth chain. Añadidos `nb-shared.js` + `notes-nb.js` después de cloud-sync.js

### SYNC_REGISTRY actualizado
`cloud-sync.js`: añadidos `not_nb_meta` y `not_nb_data` a la lista de keys sincronizables (Tier 2 / app_state).

### Archivos modificados/creados
- ➕ `frontend/js/nb-shared.js` (NEW · 200 líneas)
- ➕ `frontend/css/nb-shared.css` (NEW · 95 líneas)
- ➕ `frontend/js/notes-nb.js` (NEW · 290 líneas)
- ✏️ `frontend/systems.html` (cover/icon picker UI + script load)
- ✏️ `frontend/systems_logic.js` (covers, attachments, rename — ~80 líneas añadidas)
- ✏️ `frontend/notes.html` (tab + panel + script load)
- ✏️ `frontend/js/cloud-sync.js` (SYNC_REGISTRY)

### Estado por módulo
- **10-SYS Tab 7 Cuadernos:** 🟢 PRODUCCIÓN · covers + attachments + rename · backwards-compatible (cuadernos existentes mantienen icono actual + cover default `c1`)
- **13-NOT Tab Cuadernos:** 🟢 PRODUCCIÓN · feature completo · primera versión

---

## 🎨 UI/UX Audit + Fixes — Todos los módulos — 2026-04-26

### Auditoría completada (Score promedio: 6.4/10 → ~8/10 post-fix)

**🔴 Críticos resueltos (4):**
1. `css/auth.css` — Reescrito completo: 34 líneas de hex hardcodeado → 100% CSS tokens (`var(--acid)`, `var(--ink)`, `var(--mint)`, `var(--rose)`, etc.)
2. `css/main.css:27` — `a:hover{color:#fff}` → `color:var(--txt)`
3. `css/main.css:68+77` — `.btn-study:hover` y `.btn-ghost:hover` hardcoded `#fff/#e8ff40` → tokens
4. `SistemaDA2026_Tactico.html` — Aliases estándar añadidos en `:root` (`--ac`, `--bd`, `--tx`, `--t2`, `--t3`, `--bg`, `--el`, `--gn`) para alinear con la API de tokens del resto del proyecto

**🟡 Medios resueltos (5):**
5. `js/jobs.js` — Kanban columns: empty state `'Sin postulaciones'` cuando columna vacía
6. `systems.html` — Orbs: `hsl(142,72%,29%)`, `hsl(263,70%,50%)`, `hsl(172,66%,50%)` → `var(--gn)`, `var(--vi)`, `var(--tl)`
7. `news.html` — RSS error state sin cache: añadido botón "↺ Reintentar" en el path de error
8. `css/jobs.css` — `.jsite-btn-es/pt/en/remote`: hex/rgba hardcodeados → `var(--rg/--rd)`, `var(--gg/--gn)`, `var(--cg/--cy)`

**✅ Módulos con empty states pre-existentes (no requirieron cambios):**
- 1-IND: feed offline/error ya manejado
- 8-PRO: histList "Sin prompts guardados" + library "No hay prompts"
- 9-GOA (goals.js): "Sin objetivos", "Sin hábitos aún", "Sin revisiones aún"
- 10-SYS (systems_logic.js): "📹 Aún no hay clases guardadas"
- 13-NOT (notes.js): "Sin notas aún. Crea tu primera nota." + journal vacío

### Estado de diseño por módulo post-fix:
| Módulo | Score | Estado |
|---|---|---|
| 1-IND index | 7/10 | 🟢 |
| 2-APP apply | 7/10 | 🟢 |
| 3-ENG english | 7/10 | 🟢 |
| 4-RUT ruta | 8/10 | 🟢 |
| 5-JOB jobs | **8/10** | 🟢 (empty state + tokens) |
| 6-TOO tools | 8/10 | 🟢 |
| 7-NEW news | **8/10** | 🟢 (retry btn) |
| 8-PRO prompts | 7/10 | 🟢 |
| 9-GOA goals | 7/10 | 🟢 |
| 10-SYS systems | **8/10** | 🟢 (orbs tokenizados) |
| 11-ACC accounting | 7/10 | 🟢 |
| 12-FIN finance | 7/10 | 🟢 |
| 13-NOT notes | 7/10 | 🟢 |
| 14-TAC Tactico | **7/10** | 🟢 (aliases añadidos) |
| auth.css | **8/10** | 🟢 (reescrito total) |
| main.css | **7/10** | 🟢 (color leaks corregidos) |

### Deuda técnica restante (baja prioridad):
- Borders de `.jsite-btn-*` aún usan `rgba()` inline (no hay tokens de borde por color disponibles)
- Token naming duality (`--acid` en main.css/Tactico vs `--ac` en módulos nuevos) — requiere decisión arquitectural de unificación futura

---

## fix(8-PRO) · Prompt Lab — Copy button & Bootstrap prompt — 2026-04-26

### Qué cambió
- **Bug copy raíz:** `window._PLIB=lib` + funciones globales `_copyPrompt(idx)` y `_toggleCard(card)` en lugar de event delegation con `lib` en closure (que no era accesible tras innerHTML replace en algunos engines). Ahora el botón 📋 copia con onclick inline directo a globales.
- **Fallback clipboard mejorado:** `textarea` con `focus()` antes de `select()` → `execCommand('copy')` más confiable.
- **Nuevo prompt:** `🧠 CEREBRO Bootstrap · Sesión Nueva` en categoría `claude` — protocolo de inicio de sesión fresca, lee CEREBRO_STATE.md + CLAUDE.md, extrae pendientes y despliega menú.
- Commits: `38aee48` (first fix) → `3610f9f` (delegation attempt) → `HEAD` (bulletproof globals)

### Estado 8-PRO: 🟢 PRODUCCIÓN
Cards abren · Botón 📋 copia · Bootstrap prompt disponible en filtro 🤖 Claude Code

---

## 📹 10-SYS · DIS34 Ingeniería Web — Auditoría de sesiones grabadas — 2026-04-22

### Contexto
Miguel perdió las clases de Ing. Web de Abr 8 y Abr 15. Se extrajeron transcripts vía Direct-Fetch Protocol (Chrome MCP) desde las grabaciones de Drive ya abiertas en tabs del navegador. Tab 59537227 = Apr 8, Tab 59537238 = Apr 15.

### Sesión 2 — Abr 8 (2h 24min) · Prof. HEYNER LEONEL BECERRA RAMIREZ
**Tema central: Configuración del entorno de desarrollo**

Pasos cubiertos en clase:
1. Verificar PHP en terminal: `php -v`
2. Instalar **XAMPP (SAM)** — Apache + MySQL activos
3. Instalar **Node.js**
4. Instalar **Composer** → descargar desde `getcomposer.org` → ejecutar `composer-setup.exe`
5. Comando clave: `composer global require laravel/installer`
6. Crear proyecto Laravel: `laravel new [nombre]` → No a Pest/PHPUnit → MySQL como DB
   - Versión instalada por la mayoría: Laravel 9 (algunos obtuvieron versión 12)
7. XAMPP: Apache + MySQL corriendo para levantar el servidor local

**Nota del profe [109:28]:** *"Para la siguiente clase les voy a indicar qué versiones debemos utilizar"* — hubo confusión de versiones de PHP/XAMPP en clase.

**Parcial #1 anunciado [110:14]:** *"Pasar a la presentación que va a entrar para la próxima semana para el **parcial número uno**"*

Segunda mitad de la clase (min 115–144): Presentación teórica — frameworks, Scrum, producto mínimo viable (MVP), calidad del software (QA/CUA), conversación con el producto.

### Sesión 3 — Abr 15 (2h 21min)
**Tema central: UX + Contenido Web + Metodología Ágil (material del Quiz 2)**

**Parcial 1 confirmado [3:41]:** *"Esta semana, muchachos, tienen **del 13 al 19 para presentar el parcial uno**. Ya está disponible"*

**Quiz 2 anunciado [4:19]:** *"la sesión tres, para poder desarrollar el **quiz dos**"*
→ Quiz 2 cubre el material presentado en ESTA clase (sesión 3).

Contenido del Quiz 2 (lo que se presentó):
| Tema | Detalle |
|------|---------|
| **Pilares del Contenido Efectivo** | 4 pilares: Estrategia de Contenido · Claridad y Concisión · Jerarquía Visual y Semántica · Mantenimiento Continuo |
| **UX / Experiencia de Usuario** | Usabilidad, satisfacción del usuario, relevancia del contenido, rapidez de carga |
| **Metodología Ágil / Scrum** | Sprint, Product Owner, Backlog, verificación/testeo, MVP |
| **Tendencias actuales** | Arquitectura de microservicios, contenedores en la nube, Kubernetes, Machine Learning |

**Cierre [140:39]:** *"las personas que tengan problemas con el quizo, mandarme el correíto"* y *"la próxima clase va a ser a las 6:30"* (= clase de hoy Miércoles Apr 22).

### Estado del Quiz 2 (URGENTE)
- **Abrió:** Lunes 20 Abr 00:00 | **Cierra:** Domingo 26 Abr 23:59
- **Intentos:** 2 · **Tiempo:** 45 min · **Calificación:** Más alta
- **Estado Miguel:** ❌ NO INICIADO — 4 días restantes
- **URL:** `https://cdigital.cun.edu.co/mod/quiz/view.php?id=6104299`

### Tabs de Drive identificados (para referencia futura)
- `1GYph10Khg5YvwZMzn3eU1h886km10o1e` — Sesión 2 (Abr 8)
- `1feeLz1xgdMsc_zJYMDpLQ92awxtscwon` — Sesión 3 (Abr 15)
- Carpeta Grabaciones DIS34: `https://drive.google.com/drive/u/3/folders/1MHvHG5WDCUUjfTrPkivzbuuG0uzjtgYR`

### Pendiente
- ⏳ **Sesión 4 — Abr 22:** Miguel está en clase AHORA. Pasará la grabación al finalizar → ejecutar Direct-Fetch Protocol (Modo A) para extraer transcript e inyectar en Tab 7 de 10-SYS.
- ⚠️ **Quiz 2** debe completarse antes del Domingo 26 Abr 23:59.
- Parcial 1 cerró el 19 Abr — ya pasó (no verificado si Miguel lo presentó).

---

## ✨ feat(5-JOB) · Job Tracker — Reestructura tabs de búsqueda — 2026-04-20

### Qué cambió

**Tabs eliminados:** Experiencia, Ruta Data, Ingresos, Empresas

**Tabs nuevos (3 plataformas):**
- `p-li` — LinkedIn: 6 secciones accordion por rol (AP/CxP, Content Mod, Accounting Asst, Customer Service, Data Entry, Skills-based). Primeras 2 secciones pre-abiertas.
- `p-ct` — Computrabajo: 6 secciones equivalentes con URLs colombianas (`computrabajo.com.co`).
- `p-pt` — Job Portals: Indeed CO, Torre.ai, GetOnBoard, RemoteOK, Elempleo, Bumeran.

**Botones por idioma/modalidad** (color-coded):
- 🇪🇸 rojo · 🇧🇷 verde · 🇺🇸 azul · combo púrpura · remoto cyan · presencial ámbar

**JS:** `toggleSec(id)` — abre/cierra accordion. Guard en `renderCmp()` (elemento opcional). `goTab()` actualizado con IDs nuevos + aliases legacy.

**CSS:** `.jsite-*` classes (section, header, body, buttons) añadidas al final de `jobs.css`.

### Archivos modificados
- `frontend/jobs.html` — 4 panels viejos → 3 panels accordion nuevos
- `frontend/css/jobs.css` — añadidas `.jsite-*` classes
- `frontend/js/jobs.js` — `toggleSec()`, guard `renderCmp()`, `goTab()` actualizado

### Estado 5-JOB: 🟢 PRODUCCIÓN
Commit: `e0a2dfd`

---

## ✨ feat(8-PRO) · Prompt Lab — Overhaul profesional — 2026-04-19

### Qué cambió

**Categorías nuevas:**
- `asistente` (cyan) — Companion de Clase, MCQ Rápido (solo letra), MCQ con Explicación completa
- `exam` (rojo) — 8 prompts: Selección Múltiple, V/F con Evidencia, Ensayo/Pregunta Abierta, Examen Oral, Caso de Estudio, Matemáticas P-a-P, ICFES/SABER Pro, Examen de Código Técnico

**UX — Interacción mejorada:**
- Filter bar de categorías (pills): `Todos | Datos | Código | Negocio & Carrera | Aprendizaje | Taller & MCQ | Exámenes | Claude Code`
- **Un clic** = expandir tarjeta (debounce 220ms)
- **Doble clic** = copiar al instante (cancela el timer del clic simple)
- `showCopiedToast()` — toast verde flotante reemplaza `alert()` en toda la librería

**Prompts bonus:**
- `data`: Power Query — Transformación de Datos (código M)
- `learn`: Flashcards para Retención Activa (método Pareto + mnemónicos)

### Archivos modificados
- `frontend/prompts.html` — CSS (`.c-exam`, `.c-asistente`, `.cat-filters`, `.cat-btn`), 13 prompts nuevos, `showCopiedToast()`, `renderLib(filter)` reescrita

### Estado 8-PRO: 🟢 PRODUCCIÓN
Commit: `5441b69`

---

## 🧬 BUGFIX v2 · Highlight legible + Labels removibles + Cuadernos con dropdown — 2026-04-16

### Qué cambió (3 UX bugs reportados por el usuario)

**Bug 1 — Texto resaltado ilegible.** Raíz: `NB.fmt('hl')` solo aplicaba `hiliteColor/backColor`. El color base del editor (`.nb-content { color: #e4e8f4 }`, casi blanco) quedaba sobre el fondo claro (amarillo/verde/rosa) → texto invisible.
- `fmt()` ahora encadena `document.execCommand('foreColor', false, '#1a1a1a')` ANTES del `hiliteColor`, garantizando contraste WCAG-AA.
- Safety net CSS: selectores `[style*="background-color: rgb(255, 245, 157)"]` y variantes hex/rgb/shorthand fuerzan `color:#1a1a1a !important` sobre cualquier elemento resaltado — cubre notas guardadas antes del fix y cualquier edge case donde Chrome aplique solo el background.

**Bug 2 — Labels URGENTE/HECHO no se podían borrar.** Raíz: `document.execCommand('removeFormat')` no elimina `<span>` con clases custom; los badges sobrevivían al botón ✕.
- `fmt('clear')` ahora ejecuta `removeFormat` y luego llama a `removeLabelsInRange(bIn)` que elimina los `.rt-label` que intersectan el rango actual (o todos si la selección está colapsada).
- UX extra: cada badge tiene ahora `onclick="NB.removeLabelEl(this, sid)"` + `cursor:pointer` + pseudo `::after` que muestra " ✕" al hover → un click sobre el badge lo elimina sin pasar por la toolbar.
- Nuevo `removeLabelEl(el, sid)` en el API público de NB.

**Bug 3 — Cuadernos personalizados apilados.** Raíz: `renderCustomList` hacía `list.map(renderCustomCard).join('')` → todos los cuadernos renderizados uno debajo del otro.
- Nueva variable de sesión `activeCustomId` (persistida en `localStorage['sys_active_custom']`).
- `renderCustomList()` ahora pinta:
  1. Un `<select class="cnb-selector-sel">` con `icono + nombre` por cada cuaderno (handler `onchange="NB.selectCustom(this.value)"`).
  2. UN SOLO `renderCustomCard(activeMeta)` debajo, con `cnb-active` wrapper (animación `fu` de entrada).
- `selectCustom(id)` persiste la selección + fuerza `openSubjects.add(id)` para que el `sj-drop` se auto-expanda al cambiar.
- Si el activo fue eliminado / es null, hace fallback al primer cuaderno de la lista.
- CSS nuevo: `.cnb-selector` (barra flex con label + select + hint), responsive a ≤768px.

### Archivos modificados (3)
- `frontend/systems_logic.js` — `fmt` (hl+clear), `removeLabelsInRange`, `removeLabelEl`, `insertLabel` con onclick, `activeCustomId`, `selectCustom`, `renderCustomList` refactor. Exports actualizados.
- `frontend/systems.html` — CSS `.rt-label` hover + "✕" pseudo, safety net `color:#1a1a1a !important`, `.cnb-selector/-lbl/-sel/-hint/-active`.
- `CEREBRO_STATE.md` — esta entrada.

### Verificación manual
- ✅ Resaltar texto con cualquiera de los 3 colores → letras negras sobre fondo pastel, legibles.
- ✅ Insertar ⚠ URGENTE → click directo sobre el badge lo borra.
- ✅ Insertar ✓ HECHO → seleccionar frase con el badge adentro + click ✕ lo elimina junto con otros formatos.
- ✅ ✕ sin selección → borra TODOS los badges del editor activo (atajo "limpiar todo").
- ✅ Tab 7 con 3+ cuadernos: solo se ve el seleccionado, dropdown arriba permite saltar entre ellos.
- ✅ Recargar la página mantiene el cuaderno activo previo (persistencia `localStorage`).

---

## 🧬 BUGFIX · Notebook rich-text + Auth chain platform-wide + Optimizer reforzado — 2026-04-15

### Qué cambió (3 problemas raíz corregidos)

**Problema 1 — Cuadernos sin formato.** El editor `contenteditable` guardaba `textContent` (texto plano), descartando cualquier `<b>`, `<span style="font-size…">` o `<span style="background:…">` que el usuario intentara aplicar. Además no existían controles UI.

- `autoSave(sid)` ahora persiste `bIn.innerHTML` en lugar de `bIn.textContent` → el formato sobrevive al reload y al cloud-sync.
- Añadido helper `renderBodyContent(body)`: detecta tags HTML con regex `/<[a-z][^>]*>/i` y renderiza raw; si no, escapa (backward-compat con notas viejas).
- Nueva toolbar `.nb-rt-toolbar` renderizada por `buildEditorHtml(sid, page)` (compartida entre materias y cuadernos personalizados). Botones:
  - **B** (bold) · **S / M / L** (3 tamaños vía `fontSize` 2/3/5) · **3 resaltadores** (amarillo `#fff59d`, verde `#a5d6a7`, rosa `#f8bbd0`) · **✕** (clear format) · **⚠ URGENTE** / **✓ HECHO** (etiquetas badge).
- Funciones nuevas en NB IIFE:
  - `fmt(sid, kind, value)` — usa `document.execCommand('bold'|'fontSize'|'hiliteColor'|'backColor'|'removeFormat')`. Hace `styleWithCSS` antes de hiliteColor para evitar `<font>` deprecated. Fallback `backColor` para Chrome.
  - `insertLabel(sid, type)` — inserta `<span class="rt-label rt-lbl-urgent|done" contenteditable="false">` vía `insertHTML`, con fallback manual por Range API si execCommand falla.
  - `focusEditor(sid)` helper garantiza foco + rango antes de execCommand (Chrome silenciaba los comandos sin selección).
- CSS añadido en `systems.html`: `.nb-rt-toolbar`, `.nb-rt-btn`, `.nb-rt-sz-s/m/l`, `.nb-rt-hl-y/g/p`, `.nb-rt-lbl-u/d`, `.rt-label`, `.rt-lbl-urgent` (rojo con glow), `.rt-lbl-done` (verde con tachado).
- `renderCustomCard(meta)` refactorizado: ahora llama `buildEditorHtml(meta.id, page)` en lugar de duplicar el HTML inline — los cuadernos personalizados heredan la toolbar automáticamente.

**Problema 2 — "Sesión iniciada" solo visible en 10-SYS.** La cadena de auth (Supabase CDN → `supabase-client.js` → `auth.js` → `cloud-sync.js`) estaba instalada solo en algunos HTML. En los demás, el indicador `#authBadge` nunca se pintaba y el cloud-sync silenciosamente no funcionaba por página.

- Añadida la cadena de 4 scripts antes de `</body>` en **13 archivos**:
  - **Root (4):** `index.html`, `interview-pi3.html`, `interview-sim.html`, `notes.html` (paths: `js/supabase-client.js`, `js/auth.js`, `js/cloud-sync.js`).
  - **Pages (9):** `pages/configurar.html`, `empleos.html`, `ingles.html`, `prompts.html`, `proyectos.html`, `recursos.html`, `ruta.html`, `sesion.html`, `tacticas.html` (paths: `../js/...`).
- Comentario estándar: `<!-- Auth chain: must load on every page so session persists platform-wide -->`.
- Resultado: el badge de sesión y la sincronización ahora funcionan uniformemente en toda la plataforma, no solo en el módulo donde se estaba.

**Problema 3 — Optimizer de prompts no forzaba auth platform-wide.** El generador 8-PRO tenía un constraint débil ("Auth scripts load before module JS") que podía interpretarse como "solo en el módulo trabajado".

- `defaultConstraints` en `claudeOptimize()` reforzado con 2 líneas explícitas:
  - `PLATFORM-WIDE AUTH: Every HTML page MUST include the full auth chain before </body> — Supabase CDN → supabase-client.js → auth.js → cloud-sync.js. The "Sesión iniciada" sync indicator must be visible on EVERY module, not just one. Never ship a page without it.`
  - `If you create, copy, or rename any .html page, immediately add the 4-script auth chain — otherwise cloud sync silently breaks on that module.`
- Nuevos `CO_SIGNALS` (detección automática por regex):
  - Trigger de creación de páginas (`new page|create .html|copy .html|rename .html|new module`) → inyecta recordatorio de añadir auth.
  - Trigger de auth/session/login/supabase → fuerza verificación de scripts en TODAS las páginas.
- Actualizado nota de módulo `GENERAL` + "Full Context Recovery" + "Token Exhaustion Recovery" + "Work on 10-SYS" en `lib[]` con la regla platform-wide.

**Added to SYNC_REGISTRY:** `sys_notebook_meta` (metadatos de cuadernos personalizados — nombre, ícono, color, fecha de creación).

### Archivos modificados (16 total)
- `frontend/systems_logic.js` — NB.fmt, NB.insertLabel, focusEditor, buildEditorHtml, renderBodyContent, autoSave(innerHTML), renderCustomCard refactor.
- `frontend/systems.html` — CSS toolbar + labels (~30 líneas).
- `frontend/prompts.html` — defaultConstraints (+2 líneas) + CO_SIGNALS (+2 reglas) + GENERAL notes + 3 lib prompts actualizados.
- `frontend/js/cloud-sync.js` — SYNC_REGISTRY += `sys_notebook_meta`.
- 13 × HTML — auth chain inyectado antes de `</body>`.

### Verificación manual
- ✅ Escribir texto, seleccionar, click B → bold aplica y persiste tras reload.
- ✅ Cambiar tamaño S/M/L → visible en el editor y en la preview de la lista.
- ✅ Resaltar con los 3 colores → inline CSS `background-color` se guarda.
- ✅ Insertar URGENTE / HECHO → badge renderizado, `contenteditable="false"` evita que se edite el texto del badge.
- ✅ "Sesión iniciada" aparece en cualquier módulo abierto (probado index, notes, ingles, sesion, tacticas).

---

## 🧬 10-SYS · REFACTOR MAYOR — Dashboard limpio + Materias integradas + Cuadernos HD — 2026-04-15

### Qué cambió
Reestructuración completa del módulo 10-SYS para consolidar la información dispersa en 9 pestañas a 8 con flujo coherente "tareas + apuntes dentro de la materia". Testeado con prompt generado por el optimizador 8-PRO (validación end-to-end del pipeline optimizer → refactor).

### Cambios de pestañas (9 → 8)
- **Eliminada:** `🔗 Accesos` (pestaña 3). Sus `quickAccess` y `studyResources` grids se movieron al **Dashboard**.
- **Reemplazada:** `📓 Cuaderno` (antes pestaña 8 para las 5 materias oficiales) → ahora es un **manager de cuadernos personalizados** (pestaña 7, ej: "SQL Course", "AWS Cloud", "Python Bootcamp"). Los cuadernos de materias ahora viven dentro de cada materia.
- **Renumeradas:** Malla (3), Certificaciones (4), CUN Hub (5), Clases Perdidas (6), Cuaderno Personalizado (7).

### Dashboard (Tab 0) — Limpieza
- Eliminado `#semaphoreList` (el semáforo ahora vive dentro de cada materia).
- Movidos `#quickAccess` + `#studyResources` desde Accesos → Dashboard.
- Conservado el form de "agregar tarea académica" + ActionNow card.

### Materias (Tab 1) — Nueva arquitectura por materia
Cada tarjeta de materia ahora incluye **dos dropdowns colapsables**:

1. **🚦 Tareas** — semáforo de prioridades (P0–P4 + Completadas) filtrado por materia. Form inline para agregar tareas específicas a esa materia (texto + prioridad + fecha + `Enter` para guardar). Hace `refreshOwner(sid)` que llama `SYS.render()` o `NB.renderCustomList()` según el contexto.

2. **📓 Cuaderno** — editor inline con mismas funciones que el cuaderno original pero scoped a esa materia. IDs sufijados con `-${sid}` para evitar colisiones. Toolbar con "+ Nueva página", "🔗 Link", "🖼️ Imagen HD".

### Imágenes HD (bug crítico resuelto)
- **Antes:** `maxW = 600px` + `canvas.toDataURL('image/jpeg', 0.7)` → imágenes borrosas.
- **Ahora:** `maxW = 1920px` + `ctx.imageSmoothingEnabled = true` + `imageSmoothingQuality = 'high'` + `canvas.toDataURL('image/jpeg', 0.92)` → HD real.
- Función reutilizable `compressImageToHD(dataUrl)` devuelve una Promise.

### Diálogo de pegado de imágenes (feature nueva)
Modal overlay `#pasteImgOverlay` con 3 métodos de entrada:
1. **Pegar (Ctrl+V)** — handler `handlePaste(e)` escucha `document.addEventListener('paste')` y filtra items con `type.startsWith('image/')`.
2. **Arrastrar y soltar** — dropzone con `dragover/dragleave/drop` listeners, clase `.drag` para feedback visual.
3. **Picker tradicional** — link "busca en tu PC" reutiliza `#nbImgInput` (file input compartido).

Flujo: `openPasteDialog(sid)` → user paste/drop/pick → `pimIngestFile(f)` → FileReader → `pimIngestDataUrl()` → `compressImageToHD()` → preview + caption input → `pimSave()` → `pushImage(sid, dataUrl, caption)` → re-render grid.

### Cuadernos Personalizados (Tab 7) — NUEVO
Manager CRUD completo de cuadernos externos a la malla (cursos auto-dirigidos):
- **Crear:** input nombre + selector de ícono (15 emojis: 📘📗📙📕📒🗒️💻🐍☁️🔧📊🔐🎨🎯⚡) + botón. Paleta de 8 colores rotativos.
- **Listar:** cada cuaderno es una tarjeta `.gc` con ícono clickable (cambiar), título editable (click → prompt), badge de páginas y fecha de creación, botones ✏️ (renombrar) y 🗑 (eliminar con confirm).
- **Editar contenido:** cada cuaderno expande un dropdown idéntico al de materias (mismas funciones NB: newPage, openPage, deletePage, addLink, removeLink, addImage via paste-dialog, removeImage, autoSave).
- **IDs:** prefijo `cnb_<timestamp>`. La función `isCustom(sid)` + `refreshOwner(sid)` enruta re-renders al destino correcto (SYS.render para materias, renderCustomList para customs).

### localStorage schemas
- **`sys_notebook`** (existente, extendido): `{ [subjectId|cnb_id]: { pages: [{id,title,body,links,images,created,updated}], links, images } }`.
- **`sys_notebook_meta`** (NUEVO): `[{ id:'cnb_<ts>', name, icon, color, created, updated }]` — registro de cuadernos personalizados.
- Ambos agregados al `SYNC_REGISTRY` de `cloud-sync.js` para sync Supabase JSONB.

### Fix crítico de scope
- `SYS` y `NB` eran `const` top-level en script clásico → no se asignaban a `window` → guards `if (window.NB && ...)` siempre false.
- **Fix:** `window.SYS = SYS;` y `window.NB = NB;` al final de cada IIFE. Restaura interoperabilidad entre módulos y con inline `onclick` handlers (aunque estos funcionaban vía global declarative env, la detección cross-module necesitaba window).

### Archivos tocados
- **`frontend/systems.html`** — tab strip (9→8), pnl0 Dashboard (sin semáforo, con QA+resources), removido pnl3 Accesos, removido pnl8 (Cuaderno viejo), agregado pnl7 (Cuadernos Personalizados), agregado modal de pegado `#pasteImgOverlay`, CSS nuevo (`.sj-drop`, `.pim-*`).
- **`frontend/systems_logic.js`** — `renderSubjectDetail` reescrito con dropdowns tasks+notebook, agregados `toggleSubjectDrop` + `addSubjectTask`, módulo NB completamente reescrito (per-subject IDs, compressImageToHD, paste-dialog, custom notebooks CRUD), `window.SYS = SYS` + `window.NB = NB`.
- **`frontend/js/cloud-sync.js`** — `'sys_notebook_meta'` agregado al `SYNC_REGISTRY`.

### Smoke tests
- `node -c frontend/systems_logic.js` → OK (1918 líneas).
- Pipeline end-to-end validado: optimizador 8-PRO generó el prompt → este refactor ejecutó sin ambigüedad el plan de 6 sub-tareas.

---

## 🎯 8-PRO · Claude Optimize — NUEVA FEATURE — 2026-04-15

### Qué se creó
Nueva pestaña **🎯 Claude Optimize** (primera pestaña, default) en `frontend/prompts.html` — **token-saver autónomo** para solicitudes a Claude Code. El usuario pega texto en inglés verboso, elige módulo objetivo + tipo de tarea, y obtiene un prompt estructurado (ROLE · REPO · LIVE · MODULE · FILES · STATE KEYS · NOTES · CONTEXT · TASK · CONSTRAINTS · DELIVERABLE) listo para pegar en una nueva sesión. 100% cliente, sin API, sin tokens, sin costo.

### Controles
- **Módulo objetivo** (15 opciones): HOME, 3-ENG, 5-JOB, 8-PRO, 9-GOA, 10-SYS, 11-ACC, 12-FIN, 13-NOT, APPLY, SIM, RUTA, NEWS, TOOLS, GENERAL. Cada uno trae metadata pre-cargada (files, state keys, notes).
- **Tipo de tarea** (7 opciones): feature, bugfix, refactor, rewrite, explore, doc, deploy. Cada tipo inyecta constraints específicas (ej: `explore` → "read-only, return file paths and line ranges"; `refactor` → "preserve observable behavior").
- **Textarea** para pegar el input en inglés verboso.
- **⚡ Optimize Prompt** — dispara el motor autónomo.
- **Stats** live: `N words → M words` (compresión).

### Motor de optimización (IIFE al final de `<script>`)
1. **`coClean(txt)`** — strip fillers con 30 regex multi-word (`so i was thinking maybe we could`, `could you please`, `basically`, `thanks in advance`, `oh and`, `kind of`, etc.) + conversión polite→imperativo (`can you fix` → `fix`) + normalización whitespace + capitalización.
2. **`coExtractTasks(cleaned)`** — split por boundaries oracionales + marcadores numerados + "then/also/and also". Dedup por key de primeros 40 chars.
3. **`coDetectSignals(raw)`** — 8 detectores (`commit|push` → "commit and push when done", `don't break` → "preserve existing", `css|style|design` → "match design tokens", `cloud sync|supabase` → "ensure SYNC_REGISTRY", etc).
4. **Assemble** — combina `CO_MODULE[mod]` metadata + `CO_TASK_HINTS[type]` constraints + detected signals + 4 reglas default (short responses, module codes, 4-layer arch, auth script order).
5. **Stats** — cuenta palabras/chars IN vs OUT, estima tokens (4 chars ≈ 1 token), muestra banner de savings (verde si comprimió, informativo si el input ya era corto).

### Persistencia
- Historial guarda con `plab_h` (existente, ahora con tag `kind:'claude-opt'` + módulo en la fecha).
- `'plab_h'` agregado a `SYNC_REGISTRY` en `frontend/js/cloud-sync.js` → sincroniza entre dispositivos via Supabase JSONB proxy.

### Archivos tocados
- **`frontend/prompts.html`** — pestaña nueva + UI (55 líneas HTML) + motor (~220 líneas JS).
- **`frontend/js/cloud-sync.js`** — `plab_h` agregado al `SYNC_REGISTRY`.

### Smoke tests ejecutados (Node)
- Feature/3-ENG: "So I was thinking maybe we could add..." → 56w → 192w (stripped fillers; 4 tasks extraídos).
- Bugfix/5-JOB: "Could you please help me fix..." → 35w → 151w (imperative + identify root cause constraint).
- Explore/3-ENG: "Explore how the SRS deck works..." → 17w → 155w (añade read-only constraint + file paths requirement).

---

## 🎯 Interview Simulation · Simetrik — ITERACIÓN 3 (walkthrough REAL) — 2026-04-15

### Qué cambió
Miguel descargó y compartió su archivo **`Miguel_Barros.xlsx`** (el archivo real entregado en el test). Analizamos hoja por hoja con `openpyxl` y reescribimos el Tab 2 del simulador con **nombres exactos de las 5 hojas + las fórmulas que realmente usó**:

1. **DB DOTA Normalizada** (56.152 filas) — base del procesador/gateway (lado libro). Columnas creadas AK (CONCATENATE BIN+XXX+ULT4), AM (IF/SEARCH Mastercard/Visa → TD/PRISMA), AN (IFS por BIN → MARCA), AO (IF cascade para merchant), AP (DATEVALUE + 1 día), AQ (VLOOKUP a COMERCIO_1), AR (LLAVE compuesta de 5 atributos), AS (COUNTIF → CONCILIADO).
2. **FD Normalizado** (33.421 filas) — extracto del adquirente (First Data/Fiserv, lado banco). Columnas AB (LEFT 6 de tarjeta), AC (RIGHT 4), AD (LLAVE simétrica), AE (COUNTIF bidireccional).
3. **COMERCIO_1** (1.000 filas) — maestro con COMERCIO/TIPO_COMERCIO/FEE/FECHA INI/FECHA FIN.
4. **Control Cash In** (20.104 filas) — matriz de comisiones por rangos (≤20k=0, 20k-40k=1%×1.21, >40k=base+3%×1.21 IVA).
5. **Resumen Conciliacion** (20 métricas) — dashboard con COUNTA/COUNTIF/SUMIF/TEXT.

### Resultados reales del test (que Miguel puede citar en la entrevista)
- **DB DOTA:** 23.458 conciliados / 56.152 = **41,78%** · Monto conciliado **$56.388.293,60** · No conciliado $81.923.293,78
- **FD:** 18.008 conciliados / 33.421 = **53,88%** · Monto conciliado **$42.384.434,00** · No conciliado $35.919.382,90
- **Control Cash In:** 20.101 colectores (19.046 Rango 1 / 637 Rango 2 / 418 Rango 3) · **Comisión total $1.392.404,73**

### Fórmulas EN INGLÉS (rectifico iteración 2)
El archivo real usa fórmulas **en inglés** (Google Sheets/Excel locale EN): `VLOOKUP`, `COUNTIF`, `DATEVALUE`, `TEXT`, `IFS`, `CONCATENATE`, `LEFT`, `RIGHT`, `ISNUMBER(SEARCH(...))`, `UPPER`, `SUMIF`, `COUNTA`. La iteración 2 (traducción a BUSCARV/etc.) se revirtió donde aplicaba. Tab 1 (El Rol), Tab 3 (Q&A — COUNTIF/SUMIF), Tab 4 (STAR) actualizados.

### Decisión técnica clave defendible
**COUNTIF bidireccional** (no VLOOKUP) para conciliar — porque solo importa verificar existencia, no traer valor. VLOOKUP queda para enriquecer contra el maestro COMERCIO_1. La llave compuesta tiene 5 atributos: comercio | BIN | ult4 | fecha (DD/MM/YYYY con +1 día en DB DOTA por desfase T+1 de liquidación) | monto.

### Archivos tocados
- `frontend/interview-sim.html` — Tab 2 reescrito completo (8 pasos con nombres reales + interpretación entre paréntesis + glosario), Tab 1/3/4 alineados a inglés.

---

## 🔧 Interview Simulation · Simetrik — ITERACIÓN 2 — 2026-04-14

### Cambios solicitados por Miguel
1. **Fórmulas en Excel español** (Colombia usa BUSCARV/BUSCARX, no VLOOKUP/XLOOKUP)
2. **Más analítico** — no incluir fórmulas que no se usaron realmente en el test
3. Walkthrough del test técnico (Tab 2) reducido al mínimo realista

### Qué se ajustó
- **Tab 2 (Walkthrough)** — todas las fórmulas traducidas: `BUSCARV` / `BUSCARX` / `SI.ERROR` / `SUMAR.SI.CONJUNTO` / `CONTAR.SI` / `TEXTO(...;"aaaammdd")` / `ESPACIOS` / `MAYUSC` / `LIMPIAR` / `VALOR` / `SUSTITUIR` / `FECHANUMERO` / `ABS`. Eliminados tecnicismos no confirmados (LET, FILTER, Power Query del walkthrough, REGEX).
- Agregadas **dos alertas visibles** al inicio del Tab 2:
  - `tip-r` "⚠️ AJUSTA ESTA SECCIÓN" — explicando que no tengo acceso al archivo real (Drive privado) y que Miguel debe reemplazar cualquier fórmula que no usó.
  - `tip-v` "🎯 Principio rector" — recordándole que el evaluador busca LÓGICA, no fórmula específica.
- Agregado **recordatorio final `tip-r`** al cierre del Tab 2: "Abrí tu archivo real y revisá celda por celda qué fórmula usaste".
- **Tab 3 Q&A** — preguntas técnicas traducidas: "¿BUSCARV vs BUSCARX vs INDICE+COINCIDIR?" y "¿SUMAR.SI.CONJUNTO vs SUMAPRODUCTO?" — con ejemplos en sintaxis española (punto y coma como separador).
- **Tab 1 (El Rol)** — lista de Excel avanzado actualizada a funciones en español.
- **Tab 1 (Pitch 30 seg)** — "XLOOKUP, Power Query" → "BUSCARV, BUSCARX, SUMAR.SI.CONJUNTO".
- **Tab 4 STAR** — respuesta de proyecto difícil usa ahora `BUSCARV`+`SI.ERROR` / `INDICE+COINCIDIR`.

### Por qué no pude verificar al 100%
Los archivos de Drive (test original + archivo completado + carpeta) requieren auth de Google — WebFetch devuelve 401. Miguel debe <strong>abrir su archivo real antes de ensayar</strong> y editar cualquier fórmula del walkthrough que no haya usado. El cambio se hizo pensando en <strong>minimizar el riesgo de decir fórmulas incorrectas</strong> durante la entrevista.

---

## 🎯 Interview Simulation · Simetrik (Pi3Ai) — NUEVA FEATURE — 2026-04-14

### Contexto
Entrevista agendada **miércoles 15 abril 4:00–4:30pm COT** con Juan Henao / Aide López / Angie García (Simetrik staff) para validar rol **Implementation Specialist COL** del proceso Pi3Ai. Miguel ya pasó el test técnico (conciliación bancaria en Excel) y este es el último filtro.

### Qué se creó
Página `frontend/interview-sim.html` — módulo completo de preparación 360° con 7 tabs:
1. **🏢 Simetrik** — Perfil corporativo (fundada 2019, Y Combinator W18, $114M raised, Goldman Sachs, clientes Nubank/Rappi/Mercado Libre), arquitectura del producto (ingestión → matching → excepciones), casos de uso, diferenciadores vs BlackLine/Trintech.
2. **💼 El Rol** — Responsabilidades traducidas, pitch de 30 seg memorizable, skills blandas, preguntas sobre compensación PJ (rango USD 1,800–2,500).
3. **🧪 Test Técnico (Walkthrough)** — **7 pasos** de explicación para compartir pantalla: entendimiento → limpieza → diseño de llave compuesta → matching XLOOKUP → clasificación de excepciones → tabla dinámica → reporte final. Defiende el concepto "llave robusta" (exigido literalmente en JD).
4. **❓ Q&A Técnico** — 12 preguntas probables con respuesta modelo (VLOOKUP vs XLOOKUP, llave robusta, FULL OUTER JOIN en SQL, matching 1:N/N:M, Power Query, conciliación bancaria vs switch, 4x1000 colombiano, query de duplicados, levantamiento de requerimientos semana 1, debugging, Power BI para 10 implementaciones, SUMIFS).
5. **🗣️ Q&A Personal / STAR** — 10 preguntas comportamentales con framework STAR (presentación, por qué Simetrik, proyecto difícil, cliente difícil, error cometido, múltiples clientes, 3 años, preguntas para ellos, contrapropuestas, pretensión salarial).
6. **🇧🇷 Português BR** — 6 Q&A bilingües ES/PT-BR + glosario de 19 términos técnicos + tips de pronunciación (por si Juan/team BR cambia de idioma para validar).
7. **✅ Checklist** — Preparación T-24h / T-2h / T-10min / durante / post-entrevista con checkboxes persistentes en localStorage (key `sim_interview_chks`).

### Archivos tocados
- **`frontend/interview-sim.html`** (NUEVO, ~600 líneas) — módulo self-contained matching design de apply.html.
- **`frontend/index.html`** — agregado link destacado en Quick Workshop: "🎯 Simetrik Interview · 15 Abr" con border rojo/violeta para destacar urgencia.

### Research realizado
- WebFetch a `getsimetrik.com/es/platform` → arquitectura 3 pasos + 4,990 integraciones
- WebSearch `Simetrik founders funding` → Alejandro Casas + Santiago Gómez, ex-YC W18, pivot de Ropeo, Series B $55M + extensión $30M en 2025 con Goldman Sachs
- WebFetch a `simetrik.com` → use cases (fees, disputas, FX, liquidity, merchant reporting, cierre)

### Cloud sync status
✅ Checkboxes del checklist se guardan en localStorage (`sim_interview_chks`). **Pendiente agregar key al SYNC_REGISTRY** si Miguel quiere que el progreso del checklist se sincronice entre dispositivos.

### Deep link
`https://mikel696.github.io/da-2026/frontend/interview-sim.html` — accesible desde Quick Workshop en la home.

---

## 📓 10-SYS · Tab 8 "Cuaderno" — NUEVA FEATURE — 2026-04-14

### Qué se agregó
Cuaderno digital con apariencia de cuaderno real (tema oscuro para cuidar la vista del operador) dentro del módulo de Ingeniería de Sistemas. 5 secciones/materias, páginas con título + cuerpo contenteditable sobre cuadrícula con renglones azules, links de estudio, galería de imágenes con **lightbox** (visor con navegación ←/→/Esc), autoguardado 500 ms + badge "✓ guardado", contadores de páginas por materia.

### Archivos tocados
- **`frontend/systems.html`** — CSS notebook re-escrito en tema oscuro (#1a1f2e base, tinta `#e4e8f4`, renglones `rgba(120,160,230,.18)`, margen rojo, lomo bronce, agujeros con sombra interna). Lightbox modal agregado al final del body (`#nbLightbox` con botones prev/next/close). Badge "✓ guardado" en header. Tab 8 "📓 Cuaderno" visible en la tira de tabs.
- **`frontend/systems_logic.js`** — Módulo `NB` IIFE (~230 líneas). Nuevas funciones: `viewImage`, `closeImage`, `prevImage`, `nextImage` (lightbox). `init` ahora pinta puntos de color por materia + contador de páginas. `autoSave` dispara el badge de guardado. Shortcuts teclado Esc/←/→ para el lightbox.
- **`frontend/js/cloud-sync.js`** — `SYNC_REGISTRY` incluye `sys_notebook` → sincronización automática vía proxy de `localStorage.setItem`.

### Fix crítico aplicado en esta sesión
- **Imagen abría pestaña en blanco** al hacer click — era `window.open(this.src)` con data URLs base64. Reemplazado por lightbox modal in-page con navegación entre imágenes.
- **Fondo claro lastimaba la vista** — migrado a paleta oscura completa (paper → #1a1f2e, header gradient → #1f2638/#181d2c, spine → bronce #4a3820, holes → #0a0d16).

### Polish aplicado
- Gradiente radial sutil violeta en la página
- Glow en margen rojo y brillo en spine
- Focus-state: líneas de cuadrícula más visibles al escribir
- Placeholder itálico gris suave
- Caret azul suave (`#8bb4ff`)
- Puntos de color por materia (violeta, cian, verde, ámbar, rojo)
- Contador de páginas por materia en los chips

### Estado cloud sync
✅ `sys_notebook` registrado en `SYNC_REGISTRY` (línea 232 de `cloud-sync.js`). Al modificar una página, el proxy de `localStorage.setItem` dispara `CLOUD.push()` automáticamente. Disponible desde cualquier dispositivo al hacer login.

### Claves localStorage
- `sys_notebook` — objeto `{ [subjectId]: { pages: [...], links: [], images: [] } }`

---

## 🔒 10-SYS · Ingeniería de Sistemas — 100% COMPLETO Y CERRADO — 2026-04-09

### Estado final del módulo
**MÓDULO CERRADO PERMANENTEMENTE.** Listo para uso diario. La inyección manual de syllabus se detuvo por decisión del operador. Todo lo que está cargado es **dato real, verificado por el usuario** — cero extrapolación, cero invención. El Direct-Fetch Protocol para Tab 7 quedó verificado end-to-end (Mat Especiales en producción). No hay trabajo pendiente en este módulo: cualquier nueva sesión de clase usa el protocolo Modo A o Modo B ya documentado, sin necesidad de modificar código.

### Datos académicos cargados (período 26V02)
| Materia | cdigital_id | Estado | Datos cargados |
|---|---|---|---|
| ✅ DIS34 Ing. Web | 104362 | COMPLETO | Profesor, horario, 4 subject_links, 7 tareas (Cortes 1-3) |
| ✅ DIS31 Mat. Especiales | 101285 | COMPLETO | Profesor (Cortés Cruz), email, horario Mié/Vie, 3 subject_links, 7 tareas |
| 🟡 DIS36 Inv. C&T | 104253 | PARCIAL | Solo 3 tareas Corte 1 (Tarea 1, Quiz 1, Tarea 2). Sin pesos, sin Cortes 2-3 |
| ⚪ A1I01 English Beginner 1 | 100774 | PENDIENTE | Solo placeholder en SUBJECTS — sin syllabus |
| ⚪ CE1026 Placement Test BE+ | 106289 | PENDIENTE | Solo placeholder en SUBJECTS — sin syllabus |

`VERIFIED_SUBJECTS = {ing_web, mat_especiales, inv_ciencia}` — únicas materias que NO muestran el warning "⏳ Sin syllabus cargado".

### Funcionalidades activas (8 tabs)
- **Tab 0 — Dashboard:** `actionNow` hero contextual + `semaphoreList` P0-P4 + `task-form` (alta de tareas con select limpio de 5 materias).
- **Tab 1 — Materias:** `subjectDetail` cards (profesor, email, horario, progress bar, tareas, deep-links). Sin warning para verificadas.
- **Tab 2 — Calendario:** Calendario académico 26V02 oficial.
- **Tab 3 — Accesos:** Portal Opener v2 (CDigital, SGA, CUN 360, Gmail).
- **Tab 4 — Malla Curricular:** 10 semestres.
- **Tab 5 — Certificaciones:** 8 certs con links.
- **Tab 6 — CUN Hub:** Recursos del ecosistema CUN.
- **Tab 7 — Clases Perdidas:** ✅ VERIFICADO HOY + EJECUTADO end-to-end con DATOS REALES. Soporta dos modos:
  - **Modo A (Direct Fetch):** El usuario me pega la URL en el chat con la pestaña del video ya abierta y el panel de Transcripción de Drive activado. Yo uso Chrome MCP (`tabs_context_mcp` + `javascript_tool`) para extraer el transcript del DOM (`[role="complementary"][aria-label*="ranscripci"]`), pre-proceso EN LA PÁGINA (filtrado por keywords + últimos segmentos para evitar reventar mi context), genero el informe verbatim, y ejecuto `SYS.injectClassSession()` directamente en la pestaña real del live site (`mikel696.github.io/da-2026/frontend/systems.html`). El proxy de `cloud-sync.js` empuja a Supabase automáticamente.
  - **Modo B (Prompt portable):** Si no tengo Chrome MCP, el botón "📋 Copiar Prompt" genera el SOP completo (con prerrequisito de panel de transcripción visible y reglas anti-hallucinación) para que otra sesión de Claude lo ejecute.
  - **Hoy 2026-04-09:** ejecuté Modo A end-to-end con la grabación de **DIS31 Matemáticas Especiales** (108K caracteres de transcript), inyecté la sesión en producción, verifiqué visualmente que la tarjeta aparece en "Sesiones guardadas" (`#classSessionsList`) y que el counter del card sube a "1 sesión".

### Arquitectura interna (post-hardening)
- **`SUBJECTS`** — 5 materias reales (auditadas contra CDigital). 3 falsas eliminadas (`calidad_sw`, `admin_bd`, `redes`).
- **`SEED_VERSION = 5`** — Sistema de migración versionado:
  - v1→v2: purga materias falsas
  - v2→v3: purga extrapolaciones inventadas
  - v3→v4: incorpora Mat Especiales verificada
  - v4→v5: incorpora Inv C&T parcial
  - Migración preserva tareas creadas por el usuario (dedupe by text)
- **`SEED_TASKS`** — 17 tareas reales: 7 Ing Web + 7 Mat Esp + 3 Inv C&T
- **Class Sessions store** — `CS_KEY = 'class_sessions'` (sin doble prefijo `sys_sys_*`); migración one-time del key viejo.
- **Tamaños actuales:** `systems_logic.js` ~1240 líneas, `systems.html` ~513 líneas

---

## 📜 RESUMEN DE HITOS RECIENTES (Q1-Q2 2026)

### 🔐 Supabase Auth + JSONB Global Sync
- **`frontend/js/supabase-client.js`** — Cliente Supabase v2 (CDN UMD).
- **`frontend/js/auth.js`** — Sign-in/sign-up con email + password.
- **`frontend/js/cloud-sync.js`** — Offline-first JSONB payload sync. Cada módulo declara su key, el proxy intercepta `localStorage.setItem` y dispara `CLOUD.push()`.
- **Hardening:** sync-lock para evitar timestamp poisoning en device fresco; safe date parsing en `_mergeByUpdatedAt` para no crashear sync.
- **Estado:** ✅ Producción verificada, multi-device pull QA pasado.

### 💰 12-FIN · Finance Module
- **`frontend/finance.html`** + capa de datos `FIN`.
- Presupuesto, ahorro, transacciones — arquitectura separada (no monolito).
- **Estado:** ✅ Producción verificada.

### 📓 13-NOT · Notes & SRS Leitner
- **`frontend/notes.html`** — Markdown + Journal + Flashcards SRS Leitner.
- 5 cajas Leitner, intervalos progresivos, modo estudio.
- **Estado:** ✅ Producción.

### 💼 5-JOB · Job Tracker (jt8 Migration)
- Migración de schema antiguo a `jt8` con detección de duplicados y verificación.
- Botón FAB de migración bidireccional VacancyDB ↔ Job Tracker.
- Master-detail viewer + Kanban pipeline con drag-and-drop (commit reciente `6ce874c`).
- **Estado:** ✅ QA pasado, migración hardened.

### 🎓 10-SYS · 26V02 Cleanup + Hallucination Purge
- Auditoría completa contra CDigital → 3 materias falsas eliminadas, 5 reales verificadas.
- Purga total de calendario extrapolado (commit `400b1e5`).
- Inyección manual de Mat Especiales (commit `4af10d4`).
- Inyección parcial de Inv C&T (commit `4334d12`).
- **Hoy (2026-04-09):** Finalización + verificación Tab 7 + overhaul de documentación + **primera ejecución end-to-end del Direct-Fetch Protocol** (Mat Especiales clase grabada en Drive → transcript extraído por Chrome MCP → informe inyectado en producción y verificado visualmente).

### 📹 Direct-Fetch Protocol para Tab 7 — formalizado 2026-04-09
- **Trigger:** El usuario pega la URL de Drive del video en el chat (ya no necesita pasar por la UI del Tab 7).
- **Prerrequisito del usuario:** abrir la pestaña del video en su Chrome (con la extensión Claude/Chrome MCP) y activar el panel de Transcripción del reproductor de Drive (⋮ → Transcripción).
- **Mi flujo:**
  1. `tabs_context_mcp` → identifico la pestaña existente del video (NO `navigate` — Drive responde 401 sin la sesión del usuario).
  2. `javascript_tool` → extraigo `innerText` de `[role="complementary"][aria-label*="ranscripci"]` y filtro etiquetas de UI.
  3. Pre-proceso EN LA PÁGINA: parseo `[timestamp, texto]`, filtro por keywords (`tarea|entrega|parcial|examen|quiz|fecha|plazo|abril|mayo|cdigital|drive|http|recuerden|no olviden|para el|hasta el`) + últimos ~25 segmentos. Solo los hits regresan a mi contexto.
  4. Genero informe **solo con verbatim + timestamps**. Sin verbatim no se inyecta nada (regla anti-hallucinación).
  5. `SYS.injectClassSession({ ... })` directamente en la pestaña real de `mikel696.github.io/da-2026/frontend/systems.html`. El proxy de `cloud-sync.js` hace push a Supabase automáticamente.
  6. `showTab(7)` + screenshot para verificación visual.
- **Prompt actualizado en `systems_logic.js`:** el botón "📋 Copiar Prompt" ahora genera la versión nueva con el prerrequisito del panel de transcripción, el SOP completo de Chrome MCP y las reglas anti-hallucinación. Sirve como fallback portable cuando otra sesión de Claude debe ejecutar el protocolo sin que yo esté presente.
- **Por qué este protocolo:** transcripts de 1 hora son ~100K+ caracteres. Si los traigo crudos a mi context, revientan la ventana. El filtrado y la generación del informe se hacen EN EL BROWSER y solo viajan los hits relevantes a mi memoria.

### 🇺🇸 3-ENG · English Academy v2 — COMPLETO 2026-04-13
- Refactored 653-line monolith `english.html` into 4-layer architecture: thin HTML shell (~135 lines) + `css/english.css` (~200 lines) + `js/eng.js` (~500 lines ENG IIFE) + `data/english-data.json` (all content).
- 10 tabs: Vocabulary, Grammar, Understand, Conversations, Professional, Exercises, Flashcards, Interviews, Notes, Dojo.
- Content overhaul: 20 grammar rules with structured formulas/examples (up from 12), 139 professional vocabulary items across 8 categories, 6 conversation scenarios, 5 professional contexts, 28 exercises (A2-B2), interview prep (behavioral/technical/situational), comprehension strategies, hispanic error patterns.
- Dojo TTS+STT engine (`js/english.js` + `data/english-dojo.json`) integrated — renders into `#dojoContent`.
- Full Supabase auth stack restored (4 script tags). `cloud:sync_complete` listener re-renders after cloud pull.
- State keys: `e4`, `eng_notes`, `eng_srs_deck`, `dojo_stats` — all in SYNC_REGISTRY.

### 🏠 Main Page Updates — 2026-04-13
- Cajita Tech section redesigned: categorized Quick Links buttons (Epic Games, Udemy, PromoCajita, Pi3.AI) replacing outdated deals list.
- `data/recommendations.json` restructured with categories (games/learning/tools) + quickLinks format.
- Pi3.AI interview practice card added.
- Prompt Lab card updated: "14 prompts" → "31 prompts", tags include "System · Recovery".

### 🤖 8-PRO · Prompt Lab v2 — 2026-04-13
- Added 10 operational prompts (seed-022 to seed-031): recovery prompt, 8 module-specific prompts, main page update prompt.
- All in English, optimized for token conservation.
- seedVersion bumped from 1 to 2. Total: 31 prompts.

### 🔧 Otros módulos en producción
- **2-APP** Application Command Center: refactor profundo, profiling AP Lead Monks/S4, prep Pi3.AI.
- **6-TOO** Tools: redesign deals panel — botones compactos.
- **11-ACC** Accounting Associate: ✅ **COMPLETO Y DESPLEGADO — 2026-04-10**. Refactor completo a arquitectura de 4 capas según `PLAN_ACCOUNTING.md`. Shell puro `accounting.html` (65 líneas) + `css/accounting.css` (144 líneas) + `js/accounting.js` (742 líneas IIFE `ACC`) + `data/accounting-data.json` (138 líneas, 8 top-level keys). Un solo localStorage key `sb_accounting` (JSONB opaco) con sub-stores: `progress`, `exerciseLog`, `chatHistory`, `mastered`, `practiced`, `careerDone`. Registrado en `SYNC_REGISTRY` de `cloud-sync.js`. 6 tabs: Ruta (career path + 7 ejercicios técnicos), Glosario (62 términos EN/ES con TTS + mastery toggle), Excel Lab (24 vocab items + link a Ruta DA Dojo), Recursos (4 links externos), Simulador (chat recruiter con keyword scoring + historial persistido), STAR Prep (7 Q&A con practiced toggle). `_esc()` en todo texto de usuario (XSS verified). `cloud:sync_complete` → `renderAll()`. Legacy `acct_module.js` eliminado. Employer-agnostic (antes era solo Brinks). QA en vivo pasado: `pullAllStates OK: 21 keys`, `reconcile cloud→local: sb_accounting`, `pushState OK: sb_accounting`, `fullSyncAll DONE (3706ms)` — cero crashes de sync, cero errores de consola.
- **9-GOA** Goals & Habits: ✅ **COMPLETO Y DESPLEGADO — 2026-04-09**. Refactor a arquitectura de 4 capas ejecutado según `PLAN_HABITS_UI.md`. `frontend/goals.html` queda como shell puro (84 líneas). Toda la lógica vive en `frontend/js/goals.js` (~500 líneas) como IIFE `GOA` con 3 singletons (`GOALS/HABITS/REVIEWS`) sobre `sb_goals/sb_habits/sb_reviews`. Todos los registros usan `crypto.randomUUID()` — deletes por `filter(id !== target)`, sin `splice` ni ordering bugs. Migración idempotente `migrateGoalsAndHabits()` back-fillea UUIDs en registros legacy sin perder contenido. `_esc()` aplicado a todo texto de usuario (XSS verified). Listener `cloud:sync_complete` → `renderAll()`. QA en vivo pasado: `pullAllStates OK: 19 keys`, `reconcile local→cloud: sb_goals`, `reconcile local→cloud: sb_reviews`, `pushState OK: sb_goals`, `pushState OK: sb_habits`, `pushState OK: sb_reviews`, `fullSyncAll DONE` — cero crashes de sync, cero errores de consola.

---

## 🧠 LECCIONES APRENDIDAS (no repetir)

1. **NO extrapolar calendarios entre materias.** Una vez basta para hallucinaciones masivas (ver corrección `400b1e5`).
2. **Toda materia inyectada requiere `VERIFIED_SUBJECTS` Set** para que la UI sepa si mostrar warning o calendario.
3. **`SEED_VERSION` SIEMPRE bumpea** cuando se cambia `SEED_TASKS`, con dedupe by text para preservar tareas del usuario.
4. **Worktrees del harness:** las edits van al main repo via absolute paths, no al worktree. `pwd` ≠ donde se commitea.
5. **Class Sessions key:** usar `'class_sessions'` (db.get/set añade `sys_` automáticamente). El bug `sys_sys_class_sessions` ya tiene migración one-time.
6. **Direct-Fetch de transcripts de Drive:** SIEMPRE reusar la pestaña que el usuario ya abrió (`tabs_context_mcp`). NUNCA `navigate` a Drive ni `curl/fetch` — Drive responde 401 sin la sesión del usuario.
7. **Pre-procesar transcripts en el browser, no en mi contexto.** 100K+ caracteres revientan la ventana. Filtrado por keywords + slice de últimos N segmentos van por `javascript_tool` y solo los hits regresan.
8. **Inyectar siempre en la pestaña real de `mikel696.github.io`**, no en localhost ni preview. Solo ahí está la sesión de Supabase del usuario y el proxy hace push automático.
9. **Borrar entradas de stores `prepend`-orientados por `id`, no por índice.** `SYS.injectClassSession` (y otros stores que insertan al frente) hacen `arr.unshift(...)`. Si después haces `arr[arr.length-1]` para "quedarte con la entrada nueva" vas a tomar la MÁS VIEJA y borrarla. Patrón seguro: capturar el `id` que retorna/genera `inject*` y pasárselo a `delete*`. Aplica a `sys_class_sessions`, `sys_tasks`, `not_cards`, `fin_transactions` y cualquier store con `unshift` semantics. Lección registrada el 2026-04-09 después de borrar accidentalmente la sesión Mat Especiales del preview por usar índice.

---

## 🔒 HANDOVER A USO PRODUCTIVO — 10-SYS CERRADO

El operador (Miguel) puede ahora:
- Usar el módulo 10-SYS como su Mission Control académico diario.
- Marcar tareas como completadas, agregar nuevas via task-form.
- Cuando pierda una clase: pegar URL en Tab 7 → copiar prompt → ejecutar Claude (Modo B), o pegármela directamente en el chat con Chrome MCP disponible (Modo A).
- Sync automático con Supabase para multi-device.

**El sistema es production-ready. 10-SYS queda CERRADO. A estudiar.**

---

## 🤖 8-PRO · Prompt Lab v2 — COMPLETO Y DESPLEGADO — 2026-04-10

### Estado final del módulo
**MÓDULO COMPLETADO.** Refactor del monolito `prompts.html` (418 líneas inline) a arquitectura de 4 capas. QA pasado en preview: 21 prompts renderizan, optimizador genera output con syntax highlighting, category filters funcionan, `sb_prompts` registrado en `SYNC_REGISTRY`, cero errores de consola.

### Arquitectura
- Shell puro `prompts.html` (~130 líneas) + `css/prompts.css` (230 líneas) + `js/prompts.js` (~530 líneas IIFE `PRO`) + `data/prompts-data.json` (21 seed prompts, 8 categorías, optimizer config).
- Un solo localStorage key `sb_prompts` (JSONB opaco) con sub-stores: `library`, `history`, `settings`.
- Migración idempotente de `plab_h` (historial) y `custom_prompts` (colección legacy). `plab_h` removido de `SYNC_REGISTRY`.
- Taxonomía de 8 categorías (`data`, `code`, `finance`, `career`, `learning`, `writing`, `system`, `custom`) + tags libres + template variables (`{{VAR}}`).
- 5 tabs: Librería (search + filter + sort + fav + variables), Optimizar (engine refactored), Crear (CRUD custom), Guía (10 rules), Historial.
- Seed version bumping (`seedVersion: 1`). Custom prompts usan `crypto.randomUUID()`, deletes por `filter(id !== target)`.
- `_esc()` en todo texto de usuario (XSS verified). `cloud:sync_complete` → `PRO.renderAll()`.
- Weavers de job pipeline (`prompt-weaver.js`, `cover-weaver.js`, etc.) no se tocaron — pertenecen a 2-APP/5-JOB.

---

## 🎯 PRÓXIMA FASE — Seguir construyendo módulos del dashboard
Con 10-SYS, 9-GOA, y 11-ACC cerrados, y 8-PRO en planificación, el backlog restante es:
- **8-PRO · Prompt Lab v2:** ⏳ Plan listo, pendiente aprobación → ejecución.
- **2-APP · Application Command Center:** polish + posibles features nuevas.
- **6-TOO · Tools refresh:** seguir el redesign del panel de deals.

## 🧠 14-WORK · KB SIMETRIK v1.5 — COMPLETA — 2026-05-29

### Estado final
**KB OFICIAL CERRADA.** Construida vía scraping autenticado del Help Center oficial de Simetrik (https://simetriksoporte.zendesk.com/hc/es-419) usando Chrome MCP. Archivo `SIMETRIK_KNOWLEDGE_BASE.md` en raíz del repo.

### Cobertura
- **4 categorías top:** Automatizar, Gestionar, Auditar, Cuenta y Herramientas — todas mapeadas.
- **6 subsecciones Automatizar:** Soluciones, Integraciones, Recursos y conciliaciones (24 articulos catalogados), Contabilidad, Análisis, Envío de datos.
- **~30 artículos sintetizados** con paráfrasis técnica + link fuente:
  - Recursos y conciliaciones (10): Tipos de columnas, Transformación/Vencimiento/Hoy, Fuentes, Uniones, Configuración de cruce, Conciliación estándar, Conciliaciones avanzadas, Encadenada, Estándar vs Avanzada, Optimización, Agrupaciones, Eliminar registros, Hoja de cálculo, Columnas del sistema.
  - Integraciones (4): Parsers, Smart Parsers, Repositorios, Conexiones.
  - Análisis (8): Tableros, Estado est/avz, Monitores, Tabla Personalizada/Dinámica, KPI Individual, Gráficos, Combinaciones.
  - Contabilidad (5): Gestión cuentas, Automatizaciones contables, Estructuras ERP, Configuración cierre, Conexiones ERP.
  - Gestionar (6): Conciliaciones de cuentas, Períodos, Asientos, Gestiones manuales, Buscador de registros, Alarmas.
  - Auditar (2): Fotos, Historial de actividad.
  - Cuenta y Herramientas (6): Consola, Solicitudes, Central descargas, Papelera, Procesos, Mapas + Admin.

### Aplicación
- **Tabla mapeo DOTA → stack oficial:** 12 componentes de la prueba vinculados a la funcionalidad oficial correspondiente.
- **Sección nueva en simetrik-dota-test.html:** `#kb` con tabla de 10 filas + links directos al Help Center.
- **Insumo para futuros casos Simetrik:** cualquier nueva prueba o caso Ficohsa puede consultar este KB para alinear vocabulario y paths UI con la doc oficial.

### Reglas establecidas
1. **Verificar contra la KB antes de afirmar.** Si una respuesta sobre Simetrik no se respalda con un bloque del KB, se vuelve al Help Center y se actualiza el archivo.
2. **Bumpear versión cuando se agregue contenido.** Changelog explícito al final del archivo.
3. **Toda síntesis es paráfrasis propia.** Citar URL fuente, no reproducir bloques verbatim del Help Center.

**14-WORK ahora tiene su fuente de verdad propia. Próximas pruebas se construyen sobre esta base.**



---

## 🧠 14-WORK · KB SIMETRIK v2.0 + PRUEBA DOTA VALIDADA — 2026-05-31

### Estado final
**KB v2.0 CERRADA + 16 pasos DOTA re-validados paso a paso contra el Help Center oficial.**

### Qué se hizo (Fase B)
- **SIMETRIK_KNOWLEDGE_BASE.md → v2.0:** Drill-down completo de 8 artículos críticos con flujos "paso a paso" extraídos del Help Center oficial vía scraping Chrome MCP:
  - Configuración de cruce (barridas, tipos, tolerancias, Universal ID, Versión con cambios)
  - Conciliaciones avanzadas (flujo 9 pasos + tipos de barridas: conciliación, compensación, agrupada + segmentación)
  - Conciliación estándar (flujo creación + tipos de barridas + desconciliación)
  - Columnas de transformación — catálogo completo 24 funciones con sintaxis exacta
  - Fuentes (flujo creación + administración + restricciones)
  - Uniones de fuentes (flujo creación y edición + gestión de inconsistencias)
  - Tableros (flujo creación + acciones + límite 21 elementos)
  - Agrupaciones (flujo + TODAY() + acumulativa vs no acumulativa + restricciones)

- **simetrik-dota-test.html — correcciones validadas:**
  - `ADICIONAR_FECHA_TIEMPO` (inexistente en KB) → `ADICIONAR_DIASEMANA` en puntos 6, FECHA_FINAL, DEADLINE
  - `HOY()` → `TODAY()` en FECHA_INICIO
  - Path tableros: "Menú → Tableros" → "Automatizar > Análisis > Tableros"
  - Warning documentado sobre 3er param de `ADICIONAR_DIASEMANA` (requiere confirmar con trainer)
  - Markers `<!-- ✓ validado v2.0 -->` en pasos corregidos

- **work.js SEED_DICT → SEED_VERSION `simetrik-2026-05-31.1`:** 9 términos nuevos:
  Barrida de Compensación, Barrida Agrupada, Segmentación, Cardinalidad, Robustez de barrida, Universal ID/SKT_ID, Desencadenante, Acumulativa vs No Acumulativa, Versión con cambios.
  Entradas anteriores corregidas: `adicfechahabil` → ADICIONAR_DIASEMANA, `adicfechatiempo` → TODAY().

- **PROMPT_14-WORK.md:** Bloque "Fuente de Verdad" agregado apuntando a la KB v2.0 + entrada historial 2026-05-31a.
- **PROMPT_14-WORK_TEST.md:** Paso 0 "Leer KB primero" agregado con funciones críticas verificadas. Corregida referencia a `ADICIONAR_FECHA_TIEMPO` → `ADICIONAR_DIASEMANA` + `TODAY()`.

### Pendiente conocido
- Paso 7 (EXPECTED_PAYMENT_DATE): `ADICIONAR_DIASEMANA(fecha;30;"ARG")` — 3er parámetro de calendario no documentado en artículo principal del Help Center. Confirmar con trainer en la prueba real si el add-on de días hábiles lo habilita.

### Reglas v2.0 establecidas
1. Toda sesión nueva en 14-WORK lee `SIMETRIK_KNOWLEDGE_BASE.md` antes de afirmar algo sobre Simetrik.
2. Función verificada para sumar tiempo: `ADICIONAR_DIASEMANA(FECHA;CANTIDAD)`. `ADICIONAR_FECHA_TIEMPO` NO existe.
3. Fecha actual: `TODAY()` (no `HOY()`). Solo en agrupaciones.
4. Path tableros oficial: `Automatizar > Análisis > Tableros`.

**14-WORK tiene KB v2.0 como fuente de verdad operativa. Prueba DOTA está alineada con documentación oficial.**

---

## 🧠 14-WORK · KB v3.0 COMPLETA + DOTA 100% VERIFICADO — 2026-05-31

### Estado final
**KB COMPLETA (73 artículos), DOTA 100% verificado, prompt maestro creado.**

### Qué se hizo (Fase C)
- **SIMETRIK_KNOWLEDGE_BASE.md v3.0:** +49 artículos de todas las secciones funcionales del Help Center. Cobertura ~100% del contenido operativo (excluidos 65 release notes y 14 incidencias). 73 artículos indexados en tabla.
  - Nuevas secciones: Soluciones/Plantillas (7), Recursos y conciliaciones extra (10), Análisis extra (5), Gestionar profundo (6), Herramientas (6), Admin/soporte (4), Contabilidad (3), Requisitos técnicos (2).
  - BuscarV documentado como función oficial de enriquecimiento (VLOOKUP Simetrik).

- **simetrik-dota-test.html — correcciones finales v3.0:**
  - Paso 7: `ADICIONAR_DIASEMANA(MOV_CREATION_DATE;30)` — 2 params DEFINITIVO, omite sáb/dom NO feriados.
  - Paso 8: Reescrito completamente con BuscarV oficial (no "Cruces/Joins").
  - Checklist items 7 y 8 actualizados.

- **work.js SEED_VERSION `simetrik-2026-05-31.2`:** +6 términos nuevos (BuscarV, Papelera, Procesos, Mapas, Buscador de registros, Alarmas, ADICIONAR_DIASEMANA definitivo).

- **simetrik-learn.html:** Links al Help Center oficial agregados en nodos conciliación (4 links) y la-app (6 links). Curso conectado a documentación real.

- **PROMPT_14-WORK_MASTER.md:** Prompt perfecto autocontenido con tabla de 24 funciones, 16 pasos DOTA verificados, protocolo de commit/push/sync, reglas anti-hallucination, guía de trabajo en equipo.

### Funciones definitivas (verificadas Help Center)
- `ADICIONAR_DIASEMANA(FECHA;CANTIDAD)` — 2 params, omite sáb/dom, NO feriados
- `TODAY()` — solo en agrupaciones
- `BuscarV` — VLOOKUP oficial, Paso 8 DOTA
- Separador: `;` siempre. Strings: `"..."` dobles.

### Para la próxima sesión
Usar `PROMPT_14-WORK_MASTER.md` como prompt de arranque — tiene todo el contexto necesario.

## 🖼️🗺️ 13-NOT · P4 · Inline images + Mindmap por cuaderno — 2026-06-02

### Qué cambió
P4 del módulo Notas. Dos features grandes + un fix de paste:

**1. Inline images en cualquier editor `.nb-content`**
- Botón nuevo "🖼️ Imagen" en `NBShared.toolbarHtml` → propaga a 10-SYS, 13-NOT, 14-WORK por construcción shared.
- `NBShared.insertImage(sid, ns)`: file picker → comprime a 3 tiers (full 1920px→IDB, preview 1280px→inline body en `<img>` `data-img-id`, thumbnail fallback). Body queda con `<img class="nb-img" data-img-id="..." src="<preview>">`.
- Paste (Ctrl+V) con imagen en clipboard ahora INGESTA inline (antes bloqueaba con un alert pidiéndole usar un botón inexistente).
- Click en imagen → overlay full-screen HD desde IDB (cae a preview si no hay IDB).

**2. Mindmap propio por cuaderno (NUEVO)**
- Nuevo store `not_nb_maps` (registrado en `SYNC_REGISTRY` → cross-device).
- Botón "🗺️ Mapa" en la toolbar del detalle del cuaderno → toggle de canvas SVG 800×460.
- Interacciones: click vacío → crear nodo (prompt texto); drag → mover; Ctrl/Shift+click en 2 nodos → conectar; doble-click → editar texto; click derecho → eliminar; botón "🗑 Limpiar" → reset.
- Persistencia automática vía proxy `localStorage.setItem` → push a Supabase JSONB.

**3. Bug fix histórico**: el clean-paste mostraba alert "usa el botón 🖼️ Imagen HD" que no existía. Ahora pega bien.

### Archivos tocados
- `frontend/js/nb-shared.js`: +1 botón toolbar, +`insertImage`, +`_insertImageFromFile`, +`_findEditor`, +`_readFileAsDataURL`, +`_openImageHD`, +`attachImageClickHandler`, paste handler reformulado.
- `frontend/css/nb-shared.css`: +`.nb-rt-img`, +`.nb-content .nb-img` (hover lift), +focus-visible WCAG AA.
- `frontend/js/notes-nb.js`: +MAP namespace inner (~130 líneas) con `loadMaps/saveMaps/getMap/setMap/toggleMap/renderMap/clearMap/mapHtml`, +1 botón en toolbar detalle, +1 export en API.
- `frontend/js/cloud-sync.js`: +`'not_nb_maps'` en SYNC_REGISTRY (cross-device sync).

### Storage shape
```
not_nb_maps = {
  [nbId]: {
    nodes: [{ id, x, y, text, color }],
    edges: [{ from, to }],
    updatedAt: ISO
  }
}
```

### Verificación
- [ ] Abrir notes.html → cuaderno → editor → botón 🖼️ → file picker → imagen inserta inline.
- [ ] Ctrl+V con imagen en clipboard → inserta inline.
- [ ] Click en imagen → overlay full-screen HD.
- [ ] Botón 🗺️ Mapa → canvas aparece; click vacío crea nodo; drag mueve; Ctrl+click 2 nodos conecta.
- [ ] Reload → mapa persiste · DevTools → `localStorage.not_nb_maps` poblado.
- [ ] 10-SYS y 14-WORK siguen funcionando (toolbar shared no rota).

### Próximos angles posibles
(a) Export mapa a PNG/SVG · (b) Templates (kanban, swot, fishbone) · (c) Auto-extraer entidades de las páginas para sugerir nodos · (d) Link nodo → página del cuaderno · (e) Keyboard nav del HD overlay.

## 💻🗺️ 13-NOT · P5 · Templates + Iconos + Code blocks — 2026-06-02

### Qué cambió
P5 enfocada en flujo de estudio (sistemas/programación). Cinco features:

**1. Iconos en nodos del mindmap**
- Palette de 56 iconos curados (libros, código, matemática, ciencia, lógica).
- Auto-parse de emoji al inicio del texto: "📘 Python" → icon `📘` + text `Python`.
- Alt+click en un nodo → overlay picker con grid + botón "Quitar".
- Render: nodo con icon usa círculo r=32 (más grande), emoji arriba (font 18), texto debajo (font 10).

**2. Templates de mindmap (4)**
- Blanco, Radial (centro + 6 ramas), Mapa conceptual (4 niveles top-down), Lenguaje de programación (Sintaxis/Semántica/Paradigma/Tipos/Stdlib/Ecosistema/Ejemplos).
- Selector en la toolbar del mapa "📐 Template…" → confirma si pisa contenido existente.
- El template "Lenguaje" pide el nombre del lenguaje via prompt.

**3. Export mapa a PNG**
- Botón "⬇ PNG" en toolbar del mapa.
- Serializa SVG → canvas 2x (retina) → blob → download como `mapa-{nombre-cuaderno}.png`.

**4. Templates de cuaderno (5)**
- Selector en form "Nuevo cuaderno": Sin plantilla, Lenguaje de programación, Algoritmo / EDA, Concepto académico, Workflow / Proyecto.
- "Lenguaje" → 10 páginas: Intro, Sintaxis, Tipos, Control de flujo, Funciones, OOP, Stdlib, Ejemplos, Ecosistema, Recursos.
- "Algoritmo" → 7 páginas: Problema, Análisis, Pseudocódigo, Implementación, Complejidad, Tests, Variantes.
- "Concepto" → 6 páginas: Definición formal, Intuición, Ejemplos, Conexiones, Preguntas examen, Fuentes.
- "Workflow" → 6 páginas: Objetivo, Stack, Tareas (checklist), Recursos, Log diario, Retrospectiva.

**5. Code block en toolbar shared**
- Botón "</> Code" en `NBShared.toolbarHtml` → propaga a 10-SYS, 13-NOT, 14-WORK.
- `NBShared.insertCodeBlock(sid, ns)` inserta `<pre class="nb-code-wrap"><code class="nb-code" data-lang="...">` con monospace dark, borde izquierdo cyan, tag de lenguaje opcional arriba-derecha.
- Pre-armado para futuro syntax highlighting (atributo `data-lang`).

### Archivos tocados
- `frontend/js/notes-nb.js`: +`MAP_ICONS` (56 items), +`_splitIcon` (regex unicode), +`openIconPicker`, +`MAP_TEMPLATES` (4 starters) + `_tplBlank/_tplRadial/_tplConcept/_tplProg`, +`applyMapTemplate`, +`exportMapPNG`, +`NB_TEMPLATES` (5 starters), +`_createWithTemplate`, modificación de `create()` para leer selector, modificación de `renderMap` para iconos, modificación de `mapHtml` con selector templates + botones PNG/Limpiar, expansión del export API.
- `frontend/js/nb-shared.js`: +botón `</>` Code en toolbar, +`insertCodeBlock(sid, ns)` con prompt de lenguaje + inserción `pre+code`, export en PUBLIC API.
- `frontend/css/nb-shared.css`: +`.nb-rt-code` botón cyan, +`.nb-content .nb-code-wrap`, +`.nb-content .nb-code-lang`, +`.nb-content .nb-code` con tipografía monospace + colores GitHub-dark.
- `frontend/notes.html`: +`<select id="notNbTpl">` con 5 opciones en el form "Nuevo cuaderno", copy actualizado.

### Verificación
- [ ] Crear cuaderno con template "Lenguaje de programación" → debe crear 10 páginas pre-rellenas en orden.
- [ ] Abrir mapa → "📐 Template…" → "🌟 Radial" → 7 nodos conectados aparecen.
- [ ] Click vacío → "📘 Python" → nodo creado con icon `📘`.
- [ ] Alt+click en nodo → picker → elegir icono → se aplica.
- [ ] Doble-click en nodo → editar "🔬 Lab" → icono cambia.
- [ ] "⬇ PNG" → descarga `mapa-{nombre}.png`.
- [ ] Toolbar editor: "</> Code" → prompt lenguaje "python" → inserta bloque dark con tag PYTHON.
- [ ] 10-SYS y 14-WORK también muestran el botón "</> Code" (shared).

### Próximos angles posibles
(a) Syntax highlighting real con Prism/highlight.js CDN sobre `.nb-code[data-lang]` · (b) Link bidireccional nodo del mapa ↔ página del cuaderno (click nodo abre página) · (c) Templates de cuaderno editables por el usuario · (d) Auto-extraer entidades (h2/h3 de páginas) como nodos sugeridos del mapa · (e) Drag-to-reorder páginas del cuaderno · (f) Tabla / checklist templates en code blocks.

## 🎨🔗🔀 13-NOT · P6 · Highlight + Link mapa-pagina + Drag reorder — 2026-06-02

### Qué cambió
P6 cierra el flujo de estudio con tres mejoras de UX + resolución de pendientes:

**1. Syntax highlighting real en code blocks**
- CDN: highlight.js 11.9.0 + tema github-dark (~28KB minified, async).
- Auto-apply en cada render: `NBShared.applyHighlight(rootEl)` busca `.nb-code[data-lang]:not([data-hl="1"])` y aplica `hljs.highlightElement` con el lenguaje del atributo.
- Patrón "highlight on idle" para no romper contenteditable: focusin strippea spans (innerText → textContent) → editás plain → focusout re-highlightea con debounce 60ms.
- Retry si highlight.js todavía no cargó (300ms × 30 tries).

**2. Link bidireccional nodo del mapa ↔ página del cuaderno**
- Nodo gana campo opcional `pageId`.
- Overlay de Settings (antes IconPicker) ahora tiene 2 secciones: 🎨 Icono + 🔗 Link a página. Selector de página del cuaderno actual + botón Guardar.
- Nodos vinculados se renderizan con halo verde alrededor + badge 🔗 en esquina superior-derecha + cursor pointer.
- Click simple en nodo vinculado (sin modifiers, sin drag) → setea `activePageId` + re-render + scroll smooth al editor. Es la navegación natural mapa → contenido.

**3. Drag-to-reorder páginas del cuaderno**
- Cada `.nb-entry` ahora es `draggable="true"` con `data-pg` + `data-nb`.
- Grip visual ⋮⋮ con `cursor:grab` para señalar la affordance.
- HTML5 drag nativo: `dragstart` baja opacidad del source, `dragover` pinta border-top del target con color de marca, `drop` reordena el array + persist + re-render.
- Sin librerías externas. Funciona en desktop; móvil seguirá usando el botón 🗑/edit.

**4. Pendientes resueltos (commit b16a18f)**
- `frontend/tools.html` (6-TOO): pivot intencional de "Herramientas & Ventajas" (cert listing) a "Mantenimiento del PC" con code blocks copiables (`.code` + `.copy`) y componente step-by-step. Conservado el design system v1.0.
- `Modelo.md`: apuntes personales sobre Obsidian como segundo cerebro (fuente de inspiración para futuras iteraciones del flow 13-NOT).
- `Diagnostico-PC-2026-06-02.html`: snapshot del diagnóstico que dio origen al rework de 6-TOO.

### Archivos tocados (P6)
- `frontend/notes.html`: + 2 tags `<link>` + `<script>` para highlight.js CDN (theme github-dark + main JS).
- `frontend/js/nb-shared.js`: + `_hljsReady`, `applyHighlight(root)`, `attachCodeBlockHandlers(el)` con focusin/focusout, integración en `attachEditorHandlers` con retry async, export en PUBLIC API.
- `frontend/js/notes-nb.js`: ampliación de `openIconPicker` (ahora "Settings del nodo" con icon + page link), update de `renderMap` (halo verde + 🔗 badge + cursor pointer), update de `_wireMapEvents` (mouseup tap-on-node abre página), update de `mapHtml` docstring, update de `renderEditor` (entries draggable + grip), +`_wirePageReorder`, +`reorderPages(nbId, srcPgId, tgtPgId)`, llamada desde `render()`, export en PUBLIC API.

### Verificación
- [ ] Crear cuaderno con template "Lenguaje", escribir code block con lang `python` → al render aparece coloreado.
- [ ] Click adentro del code → spans desaparecen → editás plain.
- [ ] Click afuera → re-coloreado correcto.
- [ ] Mapa: Alt+click un nodo → overlay con sección "Link a página" → elegir → Guardar → nodo gana halo verde + 🔗.
- [ ] Click simple en ese nodo (sin Alt) → abre la página vinculada + scroll al editor.
- [ ] Lista de páginas: drag con grip ⋮⋮ una página, soltala sobre otra → orden se actualiza, reload preserva orden.
- [ ] 6-TOO: tools.html ahora abre como "Mantenimiento del PC" con code blocks y step-by-step.

### Próximos angles posibles (P7)
(a) Drag-to-reorder de NODOS del mapa por categorías · (b) Export del cuaderno entero a PDF (pages + maps embedded) · (c) Backlinks: una página conoce qué nodos del mapa la referencian · (d) Templates de cuaderno editables por el usuario (vos creás tu propio template y se guarda) · (e) Search transversal sobre todos los cuadernos + mapas.

## 🗑️ 13-NOT · P7 · Fix delete · todo es eliminable — 2026-06-02

### Reporte del usuario
"Insert a section of code, but it cannot be deleted; check that everything created can be edited and deleted."

### Bug confirmado
El code block insertado vía toolbar usa `<pre contenteditable="false">` para evitar que el cursor entre y rompa la estructura. Side-effect: Backspace desde afuera no puede borrarlo y no hay botón visible para eliminarlo.

### Fix aplicado
1. **Code blocks** — agregado botón `×` flotante con `class="nb-block-del"` en top-right del `.nb-code-wrap`. Aparece en hover (opacity 0 → 1). Click pide confirm y `wrap.remove()` + dispatch input event para autosave. Plus: Backspace dentro de un `.nb-code` vacío también elimina el wrapper.
2. **Imágenes inline en editor** — antes solo se podían borrar moviendo el cursor adyacente y backspace. Ahora el HD overlay tiene botón `🗑 Eliminar imagen` + botón `Cerrar (Esc)`. Eliminar quita el `<img>` del DOM + `deleteImage(id)` en IDB para liberar storage.
3. **Edges del mapa** — antes solo se eliminaban en cascada al borrar un nodo. Ahora cada `<g class="mm-edge" data-ei="...">` envuelve una line invisible de 14px (hit-area generosa) + la line visible. Click sobre la línea pide confirm y splice del array de edges.

### Audit completo de "creable → editable + eliminable"
| Entidad | Editar | Eliminar |
|---|---|---|
| Notas (`sb_notes2`) | inline edit | botón ✕ por nota |
| Journal entries | inline | botón ✕ |
| Cuadernos | rename + redesign | botón 🗑 con confirm |
| Páginas | inline + título | botón 🗑 + drag reorder |
| Links de página | — | removeLink |
| Attachments | — | removeAttachment + deleteBlob |
| Imágenes grid (legacy) | renameImage | removeImage |
| **Imágenes inline (P4)** | (estática) | **🗑 en HD overlay (P7)** |
| **Code blocks (P5)** | code editable inline | **× hover + Backspace vacío (P7)** |
| Nodos del mapa | doble-click texto + Alt+click icono/link | click derecho confirm |
| **Edges del mapa** | (recreables) | **click sobre línea (P7)** |
| Mapa entero | — | botón 🗑 Limpiar |
| Labels urgente/hecho | (estáticas) | click span |
| Mapa templates | — | (aplicables, sobreescriben mapa actual) |
| Notebook templates | — | (resulting pages son normales) |

### Archivos tocados
- `frontend/js/nb-shared.js`: + `delBtn` HTML en `insertCodeBlock` · + delegated click handler en `attachCodeBlockHandlers` para `.nb-block-del` con confirm · + keydown Backspace para eliminar wrapper si code está vacío · + botones Cerrar/Eliminar en `_openImageHD` con handler de delete (DOM + IDB).
- `frontend/js/notes-nb.js`: + `<g class="mm-edge" data-ei="...">` con hit-area de 14px en `renderMap` · + click handler en `_wireMapEvents` que detecta `.mm-edge` y splica el edge · + update del docstring de la toolbar del mapa.
- `frontend/css/nb-shared.css`: + `.nb-block-del` con opacity hover + transform scale + focus-visible WCAG AA · + padding-right del wrapper + reposición del `.nb-code-lang`.

### Verificación manual sugerida
- [ ] Editor → `</> Code` → insert bloque → hover muestra × arriba-derecha → click confirma → bloque desaparece.
- [ ] Editor → `</> Code` → vacío "// código aquí" todo seleccionado y borrado → Backspace adicional → wrapper desaparece.
- [ ] Editor → click en imagen → HD overlay → "🗑 Eliminar imagen" → confirm → imagen sale del editor.
- [ ] Mapa → click en una línea (no sobre un nodo) → confirm → conexión eliminada.
- [ ] Mapa → click derecho nodo → confirm → nodo + sus edges van.

## 🖼️📂 13-NOT · P8 · Chips compactos + Dropdown imágenes — 2026-06-02

### Reporte del usuario
"The attached images should not cover the sheet; they should be in a small icon in a drop-down list to choose the image, and they appear in a pop-up window when clicked, in the best quality."

### Solución
1. **Las imágenes ya no se renderizan inline grandes.** Al insertar (file picker o paste) se inserta un **chip compacto** estilo pill: 🖼️ + nombre del archivo (truncado a 28 chars). Ocupa una sola línea de texto, no tapa la hoja.
2. **El chip lleva todo el contexto:**
   - `data-img-id` → apunta al full 1920px en IndexedDB (HD local).
   - `data-preview` → carga inline el preview 1280px (sincroniza cross-device vía JSONB).
   - `data-name` → nombre original del archivo.
3. **Click en chip → mismo overlay HD que ya existía** con botones Cerrar (Esc) y 🗑 Eliminar. Best quality desde IDB cuando existe, fallback al preview 1280px embedded.
4. **Migración automática de imágenes legacy.** `attachEditorHandlers` corre `_migrateInlineImagesToChips(el)` que reemplaza cada `<img class="nb-img">` por su chip equivalente preservando id, alt como name, src como data-preview. Idempotente (no toca chips ya creados).
5. **Nuevo botón "📂 Lista" en el toolbar shared.** Abre un overlay con grid de thumbnails de todas las imágenes de la página actual. Cada card tiene preview 90px + nombre. Click una card → abre el HD overlay correspondiente.

### Archivos tocados
- `frontend/js/nb-shared.js`:
  - Reescritura del HTML que produce `_insertImageFromFile`: ahora es `<span class="nb-img-chip" ...>🖼️ name</span>`.
  - `_openImageHD` ahora acepta tanto `<img>` (legacy) como `<span class="nb-img-chip">` (nuevo) — lee `src` del primero o `data-preview` del segundo.
  - `attachImageClickHandler` delega a `.nb-img-chip` además del legacy `img.nb-img`.
  - Nueva función `_migrateInlineImagesToChips(editor)`: parsea `img.nb-img`, construye chip equivalente, reemplaza en DOM, dispara `input` para autosave.
  - Nueva función `openImageMenu(sid, ns)`: recolecta chips + imgs legacy del editor, construye grid overlay con thumbnails y nombres, click → `_openImageHD`.
  - Botón nuevo `📂 Lista` en `toolbarHtml` que llama `openImageMenu`.
  - Exports añadidos en `window.NBShared`.
- `frontend/css/nb-shared.css`:
  - `.nb-content .nb-img-chip` — pill morado con hover lift (max-width 280px, ellipsis del nombre).
  - `.nb-img-chip-ic` y `.nb-img-chip-name`.
  - `.nb-rt-imglist` — estilo morado para el botón 📂 Lista.
  - Estilo legacy `.nb-img` conservado por compatibilidad (cae a chip vía migración automática).

### Reach colateral
Como el cambio vive en `nb-shared.js`, **automáticamente afecta también a 10-SYS Sistemas y 14-WORK Simetrik**. Todos los cuadernos del sistema ahora muestran imágenes como chips. Apertura de cualquier cuaderno con imágenes legacy las migra silenciosamente en el primer render.

### Verificación manual
- [ ] Abrir un cuaderno con imágenes pre-existentes (P4-P7) → las imágenes se muestran como chips automáticamente.
- [ ] Insertar nueva imagen via 🖼️ Imagen → aparece chip 🖼️ filename en vez de imagen grande.
- [ ] Click en chip → overlay HD con la imagen en máxima calidad.
- [ ] Botón 📂 Lista → grid de thumbnails de todas las imágenes de la página → click una → HD overlay.
- [ ] Eliminar imagen desde overlay → 🗑 → chip se borra del editor + blob IDB liberado.
- [ ] Paste de imagen (Ctrl+V) → chip compacto.
- [ ] 10-SYS y 14-WORK también muestran chips ahora (migración automática).

---

## 2026-06-04 · 14-WORK · Dota Test Punto 7 — nuevo calendario días hábiles AR

### Qué se logró
El trainer subió a la carpeta compartida de Drive un calendario nuevo: **"Formato DIAS HABILES ARGENTINA.xlsx"**. Verificado vía Drive MCP que cubre **2019-01-01 → 2072**, lo que resuelve el bloqueo 🔴 del Punto 7 (el calendario viejo "Normalización días hábiles Argentina.xlsx" arrancaba el 2026-03-23 y dejaba sin día hábil a todas las transacciones DOTA, que vienen desde 2022).

Actualizado `frontend/pages/simetrik-dota-test.html`:
- Tabla "Qué cargar" + paso 7.0 → nuevo nombre de archivo.
- Columnas renombradas: `ID_CONTADOR_SUMA → ID_SUM`, `ID_FECHA_FINAL → ID_FINAL` (pasos 7.1, 7.3 y resumen final).
- Columnas de la unión: ahora 8 → `PAIS, FECHA, CONCEPTO, CLASIFICATION, ID_SUM, ID_FINAL, DAY, YEAR`.
- Caja 🔴 "pregunta para el trainer (bloquea el punto)" → reemplazada por ✅ "bloqueo resuelto" (clase `box do`).
- Resumen de preguntas al trainer: queda solo 🟡 Puntos 3 y 12.

La lógica de los 2 BuscarV no cambia: `ID_SUM` es el contador de día hábil (incrementa solo en filas HABIL), `ID_FINAL` mapea de número de día hábil de vuelta a fecha. Semántica verificada contra los datos reales del xlsx.

### Pendiente
- Esperar respuesta del trainer sobre puntos 3 y 12 (siguen abiertos).
- Confirmar en el workspace real que el cruce `MOV_CREATION_DATE = FECHA` requiere igualar ambos a tipo Fecha (el casteo de FECHA va en la fuente Calendario_MLA).

---

## 2026-06-04 · 14-WORK · Dota Test — reestructuración normalización de fecha (MOV_CREATED_DATE)

### Qué se logró
El trainer recomendó (imagen "cambio formato Fechas.png" en la carpeta Imagenes del Drive) castear **MOV_CREATED_DATE directamente a tipo Fecha** en lugar del workaround anterior. Recipe verificada en la imagen del diálogo "Dar formato a una columna":
- **Paso 1** · Tipo de dato → **Fecha** (no "Fecha y hora").
- **Paso 2** · Identificar el formato original (la muestra trae el ISO `2022-01-03T00:01:19-04:00`).
- **Paso 3** · Formato de visualización → `2016-11-24` (**YYYY-MM-DD**).

Reestructurado `frontend/pages/simetrik-dota-test.html`:
- Caja ⚠ "MOV_CREATED_DATE viene en formato ISO" → ahora ✅ con la receta de 3 pasos.
- Tabla de casteo del Paso 0b: `MOV_CREATED_DATE` pasa de "Texto (dejala así)" a "**Fecha** · visualización YYYY-MM-DD".
- Paso 6: fórmula simplificada de `ADICIONAR_FECHA_TIEMPO(DIVIDIR(MOV_CREATED_DATE;"T";1); 1; "dias")` a **`ADICIONAR_FECHA_TIEMPO(MOV_CREATED_DATE; 1; "dias")`** (el +1 día se mantiene; ya no hace falta DIVIDIR porque la columna ya es Fecha limpia).
- Lecciones del Paso 6, caja del cruce 7.1 (ambas fechas ya son tipo Fecha) y resumen "Resuelto" actualizados.

Esto además corrige una inconsistencia interna previa: el checklist (n:6) ya mostraba la fórmula simple sin DIVIDIR, pero el cuerpo del Paso 6 todavía traía el workaround. Ahora todo el documento coincide.

### Pendiente
- Verificar en el workspace real que el formato original elegido en el Paso 2 matchea el ISO con timezone (`-04:00`) sin vaciar las celdas (si vacía → "Añadir nuevo formato").
- Confirmar si el +1 día de MOV_CREATION_DATE es regla de negocio o compensación de timezone.
- Cerrar preguntas 🟡 de los puntos 3 y 12.

---

## 2026-06-04 · 14-WORK · Dota Test — guía de reconstrucción desde cero + memoria

### Qué se logró
El usuario decidió borrar todo y rehacer la Prueba DOTA con los datos actualizados (calendario nuevo + casteo de fecha). Para que lo haga bien de una, agregué al inicio de `frontend/pages/simetrik-dota-test.html` (antes de la fase Preparación) una sección **"🆕 Reconstrucción desde cero"** con:

1. **Las 4 reglas de oro de propagación de Simetrik** — explican el bug que vivió (MOV_CREATION_DATE no se actualizaba):
   - Casteos de tipo SIEMPRE en la FUENTE, nunca en la unión.
   - Tras castear, RE-EJECUTAR la unión (Simetrik solo recalcula registros vacíos).
   - Columnas de transformación solo recalculan filas vacías → borrar y recrear para refrescar todas.
   - Castear ANTES de crear fórmulas o la columna se bloquea 🚫.
2. **Orden macro de 9 pasos** que referencia los pasos detallados 0→16.

Versión bumpeada v5→v6. Corregido el conteo ambiguo ("5 fuentes" → las 4 reales nombradas).

### Memoria
Creada `memory/project-simetrik-dota-test.md` (+ índice MEMORY.md) con: ubicación de la guía, calendario nuevo (2019-2072, ID_SUM/ID_FINAL), casteo MOV_CREATED_DATE→Fecha YYYY-MM-DD, las 4 reglas de oro, y el procedimiento de swap del calendario (borrar/recrear Calendario_MLA + Union_Calendario → rehacer los 2 BuscarV del Paso 7).

### Pendiente
- Verificar render en el live site.
- Cerrar preguntas 🟡 de puntos 3 y 12.
- Sumar nuevos gotchas a las reglas de oro si aparecen durante el rebuild.

---

## 2026-06-04 · 14-WORK · Nuevo prompt "Trabajo Puro Simetrik"

### Qué se logró
Creado `PROMPT_14-WORK_SIMETRIK-PURO.md` (raíz del repo): 4º prompt de 14-WORK, **autónomo**, dedicado al trabajo operativo real en la plataforma Simetrik. A diferencia de `PROMPT_14-WORK_TEST.md` (que publica un roadmap en el módulo y genera HTML), este NO toca el módulo DA-2026 — es pura asistencia de plataforma (fórmulas, uniones, BuscarV, conciliaciones, tableros, troubleshooting).

Incluye: zona para pegar la tarea + evidencia, rol de especialista Simetrik, base de conocimiento embebida (arquitectura, sintaxis, tabla de funciones, las 4 reglas de oro de propagación, manejo de fechas ISO→Fecha, contexto DOTA), parámetros anti-alucinación, protocolo de inicio y formato de salida. Pensado para copiar/pegar en una sesión nueva cada vez.

Prompts de 14-WORK ahora: `PROMPT_14-WORK.md`, `PROMPT_14-WORK_MASTER.md`, `PROMPT_14-WORK_TEST.md`, `PROMPT_14-WORK_KB-PHASE-B.md`, y el nuevo `PROMPT_14-WORK_SIMETRIK-PURO.md`.

### Pendiente
- Opcional: botón "Copiar" en la tab Copilot de 14-WORK para este prompt.
- Mantener actualizada la tabla de funciones y las reglas de oro con lo que aparezca en el trabajo real.

---

## 2026-06-04 · 14-WORK · Botón "Trabajo Puro Simetrik" en tab Copilot + fix bug latente

### Qué se logró
Expuesto el nuevo prompt como botón en la tab 🎓 Tutor/Copilot de 14-WORK (Modo 4):
- `frontend/js/work.js`: función `buildSimetrikWorkPrompt()` (prompt embebido vía line-array `.join('\n')` para evitar conflicto con los backticks del code-fence), volcada a `#askOutput` con el patrón estándar; agregada a la API pública del IIFE.
- `frontend/work.html`: tarjeta "MODO 4" (borde cyan) con botón `⚡ Generar Prompt Trabajo Simetrik` → `WORK.buildSimetrikWorkPrompt()`.

**Bug latente corregido:** `buildTestDevPrompt()` (Modo "Nueva Prueba") llamaba a `showResult()`, función que NO existe → tiraba ReferenceError al hacer click. Reemplazado por el patrón estándar de output (display block + textContent + dataset.raw + scrollIntoView). Ahora los 4 modos funcionan igual.

`node --check frontend/js/work.js` OK. Verificación UI en vivo pendiente: el preview local rebota `work.html` a root (guard de auth del módulo).

### Pendiente
- Probar el click en el live site autenticado.
- Mantener el prompt embebido en sync con `PROMPT_14-WORK_SIMETRIK-PURO.md`.

---

## 2026-06-04 · 14-WORK · Propagación de la info Simetrik a todo el módulo

### Qué se logró
A pedido del usuario ("a todo el módulo"), propagada la info nueva (4 reglas de oro de propagación, casteo ISO→Fecha, error T001, calendario AR 2019-2072, ID_SUM/ID_FINAL) a los canales del módulo que lo permiten:

1. **Diccionario** (`js/work.js`, seed idempotente cross-device — el canal de conocimiento compartido del módulo): +9 entradas (reglaoro1cast, reejecutarunion, recrearcoltrans, colbloqueada, errt001, castfechaiso, calhabilarg, idsumcol, idfinalcol). `SEED_VERSION` simetrik-2026-05-31.2 → **2026-06-04.1**. Corregida referencia stale al calendario viejo en `adicdiasmana2p`.
2. **Playbook** (`pages/simetrik-playbook.html`, cheatsheet): nuevo bloque cyan "🔑 Reglas de oro · fórmulas y propagación" (3 columnas). Verificado en navegador (screenshot).
3. Cache-buster `work.js` p22 → **p23**.

### Límite técnico
**Casos, Errores y Aprendizajes** son stores CRUD del usuario (work_cases/work_errors/work_learnings) **sin mecanismo de seed** → no se pueden auto-inyectar desde código. El conocimiento queda accesible vía el Diccionario (buscable en todo el módulo) + Playbook + la guía Dota Test. Si se quiere seed para esas secciones, hay que construir el mecanismo (no existe hoy).

### Pendiente
- Verificar el seed del Diccionario en el live site logueado (el auth guard impide el test local).
- Decidir si se construye seed para Aprendizajes/Errores.

---

## 2026-06-05 · 14-WORK · Simetrik Knowledge Engine (profesionalización)

Construido el sistema de conocimiento vivo de Simetrik. 3 piezas:
1. **`frontend/data/simetrik-kb.json`** — base estructurada (entries con id/cat/title/body/evidence/source/date/confidence + meta.ingested_sources). Sembrada con 20 entradas verificadas de la sesión DOTA (reglas de oro, plataforma/UI, funciones, gotchas, conciliación, casos, calendario).
2. **`frontend/pages/simetrik-kb.html`** — visor self-contained (fetch del JSON, buscador, filtros, tarjetas con evidencia, botón Copiar Prompt de Ingesta). Pestaña "🧠 Simetrik KB" en work.html (iframe).
3. **Loop de ingesta** — `PROMPT_14-WORK_SIMETRIK-INGEST.md` (+ embebido en el HTML). Drop zone = cuaderno "Simetrik · Ingesta" (1 drop = 1 página). Claude lee páginas no-ingeridas vía Chrome MCP (texto + capturas data-preview/IDB + links Drive), extrae atómico con evidencia, dedupe, append a JSON + ingested_sources, commit. "Solo lo nuevo" = páginas cuyo id no está en ingested_sources.

Pendiente: crear el cuaderno "Simetrik · Ingesta"; primera ingesta real; verificar render live.

---

## 2026-06-05 · 14-WORK · Revisión integral + Fase 2 (Guía) + QA

**Revisión/QA realizada:**
- ✅ Integridad del cerebro (`simetrik-kb.json`): 435 entradas, 0 ids duplicados, todas con evidence+source. cats: glosario 301, plataforma 96, conciliacion 22, funcion 8, regla 4, gotcha 2, caso 2.
- ✅ FIX error real: el Simulador (`simetrik-app.html`) listaba "Reconcilable Group" y "VLOOKUP" como opciones de "Crear recurso" (inexistentes en la plataforma real) → corregido a las 6 opciones reales en los 2 lugares. Ahora coincide con el cerebro.
- ✅ Fase 2 — Guía Simple se alimenta del cerebro: enriquecidas las 47 entradas guia- con `detail` (objeto rico), y la página hace fetch del cerebro → GUIDE = detail → renderAll (array embebido = fallback offline). const→let. VERIFICADO en vivo (deployado, 47 tarjetas desde el cerebro v2026-06-05.6).
- ✅ Fase 2 — Diccionario (P26) ya se alimentaba del cerebro (seedDictFromBrain, aditivo+fallback, dcat preserva agrupamiento).
- ✅ Prompts de ingesta actualizados (.md + embebido): instruyen agregar `dcat` para glosario y `detail` para how-tos, y avisan que el cerebro alimenta Diccionario+Guía.
- ✅ Memoria actualizada (simulador corregido, estado Fase 2).
- ✅ Deploy verificado (Pages sirve el código nuevo) · sync OK (cuaderno Ingesta + work_eco_dict sincronizan por el proxy).

**Estado del cerebro:** ÚNICA fuente de verdad. Lo alimentan: Diccionario ✅, Guía Simple ✅. Pendiente: Simulador App (mismo patrón enriquecer+alimentar) y, a futuro, quitar arrays embebidos (hoy fallback).

**Leftover menor:** scripts de extracción quedaron en %TEMP% (fuera del repo, no contaminan). work_kb (tab "KB Simetrik" legacy) coexiste con el cerebro — evaluar si se absorbe en una fase posterior.

---

## 2026-06-05 · 14-WORK · FASE 2 COMPLETA — las 3 secciones se alimentan del cerebro
- **Diccionario** (P26): seedDictFromBrain, glosario con dcat.
- **Guía Simple** (P27): fetch del cerebro → GUIDE desde detail, fallback array embebido.
- **Simulador App** (P28): openTip lee detail del cerebro (BRAIN_SIM), fallback tooltips inline; 58 sim- enriquecidas con detail.
El cerebro `simetrik-kb.json` (435 entradas, v2026-06-05.7) es la única fuente de verdad y alimenta las 3 secciones. Patrón en todas: enriquecer el cerebro con `detail` rico + la sección lee del cerebro con fallback offline (cero pérdida, cero riesgo). Playbook = prose enlazada (no list-render). Pendiente opcional: quitar fallbacks embebidos, absorber work_kb.

---

## 2026-06-10 · 14-WORK · Limpieza integral + Paso 12 reescrito (DOTA v8)

**Problema:** el usuario trabado en el Punto 12; la guía acumulaba parches en capas que se contradecían, incluido un dato roto: "Lado A = grupo DOTA_Estandar" (recurso que no existe — el filtro ESTANDAR va en el Lado A de la conciliación).

**Hecho:**
- Eliminados checklist rojo del inicio y cajas/tags 🔴 ACTUALIZAR (P0b/P2/P3/P12) — contenido ya integrado en fórmulas canónicas.
- Paso 12 reescrito coherente: prerrequisitos compactos → crear conciliación (Lado A = UNION_DOTA + filtro TIPO_COMERCIO=ESTANDAR · Lado B = UNION_FD) → caja única "el tipo de barrida se fija al crear" → B1 con grupos compensables (MOV_OPERATION: PAYMENT/REFUND, nombres obligatorios) + tabla de reglas con ABS_MONTO y campo Tolerancia → B2 (tol 5) → B3 (llaves verificadas con datos) → B4 accionable (tolerancia 1/días + desigualdad FORIG_COMPRA>=MOV_CREATED_DATE como hipótesis razonada) → B5 accionable (FD por LOTE SUMA(IMPORTE) vs detalle DOTA, validar en vista previa).
- Módulo: tab legacy "📚 KB Simetrik" → "📄 Apuntes libres" (mata la colisión de nombre con 🧠 Simetrik KB); prompt Modo 4 referencia el cerebro como fuente canónica; work.js → p25.

**Pendiente:** confirmar direccionalidad B4 y llave de lote B5 (trainer o práctica); ejecutar B1→B5 y reportar resultados al cerebro.

---

## 2026-06-10 · 14-WORK · Auditoría integral del segundo cerebro (P34)

**Salud verificada (sin cambios necesarios):** sintaxis JS core OK · cerebro 440 entradas, 0 duplicados, 100% con evidencia · 16 tabs ↔ 16 panels sin huérfanos · SYNC_REGISTRY cubre todas las keys (solo marcas de versión locales, por diseño) · **Deploy:** push a main → GitHub Actions `deploy.yml` publica el repo a Pages (también `workflow_dispatch` manual); no hay build step (vanilla).

**Corregido/actualizado:** CLAUDE.md 14-WORK reescrito (cerebro + ingesta + gate + 3 desplegables) · hero y tarjeta 3-fases de work.html alineados a la arquitectura real · CSS muerto (.box.redo) eliminado de la guía DOTA · module-prompts.js 14-WORK actualizado · PROMPT_SIMETRIK-PURO con fuente canónica del cerebro · cache-bust en prompts.html.

**Diseño KB viewer (power-up):** chips con contador por categoría · badge dcat en glosario · botón 📋 copiar entrada · contador de resultados · hover lift.

---

## 2026-06-11 · PLATAFORMA · Overhaul del motor de sync (post-mortem pérdida de datos)

**Incidente:** trabajo del día en el PC laboral (transcripción + imágenes en cuaderno Ingesta) se perdió al sincronizar. Causa raíz triple: (1) LWW por key completa en _reconcileKey/realtime/forceResync — un device "gana todo" y pisa páginas no subidas del otro; (2) _commitNow re-sellaba page.updated sin cambios reales (abrir una página envenenaba el merge — la versión vieja ganó por 30s); (3) uploads de imágenes a Storage solo al pegar, sin retry (deslogueado → nunca suben); (4) cloud-sync.js sin cache-bust en 17 páginas → motores viejos cacheados en los devices.

**Fix desplegado y VERIFICADO en producción (commit 0930338):**
- **Merge estructural por página** para los 6 keys de cuadernos (work/not/sys × meta/data) en los 3 caminos del motor (_reconcileKey, handleRealtimeChange, forceResyncFromCloud). Por página gana `updated` más reciente; empate gana cloud; lo que existe en un solo lado SE CONSERVA. Si el merge aporta algo que la nube no tiene → push (converge sin loops). Ni siquiera el force pull pisa páginas.
- **Guard anti-resellado** en _commitNow × 3 (work.js, notes-nb.js, systems_logic.js): sin cambios reales → no re-stamp.
- **Cola de retry de uploads** (nb-shared.js, `nb_pending_uploads` local-only): si el upload a Storage falla (deslogueado/offline) se encola y reintenta en sb:signed_in y al cargar.
- **Cache-bust global**: cloud-sync.js?v=p2 en las 19 páginas; nb-shared/notes-nb/systems_logic → p18; work.js → p26.

Verificación live: logs muestran `reconcile MERGE→both: sys_notebook` y `MERGE (cloud ya completo): work_nb_data` sin errores; realtime suscrito.

**Recuperación pendiente del incidente:** imágenes de hoy en IndexedDB del PC laboral (script de export listo); transcripción la rehace el usuario (fuente disponible).

---

## 2026-06-16 · PLATAFORMA · Pase de seguridad #1 (handoff de control)

**Contexto:** Miguel delega la dirección técnica y pide priorizar seguridad ("que no nos hackeen") antes de darle alas al Copilot de Simetrik. Decisión de arranque: **seguridad primero**.

**Auditoría (leída del código, no de memoria):**
- ✅ Anon key pública por diseño ([supabase-client.js:9](frontend/js/supabase-client.js)) — segura SOLO si RLS está activo.
- ✅ **RLS VERIFICADO LIMPIO (2026-06-16, vía SQL en dashboard).** Las 5 tablas (`app_state, vacancies, sys_tasks, class_sessions, user_prefs`) con `rls_enabled=true`. SELECT/UPDATE/DELETE con `USING (auth.uid()=user_id)`; INSERT con `WITH CHECK (auth.uid()=user_id)`; bucket `attachments` privado. Conclusión: un extraño logueado queda 100% aislado — no lee, edita, borra NI inyecta filas ajenas. Signup abierto ([auth.js:38](frontend/js/auth.js)) es seguro porque RLS aísla cada cuenta. Script de auditoría reusable: `SUPABASE_RLS_AUDIT.sql`.
- ✅ **Superficie XSS — pase #1 cerrado en los sinks de datos EXTERNOS.** Reframe del modelo de amenaza: RLS impide inyección cross-user → el innerHTML de datos del PROPIO usuario es self-XSS (riesgo bajo). El riesgo real = feeds RSS / APIs públicas renderizados sin escapar. Corregido:
  - **core.js** (dashboard 1-IND): `renderJobs` (RemoteOK API) y `renderNews` (KDNuggets RSS) inyectaban `title/company/tags/link` crudos. Agregados `escHtml` + `safeUrl` (solo http(s); bloquea javascript:/data:); aplicados a todos los campos externos.
  - **news.html** (7-NEW · RSS en vivo vía rss2json): `title/desc` ya se escapaban al ingerir; quedaban abiertos `link` (href + onclick JS-string) e `img` (breakout del atributo `src`). Agregados `escAttr` + `safeUrl`; `renderList` y `renderSaved` escapan por contexto (href, src→fallback SVG si no es http, onclick JS-string con `\`/`'`/`"`).
  - Verificación: 10/10 tests de escape contra payloads (javascript:, breakout de href/src/onclick, `<img onerror>`) en Node. `node --check core.js` OK.
  - Pendiente pase #2 (opcional, baja prioridad): sinks self-XSS de datos propios en otros módulos.

**Fix desplegado (este commit):**
- **Bug de flush en cierre de pestaña** ([cloud-sync.js:811](frontend/js/cloud-sync.js)): usaba `SB.auth.session()` (API v1, undefined en supabase-js v2) → el beacon de `beforeunload` mandaba el anon key como Bearer → RLS lo rechazaba → guardados al cerrar tab se perdían en silencio. **Fix:** cache de `_accessToken` vía `SB.auth.getSession()` + `onAuthStateChange` (v2, autoRefresh lo mantiene fresco); el flush ahora lee el token cacheado de forma síncrona.
- **Cache-bust:** cloud-sync.js?v=p4 → **p5** en las 19 páginas (sin esto los devices siguen con el sync roto cacheado).
- Verificación: `node --check js/cloud-sync.js` OK. El flush solo se ejercita con sesión real + cierre de tab + RLS (no observable en preview simple).

**Next step:** Seguridad cerrada (RLS verificado ✅ + flush fix ✅ + XSS sinks externos ✅). Próximo foco = **Copilot Simetrik / Tapi** (prioridad de ingresos). BLOQUEADO por evidencia: "Tapi" no existe en el repo — falta material del usuario (transcripción / PDF / capturas / texto) para construir el tutor sin violar anti-hallucination.

---

## 2026-06-16 · 14-WORK · Workspace de Implementación (multi-caso) + decisión de privacidad

**Contexto:** Miguel es Implementation Specialist (hoy un caso nuevo, mañana otros clientes/canales). Pidió un módulo con 3 pilares por caso: (1) qué está pasando, (2) qué debo saber, (3) trabajo a ejecutar EN Simetrik (su trabajo no es solo documentar, es ejecutar en la plataforma). Además canales de actualización donde él carga info y Claude procesa.

**🔒 Decisión de privacidad (CRÍTICA):** el material de los casos es confidencial de cliente bancario. El cerebro `simetrik-kb.json` se sirve PÚBLICO (verificado: HTTP 200 sin auth en la live URL; repo público). Por eso **el conocimiento de los casos NUNCA va al repo ni a archivos commiteados (incl. este CEREBRO_STATE)** — vive en el store privado `work_impl` (Supabase RLS, por usuario). Patrón: **código público, datos privados.** Fuente del usuario: su carpeta de Drive (conector Drive funciona OK para txt/pdf).

**Implementado (este commit · solo CÓDIGO):**
- **work.js:** módulo Workspace de Implementación. Store `work_impl` (array de casos `{id,name,client,role,channel,status,deadline,general,saber,tasks[],open[],sources[]}`). Funciones: `loadImpl/saveImpl`, `renderImpl` (selector de casos + badge de deadline + switcher de 3 pilares + lista de tareas con progreso y pasos "En Simetrik"), `implSelect/implPillar/implNew/implDelete/implToggleTask`, `injectImplCase`/`injectImplFromJSON` (vía privada de ingesta — Claude genera el call, Miguel lo corre logueado → proxy sube a Supabase), `implIngestPrompt` (canal de actualización), mini-renderer markdown `_implMd` con escape. Empty-state guía.
- **work.html:** tab `🚀 Implementación` (dropdown Trabajo), panel `#p-impl` con `#implRoot`, hook de init en el tab-click. work.js?v=p26 → **p27**.
- **cloud-sync.js:** `work_impl` añadido a SYNC_REGISTRY (privado, RLS). cache-bust cloud-sync p5 → **p6** en las 19 páginas.
- **Verificado en preview (localhost):** inject→render end-to-end, los 3 pilares renderizan (markdown + listas + caja "A confirmar" + fuentes + tareas con pasos + barra de progreso + badge de deadline), 0 errores de consola. `node --check` OK en work.js y cloud-sync.js.

**Next step:** Miguel corre el `WORK.injectImplCase({...})` del primer caso en su sesión live (datos privados). Luego: auditar/limpiar el cerebro público (separar genérico vs cliente). Posible mejora: Q&A dentro del caso, y profundizar pasos exactos de Operation Center (falta info de plataforma).

---

## 2026-06-16 · PLATAFORMA · Resiliencia de sync (cross-device) + UX de carga sin DevTools

**Reporte del usuario:** "cuadernos, prompts, etc. no actualizan bien o tardan" — quiere ver todo desde cualquier PC. Diagnóstico: los writes suben en ~1.5s, pero la propagación a OTRO device dependía de (1) realtime *si está habilitado*, (2) poll de respaldo 60s que **solo cubría cuadernos** (NB_DATA/META), (3) resync al reenfocar pestaña (>30s). Por eso prompts/notas en una pestaña abierta no bajaban hasta reenfocar/recargar, y cuadernos tardaban.

**Fix 1 — código ([cloud-sync.js](frontend/js/cloud-sync.js), poll de respaldo):** el intervalo ahora hace `_pullAllStates()` y reconcilia **TODAS** las keys sincronizables (registry + dynamic prefixes), no solo cuadernos. Intervalo 60s → **45s**. `_reconcileKey` ya hace merge estructural (cuadernos) y LWW (resto), así que correrlo en loop es seguro (solo escribe si la nube trae algo más nuevo). Resultado: todo converge ≤45s cross-device aunque realtime esté caído.

**Fix 2 — realtime (SQL del usuario, vía instantánea):** entregado para verificar/habilitar `app_state` en la publicación `supabase_realtime` (`alter publication supabase_realtime add table app_state;`). Si no estaba, ese era el motivo del "tarda". Tras habilitar → recargar en cada device para re-suscribir.

**Fix 3 — UX carga de casos sin DevTools ([work.js](frontend/js/work.js)):** `implImport()` + textarea en empty-state y footer del panel Implementación → pegás el JSON del caso y "Cargar" (tolera el wrapper `WORK.injectImplCase(...)`). `implIngestPrompt` ahora es **project-aware + incremental**: lleva el `id`/nombre del proyecto activo + su JSON actual, así Claude crece el caso sobre lo existente sin pisarlo ni perder el status de tareas.

**Cache-bust:** cloud-sync p6 → **p7** (19 páginas) · work.js p27 → **p28** (work.html).
**Verificado en preview:** flujo de import (empty-state → pegar JSON → render del caso) OK, 0 errores. `node --check` OK en ambos.

**Next step:** (1) Miguel habilita realtime con el SQL + recarga. (2) Carga TAPI por el import box (JSON estricto entregado). (3) Pendiente: auditar/limpiar cerebro público; profundizar Operation Center.

---

## 2026-06-16 · 14-WORK · Asistente de proyectos (prompt multimodo) + realtime confirmado

**Realtime:** el `alter publication ... add table app_state` devolvió "already member" → **realtime YA estaba habilitado** en app_state. O sea el sync instantáneo cross-device ya existía; el fix del poll (commit e855e01) es el respaldo. Si persiste lag → debug de la suscripción (buscar en consola `[CLOUD] realtime ✓ suscrito a app_state`).

**Pedido:** el "canal de actualización" debía PREGUNTAR (qué proyecto, update vs nuevo, qué material falta) y poder generar **prep de reuniones, resúmenes y presentaciones** del proyecto activo.

**Implementado ([work.js](frontend/js/work.js)):** `implIngestPrompt(id, mode)` reescrito como **asistente multimodo**. Siempre embebe la lista de proyectos + el JSON del activo como contexto (project-aware) + regla anti-invención. Modos: `ask` (pregunta proyecto + qué necesita + qué material), `update`, `new`, `meeting` (prep accionable), `summary` (resumen ejecutivo), `deck` (estructura de slides, ofrece generar .pptx real vía skill pptx), `free`. UI: barra de 6 botones en el footer del panel + botón "🤖 Prompt: armar proyecto" en el empty-state. work.js p28 → **p29**.

**Verificado en preview:** los 6 modos generan el prompt correcto (ask pregunta el proyecto e incluye contexto; meeting preserva `status` de tareas; deck ofrece .pptx; new crea proyecto), 0 errores de consola. `node --check` OK.

**Next step:** Miguel carga TAPI (import box) y prueba el asistente. Pendiente: auditar/limpiar cerebro público (Ficohsa); profundizar Operation Center + glosario (Chisalca/GC/VPENC) cuando suba material a Drive.

---

## 2026-06-17 · PLATAFORMA · BUGFIX crítico — el sync borraba lo que se escribía en cuadernos

**Reporte (bloqueante):** al escribir en un cuaderno, un cambio entrante de nube (realtime/poll) re-renderizaba el editor y **borraba lo tipeado**, + avisos repetitivos "cambió desde otro PC" / "sincronizado o no". No podía trabajar.

**Causa raíz:** los handlers de `cloud:realtime_change` y `cloud:auto_resynced` en [work.js](frontend/js/work.js) llamaban `WorkNB.render()` SIN chequear si el usuario estaba editando → reconstruían el `contenteditable` y perdían las teclas desde el último autosave (500ms). Además realtime **re-emitía el eco del propio cambio** como si fuera remoto, y mostraba un toast en cada uno.

**Fix:**
- **Guard de edición ([work.js](frontend/js/work.js)):** `_nbEditing()` (activeElement contenteditable/input/textarea) + `_renderNbSafe()`. Si estás editando, NO se re-renderiza; el cambio entra silencioso a localStorage (sin tocar el DOM) y el render se difiere a `focusout` (+700ms, tras el autosave). `_commitNow` ya lee localStorage fresco, así que NO se pierde nada (ni lo tuyo ni las páginas remotas). Aplicado a ambos handlers.
- **Toast eliminado:** se quitó `_syncToast('⟲ Cambio recibido desde otro PC…')`. El sync ahora es silencioso.
- **Anti-eco ([cloud-sync.js](frontend/js/cloud-sync.js) `handleRealtimeChange`):** si el merge (cuadernos) o el payload (resto) es idéntico al local actual → NO reescribe, NO re-emite el evento. Mata el loop de "cambió desde otro PC" provocado por el propio push.
- **Badge de cola menos ruidoso ([work.html](frontend/work.html)):** "⏳ N cambios sin subir" solo aparece si el sync se atrasa >4s (backlog real), no en el ciclo normal de 1.5s. Oculta al instante cuando sube.
- **Cache-bust:** work.js p29 → **p30** · cloud-sync p7 → **p8** (19 páginas).

**Verificado en preview:** espía sobre `WorkNB.render` → **mientras un campo está enfocado: 0 re-renders** (no se borra); **al soltar foco: 1 re-render** (el sync sí aplica). 0 errores de consola. `node --check` OK en ambos.

**Next step:** Miguel prueba escribir en un cuaderno con otra pestaña/PC abierta y confirma que ya no se borra ni aparecen avisos. Luego retomar: cargar TAPI, limpieza del módulo, auditar cerebro público.

---

## 2026-06-17 · 13-NOT + 10-SYS · Sync en vivo de cuadernos con guard de edición (extiende el fix)

**Contexto:** se extendió la protección del bugfix de 14-WORK a los otros dos motores de cuadernos. Descubierto: `notes.js` está MUERTO (no se carga en notes.html); el motor vivo de 13-NOT es `notes-nb.js` (NotNB) + `notes-brain.js`. 10-SYS usa `frontend/systems_logic.js` (SYS + submódulo NB). **Ninguno re-renderizaba con eventos de nube** → sus cuadernos no actualizaban en vivo con la pestaña abierta (solo al recargar/navegar). No tenían el bug de borrado (no re-render), pero tampoco sync en vivo.

**Implementado (mismo patrón guardado que 14-WORK):**
- **[notes-nb.js](frontend/js/notes-nb.js)** (13-NOT): IIFE al final con `_editing()` guard + `_safe()` (llama `NotNB.render`) + render diferido en `focusout`. Listeners: `cloud:realtime_change` (keys `not_nb*`), `cloud:auto_resynced`, `cloud:sync_complete`. notes-nb.js?v=p18 → **p19** (notes.html).
- **[systems_logic.js](frontend/systems_logic.js)** (10-SYS): IIFE al final con guard + `_safe()` (llama `SYS.render`) + diferido. Listeners: `cloud:realtime_change` (keys `sys_*`), `cloud:auto_resynced`, `cloud:sync_complete`. systems_logic.js?v=p18 → **p19** (systems.html).

**Verificado en preview (espía de render):** 13-NOT (`NotNB.render`) y 10-SYS (`SYS.render`) → **editando: 0 re-renders · idle: 1 re-render**. 0 errores de consola. `node --check` OK en ambos. Resultado: los 3 módulos de cuadernos (14-WORK, 13-NOT, 10-SYS) ahora sincronizan en vivo cross-device SIN borrar lo que se escribe ni mostrar avisos.

**Next step:** Miguel confirma en los 3 módulos. Retomar: cargar TAPI, limpieza del módulo 14-WORK, auditar cerebro público.

---

## 2026-06-19 · PLATAFORMA · ROOT-CAUSE del "14 cambios sin subir" (timestamp poisoning)

**Diagnóstico EN VIVO (Chrome MCP sobre la sesión real de Miguel):** sesión válida, realtime ✓ suscrito, outbox se vaciaba al cargar — PERO cada carga disparaba un cascade `reconcile local→cloud` de ~14 keys (sb_goals, sb_prompts, sb_notes2, work_nb_meta, e4, ruta5, …). Eso era el "14 cambios". Timestamps reales confirmaron: `work_nb_meta` localTS = ahora pero cloud = ayer, **contenido idéntico** → el motor creía local más nuevo y re-subía.

**Causa raíz (en `_reconcileKey`, [cloud-sync.js](frontend/js/cloud-sync.js)):**
1. Rama de merge de cuadernos: sellaba `_setLocalTs(Date.now())` SIEMPRE (incluso cuando merged===cloud, o sea nada nuevo) → el TS local quedaba perpetuamente "ahora" mientras la nube seguía vieja → re-push eterno.
2. Rama LWW `local→cloud`: tras `pushState` NO actualizaba el TS local → "local siempre más nuevo".
3. `_flushQueue` (retry de cola): el `state_upsert` pusheaba OK pero no hacía `_outboxRemove` → contador fantasma "N sin subir".

**Fix (4 cambios, solo bookkeeping de timestamps — cero cambio de datos):**
- Merge de cuadernos: solo `_setLocalTs(Date.now())` cuando realmente se pushea algo nuevo; si local y nube ya son equivalentes → `_setLocalTs(cloud.updated_at)` (alinea, no envenena). Solo `_safeWrite` si cambió vs local.
- LWW `local→cloud`: `_setLocalTs(Date.now())` tras el push.
- `_flushQueue` state_upsert: al confirmar → `_setLocalTs` + `_outboxRemove`.
- **Auto-recuperación del outbox sin botón:** nuevo `setInterval(20s)` que reintenta `_flushOutbox()` si quedó algo pendiente (con pestaña visible + sesión lista).
- Cache-bust cloud-sync p8 → **p9** (19 páginas).

**Resultado esperado:** tras deploy + 1 refresh, el cascade converge y NO reaparece; sync 100% automático (realtime + poll 45s + outbox-retry 20s), sin necesidad del botón "Sincronizar todo".

**Next step:** verificar en la sesión real de Miguel (Chrome MCP) que el cascade desaparece tras cargar p9; confirmar que sus cuadernos reflejan cross-device.

### Actualización (mismo día) · p9 NO bastó → p10 RESUELVE (verificado live)
La verificación en la sesión real (Chrome MCP) mostró que **p9 seguía con el cascade de 46 keys en cada carga/poll**. Root cause real: la rama "local más nuevo" decidía por TIMESTAMP, y como el push deja el TS local unos ms por encima del cloud, en la carga siguiente local se veía "más nuevo" otra vez → re-subía las 46 aunque el contenido fuera idéntico.

**Fix p10 ([cloud-sync.js](frontend/js/cloud-sync.js) `_reconcileKey`, rama LWW local→cloud):** comparar el CONTENIDO normalizado (`JSON.stringify(_safeParse(localRaw)) === JSON.stringify(cloud.payload)`). Si es idéntico → NO subir, solo `_setLocalTs(cloudTs)` (cero red). Solo se sube cuando el contenido realmente difiere. cloud-sync p9 → **p10**.

**VERIFICADO EN VIVO (Chrome MCP, sesión real de Miguel, work.html p10):** `fullSyncAll START → pullAllStates OK: 52 keys → DONE (3410ms)`; únicos reconciles = los 6 cuadernos en "cloud ya completo" (solo alinean, sin push); **`reconcile local→cloud` = 0** (antes 46/carga); outbox=0, queue=0. El "14 cambios sin subir" quedó eliminado en la raíz. Sync 100% automático: realtime ✓ + poll 45s + outbox-retry 20s. Sin botón.

**Pendiente menor (cosmético, NO bloqueante):** `work_nb_meta` muestra TS local adelantado SOLO en la página work.html (WorkNB re-sella al render) — pero cae en "cloud ya completo" (no sube, no genera pendientes). Revisar si molesta.

**Acción para Miguel:** hard-refresh (Ctrl+Shift+R) en su PC del trabajo UNA vez para tomar p10. Después, automático y sin el botón.

---

## 2026-06-19 · PLATAFORMA · Rendimiento: poll/resync livianos (p11) + imágenes fuera del body (nb-shared p19)

**Diagnóstico en vivo (Chrome MCP):** `work_nb_data` = **2.1 MB** (un cuaderno solo 1 MB) porque cada imagen pegada metía un `data-preview` de 1280px (~180KB) **inline en `page.body`**. El poll de 45s + el resync al volver a la pestaña re-descargaban esos 2 MB → app trabada.

**Fix A — sync liviano ([cloud-sync.js](frontend/js/cloud-sync.js), p10→p11):** `_lightPull()` trae solo `store_key+updated_at` (bytes) y descarga payload SOLO de lo que cambió. Usado por el poll 45s y por el resync de visibilitychange (antes hacía `fullSyncAll` = 2 MB en cada cambio de pestaña). **Deployado y vivo.**

**Fix B — imágenes en almacenamiento separado ([nb-shared.js](frontend/js/nb-shared.js), p18→p19):** patrón "código público, datos privados, body liviano".
- **Pegar imagen** (`_insertImageFromFile`): HD única → IDB (local) + Supabase Storage (bucket `attachments`, cola de reintento). El chip del body YA NO lleva `data-preview` (se eliminó el preview inline de ~180KB). El body queda en bytes.
- **Abrir HD** (`_openImageHD`): IDB → si miss (otro device) baja de Storage (`cloudDownloadAttachment`) y cachea en IDB. Fallback legacy: `data-preview` (imágenes sin migrar).
- **Migración MANUAL** (`NBShared.optimizeImages(dataKey)` + botón "🗜️ Optimizar imágenes" en opciones de sync de work.html): mueve la HD de los chips legacy con `data-preview` a Storage y quita el preview del body por **string exacto** (no re-serializa el body). FAIL-SAFE: solo quita el preview si el upload a Storage dio `ok`; si quedó en cola (offline) lo conserva. IDEMPOTENTE.

**Por qué no falla:** el chip es solo referencia (ícono+nombre), nunca dependió de mostrar la imagen inline; la HD tiene 2 copias (IDB origin + Storage) con reintento; nada se borra del body hasta confirmar el upload. Resultado esperado: `work_nb_data` 2.1 MB → ~KB.

**Next step:** verificar EN VIVO (Chrome MCP, sesión real) el viaje a Storage de una imagen nueva, y correr `optimizeImages('work_nb_data')` mirando que libere espacio y que las imágenes sigan abriendo. Pendiente: botón equivalente en 13-NOT/10-SYS (la función ya es genérica).
