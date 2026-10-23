import { test, expect, abrirLimpia, irA } from './ayuda.js';

test('las pantallas se ven una por una y el menú marca dónde estás', async ({ page }) => {
  await abrirLimpia(page);
  const titulos = { hoy: 'Hoy', tablero: 'Tablero', maquila: 'Maquila', corte: 'Corte', ajustes: 'Ajustes', nota: 'Nota nueva' };

  for (const [vista, titulo] of Object.entries(titulos)) {
    await irA(page, vista);
    const visibles = await page.$$eval('.vista', (v) => v.filter((s) => getComputedStyle(s).display !== 'none').map((s) => s.id));
    expect(visibles).toEqual(['vista-' + vista]);
    await expect(page.locator('#tituloVista')).toHaveText(titulo);
    const activos = await page.$$eval('.nav-link.active', (e) => e.map((x) => x.dataset.vista));
    expect(new Set(activos)).toEqual(new Set([vista]));
  }
});

test('no se sale de la pantalla hacia los lados', async ({ page }) => {
  await abrirLimpia(page);
  for (const vista of ['hoy', 'nota', 'tablero', 'maquila', 'corte', 'ajustes']) {
    await irA(page, vista);
    const sobra = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(sobra, 'sobra ancho en ' + vista).toBeLessThanOrEqual(0);
  }
});

test('arranca en Hoy, con el menú marcado', async ({ page }) => {
  await abrirLimpia(page);
  const visibles = await page.$$eval('.vista', (v) => v.filter((s) => getComputedStyle(s).display !== 'none').map((s) => s.id));
  expect(visibles).toEqual(['vista-hoy']);
  await expect(page.locator('#tituloVista')).toHaveText('Hoy');
  const activos = await page.$$eval('.nav-link.active', (e) => e.map((x) => x.dataset.vista));
  expect(new Set(activos)).toEqual(new Set(['hoy']));
});
