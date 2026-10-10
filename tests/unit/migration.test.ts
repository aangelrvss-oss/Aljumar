import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseCsv } from '../../scripts/gen-redirects.ts';
import { wpToMarkdown } from '../../scripts/import-wp-posts.ts';

const csv = readFileSync(new URL('../../docs/migration/redirect-map.csv', import.meta.url), 'utf8');
const rules = parseCsv(csv);
const posts = readdirSync(new URL('../../src/content/blog/', import.meta.url)).map((f) => f.replace(/\.md$/, ''));

describe('Mapa de redirecciones', () => {
  it('todas las reglas tienen origen y destino válidos', () => {
    expect(rules.length).toBeGreaterThan(30);
    for (const r of rules) {
      expect(r.to.startsWith('/')).toBe(true);
      if (r.kind === 'exacta') expect(r.from).toMatch(/^\/.*\/$/);
      else expect(() => new RegExp(r.from)).not.toThrow();
    }
  });

  it('no hay cadenas ni bucles: ningún destino es a su vez un origen', () => {
    for (const r of rules) {
      for (const other of rules) {
        if (other.kind === 'exacta') expect(other.from).not.toBe(r.to);
        else expect(new RegExp(other.from).test(r.to), `${r.to} coincide con ${other.from}`).toBe(false);
      }
    }
  });

  it('ninguna redirección captura las URL de los artículos del blog que se conservan', () => {
    for (const slug of posts) {
      const path = `/${slug}/`;
      for (const r of rules) {
        if (r.kind === 'exacta') expect(r.from).not.toBe(path);
        else expect(new RegExp(r.from).test(path), `${path} ↔ ${r.from}`).toBe(false);
      }
    }
  });
});

describe('Importación del blog', () => {
  it('reconstruye párrafos, encabezados y listas sin etiquetas de apertura', () => {
    const md = wpToMarkdown('Intro con negrita</strong>.</p>\nTítulo</h2>\nUno</li>\nDos</li>\n</ul>\nFinal</p>');
    expect(md).toBe('Intro con negrita.\n\n## Título\n\n- Uno\n- Dos\n\nFinal\n');
  });

  it('sustituye la marca anterior', () => {
    expect(wpToMarkdown('En Look And Find Moratalaz te ayudamos</p>')).toContain('En Aljumar Inmuebles te ayudamos');
    expect(wpToMarkdown('Con Look &amp; Find</p>')).toContain('Con Aljumar Inmuebles');
  });

  it('los 60 artículos migrados no contienen la marca anterior', () => {
    expect(posts).toHaveLength(60);
    for (const slug of posts) {
      const body = readFileSync(new URL(`../../src/content/blog/${slug}.md`, import.meta.url), 'utf8').replace(/^image:.*$/m, '');
      expect(body, slug).not.toMatch(/look\s*(and|&|y)\s*find/i);
    }
  });
});
