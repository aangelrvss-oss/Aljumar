/**
 * Importa los artículos del blog de WordPress (aljumar.es) a Markdown.
 *
 *   node scripts/import-wp-posts.ts
 *
 * Orígenes:
 *  - migration/wp-posts-html-2026-10-10.json: HTML completo de cada artículo
 *    (API REST de WordPress en modo JSONP, para que el HTML llegue intacto).
 *    Se convierte con turndown conservando encabezados, listas, negritas,
 *    cursivas y enlaces; los enlaces al dominio temporal o a la marca anterior
 *    se reescriben a las rutas nuevas.
 *  - migration/wp-posts-export-2026-10-10.json: metadatos (título, fechas,
 *    categoría, resumen). Su HTML llegó sin etiquetas de apertura; solo se usa
 *    como reserva si un artículo faltara en el volcado completo.
 *
 * Cada artículo conserva su slug, y por tanto su URL (/slug/).
 * Las menciones a la marca anterior «Look and Find Moratalaz» se sustituyen
 * por «Aljumar Inmuebles» (el original queda en el JSON de migración).
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import TurndownService from 'turndown';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodeEntities } from '../src/lib/inventory/text.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = resolve(root, 'migration/wp-posts-export-2026-10-10.json');
const SRC_HTML = resolve(root, 'migration/wp-posts-html-2026-10-10.json');
const OUT = resolve(root, 'src/content/blog');

interface WpPost {
  id: number;
  date: string;
  modified: string;
  slug: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  categories: number[];
}

/** Categorías de WordPress → temas del nuevo blog, orientados a la necesidad del lector. */
const CATEGORY: Record<number, string> = {
  1525: 'comprar-y-vender',
  1457: 'mercado-y-normativa',
  1454: 'hogar-y-reformas',
  1: 'comprar-y-vender',
};

/** Imagen destacada de cada artículo según el sitemap de Yoast (post-sitemap.xml, 10/10/2026). */
const IMAGES: Record<string, string> = {
  'cual-es-la-actualidad-del-mercado-inmobiliario-en-madrid': '2021/02/noticia_280920201045.jpg',
  'consejos-para-decorar-tu-cocina-de-manera-funcional': '2022/10/IMAGEN-PARA-POST-BLOG-lyf.jpg',
  'la-herencia-de-viviendas-ha-disminuido-notablemente-mientras-los-beneficiarios-buscan-vender': '2022/11/IMAGEN-PARA-POST-BLOG-LYF-L1.jpg',
  'consejos-para-recibir-el-invierno-sin-que-te-pille-por-sorpresa': '2022/11/IMAGEN-PARA-POST-BLOG-LYF.jpg',
  'planes-de-pension-o-amortizar-hipoteca-cual-es-mas-conveniente': '2022/12/IMAGEN-PARA-POST-BLOG-LOOK-AND-FIND.jpg',
  'los-expertos-inmobiliarios-preven-bajadas-en-las-compraventas-y-el-encarecimiento-de-los-alquileres': '2023/01/IMAGEN-look-and-find.jpg',
  'buscas-opciones-de-financiacion-las-hipotecas-a-tipo-mixto-pueden-ser-la-solucion': '2023/01/IMAGEN-LYF.jpg',
  'la-creciente-obsesion-de-ultima-tendencia-una-despensa-de-lujo': '2023/02/7GC-LYFM.jpg',
  'por-que-el-coworking-se-ha-consolidado-como-una-tendencia-en-el-mercado-inmobiliario': '2023/03/7GC-MORATALAZ.jpg',
  'principales-puntos-de-la-nueva-ley-de-vivienda-2023': '2023/04/7GC-MORATALAZ.jpg',
  'como-los-profesionales-inmobiliarios-afrontamos-la-venta-de-pisos-quemados': '2023/05/7G-MORATALAZ.jpg',
  'la-casa-perfecta-para-los-millennials-que-buscan-los-jovenes-en-un-hogar': '2023/07/7G-MORATALAZ-JUL.jpg',
  'el-juego-de-contrastes-como-mezclar-estilos-y-patrones-sin-que-parezca-un-accidente': '2023/08/7GC-MORATALAZ.jpg',
  'invertir-en-rehabilitacion-es-invertir-en-salud': '2024/04/hogares_saludables.jpg',
  'una-demanda-al-alza-impulsa-el-precio-de-la-vivienda': '2025/02/Precio_vivienda.jpg',
  'estafa-mediante-anuncio-de-piso-como-protegerse': '2025/02/Estafa.jpg',
  'check-list-de-los-documentos-que-necesitas-para-vender-tu-propiedad': '2023/08/1G-moratalaz-ago.jpg',
  'comprar-para-alquilar-es-este-un-buen-momento-para-invertir-en-propiedades': '2023/07/7GC-MORATALAZ.jpg',
  'alquilar-tu-vivienda-en-plataformas-de-alquiler-turistico-te-contamos-los-pros-y-los-contras-de-esta-practica': '2023/06/7G-MORATALAZ.jpg',
  'vendiendo-la-propiedad-familiar-en-un-divorcio-consideraciones-claves': '2023/03/7G-MORATALAZ.jpg',
  'la-novacion-de-la-hipoteca-una-alternativa-viable': '2023/02/7G-LOOK-AND-F.jpg',
  'vendiendo-mi-casa-con-un-impago-en-la-hipoteca-cuales-son-las-consecuencias': '2023/06/7GC-MORATALAZ.jpg',
  'vender-o-no-vender-es-la-decision': '2022/10/moratalaz-scaled.jpg',
  'grandes-ideas-de-renovacion-de-tu-hogar': '2022/10/LF-MORATALAZ.png',
  'invertir-en-vivienda-la-alternativa-para-aprovechar-la-inflacion-y-ahorrar': '2022/09/firma-contrato-scaled.jpg',
  '35961-2': '2022/08/LF-Moratalaz-2-1-scaled.jpg',
  'como-decorar-la-cocina-sin-salirse-del-presupuesto': '2022/08/LF-MORATALAZ.jpg',
  'lo-que-puede-ofrecerte-un-personal-shopper-inmobiliario': '2022/07/LF-Moratalaz-1-scaled.jpg',
  'son-las-viviendas-sostenibles-el-verdadero-futuro': '2022/07/LFMORATALAZ.png',
  'las-ideas-mas-divertidas-para-anadir-color-a-tu-cocina': '2022/07/LOOKANDFIND.jpg',
  'el-numero-de-actas-de-transparencia-y-prestamos-hipotecarios-se-estabiliza-segun-un-informe-publicado-por-el-consejo-general-del-notariado': '2022/07/look-and-find-scaled.jpg',
  'entra-en-vigor-la-ley-para-la-rehabilitacion-de-edificios-y-la-ley-de-calidad-de-la-arquitectura': '2022/07/look-and-find-imagen-scaled.jpg',
  'todo-lo-que-necesitas-saber-sobre-el-diseno-y-la-renovacion-de-ventanas': '2022/06/look-and-find-scaled.jpg',
  'como-tener-un-hogar-libre-de-estres': '2022/05/sdf.png',
  'las-cargas-de-una-vivienda': '2022/04/f.jpg',
  'hipoteca-solo-o-en-pareja': '2022/03/mortatalaz-2.jpg',
  'los-trucos-que-necesitas-para-que-tu-salon-parezca-mas-grande': '2022/03/moratalaz.png',
  'las-mejores-formas-de-dar-vida-a-tus-habitaciones': '2022/03/Imagen-1.png',
  'buscas-un-salon-familiar-mas-acogedor-te-ayudamos-a-conseguirlo': '2022/01/Diseno-sin-titulo-11.jpg',
  'energia-solar-ahorro-energetico-y-mucho-mas': '2022/01/moratalaz.jpg',
  'la-profesionalizacion-de-los-alquileres-un-tema-necesario-en-espana': '2021/12/moratalaz.jpg',
  'cuatro-propuestas-de-renovacion-para-la-cocina-con-poco-presupuesto': '2021/11/moratalaz-1.jpg',
  'preguntas-necesarias-antes-de-comprar-una-vivienda': '2021/11/moratalaz.jpg',
  'cuatro-puntos-para-saber-si-estas-preparado-para-comprar-una-vivienda': '2021/10/moratalaz-1.jpg',
  'cuestiones-a-una-inmobiliaria-si-quiero-vender-mi-vivienda': '2021/10/moratalaz.jpg',
  'alquiler-con-opcion-a-compra-un-metodo-que-gana-territorio-en-espana': '2021/09/Diseno-sin-titulo-3.jpg',
  'los-costos-que-asume-cada-una-de-las-partes-en-la-compraventa': '2021/09/moratalaz-1.jpg',
  'que-tan-buen-negocio-es-el-alquiler-turistico': '2021/09/moratalaz.jpg',
  'como-mejorar-la-eficiencia-energetica-en-el-hogar-y-vender-antes': '2021/08/moratalaz.jpg',
  'ideas-de-decoracion-con-plantas-de-interior': '2021/07/Diseno-sin-titulo-22.jpg',
  'home-staging-aplica-estas-tecnicas-y-vende-antes-y-mejor': '2021/07/moratazlaz.png',
  'cuales-son-los-gastos-que-se-afrontan-al-vender-un-inmueble': '2021/02/noticia_100220211406.jpg',
  'cuando-es-necesaria-la-inspeccion-tecnica-de-edificios': '2021/02/noticia_270120211705.jpg',
  'cuales-son-los-documentos-que-hacen-falta-para-vender-una-vivienda': '2021/02/noticia_110120211626.jpg',
  '5-razones-para-alquilar-un-inmueble-como-propietario': '2021/02/noticia_211220201551.jpg',
  'consejos-para-vender-una-vivienda-mas-rapido': '2021/02/noticia_091220201345.jpg',
  'por-que-es-necesario-el-certificado-de-eficiencia-energetica': '2021/02/noticia_241120201539.jpg',
  'las-ventajas-de-vender-una-vivienda-con-lookfind-moratalaz': '2021/02/noticia_111120201650.jpg',
  'los-mejores-sitios-para-practicar-deporte-al-aire-libre-en-madrid': '2021/06/lookandfind.png',
  'contrato-de-reserva-de-vivienda-todo-lo-que-necesitas-saber-antes-de-firmar': '2023/04/7G-MORATALAZ.jpg',
};

const LEGACY_BRAND = /\b(?:Look\s*(?:and|&|&amp;|y)\s*Find|LookandFind|Look&Find)(?:\s+Moratalaz)?\b/gi;

function inline(s: string): string {
  return decodeEntities(
    s
      .replace(/<\/?(strong|b|em|i|a|span|u|sup|sub)\b[^>]*>/gi, '')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(LEGACY_BRAND, 'Aljumar Inmuebles')
    .replace(/[ \t ]+/g, ' ')
    .replace(/\s+([,.;:!?)])/g, '$1')
    .trim();
}

/** Reconstruye Markdown a partir de un HTML al que le faltan las etiquetas de apertura. */
export function wpToMarkdown(html: string): string {
  const blocks: string[] = [];
  let list: string[] = [];
  const re = /([\s\S]*?)<\/(p|h[1-6]|li|ul|ol|blockquote|div|figure|table)>/gi;
  let m: RegExpExecArray | null;
  let last = 0;
  const flushList = (ordered: boolean) => {
    if (!list.length) return;
    blocks.push(list.map((t, i) => (ordered ? `${i + 1}. ${t}` : `- ${t}`)).join('\n'));
    list = [];
  };
  while ((m = re.exec(html))) {
    last = re.lastIndex;
    const text = inline(m[1] ?? '');
    const tag = (m[2] ?? '').toLowerCase();
    if (tag === 'li') {
      if (text) list.push(text);
      continue;
    }
    if (tag === 'ul' || tag === 'ol') {
      if (text) list.push(text);
      flushList(tag === 'ol');
      continue;
    }
    flushList(false);
    if (!text) continue;
    if (/^h[1-6]$/.test(tag)) {
      const level = Math.min(Math.max(Number(tag[1]), 2), 4);
      blocks.push(`${'#'.repeat(level)} ${text.replace(/[.:]$/, '')}`);
    } else if (tag === 'blockquote') {
      blocks.push(`> ${text}`);
    } else {
      blocks.push(text);
    }
  }
  flushList(false);
  const tail = inline(html.slice(last));
  if (tail) blocks.push(tail);
  return blocks.join('\n\n') + '\n';
}

/** Enlaces de la web antigua → rutas de la nueva (sin pasar por redirecciones). */
const LINK_MAP: [RegExp, string][] = [
  [/^\/(comprar|ofertas)\b.*$/, '/comprar/'],
  [/^\/alquilar\b.*$/, '/alquilar/'],
  [/^\/(servicios|quieres-vender)\b.*$/, '/vender-mi-vivienda/'],
  [/^\/(nuestra-esencia)\b.*$/, '/sobre-aljumar/'],
  [/^\/(formulario-cliente|contacto)\b.*$/, '/contacto/'],
  [/^\/blog\b.*$/, '/consejos-inmobiliarios/'],
];

export function rewriteHref(href: string, slugs: Set<string>): string {
  let url: URL;
  try {
    url = new URL(href, 'https://aljumar.es');
  } catch {
    return href;
  }
  const host = url.hostname.replace(/^www\./, '');
  if (!/^(aljumar\.es(\.mialias\.net)?|lookandfind\.es)$/.test(host)) return href;
  if (host === 'lookandfind.es') return '/';
  const path = url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`;
  if (path === '/') return '/';
  const slug = path.replace(/^\/|\/$/g, '');
  if (slugs.has(slug)) return `/${slug}/`;
  for (const [re, to] of LINK_MAP) if (re.test(path)) return to;
  return '/';
}

export function htmlToMarkdown(html: string, slugs: Set<string>): string {
  const td = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-', emDelimiter: '*', strongDelimiter: '**' });
  td.remove(['script', 'style', 'iframe', 'img', 'figure', 'noscript']);
  // Subrayados: sin equivalente en Markdown; se conserva el texto.
  td.addRule('subrayado', { filter: ['u', 'span'], replacement: (c) => c });
  // h1 dentro del cuerpo → h2 (el título de la página es el único h1).
  td.addRule('h1', { filter: 'h1', replacement: (c) => `\n\n## ${c.trim()}\n\n` });
  td.addRule('enlaces', {
    filter: (node) => node.nodeName === 'A' && Boolean((node as HTMLElement).getAttribute('href')),
    replacement: (content, node) => {
      const text = content.trim();
      if (!text) return '';
      const href = rewriteHref((node as HTMLElement).getAttribute('href') ?? '', slugs);
      return `[${text}](${href})`;
    },
  });
  const cleaned = html
    // Marca anterior: solo en el texto visible, nunca dentro de atributos (URL).
    .replace(/>([^<]+)</g, (_, text: string) => `>${text.replace(LEGACY_BRAND, 'Aljumar Inmuebles')}<`)
    .replace(/&nbsp;|\u00a0/g, ' ')
    // Negritas y cursivas vacías o solo con espacios (frecuentes en el editor)
    .replace(/<(strong|b|em|i)>(\s*)<\/\1>/g, '$2')
    // Los espacios dentro de <strong> impiden que Markdown reconozca la negrita:
    // se sacan fuera de la etiqueta.
    .replace(/<(strong|b|em|i)>(\s+)/g, '$2<$1>')
    .replace(/(\s+)<\/(strong|b|em|i)>/g, '</$2>$1');
  return (
    td
      .turndown(cleaned)
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^#{4,} /gm, '### ')
      .trim() + '\n'
  );
}

function yamlString(s: string): string {
  return JSON.stringify(s);
}

function main() {
  const posts = JSON.parse(readFileSync(SRC, 'utf8')) as WpPost[];
  const full = existsSync(SRC_HTML)
    ? new Map((JSON.parse(readFileSync(SRC_HTML, 'utf8')) as { id: number; content: { rendered: string } }[]).map((p) => [p.id, p.content.rendered]))
    : new Map<number, string>();
  const slugs = new Set(posts.map((p) => p.slug));
  let fromFull = 0;
  mkdirSync(OUT, { recursive: true });
  for (const f of readdirSync(OUT)) if (f.endsWith('.md')) unlinkSync(resolve(OUT, f));
  let replaced = 0;
  for (const p of posts) {
    const rawText = p.content.rendered;
    const hadLegacy = new RegExp(LEGACY_BRAND.source, 'i').test(full.get(p.id) ?? rawText) || /lookfind/.test(p.slug);
    if (hadLegacy) replaced++;
    const title = inline(p.title.rendered);
    const description = inline(p.excerpt.rendered).replace(/\s*\[…\]$|\s*\[&hellip;\]$/, '').replace(/…$/, '');
    const html = full.get(p.id);
    if (html) fromFull++;
    const body = html ? htmlToMarkdown(html, slugs) : wpToMarkdown(rawText);
    const image = IMAGES[p.slug] ? `/wp-content/uploads/${IMAGES[p.slug]}` : null;
    const fm = [
      '---',
      `title: ${yamlString(title)}`,
      `description: ${yamlString(description.length > 300 ? description.slice(0, 297).replace(/\s+\S*$/, '') + '…' : description)}`,
      `pubDate: ${p.date.slice(0, 10)}`,
      `updatedDate: ${p.modified.slice(0, 10)}`,
      `topic: ${CATEGORY[p.categories[0] ?? 1] ?? 'comprar-y-vender'}`,
      image ? `image: ${yamlString(image)}` : null,
      `wpId: ${p.id}`,
      hadLegacy ? 'legacyBrandReplaced: true' : null,
      '---',
      '',
    ]
      .filter((l) => l !== null)
      .join('\n');
    writeFileSync(resolve(OUT, `${p.slug}.md`), fm + body);
  }
  console.log(`✓ ${posts.length} artículos importados en src/content/blog (${fromFull} con HTML completo; marca anterior sustituida en ${replaced}).`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
