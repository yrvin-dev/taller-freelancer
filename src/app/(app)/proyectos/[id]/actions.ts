'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { SESSION_EXPIRED, type ActionFailure, type ActionResult } from '@/lib/action-result';
import { credentialAad, decrypt, encrypt, fromBytea, toBytea } from '@/lib/crypto';
import { credentialsKeyring } from '@/lib/env-server';
import { formatPEN, todayIn, toISODate } from '@/lib/format';
import type { Credential, Note, Payment } from '@/lib/projects';
import {
  credentialInputSchema,
  fieldErrorsOf,
  idSchema,
  noteInputSchema,
  paymentInputSchema,
} from '@/lib/schemas';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { toThumbnailWebp } from '@/lib/thumbnail-image';
import { removeProjectThumbnails } from '@/lib/thumbnail-storage';
import {
  isStoragePath,
  THUMBNAIL_BUCKET,
  thumbnailError,
  thumbnailObjectPath,
} from '@/lib/thumbnails';

const RevealInput = z.object({ projectId: idSchema, credentialId: idSchema });

// ── Escrituras de la ficha (T16b). Todas con la sesión del usuario: RLS solo deja
//    tocar lo suyo, y una fila ajena simplemente no aparece (0 filas → error). ──

type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

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

/**
 * Elimina el proyecto con sus pagos, notas y credenciales (cascada en la base) y
 * después sus miniaturas de Storage, que no tiene cascadas.
 */
export async function deleteProject(projectId: unknown): Promise<ActionResult> {
  const id = idSchema.safeParse(projectId);
  if (!id.success) return { ok: false, error: 'Proyecto inválido.' };
  const current = await session();
  if (!current) return SESSION_EXPIRED;

  const { data, error } = await current.supabase
    .from('projects')
    .delete()
    .eq('id', id.data)
    .select('id');
  if (error || !data?.length) return { ok: false, error: 'No pudimos eliminar el proyecto.' };
  try {
    await removeProjectThumbnails(current.supabase, current.userId, id.data);
  } catch {
    // El proyecto ya no existe: un archivo que quede no se muestra en ningún lado.
    console.error('No se pudieron borrar las miniaturas del proyecto', id.data);
  }
  revalidatePath('/', 'layout');
  return { ok: true, data: undefined };
}

/** "Archivar en su lugar": lo saca de la vista sin borrar nada. */
export async function archiveProject(projectId: unknown): Promise<ActionResult> {
  const id = idSchema.safeParse(projectId);
  if (!id.success) return { ok: false, error: 'Proyecto inválido.' };
  const supabase = await sessionClient();
  if (!supabase) return SESSION_EXPIRED;

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
  if (!supabase) return SESSION_EXPIRED;

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
  if (!supabase) return SESSION_EXPIRED;

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

// ── Pagos parciales (T20b). El saldo se revisa contra el proyecto leído con RLS. ──

/** Registra un pago. No puede superar el saldo ni registrarse sin monto total. */
export async function addPayment(input: unknown): Promise<ActionResult<Payment>> {
  const parsed = paymentInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Revisa los campos marcados.',
      fieldErrors: fieldErrorsOf(parsed.error),
    };
  }
  const supabase = await sessionClient();
  if (!supabase) return SESSION_EXPIRED;

  const { projectId, amountPen, paidOn, concept } = parsed.data;
  const { data: project } = await supabase
    .from('projects')
    .select('budget_pen, payments ( amount_pen )')
    .eq('id', projectId)
    .maybeSingle();
  if (!project) return { ok: false, error: 'No encontramos ese proyecto.' };
  if (project.budget_pen === null) {
    return { ok: false, error: 'Registra primero el monto total desde Editar.' };
  }
  // En céntimos enteros, como `paidPen` (sin errores de coma flotante).
  const cents = (v: number | string) => Math.round(Number(v) * 100);
  const balance =
    cents(project.budget_pen) - project.payments.reduce((t, p) => t + cents(p.amount_pen), 0);
  if (cents(amountPen) > balance) {
    const message = `El pago supera el saldo (${formatPEN(Math.max(0, balance) / 100)}).`;
    return { ok: false, error: message, fieldErrors: { amountPen: message } };
  }

  const { data, error } = await supabase
    .from('payments')
    .insert({ project_id: projectId, amount_pen: amountPen, paid_on: paidOn, concept })
    .select('id, amount_pen, paid_on, concept')
    .single();
  if (error || !data) return { ok: false, error: 'No pudimos registrar el pago.' };
  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath('/');
  return {
    ok: true,
    data: {
      id: data.id,
      amountPen: Number(data.amount_pen),
      paidOn: data.paid_on,
      ...(data.concept ? { concept: data.concept } : {}),
    },
  };
}

/** Borra un pago (ya confirmado en la misma línea). */
export async function deletePayment(paymentId: unknown): Promise<ActionResult> {
  const id = idSchema.safeParse(paymentId);
  if (!id.success) return { ok: false, error: 'Pago inválido.' };
  const supabase = await sessionClient();
  if (!supabase) return SESSION_EXPIRED;

  const { data, error } = await supabase
    .from('payments')
    .delete()
    .eq('id', id.data)
    .select('project_id');
  if (error || !data?.length) return { ok: false, error: 'No pudimos borrar el pago.' };
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
  if (!auth) return SESSION_EXPIRED;

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
  if (!auth) return SESSION_EXPIRED;

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
  if (!supabase) return SESSION_EXPIRED;

  const { data, error } = await supabase
    .from('credentials')
    .delete()
    .eq('id', id.data)
    .select('project_id');
  if (error || !data?.length) return { ok: false, error: 'No pudimos borrar la credencial.' };
  revalidatePath(`/proyectos/${data[0]!.project_id}`);
  return { ok: true, data: undefined };
}

// ── Miniatura (T24a). Va aparte de saveProject: el formulario la manda después de
//    guardar el proyecto, solo si cambió. Storage tiene su propia política por dueño. ──

type ThumbnailTarget = {
  supabase: Supabase;
  userId: string;
  projectId: string;
  current: string | null;
};

/** Sesión + proyecto (leído con RLS) cuya miniatura se va a cambiar. */
async function thumbnailTarget(projectId: unknown): Promise<ThumbnailTarget | ActionFailure> {
  const id = idSchema.safeParse(projectId);
  if (!id.success) return { ok: false, error: 'Proyecto inválido.' };
  const current = await session();
  if (!current) return SESSION_EXPIRED;

  const { data } = await current.supabase
    .from('projects')
    .select('thumbnail_path')
    .eq('id', id.data)
    .maybeSingle();
  if (!data) return { ok: false, error: 'No encontramos ese proyecto.' };
  return { ...current, projectId: id.data, current: data.thumbnail_path };
}

/** Apunta el proyecto a `path` (o a ninguna) y borra la imagen anterior de Storage. */
async function swapThumbnail(target: ThumbnailTarget, path: string | null): Promise<boolean> {
  const { data, error } = await target.supabase
    .from('projects')
    .update({ thumbnail_path: path })
    .eq('id', target.projectId)
    .select('id');
  if (error || !data?.length) return false;
  // Si falla, queda un archivo huérfano en la carpeta del usuario: no rompe nada.
  if (isStoragePath(target.current)) {
    await target.supabase.storage.from(THUMBNAIL_BUCKET).remove([target.current]);
  }
  revalidatePath('/', 'layout');
  return true;
}

/** Sube la miniatura nueva (campo `thumbnail` del FormData) y reemplaza la anterior. */
export async function saveThumbnail(projectId: unknown, formData: FormData): Promise<ActionResult> {
  const file = formData.get('thumbnail');
  if (!(file instanceof File)) return { ok: false, error: 'Elige una imagen.' };
  const invalid = thumbnailError(file);
  if (invalid) return { ok: false, error: invalid };

  const target = await thumbnailTarget(projectId);
  if ('ok' in target) return target;

  const webp = await toThumbnailWebp(await file.arrayBuffer());
  if (!webp) return { ok: false, error: 'No pudimos leer la imagen. Usa un PNG, JPG o WebP.' };

  const path = thumbnailObjectPath(target.userId, target.projectId);
  const bucket = target.supabase.storage.from(THUMBNAIL_BUCKET);
  const { error } = await bucket.upload(path, webp, { contentType: 'image/webp' });
  if (error) return { ok: false, error: 'No pudimos guardar la miniatura.' };

  if (!(await swapThumbnail(target, path))) {
    await bucket.remove([path]);
    return { ok: false, error: 'No pudimos guardar la miniatura.' };
  }
  return { ok: true, data: undefined };
}

/** Quita la miniatura del proyecto. */
export async function removeThumbnail(projectId: unknown): Promise<ActionResult> {
  const target = await thumbnailTarget(projectId);
  if ('ok' in target) return target;
  if (!(await swapThumbnail(target, null))) {
    return { ok: false, error: 'No pudimos quitar la miniatura.' };
  }
  return { ok: true, data: undefined };
}
