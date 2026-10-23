import { test, expect, abrirLimpia, irA, capturarNota, firmar, notasGuardadas, sembrar, PIXEL, FOTO } from './ayuda.js';

test('las fotos y la firma viven aparte y la nota guarda solo sus nombres', async ({ page }) => {
  await abrirLimpia(page);
  await irA(page, 'nota');

  // dos fotos con la cámara: salen achicadas a 1000 px
  await page.setInputFiles('#tomarFoto', [FOTO, FOTO]);
  await expect(page.locator('#galeria img')).toHaveCount(2);
  const lados = await page.$$eval('#galeria img', (imgs) => imgs.map((i) => Math.max(i.naturalWidth, i.naturalHeight)));
  for (const lado of lados) expect(lado).toBeLessThanOrEqual(1000);
  expect(await page.$$eval('#galeria img', (i) => i.every((x) => x.src.startsWith('data:image/jpeg')))).toBe(true);

  await page.fill('#folio', '1001');
  await page.fill('#nombreCliente', 'Con imágenes');
  await page.fill('#buscarPrenda', 'camisa');
  await page.locator('#resultados button').first().click();
  await firmar(page, '#firma');
  await page.click('#btnGuardar');
  await expect(page.locator('#vista-tablero')).toBeVisible();

  const [n] = await notasGuardadas(page);
  expect(n.fotos).toHaveLength(2);
  expect(n.fotos.every((f) => !f.startsWith('data:'))).toBe(true);
  expect(n.firmaRecibido.startsWith('data:')).toBe(false);
  expect(JSON.stringify(n).length).toBeLessThan(1500);   // antes pesaba más de 1 MB

  // al abrir la nota, las imágenes vuelven
  await page.locator('.nota-tocable').first().click();
  await expect(page.locator('#modalNota')).toBeVisible();
  await expect(page.locator('#edFotos img')).toHaveCount(2);
  await expect.poll(() => page.$$eval('#edFotos img', (i) => i.filter((x) => x.src.startsWith('data:image/jpeg')).length)).toBe(2);
  await expect.poll(() => page.$$eval('#edFirmas img', (i) => i.filter((x) => x.src.startsWith('data:image/png')).length)).toBe(1);
});

test('una nota guardada con la versión vieja se muda sola y conserva todo', async ({ page }) => {
  await abrirLimpia(page);
  await sembrar(page, [{
    id: 'vieja1', folio: '0999', cliente: 'Nota Vieja', telefono: '33 1111 1111',
    piezas: 2, total: 140, costo: 70, pagado: 70, saldo: 70, observaciones: 'traía un roto',
    detalle: 'Camisa ×2', entrega: 'sáb 24 oct', estatus: 'recibida',
    firmaRecibido: PIXEL, firmaEntrega: null, fotos: [PIXEL, PIXEL],
  }]);

  await expect.poll(async () => {
    const [n] = await notasGuardadas(page);
    return n.fotos.every((f) => !f.startsWith('data:')) && !n.firmaRecibido.startsWith('data:');
  }).toBe(true);

  const [n] = await notasGuardadas(page);
  expect(n).toMatchObject({ folio: '0999', cliente: 'Nota Vieja', observaciones: 'traía un roto', piezas: 2 });

  await irA(page, 'tablero');
  await page.locator('.nota-tocable').first().click();
  await expect.poll(() => page.$$eval('#edFotos img', (i) => i.filter((x) => x.src.startsWith('data:')).length)).toBe(2);
  await expect.poll(() => page.$$eval('#edFirmas img', (i) => i.filter((x) => x.src.startsWith('data:')).length)).toBe(1);
});

test('con 1,000 notas el tablero sigue respondiendo', async ({ page }) => {
  await abrirLimpia(page);
  const estados = ['recibida', 'maquila', 'devuelta', 'lista', 'entregada'];
  const hace = (d) => new Date(Date.now() - d * 86400000).toISOString();
  const notas = Array.from({ length: 1000 }, (_, i) => ({
    id: 'p' + i, folio: String(1000 + i), cliente: 'Cliente de prueba ' + i, telefono: '33 1234 ' + (1000 + i),
    piezas: 3, total: 210, costo: 120, pagado: 105, saldo: 105, observaciones: '', detalle: 'Camisa ×3',
    entrega: 'sáb 24 oct', estatus: estados[i % 5], creada: hace(i % 60), fotos: [], firmaRecibido: null,
  }));
  await sembrar(page, notas);
  await irA(page, 'tablero');
  const ms = await page.evaluate(() => {
    const t = performance.now();
    document.getElementById('modoLista').click();
    return performance.now() - t;
  });
  expect(ms).toBeLessThan(800);
  await page.fill('#buscarNota', 'cliente de prueba 55');
  await expect(page.locator('#cuentaBusqueda')).toContainText('de 1000');
});
