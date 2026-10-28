/* ══════════════════════════════════════════════════════════════════════
   SYNC · versión para la COPIA COMPARTIDA (invitados)
   ──────────────────────────────────────────────────────────────────────
   Sustituye a 09_sync.js cuando el build se hace con INVITADOS=1.

   Por qué existe, en una frase: la copia que se comparte con otras personas
   NO lleva la clave de la base de datos de Miguel ni se conecta a ella.

   Eso no es una limitación: es la protección. Sin conexión no hay cuentas
   que administrar, nadie puede tocar sus datos, y la clave pública no viaja
   dentro de un archivo que cualquiera de los invitados puede guardar.

   Todo lo demás del documento funciona igual, porque el Engine siempre fue
   local primero: lo que escribes vive en TU navegador. El respaldo es
   ⬇ Exportar, dentro de Cuaderno.

   Mantiene la misma superficie que el módulo real (boot, signIn, signUp,
   signOut, pull, flushNow, touch, onState, user, state, last, pending) para
   que 08_app.js no se entere de la diferencia y no haya que tocarlo.
══════════════════════════════════════════════════════════════════════ */
const SYNC = (() => {
  const AVISO = 'Esta copia guarda todo en este navegador, en este equipo. ' +
    'No tiene cuenta ni nube: usa ⬇ Exportar en el Cuaderno para hacerte una copia de respaldo.';
  let oyente = null;

  function onState(fn){ oyente = fn; if(fn) fn('off'); }
  function boot(){ if(oyente) oyente('off'); }
  function touch(){}
  async function pull(){}
  async function flushNow(){}
  async function signIn(){ return { ok:false, msg: AVISO }; }
  async function signUp(){ return { ok:false, msg: AVISO }; }
  async function signOut(){}

  return { boot, signIn, signUp, signOut, pull, flushNow, touch, onState,
           get user(){ return null; }, get state(){ return 'off'; },
           get last(){ return null; }, get pending(){ return 0; },
           KEYS: [], invitados: true, AVISO };
})();
