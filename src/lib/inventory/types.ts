/**
 * Modelo normalizado de inmueble. Es independiente de Inmovilla: el
 * adaptador (inmovilla-xml.ts) traduce los campos del CRM a esta forma y el
 * resto de la web solo conoce este tipo.
 *
 * Regla: un dato que la fuente no aporta queda en `null`; nunca se rellena
 * con un valor inventado. La interfaz oculta lo que es `null`.
 */

export type Operation = 'venta' | 'alquiler' | 'traspaso';

export type CommercialStatus = 'disponible' | 'reservado' | 'vendido' | 'alquilado';

export type EnergyLetter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';

export interface Photo {
  url: string;
  /** Texto alternativo generado a partir del tipo y la ubicación. */
  alt: string;
}

export interface Property {
  /** Identificador interno de Inmovilla (cod_ofer). Estable. */
  id: string;
  /** Referencia pública de la agencia (ref). */
  ref: string | null;
  /** Segmento de URL estable: «piso-venta-madrid-moratalaz-30312733». */
  slug: string;
  operations: Operation[];
  status: CommercialStatus;
  /** Tipo tal y como lo nombra Inmovilla: «Piso», «Ático», «Chalet»... */
  type: string;
  /** Familia para el filtro: vivienda, chalet, local, garaje, terreno, otros. */
  typeGroup: TypeGroup;
  title: string | null;
  description: string | null;
  salePrice: number | null;
  rentPrice: number | null;
  transferPrice: number | null;
  city: string | null;
  zone: string | null;
  postalCode: string | null;
  province: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  toilets: number | null;
  builtArea: number | null;
  usableArea: number | null;
  plotArea: number | null;
  floor: string | null;
  yearBuilt: number | null;
  condition: string | null;
  energy: { letter: EnergyLetter | null; value: number | null; status: 'aportado' | 'en-tramite' | 'exento' | 'pendiente' | null };
  emissions: { letter: EnergyLetter | null; value: number | null };
  communityFee: number | null;
  features: string[];
  photos: Photo[];
  /** Coordenadas aproximadas (solo si la agencia permite mostrar la zona). */
  approxLocation: { lat: number; lng: number } | null;
  featured: boolean;
  updatedAt: string | null;
}

export type TypeGroup = 'vivienda' | 'chalet' | 'local-oficina' | 'garaje-trastero' | 'terreno' | 'edificio-otros';

export interface InventorySnapshot {
  /** inmovilla-xml | snapshot (copia de muestra tomada de la web antigua). */
  source: 'inmovilla-xml' | 'snapshot';
  generatedAt: string;
  /** Nota visible en entornos de prueba cuando la fuente no es la oficial. */
  notice: string | null;
  properties: Property[];
}
