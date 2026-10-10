/**
 * Contraste WCAG 2.2 de las combinaciones de color que usa la web, leídas de
 * src/styles/tokens.css (si alguien cambia un color, esta prueba lo detecta).
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('../../src/styles/tokens.css', import.meta.url), 'utf8');
const token = (name: string) => {
  const m = css.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, 'i'));
  if (!m) throw new Error(`Token --${name} no encontrado`);
  return m[1]!;
};

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}
export function ratio(a: string, b: string) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1! + 0.05) / (l2! + 0.05);
}

const pairs: [string, string, number][] = [
  // [texto, fondo, mínimo]
  ['ink', 'white', 4.5],
  ['ink', 'bg', 4.5],
  ['ink-2', 'white', 4.5],
  ['ink-2', 'bg', 4.5],
  ['navy-700', 'white', 4.5], // enlaces y botones
  ['navy-900', 'white', 4.5],
  ['white', 'navy-700', 4.5], // botón principal
  ['white', 'navy-900', 4.5],
  ['navy-950', 'lime-500', 4.5], // botón de acento
  ['lime-500', 'navy-900', 4.5], // detalles lima sobre azul
  ['navy-200', 'navy-950', 4.5], // texto del pie
  ['danger', 'danger-bg', 4.5],
  ['success', 'success-bg', 4.5],
  ['warning', 'warning-bg', 4.5],
  ['navy-700', 'white', 3], // foco visible (WCAG 2.4.13 / 1.4.11)
];

describe('Contraste de color (WCAG AA)', () => {
  for (const [fg, bg, min] of pairs) {
    it(`${fg} sobre ${bg} ≥ ${min}:1`, () => {
      expect(ratio(token(fg), token(bg))).toBeGreaterThanOrEqual(min);
    });
  }

  it('el lima nunca es apto como texto sobre blanco (regla del sistema)', () => {
    expect(ratio(token('lime-500'), token('white'))).toBeLessThan(3);
  });
});
