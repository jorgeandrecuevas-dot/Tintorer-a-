/* Ver y corregir una nota desde el tablero. */
import { borrarImagenes, leerImagen } from './almacen.js';
import { avisar } from './avisos.js';
import { imprimirTicket } from './documentos.js';
import { ETAPAS, NOTAS, guardarNotas, imagenesDeNota, ponerEstatus, reemplazarNotas, registrarPago } from './notas.js';
import { pesos } from './utilidades.js';
import { avisarPorWhatsApp } from './whatsapp.js';

/* -------------------------------------------------------------------------
   8.1 VER Y CORREGIR UNA NOTA

   Se abre tocándola en el tablero. Hasta ahora una nota mal capturada se
   quedaba mal para siempre: solo se podía avanzar de etapa.
   ------------------------------------------------------------------------- */

const cuadroNota = document.getElementById('modalNota');

let notaAbierta = null;

// El menú de etapas se llena una vez con las mismas cinco del tablero
const selEstatus = document.getElementById('edEstatus');

ETAPAS.forEach(function (e) {
  const opcion = document.createElement('option');
  opcion.value = e.id;
  opcion.textContent = e.nombre;
  selEstatus.appendChild(opcion);
});

// Recibe el nombre de la imagen, no la imagen. Va al almacén por ella y la
// pone cuando llega.
function miniatura(nombre, alto) {
  const col = document.createElement('div');
  col.className = 'col';
  const img = document.createElement('img');
  img.alt = '';
  img.className = 'img-fluid rounded border';
  if (alto) img.style.background = '#fff';
  col.appendChild(img);

  leerImagen(nombre).then(function (src) {
    if (src) { img.src = src; return; }
    const hueco = document.createElement('div');
    hueco.className = 'foto-fallida';
    hueco.textContent = 'No se encontró esta imagen';
    col.innerHTML = '';
    col.appendChild(hueco);
  });
  return col;
}

function pintarSaldoEditado() {
  if (!notaAbierta) return;
  const recibido = Math.min(notaAbierta.total,
    Math.max(0, parseFloat(document.getElementById('edRecibido').value) || 0));
  document.getElementById('edSaldo').textContent = pesos(notaAbierta.total - recibido);
}

export function abrirNota(id) {
  notaAbierta = NOTAS.find(function (n) { return n.id === id; });
  if (!notaAbierta) return;
  const n = notaAbierta;

  document.getElementById('tituloNota').textContent = 'Nota ' + n.folio;
  document.getElementById('edFolio').value = n.folio || '';
  document.getElementById('edCliente').value = n.cliente || '';
  document.getElementById('edTelefono').value = n.telefono || '';
  document.getElementById('edObserva').value = n.observaciones || '';
  selEstatus.value = n.estatus;

  document.getElementById('edDetalle').textContent = n.detalle || 'Sin desglose';
  document.getElementById('edPiezas').textContent = n.piezas;
  document.getElementById('edEntrega').textContent = n.entrega || '—';
  document.getElementById('edTotal').textContent = pesos(n.total);
  document.getElementById('edRecibido').value = n.pagado;
  document.getElementById('edSaldo').textContent = pesos(n.saldo);

  const hayFaltantes = n.faltan > 0;
  document.getElementById('edFilaFaltan').classList.toggle('d-none', !hayFaltantes);
  if (hayFaltantes) document.getElementById('edFaltan').textContent = n.faltan;

  const cajaFotos = document.getElementById('edFotos');
  cajaFotos.innerHTML = '';
  (n.fotos || []).forEach(function (f) { cajaFotos.appendChild(miniatura(f)); });
  document.getElementById('edBloqueFotos')
    .classList.toggle('d-none', !(n.fotos && n.fotos.length));

  const cajaFirmas = document.getElementById('edFirmas');
  cajaFirmas.innerHTML = '';
  [['firmaRecibido', 'De recibido'], ['firmaEntrega', 'De entregado']].forEach(function (par) {
    if (!n[par[0]]) return;
    const col = document.createElement('div');
    col.className = 'col-6';
    const pie = document.createElement('div');
    pie.className = 'small text-secondary';
    pie.textContent = par[1];
    const marco = miniatura(n[par[0]], true);
    marco.className = '';
    col.appendChild(marco);
    col.appendChild(pie);
    cajaFirmas.appendChild(col);
  });
  document.getElementById('edBloqueFirmas')
    .classList.toggle('d-none', cajaFirmas.children.length === 0);

  bootstrap.Modal.getOrCreateInstance(cuadroNota).show();
}

document.getElementById('edRecibido').addEventListener('input', pintarSaldoEditado);

document.getElementById('btnGuardarNota').addEventListener('click', function () {
  if (!notaAbierta) return;

  const folio = document.getElementById('edFolio').value.trim();
  if (folio === '') { avisar('La nota necesita su número.'); return; }

  notaAbierta.folio = folio;
  notaAbierta.cliente = document.getElementById('edCliente').value.trim() || 'Sin nombre';
  notaAbierta.telefono = document.getElementById('edTelefono').value.trim();
  notaAbierta.observaciones = document.getElementById('edObserva').value.trim();
  // Solo si cambió: guardar otra corrección no debe reiniciar los días
  if (selEstatus.value !== notaAbierta.estatus) ponerEstatus(notaAbierta, selEstatus.value);

  const recibido = Math.min(notaAbierta.total,
    Math.max(0, parseFloat(document.getElementById('edRecibido').value) || 0));
  // Corregir lo recibido queda como un pago de ajuste, con su fecha: el corte
  // sabe qué pasó y no solo cuánto hay
  registrarPago(notaAbierta, recibido - notaAbierta.pagado, 'ajuste');

  if (!guardarNotas()) return;

  bootstrap.Modal.getOrCreateInstance(cuadroNota).hide();
  avisar('Nota ' + notaAbierta.folio + ' corregida.');
  notaAbierta = null;
});

document.getElementById('btnBorrarNota').addEventListener('click', function () {
  if (!notaAbierta) return;
  const seguro = window.confirm('Se va a borrar la nota ' + notaAbierta.folio +
    ' de ' + notaAbierta.cliente + '.\n\nEsto no se puede deshacer. ¿Seguro?');
  if (!seguro) return;

  borrarImagenes(imagenesDeNota(notaAbierta));
  reemplazarNotas(NOTAS.filter(function (n) { return n.id !== notaAbierta.id; }));
  guardarNotas();
  bootstrap.Modal.getOrCreateInstance(cuadroNota).hide();
  avisar('Nota borrada.');
  notaAbierta = null;
});

// Y el mismo ticket, reimpreso desde una nota guardada
document.getElementById('btnAvisarNota').addEventListener('click', function () {
  if (notaAbierta) avisarPorWhatsApp(notaAbierta);
});

document.getElementById('btnTicketNota').addEventListener('click', function () {
  if (!notaAbierta) return;
  imprimirTicket(notaAbierta);
});
