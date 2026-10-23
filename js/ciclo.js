/* El ciclo de la semana: cuándo sale la ropa a la maquila y cuándo regresa. */
/* -------------------------------------------------------------------------
   3. EL CICLO DE LA SEMANA

   La ropa sale a la maquila los martes, jueves y sábados, y lo que sale un
   día vuelve el día de salida siguiente: lo del martes vuelve el jueves, lo
   del jueves el sábado, lo del sábado el martes. Los cobertores y edredones
   tardan más, así que saltan un ciclo.
   ------------------------------------------------------------------------- */

const DIAS_SALIDA = [2, 4, 6];                 // martes, jueves, sábado

export const TARDAN_MAS  = ['cobertores', 'edredones'];

export const DIAS  = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

export const DIAS_LARGOS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

export const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun',
               'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function proximaSalida(desde) {
  const d = new Date(desde);
  for (let i = 0; i < 8; i++) {
    if (DIAS_SALIDA.indexOf(d.getDay()) !== -1) return d;
    d.setDate(d.getDate() + 1);
  }
  return d;
}

// Lo que sale un día de salida vuelve en el día de salida siguiente
export function regresoDe(salida) {
  const d = new Date(salida);
  d.setDate(d.getDate() + 1);
  return proximaSalida(d);
}

// A qué hora sale el carro a la maquila. Los apuntes dicen martes a las 7 am.
// Para jueves y sábado no se sabe: se usa la misma hora hasta que el dueño la
// diga. Se puede cambiar en Ajustes.
export const HORA_SALIDA = 7;

/* La fecha que se le promete al cliente. Una nota levantada el martes a las
   3 de la tarde no alcanza el carro de las 7 am: sale el jueves y regresa el
   sábado. Sin esto se le prometía el jueves, un ciclo antes de lo real. */
export function fechaEntrega(desde, tardaMas, horaSalida = HORA_SALIDA) {
  let regreso = regresoDe(proximaSalidaDesde(desde, horaSalida));
  if (tardaMas) regreso = regresoDe(regreso);
  return regreso;
}

// La próxima salida que todavía no se va. Si hoy es día de salida y ya pasó la
// hora, es la siguiente.
export function proximaSalidaDesde(desde, horaSalida = HORA_SALIDA) {
  const dia = new Date(desde);
  const hora = dia.getHours() + dia.getMinutes() / 60;
  if (DIAS_SALIDA.indexOf(dia.getDay()) !== -1 && hora >= horaSalida) {
    dia.setDate(dia.getDate() + 1);
  }
  return proximaSalida(dia);
}

function inicioDelDia(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// Cuántos días de calendario hay de una fecha a otra. De hoy a mañana, 1.
export function diasEntre(desde, hasta) {
  return Math.round((inicioDelDia(new Date(hasta)) - inicioDelDia(new Date(desde))) / 86400000);
}

export function textoFecha(d) {
  return DIAS[d.getDay()] + ' ' + d.getDate() + ' ' + MESES[d.getMonth()];
}
