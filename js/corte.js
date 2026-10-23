/* El corte: lo cobrado contra lo pagado a la maquila, y la ropa sin recoger. */
import { vaciarImagenes } from './almacen.js';
import { avisar } from './avisos.js';
import { registrarVista } from './navegacion.js';
import { DIAS_SIN_RECOGER, ETAPAS, NOTAS, escribirNotas, notasDeEjemplo, sinRecoger, reemplazarNotas } from './notas.js';
import { mostrarLista } from './tablero.js';
import { pesos } from './utilidades.js';

/* -------------------------------------------------------------------------
   10. CORTE
   ------------------------------------------------------------------------- */

export function dibujarCorte() {
  const facturado = NOTAS.reduce(function (s, n) { return s + n.total;  }, 0);
  const cobrado   = NOTAS.reduce(function (s, n) { return s + n.pagado; }, 0);
  const porCobrar = NOTAS.reduce(function (s, n) { return s + n.saldo;  }, 0);
  const maquila   = NOTAS.reduce(function (s, n) { return s + n.costo;  }, 0);

  document.getElementById('cFacturado').textContent = pesos(facturado);
  document.getElementById('cCobrado').textContent   = pesos(cobrado);
  document.getElementById('cPorCobrar').textContent = pesos(porCobrar);
  document.getElementById('cMaquila').textContent   = pesos(maquila);
  document.getElementById('cUtilidad').textContent  = pesos(facturado - maquila);

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

  NOTAS.forEach(function (n) {
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
  escribirNotas(NOTAS);
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
  escribirNotas(NOTAS);
  vaciarImagenes();
  dibujarCorte();
  avisar('Listo, la tablet quedó en cero.');
});

document.getElementById('btnVerSinRecoger').addEventListener('click', function () {
  mostrarLista();
});

registrarVista('corte', dibujarCorte);
