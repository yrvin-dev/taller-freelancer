'use server';

import type { ActionResult } from '@/lib/action-result';
import { fieldErrorsOf, projectSchema } from '@/lib/schemas';

export type SaveProjectResult = ActionResult<{ id: string | null; persisted: boolean }>;

/**
 * Crea o actualiza un proyecto. Valida con el mismo `projectSchema` que el formulario:
 * el cliente no es de confianza. Hasta la tanda de datos solo valida (`persisted:
 * false`); entonces: insert/update con RLS, primer pago y primera nota, y
 * `revalidatePath`.
 */
export async function saveProject(
  input: unknown,
  projectId: string | null = null,
): Promise<SaveProjectResult> {
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Revisa los campos marcados.',
      fieldErrors: fieldErrorsOf(parsed.error),
    };
  }
  return { ok: true, data: { id: projectId, persisted: false } };
}
