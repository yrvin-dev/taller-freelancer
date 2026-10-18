'use server';

import { redirect } from 'next/navigation';
import { safeNextPath } from '@/lib/auth-routes';
import { publicEnv } from '@/lib/env';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * "Continuar con Google": pide a Supabase la URL de Google y redirige allí. Google
 * vuelve a Supabase y Supabase a `/auth/callback?next=…` (con `next` ya saneado).
 */
export async function signInWithGoogle(formData: FormData): Promise<never> {
  const next = safeNextPath(formData.get('next')?.toString());
  const callback = new URL('/auth/callback', publicEnv().NEXT_PUBLIC_SITE_URL);
  if (next !== '/') callback.searchParams.set('next', next);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: callback.toString() },
  });

  if (error || !data.url) redirect('/login?error=oauth');
  redirect(data.url);
}
