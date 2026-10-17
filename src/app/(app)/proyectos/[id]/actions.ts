'use server';

import { z } from 'zod';
import type { ActionResult } from '@/lib/action-result';
import { mockSecret } from '@/lib/mock/secrets';

const Id = z.string().regex(/^[\w-]{1,64}$/);
const RevealInput = z.object({ projectId: Id, credentialId: Id });

/**
 * Devuelve el secreto de una credencial solo a quien pulsa "Mostrar" o "Copiar"
 * (03 §seguridad). Hoy lee los secretos de prueba; con la base: comprobar la sesión,
 * leer la fila (RLS limita al dueño), descifrar con AES-256-GCM y no registrar nada.
 */
export async function revealCredential(input: unknown): Promise<ActionResult<{ secret: string }>> {
  const parsed = RevealInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Solicitud inválida.' };

  const secret = mockSecret(parsed.data.projectId, parsed.data.credentialId);
  if (!secret) return { ok: false, error: 'No encontramos esa credencial.' };
  return { ok: true, data: { secret } };
}
