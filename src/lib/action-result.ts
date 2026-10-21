/**
 * Resultado de una Server Action (convención del CLAUDE.md: `{ ok, error }`).
 * `fieldErrors` lleva un mensaje por campo cuando falla la validación con Zod.
 * `code: 'unauthorized'` indica que la sesión expiró: la UI abre el diálogo 401.
 */
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string>; code?: 'unauthorized' };

export type ActionFailure = Extract<ActionResult, { ok: false }>;

/** Lo devuelve toda acción que no encuentra la sesión (03 §7, 401). */
export const SESSION_EXPIRED = {
  ok: false,
  error: 'Tu sesión expiró. Vuelve a entrar.',
  code: 'unauthorized',
} as const satisfies ActionFailure;
