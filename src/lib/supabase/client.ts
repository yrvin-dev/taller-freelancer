'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/database.types';
import { publicEnv } from '@/lib/env';

/** Cliente de Supabase en el navegador (clave pública + sesión en cookies; RLS). */
export function createSupabaseBrowserClient() {
  const env = publicEnv();
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
