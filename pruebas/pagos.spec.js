// Cada pago lleva su fecha. Así el corte sabe cuánto entró hoy y no solo cuánto hay.
import { test, expect, abrirLimpia, irA, capturarNota, notasGuardadas, cargarEjemplos, firmar, sembrar, confirmarCuadro } from './ayuda.js';
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('la nota nueva guarda su anticipo como un pago con fecha', async ({ page }) => {
  await abrirLimpia(page);
  await capturarNota(page, { folio: '1', cantidad: 4 });                 // $280, deja la mitad
  const [n] = await notasGuardadas(page);
  expect(n.pagos).toHaveLength(1);
  expect(n.pagos[0]).toMatchObject({ monto: 140, tipo: 'anticipo' });
  expect(new Date(n.pagos[0].f).getTime()).toBeGreaterThan(Date.now() - 60000);
  expect(n.pagado).toBe(140);
  expect(n.saldo).toBe(140);
});

test('sin anticipo no hay pagos, y pagarlo todo es una liquidación', async ({ page }) => {
  await abrirLimpia(page);
  await irA(page, 'nota');
  await page.fill('#folio', '1');
  await page.fill('#buscarPrenda', 'camisa');
  await page.locator('#resultados button').first().click();
  await page.click('#atajoNada');
  await page.click('#btnGuardar');
  await expect.poll(async () => (await notasGuardadas(page)).length).toBe(1);
  expect((await notasGuardadas(page))[0].pagos).toEqual([]);

  await irA(page, 'nota');
  await page.fill('#folio', '2');
  await page.fill('#buscarPrenda', 'camisa');
  await page.locator('#resultados button').first().click();
  await page.click('#atajoTodo');
  await page.click('#btnGuardar');
  await expect.poll(async () => (await notasGuardadas(page)).length).toBe(2);
  expect((await notasGuardadas(page))[0].pagos[0]).toMatchObject({ monto: 70, tipo: 'liquidacion' });
});

test('al entregar se registra lo que faltaba como una liquidación', async ({ page }) => {
  await abrirLimpia(page);
  await cargarEjemplos(page);
  await irA(page, 'tablero');
  await page.locator('.nota-tocable', { hasText: '0477' }).getByRole('button', { name: 'Cobrar y entregar' }).click();
  await expect(page.locator('#modalEntrega')).toHaveClass(/show/);
  await page.waitForTimeout(500);
  await firmar(page, '#firmaEntrega');
  await page.click('#btnConfirmarEntrega');
  await expect(page.locator('#modalEntrega')).toBeHidden();

  const n = (await notasGuardadas(page)).find((x) => x.folio === '0477');
  expect(n.pagos).toHaveLength(2);
  expect(n.pagos[1]).toMatchObject({ monto: 90, tipo: 'liquidacion' });
  expect(n).toMatchObject({ pagado: 180, saldo: 0 });

  // y el corte de hoy ya cuenta esos $90
  await irA(page, 'corte');
  await page.click('[data-periodo="hoy"]');
  await expect(page.locator('#cCobrado')).toHaveText('$90');
});

test('corregir lo recibido queda como un ajuste, también si baja', async ({ page }) => {
  await abrirLimpia(page);
  await capturarNota(page, { folio: '1', cantidad: 4 });
  await page.locator('.nota-tocable .fw-semibold').first().click();
  await expect(page.locator('#modalNota')).toBeVisible();
  await page.fill('#edRecibido', '200');
  await page.click('#btnGuardarNota');
  await expect(page.locator('#modalNota')).toBeHidden();
  let [n] = await notasGuardadas(page);
  expect(n.pagos.map((p) => [p.tipo, p.monto])).toEqual([['anticipo', 140], ['ajuste', 60]]);
  expect(n).toMatchObject({ pagado: 200, saldo: 80 });

  await page.locator('.nota-tocable .fw-semibold').first().click();
  await expect(page.locator('#modalNota')).toBeVisible();
  await page.fill('#edRecibido', '100');
  await page.click('#btnGuardarNota');
  await expect(page.locator('#modalNota')).toBeHidden();
  [n] = await notasGuardadas(page);
  expect(n.pagos.map((p) => [p.tipo, p.monto])).toEqual([['anticipo', 140], ['ajuste', 60], ['ajuste', -100]]);
  expect(n).toMatchObject({ pagado: 100, saldo: 180 });
});

const vieja = (extra) => ({
  id: 'v1', folio: '0900', cliente: 'Vieja', piezas: 2, total: 140, costo: 80, pagado: 70, saldo: 70,
  estatus: 'devuelta', creada: new Date(Date.now() - 3 * 86400000).toISOString(), ...extra,
});

test('las notas que no traían pagos se arreglan solas y el corte las cuenta', async ({ page }) => {
  await abrirLimpia(page);
  await sembrar(page, [vieja(), vieja({ id: 'v2', folio: '0901', pagado: 0, saldo: 140 })]);
  const notas = await notasGuardadas(page);
  expect(notas[0].pagos).toHaveLength(1);
  expect(notas[0].pagos[0]).toMatchObject({ monto: 70, tipo: 'anticipo' });
  expect(notas[1].pagos).toEqual([]);

  await irA(page, 'corte');
  await page.click('[data-periodo="todo"]');
  await expect(page.locator('#cCobrado')).toHaveText('$70');
});

test('un respaldo de la versión anterior se restaura con sus pagos arreglados', async ({ page }, info) => {
  await abrirLimpia(page);
  const ruta = join(tmpdir(), `tintoreria-${info.project.name}-${info.workerIndex}-viejo.json`);
  writeFileSync(ruta, JSON.stringify({ version: 1, fecha: new Date().toISOString(), notas: [vieja()], imagenes: {} }));
  await irA(page, 'corte');
  await page.setInputFiles('#archivoRespaldo', ruta);
  await confirmarCuadro(page);
  await expect.poll(async () => (await notasGuardadas(page)).length).toBe(1);
  const [n] = await notasGuardadas(page);
  expect(n.pagos).toHaveLength(1);
  expect(n.pagado).toBe(70);
});

test('la tablet guarda el número de versión de los datos y arregla las notas viejas una vez', async ({ page }) => {
  await abrirLimpia(page);
  await sembrar(page, [{ folio: '0900', cliente: 'Vieja', total: 100, pagado: 50, saldo: 50, estatus: 'recibida', creada: '2026-10-01T12:00:00-06:00', prendas: [] }]);
  expect(await page.evaluate(() => localStorage.getItem('tintoreria.esquema'))).toBe('3');
  const [n] = await notasGuardadas(page);
  expect(n.pagos).toHaveLength(1);
  expect(n.historial.length).toBeGreaterThan(0);
});
