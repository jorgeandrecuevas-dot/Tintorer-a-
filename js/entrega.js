/* Entregar la ropa: cobrar el saldo y firmar de entregado. */
import { guardarImagen } from './almacen.js';
import { avisar } from './avisos.js';
import { firmaEntrega } from './firmas.js';
import { NOTAS, guardarNotas, ponerEstatus, registrarPago } from './notas.js';
import { pesos } from './utilidades.js';

/* -------------------------------------------------------------------------
   8.1 ENTREGAR LA ROPA

   El cliente viene por su ropa, paga lo que debe y firma de entregado. Es la
   segunda firma del punto 20: una al dejarla y otra al recogerla.
   ------------------------------------------------------------------------- */

const cuadroEntrega = document.getElementById('modalEntrega');

let notaEnEntrega = null;

export function abrirEntrega(id) {
  notaEnEntrega = NOTAS.find(function (n) { return n.id === id; });
  if (!notaEnEntrega) return;

  document.getElementById('entregaNota').textContent =
    notaEnEntrega.folio + ' · ' + notaEnEntrega.cliente;
  document.getElementById('entregaDetalle').textContent =
    notaEnEntrega.piezas + (notaEnEntrega.piezas === 1 ? ' pieza · ' : ' piezas · ') +
    (notaEnEntrega.detalle || '');
  document.getElementById('entregaSaldo').textContent = pesos(notaEnEntrega.saldo);

  firmaEntrega.limpiar();
  bootstrap.Modal.getOrCreateInstance(cuadroEntrega).show();
}

// El canvas está escondido hasta que se abre el cuadro, y un canvas sin
// ancho visible mide cero. Se ajusta cuando ya se está viendo.
cuadroEntrega.addEventListener('shown.bs.modal', firmaEntrega.ajustar);

document.getElementById('btnConfirmarEntrega').addEventListener('click', function () {
  if (!notaEnEntrega) return;

  if (!firmaEntrega.tiene()) {
    avisar('Falta que el cliente firme de entregado.');
    return;
  }

  const nota = notaEnEntrega;
  guardarImagen(firmaEntrega.imagen()).then(function (nombre) {
    nota.firmaEntrega = nombre;
    registrarPago(nota, nota.total - nota.pagado, 'liquidacion');   // al recoger se liquida
    ponerEstatus(nota, 'entregada');
    if (!guardarNotas()) return;

    bootstrap.Modal.getOrCreateInstance(cuadroEntrega).hide();
    avisar(nombre
      ? 'Nota ' + nota.folio + ' entregada.'
      : 'Nota ' + nota.folio + ' entregada, pero la firma no se guardó.');
  });
  notaEnEntrega = null;
});
