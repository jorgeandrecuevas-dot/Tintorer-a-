/* =========================================================================
   Tintorería · Nota nueva
   Proyecto de la asignatura — incluye la Actividad 1 (galería de imágenes)

   Los precios de este archivo son los de la lista que entregó el dueño
   del negocio: costo y precio al público de cada pieza.
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
  ruta:    'Ruta del día',
  corte:   'Corte'
};

function irA(nombre) {
  if (!TITULOS[nombre]) return;

  // Se esconden todas las pantallas y se muestra la pedida
  document.querySelectorAll('.vista').forEach(function (seccion) {
    seccion.classList.toggle('d-none', seccion.id !== 'vista-' + nombre);
  });

  // El menú marca dónde estás. Hay dos menús —el fijo y el cajón—, así que
  // se recorren los dos con el mismo selector.
  document.querySelectorAll('.nav-link[data-vista]').forEach(function (enlace) {
    enlace.classList.toggle('active', enlace.dataset.vista === nombre);
  });

  document.getElementById('tituloVista').textContent = TITULOS[nombre];

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

// addEventListener para el clic del botón
boton.addEventListener('click', function () {

  const url = campo.value.trim();
  if (url === '') return;                        // sin URL no se hace nada

  // document.createElement() para la columna y para la imagen
  const columna = document.createElement('div');
  columna.className = 'col';

  const img = document.createElement('img');
  img.src = url;
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

  aviso.classList.add('d-none');
  campo.value = '';
  campo.focus();
});

// Comodidad: presionar Enter en el campo hace lo mismo que el botón
campo.addEventListener('keydown', function (evento) {
  if (evento.key === 'Enter') boton.click();
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
   3. CAPTURA DE PRENDAS Y TOTALES
   ------------------------------------------------------------------------- */

const selCategoria  = document.getElementById('categoria');
const selPrenda     = document.getElementById('prenda');
const inpCantidad   = document.getElementById('cantidad');
const btnPrenda     = document.getElementById('btnAgregarPrenda');
const listaPrendas  = document.getElementById('listaPrendas');
const inpKilos      = document.getElementById('kilos');
const bloquePiezas  = document.getElementById('bloquePiezas');
const bloqueKilos   = document.getElementById('bloqueKilos');
const radioTinto    = document.getElementById('servTintoreria');
const radioLavan    = document.getElementById('servLavanderia');
const inpCliente    = document.getElementById('nombreCliente');
const resumenCliente = document.getElementById('resumenCliente');

// El campo del cliente estaba en el HTML pero nadie lo leía: el nombre
// no llegaba al resumen. Ahora se copia conforme se escribe.
inpCliente.addEventListener('input', function () {
  resumenCliente.textContent = inpCliente.value.trim() || 'Sin nombre';
});

let prendas = [];   // lo que lleva la nota hasta ahora

function pesos(n) {
  return '$' + n.toLocaleString('es-MX');
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

// Llena el menú de categorías
CATEGORIAS.forEach(function (c) {
  const opcion = document.createElement('option');
  opcion.value = c.id;
  opcion.textContent = c.nombre;
  selCategoria.appendChild(opcion);
});

// Llena el menú de prendas según la categoría elegida
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

btnPrenda.addEventListener('click', function () {
  const pieza = CATALOGO.find(function (p) { return p.nombre === selPrenda.value; });
  const cantidad = parseInt(inpCantidad.value, 10);
  if (!pieza || !cantidad || cantidad < 1) return;

  prendas.push({ nombre: pieza.nombre, cantidad: cantidad,
                 precio: pieza.precio, costo: pieza.costo });
  inpCantidad.value = 1;
  dibujarNota();
});

// Cambio entre cobrar por pieza y cobrar por kilo
function cambiarServicio() {
  const porKilo = radioLavan.checked;
  bloqueKilos.classList.toggle('d-none', !porKilo);
  bloquePiezas.classList.toggle('d-none', porKilo);
  dibujarNota();
}
radioTinto.addEventListener('change', cambiarServicio);
radioLavan.addEventListener('change', cambiarServicio);
inpKilos.addEventListener('input', dibujarNota);

function dibujarNota() {
  listaPrendas.innerHTML = '';
  let precio = 0;
  let costo  = 0;

  if (radioLavan.checked) {
    const kg = parseFloat(inpKilos.value) || 0;
    const cuenta = lavanderia(kg);
    precio = cuenta.precio;
    costo  = cuenta.costo;

    listaPrendas.appendChild(renglonResumen('Lavandería ' + kg + ' kg', pesos(precio)));

  } else {
    prendas.forEach(function (p) {
      precio += p.precio * p.cantidad;
      costo  += p.costo  * p.cantidad;

      listaPrendas.appendChild(
        renglonResumen(p.nombre + ' ×' + p.cantidad, pesos(p.precio * p.cantidad)));
    });
  }

  document.getElementById('total').textContent    = pesos(precio);
  document.getElementById('costo').textContent    = pesos(costo);
  document.getElementById('ganancia').textContent = pesos(precio - costo);
}

// El margen arranca oculto porque el cliente está viendo la pantalla
// cuando se levanta la nota en su domicilio.
const btnMargen  = document.getElementById('btnMargen');
const cajaMargen = document.getElementById('cajaMargen');

btnMargen.addEventListener('click', function () {
  const oculto = cajaMargen.classList.toggle('d-none');
  btnMargen.textContent = oculto ? 'Ver margen' : 'Ocultar margen';
});

dibujarNota();


/* -------------------------------------------------------------------------
   4. GUARDAR LA NOTA

   Todavía no hay a dónde guardarla: falta la base de datos. Por ahora el
   botón avisa y manda al tablero, que es a donde iría la nota.
   ------------------------------------------------------------------------- */

document.getElementById('btnGuardar').addEventListener('click', function () {
  bootstrap.Toast.getOrCreateInstance(document.getElementById('avisoGuardado')).show();
  irA('tablero');
});
