/* Service worker: guarda la aplicación en la tablet para que abra sin señal.

   El punto 20 de los apuntes pide firmar sin internet. Eso no se arregla solo
   con bajar Bootstrap al repositorio: si no hay red, el navegador ni siquiera
   llega a pedir el index. Con esto la aplicación queda guardada y abre en
   frío, aunque la tablet esté sin señal desde que se prende.

   La estrategia es red primero para los archivos de la aplicación: cuando
   hay señal siempre gana la versión del servidor, y lo guardado solo entra
   cuando la red falla. Así nadie tiene que acordarse de versionar la caché.
*/

const CACHE = 'tintoreria-v1';

const ARCHIVOS = [
  './',
  './index.html',
  './styles.css',
  './script.js',
  './vendor/bootstrap.min.css',
  './vendor/bootstrap.bundle.min.js',
  './manifest.webmanifest',
  './icono.svg'
];

self.addEventListener('install', function (evento) {
  evento.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(ARCHIVOS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (evento) {
  evento.waitUntil(
    caches.keys()
      .then(function (nombres) {
        return Promise.all(nombres
          .filter(function (n) { return n !== CACHE; })
          .map(function (n) { return caches.delete(n); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (evento) {
  if (evento.request.method !== 'GET') return;

  const url = new URL(evento.request.url);
  const esDeLaApp = url.origin === self.location.origin;

  if (esDeLaApp) {
    // Primero la red. Así la tablet se queda con la versión nueva en cuanto
    // haya señal, sin que nadie tenga que acordarse de subirle el número a la
    // caché. Si no hay red, contesta con lo guardado.
    evento.respondWith(
      fetch(evento.request).then(function (respuesta) {
        if (respuesta && respuesta.status === 200) {
          const copia = respuesta.clone();
          caches.open(CACHE).then(function (c) { c.put(evento.request, copia); });
        }
        return respuesta;
      }).catch(function () {
        return caches.match(evento.request).then(function (guardado) {
          if (guardado) return guardado;
          // Sin red y sin copia: si venían navegando, al menos se les abre
          if (evento.request.mode === 'navigate') return caches.match('./index.html');
          return Response.error();
        });
      })
    );
    return;
  }

  // Las fotos que pegue el usuario viven fuera: primero lo guardado, porque
  // no cambian y así el ticket se sigue viendo completo sin señal.
  evento.respondWith(
    caches.match(evento.request).then(function (guardado) {
      if (guardado) return guardado;
      return fetch(evento.request).then(function (respuesta) {
        if (respuesta && respuesta.status === 200) {
          const copia = respuesta.clone();
          caches.open(CACHE).then(function (c) { c.put(evento.request, copia); });
        }
        return respuesta;
      }).catch(function () { return Response.error(); });
    })
  );
});
