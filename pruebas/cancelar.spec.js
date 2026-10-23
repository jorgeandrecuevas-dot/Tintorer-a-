// Cancelar en lugar de borrar, el historial de cada nota y el cuadro de «¿seguro?».
import { test, expect, abrirLimpia, irA, capturarNota, notasGuardadas, cargarEjemplos, confirmarCuadro, esperarCuadro } from './ayuda.js';

const abrirPrimera = async (page) => {
  await irA(page, 'tablero');
  await page.locator('.nota-tocable .fw-semibold').first().click();
  await expect(page.locator('#modalNota')).toBeVisible();
};

const cancelar = async (page, opciones = {}) => {
  await page.click('#btnCancelarNota');
  await confirmarCuadro(page, opciones);
};

test.beforeEach(async ({ page }) => {
  await abrirLimpia(page);
  await capturarNota(page, { folio: '0100', cliente: 'Marta Díaz', cantidad: 3 });   // $210, deja $105
});

test('cancelar pide el motivo, saca la nota de las columnas y la deja guardada', async ({ page }) => {
  await abrirPrimera(page);
  await cancelar(page, { motivo: 'Se arrepintió' });
  await expect(page.locator('#textoAviso')).toHaveText('Nota 0100 cancelada.');

  const [n] = await notasGuardadas(page);
  expect(n).toMatchObject({ cancelada: true, motivo: 'Se arrepintió' });
  expect(n.canceladaEl).toBeTruthy();

  await expect(page.locator('#columnas .nota-tocable')).toHaveCount(0);
  await expect(page.locator('#cajaCanceladas')).toContainText('Canceladas (1)');
  await expect(page.locator('#cajaCanceladas')).toContainText('0100 · Marta Díaz');
  await expect(page.locator('#cajaCanceladas')).toContainText('Se arrepintió');
});

test('si se devolvió lo cobrado, el corte no lo cuenta; si no, se queda', async ({ page }) => {
  await abrirPrimera(page);
  await cancelar(page, { motivo: 'Error', devolver: true });
  // la nota se guarda cuando el cuadro termina de cerrarse
  await expect.poll(async () => (await notasGuardadas(page))[0].pagos.length).toBe(2);
  let [n] = await notasGuardadas(page);
  expect(n.pagos.map((p) => [p.tipo, p.monto])).toEqual([['anticipo', 105], ['devolucion', -105]]);
  expect(n.pagado).toBe(0);
  await irA(page, 'corte');
  await expect(page.locator('#cFacturado')).toHaveText('$0');
  await expect(page.locator('#cCobrado')).toHaveText('$0');
  await expect(page.locator('#tablaCorte')).toContainText('Cancelada');

  // otra nota: aquí no se devuelve
  await capturarNota(page, { folio: '0101', cliente: 'Beto', cantidad: 2 });          // deja $70
  await abrirPrimera(page);
  await cancelar(page, { motivo: 'No vino' });
  await irA(page, 'corte');
  await expect(page.locator('#cCobrado')).toHaveText('$70');
  await expect(page.locator('#cFacturado')).toHaveText('$0');
  await expect(page.locator('#cPorCobrar')).toHaveText('$0');           // una cancelada no se debe
});

test('la casilla de devolver solo sale si había algo cobrado', async ({ page }) => {
  await irA(page, 'nota');
  await page.fill('#folio', '0102');
  await page.fill('#buscarPrenda', 'camisa');
  await page.locator('#resultados button').first().click();
  await page.click('#atajoNada');
  await page.click('#btnGuardar');
  await expect.poll(async () => (await notasGuardadas(page)).length).toBe(2);
  await abrirPrimera(page);
  await page.click('#btnCancelarNota');
  await esperarCuadro(page);
  await expect(page.locator('#bloqueCasilla')).toBeHidden();
  await expect(page.locator('#bloqueMotivo')).toBeVisible();
});

test('decir que no deja la nota como estaba y vuelve a abrirla', async ({ page }) => {
  await abrirPrimera(page);
  await page.click('#btnCancelarNota');
  await esperarCuadro(page);
  await page.getByRole('button', { name: 'No', exact: true }).click();
  await expect(page.locator('#modalConfirmar')).toBeHidden();
  await expect(page.locator('#modalNota')).toBeVisible();
  expect((await notasGuardadas(page))[0].cancelada).toBeFalsy();
});

test('Escape también es decir que no', async ({ page }) => {
  await abrirPrimera(page);
  await page.click('#btnCancelarNota');
  await esperarCuadro(page);
  await page.keyboard.press('Escape');
  await expect(page.locator('#modalConfirmar')).toBeHidden();
  expect((await notasGuardadas(page))[0].cancelada).toBeFalsy();
});

test('una cancelada se abre, dice por qué y se reactiva', async ({ page }) => {
  await abrirPrimera(page);
  await cancelar(page, { motivo: 'Error de captura' });
  await page.locator('#cajaCanceladas .nota-tocable').click();
  await expect(page.locator('#modalNota')).toBeVisible();
  await expect(page.locator('#edBannerCancelada')).toContainText('Motivo: Error de captura');
  await expect(page.locator('#btnCancelarNota')).toHaveText('Reactivar nota');

  await page.click('#btnCancelarNota');
  await expect(page.locator('#textoAviso')).toHaveText('Nota 0100 reactivada.');
  await expect(page.locator('#edBannerCancelada')).toBeHidden();
  await expect(page.locator('#btnCancelarNota')).toHaveText('Cancelar nota');
  const [n] = await notasGuardadas(page);
  expect(n.cancelada).toBe(false);
  expect(n.motivo).toBeUndefined();
  await page.click('#modalNota [data-bs-dismiss="modal"]');
  await expect(page.locator('#columnas .nota-tocable')).toHaveCount(1);
});

test('una nota cancelada no estorba en Maquila, en el aviso de sin recoger ni al repetir el número', async ({ page }) => {
  await abrirPrimera(page);
  await cancelar(page, { motivo: 'Error' });
  await irA(page, 'maquila');
  await expect(page.locator('#contadorEnvio')).toHaveText('0 notas');
  await expect(page.locator('#envioSale')).toHaveText('No hay ropa por enviar.');

  await irA(page, 'nota');
  await page.fill('#folio', '0100');                                   // el mismo número de la cancelada
  await expect(page.locator('#avisoFolio')).toBeHidden();
});

test('con todas las notas canceladas el tablero sigue mostrando sus columnas', async ({ page }) => {
  await abrirPrimera(page);
  await cancelar(page, { motivo: 'Error' });
  await expect(page.locator('#sinResultadosNota')).toBeHidden();
  await expect(page.locator('#columnas')).toBeVisible();
});

test.describe('el historial de la nota', () => {
  test('cuenta lo que fue pasando, de lo más nuevo a lo más viejo', async ({ page }) => {
    await irA(page, 'maquila');
    await page.click('#btnEnviar');
    await abrirPrimera(page);
    await page.fill('#edCliente', 'Marta Ruiz');
    await page.fill('#edRecibido', '150');
    await page.click('#btnGuardarNota');
    await expect(page.locator('#modalNota')).toBeHidden();

    await abrirPrimera(page);
    await page.locator('#edBloqueHistorial summary').click();
    const lineas = await page.$$eval('#edHistorial li', (l) => l.map((x) => x.textContent.replace(/\s+/g, ' ').trim().replace(/^\S+ \d+ \S+ \d\d:\d\d /, '')));
    expect(lineas).toEqual([
      'Pago de $45 (ajuste)',
      'Corrigió el cliente: Marta Díaz → Marta Ruiz',
      'Pasó a En maquila',
      'Nota levantada',
    ]);
  });

  test('las notas viejas empiezan su historial el día que se levantaron', async ({ page }) => {
    const [n] = await notasGuardadas(page);
    expect(n.historial).toHaveLength(1);
    await page.evaluate(() => {
      const notas = JSON.parse(localStorage.getItem('tintoreria.notas'));
      delete notas[0].historial;
      localStorage.setItem('tintoreria.notas', JSON.stringify(notas));
    });
    await page.reload();
    const [vieja] = await notasGuardadas(page);
    expect(vieja.historial).toEqual([{ f: vieja.creada, t: 'Nota levantada' }]);
  });

  test('avisarle por WhatsApp queda anotado', async ({ page }) => {
    await page.evaluate(() => {
      const notas = JSON.parse(localStorage.getItem('tintoreria.notas'));
      notas[0].estatus = 'lista'; notas[0].telefono = '33 1234 5678'; notas[0].listaDesde = new Date().toISOString();
      localStorage.setItem('tintoreria.notas', JSON.stringify(notas));
    });
    await page.reload();
    await irA(page, 'tablero');
    await page.evaluate(() => { window.open = () => ({}); });
    await page.getByRole('button', { name: 'Avisarle' }).click();
    const [n] = await notasGuardadas(page);
    expect(n.historial.at(-1).t).toBe('Se le avisó por WhatsApp');
  });

  test('si hay nombre de quien atiende, queda en cada anotación', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('tintoreria.quien', 'Ana'));
    await page.reload();
    await irA(page, 'maquila');
    await page.click('#btnEnviar');
    const [n] = await notasGuardadas(page);
    expect(n.historial.at(-1)).toMatchObject({ t: 'Pasó a En maquila', q: 'Ana' });
    await abrirPrimera(page);
    await page.locator('#edBloqueHistorial summary').click();
    await expect(page.locator('#edHistorial li').first()).toContainText('· Ana');
  });

  test('el historial no pasa de 60 anotaciones', async ({ page }) => {
    await page.evaluate(() => {
      const notas = JSON.parse(localStorage.getItem('tintoreria.notas'));
      notas[0].historial = Array.from({ length: 60 }, (_, i) => ({ f: new Date().toISOString(), t: 'vieja ' + i }));
      localStorage.setItem('tintoreria.notas', JSON.stringify(notas));
    });
    await page.reload();
    await irA(page, 'maquila');
    await page.click('#btnEnviar');
    const [n] = await notasGuardadas(page);
    expect(n.historial).toHaveLength(60);
    expect(n.historial[0].t).toBe('vieja 1');           // la más vieja se fue
    expect(n.historial.at(-1).t).toBe('Pasó a En maquila');
  });
});

test.describe('el cuadro de «¿seguro?»', () => {
  test('borrar todo no borra nada si se dice que no', async ({ page }) => {
    await cargarEjemplos(page);
    await irA(page, 'corte');
    await page.click('#btnBorrarTodo');
    await esperarCuadro(page);
    await expect(page.locator('#textoConfirmar')).toContainText('5 notas');
    await page.getByRole('button', { name: 'No', exact: true }).click();
    await expect(page.locator('#modalConfirmar')).toBeHidden();
    expect(await notasGuardadas(page)).toHaveLength(5);
  });

  test('el mismo cuadro sirve varias veces seguidas', async ({ page }) => {
    await irA(page, 'corte');
    for (let i = 0; i < 2; i++) {
      await page.click('#btnBorrarTodo');
      await esperarCuadro(page);
      await page.getByRole('button', { name: 'No', exact: true }).click();
      await expect(page.locator('#modalConfirmar')).toBeHidden();
    }
    await page.click('#btnBorrarTodo');
    await confirmarCuadro(page);
    await expect.poll(async () => (await notasGuardadas(page)).length).toBe(0);
  });
});
