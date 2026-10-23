/* Los documentos que se imprimen: ticket, nota de maquila, etiquetas y conteo. */
import { nombreSucursal } from './ajustes.js';
import { avisar } from './avisos.js';
import { cuentaNota, inpCliente, inpFolio, inpObserva } from './captura.js';
import { proximaSalida, regresoDe, textoFecha } from './ciclo.js';
import { porEnviar } from './maquila.js';
import { ETAPAS, NOTAS } from './notas.js';
import { pesos, pesosConSigno } from './utilidades.js';
import { PERIODOS, resumenCorte, textoRango as textoRangoCorte } from './resumen.js';

/* -------------------------------------------------------------------------
   11. LOS TRES DOCUMENTOS

   El mismo pedido contado de tres maneras: para el cliente, para la maquila
   y para el dueño. Se arman con createElement por la misma razón de siempre:
   adentro va texto que escribió alguien.
   ------------------------------------------------------------------------- */

const hoja = document.createElement('div');

hoja.id = 'hoja';

document.body.appendChild(hoja);

function renglonHoja(izquierda, derecha, fuerte) {
  const d = document.createElement('div');
  d.className = 'hoja-renglon' + (fuerte ? ' fw-bold' : '');
  const a = document.createElement('span');
  a.textContent = izquierda;
  const b = document.createElement('span');
  b.textContent = derecha;
  d.appendChild(a);
  d.appendChild(b);
  return d;
}

function bloqueHoja(rotulo, renglones) {
  const bloque = document.createElement('div');
  bloque.className = 'hoja-bloque';
  if (rotulo) {
    const r = document.createElement('div');
    r.className = 'hoja-rotulo';
    r.textContent = rotulo;
    bloque.appendChild(r);
  }
  renglones.forEach(function (x) { bloque.appendChild(x); });
  return bloque;
}

function totalHoja(etiqueta, monto) {
  const d = document.createElement('div');
  d.className = 'hoja-total';
  const a = document.createElement('span');
  a.textContent = etiqueta;
  const b = document.createElement('span');
  b.textContent = monto;
  d.appendChild(a);
  d.appendChild(b);
  return d;
}

function imprimirHoja(titulo, armar, clase) {
  hoja.className = clase || '';
  hoja.innerHTML = '';

  const negocio = document.createElement('div');
  negocio.className = 'hoja-negocio';
  negocio.textContent = 'Tintorería y lavandería';
  hoja.appendChild(negocio);

  const h = document.createElement('h2');
  h.textContent = titulo;
  hoja.appendChild(h);

  const fecha = document.createElement('p');
  fecha.className = 'hoja-fecha';
  fecha.textContent = textoFecha(new Date()) + ' · ' + nombreSucursal();
  hoja.appendChild(fecha);

  armar(hoja);
  document.body.classList.add('imprimiendo');
  // Se quita cuando el navegador termina. Quitarla justo después de print()
  // no sirve: no todos los navegadores se detienen ahí.
  window.addEventListener('afterprint', function quitar() {
    document.body.classList.remove('imprimiendo');
    window.removeEventListener('afterprint', quitar);
  });
  window.print();
}

// Documento 1: el ticket del cliente. Se arma igual venga del formulario
// que de una nota ya guardada que se abrió para reimprimirla.
export function imprimirTicket(datos) {
  imprimirHoja('Ticket de cliente', function (caja) {
    caja.appendChild(bloqueHoja('Nota', [
      renglonHoja('Número', datos.folio || 'sin número'),
      renglonHoja('Cliente', datos.cliente || 'Sin nombre'),
      renglonHoja('Se entrega', datos.entrega)
    ]));

    const prendas = [];
    if (datos.renglones && datos.renglones.length) {
      datos.renglones.forEach(function (r) {
        prendas.push(renglonHoja(r.texto, pesos(r.monto)));
      });
    } else if (datos.detalle) {
      prendas.push(renglonHoja(datos.detalle, ''));
    }
    prendas.push(renglonHoja('Piezas', String(datos.piezas)));
    caja.appendChild(bloqueHoja('Lo que dejó', prendas));

    caja.appendChild(bloqueHoja('Cuenta', [
      renglonHoja('Total', pesos(datos.total)),
      renglonHoja('Recibido', pesos(datos.pagado))
    ]));
    caja.appendChild(totalHoja('Saldo', pesos(datos.saldo)));

    if (datos.observaciones) {
      const obs = document.createElement('p');
      obs.className = 'hoja-obs';
      obs.textContent = 'Observaciones: ' + datos.observaciones;
      caja.appendChild(obs);
    }

    const firma = document.createElement('div');
    firma.className = 'hoja-firma';
    firma.textContent = 'Firma de recibido';
    caja.appendChild(firma);
  });
}

document.getElementById('btnTicket').addEventListener('click', function () {
  const c = cuentaNota();
  if (c.piezas === 0) { avisar('La nota no tiene prendas.'); return; }

  imprimirTicket({
    folio: inpFolio.value.trim(),
    cliente: inpCliente.value.trim(),
    entrega: textoFecha(c.entrega),
    renglones: c.renglones,
    piezas: c.piezas,
    total: c.precio,
    pagado: c.pagado,
    saldo: c.saldo,
    observaciones: inpObserva.value.trim()
  });
});

// Documento 2: la nota que se firma de entrega y recibo con la maquila
document.getElementById('btnNotaMaquila').addEventListener('click', function () {
  const envio = porEnviar();
  if (envio.length === 0) { avisar('No hay notas para enviar.'); return; }

  imprimirHoja('Nota de maquila', function (caja) {
    caja.appendChild(bloqueHoja('Envío', [
      renglonHoja('Sale', textoFecha(proximaSalida(new Date()))),
      renglonHoja('Regresa', textoFecha(regresoDe(proximaSalida(new Date())))),
      renglonHoja('Notas', String(envio.length))
    ]));

    caja.appendChild(bloqueHoja('Qué va', envio.map(function (n) {
      return renglonHoja(n.folio + ' · ' + n.cliente,
        n.piezas + (n.piezas === 1 ? ' pieza' : ' piezas'));
    })));

    caja.appendChild(bloqueHoja('Cuenta', [
      renglonHoja('Prendas que van',
        String(envio.reduce(function (s, n) { return s + n.piezas; }, 0)))
    ]));
    caja.appendChild(totalHoja('Se le paga',
      pesos(envio.reduce(function (s, n) { return s + n.costo; }, 0))));

    const firma = document.createElement('div');
    firma.className = 'hoja-firma';
    firma.textContent = 'Firma de entrega y recibo';
    caja.appendChild(firma);
  });
});

// Documento 4: las etiquetas que se pegan a cada prenda antes de que salga.
// El punto 2 de los apuntes: la ropa se rastrea por el número de su nota.
document.getElementById('btnEtiquetas').addEventListener('click', function () {
  const envio = porEnviar();
  if (envio.length === 0) { avisar('No hay notas para enviar.'); return; }

  const vuelve = textoFecha(regresoDe(proximaSalida(new Date())));

  imprimirHoja('Etiquetas', function (caja) {
    const rejilla = document.createElement('div');
    rejilla.className = 'etiquetas';

    envio.forEach(function (n) {
      for (let i = 1; i <= n.piezas; i++) {
        const et = document.createElement('div');
        et.className = 'etiqueta';

        const folio = document.createElement('div');
        folio.className = 'folio';
        folio.textContent = n.folio;

        const quien = document.createElement('div');
        quien.className = 'quien';
        quien.textContent = n.cliente;

        const pieza = document.createElement('div');
        pieza.className = 'pieza';
        const cual = document.createElement('span');
        cual.textContent = 'Pieza ' + i + ' de ' + n.piezas;
        const cuando = document.createElement('span');
        cuando.textContent = vuelve;
        pieza.appendChild(cual);
        pieza.appendChild(cuando);

        et.appendChild(folio);
        et.appendChild(quien);
        et.appendChild(pieza);
        rejilla.appendChild(et);
      }
    });

    caja.appendChild(rejilla);
  }, 'ancha');
});

// Documento 3: el conteo del dueño
document.getElementById('btnConteo').addEventListener('click', function () {
  imprimirHoja('Conteo financiero', function (caja) {
    // El mismo periodo que se está viendo en el Corte, y las mismas cuentas
    const activo = document.querySelector('#periodosCorte .active');
    const periodo = activo ? activo.dataset.periodo : 'todo';
    const r = resumenCorte(NOTAS, periodo);
    const vivas = NOTAS.filter(function (n) { return !n.cancelada; });

    caja.appendChild(bloqueHoja('Periodo', [
      renglonHoja(PERIODOS[periodo], textoRangoCorte(r))
    ]));

    caja.appendChild(bloqueHoja('Movimiento', [
      renglonHoja('Notas', String(r.notas.length)),
      renglonHoja('Piezas', String(r.piezas))
    ]));

    // Dónde está parada la ropa hoy, sin importar el periodo
    caja.appendChild(bloqueHoja('Por etapa', ETAPAS.map(function (e) {
      const cuantas = vivas.filter(function (n) { return n.estatus === e.id; }).length;
      return renglonHoja(e.nombre, String(cuantas));
    })));

    caja.appendChild(bloqueHoja('Entró', [
      renglonHoja('Facturado', pesos(r.facturado)),
      renglonHoja('Cobrado', pesos(r.cobrado)),
      renglonHoja('Por cobrar hoy', pesos(r.porCobrar))
    ]));

    caja.appendChild(bloqueHoja('Salió', [
      renglonHoja('Pagado a maquila', pesos(r.maquila))
    ]));

    caja.appendChild(totalHoja('Utilidad en caja', pesosConSigno(r.utilidadCaja)));
    caja.appendChild(renglonHoja('Si cobran todo', pesosConSigno(r.utilidadSiCobran)));

    const firma = document.createElement('div');
    firma.className = 'hoja-firma';
    firma.textContent = 'Revisó';
    caja.appendChild(firma);
  });
});
