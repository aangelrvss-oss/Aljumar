/**
 * Capturas de revisión visual de la web compilada (no son maquetas).
 *
 *   node scripts/qa-screenshots.ts <carpeta-salida> [ruta ...]
 *
 * Variables:
 *   BASE_URL       servidor a capturar (por defecto http://localhost:4321)
 *   QA_PHOTOS_DIR  carpeta con fotos <cod_ofer>.jpg que sustituyen a las de
 *                  Inmovilla cuando el entorno no tiene acceso a su CDN. Solo
 *                  para revisión; si no se indica, se usa un marcador gris.
 *   QA_BROKEN=1    simula que las fotos externas fallan (prueba de fallback).
 *   QA_REDUCED=1   emula prefers-reduced-motion.
 *   QA_FULL=0      solo el primer viewport.
 */
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const [out = 'qa-shots', ...routes] = process.argv.slice(2);
const pages = routes.length ? routes : ['/'];
const BASE = process.env.BASE_URL ?? 'http://localhost:4321';
const photos = process.env.QA_PHOTOS_DIR;
const broken = process.env.QA_BROKEN === '1';
const full = process.env.QA_FULL !== '0';
mkdirSync(out, { recursive: true });

const grey = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="100%" height="100%" fill="#8fa3b5"/></svg>`;
const viewports = [
  { name: 'escritorio', width: 1440, height: 900 },
  { name: 'movil', width: 390, height: 844 },
];

const browser = await chromium.launch();
for (const vp of viewports) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
    reducedMotion: process.env.QA_REDUCED === '1' ? 'reduce' : 'no-preference',
  });
  await ctx.route(/apinmo\.com|inmovilla\.com/, (route) => {
    if (broken) return route.abort();
    const id = route.request().url().match(/\/\d+\/(\d+)\//)?.[1];
    const file = photos && id ? join(photos, `${id}.jpg`) : '';
    if (file && existsSync(file)) return route.fulfill({ contentType: 'image/jpeg', body: readFileSync(file) });
    return route.fulfill({ contentType: 'image/svg+xml', body: grey });
  });
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  for (const p of pages) {
    await page.goto(BASE + p, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200); // deja terminar las animaciones de entrada
    if (full) {
      // Recorre la página como un usuario para disparar las apariciones al
      // hacer scroll («instant»: con scroll-behavior: smooth, scrollTo se
      // interrumpiría a sí mismo y la página no llegaría a recorrerse).
      await page.evaluate(async () => {
        for (let y = 0; y < document.documentElement.scrollHeight; y += 500) {
          window.scrollTo({ top: y, behavior: 'instant' });
          await new Promise((r) => setTimeout(r, 120));
        }
        window.scrollTo({ top: 0, behavior: 'instant' });
      });
      await page.waitForTimeout(1500);
      const hidden = await page.locator('[data-motion].is-pending').count();
      if (hidden) console.log(`  ⚠ ${hidden} bloques siguen pendientes de aparecer`);
    }
    const name = `${vp.name}${p === '/' ? '_portada' : p.replace(/\/$/, '').replace(/[/?=&]+/g, '_')}.png`;
    await page.screenshot({ path: join(out, name), fullPage: full });
    console.log(join(out, name));
  }
  if (errors.length) console.log('Errores JS:', errors);
  await ctx.close();
}
await browser.close();
