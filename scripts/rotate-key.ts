// Rota CREDENTIALS_KEY: re-cifra todas las credenciales con la clave nueva.
//
//   1. Genera la clave nueva:  openssl rand -base64 32
//   2. En el entorno (.env.local o Vercel):
//        CREDENTIALS_KEY_PREVIOUS = la clave actual
//        CREDENTIALS_KEY          = la clave nueva
//        CREDENTIALS_KEY_VERSION  = la versión actual + 1
//      Mientras tanto la app lee las dos versiones (env-server.ts).
//   3. Verifica sin escribir:  pnpm rotate-key --dry-run
//   4. Rota:                   pnpm rotate-key
//   5. Con 0 fallos, borra CREDENTIALS_KEY_PREVIOUS.
//
// Necesita NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (tarea de admin,
// CLAUDE.md regla 5). Nunca imprime secretos ni claves.

import { createClient } from '@supabase/supabase-js';
import { rotateCredentials } from '@/lib/credentials-rotation';
import type { Database } from '@/lib/database.types';
import { credentialsKeyring } from '@/lib/env-server';

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.');
  }

  const ring = credentialsKeyring();
  const previousVersion = ring.current.version - 1;
  const previous = ring.byVersion(previousVersion);
  if (!previous) {
    throw new Error('Falta CREDENTIALS_KEY_PREVIOUS (la clave actual) para rotar.');
  }

  const admin = createClient<Database>(url, serviceKey, { auth: { persistSession: false } });
  const report = await rotateCredentials(
    admin,
    { previous: { version: previousVersion, key: previous }, current: ring.current },
    { dryRun },
  );

  console.log(
    `${dryRun ? 'Verificación (sin escribir)' : 'Rotación'}: v${previousVersion} → v${ring.current.version} · ` +
      `${report.rotated} ${dryRun ? 'se pueden rotar' : 'rotadas'} · ${report.failed.length} con error`,
  );
  if (report.failed.length) {
    console.error(`No se pudieron descifrar (ids): ${report.failed.join(', ')}`);
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Error inesperado en la rotación.');
  process.exitCode = 1;
});
