// Las cuentas del corte, la fecha prometida, el aviso, lo que toca hoy y los
// ajustes son funciones sin pantalla: se prueban directo, sin abrir el navegador.
import { test, expect } from '@playwright/test';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { limitesDelPeriodo, resumenCorte, textoRango } from '../js/resumen.js';
import { diasEntre, fechaEntrega, proximaSalidaDesde, textoFecha } from '../js/ciclo.js';
import { resumenDeHoy } from '../js/agenda.js';
import { direccionDeWhatsApp, mensajeDeAviso, telefonoWhatsApp } from '../js/mensajes.js';
import { catalogoActual, lavanderia } from '../js/catalogo.js';
import { POR_OMISION, ajustes, dentroDeLimites, guardarAjustes } from '../js/config.js';

const iso = (s) => new Date(s).toISOString();
// jueves 22 de octubre de 2026, mediodía
const AHORA = new Date(2026, 9, 22, 12, 0);

test.describe('los periodos del corte', () => {
  test('hoy va de medianoche a medianoche', () => {
    const { desde, hasta } = limitesDelPeriodo('hoy', AHORA);
    expect([desde.getDate(), desde.getHours(), hasta.getDate(), hasta.getHours()]).toEqual([22, 0, 23, 0]);
  });

  test('la semana empieza el lunes', () => {
    const { desde, hasta } = limitesDelPeriodo('semana', AHORA);
    expect(textoFecha(desde)).toBe('lun 19 oct');
    expect(textoFecha(hasta)).toBe('lun 26 oct');
  });

  test('un domingo todavía es de la semana que empezó el lunes anterior', () => {
    const { desde } = limitesDelPeriodo('semana', new Date(2026, 9, 25, 23, 0));
    expect(textoFecha(desde)).toBe('lun 19 oct');
  });

  test('el mes va del primero al primero siguiente', () => {
    const { desde, hasta } = limitesDelPeriodo('mes', AHORA);
    expect(textoFecha(desde)).toBe('jue 1 oct');
    expect(textoFecha(hasta)).toBe('dom 1 nov');
  });

  test('todo no tiene límites', () => {
    expect(limitesDelPeriodo('todo', AHORA)).toEqual({ desde: null, hasta: null });
  });

  test('el rango se escribe como se dice', () => {
    expect(textoRango(limitesDelPeriodo('hoy', AHORA))).toBe('jue 22 oct');
    expect(textoRango(limitesDelPeriodo('semana', AHORA))).toBe('lun 19 oct al dom 25 oct');
    expect(textoRango(limitesDelPeriodo('todo', AHORA))).toBe('Desde la primera nota');
  });
});

const nota = (extra) => ({
  folio: '1', piezas: 2, total: 140, costo: 80, pagado: 70, saldo: 70, estatus: 'recibida',
  creada: iso('2026-10-22T09:00:00'), pagos: [{ f: iso('2026-10-22T09:00:00'), monto: 70, tipo: 'anticipo' }],
  ...extra,
});

test.describe('el corte', () => {
  test('lo cobrado sale de los pagos con fecha, no de cuándo se levantó la nota', () => {
    const vieja = nota({ creada: iso('2026-10-01T09:00:00'), total: 200, pagado: 200, saldo: 0, estatus: 'entregada',
      pagos: [{ f: iso('2026-10-01T09:00:00'), monto: 100, tipo: 'anticipo' }, { f: iso('2026-10-22T10:00:00'), monto: 100, tipo: 'liquidacion' }] });
    const hoy = resumenCorte([vieja], 'hoy', AHORA);
    expect(hoy.cobrado).toBe(100);          // solo la liquidación de hoy
    expect(hoy.facturado).toBe(0);          // la nota no se levantó hoy
    expect(hoy.notas).toHaveLength(1);      // pero tuvo movimiento hoy
    expect(resumenCorte([vieja], 'todo', AHORA).cobrado).toBe(200);
  });

  test('a la maquila se le cuenta el día que se le mandó la ropa', () => {
    const mandada = nota({ estatus: 'maquila', enviadaEl: iso('2026-10-21T08:00:00') });
    const sinMandar = nota({ folio: '2' });
    expect(resumenCorte([mandada, sinMandar], 'hoy', AHORA).maquila).toBe(0);
    expect(resumenCorte([mandada, sinMandar], 'semana', AHORA).maquila).toBe(80);
    expect(resumenCorte([sinMandar], 'todo', AHORA).maquila).toBe(0);
  });

  test('una nota vieja sin el día de envío usa el día que se levantó', () => {
    const vieja = nota({ estatus: 'devuelta', creada: iso('2026-10-02T09:00:00'), pagos: [] });
    expect(resumenCorte([vieja], 'mes', AHORA).maquila).toBe(80);
    expect(resumenCorte([vieja], 'hoy', AHORA).maquila).toBe(0);
  });

  test('utilidad en caja es cobrado menos maquila, y puede ser negativa', () => {
    const r = resumenCorte([nota({ estatus: 'maquila', enviadaEl: iso('2026-10-22T08:00:00') })], 'hoy', AHORA);
    expect(r.utilidadCaja).toBe(70 - 80);
    expect(r.utilidadSiCobran).toBe(140 - 80);
  });

  test('una nota cancelada no se factura, pero lo que ya se movió se queda', () => {
    const cancelada = nota({ cancelada: true, estatus: 'maquila', enviadaEl: iso('2026-10-22T08:00:00') });
    const r = resumenCorte([cancelada], 'hoy', AHORA);
    expect(r.facturado).toBe(0);
    expect(r.porCobrar).toBe(0);
    expect(r.cobrado).toBe(70);       // el anticipo ya entró
    expect(r.maquila).toBe(80);       // y la maquila ya se pagó
  });

  test('lo que se debe hoy no depende del periodo', () => {
    const notas = [nota(), nota({ folio: '2', creada: iso('2026-08-01T09:00:00') })];
    expect(resumenCorte(notas, 'hoy', AHORA).porCobrar).toBe(140);
    expect(resumenCorte(notas, 'todo', AHORA).porCobrar).toBe(140);
  });
});

test.describe('la fecha que se promete', () => {
  const f = (y, m, d, h, cobertor = false) => textoFecha(fechaEntrega(new Date(y, m, d, h, 0), cobertor));

  test('antes de la hora de salida alcanza el carro de ese día', () => {
    expect(f(2026, 9, 27, 6)).toBe('jue 29 oct');
  });
  test('después de la hora de salida ya no: sale en el siguiente y regresa un ciclo después', () => {
    expect(f(2026, 9, 27, 15)).toBe('sáb 31 oct');
    expect(f(2026, 9, 27, 7)).toBe('sáb 31 oct');
  });
  test('un día que no es de salida pasa al siguiente día de salida', () => {
    expect(f(2026, 9, 28, 12)).toBe('sáb 31 oct');
    expect(f(2026, 9, 26, 20)).toBe('jue 29 oct');
  });
  test('un cobertor salta un ciclo más', () => {
    expect(f(2026, 9, 26, 20, true)).toBe('sáb 31 oct');
  });
  test('la hora se puede cambiar', () => {
    expect(textoFecha(fechaEntrega(new Date(2026, 9, 27, 9, 0), false, 10))).toBe('jue 29 oct');
  });
});

test.describe('la lavandería', () => {
  test('sin kilos no hay cuenta', () => {
    for (const kg of [0, -3, NaN, undefined]) expect(lavanderia(kg)).toEqual({ precio: 0, costo: 0 });
  });
  test('cobra $45 por kilo y la maquila $32 el primero y $16 por kilo después', () => {
    expect(lavanderia(1)).toEqual({ precio: 45, costo: 32 });
    expect(lavanderia(2)).toEqual({ precio: 90, costo: 64 });
    expect(lavanderia(3)).toEqual({ precio: 135, costo: 80 });
  });
});

test.describe('los ajustes', () => {
  test('sin almacén valen los de siempre', () => {
    expect(ajustes()).toMatchObject({ anticipoPct: 50, diasSinRecoger: 15, diasSinRespaldo: 7, horaSalida: 7 });
    expect(ajustes().lavanderia).toEqual(POR_OMISION.lavanderia);
    expect(catalogoActual()).toHaveLength(56);
  });

  test('qué número sirve', () => {
    expect(dentroDeLimites('anticipoPct', 30)).toBe(true);
    for (const malo of [150, -1, NaN, '30', null, undefined, Infinity]) expect(dentroDeLimites('anticipoPct', malo)).toBe(false);
    expect(dentroDeLimites('horaSalida', 23.5)).toBe(true);
    expect(dentroDeLimites('horaSalida', 24)).toBe(false);
  });

  test('un valor malo se cambia por el de siempre y los buenos se guardan', () => {
    guardarAjustes({ anticipoPct: 999, diasSinRecoger: 20 });
    expect(ajustes().anticipoPct).toBe(50);
    expect(ajustes().diasSinRecoger).toBe(20);
    guardarAjustes({ diasSinRecoger: 15 });
  });

  test('la fórmula de la lavandería usa lo que se ajustó', () => {
    guardarAjustes({ lavanderia: { precioKilo: 60 } });
    expect(lavanderia(2)).toEqual({ precio: 120, costo: 64 });
    guardarAjustes({ lavanderia: { precioKilo: 45 } });
  });
});

test.describe('el ciclo', () => {
  test('la próxima salida que todavía no se va', () => {
    expect(textoFecha(proximaSalidaDesde(new Date(2026, 9, 22, 6, 0)))).toBe('jue 22 oct');   // jueves, 6 am
    expect(textoFecha(proximaSalidaDesde(new Date(2026, 9, 22, 15, 0)))).toBe('sáb 24 oct');  // jueves, 3 pm
    expect(textoFecha(proximaSalidaDesde(new Date(2026, 9, 21, 12, 0)))).toBe('jue 22 oct');  // miércoles
    expect(textoFecha(proximaSalidaDesde(new Date(2026, 9, 24, 20, 0)))).toBe('mar 27 oct');  // sábado tarde
  });

  test('los días entre dos fechas son de calendario, sin importar la hora', () => {
    expect(diasEntre(new Date(2026, 9, 22, 23, 59), new Date(2026, 9, 23, 0, 1))).toBe(1);
    expect(diasEntre(new Date(2026, 9, 22, 8, 0), new Date(2026, 9, 22, 20, 0))).toBe(0);
    expect(diasEntre(new Date(2026, 9, 22), new Date(2026, 9, 20))).toBe(-2);
  });
});

test.describe('el aviso al cliente', () => {
  test('el número se entiende como lo escriba la gente', () => {
    for (const [escrito, queda] of [['33 1234 5678', '523312345678'], ['(33) 1234-5678', '523312345678'],
      ['+52 33 1234 5678', '523312345678'], ['52 1 33 1234 5678', '523312345678'], ['3312345678', '523312345678']]) {
      expect(telefonoWhatsApp(escrito), escrito).toBe(queda);
    }
    for (const mal of ['', '123', '33 1234', null, undefined, 'no tiene']) expect(telefonoWhatsApp(mal), String(mal)).toBeNull();
  });

  test('el mensaje saluda por el primer nombre y dice cuánto se debe', () => {
    expect(mensajeDeAviso({ cliente: 'Marta Díaz', folio: '0501', saldo: 90 }))
      .toBe('Hola Marta, tu ropa ya está lista (nota 0501). Pasa por ella cuando quieras. Quedan $90 por pagar.');
    expect(mensajeDeAviso({ cliente: 'Sin nombre', folio: '7', saldo: 0 }))
      .toBe('Hola, tu ropa ya está lista (nota 7). Pasa por ella cuando quieras.');
  });

  test('la dirección lleva el texto bien escrito para una liga', () => {
    const url = direccionDeWhatsApp({ cliente: 'José', folio: '1', saldo: 0, telefono: '33 1234 5678' });
    expect(url.startsWith('https://wa.me/523312345678?text=')).toBe(true);
    expect(decodeURIComponent(url.split('text=')[1])).toContain('Hola José');
    expect(direccionDeWhatsApp({ cliente: 'X', folio: '1', saldo: 0, telefono: '' })).toBeNull();
  });
});

test.describe('lo que toca hoy', () => {
  const hoy = new Date(2026, 9, 22, 15, 0);
  const n = (extra) => ({ folio: '1', piezas: 2, total: 140, saldo: 70, estatus: 'recibida', ...extra });

  test('cuenta cada cosa y deja fuera lo cancelado', () => {
    const h = resumenDeHoy([
      n({ estatus: 'recibida', apartada: true }), n({ estatus: 'recibida' }), n({ estatus: 'recibida', cancelada: true }),
      n({ estatus: 'maquila', regresaISO: new Date(2026, 9, 22, 9).toISOString() }),
      n({ estatus: 'maquila', regresaISO: new Date(2026, 9, 20).toISOString() }),
      n({ estatus: 'maquila' }),                                   // sin fecha de regreso: no se sabe
      n({ estatus: 'devuelta' }),
      n({ estatus: 'lista', telefono: '33 1234 5678' }), n({ estatus: 'lista', telefono: '' }),
      n({ estatus: 'lista', telefono: '33 1234 5678', avisadaEl: new Date().toISOString() }),
    ], hoy);
    expect([h.porMandar.length, h.apartadas, h.prendasPorMandar]).toEqual([2, 1, 4]);
    expect([h.llegan.length, h.atrasadas.length]).toEqual([1, 1]);
    expect(h.porEmbolsar).toHaveLength(1);
    expect([h.porAvisar.length, h.sinTelefono, h.porEntregar.length]).toEqual([1, 1, 3]);
    expect(h.debenLasEmbolsadas).toBe(210);
    expect(h.textoSalida).toBe('Sale el sábado 24 oct');
  });

  test('sin notas no hay nada y se sabe', () => {
    expect(resumenDeHoy([], hoy).hayNotas).toBe(false);
  });
});

test.describe('el proyecto', () => {
  test('el service worker guarda todos los módulos, o sin red no abre', () => {
    const sw = readFileSync('sw.js', 'utf8');
    const modulos = readdirSync('js').filter((f) => f.endsWith('.js'));
    expect(modulos.length).toBeGreaterThan(20);
    for (const modulo of modulos) expect(sw, modulo).toContain(`'./js/${modulo}'`);
    for (const archivo of ['./', './index.html', './styles.css', './script.js', './manifest.webmanifest', './icono.svg', './icono-180.png']) {
      expect(sw, archivo).toContain(`'${archivo}'`);
    }
  });

  test('cada import apunta a un archivo que existe', () => {
    const faltan = [];
    for (const [carpeta, archivos] of [['.', ['script.js']], ['js', readdirSync('js').filter((f) => f.endsWith('.js'))]]) {
      for (const archivo of archivos) {
        const texto = readFileSync(`${carpeta}/${archivo}`, 'utf8');
        for (const m of texto.matchAll(/(?:from|import)\s+['"](\.[^'"]+)['"]/g)) {
          const ruta = `${carpeta}/${m[1]}`.replace(/^\.\/js\/\.\//, 'js/').replace('js/./', 'js/');
          if (!existsSync(ruta.replace('./js/', 'js/'))) faltan.push(`${archivo} → ${m[1]}`);
        }
      }
    }
    expect(faltan).toEqual([]);
  });

  test('ningún módulo importa a otro en círculo', () => {
    const grafo = {};
    for (const archivo of readdirSync('js').filter((f) => f.endsWith('.js'))) {
      const texto = readFileSync(`js/${archivo}`, 'utf8');
      grafo[archivo] = [...texto.matchAll(/from\s+'\.\/([^']+)'/g)].map((m) => m[1]);
    }
    const enCurso = new Set(), hecho = new Set(), circulos = [];
    const visitar = (nodo, camino) => {
      if (hecho.has(nodo)) return;
      if (enCurso.has(nodo)) { circulos.push([...camino, nodo].join(' → ')); return; }
      enCurso.add(nodo);
      (grafo[nodo] || []).forEach((v) => visitar(v, [...camino, nodo]));
      enCurso.delete(nodo); hecho.add(nodo);
    };
    Object.keys(grafo).forEach((n) => visitar(n, []));
    expect(circulos).toEqual([]);
  });
});
