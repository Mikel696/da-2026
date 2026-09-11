/* ─────────── 3c · EXPRESIONES COMPUESTAS ───────────
   El inglés hablado va casi todo en bloques de dos o tres palabras, y ninguna
   de ellas por separado dice lo que significa el bloque:

       give up    · «dar» + «arriba» = RENDIRSE
       break up   · «romper» + «arriba» = CORTAR con alguien
       hang on    · «colgar» + «en» = ESPERA

   Buscar «up» en una canción y que salga «arriba» es exactamente el fallo que
   hace que la letra no se entienda. Por eso, cuando una palabra entra en una
   expresión, se enseña la expresión entera.

   Formato de cada línea:  inglés | español | cuándo se usa | ejemplo EN | ejemplo ES
   Nada de esto se descarga de ningún sitio: es vocabulario, igual que las
   palabras y las frases del documento.                                        */
const RAW_EXPR = `
give up|rendirse / dejarlo|dejar de intentar algo|Don't give up on me.|No te rindas conmigo.
give in|ceder|dejar de resistirse|She finally gave in.|Al final cedió.
give back|devolver|regresar algo prestado|Give me back my heart.|Devuélveme el corazón.
give away|regalar / delatar|entregar gratis · o descubrir un secreto|His face gave him away.|Su cara lo delató.
give out|repartir / agotarse|entregar a varios · o quedarse sin fuerzas|My legs gave out.|Me fallaron las piernas.
break up|cortar / romper (pareja)|terminar una relación|We broke up last year.|Cortamos el año pasado.
break down|derrumbarse / averiarse|llorar sin poder parar · o dejar de funcionar|I broke down and cried.|Me derrumbé y lloré.
break out|estallar / escapar|empezar de golpe · o fugarse|A fire broke out.|Estalló un incendio.
break in|entrar a la fuerza|forzar una puerta|Someone broke in last night.|Alguien entró anoche.
break through|abrirse paso|superar una barrera|The sun broke through the clouds.|El sol se abrió paso entre las nubes.
hang on|espera / aguanta|pedir que esperen · o resistir|Hang on, I'm coming.|Espera, ya voy.
hang out|pasar el rato|estar con gente sin plan|We just hang out on Fridays.|Los viernes solo pasamos el rato.
hang up|colgar (el teléfono)|cortar la llamada|Don't hang up on me.|No me cuelgues.
hang around|rondar / quedarse|estar por ahí sin hacer nada|He hangs around the corner.|Ronda por la esquina.
hold on|espera / agárrate|pedir tiempo · o resistir|Hold on a little longer.|Aguanta un poco más.
hold back|contenerse / retener|no dejar salir algo|I can't hold back the tears.|No puedo contener las lágrimas.
hold up|aguantar / atracar|soportar peso · o robar a mano armada|Will it hold up?|¿Aguantará?
hold out|resistir|no rendirse todavía|They held out for weeks.|Resistieron semanas.
hold onto|aferrarse a|no soltar algo|Hold onto this feeling.|Aférrate a este sentimiento.
let go|soltar / dejar ir|dejar de aferrarse|I had to let you go.|Tuve que dejarte ir.
let down|defraudar|fallarle a alguien|I won't let you down.|No te voy a fallar.
let in|dejar entrar|abrir la puerta a alguien|Let me in.|Déjame entrar.
let out|dejar salir / soltar|liberar algo|Let it all out.|Suéltalo todo.
let off|perdonar / soltar|no castigar|The judge let him off.|El juez lo dejó ir.
get up|levantarse|salir de la cama|I get up at six.|Me levanto a las seis.
get out|salir / largarse|irse de un sitio|Get out of my head.|Sal de mi cabeza.
get over|superar|dejar atrás algo doloroso|I can't get over you.|No te puedo superar.
get back|volver / recuperar|regresar · o recobrar algo|I want to get back to you.|Quiero volver contigo.
get along|llevarse bien|entenderse con alguien|We get along fine.|Nos llevamos bien.
get away|escapar|irse lejos|Let's get away tonight.|Escapémonos esta noche.
get through|superar / comunicarse|pasar un mal trago · o lograr contactar|We'll get through this.|Vamos a salir de esta.
get in|entrar / subir|meterse en un coche o sitio|Get in the car.|Sube al coche.
get off|bajarse|salir de un transporte|Get off the bus here.|Bájate aquí del autobús.
get on|subirse / seguir|entrar a un transporte · o continuar|Get on with it.|Sigue con eso.
get it|entender|captar la idea|Now I get it.|Ahora lo entiendo.
get used to|acostumbrarse a|dejar de resultar raro|I got used to being alone.|Me acostumbré a estar solo.
come on|vamos / venga|animar o meter prisa|Come on, you can do it.|Vamos, tú puedes.
come over|pasarse por aquí|visitar|Come over tonight.|Pásate esta noche.
come back|volver|regresar|Come back to me.|Vuelve conmigo.
come out|salir / revelarse|aparecer · o decir la verdad de uno|The truth came out.|Salió la verdad.
come up|surgir|aparecer de repente|Something came up.|Surgió algo.
come across|toparse con|encontrar por casualidad|I came across an old photo.|Me topé con una foto vieja.
come down|bajar / venirse abajo|descender · o derrumbarse|The walls came down.|Los muros se vinieron abajo.
come around|pasarse / recapacitar|visitar · o cambiar de opinión|He'll come around.|Va a recapacitar.
come apart|deshacerse|romperse en pedazos|I'm coming apart.|Me estoy deshaciendo.
go on|seguir / continuar|no parar|Go on without me.|Sigue sin mí.
go out|salir|salir de casa o de fiesta|We went out last night.|Salimos anoche.
go through|pasar por|atravesar algo duro|You don't know what I went through.|No sabes por lo que pasé.
go back|volver|regresar a algo o alguien|I can't go back.|No puedo volver.
go away|irse / largarse|marcharse|The pain won't go away.|El dolor no se va.
go down|bajar / pasar|descender · o suceder|What went down last night?|¿Qué pasó anoche?
go off|estallar / sonar|explotar · o sonar una alarma|My alarm went off.|Sonó mi alarma.
go for it|lánzate|animar a intentarlo|Just go for it.|Lánzate y ya.
go ahead|adelante|dar permiso para seguir|Go ahead, I'm listening.|Adelante, te escucho.
take off|despegar / quitarse|un avión · o quitarse ropa|Take off your coat.|Quítate el abrigo.
take over|tomar el control|quedarse al mando|She took over the band.|Se quedó al mando de la banda.
take back|retirar lo dicho / recuperar|deshacer unas palabras|I take it back.|Retiro lo dicho.
take out|sacar / llevarse|extraer · o comida para llevar|Take out the trash.|Saca la basura.
take up|empezar (una afición) / ocupar|ponerse a hacer algo nuevo|I took up guitar.|Me puse con la guitarra.
take care of|cuidar de|hacerse cargo|I'll take care of you.|Yo te cuido.
take it easy|con calma|pedir que se relajen|Take it easy on yourself.|No seas duro contigo.
put on|ponerse / poner|vestirse · o hacer sonar algo|Put on that old song.|Pon esa canción vieja.
put off|aplazar|dejar para después|Don't put it off.|No lo dejes para después.
put out|apagar / sacar|extinguir un fuego|Put out the fire.|Apaga el fuego.
put up with|aguantar|soportar algo molesto|I can't put up with this.|No aguanto esto.
put down|dejar / menospreciar|soltar algo · o humillar|Put down the phone.|Deja el teléfono.
put away|guardar|poner en su sitio|Put your things away.|Guarda tus cosas.
put back|devolver a su sitio|dejar donde estaba|Put it back together.|Vuelve a armarlo.
turn on|encender|dar corriente o luz|Turn on the lights.|Enciende las luces.
turn off|apagar|cortar corriente o luz|Turn off the radio.|Apaga la radio.
turn up|subir (volumen) / aparecer|más fuerte · o presentarse|Turn it up.|Súbelo.
turn down|bajar / rechazar|menos volumen · o decir que no|She turned me down.|Me rechazó.
turn around|darse la vuelta / cambiar|girar · o enderezar algo|Turn around and look at me.|Date la vuelta y mírame.
turn into|convertirse en|pasar a ser otra cosa|It turned into a mess.|Se convirtió en un lío.
turn out|resultar|acabar siendo|It turned out fine.|Al final salió bien.
look for|buscar|intentar encontrar|I'm looking for you.|Te estoy buscando.
look after|cuidar de|hacerse cargo de alguien|Look after yourself.|Cuídate.
look up|buscar (en un libro) / mejorar|consultar un dato · o ir a mejor|Things are looking up.|Las cosas van mejorando.
look forward to|tener ganas de|esperar algo con ilusión|I look forward to seeing you.|Tengo ganas de verte.
look out|cuidado|avisar de un peligro|Look out behind you.|Cuidado detrás de ti.
look back|mirar atrás|recordar el pasado|Don't look back.|No mires atrás.
look into|investigar|estudiar un asunto|I'll look into it.|Lo voy a mirar.
look down on|menospreciar|creerse superior|Don't look down on me.|No me menosprecies.
run out|acabarse|quedarse sin algo|We're running out of time.|Se nos acaba el tiempo.
run away|huir|escaparse|Let's run away together.|Huyamos juntos.
run into|toparse con|encontrar por casualidad|I ran into her downtown.|Me la topé en el centro.
run over|atropellar|pasar por encima con un vehículo|A car ran over the sign.|Un coche arrolló la señal.
fall in love|enamorarse|empezar a querer a alguien|I fell in love with you.|Me enamoré de ti.
fall apart|desmoronarse|romperse por dentro|Everything falls apart.|Todo se desmorona.
fall for|caer rendido / picar|enamorarse · o creerse un engaño|I fell for you hard.|Caí rendido por ti.
fall out|pelearse|romper la amistad|They fell out over money.|Se pelearon por dinero.
fall behind|quedarse atrás|ir con retraso|Don't fall behind.|No te quedes atrás.
figure out|descifrar / darse cuenta|entender algo difícil|I can't figure you out.|No te logro descifrar.
work out|salir bien / entrenar|resolverse · o hacer ejecicio|It didn't work out.|No salió bien.
work on|trabajar en|dedicarle esfuerzo a algo|I'm working on myself.|Estoy trabajando en mí.
find out|enterarse|descubrir algo|She found out the truth.|Se enteró de la verdad.
show up|aparecer|presentarse en un sitio|He never showed up.|Nunca apareció.
show off|presumir|lucirse delante de otros|Stop showing off.|Deja de presumir.
grow up|crecer|hacerse mayor|We grew up here.|Crecimos aquí.
grow apart|distanciarse|dejar de estar unidos|We just grew apart.|Simplemente nos distanciamos.
wake up|despertarse|dejar de dormir|Wake up, it's over.|Despierta, se acabó.
stay up|quedarse despierto|no irse a dormir|I stayed up all night.|Me quedé despierto toda la noche.
calm down|calmarse|bajar la intensidad|Calm down, breathe.|Cálmate, respira.
slow down|ir más despacio|reducir la velocidad|Slow down, we have time.|Más despacio, hay tiempo.
settle down|asentarse / calmarse|echar raíces · o tranquilizarse|I'm not ready to settle down.|No estoy listo para sentar cabeza.
cheer up|animarse|ponerse de mejor humor|Cheer up, it's not over.|Anímate, no se acabó.
shut up|callarse|dejar de hablar|Shut up and dance.|Cállate y baila.
stand up|ponerse de pie / defender|levantarse · o dar la cara|Stand up for yourself.|Da la cara por ti.
stand by|apoyar / esperar|estar al lado de alguien|Stand by me.|Quédate a mi lado.
stand out|destacar|llamar la atención|You stand out in a crowd.|Destacas entre la gente.
sit down|sentarse|tomar asiento|Sit down with me.|Siéntate conmigo.
lie down|tumbarse|echarse|Lie down and rest.|Túmbate y descansa.
back down|echarse atrás|retirarse de una postura|I won't back down.|No me voy a echar atrás.
back up|apoyar / retroceder|respaldar a alguien · o dar marcha atrás|I'll back you up.|Yo te respaldo.
blow up|estallar|explotar · o enfadarse mucho|The whole thing blew up.|Todo estalló.
blow away|dejar sin palabras|impresionar muchísimo|That song blew me away.|Esa canción me dejó sin palabras.
bring up|sacar un tema / criar|mencionar · o educar a un hijo|Don't bring that up.|No saques ese tema.
bring back|traer de vuelta|hacer recordar|This brings back memories.|Esto me trae recuerdos.
bring down|hundir|derribar o desanimar|Don't let it bring you down.|No dejes que te hunda.
call off|cancelar|suspender algo planeado|They called off the show.|Cancelaron el concierto.
call back|devolver la llamada|volver a llamar|I'll call you back.|Te devuelvo la llamada.
carry on|seguir adelante|continuar pese a todo|Carry on without me.|Sigue sin mí.
catch up|ponerse al día / alcanzar|llegar donde van los demás|The past caught up with me.|El pasado me alcanzó.
check out|mirar / marcharse|echar un vistazo · o dejar el hotel|Check out this song.|Mira esta canción.
chill out|relajarse|tranquilizarse|Just chill out.|Relájate.
count on|contar con|confiar en alguien|You can count on me.|Puedes contar conmigo.
cut off|cortar / interrumpir|separar o dejar sin algo|He cut me off.|Me cortó.
deal with|lidiar con|hacer frente a algo|I can deal with it.|Puedo con eso.
end up|acabar / terminar|llegar a un final no previsto|We ended up alone.|Acabamos solos.
fed up|harto|cansado de algo|I'm fed up with waiting.|Estoy harto de esperar.
fill up|llenar|completar hasta arriba|Fill up my glass.|Llena mi vaso.
hurry up|date prisa|apurar a alguien|Hurry up, it's late.|Date prisa, es tarde.
keep on|seguir|no parar de hacer algo|Keep on running.|Sigue corriendo.
keep up|mantener el ritmo|no quedarse atrás|I can't keep up with you.|No te sigo el ritmo.
keep away|mantenerse lejos|no acercarse|Keep away from trouble.|Aléjate de los problemas.
knock out|dejar KO|dejar inconsciente o impresionar|That chorus knocks me out.|Ese estribillo me deja KO.
laugh at|reírse de|burlarse|They laughed at me.|Se rieron de mí.
lay down|tumbarse / soltar|echarse · o dejar algo|Lay down your arms.|Baja las armas.
leave out|dejar fuera|no incluir|Don't leave me out.|No me dejes fuera.
live on|seguir viviendo|sobrevivir en el recuerdo|Your song lives on.|Tu canción sigue viva.
make up|inventar / reconciliarse / maquillaje|tres sentidos distintos|Let's kiss and make up.|Hagamos las paces.
make out|besuquearse / distinguir|dos sentidos muy distintos|I can't make out the words.|No distingo la letra.
make it|lograrlo|conseguirlo o llegar|We're gonna make it.|Lo vamos a lograr.
mess up|fastidiar|hacerlo mal|I messed it up.|La fastidié.
miss out|perderse algo|quedarse sin vivirlo|Don't miss out.|No te lo pierdas.
move on|pasar página|seguir adelante tras algo|It's time to move on.|Toca pasar página.
pass away|fallecer|forma suave de decir «morir»|He passed away in May.|Falleció en mayo.
pass out|desmayarse|perder el conocimiento|I almost passed out.|Casi me desmayo.
pay off|dar resultado / saldar|valer la pena · o terminar de pagar|The wait paid off.|La espera valió la pena.
pick up|recoger / aprender|coger algo · o pillar una costumbre|Pick up the pieces.|Recoge los pedazos.
point out|señalar|hacer notar algo|She pointed out my mistake.|Señaló mi error.
pull over|parar (un vehículo)|echarse a un lado|Pull over here.|Párate aquí.
pull through|salir adelante|sobrevivir a algo grave|You'll pull through.|Vas a salir de esta.
push through|abrirse paso|seguir pese a la dificultad|Push through the pain.|Sigue pese al dolor.
reach out|tender la mano|contactar o pedir ayuda|Reach out when you need me.|Escríbeme cuando me necesites.
rip off|estafar|cobrar de más|They ripped me off.|Me estafaron.
set up|montar / tender una trampa|preparar algo · o incriminar|I was set up.|Me tendieron una trampa.
settle for|conformarse con|aceptar menos de lo que se quería|Don't settle for less.|No te conformes con menos.
sing along|cantar a coro|acompañar cantando|Sing along with me.|Canta conmigo.
sleep in|dormir hasta tarde|no madrugar|I slept in today.|Hoy dormí hasta tarde.
slip away|escabullirse|irse sin que se note|The night slipped away.|La noche se escapó.
sort out|arreglar|resolver un lío|We'll sort it out.|Ya lo arreglamos.
speak up|hablar más alto / alzar la voz|que se oiga · o dar la cara|Speak up for yourself.|Alza la voz por ti.
split up|separarse|romper una pareja o un grupo|The band split up.|El grupo se separó.
stick around|quedarse|no marcharse todavía|Stick around a while.|Quédate un rato.
stick together|mantenerse unidos|no separarse|We stick together.|Nos mantenemos unidos.
stick with|seguir con|no abandonar algo|Stick with it.|No lo dejes.
take after|parecerse a|salir como un familiar|She takes after her mother.|Salió como su madre.
tear apart|destrozar|romper en pedazos|It tore me apart.|Me destrozó.
think over|pensárselo|reflexionar antes de decidir|Think it over.|Piénsatelo.
throw away|tirar|deshacerse de algo|Don't throw it away.|No lo tires.
try on|probarse (ropa)|ver si queda bien|Try it on.|Pruébatelo.
try out|probar|hacer una prueba|Try out the new one.|Prueba el nuevo.
wait up|esperar despierto|no acostarse esperando a alguien|Don't wait up for me.|No me esperes despierto.
walk away|marcharse|irse dejando algo atrás|I walked away from it all.|Me fui de todo aquello.
warm up|calentar|subir la temperatura o preparar el cuerpo|Warm up before you sing.|Calienta antes de cantar.
watch out|cuidado|avisar de un peligro|Watch out for the step.|Cuidado con el escalón.
wear out|desgastar / agotar|quedarse sin fuerza o sin uso|I'm worn out.|Estoy agotado.
wipe out|arrasar|destruir por completo|The storm wiped it out.|La tormenta lo arrasó.
work through|superar poco a poco|resolver algo por partes|Work through the pain.|Ve superando el dolor.
write down|apuntar|escribir para no olvidar|Write it down.|Apúntalo.
zone out|quedarse ido|desconectar mentalmente|I zoned out for a second.|Me quedé ido un segundo.
all along|desde el principio|todo el tiempo|You knew all along.|Lo sabías desde el principio.
all over|por todas partes / se acabó|en todos lados · o terminado|It's all over now.|Ya se acabó todo.
after all|al fin y al cabo|introduce la razón de fondo|After all, we tried.|Al fin y al cabo lo intentamos.
at all|en absoluto|refuerza una negación|I don't mind at all.|No me importa en absoluto.
at least|al menos|lo mínimo|At least you tried.|Al menos lo intentaste.
as well|también|va al final de la frase|I'm coming as well.|Yo voy también.
by the way|por cierto|cambiar de tema|By the way, I miss you.|Por cierto, te echo de menos.
for good|para siempre|definitivamente|She's gone for good.|Se fue para siempre.
for real|en serio|de verdad|Is this for real?|¿Esto es en serio?
in a while|dentro de un rato|pasado un tiempo|See you in a while.|Nos vemos en un rato.
no matter what|pase lo que pase|sin importar nada|I'm here no matter what.|Estoy aquí pase lo que pase.
once again|otra vez|de nuevo|Here we go once again.|Allá vamos otra vez.
on my own|por mi cuenta|solo, sin ayuda|I did it on my own.|Lo hice por mi cuenta.
out of nowhere|de la nada|sin avisar|You came out of nowhere.|Apareciste de la nada.
right now|ahora mismo|en este instante|I need you right now.|Te necesito ahora mismo.
so far|hasta ahora|hasta este momento|So far, so good.|Hasta ahora, bien.
such a|tan / menudo|refuerza un sustantivo|You're such a liar.|Eres un mentiroso.
the other day|el otro día|hace poco|I saw him the other day.|Lo vi el otro día.
used to|solía|algo que ya no se hace|I used to love you.|Yo te quería antes.
what if|y si…|plantear una posibilidad|What if I stayed?|¿Y si me quedara?
no way|ni de broma / no puede ser|negativa rotunda o sorpresa|No way, I don't believe it.|No puede ser, no me lo creo.
never mind|da igual|dejarlo pasar|Never mind, forget it.|Da igual, olvídalo.
come true|hacerse realidad|cumplirse un sueño|My dreams came true.|Mis sueños se hicieron realidad.
make sense|tener sentido|resultar lógico|It doesn't make sense.|No tiene sentido.
take place|ocurrir|tener lugar|It took place at night.|Ocurrió de noche.
keep in touch|seguir en contacto|no perderse la pista|Let's keep in touch.|Sigamos en contacto.
lose touch|perder el contacto|dejar de hablarse|We lost touch years ago.|Perdimos el contacto hace años.
break someone's heart|romperle el corazón a alguien|hacer mucho daño sentimental|You broke my heart.|Me rompiste el corazón.
change one's mind|cambiar de opinión|decidir otra cosa|I changed my mind.|Cambié de opinión.
fall asleep|quedarse dormido|empezar a dormir|I fell asleep on the couch.|Me quedé dormido en el sofá.
get married|casarse|contraer matrimonio|They got married in June.|Se casaron en junio.
have fun|pasarlo bien|disfrutar|Have fun tonight.|Pásalo bien esta noche.
hold hands|ir de la mano|cogerse de las manos|We held hands all night.|Fuimos de la mano toda la noche.
make a mistake|cometer un error|equivocarse|I made a mistake.|Cometí un error.
take a chance|arriesgarse|jugársela|Take a chance on me.|Arriésgate conmigo.
tell the truth|decir la verdad|no mentir|Just tell me the truth.|Solo dime la verdad.
waste time|perder el tiempo|malgastarlo|Don't waste my time.|No me hagas perder el tiempo.
on fire|encendido / arrasando|literal o «en racha»|Tonight we're on fire.|Esta noche arrasamos.
out of my mind|fuera de mis cabales|loco|I'm out of my mind for you.|Estoy loco por ti.
over and over|una y otra vez|repetidamente|I play it over and over.|La pongo una y otra vez.
little by little|poco a poco|de forma gradual|Little by little I healed.|Poco a poco me curé.
side by side|lado a lado|juntos|We walked side by side.|Caminamos lado a lado.
face to face|cara a cara|en persona|Say it face to face.|Dímelo a la cara.
now and then|de vez en cuando|ocasionalmente|I think of you now and then.|Pienso en ti de vez en cuando.
sooner or later|tarde o temprano|acabará pasando|Sooner or later you'll know.|Tarde o temprano lo sabrás.
here we go|allá vamos|empezar algo|Here we go again.|Allá vamos otra vez.
let it be|déjalo estar|no forzar las cosas|Just let it be.|Déjalo estar.
let me know|avísame|pedir que te informen|Let me know how it goes.|Avísame cómo va.
no big deal|no es para tanto|quitarle importancia|It's no big deal.|No es para tanto.
`.trim().split(String.fromCharCode(10));

const EXPR = (() => {
  const LISTA = RAW_EXPR.map((r, i) => {
    const p = r.split('|');
    return { i:i+1, en:p[0], es:p[1], use:p[2], xe:p[3], xs:p[4] };
  });

  /* Índice palabra → expresiones que la contienen. Se construye una vez.
     «up» sale en decenas de expresiones y eso es exactamente el punto: si en
     la canción dice «give up», buscar «up» tiene que llevar a «give up», no a
     «arriba». */
  const POR_PAL = new Map();
  LISTA.forEach(e => {
    new Set(e.en.toLowerCase().split(/[^a-z']+/).filter(Boolean)).forEach(p => {
      if(!POR_PAL.has(p)) POR_PAL.set(p, []);
      POR_PAL.get(p).push(e);
    });
  });

  const IDX = new Map();
  LISTA.forEach(e => { if(!IDX.has(e.en)) IDX.set(e.en, e); });

  /* Busca la palabra dentro de las expresiones. Devuelve primero las que la
     llevan al principio (give up cuando buscas «give»), que es lo que uno
     espera ver arriba del todo. */
  function buscar(q){
    const w = String(q || '').toLowerCase().trim();
    if(!w) return [];
    const exacta = IDX.get(w);
    if(exacta) return [exacta];
    const lista = (POR_PAL.get(w) || []).slice();
    lista.sort((a, b) => a.en.indexOf(w) - b.en.indexOf(w) || a.en.length - b.en.length);
    return lista;
  }

  /* Las expresiones que salen en un texto.

     No vale buscar la cadena tal cual: la canción dice «I gave up», no «give
     up». Pero tampoco vale llevar TODAS las palabras a su base, porque
     entonces «held hands» se convierte en «hold hand» y deja de casar con
     «hold hands». La regla buena es la del idioma: **el verbo de cabeza es el
     único que se conjuga**; lo que viene detrás no se toca. Así que se recorre
     el texto palabra por palabra y en cada posición se prueba la expresión
     dejando que solo la primera venga en cualquier forma. */
  function enTexto(txt){
    const B = (window.APP && window.APP.BUSCA) || null;
    const toks = String(txt || '').toLowerCase()
      .replace(/[^a-z' ]+/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
    if(!toks.length) return [];

    const base = p => {
      try { const r = window.APP.LEX.raiz(p); if(r) return r; } catch(e){}
      if(B){ const r = B.buscar(p); if(r && r.w && r.via === 'forma') return r.w.en; }
      return p;
    };
    const lem = toks.map(base);

    return LISTA.filter(e => {
      if(e.en.indexOf('someone') >= 0 || e.en.indexOf("one's") >= 0) return false;
      const ps = e.en.split(' ');
      for(let i = 0; i + ps.length <= toks.length; i++){
        let casa = true;
        for(let j = 0; j < ps.length; j++){
          const t = toks[i + j];
          const ok = (j === 0) ? (t === ps[0] || lem[i + j] === ps[0]) : (t === ps[j]);
          if(!ok){ casa = false; break; }
        }
        if(casa) return true;
      }
      return false;
    });
  }

  function auditar(){
    const malas = [];
    const vistas = new Set();
    const B = (window.APP && window.APP.BUSCA) || null;

    LISTA.forEach(e => {
      if(!e.en || !e.es || !e.use || !e.xe || !e.xs) malas.push('incompleta: ' + e.en);
      if(e.en.indexOf(' ') < 0) malas.push('no es compuesta: ' + e.en);
      if(vistas.has(e.en)) malas.push('repetida: ' + e.en);
      vistas.add(e.en);

      /* Que el ejemplo use de verdad la expresión. El primer intento comparaba
         letra por letra y marcaba 44 buenas como malas: los ejemplos van en
         PASADO —«broke up», «went out», «fell in love»— y eso es justo como se
         habla. Así que la partícula se busca tal cual, y el verbo se busca por
         su raíz, que para eso está el buscador. */
      const partes = e.en.toLowerCase().replace(/someone's|one's|someone/g, ' ').split(/\s+/).filter(Boolean);
      const ej = e.xe.toLowerCase().replace(/[^a-z' ]+/g, ' ').split(/\s+/).filter(Boolean);
      const cabeza = partes[0];
      const resto = partes.slice(1);

      const faltan = resto.filter(p => ej.indexOf(p) < 0);
      if(faltan.length) malas.push('al ejemplo de «' + e.en + '» le falta «' + faltan.join(' ') + '»: ' + e.xe);

      if(B){
        /* Un verbo irregular como «gave» tiene FICHA PROPIA en el diccionario,
           asi que el buscador devuelve «gave», no «give» — y eso es correcto.
           Por eso hay que preguntar por tres caminos antes de dar por malo un
           ejemplo. El primer comprobador solo miraba uno y marco 44 ejemplos
           buenos como malos: un test que acusa de mas es tan inutil como uno
           que no acusa nada. */
        const esElVerbo = p => {
          if(p === cabeza) return true;
          const r = B.buscar(p);
          if(r && r.w && r.w.en === cabeza) return true;
          try { if(window.APP.LEX.raiz(p) === cabeza) return true; } catch(err){}
          return false;
        };
        if(!ej.some(esElVerbo))
          malas.push('el ejemplo de «' + e.en + '» no usa «' + cabeza + '» en ninguna forma: ' + e.xe);
      }
    });

    /* Pruebas de fuego. Sin las negativas, un buscador que dijera «sí» a todo
       aprobaría este examen. */
    if(!buscar('up').some(e => e.en === 'give up')) malas.push('buscar «up» no encuentra «give up»');
    if(!buscar('give').some(e => e.en === 'give up')) malas.push('buscar «give» no encuentra «give up»');
    if(buscar('zzqx').length) malas.push('«zzqx» devuelve expresiones y no debería');
    if(!enTexto("I won't give up on you").some(e => e.en === 'give up'))
      malas.push('enTexto no detecta «give up» en una frase que lo lleva');
    if(enTexto("the sky is blue tonight").length)
      malas.push('enTexto se inventa expresiones en una frase que no lleva ninguna');

    return { malas, ok: malas.length === 0, total: LISTA.length, conBuscador: !!B };
  }

  return { LISTA, buscar, enTexto, auditar, IDX };
})();
