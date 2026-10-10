import { test as base, expect, type Page } from '@playwright/test';

const PHOTO = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="100%" height="100%" fill="#8aa1b5"/></svg>`;

/** Página con las fotos de Inmovilla simuladas y registro de errores de consola. */
export const test = base.extend<{ page: Page; consoleErrors: string[] }>({
  consoleErrors: async ({}, use) => {
    await use([]);
  },
  page: async ({ page, consoleErrors }, use) => {
    // Sin animaciones: el contenido se analiza en su estado final.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.route(/apinmo\.com|inmovilla\.com/, (r) => r.fulfill({ contentType: 'image/svg+xml', body: PHOTO }));
    page.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(m.text());
    });
    page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));
    await use(page);
  },
});

export { expect };

export async function noHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, 'desbordamiento horizontal (px)').toBeLessThanOrEqual(1);
}

export const isMobile = (page: Page) => (page.viewportSize()?.width ?? 1366) < 960;
