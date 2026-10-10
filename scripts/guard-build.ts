/**
 * Comprobaciones previas a la compilación. Con SITE_ENV=production impide
 * publicar una web con datos de muestra o con la indexación bloqueada:
 *  - el inventario debe proceder de Inmovilla (no de la instantánea),
 *  - el inventario no puede tener más de 48 h,
 *  - STAGING no puede estar activo,
 *  - SITE_URL debe ser el dominio definitivo.
 * En cualquier otro entorno solo avisa.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const inv = JSON.parse(readFileSync(resolve(root, 'src/data/inventory.json'), 'utf8')) as {
  source: string;
  generatedAt: string;
  properties: unknown[];
};
const production = process.env.SITE_ENV === 'production';
const problems: string[] = [];

if (inv.source !== 'inmovilla-xml') problems.push(`el inventario es «${inv.source}» (muestra), no el XML de Inmovilla: ejecuta «npm run sync».`);
const ageH = (Date.now() - Date.parse(inv.generatedAt)) / 3_600_000;
if (ageH > 48) problems.push(`el inventario tiene ${Math.round(ageH)} h de antigüedad: ejecuta «npm run sync».`);
if (inv.properties.length === 0) problems.push('el inventario está vacío.');
if (process.env.STAGING === '1') problems.push('STAGING=1 bloquearía la indexación en producción.');
const site = process.env.SITE_URL ?? 'https://aljumar.es';
if (!/^https:\/\/(www\.)?aljumar\.es\/?$/.test(site)) problems.push(`SITE_URL=${site} no es el dominio definitivo.`);

if (problems.length) {
  const msg = problems.map((p) => `  - ${p}`).join('\n');
  if (production) {
    console.error(`✗ Compilación de PRODUCCIÓN detenida:\n${msg}`);
    process.exit(1);
  }
  console.warn(`! Vista previa (no apta para producción):\n${msg}`);
} else {
  console.log('✓ Comprobaciones de publicación superadas.');
}
