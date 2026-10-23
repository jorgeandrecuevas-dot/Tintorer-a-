/* Ver y corregir una nota desde el tablero. */
import { leerImagen } from './almacen.js';
import { avisar } from './avisos.js';
import { textoFecha } from './ciclo.js';
import { confirmar } from './confirmar.js';
import { imprimirTicket } from './documentos.js';
import { ETAPAS, NOTAS, anotar, cancelarNota, guardarNotas, ponerEstatus, reactivarNota, registrarPago } from './notas.js';
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

// De lo más nuevo a lo más viejo: lo último que pasó es lo que se quiere ver
function pintarHistorial(n) {
  const lista = document.getElementById('edHistorial');
  lista.innerHTML = '';
  (n.historial || []).slice().reverse().forEach(function (e) {
    const cuando = new Date(e.f);
    const hora = String(cuando.getHours()).padStart(2, '0') + ':' + String(cuando.getMinutes()).padStart(2, '0');
    const li = document.createElement('li');
    li.className = 'py-1 border-bottom';
    const fecha = document.createElement('span');
    fecha.className = 'text-secondary me-2';
    fecha.textContent = textoFecha(cuando) + ' ' + hora;
    li.appendChild(fecha);
    li.appendChild(document.createTextNode(' ' + e.t + (e.q ? ' · ' + e.q : '')));
    lista.appendChild(li);
  });
  document.getElementById('edBloqueHistorial').classList.toggle('d-none', !(n.historial && n.historial.length));
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

  // Una nota cancelada se puede ver y corregir, y se puede reactivar
  const banner = document.getElementById('edBannerCancelada');
  banner.classList.toggle('d-none', !n.cancelada);
  if (n.cancelada) {
    banner.textContent = 'Cancelada el ' + textoFecha(new Date(n.canceladaEl)) +
      (n.motivo ? '. Motivo: ' + n.motivo : '.');
  }
  const botonCancelar = document.getElementById('btnCancelarNota');
  botonCancelar.textContent = n.cancelada ? 'Reactivar nota' : 'Cancelar nota';
  botonCancelar.classList.toggle('btn-outline-danger', !n.cancelada);
  botonCancelar.classList.toggle('btn-outline-success', !!n.cancelada);

  pintarHistorial(n);

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

  // Lo que se corrige queda en el historial, con cómo estaba antes
  const nuevo = {
    folio: folio,
    cliente: document.getElementById('edCliente').value.trim() || 'Sin nombre',
    telefono: document.getElementById('edTelefono').value.trim(),
    observaciones: document.getElementById('edObserva').value.trim()
  };
  [['folio', 'el número'], ['cliente', 'el cliente'], ['telefono', 'el teléfono'], ['observaciones', 'las observaciones']]
    .forEach(function (par) {
      const antes = notaAbierta[par[0]] || '';
      if (nuevo[par[0]] !== antes) {
        anotar(notaAbierta, 'Corrigió ' + par[1] + (par[0] === 'observaciones' ? '' : ': ' + (antes || 'vacío') + ' → ' + nuevo[par[0]]));
      }
    });
  Object.assign(notaAbierta, nuevo);
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

// Esperar a que el cuadro de la nota termine de cerrarse antes de abrir otro
function cerrarCuadroNota() {
  return new Promise(function (listo) {
    cuadroNota.addEventListener('hidden.bs.modal', function () { listo(); }, { once: true });
    bootstrap.Modal.getOrCreateInstance(cuadroNota).hide();
  });
}

document.getElementById('btnCancelarNota').addEventListener('click', function () {
  const nota = notaAbierta;
  if (!nota) return;

  if (nota.cancelada) {
    reactivarNota(nota);
    if (!guardarNotas()) return;
    abrirNota(nota.id);
    avisar('Nota ' + nota.folio + ' reactivada.');
    return;
  }

  cerrarCuadroNota().then(function () {
    return confirmar({
      titulo: 'Cancelar la nota ' + nota.folio,
      texto: nota.cliente + '. La nota se queda guardada con su motivo, pero ya no cuenta en el tablero ni en lo facturado.',
      boton: 'Sí, cancelarla',
      motivo: true,
      casilla: nota.pagado > 0
        ? { texto: 'Se le devolvió lo cobrado (' + pesos(nota.pagado) + ')', marcada: false }
        : null
    });
  }).then(function (r) {
    if (!r.ok) { abrirNota(nota.id); return; }
    cancelarNota(nota, r.motivo, r.casilla);
    if (!guardarNotas()) return;
    avisar('Nota ' + nota.folio + ' cancelada.');
    notaAbierta = null;
  });
});

// Y el mismo ticket, reimpreso desde una nota guardada
document.getElementById('btnAvisarNota').addEventListener('click', function () {
  if (notaAbierta) avisarPorWhatsApp(notaAbierta);
});

document.getElementById('btnTicketNota').addEventListener('click', function () {
  if (!notaAbierta) return;
  imprimirTicket(notaAbierta);
});
