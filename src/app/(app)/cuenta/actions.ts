'use server';

import { revalidatePath } from 'next/cache';
import type { ActionResult } from '@/lib/action-result';
import { fieldErrorsOf, preferencesSchema } from '@/lib/schemas';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Guarda las preferencias de Cuenta en `profiles`. RLS ("perfil: editar el propio")
 * solo deja tocar la fila del usuario de la sesión; el `eq('id', …)` no es la
 * barrera, la base lo es.
 */
export async function savePreferences(
  input: unknown,
): Promise<ActionResult<{ persisted: boolean }>> {
  const parsed = preferencesSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Revisa el campo marcado.',
      fieldErrors: fieldErrorsOf(parsed.error),
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Tu sesión expiró. Vuelve a entrar.' };

  const { error } = await supabase
    .from('profiles')
    .update({ display_name: parsed.data.displayName, base_path: parsed.data.basePath })
    .eq('id', user.id);
  if (error) return { ok: false, error: 'No pudimos guardar tus preferencias.' };

  // El saludo de la home y la sidebar leen el perfil.
  revalidatePath('/', 'layout');
  return { ok: true, data: { persisted: true } };
}
