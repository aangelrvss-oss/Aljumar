/**
 * Genera la imagen para compartir en redes (public/og/aljumar.png, 1200×630)
 * a partir de HTML con la tipografía, los colores y el logotipo original de la
 * marca (public/brand/logo-vertical.png).
 *
 *   node scripts/make-og.ts
 */
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const font = (pkg: string, file: string) =>
  `data:font/woff2;base64,${readFileSync(resolve(root, 'node_modules', pkg, 'files', file)).toString('base64')}`;
const logoPath = ['logo-vertical.svg', 'logo-vertical.png'].map((f) => resolve(root, 'public/brand', f)).find(existsSync);
const logo = logoPath
  ? `<img src="data:${logoPath.endsWith('svg') ? 'image/svg+xml' : 'image/png'};base64,${readFileSync(logoPath).toString('base64')}" style="height:190px">`
  : '<div style="font:800 54px Jakarta;letter-spacing:.06em;color:#fff">ALJUMAR<div style="font:700 20px Jakarta;letter-spacing:.45em;color:#bfd600;margin-top:6px">INMUEBLES</div></div>';

const html = `<!doctype html><html><head><style>
@font-face{font-family:Fraunces;src:url(${font('@fontsource-variable/fraunces', 'fraunces-latin-opsz-normal.woff2')})}
@font-face{font-family:Fraunces;font-style:italic;src:url(${font('@fontsource-variable/fraunces', 'fraunces-latin-opsz-italic.woff2')})}
@font-face{font-family:Jakarta;src:url(${font('@fontsource-variable/plus-jakarta-sans', 'plus-jakarta-sans-latin-wght-normal.woff2')})}
body{margin:0;width:1200px;height:630px;background:#17354f;color:#c9d6e2;font-family:Jakarta;display:grid;grid-template-columns:330px 1fr}
.brand{display:grid;place-items:center;border-right:1px solid rgba(255,255,255,.14)}
.copy{padding:84px 80px;display:flex;flex-direction:column;justify-content:space-between}
.label{display:flex;align-items:center;gap:16px;font-size:18px;font-weight:650;letter-spacing:.2em;text-transform:uppercase;color:#bfd600}
.label:before{content:'';width:40px;height:1px;background:currentColor}
h1{font-family:Fraunces;font-weight:380;font-variation-settings:'opsz' 144;font-size:76px;line-height:1.02;letter-spacing:-.02em;margin:0;color:#fff}
h1 em{font-weight:340;color:#bfd600}
p{margin:0;font-size:24px;font-weight:550}
</style></head><body><div class="brand">${logo}</div><div class="copy">
<div class="label">Moratalaz, Madrid · desde 1998</div>
<h1>Tu casa en Madrid, en manos de <em>quien conoce el barrio</em>.</h1>
<p>Compraventa y alquiler · aljumar.es · 91 333 90 83</p></div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
mkdirSync(resolve(root, 'public/og'), { recursive: true });
await page.screenshot({ path: resolve(root, 'public/og/aljumar.png') });
await browser.close();
