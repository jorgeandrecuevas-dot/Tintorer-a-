/* El corte: lo cobrado contra lo pagado a la maquila, y la ropa sin recoger. */
import { vaciarImagenes } from './almacen.js';
import { avisar } from './avisos.js';
import { registrarVista } from './navegacion.js';
import { DIAS_SIN_RECOGER, ETAPAS, NOTAS, guardarNotas, notasDeEjemplo, reemplazarNotas, sinRecoger } from './notas.js';
import { mostrarLista } from './tablero.js';
import { resumenCorte, textoRango } from './resumen.js';
import { pesos, pesosConSigno } from './utilidades.js';

/* -------------------------------------------------------------------------
   10. CORTE
   ------------------------------------------------------------------------- */

// Cuál periodo se está viendo. Arranca en la semana: es lo que cuenta el ciclo.
let periodo = 'semana';

export function dibujarCorte() {
  const r = resumenCorte(NOTAS, periodo);

  document.querySelectorAll('#periodosCorte [data-periodo]').forEach(function (b) {
    b.classList.toggle('active', b.dataset.periodo === periodo);
  });
  document.getElementById('rangoCorte').textContent = textoRango(r);

  document.getElementById('cFacturado').textContent = pesos(r.facturado);
  document.getElementById('cCobrado').textContent   = pesos(r.cobrado);
  document.getElementById('cPorCobrar').textContent = pesos(r.porCobrar);
  document.getElementById('cMaquila').textContent   = pesos(r.maquila);
  document.getElementById('cUtilidad').textContent  = pesosConSigno(r.utilidadCaja);
  document.getElementById('cUtilidadTotal').textContent = pesosConSigno(r.utilidadSiCobran);

  // Lo que dejaron de anticipo y no volvieron a recoger, contra lo que ya se
  // le pagó a la maquila por esa ropa
  const sin = NOTAS.filter(sinRecoger);
  const anticipo = sin.reduce(function (s, n) { return s + n.pagado; }, 0);
  const pagadoMaq = sin.reduce(function (s, n) { return s + n.costo; }, 0);
  const prendas = sin.reduce(function (s, n) { return s + n.piezas; }, 0);
  const quedo = anticipo - pagadoMaq;

  document.getElementById('sinRecogerCifras').classList.toggle('d-none', sin.length === 0);
  document.getElementById('btnVerSinRecoger').classList.toggle('d-none', sin.length === 0);
  const cuantas = sin.length + (sin.length === 1 ? ' nota' : ' notas') +
                  ' (' + prendas + (prendas === 1 ? ' prenda)' : ' prendas)');
  document.getElementById('sinRecogerTexto').textContent = sin.length === 0
    ? 'Nada lleva ' + DIAS_SIN_RECOGER + ' días o más embolsado.'
    : cuantas + (sin.length === 1 ? ' lleva ' : ' llevan ') + DIAS_SIN_RECOGER +
      ' días o más embolsada' + (sin.length === 1 ? '.' : 's.');
  document.getElementById('srAnticipo').textContent = pesos(anticipo);
  document.getElementById('srCosto').textContent = pesos(pagadoMaq);
  const celdaQuedo = document.getElementById('srQuedo');
  celdaQuedo.textContent = (quedo < 0 ? '−' : '') + pesos(Math.abs(quedo));
  celdaQuedo.className = 'fs-5 fw-bold ' + (quedo < 0 ? 'text-danger' : 'text-body');

  const cuerpo = document.getElementById('tablaCorte');
  cuerpo.innerHTML = '';

  r.notas.forEach(function (n) {
    const etapa = ETAPAS.find(function (e) { return e.id === n.estatus; });
    const tr = document.createElement('tr');

    [n.folio, n.cliente].forEach(function (texto) {
      const td = document.createElement('td');
      td.textContent = texto;
      tr.appendChild(td);
    });
    [n.piezas, pesos(n.total), pesos(n.saldo)].forEach(function (texto) {
      const td = document.createElement('td');
      td.className = 'text-end';
      td.textContent = texto;
      tr.appendChild(td);
    });

    const td = document.createElement('td');
    const marca = document.createElement('span');
    marca.className = 'badge text-bg-' + (etapa ? etapa.color : 'secondary');
    marca.textContent = etapa ? etapa.nombre : n.estatus;
    td.appendChild(marca);
    tr.appendChild(td);

    cuerpo.appendChild(tr);
  });
}

/* -------------------------------------------------------------------------
   13. EMPEZAR DE CERO O CARGAR EJEMPLOS

   La aplicación arranca vacía: quien la abre por primera vez no tiene por qué
   encontrarse notas de gente que no existe. Los ejemplos se cargan a mano
   cuando hay que enseñarla.
   ------------------------------------------------------------------------- */

document.getElementById('btnEjemplos').addEventListener('click', function () {
  const ejemplos = notasDeEjemplo();
  const nuevas = ejemplos.filter(function (e) {
    return !NOTAS.some(function (n) { return n.folio === e.folio; });
  });

  if (nuevas.length === 0) { avisar('Los ejemplos ya están cargados.'); return; }

  reemplazarNotas(NOTAS.concat(nuevas));
  guardarNotas();
  dibujarCorte();
  avisar('Se cargaron ' + nuevas.length + ' notas de ejemplo.');
});

document.getElementById('btnBorrarTodo').addEventListener('click', function () {
  if (NOTAS.length === 0) { avisar('No hay nada que borrar.'); return; }

  // Se borra la libreta completa del negocio: hay que preguntar
  const seguro = window.confirm(
    'Se van a borrar las ' + NOTAS.length + ' notas guardadas en esta tablet.\n\n' +
    'Esto no se puede deshacer. ¿Seguro?');
  if (!seguro) return;

  reemplazarNotas([]);
  guardarNotas();
  vaciarImagenes();
  dibujarCorte();
  avisar('Listo, la tablet quedó en cero.');
});

document.getElementById('btnVerSinRecoger').addEventListener('click', function () {
  mostrarLista();
});

registrarVista('corte', dibujarCorte);

document.querySelectorAll('#periodosCorte [data-periodo]').forEach(function (boton) {
  boton.addEventListener('click', function () {
    periodo = boton.dataset.periodo;
    dibujarCorte();
  });
});
