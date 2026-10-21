'use server';

import { revalidatePath } from 'next/cache';
import { SESSION_EXPIRED, type ActionResult } from '@/lib/action-result';
import { autoCode, toProjectRow } from '@/lib/data/project-mapper';
import { todayIn, toISODate } from '@/lib/format';
import { fieldErrorsOf, projectSchema, type ProjectInput } from '@/lib/schemas';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type SaveProjectResult = ActionResult<{ id: string }>;

const UNIQUE_VIOLATION = '23505';
const CODE_TAKEN = 'Ya tienes un proyecto con ese código.';

type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

/**
 * Crea o actualiza un proyecto. Valida con el mismo `projectSchema` que el formulario
 * (el cliente no es de confianza) y escribe con la sesión del usuario: RLS pone el
 * `owner_id` y le impide tocar proyectos ajenos.
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

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return SESSION_EXPIRED;

  const result = projectId
    ? await updateProject(supabase, projectId, parsed.data)
    : await createProject(supabase, parsed.data);

  if (result.ok) {
    revalidatePath('/', 'layout'); // home, lista, ficha, calendario y badge de la sidebar
  }
  return result;
}

async function updateProject(
  supabase: Supabase,
  projectId: string,
  input: ProjectInput,
): Promise<SaveProjectResult> {
  const code = input.code ?? autoCode(input.name, todayIn().getFullYear());
  const { data, error } = await supabase
    .from('projects')
    .update(toProjectRow(input, code))
    .eq('id', projectId)
    .select('id')
    .maybeSingle();

  if (error?.code === UNIQUE_VIOLATION) {
    return { ok: false, error: 'Revisa los campos marcados.', fieldErrors: { code: CODE_TAKEN } };
  }
  if (error) return { ok: false, error: 'No pudimos guardar los cambios.' };
  // RLS: un proyecto ajeno o borrado no devuelve fila.
  if (!data) return { ok: false, error: 'No encontramos ese proyecto.' };
  return { ok: true, data: { id: data.id } };
}

async function createProject(supabase: Supabase, input: ProjectInput): Promise<SaveProjectResult> {
  const today = todayIn();
  const insert = (code: string) =>
    supabase
      .from('projects')
      .insert({
        ...toProjectRow(input, code),
        code,
        name: input.name,
        client: input.client,
        type: input.type,
      })
      .select('id')
      .single();

  // Código escrito: si choca, error en el campo. Automático: se prueban sufijos
  // (COL-2026, COL-2026-2, …) para que crear nunca falle por un código que nadie eligió.
  let { data, error } = await insert(input.code ?? autoCode(input.name, today.getFullYear()));
  for (let n = 2; !input.code && error?.code === UNIQUE_VIOLATION && n <= 9; n++) {
    ({ data, error } = await insert(`${autoCode(input.name, today.getFullYear())}-${n}`));
  }
  if (error?.code === UNIQUE_VIOLATION && input.code) {
    return { ok: false, error: 'Revisa los campos marcados.', fieldErrors: { code: CODE_TAKEN } };
  }
  if (error || !data) return { ok: false, error: 'No pudimos crear el proyecto.' };

  // Primer pago (adelanto) y primera nota. Sin transacción en PostgREST: si alguno
  // falla, se borra el proyecto recién creado para no dejarlo a medias.
  const children = await Promise.all([
    input.advancePen === null
      ? { error: null }
      : supabase.from('payments').insert({
          project_id: data.id,
          amount_pen: input.advancePen,
          paid_on: toISODate(today),
          concept: 'Adelanto',
        }),
    input.firstNote === null
      ? { error: null }
      : supabase.from('notes').insert({
          project_id: data.id,
          kind: 'nota',
          body: input.firstNote,
          noted_on: toISODate(today),
        }),
  ]);
  if (children.some((child) => child.error)) {
    await supabase.from('projects').delete().eq('id', data.id);
    return { ok: false, error: 'No pudimos crear el proyecto.' };
  }

  return { ok: true, data: { id: data.id } };
}
