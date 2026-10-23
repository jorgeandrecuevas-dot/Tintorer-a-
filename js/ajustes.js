/* La pantalla de Ajustes: lo que se cambia sin tocar el código. */
import { avisar } from './avisos.js';
import { CATALOGO, CATEGORIAS } from './catalogo.js';
import {
  ajustes, cambiarPrecio, dentroDeLimites, estaCambiada, guardarAjustes,
  nombreGuardado, nombreSucursal, ponerNombreSucursal, ponerQuienAtiende, precioDe,
  quienAtiende, volverALosOriginales
} from './config.js';
import { confirmar } from './confirmar.js';
import { registrarVista } from './navegacion.js';
import { pesosConSigno, sinAcentos } from './utilidades.js';

/* -------------------------------------------------------------------------
   El nombre de la tablet. Cada tablet lleva el suyo: cuando abran la segunda,
   cada una se llama como quiera. Sale en el menú y en los documentos.
   ------------------------------------------------------------------------- */

function pintarSucursal() {
  document.querySelectorAll('[data-sucursal]').forEach(function (el) {
    el.textContent = nombreSucursal();
  });
}
pintarSucursal();

const campoSucursal = document.getElementById('nombreSucursal');
campoSucursal.addEventListener('input', function () {
  ponerNombreSucursal(campoSucursal.value.trim());
  pintarSucursal();
});

const campoQuien = document.getElementById('quienAtiende');
campoQuien.addEventListener('input', function () {
  ponerQuienAtiende(campoQuien.value.trim());
});

/* -------------------------------------------------------------------------
   Los números sueltos. Cada campo se guarda al salir de él. Si escriben algo
   que no sirve (una letra, un 150% de anticipo), vuelve al valor de antes y
   lo dice, en vez de guardar basura.
   ------------------------------------------------------------------------- */

const CAMPOS = [
  { id: 'ajAnticipo',        limite: 'anticipoPct',     lee: (a) => a.anticipoPct,                 pon: (v) => ({ anticipoPct: v }) },
  { id: 'ajHoraSalida',      limite: 'horaSalida',      lee: (a) => a.horaSalida,                  pon: (v) => ({ horaSalida: v }) },
  { id: 'ajDiasSinRecoger',  limite: 'diasSinRecoger',  lee: (a) => a.diasSinRecoger,              pon: (v) => ({ diasSinRecoger: v }) },
  { id: 'ajDiasSinRespaldo', limite: 'diasSinRespaldo', lee: (a) => a.diasSinRespaldo,             pon: (v) => ({ diasSinRespaldo: v }) },
  { id: 'ajPrecioKilo',      limite: 'precioKilo',      lee: (a) => a.lavanderia.precioKilo,       pon: (v) => ({ lavanderia: { precioKilo: v } }) },
  { id: 'ajCostoPrimerKilo', limite: 'costoPrimerKilo', lee: (a) => a.lavanderia.costoPrimerKilo,  pon: (v) => ({ lavanderia: { costoPrimerKilo: v } }) },
  { id: 'ajCostoPorKilo',    limite: 'costoPorKilo',    lee: (a) => a.lavanderia.costoPorKilo,     pon: (v) => ({ lavanderia: { costoPorKilo: v } }) }
];

CAMPOS.forEach(function (campo) {
  const el = document.getElementById(campo.id);
  el.addEventListener('change', function () {
    const valor = parseFloat(el.value);
    if (!dentroDeLimites(campo.limite, valor)) {
      el.value = campo.lee(ajustes());
      avisar('Ese número no sirve. Se quedó el de antes.');
      return;
    }
    if (!guardarAjustes(campo.pon(valor))) avisar('No se pudo guardar el ajuste.');
  });
});

/* -------------------------------------------------------------------------
   Los precios. Cada pieza con lo que cobra la maquila y lo que se cobra al
   cliente. Un cambio vale para las notas nuevas: las que ya están guardadas
   traen su total y no se tocan.
   ------------------------------------------------------------------------- */

const tablaPrecios = document.getElementById('tablaPrecios');
const filtroPrecios = document.getElementById('filtroPrecios');
const NOMBRE_CATEGORIA = {};
CATEGORIAS.forEach(function (c) { NOMBRE_CATEGORIA[c.id] = c.nombre; });

function campoNumero(valor, etiqueta) {
  const input = document.createElement('input');
  input.type = 'number';
  input.className = 'form-control form-control-sm text-end';
  input.min = '0';
  input.step = '5';
  input.inputMode = 'decimal';
  input.value = valor;
  input.setAttribute('aria-label', etiqueta);
  return input;
}

function renglonPrecio(pieza) {
  const actual = precioDe(pieza);
  const tr = document.createElement('tr');
  tr.dataset.busca = sinAcentos(pieza.nombre + ' ' + (NOMBRE_CATEGORIA[pieza.cat] || ''));

  const nombre = document.createElement('td');
  const titulo = document.createElement('div');
  titulo.textContent = pieza.nombre;
  const categoria = document.createElement('div');
  categoria.className = 'small text-secondary';
  categoria.textContent = NOMBRE_CATEGORIA[pieza.cat] || pieza.cat;
  nombre.appendChild(titulo);
  nombre.appendChild(categoria);

  const celdaCosto = document.createElement('td');
  const costo = campoNumero(actual.costo, 'Lo que cobra la maquila por ' + pieza.nombre);
  celdaCosto.appendChild(costo);

  const celdaPrecio = document.createElement('td');
  const precio = campoNumero(actual.precio, 'Lo que se cobra por ' + pieza.nombre);
  celdaPrecio.appendChild(precio);

  const celdaQueda = document.createElement('td');
  celdaQueda.className = 'text-end';

  function pintarQueda() {
    const q = (parseFloat(precio.value) || 0) - (parseFloat(costo.value) || 0);
    celdaQueda.textContent = pesosConSigno(q);
    celdaQueda.className = 'text-end fw-semibold ' + (q < 0 ? 'text-danger' : q === 0 ? 'text-secondary' : 'text-success');
    tr.classList.toggle('table-warning', estaCambiada(pieza));
  }

  function alCambiar() {
    const p = parseFloat(precio.value), c = parseFloat(costo.value);
    if (!dentroDeLimites('precio', p) || !dentroDeLimites('costo', c)) {
      const vigente = precioDe(pieza);
      precio.value = vigente.precio;
      costo.value = vigente.costo;
      avisar('Ese número no sirve. Se quedó el de antes.');
    } else if (!cambiarPrecio(pieza, p, c)) {
      avisar('No se pudo guardar el precio.');
    }
    pintarQueda();
  }
  precio.addEventListener('change', alCambiar);
  costo.addEventListener('change', alCambiar);

  tr.appendChild(nombre);
  tr.appendChild(celdaCosto);
  tr.appendChild(celdaPrecio);
  tr.appendChild(celdaQueda);
  pintarQueda();
  return tr;
}

function dibujarPrecios() {
  tablaPrecios.innerHTML = '';
  CATALOGO.forEach(function (pieza) { tablaPrecios.appendChild(renglonPrecio(pieza)); });
  filtrarPrecios();
}

function filtrarPrecios() {
  const busca = sinAcentos(filtroPrecios.value.trim());
  tablaPrecios.querySelectorAll('tr').forEach(function (tr) {
    tr.classList.toggle('d-none', busca !== '' && tr.dataset.busca.indexOf(busca) === -1);
  });
}
filtroPrecios.addEventListener('input', filtrarPrecios);

document.getElementById('btnPreciosOriginales').addEventListener('click', function () {
  confirmar({
    titulo: 'Volver a los precios originales',
    texto: 'Los precios, los costos y la fórmula de la lavandería vuelven a los de la hoja del dueño. ' +
           'Las notas que ya están guardadas no cambian.',
    boton: 'Sí, volver',
    peligro: false
  }).then(function (r) {
    if (!r.ok) return;
    volverALosOriginales();
    dibujarAjustes();
    avisar('Volvieron los precios originales.');
  });
});

/* -------------------------------------------------------------------------
   Dibujar la pantalla al entrar
   ------------------------------------------------------------------------- */

export function dibujarAjustes() {
  campoSucursal.value = nombreGuardado();
  campoQuien.value = quienAtiende();
  CAMPOS.forEach(function (campo) {
    document.getElementById(campo.id).value = campo.lee(ajustes());
  });
  dibujarPrecios();
}

registrarVista('ajustes', dibujarAjustes);
