---
paths:
  - "frontend/music.html"
  - "frontend/js/music*.js"
  - "frontend/css/music.css"
  - "frontend/data/music-kb.json"
---

<!-- Se carga solo cuando Claude lee, escribe o edita un archivo de `paths`. Extraído de CLAUDE.md el 12-nov-2026; el contenido no cambió. -->

## 🎵 PROTOCOLO 18-MUS · CEREBRO MUSICAL

Módulo para el proyecto musical de Miguel: componer, producir y **vender composiciones a artistas**.
Punto de partida no negociable: **no sabe acordes ni estructuras**. Todo el diseño sale de ahí.

### El pilar
**«No necesitás saber música. Necesitás saber decidir.»**
El módulo **no explica teoría: la hace sonar.** Si una idea de contenido nuevo se puede leer pero
no oír, probablemente esté mal planteada. Esto es la aplicación directa de la lección de 17-IA:
antes de replicar la forma de un módulo que funciona, comprobar que el cuello de botella es el mismo.
Aquí no es la memoria — es el **criterio auditivo**, y ese solo se entrena oyendo y comparando.

### Piezas
| Archivo | Qué es |
|---|---|
| `frontend/music.html` | Página del módulo, 9 pestañas |
| `frontend/js/music-audio.js` | **Motor de audio.** Web Audio pura: osciladores, ruido y envolventes. Cero librerías, cero samples, cero red. |
| `frontend/js/music.js` | Lógica, render y laboratorio (`MUS`) |
| `frontend/css/music.css` | Estilos. Acento del módulo: **magenta `#ec4899`** |
| `frontend/data/music-kb.json` | **El cerebro.** Géneros, progresiones, estructuras, fábrica, arsenal, legal, negocio, universo, glosario |

### Reglas del motor de audio (`music-audio.js`)
1. **Scheduler de lookahead, no `setTimeout` a pelo.** Un timer de JS despierta cada 25 ms y agenda
   los eventos de los próximos 100 ms contra el reloj de `AudioContext`. El timer decide **qué**
   agendar; el reloj de audio decide **cuándo** suena. Con `setTimeout` solo, el ritmo se arrastra
   de forma audible.
2. **Nada de `requestAnimationFrame` para el bucle visual.** rAF se queda en **cero frames** cuando
   el navegador no está componiendo la página; el audio sigue y el usuario pierde la guía del pulso,
   que es justo lo que enseña. Va con `setInterval` de 16 ms.
3. **Publicar en `window` explícitamente.** `const MAUDIO = …` de nivel superior vive en el ámbito
   léxico global, **no** como propiedad de `window`. Sin `window.MAUDIO = MAUDIO`, cada guarda
   `if (window.MAUDIO)` falla en silencio. Mismo caso que `window.NBShared`.
4. **Notación con la escritura correcta.** Do menor se escribe `Cm Ab Eb Bb`, nunca `Cm G# D# A#`.
   `useFlats(keyPc, mode)` decide sostenidos o bemoles por círculo de quintas. Escribirlo mal
   delata al que no sabe — y el módulo existe precisamente para que no lo delaten.

### El Estudio (pestaña `st`) · lo que hay que respetar

**Las pistas melódicas guardan GRADOS, no notas.** Es la decisión de la que depende todo el
módulo: Miguel dibuja una forma y el motor la traduce al acorde de cada compás, así que no puede
equivocarse de nota, y cambiar de tonalidad no le borra el trabajo. **No sustituir por alturas
absolutas** por muy conveniente que parezca en el momento.

| Archivo | Responsabilidad |
|---|---|
| `js/music-inst.js` | Timbres de género (Karplus-Strong, acordeón, metales…) + arreglista |
| `js/music-export.js` | WAV · MIDI · stems · medición de pico y RMS |
| `js/music-rec.js` | Micrófono + cadena de voz de 9 módulos |
| `js/music-studio.js` | Proyecto editable, pistas, canales de mezcla, IndexedDB |
| `js/music-ui.js` | Interfaz del Estudio (aparte, para no reventar music.js) |

**Reglas del estudio**
1. **Render offline por tramos, siempre.** Todos los nodos existen desde el instante cero; una
   canción entera de golpe (~8.000 nodos) se cuelga. Tramos de 8 compases sumados con
   solapamiento — es exacto porque la cadena hasta el bus es lineal.
2. **La percusión va a buffer, no a grafo.** Además de rendimiento, es lo que garantiza que lo
   exportado suene idéntico a lo monitoreado. Una mezcla que no coincide con su archivo no sirve.
3. **Se graba crudo, antes de los efectos.** La cadena tiene que seguir siendo ajustable sin
   volver a cantar.
4. **`autoGainControl: false` siempre.** Arruina la dinámica de una voz cantada.
5. **Nada de librerías para exportar.** Por eso no hay MP3: exigiría un codificador externo y
   rompe la arquitectura vanilla. Está documentado en el puente, no escondido.
6. **El MIDI se valida parseándolo de vuelta.** Lo que importa no es que se generen bytes: es que
   cada note-on tenga su note-off. Sin eso, FL Studio se queda con notas colgadas.
7. **Las tomas de voz son local-only** (IndexedDB `da2026_mus`). No van a Supabase. Hay que
   decírselo al usuario en la interfaz, no dejarlo suponer.

**Para editar por script un archivo ya verificado:** copia de respaldo primero y splice **por
índices de línea**. Una regex `[\s\S]*?` codiciosa se llevó por delante medio `music-audio.js`
en la sesión del 8-sep.

**Cuando lo que se inserta es CÓDIGO, `split(a).join(b)` — nunca `replace(a, b)`.**
`String.replace` interpreta `$&`, `` $` ``, `$'` y `$1` **dentro del reemplazo**. Como el código
inyectado contiene `.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')` para escapar expresiones regulares,
ese `$&` se sustituía por el texto del ancla. El resultado sigue siendo **JavaScript válido**, así
que `node --check` no dice nada y el escapado queda roto en silencio: llegó a producción y estuvo
varias sesiones sin que nadie lo viera (9-sep). Y el reparador que se escriba para arreglarlo cae
en la misma trampa si usa `replace` — hay que reparar por índice de línea con asignación literal.
Un `node --check` verde **no es prueba**: la prueba es evaluar la expresión y comprobar que
`"a.b"` escapado deja de casar con `"axb"`.

### Formato de los patrones rítmicos
`patron: { kick:[…], clap:[…], snare:[…], hat:[…], perc:[…], clave:[…] }` — arrays de casillas
**1-indexadas** sobre una rejilla de 16 semicorcheas, porque así las cuenta un músico («el golpe
del 4»), no como índice de array. El dembow es `clap: [4,7,12,15]`.

### 🚨 Reglas de integridad de 18-MUS
1. **Todo dato lleva `conf`:** `alta` (con fuente documental) · `media` (consenso de oficio, sin
   fuente que lo fije) · `hipotesis`. Se pinta como distintivo visible en la ficha. El BPM de la
   champeta está en `media` **con aviso explícito de que no se encontró fuente** — verificar
   midiendo tracks reales antes de darlo por bueno.
2. **El arsenal NO afirma precios, versiones ni límites de plan.** Regla heredada de 17-IA: una
   cifra vieja es peor que ninguna. Categoría de costo cualitativa + fecha de corte (`ver`) +
   enlace oficial. El precio se confirma en la fuente el día que se vaya a pagar.
3. **Nunca poner el nombre de un artista real en un prompt de generación,** ni sugerir clonar una
   voz reconocible. Se describe el **sonido**, no la persona. Es motivo de retiro en plataforma y
   de demanda, y no tiene segunda oportunidad.
4. **La sección Legal abre con el aviso de que no es asesoría legal** y dice explícitamente dónde
   empieza el abogado. Se puede preparar el borrador y la lista de preguntas; no se puede firmar por él.
5. **Las reglas de IA y música cambian rápido.** Todo bloque legal lleva fecha de corte y fuente.
   Antes de que Miguel tome una decisión económica sobre esa base, revalidar.
