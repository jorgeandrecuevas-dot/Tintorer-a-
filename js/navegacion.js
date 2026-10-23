/* Las pantallas y el menú: cuál se ve, cuál se marca, y cómo se dibuja cada una al entrar. */
import { textoFecha } from './ciclo.js';
import { alCambiar } from './notas.js';

/* -------------------------------------------------------------------------
   0. NAVEGACIÓN ENTRE PANTALLAS

   Los botones del menú y los que están dentro de cada pantalla llevan un
   atributo data-vista. Un solo manejador atiende a todos: busca la sección
   que corresponde, esconde las demás y marca el renglón activo del menú.
   ------------------------------------------------------------------------- */

const TITULOS = {
  nota:    'Nota nueva',
  tablero: 'Tablero',
  maquila: 'Maquila',
  corte:   'Corte'
};

/* Cada pantalla dice aquí cómo se dibuja. Así este módulo no tiene que
   conocerlas, y ninguna pantalla tiene que importar a otra. */
const dibujos = {};
const alEntrarA = [];

export function registrarVista(nombre, dibujar) {
  dibujos[nombre] = dibujar;
}

// Algo que revisar cada vez que se cambia de pantalla
export function alEntrar(fn) {
  alEntrarA.push(fn);
}

export function vistaActual() {
  const visible = document.querySelector('.vista:not(.d-none)');
  return visible ? visible.id.replace('vista-', '') : null;
}

// Cuando cambian las notas se vuelve a dibujar la pantalla que se está viendo.
// Las demás se dibujan solas cuando se entra a ellas.
alCambiar(function () {
  const dibujar = dibujos[vistaActual()];
  if (dibujar) dibujar();
});

export function irA(nombre) {
  if (!TITULOS[nombre]) return;

  // Se esconden todas las pantallas y se muestra la pedida
  document.querySelectorAll('.vista').forEach(function (seccion) {
    seccion.classList.toggle('d-none', seccion.id !== 'vista-' + nombre);
  });

  // El menú marca dónde estás. Hay dos menús, el fijo y el cajón, así que
  // se recorren los dos con el mismo selector.
  document.querySelectorAll('.nav-link[data-vista]').forEach(function (enlace) {
    enlace.classList.toggle('active', enlace.dataset.vista === nombre);
  });

  document.getElementById('tituloVista').textContent = TITULOS[nombre];
  alEntrarA.forEach(function (fn) { fn(nombre); });

  // Cada pantalla se vuelve a dibujar al entrar, porque todas leen las
  // mismas notas guardadas y cualquiera pudo haberlas movido.
  if (dibujos[nombre]) dibujos[nombre]();

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

document.getElementById('hoyTexto').textContent = textoFecha(new Date());
