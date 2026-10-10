import { describe, expect, it } from 'vitest';
import {
  activeCount,
  criteriaFromParams,
  criteriaToParams,
  emptyCriteria,
  search,
  type SearchItem,
} from '../../src/lib/inventory/filters.ts';

const item = (o: Partial<SearchItem> & { id: string }): SearchItem => ({
  operations: ['venta'],
  city: 'Madrid',
  zone: null,
  typeGroup: 'vivienda',
  price: { venta: 200000 },
  area: 80,
  bedrooms: 2,
  bathrooms: 1,
  features: [],
  rank: Number(o.id),
  ...o,
});

const items: SearchItem[] = [
  item({ id: '1', price: { venta: 285000 }, bedrooms: 2, area: null }),
  item({ id: '2', city: 'Rivas - Vaciamadrid', typeGroup: 'chalet', price: { venta: 970000 }, bedrooms: 4, bathrooms: 2, area: 350, features: ['Piscina propia', 'Terraza'] }),
  item({ id: '3', zone: 'Vinateros', price: { venta: 270000 }, bedrooms: 1, area: 48 }),
  item({ id: '4', operations: ['venta', 'alquiler'], price: { venta: 150000, alquiler: 900 }, bedrooms: 3, area: 90, features: ['Terraza'] }),
  item({ id: '5', operations: ['alquiler'], price: { alquiler: null }, bedrooms: 2 }),
];
const ids = (r: SearchItem[]) => r.map((i) => i.id);

describe('Buscador', () => {
  it('filtra por operación', () => {
    expect(ids(search(items, emptyCriteria('venta')))).toEqual(['1', '2', '3', '4']);
    expect(ids(search(items, emptyCriteria('alquiler')))).toEqual(['4', '5']);
  });

  it('aplica el precio de la operación buscada', () => {
    const c = { ...emptyCriteria('alquiler'), priceMax: 1000 };
    // El 5 no tiene precio publicado: no se descarta por precio.
    expect(ids(search(items, c))).toEqual(['4', '5']);
    const v = { ...emptyCriteria('venta'), priceMin: 200000, priceMax: 300000 };
    expect(ids(search(items, v))).toEqual(['1', '3']);
  });

  it('combina localidad, zona, tipo, dormitorios, baños, superficie y características', () => {
    expect(ids(search(items, { ...emptyCriteria('venta'), city: 'Rivas - Vaciamadrid' }))).toEqual(['2']);
    expect(ids(search(items, { ...emptyCriteria('venta'), zone: 'Vinateros' }))).toEqual(['3']);
    expect(ids(search(items, { ...emptyCriteria('venta'), typeGroup: 'chalet' }))).toEqual(['2']);
    expect(ids(search(items, { ...emptyCriteria('venta'), bedroomsMin: 3 }))).toEqual(['2', '4']);
    expect(ids(search(items, { ...emptyCriteria('venta'), bathroomsMin: 2 }))).toEqual(['2']);
    // Sin superficie conocida no se puede asegurar el mínimo: se excluye.
    expect(ids(search(items, { ...emptyCriteria('venta'), areaMin: 85 }))).toEqual(['2', '4']);
    expect(ids(search(items, { ...emptyCriteria('venta'), features: ['Terraza'] }))).toEqual(['2', '4']);
    expect(ids(search(items, { ...emptyCriteria('venta'), features: ['Terraza', 'Piscina propia'] }))).toEqual(['2']);
  });

  it('devuelve vacío si nada encaja', () => {
    expect(search(items, { ...emptyCriteria('venta'), bedroomsMin: 9 })).toEqual([]);
  });

  it('ordena por precio y superficie dejando al final los valores desconocidos', () => {
    expect(ids(search(items, { ...emptyCriteria('venta'), sort: 'precio-asc' }))).toEqual(['4', '3', '1', '2']);
    expect(ids(search(items, { ...emptyCriteria('venta'), sort: 'precio-desc' }))).toEqual(['2', '1', '3', '4']);
    expect(ids(search(items, { ...emptyCriteria('venta'), sort: 'superficie-desc' }))).toEqual(['2', '4', '3', '1']);
  });

  it('lee y escribe los criterios en la URL (ida y vuelta)', () => {
    const qs = 'ciudad=Madrid&tipo=vivienda&precio_min=100000&precio_max=300000&dormitorios=2&banos=1&superficie_min=60&extra=Terraza&orden=precio-asc';
    const c = criteriaFromParams(new URLSearchParams(qs), 'venta');
    expect(c).toMatchObject({ city: 'Madrid', typeGroup: 'vivienda', priceMin: 100000, priceMax: 300000, bedroomsMin: 2, bathroomsMin: 1, areaMin: 60, features: ['Terraza'], sort: 'precio-asc' });
    const sorted = (p: URLSearchParams) => [...p.entries()].sort().join('&');
    expect(sorted(criteriaToParams(c))).toBe(sorted(new URLSearchParams(qs)));
    expect(criteriaFromParams(criteriaToParams(c), 'venta')).toEqual(c);
    expect(activeCount(c)).toBe(8);
  });

  it('ignora valores manipulados en la URL', () => {
    const c = criteriaFromParams(new URLSearchParams('tipo=<script>&precio_min=abc&orden=hack&dormitorios=-2'), 'venta');
    expect(c.typeGroup).toBeNull();
    expect(c.priceMin).toBeNull();
    expect(c.sort).toBe('recientes');
    expect(c.bedroomsMin).toBeNull();
  });

  it('intercambia mínimo y máximo si llegan al revés', () => {
    const c = criteriaFromParams(new URLSearchParams('precio_min=500000&precio_max=100000'), 'venta');
    expect([c.priceMin, c.priceMax]).toEqual([100000, 500000]);
  });
});
