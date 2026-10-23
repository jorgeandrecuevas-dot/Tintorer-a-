/* El tablero: las cinco etapas, la lista de entregas y el buscador de notas. */
import { textoFecha } from './ciclo.js';
import { abrirEntrega } from './entrega.js';
import { abrirNota } from './modalNota.js';
import { irA, registrarVista } from './navegacion.js';
import { ETAPAS, NOTAS, diasEmbolsada, escribirNotas, ponerEstatus, sinRecoger, textoHace } from './notas.js';
import { pesos, sinAcentos } from './utilidades.js';
import { avisarPorWhatsApp } from './whatsapp.js';

function tarjetaNota(n) {
  const li = document.createElement('li');
  li.className = 'list-group-item nota-tocable';
  li.tabIndex = 0;
  li.setAttribute('role', 'button');
  li.setAttribute('aria-label', 'Ver la nota ' + n.folio + ' de ' + n.cliente);
  li.addEventListener('click', function () { abrirNota(n.id); });
  li.addEventListener('keydown', function (evento) {
    if (evento.key === 'Enter' || evento.key === ' ') { evento.preventDefault(); abrirNota(n.id); }
  });

  const titulo = document.createElement('div');
  titulo.className = 'fw-semibold';
  titulo.textContent = n.folio + ' · ' + n.cliente;

  const pie = document.createElement('small');
  pie.className = 'text-secondary';
  pie.textContent = n.piezas + (n.piezas === 1 ? ' pieza · ' : ' piezas · ') + pesos(n.total);

  li.appendChild(titulo);
  li.appendChild(pie);

  if (n.saldo > 0) {
    const saldo = document.createElement('div');
    saldo.className = 'badge text-bg-warning mt-1';
    saldo.textContent = 'Debe ' + pesos(n.saldo);
    li.appendChild(saldo);
  }
  if (n.faltan > 0) {
    const falta = document.createElement('div');
    falta.className = 'badge text-bg-danger mt-1';
    falta.textContent = (n.faltan === 1 ? 'Falta ' : 'Faltan ') + n.faltan +
                        (n.faltan === 1 ? ' prenda' : ' prendas');
    li.appendChild(falta);
  }
  if (n.observaciones) {
    const obs = document.createElement('div');
    obs.className = 'small text-danger mt-1';
    obs.textContent = n.observaciones;
    li.appendChild(obs);
  }

  // Lo que regresó de la maquila se embolsa antes de entregarlo
  if (n.estatus === 'devuelta') {
    const embolsar = document.createElement('button');
    embolsar.className = 'btn btn-sm btn-outline-success w-100 mt-2';
    embolsar.textContent = 'Ya está embolsada';
    embolsar.addEventListener('click', function (evento) {
      evento.stopPropagation();
      ponerEstatus(n, 'lista');
      escribirNotas(NOTAS);
      dibujarTablero();
    });
    li.appendChild(embolsar);
  }

  // Lo embolsado es lo que el cliente puede venir a recoger
  if (n.estatus === 'lista') {
    const dias = diasEmbolsada(n);
    if (dias !== null) {
      const espera = document.createElement('div');
      espera.className = 'small text-secondary mt-1';
      espera.textContent = 'Embolsada ' + textoHace(dias);
      li.appendChild(espera);
    }
    if (sinRecoger(n)) {
      const marca = document.createElement('div');
      marca.className = 'badge text-bg-danger mt-1';
      marca.textContent = 'Sin recoger';
      li.appendChild(marca);
    }
    if (n.avisadaEl) {
      const avisada = document.createElement('div');
      avisada.className = 'small text-success mt-1';
      avisada.textContent = 'Avisada ' + textoFecha(new Date(n.avisadaEl));
      li.appendChild(avisada);
    }

    const botones = document.createElement('div');
    botones.className = 'd-flex gap-2 mt-2';

    const avisarle = document.createElement('button');
    avisarle.className = 'btn btn-sm btn-outline-success flex-fill';
    avisarle.textContent = 'Avisarle';
    avisarle.addEventListener('click', function (evento) {
      evento.stopPropagation();
      avisarPorWhatsApp(n);
    });

    const entregar = document.createElement('button');
    entregar.className = 'btn btn-sm btn-primary flex-fill';
    entregar.textContent = n.saldo > 0 ? 'Cobrar y entregar' : 'Entregar';
    entregar.addEventListener('click', function (evento) {
      evento.stopPropagation();        // si no, también abre el cuadro de la nota
      abrirEntrega(n.id);
    });

    botones.appendChild(avisarle);
    botones.appendChild(entregar);
    li.appendChild(botones);
  }
  return li;
}

// Lo que el mostrador tiene escrito en el buscador del tablero
let loQueBusca = '';

// Busca por número de nota o por cliente. Sin pedir acentos: en la tablet
// nadie va a escribir "Díaz" con tilde.
function notaCoincide(n, texto) {
  if (texto === '') return true;
  return sinAcentos(n.folio + ' ' + n.cliente).indexOf(texto) !== -1;
}

// "etapas" son las cinco columnas. "lista" es la lista de entregas.
let modoTablero = 'etapas';

function pintarModo() {
  document.getElementById('modoEtapas').classList.toggle('active', modoTablero === 'etapas');
  document.getElementById('modoLista').classList.toggle('active', modoTablero === 'lista');
}

document.getElementById('modoEtapas').addEventListener('click', function () {
  modoTablero = 'etapas'; dibujarTablero();
});

document.getElementById('modoLista').addEventListener('click', function () {
  modoTablero = 'lista'; dibujarTablero();
});

export function dibujarTablero() {
  const cajon = document.getElementById('columnas');
  const cajaLista = document.getElementById('listaEntregas');
  cajon.innerHTML = '';
  cajaLista.innerHTML = '';
  pintarModo();

  const vacio = NOTAS.length === 0;
  document.getElementById('tableroVacio').classList.toggle('d-none', !vacio);
  document.getElementById('filaBuscarNota').classList.toggle('d-none', vacio);
  cajon.classList.toggle('d-none', vacio || modoTablero === 'lista');
  cajaLista.classList.toggle('d-none', vacio || modoTablero !== 'lista');
  document.getElementById('sinResultadosNota').classList.add('d-none');
  if (vacio) { document.getElementById('cuentaBusqueda').textContent = ''; return; }

  const buscado = sinAcentos(loQueBusca.trim());
  const halladas = NOTAS.filter(function (n) { return notaCoincide(n, buscado); });

  const letrero = document.getElementById('cuentaBusqueda');
  if (buscado === '') {
    letrero.textContent = '';
  } else {
    letrero.textContent = halladas.length === 1
      ? '1 nota de ' + NOTAS.length
      : halladas.length + ' notas de ' + NOTAS.length;
  }

  if (halladas.length === 0) {
    cajon.classList.add('d-none');
    cajaLista.classList.add('d-none');
    document.getElementById('sinResultadosNota').classList.remove('d-none');
    return;
  }

  if (modoTablero === 'lista') { dibujarLista(halladas); return; }

  ETAPAS.forEach(function (etapa) {
    const deEsta = halladas.filter(function (n) { return n.estatus === etapa.id; });

    const col = document.createElement('div');
    col.className = 'col';

    const tarjeta = document.createElement('div');
    tarjeta.className = 'card h-100';

    const cabeza = document.createElement('div');
    cabeza.className = 'card-header d-flex justify-content-between align-items-center';
    const nombre = document.createElement('span');
    nombre.className = 'fw-semibold';
    nombre.textContent = etapa.nombre;
    const cuenta = document.createElement('span');
    cuenta.className = 'badge text-bg-' + etapa.color;
    cuenta.textContent = deEsta.length;
    cabeza.appendChild(nombre);
    cabeza.appendChild(cuenta);

    const lista = document.createElement('ul');
    lista.className = 'list-group list-group-flush';
    deEsta.forEach(function (n) { lista.appendChild(tarjetaNota(n)); });

    tarjeta.appendChild(cabeza);
    tarjeta.appendChild(lista);
    col.appendChild(tarjeta);
    cajon.appendChild(col);
  });
}

/* La lista de entregas.

   El punto 11 pide un checklist de las notas entregadas y las pendientes. Las
   columnas dicen en qué etapa va cada nota. Esto dice qué falta por darle a
   la gente. Primero la ropa que ya está embolsada, y dentro de ella la que
   lleva más días esperando. */

function filaEntrega(n) {
  const hecha = n.estatus === 'entregada';
  const li = document.createElement('li');
  li.className = 'list-group-item nota-tocable d-flex align-items-center gap-3' +
                 (hecha ? ' fila-hecha' : '');
  li.tabIndex = 0;
  li.setAttribute('role', 'button');
  li.setAttribute('aria-label', 'Ver la nota ' + n.folio + ' de ' + n.cliente);
  li.addEventListener('click', function () { abrirNota(n.id); });
  li.addEventListener('keydown', function (evento) {
    if (evento.key === 'Enter' || evento.key === ' ') { evento.preventDefault(); abrirNota(n.id); }
  });

  const caja = document.createElement('span');
  caja.className = 'caja-entrega' + (hecha ? ' hecha' : '');
  caja.setAttribute('aria-hidden', 'true');
  li.appendChild(caja);

  const centro = document.createElement('div');
  centro.className = 'flex-grow-1 min-w-0';
  const titulo = document.createElement('div');
  titulo.className = 'fw-semibold';
  titulo.textContent = n.folio + ' · ' + n.cliente;
  const datos = document.createElement('small');
  datos.className = 'text-secondary';
  datos.textContent = n.piezas + (n.piezas === 1 ? ' pieza · ' : ' piezas · ') + pesos(n.total);
  centro.appendChild(titulo);
  centro.appendChild(datos);

  const etiquetas = document.createElement('div');
  etiquetas.className = 'mt-1';
  const etapa = ETAPAS.find(function (e) { return e.id === n.estatus; });
  const marcaEtapa = document.createElement('span');
  marcaEtapa.className = 'badge me-1 text-bg-' + (etapa ? etapa.color : 'secondary');
  marcaEtapa.textContent = etapa ? etapa.nombre : n.estatus;
  etiquetas.appendChild(marcaEtapa);

  if (!hecha && n.saldo > 0) {
    const debe = document.createElement('span');
    debe.className = 'badge me-1 text-bg-warning';
    debe.textContent = 'Debe ' + pesos(n.saldo);
    etiquetas.appendChild(debe);
  }
  const dias = diasEmbolsada(n);
  if (dias !== null) {
    const espera = document.createElement('span');
    espera.className = 'badge me-1 ' + (sinRecoger(n) ? 'text-bg-danger' : 'text-bg-light border');
    espera.textContent = sinRecoger(n) ? 'Sin recoger · ' + dias + ' días'
                                       : 'Embolsada ' + textoHace(dias);
    etiquetas.appendChild(espera);
  }
  if (n.avisadaEl && n.estatus === 'lista') {
    const avisada = document.createElement('span');
    avisada.className = 'badge me-1 text-bg-success';
    avisada.textContent = 'Avisada ' + textoFecha(new Date(n.avisadaEl));
    etiquetas.appendChild(avisada);
  }
  centro.appendChild(etiquetas);
  li.appendChild(centro);

  if (n.estatus === 'lista') {
    const botones = document.createElement('div');
    botones.className = 'd-flex gap-2 flex-shrink-0';

    const avisarle = document.createElement('button');
    avisarle.type = 'button';
    avisarle.className = 'btn btn-sm btn-outline-success';
    avisarle.textContent = 'Avisarle';
    avisarle.addEventListener('click', function (evento) {
      evento.stopPropagation();
      avisarPorWhatsApp(n);
    });

    const entregar = document.createElement('button');
    entregar.type = 'button';
    entregar.className = 'btn btn-sm btn-primary';
    entregar.textContent = n.saldo > 0 ? 'Cobrar y entregar' : 'Entregar';
    entregar.addEventListener('click', function (evento) {
      evento.stopPropagation();
      abrirEntrega(n.id);
    });

    botones.appendChild(avisarle);
    botones.appendChild(entregar);
    li.appendChild(botones);
  }
  return li;
}

function bloqueDeLista(titulo, notas, vacio) {
  const tarjeta = document.createElement('div');
  tarjeta.className = 'card mb-3';

  const cabeza = document.createElement('div');
  cabeza.className = 'card-header d-flex justify-content-between align-items-center';
  const nombre = document.createElement('span');
  nombre.className = 'fw-semibold';
  nombre.textContent = titulo;
  const cuenta = document.createElement('span');
  cuenta.className = 'badge text-bg-secondary';
  cuenta.textContent = notas.length;
  cabeza.appendChild(nombre);
  cabeza.appendChild(cuenta);
  tarjeta.appendChild(cabeza);

  if (notas.length === 0) {
    const nada = document.createElement('div');
    nada.className = 'card-body text-secondary small';
    nada.textContent = vacio;
    tarjeta.appendChild(nada);
    return tarjeta;
  }

  const lista = document.createElement('ul');
  lista.className = 'list-group list-group-flush';
  notas.forEach(function (n) { lista.appendChild(filaEntrega(n)); });
  tarjeta.appendChild(lista);
  return tarjeta;
}

function dibujarLista(notas) {
  const caja = document.getElementById('listaEntregas');
  const buscando = loQueBusca.trim() !== '';
  const hoy = new Date().toDateString();

  // La más cercana a la puerta primero. Dentro de cada etapa, la que más lleva
  // esperando. Las notas sin fecha, al final de su etapa.
  const fechaDe = function (n) { return n.listaDesde || n.creada || '9'; };
  const pendientes = notas.filter(function (n) { return n.estatus !== 'entregada'; })
    .sort(function (a, b) {
      const ia = ETAPAS.findIndex(function (e) { return e.id === a.estatus; });
      const ib = ETAPAS.findIndex(function (e) { return e.id === b.estatus; });
      if (ia !== ib) return ib - ia;
      return fechaDe(a) < fechaDe(b) ? -1 : 1;
    });

  // Sin buscar, solo las de hoy: la lista es para cerrar el día, no un archivo
  const entregadas = notas.filter(function (n) {
    return n.estatus === 'entregada' &&
           (buscando || (n.entregadaEl && new Date(n.entregadaEl).toDateString() === hoy));
  });

  caja.appendChild(bloqueDeLista('Por entregar', pendientes, 'No falta nada por entregar.'));
  caja.appendChild(bloqueDeLista(buscando ? 'Entregadas' : 'Entregadas hoy', entregadas,
    buscando ? 'Ninguna entregada con ese nombre.' : 'Todavía no entregas nada hoy.'));
}

document.getElementById('buscarNota').addEventListener('input', function (evento) {
  loQueBusca = evento.target.value;
  dibujarTablero();
});

registrarVista('tablero', dibujarTablero);

// Desde el Corte se llega directo a la lista de entregas, sin filtro puesto
export function mostrarLista() {
  modoTablero = 'lista';
  loQueBusca = '';
  document.getElementById('buscarNota').value = '';
  irA('tablero');
}
