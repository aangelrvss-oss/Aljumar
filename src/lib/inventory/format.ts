import type { Operation, Property, TypeGroup } from './types.ts';

const eur = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const int = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 });

export function formatPrice(value: number | null, operation: Operation): string {
  if (value === null) return 'Precio a consultar';
  return operation === 'alquiler' ? `${eur.format(value)}/mes` : eur.format(value);
}

export function formatArea(m2: number | null): string | null {
  return m2 === null ? null : `${int.format(m2)} m²`;
}

export function priceFor(p: Property, operation: Operation): number | null {
  if (operation === 'alquiler') return p.rentPrice;
  if (operation === 'traspaso') return p.transferPrice;
  return p.salePrice;
}

/** Operación principal con la que se presenta el inmueble. */
export function primaryOperation(p: Property): Operation {
  return p.operations[0] ?? 'venta';
}

export const OPERATION_LABEL: Record<Operation, string> = {
  venta: 'Venta',
  alquiler: 'Alquiler',
  traspaso: 'Traspaso',
};

export const TYPE_GROUP_LABEL: Record<TypeGroup, string> = {
  vivienda: 'Pisos y apartamentos',
  chalet: 'Chalets y casas',
  'local-oficina': 'Locales y oficinas',
  'garaje-trastero': 'Garajes y trasteros',
  terreno: 'Terrenos',
  'edificio-otros': 'Edificios y otros',
};

export function placeLabel(p: Pick<Property, 'city' | 'zone'>): string {
  if (p.zone && p.city) return `${p.zone}, ${p.city}`;
  return p.zone ?? p.city ?? 'Ubicación a consultar';
}

/** «Piso en venta en Moratalaz, Madrid»: el encabezado que corrige los títulos concatenados de la web antigua. */
export function headline(p: Property): string {
  const op = primaryOperation(p);
  const opText = op === 'alquiler' ? 'en alquiler' : op === 'traspaso' ? 'en traspaso' : 'en venta';
  const where = p.zone ?? p.city;
  return `${p.type} ${opText}${where ? ` en ${where}` : ''}`;
}

export function mainArea(p: Property): { value: number; label: string } | null {
  if (p.builtArea !== null) return { value: p.builtArea, label: 'construidos' };
  if (p.usableArea !== null) return { value: p.usableArea, label: 'útiles' };
  if (p.plotArea !== null) return { value: p.plotArea, label: 'de parcela' };
  return null;
}
