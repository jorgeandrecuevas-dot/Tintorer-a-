import { test, expect, abrirLimpia, irA, capturarNota, firmar, notasGuardadas, cargarEjemplos, espiarOpen, direccionesAbiertas } from './ayuda.js';

const fila = (page, folio) => page.locator('.nota-tocable', { hasText: folio });
// Se toca el título: en pantallas angostas el centro de la fila cae sobre un botón
const abrirFila = (page, folio) => fila(page, folio).locator('.fw-semibold').first().click();

test.describe('con las notas de ejemplo', () => {
  test.beforeEach(async ({ page }) => {
    await abrirLimpia(page);
    await cargarEjemplos(page);
    await irA(page, 'tablero');
  });

  test('las cinco columnas cuentan cada nota en su etapa', async ({ page }) => {
    const cuentas = await page.$$eval('#columnas .card', (c) => c.map((x) => x.querySelector('.card-header span').textContent + ':' + x.querySelector('.badge').textContent));
    expect(cuentas).toEqual(['Recibida:0', 'En maquila:1', 'De vuelta:1', 'Embolsada:1', 'Entregada:1']);
  });

  test('la lista de entregas pone primero lo embolsado y marca lo que nadie recoge', async ({ page }) => {
    await page.click('#modoLista');
    await expect(page.locator('#listaEntregas')).toBeVisible();
    await expect(page.locator('#columnas')).toBeHidden();

    const pendientes = await page.$$eval('#listaEntregas .card:first-child .nota-tocable', (f) => f.map((x) => x.querySelector('.fw-semibold').textContent));
    expect(pendientes).toEqual(['0477 · Sofía Peña', '0480 · Pedro Lara', '0479 · Carmen Ruiz']);
    await expect(fila(page, '0477')).toContainText('Sin recoger');
    await expect(fila(page, '0477')).toContainText('Debe $90');
    await expect(page.locator('#listaEntregas .caja-entrega.hecha')).toHaveCount(0);

    await page.click('#modoEtapas');
    await expect(page.locator('#columnas')).toBeVisible();
  });

  test('se busca por número o por nombre, sin acentos, y dice cuántas salieron', async ({ page }) => {
    await page.fill('#buscarNota', '0477');
    await expect(page.locator('#cuentaBusqueda')).toHaveText('1 nota de 4');
    await page.fill('#buscarNota', 'sofia');
    await expect(page.locator('#columnas .nota-tocable')).toHaveText([/0477 · Sofía Peña/]);
    await page.fill('#buscarNota', 'zzz');
    await expect(page.locator('#sinResultadosNota')).toBeVisible();

    // por teléfono, con tres números o más y sin importar cómo se escribió
    await page.evaluate(() => {
      const notas = JSON.parse(localStorage.getItem('tintoreria.notas'));
      notas[0].telefono = '33 4455-6677';
      localStorage.setItem('tintoreria.notas', JSON.stringify(notas));
    });
    await page.reload();
    await irA(page, 'tablero');
    await page.fill('#buscarNota', '4455');
    await expect(page.locator('#cuentaBusqueda')).toHaveText('1 nota de 4');
    await page.fill('#buscarNota', '44');
    await expect(page.locator('#sinResultadosNota')).toBeVisible();      // con dos no busca en teléfonos
    await page.fill('#buscarNota', '');
    await expect(page.locator('#columnas .nota-tocable')).toHaveCount(4);
  });

  test('una nota que regresó de la maquila se embolsa con un toque', async ({ page }) => {
    await fila(page, '0480').getByRole('button', { name: 'Ya está embolsada' }).click();
    await expect.poll(async () => (await notasGuardadas(page)).find((n) => n.folio === '0480').estatus).toBe('lista');
    expect((await notasGuardadas(page)).find((n) => n.folio === '0480').listaDesde).toBeTruthy();
  });

  test('avisarle abre WhatsApp con el mensaje escrito y deja la nota marcada', async ({ page }) => {
    await espiarOpen(page);
    await page.click('#modoLista');

    // sin teléfono no abre nada y dice por qué
    await fila(page, '0477').getByRole('button', { name: 'Avisarle' }).click();
    await expect(page.locator('#textoAviso')).toHaveText('La nota 0477 no tiene teléfono.');
    expect(await direccionesAbiertas(page)).toHaveLength(0);

    // se corrige la nota y ahora sí
    await abrirFila(page, '0477');
    await expect(page.locator('#modalNota')).toBeVisible();
    await page.fill('#edTelefono', '33 1234 5678');
    await page.click('#btnGuardarNota');
    await expect(page.locator('#modalNota')).toBeHidden();

    await fila(page, '0477').getByRole('button', { name: 'Avisarle' }).click();
    const [url] = await direccionesAbiertas(page);
    expect(url.startsWith('https://wa.me/523312345678?text=')).toBe(true);
    const texto = decodeURIComponent(url.split('text=')[1]);
    expect(texto).toContain('Hola Sofía');
    expect(texto).toContain('nota 0477');
    expect(texto).toContain('$90');
    await expect(fila(page, '0477')).toContainText('Avisada');
  });

  test('para entregar el cliente tiene que firmar', async ({ page }) => {
    await fila(page, '0477').getByRole('button', { name: 'Cobrar y entregar' }).click();
    await expect(page.locator('#modalEntrega')).toHaveClass(/show/);
    await expect(page.locator('#entregaSaldo')).toHaveText('$90');
    await page.waitForTimeout(500);

    await page.click('#btnConfirmarEntrega');
    await expect(page.locator('#textoAviso')).toHaveText('Falta que el cliente firme de entregado.');
    expect((await notasGuardadas(page)).find((n) => n.folio === '0477').estatus).toBe('lista');

    await firmar(page, '#firmaEntrega');
    await page.click('#btnConfirmarEntrega');
    await expect(page.locator('#modalEntrega')).toBeHidden();

    const n = (await notasGuardadas(page)).find((x) => x.folio === '0477');
    expect(n).toMatchObject({ estatus: 'entregada', saldo: 0, pagado: 180 });
    expect(n.firmaEntrega && !n.firmaEntrega.startsWith('data:')).toBeTruthy();

    await page.click('#modoLista');
    await expect(page.locator('#listaEntregas .caja-entrega.hecha')).toHaveCount(1);
  });
});

test.describe('corregir una nota', () => {
  test.beforeEach(async ({ page }) => {
    await abrirLimpia(page);
    await capturarNota(page, { folio: '0801', cliente: 'Nombre Malo', telefono: '33 0000 0000',
                               observaciones: 'nota mal capturada', cantidad: 3, firma: true, fotos: 1 });
    await expect(page.locator('.nota-tocable')).toHaveCount(1);
  });

  test('se abre tocándola y trae todo, y los cambios se guardan', async ({ page }) => {
    await page.locator('.nota-tocable').click();
    await expect(page.locator('#modalNota')).toBeVisible();
    await expect(page.locator('#tituloNota')).toHaveText('Nota 0801');
    await expect(page.locator('#edCliente')).toHaveValue('Nombre Malo');
    await expect(page.locator('#edTotal')).toHaveText('$210');
    await expect(page.locator('#edRecibido')).toHaveValue('105');
    await expect(page.locator('#edSaldo')).toHaveText('$105');

    // el saldo se recalcula al escribir
    await page.fill('#edRecibido', '210');
    await expect(page.locator('#edSaldo')).toHaveText('$0');

    await page.fill('#edFolio', '0802');
    await page.fill('#edCliente', 'Nombre Bueno');
    await page.fill('#edObserva', 'ya corregida');
    await page.selectOption('#edEstatus', 'lista');
    await page.click('#btnGuardarNota');
    await expect(page.locator('#modalNota')).toBeHidden();

    const [n] = await notasGuardadas(page);
    expect(n).toMatchObject({ folio: '0802', cliente: 'Nombre Bueno', observaciones: 'ya corregida',
                              estatus: 'lista', pagado: 210, saldo: 0 });
  });

  test('el botón de entregar no abre el cuadro de la nota', async ({ page }) => {
    await page.locator('.nota-tocable').click();
    await page.selectOption('#edEstatus', 'lista');
    await page.click('#btnGuardarNota');
    await expect(page.locator('#modalNota')).toBeHidden();
    await page.getByRole('button', { name: /entregar/i }).click();
    await expect(page.locator('#modalEntrega')).toHaveClass(/show/);
    await expect(page.locator('#modalNota')).toBeHidden();
  });
});

test('si el almacén falla, la pantalla lo dice en vez de fingir que guardó', async ({ page }) => {
  await abrirLimpia(page);
  await cargarEjemplos(page);
  await irA(page, 'tablero');
  await page.evaluate(() => {
    Storage.prototype.setItem = () => { throw new DOMException('lleno', 'QuotaExceededError'); };
  });
  await fila(page, '0480').getByRole('button', { name: 'Ya está embolsada' }).click();
  await expect(page.locator('#textoAviso')).toContainText('No se pudo guardar');
});
