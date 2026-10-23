/* El respaldo a un archivo, y el recordatorio de bajarlo. */
import { meterImagenes, todasLasImagenes, vaciarImagenes } from './almacen.js';
import { avisar } from './avisos.js';
import { confirmar } from './confirmar.js';
import { alEntrar } from './navegacion.js';
import { NOTAS, escribirNotas, normalizarNota, reemplazarNotas } from './notas.js';

/* -------------------------------------------------------------------------
   14. EL RESPALDO

   Todo vive en una tablet. Se moja, se cae o alguien le borra los datos del
   navegador y se va la libreta completa del negocio. El archivo que baja de
   aquí es lo único que lo evita.

   Trae las notas y sus imágenes. Se arma por pedazos y no como un solo texto
   gigante, porque con cientos de fotos adentro eso no cabe en memoria.
   ------------------------------------------------------------------------- */

const RESPALDO_VERSION = 2;

/* El recordatorio. Un respaldo que nadie se acuerda de bajar no sirve. Si
   llevan más de una semana sin bajarlo sale un aviso en cualquier pantalla.
   Se cuenta desde el último respaldo o, si nunca han bajado uno, desde la
   primera vez que hubo notas: el primer día no se regaña a nadie. */

const LLAVE_RESPALDO = 'tintoreria.ultimoRespaldo';

const LLAVE_DESDE = 'tintoreria.desde';

const DIAS_SIN_RESPALDO = 7;

function leerLlave(llave) {
  try { return localStorage.getItem(llave); } catch (e) { return null; }
}

function guardarLlave(llave, valor) {
  try { localStorage.setItem(llave, valor); } catch (e) { /* sin almacén no hay aviso */ }
}

function diasSinRespaldo() {
  if (NOTAS.length === 0) return null;
  let desde = leerLlave(LLAVE_DESDE);
  if (!desde) { desde = new Date().toISOString(); guardarLlave(LLAVE_DESDE, desde); }
  const ultimo = leerLlave(LLAVE_RESPALDO);
  const base = Math.max(new Date(desde).getTime(), ultimo ? new Date(ultimo).getTime() : 0);
  return Math.max(0, Math.floor((Date.now() - base) / 86400000));
}

export function pintarAvisoRespaldo() {
  const dias = diasSinRespaldo();
  const toca = dias !== null && dias >= DIAS_SIN_RESPALDO;
  document.getElementById('avisoRespaldoViejo').classList.toggle('d-none', !toca);
  if (toca) {
    document.getElementById('textoRespaldoViejo').textContent =
      'Llevas ' + dias + ' días sin bajar el respaldo. Si la tablet se pierde, se va la libreta.';
  }
}

document.getElementById('btnRespaldoAviso').addEventListener('click', function () {
  document.getElementById('btnRespaldo').click();
});

const letreroRespaldo = document.getElementById('avisoRespaldo');

function nombreDeArchivo() {
  const d = new Date();
  const dos = function (x) { return String(x).padStart(2, '0'); };
  return 'respaldo-tintoreria-' + d.getFullYear() + '-' +
         dos(d.getMonth() + 1) + '-' + dos(d.getDate()) + '.json';
}

document.getElementById('btnRespaldo').addEventListener('click', function () {
  if (NOTAS.length === 0) { avisar('No hay notas que respaldar.'); return; }

  letreroRespaldo.textContent = 'Armando el respaldo…';
  todasLasImagenes().then(function (pares) {
    const pedazos = ['{"version":' + RESPALDO_VERSION +
                     ',"fecha":' + JSON.stringify(new Date().toISOString()) +
                     ',"notas":' + JSON.stringify(NOTAS) +
                     ',"imagenes":{'];
    pares.forEach(function (par, i) {
      pedazos.push((i ? ',' : '') + JSON.stringify(par[0]) + ':' + JSON.stringify(par[1]));
    });
    pedazos.push('}}');

    const archivo = new Blob(pedazos, { type: 'application/json' });
    const liga = document.createElement('a');
    liga.href = URL.createObjectURL(archivo);
    liga.download = nombreDeArchivo();
    document.body.appendChild(liga);
    liga.click();
    document.body.removeChild(liga);
    setTimeout(function () { URL.revokeObjectURL(liga.href); }, 60000);

    // Un respaldo chico marcaba "0.0 MB", que se lee como que no bajó nada
    const peso = archivo.size >= 1048576
      ? (archivo.size / 1048576).toFixed(1) + ' MB'
      : Math.max(1, Math.round(archivo.size / 1024)) + ' KB';
    letreroRespaldo.textContent = NOTAS.length + ' notas y ' + pares.length +
                                  ' imágenes · ' + peso;
    guardarLlave(LLAVE_RESPALDO, new Date().toISOString());
    pintarAvisoRespaldo();
    avisar('Respaldo listo. Guárdalo fuera de la tablet.');
  });
});

document.getElementById('btnRestaurar').addEventListener('click', function () {
  document.getElementById('archivoRespaldo').click();
});

document.getElementById('archivoRespaldo').addEventListener('change', function (evento) {
  const archivo = evento.target.files[0];
  if (!archivo) return;
  evento.target.value = '';                  // para poder escoger el mismo otra vez

  letreroRespaldo.textContent = 'Leyendo el archivo…';
  archivo.text().then(function (texto) {
    let datos;
    try { datos = JSON.parse(texto); }
    catch (e) { datos = null; }

    if (!datos || !Array.isArray(datos.notas)) {
      letreroRespaldo.textContent = '';
      avisar('Ese archivo no es un respaldo de la aplicación.');
      return;
    }

    // Restaurar borra lo que haya. Hay que preguntar.
    confirmar({
      titulo: 'Restaurar el respaldo',
      texto: 'El respaldo trae ' + datos.notas.length + ' notas. Se van a reemplazar las ' +
             NOTAS.length + ' que hay en esta tablet. Esto no se puede deshacer.',
      boton: 'Sí, restaurar'
    }).then(function (r) {
      if (!r.ok) { letreroRespaldo.textContent = ''; return; }
      restaurar(datos);
    });
  });
});

function restaurar(datos) {
  const pares = Object.keys(datos.imagenes || {}).map(function (n) {
    return [n, datos.imagenes[n]];
  });

  vaciarImagenes()
    .then(function () { return meterImagenes(pares); })
    .then(function (entraron) {
      reemplazarNotas(datos.notas.map(normalizarNota));
      const cupo = escribirNotas(NOTAS);

      if (!cupo) {
        letreroRespaldo.textContent = '';
        avisar('Las notas no cupieron en la tablet. El respaldo quedó sin restaurar.');
        return;
      }
      letreroRespaldo.textContent = NOTAS.length + ' notas restauradas';
      guardarLlave(LLAVE_RESPALDO, datos.fecha || new Date().toISOString());
      pintarAvisoRespaldo();
      avisar(entraron
        ? 'Listo, volvieron ' + NOTAS.length + ' notas.'
        : 'Volvieron ' + NOTAS.length + ' notas, pero sin las fotos.');
    });
}

alEntrar(pintarAvisoRespaldo);
pintarAvisoRespaldo();
