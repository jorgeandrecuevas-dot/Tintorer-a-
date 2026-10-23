import { test, expect, abrirLimpia, irA, capturarNota, notasGuardadas, cargarEjemplos, confirmarCuadro } from './ayuda.js';
import { readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// El nombre de la prueba lleva acentos y algunas rutas con acentos no se
// pasan bien al navegador. Los archivos de apoyo van con nombre simple.
const rutaTemporal = (info, nombre) => join(tmpdir(), `tintoreria-${info.project.name}-${info.workerIndex}-${nombre}`);

test('el corte suma lo facturado, lo cobrado, lo que debe, la maquila y lo que quedó en caja', async ({ page }) => {
  await abrirLimpia(page);
  await capturarNota(page, { folio: '0501', cliente: 'Marta', prenda: 'camisa', cantidad: 4 });   // $280, deja $140
  await irA(page, 'corte');
  await expect(page.locator('#cFacturado')).toHaveText('$280');
  await expect(page.locator('#cCobrado')).toHaveText('$140');
  await expect(page.locator('#cPorCobrar')).toHaveText('$140');
  await expect(page.locator('#cMaquila')).toHaveText('$0');            // todavía no se manda
  await expect(page.locator('#cUtilidad')).toHaveText('$140');

  // a la maquila se le paga al mandar la ropa
  await irA(page, 'maquila');
  await page.click('#btnEnviar');
  await irA(page, 'corte');
  await expect(page.locator('#cMaquila')).toHaveText('$160');
  await expect(page.locator('#cUtilidad')).toHaveText('−$20');         // pagó más de lo que cobró
  await expect(page.locator('#cUtilidadTotal')).toHaveText('$120');    // cuando cobren el resto
  await expect(page.locator('#tablaCorte tr')).toHaveCount(1);
});

test('el corte se ve por hoy, esta semana, este mes o todo', async ({ page }) => {
  await abrirLimpia(page);
  await cargarEjemplos(page);
  await irA(page, 'corte');

  // los ejemplos se levantaron hace 3, 4, 6 y 25 días
  await page.click('[data-periodo="todo"]');
  await expect(page.locator('#rangoCorte')).toHaveText('Desde la primera nota');
  await expect(page.locator('#cFacturado')).toHaveText('$840');           // 230 + 210 + 180 + 220
  await expect(page.locator('#cCobrado')).toHaveText('$635');             // 115 + 210 + 90 + 220
  await expect(page.locator('#cMaquila')).toHaveText('$490');             // 120 + 120 + 90 + 160
  await expect(page.locator('#cUtilidad')).toHaveText('$145');           // 635 − 490
  await expect(page.locator('#tablaCorte tr')).toHaveCount(4);

  await page.click('[data-periodo="hoy"]');
  await expect(page.locator('#cFacturado')).toHaveText('$0');
  await expect(page.locator('#cCobrado')).toHaveText('$0');
  await expect(page.locator('#tablaCorte tr')).toHaveCount(0);
  await expect(page.locator('#cPorCobrar')).toHaveText('$205');           // lo que se debe hoy no es del periodo

  await page.click('[data-periodo="mes"]');
  const mes = await page.locator('#rangoCorte').textContent();
  expect(mes).toMatch(/ al /);
  await expect(page.locator('#periodosCorte .active')).toHaveText('Este mes');
});

test('el conteo impreso trae el periodo y las mismas cuentas', async ({ page }) => {
  await abrirLimpia(page);
  await cargarEjemplos(page);
  await irA(page, 'corte');
  await page.evaluate(() => { window.print = () => {}; });
  await page.click('[data-periodo="todo"]');
  await page.click('#btnConteo');
  const hoja = page.locator('#hoja');
  await expect(hoja).toContainText('Todo');
  await expect(hoja).toContainText('$840');
  await expect(hoja).toContainText('Utilidad en caja');
  await expect(hoja).toContainText('$145');
  await expect(hoja).toContainText('Si cobran todo');
});

test('la ropa sin recoger se cuenta con lo que costó', async ({ page }) => {
  await abrirLimpia(page);
  await irA(page, 'corte');
  await expect(page.locator('#sinRecogerTexto')).toHaveText('Nada lleva 15 días o más embolsado.');
  await expect(page.locator('#sinRecogerCifras')).toBeHidden();

  await page.click('#btnEjemplos');
  await expect(page.locator('#sinRecogerTexto')).toHaveText('1 nota (1 prenda) lleva 15 días o más embolsada.');
  await expect(page.locator('#srAnticipo')).toHaveText('$90');
  await expect(page.locator('#srCosto')).toHaveText('$90');
  await expect(page.locator('#srQuedo')).toHaveText('$0');

  await page.click('#btnVerSinRecoger');
  await expect(page.locator('#vista-tablero')).toBeVisible();
  await expect(page.locator('#listaEntregas')).toBeVisible();
});

test('los ejemplos no se duplican y borrar todo deja la tablet en cero', async ({ page }) => {
  await abrirLimpia(page);
  await cargarEjemplos(page);
  await page.click('#btnEjemplos');
  await expect(page.locator('#textoAviso')).toHaveText('Los ejemplos ya están cargados.');
  expect(await notasGuardadas(page)).toHaveLength(4);

  await page.click('#btnBorrarTodo');
  await confirmarCuadro(page);
  await expect.poll(async () => (await notasGuardadas(page)).length).toBe(0);
  await expect(page.locator('#textoAviso')).toHaveText('Listo, la tablet quedó en cero.');
});

test('el respaldo baja un archivo y restaurarlo devuelve todo, con sus imágenes', async ({ page }, info) => {
  await abrirLimpia(page);
  await capturarNota(page, { folio: '1101', cliente: 'Marta Díaz', telefono: '33 1234 5678',
                             observaciones: 'botón flojo', firma: true, fotos: 1 });
  await cargarEjemplos(page);

  const [descarga] = await Promise.all([page.waitForEvent('download'), page.click('#btnRespaldo')]);
  expect(descarga.suggestedFilename()).toMatch(/^respaldo-tintoreria-\d{4}-\d{2}-\d{2}\.json$/);
  const ruta = rutaTemporal(info, 'respaldo.json');
  await descarga.saveAs(ruta);
  const archivo = JSON.parse(readFileSync(ruta, 'utf8'));
  expect(archivo.version).toBeGreaterThanOrEqual(1);
  expect(archivo.notas).toHaveLength(5);
  expect(Object.keys(archivo.imagenes).length).toBeGreaterThanOrEqual(2);
  await expect(page.locator('#avisoRespaldo')).toContainText('5 notas');

  await page.click('#btnBorrarTodo');
  await confirmarCuadro(page);
  await expect.poll(async () => (await notasGuardadas(page)).length).toBe(0);

  await page.setInputFiles('#archivoRespaldo', ruta);
  await confirmarCuadro(page);
  await expect.poll(async () => (await notasGuardadas(page)).length).toBe(5);
  await expect(page.locator('#avisoRespaldo')).toContainText('5 notas restauradas');

  await irA(page, 'tablero');
  await page.locator('.nota-tocable', { hasText: '1101' }).locator('.fw-semibold').first().click();
  // la foto era una dirección (icono.svg), así que se comprueba que se vea, no que sea un data:
  await expect.poll(() => page.$$eval('#edFotos img', (i) => i.filter((x) => x.src && x.naturalWidth > 0).length)).toBe(1);
  await expect.poll(() => page.$$eval('#edFirmas img', (i) => i.filter((x) => x.src.startsWith('data:')).length)).toBe(1);
});

test('un archivo que no es un respaldo se rechaza sin tocar las notas', async ({ page }, info) => {
  await abrirLimpia(page);
  await cargarEjemplos(page);
  const ruta = rutaTemporal(info, 'basura.json');
  writeFileSync(ruta, '{"hola":"mundo"}');
  await page.setInputFiles('#archivoRespaldo', ruta);
  await expect(page.locator('#textoAviso')).toHaveText('Ese archivo no es un respaldo de la aplicación.');
  expect(await notasGuardadas(page)).toHaveLength(4);
});

test.describe('el recordatorio de respaldo', () => {
  test('el primer día no regaña, a la semana avisa y bajarlo lo quita', async ({ page }) => {
    await abrirLimpia(page);
    await expect(page.locator('#avisoRespaldoViejo')).toBeHidden();
    await capturarNota(page, { folio: '1', cliente: 'Ana' });
    await expect(page.locator('#avisoRespaldoViejo')).toBeHidden();

    await page.evaluate(() => localStorage.setItem('tintoreria.desde', new Date(Date.now() - 12 * 86400000).toISOString()));
    await irA(page, 'corte');
    await expect(page.locator('#avisoRespaldoViejo')).toBeVisible();
    await expect(page.locator('#textoRespaldoViejo')).toContainText('Llevas 12 días sin bajar el respaldo');

    await page.evaluate(() => localStorage.setItem('tintoreria.ultimoRespaldo', new Date(Date.now() - 2 * 86400000).toISOString()));
    await irA(page, 'tablero');
    await expect(page.locator('#avisoRespaldoViejo')).toBeHidden();

    await page.evaluate(() => localStorage.setItem('tintoreria.ultimoRespaldo', new Date(Date.now() - 9 * 86400000).toISOString()));
    await irA(page, 'corte');
    await expect(page.locator('#avisoRespaldoViejo')).toBeVisible();
    const [d] = await Promise.all([page.waitForEvent('download'), page.click('#btnRespaldoAviso')]);
    expect(d.suggestedFilename()).toContain('respaldo-tintoreria');
    await expect(page.locator('#avisoRespaldoViejo')).toBeHidden();
  });
});
