/**
 * Resultado de una Server Action (convención del CLAUDE.md: `{ ok, error }`).
 * `fieldErrors` lleva un mensaje por campo cuando falla la validación con Zod.
 */
export type ActionResult<T = undefined> =
  { ok: true; data: T } | { ok: false; error: string; fieldErrors?: Record<string, string> };
