/** Utilidades de texto compartidas por el adaptador y las páginas. */

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
  '&euro;': '€',
  '&aacute;': 'á',
  '&eacute;': 'é',
  '&iacute;': 'í',
  '&oacute;': 'ó',
  '&uacute;': 'ú',
  '&ntilde;': 'ñ',
  '&Aacute;': 'Á',
  '&Eacute;': 'É',
  '&Iacute;': 'Í',
  '&Oacute;': 'Ó',
  '&Uacute;': 'Ú',
  '&Ntilde;': 'Ñ',
  '&uuml;': 'ü',
  '&ordm;': 'º',
  '&ordf;': 'ª',
  '&sup2;': '²',
};

export function decodeEntities(input: string): string {
  return input
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&[a-z]+[0-9]?;/gi, (m) => ENTITIES[m] ?? m);
}

/**
 * Convierte la descripción del CRM en texto limpio con párrafos.
 * - Los saltos (<br>, ~ y |||, que usa Inmovilla) se convierten en párrafos.
 * - Se eliminan etiquetas HTML y restos rotos como «bbr>» que aparecen en la
 *   web antigua.
 */
export function cleanDescription(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let text = decodeEntities(String(raw));
  text = text
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    // Restos de <br> mal escapados en la web antigua: «bbr>», «br>», «b>»
    .replace(/b?br>/gi, "\n")
    .replace(/\|\|\|/g, '\n\n')
    .replace(/~/g, '\n')
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/ ([,.;:])/g, '$1')
    .trim();
  return text.length ? text : null;
}

/** Primera letra en mayúscula y el resto tal cual; corrige títulos en MAYÚSCULAS. */
export function tidyTitle(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let t = decodeEntities(String(raw)).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  t = t.replace(/\s+([,.;:!?])/g, '$1').replace(/[.]+$/, '');
  if (!t) return null;
  const letters = t.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, '');
  const upper = letters.replace(/[^A-ZÁÉÍÓÚÜÑ]/g, '');
  if (letters.length > 6 && upper.length / letters.length > 0.7) {
    t = t.toLocaleLowerCase('es-ES');
  } else {
    // Palabras sueltas en mayúsculas dentro de un título normal («Precioso ÁTICO»).
    // Se respetan las siglas cortas (VPO, ITE, ITP).
    t = t.replace(/\p{Lu}{4,}/gu, (w) => w.toLocaleLowerCase('es-ES'));
  }
  return t.charAt(0).toLocaleUpperCase('es-ES') + t.slice(1);
}

export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

/** Resumen de longitud acotada que corta por palabra. */
export function excerpt(text: string | null, max = 160): string {
  if (!text) return '';
  const flat = text.replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:.]$/, '') + '…';
}
