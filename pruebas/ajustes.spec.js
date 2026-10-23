// Lo que se cambia en Ajustes sin tocar el código.
import { test, expect, abrirLimpia, irA, agregarPrenda, capturarNota, notasGuardadas, cargarEjemplos, confirmarCuadro, esperarCuadro } from './ayuda.js';
import { writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const poner = async (page, id, valor) => {
  await page.fill('#' + id, String(valor));
  await page.press('#' + id, 'Tab');
};
const ajustesGuardados = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('tintoreria.ajustes') || 'null'));

test.beforeEach(async ({ page }) => {
  await abrirLimpia(page);
  await irA(page, 'ajustes');
});

test('al abrir trae los valores de siempre', async ({ page }) => {
  await expect(page.locator('#ajAnticipo')).toHaveValue('50');
  await expect(page.locator('#ajHoraSalida')).toHaveValue('7');
  await expect(page.locator('#ajDiasSinRecoger')).toHaveValue('15');
  await expect(page.locator('#ajDiasSinRespaldo')).toHaveValue('7');
  await expect(page.locator('#ajPrecioKilo')).toHaveValue('45');
  await expect(page.locator('#ajCostoPrimerKilo')).toHaveValue('32');
  await expect(page.locator('#ajCostoPorKilo')).toHaveValue('16');
  await expect(page.locator('#tablaPrecios tr')).toHaveCount(56);
});

test.describe('esta tablet', () => {
  test('el nombre cambia en el menú y vuelve al de antes si se borra', async ({ page }) => {
    await expect(page.locator('[data-sucursal]').first()).toHaveText('Sucursal 1');
    await page.fill('#nombreSucursal', 'Centro');
    await expect(page.locator('[data-sucursal]').first()).toHaveText('Centro');
    await page.reload();
    await expect(page.locator('[data-sucursal]').first()).toHaveText('Centro');
    await irA(page, 'ajustes');
    await page.fill('#nombreSucursal', '');
    await expect(page.locator('[data-sucursal]').first()).toHaveText('Sucursal 1');
  });

  test('el nombre sale en los papeles que se imprimen', async ({ page }) => {
    await page.fill('#nombreSucursal', 'Centro');
    await capturarNota(page, { folio: '1' });
    await irA(page, 'corte');
    await page.evaluate(() => { window.print = () => {}; });
    await page.click('#btnConteo');
    await expect(page.locator('#hoja')).toContainText('Centro');
  });

  test('quien atiende queda guardado', async ({ page }) => {
    await page.fill('#quienAtiende', 'Ana');
    expect(await page.evaluate(() => localStorage.getItem('tintoreria.quien'))).toBe('Ana');
  });
});

test.describe('el anticipo mínimo', () => {
  test('cambia lo que cuesta el atajo, cómo se llama y cuándo avisa', async ({ page }) => {
    await poner(page, 'ajAnticipo', 30);
    await irA(page, 'nota');
    await expect(page.locator('#atajoMitad')).toHaveText('30%');
    await agregarPrenda(page, 'camisa', 4);                       // $280
    await expect(page.locator('#recibido')).toHaveValue('84');
    await expect(page.locator('#saldo')).toHaveText('$196');
    await expect(page.locator('#avisoAnticipo')).toBeHidden();

    await page.fill('#recibido', '50');
    await expect(page.locator('#avisoAnticipo')).toHaveText('Es menos del 30% que pide el negocio.');
  });

  test('con 50 se sigue llamando Mitad', async ({ page }) => {
    await irA(page, 'nota');
    await expect(page.locator('#atajoMitad')).toHaveText('Mitad');
  });

  for (const malo of ['150', '-5', '']) {
    test(`«${malo}» no sirve: se queda el de antes y lo dice`, async ({ page }) => {
      await poner(page, 'ajAnticipo', 30);
      await poner(page, 'ajAnticipo', malo);
      await expect(page.locator('#textoAviso')).toHaveText('Ese número no sirve. Se quedó el de antes.');
      await expect(page.locator('#ajAnticipo')).toHaveValue('30');
      expect((await ajustesGuardados(page)).anticipoPct).toBe(30);
    });
  }
});

test('la hora de salida cambia la fecha que se promete', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-27T09:00:00-06:00'));   // martes, 9 am
  await page.reload();
  await irA(page, 'nota');
  await agregarPrenda(page, 'camisa');
  await expect(page.locator('#fechaEntrega')).toHaveText('sáb 31 oct');       // ya salió a las 7

  await irA(page, 'ajustes');
  await poner(page, 'ajHoraSalida', 10);                                     // si hoy sale a las 10
  await irA(page, 'nota');
  await agregarPrenda(page, 'camisa');
  await expect(page.locator('#fechaEntrega')).toHaveText('jue 29 oct');
});

test('los días de sin recoger cambian lo que se marca', async ({ page }) => {
  await cargarEjemplos(page);                                    // una lleva 20 días embolsada
  await irA(page, 'ajustes');
  await poner(page, 'ajDiasSinRecoger', 25);
  await irA(page, 'corte');
  await expect(page.locator('#sinRecogerTexto')).toHaveText('Nada lleva 25 días o más embolsado.');
  await irA(page, 'ajustes');
  await poner(page, 'ajDiasSinRecoger', 10);
  await irA(page, 'corte');
  await expect(page.locator('#sinRecogerTexto')).toHaveText('1 nota (1 prenda) lleva 10 días o más embolsada.');
});

test('los días del respaldo cambian cuándo avisa', async ({ page }) => {
  await capturarNota(page, { folio: '1' });
  await page.evaluate(() => localStorage.setItem('tintoreria.desde', new Date(Date.now() - 4 * 86400000).toISOString()));
  await irA(page, 'corte');
  await expect(page.locator('#avisoRespaldoViejo')).toBeHidden();          // 4 días y el aviso es a los 7
  await irA(page, 'ajustes');
  await poner(page, 'ajDiasSinRespaldo', 3);
  await irA(page, 'corte');
  await expect(page.locator('#textoRespaldoViejo')).toContainText('Llevas 4 días');
});

test('la fórmula de la lavandería se cambia', async ({ page }) => {
  await poner(page, 'ajPrecioKilo', 50);
  await poner(page, 'ajCostoPrimerKilo', 40);
  await poner(page, 'ajCostoPorKilo', 20);
  await irA(page, 'nota');
  await page.click('label[for="servLavanderia"]');
  await page.fill('#kilos', '2');
  await expect(page.locator('#total')).toHaveText('$100');
  await page.click('#btnMargen');
  await expect(page.locator('#costo')).toHaveText('$80');                  // 40 + 20 × 2
});

test.describe('los precios', () => {
  const camisa = (page) => page.locator('#tablaPrecios tr', { hasText: 'Camisa' }).first();

  test('un cambio vale para las notas nuevas y no toca las guardadas', async ({ page }) => {
    await capturarNota(page, { folio: '1', prenda: 'camisa', cantidad: 2 });      // a $70
    await irA(page, 'ajustes');
    await camisa(page).getByLabel('Lo que se cobra por Camisa').fill('90');
    await camisa(page).getByLabel('Lo que se cobra por Camisa').press('Tab');
    await expect(camisa(page)).toHaveClass(/table-warning/);

    await irA(page, 'nota');
    await page.fill('#buscarPrenda', 'camisa');
    await expect(page.locator('#resultados button').first()).toContainText('$90');
    await agregarPrenda(page, 'camisa', 2);
    await expect(page.locator('#total')).toHaveText('$180');

    const [vieja] = await notasGuardadas(page);
    expect(vieja.total).toBe(140);                                   // la de antes se queda como estaba
  });

  test('si cobra menos de lo que cuesta, lo marca en rojo', async ({ page }) => {
    await camisa(page).getByLabel('Lo que se cobra por Camisa').fill('30');
    await camisa(page).getByLabel('Lo que se cobra por Camisa').press('Tab');
    await expect(camisa(page).locator('td').last()).toHaveText('−$10');
    await expect(camisa(page).locator('td').last()).toHaveClass(/text-danger/);
  });

  test('un número malo se rechaza y vuelve el de antes', async ({ page }) => {
    const precio = camisa(page).getByLabel('Lo que se cobra por Camisa');
    await precio.fill('-3');
    await precio.press('Tab');
    await expect(page.locator('#textoAviso')).toHaveText('Ese número no sirve. Se quedó el de antes.');
    await expect(precio).toHaveValue('70');
  });

  test('el cambio se queda al recargar y escribir el original lo quita', async ({ page }) => {
    const precio = camisa(page).getByLabel('Lo que se cobra por Camisa');
    await precio.fill('85');
    await precio.press('Tab');
    await page.reload();
    await irA(page, 'ajustes');
    await expect(camisa(page).getByLabel('Lo que se cobra por Camisa')).toHaveValue('85');

    await camisa(page).getByLabel('Lo que se cobra por Camisa').fill('70');
    await camisa(page).getByLabel('Lo que se cobra por Camisa').press('Tab');
    await expect(camisa(page)).not.toHaveClass(/table-warning/);
    expect(Object.keys((await ajustesGuardados(page)).precios)).toHaveLength(0);
  });

  test('se busca una prenda en la lista', async ({ page }) => {
    await page.fill('#filtroPrecios', 'sabana');
    await expect(page.locator('#tablaPrecios tr:not(.d-none)')).toHaveCount(1);
    await expect(page.locator('#tablaPrecios tr:not(.d-none)')).toContainText('Sábana 1 pieza');
    await page.fill('#filtroPrecios', '');
    await expect(page.locator('#tablaPrecios tr:not(.d-none)')).toHaveCount(56);
  });

  test('volver a los originales pide confirmar y deja todo como en la hoja', async ({ page }) => {
    await poner(page, 'ajAnticipo', 20);
    const precio = camisa(page).getByLabel('Lo que se cobra por Camisa');
    await precio.fill('99');
    await precio.press('Tab');

    await page.click('#btnPreciosOriginales');
    await esperarCuadro(page);
    await page.getByRole('button', { name: 'No', exact: true }).click();     // primero se dice que no
    await expect(page.locator('#modalConfirmar')).toBeHidden();
    await expect(precio).toHaveValue('99');

    await page.click('#btnPreciosOriginales');
    await confirmarCuadro(page);
    await expect(camisa(page).getByLabel('Lo que se cobra por Camisa')).toHaveValue('70');
    await expect(page.locator('#ajAnticipo')).toHaveValue('50');
  });
});

test.describe('el respaldo se lleva los ajustes', () => {
  const ruta = (info, nombre) => join(tmpdir(), `tintoreria-${info.project.name}-${info.workerIndex}-${nombre}`);

  test('bajarlo y restaurarlo devuelve precios, anticipo y fórmula', async ({ page }, info) => {
    await poner(page, 'ajAnticipo', 35);
    await poner(page, 'ajPrecioKilo', 55);
    const precio = page.locator('#tablaPrecios tr', { hasText: 'Camisa' }).first().getByLabel('Lo que se cobra por Camisa');
    await precio.fill('88');
    await precio.press('Tab');
    await capturarNota(page, { folio: '1' });

    await irA(page, 'corte');
    const [d] = await Promise.all([page.waitForEvent('download'), page.click('#btnRespaldo')]);
    const archivo = ruta(info, 'ajustes.json');
    await d.saveAs(archivo);
    const datos = JSON.parse(readFileSync(archivo, 'utf8'));
    expect(datos.version).toBe(3);
    expect(datos.ajustes).toMatchObject({ anticipoPct: 35, lavanderia: { precioKilo: 55 } });
    expect(datos.ajustes.precios['ropa|Camisa']).toMatchObject({ precio: 88 });

    // se pierden: otra tablet, todo en blanco
    await page.evaluate(() => localStorage.removeItem('tintoreria.ajustes'));
    await page.reload();
    await irA(page, 'corte');
    await page.setInputFiles('#archivoRespaldo', archivo);
    await confirmarCuadro(page);
    await expect.poll(async () => (await ajustesGuardados(page))?.anticipoPct).toBe(35);
    expect((await ajustesGuardados(page)).precios['ropa|Camisa'].precio).toBe(88);
  });

  test('un respaldo viejo, sin ajustes, no pisa los que ya hay', async ({ page }, info) => {
    await poner(page, 'ajAnticipo', 35);
    const viejo = ruta(info, 'sin-ajustes.json');
    writeFileSync(viejo, JSON.stringify({ version: 2, fecha: new Date().toISOString(), notas: [], imagenes: {} }));
    await irA(page, 'corte');
    await page.setInputFiles('#archivoRespaldo', viejo);
    await confirmarCuadro(page);
    await expect(page.locator('#avisoRespaldo')).toContainText('0 notas restauradas');
    expect((await ajustesGuardados(page)).anticipoPct).toBe(35);
  });
});

test('un ajuste dañado en el almacén se ignora y no tumba la app', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('tintoreria.ajustes', JSON.stringify({ anticipoPct: 'mucho', horaSalida: -4, precios: { 'ropa|Camisa': { precio: 'x' } } })));
  await page.reload();
  await irA(page, 'ajustes');
  await expect(page.locator('#ajAnticipo')).toHaveValue('50');
  await expect(page.locator('#ajHoraSalida')).toHaveValue('7');
  await expect(page.locator('#tablaPrecios tr', { hasText: 'Camisa' }).first().getByLabel('Lo que se cobra por Camisa')).toHaveValue('70');
});
