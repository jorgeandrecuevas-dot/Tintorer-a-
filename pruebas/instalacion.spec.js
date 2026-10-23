// Lo que hace falta para que el iPad guarde las notas y la app se instale bien.
import { test, expect, abrirLimpia, irA } from './ayuda.js';

test('trae los iconos PNG y las etiquetas que pide el iPad', async ({ page, request }) => {
  await abrirLimpia(page);
  const apple = await page.locator('link[rel="apple-touch-icon"]').getAttribute('href');
  expect(apple).toBe('icono-180.png');
  await expect(page.locator('meta[name="apple-mobile-web-app-capable"]')).toHaveAttribute('content', 'yes');

  const manifiesto = await (await request.get('/manifest.webmanifest')).json();
  const png = manifiesto.icons.filter((i) => i.type === 'image/png');
  expect(png.map((i) => i.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']));
  for (const icono of [...png.map((i) => i.src), './icono-180.png']) {
    const respuesta = await request.get('/' + icono.replace('./', ''));
    expect(respuesta.status(), icono).toBe(200);
    expect(respuesta.headers()['content-type']).toContain('image/png');
  }
});

test('pide almacenamiento persistente al abrir', async ({ page }) => {
  await page.addInitScript(() => {
    window.__persist = 0;
    const original = navigator.storage.persist.bind(navigator.storage);
    navigator.storage.persist = () => { window.__persist++; return original(); };
  });
  await abrirLimpia(page);
  expect(await page.evaluate(() => window.__persist)).toBeGreaterThan(0);
});

test.describe('en un iPad con Safari', () => {
  test.use({ userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' });

  test('avisa que hay que instalarla y abrirla siempre desde ahí', async ({ page }) => {
    await abrirLimpia(page);
    await irA(page, 'corte');
    await expect(page.locator('#avisoInstalar')).toBeVisible();
    await expect(page.locator('#avisoInstalar')).toContainText('Agregar a pantalla de inicio');
  });
});

test('en una computadora no estorba con el aviso de instalar', async ({ page }) => {
  await abrirLimpia(page);
  await irA(page, 'corte');
  await expect(page.locator('#avisoInstalar')).toBeHidden();
});
