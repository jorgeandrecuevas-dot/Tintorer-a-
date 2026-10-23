// La pantalla de inicio y la cola de avisos.
import { test, expect, abrirLimpia, irA, capturarNota, sembrar, cargarEjemplos, espiarOpen, direccionesAbiertas, notasGuardadas, esperarCuadro } from './ayuda.js';

// Jueves 22 de octubre de 2026. El carro sale a las 7.
const JUEVES_6AM = new Date('2026-10-22T06:00:00-06:00');
const JUEVES_3PM = new Date('2026-10-22T15:00:00-06:00');
const MIERCOLES = new Date('2026-10-21T12:00:00-06:00');
const hace = (dias) => new Date(JUEVES_3PM.getTime() - dias * 86400000).toISOString();

const nota = (extra) => ({
  id: 'n' + Math.random().toString(36).slice(2, 8), folio: '1', cliente: 'Ana', telefono: '', piezas: 2,
  total: 140, costo: 80, pagado: 70, saldo: 70, estatus: 'recibida', creada: hace(2),
  pagos: [{ f: hace(2), monto: 70, tipo: 'anticipo' }], historial: [], fotos: [], ...extra,
});

const tarjeta = (page, titulo) => page.locator('#hoyTarjetas .card', { hasText: titulo });
const numero = (page, titulo) => tarjeta(page, titulo).locator('.display-6');

test('sin notas da la bienvenida y lleva a levantar la primera', async ({ page }) => {
  await page.clock.setFixedTime(JUEVES_3PM);
  await abrirLimpia(page);
  await expect(page.locator('#hoyFecha')).toHaveText('Hoy es jueves 22 de oct.');
  await expect(page.locator('#hoyTarjetas')).toContainText('Todavía no hay notas.');
  await page.getByRole('button', { name: 'Levantar la primera' }).click();
  await expect(page.locator('#vista-nota')).toBeVisible();
});

test('el botón de arriba levanta una nota nueva', async ({ page }) => {
  await abrirLimpia(page);
  await page.click('#btnHoyNota');
  await expect(page.locator('#vista-nota')).toBeVisible();
});

test.describe('cuándo sale el carro', () => {
  const casos = [
    ['el jueves antes de las 7', JUEVES_6AM, 'Hoy sale el carro'],
    ['el jueves ya pasadas las 7', JUEVES_3PM, 'Sale el sábado 24 oct'],
    ['el miércoles, el día antes', MIERCOLES, 'Mañana sale el carro'],
  ];
  for (const [nombre, momento, texto] of casos) {
    test(nombre, async ({ page }) => {
      await page.clock.setFixedTime(momento);
      await abrirLimpia(page);
      await sembrar(page, [nota({ folio: '1' }), nota({ folio: '2', apartada: true })]);
      await expect(numero(page, 'Por mandar')).toHaveText('2');
      await expect(tarjeta(page, 'Por mandar')).toContainText(texto);
      await expect(tarjeta(page, 'Por mandar')).toContainText('1 de 2 apartadas, 4 prendas');
    });
  }
});

test('cada tarjeta cuenta lo suyo y dice qué hacer', async ({ page }) => {
  await page.clock.setFixedTime(JUEVES_3PM);
  await abrirLimpia(page);
  await sembrar(page, [
    nota({ folio: '10', estatus: 'maquila', regresaISO: JUEVES_3PM.toISOString() }),                 // regresa hoy
    nota({ folio: '11', estatus: 'maquila', regresaISO: hace(2) }),                                  // atrasada
    nota({ folio: '12', estatus: 'maquila', regresaISO: new Date(JUEVES_3PM.getTime() + 2 * 86400000).toISOString() }),
    nota({ folio: '13', estatus: 'devuelta' }),
    nota({ folio: '14', estatus: 'lista', telefono: '33 1111 1111', listaDesde: hace(2), saldo: 70 }),
    nota({ folio: '15', estatus: 'lista', telefono: '', listaDesde: hace(1), saldo: 0, pagado: 140, total: 140 }),
    nota({ folio: '16', estatus: 'lista', telefono: '33 2222 2222', listaDesde: hace(20), avisadaEl: hace(19) }),
    nota({ folio: '17', estatus: 'entregada' }),
    nota({ folio: '18', estatus: 'lista', cancelada: true, telefono: '33 3333 3333' }),
  ]);
  await expect(numero(page, 'Regresan hoy')).toHaveText('1');
  await expect(tarjeta(page, 'Regresan hoy')).toContainText('1 nota atrasada');
  await expect(numero(page, 'Atrasadas')).toHaveText('1');
  await expect(numero(page, 'Por embolsar')).toHaveText('1');
  await expect(numero(page, 'Por avisar')).toHaveText('1');              // la 14. La 15 no tiene teléfono y la 16 ya se avisó
  await expect(tarjeta(page, 'Por avisar')).toContainText('1 nota sin teléfono');
  await expect(numero(page, 'Por entregar')).toHaveText('3');            // la cancelada no cuenta
  await expect(tarjeta(page, 'Por entregar')).toContainText('Deben $140 en total.');
  await expect(numero(page, 'Sin recoger')).toHaveText('1');
});

test('lo que no tiene nada pendiente se ve apagado y sin botón', async ({ page }) => {
  await abrirLimpia(page);
  await sembrar(page, [nota({ folio: '1' })]);
  await expect(tarjeta(page, 'Regresan hoy')).toHaveClass(/tarjeta-hoy-vacia/);
  await expect(tarjeta(page, 'Regresan hoy').getByRole('button')).toHaveCount(0);
  await expect(tarjeta(page, 'Por mandar').getByRole('button', { name: 'Apartar la ropa' })).toBeVisible();
});

test('los botones llevan adonde dicen', async ({ page }) => {
  await abrirLimpia(page);
  await cargarEjemplos(page);
  await irA(page, 'hoy');

  await tarjeta(page, 'Por embolsar').getByRole('button').click();
  await expect(page.locator('#vista-tablero')).toBeVisible();
  await irA(page, 'hoy');

  await tarjeta(page, 'Por entregar').getByRole('button').click();
  await expect(page.locator('#listaEntregas')).toBeVisible();
  await irA(page, 'hoy');

  await tarjeta(page, 'Sin recoger').getByRole('button').click();
  await expect(page.locator('#listaEntregas')).toBeVisible();
  await irA(page, 'hoy');

  await tarjeta(page, 'Regresan hoy').getByRole('button').click();
  await expect(page.locator('#vista-maquila')).toBeVisible();
});

test('se pone al día cuando cambian las notas', async ({ page }) => {
  await abrirLimpia(page);
  await capturarNota(page, { folio: '1', cantidad: 2 });
  await irA(page, 'hoy');
  await expect(numero(page, 'Por mandar')).toHaveText('1');
  await irA(page, 'maquila');
  await page.click('#btnEnviar');
  await irA(page, 'hoy');
  await expect(numero(page, 'Por mandar')).toHaveText('0');
});

test.describe('la cola de avisos', () => {
  const dosParaAvisar = (extra = []) => [
    nota({ folio: '20', cliente: 'Marta Díaz', estatus: 'lista', telefono: '33 1111 1111', listaDesde: hace(1), saldo: 70 }),
    nota({ folio: '21', cliente: 'Beto Ruiz', estatus: 'lista', telefono: '33 2222 2222', listaDesde: hace(1), saldo: 0, pagado: 140 }),
    ...extra,
  ];

  test('pone al primero con su mensaje, abre WhatsApp y pasa al siguiente', async ({ page }) => {
    await abrirLimpia(page);
    await sembrar(page, dosParaAvisar([nota({ folio: '22', estatus: 'lista', telefono: '', listaDesde: hace(1) })]));
    await espiarOpen(page);
    await irA(page, 'hoy');
    await expect(numero(page, 'Por avisar')).toHaveText('2');
    await tarjeta(page, 'Por avisar').getByRole('button', { name: 'Avisarles' }).click();
    await esperarCuadro(page).catch(() => {});
    await expect(page.locator('#modalCola')).toBeVisible();
    await expect(page.locator('#colaProgreso')).toHaveText('1 de 2');
    await expect(page.locator('#colaTarjeta')).toContainText('20 · Marta Díaz');
    await expect(page.locator('#colaTarjeta')).toContainText('Quedan $70 por pagar');

    await page.getByRole('button', { name: 'Abrir WhatsApp' }).click();
    await expect(page.locator('#colaProgreso')).toHaveText('2 de 2');
    await expect(page.locator('#colaTarjeta')).toContainText('21 · Beto Ruiz');
    const [primera] = await direccionesAbiertas(page);
    expect(primera).toContain('https://wa.me/523311111111?text=');

    await page.getByRole('button', { name: 'Abrir WhatsApp' }).click();
    await expect(page.locator('#modalCola')).toBeHidden();
    await expect(page.locator('#textoAviso')).toHaveText('Se avisó a 2 clientes.');
    expect(await direccionesAbiertas(page)).toHaveLength(2);
    const marcadas = (await notasGuardadas(page)).filter((n) => n.avisadaEl).map((n) => n.folio).sort();
    expect(marcadas).toEqual(['20', '21']);
    await expect(numero(page, 'Por avisar')).toHaveText('0');
  });

  test('saltar deja al cliente sin avisar', async ({ page }) => {
    await abrirLimpia(page);
    await sembrar(page, dosParaAvisar());
    await espiarOpen(page);
    await irA(page, 'hoy');
    await tarjeta(page, 'Por avisar').getByRole('button').click();
    await expect(page.locator('#modalCola')).toBeVisible();
    await page.getByRole('button', { name: 'Saltar' }).click();
    await expect(page.locator('#colaTarjeta')).toContainText('21 · Beto Ruiz');
    await page.getByRole('button', { name: 'Abrir WhatsApp' }).click();
    await expect(page.locator('#modalCola')).toBeHidden();
    await expect(page.locator('#textoAviso')).toHaveText('Se avisó a 1 cliente.');
    const sin = (await notasGuardadas(page)).filter((n) => !n.avisadaEl).map((n) => n.folio);
    expect(sin).toEqual(['20']);
  });

  test('si WhatsApp no abre, se queda en el mismo cliente', async ({ page }) => {
    await abrirLimpia(page);
    await sembrar(page, dosParaAvisar());
    await page.evaluate(() => { window.open = () => null; });             // el navegador lo bloqueó
    await irA(page, 'hoy');
    await tarjeta(page, 'Por avisar').getByRole('button').click();
    await expect(page.locator('#modalCola')).toBeVisible();
    await page.getByRole('button', { name: 'Abrir WhatsApp' }).click();
    await expect(page.locator('#textoAviso')).toHaveText('No se pudo abrir WhatsApp.');
    await expect(page.locator('#colaProgreso')).toHaveText('1 de 2');
    expect((await notasGuardadas(page)).filter((n) => n.avisadaEl)).toHaveLength(0);
  });

  test('desde la lista de entregas también se avisa a todos', async ({ page }) => {
    await abrirLimpia(page);
    await sembrar(page, dosParaAvisar());
    await irA(page, 'tablero');
    await page.click('#modoLista');
    await page.getByRole('button', { name: 'Avisarles (2)' }).click();
    await expect(page.locator('#modalCola')).toBeVisible();
    await expect(page.locator('#colaProgreso')).toHaveText('1 de 2');
  });

  test('cerrar a la mitad deja lo avisado como está', async ({ page }) => {
    await abrirLimpia(page);
    await sembrar(page, dosParaAvisar());
    await espiarOpen(page);
    await irA(page, 'hoy');
    await tarjeta(page, 'Por avisar').getByRole('button').click();
    await expect(page.locator('#modalCola')).toBeVisible();
    await page.getByRole('button', { name: 'Abrir WhatsApp' }).click();
    await page.locator('#modalCola .modal-footer').getByRole('button', { name: 'Cerrar' }).click();
    await expect(page.locator('#modalCola')).toBeHidden();
    expect((await notasGuardadas(page)).filter((n) => n.avisadaEl)).toHaveLength(1);
    await expect(numero(page, 'Por avisar')).toHaveText('1');
  });
});
