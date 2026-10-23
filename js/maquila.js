/* La maquila: lo que sale, lo que se paga y el conteo de lo que regresa. */
import { avisar } from './avisos.js';
import { registrarVista } from './navegacion.js';
import { DIAS_LARGOS, proximaSalida, regresoDe, textoFecha } from './ciclo.js';
import { NOTAS, escribirNotas, ponerEstatus } from './notas.js';
import { pesos } from './utilidades.js';

/* -------------------------------------------------------------------------
   9. MAQUILA

   Lo que sale el martes, lo que se le paga en el momento, y lo que regresa.
   ------------------------------------------------------------------------- */

function renglonMaquila(n, conConteo) {
  const li = document.createElement('li');
  li.className = 'list-group-item d-flex justify-content-between align-items-center gap-2';

  const izq = document.createElement('div');
  izq.className = 'min-w-0';
  const t = document.createElement('div');
  t.className = 'fw-semibold';
  t.textContent = n.folio + ' · ' + n.cliente;
  const s = document.createElement('small');
  s.className = 'text-secondary d-block';
  s.textContent = n.detalle || '';
  izq.appendChild(t);
  izq.appendChild(s);

  if (conConteo) {
    li.appendChild(izq);
  } else {
    // La ropa que sale se aparta el lunes en la noche. La casilla es para que
    // él sepa qué ya está en la bolsa y qué falta, no impide mandarla.
    const lado = document.createElement('div');
    lado.className = 'd-flex align-items-center gap-3 min-w-0';
    const casilla = document.createElement('input');
    casilla.type = 'checkbox';
    casilla.className = 'form-check-input flex-shrink-0 m-0 casilla-apartada';
    casilla.style.width = '1.4rem';
    casilla.style.height = '1.4rem';
    casilla.checked = !!n.apartada;
    casilla.setAttribute('aria-label', 'Apartar la nota ' + n.folio);
    casilla.addEventListener('change', function () {
      n.apartada = casilla.checked;
      escribirNotas(NOTAS);
      dibujarMaquila();
    });
    lado.appendChild(casilla);
    lado.appendChild(izq);
    li.appendChild(lado);
  }

  if (conConteo) {
    // El punto 3 pide la nota del total de prendas enviadas y a recibir. Al
    // volver se cuenta contra lo que salió, que es lo que evita que se pierda
    // ropa sin que nadie se dé cuenta.
    const caja = document.createElement('div');
    caja.className = 'text-end flex-shrink-0';

    const salieron = document.createElement('small');
    salieron.className = 'text-secondary d-block';
    salieron.textContent = 'Salieron ' + n.piezas;
    caja.appendChild(salieron);

    const cuenta = document.createElement('input');
    cuenta.type = 'number';
    cuenta.min = '0';
    cuenta.value = n.piezas;
    cuenta.className = 'form-control form-control-sm text-center conteo-vuelta';
    cuenta.setAttribute('aria-label', 'Prendas que regresaron de la nota ' + n.folio);
    cuenta.dataset.nota = n.id;
    caja.appendChild(cuenta);

    li.appendChild(caja);
  } else {
    const der = document.createElement('div');
    der.className = 'text-end flex-shrink-0';
    const piezas = document.createElement('div');
    piezas.className = 'fw-semibold';
    piezas.textContent = n.piezas + (n.piezas === 1 ? ' pieza' : ' piezas');
    const pago = document.createElement('small');
    pago.className = 'text-danger';
    pago.textContent = pesos(n.costo);
    der.appendChild(piezas);
    der.appendChild(pago);
    li.appendChild(der);
  }

  return li;
}

export function porEnviar() {
  return NOTAS.filter(function (n) { return n.estatus === 'recibida'; });
}

function enMaquila() {
  return NOTAS.filter(function (n) { return n.estatus === 'maquila'; });
}

export function dibujarMaquila() {
  const envio = porEnviar();
  const fuera = enMaquila();

  const lista = document.getElementById('listaEnvio');
  lista.innerHTML = '';
  envio.forEach(function (n) { lista.appendChild(renglonMaquila(n)); });

  const otra = document.getElementById('listaMaquila');
  otra.innerHTML = '';
  fuera.forEach(function (n) { otra.appendChild(renglonMaquila(n, true)); });

  const piezas = envio.reduce(function (s, n) { return s + n.piezas; }, 0);
  const pago   = envio.reduce(function (s, n) { return s + n.costo;  }, 0);

  document.getElementById('contadorEnvio').textContent =
    envio.length + (envio.length === 1 ? ' nota' : ' notas');
  document.getElementById('contadorMaquila').textContent =
    fuera.length + (fuera.length === 1 ? ' nota' : ' notas');
  document.getElementById('envioPiezas').textContent = piezas;
  document.getElementById('envioPago').textContent   = pesos(pago);
  document.getElementById('envioRegreso').textContent =
    textoFecha(regresoDe(proximaSalida(new Date())));

  const sale = document.getElementById('envioSale');
  if (envio.length === 0) {
    sale.textContent = 'No hay ropa por enviar.';
  } else {
    const apartadas = envio.filter(function (n) { return n.apartada; }).length;
    const dia = DIAS_LARGOS[proximaSalida(new Date()).getDay()];
    sale.textContent = 'Sale el ' + dia + ' ' + textoFecha(proximaSalida(new Date())).split(' ').slice(1).join(' ') +
      ' · ' + apartadas + ' de ' + envio.length + (envio.length === 1 ? ' apartada' : ' apartadas');
    sale.classList.toggle('text-success', apartadas === envio.length);
  }
}

document.getElementById('btnEnviar').addEventListener('click', function () {
  const envio = porEnviar();
  if (envio.length === 0) { avisar('No hay notas para enviar.'); return; }
  envio.forEach(function (n) { ponerEstatus(n, 'maquila'); delete n.apartada; });
  escribirNotas(NOTAS);
  dibujarMaquila();
  avisar(envio.length + (envio.length === 1 ? ' nota salió' : ' notas salieron') + ' a la maquila.');
});

document.getElementById('btnRecibir').addEventListener('click', function () {
  const fuera = enMaquila();
  if (fuera.length === 0) { avisar('No hay nada en la maquila.'); return; }

  let faltantes = 0;
  let notasCortas = 0;

  document.querySelectorAll('.conteo-vuelta').forEach(function (casilla) {
    const nota = NOTAS.find(function (n) { return n.id === casilla.dataset.nota; });
    if (!nota) return;

    const regresaron = Math.max(0, parseInt(casilla.value, 10) || 0);
    nota.regresaron = regresaron;
    nota.faltan = Math.max(0, nota.piezas - regresaron);
    ponerEstatus(nota, 'devuelta');

    if (nota.faltan > 0) { faltantes += nota.faltan; notasCortas += 1; }
  });

  escribirNotas(NOTAS);
  dibujarMaquila();

  if (faltantes > 0) {
    avisar((faltantes === 1 ? 'Falta ' : 'Faltan ') + faltantes +
           (faltantes === 1 ? ' prenda en ' : ' prendas en ') + notasCortas +
           (notasCortas === 1 ? ' nota.' : ' notas.'));
  } else {
    avisar('Regresó todo: ' + fuera.length + (fuera.length === 1 ? ' nota.' : ' notas.'));
  }
});

registrarVista('maquila', dibujarMaquila);
