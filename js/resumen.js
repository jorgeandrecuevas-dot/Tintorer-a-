import { textoFecha } from './ciclo.js';

/* Las cuentas del corte. No toca la pantalla: recibe notas y devuelve números.
   Por eso se puede probar sin abrir el navegador. */

export const PERIODOS = {
  hoy:    'Hoy',
  semana: 'Esta semana',
  mes:    'Este mes',
  todo:   'Todo'
};

function sumarDias(fecha, dias) {
  const d = new Date(fecha);
  d.setDate(d.getDate() + dias);
  return d;
}

/* El periodo va de la medianoche de su primer día a la medianoche del primero
   que ya no cuenta. La semana empieza el lunes. */
export function limitesDelPeriodo(periodo, ahora = new Date()) {
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  if (periodo === 'hoy') return { desde: hoy, hasta: sumarDias(hoy, 1) };
  if (periodo === 'semana') {
    const desde = sumarDias(hoy, -((hoy.getDay() + 6) % 7));
    return { desde: desde, hasta: sumarDias(desde, 7) };
  }
  if (periodo === 'mes') {
    return { desde: new Date(hoy.getFullYear(), hoy.getMonth(), 1),
             hasta: new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1) };
  }
  return { desde: null, hasta: null };
}

// Sin periodo (todo) cae cualquier fecha, hasta una que falte. Con periodo, la
// fecha tiene que existir y estar adentro.
function cae(iso, limites) {
  if (limites.desde === null) return true;
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return t >= limites.desde.getTime() && t < limites.hasta.getTime();
}

// Cuándo se le pagó a la maquila. Las notas viejas no guardaban el día: se usa
// el que se levantó la nota.
function diaDeEnvio(n) {
  if (n.enviadaEl) return n.enviadaEl;
  return n.estatus === 'recibida' ? null : n.creada;
}

function fueEnviada(n) {
  return !!n.enviadaEl || n.estatus !== 'recibida';
}

/* Lo que entró, lo que salió y lo que quedó.

   - Facturado: lo que valen las notas que se levantaron en el periodo.
   - Cobrado: el dinero que entró en el periodo, según los pagos con fecha.
   - Por cobrar: lo que se debe hoy, de todas las notas. No es del periodo.
   - A maquila: lo que se le pagó en el periodo. Se paga al mandar la ropa.
   - Utilidad en caja: cobrado menos maquila. Lo que quedó en la mano.
   - Si cobran todo: facturado menos lo que cuesta lo facturado.

   Una nota cancelada no se factura. Lo que ya se cobró y lo que ya se le pagó
   a la maquila se queda, porque ese dinero ya se movió. */
export function resumenCorte(notas, periodo, ahora = new Date()) {
  const limites = limitesDelPeriodo(periodo, ahora);
  let facturado = 0, cobrado = 0, maquila = 0, costoFacturado = 0, porCobrar = 0, piezas = 0;
  const delPeriodo = [];

  notas.forEach(function (n) {
    const viva = !n.cancelada;
    const levantada = cae(n.creada, limites);
    const pagos = (n.pagos || []).filter(function (p) { return cae(p.f, limites); });
    const mandada = fueEnviada(n) && cae(diaDeEnvio(n), limites);

    cobrado += pagos.reduce(function (s, p) { return s + p.monto; }, 0);
    if (mandada) maquila += n.costo;
    if (viva) porCobrar += n.saldo;
    if (viva && levantada) {
      facturado += n.total;
      costoFacturado += n.costo;
      piezas += n.piezas;
    }
    if (levantada || mandada || pagos.length || cae(n.entregadaEl, limites)) {
      delPeriodo.push(n);
    }
  });

  return {
    facturado: facturado,
    cobrado: cobrado,
    porCobrar: porCobrar,
    maquila: maquila,
    utilidadCaja: cobrado - maquila,
    utilidadSiCobran: facturado - costoFacturado,
    piezas: piezas,
    notas: delPeriodo,
    desde: limites.desde,
    hasta: limites.hasta
  };
}

// «jue 22 oct» o «lun 19 oct al dom 25 oct»
export function textoRango(r) {
  if (!r.desde) return 'Desde la primera nota';
  const ultimo = new Date(r.hasta);
  ultimo.setDate(ultimo.getDate() - 1);
  const dia = textoFecha(r.desde);
  return r.hasta.getTime() - r.desde.getTime() <= 86400000 * 1.01
    ? dia
    : dia + ' al ' + textoFecha(ultimo);
}
