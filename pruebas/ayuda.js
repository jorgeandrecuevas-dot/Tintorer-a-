// Lo que usan todas las pruebas: abrir la aplicación en blanco, moverse entre
// pantallas, capturar una nota y firmar.
import { test as base, expect } from '@playwright/test';

// Todas las pruebas usan esta versión de test: si la página lanza un error de
// JavaScript, la prueba falla aunque lo demás haya salido bien.
export const test = base.extend({
  page: async ({ page }, use) => {
    const errores = [];
    page.on('pageerror', (e) => errores.push(e.message));
    await use(page);
    expect(errores, 'errores de JavaScript en la página').toEqual([]);
  },
});
export { expect };

export const VISTAS = ['hoy', 'nota', 'tablero', 'maquila', 'corte', 'ajustes'];

// Abre la aplicación sin nada guardado. Se borra y se recarga: así la prueba
// ve lo mismo que vería quien la abre por primera vez.
export async function abrirLimpia(page, opciones = {}) {
  if (opciones.antes) await page.addInitScript(opciones.antes);
  await page.goto('/index.html');
  await page.evaluate(async () => {
    localStorage.clear();
    if (window.indexedDB) {
      await new Promise((ok) => {
        const p = indexedDB.deleteDatabase('tintoreria');
        p.onsuccess = p.onerror = p.onblocked = () => ok();
      });
    }
  });
  await page.reload();
  await page.waitForLoadState('load');
}

// Se va a una pantalla por su atributo, sin depender de cuál menú se ve en
// cada tamaño de pantalla.
export async function irA(page, vista) {
  await page.evaluate((v) => {
    document.querySelector('.nav-link[data-vista="' + v + '"]').click();
  }, vista);
  await expect(page.locator('#vista-' + vista)).toBeVisible();
}

// Busca una prenda, pone la cantidad y la agrega
export async function agregarPrenda(page, nombre, cantidad = 1) {
  await page.fill('#buscarPrenda', nombre);
  await page.fill('#cantidad', String(cantidad));
  await page.locator('#resultados button').first().click();
}

// Traza una firma con el dedo sobre un lienzo
export async function firmar(page, lienzo) {
  await page.locator(lienzo).scrollIntoViewIfNeeded();
  const caja = await page.locator(lienzo).boundingBox();
  await page.mouse.move(caja.x + 30, caja.y + 70);
  await page.mouse.down();
  for (let i = 1; i <= 20; i++) {
    await page.mouse.move(caja.x + 30 + i * 8, caja.y + 70 - i * 1.5);
  }
  await page.mouse.up();
}

// El campo para pegar la dirección de una foto viene plegado: se abre
export async function abrirDireccion(page) {
  await page.evaluate(() => { document.getElementById('detallesUrl').open = true; });
}

// Levanta una nota completa. Deja la aplicación en el tablero.
export async function capturarNota(page, { folio, cliente = 'Cliente', telefono = '', prenda = 'camisa', cantidad = 1, observaciones = '', firma = false, fotos = 0 }) {
  await irA(page, 'nota');
  await page.fill('#folio', folio);
  await page.fill('#nombreCliente', cliente);
  if (telefono) await page.fill('#telCliente', telefono);
  if (observaciones) await page.fill('#observaciones', observaciones);
  await agregarPrenda(page, prenda, cantidad);
  for (let i = 0; i < fotos; i++) {
    await abrirDireccion(page);
    await page.fill('#urlFoto', 'icono.svg');
    await page.click('#btnAgregar');
  }
  if (firma) await firmar(page, '#firma');
  await page.click('#btnGuardar');
  await expect(page.locator('#vista-tablero')).toBeVisible();
}

// Las notas tal como están guardadas en la tablet
export const notasGuardadas = (page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('tintoreria.notas') || '[]'));

// Hace que window.open anote la dirección en lugar de abrir otra pestaña
export async function espiarOpen(page) {
  await page.evaluate(() => {
    window.__abiertas = [];
    window.open = (url) => { window.__abiertas.push(url); return {}; };
  });
}
export const direccionesAbiertas = (page) => page.evaluate(() => window.__abiertas);

// Hace que window.print solo cuente las veces
export async function espiarPrint(page) {
  await page.evaluate(() => { window.__impreso = 0; window.print = () => { window.__impreso++; }; });
}

export const textoDelAviso = (page) => page.locator('#textoAviso').textContent();

// El cuadro de «¿seguro?» de la aplicación: se llena el motivo si lo pide y se acepta
export async function confirmarCuadro(page, { motivo, devolver } = {}) {
  const cuadro = page.locator('#modalConfirmar');
  await expect(cuadro).toBeVisible();
  await expect(page.locator('#btnSiConfirmar')).toBeEnabled();     // ya terminó de abrirse
  if (motivo) await page.fill('#motivoConfirmar', motivo);
  if (devolver) await page.check('#casillaConfirmar');
  await page.click('#btnSiConfirmar');
  await expect(cuadro).toBeHidden();
}

// Mete notas ya armadas, como las dejaría una versión vieja de la aplicación
export async function sembrar(page, notas) {
  await page.evaluate((lista) => {
    localStorage.setItem('tintoreria.notas', JSON.stringify(lista));
  }, notas);
  await page.reload();
  await page.waitForLoadState('load');
}

// Una imagen de 1 píxel, para no inventar fotos
export const PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

// Una foto falsa para el campo de la cámara
export const FOTO = {
  name: 'foto.svg',
  mimeType: 'image/svg+xml',
  buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200"><rect width="1600" height="1200" fill="#c9d2dc"/><circle cx="800" cy="600" r="200" fill="#8d6e63"/></svg>'),
};

// Carga las cuatro notas de ejemplo desde el Corte
export async function cargarEjemplos(page) {
  await irA(page, 'corte');
  await page.click('#btnEjemplos');
  await expect.poll(async () => (await notasGuardadas(page)).length).toBeGreaterThanOrEqual(4);
}

// Espera a que el cuadro de confirmar ya esté abierto del todo
export async function esperarCuadro(page) {
  await expect(page.locator('#modalConfirmar')).toBeVisible();
  await expect(page.locator('#btnSiConfirmar')).toBeEnabled();
}
