import { randomBytes, randomUUID } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

// Credenciales cifradas de punta a punta (T17a): Server Actions reales, base real y
// una clave de prueba aleatoria (nunca la de .env.local).

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

const { addCredential, deleteCredential, revealCredential } =
  await import('@/app/(app)/proyectos/[id]/actions');

type User = { id: string; client: SupabaseClient<Database> };
const createdUsers: string[] = [];
const SECRET = 'demo-medusa-admin-2026 ñ';

async function newUser(): Promise<User> {
  const email = `cred-${randomUUID()}@rls.test`;
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

async function newProject(user: User, code: string) {
  const { data, error } = await user.client
    .from('projects')
    .insert({ code, name: code, client: 'X', type: 'otro' })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

const as = (user: User) => {
  session.client = user.client;
};

let a: User;
let b: User;
let projectA: string;
let otherProjectA: string;
let credentialId: string;

beforeAll(async () => {
  vi.stubEnv('CREDENTIALS_KEY', randomBytes(32).toString('base64'));
  vi.stubEnv('CREDENTIALS_KEY_VERSION', '1');
  a = await newUser();
  b = await newUser();
  projectA = await newProject(a, 'CRED-1');
  otherProjectA = await newProject(a, 'CRED-2');

  as(a);
  const added = await addCredential({
    projectId: projectA,
    label: 'Medusa Admin',
    username: 'admin',
    url: 'admin.polerastudio.pe',
    secret: SECRET,
  });
  if (!added.ok) throw new Error(added.error);
  credentialId = added.data.id;
});

afterAll(async () => {
  vi.unstubAllEnvs();
  for (const id of createdUsers) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) throw error;
  }
});

describe('addCredential', () => {
  it('en la base solo queda el cifrado (con IV de 12 y tag de 16 bytes)', async () => {
    const { data } = await admin.from('credentials').select('*').eq('id', credentialId).single();
    expect(data).toMatchObject({
      label: 'Medusa Admin',
      username: 'admin',
      key_version: 1,
      owner_id: a.id,
    });
    const raw = JSON.stringify(data);
    expect(raw).not.toContain('demo-medusa');
    expect(Buffer.from(data!.secret_ciphertext.slice(2), 'hex').toString('utf8')).not.toContain(
      'demo',
    );
    expect(data!.secret_iv).toMatch(/^\\x[0-9a-f]{24}$/);
    expect(data!.secret_tag).toMatch(/^\\x[0-9a-f]{32}$/);
  });

  it('no deja agregar una credencial en un proyecto ajeno', async () => {
    as(b);
    const result = await addCredential({ projectId: projectA, label: 'Robada', secret: 'x' });
    expect(result.ok).toBe(false);
  });
});

describe('revealCredential', () => {
  it('el dueño recupera el secreto exacto', async () => {
    as(a);
    await expect(revealCredential({ projectId: projectA, credentialId })).resolves.toEqual({
      ok: true,
      data: { secret: SECRET },
    });
  });

  it('otro usuario no puede revelarlo (RLS)', async () => {
    as(b);
    await expect(revealCredential({ projectId: projectA, credentialId })).resolves.toEqual({
      ok: false,
      error: 'No encontramos esa credencial.',
    });
  });

  it('si se manipula el cifrado en la base, el descifrado falla', async () => {
    as(a);
    const added = await addCredential({
      projectId: projectA,
      label: 'Para manipular',
      secret: 'original',
    });
    const id = added.ok ? added.data.id : '';
    const { data } = await admin
      .from('credentials')
      .select('secret_ciphertext')
      .eq('id', id)
      .single();
    const tampered = Buffer.from(data!.secret_ciphertext.slice(2), 'hex');
    tampered[0] = tampered[0]! ^ 0xff;
    await admin
      .from('credentials')
      .update({ secret_ciphertext: `\\x${tampered.toString('hex')}` })
      .eq('id', id);

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(revealCredential({ projectId: projectA, credentialId: id })).resolves.toEqual({
      ok: false,
      error: 'No pudimos descifrar esta credencial.',
    });
    // El log solo lleva el id: nunca el secreto ni el cifrado.
    expect(spy).toHaveBeenCalledWith('No se pudo descifrar la credencial', id);
    spy.mockRestore();
  });

  it('copiar el cifrado a otro proyecto no sirve (datos asociados)', async () => {
    as(a);
    const { data: source } = await admin
      .from('credentials')
      .select('secret_ciphertext, secret_iv, secret_tag')
      .eq('id', credentialId)
      .single();
    const { data: copy } = await admin
      .from('credentials')
      .insert({ project_id: otherProjectA, owner_id: a.id, label: 'Copia', ...source! })
      .select('id')
      .single();

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(
      revealCredential({ projectId: otherProjectA, credentialId: copy!.id }),
    ).resolves.toMatchObject({ ok: false });
    spy.mockRestore();
  });

  it('con otra clave en el servidor no se puede descifrar', async () => {
    as(a);
    vi.stubEnv('CREDENTIALS_KEY', randomBytes(32).toString('base64'));
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(revealCredential({ projectId: projectA, credentialId })).resolves.toMatchObject({
      ok: false,
    });
    spy.mockRestore();
  });
});

describe('deleteCredential', () => {
  it('borra la propia y no la ajena', async () => {
    as(a);
    const added = await addCredential({ projectId: projectA, label: 'Temporal', secret: 'x' });
    const id = added.ok ? added.data.id : '';

    as(b);
    await expect(deleteCredential(id)).resolves.toMatchObject({ ok: false });
    as(a);
    await expect(deleteCredential(id)).resolves.toEqual({ ok: true, data: undefined });
    const { data } = await admin.from('credentials').select('id').eq('id', id);
    expect(data).toEqual([]);
  });
});
