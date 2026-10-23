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
