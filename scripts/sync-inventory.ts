/**
 * Sincroniza el inventario de la web con Inmovilla.
 *
 *   node scripts/sync-inventory.ts                 → descarga INMOVILLA_XML_URL
 *   node scripts/sync-inventory.ts --file feed.xml → lee un XML local
 *   node scripts/sync-inventory.ts --snapshot      → instantánea de muestra (solo vistas previas)
 *   … --force                                      → acepta una caída brusca del inventario
 *
 * Escribe src/data/inventory.json (lo que pinta la web) y actualiza
 * src/data/retired.json con los inmuebles que han dejado de publicarse, para
 * que sus URL respondan 410 con una página útil en vez de un 404 genérico.
 *
 * Salvaguardas: si el XML está vacío, no se puede analizar o elimina más de
 * la mitad del inventario anterior, el script falla y NO sobrescribe nada
 * (un fallo de Inmovilla no debe vaciar la web).
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mapProperty, parseInmovillaXml } from '../src/lib/inventory/inmovilla-xml.ts';
import type { InventorySnapshot, Property } from '../src/lib/inventory/types.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(root, 'src/data/inventory.json');
const RETIRED = resolve(root, 'src/data/retired.json');
const SNAPSHOT = resolve(root, 'migration/inmovilla-snapshot-2026-10-10.json');

interface Retired {
  id: string;
  slug: string;
  operation: string;
  retiredAt: string;
}

const args = process.argv.slice(2);
const force = args.includes('--force');

function fail(msg: string): never {
  console.error(`✗ sync-inventory: ${msg}`);
  process.exit(1);
}

async function download(url: string): Promise<string> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(60_000), headers: { 'User-Agent': 'aljumar-web-sync/1.0' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      lastError = e;
      await new Promise((r) => setTimeout(r, attempt * 2000));
    }
  }
  fail(`no se pudo descargar el XML de Inmovilla (${String(lastError)})`);
}

function readJson<T>(path: string, fallback: T): T {
  return existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as T) : fallback;
}

/** Destacados primero; después, por fecha de actualización descendente si existe. */
function order(list: Property[]): Property[] {
  return list
    .map((p, i) => ({ p, i }))
    .sort((a, b) => Number(b.p.featured) - Number(a.p.featured) || (b.p.updatedAt ?? '').localeCompare(a.p.updatedAt ?? '') || a.i - b.i)
    .map(({ p }) => p);
}

async function main() {
  let properties: Property[];
  let source: InventorySnapshot['source'];
  let notice: string | null = null;

  if (args.includes('--snapshot')) {
    const snap = readJson<{ fecha: string; fuente: string; propiedades: Record<string, unknown>[] }>(SNAPSHOT, { fecha: '', fuente: '', propiedades: [] });
    properties = snap.propiedades.map((r) => mapProperty(r)).filter((p): p is Property => p !== null);
    source = 'snapshot';
    notice = `Vista previa con una muestra de ${properties.length} inmuebles copiada de ${snap.fuente} el ${snap.fecha.split('-').reverse().join('/')}. En producción el inventario se carga desde Inmovilla.`;
  } else {
    const fileIdx = args.indexOf('--file');
    let xml: string;
    if (fileIdx >= 0) {
      const file = args[fileIdx + 1];
      if (!file) fail('falta la ruta tras --file');
      xml = readFileSync(resolve(file), 'utf8');
    } else {
      const url = process.env.INMOVILLA_XML_URL;
      if (!url) fail('falta INMOVILLA_XML_URL (ver .env.example). Para una vista previa usa --snapshot.');
      xml = await download(url);
    }
    if (!/<propiedades[\s>]/.test(xml)) fail('el documento recibido no es un XML de propiedades de Inmovilla');
    properties = parseInmovillaXml(xml);
    source = 'inmovilla-xml';
  }

  if (properties.length === 0) fail('el inventario resultante está vacío; no se sobrescribe la web');

  const previous = readJson<InventorySnapshot | null>(OUT, null);
  if (previous && previous.source === source && !force) {
    const drop = 1 - properties.length / Math.max(previous.properties.length, 1);
    if (previous.properties.length >= 6 && drop > 0.5) {
      fail(`el inventario pasaría de ${previous.properties.length} a ${properties.length} inmuebles (-${Math.round(drop * 100)} %). Revisa Inmovilla o repite con --force.`);
    }
  }

  // Inmuebles que estaban publicados y ya no aparecen → retirados (410).
  const retired = readJson<Retired[]>(RETIRED, []);
  const now = new Date().toISOString();
  const currentIds = new Set(properties.map((p) => p.id));
  if (previous && previous.source === source) {
    for (const p of previous.properties) {
      if (!currentIds.has(p.id) && !retired.some((r) => r.id === p.id)) {
        retired.push({ id: p.id, slug: p.slug, operation: p.operations[0] ?? 'venta', retiredAt: now });
      }
    }
  }
  // Si un inmueble vuelve a publicarse, deja de estar retirado.
  const stillRetired = retired.filter((r) => !currentIds.has(r.id));

  const snapshot: InventorySnapshot = { source, generatedAt: now, notice, properties: order(properties) };
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(snapshot, null, 2) + '\n');
  writeFileSync(RETIRED, JSON.stringify(stillRetired, null, 2) + '\n');

  const byOp = (op: string) => properties.filter((p) => p.operations.includes(op as Property['operations'][number])).length;
  console.log(
    `✓ Inventario (${source}): ${properties.length} inmuebles — venta ${byOp('venta')}, alquiler ${byOp('alquiler')}, traspaso ${byOp('traspaso')}; retirados registrados: ${stillRetired.length}`,
  );
}

await main();
