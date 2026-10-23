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

const DIAS  = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

export const DIAS_LARGOS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun',
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
  const dia = new Date(desde);
  const hora = dia.getHours() + dia.getMinutes() / 60;
  if (DIAS_SALIDA.indexOf(dia.getDay()) !== -1 && hora >= horaSalida) {
    dia.setDate(dia.getDate() + 1);                 // ya salió: va en la siguiente
  }
  let regreso = regresoDe(proximaSalida(dia));
  if (tardaMas) regreso = regresoDe(regreso);
  return regreso;
}

export function textoFecha(d) {
  return DIAS[d.getDay()] + ' ' + d.getDate() + ' ' + MESES[d.getMonth()];
}
