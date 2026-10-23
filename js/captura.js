/* La pantalla de nota nueva: prendas, cobro, clientes que ya vinieron y guardar. */
import { borrarImagenes, guardarImagen } from './almacen.js';
import { avisar } from './avisos.js';
import { CATALOGO, CATEGORIAS, lavanderia } from './catalogo.js';
import { HORA_SALIDA, TARDAN_MAS, fechaEntrega, textoFecha } from './ciclo.js';
import { firmaRecibido } from './firmas.js';
import { fotosDeLaNota, vaciarGaleria } from './galeria.js';
import { irA } from './navegacion.js';
import { NOTAS, conId, escribirNotas } from './notas.js';
import { pesos, sinAcentos } from './utilidades.js';

/* -------------------------------------------------------------------------
   5. CAPTURA DE LA NOTA
   ------------------------------------------------------------------------- */

const inpBuscar      = document.getElementById('buscarPrenda');

const listaResultados = document.getElementById('resultados');

const inpCantidad    = document.getElementById('cantidad');

const listaPrendas   = document.getElementById('listaPrendas');

const inpKilos       = document.getElementById('kilos');

const bloquePiezas   = document.getElementById('bloquePiezas');

const bloqueKilos    = document.getElementById('bloqueKilos');

const radioTinto     = document.getElementById('servTintoreria');

const radioLavan     = document.getElementById('servLavanderia');

export const inpCliente     = document.getElementById('nombreCliente');

export const inpFolio       = document.getElementById('folio');

export const inpObserva     = document.getElementById('observaciones');

const inpRecibido    = document.getElementById('recibido');

const resumenCliente = document.getElementById('resumenCliente');

let prendas = [];   // lo que lleva la nota hasta ahora

/* Se arma con createElement y textContent, no con innerHTML: así el texto
   nunca se interpreta como HTML aunque venga de algo que escribió el usuario. */
function renglonResumen(texto, monto) {
  const renglon = document.createElement('li');
  renglon.className = 'list-group-item d-flex justify-content-between px-0';
  const izquierda = document.createElement('span');
  izquierda.textContent = texto;
  const derecha = document.createElement('span');
  derecha.textContent = monto;
  renglon.appendChild(izquierda);
  renglon.appendChild(derecha);
  return renglon;
}

inpCliente.addEventListener('input', function () {
  resumenCliente.textContent = inpCliente.value.trim() || 'Sin nombre';
});

/* Los clientes que ya vinieron.

   La señora que trae ropa cada semana se tecleaba de cero cada semana, con
   su teléfono. Se arma la lista de las notas guardadas y se sugiere al
   escribir. Se queda el teléfono más reciente de cada quien. */

const cajaClientes = document.getElementById('clientesAntes');

function clientesDeAntes() {
  const vistos = {};
  const lista = [];
  // NOTAS viene de la más nueva a la más vieja, así que el primer teléfono
  // que aparece es el último que dejó
  NOTAS.forEach(function (n) {
    const nombre = (n.cliente || '').trim();
    if (nombre === '' || nombre === 'Sin nombre') return;
    const llave = sinAcentos(nombre);
    if (vistos[llave]) return;
    vistos[llave] = true;
    lista.push({ nombre: nombre, telefono: n.telefono || '' });
  });
  return lista;
}

function dibujarClientes() {
  clearTimeout(esconderClientes);
  const busca = sinAcentos(inpCliente.value.trim());
  cajaClientes.innerHTML = '';

  // Con una letra sale medio pueblo. A partir de dos ya sirve.
  if (busca.length < 2) { cajaClientes.classList.add('d-none'); return; }

  const hallados = clientesDeAntes().filter(function (c) {
    return sinAcentos(c.nombre).indexOf(busca) !== -1 &&
           sinAcentos(c.nombre) !== busca;
  }).slice(0, 5);

  if (hallados.length === 0) { cajaClientes.classList.add('d-none'); return; }

  hallados.forEach(function (c) {
    const fila = document.createElement('button');
    fila.type = 'button';
    fila.className = 'list-group-item list-group-item-action py-1';
    fila.setAttribute('role', 'listitem');

    const nombre = document.createElement('span');
    nombre.textContent = c.nombre;
    fila.appendChild(nombre);

    if (c.telefono) {
      const tel = document.createElement('span');
      tel.className = 'small text-secondary ms-2';
      tel.textContent = c.telefono;
      fila.appendChild(tel);
    }

    fila.addEventListener('click', function () {
      inpCliente.value = c.nombre;
      document.getElementById('telCliente').value = c.telefono;
      cajaClientes.classList.add('d-none');
      resumenCliente.textContent = c.nombre;
      inpCantidad.focus();
    });
    cajaClientes.appendChild(fila);
  });
  cajaClientes.classList.remove('d-none');
}

inpCliente.addEventListener('input', dibujarClientes);

// Al salir del campo la lista estorba. El retraso deja que el toque en una
// sugerencia alcance a registrarse antes de que se esconda. Si se vuelve al
// campo antes de que se cumpla, se cancela: si no, un blur viejo esconde una
// lista que ya se volvió a mostrar.
let esconderClientes = null;

inpCliente.addEventListener('blur', function () {
  esconderClientes = setTimeout(function () { cajaClientes.classList.add('d-none'); }, 200);
});

inpCliente.addEventListener('focus', function () { clearTimeout(esconderClientes); });

/* El buscador de prendas.

   El menú desplegable con las 56 piezas no servía: había que bajar la lista
   entera para encontrar una camisa. Aquí se escribe y se filtra. Los acentos
   no cuentan, porque en el mostrador nadie los va a teclear. */

const NOMBRE_CATEGORIA = {};

CATEGORIAS.forEach(function (c) { NOMBRE_CATEGORIA[c.id] = c.nombre; });

// Los más y menos son para capturar de pie, con el dedo, sin teclado
document.getElementById('masCantidad').addEventListener('click', function () {
  inpCantidad.value = (parseInt(inpCantidad.value, 10) || 0) + 1;
});

document.getElementById('menosCantidad').addEventListener('click', function () {
  inpCantidad.value = Math.max(1, (parseInt(inpCantidad.value, 10) || 2) - 1);
});

function agregarPrenda(pieza) {
  const cantidad = parseInt(inpCantidad.value, 10);
  if (!pieza || !cantidad || cantidad < 1) return;

  prendas.push({ nombre: pieza.nombre, cat: pieza.cat, cantidad: cantidad,
                 precio: pieza.precio, costo: pieza.costo });
  inpCantidad.value = 1;
  dibujarNota();
}

function dibujarResultados() {
  const busca = sinAcentos(inpBuscar.value.trim());
  listaResultados.innerHTML = '';

  const encontradas = CATALOGO.filter(function (p) {
    return busca === '' || sinAcentos(p.nombre).indexOf(busca) !== -1;
  });

  if (encontradas.length === 0) {
    const nada = document.createElement('div');
    nada.className = 'list-group-item text-secondary';
    nada.textContent = 'Ninguna prenda se llama así.';
    listaResultados.appendChild(nada);
    return;
  }

  encontradas.forEach(function (p) {
    const renglon = document.createElement('button');
    renglon.type = 'button';
    renglon.className = 'list-group-item list-group-item-action';
    renglon.setAttribute('role', 'listitem');

    const izq = document.createElement('span');
    const nombre = document.createElement('div');
    nombre.textContent = p.nombre;
    const donde = document.createElement('div');
    donde.className = 'de-donde';
    donde.textContent = NOMBRE_CATEGORIA[p.cat] || p.cat;
    izq.appendChild(nombre);
    izq.appendChild(donde);

    const cuanto = document.createElement('span');
    cuanto.className = 'cuanto';
    cuanto.textContent = pesos(p.precio);

    renglon.appendChild(izq);
    renglon.appendChild(cuanto);
    renglon.addEventListener('click', function () { agregarPrenda(p); });

    listaResultados.appendChild(renglon);
  });
}

inpBuscar.addEventListener('input', dibujarResultados);

// Enter agrega la primera de la lista: así se captura sin soltar el teclado
inpBuscar.addEventListener('keydown', function (evento) {
  if (evento.key !== 'Enter') return;
  evento.preventDefault();
  const primera = listaResultados.querySelector('button');
  if (primera) primera.click();
});

dibujarResultados();

function cambiarServicio() {
  const porKilo = radioLavan.checked;
  bloqueKilos.classList.toggle('d-none', !porKilo);
  bloquePiezas.classList.toggle('d-none', porKilo);
  dibujarNota();
}

radioTinto.addEventListener('change', cambiarServicio);

radioLavan.addEventListener('change', cambiarServicio);

inpKilos.addEventListener('input', dibujarNota);

/* El cobro. Los botones son atajos que llenan el campo; en cuanto alguien
   escribe un monto, mandan sus dedos y los atajos dejan de recalcular. */
let modoCobro = 'mitad';

function marcarAtajo() {
  [['atajoNada','nada'], ['atajoMitad','mitad'], ['atajoTodo','todo']].forEach(function (par) {
    document.getElementById(par[0]).classList.toggle('active', modoCobro === par[1]);
  });
}

function ponerAtajo(modo) {
  modoCobro = modo;
  marcarAtajo();
  dibujarNota();
}

document.getElementById('atajoNada').addEventListener('click', function () { ponerAtajo('nada'); });

document.getElementById('atajoMitad').addEventListener('click', function () { ponerAtajo('mitad'); });

document.getElementById('atajoTodo').addEventListener('click', function () { ponerAtajo('todo'); });

inpRecibido.addEventListener('input', function () {
  modoCobro = 'manual';
  marcarAtajo();
  dibujarNota();
});

// Lo que la nota vale ahora mismo. Lo usan la pantalla y el guardado.
// La hora de salida viene de Ajustes cuando exista. Mientras, la de los apuntes.
function horaDeSalida() {
  return HORA_SALIDA;
}

export function cuentaNota() {
  let precio = 0, costo = 0, piezas = 0, tardaMas = false;
  const renglones = [];

  if (radioLavan.checked) {
    // Un peso negativo o en blanco es cero kilos: no se cobra nada
    const kg = Math.max(0, parseFloat(inpKilos.value) || 0);
    const cuenta = lavanderia(kg);
    precio = cuenta.precio;
    costo  = cuenta.costo;
    piezas = kg > 0 ? Math.ceil(kg) : 0;        // la maquila cuenta bultos
    if (kg > 0) renglones.push({ texto: 'Lavandería ' + kg + ' kg', monto: precio });
  } else {
    prendas.forEach(function (p) {
      precio += p.precio * p.cantidad;
      costo  += p.costo  * p.cantidad;
      piezas += p.cantidad;
      if (TARDAN_MAS.indexOf(p.cat) !== -1) tardaMas = true;
      renglones.push({ texto: p.nombre + ' ×' + p.cantidad,
                       monto: p.precio * p.cantidad });
    });
  }

  let pagado;
  if (modoCobro === 'nada')       pagado = 0;
  else if (modoCobro === 'mitad') pagado = Math.round(precio / 2);
  else if (modoCobro === 'todo')  pagado = precio;
  else                            pagado = Math.max(0, parseFloat(inpRecibido.value) || 0);

  // Nadie puede dejar más de lo que vale la nota
  pagado = Math.min(pagado, precio);

  return { precio: precio, costo: costo, piezas: piezas, renglones: renglones,
           pagado: pagado, saldo: precio - pagado, tardaMas: tardaMas,
           entrega: fechaEntrega(new Date(), tardaMas, horaDeSalida()) };
}

function dibujarNota() {
  const c = cuentaNota();

  listaPrendas.innerHTML = '';
  c.renglones.forEach(function (r) {
    listaPrendas.appendChild(renglonResumen(r.texto, pesos(r.monto)));
  });

  document.getElementById('totalPiezas').textContent  = c.piezas;
  document.getElementById('fechaEntrega').textContent = textoFecha(c.entrega);
  document.getElementById('total').textContent        = pesos(c.precio);
  document.getElementById('saldo').textContent        = pesos(c.saldo);

  // Si el atajo mandó, se refleja en el campo. Si escribieron, no se toca.
  if (modoCobro !== 'manual') inpRecibido.value = c.pagado;

  // El punto 23 pide mínimo el 50%. No se bloquea, se avisa.
  const corto = c.precio > 0 && c.pagado < c.precio / 2;
  document.getElementById('avisoAnticipo').classList.toggle('d-none', !corto);
  document.getElementById('costo').textContent        = pesos(c.costo);
  document.getElementById('ganancia').textContent     = pesos(c.precio - c.costo);
}

// El margen arranca oculto porque el cliente está viendo la pantalla
const btnMargen  = document.getElementById('btnMargen');

const cajaMargen = document.getElementById('cajaMargen');

btnMargen.addEventListener('click', function () {
  const oculto = cajaMargen.classList.toggle('d-none');
  btnMargen.textContent = oculto ? 'Ver margen' : 'Ocultar margen';
});

dibujarNota();

// Guardar tarda lo que tarde el almacén de imágenes. Dos toques seguidos
// levantarían la nota dos veces.
let guardando = false;

/* El número de nota lo escribe a mano el dueño. Nada garantiza que no se
   repita, así que se avisa mientras escribe y al guardar. */
let folioConfirmado = null;
const avisoFolio = document.getElementById('avisoFolio');

function notaConFolio(folio) {
  return NOTAS.find(function (n) { return n.folio === folio; });
}

function pintarAvisoFolio() {
  const folio = inpFolio.value.trim();
  const otra = folio === '' ? null : notaConFolio(folio);
  avisoFolio.classList.toggle('d-none', !otra);
  if (otra) avisoFolio.textContent = 'Ya hay una nota ' + folio + ' de ' + otra.cliente + '.';
}

inpFolio.addEventListener('input', function () {
  folioConfirmado = null;
  pintarAvisoFolio();
});

document.getElementById('btnGuardar').addEventListener('click', function () {
  if (guardando) return;

  const folio = inpFolio.value.trim();
  if (folio === '') { inpFolio.focus(); avisar('Falta el número de nota.'); return; }

  const c = cuentaNota();
  if (c.piezas === 0) {
    avisar(radioLavan.checked ? 'Faltan los kilos.' : 'La nota no tiene prendas.');
    return;
  }

  // Un número repetido casi siempre es un error de dedo. Se avisa y se deja
  // pasar solo si se toca Guardar otra vez, porque a veces sí es otra nota.
  const repetida = notaConFolio(folio);
  if (repetida && folioConfirmado !== folio) {
    folioConfirmado = folio;
    pintarAvisoFolio();
    avisar('Ya hay una nota ' + folio + '. Si es otra, toca Guardar otra vez.');
    return;
  }

  guardando = true;
  const fotos = fotosDeLaNota();
  const porGuardar = [firmaRecibido.imagen()].concat(fotos);
  Promise.all(porGuardar.map(function (img) { return guardarImagen(img); }))
    .then(function (nombres) {
      guardando = false;
      terminarDeGuardar(folio, c, nombres[0], nombres.slice(1));
    });
});

function terminarDeGuardar(folio, c, firma, fotosGuardadas) {
  // Si el almacén no abrió, la nota se guarda sin imágenes. Perder la nota
  // sería peor, pero el mostrador tiene que enterarse.
  const seFueronFotos = fotosGuardadas.filter(Boolean);
  const faltaron = (fotosDeLaNota().length - seFueronFotos.length) +
                   (firmaRecibido.imagen() && !firma ? 1 : 0);

  NOTAS.unshift(conId({
    folio: folio,
    cliente: inpCliente.value.trim() || 'Sin nombre',
    telefono: document.getElementById('telCliente').value.trim(),
    piezas: c.piezas,
    total: c.precio,
    costo: c.costo,
    pagado: c.pagado,
    saldo: c.saldo,
    pagos: c.pagado > 0
      ? [{ f: new Date().toISOString(), monto: c.pagado, tipo: c.pagado >= c.precio ? 'liquidacion' : 'anticipo' }]
      : [],
    tardaMas: c.tardaMas,
    observaciones: inpObserva.value.trim(),
    detalle: c.renglones.map(function (r) { return r.texto; }).join(' · '),
    entrega: textoFecha(c.entrega),
    // La fecha prometida completa. El texto de arriba no se puede volver a
    // leer como fecha, y si algún día se cobra por tardar en recoger, hace
    // falta saber de qué día se cuenta.
    entregaISO: c.entrega.toISOString(),
    firmaRecibido: firma,
    fotos: seFueronFotos,
    estatus: 'recibida',
    creada: new Date().toISOString()
  }));

  if (!escribirNotas(NOTAS)) {
    // Si no se guardó, tampoco se queda en memoria: si no, el tablero
    // enseñaría una nota que al recargar ya no está.
    NOTAS.shift();
    borrarImagenes(seFueronFotos.concat(firma ? [firma] : []));
    avisar('No se pudo guardar: ya no cabe en la tablet. Hay que bajar un respaldo y borrar notas viejas.');
    return;
  }

  // Se limpia para la siguiente
  prendas = [];
  inpFolio.value = '';
  folioConfirmado = null;
  pintarAvisoFolio();
  inpCliente.value = '';
  document.getElementById('telCliente').value = '';
  inpObserva.value = '';
  vaciarGaleria();
  resumenCliente.textContent = 'Sin nombre';
  firmaRecibido.limpiar();
  modoCobro = 'mitad';
  marcarAtajo();
  dibujarNota();

  avisar(faltaron === 0
    ? 'Nota ' + folio + ' guardada.'
    : 'Nota ' + folio + ' guardada, pero sin sus imágenes: la tablet no dejó abrir el almacén.');
  irA('tablero');
}
