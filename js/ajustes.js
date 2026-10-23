/* El nombre de esta tablet. Aquí van también los ajustes que se pueden cambiar sin tocar el código. */
// Cada tablet lleva su nombre. Hoy es una sola. Cuando abran la segunda,
// cada una se llama como quiera sin tocar el código.
const LLAVE_SUCURSAL = 'tintoreria.sucursal';

export function nombreSucursal() {
  try { return localStorage.getItem(LLAVE_SUCURSAL) || 'Sucursal 1'; }
  catch (e) { return 'Sucursal 1'; }
}

function pintarSucursal() {
  document.querySelectorAll('[data-sucursal]').forEach(function (el) {
    el.textContent = nombreSucursal();
  });
}

pintarSucursal();

/* -------------------------------------------------------------------------
   15. EL NOMBRE DE LA TABLET
   ------------------------------------------------------------------------- */

const campoSucursal = document.getElementById('nombreSucursal');

try { campoSucursal.value = localStorage.getItem(LLAVE_SUCURSAL) || ''; }
catch (e) { campoSucursal.value = ''; }

campoSucursal.addEventListener('input', function () {
  const nombre = campoSucursal.value.trim();
  try {
    if (nombre === '') localStorage.removeItem(LLAVE_SUCURSAL);
    else localStorage.setItem(LLAVE_SUCURSAL, nombre);
  } catch (e) { /* sin almacén no se guarda, pero se ve */ }
  pintarSucursal();
});
