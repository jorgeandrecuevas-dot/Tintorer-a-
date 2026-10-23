// Saca las capturas del README. Siempre al mismo momento (jueves 22 de octubre
// de 2026, 10 am) para que las fechas no cambien cada vez que se corre.
//   node herramientas/capturas.mjs
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const PUERTO = 8767;
const URL = `http://127.0.0.1:${PUERTO}/index.html`;
const AHORA = new Date('2026-10-22T10:00:00-06:00');
mkdirSync('capturas', { recursive: true });

const servidor = spawn('python3', ['-m', 'http.server', String(PUERTO), '--bind', '127.0.0.1'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 800));

const FOTO = {
  name: 'foto.svg', mimeType: 'image/svg+xml',
  buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="900" height="675"><rect width="900" height="675" fill="#d6dbe2"/><path d="M0 120L900 150M0 260L900 290M0 400L900 430M0 540L900 570" stroke="#00000014" stroke-width="3"/><ellipse cx="450" cy="340" rx="110" ry="80" fill="#8d6e63"/></svg>'),
};

const navegador = await chromium.launch();

async function abrir(ancho, alto, { ejemplos = false } = {}) {
  const contexto = await navegador.newContext({
    viewport: { width: ancho, height: alto }, deviceScaleFactor: 2, hasTouch: ancho < 992,
    locale: 'es-MX', timezoneId: 'America/Mexico_City', serviceWorkers: 'block',
  });
  const pagina = await contexto.newPage();
  await pagina.clock.setFixedTime(AHORA);
  await pagina.goto(URL);
  await pagina.evaluate(() => localStorage.clear());
  await pagina.reload();
  if (ejemplos) { await ir(pagina, 'corte'); await pagina.click('#btnEjemplos'); await pagina.waitForTimeout(300); }
  return { contexto, pagina };
}

const ir = (p, v) => p.evaluate((x) => document.querySelector('.nav-link[data-vista="' + x + '"]').click(), v);

async function quitarAviso(p) {
  await p.evaluate(() => { const a = document.getElementById('avisoGuardado'); if (a) a.classList.remove('show'); });
  await p.waitForTimeout(250);
}

async function capturar(p, archivo, opciones = {}) {
  await quitarAviso(p);
  await p.screenshot({ path: `capturas/${archivo}.png`, ...opciones });
  console.log('->', archivo);
}

async function llenarNota(p, { fotos = 0, firma = false } = {}) {
  await ir(p, 'nota');
  await p.fill('#folio', '0501');
  await p.fill('#nombreCliente', 'Marta Díaz');
  await p.fill('#telCliente', '33 1234 5678');
  await p.fill('#observaciones', 'Le falta un botón en la manga derecha');
  for (const [nombre, cantidad] of [['camisa', 3], ['saco', 1]]) {
    await p.fill('#buscarPrenda', nombre);
    await p.fill('#cantidad', String(cantidad));
    await p.locator('#resultados button').first().click();
  }
  if (fotos) await p.setInputFiles('#tomarFoto', Array(fotos).fill(FOTO));
  if (fotos) await p.waitForTimeout(600);
  if (firma) {
    const caja = await p.locator('#firma').boundingBox();
    await p.mouse.move(caja.x + 40, caja.y + 95);
    await p.mouse.down();
    for (let i = 1; i <= 46; i++) await p.mouse.move(caja.x + 40 + i * (caja.width * 0.013), caja.y + 95 - Math.sin(i / 3.2) * 26 - i * 0.35);
    await p.mouse.up();
  }
}

// ---------- computadora ----------
{
  const { contexto, pagina: p } = await abrir(1440, 900, { ejemplos: true });
  await ir(p, 'hoy');                                  await capturar(p, 'hoy');
  await ir(p, 'tablero');                              await capturar(p, 'tablero');
  await p.click('#modoLista');                         await capturar(p, 'lista');
  await ir(p, 'corte');                                await capturar(p, 'corte', { fullPage: true });
  await ir(p, 'ajustes');                              await capturar(p, 'ajustes');

  // la nota abierta, con su historial
  await ir(p, 'tablero'); await p.click('#modoEtapas');
  await p.locator('.nota-tocable .fw-semibold', { hasText: '0477' }).first().click();
  await p.waitForTimeout(600);
  await p.locator('#edBloqueHistorial summary').click();
  await capturar(p, 'nota-abierta');
  await p.click('#modalNota [data-bs-dismiss="modal"]');
  await p.waitForTimeout(500);

  // entregar: el cliente firma
  await ir(p, 'tablero'); await p.click('#modoLista');
  await p.getByRole('button', { name: 'Cobrar y entregar' }).click();
  await p.waitForTimeout(700);
  const lienzo = await p.locator('#firmaEntrega').boundingBox();
  await p.mouse.move(lienzo.x + 50, lienzo.y + 90);
  await p.mouse.down();
  for (let i = 1; i <= 40; i++) await p.mouse.move(lienzo.x + 50 + i * (lienzo.width * 0.016), lienzo.y + 90 - Math.sin(i / 3) * 24 - i * 0.3);
  await p.mouse.up();
  await capturar(p, 'entrega');
  await contexto.close();
}
{
  const { contexto, pagina: p } = await abrir(1440, 1000);
  await llenarNota(p, { fotos: 4, firma: true });      await capturar(p, 'nota');
  await p.click('#btnGuardar');
  await p.locator('#vista-tablero').waitFor();
  await llenarNota(p);
  await p.fill('#folio', '0502'); await p.fill('#nombreCliente', 'Beto Ruiz');
  await p.click('#btnGuardar');
  await p.locator('#vista-tablero').waitFor();
  await ir(p, 'maquila');
  await p.locator('.casilla-apartada').first().check();
  await capturar(p, 'maquila');
  await contexto.close();
}

// ---------- teléfono ----------
{
  const { contexto, pagina: p } = await abrir(390, 844, { ejemplos: true });
  await ir(p, 'hoy');                                  await capturar(p, 'hoy-telefono');
  await llenarNota(p);                                 await capturar(p, 'nota-telefono');
  await contexto.close();
}

// ---------- iPad vertical ----------
{
  const { contexto, pagina: p } = await abrir(820, 1180, { ejemplos: true });
  await ir(p, 'tablero'); await p.click('#modoLista'); await capturar(p, 'lista-ipad');
  await contexto.close();
}

await navegador.close();
servidor.kill();
