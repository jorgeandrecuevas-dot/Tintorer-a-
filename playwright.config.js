// Las pruebas corren la aplicación de verdad en un navegador, en tres tamaños:
// el teléfono, el iPad y la computadora. No hay nada que compilar.
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'pruebas',
  timeout: 40000,
  expect: { timeout: 6000 },
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:8766',
    serviceWorkers: 'block',
    locale: 'es-MX',
    timezoneId: 'America/Mexico_City',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'python3 -m http.server 8766 --bind 127.0.0.1',
    url: 'http://127.0.0.1:8766/index.html',
    reuseExistingServer: true,
  },
  projects: [
    // Las cuentas puras se prueban una sola vez, sin navegador
    { name: 'unidades',    testMatch: /unidades\.spec/ },
    { name: 'telefono',    testIgnore: /unidades\.spec/, use: { viewport: { width: 390,  height: 850 },  hasTouch: true } },
    { name: 'ipad',        testIgnore: /unidades\.spec/, use: { viewport: { width: 820,  height: 1180 }, hasTouch: true } },
    { name: 'computadora', testIgnore: /unidades\.spec/, use: { viewport: { width: 1440, height: 950 } } },
  ],
});
