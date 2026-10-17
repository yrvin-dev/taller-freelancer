'use server';

import type { ActionResult } from '@/lib/action-result';
import { fieldErrorsOf, preferencesSchema } from '@/lib/schemas';

/**
 * Guarda las preferencias de Cuenta. Hasta la tanda de datos solo valida
 * (`persisted: false`); entonces: update de `profiles` con RLS (id = auth.uid()).
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
  return { ok: true, data: { persisted: false } };
}
