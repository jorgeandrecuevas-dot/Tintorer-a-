import { avisar } from './avisos.js';
/* Las notas guardadas: dónde viven, cómo se escriben y las reglas de cada etapa. */
import { esImagenAdentro, guardarImagen } from './almacen.js';
import { fechaEntrega, textoFecha } from './ciclo.js';

/* -------------------------------------------------------------------------
   4. LAS NOTAS GUARDADAS

   Se guardan en la tablet, no en un servidor. Eso es lo que permite levantar
   notas y firmar sin internet. Falta sincronizar entre sucursales.
   ------------------------------------------------------------------------- */

const LLAVE = 'tintoreria.notas';

export const ETAPAS = [
  { id: 'recibida',  nombre: 'Recibida',  color: 'secondary' },
  { id: 'maquila',   nombre: 'En maquila', color: 'primary' },
  { id: 'devuelta',  nombre: 'De vuelta', color: 'info' },
  { id: 'lista',     nombre: 'Embolsada', color: 'success' },
  { id: 'entregada', nombre: 'Entregada', color: 'dark' }
];

function leerNotas() {
  try {
    return JSON.parse(localStorage.getItem(LLAVE)) || [];
  } catch (e) {
    return [];                       // en modo privado el almacén puede fallar
  }
}

// Devuelve si alcanzó a guardar. Con fotos adentro el almacén del navegador
// se puede llenar, y fallar en silencio ahí sería perder notas sin que nadie
// se entere.
export function escribirNotas(notas) {
  try {
    localStorage.setItem(LLAVE, JSON.stringify(notas));
  } catch (e) {
    return false;
  }
  avisarCambio();
  return true;
}

// Lo que usan las pantallas: guarda y, si no se pudo, lo dice. Antes 12 de 14
// sitios ignoraban el resultado y la pantalla decía "guardada" sin estarlo.
export function guardarNotas() {
  if (escribirNotas(NOTAS)) return true;
  avisar('No se pudo guardar: la tablet no tiene lugar. Baja un respaldo y borra notas viejas.');
  return false;
}

// Quien quiera enterarse de que las notas cambiaron se apunta aquí. La pantalla
// que se está viendo se vuelve a dibujar sola, sin que nadie le tenga que avisar.
const escuchas = [];
export function alCambiar(fn) {
  escuchas.push(fn);
}
function avisarCambio() {
  escuchas.forEach(function (fn) { fn(); });
}

// Cada nota lleva su propio identificador. El número de nota lo escribe el
// negocio y no hay nada que garantice que no se repita, así que no sirve para
// encontrarla en la lista.
export function conId(n) {
  if (!n.id) n.id = 'n' + Math.random().toString(36).slice(2, 10);
  return n;
}

export let NOTAS = leerNotas().map(conId);

// Desde fuera no se puede asignar a NOTAS: se pide aquí
export function reemplazarNotas(lista) {
  NOTAS = lista;
}

// Cambia la nota de etapa y anota desde cuándo está embolsada. Ese día es el
// que cuenta para saber cuánto lleva esperando que pasen por su ropa.
export function ponerEstatus(n, estatus) {
  n.estatus = estatus;
  if (estatus === 'lista') n.listaDesde = new Date().toISOString();
  else delete n.listaDesde;
  if (estatus === 'entregada') n.entregadaEl = new Date().toISOString();
  else delete n.entregadaEl;
}

/* La ropa que nadie recoge.

   Cuando dejan el anticipo y no regresan, la maquila ya se cobró y el negocio
   se queda sin ganancia. Es lo que el punto 23 llama merma. Cuántos días
   esperar antes de darla por no recogida lo decide el dueño: 15 es mi
   suposición hasta que lo confirme. */

export const DIAS_SIN_RECOGER = 15;

export function diasEmbolsada(n) {
  if (n.estatus !== 'lista' || !n.listaDesde) return null;
  return Math.max(0, Math.floor((Date.now() - new Date(n.listaDesde).getTime()) / 86400000));
}

export function sinRecoger(n) {
  const d = diasEmbolsada(n);
  return d !== null && d >= DIAS_SIN_RECOGER;
}

export function textoHace(dias) {
  if (dias === 0) return 'hoy';
  return 'hace ' + dias + (dias === 1 ? ' día' : ' días');
}

function haceDias(dias) {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString();
}

// La aplicación arranca vacía. Las notas de ejemplo se cargan a propósito
// desde el Corte, cuando se quiere enseñar cómo se ve trabajando.
export function notasDeEjemplo() {
  const hoy = new Date();
  return [
    { folio: '0479', cliente: 'Carmen Ruiz',  piezas: 1, total: 230, costo: 120,
      pagado: 115, saldo: 115, estatus: 'maquila',   detalle: 'Edredón queen' },
    { folio: '0480', cliente: 'Pedro Lara',   piezas: 3, total: 210, costo: 120,
      pagado: 210, saldo: 0,   estatus: 'devuelta',  detalle: 'Camisa ×3' },
    { folio: '0477', cliente: 'Sofía Peña',   piezas: 1, total: 180, costo: 90,
      pagado: 90,  saldo: 90,  estatus: 'lista',     detalle: 'Vestido de fiesta' },
    { folio: '0475', cliente: 'Hugo Mena',    piezas: 1, total: 220, costo: 160,
      pagado: 220, saldo: 0,   estatus: 'entregada', detalle: 'Chamarra de piel' }
  ].map(function (n) {
    n.entrega = textoFecha(fechaEntrega(hoy, false));
    n.observaciones = '';
    n.fotos = [];
    n.creada = haceDias(25);
    // Una de las notas lleva 20 días embolsada: así se ve cómo marca la ropa
    // que nadie recoge
    if (n.estatus === 'lista') n.listaDesde = haceDias(20);
    return conId(n);
  });
}

// Todas las imágenes de una nota: sus fotos y sus dos firmas
export function imagenesDeNota(n) {
  return (n.fotos || []).concat([n.firmaRecibido, n.firmaEntrega])
    .filter(function (x) { return x && !esImagenAdentro(x); });
}

// Las notas guardadas con la versión anterior traen las imágenes adentro. Se
// mudan una sola vez, la primera vez que abre esta versión.
function mudarImagenesViejas() {
  const pendientes = [];
  NOTAS.forEach(function (n) {
    (n.fotos || []).forEach(function (f, i) {
      if (esImagenAdentro(f)) pendientes.push({ nota: n, campo: 'fotos', i: i, dato: f });
    });
    ['firmaRecibido', 'firmaEntrega'].forEach(function (c) {
      if (esImagenAdentro(n[c])) pendientes.push({ nota: n, campo: c, dato: n[c] });
    });
  });
  if (pendientes.length === 0) return Promise.resolve(0);

  return Promise.all(pendientes.map(function (p) {
    return guardarImagen(p.dato).then(function (nombre) {
      if (!nombre) return false;
      if (p.campo === 'fotos') p.nota.fotos[p.i] = nombre;
      else p.nota[p.campo] = nombre;
      return true;
    });
  })).then(function (hechas) {
    escribirNotas(NOTAS);
    return hechas.filter(Boolean).length;
  });
}

mudarImagenesViejas();
