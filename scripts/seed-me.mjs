// SOLO LOCAL: `pnpm db:seed-me tu@correo.com` copia los proyectos de ejemplo del
// usuario demo a tu cuenta (supabase/scripts/seed-me.sql) en la Supabase de Docker.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const email = process.argv[2];
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Uso: pnpm db:seed-me tu@correo.com');
  process.exit(1);
}

const container = 'supabase_db_taller-freelancer'; // project_id de supabase/config.toml
const sql = readFileSync(new URL('../supabase/scripts/seed-me.sql', import.meta.url));
const result = spawnSync(
  'docker',
  ['exec', '-i', container, 'psql', '-U', 'postgres', '-q', '-v', `email=${email}`, '-f', '-'],
  { input: sql, stdio: ['pipe', 'inherit', 'inherit'] },
);
process.exit(result.status ?? 1);
