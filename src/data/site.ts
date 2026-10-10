import settings from './settings.json';

/** «91 333 90 83» → «+34913339083». */
export function toTel(display: string): string {
  const digits = display.replace(/\D/g, '');
  return digits.startsWith('34') && digits.length === 11 ? `+${digits}` : `+34${digits}`;
}

/**
 * Datos del negocio. Los que cambian con más frecuencia (teléfonos, correo,
 * WhatsApp, horario y equipo) están en settings.json, editable desde /admin/. Fuente: web actual aljumar.es (cabecera, pie, aviso
 * legal y política de privacidad), revisada el 10/10/2026. Cualquier cambio
 * debe confirmarlo Aljumar: ver docs/audit/current-state.md («Datos a
 * confirmar»).
 *
 * Lo que no está verificado se deja en null y la web no lo muestra.
 */
export const site = {
  name: 'Aljumar Inmuebles',
  legalName: 'ALJUMAR INMUEBLES E INVERSIONES S.L.',
  /** CIF publicado en el aviso legal actual. */
  taxId: 'B85663631',
  foundingYear: 1998,
  url: 'https://aljumar.es',
  email: settings.email,
  phones: {
    office: { display: settings.phoneOffice, tel: toTel(settings.phoneOffice) },
    mobile: { display: settings.phoneMobile, tel: toTel(settings.phoneMobile) },
  },
  /**
   * WhatsApp: la web actual muestra un botón (plugin WP Social Chat) pero no
   * se ha podido verificar a qué número enlaza. Mientras sea null no se
   * muestra ningún enlace de WhatsApp.
   */
  whatsapp: settings.whatsapp ? { display: settings.whatsapp, number: toTel(settings.whatsapp).slice(1) } : null,
  address: {
    street: 'Calle Arroyo Belincoso, 38',
    note: 'Esquina Vinateros',
    postalCode: '28030',
    city: 'Madrid',
    district: 'Moratalaz',
    region: 'Comunidad de Madrid',
    country: 'ES',
  },
  /** Enlace a la dirección en un mapa (sin incrustar mapas de terceros). */
  mapUrl: 'https://www.openstreetmap.org/search?query=Calle%20Arroyo%20Belincoso%2038%2C%2028030%20Madrid',
  /** Horario: no publicado en la web actual → no se muestra hasta confirmarlo. */
  openingHours: settings.openingHours || null,
  /**
   * Redes sociales enlazadas hoy desde aljumar.es. Siguen con la marca antigua
   * «Look & Find Moratalaz»: no se muestran hasta que Aljumar confirme cuáles
   * usar (ver docs/audit/current-state.md).
   */
  social: [] as { name: string; url: string }[],
} as const;

export const nav = [
  { label: 'Comprar', href: '/comprar/' },
  { label: 'Alquilar', href: '/alquilar/' },
  { label: 'Vender mi vivienda', href: '/vender-mi-vivienda/' },
  { label: 'Sobre Aljumar', href: '/sobre-aljumar/' },
  { label: 'Consejos', href: '/consejos-inmobiliarios/' },
  { label: 'Contacto', href: '/contacto/' },
] as const;

/**
 * Equipo publicado en la web actual (nombres y fotos). No se publican
 * cargos ni teléfonos personales que no estén confirmados: el campo «role»
 * se muestra solo si Aljumar lo rellena desde /admin/.
 */
export const team = settings.team;
