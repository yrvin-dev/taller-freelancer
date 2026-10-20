import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { publicEnv } from '@/lib/env';
import { serviceRoleKey } from '@/lib/env-server';

/**
 * Cliente con `service_role`: SE SALTA RLS. Uso exclusivo y documentado (regla 5):
 * `deleteAccount` borra al usuario de la sesión de `auth.users`, algo que un usuario
 * no puede hacer con su propia sesión. Nunca recibe un id que venga del navegador.
 */
export function createSupabaseAdminClient() {
  return createClient<Database>(publicEnv().NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
