/* Avisarle al cliente que su ropa ya está, por WhatsApp. */
import { avisar } from './avisos.js';
import { NOTAS, escribirNotas } from './notas.js';
import { pesos } from './utilidades.js';

/* -------------------------------------------------------------------------
   8. TABLERO
   ------------------------------------------------------------------------- */

/* Avisarle al cliente que su ropa ya está.

   El teléfono se capturaba y no servía de nada. Con la ropa embolsada, un
   mensaje vacía el mostrador más rápido que esperar a que pasen. Abre
   WhatsApp con el texto ya escrito y el que atiende solo le da enviar. No
   hay servidor de por medio: el mensaje sale de la propia cuenta del negocio. */

function telefonoWhatsApp(tel) {
  const d = (tel || '').replace(/\D/g, '');
  if (d.length === 10) return '52' + d;
  if (d.length === 12 && d.slice(0, 2) === '52') return d;
  if (d.length === 13 && d.slice(0, 3) === '521') return '52' + d.slice(3);
  return null;
}

function mensajeDeAviso(n) {
  const nombre = (n.cliente || '').trim().split(/\s+/)[0];
  const saludo = nombre && nombre !== 'Sin' ? 'Hola ' + nombre + ', ' : 'Hola, ';
  let texto = saludo + 'tu ropa ya está lista (nota ' + n.folio + '). ' +
              'Pasa por ella cuando quieras.';
  if (n.saldo > 0) texto += ' Quedan ' + pesos(n.saldo) + ' por pagar.';
  return texto;
}

export function avisarPorWhatsApp(n) {
  const numero = telefonoWhatsApp(n.telefono);
  if (!numero) {
    avisar(n.telefono
      ? 'El teléfono de la nota ' + n.folio + ' no se entiende. Corrígelo en la nota.'
      : 'La nota ' + n.folio + ' no tiene teléfono.');
    return;
  }

  const url = 'https://wa.me/' + numero + '?text=' + encodeURIComponent(mensajeDeAviso(n));
  const ventana = window.open(url, '_blank', 'noopener');
  if (!ventana) { avisar('No se pudo abrir WhatsApp.'); return; }

  n.avisadaEl = new Date().toISOString();
  escribirNotas(NOTAS);
}
