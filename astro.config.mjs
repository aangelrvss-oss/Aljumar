// @ts-check
import { readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// URL pública: canonical, Open Graph, sitemap y robots.txt.
// Para una previsualización en otro dominio: SITE_URL=https://staging.example npm run build
const SITE_URL = process.env.SITE_URL || 'https://aljumar.es';

// Las páginas de listado sin inmuebles se marcan noindex: tampoco van al sitemap.
const inventory = JSON.parse(readFileSync(new URL('./src/data/inventory.json', import.meta.url), 'utf8'));
const hasOp = (/** @type {string} */ op) => inventory.properties.some((/** @type {any} */ p) => p.operations.includes(op));
const excluded = [
  '/contacto/enviado/',
  '/inmueble-no-disponible/',
  '/404',
  ...(hasOp('alquiler') ? [] : ['/alquilar/']),
  ...(hasOp('traspaso') ? [] : ['/traspasos/']),
];

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'always',
  build: { format: 'directory' },
  compressHTML: true,
  integrations: [
    sitemap({
      filter: (page) => !excluded.some((path) => new URL(page).pathname.startsWith(path)),
      changefreq: 'weekly',
    }),
  ],
});
