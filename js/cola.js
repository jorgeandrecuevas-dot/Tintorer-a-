/* Avisar a varios clientes de corrido.

   Con la ropa embolsada el jueves, avisarle uno por uno eran doce veces el
   mismo camino. La cola pone al primero, abre WhatsApp con su mensaje y, al
   volver, ya trae al siguiente. Saltar deja al cliente sin avisar. */
import { avisar } from './avisos.js';
import { el } from './dom.js';
import { mensajeDeAviso, telefonoWhatsApp } from './mensajes.js';
import { NOTAS } from './notas.js';
import { avisarPorWhatsApp } from './whatsapp.js';

const cuadro = document.getElementById('modalCola');
const progreso = document.getElementById('colaProgreso');
const tarjeta = document.getElementById('colaTarjeta');
const botonAbrir = document.getElementById('btnColaAbrir');
const botonSaltar = document.getElementById('btnColaSaltar');

let lista = [];
let lugar = 0;
let avisados = 0;

// A quién toca avisar: lo embolsado que no se ha avisado y trae un teléfono que sirve
export function pendientesDeAviso() {
  return NOTAS.filter(function (n) {
    return !n.cancelada && n.estatus === 'lista' && !n.avisadaEl && telefonoWhatsApp(n.telefono);
  });
}

function pintar() {
  tarjeta.innerHTML = '';
  if (lugar >= lista.length) { terminar(); return; }

  const n = lista[lugar];
  progreso.textContent = (lugar + 1) + ' de ' + lista.length;
  tarjeta.appendChild(el('div', { class: 'fw-semibold fs-5', texto: n.folio + ' · ' + n.cliente }));
  tarjeta.appendChild(el('div', { class: 'text-secondary mb-2', texto: n.telefono }));
  tarjeta.appendChild(el('div', { class: 'border rounded p-2 bg-body-tertiary', texto: mensajeDeAviso(n) }));
}

function terminar() {
  bootstrap.Modal.getOrCreateInstance(cuadro).hide();
  avisar(avisados === 0
    ? 'No se avisó a nadie.'
    : avisados === 1 ? 'Se avisó a 1 cliente.' : 'Se avisó a ' + avisados + ' clientes.');
}

export function abrirCola() {
  lista = pendientesDeAviso();
  if (lista.length === 0) { avisar('No hay a quién avisar.'); return; }
  lugar = 0;
  avisados = 0;
  pintar();
  bootstrap.Modal.getOrCreateInstance(cuadro).show();
}

botonAbrir.addEventListener('click', function () {
  const n = lista[lugar];
  if (!n) return;
  // Si WhatsApp no abre (o no hay teléfono) se queda en el mismo cliente
  if (avisarPorWhatsApp(n)) { avisados++; lugar++; pintar(); }
});

botonSaltar.addEventListener('click', function () {
  lugar++;
  pintar();
});
