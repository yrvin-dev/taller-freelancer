import { randomUUID } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

// Recordatorios por correo (T30a) contra la Supabase local: preferencias en el perfil
// (migración 0006) y `reminder_log`, que el usuario solo puede leer.

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

const { saveReminders } = await import('@/app/(app)/cuenta/actions');

type User = { id: string; client: SupabaseClient<Database>; projectId: string };
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
  return { id: data.user.id, client, projectId: project.id };
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
});

afterAll(async () => {
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
