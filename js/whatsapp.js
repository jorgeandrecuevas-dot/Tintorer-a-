/* Avisarle al cliente que su ropa ya está, por WhatsApp. */
import { avisar } from './avisos.js';
import { anotar, guardarNotas } from './notas.js';
import { direccionDeWhatsApp } from './mensajes.js';

/* Avisarle al cliente que su ropa ya está.

   El teléfono se capturaba y no servía de nada. Con la ropa embolsada, un
   mensaje vacía el mostrador más rápido que esperar a que pasen. Abre
   WhatsApp con el texto ya escrito y el que atiende solo le da enviar. No
   hay servidor de por medio: el mensaje sale de la propia cuenta del negocio. */

// Devuelve true si abrió WhatsApp y la nota quedó marcada como avisada
export function avisarPorWhatsApp(n) {
  const url = direccionDeWhatsApp(n);
  if (!url) {
    avisar(n.telefono
      ? 'El teléfono de la nota ' + n.folio + ' no se entiende. Corrígelo en la nota.'
      : 'La nota ' + n.folio + ' no tiene teléfono.');
    return false;
  }

  const ventana = window.open(url, '_blank', 'noopener');
  if (!ventana) { avisar('No se pudo abrir WhatsApp.'); return false; }

  n.avisadaEl = new Date().toISOString();
  anotar(n, 'Se le avisó por WhatsApp');
  guardarNotas();
  return true;
}
