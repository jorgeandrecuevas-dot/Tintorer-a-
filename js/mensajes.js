/* El aviso al cliente: a qué número y qué se le dice. No toca la pantalla. */
import { pesos } from './utilidades.js';

// El número como lo pide WhatsApp: 52 y diez dígitos. Acepta espacios, guiones,
// el +52 y el viejo 521. Si no se entiende, devuelve null.
export function telefonoWhatsApp(tel) {
  const d = (tel || '').replace(/\D/g, '');
  if (d.length === 10) return '52' + d;
  if (d.length === 12 && d.slice(0, 2) === '52') return d;
  if (d.length === 13 && d.slice(0, 3) === '521') return '52' + d.slice(3);
  return null;
}

export function mensajeDeAviso(n) {
  const nombre = (n.cliente || '').trim().split(/\s+/)[0];
  const saludo = nombre && nombre !== 'Sin' ? 'Hola ' + nombre + ', ' : 'Hola, ';
  let texto = saludo + 'tu ropa ya está lista (nota ' + n.folio + '). ' +
              'Pasa por ella cuando quieras.';
  if (n.saldo > 0) texto += ' Quedan ' + pesos(n.saldo) + ' por pagar.';
  return texto;
}

export function direccionDeWhatsApp(n) {
  const numero = telefonoWhatsApp(n.telefono);
  return numero ? 'https://wa.me/' + numero + '?text=' + encodeURIComponent(mensajeDeAviso(n)) : null;
}
