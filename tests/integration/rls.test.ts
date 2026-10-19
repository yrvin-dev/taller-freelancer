import { randomUUID } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

// RLS de punta a punta (04 T14): dos usuarios reales en la Supabase local. A no puede
// leer ni escribir nada de B, y viceversa. El cliente admin (service_role) solo se
// usa aquí para crear y borrar los usuarios de prueba.

const url = process.env.SUPABASE_TEST_URL!;
const anonKey = process.env.SUPABASE_TEST_ANON_KEY!;
const serviceKey = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY!;

type Client = SupabaseClient<Database>;
type TestUser = { id: string; client: Client };

const admin = createClient<Database>(url, serviceKey, { auth: { persistSession: false } });
const createdUsers: string[] = [];

async function newUser(name: string): Promise<TestUser> {
  const email = `${name}-${randomUUID()}@rls.test`;
  const password = `pw-${randomUUID()}`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: `Usuaria ${name}` },
  });
  if (error || !data.user) throw error ?? new Error('No se creó el usuario');
  createdUsers.push(data.user.id);

  const client = createClient<Database>(url, anonKey, { auth: { persistSession: false } });
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;
  return { id: data.user.id, client };
}

async function newProject(user: TestUser, code: string) {
  const { data, error } = await user.client
    .from('projects')
    .insert({
      code,
      name: `Proyecto ${code}`,
      client: 'Cliente',
      type: 'landing',
      budget_pen: 1000,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

let a: TestUser;
let b: TestUser;
let projectA: Awaited<ReturnType<typeof newProject>>;

beforeAll(async () => {
  a = await newUser('a');
  b = await newUser('b');
  projectA = await newProject(a, 'A-001');
  await a.client
    .from('payments')
    .insert({ project_id: projectA.id, amount_pen: 400, paid_on: '2026-10-01' });
  await a.client.from('notes').insert({ project_id: projectA.id, kind: 'nota', body: 'Nota de A' });
});

afterAll(async () => {
  // Borrar el usuario borra en cascada su perfil, proyectos, pagos y notas. Sin
  // ignorar errores: así se escondió el bug de touch_project (T14b).
  for (const id of createdUsers) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) throw error;
  }
});

describe('borrar cuenta (T14b)', () => {
  it('borrar desde la API un usuario con pagos y notas borra todo en cascada', async () => {
    const c = await newUser('c');
    const project = await newProject(c, 'C-001');
    await c.client
      .from('payments')
      .insert({ project_id: project.id, amount_pen: 100, paid_on: '2026-10-01' });
    await c.client
      .from('notes')
      .insert({ project_id: project.id, kind: 'nota', body: 'Nota de C' });

    // Supabase Auth borra con su propio rol (supabase_auth_admin): antes fallaba con
    // "permission denied for table projects" desde el trigger touch_project.
    const { error } = await admin.auth.admin.deleteUser(c.id);
    expect(error).toBeNull();
    createdUsers.splice(createdUsers.indexOf(c.id), 1);

    const left = await Promise.all([
      admin.from('profiles').select('id').eq('id', c.id),
      admin.from('projects').select('id').eq('owner_id', c.id),
      admin.from('payments').select('id').eq('owner_id', c.id),
      admin.from('notes').select('id').eq('owner_id', c.id),
    ]);
    expect(left.map((r) => r.data)).toEqual([[], [], [], []]);
  });
});

describe('profiles', () => {
  it('el trigger crea el perfil con el nombre de los metadatos', async () => {
    const { data } = await a.client.from('profiles').select('id, display_name').single();
    expect(data).toEqual({ id: a.id, display_name: 'Usuaria a' });
  });

  it('cada quien ve solo su perfil y no puede editar el ajeno', async () => {
    const { data } = await b.client.from('profiles').select('id');
    expect(data).toEqual([{ id: b.id }]);

    const { data: updated } = await b.client
      .from('profiles')
      .update({ display_name: 'Hackeado' })
      .eq('id', a.id)
      .select();
    expect(updated).toEqual([]);
  });

  it('cada quien puede editar sus preferencias (savePreferences)', async () => {
    const { data } = await a.client
      .from('profiles')
      .update({ display_name: 'A editada', base_path: 'D:\\Proyectos' })
      .eq('id', a.id)
      .select('display_name, base_path')
      .single();
    expect(data).toEqual({ display_name: 'A editada', base_path: 'D:\\Proyectos' });
  });
});

describe('projects', () => {
  it('A ve su proyecto con owner_id puesto por la base', async () => {
    const { data } = await a.client.from('projects').select('id, owner_id');
    expect(data).toEqual([{ id: projectA.id, owner_id: a.id }]);
  });

  it('B no ve los proyectos de A', async () => {
    const { data } = await b.client.from('projects').select('id').eq('id', projectA.id);
    expect(data).toEqual([]);
  });

  it('B no puede editar ni borrar el proyecto de A', async () => {
    const { data: updated } = await b.client
      .from('projects')
      .update({ name: 'Hackeado' })
      .eq('id', projectA.id)
      .select();
    expect(updated).toEqual([]);

    const { data: deleted } = await b.client
      .from('projects')
      .delete()
      .eq('id', projectA.id)
      .select();
    expect(deleted).toEqual([]);

    const { data: still } = await admin
      .from('projects')
      .select('name')
      .eq('id', projectA.id)
      .single();
    expect(still?.name).toBe('Proyecto A-001');
  });

  it('B no puede crear un proyecto a nombre de A', async () => {
    const { error } = await b.client
      .from('projects')
      .insert({ owner_id: a.id, code: 'X-1', name: 'Falso', client: 'X', type: 'otro' });
    expect(error?.code).toBe('42501'); // violación de RLS
  });

  it('B no puede pasarle su proyecto a A cambiando owner_id', async () => {
    const projectB = await newProject(b, 'B-001');
    const { error } = await b.client
      .from('projects')
      .update({ owner_id: a.id })
      .eq('id', projectB.id);
    expect(error?.code).toBe('42501');
  });

  it('updated_at se actualiza solo al editar', async () => {
    const { data } = await a.client
      .from('projects')
      .update({ status: 'revision' })
      .eq('id', projectA.id)
      .select('updated_at, created_at')
      .single();
    expect(new Date(data!.updated_at).getTime()).toBeGreaterThan(
      new Date(data!.created_at).getTime(),
    );
  });
});

describe('payments, notes y credentials', () => {
  it('B no ve los pagos ni las notas de A', async () => {
    const payments = await b.client.from('payments').select('id').eq('project_id', projectA.id);
    const notes = await b.client.from('notes').select('id').eq('project_id', projectA.id);
    expect(payments.data).toEqual([]);
    expect(notes.data).toEqual([]);
  });

  it('B no puede colgar un pago en el proyecto de A (FK compuesta)', async () => {
    const { error } = await b.client
      .from('payments')
      .insert({ project_id: projectA.id, amount_pen: 1, paid_on: '2026-10-01' });
    expect(error).not.toBeNull();
  });

  it('B no puede crear una nota a nombre de A', async () => {
    const { error } = await b.client
      .from('notes')
      .insert({ project_id: projectA.id, owner_id: a.id, kind: 'nota', body: 'x' });
    expect(error?.code).toBe('42501');
  });

  it('B no puede colgar una credencial en el proyecto de A', async () => {
    const { error } = await b.client.from('credentials').insert({
      project_id: projectA.id,
      label: 'Robada',
      secret_ciphertext: '\\x00',
      secret_iv: '\\x000000000000000000000000',
      secret_tag: '\\x00000000000000000000000000000000',
    });
    expect(error).not.toBeNull();
  });
});

describe('project_summary (security_invoker)', () => {
  it('A ve su saldo y B no ve nada de A', async () => {
    const own = await a.client
      .from('project_summary')
      .select('paid_pen, balance_pen')
      .eq('id', projectA.id)
      .single();
    expect(own.data).toEqual({ paid_pen: 400, balance_pen: 600 });

    const other = await b.client.from('project_summary').select('id').eq('id', projectA.id);
    expect(other.data).toEqual([]);
  });
});

describe('anónimo', () => {
  it('sin sesión no lee nada', async () => {
    const anon = createClient<Database>(url, anonKey, { auth: { persistSession: false } });
    const { data, error } = await anon.from('projects').select('id');
    expect(data ?? []).toEqual([]);
    expect(error?.code).toBe('42501'); // sin permisos de tabla para anon
  });
});
