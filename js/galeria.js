/* Actividad 1 de la escuela: la galería de fotografías, y la foto con la cámara. */
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


// Lo que el resto de la aplicación necesita saber de la galería
export function fotosDeLaNota() {
  return fotos.slice();
}

// Se limpia para la siguiente nota
export function vaciarGaleria() {
  galeria.innerHTML = '';
  fotos = [];
  aviso.classList.remove('d-none');
}
