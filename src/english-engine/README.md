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
