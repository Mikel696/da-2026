
BIFUR.push(

{ q:'PEDIR / PREGUNTAR', sub:'Una sola palabra inglesa, pero con o sin una preposición que lo cambia todo.',
  r:[
    {w:'ASK',     j:'Preguntar algo', c:'ver', t:'Buscas <b>información</b>. Ask a question, ask me.'},
    {w:'ASK FOR', j:'Pedir una cosa', c:'com', t:'Buscas que te <b>den algo</b>. Ask for help, ask for the bill.'}
  ],
  x:{no:'I asked the bill', si:'I asked <b>for</b> the bill', why:'Sin FOR estás preguntándole algo a la cuenta. Con FOR la estás pidiendo. Esa palabrita cambia el verbo entero.'},
  e:[
    {es:'¿Te puedo preguntar algo?', en:'Can I _ you something?', ok:'ASK', w:'Buscas información → ASK, sin FOR.'},
    {es:'Pide ayuda', en:'_ help', ok:'ASK FOR', w:'Quieres que te den algo → ASK FOR.'},
    {es:'Me pidió el número', en:'He _ my number', ok:'ASKED FOR', o:['ASKED FOR','ASKED'], w:'Quería que se lo dieras → ASK FOR (pasado: asked for).'}
  ]},

{ q:'LLEVAR / TRAER', sub:'Se elige por la dirección: ¿hacia dónde va la cosa respecto de ti?',
  r:[
    {w:'TAKE',  j:'Llevar de aquí hacia allá', c:'ver', t:'La cosa <b>se aleja</b> de donde estás.'},
    {w:'BRING', j:'Traer de allá hacia aquí', c:'suj', t:'La cosa <b>viene</b> hacia donde estás.'},
    {w:'WEAR',  j:'Llevar puesto', c:'com', t:'Si es <b>ropa sobre el cuerpo</b>.'},
    {w:'CARRY', j:'Cargar con las manos', c:'aux', t:'El <b>peso físico</b> de sostener algo.'}
  ],
  x:{no:'I\'m using a blue shirt', si:'I\'m <b>wearing</b> a blue shirt', why:'La ropa no se "usa" en inglés, <b>se lleva puesta</b>: WEAR. USE es para herramientas y objetos.'},
  e:[
    {es:'Trae tu portátil', en:'_ your laptop', ok:'BRING', w:'Que venga hacia donde yo estoy → BRING.'},
    {es:'Llévate esto', en:'_ this with you', ok:'TAKE', w:'Que se aleje de aquí → TAKE.'},
    {es:'Lleva una camisa azul', en:'He\'s _ing a blue shirt', ok:'WEAR', w:'Ropa puesta → WEAR.'},
    {es:'Déjame cargar eso', en:'Let me _ that', ok:'CARRY', w:'Peso físico en las manos → CARRY.'}
  ]},

{ q:'HAY', sub:'Tu "hay" no tiene sujeto. El inglés no lo permite, así que inventa uno.',
  r:[
    {w:'THERE IS',  j:'Hay + una cosa', c:'suj', t:'Singular o incontable.'},
    {w:'THERE ARE', j:'Hay + varias cosas', c:'ver', t:'Plural.'}
  ],
  x:{no:'Have a problem / Is a problem', si:'<b>There is</b> a problem', why:'"Hay" no es <i>have</i> ni <i>is</i> a secas. El inglés exige sujeto, y para esto usa el relleno <b>there</b>.'},
  e:[
    {es:'Hay un problema', en:'_ a problem', ok:'THERE IS', w:'Una sola cosa → THERE IS.'},
    {es:'Hay dos opciones', en:'_ two options', ok:'THERE ARE', w:'Plural → THERE ARE.'},
    {es:'No hay tiempo', en:'_ no time', ok:'THERE IS', w:'<b>time</b> es incontable → THERE IS.'},
    {es:'Había mucha gente', en:'_ a lot of people', ok:'THERE WERE', o:['THERE WERE','THERE WAS'], w:'<b>people</b> ya es plural, y en pasado → THERE WERE.'}
  ]},

{ q:'DESDE / HACE', sub:'Las tres marcan tiempo, pero cada una responde una pregunta distinta.',
  r:[
    {w:'SINCE', j:'Desde un punto', c:'suj', t:'Le sigue <b>cuándo empezó</b>: since 2020, since Monday.'},
    {w:'FOR',   j:'Durante cuánto', c:'com', t:'Le sigue una <b>duración</b>: for two years, for a while.'},
    {w:'AGO',   j:'Hace tanto tiempo', c:'ver', t:'Va <b>después</b> del tiempo y pide pasado: two days ago.'}
  ],
  x:{no:'I work here since two years', si:'I\'ve worked here <b>for</b> two years', why:'Dos años es una <b>duración</b> → FOR. SINCE necesita un punto en el calendario. Y ojo: esto pide <b>have worked</b>, no <i>work</i>.'},
  e:[
    {es:'Trabajo aquí desde 2023', en:'I\'ve worked here _ 2023', ok:'SINCE', w:'2023 es un punto exacto → SINCE.'},
    {es:'Trabajo aquí hace tres años', en:'I\'ve worked here _ three years', ok:'FOR', w:'Tres años es duración → FOR.'},
    {es:'Te llamé hace una hora', en:'I called you an hour _', ok:'AGO', w:'AGO va DETRÁS del tiempo, nunca delante. Y pide pasado simple.'}
  ]},

{ q:'TAMBIÉN / TAMPOCO', sub:'Se eligen según si la frase es positiva o negativa. Y cambian de sitio.',
  r:[
    {w:'TOO',     j:'También, al final', c:'com', t:'Frase <b>positiva</b>, y va al final.'},
    {w:'ALSO',    j:'También, en medio', c:'ver', t:'Frase positiva, pero <b>en medio</b> de la frase.'},
    {w:'EITHER',  j:'Tampoco, al final', c:'neg', t:'Frase <b>negativa</b>, al final.'},
    {w:'NEITHER', j:'Yo tampoco (respuesta)', c:'aux', t:'Respuesta corta a algo negativo: <b>Neither do I</b>.'}
  ],
  x:{no:'I don\'t like it too', si:'I don\'t like it <b>either</b>', why:'En frase negativa nunca va TOO. La pareja es: positiva → <b>too</b> · negativa → <b>either</b>.'},
  e:[
    {es:'Yo también voy', en:'I\'m going _', ok:'TOO', w:'Positiva y al final → TOO.'},
    {es:'También hablo francés', en:'I _ speak French', ok:'ALSO', w:'Positiva pero en medio → ALSO.'},
    {es:'A mí tampoco me gusta', en:'I don\'t like it _', ok:'EITHER', w:'Negativa → EITHER.'},
    {es:'— Yo tampoco', en:'_ do I', ok:'NEITHER', w:'Respuesta corta a algo negativo → NEITHER + auxiliar + sujeto.'}
  ]},

{ q:'CUÁNTO', sub:'Tu "cuánto" pregunta cuatro cosas distintas. El inglés las separa todas.',
  r:[
    {w:'HOW MUCH',  j:'Cuánto de algo incontable', c:'suj', t:'Dinero, tiempo, agua. También <b>precio</b>.'},
    {w:'HOW MANY',  j:'Cuántos que se cuentan', c:'ver', t:'Personas, veces, cosas en plural.'},
    {w:'HOW LONG',  j:'Cuánto tiempo dura', c:'com', t:'Duración de algo.'},
    {w:'HOW OFTEN', j:'Cada cuánto', c:'aux', t:'Frecuencia con que pasa.'}
  ],
  x:{no:'How much people came?', si:'<b>How many</b> people came?', why:'<b>people</b> se cuenta uno por uno → HOW MANY. La prueba: si puedes ponerle un número delante, es MANY.'},
  e:[
    {es:'¿Cuánto cuesta?', en:'_ is it?', ok:'HOW MUCH', w:'El precio siempre va con HOW MUCH.'},
    {es:'¿Cuántas personas vienen?', en:'_ people are coming?', ok:'HOW MANY', w:'Se cuentan → HOW MANY.'},
    {es:'¿Cuánto se demora?', en:'_ does it take?', ok:'HOW LONG', w:'Duración → HOW LONG.'},
    {es:'¿Cada cuánto entrenas?', en:'_ do you train?', ok:'HOW OFTEN', w:'Frecuencia → HOW OFTEN.'}
  ]},

{ q:'COMO', sub:'Tres significados muy distintos escondidos bajo la misma palabra.',
  r:[
    {w:'LIKE', j:'Parecido a', c:'com', t:'Si puedes decir <b>"parecido a"</b>.'},
    {w:'AS',   j:'En calidad de', c:'suj', t:'Si es un <b>rol o función</b> real: I work as a designer.'},
    {w:'HOW',  j:'De qué manera', c:'wh',  t:'Si es una <b>pregunta</b> o "de qué modo".'}
  ],
  x:{no:'I work like a designer', si:'I work <b>as</b> a designer', why:'Con LIKE dices que <i>te pareces</i> a un diseñador sin serlo. Con AS dices que lo <b>eres</b>. Cambia el sentido por completo.'},
  e:[
    {es:'Trabajo como diseñador', en:'I work _ a designer', ok:'AS', w:'Es tu rol real → AS.'},
    {es:'Sabe como su mamá', en:'It tastes _ his mom\'s', ok:'LIKE', w:'Parecido a → LIKE.'},
    {es:'¿Cómo se dice esto?', en:'_ do you say this?', ok:'HOW', w:'Pregunta de manera → HOW.'}
  ]},

{ q:'TOMAR', sub:'Uno de los verbos más traicioneros: en inglés depende de QUÉ tomas.',
  r:[
    {w:'TAKE',  j:'Tomar transporte, tiempo, decisiones', c:'ver', t:'take a bus, take time, take a break.'},
    {w:'DRINK', j:'Tomar líquido', c:'com', t:'Solo si <b>se bebe</b>.'},
    {w:'HAVE',  j:'Tomar comida o bebida (social)', c:'suj', t:'Lo natural al pedir: have a coffee, have lunch.'}
  ],
  x:{no:'I take a coffee every morning', si:'I <b>have</b> a coffee every morning', why:'TAKE a coffee suena a que lo agarras y te lo llevas. Para consumirlo, lo natural es <b>have</b> — o <b>drink</b> si quieres marcar el acto de beber.'},
  e:[
    {es:'Tomo el bus al trabajo', en:'I _ the bus to work', ok:'TAKE', w:'Transporte → TAKE.'},
    {es:'No tomo alcohol', en:'I don\'t _ alcohol', ok:'DRINK', w:'Líquido, marcando el hábito → DRINK.'},
    {es:'¿Tomamos un café?', en:'Shall we _ a coffee?', ok:'HAVE', w:'Consumo social → HAVE. Es lo que dice un nativo.'},
    {es:'Tomemos un descanso', en:'Let\'s _ a break', ok:'TAKE', w:'<b>take a break</b> es expresión fija.'}
  ]},

{ q:'PONER', sub:'Se decide por lo que pones y dónde: la preposición hace todo el trabajo.',
  r:[
    {w:'PUT',     j:'Colocar en un sitio', c:'ver', t:'Poner algo <b>en algún lugar</b>.'},
    {w:'PUT ON',  j:'Ponerse ropa', c:'com', t:'Ropa <b>sobre el cuerpo</b>.'},
    {w:'TURN ON', j:'Encender un aparato', c:'aux', t:'Luz, televisor, música: algo que <b>se enciende</b>.'}
  ],
  x:{no:'Put the light', si:'<b>Turn on</b> the light', why:'La luz no se coloca, <b>se enciende</b>. Y recuerda la regla del pronombre: <b>turn it on</b>, nunca «turn on it».'},
  e:[
    {es:'Ponlo en la mesa', en:'_ it on the table', ok:'PUT', w:'Colocar en un sitio → PUT.'},
    {es:'Ponte la chaqueta', en:'_ your jacket', ok:'PUT ON', w:'Ropa → PUT ON.'},
    {es:'Prende la luz', en:'_ the light', ok:'TURN ON', w:'Aparato → TURN ON.'},
    {es:'Préndelo', en:'Turn _ on', ok:'IT', o:['IT','ON IT'], w:'Con pronombre va OBLIGATORIAMENTE en medio: <b>turn it on</b>.'}
  ]},

{ q:'DE', sub:'Tu "de" es un comodín. El inglés lo reparte en cuatro según qué relación exprese.',
  r:[
    {w:'OF',    j:'De, parte de algo', c:'suj', t:'Relación entre <b>cosas</b>: the end of the movie.'},
    {w:'FROM',  j:'De, procedencia', c:'ver', t:'De dónde <b>viene</b>: I\'m from Colombia.'},
    {w:'ABOUT', j:'De, acerca de', c:'com', t:'El <b>tema</b> del que se habla.'},
    {w:"'S",    j:'De, posesión de persona', c:'aux', t:'Dueño primero: <b>my brother\'s car</b>.'}
  ],
  x:{no:'The car of my brother', si:'My <b>brother\'s</b> car', why:'Con personas la posesión se invierte: dueño + \'s + cosa. El <i>of</i> queda para cosas.'},
  e:[
    {es:'Soy de Colombia', en:'I\'m _ Colombia', ok:'FROM', w:'Procedencia → FROM.'},
    {es:'El final de la película', en:'The end _ the movie', ok:'OF', w:'Relación entre cosas → OF.'},
    {es:'Cuéntame de eso', en:'Tell me _ it', ok:'ABOUT', w:'El tema → ABOUT.'},
    {es:'El carro de mi hermano', en:'My brother_ car', ok:"'S", w:'Persona dueña → \'s, y va antes de la cosa.'}
  ]},

{ q:'SI', sub:'Dos "si" distintos que en español suenan igual. Uno de ellos tiene una regla que casi nadie enseña.',
  r:[
    {w:'IF',      j:'Si pasa esto, entonces...', c:'ver', t:'Condición real. <b>Detrás nunca va will.</b>'},
    {w:'WHETHER', j:'Si sí o si no', c:'com', t:'Cuando hay <b>dos opciones</b>: whether or not.'}
  ],
  x:{no:'I\'ll call you if I will arrive', si:'I\'ll call you <b>if I arrive</b>', why:'Después de <b>if</b> y de <b>when</b> el futuro se escribe en presente. El <i>will</i> se queda en la otra mitad de la frase.'},
  e:[
    {es:'Si llueve, me quedo', en:'_ it rains, I\'ll stay', ok:'IF', w:'Condición → IF, y con presente detrás aunque hables del futuro.'},
    {es:'No sé si ir', en:'I don\'t know _ to go', ok:'WHETHER', w:'Dos opciones (ir o no) → WHETHER, y admite <i>to</i> detrás.'},
    {es:'Te llamo cuando llegue', en:'I\'ll call you when I _', ok:'ARRIVE', o:['ARRIVE','WILL ARRIVE'], w:'Después de <b>when</b>, presente. Nunca «when I will arrive».'}
  ]},

{ q:'QUEDAR', sub:'Uno de los verbos más resbalosos del español. En inglés son cuatro cosas sin relación.',
  r:[
    {w:'STAY',      j:'Quedarse en un sitio', c:'ver', t:'Permanecer donde estás.'},
    {w:'FIT',       j:'Quedar de talla', c:'com', t:'Si es cuestión de <b>tamaño</b>.'},
    {w:'BE LEFT',   j:'Quedar de sobra', c:'aux', t:'Lo que <b>sobra</b>: there\'s none left.'},
    {w:'MEET UP',   j:'Quedar con alguien', c:'suj', t:'Ponerse de acuerdo para <b>verse</b>.'}
  ],
  x:{no:'This shirt doesn\'t stay me', si:'This shirt doesn\'t <b>fit</b> me', why:'La talla es FIT. Y si hablas de <i>estilo</i> —"te queda bien ese color"— entonces es <b>suit</b>.'},
  e:[
    {es:'Me quedo en casa', en:'I\'ll _ home', ok:'STAY', w:'Permanecer → STAY.'},
    {es:'No me queda', en:'It doesn\'t _ me', ok:'FIT', w:'Talla → FIT.'},
    {es:'No queda café', en:'There\'s no coffee _', ok:'LEFT', o:['LEFT','STAY','FIT'], w:'Lo que sobra → <b>left</b>. There\'s none left.'},
    {es:'Quedamos mañana', en:'Let\'s _ tomorrow', ok:'MEET UP', w:'Ponerse de acuerdo para verse → MEET UP.'}
  ]}

);
