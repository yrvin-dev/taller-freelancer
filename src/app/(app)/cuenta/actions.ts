'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { SESSION_EXPIRED, type ActionResult } from '@/lib/action-result';
import { fieldErrorsOf, preferencesSchema } from '@/lib/schemas';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
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
  if (!user) return SESSION_EXPIRED;

  const { error } = await supabase
    .from('profiles')
    .update({ display_name: parsed.data.displayName, base_path: parsed.data.basePath })
    .eq('id', user.id);
  if (error) return { ok: false, error: 'No pudimos guardar tus preferencias.' };

  // El saludo de la home y la sidebar leen el perfil.
  revalidatePath('/', 'layout');
  return { ok: true, data: { persisted: true } };
}

/**
 * Borra la cuenta del usuario de la sesión y, en cascada, su perfil, proyectos, pagos,
 * notas y credenciales. El id sale SOLO de la sesión (no recibe argumentos): nadie
 * puede borrar otra cuenta. Si sale bien, cierra la sesión y redirige al login.
 */
export async function deleteAccount(): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return SESSION_EXPIRED;

  const { error } = await createSupabaseAdminClient().auth.admin.deleteUser(user.id);
  if (error) {
    console.error('No se pudo borrar la cuenta', user.id);
    return { ok: false, error: 'No pudimos borrar tu cuenta. Inténtalo de nuevo.' };
  }

  // El usuario ya no existe: signOut limpia las cookies de sesión (si falla, igual se van).
  await supabase.auth.signOut().catch(() => undefined);
  revalidatePath('/', 'layout');
  redirect('/login?cuenta=borrada');
}
