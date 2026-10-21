import { readFileSync } from 'node:fs';

// Usuario demo del seed local (supabase/seed.sql): solo existe en tu Docker y
// `db reset` lo recrea. Nunca hay que apuntar los e2e a producción.
export const DEMO_EMAIL = 'demo@taller-freelancer.local';
export const DEMO_PASSWORD = 'demo-local-2026';

/** Cookies de la sesión y datos del seed (ignorados en git: `tests/e2e/.auth/`). */
export const AUTH_FILE = 'tests/e2e/.auth/demo.json';
export const DATA_FILE = 'tests/e2e/.auth/data.json';

/** Proyecto con monto, pagos, credenciales y notas: llena todas las pestañas. */
export const FULL_PROJECT_CODE = 'PLV-2026';

export type SeedData = { projectId: string };

/** Se lee dentro de cada test: el archivo lo escribe `auth.setup.ts` antes de correr. */
export function seedData(): SeedData {
  return JSON.parse(readFileSync(DATA_FILE, 'utf8')) as SeedData;
}
