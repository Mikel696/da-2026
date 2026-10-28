/* Revisa un lote de palabras nuevas ANTES de meterlo en el documento.
   Aqui solo lo que se puede saber SIN el motor: formato, campos, categoria y
   duplicados. Que el ejemplo use de verdad la palabra se comprueba dentro del
   navegador, donde esta el lematizador -- fuera daba 12 falsos por los pasados
   irregulares (sank, knelt, wept), que son ejemplos perfectamente buenos.
   Con --limpia, quita las repetidas y reescribe el archivo.                  */
const fs = require('fs');
const CATS = new Set(['verbo','sust','adj','adv','prep','pron','conj','det','num','expr','modal']);
const limpia = process.argv.indexOf('--limpia') >= 0;
const archivos = process.argv.slice(2).filter(a => a !== '--limpia');
const viejas = new Set(fs.readFileSync('_W.txt','utf8').trim().split('\n').map(l => l.split('|')[0].toLowerCase()));

const todas = new Set(viejas);
for(const f of archivos){
  const lineas = fs.readFileSync(f,'utf8').trim().split('\n').filter(x => x.trim());
  const problemas = [], quedan = [];
  let quitadas = 0;
  lineas.forEach((l, i) => {
    const p = l.split('|');
    const donde = f + ':' + (i+1) + ' «' + p[0] + '»';
    if(p.length !== 6){ problemas.push(donde + ' tiene ' + p.length + ' campos, no 6'); return; }
    const [en, es, cat, use, xe, xs] = p.map(x => x.trim());
    const k = en.toLowerCase();
    if(!en || !es || !cat || !use || !xe || !xs) problemas.push(donde + ' tiene un campo vacio');
    if(!CATS.has(cat)) problemas.push(donde + ' categoria desconocida: ' + cat);
    if(!/[.!?]$/.test(xe)) problemas.push(donde + ' el ejemplo EN no termina en punto');
    if(!/[.!?]$/.test(xs)) problemas.push(donde + ' el ejemplo ES no termina en punto');
    if(todas.has(k)){
      if(limpia){ quitadas++; return; }
      problemas.push(donde + ' YA EXISTE');
      return;
    }
    todas.add(k);
    quedan.push(l);
  });
  if(limpia && quitadas){ fs.writeFileSync(f, quedan.join('\n') + '\n'); }
  console.log(f + ': ' + lineas.length + ' lineas' + (limpia ? ' · ' + quitadas + ' repetidas quitadas → ' + quedan.length : '')
    + ' · ' + problemas.length + ' problemas');
  problemas.slice(0, 20).forEach(p => console.log('   ' + p));
  if(problemas.length > 20) console.log('   ... y ' + (problemas.length - 20) + ' mas');
}
console.log('--- el diccionario quedaria en ' + todas.size + ' palabras ---');
