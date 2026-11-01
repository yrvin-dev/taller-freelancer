'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { SESSION_EXPIRED, type ActionResult } from '@/lib/action-result';
import { fieldErrorsOf, preferencesSchema, reminderPrefsSchema } from '@/lib/schemas';
import { toReminderDays } from '@/lib/domain';
import { sendEmail } from '@/lib/email';
import { publicEnv } from '@/lib/env';
import { remindersAvailable } from '@/lib/env-server';
import { todayIn } from '@/lib/format';
import { buildTestReminderEmail } from '@/lib/reminder-email';
import { dueReminders } from '@/lib/reminders';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { removeOwnerThumbnails } from '@/lib/thumbnail-storage';

/**
 * Guarda las preferencias de Cuenta en `profiles`. RLS ("perfil: editar el propio")
 * solo deja tocar la fila del usuario de la sesión; el `eq('id', …)` no es la
 * barrera, la base lo es.
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

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return SESSION_EXPIRED;

  const { error } = await supabase
    .from('profiles')
    .update({ display_name: parsed.data.displayName, base_path: parsed.data.basePath })
    .eq('id', user.id);
  if (error) return { ok: false, error: 'No pudimos guardar tus preferencias.' };

  // El saludo de la home y la sidebar leen el perfil.
  revalidatePath('/', 'layout');
  return { ok: true, data: { persisted: true } };
}

/**
 * Guarda los recordatorios por correo (T30a): activados o no y con cuántos días de
 * anticipación. Como las preferencias, RLS solo deja tocar el perfil propio.
 */
export async function saveReminders(input: unknown): Promise<ActionResult> {
  const parsed = reminderPrefsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Revisa los recordatorios.',
      fieldErrors: fieldErrorsOf(parsed.error),
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return SESSION_EXPIRED;

  const { data, error } = await supabase
    .from('profiles')
    .update({ reminders_enabled: parsed.data.enabled, reminder_days: parsed.data.days })
    .eq('id', user.id)
    .select('id');
  if (error || !data?.length) return { ok: false, error: 'No pudimos guardar los recordatorios.' };

  revalidatePath('/cuenta');
  return { ok: true, data: undefined };
}

/** Correos de prueba por usuario en 24 h: suficiente para probar, no para abusar. */
const TEST_EMAILS_PER_DAY = 3;

/**
 * "Enviar correo de prueba" (T30b): manda al correo de la sesión lo que recibiría hoy
 * (sin anotarlo en `reminder_log`, así no se pierde el aviso real). El límite se cuenta
 * con service_role en una tabla que el navegador no puede tocar.
 */
export async function sendTestReminder(): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return SESSION_EXPIRED;
  if (!user.email || !remindersAvailable()) {
    return { ok: false, error: 'El envío de correos no está disponible.' };
  }

  const admin = createSupabaseAdminClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await admin
    .from('reminder_test_sends')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', user.id)
    .gte('sent_at', since);
  if (countError) return { ok: false, error: 'No pudimos enviar el correo de prueba.' };
  if ((count ?? 0) >= TEST_EMAILS_PER_DAY) {
    return {
      ok: false,
      error: `Ya enviaste ${TEST_EMAILS_PER_DAY} correos de prueba hoy. Vuelve a intentarlo mañana.`,
    };
  }

  const [{ data: profile }, { data: projects }] = await Promise.all([
    supabase.from('profiles').select('display_name, reminder_days').eq('id', user.id).single(),
    supabase
      .from('projects')
      .select('id, name, status, delivery_date, domain_expires, hosting_expires'),
  ]);
  const leadDays = toReminderDays(profile?.reminder_days);
  const siteUrl = (publicEnv().NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');
  const email = buildTestReminderEmail({
    name: profile?.display_name ?? user.email,
    leadDays,
    siteUrl,
    reminders: dueReminders(
      (projects ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        deliveryDate: p.delivery_date,
        domainExpires: p.domain_expires,
        hostingExpires: p.hosting_expires,
      })),
      todayIn(),
      leadDays,
    ),
  });

  const result = await sendEmail({ to: user.email, ...email });
  if (!result.ok) {
    console.error('Correo de prueba: falló el envío del usuario', user.id);
    return { ok: false, error: 'No pudimos enviar el correo de prueba.' };
  }
  await admin.from('reminder_test_sends').insert({ owner_id: user.id });
  return { ok: true, data: undefined };
}

/**
 * Borra la cuenta del usuario de la sesión y, en cascada, su perfil, proyectos, pagos,
 * notas y credenciales; después, su carpeta de miniaturas en Storage. El id sale SOLO
 * de la sesión (no recibe argumentos): nadie puede borrar otra cuenta. Si sale bien,
 * cierra la sesión y redirige al login.
 */
export async function deleteAccount(): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return SESSION_EXPIRED;

  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error('No se pudo borrar la cuenta', user.id);
    return { ok: false, error: 'No pudimos borrar tu cuenta. Inténtalo de nuevo.' };
  }
  // Con el usuario ya borrado, su sesión no sirve: los archivos los borra el admin.
  try {
    await removeOwnerThumbnails(admin, user.id);
  } catch {
    console.error('No se pudieron borrar las miniaturas de la cuenta', user.id);
  }

  // El usuario ya no existe: signOut limpia las cookies de sesión (si falla, igual se van).
  await supabase.auth.signOut().catch(() => undefined);
  revalidatePath('/', 'layout');
  redirect('/login?cuenta=borrada');
}
