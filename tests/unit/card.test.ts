import { describe, expect, it } from 'vitest';
import inventory from '../../src/data/inventory.json' with { type: 'json' };
import type { Property } from '../../src/lib/inventory/types.ts';
import { cardModel, renderCard } from '../../src/lib/inventory/card.ts';
import { pickHero } from '../../src/lib/inventory/index.ts';

const props = inventory.properties as unknown as Property[];
const base = props[0]!;
const make = (over: Partial<Property>): Property => ({ ...base, ...over });

describe('Tarjeta de inmueble', () => {
  it('omite los datos que no existen y nunca muestra «null»', () => {
    const p = make({ bedrooms: null, bathrooms: null, builtArea: null, usableArea: null, plotArea: null, salePrice: null });
    const html = renderCard(cardModel(p, 'venta'));
    expect(html).not.toMatch(/null|undefined|NaN/);
    expect(html).toContain('Precio a consultar');
    expect(html).not.toContain('pcard__specs');
  });

  it('sin fotos: marcador de marca y sin <img>', () => {
    const html = renderCard(cardModel(make({ photos: [] })));
    expect(html).not.toContain('<img');
    expect(html).toContain('Sin fotografías publicadas');
  });

  it('escapa el texto que viene del CRM', () => {
    const p = make({ type: 'Piso <script>alert(1)</script>', city: 'Madrid "centro"' });
    const html = renderCard(cardModel(p));
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&quot;centro&quot;');
  });

  it('marca el estado si no está disponible', () => {
    expect(renderCard(cardModel(make({ status: 'reservado' })))).toContain('Reservado');
  });

  it('el título es el generado (tipo, operación y zona), no la frase del CRM', () => {
    const p = make({ title: 'Excelente ubicacion, oportunidad única, no te lo pierdas, llama ya' });
    expect(cardModel(p).headline).toBe(`${p.type} en venta en ${p.zone ?? p.city}`);
  });
});

describe('Foto principal de la portada (pickHero)', () => {
  const a = make({ id: 'a', photos: base.photos.slice(0, 2), salePrice: 900000, featured: false });
  const b = make({ id: 'b', photos: base.photos.slice(0, 3), salePrice: 100000, featured: false });
  const c = make({ id: 'c', photos: base.photos.slice(0, 1), salePrice: 50000, featured: true });
  const d = make({ id: 'd', photos: [], salePrice: 2000000, featured: true });

  it('prioriza la elección manual si sigue publicada y tiene fotos', () => {
    expect(pickHero([a, b, c], 'a')?.id).toBe('a');
    expect(pickHero([a, b, c], 'd')?.id).toBe('c'); // sin fotos: se ignora
    expect(pickHero([a, b, c], 'no-existe')?.id).toBe('c');
  });

  it('después: destacado, más fotos, mayor precio', () => {
    expect(pickHero([a, b, c])?.id).toBe('c');
    expect(pickHero([a, b])?.id).toBe('b');
    expect(pickHero([a, make({ id: 'e', photos: a.photos, salePrice: 100 })])?.id).toBe('a');
  });

  it('nunca elige un inmueble sin fotos ni uno reservado', () => {
    expect(pickHero([d])).toBeNull();
    expect(pickHero([make({ id: 'r', status: 'reservado' })])).toBeNull();
  });

  it('es determinista', () => {
    expect(pickHero([b, a, c])?.id).toBe(pickHero([c, a, b])?.id);
  });
});
