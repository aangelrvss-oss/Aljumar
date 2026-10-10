/**
 * Tarjeta de inmueble: modelo y HTML compartidos por la compilación (Astro) y
 * el buscador del navegador, para que una tarjeta pintada en el servidor y
 * otra añadida al filtrar sean idénticas. Sin dependencias de Astro ni del DOM.
 *
 * Robustez: título generado (no el del CRM, que a veces es una frase larga o
 * repite datos), dos líneas como máximo, datos ausentes omitidos y marcador
 * de marca cuando no hay foto o la foto falla.
 */
import type { Operation, Property } from './types.ts';
import { formatArea, formatPrice, headline, mainArea, placeLabel, priceFor } from './format.ts';

export interface CardModel {
  id: string;
  href: string;
  operation: Operation;
  price: string;
  headline: string;
  place: string;
  specs: string[];
  photo: { url: string; alt: string } | null;
  photoCount: number;
  status: string | null;
}

export function cardModel(p: Property, operation: Operation = p.operations[0] ?? 'venta'): CardModel {
  const area = mainArea(p);
  const specs: string[] = [];
  if (p.bedrooms !== null) specs.push(`${p.bedrooms} ${p.bedrooms === 1 ? 'dormitorio' : 'dormitorios'}`);
  if (p.bathrooms !== null) specs.push(`${p.bathrooms} ${p.bathrooms === 1 ? 'baño' : 'baños'}`);
  if (area) specs.push(formatArea(area.value)!);
  const photo = p.photos[0];
  return {
    id: p.id,
    href: `/inmueble/${p.slug}/`,
    operation,
    price: formatPrice(priceFor(p, operation), operation),
    headline: headline(p),
    place: placeLabel(p),
    specs,
    photo: photo ? { url: photo.url, alt: photo.alt } : null,
    photoCount: p.photos.length,
    status: p.status === 'disponible' ? null : p.status === 'reservado' ? 'Reservado' : p.status[0]!.toUpperCase() + p.status.slice(1),
  };
}

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ESC[c]!);

export interface CardOptions {
  /** La primera tarjeta visible carga su foto con prioridad. */
  eager?: boolean;
  heading?: 'h2' | 'h3';
  /** Muestra «En venta» / «En alquiler» (contextos con operaciones mezcladas). */
  showOperation?: boolean;
  /** Tamaños de la imagen para el navegador. */
  sizes?: string;
}

export function renderCard(m: CardModel, o: CardOptions = {}): string {
  const h = o.heading ?? 'h3';
  const img = m.photo
    ? `<img src="${esc(m.photo.url)}" alt="${esc(m.photo.alt)}" width="640" height="480" loading="${o.eager ? 'eager' : 'lazy'}"${o.eager ? ' fetchpriority="high"' : ''} decoding="async" data-fallback>`
    : '';
  const op = o.showOperation ? `<span class="pcard__op">${m.operation === 'venta' ? 'En venta' : m.operation === 'alquiler' ? 'En alquiler' : 'En traspaso'}</span>` : '';
  const status = m.status ? `<span class="pcard__status">${esc(m.status)}</span>` : '';
  const count = m.photoCount > 1 ? `<span class="pcard__count">${m.photoCount} fotos</span>` : '';
  const specs = m.specs.length
    ? `<ul class="pcard__specs" aria-label="Características principales">${m.specs.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>`
    : '';
  return (
    `<article class="pcard" data-property-card data-id="${esc(m.id)}">` +
    `<div class="pcard__media">${img}<span class="pcard__ph" aria-hidden="true"><span>Sin fotografías publicadas</span></span>${status}${count}</div>` +
    `<div class="pcard__body">` +
    `<p class="pcard__price">${op}${esc(m.price)}</p>` +
    `<${h} class="pcard__title"><a href="${esc(m.href)}">${esc(m.headline)}</a></${h}>` +
    `<p class="pcard__place">${esc(m.place)}</p>` +
    specs +
    `</div></article>`
  );
}

