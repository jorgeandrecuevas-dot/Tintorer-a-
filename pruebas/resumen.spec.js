// Las cuentas del corte y la fecha prometida son funciones sin pantalla: se
// prueban directo, sin abrir el navegador.
import { test, expect } from '@playwright/test';
import { limitesDelPeriodo, resumenCorte, textoRango } from '../js/resumen.js';
import { fechaEntrega, textoFecha } from '../js/ciclo.js';
import { lavanderia } from '../js/catalogo.js';

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
