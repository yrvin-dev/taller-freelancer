import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { REMINDER_KINDS, toReminderDays, type ReminderKind } from './domain';
import type { OutgoingEmail, SendResult } from './email';
import { toISODate } from './format';
import { buildReminderEmail } from './reminder-email';
import { dueReminders, reminderKey } from './reminders';

// Tarea diaria de recordatorios (T30b). Corre con service_role (regla 5, uso
// documentado): lee los perfiles con recordatorios activados y sus proyectos, manda un
// correo por usuario y anota lo avisado en `reminder_log` para no repetirlo.

export type ReminderJobDeps = {
  admin: SupabaseClient<Database>;
  send: (email: OutgoingEmail, idempotencyKey: string) => Promise<SendResult>;
  /** "Hoy" en Lima (`todayIn()`); se inyecta para poder probarlo. */
  today: Date;
  /** URL base de la app, sin barra final. */
  siteUrl: string;
  /** Solo estos usuarios (tests de integración: no tocar otras cuentas de la base local). */
  userIds?: string[];
};

export type ReminderJobSummary = {
  /** Usuarios con recordatorios activados. */
  users: number;
  /** Correos enviados (uno por usuario con algo que avisar). */
  sent: number;
  /** Usuarios a los que no se pudo escribir: se reintenta al día siguiente. */
  failed: number;
};

const isReminderKind = (value: string): value is ReminderKind =>
  (REMINDER_KINDS as readonly string[]).includes(value);

export async function runReminderJob({
  admin,
  send,
  today,
  siteUrl,
  userIds,
}: ReminderJobDeps): Promise<ReminderJobSummary> {
  let query = admin
    .from('profiles')
    .select('id, display_name, reminder_days')
    .eq('reminders_enabled', true);
  if (userIds) query = query.in('id', userIds);
  const { data: profiles, error } = await query;
  if (error) throw new Error(`No se pudieron leer los perfiles: ${error.code}`);

  const summary: ReminderJobSummary = { users: profiles.length, sent: 0, failed: 0 };

  for (const profile of profiles) {
    try {
      const outcome = await remindUser(admin, profile, { send, today, siteUrl });
      if (outcome === 'sent') summary.sent++;
      if (outcome === 'failed') summary.failed++;
    } catch {
      // Un usuario con un problema no frena al resto. Solo el id: nunca el correo.
      console.error('Recordatorios: falló el usuario', profile.id);
      summary.failed++;
    }
  }
  return summary;
}

async function remindUser(
  admin: SupabaseClient<Database>,
  profile: { id: string; display_name: string; reminder_days: number },
  { send, today, siteUrl }: Omit<ReminderJobDeps, 'admin'>,
): Promise<'sent' | 'nothing' | 'failed'> {
  const [projects, log, user] = await Promise.all([
    admin
      .from('projects')
      .select('id, name, status, delivery_date, domain_expires, hosting_expires')
      .eq('owner_id', profile.id),
    admin.from('reminder_log').select('project_id, kind, due_on').eq('owner_id', profile.id),
    admin.auth.admin.getUserById(profile.id),
  ]);
  if (projects.error || log.error || user.error) throw new Error('lectura fallida');
  const to = user.data.user?.email;
  if (!to) return 'nothing';

  const sent = new Set(
    log.data.flatMap((row) =>
      isReminderKind(row.kind)
        ? [reminderKey({ projectId: row.project_id, kind: row.kind, dueOn: row.due_on })]
        : [],
    ),
  );
  const reminders = dueReminders(
    projects.data.map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      deliveryDate: p.delivery_date,
      domainExpires: p.domain_expires,
      hostingExpires: p.hosting_expires,
    })),
    today,
    toReminderDays(profile.reminder_days),
    sent,
  );
  if (!reminders.length) return 'nothing';

  const email = buildReminderEmail({ name: profile.display_name, reminders, siteUrl });
  const result = await send({ to, ...email }, `recordatorios-${profile.id}-${toISODate(today)}`);
  if (!result.ok) {
    console.error('Recordatorios: no se pudo enviar al usuario', profile.id);
    return 'failed';
  }

  // Solo lo que de verdad se envió queda anotado: si el envío falla, mañana se reintenta.
  const { error } = await admin.from('reminder_log').upsert(
    reminders.map((r) => ({
      project_id: r.projectId,
      owner_id: profile.id,
      kind: r.kind,
      due_on: r.dueOn,
    })),
    { onConflict: 'project_id,kind,due_on', ignoreDuplicates: true },
  );
  if (error) console.error('Recordatorios: no se pudo anotar el envío del usuario', profile.id);
  return 'sent';
}
