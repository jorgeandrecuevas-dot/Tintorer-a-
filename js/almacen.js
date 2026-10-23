/* El almacén de imágenes (IndexedDB). Las fotos y las firmas no caben en el almacén chico del navegador. */
/* -------------------------------------------------------------------------
   4.1 EL ALMACÉN DE IMÁGENES

   Las fotos y las firmas no caben en el almacén chico del navegador. Está
   medido: una nota con cuatro fotos pesa 1,032 KB y ahí solo entran 5 MB,
   o sea 4 notas. IndexedDB crece con el disco de la tablet.

   La nota guarda nada más el nombre de cada imagen. La imagen vive aquí.
   ------------------------------------------------------------------------- */

const BD_NOMBRE = 'tintoreria';

const BD_TIENDA = 'imagenes';

let bdAbierta = null;

function abrirBD() {
  if (bdAbierta) return bdAbierta;
  bdAbierta = new Promise(function (listo) {
    if (!window.indexedDB) { listo(null); return; }
    let peticion;
    try { peticion = indexedDB.open(BD_NOMBRE, 1); }
    catch (e) { listo(null); return; }
    peticion.onupgradeneeded = function () {
      peticion.result.createObjectStore(BD_TIENDA);
    };
    peticion.onsuccess = function () { listo(peticion.result); };
    peticion.onerror   = function () { listo(null); };
    peticion.onblocked = function () { listo(null); };
  });
  return bdAbierta;
}

// Las notas viejas traen la imagen adentro, y empiezan con "data:". Por eso
// se pregunta antes de ir al almacén: así las dos formas conviven.
export function esImagenAdentro(v) {
  return typeof v === 'string' && v.slice(0, 5) === 'data:';
}

function nombreImagen() {
  return 'i' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// Devuelve el nombre con el que quedó, o null si la tablet no dejó guardarla
export function guardarImagen(dataURL) {
  if (!dataURL) return Promise.resolve(null);
  return abrirBD().then(function (bd) {
    if (!bd) return null;
    return new Promise(function (listo) {
      const nombre = nombreImagen();
      let t;
      try { t = bd.transaction(BD_TIENDA, 'readwrite'); }
      catch (e) { listo(null); return; }
      t.objectStore(BD_TIENDA).put(dataURL, nombre);
      t.oncomplete = function () { listo(nombre); };
      t.onerror    = function () { listo(null); };
      t.onabort    = function () { listo(null); };
    });
  });
}

export function leerImagen(nombre) {
  if (!nombre) return Promise.resolve(null);
  if (esImagenAdentro(nombre)) return Promise.resolve(nombre);
  return abrirBD().then(function (bd) {
    if (!bd) return null;
    return new Promise(function (listo) {
      let t;
      try { t = bd.transaction(BD_TIENDA, 'readonly'); }
      catch (e) { listo(null); return; }
      const p = t.objectStore(BD_TIENDA).get(nombre);
      p.onsuccess = function () { listo(p.result || null); };
      p.onerror   = function () { listo(null); };
    });
  });
}

export function borrarImagenes(nombres) {
  if (!nombres || nombres.length === 0) return Promise.resolve();
  return abrirBD().then(function (bd) {
    if (!bd) return;
    return new Promise(function (listo) {
      let t;
      try { t = bd.transaction(BD_TIENDA, 'readwrite'); }
      catch (e) { listo(); return; }
      const tienda = t.objectStore(BD_TIENDA);
      nombres.forEach(function (n) { tienda.delete(n); });
      t.oncomplete = function () { listo(); };
      t.onerror    = function () { listo(); };
      t.onabort    = function () { listo(); };
    });
  });
}

// Todas las imágenes del almacén, para meterlas al respaldo
export function todasLasImagenes() {
  return abrirBD().then(function (bd) {
    if (!bd) return [];
    return new Promise(function (listo) {
      let t;
      try { t = bd.transaction(BD_TIENDA, 'readonly'); }
      catch (e) { listo([]); return; }
      const tienda = t.objectStore(BD_TIENDA);
      const nombres = tienda.getAllKeys();
      const datos   = tienda.getAll();
      t.oncomplete = function () {
        listo(nombres.result.map(function (n, i) { return [n, datos.result[i]]; }));
      };
      t.onerror = function () { listo([]); };
      t.onabort = function () { listo([]); };
    });
  });
}

// Mete al almacén las imágenes que vienen de un respaldo
export function meterImagenes(pares) {
  if (!pares || pares.length === 0) return Promise.resolve(true);
  return abrirBD().then(function (bd) {
    if (!bd) return false;
    return new Promise(function (listo) {
      let t;
      try { t = bd.transaction(BD_TIENDA, 'readwrite'); }
      catch (e) { listo(false); return; }
      const tienda = t.objectStore(BD_TIENDA);
      pares.forEach(function (par) { tienda.put(par[1], par[0]); });
      t.oncomplete = function () { listo(true); };
      t.onerror    = function () { listo(false); };
      t.onabort    = function () { listo(false); };
    });
  });
}

export function vaciarImagenes() {
  return abrirBD().then(function (bd) {
    if (!bd) return;
    return new Promise(function (listo) {
      let t;
      try { t = bd.transaction(BD_TIENDA, 'readwrite'); }
      catch (e) { listo(); return; }
      t.objectStore(BD_TIENDA).clear();
      t.oncomplete = function () { listo(); };
      t.onerror    = function () { listo(); };
      t.onabort    = function () { listo(); };
    });
  });
}
