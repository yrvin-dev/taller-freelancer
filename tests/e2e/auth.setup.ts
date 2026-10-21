import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { test as setup } from '@playwright/test';
import { createServerClient } from '@supabase/ssr';
import {
  AUTH_FILE,
  DATA_FILE,
  DEMO_EMAIL,
  DEMO_PASSWORD,
  FULL_PROJECT_CODE,
  type SeedData,
} from './demo-user';

// Entra como el usuario demo sin pasar por Google: `@supabase/ssr` arma las mismas
// cookies que pondría /auth/callback, y se guardan para el resto de los tests.
setup('sesión del usuario demo', async ({ context, baseURL }) => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey)
    throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o _ANON_KEY (.env.local).');

  const jar = new Map<string, string>();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (cookies) => cookies.forEach(({ name, value }) => jar.set(name, value)),
    },
  });

  const { error } = await supabase.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  });
  if (error)
    throw new Error(`No se pudo entrar como demo (¿pnpm db:start y seed?): ${error.message}`);

  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('code', FULL_PROJECT_CODE)
    .single();
  if (!project) throw new Error(`El usuario demo no tiene el proyecto ${FULL_PROJECT_CODE}.`);

  await context.addCookies([...jar].map(([name, value]) => ({ name, value, url: baseURL! })));
  mkdirSync(dirname(AUTH_FILE), { recursive: true });
  await context.storageState({ path: AUTH_FILE });
  writeFileSync(DATA_FILE, JSON.stringify({ projectId: project.id } satisfies SeedData));
});
