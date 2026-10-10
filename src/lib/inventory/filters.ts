/**
 * Búsqueda y filtros del inventario. Se usa en el navegador (buscador de
 * /comprar/ y /alquilar/) y en las pruebas unitarias, así que no depende de
 * Astro ni del DOM. Los criterios se leen y escriben en la URL para que una
 * búsqueda se pueda compartir o recargar.
 */
import type { Operation, Property, TypeGroup } from './types.ts';

export type SortKey = 'recientes' | 'precio-asc' | 'precio-desc' | 'superficie-desc';

export interface Criteria {
  operation: Operation;
  city: string | null;
  zone: string | null;
  typeGroup: TypeGroup | null;
  priceMin: number | null;
  priceMax: number | null;
  areaMin: number | null;
  bedroomsMin: number | null;
  bathroomsMin: number | null;
  features: string[];
  sort: SortKey;
}

/** Datos mínimos de cada inmueble que el buscador necesita en el navegador. */
export interface SearchItem {
  id: string;
  operations: Operation[];
  city: string | null;
  zone: string | null;
  typeGroup: TypeGroup;
  price: Partial<Record<Operation, number | null>>;
  area: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  features: string[];
  /** Posición original (orden por defecto: destacados y más recientes). */
  rank: number;
}

export const SORTS: { value: SortKey; label: string }[] = [
  { value: 'recientes', label: 'Destacados primero' },
  { value: 'precio-asc', label: 'Precio: de menor a mayor' },
  { value: 'precio-desc', label: 'Precio: de mayor a menor' },
  { value: 'superficie-desc', label: 'Superficie: de mayor a menor' },
];

const TYPE_GROUPS: TypeGroup[] = ['vivienda', 'chalet', 'local-oficina', 'garaje-trastero', 'terreno', 'edificio-otros'];

export function toSearchItem(p: Property, rank: number): SearchItem {
  return {
    id: p.id,
    operations: p.operations,
    city: p.city,
    zone: p.zone,
    typeGroup: p.typeGroup,
    price: { venta: p.salePrice, alquiler: p.rentPrice, traspaso: p.transferPrice },
    area: p.builtArea ?? p.usableArea ?? p.plotArea,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    features: p.features,
    rank,
  };
}

function posNumber(v: string | null): number | null {
  if (v === null || v.trim() === '') return null;
  const n = Number(v.replace(/[.\s€]/g, '').replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function emptyCriteria(operation: Operation): Criteria {
  return {
    operation,
    city: null,
    zone: null,
    typeGroup: null,
    priceMin: null,
    priceMax: null,
    areaMin: null,
    bedroomsMin: null,
    bathroomsMin: null,
    features: [],
    sort: 'recientes',
  };
}

export function criteriaFromParams(params: URLSearchParams, operation: Operation): Criteria {
  const c = emptyCriteria(operation);
  c.city = params.get('ciudad') || null;
  c.zone = params.get('zona') || null;
  const tipo = params.get('tipo');
  c.typeGroup = tipo && (TYPE_GROUPS as string[]).includes(tipo) ? (tipo as TypeGroup) : null;
  c.priceMin = posNumber(params.get('precio_min'));
  c.priceMax = posNumber(params.get('precio_max'));
  if (c.priceMin !== null && c.priceMax !== null && c.priceMin > c.priceMax) {
    [c.priceMin, c.priceMax] = [c.priceMax, c.priceMin];
  }
  c.areaMin = posNumber(params.get('superficie_min'));
  c.bedroomsMin = posNumber(params.get('dormitorios'));
  c.bathroomsMin = posNumber(params.get('banos'));
  c.features = params.getAll('extra').filter(Boolean);
  const sort = params.get('orden');
  c.sort = SORTS.some((s) => s.value === sort) ? (sort as SortKey) : 'recientes';
  return c;
}

export function criteriaToParams(c: Criteria): URLSearchParams {
  const p = new URLSearchParams();
  if (c.city) p.set('ciudad', c.city);
  if (c.zone) p.set('zona', c.zone);
  if (c.typeGroup) p.set('tipo', c.typeGroup);
  if (c.priceMin !== null) p.set('precio_min', String(c.priceMin));
  if (c.priceMax !== null) p.set('precio_max', String(c.priceMax));
  if (c.areaMin !== null) p.set('superficie_min', String(c.areaMin));
  if (c.bedroomsMin !== null) p.set('dormitorios', String(c.bedroomsMin));
  if (c.bathroomsMin !== null) p.set('banos', String(c.bathroomsMin));
  for (const f of c.features) p.append('extra', f);
  if (c.sort !== 'recientes') p.set('orden', c.sort);
  return p;
}

/** Número de criterios activos (sin contar la operación ni el orden). */
export function activeCount(c: Criteria): number {
  return [c.city, c.zone, c.typeGroup, c.priceMin, c.priceMax, c.areaMin, c.bedroomsMin, c.bathroomsMin].filter(
    (v) => v !== null,
  ).length + c.features.length;
}

export function matches(item: SearchItem, c: Criteria): boolean {
  if (!item.operations.includes(c.operation)) return false;
  if (c.city && item.city !== c.city) return false;
  if (c.zone && item.zone !== c.zone) return false;
  if (c.typeGroup && item.typeGroup !== c.typeGroup) return false;
  const price = item.price[c.operation] ?? null;
  // Un inmueble sin precio publicado no se descarta por precio («Consultar»).
  if (price !== null) {
    if (c.priceMin !== null && price < c.priceMin) return false;
    if (c.priceMax !== null && price > c.priceMax) return false;
  }
  if (c.areaMin !== null && (item.area === null || item.area < c.areaMin)) return false;
  if (c.bedroomsMin !== null && (item.bedrooms === null || item.bedrooms < c.bedroomsMin)) return false;
  if (c.bathroomsMin !== null && (item.bathrooms === null || item.bathrooms < c.bathroomsMin)) return false;
  for (const f of c.features) if (!item.features.includes(f)) return false;
  return true;
}

export function search(items: SearchItem[], c: Criteria): SearchItem[] {
  const out = items.filter((i) => matches(i, c));
  const price = (i: SearchItem) => i.price[c.operation] ?? null;
  const byNullsLast = (a: number | null, b: number | null, dir: 1 | -1) => {
    if (a === null && b === null) return 0;
    if (a === null) return 1;
    if (b === null) return -1;
    return (a - b) * dir;
  };
  switch (c.sort) {
    case 'precio-asc':
      return out.sort((a, b) => byNullsLast(price(a), price(b), 1) || a.rank - b.rank);
    case 'precio-desc':
      return out.sort((a, b) => byNullsLast(price(a), price(b), -1) || a.rank - b.rank);
    case 'superficie-desc':
      return out.sort((a, b) => byNullsLast(a.area, b.area, -1) || a.rank - b.rank);
    default:
      return out.sort((a, b) => a.rank - b.rank);
  }
}
