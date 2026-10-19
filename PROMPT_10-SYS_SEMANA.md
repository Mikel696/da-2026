# PROMPT 10-SYS · SEMANA EN VIVO (parte semanal)

> Pégame esto (o dime **"actualiza Semana en vivo"**) y armo el parte de la semana.
> Corre mejor el **sábado por la mañana**: las clases de la semana ya están grabadas y quedan
> sábado y domingo para lo que cierra el domingo a las 11:59 p. m.

## Qué es

Una tarjeta en **10-SYS → 📡 Dashboard → Semana en vivo** con cuatro vistas:

| Vista | Qué muestra |
|---|---|
| 🎯 Prioridades | Cada actividad con P0-P3, cuenta regresiva, por qué importa, pasos, evidencia textual y enlaces. Check de "hecho" y estado de delegación. |
| 🎥 Clases | Una tarjeta por clase: si hubo grabación, resumen y citas del docente con minuto. |
| 🤖 Centro de mando | Las actividades agrupadas por quién las hace (🙋 solo tú · 🧠 te preparo · 🤝 juntos · 🤖 Claude) y las reglas de la semana. |
| ⏭ Próxima semana | Lo que viene, con lo estimado marcado. |

**Dónde viven los datos (y por qué):**
- `sys_week_live` → el parte. Lo escribe Claude con `SYS.injectWeek(semana)`. Va a Supabase y **no al repo**: el repo es público y el parte lleva citas de clase y notas.
- `sys_week_state` → lo que marca Miguel (hecho, estado). Va aparte para que un parte nuevo no pise un check hecho en otro dispositivo.
- Las dos llaves están en `SYNC_REGISTRY` de `cloud-sync.js`. Se guardan las 12 semanas más recientes.

## Protocolo (Chrome de Miguel, con la extensión)

1. **CDigital** (Moodle CUN solo admite UNA sesión: si Miguel tiene CDigital abierto en otra ventana, pedirle que arrastre esa pestaña al grupo de Claude).
   - `core_courseformat_get_state` por curso → actividades, `completionstate`, `uservisible`.
   - `/mod/quiz/view.php?id=` de cada quiz/parcial → "Abre/Cierra", límite de tiempo, intentos. Las fechas salen de aquí, no del calendario del bloque.
   - `/grade/report/user/index.php?id=` → notas nuevas (cargarlas con `SYS.setNota`).
   - `core_message_get_conversations` → mensajes de docentes (TI da sus instrucciones por aquí).
2. **Correo CUN** (Gmail con `?authuser=miguel.barros@cun.edu.co`): `after:<lunes>` sin promociones. Leer docentes, recordatorios y resúmenes Read AI.
3. **Grabaciones**: Calendar CUN (`/calendar/r/week/AAAA/MM/DD?authuser=miguel.barros@cun.edu.co`) → adjuntos de cada evento → en `drive.google.com/drive/u/N/` `get_video_info?docid=ID` → `ttsurl` → pista `asr` en `fmt=json3`. El índice `u/N` cambia cuando Miguel reinicia sesión: resolverlo con `authuser=`.
   - Leer **completas** las de materias con evaluación esa semana; para inglés basta filtrar por palabras clave y los últimos minutos.
   - "No tienes permiso" o "ya no existe" → decirlo en la tarjeta de la clase, nunca rellenar.
4. **Armar el parte** (`id` = `<período>-S<n>`, ej. `26V05-S4`) con el esquema de abajo y **verificar cada cita contra el texto** antes de inyectar.
5. **Inyectar** en la pestaña real `https://mikel696.github.io/da-2026/frontend/systems.html`: `SYS.injectWeek({...})` → `CLOUD.diagnostics()` / outbox en 0 → captura del Dashboard.
6. Responder a Miguel en el chat con el resumen compacto (lo P0 primero) y anotar en `CEREBRO_STATE.md`.

## Esquema

```js
SYS.injectWeek({
  id, period, week, start, end,            // 'AAAA-MM-DD'
  title, cut, author, headline,            // cut = cuándo se cortó el parte ("sáb 24-oct, 9:00 a. m.")
  alerts: [{ lvl: 'p0'|'p1'|'p2', text }],
  rules:  ['...'],                         // reglas de la semana (centro de mando)
  items: [{
    id, prio: 'p0'|'p1'|'p2'|'p3', subj,   // subj = id de SUBJECTS
    kind: 'parcial'|'quiz'|'tramite'|'curso'|'material'|'entrega'|'aviso',
    mode: 'tu'|'prep'|'juntos'|'claude',
    title, due: 'AAAA-MM-DDTHH:MM', est?, weight?, why, steps: [], 
    ev: [{ q /*verbatim*/, src, t? /*minuto*/ }], links: [{ label, url }]
  }],
  classes: [{ subj, when, rec: 'ok'|'sin grabación publicada'|'grabación sin permiso', src, sum: [], ev: [], links: [] }],
  next:    [{ when, subj, text, est? }],
  sources: ['...']
})
```

**Prioridad:** P0 = cierra en menos de 48 h o bloquea una nota · P1 = cierra esta semana o desbloquea algo · P2 = importante sin fecha cercana · P3 = cuando se pueda.

## Reglas que no se negocian

1. **Nada sin fuente.** Cada actividad lleva su evidencia (cita textual con minuto, texto de CDigital o correo). Fecha sin publicar → `est: true` y el método en `why`.
2. **Las evaluaciones las presenta Miguel.** Quizzes, parciales, exámenes, evaluaciones docentes y formularios: Claude prepara (guía y simulacro con preguntas propias) y nunca responde ni envía por él. Es suplantación, y en 9.º semestre le costaría la materia.
3. **Entregables (ACA y similares) = 🤝 juntos.** Claude investiga, estructura y redacta el borrador con fuentes; Miguel lo revisa, lo hace suyo y lo entrega.
4. **Credenciales nunca en el parte** (AWS, Dexway, CUN). Se dice "están en tu correo del <fecha>".
5. **Trabajo de Investigación:** solo lo que digan el PDF "Clases ... P0" y los mensajes del docente.
