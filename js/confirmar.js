/* El cuadro de «¿seguro?». Reemplaza al confirm() del navegador, que se ve
   distinto en cada aparato, no deja pedir un motivo y no se puede probar. */

const cuadro = document.getElementById('modalConfirmar');
const titulo = document.getElementById('tituloConfirmar');
const texto = document.getElementById('textoConfirmar');
const bloqueMotivo = document.getElementById('bloqueMotivo');
const campoMotivo = document.getElementById('motivoConfirmar');
const bloqueCasilla = document.getElementById('bloqueCasilla');
const casilla = document.getElementById('casillaConfirmar');
const etiquetaCasilla = document.getElementById('etiquetaCasilla');
const botonSi = document.getElementById('btnSiConfirmar');
const botones = cuadro.querySelectorAll('button');

/* Devuelve una promesa con { ok, motivo, casilla }.

   opciones:
     titulo, texto   lo que se pregunta
     boton           lo que dice el botón de seguir, por ejemplo «Sí, borrar»
     peligro         el botón sale rojo (por omisión sí)
     motivo          pide que escriban por qué
     casilla         { texto, marcada } agrega una casilla de verificación

   La promesa se cumple cuando el cuadro ya terminó de cerrarse. Así dos
   preguntas seguidas no se pisan: el aviso de que el primero se cerró no le
   llega al segundo, y Bootstrap no ignora el abrirlo porque aún se está
   cerrando el anterior. Si se piden dos a la vez, la segunda espera su turno. */
let turno = Promise.resolve();

export function confirmar(opciones) {
  const respuesta = turno.then(function () { return preguntar(opciones); });
  turno = respuesta;
  return respuesta;
}

function preguntar(opciones) {
  titulo.textContent = opciones.titulo;
  texto.textContent = opciones.texto || '';
  botonSi.textContent = opciones.boton || 'Sí';
  botonSi.className = 'btn ' + (opciones.peligro === false ? 'btn-primary' : 'btn-danger');

  bloqueMotivo.classList.toggle('d-none', !opciones.motivo);
  campoMotivo.value = '';
  bloqueCasilla.classList.toggle('d-none', !opciones.casilla);
  if (opciones.casilla) {
    etiquetaCasilla.textContent = opciones.casilla.texto;
    casilla.checked = !!opciones.casilla.marcada;
  }

  const modal = bootstrap.Modal.getOrCreateInstance(cuadro);

  return new Promise(function (resolver) {
    let resultado = { ok: false, motivo: '', casilla: false };

    // Mientras el cuadro se está abriendo no se puede cerrar (Bootstrap ignora
    // el cierre a medio abrir y el cuadro se quedaría pegado): los botones esperan
    botones.forEach(function (b) { b.disabled = true; });
    cuadro.addEventListener('shown.bs.modal', function () {
      botones.forEach(function (b) { b.disabled = false; });
    }, { once: true });

    // Se asigna, no se agrega: así no se juntan manejadores de preguntas viejas
    botonSi.onclick = function () {
      resultado = { ok: true, motivo: campoMotivo.value.trim(), casilla: casilla.checked };
      modal.hide();
    };

    // Cerrar de cualquier otra forma (No, la X, Escape, tocar afuera) es que no
    cuadro.addEventListener('hidden.bs.modal', function () { resolver(resultado); }, { once: true });

    modal.show();
  });
}
