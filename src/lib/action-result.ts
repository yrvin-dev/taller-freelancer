/** Resultado de una Server Action (convención del CLAUDE.md: `{ ok, error }`). */
export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };
