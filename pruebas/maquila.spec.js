import { test, expect, abrirLimpia, irA, capturarNota, notasGuardadas, espiarPrint } from './ayuda.js';

test.beforeEach(async ({ page }) => {
  await abrirLimpia(page);
  await capturarNota(page, { folio: '0301', cliente: 'Ana', prenda: 'camisa', cantidad: 2 });
  await capturarNota(page, { folio: '0302', cliente: 'Beto', prenda: 'saco', cantidad: 2 });
  await irA(page, 'maquila');
});

test('dice qué día sale y cuántas notas lleva apartadas, y la casilla no impide mandar', async ({ page }) => {
  await expect(page.locator('#envioSale')).toContainText('0 de 2 apartadas');
  await expect(page.locator('#envioSale')).toContainText(/Sale el (martes|jueves|sábado)/);
  await expect(page.locator('#envioPiezas')).toHaveText('4');
  await expect(page.locator('#envioPago')).toHaveText('$160');

  await page.locator('.casilla-apartada').first().check();
  await expect(page.locator('#envioSale')).toContainText('1 de 2 apartadas');
  expect((await notasGuardadas(page)).filter((n) => n.apartada)).toHaveLength(1);
  await page.locator('.casilla-apartada').nth(1).check();
  await expect(page.locator('#envioSale')).toHaveClass(/text-success/);

  await page.click('#btnEnviar');
  await expect(page.locator('#contadorMaquila')).toHaveText('2 notas');
  await expect(page.locator('#envioSale')).toHaveText('No hay ropa por enviar.');
  expect((await notasGuardadas(page)).filter((n) => n.apartada)).toHaveLength(0);
});

test('mandar sin haber apartado nada también se puede', async ({ page }) => {
  await page.click('#btnEnviar');
  await expect(page.locator('#contadorMaquila')).toHaveText('2 notas');
});

test('al recibir de vuelta se cuenta contra lo que salió y lo que falta queda marcado', async ({ page }) => {
  await page.click('#btnEnviar');
  const casillas = page.locator('.conteo-vuelta');
  await expect(casillas).toHaveCount(2);
  for (const c of await casillas.all()) await expect(c).toHaveValue('2');   // por omisión traen lo que salió

  await casillas.first().fill('1');
  await page.click('#btnRecibir');
  await expect(page.locator('#textoAviso')).toHaveText('Falta 1 prenda en 1 nota.');
  await expect(page.locator('#contadorMaquila')).toHaveText('0 notas');

  const notas = await notasGuardadas(page);
  const corta = notas.find((n) => n.faltan > 0);
  expect(corta).toMatchObject({ regresaron: 1, faltan: 1, estatus: 'devuelta' });

  await irA(page, 'tablero');
  await expect(page.locator('#columnas')).toContainText('Falta 1 prenda');
});

test('imprime la nota de maquila y las etiquetas, una por prenda', async ({ page }) => {
  await espiarPrint(page);
  await page.click('#btnNotaMaquila');
  await expect(page.locator('#hoja h2')).toHaveText('Nota de maquila');
  await expect(page.locator('#hoja')).toContainText('Se le paga');
  await expect(page.locator('#hoja')).toContainText('0301 · Ana');

  await page.click('#btnEtiquetas');
  await expect(page.locator('#hoja h2')).toHaveText('Etiquetas');
  await expect(page.locator('#hoja .etiqueta')).toHaveCount(4);
  await expect(page.locator('#hoja')).toHaveClass(/ancha/);
  await expect(page.locator('#hoja .etiqueta').first()).toContainText('Pieza 1 de 2');
  expect(await page.evaluate(() => window.__impreso)).toBe(2);
});

test('con nada por mandar avisa y no imprime hojas vacías', async ({ page }) => {
  await page.click('#btnEnviar');
  await page.click('#btnEnviar');
  await expect(page.locator('#textoAviso')).toHaveText('No hay notas para enviar.');
});
