import { randomUUID } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { PROJECT_SELECT, toProject } from '@/lib/data/project-mapper';

// La consulta y el mapeo de src/lib/data/projects.ts contra la base real (T16a).

const url = process.env.SUPABASE_TEST_URL!;
const anonKey = process.env.SUPABASE_TEST_ANON_KEY!;
const admin = createClient<Database>(url, process.env.SUPABASE_TEST_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});
const createdUsers: string[] = [];

async function signedIn(): Promise<{ id: string; client: SupabaseClient<Database> }> {
  const email = `data-${randomUUID()}@rls.test`;
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
  return { id: data.user.id, client };
}

let owner: Awaited<ReturnType<typeof signedIn>>;
let other: Awaited<ReturnType<typeof signedIn>>;
let projectId: string;

beforeAll(async () => {
  owner = await signedIn();
  other = await signedIn();

  const { data: project, error } = await owner.client
    .from('projects')
    .insert({
      code: 'D-001',
      name: 'Proyecto con datos',
      client: 'Cliente',
      type: 'ecommerce',
      budget_pen: 7800,
      stack_frontend: ['Next.js', 'Tailwind'],
      link_deploy: 'polerastudio.pe',
      thumbnail_path: '/mock/thumbs/plv.webp',
    })
    .select('id')
    .single();
  if (error) throw error;
  projectId = project.id;

  await owner.client.from('payments').insert([
    { project_id: projectId, amount_pen: 1000, paid_on: '2026-10-02', concept: 'Segundo' },
    { project_id: projectId, amount_pen: 2900, paid_on: '2026-09-15', concept: 'Adelanto' },
  ]);
  await owner.client.from('notes').insert([
    { project_id: projectId, kind: 'pedido', body: 'Antigua', noted_on: '2026-09-01' },
    { project_id: projectId, kind: 'cambio', body: 'Reciente', noted_on: '2026-10-10' },
  ]);
  // Solo para la prueba: una credencial con un "secreto" cifrado de mentira.
  await owner.client.from('credentials').insert({
    project_id: projectId,
    label: 'Medusa Admin',
    username: 'admin',
    secret_ciphertext: '\\xdeadbeef',
    secret_iv: '\\x000000000000000000000000',
    secret_tag: '\\x00000000000000000000000000000000',
  });
});

afterAll(async () => {
  for (const id of createdUsers) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) throw error;
  }
});

describe('PROJECT_SELECT + toProject', () => {
  it('trae el proyecto con pagos, notas y credenciales, y lo mapea a Project', async () => {
    const { data, error } = await owner.client
      .from('projects')
      .select(PROJECT_SELECT)
      .eq('id', projectId)
      .single();
    expect(error).toBeNull();
    const project = toProject(data!);

    expect(project).toMatchObject({
      id: projectId,
      code: 'D-001',
      type: 'ecommerce',
      budgetPen: 7800,
      stack: { frontend: ['Next.js', 'Tailwind'], backend: [], db: [], hosting: [] },
      links: { deploy: 'polerastudio.pe' },
      thumbnailUrl: '/mock/thumbs/plv.webp',
    });
    expect(project.payments.map((p) => [p.paidOn, p.amountPen])).toEqual([
      ['2026-09-15', 2900],
      ['2026-10-02', 1000],
    ]);
    expect(project.notes.map((n) => n.body)).toEqual(['Reciente', 'Antigua']);
    expect(project.credentials).toEqual([
      { id: expect.any(String), label: 'Medusa Admin', username: 'admin', url: null },
    ]);
  });

  it('las credenciales nunca traen las columnas del secreto', async () => {
    const { data } = await owner.client
      .from('projects')
      .select(PROJECT_SELECT)
      .eq('id', projectId)
      .single();
    const credential = data!.credentials[0] as Record<string, unknown>;
    expect(Object.keys(credential).sort()).toEqual(['id', 'label', 'url', 'username']);
    expect(JSON.stringify(data)).not.toContain('deadbeef');
  });

  it('otro usuario no ve el proyecto ni sus pagos embebidos', async () => {
    const { data } = await other.client.from('projects').select(PROJECT_SELECT).eq('id', projectId);
    expect(data).toEqual([]);
  });
});

describe('project_exists (403 vs 404)', () => {
  it('dice que existe un proyecto ajeno sin devolver sus datos', async () => {
    const { data } = await other.client.rpc('project_exists', { p_id: projectId });
    expect(data).toBe(true);
  });

  it('y que no existe un id cualquiera', async () => {
    const { data } = await other.client.rpc('project_exists', { p_id: randomUUID() });
    expect(data).toBe(false);
  });

  it('sin sesión no se puede llamar', async () => {
    const anon = createClient<Database>(url, anonKey, { auth: { persistSession: false } });
    const { error } = await anon.rpc('project_exists', { p_id: projectId });
    expect(error?.code).toBe('42501');
  });
});
