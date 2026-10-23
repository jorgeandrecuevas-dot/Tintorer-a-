/* Lo que se puede cambiar sin tocar el código, y dónde se guarda.

   No toca la pantalla. Sin almacén (como en las pruebas que corren en Node)
   todo vale lo que valía antes: los valores por omisión. */

const LLAVE = 'tintoreria.ajustes';
const LLAVE_SUCURSAL = 'tintoreria.sucursal';
const LLAVE_QUIEN = 'tintoreria.quien';

// Lo que vale cada ajuste si nadie lo cambió. Los tres de la lavandería salen
// de los 30 renglones de la hoja del dueño. El 7 de la hora de salida es del
// martes: de jueves y sábado no se sabe.
export const POR_OMISION = Object.freeze({
  anticipoPct: 50,
  diasSinRecoger: 15,
  diasSinRespaldo: 7,
  horaSalida: 7,
  lavanderia: Object.freeze({ precioKilo: 45, costoPrimerKilo: 32, costoPorKilo: 16 })
});

// Mínimo y máximo de cada uno. Fuera de eso, se queda el valor por omisión.
const LIMITES = {
  anticipoPct:     [0, 100],
  diasSinRecoger:  [1, 365],
  diasSinRespaldo: [1, 90],
  horaSalida:      [0, 23.99],
  precioKilo:      [0, 9999],
  costoPrimerKilo: [0, 9999],
  costoPorKilo:    [0, 9999],
  precio:          [0, 99999],
  costo:           [0, 99999]
};

export function dentroDeLimites(nombre, valor) {
  const [min, max] = LIMITES[nombre];
  return typeof valor === 'number' && Number.isFinite(valor) && valor >= min && valor <= max;
}

const almacen = () => (typeof localStorage === 'undefined' ? null : localStorage);

function leer(llave) {
  try { const a = almacen(); return a ? a.getItem(llave) : null; } catch (e) { return null; }
}
function escribir(llave, valor) {
  try {
    const a = almacen();
    if (!a) return false;
    if (valor === '' || valor === null) a.removeItem(llave); else a.setItem(llave, valor);
    return true;
  } catch (e) { return false; }
}

// Los ajustes tal como están guardados, con lo que falte o venga mal
// reemplazado por lo de siempre
function limpiar(crudo) {
  const c = crudo && typeof crudo === 'object' ? crudo : {};
  const bueno = (nombre, valor) => (dentroDeLimites(nombre, valor) ? valor : POR_OMISION[nombre]);
  const lav = c.lavanderia && typeof c.lavanderia === 'object' ? c.lavanderia : {};
  const precios = {};
  if (c.precios && typeof c.precios === 'object') {
    Object.keys(c.precios).forEach(function (k) {
      const p = c.precios[k];
      if (p && dentroDeLimites('precio', p.precio) && dentroDeLimites('costo', p.costo)) {
        precios[k] = { precio: p.precio, costo: p.costo };
      }
    });
  }
  return {
    anticipoPct:     bueno('anticipoPct', c.anticipoPct),
    diasSinRecoger:  bueno('diasSinRecoger', c.diasSinRecoger),
    diasSinRespaldo: bueno('diasSinRespaldo', c.diasSinRespaldo),
    horaSalida:      bueno('horaSalida', c.horaSalida),
    lavanderia: {
      precioKilo:      dentroDeLimites('precioKilo', lav.precioKilo) ? lav.precioKilo : POR_OMISION.lavanderia.precioKilo,
      costoPrimerKilo: dentroDeLimites('costoPrimerKilo', lav.costoPrimerKilo) ? lav.costoPrimerKilo : POR_OMISION.lavanderia.costoPrimerKilo,
      costoPorKilo:    dentroDeLimites('costoPorKilo', lav.costoPorKilo) ? lav.costoPorKilo : POR_OMISION.lavanderia.costoPorKilo
    },
    precios: precios
  };
}

let guardados = null;

export function ajustes() {
  if (guardados) return guardados;
  let crudo = null;
  try { crudo = JSON.parse(leer(LLAVE)); } catch (e) { crudo = null; }
  guardados = limpiar(crudo);
  return guardados;
}

const escuchas = [];
export function alAjustar(fn) {
  escuchas.push(fn);
}

// Cambia lo que se pida y deja lo demás. Devuelve si se pudo guardar.
export function guardarAjustes(cambios) {
  const ahora = ajustes();
  const nuevo = limpiar({
    ...ahora,
    ...cambios,
    lavanderia: { ...ahora.lavanderia, ...(cambios.lavanderia || {}) }
  });
  guardados = nuevo;
  const ok = escribir(LLAVE, JSON.stringify(nuevo));
  escuchas.forEach(function (fn) { fn(); });
  return ok;
}

export function volverALosOriginales() {
  guardados = limpiar(null);
  escribir(LLAVE, '');
  escuchas.forEach(function (fn) { fn(); });
}

const llavePieza = (p) => p.cat + '|' + p.nombre;

// Lo que cuesta y lo que se cobra una pieza hoy: el cambio si lo hay, si no el de la hoja
export function precioDe(pieza) {
  const cambio = ajustes().precios[llavePieza(pieza)];
  return cambio ? { precio: cambio.precio, costo: cambio.costo }
                : { precio: pieza.precio, costo: pieza.costo };
}

export function cambiarPrecio(pieza, precio, costo) {
  const precios = { ...ajustes().precios };
  if (precio === pieza.precio && costo === pieza.costo) delete precios[llavePieza(pieza)];
  else precios[llavePieza(pieza)] = { precio: precio, costo: costo };
  return guardarAjustes({ precios: precios });
}

export function estaCambiada(pieza) {
  return !!ajustes().precios[llavePieza(pieza)];
}

// ---- el nombre de esta tablet y quién atiende: cada tablet tiene los suyos ----

export function nombreSucursal() {
  return leer(LLAVE_SUCURSAL) || 'Sucursal 1';
}
export function nombreGuardado() {
  return leer(LLAVE_SUCURSAL) || '';
}
export function ponerNombreSucursal(nombre) {
  return escribir(LLAVE_SUCURSAL, nombre);
}

export function quienAtiende() {
  return leer(LLAVE_QUIEN) || '';
}
export function ponerQuienAtiende(nombre) {
  return escribir(LLAVE_QUIEN, nombre);
}

// ---- el respaldo se lleva los ajustes, menos el nombre de la tablet ----

export function ajustesParaRespaldo() {
  return JSON.parse(JSON.stringify(ajustes()));
}

export function restaurarAjustes(datos) {
  guardados = limpiar(datos);
  escribir(LLAVE, JSON.stringify(guardados));
  escuchas.forEach(function (fn) { fn(); });
}
