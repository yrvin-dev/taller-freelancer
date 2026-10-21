import { createServerClient } from '@supabase/ssr';
import { DEMO_EMAIL, DEMO_PASSWORD, FULL_PROJECT_CODE } from './demo-user';

export type DemoSession = {
  /** Cookies de Supabase tal como las pondría /auth/callback. */
  cookies: { name: string; value: string }[];
  projectId: string;
};

/**
 * Entra como el usuario demo sin pasar por Google: `@supabase/ssr` arma las mismas
 * cookies que la app. Lo usan `auth.setup.ts` (Playwright) y `pnpm a11y:lighthouse`.
 */
export async function demoSession(): Promise<DemoSession> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o _ANON_KEY (.env.local).');
  }

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
  if (error) {
    throw new Error(`No se pudo entrar como demo (¿pnpm db:start y seed?): ${error.message}`);
  }

  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('code', FULL_PROJECT_CODE)
    .single();
  if (!project) throw new Error(`El usuario demo no tiene el proyecto ${FULL_PROJECT_CODE}.`);

  return { cookies: [...jar].map(([name, value]) => ({ name, value })), projectId: project.id };
}
