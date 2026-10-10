import { defineConfig, devices } from '@playwright/test';

/**
 * Pruebas de extremo a extremo contra el sitio compilado (`astro preview`).
 * El formulario se simula con page.route(); el PHP real se prueba con
 * `npm run test:php`. Las fotos del CDN de Inmovilla se sustituyen por una
 * imagen local para no depender de la red.
 */
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:4321';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: BASE_URL, trace: 'off' },
  projects: [
    { name: 'escritorio', use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 900 } } },
    { name: 'movil', use: { ...devices['Pixel 7'] } },
    { name: 'tableta', use: { ...devices['Desktop Chrome'], viewport: { width: 820, height: 1180 }, hasTouch: true } },
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : { command: 'npx astro preview --port 4321', url: BASE_URL, reuseExistingServer: true, timeout: 60_000 },
});
