/**
 * Descarga de la web antigua (aljumar.es, WordPress) los medios que usa la
 * nueva web, ANTES de retirar WordPress:
 *
 *   - logotipos originales     → public/brand/logo-vertical.svg, logo-horizontal.jpg
 *   - icono del sitio          → public/favicon.png
 *   - fotos del equipo         → public/wp-content/uploads/… (misma ruta que hoy)
 *   - imágenes de los artículos→ public/wp-content/uploads/… (misma ruta que hoy)
 *
 *   npm run media:fetch            # descarga lo que falte
 *   npm run media:fetch -- --force # vuelve a descargarlo todo
 *
 * Conservar la ruta /wp-content/uploads/… mantiene válidas las URL de imagen
 * ya indexadas por Google Imágenes. Requiere acceso a https://aljumar.es
 * (el entorno de desarrollo en la nube no lo tiene: ejecutarlo en local o en CI).
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import settings from '../src/data/settings.json' with { type: 'json' };

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = process.env.LEGACY_ORIGIN ?? 'https://aljumar.es';
const force = process.argv.includes('--force');

const jobs: { url: string; dest: string }[] = [
  { url: '/wp-content/uploads/2026/06/Aljumar_Inmuebles_V-FONDO.svg', dest: 'public/brand/logo-vertical.svg' },
  { url: '/wp-content/uploads/2026/05/Aljumar_Inmuebles_H-FONDO_www.jpg', dest: 'public/brand/logo-horizontal.jpg' },
  { url: '/wp-content/uploads/2026/05/cropped-Aljumar_WWW_Vpeq-1-2-270x270.png', dest: 'public/favicon.png' },
];

for (const m of settings.team) {
  if (m.photo?.startsWith('/wp-content/')) jobs.push({ url: m.photo, dest: `public${m.photo}` });
}

const blogDir = resolve(root, 'src/content/blog');
for (const f of readdirSync(blogDir)) {
  const fm = readFileSync(resolve(blogDir, f), 'utf8').match(/^image:\s*"?([^"\n]+)"?/m);
  const img = fm?.[1];
  if (img?.startsWith('/wp-content/')) jobs.push({ url: img, dest: `public${img}` });
}

const unique = [...new Map(jobs.map((j) => [j.dest, j])).values()];
let ok = 0;
let skipped = 0;
const failed: string[] = [];

for (const job of unique) {
  const dest = resolve(root, job.dest);
  if (existsSync(dest) && !force) {
    skipped++;
    continue;
  }
  try {
    const res = await fetch(new URL(job.url, ORIGIN), { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const type = res.headers.get('content-type') ?? '';
    if (!/^image\//.test(type)) throw new Error(`tipo inesperado: ${type}`);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
    ok++;
  } catch (e) {
    failed.push(`${job.url} (${String(e)})`);
  }
}

console.log(`✓ Medios: ${ok} descargados, ${skipped} ya existían, ${failed.length} con error.`);
if (failed.length) {
  console.error(failed.map((f) => `  ✗ ${f}`).join('\n'));
  process.exitCode = 1;
}
