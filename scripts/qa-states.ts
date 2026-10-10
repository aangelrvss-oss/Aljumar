/**
 * Capturas de revisión de estados concretos (no son maquetas): páginas
 * completas y estados interactivos de la web compilada.
 *
 *   node scripts/qa-states.ts <carpeta-salida>
 *
 * Variables: BASE_URL, QA_PHOTOS_DIR (ver scripts/qa-screenshots.ts).
 * Salida en JPEG para que la carpeta de revisión no pese demasiado en Git.
 */
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, type BrowserContext, type Page } from '@playwright/test';
import inventory from '../src/data/inventory.json' with { type: 'json' };

const [out = 'qa-states'] = process.argv.slice(2);
const BASE = process.env.BASE_URL ?? 'http://localhost:4321';
const photos = process.env.QA_PHOTOS_DIR;
mkdirSync(out, { recursive: true });

const grey = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="100%" height="100%" fill="#8fa3b5"/></svg>`;
const detail = inventory.properties.find((p) => p.photos.length > 1) ?? inventory.properties[0]!;
const DESK = { width: 1440, height: 900 };
const MOB = { width: 390, height: 844 };

const browser = await chromium.launch();

async function context(viewport: { width: number; height: number }, opts: { reduced?: boolean; broken?: boolean; js?: boolean } = {}) {
  const ctx = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    reducedMotion: opts.reduced ? 'reduce' : 'no-preference',
    javaScriptEnabled: opts.js ?? true,
    hasTouch: viewport.width < 600,
    isMobile: viewport.width < 600,
  });
  await ctx.route(/apinmo\.com|inmovilla\.com/, (route) => {
    if (opts.broken) return route.abort();
    const id = route.request().url().match(/\/\d+\/(\d+)\//)?.[1];
    const file = photos && id ? join(photos, `${id}.jpg`) : '';
    if (file && existsSync(file)) return route.fulfill({ contentType: 'image/jpeg', body: readFileSync(file) });
    return route.fulfill({ contentType: 'image/svg+xml', body: grey });
  });
  return ctx;
}

/** Recorre la página para que las apariciones al hacer scroll terminen. */
async function settle(page: Page) {
  await page.waitForTimeout(1300);
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 500) {
      window.scrollTo({ top: y, behavior: 'instant' });
      await new Promise((r) => setTimeout(r, 100));
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  await page.waitForTimeout(1400);
}

async function shot(page: Page, name: string, full = false) {
  const path = join(out, `${name}.jpg`);
  await page.screenshot({ path, fullPage: full, type: 'jpeg', quality: 78 });
  console.log(path);
}

async function scene(name: string, viewport: { width: number; height: number }, run: (page: Page, ctx: BrowserContext) => Promise<void>, opts = {}) {
  const ctx = await context(viewport, opts);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log(`  ✗ ${name}: ${e.message}`));
  try {
    await run(page, ctx);
  } catch (e) {
    console.log(`  ✗ ${name}: ${(e as Error).message.split('\n')[0]}`);
  }
  await ctx.close();
}

const go = (page: Page, path: string) => page.goto(BASE + path, { waitUntil: 'networkidle' });

// --- Páginas completas ---
const pages: [string, string][] = [
  ['portada', '/'],
  ['comprar', '/comprar/'],
  ['ficha', `/inmueble/${detail.slug}/`],
  ['vender', '/vender-mi-vivienda/'],
  ['sobre', '/sobre-aljumar/'],
  ['contacto', '/contacto/'],
  ['blog', '/consejos-inmobiliarios/'],
  ['articulo', '/check-list-de-los-documentos-que-necesitas-para-vender-tu-propiedad/'],
  ['legal', '/politica-privacidad/'],
  ['404', '/no-existe/'],
  ['410', '/inmueble-no-disponible/'],
];
for (const [vpName, vp] of [
  ['escritorio', DESK],
  ['movil', MOB],
] as const) {
  await scene(`${vpName}-paginas`, vp, async (page) => {
    for (const [name, path] of pages) {
      await go(page, path);
      await settle(page);
      await shot(page, `${vpName}_${name}`, true);
    }
  });
}

// --- Presentación de marca: fotogramas a 150 ms y 500 ms, y estado final ---
for (const [vpName, vp] of [
  ['escritorio', DESK],
  ['movil', MOB],
] as const) {
  await scene(`${vpName}-intro`, vp, async (page) => {
    await page.goto(BASE + '/', { waitUntil: 'commit' });
    await page.waitForTimeout(150);
    await shot(page, `${vpName}_presentacion-150ms`);
    await page.waitForTimeout(350);
    await shot(page, `${vpName}_presentacion-500ms`);
    await page.waitForTimeout(1200);
    await shot(page, `${vpName}_presentacion-final`);
  });
}

// --- Buscador ---
await scene('filtros', DESK, async (page) => {
  await go(page, '/comprar/?precio_max=500000&dormitorios=2');
  await page.waitForTimeout(900);
  await shot(page, 'escritorio_comprar-filtrado');
  await page.locator('[data-more-toggle]').click();
  await page.waitForTimeout(500);
  await shot(page, 'escritorio_comprar-mas-filtros');
  await go(page, '/comprar/?precio_max=100000&dormitorios=4');
  await page.waitForTimeout(900);
  await shot(page, 'escritorio_comprar-sin-resultados');
});
await scene('filtros-movil', MOB, async (page) => {
  await go(page, '/comprar/');
  await page.getByRole('button', { name: /Filtros/ }).click();
  await page.waitForTimeout(600);
  await shot(page, 'movil_comprar-panel-filtros');
});

// --- Ficha: galería y visor ---
await scene('galeria', DESK, async (page) => {
  await go(page, `/inmueble/${detail.slug}/`);
  await page.waitForTimeout(1200);
  await page.locator('[data-step="1"]').click();
  await page.waitForTimeout(700);
  await shot(page, 'escritorio_ficha-galeria-foto2');
  await page.getByRole('button', { name: /Ver las \d+ fotografías/ }).click();
  await page.waitForTimeout(700);
  await shot(page, 'escritorio_ficha-visor');
});
await scene('galeria-tableta', { width: 820, height: 1180 }, async (page) => {
  await go(page, `/inmueble/${detail.slug}/`);
  await settle(page);
  await shot(page, 'tableta_ficha', true);
});
await scene('visor-movil', MOB, async (page) => {
  await go(page, `/inmueble/${detail.slug}/`);
  await page.waitForTimeout(1200);
  await page.getByRole('button', { name: /Ver las \d+ fotografías/ }).click();
  await page.waitForTimeout(700);
  await shot(page, 'movil_ficha-visor');
});

// --- Menú móvil ---
await scene('menu', MOB, async (page) => {
  await go(page, '/');
  await page.waitForTimeout(1800);
  await page.getByRole('button', { name: 'Abrir menú' }).click();
  await page.waitForTimeout(800);
  await shot(page, 'movil_menu-abierto');
});

// --- Formularios: errores, enviando y enviado (envío simulado) ---
await scene('formulario', DESK, async (page) => {
  await page.route('**/api/contacto.php', async (r) => {
    await new Promise((res) => setTimeout(res, 1500));
    await r.fulfill({ json: { ok: true } });
  });
  await go(page, '/contacto/');
  await page.waitForTimeout(1200);
  const form = page.locator('#formulario');
  await form.getByRole('button', { name: 'Enviar mensaje' }).click();
  await page.waitForTimeout(400);
  await shot(page, 'escritorio_formulario-errores');
  await form.getByLabel('Nombre y apellidos').fill('Ana Prueba');
  await form.getByLabel('Correo electrónico').fill('ana@example.com');
  await form.locator('textarea[name="mensaje"]').fill('Hola, quiero información.');
  await form.getByRole('checkbox', { name: /política de privacidad/ }).check();
  await form.getByRole('button', { name: 'Enviar mensaje' }).click();
  await page.waitForTimeout(500);
  await shot(page, 'escritorio_formulario-enviando');
  await page.waitForTimeout(1800);
  await shot(page, 'escritorio_formulario-enviado');
});

// --- Movimiento reducido, sin JavaScript y fotos que fallan ---
await scene('reducido', DESK, async (page) => {
  await go(page, '/');
  await page.waitForTimeout(300);
  await shot(page, 'escritorio_portada-movimiento-reducido');
}, { reduced: true });
await scene('sin-js', MOB, async (page) => {
  await go(page, '/comprar/');
  await shot(page, 'movil_comprar-sin-javascript', true);
}, { js: false });
await scene('fotos-rotas', DESK, async (page) => {
  await go(page, '/');
  await settle(page);
  await shot(page, 'escritorio_portada-fotos-fallidas', true);
  await go(page, `/inmueble/${detail.slug}/`);
  await page.waitForTimeout(1200);
  await shot(page, 'escritorio_ficha-fotos-fallidas');
}, { broken: true });

await browser.close();
