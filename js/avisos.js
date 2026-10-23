/* El aviso verde que sale arriba cuando algo se guardó. */
/* -------------------------------------------------------------------------
   7. GUARDAR LA NOTA
   ------------------------------------------------------------------------- */

export function avisar(texto) {
  document.getElementById('textoAviso').textContent = texto;
  bootstrap.Toast.getOrCreateInstance(document.getElementById('avisoGuardado')).show();
}
