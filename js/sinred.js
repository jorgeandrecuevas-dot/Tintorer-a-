/* Trabajar sin internet: el service worker y el aviso de si hay señal. */
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


/* -------------------------------------------------------------------------
   Que la tablet no borre las notas

   Si la app no está instalada, Safari puede borrar los datos de un sitio que
   lleva 7 días sin abrirse. Y una web app instalada en la pantalla de inicio
   no comparte nada con la misma página abierta en Safari: son dos almacenes.
   Se pide almacenamiento persistente y, en iPad, se avisa que hay que
   instalarla y abrirla siempre desde ahí.
   ------------------------------------------------------------------------- */

export function esIPad() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function estaInstalada() {
  return window.navigator.standalone === true ||
         window.matchMedia('(display-mode: standalone)').matches;
}

if (navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().catch(function () { /* el navegador decide */ });
}

const avisoInstalar = document.getElementById('avisoInstalar');
if (avisoInstalar) {
  avisoInstalar.classList.toggle('d-none', !(esIPad() && !estaInstalada()));
}
