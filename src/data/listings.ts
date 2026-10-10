import type { Operation } from '../lib/inventory/types';

/** Textos de los listados por operación (/comprar/, /alquilar/, /traspasos/). */
export const LISTING_COPY: Record<
  Operation,
  { crumb: string; title: string; titleEm: string; seoTitle: string; description: string; intro: string }
> = {
  venta: {
    crumb: 'Comprar',
    title: 'Viviendas',
    titleEm: 'en venta',
    seoTitle: 'Pisos y casas en venta en Moratalaz y Madrid',
    description:
      'Pisos, áticos y chalets en venta en Moratalaz y otras zonas de Madrid. Filtra por precio, superficie y dormitorios y solicita información o una visita con Aljumar.',
    intro: 'Inmuebles en venta gestionados directamente por nuestro equipo. Filtra por zona, precio o dormitorios y pídenos información o una visita.',
  },
  alquiler: {
    crumb: 'Alquilar',
    title: 'Viviendas',
    titleEm: 'en alquiler',
    seoTitle: 'Pisos y casas en alquiler en Moratalaz y Madrid',
    description:
      'Viviendas en alquiler en Moratalaz y Madrid gestionadas por Aljumar Inmuebles. Consulta precios, características y solicita una visita.',
    intro: 'Viviendas en alquiler con contrato y gestión profesional. Si buscas algo concreto y no lo ves aquí, cuéntanoslo.',
  },
  traspaso: {
    crumb: 'Traspasos',
    title: 'Locales y negocios',
    titleEm: 'en traspaso',
    seoTitle: 'Traspasos de locales y negocios',
    description: 'Locales y negocios en traspaso gestionados por Aljumar Inmuebles en Madrid.',
    intro: 'Locales y negocios en traspaso. Si quieres traspasar tu negocio, también podemos ayudarte.',
  },
};
