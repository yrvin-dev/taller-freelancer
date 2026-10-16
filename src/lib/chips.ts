// Color de los chips de stack, portado de `chipColor` del export: algunas tecnologías
// tienen color fijo (TECH) y el resto sale de un hash del nombre, siempre el mismo.

/** Índice de la paleta `--chip-1` … `--chip-6` (PAL del export). */
export type ChipColor = 1 | 2 | 3 | 4 | 5 | 6;

const PALETTE_SIZE = 6;

// Índices del export (0 = naranja … 5 = azul tinta), ya pasados a 1–6.
const TECH: Record<string, ChipColor> = {
  Astro: 1,
  Tailwind: 2,
  React: 3,
  'React Native': 3,
  'Next.js 15': 6,
  'Next.js': 6,
  'Spring Boot': 2,
  Angular: 5,
  PostgreSQL: 3,
  MySQL: 3,
  'Framer Motion': 5,
  GSAP: 2,
  'Medusa.js': 6,
  Redis: 5,
  NestJS: 5,
  Prisma: 6,
  Mapbox: 3,
  'Node.js': 2,
  Firebase: 4,
  Expo: 6,
};

export function chipColor(tech: string): ChipColor {
  const fixed = TECH[tech];
  if (fixed) return fixed;
  let index = 0;
  for (const char of tech) index = (index + char.charCodeAt(0)) % PALETTE_SIZE;
  return (index + 1) as ChipColor;
}
