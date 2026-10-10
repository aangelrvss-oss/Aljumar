/**
 * Genera public/.htaccess (Apache) a partir de:
 *  - docs/migration/redirect-map.csv  → redirecciones 301 de la web antigua
 *  - src/data/inventory.json          → 301 de las fichas antiguas del plugin
 *                                       irdinmo (/inmueble/?…=código) a la nueva ficha
 *  - src/data/retired.json            → 410 para inmuebles retirados
 * y public/_redirects (formato Netlify/Cloudflare Pages) por si se cambia de
 * alojamiento. No editar los archivos generados a mano.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export interface Rule {
  kind: 'exacta' | 'patron';
  from: string;
  to: string;
  reason: string;
}

export function parseCsv(text: string): Rule[] {
  return text
    .split(/\r?\n/)
    .slice(1)
    .filter((l) => l.trim() && !l.startsWith('#'))
    .map((line) => {
      const [kind, from, to, ...rest] = line.split(',');
      if ((kind !== 'exacta' && kind !== 'patron') || !from || !to) throw new Error(`Línea no válida en redirect-map.csv: ${line}`);
      return { kind, from, to, reason: rest.join(',') };
    });
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function main() {
  const rules = parseCsv(readFileSync(resolve(root, 'docs/migration/redirect-map.csv'), 'utf8'));
  const inventory = JSON.parse(readFileSync(resolve(root, 'src/data/inventory.json'), 'utf8')) as {
    properties: { id: string; slug: string; ref: string | null }[];
  };
  const retired = JSON.parse(readFileSync(resolve(root, 'src/data/retired.json'), 'utf8')) as { slug: string }[];

  const out: string[] = [
    '# Generado por scripts/gen-redirects.ts. NO editar a mano.',
    'Options -Indexes',
    'DirectoryIndex index.html',
    'ErrorDocument 404 /404.html',
    'ErrorDocument 410 /inmueble-no-disponible/index.html',
    'AddDefaultCharset UTF-8',
    'AddType image/avif .avif',
    'AddType image/webp .webp',
    'AddType image/svg+xml .svg',
    '',
    '<IfModule mod_headers.c>',
    '  Header always set X-Content-Type-Options "nosniff"',
    '  Header always set Referrer-Policy "strict-origin-when-cross-origin"',
    '  Header always set X-Frame-Options "SAMEORIGIN"',
    '  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=(), interest-cohort=()"',
    // CSP: scripts y estilos propios (Astro inserta algunos en línea), fotos del CDN de Inmovilla.
    `  Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://fotos15.apinmo.com https://fotos15.inmovilla.com https://*.githubusercontent.com; font-src 'self'; connect-src 'self' https://api.github.com; frame-ancestors 'self'; base-uri 'self'; form-action 'self'"`,
    '  <FilesMatch "\\.(css|js|woff2|avif|webp|jpg|jpeg|png|svg)$">',
    '    Header set Cache-Control "public, max-age=2592000"',
    '  </FilesMatch>',
    '  <If "%{REQUEST_URI} =~ m#^/_astro/#">',
    '    Header set Cache-Control "public, max-age=31536000, immutable"',
    '  </If>',
    '  <FilesMatch "\\.html$">',
    '    Header set Cache-Control "no-cache"',
    '  </FilesMatch>',
    '</IfModule>',
    '',
    '<IfModule mod_deflate.c>',
    '  AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json image/svg+xml text/plain application/xml',
    '</IfModule>',
    '',
    'RewriteEngine On',
    '',
    '# --- HTTPS (descomentar si el alojamiento no lo fuerza ya; probar antes) ---',
    '# RewriteCond %{HTTPS} off',
    '# RewriteRule ^ https://aljumar.es%{REQUEST_URI} [L,R=301]',
    '# --- www → sin www (la web antigua usa aljumar.es sin www) ---',
    '# RewriteCond %{HTTP_HOST} ^www\\.aljumar\\.es$ [NC]',
    '# RewriteRule ^ https://aljumar.es%{REQUEST_URI} [L,R=301]',
    '',
    '# --- Fichas antiguas del plugin irdinmo: /inmueble/?<código> → nueva ficha ---',
  ];
  for (const p of inventory.properties) {
    const codes = [p.id, p.ref].filter(Boolean).map((c) => escapeRe(String(c)));
    out.push(`RewriteCond %{QUERY_STRING} (^|&)[a-z_]*=(${codes.join('|')})(&|$) [NC]`);
    out.push(`RewriteRule ^inmueble/?$ /inmueble/${p.slug}/? [R=301,L]`);
  }
  out.push('', '# --- Inmuebles retirados (vendidos, alquilados o dados de baja): 410 Gone ---');
  for (const r of retired) out.push(`RewriteRule ^inmueble/${escapeRe(r.slug)}/?$ - [G,L]`);

  out.push('', '# --- Redirecciones permanentes de la web antigua (docs/migration/redirect-map.csv) ---');
  for (const r of rules) {
    if (r.kind === 'exacta') {
      // Sin la consulta original (?…), salvo que sea relevante.
      out.push(`RewriteRule ^${escapeRe(r.from.replace(/^\//, ''))}?$ ${r.to}? [R=301,L]`.replace(/\/\?\$/, '/?$'));
    } else {
      out.push(`RewriteRule ${r.from.replace(/^\^\//, '^')} ${r.to}? [R=301,L]`);
    }
  }
  out.push('');
  writeFileSync(resolve(root, 'public/.htaccess'), out.join('\n'));

  // Formato _redirects (por si se migra a un alojamiento tipo Netlify / Cloudflare Pages)
  const red: string[] = ['# Generado por scripts/gen-redirects.ts. NO editar a mano.'];
  for (const r of rules) if (r.kind === 'exacta') red.push(`${r.from} ${r.to} 301`);
  for (const r of rules) {
    if (r.kind !== 'patron') continue;
    const m = r.from.match(/^\^\/([a-z_-]+)\/\.[*+]$/);
    if (m) red.push(`/${m[1]}/* ${r.to} 301`);
  }
  for (const s of retired) red.push(`/inmueble/${s.slug}/ /inmueble-no-disponible/ 410`);
  writeFileSync(resolve(root, 'public/_redirects'), red.join('\n') + '\n');
  console.log(`✓ .htaccess: ${rules.length} reglas de migración, ${inventory.properties.length} fichas irdinmo, ${retired.length} retirados (410)`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
