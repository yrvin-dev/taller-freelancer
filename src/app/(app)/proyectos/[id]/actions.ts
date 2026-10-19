'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { ActionResult } from '@/lib/action-result';
import { credentialAad, decrypt, encrypt, fromBytea, toBytea } from '@/lib/crypto';
import { credentialsKeyring } from '@/lib/env-server';
import { todayIn, toISODate } from '@/lib/format';
import type { Credential, Note } from '@/lib/projects';
import { credentialInputSchema, fieldErrorsOf, idSchema, noteInputSchema } from '@/lib/schemas';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const RevealInput = z.object({ projectId: idSchema, credentialId: idSchema });

// ── Escrituras de la ficha (T16b). Todas con la sesión del usuario: RLS solo deja
//    tocar lo suyo, y una fila ajena simplemente no aparece (0 filas → error). ──

const EXPIRED = 'Tu sesión expiró. Vuelve a entrar.';

async function session() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { supabase, userId: user.id } : null;
}

async function sessionClient() {
  return (await session())?.supabase ?? null;
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

// ── Credenciales (T17a). El secreto se cifra aquí (servidor) y en la base solo queda
//    el cifrado. Nunca se registra en logs ni viaja en el HTML inicial (regla 6). ──

/** Cifra y guarda una credencial. Devuelve la credencial **sin** el secreto. */
export async function addCredential(input: unknown): Promise<ActionResult<Credential>> {
  const parsed = credentialInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Revisa los campos marcados.',
      fieldErrors: fieldErrorsOf(parsed.error),
    };
  }
  const auth = await session();
  if (!auth) return { ok: false, error: EXPIRED };

  const { projectId, label, username, url, secret } = parsed.data;
  const encrypted = encrypt(
    secret,
    credentialAad(auth.userId, projectId),
    credentialsKeyring().current,
  );

  const { data, error } = await auth.supabase
    .from('credentials')
    .insert({
      project_id: projectId,
      owner_id: auth.userId,
      label,
      username,
      url,
      secret_ciphertext: toBytea(encrypted.ciphertext),
      secret_iv: toBytea(encrypted.iv),
      secret_tag: toBytea(encrypted.tag),
      key_version: encrypted.keyVersion,
    })
    .select('id, label, username, url')
    .single();
  // Proyecto ajeno: falla por RLS o por la FK compuesta. Mismo mensaje.
  if (error || !data) return { ok: false, error: 'No pudimos guardar la credencial.' };
  revalidatePath(`/proyectos/${projectId}`);
  return { ok: true, data };
}

/**
 * Devuelve el secreto solo a quien pulsa "Mostrar" o "Copiar" (03 §7): RLS limita la
 * lectura al dueño y el descifrado verifica tag, clave y datos asociados.
 */
export async function revealCredential(input: unknown): Promise<ActionResult<{ secret: string }>> {
  const parsed = RevealInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Solicitud inválida.' };
  const auth = await session();
  if (!auth) return { ok: false, error: EXPIRED };

  const { data } = await auth.supabase
    .from('credentials')
    .select('owner_id, project_id, secret_ciphertext, secret_iv, secret_tag, key_version')
    .eq('id', parsed.data.credentialId)
    .eq('project_id', parsed.data.projectId)
    .maybeSingle();
  if (!data) return { ok: false, error: 'No encontramos esa credencial.' };

  const key = credentialsKeyring().byVersion(data.key_version);
  try {
    if (!key) throw new Error('clave no disponible');
    const secret = decrypt(
      {
        ciphertext: fromBytea(data.secret_ciphertext),
        iv: fromBytea(data.secret_iv),
        tag: fromBytea(data.secret_tag),
      },
      credentialAad(data.owner_id, data.project_id),
      key,
    );
    return { ok: true, data: { secret } };
  } catch {
    // Solo el id: nunca el cifrado ni el secreto.
    console.error('No se pudo descifrar la credencial', parsed.data.credentialId);
    return { ok: false, error: 'No pudimos descifrar esta credencial.' };
  }
}

/** Borra una credencial (ya confirmada en la misma línea). */
export async function deleteCredential(credentialId: unknown): Promise<ActionResult> {
  const id = idSchema.safeParse(credentialId);
  if (!id.success) return { ok: false, error: 'Credencial inválida.' };
  const supabase = await sessionClient();
  if (!supabase) return { ok: false, error: EXPIRED };

  const { data, error } = await supabase
    .from('credentials')
    .delete()
    .eq('id', id.data)
    .select('project_id');
  if (error || !data?.length) return { ok: false, error: 'No pudimos borrar la credencial.' };
  revalidatePath(`/proyectos/${data[0]!.project_id}`);
  return { ok: true, data: undefined };
}
