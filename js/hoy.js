/* La pantalla de inicio: qué toca hoy. El negocio vive por ciclo (lunes en la
   noche se aparta, martes sale, jueves regresa, se embolsa y se avisa), así
   que lo primero que se ve es lo que hay que hacer, no un menú. */
import { resumenDeHoy } from './agenda.js';
import { DIAS_LARGOS, MESES } from './ciclo.js';
import { ajustes } from './config.js';
import { abrirCola } from './cola.js';
import { el } from './dom.js';
import { irA, registrarVista } from './navegacion.js';
import { NOTAS, sinRecoger } from './notas.js';
import { mostrarLista } from './tablero.js';
import { pesos } from './utilidades.js';

const caja = document.getElementById('hoyTarjetas');
const saludo = document.getElementById('hoyFecha');

function plural(n, uno, varios) {
  return n + ' ' + (n === 1 ? uno : varios);
}

/* Un renglón de la pantalla: número grande, lo que es, un detalle y qué se hace.
   Si no hay nada, se queda apagado y sin botón. */
function tarjeta({ numero, titulo, detalle, boton, alTocar }) {
  const hay = numero > 0;
  return el('div', { class: 'col' },
    el('div', { class: 'card h-100 ' + (hay ? '' : 'tarjeta-hoy-vacia') },
      el('div', { class: 'card-body d-flex flex-column' },
        el('div', { class: 'd-flex align-items-baseline gap-3' },
          el('div', { class: 'display-6 fw-bold lh-1', texto: String(numero) }),
          el('div', { class: 'fw-semibold', texto: titulo })),
        el('div', { class: 'small text-secondary mt-2 flex-grow-1', texto: detalle }),
        hay ? el('button', { type: 'button', class: 'btn btn-outline-primary mt-3 align-self-start', texto: boton, on: { click: alTocar } }) : null)));
}

export function dibujarHoy() {
  const ahora = new Date();
  saludo.textContent = 'Hoy es ' + DIAS_LARGOS[ahora.getDay()] + ' ' + ahora.getDate() + ' de ' + MESES[ahora.getMonth()] + '.';
  caja.innerHTML = '';

  const h = resumenDeHoy(NOTAS, ahora, ajustes().horaSalida);
  if (!h.hayNotas) {
    caja.appendChild(el('div', { class: 'col-12' },
      el('div', { class: 'card' }, el('div', { class: 'card-body' },
        el('p', { class: 'mb-3', texto: 'Todavía no hay notas.' }),
        el('button', { type: 'button', class: 'btn btn-primary', texto: 'Levantar la primera', on: { click: function () { irA('nota'); } } })))));
    return;
  }

  const sinRecogerHoy = NOTAS.filter(sinRecoger).length;

  [
    { numero: h.porMandar.length, titulo: 'Por mandar a la maquila',
      detalle: h.textoSalida + '. ' + h.apartadas + ' de ' + h.porMandar.length + ' apartadas, ' + plural(h.prendasPorMandar, 'prenda', 'prendas') + '.',
      boton: 'Apartar la ropa', alTocar: function () { irA('maquila'); } },
    { numero: h.llegan.length, titulo: 'Regresan hoy',
      detalle: h.atrasadas.length ? plural(h.atrasadas.length, 'nota atrasada', 'notas atrasadas') + '.' : 'Ninguna va atrasada.',
      boton: 'Recibir de vuelta', alTocar: function () { irA('maquila'); } },
    { numero: h.atrasadas.length, titulo: 'Atrasadas en la maquila',
      detalle: 'Ya debían haber regresado.',
      boton: 'Ver en la maquila', alTocar: function () { irA('maquila'); } },
    { numero: h.porEmbolsar.length, titulo: 'Por embolsar',
      detalle: 'Ya regresaron y falta dejarlas listas.',
      boton: 'Ver las notas', alTocar: function () { irA('tablero'); } },
    { numero: h.porAvisar.length, titulo: 'Por avisar',
      detalle: h.sinTelefono ? plural(h.sinTelefono, 'nota sin teléfono', 'notas sin teléfono') + '.' : 'Todas traen su teléfono.',
      boton: 'Avisarles', alTocar: abrirCola },
    { numero: h.porEntregar.length, titulo: 'Por entregar',
      detalle: h.debenLasEmbolsadas > 0 ? 'Deben ' + pesos(h.debenLasEmbolsadas) + ' en total.' : 'Todas están pagadas.',
      boton: 'Ver la lista', alTocar: mostrarLista },
    { numero: sinRecogerHoy, titulo: 'Sin recoger',
      detalle: 'Llevan ' + ajustes().diasSinRecoger + ' días o más embolsadas.',
      boton: 'Ver cuáles', alTocar: mostrarLista }
  ].forEach(function (t) { caja.appendChild(tarjeta(t)); });
}

document.getElementById('btnHoyNota').addEventListener('click', function () { irA('nota'); });

registrarVista('hoy', dibujarHoy);

// Si la tablet se queda abierta de un día para otro, al volver se pone al día
document.addEventListener('visibilitychange', function () {
  if (!document.hidden && !document.getElementById('vista-hoy').classList.contains('d-none')) dibujarHoy();
});
