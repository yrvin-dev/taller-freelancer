import { execSync } from 'node:child_process';

/**
 * Lee la URL y las claves de la instancia **local** (`supabase status`) y las pasa a los
 * tests por variables de entorno. Nunca se escriben en el repo: son las de tu Docker.
 */
export default function setup() {
  let raw: string;
  try {
    raw = execSync('pnpm --silent supabase status -o json', { encoding: 'utf8', stdio: 'pipe' });
  } catch {
    throw new Error('Supabase local no está corriendo. Levántalo con `pnpm db:start`.');
  }
  const status = JSON.parse(raw.slice(raw.indexOf('{'))) as Record<string, string>;
  const url = status.API_URL;
  const anon = status.ANON_KEY ?? status.PUBLISHABLE_KEY;
  const service = status.SERVICE_ROLE_KEY ?? status.SECRET_KEY;
  if (!url || !anon || !service) throw new Error('`supabase status` no devolvió URL y claves.');

  process.env.SUPABASE_TEST_URL = url;
  process.env.SUPABASE_TEST_ANON_KEY = anon;
  process.env.SUPABASE_TEST_SERVICE_ROLE_KEY = service;
}
