import { test, expect, abrirLimpia, irA, agregarPrenda, capturarNota, espiarPrint } from './ayuda.js';

const paginasDelPdf = (pdf) => (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;

test.beforeEach(async ({ page }) => {
  await abrirLimpia(page);
  await espiarPrint(page);
});

test('el ticket del cliente lleva lo que dejó, la cuenta, las observaciones y el lugar de la firma', async ({ page }) => {
  await irA(page, 'nota');
  await page.fill('#folio', '0602');
  await page.fill('#nombreCliente', 'Marta Díaz');
  await page.fill('#observaciones', 'Mancha en la solapa');
  await agregarPrenda(page, 'camisa', 3);
  await agregarPrenda(page, 'saco', 1);
  await page.click('#btnTicket');

  const hoja = page.locator('#hoja');
  await expect(hoja.locator('h2')).toHaveText('Ticket de cliente');
  await expect(hoja).toContainText('0602');
  await expect(hoja).toContainText('Marta Díaz');
  await expect(hoja).toContainText('Camisa ×3');
  await expect(hoja).toContainText('Saco ×1');
  await expect(hoja).toContainText('$280');
  await expect(hoja).toContainText('Saldo');
  await expect(hoja).toContainText('Mancha en la solapa');
  await expect(hoja.locator('.hoja-firma')).toHaveCount(1);
  expect(await page.evaluate(() => window.__impreso)).toBe(1);
});

test('el conteo del dueño trae la utilidad', async ({ page }) => {
  await capturarNota(page, { folio: '0701', cliente: 'Ana', cantidad: 2 });
  await irA(page, 'corte');
  await page.click('#btnConteo');
  await expect(page.locator('#hoja h2')).toHaveText('Conteo financiero');
  await expect(page.locator('#hoja')).toContainText('Utilidad');
  await expect(page.locator('#hoja')).toContainText('Cobrado');
});

test('en papel solo sale la hoja y cabe en una página', async ({ page }) => {
  await irA(page, 'nota');
  await page.fill('#folio', '0603');
  await agregarPrenda(page, 'camisa', 2);
  await page.click('#btnTicket');

  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#hoja')).toBeVisible();
  await expect(page.locator('#vista-nota')).toBeHidden();
  await expect(page.locator('main')).toBeHidden();
  const pdf = await page.pdf({ format: 'Letter', printBackground: true });
  expect(paginasDelPdf(pdf)).toBe(1);
});

test('las etiquetas ocupan toda la hoja, no 10 cm', async ({ page }) => {
  await capturarNota(page, { folio: '0604', cliente: 'Beto', cantidad: 4 });
  await irA(page, 'maquila');
  await page.click('#btnEtiquetas');
  await page.emulateMedia({ media: 'print' });
  // el ticket se limita a 10 cm y las etiquetas no. Se mira la regla y no el
  // ancho, porque en un teléfono la pantalla misma mide menos de 10 cm.
  expect(await page.locator('#hoja').evaluate((e) => getComputedStyle(e).maxWidth)).toBe('none');
  await expect(page.locator('#hoja .etiqueta')).toHaveCount(4);
});
