/**
 * Adaptador del XML diario de Inmovilla («fichero XML para web»).
 *
 * Formato: <propiedades><propiedad>…</propiedad></propiedades>, un elemento
 * por inmueble publicado en la web, con campos planos (id, ref, accion,
 * tipo_ofer, precioinmo, precioalq, ciudad, zona, habdobles, habitaciones,
 * banyos, m_cons, m_uties, foto1…fotoN, latitud, altitud…). Ver
 * docs/architecture/target-architecture.md y tests/fixtures.
 *
 * Inmovilla solo exporta los inmuebles marcados para la web: si un inmueble
 * se vende, se alquila o se retira, deja de aparecer en el XML y la web lo
 * da de baja en la siguiente sincronización.
 */
import { XMLParser } from 'fast-xml-parser';
import { cleanDescription, slugify, tidyTitle } from './text.ts';
import type { EnergyLetter, Operation, Property, TypeGroup } from './types.ts';

type Raw = Record<string, unknown>;

const FEATURE_LABELS: Record<string, string> = {
  ascensor: 'Ascensor',
  aire_con: 'Aire acondicionado',
  airecentral: 'Climatización centralizada',
  preinstaacc: 'Preinstalación de aire acondicionado',
  calefaccion: 'Calefacción',
  calefacentral: 'Calefacción central',
  terraza: 'Terraza',
  terrazaacris: 'Terraza acristalada',
  balcon: 'Balcón',
  patio: 'Patio',
  plaza_gara: 'Plaza de garaje',
  garajedoble: 'Garaje doble',
  parking: 'Parking',
  trastero: 'Trastero',
  piscina_com: 'Piscina comunitaria',
  piscina_prop: 'Piscina propia',
  arma_empo: 'Armarios empotrados',
  cocina_inde: 'Cocina independiente',
  electro: 'Cocina equipada',
  muebles: 'Amueblado',
  luminoso: 'Luminoso',
  todoext: 'Todo exterior',
  puerta_blin: 'Puerta blindada',
  alarma: 'Alarma',
  urbanizacion: 'Urbanización',
  gimnasio: 'Gimnasio',
  jardin: 'Jardín',
  chimenea: 'Chimenea',
  barbacoa: 'Barbacoa',
  solarium: 'Solárium',
  despensa: 'Despensa',
  lavanderia: 'Lavadero',
  adaptadominus: 'Adaptado a movilidad reducida',
  esquina: 'Esquina',
  diafano: 'Diáfano',
  vistasalmar: 'Vistas al mar',
};

const ENERGY = new Set(['A', 'B', 'C', 'D', 'E', 'F', 'G']);

function str(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

function num(v: unknown): number | null {
  const s = str(v);
  if (s === null) return null;
  const n = Number(s.replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Superficie en m²; descarta valores imposibles (p. ej. «1 m²» por error de carga en el CRM). */
function area(v: unknown): number | null {
  const n = num(v);
  return n !== null && n >= 8 ? n : null;
}

function int(v: unknown): number | null {
  const n = num(v);
  return n === null ? null : Math.round(n);
}

function flag(v: unknown): boolean {
  const s = str(v);
  return s !== null && s !== '0' && s.toLowerCase() !== 'false';
}

function energyLetter(v: unknown): EnergyLetter | null {
  const s = str(v)?.toUpperCase() ?? null;
  return s && ENERGY.has(s) ? (s as EnergyLetter) : null;
}

export function parseOperations(accion: string | null): Operation[] {
  if (!accion) return [];
  const a = accion.toLowerCase();
  const ops: Operation[] = [];
  if (a.includes('vend')) ops.push('venta');
  // «Alquiler vacacional» no es un servicio que ofrezca Aljumar: se excluye.
  if (a.includes('alquil') && !a.includes('vacacional')) ops.push('alquiler');
  if (a.includes('traspas')) ops.push('traspaso');
  return ops;
}

export function typeGroupOf(type: string): TypeGroup {
  const t = slugify(type);
  if (/chalet|adosad|pareado|villa|casa|bungalow|cortijo|masia|finca/.test(t)) return 'chalet';
  if (/local|oficina|nave|despacho/.test(t)) return 'local-oficina';
  if (/garaje|parking|plaza|trastero/.test(t)) return 'garaje-trastero';
  if (/terreno|parcela|solar/.test(t)) return 'terreno';
  if (/edificio/.test(t)) return 'edificio-otros';
  if (/piso|atico|duplex|estudio|apartamento|loft|planta-baja|triplex|vivienda/.test(t)) return 'vivienda';
  return 'edificio-otros';
}

const ENERGY_STATUS: Record<string, Property['energy']['status']> = {
  '0': 'pendiente',
  '1': 'aportado',
  '2': 'en-tramite',
  '3': 'exento',
};

export function buildSlug(p: Pick<Property, 'type' | 'operations' | 'city' | 'zone' | 'id'>): string {
  const op = p.operations[0] === 'alquiler' ? 'alquiler' : p.operations[0] === 'traspaso' ? 'traspaso' : 'venta';
  const place = [p.city, p.zone && p.zone !== p.city ? p.zone : null].filter(Boolean).join(' ');
  return slugify(`${p.type} ${op} ${place} ${p.id}`);
}

function altFor(type: string, city: string | null, zone: string | null, i: number): string {
  const where = [zone, city].filter(Boolean).join(', ');
  return `${type}${where ? ' en ' + where : ''} — fotografía ${i}`;
}

export function mapProperty(raw: Raw): Property | null {
  const id = str(raw.id) ?? str(raw.cod_ofer);
  const type = str(raw.tipo_ofer) ?? 'Inmueble';
  const operations = parseOperations(str(raw.accion));
  if (!id || operations.length === 0) return null;

  const city = str(raw.ciudad);
  const zoneRaw = str(raw.zona);
  const zone = zoneRaw && zoneRaw.toLowerCase() !== city?.toLowerCase() ? zoneRaw : null;

  const photos: Property['photos'] = [];
  const total = int(raw.numfotos) ?? 60;
  for (let i = 1; i <= Math.min(total, 60); i++) {
    const url = str(raw[`foto${i}`]);
    if (url) photos.push({ url: url.replace(/^http:/, 'https:'), alt: altFor(type, city, zone, photos.length + 1) });
  }

  const doubles = int(raw.habdobles) ?? 0;
  const singles = int(raw.habitaciones) ?? 0;
  const lat = num(raw.latitud);
  // Inmovilla publica la longitud en el campo «altitud».
  const lngRaw = str(raw.altitud) ?? str(raw.longitud);
  const lng = lngRaw !== null && Number.isFinite(Number(lngRaw)) ? Number(lngRaw) : null;

  const salePrice = operations.includes('venta') ? num(raw.precioinmo) : null;
  const rentPrice = operations.includes('alquiler') ? num(raw.precioalq) : null;
  const transferPrice = operations.includes('traspaso') ? (num(raw.preciotraspaso) ?? num(raw.precioinmo)) : null;

  const features = Object.entries(FEATURE_LABELS)
    .filter(([key]) => flag(raw[key]))
    .map(([, label]) => label);

  const condition = str(raw.conservacion);

  const property: Property = {
    id,
    ref: str(raw.ref),
    slug: '',
    operations,
    status: 'disponible',
    type,
    typeGroup: typeGroupOf(type),
    title: tidyTitle(str(raw.titulo1)),
    description: cleanDescription(str(raw.descrip1)),
    salePrice,
    rentPrice,
    transferPrice,
    city,
    zone,
    postalCode: str(raw.cp),
    province: str(raw.provincia),
    bedrooms: doubles + singles > 0 ? doubles + singles : null,
    bathrooms: int(raw.banyos),
    toilets: int(raw.aseos),
    builtArea: area(raw.m_cons),
    usableArea: area(raw.m_uties) ?? area(raw.m_utiles),
    plotArea: area(raw.m_parcela),
    floor: null,
    yearBuilt: (() => {
      const y = int(raw.antiguedad);
      return y && y > 1700 && y <= new Date().getFullYear() + 3 ? y : null;
    })(),
    condition: condition && !/^ninguno$/i.test(condition) ? condition : null,
    energy: {
      letter: energyLetter(raw.energialetra),
      value: num(raw.energiavalor),
      status: ENERGY_STATUS[str(raw.energiarecibido) ?? ''] ?? null,
    },
    emissions: { letter: energyLetter(raw.emisionesletra), value: num(raw.emisionesvalor) },
    communityFee: num(raw.gastos_com),
    features,
    photos,
    approxLocation: lat !== null && lng !== null && lng !== 0 ? { lat, lng } : null,
    featured: flag(raw.destacado),
    updatedAt: str(raw.fechaact),
  };
  // Si el certificado no se ha aportado, la letra que venga no es fiable.
  if (property.energy.status === 'pendiente' && property.energy.letter === 'G' && property.energy.value === null) {
    property.energy.letter = null;
  }
  property.slug = buildSlug(property);
  return property;
}

export function parseInmovillaXml(xml: string): Property[] {
  const parser = new XMLParser({
    ignoreAttributes: true,
    parseTagValue: false,
    trimValues: true,
    isArray: (name) => name === 'propiedad',
  });
  const doc = parser.parse(xml) as { propiedades?: { propiedad?: Raw[] } };
  const list = doc.propiedades?.propiedad ?? [];
  const seen = new Set<string>();
  const out: Property[] = [];
  for (const raw of list) {
    const p = mapProperty(raw);
    if (!p || seen.has(p.id)) continue;
    seen.add(p.id);
    out.push(p);
  }
  return out;
}
