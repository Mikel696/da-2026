
/* ══════════════════════════════════════════════════════════════
   ENGLISH ENGINE · motor de la aplicación
   Vanilla JS · sin dependencias · offline-first
════════════════════════════════════════════════════════════════ */
const APP = (() => {
'use strict';

/* Acceso seguro a localStorage. Algunos contextos (ventana privada, data: URLs,
   navegadores con almacenamiento de sitio bloqueado) LANZAN al solo tocarlo,
   así que todo pasa por aquí y la app nunca se cae por eso. */
const LS = {
  get(k){ try { return localStorage.getItem(k); } catch(e) { return null; } },
  set(k, v){ try { localStorage.setItem(k, v); } catch(e) {} }
};
const store = {
  get(k, d){ try { const v = LS.get(k); return v === null ? d : (JSON.parse(v) ?? d); } catch(e){ return d; } },
  set(k, v){
    LS.set(k, JSON.stringify(v));
    // Avisa al sincronizador. Va entre guardas: si SYNC no existe o falla,
    // el guardado local YA ocurrió y la app sigue igual.
    try { if(window.SYNC) SYNC.touch(k); } catch(e){}
  },
  raw(k){ return LS.get(k); },
  putRaw(k, v){ if(v === null){ try{ localStorage.removeItem(k); }catch(e){} } else LS.set(k, v);
    try { if(window.SYNC) SYNC.touch(k); } catch(e){} }
};

/* ─────────── DESHACER ───────────
   Antes de cada acción que borra o añade algo, se guarda una foto de las
   claves afectadas. Deshacer restaura esa foto. Es el mismo principio que
   un Ctrl+Z, pero sobre el almacenamiento, no sobre el texto. */
const UNDO = (() => {
  const stack = [];
  const MAX = 25;
  function record(label, keys){
    const snap = {};
    keys.forEach(k => { snap[k] = store.raw(k); });
    stack.push({ label, snap, at: Date.now() });
    if(stack.length > MAX) stack.shift();
  }
  function undo(){
    const e = stack.pop();
    if(!e) return null;
    Object.entries(e.snap).forEach(([k, v]) => store.putRaw(k, v));
    return e;
  }
  return { record, undo, get size(){ return stack.length; },
           get last(){ return stack.length ? stack[stack.length-1].label : null; } };
})();

const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const norm = s => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const $ = id => document.getElementById(id);
/* e.target no siempre es un Element: cuando el evento llega con document como
   destino, .matches no existe y el manejador entero reventaba (se caia tambien
   el Escape que venia despues en el mismo listener). */
const isTyping = el => !!(el && typeof el.matches === 'function'
  && el.matches('input,textarea,select,[contenteditable="true"]'));
const today = () => new Date().toISOString().slice(0, 10);
const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0,10); };

/* ─────────── TOAST ─────────── */
let toastT;
function toast(msg, kind, action){
  const el = $('toast');
  el.className = 'on' + (kind ? ' ' + kind : '');
  el.innerHTML = '';
  const t = document.createElement('span');
  t.textContent = msg;
  el.appendChild(t);
  clearTimeout(toastT);
  if(action){
    const b = document.createElement('button');
    b.className = 'toast-act';
    b.textContent = action.label || 'Deshacer';
    b.onclick = () => { el.className = ''; clearTimeout(toastT); action.fn(); };
    el.appendChild(b);
  }
  toastT = setTimeout(() => { el.className = ''; }, action ? 8000 : 2400);
}

/** Ejecuta algo que se puede deshacer: toma la foto, actúa y ofrece el botón. */
function doUndoable(label, keys, fn, msg){
  UNDO.record(label, keys);
  fn();
  toast(msg || label, 'ok', { label:'↶ Deshacer', fn: () => {
    const e = UNDO.undo();
    if(e){ refreshAll(); toast('Deshecho: ' + e.label, 'warn'); }
  }});
}

/* ─────────── 1 · PRONUNCIACIÓN (Web Speech API) ─────────── */
const TTS = (() => {
  let voices = [], chosen = null, rate = 0.9;
  const sel = $('voiceSel'), rng = $('rateSel'), val = $('rateVal');

  function load(){
    const all = window.speechSynthesis ? speechSynthesis.getVoices() : [];
    voices = all.filter(v => /^en([-_]|$)/i.test(v.lang));
    if(!voices.length){
      sel.innerHTML = '<option>Sin voces en inglés</option>';
      sel.disabled = true;
      return;
    }
    const score = v => (/google|natural|premium|enhanced|siri/i.test(v.name) ? 4 : 0)
                     + (/en[-_]US/i.test(v.lang) ? 2 : 0)
                     + (/en[-_]GB/i.test(v.lang) ? 1 : 0);
    voices.sort((a,b) => score(b) - score(a));
    // Chrome entrega getVoices() vacío en la primera pasada y lo llena después vía
    // onvoiceschanged: hay que REHABILITAR el select o queda muerto para siempre.
    sel.disabled = false;
    sel.innerHTML = voices.map((v,i) =>
      `<option value="${i}">${esc(v.name.replace(/^(Microsoft|Google)\s+/, ''))} · ${esc(v.lang)}</option>`).join('');
    const saved = LS.get('eng_voice');
    const idx = (saved !== null && voices[saved]) ? +saved : 0;
    sel.value = idx; chosen = voices[idx];
  }

  if(window.speechSynthesis){
    load();
    speechSynthesis.onvoiceschanged = load;
  } else {
    sel.innerHTML = '<option>No soportado</option>'; sel.disabled = true;
  }

  sel.addEventListener('change', () => {
    chosen = voices[sel.value];
    LS.set('eng_voice', sel.value);
    say('Ready.');
  });

  const savedRate = LS.get('eng_rate');
  if(savedRate) { rate = +savedRate; rng.value = rate; }
  val.textContent = (+rate).toFixed(2);
  rng.addEventListener('input', () => {
    rate = +rng.value;
    val.textContent = rate.toFixed(2);
    LS.set('eng_rate', rate);
  });

  function say(text, btn){
    if(!window.speechSynthesis || !text) return;
    try { speechSynthesis.cancel(); } catch(e){}
    document.querySelectorAll('.spk.playing').forEach(b => b.classList.remove('playing'));
    const u = new SpeechSynthesisUtterance(String(text).slice(0, 500));
    if(chosen) u.voice = chosen;
    u.lang = chosen ? chosen.lang : 'en-US';
    u.rate = rate; u.pitch = 1;
    if(btn){
      btn.classList.add('playing');
      u.onend = u.onerror = () => btn.classList.remove('playing');
    }
    try { speechSynthesis.speak(u); } catch(e){}
  }

  const parar = () => { try { speechSynthesis.cancel(); } catch(e){} };

  return { say, parar };
})();

// Delegación global: cualquier [data-say] habla
document.addEventListener('click', e => {
  const b = e.target.closest('[data-say]');
  if(b) TTS.say(b.getAttribute('data-say'), b.classList.contains('spk') ? b : null);
});

/* ─────────── 2 · MOLDES COLOREADOS (el pilar visible) ─────────── */
const ROLES = [
  [/^(S|SUJ|SUJETO|SUBJ)$/i, 's-suj'],
  [/^(AUX|do|does|did|am|is|are|was|were|have|has|had|will|would|can|could|should|shall|must|may|might|be|been|being|used\s*to|going\s*to|gotta|'ll|'d|'ve|'re|'m|'s)$/i, 's-aux'],
  [/^(V|VERB|VERBO|V-ing|V-ed|VERB-ing|PP|PARTICIPIO|BASE|gone)$/i, 's-ver'],
  [/^(OBJ|COMP|C|ADJ|ADV|N|NOUN|LUGAR|TIEMPO|X|CANT)$/i, 's-com'],
  [/^(not|n't|never|no)$/i, 's-neg'],
  [/^(WH|What|Where|When|Who|Why|Which|How|Whose)$/i, 's-wh']
];
function paintMold(m){
  return esc(m).split(/(\s\+\s|\s)/).map(tok => {
    const t = tok.trim();
    if(!t || t === '+') return tok === ' + ' ? ' <span style="color:var(--t3)">+</span> ' : tok;
    for(const [re, cls] of ROLES){
      if(re.test(t)) return `<span class="${cls}" style="padding:1px 6px;font-size:11px">${tok}</span>`;
    }
    return tok;
  }).join('');
}

/* ─────────── 3 · DATOS ─────────── */
const WORDS = RAW_WORDS.map((r, i) => {
  const p = r.split('|');
  return { i:i+1, en:p[0], es:p[1], cat:p[2], use:p[3], xe:p[4], xs:p[5],
           k: norm(p[0]+' '+p[1]+' '+p[3]+' '+p[4]) };
});
const PHRASES = RAW_PHRASES.map((r, i) => {
  const p = r.split('|');
  return { i:i+1, en:p[0], es:p[1], t:p[2], f:p[3], m:p[4], n:p[5],
           k: norm(p[0]+' '+p[1]+' '+p[5]) };
});

/* ─────────── 3b · BUSCAR UNA PALABRA DE VERDAD ───────────
   Buscar con `IDX.get(palabra)` a secas fallaba en tres de cada diez palabras
   de un texto hablado, y no porque faltaran del diccionario:

     · `don't`, `it's`, `I'm`, `can't`  → contracciones. Son las palabras MÁS
       frecuentes del inglés hablado y ninguna estaba.
     · `going`, `plans`, `missed`       → la misma palabra con otra terminación.
     · `walkin'`, `gonna`, `'cause`     → cómo suena de verdad en una canción.

   `LEX.raiz` ya existía pero solo sirve para VERBOS: exige que el resultado sea
   un verbo conocido, así que `windows → window` o `minutes → minute` se le
   escapan. Aquí se prueba contra el propio diccionario, sea la categoría que
   sea, y se dice SIEMPRE por qué camino se llegó: si buscas «going» tienes que
   ver que lo encontrado es «go», no creerte que el diccionario trae «going».  */
const BUSCA = (() => {
  const IDX = new Map();
  WORDS.forEach(w => { const k = String(w.en || '').toLowerCase(); if(!IDX.has(k)) IDX.set(k, w); });

  /* ── Contracciones y recortes del habla ──
     Cada una lleva su forma completa y qué significa. No se resuelven «hacia»
     el diccionario y ya: `don't` no es `do`, es `do` + negación, y eso hay que
     decirlo o se aprende mal. `base` es solo la palabra con la que ampliar. */
  const CONTRA = {
    // ── ser / estar ──
    "i'm":    { full:"I am",        es:"yo soy / estoy",            base:"be" },
    "you're": { full:"you are",     es:"tú eres / estás",           base:"be" },
    "he's":   { full:"he is / he has", es:"él es / está · él ha",   base:"be" },
    "she's":  { full:"she is / she has", es:"ella es / está · ella ha", base:"be" },
    "it's":   { full:"it is / it has", es:"es / está · ha",         base:"be" },
    "we're":  { full:"we are",      es:"nosotros somos / estamos",  base:"be" },
    "they're":{ full:"they are",    es:"ellos son / están",         base:"be" },
    "that's": { full:"that is",     es:"eso es",                    base:"that" },
    "there's":{ full:"there is",    es:"hay",                       base:"there" },
    "here's": { full:"here is",     es:"aquí está",                 base:"here" },
    "what's": { full:"what is",     es:"qué es / qué pasa",         base:"what" },
    "where's":{ full:"where is",    es:"dónde está",                base:"where" },
    "who's":  { full:"who is",      es:"quién es",                  base:"who" },
    "how's":  { full:"how is",      es:"cómo está / cómo va",       base:"how" },
    "when's": { full:"when is",     es:"cuándo es",                 base:"when" },
    "let's":  { full:"let us",      es:"vamos a… (propuesta)",      base:"let" },

    // ── haber (perfecto) ──
    "i've":   { full:"I have",      es:"yo he",                     base:"have" },
    "you've": { full:"you have",    es:"tú has",                    base:"have" },
    "we've":  { full:"we have",     es:"nosotros hemos",            base:"have" },
    "they've":{ full:"they have",   es:"ellos han",                 base:"have" },

    // ── futuro ──
    "i'll":   { full:"I will",      es:"yo voy a / yo …-é",         base:"will" },
    "you'll": { full:"you will",    es:"tú vas a / tú …-ás",        base:"will" },
    "he'll":  { full:"he will",     es:"él va a",                   base:"will" },
    "she'll": { full:"she will",    es:"ella va a",                 base:"will" },
    "it'll":  { full:"it will",     es:"va a",                      base:"will" },
    "we'll":  { full:"we will",     es:"nosotros vamos a",          base:"will" },
    "they'll":{ full:"they will",   es:"ellos van a",               base:"will" },

    // ── condicional / pasado ──
    "i'd":    { full:"I would / I had", es:"yo …-ría · yo había",   base:"would" },
    "you'd":  { full:"you would / you had", es:"tú …-rías · tú habías", base:"would" },
    "he'd":   { full:"he would / he had", es:"él …-ría · él había", base:"would" },
    "she'd":  { full:"she would / she had", es:"ella …-ría",        base:"would" },
    "we'd":   { full:"we would / we had", es:"nosotros …-ríamos",   base:"would" },
    "they'd": { full:"they would / they had", es:"ellos …-rían",    base:"would" },

    // ── negaciones ──
    "don't":     { full:"do not",     es:"no (presente)",           base:"do" },
    "doesn't":   { full:"does not",   es:"no (él / ella / eso)",    base:"do" },
    "didn't":    { full:"did not",    es:"no (pasado)",             base:"do" },
    "isn't":     { full:"is not",     es:"no es / no está",         base:"be" },
    "aren't":    { full:"are not",    es:"no son / no están",       base:"be" },
    "wasn't":    { full:"was not",    es:"no era / no estaba",      base:"be" },
    "weren't":   { full:"were not",   es:"no eran / no estaban",    base:"be" },
    "haven't":   { full:"have not",   es:"no he / no hemos",        base:"have" },
    "hasn't":    { full:"has not",    es:"no ha",                   base:"have" },
    "hadn't":    { full:"had not",    es:"no había",                base:"have" },
    "won't":     { full:"will not",   es:"no voy a / no …-é",       base:"will" },
    "wouldn't":  { full:"would not",  es:"no …-ría",                base:"would" },
    "can't":     { full:"cannot",     es:"no puedo / no puede",     base:"can" },
    "cannot":    { full:"can not",    es:"no puedo / no puede",     base:"can" },
    "couldn't":  { full:"could not",  es:"no pude / no podría",     base:"could" },
    "shouldn't": { full:"should not", es:"no debería",              base:"should" },
    "mustn't":   { full:"must not",   es:"no debe (prohibido)",     base:"must" },
    "needn't":   { full:"need not",   es:"no hace falta",           base:"need" },
    "shan't":    { full:"shall not",  es:"no …-é (muy formal)",     base:"shall" },

    /* ── Cómo suena de verdad ──
       Esto es lo que se oye en una canción y no está en ningún libro. No son
       errores: son la pronunciación normal, escrita tal cual se dice. */
    "ain't":   { full:"am not / is not / are not / have not", es:"no soy · no es · no he",
                 nota:"Muy común cantando y en habla informal. En un examen NO." },
    "gonna":   { full:"going to",   es:"voy a / vas a (futuro)",    base:"go",
                 nota:"Solo vale para el futuro: I'm gonna leave. Nunca para ir a un sitio." },
    "wanna":   { full:"want to",    es:"quiero / quieres",          base:"want" },
    "gotta":   { full:"(have) got to", es:"tengo que",              base:"get" },
    "oughta":  { full:"ought to",   es:"debería",                   base:"ought" },
    "gimme":   { full:"give me",    es:"dame",                      base:"give" },
    "lemme":   { full:"let me",     es:"déjame",                    base:"let" },
    "kinda":   { full:"kind of",    es:"algo así / más o menos",    base:"kind" },
    "sorta":   { full:"sort of",    es:"algo así / más o menos",    base:"sort" },
    "outta":   { full:"out of",     es:"fuera de",                  base:"out" },
    "lotta":   { full:"lot of",     es:"mucho / un montón de",      base:"lot" },
    "dunno":   { full:"don't know", es:"no sé",                     base:"know" },
    "cuz":     { full:"because",    es:"porque",                    base:"because" },
    "coz":     { full:"because",    es:"porque",                    base:"because" },
    "cos":     { full:"because",    es:"porque",                    base:"because" },
    "'cause":  { full:"because",    es:"porque",                    base:"because" },
    "cause":   { full:"because · causa", es:"porque (cantando) · causa", base:"because",
                 nota:"Cantando casi siempre es «because» con la be comida." },
    "'em":     { full:"them",       es:"los / las / les",           base:"them" },
    "em":      { full:"them",       es:"los / las / les",           base:"them" },
    "y'all":   { full:"you all",    es:"ustedes / vosotros",        base:"you",
                 nota:"Del sur de Estados Unidos. Muy usado en rap y country." },
    "ya":      { full:"you",        es:"tú / te",                   base:"you" },
    "whatcha": { full:"what are you / what do you", es:"qué estás / qué vas a", base:"what" },
    "gotcha":  { full:"got you",    es:"te pillé / entendido",      base:"get" },
    "betcha":  { full:"bet you",    es:"te apuesto",                base:"bet" },
    "'til":    { full:"until",      es:"hasta",                     base:"until" },
    "til":     { full:"until",      es:"hasta",                     base:"until" },
    "till":    { full:"until",      es:"hasta",                     base:"until" },
    "ma":      { full:"my",         es:"mi",                        base:"my" },
    "nah":     { full:"no",         es:"nah / no",                  base:"no" },
    "yeah":    { full:"yes",        es:"sí",                        base:"yes" },
    "yep":     { full:"yes",        es:"sí",                        base:"yes" },
    "nope":    { full:"no",         es:"no",                        base:"no" },
    "o'clock": { full:"of the clock", es:"en punto",                base:"clock" },

    /* Estas son sustantivos con la -g comida, y la regla general NO puede
       cogerlas sola: sin apóstrofo solo se acepta el recorte cuando se llega
       por el camino del gerundio, o «sin» acabaría siendo «sing». Como no son
       verbos, van escritas una a una. Salen en cada canción. */
    "nothin":     { full:"nothing",    es:"nada",            base:"nothing" },
    "nuthin":     { full:"nothing",    es:"nada",            base:"nothing" },
    "somethin":   { full:"something",  es:"algo",            base:"something" },
    "anythin":    { full:"anything",   es:"cualquier cosa",  base:"anything" },
    "everythin":  { full:"everything", es:"todo",            base:"everything" },
    "mornin":     { full:"morning",    es:"mañana",          base:"morning" },
    "evenin":     { full:"evening",    es:"tarde / noche",   base:"evening" },
    "darlin":     { full:"darling",    es:"cariño",          base:"darling" },
    "somethin'":  { full:"something",  es:"algo",            base:"something" },
    "nothin'":    { full:"nothing",    es:"nada",            base:"nothing" }
  };

  /* Pasados y participios que no siguen ninguna regla. LEX.raiz ya sabe los
     del vocabulario original, pero no los de las palabras que se anadieron
     despues: «tore» no llevaba a «tear» aunque «tear» estuviera en la ficha.
     Se comprueban igual que todo lo demas — contra el diccionario —, asi que
     si una base no existe, esta linea simplemente no hace nada. */
  const VERB_IRR = {
    tore:'tear', torn:'tear', sank:'sink', sunk:'sink', knelt:'kneel',
    wept:'weep', bled:'bleed', shone:'shine', bent:'bend', leapt:'leap',
    bit:'bite', bitten:'bite', fed:'feed', hung:'hang', swung:'swing',
    spun:'spin', blew:'blow', blown:'blow', froze:'freeze', frozen:'freeze',
    crept:'creep', swept:'sweep', clung:'cling', flung:'fling', stung:'sting',
    sprang:'spring', sprung:'spring', drank:'drink', drunk:'drink', swam:'swim',
    swum:'swim', rang:'ring', rung:'ring', shrank:'shrink', shrunk:'shrink',
    slid:'slide', stuck:'stick', struck:'strike', dealt:'deal', knit:'knit',
    sewed:'sew', sewn:'sew', woke:'wake', woken:'wake', forgave:'forgive',
    forgiven:'forgive', withdrew:'withdraw', withdrawn:'withdraw',
    shook:'shake', shaken:'shake', sought:'seek', shot:'shoot',
    bound:'bind', fled:'flee', overheard:'overhear', swore:'swear', sworn:'swear',
    wove:'weave', woven:'weave', dug:'dig', spat:'spit', wept:'weep',
    clung:'cling', bred:'breed', fed:'feed', held:'hold', laid:'lay',
    lain:'lie', arose:'arise', bore:'bear', borne:'bear', chose:'choose',
    chosen:'choose', dealt:'deal', drew:'draw', drawn:'draw', dwelt:'dwell',
    forbade:'forbid', froze:'freeze', hid:'hide', hidden:'hide', lit:'light',
    meant:'mean', mistook:'mistake', rode:'ride', ridden:'ride', rose:'rise',
    risen:'rise', sewn:'sew', sowed:'sow', sown:'sow', spun:'spin',
    strode:'stride', strove:'strive', swore_in:'swear', tread:'tread',
    trod:'tread', undone:'undo', undid:'undo', woke:'wake', wound:'wind',
    wrung:'wring'
  };

  /* Plurales que no siguen ninguna regla: hay que saberlos de memoria. */
  const PLUR_IRR = {
    children:'child', feet:'foot', teeth:'tooth', men:'man', women:'woman',
    people:'person', mice:'mouse', geese:'goose', oxen:'ox', dice:'die',
    lives:'life', wives:'wife', knives:'knife', leaves:'leaf', halves:'half',
    wolves:'wolf', shelves:'shelf', thieves:'thief', loaves:'loaf', selves:'self',
    calves:'calf', elves:'elf', scarves:'scarf', hooves:'hoof', ourselves:'self',
    themselves:'self', yourselves:'self'
  };

  const dobles = w => /([bdfglmnprtz])\1$/.test(w);

  /* Todas las formas base que PODRÍA tener esta palabra. No se decide cuál es
     la buena por reglas: se prueban contra el diccionario y gana la que exista.
     Cada candidata dice de qué terminación viene, para poder explicarlo. */
  function candidatos(w){
    const c = [];
    const add = (base, como) => { if(base && base.length > 1) c.push([base, como]); };

    if(/'s$/.test(w)) add(w.slice(0, -2), 'posesivo');
    if(/s'$/.test(w)) add(w.slice(0, -2), 'posesivo en plural');
    if(PLUR_IRR[w])   add(PLUR_IRR[w], 'plural irregular');
    if(VERB_IRR[w])   add(VERB_IRR[w], 'pasado irregular');

    if(/ies$/.test(w)){ add(w.slice(0, -3) + 'y', 'plural'); }
    if(/ves$/.test(w)){ add(w.slice(0, -3) + 'f', 'plural'); add(w.slice(0, -3) + 'fe', 'plural'); }
    /* Quitar SOLO la -s va primero. Con la regla de «-oes» delante, «toes» se
       quedaba en «to» — que existe — y ganaba esa. Probando antes «toe» sale
       bien, y «potatoes» o «heroes» siguen saliendo por la regla de abajo. */
    if(/s$/.test(w) && !/ss$/.test(w)) add(w.slice(0, -1), 'plural o 3ª persona');
    if(/(ch|sh|ss|x|z|o)es$/.test(w)) add(w.slice(0, -2), 'plural');
    if(/es$/.test(w))  add(w.slice(0, -2), 'plural');

    if(/ied$/.test(w)) add(w.slice(0, -3) + 'y', 'pasado');
    if(/ed$/.test(w)){
      add(w.slice(0, -2), 'pasado o participio');
      add(w.slice(0, -1), 'pasado o participio');
      if(dobles(w.slice(0, -2))) add(w.slice(0, -3), 'pasado');
    }
    if(/ying$/.test(w)) add(w.slice(0, -4) + 'ie', 'gerundio');
    if(/in'$/.test(w))  add(w.slice(0, -3) + 'ing', 'cantando se come la g');
    if(/ing$/.test(w)){
      add(w.slice(0, -3), 'gerundio');
      add(w.slice(0, -3) + 'e', 'gerundio');
      if(dobles(w.slice(0, -3))) add(w.slice(0, -4), 'gerundio');
    }
    if(/iest$/.test(w)) add(w.slice(0, -4) + 'y', 'superlativo');
    if(/est$/.test(w)){
      add(w.slice(0, -3), 'superlativo');
      add(w.slice(0, -2), 'superlativo');
      if(dobles(w.slice(0, -3))) add(w.slice(0, -4), 'superlativo');
    }
    if(/ier$/.test(w)) add(w.slice(0, -3) + 'y', 'comparativo');
    if(/er$/.test(w)){
      add(w.slice(0, -2), 'comparativo o «el que hace»');
      add(w.slice(0, -1), 'comparativo o «el que hace»');
      if(dobles(w.slice(0, -2))) add(w.slice(0, -3), 'comparativo');
    }
    if(/ily$/.test(w)) add(w.slice(0, -3) + 'y', 'adverbio');
    if(/ly$/.test(w))  add(w.slice(0, -2), 'adverbio');
    if(/ness$/.test(w)) add(w.slice(0, -4), 'sustantivo de un adjetivo');
    if(/less$/.test(w)) add(w.slice(0, -4), 'sin eso');
    if(/ful$/.test(w))  add(w.slice(0, -3), 'lleno de eso');
    return c;
  }

  /* Cómo se escribe cantando → cómo se escribe de verdad. Es un paso APARTE
     porque después hay que seguir buscando: «walkin'» no está en el diccionario
     y «walking» tampoco — hay que llegar hasta «walk», y eso son dos saltos.
     El primer intento solo daba uno, y por eso fallaba. */
  function comoSeEscribe(w){
    if(/in'$/.test(w)) return [w.slice(0, -3) + 'ing', true];   // con apóstrofo: seguro
    if(/[a-z]{3,}in$/.test(w)) return [w.slice(0, -2) + 'ing', false];  // sin él: hay que comprobar
    return [null, false];
  }

  /* El resultado dice SIEMPRE por dónde se llegó:
       via 'exacta'   · la palabra está tal cual
       via 'contra'   · es una contracción o un recorte del habla
       via 'forma'    · es otra forma de una palabra que sí está
       null           · no está, y entonces se manda fuera */
  function buscar(q){
    const w0 = String(q || '').toLowerCase().trim();
    if(!w0) return null;

    const exacta = IDX.get(w0);
    if(exacta) return { via:'exacta', w:exacta };

    const ct = CONTRA[w0];
    if(ct) return { via:'contra', w:IDX.get(ct.base) || null, contra:ct, forma:w0 };

    // Sin apóstrofo: muchos subtítulos escriben «dont» o «im»
    const sinAp = w0.replace(/'/g, '');
    for(const k in CONTRA){
      if(k.replace(/'/g, '') === sinAp && k !== w0)
        return { via:'contra', w:IDX.get(CONTRA[k].base) || null, contra:CONTRA[k], forma:k };
    }

    /* La -g comida. Con apóstrofo no hay duda. SIN apóstrofo hay que hilar fino:
       «thin» no es «thing» comiéndose nada, y dar eso por bueno sería enseñarle
       una palabra que no es. Así que sin apóstrofo solo vale si se llega por el
       camino del gerundio — «walkin» → «walking» → «walk» —, nunca por acierto
       directo. Es la diferencia entre reconocer un recorte e inventárselo. */
    const [ing, seguro] = comoSeEscribe(w0);
    if(ing){
      if(seguro){
        const ex = IDX.get(ing);
        if(ex) return { via:'forma', w:ex, base:ing, como:'cantando se come la g', forma:w0 };
      }
      for(const [base, como] of candidatos(ing)){
        const w = IDX.get(base);
        if(w && (seguro || como === 'gerundio'))
          return { via:'forma', w, base, como:'cantando se come la g · ' + como, forma:w0 };
      }
    }

    for(const [base, como] of candidatos(w0)){
      const w = IDX.get(base);
      if(w) return { via:'forma', w, base, como, forma:w0 };
    }

    // Último intento: el lematizador de verbos, que sabe los irregulares
    try {
      const r = LEX.raiz(w0);
      if(r && r !== w0 && IDX.get(r))
        return { via:'forma', w:IDX.get(r), base:r, como:'verbo irregular', forma:w0 };
    } catch(e){}

    return null;
  }

  /* Una auditoría que solo confirma lo que ya funciona no vale nada. Aquí hay
     tres clases de caso: las que tienen que resolverse a una palabra concreta,
     las que tienen que resolverse a SÍ MISMAS porque tienen ficha propia, y las
     que NO se pueden encontrar de ninguna manera. Sin las últimas, un buscador
     que dijera «sí» a todo pasaría el examen. */
  function auditar(){
    const malas = [];
    const debeDar = [
      ['going','go'], ['plans','plan'], ['missed','miss'], ['windows','window'],
      ['minutes','minute'], ['children','child'], ['feet','foot'], ['lives','life'],
      ["walkin'",'walk'], ['walkin','walk'], ['bigger','big'], ['easiest','easy'],
      ["don't",'do'], ["it's",'be'], ["can't",'can'], ['gonna','go'], ['wanna','want'],
      ["'cause",'because'], ["y'all",'you'], ['taken','take'], ['dont','do'],
      ["nothin'",'nothing'], ['babies','baby'], ['tried','try'], ['stopped','stop'],
      ['toes','toe'], ['shoes','shoe'], ['tore','tear'], ['sank','sink'],
      ['wept','weep'], ['bled','bleed'], ['hung','hang'], ['blew','blow'],
      ['bound','bind'], ['fled','flee'], ['overheard','overhear'], ['swore','swear'],
      ['wove','weave'], ['dug','dig'], ['spat','spit'], ['minutes','minute']
    ];
    for(const [entra, esperada] of debeDar){
      const r = buscar(entra);
      if(!r){ malas.push(entra + ' → no lo encuentra'); continue; }
      if(!r.w){ malas.push(entra + ' → lo reconoce pero no lleva a ninguna ficha'); continue; }
      if(r.w.en !== esperada) malas.push(entra + ' → ' + r.w.en + ', se esperaba ' + esperada);
    }
    // Con ficha propia: el acierto exacto manda, no se les busca raíz
    for(const p of ['quickly', 'ran', 'was', 'went']){
      const r = buscar(p);
      if(!r || r.via !== 'exacta') malas.push(p + ' → debería ser acierto exacto y no lo es');
    }
    // Lo que NO puede encontrarse. Si esto pasa, el buscador está diciendo que sí a todo.
    for(const x of ['zzqx', 'blorptium', 'xyzzyfied', 'qwertyui', 'thisisnotaword']){
      const r = buscar(x);
      if(r) malas.push(x + ' → devuelve ' + (r.w ? r.w.en : r.via) + ' y no debería dar nada');
    }
    // Y lo mas basico de todo tiene que estar SIEMPRE
    const sinBasico = faltaBasico();
    sinBasico.forEach(w => malas.push('falta una palabra basica: ' + w));

    return { malas, ok: malas.length === 0, contracciones:Object.keys(CONTRA).length,
             palabras: IDX.size, basicasQueFaltan: sinBasico.length };
  }

  /* ══════════ EL SUELO DEL DICCIONARIO ══════════
     Lo que hay que poder decir para pedir algo, llegar a un sitio y seguir una
     conversacion normal. Si una de estas falta, el diccionario no sirve por
     muchas palabras raras que tenga.

     Existe porque el diccionario llego a 4000 palabras SIN «toilet», «boy»,
     «girl», ni los numeros del once al cincuenta. Se genero por temas, y por
     temas uno nunca escribe «nino» ni «vater»: da por hecho que ya estan.
     Lo encontro Miguel preguntando por una sola palabra. Esta lista es para
     que la proxima vez lo encuentre la auditoria y no el. */
  const BASICO = ('toilet bathroom shower soap towel mirror sink water bread milk ' +
    'coffee tea juice beer wine food eat drink sleep wake work rest ' +
    'man woman boy girl child baby family friend name age home house ' +
    'hungry thirsty tired sick hot cold big small good bad new old ' +
    'open closed push pull stop wait start finish help please sorry thanks ' +
    'yes no maybe here there near far left right up down in out ' +
    'today tomorrow yesterday now later morning night day week month year ' +
    'hour minute second time early late fast slow ' +
    'buy sell pay money price cheap expensive free change ticket ' +
    'street city country map airport station bus train taxi car hotel room key ' +
    'doctor hospital pharmacy police emergency danger safe ' +
    'one two three four five six seven eight nine ten eleven twelve ' +
    'twenty thirty forty fifty hundred thousand first second third ' +
    'red blue green yellow black white ' +
    'who what where when why how much many ' +
    'speak understand know think want need like love go come give take ' +
    'phone email address number letter word question answer').split(/\s+/);

  function faltaBasico(){
    return BASICO.filter(w => w && !buscar(w));
  }

  return { buscar, auditar, faltaBasico, IDX, CONTRA, BASICO };
})();
const CAT_LABEL = { verbo:'Verbos', sust:'Sustantivos', adj:'Adjetivos', adv:'Adverbios',
  prep:'Preposiciones', pron:'Pronombres', conj:'Conectores', det:'Determinantes',
  num:'Números', expr:'Expresiones', modal:'Modales' };
const TENSE_LABEL = { pres:'Presente simple', prescont:'Presente continuo', past:'Pasado simple',
  pastcont:'Pasado continuo', perf:'Presente perfecto', fut:'Futuro · will', goingto:'Futuro · going to',
  cond:'Condicional', modal:'Modales', imper:'Imperativo', fija:'Expresión fija' };
const FUNC_LABEL = { saludos:'Saludos', presentarse:'Presentarse', smalltalk:'Small talk',
  cortesia:'Cortesía', disculpas:'Disculpas', despedidas:'Despedidas', restaurante:'Restaurante',
  compras:'Compras', viaje:'Viaje', hotel:'Hotel', direcciones:'Direcciones', transporte:'Transporte',
  telefono:'Teléfono', trabajo:'Trabajo', reuniones:'Reuniones', entrevista:'Entrevista', email:'Email',
  opiniones:'Opiniones', acuerdo:'Acuerdo', sugerir:'Sugerir', permiso:'Permiso', ayuda:'Pedir ayuda',
  quejas:'Quejas', salud:'Salud', emergencia:'Emergencia', familia:'Familia', casa:'Casa',
  tiempo:'Clima y hora', planes:'Planes', pasado:'Contar el pasado', sentimientos:'Sentimientos',
  estudio:'Estudio', tecnologia:'Tecnología', dinero:'Dinero', comparar:'Comparar',
  conectores:'Conectores', phrasal:'Phrasal verbs', idioms:'Expresiones' };

/* Las bandas salen del TAMANO REAL del diccionario, no de un numero escrito a
   mano. Estaban clavadas en 2000 y, al ampliarlo a 4000, "Todas" se habria
   quedado mostrando la mitad sin avisar de nada. Las primeras siguen siendo las
   de siempre porque son las de frecuencia; a partir de ahi se reparte el resto.
   Las 2000 primeras van por frecuencia real; las que vinieron despues se
   anadieron por tema (canciones, cuerpo, casa, trabajo...), y por eso la ultima
   banda se llama por lo que es y no finge un orden que no tiene. */
const BANDS = (() => {
  const N = WORDS.length;
  const base = [
    { id:'all', lb:'Todas', a:1, b:N },
    { id:'b1', lb:'1-100 · el núcleo', a:1, b:100 },
    { id:'b2', lb:'101-300', a:101, b:300 },
    { id:'b3', lb:'301-600', a:301, b:600 },
    { id:'b4', lb:'601-1000', a:601, b:1000 },
    { id:'b5', lb:'1001-1500', a:1001, b:1500 },
    { id:'b6', lb:'1501-2000', a:1501, b:Math.min(2000, N) }
  ];
  // Todo lo que pase de 2000 entro por tema, no por frecuencia: se dice asi.
  if(N > 2000) base.push({ id:'b7', lb:'2001-' + N + ' · por temas', a:2001, b:N });
  return base;
})();

/* ─────────── 4 · MARCADORES ─────────── */
/* Un favorito valido es un entero dentro del catalogo. Cualquier otra cosa
   (null, NaN, texto) es basura de un click mal enrutado y se descarta.
   Paso de verdad el 01-sep-2026: un [data-fp] mio choco con el de "marcar
   frase" del proyecto, +"suj" dio NaN y ese NaN entro aqui y se sincronizo.
   Filtrar al leer cuesta nada y hace imposible que un id invalido rompa la
   practica o viaje a los otros dispositivos. */
const favLimpios = (bruto, max) => {
  const out = new Set();
  for(const v of (Array.isArray(bruto) ? bruto : [])){
    const n = typeof v === 'number' ? v : parseInt(v, 10);
    if(Number.isInteger(n) && n >= 1 && n <= max) out.add(n);
  }
  return out;
};
let favW = favLimpios(store.get('eng_fav_w', []), WORDS.length);
let favP = favLimpios(store.get('eng_fav_p', []), PHRASES.length);
const saveFav = () => { store.set('eng_fav_w', [...favW]); store.set('eng_fav_p', [...favP]); };
const reloadFavs = () => {
  favW = favLimpios(store.get('eng_fav_w', []), WORDS.length);
  favP = favLimpios(store.get('eng_fav_p', []), PHRASES.length);
};

/* Si lo guardado traia basura, se reescribe limpio UNA vez. Solo escribe
   cuando de verdad sobra algo: un favorito legitimo nunca se toca. */
function sanearFavs(){
  const bw = store.get('eng_fav_w', []), bp = store.get('eng_fav_p', []);
  const sucio = (Array.isArray(bw) && bw.length !== favW.size)
             || (Array.isArray(bp) && bp.length !== favP.size);
  if(sucio){
    console.warn('[eng] favoritos con entradas invalidas — se reescriben limpios',
      { palabras: (bw||[]).length + '->' + favW.size, frases: (bp||[]).length + '->' + favP.size });
    saveFav();
  }
  return sucio;
}

/* ─────────── 5 · RACHA ─────────── */
const Streak = (() => {
  let s = store.get('eng_streak', { last:null, days:0, log:{} });
  function ping(){
    const t = today();
    if(s.last === t) { s.log[t] = (s.log[t] || 0) + 1; store.set('eng_streak', s); return; }
    const yest = addDays(-1);
    s.days = (s.last === yest) ? s.days + 1 : 1;
    s.last = t;
    s.log[t] = (s.log[t] || 0) + 1;
    // conservar solo 120 días de historial
    const keys = Object.keys(s.log).sort();
    while(keys.length > 120) delete s.log[keys.shift()];
    store.set('eng_streak', s);
    render();
  }
  function render(){
    const el = $('streakN'); if(!el) return;
    el.textContent = s.days || 0;
    const t = $('streakT');
    if(t) t.textContent = s.log[today()] || 0;
  }
  function reload(){ s = store.get('eng_streak', { last:null, days:0, log:{} }); render(); }
  return { ping, render, reload, get data(){ return s; } };
})();

/* ─────────── 6 · MÓDULO 1 · PALABRAS ─────────── */
const M1 = { q:'', band:'all', cat:'all', fav:false, shown:200 };
const elW = () => $('wlist');

function filterWords(){
  const q = norm(M1.q.trim());
  const bd = BANDS.find(b => b.id === M1.band) || BANDS[0];
  return WORDS.filter(w =>
    w.i >= bd.a && w.i <= bd.b &&
    (M1.cat === 'all' || w.cat === M1.cat) &&
    (!M1.fav || favW.has(w.i)) &&
    (!q || w.k.includes(q))
  );
}
function wordCard(w){
  return `<div class="w${favW.has(w.i) ? ' done' : ''}" data-w="${w.i}">
    <button class="w-fav${favW.has(w.i) ? ' on' : ''}" data-fw="${w.i}" title="Marcar para practicar">${favW.has(w.i) ? '★' : '☆'}</button>
    <button class="w-fav nbsend" data-nb-en="${esc(w.en)}" data-nb-es="${esc(w.es)}" title="Guardar en mi cuaderno">📓</button>
    <div class="w-top">
      <span class="w-rk">${w.i}</span>
      <span class="w-en">${esc(w.en)}</span>
      <button class="dicb" data-dic="${esc(w.en)}" title="Buscar en el diccionario">🔎</button><button class="spk sm" data-say="${esc(w.en)}" title="Pronunciar">🔊</button>
      <span class="w-cat cat-${w.cat}" data-pz="${w.cat}" style="cursor:pointer" title="¿Qué es un ${esc(CAT_LABEL[w.cat] || w.cat)}? — abre la explicación">${w.cat}</span>
    </div>
    <div class="w-es">${esc(w.es)}</div>
    <div class="w-use">${esc(w.use)}</div>
    <div class="w-ex">
      <button class="spk sm" data-say="${esc(w.xe)}" title="Pronunciar ejemplo">🔊</button>
      <div><div class="en">${esc(w.xe)}</div><div class="es">${esc(w.xs)}</div></div>
    </div>
  </div>`;
}
function renderWords(reset){
  if(reset) M1.shown = 200;
  const res = filterWords();
  $('n1').textContent = res.length;
  // El total tambien sale del diccionario. Escrito a mano se quedo en 2000
  // mientras el diccionario ya iba por 4000, y nadie lo noto.
  const tot = $('n1tot'); if(tot) tot.textContent = WORDS.length;
  const box = elW();
  if(!res.length){
    box.innerHTML = '<div class="empty" style="grid-column:1/-1"><div class="e1">🔍</div>Sin resultados. Prueba otra búsqueda o quita un filtro.</div>';
    $('more1').style.display = 'none';
    return;
  }
  box.className = 'wgrid' + (M1.shown <= 200 ? ' stagger' : '');
  box.innerHTML = res.slice(0, M1.shown).map(wordCard).join('');
  CTL.label('ctl1');
  const mb = $('more1');
  if(res.length > M1.shown){
    mb.style.display = 'block';
    mb.textContent = `Mostrar 200 más ↓  (${res.length - M1.shown} restantes)`;
  } else mb.style.display = 'none';
}

/* ─────────── 7 · MÓDULO 2 · FRASES ─────────── */
const M2 = { q:'', func:'all', tense:'all', fav:false, shown:150 };
const elP = () => $('plist');

function filterPhrases(){
  const q = norm(M2.q.trim());
  return PHRASES.filter(p =>
    (M2.func === 'all' || p.f === M2.func) &&
    (M2.tense === 'all' || p.t === M2.tense) &&
    (!M2.fav || favP.has(p.i)) &&
    (!q || p.k.includes(q))
  );
}
function phraseCard(p){
  return `<div class="p${favP.has(p.i) ? ' done' : ''}">
    <button class="p-fav${favP.has(p.i) ? ' on' : ''}" data-fp="${p.i}" title="Marcar para practicar">${favP.has(p.i) ? '★' : '☆'}</button>
    <button class="p-fav nbsend" data-nb-en="${esc(p.en)}" data-nb-es="${esc(p.es)}" title="Guardar en mi cuaderno">📓</button>
    <div class="p-top">
      <button class="dicb" data-dic="${esc(p.en)}" title="Ver esta frase en contexto real">🔎</button><button class="spk lg" data-say="${esc(p.en)}" title="Pronunciar">🔊</button>
      <div class="p-body">
        <div class="p-en" data-say="${esc(p.en)}" style="cursor:pointer">${esc(p.en)}</div>
        <div class="p-es">${esc(p.es)}</div>
        <div class="p-meta">
          <span class="tag t">${esc(TENSE_LABEL[p.t] || p.t)}</span>
          <span class="tag f">${esc(FUNC_LABEL[p.f] || p.f)}</span>
          <span class="tag">#${p.i}</span>
        </div>
        <div class="p-mold">${paintMold(p.m)}</div>
        <div class="p-note">💡 ${esc(p.n)}</div>
      </div>
    </div>
  </div>`;
}
function renderPhrases(reset){
  if(reset) M2.shown = 150;
  const res = filterPhrases();
  $('n2').textContent = res.length;
  const box = elP();
  if(!res.length){
    box.innerHTML = '<div class="empty"><div class="e1">🔍</div>Sin resultados. Prueba otra búsqueda o quita un filtro.</div>';
    $('more2').style.display = 'none';
    return;
  }
  box.className = M2.shown <= 150 ? 'stagger' : '';
  box.innerHTML = res.slice(0, M2.shown).map(phraseCard).join('');
  CTL.label('ctl2');
  const mb = $('more2');
  if(res.length > M2.shown){
    mb.style.display = 'block';
    mb.textContent = `Mostrar 150 más ↓  (${res.length - M2.shown} restantes)`;
  } else mb.style.display = 'none';
}

/* ─────────── 8 · CHIPS ─────────── */
function buildChips(el, items, active, onPick){
  el.innerHTML = items.map(it =>
    `<button class="chip${it.id === active ? ' on' : ''}" data-v="${esc(it.id)}">${esc(it.lb)}${it.n !== undefined ? `<span class="c">${it.n}</span>` : ''}</button>`
  ).join('');
  el.onclick = e => {
    const c = e.target.closest('.chip'); if(!c) return;
    [...el.children].forEach(x => x.classList.remove('on'));
    c.classList.add('on');
    onPick(c.dataset.v);
  };
}
function countBy(arr, key){
  const m = {};
  arr.forEach(x => { m[x[key]] = (m[x[key]] || 0) + 1; });
  return m;
}

/* ─────────── 9 · PIEZAS · quiz ─────────── */
const QUIZ = [
  { q:'En <b>"I bought a new car"</b>, ¿qué pieza es <b>new</b>?', o:['Adjetivo','Sustantivo','Verbo','Adverbio'], a:0,
    fb:'<b>Adjetivo.</b> Dice cómo ES el carro. Y fíjate dónde está: <b>antes</b> del sustantivo, como manda el inglés.' },
  { q:'¿Cuál de estas piezas <b>nunca</b> lleva plural en inglés?', o:['El adjetivo','El sustantivo','El pronombre','El número'], a:0,
    fb:'<b>El adjetivo.</b> <i>two red cars</i>, jamás <i>two reds cars</i>. En español el adjetivo copia el número; en inglés se queda quieto para siempre.' },
  { q:'En <b>"She works quickly"</b>, ¿qué es <b>quickly</b>?', o:['Adverbio','Adjetivo','Verbo','Preposición'], a:0,
    fb:'<b>Adverbio.</b> Responde <i>¿cómo trabaja?</i> — describe la ACCIÓN, no una cosa. Y termina en <b>-ly</b>, la pista más fácil.' },
  { q:'¿Cuál está bien escrita?', o:["She doesn't work","She doesn't works","She don't works","She not works"], a:0,
    fb:'La marca de tiempo se pone <b>una sola vez</b>: la lleva <i>doe<b>s</b></i> y el verbo vuelve a estar desnudo. Poner la -s dos veces es el error más común del hispanohablante.' },
  { q:'¿Qué motor exige que el verbo lleve <b>-ing</b> detrás?', o:['BE (am/is/are)','DO (do/does/did)','HAVE (have/has)','WILL'], a:0,
    fb:'<b>BE.</b> Cada motor pide una forma distinta: BE → <b>-ing</b> · HAVE → <b>participio</b> · DO, WILL y modales → <b>verbo desnudo</b>.' },
  { q:'En <b>"It\'s raining"</b>, ¿qué oficio cumple <b>it</b>?', o:['Rellenar el hueco del sujeto','Señalar la lluvia','Es un adjetivo','No hace nada, sobra'], a:0,
    fb:'Es el <b>sujeto de relleno</b>. En inglés toda frase obliga a tener sujeto, así que cuando no hay nadie se pone <i>it</i>. En español dices "Llueve" sin sujeto; ahí está la diferencia.' },
  { q:'¿Qué preposición se usa con una <b>hora exacta</b>?', o:['at — at 8 o\'clock','in — in 8 o\'clock','on — on 8 o\'clock','to — to 8 o\'clock'], a:0,
    fb:'<b>at</b>, porque es el punto más pequeño. La escalera es: <b>at</b> una hora → <b>on</b> un día → <b>in</b> un mes. De lo pequeño a lo grande.' },
  { q:'Después de un modal como <b>can</b> o <b>should</b>, ¿qué va?', o:['El verbo desnudo: can swim','El verbo con to: can to swim','El verbo con -ing: can swimming','El verbo con -s: can swims'], a:0,
    fb:'<b>Verbo desnudo, siempre.</b> Los modales nunca llevan <i>to</i>, nunca llevan <i>-s</i> y nunca necesitan <i>do</i> para negar o preguntar. Son la pieza más fácil del idioma.' },
  { q:'<b>"I\'m boring"</b> significa…', o:['Soy una persona aburrida','Estoy aburrido','Me aburro rápido','Está aburrido'], a:0,
    fb:'Con <b>-ing</b> describes lo que TÚ le provocas a los demás. Para decir "estoy aburrido" es <b>I\'m bor<u>ed</u></b>. La regla: <b>-ed</b> lo siento yo, <b>-ing</b> lo causa la cosa.' },
  { q:'¿Cuál es correcta?', o:['Where do you live?','Where you live?','Where live you?','Where you do live?'], a:0,
    fb:'Preguntar en inglés es <b>mover el auxiliar al frente</b>. Si no hay ninguno visible, aparece <b>do / does / did</b> para ocupar esa casilla. Sin auxiliar no hay pregunta.' }
];
let qzI = 0, qzScore = 0, qzOrder = [];
function qzShuffle(){ qzOrder = QUIZ.map((_,i)=>i).sort(()=>Math.random()-0.5); }
function renderQuiz(){
  const box = $('qzBox'); if(!box) return;
  if(qzI >= qzOrder.length){
    const pct = Math.round(qzScore / qzOrder.length * 100);
    box.innerHTML = `<div class="pr-done" style="padding:26px 10px">
      <div class="big">${pct >= 80 ? '🎉' : pct >= 50 ? '💪' : '📖'}</div>
      <h3>${qzScore} de ${qzOrder.length} correctas</h3>
      <p>${pct >= 80 ? 'Las piezas te quedaron claras. Ya puedes leer los módulos 1 y 2 entendiendo qué hace cada palabra.'
        : pct >= 50 ? 'Vas bien. Vuelve a abrir las piezas que fallaste y repite — no hay límite de intentos.'
        : 'Sin problema: esto es exactamente para lo que existe esta página. Abre las piezas de arriba con calma y vuelve.'}</p>
      <button class="btn pri" id="qzAgain">↻ Repetir el quiz</button></div>`;
    $('qzAgain').onclick = () => { qzI = 0; qzScore = 0; qzShuffle(); renderQuiz(); };
    return;
  }
  const q = QUIZ[qzOrder[qzI]];
  const opts = q.o.map((t, i) => ({ t, ok: i === q.a })).sort(() => Math.random() - 0.5);
  box.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
      <span class="tag t">Pregunta ${qzI+1} de ${qzOrder.length}</span>
      <span class="cnt">Aciertos: <b>${qzScore}</b></span>
    </div>
    <div class="qz-q">${q.q}</div>
    <div class="qz-opts">${opts.map((o,i) => `<button class="qz-o" data-i="${i}" data-ok="${o.ok}">${o.t}</button>`).join('')}</div>
    <div class="qz-fb" id="qzFb"></div>
    <button class="btn pri" id="qzNext" style="margin-top:14px;display:none">Siguiente →</button>`;
  box.querySelectorAll('.qz-o').forEach(b => {
    b.onclick = () => {
      const ok = b.dataset.ok === 'true';
      box.querySelectorAll('.qz-o').forEach(x => {
        x.disabled = true;
        if(x.dataset.ok === 'true') x.classList.add('good');
      });
      if(!ok) b.classList.add('bad'); else qzScore++;
      const fb = $('qzFb');
      fb.className = 'qz-fb on';
      fb.innerHTML = (ok ? '<b style="color:#4ade80">✓ Correcto. </b>' : '<b style="color:#f87171">✗ No era esa. </b>') + q.fb;
      $('qzNext').style.display = 'inline-flex';
      Streak.ping();
    };
  });
  $('qzNext').onclick = () => { qzI++; renderQuiz(); };
}

/* ─────────── 10 · PRÁCTICA · Leitner ─────────── */
const SRS = (() => {
  const KEY = 'eng_srs';
  const GAP = [0, 1, 2, 4, 8, 16];   // días de espera por caja (índice = caja)
  let db = store.get(KEY, {});
  let cfg = { src:'mix', dir:'en2es' };
  let queue = [], cur = null, flipped = false, doneCount = 0;

  const idOf = c => (c.kind === 'w' ? 'w:' : 'p:') + c.i;
  const save = () => store.set(KEY, db);

  function pool(){
    let ws = WORDS.map(w => ({ kind:'w', i:w.i, front:w.en, back:w.es, extra:w.use, ex:w.xe }));
    let ps = PHRASES.map(p => ({ kind:'p', i:p.i, front:p.en, back:p.es, extra:p.m, ex:p.n }));
    if(cfg.src === 'words') return ws;
    if(cfg.src === 'phrases') return ps;
    if(cfg.src === 'fav'){
      const f = ws.filter(c => favW.has(c.i)).concat(ps.filter(c => favP.has(c.i)));
      return f;
    }
    // mezcla: prioriza lo marcado, completa con el núcleo de alta frecuencia
    const fav = ws.filter(c => favW.has(c.i)).concat(ps.filter(c => favP.has(c.i)));
    const core = ws.filter(c => c.i <= 300).concat(ps.filter(c => c.i <= 300));
    const seen = new Set(fav.map(idOf));
    return fav.concat(core.filter(c => !seen.has(idOf(c))));
  }

  function build(){
    const p = pool();
    if(!p.length) return [];
    const t = today();
    const due = [], fresh = [];
    p.forEach(c => {
      const rec = db[idOf(c)];
      if(!rec) fresh.push(c);
      else if(rec.due <= t) due.push(c);
    });
    due.sort((a,b) => (db[idOf(a)].b - db[idOf(b)].b));
    const need = Math.max(0, 20 - due.length);
    return due.concat(fresh.slice(0, need));
  }

  function boxes(){
    const c = [0,0,0,0,0];
    Object.values(db).forEach(r => { if(r.b >= 1 && r.b <= 5) c[r.b-1]++; });
    return c;
  }

  function renderBoxes(){
    const el = $('prBoxes'); if(!el) return;
    const c = boxes(), t = today();
    const dueNow = Object.values(db).filter(r => r.due <= t).length;
    el.innerHTML = c.map((n, i) => {
      const hot = queue.length && cur && db[idOf(cur)] && db[idOf(cur)].b === i+1;
      return `<div class="pr-box${hot ? ' hot' : ''}"><div class="n">${n}</div>
        <div class="l">Caja ${i+1}</div><div class="d">${GAP[i+1]} día${GAP[i+1] > 1 ? 's' : ''}</div></div>`;
    }).join('');
    const b = $('prDue'); if(b) b.textContent = dueNow;
  }

  function start(){
    queue = build(); doneCount = 0; flipped = false;
    next();
  }
  function next(){
    cur = queue.shift() || null;
    flipped = false;
    render();
  }
  function grade(level){   // 0 = fallé · 1 = casi · 2 = la sé
    if(!cur) return;
    const id = idOf(cur);
    const rec = db[id] || { b:1, due:today() };
    if(level === 0) rec.b = 1;
    else if(level === 1) rec.b = Math.max(1, rec.b);
    else rec.b = Math.min(5, rec.b + 1);
    rec.due = addDays(GAP[rec.b]);
    rec.seen = (rec.seen || 0) + 1;
    rec.ts = Date.now();   // sello por tarjeta: al mezclar equipos gana el repaso más reciente
    db[id] = rec; save();
    doneCount++;
    Streak.ping();
    if(level === 0) queue.push(cur);   // la fallada vuelve al final de esta sesión
    next();
  }

  function render(){
    const st = $('prStage'); if(!st) return;
    renderBoxes();
    if(!cur){
      const p = pool();
      st.innerHTML = `<div class="pr-done">
        <div class="big">${p.length ? '✅' : '☆'}</div>
        <h3>${p.length ? 'Sesión terminada' : 'No hay nada que practicar'}</h3>
        <p>${p.length
          ? (doneCount ? `Repasaste <b>${doneCount}</b> tarjeta${doneCount>1?'s':''}. Las que acertaste vuelven más adelante; las que fallaste, mañana. Vuelve mañana y el sistema sabrá exactamente qué mostrarte.`
                       : 'Todo lo que tenías pendiente ya está al día. Marca palabras o frases con ★ en los módulos 1 y 2 para meter material nuevo.')
          : 'Ve al Módulo 1 o 2 y marca con <b>★</b> lo que quieras practicar. Con la fuente <b>Mezcla</b> también entra automáticamente el núcleo de alta frecuencia.'}</p>
        <button class="btn pri" id="prRestart">${p.length ? '↻ Otra ronda' : '📚 Ir al Módulo 1'}</button></div>`;
      $('prRestart').onclick = () => {
        if(!p.length){ go('p1'); return; }
        start();
      };
      return;
    }
    const front = cfg.dir === 'en2es' ? cur.front : cur.back;
    const back  = cfg.dir === 'en2es' ? cur.back  : cur.front;
    const sayTxt = cur.front;   // el audio SIEMPRE es el inglés
    const rec = db[idOf(cur)];
    st.innerHTML = `
      <div class="card3d">
        <div class="side">${cur.kind === 'w' ? 'palabra' : 'frase'} · ${cfg.dir === 'en2es' ? 'inglés' : 'español'}${rec ? ' · caja ' + rec.b : ' · nueva'}</div>
        <div class="front">${esc(front)}</div>
        ${cfg.dir === 'en2es' ? `<button class="spk lg" data-say="${esc(sayTxt)}">🔊</button>` : ''}
        ${flipped ? `<div class="back">${esc(back)}</div>
          ${cur.extra ? `<div class="extra">${cur.kind === 'p' ? paintMold(cur.extra) : esc(cur.extra)}</div>` : ''}
          ${cfg.dir === 'es2en' ? `<button class="spk lg" data-say="${esc(sayTxt)}">🔊</button>` : ''}`
        : `<div class="hint">Dilo en voz alta antes de girar.</div>`}
      </div>
      ${flipped
        ? `<div class="pr-acts">
             <button class="pr-b no"  data-g="0">✗ Fallé<small>vuelve mañana</small></button>
             <button class="pr-b mid" data-g="1">~ Casi<small>se queda igual</small></button>
             <button class="pr-b yes" data-g="2">✓ Ya la sé<small>sube de caja</small></button>
           </div>`
        : `<button class="pr-show" id="prFlip">Girar tarjeta &nbsp;<span class="kbd">Espacio</span></button>`}
      <div style="text-align:center;margin-top:14px;font-family:var(--fm);font-size:11.5px;color:var(--t3)">
        Quedan ${queue.length} en esta ronda · repasadas ${doneCount}
      </div>`;
    if(!flipped){
      $('prFlip').onclick = () => { flipped = true; render(); };
      if(cfg.dir === 'en2es') TTS.say(sayTxt);
    } else {
      st.querySelectorAll('[data-g]').forEach(b => b.onclick = () => grade(+b.dataset.g));
      if(cfg.dir === 'es2en') TTS.say(sayTxt);
    }
  }

  function key(e){
    if($('pr').classList.contains('on') === false) return;
    if(isTyping(e.target)) return;
    if(!cur) return;
    if(e.code === 'Space'){ e.preventDefault(); if(!flipped){ flipped = true; render(); } return; }
    if(flipped && ['1','2','3'].includes(e.key)){ e.preventDefault(); grade(+e.key - 1); }
  }

  function setCfg(k, v){ cfg[k] = v; start(); }
  function reload(){ db = store.get(KEY, {}); renderBoxes(); }
  /** Olvida el progreso de práctica. Se puede deshacer. */
  function resetAll(){
    db = {}; save(); queue = []; cur = null; doneCount = 0; render();
  }
  return { start, render, renderBoxes, key, setCfg, reload, resetAll,
           get total(){ return Object.keys(db).length; } };
})();

/* ─────────── 11 · CUADERNO ─────────── */
const NB = (() => {
  const KEY = 'eng_nb', TKEY = 'eng_nb_trash';
  let d = store.get(KEY, null);
  if(!d || !Array.isArray(d.books)) d = { books: [], active: null };
  let saveT = null, dirty = false;

  const TPL = [
    { ic:'📖', t:'Vocabulario nuevo', h:'<h2>Palabras de hoy</h2><p>Anota la palabra, qué significa y <b>una frase tuya</b> donde la usarías. La frase propia es lo que la fija.</p><ul><li><br></li></ul>' },
    { ic:'💬', t:'Frases que quiero usar', h:'<h2>Frases para mi próxima conversación</h2><p>Del Módulo 2. Copia la frase, di en voz alta 5 veces, y escribe <b>cuándo la vas a usar</b>.</p><ul><li><br></li></ul>' },
    { ic:'❌', t:'Mis errores', h:'<h2>Errores que cometí</h2><p>El error, la corrección y <b>por qué</b> (qué pieza puse fuera de su casilla). Este cuaderno es el que más rápido te hace mejorar.</p><ul><li><br></li></ul>' },
    { ic:'🎧', t:'Sesión de escucha', h:'<h2>Qué escuché hoy</h2><p><b>Video / pódcast:</b> <br><b>Cuánto entendí:</b> <br><b>3 frases que rescaté:</b></p><ul><li><br></li></ul>' },
    { ic:'❓', t:'Dudas pendientes', h:'<h2>No entendí esto</h2><p>Escribe la duda tal cual te surgió. Cuando la resuelvas, márcala con la etiqueta ✓ APRENDIDO.</p><ul><li><br></li></ul>' },
    { ic:'📅', t:'Diario de práctica', h:'<h2>' + new Date().toLocaleDateString('es-CO', {day:'numeric', month:'long', year:'numeric'}) + '</h2><p><b>Minutos:</b> <br><b>Qué hice:</b> <br><b>Cómo me sentí:</b> <br><b>Mañana:</b> </p>' }
  ];

  const cur = () => d.books.find(b => b.id === d.active) || null;
  const curPage = () => { const b = cur(); return b ? b.pages[b.cur] : null; };
  const pid = () => 'pg' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  /* Toda página necesita id y sello propios: así, si editas la misma libreta
     en dos equipos, se unen PÁGINA POR PÁGINA en vez de pisarse entera. */
  function ensureIds(){
    let changed = false;
    (d.books || []).forEach(b => (b.pages || []).forEach(p => {
      if(!p.id){ p.id = pid(); changed = true; }
      if(!p.u){ p.u = b.updatedAt || new Date().toISOString(); changed = true; }
    }));
    if(changed) store.set(KEY, d);
  }

  function persist(){ store.set(KEY, d); dirty = false; const s = $('nbSaved'); if(s) s.textContent = 'guardado ' + new Date().toLocaleTimeString('es-CO', {hour:'2-digit', minute:'2-digit'}); }
  function commitNow(){
    const b = cur(); if(!b) return;
    const ed = $('nbEd');
    if(ed && b.pages[b.cur]){
      b.pages[b.cur].html = ed.innerHTML;
      b.pages[b.cur].u = new Date().toISOString();
    }
    b.updatedAt = new Date().toISOString();
    persist();
  }
  function reload(){
    d = store.get(KEY, null);
    if(!d || !Array.isArray(d.books)) d = { books: [], active: null };
    ensureIds();
  }
  function autoSave(){
    dirty = true;
    const s = $('nbSaved'); if(s) s.textContent = 'escribiendo…';
    clearTimeout(saveT);
    saveT = setTimeout(commitNow, 700);
  }
  function flush(){ if(dirty){ clearTimeout(saveT); commitNow(); } }
  window.addEventListener('beforeunload', flush);
  document.addEventListener('visibilitychange', () => { if(document.hidden) flush(); });

  function create(title, icon, html){
    const now = new Date().toISOString();
    const b = { id: 'nb' + Date.now() + Math.floor(Math.random()*999), title: title || 'Cuaderno sin título',
      icon: icon || '📓', pages: [{ id:pid(), title:'Página 1', html: html || '', u: now }], cur: 0,
      createdAt: now, updatedAt: now };
    d.books.unshift(b); d.active = b.id; persist(); render();
    toast('Cuaderno creado', 'ok');
  }

  /* ── PAPELERA ──
     Borrar un cuaderno NO lo destruye: lo manda a la papelera con su fecha.
     Esa fecha es también la lápida que hace que el borrado se propague a tus
     otros dispositivos en vez de que el cuaderno reaparezca. */
  const trash = () => store.get(TKEY, []);
  function toTrash(b){
    const t = trash();
    t.unshift({ ...b, deletedAt: new Date().toISOString() });
    store.set(TKEY, t.slice(0, 40));
  }
  function restore(id){
    const t = trash();
    const i = t.findIndex(x => x.id === id);
    if(i < 0) return;
    const b = t[i];
    delete b.deletedAt;
    b.updatedAt = new Date().toISOString();   // más nuevo que la lápida: revive de verdad
    t.splice(i, 1);
    store.set(TKEY, t);
    d.books.unshift(b); d.active = b.id;
    persist(); render();
    toast('«' + b.title + '» restaurado', 'ok');
  }
  function purge(id){
    store.set(TKEY, trash().filter(x => x.id !== id));
    render();
  }

  function renderSide(){
    const list = $('nbList');
    list.innerHTML = d.books.length
      ? d.books.map(b => `<div class="nb-item${b.id === d.active ? ' on' : ''}" data-b="${b.id}">
          <span class="ic">${b.icon}</span><span class="tt">${esc(b.title)}</span><span class="ct">${b.pages.length}p</span></div>`).join('')
      : '<div style="font-size:12.5px;color:var(--t3);padding:6px 2px;line-height:1.6">Aún no tienes cuadernos. Crea uno en blanco o arranca con una plantilla ↓</div>';
    list.onclick = e => {
      const it = e.target.closest('[data-b]'); if(!it) return;
      flush(); d.active = it.dataset.b; persist(); render();
    };
    const tpl = $('nbTpl');
    tpl.innerHTML = TPL.map((t,i) => `<div class="nb-item" data-t="${i}">
      <span class="ic">${t.ic}</span><span class="tt">${esc(t.t)}</span><span class="ct">＋</span></div>`).join('');
    tpl.onclick = e => {
      const it = e.target.closest('[data-t]'); if(!it) return;
      const t = TPL[+it.dataset.t];
      flush(); create(t.t, t.ic, t.h);
    };
    renderTrash();
  }

  function renderTrash(){
    const box = $('nbTrash'); if(!box) return;
    const t = trash();
    $('nbTrashN').textContent = t.length;
    $('nbTrashWrap').style.display = t.length ? 'block' : 'none';
    box.innerHTML = t.map(x => {
      const dias = Math.max(0, 30 - Math.floor((Date.now() - new Date(x.deletedAt)) / 864e5));
      return `<div class="nb-trash-item">
        <span class="ic">${x.icon || '📓'}</span>
        <div class="tt"><b>${esc(x.title)}</b><small>${x.pages ? x.pages.length : 0} pág · se borra sola en ${dias} día${dias===1?'':'s'}</small></div>
        <button class="nbb" data-restore="${x.id}" title="Restaurar este cuaderno">↺</button>
        <button class="nbb danger" data-purge="${x.id}" title="Borrar para siempre">🗑</button>
      </div>`;
    }).join('');
    box.onclick = e => {
      const r = e.target.closest('[data-restore]');
      if(r){ restore(r.dataset.restore); return; }
      const p = e.target.closest('[data-purge]');
      if(p){
        const it = trash().find(x => x.id === p.dataset.purge);
        if(!confirm(`¿Borrar «${it ? it.title : ''}» para siempre?\n\nEsto sí es definitivo: ya no se podrá restaurar ni aquí ni en tus otros dispositivos.`)) return;
        purge(p.dataset.purge);
        toast('Borrado definitivamente', 'warn');
      }
    };
  }

  function render(){
    renderSide();
    const main = $('nbMain'), b = cur();
    if(!b){
      main.innerHTML = `<div class="nb-empty"><div class="e1">📓</div>
        <div style="font-size:16px;font-weight:700;color:var(--t2);margin-bottom:8px">Ningún cuaderno abierto</div>
        <div style="font-size:13.5px;max-width:40ch;margin:0 auto;line-height:1.65">Crea uno en blanco con <b>＋ Cuaderno nuevo</b>, o empieza con una de las plantillas de la izquierda — están pensadas para inglés.</div></div>`;
      return;
    }
    const pg = b.pages[b.cur];
    main.innerHTML = `
      <div class="nb-head">
      <div class="nb-top">
        <button class="nbb" id="nbIcon" title="Cambiar icono">${b.icon}</button>
        <input class="nb-title" id="nbTitle" value="${esc(b.title)}" placeholder="Título del cuaderno">
        <div class="nb-pg">
          <button class="nbb" id="nbPrev" title="Página anterior">‹</button>
          <span id="nbPgN">${b.cur+1} / ${b.pages.length}</span>
          <button class="nbb" id="nbNext" title="Página siguiente">›</button>
          <button class="nbb" id="nbAddPg" title="Nueva página">＋</button>
          <button class="nbb danger" id="nbDelPg" title="Eliminar esta página">✕</button>
        </div>
        <button class="nbb wide" id="nbExport" title="Descargar una copia">⬇ Exportar</button>
        <button class="nbb danger" id="nbDel" title="Enviar cuaderno a la papelera">🗑</button>
      </div>
      <div class="nb-tools">
        <button class="nbb" data-cmd="bold" title="Negrita (Ctrl+B)"><b>B</b></button>
        <button class="nbb" data-cmd="italic" title="Cursiva"><i>I</i></button>
        <button class="nbb" data-blk="h1" title="Título grande">H1</button>
        <button class="nbb" data-blk="h2" title="Título mediano">H2</button>
        <button class="nbb" data-blk="p" title="Texto normal">¶</button>
        <span class="nb-sep"></span>
        <button class="nbb" data-cmd="insertUnorderedList" title="Lista con viñetas">•</button>
        <button class="nbb" data-cmd="insertOrderedList" title="Lista numerada">1.</button>
        <button class="nbb" data-ins="hr" title="Línea separadora">—</button>
        <button class="nbb" data-ins="chk" title="Casilla marcable">☐</button>
        <span class="nb-sep"></span>
        <button class="nbb" data-mark="y" title="Resaltar amarillo" style="background:#fde047;color:#000">A</button>
        <button class="nbb" data-mark="g" title="Resaltar verde" style="background:#86efac;color:#000">A</button>
        <button class="nbb" data-mark="p" title="Resaltar rosa" style="background:#f9a8d4;color:#000">A</button>
        <span class="nb-sep"></span>
        <button class="nbb" data-fz="-1" title="Achicar el texto seleccionado">A−</button>
        <button class="nbb" data-fz="1" title="Agrandar el texto seleccionado">A+</button>
        <select class="nb-size" id="nbSize" title="Tamaño de la letra de toda la hoja">
          ${[['xs','Muy pequeña'],['s','Pequeña'],['m','Normal'],['l','Grande'],['xl','Muy grande'],['xxl','Enorme']]
            .map(([v,n]) => `<option value="${v}"${(pg.size||'m') === v ? ' selected' : ''}>${n}</option>`).join('')}
        </select>
        <span class="nb-sep"></span>
        <button class="nbb wide stk" data-stk="ok" title="Pegatina APRENDIDO · se arrastra a donde quieras">✓ Aprendido</button>
        <button class="nbb wide stk" data-stk="rev" title="Pegatina REPASAR · se arrastra a donde quieras">↻ Repasar</button>
        <button class="nbb wide stk" data-stk="err" title="Pegatina ERROR MÍO · se arrastra a donde quieras">✗ Error</button>
        <button class="nbb wide" id="nbEmoji" title="Pegatinas y emojis">😀 Pegatinas</button>
        <span class="nb-sep"></span>
        <button class="nbb wide" data-ins="encard" style="color:var(--ac2)" title="Insertar tarjeta inglés/español con audio">🎴 Tarjeta EN/ES</button>
        <button class="nbb wide" id="nbSpeak" style="color:var(--ac2)" title="Leer en inglés lo que tengas seleccionado">🔊 Leer selección</button>
        <span class="nb-sep"></span>
        <button class="nbb" data-cmd="removeFormat" title="Quitar formato">✕</button>
      </div>
      </div>
      <div class="nb-hoja s-${pg.size || 'm'}" id="nbHoja">
        <div class="nb-ed" id="nbEd" contenteditable="true" spellcheck="false"
             data-ph="Escribe aquí. Selecciona texto en inglés y pulsa 🔊 Leer selección para escucharlo.">${pg.html || ''}</div>
        <div class="nb-stk" id="nbStk"></div>
      </div>
      <div class="nb-stat">
        <span>Página <b>${b.cur+1}</b> de ${b.pages.length} · <span id="nbWords">0</span> palabras</span>
        <span class="sv" id="nbSaved">guardado</span>
      </div>`;
    wire(b);
  }

  function wire(b){
    const ed = $('nbEd');
    $('nbTitle').oninput = e => { b.title = e.target.value; autoSave(); renderSide(); };
    $('nbIcon').onclick = () => {
      const ics = ['📓','📔','📕','📗','📘','📙','🗒️','📝','🎧','💬','❌','⭐','🧠','🎯'];
      b.icon = ics[(ics.indexOf(b.icon) + 1) % ics.length];
      $('nbIcon').textContent = b.icon; autoSave(); renderSide();
    };
    $('nbPrev').onclick = () => { if(b.cur > 0){ commitNow(); b.cur--; persist(); render(); } };
    $('nbNext').onclick = () => { if(b.cur < b.pages.length-1){ commitNow(); b.cur++; persist(); render(); } };
    $('nbAddPg').onclick = () => {
      commitNow();
      b.pages.push({ id:pid(), title:'Página ' + (b.pages.length+1), html:'', u:new Date().toISOString() });
      b.cur = b.pages.length - 1; persist(); render(); toast('Página nueva', 'ok');
    };
    $('nbDelPg').onclick = () => {
      if(b.pages.length === 1) return toast('Es la única página. Elimina el cuaderno si quieres deshacerte de él.', 'warn');
      const n = b.cur + 1;
      doUndoable('Eliminar página ' + n, [KEY], () => {
        commitNow();
        b.pages.splice(b.cur, 1);
        b.cur = Math.max(0, b.cur - 1);
        b.updatedAt = new Date().toISOString();
        persist(); render();
      }, 'Página ' + n + ' eliminada');
    };
    $('nbDel').onclick = () => {
      doUndoable('Eliminar «' + b.title + '»', [KEY, TKEY], () => {
        commitNow();
        toTrash(b);
        d.books = d.books.filter(x => x.id !== b.id);
        d.active = d.books.length ? d.books[0].id : null;
        persist(); render();
      }, '«' + b.title + '» fue a la papelera');
    };
    $('nbExport').onclick = () => exportBook(b);
    $('nbSpeak').onclick = () => {
      const t = String(window.getSelection()).trim();
      if(!t) return toast('Selecciona primero el texto que quieres oír', 'warn');
      TTS.say(t);
    };

    // Barra de herramientas
    document.querySelectorAll('.nb-tools [data-cmd]').forEach(btn => btn.onmousedown = e => {
      e.preventDefault(); ed.focus();
      try { document.execCommand(btn.dataset.cmd, false, null); } catch(err){}
      autoSave();
    });
    document.querySelectorAll('.nb-tools [data-blk]').forEach(btn => btn.onmousedown = e => {
      e.preventDefault(); ed.focus();
      try { document.execCommand('formatBlock', false, btn.dataset.blk); } catch(err){}
      autoSave();
    });
    document.querySelectorAll('.nb-tools [data-mark]').forEach(btn => btn.onmousedown = e => {
      e.preventDefault(); ed.focus();
      const sel = window.getSelection();
      if(!sel.rangeCount || sel.isCollapsed) { toast('Selecciona el texto que quieres resaltar', 'warn'); return; }
      const r = sel.getRangeAt(0);
      const mk = document.createElement('mark');
      mk.className = btn.dataset.mark;
      try { mk.appendChild(r.extractContents()); r.insertNode(mk); } catch(err){}
      sel.removeAllRanges(); autoSave();
    });
    /* ── Tamaño de la letra de la hoja ──
       Se guarda EN LA PÁGINA, no en un ajuste global: una hoja de vocabulario
       para la niña puede querer letra enorme y otra de apuntes letra pequeña. */
    const selSize = $('nbSize');
    if(selSize) selSize.onchange = () => {
      const pg = b.pages[b.cur];
      pg.size = selSize.value;
      const hoja = $('nbHoja');
      if(hoja) hoja.className = 'nb-hoja s-' + pg.size;
      autoSave();
    };

    /* ── Tamaño de un trozo suelto ──
       El selector de arriba cambia la hoja entera; esto cambia SOLO lo que
       tengas seleccionado, y se guarda con el texto. Va en `em`, así que
       además sigue respetando el tamaño general de la hoja. */
    const FZ = { 1:'.6', 2:'.72', 3:'.85', 4:'1', 5:'1.25', 6:'1.6', 7:'2.1' };
    const pintaFz = el => { el.style.fontSize = (FZ[el.dataset.n] || '1') + 'em'; };
    document.querySelectorAll('.nb-tools [data-fz]').forEach(btn => btn.onmousedown = e => {
      e.preventDefault(); ed.focus();
      const sel = window.getSelection();
      if(!sel.rangeCount || sel.isCollapsed){
        toast('Selecciona antes el texto que quieres agrandar o achicar', 'warn'); return;
      }
      const paso = +btn.dataset.fz;
      const r = sel.getRangeAt(0);
      const cont = r.startContainer.nodeType === 3 ? r.startContainer.parentElement : r.startContainer;
      const ya = cont && cont.closest ? cont.closest('.fz') : null;
      // Si ya tenía tamaño y es justo ese trozo, se sube o baja un escalón
      if(ya && ya.textContent === r.toString()){
        ya.dataset.n = Math.max(1, Math.min(7, (+ya.dataset.n || 4) + paso));
        pintaFz(ya);
      } else {
        const sp = document.createElement('span');
        sp.className = 'fz';
        sp.dataset.n = Math.max(1, Math.min(7, 4 + paso));
        pintaFz(sp);
        try { sp.appendChild(r.extractContents()); r.insertNode(sp); } catch(err){}
      }
      sel.removeAllRanges(); autoSave();
    });

    /* ── Pegatinas ──
       Las tres etiquetas dejan de ser texto dentro del párrafo y pasan a ser
       pegatinas que se sueltan donde uno quiera, como en un cuaderno de papel.
       Se guardan en la página, con la posición en PORCENTAJE para que no se
       descoloquen al cambiar el ancho de la ventana. */
    document.querySelectorAll('.nb-tools [data-stk]').forEach(btn => btn.onmousedown = e => {
      e.preventDefault();
      ponerPegatina(b, btn.dataset.stk);
    });
    const btnEmo = $('nbEmoji');
    if(btnEmo) btnEmo.onclick = () => paletaEmojis(b, btnEmo);
    pintarPegatinas(b);
    document.querySelectorAll('.nb-tools [data-ins]').forEach(btn => btn.onmousedown = e => {
      e.preventDefault(); ed.focus();
      const k = btn.dataset.ins;
      if(k === 'hr') insertHTML('<hr><br>');
      // OJO: <div> dentro de <p> lo desenvuelve el navegador y la casilla deja de
      // ser clicable. Con <span display:block> sobrevive a insertHTML.
      if(k === 'chk') insertHTML('<span class="chk"><b class="cb" contenteditable="false">☐</b> Escribe la tarea aquí</span><br>');
      if(k === 'encard') insertHTML(
        '<div class="encard"><button class="spk sm encard-say" contenteditable="false" title="Oír en inglés">🔊</button><button class="encard-del" contenteditable="false" title="Eliminar esta tarjeta">✕</button>' +
        '<div class="cc"><div class="ce">Escribe la frase en inglés</div><div class="cs">y aquí su significado</div></div></div><br>');
      autoSave();
    });

    /* ── El color no se pega ──
       Al pulsar Enter con el cursor dentro de un resaltado, el navegador
       CLONA el <mark> en la línea nueva y todo lo que escribes después sale
       resaltado. Aquí se corta: si el cursor está dentro de una marca, la
       línea nueva se crea FUERA de ella. Y después de cualquier cambio se
       barren las marcas que quedaron vacías, que son las que reenganchan
       el color sin que se vea nada. */
    function marcaDelCursor(){
      const sel = window.getSelection();
      if(!sel.rangeCount) return null;
      const n = sel.getRangeAt(0).startContainer;
      const el = n.nodeType === 3 ? n.parentElement : n;
      return el && el.closest ? el.closest('mark') : null;
    }
    function limpiarMarcasVacias(){
      ed.querySelectorAll('mark').forEach(m => {
        if(!m.textContent.replace(/​/g, '').trim()){
          const p = m.parentNode; if(!p) return;
          while(m.firstChild) p.insertBefore(m.firstChild, m);
          m.remove();
        }
      });
    }
    ed.addEventListener('keydown', e => {
      if(e.key !== 'Enter' || e.shiftKey) return;
      const mk = marcaDelCursor();
      if(!mk) return;
      e.preventDefault();
      /* Se parte el PÁRRAFO por donde está el cursor —como haría un Enter
         normal— y lo que baja se saca de la marca, que es lo que el navegador
         no hace. Cortar solo hasta el final del <mark> dejaría arriba el resto
         de la línea. */
      const sel = window.getSelection();
      const r = sel.getRangeAt(0);
      const bloque = mk.closest('p,li,h1,h2,div') || mk;
      const resto = r.cloneRange();
      resto.setEnd(bloque, bloque.childNodes.length);
      const cola = resto.extractContents();
      // Quitarle el resaltado a lo que baja
      cola.querySelectorAll && cola.querySelectorAll('mark').forEach(m => {
        while(m.firstChild) m.parentNode.insertBefore(m.firstChild, m);
        m.remove();
      });
      const p = document.createElement('p');
      if(cola.textContent.trim()) p.appendChild(cola); else p.appendChild(document.createElement('br'));
      bloque.parentNode.insertBefore(p, bloque.nextSibling);
      limpiarMarcasVacias();
      const nr = document.createRange();
      nr.setStart(p, 0); nr.collapse(true);
      sel.removeAllRanges(); sel.addRange(nr);
      autoSave(); countWords();
    });

    ed.oninput = () => { limpiarMarcasVacias(); autoSave(); countWords(); };
    ed.onblur = flush;
    // Pegar siempre en texto plano: evita traer estilos de fuera que rompen el diseño
    ed.onpaste = e => {
      e.preventDefault();
      const t = (e.clipboardData || window.clipboardData).getData('text/plain');
      insertHTML(esc(t).replace(/\n/g, '<br>'));
      autoSave();
    };
    ed.onclick = e => {
      const cb = e.target.closest('.cb');
      if(cb){
        const c = cb.closest('.chk');
        const done = c.classList.toggle('done');
        cb.textContent = done ? '☑' : '☐';
        autoSave();
      }
      const s = e.target.closest('.encard-say');
      if(s){
        const card = s.closest('.encard');
        const txt = card && card.querySelector('.ce') ? card.querySelector('.ce').textContent : '';
        TTS.say(txt, s);
        return;
      }
      // Borrar una tarjeta suelta sin tocar el resto de la página
      const x = e.target.closest('.encard-del');
      if(x){
        const card = x.closest('.encard');
        const txt = card.querySelector('.ce') ? card.querySelector('.ce').textContent : 'la tarjeta';
        doUndoable('Eliminar tarjeta', [KEY], () => {
          card.remove(); commitNow(); countWords();
        }, 'Tarjeta «' + txt.slice(0, 24) + '» eliminada');
      }
    };
    countWords();
  }

  function insertHTML(html){
    try { document.execCommand('insertHTML', false, html); } catch(e){}
  }

  /* ══════════════ PEGATINAS DE LA HOJA ══════════════
     Modelo: pg.stk = [{ id, t, x, y }] · t = 'ok'|'rev'|'err' o un emoji.
     x/y en % del alto y ancho de la hoja, para que aguanten el cambio de
     tamaño de la ventana. Es un campo nuevo: las páginas que no lo tengan
     siguen funcionando igual. */
  const STK = { ok:['✓ APRENDIDO','stk-ok'], rev:['↻ REPASAR','stk-rev'], err:['✗ ERROR MÍO','stk-err'] };

  function pegatinasDe(pg){ if(!Array.isArray(pg.stk)) pg.stk = []; return pg.stk; }

  function ponerPegatina(b, t){
    const pg = b.pages[b.cur];
    const l = pegatinasDe(pg);
    // Escalonadas para que no caigan una encima de otra
    const n = l.length;
    l.push({ id: pid(), t, x: 8 + (n % 5) * 7, y: 6 + (n % 7) * 6 });
    autoSave(); pintarPegatinas(b);
    toast('Pegatina puesta · arrástrala donde quieras', 'ok');
  }

  function pintarPegatinas(b){
    const capa = $('nbStk'); if(!capa) return;
    const pg = b.pages[b.cur];
    const l = pegatinasDe(pg);
    capa.innerHTML = l.map(s => {
      const par = STK[s.t];
      // Tres formas posibles: etiqueta, pegatina dibujada, o un emoji suelto
      // de los que se guardaron antes de que existieran las propias.
      const cuerpo = par ? par[0] : (PEGA[s.t] ? svgPega(s.t) : esc(s.t));
      const clase  = par ? par[1] : (PEGA[s.t] ? 'stk-pg' : 'stk-emo');
      return `<div class="stk-i ${clase}" data-id="${s.id}"
                   style="left:${s.x}%;top:${s.y}%">${cuerpo}<button class="stk-x" title="Quitar">✕</button></div>`;
    }).join('');
    capa.querySelectorAll('.stk-i').forEach(el => arrastrar(el, b));
  }

  /* Arrastrar con puntero: funciona igual con ratón y con el dedo. */
  function arrastrar(el, b){
    el.querySelector('.stk-x').onclick = ev => {
      ev.stopPropagation();
      const pg = b.pages[b.cur];
      pg.stk = pegatinasDe(pg).filter(s => s.id !== el.dataset.id);
      autoSave(); pintarPegatinas(b);
    };
    el.onpointerdown = ev => {
      if(ev.target.closest('.stk-x')) return;
      ev.preventDefault();
      const capa = $('nbStk'), caja = capa.getBoundingClientRect();
      const dx = ev.clientX - el.getBoundingClientRect().left;
      const dy = ev.clientY - el.getBoundingClientRect().top;
      el.classList.add('arrastrando');
      el.setPointerCapture(ev.pointerId);
      const mover = m => {
        const x = ((m.clientX - dx - caja.left) / caja.width) * 100;
        const y = ((m.clientY - dy - caja.top) / caja.height) * 100;
        el.style.left = Math.max(0, Math.min(94, x)) + '%';
        el.style.top  = Math.max(0, Math.min(97, y)) + '%';
      };
      const soltar = () => {
        el.classList.remove('arrastrando');
        el.onpointermove = null; el.onpointerup = null;
        const pg = b.pages[b.cur];
        const s = pegatinasDe(pg).find(x => x.id === el.dataset.id);
        if(s){ s.x = parseFloat(el.style.left); s.y = parseFloat(el.style.top); autoSave(); }
      };
      el.onpointermove = mover; el.onpointerup = soltar;
    };
  }

  /* ══════════ PEGATINAS PROPIAS ══════════
     Dibujadas aquí, no son emojis del sistema. Mismo lenguaje que los que
     todo el mundo reconoce —estrella, fuego, corazón— pero con forma propia y
     acabado de cristal de neón: relleno translúcido, contorno fino luminoso y
     un brillo suave. Nada de flúor: el color saturado se queda en el contorno
     y el relleno no pasa del 22% de opacidad, para que se lean encima de la
     hoja sin tapar el texto que hay debajo. Todas sobre rejilla de 24×24. */
  const PEGA = {
    estrella:{ c:'#a78bfa', n:'Estrella', d:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>' },
    corazon: { c:'#fb7185', n:'Corazon',  d:'<path d="M12 20.5S3.5 15 3.5 9.2A4.7 4.7 0 0 1 12 6.6a4.7 4.7 0 0 1 8.5 2.6c0 5.8-8.5 11.3-8.5 11.3z"/>' },
    fuego:   { c:'#fb923c', n:'Fuego',    d:'<path d="M12 2.5c3.2 3.3 5.5 6 5.5 9.3a5.5 5.5 0 1 1-11 0c0-1.6.6-3 1.7-4.4.3 1 .9 1.8 1.8 2.2.2-3 .8-5.3 2-7.1z"/>' },
    rayo:    { c:'#fbbf24', n:'Rayo',     d:'<path d="M13.5 2L5 13h5l-1.5 9L19 10h-5.5z"/>' },
    hecho:   { c:'#4ade80', n:'Hecho',    d:'<circle cx="12" cy="12" r="8.6"/><path d="M7.9 12.4l2.9 2.9 5.3-6" fill="none"/>' },
    fallo:   { c:'#f87171', n:'Fallo',    d:'<circle cx="12" cy="12" r="8.6"/><path d="M9 9l6 6M15 9l-6 6" fill="none"/>' },
    duda:    { c:'#38bdf8', n:'Duda',     d:'<circle cx="12" cy="12" r="8.6"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.4c-.7.3-1 .8-1 1.5v.4" fill="none"/><circle cx="12" cy="16.2" r="1"/>' },
    idea:    { c:'#facc15', n:'Idea',     d:'<path d="M12 3a5.4 5.4 0 0 0-3.1 9.8c.5.4.7 1 .7 1.6v.5h4.8v-.5c0-.6.2-1.2.7-1.6A5.4 5.4 0 0 0 12 3z"/><path d="M9.9 18h4.2M10.6 20.4h2.8" fill="none"/>' },
    diana:   { c:'#f472b6', n:'Diana',    d:'<circle cx="12" cy="12" r="8.6" fill="none"/><circle cx="12" cy="12" r="5.2" fill="none"/><circle cx="12" cy="12" r="2"/>' },
    reloj:   { c:'#22d3ee', n:'Tiempo',   d:'<circle cx="12" cy="12" r="8.6"/><path d="M12 6.9v5.4l3.4 2" fill="none"/>' },
    chip:    { c:'#a78bfa', n:'Memoria',  d:'<rect x="6.5" y="6.5" width="11" height="11" rx="2.6"/><path d="M10 3.4v3M14 3.4v3M10 17.6v3M14 17.6v3M3.4 10h3M3.4 14h3M17.6 10h3M17.6 14h3" fill="none"/>' },
    ojo:     { c:'#38bdf8', n:'Fijate',   d:'<path d="M2.6 12S6.2 6.2 12 6.2 21.4 12 21.4 12 17.8 17.8 12 17.8 2.6 12 2.6 12z"/><circle cx="12" cy="12" r="2.7"/>' },
    onda:    { c:'#2dd4bf', n:'Escucha',  d:'<path d="M5 10v4M8.5 7.5v9M12 5v14M15.5 8v8M19 10.5v3" fill="none"/>' },
    burbuja: { c:'#c084fc', n:'Dilo',     d:'<path d="M4 5.4h16a1.6 1.6 0 0 1 1.6 1.6v7.6A1.6 1.6 0 0 1 20 16.2h-7.4L8 20.4v-4.2H4A1.6 1.6 0 0 1 2.4 14.6V7A1.6 1.6 0 0 1 4 5.4z"/>' },
    libro:   { c:'#60a5fa', n:'Estudia',  d:'<path d="M3.6 4.6h5.6a2.8 2.8 0 0 1 2.8 1.8 2.8 2.8 0 0 1 2.8-1.8h5.6v13.4h-5.6a2.8 2.8 0 0 0-2.8 1.8 2.8 2.8 0 0 0-2.8-1.8H3.6z"/><path d="M12 6.4v13.4" fill="none"/>' },
    trofeo:  { c:'#fbbf24', n:'Logro',    d:'<path d="M7.5 3.6h9v5a4.5 4.5 0 0 1-9 0z"/><path d="M7.5 5.4H4.8v1.4a3 3 0 0 0 2.7 3M16.5 5.4h2.7v1.4a3 3 0 0 1-2.7 3" fill="none"/><path d="M12 13.4v3.4M8.6 20.4h6.8" fill="none"/>' },
    cohete:  { c:'#f472b6', n:'Despega',  d:'<path d="M12 2.6c3 2.5 4.6 5.7 4.6 9.3l-1.7 3.4H9.1L7.4 11.9c0-3.6 1.6-6.8 4.6-9.3z"/><path d="M9.1 15.3L6.4 18l1.6.3.4 1.7zM14.9 15.3L17.6 18l-1.6.3-.4 1.7z"/><circle cx="12" cy="9.6" r="1.9" fill="none"/>' },
    luna:    { c:'#818cf8', n:'Repaso',   d:'<path d="M15.6 3.2A9 9 0 1 0 20.8 14 7.3 7.3 0 0 1 15.6 3.2z"/>' },
    gema:    { c:'#22d3ee', n:'Joya',     d:'<path d="M7.2 3.6h9.6l4 5.6L12 20.4 3.2 9.2z"/><path d="M3.2 9.2h17.6M7.2 3.6L12 20.4 16.8 3.6" fill="none"/>' },
    corona:  { c:'#facc15', n:'Corona',   d:'<path d="M3.4 8.4l4 3.2L12 5l4.6 6.6 4-3.2-1.8 10H5.2z"/>' }
  };
  const svgPega = k => {
    const s = PEGA[k]; if(!s) return '';
    return '<svg viewBox="0 0 24 24" class="pg-svg" style="color:' + s.c + '">' + s.d + '</svg>';
  };

  function paletaEmojis(b, ancla){
    document.querySelectorAll('.emo-pop').forEach(x => x.remove());
    const pop = document.createElement('div');
    pop.className = 'emo-pop';
    pop.innerHTML = '<div class="emo-t">Pegatinas · toca una y luego arrástrala por la hoja</div>' +
      '<div class="emo-g">' + Object.keys(PEGA).map(k =>
        `<button class="emo-b" data-pg="${k}" title="${esc(PEGA[k].n)}">${svgPega(k)}</button>`).join('') + '</div>';
    document.body.appendChild(pop);
    const r = ancla.getBoundingClientRect();
    pop.style.left = Math.max(10, Math.min(r.left, window.innerWidth - 340)) + 'px';
    pop.style.top  = (r.bottom + window.scrollY + 6) + 'px';
    pop.querySelectorAll('.emo-b').forEach(bt => bt.onclick = () => {
      ponerPegatina(b, bt.dataset.pg);
      pop.remove();
    });
    const fuera = ev => { if(!ev.target.closest('.emo-pop') && ev.target !== ancla){ pop.remove(); document.removeEventListener('click', fuera); } };
    setTimeout(() => document.addEventListener('click', fuera), 0);
  }
  function countWords(){
    const ed = $('nbEd'), el = $('nbWords');
    if(!ed || !el) return;
    const t = ed.innerText.trim();
    el.textContent = t ? t.split(/\s+/).length : 0;
  }

  function exportBook(b){
    const pages = b.pages.map((p, i) =>
      `<section><h1>${esc(b.title)} · página ${i+1}</h1>${p.html || '<p><i>(vacía)</i></p>'}</section><hr>`).join('\n');
    const doc = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<title>${esc(b.title)} · English Engine</title>
<style>body{font-family:system-ui,-apple-system,'Segoe UI',sans-serif;max-width:820px;margin:40px auto;padding:0 22px;line-height:1.7;color:#18181b}
h1{font-size:22px;border-bottom:2px solid #8b5cf6;padding-bottom:7px;margin-top:38px}
mark.y{background:#fde047}mark.g{background:#86efac}mark.p{background:#f9a8d4}
.tg{font-size:11px;font-weight:700;padding:2px 8px;border-radius:5px;background:#eee}
.encard{border-left:3px solid #8b5cf6;background:#f6f5ff;padding:10px 15px;margin:12px 0;border-radius:8px}
.encard .ce{font-weight:700}.encard .cs{color:#666;font-size:14px}
.encard .spk{display:none}.chk{margin:4px 0}.chk.done{text-decoration:line-through;opacity:.55}
hr{border:none;border-top:1px solid #ddd;margin:30px 0}
footer{margin-top:46px;color:#888;font-size:12px;border-top:1px solid #ddd;padding-top:14px}</style></head>
<body>${pages}
<footer>Exportado desde ENGLISH ENGINE · DA-2026 · ${new Date().toLocaleString('es-CO')}</footer></body></html>`;
    try {
      const blob = new Blob([doc], { type:'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = b.title.replace(/[^\w\sÁÉÍÓÚáéíóúÑñ-]/g, '').trim().replace(/\s+/g, '-') + '.html';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      toast('Copia descargada', 'ok');
    } catch(e){
      toast('El navegador bloqueó la descarga', 'warn');
    }
  }

  // Enviar una palabra o frase del documento al cuaderno abierto
  function push(en, es){
    // Guardar en el cuaderno también se puede deshacer
    UNDO.record('Guardar «' + en + '» en el cuaderno', [KEY]);
    let b = cur();
    if(!b){ create('Vocabulario nuevo', '📖', ''); b = cur(); }
    const pg = b.pages[b.cur];
    pg.html = (pg.html || '') +
      `<div class="encard"><button class="spk sm encard-say" contenteditable="false" title="Oír en inglés">🔊</button><button class="encard-del" contenteditable="false" title="Eliminar esta tarjeta">✕</button>` +
      `<div class="cc"><div class="ce">${esc(en)}</div><div class="cs">${esc(es)}</div></div></div>`;
    persist();
    if($('nb').classList.contains('on')) render();
    toast('Guardado en «' + b.title + '»', 'ok', { label:'↶ Deshacer', fn: () => {
      const e = UNDO.undo();
      if(e){ refreshAll(); toast('Deshecho: ' + e.label, 'warn'); }
    }});
  }

  function newBlank(){ flush(); create('Cuaderno sin título', '📓', ''); }

  return { render, push, flush, newBlank, reload, restore, renderTrash,
           get count(){ return d.books.length; }, get trashCount(){ return trash().length; } };
})();

/* ─────────── 12 · BUSCADOR GLOBAL (Ctrl+K) ─────────── */
const Omni = (() => {
  let idx = null, sel = 0, res = [];
  function build(){
    if(idx) return idx;
    idx = [];
    WORDS.forEach(w => idx.push({ k:'palabra', t:w.en, s:w.es, key:w.k, go:['p1', w.en], say:w.en }));
    PHRASES.forEach(p => idx.push({ k:'frase', t:p.en, s:p.es, key:p.k, go:['p2', p.en], say:p.en }));
    /* Las expresiones compuestas. Sin esto, buscar «give up» en Ctrl+K no daba
       nada aunque estuviera en el documento con su significado y su ejemplo:
       el diccionario nuevo solo lo veia la seccion de videos. */
    if(typeof EXPR !== 'undefined') EXPR.LISTA.forEach(e => idx.push({
      k:'expresión', t:e.en, s:e.es,
      key:norm(e.en + ' ' + e.es + ' ' + (e.use || '') + ' ' + (e.xe || '')),
      dic:e.en, say:e.en }));
    if(typeof BIFUR !== 'undefined') BIFUR.forEach((b, n) => {
      idx.push({ k:'bifurcación', t:b.q + '  →  ' + b.r.map(x => x.w).join(' · '),
                 s:'una palabra tuya, varias suyas', key:norm(b.q + ' ' + b.r.map(x => x.w).join(' ')),
                 bf:n });
    });
    document.querySelectorAll('#pz .pz').forEach(el => {
      const t = el.querySelector('.pz-t').textContent.trim();
      const s = el.querySelector('.pz-s').textContent.trim();
      idx.push({ k:'pieza', t, s, key:norm(t+' '+s), el });
    });
    document.querySelectorAll('#p3 h2.sec, #p0 h2.sec').forEach(el => {
      const t = el.textContent.replace(/^\d+\s*/, '').trim();
      idx.push({ k:'sección', t, s:el.closest('.pane').id === 'p3' ? 'Módulo 3 · Método' : 'Estructura', key:norm(t), el });
    });
    return idx;
  }
  function open(){
    build();
    $('omni').classList.add('on');
    const i = $('omniIn'); i.value = ''; i.focus();
    res = []; sel = 0; paint();
  }
  function close(){ $('omni').classList.remove('on'); }
  function search(q){
    const n = norm(q.trim());
    if(!n){ res = []; sel = 0; return paint(); }
    const starts = [], has = [];
    for(const it of build()){
      const p = it.key.indexOf(n);
      if(p === 0) starts.push(it);
      else if(p > 0) has.push(it);
      if(starts.length > 40) break;
    }
    res = starts.concat(has).slice(0, 40);
    sel = 0; paint();
  }
  function paint(){
    const box = $('omniRes');
    if(!res.length){
      box.innerHTML = `<div style="padding:22px;color:var(--t3);font-size:13.5px;text-align:center">
        ${$('omniIn').value.trim() ? 'Nada coincide con eso.' : 'Escribe para buscar en las 4000 palabras, las expresiones, las 1000 frases, las piezas y el método.'}</div>`;
      return;
    }
    box.innerHTML = res.map((r, i) =>
      `<div class="omni-r${i === sel ? ' sel' : ''}" data-i="${i}"><span class="k">${r.k}</span>
       <span class="t">${esc(r.t)}</span><span class="s">${esc(r.s)}</span></div>`).join('');
    box.querySelectorAll('.omni-r').forEach(el => el.onclick = () => pick(+el.dataset.i));
    const cur = box.querySelector('.sel'); if(cur) cur.scrollIntoView({ block:'nearest' });
  }
  function pick(i){
    const r = res[i]; if(!r) return;
    close();
    if(r.go){
      const [pane, term] = r.go;
      go(pane);
      const inp = pane === 'p1' ? $('q1') : $('q2');
      inp.value = term;
      inp.dispatchEvent(new Event('input'));
      if(r.say) setTimeout(() => TTS.say(r.say), 120);
    } else if(r.dic){
      // La ficha del diccionario ya sabe pintar una expresion, con su
      // significado y los cuatro diccionarios de fuera si hiciera falta.
      setTimeout(() => { try { DIC.abrir(r.dic, innerWidth / 2, 140); } catch(e){} }, 90);
      if(r.say) setTimeout(() => TTS.say(r.say), 220);
    } else if(r.bf !== undefined){
      go('bf');
      setTimeout(() => {
        const p = document.querySelector(`#bfNav .bf-pill[data-f="${r.bf}"]`);
        if(p) p.click();
      }, 120);
    } else if(r.el){
      go(r.el.closest('.pane').id);
      setTimeout(() => {
        if(r.el.tagName === 'DETAILS') r.el.open = true;
        r.el.scrollIntoView({ behavior:'smooth', block:'center' });
      }, 90);
    }
  }
  function key(e){
    if(!$('omni').classList.contains('on')) return;
    if(e.key === 'Escape'){ close(); return; }
    if(e.key === 'ArrowDown'){ e.preventDefault(); sel = Math.min(sel+1, res.length-1); paint(); }
    if(e.key === 'ArrowUp'){ e.preventDefault(); sel = Math.max(sel-1, 0); paint(); }
    if(e.key === 'Enter'){ e.preventDefault(); pick(sel); }
  }
  return { open, close, search, key };
})();

/* ─────────── 13 · NAVEGACIÓN ─────────── */
function go(paneId){
  const tab = document.querySelector(`.tab[data-p="${paneId}"]`);
  if(tab) tab.click();
}


/* ══════════════════════════════════════════════════════════════
   GLOSARIO EMERGENTE
   Ninguna palabra técnica se queda sin explicar. Cualquier término
   marcado con <b class="gl" data-glo="clave">…</b> abre una ficha con
   su significado en palabras simples, un ejemplo y audio.
   Regla: si aparece una palabra de gramática, TIENE que estar aquí.
════════════════════════════════════════════════════════════════ */
const GLOSARIO = {
  sujeto:      { t:'Sujeto', d:'Quién hace la acción. Es la primera casilla de la frase y en inglés <b>no se puede quitar nunca</b>.', e:'<b>I</b> work · <b>She</b> works · <b>It</b> rains', s:'I work. She works. It rains.' },
  verbo:       { t:'Verbo', d:'La acción o el estado: correr, comer, ser, tener. Sin verbo no hay frase.', e:'I <b>work</b> · I <b>am</b> tired', s:'I work. I am tired.' },
  complemento: { t:'Complemento', d:'Todo lo que completa la frase: qué, dónde, cuándo, cómo. Se puede quitar y la frase sigue de pie.', e:'I work <b>at a bank</b>', s:'I work at a bank.' },
  auxiliar:    { t:'Auxiliar', d:'Un verbo que <b>ayuda</b> a otro. No significa nada por sí solo: solo marca el tiempo, o permite negar y preguntar. Son <b>do, does, did, am, is, are, was, were, have, has, had, will</b>.', e:'I <b>don\'t</b> work · <b>Do</b> you work? · I <b>am</b> working', s:"I don't work. Do you work? I am working." },
  modal:       { t:'Modal', d:'Una palabra que cambia el <b>tono</b> de la acción: si puedes, si debes, si quizá. Son solo diez: can, could, will, would, shall, should, may, might, must, ought to.', e:'I <b>can</b> swim · You <b>should</b> rest', s:'I can swim. You should rest.' },
  infinitivo:  { t:'Infinitivo', d:'El verbo en su forma base, sin cambiar nada. En español termina en -ar, -er, -ir (<i>trabajar</i>). En inglés es el verbo desnudo, a veces con <b>to</b> delante.', e:'to <b>work</b> · to <b>eat</b> · I need <b>to go</b>', s:'to work, to eat. I need to go.' },
  desnudo:     { t:'Verbo desnudo', d:'El verbo <b>sin nada</b>: sin -s, sin -ing, sin -ed y sin <i>to</i>. Es la forma que va después de un auxiliar o un modal.', e:'I don\'t <b>work</b> · I can <b>swim</b>', s:"I don't work. I can swim." },
  participio:  { t:'Participio', d:'La tercera forma del verbo, la que va después de <b>have</b>. En español sería <i>trabaj<b>ado</b></i>, <i>com<b>ido</b></i>. En inglés suele terminar en -ed, pero los irregulares cambian.', e:'work → work<b>ed</b> · eat → <b>eaten</b> · go → <b>gone</b>', s:'worked, eaten, gone.' },
  gerundio:    { t:'Gerundio (-ing)', d:'El verbo con <b>-ing</b>. Marca que la acción <b>está en curso</b>. En español sería <i>trabaj<b>ando</b></i>.', e:'work<b>ing</b> · eat<b>ing</b> · I am <b>working</b>', s:'working, eating. I am working.' },
  contable:    { t:'Contable', d:'Algo que puedes <b>contar con números</b>: un libro, dos libros. Lleva plural y admite <i>many</i>.', e:'one book, two book<b>s</b> · <b>many</b> people', s:'one book, two books, many people.' },
  incontable:  { t:'Incontable', d:'Algo que <b>no se cuenta de uno en uno</b>: no dices «dos aguas». Nunca lleva -s y usa <i>much</i>.', e:'water, money, time, <b>advice</b>, information', s:'water, money, time, advice, information.' },
  comparativo: { t:'Comparativo', d:'Cuando comparas dos cosas: <b>más</b> grande <b>que</b>. Corto lleva <b>-er</b>, largo lleva <b>more</b>.', e:'bigg<b>er</b> than · <b>more</b> expensive than', s:'bigger than, more expensive than.' },
  superlativo: { t:'Superlativo', d:'Cuando algo es <b>el máximo</b>: el más grande de todos. Siempre con <b>the</b>.', e:'<b>the</b> bigg<b>est</b> · <b>the most</b> expensive', s:'the biggest, the most expensive.' },
  imperativo:  { t:'Imperativo', d:'Una orden o instrucción. Se dice con el <b>verbo solo</b>, sin sujeto.', e:'<b>Come</b> here · <b>Don\'t</b> worry', s:"Come here. Don't worry." },
  afirmativa:  { t:'Frase afirmativa', d:'Una frase que dice que sí, sin negar ni preguntar.', e:'I work here.', s:'I work here.' },
  negativa:    { t:'Frase negativa', d:'Una frase con <b>not</b>. En inglés el <i>not</i> siempre necesita un auxiliar donde agarrarse.', e:'I do<b>n\'t</b> work here.', s:"I don't work here." },
  interrogativa:{ t:'Frase interrogativa', d:'Una pregunta. En inglés se hace <b>moviendo el auxiliar al frente</b>, no subiendo la voz.', e:'<b>Do</b> you work here?', s:'Do you work here?' },
  conjugar:    { t:'Conjugar', d:'Cambiar la forma del verbo según quién y cuándo. El español conjuga muchísimo (<i>como, comes, comí</i>); <b>el inglés casi no conjuga</b>: solo añade -s con he/she/it.', e:'yo como, tú comes → I eat, you eat, she eat<b>s</b>', s:'I eat, you eat, she eats.' },
  contraccion: { t:'Contracción', d:'Dos palabras apretadas en una con apóstrofo. <b>No es informal: es como se habla siempre.</b> Si solo aprendes la forma larga, no vas a entender nada hablado.', e:'do not → <b>don\'t</b> · I am → <b>I\'m</b> · I will → <b>I\'ll</b>', s:"don't, I'm, I'll." },
  phrasal:     { t:'Phrasal verb', d:'Un verbo + una palabrita que <b>le cambia el significado por completo</b>. Se aprende como si fuera una palabra nueva.', e:'look = mirar · look <b>for</b> = buscar · look <b>after</b> = cuidar', s:'look, look for, look after.' },
  pasiva:      { t:'Voz pasiva', d:'Cuando lo importante es <b>qué pasó</b>, no quién lo hizo. Se arma con <b>be + participio</b>.', e:'The report <b>was sent</b> · English <b>is spoken</b> here', s:'The report was sent. English is spoken here.' },
  condicional: { t:'Condicional', d:'El «-ría» del español: iría, sería, podría. En inglés es siempre <b>would + verbo desnudo</b>.', e:'I <b>would</b> go · That <b>would</b> be great', s:'I would go. That would be great.' },
  sustantivo:  { t:'Sustantivo', d:'Las cosas, personas y lugares. Todo lo que puedes señalar con el dedo o nombrar.', e:'dog, house, money, Miguel', s:'dog, house, money.' },
  adjetivo:    { t:'Adjetivo', d:'Cómo <b>es</b> una cosa. En inglés va SIEMPRE antes del sustantivo y nunca lleva plural.', e:'a <b>red</b> car · two <b>red</b> cars', s:'a red car, two red cars.' },
  adverbio:    { t:'Adverbio', d:'Cómo se <b>hace</b> la acción, o cuándo y dónde. Muchos terminan en <b>-ly</b>.', e:'He works <b>quickly</b> · I <b>always</b> work', s:'He works quickly. I always work.' },
  preposicion: { t:'Preposición', d:'Palabritas que colocan las cosas en el espacio y el tiempo: in, on, at, to, for, with. <b>Casi nunca se traducen una por una.</b>', e:'<b>at</b> eight · <b>on</b> Monday · <b>in</b> March', s:'at eight, on Monday, in March.' },
  pronombre:   { t:'Pronombre', d:'El apodo que reemplaza a un nombre para no repetirlo.', e:'Miguel → <b>he</b> · the table → <b>it</b>', s:'he, she, it, they.' },
  determinante:{ t:'Determinante', d:'La palabra que va antes del sustantivo y dice <b>cuál</b> o <b>cuántos</b>: a, an, the, my, this, some.', e:'<b>the</b> dog · <b>my</b> dog · <b>some</b> dogs', s:'the dog, my dog, some dogs.' },
  tiempoverbal:{ t:'Tiempo verbal', d:'La marca de <b>cuándo</b> pasa la acción: antes, ahora o después. En inglés esa marca casi siempre la lleva el auxiliar, no el verbo.', e:'I work<b>ed</b> (antes) · I <b>am</b> working (ahora) · I <b>will</b> work (después)', s:'I worked. I am working. I will work.' },
  sujetorelleno:{ t:'Sujeto de relleno', d:'Un <b>it</b> o <b>there</b> que no significa nada, puesto solo porque el inglés <b>exige</b> que toda frase tenga sujeto.', e:'<b>It</b>\'s raining · <b>There</b> is a problem', s:"It's raining. There is a problem." },

  /* Los nombres de los tiempos. El documento los usa en cada página — «presente
     simple» sale 71 veces — y hasta ahora no tenían ficha: se nombraba el
     tiempo sin explicar nunca qué es. */
  presentesimple:{ t:'Presente simple', d:'El tiempo de lo que es <b>siempre verdad</b> o se repite por costumbre — <b>no</b> de lo que está pasando ahora mismo. El verbo va desnudo; solo con <i>he/she/it</i> se le pega una <b>-s</b>. Para negar y preguntar pide prestado <b>do/does</b>.', e:'I <b>work</b> here · She work<b>s</b> here · <b>Do</b> you work here?', s:'I work here. She works here. Do you work here?' },
  pasadosimple: { t:'Pasado simple', d:'Algo que empezó y <b>terminó</b> en el pasado, en un momento cerrado (ayer, en 2019). El verbo lleva <b>-ed</b>, o cambia entero si es irregular. Al negar y preguntar entra <b>did</b>, y entonces el verbo vuelve a quedar desnudo.', e:'I work<b>ed</b> yesterday · I <b>went</b> home · <b>Did</b> you work?', s:'I worked yesterday. I went home. Did you work?' },
  presenteperfecto:{ t:'Presente perfecto', d:'<b>have/has + participio</b>. Dice que algo <b>ya está hecho</b> sin decir cuándo, o que sigue vivo hasta hoy. Ojo: si dices el momento exacto ya no es este tiempo, es pasado simple — <i>I have worked yesterday</i> está mal.', e:'I <b>have worked</b> here for two years · <b>Have</b> you eaten?', s:'I have worked here for two years. Have you eaten?' },
  futuro:      { t:'Futuro', d:'Lo que todavía no ha pasado. En inglés <b>no hay una terminación de futuro</b> como el <i>-é</i> del español: se arma con <b>will + verbo desnudo</b>, o con <b>be going to</b> cuando ya estaba decidido.', e:'I <b>will</b> call you · I<b>\'m going to</b> study', s:"I will call you. I'm going to study." },
  continuo:    { t:'Continuo (o progresivo)', d:'El tiempo de lo que <b>está en curso</b>. Siempre se arma igual: <b>be + verbo en -ing</b>. Cambias el <i>be</i> y cambias de momento, sin tocar el verbo.', e:'I <b>am</b> work<b>ing</b> (ahora) · I <b>was</b> work<b>ing</b> (entonces)', s:'I am working. I was working.' },

  /* Términos que el documento venía dando por sabidos */
  plural:      { t:'Singular y plural', d:'Singular es <b>uno</b>; plural es <b>más de uno</b>. En inglés el plural del sustantivo casi siempre es una <b>-s</b>. Cuidado con la trampa: la <b>-s</b> en el sustantivo significa <i>muchos</i>, pero la <b>-s</b> en el verbo significa justo lo contrario — <i>uno solo</i>.', e:'one book → two book<b>s</b> · she work<b>s</b> (una sola persona) · child → <b>children</b>', s:'one book, two books. She works. child, children.' },
  irregular:   { t:'Verbo irregular', d:'Un verbo que <b>no</b> hace el pasado con <b>-ed</b>: cambia por dentro. No hay regla que lo prediga, se aprenden de memoria — pero son un grupo cerrado, no crecen.', e:'go → <b>went</b> → <b>gone</b> · eat → <b>ate</b> → <b>eaten</b>', s:'go, went, gone. eat, ate, eaten.' },
  silaba:      { t:'Sílaba', d:'Cada golpe de voz al pronunciar una palabra: <i>big</i> tiene una, <i>ex-pen-si-ve</i> tiene cuatro. Importa porque el comparativo depende de eso: las cortas llevan <b>-er</b> y las largas llevan <b>more</b>.', e:'big (1) → bigg<b>er</b> · expensive (4) → <b>more</b> expensive', s:'big, bigger. expensive, more expensive.' },
  posesivo:    { t:'Posesivo', d:'Dice <b>de quién</b> es algo. En inglés va delante del sustantivo (my, your, his, her, our, their) o con <b>apóstrofo + s</b> pegado al dueño.', e:'<b>my</b> car · Ana<b>\'s</b> car · the boys<b>\'</b> room', s:"my car. Ana's car." }
};

const GL = (() => {
  let pop = null;
  function cerrar(){ if(pop){ pop.remove(); pop = null; } }
  function abrir(el, clave){
    cerrar();
    const g = GLOSARIO[clave];
    if(!g) return;
    pop = document.createElement('div');
    pop.className = 'gl-pop';
    pop.innerHTML = `<div class="gl-t">${esc(g.t)}<button class="gl-x" title="Cerrar">✕</button></div>
      <div class="gl-d">${g.d}</div>
      <div class="gl-e">${g.e}${g.s ? ` <button class="spk sm" data-say="${esc(g.s)}" title="Oír">🔊</button>` : ''}</div>`;
    document.body.appendChild(pop);
    const r = el.getBoundingClientRect();
    const ancho = Math.min(330, window.innerWidth - 24);
    pop.style.width = ancho + 'px';
    let izq = r.left + r.width / 2 - ancho / 2;
    izq = Math.max(12, Math.min(izq, window.innerWidth - ancho - 12));
    pop.style.left = izq + 'px';
    // Si no cabe abajo, se abre hacia arriba
    const alto = pop.offsetHeight;
    pop.style.top = (r.bottom + alto + 12 > window.innerHeight ? r.top - alto - 8 : r.bottom + 8) + window.scrollY + 'px';
    pop.querySelector('.gl-x').onclick = cerrar;
  }
  document.addEventListener('click', e => {
    const t = e.target.closest('.gl');
    if(t){ e.preventDefault(); e.stopPropagation(); abrir(t, t.dataset.glo); return; }
    if(!e.target.closest('.gl-pop')) cerrar();
  });
  window.addEventListener('scroll', cerrar, { passive:true });
  document.addEventListener('keydown', e => { if(e.key === 'Escape') cerrar(); });

  /** Comprueba que ninguna marca del glosario esté muerta.
      Mira TODAS las `.gl`, no solo las que traen `data-glo` bien puesto: la
      versión anterior filtraba por `.gl[data-glo]` y por eso tres marcas
      escritas `data-g=` le eran invisibles — decía «sinDefinir: []» mientras
      Miguel las tocaba y no salía nada. Una auditoría que solo mira lo bien
      formado no audita: confirma. */
  function auditar(){
    const todas = [...document.querySelectorAll('.gl')];
    const sinClave = [], sinDefinir = new Set();
    todas.forEach(el => {
      const k = el.dataset.glo;
      if(!k) sinClave.push({ txt: el.textContent.trim().slice(0, 40),
                             attrs: [...el.attributes].map(a => a.name).join(','),
                             pane: (el.closest('.pane') || {}).id || '?' });
      else if(!GLOSARIO[k]) sinDefinir.add(k);
    });
    // Fichas que existen pero a las que no se llega por ningún camino
    const alcanzables = new Set(todas.map(el => el.dataset.glo).filter(Boolean));
    if(typeof GL_CLAVE !== 'undefined') GL_CLAVE.forEach(k => alcanzables.add(k));
    const huerfanas = Object.keys(GLOSARIO).filter(k => !alcanzables.has(k));

    return { terminos: Object.keys(GLOSARIO).length, marcados: todas.length,
             sinClave, sinDefinir: [...sinDefinir], huerfanas,
             ok: !sinClave.length && !sinDefinir.size };
  }
  return { auditar, cerrar };
})();


/* ══════════════════════════════════════════════════════════════════════
   FICHAS DE LAS 6 PIEZAS · LABORATORIO · REGLAS NO NEGOCIABLES
   ──────────────────────────────────────────────────────────────────────
   Origen: la tabla de las 6 piezas decía que el auxiliar sirve para
   "negar, preguntar o marcar tiempo" y solo mostraba ejemplo de NEGAR.
   Nombrar una función sin enseñarla no es explicar. Regla de este archivo:
   TODO caso que se nombre lleva su propio ejemplo, con audio.
═══════════════════════════════════════════════════════════════════════ */

const PIEZAS = [
{
  id:'suj', cls:'s-suj', n:'SUJETO', sub:'quién hace la acción',
  cuando:'SIEMPRE', tono:'ok',
  simple:'La persona o cosa que hace la acción. Es la primera casilla y en inglés <b>no se puede quitar nunca</b>, ni siquiera cuando no significa nada.',
  casos:[
    { t:'Cuando hay alguien de verdad', d:'El caso normal: alguien concreto hace algo.',
      ex:[ {en:'I work at a bank.', es:'Trabajo en un banco.'},
           {en:'My sister lives in Bogotá.', es:'Mi hermana vive en Bogotá.'} ] },
    { t:'Cuando NO hay nadie: el <b>it</b> de relleno', d:'El clima, la hora, la distancia y las sensaciones no tienen dueño. El español los deja sin sujeto (<i>llueve</i>); el inglés <b>obliga</b> a poner un <b>it</b> que no significa nada. Es un tornillo de estructura, no una palabra con sentido.',
      ex:[ {en:'It is raining.', es:'Está lloviendo. (no existe "is raining" solo)'},
           {en:'It is eight o\'clock.', es:'Son las ocho.'},
           {en:'It takes two hours.', es:'Toma dos horas.'} ] },
    { t:'Cuando algo existe: el <b>there</b>', d:'Para decir «hay», el inglés no tiene una palabra suelta: usa <b>there</b> como sujeto de relleno + el verbo <b>be</b>.',
      ex:[ {en:'There is a problem.', es:'Hay un problema.'},
           {en:'There are two options.', es:'Hay dos opciones.'} ] },
    { t:'Cuando das una orden: la única excepción', d:'El imperativo es el <b>único</b> lugar donde el sujeto desaparece, porque ya se sabe que es «tú».',
      ex:[ {en:'Close the door.', es:'Cierra la puerta.'},
           {en:'Don\'t worry.', es:'No te preocupes.'} ] }
  ],
  regla:'Si tu frase en inglés no empieza por alguien (o por <b>it</b> / <b>there</b>), está rota. La única excepción es una orden.',
  error:{ mal:'Is very difficult.', bien:'It is very difficult.', por:'En español «Es muy difícil» va sin sujeto. En inglés hay que poner el <b>it</b> aunque no signifique nada. Este es el error que más delata a un hispanohablante.' },
  tip:'Antes de hablar, pregúntate «¿quién?». Si la respuesta es «nadie», la respuesta correcta es <b>it</b> o <b>there</b>, no el vacío.'
},
{
  id:'ver', cls:'s-ver', n:'VERBO', sub:'la acción o el estado',
  cuando:'SIEMPRE', tono:'ok',
  simple:'Lo que se hace o lo que se es. Sin verbo no hay frase, solo un montón de palabras.',
  casos:[
    { t:'Verbo de acción', d:'Algo que se hace y se puede ver.',
      ex:[ {en:'She runs every morning.', es:'Ella corre cada mañana.'} ] },
    { t:'Verbo de estado', d:'No se hace nada, se <b>es</b> o se <b>está</b>. El más importante es <b>be</b>.',
      ex:[ {en:'I am tired.', es:'Estoy cansado.'},
           {en:'He seems happy.', es:'Parece feliz.'} ] },
    { t:'La única conjugación que existe: la <b>-s</b> de he/she/it', d:'El español cambia el verbo seis veces (<i>como, comes, come, comemos…</i>). El inglés lo deja quieto <b>salvo</b> con he/she/it en presente, que le pega una <b>-s</b>. Eso es todo.',
      ex:[ {en:'I work. You work. We work.', es:'Yo trabajo. Tú trabajas. Nosotros trabajamos.'},
           {en:'He works. She works. It works.', es:'Él trabaja. Ella trabaja. Eso funciona.'} ] },
    { t:'Cuando hay auxiliar, el verbo queda <b>desnudo</b>', d:'En cuanto aparece un auxiliar o un modal, el verbo pierde la -s, el -ed y el -ing. Toda la información de tiempo se la lleva el auxiliar.',
      ex:[ {en:'She works here.', es:'Ella trabaja aquí. (con -s)'},
           {en:'She doesn\'t work here.', es:'Ella no trabaja aquí. (la -s se la llevó "does")'},
           {en:'Does she work here?', es:'¿Ella trabaja aquí? (igual: "work" desnudo)'} ] }
  ],
  regla:'El verbo lleva la marca de tiempo <b>solo cuando está solo</b>. Si tiene un auxiliar delante, va desnudo: sin -s, sin -ed, sin to.',
  error:{ mal:'She doesn\'t works here.', bien:'She doesn\'t work here.', por:'La -s ya está dentro de <b>does</b>. Ponerla dos veces es marcar el tiempo dos veces.' },
  tip:'La marca de tercera persona se paga <b>una sola vez</b> por frase. O la lleva el verbo, o la lleva el auxiliar. Nunca los dos.'
},
{
  id:'com', cls:'s-com', n:'COMPLEMENTO', sub:'qué · dónde · cuándo · cómo',
  cuando:'Casi siempre', tono:'',
  simple:'Todo lo que completa la frase. Si lo quitas, la frase sigue siendo correcta, solo dice menos.',
  casos:[
    { t:'Qué (objeto directo)', d:'La cosa que recibe la acción. Va pegada al verbo, sin nada en medio.',
      ex:[ {en:'I need help.', es:'Necesito ayuda.'} ] },
    { t:'Dónde (lugar)', d:'',
      ex:[ {en:'I work at home.', es:'Trabajo en casa.'} ] },
    { t:'Cuándo (tiempo)', d:'Va al final, o al principio si quieres darle énfasis. <b>Nunca entre el verbo y su objeto.</b>',
      ex:[ {en:'I finished the report yesterday.', es:'Terminé el informe ayer.'},
           {en:'Yesterday I finished the report.', es:'Ayer terminé el informe.'} ] },
    { t:'Cómo (modo)', d:'',
      ex:[ {en:'He explained it clearly.', es:'Lo explicó con claridad.'} ] },
    { t:'Cuando no hay complemento', d:'Muchas frases se sostienen sin él. Sujeto + verbo ya es una frase completa.',
      ex:[ {en:'It works.', es:'Funciona.'},
           {en:'She left.', es:'Se fue.'} ] }
  ],
  regla:'El orden por defecto es <b>QUÉ → DÓNDE → CUÁNDO</b>. Nunca metas nada entre el verbo y su objeto directo.',
  error:{ mal:'I speak very well English.', bien:'I speak English very well.', por:'«very well» es un <span class="gl" data-glo="adverbio">adverbio</span> y se metió entre el verbo y su objeto. Primero el qué (<i>English</i>), después el cómo.' },
  tip:'Si dudas del orden, di primero el <b>qué</b>. Lo demás casi siempre puede ir después sin sonar raro.'
},
{
  id:'aux', cls:'s-aux', n:'AUXILIAR', sub:'el motor de la frase',
  cuando:'Tres casos, ninguno opcional', tono:'warn',
  simple:'Un verbo que <b>ayuda</b> a otro verbo y por sí solo no significa nada. Piénsalo como el motor de arranque: no es el viaje, pero sin él el carro no prende. Son <b>do, does, did, am, is, are, was, were, have, has, had, will</b>.',
  casos:[
    { t:'Trabajo 1 · NEGAR', d:'El <b>not</b> no puede flotar solo: necesita un auxiliar donde agarrarse. Si la frase no tenía ninguno, aparece <b>do / does / did</b> únicamente para sostener el <i>not</i>.',
      ex:[ {en:'I work here.', es:'Trabajo aquí. → sin auxiliar'},
           {en:'I don\'t work here.', es:'No trabajo aquí. → apareció "do" para sostener el not'},
           {en:'She didn\'t call me.', es:'Ella no me llamó. → apareció "did"'} ] },
    { t:'Trabajo 2 · PREGUNTAR', d:'En español preguntas subiendo la voz: «¿Trabajas aquí?». En inglés eso <b>no funciona</b>: hay que sacar un auxiliar y ponerlo delante del sujeto. Ese salto al frente es la pregunta.',
      ex:[ {en:'You work here.', es:'Trabajas aquí. → afirmación'},
           {en:'Do you work here?', es:'¿Trabajas aquí? → "do" saltó al frente'},
           {en:'Did she call you?', es:'¿Ella te llamó?'} ] },
    { t:'Trabajo 3 · MARCAR TIEMPO', d:'Este es el que casi nadie explica. Aquí <b>no estás negando ni preguntando</b>: la frase es afirmativa y aun así aparece un auxiliar, porque es él quien dice <b>cuándo</b> pasa la acción. El verbo ya no puede solo. Mira la misma acción, <i>work</i>, cambiando de tiempo — y fíjate en que lo único que cambia de verdad es el auxiliar:',
      ex:[ {en:'I work.', es:'Trabajo. (siempre, en general) → SIN auxiliar'},
           {en:'I am working.', es:'Estoy trabajando (ahora mismo) → "am" marca en curso'},
           {en:'I have worked.', es:'He trabajado (ya está hecho) → "have" marca terminado'},
           {en:'I will work.', es:'Trabajaré → "will" marca que aún no pasó'},
           {en:'I had worked.', es:'Había trabajado (antes de otra cosa) → "had" marca anterior al pasado'},
           {en:'I was working.', es:'Estaba trabajando → "was" marca en curso, pero en el pasado'} ] }
  ],
  regla:'Hay <b>un solo</b> auxiliar mandando por frase, y es él quien carga el tiempo y la persona. El verbo que le sigue va siempre desnudo.',
  error:{ mal:'You work here? · I not work here.', bien:'Do you work here? · I don\'t work here.', por:'Sin auxiliar, en inglés no hay ni pregunta ni negación. Subir la voz no basta y el <i>not</i> no se sostiene solo.' },
  tip:'Truco para saber cuál usar: mira la frase afirmativa. <b>¿Ya tenía auxiliar?</b> Si sí (<i>am, is, have, will…</i>), ese mismo se mueve o recibe el <i>not</i>. Si no tenía ninguno, entra <b>do / does / did</b>.',
  extra:{
    t:'Caso puntual: la pregunta que NO lleva auxiliar',
    d:'Cuando el <span class="gl" data-glo="sujeto">sujeto</span> es justo lo que estás preguntando, no hay nada que mover al frente — y el auxiliar desaparece. Es la única pregunta sin auxiliar.',
    ex:[ {en:'Who works here?', es:'¿Quién trabaja aquí? → "who" YA es el sujeto'},
         {en:'What happened?', es:'¿Qué pasó? → nada de "did"'},
         {en:'Who did you call?', es:'¿A quién llamaste? → aquí "who" NO es el sujeto (tú lo eres), así que sí lleva "did"'} ]
  }
},
{
  id:'neg', cls:'s-neg', n:'not', sub:'la negación',
  cuando:'Solo al negar', tono:'',
  simple:'La palabra que convierte un sí en un no. En inglés <b>nunca va sola</b>: siempre pegada a un auxiliar o a un modal.',
  casos:[
    { t:'Con auxiliar de apoyo (do/does/did)', d:'Cuando la frase no tenía auxiliar, entra uno solo para sostener el not.',
      ex:[ {en:'I don\'t smoke.', es:'No fumo.'},
           {en:'He doesn\'t drive.', es:'Él no maneja.'},
           {en:'We didn\'t go.', es:'No fuimos.'} ] },
    { t:'Con el auxiliar que ya estaba', d:'Si la frase ya tenía uno, no entra ninguno nuevo: el not se cuelga del que hay.',
      ex:[ {en:'She isn\'t working today.', es:'Ella no está trabajando hoy.'},
           {en:'They haven\'t finished.', es:'No han terminado.'},
           {en:'I won\'t be late.', es:'No llegaré tarde. (will + not = won\'t)'} ] },
    { t:'Con un modal', d:'Los modales sostienen el not directamente, sin ayuda de nadie.',
      ex:[ {en:'I can\'t swim.', es:'No sé nadar.'},
           {en:'You shouldn\'t worry.', es:'No deberías preocuparte.'} ] },
    { t:'La negación que NO usa <i>not</i>', d:'Con <b>never, nothing, nobody, no</b> la frase ya es negativa. Añadir <i>not</i> sería negar dos veces, y en inglés eso <b>se anula</b> en vez de reforzarse.',
      ex:[ {en:'I never go there.', es:'Nunca voy allá.'},
           {en:'I have nothing to say.', es:'No tengo nada que decir.'} ] }
  ],
  regla:'Una sola negación por frase. En español «no vi nada» lleva dos y está bien; en inglés <i>I didn\'t see nothing</i> significa literalmente que sí viste algo.',
  error:{ mal:'I don\'t know nothing.', bien:'I don\'t know anything. · I know nothing.', por:'Doble negación. Elige una: o niegas con el auxiliar y usas <b>anything</b>, o niegas con <b>nothing</b> y dejas el verbo en positivo.' },
  tip:'En cuanto oigas <b>never / nothing / nobody</b>, apaga el <i>not</i>. Ya está negado.'
},
{
  id:'wh', cls:'s-wh', n:'WH', sub:'la pregunta abierta',
  cuando:'Solo en preguntas abiertas', tono:'',
  simple:'Las palabras con las que preguntas algo que no se contesta con sí o no: <b>what, where, when, who, why, which, how, whose</b>. Se pegan al frente de todo lo demás.',
  casos:[
    { t:'La fórmula fija', d:'Siempre igual: WH + auxiliar + sujeto + verbo. El orden no cambia nunca.',
      ex:[ {en:'Where do you live?', es:'¿Dónde vives?'},
           {en:'What did she say?', es:'¿Qué dijo ella?'},
           {en:'When does it start?', es:'¿Cuándo empieza?'} ] },
    { t:'How + una palabra: la familia completa', d:'<b>how</b> se combina para medir cualquier cosa.',
      ex:[ {en:'How much does it cost?', es:'¿Cuánto cuesta? (dinero, incontable)'},
           {en:'How many people are coming?', es:'¿Cuántas personas vienen? (contable)'},
           {en:'How long does it take?', es:'¿Cuánto tarda?'},
           {en:'How often do you go?', es:'¿Cada cuánto vas?'} ] },
    { t:'La preposición se queda al final', d:'En español la preposición viaja con la pregunta (<i>¿<b>Con</b> quién…?</i>). En inglés hablado se queda plantada al final de la frase.',
      ex:[ {en:'Who are you talking to?', es:'¿Con quién estás hablando?'},
           {en:'What are you looking for?', es:'¿Qué estás buscando?'},
           {en:'Where are you from?', es:'¿De dónde eres?'} ] }
  ],
  regla:'La palabra WH va al frente, pero <b>no reemplaza al auxiliar</b>: el auxiliar sigue ahí, justo detrás. La única excepción es cuando el WH es el sujeto (<i>Who called?</i>).',
  error:{ mal:'Where you live?', bien:'Where do you live?', por:'Se puso el WH al frente pero se olvidó el auxiliar. WH y auxiliar van juntos, no uno en vez del otro.' },
  tip:'Cuenta las casillas al preguntar: <b>WH · auxiliar · sujeto · verbo</b>. Si te faltó la segunda, la pregunta suena a traducción literal.'
}
];

/* ══════════════════ LABORATORIO DE TRANSFORMACIÓN ══════════════════
   La misma frase cambiando de tiempo y de forma, para VER aparecer el
   auxiliar. Es la demostración de que "marcar tiempo" es un trabajo real
   y no una frase suelta en una tabla.

   16 frases base × 10 tiempos × 4 formas = 640 frases generadas, cada una
   con: qué hace el auxiliar ahí · por qué el verbo va en esa forma ·
   cuándo la usarías de verdad · el error típico del hispanohablante ·
   y dónde cae en la línea del tiempo.

   Cuatro vistas: una sola · los 10 tiempos · las 4 formas · ponte a prueba.
═══════════════════════════════════════════════════════════════════════ */

const LAB_BASES = [
  // ── Trabajo ──
  { id:'work',   g:'Trabajo',    suj:'I',    p:1, ver:'work',   vs:'works',    v2:'worked',   ving:'working',   vpp:'worked',   com:'at a bank',    wh:'Where', whDrop:1, es:'yo trabajar en un banco' },
  { id:'finish', g:'Trabajo',    suj:'He',   p:3, ver:'finish', vs:'finishes', v2:'finished', ving:'finishing', vpp:'finished', com:'the report',   wh:'What',  whDrop:1, es:'él terminar el informe' },
  { id:'write',  g:'Trabajo',    suj:'We',   p:1, ver:'write',  vs:'writes',   v2:'wrote',    ving:'writing',   vpp:'written',  com:'emails',       wh:'What',  whDrop:1, es:'nosotros escribir correos' },
  { id:'send',   g:'Trabajo',    suj:'She',  p:3, ver:'send',   vs:'sends',    v2:'sent',     ving:'sending',   vpp:'sent',     com:'the invoice',  wh:'What',  whDrop:1, es:'ella enviar la factura' },
  // ── Día a día ──
  { id:'eat',    g:'Día a día',  suj:'They', p:1, ver:'eat',    vs:'eats',     v2:'ate',      ving:'eating',    vpp:'eaten',    com:'breakfast',    wh:'What',  whDrop:1, es:'ellos desayunar' },
  { id:'live',   g:'Día a día',  suj:'She',  p:3, ver:'live',   vs:'lives',    v2:'lived',    ving:'living',    vpp:'lived',    com:'in Bogotá',    wh:'Where', whDrop:1, es:'ella vivir en Bogotá' },
  { id:'call',   g:'Día a día',  suj:'He',   p:3, ver:'call',   vs:'calls',    v2:'called',   ving:'calling',   vpp:'called',   com:'his mother',   wh:'Who',   whDrop:1, es:'él llamar a su mamá' },
  { id:'watch',  g:'Día a día',  suj:'She',  p:3, ver:'watch',  vs:'watches',  v2:'watched',  ving:'watching',  vpp:'watched',  com:'movies',       wh:'What',  whDrop:1, es:'ella ver películas' },
  { id:'drive',  g:'Día a día',  suj:'They', p:1, ver:'drive',  vs:'drives',   v2:'drove',    ving:'driving',   vpp:'driven',   com:'to work',      wh:'Where', whDrop:1, es:'ellos ir en carro al trabajo' },
  // ── Estudio ──
  { id:'study',  g:'Estudio',    suj:'You',  p:1, ver:'study',  vs:'studies',  v2:'studied',  ving:'studying',  vpp:'studied',  com:'English',      wh:'What',  whDrop:1, es:'tú estudiar inglés' },
  { id:'learn',  g:'Estudio',    suj:'I',    p:1, ver:'learn',  vs:'learns',   v2:'learned',  ving:'learning',  vpp:'learned',  com:'new words',    wh:'What',  whDrop:1, es:'yo aprender palabras nuevas' },
  { id:'speak',  g:'Estudio',    suj:'He',   p:3, ver:'speak',  vs:'speaks',   v2:'spoke',    ving:'speaking',  vpp:'spoken',   com:'English',      wh:'What',  whDrop:1, es:'él hablar inglés' },
  // ── Irregulares que hay que dominar ──
  { id:'go',     g:'Irregulares clave', suj:'I',    p:1, ver:'go',   vs:'goes',  v2:'went',   ving:'going',  vpp:'gone',   com:'to the gym',   wh:'Where', whDrop:1, es:'yo ir al gimnasio' },
  { id:'do',     g:'Irregulares clave', suj:'I',    p:1, ver:'do',   vs:'does',  v2:'did',    ving:'doing',  vpp:'done',   com:'my homework',  wh:'What',  whDrop:1, es:'yo hacer mi tarea' },
  { id:'take',   g:'Irregulares clave', suj:'She',  p:3, ver:'take', vs:'takes', v2:'took',   ving:'taking', vpp:'taken',  com:'the bus',      wh:'What',  whDrop:1, es:'ella tomar el bus' },
  { id:'buy',    g:'Irregulares clave', suj:'We',   p:1, ver:'buy',  vs:'buys',  v2:'bought', ving:'buying', vpp:'bought', com:'a car',        wh:'What',  whDrop:1, es:'nosotros comprar un carro' }
];

/* Cada tiempo trae TODO lo que hace falta para explicarlo, no solo su nombre.
   `linea` coloca la acción en la barra del tiempo (0 = pasado, 50 = ahora). */
const LAB_T = [
{ id:'pres', n:'Presente simple', h:'Rutina y hechos', corto:'Presente',
  linea:{ d:4, a:96, tipo:'tramo', txt:'Siempre / en general' },
  porqueSin:'En presente simple afirmativo <b>no hay auxiliar</b>. El verbo va solo, y él mismo lleva la única marca que existe: la <b>-s</b> cuando el sujeto es he / she / it.',
  porqueOp:'Apareció <b>{aux}</b>, y no significa nada: entró solo para poder {acción}. Es un motor de arranque — no es el viaje.',
  verboPor:'Con un auxiliar delante el verbo se <b>desnuda</b>: pierde la -s. El tiempo se paga una sola vez por frase.',
  cuando:'Lo que haces por costumbre o lo que es verdad en general. <i>I work at a bank</i> significa «ese es mi trabajo», <b>no</b> «estoy trabajando ahora mismo».',
  pistas:'always · usually · every day · never · on Mondays',
  error:{ mal:'She work here.', bien:'She works here.', por:'La -s de he/she/it no se negocia en afirmativa.' } },

{ id:'past', n:'Pasado simple', h:'Empezó y terminó', corto:'Pasado',
  linea:{ d:16, a:24, tipo:'punto', txt:'Terminado, con su momento' },
  porqueSin:'Tampoco hay auxiliar. El pasado está <b>dentro del propio verbo</b>: {base} → {v2}.',
  porqueOp:'Apareció <b>did</b>, y con él el pasado se mudó del verbo al auxiliar.',
  verboPor:'Por eso el verbo vuelve a su forma base ({v2} → {base}). Si lo dejas en pasado, estarías marcando el tiempo <b>dos veces</b>.',
  cuando:'Algo que empezó y terminó, casi siempre con un momento concreto. Si puedes decir <i>cuándo</i>, va aquí.',
  pistas:'yesterday · last week · in 2020 · two days ago',
  error:{ mal:'Did you went?', bien:'Did you go?', por:'El «did» ya carga el pasado. El verbo va desnudo.' } },

{ id:'fut', n:'Futuro · will', h:'Aún no pasa', corto:'will',
  linea:{ d:72, a:80, tipo:'punto', txt:'Todavía no pasa' },
  porque:'Aquí el auxiliar está <b>marcando tiempo</b>: <b>will</b> es lo único en toda la frase que dice que la acción aún no ocurrió.',
  verboPor:'El verbo <b>nunca cambia</b>: siempre desnudo, para todas las personas. Por eso el futuro con <i>will</i> es el tiempo más fácil del inglés.',
  cuando:'Una decisión que tomas <b>en el momento de hablar</b>, una promesa o una predicción. <i>I\'ll help you</i> = lo acabas de decidir.',
  pistas:'tomorrow · next week · I think… · probably',
  error:{ mal:'I will to work.', bien:'I will work.', por:'Después de un modal nunca va «to».' } },

{ id:'going', n:'Futuro · going to', h:'Plan ya decidido', corto:'going to',
  linea:{ d:64, a:74, tipo:'punto', txt:'Ya lo tenías planeado' },
  porque:'El auxiliar de verdad es <b>be</b> ({aux}): es el que se mueve y el que recibe el <i>not</i>. <b>going to</b> se queda quieto — no es «ir a un lugar», es una fórmula fija que significa «voy a».',
  verboPor:'Después de <i>going to</i> el verbo va desnudo.',
  cuando:'Un plan que <b>ya estaba decidido antes</b> de que empezaras a hablar. Hablando, este futuro se usa <b>más que <i>will</i></b> — si solo aprendes <i>will</i>, suenas a libro.',
  pistas:'tonight · this weekend · I already decided',
  error:{ mal:'I go to study tonight.', bien:'I\'m going to study tonight.', por:'Sin el «be» delante no hay futuro: eso sería presente.' } },

{ id:'cont', n:'Presente continuo', h:'Ahora mismo', corto:'Continuo',
  linea:{ d:45, a:55, tipo:'punto', txt:'En curso, en este instante' },
  porque:'Aquí el auxiliar está <b>marcando tiempo</b>: <b>{aux}</b> (el verbo <i>be</i>) dice que la acción está <b>en curso ahora mismo</b>. Fíjate en que aparece <b>incluso afirmando</b> — no estás negando ni preguntando nada.',
  verboPor:'El verbo se pone en <b>-ing</b>. Sin el <i>be</i> delante, el -ing solo no es una frase.',
  cuando:'Lo que pasa en este instante, o un plan muy cercano y ya fijado: <i>I\'m meeting her tomorrow</i>.',
  pistas:'right now · at the moment · look! · today',
  error:{ mal:'I am work.', bien:'I am working.', por:'El «be» pide -ing. Los dos van juntos o ninguno.' } },

{ id:'pastcont', n:'Pasado continuo', h:'Estaba en curso', corto:'Pas. cont.',
  linea:{ d:10, a:32, tipo:'tramo', txt:'Estaba pasando, en el pasado' },
  porque:'El auxiliar es <b>be en pasado</b> ({aux}). Dice que la acción <b>estaba en curso</b> en un momento del pasado, no que terminara.',
  verboPor:'-ing, igual que el presente continuo. Lo único que cambia entre los dos es el auxiliar.',
  cuando:'El fondo de una escena: lo que estaba pasando cuando pasó otra cosa. <i>I was working when she called</i>.',
  pistas:'when… · while… · at 8 o\'clock yesterday',
  error:{ mal:'I was work when she called.', bien:'I was working when she called.', por:'Mismo caso: «was» pide -ing.' } },

{ id:'perf', n:'Presente perfecto', h:'Hecho, sin decir cuándo', corto:'Perfecto',
  linea:{ d:14, a:50, tipo:'flecha', txt:'En algún momento, hasta hoy' },
  porque:'<b>{aux}</b> dice que la acción <b>ya está hecha</b>, pero <b>sin decir cuándo</b>. Esa es toda la diferencia con el pasado simple.',
  verboPor:'El verbo pasa a <span class="gl" data-glo="participio">participio</span> ({base} → {vpp}), que es la forma que siempre sigue a <i>have</i>.',
  cuando:'Experiencias de vida y cosas terminadas sin fecha. <i>I have worked at a bank</i> = alguna vez, da igual cuándo. <b>En cuanto digas cuándo, cambia a pasado simple.</b>',
  pistas:'ever · never · already · yet · just · so far',
  error:{ mal:'I have worked there yesterday.', bien:'I worked there yesterday.', por:'Con un momento concreto («yesterday») va pasado simple, no perfecto.' } },

{ id:'pastperf', n:'Pasado perfecto', h:'El pasado del pasado', corto:'Pas. perf.',
  linea:{ d:4, a:11, tipo:'punto', txt:'Antes de otra cosa del pasado' },
  porque:'<b>had</b> marca lo que pasó <b>antes de otro momento del pasado</b>. Por eso se le dice «el pasado del pasado».',
  verboPor:'Participio, igual que con <i>have</i> ({base} → {vpp}).',
  cuando:'Cuando cuentas dos cosas del pasado y quieres dejar clarísimo cuál fue primero: <i>When she called, I had already finished</i>.',
  pistas:'already · before · by the time… · when…',
  error:{ mal:'When she called, I already finished.', bien:'When she called, I had already finished.', por:'Sin «had» no se sabe qué pasó primero.' } },

{ id:'perfcont', n:'Presente perfecto continuo', h:'Lleva tiempo y sigue', corto:'Perf. cont.',
  linea:{ d:14, a:56, tipo:'flecha', txt:'Empezó antes y sigue ahora' },
  porque:'Aquí hay <b>dos</b> auxiliares: <b>{aux}</b> y <b>been</b>. Solo el primero se mueve al preguntar y solo él recibe el <i>not</i>; <b>been</b> se queda siempre quieto en su sitio.',
  verboPor:'-ing, porque la acción <b>sigue en curso</b>.',
  cuando:'Cuánto <b>llevas</b> haciendo algo y todavía lo haces. En español dirías «llevo dos años trabajando aquí» — en inglés es <i>I have been working here for two years</i>.',
  pistas:'for two years · since 2020 · all day · lately',
  error:{ mal:'I work here since two years.', bien:'I have been working here for two years.', por:'«llevo…» no se traduce con presente simple. Y «since» va con fechas, «for» con duraciones.' } },

{ id:'cond', n:'Condicional · would', h:'El «-ría»', corto:'would',
  linea:{ d:0, a:0, tipo:'irreal', txt:'No es real: hipótesis o cortesía' },
  porque:'<b>would</b> es exactamente el <b>«-ría»</b> del español: trabaja<b>ría</b>, i<b>ría</b>, se<b>ría</b>. No sitúa la acción en el tiempo: la saca de la realidad.',
  verboPor:'Verbo desnudo, como con todos los <span class="gl" data-glo="modal">modales</span>. Nunca <i>to</i>, nunca <i>-s</i>, nunca <i>-ed</i>.',
  cuando:'Algo que no es real —hipótesis o deseo— o para pedir algo con educación. <i>Would you help me?</i> es mucho más amable que <i>Can you help me?</i>',
  pistas:'if… · I think I would… · would you…?',
  error:{ mal:'I would to work there.', bien:'I would work there.', por:'Modal + verbo desnudo. El «to» sobra siempre.' } }
];

const LAB_F = [
  { id:'af', n:'Afirmar',   h:'Decir que sí' },
  { id:'ne', n:'Negar',     h:'Decir que no' },
  { id:'pr', n:'Preguntar', h:'Pregunta de sí o no' },
  { id:'wh', n:'WH',        h:'Pregunta abierta' }
];

const LAB_VISTAS = [
  { id:'una',     n:'🔍 Una sola',       h:'La frase en detalle, con toda la explicación' },
  { id:'tiempos', n:'📅 Los 10 tiempos', h:'La misma frase en los 10 tiempos: ahí se ve aparecer el auxiliar' },
  { id:'formas',  n:'🔀 Las 4 formas',   h:'Afirmar, negar, preguntar y WH: ahí se ve MOVERSE el auxiliar' },
  { id:'reto',    n:'🎯 Ponte a prueba', h:'Adivina qué auxiliar toca. Producir, no solo mirar' }
];

const LAB = (() => {
  const st = { base:'work', t:'pres', f:'af', vista:'una' };
  const reto = { q:null, resp:null, aciertos:0, intentos:0 };

  const beP = b => b.suj === 'I' ? 'am' : (b.p === 3 ? 'is' : 'are');
  const beD = b => (b.suj === 'I' || b.p === 3) ? 'was' : 'were';
  const doP = b => b.p === 3 ? 'does' : 'do';
  const hvP = b => b.p === 3 ? 'has' : 'have';

  /* Qué auxiliares lleva cada tiempo. El PRIMERO de `af` es el operador:
     el que salta al frente en las preguntas y el que recibe el `not`.
     Los demás (been, going to) se quedan siempre donde están. */
  function plan(b, t){
    switch(t){
      case 'pres':     return { af:[],                    op:doP(b), f:'s',  fOp:'base' };
      case 'past':     return { af:[],                    op:'did',  f:'v2', fOp:'base' };
      case 'fut':      return { af:['will'],              f:'base' };
      case 'going':    return { af:[beP(b), 'going to'],  f:'base' };
      case 'cont':     return { af:[beP(b)],              f:'ing' };
      case 'pastcont': return { af:[beD(b)],              f:'ing' };
      case 'perf':     return { af:[hvP(b)],              f:'pp' };
      case 'pastperf': return { af:['had'],               f:'pp' };
      case 'perfcont': return { af:[hvP(b), 'been'],      f:'ing' };
      default:         return { af:['would'],             f:'base' };
    }
  }
  const formaVerbo = (b, k) => k === 's'  ? (b.p === 3 ? b.vs : b.ver)
                             : k === 'v2' ? b.v2 : k === 'ing' ? b.ving
                             : k === 'pp' ? b.vpp : b.ver;

  const rellena = (txt, b, aux) => String(txt || '')
    .split('{aux}').join(aux || '')
    .split('{base}').join(b.ver)
    .split('{v2}').join(b.v2)
    .split('{vpp}').join(b.vpp);

  function armar(b, t, f){
    const P = plan(b, t), info = LAB_T.find(x => x.id === t);
    const sinAux = P.af.length === 0;
    const op = sinAux ? P.op : P.af[0];
    const resto = sinAux ? [] : P.af.slice(1);
    const clave = (f === 'af') ? P.f : (sinAux ? P.fOp : P.f);

    const S = { r:'suj', t:b.suj }, V = { r:'ver', t:formaVerbo(b, clave) };
    const com = (f === 'wh' && b.whDrop) ? [] : [{ r:'com', t:b.com }];
    const A = x => ({ r:'aux', t:x });

    let tk;
    if(f === 'af')      tk = sinAux ? [S, V, ...com] : [S, ...P.af.map(A), V, ...com];
    else if(f === 'ne') tk = [S, A(op), { r:'neg', t:'not' }, ...resto.map(A), V, ...com];
    else if(f === 'pr') tk = [A(op), S, ...resto.map(A), V, ...com, { r:'q', t:'?' }];
    else                tk = [{ r:'wh', t:b.wh }, A(op), S, ...resto.map(A), V, ...com, { r:'q', t:'?' }];
    if(f === 'af' || f === 'ne') tk.push({ r:'q', t:'.' });

    const hayAux = !(sinAux && f === 'af');
    const auxVisible = hayAux ? op : null;
    const accion = f === 'ne' ? 'sostener el <i>not</i>'
                 : f === 'pr' ? 'saltar al frente y convertir esto en pregunta'
                 : 'encabezar la pregunta';

    let porque;
    if(sinAux && f === 'af')      porque = rellena(info.porqueSin, b, null);
    else if(sinAux)               porque = rellena(info.porqueOp, b, op).split('{acción}').join(accion);
    else                          porque = rellena(info.porque, b, op);

    return { tk, aux:auxVisible, auxTodos:[op, ...resto].filter(Boolean), hayAux,
             porque, verboPor:rellena(info.verboPor, b, op),
             cuando:info.cuando, pistas:info.pistas, error:info.error, linea:info.linea, info };
  }

  /* Así se habla de verdad. Aprender solo la forma larga es la razón por la
     que se entiende leyendo y no escuchando (regla no negociable #12). */
  const CONTR = [
    [/\bI am not\b/g, "I'm not"],
    [/\bwill not\b/g, "won't"],   [/\bwould not\b/g, "wouldn't"],
    [/\bdo not\b/g, "don't"],     [/\bdoes not\b/g, "doesn't"], [/\bdid not\b/g, "didn't"],
    [/\bis not\b/g, "isn't"],     [/\bare not\b/g, "aren't"],
    [/\bwas not\b/g, "wasn't"],   [/\bwere not\b/g, "weren't"],
    [/\bhave not\b/g, "haven't"], [/\bhas not\b/g, "hasn't"],   [/\bhad not\b/g, "hadn't"],
    // afirmativas con «be», que es como suena de verdad
    [/\bI am\b/g, "I'm"],     [/\bYou are\b/g, "You're"], [/\bWe are\b/g, "We're"],
    [/\bThey are\b/g, "They're"], [/\bHe is\b/g, "He's"], [/\bShe is\b/g, "She's"]
  ];
  const contraer = t => CONTR.reduce((a, [re, v]) => a.replace(re, v), t);

  /* La glosa española, conjugada de verdad. Antes era el texto fijo en
     infinitivo de la frase base y no seguía al tiempo elegido: la frase en
     inglés decía «I worked at a bank» y debajo ponía el presente. */
  const ES_P = { yo:'1s', tú:'2s', tu:'2s', él:'3s', ella:'3s',
                 nosotros:'1p', nosotras:'1p', ellos:'3p', ellas:'3p' };
  const ES_WH = { Where:'Dónde', What:'Qué', Who:'A quién' };

  function glosaES(b, t, f){
    if(typeof MORFO === 'undefined' || !MORFO.conjugar) return b.es;
    const par = String(b.es || '').trim().split(/\s+/);
    const suj = par[0], lema = par[1], com = par.slice(2).join(' ');
    const p = ES_P[suj];
    if(!p || !lema) return b.es;
    const C = (l, ti) => MORFO.conjugar(l, ti, p);
    let v;
    switch(t){
      case 'pres':     v = C(lema, 'pres'); break;
      case 'past':     v = C(lema, 'pret'); break;
      case 'fut':      v = C(lema, 'fut');  break;
      case 'cond':     v = C(lema, 'cond'); break;
      case 'going':    v = C('ir', 'pres') + ' a ' + lema; break;
      case 'cont':     v = C('estar', 'pres') + ' ' + MORFO.gerundio(lema); break;
      case 'pastcont': v = C('estar', 'imp')  + ' ' + MORFO.gerundio(lema); break;
      case 'perf':     v = C('haber', 'pres') + ' ' + MORFO.participio(lema); break;
      case 'pastperf': v = C('haber', 'imp')  + ' ' + MORFO.participio(lema); break;
      case 'perfcont': v = C('haber', 'pres') + ' estado ' + MORFO.gerundio(lema); break;
      default:         v = null;
    }
    if(!v || /null|undefined/.test(v)) return b.es;          // si no lo sé, dejo lo que había
    const cola = (f === 'wh' && b.whDrop) ? '' : (com ? ' ' + com : '');
    let s;
    if(f === 'af')      s = suj.charAt(0).toUpperCase() + suj.slice(1) + ' ' + v + cola + '.';
    else if(f === 'ne') s = suj.charAt(0).toUpperCase() + suj.slice(1) + ' no ' + v + cola + '.';
    // En preguntas el español deja caer el pronombre: «¿Trabajaste en un banco?»
    else if(f === 'pr') s = '¿' + v.charAt(0).toUpperCase() + v.slice(1) + cola + '?';
    else                s = '¿' + (ES_WH[b.wh] || 'Qué') + ' ' + v + cola + '?';
    return s.replace(/\s+/g, ' ').trim();
  }

  const texto = o => o.tk.map((x, i) =>
      (x.r === 'suj' && i > 0 && x.t !== 'I') ? x.t.toLowerCase() : x.t
    ).join(' ').replace(/ ([.?])/g, '$1').replace(/^(\w)/, c => c.toUpperCase());

  const CLS = { suj:'s-suj', aux:'s-aux', ver:'s-ver', com:'s-com', neg:'s-neg', wh:'s-wh' };
  const tokensHTML = o => o.tk.filter(x => x.r !== 'q')
    .map(x => `<span class="slot ${CLS[x.r]} lab-tk">${esc(x.t)}</span>`).join('<span class="lab-p">+</span>');

  /* La línea del tiempo: para un aprendiz visual vale más que el nombre del tiempo */
  function lineaHTML(L){
    if(L.tipo === 'irreal'){
      return `<div class="lt"><div class="lt-b irreal"><span class="lt-irreal">no ocurre en la línea del tiempo</span></div>
        <div class="lt-x"><span>antes</span><span>ahora</span><span>después</span></div>
        <div class="lt-t">${esc(L.txt)}</div></div>`;
    }
    const izq = L.d, ancho = Math.max(2, L.a - L.d);
    return `<div class="lt"><div class="lt-b">
        <div class="lt-now"></div>
        <div class="lt-m ${L.tipo}" style="left:${izq}%;width:${ancho}%"></div>
      </div>
      <div class="lt-x"><span>antes</span><span>ahora</span><span>después</span></div>
      <div class="lt-t">${esc(L.txt)}</div></div>`;
  }

  // ─────────── VISTA 1 · una sola frase, con todo ───────────
  function vistaUna(b){
    const o = armar(b, st.t, st.f);
    const largo = texto(o), frase = contraer(largo);
    return `
    <div class="lab-out">
      <div class="lab-form">${tokensHTML(o)}</div>
      <div class="lab-sent">${esc(frase)} <button class="spk" data-say="${esc(frase)}">🔊</button></div>
      <div class="lab-es">${esc(glosaES(b, st.t, st.f))} · <b>${esc(o.info.n)}</b> · ${esc(LAB_F.find(x => x.id === st.f).n)}</div>
      ${frase !== largo ? `<div class="lab-long">Forma larga: <i>${esc(largo)}</i> — correcta, pero nadie habla así. <button class="spk sm" data-say="${esc(largo)}">🔊</button></div>` : ''}
      <div class="lab-acts">
        <button class="lab-b" data-nb-en="${esc(frase)}" data-nb-es="${esc(b.es)}">📓 Guardar en mi cuaderno</button>
        <button class="lab-b" data-labr="azar">🎲 Otra frase al azar</button>
      </div>
    </div>

    <div class="lab-why ${o.hayAux ? 'has' : 'no'}">
      <div class="lab-wt">${o.hayAux ? `🔧 El auxiliar aquí es <span class="slot s-aux">${esc(o.aux)}</span>${o.auxTodos.length > 1 ? ` <span class="lab-mas">+ <span class="slot s-aux">${esc(o.auxTodos[1])}</span>, que no se mueve</span>` : ''}` : '🚫 Aquí no hay ningún auxiliar'}</div>
      <div class="lab-wd">${o.porque}</div>
    </div>

    <div class="lab-grid">
      <div class="lab-card"><div class="lab-ct">🧩 Por qué el verbo va así</div><div class="lab-cb">${o.verboPor}</div></div>
      <div class="lab-card"><div class="lab-ct">💬 Cuándo lo usarías de verdad</div><div class="lab-cb">${o.cuando}</div>
        <div class="lab-pistas">Palabras que lo delatan: <b>${esc(o.pistas)}</b></div></div>
      <div class="lab-card err"><div class="lab-ct">⚠️ El error que ibas a cometer</div>
        <div class="lab-ep"><span class="dx-bad">✗ ${esc(o.error.mal)}</span><span class="dx-good">✓ ${esc(o.error.bien)} <button class="spk sm" data-say="${esc(o.error.bien)}">🔊</button></span></div>
        <div class="lab-cb">${o.error.por}</div></div>
      <div class="lab-card"><div class="lab-ct">⏳ Dónde cae en el tiempo</div>${lineaHTML(o.linea)}</div>
    </div>`;
  }

  // ─────────── VISTA 2 · los 10 tiempos ───────────
  function vistaTiempos(b){
    return `<div class="lab-nota">Misma frase, misma forma (<b>${esc(LAB_F.find(x => x.id === st.f).n)}</b>), los 10 tiempos. Mira la columna de la derecha: <b>en los dos primeros no hay auxiliar</b> y en cuanto cambias de tiempo, aparece solo.</div>
    <div class="lab-all">` + LAB_T.map(T => {
      const o = armar(b, T.id, st.f);
      return `<div class="lab-row${T.id === st.t ? ' hi' : ''}" data-labt="${T.id}">
        <div class="lab-rn">${esc(T.n)}<span>${esc(T.h)}</span></div>
        <div class="lab-rf">${tokensHTML(o)}<span class="lab-rs">${esc(contraer(texto(o)))}</span></div>
        <div class="lab-ra">${o.hayAux ? `<span class="slot s-aux">${esc(o.aux)}</span>` : '<span class="lab-none">sin auxiliar</span>'}</div>
        <button class="spk sm" data-say="${esc(contraer(texto(o)))}">🔊</button>
      </div>`;
    }).join('') + '</div>';
  }

  // ─────────── VISTA 3 · las 4 formas ───────────
  function vistaFormas(b){
    const T = LAB_T.find(x => x.id === st.t);
    return `<div class="lab-nota">Mismo tiempo (<b>${esc(T.n)}</b>), las 4 formas. Aquí no se ve aparecer el auxiliar: se ve <b>MOVERSE</b>. Fíjate en que al preguntar salta a la primera casilla.</div>
    <div class="lab-all">` + LAB_F.map(F => {
      const o = armar(b, st.t, F.id);
      const pos = o.hayAux ? (o.tk.findIndex(x => x.r === 'aux') + 1) : 0;
      return `<div class="lab-row${F.id === st.f ? ' hi' : ''}" data-labf="${F.id}">
        <div class="lab-rn">${esc(F.n)}<span>${esc(F.h)}</span></div>
        <div class="lab-rf">${tokensHTML(o)}<span class="lab-rs">${esc(contraer(texto(o)))}</span></div>
        <div class="lab-ra">${o.hayAux ? `<span class="lab-pos">casilla ${pos}</span>` : '<span class="lab-none">sin auxiliar</span>'}</div>
        <button class="spk sm" data-say="${esc(contraer(texto(o)))}">🔊</button>
      </div>`;
    }).join('') + '</div>';
  }

  // ─────────── VISTA 4 · ponte a prueba ───────────
  const POOL = ['do','does','did','am','is','are','was','were','have','has','had','will','would','(ninguno)'];

  function nuevoReto(){
    const b = LAB_BASES[Math.floor(Math.random() * LAB_BASES.length)];
    const T = LAB_T[Math.floor(Math.random() * LAB_T.length)];
    const F = LAB_F[Math.floor(Math.random() * LAB_F.length)];
    const o = armar(b, T.id, F.id);
    const bien = o.hayAux ? o.aux : '(ninguno)';
    const opciones = [bien];
    while(opciones.length < 4){
      const c = POOL[Math.floor(Math.random() * POOL.length)];
      if(!opciones.includes(c)) opciones.push(c);
    }
    opciones.sort(() => Math.random() - 0.5);
    reto.q = { b, T, F, o, bien, opciones };
    reto.resp = null;
  }

  function vistaReto(){
    if(!reto.q) nuevoReto();
    const { b, T, F, o, bien, opciones } = reto.q;
    /* El esqueleto respeta las mismas reglas que la frase final: el sujeto
       solo va en mayuscula si abre la frase, y el signo de cierre se conserva. */
    const HUECO = '<span class="lab-hueco">?</span>';
    let puesto = false;
    const piezas = [];
    o.tk.forEach((x, i) => {
      if(x.r === 'q'){ piezas.push(`<span class="lab-fin">${esc(x.t)}</span>`); return; }
      if(!puesto && o.hayAux && x.r === 'aux' && x.t === o.aux){ piezas.push(HUECO); puesto = true; return; }
      const t = (x.r === 'suj' && i > 0 && x.t !== 'I') ? x.t.toLowerCase()
              : (i === 0 ? x.t.charAt(0).toUpperCase() + x.t.slice(1) : x.t);
      piezas.push(`<span class="slot ${CLS[x.r]} lab-tk">${esc(t)}</span>`);
      // Sin auxiliar el hueco va justo detras del sujeto: es donde se duda
      if(!puesto && !o.hayAux && x.r === 'suj'){ piezas.push(HUECO); puesto = true; }
    });
    const conHueco = piezas.join(' ');

    const acertado = reto.resp === bien;
    return `<div class="lab-reto">
      <div class="lab-marc">Aciertos: <b>${reto.aciertos}</b> de <b>${reto.intentos}</b>${reto.intentos >= 5 ? ` · ${Math.round(reto.aciertos / reto.intentos * 100)}%` : ''}</div>
      <div class="lab-rq">Quieres decir «<b>${esc(b.es)}</b>» en <b>${esc(T.n)}</b>, forma <b>${esc(F.n).toLowerCase()}</b>.</div>
      <div class="lab-rfr">${conHueco}</div>
      <div class="lab-rt">¿Qué va en el hueco?</div>
      <div class="lab-ops">${opciones.map(op =>
        `<button class="lab-op${reto.resp ? (op === bien ? ' bien' : (op === reto.resp ? ' mal' : ' off')) : ''}" data-labop="${esc(op)}"${reto.resp ? ' disabled' : ''}>${esc(op)}</button>`).join('')}</div>
      ${reto.resp ? `<div class="lab-fb ${acertado ? 'ok' : 'no'}">
          <div class="lab-fbt">${acertado ? '✓ Correcto' : '✗ Era «' + esc(bien) + '»'}</div>
          <div class="lab-wd">${o.porque}</div>
          <div class="lab-fbs">${esc(contraer(texto(o)))} <button class="spk sm" data-say="${esc(contraer(texto(o)))}">🔊</button></div>
        </div>
        <button class="lab-b grande" data-labr="otro">Siguiente →</button>` : ''}
    </div>`;
  }

  // ─────────── render ───────────
  function render(){
    const cont = $('labBox'); if(!cont) return;
    const b = LAB_BASES.find(x => x.id === st.base) || LAB_BASES[0];
    const chips = (arr, sel, key) => arr.map(x =>
      `<button class="lab-c${x.id === sel ? ' on' : ''}" data-lab="${key}" data-labv="${x.id}" title="${esc(x.h || '')}">${esc(x.corto || x.n)}</button>`).join('');

    const grupos = [...new Set(LAB_BASES.map(x => x.g))];
    const opciones = grupos.map(g => `<optgroup label="${esc(g)}">` + LAB_BASES.filter(x => x.g === g).map(x =>
      `<option value="${x.id}"${x.id === st.base ? ' selected' : ''}>${esc(x.suj + ' ' + x.ver + ' ' + x.com)} · ${esc(x.es)}</option>`).join('') + '</optgroup>').join('');

    const enReto = st.vista === 'reto';
    const salida = enReto ? vistaReto()
                 : st.vista === 'tiempos' ? vistaTiempos(b)
                 : st.vista === 'formas'  ? vistaFormas(b)
                 : vistaUna(b);

    cont.innerHTML = `
      <div class="lab-vistas">${LAB_VISTAS.map(v =>
        `<button class="lab-v${v.id === st.vista ? ' on' : ''}" data-lab="vista" data-labv="${v.id}" title="${esc(v.h)}">${esc(v.n)}</button>`).join('')}</div>
      ${enReto ? '' : `<div class="lab-ctl">
        <div class="lab-g"><span class="lab-lb">Frase base <b>· ${LAB_BASES.length} para elegir</b></span>
          <select id="labBase" class="lab-sel">${opciones}</select></div>
        ${st.vista !== 'formas' ? '' : ''}
        <div class="lab-g"><span class="lab-lb">Tiempo · cuándo pasa <b>· ${LAB_T.length}</b></span><div class="lab-cs">${chips(LAB_T, st.t, 't')}</div></div>
        <div class="lab-g"><span class="lab-lb">Forma · qué haces con ella</span><div class="lab-cs">${chips(LAB_F, st.f, 'f')}</div></div>
      </div>`}
      ${salida}`;

    const sel = $('labBase'); if(sel) sel.onchange = e => { st.base = e.target.value; render(); };
    cont.querySelectorAll('[data-lab]').forEach(bt => bt.onclick = () => {
      const k = bt.dataset.lab;
      if(k === 'vista'){ st.vista = bt.dataset.labv; if(st.vista === 'reto' && !reto.q) nuevoReto(); }
      else st[k] = bt.dataset.labv;
      render();
    });
    // Filas clicables en las vistas comparativas
    cont.querySelectorAll('[data-labt]').forEach(r => r.onclick = e => {
      if(e.target.closest('[data-say]')) return;
      st.t = r.dataset.labt; render();
    });
    cont.querySelectorAll('[data-labf]').forEach(r => r.onclick = e => {
      if(e.target.closest('[data-say]')) return;
      st.f = r.dataset.labf; render();
    });
    cont.querySelectorAll('[data-labr]').forEach(bt => bt.onclick = () => {
      if(bt.dataset.labr === 'azar') st.base = LAB_BASES[Math.floor(Math.random() * LAB_BASES.length)].id;
      else nuevoReto();
      render();
    });
    cont.querySelectorAll('[data-labop]').forEach(bt => bt.onclick = () => {
      if(reto.resp) return;
      reto.resp = bt.dataset.labop;
      reto.intentos++;
      if(reto.resp === reto.q.bien) reto.aciertos++;
      render();
    });
  }

  /* Comprueba que las 640 combinaciones se generen sin huecos. Se puede
     llamar desde la consola: APP.LAB.auditar() */
  function auditar(){
    const malas = [];
    for(const b of LAB_BASES) for(const T of LAB_T) for(const F of LAB_F){
      const o = armar(b, T.id, F.id);
      const s = contraer(texto(o));
      if(/undefined|NaN|\s\s|^\s|null/.test(s)) malas.push(b.id + '/' + T.id + '/' + F.id + ': ' + s);
      if(!o.porque || !o.verboPor || !o.cuando) malas.push(b.id + '/' + T.id + '/' + F.id + ': falta explicación');
    }
    return { combinaciones: LAB_BASES.length * LAB_T.length * LAB_F.length, malas };
  }
  function todas(){
    const out = [];
    for(const b of LAB_BASES) for(const T of LAB_T) for(const F of LAB_F)
      out.push(b.id + '|' + T.id + '|' + F.id + '|' + contraer(texto(armar(b, T.id, F.id))));
    return out;
  }
  /* Generador reutilizable: el módulo Escribir lo usa para proponer «¿quieres
     decir…?». Mismo motor que produce las 640 frases, así que las sugerencias
     salen con la misma gramática ya verificada. */
  function generar(base, t, f){
    const o = armar(base, t, f);
    return { frase: contraer(texto(o)), larga: texto(o), aux: o.aux, info: o.info,
             porque: o.porque, tokens: o.tk };
  }
  return { render, auditar, todas, generar };
})();

/* ══════════════════ REGLAS NO NEGOCIABLES ══════════════════
   No son consejos. Son las que, si las rompes, la frase deja de ser
   inglés. Cada una con el error real que produce. */
const REGLAS = [
  { n:'Toda frase lleva sujeto.', d:'Aunque no signifique nada. La única excepción es una orden.',
    mal:'Is raining.', bien:'It is raining.' },
  { n:'El <i>not</i> nunca va solo.', d:'Siempre pegado a un auxiliar o a un modal.',
    mal:'I not understand.', bien:'I don\'t understand.' },
  { n:'Preguntar es mover el auxiliar al frente, no subir la voz.', d:'La entonación no convierte una afirmación en pregunta.',
    mal:'You are coming?', bien:'Are you coming?' },
  { n:'El tiempo se marca una sola vez.', d:'Si lo lleva el auxiliar, el verbo queda desnudo.',
    mal:'Did you went?', bien:'Did you go?' },
  { n:'La -s de he/she/it no se negocia.', d:'En presente simple afirmativo, siempre.',
    mal:'She work here.', bien:'She works here.' },
  { n:'El adjetivo va antes del sustantivo y nunca lleva plural.', d:'Al revés que en español.',
    mal:'a car red · two reds cars', bien:'a red car · two red cars' },
  { n:'Una sola negación por frase.', d:'Dos negaciones se anulan y dicen lo contrario.',
    mal:'I don\'t know nothing.', bien:'I don\'t know anything.' },
  { n:'Nada se mete entre el verbo y su objeto.', d:'Primero el qué, después el cómo y el cuándo.',
    mal:'I like very much this.', bien:'I like this very much.' },
  { n:'Después de una preposición, el verbo va en -ing.', d:'Sin excepciones que valga la pena aprender ahora.',
    mal:'Thanks for help me.', bien:'Thanks for helping me.' },
  { n:'Los modales no llevan <i>to</i> ni <i>-s</i>.', d:'can, could, will, would, should, must, may, might.',
    mal:'She can to swim. · He cans swim.', bien:'She can swim. · He can swim.' },
  { n:'El sustantivo <span class="gl" data-glo="incontable">incontable</span> nunca lleva -s.', d:'information, advice, money, furniture, homework, news.',
    mal:'I need some advices.', bien:'I need some advice.' },
  { n:'Las contracciones no son opcionales.', d:'Nadie dice <i>I do not know</i> hablando. Si solo estudias la forma larga, no vas a entender lo que oyes.',
    mal:'I do not know. (suena a robot)', bien:'I don\'t know.' },
  { n:'La edad se <b>tiene</b> con <i>be</i>, no con <i>have</i>.', d:'Igual el calor, el frío, el hambre y el miedo.',
    mal:'I have 30 years. · I have hungry.', bien:'I am 30. · I am hungry.' },
  { n:'<i>People</i> ya es plural.', d:'Y pide verbo en plural.',
    mal:'The people is waiting.', bien:'The people are waiting.' },
  { n:'Al preguntar, la preposición se queda al final.', d:'No viaja con la palabra WH.',
    mal:'With who are you going?', bien:'Who are you going with?' }
];

const RG = (() => {
  function render(){
    const c = $('regBox'); if(!c) return;
    c.innerHTML = REGLAS.map((r, i) => `<div class="rg">
      <div class="rg-n">${i + 1}</div>
      <div class="rg-b">
        <div class="rg-t">${r.n}</div>
        <div class="rg-d">${r.d}</div>
        <div class="rg-x"><span class="dx-bad">✗ ${esc(r.mal)}</span><span class="dx-good">✓ ${esc(r.bien)} <button class="spk sm" data-say="${esc(r.bien.split('·')[0].trim())}">🔊</button></span></div>
      </div></div>`).join('');
  }
  return { render };
})();


/* ══════════════════════════════════════════════════════════════════════
   AUTO-MARCADO DEL GLOSARIO
   Marcar a mano cada termino en 660 KB de documento no escala y siempre
   quedan huecos — justo el problema original: una palabra suelta sin
   explicar. Esto recorre SOLO nodos de texto y envuelve las primeras
   apariciones de cada termino. Nunca toca atributos, ni codigo, ni el
   cuaderno del usuario (contenteditable), asi que no puede corromper nada.
════════════════════════════════════════════════════════════════════════ */
const GL_FORMAS = [
  ['sujetos','sujeto'], ['sujeto','sujeto'],
  ['complementos','complemento'], ['complemento','complemento'],
  ['auxiliares','auxiliar'], ['auxiliar','auxiliar'],
  ['modales','modal'], ['modal','modal'],
  ['infinitivo','infinitivo'],
  ['participios','participio'], ['participio','participio'],
  ['gerundio','gerundio'],
  ['incontables','incontable'], ['incontable','incontable'],
  ['contables','contable'], ['contable','contable'],
  ['comparativo','comparativo'], ['superlativo','superlativo'],
  ['imperativo','imperativo'],
  ['contracciones','contraccion'], ['contraccion','contraccion'], ['contracción','contraccion'],
  ['phrasal verbs','phrasal'], ['phrasal verb','phrasal'],
  ['voz pasiva','pasiva'],
  ['condicional','condicional'],
  ['sustantivos','sustantivo'], ['sustantivo','sustantivo'],
  ['adjetivos','adjetivo'], ['adjetivo','adjetivo'],
  ['adverbios','adverbio'], ['adverbio','adverbio'],
  ['preposiciones','preposicion'], ['preposición','preposicion'],
  ['pronombres','pronombre'], ['pronombre','pronombre'],
  ['determinantes','determinante'], ['determinante','determinante'],
  ['tiempo verbal','tiempoverbal'],
  ['verbo desnudo','desnudo'],

  /* ── EL ORDEN IMPORTA ──────────────────────────────────────────────
     La alternancia del regex se resuelve de izquierda a derecha, así que
     toda forma que EMPIECE por otra tiene que ir antes. Por eso lo que
     sigue va al final: 'verbo desnudo' y 'voz pasiva' ya están arriba, y
     'verbo'/'pasiva' a secas no pueden adelantarlas. Dentro de cada par,
     el plural primero ('plurales' antes que 'plural').           */

  // Los nombres de los tiempos: el documento los usaba sin explicarlos
  ['presente simple','presentesimple'], ['pasado simple','pasadosimple'],
  ['presente perfecto','presenteperfecto'],
  ['continuos','continuo'], ['continuo','continuo'], ['progresivo','continuo'],
  ['futuro','futuro'],

  // Términos que se daban por sabidos
  ['plurales','plural'], ['plural','plural'], ['singular','plural'],
  ['irregulares','irregular'], ['irregular','irregular'],
  ['sílabas','silaba'], ['sílaba','silaba'],
  ['posesivos','posesivo'], ['posesivo','posesivo'],

  // Fichas que ya existían pero a las que no llegaba ningún camino
  ['afirmativas','afirmativa'], ['afirmativa','afirmativa'],
  ['negativas','negativa'], ['negativa','negativa'],
  ['interrogativas','interrogativa'], ['interrogativa','interrogativa'],
  ['conjugación','conjugar'], ['conjugar','conjugar'],
  ['infinitivos','infinitivo'], ['gerundios','gerundio'],
  ['pasiva','pasiva'],
  ['verbos','verbo'], ['verbo','verbo']
].filter(([, k]) => GLOSARIO[k]);          // si falta la definicion, no se marca

const GL_RE = new RegExp(
  '(?<![\\w\\u00C0-\\u024F])(' +
  GL_FORMAS.map(([f]) => f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') +
  ')(?![\\w\\u00C0-\\u024F])', 'i');

const GL_CLAVE = new Map(GL_FORMAS.map(([f, k]) => [f.toLowerCase(), k]));

/* Zonas que NO se tocan: interactivas, de codigo, de ejemplo, o del usuario */
const GL_NO = 'script,style,button,input,textarea,select,option,code,kbd,' +
              '.gl,.gl-pop,.fp-ex,.tex,.mini,.m-en,.m-es,.formula,.slot,' +
              '[contenteditable],[data-say],[data-gap],.nb-page,.bf-q,' +
              /* De las fichas de las listas (2000 palabras, 1000 frases) se
                 protege el DATO — la palabra, su traduccion, su categoria, su
                 ejemplo, el molde — porque ahi una marca seria un error de
                 contenido, no una ayuda. Las NOTAS si se marcan: son prosa
                 explicativa, y es donde el lector se topa con «presente
                 perfecto» o «infinitivo» sin saber que son.
                 Las filas no tienen manejador de clic (lo interactivo son
                 <button>, ya excluidos), asi que marcar dentro no se come nada. */
              '.w-en,.w-es,.w-cat,.w-rk,.w-ex,.p-en,.p-es,.p-mold,.p-meta,.tag';

const CUPO_GL = 6;   // marcas por termino y pestaña
function glAutoMarcar(root, maxPorTermino = CUPO_GL){
  if(!root) return 0;
  const usados = Object.create(null);
  /* El cupo arranca contando lo que ya puso ESTE marcador (data-auto), para
     que repasar una pestaña al abrirla no acumule marcas.
     Las marcas escritas a mano en el HTML NO cuentan: son deliberadas, y si
     gastaran cupo le robarían el sitio a las automáticas — fue justo lo que
     dejó sin «?» la palabra «auxiliar» de la fila de `not`. */
  /* Y como mucho UNA marca por término dentro del mismo elemento, para que un
     párrafo denso no se lleve todo el cupo y deje sin «?» a las menciones de
     más abajo — que es lo que pasó con «auxiliar» en las filas de la tabla. */
  const porBloque = new WeakMap();
  const yaEn = el => { let s = porBloque.get(el); if(!s){ s = new Set(); porBloque.set(el, s); } return s; };
  root.querySelectorAll('.gl[data-auto]').forEach(el => {
    usados[el.dataset.glo] = (usados[el.dataset.glo] || 0) + 1;
    if(el.parentElement) yaEn(el.parentElement).add(el.dataset.glo);
  });
  let hechos = 0;

  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n){
      if(!n.nodeValue || n.nodeValue.length < 5) return NodeFilter.FILTER_REJECT;
      if(!n.parentElement || n.parentElement.closest(GL_NO)) return NodeFilter.FILTER_REJECT;
      return GL_RE.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });

  const pend = [];
  while(w.nextNode()) pend.push(w.currentNode);

  for(const n of pend){
    if(!n.parentNode) continue;
    const m = GL_RE.exec(n.nodeValue);
    if(!m) continue;
    const clave = GL_CLAVE.get(m[1].toLowerCase());

    const despues = n.splitText(m.index);
    const cola = despues.splitText(m[1].length);   // lo que queda por detrás

    /* La cola vuelve a la cola. Antes se marcaba SOLO la primera coincidencia
       de cada nodo de texto, así que en un párrafo que nombra tres términos
       los otros dos no se marcaban nunca: por eso fichas como «continuo»,
       «comparativo» o «superlativo» existían y no había forma de abrirlas.
       Termina siempre: cada vuelta consume al menos el término encontrado. */
    if(cola && cola.nodeValue && cola.nodeValue.length >= 5) pend.push(cola);

    if(!clave) continue;
    const bloque = despues.parentNode;
    if(bloque && bloque.nodeType === 1 && yaEn(bloque).has(clave)) continue;   // ya hay una aquí
    if((usados[clave] = (usados[clave] || 0) + 1) > maxPorTermino) continue;
    if(bloque && bloque.nodeType === 1) yaEn(bloque).add(clave);

    const b = document.createElement('span');
    b.className = 'gl'; b.setAttribute('data-glo', clave);
    b.setAttribute('data-auto', '1');        // puesta por el marcador, no a mano
    b.textContent = despues.nodeValue;
    despues.parentNode.replaceChild(b, despues);
    hechos++;
  }
  return hechos;
}

/* ══════════════════ FICHAS DE LAS PIEZAS ══════════════════ */
const PZ = (() => {
  let abierta = 'aux';   // arranca abierta la del auxiliar: es la que genera la duda

  const exHTML = ex => ex.map(e =>
    `<div class="fp-ex"><span class="fp-en">${esc(e.en)}</span><button class="spk sm" data-say="${esc(e.en)}">🔊</button><span class="fp-es">${e.es}</span></div>`).join('');

  function render(){
    const c = $('fpBox'); if(!c) return;
    c.innerHTML = PIEZAS.map(p => {
      const on = p.id === abierta;
      return `<div class="fp${on ? ' on' : ''}" data-ficha="${p.id}">
        <button class="fp-h" data-fichah="${p.id}">
          <span class="slot ${p.cls}">${esc(p.n)}</span>
          <span class="fp-sub">${esc(p.sub)}</span>
          <span class="fp-when ${p.tono}">${p.cuando}</span>
          <span class="fp-ar">${on ? '▲' : '▼'}</span>
        </button>
        <div class="fp-b"${on ? '' : ' hidden'}>
          <div class="fp-simple"><b>En palabras simples:</b> ${p.simple}</div>
          ${p.casos.map((k, i) => `<div class="fp-caso">
            <div class="fp-ct"><span class="fp-cn">${i + 1}</span>${k.t}</div>
            ${k.d ? `<div class="fp-cd">${k.d}</div>` : ''}
            ${exHTML(k.ex)}
          </div>`).join('')}
          ${p.extra ? `<div class="fp-caso extra">
            <div class="fp-ct"><span class="fp-cn">★</span>${p.extra.t}</div>
            <div class="fp-cd">${p.extra.d}</div>${exHTML(p.extra.ex)}</div>` : ''}
          <div class="fp-regla"><b>🔒 Regla no negociable:</b> ${p.regla}</div>
          <div class="fp-err">
            <div class="fp-et">⚠️ El error típico del hispanohablante</div>
            <div class="fp-ep"><span class="dx-bad">✗ ${esc(p.error.mal)}</span><span class="dx-good">✓ ${esc(p.error.bien)}</span></div>
            <div class="fp-ew">${p.error.por}</div>
          </div>
          <div class="fp-tip"><b>💡 Tip:</b> ${p.tip}</div>
        </div></div>`;
    }).join('');

    glAutoMarcar(c, 1);
    c.querySelectorAll('[data-fichah]').forEach(b => b.onclick = () => {
      abierta = (abierta === b.dataset.fichah) ? null : b.dataset.fichah;
      render();
    });
  }
  function abrir(id){ abierta = id; render();
    const el = document.querySelector(`[data-ficha="${id}"]`);
    if(el) el.scrollIntoView({ behavior:'smooth', block:'start' });
  }
  return { render, abrir };
})();

/* Los colores de la leyenda llevan a su ficha */
document.addEventListener('click', e => {
  const g = e.target.closest('[data-pieza]');
  if(g && typeof PZ !== 'undefined') PZ.abrir(g.getAttribute('data-pieza'));
});








/* ══════════════════════════════════════════════════════════════════════
   MARCADORES DE TIEMPO · el tiempo verbal tiene que casar con el «cuándo»
   ──────────────────────────────────────────────────────────────────────
   Miguel escribió «Tengo hambre ayer» / «I'm hungry yesterday» y las dos
   salieron verdes. Ninguno de los dos analizadores comprobaba lo más
   básico: si dices AYER, el verbo va en pasado.

   El dato ya estaba en el documento — cada tiempo del Laboratorio lleva su
   campo `pistas` («yesterday · last week · in 2020 · two days ago»). Lo
   tenía como explicación y nunca lo usé como comprobación.
════════════════════════════════════════════════════════════════════════ */
const MARC = (() => {
  const DIA = '(monday|tuesday|wednesday|thursday|friday|saturday|sunday)';
  const EN_PAS = new RegExp('\\b(yesterday|the day before yesterday|last\\s+(night|week|month|year|summer|winter|time|' + DIA + ')|' +
    '(\\d+|a|two|three|four|five|six|ten|twenty)\\s+(second|minute|hour|day|week|month|year)s?\\s+ago|in\\s+(19|20)\\d\\d)\\b', 'i');
  const EN_FUT = new RegExp('\\b(tomorrow|the day after tomorrow|next\\s+(week|month|year|summer|winter|time|' + DIA + ')|' +
    'soon)\\b', 'i');
  const EN_AHORA = /\b(right now|at the moment|at present|currently)\b/i;

  const ES_PAS = /\b(ayer|anteayer|anoche|antenoche|la\s+semana\s+pasada|el\s+(mes|año)\s+pasado|hace\s+(\d+|un|una|dos|tres|cuatro|cinco|diez)\s+(segundo|minuto|hora|día|semana|mes|año)s?|en\s+(19|20)\d\d)\b/i;
  const ES_FUT = /\b(mañana|pasado\s+mañana|la\s+semana\s+que\s+viene|la\s+próxima\s+semana|el\s+(mes|año)\s+que\s+viene|pronto|dentro\s+de)\b/i;

  /* «Desde ayer trabajo aquí» y «Since yesterday I've been here» SÍ llevan
     presente/perfecto: el marcador es un punto de partida, no un momento
     cerrado. Sin esta guarda se marcarían frases correctas. */
  const EN_ARRANQUE = /\b(since|from|until|till|up to)\b/i;
  const ES_ARRANQUE = /\b(desde|hasta)\b/i;

  return { EN_PAS, EN_FUT, EN_AHORA, ES_PAS, ES_FUT, EN_ARRANQUE, ES_ARRANQUE };
})();

/* ── Inglés: convierte a pasado lo que se pueda, para poder ofrecer el ✓ ── */
function aPasadoEN(pal){
  const M = { am:'was', is:'was', are:'were', "'m":'was',
              have:'had', has:'had', do:'did', does:'did',
              will:'would', can:'could' };
  let hecho = false;
  const out = pal.map(w => {
    if(M[w] && !hecho){ hecho = true; return M[w]; }
    return w;
  });
  if(!hecho){
    // Sin auxiliar: se pasa el verbo principal a su forma de pasado
    for(let i = 0; i < out.length; i++){
      const w = out[i];
      if(LEX.AUX.has(w) || LEX.SUJ.has(w) || LEX.WH.has(w)) continue;
      const r = LEX.raiz(w);
      if(r && LEX.verboConocido(r) && !LEX.esV2(w)){ out[i] = LEX.conj(r, 'v2'); hecho = true; break; }
    }
  }
  if(!hecho) return null;
  let s = out.join(' ').replace(/\s+/g, ' ').trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ── Español: presente → pasado. Los irregulares más usados van a mano
     porque son justo los que más aparecen. ── */
const ES_A_PASADO = {
  tengo:'tenía', tienes:'tenías', tiene:'tenía', tenemos:'teníamos', tienen:'tenían',
  soy:'era', eres:'eras', es:'era', somos:'éramos', son:'eran',
  estoy:'estaba', estás:'estabas', está:'estaba', estamos:'estábamos', están:'estaban',
  voy:'iba', vas:'ibas', va:'iba', vamos:'íbamos', van:'iban',
  hago:'hacía', haces:'hacías', hace:'hacía', hacemos:'hacíamos', hacen:'hacían',
  puedo:'podía', puedes:'podías', puede:'podía', podemos:'podíamos', pueden:'podían',
  quiero:'quería', quieres:'querías', quiere:'quería', queremos:'queríamos', quieren:'querían',
  sé:'sabía', sabes:'sabías', sabe:'sabía', sabemos:'sabíamos', saben:'sabían',
  digo:'decía', dices:'decías', dice:'decía', decimos:'decíamos', dicen:'decían',
  veo:'veía', ves:'veías', ve:'veía', vemos:'veíamos', ven:'veían',
  hay:'había', doy:'daba', da:'daba', pongo:'ponía', pone:'ponía',
  vengo:'venía', viene:'venía', salgo:'salía', sale:'salía'
};
/* Presentes irregulares que hay que reconocer aunque su terminación engañe */
const ES_PRESENTE = new Set(Object.keys(ES_A_PASADO));

/* ══════════════════════════════════════════════════════════════════════
   MOTOR v2 · cadena verbal, léxico ampliado y sugerencias
   ──────────────────────────────────────────────────────────────────────
   Origen: Miguel escribió «Why do you aren't finished your university?» y
   el corrector la dio por BUENA. Es una frase rota — tiene DOS auxiliares
   conjugados pegados — y ninguna de las 15 reglas lo miraba.

   La pieza que faltaba: en inglés el grupo verbal tiene un orden fijo
        [modal] [have] [be-progresivo] [be-pasivo] VERBO
   y solo puede haber UN auxiliar conjugado por oración. Además `do/does/did`
   es un motor de arranque de emergencia: si ya hay otro auxiliar, sobra.
   Eso es lo que ahora se comprueba, y es lo que caza este tipo de frase.
════════════════════════════════════════════════════════════════════════ */

/* Verbos frecuentes que no estaban entre las 2000. Sin esto el corrector no
   reconocía «missed», «finished» o «reschedule» y no podía ni analizarlos. */
const VERBOS_EXTRA = `finish miss reschedule depend arrive decide explain improve manage
prepare receive remember repeat report require return solve suggest support travel
visit wait watch worry accept achieve add admit affect agree allow announce apply
approve argue arrange attend avoid belong borrow calculate cancel carry cause change
check choose clean climb close collect compare complain complete confirm connect
consider contain continue control cook copy correct count cover create cross deliver
describe design destroy develop discover discuss divide download draw dream dress
drop earn enjoy enter establish examine exist expect experience explore express
fail fill finish fit fix follow forgive form gather generate greet guess handle
happen hate hesitate hire hope hurry identify imagine impress include increase
indicate influence inform insist install introduce invent invite involve join judge
jump kick kill knock last laugh launch lend lift like limit listen load lock look
maintain manage mark match matter measure mention mind move name need note notice
obtain occur offer open operate order organize owe own paint park participate pass
perform permit pick plan play point practice prefer prepare present press prevent
print produce promise propose protect prove provide publish pull push raise reach
realize recognize recommend record reduce refer reflect refuse regret reject relate
relax release remain remind remove rent repair replace reply represent request
rescue reserve resist respond rest result reveal review ring rise risk roll rub
rule save scan search seem select sell separate serve settle shape share shift ship
shop shout show shut sign sing sink skip slide slip smell smile smoke solve sort
sound spell spill split spoil spot spray spread stare start state stay steal step
stick stop store stretch strike struggle study submit succeed suffer suggest suit
supply suppose surprise survive swallow switch talk taste teach tend test thank
threaten throw tie touch train transfer translate travel treat trust try turn type
understand unite update upload use vary view visit vote wake walk wander want warn
wash waste watch wave wear weigh welcome win wish wonder work worry wrap write yell`
  .split(/\s+/).filter(Boolean);

/* Cuando una palabra no está en ninguna lista, la terminación dice bastante.
   No es adivinar: es lo que hace cualquier lector al toparse una palabra nueva. */
const SUFIJOS = [
  [/(tion|sion|ment|ness|ity|ance|ence|ship|hood|dom|ism|ist|er|or|ing)$/, 'sust'],
  [/(ous|ful|less|ive|able|ible|al|ic|ish|ary|ent|ant)$/, 'adj'],
  [/ly$/, 'adv'],
  [/(ize|ise|ify|ate|en)$/, 'verbo']
];

/* ─────────── LA CADENA VERBAL ─────────── */
const CADENA = (() => {
  // Formas que van CONJUGADAS: solo puede haber una por oración
  const FINITO = new Set(['am','is','are','was','were','do','does','did',
    'have','has','had','can','could','will','would','shall','should','may','might','must']);
  const NOFIN  = new Set(['be','been','being','have']);   // tras modal / tras have
  const MODAL  = new Set(['can','could','will','would','shall','should','may','might','must']);

  /* Corta en oraciones simples: cada una puede tener su propio auxiliar
     conjugado sin que eso sea un error («I don't know if he is coming»). */
  const CORTES = new Set([',',';','and','but','or','because','that','if','when','while',
    'so','although','though','since','before','after','until','unless','whether','who','which']);
  function clausulas(pal){
    const out = [[]];
    let vistoFin = false;
    pal.forEach((w, i) => {
      if(CORTES.has(w)){ out.push([]); vistoFin = false; return; }
      /* Oración incrustada sin «that»: «I'm afraid I can't». Un sujeto nuevo
         después de un verbo ya conjugado abre otra oración — salvo que venga
         justo detrás de un auxiliar, que es la inversión de las preguntas. */
      if(vistoFin && LEX.SUJ.has(w) && i > 0 && !LEX.AUX.has(pal[i-1])){
        out.push([]); vistoFin = false;
      }
      out[out.length-1].push(w);
      if(FINITO.has(w)) vistoFin = true;
    });
    return out.filter(c => c.length);
  }

  /* ¿Este `have` / `be` / `do` es AUXILIAR, o es el verbo de verdad?
     «Do you HAVE a reservation?» → have es «tener», no un auxiliar.
     «What do you DO?» → el segundo do es el verbo, no el motor.
     Sin esta distinción el validador marcaba media conversación como error. */
  function esAuxiliar(c, i){
    const w = c[i];
    if(!LEX.AUX.has(w)) return false;
    if(MODAL.has(w)) return true;
    let j = i + 1;
    while(j < c.length && (c[j] === 'not' || LEX.es(c[j], 'adv') || LEX.SUJ.has(c[j]))) j++;
    const sig = c[j];
    if(!sig) return false;                       // es el último verbo → es el principal
    if(LEX.AUX_DO.has(w))
      return LEX.AUX.has(sig) || (!!LEX.raiz(sig) && !LEX.es(sig, 'det'));
    if(LEX.AUX_HAVE.has(w))
      return LEX.esPP(sig) || sig === 'been' || sig === 'going';
    return LEX.esING(sig) || LEX.esPP(sig) || sig === 'going' || sig === 'been';
  }

  /* ¿Este auxiliar va conjugado, o cuelga de otro? «could HAVE told»: el have
     no está conjugado, lo está el could. */
  function finitos(c){
    const out = [];
    c.forEach((w, i) => {
      if(!FINITO.has(w)) return;
      let j = i - 1;
      while(j >= 0 && (c[j] === 'not' || LEX.es(c[j], 'adv'))) j--;
      const ant = j >= 0 ? c[j] : null;
      // have/be detrás de un modal, o be detrás de have, no están conjugados
      if(ant && (MODAL.has(ant) || (LEX.AUX_HAVE.has(ant) && NOFIN.has(w)))) return;
      out.push({ w, i });
    });
    return out;
  }

  /* Qué forma exige cada auxiliar de lo que viene detrás */
  function exigencias(c){
    const malas = [];
    c.forEach((w, i) => {
      let j = i + 1;
      while(j < c.length && (c[j] === 'not' || LEX.es(c[j], 'adv') ||
            LEX.SUJ.has(c[j]) || LEX.es(c[j], 'det') || LEX.es(c[j], 'pron'))) j++;
      const sig = c[j];
      if(!sig || LEX.AUX.has(sig) || sig === 'been' || sig === 'going') return;
      /* «sort of», «kind of», «type of»: delante de «of» no son verbos, son la
         muletilla de «algo asi». Las tres existen como verbo, asi que «It's sort
         of blue» pedia «is sorting». Va aqui ADEMAS de en el etiquetador: esta
         regla no usa aquel, tiene su propio criterio, y arreglarlo en un solo
         sitio deja el fallo vivo en el otro. */
      if(['sort','kind','type'].includes(sig) && c[j+1] === 'of') return;
      const raiz = LEX.raiz(sig);
      if(!raiz) return;
      /* Muchísimas palabras son verbo Y sustantivo o adjetivo («work»,
         «name», «welcome»). Si hay ambigüedad, o si viene detrás de un
         determinante («your name»), ahí es un nombre y no se toca:
         inventar un error es peor que dejar pasar uno. */
      if(LEX.es(sig, 'sust') || LEX.es(sig, 'adj')) return;
      const ant = j > 0 ? c[j-1] : null;
      if(ant && (LEX.es(ant, 'det') || ['your','my','his','her','our','their','its','a','an','the'].includes(ant))) return;
      /* Solo se exige la forma si el verbo es CONOCIDO de verdad. Si solo lo
         reconozco por la terminación (-ate, -en, -ify…), no tengo derecho a
         afirmar que su participio está mal: «passionate» no es un verbo. */
      if(!LEX.verboConocido(raiz)) return;
      /* Si detrás viene otro verbo, lo de en medio era el SUJETO, no el verbo:
         «How's work going?» → work es el sujeto, going es el verbo. */
      const tras = c[j+1];
      if(tras && LEX.raiz(tras) && (LEX.esING(tras) || LEX.esPP(tras))) return;
      /* Y «be + palabra final» es el verbo copulativo describiendo algo
         («You're welcome», «I'm ready»), no un tiempo verbal mal armado. */
      const esBe = ['am','is','are','was','were','been','being'].includes(w);
      let ult = c.length - 1;
      while(ult > 0 && !/[a-z]/.test(c[ult])) ult--;   // sin contar el punto final
      if(esBe && j === ult) return;
      if(MODAL.has(w) || LEX.AUX_DO.has(w)){
        if(sig !== raiz) malas.push({ aux:w, mal:sig, bien:raiz, pide:'el verbo desnudo (sin -s, -ed ni -ing)' });
      } else if(LEX.AUX_HAVE.has(w)){
        const pps = LEX.formasValidas(raiz, 'pp');
        if(!pps.has(sig)) malas.push({ aux:w, mal:sig, bien:LEX.conj(raiz,'pp'), pide:'el participio' });
      } else if(['am','is','are','was','were','been','being'].includes(w)){
        const ok = new Set([...LEX.formasValidas(raiz,'ing'), ...LEX.formasValidas(raiz,'pp')]);
        if(!ok.has(sig)) malas.push({ aux:w, mal:sig, bien:LEX.conj(raiz,'ing'), pide:'el verbo en -ing (o el participio, si es voz pasiva)' });
      }
    });
    return malas;
  }

  function revisar(pal){
    const H = [];
    clausulas(pal).forEach(c => {
      // Solo cuentan los que están haciendo de AUXILIAR de verdad
      const idxAux = c.map((w, i) => esAuxiliar(c, i) ? i : -1).filter(i => i >= 0);
      const fin = finitos(c).filter(x => idxAux.includes(x.i));
      const conDo = idxAux.filter(i => LEX.AUX_DO.has(c[i])).map(i => c[i]);
      const otros = idxAux.filter(i => !LEX.AUX_DO.has(c[i]) && c[i] !== 'been' && c[i] !== 'being').map(i => c[i]);

      /* Excepción: el imperativo negativo. «Don't be worried», «Don't be late»
         llevan do + be y son correctos — el do no está ahí para marcar tiempo,
         sino para negar una orden. Se reconoce porque la cláusula arranca con
         el do y no tiene sujeto delante. */
      const esNeg = w => /^(n['’]?t|not)$/.test(w || '');
      const ordenNegada = /^(do|does|did)(n['’]?t)?$/.test(c[0] || '')
                       && c[esNeg(c[1]) ? 2 : 1] === 'be';

      // 1 · do/does/did no convive con otro auxiliar
      if(conDo.length && otros.length && !ordenNegada)
        H.push({ sev:'rojo', regla:'R-cadena', t:'Dos motores en la misma frase',
          por:'<b>' + conDo[0] + '</b> es el motor de arranque de emergencia: solo entra cuando la frase <b>no tiene</b> ningún otro auxiliar. Aquí ya está <b>' + otros[0] + '</b>, así que el <i>' + conDo[0] + '</i> sobra. Uno u otro, nunca los dos.',
          mal: conDo[0] + ' … ' + otros[0], bien: 'solo ' + otros[0] });

      // 2 · un solo auxiliar conjugado por oración
      else if(fin.length > 1)
        H.push({ sev:'rojo', regla:'R-cadena', t:'Dos verbos conjugados pegados',
          por:'Una oración lleva <b>un solo</b> verbo conjugado. Aquí hay dos: <b>' + fin[0].w + '</b> y <b>' + fin[1].w + '</b>. El segundo tendría que ir en participio o en -ing, o sobra uno.',
          mal: fin.map(x => x.w).join(' … '), bien: 'deja solo uno conjugado' });

      // 3 · cada auxiliar pide una forma concreta
      exigencias(c).forEach(m =>
        H.push({ sev:'rojo', regla:'R-forma', t:'Después de «' + m.aux + '» va ' + m.pide,
          por:'Cada auxiliar manda sobre la forma del verbo que le sigue. <b>' + m.aux + '</b> pide ' + m.pide + '.',
          mal: m.aux + ' ' + m.mal, bien: m.aux + ' ' + m.bien }));
    });
    return H;
  }
  return { revisar, clausulas, finitos };
})();

/* ─────────── SUGERENCIAS · «¿quieres decir…?» ───────────
   Del destrozo se extrae la INTENCIÓN (quién, qué acción, negada o no, qué
   pregunta) y se reconstruyen frases correctas con el mismo generador que
   produce las 640 del Laboratorio. Así la sugerencia no es una adivinanza:
   sale de una gramática ya verificada. */
const SUG = (() => {
  const PARTICIPIO_PISTA = ['perf','past','pastperf'];   // el pasado simple es mucho mas frecuente que el perfecto
  const ING_PISTA        = ['cont','pastcont','perfcont'];
  const BASE_PISTA       = ['pres','past','fut','going'];

  /* Saca sujeto, verbo principal, complemento, WH y si va negada */
  function intencion(pal){
    const wh = LEX.WH.has(pal[0]) ? pal[0] : null;
    const neg = pal.includes('not');
    const iSuj = pal.findIndex(w => LEX.SUJ.has(w) && !LEX.WH.has(w));
    const suj = iSuj > -1 ? pal[iSuj] : 'you';

    // El verbo principal es el primero que NO es auxiliar
    let ver = null, forma = 'base';
    for(let i = 0; i < pal.length; i++){
      const w = pal[i];
      if(LEX.AUX.has(w) || w === 'been' || w === 'going' || w === 'not' || LEX.SUJ.has(w) || LEX.WH.has(w)) continue;
      // Basta con que raiz() lo reconozca: «finished» no está en el diccionario
      // como tal, pero su raíz «finish» sí, y eso ya prueba que es un verbo.
      const r = LEX.raiz(w);
      if(r){
        ver = r;
        forma = LEX.esING(w) ? 'ing' : (w !== r ? 'pp' : 'base');
        // El resto es el complemento
        var resto = pal.slice(i + 1).filter(x => /[a-z]/.test(x));
        break;
      }
    }
    let pista = null;
    if(!ver){
      /* Aqui do/have/be no estan ayudando a nadie: son el verbo de verdad.
         «What you did yesterday?» = que HICISTE ayer. */
      const i = pal.findIndex(w => LEX.AUX_DO.has(w) || LEX.AUX_HAVE.has(w));
      if(i > -1){
        ver = LEX.AUX_DO.has(pal[i]) ? 'do' : 'have';
        forma = 'base';
        pista = ['did','had','was','were'].includes(pal[i]) ? ['past','perf','pastperf'] : null;
        resto = pal.slice(i + 1).filter(x => /[a-z]/.test(x));
      }
    }
    if(!ver) return null;
    let com = (resto || []).join(' ').trim();
    return { wh, neg, suj, ver, forma, com, pista };
  }

  /* «finish your university» no se dice: en inglés se estudia/termina
     university sin posesivo, igual que se va to school o to work. */
  const SIN_POSESIVO = new Set(['university','school','college','church','hospital','bed','home','work','class']);
  function limpiarCom(com){
    let c = com;
    SIN_POSESIVO.forEach(n => {
      c = c.replace(new RegExp('\\b(your|my|his|her|our|their|the)\\s+' + n + '\\b', 'gi'), n);
    });
    // Si la sugerencia repitiera el error que acabo de marcar, no serviría de nada
    c = c.replace(/\bsince\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(year|month|week|day|hour)/gi, 'for $1 $2');
    // Los idiomas van con mayúscula: se pierde al pasar todo a minúsculas
    c = c.replace(/\b(english|spanish|french|german|italian|portuguese|chinese|japanese)\b/g,
                  m => m.charAt(0).toUpperCase() + m.slice(1));
    return c.replace(/\s+/g, ' ').trim();
  }

  function candidatas(pal, esPregunta){
    const it = intencion(pal);
    if(!it || !it.ver) return [];
    // «What happened?» / «Who works here?»: el WH es el sujeto, no hay nada que rehacer
    if((it.wh === 'who' || it.wh === 'what') &&
       !pal.some((w, n) => n > 0 && LEX.SUJ.has(w) && !LEX.WH.has(w))) return [];
    const com = limpiarCom(it.com);
    const p = ['he','she','it'].includes(it.suj) ? 3 : 1;
    const base = {
      suj: it.suj.charAt(0).toUpperCase() + it.suj.slice(1), p,
      ver: it.ver, vs: LEX.conj(it.ver, 's'), v2: LEX.conj(it.ver, 'v2'),
      ving: LEX.conj(it.ver, 'ing'), vpp: LEX.conj(it.ver, 'pp'),
      com: com || '', wh: it.wh ? it.wh.charAt(0).toUpperCase() + it.wh.slice(1) : 'What',
      whDrop: com ? 0 : 1              // sin complemento no se deja el hueco vacío
    };
    const f = it.wh ? 'wh' : (esPregunta ? 'pr' : (it.neg ? 'ne' : 'af'));

    /* Si usaste un modal, ese modal ES tu intención: «Do you can help me?»
       quiere decir «Can you help me?». Se arma a mano porque el generador
       del Laboratorio no cubre modales sueltos. */
    const MOD = ['can','could','should','would','must','may','might','will'];
    const modal = pal.find(w => MOD.includes(w));
    if(modal){
      const v = it.ver, S = base.suj, C = com ? ' ' + com : '';
      const neg = it.neg ? "n't" : '';
      let fm;
      if(it.wh)          fm = base.wh + ' ' + modal + neg + ' ' + S.toLowerCase() + ' ' + v + C + '?';
      else if(esPregunta)fm = modal.charAt(0).toUpperCase() + modal.slice(1) + neg + ' ' + S.toLowerCase() + ' ' + v + C + '?';
      else               fm = S + ' ' + modal + neg + ' ' + v + C + '.';
      return [{ frase: fm.replace(/\s+/g, ' ').replace(/ ([.?])/g, '$1'),
                tiempo: 'modal',
                info: { n:'Modal · ' + modal,
                        cuando:'Los modales cambian el <b>tono</b>: si puedes, si debes, si quizá. Van con el verbo desnudo, sin <i>to</i> y sin <i>-s</i>, y <b>no admiten do/does/did</b> delante.' } }];
    }
    // En pregunta WH la negación se conserva usando la forma negativa contraída
    const tiempos = it.pista ? it.pista
                  : (it.forma === 'pp' ? PARTICIPIO_PISTA
                   : it.forma === 'ing' ? ING_PISTA : BASE_PISTA);

    const out = [];
    tiempos.slice(0, 3).forEach(t => {
      try{
        const g = LAB.generar(base, t, f);
        let frase = g.frase;
        // Si el original negaba y la forma generada no lo hace, se inyecta el not
        if(it.neg && !/n't|not/.test(frase)){
          const gn = LAB.generar(base, t, f === 'af' ? 'ne' : f);
          frase = negarPregunta(base, t, f) || gn.frase;
        }
        if(frase && !out.some(x => x.frase === frase))
          out.push({ frase, tiempo: t, info: g.info, porque: g.porque });
      }catch(e){}
    });
    return out;
  }

  /* «Why haven't you finished university?» — la negación en una pregunta va
     contraída y pegada al auxiliar, delante del sujeto. */
  function negarPregunta(base, t, f){
    if(f !== 'wh' && f !== 'pr') return null;
    const g = LAB.generar(base, t, f);
    const tk = g.tokens.filter(x => x.r !== 'q');
    const iAux = tk.findIndex(x => x.r === 'aux');
    if(iAux < 0) return null;
    const CONTR = { do:"don't", does:"doesn't", did:"didn't", is:"isn't", are:"aren't",
      am:"am not", was:"wasn't", were:"weren't", have:"haven't", has:"hasn't", had:"hadn't",
      will:"won't", would:"wouldn't" };
    const neg = CONTR[tk[iAux].t];
    if(!neg) return null;
    const partes = tk.map((x, i) => {
      if(i === iAux) return neg;
      return (x.r === 'suj' && i > 0 && x.t !== 'I') ? x.t.toLowerCase() : x.t;
    });
    let s = partes.join(' ').replace(/\s+/g, ' ').trim();
    s = s.charAt(0).toUpperCase() + s.slice(1);
    return s + '?';
  }
  return { candidatas, intencion, limpiarCom };
})();

/* ══════════════════════════════════════════════════════════════════════
   MÓDULO ESCRIBIR · el corrector con semáforo
   ──────────────────────────────────────────────────────────────────────
   Escribes en inglés → te dice si está bien, qué regla rompiste y por qué.
   Escribes en español → te da el inglés y te explica su estructura.

   DECISIÓN DE DISEÑO (regla P1 del proyecto: ningún tercero en el camino
   crítico): el ANALIZADOR es 100% local y determinista — funciona sin
   internet, siempre. La traducción es un apoyo que se pide a la red; si
   falla, se dice claramente y todo lo demás sigue funcionando.

   El análisis se apoya en lo que ya existe en el documento:
   · las 2000 palabras traen su categoría (491 verbos, 877 sustantivos,
     241 adjetivos, 28 preposiciones…): ese es el diccionario del corrector
   · las 15 reglas no negociables son los chequeos
   · los tiempos y sus explicaciones se reutilizan de LAB_T, no se repiten
════════════════════════════════════════════════════════════════════════ */

/* Verbos irregulares · base, pasado, participio. Sin esto el corrector
   confundiría "went" con una palabra desconocida y no vería "Did you went". */
const IRREG_RAW = `be|was|been;have|had|had;do|did|done;go|went|gone;say|said|said;get|got|gotten;
make|made|made;know|knew|known;think|thought|thought;take|took|taken;see|saw|seen;come|came|come;
want|wanted|wanted;give|gave|given;find|found|found;tell|told|told;become|became|become;
leave|left|left;feel|felt|felt;put|put|put;bring|brought|brought;begin|began|begun;keep|kept|kept;
hold|held|held;write|wrote|written;stand|stood|stood;hear|heard|heard;let|let|let;mean|meant|meant;
set|set|set;meet|met|met;run|ran|run;pay|paid|paid;sit|sat|sat;speak|spoke|spoken;lie|lay|lain;
lead|led|led;read|read|read;grow|grew|grown;lose|lost|lost;fall|fell|fallen;send|sent|sent;
build|built|built;understand|understood|understood;draw|drew|drawn;break|broke|broken;
spend|spent|spent;cut|cut|cut;rise|rose|risen;drive|drove|driven;buy|bought|bought;
wear|wore|worn;choose|chose|chosen;seek|sought|sought;throw|threw|thrown;catch|caught|caught;
deal|dealt|dealt;win|won|won;forget|forgot|forgotten;lay|laid|laid;sell|sold|sold;
fight|fought|fought;bear|bore|borne;teach|taught|taught;eat|ate|eaten;sleep|slept|slept;
drink|drank|drunk;swim|swam|swum;sing|sang|sung;ring|rang|rung;fly|flew|flown;
hide|hid|hidden;ride|rode|ridden;shake|shook|shaken;steal|stole|stolen;
hurt|hurt|hurt;cost|cost|cost;hit|hit|hit;shut|shut|shut;quit|quit|quit;
spread|spread|spread;beat|beat|beaten;bite|bit|bitten;blow|blew|blown;
freeze|froze|frozen;wake|woke|woken;prove|proved|proven`;

/* Incontables: nunca llevan -s. Es de los errores más constantes del
   hispanohablante porque en español SÍ se cuentan («un consejo, dos consejos»). */
/* Solo los que NO tienen ningún sentido contable. Quedaron fuera work, time,
   experience, help, love, water, paper, hair, money, music, damage… porque sí
   se cuentan en algún uso y hacían saltar el corrector con frases correctas
   («It works», «three times»). Medido contra las 1000 frases del documento. */
const UNCOUNT = `advice information furniture homework knowledge luggage baggage equipment
research progress traffic weather bread rice sugar salt evidence feedback software
accommodation permission`.split(/\s+/);

/* Trampas de traducción literal desde el español. Cada una es un patrón que,
   cuando aparece, es error casi seguro — por eso van en rojo. */
const TRAMPAS = [
  // Exige «years»: «I have one brother» no es la edad y no debe saltar
  { re:/\b(i|you|we|they|he|she)\s+(have|has)\s+(\d+|twenty|thirty|forty|fifty)\s+years?\b/i,
    regla:'R13', t:'La edad se TIENE con «be», no con «have»',
    por:'En español «tengo 30 años»; en inglés se <b>es</b> esa edad, no se tiene. Igual con el hambre, el frío, el calor, la sed y el miedo.',
    mal:'I have 30 years.', bien:'I am 30. · I am 30 years old.' },
  { re:/\b(i|you|we|they|he|she)\s+(have|has)\s+(hungry|cold|hot|thirsty|sleepy|afraid|scared|lucky|right|wrong)\b/i,
    regla:'R13', t:'Estas sensaciones van con «be»',
    por:'«Tengo hambre / frío / miedo» se dice con <b>be</b>: <i>I am hungry</i>. Con «have» estarías diciendo que posees el hambre.',
    mal:'I have hungry.', bien:'I am hungry.' },
  { re:/\b(i|you|we|they)\s+am\s+agree\b|\b(i)\s+am\s+agree\b/i,
    regla:'R-calco', t:'«Agree» ya es el verbo: no lleva «be»',
    por:'<i>Agree</i> significa «estar de acuerdo» él solito. Ponerle <i>am</i> delante es decir «yo soy estar de acuerdo».',
    mal:'I am agree.', bien:'I agree.' },
  { re:/\bthe\s+people\s+(is|was)\b|\bpeople\s+(is|was)\b/i,
    regla:'R14', t:'«People» ya es plural',
    por:'<i>People</i> es el plural de <i>person</i>. Pide verbo en plural: <b>are</b>, <b>were</b>.',
    mal:'The people is waiting.', bien:'The people are waiting.' },
  { re:/\bdepends?\s+of\b/i, regla:'R-prep', t:'«Depend» va con ON, no con OF',
    por:'La preposición no se traduce una por una. «Depende <b>de</b>» es <i>depends <b>on</b></i>.',
    mal:'It depends of you.', bien:'It depends on you.' },
  { re:/\bmarried\s+with\b/i, regla:'R-prep', t:'«Married» va con TO',
    por:'«Casado <b>con</b>» es <i>married <b>to</b></i>, no <i>with</i>.',
    mal:'She is married with him.', bien:'She is married to him.' },
  { re:/\bsince\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(year|month|week|day|hour)s?\b/i,
    regla:'R-since', t:'Duración va con FOR, no con SINCE',
    por:'<b>since</b> es para un punto de partida (<i>since 2020</i>, <i>since Monday</i>). Para una <b>duración</b> va <b>for</b>: <i>for two years</i>.',
    mal:'I work here since two years.', bien:'I have been working here for two years.' },
  { re:/\bthe\s+most\s+(big|small|old|young|fast|easy|hard|tall|short|nice|cheap)\b/i,
    regla:'R-super', t:'Adjetivo corto: -est, no «the most»',
    por:'Los adjetivos de una sílaba forman el superlativo con <b>-est</b>: <i>the bigg<b>est</b></i>. «the most» es para los largos.',
    mal:'the most big', bien:'the biggest' },
  { re:/\bmore\s+(better|worse|bigger|older|easier)\b/i,
    regla:'R-comp', t:'No se compara dos veces',
    por:'<i>better</i> ya significa «mejor». <i>more better</i> es como decir «más mejor».',
    mal:'more better', bien:'better' },
  { re:/\bexplain\s+me\b|\bsay\s+me\b/i, regla:'R-prep', t:'«Explain» necesita TO',
    por:'<i>explain</i> y <i>say</i> no llevan la persona pegada: va <b>to me</b>. (<i>tell</i> sí: <i>tell me</i>.)',
    mal:'Explain me this.', bien:'Explain this to me. · Tell me this.' },
  { re:/\b(with|for|to|about|from)\s+(who|what)\s+(is|are|am|do|does|did|will|would|have|has)\b/i,
    regla:'R15', t:'La preposición se queda al FINAL',
    por:'En español la preposición viaja con la pregunta («¿<b>Con</b> quién…?»). En inglés se queda plantada al final.',
    mal:'With who are you going?', bien:'Who are you going with?' }
];

/* ─────────── El diccionario del corrector, armado de las 2000 palabras ─────────── */
const LEX = (() => {
  const POS = new Map();            // palabra -> Set de categorías
  WORDS.forEach(w => {
    const k = w.en.toLowerCase();
    if(!POS.has(k)) POS.set(k, new Set());
    POS.get(k).add(w.cat);
  });
  // Verbos frecuentes que no estaban en las 2000: sin ellos el corrector no
  // reconocía «finished» ni «missed» y no podía analizarlos.
  (typeof VERBOS_EXTRA !== 'undefined' ? VERBOS_EXTRA : []).forEach(v => {
    if(!POS.has(v)) POS.set(v, new Set(['verbo'])); else POS.get(v).add('verbo');
  });
  const V2 = new Map(), PP = new Map(), BASE = new Map();
  IRREG_RAW.replace(/\s+/g, '').split(';').filter(Boolean).forEach(r => {
    const [b, v2, vpp] = r.split('|');
    if(!b) return;
    BASE.set(b, { v2, vpp }); V2.set(v2, b); PP.set(vpp, b);
    if(!POS.has(b)) POS.set(b, new Set(['verbo'])); else POS.get(b).add('verbo');
  });

  const AUX_BE   = new Set(['am','is','are','was','were','be','been','being']);
  const AUX_HAVE = new Set(['have','has','had']);
  const AUX_DO   = new Set(['do','does','did']);
  const MODAL    = new Set(['can','could','will','would','shall','should','may','might','must']);
  const AUX = new Set([...AUX_BE, ...AUX_HAVE, ...AUX_DO, ...MODAL]);
  const SUJ = new Set(['i','you','he','she','it','we','they','there','this','that','these','those','who','someone','somebody','everyone','everybody','nobody','nothing','something']);
  const TERCERA = new Set(['he','she','it','this','that','someone','somebody','everyone','everybody','nobody']);
  const WH = new Set(['what','where','when','who','why','which','how','whose','whom']);
  const NEGS = new Set(['never','nothing','nobody','none','nowhere','neither','no']);
  // Preposiciones tras las que el verbo va en -ing. «to» queda fuera: es infinitivo.
  const PREP_ING = new Set(['for','of','about','without','before','after','by','in','on','at','with','from','instead']);

  /* Si la palabra no está en ninguna lista, la terminación dice bastante.
     No es inventar: es lo que hace cualquiera al toparse una palabra nueva. */
  function porSufijo(w){
    const s = new Set();
    if(typeof SUFIJOS !== 'undefined')
      for(const [re, c] of SUFIJOS) if(re.test(w)){ s.add(c); break; }
    return s;
  }
  const cat = w => POS.get(w) || porSufijo(w);
  const es  = (w, c) => cat(w).has(c);
  const esVerbo = w => es(w, 'verbo') || BASE.has(w) || V2.has(w) || PP.has(w);

  /* De una forma conjugada al infinitivo. Devuelve null si no parece verbo. */
  function raiz(w){
    if(V2.has(w)) return V2.get(w);
    if(PP.has(w)) return PP.get(w);
    if(/ied$/.test(w)  && esVerbo(w.slice(0,-3) + 'y')) return w.slice(0,-3) + 'y';
    if(/ed$/.test(w)   && esVerbo(w.slice(0,-2))) return w.slice(0,-2);
    if(/ed$/.test(w)   && esVerbo(w.slice(0,-1))) return w.slice(0,-1);
    if(/([bdgklmnprt])\1ed$/.test(w) && esVerbo(w.slice(0,-3))) return w.slice(0,-3);
    if(/ying$/.test(w) && esVerbo(w.slice(0,-4) + 'ie')) return w.slice(0,-4) + 'ie';
    if(/ing$/.test(w)  && esVerbo(w.slice(0,-3))) return w.slice(0,-3);
    if(/ing$/.test(w)  && esVerbo(w.slice(0,-3) + 'e')) return w.slice(0,-3) + 'e';
    if(/([bdgklmnprt])\1ing$/.test(w) && esVerbo(w.slice(0,-4))) return w.slice(0,-4);
    if(/ies$/.test(w)  && esVerbo(w.slice(0,-3) + 'y')) return w.slice(0,-3) + 'y';
    if(/(es)$/.test(w) && esVerbo(w.slice(0,-2))) return w.slice(0,-2);
    if(/s$/.test(w)    && esVerbo(w.slice(0,-1))) return w.slice(0,-1);
    if(esVerbo(w)) return w;              // ya estaba en infinitivo
    return null;
  }
  /* ¿Es este token un verbo EN CUALQUIER FORMA?
     `esVerbo` solo conoce las bases y los irregulares, así que «works»,
     «worked», «working» o «lived» no contaban como verbo — la mitad de las
     formas regulares. Consecuencia medida el 09-sep: con «she works here?»
     el motor decía «no reconocí el verbo» y se saltaba la regla de pregunta.
     No se toca `esVerbo` porque `raiz` lo usa por dentro y se entrarían a
     llamar en círculo; esto es una capa por encima. */
  const esVerboForma = w => esVerbo(w) || !!raiz(w);

  const esV2  = w => V2.has(w) || (/ed$/.test(w) && !!raiz(w));
  const esPP  = w => PP.has(w) || (/ed$/.test(w) && !!raiz(w));
  const esING = w => /ing$/.test(w) && !!raiz(w);
  const es3ra = w => /s$/.test(w) && !AUX.has(w) && !!raiz(w) && raiz(w) !== w;
  /* Verbo desnudo: la forma base, sin -s, -ed, -ing ni to */
  const esBase = w => esVerbo(w) && !esING(w) && !V2.has(w) && !PP.has(w) && !es3ra(w) && !/ed$/.test(w);

  /* 3ª forma correcta de un verbo, para poder proponer la corrección */
  function conj(b, forma){
    const irr = BASE.get(b);
    if(forma === 'v2')  return irr ? irr.v2  : (/e$/.test(b) ? b+'d' : /[^aeiou]y$/.test(b) ? b.slice(0,-1)+'ied' : b+'ed');
    if(forma === 'pp')  return irr ? irr.vpp : (/e$/.test(b) ? b+'d' : /[^aeiou]y$/.test(b) ? b.slice(0,-1)+'ied' : b+'ed');
    if(forma === 'ing') return /ie$/.test(b) ? b.slice(0,-2)+'ying' : /e$/.test(b) && b!=='be' ? b.slice(0,-1)+'ing' : b+'ing';
    if(forma === 's')   return /(s|sh|ch|x|z|o)$/.test(b) ? b+'es' : /[^aeiou]y$/.test(b) ? b.slice(0,-1)+'ies' : b+'s';
    return b;
  }
  /* Verbo CONOCIDO de verdad: está en el diccionario o en los irregulares.
     No cuenta el adivinado por terminación — si solo lo reconozco por el
     sufijo, no puedo afirmar que su participio está mal («passionate»). */
  const verboConocido = w => (POS.get(w) || new Set()).has('verbo') || BASE.has(w);

  /* Todas las formas ACEPTABLES, no solo la que yo generaría. */
  function formasValidas(b, tipo){
    const s = new Set([conj(b, tipo)]);
    const irr = BASE.get(b);
    if(irr) s.add(tipo === 'pp' ? irr.vpp : irr.v2);
    if(b === 'get'){ s.add('got'); s.add('gotten'); }
    if(tipo === 'pp' || tipo === 'v2'){
      s.add(b + 'ed');
      s.add(b + b.slice(-1) + 'ed');                  // permit → permitted
      if(/e$/.test(b)) s.add(b + 'd');
    }
    if(tipo === 'ing'){
      s.add(b + 'ing');
      s.add(b + b.slice(-1) + 'ing');                 // permit → permitting
      if(/e$/.test(b)) s.add(b.slice(0, -1) + 'ing');
    }
    return s;
  }
  return { POS, cat, es, esVerbo, esVerboForma, verboConocido, formasValidas, raiz, esV2, esPP, esING, es3ra, esBase, conj,
           AUX, AUX_BE, AUX_HAVE, AUX_DO, MODAL, SUJ, TERCERA, WH, NEGS, PREP_ING,
           UNCOUNT:new Set(UNCOUNT), BASE };
})();

/* ─────────── EL ANALIZADOR ─────────── */
const ANL = (() => {
  const CONTRA = {
    "don't":"do not","doesn't":"does not","didn't":"did not","isn't":"is not","aren't":"are not",
    "wasn't":"was not","weren't":"were not","haven't":"have not","hasn't":"has not","hadn't":"had not",
    "won't":"will not","wouldn't":"would not","can't":"can not","cannot":"can not","couldn't":"could not",
    "shouldn't":"should not","mustn't":"must not","shan't":"shall not",
    "i'm":"i am","you're":"you are","he's":"he is","she's":"she is","it's":"it is",
    "we're":"we are","they're":"they are","that's":"that is","there's":"there is","what's":"what is",
    "how's":"how is","where's":"where is","who's":"who is","when's":"when is","why's":"why is",
    "here's":"here is","she'd":"she would","he'd":"he would","we'd":"we would","they'd":"they would",
    "you'd":"you would","i've":"i have","you've":"you have","we've":"we have","they've":"they have",
    "i'll":"i will","you'll":"you will","he'll":"he will","she'll":"she will","it'll":"it will",
    "we'll":"we will","they'll":"they will","i'd":"i would","let's":"let us"
  };

  function frases(txt){
    return String(txt||'').split(/(?<=[.?!])\s+|\n+/).map(s=>s.trim()).filter(s=>s.length>1);
  }
  function tokenizar(f){
    const crudos = f.toLowerCase().match(/[a-záéíóúñü]+(?:'[a-z]+)?|[.?!,;:]/g) || [];
    const t = [];
    crudos.forEach(w => {
      if(CONTRA[w]) CONTRA[w].split(' ').forEach(p => t.push(p));
      else t.push(w);
    });
    return t;
  }

  /* Qué tiempo verbal está usando. Devuelve el id de LAB_T para poder
     reutilizar su explicación en vez de escribirla otra vez. */
  /* BUG que estuvo aquí desde el principio: para un verbo regular, «worked»
     es a la vez pasado y participio, así que la prueba «esV2 && !esPP» nunca
     se cumplía y TODA frase en pasado regular se leía como presente. Por eso
     «It happened two days ago» salía como «Presente simple». */
  function tiempo(t){
    const hay = w => t.includes(w);
    // ¿Hay un have/has/had haciendo de auxiliar (o sea, con participio detrás)?
    const iHave = t.findIndex((w, j) => LEX.AUX_HAVE.has(w) &&
      t.slice(j+1, j+4).some(x => LEX.esPP(x) || x === 'been'));
    if(hay('would')) return 'cond';
    if(hay('will'))  return 'fut';
    if(t.some((w,j)=>LEX.AUX_BE.has(w) && t[j+1]==='going' && t[j+2]==='to')) return 'going';
    if(iHave > -1 && t.slice(iHave+1, iHave+3).includes('been')) return 'perfcont';
    if(iHave > -1 && t[iHave] === 'had') return 'pastperf';
    if(iHave > -1) return 'perf';
    if(t.some((w,j)=>['was','were'].includes(w) && t.slice(j+1,j+3).some(LEX.esING))) return 'pastcont';
    if(t.some((w,j)=>['am','is','are'].includes(w) && t.slice(j+1,j+3).some(LEX.esING))) return 'cont';
    if(hay('did') || hay('was') || hay('were')) return 'past';
    // Verbo en forma de pasado y sin un «have» delante → pasado simple
    if(t.some(w => !LEX.AUX.has(w) && LEX.raiz(w) && LEX.raiz(w) !== w &&
                   LEX.formasValidas(LEX.raiz(w), 'v2').has(w) && !LEX.esING(w))) return 'past';
    return 'pres';
  }

  function forma(t, f){
    if(/\?/.test(f)) return LEX.WH.has(t[0]) ? 'wh' : 'pr';
    if(t.includes('not')) return 'ne';
    return 'af';
  }

  /* Reparto de las 6 piezas, para pintarlo con los mismos colores de siempre */
  function piezas(t){
    const out = t.map(w => ({ w, r:'com' }));
    let vistoSuj = false, vistoVer = false;
    out.forEach((o, i) => {
      const w = o.w;
      if(i === 0 && LEX.WH.has(w)){ o.r = 'wh'; return; }
      if(w === 'not'){ o.r = 'neg'; return; }
      if(LEX.AUX.has(w) || w === 'been' || w === 'going'){
        // «be» como verbo principal (I am tired) no es auxiliar
        const sigue = out.slice(i+1, i+3).map(x=>x.w);
        const esAux = w === 'been' || w === 'going'
          || sigue.some(s => LEX.esING(s) || LEX.esPP(s) || LEX.esBase(s) || s === 'not' || s === 'going');
        o.r = esAux ? 'aux' : 'ver';
        if(o.r === 'ver') vistoVer = true;
        return;
      }
      if(!vistoSuj && (LEX.SUJ.has(w) || LEX.es(w,'pron') || LEX.es(w,'sust') || LEX.es(w,'det'))){
        o.r = 'suj'; if(!LEX.es(w,'det')) vistoSuj = true; return;
      }
      /* «sort of», «kind of», «type of» delante de «of» NO son verbos: son la
         muletilla de «algo asi» («It's sort of blue»). Las tres existen como
         verbo, asi que se etiquetaban como tal y despues la regla de la forma
         pedia «is sorting». Se corrige aqui, en el etiquetador: una pieza mal
         etiquetada estropea TODAS las reglas que la miren, no solo una. */
      if(['sort','kind','type'].includes(w) && out[i+1] && out[i+1].w === 'of') return;
      /* esVerboForma, no esVerbo: el segundo solo conoce los infinitivos y
         devuelve false para «sleeps», «walked», «goes», «studies», «tried».
         Con el, la seccion que ENSENA las piezas de la frase pintaba el verbo
         como complemento -- ensenando justo lo contrario de lo que explica. */
      if(!vistoVer && LEX.esVerboForma(w)){ o.r = 'ver'; vistoVer = true; return; }
    });
    return out;
  }

  /* ─────── Los chequeos. Cada uno solo dispara cuando está seguro:
     un corrector que grita en falso es peor que no tener corrector. ─────── */
  function revisar(f){
    const t = tokenizar(f);
    const pal = t.filter(w => /[a-z]/.test(w));
    const H = [];
    const add = (sev, regla, tt, por, mal, bien) => H.push({ sev, regla, t:tt, por, mal, bien });
    const pregunta = /\?/.test(f);
    const iNot = pal.indexOf('not');
    const iAux = pal.findIndex(w => LEX.AUX.has(w));

    if(!pal.length) return { H, t:pal };

    // Trampas de calco (patrones de alta confianza)
    TRAMPAS.forEach(tr => { if(tr.re.test(f)) add('rojo', tr.regla, tr.t, tr.por, tr.mal, tr.bien); });

    /* El tiempo verbal tiene que casar con el «cuándo». «I'm hungry yesterday»
       era el caso que se colaba: presente con un marcador de pasado. */
    if(typeof MARC !== 'undefined'){
      const tv = tiempo(t);
      const arranque = MARC.EN_ARRANQUE.test(f);   // «since yesterday» sí lleva perfecto
      /* Sin verbo no hay tiempo que corregir: «Better than yesterday.» no está
         en presente, es que no tiene verbo. Antes se marcaba como error. */
      const conVerbo = pal.some(w => LEX.esVerboForma(w));
      if(conVerbo && MARC.EN_PAS.test(f) && !arranque && ['pres','cont','fut','going','perf','perfcont','cond'].includes(tv)){
        const arr = MARC.EN_PAS.exec(f)[0];
        const fix = aPasadoEN(pal);
        add('rojo','R-tiempo','«' + arr + '» pide pasado',
          'Si dices <b>cuándo</b> pasó y ya terminó, el verbo va en <b>pasado simple</b>. ' +
          (tv === 'perf' ? 'Con el presente perfecto <b>no puedes decir cuándo</b>: en cuanto lo dices, cambia a pasado simple.'
                         : 'El marcador y el verbo tienen que apuntar al mismo momento.'),
          f.trim(), fix ? fix + (/[.?!]$/.test(fix) ? '' : '.') : 'pon el verbo en pasado');
      }
      if(MARC.EN_FUT.test(f) && ['past','pastcont','pastperf','perf'].includes(tv)){
        const arr = MARC.EN_FUT.exec(f)[0];
        add('rojo','R-tiempo','«' + arr + '» no puede ir en pasado',
          'Ese marcador apunta al futuro, pero el verbo está en pasado. Usa <b>will</b> o <b>going to</b>.',
          f.trim(), 'pon el verbo en futuro');
      }
      if(MARC.EN_AHORA.test(f) && tv === 'pres'){
        add('naranja','R-tiempo','«' + MARC.EN_AHORA.exec(f)[0] + '» pide presente continuo',
          'Para lo que está pasando <b>en este instante</b> va <b>be + -ing</b>, no el presente simple.',
          f.trim(), 'usa am/is/are + verbo-ing');
      }
    }

    // La cadena verbal: el hueco que dejaba pasar «Why do you aren't finished…»
    // Se le pasan los tokens CON puntuacion: sin la coma no puede separar
    // las coletillas («It's cold, isn't it?») y las marcaria como error.
    if(typeof CADENA !== 'undefined') CADENA.revisar(t).forEach(h => H.push(h));

    // R16 · ¿hay verbo? Solo se exige si hay un SUJETO: si no lo hay, es un
    // fragmento («Good morning.», «Not bad, thanks.») y eso es inglés válido.
    const hayVerbo = pal.some(w => LEX.esVerboForma(w));
    const haySujeto = pal.some(w => LEX.SUJ.has(w));
    if(!hayVerbo && haySujeto && pal.length > 2)
      add('info','R16','No reconocí el verbo',
        'Toda frase necesita <b>sujeto + verbo</b>. Aquí no encontré ninguno — pero ojo: <b>puede ser que el verbo no esté entre las ' + WORDS.length + ' palabras del documento</b>, no que falte. Si estás seguro de tu verbo, ignora este aviso; búscalo con 🔎 para confirmarlo.',
        f.trim(), '');

    // R1 · sujeto obligatorio
    const arrancaConBe = ['is','are','am','was','were'].includes(pal[0]);
    if(arrancaConBe && !pregunta)
      add('rojo','R1','Falta el sujeto',
        'En español dices «Llueve» o «Es difícil» sin sujeto. En inglés <b>siempre</b> hay alguien al frente, aunque sea un <span class="gl" data-glo="sujetorelleno">it</span> que no significa nada.',
        f.trim(), 'It ' + f.trim().charAt(0).toLowerCase() + f.trim().slice(1));

    // R2 · el not nunca va solo
    if(iNot > 0 && hayVerbo && haySujeto && !['rather','but','or','and','why'].includes(pal[iNot-1])){
      const antes = pal[iNot-1];
      if(!(LEX.AUX.has(antes) || LEX.MODAL.has(antes)))
        add('rojo','R2','El «not» nunca va solo',
          'El <i>not</i> necesita un auxiliar donde agarrarse. Si la frase no tenía ninguno, entra <b>do / does / did</b> solo para sostenerlo.',
          f.trim(), (antes ? antes + " don't/doesn't " : "don't ") + (pal[iNot+1]||'…'));
    }

    // «I no have money» = «no tengo dinero» traducido palabra por palabra.
    // En ingles «no» solo niega sustantivos (no money); al verbo lo niega «don't».
    pal.forEach((w, i) => {
      if(w !== 'no' || i === 0) return;
      // Solo el patron del calco: SUJETO + no + VERBO. Asi «Long time no see»
      // y «No pain, no gain» (modismos fijos) no saltan.
      if(!LEX.SUJ.has(pal[i-1])) return;
      const sig = pal[i+1];
      if(!sig || !LEX.raiz(sig) || LEX.es(sig,'sust') || LEX.es(sig,'adj')) return;
      const aux = LEX.TERCERA.has(pal[i-1]) ? "doesn't" : "don't";
      add('rojo','R2',"«No» no niega verbos: eso es «don't»",
        "En español «<b>no</b> tengo» niega el verbo. En inglés <b>no</b> solo niega <b>sustantivos</b> (<i>no money</i>, <i>no problem</i>). Para negar la acción hace falta un auxiliar: <b>don't / doesn't / didn't</b>.",
        pal[i-1] + ' no ' + sig, pal[i-1] + ' ' + aux + ' ' + sig);
    });

    /* Arma la pregunta BIEN a partir de las palabras de una afirmación.
       Antes esto anteponía «Do/Does/Did» siempre, así que para «you can
       drive?» proponía «Do you can drive?» — enseñar mal es peor que no
       decir nada. Dos casos:
       · Ya hay auxiliar o modal → la pregunta se hace moviendo ESE al frente.
       · No hay ninguno → hay que traer do/does/did, y cuál depende del sujeto
         y del tiempo; el verbo vuelve a su forma desnuda.
       Si no se puede determinar con seguridad, se deja el menú «Do/Does/Did»
       en vez de inventar una forma. */
    function preguntaBien(ws){
      if(!ws.length) return '?';
      /* ¿Cuál de estas palabras es el auxiliar que hay que mover al frente?
         · be y los modales: siempre. «she is ready?» → «Is she ready?», aunque
           detrás no haya otro verbo (ready es adjetivo).
         · have: solo si le sigue un participio. Si no, es el verbo «tener» y
           la pregunta se hace con do — «you have a car?» → «Do you have a car?».
         · do/does/did: solo si hay otro verbo detrás. En «What you did
           yesterday?» el «did» ES el verbo, y moverlo dejaba la frase coja
           («What did you yesterday?»); así cae al do-support y sale bien. */
      const auxMovible = (w, n) => {
        if(LEX.AUX_BE.has(w) || LEX.MODAL.has(w)) return true;
        if(LEX.AUX_HAVE.has(w)) return ws.slice(n + 1).some(x => LEX.esPP(x));
        if(LEX.AUX_DO.has(w))   return ws.slice(n + 1).some(x => LEX.esVerboForma(x) && !LEX.AUX.has(x));
        return false;
      };
      const iAux = ws.findIndex((w, n) => n > 0 && LEX.AUX.has(w) && auxMovible(w, n));
      if(iAux > 0)
        return ws[iAux] + ' ' + ws.slice(0, iAux).concat(ws.slice(iAux + 1)).join(' ') + '?';

      const iSu = ws.findIndex(w => LEX.SUJ.has(w) && !LEX.WH.has(w));
      const suj = iSu > -1 ? ws[iSu] : '';
      const iV  = ws.findIndex((w, n) => n > iSu && LEX.esVerboForma(w));
      const v   = iV > -1 ? ws[iV] : '';
      const base = v ? LEX.raiz(v) : '';
      if(!v || !base) return 'do/does/did ' + ws.join(' ') + '?';

      let aux = '';
      if(LEX.esV2(v) && !LEX.es3ra(v) && base !== v) aux = 'did';
      else if(LEX.es3ra(v) || LEX.TERCERA.has(suj))  aux = 'does';
      else if(suj)                                    aux = 'do';
      if(!aux) return 'do/does/did ' + ws.join(' ') + '?';
      return aux + ' ' + ws.map((w, n) => n === iV ? base : w).join(' ') + '?';
    }
    const mayusIni = s => s.charAt(0).toUpperCase() + s.slice(1);

    // R3 · pregunta sin auxiliar al frente
    // La coletilla («…, isn't it?», «…, do you?») no convierte la frase en
    // pregunta mal armada: lo de delante es una afirmación y está bien.
    const coletilla = /,\s*\w+n['’]?t\s+(i|you|he|she|it|we|they|there)\s*\?/i.test(f)
                   || /,\s*(do|does|did|is|are|was|were|have|has|will|can|could|should)\s+(i|you|he|she|it|we|they|there)\s*\?/i.test(f)
                   /* «It's hard, you know?» · «…, right?» — la coletilla no es
                      una pregunta mal armada: lo de delante es una afirmación. */
                   || /,\s*(you know|you see|right|ok|okay|yeah|no)\s*\?$/i.test(f.trim());
    /* Fórmulas fijas que preguntan SIN invertir nada. No son un error:
       son así en inglés y corregirlas sería enseñar mal. */
    /* Admite una muletilla delante: «So what if…», «Well, how come…». Estaba
       anclada al principio de la frase, asi que cualquier palabra previa la
       desactivaba y el corrector pedia un auxiliar que el ingles no lleva. */
    const formulaFija = /^\s*(so|but|and|well|ok|okay|oh|hey|yeah|now)?[\s,]*(what if|how come|what about|how about|why not|what for|so what|now what|say what|guess what|who cares)\b/i.test(f.trim());
    // Elíptica de conversación: el sujeto se omite a propósito y es correcto
    // hablando («Need a hand?», «Any questions before we finish?»). El error
    // que sí hay que cazar es el que ARRANCA con el sujeto: «You are coming?».
    const eliptica = !pal.some(w => LEX.SUJ.has(w))
                  || !(LEX.SUJ.has(pal[0]) || LEX.WH.has(pal[0]) || LEX.AUX.has(pal[0])
                       || ['hello','hi','hey','ok','okay','so','well','and','but','excuse','sorry'].includes(pal[0]));
    if(pregunta && hayVerbo && !coletilla && !eliptica && !formulaFija){
      // Saltar saludos y muletillas antes de la pregunta de verdad
      const SALUDO = new Set(['hello','hi','hey','ok','okay','so','well','and','but','thanks','please','sorry','excuse','me','good']);
      let k = 0; while(k < pal.length - 1 && SALUDO.has(pal[k])) k++;
      const p0 = pal[k];
      // El auxiliar tiene que estar ANTES del sujeto, no en cualquier sitio:
      // "You are coming?" lo tiene, pero detrás — y por eso está mal.
      const iSuj = pal.findIndex((w, n) => n >= k && LEX.SUJ.has(w) && !LEX.WH.has(w));
      const hayAuxEnCabeza = pal.slice(k, iSuj > -1 ? iSuj : k + 4).some(w => LEX.AUX.has(w));
      if(LEX.WH.has(p0)){
        /* «What happened?» — ahí el WH ES el sujeto y no lleva auxiliar.
           Pero «What you did yesterday?» tiene sujeto propio («you»), así que
           el WH no es el sujeto y le falta el auxiliar.
           La prueba correcta es qué viene JUSTO DETRÁS del WH: si es un verbo,
           el WH es el sujeto. La versión anterior exigía que no hubiera ningún
           pronombre en toda la frase, y por eso «Who called you?» o «What
           caused this?» salían marcadas como error siendo inglés correcto —
           ahí «you» y «this» son el objeto, no el sujeto. */
        const sig = pal[k + 1];
        const sujetoEsWh = (p0 === 'who' || p0 === 'what') && !!sig &&
          !LEX.AUX.has(sig) && LEX.esVerboForma(sig);
        if(!hayAuxEnCabeza && !sujetoEsWh)
          add('rojo','R3','Falta el auxiliar en la pregunta',
            'La fórmula es fija: <b>WH + auxiliar + sujeto + verbo</b>. El WH <b>no reemplaza</b> al auxiliar, van los dos.',
            f.trim(), mayusIni(p0) + ' ' + preguntaBien(pal.slice(k + 1)));
      } else if(!LEX.AUX.has(p0)){
        add('rojo','R3','Preguntar es mover el auxiliar al frente',
          'En inglés no basta con subir la voz. La pregunta se hace <b>sacando el auxiliar y poniéndolo delante del sujeto</b>.',
          f.trim(), mayusIni(preguntaBien(pal.slice(k))));
      }
    }

    // R4 · el tiempo se marca una sola vez
    pal.forEach((w, i) => {
      if(!LEX.AUX_DO.has(w) && !LEX.MODAL.has(w)) return;
      // Se salta el sujeto y los adverbios, pero NO otro auxiliar: si lo que
      // sigue es have/be, es modal perfecto o pasiva y está bien.
      let j = i + 1;
      while(j < pal.length && (pal[j] === 'not' || LEX.es(pal[j],'adv') ||
            LEX.SUJ.has(pal[j]) || LEX.es(pal[j],'det') || LEX.es(pal[j],'pron'))) j++;
      const sig = pal[j];
      if(!sig || !LEX.esVerbo(sig) || LEX.AUX.has(sig)) return;
      const b = LEX.raiz(sig);
      if(b && sig !== b && !LEX.esING(sig))
        add('rojo','R4','El tiempo se marca UNA sola vez',
          'El auxiliar <b>' + w + '</b> ya carga el tiempo y la persona. Por eso el verbo que le sigue va <span class="gl" data-glo="desnudo">desnudo</span>: sin -s, sin -ed.',
          w + ' … ' + sig, w + ' … ' + b);
    });

    // R5 · la -s de he/she/it
    if(iAux === -1 && !pregunta){
      const iS = pal.findIndex(w => LEX.TERCERA.has(w));
      const abreOracion = iS === 0 || (iS > 0 && [',','and','but','because','that','when','if'].includes(pal[iS-1]));
      if(iS > -1 && abreOracion){
        let n = iS + 1;
        while(n < pal.length && LEX.es(pal[n],'adv')) n++;   // «She always work here»
        const v = pal[n];
        // Solo si es la forma BASE de un verbo: si raiz() devuelve otra cosa,
        // ya viene conjugado («works» → raiz «work») y está bien.
        if(v && LEX.esVerbo(v) && LEX.esBase(v) && !LEX.esV2(v) && LEX.raiz(v) === v && v !== 'be')
          add('rojo','R5','Falta la -s de he/she/it',
            'En presente simple afirmativo, con <b>he / she / it</b> el verbo lleva <b>-s</b>. Es la única conjugación que tiene el inglés.',
            pal[iS] + ' ' + v, pal[iS] + ' ' + LEX.conj(v, 's'));
      }
    }

    // R7 · una sola negación
    if(iNot > -1 && pal.some(w => LEX.NEGS.has(w) && w !== 'no'))
      add('rojo','R7','Doble negación: dice lo contrario',
        'En español «no vi nada» lleva dos negaciones y está bien. En inglés se <b>anulan</b>: <i>I didn\'t see nothing</i> significa que SÍ viste algo. Con auxiliar negado va <b>anything</b>.',
        f.trim(), 'usa «anything / anybody / ever» en vez de «nothing / nobody / never»');

    // R9 · preposición + verbo en -ing
    const BLOQUE_PREP = new Set([
      'in mind','in fact','in case','in turn','in place','in charge','in touch',
      'in time','in order','in person','in general','in short','in return','in doubt',
      'in love','in tune','in stock','in hand','in style','in shape','in reverse',
      'by heart','by chance','by far','by hand','by mistake','by accident','by design',
      'of course','on purpose','on time','on board','on hold','on track','on sale',
      'on air','on call','on edge','on guard','on watch','for sure','for free',
      'for good','for now','for real','at first','at last','at least','at once',
      'at will','at heart','at play','at stake','after all','without doubt'
    ]);
    pal.forEach((w, i) => {
      if(!LEX.PREP_ING.has(w)) return;
      const sig = pal[i+1], tras = pal[i+2];
      /* Parejas preposicion+SUSTANTIVO que parecen preposicion+verbo. En todas
         ellas la segunda palabra existe tambien como verbo (mind, case, place,
         turn, doubt, charge...), y por eso la regla del -ing se disparaba. Son
         bloques hechos: se dice «in mind», nunca «in minding». */
      if(sig && BLOQUE_PREP.has(w + ' ' + sig)) return;
      const OBJ = new Set(['me','you','him','her','it','us','them','the','a','an','my','your','his','their','our','this','that']);
      const claramenteVerbo = tras && OBJ.has(tras);
      if(sig && LEX.esVerbo(sig) && LEX.esBase(sig) && !LEX.AUX.has(sig) && claramenteVerbo)
        add('rojo','R9','Después de preposición, el verbo va en -ing',
          'Tras <b>for, of, about, without, before, after, by</b>… el verbo se pone en <span class="gl" data-glo="gerundio">-ing</span>. (La excepción es <i>to</i>, que es infinitivo.)',
          w + ' ' + sig, w + ' ' + LEX.conj(sig, 'ing'));
    });

    // R10 · modal sin «to» y sin «-s»
    pal.forEach((w, i) => {
      if(!LEX.MODAL.has(w)) return;
      if(pal[i+1] === 'to' && pal[i+2] && LEX.esVerbo(pal[i+2]))
        add('rojo','R10','Los modales no llevan «to»',
          'Después de un <span class="gl" data-glo="modal">modal</span> el verbo va desnudo, sin <i>to</i>.',
          w + ' to ' + pal[i+2], w + ' ' + pal[i+2]);
    });
    pal.forEach(w => {
      if(/^(cans|coulds|wills|woulds|shoulds|musts|mays|mights)$/.test(w))
        add('rojo','R10','Los modales no llevan -s',
          'Los modales nunca cambian de forma: <i>he <b>can</b></i>, no <i>he cans</i>.', w, w.slice(0,-1));
    });

    // R11 · incontables sin plural
    pal.forEach(w => {
      if(/s$/.test(w) && LEX.UNCOUNT.has(w.slice(0,-1)))
        add('rojo','R11','«' + w.slice(0,-1) + '» es <span class="gl" data-glo="incontable">incontable</span>: nunca lleva -s',
          'En español se cuenta («un consejo, dos consejos»), en inglés no. Para contarlo se usa un envase: <i>a piece of ' + w.slice(0,-1) + '</i>.',
          w, w.slice(0,-1));
    });

    // R8 · nada entre el verbo y su objeto
    pal.forEach((w, i) => {
      if(!['very','really','quite','so','too'].includes(w)) return;
      const ant = pal[i-1], sig1 = pal[i+1], sig2 = pal[i+2];
      if(ant && LEX.esVerbo(ant) && !LEX.AUX.has(ant) && sig1 && LEX.es(sig1,'adv') && sig2 && (LEX.es(sig2,'sust') || LEX.SUJ.has(sig2)))
        add('rojo','R8','Nada se mete entre el verbo y su objeto',
          'Primero el <b>qué</b>, después el <b>cómo</b>. <i>I speak English very well</i>, no <i>I speak very well English</i>.',
          ant + ' ' + w + ' ' + sig1 + ' ' + sig2, ant + ' ' + sig2 + ' ' + w + ' ' + sig1);
    });

    // R12 · naranja: la forma larga donde se contrae
    const largas = [['do not',"don't"],['does not',"doesn't"],['did not',"didn't"],
      ['is not',"isn't"],['are not',"aren't"],['have not',"haven't"],['has not',"hasn't"],
      ['will not',"won't"],['cannot',"can't"],['can not',"can't"],['i am',"I'm"]];
    const bajo = f.toLowerCase();
    largas.forEach(([l, c]) => {
      if(bajo.includes(l))
        add('naranja','R12','Hablando se dice «' + c + '»',
          'No es un error, pero <b>nadie habla así</b>. Si solo practicas la forma larga, entiendes leyendo y no escuchando.',
          l, c);
    });

    // Cosmético
    if(/[a-záéíóúñ]/.test(f.trim()[0] || ''))
      add('naranja','R-may','Empieza con mayúscula', 'Detalle de escritura, no de gramática.',
        f.trim().slice(0,14) + '…', f.trim().charAt(0).toUpperCase() + f.trim().slice(1,14) + '…');
    if(!/[.?!]$/.test(f.trim()))
      add('naranja','R-punt','Falta el signo final', 'El punto o el signo de interrogación cierran la frase.',
        f.trim().slice(-14), f.trim().slice(-14) + (pregunta ? '?' : '.'));

    // Palabras que no puedo verificar
    const desconocidas = pal.filter(w => !LEX.POS.has(w) && !LEX.AUX.has(w) && !LEX.SUJ.has(w)
      && !LEX.WH.has(w) && w !== 'not' && !LEX.raiz(w) && w.length > 2);
    if(desconocidas.length)
      add('info','R-desc','No puedo verificar: ' + desconocidas.join(', '),
        'Esas palabras no están en las ' + WORDS.length + ' del documento, así que <b>no las revisé</b>. No significa que estén mal — significa que no lo sé. Búscalas en el diccionario con el botón 🔎.',
        desconocidas.join(', '), '');

    return { H, t:pal };
  }

  function analizar(txt){
    const fs = frases(txt);
    if(!fs.length) return null;
    const todas = [], porFrase = [];
    fs.forEach(f => {
      const { H, t } = revisar(f);
      todas.push(...H);
      porFrase.push({ f, H, t, piezas:piezas(t), tiempo:tiempo(t), forma:forma(t, f) });
    });
    const rojos = todas.filter(x => x.sev === 'rojo').length;
    const naranjas = todas.filter(x => x.sev === 'naranja').length;
    const luz = rojos ? 'rojo' : naranjas ? 'naranja' : 'verde';
    return { luz, rojos, naranjas, hallazgos:todas, frases:porFrase };
  }

  /* Comprobación automática: casos con respuesta conocida. Se puede correr
     desde la consola con APP.ANL.probar() — si un chequeo deja de disparar,
     esto lo dice. */
  const CASOS = [
    ['I work at a bank.','verde'], ["She doesn't work here.",'verde'],
    ['Where do you live?','verde'], ["I'm going to study tonight.",'verde'],
    ['I have been working here for two years.','verde'],
    ['She work here.','rojo'], ['I not understand.','rojo'], ['Where you live?','rojo'],
    ['Did you went?','rojo'], ['Is very difficult.','rojo'], ['I have 30 years.','rojo'],
    ['The people is waiting.','rojo'], ['I need some advices.','rojo'],
    ['She can to swim.','rojo'], ['Thanks for help me.','rojo'],
    ['It depends of you.','rojo'], ['I work here since two years.','rojo'],
    ['I am agree.','rojo'], ['You are coming?','rojo'],
    // Correctas que el corrector marcaba mal (medido contra las 1000 frases)
    ['Good morning.','verde'], ['Not bad, thanks.','verde'], ['Hello, how are you?','verde'],
    ['How long have you been here?','verde'], ['How old are you?','verde'],
    ['You could have told me.','verde'], ['It can be done.','verde'],
    ['It works like a charm.','verde'], ['Let it go.','verde'],
    ['Have a seat.','verde'], ["Let's keep in touch.",'verde'],
    ['I have one brother and two sisters.','verde'], ['Either one works.','verde'],
    ['Can we reschedule?','verde'], ['I missed my flight.','verde'],
    ['To sum up, it works.','verde'], ['It depends on the situation.','verde'],
    ["It's cold, isn't it?",'verde'], ["You're coming, aren't you?",'verde'],
    ["He can swim, can't he?",'verde'], ['Need a hand?','verde'],
    ['Any questions before we finish?','verde'],
    ['She always work here.','rojo'], ['I no have money.','rojo'],
    // Marcadores temporales — el caso que se colaba
    ["I'm hungry yesterday.",'rojo'], ['I work here yesterday.','rojo'],
    ['I have worked here yesterday.','rojo'], ['I will go tomorrow.','verde'],
    ['I went there yesterday.','verde'], ['I was hungry yesterday.','verde'],
    ["I've been here since yesterday.",'verde'], ['I go to the gym every day.','verde'],
    ['I have no money.','verde'], ['No problem.','verde'],
    ['Long time no see.','verde'], ['No pain, no gain.','verde'],
    // El fallo que encontró Miguel: pasaba por buena y es una frase rota
    ["Why do you aren't finished your university?",'rojo'],
    ['I do am working.','rojo'], ['She does have finished.','rojo'],
    ['He has went home.','rojo'], 
    ['You can to swim.','rojo'],
    // Y las correctas que la cadena NO debe tocar
    ['You could have told me.','verde'], ['It can be done.','verde'],
    ['I have been working here for two years.','verde'],
    ["I don't know if he is coming.",'verde'],
    ['She will have finished by then.','verde'],
    ['Why have you finished university?','verde']
  ];
  function probar(){
    const fallos = [];
    CASOS.forEach(([f, esperado]) => {
      const r = analizar(f);
      if(!r || r.luz !== esperado)
        fallos.push(f + ' → esperaba ' + esperado + ', dio ' + (r ? r.luz : 'nada') +
          (r ? ' [' + r.hallazgos.filter(h=>h.sev!=='info').map(h=>h.regla).join(',') + ']' : ''));
    });
    return { casos:CASOS.length, fallos };
  }
  return { analizar, probar, piezas, tokenizar, tiempo, CASOS };
})();









/* ══════════════════════════════════════════════════════════════════════
   MORFOLOGÍA DEL VERBO ESPAÑOL
   ──────────────────────────────────────────────────────────────────────
   Miguel: «no puedes corregir cositas, debes hacer un cerebro completo».
   Tenía razón en el método, no solo en el error. Mi detección de verbos era
   una lista de terminaciones, así que «hice» —pretérito irregular— no se
   reconocía, y parchear «hice» habría sido otra cosita.

   Esto conjuga de verdad: dada CUALQUIER forma, devuelve su infinitivo, su
   tiempo y su persona. De esa única fuente salen todas las comprobaciones
   (concordancia de persona, tiempo contra marcador temporal), en vez de
   una regla suelta por caso.
════════════════════════════════════════════════════════════════════════ */
const MORFO = (() => {

  /* Terminaciones regulares. Futuro y condicional se pegan al infinitivo
     entero, por eso van aparte. */
  const REG = {
    ar: { pres:['o','as','a','amos','áis','an'],
          pret:['é','aste','ó','amos','asteis','aron'],
          imp:['aba','abas','aba','ábamos','abais','aban'] },
    er: { pres:['o','es','e','emos','éis','en'],
          pret:['í','iste','ió','imos','isteis','ieron'],
          imp:['ía','ías','ía','íamos','íais','ían'] },
    ir: { pres:['o','es','e','imos','ís','en'],
          pret:['í','iste','ió','imos','isteis','ieron'],
          imp:['ía','ías','ía','íamos','íais','ían'] }
  };
  const FUT  = ['é','ás','á','emos','éis','án'];
  const COND = ['ía','ías','ía','íamos','íais','ían'];

  /* Los irregulares más usados, con sus formas completas. Son pocos verbos
     pero son los que más aparecen en cualquier frase real. */
  const IRR_RAW = `
ser|soy,eres,es,somos,sois,son|fui,fuiste,fue,fuimos,fuisteis,fueron|era,eras,era,éramos,erais,eran|ser
estar|estoy,estás,está,estamos,estáis,están|estuve,estuviste,estuvo,estuvimos,estuvisteis,estuvieron|estaba,estabas,estaba,estábamos,estabais,estaban|estar
haber|he,has,ha,hemos,habéis,han|hube,hubiste,hubo,hubimos,hubisteis,hubieron|había,habías,había,habíamos,habíais,habían|habr
tener|tengo,tienes,tiene,tenemos,tenéis,tienen|tuve,tuviste,tuvo,tuvimos,tuvisteis,tuvieron|tenía,tenías,tenía,teníamos,teníais,tenían|tendr
hacer|hago,haces,hace,hacemos,hacéis,hacen|hice,hiciste,hizo,hicimos,hicisteis,hicieron|hacía,hacías,hacía,hacíamos,hacíais,hacían|har
ir|voy,vas,va,vamos,vais,van|fui,fuiste,fue,fuimos,fuisteis,fueron|iba,ibas,iba,íbamos,ibais,iban|ir
poder|puedo,puedes,puede,podemos,podéis,pueden|pude,pudiste,pudo,pudimos,pudisteis,pudieron|podía,podías,podía,podíamos,podíais,podían|podr
decir|digo,dices,dice,decimos,decís,dicen|dije,dijiste,dijo,dijimos,dijisteis,dijeron|decía,decías,decía,decíamos,decíais,decían|dir
ver|veo,ves,ve,vemos,veis,ven|vi,viste,vio,vimos,visteis,vieron|veía,veías,veía,veíamos,veíais,veían|ver
dar|doy,das,da,damos,dais,dan|di,diste,dio,dimos,disteis,dieron|daba,dabas,daba,dábamos,dabais,daban|dar
saber|sé,sabes,sabe,sabemos,sabéis,saben|supe,supiste,supo,supimos,supisteis,supieron|sabía,sabías,sabía,sabíamos,sabíais,sabían|sabr
querer|quiero,quieres,quiere,queremos,queréis,quieren|quise,quisiste,quiso,quisimos,quisisteis,quisieron|quería,querías,quería,queríamos,queríais,querían|querr
poner|pongo,pones,pone,ponemos,ponéis,ponen|puse,pusiste,puso,pusimos,pusisteis,pusieron|ponía,ponías,ponía,poníamos,poníais,ponían|pondr
venir|vengo,vienes,viene,venimos,venís,vienen|vine,viniste,vino,vinimos,vinisteis,vinieron|venía,venías,venía,veníamos,veníais,venían|vendr
salir|salgo,sales,sale,salimos,salís,salen|salí,saliste,salió,salimos,salisteis,salieron|salía,salías,salía,salíamos,salíais,salían|saldr
traer|traigo,traes,trae,traemos,traéis,traen|traje,trajiste,trajo,trajimos,trajisteis,trajeron|traía,traías,traía,traíamos,traíais,traían|traer
caer|caigo,caes,cae,caemos,caéis,caen|caí,caíste,cayó,caímos,caísteis,cayeron|caía,caías,caía,caíamos,caíais,caían|caer
oír|oigo,oyes,oye,oímos,oís,oyen|oí,oíste,oyó,oímos,oísteis,oyeron|oía,oías,oía,oíamos,oíais,oían|oir
andar|ando,andas,anda,andamos,andáis,andan|anduve,anduviste,anduvo,anduvimos,anduvisteis,anduvieron|andaba,andabas,andaba,andábamos,andabais,andaban|andar
conducir|conduzco,conduces,conduce,conducimos,conducís,conducen|conduje,condujiste,condujo,condujimos,condujisteis,condujeron|conducía,conducías,conducía,conducíamos,conducíais,conducían|conducir
conocer|conozco,conoces,conoce,conocemos,conocéis,conocen|conocí,conociste,conoció,conocimos,conocisteis,conocieron|conocía,conocías,conocía,conocíamos,conocíais,conocían|conocer
volver|vuelvo,vuelves,vuelve,volvemos,volvéis,vuelven|volví,volviste,volvió,volvimos,volvisteis,volvieron|volvía,volvías,volvía,volvíamos,volvíais,volvían|volver
pedir|pido,pides,pide,pedimos,pedís,piden|pedí,pediste,pidió,pedimos,pedisteis,pidieron|pedía,pedías,pedía,pedíamos,pedíais,pedían|pedir
seguir|sigo,sigues,sigue,seguimos,seguís,siguen|seguí,seguiste,siguió,seguimos,seguisteis,siguieron|seguía,seguías,seguía,seguíamos,seguíais,seguían|seguir
sentir|siento,sientes,siente,sentimos,sentís,sienten|sentí,sentiste,sintió,sentimos,sentisteis,sintieron|sentía,sentías,sentía,sentíamos,sentíais,sentían|sentir
dormir|duermo,duermes,duerme,dormimos,dormís,duermen|dormí,dormiste,durmió,dormimos,dormisteis,durmieron|dormía,dormías,dormía,dormíamos,dormíais,dormían|dormir
morir|muero,mueres,muere,morimos,morís,mueren|morí,moriste,murió,morimos,moristeis,murieron|moría,morías,moría,moríamos,moríais,morían|morir
empezar|empiezo,empiezas,empieza,empezamos,empezáis,empiezan|empecé,empezaste,empezó,empezamos,empezasteis,empezaron|empezaba,empezabas,empezaba,empezábamos,empezabais,empezaban|empezar
encontrar|encuentro,encuentras,encuentra,encontramos,encontráis,encuentran|encontré,encontraste,encontró,encontramos,encontrasteis,encontraron|encontraba,encontrabas,encontraba,encontrábamos,encontrabais,encontraban|encontrar
entender|entiendo,entiendes,entiende,entendemos,entendéis,entienden|entendí,entendiste,entendió,entendimos,entendisteis,entendieron|entendía,entendías,entendía,entendíamos,entendíais,entendían|entender
jugar|juego,juegas,juega,jugamos,jugáis,juegan|jugué,jugaste,jugó,jugamos,jugasteis,jugaron|jugaba,jugabas,jugaba,jugábamos,jugabais,jugaban|jugar
leer|leo,lees,lee,leemos,leéis,leen|leí,leíste,leyó,leímos,leísteis,leyeron|leía,leías,leía,leíamos,leíais,leían|leer
creer|creo,crees,cree,creemos,creéis,creen|creí,creíste,creyó,creímos,creísteis,creyeron|creía,creías,creía,creíamos,creíais,creían|creer
pensar|pienso,piensas,piensa,pensamos,pensáis,piensan|pensé,pensaste,pensó,pensamos,pensasteis,pensaron|pensaba,pensabas,pensaba,pensábamos,pensabais,pensaban|pensar
cerrar|cierro,cierras,cierra,cerramos,cerráis,cierran|cerré,cerraste,cerró,cerramos,cerrasteis,cerraron|cerraba,cerrabas,cerraba,cerrábamos,cerrabais,cerraban|cerrar
contar|cuento,cuentas,cuenta,contamos,contáis,cuentan|conté,contaste,contó,contamos,contasteis,contaron|contaba,contabas,contaba,contábamos,contabais,contaban|contar
costar|cuesto,cuestas,cuesta,costamos,costáis,cuestan|costé,costaste,costó,costamos,costasteis,costaron|costaba,costabas,costaba,costábamos,costabais,costaban|costar
llover|llueve,llueve,llueve,llueve,llueve,llueven|llovió,llovió,llovió,llovió,llovió,llovieron|llovía,llovía,llovía,llovía,llovía,llovían|llover
`.trim();

  const TIEMPOS = { pres:'presente', pret:'pasado', imp:'pasado', fut:'futuro', cond:'condicional' };
  const NOMBRE = { pres:'presente', pret:'pretérito', imp:'imperfecto', fut:'futuro', cond:'condicional' };
  const PERSONA = ['1s','2s','3s','1p','2p','3p'];

  /* El vocabulario de verbos sale del propio documento: las 2000 palabras
     traen su traducción, y las de categoría «verbo» son infinitivos en
     español. Así el analizador no se inventa lemas que no existen. */
  /* Verbos frecuentes del español, para que la cobertura no dependa de lo
     que haya caído en la lista de palabras. Con estos + los del documento,
     el analizador cubre lo que se escribe de verdad. */
  const LEMAS = new Set(`hablar desayunar almorzar cenar merendar comer vivir trabajar estudiar necesitar buscar llamar llegar
pasar quedar dejar llevar entrar tomar tratar mirar contar empezar esperar existir
levantar intentar usar ocurrar escuchar cambiar presentar crear considerar aparecer
aceptar realizar acabar preguntar terminar recordar permitir aprender olvidar comprar
vender pagar ganar perder ayudar cuidar cocinar limpiar lavar caminar correr nadar
bailar cantar dibujar pintar viajar visitar invitar recibir enviar mandar guardar
abrir cubrir subir bajar mover parar seguir crecer nacer vivir morir sentar acostar
despertar bañar vestir peinar casar separar divorciar enamorar odiar amar querer
desear soñar pensar creer saber conocer entender comprender explicar enseñar
mostrar indicar señalar apuntar anotar escribir leer contestar responder repetir
practicar mejorar avanzar lograr conseguir obtener alcanzar tocar sonar oler probar
gustar encantar molestar preocupar alegrar entristecer asustar sorprender
descansar dormir soñar despertar madrugar tardar durar acompañar`
    .trim().split(/\s+/));
  try{
    WORDS.forEach(w => {
      if(w.cat !== 'verbo') return;
      String(w.es || '').split(/[\/,;]/).forEach(x => {
        const v = x.trim().toLowerCase().replace(/^(se\s+)/, '');
        if(/^[a-záéíóúñü]+(ar|er|ir)$/.test(v)) LEMAS.add(v);
      });
    });
  }catch(e){}

  /* Índice inverso: forma → análisis. Se construye una vez. */
  const IDX = new Map();
  /* Además del índice inverso (forma → análisis) se guarda el directo
     (lema+tiempo+persona → forma), que es lo que hace falta para GENERAR. */
  const FWD = new Map();
  const mete = (forma, lema, t, p) => {
    if(!forma) return;
    if(!IDX.has(forma)) IDX.set(forma, []);
    const y = IDX.get(forma);
    if(!y.some(a => a.lema === lema && a.t === t && a.p === p)) y.push({ lema, t, p });
    const k = lema + '|' + t + '|' + p;
    if(!FWD.has(k)) FWD.set(k, forma);
  };

  const IRREGULARES = new Set();
  IRR_RAW.split('\n').forEach(linea => {
    const [lema, pres, pret, imp, raizFut] = linea.split('|');
    if(!lema) return;
    LEMAS.add(lema); IRREGULARES.add(lema);
    [['pres', pres], ['pret', pret], ['imp', imp]].forEach(([t, lista]) => {
      (lista || '').split(',').forEach((f, i) => mete(f.trim(), lema, t, PERSONA[i]));
    });
    FUT.forEach((e, i)  => mete(raizFut + e, lema, 'fut', PERSONA[i]));
    COND.forEach((e, i) => mete(raizFut + e, lema, 'cond', PERSONA[i]));
  });

  // Y ahora todos los regulares del vocabulario
  LEMAS.forEach(lema => {
    // Los irregulares ya tienen sus formas: conjugarlos como regulares
    // inventaba palabras que no existen («ser» → «se», «semos»).
    if(IRREGULARES.has(lema)) return;
    const conj = lema.slice(-2);
    const tabla = REG[conj];
    if(!tabla) return;
    const raiz = lema.slice(0, -2);
    Object.entries(tabla).forEach(([t, ends]) =>
      ends.forEach((e, i) => mete(raiz + e, lema, t, PERSONA[i])));
    FUT.forEach((e, i)  => mete(lema + e, lema, 'fut', PERSONA[i]));
    COND.forEach((e, i) => mete(lema + e, lema, 'cond', PERSONA[i]));
  });

  /* Dada una palabra, ¿qué puede ser? Devuelve [] si no es un verbo
     conocido — y eso es una respuesta legítima, no un error. */
  function analizar(w){ return IDX.get(String(w || '').toLowerCase()) || []; }

  /* Momento al que apunta: presente / pasado / futuro / condicional.
     Si la palabra es ambigua (habl«amos» es presente y pretérito a la vez)
     devuelve las dos y quien pregunte decide. */
  function momentos(w){ return [...new Set(analizar(w).map(a => TIEMPOS[a.t]))]; }
  function personas(w){ return [...new Set(analizar(w).map(a => a.p))]; }
  const esVerbo = w => analizar(w).length > 0;

  /* GENERAR: la operación contraria a analizar. Con el índice directo ya
     construido no hace falta ninguna tabla nueva. */
  function conjugar(lema, t, p){ return FWD.get(lema + '|' + t + '|' + p) || null; }

  const GER_IRR = { ir:'yendo', ver:'viendo', decir:'diciendo', venir:'viniendo',
    poder:'pudiendo', dormir:'durmiendo', morir:'muriendo', pedir:'pidiendo',
    seguir:'siguiendo', sentir:'sintiendo', oír:'oyendo', traer:'trayendo',
    caer:'cayendo', leer:'leyendo', creer:'creyendo' };
  const PART_IRR = { hacer:'hecho', decir:'dicho', ver:'visto', poner:'puesto',
    volver:'vuelto', escribir:'escrito', morir:'muerto', abrir:'abierto',
    romper:'roto', cubrir:'cubierto', ir:'ido', ser:'sido' };

  function gerundio(lema){
    if(GER_IRR[lema]) return GER_IRR[lema];
    if(/ar$/.test(lema)) return lema.slice(0, -2) + 'ando';
    return lema.slice(0, -2) + 'iendo';
  }
  function participio(lema){
    if(PART_IRR[lema]) return PART_IRR[lema];
    if(/ar$/.test(lema)) return lema.slice(0, -2) + 'ado';
    return lema.slice(0, -2) + 'ido';
  }

  function auditar(){
    const pruebas = [
      ['hice','pasado','1s'], ['hizo','pasado','3s'], ['tengo','presente','1s'],
      ['tenía','pasado','1s'], ['fue','pasado','3s'], ['somos','presente','1p'],
      ['comí','pasado','1s'], ['comió','pasado','3s'], ['comemos','presente','1p'],
      ['trabajaré','futuro','1s'], ['trabajaría','condicional','1s'],
      ['dijo','pasado','3s'], ['pusimos','pasado','1p'], ['vino','pasado','3s'],
      ['estuve','pasado','1s'], ['supo','pasado','3s'], ['veo','presente','1s']
    ];
    const fallos = [];
    pruebas.forEach(([w, m, p]) => {
      if(!momentos(w).includes(m) || !personas(w).includes(p))
        fallos.push(w + ' → ' + JSON.stringify(momentos(w)) + ' ' + JSON.stringify(personas(w)) +
          ' (esperaba ' + m + ' ' + p + ')');
    });
    return { formasIndexadas: IDX.size, lemas: LEMAS.size, pruebas: pruebas.length, fallos };
  }
  return { analizar, momentos, personas, esVerbo, auditar, conjugar, gerundio, participio,
           LEMAS, IDX, FWD, NOMBRE };
})();

/* ══════════════════════════════════════════════════════════════════════
   ANALIZADOR DE ESPAÑOL
   ──────────────────────────────────────────────────────────────────────
   Miguel escribió «ayer me comió un manzana» y el semáforo dijo CORRECTA.
   El motivo: yo analizaba la TRADUCCIÓN, no lo que él había escrito. El
   traductor convierte español malo en inglés bueno, así que la luz verde
   estaba mirando al sitio equivocado.

   Ahora cada recuadro se revisa por su cuenta y la luz es la del texto
   que estás escribiendo tú.
════════════════════════════════════════════════════════════════════════ */

/* Género por terminación + las excepciones, que en español son las que
   de verdad hacen falta. Sin la lista de excepciones esto marcaría mal
   «el problema», «la mano» y «el agua». */
const ES_MASC_EN_A = new Set(['problema','sistema','tema','idioma','programa','clima','día',
  'mapa','planeta','poema','drama','esquema','dilema','síntoma','teorema','diploma','panorama',
  'sofá','aroma','fantasma','enigma','trauma','diagrama','telegrama','crucigrama','tranvía',
  'pijama','karma']);
/* Estas cambian de significado con el género — las dos formas son correctas,
   así que no se puede afirmar que ninguna esté mal: guardia, cura, policía,
   vigía, coma, cometa, papa, orden, capital, frente. */
const ES_FEM_EN_O = new Set(['mano','foto','moto','radio','libido','dinamo','soprano']);
/* Femeninas que empiezan por «a» tónica: llevan EL/UN en singular, y está bien */
const ES_A_TONICA = new Set(['agua','alma','hacha','área','águila','aula','hambre','arma','ave',
  'alba','ancla','ala','acta','aguja','arpa','asma','aya','hada','haya','habla']);

/* Genero comun que no sigue ninguna terminacion: «el colega» y «la colega»
   son las dos correctas, asi que no hay nada que corregir. */
const ES_COMUN = new Set(['colega','atleta','camarada','guía','espía','terapeuta','poeta',
  'guardia','policía','vigilante','psiquiatra','pediatra','astronauta','periodista',
  'centinela','indígena','homicida','suicida','testigo','cómplice','mártir','rehén','modelo',
  'juez','líder','miembro','personaje','víctima','persona']);

/* Invariables en -s: «el paraguas» y «los paraguas» se escriben igual. Sin
   esta lista, la regla del numero los tomaba por plurales y la del genero por
   femeninos, y el corrector acusaba de un error que no existe. Salieron al
   ampliar el diccionario: hasta entonces ninguna palabra del documento acababa
   asi en singular. */
const ES_INVAR_M = new Set(['caos','paraguas','microondas','cortafuegos','rompecabezas',
  'sacacorchos','abrelatas','lavavajillas','cumpleaños','parabrisas','guardaespaldas',
  'portaaviones','pisapapeles','sacapuntas','tocadiscos','ciempiés','lunes','martes',
  'miércoles','jueves','viernes','análisis','virus','atlas','autobús','país','mes','país']);
const ES_INVAR_F = new Set(['crisis','tesis','dosis','síntesis','hipótesis','praxis','tos']);

/* «-zón» casi siempre es femenino (razón, sazón, hinchazón), pero no siempre.
   El corazon es masculino y el corrector lo llamaba femenino: un error visible
   en la primera frase que uno escribe con esa palabra. */
const ES_ZON_M = new Set(['corazón','buzón','tropezón','tazón','calzón','porrón','terrón']);

const ES = (() => {
  const FEM = /(ción|sión|zón|dad|tad|tud|umbre|eza|ura|anza|encia|ancia|itis|sis|a)$/;
  const MASC = /(aje|ambre|ismo|miento|dor|ete|ín|or|o)$/;

  function genero(w){
    if(ES_INVAR_M.has(w)) return 'm';
    if(ES_INVAR_F.has(w)) return 'f';
    if(ES_ZON_M.has(w))   return 'm';
    // El plural se busca por su singular: «los días» viene de «día»
    const sing = /es$/.test(w) ? w.slice(0, -2) : (/s$/.test(w) ? w.slice(0, -1) : w);
    if(ES_MASC_EN_A.has(w) || ES_MASC_EN_A.has(sing)) return 'm';
    if(ES_FEM_EN_O.has(w)  || ES_FEM_EN_O.has(sing))  return 'f';
    // «-ma» no se puede deducir: problema y sistema son masculinos, cama y
    // forma femeninas. Sin lista explícita, mejor callarse.
    if(/mas?$/.test(w)) return null;
    /* Genero comun: la misma forma sirve para los dos («el colega» y «la
       colega», «un analista» y «una analista»). No hay nada que corregir. */
    if(/(ista|istas|ante|antes|ente|entes|eta|etas|oga|ogas|iatra|cida|nauta|nautas)$/.test(w)) return null;
    if(ES_COMUN.has(w) || ES_COMUN.has(sing)) return null;
    if(/(ción|sión|zón|dad|tad|tud|umbre|eza|ura|anza|encia|ancia|itis)$/.test(w)) return 'f';
    if(/(aje|ambre|ismo|miento|dor)$/.test(w)) return 'm';
    if(/as$/.test(w) && w.length > 3) return 'f';
    if(/os$/.test(w) && w.length > 3) return 'm';
    if(/a$/.test(w))  return 'f';
    if(/o$/.test(w))  return 'm';
    return null;                       // -e, consonante: no se puede saber → no se toca
  }
  /* Los numeros no llevan genero propio: «las cinco», «las ocho» (horas) son
     correctas y mi regla del -o las marcaba como masculinas. */
  const NUMEROS = new Set(['uno','dos','tres','cuatro','cinco','seis','siete','ocho','nueve','diez',
    'once','doce','trece','catorce','quince','dieciseis','dieciséis','veinte','treinta','cuarenta',
    'cincuenta','sesenta','setenta','ochenta','noventa','cien','ciento','mil','media','cuarto']);
  /* Los invariables en -s devuelven null: NO se puede saber el numero por la
     forma. «El lunes» y «los lunes» son correctos los dos, «el paraguas» y
     «los paraguas» tambien. Decir que eran singulares hizo que el corrector
     marcara «los lunes» como error. Cuando no se sabe, no se corrige. */
  const numero = w => (ES_INVAR_M.has(w) || ES_INVAR_F.has(w)) ? null
                    : (/s$/.test(w) && w.length > 3 ? 'p' : 's');

  const ART = {
    el:['m','s'], la:['f','s'], los:['m','p'], las:['f','p'],
    un:['m','s'], una:['f','s'], unos:['m','p'], unas:['f','p'],
    este:['m','s'], esta:['f','s'], estos:['m','p'], estas:['f','p'],
    ese:['m','s'], esa:['f','s'], esos:['m','p'], esas:['f','p'],
    aquel:['m','s'], aquella:['f','s'],
    nuestro:['m','s'], nuestra:['f','s'], nuestros:['m','p'], nuestras:['f','p'],
    otro:['m','s'], otra:['f','s'], otros:['m','p'], otras:['f','p'],
    // mucho/todo quedan fuera a propósito: casi siempre son adverbio o
    // pronombre («mucho para enviarlo», «todo va bien»), no artículo.
    muchas:['f','p'], muchos:['m','p']
  };
  const CORRIGE = {
    'm,s':'el/un', 'f,s':'la/una', 'm,p':'los/unos', 'f,p':'las/unas'
  };
  const PAREJA = { el:'la', un:'una', la:'el', una:'un', los:'las', las:'los',
    unos:'unas', unas:'unos', este:'esta', esta:'este', ese:'esa', esa:'ese',
    estos:'estas', estas:'estos', otro:'otra', otra:'otro', mucho:'mucha', mucha:'mucho',
    todo:'toda', toda:'todo', nuestro:'nuestra', nuestra:'nuestro' };

  /* Persona del verbo por la terminación. Solo las formas inconfundibles:
     si hay duda no se dice nada. */
/* Terminar en -í o -é no basta para ser verbo: aquí, así, café y bebé
     tambien lo hacen, y por eso «Ella trabaja aquí» salia marcada. */
  const NO_VERBO = new Set(['aquí','ahí','allí','así','casi','ají','café','bebé','puré','pie',
    'sí','mí','ti','tí','magrebí','iraní','israelí','maní','colibrí','frenesí','ayer','hoy']);
  function persona(w){
    if(NO_VERBO.has(w)) return null;
    if(/[áéíóú]$/.test(w) && /ó$/.test(w)) return '3s';       // comió, habló
    if(/(é|í)$/.test(w)) return '1s';                          // comí, hablé
    if(/(aste|iste)$/.test(w)) return '2s';                    // comiste, hablaste
    if(/(aron|ieron)$/.test(w)) return '3p';                   // comieron
    if(/(amos|emos|imos)$/.test(w)) return '1p';
    if(/(áis|éis|ís)$/.test(w)) return '2p';
    return null;
  }
  const NOMBRE_P = { '1s':'yo', '2s':'tú', '3s':'él/ella', '1p':'nosotros', '2p':'vosotros', '3p':'ellos' };
  /* «tu» sin tilde es el posesivo («tu ayuda»), no el pronombre. Meterlo
     aquí hacía saltar «Gracias por tu ayuda» como error de concordancia. */
  const SUJ_P = { yo:'1s', tú:'2s', él:'3s', ella:'3s', usted:'3s',
    nosotros:'1p', nosotras:'1p', vosotros:'2p', ellos:'3p', ellas:'3p', ustedes:'3p' };
  const CAMBIA_1S = w => w.replace(/ió$/, 'í').replace(/ó$/, 'é');

  /* OJO con \b en español: en «días» la «í» no cuenta como letra para JS, así
     que \bd\b SÍ encuentra esa d y marcaba «Buenos días» como falta. Hay que
     usar una frontera que incluya las vocales acentuadas y la ñ. */
  const B0 = '(?<![\\wáéíóúüñÁÉÍÓÚÜÑ])', B1 = '(?![\\wáéíóúüñÁÉÍÓÚÜÑ])';
  const pal = (w, bien) => [new RegExp(B0 + w + B1, 'gi'), bien];

  /* Errores de escritura inconfundibles: no dependen del contexto */
  const FALTAS = [
    ['aser','hacer'], ['haser','hacer'], ['nadien','nadie'], ['haiga','haya'], ['haigan','hayan'],
    ['dijistes','dijiste'], ['fuistes','fuiste'], ['hicistes','hiciste'], ['distes','diste'],
    ['vinistes','viniste'], ['veniste','viniste'], ['comistes','comiste'], ['pudistes','pudiste'],
    ['tuvistes','tuviste'], ['dentrar','entrar'], ['iva','iba'], ['ivan','iban'],
    ['ablar','hablar'], ['aber','haber'], ['muncho','mucho'], ['agora','ahora'], ['truje','traje'],
    ['xq','porque'], ['pq','porque'], ['tb','también'], ['xfa','por favor'], ['tmb','también'],
    ['dnd','dónde'], ['qro','quiero'], ['aki','aquí'], ['asi','así'], ['tambien','también'],
    ['despues','después'], ['tambien','también']
  ].map(([m, b]) => pal(m, b));

  /* Interrogativos: dentro de una pregunta SIEMPRE llevan tilde */
  const INTERROG = { que:'qué', donde:'dónde', como:'cómo', cuando:'cuándo',
    quien:'quién', quienes:'quiénes', cual:'cuál', cuales:'cuáles',
    cuanto:'cuánto', cuanta:'cuánta', cuantos:'cuántos', cuantas:'cuántas', porque:'por qué' };

  function frases(txt){
    return String(txt || '').split(/(?<=[.?!])\s+|\n+/).map(s => s.trim()).filter(s => s.length > 1);
  }
  const limpiar = w => w.toLowerCase().replace(/[¿¡.,;:!?"()]/g, '');

  function revisar(f){
    const H = [];
    const add = (sev, regla, t, por, mal, bien) => H.push({ sev, regla, t, por, mal, bien });
    const tk = f.split(/\s+/).map(limpiar).filter(Boolean);
    const pregunta = /\?/.test(f);

    // 1 · Concordancia de género y número
    tk.forEach((w, i) => {
      const a = ART[w];
      if(!a) return;
      const sig = tk[i+1];
      if(!sig || ART[sig]) return;
      /* «Esa no era…»: detras del determinante hay una palabra funcional,
         no un sustantivo. Y en «No los confundas» ese «los» es pronombre
         atono, no articulo — se reconoce porque va detras de «no». */
      const FUNC = new Set(['no','ya','sí','si','que','más','muy','tan','como','cual','cuando','donde','me','te','se','le','nos','lo','la','los','las']);
      if(FUNC.has(sig)) return;
      if(['lo','la','los','las','le','les'].includes(w) && tk[i-1] === 'no') return;
      if(['lo','la','los','las'].includes(w)){
        let esVerbo1o2 = false;
        try {
          const an = (typeof MORFO !== 'undefined') ? MORFO.analizar(sig) : [];
          esVerbo1o2 = an.some(x => x.p === '1s' || x.p === '2s' || x.p === '1p' || x.p === '2p');
        } catch(e){}
        if(esVerbo1o2) return;
      }
      if(NUMEROS.has(sig) || /^[0-9]/.test(sig)) return;   // «las cinco» está bien
      const g = genero(sig), n = numero(sig);
      if(!g) return;
      // «el agua», «un área»: femeninas con «a» tónica que llevan el/un. Correcto.
      if(g === 'f' && a[0] === 'm' && a[1] === 's' && ES_A_TONICA.has(sig)) return;
      if(g !== a[0])
        add('rojo','ES-gen','«' + sig + '» es ' + (g === 'f' ? 'femenino' : 'masculino'),
          'El artículo tiene que ir en el mismo género que el sustantivo. <b>' + sig + '</b> es ' +
          (g === 'f' ? 'femenino, así que pide <b>la / una</b>' : 'masculino, así que pide <b>el / un</b>') + '.',
          w + ' ' + sig, (PAREJA[w] || CORRIGE[g + ',' + n]) + ' ' + sig);
      else if(n && n !== a[1])
        add('rojo','ES-num','No concuerda el número',
          'Si el sustantivo va en ' + (n === 'p' ? 'plural' : 'singular') + ', el artículo también.',
          w + ' ' + sig, (CORRIGE[g + ',' + n] || '').split('/')[0] + ' ' + sig);
    });

    // 2 · Persona del verbo — sale del analizador morfológico, no de una
    //     lista de terminaciones. Así reconoce «hice», «puso», «vino»…
    tk.forEach((w, i) => {
      const ana = (typeof MORFO !== 'undefined') ? MORFO.analizar(w) : [];
      const pers = ana.length ? [...new Set(ana.map(a => a.p))] : (persona(w) ? [persona(w)] : []);
      if(!pers.length) return;
      // Si la forma vale para varias personas («hablamos»), no hay nada que objetar
      const p = pers.length === 1 ? pers[0] : null;
      if(!p) return;
      /* El sujeto tiene que estar PEGADO al verbo (saltando solo un «no» o
         un adverbio corto). Antes miraba dos palabras atras y se saltaba el
         verbo de verdad: en «Ella trabaja aqui» emparejaba «ella» con «aqui». */
      const SALTA = new Set(['no','ya','siempre','nunca','también','tampoco','solo','sólo']);
      let k = i - 1;
      while(k >= 0 && SALTA.has(tk[k])) k--;
      const ant = tk[k];
      const suj = SUJ_P[ant];
      if(suj && suj !== p)
        add('rojo','ES-per','«' + ant + '» no va con «' + w + '»',
          '<b>' + w + '</b> es de <b>' + NOMBRE_P[p] + '</b>, pero el sujeto es <b>' + NOMBRE_P[suj] + '</b>. El verbo se conjuga según quién hace la acción.',
          (SUJ_P[ant] ? ant : ant2) + ' ' + w, (SUJ_P[ant] ? ant : ant2) + ' …');
      // «me comió» sin sujeto de 3ª: casi siempre querías decir «me comí»
      else if(!suj && ['me','nos'].includes(ant) && p === '3s' && !tk.slice(0, i-1).some(x => SUJ_P[x]))
        add('naranja','ES-refl','¿Querías decir «' + ant + ' ' + CAMBIA_1S(w) + '»?',
          '<b>' + ant + ' ' + w + '</b> significa que <b>otra persona</b> te hizo eso a ti. Si el que ' +
          'hizo la acción eres tú, va en primera persona: <b>' + ant + ' ' + CAMBIA_1S(w) + '</b>.',
          ant + ' ' + w, ant + ' ' + CAMBIA_1S(w));
    });

    /* 2b · El tiempo verbal contra el «cuándo». «Tengo hambre ayer» era el
       caso que se colaba: presente con marcador de pasado. */
    /* El tiempo verbal contra el «cuándo», con el analizador morfológico:
       ya no depende de terminaciones sueltas, así que reconoce cualquier
       forma — «hice», «puso», «tuvo», «anduvo»… */
    if(typeof MARC !== 'undefined' && typeof MORFO !== 'undefined' && !MARC.ES_ARRANQUE.test(f)){
      const enMarcador = m => new Set(m.toLowerCase().split(/\s+/));
      const verboDe = (excluir) => {
        for(const w of tk){
          if(excluir.has(w)) continue;
          const ms = MORFO.momentos(w);
          if(ms.length === 1) return { w, m: ms[0] };   // solo si NO es ambigua
        }
        return null;
      };
      if(MARC.ES_PAS.test(f)){
        const arr = MARC.ES_PAS.exec(f)[0];
        const v = verboDe(enMarcador(arr));
        if(v && (v.m === 'presente' || v.m === 'futuro'))
          add('rojo','ES-tiempo','«' + arr + '» pide pasado, y «' + v.w + '» está en ' + v.m,
            'Si dices <b>cuándo</b> pasó, el verbo va en pasado. <b>' + v.w + '</b> está en ' + v.m + '.',
            v.w + ' … ' + arr, 'pon «' + v.w + '» en pasado');
      }
      if(MARC.ES_FUT.test(f)){
        const arr = MARC.ES_FUT.exec(f)[0];
        const v = verboDe(enMarcador(arr));
        if(v && v.m === 'pasado')
          add('rojo','ES-tiempo','«' + arr + '» apunta al futuro, y «' + v.w + '» está en pasado',
            'El marcador dice que aún no ha pasado, pero el verbo lo da por terminado. No pueden ir juntos.',
            v.w + ' … ' + arr, 'pon «' + v.w + '» en futuro o presente');
      }
    }
    if(false){
      const arr = '';
      const iv = tk.findIndex(w => ES_PRESENTE.has(w) || /^(?!.*(é|í|ó|aste|iste|aron|ieron|aba|ía))(o|as|es|amos|emos|imos|an|en)$/.test(w.slice(-4)));
      /* «hace dos días» es el marcador; su «hace» no es el verbo de la frase.
         Sin esto, «Pasó hace dos días» se marcaba como error. */
      const marcador = new Set(arr.toLowerCase().split(/\s+/));
      const v = tk.find(w => ES_PRESENTE.has(w) && !marcador.has(w));
      if(v)
        add('rojo','ES-tiempo','«' + arr + '» pide pasado, y «' + v + '» está en presente',
          'Si dices <b>cuándo</b> pasó, el verbo tiene que ir en pasado. <b>' + v + '</b> es presente: ' +
          'con «' + arr + '» va <b>' + ES_A_PASADO[v] + '</b>.',
          v + ' … ' + arr, ES_A_PASADO[v] + ' … ' + arr);
    }


    // 3 · Faltas de escritura inconfundibles
    FALTAS.forEach(([re, bien]) => {
      const m = f.match(re);
      if(m) add('rojo','ES-orto','«' + m[0] + '» se escribe «' + bien + '»',
        'Es una forma que no existe en español escrito.', m[0], bien);
    });

    // 4 · Tildes de los interrogativos
    const PREPOS = new Set(['de','a','por','para','con','en','hasta','desde','sobre','hacia']);
    if(pregunta) tk.forEach((w, i) => {
      const t = INTERROG[w];
      if(!t) return;
      /* Solo cuenta si ABRE la pregunta (o va tras una preposición: «¿De
         dónde eres?»). Más adentro, «que» es conjunción y está bien. */
      if(!(i === 0 || (i === 1 && PREPOS.has(tk[0])))) return;
      add('rojo','ES-tilde','En pregunta, «' + w + '» lleva tilde',
        'Los interrogativos (<b>qué, dónde, cómo, cuándo, quién, cuál, cuánto</b>) se acentúan siempre que preguntan, aunque la pregunta sea indirecta.',
        w, t);
    });

    // 5 · Signos de apertura
    if(/\?$/.test(f.trim()) && !/^¿/.test(f.trim()))
      add('naranja','ES-signo','Falta el «¿» de apertura',
        'El español abre y cierra las preguntas. Es de los pocos idiomas que lo hace, y se nota cuando falta.',
        f.trim().slice(0, 18) + '…', '¿' + f.trim().slice(0, 18) + '…');
    if(/!$/.test(f.trim()) && !/^¡/.test(f.trim()))
      add('naranja','ES-signo','Falta el «¡» de apertura',
        'Igual que las preguntas, las exclamaciones se abren y se cierran.',
        f.trim().slice(0, 18) + '…', '¡' + f.trim().slice(0, 18) + '…');

    // 6 · Mayúscula inicial
    if(/^[a-záéíóúñü]/.test(f.trim()))
      add('naranja','ES-may','Empieza con mayúscula', 'Detalle de escritura.',
        f.trim().slice(0, 16) + '…', f.trim().charAt(0).toUpperCase() + f.trim().slice(1, 16) + '…');

    return H;
  }

  function analizar(txt){
    const fs = frases(txt);
    if(!fs.length) return null;
    const todas = [];
    fs.forEach(f => todas.push(...revisar(f)));
    const rojos = todas.filter(x => x.sev === 'rojo').length;
    const naranjas = todas.filter(x => x.sev === 'naranja').length;
    return { luz: rojos ? 'rojo' : naranjas ? 'naranja' : 'verde',
             rojos, naranjas, hallazgos: todas };
  }

  /* Corrige lo que es sustitución limpia y vuelve a revisar, igual que en
     inglés: no se da por buena una frase que sigue mal. */
  function corregir(txt, hallazgos){
    let out = txt, tocado = false;
    hallazgos.forEach(h => {
      if(!h.bien || !h.mal || h.bien.includes('…') || h.bien.includes('/')) return;
      const re = new RegExp(h.mal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      if(re.test(out)){ out = out.replace(re, h.bien); tocado = true; }
    });
    if(!tocado) return null;
    out = out.trim();
    out = out.charAt(0).toUpperCase() + out.slice(1);
    // Dos arreglos que se solapan pueden dejar «yesterday..» o « .»
    out = out.replace(/([.?!])\1+$/, '$1').replace(/\s+([.?!])/g, '$1');
    if(/\?$/.test(out) && !/^¿/.test(out)) out = '¿' + out;
    if(/!$/.test(out) && !/^¡/.test(out)) out = '¡' + out;
    if(!/[.?!]$/.test(out)) out += '.';
    const rev = analizar(out);
    const quedan = rev ? rev.hallazgos.filter(h => h.sev === 'rojo') : [];
    return { txt: out, limpia: quedan.length === 0, quedan };
  }

  /* Casos con respuesta conocida, para poder repetir la comprobación */
  const CASOS = [
    ['ayer me comió un manzana.', 'rojo'],
    ['Comí una manzana ayer.', 'verde'],
    ['El problema es difícil.', 'verde'],
    ['La problema es difícil.', 'rojo'],
    ['El agua está fría.', 'verde'],
    ['Tengo la mano rota.', 'verde'],
    ['Yo comió una manzana.', 'rojo'],
    ['¿Dónde trabajas?', 'verde'],
    ['¿Donde trabajas?', 'rojo'],
    ['Voy a aser la tarea.', 'rojo'],
    ['Nosotros comimos temprano.', 'verde'],
    ['Ellos comieron temprano.', 'verde'],
    ['Un momento, por favor.', 'verde'],
    ['Las casas son grandes.', 'verde'],
    // Marcadores temporales — el caso que se colaba
    ['Tengo hambre ayer.', 'rojo'], ['Tenía hambre ayer.', 'verde'],
    ['Ayer comí una manzana.', 'verde'], ['Voy al gimnasio todos los días.', 'verde'],
    ['Desde ayer tengo hambre.', 'verde'], ['Ayer estoy cansado.', 'rojo'],
    // Irregulares que las terminaciones no cazaban
    ['Hice el almuerzo mañana por la tarde.', 'rojo'],
    ['Hice el almuerzo ayer por la tarde.', 'verde'],
    ['Haré el almuerzo mañana por la tarde.', 'verde'],
    ['Ayer puse la mesa.', 'verde'], ['Mañana puse la mesa.', 'rojo'],
    ['Ayer vengo temprano.', 'rojo'], ['Ayer vine temprano.', 'verde'],
    ['Yo hizo la tarea.', 'rojo'], ['Yo hice la tarea.', 'verde'],
    ['Nosotros hablamos ayer.', 'verde']
  ];
  function probar(){
    const fallos = [];
    CASOS.forEach(([f, esp]) => {
      const r = analizar(f);
      if(!r || r.luz !== esp)
        fallos.push(f + ' → esperaba ' + esp + ', dio ' + (r ? r.luz : 'nada') +
          (r ? ' [' + r.hallazgos.map(h => h.regla).join(',') + ']' : ''));
    });
    return { casos: CASOS.length, fallos };
  }
  return { analizar, corregir, probar, genero, persona, CASOS };
})();

/* ══════════════════════════════════════════════════════════════════════
   BUSCADOR DE CONTEXTO · abre la palabra en el mejor recurso gratis
   ──────────────────────────────────────────────────────────────────────
   Los cuatro se probaron el 02-sep-2026 abriéndolos de verdad con la
   palabra "as". Los cuatro cargan completos, sin login y sin muro de pago.
   Cada uno da un tipo DISTINTO de contexto, por eso están los cuatro:
   uno solo se queda corto.

   Funciona en TODO el documento: doble clic sobre cualquier palabra.
════════════════════════════════════════════════════════════════════════ */
const RECURSOS = [
  { id:'wr', n:'WordReference', ico:'📖', mejor:'palabra',
    q:'El más completo inglés↔español. Separa los sentidos por función (adverbio, conjunción, preposición…) y <b>cada uno trae su ejemplo traducido</b>. Abajo, foros donde nativos discuten los matices.',
    url:w => 'https://www.wordreference.com/es/translation.asp?tranword=' + encodeURIComponent(w) },
  { id:'cam', n:'Cambridge', ico:'🎓', mejor:'aprender',
    q:'Pensado para quien aprende: te dice el <b>nivel</b> de la palabra (A1, A2, B1…), trae recuadros de gramática y muchos ejemplos graduados, con audio UK y US.',
    url:w => 'https://dictionary.cambridge.org/dictionary/english-spanish/' + encodeURIComponent(w) },
  { id:'rev', n:'Reverso Context', ico:'🔀', mejor:'frase',
    q:'Frases reales en los dos idiomas, una al lado de la otra. <b>El mejor para expresiones de varias palabras</b> y para ver cómo se usa de verdad, no cómo dice el diccionario.',
    url:w => 'https://context.reverso.net/translation/english-spanish/' + encodeURIComponent(w) },
  { id:'you', n:'YouGlish', ico:'🎧', mejor:'oído',
    q:'La palabra <b>dicha por gente real</b> en miles de vídeos de YouTube, con subtítulo y el contexto de la frase. Es lo más parecido a oírla en la calle.',
    url:w => 'https://youglish.com/pronounce/' + encodeURIComponent(w) + '/english' }
];

const DIC = (() => {
  let pop = null;
  const cerrar = () => { if(pop){ pop.remove(); pop = null; } };

  function abrir(texto, x, y){
    cerrar();
    const t = String(texto || '').trim().replace(/\s+/g, ' ');
    if(!t) return;
    const varias = t.split(' ').length > 1;
    // Una palabra suelta → WordReference. Varias → Reverso, que es el que sirve para frases.
    const orden = varias ? ['rev','wr','cam','you'] : ['wr','cam','rev','you'];
    const lista = orden.map(id => RECURSOS.find(r => r.id === id));

    pop = document.createElement('div');
    pop.className = 'dic-pop';
    pop.innerHTML = `<div class="dic-h"><span class="dic-w">${esc(t)}</span>
        <button class="spk sm" data-say="${esc(t)}" title="Oírla">🔊</button>
        <button class="dic-x" title="Cerrar">✕</button></div>
      <div class="dic-sub">${varias ? 'Expresión de varias palabras' : 'Palabra suelta'} · abre en una pestaña nueva</div>
      ${lista.map((r, i) => `<a class="dic-o${i === 0 ? ' top' : ''}" href="${r.url(t)}" target="_blank" rel="noopener">
        <div class="dic-n">${r.ico} ${esc(r.n)}${i === 0 ? '<span class="dic-tag">el mejor para esto</span>' : ''}</div>
        <div class="dic-q">${r.q}</div></a>`).join('')}`;
    document.body.appendChild(pop);

    const ancho = Math.min(340, window.innerWidth - 24);
    pop.style.width = ancho + 'px';
    pop.style.left = Math.max(12, Math.min(x - ancho / 2, window.innerWidth - ancho - 12)) + 'px';
    const alto = pop.offsetHeight;
    pop.style.top = (y + alto + 16 > window.innerHeight ? y - alto - 10 : y + 12) + window.scrollY + 'px';
    pop.querySelector('.dic-x').onclick = cerrar;
  }

  /* Doble clic en cualquier palabra del documento. Asi funciona en TODOS
     los modulos sin tener que tocar el render de cada uno. */
  document.addEventListener('dblclick', e => {
    if(e.target.closest('input,textarea,[contenteditable="true"],.dic-pop,a,button')) return;
    const sel = (window.getSelection && window.getSelection().toString() || '').trim();
    if(!sel || sel.length > 40 || !/^[a-zA-Z][a-zA-Z' -]*$/.test(sel)) return;
    abrir(sel, e.clientX, e.clientY);
  });
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-dic]');
    if(b){ e.preventDefault(); e.stopPropagation();
      const r = b.getBoundingClientRect();
      abrir(b.getAttribute('data-dic'), r.left + r.width / 2, r.bottom); return; }
    if(!e.target.closest('.dic-pop')) cerrar();
  });
  document.addEventListener('keydown', e => { if(e.key === 'Escape') cerrar(); });
  window.addEventListener('scroll', cerrar, { passive:true });
  return { abrir, cerrar, RECURSOS };
})();


/* ══════════════════════════════════════════════════════════════════════
   MÓDULO ESCRIBIR · los dos recuadros + semáforo
════════════════════════════════════════════════════════════════════════ */
const WR = (() => {
  let dir = 'en';                 // en qué recuadro estás escribiendo
  let tmr = null, pidiendo = false;
  let ultimo = { en:'', es:'', trad:null, err:null };

  const LUZ = {
    verde:   { ico:'🟢', t:'Correcta',  d:'No encontré nada que corregir con las reglas del documento.' },
    naranja: { ico:'🟠', t:'Parcial',   d:'Se entiende y no está mal, pero hay cosas que la harían sonar nativa.' },
    rojo:    { ico:'🔴', t:'Hay errores', d:'Rompe al menos una regla no negociable. Míralas abajo, una por una.' }
  };

  /* ── Traducción. Es un APOYO, no el camino crítico: si se cae, el
     corrector sigue funcionando entero y se dice que se cayó. ── */
  /* Una pregunta se reconoce por el «?» final, no por el «¿» de apertura.
     Medido el 09-sep contra el traductor: «tu puedes manejar?» devolvía
     «you can drive?» (una afirmación con signo), y «¿tu puedes manejar?»
     devolvía «Can you drive?». O sea, el resultado dependía de un signo que
     casi nadie teclea. Aquí se le pone antes de enviarlo — al usuario no se
     le cambia lo que escribió, solo se le manda al traductor bien formado. */
  function normalizarES(txt){
    return String(txt || '').split(/\n/).map(linea => {
      const t = linea.trim();
      if(!t) return linea;
      if(/\?\s*$/.test(t) && !t.includes('¿')) return '¿' + t;
      if(/!\s*$/.test(t) && !t.includes('¡')) return '¡' + t;
      return linea;
    }).join('\n');
  }
  /* ══════════ EL TRADUCTOR ══════════
     MEDIDO el 11-sep desde mikel696.github.io, que es lo que importa:

       translate.googleapis.com/translate_a/single  →  Failed to fetch (CORS)
       translate.google.com/translate_a/single      →  Failed to fetch (CORS)
       lingva.ml · libretranslate.de                →  Failed to fetch
       clients5.google.com/translate_a/t            →  200 OK, 680 ms  ✔
       api.mymemory.translated.net                  →  200 OK, 650 ms  ✔

     El que estaba de PRIMERO llevaba tiempo sin funcionar desde el sitio
     publicado: Google no autoriza esa ruta desde otro dominio. Lo único que
     respondía era el respaldo, y el respaldo estaba puesto SOLO para es→en.
     De ahí el «a veces funciona»: de español a inglés iba por el respaldo, de
     inglés a español no iba nunca.

     Ahora hay tres fuentes en cadena, las dos primeras comprobadas hoy, y la
     tercera por si algún día vuelve. Cada una con su tope de tiempo: una
     petición colgada bloqueaba la traducción entera sin decir nada.           */

  const TRAD_CACHE = 'eng_trad_cache';

  /* Lo ya traducido se guarda. Dos motivos: la misma frase no vuelve a salir a
     la red —es instantáneo y no gasta cuota— y si te quedas sin internet, lo
     que ya miraste sigue disponible. Tope de 300 entradas: es una caché, no un
     almacén, y no puede crecer hasta comerse el espacio del cuaderno. */
  function cacheLeer(k){
    try {
      const c = JSON.parse(LS.get(TRAD_CACHE) || '{}');
      return c[k] || null;
    } catch(e){ return null; }
  }
  function cacheGuardar(k, v){
    try {
      const c = JSON.parse(LS.get(TRAD_CACHE) || '{}');
      c[k] = v;
      const ks = Object.keys(c);
      if(ks.length > 300) ks.slice(0, ks.length - 300).forEach(x => delete c[x]);
      LS.set(TRAD_CACHE, JSON.stringify(c));
    } catch(e){}
  }

  /* Una petición sin tope de tiempo puede quedarse colgada para siempre y el
     usuario se queda mirando un «traduciendo…» que no acaba nunca. */
  async function pide(url, ms){
    const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const t = setTimeout(() => { if(ctl) ctl.abort(); }, ms || 7000);
    try {
      const r = await fetch(url, ctl ? { signal: ctl.signal } : undefined);
      clearTimeout(t);
      if(!r.ok) throw new Error('HTTP ' + r.status);
      return await r.text();
    } catch(e){ clearTimeout(t); throw e; }
  }

  const FUENTES = [
    { n:'Google Translate',
      url:(q, de, a) => 'https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=' +
                        de + '&tl=' + a + '&q=' + encodeURIComponent(q),
      saca: t => { const j = JSON.parse(t);
                   return Array.isArray(j) ? j.map(x => typeof x === 'string' ? x : (x && x[0]) || '').join('') : null; } },

    { n:'MyMemory',
      url:(q, de, a) => 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(q) +
                        '&langpair=' + de + '|' + a,
      saca: t => { const j = JSON.parse(t);
                   const s = j && j.responseData && j.responseData.translatedText;
                   /* MyMemory devuelve el aviso de cuota COMO SI FUERA la
                      traducción. Si se colara, el usuario leería un error en
                      inglés creyendo que es su frase traducida. */
                   if(!s || /MYMEMORY WARNING|QUERY LENGTH LIMIT/i.test(s)) return null;
                   return s; } },

    { n:'Google (ruta antigua)',
      url:(q, de, a) => 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=' +
                        de + '&tl=' + a + '&dt=t&q=' + encodeURIComponent(q),
      saca: t => { const j = JSON.parse(t);
                   return j[0].map(x => x[0]).join(''); } }
  ];

  async function traducir(txt, de, a){
    if(de === 'es') txt = normalizarES(txt);
    const limpio = String(txt || '').trim();
    if(!limpio) return null;

    const clave = de + '>' + a + ':' + limpio;
    const guardada = cacheLeer(clave);
    if(guardada) return { txt:guardada.t, fuente:guardada.f, deCache:true };

    const fallos = [];
    for(const F of FUENTES){
      try {
        const crudo = await pide(F.url(limpio, de, a), 7000);
        const s = (F.saca(crudo) || '').trim();
        if(s){
          cacheGuardar(clave, { t:s, f:F.n });
          return { txt:s, fuente:F.n };
        }
        fallos.push(F.n + ': respuesta vacía');
      } catch(e){
        fallos.push(F.n + ': ' + (e && e.name === 'AbortError' ? 'tardó demasiado' : 'no responde'));
      }
    }
    /* Se devuelve POR QUÉ falló cada una. Un «no hay internet» cuando sí lo
       hay manda a buscar el problema al sitio equivocado. */
    return { error:true, detalle:fallos };
  }

  /* Aplica las correcciones que son sustituciones limpias de texto, y DESPUÉS
     vuelve a analizar el resultado. Solo se llama «corregida» si al revisarla
     de nuevo sale en verde: presentar como correcta una frase que sigue mal
     sería peor que no ofrecer nada. Si quedan cosas, se dice cuáles. */
  function corregir(txt, hallazgos){
    let out = txt, tocado = false;
    hallazgos.forEach(h => {
      if(h.sev === 'info' || !h.bien || !h.mal) return;
      if(/^[(«]/.test(h.bien) || h.bien.includes('«') || h.bien.includes('…')) return;
      const bien = h.bien.split(' · ')[0];
      const re = new RegExp(h.mal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      if(re.test(out)){ out = out.replace(re, bien); tocado = true; }
    });
    if(!tocado) return null;
    out = out.trim();
    out = out.charAt(0).toUpperCase() + out.slice(1);
    // Dos arreglos que se solapan pueden dejar «yesterday..» o « .»
    out = out.replace(/([.?!])\1+$/, '$1').replace(/\s+([.?!])/g, '$1');
    if(!/[.?!]$/.test(out)) out += /\?/.test(txt) ? '?' : '.';
    // Auto-verificación: ¿la corrección quedó realmente limpia?
    const rev = ANL.analizar(out);
    const quedan = rev ? rev.hallazgos.filter(h => h.sev === 'rojo') : [];
    return { txt:out, limpia: quedan.length === 0, quedan };
  }

  const CLS = { suj:'s-suj', aux:'s-aux', ver:'s-ver', com:'s-com', neg:'s-neg', wh:'s-wh' };
  const NOMBRE = { suj:'SUJETO', aux:'AUXILIAR', ver:'VERBO', com:'COMPLEMENTO', neg:'not', wh:'WH' };

  function piezasHTML(pz){
    return pz.filter(p => /[a-z]/.test(p.w))
      .map(p => `<span class="slot ${CLS[p.r]} wr-tk" data-dic="${esc(p.w)}" title="${NOMBRE[p.r]} · doble clic o toca para buscarla">${esc(p.w)}</span>`)
      .join('<span class="lab-p">+</span>');
  }

  const FORMA = { af:'Afirmar', ne:'Negar', pr:'Preguntar', wh:'Pregunta abierta' };

  function render(){
    const cont = $('wrOut'); if(!cont) return;
    const en = ($('wrEn') || {}).value || '';
    const es = ($('wrEs') || {}).value || '';

    if(!en.trim() && !es.trim()){
      cont.innerHTML = `<div class="wr-vacio">
        <div class="wr-vico">✍️</div>
        <div class="wr-vt">Escribe la frase que se te venga a la cabeza</div>
        <div class="wr-vd">Da igual el recuadro. Escribe en <b>inglés</b> y te digo si está bien y qué regla rompiste;
          escribe en <b>español</b> y te doy el inglés y te explico por qué se arma así.<br>
          Todo el análisis funciona <b>sin internet</b>. Solo la traducción necesita red.</div>
        <div class="wr-ej">Prueba con una de estas, que están mal a propósito:
          ${['She work here.','I not understand.','Where you live?','Did you went?','I have 30 years.']
            .map(x => `<button class="wr-eb" data-wrej="${esc(x)}">${esc(x)}</button>`).join('')}</div>
      </div>`;
      cont.querySelectorAll('[data-wrej]').forEach(b => b.onclick = () => {
        $('wrEn').value = b.dataset.wrej; dir = 'en'; cambio(true);
      });
      return;
    }

    // Siempre se analiza el INGLÉS: el tuyo si lo escribiste, o el traducido
    const ingles = (dir === 'en' ? en : (ultimo.trad || '')).trim();

    /* Si estás escribiendo en español, el análisis de TU español sale ya:
       es local y no depende de la red. Solo el inglés espera la traducción. */
    if(!ingles){
      const rE = dir === 'es' && es.trim() ? ES.analizar(es) : null;
      const gE = rE ? rE.hallazgos.filter(h => h.sev !== 'info') : [];
      const cE = rE ? ES.corregir(es, rE.hallazgos) : null;
      const LE = LUZ[rE ? rE.luz : 'verde'];
      cont.innerHTML = (rE ? `
        <div class="wr-sem ${rE.luz}">
          <div class="wr-luces">
            <span class="wr-luz${rE.luz==='verde'?' on v':''}"></span>
            <span class="wr-luz${rE.luz==='naranja'?' on n':''}"></span>
            <span class="wr-luz${rE.luz==='rojo'?' on r':''}"></span>
          </div>
          <div class="wr-semt"><b>${LE.ico} ${LE.t}</b><span>${LE.d}</span></div>
          <span class="wr-badge">revisando tu español</span>
        </div>
        ${gE.length ? `<div class="wr-card">
          <div class="wr-ct">🇪🇸 Qué corregir en tu español · ${gE.length}</div>
          ${gE.map(h => `<div class="wr-h ${h.sev}">
            <div class="wr-ht"><span class="wr-hr">${esc(h.regla)}</span>${h.t}</div>
            <div class="wr-hp">${h.por}</div>
            <div class="wr-hx"><span class="dx-bad">✗ ${esc(h.mal)}</span><span class="dx-good">✓ ${esc(h.bien)}</span></div>
          </div>`).join('')}
          ${cE ? `<div class="wr-fix" style="font-size:15px;margin-top:12px">${esc(cE.txt)}</div>
            <button class="lab-b" data-wrses2="${esc(cE.txt)}">⬆️ Poner esta en el recuadro</button>` : ''}
        </div>` : `<div class="wr-card ok"><div class="wr-ct">🇪🇸 Tu español está bien</div>
          <div class="wr-cb">Revisé concordancia de género y número, conjugación, tildes de
          interrogativos, signos de apertura y las faltas de escritura más comunes.</div></div>`}` : '')
        + `<div class="wr-esp">${ultimo.err
          ? '⚠️ ' + esc(ultimo.err) + '<div class="wr-espd">El análisis de arriba <b>no necesita internet</b>. Para el inglés sí hace falta.</div>'
          : '⏳ Traduciendo al inglés…'}</div>`;
      cont.querySelectorAll('[data-wrses2]').forEach(b => b.onclick = () => {
        $('wrEs').value = b.dataset.wrses2; dir = 'es'; cambio(true);
      });
      return;
    }

    const r = ANL.analizar(ingles);
    if(!r){ cont.innerHTML = ''; return; }
    const L = LUZ[r.luz];
    const f0 = r.frases[0];
    const T = LAB_T.find(x => x.id === f0.tiempo);
    const corr = dir === 'en' ? corregir(ingles, r.hallazgos) : null;
    const graves = r.hallazgos.filter(h => h.sev !== 'info');
    const infos  = r.hallazgos.filter(h => h.sev === 'info');

    /* «¿Quieres decir…?» — se saca la intención de lo que escribiste (quién,
       qué acción, negada o no, qué pregunta) y se reconstruyen frases
       correctas con el MISMO generador que produce las 640 del Laboratorio.
       No es una adivinanza: sale de una gramática ya verificada. */
    let sugHTML = '';
    if(dir === 'en' && graves.length){
      let cand = [];
      try { cand = SUG.candidatas(f0.t, /\?/.test(ingles)); } catch(e){}
      cand = cand.filter(c => c.frase.toLowerCase().replace(/[^a-z ]/g,'') !==
                              ingles.toLowerCase().replace(/[^a-z ]/g,''));
      if(cand.length){
        sugHTML = `<div class="wr-card sug">
          <div class="wr-ct">💡 ¿Quieres decir…?</div>
          <div class="wr-cb" style="margin-bottom:10px">Reconstruí tu idea con las piezas que reconocí.
            Cada opción cambia <b>cuándo</b> pasa la acción — elige la que de verdad querías decir:</div>
          ${cand.map((c, i) => `<div class="wr-sug" data-wrsug="${esc(c.frase)}">
            <div class="wr-sn"><span class="wr-si">${i + 1}</span>${esc(c.frase)}
              <button class="spk sm" data-say="${esc(c.frase)}">🔊</button></div>
            <div class="wr-sq"><span class="wr-chip">${esc(c.info ? c.info.n : '')}</span>
              <span class="wr-ses" data-wrses="${esc(c.frase)}">traduciendo…</span></div>
            <div class="wr-sw">${c.info ? c.info.cuando : ''}</div>
            <button class="lab-b" data-wrusar="${esc(c.frase)}">Usar esta ⬆️</button>
          </div>`).join('')}
        </div>`;
        // El español de cada opción se pide después, para no frenar el pintado
        setTimeout(() => cand.forEach(async c => {
          const t = await traducir(c.frase, 'en', 'es');
          document.querySelectorAll(`[data-wrses="${CSS.escape(c.frase)}"]`).forEach(el => {
            el.textContent = (t && t.txt) ? '= ' + t.txt : '(sin conexión para traducirla)';
          });
        }), 30);
      }
    }

    /* La luz es la del recuadro en el que estás escribiendo. Si escribes en
       español se revisa TU español; el inglés traducido se revisa aparte y
       se muestra debajo, pero no manda en el semáforo. */
    const rES = es.trim() ? ES.analizar(es) : null;
    const propio = dir === 'es' ? rES : r;
    const Lp = LUZ[propio ? propio.luz : 'verde'];
    const gravesES = rES ? rES.hallazgos.filter(h => h.sev !== 'info') : [];
    const corrES = dir === 'es' && rES ? ES.corregir(es, rES.hallazgos) : null;

    cont.innerHTML = `
      <div class="wr-sem ${propio ? propio.luz : 'verde'}">
        <div class="wr-luces">
          <span class="wr-luz${propio && propio.luz==='verde'?' on v':''}"></span>
          <span class="wr-luz${propio && propio.luz==='naranja'?' on n':''}"></span>
          <span class="wr-luz${propio && propio.luz==='rojo'?' on r':''}"></span>
        </div>
        <div class="wr-semt"><b>${Lp.ico} ${Lp.t}</b><span>${Lp.d}</span></div>
        <span class="wr-badge">revisando tu ${dir === 'es' ? 'español' : 'inglés'}</span>
      </div>

      ${dir === 'es' && gravesES.length ? `<div class="wr-card">
        <div class="wr-ct">🇪🇸 Qué corregir en tu español · ${gravesES.length}</div>
        ${gravesES.map(h => `<div class="wr-h ${h.sev}">
          <div class="wr-ht"><span class="wr-hr">${esc(h.regla)}</span>${h.t}</div>
          <div class="wr-hp">${h.por}</div>
          <div class="wr-hx"><span class="dx-bad">✗ ${esc(h.mal)}</span><span class="dx-good">✓ ${esc(h.bien)}</span></div>
        </div>`).join('')}
        ${corrES ? `<div class="wr-fix" style="font-size:15px;margin-top:12px">${esc(corrES.txt)}</div>
          ${corrES.limpia ? '' : '<div class="wr-cb">Corregí lo que pude; revisa el resto arriba.</div>'}
          <button class="lab-b" data-wrses2="${esc(corrES.txt)}">⬆️ Poner esta en el recuadro</button>` : ''}
      </div>` : ''}

      ${dir === 'es' && rES && rES.luz === 'verde' ? `<div class="wr-card ok">
        <div class="wr-ct">🇪🇸 Tu español está bien</div>
        <div class="wr-cb">Revisé concordancia de género y número, conjugación, tildes de interrogativos,
          signos de apertura y las faltas de escritura más comunes.</div></div>` : ''}

      ${dir === 'es' ? '<div class="wr-sep">Y así queda en inglés:</div>' : ''}

      <div class="wr-card">
        <div class="wr-ct">🧩 Las 6 piezas ${dir === 'es' ? 'del inglés' : 'de tu frase'}</div>
        <div class="wr-pz">${piezasHTML(f0.piezas)}</div>
        <div class="wr-nota">Toca cualquier pieza para buscarla en el diccionario. Son los mismos colores de todo el documento.</div>
      </div>

      <div class="wr-card">
        <div class="wr-ct">⏳ Qué estás usando</div>
        <div class="wr-usa"><span class="wr-chip">${esc(T ? T.n : 'Presente simple')}</span>
          <span class="wr-chip alt">${esc(FORMA[f0.forma])}</span></div>
        <div class="wr-cb">${T ? T.cuando : ''}</div>
        ${T ? `<div class="wr-cb" style="margin-top:7px">${T.verboPor}</div>
        <div class="lab-pistas">Palabras que delatan este tiempo: <b>${esc(T.pistas)}</b></div>` : ''}
        <button class="lab-b" onclick="APP.go('p0')" style="margin-top:10px">🧪 Verla en el Laboratorio →</button>
      </div>

      ${sugHTML}
      ${graves.length ? `<div class="wr-card">
        <div class="wr-ct">🔧 Qué corregir · ${graves.length}</div>
        ${graves.map(h => `<div class="wr-h ${h.sev}">
          <div class="wr-ht"><span class="wr-hr">${esc(h.regla)}</span>${h.t}</div>
          <div class="wr-hp">${h.por}</div>
          <div class="wr-hx"><span class="dx-bad">✗ ${esc(h.mal)}</span><span class="dx-good">✓ ${esc(h.bien)}</span></div>
        </div>`).join('')}
      </div>` : `<div class="wr-card ok">
        <div class="wr-ct">✅ Nada que corregir</div>
        <div class="wr-cb">Revisé las 15 reglas no negociables y las trampas de traducción literal más comunes, y esta frase las pasa todas.</div>
      </div>`}

      ${infos.length ? infos.map(h => `<div class="wr-card info">
        <div class="wr-ct">ℹ️ ${h.t}</div><div class="wr-cb">${h.por}</div></div>`).join('') : ''}

      ${corr ? `<div class="wr-card ${corr.limpia ? 'fix' : 'parcial'}">
        <div class="wr-ct">${corr.limpia ? '✍️ Tu frase, corregida' : '⚠️ Corregí lo que pude — todavía no está lista'}</div>
        <div class="wr-fix">${esc(corr.txt)} <button class="spk" data-say="${esc(corr.txt)}">🔊</button></div>
        ${corr.limpia ? '' : `<div class="wr-cb" style="margin-bottom:10px">Le apliqué los arreglos que son un cambio directo de palabra,
          y volví a revisarla: <b>sigue teniendo ${corr.quedan.length} problema${corr.quedan.length > 1 ? 's' : ''}</b>
          (${corr.quedan.map(q => esc(q.t)).join(' · ')}). Ese hay que rehacerlo a mano, no es cambiar una palabra por otra —
          mira arriba el ✓ de esa regla. <b>No te la doy por buena.</b></div>`}
        <div class="wr-acts">
          ${corr.limpia ? `<button class="lab-b" data-nb-en="${esc(corr.txt)}" data-nb-es="${esc(dir === 'en' ? (ultimo.trad || es) : es)}">📓 Guardar en mi cuaderno</button>` : ''}
          <button class="lab-b" data-wrusar="${esc(corr.txt)}">⬆️ Ponerla en el recuadro y seguir</button>
        </div>
      </div>` : (dir === 'en' && r.luz === 'verde' ? `<div class="wr-acts" style="margin-top:10px">
          <button class="lab-b" data-nb-en="${esc(ingles.trim())}" data-nb-es="${esc(ultimo.trad || es)}">📓 Guardar en mi cuaderno</button>
        </div>` : '')}

      ${ultimo.err ? `<div class="wr-card info"><div class="wr-ct">⚠️ Traductor sin conexión</div>
        <div class="wr-cb">${esc(ultimo.err)} <b>El análisis de arriba no se vio afectado</b>: es 100% local.</div></div>` : ''}`;

    cont.querySelectorAll('[data-wrusar]').forEach(b => b.onclick = () => {
      $('wrEn').value = b.dataset.wrusar; dir = 'en'; cambio(true);
    });
    cont.querySelectorAll('[data-wrses2]').forEach(b => b.onclick = () => {
      $('wrEs').value = b.dataset.wrses2; dir = 'es'; cambio(true);
    });
  }

  /* Se dispara al escribir. La traducción va con retardo para no pedirla
     en cada tecla; el análisis es local y se repinta al instante. */
  function cambio(inmediato){
    render();
    clearTimeout(tmr);
    tmr = setTimeout(async () => {
      const en = $('wrEn').value.trim(), es = $('wrEs').value.trim();
      const src = dir === 'en' ? en : es;
      if(!src){ if(dir === 'en') $('wrEs').value = ''; else $('wrEn').value = ''; ultimo.trad = null; render(); return; }
      if(pidiendo) return;
      pidiendo = true; ultimo.err = null;
      const t = await traducir(src, dir === 'en' ? 'en' : 'es', dir === 'en' ? 'es' : 'en');
      pidiendo = false;
      if(t && t.txt){
        ultimo.trad = t.txt; ultimo.fuente = t.fuente;
        if(dir === 'en') $('wrEs').value = t.txt; else $('wrEn').value = t.txt;
      } else {
        ultimo.trad = null;
        /* Se dice QUE fuente fallo y por que. Un «no hay internet» cuando si
           lo hay manda a buscar el problema al sitio equivocado. */
        ultimo.err = (t && t.detalle && t.detalle.length)
          ? 'Ninguna fuente respondio · ' + t.detalle.join(' · ')
          : 'No pude contactar el traductor (sin internet, o el servicio no respondio).';
      }
      render();
    }, inmediato ? 120 : 700);
  }

  function wire(){
    const a = $('wrEn'), b = $('wrEs');
    if(!a || !b) return;
    a.addEventListener('input', () => { dir = 'en'; cambio(); });
    b.addEventListener('input', () => { dir = 'es'; cambio(); });
    a.addEventListener('focus', () => { dir = 'en'; });
    b.addEventListener('focus', () => { dir = 'es'; });
    const lim = $('wrClear');
    if(lim) lim.onclick = () => { a.value = ''; b.value = ''; ultimo = { en:'', es:'', trad:null, err:null }; render(); };
    render();
  }
  return { render, wire, traducir, corregir };
})();



/* ══════════════════════════════════════════════════════════════════════
   CLUB DE FRASES · el método de julebu.co, con nuestro material
   ──────────────────────────────────────────────────────────────────────
   Miguel pidió replicar la metodología de julebu.co (句乐部, «el club de
   las frases»): 700.000 usuarios en China aprendiendo inglés **tecleando
   frases enteras como si fuera un juego de combos**.

   Lo que hacen, revisado en su web el 09-sep-2026:
   · Se aprende por FRASES, nunca por palabras sueltas.
   · La frase se muestra partida en RANURAS gramaticales, y cada palabra
     lleva su significado y su categoría.
   · Tecleas palabra por palabra; el ESPACIO confirma cada una.
   · Aciertos seguidos = COMBO. A los 20 se dobla la puntuación.
     Rangos C → B → A → S → SS → SSS (SSS pide ≥95 % de acierto).
   · Seis modos: leer · traducir · dictado · escuchar en 3 fases ·
     hablar con puntuación · vídeo.
   · Repaso espaciado que se ajusta según cómo respondiste.

   Por qué encaja aquí sin inventar nada: las 1000 frases del documento YA
   traen molde gramatical (`S + was + ADJ`), traducción, tiempo, función y
   una nota didáctica; y las 2000 palabras traen categoría y uso. Sus
   «ranuras» son nuestras 6 piezas de colores, que ya son el pilar de todo
   el documento.

   Lo que NO se copia, y se dice: ellos muestran transcripción fonética
   (IPA) de cada palabra. **No tenemos una fuente verificada de IPA para
   estas 2000 palabras, así que no se inventa**: en su lugar va el audio
   real, que sí tenemos. Y su «profesor de IA» aquí es el análisis
   estructural que ya existe — no una IA, y se avisa.
════════════════════════════════════════════════════════════════════════ */
const CLUB = (() => {
  const K = 'eng_cf';
  const RONDA = 8;                    // frases por vuelta

  /* Los modos son una ESCALERA, de menos a más exigente, y se muestran en ese
     orden. Antes faltaba el segundo peldaño: salvo «Leer», todos pedían
     producir la frase entera de memoria, así que se pasaba de mirar a teclear
     a ciegas de golpe. «Armar» es el puente — las palabras están delante y solo
     hay que ponerlas en orden. Es además el único modo que se puede jugar sin
     saber teclear, que era lo que dejaba fuera a una niña. */
  /* Cada modo entrena UNA cosa distinta y se juega distinto.
     Antes Traducir, Dictado y Escuchar eran el mismo ejercicio con otra puerta
     de entrada —leer u oír, y luego reproducir la frase entera—, así que no
     eran tres modos sino uno repetido tres veces. Ahora:
       Leer     entender   · eliges qué significa
       Armar    el orden   · tocas las palabras
       Traducir producir   · la tecleas entera de memoria
       Dictado  oído fino  · solo rellenas los huecos que faltan
       Escuchar distinguir · eliges cuál de tres frases parecidas oíste
       Hablar   pronunciar · la dices en voz alta                            */
  const MODOS = [
    { id:'leer',  n:'📖 Leer',     h:'Entender · lee la frase y elige qué significa' },
    { id:'arma',  n:'🧩 Armar',    h:'El orden · las palabras están revueltas, tócalas en orden' },
    { id:'trad',  n:'✍️ Traducir', h:'Producir · ves el español y la tecleas entera de memoria' },
    { id:'dict',  n:'🎧 Dictado',  h:'Oído fino · solo oyes, y rellenas las palabras que faltan' },
    { id:'esc',   n:'👂 Escuchar', h:'Distinguir · elige cuál de las tres frases parecidas oíste' },
    { id:'habla', n:'🎤 Hablar',   h:'Pronunciar · la dices en voz alta y se compara' }
  ];
  const RANGOS = [
    { r:'SSS', min:100, cero:true, c:'#f0abfc', d:'Perfecta y sin un solo fallo de tecla' },
    { r:'SS',  min:95,  c:'#a78bfa', d:'Casi impecable' },
    { r:'S',   min:90,  c:'#22d3ee', d:'Muy buena' },
    { r:'A',   min:80,  c:'#4ade80', d:'Bien' },
    { r:'B',   min:65,  c:'#fbbf24', d:'Se entiende, hay que repasarla' },
    { r:'C',   min:0,   c:'#f87171', d:'A la práctica diaria' }
  ];

  /* Índice de palabras para la ficha emergente: significado y categoría.
     Sale de las 2000 del documento, no de ningún sitio inventado. */
  const IDX_W = (() => {
    const m = new Map();
    WORDS.forEach(w => { const k = w.en.toLowerCase(); if(!m.has(k)) m.set(k, w); });
    return m;
  })();
  /* Se conservan las CIFRAS: "30%" se teclea "30" y "2023." se teclea "2023".
     Si se borraran, esas fichas quedarian vacias y la ronda se atascaria ahi. */
  const limpia = s => String(s || '').toLowerCase().replace(/[^a-z0-9']/g, '');
  /* Ficha DADA: no queda nada que teclear (la barra de "Yes, please. / No, thanks.").
     No se pide, no puntua y no cuenta en el total: viene puesta. */
  const esDada = w => !limpia(w).length;

  const prog = () => store.get(K, {});
  const guarda = (id, dat) => {
    const p = prog();
    const a = p[id] || { v:0, ok:0, mejor:null };
    p[id] = { v:a.v + 1, ok:a.ok + (dat.ok ? 1 : 0),
              mejor: mejorDe(a.mejor, dat.rango), ts: Date.now() };
    store.set(K, p);
  };
  const ORDEN = ['C','B','A','S','SS','SSS'];
  const mejorDe = (a, b) => ORDEN.indexOf(b) > ORDEN.indexOf(a || 'C' ) ? b : (a || b);

  const S = {
    modo:'trad', pack:'todas', lista:[], i:0, activo:false,
    tok:[], pide:0, w:0, buf:'', errTecla:0, okPal:0, malPal:0, intentos:0,
    combo:0, comboMax:0, pts:0, fase:0, dicho:'', escuchando:false,
    ronda:{ hechas:0, perfectas:0, pts:0 }, fin:null
  };

  /* ── Preparar la frase: se parte en palabras conservando la puntuación ── */
  function tokeniza(en){ return String(en || '').trim().split(/\s+/); }
  const igual = (a, b) => limpia(a) === limpia(b);

  function baraja(a){ const x = a.slice(); for(let i = x.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; }

  function arma(){
    const p = prog();
    let base = PHRASES;
    if(S.pack === 'fallos')  base = PHRASES.filter(x => { const d = p[x.i]; return d && d.mejor && ORDEN.indexOf(d.mejor) < 3; });
    else if(S.pack === 'fav') base = PHRASES.filter(x => favP.has(x.i));
    else if(S.pack === 'nuevas') base = PHRASES.filter(x => !p[x.i]);
    else if(S.pack !== 'todas') base = PHRASES.filter(x => x.f === S.pack);
    if(!base.length) base = PHRASES;
    S.lista = baraja(base).slice(0, RONDA);
    S.i = 0; S.ronda = { hechas:0, perfectas:0, pts:0 }; S.fin = null;
    cargar();
  }
  function cargar(){
    const p = S.lista[S.i];
    if(!p) return;
    S.tok = tokeniza(p.en);
    S.w = 0; S.buf = ''; S.errTecla = 0; S.okPal = 0; S.malPal = 0; S.intentos = 0;
    S.fase = 0; S.dicho = ''; S.elegida = -1; S.resuelta = false;

    /* Dictado: no se teclea la frase entera —eso ya es Traducir—, solo las
       palabras que faltan. Es la habilidad de verdad al escuchar: cazar
       palabras sueltas dentro del chorro, no transcribir. */
    S.huecos = S.modo === 'dict' ? huecosDe(p) : [];

    /* Leer y Escuchar son de ELEGIR, no de producir. Los señuelos salen del
       propio documento y, cuando se puede, del mismo molde: así se parecen de
       verdad y hay que fijarse, en vez de descartar por el largo. */
    S.ops = S.modo === 'leer' ? opciones(p, 'es')
          : S.modo === 'esc'  ? opciones(p, 'en') : [];

    /* El banco del modo Armar: las mismas palabras de la frase, revueltas. */
    S.banco = baraja(S.tok.map((w, i) => ({ i, w })).filter(x => !esDada(x.w)));
    S.usadas = [];

    S.pide = (S.modo === 'leer' || S.modo === 'esc') ? 1
           : S.tok.filter((w, i) => pedida(i)).length;
    saltaDadas();
    S.activo = (S.modo === 'trad' || S.modo === 'dict');
    if(S.modo === 'dict' || S.modo === 'esc') setTimeout(() => TTS.say(p.en), 340);
  }

  /* ¿Se pide esta ficha al usuario?
     En Dictado solo los huecos; en los demás, todo lo que no venga dado. */
  function pedida(i){
    const w = S.tok[i];
    if(w === undefined || esDada(w)) return false;
    if(S.modo === 'dict') return S.huecos.indexOf(i) >= 0;
    return true;
  }

  /* Los huecos del dictado: uno de cada dos candidatos, siempre los mismos
     para la misma frase (así no cambian al repintar y se puede reintentar). */
  function huecosDe(p){
    const tk = tokeniza(p.en);
    const cand = tk.map((w, i) => ({ w, i })).filter(x => !esDada(x.w) && limpia(x.w).length >= 2);
    if(!cand.length) return tk.map((w, i) => i).filter(i => !esDada(tk[i]));
    const desde = (p.i || 0) % 2;
    const sel = cand.filter((x, k) => k % 2 === desde).map(x => x.i);
    return sel.length ? sel : [cand[0].i];
  }

  /* Tres opciones: la buena y dos señuelos. Se prefieren frases del mismo
     molde — si no, del mismo tipo de función; y si tampoco, cualquiera. */
  function opciones(p, campo){
    const bueno = p[campo];
    /* Se descartan las que TRADUCEN IGUAL, no solo la misma frase. El
       documento tiene casi gemelas —«Correct me if I'm wrong» y «…, but…»
       comparten traducción— y salían tres opciones idénticas: imposible de
       responder, y una de las tres contaba como fallo. Lo cazó la auditoría. */
    const otras = PHRASES.filter(x => x.i !== p.i && x[campo] && x[campo] !== bueno);
    const mismoMolde = otras.filter(x => x.m && x.m === p.m);
    const mismaFunc  = otras.filter(x => x.f && x.f === p.f);
    const bolsa = mismoMolde.length >= 2 ? mismoMolde
                : mismaFunc.length  >= 2 ? mismaFunc : otras;
    /* Primero se buscan señuelos parecidos; si esa bolsa no da para dos
       distintos, se tira del resto. Siempre salen tres opciones. */
    const senuelos = [];
    for(const fuente of [bolsa, otras]){
      for(const c of baraja(fuente)){
        if(senuelos.some(s => s[campo] === c[campo])) continue;  // ni repetidas entre sí
        senuelos.push(c);
        if(senuelos.length === 2) break;
      }
      if(senuelos.length === 2) break;
    }
    return baraja([p, ...senuelos]).map(x => ({ i: x.i, txt: x[campo] }));
  }

  /* Elegir en Leer / Escuchar. Puntúa como una pregunta: se acierta o no. */
  function elegir(n){
    if(S.resuelta) return;
    const p = actual(), op = S.ops[n];
    if(!p || !op) return;
    S.elegida = n; S.resuelta = true;
    if(op.i === p.i){
      S.okPal = 1; S.combo++; S.comboMax = Math.max(S.comboMax, S.combo);
      S.pts += (S.combo >= 20 ? 20 : 10);
      chispa(S.combo >= 20 ? '¡DOBLE!' : '¡Esa es!', true);
    } else {
      S.malPal = 1; S.combo = 0;
      chispa('esa no', false);
    }
    render();
    // Un momento para ver cuál era la buena antes de cerrar la frase
    setTimeout(() => { if(S.resuelta && !S.fin) terminar(); }, 900);
  }
  const actual = () => S.lista[S.i];
  /* Adelanta el cursor por encima de las fichas dadas. Sin esto la ronda
     se queda esperando que teclees una barra, y no hay barra que teclear. */
  function saltaDadas(){ while(S.w < S.tok.length && !pedida(S.w)) S.w++; }

  /* ── El teclado: escribes libre, el ESPACIO confirma cada palabra ── */
  function tecla(e){
    if(!S.activo) return;
    const pane = $('cf');
    if(!pane || getComputedStyle(pane).display === 'none') return;
    if(isTyping(e.target)) return;
    const k = e.key;
    if(k === ' '){ e.preventDefault(); confirmar(); return; }
    // Enter cierra la ronda si detras solo quedan fichas dadas
    if(k === 'Enter'){ e.preventDefault(); if(S.tok.slice(S.w + 1).every(esDada)) confirmar(); return; }
    if(k === 'Backspace'){ e.preventDefault(); S.buf = S.buf.slice(0, -1); render(); return; }
    if(k.length !== 1) return;
    e.preventDefault();
    const meta = S.tok[S.w] || '';
    // Cuenta como fallo de tecla si diverge de lo esperado en esa posición
    const pos = S.buf.length;
    if(limpia(meta)[pos] !== k.toLowerCase()) S.errTecla++;
    S.buf += k;
    render();
  }

  /* El ESPACIO ya no perdona: si la palabra está mal, NO se avanza y no se
     enseña cuál era. Se vuelve a pedir la misma. La única salida es teclearla
     bien o pedirla a propósito con el botón (ver `rendirse`). */
  function confirmar(){
    const meta = S.tok[S.w];
    if(!meta) return;

    if(igual(S.buf, meta)){
      // Solo cuenta como buena si la clavó sin fallar antes. El rango dice la verdad.
      if(!S.intentos){
        S.okPal++; S.combo++; S.comboMax = Math.max(S.comboMax, S.combo);
        S.pts += (S.combo >= 20 ? 20 : 10);         // a los 20 de combo, el doble
        chispa(S.combo >= 20 ? '¡DOBLE!' : (S.combo >= 5 ? '¡Perfect!' : 'Bien'), true);
      } else {
        chispa('esa era', true);                    // llegó, pero le costó
      }
      S.buf = ''; S.intentos = 0; S.w++; saltaDadas();
      if(S.w >= S.tok.length) terminar(); else render();
      return;
    }

    // Fallo: se queda en la misma palabra. Se cuenta una sola vez por palabra.
    if(!S.intentos) S.malPal++;
    S.intentos++; S.combo = 0; S.buf = '';
    chispa(S.intentos >= 2 ? 'sigue sin ser · mira la pista' : 'todavía no · otra vez', false);
    render();
  }

  /* ── Modo Armar ──
     Se toca una palabra del banco. Si es la que toca, entra; si no, se avisa
     sin decir cuál era. Puntúa igual que teclear: solo cuenta como acertada la
     que se clava a la primera, así que el rango sigue diciendo la verdad. */
  function tocarBanco(pos){
    const cand = S.banco[pos];
    if(!cand || S.usadas.includes(pos)) return;
    const meta = S.tok[S.w];
    if(!meta) return;

    if(igual(cand.w, meta)){
      if(!S.intentos){
        S.okPal++; S.combo++; S.comboMax = Math.max(S.comboMax, S.combo);
        S.pts += (S.combo >= 20 ? 20 : 10);
        chispa(S.combo >= 20 ? '¡DOBLE!' : (S.combo >= 5 ? '¡Perfect!' : 'Bien'), true);
      } else chispa('esa era', true);
      S.usadas.push(pos);
      TTS.say(cand.w);                       // se oye la palabra al colocarla
      S.intentos = 0; S.w++; saltaDadas();
      if(S.w >= S.tok.length) terminar(); else render();
      return;
    }
    if(!S.intentos) S.malPal++;
    S.intentos++; S.combo = 0;
    chispa('esa no · escucha otra vez', false);
    render();
    const b = document.querySelector('[data-cfb="' + pos + '"]');
    if(b){ b.classList.add('mala'); setTimeout(() => b.classList.remove('mala'), 420); }
  }

  /* Salida explícita. El ESPACIO nunca regala la palabra, pero si de verdad no
     sale hay que poder seguir: se pide a propósito. Ya estaba contada como
     fallada, así que no vuelve a penalizar. */
  function rendirse(){
    const meta = S.tok[S.w];
    if(!meta) return;
    if(!S.intentos) S.malPal++;
    chispa('era «' + meta + '»', false);
    S.buf = ''; S.intentos = 0; S.combo = 0; S.w++; saltaDadas();
    if(S.w >= S.tok.length) terminar(); else render();
  }

  function terminar(){
    const p = actual();
    const tot = S.pide || S.tok.length;      // el % se mide sobre lo que se pidio
    const pc = Math.round(S.okPal / tot * 100);
    const r = RANGOS.find(x => pc >= x.min && (!x.cero || S.errTecla === 0)) || RANGOS[RANGOS.length - 1];
    S.activo = false;
    S.fin = { rango:r, pc, tot, err:S.errTecla };
    S.ronda.hechas++; S.ronda.pts += S.pts;
    if(r.r === 'SSS' || r.r === 'SS') S.ronda.perfectas++;
    guarda(p.i, { ok: pc >= 90, rango: r.r });
    /* Lo que sale flojo se manda a la práctica diaria, que es donde vive
       el repaso espaciado que ya existe. */
    if(pc < 90 && !favP.has(p.i)){
      favP.add(p.i); saveFav(); SRS.renderBoxes();
    }
    Streak.hit && Streak.hit();
    render();
  }

  /* Aviso corto sobre la tarjeta, como el «Perfect» de ellos */
  function chispa(txt, bien){
    const c = $('cfChispa'); if(!c) return;
    c.textContent = txt;
    c.className = 'cf-chispa ' + (bien ? 'ok' : 'no') + ' on';
    clearTimeout(c._t); c._t = setTimeout(() => { c.className = 'cf-chispa'; }, 700);
  }

  /* ── Pintado ── */
  const PACKS = () => {
    const p = prog();
    const fs = [...new Set(PHRASES.map(x => x.f))];
    return [
      { id:'todas',  n:'Todas · ' + PHRASES.length },
      { id:'nuevas', n:'Sin ver · ' + PHRASES.filter(x => !p[x.i]).length },
      { id:'fallos', n:'Mis fallos · ' + PHRASES.filter(x => { const d = p[x.i]; return d && d.mejor && ORDEN.indexOf(d.mejor) < 3; }).length },
      { id:'fav',    n:'★ Marcadas · ' + PHRASES.filter(x => favP.has(x.i)).length },
      ...fs.map(f => ({ id:f, n:(FUNC_LABEL[f] || f) + ' · ' + PHRASES.filter(x => x.f === f).length }))
    ];
  };

  /* ¿Se tapa esta ficha?
     En Leer y Hablar la frase ES el material de trabajo: se ve entera, y ahí
     sí se regala la palabra. En Traducir y Dictado hay que sacarla de la
     cabeza, así que se tapa TAMBIÉN la que está activa — si no, el juego te
     está enseñando justo lo que te pide escribir. En Escuchar se tapa hasta
     la tercera fase, que es la que se llama «con el texto». */
  function tapada(i){
    // Dictado: solo se tapan los huecos que aún no has rellenado. El resto de
    // la frase se ve — es lo que te deja engancharte para cazar lo que falta.
    if(S.modo === 'dict') return pedida(i) && i >= S.w;
    if(S.modo === 'trad' || S.modo === 'arma') return i >= S.w;
    return false;                                   // leer, escuchar y habla
  }

  function palabraHTML(w, i){
    const base = limpia(w);
    const d = IDX_W.get(base);
    const est = i < S.w ? 'hecha' : (i === S.w ? 'activa' : 'pend');
    // Una ficha dada nunca se tapa: no hay nada que adivinar en ella
    const oculta = !esDada(w) && tapada(i);
    return `<span class="cf-w ${est}" data-cfw="${esc(w)}">
      <span class="cf-wt">${oculta ? '·'.repeat(Math.max(2, base.length)) : esc(w)}</span>
      <span class="cf-wg">${oculta ? '' : esc(d ? d.es.split(' / ')[0] : '')}</span>
      <span class="cf-wc">${oculta ? '' : esc(d ? (CAT_LABEL[d.cat] || d.cat) : '')}</span>
    </span>`;
  }

  function tarjeta(){
    const p = actual();
    if(!p) return '';
    const m = S.modo;
    const escrito = S.tok.slice(0, S.w).join(' ');
    const meta = S.tok[S.w] || '';
    const lim = limpia(meta);
    let tecleado = '';
    for(let i = 0; i < S.buf.length; i++){
      const ok = S.buf[i].toLowerCase() === lim[i];
      tecleado += `<span class="${ok ? 'ok' : 'no'}">${esc(S.buf[i])}</span>`;
    }

    const cabecera =
      m === 'arma'  ? `<div class="cf-es">${esc(p.es)}</div>`
    : m === 'trad'  ? `<div class="cf-es">${esc(p.es)}</div>`
    : m === 'dict'  ? `<div class="cf-es sordo">Óyela y rellena lo que falta
                         <button class="spk" data-say="${esc(p.en)}">🔊</button>
                         <button class="spk" data-cfsay="0.6" title="Más despacio">🐢</button></div>`
    // Leer: la frase inglesa a la vista, pero SIN su traducción — si se
    // enseñara, no habría nada que elegir.
    : m === 'leer'  ? `<div class="cf-en">${esc(p.en)} <button class="spk" data-say="${esc(p.en)}">🔊</button></div>
                       <div class="cf-es sordo">¿Qué significa?</div>`
    // Escuchar: solo el audio. Ni la frase ni la traducción.
    : m === 'esc'   ? `<div class="cf-es sordo">Solo el audio · ¿cuál de las tres oíste?
                         <button class="spk" data-say="${esc(p.en)}">🔊</button>
                         <button class="spk" data-cfsay="0.6" title="Más despacio">🐢</button></div>`
    : /* habla */     `<div class="cf-en">${esc(p.en)} <button class="spk" data-say="${esc(p.en)}">🔊</button></div>
                       <div class="cf-es">${esc(p.es)}</div>`;

    /* Las tres opciones de Leer y Escuchar. Al resolver se pinta la buena en
       verde y, si fallaste, la tuya en rojo: se aprende viendo la diferencia. */
    const eleccion = (m === 'leer' || m === 'esc') ? `
      <div class="cf-ops">${S.ops.map((o, n) => {
        let cls = '';
        if(S.resuelta) cls = o.i === p.i ? ' buena' : (n === S.elegida ? ' mala' : ' apagada');
        return `<button class="cf-op${cls}" data-cfop="${n}"${S.resuelta ? ' disabled' : ''}>${esc(o.txt)}</button>`;
      }).join('')}</div>` : '';

    /* Escalera de ayuda. Como el ESPACIO ya no deja pasar, hace falta una
       salida o el juego se convierte en una trampa: a los 2 fallos una pista
       que no es la respuesta, a los 4 el botón para pedirla de verdad. */
    const ayuda = (m === 'trad' || m === 'dict') && S.intentos >= 2 ? `
      <div class="cf-ayuda">
        Empieza por <b>${esc((lim[0] || '').toUpperCase())}</b> · tiene <b>${lim.length}</b> letras
        ${S.intentos >= 4 ? `<button class="cf-b" data-cfver>Enséñamela y sigue</button>` : ''}
      </div>` : '';

    /* El banco de palabras. Las ya colocadas se quedan a la vista, apagadas,
       para que se entienda que salieron de ahí. */
    const banco = m === 'arma' ? `
      <div class="cf-banco">${S.banco.map((x, n) =>
        `<button class="cf-bw${S.usadas.includes(n) ? ' usada' : ''}" data-cfb="${n}"
                 ${S.usadas.includes(n) ? 'disabled' : ''}>${esc(x.w)}</button>`).join('')}</div>
      <div class="cf-pie">Palabra <b>${Math.min(S.tok.slice(0, S.w).filter(w => !esDada(w)).length + 1, S.pide)}</b>
        de <b>${S.pide}</b> · tócalas en el orden correcto</div>` : '';

    const tecleando = (m === 'trad' || m === 'dict') ? `
      <div class="cf-linea">
        <span class="cf-hecho">${esc(escrito)}</span>
        <span class="cf-buf">${tecleado}<span class="cf-cur"></span></span>
      </div>
      ${ayuda}
      <div class="cf-pie">Palabra <b>${Math.min(S.tok.slice(0, S.w).filter(w => !esDada(w)).length + 1, S.pide)}</b> de <b>${S.pide}</b>
        · el <span class="kbd">ESPACIO</span> confirma — si está mal, no pasa</div>` : '';

    return `<div class="cf-card">
      ${cabecera}
      ${m === 'esc' ? '' : `<div class="cf-molde">${paintMold(p.m)}</div>`}
      ${m === 'esc' ? '' : `<div class="cf-slots">${S.tok.map(palabraHTML).join('')}</div>`}
      ${eleccion}
      ${tecleando}
      ${banco}
      ${m === 'habla' ? bloqueHablar(p) : ''}
      <div class="cf-chispa" id="cfChispa"></div>
    </div>`;
  }

  function faseEscuchar(p){
    const F = [
      { t:'1 · A ciegas', d:'Sin texto y a velocidad normal. No pasa nada si no pillas todo.', r:1 },
      { t:'2 · Lento',    d:'La misma frase, más despacio. Ahora deberías cazar más palabras.', r:0.6 },
      { t:'3 · Con texto',d:'Ahora sí, léela mientras la oyes. Aquí es donde encaja lo que oíste.', r:0.85 }
    ];
    const f = F[S.fase] || F[0];
    return `<div class="cf-fase">
      <div class="cf-ft">${esc(f.t)}</div>
      <div class="cf-fd">${esc(f.d)}</div>
      <button class="cf-b grande" data-cfsay="${f.r}">🔊 Oír</button>
      ${S.fase >= 2 ? `<div class="cf-en" style="margin-top:12px">${esc(p.en)}</div>
                       <div class="cf-es">${esc(p.es)}</div>` : ''}
      ${S.fase < 2 ? `<button class="cf-b" data-cffase="1">Siguiente fase →</button>` : ''}
    </div>`;
  }

  function bloqueHablar(p){
    const hay = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    if(!hay) return `<div class="cf-nota">Tu navegador no trae reconocimiento de voz, así que este
      modo no puede puntuarte. En Chrome sí funciona. Mientras tanto, usa el 🔊 y repite en voz alta.</div>`;
    return `<div class="cf-habla">
      <button class="cf-b grande ${S.escuchando ? 'rec' : ''}" data-cfrec="1">
        ${S.escuchando ? '⏹ Detener' : '🎤 Decirla'}</button>
      ${S.dicho ? comparaHTML(p.en, S.dicho) : '<div class="cf-nota">Dale al micrófono y dila en voz alta.</div>'}
    </div>`;
  }

  /* Compara palabra a palabra lo que se esperaba con lo que se entendió */
  function comparaHTML(meta, dicho){
    const a = tokeniza(meta), b = tokeniza(dicho);
    const usados = b.map(limpia);
    let ok = 0;
    const html = a.map(w => { const i = usados.indexOf(limpia(w));
      if(i > -1){ usados[i] = ' '; ok++; return `<span class="dx-good">${esc(w)}</span>`; }
      return `<span class="dx-bad">${esc(w)}</span>`; }).join(' ');
    const pc = Math.round(ok / a.length * 100);
    return `<div class="cf-cmp">
      <div class="cf-cmpt">Se entendió el <b>${pc}%</b></div>
      <div class="cf-cmpl">${html}</div>
      <div class="cf-nota">Lo que se oyó: «${esc(dicho)}». <b>Ojo:</b> esto usa el reconocimiento de voz
        del navegador, que necesita internet y se equivoca con acentos. Es una guía, no una nota.</div>
    </div>`;
  }

  function porQue(){
    const p = actual(); if(!p) return '';
    const T = TENSE_LABEL[p.t] || p.t;
    return `<div class="cf-why">
      <div class="cf-wt2">🧩 Por qué se arma así</div>
      <div class="cf-wl"><span class="wr-chip">${esc(T)}</span>
        <span class="wr-chip alt">${esc(FUNC_LABEL[p.f] || p.f)}</span></div>
      <div class="cf-molde">${paintMold(p.m)}</div>
      ${p.n ? `<div class="cf-nn">${esc(p.n)}</div>` : ''}
      <div class="cf-nota">Esto sale del molde, el tiempo y la nota de la propia frase —
        <b>no es una inteligencia artificial</b>. Para el matiz de una palabra, tócala arriba o
        búscala con 🔎.</div>
    </div>`;
  }

  function resultado(){
    const f = S.fin; if(!f) return '';
    const ult = S.i >= S.lista.length - 1;
    return `<div class="cf-fin">
      <div class="cf-rango" style="color:${f.rango.c};border-color:${f.rango.c}">${f.rango.r}</div>
      <div class="cf-fint">${esc(f.rango.d)}</div>
      <div class="cf-stats">
        <span><b>${f.pc}%</b> acierto</span>
        <span><b>${S.comboMax}</b> combo máximo</span>
        <span><b>${f.err}</b> fallos de tecla</span>
        <span><b>+${S.pts}</b> puntos</span>
      </div>
      ${f.pc < 90 ? '<div class="cf-nota">Esta frase se marcó ★ y entra en tu <b>Práctica</b> diaria.</div>' : ''}
      <button class="cf-b grande" data-cfnext="1">${ult ? 'Ver la ronda →' : 'Siguiente frase →'}</button>
    </div>`;
  }

  function rondaFin(){
    return `<div class="cf-fin">
      <div class="cf-rango" style="color:var(--ac);border-color:var(--ac)">🏁</div>
      <div class="cf-fint">Ronda terminada · ${S.ronda.hechas} frases</div>
      <div class="cf-stats">
        <span><b>${S.ronda.perfectas}</b> impecables</span>
        <span><b>${S.comboMax}</b> combo máximo</span>
        <span><b>${S.ronda.pts}</b> puntos</span>
      </div>
      <button class="cf-b grande" data-cfotra="1">Otra ronda →</button>
    </div>`;
  }

  function render(){
    const c = $('cfBox'); if(!c) return;
    const p = actual();
    const rondaAcabada = S.fin && S.i >= S.lista.length - 1 && S.finVisto;
    c.innerHTML = `
      <div class="cf-bar">
        <div class="cf-modos">${MODOS.map(m => `<button class="cf-m${m.id === S.modo ? ' on' : ''}"
          data-cfmodo="${m.id}" title="${esc(m.h)}">${esc(m.n)}</button>`).join('')}</div>
        <div class="cf-marc">
          <span class="cf-combo${S.combo >= 5 ? ' vivo' : ''}">combo <b>${S.combo}</b></span>
          <span class="cf-pts"><b>${S.pts}</b> pts</span>
          <span class="cf-prog">${Math.min(S.i + 1, S.lista.length)}/${S.lista.length}</span>
        </div>
      </div>
      <div class="cf-sel">
        <span class="lab-lb">Paquete</span>
        <select id="cfPack" class="lab-sel">${PACKS().map(k =>
          `<option value="${k.id}"${k.id === S.pack ? ' selected' : ''}>${esc(k.n)}</option>`).join('')}</select>
        <button class="cf-b" data-cfotra="1">🔄 Nueva ronda</button>
      </div>
      <div class="cf-hint">${esc((MODOS.find(m => m.id === S.modo) || {}).h || '')}</div>
      ${rondaAcabada ? rondaFin() : (tarjeta() + (S.fin ? resultado() : '') + porQue())}`;

    const sel = $('cfPack');
    if(sel) sel.onchange = e => { S.pack = e.target.value; arma(); render(); };
    c.querySelectorAll('[data-cfmodo]').forEach(b => b.onclick = () => { S.modo = b.dataset.cfmodo; cargar(); render(); });
    c.querySelectorAll('[data-cfotra]').forEach(b => b.onclick = () => { S.finVisto = false; arma(); render(); });
    c.querySelectorAll('[data-cfnext]').forEach(b => b.onclick = () => {
      if(S.i >= S.lista.length - 1){ S.finVisto = true; render(); return; }
      S.i++; cargar(); render();
    });
    c.querySelectorAll('[data-cfver]').forEach(b => b.onclick = () => rendirse());
    c.querySelectorAll('[data-cfb]').forEach(b => b.onclick = () => tocarBanco(+b.dataset.cfb));
    c.querySelectorAll('[data-cfop]').forEach(b => b.onclick = () => elegir(+b.dataset.cfop));
    c.querySelectorAll('[data-cffase]').forEach(b => b.onclick = () => { S.fase = Math.min(2, S.fase + 1); render(); });
    c.querySelectorAll('[data-cfsay]').forEach(b => b.onclick = () => {
      const r = parseFloat(b.dataset.cfsay) || 1;
      TTS.say(actual().en, null, r);
    });
    c.querySelectorAll('[data-cfrec]').forEach(b => b.onclick = () => oir());
    c.querySelectorAll('[data-cfw]').forEach(b => b.onclick = () => {
      const w = b.dataset.cfw; TTS.say(w); DIC.abrir(limpia(w), b.getBoundingClientRect().left + 20, b.getBoundingClientRect().bottom);
    });
    // En los modos sin teclado se avanza con un botón
    /* Solo Leer y Hablar necesitan un botón para pasar. Escuchar ya no: se
       resuelve eligiendo, igual que Leer, y entonces manda el resultado.
       Antes el botón dejaba saltar la frase sin responder — y sin puntuar. */
    if((S.modo === 'habla') && !S.fin && !rondaAcabada){
      const b = document.createElement('button');
      b.className = 'cf-b grande'; b.textContent = 'Siguiente →';
      b.onclick = () => { if(S.i >= S.lista.length - 1){ S.finVisto = true; S.fin = S.fin || {}; render(); }
                          else { S.i++; cargar(); render(); } };
      c.querySelector('.cf-card').appendChild(b);
    }
  }

  /* ── Reconocimiento de voz para el modo Hablar ── */
  let rec = null;
  function oir(){
    const R = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(!R) return;
    if(S.escuchando && rec){ rec.stop(); return; }
    rec = new R();
    rec.lang = 'en-US'; rec.interimResults = false; rec.maxAlternatives = 1;
    rec.onresult = e => { S.dicho = e.results[0][0].transcript || ''; };
    rec.onerror = () => { S.dicho = ''; toast('No se pudo oír el micrófono', 'warn'); };
    rec.onend = () => { S.escuchando = false; render(); };
    S.escuchando = true; render();
    try { rec.start(); } catch(e){ S.escuchando = false; render(); }
  }

  function init(){
    arma();
    render();
    document.addEventListener('keydown', tecla);
  }

  /* Comprobación repetible desde consola: APP.CLUB.auditar() */
  /* Comprobación repetible desde consola: APP.CLUB.auditar()
     Se revisan las 1000 frases contra CADA modo, porque un modo que se atasca
     en una frase de mil no se descubre jugando: se descubre midiendo. */
  function auditar(){
    const malas = [];
    let dadas = 0, sinSenuelos = 0, huecosCero = 0;
    PHRASES.forEach(p => {
      const t = tokeniza(p.en);
      const pide = t.filter(w => !esDada(w));
      dadas += t.length - pide.length;
      if(!pide.length) malas.push('sin nada que teclear: ' + p.en);
      if(!p.m) malas.push('sin molde: ' + p.en);

      // Dictado: tiene que quedar al menos un hueco que rellenar
      const h = huecosDe(p);
      if(!h.length){ huecosCero++; malas.push('dictado sin huecos: ' + p.en); }

      // Leer y Escuchar: tres opciones distintas, y una de ellas la buena
      ['es','en'].forEach(campo => {
        const o = opciones(p, campo);
        const textos = new Set(o.map(x => x.txt));
        if(o.length !== 3 || textos.size !== 3){ sinSenuelos++;
          malas.push('opciones repetidas (' + campo + '): ' + p.en); }
        if(!o.some(x => x.i === p.i)) malas.push('sin la buena (' + campo + '): ' + p.en);
      });
    });
    return { frases:PHRASES.length, modos:MODOS.length, paquetes:PACKS().length,
             fichasDadas:dadas, dictadoSinHuecos:huecosCero, opcionesMalas:sinSenuelos,
             malas: malas.slice(0, 12), totalMalas: malas.length };
  }
  return { init, render, arma, auditar, S, MODOS, RANGOS };
})();


/* ══════════════════════════════════════════════════════════════════════
   CANCIONES · aprender con música, tipo karaoke
   ──────────────────────────────────────────────────────────────────────
   POR QUÉ LA LETRA LA PONE EL USUARIO
   Las letras de canciones tienen derechos de autor: no se pueden traer
   dentro del documento. Así que aquí pasa lo mismo que en el Cuaderno —
   «tu material, no el mío»: Miguel pega la letra de la canción que está
   trabajando y el motor hace el resto. Nada se inventa y nada se copia.

   POR QUÉ FUNCIONA ESTUDIAR CON CANCIONES
   Dos cosas que un libro no te da:
   · La melodía y la repetición pegan los trozos enteros en la memoria, que
     es justo la unidad con la que se habla — no palabras sueltas.
   · Traen el inglés REAL hablado: las uniones y los recortes (gonna, wanna,
     'cause, ain't, whatcha) que en los diálogos de libro no aparecen y que
     son la razón número uno de «lo leo pero no lo entiendo hablado».
   La trampa conocida es cantar sin entender: eso es repetir sonidos, no
   aprender. Por eso el método de abajo va por pasos y cada línea se trabaja.
   ══════════════════════════════════════════════════════════════════════ */
const SONG = (() => {
  const K = 'eng_song';
  const store = { get: (k, d) => store_get(k, d), set: (k, v) => store_set(k, v) };
  // se enganchan abajo al store real del documento
  let store_get = () => ({}), store_set = () => {};

  const S = { id:null, vel:1, linea:-1, bucle:0, quedan:0, huecos:-1, buf:'', w:0, q:'' };

  /* ══════════ EL REPRODUCTOR ══════════
     Play/Pausa/Stop, barra para moverse, atrás y adelante 5 segundos, y
     velocidad propia (1× · 0.75× · 0.5×) sin tocar la del resto del documento.
     Los subtítulos van encendidos (cc_load_policy:1): los pinta YouTube.

     POR QUÉ AQUÍ NO SE SUBRAYA LA LETRA AL COMPÁS
     Haría falta saber en qué segundo entra cada línea, y ese dato no se puede
     conseguir: el reproductor va en un iframe de otro dominio, su API no
     expone el texto de los subtítulos, y su servidor no autoriza peticiones
     desde otra web. Se intentó estimarlo por sílabas y se iba desincronizando
     conforme avanzaba — para estudiar, eso es peor que no tener nada. Así que
     se hace lo que sí sale exacto: los subtítulos los pone YouTube dentro de
     su vídeo, y aquí debajo queda el texto entero para leerlo y buscar en él.

     La API de YouTube se carga solo cuando hace falta. Si no llega —sin red,
     o bloqueada— la sección sigue funcionando: cada línea se puede oír con la
     voz del navegador, como hasta ahora. */
  const P = { player:null, vid:null, listo:false, estado:-1, vel:1, verVideo:true, t:0, dur:0,
              tic:null, linea:-1, pal:-1, ajuste:false,
              api:'no' };

  function cargarAPI(cb){
    if(window.YT && window.YT.Player){ cb(); return; }
    if(P.api === 'fallo'){ cb(); return; }
    P.api = 'cargando';
    if(!document.getElementById('ytapi')){
      const s = document.createElement('script');
      s.id = 'ytapi'; s.src = 'https://www.youtube.com/iframe_api';
      s.onerror = () => { P.api = 'fallo'; toast('No se pudo cargar el reproductor de YouTube', 'warn'); render(); };
      document.head.appendChild(s);
    }
    let hecho = false, n = 0;
    const t = setInterval(() => {
      if(window.YT && window.YT.Player){ clearInterval(t); if(!hecho){ hecho = true; P.api = 'ok'; cb(); } }
      else if(++n > 120){ clearInterval(t); P.api = 'fallo'; render(); }
    }, 100);
  }

  function montaPlayer(id){
    if(!document.getElementById('sgPlayer')) return;
    cargarAPI(() => {
      if(!window.YT || !window.YT.Player) return;
      if(!document.getElementById('sgPlayer')) return;
      try { if(P.player && P.player.destroy) P.player.destroy(); } catch(e){}
      P.listo = false;
      P.player = new YT.Player('sgPlayer', {
        videoId: id,
        /* cc_load_policy:1 enciende los SUBTÍTULOS DEL PROPIO YOUTUBE.
           Ese es el modelo de YouGlish y es el limpio: el texto lo pinta
           YouTube dentro de su reproductor, que es quien tiene la licencia.
           Yo no lo descargo, no lo guardo y no lo reescribo. */
        playerVars: { playsinline:1, rel:0, modestbranding:1, cc_load_policy:1, cc_lang_pref:'en' },
        events: {
          onReady: () => {
            P.listo = true;
            try { P.dur = P.player.getDuration() || 0; P.player.setPlaybackRate(P.vel); } catch(e){}
            const b = $('sgBarra'); if(b) b.max = P.dur || 100;
            const t1 = $('sgT1'); if(t1) t1.textContent = reloj(P.dur);
            arrancaTic();
          },
          onStateChange: e => { P.estado = e.data; pintaPP(); }
        }
      });
    });
  }

  /* setInterval y no requestAnimationFrame: rAF se queda a cero cuando la
     pestaña no está al frente, y aquí la canción sigue sonando — la letra
     tiene que seguir moviéndose. Misma razón que en el módulo de música. */
  function arrancaTic(){ clearInterval(P.tic); P.tic = setInterval(pulso, 120); }
  function paraTic(){ clearInterval(P.tic); P.tic = null; }

  function pulso(){
    if(!P.player || !P.listo || !P.player.getCurrentTime) return;
    let t; try { t = P.player.getCurrentTime(); } catch(e){ return; }
    P.t = t;
    const t0 = $('sgT0'); if(t0) t0.textContent = reloj(t);
    const b = $('sgBarra'); if(b && document.activeElement !== b) b.value = t;
  }

  /* Pinta las tres líneas del karaoke. Se reconstruye solo cuando CAMBIA la
     línea; dentro de ella solo se mueve el resaltado de la palabra, que es
     mucho más barato que repintar. */

  /* ══════════ EL PUENTE CON EL RESTO DEL DOCUMENTO ══════════
     Tocar una palabra de la línea grande abre su ficha y, sobre todo, la
     conecta con lo que ya existe: se oye, se guarda en la Práctica diaria
     (las mismas ★ de las 2000 palabras) y se busca en todo el documento —
     palabras, frases, bifurcaciones y método— con el buscador de siempre.
     Un vídeo deja de ser una isla. */
  const IDX_EN = (() => {
    const m = new Map();
    WORDS.forEach(w => { const k = String(w.en || '').toLowerCase(); if(!m.has(k)) m.set(k, w); });
    return m;
  })();

  function fichaPalabra(p, x, y){
    document.querySelectorAll('.sg-pop').forEach(e => e.remove());
    const w = IDX_EN.get(p);
    const c = actual();
    const yaEsta = c && (c.pal || []).indexOf(p) >= 0;
    const pop = document.createElement('div');
    pop.className = 'sg-pop';
    pop.innerHTML = `
      <div class="sg-pop-t">${esc(p)}
        <button class="spk sm" data-say="${esc(p)}" title="Oír">🔊</button></div>
      <div class="sg-pop-d">${w ? esc(w.es) : 'No está en las ' + WORDS.length + ' palabras del documento — igual la puedes guardar.'}</div>
      ${w && w.use ? `<div class="sg-pop-u">${esc(w.use)}</div>` : ''}
      <div class="sg-pop-bs">
        <button class="sg-b" data-pop="fav">${yaEsta ? '✓ Guardada' : '★ Guardar'}</button>
        <button class="sg-b" data-pop="buscar">🔍 Buscar en el documento</button>
        ${w ? `<button class="sg-b" data-pop="ir">📚 Ver su ficha</button>` : ''}
      </div>`;
    document.body.appendChild(pop);
    const ancho = Math.min(320, window.innerWidth - 24);
    pop.style.width = ancho + 'px';
    pop.style.left = Math.max(12, Math.min(x - ancho / 2, window.innerWidth - ancho - 12)) + 'px';
    pop.style.top = (y + window.scrollY + 8) + 'px';

    pop.querySelector('[data-pop="fav"]').onclick = () => {
      if(!c) return;
      c.pal = c.pal || [];
      const k = c.pal.indexOf(p);
      if(k >= 0) c.pal.splice(k, 1); else c.pal.push(p);
      // Y a la Práctica diaria, que es donde vuelve a aparecer sola
      if(w){
        if(k < 0) favW.add(w.i); else favW.delete(w.i);
        saveFav(); try { refreshAll(); } catch(e){}
      }
      toca(c); pop.remove(); pintaVar(c); wire();
      toast(k >= 0 ? 'Quitada' : (w ? 'Guardada · la verás en tu Práctica' : 'Guardada en este vídeo'), 'ok');
    };
    pop.querySelector('[data-pop="buscar"]').onclick = () => {
      pop.remove();
      try { Omni.open(); const i = $('omniIn'); if(i){ i.value = p; Omni.search(p); } } catch(e){}
    };
    const ir = pop.querySelector('[data-pop="ir"]');
    if(ir) ir.onclick = () => { pop.remove(); go('p1'); try { Omni.open(); const i=$('omniIn'); if(i){ i.value=p; Omni.search(p); } } catch(e){} };

    const fuera = ev => { if(!ev.target.closest('.sg-pop')){ pop.remove(); document.removeEventListener('click', fuera); } };
    setTimeout(() => document.addEventListener('click', fuera), 0);
  }



  function pintaPP(){
    const b = $('sgPP'); if(!b) return;
    const sonando = P.estado === 1;
    b.textContent = sonando ? '⏸' : '▶';
    b.classList.toggle('on', sonando);
  }

  const manda = (f, ...a) => { try { if(P.player && P.listo && P.player[f]) P.player[f](...a); } catch(e){} };
  function irA(seg){ manda('seekTo', Math.max(0, seg), true); }


  const nid = () => 'sg' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const libro = () => store.get(K, {});
  const guardar = o => store.set(K, o);
  const actual = () => libro()[S.id] || null;

  /* ── El método, en pasos. Es la parte didáctica y va delante. ── */
  const PASOS = [
    { n:'1 · Óyela entera, sin letra',
      d:'Solo para coger el ritmo y ver cuánto pillas de verdad. No busques entenderlo todo: fíjate en cuántas <b>palabras sueltas</b> reconoces.' },
    { n:'2 · Ahora con la letra delante',
      d:'Aquí viene lo que enseña: mientras suena, lee el texto de abajo y fíjate en las líneas donde <b>lo leías pero no lo oías</b>. Esas son las que tienen algo que aprender.' },
    { n:'3 · La línea que se te escapó, otra vez',
      d:'Vuelve con <b>« 5s</b>, bájale a <b>0.75×</b> o <b>0.5×</b> y óyela hasta que la cojas. Si aun así no sale, no es tu oído: es que ahí hay un recorte. Ve al paso 4.' },
    { n:'4 · Caza los recortes',
      d:'<b>gonna, wanna, gotta, ain\'t, \'cause, lemme, whatcha</b>. Aquí es donde se te escapa el inglés hablado. Toca cualquier palabra para ver qué es.' },
    { n:'5 · Sin letra otra vez',
      d:'Si ahora la sigues sin mirar, ya es tuya. Y esa frase te la vas a acordar dentro de un año — por eso funciona la música.' }
  ];

  /* ── Cómo elegir canción ── */
  const ELEGIR = {
    si: ['Voz al frente de la mezcla, que se oiga por encima de la música',
         'Tempo medio o lento — si no te da tiempo a leer, no te da tiempo a aprender',
         'Estribillo repetido: la repetición es el ejercicio, no un defecto',
         'Historia concreta y vocabulario de todos los días'],
    no: ['Rap rápido para empezar — es buenísimo, pero de los últimos',
         'Mucho argot o inventos de la jerga: aprendes algo que no vas a usar',
         'Voz enterrada en la mezcla o gritada',
         'Letras abstractas donde ni un nativo sabe qué dice']
  };

  /* ── Sugerencias ──
     Son un CRITERIO mío, no un dato: por qué esa canción sirve para esto.
     No hay letras aquí, solo el título y el porqué. Y va marcado lo que NO
     es para la niña: hay temas con lenguaje explícito, y eso hay que decirlo
     antes, no después. */
  const SUGE = [
    { g:'Pop',  t:'Let It Be',                a:'The Beatles',      nino:true,
      por:'Lenta, la voz clarísima y el estribillo se repite entero. Es la primera que le pondría a cualquiera.' },
    { g:'Pop',  t:'Someone Like You',         a:'Adele',            nino:true,
      por:'Balada lenta y muy articulada. Buena para oír las vocales largas sin prisa.' },
    { g:'Pop',  t:'Perfect',                  a:'Ed Sheeran',       nino:true,
      por:'Vocabulario cotidiano y frases cortas. Fácil de seguir línea a línea.' },
    { g:'Pop',  t:'Counting Stars',           a:'OneRepublic',      nino:true,
      por:'Estribillo muy repetido y pegadizo — la repetición hace el trabajo sola.' },
    { g:'Rock', t:'Zombie',                   a:'The Cranberries',  nino:true,
      por:'Lenta, pronunciación muy marcada y pocas palabras distintas.' },
    { g:'Rock', t:'Yellow',                   a:'Coldplay',         nino:true,
      por:'Frases simples y mucho aire entre ellas. Da tiempo a leer y repetir.' },
    { g:'Rock', t:'Boulevard of Broken Dreams', a:'Green Day',      nino:true,
      por:'Tempo medio y dicción limpia. Buen paso intermedio antes de acelerar.' },
    { g:'Rock', t:'Wonderwall',               a:'Oasis',            nino:true,
      por:'Repetitiva y de tempo cómodo. Aviso: el acento de Manchester deforma las vocales — buena justo por eso, pero no la primera.' },
    { g:'Rap',  t:'Old Town Road',            a:'Lil Nas X',        nino:true,
      por:'Cortísima, lenta para ser rap y muy repetida. Es la puerta de entrada al rap.' },
    { g:'Rap',  t:'Sunflower',                a:'Post Malone & Swae Lee', nino:true,
      por:'Más cantada que rapeada, melódica y de ritmo amable.' },
    { g:'Rap',  t:'Love The Way You Lie',     a:'Eminem ft. Rihanna', nino:false,
      por:'El estribillo cantado te deja respirar entre versos rápidos: buen puente hacia el rap. Contiene lenguaje explícito y trata violencia de pareja — no es para la niña.' },
    { g:'Rap',  t:'Lose Yourself',            a:'Eminem',           nino:false,
      por:'Es el mejor ejercicio de inglés hablado rápido que existe, con las uniones y los recortes a toda velocidad. Déjala para cuando las otras te salgan solas. Lenguaje explícito.' }
  ];

  /* ══════════ Datos ══════════ */
  /* Tope de tres. Un vídeo con su letra y sus tiempos ocupa poco, pero el
     almacenamiento del navegador es finito y lo comparte con el cuaderno, la
     práctica y todo lo demás — y ahí no se puede perder nada. Antes de que
     empiece a fallar por llenarse, se avisa y se pide borrar uno. */
  const TOPE = 3;
  function nueva(){
    const o = libro();
    if(Object.keys(o).length >= TOPE){
      toast('Solo caben ' + TOPE + ' vídeos · borra uno para añadir otro', 'warn');
      return;
    }
    const id = nid();
    o[id] = { id, t:'', a:'', url:'', letra:'', hechas:[], ts:Date.now() };
    guardar(o); S.id = id; S.linea = -1; render();
  }
  function toca(c){ const o = libro(); c.ts = Date.now(); o[c.id] = c; guardar(o); }

  /* De la letra pegada a líneas limpias. Se respetan los renglones tal cual
     los escribió el autor de la letra: en una canción el renglón ES la unidad
     de trabajo, no la oración. */
  const lineasDe = c => String(c.letra || '').split(/\n/).map(x => x.trim()).filter(Boolean);

  /* El id de YouTube, si pegó un enlace. Solo se acepta YouTube y solo se
     saca el identificador: no se construye nada con texto suelto del usuario. */
  function ytId(url){
    const m = String(url || '').match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : '';
  }

  /* ══════════ Karaoke ══════════ */
  function parar(){
    TTS.parar(); S.linea = -1; S.bucle = 0; S.quedan = 0;
    document.querySelectorAll('.sg-l.sonando').forEach(e => e.classList.remove('sonando'));
    document.querySelectorAll('.sg-w.ahora').forEach(e => e.classList.remove('ahora'));
    const b = $('sgStop'); if(b) b.classList.remove('on');
  }

  /* ══════════ Huecos de una línea ══════════
     Mismo ejercicio que el Dictado del Club, pero sobre la canción: se tapan
     la mitad de las palabras y hay que teclearlas oyendo. */
  const limpio = s => String(s || '').toLowerCase().replace(/[^a-z0-9']/g, '');
  function huecosDeLinea(txt){
    const w = txt.split(/\s+/);
    const cand = w.map((x, i) => ({ x, i })).filter(o => limpio(o.x).length >= 3);
    if(!cand.length) return [];
    return cand.filter((o, k) => k % 2 === 0).map(o => o.i);
  }

  function tecla(e){
    const pane0 = $('sg');
    if(!pane0 || getComputedStyle(pane0).display === 'none') return;
    if(isTyping(e.target)) return;
    if(S.huecos < 0) return;
    const pane = pane0;
    const c = actual(); if(!c) return;
    const txt = lineasDe(c)[S.huecos]; if(!txt) return;
    const w = txt.split(/\s+/);
    const hs = huecosDeLinea(txt);
    const meta = w[hs[S.w]];
    if(meta === undefined) return;
    const k = e.key;
    if(k === 'Backspace'){ e.preventDefault(); S.buf = S.buf.slice(0, -1); render(); return; }
    if(k === ' ' || k === 'Enter'){
      e.preventDefault();
      if(limpio(S.buf) === limpio(meta)){
        S.w++; S.buf = '';
        if(S.w >= hs.length){ toast('Línea completa', 'ok'); S.huecos = -1; S.w = 0; }
      } else { toast('Todavía no · vuelve a oírla', 'warn'); S.buf = ''; }
      render(); return;
    }
    if(k.length !== 1) return;
    e.preventDefault(); S.buf += k; render();
  }

  /* ══════════ Pintado ══════════
     ESTO ES LO QUE ROMPÍA EL KARAOKE, y merece quedar escrito.
     Antes `render()` reescribía TODO el contenedor de golpe — incluido el
     hueco donde vive el reproductor de YouTube. Como el reproductor es un
     iframe montado por la API sobre ese hueco, al reescribir el HTML el
     iframe desaparecía: cero iframes en la página. Y como la guarda miraba
     `P.player` (que seguía siendo un objeto), creía que el reproductor estaba
     vivo y no lo remontaba. Resultado: el reloj se quedaba en 0:00 y la letra
     no seguía nada. Eso es exactamente lo que Miguel veía.

     Ahora el panel va en dos piezas:
       · `sgFijo` — cabecera, vídeo y mando. Se pinta UNA VEZ por canción y no
         se vuelve a tocar, así que el reproductor sobrevive.
       · `sgVar`  — karaoke, sincronía y letra. Se repinta cuanto haga falta.  */
  function render(){
    const box = $('sgBox'); if(!box) return;
    const o = libro();
    if(S.id && !o[S.id]) S.id = null;

    if(box.dataset.song !== (S.id || '') || !$('sgVar')){
      box.dataset.song = S.id || '';
      box.innerHTML = `
        <div class="sg-grid">
          <aside class="sg-side" id="sgSide"></aside>
          <section class="sg-main"><div id="sgFijo"></div><div id="sgVar"></div></section>
        </div>`;
      // El contenedor se rehízo: el reproductor de antes ya no existe
      P.player = null; P.vid = null; P.listo = false; P.linea = -1; P.pal = -1;
    }
    pintaSide(o);
    if(S.id){ pintaFijo(o[S.id]); pintaVar(o[S.id]); }
    else { $('sgFijo').innerHTML = ''; $('sgVar').innerHTML = bienvenida(); }
    wire();
  }

  function pintaSide(o){
    const el = $('sgSide'); if(!el) return;
    const ids = Object.keys(o).sort((a, b) => (o[b].ts || 0) - (o[a].ts || 0));
    el.innerHTML = `
      <button class="sg-nueva${ids.length >= TOPE ? ' lleno' : ''}" id="sgNueva">
        ${ids.length >= TOPE ? '✕ Lleno · borra uno' : '＋ Vídeo nuevo'}</button>
      <div class="sg-lbl">Mis vídeos · ${ids.length} de ${TOPE}</div>
      ${ids.length ? ids.map(id => `
        <div class="sg-item-w">
          <button class="sg-item${id === S.id ? ' on' : ''}" data-sg="${id}">
            <b>${esc(o[id].t || 'Sin título')}</b>
            <span>${esc(o[id].a || '—')}</span>
          </button>
          <button class="sg-item-x" data-borra="${id}" title="Eliminar este vídeo">🗑</button>
        </div>`).join('')
        : '<div class="sg-vacio">Todavía no has añadido ninguno.</div>'}`;
  }

  /* Solo se rehace si cambia algo que obligue: la canción, su enlace, o si
     todavía no hay letra. Mientras la firma no cambie, no se toca — y el
     iframe del reproductor sigue donde estaba, sonando. */
  function pintaFijo(c){
    const el = $('sgFijo'); if(!el) return;
    const yt = ytId(c.url);
    const firma = c.id + '|' + yt + '|' + (lineasDe(c).length ? 'letra' : 'vacia');
    if(el.dataset.firma === firma && (!yt || el.querySelector('iframe'))) return;
    el.dataset.firma = firma;
    el.innerHTML = cabecera(c) + (lineasDe(c).length ? mandoHTML(c, yt) : '');
    P.player = null; P.vid = null; P.listo = false;
  }

  function pintaVar(c){
    const el = $('sgVar'); if(!el) return;
    const L = lineasDe(c);
    el.innerHTML = L.length ? cuerpo(c, L) : pegarLetra(c);
  }

  function bienvenida(){
    return `
      <div class="sg-metodo">
        <h3>Cómo se aprende de verdad con una canción</h3>
        <p class="sg-p">Cantar sin entender es repetir sonidos. Esto va por pasos, y cada línea se trabaja aparte.</p>
        <ol class="sg-pasos">${PASOS.map(p => `<li><b>${p.n}</b><span>${p.d}</span></li>`).join('')}</ol>

        <div class="sg-dos">
          <div class="sg-col ok"><h4>Elige canciones así</h4><ul>${ELEGIR.si.map(x => '<li>' + x + '</li>').join('')}</ul></div>
          <div class="sg-col no"><h4>Evita al principio</h4><ul>${ELEGIR.no.map(x => '<li>' + x + '</li>').join('')}</ul></div>
        </div>

        <h3 style="margin-top:26px">Por dónde empezar</h3>
        <p class="sg-p">Esto es criterio mío sobre <b>por qué cada una sirve para estudiar</b> — tempo, claridad y repetición —, no un dato medido. La letra la traes tú.</p>
        <div class="sg-suge">${SUGE.map(s => `
          <div class="sg-s${s.nino ? '' : ' adulto'}">
            <div class="sg-s-top"><span class="sg-g">${s.g}</span>
              ${s.nino ? '' : '<span class="sg-x">solo adultos</span>'}</div>
            <b>${esc(s.t)}</b><i>${esc(s.a)}</i>
            <p>${esc(s.por)}</p>
          </div>`).join('')}</div>
        <div class="note" style="margin-top:18px"><b>Aviso para la niña:</b> las marcadas
          <b>solo adultos</b> tienen lenguaje explícito. Están porque son un ejercicio
          buenísimo de inglés hablado rápido, no porque sirvan para ella.</div>
      </div>`;
  }

  /* ── La cabecera y el mando: la parte que NO se repinta ──
     Todo lo que vive aquí sobrevive a los repintados, y por eso el
     reproductor sigue sonando cuando cambia cualquier otra cosa. */
  function cabecera(c){
    const conLetra = lineasDe(c).length > 0;
    return `
      <div class="sg-cab">
        <input class="sg-in t" id="sgT" value="${esc(c.t)}" placeholder="Título del vídeo">
        <input class="sg-in a" id="sgA" value="${esc(c.a)}" placeholder="Artista">
        ${conLetra ? '<button class="sg-b" id="sgEdit" title="Cambiar los subtítulos">✎ Subtítulos</button>' : ''}
        <button class="sg-b danger" id="sgDel" title="Eliminar">🗑</button>
      </div>
      ${conLetra ? '' : `<input class="sg-in url" id="sgU" value="${esc(c.url)}"
         placeholder="Enlace de YouTube del vídeo">`}`;
  }

  function mandoHTML(c, yt){
    if(!yt) return `<div class="note" style="margin-bottom:14px"><b>Pega el enlace de YouTube</b>
      con el botón <b>✎ Subtítulos</b> y lo verás aquí mismo, con sus subtítulos encendidos.</div>`;
    return `
      <div class="sg-yt${P.verVideo ? '' : ' oculto'}"><div id="sgPlayer"></div></div>
      <div class="sg-mando">
        <button class="sg-pp" id="sgPP" title="Reproducir / pausa">▶</button>
        <button class="sg-b" id="sgStop" title="Parar y volver al principio">■</button>
        <button class="sg-b" id="sgBack" title="Atrás 5 segundos">« 5s</button>
        <button class="sg-b" id="sgFwd" title="Adelante 5 segundos">5s »</button>
        <span class="sg-t0" id="sgT0">0:00</span>
        <input type="range" class="sg-barra" id="sgBarra" min="0" max="100" value="0" step="0.1"
               title="Mover por el vídeo">
        <span class="sg-t0" id="sgT1">—</span>
        <select class="sg-sel" id="sgVel" title="Velocidad del vídeo">
          ${[[1,'1×'],[0.75,'0.75×'],[0.5,'0.5×']].map(([v, n]) =>
            `<option value="${v}"${P.vel === v ? ' selected' : ''}>${n}</option>`).join('')}
        </select>
        <button class="sg-b${P.verVideo ? ' on' : ''}" id="sgVer"
                title="Ver u ocultar la imagen. Oculto, el audio sigue">👁</button>
      </div>`;
  }

  /* ── El cuerpo: buscador + subtítulos enteros ──
     Se quitó el karaoke. Sincronizar línea a línea nunca iba a quedar fino sin
     los tiempos reales, y encima tapaba lo útil. Ahora es lo que de verdad
     sirve para estudiar: el vídeo con SUS subtítulos, el texto entero debajo
     para leerlo, y un buscador que dice si la palabra está en el documento
     y, si no, la manda a los cuatro diccionarios. */
  /* Las expresiones que SALEN en este video. No es una lista de adorno: es lo
     que mas se pierde oyendo, porque ninguna de sus palabras por separado dice
     lo que significa el bloque. Si no te avisan de que «give up» esta ahi, no
     la buscas -- ni sabes que existe. Se detectan conjugadas: «I gave up»
     cuenta. */
  function expresionesDelVideo(L){
    let hay = [];
    try { hay = EXPR.enTexto(L.join(' ')); } catch(e){ return ''; }
    if(!hay.length) return '';
    return `
      <div class="sg-expr">
        <div class="sg-expr-t">🧩 ${hay.length === 1 ? 'Una expresión que sale aquí'
          : hay.length + ' expresiones salen en este vídeo'} · tócalas para verlas</div>
        <div class="sg-expr-l">${hay.slice(0, 14).map(e =>
          `<button class="sg-expr-b" data-expr="${esc(e.en)}">${esc(e.en)}
             <i>${esc(e.es)}</i></button>`).join('')}</div>
        ${hay.length > 14 ? `<div class="sg-ver-u">y ${hay.length - 14} más</div>` : ''}
      </div>`;
  }

  function cuerpo(c, L){
    return `
      ${expresionesDelVideo(L)}
      <div class="sg-busca">
        <input class="sg-busca-in" id="sgBuscar" placeholder="Buscar una palabra en estos subtítulos…"
               value="${esc(S.q || '')}" autocomplete="off" spellcheck="false">
        ${S.q ? `<button class="sg-b" id="sgLimpiar">✕</button>` : ''}
      </div>
      <div id="sgVeredicto">${S.q ? veredicto(S.q, L) : ''}</div>
      <div class="sg-texto" id="sgTexto">${textoHTML(L, S.q)}</div>
      ${guardadas(c)}`;
  }

  /* Los subtítulos completos. Cada palabra se puede tocar; si hay búsqueda,
     sus coincidencias van resaltadas. */
  function textoHTML(L, q){
    /* Una busqueda de varias palabras se resalta palabra a palabra: marcar el
       bloque entero pediria reconstruir el HTML por trozos y no aporta nada. */
    const partes = norma(limpioFrase(q)).split(' ').filter(Boolean);
    const nq = partes.length > 1 ? '' : norma(q);
    return L.map((t, i) => `<p class="sg-p2" data-i="${i}">${
      t.split(/(\s+)/).map(p => {
        if(/^\s+$/.test(p)) return p;
        const base = limpio(p);
        const hit = partes.length > 1
          ? partes.indexOf(norma(base)) >= 0
          : (nq && norma(base).indexOf(nq) >= 0);
        return `<span class="sg-w${hit ? ' hit' : ''}" data-w="${esc(base)}">${esc(p)}</span>`;
      }).join('')}</p>`).join('');
  }

  const norma = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  /* El veredicto de la búsqueda: cuántas veces sale aquí, si está en el
     documento, y si no, los cuatro diccionarios. */
  /* Cuenta cuántas veces sale en ESTE vídeo. Cuenta también las otras formas
     de la misma palabra: si buscas «go», «going» y «goes» también cuentan, que
     es lo que uno quiere saber de verdad. */
  /* Como «limpio», pero SIN comerse los espacios. Hace falta desde que la tira
     de expresiones manda «give up» al buscador: con el limpiador normal llegaba
     como «giveup» y el veredicto decia «no aparece» estando delante. */
  const limpioFrase = s => String(s || '').toLowerCase()
    .replace(/[^a-z0-9' ]/g, ' ').replace(/\s+/g, ' ').trim();

  function vecesEn(L, q){
    const frase = norma(limpioFrase(q));
    if(!frase) return 0;

    /* Dos o mas palabras: se cuenta como bloque sobre el texto entero, y se
       mira tambien con los verbos llevados a su base, para que «I gave up»
       cuente al buscar «give up». */
    if(frase.indexOf(' ') > 0){
      const ps = frase.split(' ');
      const toks = norma(limpioFrase(L.join(' '))).split(' ');
      /* El pasado irregular tiene FICHA PROPIA («gave» es una entrada), asi que
         el buscador devuelve «gave» y no «give». Hay que preguntarle tambien al
         lematizador o «gave up» no cuenta al buscar «give up». Es la misma
         trampa que ya arregle en EXPR.enTexto y que aqui no aplique. */
      const base = p => {
        try { const r = LEX.raiz(p); if(r) return r; } catch(e){}
        const r = BUSCA.buscar(p); return (r && r.w && r.via === 'forma') ? r.w.en : p;
      };
      const lem = toks.map(base);
      let n = 0;
      for(let i = 0; i + ps.length <= toks.length; i++){
        let casa = true;
        for(let j = 0; j < ps.length; j++){
          const ok = (j === 0) ? (toks[i+j] === ps[0] || lem[i+j] === ps[0]) : (toks[i+j] === ps[j]);
          if(!ok){ casa = false; break; }
        }
        if(casa) n++;
      }
      return n;
    }

    const nq = frase;
    const raizQ = (BUSCA.buscar(nq) || {}).w;
    let n = 0;
    L.forEach(t => t.split(/\s+/).forEach(p => {
      const c = norma(limpio(p));
      if(!c) return;
      if(c.indexOf(nq) >= 0){ n++; return; }
      if(raizQ){ const r = BUSCA.buscar(c); if(r && r.w === raizQ) n++; }
    }));
    return n;
  }

  function veredicto(q, L){
    /* Con espacios si son varias palabras; sin ellos para una sola, que es como
       estan indexadas las fichas del diccionario. */
    const frase = norma(limpioFrase(q));
    const nq = frase.indexOf(' ') > 0 ? frase : norma(limpio(q));
    if(!nq) return '';
    const veces = vecesEn(L, q);
    const r = BUSCA.buscar(nq);
    const w = r && r.w;
    const frases = PHRASES.filter(p => norma(p.en).indexOf(nq) >= 0).slice(0, 3);
    /* Las expresiones. Van primero LAS QUE SALEN EN ESTE VÍDEO: si la canción
       dice «give up», buscar «up» tiene que llevar ahí y no a cuatro phrasal
       verbs cualesquiera de los doscientos que hay. Después, si queda hueco,
       las demás que lleven la palabra. */
    const rq = BUSCA.buscar(nq);
    const base = (rq && rq.w) ? rq.w.en : nq;
    const lleva = e => {
      const en = e.en.toLowerCase();
      if(nq.indexOf(' ') > 0) return en === nq;   // se busco la expresion entera
      const ps = en.split(/[^a-z']+/);
      return ps.indexOf(nq) >= 0 || ps.indexOf(base) >= 0;
    };
    const aqui = EXPR.enTexto(L.join(' ')).filter(lleva);
    const fuera = EXPR.buscar(nq).filter(e => aqui.indexOf(e) < 0);
    const expr = aqui.concat(fuera).slice(0, 4);
    const nAqui = Math.min(aqui.length, expr.length);
    const hayAlgo = !!(w || frases.length || expr.length || (r && r.via === 'contra'));

    /* Por qué camino se llegó. Se dice SIEMPRE: si buscas «going» tienes que
       ver que lo que hay en el diccionario es «go». Si no, aprendes mal. */
    const puente = (r && r.via === 'contra') ? `
        <div class="sg-ver-via"><b>${esc(r.forma)}</b> = <b>${esc(r.contra.full)}</b>
          · ${esc(r.contra.es)}
          ${r.contra.nota ? `<span class="sg-ver-u">${esc(r.contra.nota)}</span>` : ''}</div>`
      : (r && r.via === 'forma') ? `
        <div class="sg-ver-via"><b>${esc(r.forma)}</b> es <b>${esc(r.base)}</b>
          · ${esc(r.como)}</div>` : '';

    return `
      <div class="sg-ver">
        <div class="sg-ver-t">
          <b>${esc(q)}</b>
          <span class="sg-prog">${veces ? veces + (veces === 1 ? ' vez en este vídeo' : ' veces en este vídeo') : 'no aparece en este vídeo'}</span>
        </div>
        ${puente}
        ${w ? `
          <div class="sg-ver-ok">✓ Está en el diccionario · <b>${esc(w.es)}</b>
            ${w.use ? `<span class="sg-ver-u">${esc(w.use)}</span>` : ''}
            ${w.xe ? `<span class="sg-ver-u">${esc(w.xe)} — ${esc(w.xs || '')}</span>` : ''}</div>` : ''}
        ${expr.length ? `
          <div class="sg-ver-ok">✓ ${nAqui ? (nAqui === 1 ? 'Esta expresión sale en este vídeo' : 'Estas expresiones salen en este vídeo') : 'Entra en estas expresiones'}:
            ${expr.map((e, k) => `<span class="sg-ver-f${k < nAqui ? ' aqui' : ''}"><b>${esc(e.en)}</b> · ${esc(e.es)}${
              e.use ? ` <i>(${esc(e.use)})</i>` : ''}</span>`).join('')}
            ${nAqui && nAqui < expr.length ? '<span class="sg-ver-u">Las de abajo no salen aquí, pero llevan la misma palabra.</span>' : ''}</div>` : ''}
        ${frases.length ? `
          <div class="sg-ver-ok">✓ Sale en ${frases.length === 3 ? 'varias de' : ''} las 1000 frases:
            ${frases.map(p => `<span class="sg-ver-f">${esc(p.en)}</span>`).join('')}</div>` : ''}
        ${!hayAlgo ? `
          <div class="sg-ver-no">Esta palabra <b>no está en el documento</b>. Mírala fuera:</div>
          <div class="sg-ver-links">${RECURSOS.map(rc =>
            `<a class="sg-link" href="${rc.url(q)}" target="_blank" rel="noopener"
                title="${esc(rc.mejor)}">${rc.ico} ${esc(rc.n)}</a>`).join('')}</div>` : `
          <div class="sg-ver-links">${RECURSOS.map(rc =>
            `<a class="sg-link chico" href="${rc.url(q)}" target="_blank" rel="noopener">${rc.ico} ${esc(rc.n)}</a>`).join('')}</div>`}
      </div>`;
  }

  /* Las palabras que ha guardado de ESTE vídeo. Es el puente con el resto del
     documento: cada una se puede oír, buscar en las 2000 palabras y las 1000
     frases, y mandar a la Práctica diaria. */
  function guardadas(c){
    const g = c.pal || [];
    return `
      <div class="sg-guard">
        <div class="sg-guard-t">Palabras que te llevaste de aquí
          <span class="sg-prog">${g.length ? g.length : 'ninguna todavía'}</span></div>
        ${g.length ? `<div class="sg-chips">${g.map(p => `
          <span class="sg-chip" data-pal="${esc(p)}">${esc(p)}<button class="sg-chip-x" data-quita="${esc(p)}" title="Quitar">✕</button></span>`).join('')}</div>`
        : `<div class="sg-guard-d">Toca cualquier palabra de la línea grande: te dice qué
             significa, la puedes guardar en tu Práctica y buscarla en el resto del documento.</div>`}
      </div>`;
  }

  function pegarLetra(c){
    return `
      <div class="sg-pega">
        <div class="sg-pega-t">Pega aquí la transcripción del vídeo</div>
        <p class="sg-p"><b>En YouTube, bajo el vídeo: «···  Mostrar transcripción»</b> → seleccionar
           todo → copiar → pegar aquí. Son los subtítulos que genera el propio vídeo, así que
           dicen exactamente lo que se habla.
           <br>También valen archivos <b>.srt</b>, <b>.vtt</b> o <b>.lrc</b>: los tiempos se quitan
           solos y queda el texto limpio. <b>Los subtítulos que ves mientras corre el vídeo los pone
           YouTube</b>; esto de aquí es para leerlo con calma y para buscar palabras dentro.</p>
        <textarea class="sg-ta" id="sgTA" placeholder="Pega los subtítulos o la transcripción…">${esc(c.letra || '')}</textarea>
        <button class="sg-b grande" id="sgOk">Preparar el vídeo</button>
        <div class="note" style="margin-top:14px"><b>Por qué la pones tú:</b> las letras tienen
          derechos de autor y no pueden vivir dentro del documento. Aquí pasa lo mismo que en el
          Cuaderno: la máquina la pongo yo, el material lo traes tú. Los subtítulos que verás en el
          vídeo los sirve YouTube, que es quien tiene la licencia.</div>
      </div>`;
  }


  /* ══════════ QUITARLE LOS TIEMPOS A UN ARCHIVO DE SUBTÍTULOS ══════════
     Si lo que pegas es un .srt / .vtt / .lrc o la transcripción de YouTube,
     viene lleno de marcas de tiempo. Se detecta solo al pegar y se separa el
     texto de las marcas, para que abajo quede el diálogo limpio y legible.
     Aquí no se descarga nada de ningún sitio: se lee lo que TÚ pegas, igual
     que el Cuaderno lee lo que tú escribes. */
  function aSegundos(h, m, s, ms){
    const dec = ms == null ? 0 : (+ms) / Math.pow(10, String(ms).length);
    return (+h || 0) * 3600 + (+m || 0) * 60 + (+s || 0) + dec;
  }

  function importarConTiempos(txt){
    const bruto = String(txt || '');
    const out = { lineas: [], tiempos: [] };

    // ── SRT / VTT: «00:00:12,340 --> 00:00:15,100» y debajo el texto
    if(bruto.indexOf('-->') >= 0){
      bruto.replace(/\r/g, '').split(/\n\s*\n/).forEach(b => {
        const ls = b.split('\n').filter(x => x.trim());
        const iT = ls.findIndex(x => x.indexOf('-->') >= 0);
        if(iT < 0) return;
        const m = ls[iT].match(/(\d{1,2}):(\d{2}):(\d{2})[.,](\d{2,3})/);
        if(!m) return;
        const texto = ls.slice(iT + 1).join(' ').replace(/<[^>]*>/g, '').trim();
        if(!texto) return;
        out.lineas.push(texto);
        out.tiempos.push(+aSegundos(m[1], m[2], m[3], m[4]).toFixed(2));
      });
      if(out.lineas.length) return out;
    }

    /* ── TRANSCRIPCIÓN DE YOUTUBE ──
       Es el formato que sale del botón «Mostrar transcripción» del propio
       YouTube: una marca de tiempo suelta y el texto, o bien el tiempo en una
       línea y el texto en la siguiente. Son los subtítulos QUE GENERA EL
       VÍDEO, con sus tiempos ya dentro — o sea, exactamente lo que hace falta.
       El usuario los copia de YouTube y los pega aquí una sola vez. */
    {
      const fs2 = bruto.replace(/\r/g, '').split('\n').map(x => x.trim()).filter(Boolean);
      const soloHora = /^(\d{1,2}:)?\d{1,2}:\d{2}$/;
      const horaYtexto = /^((?:\d{1,2}:)?\d{1,2}:\d{2})\s+(.+)$/;
      const res = { lineas: [], tiempos: [] };
      for(let i = 0; i < fs2.length; i++){
        let hh = null, tx = null;
        const m1 = fs2[i].match(horaYtexto);
        if(m1){ hh = m1[1]; tx = m1[2]; }
        else if(soloHora.test(fs2[i]) && fs2[i + 1] && !soloHora.test(fs2[i + 1])){
          hh = fs2[i]; tx = fs2[i + 1]; i++;
        }
        if(hh == null || !tx) continue;
        const p = hh.split(':').map(Number);
        const seg = p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p[0] * 60 + p[1];
        res.lineas.push(tx);
        res.tiempos.push(+seg.toFixed(2));
      }
      // Al menos tres marcas para no confundirlo con un texto que cite una hora
      if(res.lineas.length >= 3) return res;
    }

    // ── LRC: «[01:23.45] texto», admitiendo varias marcas en la misma línea
    let algo = false;
    bruto.replace(/\r/g, '').split('\n').forEach(f => {
      const marcas = f.match(/\[(\d{1,2}):(\d{2})(?:[.:](\d{2,3}))?\]/g);
      if(!marcas) return;
      const texto = f.replace(/\[[^\]]*\]/g, '').trim();
      if(!texto) return;                                  // cabeceras [ar:], [ti:]…
      marcas.forEach(mk => {
        const m = mk.match(/\[(\d{1,2}):(\d{2})(?:[.:](\d{2,3}))?\]/);
        out.lineas.push(texto);
        out.tiempos.push(+aSegundos(0, m[1], m[2], m[3]).toFixed(2));
        algo = true;
      });
    });
    if(!algo) return null;
    // Un LRC puede traer las marcas desordenadas: se ordenan por tiempo
    const orden = out.tiempos.map((t, i) => i).sort((a, b) => out.tiempos[a] - out.tiempos[b]);
    return { lineas: orden.map(i => out.lineas[i]), tiempos: orden.map(i => out.tiempos[i]) };
  }

  /* ══════════ ANCLAS ══════════
     Cada vez que corriges una línea con el ESPACIO, esa línea queda ANCLADA.
     El resto se recalcula interpolando ENTRE anclas, no arrasando con todo lo
     que hay debajo — así lo que ya cuadraste no se pierde al corregir otra
     cosa más arriba. Con tres o cuatro anclas la canción entera queda fina. */



  /* Ajuste sobre la marcha: el ESPACIO dice «esta línea entra AHORA», y todo
     lo que viene detrás se recoloca en proporción. Es lo que hace que
     converja rápido en vez de tener que marcar las cuarenta líneas. */

  /* Correr TODA la letra unos décimas, para cuando va entera adelantada o
     atrasada. Es el ajuste más común y no necesita tocar línea por línea. */
  /* OJO con el objeto: `libro()` parsea el JSON y devuelve una COPIA NUEVA
     cada vez, así que el `c` que capturó `wire()` queda viejo en cuanto algo
     guarda. Si el llamante volvía a hacer `toca(c)` con el suyo, pisaba lo
     recién escrito y el desplazamiento se perdía — pasaba justo eso con
     «Empieza aquí». Por eso esto DEVUELVE el objeto bueno: hay que seguir
     trabajando con el que sale de aquí, no con el de antes. */

  const reloj = s => {
    if(typeof s !== 'number' || !isFinite(s)) return '—';
    const m = Math.floor(s / 60), g = Math.floor(s % 60);
    return m + ':' + (g < 10 ? '0' : '') + g;
  };

  /* La barra de sincronizar. Es la pieza que hace posible el karaoke sin
     copiar nada: Miguel marca UNA VEZ dónde arranca cada línea y desde
     entonces la letra va sola. */
  /* La vista de karaoke: SOLO tres líneas — la que pasó, la que suena y la
     que viene. Es lo que se mira mientras suena la canción; la letra entera
     queda debajo para el trabajo de estudio. */


  /* ══════════ Enganches ══════════ */
  function wire(){
    const b = $('sgNueva'); if(b) b.onclick = nueva;
    document.querySelectorAll('[data-sg]').forEach(x => x.onclick = () => {
      parar(); S.id = x.dataset.sg; S.huecos = -1; S.w = 0; S.buf = ''; render();
    });
    /* Borrar CUALQUIER vídeo desde la lista, esté donde esté — no solo cuando
       se llena. Va con deshacer, como todo lo que borra algo en el documento. */
    document.querySelectorAll('[data-borra]').forEach(x => x.onclick = ev => {
      ev.stopPropagation();
      const id = x.dataset.borra, o0 = libro(), v = o0[id];
      if(!v) return;
      doUndoable('Eliminar vídeo', [K], () => {
        const o = libro(); delete o[id]; guardar(o);
        if(S.id === id){ S.id = null; TTS.parar(); paraTic(); P.player = null; P.vid = null; P.listo = false; }
        render();
      }, 'Vídeo «' + (v.t || 'sin título') + '» eliminado');
    });
    const c = actual(); if(!c) return;

    const t = $('sgT'), a = $('sgA'), u = $('sgU');
    if(t) t.oninput = () => { c.t = t.value; toca(c); };
    if(a) a.oninput = () => { c.a = a.value; toca(c); };
    if(u) u.oninput = () => { c.url = u.value; toca(c); };

    const ok = $('sgOk'), ta = $('sgTA');
    if(ok && ta) ok.onclick = () => {
      const v = ta.value.trim();
      if(!v) return toast('Pega primero los subtítulos', 'warn');
      /* ¿Lo que pegaste YA trae los tiempos dentro (.srt / .vtt / .lrc)?
         Entonces la canción queda sincronizada clavada, sin estimar nada y
         sin tocar ningún botón. */
      const conT = importarConTiempos(v);
      if(conT && conT.lineas.length){
        c.letra = conT.lineas.join('\n');
        c.tiempos = conT.tiempos;
        c.anclas = [];
        /* EXACTOS: estos tiempos vienen del propio vídeo, no de una
           estimación. A partir de aquí no se recalculan nunca — solo se
           desplazan en bloque si hiciera falta. Machacarlos con el reparto
           por sílabas era lo que hacía que la letra se fuera desincronizando
           más adelante después de pulsar «Empieza aquí». */
        c.exactos = true;
        c.intro = conT.tiempos[0];
        toca(c); P.linea = -1; render();
        toast('Subtítulos importados · ' + conT.lineas.length + ' líneas', 'ok');
        return;
      }
      c.letra = v; c.tiempos = null; c.anclas = []; c.exactos = false;
      toca(c); P.linea = -1; render();
      toast('Subtítulos listos · ' + lineasDe(c).length + ' líneas', 'ok');
    };
    const ed = $('sgEdit');
    if(ed) ed.onclick = () => {
      const v = c.letra; c.letra = ''; toca(c); render();
      const nta = $('sgTA'); if(nta){ nta.value = v; nta.focus(); }
    };
    const del = $('sgDel');
    if(del) del.onclick = () => {
      doUndoable('Eliminar vídeo', [K], () => {
        const o = libro(); delete o[c.id]; guardar(o); S.id = null; parar(); render();
      }, 'Vídeo «' + (c.t || 'sin título') + '» eliminada');
    };

    /* ── El mando único de la canción ── */
    const yt = ytId(c.url);
    if(yt && $('sgPlayer') && (!P.player || P.vid !== yt)){ P.vid = yt; montaPlayer(yt); }

    const pp = $('sgPP');
    if(pp) pp.onclick = () => { P.estado === 1 ? manda('pauseVideo') : manda('playVideo'); };
    const st = $('sgStop');
    if(st) st.onclick = () => { manda('pauseVideo'); irA(0); P.linea = -1; };
    const bk = $('sgBack'); if(bk) bk.onclick = () => irA(P.t - 5);
    const fw = $('sgFwd');  if(fw) fw.onclick = () => irA(P.t + 5);
    const ba = $('sgBarra');
    if(ba) ba.oninput = () => irA(+ba.value);
    const ve = $('sgVel');
    if(ve) ve.onchange = () => { P.vel = +ve.value; manda('setPlaybackRate', P.vel); };
    const vv = $('sgVer');
    if(vv) vv.onclick = () => { P.verVideo = !P.verVideo; render(); };

    /* ── El buscador ──
       Dice cuántas veces sale la palabra en ESTOS subtítulos, si está en el
       documento, y si no, la manda a los cuatro diccionarios. */
    const bu = $('sgBuscar');
    if(bu){
      let temp = null;
      bu.oninput = () => {
        clearTimeout(temp);
        temp = setTimeout(() => {
          S.q = bu.value;
          pintaVar(actual() || c); wire();
          const n = $('sgBuscar');
          if(n){ n.focus(); n.setSelectionRange(n.value.length, n.value.length); }
        }, 220);
      };
      bu.onkeydown = e => {
        if(e.key === 'Escape'){ S.q = ''; pintaVar(actual() || c); wire(); }
      };
    }
    const li = $('sgLimpiar');
    if(li) li.onclick = () => { S.q = ''; pintaVar(actual() || c); wire(); };

    /* ── Doble clic en cualquier palabra del subtítulo ──
       Va por DELEGACIÓN sobre el bloque: se repinta entero en cada búsqueda,
       y unos manejadores puestos en cada <span> se irían con él. Misma trampa
       que mató al reproductor, evitada aquí.
       Vale el doble clic —que es lo que pediste— y también el clic simple. */
    document.querySelectorAll('[data-expr]').forEach(x => x.onclick = () => {
      S.q = x.dataset.expr;
      pintaVar(actual() || c); wire(); TTS.say(S.q);
      const v = $('sgVeredicto'); if(v) v.scrollIntoView({ block:'nearest', behavior:'smooth' });
    });

    const tx = $('sgTexto');
    if(tx){
      const mirar = ev => {
        const x = ev.target.closest('.sg-w');
        if(!x) return;
        const p = limpio(x.textContent); if(!p) return;
        ev.preventDefault(); ev.stopPropagation();
        try { DIC.cerrar(); } catch(e){}   // el primer clic abrio la ficha: estorba sobre el veredicto
        S.q = p;
        pintaVar(actual() || c); wire();
        TTS.say(p);
        const v = $('sgVeredicto');
        if(v) v.scrollIntoView({ block:'nearest', behavior:'smooth' });
      };
      tx.ondblclick = mirar;
    }
    document.querySelectorAll('[data-pal]').forEach(x => x.onclick = ev => {
      if(ev.target.closest('[data-quita]')) return;
      const p = x.dataset.pal; TTS.say(p);
      const r = x.getBoundingClientRect();
      fichaPalabra(p, r.left + r.width / 2, r.bottom);
    });
    document.querySelectorAll('[data-quita]').forEach(x => x.onclick = ev => {
      ev.stopPropagation();
      const p = x.dataset.quita;
      c.pal = (c.pal || []).filter(v => v !== p);
      const w = IDX_EN.get(p);
      if(w){ favW.delete(w.i); saveFav(); try { refreshAll(); } catch(e){} }
      toca(c); pintaVar(c); wire();
    });

    // Tocar una palabra abre su ficha del diccionario, igual que en el resto
    document.querySelectorAll('.sg-w[data-w]').forEach(x => x.onclick = ev => {
      const p = x.dataset.w; if(!p) return;
      TTS.say(p);
      const r = x.getBoundingClientRect();
      try { DIC.abrir(p, r.left, r.bottom); } catch(e){}
      ev.stopPropagation();
    });
  }

  function init(g, s){
    store_get = g; store_set = s;
    document.addEventListener('keydown', tecla);
    render();
  }

  /* Comprobación repetible: APP.SONG.auditar() */
  function auditar(){
    const malas = [];
    SUGE.forEach(x => { if(!x.t || !x.a || !x.por) malas.push('sugerencia incompleta: ' + x.t); });
    ['https://youtu.be/dQw4w9WgXcQ','https://www.youtube.com/watch?v=dQw4w9WgXcQ',
     'https://www.youtube.com/embed/dQw4w9WgXcQ'].forEach(u => {
      if(ytId(u) !== 'dQw4w9WgXcQ') malas.push('no saca el id de: ' + u);
    });
    if(ytId('https://malicioso.example/watch?v=AAAAAAAAAAA') !== 'AAAAAAAAAAA'){ /* solo se usa el id */ }
    const pruebaHuecos = huecosDeLinea('I am walking down the street tonight');
    if(!pruebaHuecos.length) malas.push('no calcula huecos');

    /* El importador: que saque los tiempos de un .srt y de un .lrc.
       Texto de prueba propio, no de ninguna canción. */
    const srt = '1\n00:00:11,500 --> 00:00:15,200\nuna linea de prueba\n\n' +
                '2\n00:00:15,400 --> 00:00:19,100\notra linea de prueba\n';
    const a = importarConTiempos(srt);
    if(!a || a.lineas.length !== 2 || a.tiempos[0] !== 11.5 || a.tiempos[1] !== 15.4)
      malas.push('el importador de .srt no saca bien los tiempos');
    const lrc = '[ti:x]\n[00:11.50]una linea\n[00:15.40]otra linea\n';
    const b = importarConTiempos(lrc);
    if(!b || b.lineas.length !== 2 || b.tiempos[0] !== 11.5 || b.lineas[0].indexOf('[') >= 0)
      malas.push('el importador de .lrc no saca bien los tiempos');
    if(importarConTiempos('solo texto sin tiempos\nsegunda linea') !== null)
      malas.push('confunde texto normal con subtitulos');

    /* La transcripcion de YouTube, en sus dos formas: el tiempo pegado al
       texto y el tiempo en su propia linea. */
    const yt1 = '0:11 primera linea\n0:15 segunda linea\n1:02 tercera linea\n';
    const c1 = importarConTiempos(yt1);
    if(!c1 || c1.lineas.length !== 3 || c1.tiempos[0] !== 11 || c1.tiempos[2] !== 62)
      malas.push('no lee la transcripcion de YouTube (tiempo y texto juntos)');
    const yt2 = '0:11\nprimera linea\n0:15\nsegunda linea\n1:02\ntercera linea\n';
    const c2 = importarConTiempos(yt2);
    if(!c2 || c2.lineas.length !== 3 || c2.tiempos[2] !== 62 || c2.lineas[0] !== 'primera linea')
      malas.push('no lee la transcripcion de YouTube (tiempo en su linea)');
    const yt3 = '1:23:45 con horas\n1:23:50 otra\n1:24:00 otra mas\n';
    const c3 = importarConTiempos(yt3);
    if(!c3 || c3.tiempos[0] !== 5025) malas.push('no lee transcripciones con horas');
    return { pasos:PASOS.length, sugerencias:SUGE.length,
             soloAdultos:SUGE.filter(x => !x.nino).length, malas };
  }

  return { init, render, nueva, auditar, S, SUGE, PASOS, ytId, huecosDeLinea, parar };
})();

/* ─────────── BIFURCACIONES ───────────
   La técnica de las pizarras que le funcionan a Miguel, pero con el hueco
   sin resolver: el ejemplo no enseña la respuesta hasta que él elige. */
const BF = (() => {
  let filtro = 'all';
  const hechas = () => store.get('eng_bifur', {});
  const marcar = (i, v) => { const h = hechas(); if(v) h[i] = 1; else delete h[i]; store.set('eng_bifur', h); };

  /* Frase completa, con el hueco ya relleno, para poder oírla */
  const frase = (ex, resp) => ex.en.split('_').join(' ' + resp.toLowerCase() + ' ')
    .replace(/\s+/g, ' ').replace(/\s+([.,?!])/g, '$1').trim();

  function ejHTML(b, ex, i, j){
    const partes = ex.en.split('_');
    const ops = ex.o || b.r.map(a => a.w);
    return `<div class="bf-q" data-q="${i}-${j}">
      <div class="esp">${esc(ex.es)}</div>
      <div class="ing">${esc(partes[0])}<button class="bf-gap" data-gap="${i}-${j}">?</button>${esc(partes[1] || '')}</div>
      <div class="bf-opts" data-opts="${i}-${j}" style="display:none">
        ${ops.map(o => `<button class="bf-opt" data-pick="${esc(o)}" data-for="${i}-${j}">${esc(o)}</button>`).join('')}
      </div>
      <div class="bf-why" data-why="${i}-${j}"></div>
    </div>`;
  }

  function card(b, i){
    const ok = !!hechas()[i];
    return `<div class="bf${ok ? ' done' : ''}" data-bf="${i}">
      <div class="bf-top">
        <div class="bf-ask">¿cuál usarías?</div>
        <div class="bf-word">${esc(b.q)}</div>
        <div class="bf-sub">${b.sub}</div>
      </div>
      <div class="bf-arms">
        ${b.r.map(a => `<div class="bf-arm arm-${a.c}">
          <div class="w">${esc(a.w)}<button class="spk sm" data-say="${esc(a.w)}" title="Oír">🔊</button></div>
          <div class="j">${a.j}</div>
          <div class="t">${a.t}</div>
        </div>`).join('')}
      </div>
      <div class="bf-trap">
        <b>La trampa del español:</b><br>
        <span class="no">✗ ${b.x.no}</span> &nbsp;→&nbsp; <span class="si">✓ ${b.x.si}</span><br>
        <span style="display:block;margin-top:7px">${b.x.why}</span>
      </div>
      <div class="bf-ex">
        <div class="bf-ex-h">Rellena el hueco <span class="sc" data-sc="${i}">0 / ${b.e.length}</span></div>
        ${b.e.map((ex, j) => ejHTML(b, ex, i, j)).join('')}
      </div>
    </div>`;
  }

  function render(){
    const nav = $('bfNav'), box = $('bfList');
    if(!nav || !box) return;
    const h = hechas();
    nav.innerHTML = `<button class="bf-pill${filtro === 'all' ? ' on' : ''}" data-f="all">Todas <b>${BIFUR.length}</b></button>`
      + `<button class="bf-pill${filtro === 'todo' ? ' on' : ''}" data-f="todo">Pendientes <b>${BIFUR.length - Object.keys(h).length}</b></button>`
      + BIFUR.map((b, i) => `<button class="bf-pill${filtro === String(i) ? ' on' : ''}" data-f="${i}">${esc(b.q)}${h[i] ? ' <span class="tick">✓</span>' : ''}</button>`).join('');
    nav.onclick = e => {
      const p = e.target.closest('[data-f]'); if(!p) return;
      filtro = p.dataset.f; render();
      box.scrollIntoView({ behavior:'smooth', block:'start' });
    };
    const lista = filtro === 'all' ? BIFUR.map((b, i) => [b, i])
      : filtro === 'todo' ? BIFUR.map((b, i) => [b, i]).filter(([, i]) => !h[i])
      : BIFUR.map((b, i) => [b, i]).filter(([, i]) => String(i) === filtro);
    box.innerHTML = lista.length
      ? lista.map(([b, i]) => card(b, i)).join('')
      : `<div class="pr-done"><div class="big">🎉</div><h3>Ninguna pendiente</h3>
         <p>Resolviste las ${BIFUR.length} bifurcaciones. Vuelve en unos días y repítelas: el objetivo no es acertar una vez, es que la respuesta te salga sin pensar.</p>
         <button class="btn pri" id="bfReset">↻ Empezar de nuevo</button></div>`;
    const rb = $('bfReset');
    if(rb) rb.onclick = () => {
      doUndoable('Reiniciar bifurcaciones', ['eng_bifur'], () => { store.set('eng_bifur', {}); render(); }, 'Progreso reiniciado');
    };
  }

  /* Un solo manejador para todos los huecos y opciones */
  function wire(){
    const box = $('bfList'); if(!box) return;
    box.addEventListener('click', e => {
      const gap = e.target.closest('[data-gap]');
      if(gap){
        const o = box.querySelector(`[data-opts="${gap.dataset.gap}"]`);
        if(o) o.style.display = o.style.display === 'none' ? 'flex' : 'none';
        return;
      }
      const pick = e.target.closest('[data-pick]');
      if(!pick) return;
      const id = pick.dataset.for;
      const [i, j] = id.split('-').map(Number);
      const b = BIFUR[i], ex = b.e[j];
      const acerto = pick.dataset.pick.toUpperCase() === String(ex.ok).toUpperCase();

      const q = box.querySelector(`[data-q="${id}"]`);
      const g = box.querySelector(`[data-gap="${id}"]`);
      const why = box.querySelector(`[data-why="${id}"]`);
      const opts = box.querySelector(`[data-opts="${id}"]`);

      opts.querySelectorAll('.bf-opt').forEach(o => {
        o.disabled = true;
        if(o.dataset.pick.toUpperCase() === String(ex.ok).toUpperCase()) o.classList.add('good');
        else if(o === pick) o.classList.add('wrong');
      });
      g.textContent = ex.ok;
      g.classList.add(acerto ? 'ok' : 'bad');
      q.classList.add(acerto ? 'ok' : 'bad');
      why.className = 'bf-why on';
      why.innerHTML = (acerto ? '<b style="color:#4ade80">✓ Correcto. </b>' : '<b style="color:#f87171">✗ Era ' + esc(ex.ok) + '. </b>') + ex.w
        + ` <button class="spk sm" data-say="${esc(frase(ex, ex.ok))}" title="Oír la frase completa" style="margin-left:6px">🔊</button>`;
      TTS.say(frase(ex, ex.ok));
      Streak.ping();

      // ¿Ya resolvió todos los ejemplos de esta bifurcación?
      const card = box.querySelector(`[data-bf="${i}"]`);
      const resueltos = card.querySelectorAll('.bf-gap.ok, .bf-gap.bad').length;
      const sc = card.querySelector(`[data-sc="${i}"]`);
      const aciertos = card.querySelectorAll('.bf-gap.ok').length;
      if(sc) sc.textContent = `${aciertos} / ${b.e.length}`;
      if(resueltos === b.e.length){
        card.classList.add('done');
        marcar(i, true);
        if(aciertos === b.e.length) toast('«' + b.q + '» dominada · ' + aciertos + '/' + b.e.length, 'ok');
      }
    });
  }

  function reload(){ render(); }
  return { render, wire, reload };
})();

/* ─────────── 13b · FILTROS CONTRAÍBLES ───────────
   Los dos bloques de chips ocupaban ~350 px pegados al tope y tapaban el
   contenido. Al despegarse se contraen solos; el botón «Filtros» los abre. */
const CTL = (() => {
  function headerH(){
    const t = document.querySelector('.topbar');
    document.documentElement.style.setProperty('--hh', ((t ? t.offsetHeight : 56) + 4) + 'px');
  }
  /** El botón contraído dice QUÉ filtros están puestos, para no abrirlo a ciegas. */
  function label(id){
    const el = $(id); if(!el) return;
    const tog = el.querySelector('.ctl-tog'); if(!tog) return;
    const names = [];
    if(id === 'ctl1'){
      if(M1.band !== 'all'){ const b = BANDS.find(x => x.id === M1.band); if(b) names.push(b.lb.split(' ·')[0]); }
      if(M1.cat !== 'all') names.push(CAT_LABEL[M1.cat] || M1.cat);
      if(M1.fav) names.push('★ marcadas');
    } else {
      if(M2.func !== 'all') names.push(FUNC_LABEL[M2.func] || M2.func);
      if(M2.tense !== 'all') names.push(TENSE_LABEL[M2.tense] || M2.tense);
      if(M2.fav) names.push('★ marcadas');
    }
    const lb = tog.querySelector('.lb');
    lb.innerHTML = names.length
      ? 'Filtros <span class="n">' + names.length + '</span> · ' + esc(names.join(' · '))
      : 'Filtros';
  }
  function collapse(el){ el.classList.remove('open'); el.classList.add('min'); }
  function expand(el){ el.classList.remove('min'); el.classList.add('open'); }

  /* Se detecta con scroll y no con IntersectionObserver a propósito: el IO
     depende de que el navegador esté componiendo fotogramas, y en contextos
     donde no lo hace (pestaña oculta, paneles embebidos) no entrega ni una
     sola llamada — el panel se quedaría desplegado para siempre. */
  const panels = [];
  let ticking = false;
  function apply(){
    ticking = false;
    const hh = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--hh')) || 56;
    panels.forEach(({ el, sent }) => {
      if(!el.offsetParent) return;                 // pestaña no visible: no tocar
      const stuck = sent.getBoundingClientRect().top <= hh;
      if(stuck){ if(!el.classList.contains('open')) el.classList.add('min'); }
      else el.classList.remove('min', 'open');
    });
  }
  // Throttle por temporizador y NO por requestAnimationFrame: rAF tampoco corre
  // cuando el navegador no compone fotogramas, y el panel se quedaba abierto.
  function onScroll(){ if(!ticking){ ticking = true; setTimeout(apply, 60); } }

  function wire(id){
    const el = $(id); if(!el) return;
    const sent = el.previousElementSibling;
    if(sent && sent.classList.contains('ctl-sentinel')){
      panels.push({ el, sent });
      if(panels.length === 1){
        window.addEventListener('scroll', onScroll, { passive:true });
        window.addEventListener('resize', onScroll);
      }
    }
    el.querySelector('.ctl-tog').onclick = () => {
      el.classList.contains('open') ? collapse(el) : expand(el);
    };
    // Elegir un filtro con el panel abierto lo vuelve a cerrar: ves el resultado enseguida
    el.querySelectorAll('.ctl-f').forEach(r => r.addEventListener('click', e => {
      if(e.target.closest('.chip') && el.classList.contains('open'))
        setTimeout(() => { collapse(el); label(id); }, 120);
    }));
    label(id);
  }
  return { headerH, wire, label, apply };
})();

/* ─────────── 14 · REFRESCO GLOBAL ───────────
   Deshacer y sincronizar cambian el almacenamiento por debajo. Sin esto,
   el disco quedaría actualizado y la pantalla mostrando lo viejo. */
function refreshAll(){
  reloadFavs();
  BF.reload();
  NB.reload();
  SRS.reload();
  Streak.reload();
  renderWords();
  renderPhrases();
  if($('nb').classList.contains('on')) NB.render();
  if($('pr').classList.contains('on')) SRS.start();
}

/* ─────────── 15 · PANEL DE SINCRONIZACIÓN ─────────── */
function renderSync(){
  const box = $('syncBody');
  if(!box || !window.SYNC) return;
  const u = SYNC.user;
  const last = SYNC.last;
  if(u){
    box.innerHTML = `
      <div class="sync-on">
        <div class="sync-dot ok"></div>
        <div><b>Sincronización activa</b><small>${esc(u.email || '')}</small></div>
      </div>
      <div class="sync-info">
        <div><span>Última vez</span><b>${last ? new Date(last).toLocaleString('es-CO', {day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'}) : 'nunca'}</b></div>
        <div><span>Sin subir</span><b>${SYNC.pending} cambio${SYNC.pending === 1 ? '' : 's'}</b></div>
      </div>
      <p class="sync-note">Se sincronizan tus <b>cuadernos</b>, la <b>papelera</b>, tus <b>marcadores ★</b>, el <b>progreso de práctica</b> y la <b>racha</b>. Abre esta misma página en el celular con la misma cuenta y aparece todo.</p>
      <p class="sync-note" style="border-left-color:var(--ok)"><b>Tus cuadernos no se pisan.</b> Si escribes en el celular y en el PC, se unen página por página. Nunca gana uno borrando al otro.</p>
      <button class="btn pri" id="syncNow" style="width:100%;justify-content:center">🔄 Sincronizar ahora</button>
      <button class="btn" id="syncOut" style="width:100%;justify-content:center;margin-top:8px">Cerrar sesión</button>`;
    $('syncNow').onclick = async () => {
      toast('Sincronizando…');
      await SYNC.flushNow();
      const ok = await SYNC.pull();
      refreshAll(); renderSync();
      toast(ok ? 'Todo al día' : 'No se pudo conectar. Tus datos siguen guardados aquí.', ok ? 'ok' : 'warn');
    };
    $('syncOut').onclick = async () => {
      if(!confirm('¿Cerrar sesión?\n\nTus datos SIGUEN en este dispositivo. Solo se deja de sincronizar.')) return;
      await SYNC.signOut(); renderSync(); toast('Sesión cerrada', 'warn');
    };
  } else {
    box.innerHTML = `
      <div class="sync-on">
        <div class="sync-dot off"></div>
        <div><b>Solo en este dispositivo</b><small>tu progreso no sale de este navegador</small></div>
      </div>
      <p class="sync-note">Entra con tu cuenta del Cerebro (la misma de DA-2026) y tendrás cuadernos, marcadores, práctica y racha en el <b>celular y en cualquier otro equipo</b>.</p>
      <label class="sync-lb">Correo</label>
      <input class="sync-in" id="syncMail" type="email" autocomplete="username" placeholder="tucorreo@ejemplo.com">
      <label class="sync-lb">Contraseña</label>
      <input class="sync-in" id="syncPass" type="password" autocomplete="current-password" placeholder="mínimo 6 caracteres">
      <div class="sync-err" id="syncErr"></div>
      <button class="btn pri" id="syncIn" style="width:100%;justify-content:center">Entrar</button>
      <button class="btn" id="syncUp" style="width:100%;justify-content:center;margin-top:8px">Crear cuenta nueva</button>
      <p class="sync-note" style="margin-top:14px;border-left-color:var(--warn)"><b>Sin cuenta también funciona todo.</b> La sincronización es opcional: sin ella nada se pierde, simplemente se queda en este equipo.</p>`;
    const run = async (fn) => {
      const mail = $('syncMail').value.trim(), pass = $('syncPass').value;
      const err = $('syncErr');
      if(!mail || !pass){ err.textContent = 'Escribe tu correo y tu contraseña.'; err.className = 'sync-err on'; return; }
      err.className = 'sync-err'; toast('Conectando…');
      const r = await fn(mail, pass);
      if(!r.ok){ err.textContent = r.msg; err.className = 'sync-err on'; return; }
      refreshAll(); renderSync();
      toast(r.msg || 'Sincronización activada', 'ok');
    };
    $('syncIn').onclick = () => run(SYNC.signIn);
    $('syncUp').onclick = () => run(SYNC.signUp);
    $('syncPass').onkeydown = e => { if(e.key === 'Enter') run(SYNC.signIn); };
  }
}

/* ─────────── 16 · ARRANQUE ─────────── */
function init(){
  $('tc1').textContent = WORDS.length;
  $('tc2').textContent = PHRASES.length;
  $('st1').textContent = WORDS.length;
  $('st2').textContent = PHRASES.length;
  const st3 = $('st3'); if(st3 && typeof BIFUR !== 'undefined') st3.textContent = BIFUR.length;

  buildChips($('bands'), BANDS, 'all', v => { M1.band = v; renderWords(true); });
  const wc = countBy(WORDS, 'cat');
  buildChips($('cats'),
    [{ id:'all', lb:'Todas', n:WORDS.length }].concat(
      Object.keys(CAT_LABEL).filter(c => wc[c]).sort((a,b) => wc[b]-wc[a]).map(c => ({ id:c, lb:CAT_LABEL[c], n:wc[c] }))),
    'all', v => { M1.cat = v; renderWords(true); });

  const fc = countBy(PHRASES, 'f');
  buildChips($('funcs'),
    [{ id:'all', lb:'Todas', n:PHRASES.length }].concat(
      Object.keys(FUNC_LABEL).filter(f => fc[f]).sort((a,b) => fc[b]-fc[a]).map(f => ({ id:f, lb:FUNC_LABEL[f], n:fc[f] }))),
    'all', v => { M2.func = v; renderPhrases(true); });
  const tc = countBy(PHRASES, 't');
  buildChips($('tenses'),
    [{ id:'all', lb:'Todos', n:PHRASES.length }].concat(
      Object.keys(TENSE_LABEL).filter(t => tc[t]).sort((a,b) => tc[b]-tc[a]).map(t => ({ id:t, lb:TENSE_LABEL[t], n:tc[t] }))),
    'all', v => { M2.tense = v; renderPhrases(true); });

  let t1, t2;
  $('q1').addEventListener('input', e => {
    clearTimeout(t1); t1 = setTimeout(() => { M1.q = e.target.value; renderWords(true); }, 140);
  });
  $('q2').addEventListener('input', e => {
    clearTimeout(t2); t2 = setTimeout(() => { M2.q = e.target.value; renderPhrases(true); }, 140);
  });

  $('fav1').onclick = e => { M1.fav = !M1.fav; e.currentTarget.classList.toggle('on', M1.fav); renderWords(true); };
  $('fav2').onclick = e => { M2.fav = !M2.fav; e.currentTarget.classList.toggle('on', M2.fav); renderPhrases(true); };
  $('more1').onclick = () => { M1.shown += 200; renderWords(); };
  $('more2').onclick = () => { M2.shown += 150; renderPhrases(); };

  // Marcar / desmarcar · saltar a la pieza · guardar en el cuaderno
  document.addEventListener('click', e => {
    const fw = e.target.closest('[data-fw]');
    if(fw){
      const id = +fw.dataset.fw;
      const w = WORDS[id-1];
      UNDO.record((favW.has(id) ? 'Quitar ★ de ' : 'Marcar ★ ') + (w ? w.en : ''), ['eng_fav_w']);
      favW.has(id) ? favW.delete(id) : favW.add(id);
      saveFav(); renderWords();
      SRS.renderBoxes();
      toast(favW.has(id) ? '★ Añadida a tu práctica' : 'Quitada de tu práctica', null,
        { label:'↶ Deshacer', fn: () => { const e2 = UNDO.undo(); if(e2){ refreshAll(); toast('Deshecho', 'warn'); } } });
      return;
    }
    const fp = e.target.closest('[data-fp]');
    if(fp){
      const id = +fp.dataset.fp;
      UNDO.record((favP.has(id) ? 'Quitar ★ de frase #' : 'Marcar ★ frase #') + id, ['eng_fav_p']);
      favP.has(id) ? favP.delete(id) : favP.add(id);
      saveFav(); renderPhrases();
      SRS.renderBoxes();
      toast(favP.has(id) ? '★ Añadida a tu práctica' : 'Quitada de tu práctica', null,
        { label:'↶ Deshacer', fn: () => { const e2 = UNDO.undo(); if(e2){ refreshAll(); toast('Deshecho', 'warn'); } } });
      return;
    }
    const nbs = e.target.closest('[data-nb-en]');
    if(nbs){ NB.push(nbs.dataset.nbEn, nbs.dataset.nbEs); return; }
    const pz = e.target.closest('[data-pz]');
    if(pz){
      go('pz');
      setTimeout(() => {
        const map = { sust:0, verbo:1, adj:2, adv:3, pron:4, det:5, prep:6, modal:8, conj:9, expr:10, num:11 };
        const all = document.querySelectorAll('#pz .pz');
        const idx = { sust:0, verbo:1, adj:2, adv:3, pron:4, det:5, prep:6, aux:7, modal:8, conj:9, expr:10, num:11 }[pz.dataset.pz];
        const el = all[idx];
        if(el){ el.open = true; el.scrollIntoView({ behavior:'smooth', block:'center' }); }
      }, 90);
      return;
    }
    const gt = e.target.closest('[data-goto]');
    if(gt){
      go('p1');
      setTimeout(() => {
        M1.q = ''; $('q1').value = '';
        M1.band = 'all'; M1.cat = gt.dataset.goto; M1.fav = false;
        [...$('bands').children].forEach((c,i) => c.classList.toggle('on', i === 0));
        [...$('cats').children].forEach(c => c.classList.toggle('on', c.dataset.v === gt.dataset.goto));
        renderWords(true);
      }, 60);
      return;
    }
  });

  // Tabs
  document.querySelectorAll('.tab').forEach(b => {
    b.onclick = () => {
      NB.flush();
      document.querySelectorAll('.tab').forEach(x => x.classList.remove('on'));
      document.querySelectorAll('.pane').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      const pane = $(b.dataset.p);
      pane.classList.add('on');
      window.scrollTo({ top:0, behavior:'smooth' });
      LS.set('eng_tab', b.dataset.p);
      if(b.dataset.p === 'p1' && !elW().children.length) renderWords(true);
      if(b.dataset.p === 'p2' && !elP().children.length) renderPhrases(true);
      if(b.dataset.p === 'pr') SRS.start();
      if(b.dataset.p === 'nb') NB.render();
      if(b.dataset.p === 'pz' && !$('qzBox').children.length){ qzShuffle(); renderQuiz(); }
      if(b.dataset.p === 'bf' && !$('bfList').children.length) BF.render();
      /* Repaso del glosario al abrir. Varias pestañas se pintan aquí mismo
         (las listas, las bifurcaciones), así que marcarlas solo al arrancar
         dejaba sin marcar todo lo que aún no existía. Es idempotente: el cupo
         cuenta las marcas que ya hay, así que abrir diez veces no añade nada. */
      glAutoMarcar(pane, CUPO_GL);
      CTL.headerH(); setTimeout(CTL.apply, 60);   // la cabecera cambia de alto entre pestañas
    };
  });

  // Fuentes de práctica
  document.querySelectorAll('[data-src]').forEach(b => b.onclick = () => {
    document.querySelectorAll('[data-src]').forEach(x => x.classList.remove('on'));
    b.classList.add('on'); SRS.setCfg('src', b.dataset.src);
  });
  document.querySelectorAll('[data-dir]').forEach(b => b.onclick = () => {
    document.querySelectorAll('[data-dir]').forEach(x => x.classList.remove('on'));
    b.classList.add('on'); SRS.setCfg('dir', b.dataset.dir);
  });

  $('nbNew').onclick = () => NB.newBlank();

  // Aviso si el navegador rechaza una escritura por falta de espacio
  window.addEventListener("eng:quota", e => {
    toast("Sin espacio para guardar " + (e.detail && e.detail.key || "") + ". Exporta tus cuadernos.", "warn");
  });

  // Panel de sincronización
  if(window.SYNC){
    SYNC.onState((st) => {
      const b = $('syncBtn'); if(!b) return;
      const map = { off:['☁️','Sincronización desactivada — pulsa para activarla'],
                    loading:['⏳','Conectando…'], syncing:['🔄','Sincronizando…'],
                    ready:['✅','Todo al día en todos tus dispositivos'],
                    error:['⚠️','No se pudo sincronizar. Tus datos siguen guardados aquí.'] };
      const [ic, tt] = map[st] || map.off;
      b.textContent = ic; b.title = tt;
      b.classList.toggle('spin', st === 'syncing' || st === 'loading');
    });
    $('syncBtn').onclick = () => { renderSync(); $('syncModal').classList.add('on'); };
    $('syncModal').onclick = e => { if(e.target.id === 'syncModal') $('syncModal').classList.remove('on'); };
    $('syncClose').onclick = () => $('syncModal').classList.remove('on');
    // Intento silencioso: si ya hay sesión del Cerebro en este navegador, arranca solo
    SYNC.boot(true).then(() => { refreshAll(); });
  }

  // Deshacer con Ctrl+Z (fuera del editor, donde Ctrl+Z ya es el del texto)
  document.addEventListener('keydown', e => {
    if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !isTyping(e.target)){
      e.preventDefault();
      const u = UNDO.undo();
      if(u){ refreshAll(); toast('Deshecho: ' + u.label, 'warn'); }
      else toast('No hay nada que deshacer');
    }
    if(e.key === 'Escape'){ $('syncModal').classList.remove('on'); $('audioPop').classList.remove('on'); }
  });

  // Panel de voz
  $('audioBtn').onclick = e => { e.stopPropagation(); $('audioPop').classList.toggle('on'); };
  $('audioPop').onclick = e => e.stopPropagation();
  $('audioTest').onclick = () => TTS.say('This is how I sound. Listen carefully and repeat.');
  document.addEventListener('click', () => $('audioPop').classList.remove('on'));

  // Buscador global
  $('omniIn').addEventListener('input', e => Omni.search(e.target.value));
  $('omni').addEventListener('click', e => { if(e.target.id === 'omni') Omni.close(); });
  $('omniBtn').onclick = () => Omni.open();

  document.addEventListener('keydown', e => {
    if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k'){ e.preventDefault(); Omni.open(); return; }
    if(e.key === '/' && !isTyping(e.target)){ e.preventDefault(); Omni.open(); return; }
    Omni.key(e);
    SRS.key(e);
  });

  // Barra de progreso de lectura
  const bar = $('readbar');
  window.addEventListener('scroll', () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
  }, { passive:true });

  CTL.headerH();
  window.addEventListener('resize', CTL.headerH);
  CTL.wire('ctl1'); CTL.wire('ctl2');

  Streak.render();
  renderWords(true);
  renderPhrases(true);
  qzShuffle(); renderQuiz();
  BF.render(); BF.wire();
  PZ.render(); LAB.render(); RG.render();
  WR.wire();
  CLUB.init();
  SONG.init((k, d) => store.get(k, d), (k, v) => store.set(k, v));
  sanearFavs();
  /* Antes solo se recorrian tres pestañas, asi que fichas como «pasado simple»
     o «irregular» — que viven en Palabras, Frases y Bifurcaciones — no se
     marcaban nunca: existian y no habia forma de llegar a ellas. Medido, el
     documento entero cuesta unos 60 ms una sola vez, y las filas de datos
     quedan fuera por GL_NO. */
  ['p0','pz','p3','p1','p2','bf','wr','cf'].forEach(id => { const p = $(id); if(p) glAutoMarcar(p, CUPO_GL); });
  SRS.renderBoxes();
  NB.render();

  const lastTab = LS.get('eng_tab');
  if(lastTab && $(lastTab)) go(lastTab);
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', init)
  : init();

return { WORDS, PHRASES, BUSCA, TTS, NB, SRS, Omni, go, toast, refreshAll, UNDO, CTL, BF, PZ, LAB, RG, GL, GLOSARIO, PIEZAS, REGLAS, glAutoMarcar, sanearFavs, WR, ANL, LEX, DIC, RECURSOS, SUG, CADENA, ES, MORFO, MARC, CLUB, SONG };
})();

// Mismo motivo que en SYNC: sin esto, window.APP no existe y SYNC no puede repintar.
window.APP = APP;
