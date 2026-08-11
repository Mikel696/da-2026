/* ═══════════════════════════════════════════════════════════════
   DA-2026 · 12-FIN · Calculadora financiera flotante
   ─────────────────────────────────────────────────────────────
   Burbuja fija abajo a la IZQUIERDA (la derecha la ocupa el badge ☁
   de cloud-sync, bottom:14/right:14). Vive fuera del flujo de la
   página: funciona en cualquier sección y a cualquier altura.

   Se alimenta de FINCO (TRM, inflación, tasa de política reales).
   Si FINCO no cargó, cada calculadora sigue sirviendo: los campos
   que venían de datos en vivo quedan editables a mano.

   Toda explicación está escrita para alguien que NO programa y
   piensa en Excel. Cada resultado trae su lectura "en cristiano".
═══════════════════════════════════════════════════════════════ */

const FINCALC = (() => {

  const STATE_KEY = 'fin_calc_state';   // local: última calculadora + valores

  /* ── Formato ── */
  const money = n => !isFinite(n) ? '—' :
    '$' + new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(Math.round(n));
  const pct = (n, d = 2) => !isFinite(n) ? '—' :
    new Intl.NumberFormat('es-CO', { minimumFractionDigits: d, maximumFractionDigits: d }).format(n) + '%';
  const esc = s => String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  /* ── Datos en vivo desde FINCO ── */
  function live() {
    const d = (window.FINCO && FINCO.state && FINCO.state.data) || {};
    return {
      trm:    d.trm    ? d.trm.value    : null,
      cpi:    d.cpi    ? d.cpi.value    : null,
      policy: d.policy ? d.policy.value : null,
      ibr:    d.ibr    ? d.ibr.value    : null
    };
  }

  /* ── Conversión de tasas (el enredo colombiano por excelencia) ── */
  const eaToMensual = ea => Math.pow(1 + ea / 100, 1 / 12) - 1;      // E.A. % → efectiva mensual decimal
  const mensualToEa = im => (Math.pow(1 + im, 12) - 1) * 100;

  /* ═════════ Definición de las calculadoras ═════════
     Cada una: id, nombre, para qué sirve (lenguaje llano),
     campos, y una función que calcula y devuelve {rows, verdict}. */

  const CALCS = [

    { id:'compuesto', icon:'🌱', name:'Interés compuesto',
      what:'Cuánto crece tu plata si la dejás quieta y le sumás un ahorro cada mes.',
      plain:'Es el "efecto bola de nieve": los intereses generan más intereses. Es la razón por la que empezar temprano importa más que empezar con mucho.',
      fields:[
        {k:'vp',  l:'Plata que tenés hoy', v:1000000, type:'money'},
        {k:'pmt', l:'Ahorro cada mes',     v:200000,  type:'money'},
        {k:'ea',  l:'Rendimiento anual',   v:null,    type:'pct', from:'policy',
         hint:'Precargado con la tasa de política del Banrep. Cambialo por la de tu producto real.'},
        {k:'yrs', l:'Años',                v:5,       type:'num'}
      ],
      calc(f, L) {
        const im = eaToMensual(f.ea), n = f.yrs * 12;
        const vfCapital = f.vp * Math.pow(1 + im, n);
        const vfAportes = im === 0 ? f.pmt * n : f.pmt * ((Math.pow(1 + im, n) - 1) / im);
        const total = vfCapital + vfAportes;
        const puesto = f.vp + f.pmt * n;
        const ganado = total - puesto;

        // Lo mismo pero descontando inflación: el poder de compra real.
        let real = null;
        if (L.cpi != null) real = total / Math.pow(1 + L.cpi / 100, f.yrs);

        return {
          rows:[
            ['Tendrías al final', money(total), 'big'],
            ['De tu bolsillo salió', money(puesto)],
            ['Lo que generó solo', money(ganado), ganado > 0 ? 'good' : ''],
            real != null ? ['Eso, en plata de hoy', money(real), 'dim'] : null
          ],
          verdict: ganado > puesto
            ? `Más de la mitad de ese total no la pusiste vos: la generaron los intereses. Eso es el interés compuesto trabajando.`
            : `Todavía la mayor parte es tu propio ahorro. Con más años, la balanza se voltea sola.`
            + (real != null ? ` Ojo con la última fila: ${money(total)} dentro de ${f.yrs} años compran lo que hoy compran ${money(real)}.` : '')
        };
      }
    },

    { id:'real', icon:'🔥', name:'¿Le gano a la inflación?',
      what:'Traduce el rendimiento que te prometen al que de verdad te queda.',
      plain:'Si tu plata rinde 9% pero todo sube 6%, no ganaste 9%: ganaste como 3%. Eso es lo único que importa, y casi nadie lo mira.',
      fields:[
        {k:'nom', l:'Lo que te rinde al año', v:9,    type:'pct'},
        {k:'inf', l:'Inflación anual',        v:null, type:'pct', from:'cpi',
         hint:'Precargado con el dato del Banco de la República.'}
      ],
      calc(f) {
        // Fisher exacto. La resta simple (9−6=3) es una aproximación que
        // se desvía cuanto más altas son las tasas.
        const exacto = ((1 + f.nom/100) / (1 + f.inf/100) - 1) * 100;
        const simple = f.nom - f.inf;
        return {
          rows:[
            ['Rendimiento real', pct(exacto), exacto >= 0 ? 'big good' : 'big bad'],
            ['La cuenta de servilleta', pct(simple), 'dim'],
            ['Cada millón, en un año', money(1000000 * (1 + exacto/100)), 'dim']
          ],
          verdict: exacto >= 0
            ? `Tu plata gana poder de compra: rinde ${pct(exacto)} por encima de lo que suben los precios.`
            : `Tu plata PIERDE ${pct(Math.abs(exacto))} de poder de compra al año. El número se ve positivo, pero comprás menos que antes.`
        };
      }
    },

    { id:'cuota', icon:'🏦', name:'Cuota de un crédito',
      what:'Cuánto pagarías al mes, y cuánto termina costando en total.',
      plain:'El banco te dice la cuota. Lo que no destaca es el total: sumá todas las cuotas y comparalo con lo que pediste prestado. Esa diferencia son intereses.',
      fields:[
        {k:'p',   l:'Cuánto pedís prestado', v:10000000, type:'money'},
        {k:'ea',  l:'Tasa que te cobran (E.A.)', v:24,   type:'pct',
         hint:'La tasa real de cada banco está en la pestaña Colombia (Fase 2).'},
        {k:'mes', l:'En cuántos meses',      v:36,       type:'num'}
      ],
      calc(f) {
        const i = eaToMensual(f.ea), n = f.mes;
        const cuota = i === 0 ? f.p / n : f.p * i / (1 - Math.pow(1 + i, -n));
        const total = cuota * n;
        const intereses = total - f.p;
        return {
          rows:[
            ['Pagarías cada mes', money(cuota), 'big'],
            ['Al final habrás pagado', money(total)],
            ['De eso, intereses', money(intereses), 'bad'],
            ['Sobre lo prestado', pct(intereses / f.p * 100, 1), 'dim']
          ],
          verdict: `Por ${money(f.p)} terminás devolviendo ${money(total)}. Los ${money(intereses)} de diferencia son el precio de no esperar. Si podés bajar el plazo, bajás mucho ese número.`
        };
      }
    },

    { id:'tasas', icon:'🔄', name:'Convertir tasas (E.A. ⇄ mensual)',
      what:'Traduce entre la tasa anual y la mensual, que no se convierten dividiendo por 12.',
      plain:'El error más común de Colombia: "24% anual son 2% mensual". FALSO — por el interés compuesto, 2% mensual es 26,8% anual. Los bancos usan esto y casi nadie lo revisa.',
      fields:[
        {k:'ea', l:'Tasa efectiva anual (E.A.)', v:24, type:'pct'},
        {k:'mv', l:'…o tasa mensual, si la tenés', v:0, type:'pct',
         hint:'Poné 0 acá para convertir de anual a mensual. Poné un valor para hacerlo al revés.'}
      ],
      calc(f) {
        const desdeMv = f.mv > 0;
        const im = desdeMv ? f.mv / 100 : eaToMensual(f.ea);
        const ea = desdeMv ? mensualToEa(im) : f.ea;
        const ingenua = ea / 12;
        return {
          rows:[
            ['Mensual efectiva', pct(im * 100, 3), 'big'],
            ['Anual efectiva (E.A.)', pct(ea, 2), 'big'],
            ['La división ingenua (E.A./12)', pct(ingenua, 3), 'dim'],
            ['Diferencia con la ingenua', pct(Math.abs(im * 100 - ingenua), 3), 'bad']
          ],
          verdict: `Dividir entre 12 da ${pct(ingenua,3)} mensual, pero la verdadera es ${pct(im*100,3)}. Parece poco; sobre un crédito grande y a varios años, esa brecha son cientos de miles de pesos.`
        };
      }
    },

    { id:'cdt', icon:'📜', name:'CDT: cuánto queda limpio',
      what:'Lo que realmente recibís después de impuestos y de la inflación.',
      plain:'El banco anuncia la tasa bruta. Al rendimiento le descuentan retención en la fuente, y encima la inflación se come una parte. Esto te muestra las tres capas.',
      fields:[
        {k:'cap', l:'Cuánto vas a poner',  v:5000000, type:'money'},
        {k:'ea',  l:'Tasa que te ofrecen', v:9,       type:'pct'},
        {k:'mes', l:'Plazo en meses',      v:12,      type:'num'},
        {k:'ret', l:'Retención en la fuente', v:7,    type:'pct',
         hint:'Cambia por decreto — confirmá la vigente con tu banco antes de decidir. Editable a propósito.'},
        {k:'inf', l:'Inflación anual',     v:null,    type:'pct', from:'cpi'}
      ],
      calc(f) {
        const años = f.mes / 12;
        const bruto = f.cap * (Math.pow(1 + f.ea/100, años) - 1);
        const impuesto = bruto * f.ret/100;
        const neto = bruto - impuesto;
        const finalPlata = f.cap + neto;
        const enPlataHoy = finalPlata / Math.pow(1 + f.inf/100, años);
        const gananciaReal = enPlataHoy - f.cap;
        return {
          rows:[
            ['Rendimiento bruto', money(bruto)],
            ['Le descuentan', '−' + money(impuesto), 'bad'],
            ['Recibís de rendimiento', money(neto), 'good'],
            ['Tendrías en total', money(finalPlata), 'big'],
            ['Eso, en plata de hoy', money(enPlataHoy), 'dim'],
            ['Ganancia REAL', (gananciaReal >= 0 ? '+' : '') + money(gananciaReal), gananciaReal >= 0 ? 'good' : 'bad']
          ],
          verdict: gananciaReal >= 0
            ? `Después de impuestos e inflación ganás ${money(gananciaReal)} de poder de compra. Poco, pero positivo — y sin riesgo.`
            : `Cuidado: después de impuestos e inflación PERDÉS ${money(Math.abs(gananciaReal))} de poder de compra. El CDT te da más pesos, pero esos pesos compran menos.`
        };
      }
    },

    { id:'meta', icon:'🎯', name:'¿Cuánto ahorrar por mes?',
      what:'Le ponés la meta y te dice la cuota mensual para llegar.',
      plain:'Al revés del interés compuesto: en vez de preguntar "cuánto tendré", preguntás "cuánto debo guardar". Es la cuenta que sirve para armar un plan.',
      fields:[
        {k:'meta', l:'Cuánto querés juntar', v:20000000, type:'money'},
        {k:'yrs',  l:'En cuántos años',      v:3,        type:'num'},
        {k:'ea',   l:'Rendimiento anual',    v:null,     type:'pct', from:'policy'},
        {k:'vp',   l:'Con cuánto arrancás',  v:0,        type:'money'}
      ],
      calc(f) {
        const im = eaToMensual(f.ea), n = f.yrs * 12;
        const faltante = f.meta - f.vp * Math.pow(1 + im, n);
        const pmt = faltante <= 0 ? 0 :
          (im === 0 ? faltante / n : faltante * im / (Math.pow(1 + im, n) - 1));
        const sinRendir = Math.max(0, (f.meta - f.vp) / n);
        return {
          rows:[
            ['Guardá cada mes', money(pmt), 'big'],
            ['Sin rendimiento harían falta', money(sinRendir), 'dim'],
            ['Te ahorrás al mes', money(Math.max(0, sinRendir - pmt)), 'good'],
            ['Total que pondrás vos', money(f.vp + pmt * n)]
          ],
          verdict: pmt === 0
            ? `Con lo que ya tenés y ese rendimiento, llegás a la meta sin guardar un peso más.`
            : `Guardando ${money(pmt)} al mes llegás a ${money(f.meta)}. Si lo dejaras debajo del colchón necesitarías ${money(sinRendir)} mensuales: el rendimiento te ahorra ${money(sinRendir - pmt)} cada mes.`
        };
      }
    },

    { id:'dolar', icon:'💵', name:'Dólares ⇄ pesos',
      what:'Convierte con la TRM oficial de hoy.',
      plain:'La TRM es la tasa oficial del día. Las casas de cambio y las tarjetas cobran un poco distinto, pero esta es la referencia real.',
      fields:[
        {k:'cop', l:'Pesos colombianos', v:1000000, type:'money'},
        {k:'usd', l:'…o dólares',        v:0,       type:'num',
         hint:'Poné 0 acá para convertir de pesos a dólares. Poné un valor para hacerlo al revés.'},
        {k:'trm', l:'TRM', v:null, type:'num', from:'trm', hint:'Oficial, traída de datos.gov.co.'}
      ],
      calc(f) {
        if (!f.trm) return { rows:[['Falta la TRM','—']], verdict:'No se pudo traer la TRM. Poné el valor a mano.' };
        const deUsd = f.usd > 0;
        const usd = deUsd ? f.usd : f.cop / f.trm;
        const cop = deUsd ? f.usd * f.trm : f.cop;
        return {
          rows:[
            ['En dólares', 'US$ ' + new Intl.NumberFormat('es-CO',{maximumFractionDigits:2}).format(usd), 'big'],
            ['En pesos', money(cop), 'big'],
            ['TRM usada', new Intl.NumberFormat('es-CO',{maximumFractionDigits:2}).format(f.trm), 'dim']
          ],
          verdict: `A la TRM de hoy (${new Intl.NumberFormat('es-CO',{maximumFractionDigits:2}).format(f.trm)}), esos ${money(cop)} son US$${new Intl.NumberFormat('es-CO',{maximumFractionDigits:2}).format(usd)}.`
        };
      }
    },

    { id:'oportunidad', icon:'⚖️', name:'¿Cuánto me cuesta de verdad?',
      what:'Lo que dejás de ganar por gastar esa plata en vez de invertirla.',
      plain:'Un celular de 3 millones no cuesta 3 millones: cuesta 3 millones MÁS lo que esa plata habría generado. A eso se le dice costo de oportunidad, y cambia cómo ves las compras grandes.',
      fields:[
        {k:'gasto', l:'Lo que vas a gastar', v:3000000, type:'money'},
        {k:'ea',    l:'Rendimiento que dejás de ganar', v:null, type:'pct', from:'policy'},
        {k:'yrs',   l:'Mirando a cuántos años', v:5, type:'num'}
      ],
      calc(f) {
        const futuro = f.gasto * Math.pow(1 + f.ea/100, f.yrs);
        const dejado = futuro - f.gasto;
        return {
          rows:[
            ['Precio en la etiqueta', money(f.gasto)],
            ['Si lo invirtieras, en ' + f.yrs + ' años', money(futuro), 'big'],
            ['Lo que dejás de ganar', money(dejado), 'bad'],
            ['Costo real de la compra', money(futuro), 'big bad']
          ],
          verdict: `Comprarlo no te cuesta ${money(f.gasto)}: te cuesta ${money(futuro)}, porque esa plata invertida habría llegado ahí sola. No significa que no lo compres — significa que ya sabés el precio completo.`
        };
      }
    },

    { id:'rentas', icon:'🏝️', name:'¿Cuánto para vivir de rentas?',
      what:'El capital que necesitarías para vivir de sus rendimientos.',
      plain:'Regla del pulgar, no una promesa: si retirás un % modesto cada año, el capital aguanta. Sirve para dimensionar la meta, no para planear tu jubilación exacta.',
      fields:[
        {k:'mes',    l:'Cuánto gastás al mes', v:3000000, type:'money'},
        {k:'retiro', l:'Retiro anual seguro',  v:4,       type:'pct',
         hint:'El 4% es la regla clásica de estudios en EE. UU. En Colombia, con inflación más alta, conviene ser más conservador.'}
      ],
      calc(f, L) {
        const anual = f.mes * 12;
        const capital = anual / (f.retiro / 100);
        let nota = '';
        if (L.cpi != null && f.retiro > 0) {
          nota = ` Con la inflación en ${pct(L.cpi)}, tu inversión tendría que rendir al menos ${pct(L.cpi + f.retiro)} anual solo para que el capital no se encoja.`;
        }
        return {
          rows:[
            ['Necesitarías juntar', money(capital), 'big'],
            ['Gasto al año', money(anual)],
            ['Retirarías al mes', money(capital * (f.retiro/100) / 12), 'dim']
          ],
          verdict: `Para cubrir ${money(f.mes)} mensuales retirando ${pct(f.retiro)} al año, el capital objetivo es ${money(capital)}.` + nota
        };
      }
    },

    { id:'poder', icon:'📉', name:'¿Qué valdrá mi plata?',
      what:'Cuánto compra dentro de unos años lo que hoy tenés guardado.',
      plain:'La plata quieta no se roba sola: la inflación se la come de a poquito. Esto le pone número a esa pérdida silenciosa.',
      fields:[
        {k:'monto', l:'Plata guardada', v:10000000, type:'money'},
        {k:'inf',   l:'Inflación anual', v:null,    type:'pct', from:'cpi'},
        {k:'yrs',   l:'Dentro de cuántos años', v:10, type:'num'}
      ],
      calc(f) {
        const valor = f.monto / Math.pow(1 + f.inf/100, f.yrs);
        const perdido = f.monto - valor;
        return {
          rows:[
            ['Seguirás teniendo', money(f.monto), 'dim'],
            ['Pero comprará como', money(valor), 'big bad'],
            ['Poder de compra evaporado', money(perdido), 'bad'],
            ['O sea, perdiste', pct(perdido / f.monto * 100, 1), 'bad']
          ],
          verdict: `Dentro de ${f.yrs} años vas a seguir viendo ${money(f.monto)} en la cuenta, pero comprarán lo que hoy compran ${money(valor)}. Guardar sin rendir no es neutro: es perder despacio.`
        };
      }
    }
  ];

  /* ═════════ Estado ═════════ */

  let _open = false;
  let _active = 'compuesto';
  let _vals = {};

  function _loadState() {
    try {
      const s = JSON.parse(localStorage.getItem(STATE_KEY) || 'null');
      if (s && s.active) _active = s.active;
      if (s && s.vals) _vals = s.vals;
    } catch {}
  }
  function _saveState() {
    try { localStorage.setItem(STATE_KEY, JSON.stringify({ active:_active, vals:_vals })); } catch {}
  }

  function _calc() { return CALCS.find(c => c.id === _active) || CALCS[0]; }

  /** Valor de un campo: lo que el usuario escribió > el dato en vivo > el default. */
  function _fieldValue(c, f, L) {
    const saved = _vals[c.id] && _vals[c.id][f.k];
    if (saved != null && saved !== '') return +saved;
    if (f.from && L[f.from] != null) return +L[f.from];
    return f.v == null ? 0 : f.v;
  }

  /* ═════════ Render ═════════ */

  function _render() {
    const host = document.getElementById('finCalcPanel');
    if (!host) return;
    const L = live();
    const c = _calc();

    const f = {};
    c.fields.forEach(fl => { f[fl.k] = _fieldValue(c, fl, L); });

    let out;
    try { out = c.calc(f, L); }
    catch (e) { out = { rows:[['Error en el cálculo','—']], verdict:'Revisá los valores ingresados.' }; }

    const chips = CALCS.map(x =>
      `<button class="fk-chip${x.id === _active ? ' on' : ''}" data-calc="${x.id}" title="${esc(x.name)}">${x.icon} ${esc(x.name)}</button>`
    ).join('');

    const inputs = c.fields.map(fl => {
      const val = f[fl.k];
      const isLive = fl.from && L[fl.from] != null && !(_vals[c.id] && _vals[c.id][fl.k]);
      return `<label class="fk-field">
        <span class="fk-l">${esc(fl.l)}${isLive ? ' <em class="fk-livetag">en vivo</em>' : ''}</span>
        <span class="fk-inwrap">
          ${fl.type === 'money' ? '<i>$</i>' : ''}
          <input type="number" step="any" data-f="${esc(fl.k)}" value="${val}">
          ${fl.type === 'pct' ? '<i>%</i>' : ''}
        </span>
        ${fl.hint ? `<span class="fk-hint">${esc(fl.hint)}</span>` : ''}
      </label>`;
    }).join('');

    const rows = out.rows.filter(Boolean).map(r =>
      `<div class="fk-row ${r[2] || ''}"><span>${esc(r[0])}</span><b>${esc(r[1])}</b></div>`
    ).join('');

    const stamp = [];
    if (L.trm != null) stamp.push('TRM ' + new Intl.NumberFormat('es-CO',{maximumFractionDigits:0}).format(L.trm));
    if (L.cpi != null) stamp.push('inflación ' + pct(L.cpi));
    if (L.policy != null) stamp.push('política ' + pct(L.policy));

    host.innerHTML = `
      <div class="fk-head">
        <div class="fk-title">🧮 Calculadora financiera</div>
        <button class="fk-x" id="fkClose" aria-label="Cerrar calculadora">✕</button>
      </div>
      <div class="fk-live">${stamp.length ? '⚡ Usando datos reales · ' + esc(stamp.join(' · ')) : '○ Sin datos en vivo — todos los campos son editables'}</div>
      <div class="fk-chips">${chips}</div>
      <div class="fk-what"><b>${esc(c.what)}</b><span>${esc(c.plain)}</span></div>
      <div class="fk-fields">${inputs}</div>
      <div class="fk-out">${rows}</div>
      <div class="fk-verdict">${esc(out.verdict)}</div>
      <button class="fk-reset" id="fkReset">↺ Volver a los valores sugeridos</button>
    `;
    _wire();
  }

  function _wire() {
    const host = document.getElementById('finCalcPanel');
    if (!host) return;

    const x = host.querySelector('#fkClose');
    if (x) x.onclick = () => toggle(false);

    host.querySelectorAll('[data-calc]').forEach(b => {
      b.onclick = () => { _active = b.dataset.calc; _saveState(); _render(); };
    });

    host.querySelectorAll('input[data-f]').forEach(inp => {
      inp.oninput = () => {
        const id = _active;
        _vals[id] = _vals[id] || {};
        _vals[id][inp.dataset.f] = inp.value;
        _saveState();
        // Recalcula sin re-renderizar los inputs: si se reconstruyera el
        // DOM en cada tecla, el cursor saltaría al final del campo.
        _refreshOutput();
      };
    });

    const r = host.querySelector('#fkReset');
    if (r) r.onclick = () => { delete _vals[_active]; _saveState(); _render(); };
  }

  /** Recalcula solo resultado y veredicto (deja los inputs en paz). */
  function _refreshOutput() {
    const host = document.getElementById('finCalcPanel');
    if (!host) return;
    const L = live(), c = _calc(), f = {};
    c.fields.forEach(fl => { f[fl.k] = _fieldValue(c, fl, L); });

    let out;
    try { out = c.calc(f, L); }
    catch { out = { rows:[['Error en el cálculo','—']], verdict:'Revisá los valores ingresados.' }; }

    const o = host.querySelector('.fk-out');
    const v = host.querySelector('.fk-verdict');
    if (o) o.innerHTML = out.rows.filter(Boolean).map(r =>
      `<div class="fk-row ${r[2] || ''}"><span>${esc(r[0])}</span><b>${esc(r[1])}</b></div>`).join('');
    if (v) v.textContent = out.verdict;
  }

  /* ═════════ Burbuja + panel ═════════ */

  function toggle(force) {
    _open = force == null ? !_open : !!force;
    const p = document.getElementById('finCalcPanel');
    const b = document.getElementById('finCalcBubble');
    if (p) p.classList.toggle('on', _open);
    if (b) {
      b.classList.toggle('on', _open);
      b.setAttribute('aria-expanded', String(_open));
    }
    if (_open) _render();
  }

  function _inject() {
    if (document.getElementById('finCalcBubble')) return;

    const style = document.createElement('style');
    style.textContent = `
#finCalcBubble{position:fixed;bottom:14px;left:14px;z-index:99990;width:48px;height:48px;border-radius:50%;
 border:1px solid var(--bd,#27272a);background:var(--c1,#16161a);color:var(--tx,#fafafa);font-size:20px;
 cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(0,0,0,.45);
 transition:transform .18s cubic-bezier(.4,0,.2,1),border-color .18s,background .18s}
#finCalcBubble:hover{transform:translateY(-2px) scale(1.05);border-color:var(--ac,#8b5cf6);background:var(--el,#222228)}
#finCalcBubble.on{background:var(--ac,#8b5cf6);border-color:var(--ac,#8b5cf6);color:#fff}
#finCalcBubble:focus-visible{outline:2px solid var(--a2,#a78bfa);outline-offset:3px}
#finCalcPanel{position:fixed;bottom:72px;left:14px;z-index:99991;width:min(360px,calc(100vw - 28px));
 max-height:min(78vh,720px);overflow-y:auto;display:none;background:var(--c1,#16161a);
 border:1px solid var(--bd2,#3f3f46);border-radius:12px;padding:14px;
 box-shadow:0 14px 44px rgba(0,0,0,.6);font-family:'IBM Plex Sans',system-ui,sans-serif;
 font-size:13px;color:var(--tx,#fafafa);scrollbar-width:thin}
#finCalcPanel.on{display:block;animation:fkIn .2s cubic-bezier(.4,0,.2,1)}
@keyframes fkIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.fk-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.fk-title{font-family:'Newsreader',serif;font-size:16px;font-weight:600}
.fk-x{background:none;border:none;color:var(--t3,#52525b);font-size:15px;cursor:pointer;padding:2px 5px;border-radius:4px;font-family:inherit}
.fk-x:hover{color:var(--tx,#fafafa);background:var(--el,#222228)}
.fk-live{font-family:'IBM Plex Mono',monospace;font-size:9.5px;color:var(--gn,#22c55e);
 background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.22);border-radius:5px;padding:5px 7px;margin-bottom:10px}
.fk-chips{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px}
.fk-chip{font-size:10.5px;padding:4px 8px;border-radius:5px;border:1px solid var(--bd,#27272a);
 background:var(--el,#222228);color:var(--t2,#a1a1aa);cursor:pointer;font-family:inherit;
 transition:color .15s,border-color .15s,background .15s}
.fk-chip:hover{color:var(--tx,#fafafa);border-color:var(--bd2,#3f3f46)}
.fk-chip.on{background:var(--ac,#8b5cf6);border-color:var(--ac,#8b5cf6);color:#fff}
.fk-chip:focus-visible{outline:2px solid var(--a2,#a78bfa);outline-offset:2px}
.fk-what{background:var(--el,#222228);border-radius:7px;padding:9px 10px;margin-bottom:11px;line-height:1.55}
.fk-what b{display:block;font-size:12.5px;margin-bottom:4px}
.fk-what span{display:block;font-size:11.5px;color:var(--t2,#a1a1aa)}
.fk-fields{display:flex;flex-direction:column;gap:9px;margin-bottom:12px}
.fk-field{display:flex;flex-direction:column;gap:3px}
.fk-l{font-size:11px;color:var(--t2,#a1a1aa)}
.fk-livetag{font-family:'IBM Plex Mono',monospace;font-style:normal;font-size:8.5px;color:var(--gn,#22c55e);
 background:rgba(34,197,94,.1);padding:1px 4px;border-radius:3px;margin-left:3px}
.fk-inwrap{display:flex;align-items:center;gap:5px;background:var(--el,#222228);
 border:1px solid var(--bd,#27272a);border-radius:6px;padding:0 8px;transition:border-color .15s}
.fk-inwrap:focus-within{border-color:var(--ac,#8b5cf6)}
.fk-inwrap i{font-style:normal;font-size:11px;color:var(--t3,#52525b);font-family:'IBM Plex Mono',monospace}
.fk-inwrap input{flex:1;min-width:0;background:none;border:none;color:var(--tx,#fafafa);
 font-family:'IBM Plex Mono',monospace;font-size:13px;padding:8px 0;outline:none;font-variant-numeric:tabular-nums}
.fk-hint{font-size:9.5px;color:var(--t3,#52525b);line-height:1.45}
.fk-out{border-top:1px solid var(--bd,#27272a);padding-top:9px;margin-bottom:10px}
.fk-row{display:flex;justify-content:space-between;align-items:baseline;gap:10px;padding:4px 0;font-size:11.5px;color:var(--t2,#a1a1aa)}
.fk-row b{font-family:'IBM Plex Mono',monospace;font-variant-numeric:tabular-nums;color:var(--tx,#fafafa);font-size:12.5px;white-space:nowrap}
.fk-row.big b{font-size:17px;font-weight:600;letter-spacing:-.02em}
.fk-row.good b{color:var(--gn,#22c55e)}
.fk-row.bad b{color:var(--rd,#ef4444)}
.fk-row.dim{opacity:.65}
.fk-verdict{background:rgba(139,92,246,.08);border-left:2px solid var(--ac,#8b5cf6);
 border-radius:0 6px 6px 0;padding:9px 11px;font-size:11.5px;line-height:1.6;color:var(--t2,#a1a1aa);margin-bottom:10px}
.fk-reset{width:100%;background:none;border:1px dashed var(--bd2,#3f3f46);color:var(--t3,#52525b);
 border-radius:6px;padding:7px;font-size:10.5px;cursor:pointer;font-family:inherit;transition:color .15s,border-color .15s}
.fk-reset:hover{color:var(--t2,#a1a1aa);border-color:var(--t3,#52525b)}
@media (max-width:560px){#finCalcPanel{left:14px;right:14px;width:auto;max-height:72vh}}
@media (prefers-reduced-motion:reduce){#finCalcPanel.on{animation:none}#finCalcBubble{transition:none}}
`;
    document.head.appendChild(style);

    const b = document.createElement('button');
    b.id = 'finCalcBubble';
    b.type = 'button';
    b.textContent = '🧮';
    b.title = 'Calculadora financiera (Alt+C)';
    b.setAttribute('aria-label', 'Abrir calculadora financiera');
    b.setAttribute('aria-expanded', 'false');
    b.onclick = () => toggle();

    const p = document.createElement('div');
    p.id = 'finCalcPanel';
    p.setAttribute('role', 'dialog');
    p.setAttribute('aria-label', 'Calculadora financiera');

    document.body.appendChild(b);
    document.body.appendChild(p);

    document.addEventListener('keydown', e => {
      if (e.altKey && (e.key === 'c' || e.key === 'C')) { e.preventDefault(); toggle(); }
      if (e.key === 'Escape' && _open) toggle(false);
    });

    // Cuando FINCO termina de traer datos, los campos "en vivo" se actualizan.
    window.addEventListener('finco:updated', () => { if (_open) _render(); });
  }

  function init() {
    _loadState();
    _inject();
  }

  return { init, toggle, render: _render, CALCS };
})();

window.FINCALC = FINCALC;
