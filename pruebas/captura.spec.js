import { test, expect, abrirLimpia, irA, agregarPrenda, capturarNota, notasGuardadas, textoDelAviso } from './ayuda.js';

test.beforeEach(async ({ page }) => {
  await abrirLimpia(page);
  await irA(page, 'nota');
});

test('suma las prendas y el cobro de mitad es lo que arranca', async ({ page }) => {
  await agregarPrenda(page, 'camisa', 3);
  await agregarPrenda(page, 'saco', 1);
  await expect(page.locator('#totalPiezas')).toHaveText('4');
  await expect(page.locator('#total')).toHaveText('$280');
  await expect(page.locator('#recibido')).toHaveValue('140');
  await expect(page.locator('#saldo')).toHaveText('$140');
});

test('el cobro se escribe a mano y no pasa de lo que vale la nota', async ({ page }) => {
  await agregarPrenda(page, 'camisa', 4);                   // $280
  await page.click('#atajoTodo');
  await expect(page.locator('#saldo')).toHaveText('$0');

  await page.click('#atajoNada');
  await expect(page.locator('#recibido')).toHaveValue('0');
  await expect(page.locator('#avisoAnticipo')).toBeVisible();

  await page.fill('#recibido', '200');
  await expect(page.locator('#saldo')).toHaveText('$80');
  await expect(page.locator('#avisoAnticipo')).toBeHidden();
  await expect(page.locator('#atajoMitad')).not.toHaveClass(/active/);

  await page.fill('#recibido', '9999');
  await expect(page.locator('#saldo')).toHaveText('$0');
});

test('el buscador encuentra sin acentos, avisa si no hay y Enter agrega la primera', async ({ page }) => {
  await page.fill('#buscarPrenda', 'sabana');
  await expect(page.locator('#resultados button')).toContainText(['Sábana 1 pieza']);

  await page.fill('#buscarPrenda', 'zzz');
  await expect(page.locator('#resultados')).toContainText('Ninguna prenda se llama así.');

  await page.fill('#buscarPrenda', 'saco');
  await page.press('#buscarPrenda', 'Enter');
  await expect(page.locator('#totalPiezas')).toHaveText('1');
  await expect(page.locator('#total')).toHaveText('$70');
});

test('los botones de más y menos mueven la cantidad y nunca bajan de 1', async ({ page }) => {
  await page.click('#masCantidad');
  await page.click('#masCantidad');
  await expect(page.locator('#cantidad')).toHaveValue('3');
  await page.click('#menosCantidad');
  await page.click('#menosCantidad');
  await page.click('#menosCantidad');
  await expect(page.locator('#cantidad')).toHaveValue('1');
});

test('la lavandería cobra por kilo', async ({ page }) => {
  await page.click('label[for="servLavanderia"]');
  await page.fill('#kilos', '2.3');
  await expect(page.locator('#total')).toHaveText('$103');
  await expect(page.locator('#totalPiezas')).toHaveText('3');
});

test('sin número de nota no se guarda y dice por qué', async ({ page }) => {
  await agregarPrenda(page, 'camisa');
  await page.click('#btnGuardar');
  await expect(page.locator('#textoAviso')).toHaveText('Falta el número de nota.');
  expect(await notasGuardadas(page)).toHaveLength(0);
});

test('sin prendas no se guarda y dice por qué', async ({ page }) => {
  await page.fill('#folio', '0001');
  await page.click('#btnGuardar');
  await expect(page.locator('#textoAviso')).toHaveText('La nota no tiene prendas.');
  expect(await notasGuardadas(page)).toHaveLength(0);
});

test('guarda la nota con sus datos, la manda al tablero y deja el formulario limpio', async ({ page }) => {
  await capturarNota(page, { folio: '0501', cliente: 'Marta Díaz', telefono: '33 1234 5678',
                             prenda: 'camisa', cantidad: 3, observaciones: 'Le falta un botón' });
  await expect.poll(async () => (await notasGuardadas(page)).length).toBe(1);
  const [n] = await notasGuardadas(page);
  expect(n).toMatchObject({ folio: '0501', cliente: 'Marta Díaz', telefono: '33 1234 5678',
    piezas: 3, total: 210, pagado: 105, saldo: 105, estatus: 'recibida',
    observaciones: 'Le falta un botón' });
  expect(n.id).toBeTruthy();
  expect(n.creada).toBeTruthy();
  expect(n.entregaISO).toBeTruthy();

  await irA(page, 'nota');
  await expect(page.locator('#folio')).toHaveValue('');
  await expect(page.locator('#totalPiezas')).toHaveText('0');
  await expect(page.locator('#recibido')).toHaveValue('0');
  await expect(page.locator('#atajoMitad')).toHaveClass(/active/);
});

test('la sugerencia de clientes llena nombre y teléfono', async ({ page }) => {
  await capturarNota(page, { folio: '1', cliente: 'Marta Díaz', telefono: '33 1111 1111' });
  await capturarNota(page, { folio: '2', cliente: 'Martín López', telefono: '33 2222 2222' });
  await irA(page, 'nota');

  await page.fill('#nombreCliente', 'm');
  await expect(page.locator('#clientesAntes')).toBeHidden();         // con una letra sale medio pueblo

  await page.fill('#nombreCliente', 'mart');
  await expect(page.locator('#clientesAntes button')).toHaveCount(2);
  await page.locator('#clientesAntes button', { hasText: 'Martín' }).click();
  await expect(page.locator('#nombreCliente')).toHaveValue('Martín López');
  await expect(page.locator('#telCliente')).toHaveValue('33 2222 2222');
});

test.describe('la fecha que se le promete al cliente', () => {
  const casos = [
    ['lunes en la noche sale el martes y regresa el jueves', '2026-10-26T20:00:00-06:00', false, 'jue 29 oct'],
    ['el miércoles sale el jueves y regresa el sábado',       '2026-10-28T12:00:00-06:00', false, 'sáb 31 oct'],
    ['el sábado antes de que salga regresa el martes',        '2026-10-24T06:00:00-06:00', false, 'mar 27 oct'],
    ['un cobertor tarda un ciclo más',                        '2026-10-26T20:00:00-06:00', true,  'sáb 31 oct'],
    // el carro sale a las 7 am: lo que llega después ya no alcanza
    ['el martes a las 6 am todavía alcanza el carro',         '2026-10-27T06:00:00-06:00', false, 'jue 29 oct'],
    ['el martes a las 3 pm el carro ya salió: sale el jueves', '2026-10-27T15:00:00-06:00', false, 'sáb 31 oct'],
    ['el sábado a las 5 pm sale el martes y regresa el jueves', '2026-10-24T17:00:00-06:00', false, 'jue 29 oct'],
  ];
  for (const [nombre, momento, cobertor, esperada] of casos) {
    test(nombre, async ({ page }) => {
      await page.clock.setFixedTime(new Date(momento));
      await abrirLimpia(page);
      await irA(page, 'nota');
      await agregarPrenda(page, cobertor ? 'cobertor' : 'camisa');
      await expect(page.locator('#fechaEntrega')).toHaveText(esperada);
    });
  }
});

test.describe('la lavandería sin kilos no se cobra', () => {
  test.beforeEach(async ({ page }) => {
    await page.click('label[for="servLavanderia"]');
  });

  for (const kilos of ['0', '', '-5']) {
    test(`con «${kilos}» kg no hay nota`, async ({ page }) => {
      await page.fill('#kilos', kilos);
      await expect(page.locator('#total')).toHaveText('$0');
      await expect(page.locator('#totalPiezas')).toHaveText('0');
      await page.fill('#folio', 'K1');
      await page.click('#btnGuardar');
      await expect(page.locator('#textoAviso')).toHaveText('Faltan los kilos.');
      expect(await notasGuardadas(page)).toHaveLength(0);
    });
  }

  test('con kilos de verdad sí guarda, y la maquila cobra lo suyo', async ({ page }) => {
    await page.fill('#kilos', '2');
    await page.fill('#folio', 'K2');
    await page.click('#btnGuardar');
    await expect(page.locator('#vista-tablero')).toBeVisible();
    const [n] = await notasGuardadas(page);
    expect(n).toMatchObject({ folio: 'K2', piezas: 2, total: 90, costo: 64 });
  });
});

test.describe('el número de nota repetido', () => {
  test('avisa mientras se escribe y no guarda hasta que se toca otra vez', async ({ page }) => {
    await capturarNota(page, { folio: '0100', cliente: 'Primera' });
    await irA(page, 'nota');

    await page.fill('#folio', '0100');
    await expect(page.locator('#avisoFolio')).toHaveText('Ya hay una nota 0100 de Primera.');
    await page.fill('#folio', '0101');
    await expect(page.locator('#avisoFolio')).toBeHidden();

    await page.fill('#folio', '0100');
    await agregarPrenda(page, 'camisa');
    await page.click('#btnGuardar');
    await expect(page.locator('#textoAviso')).toHaveText('Ya hay una nota 0100. Si es otra, toca Guardar otra vez.');
    expect(await notasGuardadas(page)).toHaveLength(1);

    await page.click('#btnGuardar');                          // sí era otra
    await expect.poll(async () => (await notasGuardadas(page)).length).toBe(2);
  });

  test('si cambia el número, ya no hace falta confirmar', async ({ page }) => {
    await capturarNota(page, { folio: '0100', cliente: 'Primera' });
    await irA(page, 'nota');
    await page.fill('#folio', '0100');
    await agregarPrenda(page, 'camisa');
    await page.click('#btnGuardar');
    await page.fill('#folio', '0102');
    await page.click('#btnGuardar');
    await expect.poll(async () => (await notasGuardadas(page)).length).toBe(2);
  });
});
