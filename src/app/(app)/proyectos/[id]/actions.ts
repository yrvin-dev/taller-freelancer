'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { ActionResult } from '@/lib/action-result';
import { todayIn, toISODate } from '@/lib/format';
import { mockSecret } from '@/lib/mock/secrets';
import type { Note } from '@/lib/projects';
import { idSchema, noteInputSchema } from '@/lib/schemas';
import { createSupabaseServerClient } from '@/lib/supabase/server';

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

// ── Escrituras de la ficha (T16b). Todas con la sesión del usuario: RLS solo deja
//    tocar lo suyo, y una fila ajena simplemente no aparece (0 filas → error). ──

const EXPIRED = 'Tu sesión expiró. Vuelve a entrar.';

async function sessionClient() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? supabase : null;
}

/** Elimina el proyecto con sus pagos, notas y credenciales (cascada en la base). */
export async function deleteProject(projectId: unknown): Promise<ActionResult> {
  const id = idSchema.safeParse(projectId);
  if (!id.success) return { ok: false, error: 'Proyecto inválido.' };
  const supabase = await sessionClient();
  if (!supabase) return { ok: false, error: EXPIRED };

  const { data, error } = await supabase.from('projects').delete().eq('id', id.data).select('id');
  if (error || !data?.length) return { ok: false, error: 'No pudimos eliminar el proyecto.' };
  revalidatePath('/', 'layout');
  return { ok: true, data: undefined };
}

/** "Archivar en su lugar": lo saca de la vista sin borrar nada. */
export async function archiveProject(projectId: unknown): Promise<ActionResult> {
  const id = idSchema.safeParse(projectId);
  if (!id.success) return { ok: false, error: 'Proyecto inválido.' };
  const supabase = await sessionClient();
  if (!supabase) return { ok: false, error: EXPIRED };

  const { data, error } = await supabase
    .from('projects')
    .update({ status: 'archivado' })
    .eq('id', id.data)
    .select('id');
  if (error || !data?.length) return { ok: false, error: 'No pudimos archivar el proyecto.' };
  revalidatePath('/', 'layout');
  return { ok: true, data: undefined };
}

/** Agrega una entrada a la bitácora con la fecha de hoy (Lima). */
export async function addNote(input: unknown): Promise<ActionResult<Note>> {
  const parsed = noteInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Entrada inválida.' };
  }
  const supabase = await sessionClient();
  if (!supabase) return { ok: false, error: EXPIRED };

  const { data, error } = await supabase
    .from('notes')
    .insert({
      project_id: parsed.data.projectId,
      kind: parsed.data.kind,
      body: parsed.data.body,
      noted_on: toISODate(todayIn()),
    })
    .select('id, kind, body, noted_on')
    .single();
  // Un proyecto ajeno falla por la FK compuesta o por RLS: mismo mensaje.
  if (error || !data) return { ok: false, error: 'No pudimos guardar la entrada.' };
  revalidatePath(`/proyectos/${parsed.data.projectId}`);
  revalidatePath('/');
  return {
    ok: true,
    data: { id: data.id, kind: data.kind, body: data.body, notedOn: data.noted_on },
  };
}

/** Borra una entrada de la bitácora (ya confirmada en la misma línea). */
export async function deleteNote(noteId: unknown): Promise<ActionResult> {
  const id = idSchema.safeParse(noteId);
  if (!id.success) return { ok: false, error: 'Entrada inválida.' };
  const supabase = await sessionClient();
  if (!supabase) return { ok: false, error: EXPIRED };

  const { data, error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id.data)
    .select('project_id');
  if (error || !data?.length) return { ok: false, error: 'No pudimos borrar la entrada.' };
  revalidatePath(`/proyectos/${data[0]!.project_id}`);
  revalidatePath('/');
  return { ok: true, data: undefined };
}
