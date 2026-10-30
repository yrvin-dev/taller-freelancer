// Rutas que auditan axe (a11y.spec.ts) y Lighthouse (scripts/lighthouse-a11y.ts).
// `id` es el proyecto completo del usuario demo (FULL_PROJECT_CODE).

export const THEMES = ['light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

export const PRIVATE_ROUTES: [name: string, path: (id: string) => string][] = [
  ['inicio', () => '/'],
  ['proyectos (tarjetas)', () => '/proyectos'],
  ['proyectos (tabla)', () => '/proyectos?vista=tabla'],
  ['proyectos (sin resultados)', () => '/proyectos?q=zzzz'],
  ['ficha · resumen', (id) => `/proyectos/${id}`],
  ['ficha · cliente', (id) => `/proyectos/${id}?tab=cliente`],
  ['ficha · stack', (id) => `/proyectos/${id}?tab=stack`],
  ['ficha · accesos', (id) => `/proyectos/${id}?tab=accesos`],
  ['ficha · pagos', (id) => `/proyectos/${id}?tab=pagos`],
  ['ficha · notas', (id) => `/proyectos/${id}?tab=notas`],
  ['nuevo proyecto', () => '/proyectos/nuevo'],
  ['editar proyecto', (id) => `/proyectos/${id}/editar`],
  ['calendario', () => '/calendario'],
  ['cuenta', () => '/cuenta'],
  ['403', () => '/403'],
  ['404', () => '/no-existe'],
];

export const PUBLIC_ROUTES: [name: string, path: string][] = [
  ['login', '/login'],
  ['privacidad', '/privacidad'],
];
