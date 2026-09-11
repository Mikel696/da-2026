#!/bin/bash
# ══════════════════════════════════════════════════════════════════════════
#  Reensambla frontend/pages/english-engine.html desde estas piezas.
#
#  Uso:   bash src/english-engine/build.sh
#         bash src/english-engine/build.sh /otra/ruta/salida.html
#
#  El orden NO se toca: es el mismo con el que se construyo la version que
#  esta en produccion.
# ══════════════════════════════════════════════════════════════════════════
set -e

# La carpeta de las piezas es la del propio script, no el directorio desde el
# que se llama. Antes esto era una ruta absoluta a un directorio temporal: si
# ese directorio desaparecia, el build dejaba de existir y el HTML construido
# se quedaba sin fuente. Por eso estan aqui, en el repositorio.
SP="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RAIZ="$(cd "$SP/../.." && pwd)"
OUT="${1:-$RAIZ/frontend/pages/english-engine.html}"

{
  cat "$SP/01_head.html"
  cat "$SP/07_css2.css"
  cat "$SP/11_bifur.css"
  printf '<style>\n'
  cat "$SP/17_didac.css"; cat "$SP/22_wr.css"; cat "$SP/28_club.css"
  cat "$SP/29_vibe.css";  cat "$SP/31_song.css"
  printf '</style>\n'
  cat "$SP/02_body.html"
  cat "$SP/02b_piezas.html"
  cat "$SP/03_panes.html"
  cat "$SP/03b_practica.html"
  cat "$SP/03f_escribir.html"
  cat "$SP/03g_club.html"
  cat "$SP/03h_canciones.html"
  cat "$SP/03c_cuaderno.html"
  cat "$SP/03d_bifur.html"
  cat "$SP/04_method_a.html"
  cat "$SP/05_method_b.html"
  cat "$SP/06_videos.html"
  cat "$SP/_foot.html"
  printf '<script>\n'
  # Las 2000 originales (_W.txt) + los lotes que las amplian (_W2*.txt). Van en
  # archivos aparte a proposito: lo que ya funcionaba no se toca.
  #
  # OJO: las comillas que abren la plantilla van SIMPLES. Con dobles, bash lee el
  # acento grave como sustitucion de comando, se come medio archivo, y el build
  # sigue diciendo "construido" tan tranquilo. Paso de verdad: salio un HTML de
  # 846 KB en vez de 1,2 MB sin un solo error a la vista. De ahi la comprobacion
  # del final.
  printf 'const RAW_WORDS = `\n'
  cat "$SP/_W.txt"
  cat "$SP"/_W2*.txt
  printf '`.trim().split(String.fromCharCode(10));\n'
  printf 'const RAW_PHRASES = `\n'; cat "$SP/_P.txt"; printf '`.trim().split(String.fromCharCode(10));\n'
  cat "$SP/12_bifur_data.js"
  cat "$SP/13_bifur_data2.js"
  cat "$SP/33_expr.js"
  cat "$SP/09_sync.js"
  cat "$SP/08_app.js"
  printf '</script>\n'
} > "$OUT"

# Un "construido" a secas NO es prueba de nada: hay que ver que las piezas
# grandes siguen dentro del archivo.
faltan=""
for marca in 'const RAW_WORDS' 'const RAW_PHRASES' 'const RAW_EXPR' 'const BUSCA' 'window.APP = APP'; do
  grep -q "$marca" "$OUT" || faltan="$faltan $marca"
done
if [ -n "$faltan" ]; then
  echo "ROTO · al archivo le faltan piezas:$faltan" >&2
  exit 1
fi

pal=$(cat "$SP/_W.txt" "$SP"/_W2*.txt | grep -c '|')
fra=$(grep -c '|' "$SP/_P.txt")
exp=$(grep -c '|' "$SP/33_expr.js")
echo "construido: $(wc -c < "$OUT") bytes · $pal palabras · $fra frases · ~$exp expresiones"
echo "salida: $OUT"
