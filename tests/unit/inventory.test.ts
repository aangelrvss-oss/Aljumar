import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { mapProperty, parseInmovillaXml, parseOperations, typeGroupOf } from '../../src/lib/inventory/inmovilla-xml.ts';
import { cleanDescription, excerpt, slugify, tidyTitle } from '../../src/lib/inventory/text.ts';
import { formatPrice, headline, mainArea } from '../../src/lib/inventory/format.ts';

const xml = readFileSync(new URL('../fixtures/inmovilla-demo-sample.xml', import.meta.url), 'utf8');

describe('XML de Inmovilla', () => {
  const list = parseInmovillaXml(xml);

  it('analiza todas las propiedades del fixture', () => {
    expect(list).toHaveLength(4);
    expect(new Set(list.map((p) => p.id)).size).toBe(4);
  });

  it('traduce la operación y separa precios de venta y alquiler', () => {
    const both = list.find((p) => p.id === '1041357')!;
    expect(both.operations).toEqual(['venta', 'alquiler']);
    expect(both.salePrice).toBe(68000);
    expect(both.rentPrice).toBe(400);
    const rent = list.find((p) => p.operations.length === 1 && p.operations[0] === 'alquiler')!;
    expect(rent.salePrice).toBeNull();
    expect(rent.rentPrice).toBeGreaterThan(0);
  });

  it('construye la galería con todas las fotos en https', () => {
    const p = list.find((x) => x.id === '1041357')!;
    expect(p.photos).toHaveLength(13);
    expect(p.photos[0]!.url).toBe('https://fotos15.apinmo.com/2/1041357/6-1.jpg');
    expect(p.photos.every((f) => f.url.startsWith('https://'))).toBe(true);
    expect(p.photos[0]!.alt).toMatch(/fotografía 1/);
  });

  it('no inventa fotos cuando numfotos es 0', () => {
    expect(list.find((p) => p.id === '395378')!.photos).toEqual([]);
  });

  it('suma habitaciones dobles y sencillas, y usa la longitud de «altitud»', () => {
    const p = list.find((x) => x.id === '395378')!;
    expect(p.bedrooms).toBe(3);
    expect(p.approxLocation).toEqual({ lat: 40.4131771, lng: -3.6919406 });
    expect(p.features).toContain('Ascensor');
    expect(p.condition).toBe('Reformado');
  });

  it('genera slugs estables y únicos con el código del inmueble', () => {
    for (const p of list) {
      expect(p.slug).toMatch(/^[a-z0-9-]+$/);
      expect(p.slug.endsWith(p.id)).toBe(true);
    }
  });

  it('descarta registros sin código u operación válida', () => {
    expect(mapProperty({ tipo_ofer: 'Piso', accion: 'Vender' })).toBeNull();
    expect(mapProperty({ id: '1', tipo_ofer: 'Piso', accion: 'Alquiler Vacacional' })).toBeNull();
  });

  it('descarta superficies imposibles (error de carga «1 m²»)', () => {
    const p = mapProperty({ id: '9', accion: 'Vender', tipo_ofer: 'Piso', m_uties: '1', m_cons: '48' })!;
    expect(p.usableArea).toBeNull();
    expect(p.builtArea).toBe(48);
  });

  it('el valor 0 de un campo no se convierte en dato', () => {
    const p = mapProperty({ id: '9', accion: 'Vender', tipo_ofer: 'Piso', precioinmo: '0', banyos: '0', gastos_com: '0' })!;
    expect(p.salePrice).toBeNull();
    expect(p.bathrooms).toBeNull();
    expect(p.communityFee).toBeNull();
  });

  it('clasifica operaciones y tipos', () => {
    expect(parseOperations('Traspasar y Alquilar')).toEqual(['alquiler', 'traspaso']);
    expect(parseOperations('')).toEqual([]);
    expect(typeGroupOf('Ático Dúplex')).toBe('vivienda');
    expect(typeGroupOf('Chalet adosado')).toBe('chalet');
    expect(typeGroupOf('Plaza de garaje')).toBe('garaje-trastero');
    expect(typeGroupOf('Local comercial')).toBe('local-oficina');
    expect(typeGroupOf('Terreno urbano')).toBe('terreno');
  });
});

describe('Textos', () => {
  it('limpia los restos «bbr>» de la web antigua y los separadores de Inmovilla', () => {
    expect(cleanDescription('Primera línea.bbr>')).toBe('Primera línea.');
    expect(cleanDescription('Uno|||Dos~Tres')).toBe('Uno\n\nDos\nTres');
    expect(cleanDescription('<p>Hola &amp; adiós</p><br>Fin')).toBe('Hola & adiós\n\nFin');
    expect(cleanDescription('   ')).toBeNull();
    expect(cleanDescription('colegios , hospitales')).toBe('colegios, hospitales');
  });

  it('normaliza títulos en mayúsculas sin romper siglas', () => {
    expect(tidyTitle('EXCELENTE UBICACION')).toBe('Excelente ubicacion');
    expect(tidyTitle('Precioso ÁTICO en Las Tablas.')).toBe('Precioso ático en Las Tablas');
    expect(tidyTitle('vivienda en planta baja , en la zona')).toBe('Vivienda en planta baja, en la zona');
    expect(tidyTitle('Piso VPO reformado')).toBe('Piso VPO reformado');
  });

  it('crea slugs sin tildes ni eñes', () => {
    expect(slugify('Ático en Peñagrande, Señor')).toBe('atico-en-penagrande-senor');
  });

  it('recorta resúmenes por palabra', () => {
    const t = excerpt('Una frase bastante larga que hay que recortar', 20);
    expect(t.length).toBeLessThanOrEqual(20);
    expect(t.endsWith('…')).toBe(true);
  });
});

describe('Formato', () => {
  const p = mapProperty({ id: '7', accion: 'Alquilar', tipo_ofer: 'Piso', ciudad: 'Madrid', zona: 'Vinateros', precioalq: '950', m_uties: '70' })!;
  it('precio de alquiler mensual y «a consultar» sin precio', () => {
    expect(formatPrice(950, 'alquiler')).toMatch(/950\s?€\/mes/);
    expect(formatPrice(null, 'venta')).toBe('Precio a consultar');
  });
  it('encabezado legible (corrige «PisoenMadrid» de la web antigua)', () => {
    expect(headline(p)).toBe('Piso en alquiler en Vinateros');
  });
  it('superficie principal: construida > útil > parcela', () => {
    expect(mainArea(p)).toEqual({ value: 70, label: 'útiles' });
  });
});
