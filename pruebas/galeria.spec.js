// Actividad 1 de la escuela: galería con campo de URL, botón, rejilla de
// Bootstrap, addEventListener, createElement y appendChild.
import { test, expect, abrirLimpia, irA } from './ayuda.js';

test.beforeEach(async ({ page }) => {
  await abrirLimpia(page);
  await irA(page, 'nota');
});

test('tiene los tres elementos con su identificador y sus clases de Bootstrap', async ({ page }) => {
  await expect(page.locator('#urlFoto')).toHaveClass(/form-control/);
  await expect(page.locator('#btnAgregar')).toHaveClass(/btn btn-primary/);
  await expect(page.locator('#galeria')).toHaveClass(/row-cols-2 row-cols-md-3 row-cols-lg-4/);
  for (const id of ['urlFoto', 'btnAgregar', 'galeria']) {
    expect(await page.locator('#' + id).count()).toBe(1);
  }
});

test('agrega una imagen por dirección y deja el campo limpio, con Enter o con el botón', async ({ page }) => {
  await page.fill('#urlFoto', 'icono.svg');
  await page.click('#btnAgregar');
  await expect(page.locator('#galeria .col img')).toHaveCount(1);
  await expect(page.locator('#urlFoto')).toHaveValue('');

  await page.fill('#urlFoto', 'icono.svg');
  await page.press('#urlFoto', 'Enter');
  await expect(page.locator('#galeria .col img')).toHaveCount(2);
  await expect(page.locator('#galeriaVacia')).toBeHidden();

  await page.click('#btnAgregar');                          // sin dirección no hace nada
  await expect(page.locator('#galeria .col img')).toHaveCount(2);
});

test('una dirección que no carga avisa en lugar de dejar un hueco', async ({ page }) => {
  await page.fill('#urlFoto', 'no-existe.jpg');
  await page.click('#btnAgregar');
  await expect(page.locator('#galeria .foto-fallida')).toHaveText('No se pudo cargar esta imagen');
});

test('la rejilla pasa de 2 columnas en teléfono a 3 en tableta y 4 en computadora', async ({ page }) => {
  for (let i = 0; i < 4; i++) {
    await page.fill('#urlFoto', 'icono.svg');
    await page.click('#btnAgregar');
  }
  await expect(page.locator('#galeria .col')).toHaveCount(4);
  const ancho = page.viewportSize().width;
  const esperadas = ancho >= 992 ? 4 : ancho >= 768 ? 3 : 2;
  const porRenglon = await page.$$eval('#galeria .col', (c) => {
    const arriba = c[0].getBoundingClientRect().top;
    return c.filter((x) => Math.abs(x.getBoundingClientRect().top - arriba) < 2).length;
  });
  expect(porRenglon).toBe(esperadas);
});
