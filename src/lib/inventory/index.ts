/**
 * Acceso al inventario en tiempo de compilación. Los datos los genera
 * scripts/sync-inventory.ts en src/data/inventory.json.
 */
import data from '../../data/inventory.json';
import retiredData from '../../data/retired.json';
import settings from '../../data/settings.json';
import type { InventorySnapshot, Operation, Property } from './types.ts';

const inventory = data as unknown as InventorySnapshot;

export const inventorySource = inventory.source;
export const inventoryNotice = inventory.notice;
export const inventoryGeneratedAt = inventory.generatedAt;

export const retired = retiredData as { id: string; slug: string; operation: string; retiredAt: string }[];

export function allProperties(): Property[] {
  return inventory.properties;
}

export function byOperation(op: Operation): Property[] {
  return inventory.properties.filter((p) => p.operations.includes(op));
}

/** Selección de la portada: destacados primero, sin repetir el inmueble de portada. */
export function featured(limit = 6, exclude: string | null = null): Property[] {
  const list = inventory.properties.filter(
    (p) => p.id !== exclude && (p.operations.includes('venta') || p.operations.includes('alquiler')),
  );
  return [...list.filter((p) => p.featured), ...list.filter((p) => !p.featured)].slice(0, limit);
}

/**
 * Inmueble cuya foto preside la portada. Regla determinista y explicable
 * (docs/design-review/art-direction.md):
 *   1. El que Aljumar elija en /admin/ (Ajustes → «Inmueble de portada»), si
 *      sigue publicado y tiene fotos.
 *   2. Si no, entre los disponibles en venta o alquiler con fotos: primero los
 *      marcados como destacados en Inmovilla, después el que tiene más fotos
 *      (suele indicar un reportaje completo), después el de mayor precio y,
 *      por último, el identificador, para que el resultado no cambie entre
 *      compilaciones.
 * No se puede saber automáticamente si la primera foto es un plano o un baño:
 * para eso está la elección manual del punto 1.
 */
export function heroProperty(): Property | null {
  const withPhotos = inventory.properties.filter((p) => p.photos.length > 0 && p.status === 'disponible');
  const chosen = (settings as { heroPropertyId?: string }).heroPropertyId?.trim();
  if (chosen) {
    const p = withPhotos.find((x) => x.id === chosen || x.ref === chosen);
    if (p) return p;
  }
  const price = (p: Property) => p.salePrice ?? p.rentPrice ?? p.transferPrice ?? 0;
  return (
    withPhotos
      .filter((p) => p.operations.includes('venta') || p.operations.includes('alquiler'))
      .sort(
        (a, b) =>
          Number(b.featured) - Number(a.featured) ||
          b.photos.length - a.photos.length ||
          price(b) - price(a) ||
          a.id.localeCompare(b.id),
      )[0] ?? null
  );
}

/** Inmuebles parecidos: misma operación; prioriza misma zona/ciudad y precio cercano. */
export function related(p: Property, limit = 3): Property[] {
  const op = p.operations[0];
  const price = (x: Property) => (op === 'alquiler' ? x.rentPrice : x.salePrice) ?? 0;
  const base = price(p);
  return inventory.properties
    .filter((x) => x.id !== p.id && op !== undefined && x.operations.includes(op))
    .map((x) => {
      let score = 0;
      if (p.zone && x.zone === p.zone) score += 3;
      if (p.city && x.city === p.city) score += 2;
      if (x.typeGroup === p.typeGroup) score += 1;
      const diff = base ? Math.abs(price(x) - base) / base : 1;
      score += Math.max(0, 1 - diff);
      return { x, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ x }) => x);
}

export interface Option {
  value: string;
  label: string;
  count: number;
}

function countBy(list: Property[], key: (p: Property) => string | null): Option[] {
  const m = new Map<string, number>();
  for (const p of list) {
    const k = key(p);
    if (k) m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], 'es'))
    .map(([value, count]) => ({ value, label: value, count }));
}

/** Opciones de los filtros calculadas sobre el inventario real (no listas fijas). */
export function filterOptions(op: Operation) {
  const list = byOperation(op);
  return {
    cities: countBy(list, (p) => p.city),
    zones: countBy(list, (p) => p.zone),
    features: countBy(
      list.flatMap((p) => p.features.map((f) => ({ ...p, zone: f }))),
      (p) => p.zone,
    ).filter((o) => o.count > 0),
    typeGroups: countBy(list, (p) => p.typeGroup),
    maxPrice: Math.max(0, ...list.map((p) => (op === 'alquiler' ? p.rentPrice : op === 'traspaso' ? p.transferPrice : p.salePrice) ?? 0)),
  };
}
