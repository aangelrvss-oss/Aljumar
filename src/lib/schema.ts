/**
 * Datos estructurados (schema.org). Solo se publican datos verificados en
 * src/data/site.ts: sin valoraciones, reseñas ni horarios inventados.
 */
import { site } from '../data/site';
import type { Property } from './inventory/types.ts';
import { headline, priceFor, primaryOperation } from './inventory/format.ts';

export function organizationSchema(base: URL): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    '@id': new URL('/#organizacion', base).href,
    name: site.name,
    legalName: site.legalName,
    url: new URL('/', base).href,
    logo: new URL('/og/aljumar.png', base).href,
    image: new URL('/og/aljumar.png', base).href,
    email: site.email,
    telephone: site.phones.office.tel,
    foundingDate: String(site.foundingYear),
    taxID: site.taxId,
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.address.street,
      postalCode: site.address.postalCode,
      addressLocality: site.address.city,
      addressRegion: site.address.region,
      addressCountry: site.address.country,
    },
    areaServed: { '@type': 'City', name: 'Madrid' },
  };
}

/** Ficha de inmueble: Offer de un producto residencial. Sin dirección exacta. */
export function propertySchema(p: Property, url: string): Record<string, unknown> {
  const op = primaryOperation(p);
  const price = priceFor(p, op);
  const offer: Record<string, unknown> = {
    '@type': 'Offer',
    url,
    availability: 'https://schema.org/InStock',
    businessFunction: op === 'alquiler' ? 'http://purl.org/goodrelations/v1#LeaseOut' : 'http://purl.org/goodrelations/v1#Sell',
    seller: { '@id': `${new URL('/#organizacion', url).href}` },
  };
  if (price !== null) {
    offer.price = price;
    offer.priceCurrency = 'EUR';
  }
  const accommodation: Record<string, unknown> = {
    '@type': p.typeGroup === 'chalet' ? 'SingleFamilyResidence' : p.typeGroup === 'vivienda' ? 'Apartment' : 'Accommodation',
    name: headline(p),
    address: {
      '@type': 'PostalAddress',
      addressLocality: p.city ?? undefined,
      postalCode: p.postalCode ?? undefined,
      addressCountry: 'ES',
    },
  };
  if (p.bedrooms !== null) accommodation.numberOfBedrooms = p.bedrooms;
  if (p.bathrooms !== null) accommodation.numberOfBathroomsTotal = p.bathrooms;
  const area = p.builtArea ?? p.usableArea;
  if (area !== null) accommodation.floorSize = { '@type': 'QuantitativeValue', value: area, unitCode: 'MTK' };
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: p.title ?? headline(p),
    url,
    image: p.photos.slice(0, 6).map((f) => f.url),
    description: p.description?.slice(0, 500),
    ...(p.updatedAt ? { dateModified: p.updatedAt } : {}),
    about: accommodation,
    offers: offer,
  };
}
