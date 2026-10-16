import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Mide contra los valores reales de tokens.css: si alguien cambia un color de la
// rampa o de fondo y rompe el AA del texto secundario, este test falla.

const css = readFileSync(join(process.cwd(), 'src/styles/tokens.css'), 'utf8');

/** Declaraciones `--nombre: valor` de un bloque con ese selector exacto. */
function block(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`No existe el bloque ${selector}`);
  const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start));
  return Object.fromEntries(
    [...body.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [name!, value!.trim()]),
  );
}

function luminance(hex: string): number {
  const channels = hex
    .replace('#', '')
    .match(/../g)!
    .map((c) => parseInt(c, 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  const [r, g, b] = channels as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** color-mix(in srgb, a p%, b) en sRGB, como lo calcula el navegador. */
function mix(a: string, b: string, weight: number): string {
  const ca = a
    .replace('#', '')
    .match(/../g)!
    .map((c) => parseInt(c, 16));
  const cb = b
    .replace('#', '')
    .match(/../g)!
    .map((c) => parseInt(c, 16));
  return `#${ca
    .map((v, i) => Math.round(v * weight + cb[i]! * (1 - weight)))
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('')}`;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

const derived = block('[data-theme]');

describe('contraste del texto secundario (AA 4.5:1)', () => {
  it('label y placeholder son colores sólidos de la rampa', () => {
    expect(derived['--color-label']).toBe('var(--color-neutral-700)');
    expect(derived['--color-placeholder']).toBe('var(--color-neutral-600)');
  });

  describe.each(['light', 'dark'] as const)('tema %s', (theme) => {
    const base = block(`[data-theme='${theme}']`);
    const variants = ['pizarra', 'salvia'].map((bg) => ({
      ...base,
      ...block(`[data-theme='${theme}'][data-bg='${bg}']`),
    }));
    const palettes = { arena: base, pizarra: variants[0]!, salvia: variants[1]! };

    it.each(Object.entries(palettes))('fondo %s: label sobre bg y surface', (_, tokens) => {
      const label = tokens['--color-neutral-700']!;
      expect(contrast(label, tokens['--color-bg']!)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(label, tokens['--color-surface']!)).toBeGreaterThanOrEqual(4.5);
    });

    it.each(Object.entries(palettes))('fondo %s: texto de los chips de stack', (_, tokens) => {
      const root = block(':root');
      for (const n of [1, 2, 3, 4, 5, 6]) {
        const chipBg = mix(root[`--chip-${n}`]!, tokens['--color-surface']!, 0.2);
        expect(contrast(tokens['--color-text']!, chipBg)).toBeGreaterThanOrEqual(4.5);
      }
    });

    it.each(Object.entries(palettes))('fondo %s: placeholder sobre surface', (_, tokens) => {
      expect(
        contrast(tokens['--color-neutral-600']!, tokens['--color-surface']!),
      ).toBeGreaterThanOrEqual(4.5);
    });
  });
});
