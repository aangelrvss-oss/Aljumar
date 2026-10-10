import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Artículos del blog («Consejos inmobiliarios»). El nombre del archivo es el
 * slug y la URL pública es /<slug>/, la misma que en WordPress.
 * Se editan desde /admin/ (Sveltia CMS) o directamente en Markdown.
 */
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string().min(5),
    description: z.string().min(20),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    topic: z.enum(['comprar-y-vender', 'mercado-y-normativa', 'hogar-y-reformas']),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    wpId: z.number().optional(),
    legacyBrandReplaced: z.boolean().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
