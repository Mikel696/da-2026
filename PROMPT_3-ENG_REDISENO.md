# 🎨 PROMPT · Rediseño visual del English Engine (3-ENG)

> **Cómo usarlo:** copia todo lo que hay entre las líneas `═══` y pégalo en Claude Design.
> Lo de fuera de esas líneas son notas para ti, Miguel, no para él.

---

## ✅ Listo para usar

Las piezas del build ya están en el repositorio (`src/english-engine/`), así que Claude Design
puede trabajar sobre las hojas de estilo y nada se pisa. Comprobado: el build desde un clon
limpio produce un archivo **idéntico byte a byte** al que está publicado.

Cuando te devuelva el trabajo, pásamelo: corro la regresión completa antes de que llegue a
producción.

---

═══════════════════════════════════════════════════════════════════════════

# Rediseño visual · English Engine

## Dónde trabajas · esto es lo primero

El archivo `frontend/pages/english-engine.html` (1,2 MB) **no se edita a mano: se ENSAMBLA**
desde las piezas de `src/english-engine/` con un script.

**Tú editas las hojas de estilo de esa carpeta. No el HTML construido.**

| Archivo | Qué contiene | ¿Tuyo? |
|---|---|---|
| `src/english-engine/01_head.html` | Los tokens del tema (`:root`) y el CSS base | ✅ sí |
| `src/english-engine/07_css2.css` | El grueso del estilo: portada, pestañas, tarjetas, cuaderno | ✅ sí |
| `src/english-engine/11_bifur.css` | Bifurcaciones | ✅ sí |
| `src/english-engine/17_didac.css` | Fichas didácticas | ✅ sí |
| `src/english-engine/22_wr.css` | Sección Escribir | ✅ sí |
| `src/english-engine/28_club.css` | Club de Frases | ✅ sí |
| `src/english-engine/29_vibe.css` | Capa de diseño **añadida**, se puede quitar entera | ✅ sí |
| `src/english-engine/31_song.css` | Vídeos | ✅ sí |
| `src/english-engine/02*.html`, `03*.html`, `04-06*.html` | La estructura HTML | ⚠️ con cuidado (ver contrato) |
| `src/english-engine/08_app.js` | **Todo el motor, 409 kB** | 🔴 NO |
| `src/english-engine/09_sync.js`, `12/13_*.js`, `33_expr.js` | Sincronización y datos | 🔴 NO |
| `src/english-engine/_W*.txt`, `_P.txt` | Las 4231 palabras y las 1000 frases | 🔴 NO |

**Después de cada cambio, reconstruyes y verificas sobre el resultado:**

```bash
bash src/english-engine/build.sh
```

Eso reescribe `frontend/pages/english-engine.html`. El script falla con error si el ensamblado
se come alguna pieza. **Abre siempre el HTML construido para comprobar, nunca las piezas
sueltas.**

Lee `src/english-engine/README.md` antes de empezar: documenta el orden del build y tres
trampas que ya han roto cosas aquí.

---

## Qué es esto

Una sola página HTML autocontenida (1,2 MB sin comprimir, 400 kB transferidos) para aprender
inglés. No es una web de marketing: es una **herramienta de estudio que se usa a diario**, en
sesiones largas, y buena parte del tiempo de noche. Funciona **sin internet**. La usa una
persona adulta que estudia por su cuenta y su hija adolescente.

Son **11 secciones** en pestañas, todas dentro del mismo documento:

| id | Sección | Qué contiene |
|---|---|---|
| `p0` | 🧭 Estructura | Fichas didácticas y ejemplos |
| `pz` | 🧩 Piezas | Las 6 piezas de la frase, con código de color |
| `bf` | 🔀 Bifurcaciones | 24 árboles de decisión |
| `p1` | 📚 Palabras | 4231 fichas, lista virtualizada con filtros |
| `p2` | 💬 Frases | 1000 fichas |
| `pr` | 🧪 Práctica | Repetición espaciada (Leitner) |
| `cf` | 🎮 Club de Frases | 6 modos de juego |
| `sg` | 🎬 Vídeos | YouTube embebido + subtítulos + buscador |
| `wr` | ✍️ Escribir | Corrector con semáforo + traductor |
| `nb` | 📓 Cuaderno | Editor rico, páginas, stickers |
| `p3` | 🎯 Método | Texto largo de lectura |

## El encargo

Hazla **más profesional, más viva y más rápida**, sin romper absolutamente nada.

**Profesional** = que parezca una herramienta seria, no una plantilla. Jerarquía tipográfica
clara, espaciado con ritmo, y que las 11 secciones se sientan del **mismo sistema** (hoy
algunas se nota que se hicieron en momentos distintos).

**Viva** = que responda al tacto. Estados de foco y hover que se sientan, transiciones cortas
y con intención, y que al acertar algo se note. **Viva no es "animada"**: nada que se mueva
solo, nada que distraiga a alguien que lleva 40 minutos leyendo.

**Rápida** = ver el apartado de rendimiento. Es la parte más importante y la que más valor
tiene, porque hoy es lo más flojo.

---

## 🔴 Lo que NO se puede tocar · esto es un contrato, no una preferencia

El HTML y el JavaScript hablan entre sí por nombres. **Si cambias un nombre, algo deja de
funcionar, y casi nunca se ve a simple vista**: la página sigue pintándose igual y el fallo
aparece tres clics más adentro.

**1 · Ningún `id`.** El JavaScript busca 130 elementos por su `id` exacto. Estos, entre otros:

```
omniIn omniRes q1 q2 n1 n1tot st1 st2 st3 wrEn wrEs wrOut nbMain nbHoja nbList
sgBox sgFijo sgVar sgTexto sgBuscar sgVeredicto sgPlayer sgPP sgBarra sgVel
prBoxes prDue prFlip cfBox cfPack bfList bfNav labBox plist wlist toast
```

**2 · Ningún atributo `data-*`.** Son 60 y todos son puntos de anclaje de la lógica:
`data-p` (qué pestaña abre), `data-dic`, `data-say`, `data-expr`, `data-w`, `data-pal`,
`data-glo`, `data-nb`, `data-stk`, `data-cf*`, `data-lab*`, `data-wr*`, `data-bf`, `data-sg`…

**3 · Estas clases las lee o las conmuta el JavaScript:**

```
.pane .tab .topbar .on .sel .open .done .good .bad .wrong .mala .min .spin
.gl .gl-x .dic-x .sg-pop .sg-w .omni-r .cf-card .bf-opt .qz-o .emo-b .emo-pop
.stk-i .stk-x .ctl-tog .ctl-f .ctl-sentinel .pz-t .pz-s .lb .ce .spk .playing
```

Puedes **cambiar cómo se ven**. No puedes cambiar cómo se llaman, ni quitarlas del HTML.

**4 · Los colores de las 6 piezas son didácticos, no decorativos.** `--r-suj` (sujeto),
`--r-aux` (auxiliar), `--r-ver` (verbo), `--r-com` (complemento), `--r-neg` (negación),
`--r-wh` (interrogativa). Esos seis colores aparecen en **todas** las secciones y el usuario
los tiene aprendidos: es el hilo que une el documento entero. Puedes afinar el tono o el
contraste. **No los reasignes ni los reordenes.**

**5 · Ni una línea de JavaScript.** Ni de la lógica, ni del contenido, ni de los datos
(`RAW_WORDS`, `RAW_PHRASES`, `RAW_EXPR`). Si algo te parece que necesita JS para verse bien,
**dilo en tu informe en vez de hacerlo** — de eso me encargo yo.

**6 · No añadas dependencias externas.** Sin frameworks, sin Tailwind, sin librerías de
animación, sin iconos por CDN. La página tiene que seguir funcionando **con el wifi apagado**,
y eso no se negocia. CSS a mano, como está ahora.

---

## 🟢 Lo que sí es tuyo

- **Todo el CSS.** Hay ~1045 reglas repartidas en varios bloques `<style>`. Reescríbelas si
  hace falta.
- **Los tokens del tema.** Están en `:root`. Puedes evolucionar la paleta, la escala
  tipográfica, los radios, las sombras y el espaciado. Manda solo una regla: **contraste real**
  — se estudia de noche y con cansancio, así que texto principal a 7:1 como mínimo.
- **El ritmo y la densidad.** Márgenes, aire entre bloques, tamaños. Hoy hay secciones
  apretadas y otras vacías.
- **Los estados.** Foco (se navega mucho con teclado: Ctrl+K, flechas, Enter), hover, activo,
  cargando, vacío, error.
- **Reordenar visualmente** dentro de una sección, si no mueves elementos fuera de su
  contenedor con `id`.

**Tokens actuales, para que veas de dónde partes:**

```css
--bg:#09090b  --bg2:#131317  --bg3:#1a1a20  --bg4:#232329
--bd:#27272a  --bd2:#3f3f46
--tx:#fafafa  --t2:#a1a1aa  --t3:#71717a
--ac:#8b5cf6  --ac2:#a78bfa        /* violeta, el acento del módulo */
--ok:#22c55e  --warn:#eab308  --bad:#ef4444
--rad:14px  --rad-s:9px
--fs:"Outfit"  --fm:"IBM Plex Mono"
```

---

## ⚡ Rendimiento · medido hoy, no estimado

| Medida | Ahora | Objetivo |
|---|---|---|
| Nodos en el DOM | **12 996** | **< 6 000** |
| Transferido | 400 kB | ≤ 400 kB (no subir) |
| Sin comprimir | 1 193 kB | — |
| `DOMContentLoaded` | 629 ms | < 450 ms |
| `load` | 647 ms | < 500 ms |
| Reglas CSS | ~1045 | Menos, si se puede |

**El problema está en los 12 996 nodos.** Las 11 secciones están **todas en el DOM a la vez**,
aunque solo se vea una. Eso encarece cada repintado del navegador en toda la página.

Lo que puedes hacer desde CSS, sin tocar JS:

1. **`content-visibility: auto`** en `.pane:not(.on)`, con su `contain-intrinsic-size`. Es la
   herramienta exacta para esto: el navegador se salta el trabajo de maquetar lo que no se ve,
   y el elemento **sigue en el DOM** — así que el JavaScript lo encuentra igual. Mídelo antes
   y después.
2. **`contain: layout style`** en las tarjetas repetidas (las 4231 de palabras, las 1000 de
   frases).
3. **Menos capas.** Busca `box-shadow`, `filter`, `backdrop-filter` y `transform` que estén
   puestos "por si acaso": cada uno crea una capa de composición.
4. **Las fuentes.** Hoy son dos peticiones a Google Fonts que bloquean el pintado. Con
   `font-display: swap` y `preconnect` se arregla. Si sabes hacerlo sin romper el modo sin
   internet, mejor aún.
5. **Anima solo `transform` y `opacity`.** Nada de animar `width`, `height`, `top` o `left`.
6. **`prefers-reduced-motion`**: respétalo.

**Regla de oro del rendimiento aquí: mide antes y después con la misma prueba, y ponlo en tu
informe.** Un rediseño que se ve mejor y va más lento es un rediseño rechazado.

```js
// Pégalo en la consola antes y después. Es la medida que cuenta.
const p = performance.getEntriesByType('navigation')[0];
({ nodos: document.querySelectorAll('*').length,
   domListo: Math.round(p.domContentLoadedEventEnd),
   carga: Math.round(p.loadEventEnd),
   transferido_kB: Math.round(p.transferSize / 1024) })
```

---

## 📱 Responsive

Se usa en portátil y en móvil. El móvil es donde peor está hoy.

- **360 px** tiene que ser usable de verdad, no solo "no roto".
- La barra de 11 pestañas en móvil es el punto más flojo. Resuélvelo.
- Zonas de toque de **44 px** mínimo.
- **Nada puede desbordar en horizontal.** Lo ancho (tablas, código, subtítulos) scrollea dentro
  de su caja, nunca el `body`.
- El editor del Cuaderno y el reproductor de Vídeos son los dos sitios donde más se rompe.

---

## ✅ Cómo compruebas que no has roto nada

Esto **no es opcional**. Abre la página, la consola, y pega:

```js
const A = window.APP;
({ pestañas: document.querySelectorAll('.tabs .tab').length,          // tienen que ser 11
   palabras: A.WORDS.length,                                          // 4231
   frases:   A.PHRASES.length,                                        // 1000
   buscador: A.BUSCA.auditar().ok,                                    // true
   expresiones: EXPR.auditar().malas.length,                          // 0
   lab: A.LAB.auditar().malas.length,                                 // 0
   morfo: A.MORFO.auditar().fallos.length,                            // 0
   club: A.CLUB.auditar().totalMalas,                                 // 0
   glosario: A.GL.auditar().ok,                                       // true
   video: A.SONG.auditar().malas.length })                            // 0
```

Y después, a mano, **abre las 11 pestañas una por una** y comprueba que:

- Se ve el contenido (nada invisible: ojo con `-webkit-text-fill-color: transparent` sobre
  fondos sólidos — ya ha pasado aquí y el texto desaparece sin dar ningún error).
- **Ctrl+K** abre el buscador global y encuentra cosas.
- En **Palabras**, los filtros por banda y por categoría responden.
- En **Escribir**, el semáforo cambia de color al escribir.
- En **Cuaderno**, se escribe, se cambia de página y se guarda.
- En **Vídeos**, se pega un enlace de YouTube y se ve el reproductor.
- En **Club de Frases**, arrancan los 6 modos.

**Si una auditoría da algo distinto de lo de arriba, no lo entregues: dime qué salió.**

---

## 📋 Qué me entregas

1. El archivo modificado.
2. **Las medidas antes y después** (el bloque de rendimiento de arriba).
3. **Qué cambiaste y por qué**, sección por sección. Breve.
4. **Lo que NO hiciste y por qué.** Esto me importa tanto como lo demás: si algo necesitaba
   tocar JavaScript, o si un objetivo de rendimiento no salió, quiero saberlo. Un informe que
   dice "todo perfecto" cuando no lo está me cuesta más tiempo que uno honesto.
5. Si has tenido que romper alguna de las reglas de arriba: **cuál, dónde y por qué.**

═══════════════════════════════════════════════════════════════════════════

---

## Notas finales para ti, Miguel

**Lo que le estás pidiendo es CSS, no una reescritura.** Y está bien que sea así: toda la
inteligencia de la página (los 4231 términos, las 231 expresiones, el corrector, las
auditorías) vive en el JavaScript, y eso no se toca. Lo que puede mejorar de verdad es cómo
se ve y cómo de rápido responde.

**El objetivo de los 12 996 nodos es el que más va a notar tu hija en el móvil.** Si solo
consigue eso, ya habrá valido la pena.

**Cuando te devuelva el trabajo, pásamelo.** Corro la regresión completa (los 4 corpus, las
8 auditorías, las 11 pestañas) antes de que eso llegue a producción. No porque desconfíe:
porque un cambio de CSS puede esconder texto sin dar un solo error en consola, y ya pasó.
