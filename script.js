/* =========================================================================
   Tintorería · Sistema de notas

   Lo que hace la aplicación sale de los apuntes que se levantaron con el
   negocio el 22 de octubre. Están en APUNTES.md, y mandan: si algo de aquí
   los contradice, lo que está mal es esto.

   Los precios son los de la lista que entregó el dueño. El "costo" es lo
   que la maquila cobra por lavar esa pieza.
   ========================================================================= */


/* -------------------------------------------------------------------------
   0. NAVEGACIÓN ENTRE PANTALLAS

   Los botones del menú y los que están dentro de cada pantalla llevan un
   atributo data-vista. Un solo manejador atiende a todos: busca la sección
   que corresponde, esconde las demás y marca el renglón activo del menú.
   ------------------------------------------------------------------------- */

const TITULOS = {
  nota:    'Nota nueva',
  tablero: 'Tablero',
  maquila: 'Maquila',
  corte:   'Corte'
};

function irA(nombre) {
  if (!TITULOS[nombre]) return;

  // Se esconden todas las pantallas y se muestra la pedida
  document.querySelectorAll('.vista').forEach(function (seccion) {
    seccion.classList.toggle('d-none', seccion.id !== 'vista-' + nombre);
  });

  // El menú marca dónde estás. Hay dos menús, el fijo y el cajón, así que
  // se recorren los dos con el mismo selector.
  document.querySelectorAll('.nav-link[data-vista]').forEach(function (enlace) {
    enlace.classList.toggle('active', enlace.dataset.vista === nombre);
  });

  document.getElementById('tituloVista').textContent = TITULOS[nombre];

  // Cada pantalla se vuelve a dibujar al entrar, porque todas leen las
  // mismas notas guardadas y cualquiera pudo haberlas movido.
  if (nombre === 'tablero') dibujarTablero();
  if (nombre === 'maquila') dibujarMaquila();
  if (nombre === 'corte')   dibujarCorte();

  // En teléfono el menú es un cajón encima del contenido: hay que cerrarlo
  const cajon = document.getElementById('menuLateral');
  const abierto = bootstrap.Offcanvas.getInstance(cajon);
  if (abierto) abierto.hide();

  window.scrollTo(0, 0);
}

// Un solo addEventListener para todos los botones y enlaces de navegación
document.querySelectorAll('[data-vista]').forEach(function (boton) {
  boton.addEventListener('click', function (evento) {
    evento.preventDefault();
    irA(boton.dataset.vista);
  });
});


/* -------------------------------------------------------------------------
   1. GALERÍA DE FOTOGRAFÍAS   ←  Actividad 1
   ------------------------------------------------------------------------- */

// Los tres elementos que pide la actividad, tomados por su identificador único
const campo   = document.getElementById('urlFoto');
const boton   = document.getElementById('btnAgregar');
const galeria = document.getElementById('galeria');
const aviso   = document.getElementById('galeriaVacia');

// Las fotos de la nota que se está capturando
let fotos = [];

// Mete una foto a la rejilla. La usan el botón de la actividad y la cámara.
function agregarFoto(src) {
  // document.createElement() para la columna y para la imagen
  const columna = document.createElement('div');
  columna.className = 'col';

  const img = document.createElement('img');
  img.src = src;
  img.alt = 'Foto ' + (galeria.children.length + 1) + ' de la prenda';
  img.className = 'foto-prenda rounded border';

  // Si la dirección no carga, se avisa en lugar de dejar una imagen rota.
  // Esto no lo pedía la actividad; lo agregué porque al escribir mal una
  // dirección quedaba un hueco en blanco sin ninguna explicación.
  img.onerror = function () {
    const error = document.createElement('div');
    error.className = 'foto-fallida';
    error.textContent = 'No se pudo cargar esta imagen';
    columna.innerHTML = '';
    columna.appendChild(error);
  };

  // appendChild() para meter la imagen en su columna y la columna en la galería
  columna.appendChild(img);
  galeria.appendChild(columna);

  fotos.push(src);
  aviso.classList.add('d-none');
}

// addEventListener para el clic del botón
boton.addEventListener('click', function () {
  const url = campo.value.trim();
  if (url === '') return;                        // sin URL no se hace nada
  agregarFoto(url);
  campo.value = '';
  campo.focus();
});

// Comodidad: presionar Enter en el campo hace lo mismo que el botón
campo.addEventListener('keydown', function (evento) {
  if (evento.key === 'Enter') boton.click();
});


/* -------------------------------------------------------------------------
   1.1 LA FOTO CON LA CÁMARA   (punto 21 de los apuntes)

   En el mostrador nadie va a pegar una dirección de internet. Se toma la
   foto y ya. Se achica antes de guardarla: una foto de tablet pesa varios
   megas y el almacén del navegador no aguanta ni tres notas así.
   ------------------------------------------------------------------------- */

const LADO_MAXIMO = 1000;

function achicar(archivo) {
  return new Promise(function (listo) {
    const lector = new FileReader();
    lector.onload = function () {
      const original = new Image();
      original.onload = function () {
        const escala = Math.min(1, LADO_MAXIMO / Math.max(original.width, original.height));
        const tabla = document.createElement('canvas');
        tabla.width  = Math.round(original.width  * escala);
        tabla.height = Math.round(original.height * escala);
        tabla.getContext('2d').drawImage(original, 0, 0, tabla.width, tabla.height);
        listo(tabla.toDataURL('image/jpeg', 0.7));
      };
      // Si el archivo no es una imagen que el navegador entienda, se usa tal cual
      original.onerror = function () { listo(lector.result); };
      original.src = lector.result;
    };
    lector.readAsDataURL(archivo);
  });
}

const tomarFoto = document.getElementById('tomarFoto');

tomarFoto.addEventListener('change', function () {
  const archivos = Array.prototype.slice.call(tomarFoto.files);
  archivos.forEach(function (archivo) {
    achicar(archivo).then(agregarFoto);
  });
  tomarFoto.value = '';        // para poder volver a elegir la misma foto
});


/* -------------------------------------------------------------------------
   2. CATÁLOGO DE PRECIOS
   ------------------------------------------------------------------------- */

const CATEGORIAS = [
  { id: 'ropa',       nombre: 'Ropa' },
  { id: 'blancos',    nombre: 'Blancos' },
  { id: 'vestidos',   nombre: 'Vestidos' },
  { id: 'peluches',   nombre: 'Peluches' },
  { id: 'edredones',  nombre: 'Edredones' },
  { id: 'cobertores', nombre: 'Cobertores' },
  { id: 'mochilas',   nombre: 'Mochilas' },
  { id: 'tenis',      nombre: 'Tenis' }
];

const CATALOGO = [
  // --- Ropa ---
  { cat: 'ropa', nombre: 'Abrigo corto',          costo: 60,  precio: 110 },
  { cat: 'ropa', nombre: 'Abrigo largo',          costo: 60,  precio: 130 },
  { cat: 'ropa', nombre: 'Gabardina',             costo: 60,  precio: 110 },
  { cat: 'ropa', nombre: 'Chaleco corto',         costo: 40,  precio: 70 },
  { cat: 'ropa', nombre: 'Chaleco largo',         costo: 60,  precio: 85 },
  { cat: 'ropa', nombre: 'Bufanda',               costo: 40,  precio: 70 },
  { cat: 'ropa', nombre: 'Camisa',                costo: 40,  precio: 70 },
  { cat: 'ropa', nombre: 'Pantalón',              costo: 40,  precio: 70 },
  { cat: 'ropa', nombre: 'Saco',                  costo: 40,  precio: 70 },
  { cat: 'ropa', nombre: 'Bermuda / short',       costo: 40,  precio: 70 },
  { cat: 'ropa', nombre: 'Traje 2 piezas',        costo: 80,  precio: 170 },
  { cat: 'ropa', nombre: 'Pants 2 piezas',        costo: 80,  precio: 170 },
  { cat: 'ropa', nombre: 'Suéter',                costo: 40,  precio: 70 },
  { cat: 'ropa', nombre: 'Suéter piel/gamuza',    costo: 160, precio: 195 },
  { cat: 'ropa', nombre: 'Suéter aplicaciones',   costo: 80,  precio: 140 },
  { cat: 'ropa', nombre: 'Suéter angora aplic.',  costo: 80,  precio: 170 },
  { cat: 'ropa', nombre: 'Falda',                 costo: 40,  precio: 70 },
  { cat: 'ropa', nombre: 'Blusa',                 costo: 40,  precio: 70 },
  { cat: 'ropa', nombre: 'Playera',               costo: 40,  precio: 70 },
  { cat: 'ropa', nombre: 'Playera tipo polo',     costo: 40,  precio: 70 },
  { cat: 'ropa', nombre: 'Corbata',               costo: 40,  precio: 70 },
  { cat: 'ropa', nombre: 'Pañuelo',               costo: 40,  precio: 70 },
  { cat: 'ropa', nombre: 'Gorra',                 costo: 40,  precio: 70 },
  { cat: 'ropa', nombre: 'Chamarra sencilla',     costo: 60,  precio: 95 },
  { cat: 'ropa', nombre: 'Chamarra borrega',      costo: 80,  precio: 140 },
  { cat: 'ropa', nombre: 'Chamarra piel',         costo: 160, precio: 220 },
  { cat: 'ropa', nombre: 'Bata filipina corta',   costo: 40,  precio: 75 },
  { cat: 'ropa', nombre: 'Bata filipina larga',   costo: 60,  precio: 80 },

  // --- Blancos ---
  { cat: 'blancos', nombre: 'Funda almohada',         costo: 40,  precio: 70 },
  { cat: 'blancos', nombre: 'Funda almohada grande',  costo: 60,  precio: 80 },
  { cat: 'blancos', nombre: 'Sábana 1 pieza',         costo: 100, precio: 70 },
  { cat: 'blancos', nombre: 'Toalla manos',           costo: 40,  precio: 70 },
  { cat: 'blancos', nombre: 'Toalla grande baño',     costo: 60,  precio: 90 },
  { cat: 'blancos', nombre: 'Toalla extra larga',     costo: 80,  precio: 95 },

  // --- Vestidos ---
  { cat: 'vestidos', nombre: 'Vestido novia sencillo', costo: 500, precio: 850 },
  { cat: 'vestidos', nombre: 'Novia c/aplicaciones',   costo: 700, precio: 1200 },
  { cat: 'vestidos', nombre: 'Novia alto vacío',       costo: 800, precio: 1200 },
  { cat: 'vestidos', nombre: 'Vestido sencillo',       costo: 70,  precio: 90 },
  { cat: 'vestidos', nombre: 'Vestido fiesta/cóctel',  costo: 90,  precio: 180 },
  { cat: 'vestidos', nombre: 'Vestido largo fiesta',   costo: 120, precio: 190 },

  // --- Peluches ---
  { cat: 'peluches', nombre: 'Peluche chico',   costo: 80,  precio: 85 },
  { cat: 'peluches', nombre: 'Peluche mediano', costo: 80,  precio: 110 },
  { cat: 'peluches', nombre: 'Peluche grande',  costo: 120, precio: 180 },
  { cat: 'peluches', nombre: 'Peluche gigante', costo: 200, precio: 450 },

  // --- Edredones ---
  { cat: 'edredones', nombre: 'Edredón individual',  costo: 80,  precio: 180 },
  { cat: 'edredones', nombre: 'Edredón matrimonial', costo: 80,  precio: 195 },
  { cat: 'edredones', nombre: 'Edredón queen',       costo: 120, precio: 230 },
  { cat: 'edredones', nombre: 'Edredón king',        costo: 140, precio: 260 },

  // --- Cobertores ---
  { cat: 'cobertores', nombre: 'Cobertor individual',  costo: 80,  precio: 180 },
  { cat: 'cobertores', nombre: 'Cobertor matrimonial', costo: 80,  precio: 195 },
  { cat: 'cobertores', nombre: 'Cobertor queen',       costo: 100, precio: 230 },
  { cat: 'cobertores', nombre: 'Cobertor king',        costo: 140, precio: 260 },

  // --- Mochilas ---
  { cat: 'mochilas', nombre: 'Mochila chica',   costo: 50, precio: 70 },
  { cat: 'mochilas', nombre: 'Mochila mediana', costo: 60, precio: 85 },
  { cat: 'mochilas', nombre: 'Mochila grande',  costo: 70, precio: 95 },

  // --- Tenis ---
  { cat: 'tenis', nombre: 'Tenis (par)', costo: 70, precio: 130 }
];

/* La lavandería no se guarda como tabla: es una fórmula.
   La saqué de los 30 renglones de la hoja del dueño y no tiene excepciones. */
function lavanderia(kg) {
  return {
    precio: 45 * kg,
    costo:  kg <= 1 ? 32 : 32 + 16 * kg
  };
}

/* -------------------------------------------------------------------------
   3. EL CICLO DE LA SEMANA

   La ropa sale a la maquila los martes, jueves y sábados, y lo que sale un
   día vuelve el día de salida siguiente: lo del martes vuelve el jueves, lo
   del jueves el sábado, lo del sábado el martes. Los cobertores y edredones
   tardan más, así que saltan un ciclo.
   ------------------------------------------------------------------------- */

const DIAS_SALIDA = [2, 4, 6];                 // martes, jueves, sábado
const TARDAN_MAS  = ['cobertores', 'edredones'];
const DIAS  = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun',
               'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function proximaSalida(desde) {
  const d = new Date(desde);
  for (let i = 0; i < 8; i++) {
    if (DIAS_SALIDA.indexOf(d.getDay()) !== -1) return d;
    d.setDate(d.getDate() + 1);
  }
  return d;
}

// Lo que sale un día de salida vuelve en el día de salida siguiente
function regresoDe(salida) {
  const d = new Date(salida);
  d.setDate(d.getDate() + 1);
  return proximaSalida(d);
}

function fechaEntrega(desde, tardaMas) {
  let regreso = regresoDe(proximaSalida(desde));
  if (tardaMas) regreso = regresoDe(regreso);
  return regreso;
}

function textoFecha(d) {
  return DIAS[d.getDay()] + ' ' + d.getDate() + ' ' + MESES[d.getMonth()];
}

document.getElementById('hoyTexto').textContent = textoFecha(new Date());


/* -------------------------------------------------------------------------
   4. LAS NOTAS GUARDADAS

   Se guardan en la tablet, no en un servidor. Eso es lo que permite levantar
   notas y firmar sin internet. Falta sincronizar entre sucursales.
   ------------------------------------------------------------------------- */

const LLAVE = 'tintoreria.notas';

const ETAPAS = [
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
function escribirNotas(notas) {
  try {
    localStorage.setItem(LLAVE, JSON.stringify(notas));
    return true;
  } catch (e) {
    return false;
  }
}

// Cada nota lleva su propio identificador. El número de nota lo escribe el
// negocio y no hay nada que garantice que no se repita, así que no sirve para
// encontrarla en la lista.
function conId(n) {
  if (!n.id) n.id = 'n' + Math.random().toString(36).slice(2, 10);
  return n;
}

let NOTAS = leerNotas().map(conId);

// La primera vez se siembran unas notas para que el tablero no arranque vacío
if (NOTAS.length === 0) {
  const hoy = new Date();
  NOTAS = [
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
    return conId(n);
  });
  escribirNotas(NOTAS);
}


/* -------------------------------------------------------------------------
   5. CAPTURA DE LA NOTA
   ------------------------------------------------------------------------- */

const selCategoria   = document.getElementById('categoria');
const selPrenda      = document.getElementById('prenda');
const inpCantidad    = document.getElementById('cantidad');
const btnPrenda      = document.getElementById('btnAgregarPrenda');
const listaPrendas   = document.getElementById('listaPrendas');
const inpKilos       = document.getElementById('kilos');
const bloquePiezas   = document.getElementById('bloquePiezas');
const bloqueKilos    = document.getElementById('bloqueKilos');
const radioTinto     = document.getElementById('servTintoreria');
const radioLavan     = document.getElementById('servLavanderia');
const inpCliente     = document.getElementById('nombreCliente');
const inpFolio       = document.getElementById('folio');
const inpObserva     = document.getElementById('observaciones');
const cobroAnticipo  = document.getElementById('cobroAnticipo');
const resumenCliente = document.getElementById('resumenCliente');

let prendas = [];   // lo que lleva la nota hasta ahora

function pesos(n) {
  return '$' + Math.round(n).toLocaleString('es-MX');
}

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

// Llena el menú de categorías
CATEGORIAS.forEach(function (c) {
  const opcion = document.createElement('option');
  opcion.value = c.id;
  opcion.textContent = c.nombre;
  selCategoria.appendChild(opcion);
});

function llenarPrendas() {
  selPrenda.innerHTML = '';
  CATALOGO
    .filter(function (p) { return p.cat === selCategoria.value; })
    .forEach(function (p) {
      const opcion = document.createElement('option');
      opcion.value = p.nombre;
      opcion.textContent = p.nombre;
      selPrenda.appendChild(opcion);
    });
  mostrarPrecio();
}

// El precio va debajo del menú y no dentro de la opción: en la columna
// angosta de la computadora el texto se cortaba a media palabra.
function mostrarPrecio() {
  const pieza = CATALOGO.find(function (p) { return p.nombre === selPrenda.value; });
  document.getElementById('precioPieza').textContent =
    pieza ? pesos(pieza.precio) + ' por pieza' : '';
}

selCategoria.addEventListener('change', llenarPrendas);
selPrenda.addEventListener('change', mostrarPrecio);
llenarPrendas();

// Los más y menos son para capturar de pie, con el dedo, sin teclado
document.getElementById('masCantidad').addEventListener('click', function () {
  inpCantidad.value = (parseInt(inpCantidad.value, 10) || 0) + 1;
});
document.getElementById('menosCantidad').addEventListener('click', function () {
  inpCantidad.value = Math.max(1, (parseInt(inpCantidad.value, 10) || 2) - 1);
});

btnPrenda.addEventListener('click', function () {
  const pieza = CATALOGO.find(function (p) { return p.nombre === selPrenda.value; });
  const cantidad = parseInt(inpCantidad.value, 10);
  if (!pieza || !cantidad || cantidad < 1) return;

  prendas.push({ nombre: pieza.nombre, cat: pieza.cat, cantidad: cantidad,
                 precio: pieza.precio, costo: pieza.costo });
  inpCantidad.value = 1;
  dibujarNota();
});

function cambiarServicio() {
  const porKilo = radioLavan.checked;
  bloqueKilos.classList.toggle('d-none', !porKilo);
  bloquePiezas.classList.toggle('d-none', porKilo);
  dibujarNota();
}
radioTinto.addEventListener('change', cambiarServicio);
radioLavan.addEventListener('change', cambiarServicio);
inpKilos.addEventListener('input', dibujarNota);
cobroAnticipo.addEventListener('change', dibujarNota);
document.getElementById('cobroTotal').addEventListener('change', dibujarNota);

// Lo que la nota vale ahora mismo. Lo usan la pantalla y el guardado.
function cuentaNota() {
  let precio = 0, costo = 0, piezas = 0, tardaMas = false;
  const renglones = [];

  if (radioLavan.checked) {
    const kg = parseFloat(inpKilos.value) || 0;
    const cuenta = lavanderia(kg);
    precio = cuenta.precio;
    costo  = cuenta.costo;
    piezas = Math.max(1, Math.ceil(kg));        // la maquila cuenta bultos
    renglones.push({ texto: 'Lavandería ' + kg + ' kg', monto: precio });
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

  const pagado = cobroAnticipo.checked ? precio / 2 : precio;
  return { precio: precio, costo: costo, piezas: piezas, renglones: renglones,
           pagado: pagado, saldo: precio - pagado,
           entrega: fechaEntrega(new Date(), tardaMas) };
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
  document.getElementById('pagado').textContent       = pesos(c.pagado);
  document.getElementById('saldo').textContent        = pesos(c.saldo);
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


/* -------------------------------------------------------------------------
   6. LAS FIRMAS

   Un canvas y el dedo. No usa red ni biblioteca, así que sirve en la tablet
   aunque no haya internet. Son dos: una al dejar la ropa y otra al recogerla,
   como pide el punto 20 de los apuntes.
   ------------------------------------------------------------------------- */

const ALTO_FIRMA = 140;

function crearFirma(id) {
  const lienzo = document.getElementById(id);
  const pincel = lienzo.getContext('2d');
  let trazando = false;
  let hayTrazo = false;

  function ajustar() {
    // Cambiarle el ancho a un canvas lo borra. Al girar la tablet eso tiraba
    // la firma que el cliente ya había puesto, así que se guarda y se repinta.
    const guardado = hayTrazo ? lienzo.toDataURL() : null;

    const ancho = lienzo.clientWidth;
    if (ancho === 0) return;          // escondido todavía: no hay qué medir

    lienzo.width  = ancho * 2;        // al doble, para que no se vea pixelada
    lienzo.height = ALTO_FIRMA * 2;
    lienzo.style.height = ALTO_FIRMA + 'px';
    pincel.setTransform(1, 0, 0, 1, 0, 0);
    pincel.scale(2, 2);
    pincel.lineWidth = 2;
    pincel.lineCap = 'round';
    pincel.strokeStyle = '#212529';

    if (guardado) {
      const previa = new Image();
      previa.onload = function () { pincel.drawImage(previa, 0, 0, ancho, ALTO_FIRMA); };
      previa.src = guardado;
    }
  }

  function puntoEn(evento) {
    const caja = lienzo.getBoundingClientRect();
    return { x: evento.clientX - caja.left, y: evento.clientY - caja.top };
  }

  lienzo.addEventListener('pointerdown', function (evento) {
    trazando = true;
    hayTrazo = true;
    // Capturar el puntero evita que el trazo se corte si el dedo se sale del
    // recuadro. No todos los navegadores lo tienen, y no vale perder la firma
    // por eso.
    try { lienzo.setPointerCapture(evento.pointerId); } catch (e) { }
    const p = puntoEn(evento);
    pincel.beginPath();
    pincel.moveTo(p.x, p.y);
  });

  lienzo.addEventListener('pointermove', function (evento) {
    if (!trazando) return;
    evento.preventDefault();
    const p = puntoEn(evento);
    pincel.lineTo(p.x, p.y);
    pincel.stroke();
  });

  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (nombre) {
    lienzo.addEventListener(nombre, function () { trazando = false; });
  });

  ajustar();
  window.addEventListener('resize', ajustar);

  return {
    ajustar: ajustar,
    limpiar: function () {
      pincel.clearRect(0, 0, lienzo.width, lienzo.height);
      hayTrazo = false;
    },
    tiene: function () { return hayTrazo; },
    imagen: function () { return hayTrazo ? lienzo.toDataURL('image/png') : null; }
  };
}

const firmaRecibido = crearFirma('firma');
const firmaEntrega  = crearFirma('firmaEntrega');

document.getElementById('btnLimpiarFirma').addEventListener('click', firmaRecibido.limpiar);
document.getElementById('btnLimpiarEntrega').addEventListener('click', firmaEntrega.limpiar);


/* -------------------------------------------------------------------------
   7. GUARDAR LA NOTA
   ------------------------------------------------------------------------- */

function avisar(texto) {
  document.getElementById('textoAviso').textContent = texto;
  bootstrap.Toast.getOrCreateInstance(document.getElementById('avisoGuardado')).show();
}

document.getElementById('btnGuardar').addEventListener('click', function () {
  const folio = inpFolio.value.trim();
  if (folio === '') { inpFolio.focus(); avisar('Falta el número de nota.'); return; }

  const c = cuentaNota();
  if (c.piezas === 0) { avisar('La nota no tiene prendas.'); return; }

  NOTAS.unshift(conId({
    folio: folio,
    cliente: inpCliente.value.trim() || 'Sin nombre',
    telefono: document.getElementById('telCliente').value.trim(),
    piezas: c.piezas,
    total: c.precio,
    costo: c.costo,
    pagado: c.pagado,
    saldo: c.saldo,
    observaciones: inpObserva.value.trim(),
    detalle: c.renglones.map(function (r) { return r.texto; }).join(' · '),
    entrega: textoFecha(c.entrega),
    firmaRecibido: firmaRecibido.imagen(),
    fotos: fotos.slice(),
    estatus: 'recibida'
  }));

  if (!escribirNotas(NOTAS)) {
    // Si no se guardó, tampoco se queda en memoria: si no, el tablero
    // enseñaría una nota que al recargar ya no está.
    NOTAS.shift();
    avisar('No se pudo guardar: ya no cabe en la tablet. Hay que descargar las notas viejas.');
    return;
  }

  // Se limpia para la siguiente
  prendas = [];
  inpFolio.value = '';
  inpCliente.value = '';
  document.getElementById('telCliente').value = '';
  inpObserva.value = '';
  galeria.innerHTML = '';
  fotos = [];
  aviso.classList.remove('d-none');
  resumenCliente.textContent = 'Sin nombre';
  firmaRecibido.limpiar();
  dibujarNota();

  avisar('Nota ' + folio + ' guardada.');
  irA('tablero');
});


/* -------------------------------------------------------------------------
   8. TABLERO
   ------------------------------------------------------------------------- */

function tarjetaNota(n) {
  const li = document.createElement('li');
  li.className = 'list-group-item';

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

  // Lo embolsado es lo que el cliente puede venir a recoger
  if (n.estatus === 'lista') {
    const entregar = document.createElement('button');
    entregar.className = 'btn btn-sm btn-primary w-100 mt-2';
    entregar.textContent = n.saldo > 0 ? 'Cobrar y entregar' : 'Entregar';
    entregar.addEventListener('click', function () { abrirEntrega(n.id); });
    li.appendChild(entregar);
  }
  return li;
}

function dibujarTablero() {
  const cajon = document.getElementById('columnas');
  cajon.innerHTML = '';

  ETAPAS.forEach(function (etapa) {
    const deEsta = NOTAS.filter(function (n) { return n.estatus === etapa.id; });

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


/* -------------------------------------------------------------------------
   8.1 ENTREGAR LA ROPA

   El cliente viene por su ropa, paga lo que debe y firma de entregado. Es la
   segunda firma del punto 20: una al dejarla y otra al recogerla.
   ------------------------------------------------------------------------- */

const cuadroEntrega = document.getElementById('modalEntrega');
let notaEnEntrega = null;

function abrirEntrega(id) {
  notaEnEntrega = NOTAS.find(function (n) { return n.id === id; });
  if (!notaEnEntrega) return;

  document.getElementById('entregaNota').textContent =
    notaEnEntrega.folio + ' · ' + notaEnEntrega.cliente;
  document.getElementById('entregaDetalle').textContent =
    notaEnEntrega.piezas + (notaEnEntrega.piezas === 1 ? ' pieza · ' : ' piezas · ') +
    (notaEnEntrega.detalle || '');
  document.getElementById('entregaSaldo').textContent = pesos(notaEnEntrega.saldo);

  firmaEntrega.limpiar();
  bootstrap.Modal.getOrCreateInstance(cuadroEntrega).show();
}

// El canvas está escondido hasta que se abre el cuadro, y un canvas sin
// ancho visible mide cero. Se ajusta cuando ya se está viendo.
cuadroEntrega.addEventListener('shown.bs.modal', firmaEntrega.ajustar);

document.getElementById('btnConfirmarEntrega').addEventListener('click', function () {
  if (!notaEnEntrega) return;

  if (!firmaEntrega.tiene()) {
    avisar('Falta que el cliente firme de entregado.');
    return;
  }

  notaEnEntrega.firmaEntrega = firmaEntrega.imagen();
  notaEnEntrega.pagado = notaEnEntrega.total;    // al recoger se liquida
  notaEnEntrega.saldo = 0;
  notaEnEntrega.estatus = 'entregada';
  escribirNotas(NOTAS);

  bootstrap.Modal.getOrCreateInstance(cuadroEntrega).hide();
  dibujarTablero();
  avisar('Nota ' + notaEnEntrega.folio + ' entregada.');
  notaEnEntrega = null;
});


/* -------------------------------------------------------------------------
   9. MAQUILA

   Lo que sale el martes, lo que se le paga en el momento, y lo que regresa.
   ------------------------------------------------------------------------- */

function renglonMaquila(n, conConteo) {
  const li = document.createElement('li');
  li.className = 'list-group-item d-flex justify-content-between align-items-center gap-2';

  const izq = document.createElement('div');
  izq.className = 'min-w-0';
  const t = document.createElement('div');
  t.className = 'fw-semibold';
  t.textContent = n.folio + ' · ' + n.cliente;
  const s = document.createElement('small');
  s.className = 'text-secondary d-block';
  s.textContent = n.detalle || '';
  izq.appendChild(t);
  izq.appendChild(s);
  li.appendChild(izq);

  if (conConteo) {
    // El punto 3 pide la nota del total de prendas enviadas y a recibir. Al
    // volver se cuenta contra lo que salió, que es lo que evita que se pierda
    // ropa sin que nadie se dé cuenta.
    const caja = document.createElement('div');
    caja.className = 'text-end flex-shrink-0';

    const salieron = document.createElement('small');
    salieron.className = 'text-secondary d-block';
    salieron.textContent = 'Salieron ' + n.piezas;
    caja.appendChild(salieron);

    const cuenta = document.createElement('input');
    cuenta.type = 'number';
    cuenta.min = '0';
    cuenta.value = n.piezas;
    cuenta.className = 'form-control form-control-sm text-center conteo-vuelta';
    cuenta.setAttribute('aria-label', 'Prendas que regresaron de la nota ' + n.folio);
    cuenta.dataset.nota = n.id;
    caja.appendChild(cuenta);

    li.appendChild(caja);
  } else {
    const der = document.createElement('div');
    der.className = 'text-end flex-shrink-0';
    const piezas = document.createElement('div');
    piezas.className = 'fw-semibold';
    piezas.textContent = n.piezas + (n.piezas === 1 ? ' pieza' : ' piezas');
    const pago = document.createElement('small');
    pago.className = 'text-danger';
    pago.textContent = pesos(n.costo);
    der.appendChild(piezas);
    der.appendChild(pago);
    li.appendChild(der);
  }

  return li;
}

function porEnviar() {
  return NOTAS.filter(function (n) { return n.estatus === 'recibida'; });
}
function enMaquila() {
  return NOTAS.filter(function (n) { return n.estatus === 'maquila'; });
}

function dibujarMaquila() {
  const envio = porEnviar();
  const fuera = enMaquila();

  const lista = document.getElementById('listaEnvio');
  lista.innerHTML = '';
  envio.forEach(function (n) { lista.appendChild(renglonMaquila(n)); });

  const otra = document.getElementById('listaMaquila');
  otra.innerHTML = '';
  fuera.forEach(function (n) { otra.appendChild(renglonMaquila(n, true)); });

  const piezas = envio.reduce(function (s, n) { return s + n.piezas; }, 0);
  const pago   = envio.reduce(function (s, n) { return s + n.costo;  }, 0);

  document.getElementById('contadorEnvio').textContent =
    envio.length + (envio.length === 1 ? ' nota' : ' notas');
  document.getElementById('contadorMaquila').textContent =
    fuera.length + (fuera.length === 1 ? ' nota' : ' notas');
  document.getElementById('envioPiezas').textContent = piezas;
  document.getElementById('envioPago').textContent   = pesos(pago);
  document.getElementById('envioRegreso').textContent =
    textoFecha(regresoDe(proximaSalida(new Date())));
}

document.getElementById('btnEnviar').addEventListener('click', function () {
  const envio = porEnviar();
  if (envio.length === 0) { avisar('No hay notas para enviar.'); return; }
  envio.forEach(function (n) { n.estatus = 'maquila'; });
  escribirNotas(NOTAS);
  dibujarMaquila();
  avisar(envio.length + (envio.length === 1 ? ' nota salió' : ' notas salieron') + ' a la maquila.');
});

document.getElementById('btnRecibir').addEventListener('click', function () {
  const fuera = enMaquila();
  if (fuera.length === 0) { avisar('No hay nada en la maquila.'); return; }

  let faltantes = 0;
  let notasCortas = 0;

  document.querySelectorAll('.conteo-vuelta').forEach(function (casilla) {
    const nota = NOTAS.find(function (n) { return n.id === casilla.dataset.nota; });
    if (!nota) return;

    const regresaron = Math.max(0, parseInt(casilla.value, 10) || 0);
    nota.regresaron = regresaron;
    nota.faltan = Math.max(0, nota.piezas - regresaron);
    nota.estatus = 'devuelta';

    if (nota.faltan > 0) { faltantes += nota.faltan; notasCortas += 1; }
  });

  escribirNotas(NOTAS);
  dibujarMaquila();

  if (faltantes > 0) {
    avisar((faltantes === 1 ? 'Falta ' : 'Faltan ') + faltantes +
           (faltantes === 1 ? ' prenda en ' : ' prendas en ') + notasCortas +
           (notasCortas === 1 ? ' nota.' : ' notas.'));
  } else {
    avisar('Regresó todo: ' + fuera.length + (fuera.length === 1 ? ' nota.' : ' notas.'));
  }
});


/* -------------------------------------------------------------------------
   10. CORTE
   ------------------------------------------------------------------------- */

function dibujarCorte() {
  const facturado = NOTAS.reduce(function (s, n) { return s + n.total;  }, 0);
  const cobrado   = NOTAS.reduce(function (s, n) { return s + n.pagado; }, 0);
  const porCobrar = NOTAS.reduce(function (s, n) { return s + n.saldo;  }, 0);
  const maquila   = NOTAS.reduce(function (s, n) { return s + n.costo;  }, 0);

  document.getElementById('cFacturado').textContent = pesos(facturado);
  document.getElementById('cCobrado').textContent   = pesos(cobrado);
  document.getElementById('cPorCobrar').textContent = pesos(porCobrar);
  document.getElementById('cMaquila').textContent   = pesos(maquila);
  document.getElementById('cUtilidad').textContent  = pesos(facturado - maquila);

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
   11. LOS TRES DOCUMENTOS

   El mismo pedido contado de tres maneras: para el cliente, para la maquila
   y para el dueño. Se arman con createElement por la misma razón de siempre:
   adentro va texto que escribió alguien.
   ------------------------------------------------------------------------- */

const hoja = document.createElement('div');
hoja.id = 'hoja';
document.body.appendChild(hoja);

function renglonHoja(izquierda, derecha, fuerte) {
  const d = document.createElement('div');
  d.className = 'hoja-renglon' + (fuerte ? ' fw-bold' : '');
  const a = document.createElement('span');
  a.textContent = izquierda;
  const b = document.createElement('span');
  b.textContent = derecha;
  d.appendChild(a);
  d.appendChild(b);
  return d;
}

function imprimirHoja(titulo, armar, clase) {
  hoja.className = clase || '';
  hoja.innerHTML = '';
  const h = document.createElement('h2');
  h.textContent = titulo;
  hoja.appendChild(h);
  const fecha = document.createElement('p');
  fecha.className = 'hoja-fecha';
  fecha.textContent = textoFecha(new Date()) + ' · Sucursal 1';
  hoja.appendChild(fecha);
  armar(hoja);
  document.body.classList.add('imprimiendo');
  // Se quita cuando el navegador termina. Quitarla justo después de print()
  // no sirve: no todos los navegadores se detienen ahí.
  window.addEventListener('afterprint', function quitar() {
    document.body.classList.remove('imprimiendo');
    window.removeEventListener('afterprint', quitar);
  });
  window.print();
}

// Documento 1: el ticket del cliente
document.getElementById('btnTicket').addEventListener('click', function () {
  const c = cuentaNota();
  if (c.piezas === 0) { avisar('La nota no tiene prendas.'); return; }

  imprimirHoja('Ticket de cliente', function (caja) {
    caja.appendChild(renglonHoja('Nota', inpFolio.value.trim() || 'sin número'));
    caja.appendChild(renglonHoja('Cliente', inpCliente.value.trim() || 'Sin nombre'));
    caja.appendChild(renglonHoja('Entrega', textoFecha(c.entrega)));
    caja.appendChild(document.createElement('hr'));
    c.renglones.forEach(function (r) {
      caja.appendChild(renglonHoja(r.texto, pesos(r.monto)));
    });
    caja.appendChild(document.createElement('hr'));
    caja.appendChild(renglonHoja('Piezas', String(c.piezas)));
    caja.appendChild(renglonHoja('Total', pesos(c.precio), true));
    caja.appendChild(renglonHoja('Recibido', pesos(c.pagado)));
    caja.appendChild(renglonHoja('Saldo', pesos(c.saldo), true));

    if (inpObserva.value.trim()) {
      const obs = document.createElement('p');
      obs.className = 'hoja-obs';
      obs.textContent = 'Observaciones: ' + inpObserva.value.trim();
      caja.appendChild(obs);
    }

    const firma = document.createElement('div');
    firma.className = 'hoja-firma';
    firma.textContent = 'Firma de recibido';
    caja.appendChild(firma);
  });
});

// Documento 2: la nota de la maquila
document.getElementById('btnNotaMaquila').addEventListener('click', function () {
  const envio = porEnviar();
  if (envio.length === 0) { avisar('No hay notas para enviar.'); return; }

  imprimirHoja('Nota de maquila', function (caja) {
    caja.appendChild(renglonHoja('Regresa', textoFecha(regresoDe(proximaSalida(new Date())))));
    caja.appendChild(document.createElement('hr'));
    envio.forEach(function (n) {
      caja.appendChild(renglonHoja(
        n.folio + ' · ' + n.cliente,
        n.piezas + (n.piezas === 1 ? ' pieza' : ' piezas')));
    });
    caja.appendChild(document.createElement('hr'));
    caja.appendChild(renglonHoja('Prendas que van',
      String(envio.reduce(function (s, n) { return s + n.piezas; }, 0)), true));
    caja.appendChild(renglonHoja('Se paga',
      pesos(envio.reduce(function (s, n) { return s + n.costo; }, 0)), true));

    const firma = document.createElement('div');
    firma.className = 'hoja-firma';
    firma.textContent = 'Firma de entrega y recibo';
    caja.appendChild(firma);
  });
});

// Documento 4: las etiquetas que se pegan a cada prenda antes de que salga.
// El punto 2 de los apuntes: la ropa se rastrea por el número de su nota.
document.getElementById('btnEtiquetas').addEventListener('click', function () {
  const envio = porEnviar();
  if (envio.length === 0) { avisar('No hay notas para enviar.'); return; }

  const vuelve = textoFecha(regresoDe(proximaSalida(new Date())));

  imprimirHoja('Etiquetas', function (caja) {
    const rejilla = document.createElement('div');
    rejilla.className = 'etiquetas';

    envio.forEach(function (n) {
      for (let i = 1; i <= n.piezas; i++) {
        const et = document.createElement('div');
        et.className = 'etiqueta';

        const folio = document.createElement('div');
        folio.className = 'folio';
        folio.textContent = n.folio;

        const quien = document.createElement('div');
        quien.className = 'quien';
        quien.textContent = n.cliente;

        const pieza = document.createElement('div');
        pieza.className = 'pieza';
        const cual = document.createElement('span');
        cual.textContent = 'Pieza ' + i + ' de ' + n.piezas;
        const cuando = document.createElement('span');
        cuando.textContent = vuelve;
        pieza.appendChild(cual);
        pieza.appendChild(cuando);

        et.appendChild(folio);
        et.appendChild(quien);
        et.appendChild(pieza);
        rejilla.appendChild(et);
      }
    });

    caja.appendChild(rejilla);
  }, 'ancha');
});

// Documento 3: el conteo del dueño
document.getElementById('btnConteo').addEventListener('click', function () {
  imprimirHoja('Conteo financiero', function (caja) {
    const facturado = NOTAS.reduce(function (s, n) { return s + n.total;  }, 0);
    const cobrado   = NOTAS.reduce(function (s, n) { return s + n.pagado; }, 0);
    const maquila   = NOTAS.reduce(function (s, n) { return s + n.costo;  }, 0);

    caja.appendChild(renglonHoja('Notas', String(NOTAS.length)));
    caja.appendChild(renglonHoja('Piezas',
      String(NOTAS.reduce(function (s, n) { return s + n.piezas; }, 0))));
    caja.appendChild(document.createElement('hr'));
    caja.appendChild(renglonHoja('Facturado', pesos(facturado)));
    caja.appendChild(renglonHoja('Cobrado', pesos(cobrado)));
    caja.appendChild(renglonHoja('Por cobrar', pesos(facturado - cobrado)));
    caja.appendChild(renglonHoja('Pagado a maquila', pesos(maquila)));
    caja.appendChild(document.createElement('hr'));
    caja.appendChild(renglonHoja('Utilidad', pesos(facturado - maquila), true));
  });
});


dibujarTablero();


/* -------------------------------------------------------------------------
   12. TRABAJAR SIN INTERNET

   El punto 20 de los apuntes lo pide. Bootstrap ya vive dentro del proyecto,
   y el service worker guarda la aplicación en la tablet para que abra en frío
   aunque no haya señal desde que se prende.
   ------------------------------------------------------------------------- */

const estadoRed = document.getElementById('estadoRed');

function marcarEstado() {
  if (!estadoRed) return;
  if (!navigator.onLine) {
    estadoRed.textContent = 'Sin señal · sigue trabajando';
    estadoRed.className = 'mt-2 small text-warning';
  } else if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    estadoRed.textContent = 'Guardada en la tablet';
    estadoRed.className = 'mt-2 small text-success';
  } else {
    estadoRed.textContent = '';
  }
}

window.addEventListener('online', marcarEstado);
window.addEventListener('offline', marcarEstado);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js')
      .then(function () {
        // Cuando toma el control, la aplicación ya está completa en la tablet
        if (navigator.serviceWorker.controller) marcarEstado();
        navigator.serviceWorker.addEventListener('controllerchange', marcarEstado);
      })
      .catch(function () {
        // Abierta con doble clic (file://) no hay service worker, y está bien:
        // la aplicación funciona igual, nada más no queda guardada.
      });
  });
}
marcarEstado();
