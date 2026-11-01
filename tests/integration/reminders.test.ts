import { randomUUID } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

// Recordatorios por correo contra la Supabase local: preferencias en el perfil y
// `reminder_log` (T30a); la tarea diaria y el correo de prueba con su límite (T30b).
// El envío se simula: nunca sale un correo real.

const url = process.env.SUPABASE_TEST_URL!;
const anonKey = process.env.SUPABASE_TEST_ANON_KEY!;
const admin = createClient<Database>(url, process.env.SUPABASE_TEST_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

const session = vi.hoisted(() => ({ client: null as unknown }));
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: async () => session.client,
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
const mail = vi.hoisted(() => ({ sent: [] as { to: string; subject: string }[], fail: false }));
vi.mock('@/lib/email', () => ({
  sendEmail: async (email: { to: string; subject: string }) => {
    if (mail.fail) return { ok: false, error: 'Resend caído' };
    mail.sent.push(email);
    return { ok: true, id: `email_${mail.sent.length}` };
  },
}));

const { saveReminders, sendTestReminder } = await import('@/app/(app)/cuenta/actions');
const { runReminderJob } = await import('@/lib/reminder-job');
const { sendEmail } = await import('@/lib/email');
const { todayIn, toISODate } = await import('@/lib/format');

type User = {
  id: string;
  email: string;
  client: SupabaseClient<Database>;
  projectId: string;
};
const createdUsers: string[] = [];

async function newUser(): Promise<User> {
  const email = `reminders-${randomUUID()}@rls.test`;
  const password = `pw-${randomUUID()}`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error('Sin usuario');
  createdUsers.push(data.user.id);
  const client = createClient<Database>(url, anonKey, { auth: { persistSession: false } });
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;

  const { data: project, error: projectError } = await client
    .from('projects')
    .insert({
      code: `R-${randomUUID().slice(0, 8).toUpperCase()}`,
      name: 'Con recordatorios',
      client: 'Cliente',
      type: 'landing',
    })
    .select('id')
    .single();
  if (projectError) throw projectError;
  return { id: data.user.id, email, client, projectId: project.id };
}

async function profileOf(userId: string) {
  const { data } = await admin
    .from('profiles')
    .select('reminders_enabled, reminder_days')
    .eq('id', userId)
    .single();
  return data;
}

let a: User;
let b: User;

beforeAll(async () => {
  a = await newUser();
  b = await newUser();
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', url);
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', anonKey);
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://tallerfreelance.com');
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_TEST_SERVICE_ROLE_KEY!);
  vi.stubEnv('REMINDERS_FROM', 'Taller Freelancer <recordatorios@tallerfreelance.com>');
});

afterAll(async () => {
  vi.unstubAllEnvs();
  for (const id of createdUsers) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) throw error;
  }
});

describe('preferencias de recordatorios', () => {
  it('un perfil nuevo los tiene desactivados, con 7 días', async () => {
    expect(await profileOf(a.id)).toEqual({ reminders_enabled: false, reminder_days: 7 });
  });

  it('saveReminders guarda las del usuario de la sesión', async () => {
    session.client = a.client;
    expect(await saveReminders({ enabled: true, days: 14 })).toEqual({ ok: true, data: undefined });
    expect(await profileOf(a.id)).toEqual({ reminders_enabled: true, reminder_days: 14 });
    expect(await profileOf(b.id)).toEqual({ reminders_enabled: false, reminder_days: 7 });
  });

  it('valida en el servidor y la base rechaza otros días', async () => {
    session.client = a.client;
    expect(await saveReminders({ enabled: true, days: 5 })).toMatchObject({ ok: false });
    const { error } = await a.client
      .from('profiles')
      .update({ reminder_days: 5 })
      .eq('id', a.id)
      .select('id');
    expect(error?.code).toBe('23514'); // check_violation
  });

  it('sin sesión no guarda nada', async () => {
    session.client = createClient<Database>(url, anonKey, { auth: { persistSession: false } });
    expect(await saveReminders({ enabled: true, days: 3 })).toMatchObject({
      ok: false,
      code: 'unauthorized',
    });
  });
});

describe('reminder_log', () => {
  const entry = (user: User, dueOn = '2026-11-05') => ({
    project_id: user.projectId,
    owner_id: user.id,
    kind: 'entrega',
    due_on: dueOn,
  });

  it('el usuario no puede escribir en el registro, ni siquiera lo suyo', async () => {
    const { error } = await a.client.from('reminder_log').insert(entry(a));
    expect(error).not.toBeNull();
  });

  it('la tarea programada (service_role) escribe; cada usuario lee solo lo suyo', async () => {
    const { error } = await admin.from('reminder_log').insert([entry(a), entry(b)]);
    expect(error).toBeNull();

    const own = await a.client.from('reminder_log').select('project_id');
    expect(own.data).toEqual([{ project_id: a.projectId }]);
    const other = await b.client.from('reminder_log').select('project_id');
    expect(other.data).toEqual([{ project_id: b.projectId }]);
  });

  it('no se puede registrar dos veces el mismo aviso', async () => {
    const { error } = await admin.from('reminder_log').insert(entry(a));
    expect(error?.code).toBe('23505'); // unique_violation
  });

  it('el proyecto tiene que ser del mismo dueño', async () => {
    const { error } = await admin
      .from('reminder_log')
      .insert({ ...entry(a, '2026-12-01'), owner_id: b.id });
    expect(error?.code).toBe('23503'); // foreign_key_violation
  });

  it('borrar el proyecto borra sus avisos', async () => {
    const { error } = await a.client.from('projects').delete().eq('id', a.projectId);
    expect(error).toBeNull();
    const { data } = await admin.from('reminder_log').select('id').eq('owner_id', a.id);
    expect(data).toEqual([]);
  });
});

describe('tarea diaria (runReminderJob)', () => {
  const today = todayIn();
  const inDays = (n: number) =>
    toISODate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + n));
  let c: User;
  let off: User;
  const run = () =>
    runReminderJob({
      admin,
      send: sendEmail,
      today,
      siteUrl: 'https://tallerfreelance.com',
      userIds: [c.id, off.id],
    });

  beforeAll(async () => {
    c = await newUser();
    off = await newUser();
    // c: activados, 7 días; una entrega en 2 días y un dominio fuera de la ventana.
    await admin.from('profiles').update({ reminders_enabled: true }).eq('id', c.id);
    await admin
      .from('projects')
      .update({ name: 'Colegio Monteazul', delivery_date: inDays(2), domain_expires: inDays(20) })
      .eq('id', c.projectId);
    // off: desactivados (por defecto), con una entrega mañana.
    await admin
      .from('projects')
      .update({ delivery_date: inDays(1) })
      .eq('id', off.projectId);
  });

  beforeEach(() => {
    mail.sent = [];
    mail.fail = false;
  });

  it('si el envío falla, no anota nada y lo cuenta como fallido', async () => {
    mail.fail = true;
    expect(await run()).toEqual({ users: 1, sent: 0, failed: 1 });
    const { data } = await admin.from('reminder_log').select('id').eq('owner_id', c.id);
    expect(data).toEqual([]);
  });

  it('escribe solo a quien los activó, con lo que vence dentro de su anticipación', async () => {
    expect(await run()).toEqual({ users: 1, sent: 1, failed: 0 });
    expect(mail.sent).toHaveLength(1);
    expect(mail.sent[0]).toMatchObject({
      to: c.email,
      subject: expect.stringMatching(
        /^Entrega de Colegio Monteazul: se entrega el .* \(en 2 días\)$/,
      ),
    });
    const { data } = await admin.from('reminder_log').select('kind, due_on').eq('owner_id', c.id);
    expect(data).toEqual([{ kind: 'entrega', due_on: inDays(2) }]);
  });

  it('al día siguiente no repite el mismo aviso', async () => {
    expect(await run()).toEqual({ users: 1, sent: 0, failed: 0 });
    expect(mail.sent).toEqual([]);
  });
});

describe('correo de prueba (sendTestReminder)', () => {
  beforeEach(() => {
    mail.sent = [];
    mail.fail = false;
  });

  it('se envía al correo de la sesión y no toca reminder_log', async () => {
    session.client = b.client;
    const logOf = async () =>
      (await admin.from('reminder_log').select('id').eq('owner_id', b.id)).data;
    const before = await logOf();
    expect(await sendTestReminder()).toEqual({ ok: true, data: undefined });
    expect(mail.sent).toEqual([
      expect.objectContaining({ to: b.email, subject: expect.stringMatching(/^\[Prueba\]/) }),
    ]);
    expect(await logOf()).toEqual(before);
  });

  it('como máximo 3 por día', async () => {
    session.client = b.client;
    expect((await sendTestReminder()).ok).toBe(true);
    expect((await sendTestReminder()).ok).toBe(true);
    expect(await sendTestReminder()).toMatchObject({
      ok: false,
      error: 'Ya enviaste 3 correos de prueba hoy. Vuelve a intentarlo mañana.',
    });
    expect(mail.sent).toHaveLength(2);
  });

  it('el usuario no puede leer ni borrar su registro de pruebas (el límite no se salta)', async () => {
    const read = await b.client.from('reminder_test_sends').select('id');
    expect(read.data ?? []).toEqual([]);
    await b.client.from('reminder_test_sends').delete().eq('owner_id', b.id);
    const { count } = await admin
      .from('reminder_test_sends')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', b.id);
    expect(count).toBe(3);
  });

  it('si el envío falla, no cuenta para el límite', async () => {
    session.client = a.client;
    mail.fail = true;
    expect(await sendTestReminder()).toMatchObject({ ok: false });
    const { count } = await admin
      .from('reminder_test_sends')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', a.id);
    expect(count).toBe(0);
  });
});
