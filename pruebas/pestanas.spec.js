// Las pestañas de abajo, el engrane de arriba y la barra de guardar: lo que se
// toca con el pulgar en el teléfono y en el iPad vertical. En computadora no hay.
import { test, expect, abrirLimpia, irA, agregarPrenda, abrirDireccion, notasGuardadas } from './ayuda.js';

const chica = (page) => page.viewportSize().width < 992;

test('en pantalla chica hay pestañas abajo y no menú lateral; en computadora al revés', async ({ page }) => {
  await abrirLimpia(page);
  if (chica(page)) {
    await expect(page.locator('nav.pestanas')).toBeVisible();
    await expect(page.locator('aside.barra-lateral')).toBeHidden();
    await expect(page.locator('.navbar-toggler')).toHaveCount(0);       // ya no hay hamburguesa
  } else {
    await expect(page.locator('nav.pestanas')).toBeHidden();
    await expect(page.locator('aside.barra-lateral')).toBeVisible();
  }
});

test('las pestañas llevan a su pantalla y marcan en cuál estás', async ({ page }) => {
  test.skip(!chica(page), 'solo hay pestañas en pantalla chica');
  await abrirLimpia(page);
  const pestana = (v) => page.locator(`nav.pestanas [data-vista="${v}"]`);
  for (const [vista, texto] of [['nota', 'Nota'], ['tablero', 'Tablero'], ['maquila', 'Maquila'], ['corte', 'Corte'], ['hoy', 'Hoy']]) {
    await pestana(vista).click();
    await expect(page.locator('#vista-' + vista)).toBeVisible();
    await expect(pestana(vista)).toHaveText(texto);
    await expect(pestana(vista)).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('nav.pestanas [aria-current="page"]')).toHaveCount(1);
  }
});

test('las pestañas miden lo que el pulgar necesita y se quedan pegadas abajo', async ({ page }) => {
  test.skip(!chica(page), 'solo hay pestañas en pantalla chica');
  await abrirLimpia(page);
  const caja = await page.locator('nav.pestanas').boundingBox();
  expect(caja.height).toBeGreaterThanOrEqual(56);
  expect(Math.round(caja.y + caja.height)).toBe(page.viewportSize().height);
  for (const enlace of await page.locator('nav.pestanas .nav-link').all()) {
    expect((await enlace.boundingBox()).width).toBeGreaterThanOrEqual(44);
  }
  // y siguen ahí aunque se baje la pantalla
  await irA(page, 'ajustes');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const abajo = await page.locator('nav.pestanas').boundingBox();
  expect(Math.round(abajo.y + abajo.height)).toBe(page.viewportSize().height);
});

test('el engrane de arriba abre Ajustes', async ({ page }) => {
  test.skip(!chica(page), 'solo hay engrane en pantalla chica');
  await abrirLimpia(page);
  await page.getByRole('link', { name: 'Ajustes' }).click();
  await expect(page.locator('#vista-ajustes')).toBeVisible();
});

test.describe('la barra de guardar', () => {
  test('sale solo en Nota nueva, con el total y el saldo al día', async ({ page }) => {
    test.skip(!chica(page), 'solo hay barra en pantalla chica');
    await abrirLimpia(page);
    await expect(page.locator('.barra-nota')).toBeHidden();                 // en Hoy no
    await irA(page, 'nota');
    await expect(page.locator('.barra-nota')).toBeVisible();
    await expect(page.locator('#barraTotal')).toHaveText('$0');
    await agregarPrenda(page, 'camisa', 4);                                 // $280, deja $140
    await expect(page.locator('#barraTotal')).toHaveText('$280');
    await expect(page.locator('#barraSaldo')).toHaveText('$140');
    await page.click('#atajoTodo');
    await expect(page.locator('#barraSaldo')).toHaveText('$0');
    await irA(page, 'tablero');
    await expect(page.locator('.barra-nota')).toBeHidden();
  });

  test('queda encima de las pestañas y a la vista aunque se baje hasta la firma', async ({ page }) => {
    test.skip(!chica(page), 'solo hay barra en pantalla chica');
    await abrirLimpia(page);
    await irA(page, 'nota');
    await page.locator('#firma').scrollIntoViewIfNeeded();
    const barra = await page.locator('.barra-nota').boundingBox();
    const pestanas = await page.locator('nav.pestanas').boundingBox();
    expect(Math.round(barra.y + barra.height)).toBe(Math.round(pestanas.y));          // pegada a las pestañas
    await expect(page.locator('#btnGuardarBarra')).toBeInViewport();
    // y no tapa la firma
    const firma = await page.locator('#firma').boundingBox();
    expect(firma.y + firma.height).toBeLessThanOrEqual(barra.y + 1);
  });

  test('Guardar de la barra guarda igual que el del resumen', async ({ page }) => {
    test.skip(!chica(page), 'solo hay barra en pantalla chica');
    await abrirLimpia(page);
    await irA(page, 'nota');
    await page.fill('#folio', '0777');
    await agregarPrenda(page, 'camisa', 2);
    await page.click('#btnGuardarBarra');
    await expect(page.locator('#vista-tablero')).toBeVisible();
    await expect.poll(async () => (await notasGuardadas(page)).length).toBe(1);
    expect((await notasGuardadas(page))[0]).toMatchObject({ folio: '0777', piezas: 2 });
  });

  test('sin número de nota la barra avisa igual', async ({ page }) => {
    test.skip(!chica(page), 'solo hay barra en pantalla chica');
    await abrirLimpia(page);
    await irA(page, 'nota');
    await agregarPrenda(page, 'camisa');
    await page.click('#btnGuardarBarra');
    await expect(page.locator('#textoAviso')).toHaveText('Falta el número de nota.');
  });

  test('en computadora no hay barra y el resumen se queda fijo al bajar', async ({ page }) => {
    test.skip(chica(page), 'esto es de computadora');
    await abrirLimpia(page);
    await irA(page, 'nota');
    await expect(page.locator('.barra-nota')).toBeHidden();
    expect(await page.locator('.resumen-fijo').evaluate((e) => getComputedStyle(e).position)).toBe('sticky');
  });
});

test.describe('la cámara primero', () => {
  test('el botón de la cámara va antes y es el principal; la dirección está plegada', async ({ page }) => {
    await abrirLimpia(page);
    await irA(page, 'nota');
    const camara = await page.locator('label[for="tomarFoto"]').boundingBox();
    const resumen = await page.locator('#detallesUrl summary').boundingBox();
    expect(camara.y).toBeLessThan(resumen.y);
    await expect(page.locator('label[for="tomarFoto"]')).toHaveClass(/btn-primary/);
    await expect(page.locator('#urlFoto')).toBeHidden();
    await abrirDireccion(page);
    await expect(page.locator('#urlFoto')).toBeVisible();
  });

  test('plegado o no, la galería de la Actividad 1 sigue teniendo sus tres elementos', async ({ page }) => {
    await abrirLimpia(page);
    for (const id of ['urlFoto', 'btnAgregar', 'galeria']) expect(await page.locator('#' + id).count()).toBe(1);
  });
});

test('las pantallas ya no abren con un párrafo que explica lo que se ve', async ({ page }) => {
  await abrirLimpia(page);
  for (const vista of ['tablero', 'maquila', 'corte']) {
    await irA(page, vista);
    expect(await page.locator(`#vista-${vista} > p.text-secondary`).count(), vista).toBe(0);
  }
});
