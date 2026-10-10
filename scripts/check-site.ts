/**
 * Comprobaciones estáticas sobre dist/ (ejecutar tras `npm run build`):
 *  - cada página: <title>, meta description (50-170 car.), canonical, un único <h1>, lang="es"
 *  - títulos y descripciones no duplicados entre páginas indexables
 *  - enlaces internos que apuntan a páginas existentes
 *  - imágenes con atributo alt
 *  - el sitemap no incluye páginas noindex y sí todas las indexables
 *  - destinos de redirección existentes; ninguna página nueva queda tapada por una redirección
 *  - sin restos de la marca anterior ni del dominio temporal (mialias)
 *  - JSON-LD válido
 * Avisos (no bloquean): logotipo oficial pendiente, medios de la web antigua sin migrar.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCsv } from './gen-redirects.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
if (!existsSync(dist)) {
  console.error('✗ No existe dist/. Ejecuta antes `npm run build`.');
  process.exit(1);
}

const errors: string[] = [];
const warnings: string[] = [];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
const files = walk(dist);
// /admin/ es la aplicación del panel de contenidos (noindex), no una página pública.
const htmlFiles = files.filter((f) => f.endsWith('.html') && !relative(dist, f).startsWith('admin'));
const routeOf = (f: string) => '/' + relative(dist, f).replace(/index\.html$/, '').replace(/\\/g, '/');
const routes = new Set(htmlFiles.map(routeOf));
const exists = (path: string) => {
  const clean = path.split('#')[0]!.split('?')[0]!;
  if (routes.has(clean)) return true;
  return existsSync(join(dist, clean));
};

// Compilación de pruebas (STAGING=1): todo debe estar bloqueado a los buscadores.
const robotsTxt = existsSync(join(dist, 'robots.txt')) ? readFileSync(join(dist, 'robots.txt'), 'utf8') : '';
const staging = /^Disallow: \/$/m.test(robotsTxt);

const titles = new Map<string, string>();
const descs = new Map<string, string>();
const indexable: string[] = [];
const get = (html: string, re: RegExp) => html.match(re)?.[1];

for (const f of htmlFiles) {
  const route = routeOf(f);
  const html = readFileSync(f, 'utf8');
  const is404 = route === '/404.html';
  const title = get(html, /<title>([^<]*)<\/title>/);
  const desc = get(html, /<meta name="description" content="([^"]*)"/);
  const robots = get(html, /<meta name="robots" content="([^"]*)"/) ?? '';
  const noindex = robots.includes('noindex');
  if (staging && !noindex) errors.push(`${route}: compilación de pruebas sin noindex`);
  // En pruebas todas las páginas son noindex: el resto de reglas se evalúan como si no lo fueran.
  const intendedNoindex = staging ? /contacto\/enviado|inmueble-no-disponible|404/.test(route) : noindex;
  if (!/<html lang="es"/.test(html)) errors.push(`${route}: falta lang="es"`);
  if (!title) errors.push(`${route}: sin <title>`);
  if (!desc) errors.push(`${route}: sin meta description`);
  else if (!intendedNoindex && (desc.length < 50 || desc.length > 170)) warnings.push(`${route}: description de ${desc.length} caracteres`);
  if (!is404 && !/<link rel="canonical" href="https:\/\/[^"]+"/.test(html)) errors.push(`${route}: sin canonical absoluto`);
  const h1 = (html.match(/<h1[\s>]/g) ?? []).length;
  if (h1 !== 1) errors.push(`${route}: ${h1} elementos <h1>`);
  if (!intendedNoindex) {
    indexable.push(route);
    if (title && titles.has(title)) errors.push(`${route}: <title> duplicado con ${titles.get(title)}`);
    if (desc && descs.has(desc)) errors.push(`${route}: description duplicada con ${descs.get(desc)}`);
    if (title) titles.set(title, route);
    if (desc) descs.set(desc, route);
  }
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\salt=/.test(m[0])) errors.push(`${route}: imagen sin alt: ${m[0].slice(0, 90)}`);
  }
  for (const m of html.matchAll(/href="(\/[^"]*)"/g)) {
    const href = m[1]!;
    if (href.startsWith('//') || href.startsWith('/api/')) continue;
    if (!exists(href)) errors.push(`${route}: enlace interno roto → ${href}`);
  }
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(m[1]!);
    } catch {
      errors.push(`${route}: JSON-LD no válido`);
    }
  }
  const text = html.replace(/<[^>]+>/g, ' ');
  if (/look\s*(and|&amp;|&|y)\s*find/i.test(text)) errors.push(`${route}: menciona la marca anterior «Look & Find»`);
  if (/mialias\.net|lookandfind\.es/i.test(html)) errors.push(`${route}: enlace al dominio temporal o a la marca anterior`);
  // Formato del blog: ni marcas de Markdown sin convertir ni etiquetas HTML escapadas.
  const body = text.replace(/\s+/g, ' ');
  if (/\*\*\S|\S\*\*/.test(body)) errors.push(`${route}: asteriscos de Markdown sin convertir («**»)`);
  if (/&lt;\/?(p|strong|em|h[1-6]|a|ul|li)\b/i.test(html)) errors.push(`${route}: etiquetas HTML escapadas en el contenido`);
  if (route === '/' && html.includes('data-logo-pending')) warnings.push('Logotipo oficial pendiente: falta public/brand/logo-*.{svg,png,jpg} (npm run media:fetch).');
}

// Sitemap
const sitemapFiles = files.filter((f) => /sitemap-\d+\.xml$/.test(f));
const inSitemap = new Set(
  sitemapFiles.flatMap((f) => [...readFileSync(f, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]!).pathname)),
);
if (!sitemapFiles.length) errors.push('No se ha generado el sitemap');
if (!staging) {
  for (const r of inSitemap) if (!indexable.includes(r)) errors.push(`sitemap: incluye una página no indexable o inexistente: ${r}`);
  for (const r of indexable) if (!inSitemap.has(r) && r !== '/404.html') errors.push(`sitemap: falta la página indexable ${r}`);
}

// Redirecciones
const rules = parseCsv(readFileSync(resolve(root, 'docs/migration/redirect-map.csv'), 'utf8'));
for (const r of rules) {
  if (!exists(r.to)) errors.push(`redirección ${r.from} → destino inexistente ${r.to}`);
  for (const route of routes) {
    const hit = r.kind === 'exacta' ? route === r.from : new RegExp(r.from).test(route);
    // /inmueble/ exacto solo captura la URL sin código (las fichas nuevas viven debajo).
    if (hit) errors.push(`redirección ${r.from} tapa la página nueva ${route}`);
  }
}

// Medios de la web antigua referenciados pero no migrados
const missingMedia = new Set<string>();
for (const f of htmlFiles) {
  for (const m of readFileSync(f, 'utf8').matchAll(/\/wp-content\/uploads\/[^"')\s]+/g)) {
    if (!existsSync(join(dist, m[0]))) missingMedia.add(m[0]);
  }
}
if (missingMedia.size) warnings.push(`${missingMedia.size} imágenes de /wp-content/ sin migrar (npm run media:fetch)`);
const blogImages = readdirSync(resolve(root, 'src/content/blog')).filter((f) =>
  /^image:\s*"\/wp-content/m.test(readFileSync(resolve(root, 'src/content/blog', f), 'utf8')),
).length;
if (!existsSync(join(root, 'public/wp-content'))) warnings.push(`Medios de la web antigua sin descargar: ${blogImages} imágenes de artículos y 4 fotos del equipo se muestran con marcador (npm run media:fetch)`);

if (staging) console.log('Modo pruebas (STAGING=1): robots.txt cerrado y todas las páginas con noindex.');
console.log(`Páginas: ${htmlFiles.length} (${indexable.length} indexables) · sitemap: ${inSitemap.size} URL · redirecciones: ${rules.length}`);
for (const w of warnings) console.warn(`! ${w}`);
if (errors.length) {
  console.error(errors.map((e) => `✗ ${e}`).join('\n'));
  console.error(`\n✗ ${errors.length} errores`);
  process.exit(1);
}
console.log('✓ Comprobaciones estáticas superadas');
