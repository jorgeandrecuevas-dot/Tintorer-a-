import { avisar } from './avisos.js';
/* Las notas guardadas: dónde viven, cómo se escriben y las reglas de cada etapa. */
import { esImagenAdentro, guardarImagen } from './almacen.js';
import { ajustes, quienAtiende } from './config.js';
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

/* Cada pago lleva su fecha. Una nota guardaba un solo "pagado" y no se podía
   saber cuándo entró el dinero ni sacar lo cobrado hoy. Las notas viejas se
   arreglan solas: su pagado se vuelve un pago con la fecha de la nota. */
let notasArregladas = false;
export function conPagos(n) {
  if (!Array.isArray(n.pagos)) {
    notasArregladas = true;
    const f = n.entregadaEl || n.creada || new Date().toISOString();
    n.pagos = n.pagado > 0
      ? [{ f: f, monto: n.pagado, tipo: n.saldo > 0 ? 'anticipo' : 'liquidacion' }]
      : [];
  }
  return n;
}

/* El historial de cada nota: qué pasó, cuándo y quién atendía. Sirve para
   saber por qué una nota cambió sin tener que preguntarle a nadie. Son las
   últimas 60 cosas: más que eso ya no es útil. */
const MAXIMO_HISTORIAL = 60;

export function anotar(n, que) {
  if (!Array.isArray(n.historial)) n.historial = [];
  const entrada = { f: new Date().toISOString(), t: que };
  const quien = quienAtiende();
  if (quien) entrada.q = quien;
  n.historial.push(entrada);
  if (n.historial.length > MAXIMO_HISTORIAL) n.historial.splice(0, n.historial.length - MAXIMO_HISTORIAL);
}

function conHistorial(n) {
  if (!Array.isArray(n.historial)) {
    n.historial = [];
    if (n.creada) n.historial.push({ f: n.creada, t: 'Nota levantada' });
    notasArregladas = true;
  }
  return n;
}

export function normalizarNota(n) {
  return conHistorial(conPagos(conId(n)));
}

// Las notas canceladas se quedan guardadas, pero no cuentan en las pantallas
export function vivas() {
  return NOTAS.filter(function (n) { return !n.cancelada; });
}

/* Cancelar en lugar de borrar. Una nota borrada desaparecía sin rastro y el
   corte cambiaba solo. Cancelada se queda con su motivo y su historial.
   Si se devolvió lo cobrado, queda como un pago negativo. */
export function cancelarNota(n, motivo, devolverCobrado) {
  if (devolverCobrado && n.pagado > 0) registrarPago(n, -n.pagado, 'devolucion');
  n.cancelada = true;
  n.canceladaEl = new Date().toISOString();
  n.motivo = motivo || '';
  delete n.apartada;
  anotar(n, 'Cancelada' + (motivo ? ': ' + motivo : ''));
}

export function reactivarNota(n) {
  n.cancelada = false;
  delete n.canceladaEl;
  delete n.motivo;
  anotar(n, 'Reactivada');
}

// Un pago nuevo. El pagado y el saldo salen de sumar los pagos, así que no se
// pueden desacomodar. Un ajuste puede ser negativo: corregir lo que se había
// escrito de más.
export function registrarPago(n, monto, tipo) {
  if (!monto) return;
  n.pagos.push({ f: new Date().toISOString(), monto: monto, tipo: tipo });
  anotar(n, (monto < 0 ? 'Se devolvieron $' + (-monto) : 'Pago de $' + monto) + ' (' + tipo + ')');
  n.pagado = Math.max(0, n.pagos.reduce(function (s, p) { return s + p.monto; }, 0));
  n.saldo = n.total - n.pagado;
}

export let NOTAS = leerNotas().map(normalizarNota);

// Si hubo que arreglar notas viejas, se guardan ya arregladas
if (notasArregladas) escribirNotas(NOTAS);

// Desde fuera no se puede asignar a NOTAS: se pide aquí
export function reemplazarNotas(lista) {
  NOTAS = lista;
}

// Cambia la nota de etapa y anota desde cuándo está embolsada. Ese día es el
// que cuenta para saber cuánto lleva esperando que pasen por su ropa.
export function ponerEstatus(n, estatus) {
  if (n.estatus !== estatus) {
    const etapa = ETAPAS.find(function (e) { return e.id === estatus; });
    anotar(n, 'Pasó a ' + (etapa ? etapa.nombre : estatus));
  }
  n.estatus = estatus;
  if (estatus === 'lista') n.listaDesde = new Date().toISOString();
  else delete n.listaDesde;
  if (estatus === 'entregada') n.entregadaEl = new Date().toISOString();
  else delete n.entregadaEl;
  // A la maquila se le paga al mandar la ropa. El día se queda aunque la nota
  // siga de largo, para el corte.
  if (estatus === 'maquila' && !n.enviadaEl) n.enviadaEl = new Date().toISOString();
}

/* La ropa que nadie recoge.

   Cuando dejan el anticipo y no regresan, la maquila ya se cobró y el negocio
   se queda sin ganancia. Es lo que el punto 23 llama merma. Cuántos días
   esperar antes de darla por no recogida lo decide el dueño: 15 es mi
   suposición hasta que lo confirme. */


export function diasEmbolsada(n) {
  if (n.estatus !== 'lista' || !n.listaDesde) return null;
  return Math.max(0, Math.floor((Date.now() - new Date(n.listaDesde).getTime()) / 86400000));
}

export function sinRecoger(n) {
  if (n.cancelada) return false;
  const d = diasEmbolsada(n);
  return d !== null && d >= ajustes().diasSinRecoger;
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
  // dias: hace cuántos días se levantó. Cada pago dice hace cuántos días entró.
  return [
    { folio: '0479', cliente: 'Carmen Ruiz', piezas: 1, total: 230, costo: 120, estatus: 'maquila',
      detalle: 'Edredón queen', dias: 3, enviada: 2, regresa: 0, tardaMas: true, pagos: [[3, 115, 'anticipo']] },
    { folio: '0480', cliente: 'Pedro Lara', piezas: 3, total: 210, costo: 120, estatus: 'devuelta',
      detalle: 'Camisa ×3', dias: 4, enviada: 3, pagos: [[4, 210, 'liquidacion']] },
    // Esta lleva 20 días embolsada: así se ve cómo marca la ropa que nadie recoge
    { folio: '0477', cliente: 'Sofía Peña', piezas: 1, total: 180, costo: 90, estatus: 'lista',
      detalle: 'Vestido de fiesta', dias: 25, enviada: 24, lista: 20, pagos: [[25, 90, 'anticipo']] },
    { folio: '0475', cliente: 'Hugo Mena', piezas: 1, total: 220, costo: 160, estatus: 'entregada',
      detalle: 'Chamarra de piel', dias: 6, enviada: 5, entregada: 1,
      pagos: [[6, 110, 'anticipo'], [1, 110, 'liquidacion']] }
  ].map(function (e) {
    const n = {
      folio: e.folio, cliente: e.cliente, piezas: e.piezas, total: e.total, costo: e.costo,
      estatus: e.estatus, detalle: e.detalle, observaciones: '', fotos: [],
      entrega: textoFecha(fechaEntrega(hoy, false)),
      creada: haceDias(e.dias), enviadaEl: haceDias(e.enviada),
      pagos: e.pagos.map(function (p) { return { f: haceDias(p[0]), monto: p[1], tipo: p[2] }; })
    };
    n.pagado = n.pagos.reduce(function (s, p) { return s + p.monto; }, 0);
    n.saldo = n.total - n.pagado;
    n.historial = [{ f: n.creada, t: 'Nota levantada' }];
    if (e.regresa !== undefined) n.regresaISO = haceDias(-e.regresa);
    if (e.tardaMas) n.tardaMas = true;
    if (e.lista) n.listaDesde = haceDias(e.lista);
    if (e.entregada) n.entregadaEl = haceDias(e.entregada);
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
