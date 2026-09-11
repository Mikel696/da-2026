
/* ══════════════════════════════════════════════════════════════
   BIFURCACIONES · una palabra tuya, varias suyas
   ──────────────────────────────────────────────────────────────
   q  = la palabra española que se bifurca
   r  = ramas: w palabra inglesa · j su oficio · t test de 3 seg · c color
   x  = la trampa que te tiende el español
   e  = ejercicios: es español · en inglés con _ donde va el hueco ·
        ok respuesta · w por qué · o opciones (si no, se usan las ramas)
════════════════════════════════════════════════════════════════ */
const BIFUR = [

{ q:'QUE', sub:'Una sola palabra tuya que en inglés se parte en cuatro. Es la que más errores causa, y la que más rápido se arregla.',
  r:[
    {w:'THAT', j:'Conecta 2 ideas', c:'suj', t:'Va después de un verbo de cabeza: <b>know, think, say, believe</b>. De hecho casi siempre puedes quitarlo y la frase sigue bien.'},
    {w:'WHAT', j:'Pregunta, o "lo que"', c:'wh',  t:'Si abre una pregunta, o si en español puedes decir <b>"lo que"</b> — es WHAT.'},
    {w:'TO',   j:'Une 2 verbos', c:'ver', t:'Si justo después viene <b>otro verbo</b>, el puente siempre es TO.'},
    {w:'THAN', j:'Compara', c:'com', t:'Si antes hay un comparativo (<b>more, better, bigger, less</b>) — es THAN.'}
  ],
  x:{no:'I need that buy eggs', si:'I need <b>to</b> buy eggs', why:'En español "necesito <b>comprar</b>" no lleva nada en medio, pero el inglés exige el puente TO entre dos verbos. Es el error número uno.'},
  e:[
    {es:'Necesito comprar huevos', en:'I need _ buy eggs', ok:'TO', w:'Dos verbos pegados: <b>need</b> + <b>buy</b>. Entre verbos, siempre TO.'},
    {es:'¿Qué necesitas?', en:'_ do you need?', ok:'WHAT', w:'Abre una pregunta, así que es WHAT. Y fíjate que detrás va el molde completo: WH + auxiliar + sujeto + verbo.'},
    {es:'Ella sabe que estoy bien', en:'She knows _ I\'m good', ok:'THAT', w:'Después de <b>knows</b> viene una idea completa. Dato: aquí THAT es opcional — «She knows I\'m good» también es correcto.'},
    {es:'Esto es mejor que eso', en:'This is better _ that', ok:'THAN', w:'Hay un comparativo (<b>better</b>) delante, así que toca THAN. Ojo con la trampa visual: <i>than</i> compara, <i>that</i> señala.'},
    {es:'No sé qué decir', en:'I don\'t know _ to say', ok:'WHAT', w:'Aquí "qué" es <b>"lo que"</b>, no una pregunta — pero igual se traduce WHAT.'}
  ]},

{ q:'NO', sub:'Tu "no" es siempre el mismo. El inglés cambia de palabra según CUÁNDO pasa y QUIÉN lo hace.',
  r:[
    {w:"DON'T",   j:'No + ahora', c:'aux', t:'Presente con <b>I, you, we, they</b>.'},
    {w:"DOESN'T", j:'No + ahora (él/ella)', c:'neg', t:'Presente con <b>he, she, it</b>. Aquí se muda la -s.'},
    {w:"DIDN'T",  j:'No + ayer', c:'ver', t:'Cualquier pasado, para todas las personas. El verbo detrás va desnudo.'},
    {w:"WON'T",   j:'No + mañana', c:'com', t:'Futuro. Es <b>will not</b> apretado.'}
  ],
  x:{no:"She don't work here", si:"She <b>doesn't</b> work here", why:'Con <b>he/she/it</b> la -s no desaparece: <b>se muda al auxiliar</b>. Y una vez que está en el auxiliar, el verbo se queda desnudo — nunca «doesn\'t works».'},
  e:[
    {es:'Yo no bebo cerveza', en:'I _ drink beer', ok:"DON'T", w:'Presente y el sujeto es <b>I</b>.'},
    {es:'Ella no bebe cerveza', en:'She _ drink beer', ok:"DOESN'T", w:'Misma frase, pero el sujeto es <b>She</b>. La -s se fue al auxiliar y <b>drink</b> quedó desnudo.'},
    {es:'Yo no estudié ayer', en:'I _ study yesterday', ok:"DIDN'T", w:'Pasado. Fíjate que se dice <b>study</b>, no <i>studied</i>: el DIDN\'T ya carga el pasado.'},
    {es:'Yo no trabajaré mañana', en:'I _ work tomorrow', ok:"WON'T", w:'Futuro. <b>won\'t</b> = will not.'},
    {es:'Él no vino a la reunión', en:'He _ come to the meeting', ok:"DIDN'T", w:'Aunque el sujeto sea <b>He</b>, en pasado siempre es DIDN\'T — no existe «doesn\'t» en pasado.'}
  ]},

{ q:'POR / PARA', sub:'Dos palabras tuyas que se reparten entre cuatro suyas. Aquí traducir palabra por palabra no funciona nunca.',
  r:[
    {w:'FOR',        j:'Para quién · cuánto tiempo', c:'com', t:'Responde <b>¿para quién?</b> o <b>¿durante cuánto?</b>'},
    {w:'TO',         j:'Hacia dónde · para + verbo', c:'ver', t:'Si le sigue un <b>verbo</b> o un <b>destino</b>.'},
    {w:'BY',         j:'Cómo · quién lo hizo', c:'aux', t:'El medio o el autor: <b>by bus, by Shakespeare</b>.'},
    {w:'BECAUSE OF', j:'Por culpa de', c:'neg', t:'Si hay un <b>culpable</b> de algo.'}
  ],
  x:{no:'I came for help you', si:'I came <b>to</b> help you', why:'"Para + verbo" es <b>TO</b>, no FOR. FOR se usa con cosas y personas, no con acciones.'},
  e:[
    {es:'Esto es para ti', en:'This is _ you', ok:'FOR', w:'Responde ¿para quién? → FOR.'},
    {es:'Vine para ayudarte', en:'I came _ help you', ok:'TO', w:'"Para + verbo" siempre es TO. Aquí <b>help</b> es un verbo.'},
    {es:'Llego tarde por el tráfico', en:'I\'m late _ the traffic', ok:'BECAUSE OF', w:'El tráfico es el culpable. Ojo: <b>because of</b> + cosa · <b>because</b> + frase completa.'},
    {es:'Voy en bus', en:'I go _ bus', ok:'BY', w:'El medio de transporte va con BY, y sin artículo: <b>by bus</b>, no «by the bus».'},
    {es:'Trabajé por dos horas', en:'I worked _ two hours', ok:'FOR', w:'Duración → FOR. Si fuera un punto de inicio sería <i>since</i>.'}
  ]},

{ q:'HACER', sub:'Un verbo tuyo, dos suyos. La regla es de una línea y no falla nunca.',
  r:[
    {w:'DO',   j:'Ejecutar algo que ya existe', c:'ver', t:'La tarea ya existía y tú solo la haces: <b>do the work, do homework, do the dishes</b>.'},
    {w:'MAKE', j:'Crear algo que no existía', c:'com', t:'Al terminar hay algo <b>nuevo</b> que antes no estaba: <b>make dinner, make a decision, make money</b>.'}
  ],
  x:{no:'I have to do a decision', si:'I have to <b>make</b> a decision', why:'Antes de decidir la decisión no existía; después sí. Eso la vuelve MAKE. La tarea, en cambio, ya estaba puesta: esa es DO.'},
  e:[
    {es:'Tengo que hacer la tarea', en:'I have to _ my homework', ok:'DO', w:'La tarea ya te la asignaron. No creas nada nuevo, la ejecutas.'},
    {es:'Necesito tomar una decisión', en:'I need to _ a decision', ok:'MAKE', w:'La decisión no existía. La estás creando.'},
    {es:'Voy a hacer la cena', en:'I\'m going to _ dinner', ok:'MAKE', w:'Antes no había cena; después sí. Algo nuevo → MAKE.'},
    {es:'Ella hace ejercicio todos los días', en:'She _es exercise every day', ok:'DO', w:'La expresión fija es <b>do exercise</b>. Es una actividad, no una creación.'},
    {es:'Cometí un error', en:'I _ a mistake', ok:'MADE', o:['MADE','DID'], w:'En inglés los errores se <b>fabrican</b>: <b>make a mistake</b>. Aquí en pasado: made.'}
  ]},

{ q:'DECIR', sub:'La diferencia se decide con una sola pregunta: ¿nombras a la persona justo después?',
  r:[
    {w:'SAY',  j:'Decir algo', c:'ver', t:'No nombras a quién. <b>Say something.</b>'},
    {w:'TELL', j:'Decirle a alguien', c:'suj', t:'Justo detrás va <b>la persona</b>: tell <b>me</b>, tell <b>him</b>.'}
  ],
  x:{no:'He said me the truth', si:'He <b>told</b> me the truth', why:'Si aparece la persona pegada detrás, es TELL. Para usar SAY con persona hay que meter <i>to</i>: «He said it <b>to me</b>».'},
  e:[
    {es:'Dime la verdad', en:'_ me the truth', ok:'TELL', w:'Viene <b>me</b> justo detrás → TELL.'},
    {es:'¿Qué dijiste?', en:'What did you _ ?', ok:'SAY', w:'No hay persona detrás → SAY.'},
    {es:'No le digas a nadie', en:'Don\'t _ anyone', ok:'TELL', w:'<b>anyone</b> es la persona → TELL.'},
    {es:'Él dijo que estaba bien', en:'He _ it was fine', ok:'SAID', o:['SAID','TOLD'], w:'Detrás viene una idea, no una persona → SAID (pasado de say).'},
    {es:'Cuéntame qué pasó', en:'_ me what happened', ok:'TELL', w:'<b>me</b> detrás → TELL. Y fíjate: <i>what happened</i> sin auxiliar, porque no es pregunta directa.'}
  ]},

{ q:'ESPERAR', sub:'Tres cosas muy distintas comparten una palabra en español. En inglés se separan y la confusión desaparece.',
  r:[
    {w:'WAIT',   j:'Esperar de pie, que pase el tiempo', c:'ver', t:'Si estás <b>parado esperando</b>. Siempre <b>wait FOR</b> alguien.'},
    {w:'HOPE',   j:'Ojalá, deseo que pase', c:'com', t:'Si es un <b>deseo</b> y no sabes si se cumplirá.'},
    {w:'EXPECT', j:'Dar por hecho que pasará', c:'aux', t:'Si lo <b>das por seguro</b> o lo tienes previsto.'}
  ],
  x:{no:'I\'m waiting the bus', si:'I\'m waiting <b>for</b> the bus', why:'<b>wait</b> exige <b>for</b> siempre. Y no confundas: esperar un bus es WAIT, esperar que llegue pronto es HOPE.'},
  e:[
    {es:'Te estoy esperando', en:'I\'m _ing for you', ok:'WAIT', w:'Estás ahí parado → WAIT, y con FOR obligatorio.'},
    {es:'Espero que estés bien', en:'I _ you\'re well', ok:'HOPE', w:'Es un deseo, no sabes si se cumple → HOPE.'},
    {es:'Espero respuesta hoy', en:'I _ a reply today', ok:'EXPECT', w:'Lo das por hecho, está previsto → EXPECT.'},
    {es:'Espera un momento', en:'_ a moment', ok:'WAIT', w:'Detener el tiempo → WAIT. Sin FOR porque no hay persona.'}
  ]},

{ q:'VER / MIRAR', sub:'El español ya los separa un poco. El inglés los separa del todo, y añade un tercero.',
  r:[
    {w:'SEE',   j:'Ver sin querer', c:'suj', t:'Te entra por los ojos <b>sin que lo busques</b>. También significa <b>entender</b>.'},
    {w:'LOOK',  j:'Dirigir la mirada', c:'ver', t:'Giras la cabeza a propósito. Siempre <b>look AT</b>.'},
    {w:'WATCH', j:'Ver algo que se mueve', c:'com', t:'Algo que <b>dura y cambia</b>: TV, una película, un partido.'}
  ],
  x:{no:'I\'m looking a movie', si:'I\'m <b>watching</b> a movie', why:'Una película dura y se mueve → WATCH. LOOK es solo girar la mirada un instante, y siempre lleva AT.'},
  e:[
    {es:'Mira esto', en:'_ at this', ok:'LOOK', w:'Diriges la mirada a propósito → LOOK, con AT pegado.'},
    {es:'Veo películas de noche', en:'I _ movies at night', ok:'WATCH', w:'Algo que dura y se mueve → WATCH.'},
    {es:'Lo vi ayer en la calle', en:'I _ him on the street yesterday', ok:'SAW', o:['SAW','LOOKED','WATCHED'], w:'No lo buscabas, te lo topaste → SEE (pasado: saw).'},
    {es:'Ya entiendo', en:'I _', ok:'SEE', w:'<b>I see</b> = ya entiendo. Uno de los usos más comunes y menos enseñados.'}
  ]},

{ q:'MUY / MUCHO', sub:'Se eligen por lo que viene DETRÁS, no por lo que quieres decir.',
  r:[
    {w:'VERY',    j:'Muy + adjetivo', c:'com', t:'Detrás va un <b>adjetivo</b>: very good, very tired.'},
    {w:'MUCH',    j:'Mucho de algo que no se cuenta', c:'aux', t:'Detrás va algo <b>incontable</b>: much time, much money.'},
    {w:'MANY',    j:'Muchos que sí se cuentan', c:'ver', t:'Detrás va un <b>plural contable</b>: many people, many times.'},
    {w:'A LOT OF',j:'Mucho, para todo', c:'suj', t:'El comodín en frases afirmativas: sirve para contables e incontables.'}
  ],
  x:{no:'I have very hunger', si:'I\'m <b>very hungry</b>', why:'VERY solo va con adjetivos. Y ojo: el hambre en inglés no se tiene, <b>se es</b> — I\'m hungry.'},
  e:[
    {es:'Es muy importante', en:'It\'s _ important', ok:'VERY', w:'<b>important</b> es adjetivo → VERY.'},
    {es:'¿Cuánto tiempo?', en:'How _ time?', ok:'MUCH', w:'<b>time</b> es incontable → MUCH.'},
    {es:'¿Cuántas personas vinieron?', en:'How _ people came?', ok:'MANY', w:'<b>people</b> se cuenta → MANY.'},
    {es:'Tengo mucho trabajo', en:'I have _ work', ok:'A LOT OF', w:'En afirmativo el natural es <b>a lot of</b>. «much work» suena a libro de texto.'}
  ]},

{ q:'YA / TODAVÍA', sub:'Tres palabras inglesas que se eligen por el tipo de frase: afirmativa, negativa o pregunta.',
  r:[
    {w:'ALREADY', j:'Ya, antes de lo esperado', c:'ver', t:'Solo en <b>afirmativas</b>. Va en medio de la frase.'},
    {w:'YET',     j:'Todavía no · ¿ya?', c:'neg', t:'Solo en <b>negativas y preguntas</b>, y siempre <b>al final</b>.'},
    {w:'STILL',   j:'Todavía, sigue pasando', c:'aux', t:'La acción <b>continúa</b>. Va antes del verbo.'}
  ],
  x:{no:'I have finished already the work yet', si:'I\'ve <b>already</b> finished the work', why:'ALREADY y YET no conviven. Regla corta: afirmativa → already (en medio) · negativa o pregunta → yet (al final).'},
  e:[
    {es:'Ya terminé', en:'I\'ve _ finished', ok:'ALREADY', w:'Afirmativa → ALREADY, y va en medio.'},
    {es:'Todavía no termino', en:'I haven\'t finished _', ok:'YET', w:'Negativa → YET, y siempre al final.'},
    {es:'Todavía estoy trabajando', en:'I\'m _ working', ok:'STILL', w:'La acción sigue en curso → STILL, antes del verbo.'},
    {es:'¿Ya comiste?', en:'Have you eaten _ ?', ok:'YET', w:'Pregunta → YET, al final.'}
  ]},

{ q:'EN', sub:'Tu "en" cubre tres tamaños distintos. El inglés los separa: de lo grande a lo pequeño.',
  r:[
    {w:'IN', j:'Grande · dentro de', c:'suj', t:'Países, ciudades, meses, años, espacios cerrados.'},
    {w:'ON', j:'Mediano · sobre', c:'ver', t:'Superficies, días y fechas.'},
    {w:'AT', j:'Pequeño · punto exacto', c:'com', t:'Horas exactas y puntos concretos: at home, at work.'}
  ],
  x:{no:'I\'ll see you in Monday at March', si:'I\'ll see you <b>on</b> Monday <b>in</b> March', why:'La escalera es fija: <b>at</b> una hora → <b>on</b> un día → <b>in</b> un mes. De lo pequeño a lo grande, siempre.'},
  e:[
    {es:'Nos vemos a las ocho', en:'See you _ eight', ok:'AT', w:'Hora exacta → AT, el más pequeño.'},
    {es:'Nos vemos el lunes', en:'See you _ Monday', ok:'ON', w:'Un día → ON.'},
    {es:'Nos vemos en marzo', en:'See you _ March', ok:'IN', w:'Un mes → IN, el más grande.'},
    {es:'El libro está sobre la mesa', en:'The book is _ the table', ok:'ON', w:'Superficie → ON.'},
    {es:'Estoy en casa', en:'I\'m _ home', ok:'AT', w:'<b>at home</b> es expresión fija: se ve como un punto, no como un espacio.'}
  ]},

{ q:'SER / ESTAR', sub:'Aquí es al revés: dos palabras tuyas se funden en UNA sola suya. Esta bifurcación te regala trabajo.',
  r:[
    {w:'BE', j:'Ser y estar, todo junto', c:'aux', t:'Una sola palabra para las dos. Lo que cambia es la <b>forma</b>: am, is, are, was, were.'}
  ],
  x:{no:'I have 25 years / I have hungry', si:'I\'<b>m</b> 25 · I\'<b>m</b> hungry', why:'Edad, hambre, frío, calor y miedo en inglés <b>no se tienen: se son</b>. Todos van con BE, no con HAVE. Es el error más delator del hispanohablante.'},
  e:[
    {es:'Tengo 25 años', en:'I _ 25', ok:'AM', o:['AM','HAVE'], w:'La edad es un estado → BE. Nunca «I have 25 years».'},
    {es:'Tengo hambre', en:'I _ hungry', ok:'AM', o:['AM','HAVE'], w:'El hambre también es un estado → I\'m hungry.'},
    {es:'Hace frío hoy', en:'It _ cold today', ok:'IS', o:['IS','HAS','MAKES'], w:'El clima va con BE y con el sujeto de relleno <b>it</b>.'},
    {es:'Ella es ingeniera', en:'She _ an engineer', ok:'IS', o:['IS','ARE','AM'], w:'Y las profesiones llevan <b>an</b>: nunca «She is engineer».'}
  ]},

{ q:'SABER / CONOCER', sub:'Otra que te regala trabajo: dos verbos tuyos, uno solo suyo.',
  r:[
    {w:'KNOW', j:'Saber y conocer, todo junto', c:'ver', t:'Una sola palabra. Si quieres marcar "conocer por primera vez", ahí sí cambia a <b>meet</b>.'}
  ],
  x:{no:'I know her yesterday', si:'I <b>met</b> her yesterday', why:'<b>know</b> es tener el conocimiento; <b>meet</b> es el momento de conocer a alguien. Confundirlos cambia el sentido por completo.'},
  e:[
    {es:'No sé', en:'I don\'t _', ok:'KNOW', w:'Saber → KNOW.'},
    {es:'¿Conoces a María?', en:'Do you _ María?', ok:'KNOW', w:'Conocer a alguien que ya conoces → KNOW.'},
    {es:'La conocí el año pasado', en:'I _ her last year', ok:'MET', o:['MET','KNEW'], w:'El momento en que la conociste → MEET (pasado: met).'}
  ]}

];
