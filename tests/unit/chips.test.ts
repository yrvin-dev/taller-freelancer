import { chipColor } from '@/lib/chips';
import { parseProjectView, stackChips } from '@/lib/projects';

describe('chipColor', () => {
  it('usa el color fijo del export para las tecnologías conocidas', () => {
    expect(chipColor('Astro')).toBe(1);
    expect(chipColor('Tailwind')).toBe(2);
    expect(chipColor('Next.js')).toBe(6);
    expect(chipColor('PostgreSQL')).toBe(3);
  });

  it('para el resto, el hash del export: estable y dentro de la paleta', () => {
    expect(chipColor('Lenis')).toBe(4); // (76+101+110+105+115) % 6 = 3 → chip-4
    expect(chipColor('Lenis')).toBe(chipColor('Lenis'));
    for (const tech of ['Motion', 'Culqi', 'Supabase Storage', 'X', '']) {
      expect(chipColor(tech)).toBeGreaterThanOrEqual(1);
      expect(chipColor(tech)).toBeLessThanOrEqual(6);
    }
  });
});

describe('stackChips', () => {
  it('toma hasta 4 de frontend, backend y db (sin hosting)', () => {
    expect(
      stackChips({
        stack: {
          frontend: ['Next.js', 'Tailwind'],
          backend: ['Medusa v2', 'Culqi'],
          db: ['PostgreSQL'],
          hosting: ['Vercel'],
        },
      }),
    ).toEqual(['Next.js', 'Tailwind', 'Medusa v2', 'Culqi']);
  });
});

describe('parseProjectView', () => {
  it.each([
    ['tabla', 'tabla'],
    [undefined, 'tarjetas'],
    ['tarjetas', 'tarjetas'],
    ['otra', 'tarjetas'],
    [['tabla', 'x'], 'tarjetas'],
  ] as const)('%s → %s', (value, expected) => {
    expect(parseProjectView(value as string | string[] | undefined)).toBe(expected);
  });
});
