/* Qué toca hoy, según el ciclo de la semana y las notas que hay. No toca la
   pantalla: recibe notas y una fecha y devuelve números y listas. */
import { DIAS_LARGOS, MESES, diasEntre, proximaSalidaDesde } from './ciclo.js';
import { telefonoWhatsApp } from './mensajes.js';

const dia = (iso) => (iso ? new Date(iso) : null);

export function resumenDeHoy(notas, ahora = new Date(), horaSalida = 7) {
  const vivas = notas.filter(function (n) { return !n.cancelada; });

  const salida = proximaSalidaDesde(ahora, horaSalida);
  const faltan = diasEntre(ahora, salida);

  const porMandar = vivas.filter(function (n) { return n.estatus === 'recibida'; });
  const enMaquila = vivas.filter(function (n) { return n.estatus === 'maquila'; });
  // Una nota sin fecha de regreso (de antes de que se guardara) no se puede
  // decir si llega hoy: no entra en ninguna de las dos listas
  const llegan = enMaquila.filter(function (n) { return n.regresaISO && diasEntre(ahora, n.regresaISO) === 0; });
  const atrasadas = enMaquila.filter(function (n) { return n.regresaISO && diasEntre(ahora, n.regresaISO) < 0; });

  const embolsadas = vivas.filter(function (n) { return n.estatus === 'lista'; });
  const porAvisar = embolsadas.filter(function (n) { return !n.avisadaEl && telefonoWhatsApp(n.telefono); });

  return {
    salida: salida,
    diasParaSalir: faltan,
    textoSalida: faltan === 0 ? 'Hoy sale el carro'
               : faltan === 1 ? 'Mañana sale el carro'
               : 'Sale el ' + DIAS_LARGOS[salida.getDay()] + ' ' + salida.getDate() + ' ' + MESES[salida.getMonth()],
    porMandar: porMandar,
    apartadas: porMandar.filter(function (n) { return n.apartada; }).length,
    prendasPorMandar: porMandar.reduce(function (s, n) { return s + n.piezas; }, 0),
    llegan: llegan,
    atrasadas: atrasadas,
    porEmbolsar: vivas.filter(function (n) { return n.estatus === 'devuelta'; }),
    porAvisar: porAvisar,
    sinTelefono: embolsadas.filter(function (n) { return !n.avisadaEl && !telefonoWhatsApp(n.telefono); }).length,
    porEntregar: embolsadas,
    debenLasEmbolsadas: embolsadas.reduce(function (s, n) { return s + n.saldo; }, 0),
    hayNotas: notas.length > 0,
    fecha: dia(ahora.toISOString())
  };
}
