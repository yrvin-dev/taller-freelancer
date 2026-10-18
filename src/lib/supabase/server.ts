import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/database.types';
import { publicEnv } from '@/lib/env';

/**
 * Cliente de Supabase para Server Components, Server Actions y Route Handlers. Usa
 * la sesión del usuario (cookies) y la clave pública: toda query pasa por RLS
 * (CLAUDE.md, regla 5). Nunca la `service_role`.
 */
export async function createSupabaseServerClient() {
  const env = publicEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet)
              cookieStore.set(name, value, options);
          } catch {
            // Desde un Server Component no se pueden escribir cookies: el middleware ya
            // refrescó la sesión en este mismo pedido.
          }
        },
      },
    },
  );
}
