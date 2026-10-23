import { test, expect, abrirLimpia, irA, agregarPrenda, firmar, notasGuardadas } from './ayuda.js';

// Esta es la única prueba que deja trabajar al service worker. El punto 20 de
// los apuntes pide firmar sin internet, así que se apaga la red de verdad.
test.use({ serviceWorkers: 'allow' });

test('abre en frío y levanta una nota firmada sin red', async ({ page, context }) => {
  await abrirLimpia(page);

  // se espera a que el service worker guarde la aplicación y tome el control
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await expect.poll(() => page.evaluate(async () => (await caches.keys()).length)).toBeGreaterThan(0);
  await expect(page.locator('#estadoRed')).toContainText('Guardada en la tablet');

  await context.setOffline(true);
  await page.reload();

  // abre, con sus estilos y sus cuatro pantallas
  await expect(page).toHaveTitle(/Tintorería/);
  // Bootstrap vive dentro del proyecto: el botón principal sale azul aunque no haya red
  const azul = await page.locator('#btnGuardar').evaluate((e) => getComputedStyle(e).backgroundColor);
  expect(azul).toBe('rgb(13, 110, 253)');
  expect(await page.$$eval('[data-vista]', (e) => new Set(e.map((x) => x.dataset.vista)).size)).toBeGreaterThanOrEqual(4);
  await expect(page.locator('#estadoRed')).toContainText('sin señal', { ignoreCase: true });

  // y se trabaja: se captura, se firma y se guarda
  await irA(page, 'nota');
  await page.fill('#folio', '0777');
  await page.fill('#nombreCliente', 'Sin señal');
  await agregarPrenda(page, 'camisa', 2);
  await firmar(page, '#firma');
  await page.click('#btnGuardar');
  await expect(page.locator('#vista-tablero')).toBeVisible();
  await expect.poll(async () => (await notasGuardadas(page)).length).toBe(1);
  const [n] = await notasGuardadas(page);
  expect(n.firmaRecibido).toBeTruthy();
  await context.setOffline(false);
});
