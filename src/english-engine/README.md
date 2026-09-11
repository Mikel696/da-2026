# 🔧 Piezas del English Engine (3-ENG)

`frontend/pages/english-engine.html` **no se edita a mano**. Se ensambla desde estas piezas.

```bash
bash src/english-engine/build.sh
```

Eso reescribe `frontend/pages/english-engine.html`. El script comprueba solo que no se haya
comido nada y falla con error si falta alguna pieza grande.

---

## Por qué existe esta carpeta

Hasta el 11-sep-2026 estas piezas vivían en un directorio temporal fuera del repositorio.
Significa que **el HTML publicado no tenía fuente versionada**: si ese directorio desaparecía,
la única copia era el archivo de 1,2 MB ya ensamblado. Y cualquiera que editara el HTML
directamente veía su trabajo borrado en la siguiente reconstrucción.

Ahora la fuente está aquí. **Regla: si tocas el HTML construido y no tocas estas piezas, tu
cambio muere en el próximo build.**

---

## El orden importa

`build.sh` las concatena en un orden concreto. No es arbitrario:

| Bloque | Piezas | Por qué ahí |
|---|---|---|
| Cabecera y estilos | `01_head.html`, `07_css2.css`, `11_bifur.css`, y dentro de un `<style>`: `17_didac.css`, `22_wr.css`, `28_club.css`, `29_vibe.css`, `31_song.css` | Los últimos ganan en la cascada. `29_vibe.css` es una capa de diseño **añadida**: se puede quitar entera sin romper nada |
| Estructura | `02_body.html` (pestañas y portada), `02b_piezas.html`, y los `03*` (un panel cada uno) | |
| Contenido largo | `04_method_a.html`, `05_method_b.html`, `06_videos.html`, `_foot.html` | |
| Datos | `_W.txt` + `_W2*.txt` → `RAW_WORDS` · `_P.txt` → `RAW_PHRASES` · `12/13_bifur_data.js` · `33_expr.js` | `33_expr.js` va **antes** de `08_app.js`: define `EXPR`, que el motor usa |
| Motor | `09_sync.js`, `08_app.js` | `08_app.js` es todo el motor, ~409 kB |

---

## Los datos

| Archivo | Qué es | Formato |
|---|---|---|
| `_W.txt` | Las **2000 primeras** palabras, por frecuencia real. **No se toca** | `inglés\|español\|categoría\|uso\|ejemplo EN\|ejemplo ES` |
| `_W2a…m.txt` | Las **2231 siguientes**, por tema. Aquí se añaden las nuevas | igual |
| `_P.txt` | Las 1000 frases | `en\|es\|tiempo\|función\|molde\|nota` |
| `33_expr.js` | Las 231 expresiones compuestas | `en\|es\|uso\|ejemplo EN\|ejemplo ES` |

**Categorías válidas:** `verbo sust adj adv prep pron conj det num expr modal`

### Para añadir palabras

```bash
# 1 · Escribe las nuevas en un _W2z.txt (o en uno existente)
# 2 · Comprueba formato y duplicados ANTES de construir:
node src/english-engine/revisa.js _W2*.txt --limpia
# 3 · Construye y verifica en el navegador
bash src/english-engine/build.sh
```

`revisa.js` quita las repetidas y avisa de campos vacíos o categorías inválidas. Lo que **no**
puede comprobar es si el ejemplo usa de verdad la palabra: eso necesita el lematizador y se
hace en el navegador (ver más abajo).

---

## ⚠️ Tres trampas que ya han mordido

**1 · El acento grave con comillas dobles.**
En `build.sh`, la plantilla `RAW_WORDS` se abre con comillas **simples**. Con dobles, bash lee
el acento grave como sustitución de comando, se come medio archivo, y el script **sigue
diciendo «construido»**. Salió un HTML de 846 kB en vez de 1,2 MB sin un solo error a la vista.
De ahí la comprobación del final del script.

**2 · No hay copias sueltas de los módulos, y es a propósito.**
Aquí no están `15_glosario.js`, `16_piezas.js`, `19_lab.js`, `20_escribir.js`, `21_wr.js`,
`23_motor.js`, `24_espanol.js`, `26_morfo.js`, `27_club.js`, `30_song.js`… porque **no entran
en el build**: su contenido vive dentro de `08_app.js`. Existían como copias sueltas y eran una
trampa — se editaba la copia, no pasaba nada, y costaba entender por qué.
**Todo el motor se edita en `08_app.js`.**

**3 · `String.replace(a, b)` interpreta `$&` y `$1` dentro de `b`.**
Para inyectar código por script hay que usar `split(a).join(b)`. Con `replace`, el resultado
sigue siendo JavaScript válido, así que `node --check` no dice nada y el fallo queda vivo en
silencio. Para reparaciones, mejor **por índice de línea con asignación literal**.

---

## Cómo se verifica

`node --check 08_app.js` comprueba la sintaxis, **pero no es prueba de nada**: el archivo puede
compilar y estar roto. La prueba de verdad se hace en el navegador, sobre el HTML construido:

```js
const A = window.APP;
const rojos = o => (o && typeof o.rojos === 'number') ? o.rojos : 0;
let a=0,b=0,c=0,d=0;
A.PHRASES.forEach(p => { if(rojos(A.ANL.analizar(p.en))>0)a++; if(rojos(A.ES.analizar(p.es))>0)b++; });
A.WORDS.forEach(w => { if(w.xe&&rojos(A.ANL.analizar(w.xe))>0)c++; if(w.xs&&rojos(A.ES.analizar(w.xs))>0)d++; });
({ falsosPositivos:{a,b,c,d},              // los cuatro tienen que ser 0
   lab:A.LAB.auditar().malas.length,       // 0
   morfo:A.MORFO.auditar().fallos.length,  // 0
   club:A.CLUB.auditar().totalMalas,       // 0
   glosario:A.GL.auditar().ok,             // true
   song:A.SONG.auditar().malas.length,     // 0
   busca:A.BUSCA.auditar().ok,             // true
   expr:EXPR.auditar().malas.length,       // 0
   palabras:A.WORDS.length, pestañas:document.querySelectorAll('.tabs .tab').length })
```

Y abrir las 11 pestañas comprobando que ninguna queda invisible. Ha pasado: una regla CSS con
más especificidad dejó `-webkit-text-fill-color:transparent` sobre un fondo sólido y el texto
desapareció **sin dar ningún error en consola**.

**Y siempre en producción** (`mikel696.github.io`), no solo en el preview local. El preview
verde no es evidencia: el 11-ago el proxy respondía distinto según la cabecera `Origin`, y el
11-sep el traductor llevaba semanas muerto en el sitio publicado mientras en local iba bien.

---

## Sobre la clave de Supabase

`09_sync.js` lleva `SUPA_ANON`. Es la clave **anónima** (`role: anon` en el JWT), la que está
diseñada para ir en el cliente y va protegida por Row Level Security. No es un secreto: ya
estaba en el HTML publicado y en otros archivos del repositorio.
**La `service_role` no está aquí ni puede estar nunca.**

---

## Lo que NO está aquí

Copias de seguridad, scripts de parche de un solo uso y archivos intermedios de cuando se
generó el vocabulario. Eran ~180 archivos de ruido. Si hace falta recuperar algo, está en el
historial de git del HTML construido.

---

## 🎨 La capa visual · dónde se toca y qué no

El aspecto sale de ocho piezas. **Ninguna de ellas es JavaScript**, y ese es el
contrato: el HTML y el motor hablan por nombres, así que un `id`, un `data-*` o
una de las clases que el motor conmuta (`.on .sel .open .done .good .bad .wrong
.min .spin .playing` …) no se renombra nunca, por muy feo que sea el nombre.

| Pieza | Qué manda |
|---|---|
| `01_head.html` | Fuentes, tokens (`:root`), base, cabecera, portadas, tarjetas de palabra y de frase, tablas, táctil |
| `07_css2.css` | Buscador global, piezas, práctica, cuaderno, barra de pestañas, filtros |
| `11_bifur.css` · `17_didac.css` · `22_wr.css` · `28_club.css` · `31_song.css` | Cada módulo |
| `29_vibe.css` | Capa de acabado. **Se puede quitar entera del build** y el documento sigue entero |

**Los seis colores de las piezas** (`--r-suj --r-aux --r-ver --r-com --r-neg
--r-wh`) no se reasignan ni se reordenan: no son decoración, son lo que enseña
el documento, y aparecen igual en las once secciones.

### §fuentes · por qué las declaraciones están dentro

Había un `<link rel="stylesheet">` a `fonts.googleapis.com`. Una hoja de estilo
externa **bloquea el primer pintado**: con el wifi apagado la página se quedaba
en blanco hasta que la petición fallaba, justo en el módulo que presume de
funcionar sin internet.

Ahora los `@font-face` van dentro del `<style>` y apuntan directo al `.woff2`.
Una fuente **no** bloquea el pintado; con `font-display:swap` el texto sale al
instante con la pila del sistema y se cambia cuando llega. Medido: **una hoja
externa bloqueante → cero**.

- Outfit es variable: **un archivo** cubre de 300 a 800.
- IBM Plex Mono no lo es: va el 400 (declarado `400 500`, así que cubre los dos)
  y el 600.
- Solo el subconjunto **latino**. Español e inglés caben enteros ahí.
- Si algún día Google rota la ruta `v15`/`v20`, la fuente deja de bajar y se ve
  con la pila del sistema. Se degrada, no se rompe. Para actualizarla:
  `curl 'https://fonts.googleapis.com/css2?family=Outfit:wght@300..800'` y copiar
  la URL nueva.

### §rendimiento · lo que de verdad costaba

Medido en el navegador, tres pasadas, mediana, mismo ancho (1244px):

| | antes | después |
|---|---|---|
| Nodos en el DOM | 12 961 | 12 961 |
| Reglas CSS | 1045 | 1029 |
| Hojas externas bloqueantes | 1 | **0** |
| `DOMContentLoaded` | 227 ms | **204 ms** |
| `load` | 293 ms | **233 ms** |
| Recálculo de estilo ×20 | 580 ms (567–602) | **172 ms** (165–178) |

Los dos primeros bailan mucho entre pasadas (servidor local, todo en caché);
el del recálculo es el estable y el que manda.

Tres cosas que conviene no volver a hacer:

1. **`will-change:transform` sobre `.w, .p, .tip, .card, .mold`** — o sea, sobre
   miles de elementos. Eso no acelera nada: le pide al navegador una capa de
   composición por elemento «por si acaso». Lo que se mueve de verdad se
   promociona solo al empezar la transición.
2. **`backdrop-filter` en algo pegajoso** (`.topbar`, `.ctl`). El desenfoque se
   recalcula en cada fotograma del scroll. Fondo sólido y a correr.
3. **Animaciones en bucle infinito** (`respira` en `body::before`, `float` en
   `.hero::after`). Mantienen una capa compuesta encendida durante los cuarenta
   minutos que dura una sesión de estudio, y encima distraen.

Y una que sí funciona: **`content-visibility:auto` + `contain-intrinsic-size:
auto <alto>`** en `.w` y `.p`. El navegador se salta la maquetación de las
tarjetas que no están en pantalla; **el nodo sigue en el DOM**, así que el motor
las encuentra igual. Cuesta unos 12 ms repartidos al recorrer la lista y ahorra
~410 ms de recálculo. El `<alto>` (178px y 180px) está **medido**, no estimado:
si cambian mucho las tarjetas, volver a medirlo.

**Lo que NO arregla el CSS:** los 13 000 nodos. De ellos, ~9 600 los construye
`08_app.js` al arrancar — `renderWords(true)`, `renderPhrases(true)`,
`BF.render()` y compañía, **fuera** de las guardas perezosas que el propio
código ya tiene unas líneas más abajo, en el `onclick` de las pestañas. Bajar de
6 000 nodos es una tarea de JavaScript, no de hojas de estilo.

Y una comprobación que salió negativa y conviene no repetir: cambiar
`.pane:not(.on)` de `display:none` a `content-visibility:hidden` **no compensa**
(770 → 716 ms en la misma pasada, un 7%) y encima rompe la guarda `if(!el.offsetParent) return` de
`CTL.apply`, porque con `content-visibility` el elemento sí tiene `offsetParent`.
`display:none` ya es lo barato: un panel oculto no cuesta ni maquetación ni
pintado.

### §pestañas · tres intentos y lo que quedó

1. Fila única con scroll y barra oculta → «Cuaderno» y «Método» quedaban fuera
   del borde sin ninguna pista. Miguel dio el cuaderno por desaparecido.
2. Envolver siempre → la cabecera se partía y robaba 90px.
3. La mezcla de las dos, cada mitad en un archivo distinto (`07_css2.css` y
   `22_wr.css`), pisándose.

Lo que hay ahora, **en un solo sitio** (`07_css2.css`):

- La tira es un bloque que **no se parte por la mitad**: `order` deja la marca y
  los botones arriba y, si las once no caben al lado, la tira baja **entera** a
  su propia fila.
- Las once caben en los **1244px útiles** de la cabecera (el contenedor está
  topado en 1280). Medido: con 12px de aire lateral suman 1258 y se parte por
  «Método»; con 10 suman 1203.
- En móvil (≤819px) la tira ocupa **todo el ancho** — antes se quedaba con los
  ~230px que sobraban al lado de los botones y se veían **dos** pestañas de
  once. Ahora se desliza con anclaje, barra de scroll fina y la siguiente
  pestaña asomando cortada por el borde.

**Lo que falta y no se puede hacer desde CSS:** al cambiar de pestaña, la tira
no se desplaza sola para enseñar la que está activa. En móvil eso significa que
si abres «Método» y recargas, la tira arranca por «Estructura» y la activa queda
fuera de vista. Se arregla con **una línea** en el `onclick` de las pestañas de
`08_app.js`:

```js
b.scrollIntoView({ inline: 'center', block: 'nearest' });
```

### Cómo se comprueba que la capa visual no rompió nada

Además de las ocho auditorías de arriba, en el navegador y sobre el HTML
construido:

```js
// 1 · ninguna pestaña queda invisible ni vacía
const ids=[...document.querySelectorAll('.tabs .tab')].map(b=>b.dataset.p);
for(const id of ids){ document.querySelector(`[data-p="${id}"]`).click();
  await new Promise(r=>setTimeout(r,150));
  const p=document.getElementById(id);
  console.log(id, Math.round(p.getBoundingClientRect().height),
              getComputedStyle(p).webkitTextFillColor); }

// 2 · nada desborda en horizontal (probar a 360px)
const cw=document.documentElement.clientWidth;
const enScroller=el=>{let n=el.parentElement;while(n&&n!==document.body){
  const o=getComputedStyle(n).overflowX; if(o!=='visible')return true; n=n.parentElement;} return false;};
[...document.querySelectorAll('.pane.on *')].filter(el=>{
  const r=el.getBoundingClientRect();
  return r.width>0 && (r.right>cw+1.5||r.left<-1.5) && !enScroller(el); }).length   // 0

// 3 · contraste de los tokens de texto (mínimo 4,5:1; el principal, 7:1)
```

**Ojo con las capturas de pantalla en un panel oculto o escalado:** salen
partes en negro que en el DOM están perfectamente maquetadas. Si algo parece
invisible, **medirlo** (`getBoundingClientRect` de un hijo) antes de darlo por
roto. Mismo motivo por el que aquí no se usa `requestAnimationFrame`: sin
fotogramas no corre nada, ni el scroll suave.
