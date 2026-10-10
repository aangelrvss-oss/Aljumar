/**
 * Genera la imagen para compartir en redes (public/og/aljumar.png, 1200×630)
 * a partir de HTML con la tipografía y los colores de la marca. Si existe el
 * logotipo oficial en public/brand/, lo incluye.
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
const logoPath = ['logo-vertical.svg', 'logo-horizontal.jpg', 'logo-vertical.png'].map((f) => resolve(root, 'public/brand', f)).find(existsSync);
const logo = logoPath
  ? `<img src="data:${logoPath.endsWith('svg') ? 'image/svg+xml' : 'image/jpeg'};base64,${readFileSync(logoPath).toString('base64')}" style="height:150px;border-radius:12px">`
  : '<div style="font:800 54px Jakarta;letter-spacing:.06em;color:#fff">ALJUMAR<div style="font:700 20px Jakarta;letter-spacing:.45em;color:#bfd600;margin-top:6px">INMUEBLES</div></div>';

const html = `<!doctype html><html><head><style>
@font-face{font-family:Fraunces;src:url(${font('@fontsource-variable/fraunces', 'fraunces-latin-opsz-normal.woff2')})}
@font-face{font-family:Jakarta;src:url(${font('@fontsource-variable/plus-jakarta-sans', 'plus-jakarta-sans-latin-wght-normal.woff2')})}
body{margin:0;width:1200px;height:630px;background:linear-gradient(120deg,#0f2537,#17354f 60%,#284b6a);color:#e8eef4;font-family:Jakarta;position:relative;overflow:hidden}
.ring{position:absolute;right:-140px;bottom:-200px;width:620px;height:620px;border-radius:50%;border:110px solid rgba(191,214,0,.10)}
.wrap{position:absolute;inset:70px 80px;display:flex;flex-direction:column;justify-content:space-between}
h1{font-family:Fraunces;font-weight:560;font-size:70px;line-height:1.05;margin:0;color:#fff;max-width:880px;letter-spacing:-.01em}
p{margin:0;font-size:28px;font-weight:600}
.bar{display:inline-block;width:60px;height:6px;border-radius:3px;background:#bfd600;margin-bottom:22px}
</style></head><body><div class="ring"></div><div class="wrap"><div>${logo}</div>
<div><span class="bar"></span><h1>Tu inmobiliaria en Moratalaz desde 1998</h1></div>
<p>Compraventa y alquiler · aljumar.es · 91 333 90 83</p></div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
mkdirSync(resolve(root, 'public/og'), { recursive: true });
await page.screenshot({ path: resolve(root, 'public/og/aljumar.png') });
await browser.close();
console.log('✓ public/og/aljumar.png');
