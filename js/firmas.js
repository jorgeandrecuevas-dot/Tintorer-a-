/* Las firmas con el dedo, sin red ni bibliotecas. */
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

export const firmaRecibido = crearFirma('firma');

export const firmaEntrega  = crearFirma('firmaEntrega');

document.getElementById('btnLimpiarFirma').addEventListener('click', firmaRecibido.limpiar);

document.getElementById('btnLimpiarEntrega').addEventListener('click', firmaEntrega.limpiar);
